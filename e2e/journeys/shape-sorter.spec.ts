import { expect, test } from "@playwright/test";
import { dragCanvas } from "../fixtures/canvas";
import {
  collectErrors,
  launchGame,
  openHub,
  roundGeometry,
  roundIndex,
  waitForPlayableRound,
  waitForRoundIndex,
} from "../fixtures/game";

/**
 * FR-3 / AC-3, drag family: three rounds of Shape Sorter, each shape dragged
 * onto the hole the bridge says shares its id.
 *
 * The drags are real pointer gestures with intermediate moves — a drag that
 * only teleports would pass a hit-area bug straight through.
 */

test("Shape Sorter advances three rounds of drag and drop", async ({ page }) => {
  test.setTimeout(180_000);

  const errors = collectErrors(page);
  await openHub(page);
  await launchGame(page, 0, "ShapeSorter");
  expect(await roundIndex(page)).toBe(0);

  for (let round = 0; round < 3; round += 1) {
    const opening = await waitForPlayableRound(page, round);
    expect(opening.targets.length, "each round should drop more than one shape").toBeGreaterThan(1);
    expect(
      new Set(opening.targets.map((target) => target.id)).size,
      "ids pair targets with slots, so they must be unique within a round",
    ).toBe(opening.targets.length);

    const placed = new Set<string>();
    while (placed.size < opening.targets.length) {
      // Re-read: a wrong drop bounces a shape home, and the report must match
      // what is on the board right now rather than what it was a second ago.
      const live = await roundGeometry(page);
      const target = live?.targets.find((candidate) => !placed.has(candidate.id));
      const slot = live?.slots?.find((candidate) => candidate.id === target?.id);
      if (!target || !slot) {
        throw new Error(`round ${round} lost the pair for ${placed.size} placed shape(s)`);
      }

      await dragCanvas(page, target, slot);
      placed.add(target.id);
    }

    await waitForRoundIndex(page, round + 1);
  }

  expect(errors, "playing three rounds should log no page or console errors").toEqual([]);
});
