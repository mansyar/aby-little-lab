import { type FirstWord, WORD_POOL } from "./wordLogic";

/** The 22 decode words: shared 18 plus 4 new CVC words. */
export const DECODE_POOL: readonly FirstWord[] = [
  ...WORD_POOL,
  { word: "FOX", letters: 3, promptTexture: "sm_fox", tier: 3 },
  { word: "CUP", letters: 3, promptTexture: "sm_cup", tier: 3 },
  { word: "MAP", letters: 3, promptTexture: "sm_map", tier: 3 },
  { word: "BED", letters: 3, promptTexture: "sm_bed", tier: 3 },
];

/** Looks up a decode word by its uppercase spelling. */
export function getDecodeWord(word: string): FirstWord | undefined {
  return DECODE_POOL.find((entry) => entry.word === word);
}
