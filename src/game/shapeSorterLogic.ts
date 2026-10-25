import type { BandShift } from "./adaptiveLogic";
import { shuffle } from "./random";

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

/** Pool for the easy band: bold ornamental silhouettes plus three maximally
 *  distinct primitives. Holds enough unique shapes for the shipped 3-round
 *  session (3 rounds x 3 shapes drawn without repeats). */
const EASY_SHAPE_POOL: readonly ShapeType[] = [
  "circle",
  "square",
  "triangle",
  "star",
  "heart",
  "crescent",
  "ring",
  "arrow",
  "plus",
];

/** Pool for the hard band: confusable rounded and rectilinear geometric
 *  families (rim/circle look-alikes and many-sided polygons). */
const HARD_SHAPE_POOL: readonly ShapeType[] = [
  "circle",
  "oval",
  "semicircle",
  "square",
  "rectangle",
  "diamond",
  "trapezoid",
  "pentagon",
  "hexagon",
  "octagon",
];

/** Selects the shape pool for the band shift. The classic band keeps the full
 *  18-shape pool, so unshifted draws are byte-identical to shipped behaviour. */
export function poolFor(shift: BandShift = 0): readonly ShapeType[] {
  if (shift < 0) return EASY_SHAPE_POOL;
  if (shift > 0) return HARD_SHAPE_POOL;
  return ALL_SHAPES;
}

/**
 * Generates a playthrough of `roundCount` rounds, each containing 3 shapes,
 * drawn without repeats across the entire playthrough (unique shapes per
 * session) from the band shift's selected shape pool.
 */
export function generatePlaythrough(roundCount: number, shift: BandShift = 0): ShapeType[][] {
  const shuffled = shuffle(poolFor(shift));
  return Array.from({ length: roundCount }, (_, i) => shuffled.slice(i * 3, i * 3 + 3));
}

/** Checks whether a shape type matches a slot type. */
export function isMatch(shapeType: ShapeType, slotType: ShapeType): boolean {
  return shapeType === slotType;
}
