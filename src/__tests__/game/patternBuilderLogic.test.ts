import { describe, expect, it } from "vitest";
import {
  buildPatternRow,
  generatePlaythrough,
  generateRound,
  getCorrectShape,
  type PatternRound,
  type PatternType,
} from "../../game/patternBuilderLogic";
import { ALL_SHAPES, type ShapeType } from "../../game/shapeSorterLogic";

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

  it("never offers a confusable same-family distractor (hexagon with octagon, circle with ring)", () => {
    const FAMILIES: ReadonlyArray<readonly string[]> = [
      ["pentagon", "hexagon", "octagon"],
      ["circle", "oval", "ring", "semicircle"],
      ["square", "rectangle"],
    ];
    for (let sample = 0; sample < VARIETY_SAMPLES; sample++) {
      const round = generateRound();
      const correct = getCorrectShape(round);
      const distractors = round.choices.filter((choice) => choice !== correct);
      for (const family of FAMILIES) {
        if (!family.includes(correct)) continue;
        for (const familyShape of family) {
          if (familyShape !== correct) {
            expect(distractors).not.toContain(familyShape);
          }
        }
      }
    }
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
    const steady = () => 0.5;
    const first = generateRound(3, steady);
    const second = generateRound(3, steady);
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

  it("defaults to 6 rounds, matching the other mini-games", () => {
    expect(generatePlaythrough()).toHaveLength(6);
  });

  it("produces different rounds under different random sequences", () => {
    const first = generateRound(3, () => 0.1);
    const second = generateRound(3, () => 0.8);
    expect(first).not.toEqual(second);
  });

  it("mixes pattern types and gap positions across many playthroughs", () => {
    const patternTypes = new Set<PatternType>();
    const gapIndexes = new Set<number>();
    for (let i = 0; i < 30; i++) {
      for (const round of generatePlaythrough()) {
        patternTypes.add(round.patternType);
        gapIndexes.add(round.gapIndex);
      }
    }
    expect(patternTypes).toEqual(new Set(["ABAB", "AABB", "ABB"]));
    expect(gapIndexes).toEqual(new Set([1, 2, 3]));
  });

  it("keeps difficulty fixed: every round has one 4-slot pattern and 3 choices", () => {
    for (const round of generatePlaythrough()) {
      expect(round.row).toHaveLength(4);
      expect(round.choices).toHaveLength(3);
    }
  });

  it("produces different playthroughs under different random sequences", () => {
    const first = generatePlaythrough(5, 0, () => 0.05);
    const second = generatePlaythrough(5, 0, () => 0.95);
    expect(first).not.toEqual(second);
  });
});

describe("generatePlaythrough (adaptive shift)", () => {
  it("serves the classic easy-first ladder at shift 0", () => {
    const playthrough = generatePlaythrough(6, 0);
    expect(playthrough).toHaveLength(6);
    for (const round of playthrough) {
      expectValidRound(round);
    }
    // Ladder [1,1,2,2,3,3]: rounds 1-2 are the easiest (ABAB, end gap only).
    expect(playthrough[0].patternType).toBe("ABAB");
    expect(playthrough[0].gapIndex).toBe(3);
    expect(playthrough[1].patternType).toBe("ABAB");
    expect(playthrough[1].gapIndex).toBe(3);
    // Rounds 3-4 serve any pattern type with an end gap.
    expect(playthrough[2].gapIndex).toBe(3);
    expect(playthrough[3].gapIndex).toBe(3);
    // Rounds 5-6 serve any pattern type with any gap (today's draw).
  });

  it("serves end-gap rounds only while struggling (shift -1), easiest rounds first", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const playthrough = generatePlaythrough(6, -1);
      // Ladder [1,1,1,1,2,2]: every round hides the end slot.
      for (const round of playthrough) {
        expect(round.gapIndex).toBe(3);
        expectValidRound(round);
      }
      // Rounds 1-4 are band 1: ABAB only.
      for (const round of playthrough.slice(0, 4)) {
        expect(round.patternType).toBe("ABAB");
      }
    }
  });

  it("keeps today's uniform draw while thriving (shift +1)", () => {
    const patternTypes = new Set<PatternType>();
    const gapIndexes = new Set<number>();
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      // Ladder [2,2,3,3,3,3] clamps band 2 to 3: every round uses today's draw.
      const playthrough = generatePlaythrough(6, 1);
      for (const round of playthrough) {
        expectValidRound(round);
        patternTypes.add(round.patternType);
        gapIndexes.add(round.gapIndex);
      }
    }
    expect(patternTypes).toEqual(new Set(["ABAB", "AABB", "ABB"]));
    expect(gapIndexes).toEqual(new Set([1, 2, 3]));
  });

  it("covers all pattern types and gap positions across many classic playthroughs", () => {
    const patternTypes = new Set<PatternType>();
    const gapIndexes = new Set<number>();
    for (let i = 0; i < 30; i++) {
      for (const round of generatePlaythrough(6, 0)) {
        patternTypes.add(round.patternType);
        gapIndexes.add(round.gapIndex);
      }
    }
    expect(patternTypes).toEqual(new Set(["ABAB", "AABB", "ABB"]));
    expect(gapIndexes).toEqual(new Set([1, 2, 3]));
  });

  it("produces different playthroughs per shift under the same random sequence", () => {
    const steady = () => 0.42;
    const struggling = generatePlaythrough(6, -1, steady);
    const thriving = generatePlaythrough(6, 1, steady);
    expect(struggling).not.toEqual(thriving);
  });
});
