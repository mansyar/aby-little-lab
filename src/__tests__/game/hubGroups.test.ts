import { describe, expect, it } from "vitest";
import { GAME_REGISTRY } from "../../game/gameRegistry";
import {
  ALL_GROUP_ID,
  groupForGame,
  HUB_GROUP_COVERAGE,
  HUB_GROUPS,
  HUB_SELECTIONS,
  type HubSelection,
  selectionGlyphKey,
  selectionLabel,
  selectionSpokenName,
  tilesInGroup,
  visibleTileIndexes,
} from "../../game/hubGroups";
import type { GameId, HubGroupId } from "../../types";

/**
 * The group table's contract (spec FR-1, FR-5, AC-1).
 *
 * Membership is written out here as a literal table rather than derived from the
 * registry, so a game that moves group, a group that empties and a sixth group
 * added without a chip all fail against the spec instead of quietly redefining
 * what the Hub shows. The membership is the product decision; the registry field
 * is only where it is stored.
 */
const EXPECTED_MEMBERS: ReadonlyArray<readonly [HubGroupId, readonly GameId[]]> = [
  ["letters", ["alphabet-match", "word-match", "word-builder", "first-sounds", "decode-it"]],
  ["numbers", ["how-many", "more-less", "add-it-up", "take-away", "number-order"]],
  [
    "thinking",
    [
      "shape-sorter",
      "shadow-match",
      "big-small",
      "pattern-builder",
      "odd-one-out",
      "color-match",
      "robot-path",
      "fix-it-machine",
    ],
  ],
  ["play", ["animal-trace", "pop-freeze", "musical-memory", "memory-match"]],
  ["stories", ["feelings-faces", "story-order"]],
];

/** The games a group draws, by registry index. */
const gamesFor = (group: HubGroupId): Array<GameId | undefined> =>
  tilesInGroup(group).map((index) => GAME_REGISTRY[index]?.gameId);

describe("HUB_GROUPS", () => {
  it("declares the five groups in chip order, after All", () => {
    expect(HUB_GROUPS.map((group) => group.id)).toEqual(EXPECTED_MEMBERS.map(([id]) => id));
    expect(HUB_SELECTIONS).toEqual(["all", "letters", "numbers", "thinking", "play", "stories"]);
    expect(ALL_GROUP_ID).toBe("all");
  });

  it("draws exactly its own games, in registry order", () => {
    for (const [id, games] of EXPECTED_MEMBERS) {
      expect(gamesFor(id)).toEqual([...games]);
    }
  });

  it("splits the 24 games 5/5/8/4/2 with none left out and none counted twice", () => {
    const counts = EXPECTED_MEMBERS.map(
      ([id]) => GAME_REGISTRY.filter((g) => g.group === id).length,
    );
    expect(counts).toEqual([5, 5, 8, 4, 2]);
    expect(counts.reduce((sum, count) => sum + count, 0)).toBe(GAME_REGISTRY.length);

    const covered = EXPECTED_MEMBERS.flatMap(([id]) => tilesInGroup(id)).sort((a, b) => a - b);
    expect(covered).toEqual([...Array(GAME_REGISTRY.length).keys()]);
  });

  it("shows every game for All, and for the default selection", () => {
    const all = [...Array(GAME_REGISTRY.length).keys()];
    expect(visibleTileIndexes(ALL_GROUP_ID)).toEqual(all);
    expect(visibleTileIndexes()).toEqual(all);
    // Non-vacuity: a filtered selection really is narrower than All.
    expect(visibleTileIndexes("stories").length).toBeLessThan(all.length);
  });

  it("gives each chip one word and one sentence, all distinct", () => {
    const labels = HUB_GROUPS.map((group) => group.label);
    expect(new Set(labels).size).toBe(labels.length);
    for (const group of HUB_GROUPS) {
      expect(group.label, group.id).toMatch(/^[A-Za-z]+$/);
      expect(group.spokenName.trim().length, group.id).toBeGreaterThan(group.label.length);
      expect(selectionLabel(group.id)).toBe(group.label);
      expect(selectionSpokenName(group.id)).toBe(group.spokenName);
    }

    const spoken = HUB_GROUPS.map((group) => group.spokenName);
    expect(new Set(spoken).size).toBe(spoken.length);
    expect(selectionLabel(ALL_GROUP_ID)).toBe("All");
    expect(selectionSpokenName(ALL_GROUP_ID)).toBe("All games");
  });

  it("names one glyph per group and none for All", () => {
    const glyphs = HUB_GROUPS.map((group) => group.glyphKey);
    expect(new Set(glyphs).size).toBe(glyphs.length);
    for (const group of HUB_GROUPS) {
      expect(group.glyphKey).toBe(`group_${group.id}`);
      expect(selectionGlyphKey(group.id)).toBe(group.glyphKey);
    }
    // All draws its 2x2 grid at runtime, so the shell ships five glyphs (D7).
    expect(selectionGlyphKey(ALL_GROUP_ID)).toBeNull();
  });

  it("resolves a game's group from the registry, and refuses an unknown id", () => {
    for (const entry of GAME_REGISTRY) {
      expect(groupForGame(entry.gameId)).toBe(entry.group);
    }
    expect(() => groupForGame("not-a-game" as GameId)).toThrow(
      /no registry entry for game id: not-a-game/,
    );
  });

  it("refuses an unknown selection rather than guessing", () => {
    // A cast is the only way to reach this impossible-by-type branch; it proves
    // the table fails loudly instead of drawing an empty board.
    const unknown = "not-a-group" as unknown as HubSelection;
    expect(() => selectionLabel(unknown)).toThrow(/no hub group for id: not-a-group/);
    expect(() => selectionSpokenName(unknown)).toThrow(/no hub group for id/);
    expect(() => selectionGlyphKey(unknown)).toThrow(/no hub group for id/);
  });

  it("proves at compile time that every group id has a row", () => {
    // `Record<never, true>` is `{}` while every id is covered; the count keeps
    // the assertion from passing on an empty registry.
    expect(HUB_GROUPS).toHaveLength(5);
    expect(HUB_GROUP_COVERAGE).toEqual({});
  });
});
