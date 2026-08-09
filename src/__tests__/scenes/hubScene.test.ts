import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type MockFn = ReturnType<typeof vi.fn>;

interface MockObject {
  kind: string;
  handlers: Record<string, (...args: unknown[]) => unknown>;
  /** Constructor arguments captured by the factory mock (e.g. rectangle x/y/w/h). */
  args?: unknown[];
}

const { mockAudio, mockRecordGamePlay, mockRegistry } = vi.hoisted(() => {
  const mockAudio = {
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
  };
  const mockRecordGamePlay = vi.fn();
  const mockRegistry: MockObject[] = [];
  return { mockAudio, mockRecordGamePlay, mockRegistry };
});

/**
 * Mock Phaser module. HubScene extends Phaser.Scene, which at runtime resolves
 * to MockScene. Every created game object records its event handlers in
 * mockRegistry so tests can drive interactions (e.g. tile taps) directly.
 */
vi.mock("phaser", () => {
  function createMockGameObject(scene?: unknown, kind = "generic"): MockObject {
    const obj: MockObject & Record<string, unknown> = {
      kind,
      handlers: {},
      setInteractive: vi.fn().mockReturnThis(),
      disableInteractive: vi.fn(),
      on: vi.fn(function (this: MockObject, name: string, cb: (...args: unknown[]) => unknown) {
        this.handlers[name] = cb;
        return this;
      }),
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
      arc: vi.fn().mockReturnThis(),
      lineStyle: vi.fn().mockReturnThis(),
      strokeRect: vi.fn().mockReturnThis(),
      strokeCircle: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
      scaleX: 1,
      scaleY: 1,
      scene,
    };
    mockRegistry.push(obj);
    return obj;
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
        rectangle: vi.fn((...args: unknown[]) => {
          const obj = createMockGameObject(this, "rectangle");
          obj.args = args;
          return obj;
        }),
        text: vi.fn((..._args: unknown[]) => createMockGameObject(this, "text")),
        image: vi.fn((..._args: unknown[]) => createMockGameObject(this, "image")),
        container: vi.fn((..._args: unknown[]) => createMockGameObject(this, "container")),
        circle: vi.fn((..._args: unknown[]) => createMockGameObject(this, "circle")),
        graphics: vi.fn((..._args: unknown[]) => createMockGameObject(this, "graphics")),
        zone: vi.fn((..._args: unknown[]) => createMockGameObject(this, "zone")),
        particles: vi.fn((..._args: unknown[]) => createMockGameObject(this, "particles")),
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
          image: vi.fn((..._args: unknown[]) => createMockGameObject(this, "physics-image")),
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

/** Mock AudioManager so create() can start/resume audio without real AudioContext. */
vi.mock("../../audio/AudioManager", () => ({
  AudioManager: {
    getInstance: () => mockAudio,
  },
}));

/** Mock scene components; their internals are covered by their own tests. */
vi.mock("../../components/Mascot", () => ({
  createCornerMascot: vi.fn(() => ({
    cheer: vi.fn(),
    wave: vi.fn(),
    nod: vi.fn(),
    idleLoop: vi.fn(),
    destroy: vi.fn(),
  })),
}));

vi.mock("../../components/ParentLock", () => ({
  ParentLock: class {
    destroy = vi.fn();
  },
}));

vi.mock("../../components/PwaToast", () => ({
  PwaToast: class {
    destroy = vi.fn();
    show = vi.fn();
  },
}));

vi.mock("../../components/SettingsPanel", () => ({
  SettingsPanel: class {
    destroy = vi.fn();
  },
}));

/** Hub-only browser bridges: keep them inert in tests. */
vi.mock("../../utils/pwaBridge", () => ({
  getPwaBridge: vi.fn(() => null),
}));

vi.mock("../../utils/speech", () => ({
  unlockSpeechForUserGesture: vi.fn(),
}));

/** Lazy chunk loading is not exercised here; resolve immediately. */
vi.mock("../../scenes/sceneRegistry", () => ({
  ensureSceneLoaded: vi.fn(() => Promise.resolve()),
}));

/**
 * Partial storage mock: keep the real implementation (persistence assertions
 * stay meaningful) but spy on recordGamePlay to assert wiring. The spy calls
 * through to the real function so recorded plays actually persist.
 */
vi.mock("../../utils/storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../utils/storage")>();
  mockRecordGamePlay.mockImplementation((gameId: string) => {
    actual.recordGamePlay(gameId);
  });
  return { ...actual, recordGamePlay: mockRecordGamePlay };
});

import { HubScene } from "../../scenes/HubScene";
import { getProgress } from "../../utils/storage";

/** Returns the first object of the given kind registered for an event. */
function getHandler(kind: string, event: string): ((...args: unknown[]) => unknown) | undefined {
  return mockRegistry.find((obj) => obj.kind === kind && obj.handlers[event])?.handlers[event];
}

describe("HubScene session-start recording", () => {
  let matchMediaMock: MockFn;

  beforeEach(() => {
    matchMediaMock = vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    vi.stubGlobal("matchMedia", matchMediaMock);
    localStorage.clear();
    mockRegistry.length = 0;
    mockRecordGamePlay.mockClear();
    for (const fn of Object.values(mockAudio)) {
      fn.mockClear();
    }
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("records a play for the tapped tile's game on the active profile", () => {
    const scene = new HubScene();
    scene.create();

    const tapTile = getHandler("rectangle", "pointerup");
    expect(tapTile).toBeDefined();
    tapTile?.();

    expect(mockRecordGamePlay).toHaveBeenCalledTimes(1);
    expect(mockRecordGamePlay).toHaveBeenCalledWith("shape-sorter");
    // Persisted through the real storage implementation.
    expect(getProgress()["shape-sorter"].plays).toBe(1);
    expect(getProgress()["color-match"].plays).toBe(0);
  });

  it("ignores taps on other tiles once navigation has started", () => {
    const scene = new HubScene();
    scene.create();

    const tapTiles = mockRegistry.filter(
      (obj) => obj.kind === "rectangle" && obj.handlers.pointerup,
    );
    expect(tapTiles.length).toBeGreaterThanOrEqual(2);
    tapTiles[0].handlers.pointerup?.();
    tapTiles[1].handlers.pointerup?.();

    expect(mockRecordGamePlay).toHaveBeenCalledTimes(1);
    expect(mockRecordGamePlay).toHaveBeenCalledWith("shape-sorter");
  });

  it("does not double-record when a tile is tapped repeatedly", () => {
    const scene = new HubScene();
    scene.create();

    const tapTile = getHandler("rectangle", "pointerup");
    expect(tapTile).toBeDefined();
    tapTile?.();
    tapTile?.();

    expect(mockRecordGamePlay).toHaveBeenCalledTimes(1);
    expect(getProgress()["shape-sorter"].plays).toBe(1);
  });

  it("renders all 16 tiles fully inside the 1024×768 canvas (5×3+1 grid)", () => {
    const scene = new HubScene();
    scene.create();

    const tiles = mockRegistry.filter((obj) => obj.kind === "rectangle" && obj.handlers.pointerup);
    expect(tiles).toHaveLength(16);

    for (const tile of tiles) {
      const [x, y, width, height] = tile.args as number[];
      expect(y - height / 2).toBeGreaterThanOrEqual(0);
      expect(y + height / 2).toBeLessThanOrEqual(768);
      expect(x - width / 2).toBeGreaterThanOrEqual(0);
      expect(x + width / 2).toBeLessThanOrEqual(1024);
    }
  });
});
