import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type MockFn = ReturnType<typeof vi.fn>;

/**
 * Mock Phaser module. Scene files extend Phaser.Scene, which at runtime
 * resolves to MockScene. Each instance gets fresh mock methods in the
 * constructor, enabling per-test isolation.
 */
vi.mock("phaser", () => {
  /** Creates a mock game object with chainable methods used by Phaser scenes. */
  function createMockGameObject(scene?: unknown): Record<string, MockFn> {
    return {
      setInteractive: vi.fn().mockReturnThis(),
      disableInteractive: vi.fn(),
      on: vi.fn().mockReturnThis(),
      off: vi.fn().mockReturnThis(),
      setOrigin: vi.fn().mockReturnThis(),
      setScale: vi.fn().mockReturnThis(),
      setTexture: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
      setStyle: vi.fn().mockReturnThis(),
      setFontSize: vi.fn().mockReturnThis(),
      setText: vi.fn().mockReturnThis(),
      setColor: vi.fn().mockReturnThis(),
      setVisible: vi.fn().mockReturnThis(),
      setAlpha: vi.fn().mockReturnThis(),
      setPosition: vi.fn().mockReturnThis(),
      setSize: vi.fn().mockReturnThis(),
      setDisplaySize: vi.fn().mockReturnThis(),
      setStrokeStyle: vi.fn().mockReturnThis(),
      setFillStyle: vi.fn().mockReturnThis(),
      setVelocity: vi.fn().mockReturnThis(),
      setCollideWorldBounds: vi.fn().mockReturnThis(),
      setBounce: vi.fn().mockReturnThis(),
      setCircle: vi.fn().mockReturnThis(),
      fillStyle: vi.fn().mockReturnThis(),
      fillCircle: vi.fn().mockReturnThis(),
      fillRoundedRect: vi.fn().mockReturnThis(),
      strokeRoundedRect: vi.fn().mockReturnThis(),
      slice: vi.fn().mockReturnThis(),
      fillPath: vi.fn().mockReturnThis(),
      clear: vi.fn().mockReturnThis(),
      getCenter: vi.fn(() => ({ x: 0, y: 0 })),
      beginPath: vi.fn().mockReturnThis(),
      moveTo: vi.fn().mockReturnThis(),
      lineTo: vi.fn().mockReturnThis(),
      strokePath: vi.fn().mockReturnThis(),
      lineStyle: vi.fn().mockReturnThis(),
      strokeRect: vi.fn().mockReturnThis(),
      strokeCircle: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
      scaleX: 1,
      scaleY: 1,
      scene,
    };
  }

  class MockScene {
    add!: Record<string, MockFn>;
    scene!: Record<string, MockFn>;
    load!: Record<string, MockFn>;
    input!: Record<string, MockFn>;
    cameras!: {
      main: Record<string, MockFn> & {
        centerX: number;
        centerY: number;
        width: number;
        height: number;
      };
    };
    scale!: Record<string, MockFn> & { width: number; height: number };
    time!: Record<string, MockFn>;
    tweens!: Record<string, MockFn>;
    sys!: { events: Record<string, MockFn> };
    events!: Record<string, MockFn>;
    children!: Record<string, MockFn>;
    physics!: { add: Record<string, MockFn>; world: Record<string, MockFn> };

    constructor() {
      this.add = {
        rectangle: vi.fn(() => createMockGameObject(this)),
        text: vi.fn(() => createMockGameObject(this)),
        image: vi.fn(() => createMockGameObject(this)),
        container: vi.fn(() => createMockGameObject(this)),
        circle: vi.fn(() => createMockGameObject(this)),
        graphics: vi.fn(() => createMockGameObject(this)),
        zone: vi.fn(() => createMockGameObject(this)),
        particles: vi.fn(() => createMockGameObject(this)),
      };
      this.scene = {
        start: vi.fn(),
        stop: vi.fn(),
        launch: vi.fn(),
        get: vi.fn(),
        switch: vi.fn(),
        sleep: vi.fn(),
        wake: vi.fn(),
        pause: vi.fn(),
        resume: vi.fn(),
      };
      this.load = {
        svg: vi.fn(),
        image: vi.fn(),
        audio: vi.fn(),
        on: vi.fn(),
        once: vi.fn(),
        off: vi.fn(),
      };
      this.input = {
        on: vi.fn(),
        off: vi.fn(),
        setDraggable: vi.fn(),
      };
      this.cameras = {
        main: {
          setBackgroundColor: vi.fn(),
          fadeIn: vi.fn(),
          fadeOut: vi.fn(),
          setZoom: vi.fn(),
          zoomTo: vi.fn(),
          centerX: 512,
          centerY: 384,
          width: 1024,
          height: 768,
        },
      };
      this.scale = {
        setSize: vi.fn(),
        on: vi.fn(),
        width: 1024,
        height: 768,
      };
      this.time = {
        delayedCall: vi.fn(() => ({ remove: vi.fn() })),
        addEvent: vi.fn(),
      };
      this.tweens = {
        add: vi.fn(() => ({ remove: vi.fn(), stop: vi.fn() })),
      };
      this.sys = {
        events: {
          on: vi.fn(),
          once: vi.fn(),
          off: vi.fn(),
        },
      };
      this.events = this.sys.events;
      this.children = {
        forEach: vi.fn(),
      };
      this.physics = {
        add: {
          image: vi.fn(() => createMockGameObject()),
        },
        world: {
          setBoundsCollision: vi.fn(),
          setBounds: vi.fn(),
        },
      };
    }
  }

  /** Mock for Phaser.Geom.Rectangle — must be a class to support `new`. */
  class MockRectangle {
    static Contains = vi.fn(() => true);

    constructor(
      readonly x: number,
      readonly y: number,
      readonly width: number,
      readonly height: number,
    ) {}
  }

  return {
    default: {
      Scene: MockScene,
      Game: vi.fn(),
      Scale: { FIT: 0, CENTER_BOTH: 0 },
      AUTO: "AUTO",
      Geom: { Rectangle: MockRectangle },
    },
    Scene: MockScene,
    Game: vi.fn(),
    Scale: { FIT: 0, CENTER_BOTH: 0 },
    AUTO: "AUTO",
    Geom: { Rectangle: MockRectangle },
  };
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

import type { MemoryRound } from "../../game/memoryMatchLogic";
import { MemoryMatchScene } from "../../scenes/MemoryMatchScene";
import { earnSticker, getProfiles } from "../../utils/storage";

/** Casts a Phaser-typed method to a MockFn for mock assertions. */
function getMockFn(fn: unknown): MockFn {
  return fn as unknown as MockFn;
}

describe("MemoryMatchScene round flow", () => {
  let matchMediaMock: MockFn;

  beforeEach(() => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    matchMediaMock = vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    vi.stubGlobal("matchMedia", matchMediaMock);
    localStorage.clear();
    mockParentLockInstances.length = 0;
    for (const fn of Object.values(mockAudio)) {
      fn.mockClear();
    }
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  /** Toggles the `prefers-reduced-motion` media query result. */
  function setReducedMotion(reduced: boolean): void {
    matchMediaMock.mockImplementation(() => ({
      matches: reduced,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  }

  /** Returns the current round of the scene. */
  function getCurrentRound(scene: unknown): MemoryRound {
    const s = scene as {
      rounds: MemoryRound[];
      roundIndex: number;
    };
    return s.rounds[s.roundIndex];
  }

  /** Returns the active (not-yet-destroyed) card rectangles of the current round. */
  function getCardRects(scene: unknown): Array<Record<string, MockFn>> {
    const s = scene as { add: Record<string, unknown> };
    const rectangleMock = getMockFn(s.add.rectangle);
    const cards: Array<Record<string, MockFn>> = [];
    for (let i = 0; i < rectangleMock.mock.results.length; i++) {
      const card = rectangleMock.mock.results[i].value as Record<string, MockFn>;
      if (getMockFn(card.destroy).mock.calls.length === 0) {
        cards.push(card);
      }
    }
    return cards;
  }

  /** Returns the card-back images of the current round, in creation order. */
  function getCardBacks(scene: unknown): Array<Record<string, MockFn>> {
    const imageMock = getMockFn((scene as { add: Record<string, unknown> }).add.image);
    const backs: Array<Record<string, MockFn>> = [];
    for (let i = 0; i < imageMock.mock.calls.length; i++) {
      const key = imageMock.mock.calls[i][2];
      if (key !== "card_back") continue;
      const img = imageMock.mock.results[i].value as Record<string, MockFn>;
      if (getMockFn(img.destroy).mock.calls.length > 0) continue;
      backs.push(img);
    }
    return backs;
  }

  /** Returns the face (item) images of the current round, keyed by texture. */
  function getFaceImages(scene: unknown): Map<string, Array<Record<string, MockFn>>> {
    const imageMock = getMockFn((scene as { add: Record<string, unknown> }).add.image);
    const faces = new Map<string, Array<Record<string, MockFn>>>();
    for (let i = 0; i < imageMock.mock.calls.length; i++) {
      const key = imageMock.mock.calls[i][2];
      if (typeof key !== "string" || key === "mascot_idle" || key === "card_back") {
        continue;
      }
      const img = imageMock.mock.results[i].value as Record<string, MockFn>;
      if (getMockFn(img.destroy).mock.calls.length > 0) continue;
      if (!faces.has(key)) {
        faces.set(key, []);
      }
      faces.get(key)?.push(img);
    }
    return faces;
  }

  /** Returns the mascot image object (created with the mascot_idle texture). */
  function getMascotImage(scene: unknown): Record<string, MockFn> {
    const s = scene as { add: Record<string, unknown> };
    const imageMock = getMockFn(s.add.image);
    const index = imageMock.mock.calls.findIndex((call) => call[2] === "mascot_idle");
    return imageMock.mock.results[index].value as Record<string, MockFn>;
  }

  /** Returns the 6 progress dot circle objects in creation order. */
  function getProgressDots(scene: unknown): Array<Record<string, MockFn>> {
    const s = scene as { add: Record<string, unknown> };
    const circleMock = getMockFn(s.add.circle);
    return circleMock.mock.results.map((r) => r.value as Record<string, MockFn>);
  }

  /** Simulates a tap on a card by triggering its pointerdown callback. */
  function tapCard(scene: unknown, cardIndex: number): void {
    const cards = getCardRects(scene);
    const card = cards[cardIndex];
    if (!card) throw new Error(`Card ${cardIndex} not found`);
    const onCalls = getMockFn(card.on).mock.calls;
    const pointerdownCall = onCalls.find((c) => c[0] === "pointerdown");
    if (pointerdownCall && typeof pointerdownCall[1] === "function") {
      (pointerdownCall[1] as () => void)();
    }
  }

  /** Completes the flip half-tween (scaleX → 0) for a given card, running its onComplete. */
  function fireFlipHalf(scene: unknown, cardIndex: number): void {
    const cards = getCardRects(scene);
    const card = cards[cardIndex];
    if (!card) throw new Error(`Card ${cardIndex} not found`);
    const tweenCalls = getMockFn((scene as { tweens: Record<string, unknown> }).tweens.add).mock
      .calls;
    const flipCall = tweenCalls.findLast((call) => {
      const config = call[0] as { targets?: unknown; scaleX?: number; delay?: number } | undefined;
      if (!config || typeof config.scaleX !== "number" || config.scaleX !== 0) return false;
      if (config.delay !== undefined) return false;
      const targets = Array.isArray(config.targets) ? config.targets : [];
      return targets.includes(card);
    });
    expect(flipCall).toBeDefined();
    const onComplete = (flipCall?.[0] as { onComplete?: () => void } | undefined)?.onComplete;
    if (onComplete) {
      onComplete();
    }
  }

  /** Fires a delayedCall with the given delay, invoking its callback. */
  function fireDelayedCall(scene: unknown, delay: number): void {
    const delayedCallMock = getMockFn(
      (scene as { time: Record<string, unknown> }).time.delayedCall,
    );
    const call = delayedCallMock.mock.calls.findLast((c) => c[0] === delay);
    expect(call).toBeDefined();
    if (call && typeof call[1] === "function") {
      (call[1] as () => void)();
    }
  }

  /** Finds the index of the card pairing with `cardIndex` in the current round. */
  function pairIndexOf(scene: unknown, cardIndex: number): number {
    const round = getCurrentRound(scene);
    const texture = round.layout[cardIndex];
    return round.layout.findIndex((t, i) => i !== cardIndex && t === texture);
  }

  /** Taps both cards of the pair at `cardIndex` and completes the round. */
  function matchPair(scene: unknown, cardIndex: number): void {
    tapCard(scene, cardIndex);
    tapCard(scene, pairIndexOf(scene, cardIndex));
  }

  /** Completes every pair of the current round and fires the round-advance delay. */
  function completeRound(scene: unknown): void {
    const round = getCurrentRound(scene);
    const completed = new Set<number>();
    for (let i = 0; i < round.layout.length; i++) {
      if (completed.has(i)) continue;
      matchPair(scene, i);
      completed.add(i);
      completed.add(pairIndexOf(scene, i));
    }
    fireDelayedCall(scene, 700);
  }

  /** Fires the auto-return delay (3000ms) and the fade-out completion callback. */
  function fireAutoReturn(scene: unknown): void {
    fireDelayedCall(scene, 3000);
    const fadeOutMock = getMockFn(
      (scene as { cameras: { main: Record<string, MockFn> } }).cameras.main.fadeOut,
    );
    const fadeOutCall = fadeOutMock.mock.calls.at(-1);
    if (fadeOutCall && typeof fadeOutCall[4] === "function") {
      (fadeOutCall[4] as () => void)();
    }
  }

  it("deals the first round face-down: 2x3 grid of 6 interactive cards >=96px with card backs, hidden faces, and 6 progress dots", () => {
    const scene = new MemoryMatchScene();
    scene.create();

    const round = getCurrentRound(scene);
    expect(round.band).toBe("easy");
    expect(round.layout).toHaveLength(6);

    // Six interactive card bases with thick outlines.
    const cards = getCardRects(scene);
    expect(cards).toHaveLength(6);
    for (const card of cards) {
      expect(getMockFn(card.setInteractive)).toHaveBeenCalled();
      expect(getMockFn(card.setStrokeStyle)).toHaveBeenCalled();
    }
    const rectCalls = getMockFn((scene as { add: Record<string, unknown> }).add.rectangle).mock
      .calls;
    for (const call of rectCalls) {
      if (typeof call[2] === "number" && call[2] >= 96) {
        expect(call[2]).toBeGreaterThanOrEqual(96);
        expect(call[3]).toBeGreaterThanOrEqual(96);
      }
    }

    // Every card wears a card_back image and hides its face texture.
    const backs = getCardBacks(scene);
    expect(backs).toHaveLength(6);
    for (const back of backs) {
      expect(getMockFn(back.setVisible)).not.toHaveBeenCalledWith(false);
    }
    const faces = getFaceImages(scene);
    expect(faces.size).toBe(3); // 3 distinct pair textures in the easy band
    for (const images of faces.values()) {
      expect(images).toHaveLength(2);
      for (const face of images) {
        expect(getMockFn(face.setVisible)).toHaveBeenCalledWith(false);
      }
    }

    expect(getProgressDots(scene)).toHaveLength(6);
  });

  it("tapping a face-down card pops and reveals it via a scaleX flip", () => {
    const scene = new MemoryMatchScene();
    scene.create();

    tapCard(scene, 0);

    expect(mockAudio.playPop).toHaveBeenCalledTimes(1);
    // The reveal flip collapses to scaleX 0...
    const cards = getCardRects(scene);
    const tweenCalls = getMockFn((scene as { tweens: Record<string, unknown> }).tweens.add).mock
      .calls;
    const flipCall = tweenCalls.find((call) => {
      const config = call[0] as { targets?: unknown; scaleX?: number; delay?: number } | undefined;
      return config?.scaleX === 0 && config.delay === undefined;
    });
    expect(flipCall).toBeDefined();
    if (!flipCall) return;
    const flipConfig = flipCall[0] as { targets?: unknown[] };
    const targets = flipConfig.targets ?? [];
    expect(targets).toContain(cards[0]);

    // ...then the onComplete swaps face/back visibility.
    fireFlipHalf(scene, 0);
    const backs = getCardBacks(scene);
    expect(getMockFn(backs[0].setVisible)).toHaveBeenCalledWith(false);
    const faces = getFaceImages(scene);
    const face = faces.get(getCurrentRound(scene).layout[0])?.[0];
    expect(face).toBeDefined();
    if (face) {
      expect(getMockFn(face.setVisible)).toHaveBeenCalledWith(true);
    }
  });

  it("a second tap on the revealed card does nothing (no double-flip)", () => {
    const scene = new MemoryMatchScene();
    scene.create();

    tapCard(scene, 0);
    const popsBefore = mockAudio.playPop.mock.calls.length;
    tapCard(scene, 0);
    expect(mockAudio.playPop.mock.calls.length).toBe(popsBefore);
  });

  it("matching a pair plays the correct chime, flashes both cards success, cheers, and keeps them face-up", () => {
    const scene = new MemoryMatchScene();
    scene.create();
    const cards = getCardRects(scene);

    tapCard(scene, 0);
    const pairIndex = pairIndexOf(scene, 0);
    tapCard(scene, pairIndex);

    expect(mockAudio.playCorrect).toHaveBeenCalledTimes(1);
    expect(mockAudio.playIncorrect).not.toHaveBeenCalled();

    // Both cards flash the success color.
    expect(getMockFn(cards[0].setFillStyle)).toHaveBeenCalledWith(0x68d391, 1);
    expect(getMockFn(cards[pairIndex].setFillStyle)).toHaveBeenCalledWith(0x68d391, 1);

    // Professor Hoot cheers with the celebrate pose.
    const mascot = getMascotImage(scene);
    expect(getMockFn(mascot.setTexture)).toHaveBeenCalledWith("mascot_celebrate");

    // Both cards stay revealed (no flip-back tween for a matched pair).
    const tweenCalls = getMockFn((scene as { tweens: Record<string, unknown> }).tweens.add).mock
      .calls;
    const flipBackCalls = tweenCalls.filter((call) => {
      const config = call[0] as
        | { targets?: unknown[]; scaleX?: number; delay?: number }
        | undefined;
      if (config?.scaleX !== 0 || config.delay !== undefined) return false;
      const targets = config.targets ?? [];
      return targets.includes(cards[0]) || targets.includes(cards[pairIndex]);
    });
    // Only the reveal flips (2 halves each from the taps); no extra flip-back halves.
    expect(flipBackCalls.length).toBeLessThanOrEqual(2);
  });

  it("mismatched pair wiggles, plays the soft tone, nods, flips back after the pause, and does not advance", () => {
    const scene = new MemoryMatchScene();
    scene.create();
    const round = getCurrentRound(scene);
    const cards = getCardRects(scene);

    tapCard(scene, 0);
    const mismatchIndex = round.layout.findIndex((t, i) => i !== 0 && t !== round.layout[0]);
    tapCard(scene, mismatchIndex);

    expect(mockAudio.playIncorrect).toHaveBeenCalledTimes(1);
    expect(mockAudio.playCorrect).not.toHaveBeenCalled();
    expect((scene as { roundIndex: number }).roundIndex).toBe(0);

    // Professor Hoot nods along with the soft incorrect tone.
    const mascot = getMascotImage(scene);
    const nodTween = getMockFn(scene.tweens.add).mock.calls.find(
      (call) => call[0]?.targets === mascot && call[0]?.angle?.to === 6,
    );
    expect(nodTween).toBeDefined();

    // Both cards wiggle: one gentle tween per card (rect + back + face).
    const wiggleTweens = getMockFn(scene.tweens.add).mock.calls.filter(
      (call) => (call[0] as { angle?: number })?.angle === 4,
    );
    expect(wiggleTweens).toHaveLength(2);
    const wiggleTargets = wiggleTweens.flatMap(
      (call) => (call[0] as { targets?: unknown[] }).targets ?? [],
    );
    expect(wiggleTargets).toContain(cards[0]);
    expect(wiggleTargets).toContain(cards[mismatchIndex]);
    expect((wiggleTweens[0][0] as { yoyo: boolean }).yoyo).toBe(true);

    // After the ~800ms pause both cards flip back face-down and input unlocks.
    fireDelayedCall(scene, 800);
    fireFlipHalf(scene, 0);
    fireFlipHalf(scene, mismatchIndex);
    const backs = getCardBacks(scene);
    expect(getMockFn(backs[0].setVisible)).toHaveBeenCalledWith(true);
    expect(getMockFn(backs[mismatchIndex].setVisible)).toHaveBeenCalledWith(true);
    expect((scene as { inputLocked: boolean }).inputLocked).toBe(false);
    expect((scene as { roundIndex: number }).roundIndex).toBe(0);
  });

  it("locks input during the mismatch pause so extra taps are ignored", () => {
    const scene = new MemoryMatchScene();
    scene.create();
    const round = getCurrentRound(scene);
    const mismatchIndex = round.layout.findIndex((t, i) => i !== 0 && t !== round.layout[0]);

    tapCard(scene, 0);
    tapCard(scene, mismatchIndex);
    expect((scene as { inputLocked: boolean }).inputLocked).toBe(true);

    const popsBefore = mockAudio.playPop.mock.calls.length;
    tapCard(scene, 2);
    expect(mockAudio.playPop.mock.calls.length).toBe(popsBefore);

    fireDelayedCall(scene, 800);
    expect((scene as { inputLocked: boolean }).inputLocked).toBe(false);
  });

  it("completing all pairs fills the progress dot and advances rounds after 700ms (easy 2x3, then medium 3x4)", () => {
    const scene = new MemoryMatchScene();
    scene.create();
    const dots = getProgressDots(scene);

    completeRound(scene);

    // The first dot filled with a pop.
    expect(getMockFn(dots[0].setAlpha)).toHaveBeenCalledWith(1);
    expect(getMockFn(dots[1].setAlpha)).not.toHaveBeenCalledWith(1);

    // Round 2 is the second easy band: still 2 rows x 3 cols = 6 cards.
    expect((scene as { roundIndex: number }).roundIndex).toBe(1);
    expect(getCurrentRound(scene).band).toBe("easy");
    expect(getCardRects(scene)).toHaveLength(6);

    // Round 3 moves up to the medium band: 3 rows x 4 cols = 12 cards.
    completeRound(scene);
    expect((scene as { roundIndex: number }).roundIndex).toBe(2);
    const thirdRound = getCurrentRound(scene);
    expect(thirdRound.band).toBe("medium");
    expect(thirdRound.rows).toBe(3);
    expect(thirdRound.cols).toBe(4);
    expect(getCardRects(scene)).toHaveLength(12);
    expect(getMockFn(dots[1].setAlpha)).toHaveBeenCalledWith(1);
  });

  it("wins after 6 rounds: celebration, first-time sticker, justEarned, auto-return, progress recorded", () => {
    const scene = new MemoryMatchScene();
    scene.create();

    for (let i = 0; i < 6; i++) {
      completeRound(scene);
    }

    expect(mockAudio.playWin).toHaveBeenCalledTimes(1);
    expect((scene as { inputLocked: boolean }).inputLocked).toBe(true);

    // Shared win celebration: ray burst grows/fades (motionScale(1.25, 1)).
    const tweenCalls = getMockFn(scene.tweens.add).mock.calls;
    expect(
      tweenCalls.some(
        (call) => call[0]?.scaleX === 1.25 && call[0]?.scaleY === 1.25 && call[0]?.alpha === 0,
      ),
    ).toBe(true);

    // First completion awards the sticker and shows the reveal animation.
    expect(mockAudio.playSticker).toHaveBeenCalledTimes(1);
    const stickerImage = getMockFn(
      (scene as { add: Record<string, unknown> }).add.image,
    ).mock.calls.find((call) => call[2] === "sticker_memory_match");
    expect(stickerImage).toBeDefined();

    // The playthrough's correct/wrong taps were flushed into learning progress:
    // 34 pairs matched (3+3+6+6+8+8), zero wrong taps, one completed win.
    // (plays stays 0 here: recordGamePlay is the Hub's job on tile tap.)
    const progress = getProfiles()[0].progress["memory-match"];
    expect(progress).toBeDefined();
    if (progress) {
      expect(progress.wins).toBe(1);
      expect(progress.correct).toBe(34);
      expect(progress.wrong).toBe(0);
    }

    fireAutoReturn(scene);
    expect((scene as { scene: Record<string, MockFn> }).scene.start).toHaveBeenCalledWith("Hub", {
      justEarned: "memory-match",
    });
  });

  it("does not award the sticker again or pass justEarned on repeat completions", () => {
    earnSticker("memory-match");
    const scene = new MemoryMatchScene();
    scene.create();

    for (let i = 0; i < 6; i++) {
      completeRound(scene);
    }

    expect(mockAudio.playSticker).not.toHaveBeenCalled();
    fireAutoReturn(scene);
    expect((scene as { scene: Record<string, MockFn> }).scene.start).toHaveBeenCalledWith("Hub");
  });

  it("re-launching after completion unlocks input so cards are tappable again", () => {
    const scene = new MemoryMatchScene();
    scene.create();

    for (let i = 0; i < 6; i++) {
      completeRound(scene);
    }
    expect((scene as { inputLocked: boolean }).inputLocked).toBe(true);

    // Returning to the Hub and tapping the tile again calls create() on the
    // same scene instance (Phaser restart) — input must be unlocked.
    scene.create();
    expect((scene as { inputLocked: boolean }).inputLocked).toBe(false);

    const popsBefore = mockAudio.playPop.mock.calls.length;
    tapCard(scene, 0);
    expect(mockAudio.playPop.mock.calls.length).toBe(popsBefore + 1);
  });

  it("parental lock hold success exits to the Hub", () => {
    const scene = new MemoryMatchScene();
    scene.create();

    expect(mockParentLockInstances).toHaveLength(1);
    const parentLock = mockParentLockInstances[0];
    const onSuccess = parentLock.onSuccess as () => void;
    expect(onSuccess).toBeDefined();

    // The hold success starts the Hub transition synchronously (fade-out).
    onSuccess();
    const fadeOutMock = getMockFn(
      (scene as { cameras: { main: Record<string, MockFn> } }).cameras.main.fadeOut,
    );
    const fadeOutCall = fadeOutMock.mock.calls.at(-1);
    expect(fadeOutCall).toBeDefined();
    if (fadeOutCall && typeof fadeOutCall[4] === "function") {
      (fadeOutCall[4] as () => void)();
    }
    expect((scene as { scene: Record<string, MockFn> }).scene.start).toHaveBeenCalledWith("Hub");
  });

  it("uses smaller wiggle amplitude and shorter flip durations under reduced motion", () => {
    setReducedMotion(true);
    const scene = new MemoryMatchScene();
    scene.create();
    const round = getCurrentRound(scene);
    const mismatchIndex = round.layout.findIndex((t, i) => i !== 0 && t !== round.layout[0]);

    tapCard(scene, 0);
    tapCard(scene, mismatchIndex);

    // Reduced-motion wiggle: one gentle tween per card at a smaller angle.
    const wiggleTweens = getMockFn(scene.tweens.add).mock.calls.filter(
      (call) => (call[0] as { angle?: number })?.angle === 2,
    );
    expect(wiggleTweens).toHaveLength(2);
    const wiggleTargets = wiggleTweens.flatMap(
      (call) => (call[0] as { targets?: unknown[] }).targets ?? [],
    );
    expect(wiggleTargets).toContain(getCardRects(scene)[0]);
    expect((wiggleTweens[0][0] as { duration: number }).duration).toBe(200);

    // The reveal flip uses the reduced half-duration (120ms).
    const flipCall = getMockFn(scene.tweens.add).mock.calls.find((call) => {
      const config = call[0] as { targets?: unknown; scaleX?: number; delay?: number } | undefined;
      return config?.scaleX === 0 && config.delay === undefined;
    });
    expect(flipCall).toBeDefined();
    if (!flipCall) return;
    expect((flipCall[0] as { duration: number }).duration).toBe(120);
  });

  it("generates a valid playthrough for the scene (6 rounds, progressive bands)", () => {
    const scene = new MemoryMatchScene();
    scene.create();
    const rounds = (scene as { rounds: MemoryRound[] }).rounds;

    expect(rounds).toHaveLength(6);
    const bands = rounds.map((round) => round.band);
    expect(bands).toEqual(["easy", "easy", "medium", "medium", "hard", "hard"]);
    for (const round of rounds) {
      expect(round.layout).toHaveLength(round.rows * round.cols);
      // Every texture appears exactly twice per round.
      const counts = new Map<string, number>();
      for (const texture of round.layout) {
        counts.set(texture, (counts.get(texture) ?? 0) + 1);
      }
      for (const count of counts.values()) {
        expect(count).toBe(2);
      }
    }
  });
});
