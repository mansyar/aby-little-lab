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

/** Mock the TTS wrapper so tests can verify "more"/"less" speech without real voices. */
const { mockSpeech } = vi.hoisted(() => ({
  mockSpeech: {
    speakWord: vi.fn(() => true),
    isSpeechSupported: vi.fn(() => true),
  },
}));

vi.mock("../../utils/speech", () => mockSpeech);

import type { MoreLessRound } from "../../game/moreLessLogic";
import { MoreLessScene } from "../../scenes/MoreLessScene";
import { earnSticker, updateSettings } from "../../utils/storage";

/** Casts a Phaser-typed method to a MockFn for mock assertions. */
function getMockFn(fn: unknown): MockFn {
  return fn as unknown as MockFn;
}

/** Returns the card side (0 = left, 1 = right) that satisfies the round. */
function getCorrectSide(round: MoreLessRound): number {
  const left = round.left.count;
  const right = round.right.count;
  return round.mode === "more" ? (left > right ? 0 : 1) : left < right ? 0 : 1;
}

describe("MoreLessScene round flow", () => {
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
    mockSpeech.speakWord.mockClear();
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
  function getCurrentRound(scene: unknown): MoreLessRound {
    const s = scene as {
      rounds: MoreLessRound[];
      roundIndex: number;
    };
    return s.rounds[s.roundIndex];
  }

  /** Returns the active (not-yet-destroyed) arrow cue image. */
  function getArrowImage(scene: unknown): Record<string, MockFn> {
    const imageMock = getMockFn((scene as { add: Record<string, unknown> }).add.image);
    const results: Array<Record<string, MockFn>> = [];
    for (let i = 0; i < imageMock.mock.calls.length; i++) {
      const key = imageMock.mock.calls[i][2];
      if (typeof key === "string" && key.startsWith("arrow_")) {
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
      if (typeof key !== "string" || key.startsWith("arrow_") || key === "mascot_idle") {
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
    tapCard(scene, getCorrectSide(round));
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

  it("renders an arrow cue, 6 progress dots, and two group cards with item copies", () => {
    const scene = new MoreLessScene();
    scene.create();

    const round = getCurrentRound(scene);
    // Round 1 is band 1 (counts 1-3) with two cards.
    expect(Math.max(round.left.count, round.right.count)).toBeLessThanOrEqual(3);

    // The arrow cue pops in from scale 0 to its display scale (256 / 512).
    const arrow = getArrowImage(scene);
    expect(getMockFn(arrow.setScale)).toHaveBeenCalledWith(0);
    const popTween = getMockFn(scene.tweens.add).mock.calls.find((call) => {
      const t = call[0]?.targets;
      return (Array.isArray(t) ? t.includes(arrow) : t === arrow) && call[0]?.scaleX === 0.5;
    });
    expect(popTween).toBeDefined();
    const imageMock = getMockFn((scene as { add: Record<string, unknown> }).add.image);
    // The texture matches the comparison mode: up arrow for MORE, down for LESS.
    expect(imageMock.mock.calls.some((call) => call[2] === `arrow_${round.mode}`)).toBe(true);

    // Two interactive cards with thick outlines.
    const cards = getCardRects(scene);
    expect(cards).toHaveLength(2);
    for (const card of cards) {
      expect(getMockFn(card.setInteractive)).toHaveBeenCalled();
      expect(getMockFn(card.setStrokeStyle)).toHaveBeenCalled();
    }

    // Cards exceed the 96×96 ideal touch target (220px side).
    const rectCalls = getMockFn((scene as { add: Record<string, unknown> }).add.rectangle).mock
      .calls;
    for (const call of rectCalls) {
      if (call[2] === 220) {
        expect(call[2]).toBeGreaterThanOrEqual(96);
        expect(call[3]).toBeGreaterThanOrEqual(96);
      }
    }

    // Each card renders exactly its count of item copies with its texture.
    const itemsByTexture = getItemImagesByTexture(scene);
    for (const group of [round.left, round.right]) {
      const items = itemsByTexture.get(group.texture);
      expect(items).toBeDefined();
      expect(items).toHaveLength(group.count);
    }

    expect(getProgressDots(scene)).toHaveLength(6);
  });

  it("centers the last partial row of items inside a card", () => {
    const scene = new MoreLessScene();
    scene.create();

    // Force a band-3-style group of 10 items: rows of 4 + 4 + 2. The final
    // row of 2 must sit centered under the card, not pushed to the left.
    const s = scene as unknown as {
      rounds: MoreLessRound[];
      roundIndex: number;
      renderRound: () => void;
    };
    s.rounds = [
      {
        mode: "more",
        left: { count: 10, texture: "shape_star" },
        right: { count: 2, texture: "sm_ball" },
      },
    ];
    s.roundIndex = 0;
    s.renderRound();

    // Left card sits at centerX - CARD_SPACING_X/2 = 392, cards row at
    // centerY + CARDS_Y_OFFSET = 534.
    const cardX = 512 - 120;
    const cardY = 384 + 150;
    const imageMock = getMockFn((scene as { add: Record<string, unknown> }).add.image);
    // The forced render's arrow is the LAST arrow image created — slice after
    // it so items from the initial renderRound (round 1) are excluded.
    let lastArrowCall = -1;
    for (let i = 0; i < imageMock.mock.calls.length; i++) {
      const key = imageMock.mock.calls[i][2];
      if (typeof key === "string" && key.startsWith("arrow_")) {
        lastArrowCall = i;
      }
    }
    expect(lastArrowCall).toBeGreaterThanOrEqual(0);
    if (lastArrowCall < 0) return;
    const starCalls = imageMock.mock.calls
      .slice(lastArrowCall + 1)
      .filter((call) => call[2] === "shape_star");
    expect(starCalls).toHaveLength(10);
    // Last row sits at cardY - gridHeight/2 + 2 * (48 + 4) + 24 = cardY + 52
    // (gridHeight = 3 * 48 + 2 * 4 = 152).
    const row2 = starCalls.filter((call) => call[1] === cardY + 52);
    expect(row2).toHaveLength(2);
    const xs = row2.map((call) => call[0] as number).sort((a, b) => a - b);
    // Centered: one slot either side of the card's midpoint (2 items x 48px
    // + 4px gap = 100px row, so offsets of ±26 from the center).
    expect(xs[0]).toBeCloseTo(cardX - 26, 5);
    expect(xs[1]).toBeCloseTo(cardX + 26, 5);
  });

  it("speaks the comparison word at round start when SFX is enabled", () => {
    const scene = new MoreLessScene();
    scene.create();

    const round = getCurrentRound(scene);
    expect(mockSpeech.speakWord).toHaveBeenCalledWith(round.mode, true);
  });

  it("silences TTS when the SFX toggle is off", () => {
    updateSettings({ sfxEnabled: false });

    const scene = new MoreLessScene();
    scene.create();

    const round = getCurrentRound(scene);
    expect(mockSpeech.speakWord).toHaveBeenCalledWith(round.mode, false);
  });

  it("tapping the correct group card plays the correct chime, flashes success, and advances", () => {
    const scene = new MoreLessScene();
    scene.create();
    const round = getCurrentRound(scene);
    const dots = getProgressDots(scene);
    const correctIndex = getCorrectSide(round);
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

    // The new round re-renders and speaks its own comparison word.
    const secondRound = getCurrentRound(scene);
    expect(mockSpeech.speakWord).toHaveBeenCalledWith(secondRound.mode, true);

    // The previous round's arrow is destroyed on re-render — no stale arrow
    // objects accumulate across rounds.
    const imageMock = getMockFn((scene as { add: Record<string, unknown> }).add.image);
    const arrowResults: Array<Record<string, MockFn>> = [];
    for (let i = 0; i < imageMock.mock.calls.length; i++) {
      const key = imageMock.mock.calls[i][2];
      if (typeof key === "string" && key.startsWith("arrow_")) {
        arrowResults.push(imageMock.mock.results[i].value as Record<string, MockFn>);
      }
    }
    expect(getMockFn(arrowResults[0].destroy)).toHaveBeenCalled();
    expect(getMockFn(arrowResults[1].destroy)).not.toHaveBeenCalled();
  });

  it("tapping the wrong group card wiggles gently and does not advance the round", () => {
    const scene = new MoreLessScene();
    scene.create();
    const round = getCurrentRound(scene);
    const wrongIndex = getCorrectSide(round) === 0 ? 1 : 0;
    const rect = getCardRects(scene)[wrongIndex];
    const wrongGroup = wrongIndex === 0 ? round.left : round.right;
    const items = getItemImagesByTexture(scene).get(wrongGroup.texture) ?? [];

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

  it("evaluates more vs less: in a 'less' round the higher-count card is wrong", () => {
    const scene = new MoreLessScene();
    scene.create();

    // Force a 'less' round where the left card holds MORE objects.
    const s = scene as unknown as {
      rounds: MoreLessRound[];
      roundIndex: number;
      renderRound: () => void;
    };
    s.rounds = [
      {
        mode: "less",
        left: { count: 5, texture: "shape_star" },
        right: { count: 2, texture: "sm_ball" },
      },
    ];
    s.roundIndex = 0;
    s.renderRound();

    // Tapping the HIGHER count (left, 5) in a 'less' round is incorrect…
    tapCard(scene, 0);
    expect(mockAudio.playIncorrect).toHaveBeenCalledTimes(1);
    expect(mockAudio.playCorrect).not.toHaveBeenCalled();
    expect((scene as { roundIndex: number }).roundIndex).toBe(0);

    // …and the arrow shows DOWN for a 'less' round.
    const imageMock = getMockFn((scene as { add: Record<string, unknown> }).add.image);
    expect(imageMock.mock.calls.some((call) => call[2] === "arrow_less")).toBe(true);
  });

  it("wins after 6 correct rounds: celebration, first-time sticker, justEarned, auto-return", () => {
    const scene = new MoreLessScene();
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
    ).mock.calls.find((call) => call[2] === "sticker_more_less");
    expect(stickerImage).toBeDefined();

    fireAutoReturn(scene);
    expect((scene as { scene: Record<string, MockFn> }).scene.start).toHaveBeenCalledWith("Hub", {
      justEarned: "more-less",
    });
  });

  /** Returns the speaker button image created with the icon_speaker texture. */
  function getSpeakerImage(scene: unknown): Record<string, MockFn> {
    const imageMock = getMockFn((scene as { add: Record<string, unknown> }).add.image);
    const index = imageMock.mock.calls.findIndex((call) => call[2] === "icon_speaker");
    return imageMock.mock.results[index].value as Record<string, MockFn>;
  }

  it("guards the speaker during the win celebration (no crash after the final round)", () => {
    const scene = new MoreLessScene();
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
    earnSticker("more-less");
    const scene = new MoreLessScene();
    scene.create();

    for (let i = 0; i < 6; i++) {
      completeRound(scene);
    }

    expect(mockAudio.playSticker).not.toHaveBeenCalled();
    fireAutoReturn(scene);
    expect((scene as { scene: Record<string, MockFn> }).scene.start).toHaveBeenCalledWith("Hub");
  });

  it("re-launching after completion unlocks input so cards are tappable again", () => {
    const scene = new MoreLessScene();
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
    const correctCallsBefore = mockAudio.playCorrect.mock.calls.length;
    tapCard(scene, getCorrectSide(round));
    expect(mockAudio.playCorrect.mock.calls.length).toBe(correctCallsBefore + 1);
  });

  it("parental lock hold success exits to the Hub", () => {
    const scene = new MoreLessScene();
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
    const scene = new MoreLessScene();
    scene.create();
    const round = getCurrentRound(scene);
    const wrongIndex = getCorrectSide(round) === 0 ? 1 : 0;
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

  it("generates a valid playthrough for the scene (6 rounds, easy-first bands, 3 more + 3 less)", () => {
    const scene = new MoreLessScene();
    scene.create();
    const rounds = (scene as { rounds: MoreLessRound[] }).rounds;

    expect(rounds).toHaveLength(6);
    // Bands: rounds 1-2 counts ≤3, 3-4 ≤5, 5-6 ≤10.
    for (const round of rounds.slice(0, 2)) {
      expect(Math.max(round.left.count, round.right.count)).toBeLessThanOrEqual(3);
    }
    for (const round of rounds.slice(2, 4)) {
      expect(Math.max(round.left.count, round.right.count)).toBeLessThanOrEqual(5);
    }
    for (const round of rounds.slice(4)) {
      expect(Math.max(round.left.count, round.right.count)).toBeLessThanOrEqual(10);
    }
    // Exactly 3 "more" and 3 "less" rounds.
    const moreCount = rounds.filter((round) => round.mode === "more").length;
    const lessCount = rounds.filter((round) => round.mode === "less").length;
    expect(moreCount).toBe(3);
    expect(lessCount).toBe(3);
    // Every round has distinct counts and exactly one satisfying card.
    for (const round of rounds) {
      expect(round.left.count).not.toBe(round.right.count);
      expect(round.left.texture).not.toBe(round.right.texture);
      const higher = round.left.count > round.right.count ? 0 : 1;
      const correct = round.mode === "more" ? higher : higher === 0 ? 1 : 0;
      expect(correct).toBe(getCorrectSide(round));
    }
  });
});
