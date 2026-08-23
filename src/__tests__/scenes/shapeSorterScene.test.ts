import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ShapeType } from "../../game/shapeSorterLogic";
import { ShapeSorterScene } from "../../scenes/ShapeSorterScene";
import { hasSticker } from "../../utils/storage";

type MockFn = ReturnType<typeof vi.fn>;
type MockGameObject = Record<string, MockFn>;

/** Mirrors the scene's NEXT_ROUND_DELAY so tests can fire round advancement. */
const NEXT_ROUND_DELAY = 1200;

/** Mirrors the scene's AUTO_RETURN_DELAY for the final Hub transition. */
const AUTO_RETURN_DELAY = 3000;

/** Mirrors the scene's unfilled progress dot alpha. */
const PROGRESS_DOT_ALPHA = 0.3;

/** Mirrors the scene's progress dot pop scale. */
const DOT_POP_SCALE = 1.4;

/**
 * Mock Phaser module (same pattern as wordMatchScene.test.ts). Scene files
 * extend Phaser.Scene, which at runtime resolves to MockScene; every instance
 * gets fresh mock methods, enabling per-test isolation.
 */
vi.mock("phaser", () => {
  /** Creates a mock game object with chainable methods used by Phaser scenes. */
  function createMockGameObject(scene?: unknown): Record<string, MockFn> {
    return {
      setInteractive: vi.fn().mockReturnThis(),
      disableInteractive: vi.fn(),
      on: vi.fn().mockReturnThis(),
      off: vi.fn().mockReturnThis(),
      setOrigin: vi.fn().mockReturnThis(),
      setScale: vi.fn().mockReturnThis(),
      setTint: vi.fn().mockReturnThis(),
      setAngle: vi.fn().mockReturnThis(),
      setTexture: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
      setStyle: vi.fn().mockReturnThis(),
      setFontSize: vi.fn().mockReturnThis(),
      setText: vi.fn().mockReturnThis(),
      setColor: vi.fn().mockReturnThis(),
      setVisible: vi.fn().mockReturnThis(),
      setAlpha: vi.fn().mockReturnThis(),
      setPosition: vi.fn().mockReturnThis(),
      setSize: vi.fn().mockReturnThis(),
      setDisplaySize: vi.fn().mockReturnThis(),
      setStrokeStyle: vi.fn().mockReturnThis(),
      setVelocity: vi.fn().mockReturnThis(),
      setCollideWorldBounds: vi.fn().mockReturnThis(),
      setBounce: vi.fn().mockReturnThis(),
      setCircle: vi.fn().mockReturnThis(),
      fillStyle: vi.fn().mockReturnThis(),
      fillCircle: vi.fn().mockReturnThis(),
      slice: vi.fn().mockReturnThis(),
      fillPath: vi.fn().mockReturnThis(),
      clear: vi.fn().mockReturnThis(),
      getCenter: vi.fn(() => ({ x: 0, y: 0 })),
      beginPath: vi.fn().mockReturnThis(),
      moveTo: vi.fn().mockReturnThis(),
      lineTo: vi.fn().mockReturnThis(),
      strokePath: vi.fn().mockReturnThis(),
      lineStyle: vi.fn().mockReturnThis(),
      strokeRect: vi.fn().mockReturnThis(),
      strokeCircle: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
      scaleX: 1,
      scaleY: 1,
      scene,
    };
  }

  class MockScene {
    add!: Record<string, MockFn>;
    scene!: Record<string, MockFn>;
    load!: Record<string, MockFn>;
    input!: Record<string, MockFn>;
    cameras!: {
      main: Record<string, MockFn> & {
        centerX: number;
        centerY: number;
        width: number;
        height: number;
      };
    };
    scale!: Record<string, MockFn> & { width: number; height: number };
    time!: Record<string, MockFn>;
    tweens!: Record<string, MockFn>;
    sys!: { events: Record<string, MockFn> };
    events!: Record<string, MockFn>;
    children!: Record<string, MockFn>;
    physics!: { add: Record<string, MockFn>; world: Record<string, MockFn> };

    constructor() {
      this.add = {
        rectangle: vi.fn(() => createMockGameObject(this)),
        text: vi.fn(() => createMockGameObject(this)),
        image: vi.fn(() => createMockGameObject(this)),
        container: vi.fn(() => createMockGameObject(this)),
        circle: vi.fn(() => createMockGameObject(this)),
        graphics: vi.fn(() => createMockGameObject(this)),
        zone: vi.fn(() => createMockGameObject(this)),
        particles: vi.fn(() => createMockGameObject(this)),
      };
      this.scene = {
        start: vi.fn(),
        stop: vi.fn(),
        launch: vi.fn(),
        get: vi.fn(),
        switch: vi.fn(),
        sleep: vi.fn(),
        wake: vi.fn(),
        pause: vi.fn(),
        resume: vi.fn(),
      };
      this.load = {
        svg: vi.fn(),
        image: vi.fn(),
        audio: vi.fn(),
        on: vi.fn(),
        once: vi.fn(),
        off: vi.fn(),
      };
      this.input = {
        on: vi.fn(),
        off: vi.fn(),
        setDraggable: vi.fn(),
      };
      this.cameras = {
        main: {
          setBackgroundColor: vi.fn(),
          fadeIn: vi.fn(),
          fadeOut: vi.fn(),
          setZoom: vi.fn(),
          zoomTo: vi.fn(),
          centerX: 512,
          centerY: 384,
          width: 1024,
          height: 768,
        },
      };
      this.scale = {
        setSize: vi.fn(),
        on: vi.fn(),
        width: 1024,
        height: 768,
      };
      this.time = {
        delayedCall: vi.fn(() => ({ remove: vi.fn() })),
        addEvent: vi.fn(),
      };
      this.tweens = {
        add: vi.fn(() => ({ remove: vi.fn(), stop: vi.fn() })),
      };
      this.sys = {
        events: {
          on: vi.fn(),
          once: vi.fn(),
          off: vi.fn(),
        },
      };
      this.events = this.sys.events;
      this.children = {
        forEach: vi.fn(),
      };
      this.physics = {
        add: {
          image: vi.fn(() => createMockGameObject()),
        },
        world: {
          setBoundsCollision: vi.fn(),
          setBounds: vi.fn(),
        },
      };
    }
  }

  class MockRectangle {
    static Contains = vi.fn(() => true);
    readonly x = 0;
    readonly y = 0;
  }

  const phaserMock = {
    Scene: MockScene,
    Game: vi.fn(),
    Scale: { FIT: 0, CENTER_BOTH: 0 },
    AUTO: "AUTO",
    Curves: { Path: class {} },
    Geom: { Rectangle: MockRectangle },
  };
  return { ...phaserMock, default: phaserMock };
});

const { mockAudio } = vi.hoisted(() => ({
  mockAudio: {
    init: vi.fn(),
    resume: vi.fn(),
    playBGM: vi.fn(),
    playCorrect: vi.fn(),
    playIncorrect: vi.fn(),
    playWin: vi.fn(),
    playSticker: vi.fn(),
    playPop: vi.fn(),
    playWake: vi.fn(),
    playFrogNote: vi.fn(),
    playIdleCall: vi.fn(),
  },
}));

vi.mock("../../audio/AudioManager", () => ({
  AudioManager: { getInstance: () => mockAudio },
}));

const { mockMascot } = vi.hoisted(() => ({
  mockMascot: { cheer: vi.fn(), curious: vi.fn(), nod: vi.fn(), destroy: vi.fn() },
}));

vi.mock("../../components/Mascot", () => ({
  createCornerMascot: () => mockMascot,
}));

const { mockParentLockInstances } = vi.hoisted(() => ({
  mockParentLockInstances: [] as unknown[],
}));

vi.mock("../../components/ParentLock", () => ({
  ParentLock: class {
    constructor(opts: unknown) {
      mockParentLockInstances.push(opts);
    }
    destroy(): void {}
  },
}));

/** Internals of the scene accessed via cast (same pattern as wordMatch tests). */
interface SceneInternals {
  playthrough: ShapeType[][];
  roundIndex: number;
  shapes: Array<{ obj: MockGameObject; type: ShapeType }>;
  slots: Array<{ zone: MockGameObject; type: ShapeType }>;
  progressDots: MockGameObject[];
}

function getInternals(scene: ShapeSorterScene): SceneInternals {
  return scene as unknown as SceneInternals;
}

function getMockFn(fn: unknown): MockFn {
  return fn as MockFn;
}

/** Simulates dropping one shape on the given zone via its registered handler. */
function dropShapeOn(shape: MockGameObject, zone: MockGameObject): void {
  const dropCall = getMockFn(shape.on).mock.calls.find((call) => call[0] === "drop");
  if (!dropCall) throw new Error("drop handler not registered");
  const dropCallback = dropCall[1] as (pointer: unknown, target: unknown) => void;
  dropCallback(null, zone);
}

/** Places all shapes of the current round onto their matching slots. */
function placeAllShapes(scene: ShapeSorterScene): void {
  const internals = getInternals(scene);
  for (const shape of internals.shapes) {
    const slot = internals.slots.find((s) => s.type === shape.type);
    if (!slot) throw new Error("No matching slot found");
    dropShapeOn(shape.obj, slot.zone);
  }
}

/** Fires the newest round-advance delayed call (NEXT_ROUND_DELAY). */
function advanceRound(scene: ShapeSorterScene): void {
  const advanceCalls = getMockFn(scene.time.delayedCall).mock.calls.filter(
    (call) => call[0] === NEXT_ROUND_DELAY,
  );
  const advanceCall = advanceCalls[advanceCalls.length - 1];
  if (!advanceCall) throw new Error("round advance not scheduled");
  const advanceCallback = advanceCall[1] as () => void;
  advanceCallback();
}

/** Completes all three rounds: place shapes, then advance between rounds. */
function completeSession(scene: ShapeSorterScene): void {
  for (let round = 0; round < 3; round++) {
    placeAllShapes(scene);
    if (round < 2) advanceRound(scene);
  }
}

function createScene(): ShapeSorterScene {
  const scene = new ShapeSorterScene();
  scene.create();
  return scene;
}

describe("ShapeSorterScene multi-round sessions", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders three dimmed progress dots on create", () => {
    const scene = createScene();

    const dots = getMockFn(scene.add.circle).mock.results.map((r) => r.value as MockGameObject);
    expect(dots).toHaveLength(3);
    // Dots are dimmed via the shared scaffold's alpha argument on add.circle.
    for (const call of getMockFn(scene.add.circle).mock.calls) {
      expect(call[4]).toBe(PROGRESS_DOT_ALPHA);
    }
  });

  it("builds a three-round playthrough and renders round one's three shapes", () => {
    const scene = createScene();
    const internals = getInternals(scene);

    expect(internals.playthrough).toHaveLength(3);
    expect(internals.roundIndex).toBe(0);
    expect(internals.shapes).toHaveLength(3);
    for (const shape of internals.shapes) {
      expect(internals.playthrough[0]).toContain(shape.type);
    }
  });

  it("advances to round two with fresh shapes after all three shapes are placed", () => {
    const scene = createScene();
    const internals = getInternals(scene);

    placeAllShapes(scene);
    expect(getMockFn(mockAudio.playWin)).not.toHaveBeenCalled();

    advanceRound(scene);

    expect(internals.roundIndex).toBe(1);
    expect(internals.shapes).toHaveLength(3);
    for (const shape of internals.shapes) {
      expect(internals.playthrough[1]).toContain(shape.type);
    }
  });

  it("uses unique shapes across the session rounds", () => {
    const scene = createScene();
    const internals = getInternals(scene);

    const roundZero = [...internals.playthrough[0]];
    placeAllShapes(scene);
    advanceRound(scene);

    const roundOne = [...internals.playthrough[1]];
    expect(new Set([...roundZero, ...roundOne]).size).toBe(6);
  });

  it("fills and pops the progress dot when a round completes", () => {
    const scene = createScene();
    const dots = getMockFn(scene.add.circle).mock.results.map((r) => r.value as MockGameObject);

    placeAllShapes(scene);

    expect(getMockFn(dots[0].setAlpha)).toHaveBeenCalledWith(1);
    const popTween = getMockFn(scene.tweens.add).mock.calls.find(
      (call) => call[0]?.targets === dots[0],
    );
    expect(popTween).toBeDefined();
    if (!popTween) return;
    expect(popTween[0].scaleX).toBe(DOT_POP_SCALE);
    expect(popTween[0].scaleY).toBe(DOT_POP_SCALE);
    expect(popTween[0].ease).toBe("Back.out");
    expect(popTween[0].yoyo).toBe(true);
  });

  it("does not win before the final round", () => {
    const scene = createScene();

    placeAllShapes(scene);
    advanceRound(scene);
    placeAllShapes(scene);
    advanceRound(scene);
    placeAllShapes(scene);

    expect(getMockFn(mockAudio.playWin)).toHaveBeenCalledTimes(1);
  });

  it("plays win, awards sticker, and schedules Hub return after the final round", () => {
    const scene = createScene();

    completeSession(scene);

    expect(getMockFn(mockAudio.playWin)).toHaveBeenCalledTimes(1);
    expect(getMockFn(mockAudio.playSticker)).toHaveBeenCalled();
    expect(hasSticker("shape-sorter")).toBe(true);

    const autoReturnCall = getMockFn(scene.time.delayedCall).mock.calls.find(
      (call) => call[0] === AUTO_RETURN_DELAY,
    );
    expect(autoReturnCall).toBeDefined();
  });

  it("destroys the previous round's objects when advancing", () => {
    const scene = createScene();
    const internals = getInternals(scene);
    const roundZeroShapes = internals.shapes.map((s) => s.obj);
    const roundZeroZones = internals.slots.map((s) => s.zone);

    placeAllShapes(scene);
    advanceRound(scene);

    for (const obj of roundZeroShapes) {
      expect(getMockFn(obj.destroy)).toHaveBeenCalled();
    }
    for (const zone of roundZeroZones) {
      expect(getMockFn(zone.destroy)).toHaveBeenCalled();
    }
  });

  it("fills fresh progress dots on relaunch (no stale destroyed dots)", () => {
    const scene = createScene();
    completeSession(scene);

    // Relaunch: the progress-dot array must be reset, not accumulated.
    scene.create();
    const internals = getInternals(scene);
    expect(internals.progressDots).toHaveLength(3);

    // Two sessions drew 3 dots each; the fresh session owns the last three.
    const circleResults = getMockFn(scene.add.circle).mock.results.map(
      (r) => r.value as MockGameObject,
    );
    const freshDots = circleResults.slice(3);
    expect(freshDots).toHaveLength(3);
    expect(internals.progressDots[0]).toBe(freshDots[0]);

    // Completing round 1 must fill a fresh dot, never a destroyed one.
    placeAllShapes(scene);
    const popTween = getMockFn(scene.tweens.add).mock.calls.find(
      (call) => call[0]?.targets === internals.progressDots[0],
    );
    expect(popTween).toBeDefined();
    expect(popTween?.[0]?.targets).toBe(freshDots[0]);
  });
});
