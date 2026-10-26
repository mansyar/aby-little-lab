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

/** Mock the TTS wrapper so tests can verify color speech without real voices. */
const { mockSpeech } = vi.hoisted(() => ({
  mockSpeech: {
    speakWord: vi.fn(() => true),
    isSpeechSupported: vi.fn(() => true),
    onSpeechLifecycle: vi.fn(() => vi.fn()),
  },
}));

vi.mock("../../utils/speech", () => mockSpeech);

import type { ColorMatchRound } from "../../game/colorMatchLogic";
import { promptFor } from "../../game/colorMatchLogic";
import { ColorMatchScene } from "../../scenes/ColorMatchScene";
import { earnSticker, updateSettings } from "../../utils/storage";
import {
  countListeners,
  expectPressFeedbackContract,
  fireFirstHandler,
  getInteractiveRects,
} from "../helpers/pressFeedback";

const { getAdaptiveBandShiftMock, buildPlaythroughMock } = vi.hoisted(() => ({
  getAdaptiveBandShiftMock: vi.fn((_gameId: string): -1 | 0 | 1 => 0),
  buildPlaythroughMock: vi.fn(),
}));

vi.mock("../../utils/storage", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  getAdaptiveBandShift: (gameId: string) => getAdaptiveBandShiftMock(gameId),
}));

vi.mock("../../game/colorMatchLogic", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../game/colorMatchLogic")>();
  return {
    ...actual,
    buildPlaythrough: (...args: Parameters<typeof actual.buildPlaythrough>) => {
      buildPlaythroughMock(...args);
      return actual.buildPlaythrough(...args);
    },
  };
});

/** Casts a Phaser-typed method to a MockFn for mock assertions. */
function getMockFn(fn: unknown): MockFn {
  return fn as unknown as MockFn;
}

describe("ColorMatchScene round flow", () => {
  let matchMediaMock: MatchMediaStub;

  beforeEach(() => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    matchMediaMock = stubMatchMedia(false);
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
    matchMediaMock.setReducedMotion(reduced);
  }

  /** Returns the current round of the scene. */
  function getCurrentRound(scene: unknown): ColorMatchRound {
    const s = scene as {
      rounds: ColorMatchRound[];
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

  /** Returns the active item images of the current round, grouped by texture. */
  function getItemImagesByTexture(scene: unknown): Map<string, Array<Record<string, MockFn>>> {
    const imageMock = getMockFn((scene as { add: Record<string, unknown> }).add.image);
    const byTexture = new Map<string, Array<Record<string, MockFn>>>();
    for (let i = 0; i < imageMock.mock.calls.length; i++) {
      const key = imageMock.mock.calls[i][2];
      if (typeof key !== "string" || key === "mascot_idle" || key === "icon_speaker") {
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

  /** Returns the active (not-yet-destroyed) prompt swatch graphics object. */
  function getSwatchGraphics(scene: unknown): Record<string, MockFn> {
    const s = scene as { add: Record<string, unknown> };
    const graphicsMock = getMockFn(s.add.graphics);
    const active = graphicsMock.mock.results.filter((result) => {
      const obj = result.value as Record<string, MockFn>;
      return getMockFn(obj.destroy).mock.calls.length === 0;
    });
    return active.at(-1)?.value as Record<string, MockFn>;
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

  /** Taps the card matching the target color and fires the next-round delay. */
  function completeRound(scene: unknown): void {
    const round = getCurrentRound(scene);
    const targetSlot = round.cards.findIndex((card) => card.colorId === round.targetColorId);
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

  it("renders a prompt swatch in the target color, a 2x2 grid of 4 distinct-color cards, and 6 progress dots", () => {
    const scene = new ColorMatchScene();
    scene.create();

    const round = getCurrentRound(scene);

    // The swatch is filled with the target color and outlined.
    const swatch = getSwatchGraphics(scene);
    const target = round.cards.find((card) => card.colorId === round.targetColorId);
    expect(target).toBeDefined();
    if (!target) return;
    expect(getMockFn(swatch.fillStyle)).toHaveBeenCalledWith(parseInt(target.fill.slice(1), 16), 1);
    expect(getMockFn(swatch.fillRoundedRect)).toHaveBeenCalledWith(
      512 - 110 / 2,
      384 - 155 - 110 / 2,
      110,
      110,
      24,
    );
    expect(getMockFn(swatch.strokeRoundedRect)).toHaveBeenCalled();

    // Four interactive cards with thick outlines, exceeding 96px touch size.
    const cards = getCardRects(scene);
    expect(cards).toHaveLength(4);
    for (const card of cards) {
      expect(getMockFn(card.setInteractive)).toHaveBeenCalled();
      expect(getMockFn(card.setStrokeStyle)).toHaveBeenCalled();
    }
    const rectCalls = getMockFn(
      (scene as unknown as { add: Record<string, unknown> }).add.rectangle,
    ).mock.calls;
    for (const call of rectCalls) {
      if (typeof call[2] === "number" && call[2] >= 200) {
        expect(call[2]).toBeGreaterThanOrEqual(96);
        expect(call[3]).toBeGreaterThanOrEqual(96);
      }
    }

    // Exactly 4 distinct item textures matching the round's cards.
    const itemsByTexture = getItemImagesByTexture(scene);
    const cardTextures = new Set(round.cards.map((card) => card.texture));
    expect(itemsByTexture.size).toBe(4);
    for (const texture of cardTextures) {
      expect(itemsByTexture.get(texture)).toHaveLength(1);
    }

    expect(getProgressDots(scene)).toHaveLength(6);
  });

  it("speaks the target color name at round start when SFX is enabled", () => {
    const scene = new ColorMatchScene();
    scene.create();

    const round = getCurrentRound(scene);
    expect(mockSpeech.speakWord).toHaveBeenCalledWith(promptFor(round.targetColorId), true);
  });

  it("silences TTS when the SFX toggle is off", () => {
    updateSettings({ sfxEnabled: false });

    const scene = new ColorMatchScene();
    scene.create();

    const round = getCurrentRound(scene);
    expect(mockSpeech.speakWord).toHaveBeenCalledWith(promptFor(round.targetColorId), false);
  });

  it("tapping the matching card plays the correct chime, flashes success, and advances", () => {
    const scene = new ColorMatchScene();
    scene.create();
    const round = getCurrentRound(scene);
    const targetSlot = round.cards.findIndex((card) => card.colorId === round.targetColorId);
    const dots = getProgressDots(scene);
    const cards = getCardRects(scene);

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
    expect((scene as unknown as { roundIndex: number }).roundIndex).toBe(1);

    // The new round re-renders, speaks its own target color, and draws a
    // swatch in the new target color.
    const secondRound = getCurrentRound(scene);
    expect(mockSpeech.speakWord).toHaveBeenCalledWith(promptFor(secondRound.targetColorId), true);
    const secondTarget = secondRound.cards.find(
      (card) => card.colorId === secondRound.targetColorId,
    );
    if (secondTarget) {
      expect(getMockFn(getSwatchGraphics(scene).fillStyle)).toHaveBeenCalledWith(
        parseInt(secondTarget.fill.slice(1), 16),
        1,
      );
    }

    // The previous round's cards are destroyed on re-render — no stale
    // rectangles accumulate across rounds.
    expect(getMockFn(cards[0].destroy)).toHaveBeenCalled();
    const newCards = getCardRects(scene);
    expect(newCards).toHaveLength(4);
  });

  it("tapping a non-matching card wiggles gently and does not advance the round", () => {
    const scene = new ColorMatchScene();
    scene.create();
    const round = getCurrentRound(scene);
    const targetSlot = round.cards.findIndex((card) => card.colorId === round.targetColorId);
    const wrongIndex = targetSlot === 0 ? 1 : 0;
    const rect = getCardRects(scene)[wrongIndex];
    const wrongItem = getItemImagesByTexture(scene).get(round.cards[wrongIndex].texture)?.[0];

    tapCard(scene, wrongIndex);

    expect(mockAudio.playIncorrect).toHaveBeenCalledTimes(1);
    expect(mockAudio.playCorrect).not.toHaveBeenCalled();
    expect(getMockFn(rect.setFillStyle)).not.toHaveBeenCalledWith(0x68d391, 1);
    expect((scene as unknown as { roundIndex: number }).roundIndex).toBe(0);

    // Professor Hoot nods along with the soft incorrect tone.
    const mascot = getMascotImage(scene);
    const nodTween = getMockFn(scene.tweens.add).mock.calls.find(
      (call) => call[0]?.targets === mascot && call[0]?.angle?.to === 6,
    );
    expect(nodTween).toBeDefined();

    // The card and its item wiggle together.
    const wiggleTween = getMockFn(scene.tweens.add).mock.calls.find((call) => {
      const targets = call[0]?.targets;
      if (!Array.isArray(targets)) return false;
      return targets.includes(rect) && wrongItem !== undefined && targets.includes(wrongItem);
    });
    expect(wiggleTween).toBeDefined();
    if (!wiggleTween) return;
    expect((wiggleTween[0] as { angle: number }).angle).toBe(4);
    expect((wiggleTween[0] as { yoyo: boolean }).yoyo).toBe(true);
  });

  it("does nothing when the speaker is tapped after the final round (celebration guard)", () => {
    const scene = new ColorMatchScene();
    scene.create();
    mockSpeech.speakWord.mockClear();

    // Force the speaker's onSpeak past the final round, then tap it.
    (scene as unknown as { roundIndex: number }).roundIndex = 99;
    const speakerBtn = (scene as unknown as { speaker: { button: Record<string, MockFn> } }).speaker
      .button;
    const pointerdownCall = getMockFn(speakerBtn.on).mock.calls.find((c) => c[0] === "pointerdown");
    expect(pointerdownCall).toBeDefined();
    if (pointerdownCall && typeof pointerdownCall[1] === "function") {
      (pointerdownCall[1] as () => void)();
    }

    expect(mockSpeech.speakWord).not.toHaveBeenCalled();
  });

  it("re-speaks the current target color when the speaker is tapped mid-round", () => {
    const scene = new ColorMatchScene();
    scene.create();
    mockSpeech.speakWord.mockClear();

    const speakerBtn = (scene as unknown as { speaker: { button: Record<string, MockFn> } }).speaker
      .button;
    const pointerdownCall = getMockFn(speakerBtn.on).mock.calls.find((c) => c[0] === "pointerdown");
    expect(pointerdownCall).toBeDefined();
    if (pointerdownCall && typeof pointerdownCall[1] === "function") {
      (pointerdownCall[1] as () => void)();
    }

    const round = getCurrentRound(scene);
    expect(mockSpeech.speakWord).toHaveBeenCalledWith(promptFor(round.targetColorId), true);
  });

  it("skips the flash revert when the card is destroyed before the 250ms timer", () => {
    const scene = new ColorMatchScene();
    scene.create();
    const round = getCurrentRound(scene);
    const targetSlot = round.cards.findIndex((card) => card.colorId === round.targetColorId);
    const cards = getCardRects(scene);

    tapCard(scene, targetSlot);

    // Destroy the card before the 250ms revert fires.
    const rect = cards[targetSlot];
    (rect as unknown as { isDestroyed: boolean }).isDestroyed = true;
    const delayedCallMock = getMockFn(
      (scene as unknown as { time: Record<string, unknown> }).time.delayedCall,
    );
    const revertCall = delayedCallMock.mock.calls.find((call) => call[0] === 250);
    expect(revertCall).toBeDefined();
    if (revertCall && typeof revertCall[1] === "function") {
      (revertCall[1] as () => void)();
    }
    // setFillStyle ran once (flash); the revert never re-applied the bg.
    expect(getMockFn(rect.setFillStyle)).toHaveBeenCalledTimes(1);
  });

  it("wins after 6 correct rounds: celebration, first-time sticker, justEarned, auto-return", () => {
    const scene = new ColorMatchScene();
    scene.create();

    for (let i = 0; i < 6; i++) {
      completeRound(scene);
    }

    expect(mockAudio.playWin).toHaveBeenCalledTimes(1);
    expect((scene as unknown as { inputLocked: boolean }).inputLocked).toBe(true);

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
      (scene as unknown as { add: Record<string, unknown> }).add.image,
    ).mock.calls.find((call) => call[2] === "sticker_color_match");
    expect(stickerImage).toBeDefined();

    fireAutoReturn(scene);
    expect(
      (scene as unknown as { scene: Record<string, MockFn> }).scene.start,
    ).toHaveBeenCalledWith("Hub", {
      justEarned: "color-match",
    });
  });

  it("does not award the sticker again or pass justEarned on repeat completions", () => {
    earnSticker("color-match");
    const scene = new ColorMatchScene();
    scene.create();

    for (let i = 0; i < 6; i++) {
      completeRound(scene);
    }

    expect(mockAudio.playSticker).not.toHaveBeenCalled();
    fireAutoReturn(scene);
    expect(
      (scene as unknown as { scene: Record<string, MockFn> }).scene.start,
    ).toHaveBeenCalledWith("Hub");
  });

  it("re-launching after completion unlocks input so cards are tappable again", () => {
    const scene = new ColorMatchScene();
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
    const targetSlot = round.cards.findIndex((card) => card.colorId === round.targetColorId);
    const correctCallsBefore = mockAudio.playCorrect.mock.calls.length;
    tapCard(scene, targetSlot);
    expect(mockAudio.playCorrect.mock.calls.length).toBe(correctCallsBefore + 1);
  });

  it("parental lock hold success exits to the Hub", () => {
    const scene = new ColorMatchScene();
    scene.create();

    expect(mockParentLockInstances).toHaveLength(1);
    const parentLock = mockParentLockInstances[0];
    const onSuccess = parentLock.onSuccess as () => void;
    expect(onSuccess).toBeDefined();

    // The hold success starts the Hub transition synchronously (fade-out).
    onSuccess();
    const fadeOutMock = getMockFn(
      (scene as unknown as { cameras: { main: Record<string, MockFn> } }).cameras.main.fadeOut,
    );
    const fadeOutCall = fadeOutMock.mock.calls.at(-1);
    expect(fadeOutCall).toBeDefined();
    if (fadeOutCall && typeof fadeOutCall[4] === "function") {
      (fadeOutCall[4] as () => void)();
    }
    expect(
      (scene as unknown as { scene: Record<string, MockFn> }).scene.start,
    ).toHaveBeenCalledWith("Hub");
  });

  it("uses smaller wiggle amplitude and shorter durations under reduced motion", () => {
    setReducedMotion(true);
    const scene = new ColorMatchScene();
    scene.create();
    const round = getCurrentRound(scene);
    const targetSlot = round.cards.findIndex((card) => card.colorId === round.targetColorId);
    const wrongIndex = targetSlot === 0 ? 1 : 0;
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

  it("generates a valid playthrough for the scene (6 rounds, 4 distinct colors, target present)", () => {
    const scene = new ColorMatchScene();
    scene.create();
    const rounds = (scene as unknown as { rounds: ColorMatchRound[] }).rounds;

    expect(rounds).toHaveLength(6);
    for (const round of rounds) {
      expect(round.cards).toHaveLength(4);
      expect(new Set(round.cards.map((card) => card.colorId)).size).toBe(4);
      expect(round.cards.map((card) => card.colorId)).toContain(round.targetColorId);
    }
  });
});

/* --- Press feedback cohesion (Track: UI/UX Cohesion, Phase 2) --- */

describe("ColorMatchScene press feedback cohesion", () => {
  /** Stubs matchMedia to control the prefers-reduced-motion result. */
  function stubMotion(reduced: boolean): void {
    stubMatchMedia(reduced);
  }

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("gives every color card press feedback restoring on release, out, and cancel", () => {
    stubMotion(false);
    const scene = new ColorMatchScene();
    scene.create();

    const controls = getInteractiveRects(scene);
    expect(controls.length).toBeGreaterThan(0);
    for (const control of controls) {
      expectPressFeedbackContract(control);
    }
  });

  it("keeps the gameplay choice handler registered before the press squish", () => {
    stubMotion(false);
    const scene = new ColorMatchScene();
    scene.create();

    const [first] = getInteractiveRects(scene);
    fireFirstHandler(first, "pointerdown");
    expect(first.setScale).not.toHaveBeenCalledWith(0.95);
  });

  it("attaches exactly one extra pointerdown listener per card when motion is allowed", () => {
    stubMotion(true);
    const reducedScene = new ColorMatchScene();
    reducedScene.create();
    const reducedCounts = getInteractiveRects(reducedScene).map((control) =>
      countListeners(control, "pointerdown"),
    );

    stubMotion(false);
    const scene = new ColorMatchScene();
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

describe("ColorMatchScene adaptive shift", () => {
  beforeEach(() => {
    getAdaptiveBandShiftMock.mockClear();
    buildPlaythroughMock.mockClear();
    getAdaptiveBandShiftMock.mockReturnValue(0);
  });

  it("passes the facade's band shift to buildPlaythrough", () => {
    getAdaptiveBandShiftMock.mockReturnValue(1);
    const scene = new ColorMatchScene();
    scene.create();
    expect(getAdaptiveBandShiftMock).toHaveBeenCalledWith("color-match");
    expect(buildPlaythroughMock).toHaveBeenCalledWith(1, expect.any(Function));
  });

  it("requests the classic ladder when the facade returns 0", () => {
    const scene = new ColorMatchScene();
    scene.create();
    expect(buildPlaythroughMock).toHaveBeenCalledWith(0, expect.any(Function));
  });
});
