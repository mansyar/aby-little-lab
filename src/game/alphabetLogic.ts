import type { BandId, BandShift } from "./adaptiveLogic";
import { shiftLadder } from "./adaptiveLogic";
import { shuffle } from "./shapeSorterLogic";

/** The 26 uppercase letters used in the Find the Letter game. */
export type Letter =
  | "A"
  | "B"
  | "C"
  | "D"
  | "E"
  | "F"
  | "G"
  | "H"
  | "I"
  | "J"
  | "K"
  | "L"
  | "M"
  | "N"
  | "O"
  | "P"
  | "Q"
  | "R"
  | "S"
  | "T"
  | "U"
  | "V"
  | "W"
  | "X"
  | "Y"
  | "Z";

/** All 26 uppercase letters, in canonical order. */
export const ALPHABET: readonly Letter[] = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];

/** A single Find the Letter round: one target letter and 4 unique choices. */
export interface AlphabetRound {
  /** The letter the child must find. */
  target: Letter;
  /** Four unique letter cards; exactly one equals `target`. */
  choices: Letter[];
}

/**
 * Letter families that look alike to a toddler (e.g. C with G/O/Q). A target
 * never gets a distractor from its own family, so choices stay distinguishable.
 */
const CONFUSABLE_LETTER_FAMILIES: ReadonlyArray<readonly Letter[]> = [
  ["C", "G", "O", "Q"],
  ["I", "L", "T"],
  ["M", "W"],
];

/** True when `letter` and `other` belong to the same confusable family. */
export function isConfusableWith(letter: Letter, other: Letter): boolean {
  return CONFUSABLE_LETTER_FAMILIES.some(
    (family) => family.includes(letter) && family.includes(other),
  );
}

/** Classic ladder: every round sits in the classic band; a shift moves all rounds. */
const LETTER_BASE_LADDER: readonly BandId[] = [2, 2, 2, 2, 2, 2];

/** Easy-band target pool: the first ten letters, matching the taught sequence. */
const EASY_LETTERS: readonly Letter[] = ALPHABET.slice(0, 10);

/**
 * Builds one round for a target: 3 unique distractors, all positions shuffled.
 * Distractors never share the target's confusable family — unless the hard
 * band explicitly invites that discrimination skill.
 */
export function generateRound(target: Letter, band: BandId = 2): AlphabetRound {
  const allowSameFamily = band === 3;
  const distractors = shuffle(
    ALPHABET.filter(
      (letter) => letter !== target && (allowSameFamily || !isConfusableWith(target, letter)),
    ),
  ).slice(0, 3);
  return { target, choices: shuffle([target, ...distractors]) };
}

/**
 * Generates a playthrough of rounds (6 by default), each with a unique target
 * letter. The whole run shares one band: classic draws from the full alphabet,
 * easy (shift -1) draws only from A-J, hard (shift +1) keeps the full alphabet
 * and allows same-family distractors. The default shift 0 reproduces the
 * classic playthrough exactly.
 */
export function generatePlaythrough(roundCount = 6, shift: BandShift = 0): AlphabetRound[] {
  const band = shiftLadder(LETTER_BASE_LADDER, shift)[0] ?? 2;
  const pool = band === 1 ? EASY_LETTERS : ALPHABET;
  return shuffle(pool)
    .slice(0, roundCount)
    .map((target) => generateRound(target, band));
}
