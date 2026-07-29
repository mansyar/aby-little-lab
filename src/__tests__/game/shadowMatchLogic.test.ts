import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ALL_OBJECTS,
  generateRound,
  isMatch,
  isWin,
  type ObjectType,
  shuffle,
  WIN_TARGET,
} from "../../game/shadowMatchLogic";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("generateRound", () => {
  it("generates 6 objects with correct object IDs (house, tree, car, boat, ball, umbrella)", () => {
    const round = generateRound();
    expect(round.objects).toHaveLength(6);
    for (const obj of round.objects) {
      expect(ALL_OBJECTS).toContain(obj);
    }
    expect(new Set(round.objects).size).toBe(6);
  });

  it("generates 6 shadows with correct object IDs", () => {
    const round = generateRound();
    expect(round.shadows).toHaveLength(6);
    for (const shadow of round.shadows) {
      expect(ALL_OBJECTS).toContain(shadow);
    }
    expect(new Set(round.shadows).size).toBe(6);
  });

  it("shuffles objects and shadows independently (replay variety)", () => {
    const spy = vi.spyOn(Math, "random");
    // Fisher-Yates on 6 elements makes 5 random calls per shuffle.
    // First 5 calls (objects) return 0.5, next 5 (shadows) return 0.1
    // to guarantee different orderings.
    spy
      .mockReturnValueOnce(0.5)
      .mockReturnValueOnce(0.5)
      .mockReturnValueOnce(0.5)
      .mockReturnValueOnce(0.5)
      .mockReturnValueOnce(0.5)
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.1);
    const round = generateRound();
    expect(round.objects).not.toEqual(round.shadows);
  });
});

describe("shuffle", () => {
  it("returns an array with the same elements", () => {
    const input: ObjectType[] = ["house", "tree", "car"];
    const result = shuffle(input);
    expect(result.sort()).toEqual(input.sort());
  });

  it("returns a new array (does not mutate input)", () => {
    const input: ObjectType[] = ["house", "tree", "car"];
    const inputCopy = [...input];
    shuffle(input);
    expect(input).toEqual(inputCopy);
  });

  it("returns the same length array", () => {
    const input: ObjectType[] = ["house", "tree", "car"];
    const result = shuffle(input);
    expect(result).toHaveLength(input.length);
  });

  it("produces independent results when called twice with different random values", () => {
    const input: ObjectType[] = ["house", "tree", "car"];

    const spy = vi.spyOn(Math, "random");
    spy.mockReturnValueOnce(0.5).mockReturnValueOnce(0.2);
    const result1 = shuffle(input);

    spy.mockReturnValueOnce(0.8).mockReturnValueOnce(0.1);
    const result2 = shuffle(input);

    expect(result1).not.toEqual(result2);
  });
});

describe("isMatch", () => {
  it("returns true when object type matches shadow type", () => {
    expect(isMatch("house", "house")).toBe(true);
    expect(isMatch("tree", "tree")).toBe(true);
    expect(isMatch("car", "car")).toBe(true);
    expect(isMatch("boat", "boat")).toBe(true);
    expect(isMatch("ball", "ball")).toBe(true);
    expect(isMatch("umbrella", "umbrella")).toBe(true);
  });

  it("returns false when object type does not match shadow type", () => {
    expect(isMatch("house", "tree")).toBe(false);
    expect(isMatch("tree", "car")).toBe(false);
    expect(isMatch("car", "boat")).toBe(false);
    expect(isMatch("boat", "ball")).toBe(false);
    expect(isMatch("ball", "umbrella")).toBe(false);
    expect(isMatch("umbrella", "house")).toBe(false);
  });
});

describe("isWin", () => {
  it("returns true when matched count reaches 6", () => {
    expect(isWin(WIN_TARGET)).toBe(true);
  });

  it("returns false when matched count is less than 6", () => {
    expect(isWin(0)).toBe(false);
    expect(isWin(1)).toBe(false);
    expect(isWin(2)).toBe(false);
    expect(isWin(3)).toBe(false);
    expect(isWin(4)).toBe(false);
    expect(isWin(5)).toBe(false);
  });
});
