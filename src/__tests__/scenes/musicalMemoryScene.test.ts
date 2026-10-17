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

/** Mock AudioManager so frog-note tests never touch a real AudioContext. */
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

/** Mock the TTS wrapper so replay requests never hit real speech synthesis. */
const { mockSpeech } = vi.hoisted(() => ({
  mockSpeech: {
    speakWord: vi.fn(() => true),
    isSpeechSupported: vi.fn(() => true),
    onSpeechLifecycle: vi.fn(() => vi.fn()),
  },
}));

vi.mock("../../utils/speech", () => mockSpeech);

const { getAdaptiveBandShiftMock, generateSequenceMock, isWinMock } = vi.hoisted(() => ({
  getAdaptiveBandShiftMock: vi.fn((_gameId: string): -1 | 0 | 1 => 0),
  generateSequenceMock: vi.fn(),
  isWinMock: vi.fn(),
}));

vi.mock("../../utils/storage", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  getAdaptiveBandShift: (gameId: string) => getAdaptiveBandShiftMock(gameId),
}));

vi.mock("../../game/musicalMemoryLogic", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../game/musicalMemoryLogic")>();
  return {
    ...actual,
    generateSequence: (length: number) => {
      generateSequenceMock(length);
      return actual.generateSequence(length);
    },
    isWin: (sequenceLength: number, target: number) => {
      isWinMock(sequenceLength, target);
      return actual.isWin(sequenceLength, target);
    },
  };
});

import { MusicalMemoryScene } from "../../scenes/MusicalMemoryScene";
import {
  countListeners,
  expectPressFeedbackContract,
  fireFirstHandler,
  getInteractiveImages,
  type MockGameObject,
} from "../helpers/pressFeedback";

describe("MusicalMemoryScene press feedback cohesion", () => {
  let matchMediaMock: MatchMediaStub;

  beforeEach(() => {
    matchMediaMock = stubMatchMedia(false);
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
    matchMediaMock.setReducedMotion(reduced);
  }

  it("gives every frog press feedback restoring on release, out, and cancel", () => {
    setReducedMotion(false);
    const scene = new MusicalMemoryScene();
    scene.create();

    const controls = getInteractiveImages(scene);
    // 3 frogs plus the replay SpeakerButton glyph (the component attaches
    // its own feedback), so require at least the frogs.
    expect(controls.length).toBeGreaterThanOrEqual(3);
    for (const control of controls) {
      expectPressFeedbackContract(control);
    }
  });

  it("keeps the tap handler registered before the press squish", () => {
    setReducedMotion(false);
    const scene = new MusicalMemoryScene();
    scene.create();

    const [first] = getInteractiveImages(scene);
    fireFirstHandler(first, "pointerdown");
    expect(first.setScale).not.toHaveBeenCalledWith(0.95);
  });

  it("attaches exactly one extra pointerdown listener per frog when motion is allowed", () => {
    setReducedMotion(true);
    const reducedScene = new MusicalMemoryScene();
    reducedScene.create();
    const reducedCounts = getInteractiveImages(reducedScene).map((frog) =>
      countListeners(frog, "pointerdown"),
    );

    setReducedMotion(false);
    const scene = new MusicalMemoryScene();
    scene.create();
    const frogs = getInteractiveImages(scene);

    expect(reducedCounts.length).toBeGreaterThan(0);
    expect(frogs.map((frog) => countListeners(frog, "pointerdown"))).toEqual(
      reducedCounts.map((count) => count + 1),
    );
    for (const frog of frogs) {
      expect(countListeners(frog, "pointerup")).toBe(1);
      expect(countListeners(frog, "pointercancel")).toBe(1);
    }
  });

  it("ignores taps while the sequence plays, regardless of press feedback", () => {
    setReducedMotion(false);
    const scene = new MusicalMemoryScene();
    scene.create();

    // create() starts playback immediately, so input is locked here.
    const [first] = getInteractiveImages(scene);
    fireFirstHandler(first, "pointerdown");

    expect(mockAudio.playFrogNote).not.toHaveBeenCalled();
  });
});

describe("MusicalMemoryScene replay drives the speaker grammar", () => {
  beforeEach(() => {
    stubMatchMedia(false);
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

  /** The replay button glyph (the icon_speaker image). */
  function getSpeakerImage(scene: unknown): MockGameObject {
    const imageMock = (scene as unknown as { add: { image: MockFn } }).add.image;
    const calls = imageMock.mock.calls;
    const index = calls.findIndex((call) => call[2] === "icon_speaker");
    if (index === -1) throw new Error("speaker image not found");
    const value = imageMock.mock.results[index]?.value;
    if (!value) throw new Error("speaker image result missing");
    return value as MockGameObject;
  }

  /** Fires the most recently scheduled delayed call (the sequence completion). */
  function fireLastDelayedCall(scene: unknown): void {
    const delayedCall = (scene as unknown as { time: { delayedCall: MockFn } }).time.delayedCall;
    const callback = delayedCall.mock.calls.at(-1)?.[1];
    if (typeof callback !== "function") {
      throw new Error("completion delayed call not found");
    }
    (callback as () => void)();
  }

  it("pulses the replay button while a replay plays and restores neutral after", () => {
    const scene = new MusicalMemoryScene();
    scene.create();

    // create() auto-plays; complete that initial playback first.
    fireLastDelayedCall(scene);
    const speaker = getSpeakerImage(scene);

    fireFirstHandler(speaker, "pointerdown");
    expect(speaker.setTint).toHaveBeenCalledWith(0x68d391);

    fireLastDelayedCall(scene);
    expect(speaker.clearTint).toHaveBeenCalled();
    expect(speaker.setAlpha).toHaveBeenLastCalledWith(1);
  });
});

describe("adaptive band shift wiring", () => {
  beforeEach(() => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    stubMatchMedia(false);
    localStorage.clear();
    mockParentLockInstances.length = 0;
    for (const fn of Object.values(mockAudio)) {
      fn.mockClear();
    }
    getAdaptiveBandShiftMock.mockClear();
    generateSequenceMock.mockClear();
    isWinMock.mockClear();
    getAdaptiveBandShiftMock.mockReturnValue(0);
  });

  /** Fires the most recently scheduled delayed call (the sequence completion). */
  function fireLastDelayedCall(scene: unknown): void {
    const delayedCall = (scene as unknown as { time: { delayedCall: MockFn } }).time.delayedCall;
    const callback = delayedCall.mock.calls.at(-1)?.[1];
    if (typeof callback !== "function") {
      throw new Error("completion delayed call not found");
    }
    (callback as () => void)();
  }

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it.each([
    [-1, 1],
    [0, 2],
    [1, 3],
  ] as const)("starts the sequence at the shifted length for shift %i", (shift, start) => {
    getAdaptiveBandShiftMock.mockReturnValue(shift);
    const scene = new MusicalMemoryScene();
    scene.create();
    expect(getAdaptiveBandShiftMock).toHaveBeenCalledWith("musical-memory");
    expect(generateSequenceMock).toHaveBeenCalledWith(start);
  });

  it("checks the win against the shifted win length after a completed round", () => {
    getAdaptiveBandShiftMock.mockReturnValue(-1);
    const scene = new MusicalMemoryScene();
    scene.create();

    // Finish the auto-play so input unlocks.
    fireLastDelayedCall(scene);

    // Tap the frog the 1-note easy sequence ends with.
    const sequence = (scene as unknown as { sequence: number[] }).sequence;
    expect(sequence).toHaveLength(1);
    const frogControls = getInteractiveImages(scene).slice(0, 3); // frogs only
    fireFirstHandler(frogControls[sequence[0]]!, "pointerdown");

    expect(isWinMock).toHaveBeenCalledWith(1, 5);
  });
});
