import { describe, expect, it, vi } from "vitest";

/** PreloadScene needs only `Phaser.Scene` at import time; SHELL_ASSETS is module scope. */
vi.mock("phaser", () => {
  const phaserMock = { Scene: class Scene {}, Scale: { FIT: "FIT" } };
  return { ...phaserMock, default: phaserMock };
});

import storyOrderArtSource from "../../../game/storyOrderArt.ts?raw";
import { SHELL_ASSETS } from "../../../scenes/PreloadScene";
import preloadSceneSource from "../../../scenes/PreloadScene.ts?raw";

/**
 * Art ownership guard (FR-8, AC-4).
 *
 * The boot shell ships the 53-key shell set and nothing else: no module of the
 * art registry, no SVG whose key belongs to a game group, no game-owned art
 * module. `storyOrderArt.test.ts` asserts the single-module case; this suite
 * states the rule for all 125 moved keys and for the Story Order panels.
 *
 * The shell list is spelled out here rather than read from `PreloadScene`: a
 * scene that defines its own truth is exactly the failure this guard exists to
 * prevent. `groupIntegrity.test.ts` holds the same list from the group side.
 */
const SHELL_KEYS: readonly string[] = [
  "tile_shape_sorter",
  "tile_animal_trace",
  "tile_pop_freeze",
  "tile_shadow_match",
  "tile_musical_memory",
  "tile_big_small",
  "tile_first_sounds",
  "tile_pattern_builder",
  "tile_alphabet",
  "tile_word_match",
  "tile_word_builder",
  "tile_how_many",
  "tile_more_less",
  "tile_odd_one_out",
  "tile_color_match",
  "tile_add_it_up",
  "tile_take_away",
  "tile_memory_match",
  "tile_decode_it",
  "tile_number_order",
  "tile_story_order",
  "tile_feelings_faces",
  "sticker_shape_sorter",
  "sticker_animal_trace",
  "sticker_pop_freeze",
  "sticker_shadow_match",
  "sticker_musical_memory",
  "sticker_big_small",
  "sticker_first_sounds",
  "sticker_pattern_builder",
  "sticker_word_match",
  "sticker_word_builder",
  "sticker_alphabet_match",
  "sticker_how_many",
  "sticker_more_less",
  "sticker_odd_one_out",
  "sticker_color_match",
  "sticker_add_it_up",
  "sticker_take_away",
  "sticker_memory_match",
  "sticker_decode_it",
  "sticker_number_order",
  "sticker_story_order",
  "sticker_feelings_faces",
  "mascot_idle",
  "mascot_celebrate",
  "icon_speaker",
  "animal_cat",
  "animal_dog",
  "animal_pig",
  "frog_red",
  "sm_duck",
  "toy_teddy_bear",
];

/**
 * The one deliberate shell/game overlap (FR-4): these six avatars stay eager
 * because `ProfileChip` and the Settings avatar picker render before any game
 * scene loads.
 */
const AVATAR_KEYS: readonly string[] = [
  "animal_cat",
  "animal_dog",
  "animal_pig",
  "frog_red",
  "sm_duck",
  "toy_teddy_bear",
];

/** The twelve group modules by file name, so a glob that finds nothing fails. */
const GROUP_MODULE_FILES: readonly string[] = [
  "animals.ts",
  "cutouts.ts",
  "faces.ts",
  "food.ts",
  "glyphs.ts",
  "items.ts",
  "letters.ts",
  "music.ts",
  "numerals.ts",
  "shadows.ts",
  "shapes.ts",
  "toys.ts",
];

/** A module read as text: its repo-relative path and its source. */
interface SourceModule {
  readonly path: string;
  readonly source: string;
}

/** This test's own directory, so glob keys resolve to repo-relative paths. */
const TEST_DIR = "src/__tests__/game/art";

/**
 * Resolves a relative import specifier against a repo-relative directory.
 *
 * Hand-rolled so this suite needs no Node `path` module and stays pure string
 * work under happy-dom.
 */
function resolveFrom(baseDir: string, specifier: string): string {
  const segments: string[] = [];
  for (const segment of `${baseDir}/${specifier}`.split("/")) {
    if (segment === "" || segment === ".") continue;
    if (segment === "..") segments.pop();
    else segments.push(segment);
  }
  return segments.join("/");
}

const directoryOf = (filePath: string): string => filePath.slice(0, filePath.lastIndexOf("/"));

/** `import x from "…svg?raw"` — how SVG markup enters any table in this project. */
const RAW_SVG_IMPORT = /import\s+(\w+)\s+from\s+"([^"]+\.svg)\?raw"/g;

/** One `{ key: "…", svg: identifier }` row of a table. */
const TABLE_ENTRY = /\{\s*key:\s*"([a-z0-9_]+)",\s*svg:\s*(\w+)\s*\}/g;

/** `import [type] <bindings> from "…"` — the form a scene's imports take. */
const IMPORT_STATEMENT = /import\s+(type\s+)?[\w{},*\s]+?from\s+"([^"]+)"/g;

/** True for `../game/art` and anything beneath it. */
const isArtRegistryPath = (specifier: string): boolean =>
  specifier === "../game/art" || specifier.startsWith("../game/art/");

/** The `PreloadScene` import surface the shell is allowed to reach, type-only. */
const ALLOWED_ART_MODULE_IMPORTS: readonly string[] = [
  "../game/art",
  "../game/art/index",
  "../game/art/types",
];

/** Every module under `src/game/art/`, read as text instead of as values. */
const ART_MODULES: readonly SourceModule[] = Object.entries(
  import.meta.glob<string>("../../../game/art/*.ts", {
    query: "?raw",
    import: "default",
    eager: true,
  }),
).map(([key, source]) => ({ path: resolveFrom(TEST_DIR, key), source }));

/** Story Order's own art module, the one game-owned table outside the registry. */
const STORY_ORDER_ART: SourceModule = {
  path: "src/game/storyOrderArt.ts",
  source: storyOrderArtSource,
};

/** The registry modules plus the one game-owned art module kept outside it. */
const GAME_MODULES: readonly SourceModule[] = [...ART_MODULES, STORY_ORDER_ART];

const SHELL_MODULE: SourceModule = {
  path: "src/scenes/PreloadScene.ts",
  source: preloadSceneSource,
};

/** `key` → the SVG file backing it, resolved to a repo-relative path. */
function keyToSvgFile(module: SourceModule): Map<string, string> {
  const imported = new Map<string, string>();
  for (const match of module.source.matchAll(RAW_SVG_IMPORT)) {
    imported.set(match[1], resolveFrom(directoryOf(module.path), match[2]));
  }

  const keys = new Map<string, string>();
  for (const match of module.source.matchAll(TABLE_ENTRY)) {
    const file = imported.get(match[2]);
    if (file !== undefined) keys.set(match[1], file);
  }
  return keys;
}

/** Every key in `modules`, grouped by the file backing it. */
function mergeKeys(modules: readonly SourceModule[]): Map<string, string> {
  const merged = new Map<string, string>();
  for (const module of modules) {
    for (const [key, file] of keyToSvgFile(module)) merged.set(key, file);
  }
  return merged;
}

/** The keys the shell actually registers at runtime, after the registry derivation. */
const shellKeysRegistered: readonly string[] = SHELL_ASSETS.map((asset) => asset.key);

/** Every SVG file `PreloadScene` imports, registered in the table or not. */
const shellSvgImports = new Set(
  [...SHELL_MODULE.source.matchAll(RAW_SVG_IMPORT)].map((match) =>
    resolveFrom(directoryOf(SHELL_MODULE.path), match[2]),
  ),
);

/** Every key the twelve groups rasterize, and the file behind it. */
const groupKeyToFile = mergeKeys(ART_MODULES);

/** The keys Story Order owns, and the file behind each one. */
const storyKeyToFile = keyToSvgFile(STORY_ORDER_ART);

/** Group keys only a game draws — the 125 moved keys, minus the six avatars. */
const gameOnlyKeys: readonly string[] = [...groupKeyToFile.keys()].filter(
  (key) => !SHELL_KEYS.includes(key),
);

/** The SVG files the shell and the groups share. */
const groupFiles = new Set(groupKeyToFile.values());
const sharedFiles: readonly string[] = [...shellSvgImports]
  .filter((file) => groupFiles.has(file))
  .sort();

/** Every SVG the project ships, by repo-relative path — the disk truth. */
const SVG_FILES = new Set(
  Object.keys(import.meta.glob("../../../assets/svg/**/*.svg")).map((key) =>
    resolveFrom(TEST_DIR, key),
  ),
);

describe("shell ownership", () => {
  it("ships exactly the 53 documented shell keys, with no extras or omissions", () => {
    expect(SHELL_KEYS).toHaveLength(53);
    expect(new Set(SHELL_KEYS).size).toBe(53);
    expect([...shellKeysRegistered].sort()).toEqual([...SHELL_KEYS].sort());
  });

  it("imports no module of the art registry, and only types if it ever does", () => {
    const offending = [...preloadSceneSource.matchAll(IMPORT_STATEMENT)]
      .filter((match) => isArtRegistryPath(match[2]))
      .filter((match) => {
        const typeOnly = match[1] !== undefined;
        return !typeOnly || !ALLOWED_ART_MODULE_IMPORTS.includes(match[2]);
      })
      .map((match) => match[2]);

    expect(offending).toEqual([]);
  });

  it("imports no SVG that backs a game-only key", () => {
    const offending = [...gameOnlyKeys, ...storyKeyToFile.keys()].filter((key) => {
      const file = groupKeyToFile.get(key) ?? storyKeyToFile.get(key);
      return file !== undefined && shellSvgImports.has(file);
    });

    expect(offending).toEqual([]);
  });

  it("sees all 131 group keys, 125 of them game-only, and the 24 Story Order panels", () => {
    // Non-vacuity: a scan that lost the registry, the SVG imports or the key
    // rows would find nothing to complain about, so the counts are asserted.
    expect(groupKeyToFile.size).toBe(131);
    expect(gameOnlyKeys).toHaveLength(125);
    expect(storyKeyToFile.size).toBe(24);
  });

  it("shares exactly the six avatar files with the groups", () => {
    const sharedKeys = [...groupKeyToFile.keys()].filter((key) => SHELL_KEYS.includes(key));
    expect(sharedKeys.sort()).toEqual([...AVATAR_KEYS].sort());
    expect(sharedFiles).toHaveLength(6);
  });

  it("reaches every group module and finds its SVG files on disk", () => {
    const modulePaths = GAME_MODULES.map((module) => module.path);
    for (const file of GROUP_MODULE_FILES) {
      expect(modulePaths, file).toContain(`src/game/art/${file}`);
    }

    expect(SVG_FILES.size).toBeGreaterThan(100);
    for (const [key, file] of [...groupKeyToFile, ...storyKeyToFile]) {
      expect(SVG_FILES.has(file), `${key} is backed by ${file}`).toBe(true);
    }
  });
});
