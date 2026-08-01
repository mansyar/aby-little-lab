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
        add: vi.fn(),
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

  /** Mock for Phaser.Curves.Path — must be a class to support `new`. */
  class MockPath {
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
      Curves: { Path: MockPath },
      Geom: { Rectangle: MockRectangle },
    },
    Scene: MockScene,
    Game: vi.fn(),
    Scale: { FIT: 0, CENTER_BOTH: 0 },
    AUTO: "AUTO",
    Curves: { Path: MockPath },
    Geom: { Rectangle: MockRectangle },
  };
});

/**
 * Spy on hasSticker to verify HubScene consults storage for sticker status.
 * All other storage functions remain real implementations.
 */
vi.mock("../../utils/storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../utils/storage")>();
  return {
    ...actual,
    hasSticker: vi.fn(actual.hasSticker),
    earnSticker: vi.fn(actual.earnSticker),
  };
});

/**
 * Mock AudioManager so scene tests can verify audio calls without real AudioContext.
 */
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

const { MockSettingsPanel, mockSettingsPanel, mockSettingsPanelDestroy } = vi.hoisted(() => {
  const mockSettingsPanelDestroy = vi.fn();
  class MockSettingsPanel {
    constructor(...args: unknown[]) {
      mockSettingsPanel(...args);
    }

    destroy(): void {
      mockSettingsPanelDestroy();
    }
  }
  return {
    MockSettingsPanel,
    mockSettingsPanel: vi.fn(),
    mockSettingsPanelDestroy,
  };
});

vi.mock("../../components/SettingsPanel", () => ({
  SettingsPanel: MockSettingsPanel,
}));

import { generatePathPoints } from "../../game/animalTraceLogic";
import { AnimalTraceScene } from "../../scenes/AnimalTraceScene";
import { BigSmallScene } from "../../scenes/BigSmallScene";
import { BootScene } from "../../scenes/BootScene";
import { HubScene } from "../../scenes/HubScene";
import { MusicalMemoryScene } from "../../scenes/MusicalMemoryScene";
import { PopFreezeScene } from "../../scenes/PopFreezeScene";
import { PreloadScene } from "../../scenes/PreloadScene";
import { ShadowMatchScene } from "../../scenes/ShadowMatchScene";
import { ShapeSorterScene } from "../../scenes/ShapeSorterScene";
import { earnSticker, hasSticker } from "../../utils/storage";

const GAME_SCENES = [
  { name: "ShapeSorterScene", SceneClass: ShapeSorterScene },
  { name: "AnimalTraceScene", SceneClass: AnimalTraceScene },
  { name: "PopFreezeScene", SceneClass: PopFreezeScene },
  { name: "ShadowMatchScene", SceneClass: ShadowMatchScene },
  { name: "MusicalMemoryScene", SceneClass: MusicalMemoryScene },
  { name: "BigSmallScene", SceneClass: BigSmallScene },
] as const;

const GAME_SCENE_KEYS = [
  "ShapeSorter",
  "AnimalTrace",
  "PopFreeze",
  "ShadowMatch",
  "MusicalMemory",
  "BigSmall",
] as const;

/** Casts a Phaser-typed method to a MockFn for mock assertions. */
function getMockFn(fn: unknown): MockFn {
  return fn as unknown as MockFn;
}

/** Collects all game objects created by scene.add.* methods. */
function getAllGameObjects(scene: unknown): Array<Record<string, MockFn>> {
  const add = (scene as { add: Record<string, unknown> }).add;
  const objects: Array<Record<string, MockFn>> = [];
  for (const method of Object.values(add)) {
    const mock = getMockFn(method);
    if (mock.mock?.results) {
      for (const result of mock.mock.results) {
        objects.push(result.value as Record<string, MockFn>);
      }
    }
  }
  return objects;
}

/** Verifies that a success interaction uses one bounded, self-cleaning visual effect. */
function assertBoundedSuccessEffect(scene: unknown, initialGraphicsCount: number): void {
  const add = (scene as { add: Record<string, unknown> }).add;
  const graphicsMock = getMockFn(add.graphics);
  expect(getMockFn(add.particles)).not.toHaveBeenCalled();
  expect(graphicsMock.mock.results.length).toBeGreaterThan(initialGraphicsCount);

  const effect = graphicsMock.mock.results[initialGraphicsCount]?.value as
    | Record<string, MockFn>
    | undefined;
  if (!effect) return;

  const tweenCalls = getMockFn((scene as { tweens: Record<string, unknown> }).tweens.add).mock
    .calls;
  const effectTween = tweenCalls.find((call) => call[0]?.targets === effect);
  expect(effectTween).toBeDefined();
  if (!effectTween) return;

  const config = effectTween[0] as { duration?: number; onComplete?: () => void };
  expect(config.duration).toBeLessThanOrEqual(800);
  expect(config.onComplete).toEqual(expect.any(Function));

  config.onComplete?.();
  expect(getMockFn(effect.destroy)).toHaveBeenCalledTimes(1);
}

/**
 * Verifies that a round completion plays the choreographed win celebration:
 * a growing/fading ray burst, drifting confetti bits, and no particle emitter.
 */
function assertWinCelebrationCreated(scene: unknown): void {
  const add = (scene as { add: Record<string, unknown> }).add;
  const tweenCalls = getMockFn((scene as { tweens: Record<string, unknown> }).tweens.add).mock
    .calls;

  // The ray burst grows and fades (motionScale(1.25, 1) under normal motion)
  expect(
    tweenCalls.some(
      (call) => call[0]?.scaleX === 1.25 && call[0]?.scaleY === 1.25 && call[0]?.alpha === 0,
    ),
  ).toBe(true);

  // Confetti bits drift and spin
  expect(tweenCalls.some((call) => typeof call[0]?.angle === "number")).toBe(true);

  // The celebration never uses a particle emitter
  expect(getMockFn(add.particles)).not.toHaveBeenCalled();
}

/** Triggers all pointerdown callbacks registered on game objects. */
function triggerAllPointerdowns(scene: unknown): void {
  const allObjects = getAllGameObjects(scene);
  for (const obj of allObjects) {
    const onMock = getMockFn(obj.on);
    const pointerdownCall = onMock.mock.calls.find((call) => call[0] === "pointerdown");
    if (pointerdownCall && typeof pointerdownCall[1] === "function") {
      pointerdownCall[1]();
    }
  }
}

/** Triggers all pointerup callbacks registered on game objects. */
function triggerAllPointerups(scene: unknown): void {
  const allObjects = getAllGameObjects(scene);
  for (const obj of allObjects) {
    const onMock = getMockFn(obj.on);
    const pointerupCall = onMock.mock.calls.find((call) => call[0] === "pointerup");
    if (pointerupCall && typeof pointerupCall[1] === "function") {
      pointerupCall[1]();
    }
  }
}

/** Triggers the shutdown event on a scene, invoking any registered shutdown callbacks. */
function triggerShutdown(scene: unknown): void {
  const events = (scene as { events: Record<string, unknown> }).events;
  const onMock = getMockFn(events.on);
  const shutdownCall = onMock.mock.calls.find((call) => call[0] === "shutdown");
  if (shutdownCall && typeof shutdownCall[1] === "function") {
    shutdownCall[1]();
  }
}

/**
 * Completes all pending scene transitions by invoking every camera fadeOut
 * callback registered so far. Scene starts are deferred until the fade-out
 * completes, so tests must call this before asserting navigation.
 */
function completeFadeOuts(scene: unknown): void {
  const cameras = (scene as { cameras: { main: Record<string, unknown> } }).cameras;
  const fadeOutMock = getMockFn(cameras.main.fadeOut);
  for (const call of fadeOutMock.mock.calls) {
    const callback = call[4] as (() => void) | undefined;
    callback?.();
  }
}

/** Returns true if any game object's off method was called. */
function anyObjectOffCalled(scene: unknown): boolean {
  const allObjects = getAllGameObjects(scene);
  return allObjects.some((obj) => {
    const offMock = obj.off as unknown as MockFn;
    return offMock?.mock?.calls?.length > 0;
  });
}

/** Returns the first text game object whose label contains the given text. */
function getTextObject(scene: unknown, labelPart: string): Record<string, MockFn> | undefined {
  const textMock = getMockFn((scene as { add: Record<string, unknown> }).add.text);
  for (let i = 0; i < textMock.mock.calls.length; i++) {
    const text = textMock.mock.calls[i][2] as string;
    if (typeof text === "string" && text.includes(labelPart)) {
      return textMock.mock.results[i].value as Record<string, MockFn>;
    }
  }
  return undefined;
}

/** Returns all rectangle game objects (the Hub tiles). */
function getRectangles(scene: unknown): Array<Record<string, MockFn>> {
  const rectangleMock = getMockFn((scene as { add: Record<string, unknown> }).add.rectangle);
  return rectangleMock.mock.results.map((result) => result.value as Record<string, MockFn>);
}

/** Returns image objects created with sticker_* texture keys (Hub shelf thumbnails). */
function getStickerImages(scene: unknown): Array<{ obj: Record<string, MockFn>; key: string }> {
  const imageMock = getMockFn((scene as { add: Record<string, unknown> }).add.image);
  const stickers: Array<{ obj: Record<string, MockFn>; key: string }> = [];
  for (let i = 0; i < imageMock.mock.calls.length; i++) {
    const key = imageMock.mock.calls[i][2] as string;
    if (typeof key === "string" && key.startsWith("sticker_")) {
      stickers.push({ obj: imageMock.mock.results[i].value as Record<string, MockFn>, key });
    }
  }
  return stickers;
}

/** Returns the sticker image object for the given texture key. */
function getStickerImage(scene: unknown, key: string): Record<string, MockFn> {
  const sticker = getStickerImages(scene).find((s) => s.key === key);
  if (!sticker) throw new Error(`Sticker ${key} not found`);
  return sticker.obj;
}

/** Fires every registered handler for an event on a game object. */
function fireAllObjectEvents(obj: Record<string, MockFn>, event: string): void {
  const onMock = getMockFn(obj.on);
  for (const call of onMock.mock.calls) {
    if (call[0] === event && typeof call[1] === "function") {
      call[1]();
    }
  }
}

/** Completes the Hub's staggered entrance tweens (invokes their onComplete). */
function completeHubEntrances(scene: unknown): void {
  const tweenCalls = getMockFn((scene as { tweens: Record<string, unknown> }).tweens.add).mock
    .calls;
  for (const call of tweenCalls) {
    const config = call[0] as { duration?: number; onComplete?: () => void };
    if (config.duration === 300 && typeof config.onComplete === "function") {
      config.onComplete();
    }
  }
}

/** Asserts that an interactive object exposes a 96x96 logical-pixel hit area. */
function expectTouchTargetSize(obj: Record<string, MockFn>): void {
  const setInteractiveMock = getMockFn(obj.setInteractive);
  const interactiveConfig = setInteractiveMock.mock.calls.find(
    (call) => call[0] && typeof call[0] === "object" && "hitArea" in call[0],
  )?.[0] as { hitArea: { width: number; height: number } } | undefined;
  expect(interactiveConfig).toBeDefined();
  expect(interactiveConfig?.hitArea.width).toBeGreaterThanOrEqual(96);
  expect(interactiveConfig?.hitArea.height).toBeGreaterThanOrEqual(96);
}

/**
 * Asserts that the interactive hit area is anchored at the top-left of the
 * control's display bounds (Phaser hit areas are origin-independent).
 */
function expectHitAreaOrigin(obj: Record<string, MockFn>, x: number, y: number): void {
  const setInteractiveMock = getMockFn(obj.setInteractive);
  const interactiveConfig = setInteractiveMock.mock.calls.find(
    (call) => call[0] && typeof call[0] === "object" && "hitArea" in call[0],
  )?.[0] as { hitArea: { x: number; y: number } } | undefined;
  expect(interactiveConfig).toBeDefined();
  expect(interactiveConfig?.hitArea.x).toBe(x);
  expect(interactiveConfig?.hitArea.y).toBe(y);
}

describe("scene navigation flow", () => {
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

  describe("BootScene", () => {
    it("transitions to PreloadScene on create", () => {
      const scene = new BootScene();
      scene.create();

      expect(getMockFn(scene.scene.start)).toHaveBeenCalledWith("Preload");
    });

    it("attempts to lock screen orientation to landscape", () => {
      const scene = new BootScene();
      scene.create();

      expect(screen.orientation.lock).toHaveBeenCalledWith("landscape");
    });

    it("handles orientation lock rejection gracefully", async () => {
      vi.stubGlobal("screen", {
        orientation: {
          lock: vi.fn().mockRejectedValue(new Error("NotSupported")),
          unlock: vi.fn(),
        },
      });

      const scene = new BootScene();
      scene.create();

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(getMockFn(scene.scene.start)).toHaveBeenCalledWith("Preload");
    });

    it("initializes the AudioManager on create", () => {
      const scene = new BootScene();
      scene.create();

      expect(mockAudio.init).toHaveBeenCalled();
    });
  });

  describe("PreloadScene", () => {
    it("sets up progress bar during preload", () => {
      const scene = new PreloadScene();
      scene.preload();

      expect(getMockFn(scene.load.on)).toHaveBeenCalledWith("progress", expect.any(Function));
      expect(getMockFn(scene.load.on)).toHaveBeenCalledWith("complete", expect.any(Function));
    });

    it("transitions to HubScene on create", () => {
      const scene = new PreloadScene();
      scene.create();
      completeFadeOuts(scene);

      expect(getMockFn(scene.scene.start)).toHaveBeenCalledWith("Hub");
    });

    it("updates progress bar display size on progress event", () => {
      const scene = new PreloadScene();
      scene.preload();

      const loadOnMock = getMockFn(scene.load.on);
      const progressCall = loadOnMock.mock.calls.find((call) => call[0] === "progress");
      const progressCallback = progressCall?.[1] as (value: number) => void;

      const progressBar = getMockFn(scene.add.rectangle).mock.results[0].value as Record<
        string,
        MockFn
      >;

      progressCallback(0.5);
      expect(getMockFn(progressBar.setDisplaySize)).toHaveBeenCalledWith(150, 30);
    });

    it("destroys progress bar elements on complete event", () => {
      const scene = new PreloadScene();
      scene.preload();

      const loadOnMock = getMockFn(scene.load.on);
      const completeCall = loadOnMock.mock.calls.find((call) => call[0] === "complete");
      const completeCallback = completeCall?.[1] as () => void;

      const progressBar = getMockFn(scene.add.rectangle).mock.results[0].value as Record<
        string,
        MockFn
      >;
      const progressBox = getMockFn(scene.add.rectangle).mock.results[1].value as Record<
        string,
        MockFn
      >;

      completeCallback();
      expect(getMockFn(progressBar.destroy)).toHaveBeenCalled();
      expect(getMockFn(progressBox.destroy)).toHaveBeenCalled();
    });

    it("loads all 44 shape, animal/food, toy, sticker, and bubble SVGs during preload", () => {
      const scene = new PreloadScene();
      scene.preload();

      const svgCalls = getMockFn(scene.load.svg).mock.calls;
      expect(svgCalls).toHaveLength(44);
    });

    it("loads shape SVGs with correct keys", () => {
      const scene = new PreloadScene();
      scene.preload();

      const svgCalls = getMockFn(scene.load.svg).mock.calls;
      const keys = svgCalls.map((call) => call[0] as string);

      expect(keys).toContain("shape_circle");
      expect(keys).toContain("shape_square");
      expect(keys).toContain("shape_triangle");
      expect(keys).toContain("shape_star");
      expect(keys).toContain("cutout_circle");
      expect(keys).toContain("cutout_square");
      expect(keys).toContain("cutout_triangle");
      expect(keys).toContain("cutout_star");
      expect(keys).toContain("sticker_shape_sorter");
    });

    it("loads animal and food SVGs with correct keys", () => {
      const scene = new PreloadScene();
      scene.preload();

      const svgCalls = getMockFn(scene.load.svg).mock.calls;
      const keys = svgCalls.map((call) => call[0] as string);

      expect(keys).toContain("animal_monkey");
      expect(keys).toContain("animal_rabbit");
      expect(keys).toContain("animal_cat");
      expect(keys).toContain("animal_dog");
      expect(keys).toContain("food_banana");
      expect(keys).toContain("food_carrot");
      expect(keys).toContain("food_fish");
      expect(keys).toContain("food_bone");
      expect(keys).toContain("sticker_animal_trace");
      expect(keys).toContain("bubble");
      expect(keys).toContain("sticker_pop_freeze");
    });

    it("passes explicit width and height for high-res rasterization", () => {
      const scene = new PreloadScene();
      scene.preload();

      const svgCalls = getMockFn(scene.load.svg).mock.calls;
      for (const call of svgCalls) {
        expect(call[2]).toEqual(
          expect.objectContaining({
            width: expect.any(Number),
            height: expect.any(Number),
          }),
        );
      }
    });
  });

  describe("HubScene", () => {
    it("opens SettingsPanel when the settings parental lock succeeds", () => {
      const scene = new HubScene();
      scene.create();

      triggerAllPointerdowns(scene);
      const holdCallback = getMockFn(scene.time.delayedCall).mock.calls.find(
        (call) => call[0] === 3000,
      )?.[1] as () => void;
      holdCallback();

      expect(mockSettingsPanel).toHaveBeenCalledWith(scene);
    });

    it("creates 6 game tiles", () => {
      const scene = new HubScene();
      scene.create();

      const allObjects = getAllGameObjects(scene);
      const interactiveObjects = allObjects.filter(
        (obj) => getMockFn(obj.setInteractive).mock.calls.length > 0,
      );

      expect(interactiveObjects.length).toBeGreaterThanOrEqual(6);
    });

    it("creates sticker book checking sticker status for each game", () => {
      earnSticker("shape-sorter");

      const scene = new HubScene();
      scene.create();

      expect(hasSticker).toHaveBeenCalledTimes(6);
    });

    it("navigates to each game scene when respective tile is clicked", () => {
      const scene = new HubScene();
      scene.create();

      triggerAllPointerups(scene);
      completeFadeOuts(scene);

      const startMock = getMockFn(scene.scene.start);
      const startedKeys = startMock.mock.calls.map((call) => call[0] as string);

      for (const key of GAME_SCENE_KEYS) {
        expect(startedKeys).toContain(key);
      }
    });

    it("resumes AudioManager when a tile is clicked", () => {
      const scene = new HubScene();
      scene.create();

      triggerAllPointerups(scene);

      expect(mockAudio.resume).toHaveBeenCalled();
    });

    it("starts BGM when a tile is clicked", () => {
      const scene = new HubScene();
      scene.create();

      triggerAllPointerups(scene);

      expect(mockAudio.playBGM).toHaveBeenCalled();
    });
  });

  describe("Hub engagement entrance and idle life", () => {
    it("staggers tile and sticker entrance tweens 40ms apart (300ms Sine.out each)", () => {
      const scene = new HubScene();
      scene.create();

      const tweenCalls = getMockFn(scene.tweens.add).mock.calls;
      const entranceTweens = tweenCalls
        .map(
          (call) => call[0] as { delay?: number; duration?: number; ease?: string; alpha?: number },
        )
        .filter(
          (config) =>
            config.duration === 300 &&
            typeof config.delay === "number" &&
            (config.alpha === 1 || config.alpha === 0.3),
        );

      expect(entranceTweens.length).toBeGreaterThanOrEqual(12);
      const delays = entranceTweens.map((config) => config.delay as number).sort((a, b) => a - b);
      for (let i = 1; i < delays.length; i++) {
        expect(delays[i] - delays[i - 1]).toBe(40);
      }
      for (const config of entranceTweens) {
        expect(config.ease).toBe("Sine.out");
      }
    });

    it("bobs tiles with phase-offset 2.5s ±4px sine loops", () => {
      const scene = new HubScene();
      scene.create();

      const tweenCalls = getMockFn(scene.tweens.add).mock.calls;
      const bobTweens = tweenCalls
        .map(
          (call) =>
            call[0] as {
              duration?: number;
              yoyo?: boolean;
              repeat?: number;
              ease?: string;
              delay?: number;
              y?: number;
            },
        )
        .filter(
          (config) => config.duration === 2500 && config.yoyo === true && config.repeat === -1,
        );

      expect(bobTweens).toHaveLength(6);
      const delays = new Set(bobTweens.map((config) => config.delay));
      expect(delays.size).toBe(6);

      const startY = (768 - 2 * 150 - 50) / 2;
      const expectedYs = [0, 1, 2, 3, 4, 5].map((i) => {
        const row = Math.floor(i / 3);
        return startY + row * 200 + 75 - 4;
      });
      const tweenYs = bobTweens.map((config) => config.y).sort((a, b) => (a ?? 0) - (b ?? 0));
      expect(tweenYs).toEqual(expectedYs.sort((a, b) => a - b));

      for (const config of bobTweens) {
        expect(config.ease).toBe("Sine.inOut");
      }
    });

    it("adds low-contrast drifting background decorations behind tiles", () => {
      const scene = new HubScene();
      scene.create();

      const circleMock = getMockFn(scene.add.circle);
      expect(circleMock.mock.calls.length).toBeGreaterThanOrEqual(4);
      for (const result of circleMock.mock.results) {
        const dot = result.value as Record<string, MockFn>;
        expect(getMockFn(dot.setDepth)).toHaveBeenCalledWith(-1);
      }

      const tweenCalls = getMockFn(scene.tweens.add).mock.calls;
      const driftTweens = tweenCalls
        .map((call) => call[0] as { duration?: number; yoyo?: boolean; repeat?: number })
        .filter(
          (config) =>
            config.duration !== undefined &&
            config.duration >= 4000 &&
            config.duration <= 6000 &&
            config.yoyo === true &&
            config.repeat === -1,
        );
      expect(driftTweens.length).toBeGreaterThanOrEqual(4);
    });

    it("under reduced motion: entrance fades only, no bob or drift", () => {
      vi.stubGlobal("window", {
        matchMedia: vi.fn(() => ({ matches: true })),
      });

      const scene = new HubScene();
      scene.create();

      const configs = getMockFn(scene.tweens.add).mock.calls.map(
        (call) => call[0] as Record<string, unknown>,
      );

      expect(configs.some((config) => config.duration === 2500 && config.yoyo === true)).toBe(
        false,
      );
      expect(
        configs.some(
          (config) =>
            typeof config.duration === "number" &&
            config.duration >= 4000 &&
            config.duration <= 6000 &&
            config.yoyo === true,
        ),
      ).toBe(false);

      const entranceTweens = configs.filter(
        (config) => config.duration === 300 && typeof config.delay === "number",
      );
      expect(entranceTweens.length).toBeGreaterThanOrEqual(12);
      for (const config of entranceTweens) {
        // Tiles/labels/earned stickers fade to 1; unearned stickers to 0.3.
        expect([1, 0.3]).toContain(config.alpha);
        expect("scaleX" in config).toBe(false);
        expect("scaleY" in config).toBe(false);
      }
    });
  });

  describe("Hub engagement tile press feedback", () => {
    it("squishes tiles to 95% on pointerdown and springs back with overshoot on release", () => {
      const scene = new HubScene();
      scene.create();
      completeHubEntrances(scene);

      const tile = getRectangles(scene)[0];
      fireAllObjectEvents(tile, "pointerdown");
      expect(getMockFn(tile.setScale)).toHaveBeenCalledWith(0.95);

      fireAllObjectEvents(tile, "pointerup");
      const tweenCalls = getMockFn(scene.tweens.add).mock.calls;
      const springTween = tweenCalls.find((call) => call[0]?.targets === tile);
      expect(springTween).toBeDefined();
      expect(springTween?.[0]?.scaleX).toBe(1);
      expect(springTween?.[0]?.scaleY).toBe(1);
      expect(springTween?.[0]?.ease).toBe("Back.out");
    });

    it("springs tiles back on pointerout and pointercancel", () => {
      const scene = new HubScene();
      scene.create();
      completeHubEntrances(scene);

      const tile = getRectangles(scene)[0];
      for (const event of ["pointerout", "pointercancel"]) {
        getMockFn(scene.tweens.add).mockClear();
        fireAllObjectEvents(tile, event);
        const springTween = getMockFn(scene.tweens.add).mock.calls.find(
          (call) => call[0]?.targets === tile && call[0]?.ease === "Back.out",
        );
        expect(springTween).toBeDefined();
      }
    });

    it("keeps tile taps navigating to games after press feedback is attached", () => {
      const scene = new HubScene();
      scene.create();
      completeHubEntrances(scene);

      triggerAllPointerups(scene);
      completeFadeOuts(scene);

      const startedKeys = getMockFn(scene.scene.start).mock.calls.map((call) => call[0] as string);
      for (const key of GAME_SCENE_KEYS) {
        expect(startedKeys).toContain(key);
      }
    });

    it("does not navigate while a tile is merely pressed (only on release)", () => {
      const scene = new HubScene();
      scene.create();
      completeHubEntrances(scene);

      triggerAllPointerdowns(scene);
      completeFadeOuts(scene);

      expect(getMockFn(scene.scene.start)).not.toHaveBeenCalled();
    });

    it("cancels navigation when the pointer leaves or cancels before release", () => {
      const scene = new HubScene();
      scene.create();
      completeHubEntrances(scene);

      const tile = getRectangles(scene)[0];
      fireAllObjectEvents(tile, "pointerdown");
      fireAllObjectEvents(tile, "pointerout");
      completeFadeOuts(scene);
      expect(getMockFn(scene.scene.start)).not.toHaveBeenCalled();

      const otherTile = getRectangles(scene)[1];
      fireAllObjectEvents(otherTile, "pointerdown");
      fireAllObjectEvents(otherTile, "pointercancel");
      completeFadeOuts(scene);
      expect(getMockFn(scene.scene.start)).not.toHaveBeenCalled();
    });

    it("does not attach press feedback to tiles under reduced motion", () => {
      vi.stubGlobal("window", {
        matchMedia: vi.fn(() => ({ matches: true })),
      });

      const scene = new HubScene();
      scene.create();
      completeHubEntrances(scene);

      const tile = getRectangles(scene)[0];
      fireAllObjectEvents(tile, "pointerdown");
      fireAllObjectEvents(tile, "pointerup");

      expect(getMockFn(tile.setScale)).not.toHaveBeenCalled();
      expect(getMockFn(scene.tweens.add).mock.calls.some((call) => call[0]?.targets === tile)).toBe(
        false,
      );
    });
  });

  describe("Hub engagement sticker shelf", () => {
    const STICKER_KEYS = [
      "sticker_shape_sorter",
      "sticker_animal_trace",
      "sticker_pop_freeze",
      "sticker_shadow_match",
      "sticker_musical_memory",
      "sticker_big_small",
    ];
    /** Sticker textures are rasterized at 512px; the shelf displays them at 56px. */
    const STICKER_BASE_SCALE = 56 / 512;

    it("replaces the star markers with one real sticker thumbnail per game (textless, touch-inert)", () => {
      const scene = new HubScene();
      scene.create();

      const stickers = getStickerImages(scene);
      expect(stickers).toHaveLength(6);
      expect(new Set(stickers.map((s) => s.key))).toEqual(new Set(STICKER_KEYS));

      // No ★/☆ text markers remain
      const textMock = getMockFn(scene.add.text);
      for (const call of textMock.mock.calls) {
        const text = call[2];
        if (typeof text === "string") {
          expect(text).not.toMatch(/[★☆]/);
        }
      }

      // Shelf is touch-inert
      for (const sticker of stickers) {
        expect(getMockFn(sticker.obj.setInteractive)).not.toHaveBeenCalled();
      }
    });

    it("earned stickers get a gentle sparkle loop", () => {
      earnSticker("shape-sorter");

      const scene = new HubScene();
      scene.create();
      completeHubEntrances(scene);

      const sticker = getStickerImage(scene, "sticker_shape_sorter");
      const tweenCalls = getMockFn(scene.tweens.add).mock.calls;
      const targetsSticker = (call: { targets?: unknown }): boolean => {
        const targets = call.targets;
        return Array.isArray(targets) ? targets.includes(sticker) : targets === sticker;
      };
      const entrance = tweenCalls.find((call) => targetsSticker(call[0]) && call[0]?.alpha === 1);
      expect(entrance).toBeDefined();
      // Entrances must land on the shelf base scale (56px from a 512px texture),
      // not scale 1 (which would render the texture full-size).
      expect(entrance?.[0]?.scaleX).toBeCloseTo(STICKER_BASE_SCALE, 5);
      expect(entrance?.[0]?.scaleY).toBeCloseTo(STICKER_BASE_SCALE, 5);
      const sparkle = tweenCalls.find(
        (call) => call[0]?.targets === sticker && call[0]?.repeat === -1,
      );
      expect(sparkle).toBeDefined();
    });

    it("unearned stickers are dimmed and have no sparkle", () => {
      const scene = new HubScene();
      scene.create();

      const sticker = getStickerImage(scene, "sticker_animal_trace");
      const tweenCalls = getMockFn(scene.tweens.add).mock.calls;
      const entrance = tweenCalls.find((call) => call[0]?.targets === sticker);
      expect(entrance).toBeDefined();
      expect(entrance?.[0]?.alpha).toBe(0.3);
      expect(entrance?.[0]?.scaleX).toBeCloseTo(0.85 * STICKER_BASE_SCALE, 5);
      expect(entrance?.[0]?.scaleY).toBeCloseTo(0.85 * STICKER_BASE_SCALE, 5);

      const sparkle = tweenCalls.find(
        (call) => call[0]?.targets === sticker && call[0]?.repeat === -1,
      );
      expect(sparkle).toBeUndefined();
    });

    it("gives the justEarned sticker a larger bounce and sparkle burst on entrance", () => {
      earnSticker("shape-sorter");

      const scene = new HubScene();
      scene.init({ justEarned: "shape-sorter" });
      scene.create();

      const sticker = getStickerImage(scene, "sticker_shape_sorter");
      const tweenCalls = getMockFn(scene.tweens.add).mock.calls;
      const entrance = tweenCalls.find(
        (call) => call[0]?.targets === sticker && call[0]?.alpha === 1,
      );
      expect(entrance).toBeDefined();
      expect(entrance?.[0]?.scaleX).toBeCloseTo(1.15 * STICKER_BASE_SCALE, 5);
      expect(entrance?.[0]?.scaleY).toBeCloseTo(1.15 * STICKER_BASE_SCALE, 5);
      expect(entrance?.[0]?.ease).toBe("Back.out");

      completeHubEntrances(scene);
      const burst = getMockFn(scene.tweens.add).mock.calls.find(
        (call) =>
          call[0]?.targets === sticker &&
          call[0]?.repeat === -1 &&
          typeof call[0]?.scaleX === "number",
      );
      expect(burst).toBeDefined();
      // The burst pulse must also stay at shelf scale (1.25x the 56px base).
      expect(burst?.[0]?.scaleX).toBeCloseTo(1.25 * STICKER_BASE_SCALE, 5);
    });

    it("under reduced motion: unearned stickers fade to dim alpha only (no scale)", () => {
      vi.stubGlobal("window", {
        matchMedia: vi.fn(() => ({ matches: true })),
      });

      const scene = new HubScene();
      scene.create();

      const sticker = getStickerImage(scene, "sticker_animal_trace");
      const entrance = getMockFn(scene.tweens.add).mock.calls.find(
        (call) => call[0]?.targets === sticker,
      );
      expect(entrance?.[0]?.alpha).toBe(0.3);
      expect("scaleX" in (entrance?.[0] ?? {})).toBe(false);
      expect("scaleY" in (entrance?.[0] ?? {})).toBe(false);
    });
  });

  describe("Hub engagement idle attract", () => {
    it("arms an idle attract timer ~25s after the scene is created", () => {
      const scene = new HubScene();
      scene.create();

      const idleCalls = getMockFn(scene.time.delayedCall).mock.calls.filter(
        (call) => call[0] === 25000,
      );
      expect(idleCalls.length).toBeGreaterThanOrEqual(1);
    });

    it("plays the idle call and wiggles all tiles when the idle timer fires", () => {
      const scene = new HubScene();
      scene.create();

      const idleCall = getMockFn(scene.time.delayedCall).mock.calls.find(
        (call) => call[0] === 25000,
      );
      expect(idleCall).toBeDefined();
      const callback = idleCall?.[1] as () => void;
      callback();

      expect(mockAudio.playIdleCall).toHaveBeenCalled();

      const wiggleTweens = getMockFn(scene.tweens.add).mock.calls.filter(
        (call) => call[0]?.angle !== undefined && call[0]?.repeat === -1,
      );
      expect(wiggleTweens.length).toBe(6);
    });

    it("repeats the idle call every ~10s while idle", () => {
      const scene = new HubScene();
      scene.create();

      const fireIdle = (delay: number): void => {
        const call = getMockFn(scene.time.delayedCall).mock.calls.find((c) => c[0] === delay);
        expect(call).toBeDefined();
        const callback = call?.[1] as () => void;
        callback();
      };

      fireIdle(25000);
      expect(mockAudio.playIdleCall).toHaveBeenCalledTimes(1);

      fireIdle(10000);
      expect(mockAudio.playIdleCall).toHaveBeenCalledTimes(2);
    });

    it("resets the idle timer on pointer input", () => {
      const scene = new HubScene();
      scene.create();

      const delayedCallMock = getMockFn(scene.time.delayedCall);
      const before = delayedCallMock.mock.calls.filter((call) => call[0] === 25000).length;

      const inputOnMock = getMockFn(scene.input.on);
      const pointerdownCall = inputOnMock.mock.calls.find((call) => call[0] === "pointerdown");
      expect(pointerdownCall).toBeDefined();
      if (pointerdownCall && typeof pointerdownCall[1] === "function") {
        (pointerdownCall[1] as () => void)();
      }

      const after = delayedCallMock.mock.calls.filter((call) => call[0] === 25000).length;
      expect(after).toBe(before + 1);
    });

    it("clears the idle timer on shutdown", () => {
      const scene = new HubScene();
      scene.create();

      const delayedCallMock = getMockFn(scene.time.delayedCall);
      const idleCallIndex = delayedCallMock.mock.calls.findIndex((call) => call[0] === 25000);
      const idleTimer = delayedCallMock.mock.results[idleCallIndex]?.value as {
        remove: MockFn;
      };
      expect(idleTimer).toBeDefined();

      triggerShutdown(scene);

      expect(getMockFn(idleTimer.remove)).toHaveBeenCalled();
    });

    it("does not duplicate wiggle targets when the scene is re-created", () => {
      const scene = new HubScene();
      scene.create();
      // Revisit — scene.start("Hub") runs create() again on the same instance.
      scene.create();

      const idleCall = getMockFn(scene.time.delayedCall).mock.calls.find(
        (call) => call[0] === 25000,
      );
      expect(idleCall).toBeDefined();
      const callback = idleCall?.[1] as () => void;
      callback();

      const wiggleTweens = getMockFn(scene.tweens.add).mock.calls.filter(
        (call) => call[0]?.angle !== undefined && call[0]?.repeat === -1,
      );
      expect(wiggleTweens.length).toBe(6);
    });

    it("under reduced motion: plays the idle call but does not wiggle tiles", () => {
      vi.stubGlobal("window", {
        matchMedia: vi.fn(() => ({ matches: true })),
      });

      const scene = new HubScene();
      scene.create();

      const idleCall = getMockFn(scene.time.delayedCall).mock.calls.find(
        (call) => call[0] === 25000,
      );
      const callback = idleCall?.[1] as () => void;
      callback();

      expect(mockAudio.playIdleCall).toHaveBeenCalled();
      const wiggleTweens = getMockFn(scene.tweens.add).mock.calls.filter(
        (call) => call[0]?.angle !== undefined && call[0]?.repeat === -1,
      );
      expect(wiggleTweens.length).toBe(0);
    });
  });

  describe("game scene stubs", () => {
    it.each(GAME_SCENES)(
      "navigates back to Hub via back button hold in $name",
      ({ SceneClass }) => {
        const scene = new SceneClass();
        scene.create();

        // Trigger pointerdown on the back button (starts ParentLock timer)
        triggerAllPointerdowns(scene);

        // Find ParentLock's delayedCall (3000ms default hold duration)
        const timeMock = getMockFn(scene.time.delayedCall);
        const parentLockCall = timeMock.mock.calls.find((call) => call[0] === 3000);

        if (!parentLockCall) {
          throw new Error("ParentLock delayedCall (3000ms) not found");
        }

        // Simulate hold completion (ParentLock success callback)
        const holdCallback = parentLockCall[1] as () => void;
        holdCallback();
        completeFadeOuts(scene);

        expect(getMockFn(scene.scene.start)).toHaveBeenCalledWith("Hub");
      },
    );
  });

  describe("protected control touch targets", () => {
    it.each(GAME_SCENES)("gives the Back control a 96x96 hit area in $name", ({ SceneClass }) => {
      const scene = new SceneClass();
      scene.create();

      const backButton = getTextObject(scene, "Back");
      if (!backButton) throw new Error("Back button not found");
      expectTouchTargetSize(backButton);
    });

    it("gives the Hub Settings control a 96x96 hit area", () => {
      const scene = new HubScene();
      scene.create();

      const settingsButton = getTextObject(scene, "Settings");
      if (!settingsButton) throw new Error("Settings button not found");
      expectTouchTargetSize(settingsButton);
      expectHitAreaOrigin(settingsButton, 0, 0);
    });

    it("gives the Musical Memory Replay control a 96x96 hit area", () => {
      const scene = new MusicalMemoryScene();
      scene.create();

      const replayButton = getTextObject(scene, "\uD83D\uDD04");
      if (!replayButton) throw new Error("Replay button not found");
      expectTouchTargetSize(replayButton);
      expectHitAreaOrigin(replayButton, 0, 0);
    });
  });

  describe("control press feedback", () => {
    /** Fires every event listener registered on the control. */
    function fireControlEvent(obj: Record<string, MockFn>, event: string): void {
      const callbacks = getMockFn(obj.on)
        .mock.calls.filter((call) => call[0] === event)
        .map((call) => call[1] as () => void);
      if (callbacks.length === 0) throw new Error(`no '${event}' listener registered on control`);
      for (const callback of callbacks) {
        callback();
      }
    }

    it.each(GAME_SCENES)(
      "squishes the Back control while pressed and restores it in $name",
      ({ SceneClass }) => {
        const scene = new SceneClass();
        scene.create();

        const backButton = getTextObject(scene, "Back");
        if (!backButton) throw new Error("Back button not found");

        fireControlEvent(backButton, "pointerdown");
        expect(getMockFn(backButton.setScale)).toHaveBeenCalledWith(0.95);
        fireControlEvent(backButton, "pointerup");
        expect(getMockFn(backButton.setScale)).toHaveBeenLastCalledWith(1);
      },
    );

    it("squishes the Hub Settings control while pressed and restores it on cancel", () => {
      const scene = new HubScene();
      scene.create();

      const settingsButton = getTextObject(scene, "Settings");
      if (!settingsButton) throw new Error("Settings button not found");

      fireControlEvent(settingsButton, "pointerdown");
      expect(getMockFn(settingsButton.setScale)).toHaveBeenCalledWith(0.95);
      fireControlEvent(settingsButton, "pointercancel");
      expect(getMockFn(settingsButton.setScale)).toHaveBeenLastCalledWith(1);
    });

    it("squishes the Musical Memory Replay control while pressed and restores it on pointerout", () => {
      const scene = new MusicalMemoryScene();
      scene.create();

      const replayButton = getTextObject(scene, "\uD83D\uDD04");
      if (!replayButton) throw new Error("Replay button not found");

      fireControlEvent(replayButton, "pointerdown");
      expect(getMockFn(replayButton.setScale)).toHaveBeenCalledWith(0.95);
      fireControlEvent(replayButton, "pointerout");
      expect(getMockFn(replayButton.setScale)).toHaveBeenLastCalledWith(1);
    });
  });

  describe("ShapeSorterScene round initialization", () => {
    it("creates 3 cutout slot images", () => {
      const scene = new ShapeSorterScene();
      scene.create();

      const imageCalls = getMockFn(scene.add.image).mock.calls;
      const slotKeys = imageCalls
        .map((call) => call[2] as string)
        .filter((key) => key.startsWith("cutout_"));
      expect(slotKeys).toHaveLength(3);
    });

    it("creates 3 shape images", () => {
      const scene = new ShapeSorterScene();
      scene.create();

      const imageCalls = getMockFn(scene.add.image).mock.calls;
      const shapeKeys = imageCalls
        .map((call) => call[2] as string)
        .filter((key) => key.startsWith("shape_"));
      expect(shapeKeys).toHaveLength(3);
    });

    it("makes shape images interactive for dragging", () => {
      const scene = new ShapeSorterScene();
      scene.create();

      const imageResults = getMockFn(scene.add.image).mock.results;
      const imageCalls = getMockFn(scene.add.image).mock.calls;
      const shapeResults = imageResults.filter((_result, index) => {
        const key = imageCalls[index][2] as string;
        return key.startsWith("shape_");
      });

      expect(shapeResults).toHaveLength(3);
      for (const result of shapeResults) {
        const obj = result.value as Record<string, MockFn>;
        expect(getMockFn(obj.setInteractive)).toHaveBeenCalled();
      }
    });
  });

  describe("ShapeSorterScene drag and drop", () => {
    /** Returns shape image objects with their types and origin positions. */
    function getShapes(scene: unknown): Array<{
      obj: Record<string, MockFn>;
      type: string;
      originX: number;
      originY: number;
    }> {
      const add = (scene as { add: Record<string, unknown> }).add;
      const imageMock = getMockFn(add.image);
      const results: Array<{
        obj: Record<string, MockFn>;
        type: string;
        originX: number;
        originY: number;
      }> = [];

      for (let i = 0; i < imageMock.mock.calls.length; i++) {
        const key = imageMock.mock.calls[i][2] as string;
        if (key.startsWith("shape_")) {
          results.push({
            obj: imageMock.mock.results[i].value as Record<string, MockFn>,
            type: key.replace("shape_", ""),
            originX: imageMock.mock.calls[i][0] as number,
            originY: imageMock.mock.calls[i][1] as number,
          });
        }
      }
      return results;
    }

    /** Returns slot zone objects with their types and positions. */
    function getSlots(scene: unknown): Array<{
      zone: Record<string, MockFn>;
      type: string;
      x: number;
      y: number;
    }> {
      const add = (scene as { add: Record<string, unknown> }).add;
      const imageMock = getMockFn(add.image);
      const zoneMock = getMockFn(add.zone);

      const slotTypes: string[] = [];
      for (let i = 0; i < imageMock.mock.calls.length; i++) {
        const key = imageMock.mock.calls[i][2] as string;
        if (key.startsWith("cutout_")) {
          slotTypes.push(key.replace("cutout_", ""));
        }
      }

      const results: Array<{
        zone: Record<string, MockFn>;
        type: string;
        x: number;
        y: number;
      }> = [];

      for (let i = 0; i < zoneMock.mock.results.length && i < slotTypes.length; i++) {
        results.push({
          zone: zoneMock.mock.results[i].value as Record<string, MockFn>,
          type: slotTypes[i],
          x: zoneMock.mock.calls[i][0] as number,
          y: zoneMock.mock.calls[i][1] as number,
        });
      }
      return results;
    }

    it("correct drop snaps shape to slot center, marks non-interactive, and shows bounded feedback", () => {
      const scene = new ShapeSorterScene();
      scene.create();

      const shapes = getShapes(scene);
      const slots = getSlots(scene);
      const initialGraphicsCount = getMockFn(scene.add.graphics).mock.results.length;
      const shape = shapes[0];
      const slot = slots.find((s) => s.type === shape.type);
      if (!slot) throw new Error("No matching slot found");

      // Simulate drop on matching zone
      const onCalls = getMockFn(shape.obj.on).mock.calls;
      const dropCall = onCalls.find((c) => c[0] === "drop");
      const dropCallback = dropCall?.[1] as (pointer: unknown, target: unknown) => void;
      dropCallback(null, slot.zone);

      // Correct drop animates to slot center via a 200ms Back.out snap tween
      // (no instant setPosition snap).
      const snapTween = getMockFn(scene.tweens.add).mock.calls.find(
        (call) =>
          call[0]?.targets === shape.obj &&
          call[0]?.x === slot.x &&
          call[0]?.y === slot.y &&
          call[0]?.ease === "Back.out",
      );
      expect(snapTween).toBeDefined();
      if (!snapTween) return;
      expect((snapTween[0] as { duration: number }).duration).toBe(200);
      expect(getMockFn(shape.obj.setPosition)).not.toHaveBeenCalledWith(slot.x, slot.y);
      expect(getMockFn(shape.obj.disableInteractive)).toHaveBeenCalled();
      expect(mockAudio.playCorrect).toHaveBeenCalled();
      assertBoundedSuccessEffect(scene, initialGraphicsCount);
    });

    it("uses a reduced-motion success effect when requested", () => {
      vi.stubGlobal("window", {
        matchMedia: vi.fn(() => ({ matches: true })),
      });

      const scene = new ShapeSorterScene();
      scene.create();

      const shapes = getShapes(scene);
      const slots = getSlots(scene);
      const initialGraphicsCount = getMockFn(scene.add.graphics).mock.results.length;
      const shape = shapes[0];
      const slot = slots.find((s) => s.type === shape.type);
      if (!slot) throw new Error("No matching slot found");

      const dropCall = getMockFn(shape.obj.on).mock.calls.find((call) => call[0] === "drop");
      const dropCallback = dropCall?.[1] as (pointer: unknown, target: unknown) => void;
      dropCallback(null, slot.zone);

      assertBoundedSuccessEffect(scene, initialGraphicsCount);
      const graphicsMock = getMockFn(scene.add.graphics);
      const effect = graphicsMock.mock.results[initialGraphicsCount].value as Record<
        string,
        MockFn
      >;
      const effectTween = getMockFn(scene.tweens.add).mock.calls.find(
        (call) => call[0]?.targets === effect,
      );
      expect(effectTween).toBeDefined();
      if (!effectTween) return;
      expect((effectTween[0] as { duration: number }).duration).toBeLessThanOrEqual(300);
    });

    it("incorrect drop bounces shape back to origin with wobble (no penalty)", () => {
      const scene = new ShapeSorterScene();
      scene.create();

      const shapes = getShapes(scene);
      const shape = shapes[0];

      // Simulate dragend without prior drop (dropped outside any zone)
      const onCalls = getMockFn(shape.obj.on).mock.calls;
      const dragendCall = onCalls.find((c) => c[0] === "dragend");
      const dragendCallback = dragendCall?.[1] as () => void;
      dragendCallback();

      // Verify bounce-back tween targets origin position
      const tweenCalls = getMockFn(scene.tweens.add).mock.calls;
      const shapeTween = tweenCalls.find((c) => c[0]?.targets === shape.obj);
      expect(shapeTween).toBeDefined();
      expect(shapeTween[0].x).toBe(shape.originX);
      expect(shapeTween[0].y).toBe(shape.originY);

      expect(mockAudio.playIncorrect).toHaveBeenCalled();
      // No penalty — scene not restarted
      expect(getMockFn(scene.scene.start)).not.toHaveBeenCalled();
    });

    it("uses a reduced-motion bounce-back when requested", () => {
      vi.stubGlobal("window", {
        matchMedia: vi.fn(() => ({ matches: true })),
      });

      const scene = new ShapeSorterScene();
      scene.create();

      const shapes = getShapes(scene);
      const shape = shapes[0];

      const onCalls = getMockFn(shape.obj.on).mock.calls;
      const dragendCall = onCalls.find((c) => c[0] === "dragend");
      const dragendCallback = dragendCall?.[1] as () => void;
      dragendCallback();

      const tweenCalls = getMockFn(scene.tweens.add).mock.calls;
      const bounceTween = tweenCalls.find((c) => c[0]?.targets === shape.obj);
      expect(bounceTween).toBeDefined();
      if (!bounceTween) return;
      expect((bounceTween[0] as { duration: number }).duration).toBe(180);
    });

    it("lifts and tilts the shape on drag start and restores it on drag end", () => {
      const scene = new ShapeSorterScene();
      scene.create();

      const shapes = getShapes(scene);
      const shape = shapes[0];
      const onCalls = getMockFn(shape.obj.on).mock.calls;

      const dragstartCallback = onCalls.find((c) => c[0] === "dragstart")?.[1] as () => void;
      expect(dragstartCallback).toBeDefined();
      dragstartCallback();

      const liftTween = getMockFn(scene.tweens.add).mock.calls.find(
        (c) => c[0]?.targets === shape.obj && c[0]?.angle === 4,
      );
      expect(liftTween).toBeDefined();
      if (!liftTween) return;
      expect(liftTween[0].scaleX).toBe(1.1);
      expect(liftTween[0].scaleY).toBe(1.1);

      // Both dragend listeners fire in the real game: the scene's bounce-back
      // handler (game logic) and the drag-lift restore (juice).
      const dragendCallbacks = onCalls
        .filter((c) => c[0] === "dragend")
        .map((c) => c[1] as () => void);
      dragendCallbacks.forEach((callback) => {
        callback();
      });

      const restoreTween = getMockFn(scene.tweens.add).mock.calls.find(
        (c) => c[0]?.targets === shape.obj && c[0]?.scaleX === 1 && c[0]?.scaleY === 1,
      );
      expect(restoreTween).toBeDefined();
      expect(restoreTween?.[0]?.angle).toBe(0);
    });

    it("uses a reduced-motion lift (1.05 scale, no tilt) when requested", () => {
      vi.stubGlobal("window", {
        matchMedia: vi.fn(() => ({ matches: true })),
      });

      const scene = new ShapeSorterScene();
      scene.create();

      const shapes = getShapes(scene);
      const shape = shapes[0];
      const dragstartCallback = getMockFn(shape.obj.on).mock.calls.find(
        (c) => c[0] === "dragstart",
      )?.[1] as () => void;
      dragstartCallback();

      const liftTween = getMockFn(scene.tweens.add).mock.calls.find(
        (c) => c[0]?.targets === shape.obj && c[0]?.scaleX === 1.05,
      );
      expect(liftTween).toBeDefined();
      if (!liftTween) return;
      expect(liftTween[0].angle).toBe(0);
    });

    it("pulses a soft outline on the drop zone while dragging over it and clears on leave", () => {
      const scene = new ShapeSorterScene();
      scene.create();

      const slots = getSlots(scene);
      const inputOnMock = getMockFn(scene.input.on);
      const dragenterCallback = inputOnMock.mock.calls.find((c) => c[0] === "dragenter")?.[1] as
        | ((pointer: unknown, obj: unknown, zone: unknown) => void)
        | undefined;
      expect(dragenterCallback).toBeDefined();
      if (!dragenterCallback) return;

      const initialGraphicsCount = getMockFn(scene.add.graphics).mock.results.length;
      dragenterCallback(null, null, slots[0].zone);

      const highlight = getMockFn(scene.add.graphics).mock.results[initialGraphicsCount]?.value as
        | Record<string, MockFn>
        | undefined;
      expect(highlight).toBeDefined();
      if (!highlight) return;
      expect(getMockFn(highlight.strokeRect)).toHaveBeenCalled();

      const pulseTween = getMockFn(scene.tweens.add).mock.calls.find(
        (call) => call[0]?.targets === highlight && call[0]?.repeat === -1,
      );
      expect(pulseTween).toBeDefined();
      expect(pulseTween?.[0]?.yoyo).toBe(true);

      const dragleaveCallback = inputOnMock.mock.calls.find((c) => c[0] === "dragleave")?.[1] as
        | ((pointer: unknown, obj: unknown, zone: unknown) => void)
        | undefined;
      expect(dragleaveCallback).toBeDefined();
      if (!dragleaveCallback) return;
      dragleaveCallback(null, null, slots[0].zone);

      expect(getMockFn(highlight.destroy)).toHaveBeenCalledTimes(1);
    });

    it("drop on non-slot target is a no-op (no snap, no SFX, no particles)", () => {
      const scene = new ShapeSorterScene();
      scene.create();

      const shapes = getShapes(scene);
      const shape = shapes[0];

      // Simulate drop on an invalid target (not a registered zone)
      const onCalls = getMockFn(shape.obj.on).mock.calls;
      const dropCall = onCalls.find((c) => c[0] === "drop");
      const dropCallback = dropCall?.[1] as (pointer: unknown, target: unknown) => void;
      dropCallback(null, {});

      expect(getMockFn(shape.obj.disableInteractive)).not.toHaveBeenCalled();
      expect(mockAudio.playCorrect).not.toHaveBeenCalled();
      expect(getMockFn(scene.add.particles)).not.toHaveBeenCalled();
    });

    it("creates touch targets meeting 64x64px minimum", () => {
      const scene = new ShapeSorterScene();
      scene.create();

      const shapes = getShapes(scene);
      expect(shapes.length).toBe(3);

      for (const shape of shapes) {
        const setDisplaySizeCalls = getMockFn(shape.obj.setDisplaySize).mock.calls;
        for (const call of setDisplaySizeCalls) {
          expect(call[0]).toBeGreaterThanOrEqual(64);
          expect(call[1]).toBeGreaterThanOrEqual(64);
        }
      }
    });
  });

  describe("ShapeSorterScene completion and sticker flow", () => {
    /** Returns shape image objects with their types. */
    function getShapeObjects(scene: unknown): Array<{ obj: Record<string, MockFn>; type: string }> {
      const add = (scene as { add: Record<string, unknown> }).add;
      const imageMock = getMockFn(add.image);
      const results: Array<{ obj: Record<string, MockFn>; type: string }> = [];

      for (let i = 0; i < imageMock.mock.calls.length; i++) {
        const key = imageMock.mock.calls[i][2] as string;
        if (key.startsWith("shape_")) {
          results.push({
            obj: imageMock.mock.results[i].value as Record<string, MockFn>,
            type: key.replace("shape_", ""),
          });
        }
      }
      return results;
    }

    /** Returns slot zone objects with their types. */
    function getSlotZones(scene: unknown): Array<{ zone: Record<string, MockFn>; type: string }> {
      const add = (scene as { add: Record<string, unknown> }).add;
      const imageMock = getMockFn(add.image);
      const zoneMock = getMockFn(add.zone);

      const slotTypes: string[] = [];
      for (let i = 0; i < imageMock.mock.calls.length; i++) {
        const key = imageMock.mock.calls[i][2] as string;
        if (key.startsWith("cutout_")) {
          slotTypes.push(key.replace("cutout_", ""));
        }
      }

      const results: Array<{ zone: Record<string, MockFn>; type: string }> = [];

      for (let i = 0; i < zoneMock.mock.results.length && i < slotTypes.length; i++) {
        results.push({
          zone: zoneMock.mock.results[i].value as Record<string, MockFn>,
          type: slotTypes[i],
        });
      }
      return results;
    }

    /** Simulates dropping all shapes on their matching slots. */
    function completeAllShapes(scene: ShapeSorterScene): void {
      const shapes = getShapeObjects(scene);
      const slots = getSlotZones(scene);
      for (const shape of shapes) {
        const slot = slots.find((s) => s.type === shape.type);
        if (!slot) throw new Error("No matching slot found");
        const onCalls = getMockFn(shape.obj.on).mock.calls;
        const dropCall = onCalls.find((c) => c[0] === "drop");
        const dropCallback = dropCall?.[1] as (pointer: unknown, target: unknown) => void;
        dropCallback(null, slot.zone);
      }
    }

    it("plays win SFX when all shapes are placed", () => {
      vi.mocked(hasSticker).mockReturnValue(false);

      const scene = new ShapeSorterScene();
      scene.create();
      completeAllShapes(scene);

      expect(mockAudio.playWin).toHaveBeenCalled();
    });

    it("awards sticker on first completion only", () => {
      vi.mocked(hasSticker).mockReturnValue(false);

      const scene = new ShapeSorterScene();
      scene.create();
      completeAllShapes(scene);

      expect(earnSticker).toHaveBeenCalledWith("shape-sorter");
      expect(mockAudio.playSticker).toHaveBeenCalled();
    });

    it("does not re-award sticker on replay", () => {
      vi.mocked(hasSticker).mockReturnValue(true);

      const scene = new ShapeSorterScene();
      scene.create();
      completeAllShapes(scene);

      expect(earnSticker).not.toHaveBeenCalled();
      expect(mockAudio.playSticker).not.toHaveBeenCalled();
    });

    it("auto-returns to Hub after 3s delay", () => {
      vi.mocked(hasSticker).mockReturnValue(false);

      const scene = new ShapeSorterScene();
      scene.create();
      completeAllShapes(scene);

      const delayedCallMock = getMockFn(scene.time.delayedCall);
      const autoReturnCall = delayedCallMock.mock.calls.find((call) => call[0] === 3000);
      expect(autoReturnCall).toBeDefined();

      const callback = autoReturnCall?.[1] as () => void;
      callback();
      completeFadeOuts(scene);

      expect(getMockFn(scene.scene.start)).toHaveBeenCalledWith("Hub", {
        justEarned: "shape-sorter",
      });
    });

    it("passes no justEarned data on replay auto-return", () => {
      vi.mocked(hasSticker).mockReturnValue(true);

      const scene = new ShapeSorterScene();
      scene.create();
      completeAllShapes(scene);

      const delayedCallMock = getMockFn(scene.time.delayedCall);
      const autoReturnCall = delayedCallMock.mock.calls.find((call) => call[0] === 3000);
      const callback = autoReturnCall?.[1] as () => void;
      callback();
      completeFadeOuts(scene);

      expect(getMockFn(scene.scene.start)).toHaveBeenCalledWith("Hub");
    });
  });

  describe("AnimalTraceScene path tracing", () => {
    /** Layout constants matching the scene implementation. */
    const ANIMAL_X = 200;
    const FOOD_X = 824;
    const SPRITE_Y = 384;
    const PATH_POINTS = 6;

    beforeEach(() => {
      // Deterministic Math.random so test helper's generatePathPoints
      // matches the scene's internal generatePathPoints call
      vi.spyOn(Math, "random").mockReturnValue(0.5);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    /** Returns the input callback registered for a given event name. */
    function getInputCallback(scene: unknown, eventName: string): (...args: unknown[]) => void {
      const inputOnMock = getMockFn((scene as { input: Record<string, unknown> }).input.on);
      const call = inputOnMock.mock.calls.find((c) => c[0] === eventName);
      if (!call || typeof call[1] !== "function") {
        throw new Error(`Input callback for "${eventName}" not found`);
      }
      return call[1] as (...args: unknown[]) => void;
    }

    /** Returns the animal image game object created by the scene. */
    function getAnimalSprite(scene: unknown): Record<string, MockFn> {
      const imageMock = getMockFn((scene as { add: Record<string, unknown> }).add.image);
      for (let i = 0; i < imageMock.mock.calls.length; i++) {
        const key = imageMock.mock.calls[i][2] as string;
        if (key.startsWith("animal_")) {
          return imageMock.mock.results[i].value as Record<string, MockFn>;
        }
      }
      throw new Error("Animal sprite not found");
    }

    /** Returns the food image game object created by the scene. */
    function getFoodSprite(scene: unknown): Record<string, MockFn> {
      const imageMock = getMockFn((scene as { add: Record<string, unknown> }).add.image);
      for (let i = 0; i < imageMock.mock.calls.length; i++) {
        const key = imageMock.mock.calls[i][2] as string;
        if (key.startsWith("food_")) {
          return imageMock.mock.results[i].value as Record<string, MockFn>;
        }
      }
      throw new Error("Food sprite not found");
    }

    /** Simulates tracing the entire path by advancing through all points. */
    function completePath(scene: unknown): void {
      const pathPoints = generatePathPoints(ANIMAL_X, SPRITE_Y, FOOD_X, SPRITE_Y, PATH_POINTS);
      const pointerdown = getInputCallback(scene, "pointerdown");
      const pointermove = getInputCallback(scene, "pointermove");

      pointerdown({ x: pathPoints[0].x, y: pathPoints[0].y });
      for (let i = 1; i < pathPoints.length; i++) {
        pointermove({ x: pathPoints[i].x, y: pathPoints[i].y });
      }
    }

    it("creates animal and food images for the first pair", () => {
      const scene = new AnimalTraceScene();
      scene.create();

      const imageCalls = getMockFn(scene.add.image).mock.calls;
      const keys = imageCalls.map((call) => call[2] as string);

      expect(keys.some((k) => k.startsWith("animal_"))).toBe(true);
      expect(keys.some((k) => k.startsWith("food_"))).toBe(true);
    });

    it("creates a graphics object for the dotted path", () => {
      const scene = new AnimalTraceScene();
      scene.create();

      expect(getMockFn(scene.add.graphics)).toHaveBeenCalled();
    });

    it("registers pointerdown, pointermove, and pointerup handlers", () => {
      const scene = new AnimalTraceScene();
      scene.create();

      const inputOnMock = getMockFn(scene.input.on);
      const events = inputOnMock.mock.calls.map((call) => call[0] as string);

      expect(events).toContain("pointerdown");
      expect(events).toContain("pointermove");
      expect(events).toContain("pointerup");
    });

    it("pointermove near next path point advances animal sprite", () => {
      const scene = new AnimalTraceScene();
      scene.create();

      const pathPoints = generatePathPoints(ANIMAL_X, SPRITE_Y, FOOD_X, SPRITE_Y, PATH_POINTS);
      const animalSprite = getAnimalSprite(scene);

      const pointerdown = getInputCallback(scene, "pointerdown");
      const pointermove = getInputCallback(scene, "pointermove");

      pointerdown({ x: pathPoints[0].x, y: pathPoints[0].y });
      pointermove({ x: pathPoints[1].x, y: pathPoints[1].y });

      // Animal hops toward the next waypoint with a 6px arc (apex tween)
      const hopTween = getMockFn(scene.tweens.add).mock.calls.find(
        (c) => c[0]?.targets === animalSprite && c[0]?.x === pathPoints[1].x,
      );
      expect(hopTween).toBeDefined();
      if (!hopTween) return;
      expect(hopTween[0].y).toBe(pathPoints[1].y - 6);
      expect(hopTween[0].duration).toBe(60);
      expect(hopTween[0].ease).toBe("Sine.inOut");
    });

    it("pointer far from path does not advance animal", () => {
      const scene = new AnimalTraceScene();
      scene.create();

      const animalSprite = getAnimalSprite(scene);

      const pointerdown = getInputCallback(scene, "pointerdown");
      const pointermove = getInputCallback(scene, "pointermove");

      pointerdown({ x: 500, y: 100 });
      pointermove({ x: 600, y: 100 });

      // Animal should not have hopped at all
      expect(
        getMockFn(scene.tweens.add).mock.calls.some((c) => c[0]?.targets === animalSprite),
      ).toBe(false);
    });

    it("pointerup pauses animal — no position reset", () => {
      const scene = new AnimalTraceScene();
      scene.create();

      const pathPoints = generatePathPoints(ANIMAL_X, SPRITE_Y, FOOD_X, SPRITE_Y, PATH_POINTS);
      const animalSprite = getAnimalSprite(scene);

      const pointerdown = getInputCallback(scene, "pointerdown");
      const pointermove = getInputCallback(scene, "pointermove");
      const pointerup = getInputCallback(scene, "pointerup");

      // Advance to point 1
      pointerdown({ x: pathPoints[0].x, y: pathPoints[0].y });
      pointermove({ x: pathPoints[1].x, y: pathPoints[1].y });

      // Pointer up (pause)
      pointerup();

      // Move pointer near point 2 while pointer is up — should not advance
      pointermove({ x: pathPoints[2].x, y: pathPoints[2].y });

      // Animal should still be hopping to point 1 (only one hop tween created)
      const hopTweens = getMockFn(scene.tweens.add).mock.calls.filter(
        (c) => c[0]?.targets === animalSprite,
      );
      expect(hopTweens).toHaveLength(1);
      const onlyHop = hopTweens[0];
      expect(onlyHop).toBeDefined();
      if (!onlyHop) return;
      expect(onlyHop[0].x).toBe(pathPoints[1].x);
    });

    it("resume continues from current position after pointer lift", () => {
      const scene = new AnimalTraceScene();
      scene.create();

      const pathPoints = generatePathPoints(ANIMAL_X, SPRITE_Y, FOOD_X, SPRITE_Y, PATH_POINTS);
      const animalSprite = getAnimalSprite(scene);

      const pointerdown = getInputCallback(scene, "pointerdown");
      const pointermove = getInputCallback(scene, "pointermove");
      const pointerup = getInputCallback(scene, "pointerup");

      // Advance to point 1, then pause
      pointerdown({ x: pathPoints[0].x, y: pathPoints[0].y });
      pointermove({ x: pathPoints[1].x, y: pathPoints[1].y });
      pointerup();

      // Resume — pointer down near current position, move to point 2
      pointerdown({ x: pathPoints[1].x, y: pathPoints[1].y });
      pointermove({ x: pathPoints[2].x, y: pathPoints[2].y });

      // Animal should now be hopping to point 2 (second hop tween created)
      const hopTweens = getMockFn(scene.tweens.add).mock.calls.filter(
        (c) => c[0]?.targets === animalSprite,
      );
      expect(hopTweens).toHaveLength(2);
      const secondHop = hopTweens[1];
      expect(secondHop).toBeDefined();
      if (!secondHop) return;
      expect(secondHop[0].x).toBe(pathPoints[2].x);
    });

    it("reaching food triggers correct SFX + bounded success feedback", () => {
      const scene = new AnimalTraceScene();
      scene.create();

      const initialGraphicsCount = getMockFn(scene.add.graphics).mock.results.length;
      completePath(scene);

      expect(mockAudio.playCorrect).toHaveBeenCalled();
      assertBoundedSuccessEffect(scene, initialGraphicsCount);
    });

    it("no SFX during tracing (only on path completion)", () => {
      const scene = new AnimalTraceScene();
      scene.create();

      const pathPoints = generatePathPoints(ANIMAL_X, SPRITE_Y, FOOD_X, SPRITE_Y, PATH_POINTS);
      const pointerdown = getInputCallback(scene, "pointerdown");
      const pointermove = getInputCallback(scene, "pointermove");

      pointerdown({ x: pathPoints[0].x, y: pathPoints[0].y });
      pointermove({ x: pathPoints[1].x, y: pathPoints[1].y });
      pointermove({ x: pathPoints[2].x, y: pathPoints[2].y });

      expect(mockAudio.playCorrect).not.toHaveBeenCalled();
      expect(mockAudio.playIncorrect).not.toHaveBeenCalled();
    });

    it("trace tolerance is generous (pointer within 60px of target advances)", () => {
      const scene = new AnimalTraceScene();
      scene.create();

      const pathPoints = generatePathPoints(ANIMAL_X, SPRITE_Y, FOOD_X, SPRITE_Y, PATH_POINTS);
      const animalSprite = getAnimalSprite(scene);

      const pointerdown = getInputCallback(scene, "pointerdown");
      const pointermove = getInputCallback(scene, "pointermove");

      pointerdown({ x: pathPoints[0].x, y: pathPoints[0].y });

      // Move to 40px before point 1 in x (within 60px tolerance)
      pointermove({ x: pathPoints[1].x - 40, y: pathPoints[1].y });

      const hopTween = getMockFn(scene.tweens.add).mock.calls.find(
        (c) => c[0]?.targets === animalSprite && c[0]?.x === pathPoints[1].x,
      );
      expect(hopTween).toBeDefined();
      if (!hopTween) return;
      expect(hopTween[0].y).toBe(pathPoints[1].y - 6);
    });

    it("advances to next pair after path completion", () => {
      const scene = new AnimalTraceScene();
      scene.create();

      completePath(scene);

      // Find the delayedCall for advancing to next pair (1000ms)
      const delayedCallMock = getMockFn(scene.time.delayedCall);
      const advanceCall = delayedCallMock.mock.calls.find((call) => call[0] === 1000);
      expect(advanceCall).toBeDefined();

      const imageCountBefore = getMockFn(scene.add.image).mock.calls.length;

      // Trigger the advance callback
      const callback = advanceCall?.[1] as () => void;
      callback();

      // New animal and food images should have been created
      const imageCountAfter = getMockFn(scene.add.image).mock.calls.length;
      expect(imageCountAfter).toBeGreaterThan(imageCountBefore);
    });

    it("cleans success feedback after its bounded animation", () => {
      const scene = new AnimalTraceScene();
      scene.create();

      const initialGraphicsCount = getMockFn(scene.add.graphics).mock.results.length;
      completePath(scene);

      assertBoundedSuccessEffect(scene, initialGraphicsCount);
    });

    it("lands the animal on the waypoint after the hop arc completes", () => {
      const scene = new AnimalTraceScene();
      scene.create();

      const pathPoints = generatePathPoints(ANIMAL_X, SPRITE_Y, FOOD_X, SPRITE_Y, PATH_POINTS);
      const animalSprite = getAnimalSprite(scene);

      const pointerdown = getInputCallback(scene, "pointerdown");
      const pointermove = getInputCallback(scene, "pointermove");

      pointerdown({ x: pathPoints[0].x, y: pathPoints[0].y });
      pointermove({ x: pathPoints[1].x, y: pathPoints[1].y });

      const apexTween = getMockFn(scene.tweens.add).mock.calls.find(
        (c) => c[0]?.targets === animalSprite && c[0]?.y === pathPoints[1].y - 6,
      );
      expect(apexTween).toBeDefined();
      if (!apexTween) return;

      // Apex tween schedules a landing tween back to the waypoint y
      const onComplete = (apexTween[0] as { onComplete?: () => void }).onComplete;
      expect(onComplete).toEqual(expect.any(Function));
      onComplete?.();

      const landingTween = getMockFn(scene.tweens.add).mock.calls.find(
        (c) =>
          c[0]?.targets === animalSprite &&
          c[0]?.y === pathPoints[1].y &&
          c[0]?.duration === 60 &&
          c[0]?.x === undefined,
      );
      expect(landingTween).toBeDefined();
      if (!landingTween) return;
      expect(landingTween[0].ease).toBe("Sine.inOut");
    });

    it("uses a reduced-motion hop (no arc, shorter duration) when requested", () => {
      vi.stubGlobal("window", { matchMedia: vi.fn(() => ({ matches: true })) });

      const scene = new AnimalTraceScene();
      scene.create();

      const pathPoints = generatePathPoints(ANIMAL_X, SPRITE_Y, FOOD_X, SPRITE_Y, PATH_POINTS);
      const animalSprite = getAnimalSprite(scene);

      const pointerdown = getInputCallback(scene, "pointerdown");
      const pointermove = getInputCallback(scene, "pointermove");

      pointerdown({ x: pathPoints[0].x, y: pathPoints[0].y });
      pointermove({ x: pathPoints[1].x, y: pathPoints[1].y });

      const hopTween = getMockFn(scene.tweens.add).mock.calls.find(
        (c) => c[0]?.targets === animalSprite && c[0]?.x === pathPoints[1].x,
      );
      expect(hopTween).toBeDefined();
      if (!hopTween) return;
      expect(hopTween[0].y).toBe(pathPoints[1].y); // no arc
      expect(hopTween[0].duration).toBe(36);

      expect(
        getMockFn(scene.tweens.add).mock.calls.some((c) => c[0]?.y === pathPoints[1].y - 6),
      ).toBe(false);
    });

    it("wiggles the food sprite when the path is completed", () => {
      const scene = new AnimalTraceScene();
      scene.create();

      const foodSprite = getFoodSprite(scene);
      completePath(scene);

      const wiggleTween = getMockFn(scene.tweens.add).mock.calls.find(
        (c) =>
          c[0]?.targets === foodSprite &&
          c[0]?.angle === 4 &&
          c[0]?.yoyo === true &&
          c[0]?.repeat === 3,
      );
      expect(wiggleTween).toBeDefined();
      if (!wiggleTween) return;
      expect(wiggleTween[0].duration).toBe(200);
      expect(wiggleTween[0].ease).toBe("Sine.inOut");
    });

    it("uses a gentler reduced-motion food wiggle", () => {
      vi.stubGlobal("window", { matchMedia: vi.fn(() => ({ matches: true })) });

      const scene = new AnimalTraceScene();
      scene.create();

      const foodSprite = getFoodSprite(scene);
      completePath(scene);

      const wiggleTween = getMockFn(scene.tweens.add).mock.calls.find(
        (c) => c[0]?.targets === foodSprite,
      );
      expect(wiggleTween).toBeDefined();
      if (!wiggleTween) return;
      expect(wiggleTween[0].angle).toBe(2);
      expect(wiggleTween[0].duration).toBe(120);
    });

    it("pops the progress dot with a scale bounce when a path is completed", () => {
      const scene = new AnimalTraceScene();
      scene.create();

      const circleMock = getMockFn(scene.add.circle);
      const dots = circleMock.mock.results.map((r) => r.value as Record<string, MockFn>);

      completePath(scene);

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

      const scene = new AnimalTraceScene();
      scene.create();

      const circleMock = getMockFn(scene.add.circle);
      const dots = circleMock.mock.results.map((r) => r.value as Record<string, MockFn>);

      completePath(scene);

      const popTween = getMockFn(scene.tweens.add).mock.calls.find(
        (c) => c[0]?.targets === dots[0],
      );
      expect(popTween).toBeDefined();
      if (!popTween) return;
      expect(popTween[0].scaleX).toBe(1.2);
      expect(popTween[0].duration).toBe(150);
    });
  });

  describe("AnimalTraceScene completion and sticker flow", () => {
    /** Layout constants matching the scene implementation. */
    const ANIMAL_X = 200;
    const FOOD_X = 824;
    const SPRITE_Y = 384;
    const PATH_POINTS = 6;

    beforeEach(() => {
      vi.spyOn(Math, "random").mockReturnValue(0.5);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    /** Returns the input callback registered for a given event name. */
    function getInputCallback(scene: unknown, eventName: string): (...args: unknown[]) => void {
      const inputOnMock = getMockFn((scene as { input: Record<string, unknown> }).input.on);
      const call = inputOnMock.mock.calls.find((c) => c[0] === eventName);
      if (!call || typeof call[1] !== "function") {
        throw new Error(`Input callback for "${eventName}" not found`);
      }
      return call[1] as (...args: unknown[]) => void;
    }

    /** Simulates tracing a single path by advancing through all points. */
    function completePath(scene: unknown): void {
      const pathPoints = generatePathPoints(ANIMAL_X, SPRITE_Y, FOOD_X, SPRITE_Y, PATH_POINTS);
      const pointerdown = getInputCallback(scene, "pointerdown");
      const pointermove = getInputCallback(scene, "pointermove");

      pointerdown({ x: pathPoints[0].x, y: pathPoints[0].y });
      for (let i = 1; i < pathPoints.length; i++) {
        pointermove({ x: pathPoints[i].x, y: pathPoints[i].y });
      }
    }

    /** Simulates tracing all 3 paths, triggering delayedCall advances between pairs. */
    function completeAllPaths(scene: unknown): void {
      for (let pair = 0; pair < 3; pair++) {
        completePath(scene);

        if (pair < 2) {
          const delayedCallMock = getMockFn(
            (scene as { time: Record<string, unknown> }).time.delayedCall,
          );
          const advanceCalls = delayedCallMock.mock.calls.filter((call) => call[0] === 1000);
          const latestAdvance = advanceCalls[advanceCalls.length - 1];
          const callback = latestAdvance?.[1] as () => void;
          callback();
        }
      }
    }

    it("plays win SFX when all 3 paths are traced", () => {
      vi.mocked(hasSticker).mockReturnValue(false);

      const scene = new AnimalTraceScene();
      scene.create();
      completeAllPaths(scene);

      expect(mockAudio.playWin).toHaveBeenCalled();
    });

    it("awards sticker on first completion only", () => {
      vi.mocked(hasSticker).mockReturnValue(false);

      const scene = new AnimalTraceScene();
      scene.create();
      completeAllPaths(scene);

      expect(earnSticker).toHaveBeenCalledWith("animal-trace");
      expect(mockAudio.playSticker).toHaveBeenCalled();
    });

    it("does not re-award sticker on replay", () => {
      vi.mocked(hasSticker).mockReturnValue(true);

      const scene = new AnimalTraceScene();
      scene.create();
      completeAllPaths(scene);

      expect(earnSticker).not.toHaveBeenCalled();
      expect(mockAudio.playSticker).not.toHaveBeenCalled();
    });

    it("auto-returns to Hub after 3s delay", () => {
      vi.mocked(hasSticker).mockReturnValue(false);

      const scene = new AnimalTraceScene();
      scene.create();
      completeAllPaths(scene);

      const delayedCallMock = getMockFn(scene.time.delayedCall);
      const autoReturnCalls = delayedCallMock.mock.calls.filter((call) => call[0] === 3000);
      const autoReturnCall = autoReturnCalls[autoReturnCalls.length - 1];
      expect(autoReturnCall).toBeDefined();

      const callback = autoReturnCall?.[1] as () => void;
      callback();
      completeFadeOuts(scene);

      expect(getMockFn(scene.scene.start)).toHaveBeenCalledWith("Hub", {
        justEarned: "animal-trace",
      });
    });

    it("triggers the choreographed win celebration on round completion", () => {
      vi.mocked(hasSticker).mockReturnValue(false);

      const scene = new AnimalTraceScene();
      scene.create();
      completeAllPaths(scene);

      assertWinCelebrationCreated(scene);
    });

    it("creates sticker animation image on first completion", () => {
      vi.mocked(hasSticker).mockReturnValue(false);

      const scene = new AnimalTraceScene();
      scene.create();
      completeAllPaths(scene);

      const imageCalls = getMockFn(scene.add.image).mock.calls;
      const keys = imageCalls.map((call) => call[2] as string);
      expect(keys).toContain("sticker_animal_trace");
    });

    it("creates 3 progress indicator dots on scene create", () => {
      const scene = new AnimalTraceScene();
      scene.create();

      expect(getMockFn(scene.add.circle)).toHaveBeenCalledTimes(3);
    });

    it("highlights a progress dot when a path is completed", () => {
      const scene = new AnimalTraceScene();
      scene.create();

      const circleMock = getMockFn(scene.add.circle);
      const dots = circleMock.mock.results.map((r) => r.value as Record<string, MockFn>);

      completePath(scene);

      expect(getMockFn(dots[0].setAlpha)).toHaveBeenCalledWith(1);
    });
  });

  describe("PopFreezeScene round initialization", () => {
    beforeEach(() => {
      vi.spyOn(Math, "random").mockReturnValue(0.5);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    /** Returns bubble physics image objects created by the scene. */
    function getBubbles(scene: unknown): Array<Record<string, MockFn>> {
      const physics = (scene as { physics: { add: Record<string, unknown> } }).physics.add;
      const imageMock = getMockFn(physics.image);
      return imageMock.mock.results.map((r) => r.value as Record<string, MockFn>);
    }

    it("creates 5 concurrent bubble physics images", () => {
      const scene = new PopFreezeScene();
      scene.create();

      const physicsImageMock = getMockFn(scene.physics.add.image);
      expect(physicsImageMock.mock.calls).toHaveLength(5);
    });

    it("sets world bounds collision for bouncing", () => {
      const scene = new PopFreezeScene();
      scene.create();

      expect(getMockFn(scene.physics.world.setBoundsCollision)).toHaveBeenCalled();
    });

    it("sets velocity on each bubble for floating motion", () => {
      const scene = new PopFreezeScene();
      scene.create();

      const bubbles = getBubbles(scene);
      for (const bubble of bubbles) {
        expect(getMockFn(bubble.setVelocity)).toHaveBeenCalled();
      }
    });

    it("enables world bounds collision on each bubble", () => {
      const scene = new PopFreezeScene();
      scene.create();

      const bubbles = getBubbles(scene);
      for (const bubble of bubbles) {
        expect(getMockFn(bubble.setCollideWorldBounds)).toHaveBeenCalledWith(true);
      }
    });

    it("makes each bubble interactive for tapping", () => {
      const scene = new PopFreezeScene();
      scene.create();

      const bubbles = getBubbles(scene);
      for (const bubble of bubbles) {
        expect(getMockFn(bubble.setInteractive)).toHaveBeenCalled();
      }
    });

    it("creates touch targets meeting 64x64px minimum", () => {
      const scene = new PopFreezeScene();
      scene.create();

      const bubbles = getBubbles(scene);
      for (const bubble of bubbles) {
        const setDisplaySizeCalls = getMockFn(bubble.setDisplaySize).mock.calls;
        for (const call of setDisplaySizeCalls) {
          expect(call[0]).toBeGreaterThanOrEqual(64);
          expect(call[1]).toBeGreaterThanOrEqual(64);
        }
      }
    });

    it("creates animal image for sleeping bubbles", () => {
      const scene = new PopFreezeScene();
      scene.create();

      const imageCalls = getMockFn(scene.add.image).mock.calls;
      const animalKeys = imageCalls
        .map((call) => call[2] as string)
        .filter((key) => key.startsWith("animal_"));
      expect(animalKeys.length).toBeGreaterThanOrEqual(1);
    });

    it("creates Zzz text for sleeping bubbles", () => {
      const scene = new PopFreezeScene();
      scene.create();

      const textCalls = getMockFn(scene.add.text).mock.calls;
      const zzzCalls = textCalls.filter((call) => call[2] === "Zzz");
      expect(zzzCalls).toHaveLength(1);
    });
  });

  describe("PopFreezeScene tap interaction", () => {
    beforeEach(() => {
      vi.spyOn(Math, "random").mockReturnValue(0.5);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    /** Returns bubble physics image objects created by the scene. */
    function getBubbles(scene: unknown): Array<Record<string, MockFn>> {
      const physics = (scene as { physics: { add: Record<string, unknown> } }).physics.add;
      const imageMock = getMockFn(physics.image);
      return imageMock.mock.results.map((r) => r.value as Record<string, MockFn>);
    }

    /** Simulates a tap on a bubble by triggering its pointerdown callback. */
    function tapBubble(bubble: Record<string, MockFn>): void {
      const onCalls = getMockFn(bubble.on).mock.calls;
      const pointerdownCall = onCalls.find((c) => c[0] === "pointerdown");
      if (pointerdownCall && typeof pointerdownCall[1] === "function") {
        (pointerdownCall[1] as () => void)();
      }
    }

    it("tapping a poppable bubble triggers pop SFX + bounded success feedback", () => {
      const scene = new PopFreezeScene();
      scene.create();

      const bubbles = getBubbles(scene);
      const initialGraphicsCount = getMockFn(scene.add.graphics).mock.results.length;
      // With Math.random=0.5: bubble 0 is sleeping, bubbles 1-4 are poppable
      const poppableBubble = bubbles[1];

      tapBubble(poppableBubble);

      expect(mockAudio.playPop).toHaveBeenCalled();
      assertBoundedSuccessEffect(scene, initialGraphicsCount);
    });

    it("tapping a sleeping bubble triggers wake SFX with no penalty", () => {
      const scene = new PopFreezeScene();
      scene.create();

      const bubbles = getBubbles(scene);
      const sleepingBubble = bubbles[0];

      tapBubble(sleepingBubble);

      expect(mockAudio.playWake).toHaveBeenCalled();
      expect(mockAudio.playPop).not.toHaveBeenCalled();
      expect(getMockFn(sleepingBubble.destroy)).not.toHaveBeenCalled();
    });

    it("tapping a poppable bubble starts pop animation tween", () => {
      const scene = new PopFreezeScene();
      scene.create();

      const bubbles = getBubbles(scene);
      const poppableBubble = bubbles[1];

      tapBubble(poppableBubble);

      const tweenCalls = getMockFn(scene.tweens.add).mock.calls;
      const popTween = tweenCalls.find((c) => c[0]?.targets === poppableBubble);
      expect(popTween).toBeDefined();
    });

    it("tapping a sleeping bubble starts wake wobble animation", () => {
      const scene = new PopFreezeScene();
      scene.create();

      const bubbles = getBubbles(scene);
      const sleepingBubble = bubbles[0];

      tapBubble(sleepingBubble);

      const tweenCalls = getMockFn(scene.tweens.add).mock.calls;
      const wakeTween = tweenCalls.find(
        (c) => c[0]?.targets === sleepingBubble && c[0]?.yoyo === true,
      );
      expect(wakeTween).toBeDefined();
    });

    it("uses a reduced-motion wake wobble when requested", () => {
      vi.stubGlobal("window", {
        matchMedia: vi.fn(() => ({ matches: true })),
      });

      const scene = new PopFreezeScene();
      scene.create();

      const bubbles = getBubbles(scene);
      const sleepingBubble = bubbles[0];

      tapBubble(sleepingBubble);

      const tweenCalls = getMockFn(scene.tweens.add).mock.calls;
      const wakeTween = tweenCalls.find(
        (c) => c[0]?.targets === sleepingBubble && c[0]?.yoyo === true,
      );
      expect(wakeTween).toBeDefined();
      if (!wakeTween) return;
      expect(wakeTween[0].duration).toBe(180);
      expect(wakeTween[0].scaleX).toBeCloseTo((96 / 512) * 1.05, 5);
      expect(wakeTween[0].scaleY).toBeCloseTo((96 / 512) * 1.05, 5);
    });

    it("emits self-cleaning droplet circles when a bubble pops", () => {
      const scene = new PopFreezeScene();
      scene.create();

      const graphicsMock = getMockFn(scene.add.graphics);
      const graphicsCountBefore = graphicsMock.mock.results.length;

      const bubbles = getBubbles(scene);
      tapBubble(bubbles[1]);

      // Splash + droplets graphics both created
      expect(graphicsMock.mock.results.length).toBeGreaterThan(graphicsCountBefore + 1);

      // The droplets graphics draws 3 radiating circles
      let droplets: Record<string, MockFn> | undefined;
      for (let i = graphicsCountBefore; i < graphicsMock.mock.results.length; i++) {
        const g = graphicsMock.mock.results[i].value as Record<string, MockFn>;
        if (getMockFn(g.fillCircle).mock.calls.length >= 3) {
          droplets = g;
        }
      }
      expect(droplets).toBeDefined();
      if (!droplets) return;
      expect(getMockFn(droplets.fillCircle)).toHaveBeenCalledTimes(3);

      // Fade tween fades the droplets out and destroys them on completion
      const fadeTween = getMockFn(scene.tweens.add).mock.calls.find(
        (c) => c[0]?.targets === droplets && c[0]?.alpha === 0,
      );
      expect(fadeTween).toBeDefined();
      if (!fadeTween) return;
      expect(fadeTween[0].duration).toBe(300);
      const onComplete = (fadeTween[0] as { onComplete?: () => void }).onComplete;
      expect(onComplete).toEqual(expect.any(Function));
      onComplete?.();
      expect(getMockFn(droplets.destroy)).toHaveBeenCalledTimes(1);
    });

    it("uses reduced-motion droplet timing when requested", () => {
      vi.stubGlobal("window", {
        matchMedia: vi.fn(() => ({ matches: true })),
      });

      const scene = new PopFreezeScene();
      scene.create();

      const graphicsMock = getMockFn(scene.add.graphics);
      const graphicsCountBefore = graphicsMock.mock.results.length;

      const bubbles = getBubbles(scene);
      tapBubble(bubbles[1]);

      let droplets: Record<string, MockFn> | undefined;
      for (let i = graphicsCountBefore; i < graphicsMock.mock.results.length; i++) {
        const g = graphicsMock.mock.results[i].value as Record<string, MockFn>;
        if (getMockFn(g.fillCircle).mock.calls.length >= 3) {
          droplets = g;
        }
      }
      expect(droplets).toBeDefined();
      if (!droplets) return;

      const fadeTween = getMockFn(scene.tweens.add).mock.calls.find(
        (c) => c[0]?.targets === droplets && c[0]?.alpha === 0,
      );
      expect(fadeTween).toBeDefined();
      if (!fadeTween) return;
      expect(fadeTween[0].duration).toBe(180);
      expect(fadeTween[0].scaleX).toBe(1.05);
    });

    it("starts a gentle breathing loop on sleeping animals", () => {
      const scene = new PopFreezeScene();
      scene.create();

      const imageMock = getMockFn(scene.add.image);
      let animalImage: Record<string, MockFn> | undefined;
      for (let i = 0; i < imageMock.mock.calls.length; i++) {
        if (String(imageMock.mock.calls[i][2]).startsWith("animal_")) {
          animalImage = imageMock.mock.results[i].value as Record<string, MockFn>;
          break;
        }
      }
      expect(animalImage).toBeDefined();
      if (!animalImage) return;

      const breatheTween = getMockFn(scene.tweens.add).mock.calls.find(
        (c) => c[0]?.targets === animalImage && c[0]?.repeat === -1,
      );
      expect(breatheTween).toBeDefined();
      if (!breatheTween) return;
      expect(breatheTween[0].yoyo).toBe(true);
      expect(breatheTween[0].scaleX).toBeCloseTo(1.03, 5);
      expect(breatheTween[0].scaleY).toBeCloseTo(1.03, 5);
      expect(breatheTween[0].duration).toBe(750);
    });

    it("skips the breathing loop under reduced motion", () => {
      vi.stubGlobal("window", {
        matchMedia: vi.fn(() => ({ matches: true })),
      });

      const scene = new PopFreezeScene();
      scene.create();

      const imageMock = getMockFn(scene.add.image);
      let animalImage: Record<string, MockFn> | undefined;
      for (let i = 0; i < imageMock.mock.calls.length; i++) {
        if (String(imageMock.mock.calls[i][2]).startsWith("animal_")) {
          animalImage = imageMock.mock.results[i].value as Record<string, MockFn>;
          break;
        }
      }
      expect(animalImage).toBeDefined();
      if (!animalImage) return;

      expect(
        getMockFn(scene.tweens.add).mock.calls.some(
          (c) => c[0]?.targets === animalImage && c[0]?.repeat === -1,
        ),
      ).toBe(false);
    });

    it("respawns a poppable bubble after pop to maintain concurrent count", () => {
      const scene = new PopFreezeScene();
      scene.create();

      const physicsImageMock = getMockFn(scene.physics.add.image);
      expect(physicsImageMock.mock.calls).toHaveLength(5);

      const bubbles = getBubbles(scene);
      tapBubble(bubbles[1]);

      expect(physicsImageMock.mock.calls).toHaveLength(6);

      const newBubble = physicsImageMock.mock.results[5].value as Record<string, MockFn>;
      expect(getMockFn(newBubble.setInteractive)).toHaveBeenCalled();
    });

    it("does not respawn after win target is reached", () => {
      const scene = new PopFreezeScene();
      scene.create();

      const physicsImageMock = getMockFn(scene.physics.add.image);
      let bubbles = getBubbles(scene);

      // Pop 4 initial poppable bubbles (indices 1-4)
      tapBubble(bubbles[1]);
      tapBubble(bubbles[2]);
      tapBubble(bubbles[3]);
      tapBubble(bubbles[4]);

      // 4 pops → 4 respawns → 9 total physics images
      expect(physicsImageMock.mock.calls).toHaveLength(9);

      // Get updated list (includes respawns at indices 5-8)
      bubbles = getBubbles(scene);
      tapBubble(bubbles[5]);
      // 5 pops → 5 respawns → 10 total
      expect(physicsImageMock.mock.calls).toHaveLength(10);

      tapBubble(bubbles[6]);
      // 6 pops = win target → NO respawn → still 10
      expect(physicsImageMock.mock.calls).toHaveLength(10);
    });
  });

  describe("PopFreezeScene completion and sticker flow", () => {
    beforeEach(() => {
      vi.spyOn(Math, "random").mockReturnValue(0.5);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    /** Returns bubble physics image objects created by the scene. */
    function getBubbles(scene: unknown): Array<Record<string, MockFn>> {
      const physics = (scene as { physics: { add: Record<string, unknown> } }).physics.add;
      const imageMock = getMockFn(physics.image);
      return imageMock.mock.results.map((r) => r.value as Record<string, MockFn>);
    }

    /** Simulates a tap on a bubble by triggering its pointerdown callback. */
    function tapBubble(bubble: Record<string, MockFn>): void {
      const onCalls = getMockFn(bubble.on).mock.calls;
      const pointerdownCall = onCalls.find((c) => c[0] === "pointerdown");
      if (pointerdownCall && typeof pointerdownCall[1] === "function") {
        (pointerdownCall[1] as () => void)();
      }
    }

    /** Simulates popping 6 poppable bubbles to complete the round. */
    function completeRound(scene: PopFreezeScene): void {
      let bubbles = getBubbles(scene);
      // With Math.random=0.5: bubble 0 is sleeping, bubbles 1-4 are poppable
      tapBubble(bubbles[1]);
      tapBubble(bubbles[2]);
      tapBubble(bubbles[3]);
      tapBubble(bubbles[4]);
      // 4 pops → 4 respawns → 9 total; get updated list with respawns
      bubbles = getBubbles(scene);
      tapBubble(bubbles[5]);
      tapBubble(bubbles[6]);
    }

    it("plays win SFX when 6 poppable bubbles are popped", () => {
      vi.mocked(hasSticker).mockReturnValue(false);

      const scene = new PopFreezeScene();
      scene.create();
      completeRound(scene);

      expect(mockAudio.playWin).toHaveBeenCalled();
    });

    it("awards sticker on first completion only", () => {
      vi.mocked(hasSticker).mockReturnValue(false);

      const scene = new PopFreezeScene();
      scene.create();
      completeRound(scene);

      expect(earnSticker).toHaveBeenCalledWith("pop-freeze");
      expect(mockAudio.playSticker).toHaveBeenCalled();
    });

    it("does not re-award sticker on replay", () => {
      vi.mocked(hasSticker).mockReturnValue(true);

      const scene = new PopFreezeScene();
      scene.create();
      completeRound(scene);

      expect(earnSticker).not.toHaveBeenCalled();
      expect(mockAudio.playSticker).not.toHaveBeenCalled();
    });

    it("auto-returns to Hub after 3s delay", () => {
      vi.mocked(hasSticker).mockReturnValue(false);

      const scene = new PopFreezeScene();
      scene.create();
      completeRound(scene);

      const delayedCallMock = getMockFn(scene.time.delayedCall);
      const autoReturnCall = delayedCallMock.mock.calls.find((call) => call[0] === 3000);
      expect(autoReturnCall).toBeDefined();

      const callback = autoReturnCall?.[1] as () => void;
      callback();
      completeFadeOuts(scene);

      expect(getMockFn(scene.scene.start)).toHaveBeenCalledWith("Hub", {
        justEarned: "pop-freeze",
      });
    });

    it("triggers the choreographed win celebration on round completion", () => {
      vi.mocked(hasSticker).mockReturnValue(false);

      const scene = new PopFreezeScene();
      scene.create();
      completeRound(scene);

      assertWinCelebrationCreated(scene);
    });

    it("creates sticker animation image on first completion", () => {
      vi.mocked(hasSticker).mockReturnValue(false);

      const scene = new PopFreezeScene();
      scene.create();
      completeRound(scene);

      const imageCalls = getMockFn(scene.add.image).mock.calls;
      const keys = imageCalls.map((call) => call[2] as string);
      expect(keys).toContain("sticker_pop_freeze");
    });
  });

  describe("ShadowMatchScene round initialization", () => {
    it("creates 6 shadow silhouette images", () => {
      const scene = new ShadowMatchScene();
      scene.create();

      const imageCalls = getMockFn(scene.add.image).mock.calls;
      const shadowKeys = imageCalls
        .map((call) => call[2] as string)
        .filter((key) => key.startsWith("sm_shadow_"));
      expect(shadowKeys).toHaveLength(6);
    });

    it("creates 6 object images", () => {
      const scene = new ShadowMatchScene();
      scene.create();

      const imageCalls = getMockFn(scene.add.image).mock.calls;
      const objectKeys = imageCalls
        .map((call) => call[2] as string)
        .filter((key) => key.startsWith("sm_") && !key.startsWith("sm_shadow_"));
      expect(objectKeys).toHaveLength(6);
    });

    it("makes object images interactive and draggable", () => {
      const scene = new ShadowMatchScene();
      scene.create();

      const imageResults = getMockFn(scene.add.image).mock.results;
      const imageCalls = getMockFn(scene.add.image).mock.calls;
      const objectResults = imageResults.filter((_result, index) => {
        const key = imageCalls[index][2] as string;
        return key.startsWith("sm_") && !key.startsWith("sm_shadow_");
      });

      expect(objectResults).toHaveLength(6);
      for (const result of objectResults) {
        const obj = result.value as Record<string, MockFn>;
        expect(getMockFn(obj.setInteractive)).toHaveBeenCalled();
      }
      expect(getMockFn(scene.input.setDraggable)).toHaveBeenCalledTimes(6);
    });
  });

  describe("ShadowMatchScene drag and drop", () => {
    /** Returns object image objects with their types and origin positions. */
    function getObjects(scene: unknown): Array<{
      obj: Record<string, MockFn>;
      type: string;
      originX: number;
      originY: number;
    }> {
      const add = (scene as { add: Record<string, unknown> }).add;
      const imageMock = getMockFn(add.image);
      const results: Array<{
        obj: Record<string, MockFn>;
        type: string;
        originX: number;
        originY: number;
      }> = [];

      for (let i = 0; i < imageMock.mock.calls.length; i++) {
        const key = imageMock.mock.calls[i][2] as string;
        if (key.startsWith("sm_") && !key.startsWith("sm_shadow_")) {
          results.push({
            obj: imageMock.mock.results[i].value as Record<string, MockFn>,
            type: key.replace("sm_", ""),
            originX: imageMock.mock.calls[i][0] as number,
            originY: imageMock.mock.calls[i][1] as number,
          });
        }
      }
      return results;
    }

    /** Returns shadow slot zone objects with their types and positions. */
    function getShadowSlots(scene: unknown): Array<{
      zone: Record<string, MockFn>;
      type: string;
      x: number;
      y: number;
    }> {
      const add = (scene as { add: Record<string, unknown> }).add;
      const imageMock = getMockFn(add.image);
      const zoneMock = getMockFn(add.zone);

      const slotTypes: string[] = [];
      for (let i = 0; i < imageMock.mock.calls.length; i++) {
        const key = imageMock.mock.calls[i][2] as string;
        if (key.startsWith("sm_shadow_")) {
          slotTypes.push(key.replace("sm_shadow_", ""));
        }
      }

      const results: Array<{
        zone: Record<string, MockFn>;
        type: string;
        x: number;
        y: number;
      }> = [];

      for (let i = 0; i < zoneMock.mock.results.length && i < slotTypes.length; i++) {
        results.push({
          zone: zoneMock.mock.results[i].value as Record<string, MockFn>,
          type: slotTypes[i],
          x: zoneMock.mock.calls[i][0] as number,
          y: zoneMock.mock.calls[i][1] as number,
        });
      }
      return results;
    }

    it("correct drop snaps object to shadow position, marks non-interactive, and shows bounded feedback", () => {
      const scene = new ShadowMatchScene();
      scene.create();

      const objects = getObjects(scene);
      const slots = getShadowSlots(scene);
      const initialGraphicsCount = getMockFn(scene.add.graphics).mock.results.length;
      const object = objects[0];
      const slot = slots.find((s) => s.type === object.type);
      if (!slot) throw new Error("No matching shadow slot found");

      const onCalls = getMockFn(object.obj.on).mock.calls;
      const dropCall = onCalls.find((c) => c[0] === "drop");
      const dropCallback = dropCall?.[1] as (pointer: unknown, target: unknown) => void;
      dropCallback(null, slot.zone);

      // Correct drop animates to shadow position via a 200ms Back.out snap tween.
      const snapTween = getMockFn(scene.tweens.add).mock.calls.find(
        (call) =>
          call[0]?.targets === object.obj &&
          call[0]?.x === slot.x &&
          call[0]?.y === slot.y &&
          call[0]?.ease === "Back.out",
      );
      expect(snapTween).toBeDefined();
      if (!snapTween) return;
      expect((snapTween[0] as { duration: number }).duration).toBe(200);
      expect(getMockFn(object.obj.setPosition)).not.toHaveBeenCalledWith(slot.x, slot.y);
      expect(getMockFn(object.obj.disableInteractive)).toHaveBeenCalled();
      expect(mockAudio.playCorrect).toHaveBeenCalled();
      assertBoundedSuccessEffect(scene, initialGraphicsCount);
    });

    it("incorrect drop bounces object back to origin with wobble (no penalty)", () => {
      const scene = new ShadowMatchScene();
      scene.create();

      const objects = getObjects(scene);
      const slots = getShadowSlots(scene);
      const object = objects[0];
      const wrongSlot = slots.find((s) => s.type !== object.type);
      if (!wrongSlot) throw new Error("No mismatching slot found");

      const onCalls = getMockFn(object.obj.on).mock.calls;

      // Simulate drop on wrong zone (no snap, no SFX)
      const dropCall = onCalls.find((c) => c[0] === "drop");
      const dropCallback = dropCall?.[1] as (pointer: unknown, target: unknown) => void;
      dropCallback(null, wrongSlot.zone);

      // Simulate dragend (triggers bounce-back)
      const dragendCall = onCalls.find((c) => c[0] === "dragend");
      const dragendCallback = dragendCall?.[1] as () => void;
      dragendCallback();

      const tweenCalls = getMockFn(scene.tweens.add).mock.calls;
      const objTween = tweenCalls.find((c) => c[0]?.targets === object.obj);
      expect(objTween).toBeDefined();
      expect(objTween[0].x).toBe(object.originX);
      expect(objTween[0].y).toBe(object.originY);

      expect(mockAudio.playIncorrect).toHaveBeenCalled();
      expect(getMockFn(scene.scene.start)).not.toHaveBeenCalled();
    });

    it("matched objects lock in place and do not bounce on dragend", () => {
      const scene = new ShadowMatchScene();
      scene.create();

      const objects = getObjects(scene);
      const slots = getShadowSlots(scene);
      const object = objects[0];
      const slot = slots.find((s) => s.type === object.type);
      if (!slot) throw new Error("No matching slot found");

      const onCalls = getMockFn(object.obj.on).mock.calls;

      // Correct drop
      const dropCall = onCalls.find((c) => c[0] === "drop");
      const dropCallback = dropCall?.[1] as (pointer: unknown, target: unknown) => void;
      dropCallback(null, slot.zone);

      expect(getMockFn(object.obj.disableInteractive)).toHaveBeenCalled();

      // Dragend after match — should NOT bounce
      const dragendCall = onCalls.find((c) => c[0] === "dragend");
      const dragendCallback = dragendCall?.[1] as () => void;
      dragendCallback();

      const tweenCalls = getMockFn(scene.tweens.add).mock.calls;
      const bounceTween = tweenCalls.find(
        (c) =>
          c[0]?.targets === object.obj && c[0]?.x === object.originX && c[0]?.y === object.originY,
      );
      expect(bounceTween).toBeUndefined();
    });

    it("creates touch targets meeting 64x64px minimum", () => {
      const scene = new ShadowMatchScene();
      scene.create();

      const objects = getObjects(scene);
      expect(objects.length).toBe(6);

      for (const object of objects) {
        const setDisplaySizeCalls = getMockFn(object.obj.setDisplaySize).mock.calls;
        for (const call of setDisplaySizeCalls) {
          expect(call[0]).toBeGreaterThanOrEqual(64);
          expect(call[1]).toBeGreaterThanOrEqual(64);
        }
      }
    });

    it("drop on non-slot target is a no-op (no snap, no SFX, no particles)", () => {
      const scene = new ShadowMatchScene();
      scene.create();

      const objects = getObjects(scene);
      const object = objects[0];

      const onCalls = getMockFn(object.obj.on).mock.calls;
      const dropCall = onCalls.find((c) => c[0] === "drop");
      const dropCallback = dropCall?.[1] as (pointer: unknown, target: unknown) => void;
      dropCallback(null, {});

      expect(getMockFn(object.obj.disableInteractive)).not.toHaveBeenCalled();
      expect(mockAudio.playCorrect).not.toHaveBeenCalled();
      expect(getMockFn(scene.add.particles)).not.toHaveBeenCalled();
    });

    it("dragend without a drop on a zone bounces silently (no incorrect SFX)", () => {
      const scene = new ShadowMatchScene();
      scene.create();

      const objects = getObjects(scene);
      const object = objects[0];

      // Simulate dragend without a preceding drop (object released on empty space)
      const onCalls = getMockFn(object.obj.on).mock.calls;
      const dragendCall = onCalls.find((c) => c[0] === "dragend");
      const dragendCallback = dragendCall?.[1] as () => void;
      dragendCallback();

      // Bounce tween should be created
      const tweenCalls = getMockFn(scene.tweens.add).mock.calls;
      const bounceTween = tweenCalls.find(
        (c) => c[0]?.targets === object.obj && c[0]?.x === object.originX,
      );
      expect(bounceTween).toBeDefined();

      // Incorrect SFX should NOT play (dropped on empty space, not a wrong zone)
      expect(mockAudio.playIncorrect).not.toHaveBeenCalled();
    });

    it("lifts and tilts the object on drag start and restores it on drag end", () => {
      const scene = new ShadowMatchScene();
      scene.create();

      const objects = getObjects(scene);
      const object = objects[0];
      const onCalls = getMockFn(object.obj.on).mock.calls;

      const dragstartCallback = onCalls.find((c) => c[0] === "dragstart")?.[1] as () => void;
      expect(dragstartCallback).toBeDefined();
      dragstartCallback();

      const liftTween = getMockFn(scene.tweens.add).mock.calls.find(
        (c) => c[0]?.targets === object.obj && c[0]?.angle === 4,
      );
      expect(liftTween).toBeDefined();
      if (!liftTween) return;
      expect(liftTween[0].scaleX).toBe(1.1);
      expect(liftTween[0].scaleY).toBe(1.1);

      // Both dragend listeners fire in the real game: the scene's bounce-back
      // handler (game logic) and the drag-lift restore (juice).
      const dragendCallbacks = onCalls
        .filter((c) => c[0] === "dragend")
        .map((c) => c[1] as () => void);
      dragendCallbacks.forEach((callback) => {
        callback();
      });

      const restoreTween = getMockFn(scene.tweens.add).mock.calls.find(
        (c) => c[0]?.targets === object.obj && c[0]?.scaleX === 1 && c[0]?.scaleY === 1,
      );
      expect(restoreTween).toBeDefined();
      expect(restoreTween?.[0]?.angle).toBe(0);
    });

    it("uses a reduced-motion lift (1.05 scale, no tilt) when requested", () => {
      vi.stubGlobal("window", {
        matchMedia: vi.fn(() => ({ matches: true })),
      });

      const scene = new ShadowMatchScene();
      scene.create();

      const objects = getObjects(scene);
      const object = objects[0];
      const dragstartCallback = getMockFn(object.obj.on).mock.calls.find(
        (c) => c[0] === "dragstart",
      )?.[1] as () => void;
      dragstartCallback();

      const liftTween = getMockFn(scene.tweens.add).mock.calls.find(
        (c) => c[0]?.targets === object.obj && c[0]?.scaleX === 1.05,
      );
      expect(liftTween).toBeDefined();
      if (!liftTween) return;
      expect(liftTween[0].angle).toBe(0);
    });

    it("pulses a soft outline on the shadow slot while dragging over it and clears on leave", () => {
      const scene = new ShadowMatchScene();
      scene.create();

      const slots = getShadowSlots(scene);
      const inputOnMock = getMockFn(scene.input.on);
      const dragenterCallback = inputOnMock.mock.calls.find((c) => c[0] === "dragenter")?.[1] as
        | ((pointer: unknown, obj: unknown, zone: unknown) => void)
        | undefined;
      expect(dragenterCallback).toBeDefined();
      if (!dragenterCallback) return;

      const initialGraphicsCount = getMockFn(scene.add.graphics).mock.results.length;
      dragenterCallback(null, null, slots[0].zone);

      const highlight = getMockFn(scene.add.graphics).mock.results[initialGraphicsCount]?.value as
        | Record<string, MockFn>
        | undefined;
      expect(highlight).toBeDefined();
      if (!highlight) return;
      expect(getMockFn(highlight.strokeRect)).toHaveBeenCalled();

      const pulseTween = getMockFn(scene.tweens.add).mock.calls.find(
        (call) => call[0]?.targets === highlight && call[0]?.repeat === -1,
      );
      expect(pulseTween).toBeDefined();
      expect(pulseTween?.[0]?.yoyo).toBe(true);

      const dragleaveCallback = inputOnMock.mock.calls.find((c) => c[0] === "dragleave")?.[1] as
        | ((pointer: unknown, obj: unknown, zone: unknown) => void)
        | undefined;
      expect(dragleaveCallback).toBeDefined();
      if (!dragleaveCallback) return;
      dragleaveCallback(null, null, slots[0].zone);

      expect(getMockFn(highlight.destroy)).toHaveBeenCalledTimes(1);
    });

    it("stamps the shadow slot with a scale pulse and fill flash on a correct drop", () => {
      const scene = new ShadowMatchScene();
      scene.create();

      const objects = getObjects(scene);
      const slots = getShadowSlots(scene);
      const object = objects[0];
      const slot = slots.find((s) => s.type === object.type);
      expect(slot).toBeDefined();
      if (!slot) return;

      const imageMock = getMockFn(scene.add.image);
      const shadowImages: Array<Record<string, MockFn>> = [];
      for (let i = 0; i < imageMock.mock.calls.length; i++) {
        if ((imageMock.mock.calls[i][2] as string).startsWith("sm_shadow_")) {
          shadowImages.push(imageMock.mock.results[i].value as Record<string, MockFn>);
        }
      }
      const shadow = shadowImages[slots.indexOf(slot)];
      expect(shadow).toBeDefined();
      if (!shadow) return;

      const initialGraphicsCount = getMockFn(scene.add.graphics).mock.results.length;
      (
        getMockFn(object.obj.on).mock.calls.find((c) => c[0] === "drop")?.[1] as
          | ((pointer: unknown, target: unknown) => void)
          | undefined
      )?.(null, slot.zone);

      const stampTween = getMockFn(scene.tweens.add).mock.calls.find(
        (call) => call[0]?.targets === shadow && call[0]?.scaleX === 1.1 && call[0]?.yoyo === true,
      );
      expect(stampTween).toBeDefined();
      expect(stampTween?.[0]?.duration).toBe(200);

      const flash = getMockFn(scene.add.graphics).mock.results[initialGraphicsCount]?.value as
        | Record<string, MockFn>
        | undefined;
      expect(flash).toBeDefined();
      if (!flash) return;
      expect(getMockFn(flash.fillStyle)).toHaveBeenCalled();
      expect(getMockFn(flash.fillCircle)).toHaveBeenCalled();

      const flashTween = getMockFn(scene.tweens.add).mock.calls.find(
        (call) => call[0]?.targets === flash && call[0]?.alpha === 0,
      );
      expect(flashTween).toBeDefined();
      const onComplete = flashTween?.[0]?.onComplete as (() => void) | undefined;
      expect(onComplete).toBeDefined();
      onComplete?.();
      expect(getMockFn(flash.destroy)).toHaveBeenCalledTimes(1);
    });

    it("dims the matched object after a correct drop", () => {
      const scene = new ShadowMatchScene();
      scene.create();

      const objects = getObjects(scene);
      const slots = getShadowSlots(scene);
      const object = objects[0];
      const slot = slots.find((s) => s.type === object.type);
      expect(slot).toBeDefined();
      if (!slot) return;

      (
        getMockFn(object.obj.on).mock.calls.find((c) => c[0] === "drop")?.[1] as
          | ((pointer: unknown, target: unknown) => void)
          | undefined
      )?.(null, slot.zone);

      const dimTween = getMockFn(scene.tweens.add).mock.calls.find(
        (call) => call[0]?.targets === object.obj && call[0]?.alpha === 0.5,
      );
      expect(dimTween).toBeDefined();
      expect(dimTween?.[0]?.duration).toBe(200);
    });

    it("uses reduced-motion amplitudes for the shadow reveal", () => {
      vi.stubGlobal("window", { matchMedia: vi.fn(() => ({ matches: true })) });

      const scene = new ShadowMatchScene();
      scene.create();

      const objects = getObjects(scene);
      const slots = getShadowSlots(scene);
      const object = objects[0];
      const slot = slots.find((s) => s.type === object.type);
      expect(slot).toBeDefined();
      if (!slot) return;

      const imageMock = getMockFn(scene.add.image);
      const shadowImages: Array<Record<string, MockFn>> = [];
      for (let i = 0; i < imageMock.mock.calls.length; i++) {
        if ((imageMock.mock.calls[i][2] as string).startsWith("sm_shadow_")) {
          shadowImages.push(imageMock.mock.results[i].value as Record<string, MockFn>);
        }
      }
      const shadow = shadowImages[slots.indexOf(slot)];

      (
        getMockFn(object.obj.on).mock.calls.find((c) => c[0] === "drop")?.[1] as
          | ((pointer: unknown, target: unknown) => void)
          | undefined
      )?.(null, slot.zone);

      const stampTween = getMockFn(scene.tweens.add).mock.calls.find(
        (call) => call[0]?.targets === shadow && call[0]?.scaleX === 1.05,
      );
      expect(stampTween?.[0]?.duration).toBe(120);

      const dimTween = getMockFn(scene.tweens.add).mock.calls.find(
        (call) => call[0]?.targets === object.obj && call[0]?.alpha === 0.5,
      );
      expect(dimTween?.[0]?.duration).toBe(120);
    });
  });

  describe("ShadowMatchScene completion and sticker flow", () => {
    /** Returns object image objects with their types. */
    function getObjects(scene: unknown): Array<{ obj: Record<string, MockFn>; type: string }> {
      const add = (scene as { add: Record<string, unknown> }).add;
      const imageMock = getMockFn(add.image);
      const results: Array<{ obj: Record<string, MockFn>; type: string }> = [];

      for (let i = 0; i < imageMock.mock.calls.length; i++) {
        const key = imageMock.mock.calls[i][2] as string;
        if (key.startsWith("sm_") && !key.startsWith("sm_shadow_")) {
          results.push({
            obj: imageMock.mock.results[i].value as Record<string, MockFn>,
            type: key.replace("sm_", ""),
          });
        }
      }
      return results;
    }

    /** Returns shadow slot zone objects with their types. */
    function getShadowSlots(scene: unknown): Array<{ zone: Record<string, MockFn>; type: string }> {
      const add = (scene as { add: Record<string, unknown> }).add;
      const imageMock = getMockFn(add.image);
      const zoneMock = getMockFn(add.zone);

      const slotTypes: string[] = [];
      for (let i = 0; i < imageMock.mock.calls.length; i++) {
        const key = imageMock.mock.calls[i][2] as string;
        if (key.startsWith("sm_shadow_")) {
          slotTypes.push(key.replace("sm_shadow_", ""));
        }
      }

      const results: Array<{ zone: Record<string, MockFn>; type: string }> = [];

      for (let i = 0; i < zoneMock.mock.results.length && i < slotTypes.length; i++) {
        results.push({
          zone: zoneMock.mock.results[i].value as Record<string, MockFn>,
          type: slotTypes[i],
        });
      }
      return results;
    }

    /** Simulates dropping all objects on their matching shadow slots. */
    function completeAllObjects(scene: ShadowMatchScene): void {
      const objects = getObjects(scene);
      const slots = getShadowSlots(scene);
      for (const object of objects) {
        const slot = slots.find((s) => s.type === object.type);
        if (!slot) throw new Error("No matching shadow slot found");
        const onCalls = getMockFn(object.obj.on).mock.calls;
        const dropCall = onCalls.find((c) => c[0] === "drop");
        const dropCallback = dropCall?.[1] as (pointer: unknown, target: unknown) => void;
        dropCallback(null, slot.zone);
      }
    }

    it("plays win SFX when all 6 objects are matched", () => {
      vi.mocked(hasSticker).mockReturnValue(false);

      const scene = new ShadowMatchScene();
      scene.create();
      completeAllObjects(scene);

      expect(mockAudio.playWin).toHaveBeenCalled();
    });

    it("awards sticker on first completion only", () => {
      vi.mocked(hasSticker).mockReturnValue(false);

      const scene = new ShadowMatchScene();
      scene.create();
      completeAllObjects(scene);

      expect(earnSticker).toHaveBeenCalledWith("shadow-match");
      expect(mockAudio.playSticker).toHaveBeenCalled();
    });

    it("does not re-award sticker on replay", () => {
      vi.mocked(hasSticker).mockReturnValue(true);

      const scene = new ShadowMatchScene();
      scene.create();
      completeAllObjects(scene);

      expect(earnSticker).not.toHaveBeenCalled();
      expect(mockAudio.playSticker).not.toHaveBeenCalled();
    });

    it("auto-returns to Hub after 3s delay", () => {
      vi.mocked(hasSticker).mockReturnValue(false);

      const scene = new ShadowMatchScene();
      scene.create();
      completeAllObjects(scene);

      const delayedCallMock = getMockFn(scene.time.delayedCall);
      const autoReturnCall = delayedCallMock.mock.calls.find((call) => call[0] === 3000);
      expect(autoReturnCall).toBeDefined();

      const callback = autoReturnCall?.[1] as () => void;
      callback();
      completeFadeOuts(scene);

      expect(getMockFn(scene.scene.start)).toHaveBeenCalledWith("Hub", {
        justEarned: "shadow-match",
      });
    });
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

    /** Returns the replay button text object, or undefined if not found. */
    function getReplayButton(scene: unknown): Record<string, MockFn> | undefined {
      const add = (scene as { add: Record<string, unknown> }).add;
      const textMock = getMockFn(add.text);
      for (let i = 0; i < textMock.mock.calls.length; i++) {
        const text = textMock.mock.calls[i][2] as string;
        if (typeof text === "string" && text.includes("\uD83D\uDD04")) {
          return textMock.mock.results[i].value as Record<string, MockFn>;
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
      expect(latestTween.scaleX).toBeCloseTo((128 / 512) * 1.05, 5);
      expect(latestTween.scaleY).toBeCloseTo((128 / 512) * 1.05, 5);
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
     * clears audio, then taps the correct frog (index 1 = blue) sequenceLength
     * times. Returns the delayed call count after firing playback (for use as
     * the next firedUpTo).
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
      for (let i = 0; i < sequenceLength; i++) {
        tapFrog(frogs, 1);
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

      const popTween = getMockFn(scene.tweens.add).mock.calls.find(
        (c) => c[0]?.targets === dots[0],
      );
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

  describe("BigSmallScene round initialization", () => {
    it("creates 6 toy images", () => {
      const scene = new BigSmallScene();
      scene.create();

      const imageCalls = getMockFn(scene.add.image).mock.calls;
      const toyKeys = imageCalls
        .map((call) => call[2] as string)
        .filter((key) => key.startsWith("toy_") && key !== "toy_box");
      expect(toyKeys).toHaveLength(6);
    });

    it("creates 2 box images", () => {
      const scene = new BigSmallScene();
      scene.create();

      const imageCalls = getMockFn(scene.add.image).mock.calls;
      const boxKeys = imageCalls
        .map((call) => call[2] as string)
        .filter((key) => key === "toy_box");
      expect(boxKeys).toHaveLength(2);
    });

    it("creates 2 drop zones with dropZone flag", () => {
      const scene = new BigSmallScene();
      scene.create();

      const zoneMock = getMockFn(scene.add.zone);
      expect(zoneMock).toHaveBeenCalledTimes(2);

      for (const result of zoneMock.mock.results) {
        const zone = result.value as Record<string, MockFn>;
        expect(getMockFn(zone.setInteractive)).toHaveBeenCalledWith({ dropZone: true });
      }
    });

    it("makes toy images interactive and draggable", () => {
      const scene = new BigSmallScene();
      scene.create();

      const imageResults = getMockFn(scene.add.image).mock.results;
      const imageCalls = getMockFn(scene.add.image).mock.calls;
      const toyResults = imageResults.filter((_result, index) => {
        const key = imageCalls[index][2] as string;
        return key.startsWith("toy_") && key !== "toy_box";
      });

      expect(toyResults).toHaveLength(6);
      for (const result of toyResults) {
        const obj = result.value as Record<string, MockFn>;
        expect(getMockFn(obj.setInteractive)).toHaveBeenCalled();
      }
      expect(getMockFn(scene.input.setDraggable)).toHaveBeenCalledTimes(6);
    });

    it("creates big toys >=96px and small toys >=64px", () => {
      const scene = new BigSmallScene();
      scene.create();

      const imageResults = getMockFn(scene.add.image).mock.results;
      const imageCalls = getMockFn(scene.add.image).mock.calls;

      const toySizes: number[] = [];
      for (let i = 0; i < imageCalls.length; i++) {
        const key = imageCalls[i][2] as string;
        if (key.startsWith("toy_") && key !== "toy_box") {
          const obj = imageResults[i].value as Record<string, MockFn>;
          const displaySizeCalls = getMockFn(obj.setDisplaySize).mock.calls;
          toySizes.push(displaySizeCalls[0]?.[0] as number);
        }
      }

      const bigToys = toySizes.filter((s) => s >= 100);
      const smallToys = toySizes.filter((s) => s < 100);

      expect(bigToys).toHaveLength(3);
      expect(smallToys).toHaveLength(3);

      for (const size of bigToys) {
        expect(size).toBeGreaterThanOrEqual(96);
      }
      for (const size of smallToys) {
        expect(size).toBeGreaterThanOrEqual(64);
      }
    });
  });

  describe("BigSmallScene drag and drop", () => {
    /** Returns toy image objects with their scaleCategory and origin positions. */
    function getToys(scene: unknown): Array<{
      obj: Record<string, MockFn>;
      scaleCategory: "big" | "small";
      originX: number;
      originY: number;
    }> {
      const add = (scene as { add: Record<string, unknown> }).add;
      const imageMock = getMockFn(add.image);
      const results: Array<{
        obj: Record<string, MockFn>;
        scaleCategory: "big" | "small";
        originX: number;
        originY: number;
      }> = [];

      for (let i = 0; i < imageMock.mock.calls.length; i++) {
        const key = imageMock.mock.calls[i][2] as string;
        if (key.startsWith("toy_") && key !== "toy_box") {
          const obj = imageMock.mock.results[i].value as Record<string, MockFn>;
          const displaySizeCalls = getMockFn(obj.setDisplaySize).mock.calls;
          const size = displaySizeCalls[0]?.[0] as number;
          const scaleCategory: "big" | "small" = size >= 100 ? "big" : "small";
          results.push({
            obj,
            scaleCategory,
            originX: imageMock.mock.calls[i][0] as number,
            originY: imageMock.mock.calls[i][1] as number,
          });
        }
      }
      return results;
    }

    /** Returns box slot zone objects with their scaleCategory and positions. */
    function getBoxSlots(scene: unknown): Array<{
      zone: Record<string, MockFn>;
      scaleCategory: "big" | "small";
      x: number;
      y: number;
    }> {
      const add = (scene as { add: Record<string, unknown> }).add;
      const imageMock = getMockFn(add.image);
      const zoneMock = getMockFn(add.zone);

      const boxSizes: number[] = [];
      for (let i = 0; i < imageMock.mock.calls.length; i++) {
        const key = imageMock.mock.calls[i][2] as string;
        if (key === "toy_box") {
          const obj = imageMock.mock.results[i].value as Record<string, MockFn>;
          const displaySizeCalls = getMockFn(obj.setDisplaySize).mock.calls;
          boxSizes.push(displaySizeCalls[0]?.[0] as number);
        }
      }

      const results: Array<{
        zone: Record<string, MockFn>;
        scaleCategory: "big" | "small";
        x: number;
        y: number;
      }> = [];

      for (let j = 0; j < boxSizes.length && j < zoneMock.mock.results.length; j++) {
        const scaleCategory: "big" | "small" = boxSizes[j] >= 100 ? "big" : "small";
        results.push({
          zone: zoneMock.mock.results[j].value as Record<string, MockFn>,
          scaleCategory,
          x: zoneMock.mock.calls[j][0] as number,
          y: zoneMock.mock.calls[j][1] as number,
        });
      }
      return results;
    }

    it("correct drop snaps toy to box position, marks non-interactive, and shows bounded feedback", () => {
      const scene = new BigSmallScene();
      scene.create();

      const toys = getToys(scene);
      const slots = getBoxSlots(scene);
      const initialGraphicsCount = getMockFn(scene.add.graphics).mock.results.length;
      const toy = toys[0];
      const slot = slots.find((s) => s.scaleCategory === toy.scaleCategory);
      if (!slot) throw new Error("No matching box slot found");

      const onCalls = getMockFn(toy.obj.on).mock.calls;
      const dropCall = onCalls.find((c) => c[0] === "drop");
      const dropCallback = dropCall?.[1] as (pointer: unknown, target: unknown) => void;
      dropCallback(null, slot.zone);

      // Correct drop animates to box position via a 200ms Back.out snap tween.
      const snapTween = getMockFn(scene.tweens.add).mock.calls.find(
        (call) =>
          call[0]?.targets === toy.obj &&
          call[0]?.x === slot.x &&
          call[0]?.y === slot.y &&
          call[0]?.ease === "Back.out",
      );
      expect(snapTween).toBeDefined();
      if (!snapTween) return;
      expect((snapTween[0] as { duration: number }).duration).toBe(200);
      expect(getMockFn(toy.obj.setPosition)).not.toHaveBeenCalledWith(slot.x, slot.y);
      expect(getMockFn(toy.obj.disableInteractive)).toHaveBeenCalled();
      expect(mockAudio.playCorrect).toHaveBeenCalled();
      assertBoundedSuccessEffect(scene, initialGraphicsCount);
    });

    it("incorrect drop bounces toy back to origin with wobble (no penalty, remains draggable)", () => {
      const scene = new BigSmallScene();
      scene.create();

      const toys = getToys(scene);
      const slots = getBoxSlots(scene);
      const toy = toys[0];
      const wrongSlot = slots.find((s) => s.scaleCategory !== toy.scaleCategory);
      if (!wrongSlot) throw new Error("No mismatching box slot found");

      const onCalls = getMockFn(toy.obj.on).mock.calls;

      const dropCall = onCalls.find((c) => c[0] === "drop");
      const dropCallback = dropCall?.[1] as (pointer: unknown, target: unknown) => void;
      dropCallback(null, wrongSlot.zone);

      const dragendCall = onCalls.find((c) => c[0] === "dragend");
      const dragendCallback = dragendCall?.[1] as () => void;
      dragendCallback();

      const tweenCalls = getMockFn(scene.tweens.add).mock.calls;
      const toyTween = tweenCalls.find((c) => c[0]?.targets === toy.obj);
      expect(toyTween).toBeDefined();
      expect(toyTween[0].x).toBe(toy.originX);
      expect(toyTween[0].y).toBe(toy.originY);

      expect(mockAudio.playIncorrect).toHaveBeenCalled();
      expect(getMockFn(toy.obj.disableInteractive)).not.toHaveBeenCalled();
      expect(getMockFn(scene.scene.start)).not.toHaveBeenCalled();
    });

    it("sorted toys lock in place and do not bounce on dragend", () => {
      const scene = new BigSmallScene();
      scene.create();

      const toys = getToys(scene);
      const slots = getBoxSlots(scene);
      const toy = toys[0];
      const slot = slots.find((s) => s.scaleCategory === toy.scaleCategory);
      if (!slot) throw new Error("No matching box slot found");

      const onCalls = getMockFn(toy.obj.on).mock.calls;

      const dropCall = onCalls.find((c) => c[0] === "drop");
      const dropCallback = dropCall?.[1] as (pointer: unknown, target: unknown) => void;
      dropCallback(null, slot.zone);

      expect(getMockFn(toy.obj.disableInteractive)).toHaveBeenCalled();

      const dragendCall = onCalls.find((c) => c[0] === "dragend");
      const dragendCallback = dragendCall?.[1] as () => void;
      dragendCallback();

      const tweenCalls = getMockFn(scene.tweens.add).mock.calls;
      const bounceTween = tweenCalls.find(
        (c) => c[0]?.targets === toy.obj && c[0]?.x === toy.originX && c[0]?.y === toy.originY,
      );
      expect(bounceTween).toBeUndefined();
    });

    it("creates touch targets meeting 64x64px minimum", () => {
      const scene = new BigSmallScene();
      scene.create();

      const toys = getToys(scene);
      expect(toys).toHaveLength(6);

      for (const toy of toys) {
        const setDisplaySizeCalls = getMockFn(toy.obj.setDisplaySize).mock.calls;
        for (const call of setDisplaySizeCalls) {
          expect(call[0]).toBeGreaterThanOrEqual(64);
          expect(call[1]).toBeGreaterThanOrEqual(64);
        }
      }
    });

    it("drop on non-box target is a no-op (no snap, no SFX, no particles)", () => {
      const scene = new BigSmallScene();
      scene.create();

      const toys = getToys(scene);
      const toy = toys[0];

      const onCalls = getMockFn(toy.obj.on).mock.calls;
      const dropCall = onCalls.find((c) => c[0] === "drop");
      const dropCallback = dropCall?.[1] as (pointer: unknown, target: unknown) => void;
      dropCallback(null, {});

      expect(getMockFn(toy.obj.disableInteractive)).not.toHaveBeenCalled();
      expect(mockAudio.playCorrect).not.toHaveBeenCalled();
      expect(getMockFn(scene.add.particles)).not.toHaveBeenCalled();
    });

    it("dragend without a drop on a zone bounces silently (no incorrect SFX)", () => {
      const scene = new BigSmallScene();
      scene.create();

      const toys = getToys(scene);
      const toy = toys[0];

      const onCalls = getMockFn(toy.obj.on).mock.calls;
      const dragendCall = onCalls.find((c) => c[0] === "dragend");
      const dragendCallback = dragendCall?.[1] as () => void;
      dragendCallback();

      const tweenCalls = getMockFn(scene.tweens.add).mock.calls;
      const bounceTween = tweenCalls.find(
        (c) => c[0]?.targets === toy.obj && c[0]?.x === toy.originX,
      );
      expect(bounceTween).toBeDefined();

      expect(mockAudio.playIncorrect).not.toHaveBeenCalled();
    });

    it("lifts and tilts the toy on drag start and restores it on drag end", () => {
      const scene = new BigSmallScene();
      scene.create();

      const toys = getToys(scene);
      const toy = toys[0];
      const onCalls = getMockFn(toy.obj.on).mock.calls;

      const dragstartCallback = onCalls.find((c) => c[0] === "dragstart")?.[1] as () => void;
      expect(dragstartCallback).toBeDefined();
      dragstartCallback();

      const liftTween = getMockFn(scene.tweens.add).mock.calls.find(
        (c) => c[0]?.targets === toy.obj && c[0]?.angle === 4,
      );
      expect(liftTween).toBeDefined();
      if (!liftTween) return;
      expect(liftTween[0].scaleX).toBe(1.1);
      expect(liftTween[0].scaleY).toBe(1.1);

      // Both dragend listeners fire in the real game: the scene's bounce-back
      // handler (game logic) and the drag-lift restore (juice).
      const dragendCallbacks = onCalls
        .filter((c) => c[0] === "dragend")
        .map((c) => c[1] as () => void);
      dragendCallbacks.forEach((callback) => {
        callback();
      });

      const restoreTween = getMockFn(scene.tweens.add).mock.calls.find(
        (c) => c[0]?.targets === toy.obj && c[0]?.scaleX === 1 && c[0]?.scaleY === 1,
      );
      expect(restoreTween).toBeDefined();
      expect(restoreTween?.[0]?.angle).toBe(0);
    });

    it("uses a reduced-motion lift (1.05 scale, no tilt) when requested", () => {
      vi.stubGlobal("window", {
        matchMedia: vi.fn(() => ({ matches: true })),
      });

      const scene = new BigSmallScene();
      scene.create();

      const toys = getToys(scene);
      const toy = toys[0];
      const dragstartCallback = getMockFn(toy.obj.on).mock.calls.find(
        (c) => c[0] === "dragstart",
      )?.[1] as () => void;
      dragstartCallback();

      const liftTween = getMockFn(scene.tweens.add).mock.calls.find(
        (c) => c[0]?.targets === toy.obj && c[0]?.scaleX === 1.05,
      );
      expect(liftTween).toBeDefined();
      if (!liftTween) return;
      expect(liftTween[0].angle).toBe(0);
    });

    it("pulses a soft outline on the box drop zone while dragging over it and clears on leave", () => {
      const scene = new BigSmallScene();
      scene.create();

      const slots = getBoxSlots(scene);
      const inputOnMock = getMockFn(scene.input.on);
      const dragenterCallback = inputOnMock.mock.calls.find((c) => c[0] === "dragenter")?.[1] as
        | ((pointer: unknown, obj: unknown, zone: unknown) => void)
        | undefined;
      expect(dragenterCallback).toBeDefined();
      if (!dragenterCallback) return;

      const initialGraphicsCount = getMockFn(scene.add.graphics).mock.results.length;
      dragenterCallback(null, null, slots[0].zone);

      const highlight = getMockFn(scene.add.graphics).mock.results[initialGraphicsCount]?.value as
        | Record<string, MockFn>
        | undefined;
      expect(highlight).toBeDefined();
      if (!highlight) return;
      expect(getMockFn(highlight.strokeRect)).toHaveBeenCalled();

      const pulseTween = getMockFn(scene.tweens.add).mock.calls.find(
        (call) => call[0]?.targets === highlight && call[0]?.repeat === -1,
      );
      expect(pulseTween).toBeDefined();
      expect(pulseTween?.[0]?.yoyo).toBe(true);

      const dragleaveCallback = inputOnMock.mock.calls.find((c) => c[0] === "dragleave")?.[1] as
        | ((pointer: unknown, obj: unknown, zone: unknown) => void)
        | undefined;
      expect(dragleaveCallback).toBeDefined();
      if (!dragleaveCallback) return;
      dragleaveCallback(null, null, slots[0].zone);

      expect(getMockFn(highlight.destroy)).toHaveBeenCalledTimes(1);
    });

    it("shrinks the toy into the box with a 150ms tween on a correct drop", () => {
      const scene = new BigSmallScene();
      scene.create();

      const toys = getToys(scene);
      const slots = getBoxSlots(scene);
      const toy = toys[0];
      const slot = slots.find((s) => s.scaleCategory === toy.scaleCategory);
      expect(slot).toBeDefined();
      if (!slot) return;

      const dropCallback = getMockFn(toy.obj.on).mock.calls.find((c) => c[0] === "drop")?.[1] as
        | ((pointer: unknown, target: unknown) => void)
        | undefined;
      expect(dropCallback).toBeDefined();
      if (!dropCallback) return;
      dropCallback(null, slot.zone);

      const shrinkTween = getMockFn(scene.tweens.add).mock.calls.find(
        (call) => call[0]?.targets === toy.obj && call[0]?.scaleX === 0 && call[0]?.scaleY === 0,
      );
      expect(shrinkTween).toBeDefined();
      expect(shrinkTween?.[0]?.duration).toBe(150);
      expect(shrinkTween?.[0]?.ease).toBe("Sine.in");
    });

    it("does not restore the drag-lift scale for a toy that was sorted", () => {
      const scene = new BigSmallScene();
      scene.create();

      const toys = getToys(scene);
      const slots = getBoxSlots(scene);
      const toy = toys[0];
      const slot = slots.find((s) => s.scaleCategory === toy.scaleCategory);
      expect(slot).toBeDefined();
      if (!slot) return;

      (
        getMockFn(toy.obj.on).mock.calls.find((c) => c[0] === "drop")?.[1] as
          | ((pointer: unknown, target: unknown) => void)
          | undefined
      )?.(null, slot.zone);

      const dragendCallbacks = getMockFn(toy.obj.on)
        .mock.calls.filter((c) => c[0] === "dragend")
        .map((c) => c[1] as () => void);
      dragendCallbacks.forEach((callback) => {
        callback();
      });

      const restoreTween = getMockFn(scene.tweens.add).mock.calls.find(
        (call) => call[0]?.targets === toy.obj && call[0]?.scaleX === 1 && call[0]?.scaleY === 1,
      );
      expect(restoreTween).toBeUndefined();
    });

    it("wiggles the box lid and briefly scales the box up on a correct drop", () => {
      const scene = new BigSmallScene();
      scene.create();

      const toys = getToys(scene);
      const slots = getBoxSlots(scene);
      const toy = toys[0];
      const slot = slots.find((s) => s.scaleCategory === toy.scaleCategory);
      expect(slot).toBeDefined();
      if (!slot) return;

      const imageMock = getMockFn(scene.add.image);
      const boxImages: Array<Record<string, MockFn>> = [];
      for (let i = 0; i < imageMock.mock.calls.length; i++) {
        if (imageMock.mock.calls[i][2] === "toy_box") {
          boxImages.push(imageMock.mock.results[i].value as Record<string, MockFn>);
        }
      }
      const box = boxImages[slots.indexOf(slot)];
      expect(box).toBeDefined();
      if (!box) return;

      (
        getMockFn(toy.obj.on).mock.calls.find((c) => c[0] === "drop")?.[1] as
          | ((pointer: unknown, target: unknown) => void)
          | undefined
      )?.(null, slot.zone);

      const wiggleTween = getMockFn(scene.tweens.add).mock.calls.find(
        (call) => call[0]?.targets === box && call[0]?.angle === 3 && call[0]?.yoyo === true,
      );
      expect(wiggleTween).toBeDefined();
      expect(wiggleTween?.[0]?.repeat).toBe(3);

      const bumpTween = getMockFn(scene.tweens.add).mock.calls.find(
        (call) => call[0]?.targets === box && call[0]?.scaleX === 1.05 && call[0]?.yoyo === true,
      );
      expect(bumpTween).toBeDefined();
    });

    it("uses reduced-motion timings for the box reaction", () => {
      vi.stubGlobal("window", { matchMedia: vi.fn(() => ({ matches: true })) });

      const scene = new BigSmallScene();
      scene.create();

      const toys = getToys(scene);
      const slots = getBoxSlots(scene);
      const toy = toys[0];
      const slot = slots.find((s) => s.scaleCategory === toy.scaleCategory);
      expect(slot).toBeDefined();
      if (!slot) return;

      const imageMock = getMockFn(scene.add.image);
      const boxImages: Array<Record<string, MockFn>> = [];
      for (let i = 0; i < imageMock.mock.calls.length; i++) {
        if (imageMock.mock.calls[i][2] === "toy_box") {
          boxImages.push(imageMock.mock.results[i].value as Record<string, MockFn>);
        }
      }
      const box = boxImages[slots.indexOf(slot)];
      expect(box).toBeDefined();
      if (!box) return;

      (
        getMockFn(toy.obj.on).mock.calls.find((c) => c[0] === "drop")?.[1] as
          | ((pointer: unknown, target: unknown) => void)
          | undefined
      )?.(null, slot.zone);

      const shrinkTween = getMockFn(scene.tweens.add).mock.calls.find(
        (call) => call[0]?.targets === toy.obj && call[0]?.scaleX === 0,
      );
      expect(shrinkTween?.[0]?.duration).toBe(90);

      const wiggleTween = getMockFn(scene.tweens.add).mock.calls.find(
        (call) => call[0]?.targets === box && call[0]?.angle === 3,
      );
      expect(wiggleTween?.[0]?.duration).toBe(120);

      const bumpTween = getMockFn(scene.tweens.add).mock.calls.find(
        (call) => call[0]?.targets === box && call[0]?.scaleX === 1.02,
      );
      expect(bumpTween).toBeDefined();
      expect(bumpTween?.[0]?.duration).toBe(150);
    });
  });

  describe("BigSmallScene completion and sticker flow", () => {
    /** Returns toy image objects with their scaleCategory. */
    function getToys(scene: unknown): Array<{
      obj: Record<string, MockFn>;
      scaleCategory: "big" | "small";
    }> {
      const add = (scene as { add: Record<string, unknown> }).add;
      const imageMock = getMockFn(add.image);
      const results: Array<{
        obj: Record<string, MockFn>;
        scaleCategory: "big" | "small";
      }> = [];

      for (let i = 0; i < imageMock.mock.calls.length; i++) {
        const key = imageMock.mock.calls[i][2] as string;
        if (key.startsWith("toy_") && key !== "toy_box") {
          const obj = imageMock.mock.results[i].value as Record<string, MockFn>;
          const displaySizeCalls = getMockFn(obj.setDisplaySize).mock.calls;
          const size = displaySizeCalls[0]?.[0] as number;
          const scaleCategory: "big" | "small" = size >= 100 ? "big" : "small";
          results.push({ obj, scaleCategory });
        }
      }
      return results;
    }

    /** Returns box slot zone objects with their scaleCategory. */
    function getBoxSlots(
      scene: unknown,
    ): Array<{ zone: Record<string, MockFn>; scaleCategory: "big" | "small" }> {
      const add = (scene as { add: Record<string, unknown> }).add;
      const imageMock = getMockFn(add.image);
      const zoneMock = getMockFn(add.zone);

      const boxSizes: number[] = [];
      for (let i = 0; i < imageMock.mock.calls.length; i++) {
        const key = imageMock.mock.calls[i][2] as string;
        if (key === "toy_box") {
          const obj = imageMock.mock.results[i].value as Record<string, MockFn>;
          const displaySizeCalls = getMockFn(obj.setDisplaySize).mock.calls;
          boxSizes.push(displaySizeCalls[0]?.[0] as number);
        }
      }

      const results: Array<{
        zone: Record<string, MockFn>;
        scaleCategory: "big" | "small";
      }> = [];

      for (let j = 0; j < boxSizes.length && j < zoneMock.mock.results.length; j++) {
        const scaleCategory: "big" | "small" = boxSizes[j] >= 100 ? "big" : "small";
        results.push({
          zone: zoneMock.mock.results[j].value as Record<string, MockFn>,
          scaleCategory,
        });
      }
      return results;
    }

    /** Simulates dropping all toys on their matching boxes. */
    function completeAllToys(scene: BigSmallScene): void {
      const toys = getToys(scene);
      const slots = getBoxSlots(scene);
      for (const toy of toys) {
        const slot = slots.find((s) => s.scaleCategory === toy.scaleCategory);
        if (!slot) throw new Error("No matching box slot found");
        const onCalls = getMockFn(toy.obj.on).mock.calls;
        const dropCall = onCalls.find((c) => c[0] === "drop");
        const dropCallback = dropCall?.[1] as (pointer: unknown, target: unknown) => void;
        dropCallback(null, slot.zone);
      }
    }

    it("plays win SFX when all 6 toys are sorted", () => {
      vi.mocked(hasSticker).mockReturnValue(false);

      const scene = new BigSmallScene();
      scene.create();
      completeAllToys(scene);

      expect(mockAudio.playWin).toHaveBeenCalled();
    });

    it("awards sticker on first completion only", () => {
      vi.mocked(hasSticker).mockReturnValue(false);

      const scene = new BigSmallScene();
      scene.create();
      completeAllToys(scene);

      expect(earnSticker).toHaveBeenCalledWith("big-small");
      expect(mockAudio.playSticker).toHaveBeenCalled();
    });

    it("does not re-award sticker on replay", () => {
      vi.mocked(hasSticker).mockReturnValue(true);

      const scene = new BigSmallScene();
      scene.create();
      completeAllToys(scene);

      expect(earnSticker).not.toHaveBeenCalled();
      expect(mockAudio.playSticker).not.toHaveBeenCalled();
    });

    it("auto-returns to Hub after 3s delay", () => {
      vi.mocked(hasSticker).mockReturnValue(false);

      const scene = new BigSmallScene();
      scene.create();
      completeAllToys(scene);

      const delayedCallMock = getMockFn(scene.time.delayedCall);
      const autoReturnCall = delayedCallMock.mock.calls.find((call) => call[0] === 3000);
      expect(autoReturnCall).toBeDefined();

      const callback = autoReturnCall?.[1] as () => void;
      callback();
      completeFadeOuts(scene);

      expect(getMockFn(scene.scene.start)).toHaveBeenCalledWith("Hub", {
        justEarned: "big-small",
      });
    });
  });

  describe("scene shutdown cleanup", () => {
    it.each(GAME_SCENES)("destroys ParentLock on shutdown in $name", ({ SceneClass }) => {
      const scene = new SceneClass();
      scene.create();

      expect(anyObjectOffCalled(scene)).toBe(false);

      triggerShutdown(scene);

      expect(anyObjectOffCalled(scene)).toBe(true);
    });

    it("destroys ParentLock on shutdown in HubScene", () => {
      const scene = new HubScene();
      scene.create();

      expect(anyObjectOffCalled(scene)).toBe(false);

      triggerShutdown(scene);

      expect(anyObjectOffCalled(scene)).toBe(true);
    });

    it("destroys an open SettingsPanel on HubScene shutdown", () => {
      const scene = new HubScene();
      scene.create();

      triggerAllPointerdowns(scene);
      const holdCallback = getMockFn(scene.time.delayedCall).mock.calls.find(
        (call) => call[0] === 3000,
      )?.[1] as () => void;
      holdCallback();
      triggerShutdown(scene);

      expect(mockSettingsPanelDestroy).toHaveBeenCalled();
    });
  });

  describe("cross-scene touch regression", () => {
    /** Fires the first registered listener for an event on a game object. */
    function fireEvent(obj: Record<string, MockFn>, event: string): void {
      const callback = getMockFn(obj.on).mock.calls.find((call) => call[0] === event)?.[1] as
        | (() => void)
        | undefined;
      if (!callback) throw new Error(`no '${event}' listener registered on object`);
      callback();
    }

    /** Returns the ParentLock 3000ms hold callback scheduled on the scene. */
    function holdCallback(scene: unknown): () => void {
      const call = getMockFn(
        (scene as { time: Record<string, unknown> }).time.delayedCall,
      ).mock.calls.find((entry) => entry[0] === 3000);
      if (!call) throw new Error("ParentLock 3000ms hold not found");
      return call[1] as () => void;
    }

    it.each(GAME_SCENES)(
      "never navigates when the Back hold is released early in $name",
      ({ SceneClass }) => {
        const scene = new SceneClass();
        scene.create();

        const backButton = getTextObject(scene, "Back");
        if (!backButton) throw new Error("Back button not found");

        fireEvent(backButton, "pointerdown");
        fireEvent(backButton, "pointerup");

        // A stale hold callback after early release must never navigate.
        holdCallback(scene)();
        expect(getMockFn(scene.scene.start)).not.toHaveBeenCalledWith("Hub");
      },
    );

    it.each(GAME_SCENES)(
      "never navigates when the Back hold is cancelled in $name",
      ({ SceneClass }) => {
        const scene = new SceneClass();
        scene.create();

        const backButton = getTextObject(scene, "Back");
        if (!backButton) throw new Error("Back button not found");

        fireEvent(backButton, "pointerdown");
        fireEvent(backButton, "pointercancel");

        holdCallback(scene)();
        expect(getMockFn(scene.scene.start)).not.toHaveBeenCalledWith("Hub");
      },
    );

    it("never opens the panel when the Settings hold is released early", () => {
      const scene = new HubScene();
      scene.create();

      const settingsButton = getTextObject(scene, "Settings");
      if (!settingsButton) throw new Error("Settings button not found");

      fireEvent(settingsButton, "pointerdown");
      fireEvent(settingsButton, "pointerup");

      holdCallback(scene)();
      expect(mockSettingsPanel).not.toHaveBeenCalled();
    });

    it("opens the panel exactly once when the Settings hold completes despite duplicate pointerdown", () => {
      const scene = new HubScene();
      scene.create();

      const settingsButton = getTextObject(scene, "Settings");
      if (!settingsButton) throw new Error("Settings button not found");

      fireEvent(settingsButton, "pointerdown");
      fireEvent(settingsButton, "pointerdown");

      const holdCalls = getMockFn(scene.time.delayedCall).mock.calls.filter(
        (call) => call[0] === 3000,
      );
      expect(holdCalls.length).toBe(1);

      (holdCalls[0][1] as () => void)();
      (holdCalls[0][1] as () => void)();
      expect(mockSettingsPanel).toHaveBeenCalledTimes(1);
    });

    it.each(GAME_SCENES)(
      "cleans up the hold progress ring on shutdown in $name",
      ({ SceneClass }) => {
        const scene = new SceneClass();
        scene.create();

        const backButton = getTextObject(scene, "Back");
        if (!backButton) throw new Error("Back button not found");

        fireEvent(backButton, "pointerdown");

        const graphicsMock = getMockFn(scene.add.graphics);
        const ring = graphicsMock.mock.results.at(-1)?.value as Record<string, MockFn>;
        expect(ring).toBeDefined();

        triggerShutdown(scene);

        expect(getMockFn(ring.destroy)).toHaveBeenCalled();
      },
    );

    it("cleans up the Settings hold progress ring on Hub shutdown", () => {
      const scene = new HubScene();
      scene.create();

      const settingsButton = getTextObject(scene, "Settings");
      if (!settingsButton) throw new Error("Settings button not found");

      fireEvent(settingsButton, "pointerdown");

      const graphicsMock = getMockFn(scene.add.graphics);
      const ring = graphicsMock.mock.results.at(-1)?.value as Record<string, MockFn>;
      expect(ring).toBeDefined();

      triggerShutdown(scene);

      expect(getMockFn(ring.destroy)).toHaveBeenCalled();
    });
  });
});
