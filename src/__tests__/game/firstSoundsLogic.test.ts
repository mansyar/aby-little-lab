import { afterEach, describe, expect, it, vi } from "vitest";
import { isConfusableWith, type Letter } from "../../game/alphabetLogic";
import {
  firstLetterOf,
  generatePhonicsPlaythrough,
  generatePhonicsRound,
  PHONICS_LETTERS,
  PHONICS_POOL,
  type PhonicsRound,
} from "../../game/firstSoundsLogic";
import { getWord, WORD_POOL } from "../../game/wordLogic";

afterEach(() => {
  vi.restoreAllMocks();
});

/** Number of rounds sampled to exercise randomized behavior without flaking. */
const VARIETY_SAMPLES = 200;

/** Initial sounds that are hard to tell apart for a 3–5yo. */
const SOUND_CONFUSABLE_PAIRS: ReadonlyArray<readonly [Letter, Letter]> = [
  ["B", "P"],
  ["D", "T"],
];

function expectValidRound(round: PhonicsRound): void {
  expect(round.choices).toHaveLength(4);
  expect(new Set(round.choices).size).toBe(4);
  for (const choice of round.choices) {
    expect(PHONICS_LETTERS).toContain(choice);
  }
  // Exactly one correct answer: the target appears exactly once.
  expect(round.choices.filter((choice) => choice === round.target)).toHaveLength(1);
  // The round's word starts with the target letter and maps to a real texture.
  expect(firstLetterOf(round.word)).toBe(round.target);
  const entry = getWord(round.word);
  expect(entry).toBeDefined();
  expect(round.promptTexture).toBe(entry?.promptTexture);
}

describe("PHONICS_POOL", () => {
  it("holds 12 curated words, all present in the existing word pool", () => {
    expect(PHONICS_POOL).toHaveLength(12);
    expect(new Set(PHONICS_POOL.map((entry) => entry.word)).size).toBe(12);
    for (const entry of PHONICS_POOL) {
      expect(WORD_POOL.map((word) => word.word)).toContain(entry.word);
      expect(entry.promptTexture).toBe(getWord(entry.word)?.promptTexture);
    }
  });

  it("covers exactly the 9 distinct initial letters of PHONICS_LETTERS", () => {
    const letters = new Set(PHONICS_POOL.map((entry) => firstLetterOf(entry.word)));
    expect(letters).toEqual(new Set(PHONICS_LETTERS));
  });

  it("keeps every initial letter inside the phonics letter set", () => {
    for (const entry of PHONICS_POOL) {
      expect(PHONICS_LETTERS).toContain(firstLetterOf(entry.word));
    }
  });
});

describe("PHONICS_LETTERS", () => {
  it("contains 9 unique uppercase letters", () => {
    expect(PHONICS_LETTERS).toHaveLength(9);
    expect(new Set(PHONICS_LETTERS).size).toBe(9);
    for (const letter of PHONICS_LETTERS) {
      expect(letter).toMatch(/^[A-Z]$/);
    }
  });
});

describe("firstLetterOf", () => {
  it("returns the uppercase initial letter of a word", () => {
    expect(firstLetterOf("CAT")).toBe("C");
    expect(firstLetterOf("DOG")).toBe("D");
    expect(firstLetterOf("PIG")).toBe("P");
    expect(firstLetterOf("TREE")).toBe("T");
    expect(firstLetterOf("FISH")).toBe("F");
    expect(firstLetterOf("SUN")).toBe("S");
  });
});

describe("generatePhonicsRound", () => {
  it("produces structurally valid rounds for every phonics letter", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const target = PHONICS_LETTERS[i % PHONICS_LETTERS.length];
      expectValidRound(generatePhonicsRound(target));
    }
  });

  it("always includes the given target", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const target = PHONICS_LETTERS[i % PHONICS_LETTERS.length];
      expect(generatePhonicsRound(target).choices).toContain(target);
    }
  });

  it("uses only distinct distractors, never the target twice", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const target = PHONICS_LETTERS[i % PHONICS_LETTERS.length];
      const round = generatePhonicsRound(target);
      expect(round.choices.filter((choice) => choice === target)).toHaveLength(1);
    }
  });

  it("never offers a sound-confusable partner (B/P, D/T)", () => {
    for (let sample = 0; sample < VARIETY_SAMPLES; sample++) {
      for (const [a, b] of SOUND_CONFUSABLE_PAIRS) {
        for (const target of [a, b]) {
          const distractors = generatePhonicsRound(target).choices.filter(
            (choice) => choice !== target,
          );
          expect(distractors).not.toContain(target === a ? b : a);
        }
      }
    }
  });

  it("never offers a visually confusable same-family distractor (alphabet families)", () => {
    for (let sample = 0; sample < VARIETY_SAMPLES; sample++) {
      for (const target of PHONICS_LETTERS) {
        const round = generatePhonicsRound(target);
        for (const choice of round.choices) {
          if (choice !== target) {
            expect(isConfusableWith(target, choice)).toBe(false);
          }
        }
      }
    }
  });

  it("rotates between the multiple words of a shared initial letter", () => {
    const sunSeen = new Set<string>();
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      sunSeen.add(generatePhonicsRound("S").word);
    }
    expect(sunSeen).toContain("SUN");
    expect(sunSeen).toContain("STAR");
  });

  it("is deterministic under a fixed random sequence", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const first = generatePhonicsRound("B");
    vi.restoreAllMocks();
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const second = generatePhonicsRound("B");
    expect(second).toEqual(first);
    expectValidRound(first);
  });
});

describe("generatePhonicsRound (adaptive band)", () => {
  it("keeps every band structurally valid", () => {
    for (const band of [1, 2, 3] as const) {
      for (let i = 0; i < VARIETY_SAMPLES; i++) {
        const target = PHONICS_LETTERS[i % PHONICS_LETTERS.length];
        expectValidRound(generatePhonicsRound(target, band));
      }
    }
  });

  it("bands 1 and 2 never offer a sound-confusable partner", () => {
    for (const band of [1, 2] as const) {
      for (let sample = 0; sample < VARIETY_SAMPLES; sample++) {
        for (const [a, b] of SOUND_CONFUSABLE_PAIRS) {
          for (const target of [a, b]) {
            const distractors = generatePhonicsRound(target, band).choices.filter(
              (choice) => choice !== target,
            );
            expect(distractors).not.toContain(target === a ? b : a);
          }
        }
      }
    }
  });

  it("the hard band may pair sound-confusable letters (B/P, D/T)", () => {
    let observed = 0;
    for (let sample = 0; sample < VARIETY_SAMPLES; sample++) {
      for (const [a, b] of SOUND_CONFUSABLE_PAIRS) {
        const distractors = generatePhonicsRound(a, 3).choices.filter(
          (choice) => choice !== a,
        );
        if (distractors.includes(b)) observed++;
      }
    }
    expect(observed).toBeGreaterThan(0);
  });

  it("the hard band still excludes visually confusable same-family distractors", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const target = PHONICS_LETTERS[i % PHONICS_LETTERS.length];
      const distractors = generatePhonicsRound(target, 3).choices.filter(
        (choice) => choice !== target,
      );
      for (const distractor of distractors) {
        expect(isConfusableWith(target, distractor)).toBe(false);
      }
    }
  });
});

describe("generatePhonicsPlaythrough (adaptive shift)", () => {
  function targetsOf(rounds: PhonicsRound[]): Letter[] {
    return rounds.map((round) => round.target);
  }

  it("draws easy targets from the 7 letters excluding B and P at shift -1", () => {
    const easyPool = PHONICS_LETTERS.filter((letter) => letter !== "B" && letter !== "P");
    expect(easyPool).toHaveLength(7);
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const targets = targetsOf(generatePhonicsPlaythrough(6, -1));
      expect(targets).toHaveLength(6);
      expect(new Set(targets).size).toBe(6);
      for (const target of targets) {
        expect(easyPool).toContain(target);
      }
    }
  });

  it("keeps unique classic targets at shift 0", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const targets = targetsOf(generatePhonicsPlaythrough(6, 0));
      expect(targets).toHaveLength(6);
      expect(new Set(targets).size).toBe(6);
      for (const target of targets) {
        expect(PHONICS_LETTERS).toContain(target);
      }
    }
  });

  it("draws targets from all 9 letters at shift +1", () => {
    const seen = new Set<Letter>();
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const targets = targetsOf(generatePhonicsPlaythrough(6, 1));
      expect(new Set(targets).size).toBe(6);
      for (const target of targets) {
        seen.add(target);
        expect(PHONICS_LETTERS).toContain(target);
      }
    }
    expect(seen).toEqual(new Set(PHONICS_LETTERS));
  });

  it("offers sound-confusable distractors only in the hard band", () => {
    for (const shift of [-1, 0] as const) {
      for (let i = 0; i < VARIETY_SAMPLES; i++) {
        for (const round of generatePhonicsPlaythrough(6, shift)) {
          const distractors = round.choices.filter((choice) => choice !== round.target);
          for (const [a, b] of SOUND_CONFUSABLE_PAIRS) {
            if (round.target === a) expect(distractors).not.toContain(b);
            if (round.target === b) expect(distractors).not.toContain(a);
          }
        }
      }
    }
  });

  it("keeps every round valid at every shift", () => {
    for (const shift of [-1, 0, 1] as const) {
      for (let i = 0; i < VARIETY_SAMPLES; i++) {
        for (const round of generatePhonicsPlaythrough(6, shift)) {
          expectValidRound(round);
        }
      }
    }
  });
});

describe("generatePhonicsPlaythrough", () => {
  it("returns the requested number of valid rounds", () => {
    const playthrough = generatePhonicsPlaythrough(6);
    expect(playthrough).toHaveLength(6);
    for (const round of playthrough) {
      expectValidRound(round);
    }
  });

  it("defaults to 6 rounds", () => {
    expect(generatePhonicsPlaythrough()).toHaveLength(6);
  });

  it("draws unique target letters within a playthrough (no duplicates)", () => {
    for (let i = 0; i < VARIETY_SAMPLES; i++) {
      const targets = generatePhonicsPlaythrough().map((round) => round.target);
      expect(new Set(targets).size).toBe(targets.length);
    }
  });

  it("draws targets only from the phonics letter set", () => {
    for (const round of generatePhonicsPlaythrough(200)) {
      expect(PHONICS_LETTERS).toContain(round.target);
    }
  });

  it("covers every phonics letter across many playthroughs", () => {
    const seen = new Set<Letter>();
    for (let i = 0; i < 50; i++) {
      for (const round of generatePhonicsPlaythrough()) {
        seen.add(round.target);
      }
    }
    expect(seen).toEqual(new Set(PHONICS_LETTERS));
  });

  it("produces different playthroughs under different random sequences", () => {
    vi.spyOn(Math, "random").mockReturnValueOnce(0.05).mockReturnValueOnce(0.35);
    const first = generatePhonicsPlaythrough(6);
    vi.restoreAllMocks();
    vi.spyOn(Math, "random").mockReturnValueOnce(0.95).mockReturnValueOnce(0.65);
    const second = generatePhonicsPlaythrough(6);
    expect(first).not.toEqual(second);
  });

  it("is deterministic under a fixed random sequence", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const first = generatePhonicsPlaythrough();
    vi.restoreAllMocks();
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const second = generatePhonicsPlaythrough();
    expect(second).toEqual(first);
  });
});
