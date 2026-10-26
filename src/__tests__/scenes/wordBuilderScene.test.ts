import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stubMatchMedia } from "../helpers/matchMediaStub";

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

/** Mock the TTS wrapper so tests can verify word speech without real voices. */
const { mockSpeech } = vi.hoisted(() => ({
  mockSpeech: {
    speakWord: vi.fn(() => true),
    isSpeechSupported: vi.fn(() => true),
    onSpeechLifecycle: vi.fn(() => vi.fn()),
  },
}));

vi.mock("../../utils/speech", () => mockSpeech);

/** Controllable getAdaptiveBandShift facade plus a recorder for the generator call. */
const { getAdaptiveBandShiftMock, generateWordBuildPlaythroughMock } = vi.hoisted(() => ({
  getAdaptiveBandShiftMock: vi.fn((_gameId: string): -1 | 0 | 1 => 0),
  generateWordBuildPlaythroughMock: vi.fn(),
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
vi.mock("../../game/wordLogic", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../game/wordLogic")>();
  return {
    ...actual,
    // Forward every argument: the scene calls
    // generateWordBuildPlaythrough(wordCount, shift, rng), and dropping rng
    // here would silently strip the seeded path.
    generateWordBuildPlaythrough: (wordCount: number, shift: -1 | 0 | 1 = 0, rng?: Rng) => {
      generateWordBuildPlaythroughMock(wordCount, shift);
      return actual.generateWordBuildPlaythrough(wordCount, shift, rng);
    },
  };
});

import type { Rng } from "../../game/random";
import { generateLetterTiles, generateWordBuildPlaythrough, getWord } from "../../game/wordLogic";
import { WordBuilderScene } from "../../scenes/WordBuilderScene";
import { earnSticker, updateSettings } from "../../utils/storage";
import {
  countListeners,
  expectPressFeedbackContract,
  fireFirstHandler,
  getInteractiveRects,
} from "../helpers/pressFeedback";
import { mulberry32 } from "../helpers/randomHelper";

/** Casts a Phaser-typed method to a MockFn for mock assertions. */
function getMockFn(fn: unknown): MockFn {
  return fn as unknown as MockFn;
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

/** Fires the auto-return delay (3000ms) and the fade-out completion callback. */
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

describe("WordBuilderScene shell", () => {
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

  it("renders mascot, parent-locked Back button, and 3 progress dots for 3 words", () => {
    const scene = new WordBuilderScene(mulberry32(1234));
    scene.create();

    const imageMock = getMockFn((scene as unknown as { add: Record<string, unknown> }).add.image);
    expect(imageMock.mock.calls.some((call) => call[2] === "mascot_idle")).toBe(true);

    const textMock = getMockFn((scene as unknown as { add: Record<string, unknown> }).add.text);
    const backCall = textMock.mock.calls.find((call) => call[2] === "← Back");
    expect(backCall).toBeDefined();
    if (!backCall) throw new Error("back button text not found");
    const backIndex = textMock.mock.calls.indexOf(backCall);
    expect(getMockFn(textMock.mock.results[backIndex].value.setInteractive)).toHaveBeenCalled();
    expect(mockParentLockInstances).toHaveLength(1);
    expect(mockParentLockInstances[0].onSuccess).toBeDefined();

    const circleMock = getMockFn((scene as unknown as { add: Record<string, unknown> }).add.circle);
    expect(circleMock.mock.calls).toHaveLength(3);

    expect((scene as unknown as { words: unknown[] }).words).toHaveLength(3);
    expect((scene as unknown as { inputLocked: boolean }).inputLocked).toBe(false);
  });

  it("returns to the Hub when the parent lock succeeds", () => {
    const scene = new WordBuilderScene(mulberry32(1234));
    scene.create();

    expect(mockParentLockInstances).toHaveLength(1);
    const parentLock = mockParentLockInstances[0];
    const onSuccess = parentLock.onSuccess as () => void;
    expect(onSuccess).toBeDefined();

    onSuccess();

    const fadeOutMock = getMockFn(
      (scene as unknown as { cameras: { main: Record<string, unknown> } }).cameras.main.fadeOut,
    );
    expect(fadeOutMock).toHaveBeenCalled();
    const fadeOutCall = fadeOutMock.mock.calls.at(-1);
    if (fadeOutCall && typeof fadeOutCall[4] === "function") {
      (fadeOutCall[4] as () => void)();
    }
    expect(
      (scene as unknown as { scene: Record<string, unknown> }).scene.start,
    ).toHaveBeenCalledWith("Hub");
  });

  it("builds identical words from two mulberry32(1234) constructions (AC-1)", () => {
    const first = new WordBuilderScene(mulberry32(1234));
    first.create();
    const second = new WordBuilderScene(mulberry32(1234));
    second.create();

    const a = (first as unknown as { words: Array<{ word: string }> }).words;
    const b = (second as unknown as { words: typeof a }).words;

    expect(b).toEqual(a);
  });
});

/** Current word under test (from scene state). */
function getCurrentWord(scene: unknown): string {
  const s = scene as { words: Array<{ word: string }>; wordIndex: number };
  return s.words[s.wordIndex].word;
}

/** Slot row Y (slots sit at centerY + 40 = 424). */
const SLOT_Y = 384 + 40;

/** Tile row Y (tiles sit at centerY + 220 = 604). */
const TILE_Y = 384 + 220;

/** Rectangles whose y is the slot row. */
function getSlotRects(scene: unknown): Array<Record<string, MockFn>> {
  const s = scene as { add: Record<string, MockFn> };
  const rectangleMock = getMockFn(s.add.rectangle);
  const slots: Array<Record<string, MockFn>> = [];
  for (let i = 0; i < rectangleMock.mock.calls.length; i++) {
    if (rectangleMock.mock.calls[i][1] === SLOT_Y) {
      slots.push(rectangleMock.mock.results[i].value as Record<string, MockFn>);
    }
  }
  return slots;
}

/** Rectangles whose y is the tile row. */
function getTileRects(scene: unknown): Array<Record<string, MockFn>> {
  const s = scene as { add: Record<string, MockFn> };
  const rectangleMock = getMockFn(s.add.rectangle);
  const tiles: Array<Record<string, MockFn>> = [];
  for (let i = 0; i < rectangleMock.mock.calls.length; i++) {
    if (rectangleMock.mock.calls[i][1] === TILE_Y) {
      tiles.push(rectangleMock.mock.results[i].value as Record<string, MockFn>);
    }
  }
  return tiles;
}

/** Simulates a tap on a letter tile by triggering its pointerdown callback. */
function tapTile(scene: unknown, tileIndex: number): void {
  const tiles = getTileRects(scene);
  const tile = tiles[tileIndex];
  if (!tile) throw new Error(`Tile ${tileIndex} not found`);
  const onCalls = getMockFn(tile.on).mock.calls;
  const pointerdownCall = onCalls.find((c) => c[0] === "pointerdown");
  if (pointerdownCall && typeof pointerdownCall[1] === "function") {
    (pointerdownCall[1] as () => void)();
  }
}

/** Letter images placed in the slot row (the letters locked in so far). */
function getSlotImages(scene: unknown): Array<{ key: string; x: number }> {
  const s = scene as { add: Record<string, MockFn> };
  const imageMock = getMockFn(s.add.image);
  return imageMock.mock.calls
    .filter((call) => call[1] === SLOT_Y && typeof call[2] === "string")
    .map((call) => ({ key: call[2] as string, x: call[0] as number }))
    .sort((a, b) => a.x - b.x);
}

/** Tile letters in on-screen order (scene private state, accessed in tests). */
function getTileValues(scene: unknown): string[] {
  return (scene as unknown as { tileLetterValues: string[] }).tileLetterValues;
}

/**
 * Letters currently locked into slots (scene private state). Since used
 * tiles fly into the slot, these are the tile letter images, not new
 * images created at the slot row.
 */
function getPlacedSlots(scene: unknown): Array<Record<string, MockFn>> {
  return (
    scene as unknown as { slotImages: Array<Record<string, MockFn> | null> }
  ).slotImages.filter((img): img is Record<string, MockFn> => img !== null);
}

describe("WordBuilderScene interaction", () => {
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

  it("flies a used tile's letter into the slot and ghosts the tile", () => {
    const scene = new WordBuilderScene(mulberry32(1234));
    scene.create();

    const word = getCurrentWord(scene);
    const tiles = getTileValues(scene);
    const correctIndex = tiles.indexOf(word[0]);

    tapTile(scene, correctIndex);

    expect(mockAudio.playPop).toHaveBeenCalledTimes(1);

    // The letter itself flies to the slot: no new image is created there.
    const s = scene as unknown as {
      add: Record<string, MockFn>;
      slotXs: number[];
      slotImages: Array<Record<string, MockFn> | null>;
      tileLetterValues: string[];
    };
    const imageMock = getMockFn(s.add.image);
    const tileImageCall = imageMock.mock.calls.find(
      (call) => call[2] === `letter_${word[0].toLowerCase()}` && call[1] === TILE_Y,
    );
    expect(tileImageCall).toBeDefined();
    if (!tileImageCall) return;
    const tileLetter = imageMock.mock.results[imageMock.mock.calls.indexOf(tileImageCall)].value;
    const flyTween = getMockFn(scene.tweens.add).mock.calls.find(
      (call) => (call[0] as { targets?: unknown }).targets === tileLetter,
    );
    expect(flyTween?.[0]).toMatchObject({ x: s.slotXs[0] });
    expect(s.slotImages[0]).toBe(tileLetter);

    // The tile becomes a ghosted placeholder: dimmed, non-interactive, empty.
    const tileRect = getTileRects(scene)[correctIndex];
    expect(getMockFn(tileRect.setAlpha)).toHaveBeenCalledWith(0.25);
    expect(getMockFn(tileRect.disableInteractive)).toHaveBeenCalled();
    expect(s.tileLetterValues[correctIndex]).toBe("");

    // Tapping the ghost again does not fill another slot.
    tapTile(scene, correctIndex);
    expect(getSlotImages(scene)).toHaveLength(0);
  });

  it("sizes letter tiles to stay above the 64px touch floor at phone scale", () => {
    const scene = new WordBuilderScene(mulberry32(1234));
    scene.create();

    // At the smallest supported phone (FIT scale ~0.49) a 110px tile renders
    // at ~54px — below the 64px touch floor. The tile side must be at least
    // 64 / 0.49 = ~131px in the 1024px base canvas.
    const rectangleMock = getMockFn(
      (scene as unknown as { add: Record<string, unknown> }).add.rectangle,
    );
    const tileCalls = rectangleMock.mock.calls.filter((call) => call[1] === TILE_Y);
    expect(tileCalls.length).toBeGreaterThan(0);
    for (const call of tileCalls) {
      const width = call[2] as number;
      const height = call[3] as number;
      expect(width).toBeGreaterThanOrEqual(131);
      expect(height).toBeGreaterThanOrEqual(131);
    }
    // The whole six-tile row must still fit the 1024px base canvas.
    const rowWidth = tileCalls.length * (tileCalls[0][2] as number) + (tileCalls.length - 1) * 16;
    expect(rowWidth).toBeLessThanOrEqual(1024);
  });

  it("keeps a duplicate-letter tile tappable until its second use", () => {
    const scene = new WordBuilderScene(mulberry32(1234));
    scene.create();

    // Force the duplicate-letter word: BALL needs its single L tile twice.
    const s = scene as unknown as {
      words: Array<{ word: string; letters: string[]; promptTexture: string; tier: number }>;
      wordIndex: number;
      renderRound: () => void;
      tileLetterValues: string[];
      slotImages: Array<Record<string, MockFn> | null>;
    };
    s.words = [
      { word: "BALL", letters: ["B", "A", "L", "L"], promptTexture: "item_ball", tier: 4 },
    ];
    s.wordIndex = 0;
    s.renderRound();

    const tiles = getTileValues(scene);
    const bIdx = tiles.indexOf("B");
    const aIdx = tiles.indexOf("A");
    const lIdx = tiles.indexOf("L");
    expect(bIdx).toBeGreaterThanOrEqual(0);
    expect(aIdx).toBeGreaterThanOrEqual(0);
    expect(lIdx).toBeGreaterThanOrEqual(0);

    tapTile(scene, bIdx);
    tapTile(scene, aIdx);

    // The tile rects of the forced render are the last TILE_COUNT rects.
    const rects = getTileRects(scene).slice(getTileValues(scene).length);

    // First L use: still needed for the final slot, so a fresh copy lands in
    // the slot and the tile stays fully tappable.
    tapTile(scene, lIdx);
    expect(getPlacedSlots(scene)).toHaveLength(3);
    expect(getTileValues(scene)[lIdx]).toBe("L");
    expect(getMockFn(rects[lIdx].disableInteractive)).not.toHaveBeenCalled();

    // Second L use: the tile's letter flies into the final slot and the tile
    // is ghosted.
    tapTile(scene, lIdx);
    expect(getPlacedSlots(scene)).toHaveLength(4);
    expect(getTileValues(scene)[lIdx]).toBe("");
    expect(getMockFn(rects[lIdx].disableInteractive)).toHaveBeenCalled();
  });

  it("wiggles wrong tiles with a soft tone and no penalty", () => {
    const scene = new WordBuilderScene(mulberry32(1234));
    scene.create();

    const word = getCurrentWord(scene);
    const tiles = getTileValues(scene);
    const wrongIndex = tiles.findIndex((letter) => letter !== word[0]);

    tapTile(scene, wrongIndex);

    expect(mockAudio.playIncorrect).toHaveBeenCalledTimes(1);
    expect(getSlotImages(scene)).toHaveLength(0);

    const wiggleTween = getMockFn(scene.tweens.add).mock.calls.find((call) => {
      const t = call[0] as { angle?: number; yoyo?: boolean };
      return t?.angle === 4 && t?.yoyo === true;
    });
    expect(wiggleTween).toBeDefined();
    if (!wiggleTween) return;
    const targets = (wiggleTween[0] as { targets: unknown[] }).targets;
    const wrongRect = getTileRects(scene)[wrongIndex];
    expect(targets).toContain(wrongRect);
  });

  it("fills slots strictly left-to-right in word order", () => {
    const scene = new WordBuilderScene(mulberry32(1234));
    scene.create();

    const word = getCurrentWord(scene);
    const tiles = getTileValues(scene);
    for (const letter of word.slice(0, 2)) {
      tapTile(scene, tiles.indexOf(letter));
    }

    const slots = getPlacedSlots(scene);
    expect(slots).toHaveLength(2);
    // The letters are the flown tile letters, locked in word order.
    const imageMock = getMockFn((scene as unknown as { add: Record<string, unknown> }).add.image);
    const keyOf = (img: Record<string, MockFn>): string => {
      const callIndex = imageMock.mock.results.findIndex((r) => r.value === img);
      return imageMock.mock.calls[callIndex][2] as string;
    };
    expect(keyOf(slots[0])).toBe(`letter_${word[0].toLowerCase()}`);
    expect(keyOf(slots[1])).toBe(`letter_${word[1].toLowerCase()}`);
    const slotXs = (scene as unknown as { slotXs: number[] }).slotXs;
    expect(slotXs[0]).toBeLessThan(slotXs[1]);
  });

  it("locks input once the word is fully spelled", () => {
    const scene = new WordBuilderScene(mulberry32(1234));
    scene.create();

    const word = getCurrentWord(scene);
    const tiles = getTileValues(scene);
    for (const letter of word) {
      tapTile(scene, tiles.indexOf(letter));
    }

    expect(getPlacedSlots(scene)).toHaveLength(word.length);
    expect((scene as unknown as { inputLocked: boolean }).inputLocked).toBe(true);

    tapTile(scene, 0);
    expect(getPlacedSlots(scene)).toHaveLength(word.length);
    expect(mockAudio.playPop).toHaveBeenCalledTimes(word.length);
  });
});

/** Letter images on the tile row, sorted left-to-right by x. */
function getTileLetters(scene: unknown): Array<{ key: string; x: number }> {
  const s = scene as { add: Record<string, MockFn> };
  const imageMock = getMockFn(s.add.image);
  return imageMock.mock.calls
    .filter((call) => call[1] === TILE_Y && typeof call[2] === "string")
    .map((call) => ({ key: call[2] as string, x: call[0] as number }))
    .sort((a, b) => a.x - b.x);
}

/** The prompt picture image (from the word's promptTexture). */
function getPromptImage(scene: unknown): Record<string, MockFn> | undefined {
  const s = scene as { add: Record<string, MockFn> };
  const imageMock = getMockFn(s.add.image);
  const word = getCurrentWord(scene);
  const texture = getWord(word)?.promptTexture;
  const call = imageMock.mock.calls.find((c) => c[2] === texture);
  return call
    ? (imageMock.mock.results[imageMock.mock.calls.indexOf(call)].value as Record<string, MockFn>)
    : undefined;
}

/** Taps every letter of the current word in order. */
function fillWord(scene: unknown): void {
  const word = getCurrentWord(scene);
  const tiles = getTileValues(scene);
  for (const letter of word) {
    tapTile(scene, tiles.indexOf(letter));
  }
}

/** Fires the word-linger delay (1200ms) so the next word starts. */
const WORD_LINGER_DELAY = 1200;

function fireWordLinger(scene: unknown): void {
  const s = scene as { time: Record<string, MockFn> };
  const delayedCall = getMockFn(s.time.delayedCall);
  const call = delayedCall.mock.calls.find((c) => c[0] === WORD_LINGER_DELAY);
  expect(call).toBeDefined();
  if (call && typeof call[1] === "function") {
    (call[1] as () => void)();
  }
}

describe("WordBuilderScene completion", () => {
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

  it("chimes, cheers, pops a dot, and advances after a finished word lingers", () => {
    const scene = new WordBuilderScene(mulberry32(1234));
    scene.create();

    fillWord(scene);

    expect(mockAudio.playCorrect).toHaveBeenCalledTimes(1);
    const mascotImage = getMascotImage(scene);
    expect(getMockFn(mascotImage.setTexture)).toHaveBeenCalledWith("mascot_celebrate");
    const dots = getProgressDots(scene);
    expect(getMockFn(dots[0].setAlpha)).toHaveBeenCalledWith(1);
    expect(getMockFn(dots[1].setAlpha)).not.toHaveBeenCalled();
    expect((scene as unknown as { inputLocked: boolean }).inputLocked).toBe(true);

    fireWordLinger(scene);

    expect((scene as unknown as { wordIndex: number }).wordIndex).toBe(1);
    expect((scene as unknown as { inputLocked: boolean }).inputLocked).toBe(false);
    expect(getTileValues(scene)).toHaveLength(6);
    expect(getTileRects(scene)).toHaveLength(12);
  });

  it("wins after 3 words, awarding the sticker and auto-returning with justEarned", () => {
    const scene = new WordBuilderScene(mulberry32(1234));
    scene.create();

    for (let i = 0; i < 3; i++) {
      fillWord(scene);
      fireWordLinger(scene);
    }

    expect(mockAudio.playWin).toHaveBeenCalledTimes(1);
    expect((scene as unknown as { inputLocked: boolean }).inputLocked).toBe(true);

    const celebration = getMockFn(scene.tweens.add).mock.calls.find((call) => {
      const t = call[0] as { scaleX?: number; scaleY?: number; alpha?: number };
      return t?.scaleX === 1.25 && t?.scaleY === 1.25 && t?.alpha === 0;
    });
    expect(celebration).toBeDefined();

    expect(mockAudio.playSticker).toHaveBeenCalledTimes(1);
    const imageMock = getMockFn(scene.add.image);
    expect(imageMock.mock.calls.some((call) => call[2] === "sticker_word_builder")).toBe(true);

    fireAutoReturn(scene);
    expect(getMockFn(scene.scene.start)).toHaveBeenCalledWith("Hub", {
      justEarned: "word-builder",
    });
  });

  /** Returns the speaker button image created with the icon_speaker texture. */
  function getSpeakerImage(scene: unknown): Record<string, MockFn> {
    const imageMock = getMockFn((scene as { add: Record<string, unknown> }).add.image);
    const index = imageMock.mock.calls.findIndex((call) => call[2] === "icon_speaker");
    return imageMock.mock.results[index].value as Record<string, MockFn>;
  }

  it("guards the speaker during the win celebration (no crash after the final word)", () => {
    const scene = new WordBuilderScene(mulberry32(1234));
    scene.create();

    for (let i = 0; i < 3; i++) {
      fillWord(scene);
      fireWordLinger(scene);
    }
    expect(mockAudio.playWin).toHaveBeenCalledTimes(1);

    // Tapping "hear it again" during the 3s celebration must not dereference
    // words[wordIndex] past the end of the array.
    const speakerImage = getSpeakerImage(scene);
    const pointerdown = getMockFn(speakerImage.on).mock.calls.find((c) => c[0] === "pointerdown");
    expect(pointerdown).toBeDefined();
    if (pointerdown && typeof pointerdown[1] === "function") {
      expect(() => (pointerdown[1] as () => void)()).not.toThrow();
    }
  });

  it("does not re-award the sticker or pass justEarned on repeat completions", () => {
    earnSticker("word-builder");
    const scene = new WordBuilderScene(mulberry32(1234));
    scene.create();

    for (let i = 0; i < 3; i++) {
      fillWord(scene);
      fireWordLinger(scene);
    }

    expect(mockAudio.playSticker).not.toHaveBeenCalled();
    fireAutoReturn(scene);
    expect(getMockFn(scene.scene.start)).toHaveBeenCalledWith("Hub");
  });

  it("re-launching after completion unlocks input so tiles are tappable again", () => {
    const scene = new WordBuilderScene(mulberry32(1234));
    scene.create();

    for (let i = 0; i < 3; i++) {
      fillWord(scene);
      fireWordLinger(scene);
    }
    expect((scene as unknown as { inputLocked: boolean }).inputLocked).toBe(true);

    // Returning to the Hub and tapping the tile again calls create() on the
    // same scene instance (Phaser restart) — input must be unlocked.
    scene.create();
    expect((scene as unknown as { inputLocked: boolean }).inputLocked).toBe(false);

    const word = getCurrentWord(scene);
    const popCallsBefore = mockAudio.playPop.mock.calls.length;
    tapTile(scene, getTileValues(scene).indexOf(word[0]));
    expect(mockAudio.playPop.mock.calls.length).toBe(popCallsBefore + 1);
  });
});

describe("WordBuilderScene round rendering", () => {
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

  it("renders the prompt picture from the word's texture key", () => {
    const scene = new WordBuilderScene(mulberry32(1234));
    scene.create();

    const prompt = getPromptImage(scene);
    expect(prompt).toBeDefined();
    expect(getMockFn(prompt?.setDisplaySize)).toHaveBeenCalledWith(180, 180);
  });

  it("renders one slot per letter of the word", () => {
    const scene = new WordBuilderScene(mulberry32(1234));
    scene.create();

    const word = getCurrentWord(scene);
    const slots = getSlotRects(scene);
    expect(slots).toHaveLength(word.length);
    for (const slot of slots) {
      expect(getMockFn(slot.setStrokeStyle)).toHaveBeenCalled();
    }
  });

  it("renders 6 letter tiles with distractors from letter textures", () => {
    const scene = new WordBuilderScene(mulberry32(1234));
    scene.create();

    const word = getCurrentWord(scene);
    const entry = getWord(word);
    if (!entry) throw new Error("current word entry not found");
    // Replay the scene's draw order on a fresh mulberry32(1234): the
    // playthrough's shuffles consume draws before the tiles are generated.
    const replay = mulberry32(1234);
    generateWordBuildPlaythrough(3, 0, replay);
    const expectedTiles = generateLetterTiles(entry.word, replay);
    const tiles = getTileRects(scene);
    expect(tiles).toHaveLength(6);
    for (const tile of tiles) {
      expect(getMockFn(tile.setInteractive)).toHaveBeenCalled();
      expect(getMockFn(tile.setStrokeStyle)).toHaveBeenCalled();
    }

    const letters = getTileLetters(scene);
    expect(letters).toHaveLength(6);
    expect(letters.map((l) => l.key)).toEqual(
      expectedTiles.map((letter) => `letter_${letter.toLowerCase()}`),
    );
    const firstLetterMock = getMockFn(
      (scene as unknown as { add: Record<string, unknown> }).add.image,
    );
    const letterCall = firstLetterMock.mock.calls.find((c) => c[1] === TILE_Y);
    if (letterCall) {
      const letterIndex = firstLetterMock.mock.calls.indexOf(letterCall);
      const letterObj = firstLetterMock.mock.results[letterIndex].value as Record<string, MockFn>;
      expect(getMockFn(letterObj.setDisplaySize)).toHaveBeenCalledWith(80, 80);
    }
  });

  it("speaks the word when SFX is enabled and stays silent when disabled", () => {
    const scene = new WordBuilderScene(mulberry32(1234));
    scene.create();

    const word = getCurrentWord(scene);
    expect(mockSpeech.speakWord).toHaveBeenCalledWith(word, true);

    mockSpeech.speakWord.mockClear();
    updateSettings({ sfxEnabled: false });
    const silentScene = new WordBuilderScene(mulberry32(1234));
    silentScene.create();
    expect(mockSpeech.speakWord).toHaveBeenCalledWith(word, false);
  });
});

/* --- Press feedback cohesion (Track: UI/UX Cohesion, Phase 2) --- */

describe("WordBuilderScene press feedback cohesion", () => {
  /** Stubs matchMedia to control the prefers-reduced-motion result. */
  function stubMotion(reduced: boolean): void {
    stubMatchMedia(reduced);
  }

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("gives every letter tile press feedback restoring on release, out, and cancel", () => {
    stubMotion(false);
    const scene = new WordBuilderScene(mulberry32(1234));
    scene.create();

    const controls = getInteractiveRects(scene);
    expect(controls.length).toBeGreaterThan(0);
    for (const control of controls) {
      expectPressFeedbackContract(control);
    }
  });

  it("keeps the tile placement handler registered before the press squish", () => {
    stubMotion(false);
    const scene = new WordBuilderScene(mulberry32(1234));
    scene.create();

    const [first] = getInteractiveRects(scene);
    fireFirstHandler(first, "pointerdown");
    expect(first.setScale).not.toHaveBeenCalledWith(0.95);
  });

  it("attaches exactly one extra pointerdown listener per tile when motion is allowed", () => {
    stubMotion(true);
    const reducedScene = new WordBuilderScene(mulberry32(1234));
    reducedScene.create();
    const reducedCounts = getInteractiveRects(reducedScene).map((control) =>
      countListeners(control, "pointerdown"),
    );

    stubMotion(false);
    const scene = new WordBuilderScene(mulberry32(1234));
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
    generateWordBuildPlaythroughMock.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("passes the facade's band shift to generateWordBuildPlaythrough", () => {
    getAdaptiveBandShiftMock.mockReturnValue(-1);
    const scene = new WordBuilderScene(mulberry32(1234));
    scene.create();

    expect(generateWordBuildPlaythroughMock).toHaveBeenCalledWith(3, -1);
  });

  it("requests the classic ladder when the facade returns 0", () => {
    const scene = new WordBuilderScene(mulberry32(1234));
    scene.create();

    expect(generateWordBuildPlaythroughMock).toHaveBeenCalledWith(3, 0);
  });
});
