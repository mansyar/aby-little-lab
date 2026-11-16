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

const RULE = "Find the wrong card and fix it.";

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
  sessionProbes: number;
  completedRounds: number;
  machine?: Record<string, MockFn>;
  hintBand?: Record<string, MockFn>;
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
    // Three correct results: naming the bug card, choosing the right tool and
    // finishing the round (spec FR-10).
    expect(internals(scene).sessionCorrect).toBe(3);
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

  it("bounces a card that is not the wrong one and records a look, not a miss", () => {
    const scene = new FixItMachineScene(mulberry32(1234));
    scene.create();

    tapInnocentCard(scene);

    expect(internals(scene).trayOpen).toBe(false);
    expect(mockAudio.playIncorrect).toHaveBeenCalledTimes(1);
    // Searching is not answering: the tap is a probe, and no wrong answer lands.
    expect(internals(scene).sessionProbes).toBe(1);
    expect(internals(scene).sessionWrong).toBe(0);
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

  it("records one result for every tap, and one win for the solve", () => {
    const scene = new FixItMachineScene(mulberry32(1234));
    scene.create();

    tapInnocentCard(scene);
    expect(internals(scene).sessionProbes, "a card that is not the bug is a look").toBe(1);
    expect(internals(scene).sessionWrong, "looking is not a wrong answer").toBe(0);
    expect(internals(scene).sessionCorrect).toBe(0);

    tapWrongCard(scene);
    expect(internals(scene).sessionCorrect, "naming the bug card records one").toBe(1);

    tapRightTool(scene);
    expect(internals(scene).sessionCorrect, "the right tool records one").toBe(2);

    runTape(scene);
    expect(internals(scene).sessionCorrect, "the solve records one more").toBe(3);
    expect(internals(scene).sessionWrong, "a repair adds no miss").toBe(0);
    expect(internals(scene).sessionProbes, "the repair adds no look either").toBe(1);
  });

  it("still scores a distractor tool as a wrong answer", () => {
    const scene = new FixItMachineScene(mulberry32(1234));
    scene.create();
    tapWrongCard(scene);
    const wrongIndex = internals(scene).trayActions.findIndex(
      (action) => action !== correctAction(currentRound(scene)),
    );
    if (wrongIndex < 0) throw new Error("round has no distractor");

    tapTray(scene, wrongIndex);

    // The tray is where the child answers, so a distractor there is a miss.
    expect(internals(scene).sessionWrong).toBe(1);
    expect(internals(scene).sessionProbes).toBe(0);
  });

  it("draws the divergence band and the machine's arm at two missed taps", () => {
    const scene = new FixItMachineScene(mulberry32(1234));
    scene.create();
    const bug = currentRound(scene).bugIndex;

    tapInnocentCard(scene);
    const before = getMockFn(addOf(scene).graphics).mock.results.length;

    tapInnocentCard(scene);
    const created = getMockFn(addOf(scene).graphics).mock.results.slice(before) as Array<{
      value: Record<string, MockFn>;
    }>;
    const band = created.find((entry) => getMockFn(entry.value.strokePath).mock.calls.length > 0);
    expect(band, "level 1 draws a band graphics").toBeDefined();
    if (!band) throw new Error("no band");

    // The band starts at card 0 and reaches the bug card, with 14px padding.
    const first = 512 + (0 - 2) * 108;
    const last = 512 + (bug - 2) * 108;
    expect(getMockFn(band.value.fillRoundedRect).mock.calls[0][0]).toBe(first - 48 - 14);
    expect(getMockFn(band.value.fillRoundedRect).mock.calls[0][2]).toBe(last - first + 96 + 28);
    expect(
      getMockFn(band.value.fillCircle).mock.calls.length,
      "the arm ends in a head at the band's end",
    ).toBe(1);

    // A correct diagnosis is not helped any more: the band goes with it.
    tapWrongCard(scene);
    tapRightTool(scene);
    expect(internals(scene).hintBand, "a repair clears the band").toBeUndefined();
  });

  it("lifts the wrong card at four missed taps", () => {
    const scene = new FixItMachineScene(mulberry32(1234));
    scene.create();
    const bug = currentRound(scene).bugIndex;

    for (let tap = 0; tap < 3; tap++) tapInnocentCard(scene);
    const liftedBefore = getMockFn(internals(scene).tweens.add).mock.calls.filter(
      (call) => (call[0] as { targets?: unknown }).targets === internals(scene).cardRects[bug],
    ).length;

    tapInnocentCard(scene);
    const lifts = getMockFn(internals(scene).tweens.add)
      .mock.calls.filter(
        (call) => (call[0] as { targets?: unknown }).targets === internals(scene).cardRects[bug],
      )
      .map((call) => call[0] as { y?: number });
    expect(lifts.length, "level 2 lifts the card and pulses it").toBe(liftedBefore + 2);
    expect(
      lifts.map((lift) => lift.y).filter((y) => typeof y === "number"),
      "the bug card rises out of the tape",
    ).toEqual([552 - 18]);
  });

  it("pulses the right tool in the open tray at six missed taps", () => {
    const scene = new FixItMachineScene(mulberry32(1234));
    scene.create();
    tapWrongCard(scene);
    const correctIndex = internals(scene).trayActions.indexOf(correctAction(currentRound(scene)));
    const wrongIndex = internals(scene).trayActions.findIndex(
      (action) => action !== correctAction(currentRound(scene)),
    );
    if (wrongIndex < 0 || correctIndex < 0) throw new Error("round has no wrong tool");

    const pulsesOf = (target: unknown) =>
      getMockFn(internals(scene).tweens.add).mock.calls.filter(
        (call) => (call[0] as { targets?: unknown }).targets === target,
      ).length;

    for (let tap = 0; tap < 5; tap++) tapTray(scene, wrongIndex);
    const before = pulsesOf(internals(scene).trayRects[correctIndex]);

    tapTray(scene, wrongIndex);
    expect(internals(scene).hintLevel).toBe(3);
    expect(
      pulsesOf(internals(scene).trayRects[correctIndex]),
      "the tool that belongs pulses once",
    ).toBe(before + 1);
    expect(internals(scene).tape).toEqual(currentRound(scene).tape);
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
