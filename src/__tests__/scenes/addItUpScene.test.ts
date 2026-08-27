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

/** Controllable getAdaptiveBandShift facade plus a recorder for the generator call. */
const { getAdaptiveBandShiftMock, buildPlaythroughMock } = vi.hoisted(() => ({
  getAdaptiveBandShiftMock: vi.fn((): -1 | 0 | 1 => 0),
  buildPlaythroughMock: vi.fn(),
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
vi.mock("../../game/addItUpLogic", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../game/addItUpLogic")>();
  return {
    ...actual,
    buildPlaythrough: (shift: -1 | 0 | 1 = 0) => {
      buildPlaythroughMock(shift);
      return actual.buildPlaythrough(shift);
    },
  };
});

import type { AddItUpRound } from "../../game/addItUpLogic";
import { AddItUpScene } from "../../scenes/AddItUpScene";
import { earnSticker } from "../../utils/storage";
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

describe("AddItUpScene round flow", () => {
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
  function getCurrentRound(scene: unknown): AddItUpRound {
    const s = scene as {
      rounds: AddItUpRound[];
      roundIndex: number;
    };
    return s.rounds[s.roundIndex];
  }

  /** Returns the 2 addend card rectangles (created without interactivity). */
  function getAddendCardRects(scene: unknown): Array<Record<string, MockFn>> {
    const s = scene as { add: Record<string, unknown> };
    const rectangleMock = getMockFn(s.add.rectangle);
    const addends: Array<Record<string, MockFn>> = [];
    for (let i = 0; i < rectangleMock.mock.results.length; i++) {
      const card = rectangleMock.mock.results[i].value as Record<string, MockFn>;
      if (getMockFn(card.destroy).mock.calls.length > 0) continue;
      if (getMockFn(card.setInteractive).mock.calls.length === 0) {
        addends.push(card);
      }
    }
    return addends;
  }

  /** Returns the 4 interactive answer card rectangles of the current round. */
  function getAnswerCardRects(scene: unknown): Array<Record<string, MockFn>> {
    const s = scene as { add: Record<string, unknown> };
    const rectangleMock = getMockFn(s.add.rectangle);
    const cards: Array<Record<string, MockFn>> = [];
    for (let i = 0; i < rectangleMock.mock.results.length; i++) {
      const card = rectangleMock.mock.results[i].value as Record<string, MockFn>;
      if (getMockFn(card.destroy).mock.calls.length > 0) continue;
      if (getMockFn(card.setInteractive).mock.calls.length > 0) {
        cards.push(card);
      }
    }
    return cards;
  }

  /**
   * Returns the active item images of the current round in creation order:
   * first the two addend dot-groups, then the four answer dot-groups.
   */
  function getItemsInOrder(
    scene: unknown,
  ): Array<{ texture: string; obj: Record<string, MockFn> }> {
    const imageMock = getMockFn((scene as { add: Record<string, unknown> }).add.image);
    const items: Array<{ texture: string; obj: Record<string, MockFn> }> = [];
    for (let i = 0; i < imageMock.mock.calls.length; i++) {
      const key = imageMock.mock.calls[i][2];
      if (
        typeof key !== "string" ||
        key === "mascot_idle" ||
        key === "icon_speaker" ||
        key === "plus" ||
        key === "equals"
      ) {
        continue;
      }
      const img = imageMock.mock.results[i].value as Record<string, MockFn>;
      if (getMockFn(img.destroy).mock.calls.length > 0) {
        continue;
      }
      items.push({ texture: key, obj: img });
    }
    return items;
  }

  /** Returns the created plus/equals cue images of the current round. */
  function getSymbolImages(scene: unknown): Map<string, Record<string, MockFn>> {
    const imageMock = getMockFn((scene as { add: Record<string, unknown> }).add.image);
    const symbols = new Map<string, Record<string, MockFn>>();
    for (let i = 0; i < imageMock.mock.calls.length; i++) {
      const key = imageMock.mock.calls[i][2];
      if (key !== "plus" && key !== "equals") continue;
      const img = imageMock.mock.results[i].value as Record<string, MockFn>;
      if (getMockFn(img.destroy).mock.calls.length > 0) continue;
      symbols.set(key, img);
    }
    return symbols;
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

  /** Simulates a tap on an answer card by triggering its pointerdown callback. */
  function tapCard(scene: unknown, cardIndex: number): void {
    const cards = getAnswerCardRects(scene);
    const card = cards[cardIndex];
    if (!card) throw new Error(`Answer card ${cardIndex} not found`);
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

  /** Taps the answer card matching the target total and fires the next-round delay. */
  function completeRound(scene: unknown): void {
    const round = getCurrentRound(scene);
    const targetSlot = round.answerOptions.indexOf(round.target);
    tapCard(scene, targetSlot);
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

  it("renders 2 addend cards, plus/equals cues, 4 interactive answer cards, and 6 progress dots", () => {
    const scene = new AddItUpScene();
    scene.create();

    const round = getCurrentRound(scene);

    // Two prompt addend cards, non-interactive, with thick outlines.
    const addends = getAddendCardRects(scene);
    expect(addends).toHaveLength(2);
    for (const card of addends) {
      expect(getMockFn(card.setStrokeStyle)).toHaveBeenCalled();
      expect(getMockFn(card.setInteractive)).not.toHaveBeenCalled();
    }

    // The plus and equals cues are present with a pop-in tween.
    const symbols = getSymbolImages(scene);
    expect(symbols.get("plus")).toBeDefined();
    expect(symbols.get("equals")).toBeDefined();

    // Four interactive answer cards, all ≥ 96px touch targets.
    const answers = getAnswerCardRects(scene);
    expect(answers).toHaveLength(4);
    for (const card of answers) {
      expect(getMockFn(card.setInteractive)).toHaveBeenCalled();
      expect(getMockFn(card.setStrokeStyle)).toHaveBeenCalled();
    }
    const rectCalls = getMockFn((scene as { add: Record<string, unknown> }).add.rectangle).mock
      .calls;
    for (const call of rectCalls) {
      if (typeof call[2] === "number") {
        expect(call[2]).toBeGreaterThanOrEqual(96);
        expect(call[3]).toBeGreaterThanOrEqual(96);
      }
    }

    // Item images in creation order: addend A (count a), addend B (count b),
    // then the four answer dot-groups with the round's answer item texture.
    const items = getItemsInOrder(scene);
    const a = round.addends[0];
    const b = round.addends[1];
    const aItems = items.slice(0, a.count);
    const bItems = items.slice(a.count, a.count + b.count);
    let offset = a.count + b.count;
    for (const option of round.answerOptions) {
      const optionItems = items.slice(offset, offset + option);
      expect(optionItems).toHaveLength(option);
      for (const item of optionItems) {
        expect(item.texture).toBe(round.answerItemTexture);
      }
      offset += option;
    }
    expect(aItems).toHaveLength(a.count);
    for (const item of aItems) {
      expect(item.texture).toBe(a.texture);
    }
    expect(bItems).toHaveLength(b.count);
    for (const item of bItems) {
      expect(item.texture).toBe(b.texture);
    }

    expect(getProgressDots(scene)).toHaveLength(6);
  });

  it("tapping the matching total card plays the correct chime, flashes success, and advances", () => {
    const scene = new AddItUpScene();
    scene.create();
    const round = getCurrentRound(scene);
    const targetSlot = round.answerOptions.indexOf(round.target);
    const dots = getProgressDots(scene);
    const cards = getAnswerCardRects(scene);

    tapCard(scene, targetSlot);

    expect(mockAudio.playCorrect).toHaveBeenCalledTimes(1);
    expect(mockAudio.playIncorrect).not.toHaveBeenCalled();

    // The tapped card flashes the success color.
    expect(getMockFn(cards[targetSlot].setFillStyle)).toHaveBeenCalledWith(0x68d391, 1);

    // Professor Hoot cheers with the celebrate pose on a correct answer.
    const mascot = getMascotImage(scene);
    expect(getMockFn(mascot.setTexture)).toHaveBeenCalledWith("mascot_celebrate");

    // The first progress dot fills.
    expect(getMockFn(dots[0].setAlpha)).toHaveBeenCalledWith(1);
    expect(getMockFn(dots[1].setAlpha)).not.toHaveBeenCalledWith(1);

    fireNextRoundDelay(scene);
    expect((scene as { roundIndex: number }).roundIndex).toBe(1);

    // The new round re-renders its own 4 answer cards; old ones are destroyed.
    const secondRound = getCurrentRound(scene);
    expect(secondRound.answerOptions).toHaveLength(4);
    expect(secondRound.answerOptions).toContain(secondRound.target);
    expect(getMockFn(cards[0].destroy)).toHaveBeenCalled();
    expect(getAnswerCardRects(scene)).toHaveLength(4);
  });

  it("tapping a non-matching card wiggles gently and does not advance the round", () => {
    const scene = new AddItUpScene();
    scene.create();
    const round = getCurrentRound(scene);
    const targetSlot = round.answerOptions.indexOf(round.target);
    const wrongIndex = targetSlot === 0 ? 1 : 0;
    const rect = getAnswerCardRects(scene)[wrongIndex];

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

    // The answer card and its dot-group wiggle together (no penalty).
    const items = getItemsInOrder(scene);
    const aCount = round.addends[0].count + round.addends[1].count;
    const priorOptions = round.answerOptions.slice(0, wrongIndex).reduce((sum, n) => sum + n, 0);
    const wrongItems = items.slice(
      aCount + priorOptions,
      aCount + priorOptions + round.answerOptions[wrongIndex],
    );
    const wiggleTween = getMockFn(scene.tweens.add).mock.calls.find((call) => {
      const targets = call[0]?.targets;
      if (!Array.isArray(targets)) return false;
      return targets.includes(rect) && wrongItems.some((item) => targets.includes(item.obj));
    });
    expect(wiggleTween).toBeDefined();
    if (!wiggleTween) return;
    expect((wiggleTween[0] as { angle: number }).angle).toBe(4);
    expect((wiggleTween[0] as { yoyo: boolean }).yoyo).toBe(true);
    // The card's own dot-group items participate in the wiggle.
    expect(wrongItems.length).toBeGreaterThan(0);
  });

  it("wins after 6 correct rounds: celebration, first-time sticker, justEarned, auto-return", () => {
    const scene = new AddItUpScene();
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
    ).mock.calls.find((call) => call[2] === "sticker_add_it_up");
    expect(stickerImage).toBeDefined();

    fireAutoReturn(scene);
    expect((scene as { scene: Record<string, MockFn> }).scene.start).toHaveBeenCalledWith("Hub", {
      justEarned: "add-it-up",
    });
  });

  it("does not award the sticker again or pass justEarned on repeat completions", () => {
    earnSticker("add-it-up");
    const scene = new AddItUpScene();
    scene.create();

    for (let i = 0; i < 6; i++) {
      completeRound(scene);
    }

    expect(mockAudio.playSticker).not.toHaveBeenCalled();
    fireAutoReturn(scene);
    expect((scene as { scene: Record<string, MockFn> }).scene.start).toHaveBeenCalledWith("Hub");
  });

  it("re-launching after completion unlocks input so cards are tappable again", () => {
    const scene = new AddItUpScene();
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
    const targetSlot = round.answerOptions.indexOf(round.target);
    const correctCallsBefore = mockAudio.playCorrect.mock.calls.length;
    tapCard(scene, targetSlot);
    expect(mockAudio.playCorrect.mock.calls.length).toBe(correctCallsBefore + 1);
  });

  it("parental lock hold success exits to the Hub", () => {
    const scene = new AddItUpScene();
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
    const scene = new AddItUpScene();
    scene.create();
    const round = getCurrentRound(scene);
    const targetSlot = round.answerOptions.indexOf(round.target);
    const wrongIndex = targetSlot === 0 ? 1 : 0;
    const rect = getAnswerCardRects(scene)[wrongIndex];

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

  it("generates a valid playthrough for the scene (6 rounds, distinct totals, target present)", () => {
    const scene = new AddItUpScene();
    scene.create();
    const rounds = (scene as { rounds: AddItUpRound[] }).rounds;

    expect(rounds).toHaveLength(6);
    for (const round of rounds) {
      expect(round.answerOptions).toHaveLength(4);
      expect(new Set(round.answerOptions).size).toBe(4);
      expect(round.answerOptions).toContain(round.target);
      expect(round.addends[0].count + round.addends[1].count).toBe(round.target);
    }
  });
});

/* --- Press feedback cohesion (Track: UI/UX Cohesion, Phase 2) --- */

describe("AddItUpScene press feedback cohesion", () => {
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
    const scene = new AddItUpScene();
    scene.create();

    const controls = getInteractiveRects(scene);
    expect(controls.length).toBeGreaterThan(0);
    for (const control of controls) {
      expectPressFeedbackContract(control);
    }
  });

  it("keeps the gameplay choice handler registered before the press squish", () => {
    stubMotion(false);
    const scene = new AddItUpScene();
    scene.create();

    const [first] = getInteractiveRects(scene);
    fireFirstHandler(first, "pointerdown");
    expect(first.setScale).not.toHaveBeenCalledWith(0.95);
  });

  it("attaches exactly one extra pointerdown listener per answer card when motion is allowed", () => {
    stubMotion(true);
    const reducedScene = new AddItUpScene();
    reducedScene.create();
    const reducedCounts = getInteractiveRects(reducedScene).map((control) =>
      countListeners(control, "pointerdown"),
    );

    stubMotion(false);
    const scene = new AddItUpScene();
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
    buildPlaythroughMock.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("passes the facade's band shift to buildPlaythrough", () => {
    getAdaptiveBandShiftMock.mockReturnValue(1);
    const scene = new AddItUpScene();
    scene.create();

    expect(buildPlaythroughMock).toHaveBeenCalledWith(1);
  });

  it("requests the classic ladder when the facade returns 0", () => {
    const scene = new AddItUpScene();
    scene.create();

    expect(buildPlaythroughMock).toHaveBeenCalledWith(0);
  });
});
