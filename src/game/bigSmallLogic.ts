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

/** Returns a shuffled copy of the input array using the Fisher-Yates algorithm. */
export function shuffle<T>(array: readonly T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Randomly selects 3 of 6 toy types from the pool. */
export function selectToys(): ToyType[] {
  return shuffle(ALL_TOYS).slice(0, SELECT_COUNT);
}

/** Creates toy instances: 2 per type (big + small) = 6 total. */
export function createToyInstances(types: readonly ToyType[]): ToyInstance[] {
  const instances: ToyInstance[] = [];
  for (const type of types) {
    instances.push({ type, scaleCategory: "big", scale: BIG_SCALE });
    instances.push({ type, scaleCategory: "small", scale: SMALL_SCALE });
  }
  return instances;
}

/** Creates the two boxes (big and small) with shuffled left/right sides. */
export function createBoxes(): BoxInstance[] {
  return shuffle([
    { scaleCategory: "big", scale: BIG_SCALE },
    { scaleCategory: "small", scale: SMALL_SCALE },
  ]);
}

/** Generates a round with shuffled toy positions and two boxes. */
export function generateRound(): {
  toys: ToyInstance[];
  boxes: BoxInstance[];
} {
  const selected = selectToys();
  const toys = shuffle(createToyInstances(selected));
  const boxes = createBoxes();
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
