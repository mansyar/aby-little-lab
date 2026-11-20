import { expect, test } from "@playwright/test";
import { tapCanvas } from "../fixtures/canvas";
import {
  collectErrors,
  fixItMachineState,
  launchGame,
  openHub,
  returnToHub,
  roundIndex,
  waitForFixItMachineRound,
} from "../fixtures/game";
import { readStoredV2 } from "../fixtures/shell";

/**
 * FR-15 / AC-9, debugging family: Fix-It Machine runs a tape, lets the stopped
 * run stand, diagnoses the one card that does not belong, repairs it from the
 * tray and finishes the job — three rounds, then out through the back control.
 *
 * Every tap comes from the geometry the scene publishes: each card of the tape,
 * the tray slots and the Go button as the game is drawing them, never a copied
 * layout. The one card that is wrong is read from the round, not guessed from
 * how the cards look.
 */

/** How long a run of up to five cards may take, plus the shared advance. */
const RUN_TIMEOUT = 25_000;

test("Fix-It Machine diagnoses a stopped run, repairs it and solves three rounds", async ({
  page,
}) => {
  test.setTimeout(240_000);

  const errors = collectErrors(page);
  await openHub(page);
  await launchGame(page, 23, "FixItMachine");
  expect(await roundIndex(page)).toBe(0);

  for (let round = 0; round <= 2; round += 1) {
    const opening = await waitForFixItMachineRound(page, round);

    if (round === 0) {
      // Exploring is not answering: tapping a card that is not the wrong one is
      // how a child searches the tape, so it must cost nothing but a look.
      const innocent = opening.cards.findIndex((_, index) => index !== opening.bugIndex);
      expect(innocent, "round 0 has a card that is not the bug").toBeGreaterThanOrEqual(0);
      await tapCanvas(page, opening.cards[innocent]);
      const afterLook = await fixItMachineState(page);
      expect(afterLook?.trayOpen, "a look opens no repair tray").toBe(false);
      expect(afterLook?.wrongTaps, "a look still counts as a missed tap for the hints").toBe(
        opening.wrongTaps + 1,
      );
    }

    // The tape as drawn is the round's program with exactly one substitution,
    // and that substitution is never the first card.
    expect(opening.cards, "every card on the tape has a place to tap").toHaveLength(
      opening.tape.length,
    );
    expect(opening.bugIndex, `round ${round} names its wrong card`).toBeGreaterThanOrEqual(1);
    expect(opening.bugIndex, `round ${round}'s wrong card is on the tape`).toBeLessThan(
      opening.tape.length,
    );
    expect(
      opening.tape[opening.bugIndex],
      `round ${round}'s wrong card is not the action the job needs`,
    ).not.toBe(opening.solution[opening.bugIndex]);
    const mismatches = opening.tape.filter((action, index) => action !== opening.solution[index]);
    expect(mismatches, `round ${round} starts with exactly one wrong card`).toHaveLength(1);

    // Run it unrepaired: the machine shrugs, and the round and tape survive.
    await tapCanvas(page, opening.go);
    await expect
      .poll(async () => (await fixItMachineState(page))?.failedRuns ?? -1, {
        message: `round ${round}'s stopped run should finish`,
        timeout: RUN_TIMEOUT,
      })
      .toBe(1);

    const stopped = await fixItMachineState(page);
    expect(stopped?.round, "a stopped run does not advance the round").toBe(round);
    expect(stopped?.solved, "a stopped run is not a solve").toBe(false);
    expect(stopped?.tape, "every card stays on the tape").toEqual(opening.tape);
    expect(stopped?.trayOpen, "a stopped run opens no tray").toBe(false);
    expect(await roundIndex(page), "no dot is filled by a stopped run").toBe(round);

    // Diagnose: tapping the card that does not belong offers the repair tray.
    const bug = stopped?.cards[opening.bugIndex];
    if (!bug) throw new Error(`round ${round}'s wrong card has no place to tap`);
    await tapCanvas(page, bug);

    await expect
      .poll(async () => (await fixItMachineState(page))?.trayOpen ?? false, {
        message: `round ${round}'s tray should open on the wrong card`,
        timeout: RUN_TIMEOUT,
      })
      .toBe(true);

    const open = await fixItMachineState(page);
    if (!open) throw new Error(`round ${round}'s bench vanished after opening the tray`);
    expect(open.tray, "the tray offers three tools").toHaveLength(3);
    const correct = open.solution[open.bugIndex];
    expect(
      open.tray.map((slot) => slot.action),
      "the tool the job needs is one of the three",
    ).toContain(correct);

    // A tool that is not the answer changes nothing but the miss counter.
    const wrongTool = open.tray.find((slot) => slot.action !== correct);
    if (!wrongTool) throw new Error(`round ${round}'s tray offered no wrong tool`);
    await tapCanvas(page, wrongTool);
    const afterMiss = await fixItMachineState(page);
    expect(afterMiss?.wrongTaps, "a wrong tool counts as a missed tap").toBe(open.wrongTaps + 1);
    expect(afterMiss?.trayOpen, "the tray stays open after a wrong tool").toBe(true);
    expect(afterMiss?.tape, "a wrong tool leaves the tape alone").toEqual(open.tape);

    // Repair: the right tool rewrites that one card and closes the tray.
    const answer = afterMiss?.tray.find((slot) => slot.action === correct);
    if (!answer) throw new Error(`round ${round}'s tray lost its right tool`);
    await tapCanvas(page, answer);

    await expect
      .poll(
        async () => {
          const state = await fixItMachineState(page);
          if (!state || state.trayOpen) return false;
          return state.tape.every((action, index) => action === state.solution[index]);
        },
        {
          message: `round ${round}'s tape should be repaired in place`,
          timeout: RUN_TIMEOUT,
        },
      )
      .toBe(true);

    const repaired = await fixItMachineState(page);
    expect(repaired?.wrongTaps, "the repair is not a missed tap").toBe(afterMiss?.wrongTaps);
    expect(repaired?.round, "repairing does not advance the round").toBe(round);

    // Run the repaired tape: the toy comes out right, the dot fills, round moves.
    if (!repaired) throw new Error(`round ${round}'s bench vanished after the repair`);
    await tapCanvas(page, repaired.go);
    await expect
      .poll(() => roundIndex(page), {
        message: `round ${round}'s repaired run should finish the job and advance`,
        timeout: RUN_TIMEOUT,
      })
      .toBe(round + 1);
  }

  // Leaving is the same parental hold every game's back control uses.
  await returnToHub(page);
  expect(await roundIndex(page), "the hub publishes no round counter").toBe(-1);

  // The whole path into the parent's numbers: the look is stored as a look, and
  // the answer window holds the three distractor taps and nothing for the look.
  type StoredGame = { correct?: number; wrong?: number; probes?: number; recent?: boolean[] };
  const storedProgress = async (): Promise<StoredGame> => {
    const stored = (await readStoredV2(page)) as {
      activeProfileId?: string;
      profiles?: Array<{ id: string; progress?: Record<string, StoredGame> }>;
    } | null;
    const profiles = stored?.profiles ?? [];
    const active = profiles.find((entry) => entry.id === stored?.activeProfileId) ?? profiles[0];
    return active?.progress?.["fix-it-machine"] ?? {};
  };

  await expect
    .poll(async () => (await storedProgress()).probes ?? 0, {
      message: "the exploration tap is stored as a look",
      timeout: RUN_TIMEOUT,
    })
    .toBe(1);

  const stored = await storedProgress();
  // Six misses reached the answer window — three stopped runs and three
  // distractor tools. A seventh would mean the look had been scored.
  expect(
    (stored.recent ?? []).filter((answer) => answer === false),
    "the look left no mark in the answer window",
  ).toHaveLength(6);
  expect(stored.wrong ?? 0, "an abandoned session writes no wrong-answer total").toBe(0);

  expect(errors, "debugging three rounds should log no page or console errors").toEqual([]);
});
