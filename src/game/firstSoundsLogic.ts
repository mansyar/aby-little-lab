import { isConfusableWith, type Letter } from "./alphabetLogic";
import { shuffle } from "./shapeSorterLogic";
import { getWord } from "./wordLogic";

/** A single First Sounds word: the printed word and its picture texture. */
export interface FirstSoundWord {
  /** The word in uppercase, e.g. "CAT". */
  word: string;
  /** PreloadScene texture key of the existing prompt picture. */
  promptTexture: string;
}

/**
 * The 12 curated phonics words, drawn from the existing WORD_POOL. Every
 * word's initial letter belongs to PHONICS_LETTERS; letters repeat (S/B/F)
 * only when their sounds are unambiguous for a 3–5yo.
 */
const PHONICS_WORD_LIST: readonly string[] = [
  "CAT",
  "DOG",
  "PIG",
  "SUN",
  "HAT",
  "BUG",
  "OWL",
  "TREE",
  "STAR",
  "BALL",
  "FROG",
  "FISH",
];

/**
 * The phonics pool: 12 words with 9 distinct initial letters. Textures are
 * looked up from WORD_POOL so the keys can never drift from the word data.
 */
export const PHONICS_POOL: readonly FirstSoundWord[] = PHONICS_WORD_LIST.map((word) => {
  const entry = getWord(word);
  if (!entry) {
    throw new Error(`Phonics word missing from WORD_POOL: ${word}`);
  }
  return { word: entry.word, promptTexture: entry.promptTexture };
});

/** The 9 distinct initial letters used by the phonics pool. */
export const PHONICS_LETTERS: readonly Letter[] = [
  ...new Set(PHONICS_POOL.map((entry) => firstLetterOf(entry.word))),
];

/** Initial sounds that are hard to tell apart for a 3–5yo. */
const SOUND_CONFUSABLE_PAIRS: ReadonlyArray<readonly [Letter, Letter]> = [
  ["B", "P"],
  ["D", "T"],
];

/** True when `letter` and `other` belong to a sound-confusable pair. */
function isSoundConfusableWith(letter: Letter, other: Letter): boolean {
  return SOUND_CONFUSABLE_PAIRS.some((pair) => pair.includes(letter) && pair.includes(other));
}

/** Returns the uppercase initial letter of a word, e.g. "CAT" → "C". */
export function firstLetterOf(word: string): Letter {
  return word[0] as Letter;
}

/** A single First Sounds round: a spoken word and 4 unique letter choices. */
export interface PhonicsRound {
  /** The letter the child must tap (the word's first sound). */
  target: Letter;
  /** The word the child hears and sees as a picture. */
  word: string;
  /** PreloadScene texture key of the word's prompt picture. */
  promptTexture: string;
  /** Four unique letter cards; exactly one equals `target`. */
  choices: Letter[];
}

/**
 * Builds one First Sounds round: 3 distractors from the phonics letters that
 * are neither sound-confusable (B/P, D/T) nor visually confusable (alphabet
 * families) with the target. All positions are shuffled.
 */
export function generatePhonicsRound(target: Letter): PhonicsRound {
  const words = PHONICS_POOL.filter((entry) => firstLetterOf(entry.word) === target);
  const word = shuffle(words)[0];
  const distractors = shuffle(
    PHONICS_LETTERS.filter(
      (letter) =>
        letter !== target &&
        !isSoundConfusableWith(target, letter) &&
        !isConfusableWith(target, letter),
    ),
  ).slice(0, 3);
  return {
    target,
    word: word.word,
    promptTexture: word.promptTexture,
    choices: shuffle([target, ...distractors]),
  };
}

/**
 * Generates a First Sounds playthrough of rounds (6 by default), each with a
 * unique target letter from the 9 phonics letters, shuffled, no repeats.
 */
export function generatePhonicsPlaythrough(roundCount = 6): PhonicsRound[] {
  return shuffle(PHONICS_LETTERS)
    .slice(0, roundCount)
    .map((target) => generatePhonicsRound(target));
}
