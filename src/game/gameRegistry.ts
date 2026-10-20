import type { GameId } from "../types";

/**
 * One game's identity and presentation, declared exactly once.
 *
 * Everything that needs to know which games exist — the Hub grid, the Learning
 * Progress rows, the paging maths, the shell preload table and the sticker-key
 * convention — reads this list; nothing else spells a game out.
 */
export interface GameRegistryEntry {
  /** Stable storage id, shared by stickers and per-game progress records. */
  readonly gameId: GameId;
  /** Phaser scene key, matching the loader table in `scene/sceneRegistry.ts`. */
  readonly sceneKey: string;
  /** Hub tile text. */
  readonly label: string;
  /** Preloaded Hub tile icon texture key (storybook-style SVG). */
  readonly tileKey: string;
  /** Preloaded sticker texture key, awarded on the first completion. */
  readonly stickerKey: string;
  /**
   * Optional smaller icon display size (px) for typography-heavy tiles whose
   * ink extends close to the bottom of the art; defaults to TILE_ICON_DISPLAY.
   */
  readonly iconDisplay?: number;
  /** Optional raised icon offset for typography-heavy tiles (px). */
  readonly iconOffsetY?: number;
}

/**
 * The 22 games in Hub order (PRD §2.2). The order is behaviour, not
 * presentation: it is the Hub grid order, the storage order and the order the
 * sticker shelf is filled in.
 *
 * Values are transcribed verbatim from the hand-written Hub tile list this
 * module replaces. That includes `alphabet-match` keeping `tile_alphabet` and
 * `sticker_alphabet_match`: its letter art is shared with the letter tiles, so
 * the tile key is deliberately short even though the sticker follows the usual
 * `sticker_<game id>` form.
 */
export const GAME_REGISTRY = [
  {
    gameId: "shape-sorter",
    sceneKey: "ShapeSorter",
    label: "Shape Sorter",
    tileKey: "tile_shape_sorter",
    stickerKey: "sticker_shape_sorter",
  },
  {
    gameId: "animal-trace",
    sceneKey: "AnimalTrace",
    label: "Animal Trace",
    tileKey: "tile_animal_trace",
    stickerKey: "sticker_animal_trace",
  },
  {
    gameId: "pop-freeze",
    sceneKey: "PopFreeze",
    label: "Pop & Freeze",
    tileKey: "tile_pop_freeze",
    stickerKey: "sticker_pop_freeze",
  },
  {
    gameId: "shadow-match",
    sceneKey: "ShadowMatch",
    label: "Shadow Match",
    tileKey: "tile_shadow_match",
    stickerKey: "sticker_shadow_match",
  },
  {
    gameId: "musical-memory",
    sceneKey: "MusicalMemory",
    label: "Musical Memory",
    tileKey: "tile_musical_memory",
    stickerKey: "sticker_musical_memory",
  },
  {
    gameId: "big-small",
    sceneKey: "BigSmall",
    label: "Big & Small",
    tileKey: "tile_big_small",
    stickerKey: "sticker_big_small",
  },
  {
    gameId: "pattern-builder",
    sceneKey: "PatternBuilder",
    label: "Pattern Builder",
    tileKey: "tile_pattern_builder",
    stickerKey: "sticker_pattern_builder",
  },
  {
    gameId: "alphabet-match",
    sceneKey: "Alphabet",
    label: "Find the Letter",
    tileKey: "tile_alphabet",
    stickerKey: "sticker_alphabet_match",
    iconDisplay: 52,
    iconOffsetY: -44,
  },
  {
    gameId: "word-match",
    sceneKey: "WordMatch",
    label: "Find the Word",
    tileKey: "tile_word_match",
    stickerKey: "sticker_word_match",
    iconDisplay: 52,
    iconOffsetY: -44,
  },
  {
    gameId: "word-builder",
    sceneKey: "WordBuilder",
    label: "Build the Word",
    tileKey: "tile_word_builder",
    stickerKey: "sticker_word_builder",
    iconDisplay: 52,
    iconOffsetY: -44,
  },
  {
    gameId: "how-many",
    sceneKey: "HowMany",
    label: "How Many?",
    tileKey: "tile_how_many",
    stickerKey: "sticker_how_many",
    iconDisplay: 52,
    iconOffsetY: -44,
  },
  {
    gameId: "first-sounds",
    sceneKey: "FirstSounds",
    label: "First Sounds",
    tileKey: "tile_first_sounds",
    stickerKey: "sticker_first_sounds",
    iconDisplay: 52,
    iconOffsetY: -44,
  },
  {
    gameId: "more-less",
    sceneKey: "MoreLess",
    label: "More or Less",
    tileKey: "tile_more_less",
    stickerKey: "sticker_more_less",
    iconDisplay: 52,
    iconOffsetY: -44,
  },
  {
    gameId: "odd-one-out",
    sceneKey: "OddOneOut",
    label: "Odd One Out",
    tileKey: "tile_odd_one_out",
    stickerKey: "sticker_odd_one_out",
    iconDisplay: 52,
    iconOffsetY: -44,
  },
  {
    gameId: "color-match",
    sceneKey: "ColorMatch",
    label: "Color Match",
    tileKey: "tile_color_match",
    stickerKey: "sticker_color_match",
    iconDisplay: 52,
    iconOffsetY: -44,
  },
  {
    gameId: "add-it-up",
    sceneKey: "AddItUp",
    label: "Add It Up",
    tileKey: "tile_add_it_up",
    stickerKey: "sticker_add_it_up",
    iconDisplay: 52,
    iconOffsetY: -44,
  },
  {
    gameId: "take-away",
    sceneKey: "TakeAway",
    label: "Take Away",
    tileKey: "tile_take_away",
    stickerKey: "sticker_take_away",
    iconDisplay: 52,
    iconOffsetY: -44,
  },
  {
    gameId: "memory-match",
    sceneKey: "MemoryMatch",
    label: "Memory Match",
    tileKey: "tile_memory_match",
    stickerKey: "sticker_memory_match",
    iconDisplay: 52,
    iconOffsetY: -44,
  },
  {
    gameId: "decode-it",
    sceneKey: "DecodeIt",
    label: "Decode It",
    tileKey: "tile_decode_it",
    stickerKey: "sticker_decode_it",
    iconDisplay: 52,
    iconOffsetY: -44,
  },
  {
    gameId: "number-order",
    sceneKey: "NumberOrder",
    label: "Number Order",
    tileKey: "tile_number_order",
    stickerKey: "sticker_number_order",
    iconDisplay: 52,
    iconOffsetY: -44,
  },
  {
    gameId: "feelings-faces",
    sceneKey: "FeelingsFaces",
    label: "Feelings Faces",
    tileKey: "tile_feelings_faces",
    stickerKey: "sticker_feelings_faces",
  },
  {
    gameId: "story-order",
    sceneKey: "StoryOrder",
    label: "Story Order",
    tileKey: "tile_story_order",
    stickerKey: "sticker_story_order",
  },
] as const satisfies readonly GameRegistryEntry[];

/** A `GameId` the registry forgot; `never` while every game has an entry. */
type MissingGameIds = Exclude<GameId, (typeof GAME_REGISTRY)[number]["gameId"]>;

/**
 * Compile-time coverage proof (FR-8). `Record<never, true>` is `{}`, so the
 * empty object below type-checks today; adding a `GameId` without a registry
 * entry turns that key into a required property and fails `pnpm typecheck`
 * naming the missing game, before any test runs.
 */
export const GAME_ID_COVERAGE: Record<MissingGameIds, true> = {};

/**
 * The sticker texture key for a game id, resolved from its registry entry.
 *
 * The `sticker_<game_id>` convention lives here once. `GameSceneBase` awards a
 * sticker by this key and `hubGrid` draws the shelf by it, so a game whose key
 * deliberately diverges from the convention (none today) can never be awarded
 * one texture and rendered from another.
 */
export function stickerKeyForGame(gameId: GameId): string {
  const entry = GAME_REGISTRY.find((game) => game.gameId === gameId);
  if (entry === undefined) {
    throw new Error(`no registry entry for game id: ${gameId}`);
  }
  return entry.stickerKey;
}
