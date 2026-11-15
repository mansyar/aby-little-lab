import { expect, test } from "@playwright/test";
import { tapCanvas } from "../fixtures/canvas";
import {
  collectErrors,
  launchGame,
  openHub,
  returnToHub,
  robotPathState,
  roundIndex,
  waitForRobotPathRound,
} from "../fixtures/game";

/**
 * FR-7 / FR-9 / AC-8, programming family: Robot Path programs a round, watches a
 * wrong program survive its own failure, repairs it in place, and completes three
 * rounds before leaving through the back control.
 *
 * Every tap comes from the geometry the scene publishes: the palette arrows, the
 * slots and the Go button as the game is drawing them, never a copied layout.
 */

/** How long a run of up to six commands may take, plus the shared advance. */
const RUN_TIMEOUT = 25_000;

test("Robot Path programs, repairs a stopped run and solves three rounds", async ({ page }) => {
  test.setTimeout(240_000);

  const errors = collectErrors(page);
  await openHub(page);
  await launchGame(page, 22, "RobotPath");
  expect(await roundIndex(page)).toBe(0);

  const opening = await waitForRobotPathRound(page, 0);
  expect(opening.commands, "a fresh round starts with an empty strip").toEqual([]);
  expect(opening.slots, "the strip holds six slots").toHaveLength(6);
  expect(
    opening.palette.map((arrow) => arrow.dir),
    "the palette is the four absolute directions, in draw order",
  ).toEqual(["up", "right", "down", "left"]);

  // Round 0: tap the intended route, press Go, and let the round advance.
  const arrows = new Map(opening.palette.map((arrow) => [arrow.dir, arrow]));
  const arrowFor = (direction: (typeof opening.solution)[number]) => {
    const arrow = arrows.get(direction);
    if (!arrow) throw new Error(`no palette arrow for ${direction}`);
    return arrow;
  };

  for (const direction of opening.solution) {
    await tapCanvas(page, arrowFor(direction));
  }
  const programmed = await robotPathState(page);
  expect(programmed?.commands, "every tapped arrow reaches the strip").toEqual(opening.solution);
  expect(programmed?.solved, "nothing moves until Go is pressed").toBe(false);

  await tapCanvas(page, opening.go);
  await expect
    .poll(() => roundIndex(page), {
      message: "a solved round should fill its dot and advance",
      timeout: RUN_TIMEOUT,
    })
    .toBe(1);

  // Rounds 1 and 2: press Go one command short, watch the stopped run keep its
  // program, then repair the same round instead of restarting it.
  for (let round = 1; round <= 2; round += 1) {
    const state = await waitForRobotPathRound(page, round);
    expect(state.solution.length, `round ${round} has a real program`).toBeGreaterThan(1);
    const roundArrows = new Map(state.palette.map((arrow) => [arrow.dir, arrow]));
    const arrow = (direction: (typeof state.solution)[number]) => {
      const found = roundArrows.get(direction);
      if (!found) throw new Error(`no palette arrow for ${direction}`);
      return found;
    };

    const short = state.solution.slice(0, -1);
    for (const direction of short) {
      await tapCanvas(page, arrow(direction));
    }
    await tapCanvas(page, state.go);

    await expect
      .poll(async () => (await robotPathState(page))?.runs ?? -1, {
        message: `round ${round}'s stopped run should finish`,
        timeout: RUN_TIMEOUT,
      })
      .toBe(1);

    const stopped = await robotPathState(page);
    expect(stopped?.round, "a stopped run does not advance the round").toBe(round);
    expect(stopped?.solved, "a stopped run is not a solve").toBe(false);
    expect(stopped?.commands, "every command stays in the strip").toEqual(short);
    expect(await roundIndex(page), "no dot is filled by a stopped run").toBe(round);

    // Repair it: one more arrow, then the same round runs again and solves.
    const last = state.solution[state.solution.length - 1];
    await tapCanvas(page, arrow(last));
    const repaired = await robotPathState(page);
    if (!repaired) throw new Error(`round ${round}'s board vanished after the repair`);
    expect(repaired.commands, "the repaired program is the whole route").toEqual(state.solution);
    await tapCanvas(page, repaired.go);
    await expect
      .poll(() => roundIndex(page), {
        message: `round ${round}'s repaired run should solve and advance`,
        timeout: RUN_TIMEOUT,
      })
      .toBe(round + 1);
  }

  // Leaving is the same parental hold every game's back control uses.
  await returnToHub(page);
  expect(await roundIndex(page), "the hub publishes no round counter").toBe(-1);

  expect(errors, "programming three rounds should log no page or console errors").toEqual([]);
});
