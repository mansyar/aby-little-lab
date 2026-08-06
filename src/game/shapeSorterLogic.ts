/** The eighteen geometric shape types used in the Shape Sorter game. */
export type ShapeType =
  | "circle"
  | "square"
  | "triangle"
  | "star"
  | "heart"
  | "crescent"
  | "oval"
  | "rectangle"
  | "diamond"
  | "pentagon"
  | "hexagon"
  | "octagon"
  | "trapezoid"
  | "semicircle"
  | "arrow"
  | "plus"
  | "ring"
  | "teardrop";

/** All eighteen shape types, in canonical order. */
export const ALL_SHAPES: readonly ShapeType[] = [
  "circle",
  "square",
  "triangle",
  "star",
  "heart",
  "crescent",
  "oval",
  "rectangle",
  "diamond",
  "pentagon",
  "hexagon",
  "octagon",
  "trapezoid",
  "semicircle",
  "arrow",
  "plus",
  "ring",
  "teardrop",
];

/** Randomly selects 3 of the 18 shape types for a round. */
export function selectThreeShapes(): ShapeType[] {
  return shuffle(ALL_SHAPES).slice(0, 3);
}

/**
 * Generates a playthrough of `roundCount` rounds, each containing 3 shapes,
 * drawn without repeats across the entire playthrough (unique shapes per session).
 */
export function generatePlaythrough(roundCount: number): ShapeType[][] {
  const shuffled = shuffle(ALL_SHAPES);
  return Array.from({ length: roundCount }, (_, i) => shuffled.slice(i * 3, i * 3 + 3));
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
