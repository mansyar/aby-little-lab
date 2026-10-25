import { describe, expect, it } from "vitest";
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
import { mulberry32 } from "../helpers/randomHelper";

const storyById = new Map<string, Story>(STORY_POOL.map((story) => [story.id, story]));

function storyFor(id: string): Story {
  const story = storyById.get(id);
  if (!story) throw new Error(`unknown story id: ${id}`);
  return story;
}

/** Deterministic Park-Miller generator so a draw can be replayed. */
function seededRng(seed: number): () => number {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
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
  it("holds eleven stories with unique ids and three unique panels each", () => {
    expect(STORY_POOL).toHaveLength(11);
    expect(new Set(STORY_IDS).size).toBe(11);
    expect(STORY_IDS).toEqual(STORY_POOL.map((story) => story.id));
    for (const story of STORY_POOL) {
      expect(story.panels).toHaveLength(3);
      expect(new Set(story.panels).size).toBe(3);
      for (const panel of story.panels) expect(panel.length).toBeGreaterThan(0);
    }
  });

  it("uses 33 distinct panel keys across the pool", () => {
    const panels = STORY_POOL.flatMap((story) => [...story.panels]);
    expect(panels).toHaveLength(33);
    expect(new Set(panels).size).toBe(33);
  });

  it("splits into five obvious and six subtle stories", () => {
    expect(OBVIOUS_POOL).toHaveLength(5);
    expect(SUBTLE_POOL).toHaveLength(6);
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
      const round = buildRound(story, seededRng(7));
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
    const rounds = buildPlaythrough(seededRng(11));
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
    const byDefault = buildPlaythrough(seededRng(77)).map((round) => round.storyId);
    const shifted = buildPlaythrough(seededRng(77), 0).map((round) => round.storyId);
    expect(byDefault).toEqual(shifted);
    expect(byDefault).toHaveLength(6);
  });

  it("draws a 5 + 1 mix in the easy band, obvious rounds first", () => {
    const rounds = buildPlaythrough(seededRng(13), -1);
    expect(rounds).toHaveLength(ROUND_COUNT);
    const ladders = rounds.map((round) => storyFor(round.storyId).ladder);
    expect(ladders).toEqual(["obvious", "obvious", "obvious", "obvious", "obvious", "subtle"]);
  });

  it("draws a 1 + 5 mix in the hard band, obvious round first", () => {
    const rounds = buildPlaythrough(seededRng(13), 1);
    expect(rounds).toHaveLength(ROUND_COUNT);
    const ladders = rounds.map((round) => storyFor(round.storyId).ladder);
    expect(ladders).toEqual(["obvious", "subtle", "subtle", "subtle", "subtle", "subtle"]);
  });

  it("never repeats a story in any band, across many seeds", () => {
    for (const shift of [-1, 0, 1] as const) {
      for (let seed = 1; seed <= 50; seed++) {
        const rounds = buildPlaythrough(seededRng(seed), shift);
        const ids = rounds.map((round) => round.storyId);
        expect(new Set(ids).size).toBe(ROUND_COUNT);
      }
    }
  });

  it("gives every round a scrambled strip that is a permutation of its story", () => {
    const rounds = buildPlaythrough(seededRng(23));
    for (const round of rounds) {
      const story = storyFor(round.storyId);
      expect(round.solution).toEqual([...story.panels]);
      expect([...round.shuffled].sort()).toEqual([...round.solution].sort());
      expect(isCorrect(round.shuffled, round.solution)).toBe(false);
    }
  });

  it("is deterministic under a seeded rng", () => {
    expect(buildPlaythrough(seededRng(1234))).toEqual(buildPlaythrough(seededRng(1234)));
  });

  it("draws the identical sequence after adopting the shared shuffle (AC-3)", () => {
    // Goldens captured while the module still used its private Fisher-Yates
    // shuffleWith, right before P3.T3.1 delegated it to the shared shuffle.
    // The shared shuffle consumes rng in the same order, so the same seeded
    // rng must yield the exact pre-migration strips, story order included.
    expect(buildPlaythrough(mulberry32(1)).map((round) => round.storyId)).toEqual([
      "cake",
      "duck",
      "balloon",
      "clothes",
      "banana",
      "rain",
    ]);
    expect(buildPlaythrough(mulberry32(1))[0].shuffled).toEqual([
      "story_cake_candles",
      "story_cake_whole",
      "story_cake_sliced",
    ]);
    expect(buildPlaythrough(mulberry32(1))[5].shuffled).toEqual([
      "story_cloud_raining",
      "story_cloud",
      "story_rain_puddle",
    ]);
    expect(buildPlaythrough(mulberry32(11)).map((round) => round.shuffled)).toEqual([
      ["story_seed_flower", "story_seed_planted", "story_seed_sprout"],
      ["story_ice_dripping", "story_ice_scoop", "story_ice_puddle"],
      ["story_balloon_round", "story_balloon_aloft", "story_balloon_flat"],
      ["story_cloud_raining", "story_rain_puddle", "story_cloud"],
      ["story_clothes_wet", "story_clothes_dry", "story_clothes_drying"],
      ["story_cup_empty", "story_cup_pouring", "story_cup_full"],
    ]);
    expect(buildPlaythrough(mulberry32(2026)).map((round) => round.storyId)).toEqual([
      "seed",
      "cake",
      "ice-cream",
      "clothes",
      "sun",
      "rain",
    ]);
    expect(buildPlaythrough(mulberry32(2026))[1].shuffled).toEqual([
      "story_cake_sliced",
      "story_cake_whole",
      "story_cake_candles",
    ]);
  });

  it("differs between two seeds known to draw different orders", () => {
    const first = buildPlaythrough(seededRng(1)).map((round) => round.storyId);
    const second = buildPlaythrough(seededRng(2)).map((round) => round.storyId);
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
