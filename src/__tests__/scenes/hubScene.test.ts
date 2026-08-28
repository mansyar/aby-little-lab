import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type MockFn = ReturnType<typeof vi.fn>;

interface MockObject {
  kind: string;
  handlers: Record<string, (...args: unknown[]) => unknown>;
  /** Every registered handler in order (real Phaser fires all of them). */
  allHandlers: Array<{ name: string; cb: (...args: unknown[]) => unknown }>;
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
      allHandlers: [],
      setInteractive: vi.fn().mockReturnThis(),
      disableInteractive: vi.fn(),
      on: vi.fn(function (this: MockObject, name: string, cb: (...args: unknown[]) => unknown) {
        this.handlers[name] = cb;
        this.allHandlers.push({ name, cb });
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
        image: vi.fn((...args: unknown[]) => {
          const obj = createMockGameObject(this, "image");
          obj.args = args;
          return obj;
        }),
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
    flapGreeting: vi.fn(),
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
import {
  addProfile,
  earnSticker,
  getActiveProfile,
  getAvailableAvatars,
  getProfiles,
  getProgress,
  recordPlayTime,
  setPlayTimeLimit,
} from "../../utils/storage";

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

  it("renders all 20 tiles fully inside the 1024×768 canvas (5×4 grid)", () => {
    const scene = new HubScene();
    scene.create();

    const tiles = mockRegistry.filter((obj) => obj.kind === "rectangle" && obj.handlers.pointerup);
    expect(tiles).toHaveLength(20);

    for (const tile of tiles) {
      const [x, y, width, height] = tile.args as number[];
      expect(y - height / 2).toBeGreaterThanOrEqual(0);
      expect(y + height / 2).toBeLessThanOrEqual(768);
      expect(x - width / 2).toBeGreaterThanOrEqual(0);
      expect(x + width / 2).toBeLessThanOrEqual(1024);
    }
  });
});

describe("HubScene profile and hierarchy cohesion", () => {
  let matchMediaMock: MockFn;

  beforeEach(() => {
    matchMediaMock = vi.fn(() => ({
      matches: false,
      media: "(prefers-reduced-motion: reduce)",
      onchange: null,
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

  /** Toggles the `prefers-reduced-motion` media query result. */
  function setReducedMotion(reduced: boolean): void {
    matchMediaMock.mockImplementation(() => ({
      matches: reduced,
      media: "(prefers-reduced-motion: reduce)",
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  }

  function getNavTiles(): MockObject[] {
    return mockRegistry.filter((obj) => obj.kind === "rectangle" && obj.handlers.pointerup);
  }

  function getChipImage(): MockObject {
    const chip = mockRegistry.find(
      (obj) => obj.kind === "image" && obj.args?.[0] === 68 && obj.args?.[1] === 68,
    );
    if (!chip) throw new Error("profile chip image not found");
    return chip;
  }

  /** Small decorative/state rectangles (rings, badges) near a point. */
  function getSmallRectsNear(cx: number, cy: number, tolerance = 2): MockObject[] {
    return mockRegistry.filter((obj) => {
      if (obj.kind !== "rectangle") return false;
      const [x, y, w, h] = obj.args as number[];
      if (w > 300 || h > 300) return false;
      return Math.abs(x - cx) <= tolerance && Math.abs(y - cy) <= tolerance;
    });
  }

  /** Fires every handler for an event, matching real Phaser dispatch order. */
  function fireAll(obj: MockObject, event: string): void {
    for (const { name, cb } of obj.allHandlers) {
      if (name === event) cb();
    }
  }

  it("marks the active-profile avatar chip with a persistent ring outline", () => {
    setReducedMotion(false);
    const scene = new HubScene();
    scene.create();

    const chip = getChipImage();
    expect(chip).toBeDefined();

    // A flat storybook ring centered on the chip (not scale alone).
    const rings = getSmallRectsNear(chip.args?.[0] as number, chip.args?.[1] as number);
    expect(rings.length).toBeGreaterThan(0);
    const ring = rings[0];
    if (!ring) throw new Error("chip ring rectangle not found");
    const [, , rw, rh] = ring.args as number[];
    expect(rw).toBeGreaterThanOrEqual(72); // AVATAR_CHIP_DISPLAY
    expect(rh).toBeGreaterThanOrEqual(72);
  });

  it("marks the active avatar inside the picker with a ring while keeping its larger scale", () => {
    setReducedMotion(false);
    const scene = new HubScene();
    scene.create();

    // Ensure at least two profiles so the picker has a real choice.
    if (getProfiles().length < 2) {
      addProfile(getAvailableAvatars()[0]);
      mockRegistry.length = 0;
      const fresh = new HubScene();
      fresh.create();
    }

    const baseScale = 96 / 512; // PICKER_AVATAR_DISPLAY / AVATAR_TEXTURE_SIZE
    const activeScale = baseScale * 1.15;
    fireAll(getChipImage(), "pointerup");

    const avatars = mockRegistry.filter(
      (obj) =>
        obj.kind === "image" &&
        obj.args?.[1] === 384 &&
        obj.setScale.mock.calls.some((call) => call[0] === activeScale),
    );
    expect(avatars).toHaveLength(1);
    const active = avatars[0];
    if (!active) throw new Error("active picker avatar not found");

    const rings = getSmallRectsNear(active.args?.[0] as number, 384);
    expect(rings.length).toBeGreaterThan(0);

    // The larger scale remains as an additional cue (pin existing behavior).
    expect(active.setScale).toHaveBeenCalledWith(activeScale);
    const inactive = mockRegistry.filter(
      (obj) =>
        obj.kind === "image" &&
        obj.args?.[1] === 384 &&
        obj !== active &&
        obj.setScale.mock.calls.some((call) => call[0] === baseScale),
    );
    expect(inactive.length).toBe(getProfiles().length - 1);
  });

  it("keeps pressed-tile feedback without breaking navigation semantics", () => {
    setReducedMotion(false);
    const scene = new HubScene();
    scene.create();

    const tile = getNavTiles()[0];
    // Press feedback attaches when the entrance tween completes; simulate it.
    const entrance = scene.tweens.add.mock.calls
      .map((call) => call[0] as { targets?: unknown[]; onComplete?: () => void })
      .find(
        (config) =>
          Array.isArray(config.targets) &&
          config.targets.includes(tile) &&
          typeof config.onComplete === "function",
      );
    expect(entrance).toBeDefined();
    if (!entrance || typeof entrance.onComplete !== "function") {
      throw new Error("tile entrance tween with onComplete callback not found");
    }
    entrance.onComplete();

    expect(tile.handlers.pointerdown).toBeDefined();
    tile.handlers.pointerdown?.();
    expect(tile.setScale).toHaveBeenCalledWith(0.95);
    expect(tile.handlers.pointercancel).toBeDefined();
  });

  it("preserves the 5×4 grid geometry at 1024×768", () => {
    setReducedMotion(false);
    const scene = new HubScene();
    scene.create();

    const tiles = getNavTiles();
    expect(tiles).toHaveLength(20);

    const rows = new Map<number, MockObject[]>();
    for (const tile of tiles) {
      const y = tile.args?.[1] as number;
      const row = rows.get(y);
      if (row) row.push(tile);
      else rows.set(y, [tile]);
    }
    const rowSizes = [...rows.keys()].sort((a, b) => a - b).map((y) => rows.get(y)?.length ?? 0);
    expect(rowSizes).toEqual([5, 5, 5, 5]);

    for (const [, row] of rows) {
      const xs = row.map((t) => t.args?.[0] as number).sort((a, b) => a - b);
      for (let i = 1; i < xs.length; i++) {
        expect(xs[i] - xs[i - 1]).toBeCloseTo(182, 0); // TILE_WIDTH(160)+TILE_SPACING(22)
      }
    }
  });

  it("shows earned stickers on the shelf and dashed slots for unearned ones", () => {
    setReducedMotion(false);
    earnSticker("shape-sorter");
    earnSticker("color-match");
    const scene = new HubScene();
    scene.create();

    const earned = mockRegistry.filter(
      (obj) =>
        obj.kind === "image" &&
        typeof obj.args?.[2] === "string" &&
        (obj.args[2] as string).startsWith("sticker_"),
    );
    expect(earned).toHaveLength(2);

    // Dashed empty slots draw arcs at the sticker radius (28px).
    const emptySlots = mockRegistry.filter(
      (obj) => obj.kind === "graphics" && obj.arc.mock.calls.some((call) => call[2] === 28),
    );
    expect(emptySlots).toHaveLength(18);
  });

  it("locks tiles with a moon badge once the daily limit is reached", () => {
    setReducedMotion(false);
    const profileId = getActiveProfile().id;
    setPlayTimeLimit(profileId, 30);
    recordPlayTime(profileId, 30);
    const scene = new HubScene();
    scene.create();

    for (const tile of getNavTiles()) {
      expect(tile.setAlpha).toHaveBeenCalledWith(0.45); // TIME_UP_TILE_ALPHA
      expect(tile.disableInteractive).toHaveBeenCalled();
    }

    const moons = mockRegistry.filter(
      (obj) => obj.kind === "graphics" && obj.fillCircle.mock.calls.length >= 2,
    );
    expect(moons.length).toBeGreaterThan(0);
  });

  it("keeps tiles interactive with a hint arc when time remains", () => {
    setReducedMotion(false);
    const profileId = getActiveProfile().id;
    setPlayTimeLimit(profileId, 30);
    recordPlayTime(profileId, 26);
    const scene = new HubScene();
    scene.create();

    for (const tile of getNavTiles()) {
      expect(tile.disableInteractive).not.toHaveBeenCalled();
    }
    const arcs = mockRegistry.filter(
      (obj) =>
        obj.kind === "graphics" &&
        obj.slice.mock.calls.some((call) => call[2] === 12) && // HINT_ARC_RADIUS
        obj.fillStyle.mock.calls.some((call) => call[0] === 0xed8936), // HINT_WARM_COLOR
    );
    expect(arcs.length).toBeGreaterThan(0);
  });

  it("switches profiles from the picker and re-textures the chip", () => {
    setReducedMotion(false);
    const scene = new HubScene();
    scene.create();
    if (getProfiles().length < 2) {
      addProfile(getAvailableAvatars()[0]);
      mockRegistry.length = 0;
      const fresh = new HubScene();
      fresh.create();
    }

    const before = getActiveProfile().id;
    fireAll(getChipImage(), "pointerup");

    const baseScale = 96 / 512;
    const other = mockRegistry.find(
      (obj) =>
        obj.kind === "image" &&
        obj.args?.[1] === 384 &&
        obj.setScale.mock.calls.some((call) => call[0] === baseScale),
    );
    if (!other) throw new Error("inactive picker avatar not found");

    fireAll(other, "pointerup");

    expect(getActiveProfile().id).not.toBe(before);
    // Picker closed: every picker avatar was destroyed.
    for (const obj of mockRegistry.filter((o) => o.kind === "image" && o.args?.[1] === 384)) {
      expect(obj.destroy.mock.calls.length).toBeGreaterThan(0);
    }
  });

  it("adds no idle motion tweens under reduced motion while tiles stay tappable", () => {
    setReducedMotion(true);
    const scene = new HubScene();
    scene.create();

    const navTiles = getNavTiles();
    expect(navTiles).toHaveLength(20);
    const motionTargets = scene.tweens.add.mock.calls.filter((call) => {
      const config = call[0] as { targets?: unknown };
      return navTiles.includes(config.targets as MockObject);
    });
    expect(motionTargets).toHaveLength(0);
  });
});
