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

/** Mock the TTS wrapper so tests can verify letter speech without real voices. */
const { mockSpeech } = vi.hoisted(() => ({
  mockSpeech: {
    speakLetter: vi.fn(() => true),
    isSpeechSupported: vi.fn(() => true),
    onSpeechLifecycle: vi.fn(() => vi.fn()),
  },
}));

vi.mock("../../utils/speech", () => mockSpeech);

const { getAdaptiveBandShiftMock, generatePlaythroughMock } = vi.hoisted(() => ({
  getAdaptiveBandShiftMock: vi.fn((_gameId: string): -1 | 0 | 1 => 0),
  generatePlaythroughMock: vi.fn(),
}));

vi.mock("../../utils/storage", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  getAdaptiveBandShift: (gameId: string) => getAdaptiveBandShiftMock(gameId),
}));

vi.mock("../../game/alphabetLogic", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../game/alphabetLogic")>();
  return {
    ...actual,
    generatePlaythrough: (...args: Parameters<typeof actual.generatePlaythrough>) => {
      generatePlaythroughMock(...args);
      return actual.generatePlaythrough(...args);
    },
  };
});

import { generatePlaythrough } from "../../game/alphabetLogic";
import { AlphabetScene } from "../../scenes/AlphabetScene";
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

describe("AlphabetScene round flow", () => {
  let matchMediaMock: MatchMediaStub;

  beforeEach(() => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    matchMediaMock = stubMatchMedia(false);
    localStorage.clear();
    mockParentLockInstances.length = 0;
    mockSpeech.speakLetter.mockClear();
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
  function getCurrentRound(scene: unknown): { target: string; choices: string[] } {
    const s = scene as { rounds: Array<{ target: string; choices: string[] }>; roundIndex: number };
    return s.rounds[s.roundIndex];
  }

  /** Returns the big target-letter image object. */
  function getTargetLetter(scene: unknown): Record<string, MockFn> {
    const s = scene as { add: Record<string, unknown> };
    const imageMock = getMockFn(s.add.image);
    const targetY =
      (scene as { cameras: { main: { centerY: number } } }).cameras.main.centerY - 140;
    const index = imageMock.mock.calls.findIndex(
      (call) => call[1] === targetY && isLetterKey(call[2]),
    );
    return imageMock.mock.results[index].value as Record<string, MockFn>;
  }

  /** Returns true when the given texture key is a preloaded letter SVG (e.g. "letter_a"). */
  function isLetterKey(key: unknown): key is string {
    return typeof key === "string" && /^letter_[a-z]$/.test(key);
  }

  /** Returns the 4 answer card rectangles (created at the cards row y). */
  function getCardRects(scene: unknown): Array<Record<string, MockFn>> {
    const s = scene as { add: Record<string, unknown> };
    const rectangleMock = getMockFn(s.add.rectangle);
    const cardsY = (scene as { cameras: { main: { centerY: number } } }).cameras.main.centerY + 180;
    const cards: Array<Record<string, MockFn>> = [];
    for (let i = 0; i < rectangleMock.mock.calls.length; i++) {
      if (rectangleMock.mock.calls[i][1] === cardsY) {
        cards.push(rectangleMock.mock.results[i].value as Record<string, MockFn>);
      }
    }
    return cards;
  }

  /** Returns the 4 answer card letter images (created at the cards row y). */
  function getCardLetters(scene: unknown): Array<Record<string, MockFn>> {
    const s = scene as { add: Record<string, unknown> };
    const imageMock = getMockFn(s.add.image);
    const cardsY = (scene as { cameras: { main: { centerY: number } } }).cameras.main.centerY + 180;
    const letters: Array<Record<string, MockFn>> = [];
    for (let i = 0; i < imageMock.mock.calls.length; i++) {
      if (imageMock.mock.calls[i][1] === cardsY && isLetterKey(imageMock.mock.calls[i][2])) {
        letters.push(imageMock.mock.results[i].value as Record<string, MockFn>);
      }
    }
    return letters;
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
    tapCard(scene, round.choices.indexOf(round.target));
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

  /** Fires `event` on every loader handler the scene registered (`on` and `once`). */
  function fireLoaderEvent(scene: unknown, event: string, ...args: unknown[]): void {
    const load = (scene as { load: Record<string, MockFn> }).load;
    for (const registration of [load.on, load.once]) {
      for (const call of registration.mock.calls) {
        if (call[0] === event) {
          (call[1] as (...handlerArgs: unknown[]) => void)(...args);
        }
      }
    }
  }

  it("renders a big target letter, 6 progress dots, and 4 interactive cards", () => {
    const scene = new AlphabetScene();
    scene.create();

    const round = getCurrentRound(scene);
    expect(getTargetLetter(scene)).toBeDefined();
    const imageMock = getMockFn((scene as unknown as { add: Record<string, unknown> }).add.image);
    const targetCall = imageMock.mock.calls.find(
      (call) => isLetterKey(call[2]) && call[1] === scene.cameras.main.centerY - 140,
    );
    expect(targetCall?.[2]).toBe(`letter_${round.target.toLowerCase()}`);

    const cards = getCardRects(scene);
    expect(cards).toHaveLength(4);
    expect(getMockFn(cards[0].setInteractive)).toHaveBeenCalled();
    expect(getMockFn(cards[0].setStrokeStyle)).toHaveBeenCalled();

    // Cards meet the 96×96 ideal touch target (160px side).
    const rectCalls = getMockFn(
      (scene as unknown as { add: Record<string, unknown> }).add.rectangle,
    ).mock.calls;
    const cardsY = scene.cameras.main.centerY + 180;
    for (const call of rectCalls) {
      if (call[1] === cardsY) {
        expect(call[2]).toBeGreaterThanOrEqual(96);
        expect(call[3]).toBeGreaterThanOrEqual(96);
      }
    }
    expect(getCardLetters(scene)).toHaveLength(4);

    // The 4 cards show exactly the round's choices (via letter_* SVG textures).
    const cardLetterKeys = imageMock.mock.calls
      .filter((call) => isLetterKey(call[2]) && call[1] === cardsY)
      .map((call) => (call[2] as string).replace("letter_", "").toUpperCase());
    expect(cardLetterKeys.sort()).toEqual([...round.choices].sort());

    expect(getProgressDots(scene)).toHaveLength(6);
  });

  it("speaks the target letter at round start when SFX is enabled", () => {
    const scene = new AlphabetScene();
    scene.create();

    const round = getCurrentRound(scene);
    expect(mockSpeech.speakLetter).toHaveBeenCalledWith(round.target, true);
  });

  it("silences TTS when the SFX toggle is off", () => {
    updateSettings({ sfxEnabled: false });

    const scene = new AlphabetScene();
    scene.create();

    const round = getCurrentRound(scene);
    expect(mockSpeech.speakLetter).toHaveBeenCalledWith(round.target, false);
  });

  it("tapping the correct card plays the correct chime, pops the dot, and advances", () => {
    const scene = new AlphabetScene();
    scene.create();
    const round = getCurrentRound(scene);
    const dots = getProgressDots(scene);

    tapCard(scene, round.choices.indexOf(round.target));

    expect(mockAudio.playCorrect).toHaveBeenCalledTimes(1);
    expect(mockAudio.playIncorrect).not.toHaveBeenCalled();

    // Professor Hoot cheers with the celebrate pose on a correct answer.
    const mascot = getMascotImage(scene);
    expect(getMockFn(mascot.setTexture)).toHaveBeenCalledWith("mascot_celebrate");

    // The first progress dot fills.
    expect(getMockFn(dots[0].setAlpha)).toHaveBeenCalledWith(1);
    expect(getMockFn(dots[1].setAlpha)).not.toHaveBeenCalledWith(1);

    fireNextRoundDelay(scene);
    expect((scene as unknown as { roundIndex: number }).roundIndex).toBe(1);

    // The new round re-renders (4 new card letters on top of the old 4) and
    // speaks its own target letter.
    const secondRound = getCurrentRound(scene);
    expect(mockSpeech.speakLetter).toHaveBeenCalledWith(secondRound.target, true);
    expect(getCardLetters(scene)).toHaveLength(8);

    // The previous round's target letter is destroyed on re-render — no stale
    // target objects accumulate across rounds.
    const imageMock = getMockFn((scene as unknown as { add: Record<string, unknown> }).add.image);
    const targetResults = imageMock.mock.results.filter(
      (_, i) =>
        isLetterKey(imageMock.mock.calls[i]?.[2]) &&
        imageMock.mock.calls[i]?.[1] === scene.cameras.main.centerY - 140,
    );
    expect(
      getMockFn((targetResults[0].value as Record<string, MockFn>).destroy),
    ).toHaveBeenCalled();
    expect(
      getMockFn((targetResults[1].value as Record<string, MockFn>).destroy),
    ).not.toHaveBeenCalled();
  });

  it("draws one placeholder for a failed letter load and still plays a round", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const scene = new AlphabetScene();

    // The scene declares `letters` in preload; a cold TextureManager means
    // every key is queued.
    scene.preload();
    expect(getMockFn(scene.load.svg)).toHaveBeenCalledTimes(26);

    // The real failure path: one declared SVG errors, then the loader completes.
    fireLoaderEvent(scene, "loaderror", { key: "letter_a" });
    fireLoaderEvent(scene, "complete");

    const warnings = warnSpy.mock.calls.filter((call) => String(call[0]).includes('"letter_a"'));
    expect(warnings).toHaveLength(1);
    expect(scene.textures.exists("letter_a")).toBe(true);
    expect(getMockFn(scene.textures.createCanvas)).toHaveBeenCalledWith("letter_a", 256, 256);

    // The placeholder stands in for the missing art: the round still builds,
    // answers, and advances.
    scene.create();
    completeRound(scene);
    expect((scene as unknown as { roundIndex: number }).roundIndex).toBe(1);

    scene.events.emit("shutdown");
  });

  it("tapping a wrong card wiggles gently and does not advance the round", () => {
    const scene = new AlphabetScene();
    scene.create();
    const round = getCurrentRound(scene);
    const correctIndex = round.choices.indexOf(round.target);
    const wrongIndex = (correctIndex + 1) % 4;
    const rect = getCardRects(scene)[wrongIndex];
    const letter = getCardLetters(scene)[wrongIndex];

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
      return targets.includes(rect) && targets.includes(letter);
    });
    expect(wiggleTween).toBeDefined();
    if (!wiggleTween) return;
    expect((wiggleTween[0] as { angle: number }).angle).toBe(4);
    expect((wiggleTween[0] as { yoyo: boolean }).yoyo).toBe(true);
  });

  it("wins after 6 correct rounds: celebration, first-time sticker, justEarned, auto-return", () => {
    const scene = new AlphabetScene();
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
    ).mock.calls.find((call) => call[2] === "sticker_alphabet_match");
    expect(stickerImage).toBeDefined();

    fireAutoReturn(scene);
    expect(
      (scene as unknown as { scene: Record<string, MockFn> }).scene.start,
    ).toHaveBeenCalledWith("Hub", {
      justEarned: "alphabet-match",
    });
  });

  /** Returns the speaker button image created with the icon_speaker texture. */
  function getSpeakerImage(scene: unknown): Record<string, MockFn> {
    const imageMock = getMockFn((scene as { add: Record<string, unknown> }).add.image);
    const index = imageMock.mock.calls.findIndex((call) => call[2] === "icon_speaker");
    return imageMock.mock.results[index].value as Record<string, MockFn>;
  }

  it("guards the speaker during the win celebration (no crash after the final round)", () => {
    const scene = new AlphabetScene();
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

  it("shows a splash burst at the tapped card on a correct answer", () => {
    const scene = new AlphabetScene();
    scene.create();

    const round = getCurrentRound(scene);
    const correctIndex = round.choices.indexOf(round.target);
    tapCard(scene, correctIndex);

    // The correct-answer splash is the first graphics drawn after the tap
    // (the mascot cheer may add its own sparkle graphics afterwards).
    const graphicsMock = getMockFn(
      (scene as unknown as { add: Record<string, unknown> }).add.graphics,
    );
    expect(graphicsMock.mock.results.length).toBeGreaterThan(0);
    const graphics = graphicsMock.mock.results[0].value as Record<string, MockFn>;
    expect(getMockFn(graphics.lineStyle)).toHaveBeenCalled();
    expect(getMockFn(graphics.fillCircle)).toHaveBeenCalled();
  });

  it("does not award the sticker again or pass justEarned on repeat completions", () => {
    earnSticker("alphabet-match");
    const scene = new AlphabetScene();
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
    const scene = new AlphabetScene();
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
    const correctIndex = round.choices.indexOf(round.target);
    const correctCallsBefore = mockAudio.playCorrect.mock.calls.length;
    tapCard(scene, correctIndex);
    expect(mockAudio.playCorrect.mock.calls.length).toBe(correctCallsBefore + 1);
  });

  it("parental lock hold success exits to the Hub", () => {
    const scene = new AlphabetScene();
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
    const scene = new AlphabetScene();
    scene.create();
    const round = getCurrentRound(scene);
    const correctIndex = round.choices.indexOf(round.target);
    const wrongIndex = (correctIndex + 1) % 4;
    const rect = getCardRects(scene)[wrongIndex];
    const letter = getCardLetters(scene)[wrongIndex];

    tapCard(scene, wrongIndex);

    const wiggleTween = getMockFn(scene.tweens.add).mock.calls.find((call) => {
      const targets = call[0]?.targets;
      if (!Array.isArray(targets)) return false;
      return targets.includes(rect) && targets.includes(letter);
    });
    expect(wiggleTween).toBeDefined();
    if (!wiggleTween) return;
    expect((wiggleTween[0] as { angle: number }).angle).toBe(2);
    expect((wiggleTween[0] as { duration: number }).duration).toBe(200);
  });

  it("generates a valid playthrough for the scene (6 unique targets, 4 choices each)", () => {
    const playthrough = generatePlaythrough();
    expect(playthrough).toHaveLength(6);
    expect(new Set(playthrough.map((r) => r.target)).size).toBe(6);
    for (const round of playthrough) {
      expect(round.choices).toHaveLength(4);
      expect(new Set(round.choices).size).toBe(4);
      expect(round.choices).toContain(round.target);
    }
  });
});

/* --- Press feedback cohesion (Track: UI/UX Cohesion, Phase 2) --- */

describe("AlphabetScene press feedback cohesion", () => {
  /** Stubs matchMedia to control the prefers-reduced-motion result. */
  function stubMotion(reduced: boolean): void {
    stubMatchMedia(reduced);
  }

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("gives every choice card press feedback restoring on release, out, and cancel", () => {
    stubMotion(false);
    const scene = new AlphabetScene();
    scene.create();

    const controls = getInteractiveRects(scene);
    expect(controls.length).toBeGreaterThan(0);
    for (const control of controls) {
      expectPressFeedbackContract(control);
    }
  });

  it("keeps the gameplay choice handler registered before the press squish", () => {
    stubMotion(false);
    const scene = new AlphabetScene();
    scene.create();

    const [first] = getInteractiveRects(scene);
    fireFirstHandler(first, "pointerdown");
    expect(first.setScale).not.toHaveBeenCalledWith(0.95);
  });

  it("attaches exactly one extra pointerdown listener per card when motion is allowed", () => {
    stubMotion(true);
    const reducedScene = new AlphabetScene();
    reducedScene.create();
    const reducedCounts = getInteractiveRects(reducedScene).map((control) =>
      countListeners(control, "pointerdown"),
    );

    stubMotion(false);
    const scene = new AlphabetScene();
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
    stubMatchMedia(false);
    localStorage.clear();
    mockParentLockInstances.length = 0;
    getAdaptiveBandShiftMock.mockClear();
    generatePlaythroughMock.mockClear();
    getAdaptiveBandShiftMock.mockReturnValue(0);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("passes the facade's band shift to generatePlaythrough", () => {
    getAdaptiveBandShiftMock.mockReturnValue(1);
    const scene = new AlphabetScene();
    scene.create();
    expect(getAdaptiveBandShiftMock).toHaveBeenCalledWith("alphabet-match");
    expect(generatePlaythroughMock).toHaveBeenCalledWith(6, 1, expect.any(Function));
  });

  it("requests the classic ladder when the facade returns 0", () => {
    const scene = new AlphabetScene();
    scene.create();
    expect(generatePlaythroughMock).toHaveBeenCalledWith(6, 0, expect.any(Function));
  });
});
