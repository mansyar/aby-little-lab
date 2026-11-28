import type Phaser from "phaser";
import type {
  E2EBackupState,
  E2EHelpState,
  E2EProgressState,
  E2ESettingsToggle,
} from "../game/e2eBridge";
import type { NarrationPace } from "../types";
import { getInstallPromptTracker, type InstallTracker } from "../utils/pwaInstall";
import { getSettings, isPersistenceDegraded } from "../utils/storage";
import { textStyle } from "../utils/typography";
import { allowPinchZoom, restorePinchZoom } from "../utils/viewportZoom";
import { BackupPanel } from "./settings/BackupPanel";
import { HelpButton } from "./settings/HelpButton";
import { HelpOverlay } from "./settings/HelpOverlay";
import { InstallRow } from "./settings/InstallRow";
import { ProfilesOverlay } from "./settings/ProfilesOverlay";
import { ProgressOverlay } from "./settings/ProgressOverlay";
import {
  addRowCard,
  BACKDROP_ALPHA,
  BACKDROP_COLOR,
  centredHitArea,
  DISABLED_COLOR,
  OUTLINE_COLOR,
  PANEL_COLOR,
  PANEL_HEIGHT,
  PANEL_WIDTH,
  PRIMARY_COLOR,
  ROW_CARD_HEIGHT,
  ROW_HIT_WIDTH,
  ROW_PITCH,
} from "./settings/primitives";
import { ResetModal } from "./settings/ResetModal";
import { SettingsRows } from "./settings/SettingsRows";
import { VoiceRow } from "./settings/VoiceRow";

/**
 * Y offset of the first row; the nine rows then step by `ROW_PITCH`. The whole
 * stack (and the chrome above it) sits 56px higher than it did with eight rows
 * so the last card still ends at the panel's bottom edge.
 */
const FIRST_ROW_OFFSET = -103;
/**
 * Page two still has only three rows; it keeps its original position rather
 * than inheriting page one's upward shift for the ninth control.
 */
const BACKUP_FIRST_ROW_OFFSET = -47;
/** Y offset of the degraded notice, in the empty band above the title. */
const NOTICE_OFFSET = -206;

/** What the notice says: the fact itself, in the panel's own quiet voice. */
const NOTICE_LABEL = "Progress can't be saved on this device";

/** Y offset of the page-switch card, above the degraded notice. */
const SWITCH_OFFSET = -306;

/** The switch card on each page: where it leads, with a chevron saying so. */
const SWITCH_TO_BACKUP = "Backup & restore ›";
const SWITCH_TO_SETTINGS = "‹ Back to settings";

/** Page titles, both drawn by the one title element the panel already had. */
const SETTINGS_TITLE = "Settings";
const BACKUP_TITLE = "Backup";

/** Renders the parental settings controls above the HubScene. */
export class SettingsPanel {
  private readonly scene: Phaser.Scene;
  private readonly objects: Phaser.GameObjects.GameObject[] = [];
  /** Rebuilt on every switch so no stale row keeps a live hit band. */
  private readonly pageObjects: Phaser.GameObjects.GameObject[] = [];
  private readonly overlayObjects: Phaser.GameObjects.GameObject[] = [];
  private readonly modalObjects: Phaser.GameObjects.GameObject[] = [];
  private readonly progressOverlay: ProgressOverlay;
  private readonly profilesOverlay: ProfilesOverlay;
  private readonly helpOverlay: HelpOverlay;
  private readonly installRow: InstallRow;
  private readonly voiceRow: VoiceRow;
  private readonly resetModal: ResetModal;
  private readonly installTracker: InstallTracker;
  private readonly onProgressReset?: () => void;
  /** The page-two helper owns the backup rows, result line and choice card. */
  private readonly backupPanel: BackupPanel;
  /** The page-one helper owns the eight rows and their toggle state. */
  private readonly settingsRows: SettingsRows;
  /** The title, relabelled rather than rebuilt, so the header never jumps. */
  private readonly title: Phaser.GameObjects.Text;
  /** The ✕, raised above rows it shares a corner with on each rebuild. */
  private readonly closeButton: Phaser.GameObjects.Text;
  /** The persistent Help control, mirrored from the ✕ in the header. */
  private readonly helpButton: HelpButton;
  /** The page switch's label, relabelled on each switch. */
  private readonly switchLabel: Phaser.GameObjects.Text;
  /** The switch card's centre, captured from the layout arguments. */
  private readonly switchPoint: { x: number; y: number };
  /** Which settings page is on screen. */
  private page: 0 | 1 = 0;
  /** Set by {@link destroy}: the panel's own liveness, independent of the scene. */
  private destroyed = false;
  /** Open-time snapshot of storage health; the panel never polls or subscribes. */
  private readonly persistenceDegraded: boolean;

  /** Refreshes the voice chip when the platform loads voices late. */
  private readonly voiceChangedHandler = (): void => {
    this.voiceRow.voiceChanged();
  };

  /**
   * Creates the panel from the current settings. An injected install tracker
   * wins over the app-lifetime default; `onProgressReset` refreshes stickers.
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
    this.helpOverlay = new HelpOverlay({ scene, overlayObjects: this.overlayObjects });
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
    this.backupPanel = new BackupPanel({ scene, pageObjects: this.pageObjects });
    this.settingsRows = new SettingsRows({
      scene,
      pageObjects: this.pageObjects,
      installRow: this.installRow,
      voiceRow: this.voiceRow,
      resetModal: this.resetModal,
      onOpenProfiles: () => this.profilesOverlay.open(),
      onOpenProgress: () => this.progressOverlay.open(),
    });
    // Parents read the panel's text on phones; relax the pinch-zoom lock only
    // while the panel is open, restoring it on close.
    allowPinchZoom();
    const { width, height } = scene.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2;
    const settings = getSettings();
    // FR-5: one open-time snapshot, never polled or subscribed.
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
        centerY - 161,
        SETTINGS_TITLE,
        textStyle({
          color: "#2d3748",
          fontSize: "36px",
        }),
      )
      .setOrigin(0.5);
    this.title = title;
    this.objects.push(title);
    // Quiet, non-interactive notice while persistence is unavailable.
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
        centerY - 161,
        "✕",
        textStyle({
          color: "#2d3748",
          fontSize: "32px",
        }),
      )
      .setOrigin(0.5);
    closeButton.setInteractive(centredHitArea(96, 96));
    closeButton.on("pointerdown", () => this.destroy());
    this.objects.push(closeButton);
    this.closeButton = closeButton;
    // Help is a sibling of the ✕ in the persistent header, available on both pages.
    this.helpButton = new HelpButton({
      scene,
      objects: this.objects,
      centerX,
      centerY,
      onOpen: () => this.helpOverlay.open(),
    });
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
          centerY - 131,
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
    // Closing Settings closes Help too, before the shared bucket is torn down.
    this.helpOverlay.close();
    const synth = window.speechSynthesis;
    if (synth && typeof synth.removeEventListener === "function") {
      synth.removeEventListener("voiceschanged", this.voiceChangedHandler);
    }
    this.backupPanel.destroyChoice();
    for (const object of this.pageObjects) object.destroy();
    this.pageObjects.length = 0;
    for (const object of this.modalObjects) object.destroy();
    this.modalObjects.length = 0;
    for (const object of this.overlayObjects) object.destroy();
    this.overlayObjects.length = 0;
    for (const object of this.objects) object.destroy();
    // The tracker belongs to the page, not this panel; never destroy it.
    restorePinchZoom();
  }

  /** Liveness independent of a holder that outlives the panel. */
  e2eOpen(): boolean {
    return !this.destroyed;
  }

  /** Whether the open-time storage check failed, which is when the notice shows. */
  e2eDegraded(): boolean {
    return this.persistenceDegraded;
  }

  /** Each toggle row's live card centre and the state a tap would flip. */
  e2eToggles(): E2ESettingsToggle[] {
    return this.settingsRows.e2eToggles();
  }

  /**
   * The second page as held right now: number, switch point, rows and result.
   * All values are live reads; a journey taps published centres, not constants.
   */
  backupState(): E2EBackupState {
    const backup = this.backupPanel.state();
    return {
      page: this.page,
      switchPage: { x: this.switchPoint.x, y: this.switchPoint.y },
      backupRows: backup.backupRows,
      backupResult: backup.backupResult,
      choices: backup.choices,
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
   * Rebuilds the current page. Rows are destroyed, not hidden: an invisible row
   * would still answer taps over the canvas after a page switch.
   */
  private buildPage(settings: ReturnType<typeof getSettings>): void {
    this.clearPage();
    const { width, height } = this.scene.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2;
    // One ROW_PITCH apart; the stack clears the header and fits the panel.
    const rowY = (index: number): number => centerY + FIRST_ROW_OFFSET + index * ROW_PITCH;
    if (this.page === 0) {
      this.settingsRows.build(settings, centerX, rowY);
    } else {
      const backupRowY = (index: number): number =>
        centerY + BACKUP_FIRST_ROW_OFFSET + index * ROW_PITCH;
      this.backupPanel.build(centerX, backupRowY);
    }
    // Both persistent header controls are raised above the rows, never above
    // overlays that must cover them.
    this.scene.children.bringToTop(this.closeButton);
    this.helpButton.raise();
  }

  /** Destroys the page on screen, so nothing from it can answer a tap. */
  private clearPage(): void {
    // Before the objects go: the voice row keeps handles to its chip, preview
    // and band, and its `voiceschanged` listener outlives every page switch.
    this.voiceRow.release();
    for (const object of this.pageObjects) object.destroy();
    this.pageObjects.length = 0;
    this.settingsRows.clear();
    this.backupPanel.clear();
  }

  /** The "Progress" row's live canvas centre, or null before it is built. */
  e2eProgressRow(): { x: number; y: number } | null {
    return this.settingsRows.e2eProgressRow();
  }

  /** The pace chip's live canvas centre, or null on page two. */
  e2ePace(): { x: number; y: number } | null {
    return this.settingsRows.e2ePace();
  }

  /** The active profile's narration pace as the chip draws it. */
  e2eNarrationPace(): NarrationPace {
    return this.settingsRows.e2eNarrationPace();
  }

  /** The Learning Progress overlay as it is drawing it, or null when closed. */
  e2eProgress(): E2EProgressState | null {
    return this.progressOverlay.e2eState();
  }

  /** The Help control's live centre; null once Settings has closed. */
  e2eHelpButton(): { x: number; y: number } | null {
    return this.destroyed ? null : this.helpButton.point();
  }

  /** The Help overlay's drawn state, or null when Help or Settings is closed. */
  e2eHelp(): E2EHelpState | null {
    const state = this.helpOverlay.e2eState();
    if (this.destroyed || state === null) return null;
    const point = (p: { x: number; y: number }): { x: number; y: number } => ({
      x: p.x,
      y: p.y,
    });
    return {
      screen: state.screen,
      topicId: state.topicId,
      topicIndex: state.topicIndex,
      topicCount: state.topicCount,
      title: state.title,
      lines: [...state.lines],
      topics: state.topics.map((topic) => ({ ...topic })),
      controls: {
        close: point(state.controls.close),
        back: state.controls.back ? point(state.controls.back) : null,
        prev: state.controls.prev ? point(state.controls.prev) : null,
        next: state.controls.next ? point(state.controls.next) : null,
      },
    };
  }
}
