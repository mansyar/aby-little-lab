import type Phaser from "phaser";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createGameLoadCue } from "../../components/GameLoadCue";
import { type MockObject, MockScene, mockRegistry } from "../helpers/phaserMock";

/**
 * The motion module is mocked so the reduced-motion branch can be driven from a
 * test instead of depending on the host's `prefers-reduced-motion`.
 */
const motion = vi.hoisted(() => ({ isReducedMotion: vi.fn(() => false) }));
vi.mock("../../utils/motion", () => motion);

const asScene = (scene: MockScene): Phaser.Scene => scene as unknown as Phaser.Scene;

function objectsOfKind(kind: string): MockObject[] {
  return mockRegistry.filter((object) => object.kind === kind);
}

/** The cue's ring graphics (the only graphics object it creates). */
function ringOf(): MockObject {
  const [ring] = objectsOfKind("graphics");
  if (!ring) throw new Error("cue ring not created");
  return ring;
}

/** The cue's 96x96 hit floor (the only rectangle it creates). */
function hitFloorOf(): MockObject {
  const [floor] = objectsOfKind("rectangle");
  if (!floor) throw new Error("cue hit floor not created");
  return floor;
}

function tapCue(): void {
  hitFloorOf().handlers.pointerup?.();
}

beforeEach(() => {
  vi.clearAllMocks();
  motion.isReducedMotion.mockReturnValue(false);
  mockRegistry.length = 0;
});

describe("createGameLoadCue", () => {
  it("draws a textless ring and circular arrow centred on the tile", () => {
    const scene = new MockScene();
    const cue = createGameLoadCue(asScene(scene));
    cue.show({ onRetry: vi.fn(), x: 146, y: 268 });

    expect(cue.isActive()).toBe(true);
    expect(scene.add.text).not.toHaveBeenCalled();
    expect(scene.add.zone).not.toHaveBeenCalled();

    const ring = ringOf();
    expect(ring.setPosition).toHaveBeenCalledWith(146, 268);
    expect(ring.setDepth).toHaveBeenCalledWith(12);
    // Backdrop disc, ring and arrow are all painted around the origin so the
    // pulse scales about the cue's centre.
    expect(ring.fillCircle).toHaveBeenCalledWith(0, 0, 48);
    expect(ring.strokeCircle).toHaveBeenCalledWith(0, 0, 30);
    expect(ring.arc).toHaveBeenCalled();
    expect(ring.fillPath).toHaveBeenCalled();
  });

  it("covers a 96x96 hit floor and nothing larger", () => {
    const scene = new MockScene();
    createGameLoadCue(asScene(scene)).show({
      onRetry: vi.fn(),
      x: 146,
      y: 268,
    });

    expect(scene.add.rectangle).toHaveBeenCalledWith(146, 268, 96, 96);
    const floor = hitFloorOf();
    expect(floor.setFillStyle).toHaveBeenCalledWith(0x000000, 0);
    expect(floor.setInteractive).toHaveBeenCalled();
    expect(floor.setDepth).toHaveBeenCalledWith(12);
    // Only the hit floor takes pointer input; the drawing never does.
    expect(ringOf().setInteractive).not.toHaveBeenCalled();
  });

  it("is one cue at a time: a second show adds no objects and no listener", () => {
    const scene = new MockScene();
    const cue = createGameLoadCue(asScene(scene));
    const onRetry = vi.fn();

    cue.show({ onRetry, x: 100, y: 200 });
    cue.show({ onRetry, x: 700, y: 500 });

    expect(objectsOfKind("graphics")).toHaveLength(1);
    expect(objectsOfKind("rectangle")).toHaveLength(1);
    // The second position is ignored rather than silently moved to: the
    // caller destroys the cue before showing it elsewhere.
    expect(ringOf().setPosition).toHaveBeenCalledTimes(1);
  });

  it("calls onRetry on pointerup, once per cue", () => {
    const scene = new MockScene();
    const onRetry = vi.fn();
    createGameLoadCue(asScene(scene)).show({
      onRetry,
      x: 146,
      y: 268,
    });

    tapCue();

    expect(onRetry).toHaveBeenCalledTimes(1);
    // The retry is the cue's whole purpose; a tap already spent must not start
    // a second load during the frame the caller spends destroying the cue.
    tapCue();
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("destroy is idempotent, removes the objects and detaches the handler", () => {
    const scene = new MockScene();
    const onRetry = vi.fn();
    const cue = createGameLoadCue(asScene(scene));
    cue.show({ onRetry, x: 146, y: 268 });

    const ring = ringOf();
    const floor = hitFloorOf();
    cue.destroy();

    expect(ring.destroy).toHaveBeenCalledTimes(1);
    expect(floor.destroy).toHaveBeenCalledTimes(1);
    expect(floor.off).toHaveBeenCalledWith("pointerup", expect.any(Function));
    expect(scene.events.off).toHaveBeenCalledWith("shutdown", expect.any(Function));
    expect(cue.isActive()).toBe(false);

    expect(() => cue.destroy()).not.toThrow();
    expect(ring.destroy).toHaveBeenCalledTimes(1);

    // Behaviour, not bookkeeping: a stray tap and a later shutdown are inert.
    tapCue();
    expect(onRetry).not.toHaveBeenCalled();
    expect(() => scene.events.emit("shutdown")).not.toThrow();
  });

  it("pulses the ring once and keeps it still under reduced motion", () => {
    const normal = new MockScene();
    createGameLoadCue(asScene(normal)).show({
      onRetry: vi.fn(),
      x: 146,
      y: 268,
    });

    expect(normal.tweens.add).toHaveBeenCalledTimes(1);
    const config = normal.tweens.add.mock.calls[0][0] as {
      targets: MockObject;
      scale: number;
      yoyo: boolean;
      repeat: number;
    };
    expect(config.targets).toBe(ringOf());
    expect(config.scale).toBe(1.06);
    expect(config.yoyo).toBe(true);
    expect(config.repeat).toBe(-1);

    mockRegistry.length = 0;
    motion.isReducedMotion.mockReturnValue(true);
    const reduced = new MockScene();
    createGameLoadCue(asScene(reduced)).show({
      onRetry: vi.fn(),
      x: 146,
      y: 268,
    });

    expect(reduced.tweens.add).not.toHaveBeenCalled();
    // The static ring still exists — only the motion is dropped.
    expect(ringOf().strokeCircle).toHaveBeenCalledWith(0, 0, 30);
  });

  it("stops its tween on destroy rather than leaving a loop behind", () => {
    const scene = new MockScene();
    const cue = createGameLoadCue(asScene(scene));
    cue.show({ onRetry: vi.fn(), x: 146, y: 268 });

    const tween = scene.tweens.add.mock.results[0].value as { remove: () => void };
    cue.destroy();

    expect(tween.remove).toHaveBeenCalledTimes(1);
  });

  it("clears itself when the scene shuts down", () => {
    const scene = new MockScene();
    const cue = createGameLoadCue(asScene(scene));
    cue.show({ onRetry: vi.fn(), x: 146, y: 268 });

    scene.events.emit("shutdown");

    expect(cue.isActive()).toBe(false);
    expect(ringOf().destroy).toHaveBeenCalledTimes(1);
    expect(hitFloorOf().destroy).toHaveBeenCalledTimes(1);
  });
});
