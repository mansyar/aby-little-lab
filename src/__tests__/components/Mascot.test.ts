import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createCornerMascot, Mascot } from "../../components/Mascot";

type MockFn = ReturnType<typeof vi.fn>;

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Stubs window.matchMedia so tests can simulate reduced-motion preferences
 * (same helper as the motion utility tests).
 */
function stubMatchMedia(matches: boolean): void {
  const matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query === REDUCED_MOTION_QUERY ? matches : false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  vi.stubGlobal("matchMedia", matchMedia);
}

interface MockTween {
  remove: MockFn;
  pause: MockFn;
  resume: MockFn;
}

interface MockImage {
  x: number;
  y: number;
  setScale: MockFn;
  setDepth: MockFn;
  setVisible: MockFn;
  setTexture: MockFn;
  destroy: MockFn;
}

interface MockGraphics {
  setDepth: MockFn;
  fillStyle: MockFn;
  fillCircle: MockFn;
  destroy: MockFn;
}

interface MockScene {
  add: {
    image: MockFn;
    graphics: MockFn;
  };
  tweens: {
    add: MockFn;
  };
  scale: {
    width: number;
    height: number;
  };
}

interface SceneHarness {
  scene: MockScene;
  image: MockImage;
  graphics: MockGraphics;
  tween: MockTween;
}

/** Creates a mock Phaser.Scene with image, graphics, and tweens APIs. */
function createMockScene(): SceneHarness {
  const image: MockImage = {
    x: 100,
    y: 100,
    setScale: vi.fn(),
    setDepth: vi.fn(),
    setVisible: vi.fn(),
    setTexture: vi.fn(),
    destroy: vi.fn(),
  };
  const graphics: MockGraphics = {
    setDepth: vi.fn(),
    fillStyle: vi.fn(),
    fillCircle: vi.fn(),
    destroy: vi.fn(),
  };
  const tween: MockTween = { remove: vi.fn(), pause: vi.fn(), resume: vi.fn() };
  const scene: MockScene = {
    add: {
      image: vi.fn((x: number, y: number) => {
        image.x = x;
        image.y = y;
        return image;
      }),
      graphics: vi.fn(() => graphics),
    },
    tweens: {
      add: vi.fn(() => tween),
    },
    scale: {
      width: 1024,
      height: 768,
    },
  };
  return { scene, image, graphics, tween };
}

/** Returns the array of tween config objects passed to tweens.add. */
function getTweenConfigs(scene: MockScene): Array<Record<string, unknown>> {
  return scene.tweens.add.mock.calls.map((call) => call[0] as Record<string, unknown>);
}

function createMascot(scene: MockScene, x = 100, y = 100, scale = 0.25): Mascot {
  return new Mascot(scene as never, x, y, scale);
}

describe("Mascot", () => {
  let harness: SceneHarness;

  beforeEach(() => {
    stubMatchMedia(false);
    harness = createMockScene();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  describe("constructor", () => {
    it("creates the idle image at the given position and key", () => {
      createMascot(harness.scene, 60, 120, 0.2);
      expect(harness.scene.add.image).toHaveBeenCalledWith(60, 120, "mascot_idle");
    });

    it("applies the given scale", () => {
      createMascot(harness.scene, 100, 100, 0.2);
      expect(harness.image.setScale).toHaveBeenCalledWith(0.2);
    });

    it("sits behind gameplay z-order", () => {
      createMascot(harness.scene);
      expect(harness.image.setDepth).toHaveBeenCalled();
    });

    it("does not make the mascot interactive (touch-inert)", () => {
      createMascot(harness.scene);
      expect(harness.image.setInteractive).toBeUndefined();
    });
  });

  describe("wave()", () => {
    it("sways the mascot with a rotation yoyo tween", () => {
      const mascot = createMascot(harness.scene);
      mascot.wave();

      const tween = getTweenConfigs(harness.scene)[0];
      expect(tween.targets).toBe(harness.image);
      expect(tween.angle).toEqual({ from: 0, to: 8 });
      expect(tween.yoyo).toBe(true);
      expect(tween.repeat).toBe(1);
    });

    it("lasts about 400ms (200ms out and back)", () => {
      const mascot = createMascot(harness.scene);
      mascot.wave();
      expect(getTweenConfigs(harness.scene)[0].duration).toBe(200);
    });

    it("uses a gentler sway under reduced motion", () => {
      stubMatchMedia(true);
      const mascot = createMascot(harness.scene);
      mascot.wave();

      const tween = getTweenConfigs(harness.scene)[0];
      expect(tween.angle).toEqual({ from: 0, to: 4 });
      expect(tween.duration).toBe(120);
    });
  });

  describe("nod()", () => {
    it("gently rotates the mascot with a yoyo tween", () => {
      const mascot = createMascot(harness.scene);
      mascot.nod();

      const tween = getTweenConfigs(harness.scene)[0];
      expect(tween.targets).toBe(harness.image);
      expect(tween.angle).toEqual({ from: 0, to: 6 });
      expect(tween.yoyo).toBe(true);
      expect(tween.repeat).toBe(1);
    });

    it("lasts about 300ms (150ms out and back)", () => {
      const mascot = createMascot(harness.scene);
      mascot.nod();
      expect(getTweenConfigs(harness.scene)[0].duration).toBe(150);
    });

    it("uses a gentler nod under reduced motion", () => {
      stubMatchMedia(true);
      const mascot = createMascot(harness.scene);
      mascot.nod();

      const tween = getTweenConfigs(harness.scene)[0];
      expect(tween.angle).toEqual({ from: 0, to: 3 });
      expect(tween.duration).toBe(90);
    });
  });

  describe("cheer()", () => {
    it("switches to the celebrate pose", () => {
      const mascot = createMascot(harness.scene);
      mascot.cheer();
      expect(harness.image.setTexture).toHaveBeenCalledWith("mascot_celebrate");
    });

    it("bounces with a scale 1.1 yoyo tween", () => {
      const mascot = createMascot(harness.scene, 100, 100, 0.25);
      mascot.cheer();

      const bounce = getTweenConfigs(harness.scene)[0];
      expect(bounce.targets).toBe(harness.image);
      expect(bounce.scale).toBe(0.25 * 1.1);
      expect(bounce.yoyo).toBe(true);
      expect(bounce.repeat).toBe(1);
    });

    it("returns to the idle pose when the bounce settles", () => {
      const mascot = createMascot(harness.scene);
      mascot.cheer();

      const bounce = getTweenConfigs(harness.scene)[0];
      const onComplete = bounce.onComplete as () => void;
      onComplete();
      expect(harness.image.setTexture).toHaveBeenLastCalledWith("mascot_idle");
    });

    it("emits a self-cleaning sparkle ring at the mascot", () => {
      const mascot = createMascot(harness.scene, 100, 100, 0.25);
      mascot.cheer();

      expect(harness.scene.add.graphics).toHaveBeenCalledTimes(1);
      expect(harness.graphics.fillCircle).toHaveBeenCalledWith(100, 100, expect.any(Number));

      const sparkleTween = getTweenConfigs(harness.scene)[1];
      expect(sparkleTween.targets).toBe(harness.graphics);
      expect(sparkleTween.scale).toBeGreaterThan(1);
      expect(sparkleTween.alpha).toBe(0);

      const onComplete = sparkleTween.onComplete as () => void;
      onComplete();
      expect(harness.graphics.destroy).toHaveBeenCalledTimes(1);
    });

    it("does not bounce or sparkle under reduced motion, only swaps poses", () => {
      stubMatchMedia(true);
      const mascot = createMascot(harness.scene, 100, 100, 0.25);
      mascot.cheer();

      const bounce = getTweenConfigs(harness.scene)[0];
      expect(bounce.scale).toBe(0.25);
      expect(bounce.yoyo).toBe(true);
      expect(harness.scene.add.graphics).not.toHaveBeenCalled();
    });

    it("cheers bigger for round wins (scale 1.2, longer bounce)", () => {
      const mascot = createMascot(harness.scene, 100, 100, 0.25);
      mascot.cheer(true);

      const bounce = getTweenConfigs(harness.scene)[0];
      expect(bounce.targets).toBe(harness.image);
      expect(bounce.scale).toBe(0.25 * 1.2);
      expect(bounce.duration).toBe(260);
      expect(bounce.yoyo).toBe(true);
    });

    it("uses minimal motion for big cheers under reduced motion", () => {
      stubMatchMedia(true);
      const mascot = createMascot(harness.scene, 100, 100, 0.25);
      mascot.cheer(true);

      const bounce = getTweenConfigs(harness.scene)[0];
      expect(bounce.scale).toBe(0.25);
      expect(bounce.duration).toBe(160);
      expect(harness.scene.add.graphics).not.toHaveBeenCalled();
    });

    it("replaces an in-flight cheer tween when cheered again", () => {
      const mascot = createMascot(harness.scene);
      mascot.cheer();
      expect(harness.tween.remove).not.toHaveBeenCalled();

      mascot.cheer();
      expect(harness.tween.remove).toHaveBeenCalledTimes(1);
    });

    it("pauses the blink loop during a cheer and resumes it after", () => {
      const mascot = createMascot(harness.scene, 100, 100, 0.25);
      mascot.idleLoop();
      expect(harness.tween.pause).not.toHaveBeenCalled();

      mascot.cheer();
      expect(harness.tween.pause).toHaveBeenCalled();

      const bounce = getTweenConfigs(harness.scene)[2];
      const onComplete = bounce.onComplete as () => void;
      onComplete();
      expect(harness.tween.resume).toHaveBeenCalled();
    });
  });

  describe("idleLoop()", () => {
    it("starts a slow bob tween (2.5s loop)", () => {
      const mascot = createMascot(harness.scene, 100, 100, 0.25);
      mascot.idleLoop();

      const bob = getTweenConfigs(harness.scene)[0];
      expect(bob.targets).toBe(harness.image);
      expect(bob.y).toBe(97); // 100 - 3px
      expect(bob.duration).toBe(2500);
      expect(bob.yoyo).toBe(true);
      expect(bob.repeat).toBe(-1);
    });

    it("squash-blinks periodically (scaleY dip every ~4s)", () => {
      const mascot = createMascot(harness.scene, 100, 100, 0.25);
      mascot.idleLoop();

      const blink = getTweenConfigs(harness.scene)[1];
      expect(blink.targets).toBe(harness.image);
      expect(blink.scaleY).toBe(0.25 * 0.92);
      expect(blink.yoyo).toBe(true);
      expect(blink.repeat).toBe(-1);
      expect(blink.repeatDelay as number).toBeGreaterThanOrEqual(3000);
    });

    it("does nothing under reduced motion", () => {
      stubMatchMedia(true);
      const mascot = createMascot(harness.scene);
      mascot.idleLoop();
      expect(harness.scene.tweens.add).not.toHaveBeenCalled();
    });
  });

  describe("createCornerMascot()", () => {
    it("places the mascot in the bottom-right corner at the default scale", () => {
      createCornerMascot(harness.scene as never);
      expect(harness.scene.add.image).toHaveBeenCalledWith(934, 678, "mascot_idle");
      expect(harness.image.setScale).toHaveBeenCalledWith(0.2);
    });

    it("hot-swaps to a loaded Ligne mascot and delegates reactions", async () => {
      const ligne = {
        wave: vi.fn(),
        nod: vi.fn(),
        cheer: vi.fn(),
        curious: vi.fn(),
        flapGreeting: vi.fn(),
        idleLoop: vi.fn(),
        destroy: vi.fn(),
      };
      const load = vi.fn(async () => ligne as never);
      const mascot = createCornerMascot(harness.scene as never, load);
      await vi.waitFor(() => expect(harness.image.setVisible).toHaveBeenCalledWith(false));

      mascot.wave();
      mascot.nod();
      mascot.cheer(true);
      mascot.idleLoop();

      expect(load).toHaveBeenCalledWith({ x: 934, y: 678, scale: 0.2, depth: -1 });
      expect(ligne.wave).toHaveBeenCalledOnce();
      expect(ligne.nod).toHaveBeenCalledOnce();
      expect(ligne.cheer).toHaveBeenCalledWith(true);
      expect(ligne.idleLoop).toHaveBeenCalledOnce();
    });

    it("replays a queued Ligne greeting after the lazy load completes", async () => {
      const ligne = {
        wave: vi.fn(),
        nod: vi.fn(),
        cheer: vi.fn(),
        curious: vi.fn(),
        flapGreeting: vi.fn(),
        idleLoop: vi.fn(),
        destroy: vi.fn(),
      };
      let resolveLoad: ((mascot: never) => void) | undefined;
      const load = vi.fn(
        () =>
          new Promise<never>((resolve) => {
            resolveLoad = resolve;
          }),
      );
      const mascot = createCornerMascot(harness.scene as never, load);

      mascot.flapGreeting();
      resolveLoad?.(ligne as never);
      await vi.waitFor(() => expect(ligne.flapGreeting).toHaveBeenCalledOnce());
    });

    it("allows the Ligne WASM runtime more than three seconds to initialize", async () => {
      vi.useFakeTimers();
      const ligne = {
        wave: vi.fn(),
        nod: vi.fn(),
        cheer: vi.fn(),
        curious: vi.fn(),
        flapGreeting: vi.fn(),
        idleLoop: vi.fn(),
        destroy: vi.fn(),
      };
      const load = vi.fn(
        () =>
          new Promise<never>((resolve) => {
            setTimeout(() => resolve(ligne as never), 4_000);
          }),
      );

      createCornerMascot(harness.scene as never, load);
      await vi.advanceTimersByTimeAsync(4_000);

      expect(harness.image.setVisible).toHaveBeenCalledWith(false);
      expect(ligne.destroy).not.toHaveBeenCalled();
    });
  });

  describe("destroy()", () => {
    it("removes all running tweens", () => {
      const mascot = createMascot(harness.scene);
      mascot.wave();
      mascot.cheer();
      mascot.idleLoop();

      mascot.destroy();
      expect(harness.tween.remove.mock.calls.length).toBeGreaterThanOrEqual(4);
    });

    it("destroys the image", () => {
      const mascot = createMascot(harness.scene);
      mascot.destroy();
      expect(harness.image.destroy).toHaveBeenCalledTimes(1);
    });

    it("destroys an active sparkle ring", () => {
      const mascot = createMascot(harness.scene);
      mascot.cheer();
      mascot.destroy();
      expect(harness.graphics.destroy).toHaveBeenCalledTimes(1);
    });

    it("does not error when called twice", () => {
      const mascot = createMascot(harness.scene);
      mascot.destroy();
      expect(() => mascot.destroy()).not.toThrow();
    });
  });
});
