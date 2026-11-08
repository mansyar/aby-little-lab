import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("phaser", async () => {
  const { createPhaserModuleMock } = await import("../helpers/phaserMock");
  return createPhaserModuleMock().module;
});

import Phaser from "phaser";
import { RecoverScene } from "../../scenes/RecoverScene";
import { mockRegistry } from "../helpers/phaserMock";

/** The flag the pre-canvas path spends; the card must not consult it. */
const SPENT_KEY = "aby-little-lab:reload-once";

/** A `sessionStorage` that behaves like the real one, in a `Map`. */
function memoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => [...store.keys()][index] ?? null,
    removeItem: (key: string) => store.delete(key),
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  } as Storage;
}

let reload: ReturnType<typeof vi.fn>;

/**
 * The card calls the real reload seam, so the page load is what gets stubbed.
 * Mocking the module instead would let a card that consults the loop guard pass
 * — which is exactly the defect this file now pins.
 */
function stubWindow(): void {
  reload = vi.fn();
  vi.stubGlobal("window", { sessionStorage: memoryStorage(), location: { reload } });
}

/** The objects that were given a hit area — the card should have exactly one. */
function interactiveObjects() {
  return mockRegistry.filter((object) => object.setInteractive.mock.calls.length > 0);
}

describe("RecoverScene", () => {
  beforeEach(() => {
    mockRegistry.length = 0;
    stubWindow();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
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
    // A Zone, not a transparent Arc: Phaser does not hit-test a game object whose
    // alpha is 0, so the first version of this card drew a button nothing could
    // press. The kind is asserted by name so that regression is a red test.
    expect(interactive[0].kind).toBe("zone");
    expect(interactive[0].setInteractive).toHaveBeenCalledTimes(1);
  });

  it("hit-tests the button as a circle centred in its own box, so a corner tap misses", () => {
    const scene = new RecoverScene();
    scene.create();
    const [button] = interactiveObjects();
    const [hitArea, contains] = button.setInteractive.mock.calls[0] as unknown as [
      { x: number; y: number; radius: number },
      unknown,
    ];

    // Local space, measured from the Zone's top-left corner: a 144 x 144 box
    // with a circle of radius 72 at (72, 72) covers the disc and nothing else.
    // Asserting the shape rather than "some hit area exists" is what makes the
    // old off-centre circle, which also passed, a red test.
    expect(hitArea).toMatchObject({ x: 72, y: 72, radius: 72 });
    expect(contains).toBe(Phaser.Geom.Circle.Contains);
  });

  it("reloads when the button is tapped", () => {
    const scene = new RecoverScene();
    scene.create();
    const [button] = interactiveObjects();

    button.handlers.pointerdown?.();

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("still reloads when this tab already spent its one automatic reload (F1)", () => {
    // The tab crashed once before the canvas came up, or a child pressed the
    // card already: `sessionStorage` survives the reload, so the flag is spent.
    // A card that called `reloadOnce()` here left a dead button on the second
    // crash, which is the failure this track exists to remove.
    window.sessionStorage.setItem(SPENT_KEY, "1");
    const scene = new RecoverScene();
    scene.create();
    const [button] = interactiveObjects();

    button.handlers.pointerdown?.();

    expect(window.sessionStorage.getItem(SPENT_KEY)).toBe("1");
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("publishes the centre it drew the button at, for the browser suite", () => {
    const scene = new RecoverScene();
    scene.create();
    const [button] = interactiveObjects();

    // The published point is the drawn one, not a second copy that could drift
    // from the art: the disc and the hit area are both built on it.
    expect(scene.e2eRecoverButton()).toEqual({ button: { x: button.x, y: button.y } });
    expect(scene.e2eRecoverButton()).toEqual({ button: { x: 512, y: 560 } });
  });

  it("publishes nothing before the card is built", () => {
    const scene = new RecoverScene();

    expect(scene.e2eRecoverButton()).toBeNull();
  });
});
