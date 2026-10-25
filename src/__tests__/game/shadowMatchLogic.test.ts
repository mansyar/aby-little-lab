import { describe, expect, it } from "vitest";

import { shuffle } from "../../game/random";
import {
  ALL_OBJECTS,
  CONFUSABLE_CLUSTERS,
  generateRound,
  isMatch,
  isWin,
  type ObjectType,
  ROUND_SIZE,
  WIN_TARGET,
} from "../../game/shadowMatchLogic";
import { mulberry32 } from "../helpers/randomHelper";

/** Draws one round with a seeded rng passed through the injected seam. */
function drawWithSeed(seed: number, shift: -1 | 0 | 1) {
  return generateRound(shift, mulberry32(seed));
}

describe("generateRound", () => {
  it("generates 6 objects with correct object IDs (house, tree, car, boat, ball, umbrella)", () => {
    const round = generateRound();
    expect(round.objects).toHaveLength(6);
    for (const obj of round.objects) {
      expect(ALL_OBJECTS).toContain(obj);
    }
    expect(new Set(round.objects).size).toBe(6);
  });

  it("expanded pool includes the four new confusable objects (12 total)", () => {
    expect(ALL_OBJECTS).toHaveLength(12);
    expect(ALL_OBJECTS).toContain("airplane");
    expect(ALL_OBJECTS).toContain("mushroom");
    expect(ALL_OBJECTS).toContain("sock");
    expect(ALL_OBJECTS).toContain("boot");
    expect(ALL_OBJECTS).toContain("kite");
    expect(ALL_OBJECTS).toContain("bell");
  });

  it("splits the 12 objects into 6 confusable clusters of 2", () => {
    expect(CONFUSABLE_CLUSTERS).toHaveLength(6);
    const members = CONFUSABLE_CLUSTERS.flat();
    expect(members).toHaveLength(12);
    expect(new Set(members).size).toBe(12);
    for (const object of ALL_OBJECTS) {
      expect(members).toContain(object);
    }
    for (const cluster of CONFUSABLE_CLUSTERS) {
      expect(cluster).toHaveLength(2);
    }
  });

  it("draws exactly one object per cluster in the easy band (no confusable pair)", () => {
    const round = generateRound(-1);
    expect(round.objects).toHaveLength(6);
    const clustersOf = (object: ObjectType) =>
      CONFUSABLE_CLUSTERS.filter((cluster) => cluster.includes(object));
    for (const object of round.objects) {
      expect(clustersOf(object)).toHaveLength(1);
    }
    const clusterIndexes = new Set(
      round.objects.map((object) => CONFUSABLE_CLUSTERS.findIndex((c) => c.includes(object))),
    );
    expect(clusterIndexes.size).toBe(6);
    expect(new Set(round.shadows)).toEqual(new Set(round.objects));
  });

  it("draws three full clusters in the hard band (confusable pairs together)", () => {
    const round = generateRound(1);
    expect(round.objects).toHaveLength(6);
    const drawnClusters = CONFUSABLE_CLUSTERS.filter((cluster) =>
      round.objects.includes(cluster[0]),
    );
    expect(drawnClusters).toHaveLength(3);
    for (const cluster of drawnClusters) {
      expect(round.objects).toContain(cluster[1]);
    }
    expect(new Set(round.objects).size).toBe(6);
    expect(new Set(round.shadows)).toEqual(new Set(round.objects));
  });

  it("is deterministic per seed in every band (seeded rng injection)", () => {
    for (const shift of [-1, 0, 1] as const) {
      const first = drawWithSeed(42, shift);
      const second = drawWithSeed(42, shift);
      expect(first).toEqual(second);
    }
  });

  it("keeps the classic band an any-6-of-12 draw over the full pool", () => {
    const seen = new Set<ObjectType>();
    for (let seed = 1; seed <= 40; seed++) {
      const round = drawWithSeed(seed, 0);
      for (const object of round.objects) seen.add(object);
      expect(round.objects).toHaveLength(6);
    }
    // Over 40 seeded draws the classic band must reach well beyond any
    // fixed six-object subset of the 12-object pool.
    expect(seen.size).toBeGreaterThanOrEqual(10);
  });

  it(`selects exactly ${ROUND_SIZE} of the ${ALL_OBJECTS.length} objects per round (${ALL_OBJECTS.length - ROUND_SIZE} excluded)`, () => {
    const round = generateRound();
    const excluded = ALL_OBJECTS.filter((o) => !round.objects.includes(o));
    expect(excluded).toHaveLength(ALL_OBJECTS.length - ROUND_SIZE);
  });

  it(`selects exactly ${ROUND_SIZE} of the ${ALL_OBJECTS.length} shadows per round (${ALL_OBJECTS.length - ROUND_SIZE} excluded)`, () => {
    const round = generateRound();
    const excluded = ALL_OBJECTS.filter((o) => !round.shadows.includes(o));
    expect(excluded).toHaveLength(ALL_OBJECTS.length - ROUND_SIZE);
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
    // Draw script passed through the injected seam: the selection shuffle and
    // the objects shuffle (16 draws) take 0.5, the shadows shuffle (5 draws)
    // takes 0.1, so the two orderings differ by construction.
    let draw = 0;
    const rng = () => (draw++ < 16 ? 0.5 : 0.1);
    const round = generateRound(0, rng);
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
