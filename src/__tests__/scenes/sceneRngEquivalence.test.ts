import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stubMatchMedia } from "../helpers/matchMediaStub";

/**
 * AC-3 equivalence proof: a scene constructed with a seeded generator must
 * produce exactly the output a direct call to the same builders produces with
 * the same seed, replaying the draws in the scene's order through ONE shared
 * rng instance. A "same seed twice" test would pass even with an argument in
 * the wrong slot; comparing against a direct builder call is what pins the
 * argument position of every multi-draw call site (and, via Add It Up / Take
 * Away, the Phase 1 GroupMathScene forwarding — AC-4).
 */

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

/**
 * The fixed band shift both sides of every comparison see. The storage module
 * stays real so `getSettings` and the tap recording keep their localStorage
 * behavior; only the shift facade is pinned.
 */
const { getAdaptiveBandShiftMock } = vi.hoisted(() => ({
  getAdaptiveBandShiftMock: vi.fn((_gameId: string): -1 | 0 | 1 => 0),
}));

vi.mock("../../utils/storage", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  getAdaptiveBandShift: (gameId: string) => getAdaptiveBandShiftMock(gameId),
}));

import * as addItUpLogic from "../../game/addItUpLogic";
import { generatePathPoints, selectThreePairs, waypointsFor } from "../../game/animalTraceLogic";
import { generateRound, scaleFactorsFor } from "../../game/bigSmallLogic";
import { appendNote, generateSequence, startLengthFor } from "../../game/musicalMemoryLogic";
import {
  type BubbleConfig,
  generateInitialBubbles,
  generateSpawnConfig,
  type SleepingBounds,
  selectBubbleType,
  sleepingBoundsFor,
} from "../../game/popFreezeLogic";
import * as storyOrderLogic from "../../game/storyOrderLogic";
import * as takeAwayLogic from "../../game/takeAwayLogic";
import { generateLetterTiles, generateWordBuildPlaythrough } from "../../game/wordLogic";
import { AddItUpScene } from "../../scenes/AddItUpScene";
import { AnimalTraceScene } from "../../scenes/AnimalTraceScene";
import { BigSmallScene } from "../../scenes/BigSmallScene";
import { MusicalMemoryScene } from "../../scenes/MusicalMemoryScene";
import { PopFreezeScene } from "../../scenes/PopFreezeScene";
import { StoryOrderScene } from "../../scenes/StoryOrderScene";
import { TakeAwayScene } from "../../scenes/TakeAwayScene";
import { WordBuilderScene } from "../../scenes/WordBuilderScene";
import { mulberry32 } from "../helpers/randomHelper";

/** The shared seed every scene and every direct replay in this file draws from. */
const SEED = 2026;

/** The band shift `getAdaptiveBandShiftMock` reports to every scene. */
const SHIFT: -1 | 0 | 1 = 0;

/**
 * Mirrors `AnimalTraceScene`'s private layout constants. They are module-local
 * in the scene (not exported), so the replay restates them; a mismatch here
 * would show up as a path-points inequality, not a silent pass.
 */
const ANIMAL_X = 200;
const SPRITE_Y = 384;
const FOOD_X = 824;

/** Mirrors `PopFreezeScene`'s private bubble display size. */
const BUBBLE_DISPLAY_SIZE = 96;

/** The phaserMock reports this scale to every scene (`scale.width/height`). */
const MOCK_SCALE_WIDTH = 1024;
const MOCK_SCALE_HEIGHT = 768;

/** Mirrors `WordBuilderScene`'s private playthrough length. */
const WORD_COUNT = 3;

describe("scene rng equivalence — seeded scene output equals a direct builder replay (AC-3/AC-4)", () => {
  beforeEach(() => {
    stubMatchMedia(false);
    localStorage.clear();
    mockParentLockInstances.length = 0;
    for (const fn of Object.values(mockAudio)) {
      fn.mockClear();
    }
    getAdaptiveBandShiftMock.mockReturnValue(SHIFT);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("Animal Trace: pairs and first path points equal selectThreePairs → generatePathPoints", () => {
    const scene = new AnimalTraceScene(mulberry32(SEED));
    scene.create();

    const s = scene as unknown as {
      pairs: Array<{ animal: string; food: string }>;
      currentPair?: { pathPoints: Array<{ x: number; y: number }> };
    };

    // Replay in the scene's draw order: create() calls selectThreePairs, then
    // renderPair(0) calls generatePathPoints — both through this.rng.
    const rng = mulberry32(SEED);
    const pairs = selectThreePairs(rng);
    const pathPoints = generatePathPoints(
      ANIMAL_X,
      SPRITE_Y,
      FOOD_X,
      SPRITE_Y,
      waypointsFor(SHIFT),
      rng,
    );

    expect(s.pairs).toEqual(pairs);
    expect(s.currentPair?.pathPoints).toEqual(pathPoints);
  });

  it("Big & Small: round equals scaleFactorsFor → generateRound(factors, rng)", () => {
    const scene = new BigSmallScene(mulberry32(SEED));
    scene.create();

    const s = scene as unknown as {
      factors: ReturnType<typeof scaleFactorsFor>;
      round: ReturnType<typeof generateRound>;
    };

    const rng = mulberry32(SEED);
    const factors = scaleFactorsFor(SHIFT);
    const round = generateRound(factors, rng);

    expect(s.factors).toEqual(factors);
    expect(s.round).toEqual(round);
  });

  it("Musical Memory: initial sequence and one driven appendNote equal the direct replay", () => {
    const scene = new MusicalMemoryScene(mulberry32(SEED));
    scene.create();

    const s = scene as unknown as { sequence: number[] };

    const rng = mulberry32(SEED);
    let sequence = generateSequence(startLengthFor(SHIFT), rng);
    expect(s.sequence).toEqual(sequence);

    // Drive one round success through the scene: handleRoundSuccess grows the
    // sequence via appendNote(this.sequence, this.rng) — the second call site.
    (scene as unknown as { handleRoundSuccess(): void }).handleRoundSuccess();
    sequence = appendNote(sequence, rng);
    expect(s.sequence).toEqual(sequence);
  });

  it("Pop & Freeze: initial bubbles and one driven respawn equal the direct replay", () => {
    const scene = new PopFreezeScene(mulberry32(SEED));
    scene.create();

    const s = scene as unknown as {
      bubbles: Array<{ config: BubbleConfig }>;
      sleepBounds: SleepingBounds;
    };

    const rng = mulberry32(SEED);
    const bounds = sleepingBoundsFor(SHIFT);
    const initial = generateInitialBubbles(
      MOCK_SCALE_WIDTH,
      MOCK_SCALE_HEIGHT,
      BUBBLE_DISPLAY_SIZE,
      bounds,
      rng,
    );
    expect(s.bubbles.map((bubble) => bubble.config)).toEqual(initial);

    // Drive one pop through the scene: handlePop respawns via
    // selectBubbleType(sleepingCount, bounds, rng) then generateSpawnConfig(..., rng).
    const poppable = s.bubbles.find((bubble) => bubble.config.type === "poppable");
    if (!poppable) {
      throw new Error("expected at least one poppable bubble in the initial set");
    }
    (scene as unknown as { handleTap(data: unknown): void }).handleTap(poppable);

    const sleepingCount = s.bubbles.filter((bubble) => bubble.config.type === "sleeping").length;
    const type = selectBubbleType(sleepingCount, bounds, rng);
    const respawned = generateSpawnConfig(
      MOCK_SCALE_WIDTH,
      MOCK_SCALE_HEIGHT,
      BUBBLE_DISPLAY_SIZE,
      type,
      rng,
    );
    // spawnBubble pushes the replacement, so the respawned config is the last entry.
    expect(s.bubbles[s.bubbles.length - 1].config).toEqual(respawned);
  });

  it("Build the Word: words and first round's tiles equal the chained direct replay", () => {
    const scene = new WordBuilderScene(mulberry32(SEED));
    scene.create();

    const s = scene as unknown as {
      words: Array<{ word: string }>;
      tileLetterValues: string[];
    };

    // One shared instance: create() draws the playthrough, then renderRound(0)
    // draws the first round's tiles from the same generator.
    const rng = mulberry32(SEED);
    const words = generateWordBuildPlaythrough(WORD_COUNT, SHIFT, rng);
    const tiles = generateLetterTiles(words[0].word, rng);

    expect(s.words).toEqual(words);
    expect(s.tileLetterValues).toEqual(tiles);
  });

  it("Story Order: rounds equal buildPlaythrough(rng, shift) with rng FIRST (AC-3 centerpiece)", () => {
    const scene = new StoryOrderScene(mulberry32(SEED));
    scene.create();

    const s = scene as unknown as {
      rounds: ReturnType<typeof storyOrderLogic.buildPlaythrough>;
    };

    // rng stays the FIRST argument — storyOrderLogic is rng-first on purpose
    // (scene-call compatibility). This is the only case that fails if someone
    // later "normalizes" the argument order.
    const rng = mulberry32(SEED);
    const rounds = storyOrderLogic.buildPlaythrough(rng, SHIFT);

    expect(s.rounds).toEqual(rounds);
  });

  it("Add It Up: rounds equal addItUpLogic.buildPlaythrough(shift, rng) (AC-4, Phase 1 forwarding)", () => {
    const scene = new AddItUpScene(mulberry32(SEED));
    scene.create();

    const s = scene as unknown as {
      rounds: ReturnType<typeof addItUpLogic.buildPlaythrough>;
    };

    const rng = mulberry32(SEED);
    const rounds = addItUpLogic.buildPlaythrough(SHIFT, rng);

    expect(s.rounds).toEqual(rounds);
  });

  it("Take Away: rounds equal takeAwayLogic.buildPlaythrough(shift, rng) (AC-4, Phase 1 forwarding)", () => {
    const scene = new TakeAwayScene(mulberry32(SEED));
    scene.create();

    const s = scene as unknown as {
      rounds: ReturnType<typeof takeAwayLogic.buildPlaythrough>;
    };

    const rng = mulberry32(SEED);
    const rounds = takeAwayLogic.buildPlaythrough(SHIFT, rng);

    expect(s.rounds).toEqual(rounds);
  });
});
