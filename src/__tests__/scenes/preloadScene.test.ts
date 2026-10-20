import { describe, expect, it, vi } from "vitest";

/**
 * Mock Phaser minimally: PreloadScene only needs `Phaser.Scene` at import
 * time (SHELL_ASSETS is a module-scope constant; real Phaser probes a canvas
 * 2D context on import, which happy-dom does not provide).
 */
vi.mock("phaser", () => {
  const phaserMock = {
    Scene: class Scene {},
    Scale: { FIT: "FIT" },
  };
  return { ...phaserMock, default: phaserMock };
});

import {
  type ArtGroup,
  animals,
  cutouts,
  faces,
  food,
  glyphs,
  items,
  letters,
  music,
  numerals,
  shadows,
  shapes,
  toys,
} from "../../game/art";
import { GAME_REGISTRY } from "../../game/gameRegistry";
import { SHELL_ASSETS } from "../../scenes/PreloadScene";
import preloadSceneSource from "../../scenes/PreloadScene.ts?raw";

/** Raw SVG sources on disk, discovered independently of the scene module. */
const UI_SVGS = import.meta.glob<string>("../../assets/svg/ui/**/*.svg", {
  eager: true,
  query: "?raw",
  import: "default",
});
const STICKER_SVGS = import.meta.glob<string>("../../assets/svg/stickers/*.svg", {
  eager: true,
  query: "?raw",
  import: "default",
});

/** The twelve art groups — the owner of every key the shell no longer ships. */
const GROUPS: readonly ArtGroup[] = [
  shapes,
  cutouts,
  letters,
  numerals,
  animals,
  food,
  items,
  shadows,
  toys,
  faces,
  music,
  glyphs,
];

const groupKeys = (group: ArtGroup): string[] => group.assets.map((asset) => asset.key);
const allGroupKeys = GROUPS.flatMap(groupKeys);
const groupKeySet = new Set(allGroupKeys);

/**
 * The one deliberate shell/game overlap (FR-4): these six avatars stay eager
 * because `ProfileChip` and the Settings avatar picker render before any game
 * scene loads. Asserted explicitly rather than compared by prefix, exactly as
 * `groupIntegrity.test.ts` does.
 */
const AVATAR_KEYS: readonly string[] = [
  "animal_cat",
  "animal_dog",
  "animal_pig",
  "frog_red",
  "sm_duck",
  "toy_teddy_bear",
];

/** How many SVGs the shell and the twelve groups carry together. */
const CANONICAL_ASSET_COUNT = 178;

const shellKeys = SHELL_ASSETS.map((asset) => asset.key);

describe("PreloadScene SHELL_ASSETS", () => {
  it("carries exactly the 53 documented shell keys, all unique", () => {
    expect(SHELL_ASSETS).toHaveLength(53);
    expect(new Set(shellKeys).size).toBe(shellKeys.length);
  });

  it("holds non-empty SVG markup for every shell key", () => {
    for (const asset of SHELL_ASSETS) {
      expect(asset.svg.trimStart().startsWith("<svg"), asset.key).toBe(true);
    }
  });

  it("leaves every game-only key to its group, with the six avatars the only overlap", () => {
    const overlaps = shellKeys.filter((key) => groupKeySet.has(key));
    expect(overlaps.sort()).toEqual([...AVATAR_KEYS].sort());
  });

  it("leaves the shell and the groups owning 178 keys in total", () => {
    const union = new Set([...shellKeys, ...allGroupKeys]);
    expect(union.size).toBe(CANONICAL_ASSET_COUNT);
  });
});

/** `{ key: "…", svg: X }` — only the non-game rows stay literal after derivation. */
const TABLE_ENTRY = /\{\s*key:\s*"([a-z0-9_]+)",\s*svg:\s*(\w+)\s*\}/g;

/** The 44 game keys in derived order: every tile, then every sticker. */
const GAME_KEYS: readonly string[] = [
  ...GAME_REGISTRY.map((game) => game.tileKey),
  ...GAME_REGISTRY.map((game) => game.stickerKey),
];

/**
 * The nine non-game shell keys, in table order. No registry entry owns them, so
 * they stay literal and are asserted as such.
 */
const NON_GAME_KEYS: readonly string[] = [
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

/** Raw SVG sources keyed by file stem. */
function svgSourcesByStem(globbed: Record<string, string>): Map<string, string> {
  const sources = new Map<string, string>();
  for (const [path, svg] of Object.entries(globbed)) {
    sources.set(path.slice(path.lastIndexOf("/") + 1, -".svg".length), svg);
  }
  return sources;
}

describe("PreloadScene game block", () => {
  it("derives every tile then every sticker in registry order", () => {
    expect(shellKeys.slice(0, GAME_KEYS.length)).toEqual(GAME_KEYS);
    expect(GAME_KEYS).toHaveLength(GAME_REGISTRY.length * 2);
  });

  it("puts the nine non-game keys after the derived block, unchanged", () => {
    expect(shellKeys.slice(GAME_KEYS.length)).toEqual([...NON_GAME_KEYS]);
  });

  it("takes each game key's SVG from the file named after it", () => {
    const files = new Map([...svgSourcesByStem(UI_SVGS), ...svgSourcesByStem(STICKER_SVGS)]);
    const shellByKey = new Map(SHELL_ASSETS.map((asset) => [asset.key, asset.svg]));

    for (const key of GAME_KEYS) {
      expect(files.get(key), `${key} has no SVG file`).toBe(shellByKey.get(key));
    }
  });
});

describe("PreloadScene source scan", () => {
  it("keeps only the non-game rows literal in the shell table", () => {
    const literalKeys = [...preloadSceneSource.matchAll(TABLE_ENTRY)].map((match) => match[1]);
    expect(literalKeys).toEqual([...NON_GAME_KEYS]);
  });

  it("spells no game key out by hand", () => {
    expect(preloadSceneSource).not.toMatch(/key: "(?:tile|sticker)_/);
    expect(preloadSceneSource).not.toMatch(/from "\.\.\/assets\/svg\/(?:ui\/tiles|stickers)\//);
  });

  it("keeps every game-only key out of the literal rows", () => {
    const literalKeys = [...preloadSceneSource.matchAll(TABLE_ENTRY)].map((match) => match[1]);
    const groupOwned = literalKeys.filter((key) => groupKeySet.has(key));
    expect(groupOwned.sort()).toEqual([...AVATAR_KEYS].sort());
  });
});
