/**
 * Narration pace presets and their utterance rates.
 *
 * Rates are Web Speech `utterance.rate` multipliers. Gentle keeps the two
 * historical rates exactly (0.9 for letters/numbers/sentences, 0.8 for
 * words); Slower and Standard scale every speak path together.
 */

import type { NarrationPace } from "../types";

/** All presets, in the order shown to a parent. */
export const NARRATION_PACES: readonly NarrationPace[] = ["slower", "gentle", "standard"];

/** Backfill for profiles written before the pace field existed. */
export const DEFAULT_NARRATION_PACE: NarrationPace = "gentle";

export interface NarrationRates {
  /** Letters, number words and full instruction sentences. */
  general: number;
  /** Whole words, historically a step slower than a single letter. */
  word: number;
}

export const NARRATION_RATES: Record<NarrationPace, NarrationRates> = {
  slower: { general: 0.7, word: 0.6 },
  gentle: { general: 0.9, word: 0.8 },
  standard: { general: 1, word: 1 },
};

/** Coerces any stored or hand-edited value to a valid preset (Gentle if not). */
export function normalizeNarrationPace(value: unknown): NarrationPace {
  return NARRATION_PACES.includes(value as NarrationPace)
    ? (value as NarrationPace)
    : DEFAULT_NARRATION_PACE;
}

/** Rates for a preset; a corrupt value is read as Gentle rather than throwing. */
export function ratesForPace(pace: NarrationPace): NarrationRates {
  return NARRATION_RATES[normalizeNarrationPace(pace)];
}
