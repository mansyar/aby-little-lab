import { describe, expect, it } from "vitest";
import {
  buildRoundChoices,
  drawScenarios,
  EMOTIONS,
  ROUND_CONTRASTS,
  ROUND_COUNT,
  SCENARIO_POOL,
} from "../../game/feelingsFacesLogic";

/** Deterministic generator so draw tests never depend on Math.random. */
function seededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
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

  it("never repeats a scenario within a run and covers every emotion", () => {
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
