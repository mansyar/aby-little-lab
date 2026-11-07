import type Phaser from "phaser";
import { AudioManager } from "../audio/AudioManager";
import type { E2EBackupState, E2EProgressState, E2ESettingsToggle } from "../game/e2eBridge";
import type { Profile, ProfileV2 } from "../types";
import { backupFilename, downloadBackup, pickBackupFile, reloadApp } from "../utils/backupFile";
import { createBackup, type ImportMode, readBackup } from "../utils/backupFormat";
import { attachPressFeedback } from "../utils/pressFeedback";
import { getInstallPromptTracker, type InstallTracker } from "../utils/pwaInstall";
import {
  applyImport,
  exportSave,
  getProfiles,
  getSettings,
  isPersistenceDegraded,
  SCHEMA_VERSION,
  updateSettings,
} from "../utils/storage";
import { textStyle } from "../utils/typography";
import { allowPinchZoom, restorePinchZoom } from "../utils/viewportZoom";
import { InstallRow } from "./settings/InstallRow";
import { ProfilesOverlay } from "./settings/ProfilesOverlay";
import { ProgressOverlay } from "./settings/ProgressOverlay";
import {
  addRowCard,
  BACKDROP_ALPHA,
  BACKDROP_COLOR,
  centredHitArea,
  createModalButton,
  createRow,
  DANGER_COLOR,
  DISABLED_COLOR,
  ENABLED_COLOR,
  OUTLINE_COLOR,
  OVERLAY_ALPHA,
  PANEL_COLOR,
  PANEL_HEIGHT,
  PANEL_WIDTH,
  PRIMARY_COLOR,
  ROW_CARD_HEIGHT,
  ROW_HIT_WIDTH,
  ROW_PITCH,
  TOGGLE_KNOB_COLOR,
  TOGGLE_KNOB_OFFSET,
  TOGGLE_KNOB_SIZE,
  TOGGLE_TRACK_HEIGHT,
  TOGGLE_TRACK_OFF_COLOR,
  TOGGLE_TRACK_ON_COLOR,
  TOGGLE_TRACK_WIDTH,
} from "./settings/primitives";
import { ResetModal } from "./settings/ResetModal";
import { VoiceRow } from "./settings/VoiceRow";

/**
 * Y offset of the first main-panel row from the panel center. The eight rows
 * then step by `ROW_PITCH`, so the top row clears the title and version footer
 * while the bottom card still ends inside the 760px panel.
 */
const FIRST_ROW_OFFSET = -47;

/**
 * Y offset of the degraded notice from the panel center. The band from the
 * panel's top edge (-380) down to the title (-105) is empty, so the notice
 * sits in it at -150: clear of the panel edge above and with a comfortable
 * gap before the title below, and nothing already on the panel moves.
 */
const NOTICE_OFFSET = -150;

/** What the notice says: the fact itself, in the panel's own quiet voice. */
const NOTICE_LABEL = "Progress can't be saved on this device";

/**
 * Y offset of the page-switch card. The band from the panel's top edge (-380)
 * to the notice (-150) and the title (-105) is empty, so the switch sits in it
 * at -250: inside the panel, clear of the notice below, and nothing else moves.
 */
const SWITCH_OFFSET = -250;

/** The switch card on each page: where it leads, with a chevron saying so. */
const SWITCH_TO_BACKUP = "Backup & restore ›";
const SWITCH_TO_SETTINGS = "‹ Back to settings";

/** Page titles, both drawn by the one title element the panel already had. */
const SETTINGS_TITLE = "Settings";
const BACKUP_TITLE = "Backup";

/** Page two's two actions, in drawing order. */
const EXPORT_LABEL = "Save a backup";
const RESTORE_LABEL = "Restore from a file";

/** What the result line says when the picker came back empty. */
const NOTHING_RESTORED = "Nothing was restored.";

/**
 * The one line on the merge-or-replace card that says what each button does.
 * A parent choosing between two words deserves the difference in a sentence.
 */
const CHOICE_NOTE =
  "Merge keeps what is on this device and adds anything newer from the file. Replace overwrites this device's save.";

/** Width the result line and the choice note wrap to, inside the 480px panel. */
const RESULT_WRAP_WIDTH = 420;

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

/** Renders the parental settings controls above the HubScene. */
export class SettingsPanel {
  private readonly scene: Phaser.Scene;
  private readonly objects: Phaser.GameObjects.GameObject[] = [];
  /**
   * Everything the page on screen owns. Destroyed and rebuilt on every switch,
   * so no row from the other page keeps a live hit band over the canvas.
   */
  private readonly pageObjects: Phaser.GameObjects.GameObject[] = [];
  private readonly overlayObjects: Phaser.GameObjects.GameObject[] = [];
  private readonly modalObjects: Phaser.GameObjects.GameObject[] = [];
  /** The merge-or-replace card, and only it: destroyed by closing or choosing. */
  private readonly choiceObjects: Phaser.GameObjects.GameObject[] = [];
  private readonly progressOverlay: ProgressOverlay;
  private readonly profilesOverlay: ProfilesOverlay;
  private readonly installRow: InstallRow;
  private readonly voiceRow: VoiceRow;
  private readonly resetModal: ResetModal;
  private readonly installTracker: InstallTracker;
  private readonly onProgressReset?: () => void;
  /** The title, relabelled rather than rebuilt, so the header never jumps. */
  private readonly title: Phaser.GameObjects.Text;
  /**
   * The explicit ✕, kept so every page rebuild can raise it above the rows it
   * shares a corner with.
   */
  private readonly closeButton: Phaser.GameObjects.Text;
  /** The page switch's label, relabelled on each switch. */
  private readonly switchLabel: Phaser.GameObjects.Text;
  /** The switch card's centre, captured from the layout arguments. */
  private readonly switchPoint: { x: number; y: number };
  /** Which settings page is on screen. */
  private page: 0 | 1 = 0;
  /** The result line's text, kept so the bridge can read it before it is drawn. */
  private backupResult = "";
  /** The colour that text is drawn in, so a rebuild does not lose it. */
  private backupResultColor = DISABLED_COLOR;
  /** The result line while page two is up, or null while page one is. */
  private backupResultText: Phaser.GameObjects.Text | null = null;
  /** Page two's tappable rows, with the point their band answers to. */
  private backupRows: Array<{ id: "export" | "restore"; x: number; y: number }> = [];
  /**
   * The choice card's two buttons, with the point each answers to, captured as
   * the card is built. Published so the browser suite taps the buttons' own
   * layout instead of copying two coordinates; emptied when the card closes.
   */
  private choices: Array<{ id: "merge" | "replace"; x: number; y: number }> = [];
  /**
   * Set while a file picker is open. A second tap on "Restore from a file"
   * while the native dialog is up would open a second picker, so the tap that
   * arrives during one is ignored and the flag is cleared in a `finally`.
   */
  private busy = false;
  /**
   * The toggle rows, with the tap band they answer to and a live read of their
   * state. The switch flips a closure variable, not an object property, so the
   * value has to be asked for through this accessor rather than inspected.
   */
  private readonly toggles: Array<{
    id: string;
    x: number;
    y: number;
    value: () => boolean;
  }> = [];
  /** Set by {@link destroy}: the panel's own liveness, independent of the scene. */
  private destroyed = false;
  /**
   * The "Progress" row's centre, captured when the row is created. Published so
   * the browser suite taps the row's layout rather than a copied coordinate.
   */
  private progressRowPoint: { x: number; y: number } | null = null;
  /**
   * Whether the device could not persist when this panel was built. A snapshot:
   * the notice states what was true at open time, and nothing in the panel
   * polls or subscribes to the storage layer.
   */
  private readonly persistenceDegraded: boolean;

  /** Refreshes the voice chip when the platform loads voices late. */
  private readonly voiceChangedHandler = (): void => {
    this.voiceRow.voiceChanged();
  };

  /**
   * Creates the settings panel using the current persisted audio settings.
   * @param installTracker - Install tracker to read; defaults to the
   *   app-lifetime tracker that boot started, because the install event fires
   *   once per page load and would otherwise be missed. An injected tracker
   *   wins, which is how tests pin the install state.
   * @param onProgressReset - Called after a confirmed progress reset so the
   *   parent scene can re-render anything derived from the sticker collection.
   */
  constructor(
    scene: Phaser.Scene,
    installTracker: InstallTracker = getInstallPromptTracker(),
    onProgressReset?: () => void,
  ) {
    this.scene = scene;
    this.onProgressReset = onProgressReset;
    this.profilesOverlay = new ProfilesOverlay({
      scene,
      overlayObjects: this.overlayObjects,
      modalObjects: this.modalObjects,
      onProgressReset: () => this.onProgressReset?.(),
    });
    this.installTracker = installTracker;
    this.progressOverlay = new ProgressOverlay({ scene, overlayObjects: this.overlayObjects });
    this.installRow = new InstallRow({
      scene,
      objects: this.pageObjects,
      overlayObjects: this.overlayObjects,
      installTracker: this.installTracker,
    });
    this.voiceRow = new VoiceRow({ scene, bucket: this.pageObjects });
    this.resetModal = new ResetModal({
      scene,
      objects: this.pageObjects,
      overlayObjects: this.overlayObjects,
      onProgressReset: () => this.onProgressReset?.(),
    });
    // Parents read the panel's text on phones; relax the pinch-zoom lock only
    // while the panel is open, restoring it on close.
    allowPinchZoom();
    const { width, height } = scene.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2;
    const settings = getSettings();
    // FR-5: read once, at open time. No polling and no subscription: a parent
    // sees the state of the session they are in, and a write the store accepts
    // later clears the flag for the next open rather than editing this panel.
    this.persistenceDegraded = isPersistenceDegraded();

    const backdrop = scene.add
      .rectangle(centerX, centerY, width, height, BACKDROP_COLOR, BACKDROP_ALPHA)
      .setInteractive();
    backdrop.on("pointerdown", () => this.destroy());
    this.objects.push(backdrop);
    this.objects.push(
      scene.add
        .rectangle(centerX, centerY, PANEL_WIDTH, PANEL_HEIGHT, PANEL_COLOR)
        .setStrokeStyle(4, OUTLINE_COLOR),
    );
    const title = scene.add
      .text(
        centerX,
        centerY - 105,
        SETTINGS_TITLE,
        textStyle({
          color: "#2d3748",
          fontSize: "36px",
        }),
      )
      .setOrigin(0.5);
    this.title = title;
    this.objects.push(title);
    // FR-5: one quiet line while the session cannot persist. It is deliberately
    // not interactive - the condition has not gone away, so there is nothing
    // here for a parent to dismiss and no hit area that could be tapped.
    if (this.persistenceDegraded) {
      this.objects.push(
        scene.add
          .text(
            centerX,
            centerY + NOTICE_OFFSET,
            NOTICE_LABEL,
            textStyle({
              color: DISABLED_COLOR,
              fontSize: "24px",
            }),
          )
          .setOrigin(0.5),
      );
    }
    // Explicit, glanceable close affordance (backdrop tap still works).
    const closeButton = this.scene.add
      .text(
        centerX + PANEL_WIDTH / 2 - 36,
        centerY - 105,
        "✕",
        textStyle({
          color: "#2d3748",
          fontSize: "32px",
        }),
      )
      .setOrigin(0.5);
    closeButton.setInteractive(centredHitArea(96, 96));
    closeButton.on("pointerdown", () => this.destroy());
    attachPressFeedback(closeButton);
    this.objects.push(closeButton);
    this.closeButton = closeButton;
    // The page switch lives in the empty band above the notice and the title,
    // and never moves: it is the same card on both pages, relabelled to say
    // where the next tap goes.
    const switchY = centerY + SWITCH_OFFSET;
    addRowCard(scene, centerX, switchY, this.objects);
    const switchLabel = scene.add
      .text(
        centerX,
        switchY,
        SWITCH_TO_BACKUP,
        textStyle({
          color: PRIMARY_COLOR,
          fontSize: "32px",
        }),
      )
      .setOrigin(0.5);
    switchLabel.setInteractive(centredHitArea(ROW_HIT_WIDTH, ROW_CARD_HEIGHT));
    switchLabel.on("pointerdown", () => this.flipPage());
    attachPressFeedback(switchLabel);
    this.objects.push(switchLabel);
    this.switchLabel = switchLabel;
    // Like the toggle rows: the card is centred on (x, y), so the layout
    // arguments are the point a finger lands on.
    this.switchPoint = { x: centerX, y: switchY };
    this.buildPage(settings);
    // Voices load asynchronously on some platforms; refresh the chip list.
    const synth = window.speechSynthesis;
    if (synth && typeof synth.addEventListener === "function") {
      synth.addEventListener("voiceschanged", this.voiceChangedHandler);
    }
    this.objects.push(
      scene.add
        .text(
          centerX,
          centerY - 75,
          `v${__APP_VERSION__}`,
          textStyle({
            color: DISABLED_COLOR,
            fontSize: "24px",
          }),
        )
        .setOrigin(0.5),
    );
  }

  /** Destroys the modal, the install overlay, and all display objects. */
  destroy(): void {
    this.destroyed = true;
    const synth = window.speechSynthesis;
    if (synth && typeof synth.removeEventListener === "function") {
      synth.removeEventListener("voiceschanged", this.voiceChangedHandler);
    }
    for (const object of this.choiceObjects) object.destroy();
    this.choiceObjects.length = 0;
    for (const object of this.pageObjects) object.destroy();
    this.pageObjects.length = 0;
    for (const object of this.modalObjects) object.destroy();
    this.modalObjects.length = 0;
    for (const object of this.overlayObjects) object.destroy();
    this.overlayObjects.length = 0;
    for (const object of this.objects) object.destroy();
    // The tracker belongs to the page, not to this panel: it holds the only
    // listener for an event that fires once per load, so closing Settings must
    // not stop the capture. Do not restore a destroy() call here.
    restorePinchZoom();
  }

  /**
   * Whether the panel is still on screen. Read-only, and asked of the panel
   * rather than of whoever holds it: a backdrop tap closes the panel by
   * destroying it, so a holder's reference can outlive the panel it names.
   */
  e2eOpen(): boolean {
    return !this.destroyed;
  }

  /**
   * Whether this panel was built while the device could not persist, which is
   * exactly when the notice is on screen. Published for the browser suite so a
   * journey proves the parent-facing half from state rather than pixels.
   */
  e2eDegraded(): boolean {
    return this.persistenceDegraded;
  }

  /**
   * The toggle rows with the canvas point their whole card answers to and the
   * state the child's tap would flip. Empty before creation finishes, which is
   * never observable from outside the constructor.
   */
  e2eToggles(): E2ESettingsToggle[] {
    return this.toggles.map((row) => ({
      id: row.id,
      x: row.x,
      y: row.y,
      on: row.value(),
    }));
  }

  /**
   * The second page — its page number, its switch point, its two rows and the
   * line that says what happened — as the panel is holding them right now.
   *
   * A journey moves between pages with this and taps a row by its published
   * centre, so it never copies a layout number. Every value is a live read:
   * `page` is the page on screen, `backupRows` is empty while the other page is
   * up because those rows no longer exist, and `backupResult` is the panel's
   * own memory of the last thing it told a parent.
   */
  backupState(): E2EBackupState {
    return {
      page: this.page,
      switchPage: { x: this.switchPoint.x, y: this.switchPoint.y },
      backupRows: this.backupRows.map((row) => ({
        id: row.id,
        point: { x: row.x, y: row.y },
      })),
      backupResult: this.backupResult,
      choices: this.choices.map((choice) => ({
        id: choice.id,
        point: { x: choice.x, y: choice.y },
      })),
    };
  }

  /** Switches pages, relabelling the header and the switch, and rebuilding. */
  private flipPage(): void {
    this.page = this.page === 0 ? 1 : 0;
    this.title.setText(this.page === 0 ? SETTINGS_TITLE : BACKUP_TITLE);
    this.switchLabel.setText(this.page === 0 ? SWITCH_TO_BACKUP : SWITCH_TO_SETTINGS);
    this.buildPage(getSettings());
  }

  /**
   * Destroys everything the page on screen owns and builds the current page.
   *
   * The rows are destroyed rather than hidden: an invisible row keeps its
   * interactive object, and Phaser would still route a tap over the canvas to
   * it. Nothing interactive survives a switch.
   */
  private buildPage(settings: ReturnType<typeof getSettings>): void {
    this.clearPage();
    const { width, height } = this.scene.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2;
    // One ROW_PITCH apart, which is also each row's hit band: the stack starts
    // at -47 so the top row clears the title and version footer, and the bottom
    // card ends at +379, inside the 760px panel.
    const rowY = (index: number): number => centerY + FIRST_ROW_OFFSET + index * ROW_PITCH;
    if (this.page === 0) {
      this.buildSettingsPage(settings, centerX, rowY);
    } else {
      this.buildBackupPage(centerX, rowY);
    }
    // The ✕ box shares its top-right corner with a row - page one's BGM band,
    // page two's export row - and the rows are created after the ✕, so at equal
    // depth a row would win that corner and fire the wrong control. Raising the
    // ✕ above the rows settles it, and only above the rows: the overlays open
    // later and must still cover it, which a depth above theirs would break.
    // Every page rebuilds its rows, so this runs after each page's own.
    this.scene.children.bringToTop(this.closeButton);
  }

  /** Destroys the page on screen, so nothing from it can answer a tap. */
  private clearPage(): void {
    // Before the objects go: the voice row keeps handles to its chip, preview
    // and band, and its `voiceschanged` listener outlives every page switch.
    this.voiceRow.release();
    for (const object of this.pageObjects) object.destroy();
    this.pageObjects.length = 0;
    this.toggles.length = 0;
    this.progressRowPoint = null;
    this.backupRows = [];
    this.backupResultText = null;
  }

  /** Page one: the eight settings rows, at the numbers AC-9 pins. */
  private buildSettingsPage(
    settings: ReturnType<typeof getSettings>,
    centerX: number,
    rowY: (index: number) => number,
  ): void {
    const toggleAdaptive = (next: boolean): void => {
      updateSettings({ adaptiveDifficulty: next });
    };
    this.createToggle(centerX, rowY(0), "bgm", "BGM", settings.bgmEnabled);
    this.createToggle(centerX, rowY(1), "sfx", "SFX", settings.sfxEnabled);
    this.createToggle(
      centerX,
      rowY(2),
      "adaptive",
      "Adaptive",
      settings.adaptiveDifficulty,
      toggleAdaptive,
    );
    this.createProfilesRow(centerX, rowY(3));
    this.createProgressRow(centerX, rowY(4));
    this.resetModal.createRow(centerX, rowY(5));
    this.installRow.create(centerX, rowY(6));
    this.voiceRow.create(centerX, rowY(7));
  }

  /** Page two: save a backup, restore one, and the line saying what happened. */
  private buildBackupPage(centerX: number, rowY: (index: number) => number): void {
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
    // The rows are centred on the layout arguments, so those are the points a
    // finger lands on - published rather than re-derived by the suite.
    this.backupRows = [
      { id: "export", x: centerX, y: rowY(0) },
      { id: "restore", x: centerX, y: rowY(1) },
    ];
    const result = this.scene.add
      .text(
        centerX,
        rowY(2),
        this.backupResult,
        textStyle({
          align: "center",
          color: this.backupResultColor,
          fontSize: "24px",
          wordWrap: { width: RESULT_WRAP_WIDTH },
        }),
      )
      .setOrigin(0.5);
    this.backupResultText = result;
    this.pageObjects.push(result);
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
    this.showBackupResult(`Saved ${filename}`, PRIMARY_COLOR);
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
        this.showBackupResult(NOTHING_RESTORED);
        return;
      }
      const read = readBackup(picked.text, { schemaVersion: SCHEMA_VERSION });
      if (!read.ok) {
        // The sentence, never the code: a parent reads why, not a diagnostic.
        this.showBackupResult(read.refusal.message);
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
            wordWrap: { width: RESULT_WRAP_WIDTH },
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
            wordWrap: { width: RESULT_WRAP_WIDTH },
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
      this.showBackupResult(applied.refusal.message);
      return;
    }
    const after = getProfiles();
    const stickersAfter = earnedStickerTotal(after);
    // A merge is scored by what it added; a replace by what the device holds.
    const addedProfiles = mode === "merge" ? after.length - before.length : after.length;
    const addedStickers = mode === "merge" ? stickersAfter - beforeStickers : stickersAfter;
    this.showBackupResult(importSummary(mode, addedProfiles, addedStickers), PRIMARY_COLOR);
    this.scene.time.delayedCall(IMPORT_RELOAD_DELAY_MS, reloadApp);
  }

  /** Puts one sentence on the result line, and remembers it for the next build. */
  private showBackupResult(message: string, color: string = DISABLED_COLOR): void {
    this.backupResult = message;
    this.backupResultColor = color;
    this.backupResultText?.setText(message);
    this.backupResultText?.setColor(color);
  }

  /**
   * Creates one inflated, touch-friendly settings toggle: a labeled row card
   * plus a track-and-knob switch whose knob side encodes the state (never
   * color alone).
   * @param id - Stable setting key the panel publishes for the browser suite.
   * @param onChange - Optional persistence hook; when provided it replaces the
   *   built-in audio handling (used by non-audio toggles such as Adaptive).
   */
  private createToggle(
    x: number,
    y: number,
    id: string,
    label: string,
    enabled: boolean,
    onChange?: (nextEnabled: boolean) => void,
  ): Phaser.GameObjects.Text {
    addRowCard(this.scene, x, y, this.pageObjects);

    const switchX = x + 170;
    const track = this.scene.add.rectangle(
      switchX,
      y,
      TOGGLE_TRACK_WIDTH,
      TOGGLE_TRACK_HEIGHT,
      enabled ? TOGGLE_TRACK_ON_COLOR : TOGGLE_TRACK_OFF_COLOR,
    );
    this.pageObjects.push(track);

    const knob = this.scene.add.rectangle(
      switchX + (enabled ? TOGGLE_KNOB_OFFSET : -TOGGLE_KNOB_OFFSET),
      y,
      TOGGLE_KNOB_SIZE,
      TOGGLE_KNOB_SIZE,
      TOGGLE_KNOB_COLOR,
    );
    knob.setStrokeStyle(2, OUTLINE_COLOR, 1);
    this.pageObjects.push(knob);

    const toggle = this.scene.add
      .text(
        x - 40,
        y,
        `${label}: ${enabled ? "ON" : "OFF"}`,
        textStyle({
          color: enabled ? ENABLED_COLOR : DISABLED_COLOR,
          fontSize: "34px",
        }),
      )
      .setOrigin(0.5);
    // The label sits 40px left of the row center, so the band's offset shifts
    // back by 40: the rectangle must be centred on the card, not on the label.
    toggle.setInteractive(centredHitArea(ROW_HIT_WIDTH, ROW_PITCH, 40));
    toggle.on("pointerdown", () => {
      const nextEnabled = !enabled;
      enabled = nextEnabled;
      const audio = AudioManager.getInstance();

      if (onChange) {
        onChange(nextEnabled);
      } else if (label === "BGM") {
        audio.setBGMEnabled(nextEnabled);
        if (nextEnabled) audio.playBGM();
        else audio.pauseBGM();
      } else {
        audio.setSFXEnabled(nextEnabled);
        if (nextEnabled) audio.playCorrect();
      }

      toggle.setText(`${label}: ${nextEnabled ? "ON" : "OFF"}`);
      toggle.setColor(nextEnabled ? ENABLED_COLOR : DISABLED_COLOR);
      // Slide the knob and repaint the track so state is visible without text.
      knob.setX(switchX + (nextEnabled ? TOGGLE_KNOB_OFFSET : -TOGGLE_KNOB_OFFSET));
      track.setFillStyle(nextEnabled ? TOGGLE_TRACK_ON_COLOR : TOGGLE_TRACK_OFF_COLOR, 1);
    });
    attachPressFeedback(toggle);
    this.pageObjects.push(toggle);
    // The band is centred on (x, y) by construction: the label sits 40px left
    // of the row centre and the hit area offsets back by 40, so `x` is where a
    // finger lands. Publishing the layout arguments keeps the suite from
    // re-deriving the row maths.
    this.toggles.push({ id, x, y, value: () => enabled });
    return toggle;
  }

  /** Adds the parental "Profiles" row that opens the profile manager overlay. */
  private createProfilesRow(x: number, y: number): void {
    createRow(this.scene, x, y, this.pageObjects, "Profiles", PRIMARY_COLOR, () =>
      this.openProfilesOverlay(),
    );
  }

  /** Adds the parental "Progress" row that opens the Learning Progress overlay. */
  private createProgressRow(x: number, y: number): void {
    createRow(this.scene, x, y, this.pageObjects, "Progress", PRIMARY_COLOR, () =>
      this.openProgressOverlay(),
    );
    // Like the toggle rows: the row card is centred on (x, y), so the layout
    // arguments are the point a finger lands on - no re-derivation by the suite.
    this.progressRowPoint = { x, y };
  }

  /**
   * The "Progress" row's canvas centre, or null before the row is built. The
   * row's own rectangle is what a parent's finger lands on, so a journey that
   * taps this point taps the control.
   */
  e2eProgressRow(): { x: number; y: number } | null {
    return this.progressRowPoint;
  }

  /** The Learning Progress overlay as it is drawing it, or null when closed. */
  e2eProgress(): E2EProgressState | null {
    return this.progressOverlay.e2eState();
  }

  /** Delegates to the extracted ProgressOverlay component. */
  private openProgressOverlay(): void {
    this.progressOverlay.open();
  }

  /**
   * Opens the profile manager overlay: one row per profile (avatar + Delete)
   * plus unused avatars for adding new profiles (up to 4). Rebuilds itself
   * after add/delete so the list always reflects persisted state.
   */
  private openProfilesOverlay(): void {
    this.profilesOverlay.open();
  }
}
