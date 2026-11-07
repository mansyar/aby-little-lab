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
 */

const EXPECTED_GAME_COUNT = 22;

test("every game launches from the hub and returns to it", async ({ page }) => {
  // 22 launches, each with a three-second parental hold to get back out.
  test.setTimeout(300_000);

  const errors = collectErrors(page);
  await openHub(page);

  // Fresh context: one default profile, no stickers, and a clean roster.
  expect(await profileCount(page)).toBe(1);
  expect(GAME_REGISTRY).toHaveLength(EXPECTED_GAME_COUNT);

  const tiles = await hubTiles(page);
  expect(tiles.map((tile) => tile.id)).toEqual(GAME_REGISTRY.map((_, index) => String(index)));

  for (const [index, entry] of GAME_REGISTRY.entries()) {
    // Every iteration after the first launches with a single tap on a hub that
    // was reached by holding the back control. That pairing is the assertion:
    // the hold's release lands where the profile chip sits, and a release that
    // began in the previous scene must not be treated as a tap that opens the
    // picker over the board (an overlay then eats the child's first real press).
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

  expect(errors, "launching all 22 games should log no page or console errors").toEqual([]);
});
