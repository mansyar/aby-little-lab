/**
 * Adaptive difficulty: shared helpers that nudge a game's band ladder by at
 * most one step based on a profile's recent accuracy. Pure logic only —
 * scenes and storage call these; nothing here touches Phaser or localStorage.
 */

/** Band ids shared by every band-based game (1 = easiest). */
export type BandId = 1 | 2 | 3;

/** How far a playthrough's ladder may move: one band up, down, or steady. */
export type BandShift = -1 | 0 | 1;

/** Number of recent taps kept per game to judge current ability. */
export const WINDOW_SIZE = 10;

/** Taps required before a shift is computed (new players see no change). */
export const MIN_SAMPLE = 6;

/** Accuracy (inclusive) that earns a one-band step up. */
export const UP_THRESHOLD = 0.9;

/** Accuracy (exclusive) that earns a one-band step down. */
export const DOWN_THRESHOLD = 0.6;

/** The classic easy-first ladder every band-based game serves today. */
export const BASE_LADDER: readonly BandId[] = [1, 1, 2, 2, 3, 3];

/**
 * Folds a session's tap aggregate into the rolling window: correct taps
 * first, then wrong ones, keeping only the most recent WINDOW_SIZE entries.
 * Returns a new array; the input is never mutated.
 */
export function updateRecentWindow(
  recent: readonly boolean[],
  result: { correct: number; wrong: number },
): boolean[] {
  const appended = [
    ...Array.from({ length: result.correct }, () => true),
    ...Array.from({ length: result.wrong }, () => false),
  ];
  return [...recent, ...appended].slice(-WINDOW_SIZE);
}

/**
 * Computes the band shift for a game from its rolling tap window: +1 at or
 * above UP_THRESHOLD accuracy, -1 below DOWN_THRESHOLD, otherwise 0. Windows
 * with fewer than MIN_SAMPLE taps yield 0 (not enough evidence yet).
 */
export function bandShiftFor(recent: readonly boolean[]): BandShift {
  if (recent.length < MIN_SAMPLE) {
    return 0;
  }
  const correct = recent.filter((tap) => tap).length;
  const accuracy = correct / recent.length;
  if (accuracy >= UP_THRESHOLD) {
    return 1;
  }
  if (accuracy < DOWN_THRESHOLD) {
    return -1;
  }
  return 0;
}

/**
 * Applies a shift to a band ladder, clamping every step to the valid band
 * range (1..3) so ladders never leave the game's supported difficulty.
 * Returns a new array; the input is never mutated.
 */
export function shiftLadder(ladder: readonly BandId[], shift: BandShift): BandId[] {
  return ladder.map((band) => Math.min(3, Math.max(1, band + shift)) as BandId);
}
