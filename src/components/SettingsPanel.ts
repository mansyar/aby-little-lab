import type Phaser from "phaser";
import { AudioManager } from "../audio/AudioManager";
import { attachPressFeedback } from "../utils/pressFeedback";
import { getInstallPromptTracker, type InstallTracker } from "../utils/pwaInstall";
import { getSettings, updateSettings } from "../utils/storage";
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
  createRow,
  DISABLED_COLOR,
  ENABLED_COLOR,
  OUTLINE_COLOR,
  PANEL_COLOR,
  PANEL_HEIGHT,
  PANEL_WIDTH,
  PRIMARY_COLOR,
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

/** Renders the parental settings controls above the HubScene. */
export class SettingsPanel {
  private readonly scene: Phaser.Scene;
  private readonly objects: Phaser.GameObjects.GameObject[] = [];
  private readonly overlayObjects: Phaser.GameObjects.GameObject[] = [];
  private readonly modalObjects: Phaser.GameObjects.GameObject[] = [];
  private readonly progressOverlay: ProgressOverlay;
  private readonly profilesOverlay: ProfilesOverlay;
  private readonly installRow: InstallRow;
  private readonly voiceRow: VoiceRow;
  private readonly resetModal: ResetModal;
  private readonly installTracker: InstallTracker;
  private readonly onProgressReset?: () => void;

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
      objects: this.objects,
      overlayObjects: this.overlayObjects,
      installTracker: this.installTracker,
    });
    this.voiceRow = new VoiceRow({ scene, bucket: this.objects });
    this.resetModal = new ResetModal({
      scene,
      objects: this.objects,
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
    this.objects.push(
      scene.add
        .text(
          centerX,
          centerY - 105,
          "Settings",
          textStyle({
            color: "#2d3748",
            fontSize: "36px",
          }),
        )
        .setOrigin(0.5),
    );
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
    // Eight rows, one ROW_PITCH apart, which is also each row's hit band: the
    // stack starts at -47 so the top row clears the title and version footer,
    // and the bottom card ends at +379, inside the 760px panel.
    const rowY = (index: number): number => centerY + FIRST_ROW_OFFSET + index * ROW_PITCH;
    this.createToggle(centerX, rowY(0), "BGM", settings.bgmEnabled);
    this.createToggle(centerX, rowY(1), "SFX", settings.sfxEnabled);
    this.createToggle(centerX, rowY(2), "Adaptive", settings.adaptiveDifficulty, (next) => {
      updateSettings({ adaptiveDifficulty: next });
    });
    this.createProfilesRow(centerX, rowY(3));
    this.createProgressRow(centerX, rowY(4));
    this.resetModal.createRow(centerX, rowY(5));
    this.installRow.create(centerX, rowY(6));
    this.voiceRow.create(centerX, rowY(7));
    // The ✕ box overlaps the BGM band's top-right corner, and the rows are
    // created after the ✕, so at equal depth the row would win that corner and
    // toggle music. Raising the ✕ above the rows settles it - and only above
    // the rows: the overlays open later and must still cover it, which a depth
    // above theirs would break.
    this.scene.children.bringToTop(closeButton);
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
    const synth = window.speechSynthesis;
    if (synth && typeof synth.removeEventListener === "function") {
      synth.removeEventListener("voiceschanged", this.voiceChangedHandler);
    }
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
   * Creates one inflated, touch-friendly settings toggle: a labeled row card
   * plus a track-and-knob switch whose knob side encodes the state (never
   * color alone).
   * @param onChange - Optional persistence hook; when provided it replaces the
   *   built-in audio handling (used by non-audio toggles such as Adaptive).
   */
  private createToggle(
    x: number,
    y: number,
    label: string,
    enabled: boolean,
    onChange?: (nextEnabled: boolean) => void,
  ): Phaser.GameObjects.Text {
    addRowCard(this.scene, x, y, this.objects);

    const switchX = x + 170;
    const track = this.scene.add.rectangle(
      switchX,
      y,
      TOGGLE_TRACK_WIDTH,
      TOGGLE_TRACK_HEIGHT,
      enabled ? TOGGLE_TRACK_ON_COLOR : TOGGLE_TRACK_OFF_COLOR,
    );
    this.objects.push(track);

    const knob = this.scene.add.rectangle(
      switchX + (enabled ? TOGGLE_KNOB_OFFSET : -TOGGLE_KNOB_OFFSET),
      y,
      TOGGLE_KNOB_SIZE,
      TOGGLE_KNOB_SIZE,
      TOGGLE_KNOB_COLOR,
    );
    knob.setStrokeStyle(2, OUTLINE_COLOR, 1);
    this.objects.push(knob);

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
    this.objects.push(toggle);
    return toggle;
  }

  /** Adds the parental "Profiles" row that opens the profile manager overlay. */
  private createProfilesRow(x: number, y: number): void {
    createRow(this.scene, x, y, this.objects, "Profiles", PRIMARY_COLOR, () =>
      this.openProfilesOverlay(),
    );
  }

  /** Adds the parental "Progress" row that opens the Learning Progress overlay. */
  private createProgressRow(x: number, y: number): void {
    createRow(this.scene, x, y, this.objects, "Progress", PRIMARY_COLOR, () =>
      this.openProgressOverlay(),
    );
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
