import type { BandShift } from "./adaptiveLogic";
import { type Rng, shuffle } from "./random";
import type { ShapeVariant } from "./shapeVariants";

/** The twenty-four geometric shape types used in the Shape Sorter game. */
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
  | "teardrop"
  | "cube"
  | "cross"
  | "chevron"
  | "capsule"
  | "sector"
  | "parallelogram";

/** All twenty-four shape types, in canonical order. */
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
  "cube",
  "cross",
  "chevron",
  "capsule",
  "sector",
  "parallelogram",
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
  "cube",
  "cross",
  "capsule",
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
  "chevron",
  "sector",
  "parallelogram",
];

/** Selects the shape pool for the band shift. The classic band keeps the full
 *  24-shape pool, so unshifted draws keep the classic easy-first ordering. */
export function poolFor(shift: BandShift = 0): readonly ShapeType[] {
  if (shift < 0) return EASY_SHAPE_POOL;
  if (shift > 0) return HARD_SHAPE_POOL;
  return ALL_SHAPES;
}

/**
 * Mirrors `shapeVariants.ts` membership locally: that module derives its pool
 * from `ALL_SHAPES` at load time, so importing it here would be circular.
 * Tests compare these entries against `shapeVariantPool(id)`.
 */
const CURVY: ReadonlySet<ShapeType> = new Set<ShapeType>([
  "circle",
  "oval",
  "heart",
  "crescent",
  "semicircle",
  "teardrop",
  "ring",
  "capsule",
]);

/** The two signature shape slides, used only when a caller opts in. */
const SHAPE_VARIANT_POOLS: Record<ShapeVariant["id"], readonly ShapeType[]> = {
  curvy: ALL_SHAPES.filter((shape) => CURVY.has(shape)),
  angular: ALL_SHAPES.filter((shape) => !CURVY.has(shape)),
};

/**
 * Intersects the requested slide with the band pool before shuffling. If the
 * slide cannot supply three unique shapes per round it falls back to the band
 * pool; the no-variant path still returns `poolFor(shift)` unchanged.
 */
function shapePoolFor(
  roundCount: number,
  shift: BandShift,
  variant?: ShapeVariant["id"],
): readonly ShapeType[] {
  const bandPool = poolFor(shift);
  if (variant === undefined) return bandPool;
  const slide = SHAPE_VARIANT_POOLS[variant].filter((shape) => bandPool.includes(shape));
  return slide.length >= roundCount * 3 ? slide : bandPool;
}

/**
 * Generates a playthrough of `roundCount` rounds, each containing 3 shapes,
 * drawn without repeats across the entire playthrough (unique shapes per
 * session) from the band shift's selected shape pool.
 *
 * `variant` restricts shapes to one signature slide when it can supply three
 * unique shapes per round; otherwise the full band pool is used.
 *
 * `rng` must return a number in [0, 1); tests pass a seeded generator so a
 * playthrough is reproducible. It is forwarded to the shared `shuffle`, and
 * defaults to `Math.random`, so callers that pass no `rng` keep the shipped
 * production behavior.
 */
export function generatePlaythrough(
  roundCount: number,
  shift: BandShift = 0,
  rng: Rng = Math.random,
  variant?: ShapeVariant["id"],
): ShapeType[][] {
  const shuffled = shuffle(shapePoolFor(roundCount, shift, variant), rng);
  return Array.from({ length: roundCount }, (_, i) => shuffled.slice(i * 3, i * 3 + 3));
}

/** Checks whether a shape type matches a slot type. */
export function isMatch(shapeType: ShapeType, slotType: ShapeType): boolean {
  return shapeType === slotType;
}
