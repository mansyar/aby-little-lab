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
import { SHELL_ASSETS } from "../../scenes/PreloadScene";
import preloadSceneSource from "../../scenes/PreloadScene.ts?raw";

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

/** `import x from "../assets/svg/…?raw"` — the only way a raw SVG enters the shell. */
const SVG_IMPORT = /import\s+(\w+)\s+from\s+"(\.\.\/assets\/svg\/[^"?]+\.svg\?raw)"/g;

/** One `{ key: "…", svg: X }` row of the shell table. */
const TABLE_ENTRY = /\{\s*key:\s*"([a-z0-9_]+)",\s*svg:\s*(\w+)\s*\}/g;

describe("PreloadScene source scan", () => {
  it("resolves every SVG import to exactly one shell-table row", () => {
    const imported = new Map<string, string>();
    for (const match of preloadSceneSource.matchAll(SVG_IMPORT)) {
      imported.set(match[1], match[2]);
    }

    const registered = new Map<string, string>();
    for (const match of preloadSceneSource.matchAll(TABLE_ENTRY)) {
      registered.set(match[1], match[2]);
    }

    // One import per shell key, and the table names each of them exactly once.
    expect(imported.size).toBe(SHELL_ASSETS.length);
    expect(registered.size).toBe(SHELL_ASSETS.length);

    for (const [identifier, path] of imported) {
      const keys = [...registered].filter(([, id]) => id === identifier).map(([key]) => key);
      expect(keys, `${path} is imported but no shell key registers it`).toHaveLength(1);
    }

    for (const [key, identifier] of registered) {
      expect(imported.has(identifier), `${key} registers an identifier it never imports`).toBe(
        true,
      );
      expect(shellKeys, key).toContain(key);
    }
  });

  it("keeps every game-only key out of the shell table", () => {
    const sourceKeys = [...preloadSceneSource.matchAll(TABLE_ENTRY)].map((match) => match[1]);
    const groupOwned = sourceKeys.filter((key) => groupKeySet.has(key));
    expect(groupOwned.sort()).toEqual([...AVATAR_KEYS].sort());
  });
});
