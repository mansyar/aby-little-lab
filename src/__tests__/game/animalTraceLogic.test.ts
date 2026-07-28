import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ALL_PAIRS,
  type AnimalFoodPair,
  advancePath,
  createPathProgress,
  generatePathPoints,
  isPathComplete,
  isRoundComplete,
  selectThreePairs,
  shuffle,
} from "../../game/animalTraceLogic";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("selectThreePairs", () => {
  it("returns exactly 3 pairs", () => {
    const result = selectThreePairs();
    expect(result).toHaveLength(3);
  });

  it("returns pairs from the valid set of 4", () => {
    const result = selectThreePairs();
    for (const pair of result) {
      expect(ALL_PAIRS).toContainEqual(pair);
    }
  });

  it("returns no duplicate pairs", () => {
    const result = selectThreePairs();
    const unique = new Set(result.map((p) => `${p.animal}-${p.food}`));
    expect(unique.size).toBe(3);
  });
});

describe("shuffle", () => {
  it("returns an array with the same elements", () => {
    const input: AnimalFoodPair[] = [...ALL_PAIRS];
    const result = shuffle(input);
    const sortByAnimal = (a: AnimalFoodPair, b: AnimalFoodPair) => a.animal.localeCompare(b.animal);
    expect(result.sort(sortByAnimal)).toEqual(input.sort(sortByAnimal));
  });

  it("returns a new array (does not mutate input)", () => {
    const input: AnimalFoodPair[] = [...ALL_PAIRS];
    const inputCopy = [...input];
    shuffle(input);
    expect(input).toEqual(inputCopy);
  });

  it("returns the same length array", () => {
    const input: AnimalFoodPair[] = [...ALL_PAIRS];
    const result = shuffle(input);
    expect(result).toHaveLength(input.length);
  });

  it("produces independent results when called twice with different random values", () => {
    const input: AnimalFoodPair[] = [...ALL_PAIRS];

    const spy = vi.spyOn(Math, "random");
    spy.mockReturnValueOnce(0.5).mockReturnValueOnce(0.2);
    const result1 = shuffle(input);

    spy.mockReturnValueOnce(0.8).mockReturnValueOnce(0.1);
    const result2 = shuffle(input);

    expect(result1).not.toEqual(result2);
  });
});

describe("createPathProgress", () => {
  it("creates progress starting at point 0", () => {
    const progress = createPathProgress(5);
    expect(progress.currentPoint).toBe(0);
  });

  it("creates progress with correct total points", () => {
    const progress = createPathProgress(5);
    expect(progress.totalPoints).toBe(5);
  });
});

describe("advancePath", () => {
  it("advances to the next point", () => {
    const progress = createPathProgress(5);
    const advanced = advancePath(progress);
    expect(advanced.currentPoint).toBe(1);
  });

  it("does not advance past the last point", () => {
    const progress = { currentPoint: 4, totalPoints: 5 };
    const advanced = advancePath(progress);
    expect(advanced.currentPoint).toBe(4);
  });

  it("returns a new object (does not mutate input)", () => {
    const progress = createPathProgress(5);
    const advanced = advancePath(progress);
    expect(advanced).not.toBe(progress);
    expect(progress.currentPoint).toBe(0);
  });
});

describe("isPathComplete", () => {
  it("returns false when not at the last point", () => {
    const progress = createPathProgress(5);
    expect(isPathComplete(progress)).toBe(false);
  });

  it("returns true when at the last point", () => {
    const progress = { currentPoint: 4, totalPoints: 5 };
    expect(isPathComplete(progress)).toBe(true);
  });
});

describe("isRoundComplete", () => {
  it("returns false when fewer than 3 paths completed", () => {
    expect(isRoundComplete(0)).toBe(false);
    expect(isRoundComplete(1)).toBe(false);
    expect(isRoundComplete(2)).toBe(false);
  });

  it("returns true when 3 paths completed", () => {
    expect(isRoundComplete(3)).toBe(true);
  });
});

describe("generatePathPoints", () => {
  it("returns the requested number of points", () => {
    const points = generatePathPoints(200, 384, 824, 384, 6);
    expect(points).toHaveLength(6);
  });

  it("first point is at the start position", () => {
    const points = generatePathPoints(200, 384, 824, 384, 6);
    expect(points[0].x).toBe(200);
    expect(points[0].y).toBe(384);
  });

  it("last point is at the end position", () => {
    const points = generatePathPoints(200, 384, 824, 384, 6);
    expect(points[5].x).toBe(824);
    expect(points[5].y).toBe(384);
  });

  it("points are evenly spaced in x", () => {
    const points = generatePathPoints(200, 384, 824, 384, 6);
    const xStep = (824 - 200) / 5;
    for (let i = 0; i < points.length; i++) {
      expect(points[i].x).toBeCloseTo(200 + xStep * i);
    }
  });

  it("intermediate points have a gentle curve (y varies from base line)", () => {
    const points = generatePathPoints(200, 384, 824, 384, 6);
    // Curve is randomized but always deviates from the base line at midpoints
    expect(points[2].y).not.toBe(384);
    expect(points[3].y).not.toBe(384);
  });

  it("produces different curves on successive calls (randomized)", () => {
    const spy = vi.spyOn(Math, "random");
    spy.mockReturnValueOnce(0.5).mockReturnValueOnce(0.2); // first call params
    const result1 = generatePathPoints(200, 384, 824, 384, 6);

    spy.mockReturnValueOnce(0.8).mockReturnValueOnce(0.9); // second call params
    const result2 = generatePathPoints(200, 384, 824, 384, 6);

    // At least one intermediate point should differ between the two curves
    const midDiffer = result1.slice(1, -1).some((p, i) => p.y !== result2[i + 1].y);
    expect(midDiffer).toBe(true);
  });
});
