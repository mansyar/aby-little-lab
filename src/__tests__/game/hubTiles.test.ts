import { describe, expect, it } from "vitest";
import { PAGE_SIZE, pageCount } from "../../game/hubPaging";
import { GAME_TILES } from "../../game/hubTiles";

describe("GAME_TILES", () => {
  it("holds exactly 25 tiles with unique gameIds, sceneKeys, and tileKeys", () => {
    expect(GAME_TILES).toHaveLength(25);
    const gameIds = new Set(GAME_TILES.map((t) => t.gameId));
    const sceneKeys = new Set(GAME_TILES.map((t) => t.sceneKey));
    const tileKeys = new Set(GAME_TILES.map((t) => t.tileKey));
    expect(gameIds.size).toBe(25);
    expect(sceneKeys.size).toBe(25);
    expect(tileKeys.size).toBe(25);
  });

  it("derives the hub page count from the tile list, not a constant", () => {
    expect(pageCount()).toBe(Math.ceil(GAME_TILES.length / PAGE_SIZE));
    expect(pageCount()).toBe(3);
  });

  it("uses the canonical tileKey for every gameId", () => {
    const expected: Record<string, string> = {
      "shape-sorter": "tile_shape_sorter",
      "animal-trace": "tile_animal_trace",
      "pop-freeze": "tile_pop_freeze",
      "shadow-match": "tile_shadow_match",
      "musical-memory": "tile_musical_memory",
      "big-small": "tile_big_small",
      "pattern-builder": "tile_pattern_builder",
      // Alphabet art is shared with the letter tiles, hence the short key.
      "alphabet-match": "tile_alphabet",
      "word-match": "tile_word_match",
      "word-builder": "tile_word_builder",
      "how-many": "tile_how_many",
      "first-sounds": "tile_first_sounds",
      "more-less": "tile_more_less",
      "odd-one-out": "tile_odd_one_out",
      "color-match": "tile_color_match",
      "add-it-up": "tile_add_it_up",
      "take-away": "tile_take_away",
      "memory-match": "tile_memory_match",
      "decode-it": "tile_decode_it",
      "number-order": "tile_number_order",
      "feelings-faces": "tile_feelings_faces",
      "story-order": "tile_story_order",
      "robot-path": "tile_robot_path",
      "fix-it-machine": "tile_fix_it_machine",
      "repeat-machine": "tile_repeat_machine",
    };
    for (const tile of GAME_TILES) {
      expect(tile.tileKey).toBe(expected[tile.gameId]);
    }
  });

  it("keeps icon overrides on the typography-heavy tiles only", () => {
    const overridden = GAME_TILES.filter((t) => t.iconDisplay !== undefined);
    expect(overridden.map((t) => t.gameId)).toEqual([
      "alphabet-match",
      "word-match",
      "word-builder",
      "how-many",
      "first-sounds",
      "more-less",
      "odd-one-out",
      "color-match",
      "add-it-up",
      "take-away",
      "memory-match",
      "decode-it",
      "number-order",
    ]);
    for (const tile of overridden) {
      expect(tile.iconDisplay).toBe(52);
      expect(tile.iconOffsetY).toBe(-44);
    }
  });

  it("keeps Feelings Faces as tile 21 and appends Story Order 22, Robot Path 23, Fix-It Machine 24, Repeat Machine 25", () => {
    const feelings = GAME_TILES[20];
    expect(feelings?.gameId).toBe("feelings-faces");
    expect(feelings?.sceneKey).toBe("FeelingsFaces");
    expect(feelings?.label).toBe("Feelings Faces");
    expect(GAME_TILES[19]?.gameId).toBe("number-order");

    const story = GAME_TILES[21];
    expect(story?.gameId).toBe("story-order");
    expect(story?.sceneKey).toBe("StoryOrder");
    expect(story?.label).toBe("Story Order");

    const robot = GAME_TILES[22];
    expect(robot?.gameId).toBe("robot-path");
    expect(robot?.sceneKey).toBe("RobotPath");
    expect(robot?.label).toBe("Robot Path");

    const fixIt = GAME_TILES[23];
    expect(fixIt?.gameId).toBe("fix-it-machine");
    expect(fixIt?.sceneKey).toBe("FixItMachine");
    expect(fixIt?.label).toBe("Fix-It Machine");

    const last = GAME_TILES.at(-1);
    expect(last?.gameId).toBe("repeat-machine");
    expect(last?.sceneKey).toBe("RepeatMachine");
    expect(last?.label).toBe("Repeat Machine");
  });
});
