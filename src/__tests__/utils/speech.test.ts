import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  isSpeechSupported,
  speakLetter,
  speakNumber,
  speakWord,
} from "../../utils/speech";

describe("speech", () => {
  const cancel = vi.fn();
  const speak = vi.fn();
  let Utterance: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    cancel.mockClear();
    speak.mockClear();
    Utterance = vi.fn();
    vi.stubGlobal("speechSynthesis", { cancel, speak });
    vi.stubGlobal("SpeechSynthesisUtterance", Utterance);
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

    it("cancels prior utterances before speaking a new one", () => {
      speakLetter("A", true);
      speakLetter("B", true);
      expect(cancel).toHaveBeenCalledTimes(2);
      expect(Utterance.mock.instances).toHaveLength(2);
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

    it("cancels prior utterances before speaking a new word", () => {
      speakWord("DOG", true);
      speakWord("PIG", true);
      expect(cancel).toHaveBeenCalledTimes(2);
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

    it("cancels prior utterances before speaking a new number", () => {
      speakNumber(2, true);
      speakNumber(4, true);
      expect(cancel).toHaveBeenCalledTimes(2);
      expect(Utterance.mock.instances).toHaveLength(2);
    });

    it("never throws when speechSynthesis is unavailable", () => {
      vi.unstubAllGlobals();
      expect(() => speakNumber(3, true)).not.toThrow();
      expect(speakNumber(3, true)).toBe(false);
    });
  });
});
