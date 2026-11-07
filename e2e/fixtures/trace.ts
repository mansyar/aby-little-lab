import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { moveCanvas, pressCanvas, releasePointer } from "./canvas";
import { roundGeometry, waitForPlayableRound } from "./game";

/**
 * Traces one Animal Trace path as a single continuous gesture.
 *
 * The bridge publishes only the waypoints still ahead, in order, and the tail
 * shrinks as the trail advances — so the gesture is re-aimed after every move
 * instead of replaying a path remembered from the start.
 */
export async function traceCurrentPath(page: Page, round: number): Promise<void> {
  const opening = await waitForPlayableRound(page, round);

  // One press for the whole trail: the trace is a gesture, not a series of
  // taps, and releasing mid-path would be a different input.
  await pressCanvas(page, opening.targets[0]);

  let lastLength = Number.POSITIVE_INFINITY;
  for (;;) {
    const live = await roundGeometry(page);
    const next = live?.targets[0];
    if (!next) break;
    expect(live?.targets.length, "the tail shrinks on every accepted waypoint").toBeLessThan(
      lastLength,
    );
    lastLength = live?.targets.length ?? 0;
    await moveCanvas(page, next);
  }

  await releasePointer(page);
}
