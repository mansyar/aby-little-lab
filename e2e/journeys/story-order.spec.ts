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
 * FR-3 / AC-3, sequencing family: three rounds of Story Order, dragging each
 * panel into the slot that shares its id.
 *
 * Panels are re-read before every drag: a placed panel reports its slot
 * position, not its tray position.
 */

test("Story Order sequences three rounds of panels", async ({ page }) => {
  test.setTimeout(180_000);

  const errors = collectErrors(page);
  await openHub(page);
  await launchGame(page, 21, "StoryOrder");
  expect(await roundIndex(page)).toBe(0);

  for (let round = 0; round < 3; round += 1) {
    const opening = await waitForPlayableRound(page, round);
    const slots = opening.slots;
    expect(slots, "a sequencing round publishes its slots").toBeDefined();
    expect(slots?.length, "more than one panel to order").toBeGreaterThan(1);
    expect(
      new Set(slots?.map((slot) => slot.id)).size,
      "one slot per panel, keyed by the same ids",
    ).toBe(slots?.length);

    for (const slot of slots ?? []) {
      const live = await roundGeometry(page);
      const panel = live?.targets.find((candidate) => candidate.id === slot.id);
      if (!panel) throw new Error(`round ${round} has no panel for slot ${slot.id}`);

      await dragCanvas(page, panel, slot);
    }

    await waitForRoundIndex(page, round + 1);
  }

  expect(errors, "ordering three rounds should log no page or console errors").toEqual([]);
});
