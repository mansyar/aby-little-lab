/**
 * Game art groups and their loader — the public surface of `src/game/art/`.
 *
 * Scenes import the groups they draw statically and pass them to
 * `preloadArtGroups` in `preload`; nothing here is reachable from the boot
 * shell, so the SVG markup ships in each game's lazy chunk.
 */

export { animals } from "./animals";
export { cutouts } from "./cutouts";
export { faces } from "./faces";
export { food } from "./food";
export { glyphs } from "./glyphs";
export { items } from "./items";
export { letters } from "./letters";
export { music } from "./music";
export { numerals } from "./numerals";
export { ensureArtTexture } from "./placeholder";
export { preloadArtGroups } from "./registry";
export { shadows } from "./shadows";
export { shapes } from "./shapes";
export { toys } from "./toys";
export type { ArtAsset, ArtGroup, ArtGroupId } from "./types";
