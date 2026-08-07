import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ALPHABET,
  type AlphabetRound,
  generatePlaythrough,
  generateRound,
  type Letter,
} from "../../game/alphabetLogic";

afterEach(() => {
  vi.restoreAllMocks();
});

/** Number of rounds sampled to exercise randomized behavior without flaking. */
const VARIETY_SAMPLES = 200;

function expectValidRound(round: AlphabetRound): void {
  expect(round.choices).toHaveLength(4);
  const uniqueChoices = new Set(round.choices);
  expect(uniqueChoices.size).toBe(4);
  for (const choice of round.choices) {
    expect(ALPHABET).toContain(choice);
  }
  // Exactly one correct answer: the target appears exactly once.
  expect(round.choices.filter((choice) => choice === round.target)).toHaveLength(1);
}

describe("ALPHABET", () => {
  it("contains all 26 uppercase letters exactly once", () => {
    expect(ALPHABET).toHaveLength(26);
    expect(new Set(ALPHABET).size).toBe(26);
    for (const letter of ALPHABET) {
      expect(letter).toMatch(/^[A-Z]$/);
    }
  });
});

describe("generateRound", () => {
  it("produces structurally valid rounds across many samples", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const target = ALPHABET[i % 26];
      expectValidRound(generateRound(target));
    }
  });

  it("always includes the given target", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const target = ALPHABET[i % 26];
      expect(generateRound(target).choices).toContain(target);
    }
  });

  it("uses only distinct distractors, never the target twice", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const target = ALPHABET[i % 26];
      const round = generateRound(target);
      expect(round.choices.filter((choice) => choice === target)).toHaveLength(1);
    }
  });

  it("is deterministic under a fixed random sequence", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const first = generateRound("B");
    vi.restoreAllMocks();
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const second = generateRound("B");
    expect(second).toEqual(first);
    expectValidRound(first);
  });
});

describe("generatePlaythrough", () => {
  it("returns the requested number of valid rounds", () => {
    const playthrough = generatePlaythrough(6);
    expect(playthrough).toHaveLength(6);
    for (const round of playthrough) {
      expectValidRound(round);
    }
  });

  it("defaults to 6 rounds", () => {
    expect(generatePlaythrough()).toHaveLength(6);
  });

  it("draws unique target letters within a playthrough (no duplicates)", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const targets = generatePlaythrough().map((round) => round.target);
      expect(new Set(targets).size).toBe(targets.length);
    }
  });

  it("draws targets uniformly from the full alphabet across many playthroughs", () => {
    const seen = new Set<Letter>();
    for (let i = 0; i < 50; i++) {
      for (const round of generatePlaythrough()) {
        seen.add(round.target);
      }
    }
    expect(seen).toEqual(new Set(ALPHABET));
  });

  it("keeps difficulty fixed: every round has exactly 4 choices", () => {
    for (const round of generatePlaythrough()) {
      expect(round.choices).toHaveLength(4);
    }
  });

  it("produces different playthroughs under different random sequences", () => {
    vi.spyOn(Math, "random").mockReturnValueOnce(0.05).mockReturnValueOnce(0.35);
    const first = generatePlaythrough(6);
    vi.restoreAllMocks();
    vi.spyOn(Math, "random").mockReturnValueOnce(0.95).mockReturnValueOnce(0.65);
    const second = generatePlaythrough(6);
    expect(first).not.toEqual(second);
  });

  it("is deterministic under a fixed random sequence", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const first = generatePlaythrough();
    vi.restoreAllMocks();
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const second = generatePlaythrough();
    expect(second).toEqual(first);
  });
});
