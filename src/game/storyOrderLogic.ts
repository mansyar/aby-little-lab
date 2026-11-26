/**
 * Pure logic for Story Order (Game 22).
 *
 * Owns the thirty-story pool, the easy-first ladder split, the per-round panel
 * shuffle and the whole-strip correctness check. No Phaser, DOM, storage or
 * timers live here; every random decision is injectable so the scene and the
 * tests stay deterministic.
 */

import type { BandShift } from "./adaptiveLogic";
import { type Rng, shuffle } from "./random";
import type { StoryVariant } from "./storyVariants";

/** Which easy-first band a story belongs to. Rounds 1-3 are `obvious`. */
export type StoryLadder = "obvious" | "subtle";

/** One story: a stable id, its three panel texture keys and its ladder tag. */
export interface Story {
  /** Stable id, used to prove a playthrough never repeats a story. */
  id: string;
  /** Easy-first band the story is drawn into. */
  ladder: StoryLadder;
  /** Panel texture keys in solution order, first → last. */
  panels: readonly [string, string, string];
}

/**
 * The thirty-story pool: fifteen obvious causes and fifteen subtler ones. Panel
 * keys are fixed by the spec because the art is authored against them.
 */
export const STORY_POOL: readonly Story[] = [
  {
    id: "seed",
    ladder: "obvious",
    panels: ["story_seed_planted", "story_seed_sprout", "story_seed_flower"],
  },
  {
    id: "balloon",
    ladder: "obvious",
    panels: ["story_balloon_flat", "story_balloon_round", "story_balloon_aloft"],
  },
  {
    id: "duck",
    ladder: "obvious",
    panels: ["story_egg", "story_egg_cracking", "story_duckling"],
  },
  {
    id: "ice-cream",
    ladder: "obvious",
    panels: ["story_ice_scoop", "story_ice_dripping", "story_ice_puddle"],
  },
  {
    id: "cake",
    ladder: "obvious",
    panels: ["story_cake_whole", "story_cake_candles", "story_cake_sliced"],
  },
  {
    id: "snowman",
    ladder: "obvious",
    panels: ["story_snow_pile", "story_snowman", "story_snowman_hat"],
  },
  {
    id: "tower",
    ladder: "obvious",
    panels: ["story_blocks_scattered", "story_tower_half", "story_tower_tall"],
  },
  {
    id: "kite",
    ladder: "obvious",
    panels: ["story_kite_folded", "story_kite_raised", "story_kite_flying"],
  },
  {
    id: "pancake",
    ladder: "obvious",
    panels: ["story_pancake_batter", "story_pancake_cooked", "story_pancake_berries"],
  },
  {
    id: "soap",
    ladder: "obvious",
    panels: ["story_soap_bar", "story_soap_bubbles", "story_soap_bubble_big"],
  },
  {
    id: "pencil",
    ladder: "obvious",
    panels: ["story_pencil_new", "story_pencil_sharp", "story_pencil_drawing"],
  },
  {
    id: "sandcastle",
    ladder: "obvious",
    panels: ["story_sand_pile", "story_sand_castle", "story_sand_flag"],
  },
  {
    id: "lantern",
    ladder: "obvious",
    panels: ["story_lantern_off", "story_lantern_on", "story_lantern_glow"],
  },
  {
    id: "cupcake",
    ladder: "obvious",
    panels: ["story_cupcake_plain", "story_cupcake_frosted", "story_cupcake_cherry"],
  },
  {
    id: "train",
    ladder: "obvious",
    panels: ["story_train_track", "story_train_near", "story_train_waving"],
  },
  {
    id: "banana",
    ladder: "subtle",
    panels: ["story_banana_whole", "story_banana_peeled", "story_banana_peel"],
  },
  {
    id: "cup",
    ladder: "subtle",
    panels: ["story_cup_full", "story_cup_pouring", "story_cup_empty"],
  },
  {
    id: "foot",
    ladder: "subtle",
    panels: ["story_foot_bare", "story_foot_sock", "story_foot_shoe"],
  },
  {
    id: "rain",
    ladder: "subtle",
    panels: ["story_cloud", "story_cloud_raining", "story_rain_puddle"],
  },
  {
    id: "clothes",
    ladder: "subtle",
    panels: ["story_clothes_wet", "story_clothes_drying", "story_clothes_dry"],
  },
  {
    id: "sun",
    ladder: "subtle",
    panels: ["story_sun_rise", "story_sun_noon", "story_sun_set"],
  },
  {
    id: "caterpillar",
    ladder: "subtle",
    panels: ["story_caterpillar", "story_cocoon", "story_butterfly"],
  },
  {
    id: "tadpole",
    ladder: "subtle",
    panels: ["story_frogspawn", "story_tadpole", "story_frog"],
  },
  {
    id: "shadow",
    ladder: "subtle",
    panels: ["story_shadow_morning", "story_shadow_noon", "story_shadow_evening"],
  },
  {
    id: "magnet",
    ladder: "subtle",
    panels: ["story_magnet_bar", "story_magnet_clip", "story_magnet_chain"],
  },
  {
    id: "mirror",
    ladder: "subtle",
    panels: ["story_mirror_frame", "story_mirror_reflection", "story_mirror_smile"],
  },
  {
    id: "kettle",
    ladder: "subtle",
    panels: ["story_kettle_cold", "story_kettle_steam", "story_kettle_tea"],
  },
  {
    id: "paint",
    ladder: "subtle",
    panels: ["story_paint_blank", "story_paint_stroke", "story_paint_picture"],
  },
  {
    id: "bee",
    ladder: "subtle",
    panels: ["story_bee_flower", "story_bee_landing", "story_bee_flying"],
  },
  {
    id: "puzzle",
    ladder: "subtle",
    panels: ["story_puzzle_pieces", "story_puzzle_half", "story_puzzle_done"],
  },
];

/** Every story id, in pool order. */
export const STORY_IDS: readonly string[] = STORY_POOL.map((story) => story.id);

/** Rounds 1-3 draw from here. */
export const OBVIOUS_POOL: readonly Story[] = STORY_POOL.filter(
  (story) => story.ladder === "obvious",
);

/** Rounds 4-6 draw from here. */
export const SUBTLE_POOL: readonly Story[] = STORY_POOL.filter(
  (story) => story.ladder === "subtle",
);

/** How many rounds one playthrough presents. */
export const ROUND_COUNT = 6;

/** How many rounds each ladder contributes in the classic mix (shift 0). */
export const ROUNDS_PER_BAND = ROUND_COUNT / 2;

/**
 * Rounds per ladder band for a playthrough's band shift. The classic mix keeps
 * the balanced 3 + 3; the easy band leans obvious (5 + 1), the hard band leans
 * subtle (1 + 5).
 */
export function mixFor(shift: BandShift = 0): { obvious: number; subtle: number } {
  if (shift < 0) return { obvious: 5, subtle: 1 };
  if (shift > 0) return { obvious: 1, subtle: 5 };
  return { obvious: ROUNDS_PER_BAND, subtle: ROUNDS_PER_BAND };
}

/** One playable round: which story, the scrambled source row, and the answer. */
export interface StoryOrderRound {
  /** Id of the story this round tells. */
  storyId: string;
  /** Panel keys shown in the source row: a permutation of `solution`, not solved. */
  shuffled: string[];
  /** Panel keys in solution order, first → last. */
  solution: string[];
}

/**
 * Delegate for the private shuffles: the shared Fisher-Yates `shuffle`
 * releases the exact same sequence of `rng` draws (copy in, `i` from the end
 * down to 1, `j = floor(rng() * (i + 1))`), so a given seed yields the
 * identical draw as before this module adopted it.
 */
function shuffleWith<T>(items: readonly T[], rng: Rng): T[] {
  return shuffle(items, rng);
}

/** True iff both strips hold the same keys in the same positions. */
function isSameOrder(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

/**
 * Builds one round from `story`. The panels are shuffled to form the source
 * row; if that shuffle reproduces the solution it is reshuffled once, and if a
 * degenerate RNG still yields the solution the row is rotated by one. A round
 * therefore always requires work.
 */
export function buildRound(story: Story, rng: Rng = Math.random): StoryOrderRound {
  const solution = [...story.panels];
  let shuffled = shuffleWith(solution, rng);
  if (isSameOrder(shuffled, solution)) {
    shuffled = shuffleWith(solution, rng);
  }
  if (isSameOrder(shuffled, solution)) {
    shuffled = [...solution.slice(1), solution[0]];
  }
  return { storyId: story.id, shuffled, solution };
}

/**
 * Draws one playthrough of `ROUND_COUNT` stories from the band shift's
 * obvious/subtle mix ({@link mixFor}), with no story repeated. The obvious
 * rounds come first, then the subtle ones. Within a band the draw order is
 * shuffled, so consecutive playthroughs differ. `rng` must return a number in
 * [0, 1); tests pass a seeded generator so a playthrough is reproducible.
 *
 * `variant` restricts stories to one signature slide when it can fill the
 * shift's ladder mix; otherwise the full `STORY_POOL` is used. Omitting it
 * keeps the classic draw byte-for-byte identical.
 *
 * `rng` stays the **first** parameter, unlike the trailing-rng convention every
 * other module follows, for scene-call compatibility: `StoryOrderScene` calls
 * `buildPlaythrough(Math.random, shift)`. See the FR-3 deviation in the phase
 * evidence.
 */
export function buildPlaythrough(
  rng: Rng = Math.random,
  shift: BandShift = 0,
  variant?: StoryVariant["id"],
): StoryOrderRound[] {
  const mix = mixFor(shift);
  const pools = storyPoolsFor(mix, variant);
  const obvious = shuffleWith(pools.obvious, rng).slice(0, mix.obvious);
  const subtle = shuffleWith(pools.subtle, rng).slice(0, mix.subtle);
  return [...obvious, ...subtle].map((story) => buildRound(story, rng));
}

/**
 * Mirrors `storyVariants.ts` membership locally: that module derives its pool
 * from `STORY_POOL` at load time, so importing it here would be circular.
 * Tests compare these entries against `storyVariantPool(id)`.
 */
const GROWING_IDS: ReadonlySet<string> = new Set([
  "seed",
  "duck",
  "banana",
  "rain",
  "sun",
  "caterpillar",
  "tadpole",
  "shadow",
  "bee",
]);

/** The two signature story slides, used only when a caller opts in. */
const STORY_VARIANT_POOLS: Record<StoryVariant["id"], readonly Story[]> = {
  "growing-things": STORY_POOL.filter((story) => GROWING_IDS.has(story.id)),
  "everyday-changes": STORY_POOL.filter((story) => !GROWING_IDS.has(story.id)),
};

/**
 * Chooses the two ladder pools before any shuffle, preserving the exact RNG
 * sequence of the no-variant path. A slide too thin for the shift's mix falls
 * back to the full obvious/subtle pools.
 */
function storyPoolsFor(
  mix: ReturnType<typeof mixFor>,
  variant?: StoryVariant["id"],
): { obvious: readonly Story[]; subtle: readonly Story[] } {
  if (variant === undefined) return { obvious: OBVIOUS_POOL, subtle: SUBTLE_POOL };
  const pool = STORY_VARIANT_POOLS[variant];
  const obvious = pool.filter((story) => story.ladder === "obvious");
  const subtle = pool.filter((story) => story.ladder === "subtle");
  return obvious.length >= mix.obvious && subtle.length >= mix.subtle
    ? { obvious, subtle }
    : { obvious: OBVIOUS_POOL, subtle: SUBTLE_POOL };
}

/** True iff `placed` equals `solution` (same length, same order, same values). */
export function isCorrect(placed: readonly string[], solution: readonly string[]): boolean {
  if (placed.length !== solution.length) return false;
  return placed.every((value, index) => value === solution[index]);
}
