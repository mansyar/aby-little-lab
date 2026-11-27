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
    playSFX: vi.fn(),
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

/** The replay is the mascot's move, so the test watches those four methods. */
const { mockMascot } = vi.hoisted(() => ({
  mockMascot: {
    wave: vi.fn(),
    nod: vi.fn(),
    cheer: vi.fn(),
    curious: vi.fn(),
    idleLoop: vi.fn(),
    destroy: vi.fn(),
  },
}));

vi.mock("../../components/Mascot", () => ({
  // The art-loading cue reads the mascot's display scale from this module.
  MASCOT_SCALE: 0.2,
  createCornerMascot: () => mockMascot,
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

import type { MoveAction, Program, RepeatRound, TargetCount } from "../../game/repeatMachineLogic";
import { RepeatMachineScene } from "../../scenes/RepeatMachineScene";
import { mulberry32 } from "../helpers/randomHelper";

const RULE = "Pick a move and a count, then press Go.";

interface Point {
  readonly x: number;
  readonly y: number;
}

interface SceneInternals {
  rounds: readonly RepeatRound[];
  roundIndex: number;
  actionRects: Array<Record<string, MockFn>>;
  countRects: Array<Record<string, MockFn>>;
  dotCircles: Array<Record<string, MockFn>>;
  program: Program;
  performed: readonly MoveAction[];
  running: boolean;
  inputLocked: boolean;
  solvedThisRound: boolean;
  wrongRuns: number;
  wrongTaps: number;
  hintLevel: number;
  attempts: number;
  lastScore: number;
  sessionCorrect: number;
  sessionWrong: number;
  sessionProbes: number;
  completedRounds: number;
  time: { delayedCall: MockFn };
  e2eRepeatMachine: () => {
    round: number;
    target: TargetCount;
    actions: readonly MoveAction[];
    actionOptions: Array<{ index: number; action: MoveAction; x: number; y: number }>;
    countOptions: Array<{ index: number; count: number; x: number; y: number }>;
    program: Program;
    performed: readonly MoveAction[];
    dots: Point[];
    solved: boolean;
    wrongRuns: number;
    wrongTaps: number;
    hintLevel: number;
    attempts: number;
    lastScore: number;
    go: Point;
    machine: Point;
  };
}

function getMockFn(fn: unknown): MockFn {
  return fn as unknown as MockFn;
}

function addOf(scene: unknown): Record<string, unknown> {
  return (scene as { add: Record<string, unknown> }).add;
}

function internals(scene: unknown): SceneInternals {
  return scene as unknown as SceneInternals;
}

function currentRound(scene: unknown): RepeatRound {
  const s = internals(scene);
  const round = s.rounds[s.roundIndex];
  if (!round) throw new Error(`no round at ${s.roundIndex}`);
  return round;
}

/**
 * Fires every handler for an event: press feedback registers its own
 * `pointerdown` after the gameplay one, so the first handler alone is not enough.
 */
function fire(obj: Record<string, MockFn>, event: string): void {
  const handlers =
    (obj.allHandlers as unknown as Array<{ name: string; cb: () => void }> | undefined) ?? [];
  for (const entry of handlers) {
    if (entry.name === event) entry.cb();
  }
}

function tapAction(scene: unknown, index: number): void {
  const rect = internals(scene).actionRects[index];
  if (!rect) throw new Error(`no action at ${index}`);
  fire(rect, "pointerdown");
}

function tapCount(scene: unknown, count: number): void {
  const rect = internals(scene).countRects[count - 2];
  if (!rect) throw new Error(`no count button for ${count}`);
  fire(rect, "pointerdown");
}

function pressGo(scene: unknown): void {
  const calls = getMockFn(addOf(scene).rectangle).mock.calls;
  const go = calls.find((call) => call[0] === 912 && call[1] === 628 && call[2] === 112);
  if (!go) throw new Error("no Go button");
  const rect = getMockFn(addOf(scene).rectangle).mock.results[calls.indexOf(go)] as {
    value: Record<string, MockFn>;
  };
  fire(rect.value, "pointerdown");
}

/** Runs every scheduled callback, including the ones those callbacks schedule. */
function flushTimers(scene: unknown): void {
  const time = internals(scene).time;
  for (let pass = 0; pass < 20; pass++) {
    const calls = time.delayedCall.mock.calls as Array<[number, () => void]>;
    if (calls.length === 0) return;
    time.delayedCall.mockClear();
    for (const [, callback] of calls) callback();
  }
}

/** Runs just the replay steps, leaving the between-round timer pending. */
function flushReplay(scene: unknown): void {
  const time = internals(scene).time;
  const calls = time.delayedCall.mock.calls as Array<[number, () => void]>;
  time.delayedCall.mockClear();
  for (const [, callback] of calls) callback();
}

/** Authors a valid program for `count` and runs it to completion. */
function authorAndRun(scene: unknown, count: number): void {
  tapAction(scene, 0);
  tapCount(scene, count);
  pressGo(scene);
  flushTimers(scene);
}

/** A count the current round does not ask for, so the replay visibly misses. */
function wrongCount(scene: unknown): number {
  const target = currentRound(scene).target;
  return target === 4 ? 2 : target + 1;
}

describe("RepeatMachineScene shell", () => {
  beforeEach(() => {
    stubMatchMedia(false);
    localStorage.clear();
    mockParentLockInstances.length = 0;
    for (const fn of Object.values(mockAudio)) fn.mockClear();
    for (const fn of Object.values(mockMascot)) fn.mockClear();
    mockSpeech.speakSentence.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("renders the back button, six progress dots, target dots, four moves, three counts and Go", () => {
    const scene = new RepeatMachineScene(mulberry32(1234));
    scene.create();

    const texts = getMockFn(addOf(scene).text).mock.calls.map((call) => call[2] as string);
    expect(texts).toContain("← Back");
    expect(texts).toContain(RULE);
    for (const label of ["Wave", "Nod", "Cheer", "Curious", "2", "3", "4"]) {
      expect(texts).toContain(label);
    }
    expect(mockParentLockInstances).toHaveLength(1);
    expect(getMockFn(addOf(scene).circle).mock.calls).toHaveLength(6 + currentRound(scene).target);
    expect(internals(scene).actionRects).toHaveLength(4);
    expect(internals(scene).countRects).toHaveLength(3);
    expect(internals(scene).rounds).toHaveLength(6);
    expect(internals(scene).inputLocked).toBe(false);
  });

  it("shows and speaks the rule once when the game opens", () => {
    const scene = new RepeatMachineScene(mulberry32(1234));
    scene.create();

    const texts = getMockFn(addOf(scene).text).mock.calls.map((call) => call[2] as string);
    expect(texts.filter((text) => text === RULE)).toHaveLength(1);
    expect(mockSpeech.speakSentence).toHaveBeenCalledTimes(1);
    expect(mockSpeech.speakSentence).toHaveBeenCalledWith(RULE, true);
  });

  it("preloads the glyph group it draws from", () => {
    const scene = new RepeatMachineScene(mulberry32(1234));
    scene.preload();

    const keys = getMockFn(
      (scene as unknown as { load: Record<string, unknown> }).load.svg,
    ).mock.calls.map((call) => call[0] as string);
    expect(keys).toContain("bubble");
    expect(keys).toContain("plus");
  });

  it("starts every visit clean on round one with no authored program", () => {
    const scene = new RepeatMachineScene(mulberry32(1234));
    scene.create();
    tapAction(scene, 0);
    tapCount(scene, 4);

    scene.create();

    expect(internals(scene).roundIndex).toBe(0);
    expect(internals(scene).program).toEqual({ action: null, count: null });
    expect(internals(scene).wrongRuns).toBe(0);
    expect(internals(scene).actionRects).toHaveLength(4);
  });

  it("lays the dots, machine, counts, moves and Go out without overlaps", () => {
    const scene = new RepeatMachineScene(mulberry32(1234));
    scene.create();
    const state = internals(scene).e2eRepeatMachine();

    expect(state.dots).toHaveLength(state.target);
    expect(state.actionOptions).toHaveLength(4);
    expect(state.countOptions).toHaveLength(3);
    const firstDot = state.dots[0];
    const lastDot = state.dots[state.dots.length - 1];
    if (!firstDot || !lastDot) throw new Error("no target dots");
    expect(firstDot.y).toBe(200);
    expect(lastDot.x - firstDot.x).toBe((state.target - 1) * 112);

    expect(state.dots[0]?.y ?? 0).toBeLessThan(state.machine.y - 80);
    expect(state.machine.y + 80).toBeLessThan(state.countOptions[0]?.y ?? 0);
    expect((state.countOptions[0]?.y ?? 0) + 56).toBeLessThan(state.actionOptions[0]?.y ?? 0);
    expect(state.go).toEqual({ x: 912, y: 628 });
    const lastAction = state.actionOptions[state.actionOptions.length - 1];
    if (!lastAction) throw new Error("no last action");
    expect(state.go.x - 56).toBeGreaterThan(lastAction.x + 66);
  });
});

describe("RepeatMachineScene the replay", () => {
  beforeEach(() => {
    stubMatchMedia(false);
    localStorage.clear();
    mockParentLockInstances.length = 0;
    for (const fn of Object.values(mockAudio)) fn.mockClear();
    for (const fn of Object.values(mockMascot)) fn.mockClear();
    mockSpeech.speakSentence.mockClear();
    mockCompletionEffect.createCompletionSplash.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("replays exactly the authored count, one mascot move and sound per step", () => {
    const scene = new RepeatMachineScene(mulberry32(1234));
    scene.create();
    tapAction(scene, 1);
    tapCount(scene, 2);
    pressGo(scene);

    const delays = internals(scene).time.delayedCall.mock.calls.map((call) => call[0] as number);
    expect(delays).toEqual([420, 840]);
    const action = currentRound(scene).actions[1];
    expect(action).toBeTruthy();
    if (action) {
      expect(internals(scene).performed).toEqual([action, action]);
    }

    flushTimers(scene);

    if (action) expect(getMockFn(mockMascot[action])).toHaveBeenCalledTimes(2);
    expect(mockAudio.playSFX).toHaveBeenCalledWith("pop");
    expect(internals(scene).running).toBe(false);
  });

  it("ignores authoring taps while the machine is replaying", () => {
    const scene = new RepeatMachineScene(mulberry32(1234));
    scene.create();
    tapAction(scene, 0);
    tapCount(scene, 2);
    pressGo(scene);

    tapAction(scene, 2);
    tapCount(scene, 4);

    // MOVE_ACTIONS[0] is wave; the round's own moves are only a hint, not the
    // order of the drawn cards.
    expect(internals(scene).program).toEqual({ action: "wave", count: 2 });
  });

  it("shows a wrong count in full, keeps the round and offers a hint", () => {
    const scene = new RepeatMachineScene(mulberry32(1234));
    scene.create();
    const count = wrongCount(scene);

    authorAndRun(scene, count);

    const s = internals(scene);
    expect(s.roundIndex).toBe(0);
    expect(s.performed).toHaveLength(count);
    expect(s.wrongRuns).toBe(1);
    expect(s.hintLevel).toBe(1);
    expect(s.solvedThisRound).toBe(false);
    expect(s.sessionWrong).toBe(1);
    expect(s.sessionCorrect).toBe(0);
    expect(mockAudio.playIncorrect).toHaveBeenCalledTimes(1);
    expect(s.program.count).toBe(count);

    const rings = getMockFn(addOf(scene).graphics)
      .mock.results.map((result) => result.value as Record<string, MockFn>)
      .filter((graphics) => getMockFn(graphics.strokeRoundedRect).mock.calls.length > 0);
    expect(rings.length).toBeGreaterThan(0);
  });

  it("wins on the target count, fills a progress dot and advances", () => {
    const scene = new RepeatMachineScene(mulberry32(1234));
    scene.create();
    const target = currentRound(scene).target;

    tapAction(scene, 0);
    tapCount(scene, target);
    pressGo(scene);
    flushReplay(scene);

    expect(internals(scene).solvedThisRound).toBe(true);
    expect(internals(scene).lastScore).toBe(2);
    expect(internals(scene).sessionCorrect).toBe(1);
    expect(internals(scene).roundIndex).toBe(0);
    expect(mockAudio.playCorrect).toHaveBeenCalledTimes(1);
    expect(mockCompletionEffect.createCompletionSplash).toHaveBeenCalled();

    flushTimers(scene);
    expect(internals(scene).roundIndex).toBe(1);
  });

  it("scores a retry lower, but never soft-locks after a wrong count", () => {
    const scene = new RepeatMachineScene(mulberry32(1234));
    scene.create();
    authorAndRun(scene, wrongCount(scene));

    const afterMiss = internals(scene);
    expect(afterMiss.attempts).toBe(2);
    expect(afterMiss.hintLevel).toBe(1);
    expect(afterMiss.wrongRuns).toBe(1);

    tapAction(scene, 0);
    tapCount(scene, currentRound(scene).target);
    pressGo(scene);
    flushReplay(scene);

    const s = internals(scene);
    expect(s.roundIndex).toBe(0);
    expect(s.attempts).toBe(2);
    expect(s.lastScore).toBe(1);
    expect(s.hintLevel).toBe(1);
    expect(s.wrongRuns).toBe(1);

    flushTimers(scene);
    expect(internals(scene).roundIndex).toBe(1);
  });
});
