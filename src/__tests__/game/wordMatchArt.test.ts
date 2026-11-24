import { describe, expect, it } from "vitest";
import { letters } from "../../game/art/letters";
import { generateWordPlaythrough, getWord, WORD_POOL, type WordRound } from "../../game/wordLogic";
import { selectWordMatchArt } from "../../game/wordMatchArt";
import wordMatchArtSource from "../../game/wordMatchArt.ts?raw";
import { mulberry32 } from "../helpers/randomHelper";

const SHELL_PROMPT_KEYS = new Set(["mascot_idle", "frog_red"]);

function selectedKeys(rounds: readonly WordRound[]): string[] {
  return selectWordMatchArt(rounds).flatMap((group) => group.assets.map((asset) => asset.key));
}

function selectedPromptKeys(rounds: readonly WordRound[]): string[] {
  return selectedKeys(rounds).filter((key) => !key.startsWith("letter_"));
}

describe("selectWordMatchArt", () => {
  it("returns exactly the full letters plus selected prompt assets in group order", () => {
    const rounds: WordRound[] = [
      { target: "CAT", choices: ["CAT"] },
      { target: "FISH", choices: ["FISH"] },
      { target: "SUN", choices: ["SUN"] },
      { target: "STAR", choices: ["STAR"] },
      { target: "BEAR", choices: ["BEAR"] },
      { target: "CAT", choices: ["CAT"] },
      { target: "OWL", choices: ["OWL"] },
      { target: "FROG", choices: ["FROG"] },
    ];

    const groups = selectWordMatchArt(rounds);
    const keys = groups.flatMap((group) => group.assets.map((asset) => asset.key));

    expect(groups.map((group) => group.id)).toEqual([
      "animals",
      "food",
      "items",
      "letters",
      "music",
      "shapes",
      "toys",
    ]);
    expect(keys).toEqual([
      "animal_cat",
      "food_fish",
      "sm_sun",
      ...letters.assets.map((asset) => asset.key),
      "shape_star",
      "toy_teddy_bear",
    ]);
    expect(new Set(keys).size).toBe(keys.length);
    expect(groups.find((group) => group.id === "letters")).toEqual(letters);
    expect(groups.find((group) => group.id === "music")?.assets).toEqual([]);
  });

  it("deduplicates repeated targets and keeps each group's declared asset order", () => {
    const rounds: WordRound[] = [
      { target: "PIG", choices: ["PIG"] },
      { target: "CAT", choices: ["CAT"] },
      { target: "PIE", choices: ["PIE"] },
      { target: "FISH", choices: ["FISH"] },
      { target: "STAR", choices: ["STAR"] },
      { target: "DOT", choices: ["DOT"] },
      { target: "PIG", choices: ["PIG"] },
    ];

    expect(selectedPromptKeys(rounds)).toEqual([
      "animal_cat",
      "animal_pig",
      "food_fish",
      "food_apple",
      "shape_circle",
      "shape_star",
    ]);
  });

  it("keeps the fixed declaration shape but leaves unused groups empty", () => {
    const rounds: WordRound[] = [
      { target: "OWL", choices: ["OWL"] },
      { target: "FROG", choices: ["FROG"] },
      { target: "UNKNOWN", choices: ["UNKNOWN"] },
    ];

    const groups = selectWordMatchArt(rounds);
    expect(groups.map((group) => group.id)).toEqual([
      "animals",
      "food",
      "items",
      "letters",
      "music",
      "shapes",
      "toys",
    ]);
    expect(
      groups.filter((group) => group.id !== "letters").every((group) => group.assets.length === 0),
    ).toBe(true);
    expect(groups.find((group) => group.id === "letters")).toEqual(letters);
    expect(selectedPromptKeys(rounds)).toEqual([]);
  });

  it("covers both four-letter prompts from an adaptive +1 playthrough", () => {
    const rounds = generateWordPlaythrough(6, 1, mulberry32(1234));
    const fourLetterTargets = rounds.filter((round) => (getWord(round.target)?.tier ?? 3) === 4);
    const expectedPrompts = new Set(
      rounds
        .map((round) => getWord(round.target)?.promptTexture)
        .filter((key): key is string => key !== undefined && !SHELL_PROMPT_KEYS.has(key)),
    );

    expect(fourLetterTargets).toHaveLength(2);
    expect(new Set(selectedPromptKeys(rounds))).toEqual(expectedPrompts);
    expect(selectedKeys(rounds).some((key) => key.startsWith("letter_"))).toBe(true);
    expect(selectedKeys(rounds)).not.toContain("frog_red");
    expect(selectedKeys(rounds)).not.toContain("lilypad");
  });

  it("supplies every WORD_POOL prompt except the documented shell-owned keys", () => {
    const rounds: WordRound[] = WORD_POOL.map((entry) => ({
      target: entry.word,
      choices: [entry.word],
    }));
    const supplied = new Set(selectedPromptKeys(rounds));
    const expected = WORD_POOL.map((entry) => entry.promptTexture).filter(
      (key) => !SHELL_PROMPT_KEYS.has(key),
    );

    expect(new Set(expected)).toEqual(supplied);
    for (const key of SHELL_PROMPT_KEYS) {
      expect(supplied.has(key)).toBe(false);
    }
  });

  it("has no Phaser, storage, DOM, or network dependency", () => {
    expect(wordMatchArtSource).not.toMatch(
      /\b(?:Phaser|phaser|localStorage|sessionStorage|document|window|fetch|XMLHttpRequest)\b/,
    );
  });
});
