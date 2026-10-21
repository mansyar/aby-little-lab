import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Mascot } from "../../components/Mascot";
import type { SpeakerButton } from "../../components/SpeakerButton";
import type { GameId } from "../../types";
import { type MatchMediaStub, stubMatchMedia } from "../helpers/matchMediaStub";
import type { MockObject } from "../helpers/phaserMock";

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
    setGameContext: vi.fn(),
    clearGameContext: vi.fn(),
  },
}));

vi.mock("../../audio/AudioManager", () => ({
  AudioManager: {
    getInstance: () => mockAudio,
  },
}));

/** Mock ParentLock so tests can drive the hold-to-exit flow directly. */
const { mockParentLockInstances, mockParentLockOptions, MockParentLock } = vi.hoisted(() => {
  const mockParentLockInstances: Array<Record<string, unknown>> = [];
  const mockParentLockOptions: Array<Record<string, unknown>> = [];
  class MockParentLock {
    destroy = vi.fn();

    constructor(...args: unknown[]) {
      mockParentLockInstances.push(this as unknown as Record<string, unknown>);
      mockParentLockOptions.push(args[0] as Record<string, unknown>);
    }
  }
  return { mockParentLockInstances, mockParentLockOptions, MockParentLock };
});

vi.mock("../../components/ParentLock", () => ({
  ParentLock: MockParentLock,
}));

/** Mock speech so instruction prompts can be asserted without Web Speech. */
const { mockSpeech } = vi.hoisted(() => ({
  mockSpeech: {
    isSpeechSupported: vi.fn(() => true),
    onSpeechLifecycle: vi.fn(() => vi.fn()),
    unlockSpeechForUserGesture: vi.fn(),
    speakLetter: vi.fn(() => true),
    speakWord: vi.fn(() => true),
    speakNumber: vi.fn(() => true),
    speakSentence: vi.fn(() => true),
    setPreferredVoiceURI: vi.fn(),
  },
}));

vi.mock("../../utils/speech", () => mockSpeech);

/** Spies on the storage writers (calls through to the real implementation). */
const { mockRecordGameResult, mockRecordGameTaps, storageHolder } = vi.hoisted(() => ({
  mockRecordGameResult: vi.fn(),
  mockRecordGameTaps: vi.fn(),
  storageHolder: { actual: undefined as undefined | typeof import("../../utils/storage") },
}));

vi.mock("../../utils/storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../utils/storage")>();
  storageHolder.actual = actual;
  return {
    ...actual,
    recordGameResult: mockRecordGameResult,
    recordGameTaps: mockRecordGameTaps,
  };
});

/**
 * Points the spies at the real storage writers. The suite restores all mocks
 * after every test, so the call-through is re-armed before each one.
 */
function spyThroughRealStorage(): void {
  mockRecordGameResult.mockImplementation((gameId: GameId, correct: number, wrong: number) => {
    storageHolder.actual?.recordGameResult(gameId, correct, wrong);
  });
  mockRecordGameTaps.mockImplementation((gameId: GameId, correct: number, wrong: number) => {
    storageHolder.actual?.recordGameTaps(gameId, correct, wrong);
  });
}

import { GameSceneBase } from "../../scenes/GameSceneBase";
import {
  earnSticker,
  getProgress,
  hasSticker,
  recordGamePlay,
  updateSettings,
} from "../../utils/storage";

/**
 * Every scene module, read as text.
 *
 * The shared wrong-answer reaction must exist in exactly one place, so the
 * check reads the sources instead of the runtime: a second call site is a
 * second implementation, even when only one of them runs in a given test.
 */
const SCENE_SOURCES: Readonly<Record<string, string>> = import.meta.glob<string>(
  "../../scenes/*.ts",
  { query: "?raw", import: "default", eager: true },
);

/**
 * Concrete test subclass exposing the protected scaffold methods so the
 * base-class behavior can be exercised directly.
 */
class TestScene extends GameSceneBase {
  constructor(sceneKey = "TestScene") {
    super(sceneKey);
  }

  testCreateBackButton(): Phaser.GameObjects.Text {
    return this.createBackButton();
  }

  testCreateCornerMascot(): Mascot {
    return this.createCornerMascot();
  }

  testCreateProgressDots(count: number): void {
    this.createProgressDots(count);
  }

  testFillProgressDot(index: number): void {
    this.fillProgressDot(index);
  }

  testCompleteGame(gameId: GameId): void {
    this.completeGame(gameId);
  }

  testCreateStickerAnimation(stickerKey: string): void {
    this.createStickerAnimation(stickerKey);
  }

  testCreateSpokenInstruction(
    text: string,
    options?: { x?: number; y?: number },
  ): Phaser.GameObjects.Text {
    return this.createSpokenInstruction(text, options);
  }

  testRegisterShutdownCleanup(): void {
    this.registerShutdownCleanup();
  }

  testSetSpeaker(speaker: SpeakerButton): void {
    this.speaker = speaker;
  }

  testRecordCorrect(): void {
    this.recordCorrect();
  }

  testRecordWrong(): void {
    this.recordWrong();
  }

  testReactWrong(targets?: Phaser.GameObjects.GameObject[], onComplete?: () => void): void {
    this.reactWrong(targets, onComplete);
  }

  getDots(): Phaser.GameObjects.Arc[] {
    return this.progressDots;
  }

  getMascot(): Mascot | undefined {
    return this.mascot;
  }

  getInputLocked(): boolean {
    return this.inputLocked;
  }
}

/** Casts a Phaser-typed method to a MockFn for mock assertions. */
function getMockFn(fn: unknown): MockFn {
  return fn as unknown as MockFn;
}

/**
 * Finds the scene's registered "shutdown" handler, whichever registration it
 * used: a per-visit cleanup is registered with `once`, a lasting listener with
 * `on`.
 */
function shutdownHandler(scene: unknown): (() => void) | undefined {
  const events = (scene as { events: Record<string, MockFn> }).events;
  for (const register of [events.on, events.once]) {
    const call = getMockFn(register).mock.calls.find((c) => c[0] === "shutdown");
    if (call?.[1]) return call[1] as () => void;
  }
  return undefined;
}

/** Counts the handlers still attached to `event` on the scene's event emitter. */
function liveHandlerCount(scene: unknown, event: string): number {
  return (
    scene as unknown as { liveEventHandlerCount(event: string): number }
  ).liveEventHandlerCount(event);
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

/** Returns the mascot image object (created with the mascot_idle texture). */
function getMascotImage(scene: unknown): Record<string, MockFn> {
  const imageMock = getMockFn((scene as { add: Record<string, unknown> }).add.image);
  const index = imageMock.mock.calls.findIndex((call) => call[2] === "mascot_idle");
  return imageMock.mock.results[index].value as Record<string, MockFn>;
}

describe("GameSceneBase scaffold", () => {
  let matchMediaMock: MatchMediaStub;

  beforeEach(() => {
    matchMediaMock = stubMatchMedia(false);
    localStorage.clear();
    mockParentLockInstances.length = 0;
    mockParentLockOptions.length = 0;
    spyThroughRealStorage();
    for (const fn of Object.values(mockAudio)) {
      fn.mockClear();
    }
    for (const fn of Object.values(mockSpeech)) {
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

  describe("createBackButton", () => {
    it("creates the back text with a 96px hit area and ParentLock that returns to Hub", () => {
      const scene = new TestScene();
      scene.testCreateBackButton();

      const textMock = getMockFn(scene.add.text);
      expect(textMock).toHaveBeenCalledWith(20, 20, "← Back", expect.anything());
      const button = textMock.mock.results[0].value as Record<string, MockFn>;
      expect(getMockFn(button.setInteractive)).toHaveBeenCalledWith(
        expect.objectContaining({ hitArea: expect.any(Object) }),
      );

      expect(mockParentLockOptions).toHaveLength(1);
      expect(mockParentLockOptions[0]?.target).toBe(button);
      const onSuccess = mockParentLockOptions[0]?.onSuccess as () => void;
      onSuccess();

      // ParentLock success triggers the fade-out transition to the Hub.
      const fadeOutMock = getMockFn(scene.cameras.main.fadeOut);
      const fadeOutCall = fadeOutMock.mock.calls.at(-1);
      if (fadeOutCall && typeof fadeOutCall[4] === "function") {
        (fadeOutCall[4] as () => void)();
      }
      expect(getMockFn(scene.scene.start)).toHaveBeenCalledWith("Hub");
    });

    it("attaches press feedback to the back button", () => {
      const scene = new TestScene();
      scene.testCreateBackButton();
      const textMock = getMockFn(scene.add.text);
      const button = textMock.mock.results[0].value as Record<string, MockFn>;
      expect(getMockFn(button.on)).toHaveBeenCalledWith("pointerdown", expect.any(Function));
      expect(getMockFn(button.on)).toHaveBeenCalledWith("pointerup", expect.any(Function));
    });
  });

  describe("createCornerMascot", () => {
    it("places Professor Hoot in the bottom-right corner", () => {
      const scene = new TestScene();
      const mascot = scene.testCreateCornerMascot();

      expect(mascot).toBeDefined();
      expect(scene.getMascot()).toBe(mascot);
      const imageMock = getMockFn(scene.add.image);
      const call = imageMock.mock.calls.find((c) => c[2] === "mascot_idle");
      expect(call).toBeDefined();
      // Corner placement: 1024 - 90 margin, 768 - 90 margin.
      expect(call?.[0]).toBe(1024 - 90);
      expect(call?.[1]).toBe(768 - 90);
    });
  });

  describe("createProgressDots", () => {
    it("creates the requested number of dim dots centered at the top", () => {
      const scene = new TestScene();
      scene.testCreateProgressDots(6);

      const circleMock = getMockFn(scene.add.circle);
      expect(circleMock.mock.calls).toHaveLength(6);
      // startX = 512 - ((6 - 1) * 40) / 2 = 412.
      expect(circleMock.mock.calls[0]?.[0]).toBeCloseTo(412);
      expect(circleMock.mock.calls[0]?.[1]).toBe(60);
      expect(circleMock.mock.calls[0]?.[2]).toBe(8);
      expect(circleMock.mock.calls[0]?.[3]).toBe(0x2d3748);
      expect(circleMock.mock.calls[0]?.[4]).toBe(0.3);
      expect(circleMock.mock.calls[1]?.[0]).toBeCloseTo(452);
      expect(scene.getDots()).toHaveLength(6);
    });

    it("supports a custom dot count (e.g. Musical Memory's 5)", () => {
      const scene = new TestScene();
      scene.testCreateProgressDots(5);
      expect(scene.getDots()).toHaveLength(5);
      expect(getMockFn(scene.add.circle).mock.calls).toHaveLength(5);
    });

    it("replaces the previous visit's dots so a second visit fills its own dot", () => {
      const scene = new TestScene();
      scene.testRegisterShutdownCleanup();

      // First visit.
      scene.testCreateProgressDots(3);
      const firstVisitDots = [...scene.getDots()];
      expect(firstVisitDots).toHaveLength(3);

      // Phaser destroys the display list when the scene shuts down, but the
      // scene instance is reused on the next visit.
      scene.events.emit("shutdown");

      // Second visit on the same instance.
      scene.testCreateProgressDots(3);
      const secondVisitDots = [...scene.getDots()];

      // The tracked set holds only this visit's dots: the previous visit's
      // dots were destroyed with the display list.
      expect(scene.getDots()).toHaveLength(3);
      expect(scene.getDots()).not.toContain(firstVisitDots[0]);

      // The fill lands on this visit's first dot, never on the stale one.
      scene.testFillProgressDot(0);
      expect(getMockFn(secondVisitDots[0].setAlpha)).toHaveBeenCalledWith(1);
      expect(getMockFn(firstVisitDots[0].setAlpha)).not.toHaveBeenCalled();

      // The next visit registers its own shutdown cleanup, which releases the
      // dots so the scene holds no references to destroyed objects.
      scene.testRegisterShutdownCleanup();
      scene.events.emit("shutdown");
      expect(scene.getDots()).toHaveLength(0);
    });
  });

  describe("fillProgressDot", () => {
    it("fills the dot and pops it with a Back.out yoyo tween", () => {
      const scene = new TestScene();
      scene.testCreateProgressDots(3);
      scene.testFillProgressDot(1);

      const dot = scene.getDots()[1];
      expect(getMockFn(dot.setAlpha)).toHaveBeenCalledWith(1);
      const popTween = getMockFn(scene.tweens.add).mock.calls.find((call) => {
        const t = call[0]?.targets;
        return (Array.isArray(t) ? t.includes(dot) : t === dot) && call[0]?.scaleX === 1.4;
      });
      expect(popTween).toBeDefined();
      expect(popTween?.[0].scaleY).toBe(1.4);
      expect(popTween?.[0].duration).toBe(250);
      expect(popTween?.[0].ease).toBe("Back.out");
      expect(popTween?.[0].yoyo).toBe(true);
    });

    it("uses reduced-motion scale and duration when requested", () => {
      setReducedMotion(true);
      const scene = new TestScene();
      scene.testCreateProgressDots(1);
      scene.testFillProgressDot(0);

      const popTween = getMockFn(scene.tweens.add).mock.calls.find((call) => {
        const t = call[0]?.targets;
        return Array.isArray(t) ? t.includes(scene.getDots()[0]) : t === scene.getDots()[0];
      });
      expect(popTween).toBeDefined();
      expect(popTween?.[0].scaleX).toBe(1.2);
      expect(popTween?.[0].scaleY).toBe(1.2);
      expect(popTween?.[0].duration).toBe(150);
    });
  });

  describe("completeGame", () => {
    it("plays the win, cheers, celebrates, earns the sticker, and auto-returns with justEarned", () => {
      expect(hasSticker("more-less")).toBe(false);
      const scene = new TestScene();
      scene.testCreateCornerMascot();
      scene.testCompleteGame("more-less");

      expect(getMockFn(mockAudio.playWin)).toHaveBeenCalled();
      expect(scene.getInputLocked()).toBe(true);
      // Professor Hoot cheers big (celebrate texture).
      const mascotImage = getMascotImage(scene);
      expect(getMockFn(mascotImage.setTexture)).toHaveBeenCalledWith("mascot_celebrate");
      // Win celebration ray burst graphics.
      expect(getMockFn(scene.add.graphics).mock.calls.length).toBeGreaterThan(0);
      // Sticker earned + revealed with the derived texture key.
      expect(hasSticker("more-less")).toBe(true);
      expect(getMockFn(mockAudio.playSticker)).toHaveBeenCalled();
      const imageMock = getMockFn(scene.add.image);
      const stickerCall = imageMock.mock.calls.find((c) => c[2] === "sticker_more_less");
      expect(stickerCall).toBeDefined();
      const stickerIndex = imageMock.mock.calls.findIndex((c) => c[2] === "sticker_more_less");
      const stickerImage = imageMock.mock.results[stickerIndex].value as Record<string, MockFn>;
      expect(getMockFn(stickerImage.setScale)).toHaveBeenCalledWith(0);
      const revealTween = getMockFn(scene.tweens.add).mock.calls.find((call) => {
        const t = call[0]?.targets;
        return (
          (Array.isArray(t) ? t.includes(stickerImage) : t === stickerImage) &&
          call[0]?.scaleX === 1
        );
      });
      expect(revealTween).toBeDefined();
      expect(revealTween?.[0].delay).toBe(400);
      expect(revealTween?.[0].ease).toBe("Back.out");
      // Auto-return after 3s carries justEarned so the Hub celebrates it.
      fireAutoReturn(scene);
      expect(getMockFn(scene.scene.start)).toHaveBeenCalledWith("Hub", {
        justEarned: "more-less",
      });
    });

    it("skips the sticker path when already earned and auto-returns without justEarned", () => {
      earnSticker("more-less");
      const scene = new TestScene();
      scene.testCompleteGame("more-less");

      expect(getMockFn(mockAudio.playWin)).toHaveBeenCalled();
      expect(getMockFn(mockAudio.playSticker)).not.toHaveBeenCalled();
      const imageMock = getMockFn(scene.add.image);
      expect(imageMock.mock.calls.some((c) => c[2] === "sticker_more_less")).toBe(false);
      fireAutoReturn(scene);
      expect(getMockFn(scene.scene.start)).toHaveBeenCalledWith("Hub");
    });

    it("derives the sticker texture key for other games (e.g. first-sounds)", () => {
      const scene = new TestScene();
      scene.testCompleteGame("first-sounds");
      const imageMock = getMockFn(scene.add.image);
      expect(imageMock.mock.calls.some((c) => c[2] === "sticker_first_sounds")).toBe(true);
    });

    it("derives the reveal scale from the passed sticker texture's tier", () => {
      const scene = new TestScene();
      // "mascot_hoot" is a hero-tier key (512 px raster); a correct derivation
      // scales 256 px display to 0.5, not the legacy constant 1.0.
      scene.testCreateStickerAnimation("mascot_hoot");
      const imageMock = getMockFn(scene.add.image);
      const created = imageMock.mock.results.at(-1)?.value as Record<string, MockFn>;
      expect(getMockFn(created.setScale)).toHaveBeenCalledWith(0);
      const revealTween = getMockFn(scene.tweens.add).mock.calls.find((call) => {
        const t = call[0]?.targets;
        return Array.isArray(t) ? t.includes(created) : t === created;
      });
      expect(revealTween).toBeDefined();
      expect(revealTween?.[0].scaleX).toBeCloseTo(0.5);
      expect(revealTween?.[0].scaleY).toBeCloseTo(0.5);
    });
  });

  describe("createSpokenInstruction", () => {
    const COPY = "Drag each shape into its hole.";

    /** Returns the add.* mock for a factory name (text/image/...). */
    function addMock(scene: unknown, factory: "text" | "image"): MockFn {
      return getMockFn((scene as { add: Record<string, unknown> }).add[factory]);
    }

    /** Returns the speaker glyph created for the instruction line. */
    function instructionGlyph(scene: unknown): Record<string, MockFn> {
      const imageMock = addMock(scene, "image");
      const index = imageMock.mock.calls.findIndex((call) => call[2] === "icon_speaker");
      expect(index).toBeGreaterThanOrEqual(0);
      return imageMock.mock.results[index].value as Record<string, MockFn>;
    }

    /** Taps the speaker glyph, firing every pointerdown handler like Phaser does. */
    function tapGlyph(scene: unknown): void {
      const glyph = instructionGlyph(scene) as unknown as MockObject;
      const handlers = glyph.allHandlers.filter((entry) => entry.name === "pointerdown");
      expect(handlers.length).toBeGreaterThan(0);
      for (const entry of handlers) {
        entry.cb();
      }
    }

    it("renders the prompt line with the copy at the default band", () => {
      const scene = new TestScene();
      scene.testCreateSpokenInstruction(COPY);

      const textMock = addMock(scene, "text");
      const call = textMock.mock.calls.at(-1);
      expect(call?.[0]).toBe(512);
      expect(call?.[1]).toBe(112);
      expect(call?.[2]).toBe(COPY);
      const label = textMock.mock.results.at(-1)?.value as Record<string, MockFn>;
      expect(getMockFn(label.setOrigin)).toHaveBeenCalledWith(0.5);

      const glyph = instructionGlyph(scene);
      const imageMock = addMock(scene, "image");
      const glyphCall = imageMock.mock.calls.find((c) => c[2] === "icon_speaker");
      expect(glyphCall?.[0]).toBe(858);
      expect(glyphCall?.[1]).toBe(112);
      expect(getMockFn(glyph.setDisplaySize)).toHaveBeenCalledWith(96, 96);
    });

    it("speaks the instruction once when the round is set up", () => {
      const scene = new TestScene();
      scene.testCreateSpokenInstruction(COPY);

      expect(mockSpeech.speakSentence).toHaveBeenCalledTimes(1);
      expect(mockSpeech.speakSentence).toHaveBeenCalledWith(COPY, true);
    });

    it("stays silent and dims the glyph when the SFX toggle is off", () => {
      updateSettings({ sfxEnabled: false });
      const scene = new TestScene();
      scene.testCreateSpokenInstruction(COPY);

      expect(mockSpeech.speakSentence).toHaveBeenCalledWith(COPY, false);
      const glyph = instructionGlyph(scene);
      expect(getMockFn(glyph.setTint)).toHaveBeenCalledWith(0xa0aec0);
      expect(getMockFn(glyph.setAlpha)).toHaveBeenCalledWith(0.6);
    });

    it("replays the instruction and re-reads the SFX setting on tap", () => {
      const scene = new TestScene();
      scene.testCreateSpokenInstruction(COPY);
      expect(mockSpeech.speakSentence).toHaveBeenCalledTimes(1);

      // The parent can flip the toggle between rounds; the replay honours it.
      updateSettings({ sfxEnabled: false });
      tapGlyph(scene);

      expect(mockSpeech.speakSentence).toHaveBeenCalledTimes(2);
      expect(mockSpeech.speakSentence).toHaveBeenLastCalledWith(COPY, false);
    });

    it("honours per-game x and y overrides for the line and the glyph", () => {
      const scene = new TestScene();
      scene.testCreateSpokenInstruction(COPY, { x: 300, y: 220 });

      const textCall = addMock(scene, "text").mock.calls.at(-1);
      expect(textCall?.[0]).toBe(300);
      expect(textCall?.[1]).toBe(220);

      const glyphCall = addMock(scene, "image").mock.calls.find((c) => c[2] === "icon_speaker");
      expect(glyphCall?.[0]).toBe(646);
      expect(glyphCall?.[1]).toBe(220);
    });

    it("destroys the speaker glyph on shutdown", () => {
      const scene = new TestScene();
      scene.testCreateSpokenInstruction(COPY);
      const glyph = instructionGlyph(scene);
      scene.testRegisterShutdownCleanup();

      const handler = shutdownHandler(scene);
      expect(handler).toBeDefined();
      handler?.();

      expect(getMockFn(glyph.destroy)).toHaveBeenCalled();
    });

    it("replaces the previous prompt when called again on the same scene", () => {
      const scene = new TestScene();
      scene.testCreateSpokenInstruction(COPY);
      const firstLabel = addMock(scene, "text").mock.results[0]?.value as MockObject;
      const firstGlyph = instructionGlyph(scene);

      scene.testCreateSpokenInstruction("A different rule.");

      expect(getMockFn(firstLabel.destroy)).toHaveBeenCalled();
      expect(getMockFn(firstGlyph.destroy)).toHaveBeenCalled();
      expect(
        addMock(scene, "text").mock.calls.filter((c) => c[2] === "A different rule."),
      ).toHaveLength(1);
    });
  });

  describe("registerShutdownCleanup", () => {
    it("destroys parentLock, mascot, and speaker on shutdown", () => {
      const scene = new TestScene();
      scene.testCreateBackButton();
      scene.testCreateCornerMascot();
      const speaker = { destroy: vi.fn() } as unknown as SpeakerButton;
      scene.testSetSpeaker(speaker);
      scene.testRegisterShutdownCleanup();

      const handler = shutdownHandler(scene);
      expect(handler).toBeDefined();
      handler?.();

      expect(getMockFn(mockParentLockInstances[0]?.destroy)).toHaveBeenCalled();
      expect(getMockFn(speaker.destroy)).toHaveBeenCalled();
      // The mascot image is destroyed via the real Mascot class.
      const mascotImage = getMascotImage(scene);
      expect(getMockFn(mascotImage.destroy)).toHaveBeenCalled();
      expect(scene.getMascot()).toBeUndefined();
    });

    it("registers the cleanup once per visit and leaves no handler behind", () => {
      const scene = new TestScene();

      scene.testRegisterShutdownCleanup();
      expect(liveHandlerCount(scene, "shutdown")).toBe(1);

      scene.events.emit("shutdown");

      // The handler that has already run is gone, so the next visit adds one
      // entry instead of stacking on top of the one it already ran.
      expect(liveHandlerCount(scene, "shutdown")).toBe(0);

      scene.testRegisterShutdownCleanup();
      expect(liveHandlerCount(scene, "shutdown")).toBe(1);

      scene.events.emit("shutdown");
      expect(liveHandlerCount(scene, "shutdown")).toBe(0);
    });
  });

  describe("session progress recording", () => {
    beforeEach(() => {
      mockRecordGameResult.mockClear();
    });

    it("flushes accumulated correct and wrong taps as a win on completion", () => {
      const scene = new TestScene();
      scene.testRecordCorrect();
      scene.testRecordCorrect();
      scene.testRecordWrong();
      scene.testCompleteGame("shape-sorter");

      expect(mockRecordGameResult).toHaveBeenCalledTimes(1);
      expect(mockRecordGameResult).toHaveBeenCalledWith("shape-sorter", 2, 1);
    });

    it("flushes zeroed counters when the game is completed without taps", () => {
      const scene = new TestScene();
      scene.testCompleteGame("color-match");

      expect(mockRecordGameResult).toHaveBeenCalledWith("color-match", 0, 0);
    });

    it("resets the session counters after flushing", () => {
      const scene = new TestScene();
      scene.testRecordCorrect();
      scene.testCompleteGame("shape-sorter");
      scene.testCompleteGame("shape-sorter");

      expect(mockRecordGameResult).toHaveBeenNthCalledWith(1, "shape-sorter", 1, 0);
      expect(mockRecordGameResult).toHaveBeenNthCalledWith(2, "shape-sorter", 0, 0);
    });

    it("does not flush results when the scene shuts down without completing", () => {
      const scene = new TestScene();
      scene.testRecordCorrect();
      scene.testRegisterShutdownCleanup();

      const handler = shutdownHandler(scene);
      expect(handler).toBeDefined();
      handler?.();

      expect(mockRecordGameResult).not.toHaveBeenCalled();
    });
  });

  describe("abandoned session flush", () => {
    beforeEach(() => {
      mockRecordGameResult.mockClear();
      mockRecordGameTaps.mockClear();
    });

    it("resolves the game id from the registry and flushes the pending taps on shutdown", () => {
      const scene = new TestScene("ShapeSorter");
      scene.init();
      scene.testRecordCorrect();
      scene.testRecordCorrect();
      scene.testRecordWrong();

      scene.events.emit("shutdown");

      expect(mockRecordGameTaps).toHaveBeenCalledTimes(1);
      expect(mockRecordGameTaps).toHaveBeenCalledWith("shape-sorter", 2, 1);
    });

    it("folds the abandoned taps into the rolling window and nothing else", () => {
      // A completed session before this one: its cumulative counters stay.
      mockRecordGameResult("shape-sorter", 5, 1);
      recordGamePlay("shape-sorter");

      const scene = new TestScene("ShapeSorter");
      scene.init();
      scene.testRecordCorrect();
      scene.testRecordCorrect();
      scene.testRecordWrong();

      scene.events.emit("shutdown");

      const progress = getProgress()["shape-sorter"];
      // The window grew by the abandoned session's three taps.
      expect(progress.recent).toEqual([true, true, true, true, true, false, true, true, false]);
      // The cumulative counters, the win count and the play count did not.
      expect(progress.correct).toBe(5);
      expect(progress.wrong).toBe(1);
      expect(progress.wins).toBe(1);
      expect(progress.plays).toBe(1);
    });

    it("zeroes the session counters so the next visit reports only its own taps", () => {
      const scene = new TestScene("ShapeSorter");
      scene.init();
      scene.testRecordCorrect();
      scene.testRecordCorrect();
      scene.testRecordWrong();

      scene.events.emit("shutdown");
      expect(mockRecordGameTaps).toHaveBeenCalledWith("shape-sorter", 2, 1);

      // Second visit on the same scene instance: Phaser reuses it.
      scene.init();
      scene.testRecordCorrect();
      scene.testCompleteGame("shape-sorter");

      expect(mockRecordGameResult).toHaveBeenCalledWith("shape-sorter", 1, 0);
    });

    it("writes nothing at shutdown when the session was completed", () => {
      const scene = new TestScene("ShapeSorter");
      scene.init();
      scene.testRecordCorrect();
      scene.testCompleteGame("shape-sorter");

      scene.events.emit("shutdown");

      expect(mockRecordGameResult).toHaveBeenCalledWith("shape-sorter", 1, 0);
      // The completed session already flushed its own taps: no second write.
      expect(mockRecordGameTaps).not.toHaveBeenCalled();
    });

    it("writes nothing at shutdown when the session recorded no taps", () => {
      const scene = new TestScene("ShapeSorter");
      scene.init();

      scene.events.emit("shutdown");

      expect(mockRecordGameTaps).not.toHaveBeenCalled();
    });

    it("writes nothing for a scene key that is not in the registry", () => {
      const scene = new TestScene("TestScene");
      scene.init();
      scene.testRecordCorrect();

      scene.events.emit("shutdown");

      expect(mockRecordGameTaps).not.toHaveBeenCalled();
    });
  });

  describe("reactWrong", () => {
    beforeEach(() => {
      mockRecordGameResult.mockClear();
    });

    /** Returns the first tween call carrying the helper's numeric wiggle angle. */
    function wiggleTween(scene: unknown): Record<string, unknown> | undefined {
      const calls = getMockFn((scene as { tweens: Record<string, unknown> }).tweens.add).mock
        .calls as Array<Array<Record<string, unknown>>>;
      return calls.find((call) => typeof call[0]?.angle === "number")?.[0];
    }

    it("plays the gentle incorrect tone, records the wrong answer, and nods Professor Hoot", () => {
      const scene = new TestScene();
      const mascot = scene.testCreateCornerMascot();
      const nodSpy = vi.spyOn(mascot, "nod");

      scene.testReactWrong();

      expect(getMockFn(mockAudio.playIncorrect)).toHaveBeenCalledTimes(1);
      expect(nodSpy).toHaveBeenCalledTimes(1);
      // No targets, no wiggle — the tone + nod reaction runs on its own.
      expect(wiggleTween(scene)).toBeUndefined();
    });

    it("stays gentle when no mascot exists", () => {
      const scene = new TestScene();

      scene.testReactWrong();

      expect(getMockFn(mockAudio.playIncorrect)).toHaveBeenCalledTimes(1);
      expect(wiggleTween(scene)).toBeUndefined();
    });

    it("wiggles the given targets with the shared wiggle", () => {
      const scene = new TestScene();
      const target = { x: 0 } as unknown as Phaser.GameObjects.GameObject;

      scene.testReactWrong([target]);

      const wiggle = wiggleTween(scene);
      expect(wiggle).toBeDefined();
      expect(wiggle?.angle).toBe(4);
      expect(wiggle?.duration).toBe(350);
      expect(wiggle?.yoyo).toBe(true);
      expect(wiggle?.repeat).toBe(3);
      expect(wiggle?.ease).toBe("Sine.inOut");
      // The wiggle must never count as a penalty: no input lock either way.
      expect(scene.getInputLocked()).toBe(false);
    });

    it("degrades the wiggle to the reduced-motion angle and duration", () => {
      setReducedMotion(true);
      const scene = new TestScene();
      const target = { x: 0 } as unknown as Phaser.GameObjects.GameObject;

      scene.testReactWrong([target]);

      const wiggle = wiggleTween(scene);
      expect(wiggle?.angle).toBe(2);
      expect(wiggle?.duration).toBe(200);
    });

    it("keeps custom wrong paths authoritative — overrides never route through the helper", () => {
      // Mirrors games that own their reaction (e.g. Feelings Faces' onWrong
      // override): the shared helper only fires when a scene invokes it.
      class CustomScene extends TestScene {
        onWrong(): void {
          this.recordWrong();
        }
      }
      const scene = new CustomScene();
      scene.testCreateCornerMascot();

      scene.onWrong();

      expect(getMockFn(mockAudio.playIncorrect)).not.toHaveBeenCalled();
      expect(wiggleTween(scene)).toBeUndefined();
      // The custom path still counts the wrong answer toward learning progress.
      scene.testCompleteGame("shape-sorter");
      expect(mockRecordGameResult).toHaveBeenCalledWith("shape-sorter", 0, 1);
    });

    it("hands the completion callback to the wiggle tween", () => {
      const scene = new TestScene();
      const target = { x: 0 } as unknown as Phaser.GameObjects.GameObject;
      const onComplete = vi.fn();

      scene.testReactWrong([target], onComplete);

      const wiggle = wiggleTween(scene);
      expect(wiggle?.onComplete).toBe(onComplete);
      expect(onComplete).not.toHaveBeenCalled();
    });

    it("releases the completion callback even when there is nothing to wiggle", () => {
      const scene = new TestScene();
      const onComplete = vi.fn();

      scene.testReactWrong(undefined, onComplete);

      // Nothing wiggles, but the completion is still released: a game that
      // unlocks its input from it must never stay locked.
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe("game context registration", () => {
    it("registers the game context for a registered scene key on init", () => {
      const scene = new TestScene("ShapeSorter");

      scene.init();

      expect(mockAudio.setGameContext).toHaveBeenCalledWith("shape-sorter");
    });

    it("does not register a context for keys outside the registry", () => {
      const scene = new TestScene();

      scene.init();

      expect(mockAudio.setGameContext).not.toHaveBeenCalled();
    });

    it("clears the context when the scene shuts down", () => {
      const scene = new TestScene("ShapeSorter");
      scene.init();

      scene.events.emit("shutdown");

      expect(mockAudio.clearGameContext).toHaveBeenCalledTimes(1);
    });
  });
});

describe("the shared wrong-answer reaction", () => {
  it("calls playIncorrect from exactly one place in src/scenes", () => {
    const callSites = Object.entries(SCENE_SOURCES)
      .map(([path, source]) => ({
        file: path.slice(path.lastIndexOf("/") + 1),
        calls: source.split("playIncorrect(").length - 1,
      }))
      .filter((entry) => entry.calls > 0);

    expect(callSites).toEqual([{ file: "GameSceneBase.ts", calls: 1 }]);
  });
});
