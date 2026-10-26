import type { BandShift } from "./adaptiveLogic";
import { type Rng, shuffle } from "./random";

/** The six toy types used in the Big vs. Small game. */
export type ToyType = "teddy_bear" | "car" | "ball" | "block" | "rocket" | "drum";

/** The two size categories a toy or box can belong to. */
export type ScaleCategory = "big" | "small";

/** All six toy types, in canonical order. */
export const ALL_TOYS: readonly ToyType[] = [
  "teddy_bear",
  "car",
  "ball",
  "block",
  "rocket",
  "drum",
];

/** The number of sorted toys needed to complete the game. */
export const WIN_TARGET = 6;

/** Scale factor for big items. */
export const BIG_SCALE = 1.5;

/** Scale factor for small items. */
export const SMALL_SCALE = 0.7;

/** The per-category scale factors one band's geometry is stamped from. */
export interface ScaleFactors {
  big: number;
  small: number;
}

/*
 * Band factors chosen against the scene's fixed layout (1024x768 canvas, toy
 * row y=580 with 96x96px bases over 7 slots, box row y=200 with 128px bases
 * over 3 slots) and the 64px touch floor: easy's 1.6x big box is the widest
 * object that still fits its 2-slot row (341px) with margin, easy's 0.68x
 * small toy stays above the floor at 65.3px (the shipped 0.7x is already
 * 67.2px, so the floor binds lower bands, not the canvas); hard's 1.35x/0.8x
 * narrows the 1.5x/0.7x contrast ratio enough for a jamming toddler to feel
 * while both small boxes (0.8x = 102.4px) keep comfortable targets.
 */
const EASY_SCALE_FACTORS = { big: 1.6, small: 0.68 } satisfies ScaleFactors;
const HARD_SCALE_FACTORS = { big: 1.35, small: 0.8 } satisfies ScaleFactors;
const CLASSIC_SCALE_FACTORS = { big: BIG_SCALE, small: SMALL_SCALE } satisfies ScaleFactors;

/**
 * Picks the per-category scale factors one band's toys and boxes are stamped
 * from: the easy band widens the big/small contrast, the hard band narrows
 * it. The classic band keeps the shipped fixed factors, so unshifted draws
 * are byte-identical to shipped behaviour.
 */
export function scaleFactorsFor(shift: BandShift = 0): ScaleFactors {
  if (shift < 0) return EASY_SCALE_FACTORS;
  if (shift > 0) return HARD_SCALE_FACTORS;
  return CLASSIC_SCALE_FACTORS;
}

/** Number of toy types to select per round (3 of 6). */
export const SELECT_COUNT = 3;

/** A toy instance placed on screen for the child to sort. */
export interface ToyInstance {
  type: ToyType;
  scaleCategory: ScaleCategory;
  scale: number;
}

/** A box container that toys are sorted into. */
export interface BoxInstance {
  scaleCategory: ScaleCategory;
  scale: number;
}

/**
 * Randomly selects 3 of 6 toy types from the pool.
 *
 * `rng` must return a number in [0, 1); tests pass a seeded generator so a
 * draw is reproducible.
 */
export function selectToys(rng: Rng = Math.random): ToyType[] {
  return shuffle(ALL_TOYS, rng).slice(0, SELECT_COUNT);
}

/** Creates toy instances: 2 per type (big + small) = 6 total. */
export function createToyInstances(
  types: readonly ToyType[],
  factors: ScaleFactors = CLASSIC_SCALE_FACTORS,
): ToyInstance[] {
  const instances: ToyInstance[] = [];
  for (const type of types) {
    instances.push({ type, scaleCategory: "big", scale: factors.big });
    instances.push({ type, scaleCategory: "small", scale: factors.small });
  }
  return instances;
}

/**
 * Creates the two boxes (big and small) with shuffled left/right sides.
 *
 * `rng` must return a number in [0, 1); tests pass a seeded generator so a
 * draw is reproducible.
 */
export function createBoxes(
  factors: ScaleFactors = CLASSIC_SCALE_FACTORS,
  rng: Rng = Math.random,
): BoxInstance[] {
  return shuffle(
    [
      { scaleCategory: "big", scale: factors.big },
      { scaleCategory: "small", scale: factors.small },
    ],
    rng,
  );
}

/** Generates a round with shuffled toy positions and two boxes.
 *
 *  `rng` must return a number in [0, 1); tests pass a seeded generator so a
 *  draw is reproducible.
 */
export function generateRound(
  factors: ScaleFactors = CLASSIC_SCALE_FACTORS,
  rng: Rng = Math.random,
): {
  toys: ToyInstance[];
  boxes: BoxInstance[];
} {
  const selected = selectToys(rng);
  const toys = shuffle(createToyInstances(selected, factors), rng);
  const boxes = createBoxes(factors, rng);
  return { toys, boxes };
}

/** Checks whether a toy matches a box (same scale category). */
export function isMatch(toyScaleCategory: ScaleCategory, boxScaleCategory: ScaleCategory): boolean {
  return toyScaleCategory === boxScaleCategory;
}

/** Checks whether the sorted count has reached the win target. */
export function isWin(sortedCount: number): boolean {
  return sortedCount >= WIN_TARGET;
}
