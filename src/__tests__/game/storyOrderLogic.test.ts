import { describe, expect, it } from "vitest";
import { STORY_VARIANT_IDS } from "../../game/contentVariants";
import {
  buildPlaythrough,
  buildRound,
  isCorrect,
  mixFor,
  OBVIOUS_POOL,
  ROUND_COUNT,
  ROUNDS_PER_BAND,
  STORY_IDS,
  STORY_POOL,
  type Story,
  SUBTLE_POOL,
} from "../../game/storyOrderLogic";
import { STORY_VARIANTS, storyVariantPool } from "../../game/storyVariants";
import { mulberry32 } from "../helpers/randomHelper";

const storyById = new Map<string, Story>(STORY_POOL.map((story) => [story.id, story]));

function storyFor(id: string): Story {
  const story = storyById.get(id);
  if (!story) throw new Error(`unknown story id: ${id}`);
  return story;
}

/** RNG that replays a fixed sequence and records how many values it handed out. */
function sequenceRng(values: readonly number[]): { rng: () => number; calls: () => number } {
  let calls = 0;
  return {
    rng: () => {
      const value = values[calls];
      if (value === undefined) throw new Error("sequence RNG exhausted");
      calls++;
      return value;
    },
    calls: () => calls,
  };
}

describe("STORY_POOL", () => {
  it("holds thirty stories with unique ids and three unique panels each", () => {
    expect(STORY_POOL).toHaveLength(30);
    expect(new Set(STORY_IDS).size).toBe(30);
    expect(STORY_IDS).toEqual(STORY_POOL.map((story) => story.id));
    for (const story of STORY_POOL) {
      expect(story.panels).toHaveLength(3);
      expect(new Set(story.panels).size).toBe(3);
      for (const panel of story.panels) expect(panel.length).toBeGreaterThan(0);
    }
  });

  it("uses 90 distinct panel keys across the pool", () => {
    const panels = STORY_POOL.flatMap((story) => [...story.panels]);
    expect(panels).toHaveLength(90);
    expect(new Set(panels).size).toBe(90);
  });

  it("splits into fifteen obvious and fifteen subtle stories", () => {
    expect(OBVIOUS_POOL).toHaveLength(15);
    expect(SUBTLE_POOL).toHaveLength(15);
    expect(OBVIOUS_POOL.length + SUBTLE_POOL.length).toBe(STORY_POOL.length);
    for (const story of OBVIOUS_POOL) expect(story.ladder).toBe("obvious");
    for (const story of SUBTLE_POOL) expect(story.ladder).toBe("subtle");
  });

  it("maps each band shift to its obvious/subtle round mix", () => {
    expect(mixFor(-1)).toEqual({ obvious: 5, subtle: 1 });
    expect(mixFor(0)).toEqual({ obvious: 3, subtle: 3 });
    expect(mixFor(1)).toEqual({ obvious: 1, subtle: 5 });
  });
});

describe("buildRound", () => {
  it("scrambles the panels into an unsolved permutation of the solution", () => {
    for (const story of STORY_POOL) {
      const round = buildRound(story, mulberry32(7));
      expect(round.storyId).toBe(story.id);
      expect(round.solution).toEqual([...story.panels]);
      expect([...round.shuffled].sort()).toEqual([...round.solution].sort());
      expect(isCorrect(round.shuffled, round.solution)).toBe(false);
    }
  });

  it("never returns an already-solved row, even when the rng yields the sorted order", () => {
    const sortedEveryTime = () => 0.999999;
    for (const story of STORY_POOL) {
      const round = buildRound(story, sortedEveryTime);
      expect(isCorrect(round.shuffled, round.solution)).toBe(false);
      expect([...round.shuffled].sort()).toEqual([...round.solution].sort());
    }
  });

  it("reshuffles exactly once when the first shuffle is already solved", () => {
    // 0.9, 0.9 produce the identity permutation; 0.1, 0.1 produce a real shuffle.
    const { rng, calls } = sequenceRng([0.9, 0.9, 0.1, 0.1]);
    const round = buildRound(storyFor("seed"), rng);
    expect(calls()).toBe(4);
    expect(isCorrect(round.shuffled, round.solution)).toBe(false);
  });
});

describe("buildPlaythrough", () => {
  it("returns six rounds: three obvious then three subtle", () => {
    const rounds = buildPlaythrough(mulberry32(11));
    expect(rounds).toHaveLength(ROUND_COUNT);
    expect(ROUNDS_PER_BAND).toBe(3);
    for (const round of rounds.slice(0, 3)) {
      expect(storyFor(round.storyId).ladder).toBe("obvious");
    }
    for (const round of rounds.slice(3)) {
      expect(storyFor(round.storyId).ladder).toBe("subtle");
    }
  });

  it("pins the classic mix: default call and shift 0 draw the same 3 + 3 shape", () => {
    const byDefault = buildPlaythrough(mulberry32(77)).map((round) => round.storyId);
    const shifted = buildPlaythrough(mulberry32(77), 0).map((round) => round.storyId);
    expect(byDefault).toEqual(shifted);
    expect(byDefault).toHaveLength(6);
    // Classic-mix pin re-derived from `mulberry32(77)` when the suite moved off
    // its local Park-Miller generator: three obvious stories, then three subtle.
    expect(byDefault).toEqual(["lantern", "ice-cream", "sandcastle", "magnet", "puzzle", "rain"]);
  });

  it("draws a 5 + 1 mix in the easy band, obvious rounds first", () => {
    const rounds = buildPlaythrough(mulberry32(13), -1);
    expect(rounds).toHaveLength(ROUND_COUNT);
    const ladders = rounds.map((round) => storyFor(round.storyId).ladder);
    expect(ladders).toEqual(["obvious", "obvious", "obvious", "obvious", "obvious", "subtle"]);
  });

  it("draws a 1 + 5 mix in the hard band, obvious round first", () => {
    const rounds = buildPlaythrough(mulberry32(13), 1);
    expect(rounds).toHaveLength(ROUND_COUNT);
    const ladders = rounds.map((round) => storyFor(round.storyId).ladder);
    expect(ladders).toEqual(["obvious", "subtle", "subtle", "subtle", "subtle", "subtle"]);
  });

  it("never repeats a story in any band, across many seeds", () => {
    for (const shift of [-1, 0, 1] as const) {
      for (let seed = 1; seed <= 50; seed++) {
        const rounds = buildPlaythrough(mulberry32(seed), shift);
        const ids = rounds.map((round) => round.storyId);
        expect(new Set(ids).size).toBe(ROUND_COUNT);
      }
    }
  });

  it("gives every round a scrambled strip that is a permutation of its story", () => {
    const rounds = buildPlaythrough(mulberry32(23));
    for (const round of rounds) {
      const story = storyFor(round.storyId);
      expect(round.solution).toEqual([...story.panels]);
      expect([...round.shuffled].sort()).toEqual([...round.solution].sort());
      expect(isCorrect(round.shuffled, round.solution)).toBe(false);
    }
  });

  it("is deterministic under a seeded rng", () => {
    expect(buildPlaythrough(mulberry32(1234))).toEqual(buildPlaythrough(mulberry32(1234)));
  });

  it("draws the identical sequence after adopting the shared shuffle (AC-3)", () => {
    // Goldens captured while the module still used its private Fisher-Yates
    // shuffleWith, right before P3.T3.1 delegated it to the shared shuffle.
    // The shared shuffle consumes rng in the same order, so the same seeded
    // rng must yield the exact pre-migration strips, story order included.
    // Goldens re-derived after P2.T1 grew the pool 15 -> 30 (the new stories
    // reshuffle the shared-shuffle draws), captured from the live functions.
    expect(buildPlaythrough(mulberry32(1)).map((round) => round.storyId)).toEqual([
      "ice-cream",
      "cake",
      "cupcake",
      "magnet",
      "mirror",
      "paint",
    ]);
    expect(buildPlaythrough(mulberry32(1))[0].shuffled).toEqual([
      "story_ice_scoop",
      "story_ice_puddle",
      "story_ice_dripping",
    ]);
    expect(buildPlaythrough(mulberry32(1))[5].shuffled).toEqual([
      "story_paint_picture",
      "story_paint_blank",
      "story_paint_stroke",
    ]);
    expect(buildPlaythrough(mulberry32(11)).map((round) => round.shuffled)).toEqual([
      ["story_pancake_berries", "story_pancake_cooked", "story_pancake_batter"],
      ["story_tower_half", "story_tower_tall", "story_blocks_scattered"],
      ["story_balloon_round", "story_balloon_aloft", "story_balloon_flat"],
      ["story_banana_peeled", "story_banana_whole", "story_banana_peel"],
      ["story_frogspawn", "story_frog", "story_tadpole"],
      ["story_cocoon", "story_caterpillar", "story_butterfly"],
    ]);
    expect(buildPlaythrough(mulberry32(2026)).map((round) => round.storyId)).toEqual([
      "ice-cream",
      "cupcake",
      "pencil",
      "shadow",
      "tadpole",
      "magnet",
    ]);
    expect(buildPlaythrough(mulberry32(2026))[1].shuffled).toEqual([
      "story_cupcake_plain",
      "story_cupcake_cherry",
      "story_cupcake_frosted",
    ]);
  });

  it("differs between two seeds known to draw different orders", () => {
    const first = buildPlaythrough(mulberry32(1)).map((round) => round.storyId);
    const second = buildPlaythrough(mulberry32(2)).map((round) => round.storyId);
    expect(first).not.toEqual(second);
  });
});

describe("isCorrect", () => {
  const solution = ["story_seed_planted", "story_seed_sprout", "story_seed_flower"];

  it("is true only for an exact match", () => {
    expect(isCorrect([...solution], solution)).toBe(true);
    expect(isCorrect([], [])).toBe(true);
  });

  it("is false for a reversed strip", () => {
    expect(isCorrect([...solution].reverse(), solution)).toBe(false);
  });

  it("is false for a short strip", () => {
    expect(isCorrect(solution.slice(0, 2), solution)).toBe(false);
    expect(isCorrect([], solution)).toBe(false);
  });

  it("is false for a long strip", () => {
    expect(isCorrect([...solution, "story_seed_flower"], solution)).toBe(false);
  });

  it("is false for a strip with one wrong panel", () => {
    const wrong = [...solution];
    wrong[1] = "story_egg";
    expect(isCorrect(wrong, solution)).toBe(false);
  });
});

describe("story content variants", () => {
  it("exposes exactly two signature variants with unique ids", () => {
    expect(STORY_VARIANTS).toHaveLength(2);
    expect(new Set(STORY_VARIANTS.map((variant) => variant.id)).size).toBe(2);
    expect(STORY_VARIANTS.map((variant) => variant.id)).toEqual([
      "growing-things",
      "everyday-changes",
    ]);
  });

  it("selects non-empty strict subsets with unique story ids", () => {
    const allIds = new Set(STORY_IDS);
    for (const variant of STORY_VARIANTS) {
      expect(variant.stories.length).toBeGreaterThan(0);
      expect(variant.stories.length).toBeLessThan(STORY_POOL.length);
      expect(new Set(variant.stories.map((story) => story.id)).size).toBe(variant.stories.length);
      for (const story of variant.stories) {
        expect(allIds.has(story.id)).toBe(true);
        expect(STORY_POOL).toContain(story);
      }
    }
  });

  it("picks the same subset by id and throws on an unknown id", () => {
    for (const variant of STORY_VARIANTS) {
      expect(storyVariantPool(variant.id)).toEqual(variant.stories);
    }
    expect(() => storyVariantPool("nope" as "growing-things")).toThrow(/unknown story variant/);
  });

  it("does not alter rule functions when a variant is selected", () => {
    const before = Array.from({ length: 10 }, (_, seed) =>
      buildPlaythrough(mulberry32(seed + 1)).map((round) => round.storyId),
    );
    for (const variant of STORY_VARIANTS) storyVariantPool(variant.id);
    const after = Array.from({ length: 10 }, (_, seed) =>
      buildPlaythrough(mulberry32(seed + 1)).map((round) => round.storyId),
    );
    expect(after).toEqual(before);
  });
});

describe("buildPlaythrough (content variants)", () => {
  it("mirrors the canonical growing-things slide", () => {
    const growingIds = [
      "seed",
      "duck",
      "banana",
      "rain",
      "sun",
      "caterpillar",
      "tadpole",
      "shadow",
      "bee",
    ];
    expect(
      storyVariantPool("growing-things")
        .map((story) => story.id)
        .sort(),
    ).toEqual([...growingIds].sort());
    expect(
      storyVariantPool("everyday-changes")
        .map((story) => story.id)
        .sort(),
    ).toEqual(STORY_IDS.filter((id) => !growingIds.includes(id)).sort());
  });

  it("fills every shift from everyday-changes without repeats", () => {
    const allowed = new Set(storyVariantPool("everyday-changes").map((story) => story.id));
    for (const shift of [-1, 0, 1] as const) {
      const mix = mixFor(shift);
      for (let seed = 0; seed < 10; seed++) {
        const rounds = buildPlaythrough(mulberry32(seed), shift, "everyday-changes");
        expect(rounds).toHaveLength(ROUND_COUNT);
        const ids = rounds.map((round) => round.storyId);
        expect(new Set(ids).size).toBe(ROUND_COUNT);
        for (const id of ids) expect(allowed.has(id)).toBe(true);
        expect(ids.slice(0, mix.obvious).every((id) => storyFor(id).ladder === "obvious")).toBe(
          true,
        );
        expect(ids.slice(mix.obvious).every((id) => storyFor(id).ladder === "subtle")).toBe(true);
        for (const round of rounds) {
          expect([...round.shuffled].sort()).toEqual([...round.solution].sort());
        }
      }
    }
  });

  it("fills shift +1 from the thin growing-things slide", () => {
    const allowed = new Set(storyVariantPool("growing-things").map((story) => story.id));
    for (let seed = 0; seed < 10; seed++) {
      const rounds = buildPlaythrough(mulberry32(seed), 1, "growing-things");
      expect(rounds).toHaveLength(ROUND_COUNT);
      const ids = rounds.map((round) => round.storyId);
      expect(new Set(ids).size).toBe(ROUND_COUNT);
      for (const id of ids) expect(allowed.has(id)).toBe(true);
      expect(ids.slice(0, 1).every((id) => storyFor(id).ladder === "obvious")).toBe(true);
      expect(ids.slice(1).every((id) => storyFor(id).ladder === "subtle")).toBe(true);
    }
  });

  it("falls back to the full pool when growing-things cannot fill the mix", () => {
    for (const shift of [-1, 0] as const) {
      expect(buildPlaythrough(mulberry32(77), shift, "growing-things")).toEqual(
        buildPlaythrough(mulberry32(77), shift),
      );
    }
  });

  it("keeps the no-variant path byte-identical, with or without the argument", () => {
    for (const shift of [-1, 0, 1] as const) {
      expect(buildPlaythrough(mulberry32(1234), shift, undefined)).toEqual(
        buildPlaythrough(mulberry32(1234), shift),
      );
    }
  });

  it("is deterministic for each slide under a fixed seed", () => {
    for (const variant of STORY_VARIANT_IDS) {
      expect(buildPlaythrough(mulberry32(5), 0, variant)).toEqual(
        buildPlaythrough(mulberry32(5), 0, variant),
      );
    }
  });
});
