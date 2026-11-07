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

/**
 * Presses a game-space point and holds until `reached` says the press has
 * landed, then releases.
 *
 * `holdCanvas(page, point, ms)` is a fixed wall-clock hold, and a hold is
 * *scene* time: Phaser's timer advances on the game loop, so on a loaded runner
 * running at a handful of frames per second a 3.4 s wall-clock hold can be well
 * short of the 3 s the gate counts. That is not a product defect - a real tablet
 * does not run at 8 fps - but it made this suite pass on ten local runs and fail
 * every attempt on CI (2026-11-07, PR #79). Waiting for the state instead of a
 * duration makes the journey independent of how fast the machine renders, and
 * costs nothing when it is fast. The timeout is generous because the point is to
 * fail on the state never arriving, not on the clock.
 */
export async function holdCanvasUntil(
  page: Page,
  point: GamePoint,
  reached: () => Promise<boolean>,
  timeout = 20_000,
): Promise<void> {
  const at = toPagePoint(await canvasBox(page), point);
  await page.mouse.move(at.x, at.y);
  await page.mouse.down();
  try {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      if (await reached()) return;
      await page.waitForTimeout(100);
    }
    throw new Error(
      `the press at (${point.x}, ${point.y}) never reached its state in ${timeout} ms`,
    );
  } finally {
    await page.mouse.up();
  }
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
