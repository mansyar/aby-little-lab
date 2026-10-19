/**
 * Per-use texture raster tiers.
 *
 * All SVG assets were historically rasterized at a uniform 512×512
 * (`SVG_RASTER_SIZE` in PreloadScene), costing ~184 MB of potential GPU
 * texture memory (176 × 512² × 4 B RGBA) while most consumers display them
 * far smaller (Hub tile icons at 64 px, letters at 128 px, gameplay cards at
 * 256 px). Tiers size each texture for its **largest display context**:
 *
 * - `icon` (160): Hub tile icons, shadow silhouettes, letters, numerals,
 *   small UI symbols — largest known display ≈ 128 px.
 * - `card` (256): gameplay art (animals, shapes, cutouts, items, toys),
 *   stickers, prompt targets — largest known display ≈ 256 px.
 * - `hero` (512): mascot art — `Mascot.ts` scale math assumes the 512 px
 *   texture (`MASCOT_SCALE = 0.2`); keep these at full size.
 *
 * Unknown keys fall back to `card` — the safe default for new art.
 */

export const TEXTURE_SIZES = {
  icon: 160,
  card: 256,
  hero: 512,
} as const;

export type TextureTier = keyof typeof TEXTURE_SIZES;

/** Ordered rules: first prefix/exact match wins; unmatched keys default to `card`. */
const TIER_RULES: ReadonlyArray<readonly [RegExp, TextureTier]> = [
  [/^tile_/, "icon"],
  [/^sm_shadow_/, "icon"],
  [/^(minus|plus|equals|sleep_zzz|icon_speaker)$/, "icon"],
  [/^mascot_/, "hero"],
];

const DEFAULT_TIER: TextureTier = "card";

/** Resolves the raster tier for a texture key. */
export function tierForKey(key: string): TextureTier {
  for (const [pattern, tier] of TIER_RULES) {
    if (pattern.test(key)) return tier;
  }
  return DEFAULT_TIER;
}

/** Resolves the raster size (square, px) for a texture key. */
export function textureSizeFor(key: string): number {
  return TEXTURE_SIZES[tierForKey(key)];
}

/**
 * Scale that displays `key` at `displaySize` px, derived from the texture's
 * own tier size. Replaces hardcoded `displaySize / 512` math at call sites
 * so scales stay correct as tiers change.
 */
export function displayScale(key: string, displaySize: number): number {
  return displaySize / textureSizeFor(key);
}
