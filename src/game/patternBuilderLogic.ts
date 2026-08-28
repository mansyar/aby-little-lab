import { type BandId, type BandShift, BASE_LADDER, shiftLadder } from "./adaptiveLogic";
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

/**
 * Shape families that look alike to a toddler (e.g. hexagon vs octagon, or
 * circle vs ring). A round's choices never include a shape from the correct
 * shape's own family, so the answer stays distinguishable.
 */
const CONFUSABLE_SHAPE_FAMILIES: ReadonlyArray<readonly ShapeType[]> = [
  ["pentagon", "hexagon", "octagon"],
  ["circle", "oval", "ring", "semicircle"],
  ["square", "rectangle"],
];

/** True when `shape` and `other` belong to the same confusable family. */
function isConfusableWith(shape: ShapeType, other: ShapeType): boolean {
  return CONFUSABLE_SHAPE_FAMILIES.some(
    (family) => family.includes(shape) && family.includes(other),
  );
}

/** Picks a gap index per band: bands 1–2 always hide the end (3); band 3 ends 50% / middle 50%. */
function pickGapIndex(band: BandId): number {
  if (band < 3) {
    return 3;
  }
  if (Math.random() < 0.5) {
    return 3;
  }
  return 1 + Math.floor(Math.random() * 2);
}

/**
 * Generates a single valid Pattern Builder round at the given band. Band 1
 * serves only the simplest question (an `ABAB` row with the end slot hidden);
 * band 2 widens to every pattern type while keeping the end gap; band 3
 * matches today's draw — any type, end or middle gap. The confusable-family
 * distractor guard holds in every band: it is an ambiguity guard, not a
 * difficulty knob.
 */
export function generateRound(band: BandId = 3): PatternRound {
  const patternType = band === 1 ? "ABAB" : pickFrom(PATTERN_TYPES);
  const [a, b] = shuffle(ALL_SHAPES).slice(0, 2);
  const row = buildPatternRow(patternType, a, b);
  const gapIndex = pickGapIndex(band);
  const correct = row[gapIndex];
  const distractors = shuffle(
    ALL_SHAPES.filter((shape) => shape !== correct && !isConfusableWith(correct, shape)),
  ).slice(0, 2);
  const choices = shuffle([correct, ...distractors]);
  return { patternType, row, gapIndex, choices };
}

/**
 * Generates a full playthrough of rounds (6 by default, matching the other
 * games), walking the classic easy-first ladder `BASE_LADDER` shifted by the
 * profile's adaptive band shift: −1 eases every round one band down (clamped),
 * +1 steps one band up. Shift 0 serves the documented easy-first classic
 * ladder `[1,1,2,2,3,3]` — two band-1 rounds (ABAB, end gap), two band-2
 * rounds (any type, end gap), then two band-3 rounds (any type, any gap) —
 * matching the shape of every other band-based mini-game. The shift is chosen
 * by the caller once per playthrough and never changes mid-game.
 */
export function generatePlaythrough(roundCount = 6, shift: BandShift = 0): PatternRound[] {
  const ladder = shiftLadder(BASE_LADDER, shift);
  return Array.from({ length: roundCount }, (_, round) => generateRound(ladder[round] ?? 3));
}

/** Returns the shape that fills the round's gap. */
export function getCorrectShape(round: PatternRound): ShapeType {
  return round.row[round.gapIndex];
}
