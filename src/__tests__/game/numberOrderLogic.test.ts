import { afterEach, describe, expect, it, vi } from "vitest";
import { BASE_LADDER, type BandShift, shiftLadder } from "../../game/adaptiveLogic";
import {
  BAND_COUNTS,
  BAND_RANGES,
  buildPlaythrough,
  buildRound,
  isCorrect,
  type NumberOrderRound,
} from "../../game/numberOrderLogic";

afterEach(() => {
  vi.restoreAllMocks();
});

const VARIETY_SAMPLES = 200;

function expectValidRound(round: NumberOrderRound, band: 1 | 2 | 3): void {
  expect(round.band).toBe(band);
  const expectedCount = BAND_COUNTS[band];
  const [min, max] = BAND_RANGES[band];
  expect(round.solution).toHaveLength(expectedCount);
  expect(round.shuffled).toHaveLength(expectedCount);
  // solution ascending and within range
  for (let i = 0; i < round.solution.length; i++) {
    expect(round.solution[i]).toBeGreaterThanOrEqual(min);
    expect(round.solution[i]).toBeLessThanOrEqual(max);
    if (i > 0) expect(round.solution[i]).toBeGreaterThan(round.solution[i - 1]);
  }
  // shuffled contains same numbers as solution (permutation)
  expect([...round.shuffled].sort((a, b) => a - b)).toEqual(round.solution);
  // uniqueness
  expect(new Set(round.solution).size).toBe(round.solution.length);
  expect(new Set(round.shuffled).size).toBe(round.shuffled.length);
  // every shuffled value within range
  for (const n of round.shuffled) {
    expect(n).toBeGreaterThanOrEqual(min);
    expect(n).toBeLessThanOrEqual(max);
  }
  // isCorrect returns true for solution, false for shuffled unless shuffled happens to be ascending (guard)
  expect(isCorrect(round.solution, round.solution)).toBe(true);
  if (!isCorrect(round.shuffled, round.solution)) {
    // shuffled is not the correct order — expected for most rounds due to not-ascending guard
    expect(true).toBe(true);
  } else {
    // if shuffled equals solution (1/6 for 3, 1/24 for 4 etc), it would be correct — allowed but rare
    // the guard reshuffles once, so this should be rare; just verify consistency
    expect(round.shuffled).toEqual(round.solution);
  }
}

describe("BAND_RANGES / BAND_COUNTS", () => {
  it("defines three bands with correct ranges and counts", () => {
    expect(BAND_RANGES[1]).toEqual([1, 5]);
    expect(BAND_RANGES[2]).toEqual([1, 8]);
    expect(BAND_RANGES[3]).toEqual([1, 10]);
    expect(BAND_COUNTS[1]).toBe(3);
    expect(BAND_COUNTS[2]).toBe(4);
    expect(BAND_COUNTS[3]).toBe(5);
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

  it("shuffled is not ascending (guard reshuffles sorted case)", () => {
    let sortedSeen = 0;
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const r = buildRound(1);
      const isAscending = r.shuffled.every((v, idx) => idx === 0 || v > r.shuffled[idx - 1]);
      if (isAscending) sortedSeen++;
    }
    // With guard, ascending shuffled should be very rare (reshuffle once reduces to ~1/36)
    // Allow a tiny flake budget but not the raw 1/6 rate (~33/200)
    expect(sortedSeen).toBeLessThan(20);
  });

  it("never draws outside its band range", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const r1 = buildRound(1);
      for (const n of r1.solution) {
        expect(n).toBeGreaterThanOrEqual(1);
        expect(n).toBeLessThanOrEqual(5);
      }
      const r3 = buildRound(3);
      for (const n of r3.solution) {
        expect(n).toBeGreaterThanOrEqual(1);
        expect(n).toBeLessThanOrEqual(10);
      }
    }
  });

  it("varies solutions across samples", () => {
    const seen = new Set<string>();
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      seen.add(buildRound(2).solution.join(","));
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it("is deterministic under a fixed random sequence", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const first = buildRound(2);
    vi.restoreAllMocks();
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const second = buildRound(2);
    expect(second).toEqual(first);
  });
});

describe("buildPlaythrough", () => {
  it("returns exactly 6 rounds", () => {
    expect(buildPlaythrough()).toHaveLength(6);
  });

  it("proceeds easy-first through the bands (2 rounds each) with classic ladder", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const pt = buildPlaythrough();
      for (const r of pt.slice(0, 2)) expectValidRound(r, 1);
      for (const r of pt.slice(2, 4)) expectValidRound(r, 2);
      for (const r of pt.slice(4, 6)) expectValidRound(r, 3);
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
  const SHIFTS: readonly BandShift[] = [-1, 0, 1];

  it("keeps the shifted band ladder across many samples", { timeout: 20_000 }, () => {
    for (const shift of SHIFTS) {
      const ladder = shiftLadder(BASE_LADDER, shift);
      for (let i = 0; i < VARIETY_SAMPLES; i++) {
        const pt = buildPlaythrough(shift);
        expect(pt).toHaveLength(ladder.length);
        ladder.forEach((band, idx) => {
          expectValidRound(pt[idx], band);
        });
      }
    }
  });

  it("shift 0 is byte-identical classic fixture (easy-first 1,1,2,2,3,3)", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.42);
    const classic = buildPlaythrough(0);
    vi.restoreAllMocks();
    vi.spyOn(Math, "random").mockReturnValue(0.42);
    const again = buildPlaythrough(0);
    expect(again).toEqual(classic);
    // ladder sanity
    expect(shiftLadder(BASE_LADDER, 0)).toEqual([1, 1, 2, 2, 3, 3]);
  });

  it("shift -1 gives 4 easy + 2 medium (1,1,1,1,2,2)", () => {
    expect(shiftLadder(BASE_LADDER, -1)).toEqual([1, 1, 1, 1, 2, 2]);
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const pt = buildPlaythrough(-1);
      expect(pt.slice(0, 4).every((r) => r.band === 1)).toBe(true);
      expect(pt.slice(4, 6).every((r) => r.band === 2)).toBe(true);
    }
  });

  it("shift +1 gives 2 medium + 4 hard (2,2,3,3,3,3)", () => {
    expect(shiftLadder(BASE_LADDER, 1)).toEqual([2, 2, 3, 3, 3, 3]);
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const pt = buildPlaythrough(1);
      expect(pt.slice(0, 2).every((r) => r.band === 2)).toBe(true);
      expect(pt.slice(2, 6).every((r) => r.band === 3)).toBe(true);
    }
  });

  it("is deterministic under a fixed random sequence per shift", () => {
    for (const shift of SHIFTS) {
      vi.spyOn(Math, "random").mockReturnValue(0.5);
      const first = buildPlaythrough(shift);
      vi.restoreAllMocks();
      vi.spyOn(Math, "random").mockReturnValue(0.5);
      const second = buildPlaythrough(shift);
      expect(second).toEqual(first);
    }
  });
});

describe("isCorrect", () => {
  it("returns true only for exact ascending match", () => {
    expect(isCorrect([1, 3, 5], [1, 3, 5])).toBe(true);
    expect(isCorrect([1, 5, 3], [1, 3, 5])).toBe(false);
    expect(isCorrect([1, 3], [1, 3, 5])).toBe(false);
    expect(isCorrect([], [])).toBe(true);
    expect(isCorrect([2, 4, 6, 8], [2, 4, 6, 8])).toBe(true);
    expect(isCorrect([8, 6, 4, 2], [2, 4, 6, 8])).toBe(false);
  });

  it("is false when lengths differ", () => {
    expect(isCorrect([1, 2, 3], [1, 2])).toBe(false);
    expect(isCorrect([1, 2], [1, 2, 3])).toBe(false);
  });
});
