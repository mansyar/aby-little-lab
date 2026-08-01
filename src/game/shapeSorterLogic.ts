/** The six geometric shape types used in the Shape Sorter game. */
export type ShapeType = "circle" | "square" | "triangle" | "star" | "heart" | "crescent";

/** All six shape types, in canonical order. */
export const ALL_SHAPES: readonly ShapeType[] = [
  "circle",
  "square",
  "triangle",
  "star",
  "heart",
  "crescent",
];

/** Randomly selects 3 of the 6 shape types for a round. */
export function selectThreeShapes(): ShapeType[] {
  return shuffle(ALL_SHAPES).slice(0, 3);
}

/** Returns a shuffled copy of the input array using the Fisher-Yates algorithm. */
export function shuffle<T>(array: readonly T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Checks whether a shape type matches a slot type. */
export function isMatch(shapeType: ShapeType, slotType: ShapeType): boolean {
  return shapeType === slotType;
}
