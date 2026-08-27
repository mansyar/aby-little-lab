import { describe, expect, it } from "vitest";
import {
  BASE_LADDER,
  bandShiftFor,
  DOWN_THRESHOLD,
  MIN_SAMPLE,
  shiftLadder,
  UP_THRESHOLD,
  updateRecentWindow,
  WINDOW_SIZE,
} from "../../game/adaptiveLogic";

/** Builds a window with the given number of correct and wrong taps. */
function makeWindow(correct: number, wrong: number): boolean[] {
  return [
    ...Array.from({ length: correct }, () => true),
    ...Array.from({ length: wrong }, () => false),
  ];
}

describe("constants", () => {
  it("exposes the tuned window and threshold constants", () => {
    expect(WINDOW_SIZE).toBe(10);
    expect(MIN_SAMPLE).toBe(6);
    expect(UP_THRESHOLD).toBe(0.9);
    expect(DOWN_THRESHOLD).toBe(0.6);
  });

  it("exposes the classic easy-first base ladder", () => {
    expect(BASE_LADDER).toEqual([1, 1, 2, 2, 3, 3]);
  });
});

describe("updateRecentWindow", () => {
  it("folds a session aggregate as correct taps then wrong taps", () => {
    expect(updateRecentWindow([], { correct: 3, wrong: 2 })).toEqual([
      true,
      true,
      true,
      false,
      false,
    ]);
  });

  it("keeps only the most recent WINDOW_SIZE taps across sessions", () => {
    const window = makeWindow(6, 2); // 8 taps already recorded
    const updated = updateRecentWindow(window, { correct: 3, wrong: 2 }); // 5 more
    expect(updated).toHaveLength(WINDOW_SIZE);
    // Chronological order across the trim boundary: the 3 oldest correct
    // taps drop off, leaving 3 true, 2 false, then the newly appended taps.
    expect(updated).toEqual([true, true, true, false, false, true, true, true, false, false]);
  });

  it("accepts an empty session without changing the window", () => {
    const window = makeWindow(2, 3);
    expect(updateRecentWindow(window, { correct: 0, wrong: 0 })).toEqual(window);
  });

  it("returns a new array and never mutates the input", () => {
    const window = makeWindow(2, 2);
    const snapshot = [...window];
    const updated = updateRecentWindow(window, { correct: 1, wrong: 1 });
    expect(window).toEqual(snapshot);
    expect(updated).not.toBe(window);
  });
});

describe("bandShiftFor", () => {
  it("returns 0 for an empty window", () => {
    expect(bandShiftFor([])).toBe(0);
  });

  it("returns 0 below the minimum sample (new players see no change)", () => {
    expect(bandShiftFor(makeWindow(MIN_SAMPLE - 1, 0))).toBe(0);
    expect(bandShiftFor(makeWindow(0, MIN_SAMPLE - 1))).toBe(0);
  });

  it("shifts up at or above the 90% accuracy threshold", () => {
    expect(bandShiftFor(makeWindow(6, 0))).toBe(1); // 100%
    expect(bandShiftFor(makeWindow(9, 1))).toBe(1); // exactly 90%
  });

  it("shifts down below the 60% accuracy threshold", () => {
    expect(bandShiftFor(makeWindow(0, 6))).toBe(-1); // 0%
    expect(bandShiftFor(makeWindow(5, 5))).toBe(-1); // 50%
  });

  it("holds steady inside the neutral band", () => {
    expect(bandShiftFor(makeWindow(8, 2))).toBe(0); // 80%
    expect(bandShiftFor(makeWindow(4, 2))).toBe(0); // ~67%
    expect(bandShiftFor(makeWindow(6, 4))).toBe(0); // exactly 60% is not below
  });
});

describe("shiftLadder", () => {
  it("returns the classic ladder for a 0 shift", () => {
    expect(shiftLadder(BASE_LADDER, 0)).toEqual([1, 1, 2, 2, 3, 3]);
  });

  it("shifts up one band, capping at band 3", () => {
    expect(shiftLadder(BASE_LADDER, 1)).toEqual([2, 2, 3, 3, 3, 3]);
    expect(shiftLadder([2, 2, 3, 3, 3, 3], 1)).toEqual([3, 3, 3, 3, 3, 3]);
  });

  it("shifts down one band, floored at band 1", () => {
    expect(shiftLadder(BASE_LADDER, -1)).toEqual([1, 1, 1, 1, 2, 2]);
    expect(shiftLadder([1, 1, 1, 1, 2, 2], -1)).toEqual([1, 1, 1, 1, 1, 1]);
  });

  it("returns a new array and never mutates the input", () => {
    const snapshot = [...BASE_LADDER];
    const shifted = shiftLadder(BASE_LADDER, 1);
    expect(BASE_LADDER).toEqual(snapshot);
    expect(shifted).not.toBe(BASE_LADDER);
  });
});
