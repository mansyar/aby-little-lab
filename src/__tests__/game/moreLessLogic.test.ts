import { afterEach, describe, expect, it, vi } from "vitest";
import { BASE_LADDER, type BandShift, shiftLadder } from "../../game/adaptiveLogic";
import { COUNT_ITEMS } from "../../game/countLogic";
import {
  type ComparisonMode,
  createPlaythrough,
  createRound,
  evaluateRound,
  type GroupSide,
  type MoreLessRound,
  ROUND_BANDS,
} from "../../game/moreLessLogic";

afterEach(() => {
  vi.restoreAllMocks();
});

/** Number of rounds sampled to exercise randomized behavior without flaking. */
const VARIETY_SAMPLES = 200;

function expectValidRound(round: MoreLessRound, bandIndex: 0 | 1 | 2): void {
  const band = ROUND_BANDS[bandIndex];
  // Both group counts fall inside the band's counting range (never zero).
  for (const group of [round.left, round.right]) {
    expect(group.count).toBeGreaterThanOrEqual(1);
    expect(group.count).toBeLessThanOrEqual(band.max);
  }
  // The two counts are always distinct so exactly one card is correct.
  expect(round.left.count).not.toBe(round.right.count);
  // Item textures distinct across the round's two cards and from the pool.
  expect(round.left.texture).not.toBe(round.right.texture);
  for (const group of [round.left, round.right]) {
    expect(COUNT_ITEMS).toContain(group.texture);
  }
}

describe("ROUND_BANDS", () => {
  it("defines the three progressive bands", () => {
    expect(ROUND_BANDS).toHaveLength(3);
    expect(ROUND_BANDS[0].max).toBe(3);
    expect(ROUND_BANDS[1].max).toBe(5);
    expect(ROUND_BANDS[2].max).toBe(10);
  });
});

describe("createRound", () => {
  it("produces structurally valid rounds for every band and mode across many samples", () => {
    for (let bandIndex = 0; bandIndex < ROUND_BANDS.length; bandIndex++) {
      for (const mode of ["more", "less"] as const) {
        for (let i = 0; i < VARIETY_SAMPLES; i++) {
          expectValidRound(createRound((bandIndex + 1) as 1 | 2 | 3, mode), bandIndex as 0 | 1 | 2);
        }
      }
    }
  });

  it("keeps the round's mode as requested", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      expect(createRound(2, "more").mode).toBe("more");
      expect(createRound(2, "less").mode).toBe("less");
    }
  });

  it("never draws a group count outside the band's range", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const round = createRound(1, "more");
      expect(round.left.count).toBeGreaterThanOrEqual(1);
      expect(round.left.count).toBeLessThanOrEqual(3);
      expect(round.right.count).toBeGreaterThanOrEqual(1);
      expect(round.right.count).toBeLessThanOrEqual(3);
    }
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const round = createRound(3, "less");
      expect(round.left.count).toBeGreaterThanOrEqual(1);
      expect(round.left.count).toBeLessThanOrEqual(10);
      expect(round.right.count).toBeGreaterThanOrEqual(1);
      expect(round.right.count).toBeLessThanOrEqual(10);
    }
  });

  it("varies counts and item types across samples", () => {
    const seenPairs = new Set<string>();
    const seenTextures = new Set<string>();
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const round = createRound(2, "more");
      seenPairs.add(`${round.left.count}|${round.right.count}`);
      seenTextures.add(round.left.texture);
      seenTextures.add(round.right.texture);
    }
    expect(seenPairs.size).toBeGreaterThan(1);
    expect(seenTextures.size).toBeGreaterThan(1);
  });

  it("is deterministic under a fixed random sequence", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const first = createRound(2, "more");
    vi.restoreAllMocks();
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const second = createRound(2, "more");
    expect(second).toEqual(first);
    expectValidRound(first, 1);
  });
});

describe("createPlaythrough", () => {
  it("returns exactly 6 rounds", () => {
    expect(createPlaythrough()).toHaveLength(6);
  });

  it("proceeds easy-first through the bands (2 rounds each)", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const playthrough = createPlaythrough();
      // Rounds 1-2: band 1 (counts 1-3).
      for (const round of playthrough.slice(0, 2)) {
        expectValidRound(round, 0);
      }
      // Rounds 3-4: band 2 (counts 1-5).
      for (const round of playthrough.slice(2, 4)) {
        expectValidRound(round, 1);
      }
      // Rounds 5-6: band 3 (counts 1-10).
      for (const round of playthrough.slice(4)) {
        expectValidRound(round, 2);
      }
    }
  });

  it("mixes exactly 3 'more' and 3 'less' rounds per playthrough", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const modes = createPlaythrough().map((round) => round.mode);
      expect(modes.filter((mode) => mode === "more")).toHaveLength(3);
      expect(modes.filter((mode) => mode === "less")).toHaveLength(3);
    }
  });

  it("is deterministic under a fixed random sequence", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const first = createPlaythrough();
    vi.restoreAllMocks();
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const second = createPlaythrough();
    expect(second).toEqual(first);
  });
});

describe("createPlaythrough(shift)", () => {
  /** All shifts the facade can produce. */
  const SHIFTS: readonly BandShift[] = [-1, 0, 1];

  it("keeps the shifted band ladder and the 3/3 mode mix across many samples", {
    timeout: 20_000,
  }, () => {
    for (const shift of SHIFTS) {
      const ladder = shiftLadder(BASE_LADDER, shift);
      for (let i = 0; i < VARIETY_SAMPLES; i++) {
        const playthrough = createPlaythrough(shift);
        expect(playthrough).toHaveLength(ladder.length);
        ladder.forEach((band, roundIndex) => {
          expectValidRound(playthrough[roundIndex], (band - 1) as 0 | 1 | 2);
        });
        const modes = playthrough.map((round) => round.mode);
        expect(modes.filter((mode) => mode === "more")).toHaveLength(3);
        expect(modes.filter((mode) => mode === "less")).toHaveLength(3);
      }
    }
  });

  it("keeps exactly one correct side in every shifted round", { timeout: 20_000 }, () => {
    for (const shift of SHIFTS) {
      for (let i = 0; i < VARIETY_SAMPLES; i++) {
        for (const round of createPlaythrough(shift)) {
          const sides: GroupSide[] = ["left", "right"];
          expect(sides.filter((side) => evaluateRound(round, side))).toHaveLength(1);
        }
      }
    }
  });

  it("is deterministic under a fixed random sequence", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const first = createPlaythrough(-1);
    vi.restoreAllMocks();
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const second = createPlaythrough(-1);
    expect(second).toEqual(first);
  });
});

describe("evaluateRound", () => {
  function makeRound(mode: ComparisonMode, leftCount: number, rightCount: number): MoreLessRound {
    return {
      mode,
      left: { count: leftCount, texture: "shape_star" },
      right: { count: rightCount, texture: "sm_ball" },
    };
  }

  it("returns true for the side with more objects in a 'more' round", () => {
    const round = makeRound("more", 2, 5);
    expect(evaluateRound(round, "left")).toBe(false);
    expect(evaluateRound(round, "right")).toBe(true);
  });

  it("returns true for the side with fewer objects in a 'less' round", () => {
    const round = makeRound("less", 7, 4);
    expect(evaluateRound(round, "left")).toBe(false);
    expect(evaluateRound(round, "right")).toBe(true);
  });

  it("flips the correct side when the higher count moves sides", () => {
    const round = makeRound("more", 8, 3);
    expect(evaluateRound(round, "left")).toBe(true);
    expect(evaluateRound(round, "right")).toBe(false);
  });

  it("never accepts both sides (counts are guaranteed distinct)", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const playthrough = createPlaythrough();
      for (const round of playthrough) {
        const sides: GroupSide[] = ["left", "right"];
        expect(sides.filter((side) => evaluateRound(round, side))).toHaveLength(1);
      }
    }
  });
});
