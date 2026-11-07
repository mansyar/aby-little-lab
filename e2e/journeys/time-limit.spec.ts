import { expect, test } from "@playwright/test";
import { tapCanvas } from "../fixtures/canvas";
import {
  activeSceneKey,
  collectErrors,
  hubPlayTime,
  hubTiles,
  openHub,
  reloadHub,
} from "../fixtures/game";
import { seedPlayTime } from "../fixtures/shell";

/**
 * FR-7 / AC-7: the daily budget is enforced on the hub.
 *
 * Two behaviours make up the budget, and they are enforced at different
 * thresholds, so the journey drives both:
 *
 * - **Near the limit** the next tap is announced with the play-time nudge, then
 *   hands off to the game.
 * - **At the cap** the tiles are locked outright: dimmed, non-interactive, with
 *   no launch at all. `isNearLimit` excludes a spent budget on purpose, so the
 *   nudge is not what a spent budget shows — the lock is.
 *
 * The seed is the app's own persisted payload, written while the app is idle
 * and read by the next boot; nothing here calls the app's storage API.
 */

test("a spent daily budget locks the hub and never launches", async ({ page }) => {
  const errors = collectErrors(page);
  await openHub(page);

  // Stage: a budget with three minutes left. The app must announce the next
  // tap before taking it.
  await seedPlayTime(page, { limitMinutes: 15, usedMinutes: 12 });
  await reloadHub(page);

  const nearLimit = await hubPlayTime(page);
  expect(
    nearLimit.timeUp,
    "three minutes left of a fifteen-minute budget should not lock the hub",
  ).toBe(false);

  const tiles = await hubTiles(page);
  const firstTile = tiles.find((tile) => tile.id === "0");
  if (!firstTile) throw new Error("the hub should publish its first game tile after the reload");

  await tapCanvas(page, firstTile);
  await expect
    .poll(async () => (await hubPlayTime(page)).nudging, {
      message: "three minutes from the cap, a tile tap should raise the play-time nudge",
      timeout: 15_000,
    })
    .toBe(true);
  expect(
    await activeSceneKey(page),
    "the nudge is an announcement, so nothing has launched while it is still up",
  ).toBe("Hub");

  // Stage: the same profile at its cap. The lock, not the nudge, is what a
  // spent budget shows.
  await seedPlayTime(page, { limitMinutes: 15, usedMinutes: 15 });
  await reloadHub(page);

  const capped = await hubPlayTime(page);
  expect(capped.timeUp, "a spent daily budget should lock the hub's tiles").toBe(true);
  expect(
    capped.nudging,
    "the nudge is the near-limit courtesy, so a spent budget shows the lock instead",
  ).toBe(false);

  const lockedTiles = await hubTiles(page);
  expect(lockedTiles.length, "a locked hub still shows the tiles it has dimmed").toBeGreaterThan(0);

  // Stage: tap a tile and watch. A refusal is only proven by looking: sample the
  // scene across a window longer than the nudge's own two-second hand-off would
  // take, so a launch that merely starts late is still caught.
  const tapped = lockedTiles.find((tile) => tile.id === "0") ?? lockedTiles[0];
  await tapCanvas(page, tapped);

  const scenes: Array<string | null> = [];
  for (let sample = 0; sample < 12; sample += 1) {
    scenes.push(await activeSceneKey(page));
    await page.waitForTimeout(250);
  }
  expect(
    scenes.every((scene) => scene === "Hub"),
    `a spent budget must never launch, but the scene went ${scenes.join(" -> ")}`,
  ).toBe(true);

  const afterTap = await hubPlayTime(page);
  expect(afterTap.timeUp, "the cap should still be in force after the tap").toBe(true);
  expect(afterTap.nudging, "a locked tile should not raise the nudge either").toBe(false);

  expect(errors, "the time-limit lock should log no page or console errors").toEqual([]);
});
