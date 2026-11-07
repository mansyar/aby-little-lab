import { expect, test } from "@playwright/test";
import {
  collectErrors,
  launchGame,
  openHub,
  roundIndex,
  waitForPlayableRound,
  waitForRoundIndex,
} from "../fixtures/game";
import { traceCurrentPath } from "../fixtures/trace";

/**
 * FR-3 / AC-3, gesture family: three rounds of Animal Trace.
 *
 * The bridge publishes only the waypoints still ahead, in order, and the tail
 * shrinks as the trail advances — so the gesture is re-aimed after every move
 * instead of replaying a path remembered from the start.
 */

test("Animal Trace completes three traced rounds", async ({ page }) => {
  test.setTimeout(180_000);

  const errors = collectErrors(page);
  await openHub(page);
  await launchGame(page, 1, "AnimalTrace");
  expect(await roundIndex(page)).toBe(0);

  for (let round = 0; round < 3; round += 1) {
    // Guards the round the bridge claims to be on before the gesture starts.
    await waitForPlayableRound(page, round);
    await traceCurrentPath(page, round);
    await waitForRoundIndex(page, round + 1);
  }

  expect(errors, "tracing three rounds should log no page or console errors").toEqual([]);
});
