/**
 * Art group contract for the shell diet.
 *
 * A group is a named, statically imported table of textures that only games
 * draw. Groups live outside the boot shell: a scene declares the groups it
 * needs and hands them to `preloadArtGroups` in its own `preload`, so their SVG
 * markup lands in that game's lazy chunk instead of the shell entry.
 *
 * Phaser's `preload` is synchronous, so groups are ordinary module objects that
 * a scene imports statically — never dynamically imported, which would resolve
 * after the loader has already flushed its queue.
 */

/** Stable identifier for one game art group. */
export type ArtGroupId =
  | "shapes"
  | "cutouts"
  | "letters"
  | "numerals"
  | "animals"
  | "food"
  | "items"
  | "shadows"
  | "toys"
  | "faces"
  | "music"
  | "glyphs";

/**
 * One texture: the key the game draws with and the SVG markup behind it.
 *
 * The key is the identity that `textureSizeFor` resolves a raster tier for and
 * that `PreloadScene` used to register, so a moved key keeps its exact size.
 */
export interface ArtAsset {
  readonly key: string;
  readonly svg: string;
}

/**
 * A named table of game-only art.
 *
 * `id` identifies the group to scenes and tests; `assets` holds the keys.
 * A key belongs to exactly one group across the whole registry.
 */
export interface ArtGroup {
  readonly id: ArtGroupId;
  readonly assets: readonly ArtAsset[];
}
