import { expect, test } from "@playwright/test";
import {
  collectErrors,
  launchGame,
  openHub,
  profileCount,
  roundIndex,
  stickerCount,
  waitForPlayableRound,
  waitForScene,
} from "../fixtures/game";
import { traceCurrentPath } from "../fixtures/trace";

/**
 * FR-4 / AC-4: winning a game awards one sticker and the game hands the player
 * back to the hub on its own.
 *
 * Animal Trace is the shortest whole game in the roster — three traced paths —
 * so the journey reaches the win screen without 180 seconds of tap-a-card.
 */

test("winning awards exactly one sticker and returns to the hub unaided", async ({ page }) => {
  test.setTimeout(120_000);

  const errors = collectErrors(page);
  await openHub(page);
  expect(await profileCount(page)).toBe(1);
  expect(await stickerCount(page), "a fresh profile starts with no stickers").toBe(0);

  await launchGame(page, 1, "AnimalTrace");
  expect(await roundIndex(page)).toBe(0);

  for (let round = 0; round < 3; round += 1) {
    await waitForPlayableRound(page, round);
    await traceCurrentPath(page, round);
  }

  // The win is recorded when the third path completes, before the game leaves.
  await expect
    .poll(() => stickerCount(page), {
      message: "winning should award exactly one sticker",
      timeout: 10_000,
    })
    .toBe(1);

  // No back hold, no navigation input: the game returns on its own delay.
  await waitForScene(page, "Hub", 10_000);
  expect(await stickerCount(page), "the sticker survives the return").toBe(1);

  expect(errors, "winning a game should log no page or console errors").toEqual([]);
});
