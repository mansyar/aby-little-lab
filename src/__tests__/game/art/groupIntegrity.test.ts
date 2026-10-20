import { describe, expect, it } from "vitest";
import {
  type ArtGroup,
  type ArtGroupId,
  animals,
  cutouts,
  faces,
  food,
  glyphs,
  items,
  letters,
  music,
  numerals,
  shadows,
  shapes,
  toys,
} from "../../../game/art";
import { toDataUri } from "../../../utils/svgDataUri";

/**
 * The twelve groups with their documented key counts (spec: Art Group
 * Inventory). Written out here so a module that silently loses or gains a key
 * fails instead of quietly redefining the inventory.
 */
const GROUP_INVENTORY: ReadonlyArray<readonly [ArtGroupId, number]> = [
  ["shapes", 18],
  ["cutouts", 18],
  ["letters", 26],
  ["numerals", 10],
  ["animals", 6],
  ["food", 6],
  ["items", 16],
  ["shadows", 8],
  ["toys", 7],
  ["faces", 4],
  ["music", 4],
  ["glyphs", 8],
];

const GROUPS: readonly ArtGroup[] = [
  shapes,
  cutouts,
  letters,
  numerals,
  animals,
  food,
  items,
  shadows,
  toys,
  faces,
  music,
  glyphs,
];

/**
 * The shell set the boot preloader keeps (FR-4): 22 tiles, 22 stickers, two
 * mascot poses, the speaker glyph and the six avatar keys. Spelled out
 * explicitly — the avatar keys are the deliberate shell/game overlap, so the
 * union cannot be derived by prefix.
 */
const SHELL_KEYS: readonly string[] = [
  "tile_shape_sorter",
  "tile_animal_trace",
  "tile_pop_freeze",
  "tile_shadow_match",
  "tile_musical_memory",
  "tile_big_small",
  "tile_first_sounds",
  "tile_pattern_builder",
  "tile_alphabet",
  "tile_word_match",
  "tile_word_builder",
  "tile_how_many",
  "tile_more_less",
  "tile_odd_one_out",
  "tile_color_match",
  "tile_add_it_up",
  "tile_take_away",
  "tile_memory_match",
  "tile_decode_it",
  "tile_number_order",
  "tile_story_order",
  "tile_feelings_faces",
  "sticker_shape_sorter",
  "sticker_animal_trace",
  "sticker_pop_freeze",
  "sticker_shadow_match",
  "sticker_musical_memory",
  "sticker_big_small",
  "sticker_first_sounds",
  "sticker_pattern_builder",
  "sticker_word_match",
  "sticker_word_builder",
  "sticker_alphabet_match",
  "sticker_how_many",
  "sticker_more_less",
  "sticker_odd_one_out",
  "sticker_color_match",
  "sticker_add_it_up",
  "sticker_take_away",
  "sticker_memory_match",
  "sticker_decode_it",
  "sticker_number_order",
  "sticker_story_order",
  "sticker_feelings_faces",
  "mascot_idle",
  "mascot_celebrate",
  "icon_speaker",
  "animal_cat",
  "animal_dog",
  "animal_pig",
  "frog_red",
  "sm_duck",
  "toy_teddy_bear",
];

/** How many SVGs the boot preloader carries today (the canonical 178). */
const SHELL_ASSET_COUNT = 178;

const AVATAR_KEYS: readonly string[] = [
  "animal_cat",
  "animal_dog",
  "animal_pig",
  "frog_red",
  "sm_duck",
  "toy_teddy_bear",
];

const groupKeys = (group: ArtGroup): string[] => group.assets.map((asset) => asset.key);
const allGroupKeys = GROUPS.flatMap(groupKeys);

describe("art group inventory", () => {
  it("exposes the twelve groups with their documented key counts", () => {
    expect(GROUPS.map((group) => group.id)).toEqual(GROUP_INVENTORY.map(([id]) => id));

    for (const [id, count] of GROUP_INVENTORY) {
      const group = GROUPS.find((candidate) => candidate.id === id);
      expect(group, id).toBeDefined();
      expect(group?.assets.length, id).toBe(count);
    }
  });

  it("is a frozen table, so a scene cannot mutate another game's art", () => {
    for (const group of GROUPS) {
      expect(Object.isFrozen(group), group.id).toBe(true);
      expect(Object.isFrozen(group.assets), group.id).toBe(true);
    }
  });

  it("holds non-empty SVG markup for every asset", () => {
    for (const group of GROUPS) {
      expect(group.assets.length, group.id).toBeGreaterThan(0);
      for (const asset of group.assets) {
        expect(asset.svg.length, asset.key).toBeGreaterThan(0);
        expect(asset.svg.trimStart().startsWith("<svg"), asset.key).toBe(true);
        expect(asset.svg.trimEnd().endsWith("</svg>"), asset.key).toBe(true);
        expect(() => toDataUri(asset.svg), asset.key).not.toThrow();
      }
    }
  });

  it("uses well-formed keys, unique within each group", () => {
    for (const group of GROUPS) {
      const keys = groupKeys(group);
      expect(new Set(keys).size, group.id).toBe(keys.length);
      for (const key of keys) {
        expect(key, group.id).toMatch(/^[a-z0-9_]+$/);
      }
    }
  });

  it("assigns every key to exactly one group", () => {
    const seen = new Map<string, ArtGroupId>();
    for (const group of GROUPS) {
      for (const key of groupKeys(group)) {
        const owner = seen.get(key);
        expect(owner, `${key} is in both ${String(owner)} and ${group.id}`).toBeUndefined();
        seen.set(key, group.id);
      }
    }

    expect(new Set(allGroupKeys).size).toBe(allGroupKeys.length);
  });

  it("leaves exactly the 53 shell keys outside the groups, for 178 in total", () => {
    const groupKeySet = new Set(allGroupKeys);
    const shellOverlaps = SHELL_KEYS.filter((key) => groupKeySet.has(key));

    expect(SHELL_KEYS).toHaveLength(53);
    expect(new Set(SHELL_KEYS).size).toBe(SHELL_KEYS.length);
    // The six avatars are the only keys the shell and a game group share.
    expect(shellOverlaps.sort()).toEqual([...AVATAR_KEYS].sort());

    const union = new Set([...allGroupKeys, ...SHELL_KEYS]);
    expect(union.size).toBe(SHELL_ASSET_COUNT);
  });
});
