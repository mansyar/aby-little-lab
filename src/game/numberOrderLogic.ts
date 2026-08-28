import { BASE_LADDER, type BandShift, shiftLadder } from "./adaptiveLogic";
import { shuffle } from "./shapeSorterLogic";

/** Band 1 easy 1–5, band 2 medium 1–8, band 3 hard 1–10. Range is inclusive. */
export const BAND_RANGES: Record<1 | 2 | 3, readonly [number, number]> = {
  1: [1, 5],
  2: [1, 8],
  3: [1, 10],
};

/** How many numerals a round shows per band. */
export const BAND_COUNTS: Record<1 | 2 | 3, number> = {
  1: 3,
  2: 4,
  3: 5,
};

export interface NumberOrderRound {
  /** Band that generated this round (1..3). */
  band: 1 | 2 | 3;
  /** Shuffled order shown in the source row (permutation of solution, not ascending). */
  shuffled: number[];
  /** Ascending solution the child must produce. */
  solution: number[];
}

function isAscending(arr: readonly number[]): boolean {
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] <= arr[i - 1]) return false;
  }
  return true;
}

/**
 * Builds one round for the given band: samples `count` unique numbers from the
 * band's inclusive range, sorts to form the solution, then shuffles to form
 * the source row. If the shuffle happens to equal the ascending solution, it
 * is reshuffled once to guarantee the puzzle requires work (not already solved).
 */
export function buildRound(band: 1 | 2 | 3): NumberOrderRound {
  const [min, max] = BAND_RANGES[band];
  const count = BAND_COUNTS[band];
  const pool = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const sampled = shuffle(pool).slice(0, count);
  const solution = [...sampled].sort((a, b) => a - b);
  let shuffled = shuffle(solution);
  // Guard: if shuffled is already ascending, reshuffle once (deterministic via Math.random mock)
  if (
    isAscending(shuffled) &&
    shuffled.length === solution.length &&
    shuffled.every((v, i) => v === solution[i])
  ) {
    shuffled = shuffle(solution);
  }
  return { band, shuffled, solution };
}

/**
 * Generates a 6-round easy-first playthrough. `shift` (-1|0|1) nudges the
 * classic [1,1,2,2,3,3] ladder via `shiftLadder`, clamped to 1..3.
 * The shifted ladder maps each step to a `buildRound` call.
 */
export function buildPlaythrough(shift: BandShift = 0): NumberOrderRound[] {
  const ladder = shiftLadder(BASE_LADDER, shift);
  return ladder.map((band) => buildRound(band));
}

/** True iff `placed` equals `solution` (same length, same order, same values). */
export function isCorrect(placed: readonly number[], solution: readonly number[]): boolean {
  if (placed.length !== solution.length) return false;
  for (let i = 0; i < placed.length; i++) {
    if (placed[i] !== solution[i]) return false;
  }
  return true;
}
