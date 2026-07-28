import { beforeEach, describe, expect, it, vi } from "vitest";

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
    sys!: { events: Record<string, MockFn> };
    events!: Record<string, MockFn>;
    children!: Record<string, MockFn>;

    constructor() {
      this.add = {
        rectangle: vi.fn(() => createMockGameObject()),
        text: vi.fn(() => createMockGameObject()),
        image: vi.fn(() => createMockGameObject()),
        container: vi.fn(() => createMockGameObject()),
        circle: vi.fn(() => createMockGameObject()),
        graphics: vi.fn(() => createMockGameObject()),
        zone: vi.fn(() => createMockGameObject()),
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
    }
  }

  return {
    default: {
      Scene: MockScene,
      Game: vi.fn(),
      Scale: { FIT: 0, CENTER_BOTH: 0 },
      AUTO: "AUTO",
    },
    Scene: MockScene,
    Game: vi.fn(),
    Scale: { FIT: 0, CENTER_BOTH: 0 },
    AUTO: "AUTO",
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
  };
});

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

    it("loads all 8 shape SVGs during preload", () => {
      const scene = new PreloadScene();
      scene.preload();

      const svgCalls = getMockFn(scene.load.svg).mock.calls;
      expect(svgCalls).toHaveLength(8);
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
