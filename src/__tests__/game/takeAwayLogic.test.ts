import { afterEach, describe, expect, it, vi } from "vitest";
import { BASE_LADDER, type BandShift, shiftLadder } from "../../game/adaptiveLogic";
import { COUNT_ITEMS } from "../../game/countLogic";
import {
  type BandId,
  buildPlaythrough,
  buildRound,
  isCorrect,
  TAKE_AWAY_BANDS,
  type TakeAwayRound,
} from "../../game/takeAwayLogic";

afterEach(() => {
  vi.restoreAllMocks();
});

/** Number of rounds sampled to exercise randomized behavior without flaking. */
const VARIETY_SAMPLES = 200;

/** Ordered "a-b" key of a subtraction pair (minuend-subtrahend). */
function pairKey(a: number, b: number): string {
  return `${a}-${b}`;
}

function expectValidRound(round: TakeAwayRound, band: BandId): void {
  // Two prompt cards with distinct item types.
  expect(round.promptCards).toHaveLength(2);
  const [minuend, subtrahend] = round.promptCards;
  expect(minuend.count).toBeGreaterThanOrEqual(2);
  expect(subtrahend.count).toBeGreaterThanOrEqual(1);
  expect(minuend.count).toBeGreaterThan(subtrahend.count);
  expect(minuend.texture).not.toBe(subtrahend.texture);
  for (const card of round.promptCards) {
    expect(COUNT_ITEMS).toContain(card.texture);
  }
  // Target equals the difference and stays within the band.
  const target = minuend.count - subtrahend.count;
  expect(target).toBe(round.target);
  const max = TAKE_AWAY_BANDS[band - 1].max;
  expect(target).toBeGreaterThanOrEqual(1);
  expect(target).toBeLessThanOrEqual(max - 1);
  // Exactly 4 distinct answer options in [1..bandMax], one equals the target.
  expect(round.answerOptions).toHaveLength(4);
  expect(new Set(round.answerOptions).size).toBe(4);
  for (const option of round.answerOptions) {
    expect(option).toBeGreaterThanOrEqual(1);
    expect(option).toBeLessThanOrEqual(max);
  }
  expect(round.answerOptions).toContain(round.target);
  // Answer cards share a single item type (also registered).
  expect(COUNT_ITEMS).toContain(round.answerItemTexture);
}

describe("bands", () => {
  it("defines 3 progressive bands: minuends ≤4, ≤6, ≤10", () => {
    expect(TAKE_AWAY_BANDS).toHaveLength(3);
    expect(TAKE_AWAY_BANDS.map((band) => band.max)).toEqual([4, 6, 10]);
  });

  it("every band has enough totals to fill 4 distinct options", () => {
    for (const band of TAKE_AWAY_BANDS) {
      // [1..max] minus the target still leaves ≥ 3 distinct distractors.
      expect(band.max).toBeGreaterThanOrEqual(4);
    }
  });
});

describe("buildRound", () => {
  it("produces structurally valid rounds for every band across many samples", () => {
    for (const band of [1, 2, 3] as const) {
      for (let i = 0; i < VARIETY_SAMPLES; i++) {
        expectValidRound(buildRound(band), band);
      }
    }
  });

  it("never returns a minuend-subtrahend pair already in the used-pairs set", () => {
    const usedPairs = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const round = buildRound(3, usedPairs);
      const key = pairKey(round.promptCards[0].count, round.promptCards[1].count);
      expect(usedPairs.has(key)).toBe(false);
      usedPairs.add(key);
    }
  });

  it("throws when every pair of a band is already used", () => {
    const usedPairs = new Set<string>();
    // Consume every minuend-subtrahend pair of band 3 (minuend ≤ 10).
    for (let a = 2; a <= 10; a++) {
      for (let b = 1; b <= a - 1; b++) {
        usedPairs.add(pairKey(a, b));
      }
    }
    expect(() => buildRound(3, usedPairs)).toThrow("No unused subtraction pair for band 3");
  });

  it("varies pairs, targets, and answer sets across samples", () => {
    const pairs = new Set<string>();
    const targets = new Set<number>();
    const answerSets = new Set<string>();
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const round = buildRound(3);
      pairs.add(pairKey(round.promptCards[0].count, round.promptCards[1].count));
      targets.add(round.target);
      answerSets.add([...round.answerOptions].sort().join(","));
    }
    expect(pairs.size).toBeGreaterThan(1);
    expect(targets.size).toBeGreaterThan(1);
    expect(answerSets.size).toBeGreaterThan(1);
  });

  it("is deterministic under a fixed random sequence", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const first = buildRound(3);
    vi.restoreAllMocks();
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const second = buildRound(3);
    expect(second).toEqual(first);
    expectValidRound(first, 3);
  });

  it("throws for an unknown band id", () => {
    expect(() => buildRound(4 as BandId)).toThrow("Unknown band 4");
  });
});

describe("buildPlaythrough", () => {
  it("returns exactly 6 rounds", () => {
    expect(buildPlaythrough()).toHaveLength(6);
  });

  it("proceeds easy-first through the bands (2 rounds each)", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const playthrough = buildPlaythrough();
      for (const round of playthrough.slice(0, 2)) {
        expect(round.promptCards[0].count).toBeLessThanOrEqual(4);
      }
      for (const round of playthrough.slice(2, 4)) {
        expect(round.promptCards[0].count).toBeLessThanOrEqual(6);
      }
      for (const round of playthrough.slice(4)) {
        expect(round.promptCards[0].count).toBeLessThanOrEqual(10);
      }
    }
  });

  it("never repeats a minuend-subtrahend pair within a playthrough", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const playthrough = buildPlaythrough();
      const keys = playthrough.map((round) =>
        pairKey(round.promptCards[0].count, round.promptCards[1].count),
      );
      expect(new Set(keys).size).toBe(6);
    }
  });

  it("keeps every round structurally valid", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const playthrough = buildPlaythrough();
      playthrough.forEach((round, index) => {
        const band = index < 2 ? 1 : index < 4 ? 2 : 3;
        expectValidRound(round, band);
      });
    }
  });

  it("is deterministic under a fixed random sequence", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const first = buildPlaythrough();
    vi.restoreAllMocks();
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const second = buildPlaythrough();
    expect(second).toEqual(first);
  });
});

describe("buildPlaythrough(shift)", () => {
  /** All shifts the facade can produce. */
  const SHIFTS: readonly BandShift[] = [-1, 0, 1];

  it("keeps the shifted band ladder and validity across many samples", () => {
    for (const shift of SHIFTS) {
      const ladder = shiftLadder(BASE_LADDER, shift);
      for (let i = 0; i < VARIETY_SAMPLES; i++) {
        const playthrough = buildPlaythrough(shift);
        expect(playthrough).toHaveLength(ladder.length);
        ladder.forEach((band, roundIndex) => {
          expectValidRound(playthrough[roundIndex], band);
        });
      }
    }
  });

  it("never repeats a minuend-subtrahend pair at any shifted ladder", () => {
    for (const shift of SHIFTS) {
      for (let i = 0; i < VARIETY_SAMPLES; i++) {
        const playthrough = buildPlaythrough(shift);
        const keys = playthrough.map((round) =>
          pairKey(round.promptCards[0].count, round.promptCards[1].count),
        );
        expect(new Set(keys).size).toBe(keys.length);
      }
    }
  });

  it("never exhausts a band's pair pool at the extreme shifted ladders", () => {
    // shift -1: [1,1,1,1,2,2] needs 4 of band 1's 6 pairs.
    // shift +1: [2,2,3,3,3,3] needs 2 of band 2's 15 and 4 of band 3's 45.
    expect(() => {
      for (let i = 0; i < VARIETY_SAMPLES; i++) {
        buildPlaythrough(-1);
        buildPlaythrough(1);
      }
    }).not.toThrow();
  });

  it("is deterministic under a fixed random sequence", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const first = buildPlaythrough(1);
    vi.restoreAllMocks();
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const second = buildPlaythrough(1);
    expect(second).toEqual(first);
  });
});

describe("isCorrect", () => {
  it("returns true only for the option whose difference equals the target", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const round = buildRound(3);
      round.answerOptions.forEach((option, slot) => {
        expect(isCorrect(round.answerOptions, slot, round.target)).toBe(option === round.target);
      });
    }
  });

  it("returns false for an out-of-range index", () => {
    const round = buildRound(1);
    expect(isCorrect(round.answerOptions, 99, round.target)).toBe(false);
  });
});
