import { describe, expect, it } from "vitest";
import {
  drawScenarios,
  EMOTIONS,
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
