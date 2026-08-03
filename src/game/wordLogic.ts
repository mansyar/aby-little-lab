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
