import { expect, test } from "@playwright/test";
import { GAME_REGISTRY } from "../../src/game/gameRegistry";
import { HUB_SELECTIONS, visibleTileIndexes } from "../../src/game/hubGroups";
import { tapCanvas } from "../fixtures/canvas";
import {
  collectErrors,
  hubGroups,
  hubTiles,
  launchGame,
  openHub,
  returnToHub,
  roundIndex,
  tapTarget,
  waitForHubReady,
  waitForPlayableRound,
  waitForRoundIndex,
} from "../fixtures/game";

/**
 * FR-6 / FR-12 / AC-3: the hub's group chips, driven the way a child drives
 * them.
 *
 * The loop is over `HUB_SELECTIONS` itself, so a sixth group is driven the
 * moment it is declared, and the expected tile ids come from
 * `visibleTileIndexes` — the same table the grid draws from, imported rather
 * than retyped, because the point of the journey is that the drawn board and
 * the bridge's report agree.
 *
 * "Two taps" is the product rule this proves end to end: one tap on a chip, one
 * on a game, and the child is playing something from the group they picked.
 */

const ALL_TILE_IDS = GAME_REGISTRY.map((_, index) => String(index));

test("a child picks a group, plays from it, and lands back on All", async ({ page }) => {
  test.setTimeout(180_000);

  const errors = collectErrors(page);
  await openHub(page);

  const opening = await hubGroups(page);
  expect(opening.selected, "a fresh hub lands on All").toBe("all");
  expect(
    opening.chips.map((chip) => chip.id),
    "the row is All plus the five groups, in draw order",
  ).toEqual([...HUB_SELECTIONS]);
  expect(new Set(opening.chips.map((chip) => chip.x)).size, "six chips, six centres").toBe(
    HUB_SELECTIONS.length,
  );
  for (const chip of opening.chips) {
    expect(chip.y, `${chip.id} sits in the top band, above the first tile row`).toBeLessThan(108);
  }

  for (const selection of HUB_SELECTIONS) {
    await test.step(`${selection} draws exactly its own games`, async () => {
      const chip = (await hubGroups(page)).chips.find((candidate) => candidate.id === selection);
      if (!chip) throw new Error(`the hub did not publish a ${selection} chip`);

      await tapCanvas(page, chip);
      await expect
        .poll(async () => (await hubGroups(page)).selected, {
          message: `tapping ${selection} should select it`,
          timeout: 15_000,
        })
        .toBe(selection);
      await waitForHubReady(page);

      const expected =
        selection === "all"
          ? ALL_TILE_IDS
          : visibleTileIndexes(selection).map((index) => String(index));
      expect(
        (await hubTiles(page)).map((tile) => tile.id),
        `${selection}'s board`,
      ).toEqual(expected);
    });
  }

  // Two taps from the returned All board: Numbers, then a Numbers game.
  const numbers = (await hubGroups(page)).chips.find((chip) => chip.id === "numbers");
  if (!numbers) throw new Error("the hub did not publish a Numbers chip");
  await tapCanvas(page, numbers);
  await waitForHubReady(page);

  // Add It Up is a Numbers game and publishes the card it counts as correct, so
  // the play is one honest tap rather than a guess.
  const addItUpIndex = GAME_REGISTRY.findIndex((game) => game.sceneKey === "AddItUp");
  if (addItUpIndex < 0) throw new Error("Add It Up is not in the registry");
  await launchGame(page, addItUpIndex, "AddItUp");
  expect(await roundIndex(page)).toBe(0);

  const round = await waitForPlayableRound(page, 0);
  await tapTarget(page, round.targets[0]);
  await waitForRoundIndex(page, 1);

  await returnToHub(page);

  // The selection is per visit: the Hub comes back on All with every tile.
  expect((await hubGroups(page)).selected, "the returned hub lands on All").toBe("all");
  expect(
    (await hubTiles(page)).map((tile) => tile.id),
    "and draws all 23 games",
  ).toEqual(ALL_TILE_IDS);

  expect(
    errors,
    "picking a group and playing from it should log no page or console errors",
  ).toEqual([]);
});
