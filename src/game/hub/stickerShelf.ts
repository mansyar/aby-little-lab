import { isReducedMotion } from "../../utils/motion";
import { hasSticker } from "../../utils/storage";
import { displayScale } from "../../utils/textureTiers";
import { stickerKeyForGame } from "../gameRegistry";
import type { HubGrid } from "../hubGrid";
import { GAME_TILES } from "../hubTiles";
import { animateEntrance, type EntranceScene } from "./gridLayout";
import { ENTRANCE_DURATION, ENTRANCE_STAGGER, TILE_HEIGHT } from "./hubGridConstants";

/**
 * Sticker-shelf presentation logic, extracted from the `hubGrid.ts`
 * orchestrator: the shelf's vertical placement math, the dashed empty-slot
 * ring, and the sparkle/burst animations for earned stickers.
 *
 * Pure logic first (no runtime Phaser import — the dragBoard/gridLayout
 * precedent): the ring draws on a minimal structural graphics surface and the
 * animations build tween configs on the shared structural tween surface, so
 * tests drive them with plain mock objects. Object creation (the thumbnail
 * images and slot graphics) and the per-build sticker/slot lists stay with
 * the orchestrator.
 */

/**
 * Display size of sticker thumbnails / empty-slot rings on a wide tile (px).
 *
 * The shelf has to live in the band between the label and the tile's bottom
 * edge: the label baseline sits at +20 and its 17px box ends around +30, and
 * the tile's bottom edge is at +58 (TILE_HEIGHT 116). 22px is the largest
 * plaque that clears the label and keeps a 3px inset from the edge — a 56px
 * plaque (sized for the old 160x116 tile with no bottom inset) covered the
 * game name once the grid reflowed.
 */
export const STICKER_DISPLAY_SIZE = 22;
/** Gap between the shelf's bottom edge and the tile's bottom edge (px). */
export const STICKER_SHELF_INSET = 3;
/** Alpha of the dashed empty-slot outline for unearned stickers. */
export const EMPTY_SLOT_ALPHA = 0.55;
/** Stroke width of the dashed empty-slot outline (px). */
export const EMPTY_SLOT_LINE_WIDTH = 4;
/** Number of dashes in the empty-slot circle. */
export const EMPTY_SLOT_DASH_COUNT = 10;
/** Entrance scale for the just-earned sticker. */
export const JUST_EARNED_SCALE = 1.15;
/** Duration of the gentle sparkle shimmer loop (ms). */
export const SPARKLE_DURATION = 800;
/** Peak alpha of the sparkle shimmer loop. */
export const SPARKLE_ALPHA = 0.75;
/** Scale of the just-earned sparkle burst pulse. */
export const BURST_SCALE = 1.25;
/** Duration of the just-earned sparkle burst pulse (ms). */
export const BURST_DURATION = 500;

/**
 * Paged (narrow-viewport) shelf constant. Tile size, spacing and centering
 * live in src/game/hubPaging.ts (PAGED_TILE_*), the per-tile icon/label
 * furniture offsets in src/game/hub/hubGridConstants.ts (PAGED_ICON_*,
 * PAGED_LABEL_*), and the paged interaction constants in
 * src/game/hub/pageBoard.ts (PAGE_*).
 */
/**
 * Display size of sticker thumbnails / empty-slot rings on a paged tile (px).
 * The 196px-tall tile keeps the same label-to-bottom band proportion as the
 * wide tile, so the plaque is proportionally larger but still below the label.
 */
export const PAGED_STICKER_DISPLAY_SIZE = 30;

/**
 * Vertical center of the shelf plaque for a tile centered at `ty` on a tile
 * of `tileHeight` px with a `shelfSize` px plaque.
 *
 * The shelf hangs off the tile's bottom edge with a fixed inset, so it sits
 * BELOW the label instead of over the game name: on a wide tile the plaque
 * spans +33..+55 (label box ends ~+30, tile edge +58); on a paged tile
 * +65..+95 (label ends ~+60, tile edge +98).
 */
export function shelfStickerY(ty: number, tileHeight: number, shelfSize: number): number {
  return ty + tileHeight / 2 - STICKER_SHELF_INSET - shelfSize / 2;
}

/** Minimal graphics surface the dashed ring draws on. */
export interface SlotRingGraphics {
  lineStyle(width: number, color: number, alpha: number): unknown;
  beginPath(): unknown;
  arc(
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    anticlockwise?: boolean,
  ): unknown;
  strokePath(): unknown;
}

/**
 * Draws the dashed circle outline where an unearned sticker will appear,
 * communicating the collection goal textlessly in place of a dimmed ghost.
 * The ring is drawn around (0, 0) — the object itself is anchored at the slot
 * center by the caller, so page-slide tweens can move the slot by position.
 */
export function drawDashedSlotRing(graphics: SlotRingGraphics, radius: number): void {
  graphics.lineStyle(EMPTY_SLOT_LINE_WIDTH, 0xffffff, EMPTY_SLOT_ALPHA);
  const segment = (Math.PI * 2) / EMPTY_SLOT_DASH_COUNT / 2;
  for (let i = 0; i < EMPTY_SLOT_DASH_COUNT; i++) {
    const start = i * segment * 2;
    graphics.beginPath();
    graphics.arc(0, 0, radius, start, start + segment, false);
    graphics.strokePath();
  }
}

/** Display object the slot fade lands the final alpha on. */
interface FadeTarget {
  setAlpha: (alpha: number) => unknown;
}

/**
 * Fades an empty-slot ring in with the per-build entrance stagger. Under
 * reduced motion the fade-in is skipped and the ring lands directly at its
 * final alpha.
 * @param index - Stagger slot for this element (0-based, per build).
 */
export function fadeSlotIn(scene: EntranceScene, target: FadeTarget, index: number): void {
  const config = {
    targets: target,
    alpha: EMPTY_SLOT_ALPHA,
    delay: index * ENTRANCE_STAGGER,
    duration: ENTRANCE_DURATION,
    ease: "Sine.out",
  };
  if (isReducedMotion()) {
    // Reduced motion skips the fade-in and lands directly at final alpha.
    target.setAlpha(EMPTY_SLOT_ALPHA);
  } else {
    target.setAlpha(0);
    scene.tweens.add(config);
  }
}

/** Gentle alpha shimmer loop for earned stickers (no-op under reduced motion). */
export function addSparkle(scene: EntranceScene, sticker: unknown): void {
  if (isReducedMotion()) return;
  scene.tweens.add({
    targets: sticker,
    alpha: SPARKLE_ALPHA,
    duration: SPARKLE_DURATION,
    yoyo: true,
    repeat: -1,
    ease: "Sine.inOut",
  });
}

/** Sparkle burst for the just-earned sticker: shimmer plus scale pulse. */
export function addJustEarnedBurst(
  scene: EntranceScene,
  sticker: unknown,
  stickerScale: number,
): void {
  addSparkle(scene, sticker);
  if (isReducedMotion()) return;
  scene.tweens.add({
    targets: sticker,
    scaleX: BURST_SCALE * stickerScale,
    scaleY: BURST_SCALE * stickerScale,
    duration: BURST_DURATION,
    yoyo: true,
    repeat: -1,
    ease: "Sine.inOut",
  });
}

/** Display object the just-earned entrance resets alpha/scale on. */
interface JustEarnedTarget {
  setAlpha: (alpha: number) => unknown;
  setScale: (scale: number) => unknown;
}

/** Minimal tween-builder config the shelf animations need. */
interface ShelfTweenConfig {
  targets: unknown;
  alpha?: number;
  delay?: number;
  duration?: number;
  ease?: string;
  yoyo?: boolean;
  repeat?: number;
  scaleX?: number;
  scaleY?: number;
  onComplete?: () => void;
}

/**
 * Brings the just-earned sticker in with a larger Back.out bounce and a
 * sparkle burst (scale pulse + shimmer). Under reduced motion only alpha —
 * the sticker keeps its enlarged {@link JUST_EARNED_SCALE} size as the
 * static "new!" cue instead.
 * @param index - Stagger slot for this element (0-based, per build).
 */
export function animateJustEarned(
  scene: EntranceScene,
  sticker: JustEarnedTarget,
  stickerScale: number,
  index: number,
): void {
  sticker.setScale(stickerScale * JUST_EARNED_SCALE);
  const config: ShelfTweenConfig = {
    targets: sticker,
    alpha: 1,
    delay: index * ENTRANCE_STAGGER,
    duration: ENTRANCE_DURATION,
    ease: "Back.out",
  };
  sticker.setAlpha(0);
  if (!isReducedMotion()) {
    sticker.setScale(0);
    config.scaleX = JUST_EARNED_SCALE * stickerScale;
    config.scaleY = JUST_EARNED_SCALE * stickerScale;
    config.onComplete = () => addJustEarnedBurst(scene, sticker, stickerScale);
  }
  scene.tweens.add(config);
}

/**
 * Creates one shelf sticker thumbnail for the given tile, reflecting storage:
 * an earned sticker gets its tier-scaled thumbnail (with the just-earned
 * burst or the gentle entrance + sparkle), an unearned one gets the dashed
 * empty-slot ring. Object creation moved here from the orchestrator; the
 * sticker/slot lists and the entrance counter stay on the grid.
 */
export function createShelfSticker(
  grid: HubGrid,
  index: number,
  x: number,
  y: number,
  tileHeight = TILE_HEIGHT,
  shelfSize = STICKER_DISPLAY_SIZE,
): void {
  const scene = grid.deps.scene;
  const earned = hasSticker(GAME_TILES[index].gameId);
  const stickerY = shelfStickerY(y, tileHeight, shelfSize);

  if (earned) {
    // Derive the thumbnail scale from THIS sticker's raster tier instead of a
    // single hardcoded key, so a future tier change cannot shrink or grow
    // only some of the twenty shelf stickers.
    const stickerKey = stickerKeyForGame(GAME_TILES[index].gameId);
    const stickerScale = displayScale(stickerKey, shelfSize);
    const sticker = scene.add.image(x, stickerY, stickerKey);
    grid.stickerImages.push(sticker);
    if (GAME_TILES[index].gameId === grid.justEarned) {
      animateJustEarned(scene, sticker, stickerScale, grid.entranceIndex++);
    } else {
      sticker.setScale(stickerScale);
      animateEntrance(scene, [sticker], grid.entranceIndex++, {
        onComplete: () => addSparkle(scene, sticker),
        targetScale: stickerScale,
      });
    }
  } else {
    drawEmptySlot(grid, x, stickerY, shelfSize / 2);
  }
}

/**
 * Draws a dashed circle outline where an unearned sticker will appear,
 * communicating the collection goal textlessly in place of a dimmed ghost.
 * Anchored at the slot center so page-slide tweens can move it by position.
 */
export function drawEmptySlot(
  grid: HubGrid,
  x: number,
  y: number,
  radius = STICKER_DISPLAY_SIZE / 2,
): void {
  const graphics = grid.deps.scene.add.graphics();
  // Anchor the object at the slot center and draw the dashed ring around
  // (0, 0), so page-slide tweens can move the slot by its position.
  graphics.setPosition(x, y);
  grid.emptySlotGraphics.push(graphics);
  drawDashedSlotRing(graphics, radius);
  fadeSlotIn(grid.deps.scene, graphics, grid.entranceIndex++);
}
