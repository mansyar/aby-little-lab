import type Phaser from "phaser";
import { createArtLoadingCue } from "../../components/ArtLoadingCue";
import { MASCOT_SCALE } from "../../components/Mascot";
import { type MockFn, type MockObject, MockScene, mockRegistry } from "../helpers/phaserMock";

/**
 * The motion module is mocked so the reduced-motion branch can be driven from a
 * test instead of depending on the host's `prefers-reduced-motion`.
 */
const motion = vi.hoisted(() => ({ isReducedMotion: vi.fn(() => false) }));
vi.mock("../../utils/motion", () => motion);

interface TweenConfig {
  targets: MockObject;
  alpha: { from: number; to: number };
  scale: number;
  duration: number;
  delay: number;
  yoyo: boolean;
  repeat: number;
  ease: string;
}

/** `MockScene` has no TextureManager, so the cue's texture lookup is supplied here. */
class CueScene extends MockScene {
  readonly available = new Set<string>(["mascot_idle"]);
  readonly textures = {
    exists: vi.fn((key: string) => this.available.has(key)),
  };
}

const asScene = (scene: CueScene): Phaser.Scene => scene as unknown as Phaser.Scene;

function createScene(): CueScene {
  return new CueScene();
}

function objectsOfKind(kind: string): MockObject[] {
  return mockRegistry.filter((object) => object.kind === kind);
}

function argsOf(object: MockObject): unknown[] {
  return object.args ?? [];
}

function createdTweens(scene: CueScene): TweenConfig[] {
  return scene.tweens.add.mock.calls.map((call) => call[0] as TweenConfig);
}

beforeEach(() => {
  vi.clearAllMocks();
  motion.isReducedMotion.mockReturnValue(false);
  mockRegistry.length = 0;
});

describe("createArtLoadingCue", () => {
  it("shows Hoot at the mascot scale above the scene, with three dots beneath him", () => {
    const scene = createScene();
    createArtLoadingCue(asScene(scene)).show();

    // Camera centre 384 plus 0.3 of the 768 px stage keeps the cue well below
    // the progress dots (y 60) and the instruction line (y 112).
    const imageCall = scene.add.image.mock.calls[0];
    expect(imageCall[0]).toBe(512);
    expect(imageCall[1]).toBeCloseTo(614.4, 1);
    expect(imageCall[2]).toBe("mascot_idle");
    const [mascot] = objectsOfKind("image");
    expect(mascot.setScale).toHaveBeenCalledWith(MASCOT_SCALE);
    expect(mascot.setDepth).toHaveBeenCalledWith(10);
    expect(mascot.setVisible).toHaveBeenCalledWith(true);

    const dots = objectsOfKind("circle");
    expect(scene.add.circle).toHaveBeenCalledTimes(3);
    expect(dots.map((dot) => argsOf(dot)[0])).toEqual([486, 512, 538]);
    for (const dot of dots) {
      expect(argsOf(dot)[2]).toBe(7);
      expect(dot.setStrokeStyle).toHaveBeenCalledWith(2, 0x2d3748);
      expect(dot.setDepth).toHaveBeenCalledWith(10);
      expect(dot.setVisible).toHaveBeenCalledWith(true);
    }
  });

  it("reads the camera centre at show time, not at construction time", () => {
    const scene = createScene();
    const cue = createArtLoadingCue(asScene(scene));

    scene.cameras.main.centerX = 400;
    scene.cameras.main.centerY = 300;
    scene.cameras.main.height = 600;
    cue.show();

    expect(scene.add.image.mock.calls[0][0]).toBe(400);
    expect(scene.add.image.mock.calls[0][1]).toBeCloseTo(480, 1);
    expect(objectsOfKind("circle").map((dot) => argsOf(dot)[0])).toEqual([374, 400, 426]);
  });

  it("stays textless and never captures pointer input", () => {
    const scene = createScene();
    createArtLoadingCue(asScene(scene)).show();

    expect(scene.add.text).not.toHaveBeenCalled();
    expect(scene.add.zone).not.toHaveBeenCalled();
    for (const object of mockRegistry) {
      expect(object.setInteractive).not.toHaveBeenCalled();
    }
  });

  it("pulses the three dots in sequence with a gentle sine", () => {
    const scene = createScene();
    createArtLoadingCue(asScene(scene)).show();

    const tweens = createdTweens(scene);
    expect(tweens).toHaveLength(3);
    expect(tweens.map((tween) => tween.delay)).toEqual([0, 140, 280]);

    const dots = objectsOfKind("circle");
    for (const tween of tweens) {
      expect(dots).toContain(tween.targets);
      expect(tween.alpha).toEqual({ from: 0.35, to: 1 });
      expect(tween.scale).toBe(1.15);
      expect(tween.duration).toBe(420);
      expect(tween.yoyo).toBe(true);
      expect(tween.repeat).toBe(-1);
      expect(tween.ease).toBe("Sine.inOut");
    }
  });

  it("is idempotent: showing twice builds one mascot, three dots and three tweens", () => {
    const scene = createScene();
    const cue = createArtLoadingCue(asScene(scene));

    cue.show();
    cue.show();

    expect(scene.add.image).toHaveBeenCalledTimes(1);
    expect(scene.add.circle).toHaveBeenCalledTimes(3);
    expect(scene.tweens.add).toHaveBeenCalledTimes(3);
  });

  it("reduced motion keeps the dots visible with a single static alpha and no tween", () => {
    motion.isReducedMotion.mockReturnValue(true);
    const scene = createScene();
    createArtLoadingCue(asScene(scene)).show();

    expect(scene.tweens.add).not.toHaveBeenCalled();
    for (const dot of objectsOfKind("circle")) {
      expect(dot.setAlpha).toHaveBeenCalledWith(0.55);
      expect(dot.setScale).not.toHaveBeenCalledWith(1.15);
    }
  });

  it("clear hides everything and removes only the cue's own tweens", () => {
    const scene = createScene();
    const cue = createArtLoadingCue(asScene(scene));
    cue.show();

    const tweens = scene.tweens.add.mock.results.map(
      (result) => result.value as { remove: MockFn },
    );
    cue.clear();

    for (const tween of tweens) {
      expect(tween.remove).toHaveBeenCalledTimes(1);
    }
    expect(objectsOfKind("image")[0].setVisible).toHaveBeenLastCalledWith(false);
    for (const dot of objectsOfKind("circle")) {
      expect(dot.setVisible).toHaveBeenLastCalledWith(false);
    }
    // No global tween operation: the count is unchanged, so nothing else was hit.
    expect(scene.tweens.add).toHaveBeenCalledTimes(3);
  });

  it("can be shown again after clear, starting a fresh pulse", () => {
    const scene = createScene();
    const cue = createArtLoadingCue(asScene(scene));

    cue.show();
    cue.clear();
    cue.show();

    expect(scene.tweens.add).toHaveBeenCalledTimes(6);
    expect(scene.add.image).toHaveBeenCalledTimes(1);
  });

  it("clear is safe before the first show and when repeated", () => {
    const scene = createScene();
    const cue = createArtLoadingCue(asScene(scene));

    expect(() => cue.clear()).not.toThrow();
    cue.show();
    cue.clear();
    expect(() => cue.clear()).not.toThrow();
    expect(scene.add.circle).toHaveBeenCalledTimes(3);
  });

  it("destroy clears, removes the objects and unhooks the scene listener", () => {
    const scene = createScene();
    const cue = createArtLoadingCue(asScene(scene));
    cue.show();

    const [mascot] = objectsOfKind("image");
    const dots = objectsOfKind("circle");
    cue.destroy();

    expect(mascot.destroy).toHaveBeenCalledTimes(1);
    for (const dot of dots) {
      expect(dot.destroy).toHaveBeenCalledTimes(1);
    }
    expect(scene.events.off).toHaveBeenCalledWith("shutdown", expect.any(Function));
    expect(() => cue.destroy()).not.toThrow();
    expect(() => cue.clear()).not.toThrow();
    expect(mascot.destroy).toHaveBeenCalledTimes(1);
  });

  it("does not build anything when shown after destroy", () => {
    const scene = createScene();
    const cue = createArtLoadingCue(asScene(scene));
    cue.destroy();

    cue.show();

    expect(scene.add.image).not.toHaveBeenCalled();
    expect(scene.add.circle).not.toHaveBeenCalled();
  });

  it("self-destroys on scene shutdown, leaving no tweens or objects behind", () => {
    const scene = createScene();
    createArtLoadingCue(asScene(scene)).show();

    const tweens = scene.tweens.add.mock.results.map(
      (result) => result.value as { remove: MockFn },
    );
    const [mascot] = objectsOfKind("image");
    scene.events.emit("shutdown");

    for (const tween of tweens) {
      expect(tween.remove).toHaveBeenCalledTimes(1);
    }
    expect(mascot.destroy).toHaveBeenCalledTimes(1);
    for (const dot of objectsOfKind("circle")) {
      expect(dot.destroy).toHaveBeenCalledTimes(1);
    }
    expect(scene.events.off).toHaveBeenCalledWith("shutdown", expect.any(Function));

    // A second shutdown emit is a no-op rather than a second destroy.
    expect(() => scene.events.emit("shutdown")).not.toThrow();
    expect(mascot.destroy).toHaveBeenCalledTimes(1);
  });

  it("falls back to three dots when the mascot texture is not raster yet", () => {
    const scene = createScene();
    scene.available.clear();
    const cue = createArtLoadingCue(asScene(scene));

    expect(() => cue.show()).not.toThrow();
    expect(scene.add.image).not.toHaveBeenCalled();
    const dots = objectsOfKind("circle");
    expect(dots).toHaveLength(3);
    // Without a mascot the dots sit on the cue anchor itself.
    for (const dot of dots) {
      expect(argsOf(dot)[1]).toBeCloseTo(614.4, 1);
    }
    expect(scene.tweens.add).toHaveBeenCalledTimes(3);

    // The dots-only cue is still fully clearable.
    expect(() => cue.clear()).not.toThrow();
    expect(() => cue.destroy()).not.toThrow();
    for (const dot of dots) {
      expect(dot.destroy).toHaveBeenCalledTimes(1);
    }
  });

  it("falls back to dots when the scene has no TextureManager at all", () => {
    const scene = createScene();
    const withoutTextures = scene as unknown as { textures?: unknown };
    withoutTextures.textures = undefined;
    const cue = createArtLoadingCue(asScene(scene));

    expect(() => cue.show()).not.toThrow();
    expect(scene.add.image).not.toHaveBeenCalled();
    expect(scene.add.circle).toHaveBeenCalledTimes(3);
  });
});
