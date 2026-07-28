/** The four animal types used in the Animal Trace game. */
export type AnimalType = "monkey" | "rabbit" | "cat" | "dog";

/** The four food types matching each animal. */
export type FoodType = "banana" | "carrot" | "fish" | "bone";

/** A paired animal and its corresponding food. */
export interface AnimalFoodPair {
  animal: AnimalType;
  food: FoodType;
}

/** All four animal-food pairs, in canonical order. */
export const ALL_PAIRS: readonly AnimalFoodPair[] = [
  { animal: "monkey", food: "banana" },
  { animal: "rabbit", food: "carrot" },
  { animal: "cat", food: "fish" },
  { animal: "dog", food: "bone" },
];

/** Randomly selects 3 of the 4 animal-food pairs for a round. */
export function selectThreePairs(): AnimalFoodPair[] {
  return shuffle(ALL_PAIRS).slice(0, 3);
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

/** Tracks progress along a path with discrete waypoints. */
export interface PathProgress {
  currentPoint: number;
  totalPoints: number;
}

/** Creates a new PathProgress starting at point 0. */
export function createPathProgress(totalPoints: number): PathProgress {
  return { currentPoint: 0, totalPoints };
}

/** Advances the path progress to the next point. Does not advance past the last point. */
export function advancePath(progress: PathProgress): PathProgress {
  if (progress.currentPoint >= progress.totalPoints - 1) {
    return progress;
  }
  return { ...progress, currentPoint: progress.currentPoint + 1 };
}

/** Checks whether the animal has reached the final point of the path. */
export function isPathComplete(progress: PathProgress): boolean {
  return progress.currentPoint >= progress.totalPoints - 1;
}

/** Checks whether all 3 paths in the round have been completed. */
export function isRoundComplete(completedPaths: number): boolean {
  return completedPaths >= 3;
}

/** Generates evenly-spaced waypoints from start to end with a randomized gentle curve.
 *
 *  The curve is composed of two sine harmonics that both vanish at the
 *  endpoints (t=0 and t=1), so the animal and food positions are always
 *  preserved. The primary arch and optional S-curve components are
 *  randomized per call, giving each playthrough a visually distinct path
 *  while staying smooth and traceable for a toddler.
 */
export function generatePathPoints(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  numPoints: number,
): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const archAmplitude = 40 + Math.random() * 50; // 40–90px hump
  const archDirection = Math.random() < 0.5 ? 1 : -1; // arch up or down
  const sAmplitude = Math.random() * 30; // 0–30px secondary wave
  const sDirection = Math.random() < 0.5 ? 1 : -1;

  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    const x = startX + (endX - startX) * t;
    const baseY = startY + (endY - startY) * t;
    // sin(0) = 0 and sin(π) = 0 → endpoints preserved exactly
    const archY = Math.sin(t * Math.PI) * archAmplitude * archDirection;
    const sCurveY = Math.sin(t * Math.PI * 2) * sAmplitude * sDirection;
    points.push({ x, y: baseY + archY + sCurveY });
  }
  return points;
}
