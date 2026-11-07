import { expect, test } from "@playwright/test";
import {
  collectErrors,
  launchGame,
  openHub,
  roundIndex,
  tapTarget,
  waitForPlayableRound,
  waitForRoundIndex,
} from "../fixtures/game";

/**
 * FR-3 / AC-3, discrete-choice family: three rounds of Add It Up, tapping the
 * card the game itself marks as the total.
 *
 * The game has six rounds; three is the sample the track asks for, and stopping
 * there keeps the journey representative rather than exhaustive.
 */

test("Add It Up advances three rounds of tap choices", async ({ page }) => {
  test.setTimeout(120_000);

  const errors = collectErrors(page);
  await openHub(page);
  await launchGame(page, 15, "AddItUp");
  expect(await roundIndex(page)).toBe(0);

  for (let round = 0; round < 3; round += 1) {
    const geometry = await waitForPlayableRound(page, round);
    expect(geometry.targets, "the correct answer card is the one published target").toHaveLength(1);

    await tapTarget(page, geometry.targets[0]);
    await waitForRoundIndex(page, round + 1);
  }

  expect(errors, "answering three rounds should log no page or console errors").toEqual([]);
});
