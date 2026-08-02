import { describe, expect, it, vi } from "vitest";
import { ensureSceneLoaded, sceneLoaders } from "../../scenes/sceneRegistry";

/** Fake scene class returned by test loaders. */
class FakeScene {}

describe("sceneRegistry", () => {
  it("maps exactly the 7 game scene keys", () => {
    expect(Object.keys(sceneLoaders).sort()).toEqual([
      "AnimalTrace",
      "BigSmall",
      "MusicalMemory",
      "PatternBuilder",
      "PopFreeze",
      "ShadowMatch",
      "ShapeSorter",
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
});
