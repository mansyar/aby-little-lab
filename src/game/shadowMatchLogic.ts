/** The six object types used in the Shadow Match game. */
export type ObjectType = "house" | "tree" | "car" | "boat" | "ball" | "umbrella";

/** All six object types, in canonical order. */
export const ALL_OBJECTS: readonly ObjectType[] = [
  "house",
  "tree",
  "car",
  "boat",
  "ball",
  "umbrella",
];

/** The number of matches needed to complete the game. */
export const WIN_TARGET = 6;

/** Returns a shuffled copy of the input array using the Fisher-Yates algorithm. */
export function shuffle<T>(array: readonly T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Generates independently shuffled orders for objects and shadows for a round. */
export function generateRound(): {
  objects: ObjectType[];
  shadows: ObjectType[];
} {
  return {
    objects: shuffle(ALL_OBJECTS),
    shadows: shuffle(ALL_OBJECTS),
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
