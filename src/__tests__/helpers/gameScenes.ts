import { AlphabetScene } from "../../scenes/AlphabetScene";
import { AnimalTraceScene } from "../../scenes/AnimalTraceScene";
import { BigSmallScene } from "../../scenes/BigSmallScene";
import { FeelingsFacesScene } from "../../scenes/FeelingsFacesScene";
import { FirstSoundsScene } from "../../scenes/FirstSoundsScene";
import { HowManyScene } from "../../scenes/HowManyScene";
import { MoreLessScene } from "../../scenes/MoreLessScene";
import { MusicalMemoryScene } from "../../scenes/MusicalMemoryScene";
import { PatternBuilderScene } from "../../scenes/PatternBuilderScene";
import { PopFreezeScene } from "../../scenes/PopFreezeScene";
import { ShadowMatchScene } from "../../scenes/ShadowMatchScene";
import { ShapeSorterScene } from "../../scenes/ShapeSorterScene";

/**
 * Scene registry tables shared by the scene-flow suites.
 *
 * Kept apart from `sceneFlowHarness` on purpose: that module is loaded from
 * inside `vi.mock` factories, so importing production scenes there would
 * deadlock the mock graph (harness -> scene -> mocked module -> harness).
 * This module is imported directly by test files, after the mocks are set.
 */

/** Every scene reachable from the hub, in suit order. */
export const GAME_SCENES = [
  { name: "ShapeSorterScene", SceneClass: ShapeSorterScene },
  { name: "AnimalTraceScene", SceneClass: AnimalTraceScene },
  { name: "PopFreezeScene", SceneClass: PopFreezeScene },
  { name: "ShadowMatchScene", SceneClass: ShadowMatchScene },
  { name: "MusicalMemoryScene", SceneClass: MusicalMemoryScene },
  { name: "BigSmallScene", SceneClass: BigSmallScene },
  { name: "PatternBuilderScene", SceneClass: PatternBuilderScene },
  { name: "AlphabetScene", SceneClass: AlphabetScene },
  { name: "HowManyScene", SceneClass: HowManyScene },
  { name: "FirstSoundsScene", SceneClass: FirstSoundsScene },
  { name: "MoreLessScene", SceneClass: MoreLessScene },
  { name: "FeelingsFacesScene", SceneClass: FeelingsFacesScene },
] as const;

/** Phaser scene keys registered by the game configuration. */
export const GAME_SCENE_KEYS = [
  "ShapeSorter",
  "AnimalTrace",
  "PopFreeze",
  "ShadowMatch",
  "MusicalMemory",
  "BigSmall",
  "PatternBuilder",
  "Alphabet",
  "WordMatch",
  "WordBuilder",
  "HowMany",
  "FirstSounds",
  "MoreLess",
  "OddOneOut",
  "ColorMatch",
  "AddItUp",
  "TakeAway",
  "MemoryMatch",
  "DecodeIt",
  "NumberOrder",
  "FeelingsFaces",
] as const;
