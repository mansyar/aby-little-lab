import Phaser from "phaser";
import { AudioManager } from "../audio/AudioManager";
import { getSettings } from "../utils/storage";

const BACKDROP_COLOR = 0x000000;
const BACKDROP_ALPHA = 0.6;
const PANEL_COLOR = 0xfff8e7;
const OUTLINE_COLOR = 0x2d3748;
const ENABLED_COLOR = "#68d391";
const DISABLED_COLOR = "#a0aec0";
const PANEL_WIDTH = 480;
const PANEL_HEIGHT = 320;
const TOGGLE_WIDTH = 240;
const TOGGLE_HEIGHT = 96;

/** Renders the parental settings controls above the HubScene. */
export class SettingsPanel {
  private readonly scene: Phaser.Scene;
  private readonly objects: Phaser.GameObjects.GameObject[] = [];

  /** Creates the settings panel using the current persisted audio settings. */
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
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
  }

  /** Destroys the modal and all of its display objects. */
  destroy(): void {
    for (const object of this.objects) object.destroy();
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
}
