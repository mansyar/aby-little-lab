import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type MockFn = ReturnType<typeof vi.fn>;

/**
 * Mock Phaser module. Scene files extend Phaser.Scene, which at runtime
 * resolves to MockScene. Each instance gets fresh mock methods in the
 * constructor, enabling per-test isolation.
 */
vi.mock("phaser", () => {
  /** Creates a mock game object with chainable methods used by Phaser scenes. */
  function createMockGameObject(): Record<string, MockFn> {
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
      lineStyle: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
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
        rectangle: vi.fn(() => createMockGameObject()),
        text: vi.fn(() => createMockGameObject()),
        image: vi.fn(() => createMockGameObject()),
        container: vi.fn(() => createMockGameObject()),
        circle: vi.fn(() => createMockGameObject()),
        graphics: vi.fn(() => createMockGameObject()),
        zone: vi.fn(() => createMockGameObject()),
        particles: vi.fn(() => createMockGameObject()),
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
        delayedCall: vi.fn(),
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

  return {
    default: {
      Scene: MockScene,
      Game: vi.fn(),
      Scale: { FIT: 0, CENTER_BOTH: 0 },
      AUTO: "AUTO",
      Curves: { Path: MockPath },
    },
    Scene: MockScene,
    Game: vi.fn(),
    Scale: { FIT: 0, CENTER_BOTH: 0 },
    AUTO: "AUTO",
    Curves: { Path: MockPath },
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
    playCorrect: vi.fn(),
    playIncorrect: vi.fn(),
    playWin: vi.fn(),
    playSticker: vi.fn(),
    playPop: vi.fn(),
    playWake: vi.fn(),
  },
}));

vi.mock("../../audio/AudioManager", () => ({
  AudioManager: {
    getInstance: () => mockAudio,
  },
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

/** Triggers the shutdown event on a scene, invoking any registered shutdown callbacks. */
function triggerShutdown(scene: unknown): void {
  const events = (scene as { events: Record<string, unknown> }).events;
  const onMock = getMockFn(events.on);
  const shutdownCall = onMock.mock.calls.find((call) => call[0] === "shutdown");
  if (shutdownCall && typeof shutdownCall[1] === "function") {
    shutdownCall[1]();
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

    it("loads all 20 shape, animal/food, sticker, and bubble SVGs during preload", () => {
      const scene = new PreloadScene();
      scene.preload();

      const svgCalls = getMockFn(scene.load.svg).mock.calls;
      expect(svgCalls).toHaveLength(20);
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

      triggerAllPointerdowns(scene);

      const startMock = getMockFn(scene.scene.start);
      const startedKeys = startMock.mock.calls.map((call) => call[0] as string);

      for (const key of GAME_SCENE_KEYS) {
        expect(startedKeys).toContain(key);
      }
    });

    it("resumes AudioManager when a tile is clicked", () => {
      const scene = new HubScene();
      scene.create();

      triggerAllPointerdowns(scene);

      expect(mockAudio.resume).toHaveBeenCalled();
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

        expect(getMockFn(scene.scene.start)).toHaveBeenCalledWith("Hub");
      },
    );
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

    it("correct drop snaps shape to slot center, marks non-interactive, triggers SFX + particles", () => {
      const scene = new ShapeSorterScene();
      scene.create();

      const shapes = getShapes(scene);
      const slots = getSlots(scene);
      const shape = shapes[0];
      const slot = slots.find((s) => s.type === shape.type);
      if (!slot) throw new Error("No matching slot found");

      // Simulate drop on matching zone
      const onCalls = getMockFn(shape.obj.on).mock.calls;
      const dropCall = onCalls.find((c) => c[0] === "drop");
      const dropCallback = dropCall?.[1] as (pointer: unknown, target: unknown) => void;
      dropCallback(null, slot.zone);

      expect(getMockFn(shape.obj.setPosition)).toHaveBeenCalledWith(slot.x, slot.y);
      expect(getMockFn(shape.obj.disableInteractive)).toHaveBeenCalled();
      expect(mockAudio.playCorrect).toHaveBeenCalled();
      expect(getMockFn(scene.add.particles)).toHaveBeenCalled();
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

      expect(getMockFn(animalSprite.setPosition)).toHaveBeenCalledWith(
        pathPoints[1].x,
        pathPoints[1].y,
      );
    });

    it("pointer far from path does not advance animal", () => {
      const scene = new AnimalTraceScene();
      scene.create();

      const animalSprite = getAnimalSprite(scene);

      const pointerdown = getInputCallback(scene, "pointerdown");
      const pointermove = getInputCallback(scene, "pointermove");

      pointerdown({ x: 500, y: 100 });
      pointermove({ x: 600, y: 100 });

      expect(getMockFn(animalSprite.setPosition)).not.toHaveBeenCalled();
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

      // Animal should still be at point 1 (last setPosition call)
      const setPositionCalls = getMockFn(animalSprite.setPosition).mock.calls;
      const lastCall = setPositionCalls[setPositionCalls.length - 1];
      expect(lastCall).toEqual([pathPoints[1].x, pathPoints[1].y]);
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

      // Animal should now be at point 2
      const setPositionCalls = getMockFn(animalSprite.setPosition).mock.calls;
      const lastCall = setPositionCalls[setPositionCalls.length - 1];
      expect(lastCall).toEqual([pathPoints[2].x, pathPoints[2].y]);
    });

    it("reaching food triggers correct SFX + particle burst", () => {
      const scene = new AnimalTraceScene();
      scene.create();

      completePath(scene);

      expect(mockAudio.playCorrect).toHaveBeenCalled();
      expect(getMockFn(scene.add.particles)).toHaveBeenCalled();
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

      expect(getMockFn(animalSprite.setPosition)).toHaveBeenCalledWith(
        pathPoints[1].x,
        pathPoints[1].y,
      );
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

    it("destroys particle emitter when advancing to next pair", () => {
      const scene = new AnimalTraceScene();
      scene.create();

      completePath(scene);

      // Get the particle emitter created on path completion
      const particlesMock = getMockFn(scene.add.particles);
      const emitter = particlesMock.mock.results[0].value as Record<string, MockFn>;

      // Trigger the advance callback to render next pair
      const delayedCallMock = getMockFn(scene.time.delayedCall);
      const advanceCall = delayedCallMock.mock.calls.find((call) => call[0] === 1000);
      const callback = advanceCall?.[1] as () => void;
      callback();

      expect(getMockFn(emitter.destroy)).toHaveBeenCalled();
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

      expect(getMockFn(scene.scene.start)).toHaveBeenCalledWith("Hub");
    });

    it("triggers win animation tween on round completion", () => {
      vi.mocked(hasSticker).mockReturnValue(false);

      const scene = new AnimalTraceScene();
      scene.create();
      completeAllPaths(scene);

      const tweenCalls = getMockFn(scene.tweens.add).mock.calls;
      const winTween = tweenCalls.find(
        (c) => c[0]?.yoyo === true && c[0]?.scaleX === 1.2 && c[0]?.scaleY === 1.2,
      );
      expect(winTween).toBeDefined();
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

    it("tapping a poppable bubble triggers pop SFX + particle burst", () => {
      const scene = new PopFreezeScene();
      scene.create();

      const bubbles = getBubbles(scene);
      // With Math.random=0.5: bubble 0 is sleeping, bubbles 1-4 are poppable
      const poppableBubble = bubbles[1];

      tapBubble(poppableBubble);

      expect(mockAudio.playPop).toHaveBeenCalled();
      expect(getMockFn(scene.add.particles)).toHaveBeenCalled();
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

      expect(getMockFn(scene.scene.start)).toHaveBeenCalledWith("Hub");
    });

    it("triggers win animation tween on round completion", () => {
      vi.mocked(hasSticker).mockReturnValue(false);

      const scene = new PopFreezeScene();
      scene.create();
      completeRound(scene);

      const tweenCalls = getMockFn(scene.tweens.add).mock.calls;
      const winTween = tweenCalls.find(
        (c) => c[0]?.yoyo === true && c[0]?.scaleX === 1.2 && c[0]?.scaleY === 1.2,
      );
      expect(winTween).toBeDefined();
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
  });
});
