import type { BandShift } from "./adaptiveLogic";
import { ALPHABET } from "./alphabetLogic";
import { type Rng, shuffle } from "./random";
import type { WordVariant } from "./wordVariants";

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
 * The 60 first words, split across the 3- and 4-letter tiers. Prompt textures
 * are PreloadScene texture keys drawn only from art groups the Word scenes
 * preload (animals, food, items, shapes, toys) plus the two shell keys
 * `mascot_idle` (OWL) and `frog_red` (FROG). Every key is unique and already
 * registered, so the pool grew without inventing texture keys.
 */
export const WORD_POOL: readonly FirstWord[] = [
  { word: "CAT", letters: 3, promptTexture: "animal_cat", tier: 3 },
  { word: "DOG", letters: 3, promptTexture: "animal_dog", tier: 3 },
  { word: "PIG", letters: 3, promptTexture: "animal_pig", tier: 3 },
  { word: "CAR", letters: 3, promptTexture: "sm_car", tier: 3 },
  { word: "OWL", letters: 3, promptTexture: "mascot_idle", tier: 3 },
  { word: "SUN", letters: 3, promptTexture: "sm_sun", tier: 3 },
  { word: "HAT", letters: 3, promptTexture: "sm_hat", tier: 3 },
  { word: "BUG", letters: 3, promptTexture: "sm_bug", tier: 3 },
  { word: "MAP", letters: 3, promptTexture: "sm_map", tier: 3 },
  { word: "FOX", letters: 3, promptTexture: "sm_fox", tier: 3 },
  { word: "CUP", letters: 3, promptTexture: "sm_cup", tier: 3 },
  { word: "BOX", letters: 3, promptTexture: "toy_box", tier: 3 },
  { word: "BED", letters: 3, promptTexture: "sm_bed", tier: 3 },
  { word: "FROG", letters: 4, promptTexture: "frog_red", tier: 4 },
  { word: "BALL", letters: 4, promptTexture: "sm_ball", tier: 4 },
  { word: "FISH", letters: 4, promptTexture: "food_fish", tier: 4 },
  { word: "BOAT", letters: 4, promptTexture: "sm_boat", tier: 4 },
  { word: "TREE", letters: 4, promptTexture: "sm_tree", tier: 4 },
  { word: "BONE", letters: 4, promptTexture: "food_bone", tier: 4 },
  { word: "STAR", letters: 4, promptTexture: "shape_star", tier: 4 },
  { word: "DRUM", letters: 4, promptTexture: "toy_drum", tier: 4 },
  { word: "BEAR", letters: 4, promptTexture: "toy_teddy_bear", tier: 4 },
  { word: "DUCK", letters: 4, promptTexture: "sm_duck", tier: 4 },
  { word: "KITE", letters: 4, promptTexture: "sm_kite", tier: 4 },
  { word: "SOCK", letters: 4, promptTexture: "sm_sock", tier: 4 },
  { word: "BOOT", letters: 4, promptTexture: "sm_boot", tier: 4 },
  { word: "RING", letters: 4, promptTexture: "shape_ring", tier: 4 },
  { word: "PLUS", letters: 4, promptTexture: "shape_plus", tier: 4 },
  // Tier-3 additions: every prompt reuses a registered item/animal/food/shape key.
  { word: "APE", letters: 3, promptTexture: "animal_monkey", tier: 3 },
  { word: "BUN", letters: 3, promptTexture: "animal_rabbit", tier: 3 },
  { word: "EAR", letters: 3, promptTexture: "animal_elephant", tier: 3 },
  { word: "NUT", letters: 3, promptTexture: "food_peanut", tier: 3 },
  { word: "PIE", letters: 3, promptTexture: "food_apple", tier: 3 },
  { word: "CAB", letters: 3, promptTexture: "toy_car", tier: 3 },
  { word: "FLY", letters: 3, promptTexture: "toy_rocket", tier: 3 },
  { word: "TOY", letters: 3, promptTexture: "toy_ball", tier: 3 },
  { word: "HUT", letters: 3, promptTexture: "sm_house", tier: 3 },
  { word: "JET", letters: 3, promptTexture: "sm_airplane", tier: 3 },
  { word: "CAP", letters: 3, promptTexture: "sm_mushroom", tier: 3 },
  { word: "DOT", letters: 3, promptTexture: "shape_circle", tier: 3 },
  { word: "GEM", letters: 3, promptTexture: "shape_diamond", tier: 3 },
  { word: "HEX", letters: 3, promptTexture: "shape_hexagon", tier: 3 },
  // Tier-4 additions: the one new art key (`shape_cube`) is registered in
  // `src/game/art/shapes.ts`; all other prompts reuse existing art.
  { word: "PEEL", letters: 4, promptTexture: "food_banana", tier: 4 },
  { word: "ROOT", letters: 4, promptTexture: "food_carrot", tier: 4 },
  { word: "CUBE", letters: 4, promptTexture: "toy_block", tier: 4 },
  { word: "RAIN", letters: 4, promptTexture: "sm_umbrella", tier: 4 },
  { word: "BELL", letters: 4, promptTexture: "sm_bell", tier: 4 },
  { word: "TILE", letters: 4, promptTexture: "shape_square", tier: 4 },
  { word: "TENT", letters: 4, promptTexture: "shape_triangle", tier: 4 },
  { word: "LOVE", letters: 4, promptTexture: "shape_heart", tier: 4 },
  { word: "MOON", letters: 4, promptTexture: "shape_crescent", tier: 4 },
  { word: "DART", letters: 4, promptTexture: "shape_arrow", tier: 4 },
  { word: "STOP", letters: 4, promptTexture: "shape_octagon", tier: 4 },
  { word: "OVAL", letters: 4, promptTexture: "shape_oval", tier: 4 },
  { word: "FIVE", letters: 4, promptTexture: "shape_pentagon", tier: 4 },
  { word: "DOOR", letters: 4, promptTexture: "shape_rectangle", tier: 4 },
  { word: "ARCH", letters: 4, promptTexture: "shape_semicircle", tier: 4 },
  { word: "DROP", letters: 4, promptTexture: "shape_teardrop", tier: 4 },
  { word: "LAMP", letters: 4, promptTexture: "shape_trapezoid", tier: 4 },
  { word: "DICE", letters: 4, promptTexture: "shape_cube", tier: 4 },
];

/** Looks up a word's entry by its uppercase spelling. */
export function getWord(word: string): FirstWord | undefined {
  return WORD_POOL.find((entry) => entry.word === word);
}

/**
 * Mirrors `wordVariants.ts` membership locally: that module derives its pools
 * from `WORD_POOL` at load time, so importing it here would make the rule pool
 * circular. Tests assert these entries match `wordVariantPool(id)`.
 */
function fromTextureGroups(groups: readonly string[]): readonly FirstWord[] {
  return WORD_POOL.filter((entry) =>
    groups.some((group) => entry.promptTexture.startsWith(`${group}_`)),
  );
}

/** The two signature word slides, used only when a caller opts in. */
const WORD_VARIANT_POOLS: Record<WordVariant["id"], readonly FirstWord[]> = {
  "animals-and-food": fromTextureGroups(["animal", "food"]),
  "everyday-objects": fromTextureGroups(["sm", "toy"]),
};

/**
 * Selects the source pool before any shuffle, so the no-variant path consumes
 * exactly the same random draws as before variants were added. A slide that
 * cannot fill the tier split for the requested shift falls back to the full
 * pool rather than breaking the easy-first ladder.
 */
function wordPoolFor(
  roundCount: number,
  shift: BandShift,
  variant?: WordVariant["id"],
): readonly FirstWord[] {
  if (variant === undefined) return WORD_POOL;
  const pool = WORD_VARIANT_POOLS[variant];
  const earlyCount = Math.max(0, roundCount - 1 - shift);
  const tier3 = pool.filter((entry) => entry.tier === 3).length;
  const tier4 = pool.filter((entry) => entry.tier === 4).length;
  return tier3 >= earlyCount && tier4 >= roundCount - earlyCount ? pool : WORD_POOL;
}

/** A single Find the Word round: one target word and 4 unique printed choices. */
export interface WordRound {
  /** The word the child must find. */
  target: string;
  /** Four unique word cards; exactly one equals `target`. */
  choices: string[];
}

/**
 * Builds one Find the Word round: 3 distractors from the pool, one per
 * distinct first letter, never sharing the target's first letter (pre-reader
 * confusion guard). All positions are shuffled.
 *
 * `rng` must return a number in [0, 1); tests pass a seeded generator so a
 * draw is reproducible.
 */
export function generateWordRound(target: FirstWord, rng: Rng = Math.random): WordRound {
  const firstLetter = target.word[0];
  const candidates = WORD_POOL.filter(
    (entry) => entry.word !== target.word && entry.word[0] !== firstLetter,
  );
  // Group distractors by first letter, then pick one word from each of 3
  // distinct groups so the 4 choices never share a first letter.
  const groups = new Map<string, FirstWord[]>();
  for (const entry of candidates) {
    const group = groups.get(entry.word[0]) ?? [];
    group.push(entry);
    groups.set(entry.word[0], group);
  }
  const distractors = shuffle([...groups.values()], rng)
    .slice(0, 3)
    .map((group) => shuffle(group, rng)[0].word);
  return { target: target.word, choices: shuffle([target.word, ...distractors], rng) };
}

/**
 * Generates a Find the Word playthrough of rounds (6 by default), each with a
 * unique target word, ordered easy-first like the builder: 3-letter words
 * lead, 4-letter words follow, random within each tier, no repeats. With the
 * default 6 rounds this yields five 3-letter rounds then one 4-letter round.
 *
 * The adaptive `shift` (-1 | 0 | 1) moves the tier split point: -1 serves an
 * all-3-letter ladder, +1 brings a second 4-letter round forward. The default
 * 0 reproduces the classic split exactly.
 *
 * `variant` restricts targets to one signature slide when it can satisfy the
 * tier split; otherwise the full `WORD_POOL` is used. Omitting it keeps the
 * classic full-pool draw byte-for-byte identical.
 *
 * `rng` must return a number in [0, 1); tests pass a seeded generator so a
 * draw is reproducible.
 */
export function generateWordPlaythrough(
  roundCount = 6,
  shift: BandShift = 0,
  rng: Rng = Math.random,
  variant?: WordVariant["id"],
): WordRound[] {
  const pool = wordPoolFor(roundCount, shift, variant);
  const tier3 = shuffle(
    pool.filter((entry) => entry.tier === 3),
    rng,
  );
  const tier4 = shuffle(
    pool.filter((entry) => entry.tier === 4),
    rng,
  );
  const earlyCount = Math.min(tier3.length, Math.max(0, roundCount - 1 - shift));
  return [...tier3.slice(0, earlyCount), ...tier4.slice(0, roundCount - earlyCount)]
    .slice(0, roundCount)
    .map((target) => generateWordRound(target, rng));
}

/**
 * Generates a Build the Word playthrough, easy-first: 3-letter words lead,
 * 4-letter words follow, random within each tier, no repeats. With the
 * default 3 words this yields two 3-letter words then one 4-letter word.
 *
 * The adaptive `shift` (-1 | 0 | 1) moves the tier split point: -1 serves an
 * all-3-letter ladder, +1 brings a second 4-letter build forward. The default
 * 0 reproduces the classic split exactly.
 *
 * `rng` must return a number in [0, 1); tests pass a seeded generator so a
 * draw is reproducible.
 */
export function generateWordBuildPlaythrough(
  wordCount = 3,
  shift: BandShift = 0,
  rng: Rng = Math.random,
): FirstWord[] {
  const tier3 = shuffle(
    WORD_POOL.filter((entry) => entry.tier === 3),
    rng,
  );
  const tier4 = shuffle(
    WORD_POOL.filter((entry) => entry.tier === 4),
    rng,
  );
  const earlyCount = Math.min(tier3.length, Math.max(0, wordCount - 1 - shift));
  return [...tier3.slice(0, earlyCount), ...tier4.slice(0, wordCount - earlyCount)].slice(
    0,
    wordCount,
  );
}

/**
 * Builds the 6 letter tiles for a word: the word's unique letters plus
 * 2–3 distractor letters not in the word, all shuffled.
 *
 * `rng` must return a number in [0, 1); tests pass a seeded generator so a
 * draw is reproducible.
 */
export function generateLetterTiles(word: string, rng: Rng = Math.random): string[] {
  const uniqueLetters = [...new Set(word.split(""))];
  const distractorCount = 6 - uniqueLetters.length;
  const wordLetters = new Set(uniqueLetters);
  const distractors = shuffle(
    ALPHABET.filter((letter) => !wordLetters.has(letter)),
    rng,
  ).slice(0, distractorCount);
  return shuffle([...uniqueLetters, ...distractors], rng);
}
