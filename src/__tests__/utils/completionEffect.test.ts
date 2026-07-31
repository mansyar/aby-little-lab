import { afterEach, describe, expect, it, vi } from "vitest";
import { createWinCelebration } from "../../utils/completionEffect";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Stubs window.matchMedia so tests can simulate reduced-motion preferences.
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

interface MockGraphics {
  setPosition: ReturnType<typeof vi.fn>;
  lineStyle: ReturnType<typeof vi.fn>;
  beginPath: ReturnType<typeof vi.fn>;
  moveTo: ReturnType<typeof vi.fn>;
  lineTo: ReturnType<typeof vi.fn>;
  strokePath: ReturnType<typeof vi.fn>;
  fillStyle: ReturnType<typeof vi.fn>;
  fillCircle: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
}

interface MockScene {
  graphics: MockGraphics[];
  tweenConfigs: Array<Record<string, unknown>>;
  add: {
    graphics: ReturnType<typeof vi.fn>;
    particles: ReturnType<typeof vi.fn>;
  };
  tweens: { add: ReturnType<typeof vi.fn> };
}

/** Builds a minimal Phaser.Scene mock exposing only what the effect uses. */
function createMockScene(): MockScene {
  const graphics: MockGraphics[] = [];
  const tweenConfigs: Array<Record<string, unknown>> = [];
  const add = {
    graphics: vi.fn(() => {
      const obj: MockGraphics = {
        setPosition: vi.fn().mockReturnThis(),
        lineStyle: vi.fn().mockReturnThis(),
        beginPath: vi.fn().mockReturnThis(),
        moveTo: vi.fn().mockReturnThis(),
        lineTo: vi.fn().mockReturnThis(),
        strokePath: vi.fn().mockReturnThis(),
        fillStyle: vi.fn().mockReturnThis(),
        fillCircle: vi.fn().mockReturnThis(),
        destroy: vi.fn(),
      };
      graphics.push(obj);
      return obj;
    }),
    particles: vi.fn(),
  };
  const tweens = {
    add: vi.fn((config: Record<string, unknown>) => {
      tweenConfigs.push(config);
    }),
  };
  return { graphics, tweenConfigs, add, tweens };
}

describe("createWinCelebration", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates a ray burst plus spinning confetti bits on a win", () => {
    stubMatchMedia(false);
    const scene = createMockScene();

    createWinCelebration(scene as unknown as Parameters<typeof createWinCelebration>[0], 400, 300);

    // 1 ray-burst graphics + 10 confetti bits
    expect(scene.graphics).toHaveLength(11);
    // The ray burst is drawn with lines from an inner to an outer radius
    expect(scene.graphics[0].lineStyle).toHaveBeenCalled();
    expect(scene.graphics[0].strokePath).toHaveBeenCalledTimes(10);
    // Confetti bits are solid little circles
    for (const bit of scene.graphics.slice(1)) {
      expect(bit.fillStyle).toHaveBeenCalled();
      expect(bit.fillCircle).toHaveBeenCalled();
    }
    // Confetti bits drift and spin
    const confettiTween = scene.tweenConfigs.find((config) => typeof config.angle === "number");
    expect(confettiTween).toBeDefined();
  });

  it("binds a self-cleaning tween to every celebration object", () => {
    stubMatchMedia(false);
    const scene = createMockScene();

    createWinCelebration(scene as unknown as Parameters<typeof createWinCelebration>[0], 400, 300);

    for (const obj of scene.graphics) {
      const tween = scene.tweenConfigs.find((config) => config.targets === obj);
      expect(tween).toBeDefined();
      const onComplete = tween?.onComplete as () => void;
      expect(obj.destroy).not.toHaveBeenCalled();
      onComplete();
      expect(obj.destroy).toHaveBeenCalledTimes(1);
    }
  });

  it("uses fewer rays, no confetti, and a shorter duration under reduced motion", () => {
    stubMatchMedia(true);
    const scene = createMockScene();

    createWinCelebration(scene as unknown as Parameters<typeof createWinCelebration>[0], 400, 300);

    // Only the ray burst is created; confetti is skipped entirely
    expect(scene.graphics).toHaveLength(1);
    expect(scene.graphics[0].strokePath).toHaveBeenCalledTimes(6);
    // Shorter, gentler ray burst
    const rayTween = scene.tweenConfigs[0];
    expect(rayTween.duration).toBe(300);
    expect(rayTween.scaleX).toBe(1);
  });

  it("never uses a particle emitter", () => {
    stubMatchMedia(false);
    const scene = createMockScene();

    createWinCelebration(scene as unknown as Parameters<typeof createWinCelebration>[0], 400, 300);

    expect(scene.add.particles).not.toHaveBeenCalled();
  });
});
