import { afterEach, describe, expect, it, vi } from "vitest";

import { ALL_SHAPES, type ShapeType } from "../../game/shapeSorterLogic";
import {
  buildPatternRow,
  generatePlaythrough,
  generateRound,
  getCorrectShape,
  type PatternRound,
  type PatternType,
} from "../../game/patternBuilderLogic";

afterEach(() => {
  vi.restoreAllMocks();
});

/** Number of rounds sampled to exercise randomized behavior without flaking. */
const VARIETY_SAMPLES = 200;

function pairForType(round: PatternRound): [ShapeType, ShapeType] {
  const a = round.row[0];
  let b: ShapeType;
  switch (round.patternType) {
    case "ABAB":
    case "ABB":
      b = round.row[1];
      break;
    case "AABB":
      b = round.row[2];
      break;
  }
  return [a, b];
}

function expectValidRound(round: PatternRound): void {
  expect(round.row).toHaveLength(4);
  expect(round.choices).toHaveLength(3);
  expect(round.gapIndex).toBeGreaterThanOrEqual(1);
  expect(round.gapIndex).toBeLessThanOrEqual(3);

  const [a, b] = pairForType(round);
  expect(a).not.toBe(b);
  expect(round.row).toEqual(buildPatternRow(round.patternType, a, b));

  const uniqueChoices = new Set(round.choices);
  expect(uniqueChoices.size).toBe(3);
  for (const choice of round.choices) {
    expect(ALL_SHAPES).toContain(choice);
  }
  expect(round.choices).toContain(getCorrectShape(round));
}

describe("buildPatternRow", () => {
  it("builds ABAB as [a, b, a, b]", () => {
    expect(buildPatternRow("ABAB", "circle", "square")).toEqual([
      "circle",
      "square",
      "circle",
      "square",
    ]);
  });

  it("builds AABB as [a, a, b, b]", () => {
    expect(buildPatternRow("AABB", "circle", "square")).toEqual([
      "circle",
      "circle",
      "square",
      "square",
    ]);
  });

  it("builds ABB as [a, b, b, a]", () => {
    expect(buildPatternRow("ABB", "circle", "square")).toEqual([
      "circle",
      "square",
      "square",
      "circle",
    ]);
  });
});

describe("generateRound", () => {
  it("produces structurally valid rounds across many samples", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      expectValidRound(generateRound());
    }
  });

  it("uses only known pattern types", () => {
    const seen = new Set<PatternType>();
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      seen.add(generateRound().patternType);
    }
    for (const type of seen) {
      expect(["ABAB", "AABB", "ABB"]).toContain(type);
    }
  });

  it("mixes all three pattern types across samples", () => {
    const seen = new Set<PatternType>();
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      seen.add(generateRound().patternType);
    }
    expect(seen).toEqual(new Set(["ABAB", "AABB", "ABB"]));
  });

  it("covers end and middle gap positions across samples", () => {
    const seen = new Set<number>();
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      seen.add(generateRound().gapIndex);
    }
    expect(seen).toEqual(new Set([1, 2, 3]));
  });

  it("never hides the first slot (gapIndex 0)", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      expect(generateRound().gapIndex).not.toBe(0);
    }
  });

  it("chooses a deterministic round under a fixed random sequence", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const first = generateRound();
    vi.restoreAllMocks();
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const second = generateRound();
    expect(second).toEqual(first);
    expectValidRound(first);
  });
});

describe("getCorrectShape", () => {
  it("returns the shape at the gap position", () => {
    const round = generateRound();
    expect(getCorrectShape(round)).toBe(round.row[round.gapIndex]);
  });
});

describe("generatePlaythrough", () => {
  it("returns the requested number of valid rounds", () => {
    const playthrough = generatePlaythrough(5);
    expect(playthrough).toHaveLength(5);
    for (const round of playthrough) {
      expectValidRound(round);
    }
  });

  it("defaults to 5 rounds", () => {
    expect(generatePlaythrough()).toHaveLength(5);
  });

  it("produces different rounds under different random sequences", () => {
    vi.spyOn(Math, "random").mockReturnValueOnce(0.1).mockReturnValueOnce(0.2);
    const first = generateRound();
    vi.restoreAllMocks();
    vi.spyOn(Math, "random").mockReturnValueOnce(0.8).mockReturnValueOnce(0.9);
    const second = generateRound();
    expect(first).not.toEqual(second);
  });
});
