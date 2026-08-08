/**
 * Pure helpers for the device-level TTS voice preference.
 *
 * The preference is a `voiceURI` string stored in Settings (null = let the
 * browser pick its default voice). Voices are enumerated from
 * `speechSynthesis.getVoices()` at the call site and passed in so this module
 * stays pure and fully testable.
 */

/** One entry in the voice picker; `voiceURI: null` is the "Default (device)" option. */
export interface VoiceOption {
  voiceURI: string | null;
  /** Human-readable label, e.g. "en-US — Google US English". */
  label: string;
}

export const DEFAULT_VOICE_LABEL = "Default (device)";

/**
 * Builds the ordered picker list: "Default (device)" first, then every
 * installed voice (all languages) sorted by language then name. Never throws;
 * an empty list yields just the default option.
 */
export function availableVoiceOptions(voices: SpeechSynthesisVoice[]): VoiceOption[] {
  const options: VoiceOption[] = [
    { voiceURI: null, label: DEFAULT_VOICE_LABEL },
    ...[...voices]
      .sort((a, b) => {
        const byLang = a.lang.localeCompare(b.lang, undefined, { sensitivity: "base" });
        if (byLang !== 0) return byLang;
        return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
      })
      .map((voice) => ({ voiceURI: voice.voiceURI, label: `${voice.lang} — ${voice.name}` })),
  ];
  return options;
}

/**
 * Resolves the stored voice preference against the currently installed
 * voices. Returns null when the preference is unset or the URI no longer
 * exists, so callers can silently fall back to the browser default.
 */
export function resolveVoice(
  voices: SpeechSynthesisVoice[],
  preferredVoiceURI: string | null,
): SpeechSynthesisVoice | null {
  if (preferredVoiceURI === null) return null;
  return voices.find((voice) => voice.voiceURI === preferredVoiceURI) ?? null;
}
