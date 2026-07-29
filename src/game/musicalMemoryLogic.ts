/** The number of frogs the child can tap (green / blue / red). */
export const FROG_COUNT = 3;

/** The sequence length at the start of the game (round 1). */
export const START_LENGTH = 2;

/** The sequence length needed to win the game (5 rounds: lengths 2→6). */
export const WIN_TARGET = 6;

/**
 * Generates a random sequence of frog indices (0..FROG_COUNT-1) of the given
 * length. Used to initialise the first round.
 */
export function generateSequence(length: number): number[] {
  const sequence: number[] = [];
  for (let i = 0; i < length; i++) {
    sequence.push(Math.floor(Math.random() * FROG_COUNT));
  }
  return sequence;
}

/**
 * Returns a *new* sequence with one random frog index (0..FROG_COUNT-1)
 * appended. The original sequence is not mutated.
 */
export function appendNote(sequence: readonly number[]): number[] {
  const note = Math.floor(Math.random() * FROG_COUNT);
  return [...sequence, note];
}

/**
 * Validates a child's tap against the sequence at the current input index.
 *
 * - **Correct tap:** returns `{ correct: true, nextIndex: inputIndex + 1 }`.
 * - **Wrong tap:** returns `{ correct: false, nextIndex: 0 }` — the input
 *   resets to the start so the sequence can be replayed (no-fail design; no
 *   forward progress is lost, the same round is retried).
 */
export function validateInput(
  sequence: readonly number[],
  inputIndex: number,
  tappedFrog: number,
): { correct: boolean; nextIndex: number } {
  if (sequence[inputIndex] === tappedFrog) {
    return { correct: true, nextIndex: inputIndex + 1 };
  }
  return { correct: false, nextIndex: 0 };
}

/** Returns true when the child has tapped every note in the sequence. */
export function isRoundComplete(sequence: readonly number[], inputIndex: number): boolean {
  return inputIndex >= sequence.length;
}

/** Returns true when the sequence length has reached the win target. */
export function isWin(sequenceLength: number, target: number = WIN_TARGET): boolean {
  return sequenceLength >= target;
}
