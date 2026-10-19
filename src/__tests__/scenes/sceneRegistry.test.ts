import { describe, expect, it, vi } from "vitest";
import { AddItUpScene } from "../../scenes/AddItUpScene";
import { AlphabetScene } from "../../scenes/AlphabetScene";
import { AnimalTraceScene } from "../../scenes/AnimalTraceScene";
import { BigSmallScene } from "../../scenes/BigSmallScene";
import { ColorMatchScene } from "../../scenes/ColorMatchScene";
import { DecodeItScene } from "../../scenes/DecodeItScene";
import { FeelingsFacesScene } from "../../scenes/FeelingsFacesScene";
import { FirstSoundsScene } from "../../scenes/FirstSoundsScene";
import { HowManyScene } from "../../scenes/HowManyScene";
import { MemoryMatchScene } from "../../scenes/MemoryMatchScene";
import { MoreLessScene } from "../../scenes/MoreLessScene";
import { MusicalMemoryScene } from "../../scenes/MusicalMemoryScene";
import { NumberOrderScene } from "../../scenes/NumberOrderScene";
import { OddOneOutScene } from "../../scenes/OddOneOutScene";
import { PatternBuilderScene } from "../../scenes/PatternBuilderScene";
import { PopFreezeScene } from "../../scenes/PopFreezeScene";
import { ShadowMatchScene } from "../../scenes/ShadowMatchScene";
import { ShapeSorterScene } from "../../scenes/ShapeSorterScene";
import { ensureSceneLoaded, sceneLoaders } from "../../scenes/sceneRegistry";
import { TakeAwayScene } from "../../scenes/TakeAwayScene";
import { WordBuilderScene } from "../../scenes/WordBuilderScene";
import { WordMatchScene } from "../../scenes/WordMatchScene";

/**
 * Stub the 21 scene modules so invoking the real dynamic-import loaders
 * never pulls Phaser scenes into happy-dom — each loader should resolve
 * to its module's named scene export.
 */
vi.mock("../../scenes/ShapeSorterScene", () => ({
  ShapeSorterScene: class ShapeSorterSceneStub {},
}));
vi.mock("../../scenes/AnimalTraceScene", () => ({
  AnimalTraceScene: class AnimalTraceSceneStub {},
}));
vi.mock("../../scenes/PopFreezeScene", () => ({
  PopFreezeScene: class PopFreezeSceneStub {},
}));
vi.mock("../../scenes/ShadowMatchScene", () => ({
  ShadowMatchScene: class ShadowMatchSceneStub {},
}));
vi.mock("../../scenes/MusicalMemoryScene", () => ({
  MusicalMemoryScene: class MusicalMemorySceneStub {},
}));
vi.mock("../../scenes/BigSmallScene", () => ({
  BigSmallScene: class BigSmallSceneStub {},
}));
vi.mock("../../scenes/PatternBuilderScene", () => ({
  PatternBuilderScene: class PatternBuilderSceneStub {},
}));
vi.mock("../../scenes/AlphabetScene", () => ({
  AlphabetScene: class AlphabetSceneStub {},
}));
vi.mock("../../scenes/WordMatchScene", () => ({
  WordMatchScene: class WordMatchSceneStub {},
}));
vi.mock("../../scenes/WordBuilderScene", () => ({
  WordBuilderScene: class WordBuilderSceneStub {},
}));
vi.mock("../../scenes/HowManyScene", () => ({
  HowManyScene: class HowManySceneStub {},
}));
vi.mock("../../scenes/FirstSoundsScene", () => ({
  FirstSoundsScene: class FirstSoundsSceneStub {},
}));
vi.mock("../../scenes/MoreLessScene", () => ({
  MoreLessScene: class MoreLessSceneStub {},
}));
vi.mock("../../scenes/OddOneOutScene", () => ({
  OddOneOutScene: class OddOneOutSceneStub {},
}));
vi.mock("../../scenes/ColorMatchScene", () => ({
  ColorMatchScene: class ColorMatchSceneStub {},
}));
vi.mock("../../scenes/AddItUpScene", () => ({
  AddItUpScene: class AddItUpSceneStub {},
}));
vi.mock("../../scenes/TakeAwayScene", () => ({
  TakeAwayScene: class TakeAwaySceneStub {},
}));
vi.mock("../../scenes/MemoryMatchScene", () => ({
  MemoryMatchScene: class MemoryMatchSceneStub {},
}));
vi.mock("../../scenes/DecodeItScene", () => ({
  DecodeItScene: class DecodeItSceneStub {},
}));
vi.mock("../../scenes/NumberOrderScene", () => ({
  NumberOrderScene: class NumberOrderSceneStub {},
}));
vi.mock("../../scenes/FeelingsFacesScene", () => ({
  FeelingsFacesScene: class FeelingsFacesSceneStub {},
}));

/** Fake scene class returned by test loaders. */
class FakeScene {}

describe("sceneRegistry", () => {
  it("maps exactly the 21 game scene keys", () => {
    expect(Object.keys(sceneLoaders).sort()).toEqual([
      "AddItUp",
      "Alphabet",
      "AnimalTrace",
      "BigSmall",
      "ColorMatch",
      "DecodeIt",
      "FeelingsFaces",
      "FirstSounds",
      "HowMany",
      "MemoryMatch",
      "MoreLess",
      "MusicalMemory",
      "NumberOrder",
      "OddOneOut",
      "PatternBuilder",
      "PopFreeze",
      "ShadowMatch",
      "ShapeSorter",
      "TakeAway",
      "WordBuilder",
      "WordMatch",
    ]);
  });

  it("does not import or add a scene that is already registered", async () => {
    const loader = vi.fn(async () => FakeScene);
    const add = vi.fn();
    const scene = {
      scene: {
        get: () => ({}) as unknown,
        add,
      },
    };

    await ensureSceneLoaded(scene as never, "ShapeSorter", {
      ShapeSorter: loader,
    });

    expect(loader).not.toHaveBeenCalled();
    expect(add).not.toHaveBeenCalled();
  });

  it("dynamically imports and registers a scene that is not yet registered", async () => {
    const loader = vi.fn(async () => FakeScene);
    const add = vi.fn();
    const scene = {
      scene: {
        get: () => null as unknown,
        add,
      },
    };

    await ensureSceneLoaded(scene as never, "ShapeSorter", {
      ShapeSorter: loader,
    });

    expect(loader).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledWith("ShapeSorter", FakeScene);
  });

  it("each loader resolves its scene module's named export", async () => {
    const expectedByKey: Record<string, unknown> = {
      ShapeSorter: ShapeSorterScene,
      AnimalTrace: AnimalTraceScene,
      PopFreeze: PopFreezeScene,
      ShadowMatch: ShadowMatchScene,
      MusicalMemory: MusicalMemoryScene,
      BigSmall: BigSmallScene,
      PatternBuilder: PatternBuilderScene,
      Alphabet: AlphabetScene,
      WordMatch: WordMatchScene,
      WordBuilder: WordBuilderScene,
      HowMany: HowManyScene,
      FirstSounds: FirstSoundsScene,
      MoreLess: MoreLessScene,
      OddOneOut: OddOneOutScene,
      ColorMatch: ColorMatchScene,
      AddItUp: AddItUpScene,
      TakeAway: TakeAwayScene,
      MemoryMatch: MemoryMatchScene,
      DecodeIt: DecodeItScene,
      NumberOrder: NumberOrderScene,
      FeelingsFaces: FeelingsFacesScene,
    };

    expect(Object.keys(sceneLoaders).sort()).toEqual(Object.keys(expectedByKey).sort());
    for (const [key, expected] of Object.entries(expectedByKey)) {
      await expect(sceneLoaders[key]()).resolves.toBe(expected);
    }
  });

  it("registers only once when two loads race for the same scene", async () => {
    let releaseGate!: () => void;
    const gate = new Promise<void>((resolve) => {
      releaseGate = resolve;
    });
    const loader = vi.fn(async () => {
      await gate;
      return FakeScene;
    });
    const registered = new Map<string, unknown>();
    const add = vi.fn((key: string, sceneClass: unknown) => {
      registered.set(key, sceneClass);
    });
    const scene = {
      scene: {
        get: (key: string) => registered.get(key) ?? null,
        add,
      },
    };

    const first = ensureSceneLoaded(scene as never, "ShapeSorter", {
      ShapeSorter: loader,
    });
    const second = ensureSceneLoaded(scene as never, "ShapeSorter", {
      ShapeSorter: loader,
    });
    releaseGate();
    await Promise.all([first, second]);

    // Both taps imported the chunk, but the scene is registered only once.
    expect(loader).toHaveBeenCalledTimes(2);
    expect(add).toHaveBeenCalledTimes(1);
  });
});
