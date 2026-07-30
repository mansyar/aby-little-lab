import Phaser from "phaser";
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
  private readonly backdrop: Phaser.GameObjects.Rectangle;
  private readonly panel: Phaser.GameObjects.Rectangle;
  private readonly title: Phaser.GameObjects.Text;
  private readonly bgmToggle: Phaser.GameObjects.Text;
  private readonly sfxToggle: Phaser.GameObjects.Text;

  /** Creates the settings panel using the current persisted audio settings. */
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const { width, height } = scene.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2;
    const settings = getSettings();

    this.backdrop = scene.add.rectangle(
      centerX,
      centerY,
      width,
      height,
      BACKDROP_COLOR,
      BACKDROP_ALPHA,
    );
    this.panel = scene.add
      .rectangle(centerX, centerY, PANEL_WIDTH, PANEL_HEIGHT, PANEL_COLOR)
      .setStrokeStyle(4, OUTLINE_COLOR);
    this.title = scene.add
      .text(centerX, centerY - 105, "Settings", {
        color: "#2d3748",
        fontSize: "32px",
      })
      .setOrigin(0.5);
    this.bgmToggle = this.createToggle(centerX, centerY - 25, "BGM", settings.bgmEnabled);
    this.sfxToggle = this.createToggle(centerX, centerY + 75, "SFX", settings.sfxEnabled);
  }

  /** Creates one inflated, touch-friendly settings label. */
  private createToggle(
    x: number,
    y: number,
    label: string,
    enabled: boolean,
  ): Phaser.GameObjects.Text {
    const toggle = this.scene
      .add.text(x, y, `${label}: ${enabled ? "ON" : "OFF"}`, {
        color: enabled ? ENABLED_COLOR : DISABLED_COLOR,
        fontSize: "28px",
      })
      .setOrigin(0.5);
    toggle.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(-TOGGLE_WIDTH / 2, -TOGGLE_HEIGHT / 2, TOGGLE_WIDTH, TOGGLE_HEIGHT),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    });
    return toggle;
  }
}
