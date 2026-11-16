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
 * How long two animation frames may take before the canvas counts as stalled.
 *
 * A frame or two at 1 fps is a loaded runner; several seconds with no frame at
 * all is a game loop that has stopped, and every gesture below depends on that
 * loop to recognise the press it is given.
 */
export const FRAME_STALL_MS = 2_000;

/** The number of consecutive frames that prove the canvas is still rendering. */
const TICK_FRAMES = 2;

/**
 * The most frames a hold may take before the press counts as lost.
 *
 * A hold is counted in frames, not seconds. Phaser advances its timers by a
 * smoothed per-frame delta, so the same three-second hold costs about 180 frames
 * at 60 fps and roughly the same number of frames on a starved runner, where it
 * takes far longer in wall-clock time. Measured on the built artifact against
 * the parental gate: 3.2 s at 73 fps (unthrottled), 8.2 s at 17.5 fps and 10.9 s
 * at 18.6 fps with the CPU throttled 6x and 20x through CDP - 200 to 230 frames
 * each time, and the gate opened on every run. Giving a hold 20 s of wall clock
 * is therefore a budget that shrinks exactly when the runner gets busy, which is
 * how the backup journey failed on CI under three Playwright workers.
 */
export const HOLD_FRAME_BUDGET = 300;

/**
 * The wall-clock ceiling for a hold, so a runner slow enough to need minutes
 * fails as a frames message instead of timing the journey out from underneath.
 */
const HOLD_CEILING_MS = 90_000;

/**
 * Waits for `TICK_FRAMES` consecutive animation frames and returns how long they
 * took, or null when they did not arrive inside `timeoutMs`.
 *
 * This is the liveness probe every gesture needs. Playwright's mouse events are
 * delivered to the page, but a press only becomes a hold when the game's own
 * loop advances: the parental gate counts frames, and a scene that is not
 * rendering never counts anything. Testing the loop directly keeps the failure
 * honest - a stalled canvas says so, instead of looking like a press that was
 * never recognised.
 */
export async function canvasTicks(
  page: Page,
  timeoutMs = FRAME_STALL_MS * 3,
): Promise<number | null> {
  return page.evaluate(
    ({ frames, timeoutMs: limit }) =>
      new Promise<number | null>((resolve) => {
        const started = performance.now();
        let seen = 0;
        let settled = false;
        const guard = setTimeout(() => {
          if (settled) return;
          settled = true;
          resolve(null);
        }, limit);
        const step = () => {
          seen += 1;
          if (seen >= frames) {
            if (settled) return;
            settled = true;
            clearTimeout(guard);
            resolve(performance.now() - started);
            return;
          }
          requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }),
    { frames: TICK_FRAMES, timeoutMs },
  );
}

/** The message every stalled-canvas failure carries. */
function stalled(where: string): Error {
  return new Error(
    `the canvas stopped ticking ${where}: ${TICK_FRAMES} animation frames did not arrive within ${FRAME_STALL_MS} ms`,
  );
}

/**
 * Presses a game-space point and holds until `reached` says the press has
 * landed, then releases.
 *
 * `holdCanvas(page, point, ms)` is a fixed wall-clock hold, and a hold is
 * *frames*: Phaser advances its timers by a smoothed per-frame delta, so on a
 * loaded runner a 3.4 s wall-clock hold can be well short of the hold the gate
 * counts. That is not a product defect - a real tablet does not run at 8 fps -
 * but it made this suite pass on ten local runs and fail on CI (2026-11-07, PR
 * #79). Waiting for the state instead of a duration makes the journey
 * independent of how fast the machine renders.
 *
 * The wait is bounded by frames ({@link HOLD_FRAME_BUDGET}) rather than seconds,
 * and it fails three different ways so the message names the cause:
 *
 * - the canvas stops rendering mid-hold - `the canvas stopped ticking`;
 * - the press has had every frame a hold can need and the state still has not
 *   arrived - that is a lost press or a state bug, not a slow runner;
 * - a runner so slow that the frames alone take {@link HOLD_CEILING_MS}, which
 *   fails in frames rather than letting the journey time out.
 *
 * The hold also starts only once the canvas is provably ticking, because a press
 * sent into a page that has not painted yet is a press nothing can count.
 */
export async function holdCanvasUntil(
  page: Page,
  point: GamePoint,
  reached: () => Promise<boolean>,
  frames = HOLD_FRAME_BUDGET,
): Promise<void> {
  const at = toPagePoint(await canvasBox(page), point);
  const where = `the press at (${point.x}, ${point.y})`;

  if ((await canvasTicks(page)) === null) {
    throw stalled(`before ${where} was sent`);
  }

  await page.mouse.move(at.x, at.y);
  await page.mouse.down();
  const started = Date.now();
  let seen = 0;
  try {
    for (;;) {
      // One probe is one wait: two frames of the page, then the state those
      // frames may have changed.
      if ((await canvasTicks(page, FRAME_STALL_MS)) === null) {
        throw stalled(`while ${where} was held, after ${seen} frames`);
      }
      seen += TICK_FRAMES;
      if (await reached()) return;

      const elapsed = Date.now() - started;
      if (seen >= frames || elapsed >= HOLD_CEILING_MS) {
        throw new Error(
          `${where} did not reach its state after ${seen} frames in ${elapsed} ms ` +
            `(${Math.round(seen / (elapsed / 1000))} fps): a hold that is still being counted would ` +
            `have landed by ${frames} frames`,
        );
      }
    }
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
