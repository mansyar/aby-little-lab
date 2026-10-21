import { vi } from "vitest";

/**
 * Shared Phaser module mock for scene/component tests. Seeded from the
 * largest inline mock (`navigation.test.ts`) and merged with the richer
 * handler-capturing variants (`hubScene.test.ts`) so it is a behavioral
 * superset of every per-file copy it replaces.
 */

/**
 * A callable mock function.
 *
 * Vitest's `vi.fn()` defaults to `Mock<Procedure>`, but `ReturnType<typeof vi.fn>`
 * instantiates the generic with its full constraint (`Procedure | Constructable`),
 * which is not callable — that is the source of the historical
 * `TS2348: Mock<Constructable | Procedure> is not callable` noise across the test
 * tree. Spelling the signature out keeps mocks callable while still accepting
 * every implementation shape (`() => value`, `(x: string) => x`, `(...args) => …`).
 * The `any` mirrors Vitest's own internal `Procedure` type; it exists here once,
 * not at each of the hundreds of call sites.
 */
// biome-ignore lint/suspicious/noExplicitAny: mirrors Vitest's internal `Procedure` type
export type MockFn = ReturnType<typeof vi.fn<(...args: any[]) => any>>;

export interface MockHandlerEntry {
  name: string;
  cb: MockFn;
}

/** A mocked Phaser game object (sprite/text/graphics/container/…). */
export interface MockObject {
  kind: string;
  /** Latest handler registered per event name (via `on`). */
  handlers: Record<string, MockFn>;
  /** Every handler registration in call order. */
  allHandlers: MockHandlerEntry[];
  /** Constructor args captured for factory-created objects (rectangle/image/circle). */
  args?: unknown[];
  setInteractive: MockFn;
  disableInteractive: MockFn;
  on: MockFn;
  off: MockFn;
  setOrigin: MockFn;
  setScale: MockFn;
  setTexture: MockFn;
  setDepth: MockFn;
  setStyle: MockFn;
  setFontSize: MockFn;
  setText: MockFn;
  setColor: MockFn;
  setVisible: MockFn;
  setAlpha: MockFn;
  setPosition: MockFn;
  setSize: MockFn;
  setDisplaySize: MockFn;
  setStrokeStyle: MockFn;
  setFillStyle: MockFn;
  setVelocity: MockFn;
  setCollideWorldBounds: MockFn;
  setBounce: MockFn;
  setCircle: MockFn;
  setTint: MockFn;
  clearTint: MockFn;
  setAngle: MockFn;
  fillStyle: MockFn;
  fillCircle: MockFn;
  fillRoundedRect: MockFn;
  slice: MockFn;
  fillPath: MockFn;
  lineBetween: MockFn;
  clear: MockFn;
  getCenter: MockFn;
  beginPath: MockFn;
  moveTo: MockFn;
  lineTo: MockFn;
  strokePath: MockFn;
  arc: MockFn;
  lineStyle: MockFn;
  strokeRect: MockFn;
  strokeCircle: MockFn;
  strokeRoundedRect: MockFn;
  bringToTop: MockFn;
  destroy: MockFn;
  scaleX: number;
  scaleY: number;
  scene: unknown;
  [key: string]: unknown;
}

/** Every game object created through this helper, for per-file inspection. */
export const mockRegistry: MockObject[] = [];

/** Creates a mock game object with chainable methods used by Phaser scenes. */
export function createMockGameObject(
  scene?: unknown,
  kind = "generic",
  registry: MockObject[] = mockRegistry,
): MockObject {
  const obj: MockObject = {
    kind,
    handlers: {},
    allHandlers: [],
    setInteractive: vi.fn().mockReturnThis(),
    disableInteractive: vi.fn(),
    on: vi.fn(function (this: MockObject, name: string, cb: MockFn) {
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
    setTint: vi.fn().mockReturnThis(),
    clearTint: vi.fn().mockReturnThis(),
    setAngle: vi.fn().mockReturnThis(),
    fillStyle: vi.fn().mockReturnThis(),
    fillCircle: vi.fn().mockReturnThis(),
    fillRoundedRect: vi.fn().mockReturnThis(),
    slice: vi.fn().mockReturnThis(),
    fillPath: vi.fn().mockReturnThis(),
    lineBetween: vi.fn().mockReturnThis(),
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
    strokeRoundedRect: vi.fn().mockReturnThis(),
    bringToTop: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
    scaleX: 1,
    scaleY: 1,
    scene,
  };
  registry.push(obj);
  return obj;
}

/** A canvas texture the placeholder path can draw into and refresh. */
export interface MockCanvasTexture {
  readonly context: {
    fillStyle: string;
    strokeStyle: string;
    lineWidth: number;
    fillRect: MockFn;
    strokeRect: MockFn;
  };
  readonly refresh: MockFn;
}

/** Mock Phaser Scene base class with fully mocked subsystems. */
export class MockScene {
  add!: Record<string, MockFn>;
  scene!: Record<string, MockFn>;
  load!: Record<string, MockFn>;
  textures!: { exists: MockFn; createCanvas: MockFn };
  input!: Record<string, MockFn>;
  cameras!: {
    main: Record<string, MockFn | number> & {
      centerX: number;
      centerY: number;
      width: number;
      height: number;
    };
  };
  scale!: {
    setSize: MockFn;
    on: MockFn;
    off: MockFn;
    width: number;
    height: number;
    displaySize: { width: number; height: number };
  };
  /** Scene-level input handlers captured from input.on, keyed by event. */
  sceneInputHandlers!: Record<string, MockFn[]>;
  /** Scale-manager handlers captured from scale.on, keyed by event. */
  scaleHandlers!: Record<string, MockFn[]>;
  /** Scene-event handlers captured from events.on, keyed by event. */
  eventsHandlers!: Record<string, MockFn[]>;
  /**
   * Live scene-event registrations, keyed by event.
   *
   * A `once` registration is retired once it has fired, so this is the list of
   * handlers still attached to the scene's event emitter.
   */
  eventStore!: Record<string, Array<{ fn: MockFn; once: boolean }>>;
  time!: Record<string, MockFn>;
  tweens!: Record<string, MockFn>;
  sys!: { events: Record<string, MockFn> };
  events!: Record<string, MockFn>;
  children!: Record<string, MockFn>;
  physics!: { add: Record<string, MockFn>; world: Record<string, MockFn> };

  constructor(registry?: MockObject[]) {
    // Production scenes call super("key"); only accept an actual array.
    const reg = Array.isArray(registry) ? registry : mockRegistry;

    this.add = {
      rectangle: vi.fn((...args: unknown[]) => {
        const obj = createMockGameObject(this, "rectangle", reg);
        obj.args = args;
        return obj;
      }),
      text: vi.fn((...args: unknown[]) => {
        const obj = createMockGameObject(this, "text", reg);
        obj.args = args;
        return obj;
      }),
      image: vi.fn((...args: unknown[]) => {
        const obj = createMockGameObject(this, "image", reg);
        obj.args = args;
        return obj;
      }),
      container: vi.fn(() => createMockGameObject(this, "container", reg)),
      circle: vi.fn((...args: unknown[]) => {
        const obj = createMockGameObject(this, "circle", reg);
        obj.args = args;
        return obj;
      }),
      graphics: vi.fn(() => createMockGameObject(this, "graphics", reg)),
      zone: vi.fn(() => createMockGameObject(this, "zone", reg)),
      particles: vi.fn(() => createMockGameObject(this, "particles", reg)),
    };
    this.scene = {
      start: vi.fn(),
      stop: vi.fn(),
      launch: vi.fn(),
      add: vi.fn(),
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
    // Empty by default, like a cold TextureManager: keys created here are the
    // ones a scene generated itself (the missing-art placeholder path).
    const canvasKeys = new Set<string>();
    this.textures = {
      exists: vi.fn((key: string) => canvasKeys.has(key)),
      createCanvas: vi.fn((key: string): MockCanvasTexture => {
        canvasKeys.add(key);
        return {
          context: {
            fillStyle: "",
            strokeStyle: "",
            lineWidth: 0,
            fillRect: vi.fn(),
            strokeRect: vi.fn(),
          },
          refresh: vi.fn(),
        };
      }),
    };
    this.input = {
      on: vi.fn((event: string, handler: MockFn) => {
        const existing = this.sceneInputHandlers[event] ?? [];
        existing.push(handler);
        this.sceneInputHandlers[event] = existing;
      }),
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
      on: vi.fn((event: string, handler: MockFn) => {
        const existing = this.scaleHandlers[event] ?? [];
        existing.push(handler);
        this.scaleHandlers[event] = existing;
      }),
      off: vi.fn(),
      width: 1024,
      height: 768,
      displaySize: { width: 1024, height: 768 },
    };
    this.sceneInputHandlers = {};
    this.scaleHandlers = {};
    this.eventsHandlers = {};
    this.time = {
      delayedCall: vi.fn(() => ({ remove: vi.fn() })),
      addEvent: vi.fn(),
    };
    this.tweens = {
      add: vi.fn(() => ({ remove: vi.fn(), stop: vi.fn() })),
    };
    this.eventStore = {};
    const record = (event: string, fn: MockFn) => {
      const existing = this.eventsHandlers[event] ?? [];
      existing.push(fn);
      this.eventsHandlers[event] = existing;
    };
    this.sys = {
      events: {
        on: vi.fn((event: string, fn: MockFn) => {
          const list = this.eventStore[event] ?? [];
          list.push({ fn, once: false });
          this.eventStore[event] = list;
          record(event, fn);
        }),
        once: vi.fn((event: string, fn: MockFn) => {
          const list = this.eventStore[event] ?? [];
          list.push({ fn, once: true });
          this.eventStore[event] = list;
          record(event, fn);
        }),
        off: vi.fn(),
        emit: vi.fn((event: string) => {
          const list = this.eventStore[event];
          if (!list) return;
          for (let i = list.length - 1; i >= 0; i--) {
            const entry = list[i];
            entry.fn();
            if (entry.once) list.splice(i, 1);
          }
        }),
      },
    };
    this.events = this.sys.events;
    this.children = {
      bringToTop: vi.fn(),
      forEach: vi.fn(),
    };
    this.physics = {
      add: {
        image: vi.fn(() => createMockGameObject(this, "physics-image", reg)),
      },
      world: {
        setBoundsCollision: vi.fn(),
        setBounds: vi.fn(),
      },
    };
  }

  /**
   * Counts the handlers still attached to `event` on the scene's event emitter.
   *
   * A `once` handler is retired once it has fired, so this is how a test
   * observes whether a scene's per-visit registration is still hanging around
   * after the visit that registered it is over.
   */
  liveEventHandlerCount(event: string): number {
    return (this.eventStore[event] ?? []).length;
  }
}

/** Mock for Phaser.Curves.Path — must be a class to support `new`. */
export class MockPath {
  add: MockFn;
  lineTo: MockFn;
  getPoints: MockFn;
  start: { x: number; y: number };
  end: { x: number; y: number };

  constructor() {
    this.add = vi.fn().mockReturnThis();
    this.lineTo = vi.fn().mockReturnThis();
    this.getPoints = vi.fn(() => []);
    this.start = { x: 0, y: 0 };
    this.end = { x: 0, y: 0 };
  }
}

/** Mock for Phaser.Geom.Rectangle — must be a class to support `new`. */
export class MockRectangle {
  static Contains = vi.fn(() => true);

  constructor(
    readonly x: number,
    readonly y: number,
    readonly width: number,
    readonly height: number,
  ) {}
}

export interface PhaserModuleMock {
  default: PhaserModuleMock;
  Scene: typeof MockScene;
  Game: MockFn;
  Scale: { FIT: number; CENTER_BOTH: number };
  AUTO: string;
  Curves: { Path: typeof MockPath };
  Geom: { Rectangle: typeof MockRectangle };
}

/**
 * Builds the object a `vi.mock("phaser", …)` factory returns, plus the
 * registry collecting every game object created through it. Each call
 * returns the same module-level registry (Vitest isolates modules per
 * test file); tests empty it with `mockRegistry.length = 0` as needed.
 */
export function createPhaserModuleMock(): {
  module: PhaserModuleMock;
  mockRegistry: MockObject[];
} {
  return {
    module: {
      default: phaserModule,
      Scene: MockScene,
      Game: vi.fn(),
      Scale: { FIT: 0, CENTER_BOTH: 0 },
      AUTO: "AUTO",
      Curves: { Path: MockPath },
      Geom: { Rectangle: MockRectangle },
    },
    mockRegistry,
  };
}

const phaserModule: PhaserModuleMock = {
  default: null as unknown as PhaserModuleMock,
  Scene: MockScene,
  Game: vi.fn(),
  Scale: { FIT: 0, CENTER_BOTH: 0 },
  AUTO: "AUTO",
  Curves: { Path: MockPath },
  Geom: { Rectangle: MockRectangle },
};
phaserModule.default = phaserModule;
