import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ANIMAL_ITEMS,
  createPlaythrough,
  createRound,
  FROG_ITEMS,
  isCorrect,
  ODD_ITEMS,
  type OddItem,
  type OddOneRound,
  promptFor,
  SHAPE_ITEMS,
  TOY_ITEMS,
} from "../../game/oddOneOutLogic";

afterEach(() => {
  vi.restoreAllMocks();
});

/** Number of rounds sampled to exercise randomized behavior without flaking. */
const VARIETY_SAMPLES = 200;

function expectValidRound(round: OddOneRound): void {
  expect(round.groupTexture).not.toBe(round.oddTexture);
  expect(round.oddSlot).toBeGreaterThanOrEqual(0);
  expect(round.oddSlot).toBeLessThanOrEqual(3);
  // Both textures come from the known pool.
  expect(ODD_ITEMS.some((item) => item.texture === round.groupTexture)).toBe(true);
  expect(ODD_ITEMS.some((item) => item.texture === round.oddTexture)).toBe(true);
}

function categoryOf(texture: string): string {
  const item = ODD_ITEMS.find((candidate) => candidate.texture === texture);
  if (!item) throw new Error(`Unknown texture ${texture}`);
  return item.category;
}

describe("item pools", () => {
  it("defines the expected pool sizes", () => {
    expect(ANIMAL_ITEMS).toHaveLength(6);
    expect(FROG_ITEMS).toHaveLength(3);
    expect(TOY_ITEMS).toHaveLength(6);
    expect(SHAPE_ITEMS).toHaveLength(18);
    expect(ODD_ITEMS).toHaveLength(33);
  });

  it("uses only registered PreloadScene texture keys and unique textures", () => {
    const seen = new Set<string>();
    for (const item of ODD_ITEMS) {
      expect(seen.has(item.texture)).toBe(false);
      seen.add(item.texture);
    }
    for (const item of ODD_ITEMS) {
      expect(item.texture).toMatch(/^(animal_|frog_|toy_|shape_)/);
    }
  });

  it("groups frogs as their own category and animals/toys/shapes under theirs", () => {
    for (const item of ANIMAL_ITEMS) expect(item.category).toBe("animal");
    for (const item of FROG_ITEMS) expect(item.category).toBe("frog");
    for (const item of TOY_ITEMS) expect(item.category).toBe("toy");
    for (const item of SHAPE_ITEMS) expect(item.category).toBe("shape");
  });
});

describe("createRound", () => {
  it("produces structurally valid rounds for every band across many samples", () => {
    for (const band of [1, 2, 3] as const) {
      for (let i = 0; i < VARIETY_SAMPLES; i++) {
        expectValidRound(createRound(band));
      }
    }
  });

  it("band 1: odd one is from a different category than the group", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const round = createRound(1);
      expect(categoryOf(round.oddTexture)).not.toBe(categoryOf(round.groupTexture));
    }
  });

  it("band 2: odd one is a different item of the same category", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const round = createRound(2);
      expect(categoryOf(round.oddTexture)).toBe(categoryOf(round.groupTexture));
      expect(round.oddTexture).not.toBe(round.groupTexture);
      // Color-variant frogs are reserved for band 3.
      expect(categoryOf(round.groupTexture)).not.toBe("frog");
    }
  });

  it("band 3: odd one is a differently colored frog of the same kind", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const round = createRound(3);
      expect(categoryOf(round.groupTexture)).toBe("frog");
      expect(categoryOf(round.oddTexture)).toBe("frog");
      expect(round.oddTexture).not.toBe(round.groupTexture);
    }
  });

  it("never repeats an odd texture already used in the playthrough", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const used = new Set(["shape_star", "animal_dog"]);
      const round = createRound(1, used);
      expect(used.has(round.oddTexture)).toBe(false);
      const frogRound = createRound(3, new Set(["frog_green"]));
      expect(frogRound.oddTexture).not.toBe("frog_green");
    }
  });

  it("varies group texture, odd texture, and odd slot across samples", () => {
    const groups = new Set<string>();
    const odds = new Set<string>();
    const slots = new Set<number>();
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const round = createRound(1);
      groups.add(round.groupTexture);
      odds.add(round.oddTexture);
      slots.add(round.oddSlot);
    }
    expect(groups.size).toBeGreaterThan(1);
    expect(odds.size).toBeGreaterThan(1);
    expect(slots.size).toBeGreaterThan(1);
  });

  it("is deterministic under a fixed random sequence", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const first = createRound(2);
    vi.restoreAllMocks();
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const second = createRound(2);
    expect(second).toEqual(first);
    expectValidRound(first);
  });
});

describe("createPlaythrough", () => {
  it("returns exactly 6 rounds", () => {
    expect(createPlaythrough()).toHaveLength(6);
  });

  it("proceeds easy-first through the bands (2 rounds each)", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const playthrough = createPlaythrough();
      // Rounds 1-2: band 1 — cross-category.
      for (const round of playthrough.slice(0, 2)) {
        expect(categoryOf(round.oddTexture)).not.toBe(categoryOf(round.groupTexture));
      }
      // Rounds 3-4: band 2 — same category, different item.
      for (const round of playthrough.slice(2, 4)) {
        expect(categoryOf(round.oddTexture)).toBe(categoryOf(round.groupTexture));
        expect(categoryOf(round.groupTexture)).not.toBe("frog");
      }
      // Rounds 5-6: band 3 — frog color variants.
      for (const round of playthrough.slice(4)) {
        expect(categoryOf(round.groupTexture)).toBe("frog");
        expect(categoryOf(round.oddTexture)).toBe("frog");
      }
    }
  });

  it("never repeats an odd texture across the 6 rounds", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const playthrough = createPlaythrough();
      const oddTextures = playthrough.map((round) => round.oddTexture);
      expect(new Set(oddTextures).size).toBe(6);
    }
  });

  it("keeps every round structurally valid", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      for (const round of createPlaythrough()) {
        expectValidRound(round);
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

describe("isCorrect", () => {
  function makeRound(oddSlot: number): OddOneRound {
    return { groupTexture: "shape_circle", oddTexture: "shape_star", oddSlot };
  }

  it("returns true only for the slot holding the odd card", () => {
    for (let oddSlot = 0; oddSlot < 4; oddSlot++) {
      const round = makeRound(oddSlot);
      for (let slot = 0; slot < 4; slot++) {
        expect(isCorrect(round, slot)).toBe(slot === oddSlot);
      }
    }
  });

  it("accepts every slot as the odd one across many playthroughs", () => {
    const slots = new Set<number>();
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const round = createPlaythrough()[0];
      for (let slot = 0; slot < 4; slot++) {
        if (isCorrect(round, slot)) slots.add(slot);
      }
    }
    expect(slots.size).toBe(4);
  });
});

describe("promptFor", () => {
  it("returns the spoken word for each pool texture", () => {
    expect(promptFor("animal_cat")).toBe("cat");
    expect(promptFor("animal_dog")).toBe("dog");
    expect(promptFor("frog_green")).toBe("green frog");
    expect(promptFor("frog_blue")).toBe("blue frog");
    expect(promptFor("toy_teddy_bear")).toBe("teddy bear");
    expect(promptFor("toy_ball")).toBe("ball");
    expect(promptFor("shape_circle")).toBe("circle");
    expect(promptFor("shape_star")).toBe("star");
  });

  it("has a prompt for every item in the pool", () => {
    for (const item of ODD_ITEMS) {
      expect(promptFor(item.texture)).not.toBe(item.texture);
      expect(promptFor(item.texture).length).toBeGreaterThan(0);
    }
  });

  it("falls back to the texture key for unknown textures", () => {
    expect(promptFor("unknown_thing")).toBe("unknown_thing");
  });
});

describe("pool item metadata", () => {
  it("every OddItem has both texture and category fields", () => {
    for (const item of ODD_ITEMS as OddItem[]) {
      expect(typeof item.texture).toBe("string");
      expect(item.texture.length).toBeGreaterThan(0);
      expect(["animal", "frog", "toy", "shape"]).toContain(item.category);
    }
  });
});
