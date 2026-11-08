import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("phaser", async () => {
  const { createPhaserModuleMock } = await import("../helpers/phaserMock");
  return createPhaserModuleMock().module;
});

const reloadOnce = vi.hoisted(() => vi.fn());
vi.mock("../../utils/reload", () => ({ reloadOnce }));

import { RecoverScene } from "../../scenes/RecoverScene";
import { mockRegistry } from "../helpers/phaserMock";

/** The objects that were given a hit area — the card should have exactly one. */
function interactiveObjects() {
  return mockRegistry.filter((object) => object.setInteractive.mock.calls.length > 0);
}

describe("RecoverScene", () => {
  beforeEach(() => {
    mockRegistry.length = 0;
    reloadOnce.mockReset();
  });

  it("draws no text at all", () => {
    const scene = new RecoverScene();
    scene.create();

    // The rule, not a nicety: a four-year-old cannot read, so the card is a
    // mascot and one arrow (FR-6, NFR-7).
    expect(scene.add.text).not.toHaveBeenCalled();
  });

  it("covers the whole canvas with the page background", () => {
    const scene = new RecoverScene();
    scene.create();

    expect(scene.add.rectangle).toHaveBeenCalledWith(512, 384, 1024, 768, 0xfaf9f6, 1);
  });

  it("draws the mascot when the texture is loaded", () => {
    const scene = new RecoverScene();
    scene.textures.createCanvas("mascot_idle");

    scene.create();

    expect(scene.add.image).toHaveBeenCalledWith(512, 330, "mascot_idle");
  });

  it("draws the card without the mascot when the texture never loaded", () => {
    const scene = new RecoverScene();

    expect(() => scene.create()).not.toThrow();
    expect(scene.add.image).not.toHaveBeenCalled();
    expect(scene.add.rectangle).toHaveBeenCalled();
  });

  it("makes exactly one object interactive: the button", () => {
    const scene = new RecoverScene();
    scene.create();

    const interactive = interactiveObjects();
    expect(interactive).toHaveLength(1);
    expect(interactive[0].kind).toBe("circle");
    expect(interactive[0].setInteractive).toHaveBeenCalledTimes(1);
    // Hit-tested as a circle, so a tap in the corner of the painting box misses.
    expect(interactive[0].setInteractive).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(Function),
    );
  });

  it("reloads when the button is tapped", () => {
    const scene = new RecoverScene();
    scene.create();
    const [button] = interactiveObjects();

    button.handlers.pointerdown?.();

    expect(reloadOnce).toHaveBeenCalledTimes(1);
  });
});
