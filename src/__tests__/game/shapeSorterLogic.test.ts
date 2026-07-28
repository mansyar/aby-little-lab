import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ALL_SHAPES,
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

  it("returns shapes from the valid set of 4", () => {
    const result = selectThreeShapes();
    for (const shape of result) {
      expect(ALL_SHAPES).toContain(shape);
    }
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

describe("isMatch", () => {
  it("returns true when shape type matches slot type", () => {
    expect(isMatch("circle", "circle")).toBe(true);
    expect(isMatch("square", "square")).toBe(true);
    expect(isMatch("triangle", "triangle")).toBe(true);
    expect(isMatch("star", "star")).toBe(true);
  });

  it("returns false when shape type does not match slot type", () => {
    expect(isMatch("circle", "square")).toBe(false);
    expect(isMatch("square", "triangle")).toBe(false);
    expect(isMatch("triangle", "star")).toBe(false);
    expect(isMatch("star", "circle")).toBe(false);
  });
});
