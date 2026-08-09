import { COUNT_ITEMS } from "./countLogic";
import { shuffle } from "./shapeSorterLogic";

/** Difficulty band id: 1 (minuends ≤4), 2 (≤6), 3 (≤10). */
export type BandId = 1 | 2 | 3;

/** One prompt card: how many items it holds and which item texture. */
export interface PromptCard {
  /** Number of items shown on the card (1..band max). */
  count: number;
  /** PreloadScene texture key of the repeated counting item. */
  texture: string;
}

/** A single Take Away round: minuend/subtrahend cards plus four answer options. */
export interface TakeAwayRound {
  /** First card is the minuend, second the subtrahend (always two item types). */
  promptCards: readonly [PromptCard, PromptCard];
  /** The four distinct answer differences in [1..bandMax], one equals `target`. */
  answerOptions: readonly number[];
  /** Texture used for every answer card's dot-group in this round. */
  answerItemTexture: string;
  /** The correct difference — minuend minus subtrahend. */
  target: number;
}

/**
 * The three progressive difficulty bands. Rounds 1-2 use band 1 (minuends ≤4),
 * rounds 3-4 band 2 (≤6), rounds 5-6 band 3 (≤10). Subtrahends are always
 * ≥ 1 and strictly less than the minuend (differences never reach 0);
 * difficulty is fixed across replays per the replay-variety principle.
 */
export const TAKE_AWAY_BANDS: readonly { max: number }[] = [{ max: 4 }, { max: 6 }, { max: 10 }];

/** All valid minuend-subtrahend pairs for a band: a > b ≥ 1 and a ≤ band max. */
function pairPool(band: BandId): { a: number; b: number }[] {
  const max = TAKE_AWAY_BANDS[band - 1].max;
  const pairs: { a: number; b: number }[] = [];
  for (let a = 2; a <= max; a++) {
    for (let b = 1; b <= a - 1; b++) {
      pairs.push({ a, b });
    }
  }
  return pairs;
}

/** Ordered identity of a minuend-subtrahend pair. */
function pairKey(a: number, b: number): string {
  return `${a}-${b}`;
}

/** Samples 3 distinct differences from [1..bandMax] excluding the target. */
function distractorOptions(target: number, max: number): number[] {
  const pool = Array.from({ length: max }, (_, i) => i + 1).filter((n) => n !== target);
  return shuffle(pool).slice(0, 3);
}

/**
 * Builds one round for a band. `usedPairs` holds ordered "a-b" keys already
 * drawn in the playthrough — the round's pair never repeats one. Every band
 * keeps enough unused pairs for its two rounds per playthrough.
 */
export function buildRound(
  band: BandId,
  usedPairs: ReadonlySet<string> = new Set(),
): TakeAwayRound {
  const config = TAKE_AWAY_BANDS[band - 1];
  if (!config) {
    // Only reachable if a caller passes a band id outside TAKE_AWAY_BANDS.
    throw new Error(`Unknown band ${band}`);
  }
  const available = pairPool(band).filter((pair) => !usedPairs.has(pairKey(pair.a, pair.b)));
  const [pair] = shuffle(available);
  if (!pair) {
    // Only reachable if a playthrough consumes every pair of the band.
    throw new Error(`No unused subtraction pair for band ${band}`);
  }
  const [minuendTexture, subtrahendTexture] = shuffle([...COUNT_ITEMS]);
  const target = pair.a - pair.b;
  return {
    promptCards: [
      { count: pair.a, texture: minuendTexture },
      { count: pair.b, texture: subtrahendTexture },
    ],
    answerOptions: shuffle([target, ...distractorOptions(target, config.max)]),
    answerItemTexture: shuffle([...COUNT_ITEMS])[0],
    target,
  };
}

/**
 * Generates a playthrough of 6 rounds, easy-first: 2 rounds per band
 * (minuends ≤4, then ≤6, then ≤10). No minuend-subtrahend pair repeats
 * within a playthrough. Difficulty is fixed across replays.
 */
export function buildPlaythrough(): TakeAwayRound[] {
  const bands: readonly BandId[] = [1, 1, 2, 2, 3, 3];
  const usedPairs = new Set<string>();
  return bands.map((band) => {
    const round = buildRound(band, usedPairs);
    const [minuend, subtrahend] = round.promptCards;
    usedPairs.add(pairKey(minuend.count, subtrahend.count));
    return round;
  });
}

/** Returns whether the option at `selectedIndex` equals the target difference. */
export function isCorrect(
  options: readonly number[],
  selectedIndex: number,
  target: number,
): boolean {
  return options[selectedIndex] === target;
}
