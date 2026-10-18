import Phaser from "phaser";
import { PROFILE_AVATAR_TEXTURES } from "../../game/profileLogic";
import {
  formatAccuracyPercent,
  getAccuracy,
  isMastered,
  relativeLastPlayed,
} from "../../game/progressLogic";
import type { GameId } from "../../types";
import { attachPressFeedback } from "../../utils/pressFeedback";
import { getActiveProfile, getProfiles, getProgress } from "../../utils/storage";
import { textStyle } from "../../utils/typography";
import {
  AVATAR_TEXTURE_SIZE,
  BACKDROP_COLOR,
  DISABLED_COLOR,
  type ObjectBucket,
  OUTLINE_COLOR,
  OVERLAY_ALPHA,
  PANEL_COLOR,
  PANEL_HEIGHT,
  PANEL_WIDTH,
  PRIMARY_COLOR,
  TOGGLE_HEIGHT,
} from "./primitives";

/** Mastery badge shown next to games with at least 3 wins. */
const MASTERY_STAR = "★";
/** Outline ring behind the viewed profile chip in Learning Progress. */
const VIEWED_RING_SIZE = 80;
/** Game rows shown per page in the Learning Progress overlay. */
const PROGRESS_PAGE_SIZE = 6;
/** Vertical pitch between progress rows (two text lines each). */
const PROGRESS_ROW_PITCH = 56;
/** Center-relative Y of the first progress row. */
const PROGRESS_ROW_START_Y = -150;
/** Center-relative Y of the 7-day activity strip label. */
const PROGRESS_STRIP_LABEL_Y = 230;
/** Center-relative Y of the 7-day activity bars. */
const PROGRESS_STRIP_Y = 265;
/** Width of one activity bar. */
const PROGRESS_BAR_WIDTH = 24;
/** Number of day bars in the 7-day activity strip. */
const PROGRESS_BAR_COUNT = 7;
/** Height of the tallest activity bar. */
const PROGRESS_BAR_HEIGHT = 36;
/** Horizontal gap between activity bars. */
const PROGRESS_BAR_GAP = 6;
/** Track color for the per-game accuracy bar. */
const ACCURACY_TRACK_COLOR = 0xe8e0d0;
/** Fill color for the per-game accuracy bar. */
const ACCURACY_FILL_COLOR = 0x68d391;

/** The 20 games in hub order, for the Learning Progress report rows. */
const PROGRESS_GAME_ROWS: ReadonlyArray<{ gameId: GameId; label: string; tileKey: string }> = [
  { gameId: "shape-sorter", label: "Shape Sorter", tileKey: "tile_shape_sorter" },
  { gameId: "animal-trace", label: "Animal Trace", tileKey: "tile_animal_trace" },
  { gameId: "pop-freeze", label: "Pop & Freeze", tileKey: "tile_pop_freeze" },
  { gameId: "shadow-match", label: "Shadow Match", tileKey: "tile_shadow_match" },
  { gameId: "musical-memory", label: "Musical Memory", tileKey: "tile_musical_memory" },
  { gameId: "big-small", label: "Big & Small", tileKey: "tile_big_small" },
  { gameId: "pattern-builder", label: "Pattern Builder", tileKey: "tile_pattern_builder" },
  { gameId: "alphabet-match", label: "Find the Letter", tileKey: "tile_alphabet" },
  { gameId: "word-match", label: "Find the Word", tileKey: "tile_word_match" },
  { gameId: "word-builder", label: "Build the Word", tileKey: "tile_word_builder" },
  { gameId: "how-many", label: "How Many?", tileKey: "tile_how_many" },
  { gameId: "first-sounds", label: "First Sounds", tileKey: "tile_first_sounds" },
  { gameId: "more-less", label: "More or Less", tileKey: "tile_more_less" },
  { gameId: "odd-one-out", label: "Odd One Out", tileKey: "tile_odd_one_out" },
  { gameId: "color-match", label: "Color Match", tileKey: "tile_color_match" },
  { gameId: "add-it-up", label: "Add It Up", tileKey: "tile_add_it_up" },
  { gameId: "take-away", label: "Take Away", tileKey: "tile_take_away" },
  { gameId: "memory-match", label: "Memory Match", tileKey: "tile_memory_match" },
  { gameId: "decode-it", label: "Decode It", tileKey: "tile_decode_it" },
  { gameId: "number-order", label: "Number Order", tileKey: "tile_number_order" },
];

export interface ProgressOverlayDeps {
  scene: Phaser.Scene;
  /** Shared overlay lifecycle bucket (Progress/Profiles/iOS/reset modal). */
  overlayObjects: ObjectBucket;
}

/**
 * The Learning Progress overlay: per-profile chips, paginated per-game rows
 * (plays, accuracy bar + %, mastery star, last played), and the 7-day activity
 * strip. Read-only: switching the viewed profile never changes the active
 * profile.
 */
export class ProgressOverlay {
  private readonly deps: ProgressOverlayDeps;
  private page = 0;
  private viewedId: string | null = null;

  constructor(deps: ProgressOverlayDeps) {
    this.deps = deps;
  }

  /** Opens (or resets) the overlay at page 1 for the active profile. */
  open(): void {
    this.close();
    this.page = 0;
    this.viewedId = getActiveProfile().id;
    this.render();
  }

  /** Destroys the Learning Progress overlay (not the panel). */
  close(): void {
    for (const object of this.deps.overlayObjects) object.destroy();
    this.deps.overlayObjects.length = 0;
  }

  /** Renders (or re-renders) the Learning Progress overlay content. */
  private render(): void {
    this.close();
    const { scene } = this.deps;
    const { width, height } = scene.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2;
    const viewedId = this.viewedId ?? getActiveProfile().id;
    const progress = getProgress(viewedId);

    const backdrop = scene.add
      .rectangle(centerX, centerY, width, height, BACKDROP_COLOR, OVERLAY_ALPHA)
      .setInteractive();
    backdrop.on("pointerdown", () => this.close());
    this.deps.overlayObjects.push(backdrop);
    this.deps.overlayObjects.push(
      scene.add
        .rectangle(centerX, centerY, PANEL_WIDTH, PANEL_HEIGHT, PANEL_COLOR)
        .setStrokeStyle(4, OUTLINE_COLOR),
    );
    this.deps.overlayObjects.push(
      scene.add
        .text(
          centerX,
          centerY - 250,
          "Learning Progress",
          textStyle({
            color: "#2d3748",
            fontSize: "36px",
          }),
        )
        .setOrigin(0.5),
    );

    const close = scene.add
      .text(
        centerX + PANEL_WIDTH / 2 - 32,
        centerY - 250,
        "X",
        textStyle({
          color: "#2d3748",
          fontSize: "32px",
        }),
      )
      .setOrigin(0.5);
    close.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(
        -TOGGLE_HEIGHT / 2,
        -TOGGLE_HEIGHT / 2,
        TOGGLE_HEIGHT,
        TOGGLE_HEIGHT,
      ),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    });
    close.on("pointerdown", () => this.close());
    this.deps.overlayObjects.push(close);

    const profiles = getProfiles();
    profiles.forEach((profile, index) => {
      const x = centerX + (index - (profiles.length - 1) / 2) * 56;
      // Persistent outline marks the profile being viewed (never color alone).
      if (profile.id === viewedId) {
        const ring = scene.add.rectangle(x, centerY - 195, VIEWED_RING_SIZE, VIEWED_RING_SIZE);
        ring.setStrokeStyle(4, OUTLINE_COLOR, 1);
        this.deps.overlayObjects.push(ring);
      }
      const chip = scene.add.image(x, centerY - 195, PROFILE_AVATAR_TEXTURES[profile.avatarId]);
      chip.setScale(64 / AVATAR_TEXTURE_SIZE);
      chip.setInteractive({
        hitArea: new Phaser.Geom.Rectangle(-48, -48, 96, 96),
        hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      });
      chip.on("pointerdown", () => {
        if (profile.id !== viewedId) {
          this.viewedId = profile.id;
          this.render();
        }
      });
      attachPressFeedback(chip);
      this.deps.overlayObjects.push(chip);
    });

    const pageStart = this.page * PROGRESS_PAGE_SIZE;
    const pageEnd = Math.min(pageStart + PROGRESS_PAGE_SIZE, PROGRESS_GAME_ROWS.length);
    for (let i = pageStart; i < pageEnd; i += 1) {
      const row = PROGRESS_GAME_ROWS[i];
      const y = centerY + PROGRESS_ROW_START_Y + (i - pageStart) * PROGRESS_ROW_PITCH;
      const game = progress[row.gameId];
      const accuracy = getAccuracy(game);

      const icon = scene.add.image(centerX - 182, y, row.tileKey);
      icon.setScale(28 / AVATAR_TEXTURE_SIZE);
      this.deps.overlayObjects.push(icon);

      const name = scene.add
        .text(
          centerX - 158,
          y,
          `${isMastered(game) ? `${MASTERY_STAR} ` : ""}${row.label}`,
          textStyle({
            color: "#2d3748",
            fontSize: "30px",
          }),
        )
        .setOrigin(0, 0.5);
      this.deps.overlayObjects.push(name);

      const stats = scene.add
        .text(
          centerX - 158,
          y + 26,
          `${game.plays} plays · ${formatAccuracyPercent(game)} · ${relativeLastPlayed(game.lastPlayedAt)}`,
          textStyle({
            color: PRIMARY_COLOR,
            fontSize: "26px",
          }),
        )
        .setOrigin(0, 0.5);
      this.deps.overlayObjects.push(stats);

      const track = scene.add.rectangle(centerX + 130, y, 120, 10, ACCURACY_TRACK_COLOR);
      this.deps.overlayObjects.push(track);
      if (accuracy !== null) {
        const fill = scene.add.rectangle(
          centerX + 70 + (accuracy * 120) / 2,
          y,
          Math.max(2, Math.round(accuracy * 120)),
          10,
          ACCURACY_FILL_COLOR,
        );
        this.deps.overlayObjects.push(fill);
      }
    }

    const pageCount = Math.ceil(PROGRESS_GAME_ROWS.length / PROGRESS_PAGE_SIZE);
    this.deps.overlayObjects.push(
      scene.add
        .text(
          centerX - 20,
          centerY + 175,
          `${this.page + 1} / ${pageCount}`,
          textStyle({
            color: DISABLED_COLOR,
            fontSize: "30px",
          }),
        )
        .setOrigin(0.5),
    );

    /**
     * Adds one explicit page-navigation chevron. The handler stays registered
     * at the bounds but no-ops, so the affordance never disappears while the
     * dimmed styling signals that the edge is reached.
     */
    const addPageChevron = (glyph: string, x: number, delta: number): void => {
      const enabled = delta < 0 ? this.page > 0 : this.page + 1 < pageCount;
      const chevron = scene.add
        .text(
          x,
          centerY + 175,
          glyph,
          textStyle({
            color: enabled ? PRIMARY_COLOR : DISABLED_COLOR,
            fontSize: "40px",
          }),
        )
        .setOrigin(0.5);
      chevron.setInteractive({
        hitArea: new Phaser.Geom.Rectangle(-48, -48, 96, 96),
        hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      });
      chevron.on("pointerdown", () => {
        const nextPage = this.page + delta;
        if (nextPage < 0 || nextPage >= pageCount) return;
        this.page = nextPage;
        this.render();
      });
      attachPressFeedback(chevron);
      this.deps.overlayObjects.push(chevron);
    };
    addPageChevron("‹", centerX - 110, -1);
    addPageChevron("›", centerX + 110, 1);

    const activity = getProfiles().find((profile) => profile.id === viewedId)?.activity ?? [];
    const totalPlays = activity.reduce((sum, entry) => sum + entry.plays, 0);
    this.deps.overlayObjects.push(
      scene.add
        .text(
          centerX,
          centerY + PROGRESS_STRIP_LABEL_Y,
          `Last 7 days · ${totalPlays} plays`,
          textStyle({
            color: "#2d3748",
            fontSize: "30px",
          }),
        )
        .setOrigin(0.5),
    );
    const maxPlays = Math.max(1, ...activity.map((entry) => entry.plays));
    const startX =
      centerX - ((PROGRESS_BAR_COUNT - 1) * (PROGRESS_BAR_WIDTH + PROGRESS_BAR_GAP)) / 2;
    for (let i = 0; i < PROGRESS_BAR_COUNT; i += 1) {
      const entry = activity[i];
      const plays = entry?.plays ?? 0;
      const barHeight =
        plays === 0 ? 4 : Math.max(10, Math.round((PROGRESS_BAR_HEIGHT * plays) / maxPlays));
      this.deps.overlayObjects.push(
        scene.add.rectangle(
          startX + i * (PROGRESS_BAR_WIDTH + PROGRESS_BAR_GAP),
          centerY + PROGRESS_STRIP_Y,
          PROGRESS_BAR_WIDTH,
          barHeight,
          ACCURACY_FILL_COLOR,
        ),
      );
    }

    // Static parent-facing note: difficulty bands adapt to recent accuracy.
    // Child-facing game UIs stay textless; this lives only where parents read.
    this.deps.overlayObjects.push(
      scene.add
        .text(
          centerX,
          centerY + 320,
          "Difficulty adapts to your kid's recent answers · disable in Settings",
          textStyle({
            color: DISABLED_COLOR,
            fontSize: "20px",
          }),
        )
        .setOrigin(0.5),
    );
  }
}
