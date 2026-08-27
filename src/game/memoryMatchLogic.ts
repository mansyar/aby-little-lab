import type { BandId, BandShift } from "./adaptiveLogic";
import { BASE_LADDER, shiftLadder } from "./adaptiveLogic";
import { shuffle } from "./shapeSorterLogic";

/** Difficulty bands for Memory Match rounds (fixed across replays). */
export type MemoryBand = "easy" | "medium" | "hard";

/** One Memory Match round: a grid of face-down paired cards. */
export interface MemoryRound {
  band: MemoryBand;
  /** Grid rows (children memorize positions across the whole grid). */
  rows: number;
  /** Grid columns. */
  cols: number;
  /** The pair textures of this round — all distinct, drawn from MEMORY_POOL. */
  textures: readonly string[];
  /**
   * Card layout, `rows × cols` entries: each pair texture appears exactly
   * twice, at shuffled positions.
   */
  layout: readonly string[];
}

/**
 * Shared pool of 16 existing textures mixed across categories (animals,
 * toys, everyday items) so every round blends categories — no new art.
 * Every key must exist in PreloadScene's SHAPE_ASSETS.
 */
export const MEMORY_POOL: readonly string[] = [
  "animal_monkey",
  "animal_rabbit",
  "animal_cat",
  "animal_dog",
  "animal_elephant",
  "animal_pig",
  "toy_teddy_bear",
  "toy_car",
  "toy_rocket",
  "toy_drum",
  "toy_ball",
  "toy_block",
  "sm_house",
  "sm_tree",
  "sm_boat",
  "sm_duck",
];

/** Grid dimensions per band. */
export const BAND_GRID: {
  readonly [K in MemoryBand]: { readonly rows: number; readonly cols: number };
} = {
  easy: { rows: 2, cols: 3 },
  medium: { rows: 3, cols: 4 },
  hard: { rows: 4, cols: 4 },
};

/** Number of card pairs per band (grid area is always pairs × 2). */
export const BAND_PAIRS: { readonly [K in MemoryBand]: number } = {
  easy: 3,
  medium: 6,
  hard: 8,
};

/**
 * Maps a 0-based round index to its difficulty band, easy-first:
 * rounds 1-2 easy (2×3, 3 pairs), rounds 3-4 medium (3×4, 6 pairs),
 * rounds 5-6 hard (4×4, 8 pairs). Out-of-range indices clamp to hard.
 */
export function bandForRound(roundIndex: number): MemoryBand {
  return (["easy", "easy", "medium", "medium", "hard", "hard"] as const)[roundIndex] ?? "hard";
}

/** Maps an adaptive band id (1 easy … 3 hard) to a Memory Match band. */
function bandIdToMemoryBand(band: BandId): MemoryBand {
  return band === 1 ? "easy" : band === 2 ? "medium" : "hard";
}

/**
 * Builds one round by sampling `pairs` distinct textures from the pool,
 * duplicating them, and shuffling the layout so each texture appears twice.
 */
export function buildRound(band: MemoryBand): MemoryRound {
  const pairs = BAND_PAIRS[band];
  if (pairs === undefined) {
    // Only reachable if a caller passes a band outside the MemoryBand union.
    throw new Error(`Unknown band ${band}`);
  }
  const textures = shuffle(MEMORY_POOL).slice(0, pairs);
  const layout = shuffle([...textures, ...textures]);
  const { rows, cols } = BAND_GRID[band];
  return { band, rows, cols, textures, layout };
}

/**
 * Generates a playthrough of 6 rounds, easy-first through the bands. The
 * adaptive shift moves every round one band down (-1) or up (+1), clamped
 * to easy/hard; the default shift 0 reproduces the classic ladder exactly.
 */
export function buildPlaythrough(shift: BandShift = 0): MemoryRound[] {
  const ladder = shiftLadder(BASE_LADDER, shift);
  return ladder.map((band) => buildRound(bandIdToMemoryBand(band)));
}

/**
 * Returns whether two card positions form a matching pair — different
 * positions holding the same texture. Same-position and out-of-range
 * indices are never a pair.
 */
export function isPair(
  layout: readonly string[],
  firstIndex: number,
  secondIndex: number,
): boolean {
  if (firstIndex < 0 || secondIndex < 0 || firstIndex === secondIndex) {
    return false;
  }
  const first = layout[firstIndex];
  const second = layout[secondIndex];
  return first !== undefined && second !== undefined && first === second;
}

/** Returns whether every card is matched (an empty set is complete). */
export function isRoundComplete(matched: readonly boolean[]): boolean {
  return matched.every(Boolean);
}
