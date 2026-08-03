import { describe, expect, it, vi } from "vitest";
import { ensureSceneLoaded, sceneLoaders } from "../../scenes/sceneRegistry";

/** Fake scene class returned by test loaders. */
class FakeScene {}

describe("sceneRegistry", () => {
  it("maps exactly the 10 game scene keys", () => {
    expect(Object.keys(sceneLoaders).sort()).toEqual([
      "Alphabet",
      "AnimalTrace",
      "BigSmall",
      "MusicalMemory",
      "PatternBuilder",
      "PopFreeze",
      "ShadowMatch",
      "ShapeSorter",
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
