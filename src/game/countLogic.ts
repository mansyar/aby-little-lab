import { shuffle } from "./shapeSorterLogic";

/**
 * Small, clearly countable item textures used to build counting groups.
 * All keys are registered in PreloadScene — zero new object assets.
 */
export const COUNT_ITEMS: readonly string[] = [
  "shape_star",
  "sm_ball",
  "food_apple",
  "food_fish",
  "food_carrot",
  "sm_sun",
  "sm_house",
  "sm_duck",
];

/**
 * The three progressive difficulty bands. Rounds 1-2 use band 1 (1-3),
 * rounds 3-4 band 2 (1-5), rounds 5-6 band 3 (1-10). `groupCount` is the
 * number of object groups shown in a round (3 for the gentle start, 4 after).
 */
export const ROUND_BANDS: readonly { max: number; groupCount: number }[] = [
  { max: 3, groupCount: 3 },
  { max: 5, groupCount: 4 },
  { max: 10, groupCount: 4 },
];

/** One group of objects: how many items it holds and which item texture. */
export interface CountGroup {
  /** Number of items in the group (1..band max). */
  count: number;
  /** PreloadScene texture key of the repeated item. */
  texture: string;
}

/** A single How Many? round: a target count and distinct object groups. */
export interface CountRound {
  /** The count the child must find. */
  target: number;
  /** 3 or 4 groups; counts all distinct; exactly one equals `target`. */
  groups: CountGroup[];
}

/** Builds one round for a band: distinct counts, one correct group, shuffled. */
export function createRound(band: 1 | 2 | 3, target?: number): CountRound {
  const config = ROUND_BANDS[band - 1];
  const chosen = target ?? 1 + Math.floor(Math.random() * config.max);
  const others = shuffle(
    Array.from({ length: config.max }, (_, i) => i + 1).filter((count) => count !== chosen),
  ).slice(0, config.groupCount - 1);
  const counts = shuffle([chosen, ...others]);
  const textures = shuffle([...COUNT_ITEMS]).slice(0, config.groupCount);
  return {
    target: chosen,
    groups: counts.map((count, index) => ({ count, texture: textures[index] })),
  };
}

/**
 * Generates a playthrough of 6 rounds, easy-first: 2 rounds per band
 * (1-3, then 1-5, then 1-10). Difficulty is fixed across replays.
 * The two rounds of each band always get distinct targets so the child is
 * never asked the same count twice.
 */
export function createPlaythrough(): CountRound[] {
  const rounds: CountRound[] = [];
  for (const band of [1, 2, 3] as const) {
    const config = ROUND_BANDS[band - 1];
    const targets = shuffle(Array.from({ length: config.max }, (_, i) => i + 1)).slice(0, 2);
    rounds.push(createRound(band, targets[0]), createRound(band, targets[1]));
  }
  return rounds;
}

/** Returns whether the tapped group holds the round's target count. */
export function evaluateRound(round: CountRound, group: CountGroup): boolean {
  return group.count === round.target;
}
