import { shuffle } from "./shapeSorterLogic";

/** Visual category used to pick group/odd textures and define difficulty bands. */
export type OddCategory = "animal" | "frog" | "toy" | "shape";

/** One pool entry: a registered PreloadScene texture and its category. */
export interface OddItem {
  /** PreloadScene texture key. */
  texture: string;
  /** Category the texture belongs to. */
  category: OddCategory;
}

/** The three non-frog animal textures (frogs live in FROG_ITEMS). */
export const ANIMAL_ITEMS: readonly OddItem[] = [
  { texture: "animal_cat", category: "animal" },
  { texture: "animal_dog", category: "animal" },
  { texture: "animal_elephant", category: "animal" },
  { texture: "animal_monkey", category: "animal" },
  { texture: "animal_pig", category: "animal" },
  { texture: "animal_rabbit", category: "animal" },
];

/** The three frog color variants — the "hard" band discriminates by color only. */
export const FROG_ITEMS: readonly OddItem[] = [
  { texture: "frog_green", category: "frog" },
  { texture: "frog_blue", category: "frog" },
  { texture: "frog_red", category: "frog" },
];

/** Toy textures. */
export const TOY_ITEMS: readonly OddItem[] = [
  { texture: "toy_teddy_bear", category: "toy" },
  { texture: "toy_car", category: "toy" },
  { texture: "toy_rocket", category: "toy" },
  { texture: "toy_drum", category: "toy" },
  { texture: "toy_ball", category: "toy" },
  { texture: "toy_block", category: "toy" },
];

/** Shape textures (excluding shapes that read as category labels). */
export const SHAPE_ITEMS: readonly OddItem[] = [
  { texture: "shape_circle", category: "shape" },
  { texture: "shape_square", category: "shape" },
  { texture: "shape_triangle", category: "shape" },
  { texture: "shape_star", category: "shape" },
  { texture: "shape_heart", category: "shape" },
  { texture: "shape_crescent", category: "shape" },
  { texture: "shape_diamond", category: "shape" },
  { texture: "shape_hexagon", category: "shape" },
  { texture: "shape_octagon", category: "shape" },
  { texture: "shape_oval", category: "shape" },
  { texture: "shape_pentagon", category: "shape" },
  { texture: "shape_plus", category: "shape" },
  { texture: "shape_rectangle", category: "shape" },
  { texture: "shape_ring", category: "shape" },
  { texture: "shape_semicircle", category: "shape" },
  { texture: "shape_teardrop", category: "shape" },
  { texture: "shape_trapezoid", category: "shape" },
  { texture: "shape_arrow", category: "shape" },
];

/** All item textures usable in Odd One Out rounds. */
export const ODD_ITEMS: readonly OddItem[] = [
  ...ANIMAL_ITEMS,
  ...FROG_ITEMS,
  ...TOY_ITEMS,
  ...SHAPE_ITEMS,
];

/** Spoken word (or phrase) for each texture, used for the TTS prompt. */
const PROMPT_WORDS: Readonly<Record<string, string>> = {
  animal_cat: "cat",
  animal_dog: "dog",
  animal_elephant: "elephant",
  animal_monkey: "monkey",
  animal_pig: "pig",
  animal_rabbit: "rabbit",
  frog_green: "green frog",
  frog_blue: "blue frog",
  frog_red: "red frog",
  toy_teddy_bear: "teddy bear",
  toy_car: "car",
  toy_rocket: "rocket",
  toy_drum: "drum",
  toy_ball: "ball",
  toy_block: "block",
  shape_circle: "circle",
  shape_square: "square",
  shape_triangle: "triangle",
  shape_star: "star",
  shape_heart: "heart",
  shape_crescent: "crescent",
  shape_diamond: "diamond",
  shape_hexagon: "hexagon",
  shape_octagon: "octagon",
  shape_oval: "oval",
  shape_pentagon: "pentagon",
  shape_plus: "plus",
  shape_rectangle: "rectangle",
  shape_ring: "ring",
  shape_semicircle: "semicircle",
  shape_teardrop: "teardrop",
  shape_trapezoid: "trapezoid",
  shape_arrow: "arrow",
};

/** Returns the spoken prompt word for a texture (falls back to the key). */
export function promptFor(texture: string): string {
  return PROMPT_WORDS[texture] ?? texture;
}

/**
 * A single Odd One Out round: three cards share `groupTexture`, one card
 * (at `oddSlot` in the 2×2 grid, slot order top-left, top-right,
 * bottom-left, bottom-right) holds `oddTexture` — the answer.
 */
export interface OddOneRound {
  /** Texture of the three identical cards. */
  groupTexture: string;
  /** Texture of the odd one out — the answer. */
  oddTexture: string;
  /** Grid slot (0-3) holding the odd card. */
  oddSlot: number;
}

/** Picks a random item from a pool, excluding a given texture and used odds. */
function pickItem(
  pool: readonly OddItem[],
  usedOddTextures: ReadonlySet<string>,
  excludeTexture?: string,
): OddItem {
  const candidates = shuffle(pool).find(
    (item) => item.texture !== excludeTexture && !usedOddTextures.has(item.texture),
  );
  if (!candidates) {
    // Only reachable if a caller passes a fully consumed pool (misuse).
    throw new Error("Odd One Out pool exhausted for the requested band");
  }
  return candidates;
}

/**
 * Builds one round for a band. `usedOddTextures` holds odd textures already
 * drawn in the playthrough — the new round's odd texture never repeats one.
 *
 * - Band 1 (easy): the odd one is from a DIFFERENT category than the group.
 * - Band 2 (mid): same category, a different item (frogs excluded).
 * - Band 3 (hard): the same frog in a different color.
 */
export function createRound(
  band: 1 | 2 | 3,
  usedOddTextures: ReadonlySet<string> = new Set(),
): OddOneRound {
  const oddSlot = Math.floor(Math.random() * 4);

  if (band === 3) {
    const odd = pickItem(FROG_ITEMS, usedOddTextures);
    const group = pickItem(FROG_ITEMS, usedOddTextures, odd.texture);
    return { groupTexture: group.texture, oddTexture: odd.texture, oddSlot };
  }

  if (band === 2) {
    const categoryPool = shuffle([ANIMAL_ITEMS, TOY_ITEMS, SHAPE_ITEMS])[0];
    const odd = pickItem(categoryPool, usedOddTextures);
    const group = pickItem(categoryPool, usedOddTextures, odd.texture);
    return { groupTexture: group.texture, oddTexture: odd.texture, oddSlot };
  }

  // Band 1: pick the odd from a NON-frog category first (frogs are reserved
  // for band 3's color variants), then a different category for the group.
  const nonFrogItems = ODD_ITEMS.filter((item) => item.category !== "frog");
  const odd = pickItem(nonFrogItems, usedOddTextures);
  const otherCategories = nonFrogItems.filter((item) => item.category !== odd.category);
  const group = pickItem(otherCategories, usedOddTextures);
  return { groupTexture: group.texture, oddTexture: odd.texture, oddSlot };
}

/**
 * Generates a playthrough of 6 rounds, easy-first: 2 rounds per band
 * (cross-category, then same-category different item, then frog color
 * variants). The odd texture is unique across the playthrough. Difficulty
 * is fixed across replays.
 */
export function createPlaythrough(): OddOneRound[] {
  const bands = [1, 1, 2, 2, 3, 3] as const;
  const usedOddTextures = new Set<string>();
  return bands.map((band) => {
    const round = createRound(band, usedOddTextures);
    usedOddTextures.add(round.oddTexture);
    return round;
  });
}

/** Returns whether the tapped grid slot holds the odd card. */
export function isCorrect(round: OddOneRound, slot: number): boolean {
  return slot === round.oddSlot;
}
