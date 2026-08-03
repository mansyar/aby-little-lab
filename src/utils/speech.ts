/**
 * Minimal Web Speech API wrapper for letter and word pronunciation.
 *
 * Speech is treated as a synthesized sound effect: it is silenced by the
 * SFX toggle (callers pass the enabled flag) and degrades gracefully when
 * the API is unavailable (unsupported browser, no network for remote
 * voices, etc.) — the game's visual displays always remain.
 */

/** Returns whether the browser exposes the Web Speech synthesis API. */
export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/**
 * Speaks text (en-US) if enabled and supported.
 * Cancels any prior utterance so rapid round changes never overlap.
 * Never throws — callers can always fall back to visual-only feedback.
 * @param text - The text to pronounce (e.g. "A" or "CAT").
 * @param enabled - Whether speech is allowed (SFX toggle).
 * @param rate - Speaking rate, slower for toddlers.
 * @returns True when an utterance was actually dispatched.
 */
function speakText(text: string, enabled: boolean, rate: number): boolean {
  if (!enabled || !isSpeechSupported()) {
    return false;
  }
  try {
    const { speechSynthesis, SpeechSynthesisUtterance } = window;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance();
    utterance.text = text;
    utterance.lang = "en-US";
    utterance.rate = rate;
    speechSynthesis.speak(utterance);
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
