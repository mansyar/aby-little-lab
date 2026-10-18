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

/** Spy on recordGameResult (calls through to the real implementation). */
const { mockRecordGameResult } = vi.hoisted(() => ({
  mockRecordGameResult: vi.fn(),
}));

vi.mock("../../utils/storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../utils/storage")>();
  mockRecordGameResult.mockImplementation((gameId: GameId, correct: number, wrong: number) => {
    actual.recordGameResult(gameId, correct, wrong);
  });
  return { ...actual, recordGameResult: mockRecordGameResult };
});

import { GameSceneBase } from "../../scenes/GameSceneBase";
import { earnSticker, hasSticker, updateSettings } from "../../utils/storage";

/**
 * Concrete test subclass exposing the protected scaffold methods so the
 * base-class behavior can be exercised directly.
 */
class TestScene extends GameSceneBase {
  constructor() {
    super("TestScene");
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

      const shutdownCall = getMockFn(scene.events.on).mock.calls.find((c) => c[0] === "shutdown");
      const handler = shutdownCall?.[1] as (() => void) | undefined;
      expect(handler).toBeDefined();
      handler?.();

      expect(getMockFn(glyph.destroy)).toHaveBeenCalled();
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

      const onMock = getMockFn(scene.events.on);
      const shutdownCall = onMock.mock.calls.find((c) => c[0] === "shutdown");
      expect(shutdownCall).toBeDefined();
      const handler = shutdownCall?.[1] as () => void;
      handler();

      expect(getMockFn(mockParentLockInstances[0]?.destroy)).toHaveBeenCalled();
      expect(getMockFn(speaker.destroy)).toHaveBeenCalled();
      // The mascot image is destroyed via the real Mascot class.
      const mascotImage = getMascotImage(scene);
      expect(getMockFn(mascotImage.destroy)).toHaveBeenCalled();
      expect(scene.getMascot()).toBeUndefined();
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

      const onMock = getMockFn(scene.events.on);
      const shutdownCall = onMock.mock.calls.find((c) => c[0] === "shutdown");
      expect(shutdownCall).toBeDefined();
      const handler = shutdownCall?.[1] as () => void;
      handler();

      expect(mockRecordGameResult).not.toHaveBeenCalled();
    });
  });
});
