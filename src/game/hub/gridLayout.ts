import { isReducedMotion } from "../../utils/motion";
import {
  BOB_AMPLITUDE,
  BOB_DURATION,
  BOB_PHASE_OFFSET,
  BOB_SETTLE_DELAY,
  ENTRANCE_DURATION,
  ENTRANCE_STAGGER,
  GRID_COLS,
  GRID_ROWS,
  TILE_HEIGHT,
  TILE_ICON_TEXTURE_SIZE,
  TILE_SPACING,
  TILE_WIDTH,
} from "./hubGridConstants";

/**
 * Wide/paged tile-grid geometry plus the shared entrance pop and idle
 * breathe-bob animations, extracted from the `hubGrid.ts` orchestrator.
 *
 * Pure logic first (no runtime Phaser import — the dragBoard.ts precedent):
 * geometry helpers take plain numbers, and the tween-owning surface is a
 * minimal structural interface so tests drive it with plain mock objects.
 */

/** Top-left origin of the centered wide 6x4 grid in logical canvas space. */
export interface WideGridOrigin {
  startX: number;
  startY: number;
}

/** Minimal tween-builder config the entrance/bob animations need. */
interface EntranceTweenConfig {
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

/** Minimal tween-owning scene surface (mock-friendly; no runtime Phaser import). */
export interface EntranceScene {
  tweens: { add(config: EntranceTweenConfig): unknown };
}

/** Display object the entrance pop resets alpha/scale on before tweening. */
interface EntranceTarget {
  setAlpha: (alpha: number) => unknown;
  setScale: (scale: number) => unknown;
}

/** Options for the entrance pop beyond its stagger index. */
export interface EntranceOptions {
  /** Invoked when the entrance tween finishes. */
  onComplete?: () => void;
  /** Scale to end at (defaults to 1; pre-sized objects pass their display scale). */
  targetScale?: number;
}

/**
 * Computes the top-left origin that centers the wide 6x4 grid (rows 6/6/6/4)
 * inside the given logical canvas size.
 */
export function wideGridOrigin(canvasWidth: number, canvasHeight: number): WideGridOrigin {
  return {
    startX: (canvasWidth - GRID_COLS * TILE_WIDTH - (GRID_COLS - 1) * TILE_SPACING) / 2,
    startY: (canvasHeight - GRID_ROWS * TILE_HEIGHT - (GRID_ROWS - 1) * TILE_SPACING) / 2,
  };
}

/** Computes the center of tile `index` (0-based, row-major) in the wide grid. */
export function wideTileCenter(index: number, origin: WideGridOrigin): { x: number; y: number } {
  const col = index % GRID_COLS;
  const row = Math.floor(index / GRID_COLS);
  return {
    x: origin.startX + col * (TILE_WIDTH + TILE_SPACING) + TILE_WIDTH / 2,
    y: origin.startY + row * (TILE_HEIGHT + TILE_SPACING) + TILE_HEIGHT / 2,
  };
}

/**
 * Fades (and, under normal motion, scales) an element in with a per-element
 * stagger. Under reduced motion only alpha is animated.
 * @param index - Stagger slot for this element (0-based, per build).
 * @param options - Optional completion hook and final scale.
 */
export function animateEntrance(
  scene: EntranceScene,
  targets: Iterable<unknown>,
  index: number,
  options: EntranceOptions = {},
): void {
  const config: EntranceTweenConfig = {
    targets,
    alpha: 1,
    delay: index * ENTRANCE_STAGGER,
    duration: ENTRANCE_DURATION,
    ease: "Sine.out",
  };
  if (options.onComplete) {
    config.onComplete = options.onComplete;
  }

  for (const target of targets) {
    const tweenable = target as EntranceTarget;
    tweenable.setAlpha(0);
    if (!isReducedMotion()) {
      tweenable.setScale(0);
      config.scaleX = options.targetScale ?? 1;
      config.scaleY = options.targetScale ?? 1;
    }
  }

  scene.tweens.add(config);
}

/**
 * Adds the idle breathe pulse for one tile: tile+label pulse to
 * {@link BOB_AMPLITUDE}, the icon pulses from its own display scale. Starts
 * after the entrance pop settles; staggered per tile for a travelling wave.
 * No-op under reduced motion.
 *
 * Scale-only motion keeps icon/label/shelf geometry fixed (a vertical bob
 * could collide with the fixed shelf slots).
 */
export function addBreatheTweens(
  scene: EntranceScene,
  index: number,
  tile: unknown,
  label: unknown,
  icon: unknown,
  iconDisplay: number,
): void {
  if (isReducedMotion()) return;
  const delay = ENTRANCE_DURATION + BOB_SETTLE_DELAY + index * BOB_PHASE_OFFSET;
  scene.tweens.add({
    targets: [tile, label],
    scaleX: BOB_AMPLITUDE,
    scaleY: BOB_AMPLITUDE,
    duration: BOB_DURATION,
    yoyo: true,
    repeat: -1,
    ease: "Sine.inOut",
    delay,
  });
  const iconScale = iconDisplay * BOB_AMPLITUDE * (1 / TILE_ICON_TEXTURE_SIZE);
  scene.tweens.add({
    targets: [icon],
    scaleX: iconScale,
    scaleY: iconScale,
    duration: BOB_DURATION,
    yoyo: true,
    repeat: -1,
    ease: "Sine.inOut",
    delay,
  });
}
