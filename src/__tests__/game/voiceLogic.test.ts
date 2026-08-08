import { describe, expect, it } from "vitest";
import { availableVoiceOptions, resolveVoice } from "../../game/voiceLogic";

/** Builds a minimal SpeechSynthesisVoice mock. */
function makeVoice(overrides: Partial<SpeechSynthesisVoice>): SpeechSynthesisVoice {
  return {
    voiceURI: "uri",
    name: "name",
    lang: "en-US",
    localService: false,
    default: false,
    ...overrides,
  } as SpeechSynthesisVoice;
}

describe("availableVoiceOptions", () => {
  it("always lists 'Default (device)' first", () => {
    const options = availableVoiceOptions([makeVoice({ voiceURI: "a" })]);
    expect(options[0]).toEqual({ voiceURI: null, label: "Default (device)" });
  });

  it("lists every device voice with its URI and a lang-name label", () => {
    const voices = [
      makeVoice({ voiceURI: "v1", lang: "en-US", name: "Zoe" }),
      makeVoice({ voiceURI: "v2", lang: "fr-FR", name: "Amélie" }),
    ];
    const options = availableVoiceOptions(voices);
    expect(options).toEqual([
      { voiceURI: null, label: "Default (device)" },
      { voiceURI: "v1", label: "en-US — Zoe" },
      { voiceURI: "v2", label: "fr-FR — Amélie" },
    ]);
  });

  it("includes voices of every language (no hard en-US gate)", () => {
    const options = availableVoiceOptions([makeVoice({ voiceURI: "de", lang: "de-DE" })]);
    expect(options.some((o) => o.voiceURI === "de")).toBe(true);
  });

  it("sorts by language then name, case-insensitively", () => {
    const voices = [
      makeVoice({ voiceURI: "c", lang: "en-US", name: "charlie" }),
      makeVoice({ voiceURI: "a", lang: "en-GB", name: "Alice" }),
      makeVoice({ voiceURI: "b", lang: "en-US", name: "bravo" }),
    ];
    const labels = availableVoiceOptions(voices)
      .filter((o) => o.voiceURI !== null)
      .map((o) => o.label);
    expect(labels).toEqual(["en-GB — Alice", "en-US — bravo", "en-US — charlie"]);
  });

  it("returns only the default option when no voices are available", () => {
    expect(availableVoiceOptions([])).toEqual([{ voiceURI: null, label: "Default (device)" }]);
  });
});

describe("resolveVoice", () => {
  const voices = [
    makeVoice({ voiceURI: "v1", name: "Zoe" }),
    makeVoice({ voiceURI: "v2", name: "Fred" }),
  ];

  it("returns the voice matching the preferred URI", () => {
    expect(resolveVoice(voices, "v2")).toBe(voices[1]);
  });

  it("returns null when the preference is null (browser default)", () => {
    expect(resolveVoice(voices, null)).toBeNull();
  });

  it("returns null when no voices are available", () => {
    expect(resolveVoice([], "v1")).toBeNull();
  });

  it("returns null when the preferred URI no longer exists", () => {
    expect(resolveVoice(voices, "vanished")).toBeNull();
  });
});
