/**
 * Pure logic for Story Order (Game 22).
 *
 * Owns the eight-story pool, the easy-first ladder split, the per-round panel
 * shuffle and the whole-strip correctness check. No Phaser, DOM, storage or
 * timers live here; every random decision is injectable so the scene and the
 * tests stay deterministic.
 */

/** Which easy-first band a story belongs to. Rounds 1-3 are `obvious`. */
export type StoryLadder = "obvious" | "subtle";

/** One story: a stable id, its three panel texture keys and its ladder tag. */
export interface Story {
  /** Stable id, used to prove a playthrough never repeats a story. */
  id: string;
  /** Easy-first band the story is drawn into. */
  ladder: StoryLadder;
  /** Panel texture keys in solution order, first → last. */
  panels: readonly [string, string, string];
}

/**
 * The eight-story pool: four obvious causes and four subtler ones. Panel keys
 * are fixed by the spec because the art is authored against them.
 */
export const STORY_POOL: readonly Story[] = [
  {
    id: "seed",
    ladder: "obvious",
    panels: ["story_seed_planted", "story_seed_sprout", "story_seed_flower"],
  },
  {
    id: "balloon",
    ladder: "obvious",
    panels: ["story_balloon_flat", "story_balloon_round", "story_balloon_aloft"],
  },
  {
    id: "duck",
    ladder: "obvious",
    panels: ["story_egg", "story_egg_cracking", "story_duckling"],
  },
  {
    id: "ice-cream",
    ladder: "obvious",
    panels: ["story_ice_scoop", "story_ice_dripping", "story_ice_puddle"],
  },
  {
    id: "banana",
    ladder: "subtle",
    panels: ["story_banana_whole", "story_banana_peeled", "story_banana_peel"],
  },
  {
    id: "cup",
    ladder: "subtle",
    panels: ["story_cup_full", "story_cup_pouring", "story_cup_empty"],
  },
  {
    id: "foot",
    ladder: "subtle",
    panels: ["story_foot_bare", "story_foot_sock", "story_foot_shoe"],
  },
  {
    id: "rain",
    ladder: "subtle",
    panels: ["story_cloud", "story_cloud_raining", "story_rain_puddle"],
  },
];

/** Every story id, in pool order. */
export const STORY_IDS: readonly string[] = STORY_POOL.map((story) => story.id);

/** Rounds 1-3 draw from here. */
export const OBVIOUS_POOL: readonly Story[] = STORY_POOL.filter(
  (story) => story.ladder === "obvious",
);

/** Rounds 4-6 draw from here. */
export const SUBTLE_POOL: readonly Story[] = STORY_POOL.filter(
  (story) => story.ladder === "subtle",
);

/** How many rounds one playthrough presents. */
export const ROUND_COUNT = 6;

/** How many rounds are drawn from each ladder band. */
export const ROUNDS_PER_BAND = ROUND_COUNT / 2;

/** One playable round: which story, the scrambled source row, and the answer. */
export interface StoryOrderRound {
  /** Id of the story this round tells. */
  storyId: string;
  /** Panel keys shown in the source row: a permutation of `solution`, not solved. */
  shuffled: string[];
  /** Panel keys in solution order, first → last. */
  solution: string[];
}

/** Returns a shuffled copy of `items` using the injected RNG (Fisher-Yates). */
function shuffleWith<T>(items: readonly T[], rng: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** True iff both strips hold the same keys in the same positions. */
function isSameOrder(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

/**
 * Builds one round from `story`. The panels are shuffled to form the source
 * row; if that shuffle reproduces the solution it is reshuffled once, and if a
 * degenerate RNG still yields the solution the row is rotated by one. A round
 * therefore always requires work.
 */
export function buildRound(story: Story, rng: () => number = Math.random): StoryOrderRound {
  const solution = [...story.panels];
  let shuffled = shuffleWith(solution, rng);
  if (isSameOrder(shuffled, solution)) {
    shuffled = shuffleWith(solution, rng);
  }
  if (isSameOrder(shuffled, solution)) {
    shuffled = [...solution.slice(1), solution[0]];
  }
  return { storyId: story.id, shuffled, solution };
}

/**
 * Draws one playthrough: three obvious stories then three subtle ones, with no
 * story repeated. Within a band the draw order is shuffled, so consecutive
 * playthroughs differ. `rng` must return a number in [0, 1); tests pass a
 * seeded generator so a playthrough is reproducible.
 */
export function buildPlaythrough(rng: () => number = Math.random): StoryOrderRound[] {
  const obvious = shuffleWith(OBVIOUS_POOL, rng).slice(0, ROUNDS_PER_BAND);
  const subtle = shuffleWith(SUBTLE_POOL, rng).slice(0, ROUNDS_PER_BAND);
  return [...obvious, ...subtle].map((story) => buildRound(story, rng));
}

/** True iff `placed` equals `solution` (same length, same order, same values). */
export function isCorrect(placed: readonly string[], solution: readonly string[]): boolean {
  if (placed.length !== solution.length) return false;
  return placed.every((value, index) => value === solution[index]);
}
