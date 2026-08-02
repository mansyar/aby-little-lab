/**
 * Minimal Web Speech API wrapper for letter-name pronunciation.
 *
 * Speech is treated as a synthesized sound effect: it is silenced by the
 * SFX toggle (callers pass the enabled flag) and degrades gracefully when
 * the API is unavailable (unsupported browser, no network for remote
 * voices, etc.) — the game's visual letter display always remains.
 */

/** Returns whether the browser exposes the Web Speech synthesis API. */
export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/**
 * Speaks a single letter name (en-US) if enabled and supported.
 * Cancels any prior utterance so rapid round changes never overlap.
 * Never throws — callers can always fall back to visual-only feedback.
 * @param letter - The letter to pronounce (e.g. "A").
 * @param enabled - Whether speech is allowed (SFX toggle).
 * @returns True when an utterance was actually dispatched.
 */
export function speakLetter(letter: string, enabled: boolean): boolean {
  if (!enabled || !isSpeechSupported()) {
    return false;
  }
  try {
    const { speechSynthesis, SpeechSynthesisUtterance } = window;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance();
    utterance.text = letter;
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
}
