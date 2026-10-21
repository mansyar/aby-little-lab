import type { GameId } from "../types";

/**
 * Per-game sonic identity for the synthesized feedback trio
 * (correct / incorrect / win). This module is pure data + pure logic: it
 * knows nothing about Web Audio, so the synth can consume the resolved
 * values without any structural rewrite. Resolving an identity is pure and
 * repeatable; the trio's `AudioManager` voices map these parameters onto
 * oscillator frequency, waveform type, note timing, and melodic contour.
 */

/** Waveforms the trio oscillators may use (the constant-shape OscillatorType subset). */
export type TimbreWaveform = "sine" | "triangle" | "square" | "sawtooth";

/** Largest |pitchOffsetSemitones| any identity may carry. */
export const MAX_PITCH_OFFSET_SEMITONES = 5;

/**
 * Tempo (duration/spacing multiplier) bounds. Below 1 is snappier, above 1
 * is slower; 1 means today's exact timing. Kept tight so even the slowest
 * identity stays inside the win cue's 300–800 ms celebration budget.
 */
export const MIN_TEMPO = 0.75;
export const MAX_TEMPO = 1.5;

/** Largest |offset| any single contour note may sit from its cue's anchor note. */
export const MAX_CONTOUR_OFFSET_SEMITONES = 12;

/**
 * Relative melodic shape per feedback cue. The first offset is the cue's
 * anchor note (always 0); every later offset is semitones away from that
 * anchor. Phase 2 maps the offsets onto the trio's real note spacings, so
 * today's voices are reproduced by the default contours below.
 */
export interface CueContours {
  /** Contour for the correct cue (ascending today: 0 → 4 → 7 semitones). */
  readonly correct: readonly number[];
  /** Contour for the incorrect cue (gentle descending today: 0 → -7). */
  readonly incorrect: readonly number[];
  /** Contour for the win cue (arpeggio + octave today: 0 → 4 → 7 → 12). */
  readonly win: readonly number[];
}

/** One game's fixed sonic identity for the feedback trio. */
export interface AudioIdentity {
  /** Transposition applied to every trio note, in semitones. */
  readonly pitchOffsetSemitones: number;
  /** Oscillator shape for every trio note. */
  readonly waveform: TimbreWaveform;
  /** Duration and spacing multiplier for the trio (1 = today's timing). */
  readonly tempo: number;
  /** Relative melodic shape per feedback cue. */
  readonly contours: CueContours;
}

/**
 * The voice every game shared before this track: unshifted pitch, sine
 * oscillators, today's timing, and today's note spacings. Unknown or
 * unregistered game ids fall back to this identity, so a missing table row
 * can never change what a player hears — only make it the shared default.
 */
export const DEFAULT_IDENTITY: AudioIdentity = {
  pitchOffsetSemitones: 0,
  waveform: "sine",
  tempo: 1,
  contours: {
    correct: [0, 4, 7],
    incorrect: [0, -7],
    win: [0, 4, 7, 12],
  },
};

/**
 * Formula-derived starting identities for every registered game, one entry
 * per `GAME_REGISTRY` row (hub order). The Phase 3 tuning pass hand-adjusts
 * these values, so the table stays a literal rather than being generated.
 *
 * The formulas (index = hub order, 0-based):
 * - waveform  = ["sine", "triangle", "square", "sawtooth"][index % 4]
 * - pitch     = (index % 11) - 5  (spreads the shift across ±5 semitones)
 * - tempo     = 1 + ((index % 5) - 2) * 0.125  (spreads 0.75 … 1.25)
 * - contours  = per-cue variant tables below, chosen by index % 4
 *
 * Deliberately typed `Partial` so the registry-iteration test (AC-1) fails
 * loudly if a registered game is missing from the table instead of silently
 * playing the default voice.
 */
export const AUDIO_IDENTITIES: Partial<Record<GameId, AudioIdentity>> = {
  "shape-sorter": {
    pitchOffsetSemitones: -5,
    waveform: "sine",
    tempo: 0.75,
    contours: { correct: [0, 4, 7], incorrect: [0, -7], win: [0, 4, 7, 12] },
  },
  "animal-trace": {
    pitchOffsetSemitones: -4,
    waveform: "triangle",
    tempo: 0.875,
    contours: { correct: [0, 3, 7], incorrect: [0, -5], win: [0, 3, 7, 12] },
  },
  "pop-freeze": {
    pitchOffsetSemitones: -3,
    waveform: "square",
    tempo: 1,
    contours: { correct: [0, 5, 9], incorrect: [0, -3], win: [0, 4, 9, 12] },
  },
  "shadow-match": {
    pitchOffsetSemitones: -2,
    waveform: "sawtooth",
    tempo: 1.125,
    contours: { correct: [0, 2, 4], incorrect: [0, -4], win: [0, 5, 9, 12] },
  },
  "musical-memory": {
    pitchOffsetSemitones: -1,
    waveform: "sine",
    tempo: 1.25,
    contours: { correct: [0, 4, 7], incorrect: [0, -7], win: [0, 4, 7, 12] },
  },
  "big-small": {
    pitchOffsetSemitones: 0,
    waveform: "triangle",
    tempo: 0.75,
    contours: { correct: [0, 3, 7], incorrect: [0, -5], win: [0, 3, 7, 12] },
  },
  "pattern-builder": {
    pitchOffsetSemitones: 1,
    waveform: "square",
    tempo: 0.875,
    contours: { correct: [0, 5, 9], incorrect: [0, -3], win: [0, 4, 9, 12] },
  },
  "alphabet-match": {
    pitchOffsetSemitones: 2,
    waveform: "sawtooth",
    tempo: 1,
    contours: { correct: [0, 2, 4], incorrect: [0, -4], win: [0, 5, 9, 12] },
  },
  "word-match": {
    pitchOffsetSemitones: 3,
    waveform: "sine",
    tempo: 1.125,
    contours: { correct: [0, 4, 7], incorrect: [0, -7], win: [0, 4, 7, 12] },
  },
  "word-builder": {
    pitchOffsetSemitones: 4,
    waveform: "triangle",
    tempo: 1.25,
    contours: { correct: [0, 3, 7], incorrect: [0, -5], win: [0, 3, 7, 12] },
  },
  "how-many": {
    pitchOffsetSemitones: 5,
    waveform: "square",
    tempo: 0.75,
    contours: { correct: [0, 5, 9], incorrect: [0, -3], win: [0, 4, 9, 12] },
  },
  "first-sounds": {
    pitchOffsetSemitones: -5,
    waveform: "sawtooth",
    tempo: 0.875,
    contours: { correct: [0, 2, 4], incorrect: [0, -4], win: [0, 5, 9, 12] },
  },
  "more-less": {
    pitchOffsetSemitones: -4,
    waveform: "sine",
    tempo: 1,
    contours: { correct: [0, 4, 7], incorrect: [0, -7], win: [0, 4, 7, 12] },
  },
  "odd-one-out": {
    pitchOffsetSemitones: -3,
    waveform: "triangle",
    tempo: 1.125,
    contours: { correct: [0, 3, 7], incorrect: [0, -5], win: [0, 3, 7, 12] },
  },
  "color-match": {
    pitchOffsetSemitones: -2,
    waveform: "square",
    tempo: 1.25,
    contours: { correct: [0, 5, 9], incorrect: [0, -3], win: [0, 4, 9, 12] },
  },
  "add-it-up": {
    pitchOffsetSemitones: -1,
    waveform: "sawtooth",
    tempo: 0.75,
    contours: { correct: [0, 2, 4], incorrect: [0, -4], win: [0, 5, 9, 12] },
  },
  "take-away": {
    pitchOffsetSemitones: 0,
    waveform: "sine",
    tempo: 0.875,
    contours: { correct: [0, 4, 7], incorrect: [0, -7], win: [0, 4, 7, 12] },
  },
  "memory-match": {
    pitchOffsetSemitones: 1,
    waveform: "triangle",
    tempo: 1,
    contours: { correct: [0, 3, 7], incorrect: [0, -5], win: [0, 3, 7, 12] },
  },
  "decode-it": {
    pitchOffsetSemitones: 2,
    waveform: "square",
    tempo: 1.125,
    contours: { correct: [0, 5, 9], incorrect: [0, -3], win: [0, 4, 9, 12] },
  },
  "number-order": {
    pitchOffsetSemitones: 3,
    waveform: "sawtooth",
    tempo: 1.25,
    contours: { correct: [0, 2, 4], incorrect: [0, -4], win: [0, 5, 9, 12] },
  },
  "feelings-faces": {
    pitchOffsetSemitones: 4,
    waveform: "sine",
    tempo: 0.75,
    contours: { correct: [0, 4, 7], incorrect: [0, -7], win: [0, 4, 7, 12] },
  },
  "story-order": {
    pitchOffsetSemitones: 5,
    waveform: "triangle",
    tempo: 0.875,
    contours: { correct: [0, 3, 7], incorrect: [0, -5], win: [0, 3, 7, 12] },
  },
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function clampContour(offsets: readonly number[]): number[] {
  return offsets.map((offset) =>
    clamp(offset, -MAX_CONTOUR_OFFSET_SEMITONES, MAX_CONTOUR_OFFSET_SEMITONES),
  );
}

/** Celebration duration budget for the win cue (NFR-2), in seconds. */
export const WIN_MIN_END_SECONDS = 0.3;
export const WIN_MAX_END_SECONDS = 0.8;

/**
 * No-fail guard for the incorrect cue (NFR-1): forces a contour to stay
 * non-increasing from its anchor note, so no identity — tuned now or later —
 * can turn the gentle descending tone into a rising or harsh one. Each
 * offset is first clamped into its documented ±12-semitone range, which also
 * caps the total descent, then every later note is floored at its
 * predecessor. A contour that would rise collapses onto the anchor's level
 * instead of inverting the cue's character.
 */
export function descendingContour(offsets: readonly number[]): number[] {
  const result: number[] = [];
  let ceiling = 0;
  for (const offset of clampContour(offsets)) {
    const value = Math.min(offset, ceiling);
    result.push(value);
    ceiling = value;
  }
  return result;
}

/**
 * Tempo actually used to play the win cue: the identity's tempo clamped so
 * the cue's last note ends inside the 300–800 ms celebration budget
 * (NFR-2). The synth supplies `baseEndSeconds` — the cue's last-note end
 * time at tempo 1 — because note timing lives with the synth, while the
 * budget policy lives with the identity ranges it guards.
 */
export function winTempoForBudget(tempo: number, baseEndSeconds: number): number {
  return clamp(tempo, WIN_MIN_END_SECONDS / baseEndSeconds, WIN_MAX_END_SECONDS / baseEndSeconds);
}

/**
 * Returns the identity with every parameter forced inside its documented
 * range. Clamping (rather than rejecting) is chosen on purpose: a Phase 3
 * tuned value that drifts out of range bends instead of breaking playback,
 * and no caller has to pre-validate before resolving.
 */
export function normalizeIdentity(identity: AudioIdentity): AudioIdentity {
  return {
    pitchOffsetSemitones: clamp(
      identity.pitchOffsetSemitones,
      -MAX_PITCH_OFFSET_SEMITONES,
      MAX_PITCH_OFFSET_SEMITONES,
    ),
    waveform: identity.waveform,
    tempo: clamp(identity.tempo, MIN_TEMPO, MAX_TEMPO),
    contours: {
      correct: clampContour(identity.contours.correct),
      incorrect: clampContour(identity.contours.incorrect),
      win: clampContour(identity.contours.win),
    },
  };
}

/**
 * Resolves the trio's identity for a game id. Unregistered ids and the
 * no-context case (`null`/`undefined`) fall back to {@link DEFAULT_IDENTITY},
 * so resolution is total and deterministic: the same id always yields the
 * same identity.
 */
export function identityForGameId(gameId: GameId | null | undefined): AudioIdentity {
  const identity = gameId === null || gameId === undefined ? undefined : AUDIO_IDENTITIES[gameId];
  return identity ? normalizeIdentity(identity) : DEFAULT_IDENTITY;
}
