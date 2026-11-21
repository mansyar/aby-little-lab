import { describe, expect, it } from "vitest";
import { animals } from "../../game/art/animals";
import { food } from "../../game/art/food";
import { items } from "../../game/art/items";
import { shapes } from "../../game/art/shapes";
import { toys } from "../../game/art/toys";
import {
  buildPlaythrough,
  buildRound,
  DECODE_POOL,
  type DecodeRound,
  getDecodeWord,
  isCorrect,
} from "../../game/decodeLogic";
import { generateWordRound, WORD_POOL } from "../../game/wordLogic";
import { WORD_VARIANTS, wordVariantPool } from "../../game/wordVariants";
import { mulberry32 } from "../helpers/randomHelper";

const VARIETY_SAMPLES = 200;

function expectValidDecodeRound(round: DecodeRound): void {
  expect(round.choices).toHaveLength(4);
  expect(new Set(round.choices).size).toBe(4);
  for (const choice of round.choices) {
    expect(DECODE_POOL.some((entry) => entry.word === choice)).toBe(true);
  }
  expect(round.choices.filter((choice) => choice === round.target)).toHaveLength(1);
  const firstLetters = round.choices.map((choice) => choice[0]);
  expect(new Set(firstLetters).size).toBe(4);
  // Confusable guard: no two choices share a confusable family with target or each other
  // (C,G,O,Q) (I,L,T) (M,W) — mirror alphabetLogic families
  const families: string[][] = [
    ["C", "G", "O", "Q"],
    ["I", "L", "T"],
    ["M", "W"],
  ];
  const isConfusable = (a: string, b: string) =>
    families.some((f) => f.includes(a) && f.includes(b));
  for (const choice of round.choices) {
    if (choice !== round.target) {
      expect(isConfusable(choice[0], round.target[0])).toBe(false);
      expect(choice[0]).not.toBe(round.target[0]);
    }
  }
  // Pairwise distinct families among distractors
  for (let i = 0; i < round.choices.length; i++) {
    for (let j = i + 1; j < round.choices.length; j++) {
      const a = round.choices[i][0];
      const b = round.choices[j][0];
      if (a !== b) expect(isConfusable(a, b)).toBe(false);
    }
  }
  expect(round.promptTexture.length).toBeGreaterThan(0);
  const entry = DECODE_POOL.find((e) => e.word === round.target);
  expect(entry?.promptTexture).toBe(round.promptTexture);
}

describe("DECODE_POOL", () => {
  it("contains at least the 60 decode words (the full shared WORD_POOL)", () => {
    expect(DECODE_POOL.length).toBeGreaterThanOrEqual(60);
  });

  it("contains the expected words", () => {
    const words = DECODE_POOL.map((entry) => entry.word).sort();
    expect(words).toEqual([
      "APE",
      "ARCH",
      "BALL",
      "BEAR",
      "BED",
      "BELL",
      "BOAT",
      "BONE",
      "BOOT",
      "BOX",
      "BUG",
      "BUN",
      "CAB",
      "CAP",
      "CAR",
      "CAT",
      "CUBE",
      "CUP",
      "DART",
      "DICE",
      "DOG",
      "DOOR",
      "DOT",
      "DROP",
      "DRUM",
      "DUCK",
      "EAR",
      "FISH",
      "FIVE",
      "FLY",
      "FOX",
      "FROG",
      "GEM",
      "HAT",
      "HEX",
      "HUT",
      "JET",
      "KITE",
      "LAMP",
      "LOVE",
      "MAP",
      "MOON",
      "NUT",
      "OVAL",
      "OWL",
      "PEEL",
      "PIE",
      "PIG",
      "PLUS",
      "RAIN",
      "RING",
      "ROOT",
      "SOCK",
      "STAR",
      "STOP",
      "SUN",
      "TENT",
      "TILE",
      "TOY",
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
    expect(DECODE_POOL.filter((entry) => entry.tier === 3).length).toBeGreaterThanOrEqual(10);
    expect(DECODE_POOL.filter((entry) => entry.tier === 4).length).toBeGreaterThanOrEqual(10);
    expect(DECODE_POOL.filter((entry) => entry.tier === 3).length).toBe(
      DECODE_POOL.filter((entry) => entry.word.length === 3).length,
    );
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
    // Fail loud (mirroring buildShellAssets): a prompt key absent from the art
    // groups the Word scene preloads, or from the two shell keys, is a bug.
    const preloadedKeys = new Set<string>([
      ...[...animals.assets, ...food.assets, ...items.assets, ...shapes.assets, ...toys.assets].map(
        (asset) => asset.key,
      ),
      "mascot_idle",
      "frog_red",
    ]);
    for (const entry of DECODE_POOL) {
      expect(
        preloadedKeys.has(entry.promptTexture),
        `unknown prompt texture key: ${entry.promptTexture}`,
      ).toBe(true);
    }
  });

  it("maps new words to the approved item textures", () => {
    const byWord = new Map(DECODE_POOL.map((entry) => [entry.word, entry.promptTexture]));
    expect(byWord.get("FOX")).toBe("sm_fox");
    expect(byWord.get("CUP")).toBe("sm_cup");
    expect(byWord.get("MAP")).toBe("sm_map");
    expect(byWord.get("BED")).toBe("sm_bed");
    expect(byWord.get("BOX")).toBe("toy_box");
    expect(byWord.get("KITE")).toBe("sm_kite");
    expect(byWord.get("SOCK")).toBe("sm_sock");
    expect(byWord.get("BOOT")).toBe("sm_boot");
    expect(byWord.get("RING")).toBe("shape_ring");
    expect(byWord.get("PLUS")).toBe("shape_plus");
  });

  it("reuses every WORD_POOL entry exactly", () => {
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

describe("buildRound", () => {
  it("produces structurally valid rounds for every pool word across many samples", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const target = DECODE_POOL[i % DECODE_POOL.length];
      expectValidDecodeRound(buildRound(target));
    }
  });

  it("always includes the given target word", () => {
    for (const entry of DECODE_POOL) {
      expect(buildRound(entry).choices).toContain(entry.word);
    }
  });

  it("never uses a distractor that shares the target's first letter", () => {
    for (const entry of DECODE_POOL) {
      const round = buildRound(entry);
      for (const choice of round.choices) {
        if (choice !== entry.word) {
          expect(choice[0]).not.toBe(entry.word[0]);
        }
      }
    }
  });

  it("excludes confusable-family distractors (C/G/O/Q, I/L/T, M/W)", () => {
    const families = [
      ["C", "G", "O", "Q"],
      ["I", "L", "T"],
      ["M", "W"],
    ];
    const isConfusable = (a: string, b: string) =>
      families.some((f) => f.includes(a) && f.includes(b));
    for (const entry of DECODE_POOL) {
      const round = buildRound(entry);
      for (const choice of round.choices) {
        if (choice !== entry.word) {
          expect(isConfusable(choice[0], entry.word[0])).toBe(false);
        }
      }
      // pairwise among choices
      for (let i = 0; i < round.choices.length; i++) {
        for (let j = i + 1; j < round.choices.length; j++) {
          const a = round.choices[i][0];
          const b = round.choices[j][0];
          if (a !== b) expect(isConfusable(a, b)).toBe(false);
        }
      }
    }
  });

  it("is deterministic under a seeded rng injection", () => {
    const first = buildRound(DECODE_POOL[0], mulberry32(1234));
    const second = buildRound(DECODE_POOL[0], mulberry32(1234));
    expect(second).toEqual(first);
    expectValidDecodeRound(first);
  });

  it("exposes the target prompt texture", () => {
    for (const entry of DECODE_POOL) {
      expect(buildRound(entry).promptTexture).toBe(entry.promptTexture);
    }
  });
});

describe("buildPlaythrough", () => {
  it("returns the requested number of valid rounds", () => {
    const playthrough = buildPlaythrough(6);
    expect(playthrough).toHaveLength(6);
    for (const round of playthrough) expectValidDecodeRound(round);
  });

  it("defaults to 6 rounds", () => {
    expect(buildPlaythrough()).toHaveLength(6);
  });

  it("draws unique target words within a playthrough (no duplicates)", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const targets = buildPlaythrough().map((r) => r.target);
      expect(new Set(targets).size).toBe(targets.length);
    }
  });

  it("orders 3-letter targets before 4-letter targets (easy first, 3+3)", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const tiers = buildPlaythrough().map((r) => getDecodeWord(r.target)?.tier ?? 0);
      expect(tiers.filter((t) => t === 3)).toHaveLength(3);
      expect(tiers.filter((t) => t === 4)).toHaveLength(3);
      expect(tiers).toEqual([...tiers].sort((a, b) => a - b));
    }
  });

  it("is deterministic under a seeded rng injection", () => {
    const first = buildPlaythrough(6, 0, mulberry32(1234));
    const second = buildPlaythrough(6, 0, mulberry32(1234));
    expect(second).toEqual(first);
  });

  it("draws targets uniformly within each tier across many playthroughs", () => {
    const seen3 = new Set<string>();
    const seen4 = new Set<string>();
    for (let i = 0; i < 200; i++) {
      for (const round of buildPlaythrough()) {
        const tier = getDecodeWord(round.target)?.tier ?? 0;
        if (tier === 3) seen3.add(round.target);
        else if (tier === 4) seen4.add(round.target);
      }
    }
    expect(seen3).toEqual(new Set(DECODE_POOL.filter((e) => e.tier === 3).map((e) => e.word)));
    expect(seen4).toEqual(new Set(DECODE_POOL.filter((e) => e.tier === 4).map((e) => e.word)));
  });
});

describe("buildPlaythrough (adaptive shift)", () => {
  function tierSequence(rounds: DecodeRound[]): number[] {
    return rounds.map((r) => getDecodeWord(r.target)?.tier ?? 0);
  }

  it("serves four 3-letter rounds at shift -1 (easy)", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const tiers = tierSequence(buildPlaythrough(6, -1));
      expect(tiers.filter((t) => t === 3)).toHaveLength(4);
      expect(tiers.filter((t) => t === 4)).toHaveLength(2);
      expect(tiers).toEqual([...tiers].sort((a, b) => a - b));
    }
  });

  it("keeps the classic 3+3 tier split at shift 0", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const tiers = tierSequence(buildPlaythrough(6, 0));
      expect(tiers.filter((t) => t === 3)).toHaveLength(3);
      expect(tiers.filter((t) => t === 4)).toHaveLength(3);
      expect(tiers).toEqual([...tiers].sort((a, b) => a - b));
    }
  });

  it("serves two 3-letter rounds at shift +1 (hard)", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const tiers = tierSequence(buildPlaythrough(6, 1));
      expect(tiers.filter((t) => t === 3)).toHaveLength(2);
      expect(tiers.filter((t) => t === 4)).toHaveLength(4);
      expect(tiers).toEqual([...tiers].sort((a, b) => a - b));
    }
  });

  it("keeps every round valid and uniquely targeted at every shift", { timeout: 120_000 }, () => {
    for (const shift of [-1, 0, 1] as const) {
      for (let i = 0; i < VARIETY_SAMPLES; i++) {
        const playthrough = buildPlaythrough(6, shift);
        const targets = playthrough.map((r) => r.target);
        expect(new Set(targets).size).toBe(targets.length);
        for (const round of playthrough) expectValidDecodeRound(round);
      }
    }
  });

  it("is deterministic under a seeded rng injection for each shift", () => {
    for (const shift of [-1, 0, 1] as const) {
      const first = buildPlaythrough(6, shift, mulberry32(1234));
      const second = buildPlaythrough(6, shift, mulberry32(1234));
      expect(second).toEqual(first);
    }
  });
});

describe("isCorrect", () => {
  it("returns true only for the target index", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const round = buildRound(DECODE_POOL[i % DECODE_POOL.length]);
      const targetIdx = round.choices.indexOf(round.target);
      for (let idx = 0; idx < 4; idx++) {
        expect(isCorrect(round, idx)).toBe(idx === targetIdx);
      }
    }
  });

  it("returns false for out-of-range indices", () => {
    const round = buildRound(DECODE_POOL[0]);
    expect(isCorrect(round, -1)).toBe(false);
    expect(isCorrect(round, 4)).toBe(false);
  });
});

describe("word content variants", () => {
  it("exposes exactly two signature variants", () => {
    expect(WORD_VARIANTS).toHaveLength(2);
    expect(new Set(WORD_VARIANTS.map((variant) => variant.id)).size).toBe(2);
  });

  it("each variant is a non-empty strict subset with unique word keys", () => {
    const allWords = new Set(WORD_POOL.map((entry) => entry.word));
    for (const variant of WORD_VARIANTS) {
      expect(variant.words.length).toBeGreaterThan(0);
      expect(variant.words.length).toBeLessThan(WORD_POOL.length);
      expect(new Set(variant.words.map((entry) => entry.word)).size).toBe(variant.words.length);
      for (const entry of variant.words) {
        expect(allWords.has(entry.word)).toBe(true);
      }
    }
  });

  it("selects a variant purely and rejects unknown ids", () => {
    for (const variant of WORD_VARIANTS) {
      expect(wordVariantPool(variant.id)).toEqual(variant.words);
      expect(wordVariantPool(variant.id)).toEqual(wordVariantPool(variant.id));
    }
    expect(() => wordVariantPool("nope" as (typeof WORD_VARIANTS)[number]["id"])).toThrow(
      /unknown word variant/,
    );
  });

  it("variant selection does not alter word rule functions (opt-in only)", () => {
    const target = WORD_POOL[0];
    const roundBefore = generateWordRound(target, mulberry32(1234));
    const playBefore = buildPlaythrough(6, 0, mulberry32(1234));

    wordVariantPool("animals-and-food");

    expect(generateWordRound(target, mulberry32(1234))).toEqual(roundBefore);
    expect(buildPlaythrough(6, 0, mulberry32(1234))).toEqual(playBefore);
    // Rules keep drawing from the full pool, not the selected subset.
    for (const entry of WORD_POOL) {
      expect(generateWordRound(entry).choices).toContain(entry.word);
    }
  });
});
