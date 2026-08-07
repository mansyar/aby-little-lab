import { afterEach, describe, expect, it, vi } from "vitest";
import {
  COUNT_ITEMS,
  type CountGroup,
  type CountRound,
  createPlaythrough,
  createRound,
  evaluateRound,
  ROUND_BANDS,
} from "../../game/countLogic";

afterEach(() => {
  vi.restoreAllMocks();
});

/** Number of rounds sampled to exercise randomized behavior without flaking. */
const VARIETY_SAMPLES = 200;

function expectValidRound(round: CountRound, bandIndex: 0 | 1 | 2): void {
  const band = ROUND_BANDS[bandIndex];
  expect(round.groups).toHaveLength(band.groupCount);
  // Target falls inside the band's counting range.
  expect(round.target).toBeGreaterThanOrEqual(1);
  expect(round.target).toBeLessThanOrEqual(band.max);
  // All group counts distinct.
  const counts = round.groups.map((group) => group.count);
  expect(new Set(counts).size).toBe(counts.length);
  // Every group count within the band's range (and never zero).
  for (const count of counts) {
    expect(count).toBeGreaterThanOrEqual(1);
    expect(count).toBeLessThanOrEqual(band.max);
  }
  // Exactly one group matches the target.
  const matching = round.groups.filter((group) => group.count === round.target);
  expect(matching).toHaveLength(1);
  // Item textures distinct across the round's groups and from the pool.
  const textures = round.groups.map((group) => group.texture);
  expect(new Set(textures).size).toBe(textures.length);
  for (const texture of textures) {
    expect(COUNT_ITEMS).toContain(texture);
  }
}

describe("COUNT_ITEMS", () => {
  it("provides at least 4 clearly countable item textures", () => {
    expect(COUNT_ITEMS.length).toBeGreaterThanOrEqual(4);
  });

  it("has no duplicate texture keys", () => {
    expect(new Set(COUNT_ITEMS).size).toBe(COUNT_ITEMS.length);
  });

  it("uses only PreloadScene-registered texture keys", () => {
    const KNOWN_TEXTURE_KEYS = new Set([
      "shape_star",
      "sm_ball",
      "food_apple",
      "food_fish",
      "food_carrot",
      "sm_sun",
      "sm_house",
      "sm_duck",
    ]);
    for (const texture of COUNT_ITEMS) {
      expect(KNOWN_TEXTURE_KEYS.has(texture)).toBe(true);
    }
    // Bijection guard: no stale entries may linger in the known-key list.
    expect(new Set(COUNT_ITEMS).size).toBe(KNOWN_TEXTURE_KEYS.size);
  });
});

describe("ROUND_BANDS", () => {
  it("defines the three progressive bands", () => {
    expect(ROUND_BANDS).toHaveLength(3);
    expect(ROUND_BANDS[0].max).toBe(3);
    expect(ROUND_BANDS[0].groupCount).toBe(3);
    expect(ROUND_BANDS[1].max).toBe(5);
    expect(ROUND_BANDS[1].groupCount).toBe(4);
    expect(ROUND_BANDS[2].max).toBe(10);
    expect(ROUND_BANDS[2].groupCount).toBe(4);
  });
});

describe("createRound", () => {
  it("produces structurally valid rounds for every band across many samples", () => {
    for (let bandIndex = 0; bandIndex < ROUND_BANDS.length; bandIndex++) {
      for (let i = 0; i < VARIETY_SAMPLES; i++) {
        expectValidRound(createRound((bandIndex + 1) as 1 | 2 | 3), bandIndex as 0 | 1 | 2);
      }
    }
  });

  it("never draws a group count outside the band's range", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const round = createRound(1);
      for (const group of round.groups) {
        expect(group.count).toBeGreaterThanOrEqual(1);
        expect(group.count).toBeLessThanOrEqual(3);
      }
    }
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const round = createRound(3);
      for (const group of round.groups) {
        expect(group.count).toBeGreaterThanOrEqual(1);
        expect(group.count).toBeLessThanOrEqual(10);
      }
    }
  });

  it("varies target counts and item types across samples", () => {
    const seenTargets = new Set<number>();
    const seenTextures = new Set<string>();
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const round = createRound(2);
      seenTargets.add(round.target);
      for (const group of round.groups) {
        seenTextures.add(group.texture);
      }
    }
    expect(seenTargets.size).toBeGreaterThan(1);
    expect(seenTextures.size).toBeGreaterThan(1);
  });

  it("is deterministic under a fixed random sequence", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const first = createRound(2);
    vi.restoreAllMocks();
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const second = createRound(2);
    expect(second).toEqual(first);
    expectValidRound(first, 1);
  });
});

describe("createPlaythrough", () => {
  it("returns exactly 6 rounds", () => {
    expect(createPlaythrough()).toHaveLength(6);
  });

  it("keeps the two rounds of each band at distinct targets", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const playthrough = createPlaythrough();
      // Band pairs: (0,1) = 1-3, (2,3) = 1-5, (4,5) = 1-10.
      expect(playthrough[0].target).not.toBe(playthrough[1].target);
      expect(playthrough[2].target).not.toBe(playthrough[3].target);
      expect(playthrough[4].target).not.toBe(playthrough[5].target);
    }
  });

  it("proceeds easy-first through the bands (2 rounds each)", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const playthrough = createPlaythrough();
      // Rounds 1-2: band 1 (3 groups, targets 1-3).
      for (const round of playthrough.slice(0, 2)) {
        expectValidRound(round, 0);
      }
      // Rounds 3-4: band 2 (4 groups, targets 1-5).
      for (const round of playthrough.slice(2, 4)) {
        expectValidRound(round, 1);
      }
      // Rounds 5-6: band 3 (4 groups, targets 1-10).
      for (const round of playthrough.slice(4)) {
        expectValidRound(round, 2);
      }
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

describe("evaluateRound", () => {
  it("returns true only for the group matching the target count", () => {
    const round: CountRound = {
      target: 3,
      groups: [
        { count: 1, texture: "shape_star" },
        { count: 3, texture: "sm_ball" },
        { count: 5, texture: "food_apple" },
        { count: 7, texture: "food_fish" },
      ],
    };
    const targetGroup = round.groups.find((group) => group.count === round.target) as CountGroup;
    expect(evaluateRound(round, targetGroup)).toBe(true);
    for (const group of round.groups) {
      if (group !== targetGroup) {
        expect(evaluateRound(round, group)).toBe(false);
      }
    }
  });
});
