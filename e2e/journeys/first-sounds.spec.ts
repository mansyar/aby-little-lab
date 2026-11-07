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
 * FR-3 / AC-3, literacy family: three rounds of First Sounds, tapping the letter
 * the game pairs with the spoken word.
 */

test("First Sounds advances three rounds of letter taps", async ({ page }) => {
  test.setTimeout(120_000);

  const errors = collectErrors(page);
  await openHub(page);
  await launchGame(page, 11, "FirstSounds");
  expect(await roundIndex(page)).toBe(0);

  for (let round = 0; round < 3; round += 1) {
    const geometry = await waitForPlayableRound(page, round);
    expect(geometry.targets, "one correct letter per round").toHaveLength(1);

    await tapTarget(page, geometry.targets[0]);
    await waitForRoundIndex(page, round + 1);
  }

  expect(errors, "answering three rounds should log no page or console errors").toEqual([]);
});
