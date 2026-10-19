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

/** Mock the TTS wrapper so tests can verify rule/scenario speech without voices. */
const { mockSpeech } = vi.hoisted(() => ({
  mockSpeech: {
    speakSentence: vi.fn(() => true),
    isSpeechSupported: vi.fn(() => true),
    onSpeechLifecycle: vi.fn(() => vi.fn()),
  },
}));

vi.mock("../../utils/speech", () => mockSpeech);

import { buildRoundChoices, ROUND_COUNT, type Scenario } from "../../game/feelingsFacesLogic";
import { isMastered } from "../../game/progressLogic";
import { FeelingsFacesScene } from "../../scenes/FeelingsFacesScene";
import type { GameProgress } from "../../types";
import { earnSticker, getProgress, updateSettings } from "../../utils/storage";

/** The rule line the scene must show and speak. */
const RULE_LINE = "Tap the face that shows how Aby feels.";

/** Y position of the written scenario caption. */
const CAPTION_Y = 250;

/** Delay before the opening round's scenario is spoken (after the rule). */
const OPENING_SPEECH_DELAY = 2600;

/** Delay before the round advances after a correct tap. */
const NEXT_ROUND_DELAY = 700;

/** Auto-return delay after the win celebration. */
const AUTO_RETURN_DELAY = 3000;

/** Dimmed speaker tint and alpha used when speech is unavailable. */
const MUTED_TINT = 0xa0aec0;
const MUTED_ALPHA = 0.6;

/** Casts a Phaser-typed method to a MockFn for mock assertions. */
function getMockFn(fn: unknown): MockFn {
  return fn as unknown as MockFn;
}

interface SceneInternals {
  rounds: Scenario[];
  roundIndex: number;
  choices: string[];
  inputLocked: boolean;
  taps: number;
  add: Record<string, unknown>;
  time: { delayedCall: unknown };
  tweens: { add: unknown };
  cameras: { main: Record<string, unknown> };
  scene: Record<string, MockFn>;
}

function internals(scene: unknown): SceneInternals {
  return scene as SceneInternals;
}

/** Returns the active (not-yet-destroyed) face card rectangles. */
function getCards(scene: unknown): Array<Record<string, MockFn>> {
  const rectangleMock = getMockFn(internals(scene).add.rectangle);
  return rectangleMock.mock.results
    .map((result) => result.value as Record<string, MockFn>)
    .filter((card) => getMockFn(card.destroy).mock.calls.length === 0);
}

/** Returns the active face images (texture keys starting "face_"). */
function getFaces(scene: unknown): Array<{ obj: Record<string, MockFn>; key: string }> {
  const imageMock = getMockFn(internals(scene).add.image);
  const faces: Array<{ obj: Record<string, MockFn>; key: string }> = [];
  for (let i = 0; i < imageMock.mock.calls.length; i++) {
    const key = imageMock.mock.calls[i][2];
    if (typeof key !== "string" || !key.startsWith("face_")) continue;
    const obj = imageMock.mock.results[i].value as Record<string, MockFn>;
    if (getMockFn(obj.destroy).mock.calls.length > 0) continue;
    faces.push({ obj, key });
  }
  return faces;
}

/** Returns the live text object whose content matches `content`, if any. */
function findText(scene: unknown, content: string): Record<string, MockFn> | undefined {
  const textMock = getMockFn(internals(scene).add.text);
  for (let i = 0; i < textMock.mock.calls.length; i++) {
    const call = textMock.mock.calls[i] as unknown[];
    const obj = textMock.mock.results[i].value as Record<string, MockFn>;
    if (call[2] === content && getMockFn(obj.destroy).mock.calls.length === 0) return obj;
  }
  return undefined;
}

/** Returns the live scenario caption (created at CAPTION_Y), if any. */
function getCaption(scene: unknown): Record<string, MockFn> | undefined {
  const textMock = getMockFn(internals(scene).add.text);
  for (let i = 0; i < textMock.mock.calls.length; i++) {
    const call = textMock.mock.calls[i] as unknown[];
    const obj = textMock.mock.results[i].value as Record<string, MockFn>;
    if (call[1] !== CAPTION_Y) continue;
    if (getMockFn(obj.destroy).mock.calls.length > 0) continue;
    return obj;
  }
  return undefined;
}

/** Returns the live speaker glyph image. */
function getSpeakerGlyph(scene: unknown): Record<string, MockFn> {
  const imageMock = getMockFn(internals(scene).add.image);
  for (let i = imageMock.mock.calls.length - 1; i >= 0; i--) {
    if (imageMock.mock.calls[i][2] !== "icon_speaker") continue;
    const obj = imageMock.mock.results[i].value as Record<string, MockFn>;
    if (getMockFn(obj.destroy).mock.calls.length > 0) continue;
    return obj;
  }
  throw new Error("speaker glyph not created");
}

/** One `tweens.add` spec, narrowed to the fields the assertions read. */
interface TweenSpec {
  targets?: unknown;
  angle?: number;
  yoyo?: boolean;
  duration?: number;
  scaleX?: number;
  scaleY?: number;
  alpha?: number;
}

/** Returns the first tween spec matching `predicate`; throws when none matches. */
function firstTweenArgument(scene: unknown, predicate: (spec: TweenSpec) => boolean): TweenSpec {
  for (const call of getMockFn(internals(scene).tweens.add).mock.calls) {
    const spec = call[0] as TweenSpec | undefined;
    if (spec && predicate(spec)) return spec;
  }
  throw new Error("no matching tween");
}

/** Returns the scene's 6 progress dots in creation order. */
function getProgressDots(scene: unknown): Array<Record<string, MockFn>> {
  const circleMock = getMockFn(internals(scene).add.circle);
  return circleMock.mock.results.map((result) => result.value as Record<string, MockFn>);
}

/** Returns the current round's scenario. */
function getCurrentRound(scene: unknown): Scenario {
  const s = internals(scene);
  const round = s.rounds[s.roundIndex];
  if (!round) throw new Error(`no round at index ${s.roundIndex}`);
  return round;
}

/** Returns the card index that matches the current round's emotion. */
function targetCardIndex(scene: unknown): number {
  const s = internals(scene);
  const index = s.choices.indexOf(getCurrentRound(scene).emotion);
  if (index < 0) throw new Error("target emotion missing from the cards");
  return index;
}

/** Taps a face card by triggering its pointerdown callback. */
function tapCard(scene: unknown, cardIndex: number): void {
  const card = getCards(scene)[cardIndex];
  if (!card) throw new Error(`Card ${cardIndex} not found`);
  const pointerdown = getMockFn(card.on).mock.calls.find((call) => call[0] === "pointerdown");
  if (pointerdown && typeof pointerdown[1] === "function") {
    (pointerdown[1] as () => void)();
  }
}

/** Fires the most recent next-round delay so the playthrough advances. */
function fireNextRoundDelay(scene: unknown): void {
  const delayedCall = getMockFn(internals(scene).time.delayedCall);
  const calls = delayedCall.mock.calls.filter((call) => call[0] === NEXT_ROUND_DELAY);
  const latest = calls.at(-1);
  if (!latest || typeof latest[1] !== "function") throw new Error("no next-round delay scheduled");
  (latest[1] as () => void)();
}

/** Fires the round-1 opening speech timer. */
function fireOpeningSpeech(scene: unknown): void {
  const delayedCall = getMockFn(internals(scene).time.delayedCall);
  const call = delayedCall.mock.calls.find((entry) => entry[0] === OPENING_SPEECH_DELAY);
  if (!call || typeof call[1] !== "function") throw new Error("no opening speech delay scheduled");
  (call[1] as () => void)();
}

/** Taps the matching card and advances to the next round. */
function completeRound(scene: unknown): void {
  tapCard(scene, targetCardIndex(scene));
  fireNextRoundDelay(scene);
}

/** Plays a full six-round playthrough, leaving the scene on the celebration. */
function playThrough(scene: FeelingsFacesScene): void {
  scene.create();
  for (let round = 0; round < ROUND_COUNT; round++) {
    completeRound(scene);
  }
}

/** Fires the auto-return delay and the fade-out completion callback. */
function fireAutoReturn(scene: unknown): void {
  const delayedCall = getMockFn(internals(scene).time.delayedCall);
  const autoReturn = delayedCall.mock.calls.find((call) => call[0] === AUTO_RETURN_DELAY);
  if (!autoReturn || typeof autoReturn[1] !== "function") {
    throw new Error("no auto-return delay scheduled");
  }
  (autoReturn[1] as () => void)();
  const fadeOut = getMockFn(internals(scene).cameras.main.fadeOut);
  const fadeOutCall = fadeOut.mock.calls.at(-1);
  if (fadeOutCall && typeof fadeOutCall[4] === "function") {
    (fadeOutCall[4] as () => void)();
  }
}

/** A stand-in installed voice so the default path is the spoken one. */
const TEST_VOICE = { voiceURI: "test-voice", lang: "en-US", name: "Test" };

describe("FeelingsFacesScene round flow", () => {
  let matchMediaMock: MatchMediaStub;

  beforeEach(() => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    matchMediaMock = stubMatchMedia(false);
    // happy-dom ships no speech engine; install one voice so the scene takes the
    // spoken path by default. Individual tests stub it away again.
    vi.stubGlobal("speechSynthesis", { getVoices: () => [TEST_VOICE] });
    localStorage.clear();
    mockParentLockInstances.length = 0;
    mockSpeech.speakSentence.mockClear();
    mockSpeech.isSpeechSupported.mockClear();
    mockSpeech.isSpeechSupported.mockReturnValue(true);
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

  it("renders the rule line, its replay glyph, three face cards and six progress dots", () => {
    const scene = new FeelingsFacesScene();
    scene.create();

    expect(findText(scene, RULE_LINE)).toBeDefined();
    expect(getSpeakerGlyph(scene)).toBeDefined();

    const cards = getCards(scene);
    expect(cards).toHaveLength(3);
    for (const card of cards) {
      expect(getMockFn(card.setInteractive)).toHaveBeenCalled();
      expect(getMockFn(card.setStrokeStyle)).toHaveBeenCalled();
    }

    expect(getFaces(scene)).toHaveLength(3);
    expect(getProgressDots(scene)).toHaveLength(ROUND_COUNT);
  });

  it("shows the ladder's three distinct faces, including the scenario's emotion", () => {
    const scene = new FeelingsFacesScene();
    scene.create();

    const round = getCurrentRound(scene);
    const expected = buildRoundChoices(0, round.emotion);
    const textures = getFaces(scene).map((face) => face.key);

    expect(new Set(textures).size).toBe(3);
    expect(textures).toEqual(expected.map((emotion) => `face_${emotion}`));
    expect(internals(scene).choices).toEqual(expected);
  });

  it("every card is a >=64px touch target", () => {
    const scene = new FeelingsFacesScene();
    scene.create();

    const rectangleCalls = getMockFn(internals(scene).add.rectangle).mock.calls;
    const cardCalls = rectangleCalls.filter((call) => typeof call[2] === "number");
    expect(cardCalls.length).toBeGreaterThanOrEqual(3);
    for (const call of cardCalls) {
      expect(call[2] as number).toBeGreaterThanOrEqual(64);
      expect(call[3] as number).toBeGreaterThanOrEqual(64);
    }
  });

  it("speaks the rule once at round setup and the opening scenario after it", () => {
    const scene = new FeelingsFacesScene();
    scene.create();

    expect(mockSpeech.speakSentence).toHaveBeenCalledTimes(1);
    expect(mockSpeech.speakSentence).toHaveBeenCalledWith(RULE_LINE, true);

    fireOpeningSpeech(scene);

    expect(mockSpeech.speakSentence).toHaveBeenCalledTimes(2);
    expect(mockSpeech.speakSentence).toHaveBeenLastCalledWith(getCurrentRound(scene).text, true);
  });

  it("re-speaks the rule when the speaker glyph is tapped", () => {
    const scene = new FeelingsFacesScene();
    scene.create();
    mockSpeech.speakSentence.mockClear();

    const glyph = getSpeakerGlyph(scene);
    const pointerdown = getMockFn(glyph.on).mock.calls.find((call) => call[0] === "pointerdown");
    expect(pointerdown).toBeDefined();
    if (pointerdown && typeof pointerdown[1] === "function") {
      (pointerdown[1] as () => void)();
    }

    expect(mockSpeech.speakSentence).toHaveBeenCalledWith(RULE_LINE, true);
  });

  it("a correct tap plays the chime, splashes, fills the dot and advances", () => {
    const scene = new FeelingsFacesScene();
    scene.create();
    const dots = getProgressDots(scene);

    tapCard(scene, targetCardIndex(scene));

    expect(mockAudio.playCorrect).toHaveBeenCalledTimes(1);
    expect(mockAudio.playIncorrect).not.toHaveBeenCalled();
    expect(internals(scene).inputLocked).toBe(true);
    expect(getMockFn(dots[0].setAlpha)).toHaveBeenCalledWith(1);
    expect(getMockFn(dots[1].setAlpha)).not.toHaveBeenCalledWith(1);

    // The splash ray burst grows and fades from the tapped card.
    const splashes = getMockFn(internals(scene).tweens.add).mock.calls.filter(
      (call) => call[0]?.scaleX === 1.2 && call[0]?.alpha === 0,
    );
    expect(splashes.length).toBeGreaterThanOrEqual(1);

    fireNextRoundDelay(scene);
    expect(internals(scene).roundIndex).toBe(1);
    expect(internals(scene).inputLocked).toBe(false);
  });

  it("a wrong tap wiggles, plays the gentle tone, re-speaks the scenario and stays on the round", () => {
    const scene = new FeelingsFacesScene();
    scene.create();
    const round = getCurrentRound(scene);
    const wrongIndex = internals(scene).choices.findIndex((emotion) => emotion !== round.emotion);
    const cards = getCards(scene);
    const faces = getFaces(scene);
    mockSpeech.speakSentence.mockClear();

    tapCard(scene, wrongIndex);

    expect(mockAudio.playIncorrect).toHaveBeenCalledTimes(1);
    expect(mockAudio.playCorrect).not.toHaveBeenCalled();
    expect(internals(scene).roundIndex).toBe(0);
    expect(internals(scene).inputLocked).toBe(false);
    // The scenario is re-spoken once so the child can listen again.
    expect(mockSpeech.speakSentence).toHaveBeenCalledTimes(1);
    expect(mockSpeech.speakSentence).toHaveBeenCalledWith(round.text, true);

    // The card and its face wiggle together (angle 4, yoyo).
    const wiggle = firstTweenArgument(scene, (spec) => {
      const targets = spec.targets;
      if (!Array.isArray(targets)) return false;
      return targets.includes(cards[wrongIndex]) && targets.includes(faces[wrongIndex].obj);
    });
    expect(wiggle.angle).toBe(4);
    expect(wiggle.yoyo).toBe(true);
  });

  it("never locks out on repeated wrong taps", () => {
    const scene = new FeelingsFacesScene();
    scene.create();
    const round = getCurrentRound(scene);
    const wrongIndex = internals(scene).choices.findIndex((emotion) => emotion !== round.emotion);

    for (let tap = 0; tap < 4; tap++) {
      tapCard(scene, wrongIndex);
    }

    expect(mockAudio.playIncorrect).toHaveBeenCalledTimes(4);
    expect(internals(scene).roundIndex).toBe(0);
    expect(internals(scene).inputLocked).toBe(false);
    // The round is still completable afterwards.
    tapCard(scene, targetCardIndex(scene));
    fireNextRoundDelay(scene);
    expect(internals(scene).roundIndex).toBe(1);
  });

  it("uses the gentler reduced-motion wiggle", () => {
    setReducedMotion(true);
    const scene = new FeelingsFacesScene();
    scene.create();
    const round = getCurrentRound(scene);
    const wrongIndex = internals(scene).choices.findIndex((emotion) => emotion !== round.emotion);

    tapCard(scene, wrongIndex);

    const wiggle = firstTweenArgument(scene, (spec) => spec.angle === 2 && spec.yoyo === true);
    expect(wiggle.duration).toBe(200);
  });

  it("plays six rounds to a win: celebration, sticker once, justEarned and 3s auto-return", () => {
    const scene = new FeelingsFacesScene();
    playThrough(scene);

    expect(mockAudio.playWin).toHaveBeenCalledTimes(1);
    expect(internals(scene).inputLocked).toBe(true);
    expect(internals(scene).roundIndex).toBe(ROUND_COUNT);

    // Shared win celebration: the ray burst grows and fades.
    const celebration = getMockFn(internals(scene).tweens.add).mock.calls.find(
      (call) => call[0]?.scaleX === 1.25 && call[0]?.scaleY === 1.25 && call[0]?.alpha === 0,
    );
    expect(celebration).toBeDefined();

    expect(mockAudio.playSticker).toHaveBeenCalledTimes(1);
    const sticker = getMockFn(internals(scene).add.image).mock.calls.find(
      (call) => call[2] === "sticker_feelings_faces",
    );
    expect(sticker).toBeDefined();

    fireAutoReturn(scene);
    expect(internals(scene).scene.start).toHaveBeenCalledWith("Hub", {
      justEarned: "feelings-faces",
    });
  });

  it("does not award the sticker again on a repeat completion", () => {
    earnSticker("feelings-faces");
    const scene = new FeelingsFacesScene();
    playThrough(scene);

    expect(mockAudio.playSticker).not.toHaveBeenCalled();
    fireAutoReturn(scene);
    expect(internals(scene).scene.start).toHaveBeenCalledWith("Hub");
  });

  it("renders a written caption and dims the glyph when the browser cannot speak", () => {
    mockSpeech.isSpeechSupported.mockReturnValue(false);
    const scene = new FeelingsFacesScene();
    scene.create();

    const round = getCurrentRound(scene);
    const caption = getCaption(scene);
    expect(caption).toBeDefined();
    // The caption is the scenario text itself, not a shortened paraphrase.
    expect(
      getMockFn(internals(scene).add.text).mock.calls.some((call) => call[2] === round.text),
    ).toBe(true);

    const glyph = getSpeakerGlyph(scene);
    expect(getMockFn(glyph.setTint)).toHaveBeenCalledWith(MUTED_TINT);
    expect(getMockFn(glyph.setAlpha)).toHaveBeenCalledWith(MUTED_ALPHA);
    // Nothing is spoken when the engine is unavailable.
    expect(mockSpeech.speakSentence).not.toHaveBeenCalled();

    // The round stays completable.
    tapCard(scene, targetCardIndex(scene));
    fireNextRoundDelay(scene);
    expect(internals(scene).roundIndex).toBe(1);
  });

  it("falls back to the caption when the SFX toggle is off", () => {
    updateSettings({ sfxEnabled: false });
    const scene = new FeelingsFacesScene();
    scene.create();

    expect(getCaption(scene)).toBeDefined();
    const glyph = getSpeakerGlyph(scene);
    expect(getMockFn(glyph.setTint)).toHaveBeenCalledWith(MUTED_TINT);
    expect(mockSpeech.speakSentence).not.toHaveBeenCalled();

    tapCard(scene, targetCardIndex(scene));
    fireNextRoundDelay(scene);
    expect(internals(scene).roundIndex).toBe(1);
  });

  it("falls back to the caption when the engine has no installed voice", () => {
    vi.stubGlobal("speechSynthesis", { getVoices: () => [] });
    const scene = new FeelingsFacesScene();
    scene.create();

    expect(getCaption(scene)).toBeDefined();
    expect(getMockFn(getSpeakerGlyph(scene).setTint)).toHaveBeenCalledWith(MUTED_TINT);
  });

  it("keeps the spoken round when a voice is installed", () => {
    vi.stubGlobal("speechSynthesis", {
      getVoices: () => [{ voiceURI: "test-voice", lang: "en-US", name: "Test" }],
    });
    const scene = new FeelingsFacesScene();
    scene.create();

    expect(getCaption(scene)).toBeUndefined();
    expect(mockSpeech.speakSentence).toHaveBeenCalledWith(RULE_LINE, true);
  });

  it("adapts the displayed round when the voice list settles on an async engine", () => {
    let voices: Array<{ voiceURI: string; lang: string; name: string }> = [];
    const listeners: Array<() => void> = [];
    vi.stubGlobal("speechSynthesis", {
      getVoices: () => voices,
      addEventListener: (_type: string, listener: () => void) => listeners.push(listener),
      removeEventListener: () => {},
    });
    const scene = new FeelingsFacesScene();
    scene.create();

    // Chrome populates voices asynchronously: an empty first read is
    // "unknown", so the spoken path is kept rather than muted outright.
    expect(getCaption(scene)).toBeUndefined();
    expect(mockSpeech.speakSentence).toHaveBeenCalledWith(RULE_LINE, true);

    // The engine settles on an empty list mid-round: the displayed round
    // gains its caption without advancing.
    voices = [];
    for (const listener of listeners) listener();
    expect(getCaption(scene)).toBeDefined();
    expect(internals(scene).roundIndex).toBe(0);

    // Voices arrive later: the caption clears and the round speaks.
    voices = [{ voiceURI: "test-voice", lang: "en-US", name: "Test" }];
    for (const listener of listeners) listener();
    expect(getCaption(scene)).toBeUndefined();
    const round = getCurrentRound(scene);
    expect(mockSpeech.speakSentence).toHaveBeenCalledWith(round.text, true);

    // The next round stays spoken.
    tapCard(scene, targetCardIndex(scene));
    fireNextRoundDelay(scene);
    expect(internals(scene).roundIndex).toBe(1);
    expect(getCaption(scene)).toBeUndefined();

    // A later settle on an empty list captions the displayed round again.
    voices = [];
    for (const listener of listeners) listener();
    expect(getCaption(scene)).toBeDefined();
  });

  it("records wins and accuracy on the progress row, starring after three wins", () => {
    const scene = new FeelingsFacesScene();
    playThrough(scene);

    const first: GameProgress = getProgress()["feelings-faces"];
    expect(first.wins).toBe(1);
    expect(first.correct).toBe(ROUND_COUNT);
    expect(first.wrong).toBe(0);
    expect(isMastered(first)).toBe(false);

    // Two more completed sessions master the game (MASTERY_WINS = 3).
    playThrough(scene);
    playThrough(scene);

    const mastered: GameProgress = getProgress()["feelings-faces"];
    expect(mastered.wins).toBe(3);
    expect(mastered.correct).toBe(ROUND_COUNT * 3);
    expect(isMastered(mastered)).toBe(true);
  });

  it("counts wrong taps in the accuracy behind the progress row", () => {
    const scene = new FeelingsFacesScene();
    scene.create();
    const round = getCurrentRound(scene);
    const wrongIndex = internals(scene).choices.findIndex((emotion) => emotion !== round.emotion);

    tapCard(scene, wrongIndex);
    tapCard(scene, targetCardIndex(scene));
    fireNextRoundDelay(scene);

    for (let remaining = 1; remaining < ROUND_COUNT; remaining++) {
      completeRound(scene);
    }

    const progress: GameProgress = getProgress()["feelings-faces"];
    expect(progress.correct).toBe(ROUND_COUNT);
    expect(progress.wrong).toBe(1);
    expect(progress.wins).toBe(1);
  });

  it("re-launching after completion re-arms input and re-draws the ladder", () => {
    const scene = new FeelingsFacesScene();
    playThrough(scene);
    expect(internals(scene).inputLocked).toBe(true);

    scene.create();

    expect(internals(scene).inputLocked).toBe(false);
    expect(internals(scene).roundIndex).toBe(0);
    tapCard(scene, targetCardIndex(scene));
    fireNextRoundDelay(scene);
    expect(internals(scene).roundIndex).toBe(1);
  });
});
