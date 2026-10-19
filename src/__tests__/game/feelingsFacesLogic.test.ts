import { describe, expect, it } from "vitest";
import {
  answer,
  buildRoundChoices,
  drawScenarios,
  EMOTIONS,
  type Emotion,
  ROUND_CONTRASTS,
  ROUND_COUNT,
  type RoundState,
  SCENARIO_POOL,
  type Scenario,
} from "../../game/feelingsFacesLogic";

/** Deterministic generator so draw tests never depend on Math.random. */
function seededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

/** Returns a pooled scenario for the given emotion (the pool holds four each). */
function scenarioFor(emotion: Emotion): Scenario {
  const found = SCENARIO_POOL.find((scenario) => scenario.emotion === emotion);
  if (!found) {
    throw new Error(`No scenario for ${emotion}`);
  }
  return found;
}

describe("EMOTIONS", () => {
  it("lists the four emotions in display order", () => {
    expect(EMOTIONS).toEqual(["happy", "sad", "angry", "scared"]);
  });

  it("has no duplicates", () => {
    expect(new Set(EMOTIONS).size).toBe(EMOTIONS.length);
  });
});

describe("SCENARIO_POOL", () => {
  it("holds four scenarios for every emotion", () => {
    expect(SCENARIO_POOL).toHaveLength(16);
    for (const emotion of EMOTIONS) {
      expect(SCENARIO_POOL.filter((scenario) => scenario.emotion === emotion)).toHaveLength(4);
    }
  });

  it("gives every scenario a unique id and a unique line", () => {
    expect(new Set(SCENARIO_POOL.map((scenario) => scenario.id)).size).toBe(16);
    expect(new Set(SCENARIO_POOL.map((scenario) => scenario.text)).size).toBe(16);
  });

  it("keeps every line short enough for one spoken sentence", () => {
    for (const scenario of SCENARIO_POOL) {
      expect(scenario.text.length).toBeGreaterThan(0);
      expect(scenario.text.length).toBeLessThanOrEqual(60);
    }
  });

  it("uses a known emotion and writes every line as a sentence", () => {
    for (const scenario of SCENARIO_POOL) {
      expect(EMOTIONS).toContain(scenario.emotion);
      expect(scenario.text.endsWith(".")).toBe(true);
      expect(scenario.text.charAt(0)).toBe(scenario.text.charAt(0).toUpperCase());
    }
  });
});

describe("drawScenarios", () => {
  it("draws one playthrough of six scenarios", () => {
    expect(drawScenarios(seededRng(1))).toHaveLength(ROUND_COUNT);
  });

  it("defaults to Math.random when no generator is passed", () => {
    expect(drawScenarios()).toHaveLength(ROUND_COUNT);
  });

  it("never repeats a scenario within a run and covers every emotion over 20 runs", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const drawn = drawScenarios(seededRng(seed));
      expect(new Set(drawn.map((scenario) => scenario.id)).size).toBe(ROUND_COUNT);
      expect(new Set(drawn.map((scenario) => scenario.emotion)).size).toBe(EMOTIONS.length);
      for (const scenario of drawn) {
        expect(SCENARIO_POOL).toContain(scenario);
      }
    }
  });

  it("draws the same playthrough for the same seed", () => {
    for (let seed = 1; seed <= 20; seed++) {
      expect(drawScenarios(seededRng(seed))).toEqual(drawScenarios(seededRng(seed)));
    }
  });

  it("varies the draw across seeds", () => {
    const runs = new Set(
      Array.from({ length: 20 }, (_, index) =>
        drawScenarios(seededRng(index + 1))
          .map((scenario) => scenario.id)
          .join(","),
      ),
    );
    expect(runs.size).toBeGreaterThan(1);
  });
});

describe("ROUND_CONTRASTS", () => {
  it("provides one rung per round", () => {
    expect(ROUND_CONTRASTS).toHaveLength(ROUND_COUNT);
  });

  it("opens with the maximally distinct happy/angry contrast for rounds 1–3", () => {
    for (const index of [0, 1, 2]) {
      const contrast = ROUND_CONTRASTS[index];
      expect(contrast.kind).toBe("distinct");
      expect(contrast.pair).toEqual(["happy", "angry"]);
    }
  });

  it("closes with the confusable sad/scared contrast for rounds 4–6", () => {
    for (const index of [3, 4, 5]) {
      const contrast = ROUND_CONTRASTS[index];
      expect(contrast.kind).toBe("confusable");
      expect(contrast.pair).toEqual(["sad", "scared"]);
    }
  });

  it("pairs two different emotions from the deck", () => {
    for (const contrast of ROUND_CONTRASTS) {
      expect(contrast.pair).toHaveLength(2);
      expect(new Set(contrast.pair).size).toBe(2);
      expect(EMOTIONS).toContain(contrast.pair[0]);
      expect(EMOTIONS).toContain(contrast.pair[1]);
    }
  });

  it("keeps each third card outside its own pair", () => {
    for (const contrast of ROUND_CONTRASTS) {
      expect(contrast.pair).not.toContain(contrast.third);
      expect(EMOTIONS).toContain(contrast.third);
    }
  });
});

describe("buildRoundChoices", () => {
  it("returns three distinct cards including the target for every round", () => {
    for (let index = 0; index < ROUND_COUNT; index++) {
      for (const target of EMOTIONS) {
        const choices = buildRoundChoices(index, target);
        expect(choices).toHaveLength(3);
        expect(new Set(choices).size).toBe(3);
        expect(choices.filter((choice) => choice === target)).toHaveLength(1);
      }
    }
  });

  it("always shows both emotions of the round's contrast pair", () => {
    for (let index = 0; index < ROUND_COUNT; index++) {
      for (const target of EMOTIONS) {
        const choices = buildRoundChoices(index, target);
        for (const emotion of ROUND_CONTRASTS[index].pair) {
          expect(choices).toContain(emotion);
        }
      }
    }
  });

  it("puts the ladder's third card beside a target that is in the pair", () => {
    expect(buildRoundChoices(0, "happy")).toEqual(["happy", "angry", "sad"]);
    expect(buildRoundChoices(0, "angry")).toEqual(["happy", "angry", "sad"]);
    expect(buildRoundChoices(4, "sad")).toEqual(["sad", "scared", "happy"]);
    expect(buildRoundChoices(4, "scared")).toEqual(["sad", "scared", "happy"]);
  });

  it("keeps a target outside the pair as the third card", () => {
    expect(buildRoundChoices(0, "scared")).toEqual(["happy", "angry", "scared"]);
    expect(buildRoundChoices(5, "angry")).toEqual(["sad", "scared", "angry"]);
  });

  it("uses the distinct pair early and the confusable pair late for every target", () => {
    for (const target of EMOTIONS) {
      for (const index of [0, 1, 2]) {
        expect(buildRoundChoices(index, target).slice(0, 2)).toEqual(["happy", "angry"]);
      }
      for (const index of [3, 4, 5]) {
        expect(buildRoundChoices(index, target).slice(0, 2)).toEqual(["sad", "scared"]);
      }
    }
  });
});

describe("answer", () => {
  function makeRound(index: number, emotion: Emotion, taps = 0): RoundState {
    return {
      index,
      scenario: scenarioFor(emotion),
      choices: buildRoundChoices(index, emotion),
      taps,
    };
  }

  it("advances to the next round and counts the tap on a correct answer", () => {
    expect(answer(makeRound(2, "sad"), "sad")).toEqual({ correct: true, nextRound: 3, taps: 1 });
  });

  it("keeps the same round on a wrong answer", () => {
    expect(answer(makeRound(2, "sad"), "happy")).toEqual({ correct: false, nextRound: 2, taps: 1 });
  });

  it("never advances however many wrong taps come first", () => {
    let round = makeRound(4, "scared");
    for (let attempt = 1; attempt <= 3; attempt++) {
      const result = answer(round, "angry");
      expect(result.correct).toBe(false);
      expect(result.nextRound).toBe(4);
      expect(result.taps).toBe(attempt);
      round = { ...round, taps: result.taps };
    }
    expect(answer(round, "scared")).toEqual({ correct: true, nextRound: 5, taps: 4 });
  });

  it("signals completion after a correct answer on the last round", () => {
    expect(answer(makeRound(ROUND_COUNT - 1, "happy"), "happy")).toEqual({
      correct: true,
      nextRound: ROUND_COUNT,
      taps: 1,
    });
  });

  it("treats every card other than the scenario's emotion as wrong", () => {
    for (let index = 0; index < ROUND_COUNT; index++) {
      const round = makeRound(index, "sad");
      const wrongCards = round.choices.filter((card) => card !== round.scenario.emotion);
      for (const wrong of wrongCards) {
        const result = answer(round, wrong);
        expect(result.correct).toBe(false);
        expect(result.nextRound).toBe(index);
      }
    }
  });

  it("accepts the scenario's own emotion on every round", () => {
    for (let index = 0; index < ROUND_COUNT; index++) {
      const round = makeRound(index, "scared");
      const result = answer(round, round.scenario.emotion);
      expect(result.correct).toBe(true);
      expect(result.nextRound).toBe(index + 1);
    }
  });

  it("does not mutate the round it scores", () => {
    const round = makeRound(1, "angry", 2);
    const before: RoundState = {
      ...round,
      scenario: { ...round.scenario },
      choices: [...round.choices],
    };
    answer(round, "happy");
    expect(round).toEqual(before);
  });
});

/** Words that would break the gentle, no-injury/loss/violence tone (FR-11). */
const UNSAFE_WORDS: readonly string[] = [
  "hurt",
  "hurts",
  "blood",
  "bleed",
  "die",
  "dead",
  "death",
  "kill",
  "kills",
  "hit",
  "hits",
  "fight",
  "fights",
  "punch",
  "slap",
  "bite",
  "bites",
  "scream",
  "screams",
  "crash",
  "crashes",
  "broken",
  "danger",
  "dangerous",
  "gun",
  "knife",
  "monster",
  "monsters",
  "lost",
  "lose",
  "gone",
];

/** Lowercase word tokens, so "sinks" never matches the blocked word "ink". */
function wordsIn(text: string): string[] {
  return text.toLowerCase().match(/[a-z]+/g) ?? [];
}

describe("SCENARIO_POOL safe-content guard", () => {
  it("never uses injury, loss, or violence words", () => {
    for (const scenario of SCENARIO_POOL) {
      for (const word of wordsIn(scenario.text)) {
        expect(UNSAFE_WORDS).not.toContain(word);
      }
    }
  });

  it("keeps every spoken line inside the 60-character limit", () => {
    for (const scenario of SCENARIO_POOL) {
      expect(scenario.text.length).toBeLessThanOrEqual(60);
    }
  });
});
