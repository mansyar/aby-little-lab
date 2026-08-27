import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BAND_GRID,
  BAND_PAIRS,
  bandForRound,
  buildPlaythrough,
  buildRound,
  isPair,
  isRoundComplete,
  MEMORY_POOL,
  type MemoryBand,
  type MemoryRound,
} from "../../game/memoryMatchLogic";

afterEach(() => {
  vi.restoreAllMocks();
});

/** Number of rounds sampled to exercise randomized behavior without flaking. */
const VARIETY_SAMPLES = 200;

function expectValidRound(round: MemoryRound): void {
  const { rows, cols } = BAND_GRID[round.band];
  const pairs = BAND_PAIRS[round.band];
  expect(round.rows).toBe(rows);
  expect(round.cols).toBe(cols);
  // Layout is exactly the grid area: rows × cols cards.
  expect(round.layout).toHaveLength(rows * cols);
  // Exactly `pairs` distinct textures for this band.
  expect(round.textures).toHaveLength(pairs);
  expect(new Set(round.textures).size).toBe(pairs);
  // Every texture in the round comes from the shared pool.
  for (const texture of round.textures) {
    expect(MEMORY_POOL).toContain(texture);
  }
  // Each pair texture appears exactly twice in the layout (a full grid).
  const counts = new Map<string, number>();
  for (const texture of round.layout) {
    counts.set(texture, (counts.get(texture) ?? 0) + 1);
  }
  for (const texture of round.textures) {
    expect(counts.get(texture)).toBe(2);
  }
  // No stray textures outside the round's pair set.
  expect(counts.size).toBe(pairs);
}

describe("pool & band constants", () => {
  it("defines a pool of 16 unique texture keys", () => {
    expect(MEMORY_POOL).toHaveLength(16);
    expect(new Set(MEMORY_POOL).size).toBe(16);
    for (const texture of MEMORY_POOL) {
      expect(texture.length).toBeGreaterThan(0);
    }
  });

  it("defines 3 pairs per easy round and a 2x3 grid", () => {
    expect(BAND_PAIRS.easy).toBe(3);
    expect(BAND_GRID.easy).toEqual({ rows: 2, cols: 3 });
  });

  it("defines 6 pairs per medium round and a 3x4 grid", () => {
    expect(BAND_PAIRS.medium).toBe(6);
    expect(BAND_GRID.medium).toEqual({ rows: 3, cols: 4 });
  });

  it("defines 8 pairs per hard round and a 4x4 grid", () => {
    expect(BAND_PAIRS.hard).toBe(8);
    expect(BAND_GRID.hard).toEqual({ rows: 4, cols: 4 });
  });

  it("every band grid area holds exactly 2 cards per pair", () => {
    for (const band of ["easy", "medium", "hard"] as const) {
      const { rows, cols } = BAND_GRID[band];
      expect(rows * cols).toBe(BAND_PAIRS[band] * 2);
    }
  });
});

describe("bandForRound", () => {
  it("maps rounds 1-2 to easy, 3-4 to medium, 5-6 to hard", () => {
    expect(bandForRound(0)).toBe("easy");
    expect(bandForRound(1)).toBe("easy");
    expect(bandForRound(2)).toBe("medium");
    expect(bandForRound(3)).toBe("medium");
    expect(bandForRound(4)).toBe("hard");
    expect(bandForRound(5)).toBe("hard");
  });

  it("clamps out-of-range round indices to the hard band", () => {
    expect(bandForRound(6)).toBe("hard");
    expect(bandForRound(99)).toBe("hard");
  });
});

describe("buildRound", () => {
  it("produces structurally valid rounds for every band across many samples", () => {
    for (const band of ["easy", "medium", "hard"] as const) {
      for (let i = 0; i < VARIETY_SAMPLES; i++) {
        expectValidRound(buildRound(band));
      }
    }
  });

  it("varies card layout across samples (shuffled positions)", () => {
    const layouts = new Set<string>();
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      layouts.add(buildRound("medium").layout.join(","));
    }
    expect(layouts.size).toBeGreaterThan(1);
  });

  it("varies the drawn texture set across samples", () => {
    const textureSets = new Set<string>();
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      textureSets.add([...buildRound("hard").textures].sort().join(","));
    }
    expect(textureSets.size).toBeGreaterThan(1);
  });

  it("is deterministic under a fixed random sequence", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const first = buildRound("medium");
    vi.restoreAllMocks();
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const second = buildRound("medium");
    expect(second).toEqual(first);
    expectValidRound(first);
  });

  it("throws for an unknown band", () => {
    expect(() => buildRound("extreme" as MemoryBand)).toThrow("Unknown band extreme");
  });
});

describe("buildPlaythrough", () => {
  it("returns exactly 6 rounds", () => {
    expect(buildPlaythrough()).toHaveLength(6);
  });

  it("proceeds easy-first through the bands (2 rounds each)", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const playthrough = buildPlaythrough();
      expect(playthrough.map((round) => round.band)).toEqual([
        "easy",
        "easy",
        "medium",
        "medium",
        "hard",
        "hard",
      ]);
    }
  });

  it("keeps every round structurally valid", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      for (const round of buildPlaythrough()) {
        expectValidRound(round);
      }
    }
  });

  it("varies the hard-round texture set across samples", () => {
    const textureSets = new Set<string>();
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      textureSets.add([...buildPlaythrough()[5].textures].sort().join(","));
    }
    expect(textureSets.size).toBeGreaterThan(1);
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

describe("buildPlaythrough (adaptive shift)", () => {
  it("shifts the ladder down at shift -1 (easy x4, medium x2)", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      expect(buildPlaythrough(-1).map((round) => round.band)).toEqual([
        "easy",
        "easy",
        "easy",
        "easy",
        "medium",
        "medium",
      ]);
    }
  });

  it("keeps the classic ladder at shift 0", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      expect(buildPlaythrough(0).map((round) => round.band)).toEqual([
        "easy",
        "easy",
        "medium",
        "medium",
        "hard",
        "hard",
      ]);
    }
  });

  it("shifts the ladder up at shift +1 (medium x2, hard x4)", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      expect(buildPlaythrough(1).map((round) => round.band)).toEqual([
        "medium",
        "medium",
        "hard",
        "hard",
        "hard",
        "hard",
      ]);
    }
  });

  it("keeps every shifted round structurally valid", () => {
    for (const shift of [-1, 0, 1] as const) {
      for (let i = 0; i < 20; i++) {
        for (const round of buildPlaythrough(shift)) {
          expectValidRound(round);
        }
      }
    }
  });

  it("is deterministic under a fixed random sequence for every shift", () => {
    for (const shift of [-1, 0, 1] as const) {
      vi.spyOn(Math, "random").mockReturnValue(0.5);
      const first = buildPlaythrough(shift);
      vi.restoreAllMocks();
      vi.spyOn(Math, "random").mockReturnValue(0.5);
      const second = buildPlaythrough(shift);
      expect(second).toEqual(first);
    }
  });
});

describe("isPair", () => {
  it("returns true only when two different indices share a texture", () => {
    // Exhaustive per round (every index pair); a few rounds guard layout variety.
    for (let i = 0; i < 10; i++) {
      const round = buildRound("medium");
      for (let a = 0; a < round.layout.length; a++) {
        for (let b = 0; b < round.layout.length; b++) {
          expect(isPair(round.layout, a, b)).toBe(a !== b && round.layout[a] === round.layout[b]);
        }
      }
    }
  });

  it("returns false for the same index twice (no self-pairing)", () => {
    const round = buildRound("easy");
    for (let i = 0; i < round.layout.length; i++) {
      expect(isPair(round.layout, i, i)).toBe(false);
    }
  });

  it("returns false for out-of-range indices", () => {
    const round = buildRound("easy");
    expect(isPair(round.layout, 0, 99)).toBe(false);
    expect(isPair(round.layout, -1, 0)).toBe(false);
    expect(isPair(round.layout, 99, 0)).toBe(false);
  });
});

describe("isRoundComplete", () => {
  it("returns true when every card is matched", () => {
    expect(isRoundComplete([true, true, true, true, true, true])).toBe(true);
  });

  it("returns false when any card is unmatched", () => {
    expect(isRoundComplete([true, true, false, true, true, true])).toBe(false);
    expect(isRoundComplete([false, false, false])).toBe(false);
  });

  it("returns true for an empty round (nothing left to match)", () => {
    expect(isRoundComplete([])).toBe(true);
  });
});
