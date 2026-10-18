import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MockFn } from "../helpers/phaserMock";
import {
  assertBoundedSuccessEffect,
  assertWinCelebrationCreated,
  completeFadeOuts,
  getMockFn,
  mockAudio,
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

import { MusicalMemoryScene } from "../../scenes/MusicalMemoryScene";
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

describe("MusicalMemoryScene sequence playback and input", () => {
  beforeEach(() => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /** Returns frog image objects in index order (0=green, 1=blue, 2=red). */
  function getFrogs(scene: unknown): Array<Record<string, MockFn>> {
    const add = (scene as { add: Record<string, unknown> }).add;
    const imageMock = getMockFn(add.image);
    const frogKeys = ["frog_green", "frog_blue", "frog_red"];
    const frogs: Array<Record<string, MockFn>> = [];
    for (let i = 0; i < imageMock.mock.calls.length; i++) {
      const key = imageMock.mock.calls[i][2] as string;
      const frogIndex = frogKeys.indexOf(key);
      if (frogIndex >= 0) {
        frogs[frogIndex] = imageMock.mock.results[i].value as Record<string, MockFn>;
      }
    }
    return frogs;
  }

  /** Returns the replay speaker button image object, or undefined if not found. */
  function getReplayButton(scene: unknown): Record<string, MockFn> | undefined {
    const add = (scene as { add: Record<string, unknown> }).add;
    const imageMock = getMockFn(add.image);
    for (let i = 0; i < imageMock.mock.calls.length; i++) {
      if (imageMock.mock.calls[i][2] === "icon_speaker") {
        return imageMock.mock.results[i].value as Record<string, MockFn>;
      }
    }
    return undefined;
  }

  /** Fires all delayedCall callbacks sorted by delay value. */
  function fireAllDelayedCalls(scene: unknown): void {
    const delayedCallMock = getMockFn(
      (scene as { time: Record<string, unknown> }).time.delayedCall,
    );
    const calls = [...delayedCallMock.mock.calls].sort(
      (a, b) => (a[0] as number) - (b[0] as number),
    );
    for (const call of calls) {
      if (typeof call[1] === "function") {
        (call[1] as () => void)();
      }
    }
  }

  /** Fires delayedCall callbacks added at or after the given index, sorted by delay. */
  function fireDelayedCallsFrom(scene: unknown, startIndex: number): void {
    const delayedCallMock = getMockFn(
      (scene as { time: Record<string, unknown> }).time.delayedCall,
    );
    const calls = delayedCallMock.mock.calls
      .slice(startIndex)
      .sort((a, b) => (a[0] as number) - (b[0] as number));
    for (const call of calls) {
      if (typeof call[1] === "function") {
        (call[1] as () => void)();
      }
    }
  }

  /** Simulates a tap on a frog by triggering its pointerdown callback. */
  function tapFrog(frogs: Array<Record<string, MockFn>>, frogIndex: number): void {
    const frog = frogs[frogIndex];
    if (!frog) throw new Error(`Frog ${frogIndex} not found`);
    const onCalls = getMockFn(frog.on).mock.calls;
    const pointerdownCall = onCalls.find((c) => c[0] === "pointerdown");
    if (pointerdownCall && typeof pointerdownCall[1] === "function") {
      (pointerdownCall[1] as () => void)();
    }
  }

  /** Simulates a tap on the replay button. */
  function tapReplayButton(scene: unknown): void {
    const button = getReplayButton(scene);
    if (!button) throw new Error("Replay button not found");
    const onCalls = getMockFn(button.on).mock.calls;
    const pointerdownCall = onCalls.find((c) => c[0] === "pointerdown");
    if (pointerdownCall && typeof pointerdownCall[1] === "function") {
      (pointerdownCall[1] as () => void)();
    }
  }

  /** Clears audio mock call data to isolate subsequent interactions. */
  function clearAudioMocks(): void {
    mockAudio.playFrogNote.mockClear();
    mockAudio.playCorrect.mockClear();
    mockAudio.playIncorrect.mockClear();
  }

  it("creates 3 frog images and 3 lily pad images", () => {
    const scene = new MusicalMemoryScene();
    scene.create();

    const imageCalls = getMockFn(scene.add.image).mock.calls;
    const keys = imageCalls.map((call) => call[2] as string);

    expect(keys).toContain("frog_green");
    expect(keys).toContain("frog_blue");
    expect(keys).toContain("frog_red");
    expect(keys.filter((k) => k === "lilypad")).toHaveLength(3);
  });

  it("auto-plays sequence at round start with each frog playing its note in sequence order", () => {
    const scene = new MusicalMemoryScene();
    scene.create();

    // With Math.random=0.5, sequence = [1, 1] (blue frog, E4=329.63Hz)
    // Notes are scheduled via delayed calls — none played yet
    expect(mockAudio.playFrogNote).not.toHaveBeenCalled();

    // Fire all delayed calls to simulate playback
    fireAllDelayedCalls(scene);

    // Should have played 2 notes (sequence length 2), both E4 (329.63Hz)
    expect(mockAudio.playFrogNote).toHaveBeenCalledTimes(2);
    expect(mockAudio.playFrogNote).toHaveBeenCalledWith(329.63);
  });

  it("plays short sequences at 600ms per note and long sequences at 480ms", () => {
    const scene = new MusicalMemoryScene();
    scene.create();

    const s = scene as unknown as {
      sequence: number[];
      playSequence: () => void;
    };
    const delayedCallMock = getMockFn(
      (scene as unknown as { time: { delayedCall: MockFn } }).time.delayedCall,
    );

    // Sequence of length 4 (below the 5-note threshold) keeps the 600ms pace.
    const before = delayedCallMock.mock.calls.length;
    s.sequence = [0, 1, 2, 3];
    s.playSequence();
    const shortCalls = delayedCallMock.mock.calls.slice(before);
    expect(shortCalls[0][0]).toBe(0); // first note plays immediately
    expect(shortCalls[1][0]).toBe(600);
    expect(shortCalls[3][0]).toBe(3 * 600);
    expect(shortCalls[4][0]).toBe(4 * 600); // input unlock

    // Sequence of length 5 or more plays faster (480ms).
    const beforeLong = delayedCallMock.mock.calls.length;
    s.sequence = [0, 1, 2, 3, 4];
    s.playSequence();
    const longCalls = delayedCallMock.mock.calls.slice(beforeLong);
    expect(longCalls[0][0]).toBe(0); // first note plays immediately
    expect(longCalls[1][0]).toBe(480);
    expect(longCalls[4][0]).toBe(4 * 480);
    expect(longCalls[5][0]).toBe(5 * 480); // input unlock
  });

  it("locks input during sequence playback (taps ignored)", () => {
    const scene = new MusicalMemoryScene();
    scene.create();

    // Don't fire delayed calls — playback is "in progress", input locked
    const frogs = getFrogs(scene);
    tapFrog(frogs, 1);

    // No note should play from the tap (input locked)
    expect(mockAudio.playFrogNote).not.toHaveBeenCalled();
  });

  it("unlocks input after sequence playback completes", () => {
    const scene = new MusicalMemoryScene();
    scene.create();

    // Fire all delayed calls — playback completes, input unlocked
    fireAllDelayedCalls(scene);
    clearAudioMocks();

    const frogs = getFrogs(scene);
    tapFrog(frogs, 1);

    // Tap should be accepted — note plays
    expect(mockAudio.playFrogNote).toHaveBeenCalledTimes(1);
  });

  it("child tap on a frog plays its note and triggers scale animation", () => {
    const scene = new MusicalMemoryScene();
    scene.create();
    fireAllDelayedCalls(scene);

    const frogs = getFrogs(scene);
    clearAudioMocks();

    const tweensBefore = getMockFn(scene.tweens.add).mock.calls.length;
    tapFrog(frogs, 1); // Tap blue frog
    const tweensAfter = getMockFn(scene.tweens.add).mock.calls.length;

    // Note plays from the tap
    expect(mockAudio.playFrogNote).toHaveBeenCalledTimes(1);
    expect(mockAudio.playFrogNote).toHaveBeenCalledWith(329.63);

    // Scale animation (tween) added for the tapped frog
    expect(tweensAfter).toBeGreaterThan(tweensBefore);
    const latestTween = getMockFn(scene.tweens.add).mock.calls[tweensAfter - 1][0];
    expect(latestTween.targets).toBe(frogs[1]);
    expect(latestTween.yoyo).toBe(true);
  });

  it("uses a reduced-motion frog bounce when requested", () => {
    vi.stubGlobal("window", {
      matchMedia: vi.fn(() => ({ matches: true })),
    });

    const scene = new MusicalMemoryScene();
    scene.create();
    fireAllDelayedCalls(scene);

    const frogs = getFrogs(scene);
    clearAudioMocks();

    tapFrog(frogs, 1); // Tap blue frog
    const tweensAfter = getMockFn(scene.tweens.add).mock.calls.length;

    const latestTween = getMockFn(scene.tweens.add).mock.calls[tweensAfter - 1][0];
    expect(latestTween.targets).toBe(frogs[1]);
    expect(latestTween.duration).toBe(120);
    expect(latestTween.scaleX).toBeCloseTo((128 / 256) * 1.05, 5);
    expect(latestTween.scaleY).toBeCloseTo((128 / 256) * 1.05, 5);
  });

  it("correct tap advances input index; completing the full sequence triggers round success", () => {
    const scene = new MusicalMemoryScene();
    scene.create();
    fireAllDelayedCalls(scene);

    const frogs = getFrogs(scene);
    clearAudioMocks();

    // Sequence is [1, 1] — tap blue frog twice to complete
    tapFrog(frogs, 1); // Correct (index 0 -> 1)
    tapFrog(frogs, 1); // Correct (index 1 -> 2, round complete)

    // Round success triggers correct SFX
    expect(mockAudio.playCorrect).toHaveBeenCalledTimes(1);
  });

  it("wrong tap plays incorrect SFX, replays the sequence, and retries the same round", () => {
    const scene = new MusicalMemoryScene();
    scene.create();
    fireAllDelayedCalls(scene);

    const frogs = getFrogs(scene);
    clearAudioMocks();

    const delayedCallsBefore = getMockFn(scene.time.delayedCall).mock.calls.length;

    // Tap wrong frog (sequence[0]=1, tap frog 0=green)
    tapFrog(frogs, 0);

    // Incorrect SFX plays
    expect(mockAudio.playIncorrect).toHaveBeenCalledTimes(1);

    // Replay scheduled (new delayed calls)
    const delayedCallsAfter = getMockFn(scene.time.delayedCall).mock.calls.length;
    expect(delayedCallsAfter).toBeGreaterThan(delayedCallsBefore);

    // Clear audio mocks to isolate replay notes
    clearAudioMocks();

    // Fire replay delayed calls
    fireDelayedCallsFrom(scene, delayedCallsBefore);

    // Notes replayed (2 notes for sequence length 2)
    expect(mockAudio.playFrogNote).toHaveBeenCalledTimes(2);

    // After replay, the same round can still be completed (no progress lost)
    clearAudioMocks();
    tapFrog(frogs, 1); // Correct
    tapFrog(frogs, 1); // Correct, round complete
    expect(mockAudio.playCorrect).toHaveBeenCalledTimes(1);
  });

  it("replay button re-plays the current sequence on demand", () => {
    const scene = new MusicalMemoryScene();
    scene.create();
    fireAllDelayedCalls(scene);

    clearAudioMocks();

    const delayedCallsBefore = getMockFn(scene.time.delayedCall).mock.calls.length;

    tapReplayButton(scene);

    // New delayed calls scheduled
    const delayedCallsAfter = getMockFn(scene.time.delayedCall).mock.calls.length;
    expect(delayedCallsAfter).toBeGreaterThan(delayedCallsBefore);

    // Fire replay delayed calls
    fireDelayedCallsFrom(scene, delayedCallsBefore);

    // Notes replayed (2 notes for sequence length 2)
    expect(mockAudio.playFrogNote).toHaveBeenCalledTimes(2);
  });

  it("replay resets input progress so the child can restart from the first note", () => {
    // Sequence [0, 1] (green, blue): distinct adjacent notes expose the
    // stale-inputIndex bug — without the reset, a replay followed by the
    // first-note tap would be judged against the SECOND note and fail.
    vi.spyOn(Math, "random").mockReturnValueOnce(0.0).mockReturnValueOnce(0.5).mockReturnValue(0.5);

    const scene = new MusicalMemoryScene();
    scene.create();
    fireAllDelayedCalls(scene); // initial playback done, input unlocked

    const frogs = getFrogs(scene);
    clearAudioMocks();

    // Child taps the first note correctly (inputIndex 0 -> 1)
    tapFrog(frogs, 0);
    expect((scene as unknown as { inputIndex: number }).inputIndex).toBe(1);
    expect(mockAudio.playIncorrect).not.toHaveBeenCalled();

    // Child asks to hear the sequence again mid-round…
    const delayedCallsBefore = getMockFn(scene.time.delayedCall).mock.calls.length;
    tapReplayButton(scene);
    fireDelayedCallsFrom(scene, delayedCallsBefore);

    // …and the replay restarts input at the first note.
    expect((scene as unknown as { inputIndex: number }).inputIndex).toBe(0);

    // Tapping the FIRST note again must be judged correct, not measured
    // against the stale second-note position.
    clearAudioMocks();
    tapFrog(frogs, 0);
    expect((scene as unknown as { inputIndex: number }).inputIndex).toBe(1);
    expect(mockAudio.playIncorrect).not.toHaveBeenCalled();
  });

  it("input is locked during replay and unlocked after replay completes", () => {
    const scene = new MusicalMemoryScene();
    scene.create();
    fireAllDelayedCalls(scene);

    const frogs = getFrogs(scene);
    clearAudioMocks();

    const delayedCallsBefore = getMockFn(scene.time.delayedCall).mock.calls.length;

    // Start replay
    tapReplayButton(scene);

    // Tap while replay in progress (input locked)
    tapFrog(frogs, 1);
    expect(mockAudio.playFrogNote).not.toHaveBeenCalled();

    // Fire replay delayed calls (replay completes, input unlocked)
    fireDelayedCallsFrom(scene, delayedCallsBefore);

    // Clear replay notes to isolate the final tap
    clearAudioMocks();

    // Now tap should work
    tapFrog(frogs, 1);
    expect(mockAudio.playFrogNote).toHaveBeenCalledTimes(1);
  });

  it("creates frog touch targets meeting 64x64px minimum", () => {
    const scene = new MusicalMemoryScene();
    scene.create();

    const frogs = getFrogs(scene);
    expect(frogs).toHaveLength(3);

    for (const frog of frogs) {
      const setDisplaySizeCalls = getMockFn(frog.setDisplaySize).mock.calls;
      for (const call of setDisplaySizeCalls) {
        expect(call[0]).toBeGreaterThanOrEqual(64);
        expect(call[1]).toBeGreaterThanOrEqual(64);
      }
    }
  });
  it("emits a self-cleaning ripple ring when a frog is tapped", () => {
    const scene = new MusicalMemoryScene();
    scene.create();
    fireAllDelayedCalls(scene);

    const graphicsMock = getMockFn(scene.add.graphics);
    const graphicsCountBefore = graphicsMock.mock.results.length;

    const frogs = getFrogs(scene);
    tapFrog(frogs, 1);

    expect(graphicsMock.mock.results.length).toBeGreaterThan(graphicsCountBefore);
    const ripple = graphicsMock.mock.results[graphicsCountBefore]?.value as
      | Record<string, MockFn>
      | undefined;
    expect(ripple).toBeDefined();
    if (!ripple) return;
    expect(getMockFn(ripple.strokeCircle)).toHaveBeenCalled();

    const rippleTween = getMockFn(scene.tweens.add).mock.calls.find(
      (c) => c[0]?.targets === ripple && c[0]?.alpha === 0,
    );
    expect(rippleTween).toBeDefined();
    if (!rippleTween) return;
    expect(rippleTween[0].duration).toBe(400);
    const onComplete = (rippleTween[0] as { onComplete?: () => void }).onComplete;
    expect(onComplete).toEqual(expect.any(Function));
    onComplete?.();
    expect(getMockFn(ripple.destroy)).toHaveBeenCalledTimes(1);
  });

  it("uses reduced-motion ripple timing when requested", () => {
    vi.stubGlobal("window", { matchMedia: vi.fn(() => ({ matches: true })) });

    const scene = new MusicalMemoryScene();
    scene.create();
    fireAllDelayedCalls(scene);

    const graphicsMock = getMockFn(scene.add.graphics);
    const graphicsCountBefore = graphicsMock.mock.results.length;

    const frogs = getFrogs(scene);
    tapFrog(frogs, 1);

    const ripple = graphicsMock.mock.results[graphicsCountBefore]?.value as
      | Record<string, MockFn>
      | undefined;
    expect(ripple).toBeDefined();
    if (!ripple) return;

    const rippleTween = getMockFn(scene.tweens.add).mock.calls.find(
      (c) => c[0]?.targets === ripple && c[0]?.alpha === 0,
    );
    expect(rippleTween).toBeDefined();
    if (!rippleTween) return;
    expect(rippleTween[0].duration).toBe(240);
    expect(rippleTween[0].scaleX).toBe(1.3);
  });

  it("drifts lily pads gently with a looping tween", () => {
    const scene = new MusicalMemoryScene();
    scene.create();

    const imageMock = getMockFn(scene.add.image);
    const tweenCalls = getMockFn(scene.tweens.add).mock.calls;
    const frogY = (scene.cameras.main.centerY as number) + 30;

    let driftCount = 0;
    for (let i = 0; i < imageMock.mock.calls.length; i++) {
      if (imageMock.mock.calls[i][2] === "lilypad") {
        const pad = imageMock.mock.results[i].value as Record<string, MockFn>;
        const driftTween = tweenCalls.find((c) => c[0]?.targets === pad && c[0]?.repeat === -1);
        expect(driftTween).toBeDefined();
        if (!driftTween) continue;
        driftCount++;
        expect(driftTween[0].yoyo).toBe(true);
        expect(driftTween[0].y).toBe(frogY + 3);
        expect(driftTween[0].duration).toBe(1500);
      }
    }
    expect(driftCount).toBe(3);
  });

  it("skips lily pad drift under reduced motion", () => {
    vi.stubGlobal("window", { matchMedia: vi.fn(() => ({ matches: true })) });

    const scene = new MusicalMemoryScene();
    scene.create();

    const imageMock = getMockFn(scene.add.image);
    const tweenCalls = getMockFn(scene.tweens.add).mock.calls;
    for (let i = 0; i < imageMock.mock.calls.length; i++) {
      if (imageMock.mock.calls[i][2] === "lilypad") {
        const pad = imageMock.mock.results[i].value as Record<string, MockFn>;
        expect(tweenCalls.some((c) => c[0]?.targets === pad && c[0]?.repeat === -1)).toBe(false);
      }
    }
  });
});

describe("MusicalMemoryScene round progression and completion", () => {
  beforeEach(() => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /** Returns frog image objects in index order (0=green, 1=blue, 2=red). */
  function getFrogs(scene: unknown): Array<Record<string, MockFn>> {
    const add = (scene as { add: Record<string, unknown> }).add;
    const imageMock = getMockFn(add.image);
    const frogKeys = ["frog_green", "frog_blue", "frog_red"];
    const frogs: Array<Record<string, MockFn>> = [];
    for (let i = 0; i < imageMock.mock.calls.length; i++) {
      const key = imageMock.mock.calls[i][2] as string;
      const frogIndex = frogKeys.indexOf(key);
      if (frogIndex >= 0) {
        frogs[frogIndex] = imageMock.mock.results[i].value as Record<string, MockFn>;
      }
    }
    return frogs;
  }

  /** Returns progress dot circle objects in creation order. */
  function getProgressDots(scene: unknown): Array<Record<string, MockFn>> {
    const add = (scene as { add: Record<string, unknown> }).add;
    const circleMock = getMockFn(add.circle);
    return circleMock.mock.results.map((r) => r.value as Record<string, MockFn>);
  }

  /** Returns the back button text object. */
  function getBackButton(scene: unknown): Record<string, MockFn> | undefined {
    const add = (scene as { add: Record<string, unknown> }).add;
    const textMock = getMockFn(add.text);
    for (let i = 0; i < textMock.mock.calls.length; i++) {
      const text = textMock.mock.calls[i][2] as string;
      if (typeof text === "string" && text.includes("Back")) {
        return textMock.mock.results[i].value as Record<string, MockFn>;
      }
    }
    return undefined;
  }

  /** Fires delayedCall callbacks added at or after the given index, sorted by delay. */
  function fireDelayedCallsFrom(scene: unknown, startIndex: number): void {
    const delayedCallMock = getMockFn(
      (scene as { time: Record<string, unknown> }).time.delayedCall,
    );
    const calls = delayedCallMock.mock.calls
      .slice(startIndex)
      .sort((a, b) => (a[0] as number) - (b[0] as number));
    for (const call of calls) {
      if (typeof call[1] === "function") {
        (call[1] as () => void)();
      }
    }
  }

  /** Simulates a tap on a frog by triggering its pointerdown callback. */
  function tapFrog(frogs: Array<Record<string, MockFn>>, frogIndex: number): void {
    const frog = frogs[frogIndex];
    if (!frog) throw new Error(`Frog ${frogIndex} not found`);
    const onCalls = getMockFn(frog.on).mock.calls;
    const pointerdownCall = onCalls.find((c) => c[0] === "pointerdown");
    if (pointerdownCall && typeof pointerdownCall[1] === "function") {
      (pointerdownCall[1] as () => void)();
    }
  }

  /** Clears audio mock call data to isolate subsequent interactions. */
  function clearAudioMocks(): void {
    mockAudio.playFrogNote.mockClear();
    mockAudio.playCorrect.mockClear();
    mockAudio.playIncorrect.mockClear();
    mockAudio.playWin.mockClear();
    mockAudio.playSticker.mockClear();
  }

  /**
   * Completes one round: fires playback delayed calls (from firedUpTo),
   * clears audio, then taps the actual sequence notes `sequenceLength`
   * times (the run cap means sequences are no longer all-1). Returns the
   * delayed call count after firing playback (for use as the next firedUpTo).
   */
  function completeRound(
    scene: unknown,
    frogs: Array<Record<string, MockFn>>,
    firedUpTo: number,
    sequenceLength: number,
  ): number {
    fireDelayedCallsFrom(scene, firedUpTo);
    const newFiredUpTo = getMockFn((scene as { time: Record<string, unknown> }).time.delayedCall)
      .mock.calls.length;
    clearAudioMocks();
    const sequence = (scene as { sequence: number[] }).sequence;
    for (let i = 0; i < sequenceLength; i++) {
      tapFrog(frogs, sequence[i]);
    }
    return newFiredUpTo;
  }

  /** Completes all 5 rounds (lengths 2→6). Returns the final firedUpTo. */
  function completeAllRounds(scene: unknown, frogs: Array<Record<string, MockFn>>): number {
    let firedUpTo = 0;
    for (let len = 2; len <= 6; len++) {
      firedUpTo = completeRound(scene, frogs, firedUpTo, len);
    }
    return firedUpTo;
  }

  it("creates 5 progress dots at scene initialization", () => {
    const scene = new MusicalMemoryScene();
    scene.create();

    const dots = getProgressDots(scene);
    expect(dots).toHaveLength(5);
  });

  it("round success fills the next progress dot", () => {
    const scene = new MusicalMemoryScene();
    scene.create();
    const frogs = getFrogs(scene);
    const dots = getProgressDots(scene);

    completeRound(scene, frogs, 0, 2);

    expect(getMockFn(dots[0].setAlpha)).toHaveBeenCalledWith(1);
    expect(getMockFn(dots[1].setAlpha)).not.toHaveBeenCalledWith(1);
  });

  it("pops the progress dot with a scale bounce on round success", () => {
    const scene = new MusicalMemoryScene();
    scene.create();
    const frogs = getFrogs(scene);
    const dots = getProgressDots(scene);

    completeRound(scene, frogs, 0, 2);

    const popTween = getMockFn(scene.tweens.add).mock.calls.find(
      (c) => c[0]?.targets === dots[0] && c[0]?.scaleX === 1.4 && c[0]?.yoyo === true,
    );
    expect(popTween).toBeDefined();
    if (!popTween) return;
    expect(popTween[0].scaleY).toBe(1.4);
    expect(popTween[0].ease).toBe("Back.out");
    expect(popTween[0].duration).toBe(250);
  });

  it("uses a reduced-motion progress dot pop", () => {
    vi.stubGlobal("window", { matchMedia: vi.fn(() => ({ matches: true })) });

    const scene = new MusicalMemoryScene();
    scene.create();
    const frogs = getFrogs(scene);
    const dots = getProgressDots(scene);

    completeRound(scene, frogs, 0, 2);

    const popTween = getMockFn(scene.tweens.add).mock.calls.find((c) => c[0]?.targets === dots[0]);
    expect(popTween).toBeDefined();
    if (!popTween) return;
    expect(popTween[0].scaleX).toBe(1.2);
    expect(popTween[0].duration).toBe(150);
  });

  it("sequence grows by 1 on round success and the next round auto-plays", () => {
    const scene = new MusicalMemoryScene();
    scene.create();
    const frogs = getFrogs(scene);

    const firedUpTo = completeRound(scene, frogs, 0, 2);

    clearAudioMocks();
    fireDelayedCallsFrom(scene, firedUpTo);

    expect(mockAudio.playFrogNote).toHaveBeenCalledTimes(3);
  });

  it("completion is triggered only at length-6 (5th round)", () => {
    vi.mocked(hasSticker).mockReturnValue(false);

    const scene = new MusicalMemoryScene();
    scene.create();
    const frogs = getFrogs(scene);

    let firedUpTo = 0;
    for (let len = 2; len <= 5; len++) {
      clearAudioMocks();
      firedUpTo = completeRound(scene, frogs, firedUpTo, len);
    }
    expect(mockAudio.playWin).not.toHaveBeenCalled();

    clearAudioMocks();
    completeRound(scene, frogs, firedUpTo, 6);

    expect(mockAudio.playWin).toHaveBeenCalledTimes(1);
  });

  it("plays the choreographed win celebration on completion", () => {
    vi.mocked(hasSticker).mockReturnValue(false);

    const scene = new MusicalMemoryScene();
    scene.create();
    const frogs = getFrogs(scene);
    const initialGraphicsCount = getMockFn(scene.add.graphics).mock.results.length;

    completeAllRounds(scene, frogs);

    assertBoundedSuccessEffect(scene, initialGraphicsCount);
    assertWinCelebrationCreated(scene);
  });

  it("awards sticker on first completion only", () => {
    vi.mocked(hasSticker).mockReturnValue(false);

    const scene = new MusicalMemoryScene();
    scene.create();
    const frogs = getFrogs(scene);

    completeAllRounds(scene, frogs);

    expect(earnSticker).toHaveBeenCalledWith("musical-memory");
    expect(mockAudio.playSticker).toHaveBeenCalled();
  });

  it("does not re-award sticker when already earned", () => {
    vi.mocked(hasSticker).mockReturnValue(true);

    const scene = new MusicalMemoryScene();
    scene.create();
    const frogs = getFrogs(scene);

    completeAllRounds(scene, frogs);

    expect(earnSticker).not.toHaveBeenCalled();
    expect(mockAudio.playSticker).not.toHaveBeenCalled();
  });

  it("auto-returns to Hub after 3s delay on completion", () => {
    vi.mocked(hasSticker).mockReturnValue(false);

    const scene = new MusicalMemoryScene();
    scene.create();
    const frogs = getFrogs(scene);

    completeAllRounds(scene, frogs);

    const delayedCallMock = getMockFn(scene.time.delayedCall);
    const calls3000 = delayedCallMock.mock.calls.filter((call) => call[0] === 3000);
    expect(calls3000.length).toBeGreaterThan(0);

    const autoReturnCall = calls3000[calls3000.length - 1];
    const callback = autoReturnCall?.[1] as () => void;
    callback();
    completeFadeOuts(scene);

    expect(getMockFn(scene.scene.start)).toHaveBeenCalledWith("Hub", {
      justEarned: "musical-memory",
    });
  });

  it("re-launching after completion restarts playback and unlocks input", () => {
    const scene = new MusicalMemoryScene();
    scene.create();
    const frogs = getFrogs(scene);

    completeAllRounds(scene, frogs);
    expect((scene as unknown as { inputLocked: boolean }).inputLocked).toBe(true);

    // Returning to the Hub and tapping the tile again calls create() on the
    // same scene instance; playSequence re-locks during playback and
    // unlocks after the last note, so input recovers without extra resets.
    scene.create();
    const freshFrogs = getFrogs(scene);
    fireDelayedCallsFrom(scene, 0);

    expect((scene as unknown as { inputLocked: boolean }).inputLocked).toBe(false);
    const noteCallsBefore = mockAudio.playFrogNote.mock.calls.length;
    tapFrog(freshFrogs, 1);
    expect(mockAudio.playFrogNote.mock.calls.length).toBe(noteCallsBefore + 1);
  });

  it("parental lock exits to Hub at any time", () => {
    const scene = new MusicalMemoryScene();
    scene.create();

    const backButton = getBackButton(scene);
    if (!backButton) throw new Error("Back button not found");
    const onCalls = getMockFn(backButton.on).mock.calls;
    const pointerdownCall = onCalls.find((c) => c[0] === "pointerdown");
    if (pointerdownCall && typeof pointerdownCall[1] === "function") {
      (pointerdownCall[1] as () => void)();
    }

    const delayedCallMock = getMockFn(scene.time.delayedCall);
    const parentLockCall = delayedCallMock.mock.calls.find((call) => call[0] === 3000);
    expect(parentLockCall).toBeDefined();

    const callback = parentLockCall?.[1] as () => void;
    callback();
    completeFadeOuts(scene);

    expect(getMockFn(scene.scene.start)).toHaveBeenCalledWith("Hub");
  });
});
