import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BoxInstance, ToyInstance } from "../../game/bigSmallLogic";
import { BigSmallScene } from "../../scenes/BigSmallScene";

/**
 * Mock Phaser module (same pattern as shapeSorterScene.test.ts). Scene files
 * extend Phaser.Scene, which at runtime resolves to MockScene; every instance
 * gets fresh mock methods, enabling per-test isolation.
 */
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

const { mockMascot } = vi.hoisted(() => ({
  mockMascot: { cheer: vi.fn(), curious: vi.fn(), nod: vi.fn(), destroy: vi.fn() },
}));

vi.mock("../../components/Mascot", () => ({
  createCornerMascot: () => mockMascot,
}));

const { mockParentLockInstances } = vi.hoisted(() => ({
  mockParentLockInstances: [] as unknown[],
}));

vi.mock("../../components/ParentLock", () => ({
  ParentLock: class {
    constructor(opts: unknown) {
      mockParentLockInstances.push(opts);
    }
    destroy(): void {}
  },
}));

const { getAdaptiveBandShiftMock, generateRoundMock } = vi.hoisted(() => ({
  getAdaptiveBandShiftMock: vi.fn((_gameId: string): -1 | 0 | 1 => 0),
  generateRoundMock: vi.fn(),
}));

vi.mock("../../utils/storage", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  getAdaptiveBandShift: (gameId: string) => getAdaptiveBandShiftMock(gameId),
}));

vi.mock("../../game/bigSmallLogic", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../game/bigSmallLogic")>();
  return {
    ...actual,
    generateRound: (...args: Parameters<typeof actual.generateRound>) => {
      generateRoundMock(...args);
      return actual.generateRound(...args);
    },
  };
});

interface SceneInternals {
  round: { toys: ToyInstance[]; boxes: BoxInstance[] };
}

function getInternals(scene: BigSmallScene): SceneInternals {
  return scene as unknown as SceneInternals;
}

function createScene(): BigSmallScene {
  const scene = new BigSmallScene();
  scene.create();
  return scene;
}

describe("BigSmallScene adaptive band wiring", () => {
  beforeEach(() => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    localStorage.clear();
    vi.clearAllMocks();
    getAdaptiveBandShiftMock.mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("samples the band shift once in create() and passes the hard band's factors to generateRound", () => {
    getAdaptiveBandShiftMock.mockReturnValue(1);
    const scene = createScene();
    expect(getAdaptiveBandShiftMock).toHaveBeenCalledTimes(1);
    expect(getAdaptiveBandShiftMock).toHaveBeenCalledWith("big-small");
    expect(generateRoundMock).toHaveBeenCalledTimes(1);
    expect(generateRoundMock).toHaveBeenCalledWith({ big: 1.35, small: 0.8 });
    expect(getInternals(scene).round.toys).toHaveLength(6);
  });

  it("passes the classic 1.5/0.7 factors when the facade returns 0", () => {
    const scene = createScene();
    expect(getAdaptiveBandShiftMock).toHaveBeenCalledWith("big-small");
    expect(generateRoundMock).toHaveBeenCalledTimes(1);
    expect(generateRoundMock).toHaveBeenCalledWith({ big: 1.5, small: 0.7 });
    expect(getInternals(scene).round.boxes).toHaveLength(2);
  });

  it("passes the easy band's wider factors into the round", () => {
    getAdaptiveBandShiftMock.mockReturnValue(-1);
    const scene = createScene();
    expect(generateRoundMock).toHaveBeenCalledWith({ big: 1.6, small: 0.68 });
    for (const toy of getInternals(scene).round.toys) {
      expect(toy.scale).toBe(toy.scaleCategory === "big" ? 1.6 : 0.68);
    }
  });
});
