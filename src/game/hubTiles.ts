import type { GameId } from "../types";

export interface GameTile {
  sceneKey: string;
  gameId: GameId;
  label: string;
  /** Preloaded tile icon texture key (storybook-style SVG). */
  tileKey: string;
  /**
   * Optional smaller icon display size (px) for typography-heavy tiles whose
   * ink extends close to the bottom of the art; defaults to TILE_ICON_DISPLAY.
   */
  iconDisplay?: number;
  /** Optional raised icon offset for typography-heavy tiles (px). */
  iconOffsetY?: number;
}

export const GAME_TILES: readonly GameTile[] = [
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
];
