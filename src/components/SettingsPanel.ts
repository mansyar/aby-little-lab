import type Phaser from "phaser";
import type { E2EBackupState, E2EProgressState, E2ESettingsToggle } from "../game/e2eBridge";
import { getInstallPromptTracker, type InstallTracker } from "../utils/pwaInstall";
import { getSettings, isPersistenceDegraded } from "../utils/storage";
import { textStyle } from "../utils/typography";
import { allowPinchZoom, restorePinchZoom } from "../utils/viewportZoom";
import { BackupPanel } from "./settings/BackupPanel";
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

/** Y offset of the first row; the eight rows then step by `ROW_PITCH`. */
const FIRST_ROW_OFFSET = -47;
/** Y offset of the degraded notice, in the empty band above the title. */
const NOTICE_OFFSET = -150;

/** What the notice says: the fact itself, in the panel's own quiet voice. */
const NOTICE_LABEL = "Progress can't be saved on this device";

/** Y offset of the page-switch card, above the degraded notice. */
const SWITCH_OFFSET = -250;

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
  /**
   * Everything the page on screen owns. Destroyed and rebuilt on every switch,
   * so no row from the other page keeps a live hit band over the canvas.
   */
  private readonly pageObjects: Phaser.GameObjects.GameObject[] = [];
  private readonly overlayObjects: Phaser.GameObjects.GameObject[] = [];
  private readonly modalObjects: Phaser.GameObjects.GameObject[] = [];
  private readonly progressOverlay: ProgressOverlay;
  private readonly profilesOverlay: ProfilesOverlay;
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
    this.backupPanel = new BackupPanel({ scene, pageObjects: this.pageObjects });
    this.settingsRows = new SettingsRows({
      scene,
      pageObjects: this.pageObjects,
      installRow: this.installRow,
      voiceRow: this.voiceRow,
      resetModal: this.resetModal,
      onOpenProfiles: () => this.openProfilesOverlay(),
      onOpenProgress: () => this.openProgressOverlay(),
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
    this.backupPanel.destroyChoice();
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
    return this.settingsRows.e2eToggles();
  }

  /**
   * The second page — its page number, its switch point, its three rows and the
   * line that says what happened — as the panel is holding them right now.
   *
   * A journey moves between pages with this and taps a row by its published
   * centre, so it never copies a layout number. Every value is a live read:
   * `page` is the page on screen, `backupRows` is empty while the other page is
   * up because those rows no longer exist, and `backupResult` is the panel's
   * own memory of the last thing it told a parent.
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
      this.settingsRows.build(settings, centerX, rowY);
    } else {
      this.backupPanel.build(centerX, rowY);
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
    this.settingsRows.clear();
    this.backupPanel.clear();
  }

  /**
   * The "Progress" row's canvas centre, or null before the row is built. The
   * row's own rectangle is what a parent's finger lands on, so a journey that
   * taps this point taps the control.
   */
  e2eProgressRow(): { x: number; y: number } | null {
    return this.settingsRows.e2eProgressRow();
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
