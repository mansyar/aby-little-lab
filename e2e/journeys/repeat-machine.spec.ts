import { expect, test } from "@playwright/test";
import { tapCanvas } from "../fixtures/canvas";
import {
  collectErrors,
  launchGame,
  openHub,
  repeatMachineState,
  roundIndex,
  waitForRepeatMachineRound,
  waitForScene,
} from "../fixtures/game";
import { readStoredV2 } from "../fixtures/shell";

/**
 * Game 25 / AC-4 and AC-5: Repeat Machine authors one move and a repeat count,
 * watches the mascot replay exactly that many move+sound pairs, learns from a
 * wrong count, and finishes a six-round session whose result survives reload.
 *
 * Every tap uses the move / count card geometry the scene publishes; the ramp
 * comes from the round, so the journey never guesses the target.
 */

/** A replay of four pairs plus the shared advance, with room for a slow runner. */
const RUN_TIMEOUT = 25_000;

test("Repeat Machine authors a replay, retries a wrong count and saves the session", async ({
  page,
}) => {
  test.setTimeout(240_000);

  const errors = collectErrors(page);
  await openHub(page);
  await launchGame(page, 24, "RepeatMachine");
  expect(await roundIndex(page)).toBe(0);

  const opening = await waitForRepeatMachineRound(page, 0);
  expect(opening.target, "round 0 opens at two dots").toBe(2);
  expect(opening.dots, "one dot is drawn per target").toHaveLength(opening.target);
  expect(opening.actionOptions, "four moves can be authored").toHaveLength(4);
  expect(opening.countOptions.map((option) => option.count)).toEqual([2, 3, 4]);

  // Engine 1 — author: pick a move and a count from the cards as drawn.
  const move = opening.actionOptions[0];
  const wrongCount = opening.countOptions.find((option) => option.count !== opening.target);
  if (!move || !wrongCount) throw new Error("round 0 should offer a move and a wrong count");
  await tapCanvas(page, move);
  await tapCanvas(page, wrongCount);
  const authored = await repeatMachineState(page);
  expect(authored?.program.action, "the move card sets the program's move").toBe(move.action);
  expect(authored?.program.count, "the count card sets the program's count").toBe(wrongCount.count);

  // Engine 2 — wrong-count retry: the machine visibly replays the authored
  // count, then leaves the round open for a second attempt.
  if (!authored) throw new Error("Repeat Machine vanished after authoring");
  await tapCanvas(page, authored.go);
  await expect
    .poll(async () => (await repeatMachineState(page))?.wrongRuns ?? -1, {
      message: `round 0's ${wrongCount.count}-pair replay should finish`,
      timeout: RUN_TIMEOUT,
    })
    .toBe(1);

  const missed = await repeatMachineState(page);
  if (!missed) throw new Error("Repeat Machine vanished after the wrong replay");
  expect(missed.performed, "every authored pair is replayed").toHaveLength(wrongCount.count);
  expect(missed?.performed[0], "the replay uses the authored move").toBe(move.action);
  expect(missed?.solved, "a wrong count does not solve the round").toBe(false);
  expect(missed?.round, "a wrong count keeps the round").toBe(0);
  expect(missed?.hintLevel, "the wrong replay earns a hint").toBe(1);
  expect(missed?.attempts, "the retry is attempt two").toBe(2);
  expect(await roundIndex(page), "no dot is filled by a wrong count").toBe(0);

  const rightCount = opening.countOptions.find((option) => option.count === opening.target);
  if (!rightCount) throw new Error(`round 0 offers no way to author ${opening.target} pairs`);
  await tapCanvas(page, rightCount);

  // Engine 3 — correct win: the exact replay fills a dot on every round. The
  // first round was reached on a retry, so it scores one rather than two.
  await tapCanvas(page, missed.go);
  await expect
    .poll(async () => (await repeatMachineState(page))?.lastScore ?? -1, {
      message: "the corrected replay should score a retry",
      timeout: RUN_TIMEOUT,
    })
    .toBe(1);
  await expect
    .poll(() => roundIndex(page), {
      message: "the corrected replay should advance round 0",
      timeout: RUN_TIMEOUT,
    })
    .toBe(1);

  for (let round = 1; round < 6; round += 1) {
    const board = await waitForRepeatMachineRound(page, round);
    const chosenMove = board.actionOptions[round % board.actionOptions.length];
    const chosenCount = board.countOptions.find((option) => option.count === board.target);
    if (!chosenMove || !chosenCount) {
      throw new Error(`round ${round} should offer a move and ${board.target} repeats`);
    }
    await tapCanvas(page, chosenMove);
    await tapCanvas(page, chosenCount);
    await tapCanvas(page, board.go);

    await expect
      .poll(async () => (await repeatMachineState(page))?.lastScore ?? -1, {
        message: `round ${round}'s exact replay should score a first try`,
        timeout: RUN_TIMEOUT,
      })
      .toBe(2);

    if (round === 5) {
      // The last solve fills the sixth dot and the house returns to the hub on
      // its own; no back hold is needed after a completed session.
      await waitForScene(page, "Hub");
    } else {
      await expect
        .poll(() => roundIndex(page), {
          message: `round ${round}'s replay should advance to ${round + 1}`,
          timeout: RUN_TIMEOUT,
        })
        .toBe(round + 1);
    }
  }

  expect(await roundIndex(page), "the hub publishes no round counter").toBe(-1);

  // Engine 4 — save intact: the completed session is one win holding six
  // correct rounds and the one wrong replay, with no exploratory look counted.
  type StoredGame = {
    correct?: number;
    wrong?: number;
    wins?: number;
    probes?: number;
    recent?: boolean[];
  };
  const storedProgress = async (): Promise<StoredGame> => {
    const stored = (await readStoredV2(page)) as {
      activeProfileId?: string;
      profiles?: Array<{ id: string; progress?: Record<string, StoredGame> }>;
    } | null;
    const profiles = stored?.profiles ?? [];
    const active = profiles.find((entry) => entry.id === stored?.activeProfileId) ?? profiles[0];
    return active?.progress?.["repeat-machine"] ?? {};
  };

  await expect
    .poll(async () => (await storedProgress()).wins ?? 0, {
      message: "the finished session should be stored as a win",
      timeout: RUN_TIMEOUT,
    })
    .toBe(1);

  const stored = await storedProgress();
  expect(stored.correct ?? 0, "six solved rounds are stored").toBe(6);
  expect(stored.wrong ?? 0, "the wrong count is stored once").toBe(1);
  expect(stored.probes ?? 0, "authoring is an answer, not a look").toBe(0);
  expect(
    (stored.recent ?? []).filter((answer) => answer === false),
    "the wrong replay leaves one false answer in the adaptive window",
  ).toHaveLength(1);

  expect(errors, "six authored rounds should log no page or console errors").toEqual([]);
});
