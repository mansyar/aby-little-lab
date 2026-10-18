import Phaser from "phaser";
import { AudioManager } from "../audio/AudioManager";
import { availableVoiceOptions, type VoiceOption } from "../game/voiceLogic";
import { attachPressFeedback } from "../utils/pressFeedback";
import { createInstallTracker, type InstallTracker } from "../utils/pwaInstall";
import { setPreferredVoiceURI, speakWord } from "../utils/speech";
import { getSettings, resetProgress, updateSettings } from "../utils/storage";
import { textStyle } from "../utils/typography";
import { allowPinchZoom, restorePinchZoom } from "../utils/viewportZoom";
import { ProfilesOverlay } from "./settings/ProfilesOverlay";
import { ProgressOverlay } from "./settings/ProgressOverlay";
import {
  addRowCard,
  BACKDROP_ALPHA,
  BACKDROP_COLOR,
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
  ROW_HEIGHT,
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

/** Sample phrase spoken by the voice preview button. */
const VOICE_PREVIEW_TEXT = "Hi! I can talk.";
/** Longest voice label shown in the chip before truncation. */
const VOICE_LABEL_MAX = 24;
/** Truncates a long voice label for the narrow chip, e.g. "en-US — Goog…". */
function truncateLabel(label: string, max = VOICE_LABEL_MAX): string {
  return label.length <= max ? label : `${label.slice(0, max - 1)}…`;
}

/** Renders the parental settings controls above the HubScene. */
export class SettingsPanel {
  private readonly scene: Phaser.Scene;
  private readonly objects: Phaser.GameObjects.GameObject[] = [];
  private readonly overlayObjects: Phaser.GameObjects.GameObject[] = [];
  private readonly modalObjects: Phaser.GameObjects.GameObject[] = [];
  private readonly progressOverlay: ProgressOverlay;
  private readonly profilesOverlay: ProfilesOverlay;
  private readonly installTracker: InstallTracker;
  private resetRowText: Phaser.GameObjects.Text | null = null;
  private voiceChip: Phaser.GameObjects.Text | null = null;
  private voiceOptions: VoiceOption[] = [];
  private voiceIndex = 0;
  private readonly onProgressReset?: () => void;

  /** Rebuilds the voice picker list when the platform loads voices late. */
  private readonly voiceChangedHandler = (): void => {
    this.syncVoiceSelection();
    this.voiceChip?.setText(`Voice: ${truncateLabel(this.voiceOptions[this.voiceIndex].label)}`);
  };

  /**
   * Refreshes the voice options from the platform and resolves the chip index
   * against the stored preference (falling back to "Default (device)" when the
   * URI is unset or no longer installed).
   */
  private syncVoiceSelection(): void {
    this.voiceOptions = availableVoiceOptions(window.speechSynthesis?.getVoices?.() ?? []);
    const stored = getSettings().preferredVoiceURI;
    this.voiceIndex = Math.max(
      0,
      this.voiceOptions.findIndex((option) => option.voiceURI === stored),
    );
  }

  /**
   * Creates the settings panel using the current persisted audio settings.
   * @param installTracker - Injected install tracker (tests); defaults to a
   *   tracker wired to real browser install events.
   * @param onProgressReset - Called after a confirmed progress reset so the
   *   parent scene can re-render anything derived from the sticker collection.
   */
  constructor(scene: Phaser.Scene, installTracker?: InstallTracker, onProgressReset?: () => void) {
    this.scene = scene;
    this.onProgressReset = onProgressReset;
    this.profilesOverlay = new ProfilesOverlay({
      scene,
      overlayObjects: this.overlayObjects,
      modalObjects: this.modalObjects,
      onProgressReset: () => this.onProgressReset?.(),
    });
    this.progressOverlay = new ProgressOverlay({ scene, overlayObjects: this.overlayObjects });
    this.installTracker =
      installTracker ??
      createInstallTracker({
        userAgent: navigator.userAgent,
        isStandalone: () =>
          typeof window.matchMedia === "function" &&
          window.matchMedia("(display-mode: standalone)").matches,
        addEventListener: (type, listener) => window.addEventListener(type, listener),
        removeEventListener: (type, listener) => window.removeEventListener(type, listener),
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
    this.createResetRow(centerX, centerY + 234);
    this.createInstallRow(centerX, centerY + 290);
    this.createVoiceRow(centerX, centerY + 345);
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
    this.installTracker.destroy();
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

  /**
   * Adds a context-aware install control: "Install App" where a browser
   * install prompt is available, "How to Install" on iOS (which has no
   * prompt), and nothing when the app is already installed.
   */
  private createInstallRow(x: number, y: number): void {
    const state = this.installTracker.getState();
    if (state === "hidden") return;
    addRowCard(this.scene, x, y, this.objects);

    const label = state === "installable" ? "Install App" : "How to Install";
    const button = this.scene.add
      .text(
        x,
        y,
        label,
        textStyle({
          color: PRIMARY_COLOR,
          fontSize: "32px",
        }),
      )
      .setOrigin(0.5);
    button.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(
        -TOGGLE_WIDTH / 2,
        -ROW_HEIGHT / 2,
        TOGGLE_WIDTH,
        ROW_HEIGHT,
      ),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    });
    button.on("pointerdown", () => {
      if (state === "installable") {
        void this.installTracker.prompt();
      } else {
        this.showIosOverlay();
      }
    });
    attachPressFeedback(button);
    this.objects.push(button);
  }

  /**
   * Adds the device-level TTS voice row: a chip cycling through the installed
   * voices (plus "Default (device)") and a Preview button that speaks a sample
   * phrase with the current selection, honoring the SFX toggle.
   */
  private createVoiceRow(x: number, y: number): void {
    this.syncVoiceSelection();
    addRowCard(this.scene, x, y, this.objects);

    const chip = this.scene.add
      .text(
        x - 30,
        y,
        `Voice: ${truncateLabel(this.voiceOptions[this.voiceIndex].label)}`,
        textStyle({
          color: PRIMARY_COLOR,
          fontSize: "26px",
        }),
      )
      .setOrigin(0.5);
    chip.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(
        -TOGGLE_WIDTH / 4,
        -ROW_HEIGHT / 2,
        TOGGLE_WIDTH / 2,
        ROW_HEIGHT,
      ),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    });
    chip.on("pointerdown", () => {
      this.voiceIndex = (this.voiceIndex + 1) % this.voiceOptions.length;
      const next = this.voiceOptions[this.voiceIndex];
      updateSettings({ preferredVoiceURI: next.voiceURI });
      setPreferredVoiceURI(next.voiceURI);
      chip.setText(`Voice: ${truncateLabel(next.label)}`);
    });
    attachPressFeedback(chip);
    this.objects.push(chip);
    this.voiceChip = chip;

    const preview = this.scene.add
      .text(
        x + 170,
        y,
        "Preview",
        textStyle({
          color: ENABLED_COLOR,
          fontSize: "26px",
        }),
      )
      .setOrigin(0.5);
    preview.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(
        -TOGGLE_WIDTH / 4,
        -ROW_HEIGHT / 2,
        TOGGLE_WIDTH / 2,
        ROW_HEIGHT,
      ),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    });
    preview.on("pointerdown", () => {
      setPreferredVoiceURI(getSettings().preferredVoiceURI);
      speakWord(VOICE_PREVIEW_TEXT, getSettings().sfxEnabled);
    });
    attachPressFeedback(preview);
    this.objects.push(preview);
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

  /** Shows the iOS "Add to Home Screen" instructions overlay. */
  private showIosOverlay(): void {
    const { width, height } = this.scene.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2;

    const overlayBackdrop = this.scene.add
      .rectangle(centerX, centerY, width, height, BACKDROP_COLOR, OVERLAY_ALPHA)
      .setInteractive();
    overlayBackdrop.on("pointerdown", () => this.closeIosOverlay());
    this.overlayObjects.push(overlayBackdrop);
    this.overlayObjects.push(
      this.scene.add
        .rectangle(centerX, centerY, PANEL_WIDTH, PANEL_HEIGHT, PANEL_COLOR)
        .setStrokeStyle(4, OUTLINE_COLOR),
    );
    this.overlayObjects.push(
      this.scene.add
        .text(
          centerX,
          centerY - 105,
          "Install on iOS",
          textStyle({
            color: "#2d3748",
            fontSize: "36px",
          }),
        )
        .setOrigin(0.5),
    );
    this.overlayObjects.push(
      this.scene.add
        .text(
          centerX,
          centerY - 25,
          "1. Tap the Share icon",
          textStyle({
            color: "#2d3748",
            fontSize: "30px",
          }),
        )
        .setOrigin(0.5),
    );
    this.overlayObjects.push(
      this.scene.add
        .text(
          centerX,
          centerY + 35,
          "2. Choose Add to Home Screen",
          textStyle({
            color: "#2d3748",
            fontSize: "30px",
          }),
        )
        .setOrigin(0.5),
    );
    this.overlayObjects.push(
      this.scene.add
        .text(
          centerX,
          centerY + 95,
          "3. Open Aby's Little Lab offline",
          textStyle({
            color: "#2d3748",
            fontSize: "30px",
          }),
        )
        .setOrigin(0.5),
    );
    const close = this.scene.add
      .text(
        centerX,
        centerY + 175,
        "Close",
        textStyle({
          color: PRIMARY_COLOR,
          fontSize: "30px",
        }),
      )
      .setOrigin(0.5);
    close.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(
        -TOGGLE_WIDTH / 2,
        -TOGGLE_HEIGHT / 2,
        TOGGLE_WIDTH,
        TOGGLE_HEIGHT,
      ),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    });
    close.on("pointerdown", () => this.closeIosOverlay());
    this.overlayObjects.push(close);
  }

  /** Destroys the iOS instructions overlay (not the panel). */
  private closeIosOverlay(): void {
    for (const object of this.overlayObjects) object.destroy();
    this.overlayObjects.length = 0;
  }

  /** Adds the parental "Reset Progress" row that clears all stickers. */
  private createResetRow(x: number, y: number): void {
    this.resetRowText = createRow(
      this.scene,
      x,
      y,
      this.objects,
      "Reset Progress",
      DANGER_COLOR,
      () => this.showResetModal(),
    );
  }

  /** Shows the two-step "Reset all stickers?" confirmation modal. */
  private showResetModal(): void {
    const { width, height } = this.scene.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2;

    const modalBackdrop = this.scene.add
      .rectangle(centerX, centerY, width, height, BACKDROP_COLOR, OVERLAY_ALPHA)
      .setInteractive();
    modalBackdrop.on("pointerdown", () => this.closeResetModal());
    this.overlayObjects.push(modalBackdrop);
    this.overlayObjects.push(
      this.scene.add
        .rectangle(centerX, centerY, PANEL_WIDTH, PANEL_HEIGHT, PANEL_COLOR)
        .setStrokeStyle(4, OUTLINE_COLOR),
    );
    this.overlayObjects.push(
      this.scene.add
        .text(
          centerX,
          centerY - 105,
          "Reset all stickers?",
          textStyle({
            color: "#2d3748",
            fontSize: "36px",
          }),
        )
        .setOrigin(0.5),
    );
    this.overlayObjects.push(
      this.scene.add
        .text(
          centerX,
          centerY - 25,
          "All stickers will be cleared.",
          textStyle({
            color: "#2d3748",
            fontSize: "30px",
          }),
        )
        .setOrigin(0.5),
    );
    this.overlayObjects.push(
      createModalButton(
        this.scene,
        centerX,
        centerY + 45,
        this.overlayObjects,
        "Cancel",
        PRIMARY_COLOR,
        () => this.closeResetModal(),
      ),
    );
    this.overlayObjects.push(
      createModalButton(
        this.scene,
        centerX,
        centerY + 125,
        this.overlayObjects,
        "Reset",
        DANGER_COLOR,
        () => this.confirmReset(),
        { emphasized: true },
      ),
    );
  }

  /** Closes the reset confirmation modal without changing any data. */
  private closeResetModal(): void {
    for (const object of this.overlayObjects) object.destroy();
    this.overlayObjects.length = 0;
  }

  /** Clears the sticker collection and shows inline confirmation. */
  private confirmReset(): void {
    resetProgress();
    this.closeResetModal();
    this.resetRowText?.setText("Progress cleared");
    this.resetRowText?.setColor(DISABLED_COLOR);
    this.onProgressReset?.();
  }
}
