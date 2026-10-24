import type Phaser from "phaser";
import { isReducedMotion } from "../utils/motion";

/**
 * A textless retry cue for a game chunk that failed to load.
 *
 * A ring with a circular arrow sits over the tapped tile. Nothing here speaks,
 * nothing here is persisted, and the cue is silent: it exists only so a tap
 * that could not open its game offers a second try instead of a dead tile. It
 * covers one 96x96 hit floor, so the rest of the tile — and every other tile —
 * still responds to the grid.
 */

/**
 * Depth of every object the cue creates.
 *
 * Hub content — tiles, labels, sticker shelf — sits at the default depth (0).
 * The scene's own chrome sits above it: `PlayTimeNudge` and `ProfileChip`'s
 * picker at 20-21, and `ParentLock`'s hold ring at 10000. Twelve is therefore
 * above the tile the cue covers while those surfaces stay in front of it.
 * Settings is drawn over the Hub rather than at a depth of its own, so the cue
 * is torn down before the panel opens (see `HubScene`) instead of relying on
 * depth to hide it.
 */
const CUE_DEPTH = 12;

/** The cue's tappable area: the app-wide 96px touch floor. */
const CUE_HIT = 96;

/** Warm paper disc so the dark ring reads over a blue tile. */
const BACKDROP_RADIUS = CUE_HIT / 2;
const BACKDROP_COLOR = 0xfff8e7;
const BACKDROP_ALPHA = 0.9;

const RING_RADIUS = 30;
const RING_WIDTH = 5;
const RING_COLOR = 0x2d3748;

const ARROW_RADIUS = 19;
const ARROW_WIDTH = 5;
const ARROW_COLOR = 0x2b6cb0;
/** Start of the arrow's sweep, a little clockwise of 12 o'clock. */
const ARROW_START = -Math.PI / 2 + 0.7;
/** Most of a circle, leaving the tail gap that makes it read as a loop. */
const ARROW_SWEEP = Math.PI * 1.55;
const ARROW_END = ARROW_START + ARROW_SWEEP;
const ARROW_HEAD_LENGTH = 11;
const ARROW_HEAD_HALF_WIDTH = 7;

/** Gentle "still here" pulse; never animated under reduced motion (NFR-4). */
const PULSE_SCALE = 1.06;
const PULSE_DURATION = 900;

export interface GameLoadCueDeps {
  /** Called when the child taps the cue. */
  onRetry: () => void;
  /** Centre of the tile the cue sits on, in scene coordinates. */
  x: number;
  y: number;
}

export interface GameLoadCue {
  /** Draws the cue over the given tile. No-op while one is already up. */
  show(deps: GameLoadCueDeps): void;
  /** True while the cue is on screen. */
  isActive(): boolean;
  /** Removes the cue, its tween, its handler and the shutdown hook. Idempotent. */
  destroy(): void;
}

/** Paints the cue's ring and circular arrow around the graphics object's origin. */
function drawCue(graphics: Phaser.GameObjects.Graphics): void {
  graphics.fillStyle(BACKDROP_COLOR, BACKDROP_ALPHA);
  graphics.fillCircle(0, 0, BACKDROP_RADIUS);

  graphics.lineStyle(RING_WIDTH, RING_COLOR, 1);
  graphics.strokeCircle(0, 0, RING_RADIUS);

  // Arrow: a long arc ending in a filled head, drawn at the arc's tip and
  // pointing along the tangent (the direction the loop travels).
  graphics.lineStyle(ARROW_WIDTH, ARROW_COLOR, 1);
  graphics.beginPath();
  graphics.arc(0, 0, ARROW_RADIUS, ARROW_START, ARROW_END, false);
  graphics.strokePath();

  const tipX = Math.cos(ARROW_END) * ARROW_RADIUS;
  const tipY = Math.sin(ARROW_END) * ARROW_RADIUS;
  const axisX = -Math.sin(ARROW_END);
  const axisY = Math.cos(ARROW_END);
  const normalX = -axisY;
  const normalY = axisX;
  graphics.fillStyle(ARROW_COLOR, 1);
  graphics.beginPath();
  graphics.moveTo(tipX + axisX * ARROW_HEAD_LENGTH, tipY + axisY * ARROW_HEAD_LENGTH);
  graphics.lineTo(tipX + normalX * ARROW_HEAD_HALF_WIDTH, tipY + normalY * ARROW_HEAD_HALF_WIDTH);
  graphics.lineTo(tipX - normalX * ARROW_HEAD_HALF_WIDTH, tipY - normalY * ARROW_HEAD_HALF_WIDTH);
  graphics.fillPath();
}

/**
 * Creates one cue bound to `scene`, removed automatically on scene shutdown.
 *
 * One cue exists at a time: `show()` while active is a no-op (a second failure
 * must not stack a second cue), and a destroyed cue is terminal — its shutdown
 * hook is detached, so the caller builds a fresh one for the next failure.
 */
export function createGameLoadCue(scene: Phaser.Scene): GameLoadCue {
  let active = false;
  let destroyed = false;
  let graphics: Phaser.GameObjects.Graphics | null = null;
  let hitArea: Phaser.GameObjects.Rectangle | null = null;
  let pulse: Phaser.Tweens.Tween | null = null;
  let onRetry: (() => void) | null = null;

  function stopPulse(): void {
    pulse?.remove();
    pulse = null;
  }

  function handlePointerUp(): void {
    // The handler is detached on destroy; the guard covers a double tap that
    // queued before the caller's retry destroyed the cue.
    if (!active || destroyed) return;
    const retry = onRetry;
    onRetry = null;
    retry?.();
  }

  function show(deps: GameLoadCueDeps): void {
    if (destroyed || active) return;
    active = true;
    onRetry = deps.onRetry;

    // The one scene the factory took owns the drawing, the tween and the
    // `shutdown` hook, so the cue can never straddle two.
    const cueGraphics = scene.add.graphics();
    // Drawn around its own origin so the pulse scales around the cue centre
    // rather than around the graphics object's default top-left.
    cueGraphics.setPosition(deps.x, deps.y);
    cueGraphics.setDepth(CUE_DEPTH);
    drawCue(cueGraphics);
    graphics = cueGraphics;

    // Invisible, but a real 96x96 hit floor: taps on the ring retry, taps
    // anywhere else on the tile still reach the grid underneath.
    const hit = scene.add.rectangle(deps.x, deps.y, CUE_HIT, CUE_HIT);
    hit.setFillStyle(0x000000, 0);
    hit.setDepth(CUE_DEPTH);
    hit.setInteractive();
    hit.on("pointerup", handlePointerUp);
    hitArea = hit;

    if (isReducedMotion()) return;
    pulse = scene.tweens.add({
      targets: cueGraphics,
      scale: PULSE_SCALE,
      duration: PULSE_DURATION,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });
  }

  function destroy(): void {
    if (destroyed) return;
    destroyed = true;
    active = false;
    onRetry = null;
    stopPulse();
    scene.events.off("shutdown", destroy);
    hitArea?.off("pointerup", handlePointerUp);
    hitArea?.destroy();
    hitArea = null;
    graphics?.destroy();
    graphics = null;
  }

  scene.events.once("shutdown", destroy);

  return {
    show,
    isActive: () => active,
    destroy,
  };
}
