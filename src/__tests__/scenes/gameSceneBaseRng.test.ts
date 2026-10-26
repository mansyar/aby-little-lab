import { describe, expect, it, vi } from "vitest";

/**
 * Mock Phaser module: scene files extend Phaser.Scene, which at runtime
 * resolves to MockScene, so the base class can be instantiated directly.
 */
vi.mock("phaser", async () => {
  const { createPhaserModuleMock } = await import("../helpers/phaserMock");
  return createPhaserModuleMock().module;
});

/** Mock AudioManager: the base constructor resolves the singleton. */
const { mockAudio } = vi.hoisted(() => ({
  mockAudio: {
    setGameContext: vi.fn(),
    clearGameContext: vi.fn(),
  },
}));

vi.mock("../../audio/AudioManager", () => ({
  AudioManager: {
    getInstance: () => mockAudio,
  },
}));

import type { Rng } from "../../game/random";
import { GameSceneBase } from "../../scenes/GameSceneBase";
import { mulberry32 } from "../helpers/randomHelper";

/**
 * Concrete subclass for the abstract base. The rng stays `protected` in
 * production, so the seam is read through a getter rather than widened.
 */
class TestScene extends GameSceneBase {
  constructor(sceneKey = "TestScene", rng?: Rng) {
    super(sceneKey, rng);
  }

  getRng(): Rng {
    return this.rng;
  }
}

describe("GameSceneBase rng seam", () => {
  it("defaults to Math.random when no generator is supplied", () => {
    const scene = new TestScene();
    expect(scene.getRng()).toBe(Math.random);
  });

  it("retains an injected generator and draws from it", () => {
    const injected = mulberry32(1234);
    const scene = new TestScene("TestScene", injected);

    expect(scene.getRng()).toBe(injected);

    const sceneDraws = [scene.getRng()(), scene.getRng()()];
    const fresh = mulberry32(1234);
    expect(sceneDraws).toEqual([fresh(), fresh()]);
  });

  it("keeps the same generator reference across a shutdown and restart", () => {
    const injected = mulberry32(1234);
    const scene = new TestScene("TestScene", injected);

    scene.init();
    scene.events.emit("shutdown");
    scene.init();

    expect(scene.getRng()).toBe(injected);
  });
});
