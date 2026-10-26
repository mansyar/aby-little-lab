import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type MatchMediaStub, stubMatchMedia } from "../helpers/matchMediaStub";

type MockFn = ReturnType<typeof vi.fn>;

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
  AudioManager: {
    getInstance: () => mockAudio,
  },
}));

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

const { mockSpeech } = vi.hoisted(() => ({
  mockSpeech: {
    speakWord: vi.fn(() => true),
    isSpeechSupported: vi.fn(() => true),
    onSpeechLifecycle: vi.fn(() => vi.fn()),
  },
}));

vi.mock("../../utils/speech", () => mockSpeech);

const { getAdaptiveBandShiftMock, buildPlaythroughMock } = vi.hoisted(() => ({
  getAdaptiveBandShiftMock: vi.fn((_gameId: string): -1 | 0 | 1 => 0),
  buildPlaythroughMock: vi.fn(),
}));

vi.mock("../../utils/storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../utils/storage")>();
  return {
    ...actual,
    getAdaptiveBandShift: (gameId: string) => getAdaptiveBandShiftMock(gameId),
  };
});

vi.mock("../../game/decodeLogic", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../game/decodeLogic")>();
  return {
    ...actual,
    // Forward every argument: the scene calls buildPlaythrough(roundCount, shift, rng),
    // and dropping rng here would silently strip the seeded path.
    buildPlaythrough: (
      roundCount: number,
      shift: -1 | 0 | 1 = 0,
      rng?: Parameters<typeof actual.buildPlaythrough>[2],
    ) => {
      buildPlaythroughMock(roundCount, shift);
      return actual.buildPlaythrough(roundCount, shift, rng);
    },
  };
});

import * as decodeLogic from "../../game/decodeLogic";
import { getDecodeWord } from "../../game/decodeLogic";
import { DecodeItScene } from "../../scenes/DecodeItScene";
import { earnSticker, updateSettings } from "../../utils/storage";
import {
  countListeners,
  expectPressFeedbackContract,
  fireFirstHandler,
  getInteractiveRects,
} from "../helpers/pressFeedback";
import { mulberry32 } from "../helpers/randomHelper";

function getMockFn(fn: unknown): MockFn {
  return fn as unknown as MockFn;
}

function getCurrentRound(scene: unknown): { target: string; choices: string[] } {
  const s = scene as { rounds: Array<{ target: string; choices: string[] }>; roundIndex: number };
  return s.rounds[s.roundIndex];
}

const CARD_ROW_YS = [384 + 110, 384 + 270];

function getCardRects(scene: unknown): Array<Record<string, MockFn>> {
  const s = scene as { add: Record<string, unknown> };
  const rectangleMock = getMockFn(s.add.rectangle);
  const cards: Array<Record<string, MockFn>> = [];
  for (let i = 0; i < rectangleMock.mock.calls.length; i++) {
    if (CARD_ROW_YS.includes(rectangleMock.mock.calls[i][1] as number)) {
      cards.push(rectangleMock.mock.results[i].value as Record<string, MockFn>);
    }
  }
  return cards;
}

function getCardLetters(scene: unknown, cardIndex: number): Array<Record<string, MockFn>> {
  const s = scene as { add: Record<string, unknown> };
  const imageMock = getMockFn(s.add.image);
  const centerX = (scene as { cameras: { main: { centerX: number } } }).cameras.main.centerX;
  const letters: Array<Record<string, MockFn>> = [];
  for (let i = 0; i < imageMock.mock.calls.length; i++) {
    const [x, y, key] = imageMock.mock.calls[i] as [number, number, string];
    if (typeof key !== "string" || !key.startsWith("letter_")) continue;
    const row = y === CARD_ROW_YS[0] ? 0 : 1;
    const col = x < centerX ? 0 : 1;
    if (row * 2 + col === cardIndex) {
      letters.push(imageMock.mock.results[i].value as Record<string, MockFn>);
    }
  }
  return letters;
}

function getMascotImage(scene: unknown): Record<string, MockFn> {
  const s = scene as { add: Record<string, unknown> };
  const imageMock = getMockFn(s.add.image);
  const index = imageMock.mock.calls.findIndex((call) => call[2] === "mascot_idle");
  return imageMock.mock.results[index].value as Record<string, MockFn>;
}

function getPromptImage(scene: unknown): Record<string, MockFn> | undefined {
  const s = scene as { add: Record<string, unknown> };
  const imageMock = getMockFn(s.add.image);
  const round = getCurrentRound(scene);
  const promptTexture = getDecodeWord(round.target)?.promptTexture;
  const index = imageMock.mock.calls.findIndex((call) => call[2] === promptTexture);
  if (index === -1) return undefined;
  return imageMock.mock.results[index].value as Record<string, MockFn>;
}

function getProgressDots(scene: unknown): Array<Record<string, MockFn>> {
  const s = scene as { add: Record<string, unknown> };
  const circleMock = getMockFn(s.add.circle);
  return circleMock.mock.results.map((r) => r.value as Record<string, MockFn>);
}

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

function fireNextRoundDelay(scene: unknown): void {
  const delayedCallMock = getMockFn((scene as { time: Record<string, unknown> }).time.delayedCall);
  const nextRoundCall = delayedCallMock.mock.calls.find((call) => call[0] === 700);
  expect(nextRoundCall).toBeDefined();
  if (nextRoundCall && typeof nextRoundCall[1] === "function") {
    (nextRoundCall[1] as () => void)();
  }
}

function completeRound(scene: unknown): void {
  const round = getCurrentRound(scene);
  tapCard(scene, round.choices.indexOf(round.target));
  fireNextRoundDelay(scene);
}

function fireAutoReturn(scene: unknown): void {
  const delayedCallMock = getMockFn((scene as { time: Record<string, unknown> }).time.delayedCall);
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

describe("DecodeItScene shell", () => {
  beforeEach(() => {
    stubMatchMedia(false);
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

  it("renders mascot, parent-locked Back button, and 6 progress dots", () => {
    const scene = new DecodeItScene(mulberry32(1234));
    scene.create();

    const imageMock = getMockFn((scene as unknown as { add: Record<string, unknown> }).add.image);
    const mascotCall = imageMock.mock.calls.find((call) => call[2] === "mascot_idle");
    expect(mascotCall).toBeDefined();

    const textMock = getMockFn((scene as unknown as { add: Record<string, unknown> }).add.text);
    const backCall = textMock.mock.calls.find((call) => call[2] === "← Back");
    expect(backCall).toBeDefined();
    if (!backCall) throw new Error("back button text not found");
    const backIndex = textMock.mock.calls.indexOf(backCall);
    expect(getMockFn(textMock.mock.results[backIndex].value.setInteractive)).toHaveBeenCalled();

    expect(mockParentLockInstances).toHaveLength(1);
    expect((mockParentLockInstances[0] as { onSuccess: unknown }).onSuccess).toBeDefined();

    const circleMock = getMockFn((scene as unknown as { add: Record<string, unknown> }).add.circle);
    expect(circleMock.mock.calls).toHaveLength(6);

    expect((scene as unknown as { rounds: unknown[] }).rounds).toHaveLength(6);
    expect((scene as unknown as { inputLocked: boolean }).inputLocked).toBe(false);
  });

  it("parental lock hold success exits to the Hub", () => {
    const scene = new DecodeItScene(mulberry32(1234));
    scene.create();

    expect(mockParentLockInstances).toHaveLength(1);
    const parentLock = mockParentLockInstances[0];
    const onSuccess = parentLock.onSuccess as () => void;
    expect(onSuccess).toBeDefined();

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
});

describe("DecodeItScene round rendering", () => {
  beforeEach(() => {
    stubMatchMedia(false);
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

  it("renders the prompt picture from the round's texture key at ~180px", () => {
    const scene = new DecodeItScene(mulberry32(1234));
    scene.create();

    const prompt = getPromptImage(scene);
    expect(prompt).toBeDefined();
    expect(getMockFn(prompt?.setDisplaySize)).toHaveBeenCalledWith(180, 180);
  });

  it("renders 4 word cards in a 2\u00d72 grid, composed of letter textures", () => {
    const scene = new DecodeItScene(mulberry32(1234));
    scene.create();
    const round = getCurrentRound(scene);

    const cards = getCardRects(scene);
    expect(cards).toHaveLength(4);
    expect(getMockFn(cards[0].setInteractive)).toHaveBeenCalled();
    expect(getMockFn(cards[0].setStrokeStyle)).toHaveBeenCalled();

    const rectCalls = getMockFn(
      (scene as unknown as { add: Record<string, unknown> }).add.rectangle,
    ).mock.calls;
    const cardCalls = rectCalls.filter((call) => CARD_ROW_YS.includes(call[1] as number));
    expect(cardCalls).toHaveLength(4);
    for (const call of cardCalls) {
      expect(call[3]).toBeGreaterThanOrEqual(96);
      expect(call[4]).toBeGreaterThanOrEqual(96);
    }

    for (let i = 0; i < round.choices.length; i++) {
      const letters = getCardLetters(scene, i);
      const word = round.choices[i];
      expect(letters).toHaveLength(word.length);
      for (let j = 0; j < word.length; j++) {
        expect(getMockFn(letters[j].setDisplaySize)).toHaveBeenCalledWith(80, 80);
      }
      const keys = (
        getMockFn((scene as unknown as { add: Record<string, unknown> }).add.image).mock
          .calls as Array<[number, number, string]>
      ).filter((call) => typeof call[2] === "string" && call[2].startsWith("letter_"));
      const cardLetterKeys = keys.filter((call) => {
        const [x, y] = call as unknown as [number, number];
        const row = y === CARD_ROW_YS[0] ? 0 : 1;
        const col = x < scene.cameras.main.centerX ? 0 : 1;
        return row * 2 + col === i;
      });
      expect(cardLetterKeys.map((call) => call[2])).toEqual(
        word.split("").map((letter) => `letter_${letter.toLowerCase()}`),
      );
    }
  });

  it("speaks the target word at round start when SFX is enabled", () => {
    const scene = new DecodeItScene(mulberry32(1234));
    scene.create();

    const round = getCurrentRound(scene);
    expect(mockSpeech.speakWord).toHaveBeenCalledWith(round.target, true);
  });

  it("silences TTS when the SFX toggle is off", () => {
    updateSettings({ sfxEnabled: false });

    const scene = new DecodeItScene(mulberry32(1234));
    scene.create();

    const round = getCurrentRound(scene);
    expect(mockSpeech.speakWord).toHaveBeenCalledWith(round.target, false);
  });

  it("keeps a visible gap between two 4-letter cards sharing a row", () => {
    vi.spyOn(decodeLogic, "buildPlaythrough").mockReturnValue([
      { target: "BALL", choices: ["BALL", "FROG", "CAT", "DOG"], promptTexture: "sm_ball" },
      { target: "CAT", choices: ["CAT", "FROG", "BALL", "TREE"], promptTexture: "animal_cat" },
      { target: "DOG", choices: ["DOG", "FISH", "BOAT", "PIG"], promptTexture: "animal_dog" },
      { target: "PIG", choices: ["PIG", "TREE", "BALL", "CAR"], promptTexture: "animal_pig" },
      { target: "CAR", choices: ["CAR", "FROG", "DOG", "BOAT"], promptTexture: "sm_car" },
      { target: "FROG", choices: ["FROG", "CAT", "PIG", "BALL"], promptTexture: "frog_red" },
    ]);

    const scene = new DecodeItScene(mulberry32(1234));
    scene.create();

    const rectCalls = getMockFn(
      (scene as unknown as { add: Record<string, unknown> }).add.rectangle,
    ).mock.calls as Array<[number, number, number, number]>;
    const FOUR_LETTER_CARD_WIDTH = 4 * 80 + 3 * 8 + 2 * 30; // 404
    let widePairs = 0;
    for (const rowY of CARD_ROW_YS) {
      const rowCalls = rectCalls.filter((call) => call[1] === rowY);
      for (let i = 0; i + 1 < rowCalls.length; i += 2) {
        const left = rowCalls[i];
        const right = rowCalls[i + 1];
        if (left[2] !== FOUR_LETTER_CARD_WIDTH || right[2] !== FOUR_LETTER_CARD_WIDTH) {
          continue;
        }
        widePairs += 1;
        const leftEdge = left[0] + left[2] / 2;
        const rightEdge = right[0] - right[2] / 2;
        expect(leftEdge).toBeLessThan(rightEdge);
      }
    }
    expect(widePairs).toBeGreaterThan(0);
  });
});

describe("DecodeItScene interaction", () => {
  let matchMediaMock: MatchMediaStub;

  beforeEach(() => {
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

  function setReducedMotion(reduced: boolean): void {
    matchMediaMock.mockImplementation(() => ({
      matches: reduced,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  }

  it("tapping the correct card plays the correct chime, pops the dot, and advances", () => {
    const scene = new DecodeItScene(mulberry32(1234));
    scene.create();
    const round = getCurrentRound(scene);
    const dots = getProgressDots(scene);

    tapCard(scene, round.choices.indexOf(round.target));

    expect(mockAudio.playCorrect).toHaveBeenCalledTimes(1);
    expect(mockAudio.playIncorrect).not.toHaveBeenCalled();

    const mascot = getMascotImage(scene);
    expect(getMockFn(mascot.setTexture)).toHaveBeenCalledWith("mascot_celebrate");

    expect(getMockFn(dots[0].setAlpha)).toHaveBeenCalledWith(1);
    expect(getMockFn(dots[1].setAlpha)).not.toHaveBeenCalledWith(1);

    fireNextRoundDelay(scene);
    expect((scene as unknown as { roundIndex: number }).roundIndex).toBe(1);

    const secondRound = getCurrentRound(scene);
    expect(mockSpeech.speakWord).toHaveBeenCalledWith(secondRound.target, true);
    expect(getCardRects(scene)).toHaveLength(8);

    const imageMock = getMockFn((scene as unknown as { add: Record<string, unknown> }).add.image);
    const firstPromptTexture = getDecodeWord(
      (scene as unknown as { rounds: Array<{ target: string }> }).rounds[0].target,
    )?.promptTexture;
    const promptResults = imageMock.mock.results.filter(
      (_, i) => imageMock.mock.calls[i]?.[2] === firstPromptTexture,
    );
    expect(
      getMockFn((promptResults[0].value as Record<string, MockFn>).destroy),
    ).toHaveBeenCalled();
  });

  it("tapping a wrong card wiggles gently and does not advance the round", () => {
    const scene = new DecodeItScene(mulberry32(1234));
    scene.create();
    const round = getCurrentRound(scene);
    const correctIndex = round.choices.indexOf(round.target);
    const wrongIndex = (correctIndex + 1) % 4;
    const rect = getCardRects(scene)[wrongIndex];
    const letters = getCardLetters(scene, wrongIndex);

    tapCard(scene, wrongIndex);

    expect(mockAudio.playIncorrect).toHaveBeenCalledTimes(1);
    expect(mockAudio.playCorrect).not.toHaveBeenCalled();
    expect((scene as unknown as { roundIndex: number }).roundIndex).toBe(0);

    const mascot = getMascotImage(scene);
    const nodTween = getMockFn(scene.tweens.add).mock.calls.find(
      (call) => call[0]?.targets === mascot && call[0]?.angle?.to === 6,
    );
    expect(nodTween).toBeDefined();

    const wiggleTween = getMockFn(scene.tweens.add).mock.calls.find((call) => {
      const targets = call[0]?.targets;
      if (!Array.isArray(targets)) return false;
      return targets.includes(rect) && targets.some((t) => letters.includes(t));
    });
    expect(wiggleTween).toBeDefined();
    if (!wiggleTween) return;
    expect((wiggleTween[0] as { angle: number }).angle).toBe(4);
    expect((wiggleTween[0] as { yoyo: boolean }).yoyo).toBe(true);
  });

  it("locks input during the next-round transition", () => {
    const scene = new DecodeItScene(mulberry32(1234));
    scene.create();
    const round = getCurrentRound(scene);

    tapCard(scene, round.choices.indexOf(round.target));
    expect((scene as unknown as { inputLocked: boolean }).inputLocked).toBe(true);

    tapCard(scene, round.choices.indexOf(round.target));
    expect(mockAudio.playCorrect).toHaveBeenCalledTimes(1);
    expect((scene as unknown as { roundIndex: number }).roundIndex).toBe(0);
  });

  it("uses smaller wiggle amplitude and shorter durations under reduced motion", () => {
    setReducedMotion(true);
    const scene = new DecodeItScene(mulberry32(1234));
    scene.create();
    const round = getCurrentRound(scene);
    const correctIndex = round.choices.indexOf(round.target);
    const wrongIndex = (correctIndex + 1) % 4;
    const rect = getCardRects(scene)[wrongIndex];
    const letters = getCardLetters(scene, wrongIndex);

    tapCard(scene, wrongIndex);

    const wiggleTween = getMockFn(scene.tweens.add).mock.calls.find((call) => {
      const targets = call[0]?.targets;
      if (!Array.isArray(targets)) return false;
      return targets.includes(rect) && targets.some((t) => letters.includes(t));
    });
    expect(wiggleTween).toBeDefined();
    if (!wiggleTween) return;
    expect((wiggleTween[0] as { angle: number }).angle).toBe(2);
    expect((wiggleTween[0] as { duration: number }).duration).toBe(200);
  });
});

describe("DecodeItScene completion", () => {
  beforeEach(() => {
    stubMatchMedia(false);
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

  it("wins after 6 correct rounds: celebration, first-time sticker, justEarned, auto-return", () => {
    const scene = new DecodeItScene(mulberry32(1234));
    scene.create();

    for (let i = 0; i < 6; i++) {
      completeRound(scene);
    }

    expect(mockAudio.playWin).toHaveBeenCalledTimes(1);
    expect((scene as unknown as { inputLocked: boolean }).inputLocked).toBe(true);

    const tweenCalls = getMockFn(scene.tweens.add).mock.calls;
    expect(
      tweenCalls.some(
        (call) => call[0]?.scaleX === 1.25 && call[0]?.scaleY === 1.25 && call[0]?.alpha === 0,
      ),
    ).toBe(true);

    expect(mockAudio.playSticker).toHaveBeenCalledTimes(1);
    const stickerImage = getMockFn(
      (scene as unknown as { add: Record<string, unknown> }).add.image,
    ).mock.calls.find((call) => call[2] === "sticker_decode_it");
    expect(stickerImage).toBeDefined();

    fireAutoReturn(scene);
    expect(
      (scene as unknown as { scene: Record<string, MockFn> }).scene.start,
    ).toHaveBeenCalledWith("Hub", {
      justEarned: "decode-it",
    });
  });

  function getSpeakerImage(scene: unknown): Record<string, MockFn> {
    const imageMock = getMockFn((scene as { add: Record<string, unknown> }).add.image);
    const index = imageMock.mock.calls.findIndex((call) => call[2] === "icon_speaker");
    return imageMock.mock.results[index].value as Record<string, MockFn>;
  }

  it("guards the speaker during the win celebration (no crash after the final round)", () => {
    const scene = new DecodeItScene(mulberry32(1234));
    scene.create();

    for (let i = 0; i < 6; i++) {
      completeRound(scene);
    }
    expect(mockAudio.playWin).toHaveBeenCalledTimes(1);

    const speakerImage = getSpeakerImage(scene);
    const pointerdown = getMockFn(speakerImage.on).mock.calls.find((c) => c[0] === "pointerdown");
    expect(pointerdown).toBeDefined();
    if (pointerdown && typeof pointerdown[1] === "function") {
      expect(() => (pointerdown[1] as () => void)()).not.toThrow();
    }
  });

  it("re-speaks the current target word when the speaker is tapped mid-round", () => {
    const scene = new DecodeItScene(mulberry32(1234));
    scene.create();
    mockSpeech.speakWord.mockClear();

    const speakerImage = getSpeakerImage(scene);
    const pointerdown = getMockFn(speakerImage.on).mock.calls.find((c) => c[0] === "pointerdown");
    expect(pointerdown).toBeDefined();
    if (pointerdown && typeof pointerdown[1] === "function") {
      (pointerdown[1] as () => void)();
    }

    const round = getCurrentRound(scene);
    expect(mockSpeech.speakWord).toHaveBeenCalledWith(round.target, true);
  });

  it("shows a splash burst at the tapped card on a correct answer", () => {
    const scene = new DecodeItScene(mulberry32(1234));
    scene.create();

    const round = getCurrentRound(scene);
    const correctIndex = round.choices.indexOf(round.target);
    tapCard(scene, correctIndex);

    const graphicsMock = getMockFn(
      (scene as unknown as { add: Record<string, unknown> }).add.graphics,
    );
    expect(graphicsMock.mock.results.length).toBeGreaterThan(0);
    const graphics = graphicsMock.mock.results[0].value as Record<string, MockFn>;
    expect(getMockFn(graphics.lineStyle)).toHaveBeenCalled();
    expect(getMockFn(graphics.fillCircle)).toHaveBeenCalled();
  });

  it("does not award the sticker again or pass justEarned on repeat completions", () => {
    earnSticker("decode-it");
    const scene = new DecodeItScene(mulberry32(1234));
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

  it("re-launching after completion unlocks input so choices are clickable again", () => {
    const scene = new DecodeItScene(mulberry32(1234));
    scene.create();

    for (let i = 0; i < 6; i++) {
      completeRound(scene);
    }
    expect((scene as unknown as { inputLocked: boolean }).inputLocked).toBe(true);

    scene.create();
    expect((scene as unknown as { inputLocked: boolean }).inputLocked).toBe(false);

    const round = getCurrentRound(scene);
    const correctIndex = round.choices.indexOf(round.target);
    const correctCallsBefore = mockAudio.playCorrect.mock.calls.length;
    tapCard(scene, correctIndex);
    expect(mockAudio.playCorrect.mock.calls.length).toBe(correctCallsBefore + 1);
  });
});

describe("DecodeItScene press feedback cohesion", () => {
  function stubMotion(reduced: boolean): void {
    stubMatchMedia(reduced);
  }

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("gives every choice card press feedback restoring on release, out, and cancel", () => {
    stubMotion(false);
    const scene = new DecodeItScene(mulberry32(1234));
    scene.create();

    const controls = getInteractiveRects(scene);
    expect(controls.length).toBeGreaterThan(0);
    for (const control of controls) {
      expectPressFeedbackContract(control);
    }
  });

  it("keeps the gameplay choice handler registered before the press squish", () => {
    stubMotion(false);
    const scene = new DecodeItScene(mulberry32(1234));
    scene.create();

    const [first] = getInteractiveRects(scene);
    fireFirstHandler(first, "pointerdown");
    expect(first.setScale).not.toHaveBeenCalledWith(0.95);
  });

  it("attaches exactly one extra pointerdown listener per card when motion is allowed", () => {
    stubMotion(true);
    const reducedScene = new DecodeItScene(mulberry32(1234));
    reducedScene.create();
    const reducedCounts = getInteractiveRects(reducedScene).map((control) =>
      countListeners(control, "pointerdown"),
    );

    stubMotion(false);
    const scene = new DecodeItScene(mulberry32(1234));
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
    stubMatchMedia(false);
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
    const scene = new DecodeItScene(mulberry32(1234));
    scene.create();

    expect(buildPlaythroughMock).toHaveBeenCalledWith(6, 1);
  });

  it("requests the classic ladder when the facade returns 0", () => {
    const scene = new DecodeItScene(mulberry32(1234));
    scene.create();

    expect(buildPlaythroughMock).toHaveBeenCalledWith(6, 0);
  });

  it("builds identical rounds from two mulberry32(1234) constructions (AC-1)", () => {
    const first = new DecodeItScene(mulberry32(1234));
    first.create();
    const second = new DecodeItScene(mulberry32(1234));
    second.create();

    const a = (first as unknown as { rounds: Array<{ target: string; choices: string[] }> }).rounds;
    const b = (second as unknown as { rounds: Array<{ target: string; choices: string[] }> })
      .rounds;

    expect(b).toEqual(a);
  });
});
