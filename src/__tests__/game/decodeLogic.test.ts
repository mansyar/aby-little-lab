import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildPlaythrough,
  buildRound,
  DECODE_POOL,
  type DecodeRound,
  getDecodeWord,
  isCorrect,
} from "../../game/decodeLogic";
import { WORD_POOL } from "../../game/wordLogic";

afterEach(() => {
  vi.restoreAllMocks();
});

const VARIETY_SAMPLES = 200;

function expectValidDecodeRound(round: DecodeRound): void {
  expect(round.choices).toHaveLength(4);
  expect(new Set(round.choices).size).toBe(4);
  for (const choice of round.choices) {
    expect(DECODE_POOL.some((entry) => entry.word === choice)).toBe(true);
  }
  expect(round.choices.filter((choice) => choice === round.target)).toHaveLength(1);
  const firstLetters = round.choices.map((choice) => choice[0]!);
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
      expect(isConfusable(choice[0]!, round.target[0]!)).toBe(false);
      expect(choice[0]).not.toBe(round.target[0]);
    }
  }
  // Pairwise distinct families among distractors
  for (let i = 0; i < round.choices.length; i++) {
    for (let j = i + 1; j < round.choices.length; j++) {
      const a = round.choices[i]![0]!;
      const b = round.choices[j]![0]!;
      if (a !== b) expect(isConfusable(a, b)).toBe(false);
    }
  }
  expect(round.promptTexture.length).toBeGreaterThan(0);
  const entry = DECODE_POOL.find((e) => e.word === round.target);
  expect(entry?.promptTexture).toBe(round.promptTexture);
}

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

describe("buildRound", () => {
  it("produces structurally valid rounds for every pool word across many samples", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const target = DECODE_POOL[i % DECODE_POOL.length]!;
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
          expect(isConfusable(choice[0]!, entry.word[0]!)).toBe(false);
        }
      }
      // pairwise among choices
      for (let i = 0; i < round.choices.length; i++) {
        for (let j = i + 1; j < round.choices.length; j++) {
          const a = round.choices[i]![0]!;
          const b = round.choices[j]![0]!;
          if (a !== b) expect(isConfusable(a, b)).toBe(false);
        }
      }
    }
  });

  it("is deterministic under a fixed random sequence", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const first = buildRound(DECODE_POOL[0]!);
    vi.restoreAllMocks();
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const second = buildRound(DECODE_POOL[0]!);
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

  it("is deterministic under a fixed random sequence", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const first = buildPlaythrough();
    vi.restoreAllMocks();
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const second = buildPlaythrough();
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

  it("keeps every round valid and uniquely targeted at every shift", () => {
    for (const shift of [-1, 0, 1] as const) {
      for (let i = 0; i < VARIETY_SAMPLES; i++) {
        const playthrough = buildPlaythrough(6, shift);
        const targets = playthrough.map((r) => r.target);
        expect(new Set(targets).size).toBe(targets.length);
        for (const round of playthrough) expectValidDecodeRound(round);
      }
    }
  }, 30000);

  it("is deterministic under a fixed random sequence for each shift", () => {
    for (const shift of [-1, 0, 1] as const) {
      vi.spyOn(Math, "random").mockReturnValue(0.5);
      const first = buildPlaythrough(6, shift);
      vi.restoreAllMocks();
      vi.spyOn(Math, "random").mockReturnValue(0.5);
      const second = buildPlaythrough(6, shift);
      expect(second).toEqual(first);
      vi.restoreAllMocks();
    }
  });
});

describe("isCorrect", () => {
  it("returns true only for the target index", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const round = buildRound(DECODE_POOL[i % DECODE_POOL.length]!);
      const targetIdx = round.choices.indexOf(round.target);
      for (let idx = 0; idx < 4; idx++) {
        expect(isCorrect(round, idx)).toBe(idx === targetIdx);
      }
    }
  });

  it("returns false for out-of-range indices", () => {
    const round = buildRound(DECODE_POOL[0]!);
    expect(isCorrect(round, -1)).toBe(false);
    expect(isCorrect(round, 4)).toBe(false);
  });
});
