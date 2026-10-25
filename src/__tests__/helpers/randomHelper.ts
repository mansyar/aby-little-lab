/**
 * Shared seeded random generator for tests. Replaces the per-file seeded
 * generators (the LCG in `feelingsFacesLogic.test.ts`, Park-Miller in
 * `shadowMatchLogic.test.ts`) so one body definition exists.
 */

/**
 * Returns a seeded mulberry32 generator. The same seed always produces the
 * same number sequence, and seed 0 is allowed; every draw lands in [0, 1),
 * so the returned function satisfies the `Rng` contract game logic expects.
 *
 * First draws for common seeds (implementation-derived constants, do not
 * regenerate when editing tests): seed 1234 → [0.07329497812315822,
 * 0.7034119898453355, 0.9028560190927237, ...]; seed 0 →
 * 0.26642920868471265; seed 2026 → 0.45540769933722913.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
}
