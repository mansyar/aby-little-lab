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
      setTint: vi.fn().mockReturnThis(),
      clearTint: vi.fn().mockReturnThis(),
      setStrokeStyle: vi.fn().mockReturnThis(),
      setFillStyle: vi.fn().mockReturnThis(),
      setVelocity: vi.fn().mockReturnThis(),
      setCollideWorldBounds: vi.fn().mockReturnThis(),
      setBounce: vi.fn().mockReturnThis(),
      setCircle: vi.fn().mockReturnThis(),
      fillStyle: vi.fn().mockReturnThis(),
      fillCircle: vi.fn().mockReturnThis(),
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

/** Mock the TTS wrapper so tests can verify number speech without real voices. */
const { mockSpeech } = vi.hoisted(() => ({
  mockSpeech: {
    speakNumber: vi.fn(() => true),
    isSpeechSupported: vi.fn(() => true),
    onSpeechLifecycle: vi.fn(() => vi.fn()),
  },
}));

vi.mock("../../utils/speech", () => mockSpeech);

/** Controllable getAdaptiveBandShift facade plus a recorder for the generator call. */
const { getAdaptiveBandShiftMock, createPlaythroughMock } = vi.hoisted(() => ({
  getAdaptiveBandShiftMock: vi.fn((): -1 | 0 | 1 => 0),
  createPlaythroughMock: vi.fn(),
}));

/** Delegates storage to its real implementation, exposing a spy-able band-shift facade. */
vi.mock("../../utils/storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../utils/storage")>();
  return {
    ...actual,
    getAdaptiveBandShift: (gameId: string) => getAdaptiveBandShiftMock(gameId),
  };
});

/** Delegates the generator to its real implementation while recording the shift. */
vi.mock("../../game/countLogic", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../game/countLogic")>();
  return {
    ...actual,
    createPlaythrough: (shift: -1 | 0 | 1 = 0) => {
      createPlaythroughMock(shift);
      return actual.createPlaythrough(shift);
    },
  };
});

import { HowManyScene } from "../../scenes/HowManyScene";
import { earnSticker, updateSettings } from "../../utils/storage";
import {
  countListeners,
  expectPressFeedbackContract,
  fireFirstHandler,
  getInteractiveRects,
} from "../helpers/pressFeedback";

/** Casts a Phaser-typed method to a MockFn for mock assertions. */
function getMockFn(fn: unknown): MockFn {
  return fn as unknown as MockFn;
}

describe("HowManyScene round flow", () => {
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
    mockSpeech.speakNumber.mockClear();
    mockSpeech.isSpeechSupported.mockClear();
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
  function getCurrentRound(scene: unknown): {
    target: number;
    groups: Array<{ count: number; texture: string }>;
  } {
    const s = scene as {
      rounds: Array<{ target: number; groups: Array<{ count: number; texture: string }> }>;
      roundIndex: number;
    };
    return s.rounds[s.roundIndex];
  }

  /** Returns the active (not-yet-destroyed) numeral image for the target. */
  function getTargetImage(scene: unknown): Record<string, MockFn> {
    const imageMock = getMockFn((scene as { add: Record<string, unknown> }).add.image);
    const results: Array<Record<string, MockFn>> = [];
    for (let i = 0; i < imageMock.mock.calls.length; i++) {
      const key = imageMock.mock.calls[i][2];
      if (typeof key === "string" && key.startsWith("numeral_")) {
        results.push(imageMock.mock.results[i].value as Record<string, MockFn>);
      }
    }
    const active = results.filter((img) => getMockFn(img.destroy).mock.calls.length === 0);
    expect(active.length).toBeGreaterThanOrEqual(1);
    return active.at(-1) as Record<string, MockFn>;
  }

  /** Returns the active group card rectangles of the current round. */
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

  /** Returns the active item images of the current round, grouped by texture. */
  function getItemImagesByTexture(scene: unknown): Map<string, Array<Record<string, MockFn>>> {
    const imageMock = getMockFn((scene as { add: Record<string, unknown> }).add.image);
    const byTexture = new Map<string, Array<Record<string, MockFn>>>();
    for (let i = 0; i < imageMock.mock.calls.length; i++) {
      const key = imageMock.mock.calls[i][2];
      if (typeof key !== "string" || key.startsWith("numeral_") || key === "mascot_idle") {
        continue;
      }
      const img = imageMock.mock.results[i].value as Record<string, MockFn>;
      if (getMockFn(img.destroy).mock.calls.length > 0) {
        continue;
      }
      if (!byTexture.has(key)) {
        byTexture.set(key, []);
      }
      byTexture.get(key)?.push(img);
    }
    return byTexture;
  }

  /** Returns the 6 progress dot circle objects in creation order. */
  function getProgressDots(scene: unknown): Array<Record<string, MockFn>> {
    const s = scene as { add: Record<string, unknown> };
    const circleMock = getMockFn(s.add.circle);
    return circleMock.mock.results.map((r) => r.value as Record<string, MockFn>);
  }

  /** Returns the mascot image object (created with the mascot_idle texture). */
  function getMascotImage(scene: unknown): Record<string, MockFn> {
    const s = scene as { add: Record<string, unknown> };
    const imageMock = getMockFn(s.add.image);
    const index = imageMock.mock.calls.findIndex((call) => call[2] === "mascot_idle");
    return imageMock.mock.results[index].value as Record<string, MockFn>;
  }

  /** Simulates a tap on a group card by triggering its pointerdown callback. */
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

  /** Fires the next-round delay (700ms) so the round advances. */
  function fireNextRoundDelay(scene: unknown): void {
    const delayedCallMock = getMockFn(
      (scene as { time: Record<string, unknown> }).time.delayedCall,
    );
    const nextRoundCall = delayedCallMock.mock.calls.find((call) => call[0] === 700);
    expect(nextRoundCall).toBeDefined();
    if (nextRoundCall && typeof nextRoundCall[1] === "function") {
      (nextRoundCall[1] as () => void)();
    }
  }

  /** Taps the correct card and fires the next-round delay for the current round. */
  function completeRound(scene: unknown): void {
    const round = getCurrentRound(scene);
    const correctIndex = round.groups.findIndex((group) => group.count === round.target);
    tapCard(scene, correctIndex);
    fireNextRoundDelay(scene);
  }

  /** Fires the auto-return delay (3000ms) and the fade-out completion callback. */
  function fireAutoReturn(scene: unknown): void {
    const delayedCallMock = getMockFn(
      (scene as { time: Record<string, unknown> }).time.delayedCall,
    );
    const autoReturnCall = delayedCallMock.mock.calls.find((call) => call[0] === 3000);
    expect(autoReturnCall).toBeDefined();
    if (autoReturnCall && typeof autoReturnCall[1] === "function") {
      (autoReturnCall[1] as () => void)();
    }
    const fadeOutMock = getMockFn(
      (scene as { cameras: { main: Record<string, MockFn> } }).cameras.main.fadeOut,
    );
    const fadeOutCall = fadeOutMock.mock.calls.at(-1);
    if (fadeOutCall && typeof fadeOutCall[4] === "function") {
      (fadeOutCall[4] as () => void)();
    }
  }

  it("renders a big target numeral, 6 progress dots, and 3 band-1 group cards with item copies", () => {
    const scene = new HowManyScene();
    scene.create();

    const round = getCurrentRound(scene);
    // Round 1 is band 1 (targets 1-3) with 3 groups.
    expect(round.target).toBeGreaterThanOrEqual(1);
    expect(round.target).toBeLessThanOrEqual(3);

    // The target numeral is displayed with the matching numeral texture and
    // pops in from scale 0 to its display scale (240 / 512).
    const target = getTargetImage(scene);
    expect(getMockFn(target.setScale)).toHaveBeenCalledWith(0);
    const popTween = getMockFn(scene.tweens.add).mock.calls.find((call) => {
      const t = call[0]?.targets;
      return (Array.isArray(t) ? t.includes(target) : t === target) && call[0]?.scaleX === 0.46875;
    });
    expect(popTween).toBeDefined();
    const imageMock = getMockFn((scene as { add: Record<string, unknown> }).add.image);
    expect(imageMock.mock.calls.some((call) => call[2] === `numeral_${round.target}`)).toBe(true);

    // Band 1 shows 3 interactive cards with thick outlines.
    const cards = getCardRects(scene);
    expect(cards).toHaveLength(3);
    for (const card of cards) {
      expect(getMockFn(card.setInteractive)).toHaveBeenCalled();
      expect(getMockFn(card.setStrokeStyle)).toHaveBeenCalled();
    }

    // Cards meet the 96×96 ideal touch target (200px side).
    const rectCalls = getMockFn((scene as { add: Record<string, unknown> }).add.rectangle).mock
      .calls;
    for (const call of rectCalls) {
      if (call[2] === 200) {
        expect(call[2]).toBeGreaterThanOrEqual(96);
        expect(call[3]).toBeGreaterThanOrEqual(96);
      }
    }

    // Each group renders exactly its count of item copies with its texture.
    const itemsByTexture = getItemImagesByTexture(scene);
    const totalItems = round.groups.reduce((sum, group) => sum + group.count, 0);
    let seenItems = 0;
    for (const group of round.groups) {
      const items = itemsByTexture.get(group.texture);
      expect(items).toBeDefined();
      expect(items).toHaveLength(group.count);
      seenItems += group.count;
    }
    expect(seenItems).toBe(totalItems);

    expect(getProgressDots(scene)).toHaveLength(6);
  });

  it("centers the last partial row of items inside a card", () => {
    const scene = new HowManyScene();
    scene.create();

    // Force a band-3-style group of 10 items: rows of 4 + 4 + 2. The final
    // row of 2 must sit centered under the card, not pushed to the left.
    const s = scene as unknown as {
      rounds: Array<{ target: number; groups: Array<{ count: number; texture: string }> }>;
      roundIndex: number;
      renderRound: () => void;
    };
    s.rounds = [{ target: 10, groups: [{ count: 10, texture: "shape_star" }] }];
    s.roundIndex = 0;
    s.renderRound();

    // Single group → the card sits at centerX - CARD_SPACING_X/2 on the top
    // row: x 392, y 419 (centerY 384 + CARDS_Y_OFFSET 140 - 105).
    const cardX = 512 - 120;
    const cardY = 384 + 140 - 105;
    const imageMock = getMockFn((scene as { add: Record<string, unknown> }).add.image);
    const numeralCall = imageMock.mock.calls.findIndex((call) => call[2] === "numeral_10");
    expect(numeralCall).toBeGreaterThanOrEqual(0);
    if (numeralCall < 0) return;
    const starCalls = imageMock.mock.calls
      .slice(numeralCall + 1)
      .filter((call) => call[2] === "shape_star");
    expect(starCalls).toHaveLength(10);
    // Last row sits at cardY - gridHeight/2 + 2 * (42 + 4) + 21 = cardY + 46
    // (gridHeight = 3 * 42 + 2 * 4 = 134).
    const row2 = starCalls.filter((call) => call[1] === cardY + 46);
    expect(row2).toHaveLength(2);
    const xs = row2.map((call) => call[0] as number).sort((a, b) => a - b);
    // Centered: one slot either side of the card's midpoint (2 items x 42px
    // + 4px gap = 88px row, so offsets of ±23 from the center).
    expect(xs[0]).toBeCloseTo(cardX - 23, 5);
    expect(xs[1]).toBeCloseTo(cardX + 23, 5);
  });

  it("shows 4 group cards from band 2 onward", () => {
    const scene = new HowManyScene();
    scene.create();

    // Complete rounds 1-2 (band 1) to reach band 2 (rounds 3-4).
    completeRound(scene);
    completeRound(scene);
    const round = getCurrentRound(scene);
    expect(round.groups).toHaveLength(4);
    expect(getCardRects(scene)).toHaveLength(4);
  });

  it("speaks the target number at round start when SFX is enabled", () => {
    const scene = new HowManyScene();
    scene.create();

    const round = getCurrentRound(scene);
    expect(mockSpeech.speakNumber).toHaveBeenCalledWith(round.target, true);
  });

  it("silences TTS when the SFX toggle is off", () => {
    updateSettings({ sfxEnabled: false });

    const scene = new HowManyScene();
    scene.create();

    const round = getCurrentRound(scene);
    expect(mockSpeech.speakNumber).toHaveBeenCalledWith(round.target, false);
  });

  it("tapping the correct group card plays the correct chime, flashes success, and advances", () => {
    const scene = new HowManyScene();
    scene.create();
    const round = getCurrentRound(scene);
    const dots = getProgressDots(scene);
    const correctIndex = round.groups.findIndex((group) => group.count === round.target);
    const cards = getCardRects(scene);

    tapCard(scene, correctIndex);

    expect(mockAudio.playCorrect).toHaveBeenCalledTimes(1);
    expect(mockAudio.playIncorrect).not.toHaveBeenCalled();

    // The tapped card flashes the success color.
    expect(getMockFn(cards[correctIndex].setFillStyle)).toHaveBeenCalledWith(0x68d391, 1);

    // Professor Hoot cheers with the celebrate pose on a correct answer.
    const mascot = getMascotImage(scene);
    expect(getMockFn(mascot.setTexture)).toHaveBeenCalledWith("mascot_celebrate");

    // The first progress dot fills.
    expect(getMockFn(dots[0].setAlpha)).toHaveBeenCalledWith(1);
    expect(getMockFn(dots[1].setAlpha)).not.toHaveBeenCalledWith(1);

    fireNextRoundDelay(scene);
    expect((scene as { roundIndex: number }).roundIndex).toBe(1);

    // The new round re-renders and speaks its own target number.
    const secondRound = getCurrentRound(scene);
    expect(mockSpeech.speakNumber).toHaveBeenCalledWith(secondRound.target, true);

    // The previous round's target numeral is destroyed on re-render — no
    // stale target objects accumulate across rounds.
    const imageMock = getMockFn((scene as { add: Record<string, unknown> }).add.image);
    const targetResults: Array<Record<string, MockFn>> = [];
    for (let i = 0; i < imageMock.mock.calls.length; i++) {
      const key = imageMock.mock.calls[i][2];
      if (typeof key === "string" && key.startsWith("numeral_")) {
        targetResults.push(imageMock.mock.results[i].value as Record<string, MockFn>);
      }
    }
    expect(getMockFn(targetResults[0].destroy)).toHaveBeenCalled();
    expect(getMockFn(targetResults[1].destroy)).not.toHaveBeenCalled();
  });

  it("tapping a wrong group card wiggles gently and does not advance the round", () => {
    const scene = new HowManyScene();
    scene.create();
    const round = getCurrentRound(scene);
    const correctIndex = round.groups.findIndex((group) => group.count === round.target);
    const wrongIndex = (correctIndex + 1) % round.groups.length;
    const rect = getCardRects(scene)[wrongIndex];
    const items = getItemImagesByTexture(scene).get(round.groups[wrongIndex].texture) ?? [];

    tapCard(scene, wrongIndex);

    expect(mockAudio.playIncorrect).toHaveBeenCalledTimes(1);
    expect(mockAudio.playCorrect).not.toHaveBeenCalled();
    expect(getMockFn(rect.setFillStyle)).not.toHaveBeenCalledWith(0x68d391, 1);
    expect((scene as { roundIndex: number }).roundIndex).toBe(0);

    // Professor Hoot nods along with the soft incorrect tone.
    const mascot = getMascotImage(scene);
    const nodTween = getMockFn(scene.tweens.add).mock.calls.find(
      (call) => call[0]?.targets === mascot && call[0]?.angle?.to === 6,
    );
    expect(nodTween).toBeDefined();

    // The card and its item copies wiggle together.
    const wiggleTween = getMockFn(scene.tweens.add).mock.calls.find((call) => {
      const targets = call[0]?.targets;
      if (!Array.isArray(targets)) return false;
      return targets.includes(rect) && targets.some((t) => items.includes(t));
    });
    expect(wiggleTween).toBeDefined();
    if (!wiggleTween) return;
    expect((wiggleTween[0] as { angle: number }).angle).toBe(4);
    expect((wiggleTween[0] as { yoyo: boolean }).yoyo).toBe(true);
  });

  it("wins after 6 correct rounds: celebration, first-time sticker, justEarned, auto-return", () => {
    const scene = new HowManyScene();
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
    ).mock.calls.find((call) => call[2] === "sticker_how_many");
    expect(stickerImage).toBeDefined();

    fireAutoReturn(scene);
    expect((scene as { scene: Record<string, MockFn> }).scene.start).toHaveBeenCalledWith("Hub", {
      justEarned: "how-many",
    });
  });

  /** Returns the speaker button image created with the icon_speaker texture. */
  function getSpeakerImage(scene: unknown): Record<string, MockFn> {
    const imageMock = getMockFn((scene as { add: Record<string, unknown> }).add.image);
    const index = imageMock.mock.calls.findIndex((call) => call[2] === "icon_speaker");
    return imageMock.mock.results[index].value as Record<string, MockFn>;
  }

  it("guards the speaker during the win celebration (no crash after the final round)", () => {
    const scene = new HowManyScene();
    scene.create();

    for (let i = 0; i < 6; i++) {
      completeRound(scene);
    }
    expect(mockAudio.playWin).toHaveBeenCalledTimes(1);

    // Tapping "hear it again" during the 3s celebration must not dereference
    // rounds[roundIndex] past the end of the array.
    const speakerImage = getSpeakerImage(scene);
    const pointerdown = getMockFn(speakerImage.on).mock.calls.find((c) => c[0] === "pointerdown");
    expect(pointerdown).toBeDefined();
    if (pointerdown && typeof pointerdown[1] === "function") {
      expect(() => (pointerdown[1] as () => void)()).not.toThrow();
    }
  });

  it("does not award the sticker again or pass justEarned on repeat completions", () => {
    earnSticker("how-many");
    const scene = new HowManyScene();
    scene.create();

    for (let i = 0; i < 6; i++) {
      completeRound(scene);
    }

    expect(mockAudio.playSticker).not.toHaveBeenCalled();
    fireAutoReturn(scene);
    expect((scene as { scene: Record<string, MockFn> }).scene.start).toHaveBeenCalledWith("Hub");
  });

  it("re-launching after completion unlocks input so cards are tappable again", () => {
    const scene = new HowManyScene();
    scene.create();

    for (let i = 0; i < 6; i++) {
      completeRound(scene);
    }
    expect((scene as { inputLocked: boolean }).inputLocked).toBe(true);

    // Returning to the Hub and tapping the tile again calls create() on the
    // same scene instance (Phaser restart) — input must be unlocked.
    scene.create();
    expect((scene as { inputLocked: boolean }).inputLocked).toBe(false);

    const round = getCurrentRound(scene);
    const correctIndex = round.groups.findIndex((group) => group.count === round.target);
    const correctCallsBefore = mockAudio.playCorrect.mock.calls.length;
    tapCard(scene, correctIndex);
    expect(mockAudio.playCorrect.mock.calls.length).toBe(correctCallsBefore + 1);
  });

  it("parental lock hold success exits to the Hub", () => {
    const scene = new HowManyScene();
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

  it("uses smaller wiggle amplitude and shorter durations under reduced motion", () => {
    setReducedMotion(true);
    const scene = new HowManyScene();
    scene.create();
    const round = getCurrentRound(scene);
    const correctIndex = round.groups.findIndex((group) => group.count === round.target);
    const wrongIndex = (correctIndex + 1) % round.groups.length;
    const rect = getCardRects(scene)[wrongIndex];

    tapCard(scene, wrongIndex);

    const wiggleTween = getMockFn(scene.tweens.add).mock.calls.find((call) => {
      const targets = call[0]?.targets;
      if (!Array.isArray(targets)) return false;
      return targets.includes(rect);
    });
    expect(wiggleTween).toBeDefined();
    if (!wiggleTween) return;
    expect((wiggleTween[0] as { angle: number }).angle).toBe(2);
    expect((wiggleTween[0] as { duration: number }).duration).toBe(200);
  });

  it("generates a valid playthrough for the scene (6 rounds, easy-first bands)", () => {
    const scene = new HowManyScene();
    scene.create();
    const rounds = (
      scene as {
        rounds: Array<{ target: number; groups: Array<{ count: number; texture: string }> }>;
      }
    ).rounds;

    expect(rounds).toHaveLength(6);
    // Bands: rounds 1-2 targets 1-3 with 3 groups; 3-4 targets 1-5; 5-6 targets 1-10 with 4.
    for (const round of rounds.slice(0, 2)) {
      expect(round.groups).toHaveLength(3);
      expect(round.target).toBeLessThanOrEqual(3);
    }
    for (const round of rounds.slice(2, 4)) {
      expect(round.groups).toHaveLength(4);
      expect(round.target).toBeLessThanOrEqual(5);
    }
    for (const round of rounds.slice(4)) {
      expect(round.groups).toHaveLength(4);
      expect(round.target).toBeLessThanOrEqual(10);
    }
    // Every round has distinct counts and exactly one matching group.
    for (const round of rounds) {
      const counts = round.groups.map((group) => group.count);
      expect(new Set(counts).size).toBe(counts.length);
      expect(round.groups.filter((group) => group.count === round.target)).toHaveLength(1);
    }
  });
});

/* --- Press feedback cohesion (Track: UI/UX Cohesion, Phase 2) --- */

describe("HowManyScene press feedback cohesion", () => {
  /** Stubs matchMedia to control the prefers-reduced-motion result. */
  function stubMotion(reduced: boolean): void {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: reduced,
        media: "(prefers-reduced-motion: reduce)",
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
  }

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("gives every answer card press feedback restoring on release, out, and cancel", () => {
    stubMotion(false);
    const scene = new HowManyScene();
    scene.create();

    const controls = getInteractiveRects(scene);
    expect(controls.length).toBeGreaterThan(0);
    for (const control of controls) {
      expectPressFeedbackContract(control);
    }
  });

  it("keeps the gameplay choice handler registered before the press squish", () => {
    stubMotion(false);
    const scene = new HowManyScene();
    scene.create();

    const [first] = getInteractiveRects(scene);
    fireFirstHandler(first, "pointerdown");
    expect(first.setScale).not.toHaveBeenCalledWith(0.95);
  });

  it("attaches exactly one extra pointerdown listener per card when motion is allowed", () => {
    stubMotion(true);
    const reducedScene = new HowManyScene();
    reducedScene.create();
    const reducedCounts = getInteractiveRects(reducedScene).map((control) =>
      countListeners(control, "pointerdown"),
    );

    stubMotion(false);
    const scene = new HowManyScene();
    scene.create();
    const controls = getInteractiveRects(scene);

    expect(reducedCounts.length).toBeGreaterThan(0);
    expect(controls.map((control) => countListeners(control, "pointerdown"))).toEqual(
      reducedCounts.map((count) => count + 1),
    );
    for (const control of controls) {
      expect(countListeners(control, "pointerup")).toBe(1);
      expect(countListeners(control, "pointercancel")).toBe(1);
    }
  });
});

describe("adaptive band shift wiring", () => {
  beforeEach(() => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
    localStorage.clear();
    getAdaptiveBandShiftMock.mockClear();
    getAdaptiveBandShiftMock.mockReturnValue(0);
    createPlaythroughMock.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("passes the facade's band shift to createPlaythrough", () => {
    getAdaptiveBandShiftMock.mockReturnValue(1);
    const scene = new HowManyScene();
    scene.create();

    expect(createPlaythroughMock).toHaveBeenCalledWith(1);
  });

  it("requests the classic ladder when the facade returns 0", () => {
    const scene = new HowManyScene();
    scene.create();

    expect(createPlaythroughMock).toHaveBeenCalledWith(0);
  });
});
