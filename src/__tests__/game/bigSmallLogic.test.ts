import { describe, expect, it } from "vitest";

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
  scaleFactorsFor,
  selectToys,
  type ToyType,
  WIN_TARGET,
} from "../../game/bigSmallLogic";
import { shuffle } from "../../game/random";

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
    // selectToys shuffle (6 elements, 5 draws) + toy instances shuffle
    // (6 elements, 5 draws) = 10 draws per round, scripted through the seam:
    // first round all 0.5, second round all 0.1.
    const allOf = (value: number) => () => value;
    const round1 = generateRound(undefined, allOf(0.5));
    const round2 = generateRound(undefined, allOf(0.1));

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
    const boxes = createBoxes(undefined, () => 0.0);
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

/*
 * Band-shift layout twins. The scene fixes its geometry (1024x768 canvas, toy
 * row at y=580 over 7 slots, box row at y=200 over 3 slots) and multiplies the
 * band's factors by these bases; the mirrored values here let the logic tests
 * prove every band keeps sorted objects inside the canvas and above the 64px
 * touch floor without booting Phaser. The 96px ideal target cannot hold for
 * small items at any factor < 1 (classic 0.7x is already 67.2px), so the floor
 * is the binding bound; widening stops where the canvas does.
 */
const CANVAS_WIDTH = 1024;
const CANVAS_HEIGHT = 768;
const TOY_DISPLAY_BASE = 96;
const BOX_DISPLAY_BASE = 128;
const TOY_ROW_Y = 580;
const BOX_ROW_Y = 200;
const TOUCH_FLOOR = 64;

/** Mirrors the scene's spacing math: n items centered at spacing * (i + 1). */
function rowCenters(count: number, canvasWidth: number): number[] {
  const spacing = canvasWidth / (count + 1);
  const centers: number[] = [];
  for (let i = 1; i <= count; i++) {
    centers.push(spacing * i);
  }
  return centers;
}

/** Every draggable item's display box must stay above the 64px touch floor. */
function assertAboveTouchFloor(displaySize: number): void {
  const message = `display size ${displaySize} must stay above the ${TOUCH_FLOOR}px floor`;
  expect(displaySize, message).toBeGreaterThanOrEqual(TOUCH_FLOOR);
}

/** A display box must fit inside the canvas at every position its row allows. */
function assertStaysInsideCanvas(displaySize: number, centers: number[], centerY: number): void {
  for (const x of centers) {
    expect(x - displaySize / 2).toBeGreaterThanOrEqual(0);
    expect(x + displaySize / 2).toBeLessThanOrEqual(CANVAS_WIDTH);
  }
  expect(centerY - displaySize / 2).toBeGreaterThanOrEqual(0);
  expect(centerY + displaySize / 2).toBeLessThanOrEqual(CANVAS_HEIGHT);
}

describe("scaleFactorsFor", () => {
  it("classic band keeps the shipped 1.5/0.7 factors verbatim", () => {
    expect(scaleFactorsFor(0)).toEqual({ big: BIG_SCALE, small: SMALL_SCALE });
  });

  it("easy band widens the contrast to 1.6/0.68", () => {
    expect(scaleFactorsFor(-1)).toEqual({ big: 1.6, small: 0.68 });
  });

  it("hard band narrows the contrast to 1.35/0.8", () => {
    expect(scaleFactorsFor(1)).toEqual({ big: 1.35, small: 0.8 });
  });

  it("the three bands sit on distinct contrast ratios in the right order", () => {
    const contrast = (shift: -1 | 0 | 1) => {
      const factors = scaleFactorsFor(shift);
      return factors.big / factors.small;
    };
    const easy = contrast(-1);
    const classic = contrast(0);
    const hard = contrast(1);
    expect(easy).toBeGreaterThan(classic);
    expect(classic).toBeGreaterThan(hard);
    expect(hard).toBeGreaterThan(1);
    expect(new Set([easy, classic, hard]).size).toBe(3);
  });

  it("defaults to the classic factors", () => {
    expect(scaleFactorsFor()).toEqual(scaleFactorsFor(0));
  });
});

describe("scaleFactorsFor layout bounds", () => {
  it("scales keep toys and boxes inside the canvas and above the touch floor at every band", () => {
    for (const shift of [-1, 0, 1] as const) {
      const factors = scaleFactorsFor(shift);
      const round = generateRound(factors);

      for (const toy of round.toys) {
        const displaySize = TOY_DISPLAY_BASE * toy.scale;
        assertStaysInsideCanvas(displaySize, rowCenters(6, CANVAS_WIDTH), TOY_ROW_Y);
        assertAboveTouchFloor(displaySize);
      }
      for (const box of round.boxes) {
        const displaySize = BOX_DISPLAY_BASE * box.scale;
        assertStaysInsideCanvas(displaySize, rowCenters(2, CANVAS_WIDTH), BOX_ROW_Y);
        assertAboveTouchFloor(displaySize);
      }
    }
  });
});

describe("generateRound with band factors", () => {
  it("stamps every toy and box scale from the band's factors", () => {
    for (const shift of [-1, 0, 1] as const) {
      const factors = scaleFactorsFor(shift);
      const round = generateRound(factors);

      expect(round.toys).toHaveLength(6);
      for (const toy of round.toys) {
        expect(toy.scale).toBe(toy.scaleCategory === "big" ? factors.big : factors.small);
      }
      expect(round.boxes).toHaveLength(2);
      for (const box of round.boxes) {
        expect(box.scale).toBe(box.scaleCategory === "big" ? factors.big : factors.small);
      }
      const categories = round.boxes.map((b) => b.scaleCategory).sort();
      expect(categories).toEqual(["big", "small"]);
    }
  });

  it("shifted factors draw observably different scales under one seed", () => {
    // A constant 0.5 draw passed through the injected seam at every band.
    const steady = () => 0.5;
    const classic = generateRound(undefined, steady);
    const easy = generateRound(scaleFactorsFor(-1), steady);
    const hard = generateRound(scaleFactorsFor(1), steady);
    expect(easy.toys.map((t) => t.scale)).not.toEqual(classic.toys.map((t) => t.scale));
    expect(easy.boxes.map((b) => b.scale)).not.toEqual(classic.boxes.map((b) => b.scale));
    expect(hard.toys.map((t) => t.scale)).not.toEqual(classic.toys.map((t) => t.scale));
    expect(hard.boxes.map((b) => b.scale)).not.toEqual(classic.boxes.map((b) => b.scale));
  });

  it("classic draws are identical with and without the factors argument", () => {
    const steady = () => 0.5;
    expect(generateRound(scaleFactorsFor(0), steady)).toEqual(generateRound(undefined, steady));
  });
});

describe("createToyInstances with band factors", () => {
  it("stamps the band's big/small factors onto each scale category", () => {
    const factors = scaleFactorsFor(-1);
    const instances = createToyInstances(["ball"], factors);
    expect(instances).toEqual([
      { type: "ball", scaleCategory: "big", scale: factors.big },
      { type: "ball", scaleCategory: "small", scale: factors.small },
    ]);
  });

  it("keeps the shipped scales when no factors argument is passed", () => {
    expect(createToyInstances(["ball"])).toEqual(createToyInstances(["ball"], scaleFactorsFor(0)));
  });
});

describe("createBoxes with band factors", () => {
  it("keeps one big and one small box at every band", () => {
    for (const shift of [-1, 0, 1] as const) {
      const boxes = createBoxes(scaleFactorsFor(shift));
      expect(boxes).toHaveLength(2);
      const categories = boxes.map((b) => b.scaleCategory).sort();
      expect(categories).toEqual(["big", "small"]);
    }
  });

  it("keeps the shipped scales when no factors argument is passed", () => {
    const steady = () => 0.5;
    expect(createBoxes(scaleFactorsFor(0), steady)).toEqual(createBoxes(undefined, steady));
  });
});
