import { COUNT_ITEMS } from "./countLogic";
import { shuffle } from "./shapeSorterLogic";

/** The comparison a round asks for: "which group has MORE?" or "...LESS?". */
export type ComparisonMode = "more" | "less";

/** Which of the round's two cards the child tapped. */
export type GroupSide = "left" | "right";

/** One group of objects: how many items it holds and which item texture. */
export interface MoreLessGroup {
  /** Number of items in the group (1..band max). */
  count: number;
  /** PreloadScene texture key of the repeated item. */
  texture: string;
}

/** A single More or Less round: a comparison and two distinct groups. */
export interface MoreLessRound {
  /** Whether the child must find the bigger ("more") or smaller ("less") group. */
  mode: ComparisonMode;
  /** Left group card. */
  left: MoreLessGroup;
  /** Right group card. */
  right: MoreLessGroup;
}

/**
 * The three progressive difficulty bands. Rounds 1-2 use band 1 (1-3),
 * rounds 3-4 band 2 (1-5), rounds 5-6 band 3 (1-10). Each round always
 * shows exactly two cards.
 */
export const ROUND_BANDS: readonly { max: number }[] = [{ max: 3 }, { max: 5 }, { max: 10 }];

/** Builds one round for a band and mode with two distinct counts and item types. */
export function createRound(band: 1 | 2 | 3, mode: ComparisonMode): MoreLessRound {
  const config = ROUND_BANDS[band - 1];
  const counts = shuffle(Array.from({ length: config.max }, (_, i) => i + 1)).slice(0, 2);
  const textures = shuffle([...COUNT_ITEMS]).slice(0, 2);
  return {
    mode,
    left: { count: counts[0], texture: textures[0] },
    right: { count: counts[1], texture: textures[1] },
  };
}

/**
 * Generates a playthrough of 6 rounds, easy-first: 2 rounds per band
 * (1-3, then 1-5, then 1-10). The comparison modes are shuffled so every
 * playthrough asks exactly 3 "more" and 3 "less" questions. Difficulty is
 * fixed across replays.
 */
export function createPlaythrough(): MoreLessRound[] {
  const bands = [1, 1, 2, 2, 3, 3] as const;
  const modes = shuffle(["more", "more", "more", "less", "less", "less"]) as ComparisonMode[];
  return bands.map((band, index) => createRound(band, modes[index]));
}

/** Returns whether the tapped side satisfies the round's comparison. */
export function evaluateRound(round: MoreLessRound, side: GroupSide): boolean {
  const group = round[side];
  const other = round[side === "left" ? "right" : "left"];
  return round.mode === "more" ? group.count > other.count : group.count < other.count;
}
