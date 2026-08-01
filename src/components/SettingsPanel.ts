import Phaser from "phaser";
import { AudioManager } from "../audio/AudioManager";
import { createInstallTracker, type InstallTracker } from "../utils/pwaInstall";
import { getSettings } from "../utils/storage";

const BACKDROP_COLOR = 0x000000;
const BACKDROP_ALPHA = 0.6;
const OVERLAY_ALPHA = 0.75;
const PANEL_COLOR = 0xfff8e7;
const OUTLINE_COLOR = 0x2d3748;
const ENABLED_COLOR = "#68d391";
const DISABLED_COLOR = "#a0aec0";
const PRIMARY_COLOR = "#2b6cb0";
const PANEL_WIDTH = 480;
const PANEL_HEIGHT = 460;
const TOGGLE_WIDTH = 240;
const TOGGLE_HEIGHT = 96;

/** Renders the parental settings controls above the HubScene. */
export class SettingsPanel {
  private readonly scene: Phaser.Scene;
  private readonly objects: Phaser.GameObjects.GameObject[] = [];
  private readonly overlayObjects: Phaser.GameObjects.GameObject[] = [];
  private readonly installTracker: InstallTracker;

  /**
   * Creates the settings panel using the current persisted audio settings.
   * @param installTracker - Injected install tracker (tests); defaults to a
   *   tracker wired to real browser install events.
   */
  constructor(scene: Phaser.Scene, installTracker?: InstallTracker) {
    this.scene = scene;
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
        .text(centerX, centerY - 105, "Settings", {
          color: "#2d3748",
          fontSize: "32px",
        })
        .setOrigin(0.5),
    );
    this.createToggle(centerX, centerY - 25, "BGM", settings.bgmEnabled);
    this.createToggle(centerX, centerY + 75, "SFX", settings.sfxEnabled);
    this.createInstallRow(centerX, centerY + 175);
  }

  /** Destroys the modal, the install overlay, and all display objects. */
  destroy(): void {
    for (const object of this.overlayObjects) object.destroy();
    this.overlayObjects.length = 0;
    for (const object of this.objects) object.destroy();
    this.installTracker.destroy();
  }

  /** Creates one inflated, touch-friendly settings label. */
  private createToggle(
    x: number,
    y: number,
    label: string,
    enabled: boolean,
  ): Phaser.GameObjects.Text {
    const toggle = this.scene.add
      .text(x, y, `${label}: ${enabled ? "ON" : "OFF"}`, {
        color: enabled ? ENABLED_COLOR : DISABLED_COLOR,
        fontSize: "28px",
      })
      .setOrigin(0.5);
    toggle.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(
        -TOGGLE_WIDTH / 2,
        -TOGGLE_HEIGHT / 2,
        TOGGLE_WIDTH,
        TOGGLE_HEIGHT,
      ),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    });
    toggle.on("pointerdown", () => {
      const nextEnabled = !enabled;
      enabled = nextEnabled;
      const audio = AudioManager.getInstance();

      if (label === "BGM") {
        audio.setBGMEnabled(nextEnabled);
        if (nextEnabled) audio.playBGM();
        else audio.pauseBGM();
      } else {
        audio.setSFXEnabled(nextEnabled);
        if (nextEnabled) audio.playCorrect();
      }

      toggle.setText(`${label}: ${nextEnabled ? "ON" : "OFF"}`);
      toggle.setColor(nextEnabled ? ENABLED_COLOR : DISABLED_COLOR);
    });
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

    const label = state === "installable" ? "Install App" : "How to Install";
    const button = this.scene.add
      .text(x, y, label, {
        color: PRIMARY_COLOR,
        fontSize: "24px",
      })
      .setOrigin(0.5);
    button.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(
        -TOGGLE_WIDTH / 2,
        -TOGGLE_HEIGHT / 2,
        TOGGLE_WIDTH,
        TOGGLE_HEIGHT,
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
    this.objects.push(button);
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
        .text(centerX, centerY - 105, "Install on iOS", {
          color: "#2d3748",
          fontSize: "32px",
        })
        .setOrigin(0.5),
    );
    this.overlayObjects.push(
      this.scene.add
        .text(centerX, centerY - 25, "1. Tap the Share icon", {
          color: "#2d3748",
          fontSize: "24px",
        })
        .setOrigin(0.5),
    );
    this.overlayObjects.push(
      this.scene.add
        .text(centerX, centerY + 35, "2. Choose Add to Home Screen", {
          color: "#2d3748",
          fontSize: "24px",
        })
        .setOrigin(0.5),
    );
    this.overlayObjects.push(
      this.scene.add
        .text(centerX, centerY + 95, "3. Open Aby's Little Lab offline", {
          color: "#2d3748",
          fontSize: "24px",
        })
        .setOrigin(0.5),
    );
    const close = this.scene.add
      .text(centerX, centerY + 175, "Close", {
        color: PRIMARY_COLOR,
        fontSize: "24px",
      })
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
}
