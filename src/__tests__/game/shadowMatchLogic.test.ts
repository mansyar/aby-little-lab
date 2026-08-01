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

  it("expanded pool includes the new airplane and mushroom objects (8 total)", () => {
    expect(ALL_OBJECTS).toHaveLength(8);
    expect(ALL_OBJECTS).toContain("airplane");
    expect(ALL_OBJECTS).toContain("mushroom");
  });

  it("selects exactly 6 of the 8 objects per round (2 excluded)", () => {
    const round = generateRound();
    const excluded = ALL_OBJECTS.filter((o) => !round.objects.includes(o));
    expect(excluded).toHaveLength(2);
  });

  it("selects exactly 6 of the 8 shadows per round (2 excluded)", () => {
    const round = generateRound();
    const excluded = ALL_OBJECTS.filter((o) => !round.shadows.includes(o));
    expect(excluded).toHaveLength(2);
  });

  it("generates 6 shadows with correct object IDs", () => {
    const round = generateRound();
    expect(round.shadows).toHaveLength(6);
    for (const shadow of round.shadows) {
      expect(ALL_OBJECTS).toContain(shadow);
    }
    expect(new Set(round.shadows).size).toBe(6);
  });

  it("objects and shadows are the same set (every object has a matching shadow)", () => {
    const round = generateRound();
    expect(new Set(round.objects)).toEqual(new Set(round.shadows));
  });

  it("shuffles objects and shadows independently (replay variety)", () => {
    const spy = vi.spyOn(Math, "random");
    // selection shuffle (8 elements, 7 calls) + objects shuffle (6 elements, 5 calls) use 0.5
    for (let i = 0; i < 12; i++) spy.mockReturnValueOnce(0.5);
    // shadows shuffle (6 elements, 5 calls) uses 0.1 → different ordering
    for (let i = 0; i < 5; i++) spy.mockReturnValueOnce(0.1);
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
    expect(isMatch("airplane", "airplane")).toBe(true);
    expect(isMatch("mushroom", "mushroom")).toBe(true);
  });

  it("returns false when object type does not match shadow type", () => {
    expect(isMatch("house", "tree")).toBe(false);
    expect(isMatch("tree", "car")).toBe(false);
    expect(isMatch("car", "boat")).toBe(false);
    expect(isMatch("boat", "ball")).toBe(false);
    expect(isMatch("ball", "umbrella")).toBe(false);
    expect(isMatch("umbrella", "house")).toBe(false);
    expect(isMatch("airplane", "mushroom")).toBe(false);
    expect(isMatch("mushroom", "airplane")).toBe(false);
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
