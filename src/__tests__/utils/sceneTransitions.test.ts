import { afterEach, describe, expect, it, vi } from "vitest";
import { sceneEntrance, transitionToScene } from "../../utils/sceneTransitions";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const BG_BASE_RGB = { r: 250, g: 249, b: 246 }; // 0xfaf9f6

/** Stubs window.matchMedia so tests can simulate reduced-motion preferences. */
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

/** Creates a minimal scene mock exposing only the camera + scene.start APIs. */
function createMockScene(): {
  cameras: { main: Record<string, ReturnType<typeof vi.fn>> };
  scene: { start: ReturnType<typeof vi.fn> };
  events: {
    on: ReturnType<typeof vi.fn>;
    once: ReturnType<typeof vi.fn>;
    emit: ReturnType<typeof vi.fn>;
  };
} {
  const handlers: Record<string, Array<{ fn: () => void; once: boolean }>> = {};
  const events = {
    on: vi.fn((event: string, fn: () => void) => {
      if (!handlers[event]) handlers[event] = [];
      handlers[event].push({ fn, once: false });
    }),
    once: vi.fn((event: string, fn: () => void) => {
      if (!handlers[event]) handlers[event] = [];
      handlers[event].push({ fn, once: true });
    }),
    emit: vi.fn((event: string) => {
      const list = handlers[event];
      if (!list) return;
      for (let i = list.length - 1; i >= 0; i--) {
        const entry = list[i];
        entry.fn();
        if (entry.once) list.splice(i, 1);
      }
    }),
  };
  return {
    cameras: {
      main: {
        fadeOut: vi.fn(),
        fadeIn: vi.fn(),
        setZoom: vi.fn(),
        zoomTo: vi.fn(),
      },
    },
    scene: {
      start: vi.fn(),
    },
    events,
  };
}

/** Invokes the callback passed to camera.fadeOut (the 5th argument). */
function invokeFadeOutCallback(scene: ReturnType<typeof createMockScene>): void {
  const fadeOut = scene.cameras.main.fadeOut;
  const callback = fadeOut.mock.calls[0]?.[4] as (() => void) | undefined;
  expect(callback).toBeDefined();
  callback?.();
}

describe("scene transitions", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("transitionToScene", () => {
    it("fades the camera out over 300ms using the app background color", () => {
      stubMatchMedia(false);
      const scene = createMockScene();

      transitionToScene(scene as never, "Hub");

      expect(scene.cameras.main.fadeOut).toHaveBeenCalledWith(
        300,
        BG_BASE_RGB.r,
        BG_BASE_RGB.g,
        BG_BASE_RGB.b,
        expect.any(Function),
      );
    });

    it("uses the reduced fade duration when reduced motion is preferred", () => {
      stubMatchMedia(true);
      const scene = createMockScene();

      transitionToScene(scene as never, "Hub");

      expect(scene.cameras.main.fadeOut).toHaveBeenCalledWith(
        180,
        BG_BASE_RGB.r,
        BG_BASE_RGB.g,
        BG_BASE_RGB.b,
        expect.any(Function),
      );
    });

    it("starts the target scene only after the fade-out completes", () => {
      stubMatchMedia(false);
      const scene = createMockScene();

      transitionToScene(scene as never, "PopFreeze");
      expect(scene.scene.start).not.toHaveBeenCalled();

      invokeFadeOutCallback(scene);
      expect(scene.scene.start).toHaveBeenCalledWith("PopFreeze");
    });

    it("forwards scene data to the target scene", () => {
      stubMatchMedia(false);
      const scene = createMockScene();

      transitionToScene(scene as never, "Hub", { justEarned: "pop-freeze" });
      invokeFadeOutCallback(scene);

      expect(scene.scene.start).toHaveBeenCalledWith("Hub", { justEarned: "pop-freeze" });
    });

    it("ignores a second transition while a scene is already navigating", () => {
      stubMatchMedia(false);
      const scene = createMockScene();

      // Race: the 3s auto-return fires, then a stale ParentLock Back hold
      // completes — the second call must be a no-op.
      transitionToScene(scene as never, "Hub", { justEarned: "shape-sorter" });
      transitionToScene(scene as never, "Hub");

      expect(scene.cameras.main.fadeOut).toHaveBeenCalledTimes(1);
      invokeFadeOutCallback(scene);
      expect(scene.scene.start).toHaveBeenCalledTimes(1);
      expect(scene.scene.start).toHaveBeenCalledWith("Hub", { justEarned: "shape-sorter" });
    });

    it("allows a new transition after the scene shuts down", () => {
      stubMatchMedia(false);
      const scene = createMockScene();

      transitionToScene(scene as never, "Hub");
      // Phaser fires shutdown when the scene is replaced.
      scene.events.emit("shutdown");
      transitionToScene(scene as never, "Alphabet");

      expect(scene.cameras.main.fadeOut).toHaveBeenCalledTimes(2);
    });
  });

  describe("sceneEntrance", () => {
    it("fades the camera in over 300ms and applies a subtle zoom", () => {
      stubMatchMedia(false);
      const scene = createMockScene();

      sceneEntrance(scene as never);

      expect(scene.cameras.main.fadeIn).toHaveBeenCalledWith(
        300,
        BG_BASE_RGB.r,
        BG_BASE_RGB.g,
        BG_BASE_RGB.b,
      );
      expect(scene.cameras.main.setZoom).toHaveBeenCalledWith(1.02);
      // The camera Zoom effect resolves ease strings against its own EaseMap
      // ("Sine" → Sine.Out). A dotted string like "Sine.out" is not a key there
      // and would leave the effect's ease undefined, crashing on the first frame.
      expect(scene.cameras.main.zoomTo).toHaveBeenCalledWith(1, 300, "Sine");
    });

    it("fades in without zoom when reduced motion is preferred", () => {
      stubMatchMedia(true);
      const scene = createMockScene();

      sceneEntrance(scene as never);

      expect(scene.cameras.main.fadeIn).toHaveBeenCalledWith(
        180,
        BG_BASE_RGB.r,
        BG_BASE_RGB.g,
        BG_BASE_RGB.b,
      );
      expect(scene.cameras.main.setZoom).not.toHaveBeenCalled();
      expect(scene.cameras.main.zoomTo).not.toHaveBeenCalled();
    });
  });
});
