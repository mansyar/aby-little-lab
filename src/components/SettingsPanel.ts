import Phaser from "phaser";
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
  createRow,
  DISABLED_COLOR,
  ENABLED_COLOR,
  OUTLINE_COLOR,
  PANEL_COLOR,
  PANEL_HEIGHT,
  PANEL_WIDTH,
  PRIMARY_COLOR,
  TOGGLE_HEIGHT,
  TOGGLE_KNOB_COLOR,
  TOGGLE_KNOB_OFFSET,
  TOGGLE_KNOB_SIZE,
  TOGGLE_TRACK_HEIGHT,
  TOGGLE_TRACK_OFF_COLOR,
  TOGGLE_TRACK_ON_COLOR,
  TOGGLE_TRACK_WIDTH,
  TOGGLE_WIDTH,
} from "./settings/primitives";
import { ResetModal } from "./settings/ResetModal";
import { VoiceRow } from "./settings/VoiceRow";

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
    closeButton.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(-48, -48, 96, 96),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    });
    closeButton.on("pointerdown", () => this.destroy());
    attachPressFeedback(closeButton);
    this.objects.push(closeButton);
    // Row pitch ~56px keeps all eight 68px cards on-canvas and inside the
    // 760px panel (bottom row +345 → card bottom +379, matching v1.16.0).
    this.createToggle(centerX, centerY - 45, "BGM", settings.bgmEnabled);
    this.createToggle(centerX, centerY + 11, "SFX", settings.sfxEnabled);
    this.createToggle(centerX, centerY + 67, "Adaptive", settings.adaptiveDifficulty, (next) => {
      updateSettings({ adaptiveDifficulty: next });
    });
    this.createProfilesRow(centerX, centerY + 123);
    this.createProgressRow(centerX, centerY + 178);
    this.resetModal.createRow(centerX, centerY + 234);
    this.installRow.create(centerX, centerY + 290);
    this.voiceRow.create(centerX, centerY + 345);
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
    toggle.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(
        -(TOGGLE_WIDTH / 2 + 40),
        -TOGGLE_HEIGHT / 2,
        TOGGLE_WIDTH + 80,
        TOGGLE_HEIGHT,
      ),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    });
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
