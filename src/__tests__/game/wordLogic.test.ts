import { describe, expect, it } from "vitest";
import { WORD_POOL } from "../../game/wordLogic";

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
