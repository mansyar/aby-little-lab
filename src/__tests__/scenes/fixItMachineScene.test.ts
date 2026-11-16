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

import type { ActionIcon, FixItRound } from "../../game/fixItMachineLogic";
import { correctAction } from "../../game/fixItMachineLogic";
import { FixItMachineScene } from "../../scenes/FixItMachineScene";
import { mulberry32 } from "../helpers/randomHelper";

const RULE = "Watch the machine make the toy. Then tap the card that went wrong.";

function getMockFn(fn: unknown): MockFn {
  return fn as unknown as MockFn;
}

function addOf(scene: unknown): Record<string, unknown> {
  return (scene as { add: Record<string, unknown> }).add;
}

interface SceneInternals {
  rounds: readonly FixItRound[];
  roundIndex: number;
  tape: ActionIcon[];
  cardRects: Array<Record<string, MockFn>>;
  trayRects: Array<Record<string, MockFn>>;
  trayActions: ActionIcon[];
  trayOpen: boolean;
  running: boolean;
  inputLocked: boolean;
  wrongTaps: number;
  hintLevel: number;
  failedRuns: number;
  solvedThisRound: boolean;
  sessionCorrect: number;
  sessionWrong: number;
  completedRounds: number;
  machine?: Record<string, MockFn>;
  e2eFixItMachine: () => {
    round: number;
    solution: ActionIcon[];
    tape: ActionIcon[];
    bugIndex: number;
    solved: boolean;
    wrongTaps: number;
    hintLevel: number;
    failedRuns: number;
    trayOpen: boolean;
    cards: { index: number; x: number; y: number }[];
    tray: { index: number; action: ActionIcon; x: number; y: number }[];
    go: { x: number; y: number };
    machine: { x: number; y: number };
    goal: { x: number; y: number };
  };
  time: { delayedCall: MockFn };
  tweens: { add: MockFn };
}

function internals(scene: unknown): SceneInternals {
  return scene as unknown as SceneInternals;
}

function currentRound(scene: unknown): FixItRound {
  const s = internals(scene);
  const round = s.rounds[s.roundIndex];
  if (!round) throw new Error(`no round at ${s.roundIndex}`);
  return round;
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

function tapCard(scene: unknown, index: number): void {
  fire(internals(scene).cardRects[index], "pointerdown");
}

function tapTray(scene: unknown, index: number): void {
  fire(internals(scene).trayRects[index], "pointerdown");
}

function tapWrongCard(scene: unknown): void {
  tapCard(scene, currentRound(scene).bugIndex);
}

/** A card that is not the round's wrong one, for a miss. */
function tapInnocentCard(scene: unknown): void {
  const bug = currentRound(scene).bugIndex;
  tapCard(scene, bug === 0 ? 1 : 0);
}

/** Taps the candidate that names the right tool. */
function tapRightTool(scene: unknown): void {
  const index = internals(scene).trayActions.indexOf(correctAction(currentRound(scene)));
  expect(index).toBeGreaterThanOrEqual(0);
  tapTray(scene, index);
}

function pressGo(scene: unknown): void {
  const calls = getMockFn(addOf(scene).rectangle).mock.calls;
  const go = calls.find((call) => call[0] === 896 && call[1] === 664 && call[2] === 112);
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
    for (const [, callback] of calls) {
      callback();
    }
  }
}

/** Runs the tape to its stop once, leaving the scene ready to diagnose. */
function runTape(scene: unknown): void {
  pressGo(scene);
  flushTimers(scene);
}

/** Diagnoses and repairs the current round, then runs it to a solve. */
function solveRound(scene: unknown): void {
  tapWrongCard(scene);
  tapRightTool(scene);
  runTape(scene);
}

describe("FixItMachineScene shell", () => {
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

  it("renders the back button, six dots, five cards, three tray slots and Go", () => {
    const scene = new FixItMachineScene(mulberry32(1234));
    scene.create();

    expect(
      getMockFn(addOf(scene).text).mock.calls.find((call) => call[2] === "← Back"),
    ).toBeDefined();
    expect(mockParentLockInstances).toHaveLength(1);
    expect(getMockFn(addOf(scene).circle).mock.calls).toHaveLength(6);
    expect(internals(scene).cardRects).toHaveLength(5);
    expect(internals(scene).trayRects).toHaveLength(3);
    expect(internals(scene).rounds).toHaveLength(6);
    expect(internals(scene).inputLocked).toBe(false);
  });

  it("shows and speaks the rule once, with no other text on screen", () => {
    const scene = new FixItMachineScene(mulberry32(1234));
    scene.create();

    const texts = getMockFn(addOf(scene).text).mock.calls.map((call) => call[2] as string);
    expect(texts).toContain(RULE);
    expect(texts).toEqual(["← Back", RULE]);
    expect(mockSpeech.speakSentence).toHaveBeenCalledWith(RULE, true);
  });

  it("preloads only the sixteen machine textures", () => {
    const scene = new FixItMachineScene(mulberry32(1234));
    scene.preload();

    const keys = getMockFn(
      (scene as unknown as { load: Record<string, unknown> }).load.svg,
    ).mock.calls.map((call) => call[0] as string);
    expect(keys).toHaveLength(16);
    expect(keys).toContain("machine_idle");
    expect(keys).toContain("machine_blocks");
  });

  it("starts every visit clean on round one with the tray shut", () => {
    const scene = new FixItMachineScene(mulberry32(1234));
    scene.create();
    tapWrongCard(scene);

    scene.create();

    expect(internals(scene).roundIndex).toBe(0);
    expect(internals(scene).trayOpen).toBe(false);
    expect(internals(scene).wrongTaps).toBe(0);
    expect(internals(scene).cardRects).toHaveLength(5);
  });

  it("lays the goal, machine, tape, tray and Go out without overlaps", () => {
    const scene = new FixItMachineScene(mulberry32(1234));
    scene.create();
    const state = internals(scene).e2eFixItMachine();

    const { cards, go, machine, goal, tray } = state;
    // Five cards at 96px with 12px gaps span 528px and sit on one line.
    expect(cards).toHaveLength(3);
    const first = cards[0];
    const last = cards[cards.length - 1];
    expect(first && last).toBeTruthy();
    if (first && last) {
      expect(first.x).toBe(296);
      expect(last.x).toBe(512);
      expect(last.x - first.x + 96).toBe(312);
      for (const card of cards) expect(card.y).toBe(552);
    }
    expect(tray).toEqual([]);
    expect(go).toEqual({ x: 896, y: 664 });

    // The goal bubble, the machine and the Go button each keep their own space.
    const tapeTop = 552 - 48;
    const trayTop = 664 - 48;
    expect(goal.y + 76).toBeLessThan(tapeTop);
    expect(machine.y + 116).toBeLessThan(tapeTop);
    expect(machine.x + 116).toBeLessThan(go.x - 56);
    expect(trayTop).toBeLessThan(go.y + 56);
  });
});

describe("FixItMachineScene the run", () => {
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

  it("plays one card every 550 ms and shows the machine working", () => {
    const scene = new FixItMachineScene(mulberry32(1234));
    scene.create();
    pressGo(scene);

    const delays = internals(scene).time.delayedCall.mock.calls.map((call) => call[0] as number);
    expect(delays).toEqual([550, 1100, 1650]);
    expect(getMockFn(internals(scene).machine?.setTexture).mock.calls).toContainEqual([
      "machine_working",
    ]);
    expect(internals(scene).running).toBe(true);
  });

  it("ignores a tap while the tape is playing", () => {
    const scene = new FixItMachineScene(mulberry32(1234));
    scene.create();
    pressGo(scene);

    tapWrongCard(scene);

    expect(internals(scene).trayOpen).toBe(false);
  });

  it("stops at the wrong card without advancing, keeping the tape and the round", () => {
    const scene = new FixItMachineScene(mulberry32(1234));
    scene.create();
    const before = [...internals(scene).tape];

    runTape(scene);

    expect(internals(scene).failedRuns).toBe(1);
    expect(internals(scene).roundIndex).toBe(0);
    expect(internals(scene).tape).toEqual(before);
    expect(internals(scene).sessionWrong).toBe(1);
    expect(internals(scene).sessionCorrect).toBe(0);
    expect(mockAudio.playIncorrect).toHaveBeenCalledTimes(1);
    expect(internals(scene).running).toBe(false);
    expect(getMockFn(internals(scene).machine?.setTexture).mock.calls).toContainEqual([
      "machine_puzzled",
    ]);
  });

  it("rings the wrong card so the child can see where the run stopped", () => {
    const scene = new FixItMachineScene(mulberry32(1234));
    scene.create();

    runTape(scene);

    const rings = getMockFn(addOf(scene).graphics)
      .mock.results.map((result) => result.value as Record<string, MockFn>)
      .filter((graphics) => getMockFn(graphics.strokeRoundedRect).mock.calls.length > 0);
    expect(rings.length).toBeGreaterThan(0);
    const bug = currentRound(scene).bugIndex;
    const frames = getMockFn(rings[rings.length - 1]?.strokeRoundedRect).mock.calls;
    expect(frames.some((call) => (call[0] as number) === 296 + bug * 108 - 54)).toBe(true);
  });

  it("solves a repaired tape, fills the dot and moves to the next round", () => {
    const scene = new FixItMachineScene(mulberry32(1234));
    scene.create();
    const round = currentRound(scene);

    tapWrongCard(scene);
    tapRightTool(scene);
    expect(internals(scene).tape).toEqual(round.program);

    runTape(scene);

    expect(mockAudio.playCorrect).toHaveBeenCalledTimes(1);
    expect(internals(scene).sessionCorrect).toBe(1);
    expect(internals(scene).roundIndex).toBe(1);
    expect(internals(scene).trayOpen).toBe(false);
  });
});

describe("FixItMachineScene diagnosis", () => {
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

  it("opens the tray on the wrong card with the round's three candidates", () => {
    const scene = new FixItMachineScene(mulberry32(1234));
    scene.create();
    const round = currentRound(scene);

    tapWrongCard(scene);

    expect(internals(scene).trayOpen).toBe(true);
    expect(internals(scene).trayActions).toEqual(round.candidates);
    expect(internals(scene).trayActions).toContain(correctAction(round));
  });

  it("bounces a card that is not the wrong one and records the miss", () => {
    const scene = new FixItMachineScene(mulberry32(1234));
    scene.create();

    tapInnocentCard(scene);

    expect(internals(scene).trayOpen).toBe(false);
    expect(mockAudio.playIncorrect).toHaveBeenCalledTimes(1);
    expect(internals(scene).sessionWrong).toBe(1);
    expect(internals(scene).wrongTaps).toBe(1);
  });

  it("bounces a wrong tool and keeps the tape as it was", () => {
    const scene = new FixItMachineScene(mulberry32(1234));
    scene.create();
    const before = [...internals(scene).tape];
    tapWrongCard(scene);
    const wrongIndex = internals(scene).trayActions.findIndex(
      (action) => action !== correctAction(currentRound(scene)),
    );
    expect(wrongIndex).toBeGreaterThanOrEqual(0);

    tapTray(scene, wrongIndex);

    expect(internals(scene).tape).toEqual(before);
    expect(internals(scene).trayOpen).toBe(true);
    expect(internals(scene).wrongTaps).toBe(1);
  });

  it("hints at two, four and six missed taps without placing a card", () => {
    const scene = new FixItMachineScene(mulberry32(1234));
    scene.create();
    const before = [...internals(scene).tape];

    tapInnocentCard(scene);
    expect(internals(scene).hintLevel).toBe(0);

    tapInnocentCard(scene);
    expect(internals(scene).hintLevel).toBe(1);

    tapInnocentCard(scene);
    tapInnocentCard(scene);
    expect(internals(scene).hintLevel).toBe(2);

    tapInnocentCard(scene);
    expect(internals(scene).hintLevel).toBe(2);
    tapInnocentCard(scene);
    expect(internals(scene).hintLevel).toBe(3);

    // Visual help only: the tape is untouched, so the child still does the fix.
    expect(internals(scene).tape).toEqual(before);
    expect(internals(scene).trayOpen).toBe(false);
  });

  it("publishes the round, the tape and every tap point for a journey", () => {
    const scene = new FixItMachineScene(mulberry32(1234));
    scene.create();
    tapWrongCard(scene);

    const state = internals(scene).e2eFixItMachine();

    expect(state.round).toBe(0);
    expect(state.bugIndex).toBe(1);
    expect(state.tape).toHaveLength(3);
    expect(state.solution).toEqual(
      state.tape.map((card, index) => (index === 1 ? state.solution[1] : card)),
    );
    expect(state.solved).toBe(false);
    expect(state.trayOpen).toBe(true);
    expect(state.tray).toHaveLength(3);
    expect(state.tray.map((slot) => slot.action)).toEqual(internals(scene).trayActions);
    expect(state.tray.map((slot) => slot.x)).toEqual([404, 512, 620]);
    expect(state.machine).toEqual({ x: 664, y: 320 });
    expect(state.goal).toEqual({ x: 236, y: 232 });
  });

  it("plays five rounds clean, one after the other, without a miss", () => {
    const scene = new FixItMachineScene(mulberry32(1234));
    scene.create();

    // The sixth solve's completion path awards a sticker by game id, and
    // `GameId` only gains "fix-it-machine" in Phase 4 with the registry row it
    // must mirror, so this suite stops one round short of it.
    for (let round = 0; round < 5; round++) {
      expect(internals(scene).roundIndex).toBe(round);
      solveRound(scene);
    }

    expect(internals(scene).roundIndex).toBe(5);
    expect(internals(scene).completedRounds).toBe(5);
    expect(internals(scene).sessionWrong).toBe(0);
    expect(internals(scene).rounds).toHaveLength(6);
  });
});
