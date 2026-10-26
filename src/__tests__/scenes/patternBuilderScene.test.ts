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

import { getCorrectShape, type PatternRound } from "../../game/patternBuilderLogic";
import { PatternBuilderScene } from "../../scenes/PatternBuilderScene";
import { earnSticker, hasSticker } from "../../utils/storage";
import {
  countListeners,
  expectPressFeedbackContract,
  fireFirstHandler,
  getInteractiveRects,
} from "../helpers/pressFeedback";

const { getAdaptiveBandShiftMock, generatePlaythroughMock } = vi.hoisted(() => ({
  getAdaptiveBandShiftMock: vi.fn((_gameId: string): -1 | 0 | 1 => 0),
  generatePlaythroughMock: vi.fn(),
}));

vi.mock("../../utils/storage", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  getAdaptiveBandShift: (gameId: string) => getAdaptiveBandShiftMock(gameId),
}));

vi.mock("../../game/patternBuilderLogic", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../game/patternBuilderLogic")>();
  return {
    ...actual,
    generatePlaythrough: (...args: Parameters<typeof actual.generatePlaythrough>) => {
      generatePlaythroughMock(...args);
      return actual.generatePlaythrough(...args);
    },
  };
});

/** Casts a Phaser-typed method to a MockFn for mock assertions. */
function getMockFn(fn: unknown): MockFn {
  return fn as unknown as MockFn;
}

interface SceneInternals {
  rounds: PatternRound[];
  roundIndex: number;
  inputLocked: boolean;
  progressDots: Array<Record<string, MockFn>>;
  cardRects: Array<Record<string, MockFn>>;
  cardShapes: Array<Record<string, MockFn>>;
  roundObjects: Array<Record<string, MockFn>>;
}

function getInternals(scene: PatternBuilderScene): SceneInternals {
  return scene as unknown as SceneInternals;
}

describe("PatternBuilderScene round flow", () => {
  let matchMediaMock: MatchMediaStub;

  beforeEach(() => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
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

  function createScene(): PatternBuilderScene {
    const scene = new PatternBuilderScene();
    scene.create();
    return scene;
  }

  /** Taps an answer card by invoking its pointerdown handler. */
  function tapCard(scene: PatternBuilderScene, cardIndex: number): void {
    const card = getInternals(scene).cardRects[cardIndex];
    const handler = getMockFn(card.on).mock.calls.find((call) => call[0] === "pointerdown");
    expect(handler).toBeDefined();
    if (handler && typeof handler[1] === "function") {
      (handler[1] as () => void)();
    }
  }

  /** Index of the correct card for the current round. */
  function getCorrectIndex(scene: PatternBuilderScene): number {
    const round = getInternals(scene).rounds[getInternals(scene).roundIndex];
    return round.choices.indexOf(getCorrectShape(round));
  }

  /** Completes the snap tween of the current round. */
  function fireSnap(scene: PatternBuilderScene): void {
    const tweenMock = getMockFn((scene as unknown as { tweens: { add: MockFn } }).tweens.add);
    const snap = tweenMock.mock.calls.find((call) => call[0]?.ease === "Back.out");
    expect(snap).toBeDefined();
    if (snap && typeof snap[0].onComplete === "function") {
      snap[0].onComplete();
    }
  }

  /** Fires the 700ms next-round delayed call. */
  function fireNextRoundDelay(scene: PatternBuilderScene): void {
    const delayedCallMock = getMockFn(
      (scene as unknown as { time: { delayedCall: MockFn } }).time.delayedCall,
    );
    const next = delayedCallMock.mock.calls.find((call) => call[0] === 700);
    expect(next).toBeDefined();
    if (next && typeof next[1] === "function") {
      next[1]();
    }
  }

  /** Completes one full round: correct tap → snap → next round. */
  function completeRound(scene: PatternBuilderScene): void {
    tapCard(scene, getCorrectIndex(scene));
    fireSnap(scene);
    fireNextRoundDelay(scene);
  }

  /** Fires every fadeOut callback (transition completion). */
  function completeFadeOuts(scene: PatternBuilderScene): void {
    const fadeOutMock = getMockFn(
      (scene as unknown as { cameras: { main: { fadeOut: MockFn } } }).cameras.main.fadeOut,
    );
    for (const call of fadeOutMock.mock.calls) {
      const callback = call[4] as () => void;
      callback();
    }
  }

  it("renders 6 progress dots, 4 pattern slots with one gap, and 3 answer cards", () => {
    const scene = createScene();

    const circleMock = getMockFn((scene as unknown as { add: { circle: MockFn } }).add.circle);
    expect(circleMock.mock.results).toHaveLength(6);

    const internals = getInternals(scene);
    expect(internals.rounds).toHaveLength(6);
    expect(internals.roundObjects).toHaveLength(4);
    expect(internals.cardRects).toHaveLength(3);
    expect(internals.cardShapes).toHaveLength(3);

    // 3 filled slots at the pattern row + 3 card shape images.
    const imageMock = getMockFn((scene as unknown as { add: { image: MockFn } }).add.image);
    const rowY = 384 - 80;
    const slotImages = imageMock.mock.calls.filter(
      (call) => typeof call[1] === "number" && Math.abs(call[1] - rowY) < 0.001,
    );
    expect(slotImages).toHaveLength(3);

    // The gap is a stroked rectangle at the pattern row.
    const rectMock = getMockFn((scene as unknown as { add: { rectangle: MockFn } }).add.rectangle);
    const gapIndex = rectMock.mock.calls.findIndex((call) => Math.abs(call[1] - rowY) < 0.001);
    expect(gapIndex).toBeGreaterThanOrEqual(0);
    expect(
      getMockFn((rectMock.mock.results[gapIndex].value as Record<string, MockFn>).setStrokeStyle),
    ).toHaveBeenCalled();
  });

  it("snaps the correct shape into the gap and fills the progress dot", () => {
    const scene = createScene();
    const internals = getInternals(scene);
    const tapped = internals.cardShapes[getCorrectIndex(scene)];

    tapCard(scene, getCorrectIndex(scene));

    expect(mockAudio.playCorrect).toHaveBeenCalledTimes(1);
    expect(mockMascot.cheer).toHaveBeenCalledTimes(1);

    // Splash burst at the gap position (FR-9d).
    const graphicsMock = getMockFn(
      (scene as unknown as { add: { graphics: MockFn } }).add.graphics,
    );
    expect(graphicsMock.mock.results.length).toBeGreaterThan(0);

    const tweenMock = getMockFn((scene as unknown as { tweens: { add: MockFn } }).tweens.add);
    const snap = tweenMock.mock.calls.find((call) => call[0]?.targets === tapped);
    expect(snap).toBeDefined();
    expect(snap?.[0].duration).toBe(200);
    expect(snap?.[0].ease).toBe("Back.out");
    const gapIndex = internals.rounds[internals.roundIndex].gapIndex;
    expect(snap?.[0].x).toBe(512 + (gapIndex - 1.5) * 170);
    expect(snap?.[0].y).toBe(384 - 80);

    fireSnap(scene);

    expect(getMockFn(tapped.destroy)).toHaveBeenCalledTimes(1);
    expect(internals.cardRects).toHaveLength(2);
    expect(internals.cardShapes).toHaveLength(2);
    // The gap slot image is added and the dot pops.
    expect(internals.roundObjects).toHaveLength(5);
    expect(getMockFn(internals.progressDots[0].setAlpha)).toHaveBeenCalledWith(1);
    const dotPop = tweenMock.mock.calls.find(
      (call) => call[0]?.targets === internals.progressDots[0],
    );
    expect(dotPop).toBeDefined();
    expect(dotPop?.[0].scaleX).toBe(1.4);
  });

  it("advances to the next round after the 700ms delay", () => {
    const scene = createScene();

    completeRound(scene);

    const internals = getInternals(scene);
    expect(internals.roundIndex).toBe(1);
    expect(internals.inputLocked).toBe(false);
    expect(internals.cardRects).toHaveLength(3);
    expect(mockAudio.playWin).not.toHaveBeenCalled();
  });

  it("wiggles wrong cards with a soft tone and no penalty", () => {
    const scene = createScene();
    const internals = getInternals(scene);
    const round = internals.rounds[0];
    const wrongIndex = round.choices.findIndex((c) => c !== getCorrectShape(round));
    const wrongRect = internals.cardRects[wrongIndex];
    const wrongShape = internals.cardShapes[wrongIndex];

    tapCard(scene, wrongIndex);

    expect(mockAudio.playIncorrect).toHaveBeenCalledTimes(1);
    expect(mockMascot.nod).toHaveBeenCalledTimes(1);
    expect(internals.inputLocked).toBe(false);

    const tweenMock = getMockFn((scene as unknown as { tweens: { add: MockFn } }).tweens.add);
    const wiggle = tweenMock.mock.calls.find((call) => call[0]?.repeat === 3);
    expect(wiggle).toBeDefined();
    expect(wiggle?.[0].targets).toEqual([wrongRect, wrongShape]);
    expect(wiggle?.[0].angle).toBe(4);
    expect(wiggle?.[0].yoyo).toBe(true);
  });

  it("uses reduced-motion wiggle and snap timings", () => {
    setReducedMotion(true);
    const scene = createScene();

    const internals = getInternals(scene);
    const round = internals.rounds[0];
    const wrongIndex = round.choices.findIndex((c) => c !== getCorrectShape(round));

    tapCard(scene, wrongIndex);
    const tweenMock = getMockFn((scene as unknown as { tweens: { add: MockFn } }).tweens.add);
    const wiggle = tweenMock.mock.calls.find((call) => call[0]?.repeat === 3);
    expect(wiggle?.[0].angle).toBe(2);
    expect(wiggle?.[0].duration).toBe(200);

    tapCard(scene, getCorrectIndex(scene));
    const snap = tweenMock.mock.calls.find(
      (call) =>
        call[0]?.targets === internals.cardShapes[getCorrectIndex(scene)] &&
        call[0]?.ease === "Back.out",
    );
    expect(snap?.[0].duration).toBe(120);
  });

  it("completes after 6 rounds: win, first-time sticker, justEarned auto-return", () => {
    const scene = createScene();

    for (let i = 0; i < 6; i++) {
      completeRound(scene);
    }

    expect(mockAudio.playWin).toHaveBeenCalledTimes(1);
    expect(mockMascot.cheer).toHaveBeenCalledWith(true);
    expect(hasSticker("pattern-builder")).toBe(true);
    expect(mockAudio.playSticker).toHaveBeenCalledTimes(1);

    const imageMock = getMockFn((scene as unknown as { add: { image: MockFn } }).add.image);
    const stickerCall = imageMock.mock.calls.find((call) => call[2] === "sticker_pattern_builder");
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
    ).toHaveBeenCalledWith("Hub", { justEarned: "pattern-builder" });
  });

  it("does not re-award the sticker or pass justEarned on repeat completions", () => {
    earnSticker("pattern-builder");
    const scene = createScene();

    for (let i = 0; i < 6; i++) {
      completeRound(scene);
    }

    expect(mockAudio.playSticker).not.toHaveBeenCalled();
    const imageMock = getMockFn((scene as unknown as { add: { image: MockFn } }).add.image);
    const stickerCall = imageMock.mock.calls.find((call) => call[2] === "sticker_pattern_builder");
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

  it("resets input and uses fresh progress dots on relaunch", () => {
    const scene = createScene();
    for (let i = 0; i < 6; i++) {
      completeRound(scene);
    }
    expect(mockAudio.playWin).toHaveBeenCalledTimes(1);

    scene.create();

    const internals = getInternals(scene);
    expect(internals.inputLocked).toBe(false);
    // Session 2 must have exactly 6 dots (not 12 with stale destroyed ones).
    expect(internals.progressDots).toHaveLength(6);

    // A correct tap fills the FIRST dot — the fresh one from session 2.
    tapCard(scene, getCorrectIndex(scene));
    fireSnap(scene);
    expect(getMockFn(internals.progressDots[0].setAlpha)).toHaveBeenCalledWith(1);
  });
});

/* --- Press feedback cohesion (Track: UI/UX Cohesion, Phase 2) --- */

describe("PatternBuilderScene press feedback cohesion", () => {
  /** Stubs matchMedia to control the prefers-reduced-motion result. */
  function stubMotion(reduced: boolean): void {
    stubMatchMedia(reduced);
  }

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("gives every answer card press feedback restoring on release, out, and cancel", () => {
    stubMotion(false);
    const scene = new PatternBuilderScene();
    scene.create();

    const controls = getInteractiveRects(scene);
    expect(controls.length).toBeGreaterThan(0);
    for (const control of controls) {
      expectPressFeedbackContract(control);
    }
  });

  it("keeps the gameplay choice handler registered before the press squish", () => {
    stubMotion(false);
    const scene = new PatternBuilderScene();
    scene.create();

    const [first] = getInteractiveRects(scene);
    fireFirstHandler(first, "pointerdown");
    expect(first.setScale).not.toHaveBeenCalledWith(0.95);
  });

  it("attaches exactly one extra pointerdown listener per card when motion is allowed", () => {
    stubMotion(true);
    const reducedScene = new PatternBuilderScene();
    reducedScene.create();
    const reducedCounts = getInteractiveRects(reducedScene).map((control) =>
      countListeners(control, "pointerdown"),
    );

    stubMotion(false);
    const scene = new PatternBuilderScene();
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

describe("PatternBuilderScene adaptive shift", () => {
  beforeEach(() => {
    getAdaptiveBandShiftMock.mockClear();
    generatePlaythroughMock.mockClear();
    getAdaptiveBandShiftMock.mockReturnValue(0);
  });

  it("passes the facade's band shift to generatePlaythrough", () => {
    getAdaptiveBandShiftMock.mockReturnValue(1);
    const scene = new PatternBuilderScene();
    scene.create();
    expect(getAdaptiveBandShiftMock).toHaveBeenCalledWith("pattern-builder");
    expect(generatePlaythroughMock).toHaveBeenCalledWith(6, 1, expect.any(Function));
  });

  it("requests the classic ladder when the facade returns 0", () => {
    const scene = new PatternBuilderScene();
    scene.create();
    expect(generatePlaythroughMock).toHaveBeenCalledWith(6, 0, expect.any(Function));
  });
});
