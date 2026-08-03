import { afterEach, describe, expect, it, vi } from "vitest";
import {
  generateLetterTiles,
  generateWordBuildPlaythrough,
  generateWordPlaythrough,
  generateWordRound,
  isCorrectWord,
  WORD_POOL,
  type WordRound,
} from "../../game/wordLogic";

afterEach(() => {
  vi.restoreAllMocks();
});

/** Number of rounds sampled to exercise randomized behavior without flaking. */
const VARIETY_SAMPLES = 200;

function expectValidWordRound(round: WordRound): void {
  expect(round.choices).toHaveLength(4);
  const uniqueChoices = new Set(round.choices);
  expect(uniqueChoices.size).toBe(4);
  for (const choice of round.choices) {
    expect(WORD_POOL.some((entry) => entry.word === choice)).toBe(true);
  }
  // Exactly one correct answer: the target appears exactly once.
  expect(round.choices.filter((choice) => choice === round.target)).toHaveLength(1);
  // Pre-reader guard: no two choices share a first letter.
  const firstLetters = round.choices.map((choice) => choice[0]);
  expect(new Set(firstLetters).size).toBe(4);
}

describe("WORD_POOL", () => {
  it("contains exactly the 9 first words", () => {
    expect(WORD_POOL).toHaveLength(9);
  });

  it("contains the expected words", () => {
    const words = WORD_POOL.map((entry) => entry.word).sort();
    expect(words).toEqual(["BALL", "BOAT", "CAR", "CAT", "DOG", "FISH", "FROG", "PIG", "TREE"]);
  });

  it("has no duplicate words", () => {
    expect(new Set(WORD_POOL.map((entry) => entry.word)).size).toBe(WORD_POOL.length);
  });

  it("stores every word in uppercase letters only", () => {
    for (const entry of WORD_POOL) {
      expect(entry.word).toMatch(/^[A-Z]+$/);
    }
  });

  it("records the letter count matching the word length", () => {
    for (const entry of WORD_POOL) {
      expect(entry.letters).toBe(entry.word.length);
    }
  });

  it("classifies 3-letter words as tier 3 and 4-letter words as tier 4", () => {
    expect(WORD_POOL.filter((entry) => entry.tier === 3)).toHaveLength(4);
    expect(WORD_POOL.filter((entry) => entry.tier === 4)).toHaveLength(5);
    for (const entry of WORD_POOL) {
      expect(entry.tier).toBe(entry.word.length === 3 ? 3 : 4);
    }
  });

  it("assigns every word a non-empty prompt texture key", () => {
    for (const entry of WORD_POOL) {
      expect(entry.promptTexture.length).toBeGreaterThan(0);
    }
  });

  it("uses a unique prompt texture per word", () => {
    expect(new Set(WORD_POOL.map((entry) => entry.promptTexture)).size).toBe(WORD_POOL.length);
  });
});

describe("generateWordRound", () => {
  it("produces structurally valid rounds for every pool word across many samples", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const target = WORD_POOL[i % WORD_POOL.length];
      expectValidWordRound(generateWordRound(target));
    }
  });

  it("always includes the given target word", () => {
    for (const entry of WORD_POOL) {
      expect(generateWordRound(entry).choices).toContain(entry.word);
    }
  });

  it("never uses a distractor that shares the target's first letter", () => {
    for (const entry of WORD_POOL) {
      const round = generateWordRound(entry);
      for (const choice of round.choices) {
        if (choice !== entry.word) {
          expect(choice[0]).not.toBe(entry.word[0]);
        }
      }
    }
  });

  it("is deterministic under a fixed random sequence", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const first = generateWordRound(WORD_POOL[0]);
    vi.restoreAllMocks();
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const second = generateWordRound(WORD_POOL[0]);
    expect(second).toEqual(first);
    expectValidWordRound(first);
  });
});

describe("generateWordPlaythrough", () => {
  it("returns the requested number of valid rounds", () => {
    const playthrough = generateWordPlaythrough(6);
    expect(playthrough).toHaveLength(6);
    for (const round of playthrough) {
      expectValidWordRound(round);
    }
  });

  it("defaults to 6 rounds", () => {
    expect(generateWordPlaythrough()).toHaveLength(6);
  });

  it("draws unique target words within a playthrough (no duplicates)", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const targets = generateWordPlaythrough().map((round) => round.target);
      expect(new Set(targets).size).toBe(targets.length);
    }
  });

  it("draws targets uniformly from the full pool across many playthroughs", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 50; i++) {
      for (const round of generateWordPlaythrough()) {
        seen.add(round.target);
      }
    }
    expect(seen).toEqual(new Set(WORD_POOL.map((entry) => entry.word)));
  });

  it("is deterministic under a fixed random sequence", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const first = generateWordPlaythrough();
    vi.restoreAllMocks();
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const second = generateWordPlaythrough();
    expect(second).toEqual(first);
  });
});

describe("isCorrectWord", () => {
  it("returns true only for the round's target", () => {
    const round: WordRound = { target: "CAT", choices: ["CAT", "DOG", "PIG", "CAR"] };
    expect(isCorrectWord(round, "CAT")).toBe(true);
    expect(isCorrectWord(round, "DOG")).toBe(false);
    expect(isCorrectWord(round, "CAR")).toBe(false);
  });
});

describe("generateWordBuildPlaythrough", () => {
  it("returns the requested number of pool words", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const playthrough = generateWordBuildPlaythrough(3);
      expect(playthrough).toHaveLength(3);
      for (const entry of playthrough) {
        expect(WORD_POOL).toContain(entry);
      }
    }
  });

  it("defaults to 3 words", () => {
    expect(generateWordBuildPlaythrough()).toHaveLength(3);
  });

  it("orders words easy-first: every 3-letter word before every 4-letter word", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const playthrough = generateWordBuildPlaythrough(3);
      const firstTier4Index = playthrough.findIndex((entry) => entry.tier === 4);
      const lastTier3Index = playthrough.findIndex((entry) => entry.tier === 3);
      if (firstTier4Index !== -1 && lastTier3Index !== -1) {
        expect(firstTier4Index).toBeGreaterThan(lastTier3Index);
      }
    }
  });

  it("never repeats a word within a playthrough", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const words = generateWordBuildPlaythrough(3).map((entry) => entry.word);
      expect(new Set(words).size).toBe(words.length);
    }
  });

  it("includes at least one 4-letter word in every 3-word playthrough", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const playthrough = generateWordBuildPlaythrough(3);
      expect(playthrough.some((entry) => entry.tier === 4)).toBe(true);
    }
  });

  it("varies the drawn words across playthroughs", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 50; i++) {
      for (const entry of generateWordBuildPlaythrough(3)) {
        seen.add(entry.word);
      }
    }
    expect(seen.size).toBeGreaterThan(4);
  });

  it("is deterministic under a fixed random sequence", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const first = generateWordBuildPlaythrough();
    vi.restoreAllMocks();
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const second = generateWordBuildPlaythrough();
    expect(second).toEqual(first);
  });
});

describe("generateLetterTiles", () => {
  it("always returns exactly 6 tiles", () => {
    for (const entry of WORD_POOL) {
      for (let i = 0; i < VARIETY_SAMPLES; i++) {
        expect(generateLetterTiles(entry.word)).toHaveLength(6);
      }
    }
  });

  it("contains every unique letter of the word", () => {
    for (const entry of WORD_POOL) {
      for (let i = 0; i < VARIETY_SAMPLES; i++) {
        const tiles = generateLetterTiles(entry.word);
        for (const letter of new Set(entry.word.split(""))) {
          expect(tiles).toContain(letter);
        }
      }
    }
  });

  it("contains no duplicate tiles", () => {
    for (const entry of WORD_POOL) {
      for (let i = 0; i < VARIETY_SAMPLES; i++) {
        const tiles = generateLetterTiles(entry.word);
        expect(new Set(tiles).size).toBe(6);
      }
    }
  });

  it("uses only distractor letters not present in the word", () => {
    for (const entry of WORD_POOL) {
      const tiles = generateLetterTiles(entry.word);
      const wordLetters = new Set(entry.word.split(""));
      const distractors = tiles.filter((tile) => !wordLetters.has(tile));
      expect(distractors.length).toBeGreaterThanOrEqual(2);
      for (const distractor of distractors) {
        expect(wordLetters.has(distractor)).toBe(false);
      }
    }
  });

  it("is deterministic under a fixed random sequence", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const first = generateLetterTiles("CAT");
    vi.restoreAllMocks();
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const second = generateLetterTiles("CAT");
    expect(second).toEqual(first);
  });
});
