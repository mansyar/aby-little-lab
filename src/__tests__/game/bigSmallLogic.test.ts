import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ALL_TOYS,
  BIG_SCALE,
  createBoxes,
  createToyInstances,
  generateRound,
  isMatch,
  isWin,
  SELECT_COUNT,
  SMALL_SCALE,
  selectToys,
  shuffle,
  type ToyType,
  WIN_TARGET,
} from "../../game/bigSmallLogic";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("selectToys", () => {
  it("selects exactly 3 toy types from the pool of 6", () => {
    const selected = selectToys();
    expect(selected).toHaveLength(SELECT_COUNT);
  });

  it("expanded pool includes the new rocket and drum toys (6 total)", () => {
    expect(ALL_TOYS).toHaveLength(6);
    expect(ALL_TOYS).toContain("rocket");
    expect(ALL_TOYS).toContain("drum");
  });

  it("all selected types are from the known pool", () => {
    const selected = selectToys();
    for (const toy of selected) {
      expect(ALL_TOYS).toContain(toy);
    }
  });

  it("no duplicate types in selection", () => {
    const selected = selectToys();
    expect(new Set(selected).size).toBe(SELECT_COUNT);
  });

  it("excludes exactly 3 toy types from the pool", () => {
    const selected = selectToys();
    const excluded = ALL_TOYS.filter((t) => !selected.includes(t));
    expect(excluded).toHaveLength(3);
  });
});

describe("createToyInstances", () => {
  it("creates 6 instances from 3 selected types (2 per type)", () => {
    const types: ToyType[] = ["teddy_bear", "car", "ball"];
    const instances = createToyInstances(types);
    expect(instances).toHaveLength(6);
  });

  it("each type gets one big (1.5x) and one small (0.7x) instance", () => {
    const types: ToyType[] = ["teddy_bear", "car", "ball"];
    const instances = createToyInstances(types);

    for (const type of types) {
      const typeInstances = instances.filter((i) => i.type === type);
      expect(typeInstances).toHaveLength(2);

      const bigInstance = typeInstances.find((i) => i.scaleCategory === "big");
      const smallInstance = typeInstances.find((i) => i.scaleCategory === "small");
      expect(bigInstance).toBeDefined();
      expect(smallInstance).toBeDefined();
      expect(bigInstance?.scale).toBe(BIG_SCALE);
      expect(smallInstance?.scale).toBe(SMALL_SCALE);
    }
  });

  it("scaleCategory is 'big' for 1.5x and 'small' for 0.7x", () => {
    const types: ToyType[] = ["block"];
    const instances = createToyInstances(types);

    const big = instances.find((i) => i.scale === BIG_SCALE);
    const small = instances.find((i) => i.scale === SMALL_SCALE);
    expect(big?.scaleCategory).toBe("big");
    expect(small?.scaleCategory).toBe("small");
  });
});

describe("generateRound", () => {
  it("generates 6 toy instances and 2 boxes", () => {
    const round = generateRound();
    expect(round.toys).toHaveLength(6);
    expect(round.boxes).toHaveLength(2);
  });

  it("boxes contain one big and one small", () => {
    const round = generateRound();
    const categories = round.boxes.map((b) => b.scaleCategory);
    expect(categories).toContain("big");
    expect(categories).toContain("small");
  });

  it("box scales match their categories (big=1.5x, small=0.7x)", () => {
    const round = generateRound();
    const bigBox = round.boxes.find((b) => b.scaleCategory === "big");
    const smallBox = round.boxes.find((b) => b.scaleCategory === "small");
    expect(bigBox?.scale).toBe(BIG_SCALE);
    expect(smallBox?.scale).toBe(SMALL_SCALE);
  });

  it("toys are shuffled independently per playthrough (replay variety)", () => {
    const spy = vi.spyOn(Math, "random");
    // selectToys shuffle (6 elements, 5 random calls) + toy instances shuffle (6 elements, 5 random calls) = 10 total
    // First round: all 0.5
    for (let i = 0; i < 10; i++) spy.mockReturnValueOnce(0.5);
    const round1 = generateRound();

    // Second round: all 0.1
    for (let i = 0; i < 10; i++) spy.mockReturnValueOnce(0.1);
    const round2 = generateRound();

    expect(round1.toys).not.toEqual(round2.toys);
  });
});

describe("createBoxes", () => {
  it("creates 2 boxes (big and small)", () => {
    const boxes = createBoxes();
    expect(boxes).toHaveLength(2);
  });

  it("big box has scale 1.5x and small box has scale 0.7x", () => {
    const boxes = createBoxes();
    const big = boxes.find((b) => b.scaleCategory === "big");
    const small = boxes.find((b) => b.scaleCategory === "small");
    expect(big?.scale).toBe(BIG_SCALE);
    expect(small?.scale).toBe(SMALL_SCALE);
  });

  it("shuffles which side the big box lands on across plays", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 50; i++) {
      seen.add(createBoxes()[0].scaleCategory);
    }
    expect(seen).toEqual(new Set(["big", "small"]));
  });

  it("places the small box first under a low random value", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.0);
    const boxes = createBoxes();
    expect(boxes[0].scaleCategory).toBe("small");
  });
});

describe("shuffle", () => {
  it("returns an array with the same elements", () => {
    const input: ToyType[] = ["teddy_bear", "car", "ball"];
    const result = shuffle(input);
    expect(result.sort()).toEqual(input.sort());
  });

  it("returns a new array (does not mutate input)", () => {
    const input: ToyType[] = ["teddy_bear", "car", "ball"];
    const inputCopy = [...input];
    shuffle(input);
    expect(input).toEqual(inputCopy);
  });

  it("produces independent results when called twice with different random values", () => {
    const input: ToyType[] = ["teddy_bear", "car", "ball"];

    const spy = vi.spyOn(Math, "random");
    spy.mockReturnValueOnce(0.5).mockReturnValueOnce(0.2);
    const result1 = shuffle(input);

    spy.mockReturnValueOnce(0.8).mockReturnValueOnce(0.1);
    const result2 = shuffle(input);

    expect(result1).not.toEqual(result2);
  });
});

describe("isMatch", () => {
  it("returns true when toy scaleCategory matches box scaleCategory", () => {
    expect(isMatch("big", "big")).toBe(true);
    expect(isMatch("small", "small")).toBe(true);
  });

  it("returns false when scale categories differ", () => {
    expect(isMatch("big", "small")).toBe(false);
    expect(isMatch("small", "big")).toBe(false);
  });
});

describe("isWin", () => {
  it("returns true when sorted count reaches 6", () => {
    expect(isWin(WIN_TARGET)).toBe(true);
  });

  it("returns false when sorted count is less than 6", () => {
    expect(isWin(0)).toBe(false);
    expect(isWin(1)).toBe(false);
    expect(isWin(2)).toBe(false);
    expect(isWin(3)).toBe(false);
    expect(isWin(4)).toBe(false);
    expect(isWin(5)).toBe(false);
  });
});
