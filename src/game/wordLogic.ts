import { ALPHABET } from "./alphabetLogic";
import { shuffle } from "./shapeSorterLogic";

/** A single first word: the printed word, its length, and its picture texture. */
export interface FirstWord {
  /** The word in uppercase, e.g. "CAT". */
  word: string;
  /** Number of letters in the word (3 or 4). */
  letters: number;
  /** PreloadScene texture key of the existing prompt picture. */
  promptTexture: string;
  /** Letter-count tier: 3-letter words before 4-letter words. */
  tier: 3 | 4;
}

/**
 * The 18 first words. Prompt textures are PreloadScene texture keys:
 * most reuse existing art; `sm_sun`/`sm_hat`/`sm_bug`/`sm_duck` are new
 * SVGs registered alongside this pool.
 */
export const WORD_POOL: readonly FirstWord[] = [
  { word: "CAT", letters: 3, promptTexture: "animal_cat", tier: 3 },
  { word: "DOG", letters: 3, promptTexture: "animal_dog", tier: 3 },
  { word: "PIG", letters: 3, promptTexture: "animal_pig", tier: 3 },
  { word: "CAR", letters: 3, promptTexture: "sm_car", tier: 3 },
  { word: "OWL", letters: 3, promptTexture: "mascot_idle", tier: 3 },
  { word: "SUN", letters: 3, promptTexture: "sm_sun", tier: 3 },
  { word: "HAT", letters: 3, promptTexture: "sm_hat", tier: 3 },
  { word: "BUG", letters: 3, promptTexture: "sm_bug", tier: 3 },
  { word: "FROG", letters: 4, promptTexture: "frog_red", tier: 4 },
  { word: "BALL", letters: 4, promptTexture: "sm_ball", tier: 4 },
  { word: "FISH", letters: 4, promptTexture: "food_fish", tier: 4 },
  { word: "BOAT", letters: 4, promptTexture: "sm_boat", tier: 4 },
  { word: "TREE", letters: 4, promptTexture: "sm_tree", tier: 4 },
  { word: "BONE", letters: 4, promptTexture: "food_bone", tier: 4 },
  { word: "STAR", letters: 4, promptTexture: "shape_star", tier: 4 },
  { word: "DRUM", letters: 4, promptTexture: "toy_drum", tier: 4 },
  { word: "BEAR", letters: 4, promptTexture: "toy_teddy_bear", tier: 4 },
  { word: "DUCK", letters: 4, promptTexture: "sm_duck", tier: 4 },
];

/** Looks up a word's entry by its uppercase spelling. */
export function getWord(word: string): FirstWord | undefined {
  return WORD_POOL.find((entry) => entry.word === word);
}

/** A single Find the Word round: one target word and 4 unique printed choices. */
export interface WordRound {
  /** The word the child must find. */
  target: string;
  /** Four unique word cards; exactly one equals `target`. */
  choices: string[];
}

/**
 * Builds one Find the Word round: 3 distractors from the pool, one per
 * distinct first letter, never sharing the target's first letter (pre-reader
 * confusion guard). All positions are shuffled.
 */
export function generateWordRound(target: FirstWord): WordRound {
  const firstLetter = target.word[0];
  const candidates = WORD_POOL.filter(
    (entry) => entry.word !== target.word && entry.word[0] !== firstLetter,
  );
  // Group distractors by first letter, then pick one word from each of 3
  // distinct groups so the 4 choices never share a first letter.
  const groups = new Map<string, FirstWord[]>();
  for (const entry of candidates) {
    const group = groups.get(entry.word[0]) ?? [];
    group.push(entry);
    groups.set(entry.word[0], group);
  }
  const distractors = shuffle([...groups.values()])
    .slice(0, 3)
    .map((group) => shuffle(group)[0].word);
  return { target: target.word, choices: shuffle([target.word, ...distractors]) };
}

/** Generates a playthrough of rounds (6 by default), each with a unique target word. */
export function generateWordPlaythrough(roundCount = 6): WordRound[] {
  return shuffle(WORD_POOL)
    .slice(0, roundCount)
    .map((target) => generateWordRound(target));
}

/** Returns whether the tapped word is the round's target. */
export function isCorrectWord(round: WordRound, word: string): boolean {
  return round.target === word;
}

/**
 * Generates a Build the Word playthrough, easy-first: 3-letter words lead,
 * 4-letter words follow, random within each tier, no repeats. With the
 * default 3 words this yields two 3-letter words then one 4-letter word.
 */
export function generateWordBuildPlaythrough(wordCount = 3): FirstWord[] {
  const tier3 = shuffle(WORD_POOL.filter((entry) => entry.tier === 3));
  const tier4 = shuffle(WORD_POOL.filter((entry) => entry.tier === 4));
  const earlyCount = Math.min(tier3.length, Math.max(0, wordCount - 1));
  return [...tier3.slice(0, earlyCount), ...tier4.slice(0, wordCount - earlyCount)].slice(
    0,
    wordCount,
  );
}

/**
 * Builds the 6 letter tiles for a word: the word's unique letters plus
 * 2–3 distractor letters not in the word, all shuffled.
 */
export function generateLetterTiles(word: string): string[] {
  const uniqueLetters = [...new Set(word.split(""))];
  const distractorCount = 6 - uniqueLetters.length;
  const wordLetters = new Set(uniqueLetters);
  const distractors = shuffle(ALPHABET.filter((letter) => !wordLetters.has(letter))).slice(
    0,
    distractorCount,
  );
  return shuffle([...uniqueLetters, ...distractors]);
}
