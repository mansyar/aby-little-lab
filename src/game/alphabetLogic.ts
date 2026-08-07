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
function isConfusableWith(letter: Letter, other: Letter): boolean {
  return CONFUSABLE_LETTER_FAMILIES.some(
    (family) => family.includes(letter) && family.includes(other),
  );
}

/** Builds one round for a target: 3 unique distractors, all positions shuffled. */
export function generateRound(target: Letter): AlphabetRound {
  const distractors = shuffle(
    ALPHABET.filter((letter) => letter !== target && !isConfusableWith(target, letter)),
  ).slice(0, 3);
  return { target, choices: shuffle([target, ...distractors]) };
}

/** Generates a playthrough of rounds (6 by default), each with a unique target letter. */
export function generatePlaythrough(roundCount = 6): AlphabetRound[] {
  return shuffle(ALPHABET)
    .slice(0, roundCount)
    .map((target) => generateRound(target));
}
