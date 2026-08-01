/** The eight object types used in the Shadow Match game. */
export type ObjectType = "house" | "tree" | "car" | "boat" | "ball" | "umbrella" | "airplane" | "mushroom";

/** All eight object types, in canonical order. */
export const ALL_OBJECTS: readonly ObjectType[] = [
  "house",
  "tree",
  "car",
  "boat",
  "ball",
  "umbrella",
  "airplane",
  "mushroom",
];

/** The number of matches needed to complete the game. */
export const WIN_TARGET = 6;

/** Number of objects shown per round (6 of the 8 available). */
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

/** Generates a round: 6 of the 8 objects selected, with objects and shadows
 *  sharing the same set (every object must have a matching shadow) but in
 *  independently shuffled orders for replay variety. */
export function generateRound(): {
  objects: ObjectType[];
  shadows: ObjectType[];
} {
  const selected = shuffle(ALL_OBJECTS).slice(0, ROUND_SIZE);
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
