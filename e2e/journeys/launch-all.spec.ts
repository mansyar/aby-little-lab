import { expect, test } from "@playwright/test";
import { GAME_REGISTRY } from "../../src/game/gameRegistry";
import {
  collectErrors,
  hubTiles,
  launchGame,
  openHub,
  profileCount,
  returnToHub,
  roundIndex,
} from "../fixtures/game";

/**
 * FR-2 / AC-2: every game in the registry launches from its hub tile and comes
 * back through the back control.
 *
 * The loop is over `GAME_REGISTRY` itself, so a new game is driven the moment it
 * is registered. The literal count below is deliberate: it fails first and
 * legibly when the roster grows, rather than the new game silently going
 * unlaunched.
 *
 * The roster is driven as two halves that run in parallel workers. One test
 * doing all 24 launches was this suite's critical path — every launch ends with
 * the three-second parental hold, so the file alone measured 3.3 min against
 * NFR-2's 5 min ceiling. Halving the sequence halves that path without touching
 * what is asserted: both halves still launch from a hub reached by the held
 * return, and the split itself is asserted, so a range can never quietly go
 * unlaunched.
 */

const EXPECTED_GAME_COUNT = 24;

/** Where the second half starts; derived so the split cannot fall behind. */
const SPLIT = Math.ceil(GAME_REGISTRY.length / 2);

const SLICES = [
  { label: "first half", start: 0, end: SPLIT },
  { label: "second half", start: SPLIT, end: GAME_REGISTRY.length },
];

test.describe("every game launches from the hub and returns to it", () => {
  // Each half gets its own worker: two contexts, one shared preview server, so
  // the file's wall clock is the longer half rather than their sum.
  test.describe.configure({ mode: "parallel" });

  test("the halves partition the registry", () => {
    // The tripwire for the split itself: every registry index is in exactly one
    // slice, so no game can fall between the halves.
    const covered = SLICES.flatMap((slice) =>
      Array.from({ length: slice.end - slice.start }, (_, offset) => slice.start + offset),
    );
    expect(GAME_REGISTRY).toHaveLength(EXPECTED_GAME_COUNT);
    expect(covered).toEqual([...GAME_REGISTRY.keys()]);
  });

  for (const slice of SLICES) {
    test(`the ${slice.label} launches and returns`, async ({ page }) => {
      // Half the roster, each launch with a three-second parental hold to get
      // back out: generous, because a loaded runner renders fewer frames.
      test.setTimeout(180_000);

      const errors = collectErrors(page);
      await openHub(page);

      // Fresh context: one default profile, no stickers, and a clean roster.
      expect(await profileCount(page)).toBe(1);

      // A narrow hub pages its tiles. The first page must still begin at
      // registry index zero; the loops below prove every page and all 24
      // launches without pretending the whole roster fits on screen.
      const tiles = await hubTiles(page);
      const visibleIds = tiles.map((tile) => tile.id);
      expect(visibleIds.length).toBeGreaterThan(0);
      expect(visibleIds).toEqual(
        GAME_REGISTRY.slice(0, visibleIds.length).map((_, index) => String(index)),
      );

      const entries = GAME_REGISTRY.slice(slice.start, slice.end);
      for (const [offset, entry] of entries.entries()) {
        const index = slice.start + offset;

        // Every iteration launches with a single tap on a hub that was reached
        // by holding the back control. That pairing is the assertion: the hold's
        // release lands where the profile chip sits, and a release that began in
        // the previous scene must not be treated as a tap that opens the picker
        // over the board (an overlay then eats the child's first real press).
        await test.step(
          index === 0
            ? `launch ${entry.sceneKey} from a fresh hub`
            : `launch ${entry.sceneKey} with one tap after the held return`,
          async () => {
            await launchGame(page, index, entry.sceneKey);

            // The game is really running: its own round board is on the first round.
            expect(await roundIndex(page), `${entry.sceneKey} should start on round 0`).toBe(0);

            await returnToHub(page);
          },
        );
      }

      expect(
        errors,
        `launching the ${slice.label} of ${EXPECTED_GAME_COUNT} games should log no page or console errors`,
      ).toEqual([]);
    });
  }
});
