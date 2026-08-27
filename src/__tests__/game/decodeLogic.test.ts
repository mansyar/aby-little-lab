import { describe, expect, it } from "vitest";
import { DECODE_POOL, getDecodeWord } from "../../game/decodeLogic";
import { WORD_POOL } from "../../game/wordLogic";

describe("DECODE_POOL", () => {
  it("contains exactly the 22 decode words (18 shared + 4 new)", () => {
    expect(DECODE_POOL).toHaveLength(22);
  });

  it("contains the expected words", () => {
    const words = DECODE_POOL.map((entry) => entry.word).sort();
    expect(words).toEqual([
      "BALL",
      "BEAR",
      "BED",
      "BOAT",
      "BONE",
      "BUG",
      "CAR",
      "CAT",
      "CUP",
      "DOG",
      "DRUM",
      "DUCK",
      "FISH",
      "FOX",
      "FROG",
      "HAT",
      "MAP",
      "OWL",
      "PIG",
      "STAR",
      "SUN",
      "TREE",
    ]);
  });

  it("has no duplicate words", () => {
    expect(new Set(DECODE_POOL.map((entry) => entry.word)).size).toBe(DECODE_POOL.length);
  });

  it("stores every word in uppercase letters only", () => {
    for (const entry of DECODE_POOL) {
      expect(entry.word).toMatch(/^[A-Z]+$/);
    }
  });

  it("records the letter count matching the word length", () => {
    for (const entry of DECODE_POOL) {
      expect(entry.letters).toBe(entry.word.length);
    }
  });

  it("classifies 3-letter words as tier 3 and 4-letter words as tier 4", () => {
    expect(DECODE_POOL.filter((entry) => entry.tier === 3)).toHaveLength(12);
    expect(DECODE_POOL.filter((entry) => entry.tier === 4)).toHaveLength(10);
    for (const entry of DECODE_POOL) {
      expect(entry.tier).toBe(entry.word.length === 3 ? 3 : 4);
    }
  });

  it("assigns every word a non-empty prompt texture key", () => {
    for (const entry of DECODE_POOL) {
      expect(entry.promptTexture.length).toBeGreaterThan(0);
    }
  });

  it("uses a unique prompt texture per word", () => {
    expect(new Set(DECODE_POOL.map((entry) => entry.promptTexture)).size).toBe(DECODE_POOL.length);
  });

  it("uses only PreloadScene-registered prompt texture keys", () => {
    const KNOWN_TEXTURE_KEYS = new Set([
      "animal_cat",
      "animal_dog",
      "animal_pig",
      "sm_car",
      "mascot_idle",
      "sm_sun",
      "sm_hat",
      "sm_bug",
      "frog_red",
      "sm_ball",
      "food_fish",
      "sm_boat",
      "sm_tree",
      "food_bone",
      "shape_star",
      "toy_drum",
      "toy_teddy_bear",
      "sm_duck",
      "sm_fox",
      "sm_cup",
      "sm_map",
      "sm_bed",
    ]);
    for (const entry of DECODE_POOL) {
      expect(KNOWN_TEXTURE_KEYS.has(entry.promptTexture)).toBe(true);
    }
    expect(new Set(DECODE_POOL.map((entry) => entry.promptTexture)).size).toBe(
      KNOWN_TEXTURE_KEYS.size,
    );
  });

  it("maps new words to the approved item textures", () => {
    const byWord = new Map(DECODE_POOL.map((entry) => [entry.word, entry.promptTexture]));
    expect(byWord.get("FOX")).toBe("sm_fox");
    expect(byWord.get("CUP")).toBe("sm_cup");
    expect(byWord.get("MAP")).toBe("sm_map");
    expect(byWord.get("BED")).toBe("sm_bed");
  });

  it("reuses the original 18 WORD_POOL entries exactly", () => {
    const decodeWords = new Set(DECODE_POOL.map((e) => e.word));
    for (const entry of WORD_POOL) {
      expect(decodeWords.has(entry.word)).toBe(true);
      const match = DECODE_POOL.find((e) => e.word === entry.word);
      expect(match?.promptTexture).toBe(entry.promptTexture);
      expect(match?.tier).toBe(entry.tier);
    }
  });

  it("getDecodeWord looks up by uppercase spelling", () => {
    expect(getDecodeWord("FOX")?.promptTexture).toBe("sm_fox");
    expect(getDecodeWord("CAT")?.promptTexture).toBe("animal_cat");
    expect(getDecodeWord("UNKNOWN")).toBeUndefined();
  });
});
