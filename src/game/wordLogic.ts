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
 * The 9 first words. Every prompt texture is an already-loaded PreloadScene
 * texture, so no new art is required for the words themselves.
 */
export const WORD_POOL: readonly FirstWord[] = [
  { word: "CAT", letters: 3, promptTexture: "animal_cat", tier: 3 },
  { word: "DOG", letters: 3, promptTexture: "animal_dog", tier: 3 },
  { word: "PIG", letters: 3, promptTexture: "animal_pig", tier: 3 },
  { word: "CAR", letters: 3, promptTexture: "sm_car", tier: 3 },
  { word: "FROG", letters: 4, promptTexture: "frog_red", tier: 4 },
  { word: "BALL", letters: 4, promptTexture: "sm_ball", tier: 4 },
  { word: "FISH", letters: 4, promptTexture: "food_fish", tier: 4 },
  { word: "BOAT", letters: 4, promptTexture: "sm_boat", tier: 4 },
  { word: "TREE", letters: 4, promptTexture: "sm_tree", tier: 4 },
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
