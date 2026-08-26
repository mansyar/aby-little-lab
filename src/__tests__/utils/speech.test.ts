import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  isSpeechSupported,
  onSpeechLifecycle,
  setPreferredVoiceURI,
  speakLetter,
  speakNumber,
  speakWord,
  unlockSpeechForUserGesture,
} from "../../utils/speech";

describe("speech", () => {
  const cancel = vi.fn();
  const speak = vi.fn();
  const resume = vi.fn();
  const getVoices = vi.fn();
  const synth = { cancel, speak, resume, getVoices, speaking: false, pending: false };
  let Utterance: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    cancel.mockClear();
    speak.mockClear();
    resume.mockClear();
    getVoices.mockClear();
    synth.speaking = false;
    synth.pending = false;
    Utterance = vi.fn();
    vi.stubGlobal("speechSynthesis", synth);
    vi.stubGlobal("SpeechSynthesisUtterance", Utterance);
    // Every test starts with no voice preference (browser default).
    setPreferredVoiceURI(null);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("isSpeechSupported", () => {
    it("returns true when speechSynthesis is available", () => {
      expect(isSpeechSupported()).toBe(true);
    });

    it("returns false when speechSynthesis is missing", () => {
      vi.unstubAllGlobals();
      expect(isSpeechSupported()).toBe(false);
    });
  });

  describe("speakLetter", () => {
    it("returns false and does nothing when disabled", () => {
      expect(speakLetter("A", false)).toBe(false);
      expect(speak).not.toHaveBeenCalled();
      expect(cancel).not.toHaveBeenCalled();
    });

    it("speaks the letter with a gentle rate when enabled", () => {
      const result = speakLetter("B", true);
      expect(result).toBe(true);
      expect(speak).toHaveBeenCalledTimes(1);
      const utterance = Utterance.mock.instances[0];
      expect(utterance.text).toBe("B");
      expect(utterance.lang).toBe("en-US");
      expect(utterance.rate).toBeGreaterThanOrEqual(0.8);
      expect(utterance.rate).toBeLessThanOrEqual(1);
      expect(speak).toHaveBeenCalledWith(utterance);
    });

    it("does not cancel an idle queue before speaking (avoids the cancel/speak race)", () => {
      speakLetter("A", true);
      speakLetter("B", true);
      expect(cancel).not.toHaveBeenCalled();
      expect(speak).toHaveBeenCalledTimes(2);
      expect(Utterance.mock.instances).toHaveLength(2);
    });

    it("cancels and defers the new utterance when the engine is speaking", () => {
      vi.useFakeTimers();
      try {
        synth.speaking = true;
        const result = speakLetter("B", true);
        expect(result).toBe(true);
        expect(cancel).toHaveBeenCalledTimes(1);
        expect(resume).toHaveBeenCalledTimes(1);
        // Never queue synchronously after cancel(): the platform's async
        // cancel callback can wipe the fresh utterance (WebKit/Chromium).
        expect(speak).not.toHaveBeenCalled();
        vi.advanceTimersByTime(100);
        expect(speak).toHaveBeenCalledWith(Utterance.mock.instances[0]);
      } finally {
        vi.useRealTimers();
      }
    });

    it("never throws when speechSynthesis is unavailable", () => {
      vi.unstubAllGlobals();
      expect(() => speakLetter("A", true)).not.toThrow();
      expect(speakLetter("A", true)).toBe(false);
    });
  });

  describe("speakWord", () => {
    it("returns false and does nothing when disabled", () => {
      expect(speakWord("CAT", false)).toBe(false);
      expect(speak).not.toHaveBeenCalled();
      expect(cancel).not.toHaveBeenCalled();
    });

    it("speaks the full word with a gentle rate when enabled", () => {
      const result = speakWord("CAT", true);
      expect(result).toBe(true);
      expect(speak).toHaveBeenCalledTimes(1);
      const utterance = Utterance.mock.instances[0];
      expect(utterance.text).toBe("CAT");
      expect(utterance.lang).toBe("en-US");
      expect(utterance.rate).toBeGreaterThanOrEqual(0.7);
      expect(utterance.rate).toBeLessThanOrEqual(0.9);
      expect(speak).toHaveBeenCalledWith(utterance);
    });

    it("does not cancel an idle queue before speaking a new word", () => {
      speakWord("DOG", true);
      speakWord("PIG", true);
      expect(cancel).not.toHaveBeenCalled();
      expect(speak).toHaveBeenCalledTimes(2);
      expect(Utterance.mock.instances).toHaveLength(2);
    });

    it("never throws when speechSynthesis is unavailable", () => {
      vi.unstubAllGlobals();
      expect(() => speakWord("CAT", true)).not.toThrow();
      expect(speakWord("CAT", true)).toBe(false);
    });
  });

  describe("speakNumber", () => {
    it("returns false and does nothing when disabled", () => {
      expect(speakNumber(3, false)).toBe(false);
      expect(speak).not.toHaveBeenCalled();
      expect(cancel).not.toHaveBeenCalled();
    });

    it("speaks the number word with a gentle rate when enabled", () => {
      const result = speakNumber(3, true);
      expect(result).toBe(true);
      expect(speak).toHaveBeenCalledTimes(1);
      const utterance = Utterance.mock.instances[0];
      expect(utterance.text).toBe("three");
      expect(utterance.lang).toBe("en-US");
      expect(utterance.rate).toBeGreaterThanOrEqual(0.8);
      expect(utterance.rate).toBeLessThanOrEqual(1);
      expect(speak).toHaveBeenCalledWith(utterance);
    });

    it("speaks the correct number word for the full 0-10 range", () => {
      const expected = [
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
      ];
      for (let n = 0; n <= 10; n++) {
        Utterance.mockClear();
        speakNumber(n, true);
        expect(Utterance.mock.instances[0].text).toBe(expected[n]);
      }
    });

    it("does not cancel an idle queue before speaking a new number", () => {
      speakNumber(2, true);
      speakNumber(4, true);
      expect(cancel).not.toHaveBeenCalled();
      expect(speak).toHaveBeenCalledTimes(2);
      expect(Utterance.mock.instances).toHaveLength(2);
    });

    it("never throws when speechSynthesis is unavailable", () => {
      vi.unstubAllGlobals();
      expect(() => speakNumber(3, true)).not.toThrow();
      expect(speakNumber(3, true)).toBe(false);
    });
  });

  describe("setPreferredVoiceURI", () => {
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

    it("assigns the matching voice to the utterance when the URI resolves", () => {
      const zoe = makeVoice({ voiceURI: "com.zoe", name: "Zoe" });
      const fred = makeVoice({ voiceURI: "com.fred", name: "Fred" });
      getVoices.mockReturnValue([zoe, fred]);

      setPreferredVoiceURI("com.fred");
      speakWord("CAT", true);

      const utterance = Utterance.mock.instances[0];
      expect(utterance.voice).toBe(fred);
    });

    it("leaves the utterance voice unset (browser default) when no preference is set", () => {
      getVoices.mockReturnValue([makeVoice({ voiceURI: "com.zoe", name: "Zoe" })]);

      speakWord("CAT", true);

      const utterance = Utterance.mock.instances[0];
      expect(utterance.voice).toBeUndefined();
    });

    it("silently falls back to the default when the stored URI no longer exists", () => {
      getVoices.mockReturnValue([makeVoice({ voiceURI: "com.zoe", name: "Zoe" })]);

      setPreferredVoiceURI("vanished-uri");
      expect(() => speakWord("CAT", true)).not.toThrow();

      const utterance = Utterance.mock.instances[0];
      expect(utterance.voice).toBeUndefined();
    });

    it("never throws when getVoices is unavailable", () => {
      delete (synth as { getVoices?: unknown }).getVoices;

      setPreferredVoiceURI("com.zoe");
      expect(() => speakLetter("A", true)).not.toThrow();
      expect(speakLetter("A", true)).toBe(true);
      expect(Utterance.mock.instances[0].voice).toBeUndefined();
    });
  });

  describe("unlockSpeechForUserGesture", () => {
    it("dispatches one silent warm-up utterance to unlock the WebKit session", () => {
      unlockSpeechForUserGesture();
      expect(speak).toHaveBeenCalledTimes(1);
      const warmUp = Utterance.mock.instances[0];
      expect(warmUp.volume).toBe(0);
      expect(cancel).not.toHaveBeenCalled();
    });

    it("is idempotent — unlocks at most once per page session", async () => {
      // Fresh module instance so the per-session unlock flag starts clean.
      vi.resetModules();
      const speech = await import("../../utils/speech");
      speech.unlockSpeechForUserGesture();
      speech.unlockSpeechForUserGesture();
      expect(speak).toHaveBeenCalledTimes(1);
    });

    it("never throws when speechSynthesis is unavailable", () => {
      vi.unstubAllGlobals();
      expect(() => unlockSpeechForUserGesture()).not.toThrow();
    });
  });
});

describe("speech lifecycle events", () => {
  const cancel = vi.fn();
  const speak = vi.fn();
  const resume = vi.fn();
  const getVoices = vi.fn();
  const synth = { cancel, speak, resume, getVoices, speaking: false, pending: false };
  let Utterance: ReturnType<typeof vi.fn>;
  let events: Array<{ kind: string }>;
  let remove: (() => void) | null;

  beforeEach(() => {
    events = [];
    remove = null;
    cancel.mockClear();
    speak.mockClear();
    resume.mockClear();
    getVoices.mockClear();
    synth.speaking = false;
    synth.pending = false;
    Utterance = vi.fn();
    vi.stubGlobal("speechSynthesis", synth);
    vi.stubGlobal("SpeechSynthesisUtterance", Utterance);
    setPreferredVoiceURI(null);
  });

  afterEach(() => {
    remove?.();
    remove = null;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  /** Installs a listener and records every lifecycle event it receives. */
  function install(): void {
    remove = onSpeechLifecycle((event) => {
      events.push(event);
    });
  }

  it("emits speech:start and then speech:end for a successful utterance", () => {
    install();
    speakLetter("A", true);
    const utterance = Utterance.mock.instances[0];
    utterance.onstart();
    expect(events.map((e) => e.kind)).toEqual(["speech:start"]);
    utterance.onend();
    expect(events.map((e) => e.kind)).toEqual(["speech:start", "speech:end"]);
  });

  it("emits speech:error when the engine reports an utterance failure", () => {
    install();
    speakLetter("A", true);
    Utterance.mock.instances[0].onerror();
    expect(events.map((e) => e.kind)).toEqual(["speech:error"]);
  });

  it("emits no events when speech is disabled", () => {
    install();
    speakLetter("A", false);
    expect(Utterance.mock.instances).toHaveLength(0);
    expect(events).toEqual([]);
  });

  it("emits no events when speech is unsupported", () => {
    vi.unstubAllGlobals();
    install();
    speakLetter("A", true);
    expect(events).toEqual([]);
  });

  it("ignores lifecycle events from a superseded utterance so interruption cannot leave stale state", () => {
    vi.useFakeTimers();
    try {
      install();
      // The first utterance starts normally.
      speakLetter("B", true);
      const first = Utterance.mock.instances[0];
      first.onstart();
      expect(events.map((e) => e.kind)).toEqual(["speech:start"]);

      // A second, interrupting utterance supersedes the first.
      synth.speaking = true;
      speakLetter("C", true);
      expect(speak).toHaveBeenCalledTimes(1); // deferred, not yet dispatched

      // The cancelled first utterance ends late — it must not clear the state.
      first.onend();
      expect(events.map((e) => e.kind)).toEqual(["speech:start"]);

      // The replacement utterance drives its own lifecycle.
      vi.advanceTimersByTime(100);
      const second = Utterance.mock.instances[1];
      second.onstart();
      second.onend();
      expect(events.map((e) => e.kind)).toEqual(["speech:start", "speech:start", "speech:end"]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("stops delivering events after unsubscribe", () => {
    install();
    remove?.();
    remove = null;
    speakLetter("A", true);
    Utterance.mock.instances[0].onstart();
    expect(events).toEqual([]);
  });
});
