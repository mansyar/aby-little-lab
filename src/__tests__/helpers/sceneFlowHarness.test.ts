import { describe, expect, it, vi } from "vitest";
import { MockScene } from "./phaserMock";
import { triggerShutdown } from "./sceneFlowHarness";

describe("triggerShutdown", () => {
  it("fires a once-registered shutdown handler once and an on-registered one on every call", () => {
    const scene = new MockScene();
    const onceHandler = vi.fn();
    const onHandler = vi.fn();
    scene.events.once("shutdown", onceHandler);
    scene.events.on("shutdown", onHandler);

    triggerShutdown(scene);
    triggerShutdown(scene);

    // Phaser retires a `once` listener before invoking it, so a shutdown
    // handler must not run again on a later shutdown.
    expect(onceHandler).toHaveBeenCalledTimes(1);
    expect(onHandler).toHaveBeenCalledTimes(2);
  });
});
