import { describe, expect, it } from "vitest";
import { GAME_REGISTRY, stickerKeyForGame } from "../game/gameRegistry";
import registrySource from "../game/gameRegistry.ts?raw";
import { GAME_TILES, type GameTile } from "../game/hubTiles";
import type { GameId } from "../types";

/**
 * Registry and derived-tile guards (FR-1, FR-2, FR-8).
 *
 * The registry is the single declaration of the 22 games, so this suite holds
 * the contract in three directions: the declaration itself (order, uniqueness,
 * purity), the derived `GAME_TILES` against the exact pre-registry array, and
 * the type-level coverage proof that lives in the module (a missing `GameId`
 * fails `pnpm typecheck`, which no runtime assertion can observe).
 */

/** PRD §2.2 order — the Hub grid order the registry must reproduce. */
const PRD_ORDER: readonly GameId[] = [
  "shape-sorter",
  "animal-trace",
  "pop-freeze",
  "shadow-match",
  "musical-memory",
  "big-small",
  "pattern-builder",
  "alphabet-match",
  "word-match",
  "word-builder",
  "how-many",
  "first-sounds",
  "more-less",
  "odd-one-out",
  "color-match",
  "add-it-up",
  "take-away",
  "memory-match",
  "decode-it",
  "number-order",
  "feelings-faces",
  "story-order",
];

/**
 * `GAME_TILES` exactly as it was hand-written before the registry existed,
 * frozen here as the behaviour-preservation golden copy. Property presence
 * matters: a tile without an icon override must not gain an `iconDisplay: 0`.
 */
const PRE_TRACK_GAME_TILES: readonly GameTile[] = [
  {
    sceneKey: "ShapeSorter",
    gameId: "shape-sorter",
    label: "Shape Sorter",
    tileKey: "tile_shape_sorter",
  },
  {
    sceneKey: "AnimalTrace",
    gameId: "animal-trace",
    label: "Animal Trace",
    tileKey: "tile_animal_trace",
  },
  {
    sceneKey: "PopFreeze",
    gameId: "pop-freeze",
    label: "Pop & Freeze",
    tileKey: "tile_pop_freeze",
  },
  {
    sceneKey: "ShadowMatch",
    gameId: "shadow-match",
    label: "Shadow Match",
    tileKey: "tile_shadow_match",
  },
  {
    sceneKey: "MusicalMemory",
    gameId: "musical-memory",
    label: "Musical Memory",
    tileKey: "tile_musical_memory",
  },
  { sceneKey: "BigSmall", gameId: "big-small", label: "Big & Small", tileKey: "tile_big_small" },
  {
    sceneKey: "PatternBuilder",
    gameId: "pattern-builder",
    label: "Pattern Builder",
    tileKey: "tile_pattern_builder",
  },
  {
    sceneKey: "Alphabet",
    gameId: "alphabet-match",
    label: "Find the Letter",
    tileKey: "tile_alphabet",
    iconDisplay: 52,
    iconOffsetY: -44,
  },
  {
    sceneKey: "WordMatch",
    gameId: "word-match",
    label: "Find the Word",
    tileKey: "tile_word_match",
    iconDisplay: 52,
    iconOffsetY: -44,
  },
  {
    sceneKey: "WordBuilder",
    gameId: "word-builder",
    label: "Build the Word",
    tileKey: "tile_word_builder",
    iconDisplay: 52,
    iconOffsetY: -44,
  },
  {
    sceneKey: "HowMany",
    gameId: "how-many",
    label: "How Many?",
    tileKey: "tile_how_many",
    iconDisplay: 52,
    iconOffsetY: -44,
  },
  {
    sceneKey: "FirstSounds",
    gameId: "first-sounds",
    label: "First Sounds",
    tileKey: "tile_first_sounds",
    iconDisplay: 52,
    iconOffsetY: -44,
  },
  {
    sceneKey: "MoreLess",
    gameId: "more-less",
    label: "More or Less",
    tileKey: "tile_more_less",
    iconDisplay: 52,
    iconOffsetY: -44,
  },
  {
    sceneKey: "OddOneOut",
    gameId: "odd-one-out",
    label: "Odd One Out",
    tileKey: "tile_odd_one_out",
    iconDisplay: 52,
    iconOffsetY: -44,
  },
  {
    sceneKey: "ColorMatch",
    gameId: "color-match",
    label: "Color Match",
    tileKey: "tile_color_match",
    iconDisplay: 52,
    iconOffsetY: -44,
  },
  {
    sceneKey: "AddItUp",
    gameId: "add-it-up",
    label: "Add It Up",
    tileKey: "tile_add_it_up",
    iconDisplay: 52,
    iconOffsetY: -44,
  },
  {
    sceneKey: "TakeAway",
    gameId: "take-away",
    label: "Take Away",
    tileKey: "tile_take_away",
    iconDisplay: 52,
    iconOffsetY: -44,
  },
  {
    sceneKey: "MemoryMatch",
    gameId: "memory-match",
    label: "Memory Match",
    tileKey: "tile_memory_match",
    iconDisplay: 52,
    iconOffsetY: -44,
  },
  {
    sceneKey: "DecodeIt",
    gameId: "decode-it",
    label: "Decode It",
    tileKey: "tile_decode_it",
    iconDisplay: 52,
    iconOffsetY: -44,
  },
  {
    sceneKey: "NumberOrder",
    gameId: "number-order",
    label: "Number Order",
    tileKey: "tile_number_order",
    iconDisplay: 52,
    iconOffsetY: -44,
  },
  {
    sceneKey: "FeelingsFaces",
    gameId: "feelings-faces",
    label: "Feelings Faces",
    tileKey: "tile_feelings_faces",
  },
  {
    sceneKey: "StoryOrder",
    gameId: "story-order",
    label: "Story Order",
    tileKey: "tile_story_order",
  },
];

/** Every `from "…"` specifier in a module's source text. */
const IMPORT_SPECIFIER = /from\s+"([^"]+)"/g;

/** A value import, as opposed to `import type`. */
const VALUE_IMPORT = /^import\s+(?!type\b)/m;

/**
 * Asserts `values` holds no repeats, naming the field and the offending value
 * so a duplicate fails with the game key in the message rather than a bare
 * count mismatch.
 */
function expectUnique(field: string, values: readonly string[]): void {
  const seen = new Set<string>();
  for (const value of values) {
    expect(seen.has(value), `duplicate ${field}: ${value}`).toBe(false);
    seen.add(value);
  }
}

describe("GAME_REGISTRY", () => {
  it("declares the games in PRD §2.2 order", () => {
    expect(GAME_REGISTRY.map((entry) => entry.gameId)).toEqual(PRD_ORDER);
  });

  it("declares each gameId, sceneKey, tileKey and stickerKey once", () => {
    expectUnique(
      "gameId",
      GAME_REGISTRY.map((entry) => entry.gameId),
    );
    expectUnique(
      "sceneKey",
      GAME_REGISTRY.map((entry) => entry.sceneKey),
    );
    expectUnique(
      "tileKey",
      GAME_REGISTRY.map((entry) => entry.tileKey),
    );
    expectUnique(
      "stickerKey",
      GAME_REGISTRY.map((entry) => entry.stickerKey),
    );
  });

  it("stays pure data: the only import is the GameId type", () => {
    const specifiers = [...registrySource.matchAll(IMPORT_SPECIFIER)].map((match) => match[1]);
    expect(specifiers).toEqual(["../types"]);
    expect(registrySource).not.toMatch(VALUE_IMPORT);
  });
});

describe("GAME_TILES", () => {
  it("derives the pre-registry tiles unchanged, icon overrides included", () => {
    expect(GAME_TILES).toStrictEqual(PRE_TRACK_GAME_TILES);
  });

  it("holds one tile per registry entry", () => {
    expect(GAME_TILES).toHaveLength(GAME_REGISTRY.length);
  });
});

describe("stickerKeyForGame", () => {
  it("resolves the registry sticker key for every game", () => {
    for (const game of GAME_REGISTRY) {
      expect(stickerKeyForGame(game.gameId)).toBe(game.stickerKey);
    }
  });

  it("keeps the documented convention and its one divergence", () => {
    expect(stickerKeyForGame("more-less")).toBe("sticker_more_less");
    // Find the Letter shares the alphabet art, so its key is shortened.
    expect(stickerKeyForGame("alphabet-match")).toBe("sticker_alphabet_match");
  });

  it("throws for a game id the registry does not know", () => {
    expect(() => stickerKeyForGame("not-a-game" as GameId)).toThrow(
      /no registry entry for game id: not-a-game/,
    );
  });
});
