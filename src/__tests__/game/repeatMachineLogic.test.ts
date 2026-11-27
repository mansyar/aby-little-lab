/**
 * Repeat Machine's rules, seen through the seams the scene will use: the
 * six-round target ladder, action+count authoring, exact-count replay, the
 * wrong-count retry path and seeded, reproducible playthroughs.
 */
import { describe, expect, it } from "vitest";
import {
  buildPlaythrough,
  buildRound,
  isSessionComplete,
  isValidCount,
  MAX_COUNT,
  MIN_COUNT,
  MOVE_ACTIONS,
  type MoveAction,
  nextAttempt,
  type Program,
  programIssue,
  type RepeatRound,
  ROUND_COUNT,
  ROUND_SPECS,
  runProgram,
  scoreFor,
  shiftedTarget,
  type TargetCount,
  targetDots,
} from "../../game/repeatMachineLogic";
import { mulberry32 } from "../helpers/randomHelper";

const authored = (action: MoveAction | null, count: number | null): Program => ({
  action,
  count,
});

const roundFor = (target: TargetCount): RepeatRound => ({
  round: 0,
  target,
  actions: [...MOVE_ACTIONS],
});

describe("target-count schedule", () => {
  it("ramps the six target dots 2, 2, 3, 3, 4, 4", () => {
    expect(ROUND_SPECS).toHaveLength(ROUND_COUNT);
    expect(ROUND_SPECS.map((spec) => spec.target)).toEqual([2, 2, 3, 3, 4, 4]);
  });

  it("keeps every target inside the authored 2–4 count range", () => {
    for (const spec of ROUND_SPECS) {
      expect(isValidCount(spec.target)).toBe(true);
      expect(spec.target).toBeGreaterThanOrEqual(MIN_COUNT);
      expect(spec.target).toBeLessThanOrEqual(MAX_COUNT);
    }
  });

  it("reports the round's target as the dot count the scene draws", () => {
    for (const spec of ROUND_SPECS) {
      expect(targetDots(spec)).toBe(spec.target);
    }
  });

  it("reaches both ramp boundaries: 2 early and 4 late", () => {
    expect(ROUND_SPECS[0]?.target).toBe(MIN_COUNT);
    expect(ROUND_SPECS[ROUND_COUNT - 1]?.target).toBe(MAX_COUNT);
  });
});

describe("program authoring", () => {
  it("accepts one move action plus a count in 2–4", () => {
    for (const action of MOVE_ACTIONS) {
      expect(programIssue(authored(action, MIN_COUNT))).toBeNull();
      expect(programIssue(authored(action, MAX_COUNT))).toBeNull();
    }
  });

  it("blocks a program with no action and says what is missing", () => {
    expect(programIssue(authored(null, 3))).toMatch(/action/i);
  });

  it("blocks a program with no count and says what is missing", () => {
    expect(programIssue(authored("wave", null))).toMatch(/count/i);
  });

  it("rejects a no-repeat program whose count is 1", () => {
    expect(programIssue(authored("wave", 1))).toMatch(/count/i);
  });

  it("blocks a count above the repeat range", () => {
    expect(programIssue(authored("wave", MAX_COUNT + 1))).toMatch(/count/i);
  });

  it("does not run a malformed program, and never throws", () => {
    const malformed: readonly Program[] = [
      authored(null, 3),
      authored("wave", null),
      authored("wave", 1),
    ];
    for (const program of malformed) {
      const result = runProgram(roundFor(3), program);
      expect(result.valid).toBe(false);
      expect(result.performed).toEqual([]);
      expect(result.won).toBe(false);
      expect(result.issue).not.toBeNull();
    }
  });
});

describe("run verification", () => {
  it("performs exactly the authored count of action+sound pairs", () => {
    const result = runProgram(roundFor(4), authored("nod", 3));
    expect(result.performed).toEqual(["nod", "nod", "nod"]);
    expect(result.performed).toHaveLength(3);
  });

  it("replays the chosen action on every pair", () => {
    const result = runProgram(roundFor(2), authored("cheer", 2));
    expect(result.performed.every((action) => action === "cheer")).toBe(true);
  });

  it("wins when the authored count matches the target", () => {
    const result = runProgram(roundFor(3), authored("wave", 3));
    expect(result.valid).toBe(true);
    expect(result.matched).toBe(true);
    expect(result.won).toBe(true);
  });

  it("replays a wrong count in full but does not win", () => {
    const result = runProgram(roundFor(2), authored("wave", 4));
    expect(result.performed).toHaveLength(4);
    expect(result.matched).toBe(false);
    expect(result.won).toBe(false);
  });

  it("retries after a wrong count and wins on a later attempt without soft-locking", () => {
    const first = runProgram(roundFor(2), authored("wave", 4));
    expect(first.won).toBe(false);
    const second = runProgram(roundFor(2), authored("wave", 2), nextAttempt(first.attempts));
    expect(second.attempts).toBe(2);
    expect(second.won).toBe(true);
    expect(scoreFor(second)).toBeGreaterThan(0);
  });

  it("scores a first-try win above a retried win and a loss at zero", () => {
    expect(scoreFor(runProgram(roundFor(2), authored("wave", 2)))).toBe(2);
    expect(scoreFor(runProgram(roundFor(2), authored("wave", 2), 3))).toBe(1);
    expect(scoreFor(runProgram(roundFor(2), authored("wave", 3), 3))).toBe(0);
  });

  it("is complete only when all six rounds have been won", () => {
    const wins = Array.from({ length: ROUND_COUNT }, () =>
      runProgram(roundFor(2), authored("wave", 2)),
    );
    expect(isSessionComplete(wins)).toBe(true);
    expect(isSessionComplete(wins.slice(0, ROUND_COUNT - 1))).toBe(false);
    wins[0] = runProgram(roundFor(2), authored("wave", 3));
    expect(isSessionComplete(wins)).toBe(false);
  });
});

describe("seeded playthroughs", () => {
  it("deals each round a seeded shuffle of the move palette", () => {
    const playthrough = buildPlaythrough(0, mulberry32(7));
    expect(playthrough).toHaveLength(ROUND_COUNT);
    for (const dealt of playthrough) {
      expect([...dealt.actions].sort()).toEqual([...MOVE_ACTIONS].sort());
    }
  });

  it("deals the same playthrough for the same seed, at every seed", () => {
    for (let seed = 1; seed <= 40; seed += 1) {
      expect(buildPlaythrough(0, mulberry32(seed))).toEqual(buildPlaythrough(0, mulberry32(seed)));
    }
  });

  it("varies the palette order across seeds", () => {
    const orders = new Set(
      Array.from({ length: 40 }, (_, index) =>
        buildRound(0, 0, mulberry32(index + 1)).actions.join(","),
      ),
    );
    expect(orders.size).toBeGreaterThan(1);
  });

  it("stays valid even when the injected generator always returns one value", () => {
    const constant = (): number => 0.5;
    for (const dealt of buildPlaythrough(0, constant)) {
      expect([...dealt.actions].sort()).toEqual([...MOVE_ACTIONS].sort());
      expect(isValidCount(dealt.target)).toBe(true);
    }
  });

  it("throws for an out-of-range round index", () => {
    expect(() => buildRound(ROUND_COUNT, 0, mulberry32(1))).toThrow(/no round spec/);
  });

  it("never mutates the authored specs or the move palette", () => {
    const specs = JSON.stringify(ROUND_SPECS);
    const actions = [...MOVE_ACTIONS];
    buildPlaythrough(0, mulberry32(9));
    expect(JSON.stringify(ROUND_SPECS)).toBe(specs);
    expect(MOVE_ACTIONS).toEqual(actions);
  });
});

describe("adaptive shift", () => {
  it("moves one target band and clamps at the 2–4 boundaries", () => {
    expect(shiftedTarget(2, -1)).toBe(2);
    expect(shiftedTarget(3, -1)).toBe(2);
    expect(shiftedTarget(4, -1)).toBe(3);
    expect(shiftedTarget(2, 0)).toBe(2);
    expect(shiftedTarget(3, 0)).toBe(3);
    expect(shiftedTarget(4, 0)).toBe(4);
    expect(shiftedTarget(2, 1)).toBe(3);
    expect(shiftedTarget(3, 1)).toBe(4);
    expect(shiftedTarget(4, 1)).toBe(4);
  });

  it("applies the shift to every round of the authored ladder", () => {
    expect(buildPlaythrough(1, mulberry32(3)).map((dealt) => dealt.target)).toEqual([
      3, 3, 4, 4, 4, 4,
    ]);
    expect(buildPlaythrough(-1, mulberry32(3)).map((dealt) => dealt.target)).toEqual([
      2, 2, 2, 2, 3, 3,
    ]);
  });
});
