import type Phaser from "phaser";
import type { E2EBackupState } from "../../game/e2eBridge";
import type { Profile, ProfileV2 } from "../../types";
import {
  backupFilename,
  downloadBackup,
  pickBackupFile,
  reloadApp,
  saveDiagnostics,
} from "../../utils/backupFile";
import { createBackup, type ImportMode, readBackup } from "../../utils/backupFormat";
import { NO_CRASHES } from "../../utils/diagnostics";
import { applyImport, exportSave, getProfiles, SCHEMA_VERSION } from "../../utils/storage";
import { textStyle } from "../../utils/typography";
import {
  BACKDROP_COLOR,
  createModalButton,
  createRow,
  DANGER_COLOR,
  DISABLED_COLOR,
  OUTLINE_COLOR,
  OVERLAY_ALPHA,
  PANEL_COLOR,
  PANEL_HEIGHT,
  PANEL_WIDTH,
  PRIMARY_COLOR,
} from "./primitives";

/** Page two's three actions, in drawing order. */
const EXPORT_LABEL = "Save a backup";
const RESTORE_LABEL = "Restore from a file";
const DIAGNOSTICS_LABEL = "Save diagnostics";

/** What the result line says when the picker came back empty. */
const NOTHING_RESTORED = "Nothing was restored.";

/**
 * The one line on the merge-or-replace card that says what each button does.
 * A parent choosing between two words deserves the difference in a sentence.
 */
const CHOICE_NOTE =
  "Merge keeps what is on this device and adds anything newer from the file. Replace overwrites this device's save.";

/** Width the result line and the choice note wrap to, inside the 480px panel. */
const RESULT_WRAP_WIDTH_LOCAL = 420;

/**
 * How long the result line holds before a completed import starts the app
 * again. Long enough for a parent to read one sentence, short enough that
 * nothing feels stuck; the reload is the only way every scene sees the new
 * bytes, so it cannot be dropped, only paused.
 */
const IMPORT_RELOAD_DELAY_MS = 900;

/** Every earned sticker across every profile: what a backup carries. */
function earnedStickerTotal(profiles: readonly Profile[]): number {
  return profiles.reduce(
    (total, profile) =>
      total + Object.values(profile.stickers).filter((sticker) => sticker.earned).length,
    0,
  );
}

/**
 * One sentence saying what an import did, in numbers (FR-10).
 *
 * A merge reports what it added — the point of merging two devices — and a
 * replace reports what the device now holds, because nothing was added to what
 * was there. Both counts are pluralised, and neither sentence says more than
 * the save can show.
 */
function importSummary(mode: ImportMode, profiles: number, stickers: number): string {
  const profileCount = `${profiles} ${profiles === 1 ? "profile" : "profiles"}`;
  const stickerCount = `${stickers} ${stickers === 1 ? "sticker" : "stickers"}`;
  return mode === "merge"
    ? `Merged ${profileCount} and ${stickerCount} into this one.`
    : `Restored ${profileCount} and ${stickerCount}.`;
}

export interface BackupPanelDeps {
  scene: Phaser.Scene;
  /** Bucket the current page's objects go into, shared with the parent panel. */
  pageObjects: Phaser.GameObjects.GameObject[];
}

/**
 * Page two of the parental panel: export, restore, diagnostics, and the
 * merge-or-replace card. The parent panel owns page switching and the chrome;
 * this helper owns everything that only exists while page two is up, so a page
 * switch destroys it all and nothing interactive leaks onto the other page.
 */
export class BackupPanel {
  private readonly scene: Phaser.Scene;
  private readonly pageObjects: Phaser.GameObjects.GameObject[];
  private readonly choiceObjects: Phaser.GameObjects.GameObject[] = [];
  /** The result line while page two is up, or null while page one is. */
  private resultText: Phaser.GameObjects.Text | null = null;
  private result = "";
  private resultColor = DISABLED_COLOR;
  private rows: Array<{ id: "export" | "restore" | "diagnostics"; x: number; y: number }> = [];
  private choices: Array<{ id: "merge" | "replace"; x: number; y: number }> = [];
  private busy = false;

  constructor(deps: BackupPanelDeps) {
    this.scene = deps.scene;
    this.pageObjects = deps.pageObjects;
  }

  /** Builds the rows and the result line for the current page-two layout. */
  build(centerX: number, rowY: (index: number) => number): void {
    createRow(this.scene, centerX, rowY(0), this.pageObjects, EXPORT_LABEL, PRIMARY_COLOR, () =>
      this.saveBackup(),
    );
    createRow(
      this.scene,
      centerX,
      rowY(1),
      this.pageObjects,
      RESTORE_LABEL,
      PRIMARY_COLOR,
      // The handler is async, and the tap is not: the promise's own rejection
      // would escape into Phaser's update loop, so it is awaited here instead.
      () => void this.restoreBackup(),
    );
    // FR-8: the diagnostics row sits directly under the restore row, and the
    // line that reports what happened sits under it - one pitch clear of the
    // row's card (471-539), so a wrapped "Saved diagnostics-....txt" cannot
    // clip it. Never disabled: a parent who has had no crash should be able to
    // ask and be told so, not find a dead control.
    createRow(
      this.scene,
      centerX,
      rowY(2),
      this.pageObjects,
      DIAGNOSTICS_LABEL,
      PRIMARY_COLOR,
      () => this.saveDiagnosticsFile(),
    );
    // The rows are centred on the layout arguments, so those are the points a
    // finger lands on - published rather than re-derived by the suite.
    this.rows = [
      { id: "export", x: centerX, y: rowY(0) },
      { id: "restore", x: centerX, y: rowY(1) },
      { id: "diagnostics", x: centerX, y: rowY(2) },
    ];
    const result = this.scene.add
      .text(
        centerX,
        rowY(4),
        this.result,
        textStyle({
          align: "center",
          color: this.resultColor,
          fontSize: "24px",
          wordWrap: { width: RESULT_WRAP_WIDTH_LOCAL },
        }),
      )
      .setOrigin(0.5);
    this.resultText = result;
    this.pageObjects.push(result);
  }

  /** Clears page-two state before the parent destroys the page objects. */
  clear(): void {
    this.resultText = null;
    this.rows = [];
  }

  /** Destroys the choice card, if one is open. */
  destroyChoice(): void {
    this.closeChoice();
  }

  /** Live page-two state for the browser suite. */
  state(): Pick<E2EBackupState, "backupRows" | "backupResult" | "choices"> {
    return {
      backupRows: this.rows.map((row) => ({ id: row.id, point: { x: row.x, y: row.y } })),
      backupResult: this.result,
      choices: this.choices.map((choice) => ({
        id: choice.id,
        point: { x: choice.x, y: choice.y },
      })),
    };
  }

  /**
   * Writes the whole save to a file a parent can keep.
   *
   * `exportSave` reads the store, never writes it, so this works even while the
   * device cannot save — which is exactly when a backup matters most.
   */
  private saveBackup(): void {
    const now = new Date();
    const { json } = createBackup(exportSave(), {
      appVersion: __APP_VERSION__,
      now,
      schemaVersion: SCHEMA_VERSION,
    });
    const filename = backupFilename(now);
    downloadBackup(json, filename);
    this.showResult(`Saved ${filename}`, PRIMARY_COLOR);
  }

  /**
   * Writes the crash log to a file, or says there is nothing to write.
   *
   * The sentence is the panel's own: `Saved <filename>` in the colour the
   * export uses, or the report module's `NO_CRASHES` sentence — the same words
   * the downloaded file would carry, so the panel and the file cannot disagree
   * about what "nothing recorded" says.
   */
  private saveDiagnosticsFile(): void {
    const result = saveDiagnostics();
    if (result.saved) {
      this.showResult(`Saved ${result.filename}`, PRIMARY_COLOR);
    } else {
      this.showResult(NO_CRASHES);
    }
  }

  /**
   * Opens the picker, verifies what came back, then asks how to apply it.
   *
   * Nothing is written before a parent chooses: a cancelled picker, an
   * unreadable file and a damaged checksum all end on the result line with the
   * save untouched. `busy` keeps a second tap from opening a second picker.
   */
  private async restoreBackup(): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    try {
      const picked = await pickBackupFile();
      if (picked === null) {
        this.showResult(NOTHING_RESTORED);
        return;
      }
      const read = readBackup(picked.text, { schemaVersion: SCHEMA_VERSION });
      if (!read.ok) {
        // The sentence, never the code: a parent reads why, not a diagnostic.
        this.showResult(read.refusal.message);
        return;
      }
      this.showChoice(picked.name, read.envelope.payload);
    } finally {
      this.busy = false;
    }
  }

  /** Shows the file's name and the two ways to apply it. */
  private showChoice(name: string, payload: ProfileV2): void {
    this.closeChoice();
    const { width, height } = this.scene.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2;
    const backdrop = this.scene.add
      .rectangle(centerX, centerY, width, height, BACKDROP_COLOR, OVERLAY_ALPHA)
      .setInteractive();
    backdrop.on("pointerdown", () => this.closeChoice());
    this.choiceObjects.push(backdrop);
    this.choiceObjects.push(
      this.scene.add
        .rectangle(centerX, centerY, PANEL_WIDTH, PANEL_HEIGHT, PANEL_COLOR)
        .setStrokeStyle(4, OUTLINE_COLOR),
    );
    this.choiceObjects.push(
      this.scene.add
        .text(
          centerX,
          centerY - 170,
          name,
          textStyle({
            align: "center",
            color: "#2d3748",
            fontSize: "24px",
            wordWrap: { width: RESULT_WRAP_WIDTH_LOCAL },
          }),
        )
        .setOrigin(0.5),
    );
    this.choiceObjects.push(
      this.scene.add
        .text(
          centerX,
          centerY - 80,
          CHOICE_NOTE,
          textStyle({
            align: "center",
            color: "#2d3748",
            fontSize: "24px",
            wordWrap: { width: RESULT_WRAP_WIDTH_LOCAL },
          }),
        )
        .setOrigin(0.5),
    );
    this.choiceObjects.push(
      createModalButton(
        this.scene,
        centerX,
        centerY + 40,
        this.choiceObjects,
        "Merge",
        PRIMARY_COLOR,
        () => this.chooseImport("merge", payload),
      ),
    );
    this.choiceObjects.push(
      createModalButton(
        this.scene,
        centerX,
        centerY + 120,
        this.choiceObjects,
        "Replace",
        DANGER_COLOR,
        () => this.chooseImport("replace", payload),
      ),
    );
    // Like the rows: the buttons are centred on the layout arguments, so those
    // are the points a finger lands on - published rather than re-derived.
    this.choices = [
      { id: "merge", x: centerX, y: centerY + 40 },
      { id: "replace", x: centerX, y: centerY + 120 },
    ];
  }

  /** Closes the choice card without writing anything. */
  private closeChoice(): void {
    for (const object of this.choiceObjects) object.destroy();
    this.choiceObjects.length = 0;
    this.choices = [];
  }

  /**
   * Applies the file in the chosen mode: a refusal lands on the result line and
   * leaves the app running; a completed import says in numbers what changed,
   * then starts the app again from a clean boot so no scene shows a mixture of
   * two saves.
   *
   * The counts are read from the save itself before and after the write, so a
   * merge that added nothing says zero rather than repeating the file's totals.
   * The reload is delayed, not immediate: it replaces the page, and the line has
   * to be readable first.
   */
  private chooseImport(mode: ImportMode, payload: ProfileV2): void {
    const before = getProfiles();
    const beforeStickers = earnedStickerTotal(before);
    const applied = applyImport(mode, payload);
    this.closeChoice();
    if (!applied.ok) {
      this.showResult(applied.refusal.message);
      return;
    }
    const after = getProfiles();
    const stickersAfter = earnedStickerTotal(after);
    // A merge is scored by what it added; a replace by what the device holds.
    const addedProfiles = mode === "merge" ? after.length - before.length : after.length;
    const addedStickers = mode === "merge" ? stickersAfter - beforeStickers : stickersAfter;
    this.showResult(importSummary(mode, addedProfiles, addedStickers), PRIMARY_COLOR);
    this.scene.time.delayedCall(IMPORT_RELOAD_DELAY_MS, reloadApp);
  }

  /** Puts one sentence on the result line, and remembers it for the next build. */
  private showResult(message: string, color: string = DISABLED_COLOR): void {
    this.result = message;
    this.resultColor = color;
    this.resultText?.setText(message);
    this.resultText?.setColor(color);
  }
}
