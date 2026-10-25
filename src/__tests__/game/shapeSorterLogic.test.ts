import { describe, expect, it } from "vitest";

import { shuffle } from "../../game/random";
import {
  ALL_SHAPES,
  generatePlaythrough,
  isMatch,
  poolFor,
  type ShapeType,
} from "../../game/shapeSorterLogic";
import { mulberry32 } from "../helpers/randomHelper";

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

    // Draw script passed through the injected seam: the first shuffle draws
    // 0.5 then 0.2, the second 0.8 then 0.1.
    let draw = 0;
    const draws = [0.5, 0.2, 0.8, 0.1];
    const rng = () => draws[draw++];
    const result1 = shuffle(input, rng);
    const result2 = shuffle(input, rng);

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

describe("poolFor", () => {
  it("classic band draws from the full 18-shape pool", () => {
    expect(poolFor(0)).toEqual(ALL_SHAPES);
  });

  it("every band's pool holds enough unique shapes for a 3-round session", () => {
    for (const shift of [-1, 0, 1] as const) {
      const pool = poolFor(shift);
      // 3 rounds x 3 shapes, all drawn without repeats from the pool.
      expect(pool.length).toBeGreaterThanOrEqual(9);
      expect(new Set(pool).size).toBe(pool.length);
      for (const shape of pool) {
        expect(ALL_SHAPES).toContain(shape);
      }
    }
  });

  it("easy and hard bands draw from distinguishable pools", () => {
    const easy = poolFor(-1);
    const hard = poolFor(1);
    expect(easy).not.toEqual(hard);
    // Ornamental silhouettes are easy-band only; the polygon family is hard-band only.
    expect(hard).not.toContain("star");
    expect(hard).not.toContain("heart");
    expect(easy).not.toContain("hexagon");
    expect(easy).not.toContain("octagon");
  });
});

describe("generatePlaythrough with a band shift", () => {
  it("draws a 3-round session entirely from the band's pool without repeats", () => {
    for (const shift of [-1, 0, 1] as const) {
      const playthrough = generatePlaythrough(3, shift);
      expect(playthrough).toHaveLength(3);
      const all = playthrough.flat();
      expect(new Set(all).size).toBe(9);
      const pool = poolFor(shift);
      for (const shape of all) {
        expect(pool).toContain(shape);
      }
    }
  });

  it("hard-band draws never include easy-band-only shapes (pools move observably)", () => {
    const easyPool = poolFor(-1);
    const hardPool = poolFor(1);
    const easyOnly = easyPool.filter((s) => !hardPool.includes(s));
    const hardOnly = hardPool.filter((s) => !easyPool.includes(s));
    expect(easyOnly.length).toBeGreaterThan(0);
    expect(hardOnly.length).toBeGreaterThan(0);
    for (const shift of [-1, 1] as const) {
      const draw = generatePlaythrough(3, shift).flat();
      const expected = shift < 0 ? easyPool : hardPool;
      for (const shape of draw) {
        expect(expected).toContain(shape);
      }
    }
  });

  it("classic draws are identical with and without the shift argument", () => {
    // The rng is a trailing optional parameter, so omitting the shift still
    // takes the classic default; the seeded generator makes the draw
    // repeatable instead of relying on a scoped Math.random stub.
    expect(generatePlaythrough(3, undefined, mulberry32(1234))).toEqual(
      generatePlaythrough(3, 0, mulberry32(1234)),
    );
    expect(generatePlaythrough(3, 0, mulberry32(1234))).toEqual(
      generatePlaythrough(3, 0, mulberry32(1234)),
    );
    const classic = generatePlaythrough(3, 0, mulberry32(1234));
    expect(classic).toHaveLength(3);
    expect(new Set(classic.flat()).size).toBe(9);
  });
});
