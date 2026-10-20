import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type MockObject, mockRegistry } from "../helpers/phaserMock";

type MockFn = ReturnType<typeof vi.fn>;

/** Mock Phaser module: scene files extend `Phaser.Scene`, which resolves to MockScene. */
vi.mock("phaser", async () => {
  const { createPhaserModuleMock } = await import("../helpers/phaserMock");
  return createPhaserModuleMock().module;
});

const { mockAudio } = vi.hoisted(() => ({
  mockAudio: {
    init: vi.fn(),
    resume: vi.fn(),
    playBGM: vi.fn(),
    playCorrect: vi.fn(),
    playIncorrect: vi.fn(),
    playWin: vi.fn(),
    playSticker: vi.fn(),
    playPop: vi.fn(),
    playWake: vi.fn(),
    playFrogNote: vi.fn(),
    playIdleCall: vi.fn(),
  },
}));

vi.mock("../../audio/AudioManager", () => ({
  AudioManager: { getInstance: () => mockAudio },
}));

import { letters } from "../../game/art/letters";
import type { ArtGroup } from "../../game/art/types";
import { GameSceneBase } from "../../scenes/GameSceneBase";

/** Exposes the protected helper without changing production behaviour. */
class TestScene extends GameSceneBase {
  constructor() {
    super("PreloadArtTest");
  }

  showArt(groups: readonly ArtGroup[]): void {
    this.preloadArt(groups);
  }
}

/**
 * Gives the double a TextureManager holding every key, which is the shipped
 * state in this phase: the shell still ships all game art, so the registry
 * short-circuits and nothing is queued.
 */
function withPresentTextures(scene: TestScene): TestScene {
  (scene as unknown as { textures: { exists: (key: string) => boolean } }).textures = {
    exists: (): boolean => true,
  };
  return scene;
}

/** The cue's three dots — MockScene's `add.circle` labels its objects `circle`. */
function cueDots(): MockObject[] {
  return mockRegistry.filter((object) => object.kind === "circle");
}

/** The cue's mascot image — the only image this scene double creates. */
function cueMascots(): MockObject[] {
  return mockRegistry.filter((object) => object.kind === "image");
}

/** True when the object's `destroy` spy has fired. */
function wasDestroyed(object: MockObject): boolean {
  return spyOf(object, "destroy").mock.calls.length > 0;
}

/** A mock object's chainable method as an assertable spy. */
function spyOf(object: MockObject, method: string): MockFn {
  return object[method] as unknown as MockFn;
}

/** Runs the handler the scene registered on its loader for `event`. */
function emitLoaderEvent(scene: TestScene, event: string): void {
  const once = scene.load.once as unknown as MockFn;
  for (const call of once.mock.calls) {
    if (call[0] === event) {
      (call[1] as () => void)();
    }
  }
}

describe("GameSceneBase.preloadArt", () => {
  beforeEach(() => {
    mockRegistry.length = 0;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows the shared cue while the art loads", () => {
    const scene = withPresentTextures(new TestScene());

    scene.showArt([letters]);

    expect(cueDots()).toHaveLength(3);
    for (const dot of cueDots()) {
      expect(spyOf(dot, "setVisible")).toHaveBeenLastCalledWith(true);
    }
  });

  it("clears the cue when the loader finishes", () => {
    const scene = withPresentTextures(new TestScene());
    scene.showArt([letters]);

    emitLoaderEvent(scene, "complete");

    for (const dot of cueDots()) {
      expect(spyOf(dot, "setVisible")).toHaveBeenLastCalledWith(false);
    }
  });

  it("clears the cue on create, so an already-loaded scene shows nothing", () => {
    const scene = withPresentTextures(new TestScene());
    scene.showArt([letters]);

    scene.events.emit("create");

    for (const dot of cueDots()) {
      expect(spyOf(dot, "setVisible")).toHaveBeenLastCalledWith(false);
    }
  });

  it("builds one cue however many times a scene calls it", () => {
    const scene = withPresentTextures(new TestScene());

    scene.showArt([letters]);
    scene.showArt([letters]);

    expect(cueDots()).toHaveLength(3);
  });

  it("destroys the old cue on shutdown and builds one fresh cue on the next visit", () => {
    const scene = withPresentTextures(new TestScene());
    scene.showArt([letters]);

    const firstCue = [...cueDots(), ...cueMascots()];
    expect(firstCue).toHaveLength(4);
    expect(firstCue.filter(wasDestroyed)).toHaveLength(0);

    scene.events.emit("shutdown");

    // The cue's own shutdown hook frees its objects; the scene is a singleton,
    // so a leaked set would accumulate one cue per visit.
    expect(firstCue.filter(wasDestroyed)).toHaveLength(4);

    scene.showArt([letters]);

    // Exactly one live cue: three dots and a mascot, none of them the old ones.
    const live = mockRegistry.filter((object) => !wasDestroyed(object));
    expect(live.filter((object) => object.kind === "circle")).toHaveLength(3);
    expect(live.filter((object) => object.kind === "image")).toHaveLength(1);
    expect(live.some((object) => firstCue.includes(object))).toBe(false);
  });
});
