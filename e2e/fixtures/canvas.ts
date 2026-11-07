import type { Page } from "@playwright/test";

/**
 * Canvas geometry, converted once for every journey.
 *
 * The game renders a fixed 1024x768 logical canvas. `Phaser.Scale.FIT` scales it
 * uniformly into the viewport, so at 16:9 the board is letterboxed with bars on
 * the left and right. A journey that assumed the canvas filled the window would
 * tap a few hundred pixels off at the edges — invisible on the first tile and
 * fatal on the last — so every canvas point goes through {@link toPagePoint}.
 */

/** The game's logical canvas width, in game pixels. */
export const GAME_WIDTH = 1024;

/** The game's logical canvas height, in game pixels. */
export const GAME_HEIGHT = 768;

/** A point the bridge published, in 1024x768 game pixels. */
export interface GamePoint {
  x: number;
  y: number;
}

/** The canvas's page-space box, as the browser reports it. */
export interface CanvasBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Reads the canvas's box once per gesture batch. */
export async function canvasBox(page: Page): Promise<CanvasBox> {
  const box = await page.locator("canvas").boundingBox();
  if (!box) throw new Error("the game canvas has no box yet");
  return box;
}

/**
 * Maps a game-space point onto the page, honouring the letterbox: the canvas is
 * scaled by `box.width / 1024` and offset by `box.x`.
 */
export function toPagePoint(box: CanvasBox, point: GamePoint): GamePoint {
  return {
    x: box.x + point.x * (box.width / GAME_WIDTH),
    y: box.y + point.y * (box.height / GAME_HEIGHT),
  };
}

/** Taps a game-space point with a real pointer down/up pair. */
export async function tapCanvas(page: Page, point: GamePoint): Promise<void> {
  const at = toPagePoint(await canvasBox(page), point);
  await page.mouse.move(at.x, at.y);
  await page.mouse.down();
  await page.mouse.up();
}

/**
 * Drags from one game-space point to another with real pointer moves.
 *
 * The extra intermediate moves are required, not cosmetic: the board ignores a
 * gesture shorter than its 10 px drag threshold, and the trace game samples
 * pointermove positions along the way.
 */
export async function dragCanvas(page: Page, from: GamePoint, to: GamePoint): Promise<void> {
  const box = await canvasBox(page);
  const start = toPagePoint(box, from);
  const end = toPagePoint(box, to);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x, start.y + 1, { steps: 2 });
  await page.mouse.move(end.x, end.y, { steps: 12 });
  await page.mouse.up();
}

/** Presses a game-space point and holds it for `ms` before releasing. */
export async function holdCanvas(page: Page, point: GamePoint, ms: number): Promise<void> {
  const at = toPagePoint(await canvasBox(page), point);
  await page.mouse.move(at.x, at.y);
  await page.mouse.down();
  await page.waitForTimeout(ms);
  await page.mouse.up();
}

/** Presses at a game-space point without releasing. */
export async function pressCanvas(page: Page, point: GamePoint): Promise<void> {
  const at = toPagePoint(await canvasBox(page), point);
  await page.mouse.move(at.x, at.y);
  await page.mouse.down();
}

/** Moves the held pointer to a game-space point. */
export async function moveCanvas(page: Page, point: GamePoint, steps = 8): Promise<void> {
  const at = toPagePoint(await canvasBox(page), point);
  await page.mouse.move(at.x, at.y, { steps });
}

/** Releases the held pointer. */
export async function releasePointer(page: Page): Promise<void> {
  await page.mouse.up();
}
