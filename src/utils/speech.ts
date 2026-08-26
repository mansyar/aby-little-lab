/**
 * Minimal Web Speech API wrapper for letter and word pronunciation.
 *
 * Speech is treated as a synthesized sound effect: it is silenced by the
 * SFX toggle (callers pass the enabled flag) and degrades gracefully when
 * the API is unavailable (unsupported browser, no network for remote
 * voices, etc.) — the game's visual displays always remain.
 *
 * iOS/WebKit quirk: the speech session stays locked until at least one
 * utterance is dispatched inside a real user gesture. Callers must invoke
 * `unlockSpeechForUserGesture()` from the first interaction (e.g. a Hub tile
 * tap); without it, iOS silently drops every programmatic speak.
 */

import { resolveVoice } from "../game/voiceLogic";

/** Returns whether the browser exposes the Web Speech synthesis API. */
export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export type SpeechLifecycleEvent =
  | { kind: "speech:start" }
  | { kind: "speech:end" }
  | { kind: "speech:error" };

let lifecycleSeq = 0;
const lifecycleListeners = new Set<(event: SpeechLifecycleEvent) => void>();

function emitLifecycle(event: SpeechLifecycleEvent): void {
  for (const listener of lifecycleListeners) {
    listener(event);
  }
}

/**
 * Subscribes to Web Speech utterance lifecycle events so UI can mirror the
 * spoken state (e.g. the speaker glyph). Only the most recently dispatched
 * utterance may emit: superseded or cancelled utterances are ignored, so an
 * interruption can never leave a stale "speaking" state behind.
 * @returns An unsubscribe function.
 */
export function onSpeechLifecycle(listener: (event: SpeechLifecycleEvent) => void): () => void {
  lifecycleListeners.add(listener);
  return () => {
    lifecycleListeners.delete(listener);
  };
}

/** True once the iOS/WebKit user-gesture unlock has been performed. */
let speechUnlocked = false;

/** Preferred voice URI from Settings; null = browser default. */
let preferredVoiceURI: string | null = null;

/**
 * Sets the device-level TTS voice preference. A null URI restores the
 * browser default; an unknown URI silently falls back to the default.
 */
export function setPreferredVoiceURI(uri: string | null): void {
  preferredVoiceURI = uri;
}

/**
 * Defer interval after cancel(): the platform's async cancel callback must
 * complete before the replacement utterance is queued (WebKit/Chromium race).
 */
const INTERRUPT_DEFER_MS = 100;

/**
 * Unlocks the Web Speech session on iOS/WebKit, where programmatic speaks
 * are silently dropped until an utterance is dispatched inside a real user
 * gesture. Dispatches a single silent warm-up utterance; safe to call
 * repeatedly (unlocks at most once per page session). Best-effort, never
 * throws. Call from the first user interaction (Hub tile tap / pointerdown).
 */
export function unlockSpeechForUserGesture(): void {
  if (speechUnlocked || !isSpeechSupported()) {
    return;
  }
  try {
    const { speechSynthesis, SpeechSynthesisUtterance } = window;
    const warmUp = new SpeechSynthesisUtterance();
    warmUp.text = " ";
    warmUp.volume = 0;
    speechSynthesis.speak(warmUp);
    speechUnlocked = true;
  } catch {
    // Best-effort: the flag stays clear so the next interaction retries.
  }
}

/**
 * Speaks text (en-US) if enabled and supported.
 *
 * Only cancels a queue that is actually speaking or pending: an
 * unconditional cancel() followed by an immediate speak() races with the
 * platform's async cancel callbacks (WebKit/Chromium), which can wipe the
 * freshly queued utterance. When an interrupt IS needed, the new utterance
 * is dispatched on a short timer so it cannot be cleared by the in-flight
 * cancel, and resume() un-sticks the paused state some engines enter after
 * a cancel.
 *
 * Never throws — callers can always fall back to visual-only feedback.
 * @param text - The text to pronounce (e.g. "A" or "CAT").
 * @param enabled - Whether speech is allowed (SFX toggle).
 * @param rate - Speaking rate, slower for toddlers.
 * @returns True when an utterance was (or will be) dispatched.
 */
function speakText(text: string, enabled: boolean, rate: number): boolean {
  if (!enabled || !isSpeechSupported()) {
    return false;
  }
  try {
    const { speechSynthesis, SpeechSynthesisUtterance } = window;
    const needsInterrupt = speechSynthesis.speaking || speechSynthesis.pending;
    if (needsInterrupt) {
      speechSynthesis.cancel();
      speechSynthesis.resume();
    }
    const utterance = new SpeechSynthesisUtterance();
    const token = ++lifecycleSeq;
    utterance.onstart = () => {
      if (token === lifecycleSeq) {
        emitLifecycle({ kind: "speech:start" });
      }
    };
    utterance.onend = () => {
      if (token === lifecycleSeq) {
        emitLifecycle({ kind: "speech:end" });
      }
    };
    utterance.onerror = () => {
      if (token === lifecycleSeq) {
        emitLifecycle({ kind: "speech:error" });
      }
    };
    utterance.text = text;
    utterance.lang = "en-US";
    utterance.rate = rate;
    // Apply the stored voice preference when it resolves; otherwise the
    // platform's default voice pronounces (never throws).
    const voices = speechSynthesis.getVoices?.() ?? [];
    utterance.voice = resolveVoice(voices, preferredVoiceURI) ?? undefined;
    if (needsInterrupt) {
      window.setTimeout(() => {
        try {
          speechSynthesis.speak(utterance);
        } catch {
          // Best-effort: the utterance is dropped when the engine is gone.
        }
      }, INTERRUPT_DEFER_MS);
    } else {
      speechSynthesis.speak(utterance);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Speaks a single letter name (en-US) if enabled and supported.
 * @param letter - The letter to pronounce (e.g. "A").
 * @param enabled - Whether speech is allowed (SFX toggle).
 * @returns True when an utterance was actually dispatched.
 */
export function speakLetter(letter: string, enabled: boolean): boolean {
  return speakText(letter, enabled, 0.9);
}

/**
 * Speaks a word (en-US) if enabled and supported, slightly slower than a
 * single letter so toddlers can follow the printed word.
 * @param word - The word to pronounce (e.g. "CAT").
 * @param enabled - Whether speech is allowed (SFX toggle).
 * @returns True when an utterance was actually dispatched.
 */
export function speakWord(word: string, enabled: boolean): boolean {
  return speakText(word, enabled, 0.8);
}

/** Number words for 0-10, the How Many? counting range. */
const NUMBER_WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
] as const;

/**
 * Speaks a number word (en-US) if enabled and supported, at the same gentle
 * rate as a single letter.
 * @param number - The number to pronounce (e.g. 3 → "three").
 * @param enabled - Whether speech is allowed (SFX toggle).
 * @returns True when an utterance was actually dispatched.
 */
export function speakNumber(number: number, enabled: boolean): boolean {
  return speakText(NUMBER_WORDS[number] ?? String(number), enabled, 0.9);
}
