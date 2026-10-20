import { describe, expect, it } from "vitest";
import {
  buildPlaythrough,
  buildRound,
  isCorrect,
  OBVIOUS_POOL,
  ROUND_COUNT,
  ROUNDS_PER_BAND,
  STORY_IDS,
  STORY_POOL,
  type Story,
  SUBTLE_POOL,
} from "../../game/storyOrderLogic";

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
  it("holds eight stories with unique ids and three unique panels each", () => {
    expect(STORY_POOL).toHaveLength(8);
    expect(new Set(STORY_IDS).size).toBe(8);
    expect(STORY_IDS).toEqual(STORY_POOL.map((story) => story.id));
    for (const story of STORY_POOL) {
      expect(story.panels).toHaveLength(3);
      expect(new Set(story.panels).size).toBe(3);
      for (const panel of story.panels) expect(panel.length).toBeGreaterThan(0);
    }
  });

  it("uses 24 distinct panel keys across the pool", () => {
    const panels = STORY_POOL.flatMap((story) => [...story.panels]);
    expect(panels).toHaveLength(24);
    expect(new Set(panels).size).toBe(24);
  });

  it("splits into four obvious and four subtle stories", () => {
    expect(OBVIOUS_POOL).toHaveLength(4);
    expect(SUBTLE_POOL).toHaveLength(4);
    expect(OBVIOUS_POOL.length + SUBTLE_POOL.length).toBe(STORY_POOL.length);
    for (const story of OBVIOUS_POOL) expect(story.ladder).toBe("obvious");
    for (const story of SUBTLE_POOL) expect(story.ladder).toBe("subtle");
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

  it("never repeats a story, across many seeds", () => {
    for (let seed = 1; seed <= 50; seed++) {
      const rounds = buildPlaythrough(seededRng(seed));
      const ids = rounds.map((round) => round.storyId);
      expect(new Set(ids).size).toBe(ROUND_COUNT);
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
