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

  /** Mock for Phaser.Curves.Path — supports `new` and chainable lineTo. */
  class MockCurvesPath {
    lineTo = vi.fn().mockReturnThis();

    constructor(
      readonly x: number,
      readonly y: number,
    ) {}
  }

  return {
    default: {
      Scene: MockScene,
      Game: vi.fn(),
      Scale: { FIT: 0, CENTER_BOTH: 0 },
      AUTO: "AUTO",
      Geom: { Rectangle: MockRectangle },
      Curves: { Path: MockCurvesPath },
    },
    Scene: MockScene,
    Game: vi.fn(),
    Scale: { FIT: 0, CENTER_BOTH: 0 },
    AUTO: "AUTO",
    Geom: { Rectangle: MockRectangle },
    Curves: { Path: MockCurvesPath },
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

import { AnimalTraceScene } from "../../scenes/AnimalTraceScene";
import { earnSticker, hasSticker } from "../../utils/storage";

/** Casts a Phaser-typed method to a MockFn for mock assertions. */
function getMockFn(fn: unknown): MockFn {
  return fn as unknown as MockFn;
}

describe("AnimalTraceScene session state", () => {
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

  /** Fires the pointerdown handler at the given coordinates (scene-level input). */
  function firePointerAt(scene: unknown, x: number, y: number): void {
    const input = (scene as { input: Record<string, unknown> }).input;
    const onMock = getMockFn(input.on);
    const pointerdownCalls = onMock.mock.calls.filter((call) => call[0] === "pointerdown");
    const handler = pointerdownCalls.at(-1)?.[1] as (pointer: { x: number; y: number }) => void;
    expect(handler).toBeTypeOf("function");
    handler({ x, y });
  }

  /** Traces the full current path by hitting every waypoint past the start. */
  function traceFullPath(scene: unknown): void {
    const s = scene as { currentPair: { pathPoints: Array<{ x: number; y: number }> } };
    const points = s.currentPair.pathPoints;
    for (let i = 1; i < points.length; i++) {
      firePointerAt(scene, points[i].x, points[i].y);
    }
  }

  /** Fires the most recently registered next-pair delay (1000ms) callback. */
  function fireNextPairDelay(scene: unknown): void {
    const time = (scene as { time: Record<string, unknown> }).time;
    const delayedCallMock = getMockFn(time.delayedCall);
    const calls = delayedCallMock.mock.calls.filter((call) => call[0] === 1000);
    expect(calls.length).toBeGreaterThan(0);
    const handler = calls.at(-1)?.[1] as () => void;
    handler();
  }

  /** Returns the auto-return (3000ms) delayed call registered most recently. */
  function getAutoReturnCall(scene: unknown): unknown[] | undefined {
    const time = (scene as { time: Record<string, unknown> }).time;
    const delayedCallMock = getMockFn(time.delayedCall);
    return delayedCallMock.mock.calls.filter((call) => call[0] === 3000).at(-1);
  }

  it("requires all 3 paths again after a full-session relaunch", () => {
    const scene = new AnimalTraceScene();
    scene.create();

    // Complete a full session (3 paths → win → sticker).
    traceFullPath(scene);
    fireNextPairDelay(scene);
    traceFullPath(scene);
    fireNextPairDelay(scene);
    traceFullPath(scene);
    expect(getMockFn(mockAudio.playWin)).toHaveBeenCalledTimes(1);
    expect(hasSticker("animal-trace")).toBe(true);

    // Relaunch: session counters must be reset.
    scene.create();
    const state = scene as unknown as { completedPaths: number; progressDots: unknown[] };
    expect(state.completedPaths).toBe(0);
    expect(state.progressDots).toHaveLength(3);

    // Completing a single path must NOT complete the round.
    traceFullPath(scene);
    expect(getMockFn(mockAudio.playWin)).toHaveBeenCalledTimes(1);
    expect(state.completedPaths).toBe(1);
    // The last scheduled action after the relaunch must be the next-pair
    // delay (1000ms), never a round-completion auto-return (3000ms).
    const delayedCallMock = getMockFn((scene as { time: Record<string, unknown> }).time.delayedCall);
    const lastCall = delayedCallMock.mock.calls.at(-1);
    expect(lastCall?.[0]).toBe(1000);
  });

  it("plays all 3 pairs after a mid-session exit relaunch without crashing", () => {
    const scene = new AnimalTraceScene();
    scene.create();

    // Complete one path, then exit mid-session (relaunch without finishing).
    traceFullPath(scene);
    fireNextPairDelay(scene);

    scene.create();
    expect((scene as unknown as { currentPairIndex: number }).currentPairIndex).toBe(0);

    // The relaunched session must require all 3 paths again and not crash
    // on a stale pair index (pairs[3] would throw).
    traceFullPath(scene);
    fireNextPairDelay(scene);
    traceFullPath(scene);
    fireNextPairDelay(scene);
    traceFullPath(scene);
    expect(getMockFn(mockAudio.playWin)).toHaveBeenCalledTimes(1);
  });

  it("recreates progress dots on relaunch (no stale destroyed dots)", () => {
    const scene = new AnimalTraceScene();
    scene.create();
    scene.create();

    const state = scene as unknown as { progressDots: unknown[] };
    expect(state.progressDots).toHaveLength(3);
    // Only 3 dots are drawn per session, not accumulated.
    const circleMock = getMockFn((scene as { add: Record<string, unknown> }).add.circle);
    expect(circleMock).toHaveBeenCalledTimes(6);
  });

  it("guards the round-complete flow under reduced motion", () => {
    setReducedMotion(true);
    const scene = new AnimalTraceScene();
    scene.create();
    traceFullPath(scene);
    fireNextPairDelay(scene);
    traceFullPath(scene);
    fireNextPairDelay(scene);
    traceFullPath(scene);
    expect(getMockFn(mockAudio.playWin)).toHaveBeenCalledTimes(1);
    expect(getAutoReturnCall(scene)).toBeDefined();
  });
});
