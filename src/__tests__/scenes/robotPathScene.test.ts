import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stubMatchMedia } from "../helpers/matchMediaStub";

type MockFn = ReturnType<typeof vi.fn>;

vi.mock("phaser", async () => {
  const { createPhaserModuleMock } = await import("../helpers/phaserMock");
  return createPhaserModuleMock().module;
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
  AudioManager: {
    getInstance: () => mockAudio,
  },
}));

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

const { mockSpeech } = vi.hoisted(() => ({
  mockSpeech: {
    speakNumber: vi.fn(() => true),
    speakSentence: vi.fn(() => true),
    speakWord: vi.fn(() => true),
    isSpeechSupported: vi.fn(() => true),
    onSpeechLifecycle: vi.fn(() => vi.fn()),
  },
}));

vi.mock("../../utils/speech", () => mockSpeech);

const { mockCompletionEffect } = vi.hoisted(() => ({
  mockCompletionEffect: {
    createCompletionSplash: vi.fn(),
    createWinCelebration: vi.fn(),
  },
}));

vi.mock("../../utils/completionEffect", () => mockCompletionEffect);

import type { RobotPathRound } from "../../game/robotPathLogic";
import { canPlace, DIRECTIONS, type Direction } from "../../game/robotPathLogic";
import { RobotPathScene } from "../../scenes/RobotPathScene";
import { mulberry32 } from "../helpers/randomHelper";

const RULE = "Put the arrows in the robot's path, then tap go.";

function getMockFn(fn: unknown): MockFn {
  return fn as unknown as MockFn;
}

function addOf(scene: unknown): Record<string, unknown> {
  return (scene as { add: Record<string, unknown> }).add;
}

interface SceneInternals {
  rounds: RobotPathRound[];
  roundIndex: number;
  commands: Direction[];
  stoppedRuns: number;
  inputLocked: boolean;
  completedRounds: number;
  paletteRects: Map<Direction, Record<string, MockFn>>;
  paletteArrows: Map<Direction, Record<string, MockFn>>;
  slotRects: Array<Record<string, MockFn>>;
  slotArrows: Array<Record<string, MockFn> | null>;
  robot?: Record<string, MockFn>;
  time: { delayedCall: MockFn };
  tweens: { add: MockFn };
}

function internals(scene: unknown): SceneInternals {
  return scene as unknown as SceneInternals;
}

function currentRound(scene: unknown): RobotPathRound {
  const s = internals(scene);
  return s.rounds[s.roundIndex];
}

/** Jumps to a round with at least `steps` commands, so a test can shorten one. */
function useRoundWithSteps(scene: unknown, steps: number): RobotPathRound {
  const s = internals(scene);
  const index = s.rounds.findIndex((round) => round.solution.length >= steps);
  expect(index).toBeGreaterThanOrEqual(0);
  s.roundIndex = index;
  (scene as unknown as { renderRound: () => void }).renderRound();
  return currentRound(scene);
}

/**
 * Fires every handler registered for `event`.
 *
 * The mock keeps only the last handler per event name, and `attachPressFeedback`
 * registers its own `pointerdown` after the gameplay one — so reading
 * `handlers.pointerdown` alone would tap the squish and never the game.
 */
function fire(obj: Record<string, MockFn>, event: string): void {
  const handlers =
    (obj.allHandlers as unknown as Array<{ name: string; cb: () => void }> | undefined) ?? [];
  for (const entry of handlers) {
    if (entry.name === event) entry.cb();
  }
}

function tapPalette(scene: unknown, direction: Direction): void {
  const rect = internals(scene).paletteRects.get(direction);
  if (!rect) throw new Error(`no palette button for ${direction}`);
  fire(rect, "pointerdown");
}

function tapSlot(scene: unknown, index: number): void {
  fire(internals(scene).slotRects[index], "pointerdown");
}

function goButton(scene: unknown): Record<string, MockFn> {
  const calls = getMockFn(addOf(scene).image).mock.calls;
  const call = calls.find((args) => args[2] === "robot_go");
  if (!call) throw new Error("no Go button");
  return (
    getMockFn(addOf(scene).image).mock.results[calls.indexOf(call)] as {
      value: Record<string, MockFn>;
    }
  ).value;
}

function pressGo(scene: unknown): void {
  fire(goButton(scene), "pointerdown");
}

/** Runs every scheduled callback, including the ones those callbacks schedule. */
function flushTimers(scene: unknown): void {
  const time = internals(scene).time;
  for (let pass = 0; pass < 20; pass++) {
    const calls = time.delayedCall.mock.calls as Array<[number, () => void]>;
    if (calls.length === 0) return;
    time.delayedCall.mockClear();
    for (const [, callback] of calls) {
      callback();
    }
  }
}

/** Taps the round's own solution into the strip, one arrow at a time. */
function programSolution(scene: unknown, length?: number): void {
  const round = currentRound(scene);
  const steps = length ?? round.solution.length;
  for (const direction of round.solution.slice(0, steps)) {
    tapPalette(scene, direction);
  }
}

describe("RobotPathScene shell", () => {
  beforeEach(() => {
    stubMatchMedia(false);
    localStorage.clear();
    mockParentLockInstances.length = 0;
    for (const fn of Object.values(mockAudio)) fn.mockClear();
    mockSpeech.speakSentence.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("renders the back button, six dots, four arrows, six slots and Go", () => {
    const scene = new RobotPathScene(mulberry32(1234));
    scene.create();

    expect(
      getMockFn(addOf(scene).text).mock.calls.find((call) => call[2] === "← Back"),
    ).toBeDefined();
    expect(mockParentLockInstances).toHaveLength(1);
    expect(getMockFn(addOf(scene).circle).mock.calls).toHaveLength(6);
    expect(internals(scene).rounds).toHaveLength(6);
    expect(internals(scene).paletteRects.size).toBe(4);
    expect(internals(scene).paletteArrows.size).toBe(4);
    expect(internals(scene).slotRects).toHaveLength(6);
    expect(internals(scene).inputLocked).toBe(false);
  });

  it("shows and speaks the rule once, with no other text on screen", () => {
    const scene = new RobotPathScene(mulberry32(1234));
    scene.create();

    const texts = getMockFn(addOf(scene).text).mock.calls.map((call) => call[2] as string);
    expect(texts).toContain(RULE);
    expect(texts).toEqual(["← Back", RULE]);
    expect(mockSpeech.speakSentence).toHaveBeenCalledWith(RULE, true);
  });

  it("preloads only the six robot textures", () => {
    const scene = new RobotPathScene(mulberry32(1234));
    scene.preload();

    const keys = getMockFn(
      (scene as unknown as { load: Record<string, unknown> }).load.svg,
    ).mock.calls.map((call) => call[0] as string);
    expect(keys).toHaveLength(6);
    expect(keys).toContain("robot_idle");
    expect(keys).toContain("robot_star");
  });

  it("starts every visit clean on round one with an empty strip", () => {
    const scene = new RobotPathScene(mulberry32(1234));
    scene.create();
    tapPalette(scene, currentRound(scene).solution[0]);

    scene.create();

    expect(internals(scene).roundIndex).toBe(0);
    expect(internals(scene).commands).toEqual([]);
    expect(internals(scene).slotRects).toHaveLength(6);
  });
});

describe("RobotPathScene interactions", () => {
  beforeEach(() => {
    stubMatchMedia(false);
    localStorage.clear();
    mockParentLockInstances.length = 0;
    for (const fn of Object.values(mockAudio)) fn.mockClear();
    mockSpeech.speakSentence.mockClear();
    mockCompletionEffect.createCompletionSplash.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("appends a tapped arrow and draws the trail", () => {
    const scene = new RobotPathScene(mulberry32(1234));
    scene.create();

    tapPalette(scene, currentRound(scene).solution[0]);

    expect(internals(scene).commands).toEqual([currentRound(scene).solution[0]]);
    expect(internals(scene).slotArrows[0]).not.toBeNull();
    const trail = getMockFn(addOf(scene).graphics)
      .mock.results.map((result) => result.value as Record<string, MockFn>)
      .find((graphics) => getMockFn(graphics.fillCircle).mock.calls.length > 0);
    expect(trail).toBeDefined();
  });

  it("refuses an arrow that would leave the board and nudges instead", () => {
    const scene = new RobotPathScene(mulberry32(1234));
    scene.create();
    const round = currentRound(scene);
    const refused = DIRECTIONS.find((direction) => !canPlace(round, [], direction));
    expect(refused).toBeDefined();

    tapPalette(scene, refused as Direction);

    expect(internals(scene).commands).toEqual([]);
    const nudges = internals(scene).tweens.add.mock.calls.map(
      (call) => call[0] as { repeat?: number; yoyo?: boolean },
    );
    expect(nudges.some((config) => config.repeat === 1 && config.yoyo === true)).toBe(true);
  });

  it("removes a tapped slot and every command after it", () => {
    const scene = new RobotPathScene(mulberry32(1234));
    scene.create();
    useRoundWithSteps(scene, 3);
    programSolution(scene, 3);
    expect(internals(scene).commands).toHaveLength(3);

    tapSlot(scene, 1);

    expect(internals(scene).commands).toEqual([currentRound(scene).solution[0]]);
    expect(internals(scene).slotArrows[2]).toBeNull();
  });

  it("solves a round by running the program and advances", () => {
    const scene = new RobotPathScene(mulberry32(1234));
    scene.create();
    programSolution(scene);

    pressGo(scene);
    // The strip is inert for the length of the walk, through the run flag.
    expect((scene as unknown as { running: boolean }).running).toBe(true);
    flushTimers(scene);
    expect((scene as unknown as { running: boolean }).running).toBe(false);

    expect(internals(scene).roundIndex).toBe(1);
    expect(internals(scene).completedRounds).toBe(1);
    expect(mockAudio.playCorrect).toHaveBeenCalled();
    expect(mockCompletionEffect.createCompletionSplash).toHaveBeenCalled();
  });

  it("keeps every command after a stopped run and stays on the round", () => {
    const scene = new RobotPathScene(mulberry32(1234));
    scene.create();
    const round = useRoundWithSteps(scene, 3);
    expect(round.solution.length).toBeGreaterThanOrEqual(3);
    programSolution(scene, round.solution.length - 1);
    const commands = [...internals(scene).commands];
    const roundIndex = internals(scene).roundIndex;

    pressGo(scene);
    flushTimers(scene);

    expect(internals(scene).roundIndex).toBe(roundIndex);
    expect(internals(scene).commands).toEqual(commands);
    expect(mockAudio.playIncorrect).toHaveBeenCalled();
    expect(internals(scene).inputLocked).toBe(false);
    // The robot is back on its start tile, ready for one arrow to change.
    const robot = internals(scene).robot as Record<string, MockFn>;
    expect(robot.setPosition).toHaveBeenLastCalledWith(
      512 + (round.start.col - 1) * 120,
      190 + round.start.row * 120,
    );
  });

  it("re-speaks the rule on an empty Go and records no run", () => {
    const scene = new RobotPathScene(mulberry32(1234));
    scene.create();
    mockSpeech.speakSentence.mockClear();

    pressGo(scene);

    expect(mockSpeech.speakSentence).toHaveBeenCalledWith(RULE, true);
    expect(mockAudio.playIncorrect).not.toHaveBeenCalled();
    expect(internals(scene).roundIndex).toBe(0);
    expect(internals(scene).inputLocked).toBe(false);
  });

  it("ignores arrow taps while a run is executing", () => {
    const scene = new RobotPathScene(mulberry32(1234));
    scene.create();
    const round = currentRound(scene);
    programSolution(scene);
    pressGo(scene);

    tapPalette(scene, round.solution[0]);

    expect(internals(scene).commands).toEqual(round.solution);
  });

  it("hints the first solution arrow only after the second stopped run", () => {
    const scene = new RobotPathScene(mulberry32(1234));
    scene.create();
    const round = useRoundWithSteps(scene, 3);

    programSolution(scene, round.solution.length - 1);
    pressGo(scene);
    flushTimers(scene);
    expect(internals(scene).stoppedRuns).toBe(1);
    const afterFirst = internals(scene).tweens.add.mock.calls.length;

    pressGo(scene);
    flushTimers(scene);
    expect(internals(scene).stoppedRuns).toBe(2);

    const hintTweens = internals(scene)
      .tweens.add.mock.calls.slice(afterFirst)
      .map((call) => call[0] as { targets?: unknown[]; repeat?: number });
    expect(hintTweens.some((config) => config.repeat === 2 && config.targets?.length === 2)).toBe(
      true,
    );
  });
});
