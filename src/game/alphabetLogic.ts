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

/** Builds one round for a target: 3 unique distractors, all positions shuffled. */
export function generateRound(target: Letter): AlphabetRound {
  const distractors = shuffle(ALPHABET.filter((letter) => letter !== target)).slice(0, 3);
  return { target, choices: shuffle([target, ...distractors]) };
}

/** Generates a playthrough of rounds (6 by default), each with a unique target letter. */
export function generatePlaythrough(roundCount = 6): AlphabetRound[] {
  return shuffle(ALPHABET)
    .slice(0, roundCount)
    .map((target) => generateRound(target));
}
