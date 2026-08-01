import type Phaser from "phaser";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  attachDragLift,
  attachDropZoneHighlight,
  type DropZoneHighlightTarget,
  snapToSlot,
} from "../../utils/dragJuice";

type MockFn = ReturnType<typeof vi.fn>;

interface MockGameObject {
  on: MockFn;
  scene: { tweens: { add: MockFn } };
  scaleX: number;
  scaleY: number;
  destroy: MockFn;
  setPosition: MockFn;
  lineStyle: MockFn;
  strokeRect: MockFn;
}

function createMockObject(): MockGameObject {
  return {
    on: vi.fn(),
    scene: { tweens: { add: vi.fn() } },
    scaleX: 1,
    scaleY: 1,
    destroy: vi.fn(),
    setPosition: vi.fn(),
    lineStyle: vi.fn(),
    strokeRect: vi.fn(),
  };
}

function createMockScene(): {
  tweens: { add: MockFn };
  add: { graphics: MockFn };
  input: { on: MockFn };
} {
  return {
    tweens: { add: vi.fn() },
    add: { graphics: vi.fn(() => createMockObject()) },
    input: { on: vi.fn() },
  };
}

function stubReducedMotion(matches: boolean): void {
  vi.stubGlobal(
    "window",
    { matchMedia: vi.fn(() => ({ matches })) },
    { original: globalThis.window },
  );
}

function getTweenCalls(scene: ReturnType<typeof createMockScene>): Array<Record<string, unknown>> {
  return scene.tweens.add.mock.calls.map((call) => call[0] as Record<string, unknown>);
}

describe("attachDragLift", () => {
  it("lifts and tilts the object on drag start", () => {
    const obj = createMockObject();
    attachDragLift(obj as unknown as Phaser.GameObjects.Image);

    const dragstart = obj.on.mock.calls.find((c) => c[0] === "dragstart")?.[1] as () => void;
    expect(dragstart).toBeDefined();
    dragstart();

    const tween = getTweenCalls(obj.scene as never)[0];
    expect(tween.targets).toBe(obj);
    expect(tween.scaleX).toBe(1.1);
    expect(tween.scaleY).toBe(1.1);
    expect(tween.angle).toBe(4);
    expect(tween.duration).toBe(120);
    expect(tween.ease).toBe("Sine.out");
  });

  it("restores scale and tilt on drag end", () => {
    const obj = createMockObject();
    obj.scaleX = 0.5;
    obj.scaleY = 0.5;
    attachDragLift(obj as unknown as Phaser.GameObjects.Image);

    const dragend = obj.on.mock.calls.find((c) => c[0] === "dragend")?.[1] as () => void;
    dragend();

    const tween = getTweenCalls(obj.scene as never)[0];
    expect(tween.targets).toBe(obj);
    expect(tween.scaleX).toBe(0.5);
    expect(tween.scaleY).toBe(0.5);
    expect(tween.angle).toBe(0);
    expect(tween.duration).toBe(150);
  });

  it("uses reduced-motion amplitudes and durations", () => {
    stubReducedMotion(true);
    const obj = createMockObject();
    attachDragLift(obj as unknown as Phaser.GameObjects.Image);

    const dragstartCall = obj.on.mock.calls.find((c) => c[0] === "dragstart");
    const dragendCall = obj.on.mock.calls.find((c) => c[0] === "dragend");
    if (!dragstartCall || !dragendCall) {
      throw new Error("Missing drag listeners");
    }
    (dragstartCall[1] as () => void)();
    (dragendCall[1] as () => void)();

    const [lift, restore] = getTweenCalls(obj.scene as never);
    expect(lift.scaleX).toBe(1.05);
    expect(lift.angle).toBe(0);
    expect(lift.duration).toBe(80);
    expect(restore.duration).toBe(100);
  });
});

describe("attachDropZoneHighlight", () => {
  const zone = {} as Phaser.GameObjects.Zone;
  const targets: DropZoneHighlightTarget[] = [{ zone, x: 100, y: 200, width: 160, height: 160 }];

  function getInputCallback(
    scene: ReturnType<typeof createMockScene>,
    event: string,
  ): (...args: unknown[]) => void {
    const call = scene.input.on.mock.calls.find((c) => c[0] === event);
    if (!call) {
      throw new Error(`Missing input listener for event '${event}'`);
    }
    return call[1] as (...args: unknown[]) => void;
  }

  it("pulses a soft outline while dragging over a matching zone", () => {
    const scene = createMockScene();
    attachDropZoneHighlight(scene as never, targets);

    const graphics = createMockObject();
    scene.add.graphics.mockReturnValueOnce(graphics);
    getInputCallback(scene, "dragenter")(null, null, zone);

    expect(graphics.setPosition).toHaveBeenCalledWith(100, 200);
    expect(graphics.lineStyle).toHaveBeenCalledWith(6, 0x2b6cb0, 0.9);
    expect(graphics.strokeRect).toHaveBeenCalledWith(-80, -80, 160, 160);

    const tween = getTweenCalls(scene)[0];
    expect(tween.targets).toBe(graphics);
    expect(tween.scaleX).toBe(1.06);
    expect(tween.yoyo).toBe(true);
    expect(tween.repeat).toBe(-1);
  });

  it("ignores dragenter over an unknown zone", () => {
    const scene = createMockScene();
    attachDropZoneHighlight(scene as never, targets);

    getInputCallback(scene, "dragenter")(null, null, {});

    expect(scene.add.graphics).not.toHaveBeenCalled();
    expect(getTweenCalls(scene)).toHaveLength(0);
  });

  it("destroys the outline on dragleave", () => {
    const scene = createMockScene();
    attachDropZoneHighlight(scene as never, targets);

    const graphics = createMockObject();
    scene.add.graphics.mockReturnValueOnce(graphics);
    getInputCallback(scene, "dragenter")(null, null, zone);
    getInputCallback(scene, "dragleave")(null, null, zone);

    expect(graphics.destroy).toHaveBeenCalledTimes(1);
  });

  it("destroys the outline when the drag ends", () => {
    const scene = createMockScene();
    attachDropZoneHighlight(scene as never, targets);

    const graphics = createMockObject();
    scene.add.graphics.mockReturnValueOnce(graphics);
    getInputCallback(scene, "dragenter")(null, null, zone);
    getInputCallback(scene, "dragend")();

    expect(graphics.destroy).toHaveBeenCalledTimes(1);
  });

  it("uses reduced-motion pulse amplitude and duration", () => {
    stubReducedMotion(true);
    const scene = createMockScene();
    attachDropZoneHighlight(scene as never, targets);

    getInputCallback(scene, "dragenter")(null, null, zone);

    const tween = getTweenCalls(scene)[0];
    expect(tween.scaleX).toBe(1.02);
    expect(tween.duration).toBe(240);
  });
});

describe("snapToSlot", () => {
  it("tweens the object to the slot with a springy Back.out ease", () => {
    const scene = createMockScene();
    const obj = createMockObject();
    snapToSlot(scene as never, obj as unknown as Phaser.GameObjects.Image, 300, 400);

    const tween = getTweenCalls(scene)[0];
    expect(tween.targets).toBe(obj);
    expect(tween.x).toBe(300);
    expect(tween.y).toBe(400);
    expect(tween.duration).toBe(200);
    expect(tween.ease).toBe("Back.out");
  });

  it("shortens the tween under reduced motion", () => {
    stubReducedMotion(true);
    const scene = createMockScene();
    snapToSlot(scene as never, createMockObject() as unknown as Phaser.GameObjects.Image, 0, 0);

    expect(getTweenCalls(scene)[0].duration).toBe(120);
  });
});

beforeEach(() => {
  vi.unstubAllGlobals();
});

afterEach(() => {
  vi.unstubAllGlobals();
});
