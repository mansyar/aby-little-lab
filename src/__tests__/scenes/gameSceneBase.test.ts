import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SpeakerButton } from "../../components/SpeakerButton";
import type { GameId } from "../../types";

type MockFn = ReturnType<typeof vi.fn>;

/**
 * Mock Phaser module. Scene files extend Phaser.Scene, which at runtime
 * resolves to MockScene. Each instance gets fresh mock methods in the
 * constructor, enabling per-test isolation.
 */
vi.mock("phaser", () => {
  /** Creates a mock game object with chainable methods used by Phaser scenes. */
  function createMockGameObject(scene?: unknown): Record<string, MockFn> {
    return {
      setInteractive: vi.fn().mockReturnThis(),
      disableInteractive: vi.fn(),
      on: vi.fn().mockReturnThis(),
      off: vi.fn().mockReturnThis(),
      setOrigin: vi.fn().mockReturnThis(),
      setScale: vi.fn().mockReturnThis(),
      setTexture: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
      setStyle: vi.fn().mockReturnThis(),
      setFontSize: vi.fn().mockReturnThis(),
      setText: vi.fn().mockReturnThis(),
      setColor: vi.fn().mockReturnThis(),
      setVisible: vi.fn().mockReturnThis(),
      setAlpha: vi.fn().mockReturnThis(),
      setPosition: vi.fn().mockReturnThis(),
      setSize: vi.fn().mockReturnThis(),
      setDisplaySize: vi.fn().mockReturnThis(),
      setStrokeStyle: vi.fn().mockReturnThis(),
      setFillStyle: vi.fn().mockReturnThis(),
      setVelocity: vi.fn().mockReturnThis(),
      setCollideWorldBounds: vi.fn().mockReturnThis(),
      setBounce: vi.fn().mockReturnThis(),
      setCircle: vi.fn().mockReturnThis(),
      fillStyle: vi.fn().mockReturnThis(),
      fillCircle: vi.fn().mockReturnThis(),
      slice: vi.fn().mockReturnThis(),
      fillPath: vi.fn().mockReturnThis(),
      clear: vi.fn().mockReturnThis(),
      getCenter: vi.fn(() => ({ x: 0, y: 0 })),
      beginPath: vi.fn().mockReturnThis(),
      moveTo: vi.fn().mockReturnThis(),
      lineTo: vi.fn().mockReturnThis(),
      strokePath: vi.fn().mockReturnThis(),
      lineStyle: vi.fn().mockReturnThis(),
      strokeRect: vi.fn().mockReturnThis(),
      strokeCircle: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
      scaleX: 1,
      scaleY: 1,
      scene,
    };
  }

  class MockScene {
    add!: Record<string, MockFn>;
    scene!: Record<string, MockFn>;
    load!: Record<string, MockFn>;
    input!: Record<string, MockFn>;
    cameras!: {
      main: Record<string, MockFn> & {
        centerX: number;
        centerY: number;
        width: number;
        height: number;
      };
    };
    scale!: Record<string, MockFn> & { width: number; height: number };
    time!: Record<string, MockFn>;
    tweens!: Record<string, MockFn>;
    sys!: { events: Record<string, MockFn> };
    events!: Record<string, MockFn>;
    children!: Record<string, MockFn>;
    physics!: { add: Record<string, MockFn>; world: Record<string, MockFn> };

    constructor() {
      this.add = {
        rectangle: vi.fn(() => createMockGameObject(this)),
        text: vi.fn(() => createMockGameObject(this)),
        image: vi.fn(() => createMockGameObject(this)),
        container: vi.fn(() => createMockGameObject(this)),
        circle: vi.fn(() => createMockGameObject(this)),
        graphics: vi.fn(() => createMockGameObject(this)),
        zone: vi.fn(() => createMockGameObject(this)),
        particles: vi.fn(() => createMockGameObject(this)),
      };
      this.scene = {
        start: vi.fn(),
        stop: vi.fn(),
        launch: vi.fn(),
        get: vi.fn(),
        switch: vi.fn(),
        sleep: vi.fn(),
        wake: vi.fn(),
        pause: vi.fn(),
        resume: vi.fn(),
      };
      this.load = {
        svg: vi.fn(),
        image: vi.fn(),
        audio: vi.fn(),
        on: vi.fn(),
        once: vi.fn(),
        off: vi.fn(),
      };
      this.input = {
        on: vi.fn(),
        off: vi.fn(),
        setDraggable: vi.fn(),
      };
      this.cameras = {
        main: {
          setBackgroundColor: vi.fn(),
          fadeIn: vi.fn(),
          fadeOut: vi.fn(),
          setZoom: vi.fn(),
          zoomTo: vi.fn(),
          centerX: 512,
          centerY: 384,
          width: 1024,
          height: 768,
        },
      };
      this.scale = {
        setSize: vi.fn(),
        on: vi.fn(),
        width: 1024,
        height: 768,
      };
      this.time = {
        delayedCall: vi.fn(() => ({ remove: vi.fn() })),
        addEvent: vi.fn(),
      };
      this.tweens = {
        add: vi.fn(() => ({ remove: vi.fn(), stop: vi.fn() })),
      };
      this.sys = {
        events: {
          on: vi.fn(),
          once: vi.fn(),
          off: vi.fn(),
        },
      };
      this.events = this.sys.events;
      this.children = {
        forEach: vi.fn(),
      };
      this.physics = {
        add: {
          image: vi.fn(() => createMockGameObject(this)),
        },
        world: {
          setBoundsCollision: vi.fn(),
          setBounds: vi.fn(),
        },
      };
    }
  }

  /** Mock for Phaser.Geom.Rectangle — must be a class to support `new`. */
  class MockRectangle {
    static Contains = vi.fn(() => true);

    constructor(
      readonly x: number,
      readonly y: number,
      readonly width: number,
      readonly height: number,
    ) {}
  }

  return {
    default: {
      Scene: MockScene,
      Game: vi.fn(),
      Scale: { FIT: 0, CENTER_BOTH: 0 },
      AUTO: "AUTO",
      Geom: { Rectangle: MockRectangle },
    },
    Scene: MockScene,
    Game: vi.fn(),
    Scale: { FIT: 0, CENTER_BOTH: 0 },
    AUTO: "AUTO",
    Geom: { Rectangle: MockRectangle },
  };
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

/** Spy on recordGameResult (calls through to the real implementation). */
const { mockRecordGameResult } = vi.hoisted(() => ({
  mockRecordGameResult: vi.fn(),
}));

vi.mock("../../utils/storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../utils/storage")>();
  mockRecordGameResult.mockImplementation((gameId: string, correct: number, wrong: number) => {
    actual.recordGameResult(gameId, correct, wrong);
  });
  return { ...actual, recordGameResult: mockRecordGameResult };
});

import { GameSceneBase } from "../../scenes/GameSceneBase";
import { earnSticker, hasSticker } from "../../utils/storage";

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
  let matchMediaMock: MockFn;

  beforeEach(() => {
    matchMediaMock = vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    vi.stubGlobal("matchMedia", matchMediaMock);
    localStorage.clear();
    mockParentLockInstances.length = 0;
    mockParentLockOptions.length = 0;
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
    matchMediaMock.mockImplementation(() => ({
      matches: reduced,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
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
          call[0]?.scaleX === 0.5
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
