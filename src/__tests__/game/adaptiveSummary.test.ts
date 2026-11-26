import { describe, expect, it } from "vitest";
import { MIN_SAMPLE, WINDOW_SIZE } from "../../game/adaptiveLogic";
import {
  ADAPTIVE_DISABLED_LINE,
  ADAPTIVE_SPARSE_LINE,
  summariseAdaptiveSpread,
} from "../../game/adaptiveSummary";
import { createDefaultProgressMap } from "../../game/progressLogic";
import type { GameId, GameProgress } from "../../types";
import { GAME_IDS } from "../../types";

/** A rolling window with `correct` true taps followed by `wrong` false taps. */
function windowOf(correct: number, wrong: number): boolean[] {
  return [
    ...Array.from({ length: correct }, () => true),
    ...Array.from({ length: wrong }, () => false),
  ];
}

/** A full progress map with only the named games' windows filled in. */
function progressWith(
  entries: ReadonlyArray<readonly [GameId, readonly boolean[]]>,
): Record<GameId, GameProgress> {
  const progress = createDefaultProgressMap();
  for (const [gameId, recent] of entries) {
    progress[gameId] = { ...progress[gameId], recent: [...recent] };
  }
  return progress;
}

/** Freezes a value and everything under it, so a mutation throws. */
function deepFreeze(value: object): void {
  for (const item of Object.values(value)) {
    if (item !== null && typeof item === "object") deepFreeze(item);
  }
  Object.freeze(value);
}

describe("summariseAdaptiveSpread — the four states", () => {
  it("counts a mixed spread exactly and writes the deterministic mixed line", () => {
    const spread = summariseAdaptiveSpread(
      progressWith([
        ["shape-sorter", windowOf(10, 0)], // +1 harder
        ["animal-trace", windowOf(2, 8)], // -1 easier
        ["pop-freeze", windowOf(8, 2)], // 0 classic
      ]),
      true,
    );

    expect(spread).toEqual({
      state: "mixed",
      line: "Current bands · 3 games assessed · 1 easier · 1 classic · 1 harder · from recent answers",
      assessed: 3,
      easier: 1,
      classic: 1,
      harder: 1,
    });
  });

  it("says all at classic for assessed games that all sit at shift 0", () => {
    const spread = summariseAdaptiveSpread(
      progressWith([
        ["shape-sorter", windowOf(8, 2)],
        ["animal-trace", windowOf(6, 4)],
      ]),
      true,
    );

    expect(spread.state).toBe("all-classic");
    expect(spread).toMatchObject({ assessed: 2, easier: 0, classic: 2, harder: 0 });
    expect(spread.line).toBe(
      "Current bands · 2 games assessed, all at classic · from recent answers",
    );
    // A steady spread is not a movement claim.
    expect(spread.line).not.toContain("easier");
    expect(spread.line).not.toContain("harder");
  });

  it("writes the explicit sparse line when no game reaches the sample floor", () => {
    const spread = summariseAdaptiveSpread(progressWith([["shape-sorter", windowOf(3, 2)]]), true);

    expect(spread).toEqual({
      state: "sparse",
      line: ADAPTIVE_SPARSE_LINE,
      assessed: 0,
      easier: 0,
      classic: 0,
      harder: 0,
    });
  });

  it("writes the explicit disabled line even when windows hold enough taps", () => {
    const spread = summariseAdaptiveSpread(
      progressWith([
        ["shape-sorter", windowOf(10, 0)],
        ["animal-trace", windowOf(2, 8)],
      ]),
      false,
    );

    expect(spread).toEqual({
      state: "disabled",
      line: ADAPTIVE_DISABLED_LINE,
      assessed: 0,
      easier: 0,
      classic: 0,
      harder: 0,
    });
    // The disabled state makes no evidence claim at all.
    expect(spread.line).not.toContain(" assessed");
  });
});

describe("summariseAdaptiveSpread — the evidence floor", () => {
  it("treats exactly MIN_SAMPLE taps as assessed", () => {
    const spread = summariseAdaptiveSpread(
      progressWith([["shape-sorter", windowOf(MIN_SAMPLE, 0)]]),
      true,
    );

    expect(MIN_SAMPLE).toBe(6);
    expect(spread.assessed).toBe(1);
    expect(spread.harder).toBe(1);
    expect(spread.line).toContain("1 game assessed");
    expect(spread.line).not.toBe(ADAPTIVE_SPARSE_LINE);
  });

  it("ignores a window one tap below the floor", () => {
    const spread = summariseAdaptiveSpread(
      progressWith([["shape-sorter", windowOf(MIN_SAMPLE - 1, 0)]]),
      true,
    );

    expect(spread.state).toBe("sparse");
    expect(spread.assessed).toBe(0);
  });

  it("classifies by MIN_SAMPLE taps, not by the full WINDOW_SIZE", () => {
    const exactlySix = summariseAdaptiveSpread(
      progressWith([["pop-freeze", windowOf(0, MIN_SAMPLE)]]),
      true,
    );
    const fullWindow = summariseAdaptiveSpread(
      progressWith([["pop-freeze", windowOf(0, WINDOW_SIZE)]]),
      true,
    );

    expect(exactlySix.easier).toBe(1);
    expect(fullWindow.easier).toBe(1);
    expect(exactlySix.line).toBe(fullWindow.line);
  });

  it("assesses every game at the upper boundary", () => {
    const allGames = GAME_IDS.map((gameId) => [gameId, windowOf(8, 2)] as const);
    const spread = summariseAdaptiveSpread(progressWith(allGames), true);

    expect(spread.assessed).toBe(GAME_IDS.length);
    expect(spread.classic).toBe(GAME_IDS.length);
    expect(spread.line).toBe(
      `Current bands · ${GAME_IDS.length} games assessed, all at classic · from recent answers`,
    );
  });
});

describe("summariseAdaptiveSpread — totality and purity", () => {
  it("ignores short, malformed and legacy windows safely", () => {
    // Hand the helper values no real save should hold: a string window, a
    // window with non-boolean entries and a missing progress map altogether.
    const raw = {
      "shape-sorter": { recent: "not-a-window" },
      "animal-trace": { recent: [true, "yes", 1, null] },
      "pop-freeze": { recent: null },
    } as unknown as Partial<Record<GameId, GameProgress>>;

    expect(() => summariseAdaptiveSpread(raw, true)).not.toThrow();
    expect(summariseAdaptiveSpread(raw, true).state).toBe("sparse");
    expect(summariseAdaptiveSpread(null, true).state).toBe("sparse");
    expect(summariseAdaptiveSpread(undefined, true).state).toBe("sparse");
  });

  it("keeps only boolean taps and the newest WINDOW_SIZE of them", () => {
    const long = [
      ...windowOf(0, MIN_SAMPLE), // six stale wrong taps that must drop off
      ...windowOf(WINDOW_SIZE, 0), // ten recent correct taps
      "junk",
    ];
    const spread = summariseAdaptiveSpread(
      progressWith([["shape-sorter", long as unknown as readonly boolean[]]]),
      true,
    );

    expect(spread.assessed).toBe(1);
    expect(spread.harder).toBe(1);
    expect(spread.easier).toBe(0);
  });

  it("does not mutate the progress it is given", () => {
    const progress = progressWith([["shape-sorter", windowOf(10, 0)]]);
    const snapshot = progress["shape-sorter"].recent.slice();
    deepFreeze(progress);

    expect(() => summariseAdaptiveSpread(progress, true)).not.toThrow();
    expect(progress["shape-sorter"].recent).toEqual(snapshot);
  });

  it("returns equal output for equal arguments", () => {
    const progress = progressWith([
      ["shape-sorter", windowOf(10, 0)],
      ["animal-trace", windowOf(2, 8)],
    ]);

    expect(summariseAdaptiveSpread(progress, true)).toEqual(
      summariseAdaptiveSpread(progress, true),
    );
  });
});
