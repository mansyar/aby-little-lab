import { describe, expect, it } from "vitest";
import { EMOTIONS, SCENARIO_POOL } from "../../game/feelingsFacesLogic";

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
