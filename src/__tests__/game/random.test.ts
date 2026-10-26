import { afterEach, describe, expect, it, vi } from "vitest";
import { type Rng, shuffle } from "../../game/random";
import { mulberry32 } from "../helpers/randomHelper";

/**
 * Tests `shuffle` as an `Rng` consumer with a fixed [0, 1) value: proves the
 * seam accepts any injected generator (not just {@link mulberry32}'s shape).
 */
const CONSTANT_RNG: Rng = (): number => 0.07329497812315822;

/** A realistic pool: the 24 first letters a-x, the size an in-game shuffle sees. */
const POOL: readonly string[] = Array.from({ length: 24 }, (_, index) =>
  String.fromCharCode(97 + index),
);

/** Sorted copy of a shuffle result, to prove the output is a permutation of the input. */
function sortedOf(values: readonly string[]): string[] {
  return [...values].sort();
}

describe("shuffle", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a permutation without touching the input array", () => {
    const before = [...POOL];
    const result = shuffle(POOL, mulberry32(1234));

    expect(POOL).toEqual(before);
    expect(result).not.toBe(POOL);
    expect(sortedOf(result)).toEqual(sortedOf(POOL));
  });

  it("reproduces the same full sequence for the same fixed seed", () => {
    const first = shuffle(POOL, mulberry32(1234));
    const second = shuffle(POOL, mulberry32(1234));

    expect(second).toEqual(first);
  });

  it("accepts any injected generator matching the Rng seam", () => {
    const constant = shuffle(POOL, CONSTANT_RNG);

    expect(constant).not.toBe(POOL);
    expect(sortedOf(constant)).toEqual(sortedOf(POOL));
  });

  it("returns [] for an empty input without consulting the rng", () => {
    const counting = vi.fn(() => 0.5);

    expect(shuffle([], counting)).toEqual([]);
    expect(counting).not.toHaveBeenCalled();
  });

  it("returns a copy for a single element, never the same reference", () => {
    const input: readonly string[] = ["only"];
    const result = shuffle(input, mulberry32(1234));

    expect(result).toEqual(["only"]);
    expect(result).not.toBe(input);
  });

  it("orders a two-element input by the fixed seed's first draw", () => {
    // Seed 1234's first draw (0.07329497812315822) floors to j = 0: swapped.
    expect(shuffle(["a", "b"], mulberry32(1234))).toEqual(["b", "a"]);
    // Seed 42's first draw (0.6011037519201636) floors to j = i: no swap.
    expect(shuffle(["a", "b"], mulberry32(42))).toEqual(["a", "b"]);
  });

  it("keeps every index in range when rng returns 0.0", () => {
    // rng() === 0 picks j = 0 at every step, so the copy left-rotates by one —
    // exactly what all-in-range j = 0 draws must produce over the 24-item pool.
    expect(shuffle(POOL, () => 0)).toEqual([...POOL.slice(1), POOL[0]]);
  });

  it("keeps every index in range when rng returns 1 - Number.EPSILON", () => {
    // Near-1 draws floor to j = i even at pool size 24, so every step swaps an
    // index with itself: the input order survives unharmed in a fresh copy.
    const result = shuffle(POOL, () => 1 - Number.EPSILON);

    expect(result).toEqual(POOL);
    expect(result).not.toBe(POOL);
  });

  it("reads Math.random by default when no rng is passed", () => {
    // Scoped default-wiring assertion only (the FR-6 exception): the stub
    // exists to prove the fallback wiring, not to script gameplay randomness.
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);

    expect(shuffle(POOL)).toEqual([...POOL.slice(1), POOL[0]]);
    expect(randomSpy).toHaveBeenCalledTimes(POOL.length - 1);
  });
});
