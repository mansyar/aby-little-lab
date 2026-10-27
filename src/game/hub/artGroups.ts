import type { ArtKeyEntry } from "./prewarm";

/**
 * Art-group tables and SVG resolver for the Hub's idle art prewarm.
 *
 * The tables say where each game's texture markup lives; the resolver lazily
 * loads one art group on first touch and answers the SVG markup behind one
 * art key. The scene (`HubScene`) keeps only delegation: it owns the
 * `textures`/`load` engine handles and the pass generation (`artPassId`),
 * while this module owns the tables, the loaders, the caches, and markup
 * resolution.
 */

/** One game-art texture: the key the game draws and the SVG markup behind it. */
export interface ArtTableAsset {
  /** Texture key, identical to the key the game's art group declares. */
  readonly key: string;
  /** Raw SVG markup for the key. */
  readonly svg: string;
}

/** One lazily loaded art table: the assets of a single art group. */
export interface ArtTableLike {
  /** The group's textures in declaration order. */
  readonly assets: readonly ArtTableAsset[];
}

/**
 * Lazy loader for one art group's table.
 *
 * Every loader is a dynamic `import()`, so the group's SVG markup ships in a
 * lazy chunk the idle pass fetches on demand — never in the shell entry. A
 * static import here would inline every game's artwork into the shell bundle
 * and break the 200 kB `validate-bundle` budget; the source guard in
 * `hubScene.test.ts` pins this module to dynamic imports only.
 */
export type ArtGroupLoader = () => Promise<readonly ArtTableLike[]>;

/** One lazy loader per art group, plus Story Order's own panel table. */
export const ART_GROUP_LOADERS: Readonly<Record<string, ArtGroupLoader>> = {
  animals: () => import("../art/animals").then((module) => [module.animals]),
  cutouts: () => import("../art/cutouts").then((module) => [module.cutouts]),
  faces: () => import("../art/faces").then((module) => [module.faces]),
  food: () => import("../art/food").then((module) => [module.food]),
  glyphs: () => import("../art/glyphs").then((module) => [module.glyphs]),
  items: () => import("../art/items").then((module) => [module.items]),
  letters: () => import("../art/letters").then((module) => [module.letters]),
  music: () => import("../art/music").then((module) => [module.music]),
  numerals: () => import("../art/numerals").then((module) => [module.numerals]),
  shadows: () => import("../art/shadows").then((module) => [module.shadows]),
  shapes: () => import("../art/shapes").then((module) => [module.shapes]),
  toys: () => import("../art/toys").then((module) => [module.toys]),
  "story-panels": () =>
    import("../storyOrderArt").then((module) => [{ assets: module.STORY_PANEL_ASSETS }]),
};

/**
 * Art groups each game draws, by game id.
 *
 * Mirrors each scene's `preloadArt([...])` declaration (Story Order declares
 * through `preloadStoryOrderArt`) and the group composition of
 * `ART_KEYS_BY_GAME` in `src/game/hub/prewarm.ts`: the key-only table decides
 * the raster order, this table decides where each key's markup is fetched from.
 * The resolver parity tests (`hubScene.test.ts` and `artGroups.test.ts`)
 * resolve every key of every game through this table, so a drift in either
 * direction fails loudly.
 */
export const ART_GROUPS_BY_GAME: Readonly<Record<string, readonly string[]>> = {
  "shape-sorter": ["cutouts", "shapes"],
  "animal-trace": ["animals", "food"],
  "pop-freeze": ["animals", "glyphs"],
  "shadow-match": ["items", "shadows"],
  "musical-memory": ["music"],
  "big-small": ["toys"],
  "pattern-builder": ["shapes"],
  "alphabet-match": ["letters"],
  "word-match": ["animals", "food", "items", "letters", "music", "shapes", "toys"],
  "word-builder": ["animals", "food", "items", "letters", "music", "shapes", "toys"],
  "how-many": ["food", "items", "numerals", "shapes"],
  "first-sounds": ["animals", "food", "items", "letters", "music", "shapes", "toys"],
  "more-less": ["food", "glyphs", "items", "shapes"],
  "odd-one-out": ["animals", "music", "shapes", "toys"],
  "color-match": ["music", "shapes"],
  "add-it-up": ["food", "glyphs", "items", "shapes"],
  "take-away": ["food", "glyphs", "items", "shapes"],
  "memory-match": ["animals", "glyphs", "items", "toys"],
  "decode-it": ["animals", "food", "items", "letters", "music", "shapes", "toys"],
  "number-order": ["numerals"],
  "feelings-faces": ["faces"],
  "story-order": ["story-panels"],
};

/** Resolves the SVG markup behind one art key, caching tables and markup. */
export interface ArtResolver {
  /**
   * Resolves the SVG markup behind one art key, lazily loading the key's art
   * group on first touch. An unknown key resolves to `undefined` so the
   * caller skips it instead of queueing a load no texture manager could
   * satisfy.
   */
  resolveArtSvg(entry: ArtKeyEntry): Promise<string | undefined>;
}

/**
 * Creates one resolver over the given loaders. Loaded tables stay cached for
 * the resolver's lifetime, and resolved markup stays cached by texture key,
 * so every game's keys pay the lazy chunk fetch at most once.
 */
export function createArtResolver(
  loaders: Readonly<Record<string, ArtGroupLoader>> = ART_GROUP_LOADERS,
): ArtResolver {
  /** Loaded art group tables, by group key; fetched once per resolver lifetime. */
  const groupCache = new Map<string, readonly ArtTableLike[]>();
  /** Resolved SVG markup, by texture key; filled as the caller walks keys. */
  const svgCache = new Map<string, string>();
  return {
    async resolveArtSvg(entry: ArtKeyEntry): Promise<string | undefined> {
      const cached = svgCache.get(entry.key);
      if (cached !== undefined) return cached;
      const groupKeys = ART_GROUPS_BY_GAME[entry.gameId] ?? [];
      for (const groupKey of groupKeys) {
        let tables = groupCache.get(groupKey);
        if (!tables) {
          const loader = loaders[groupKey];
          if (!loader) continue;
          tables = await loader();
          groupCache.set(groupKey, tables);
        }
        const asset = tables
          .flatMap((table) => table.assets)
          .find((item) => item.key === entry.key);
        if (asset) {
          svgCache.set(entry.key, asset.svg);
          return asset.svg;
        }
      }
      return undefined;
    },
  };
}
