import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
          image: vi.fn(() => createMockGameObject()),
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

/** Mock the mascot so tests can verify cheer/nod without real tween-heavy component. */
const { mockMascot } = vi.hoisted(() => ({
  mockMascot: {
    cheer: vi.fn(),
    curious: vi.fn(),
    nod: vi.fn(),
    destroy: vi.fn(),
  },
}));

vi.mock("../../components/Mascot", () => ({
  createCornerMascot: () => mockMascot,
}));

import { PopFreezeScene } from "../../scenes/PopFreezeScene";
import { earnSticker, hasSticker } from "../../utils/storage";

/** Casts a Phaser-typed method to a MockFn for mock assertions. */
function getMockFn(fn: unknown): MockFn {
  return fn as unknown as MockFn;
}

describe("PopFreezeScene spawn and tap routing", () => {
  let matchMediaMock: MockFn;

  beforeEach(() => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    matchMediaMock = vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    vi.stubGlobal("matchMedia", matchMediaMock);
    localStorage.clear();
    mockParentLockInstances.length = 0;
    Object.values(mockAudio).forEach((fn) => {
      getMockFn(fn).mockClear();
    });
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

  /** Returns every physics bubble image in creation order. */
  function getBubbles(scene: PopFreezeScene): Array<Record<string, MockFn>> {
    const imageMock = getMockFn(
      (scene as unknown as { physics: { add: { image: MockFn } } }).physics.add.image,
    );
    return imageMock.mock.results.map((r) => r.value as Record<string, MockFn>);
  }

  /** Taps a bubble by invoking its registered pointerdown handler. */
  function tapBubble(bubble: Record<string, MockFn>): void {
    const handler = getMockFn(bubble.on).mock.calls.find((call) => call[0] === "pointerdown");
    expect(handler).toBeDefined();
    if (handler && typeof handler[1] === "function") {
      (handler[1] as () => void)();
    }
  }

  it("spawns 5 bubbles with 96px display, 48px circle bodies, and sleeping overlays", () => {
    const scene = new PopFreezeScene();
    scene.create();

    const bubbles = getBubbles(scene);
    expect(bubbles).toHaveLength(5);

    for (const bubble of bubbles) {
      expect(getMockFn(bubble.setDisplaySize)).toHaveBeenCalledWith(96, 96);
      // FR-5: the Arcade body must match the 96px display, not the 512px SVG frame.
      expect(getMockFn(bubble.setCircle)).toHaveBeenCalledWith(48);
      expect(getMockFn(bubble.setVelocity)).toHaveBeenCalled();
      expect(getMockFn(bubble.setCollideWorldBounds)).toHaveBeenCalledWith(true);
      expect(getMockFn(bubble.setBounce)).toHaveBeenCalledWith(1, 1);
      expect(getMockFn(bubble.setInteractive)).toHaveBeenCalled();
    }

    // Exactly one sleeping bubble carries an animal + zzz overlay (Math.random 0.5).
    const imageMock = getMockFn((scene as unknown as { add: { image: MockFn } }).add.image);
    const animalCalls = imageMock.mock.calls.filter(
      (call) => typeof call[2] === "string" && call[2].startsWith("animal_"),
    );
    expect(animalCalls).toHaveLength(1);
    const zzzCalls = imageMock.mock.calls.filter((call) => call[2] === "sleep_zzz");
    expect(zzzCalls).toHaveLength(1);
  });

  it("routes poppable taps to pop and sleeping taps to wake", () => {
    const scene = new PopFreezeScene();
    scene.create();

    const bubbles = getBubbles(scene);
    tapBubble(bubbles[0]);
    expect(mockAudio.playWake).toHaveBeenCalledTimes(1);
    expect(mockAudio.playPop).not.toHaveBeenCalled();
    expect(mockMascot.nod).toHaveBeenCalledTimes(1);

    tapBubble(bubbles[1]);
    expect(mockAudio.playPop).toHaveBeenCalledTimes(1);
    expect(mockAudio.playWake).toHaveBeenCalledTimes(1);
    expect(mockMascot.cheer).toHaveBeenCalledTimes(1);
  });

  it("pops a bubble and respawns a replacement to keep 5 concurrent", () => {
    const scene = new PopFreezeScene();
    scene.create();

    tapBubble(getBubbles(scene)[1]);
    expect(mockAudio.playPop).toHaveBeenCalledTimes(1);

    // 5 initial + 1 respawn; the live set is still 5 bubbles.
    const bubbles = getBubbles(scene);
    expect(bubbles).toHaveLength(6);
    expect(getMockFn(bubbles[5].setInteractive)).toHaveBeenCalled();
  });

  it("emits self-cleaning droplet graphics on pop", () => {
    const scene = new PopFreezeScene();
    scene.create();

    const graphicsMock = getMockFn(
      (scene as unknown as { add: { graphics: MockFn } }).add.graphics,
    );
    tapBubble(getBubbles(scene)[1]);

    // graphics[0] = completion splash rays, graphics[1] = droplet burst.
    const splash = graphicsMock.mock.results[0].value as Record<string, MockFn>;
    const droplets = graphicsMock.mock.results[1].value as Record<string, MockFn>;
    expect(splash).toBeDefined();
    expect(getMockFn(droplets.fillCircle)).toHaveBeenCalledTimes(3);

    const tweenMock = getMockFn((scene as unknown as { tweens: { add: MockFn } }).tweens.add);
    const dropletTween = tweenMock.mock.calls.find((call) => call[0]?.targets === droplets);
    expect(dropletTween).toBeDefined();
    expect(dropletTween?.[0].alpha).toBe(0);
    if (dropletTween && typeof dropletTween[0].onComplete === "function") {
      dropletTween[0].onComplete();
    }
    expect(getMockFn(droplets.destroy)).toHaveBeenCalledTimes(1);
  });

  it("skips the breathing loop under reduced motion", () => {
    setReducedMotion(true);
    const scene = new PopFreezeScene();
    scene.create();

    const tweenMock = getMockFn((scene as unknown as { tweens: { add: MockFn } }).tweens.add);
    const looping = tweenMock.mock.calls.filter((call) => call[0]?.repeat === -1);
    expect(looping).toHaveLength(0);
  });

  it("breathes the sleeping animal with a looping tween in normal motion", () => {
    const scene = new PopFreezeScene();
    scene.create();

    const imageMock = getMockFn((scene as unknown as { add: { image: MockFn } }).add.image);
    const animalIndex = imageMock.mock.calls.findIndex(
      (call) => typeof call[2] === "string" && call[2].startsWith("animal_"),
    );
    expect(animalIndex).toBeGreaterThanOrEqual(0);
    const animal = imageMock.mock.results[animalIndex].value as Record<string, MockFn>;

    const tweenMock = getMockFn((scene as unknown as { tweens: { add: MockFn } }).tweens.add);
    const breathe = tweenMock.mock.calls.find(
      (call) => call[0]?.targets === animal && call[0]?.repeat === -1,
    );
    expect(breathe).toBeDefined();
    expect(breathe?.[0].duration).toBe(750);
  });
});

describe("PopFreezeScene completion and sticker flow", () => {
  let matchMediaMock: MockFn;

  beforeEach(() => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    matchMediaMock = vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    vi.stubGlobal("matchMedia", matchMediaMock);
    localStorage.clear();
    mockParentLockInstances.length = 0;
    Object.values(mockAudio).forEach((fn) => {
      getMockFn(fn).mockClear();
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  function getBubbles(scene: PopFreezeScene): Array<Record<string, MockFn>> {
    const imageMock = getMockFn(
      (scene as unknown as { physics: { add: { image: MockFn } } }).physics.add.image,
    );
    return imageMock.mock.results.map((r) => r.value as Record<string, MockFn>);
  }

  function tapBubble(bubble: Record<string, MockFn>): void {
    const handler = getMockFn(bubble.on).mock.calls.find((call) => call[0] === "pointerdown");
    expect(handler).toBeDefined();
    if (handler && typeof handler[1] === "function") {
      (handler[1] as () => void)();
    }
  }

  function completeRound(scene: PopFreezeScene): void {
    const initial = getBubbles(scene);
    for (let i = 1; i <= 4; i++) {
      tapBubble(initial[i]);
    }
    const refreshed = getBubbles(scene);
    tapBubble(refreshed[5]);
    tapBubble(refreshed[6]);
  }

  function completeFadeOuts(scene: PopFreezeScene): void {
    const fadeOutMock = getMockFn(
      (scene as unknown as { cameras: { main: { fadeOut: MockFn } } }).cameras.main.fadeOut,
    );
    for (const call of fadeOutMock.mock.calls) {
      const callback = call[4] as () => void;
      callback();
    }
  }

  it("plays win SFX when 6 poppable bubbles are popped", () => {
    const scene = new PopFreezeScene();
    scene.create();

    completeRound(scene);
    expect(mockAudio.playWin).toHaveBeenCalledTimes(1);
    expect(mockMascot.cheer).toHaveBeenCalledWith(true);
  });

  it("locks input after the round is complete", () => {
    const scene = new PopFreezeScene();
    scene.create();

    completeRound(scene);
    const playPopCalls = getMockFn(mockAudio.playPop).mock.calls.length;

    // Any further tap (poppable or sleeping) must be ignored.
    const bubbles = getBubbles(scene);
    for (const bubble of bubbles) {
      tapBubble(bubble);
    }
    expect(getMockFn(mockAudio.playPop).mock.calls.length).toBe(playPopCalls);
    expect(getMockFn(mockAudio.playWake).mock.calls.length).toBe(0);
  });

  it("awards the sticker on first completion and auto-returns with justEarned", () => {
    const scene = new PopFreezeScene();
    scene.create();

    completeRound(scene);

    expect(hasSticker("pop-freeze")).toBe(true);
    expect(mockAudio.playSticker).toHaveBeenCalledTimes(1);

    const imageMock = getMockFn((scene as unknown as { add: { image: MockFn } }).add.image);
    const stickerCall = imageMock.mock.calls.find((call) => call[2] === "sticker_pop_freeze");
    expect(stickerCall).toBeDefined();

    const delayedCallMock = getMockFn(
      (scene as unknown as { time: { delayedCall: MockFn } }).time.delayedCall,
    );
    const autoReturn = delayedCallMock.mock.calls.find((call) => call[0] === 3000);
    expect(autoReturn).toBeDefined();
    if (autoReturn && typeof autoReturn[1] === "function") {
      autoReturn[1]();
    }
    completeFadeOuts(scene);

    expect(
      getMockFn((scene as unknown as { scene: { start: MockFn } }).scene.start),
    ).toHaveBeenCalledWith("Hub", { justEarned: "pop-freeze" });
  });

  it("does not re-award the sticker or pass justEarned on repeat completions", () => {
    earnSticker("pop-freeze");
    const scene = new PopFreezeScene();
    scene.create();

    completeRound(scene);

    expect(mockAudio.playSticker).not.toHaveBeenCalled();
    const imageMock = getMockFn((scene as unknown as { add: { image: MockFn } }).add.image);
    const stickerCall = imageMock.mock.calls.find((call) => call[2] === "sticker_pop_freeze");
    expect(stickerCall).toBeUndefined();

    const delayedCallMock = getMockFn(
      (scene as unknown as { time: { delayedCall: MockFn } }).time.delayedCall,
    );
    const autoReturn = delayedCallMock.mock.calls.find((call) => call[0] === 3000);
    expect(autoReturn).toBeDefined();
    if (autoReturn && typeof autoReturn[1] === "function") {
      autoReturn[1]();
    }
    completeFadeOuts(scene);

    expect(
      getMockFn((scene as unknown as { scene: { start: MockFn } }).scene.start),
    ).toHaveBeenCalledWith("Hub");
  });

  it("starts a fresh round on relaunch (no stale completion state)", () => {
    const scene = new PopFreezeScene();
    scene.create();

    completeRound(scene);
    expect(mockAudio.playWin).toHaveBeenCalledTimes(1);

    scene.create();
    expect(mockAudio.playWin).toHaveBeenCalledTimes(1);

    // Fresh round: taps work again and a pop is registered.
    const playPopCalls = getMockFn(mockAudio.playPop).mock.calls.length;
    const fresh = getBubbles(scene).slice(-5);
    tapBubble(fresh[1]);
    expect(getMockFn(mockAudio.playPop).mock.calls.length).toBe(playPopCalls + 1);
  });
});
