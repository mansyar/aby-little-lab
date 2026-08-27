import type { BandShift } from "./adaptiveLogic";
import { isConfusableWith, type Letter } from "./alphabetLogic";
import { shuffle } from "./shapeSorterLogic";
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

/** A single Decode It round: target word plus 4 printed choices. */
export interface DecodeRound {
  /** The word the child must decode. */
  target: string;
  /** PreloadScene texture key for the prompt picture. */
  promptTexture: string;
  /** Four unique word cards; exactly one equals `target`. */
  choices: string[];
}

/**
 * Builds one round for the given target: 3 distractors from the pool, one per
 * distinct first letter, never sharing the target's first letter and never
 * confusable via isConfusableWith (families C/G/O/Q, I/L/T, M/W). Positions
 * are shuffled. Confusable exclusion also applies pairwise among distractors.
 */
export function buildRound(target: FirstWord): DecodeRound {
  const targetFirst = target.word[0]! as Letter;
  const candidates = DECODE_POOL.filter((entry) => {
    if (entry.word === target.word) return false;
    const candFirst = entry.word[0]! as Letter;
    if (candFirst === targetFirst) return false;
    if (isConfusableWith(candFirst, targetFirst)) return false;
    return true;
  });

  // Shuffle and pick 3 distractors pairwise non-confusable and distinct first letters
  const shuffled = shuffle([...candidates]);
  const distractors: string[] = [];
  const usedFirsts: Letter[] = [];
  for (const cand of shuffled) {
    if (distractors.length >= 3) break;
    const candFirst = cand.word[0]! as Letter;
    const conflictsWithUsed = usedFirsts.some(
      (used) => used === candFirst || isConfusableWith(used, candFirst),
    );
    if (conflictsWithUsed) continue;
    distractors.push(cand.word);
    usedFirsts.push(candFirst);
  }

  // Fallback if strict filter left us short (should not happen with 22 pool, but guard)
  if (distractors.length < 3) {
    const fallbackPool = DECODE_POOL.filter(
      (entry) => entry.word !== target.word && !distractors.includes(entry.word),
    );
    for (const cand of shuffle(fallbackPool)) {
      if (distractors.length >= 3) break;
      const candFirst = cand.word[0]! as Letter;
      if (candFirst === targetFirst) continue;
      if (distractors.some((d) => d[0] === candFirst)) continue;
      distractors.push(cand.word);
    }
  }

  return {
    target: target.word,
    promptTexture: target.promptTexture,
    choices: shuffle([target.word, ...distractors]),
  };
}

/**
 * Generates a Decode It playthrough of rounds (6 by default), each with a
 * unique target word, ordered easy-first: 3-letter words lead, 4-letter
 * follow, random within each tier, no repeats. Classic 6-round split is
 * 3 three-letter then 3 four-letter.
 *
 * The adaptive `shift` (-1 | 0 | 1) moves the tier split point: -1 serves
 * four 3-letter rounds then two 4-letter, +1 brings two 3-letter then four
 * 4-letter. Default 0 reproduces the classic 3+3 exactly.
 */
export function buildPlaythrough(roundCount = 6, shift: BandShift = 0): DecodeRound[] {
  const tier3 = shuffle(DECODE_POOL.filter((entry) => entry.tier === 3));
  const tier4 = shuffle(DECODE_POOL.filter((entry) => entry.tier === 4));
  const classicEasy = Math.floor(roundCount / 2);
  const earlyCount = Math.min(tier3.length, Math.max(0, classicEasy - shift));
  const targets = [...tier3.slice(0, earlyCount), ...tier4.slice(0, roundCount - earlyCount)].slice(
    0,
    roundCount,
  );
  return targets.map((target) => buildRound(target));
}

/** True when the tapped card index matches the round's target. */
export function isCorrect(round: DecodeRound, choiceIndex: number): boolean {
  const choice = round.choices[choiceIndex];
  if (choice === undefined) return false;
  return choice === round.target;
}
