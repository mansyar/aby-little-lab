import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ALL_SHAPES,
  generatePlaythrough,
  isMatch,
  type ShapeType,
  selectThreeShapes,
  shuffle,
} from "../../game/shapeSorterLogic";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("selectThreeShapes", () => {
  it("returns exactly 3 shapes", () => {
    const result = selectThreeShapes();
    expect(result).toHaveLength(3);
  });

  it("returns shapes from the valid set of 6", () => {
    const result = selectThreeShapes();
    for (const shape of result) {
      expect(ALL_SHAPES).toContain(shape);
    }
  });

  it("expanded pool includes all 12 new shape types (18 total)", () => {
    expect(ALL_SHAPES).toHaveLength(18);
    expect(ALL_SHAPES).toContain("oval");
    expect(ALL_SHAPES).toContain("rectangle");
    expect(ALL_SHAPES).toContain("diamond");
    expect(ALL_SHAPES).toContain("pentagon");
    expect(ALL_SHAPES).toContain("hexagon");
    expect(ALL_SHAPES).toContain("octagon");
    expect(ALL_SHAPES).toContain("trapezoid");
    expect(ALL_SHAPES).toContain("semicircle");
    expect(ALL_SHAPES).toContain("arrow");
    expect(ALL_SHAPES).toContain("plus");
    expect(ALL_SHAPES).toContain("ring");
    expect(ALL_SHAPES).toContain("teardrop");
  });

  it("returns no duplicate shapes", () => {
    const result = selectThreeShapes();
    const unique = new Set(result);
    expect(unique.size).toBe(3);
  });
});

describe("shuffle", () => {
  it("returns an array with the same elements", () => {
    const input: ShapeType[] = ["circle", "square", "triangle"];
    const result = shuffle(input);
    expect(result.sort()).toEqual(input.sort());
  });

  it("returns a new array (does not mutate input)", () => {
    const input: ShapeType[] = ["circle", "square", "triangle"];
    const inputCopy = [...input];
    shuffle(input);
    expect(input).toEqual(inputCopy);
  });

  it("returns the same length array", () => {
    const input: ShapeType[] = ["circle", "square", "triangle"];
    const result = shuffle(input);
    expect(result).toHaveLength(input.length);
  });

  it("produces independent results when called twice with different random values", () => {
    const input: ShapeType[] = ["circle", "square", "triangle"];

    const spy = vi.spyOn(Math, "random");
    spy.mockReturnValueOnce(0.5).mockReturnValueOnce(0.2);
    const result1 = shuffle(input);

    spy.mockReturnValueOnce(0.8).mockReturnValueOnce(0.1);
    const result2 = shuffle(input);

    expect(result1).not.toEqual(result2);
  });
});

describe("generatePlaythrough", () => {
  it("returns 3 rounds of 3 shapes for 3 rounds", () => {
    const playthrough = generatePlaythrough(3);
    expect(playthrough).toHaveLength(3);
    for (const round of playthrough) {
      expect(round).toHaveLength(3);
    }
  });

  it("draws no shape twice across the playthrough (9 unique per session)", () => {
    const playthrough = generatePlaythrough(3);
    const all = playthrough.flat();
    expect(new Set(all).size).toBe(9);
  });

  it("returns no duplicate shapes within a round", () => {
    const playthrough = generatePlaythrough(3);
    for (const round of playthrough) {
      expect(new Set(round).size).toBe(3);
    }
  });

  it("draws all shapes from the valid 18-shape pool", () => {
    const playthrough = generatePlaythrough(3);
    for (const shape of playthrough.flat()) {
      expect(ALL_SHAPES).toContain(shape);
    }
  });
});

describe("isMatch", () => {
  it("returns true when shape type matches slot type", () => {
    expect(isMatch("circle", "circle")).toBe(true);
    expect(isMatch("square", "square")).toBe(true);
    expect(isMatch("triangle", "triangle")).toBe(true);
    expect(isMatch("star", "star")).toBe(true);
    expect(isMatch("heart", "heart")).toBe(true);
    expect(isMatch("crescent", "crescent")).toBe(true);
  });

  it("returns false when shape type does not match slot type", () => {
    expect(isMatch("circle", "square")).toBe(false);
    expect(isMatch("square", "triangle")).toBe(false);
    expect(isMatch("triangle", "star")).toBe(false);
    expect(isMatch("star", "circle")).toBe(false);
    expect(isMatch("heart", "star")).toBe(false);
    expect(isMatch("crescent", "heart")).toBe(false);
  });
});
