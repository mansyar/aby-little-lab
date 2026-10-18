import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type MatchMediaStub, stubMatchMedia } from "../helpers/matchMediaStub";

type MockFn = ReturnType<typeof vi.fn>;

/**
 * Mock Phaser module. Scene files extend Phaser.Scene, which at runtime
 * resolves to MockScene. Each instance gets fresh mock methods in the
 * constructor, enabling per-test isolation.
 */
vi.mock("phaser", async () => {
  const { createPhaserModuleMock } = await import("../helpers/phaserMock");
  return createPhaserModuleMock().module;
});

/** Mock AudioManager so scene tests can verify audio calls without real AudioContext. */
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
  AudioManager: {
    getInstance: () => mockAudio,
  },
}));

/** Mock ParentLock so tests can drive the hold-to-exit flow directly. */
const { mockParentLockInstances, MockParentLock } = vi.hoisted(() => {
  const mockParentLockInstances: Array<Record<string, unknown>> = [];
  class MockParentLock {
    constructor(...args: unknown[]) {
      mockParentLockInstances.push(args[0] as Record<string, unknown>);
    }

    destroy(): void {}
  }
  return { mockParentLockInstances, MockParentLock };
});

vi.mock("../../components/ParentLock", () => ({
  ParentLock: MockParentLock,
}));

import { AnimalTraceScene } from "../../scenes/AnimalTraceScene";
import { hasSticker } from "../../utils/storage";

/** Casts a Phaser-typed method to a MockFn for mock assertions. */
function getMockFn(fn: unknown): MockFn {
  return fn as unknown as MockFn;
}

describe("AnimalTraceScene session state", () => {
  let matchMediaMock: MatchMediaStub;

  beforeEach(() => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    matchMediaMock = stubMatchMedia(false);
    localStorage.clear();
    mockParentLockInstances.length = 0;
    for (const fn of Object.values(mockAudio)) {
      fn.mockClear();
    }
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  /** Toggles the `prefers-reduced-motion` media query result. */
  function setReducedMotion(reduced: boolean): void {
    matchMediaMock.setReducedMotion(reduced);
  }

  /** Fires the pointerdown handler at the given coordinates (scene-level input). */
  function firePointerAt(scene: unknown, x: number, y: number): void {
    const input = (scene as { input: Record<string, unknown> }).input;
    const onMock = getMockFn(input.on);
    const pointerdownCalls = onMock.mock.calls.filter((call) => call[0] === "pointerdown");
    const handler = pointerdownCalls.at(-1)?.[1] as (pointer: { x: number; y: number }) => void;
    expect(handler).toBeTypeOf("function");
    handler({ x, y });
  }

  /** Traces the full current path by hitting every waypoint past the start. */
  function traceFullPath(scene: unknown): void {
    const s = scene as { currentPair: { pathPoints: Array<{ x: number; y: number }> } };
    const points = s.currentPair.pathPoints;
    for (let i = 1; i < points.length; i++) {
      firePointerAt(scene, points[i].x, points[i].y);
    }
  }

  /** Fires the most recently registered next-pair delay (1000ms) callback. */
  function fireNextPairDelay(scene: unknown): void {
    const time = (scene as { time: Record<string, unknown> }).time;
    const delayedCallMock = getMockFn(time.delayedCall);
    const calls = delayedCallMock.mock.calls.filter((call) => call[0] === 1000);
    expect(calls.length).toBeGreaterThan(0);
    const handler = calls.at(-1)?.[1] as () => void;
    handler();
  }

  /** Returns the auto-return (3000ms) delayed call registered most recently. */
  function getAutoReturnCall(scene: unknown): unknown[] | undefined {
    const time = (scene as { time: Record<string, unknown> }).time;
    const delayedCallMock = getMockFn(time.delayedCall);
    return delayedCallMock.mock.calls.filter((call) => call[0] === 3000).at(-1);
  }

  it("requires all 3 paths again after a full-session relaunch", () => {
    const scene = new AnimalTraceScene();
    scene.create();

    // Complete a full session (3 paths → win → sticker).
    traceFullPath(scene);
    fireNextPairDelay(scene);
    traceFullPath(scene);
    fireNextPairDelay(scene);
    traceFullPath(scene);
    expect(getMockFn(mockAudio.playWin)).toHaveBeenCalledTimes(1);
    expect(hasSticker("animal-trace")).toBe(true);

    // Relaunch: session counters must be reset.
    scene.create();
    const state = scene as unknown as { completedPaths: number; progressDots: unknown[] };
    expect(state.completedPaths).toBe(0);
    expect(state.progressDots).toHaveLength(3);

    // Completing a single path must NOT complete the round.
    traceFullPath(scene);
    expect(getMockFn(mockAudio.playWin)).toHaveBeenCalledTimes(1);
    expect(state.completedPaths).toBe(1);
    // The last scheduled action after the relaunch must be the next-pair
    // delay (1000ms), never a round-completion auto-return (3000ms).
    const delayedCallMock = getMockFn(
      (scene as unknown as { time: Record<string, unknown> }).time.delayedCall,
    );
    const lastCall = delayedCallMock.mock.calls.at(-1);
    expect(lastCall?.[0]).toBe(1000);
  });

  it("plays all 3 pairs after a mid-session exit relaunch without crashing", () => {
    const scene = new AnimalTraceScene();
    scene.create();

    // Complete one path, then exit mid-session (relaunch without finishing).
    traceFullPath(scene);
    fireNextPairDelay(scene);

    scene.create();
    expect((scene as unknown as { currentPairIndex: number }).currentPairIndex).toBe(0);

    // The relaunched session must require all 3 paths again and not crash
    // on a stale pair index (pairs[3] would throw).
    traceFullPath(scene);
    fireNextPairDelay(scene);
    traceFullPath(scene);
    fireNextPairDelay(scene);
    traceFullPath(scene);
    expect(getMockFn(mockAudio.playWin)).toHaveBeenCalledTimes(1);
  });

  it("recreates progress dots on relaunch (no stale destroyed dots)", () => {
    const scene = new AnimalTraceScene();
    scene.create();
    scene.create();

    const state = scene as unknown as { progressDots: unknown[] };
    expect(state.progressDots).toHaveLength(3);
    // Only 3 dots are drawn per session, not accumulated.
    const circleMock = getMockFn((scene as unknown as { add: Record<string, unknown> }).add.circle);
    expect(circleMock).toHaveBeenCalledTimes(6);
  });

  it("guards the round-complete flow under reduced motion", () => {
    setReducedMotion(true);
    const scene = new AnimalTraceScene();
    scene.create();
    traceFullPath(scene);
    fireNextPairDelay(scene);
    traceFullPath(scene);
    fireNextPairDelay(scene);
    traceFullPath(scene);
    expect(getMockFn(mockAudio.playWin)).toHaveBeenCalledTimes(1);
    expect(getAutoReturnCall(scene)).toBeDefined();
  });

  it("marks the next waypoint with a ring and lights visited dots as the trace advances", () => {
    const scene = new AnimalTraceScene();
    scene.create();

    // Path graphics is the single graphics object created for the path.
    const graphicsMock = getMockFn(
      (scene as unknown as { add: Record<string, unknown> }).add.graphics,
    );
    expect(graphicsMock).toHaveBeenCalledTimes(1);
    const graphics = graphicsMock.mock.results[0].value as Record<string, MockFn>;

    const points = (
      scene as unknown as { currentPair: { pathPoints: Array<{ x: number; y: number }> } }
    ).currentPair.pathPoints;

    // Fresh pair: the ring sits on the first interior waypoint (index 1).
    expect(graphics.strokeCircle).toHaveBeenCalledWith(
      points[1].x,
      points[1].y,
      expect.any(Number),
    );

    // Advance to waypoint 1: it becomes lit (visited color) and the ring
    // moves to waypoint 2.
    firePointerAt(scene, points[1].x, points[1].y);
    expect(graphics.fillStyle).toHaveBeenCalledWith(0x68d391, 1);
    expect(graphics.fillCircle).toHaveBeenCalledWith(points[1].x, points[1].y, 6);
    expect(graphics.strokeCircle).toHaveBeenCalledWith(
      points[2].x,
      points[2].y,
      expect.any(Number),
    );
  });

  it("skips the pulsing ring animation under reduced motion", () => {
    setReducedMotion(true);
    const scene = new AnimalTraceScene();
    scene.create();

    const tweensMock = getMockFn(
      (scene as unknown as { tweens: Record<string, unknown> }).tweens.add,
    );
    const pulseTweens = tweensMock.mock.calls.filter((call) => call[0] && "onUpdate" in call[0]);
    expect(pulseTweens).toHaveLength(0);
  });

  it("pulses the next-waypoint ring with a looping tween in normal motion", () => {
    const scene = new AnimalTraceScene();
    scene.create();

    const tweensMock = getMockFn(
      (scene as unknown as { tweens: Record<string, unknown> }).tweens.add,
    );
    const pulseTweens = tweensMock.mock.calls.filter(
      (call) => call[0] && typeof call[0].onUpdate === "function" && call[0].repeat === -1,
    );
    expect(pulseTweens).toHaveLength(1);
  });

  it("redraws the path guide from the pulse onUpdate without an active pair", () => {
    const scene = new AnimalTraceScene();
    scene.create();

    const tweensMock = getMockFn(
      (scene as unknown as { tweens: Record<string, unknown> }).tweens.add,
    );
    const pulse = tweensMock.mock.calls.find(
      (call) => call[0] && typeof call[0].onUpdate === "function",
    );
    expect(pulse).toBeDefined();
    if (!pulse) return;
    // No active pair mid-pulse: updates the radius, skips the redraw.
    (pulse[0] as { onUpdate: () => void }).onUpdate();
    expect((scene as unknown as { ringRadius: number }).ringRadius).toBeGreaterThan(0);
  });

  it("redraws the path guide from the pulse onUpdate with an active pair", () => {
    const scene = new AnimalTraceScene();
    scene.create();

    const tweensMock = getMockFn(
      (scene as unknown as { tweens: Record<string, unknown> }).tweens.add,
    );
    const pulse = tweensMock.mock.calls.find(
      (call) => call[0] && typeof call[0].onUpdate === "function",
    );
    expect(pulse).toBeDefined();
    if (!pulse) return;
    // Simulate an active pair so the redraw branch runs.
    const graphics = {
      clear: vi.fn(),
      fillStyle: vi.fn(),
      fillCircle: vi.fn(),
      lineStyle: vi.fn(),
      strokeCircle: vi.fn(),
      strokePoints: vi.fn(),
    };
    (scene as unknown as { currentPair: unknown }).currentPair = {
      pathGraphics: graphics,
      pathPoints: [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
      ],
      progress: { currentPoint: 0 },
    };
    (pulse[0] as { onUpdate: () => void }).onUpdate();
    expect(graphics.clear).toHaveBeenCalled();
  });
});
