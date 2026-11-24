import { describe, expect, it } from "vitest";
import {
  ACCURACY_COMPONENTS,
  type BandShiftDistribution,
  CANDIDATE_DOWN,
  CANDIDATE_UP,
  distributionMeetsTarget,
  findTunedCutPoints,
  mulberry32,
  SIMULATION_PROFILES,
  SIMULATION_SEED,
  sampleLatentAccuracy,
  simulateDistribution,
  simulateWindow,
  TAP_WINDOW,
  TARGET_DISTRIBUTION,
  TARGET_TOLERANCE,
} from "../../game/adaptiveCurve";
import { bandShiftFor, DOWN_THRESHOLD, MIN_SAMPLE, UP_THRESHOLD } from "../../game/adaptiveLogic";

/** Builds a full window with the given number of correct taps. */
function makeWindow(correct: number): boolean[] {
  return [
    ...Array.from({ length: correct }, () => true),
    ...Array.from({ length: TAP_WINDOW - correct }, () => false),
  ];
}

/** A distribution literal with the given fractions and a dummy count map. */
function fractions(down: number, steady: number, up: number): BandShiftDistribution {
  return {
    profiles: 1,
    counts: { down: 0, steady: 0, up: 0 },
    down,
    steady,
    up,
  };
}

describe("mulberry32", () => {
  it("reproduces the same draws for the same seed", () => {
    const first = mulberry32(1234);
    const second = mulberry32(1234);
    expect([first(), first(), first()]).toEqual([second(), second(), second()]);
  });

  it("matches the shared seeded-RNG fixed points", () => {
    const draws = mulberry32(1234);
    expect(draws()).toBe(0.07329497812315822);
    expect(draws()).toBe(0.7034119898453355);
    expect(draws()).toBe(0.9028560190927237);
    expect(mulberry32(0)()).toBe(0.26642920868471265);
  });
});

describe("answer-stream model", () => {
  it("spans the three latent-accuracy components, with typical the most common", () => {
    const rng = mulberry32(SIMULATION_SEED);
    const draws = Array.from({ length: 500 }, () => sampleLatentAccuracy(rng));
    const means = ACCURACY_COMPONENTS.map((component) => component.mean);
    expect([...new Set(draws)].sort()).toEqual([...means].sort());
    const counts = means.map((mean) => draws.filter((draw) => draw === mean).length);
    expect(counts[1]).toBeGreaterThan(counts[0]);
    expect(counts[1]).toBeGreaterThan(counts[2]);
  });

  it("draws exactly one full window of taps", () => {
    let draws = 0;
    const rng = () => {
      draws += 1;
      return 0.5;
    };
    const window = simulateWindow(0.62, rng);
    expect(window).toHaveLength(TAP_WINDOW);
    expect(window.every((tap) => tap)).toBe(true);
    expect(draws).toBe(TAP_WINDOW);
    expect(simulateWindow(0.5, rng).every((tap) => tap)).toBe(false);
  });
});

describe("simulateDistribution", () => {
  it("meets the designed 70/15/15 curve with the candidate cut points", () => {
    const distribution = simulateDistribution(
      SIMULATION_PROFILES,
      CANDIDATE_UP,
      CANDIDATE_DOWN,
      mulberry32(SIMULATION_SEED),
    );
    expect(distribution.profiles).toBeGreaterThanOrEqual(1000);
    expect(distributionMeetsTarget(distribution)).toBe(true);
    expect(distribution.counts.down + distribution.counts.steady + distribution.counts.up).toBe(
      distribution.profiles,
    );
    expect(distribution.down + distribution.steady + distribution.up).toBeCloseTo(1, 12);
  });

  it("is reproducible from a seed and varies with a different seed", () => {
    const run = (seed: number) =>
      simulateDistribution(SIMULATION_PROFILES, CANDIDATE_UP, CANDIDATE_DOWN, mulberry32(seed));
    expect(run(SIMULATION_SEED)).toEqual(run(SIMULATION_SEED));
    expect(run(SIMULATION_SEED)).not.toEqual(run(SIMULATION_SEED + 1));
  });

  it("uses the real bandShiftFor with injected cut points", () => {
    const up = 0.95;
    const down = 0.3;
    const expected = { down: 0, steady: 0, up: 0 };
    const rng = mulberry32(7);
    for (let i = 0; i < 40; i++) {
      const shift = bandShiftFor(simulateWindow(sampleLatentAccuracy(rng), rng), up, down);
      if (shift === -1) expected.down += 1;
      else if (shift === 1) expected.up += 1;
      else expected.steady += 1;
    }
    expect(simulateDistribution(40, up, down, mulberry32(7)).counts).toEqual(expected);
  });

  it("guards degenerate RNGs and an empty run against division by zero", () => {
    for (const constant of [0, 0.5, 0.999999]) {
      const distribution = simulateDistribution(100, CANDIDATE_UP, CANDIDATE_DOWN, () => constant);
      for (const value of [distribution.down, distribution.steady, distribution.up]) {
        expect(Number.isFinite(value)).toBe(true);
      }
      expect(distribution.down + distribution.steady + distribution.up).toBeCloseTo(1, 12);
    }
    const empty = simulateDistribution(0, CANDIDATE_UP, CANDIDATE_DOWN, () => 0.5);
    expect(empty).toEqual({
      profiles: 0,
      counts: { down: 0, steady: 0, up: 0 },
      down: 0,
      steady: 0,
      up: 0,
    });
  });
});

describe("distributionMeetsTarget", () => {
  it("accepts the target and rejects each band outside its tolerance", () => {
    expect(
      distributionMeetsTarget(
        fractions(TARGET_DISTRIBUTION.down, TARGET_DISTRIBUTION.steady, TARGET_DISTRIBUTION.up),
      ),
    ).toBe(true);
    expect(distributionMeetsTarget(fractions(0.3, 0.55, 0.15))).toBe(false);
    expect(distributionMeetsTarget(fractions(0.15, 0.5, 0.35))).toBe(false);
    expect(distributionMeetsTarget(fractions(0.05, 0.7, 0.25))).toBe(true);
  });
});

describe("findTunedCutPoints", () => {
  it("returns only curve-meeting pairs, including the recorded candidate", () => {
    const pairs = findTunedCutPoints(SIMULATION_SEED, SIMULATION_PROFILES);
    expect(pairs.length).toBeGreaterThan(0);
    for (const pair of pairs) {
      expect(pair.up).toBeGreaterThan(pair.down);
      expect(distributionMeetsTarget(pair.distribution)).toBe(true);
    }
    expect(pairs).toContainEqual(
      expect.objectContaining({ up: CANDIDATE_UP, down: CANDIDATE_DOWN }),
    );
    expect(findTunedCutPoints(SIMULATION_SEED, SIMULATION_PROFILES)).toEqual(pairs);
  });
});

describe("bandShiftFor optional cut points", () => {
  it("defaults to the shipped constants so one-argument calls are unchanged", () => {
    for (const correct of [0, 3, MIN_SAMPLE, 6, 8, 9, TAP_WINDOW]) {
      const window = makeWindow(correct);
      expect(bandShiftFor(window)).toBe(bandShiftFor(window, UP_THRESHOLD, DOWN_THRESHOLD));
    }
  });

  it("honours injected up and down cut points, including exact boundaries", () => {
    expect(bandShiftFor(makeWindow(9), 0.9, 0.5)).toBe(1);
    expect(bandShiftFor(makeWindow(9), 0.95, 0.5)).toBe(0);
    expect(bandShiftFor(makeWindow(4), 0.9, 0.5)).toBe(-1);
    expect(bandShiftFor(makeWindow(5), 0.9, 0.5)).toBe(0);
    expect(bandShiftFor(makeWindow(5), 0.9, 0.6)).toBe(-1);
    expect(bandShiftFor(makeWindow(MIN_SAMPLE - 1), 0.9, 0.5)).toBe(0);
  });
});

describe("pinned tuned constants", () => {
  it("pins the shipped thresholds to the recorded candidate pair", () => {
    expect(UP_THRESHOLD).toBe(CANDIDATE_UP);
    expect(DOWN_THRESHOLD).toBe(CANDIDATE_DOWN);
    expect(UP_THRESHOLD).toBe(0.9);
    expect(DOWN_THRESHOLD).toBe(0.5);
  });

  it("meets the designed curve with the shipped pinned constants", () => {
    const distribution = simulateDistribution(
      SIMULATION_PROFILES,
      UP_THRESHOLD,
      DOWN_THRESHOLD,
      mulberry32(SIMULATION_SEED),
    );
    expect(distribution.profiles).toBeGreaterThanOrEqual(1000);
    expect(distributionMeetsTarget(distribution)).toBe(true);
    for (const band of ["down", "steady", "up"] as const) {
      expect(distribution[band]).toBeGreaterThanOrEqual(
        TARGET_DISTRIBUTION[band] - TARGET_TOLERANCE,
      );
      expect(distribution[band]).toBeLessThanOrEqual(TARGET_DISTRIBUTION[band] + TARGET_TOLERANCE);
    }
  });
});
