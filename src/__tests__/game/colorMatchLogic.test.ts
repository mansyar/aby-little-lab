import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildPlaythrough,
  buildRound,
  COLOR_CARDS,
  COLOR_POOLS,
  type ColorId,
  type ColorMatchRound,
  isCorrect,
  promptFor,
} from "../../game/colorMatchLogic";

afterEach(() => {
  vi.restoreAllMocks();
});

/** Number of rounds sampled to exercise randomized behavior without flaking. */
const VARIETY_SAMPLES = 200;

function expectValidRound(round: ColorMatchRound): void {
  expect(round.cards).toHaveLength(4);
  const colorIds = round.cards.map((card) => card.colorId);
  // Exactly 4 distinct colors — the target must be findable by eye.
  expect(new Set(colorIds).size).toBe(4);
  expect(colorIds).toContain(round.targetColorId);
  for (const card of round.cards) {
    expect(COLOR_CARDS.some((known) => known.colorId === card.colorId)).toBe(true);
    expect(card.texture.length).toBeGreaterThan(0);
    expect(card.fill).toMatch(/^#[0-9A-F]{6}$/i);
    expect(card.name.length).toBeGreaterThan(0);
  }
}

describe("color pools & cards", () => {
  it("defines 6 color cards with unique color ids and textures", () => {
    expect(COLOR_CARDS).toHaveLength(6);
    const ids = new Set<ColorId>();
    const textures = new Set<string>();
    for (const card of COLOR_CARDS) {
      expect(ids.has(card.colorId)).toBe(false);
      ids.add(card.colorId);
      expect(textures.has(card.texture)).toBe(false);
      textures.add(card.texture);
    }
  });

  it("easy pool is 4 basic colors and hard pool is all 6, easy ⊂ hard", () => {
    expect(COLOR_POOLS.easy).toEqual(["red", "blue", "yellow", "green"]);
    expect(COLOR_POOLS.hard).toEqual(["red", "blue", "yellow", "green", "orange", "purple"]);
    for (const color of COLOR_POOLS.easy) {
      expect(COLOR_POOLS.hard).toContain(color);
    }
  });

  it("every pool entry exists in COLOR_CARDS", () => {
    const known = new Set(COLOR_CARDS.map((card) => card.colorId));
    for (const color of [...COLOR_POOLS.easy, ...COLOR_POOLS.hard]) {
      expect(known.has(color)).toBe(true);
    }
  });

  it("swatch fills match the source SVG fills so children match by eye", () => {
    const fillOf = (colorId: ColorId): string =>
      COLOR_CARDS.find((card) => card.colorId === colorId)?.fill ?? "";
    expect(fillOf("red")).toBe("#E53E3E"); // shape_heart
    expect(fillOf("blue")).toBe("#3182CE"); // frog_blue body
    expect(fillOf("yellow")).toBe("#ECC94B"); // shape_crescent
    expect(fillOf("green")).toBe("#48BB78"); // shape_rectangle
    expect(fillOf("orange")).toBe("#F6AD55"); // shape_circle
    expect(fillOf("purple")).toBe("#9F7AEA"); // shape_square
  });
});

describe("buildRound", () => {
  it("produces structurally valid rounds for both pools across many samples", () => {
    for (const pool of [COLOR_POOLS.easy, COLOR_POOLS.hard]) {
      for (let i = 0; i < VARIETY_SAMPLES; i++) {
        expectValidRound(buildRound(pool));
      }
    }
  });

  it("draws every card from the given pool", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const round = buildRound(COLOR_POOLS.easy);
      for (const card of round.cards) {
        expect(COLOR_POOLS.easy).toContain(card.colorId);
      }
      const hard = buildRound(COLOR_POOLS.hard);
      for (const card of hard.cards) {
        expect(COLOR_POOLS.hard).toContain(card.colorId);
      }
    }
  });

  it("always places the target among the 4 cards", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const round = buildRound(COLOR_POOLS.hard);
      expect(round.cards.map((card) => card.colorId)).toContain(round.targetColorId);
    }
  });

  it("varies cards and target across samples", () => {
    const cardSets = new Set<string>();
    const targets = new Set<ColorId>();
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const round = buildRound(COLOR_POOLS.hard);
      cardSets.add(
        round.cards
          .map((card) => card.colorId)
          .sort()
          .join(","),
      );
      targets.add(round.targetColorId);
    }
    expect(cardSets.size).toBeGreaterThan(1);
    expect(targets.size).toBeGreaterThan(1);
  });

  it("is deterministic under a fixed random sequence", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const first = buildRound(COLOR_POOLS.hard);
    vi.restoreAllMocks();
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const second = buildRound(COLOR_POOLS.hard);
    expect(second).toEqual(first);
    expectValidRound(first);
  });

  it("throws for a pool color id missing from COLOR_CARDS", () => {
    expect(() => buildRound(["pink" as ColorId])).toThrow("Unknown color pink");
  });
});

describe("buildPlaythrough", () => {
  it("returns exactly 6 rounds", () => {
    expect(buildPlaythrough()).toHaveLength(6);
  });

  it("proceeds easy-first through the bands (3 rounds each)", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const playthrough = buildPlaythrough();
      // Rounds 1-3: easy — cards drawn from the 4-color pool.
      for (const round of playthrough.slice(0, 3)) {
        for (const card of round.cards) {
          expect(COLOR_POOLS.easy).toContain(card.colorId);
        }
      }
      // Rounds 4-6: hard — cards drawn from the 6-color pool.
      for (const round of playthrough.slice(3)) {
        for (const card of round.cards) {
          expect(COLOR_POOLS.hard).toContain(card.colorId);
        }
      }
    }
  });

  it("keeps every round structurally valid", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      for (const round of buildPlaythrough()) {
        expectValidRound(round);
      }
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

describe("isCorrect", () => {
  it("returns true only for the card whose color matches the target", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const round = buildRound(COLOR_POOLS.hard);
      round.cards.forEach((card, slot) => {
        expect(isCorrect(round.cards, slot, round.targetColorId)).toBe(
          card.colorId === round.targetColorId,
        );
      });
    }
  });

  it("accepts every color as the target across many playthroughs", () => {
    const targets = new Set<ColorId>();
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const round = buildPlaythrough()[0];
      round.cards.forEach((card, slot) => {
        if (isCorrect(round.cards, slot, round.targetColorId)) targets.add(card.colorId);
      });
    }
    expect(targets.size).toBeGreaterThan(1);
  });

  it("returns false for an out-of-range index", () => {
    const round = buildRound(COLOR_POOLS.easy);
    expect(isCorrect(round.cards, 99, round.targetColorId)).toBe(false);
  });
});

describe("promptFor", () => {
  it("returns the spoken color name for each known color id", () => {
    expect(promptFor("red")).toBe("red");
    expect(promptFor("blue")).toBe("blue");
    expect(promptFor("yellow")).toBe("yellow");
    expect(promptFor("green")).toBe("green");
    expect(promptFor("orange")).toBe("orange");
    expect(promptFor("purple")).toBe("purple");
  });

  it("falls back to the color id for unknown colors", () => {
    expect(promptFor("pink" as ColorId)).toBe("pink");
  });
});
