import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GameId } from "../../types";
import { type MatchMediaStub, stubMatchMedia } from "../helpers/matchMediaStub";
import type { MockObject } from "../helpers/phaserMock";
import { expectPressFeedbackContract, type MockGameObject } from "../helpers/pressFeedback";

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

/** Spy on the completion record so the game id and counters are assertable. */
const { mockRecordGameResult } = vi.hoisted(() => ({
  mockRecordGameResult: vi.fn(),
}));

vi.mock("../../utils/storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../utils/storage")>();
  return { ...actual, recordGameResult: mockRecordGameResult };
});

import { ChoiceRoundScene } from "../../scenes/ChoiceRoundScene";

/**
 * Minimal concrete choice scene: two choice cards per round and no game
 * extras, so the base's default hook implementations are the ones under test.
 */
class TestChoiceScene extends ChoiceRoundScene {
  /** Round-lifecycle callback order, proving teardown precedes the next build. */
  readonly lifecycle: string[] = [];
  /** Rounds in the playthrough (kept small so completion is quick to reach). */
  rounds = 2;
  /** Index treated as the round's correct answer. */
  correctAnswer = 0;

  constructor() {
    super("TestChoice");
  }

  /** Creates the mascot and dots, then renders round 0 as a real `create()` does. */
  start(): void {
    this.createCornerMascot();
    this.createProgressDots(this.rounds);
    this.renderRound();
  }

  /** The current round's choice cards, in option order. */
  get currentCards(): MockObject[] {
    return [...this.choiceTargets] as unknown as MockObject[];
  }

  /** The progress dots created for this playthrough. */
  get dots(): MockObject[] {
    return [...this.progressDots] as unknown as MockObject[];
  }

  /** Whether input is locked (e.g. after completion). */
  get isLocked(): boolean {
    return this.inputLocked;
  }

  /** The index of the round being played. */
  get currentRoundIndex(): number {
    return this.roundIndex;
  }

  /** Fires the card's gameplay pointerdown handler the way Phaser would. */
  tap(index: number): void {
    const handler = this.currentCards[index]?.allHandlers.find(
      (entry) => entry.name === "pointerdown",
    );
    handler?.cb();
  }

  protected buildRoundContent(): void {
    this.lifecycle.push("build");
    this.createChoiceTarget(300, 400, 170, 0);
    this.createChoiceTarget(524, 400, 170, 1);
  }

  protected clearRoundContent(): void {
    this.lifecycle.push("teardown");
  }

  protected isChoiceCorrect(index: number): boolean {
    return index === this.correctAnswer;
  }

  protected totalRounds(): number {
    return this.rounds;
  }

  protected gameId(): GameId {
    return "take-away";
  }
}

/**
 * Choice scene contributing the optional per-game extras the contract offers:
 * extra objects that move with a wrong choice, and tap callbacks.
 */
class ExtrasChoiceScene extends TestChoiceScene {
  /** Order of the per-game extras, so "after the shared feedback" is checkable. */
  readonly extrasLog: string[] = [];
  /** Objects dragged into the wrong-answer wiggle. */
  extras: Phaser.GameObjects.GameObject[] = [];

  protected wiggleTargets(index: number): Phaser.GameObjects.GameObject[] {
    this.extrasLog.push(`targets:${index}`);
    return this.extras;
  }

  protected onCorrect(index: number): void {
    this.extrasLog.push(`correct:${index}`);
  }

  protected onWrong(index: number): void {
    this.extrasLog.push(`wrong:${index}`);
  }
}

/** One captured tween configuration from the mocked tween manager. */
interface TweenConfig {
  targets?: unknown;
  angle?: number | { from?: number; to?: number };
  duration?: unknown;
  yoyo?: unknown;
  repeat?: unknown;
  ease?: unknown;
}

/** Casts a Phaser-typed method to a MockFn for mock assertions. */
function getMockFn(fn: unknown): MockFn {
  return fn as unknown as MockFn;
}

/** Every tween configuration the scene's tween manager was asked to create. */
function tweenConfigs(scene: TestChoiceScene): TweenConfig[] {
  return getMockFn(scene.tweens.add).mock.calls.map((call) => call[0] as unknown as TweenConfig);
}

/** Finds the wrong-answer wiggle: the tween whose target array holds `card`. */
function findWiggle(scene: TestChoiceScene, card: MockObject): TweenConfig | undefined {
  return tweenConfigs(scene).find((config) => {
    const targets = config.targets;
    return Array.isArray(targets) && targets.includes(card);
  });
}

/** Finds the mascot's nod: a single-target tilt to 6 degrees. */
function findNod(scene: TestChoiceScene, mascot: MockObject): TweenConfig | undefined {
  return tweenConfigs(scene).find((config) => {
    if (config.targets !== mascot) return false;
    return typeof config.angle === "object" && config.angle.to === 6;
  });
}

/** Returns the delayed-call handlers scheduled for `ms`. */
function delaysOf(scene: TestChoiceScene, ms: number): Array<() => void> {
  return getMockFn(scene.time.delayedCall)
    .mock.calls.filter((call) => call[0] === ms)
    .map((call) => call[1] as () => void);
}

/** Fires the first delayed call scheduled for `ms` (e.g. the 700ms advance). */
function fireDelay(scene: TestChoiceScene, ms: number): void {
  const [handler] = delaysOf(scene, ms);
  expect(handler).toBeDefined();
  handler?.();
}

/** Returns the mascot image object (created with the mascot_idle texture). */
function getMascotImage(scene: TestChoiceScene): MockObject {
  const imageMock = getMockFn(scene.add.image);
  const index = imageMock.mock.calls.findIndex((call) => call[2] === "mascot_idle");
  return imageMock.mock.results[index].value as MockObject;
}

describe("ChoiceRoundScene round lifecycle", () => {
  let matchMediaMock: MatchMediaStub;

  beforeEach(() => {
    matchMediaMock = stubMatchMedia(false);
    localStorage.clear();
    mockRecordGameResult.mockClear();
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

  it("builds a round, then tears it down before building the next one", () => {
    const scene = new TestChoiceScene();
    scene.start();
    const firstRoundCards = scene.currentCards;
    expect(firstRoundCards).toHaveLength(2);
    // The initial render tears down an empty round, so a relaunch never stacks
    // a second set of cards on top of the first.
    expect(scene.lifecycle).toEqual(["teardown", "build"]);
    const rendered = scene.lifecycle.length;

    scene.tap(0);
    fireDelay(scene, 700);

    expect(scene.lifecycle.slice(rendered)).toEqual(["teardown", "build"]);
    expect(scene.currentRoundIndex).toBe(1);
    for (const card of firstRoundCards) {
      expect(getMockFn(card.destroy)).toHaveBeenCalled();
    }
    expect(scene.currentCards).toHaveLength(2);
  });

  it("creates choice cards with a 96px hit area and the gameplay handler first", () => {
    const scene = new TestChoiceScene();
    scene.start();
    const card = scene.currentCards[0];

    const options = getMockFn(card.setInteractive).mock.calls[0]?.[0] as {
      hitArea: { width: number; height: number };
    };
    expect(options.hitArea.width).toBeGreaterThanOrEqual(96);
    expect(options.hitArea.height).toBeGreaterThanOrEqual(96);

    // The gameplay handler is registered before the press squish, so the tap
    // is read before the card starts shrinking.
    const [firstHandler] = card.allHandlers;
    expect(firstHandler?.name).toBe("pointerdown");
    firstHandler?.cb();
    expect(mockAudio.playCorrect).toHaveBeenCalledTimes(1);
    expect(getMockFn(card.setScale)).not.toHaveBeenCalledWith(0.95);
  });

  it("attaches the shared press feedback to every choice card", () => {
    const scene = new TestChoiceScene();
    scene.start();
    // Card 1 is wrong, so firing every handler cannot advance the round.
    expectPressFeedbackContract(scene.currentCards[1] as unknown as MockGameObject);
  });

  it("advances once per correct tap while input is locked", () => {
    const scene = new TestChoiceScene();
    scene.start();

    scene.tap(0);
    scene.tap(0);

    expect(mockAudio.playCorrect).toHaveBeenCalledTimes(1);
    expect(getMockFn(scene.dots[0].setAlpha)).toHaveBeenCalledWith(1);
    expect(getMockFn(scene.dots[1].setAlpha)).not.toHaveBeenCalledWith(1);
    expect(scene.currentRoundIndex).toBe(0);
    expect(delaysOf(scene, 700)).toHaveLength(1);

    fireDelay(scene, 700);
    expect(scene.currentRoundIndex).toBe(1);
  });

  it("completes the game after the final round", () => {
    const scene = new TestChoiceScene();
    scene.start();

    for (let i = 0; i < scene.rounds; i++) {
      scene.tap(0);
      fireDelay(scene, 700);
    }

    expect(scene.currentRoundIndex).toBe(scene.rounds);
    expect(mockAudio.playWin).toHaveBeenCalledTimes(1);
    expect(scene.isLocked).toBe(true);
    expect(mockRecordGameResult).toHaveBeenCalledTimes(1);
    expect(mockRecordGameResult).toHaveBeenCalledWith("take-away", 2, 0);
  });

  it("reverts the success flash to the card colour", () => {
    const scene = new TestChoiceScene();
    scene.start();
    const card = scene.currentCards[0];

    scene.tap(0);
    fireDelay(scene, 250);

    expect(getMockFn(card.setFillStyle)).toHaveBeenLastCalledWith(0xffffff, 1);
  });

  it("reverts the success flash unless the card was destroyed first", () => {
    const scene = new TestChoiceScene();
    scene.start();
    const card = scene.currentCards[0];

    scene.tap(0);
    expect(getMockFn(card.setFillStyle)).toHaveBeenCalledWith(0x68d391, 1);

    (card as unknown as { isDestroyed: boolean }).isDestroyed = true;
    fireDelay(scene, 250);

    expect(getMockFn(card.setFillStyle)).toHaveBeenCalledTimes(1);
  });

  it("answers a wrong tap with the soft tone, a nod, and a gentle wiggle", () => {
    const scene = new TestChoiceScene();
    scene.start();
    const card = scene.currentCards[1];

    scene.tap(1);

    expect(mockAudio.playIncorrect).toHaveBeenCalledTimes(1);
    expect(mockAudio.playCorrect).not.toHaveBeenCalled();
    expect(scene.currentRoundIndex).toBe(0);
    expect(scene.isLocked).toBe(false);
    expect(getMockFn(card.setFillStyle)).not.toHaveBeenCalledWith(0x68d391, 1);
    expect(getMockFn(scene.dots[0].setAlpha)).not.toHaveBeenCalledWith(1);

    expect(findNod(scene, getMascotImage(scene))).toBeDefined();

    const wiggle = findWiggle(scene, card);
    expect(wiggle?.angle).toBe(4);
    expect(wiggle?.duration).toBe(350);
    expect(wiggle?.yoyo).toBe(true);
    expect(wiggle?.repeat).toBe(3);
    expect(wiggle?.ease).toBe("Sine.inOut");
  });

  it("uses the reduced-motion wiggle amplitude and duration", () => {
    setReducedMotion(true);
    const scene = new TestChoiceScene();
    scene.start();
    const card = scene.currentCards[1];

    scene.tap(1);

    const wiggle = findWiggle(scene, card);
    expect(wiggle?.angle).toBe(2);
    expect(wiggle?.duration).toBe(200);
  });

  it("moves the subclass's extra targets with the wrong card", () => {
    const scene = new ExtrasChoiceScene();
    scene.start();
    const extra = scene.add.image(0, 0, "extra_target") as unknown as Phaser.GameObjects.GameObject;
    scene.extras = [extra];
    const card = scene.currentCards[1];

    scene.tap(1);

    expect(scene.extrasLog).toContain("targets:1");
    expect(scene.extrasLog).toContain("wrong:1");
    const wiggle = findWiggle(scene, card);
    expect(wiggle?.targets).toContain(extra);
  });

  it("runs the per-game correct extras after the shared feedback", () => {
    const scene = new ExtrasChoiceScene();
    scene.start();

    scene.tap(0);

    expect(scene.extrasLog).toContain("correct:0");
    expect(mockAudio.playCorrect).toHaveBeenCalledTimes(1);
  });
});
