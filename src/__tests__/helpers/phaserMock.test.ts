import { describe, expect, it, vi } from "vitest";
import {
  createMockGameObject,
  createPhaserModuleMock,
  type MockObject,
  MockPath,
  MockRectangle,
  MockScene,
} from "./phaserMock";

const CHAINABLE_SETTERS = [
  "setOrigin",
  "setScale",
  "setTexture",
  "setDepth",
  "setStyle",
  "setFontSize",
  "setText",
  "setColor",
  "setVisible",
  "setAlpha",
  "setPosition",
  "setSize",
  "setDisplaySize",
  "setStrokeStyle",
  "setFillStyle",
  "setVelocity",
  "setCollideWorldBounds",
  "setBounce",
  "setCircle",
  "setTint",
  "clearTint",
  "setAngle",
  "fillStyle",
  "fillCircle",
  "fillRoundedRect",
  "slice",
  "fillPath",
  "lineBetween",
  "clear",
  "beginPath",
  "moveTo",
  "lineTo",
  "strokePath",
  "arc",
  "lineStyle",
  "strokeRect",
  "strokeCircle",
  "strokeRoundedRect",
  "bringToTop",
] as const;

describe("createMockGameObject", () => {
  it("returns the object from every chainable setter", () => {
    const obj = createMockGameObject();

    for (const setter of CHAINABLE_SETTERS) {
      const fn = obj[setter] as (...args: unknown[]) => unknown;
      expect(fn.call(obj), setter).toBe(obj);
    }
  });

  it("records event handlers on `on` and accumulates them in allHandlers", () => {
    const obj = createMockGameObject();
    const cb = vi.fn();

    obj.on("pointerdown", cb);

    expect(obj.handlers.pointerdown).toBe(cb);
    expect(obj.allHandlers).toEqual([{ name: "pointerdown", cb }]);
  });

  it("overwrites handlers map per event but keeps every registration", () => {
    const obj = createMockGameObject();
    const first = vi.fn();
    const second = vi.fn();

    obj.on("pointerup", first);
    obj.on("pointerup", second);

    expect(obj.handlers.pointerup).toBe(second);
    expect(obj.allHandlers).toEqual([
      { name: "pointerup", cb: first },
      { name: "pointerup", cb: second },
    ]);
  });

  it("tags kind and links the owning scene", () => {
    const scene = { id: "scene" };
    const obj = createMockGameObject(scene, "text");

    expect(obj.kind).toBe("text");
    expect(obj.scene).toBe(scene);
  });

  it("defaults to the generic kind without a scene", () => {
    const obj = createMockGameObject();

    expect(obj.kind).toBe("generic");
    expect(obj.scene).toBeUndefined();
  });

  it("starts at unit scale", () => {
    const obj = createMockGameObject();

    expect(obj.scaleX).toBe(1);
    expect(obj.scaleY).toBe(1);
  });

  it("returns the viewport center from getCenter", () => {
    const obj = createMockGameObject();

    expect(obj.getCenter()).toEqual({ x: 0, y: 0 });
  });

  it("registers itself in the provided registry", () => {
    const registry: MockObject[] = [];
    const obj = createMockGameObject(undefined, "rectangle", registry);

    expect(registry).toEqual([obj]);
  });
});

describe("MockScene", () => {
  it("records scene-level input handlers by event name", () => {
    const scene = new MockScene();
    const handler = vi.fn();

    scene.input.on("pointerdown", handler);
    scene.input.on("pointerdown", handler);
    scene.input.on("pointerup", handler);

    expect(scene.sceneInputHandlers.pointerdown).toEqual([handler, handler]);
    expect(scene.sceneInputHandlers.pointerup).toEqual([handler]);
  });

  it("records scale-manager handlers by event name", () => {
    const scene = new MockScene();
    const handler = vi.fn();

    scene.scale.on("resize", handler);

    expect(scene.scaleHandlers.resize).toEqual([handler]);
  });

  it("records scene-event handlers by event name", () => {
    const scene = new MockScene();
    const handler = vi.fn();

    scene.events.on("shutdown", handler);

    expect(scene.eventsHandlers.shutdown).toEqual([handler]);
  });

  it("adds game objects tagged with their kind and captured args", () => {
    const scene = new MockScene();

    const rect = scene.add.rectangle(10, 20, 30, 40, 0xff0000);
    expect(rect.kind).toBe("rectangle");
    expect(rect.args).toEqual([10, 20, 30, 40, 0xff0000]);
    expect(rect.scene).toBe(scene);

    expect(scene.add.text("hi").kind).toBe("text");
    expect(scene.add.image("key").kind).toBe("image");
    expect(scene.add.container().kind).toBe("container");
    expect(scene.add.circle(1).kind).toBe("circle");
    expect(scene.add.graphics().kind).toBe("graphics");
    expect(scene.add.zone(0, 0, 1, 1).kind).toBe("zone");
    expect(scene.add.particles(0, 0, "key").kind).toBe("particles");
  });

  it("captures image args too", () => {
    const scene = new MockScene();

    const img = scene.add.image("sticker", 5, 6);

    expect(img.args).toEqual(["sticker", 5, 6]);
  });

  it("captures text args too", () => {
    const scene = new MockScene();

    const label = scene.add.text(512, 384, "Settings", { fontSize: "36px" });

    expect(label.args).toEqual([512, 384, "Settings", { fontSize: "36px" }]);
  });

  it("exposes the 1024x768 canvas metrics", () => {
    const scene = new MockScene();

    expect(scene.cameras.main.width).toBe(1024);
    expect(scene.cameras.main.height).toBe(768);
    expect(scene.cameras.main.centerX).toBe(512);
    expect(scene.cameras.main.centerY).toBe(384);
    expect(scene.scale.width).toBe(1024);
    expect(scene.scale.height).toBe(768);
    expect(scene.scale.displaySize).toEqual({ width: 1024, height: 768 });
  });

  it("exposes scene-management, load, tween, and timer mocks", () => {
    const scene = new MockScene();

    for (const method of [
      "start",
      "stop",
      "launch",
      "get",
      "switch",
      "sleep",
      "wake",
      "pause",
      "resume",
    ] as const) {
      expect(scene.scene[method]).toBeTypeOf("function");
    }
    for (const method of ["svg", "image", "audio", "on", "once", "off"] as const) {
      expect(scene.load[method]).toBeTypeOf("function");
    }
    expect(scene.time.delayedCall(100, vi.fn())).toEqual({ remove: expect.any(Function) });
    expect(scene.tweens.add({})).toEqual({
      remove: expect.any(Function),
      stop: expect.any(Function),
    });
    expect(scene.sys.events).toBe(scene.events);
  });

  it("creates physics bodies and exposes world bounds mocks", () => {
    const scene = new MockScene();

    const body = scene.physics.add.image(1, 2, "key");
    expect(body.kind).toBe("physics-image");
    expect(scene.physics.world.setBounds).toBeTypeOf("function");
    expect(scene.physics.world.setBoundsCollision).toBeTypeOf("function");
  });

  it("exposes the ScenePlugin add method", () => {
    const scene = new MockScene();

    expect(scene.scene.add).toBeTypeOf("function");
  });

  it("exposes children.bringToTop", () => {
    const scene = new MockScene();

    expect(scene.children.bringToTop).toBeTypeOf("function");
  });

  it("emits scene events to on- and once-registered handlers, dropping once after fire", () => {
    const scene = new MockScene();
    const onHandler = vi.fn();
    const onceHandler = vi.fn();

    scene.events.on("shutdown", onHandler);
    scene.events.once("shutdown", onceHandler);
    expect(scene.eventsHandlers.shutdown).toEqual([onHandler, onceHandler]);

    scene.events.emit("shutdown");
    expect(onHandler).toHaveBeenCalledTimes(1);
    expect(onceHandler).toHaveBeenCalledTimes(1);

    scene.events.emit("shutdown");
    expect(onHandler).toHaveBeenCalledTimes(2);
    expect(onceHandler).toHaveBeenCalledTimes(1);
  });
});

describe("createPhaserModuleMock", () => {
  it("returns a phaser module shape with default and named exports", () => {
    const { module } = createPhaserModuleMock();

    expect(module.default).toBeDefined();
    expect(module.default.Scene).toBe(module.Scene);
    expect(module.Scene).toBe(MockScene);
    expect(module.Game).toBeTypeOf("function");
    expect(module.Scale).toEqual({ FIT: 0, CENTER_BOTH: 0 });
    expect(module.AUTO).toBe("AUTO");
    expect(module.Curves.Path).toBe(MockPath);
    expect(module.Geom.Rectangle).toBe(MockRectangle);
  });

  it("registers every game object created through the module's Scene", () => {
    const { module, mockRegistry } = createPhaserModuleMock();
    mockRegistry.length = 0;

    const Scene = module.Scene as typeof MockScene;
    const scene = new Scene();
    scene.add.text("hi");
    scene.add.rectangle(0, 0, 1, 1);

    expect(mockRegistry).toHaveLength(2);
    expect(mockRegistry[0].kind).toBe("text");
    expect(mockRegistry[1].kind).toBe("rectangle");
  });

  it("exposes the module-level registry shared with directly created objects", () => {
    const { mockRegistry } = createPhaserModuleMock();
    mockRegistry.length = 0;

    createMockGameObject(undefined, "generic");

    expect(mockRegistry).toHaveLength(1);
  });
});

describe("MockPath", () => {
  it("supports chainable curve building", () => {
    const path = new MockPath();

    expect(path.add(1)).toBe(path);
    expect(path.lineTo(2, 3)).toBe(path);
    expect(path.getPoints()).toEqual([]);
    expect(path.start).toEqual({ x: 0, y: 0 });
    expect(path.end).toEqual({ x: 0, y: 0 });
  });
});

describe("MockRectangle", () => {
  it("stores geometry and contains by default", () => {
    const rect = new MockRectangle(1, 2, 3, 4);

    expect(rect.x).toBe(1);
    expect(rect.y).toBe(2);
    expect(rect.width).toBe(3);
    expect(rect.height).toBe(4);
    expect(MockRectangle.Contains()).toBe(true);
  });
});
