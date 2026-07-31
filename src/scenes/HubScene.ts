import Phaser from "phaser";
import { AudioManager } from "../audio/AudioManager";
import { ParentLock } from "../components/ParentLock";
import { SettingsPanel } from "../components/SettingsPanel";
import type { GameId } from "../types";
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

/**
 * Hub scene — the central navigation hub.
 *
 * Displays a grid of 6 game tiles, a sticker book showing earned stickers,
 * and a settings button gated behind a parental lock.
 */
export class HubScene extends Phaser.Scene {
  private parentLock?: ParentLock;
  private settingsPanel?: SettingsPanel;

  constructor() {
    super({ key: "Hub" });
  }

  create(): void {
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
      tile.on("pointerdown", () => {
        startAudio();
        this.scene.start(GAME_TILES[i].sceneKey);
      });

      const label = this.add.text(x, y, GAME_TILES[i].label, {
        fontSize: "20px",
        color: "#ffffff",
      });
      label.setOrigin(0.5);

      const earned = hasSticker(GAME_TILES[i].gameId);
      const sticker = this.add.text(x, y + TILE_HEIGHT / 2 - 20, earned ? "★" : "☆", {
        fontSize: "24px",
        color: earned ? "#68d391" : "#a0aec0",
      });
      sticker.setOrigin(0.5);
    }

    const settingsButton = this.add.text(this.cameras.main.width - 20, 20, "Settings", {
      fontSize: "18px",
      color: "#2d3748",
    });
    settingsButton.setOrigin(1, 0);
    settingsButton.setInteractive();

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
    settingsButton.on("pointerdown", startAudio);

    this.events.on("shutdown", () => {
      this.parentLock?.destroy();
      this.settingsPanel?.destroy();
      this.settingsPanel = undefined;
    });
  }
}
