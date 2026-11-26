/**
 * Pure per-playthrough slide selection for the four signature content variants.
 *
 * Only ids live here: the variant data modules derive their pools from the rule
 * pools, so rule and scene modules select a slide from these frozen arrays
 * without importing variant data back into the rule layer.
 */
import type { Rng } from "./random";
import type { ScenarioVariant } from "./scenarioVariants";
import type { ShapeVariant } from "./shapeVariants";
import type { StoryVariant } from "./storyVariants";
import type { WordVariant } from "./wordVariants";

/** The two signature word slides. */
export const WORD_VARIANT_IDS = Object.freeze([
  "animals-and-food",
  "everyday-objects",
] as const satisfies readonly WordVariant["id"][]);

/** The two signature story slides. */
export const STORY_VARIANT_IDS = Object.freeze([
  "growing-things",
  "everyday-changes",
] as const satisfies readonly StoryVariant["id"][]);

/** The two signature shape slides. */
export const SHAPE_VARIANT_IDS = Object.freeze([
  "curvy",
  "angular",
] as const satisfies readonly ShapeVariant["id"][]);

/** The two signature scenario slides. */
export const SCENARIO_VARIANT_IDS = Object.freeze([
  "outdoors-and-play",
  "home-and-friends",
] as const satisfies readonly ScenarioVariant["id"][]);

/**
 * Picks one slide id from `ids` using a single draw from the injected `rng`.
 * The clamp keeps a near-1 draw inside the array, and no state is retained
 * between calls, so the same seed always selects the same slide.
 */
export function pickVariantId<T extends string>(ids: readonly T[], rng: Rng): T {
  return ids[Math.min(Math.floor(rng() * ids.length), ids.length - 1)];
}
