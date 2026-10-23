import type { BandShift } from "./adaptiveLogic";

/** The twelve object types used in the Shadow Match game. */
export type ObjectType =
  | "house"
  | "tree"
  | "car"
  | "boat"
  | "ball"
  | "umbrella"
  | "airplane"
  | "mushroom"
  | "sock"
  | "boot"
  | "kite"
  | "bell";

/** All twelve object types, in canonical order. */
export const ALL_OBJECTS: readonly ObjectType[] = [
  "house",
  "tree",
  "car",
  "boat",
  "ball",
  "umbrella",
  "airplane",
  "mushroom",
  "sock",
  "boot",
  "kite",
  "bell",
];

/**
 * The six confusable pairs: two objects per cluster whose silhouettes are easy
 * to mistake for one another at play size. The band draw works on whole
 * clusters; membership is asserted by the tests, never enforced at runtime.
 */
export const CONFUSABLE_CLUSTERS: readonly (readonly ObjectType[])[] = [
  ["umbrella", "mushroom"],
  ["house", "tree"],
  ["car", "boat"],
  ["ball", "airplane"],
  ["sock", "boot"],
  ["kite", "bell"],
];

/** The number of matches needed to complete the game. */
export const WIN_TARGET = 6;

/** Number of objects shown per round (6 of the 12 available). */
export const ROUND_SIZE = 6;

/** Returns a shuffled copy of the input array using the Fisher-Yates algorithm. */
export function shuffle<T>(array: readonly T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Generates a round: 6 of the 12 objects selected, with objects and shadows
 * sharing the same set (every object must have a matching shadow) but in
 * independently shuffled orders for replay variety.
 *
 * The band shift picks the draw, keeping the round size fixed at 6:
 * - easy (`shift < 0`): exactly one object per confusable cluster, so no
 *   confusable pair ever appears together.
 * - classic (`shift = 0`, the default): any 6 of the 12 — the same draw as
 *   before, now over the full pool.
 * - hard (`shift > 0`): three full clusters, so every round pairs confusable
 *   silhouettes.
 */
export function generateRound(shift: BandShift = 0): {
  objects: ObjectType[];
  shadows: ObjectType[];
} {
  let selected: ObjectType[];
  if (shift < 0) {
    selected = CONFUSABLE_CLUSTERS.flatMap((cluster) => shuffle(cluster).slice(0, 1));
  } else if (shift > 0) {
    selected = shuffle(CONFUSABLE_CLUSTERS).slice(0, 3).flat();
  } else {
    selected = shuffle(ALL_OBJECTS).slice(0, ROUND_SIZE);
  }
  return {
    objects: shuffle(selected),
    shadows: shuffle(selected),
  };
}

/** Checks whether an object matches a shadow (same underlying object ID). */
export function isMatch(objectType: ObjectType, shadowType: ObjectType): boolean {
  return objectType === shadowType;
}

/** Checks whether the matched count has reached the win target. */
export function isWin(matchedCount: number): boolean {
  return matchedCount >= WIN_TARGET;
}
