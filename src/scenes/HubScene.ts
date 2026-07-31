import Phaser from "phaser";
import { AudioManager } from "../audio/AudioManager";
import { ParentLock } from "../components/ParentLock";
import { SettingsPanel } from "../components/SettingsPanel";
import type { GameId } from "../types";
import { isReducedMotion } from "../utils/motion";
import { attachPressFeedback } from "../utils/pressFeedback";
import { sceneEntrance, transitionToScene } from "../utils/sceneTransitions";
import { hasSticker } from "../utils/storage";

interface GameTile {
  sceneKey: string;
  gameId: GameId;
  label: string;
}

const GAME_TILES: readonly GameTile[] = [
  { sceneKey: "ShapeSorter", gameId: "shape-sorter", label: "Shape Sorter" },
  { sceneKey: "AnimalTrace", gameId: "animal-trace", label: "Animal Trace" },
  { sceneKey: "PopFreeze", gameId: "pop-freeze", label: "Pop & Freeze" },
  { sceneKey: "ShadowMatch", gameId: "shadow-match", label: "Shadow Match" },
  { sceneKey: "MusicalMemory", gameId: "musical-memory", label: "Musical Memory" },
  { sceneKey: "BigSmall", gameId: "big-small", label: "Big & Small" },
];

const TILE_WIDTH = 200;
const TILE_HEIGHT = 150;
const TILE_SPACING = 50;
const GRID_COLS = 3;
const GRID_ROWS = 2;

/** Delay between consecutive entrance elements (ms). */
const ENTRANCE_STAGGER = 40;
/** Duration of each element's entrance tween (ms). */
const ENTRANCE_DURATION = 300;
/** Vertical bob amplitude for idle tiles (px). */
const BOB_AMPLITUDE = 4;
/** Duration of one tile bob loop (ms). */
const BOB_DURATION = 2500;
/** Phase offset between tile bob loops (ms). */
const BOB_PHASE_OFFSET = 200;
/** Number of background decorations. */
const DECORATION_COUNT = 4;
/** Radius of background decoration dots (px). */
const DECORATION_RADIUS = 10;
/** Low-contrast color for background decorations. */
const DECORATION_COLOR = 0xe8e0d0;
/** Vertical drift distance for decorations (px). */
const DECORATION_DRIFT = 16;
/** Slowest decoration drift loop (ms). */
const DECORATION_DRIFT_MIN = 4000;
/** Fastest decoration drift loop (ms). */
const DECORATION_DRIFT_MAX = 6000;

/**
 * Hub scene — the central navigation hub.
 *
 * Displays a grid of 6 game tiles, a sticker book showing earned stickers,
 * and a settings button gated behind a parental lock.
 */
export class HubScene extends Phaser.Scene {
  private parentLock?: ParentLock;
  private settingsPanel?: SettingsPanel;
  private entranceIndex = 0;

  constructor() {
    super({ key: "Hub" });
  }

  create(): void {
    sceneEntrance(this);
    const reducedMotion = isReducedMotion();
    this.entranceIndex = 0;

    if (!reducedMotion) {
      this.createDecorations();
    }

    const startX =
      (this.cameras.main.width - GRID_COLS * TILE_WIDTH - (GRID_COLS - 1) * TILE_SPACING) / 2;
    const startY =
      (this.cameras.main.height - GRID_ROWS * TILE_HEIGHT - (GRID_ROWS - 1) * TILE_SPACING) / 2;
    const startAudio = (): void => {
      const audio = AudioManager.getInstance();
      audio.resume();
      audio.playBGM();
    };

    for (let i = 0; i < GAME_TILES.length; i++) {
      const col = i % GRID_COLS;
      const row = Math.floor(i / GRID_COLS);
      const x = startX + col * (TILE_WIDTH + TILE_SPACING) + TILE_WIDTH / 2;
      const y = startY + row * (TILE_HEIGHT + TILE_SPACING) + TILE_HEIGHT / 2;

      const tile = this.add.rectangle(x, y, TILE_WIDTH, TILE_HEIGHT, 0x2b6cb0);
      tile.setInteractive();
      // Navigate on release so the press squish is visible while holding;
      // releasing outside the tile (pointerout/pointercancel) cancels.
      tile.on("pointerup", () => {
        startAudio();
        transitionToScene(this, GAME_TILES[i].sceneKey);
      });

      const label = this.add.text(x, y, GAME_TILES[i].label, {
        fontSize: "20px",
        color: "#ffffff",
      });
      label.setOrigin(0.5);

      this.animateEntrance([tile, label], () => {
        attachPressFeedback(tile, { spring: true });
      });

      if (!reducedMotion) {
        this.tweens.add({
          targets: [tile, label],
          y: y - BOB_AMPLITUDE,
          duration: BOB_DURATION,
          yoyo: true,
          repeat: -1,
          ease: "Sine.inOut",
          delay: i * BOB_PHASE_OFFSET,
        });
      }

      const earned = hasSticker(GAME_TILES[i].gameId);
      const sticker = this.add.text(x, y + TILE_HEIGHT / 2 - 20, earned ? "★" : "☆", {
        fontSize: "24px",
        color: earned ? "#68d391" : "#a0aec0",
      });
      sticker.setOrigin(0.5);

      this.animateEntrance([sticker]);
    }

    const settingsButton = this.add.text(this.cameras.main.width - 20, 20, "Settings", {
      fontSize: "18px",
      color: "#2d3748",
    });
    settingsButton.setOrigin(1, 0);
    settingsButton.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(0, 0, 96, 96),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    });

    this.parentLock = new ParentLock({
      scene: this,
      target: settingsButton,
      onSuccess: () => {
        this.settingsPanel?.destroy();
        this.settingsPanel = new SettingsPanel(this);
      },
      onFailure: () => {
        // No action needed on failure.
      },
    });
    attachPressFeedback(settingsButton);
    settingsButton.on("pointerdown", startAudio);

    this.events.on("shutdown", () => {
      this.parentLock?.destroy();
      this.settingsPanel?.destroy();
      this.settingsPanel = undefined;
    });
  }

  /** Creates a few low-contrast dots that drift slowly behind the grid. */
  private createDecorations(): void {
    const driftRange = DECORATION_DRIFT_MAX - DECORATION_DRIFT_MIN;
    const positions: ReadonlyArray<[number, number]> = [
      [this.cameras.main.width * 0.12, this.cameras.main.height * 0.18],
      [this.cameras.main.width * 0.88, this.cameras.main.height * 0.15],
      [this.cameras.main.width * 0.1, this.cameras.main.height * 0.8],
      [this.cameras.main.width * 0.9, this.cameras.main.height * 0.75],
    ];

    for (let i = 0; i < DECORATION_COUNT; i++) {
      const [x, y] = positions[i];
      const dot = this.add.circle(x, y, DECORATION_RADIUS, DECORATION_COLOR);
      dot.setDepth(-1);
      this.tweens.add({
        targets: dot,
        y: y - DECORATION_DRIFT,
        duration: DECORATION_DRIFT_MIN + (i * driftRange) / (DECORATION_COUNT - 1),
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
        delay: i * 300,
      });
    }
  }

  /**
   * Fades (and, under normal motion, scales) an element in with a per-element
   * stagger. Under reduced motion only alpha is animated.
   * @param targets - Display objects to animate.
   * @param onComplete - Optional callback invoked when the entrance finishes.
   */
  private animateEntrance(targets: Phaser.GameObjects.GameObject[], onComplete?: () => void): void {
    const index = this.entranceIndex;
    this.entranceIndex += 1;
    const config: Phaser.Types.Tweens.TweenBuilderConfig = {
      targets,
      alpha: 1,
      delay: index * ENTRANCE_STAGGER,
      duration: ENTRANCE_DURATION,
      ease: "Sine.out",
    };
    if (onComplete) {
      config.onComplete = onComplete;
    }

    for (const target of targets) {
      const tweenable = target as Phaser.GameObjects.GameObject & {
        setAlpha: (alpha: number) => unknown;
        setScale: (scale: number) => unknown;
      };
      tweenable.setAlpha(0);
      if (!isReducedMotion()) {
        tweenable.setScale(0);
        config.scaleX = 1;
        config.scaleY = 1;
      }
    }

    this.tweens.add(config);
  }
}
