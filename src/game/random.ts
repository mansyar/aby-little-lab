/**
 * Shared randomness for game logic: one Fisher-Yates `shuffle` plus the
 * `Rng` seam every random decision flows through.
 */

/**
 * Shape of an injected random generator. `rng` must return a number in
 * [0, 1); tests pass a seeded generator so a draw is reproducible, while
 * production passes `Math.random`.
 */
export type Rng = () => number;

/**
 * Returns a shuffled copy of `items` using the Fisher-Yates algorithm. The
 * input array is never mutated.
 *
 * `rng` must return a number in [0, 1); tests pass a seeded generator so a
 * shuffle is reproducible. Defaults to `Math.random`, so callers that pass
 * no `rng` keep the shipped production behavior.
 */
export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
