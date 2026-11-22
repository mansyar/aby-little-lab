import {
  type AudioIdentity,
  descendingContour,
  type TimbreWaveform,
  winTempoForBudget,
} from "../game/audioIdentity";

const SFX_NAMES = ["pop", "correct", "incorrect", "wake", "win", "sticker"] as const;

export type SfxName = (typeof SFX_NAMES)[number];

const FROG_NOTE_DURATION = 0.5;
const FROG_NOTE_GAIN = 0.3;

/**
 * Per-cue synth voice for the feedback trio: the anchor note every contour
 * offset hangs from, today's note spacing and durations, and the gain each
 * cue has always used. The identity bends these — transposition, waveform,
 * tempo — so the default identity reproduces today's voices exactly.
 */
interface TrioVoice {
  readonly anchorHz: number;
  /** Seconds between consecutive note starts at tempo 1. */
  readonly stepSeconds: number;
  /** Duration of every note except the last, at tempo 1. */
  readonly noteDurationSeconds: number;
  /** Duration of the final note, at tempo 1. */
  readonly finalDurationSeconds: number;
  readonly gain: number;
}

/** Correct voice: C5 anchor under today's ascending chime. */
const CORRECT_VOICE: TrioVoice = {
  anchorHz: 523.25,
  stepSeconds: 0.12,
  noteDurationSeconds: 0.15,
  finalDurationSeconds: 0.2,
  gain: 0.3,
};

/** Incorrect voice: G4 anchor under today's gentle descending fifth. */
const INCORRECT_VOICE: TrioVoice = {
  anchorHz: 392.0,
  stepSeconds: 0.12,
  noteDurationSeconds: 0.15,
  finalDurationSeconds: 0.2,
  gain: 0.2,
};

/** Win voice: C5 anchor under today's celebratory arpeggio + octave. */
const WIN_VOICE: TrioVoice = {
  anchorHz: 523.25,
  stepSeconds: 0.1,
  noteDurationSeconds: 0.12,
  finalDurationSeconds: 0.25,
  gain: 0.3,
};

/**
 * Plays a single synthesized tone at a given frequency with staggered start.
 * `waveform` defaults to sine, today's oscillator shape for every cue; the
 * identity-driven trio passes its timbre through.
 */
function playTone(
  ctx: AudioContext,
  frequency: number,
  startOffset: number,
  duration: number,
  gainValue: number,
  waveform: OscillatorType = "sine",
): void {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = waveform;
  oscillator.frequency.value = frequency;

  gainNode.gain.value = gainValue;

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  const now = ctx.currentTime;
  oscillator.start(now + startOffset);
  oscillator.stop(now + startOffset + duration);
}

/**
 * Voices one trio cue: every contour note hangs a semitone-ratio frequency
 * off the cue's anchor, transposed by the identity's pitch offset, shaped
 * by its waveform, and timed by its tempo (note spacing and durations both
 * scale). The default identity reproduces today's voices exactly: offsets
 * of 0/4/7 semitones above the anchor are today's hardcoded chime tones,
 * to within 0.01 Hz of equal-temperament rounding.
 */
function playContourCue(
  ctx: AudioContext,
  voice: TrioVoice,
  contour: readonly number[],
  pitchOffsetSemitones: number,
  tempo: number,
  waveform: TimbreWaveform,
): void {
  const lastIndex = contour.length - 1;
  contour.forEach((offset, index) => {
    const frequency = voice.anchorHz * 2 ** ((offset + pitchOffsetSemitones) / 12);
    const duration =
      (index === lastIndex ? voice.finalDurationSeconds : voice.noteDurationSeconds) * tempo;
    playTone(ctx, frequency, index * voice.stepSeconds * tempo, duration, voice.gain, waveform);
  });
}

/** A warm sine frog note, unchanged by the game audio identity. */
export function playFrogNote(ctx: AudioContext, frequency: number): void {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  gainNode.gain.value = FROG_NOTE_GAIN;

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  const now = ctx.currentTime;
  oscillator.start(now);
  oscillator.stop(now + FROG_NOTE_DURATION);
}

/** Ascending chime voiced by the registered game's audio identity. */
export function playCorrect(ctx: AudioContext, identity: AudioIdentity): void {
  playContourCue(
    ctx,
    CORRECT_VOICE,
    identity.contours.correct,
    identity.pitchOffsetSemitones,
    identity.tempo,
    identity.waveform,
  );
}

/** Descending fifth, kept gentle for every identity by the no-fail guard. */
export function playIncorrect(ctx: AudioContext, identity: AudioIdentity): void {
  playContourCue(
    ctx,
    INCORRECT_VOICE,
    descendingContour(identity.contours.incorrect),
    identity.pitchOffsetSemitones,
    identity.tempo,
    identity.waveform,
  );
}

/** Celebratory arpeggio, tempo-clamped to the 300–800 ms budget. */
export function playWin(ctx: AudioContext, identity: AudioIdentity): void {
  const contour = identity.contours.win;
  const baseEndSeconds =
    (contour.length - 1) * WIN_VOICE.stepSeconds + WIN_VOICE.finalDurationSeconds;
  const tempo = winTempoForBudget(identity.tempo, baseEndSeconds);
  playContourCue(ctx, WIN_VOICE, contour, identity.pitchOffsetSemitones, tempo, identity.waveform);
}

/** Sparkle tone (C6, E6). */
export function playSticker(ctx: AudioContext): void {
  playTone(ctx, 1046.5, 0, 0.1, 0.2);
  playTone(ctx, 1318.51, 0.08, 0.15, 0.2);
}

/** Short percussive pop blip. */
export function playPop(ctx: AudioContext): void {
  playTone(ctx, 800, 0, 0.08, 0.3);
}

/** Soft rousing wake tone (E4, A4). */
export function playWake(ctx: AudioContext): void {
  playTone(ctx, 329.63, 0, 0.15, 0.2);
  playTone(ctx, 440.0, 0.12, 0.2, 0.2);
}

/** Gentle two-tone idle call (E5, G5). */
export function playIdleCall(ctx: AudioContext): void {
  playTone(ctx, 659.25, 0, 0.15, 0.12);
  playTone(ctx, 783.99, 0.15, 0.2, 0.12);
}
