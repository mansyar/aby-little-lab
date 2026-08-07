import { ALL_SHAPES, type ShapeType, shuffle } from "./shapeSorterLogic";

/** The three repeating pattern types used in the Pattern Builder game. */
export type PatternType = "ABAB" | "AABB" | "ABB";

/** Where the missing piece sits in the row: the end (index 3) or a middle slot (1 or 2). */
export type GapPosition = "end" | "middle";

/** A single Pattern Builder round: a 4-shape pattern, one hidden slot, and 3 answer choices. */
export interface PatternRound {
  patternType: PatternType;
  /** Full 4-shape row. The hidden slot is `gapIndex`, not a null entry. */
  row: ShapeType[];
  /** Index of the missing piece (1–3; the first slot is never hidden). */
  gapIndex: number;
  /** Three unique choices; exactly one matches the shape at `gapIndex`. */
  choices: ShapeType[];
}

const PATTERN_TYPES: readonly PatternType[] = ["ABAB", "AABB", "ABB"];

/** Builds the full 4-shape row for a pattern type from two distinct elements. */
export function buildPatternRow(type: PatternType, a: ShapeType, b: ShapeType): ShapeType[] {
  switch (type) {
    case "ABAB":
      return [a, b, a, b];
    case "AABB":
      return [a, a, b, b];
    case "ABB":
      return [a, b, b, a];
  }
}

function pickFrom<T>(array: readonly T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/** Picks a gap index: the end (3) half the time, otherwise a middle slot (1 or 2). */
function pickGapIndex(): number {
  if (Math.random() < 0.5) {
    return 3;
  }
  return 1 + Math.floor(Math.random() * 2);
}

/** Generates a single valid Pattern Builder round. */
export function generateRound(): PatternRound {
  const patternType = pickFrom(PATTERN_TYPES);
  const [a, b] = shuffle(ALL_SHAPES).slice(0, 2);
  const row = buildPatternRow(patternType, a, b);
  const gapIndex = pickGapIndex();
  const correct = row[gapIndex];
  const distractors = shuffle(ALL_SHAPES.filter((shape) => shape !== correct)).slice(0, 2);
  const choices = shuffle([correct, ...distractors]);
  return { patternType, row, gapIndex, choices };
}

/** Generates a full playthrough of rounds (6 by default, matching the other games). */
export function generatePlaythrough(roundCount = 6): PatternRound[] {
  return Array.from({ length: roundCount }, () => generateRound());
}

/** Returns the shape that fills the round's gap. */
export function getCorrectShape(round: PatternRound): ShapeType {
  return round.row[round.gapIndex];
}
