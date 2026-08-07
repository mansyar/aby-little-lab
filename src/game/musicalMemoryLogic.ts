/** The number of frogs the child can tap (green / blue / red). */
export const FROG_COUNT = 3;

/** The sequence length at the start of the game (round 1). */
export const START_LENGTH = 2;

/** The sequence length needed to win the game (5 rounds: lengths 2→6). */
export const WIN_TARGET = 6;

/** The longest run of consecutive same-frog notes a sequence may contain. */
export const MAX_RUN = 2;

/**
 * Picks a random frog index (0..FROG_COUNT-1), avoiding a third consecutive
 * same-frog note when the last two notes are identical.
 */
function pickNote(previous: number[]): number {
  const last = previous.at(-1);
  const secondLast = previous.at(-2);
  if (last !== undefined && last === secondLast) {
    // Run of MAX_RUN already: draw from the other frogs only.
    const allowed = [0, 1, 2].filter((frog) => frog !== last);
    return allowed[Math.floor(Math.random() * allowed.length)];
  }
  return Math.floor(Math.random() * FROG_COUNT);
}

/**
 * Generates a random sequence of frog indices (0..FROG_COUNT-1) of the given
 * length with no run of more than `MAX_RUN` consecutive same-frog notes.
 * Used to initialise the first round.
 */
export function generateSequence(length: number): number[] {
  const sequence: number[] = [];
  for (let i = 0; i < length; i++) {
    sequence.push(pickNote(sequence));
  }
  return sequence;
}

/**
 * Returns a *new* sequence with one random frog index (0..FROG_COUNT-1)
 * appended, respecting the same-frog run cap. The original sequence is not
 * mutated.
 */
export function appendNote(sequence: readonly number[]): number[] {
  const note = pickNote([...sequence]);
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
