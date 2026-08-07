import { afterEach, describe, expect, it, vi } from "vitest";

import {
  appendNote,
  FROG_COUNT,
  generateSequence,
  isRoundComplete,
  isWin,
  START_LENGTH,
  validateInput,
  WIN_TARGET,
} from "../../game/musicalMemoryLogic";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("generateSequence", () => {
  it("produces a sequence of the given length (start length 2)", () => {
    const seq = generateSequence(START_LENGTH);
    expect(seq).toHaveLength(START_LENGTH);
  });

  it("produces a sequence of arbitrary length", () => {
    expect(generateSequence(4)).toHaveLength(4);
    expect(generateSequence(6)).toHaveLength(6);
  });

  it("every index is in range 0-2", () => {
    const seq = generateSequence(10);
    for (const note of seq) {
      expect(note).toBeGreaterThanOrEqual(0);
      expect(note).toBeLessThan(FROG_COUNT);
    }
  });

  it("is deterministic when Math.random is mocked", () => {
    const spy = vi.spyOn(Math, "random");
    spy.mockReturnValueOnce(0.0).mockReturnValueOnce(0.5);
    const seq = generateSequence(2);
    // Math.floor(0.0 * 3) = 0, Math.floor(0.5 * 3) = 1
    expect(seq).toEqual([0, 1]);
  });

  it("never emits a run longer than 2 consecutive same-frog notes", () => {
    // A constant 0.0 would otherwise produce all-green sequences; the cap
    // must force a different frog after two repeats.
    const spy = vi.spyOn(Math, "random");
    spy.mockReturnValue(0.0);
    const seq = generateSequence(12);
    for (let i = 2; i < seq.length; i++) {
      expect(seq[i] === seq[i - 1] && seq[i - 1] === seq[i - 2]).toBe(false);
    }
  });

  it("keeps every note in range even when the run cap forces a different frog", () => {
    const spy = vi.spyOn(Math, "random");
    spy.mockReturnValue(0.0);
    const seq = generateSequence(12);
    for (const note of seq) {
      expect(note).toBeGreaterThanOrEqual(0);
      expect(note).toBeLessThan(FROG_COUNT);
    }
  });
});

describe("appendNote", () => {
  it("returns a new sequence grown by exactly 1", () => {
    const original = [0, 1];
    const grown = appendNote(original);
    expect(grown).toHaveLength(original.length + 1);
  });

  it("appended note is in range 0-2", () => {
    const grown = appendNote([0, 1, 2]);
    const lastNote = grown[grown.length - 1];
    expect(lastNote).toBeGreaterThanOrEqual(0);
    expect(lastNote).toBeLessThan(FROG_COUNT);
  });

  it("does not mutate the original sequence", () => {
    const original = [0, 1];
    const originalCopy = [...original];
    appendNote(original);
    expect(original).toEqual(originalCopy);
  });

  it("preserves the original notes in order", () => {
    const original = [2, 0, 1];
    const grown = appendNote(original);
    expect(grown.slice(0, original.length)).toEqual(original);
  });

  it("is deterministic when Math.random is mocked", () => {
    const spy = vi.spyOn(Math, "random");
    spy.mockReturnValueOnce(0.99);
    const grown = appendNote([0]);
    // Math.floor(0.99 * 3) = 2
    expect(grown).toEqual([0, 2]);
  });

  it("avoids a third consecutive same-frog note", () => {
    // [0, 0] is already a run of 2; the appended note must not be 0.
    const spy = vi.spyOn(Math, "random");
    spy.mockReturnValue(0.0);
    const grown = appendNote([0, 0]);
    expect(grown).toHaveLength(3);
    expect(grown.slice(0, 2)).toEqual([0, 0]);
    expect(grown[2]).not.toBe(0);
  });

  it("appends normally when the sequence has no run to cap", () => {
    const spy = vi.spyOn(Math, "random");
    spy.mockReturnValue(0.99);
    const grown = appendNote([0, 2]);
    // Math.floor(0.99 * 3) = 2 — no run, free pick.
    expect(grown).toEqual([0, 2, 2]);
  });
});

describe("validateInput", () => {
  it("returns correct=true and advances index when tap matches sequence at current index", () => {
    const seq = [0, 1, 2];
    const result = validateInput(seq, 0, 0);
    expect(result.correct).toBe(true);
    expect(result.nextIndex).toBe(1);
  });

  it("advances index correctly for each position in the sequence", () => {
    const seq = [2, 0, 1];
    let idx = 0;
    for (const expected of seq) {
      const result = validateInput(seq, idx, expected);
      expect(result.correct).toBe(true);
      expect(result.nextIndex).toBe(idx + 1);
      idx = result.nextIndex;
    }
  });

  it("returns correct=false when tap does not match (mistake)", () => {
    const seq = [0, 1, 2];
    const result = validateInput(seq, 1, 2); // should be 1, tapped 2
    expect(result.correct).toBe(false);
  });

  it("resets nextIndex to 0 on wrong tap (no forward progress; ready for replay)", () => {
    const seq = [0, 1, 2];
    const result = validateInput(seq, 2, 0); // should be 2, tapped 0
    expect(result.correct).toBe(false);
    expect(result.nextIndex).toBe(0);
  });
});

describe("isRoundComplete", () => {
  it("returns true when inputIndex reaches sequence length", () => {
    const seq = [0, 1];
    expect(isRoundComplete(seq, 2)).toBe(true);
  });

  it("returns false when inputIndex is less than sequence length", () => {
    const seq = [0, 1, 2];
    expect(isRoundComplete(seq, 0)).toBe(false);
    expect(isRoundComplete(seq, 1)).toBe(false);
    expect(isRoundComplete(seq, 2)).toBe(false);
  });
});

describe("isWin", () => {
  it("returns true when sequence length reaches the win target (6)", () => {
    expect(isWin(WIN_TARGET)).toBe(true);
  });

  it("returns false when sequence length is less than the win target", () => {
    expect(isWin(START_LENGTH)).toBe(false);
    expect(isWin(3)).toBe(false);
    expect(isWin(4)).toBe(false);
    expect(isWin(5)).toBe(false);
  });

  it("accepts a custom target", () => {
    expect(isWin(4, 4)).toBe(true);
    expect(isWin(3, 4)).toBe(false);
  });
});

describe("mistake handling (no-fail design)", () => {
  it("wrong tap resets inputIndex to 0 without changing the sequence", () => {
    const seq = [0, 2, 1];
    const seqCopy = [...seq];
    const result = validateInput(seq, 1, 0); // should be 2, tapped 0
    expect(result.correct).toBe(false);
    expect(result.nextIndex).toBe(0);
    // Sequence is unchanged
    expect(seq).toEqual(seqCopy);
  });

  it("wrong tap at first index also resets to 0 (no progress lost)", () => {
    const seq = [1, 0, 2];
    const result = validateInput(seq, 0, 2); // should be 1, tapped 2
    expect(result.correct).toBe(false);
    expect(result.nextIndex).toBe(0);
  });

  it("round count logic is unaffected by mistakes (isWin checks length, not attempts)", () => {
    const seq = [0, 1]; // length 2
    // Even after a mistake, the sequence length hasn't changed
    validateInput(seq, 0, 2); // wrong tap
    expect(isWin(seq.length)).toBe(false); // still at round 1, not won
  });
});
