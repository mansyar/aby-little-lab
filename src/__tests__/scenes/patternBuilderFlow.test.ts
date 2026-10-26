import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MockFn } from "../helpers/phaserMock";
import {
  assertWinCelebrationCreated,
  completeFadeOuts,
  expectTouchTargetSize,
  getMockFn,
  mockAudio,
  mockSpeech,
} from "../helpers/sceneFlowHarness";

/**
 * Every module the scene flows touch is replaced with a shared double from
 * `sceneFlowHarness`. The `vi.mock` calls must stay in this file: Vitest hoists
 * them above the imports, so the factories load the harness dynamically.
 */
vi.mock("../../utils/fonts", async () => {
  const { mockEnsureGlyphFontLoaded } = await import("../helpers/sceneFlowHarness");
  return { ensureGlyphFontLoaded: mockEnsureGlyphFontLoaded };
});

vi.mock("phaser", async () => {
  const { createPhaserModuleMock } = await import("../helpers/phaserMock");
  return createPhaserModuleMock().module;
});

vi.mock("../../utils/storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../utils/storage")>();
  const { mockStorageHasSticker, mockStorageEarnSticker, storageActual } = await import(
    "../helpers/sceneFlowHarness"
  );
  storageActual.hasSticker = actual.hasSticker;
  storageActual.earnSticker = actual.earnSticker;
  mockStorageHasSticker.mockImplementation(actual.hasSticker);
  mockStorageEarnSticker.mockImplementation(actual.earnSticker);
  return {
    ...actual,
    hasSticker: mockStorageHasSticker,
    earnSticker: mockStorageEarnSticker,
  };
});

vi.mock("../../audio/AudioManager", async () => {
  const { mockAudio } = await import("../helpers/sceneFlowHarness");
  return { AudioManager: { getInstance: () => mockAudio } };
});

vi.mock("../../utils/speech", async () => {
  const { mockSpeech } = await import("../helpers/sceneFlowHarness");
  return mockSpeech;
});

vi.mock("../../components/SettingsPanel", async () => {
  const { MockSettingsPanel } = await import("../helpers/sceneFlowHarness");
  return { SettingsPanel: MockSettingsPanel };
});

vi.mock("../../components/PwaToast", async () => {
  const { MockPwaToast } = await import("../helpers/sceneFlowHarness");
  return { PwaToast: MockPwaToast };
});

vi.mock("../../utils/pwaBridge", async () => {
  const { mockBridge } = await import("../helpers/sceneFlowHarness");
  return { getPwaBridge: () => mockBridge };
});

vi.mock("../../scenes/sceneRegistry", async () => {
  const { mockEnsureSceneLoaded } = await import("../helpers/sceneFlowHarness");
  return { ensureSceneLoaded: mockEnsureSceneLoaded };
});

import { getCorrectShape, type PatternRound } from "../../game/patternBuilderLogic";
import { PatternBuilderScene } from "../../scenes/PatternBuilderScene";
import { earnSticker, hasSticker } from "../../utils/storage";

beforeEach(() => {
  vi.stubGlobal("screen", {
    orientation: {
      lock: vi.fn().mockResolvedValue(undefined),
      unlock: vi.fn(),
    },
  });
  localStorage.clear();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PatternBuilderScene round flow", () => {
  beforeEach(() => {
    // FR-6 exception: the rng seam stops at the logic boundary (A4), so a
    // scene-level stub is the only way to make this scene's draws repeatable.
    vi.spyOn(Math, "random").mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /** Returns the current round of the scene. */
  function getCurrentRound(scene: unknown): PatternRound {
    const s = scene as {
      rounds: PatternRound[];
      roundIndex: number;
    };
    return s.rounds[s.roundIndex];
  }

  /** Returns the answer card rectangles (created at the cards row y). */
  function getCardRects(scene: unknown): Array<Record<string, MockFn>> {
    const s = scene as { add: Record<string, unknown> };
    const rectangleMock = getMockFn(s.add.rectangle);
    const cardsY = (scene as { cameras: { main: { centerY: number } } }).cameras.main.centerY + 170;
    const cards: Array<Record<string, MockFn>> = [];
    for (let i = 0; i < rectangleMock.mock.calls.length; i++) {
      if (rectangleMock.mock.calls[i][1] === cardsY) {
        cards.push(rectangleMock.mock.results[i].value as Record<string, MockFn>);
      }
    }
    return cards;
  }

  /** Returns the answer card shape images (created at the cards row y). */
  function getCardShapes(scene: unknown): Array<Record<string, MockFn>> {
    const s = scene as { add: Record<string, unknown> };
    const imageMock = getMockFn(s.add.image);
    const cardsY = (scene as { cameras: { main: { centerY: number } } }).cameras.main.centerY + 170;
    const cards: Array<Record<string, MockFn>> = [];
    for (let i = 0; i < imageMock.mock.calls.length; i++) {
      if (imageMock.mock.calls[i][1] === cardsY) {
        cards.push(imageMock.mock.results[i].value as Record<string, MockFn>);
      }
    }
    return cards;
  }

  /** Returns progress dot circle objects in creation order. */
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
    const cards = getCardRects(scene);
    const card = cards[cardIndex];
    if (!card) throw new Error(`Card ${cardIndex} not found`);
    const onCalls = getMockFn(card.on).mock.calls;
    const pointerdownCall = onCalls.find((c) => c[0] === "pointerdown");
    if (pointerdownCall && typeof pointerdownCall[1] === "function") {
      (pointerdownCall[1] as () => void)();
    }
  }

  /** Taps the correct card for the current round and fires the snap + next-round delay. */
  function completeRound(scene: unknown): void {
    const round = getCurrentRound(scene);
    const correctIndex = round.choices.indexOf(getCorrectShape(round));
    const cardShape = getCardShapes(scene)[correctIndex];
    tapCard(scene, correctIndex);

    const snapTween = getMockFn(
      (scene as { tweens: Record<string, unknown> }).tweens.add,
    ).mock.calls.find((call) => call[0]?.targets === cardShape && call[0]?.ease === "Back.out");
    expect(snapTween).toBeDefined();
    if (!snapTween) return;
    if (typeof snapTween[0].onComplete === "function") {
      (snapTween[0].onComplete as () => void)();
    }

    const delayedCallMock = getMockFn(
      (scene as { time: Record<string, unknown> }).time.delayedCall,
    );
    const nextRoundCall = delayedCallMock.mock.calls.find((call) => call[0] === 700);
    if (nextRoundCall && typeof nextRoundCall[1] === "function") {
      (nextRoundCall[1] as () => void)();
    }
  }

  it("creates 6 progress dots, 3 filled slots, 1 gap marker, and 3 answer cards", () => {
    const scene = new PatternBuilderScene();
    scene.create();

    const dots = getProgressDots(scene);
    expect(dots).toHaveLength(6);

    const cards = getCardRects(scene);
    expect(cards).toHaveLength(3);

    const rowY = scene.cameras.main.centerY - 80;
    const shapeCalls = getMockFn(scene.add.image).mock.calls;
    const slotShapes = shapeCalls.filter((call) => call[1] === rowY);
    expect(slotShapes).toHaveLength(3);

    const rectCalls = getMockFn(scene.add.rectangle).mock.calls;
    const gapMarkers = rectCalls.filter((call) => call[1] === rowY);
    expect(gapMarkers).toHaveLength(1);
    expect(getMockFn(cards[0].setInteractive)).toHaveBeenCalled();
    expect(getMockFn(cards[0].setStrokeStyle)).toHaveBeenCalled();

    // Answer cards meet the 96×96 ideal touch target.
    for (const card of cards) {
      expectTouchTargetSize(card);
    }
  });

  it("tapping the correct card plays the correct chime, fills the dot, and advances", () => {
    const scene = new PatternBuilderScene();
    scene.create();
    const round = getCurrentRound(scene);
    const correctIndex = round.choices.indexOf(getCorrectShape(round));
    const dots = getProgressDots(scene);

    tapCard(scene, correctIndex);

    expect(mockAudio.playCorrect).toHaveBeenCalledTimes(1);
    expect(mockAudio.playIncorrect).not.toHaveBeenCalled();

    // Professor Hoot cheers with the celebrate pose on a correct answer.
    const mascot = getMascotImage(scene);
    expect(getMockFn(mascot.setTexture)).toHaveBeenCalledWith("mascot_celebrate");
    const cheerTween = getMockFn(scene.tweens.add).mock.calls.find(
      (call) => call[0]?.targets === mascot && typeof call[0]?.scale === "number",
    );
    expect(cheerTween).toBeDefined();
    expect(cheerTween?.[0]?.scale).toBeCloseTo(0.2 * 1.1, 5);

    const cardShape = getCardShapes(scene)[correctIndex];
    const rowY = scene.cameras.main.centerY - 80;
    const snapTween = getMockFn(scene.tweens.add).mock.calls.find(
      (call) =>
        call[0]?.targets === cardShape && call[0]?.ease === "Back.out" && call[0]?.y === rowY,
    );
    expect(snapTween).toBeDefined();
    if (!snapTween) return;
    expect((snapTween[0] as { duration: number }).duration).toBe(200);

    // Complete the snap: fills the progress dot and schedules the next round.
    if (typeof snapTween[0].onComplete === "function") {
      (snapTween[0].onComplete as () => void)();
    }

    // The flown card shape is destroyed after snapping into the gap,
    // so no orphaned display objects linger between rounds.
    expect(getMockFn(cardShape.destroy)).toHaveBeenCalled();

    expect(getMockFn(dots[0].setAlpha)).toHaveBeenCalledWith(1);
    expect(getMockFn(dots[1].setAlpha)).not.toHaveBeenCalledWith(1);

    const delayedCallMock = getMockFn(scene.time.delayedCall);
    const nextRoundCall = delayedCallMock.mock.calls.find((call) => call[0] === 700);
    expect(nextRoundCall).toBeDefined();
    if (!nextRoundCall) return;
    (nextRoundCall[1] as () => void)();

    expect((scene as unknown as { roundIndex: number }).roundIndex).toBe(1);
  });

  it("tapping a wrong card wiggles it gently and does not advance the round", () => {
    const scene = new PatternBuilderScene();
    scene.create();
    const round = getCurrentRound(scene);
    const correctIndex = round.choices.indexOf(getCorrectShape(round));
    const wrongIndex = (correctIndex + 1) % 3;
    const rect = getCardRects(scene)[wrongIndex];
    const shape = getCardShapes(scene)[wrongIndex];

    tapCard(scene, wrongIndex);

    expect(mockAudio.playIncorrect).toHaveBeenCalledTimes(1);
    expect(mockAudio.playCorrect).not.toHaveBeenCalled();
    expect((scene as unknown as { roundIndex: number }).roundIndex).toBe(0);

    // Professor Hoot nods along with the soft incorrect tone.
    const mascot = getMascotImage(scene);
    const nodTween = getMockFn(scene.tweens.add).mock.calls.find(
      (call) => call[0]?.targets === mascot && call[0]?.angle?.to === 6,
    );
    expect(nodTween).toBeDefined();

    const wiggleTween = getMockFn(scene.tweens.add).mock.calls.find((call) => {
      const targets = call[0]?.targets;
      if (!Array.isArray(targets)) return false;
      return targets.includes(rect) && targets.includes(shape);
    });
    expect(wiggleTween).toBeDefined();
    if (!wiggleTween) return;
    expect((wiggleTween[0] as { angle: number }).angle).toBe(4);
    expect((wiggleTween[0] as { yoyo: boolean }).yoyo).toBe(true);
  });

  it("completing all 6 rounds triggers win, first-time sticker award, and auto-return", () => {
    vi.mocked(hasSticker).mockReturnValue(false);

    const scene = new PatternBuilderScene();
    scene.create();

    for (let i = 0; i < 6; i++) {
      completeRound(scene);
    }

    expect(mockAudio.playWin).toHaveBeenCalledTimes(1);
    expect(earnSticker).toHaveBeenCalledWith("pattern-builder");
    expect(mockAudio.playSticker).toHaveBeenCalled();
    assertWinCelebrationCreated(scene);

    // Professor Hoot gives the big cheer on the win (last mascot tween).
    const mascot = getMascotImage(scene);
    const mascotTweens = getMockFn(scene.tweens.add).mock.calls.filter(
      (call) => call[0]?.targets === mascot && typeof call[0]?.scale === "number",
    );
    const bigCheer = mascotTweens[mascotTweens.length - 1];
    expect(bigCheer).toBeDefined();
    expect(bigCheer?.[0]?.scale).toBeCloseTo(0.2 * 1.2, 5);

    const delayedCallMock = getMockFn(scene.time.delayedCall);
    const autoReturnCall = delayedCallMock.mock.calls.find((call) => call[0] === 3000);
    expect(autoReturnCall).toBeDefined();
    if (!autoReturnCall) return;
    (autoReturnCall[1] as () => void)();
    completeFadeOuts(scene);

    expect(getMockFn(scene.scene.start)).toHaveBeenCalledWith("Hub", {
      justEarned: "pattern-builder",
    });
  });

  it("does not re-award sticker when already earned", () => {
    vi.mocked(hasSticker).mockReturnValue(true);

    const scene = new PatternBuilderScene();
    scene.create();

    for (let i = 0; i < 6; i++) {
      completeRound(scene);
    }

    expect(earnSticker).not.toHaveBeenCalled();
    expect(mockAudio.playSticker).not.toHaveBeenCalled();
    expect(mockAudio.playWin).toHaveBeenCalledTimes(1);

    const delayedCallMock = getMockFn(scene.time.delayedCall);
    const autoReturnCall = delayedCallMock.mock.calls.find((call) => call[0] === 3000);
    expect(autoReturnCall).toBeDefined();
    if (!autoReturnCall) return;
    (autoReturnCall[1] as () => void)();
    completeFadeOuts(scene);

    expect(getMockFn(scene.scene.start)).toHaveBeenCalledWith("Hub");
  });

  it("re-launching after completion unlocks input so cards are tappable again", () => {
    vi.mocked(hasSticker).mockReturnValue(true);
    const scene = new PatternBuilderScene();
    scene.create();

    for (let i = 0; i < 6; i++) {
      completeRound(scene);
    }
    expect((scene as unknown as { inputLocked: boolean }).inputLocked).toBe(true);

    // Returning to the Hub and tapping the tile again calls create() on the
    // same scene instance (Phaser restart) — input must be unlocked.
    scene.create();
    expect((scene as unknown as { inputLocked: boolean }).inputLocked).toBe(false);

    const round = getCurrentRound(scene);
    const correctIndex = round.choices.indexOf(getCorrectShape(round));
    const correctCallsBefore = mockAudio.playCorrect.mock.calls.length;
    tapCard(scene, correctIndex);
    expect(mockAudio.playCorrect.mock.calls.length).toBe(correctCallsBefore + 1);
  });
});

describe("PatternBuilderScene spoken instruction", () => {
  beforeEach(() => {
    localStorage.clear();
    for (const fn of Object.values(mockSpeech)) {
      fn.mockClear();
    }
  });

  it("shows and speaks the rule when the round starts", () => {
    const scene = new PatternBuilderScene();
    scene.create();

    const addText = (scene as unknown as { add: { text: { mock: { calls: unknown[][] } } } }).add
      .text;
    const call = addText.mock.calls.find(
      (c) => c[2] === "Pick the shape that finishes the pattern.",
    );
    expect(call).toBeDefined();
    expect(mockSpeech.speakSentence).toHaveBeenCalledWith(
      "Pick the shape that finishes the pattern.",
      true,
    );
  });
});
