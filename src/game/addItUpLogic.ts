import { COUNT_ITEMS } from "./countLogic";
import { shuffle } from "./shapeSorterLogic";

/** Difficulty band id: 1 (sums ≤4), 2 (≤6), 3 (≤10). */
export type BandId = 1 | 2 | 3;

/** One addend card: how many items it holds and which item texture. */
export interface AddendCard {
  /** Number of items shown on the card (1..band max). */
  count: number;
  /** PreloadScene texture key of the repeated counting item. */
  texture: string;
}

/** A single Add It Up round: two addend cards plus four total options. */
export interface AddItUpRound {
  /** Left and right addend cards (always two distinct item types). */
  addends: readonly [AddendCard, AddendCard];
  /** The four distinct answer totals in [1..bandMax], one equals `target`. */
  answerOptions: readonly number[];
  /** Texture used for every answer card's dot-group in this round. */
  answerItemTexture: string;
  /** The correct total — sum of both addends. */
  target: number;
}

/**
 * The three progressive difficulty bands. Rounds 1-2 use band 1 (sums ≤4),
 * rounds 3-4 band 2 (≤6), rounds 5-6 band 3 (≤10). Addends are always ≥ 1;
 * difficulty is fixed across replays per the replay-variety principle.
 */
export const ADD_IT_UP_BANDS: readonly { max: number }[] = [{ max: 4 }, { max: 6 }, { max: 10 }];

/** All valid addend pairs for a band: a,b ≥ 1 and 2 ≤ a+b ≤ band max. */
function pairPool(band: BandId): { a: number; b: number }[] {
  const max = ADD_IT_UP_BANDS[band - 1].max;
  const pairs: { a: number; b: number }[] = [];
  for (let a = 1; a <= max - 1; a++) {
    for (let b = 1; b <= max - a; b++) {
      pairs.push({ a, b });
    }
  }
  return pairs;
}

/** Order-insensitive identity of an addend pair. */
function pairKey(a: number, b: number): string {
  return `${Math.min(a, b)}-${Math.max(a, b)}`;
}

/** Samples 3 distinct totals from [1..bandMax] excluding the target. */
function distractorOptions(target: number, max: number): number[] {
  const pool = Array.from({ length: max }, (_, i) => i + 1).filter((n) => n !== target);
  return shuffle(pool).slice(0, 3);
}

/**
 * Builds one round for a band. `usedPairs` holds order-insensitive "a-b" keys
 * already drawn in the playthrough — the round's pair never repeats one.
 * Every band keeps enough unused pairs for its two rounds per playthrough.
 */
export function buildRound(
  band: BandId,
  usedPairs: ReadonlySet<string> = new Set(),
): AddItUpRound {
  const config = ADD_IT_UP_BANDS[band - 1];
  if (!config) {
    // Only reachable if a caller passes a band id outside ADD_IT_UP_BANDS.
    throw new Error(`Unknown band ${band}`);
  }
  const available = pairPool(band).filter((pair) => !usedPairs.has(pairKey(pair.a, pair.b)));
  const [pair] = shuffle(available);
  if (!pair) {
    // Only reachable if a playthrough consumes every pair of the band.
    throw new Error(`No unused addend pair for band ${band}`);
  }
  const [leftTexture, rightTexture] = shuffle([...COUNT_ITEMS]);
  const target = pair.a + pair.b;
  return {
    addends: [
      { count: pair.a, texture: leftTexture },
      { count: pair.b, texture: rightTexture },
    ],
    answerOptions: shuffle([target, ...distractorOptions(target, config.max)]),
    answerItemTexture: shuffle([...COUNT_ITEMS])[0],
    target,
  };
}

/**
 * Generates a playthrough of 6 rounds, easy-first: 2 rounds per band
 * (≤4, then ≤6, then ≤10). No addend pair repeats within a playthrough.
 * Difficulty is fixed across replays.
 */
export function buildPlaythrough(): AddItUpRound[] {
  const bands: readonly BandId[] = [1, 1, 2, 2, 3, 3];
  const usedPairs = new Set<string>();
  return bands.map((band) => {
    const round = buildRound(band, usedPairs);
    const [left, right] = round.addends;
    usedPairs.add(pairKey(left.count, right.count));
    return round;
  });
}

/** Returns whether the option at `selectedIndex` equals the target total. */
export function isCorrect(
  options: readonly number[],
  selectedIndex: number,
  target: number,
): boolean {
  return options[selectedIndex] === target;
}
