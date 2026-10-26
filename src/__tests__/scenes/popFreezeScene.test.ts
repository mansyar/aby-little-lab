import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type MatchMediaStub, stubMatchMedia } from "../helpers/matchMediaStub";

type MockFn = ReturnType<typeof vi.fn>;

/**
 * Mock Phaser module. Scene files extend Phaser.Scene, which at runtime
 * resolves to MockScene. Each instance gets fresh mock methods in the
 * constructor, enabling per-test isolation.
 */
vi.mock("phaser", async () => {
  const { createPhaserModuleMock } = await import("../helpers/phaserMock");
  return createPhaserModuleMock().module;
});

/** Mock AudioManager so scene tests can verify audio calls without real AudioContext. */
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
  AudioManager: {
    getInstance: () => mockAudio,
  },
}));

/** Mock ParentLock so tests can drive the hold-to-exit flow directly. */
const { mockParentLockInstances, MockParentLock } = vi.hoisted(() => {
  const mockParentLockInstances: Array<Record<string, unknown>> = [];
  class MockParentLock {
    constructor(...args: unknown[]) {
      mockParentLockInstances.push(args[0] as Record<string, unknown>);
    }

    destroy(): void {}
  }
  return { mockParentLockInstances, MockParentLock };
});

vi.mock("../../components/ParentLock", () => ({
  ParentLock: MockParentLock,
}));

/** Mock the mascot so tests can verify cheer/nod without real tween-heavy component. */
const { mockMascot } = vi.hoisted(() => ({
  mockMascot: {
    cheer: vi.fn(),
    curious: vi.fn(),
    nod: vi.fn(),
    destroy: vi.fn(),
  },
}));

vi.mock("../../components/Mascot", () => ({
  createCornerMascot: () => mockMascot,
}));

const { getAdaptiveBandShiftMock } = vi.hoisted(() => ({
  getAdaptiveBandShiftMock: vi.fn((_gameId: string): -1 | 0 | 1 => 0),
}));

vi.mock("../../utils/storage", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  getAdaptiveBandShift: (gameId: string) => getAdaptiveBandShiftMock(gameId),
}));

import { PopFreezeScene } from "../../scenes/PopFreezeScene";
import { earnSticker, hasSticker } from "../../utils/storage";
import { mulberry32 } from "../helpers/randomHelper";

/** Casts a Phaser-typed method to a MockFn for mock assertions. */
function getMockFn(fn: unknown): MockFn {
  return fn as unknown as MockFn;
}

describe("PopFreezeScene spawn and tap routing", () => {
  let matchMediaMock: MatchMediaStub;

  beforeEach(() => {
    matchMediaMock = stubMatchMedia(false);
    localStorage.clear();
    mockParentLockInstances.length = 0;
    Object.values(mockAudio).forEach((fn) => {
      getMockFn(fn).mockClear();
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  function setReducedMotion(reduced: boolean): void {
    matchMediaMock.mockImplementation(() => ({
      matches: reduced,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  }

  /** Returns every physics bubble image in creation order. */
  function getBubbles(scene: PopFreezeScene): Array<Record<string, MockFn>> {
    const imageMock = getMockFn(
      (scene as unknown as { physics: { add: { image: MockFn } } }).physics.add.image,
    );
    return imageMock.mock.results.map((r) => r.value as Record<string, MockFn>);
  }

  it("spawns identical bubble layouts from two mulberry32(1234) constructions (AC-1)", () => {
    const first = new PopFreezeScene(mulberry32(1234));
    first.create();
    const firstArgs = getMockFn(
      (first as unknown as { physics: { add: { image: MockFn } } }).physics.add.image,
    ).mock.calls.map((call) => [call[0], call[1]]);

    const second = new PopFreezeScene(mulberry32(1234));
    second.create();
    const secondArgs = getMockFn(
      (second as unknown as { physics: { add: { image: MockFn } } }).physics.add.image,
    ).mock.calls.map((call) => [call[0], call[1]]);

    expect(secondArgs).toEqual(firstArgs);
  });

  /** Taps a bubble by invoking its registered pointerdown handler. */
  function tapBubble(bubble: Record<string, MockFn>): void {
    const handler = getMockFn(bubble.on).mock.calls.find((call) => call[0] === "pointerdown");
    expect(handler).toBeDefined();
    if (handler && typeof handler[1] === "function") {
      (handler[1] as () => void)();
    }
  }

  it("spawns 5 bubbles with 96px display, 48px circle bodies, and sleeping overlays", () => {
    const scene = new PopFreezeScene(mulberry32(1234));
    scene.create();

    const bubbles = getBubbles(scene);
    expect(bubbles).toHaveLength(5);

    for (const bubble of bubbles) {
      expect(getMockFn(bubble.setDisplaySize)).toHaveBeenCalledWith(96, 96);
      // FR-5: the Arcade body must match the 96px display, not the 512px SVG frame.
      expect(getMockFn(bubble.setCircle)).toHaveBeenCalledWith(48);
      expect(getMockFn(bubble.setVelocity)).toHaveBeenCalled();
      expect(getMockFn(bubble.setCollideWorldBounds)).toHaveBeenCalledWith(true);
      expect(getMockFn(bubble.setBounce)).toHaveBeenCalledWith(1, 1);
      expect(getMockFn(bubble.setInteractive)).toHaveBeenCalled();
    }

    // Seeded mulberry32(1234) opens with two sleeping bubbles (bubbles 0 and 1;
    // the first is band-forced, the second wins the 50/50 roll at 0.073).
    const imageMock = getMockFn((scene as unknown as { add: { image: MockFn } }).add.image);
    const animalCalls = imageMock.mock.calls.filter(
      (call) => typeof call[2] === "string" && call[2].startsWith("animal_"),
    );
    expect(animalCalls).toHaveLength(2);
    const zzzCalls = imageMock.mock.calls.filter((call) => call[2] === "sleep_zzz");
    expect(zzzCalls).toHaveLength(2);
  });

  it("routes poppable taps to pop and sleeping taps to wake", () => {
    const scene = new PopFreezeScene(mulberry32(1234));
    scene.create();

    const bubbles = getBubbles(scene);
    // Seeded mulberry32(1234): bubbles 0 and 1 sleep, bubble 2 is the first poppable.
    tapBubble(bubbles[0]);
    expect(mockAudio.playWake).toHaveBeenCalledTimes(1);
    expect(mockAudio.playPop).not.toHaveBeenCalled();
    expect(mockMascot.nod).toHaveBeenCalledTimes(1);

    tapBubble(bubbles[2]);
    expect(mockAudio.playPop).toHaveBeenCalledTimes(1);
    expect(mockAudio.playWake).toHaveBeenCalledTimes(1);
    expect(mockMascot.cheer).toHaveBeenCalledTimes(1);
  });

  it("pops a bubble and respawns a replacement to keep 5 concurrent", () => {
    const scene = new PopFreezeScene(mulberry32(1234));
    scene.create();

    // Bubble 2 is the first poppable under the seeded draw sequence.
    tapBubble(getBubbles(scene)[2]);
    expect(mockAudio.playPop).toHaveBeenCalledTimes(1);

    // 5 initial + 1 respawn; the live set is still 5 bubbles.
    const bubbles = getBubbles(scene);
    expect(bubbles).toHaveLength(6);
    expect(getMockFn(bubbles[5].setInteractive)).toHaveBeenCalled();
  });

  it("emits self-cleaning droplet graphics on pop", () => {
    const scene = new PopFreezeScene(mulberry32(1234));
    scene.create();

    const graphicsMock = getMockFn(
      (scene as unknown as { add: { graphics: MockFn } }).add.graphics,
    );
    tapBubble(getBubbles(scene)[2]);

    // graphics[0] = completion splash rays, graphics[1] = droplet burst.
    const splash = graphicsMock.mock.results[0].value as Record<string, MockFn>;
    const droplets = graphicsMock.mock.results[1].value as Record<string, MockFn>;
    expect(splash).toBeDefined();
    expect(getMockFn(droplets.fillCircle)).toHaveBeenCalledTimes(3);

    const tweenMock = getMockFn((scene as unknown as { tweens: { add: MockFn } }).tweens.add);
    const dropletTween = tweenMock.mock.calls.find((call) => call[0]?.targets === droplets);
    expect(dropletTween).toBeDefined();
    expect(dropletTween?.[0].alpha).toBe(0);
    if (dropletTween && typeof dropletTween[0].onComplete === "function") {
      dropletTween[0].onComplete();
    }
    expect(getMockFn(droplets.destroy)).toHaveBeenCalledTimes(1);
  });

  it("skips the breathing loop under reduced motion", () => {
    setReducedMotion(true);
    const scene = new PopFreezeScene(mulberry32(1234));
    scene.create();

    const tweenMock = getMockFn((scene as unknown as { tweens: { add: MockFn } }).tweens.add);
    const looping = tweenMock.mock.calls.filter((call) => call[0]?.repeat === -1);
    expect(looping).toHaveLength(0);
  });

  it("syncs sleeping overlays with their bubble in update() and skips poppables", () => {
    const scene = new PopFreezeScene(mulberry32(1234));
    scene.create();

    const imageMock = getMockFn((scene as unknown as { add: { image: MockFn } }).add.image);
    const animal = imageMock.mock.results.find((r) => {
      const key = imageMock.mock.calls[imageMock.mock.results.indexOf(r)]?.[2];
      return typeof key === "string" && key.startsWith("animal_");
    })?.value as Record<string, MockFn>;
    const zzz = imageMock.mock.results
      .map((r) => r.value as Record<string, MockFn>)
      .find((obj) =>
        getMockFn(imageMock).mock.calls.some(
          (call, i) =>
            call[2] === "sleep_zzz" && getMockFn(imageMock).mock.results[i]?.value === obj,
        ),
      );
    expect(animal).toBeDefined();
    expect(zzz).toBeDefined();
    if (!zzz) throw new Error("sleep zzz not found");

    const bubbles = getBubbles(scene);
    (bubbles[0] as unknown as { x: number; y: number }).x = 111;
    (bubbles[0] as unknown as { x: number; y: number }).y = 222;
    scene.update();

    expect(getMockFn(animal.setPosition)).toHaveBeenCalled();
    expect(getMockFn(zzz.setPosition)).toHaveBeenCalled();
  });

  it("destroys the popped bubble when its shrink tween completes", () => {
    const scene = new PopFreezeScene(mulberry32(1234));
    scene.create();

    const bubbles = getBubbles(scene);
    tapBubble(bubbles[2]);

    const tweenMock = getMockFn((scene as unknown as { tweens: { add: MockFn } }).tweens.add);
    const shrink = tweenMock.mock.calls.find(
      (call) => call[0]?.targets === bubbles[2] && call[0]?.scaleX === 0,
    );
    expect(shrink).toBeDefined();
    if (shrink && typeof shrink[0].onComplete === "function") {
      shrink[0].onComplete();
    }
    expect(getMockFn(bubbles[2].destroy)).toHaveBeenCalled();
  });

  it("breathes the sleeping animal with a looping tween in normal motion", () => {
    const scene = new PopFreezeScene(mulberry32(1234));
    scene.create();

    const imageMock = getMockFn((scene as unknown as { add: { image: MockFn } }).add.image);
    const animalIndex = imageMock.mock.calls.findIndex(
      (call) => typeof call[2] === "string" && call[2].startsWith("animal_"),
    );
    expect(animalIndex).toBeGreaterThanOrEqual(0);
    const animal = imageMock.mock.results[animalIndex].value as Record<string, MockFn>;

    const tweenMock = getMockFn((scene as unknown as { tweens: { add: MockFn } }).tweens.add);
    const breathe = tweenMock.mock.calls.find(
      (call) => call[0]?.targets === animal && call[0]?.repeat === -1,
    );
    expect(breathe).toBeDefined();
    expect(breathe?.[0].duration).toBe(750);
  });

  describe("adaptive band wiring", () => {
    beforeEach(() => {
      getAdaptiveBandShiftMock.mockClear();
      getAdaptiveBandShiftMock.mockReturnValue(0);
    });

    /** Counts animal-overlay image creations (one per sleeping bubble). */
    function countAnimalOverlays(scene: PopFreezeScene): number {
      const imageMock = getMockFn((scene as unknown as { add: { image: MockFn } }).add.image);
      return imageMock.mock.calls.filter(
        (call) => typeof call[2] === "string" && call[2].startsWith("animal_"),
      ).length;
    }

    it("samples the band shift once in create() and honours the band bounds", () => {
      getAdaptiveBandShiftMock.mockReturnValue(1);
      const scene = new PopFreezeScene(mulberry32(1234));
      scene.create();
      expect(getAdaptiveBandShiftMock).toHaveBeenCalledTimes(1);
      expect(getAdaptiveBandShiftMock).toHaveBeenCalledWith("pop-freeze");
      // Hard band (seed 1234): two forced sleepers plus one rolled sleeper.
      expect(countAnimalOverlays(scene)).toBe(3);
    });

    it("easy band keeps poppable taps popping (one seeded sleeper opens)", () => {
      getAdaptiveBandShiftMock.mockReturnValue(-1);
      const scene = new PopFreezeScene(mulberry32(1234));
      scene.create();
      // Seed 1234's first draw (0.073) wins the easy band's 50/50 roll, so the
      // opening has exactly one sleeping bubble; bubble 1 is poppable.
      expect(countAnimalOverlays(scene)).toBe(1);
      const bubbles = getBubbles(scene);
      tapBubble(bubbles[1]);
      expect(getMockFn(mockAudio.playPop)).toHaveBeenCalledTimes(1);
      expect(getMockFn(mockAudio.playWake)).not.toHaveBeenCalled();
    });
  });
});

describe("PopFreezeScene completion and sticker flow", () => {
  beforeEach(() => {
    stubMatchMedia(false);
    localStorage.clear();
    mockParentLockInstances.length = 0;
    Object.values(mockAudio).forEach((fn) => {
      getMockFn(fn).mockClear();
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  function getBubbles(scene: PopFreezeScene): Array<Record<string, MockFn>> {
    const imageMock = getMockFn(
      (scene as unknown as { physics: { add: { image: MockFn } } }).physics.add.image,
    );
    return imageMock.mock.results.map((r) => r.value as Record<string, MockFn>);
  }

  function tapBubble(bubble: Record<string, MockFn>): void {
    const handler = getMockFn(bubble.on).mock.calls.find((call) => call[0] === "pointerdown");
    expect(handler).toBeDefined();
    if (handler && typeof handler[1] === "function") {
      (handler[1] as () => void)();
    }
  }

  function completeRound(scene: PopFreezeScene): void {
    const initial = getBubbles(scene);
    // Seeded mulberry32(1234): bubbles 0 and 1 sleep; poppables are 2-4.
    for (let i = 2; i <= 4; i++) {
      tapBubble(initial[i]);
    }
    // Respawns keep the sleeping count at the classic maximum (2), so every
    // respawn stays poppable: three more pops complete the round.
    const refreshed = getBubbles(scene);
    tapBubble(refreshed[5]);
    tapBubble(refreshed[6]);
    tapBubble(refreshed[7]);
  }

  function completeFadeOuts(scene: PopFreezeScene): void {
    const fadeOutMock = getMockFn(
      (scene as unknown as { cameras: { main: { fadeOut: MockFn } } }).cameras.main.fadeOut,
    );
    for (const call of fadeOutMock.mock.calls) {
      const callback = call[4] as () => void;
      callback();
    }
  }

  it("plays win SFX when 6 poppable bubbles are popped", () => {
    const scene = new PopFreezeScene(mulberry32(1234));
    scene.create();

    completeRound(scene);
    expect(mockAudio.playWin).toHaveBeenCalledTimes(1);
    expect(mockMascot.cheer).toHaveBeenCalledWith(true);
  });

  it("locks input after the round is complete", () => {
    const scene = new PopFreezeScene(mulberry32(1234));
    scene.create();

    completeRound(scene);
    const playPopCalls = getMockFn(mockAudio.playPop).mock.calls.length;

    // Any further tap (poppable or sleeping) must be ignored.
    const bubbles = getBubbles(scene);
    for (const bubble of bubbles) {
      tapBubble(bubble);
    }
    expect(getMockFn(mockAudio.playPop).mock.calls.length).toBe(playPopCalls);
    expect(getMockFn(mockAudio.playWake).mock.calls.length).toBe(0);
  });

  it("awards the sticker on first completion and auto-returns with justEarned", () => {
    const scene = new PopFreezeScene(mulberry32(1234));
    scene.create();

    completeRound(scene);

    expect(hasSticker("pop-freeze")).toBe(true);
    expect(mockAudio.playSticker).toHaveBeenCalledTimes(1);

    const imageMock = getMockFn((scene as unknown as { add: { image: MockFn } }).add.image);
    const stickerCall = imageMock.mock.calls.find((call) => call[2] === "sticker_pop_freeze");
    expect(stickerCall).toBeDefined();

    const delayedCallMock = getMockFn(
      (scene as unknown as { time: { delayedCall: MockFn } }).time.delayedCall,
    );
    const autoReturn = delayedCallMock.mock.calls.find((call) => call[0] === 3000);
    expect(autoReturn).toBeDefined();
    if (autoReturn && typeof autoReturn[1] === "function") {
      autoReturn[1]();
    }
    completeFadeOuts(scene);

    expect(
      getMockFn((scene as unknown as { scene: { start: MockFn } }).scene.start),
    ).toHaveBeenCalledWith("Hub", { justEarned: "pop-freeze" });
  });

  it("does not re-award the sticker or pass justEarned on repeat completions", () => {
    earnSticker("pop-freeze");
    const scene = new PopFreezeScene(mulberry32(1234));
    scene.create();

    completeRound(scene);

    expect(mockAudio.playSticker).not.toHaveBeenCalled();
    const imageMock = getMockFn((scene as unknown as { add: { image: MockFn } }).add.image);
    const stickerCall = imageMock.mock.calls.find((call) => call[2] === "sticker_pop_freeze");
    expect(stickerCall).toBeUndefined();

    const delayedCallMock = getMockFn(
      (scene as unknown as { time: { delayedCall: MockFn } }).time.delayedCall,
    );
    const autoReturn = delayedCallMock.mock.calls.find((call) => call[0] === 3000);
    expect(autoReturn).toBeDefined();
    if (autoReturn && typeof autoReturn[1] === "function") {
      autoReturn[1]();
    }
    completeFadeOuts(scene);

    expect(
      getMockFn((scene as unknown as { scene: { start: MockFn } }).scene.start),
    ).toHaveBeenCalledWith("Hub");
  });

  it("starts a fresh round on relaunch (no stale completion state)", () => {
    const scene = new PopFreezeScene(mulberry32(1234));
    scene.create();

    completeRound(scene);
    expect(mockAudio.playWin).toHaveBeenCalledTimes(1);

    scene.create();
    expect(mockAudio.playWin).toHaveBeenCalledTimes(1);

    // Fresh round: taps work again and a pop is registered.
    const playPopCalls = getMockFn(mockAudio.playPop).mock.calls.length;
    const fresh = getBubbles(scene).slice(-5);
    tapBubble(fresh[1]);
    expect(getMockFn(mockAudio.playPop).mock.calls.length).toBe(playPopCalls + 1);
  });
});
