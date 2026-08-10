/**
 * Glyph font utilities.
 *
 * The letter/numeral glyph SVGs (letters/, numbers/) carry
 * `font-family="'Baloo 2', Arial, Helvetica, sans-serif"`. Phaser's SVG
 * loader rasterizes `<text>` elements ONCE at load time, so the bundled
 * Baloo 2 font must be ready before Preload starts, otherwise the glyphs
 * silently rasterize as Arial on first visit (track baloo2-glyphs_20260811).
 */

/** Font descriptor matching the SVG glyphs: bold (700) at 400px. */
const BALOO_2_DESCRIPTOR = '700 400px "Baloo 2"';

/** Safety cap so a stalled font network can never block the boot sequence. */
const FONT_LOAD_TIMEOUT_MS = 2500;

/**
 * Ensures the Baloo 2 glyph font is loaded before Phaser rasterizes SVGs.
 *
 * No-throw by design: this gate NEVER rejects and NEVER hangs. On any
 * failure (missing API, thrown error, rejected load, stalled network) it
 * resolves and the SVG fallback stack (Arial, Helvetica, sans-serif)
 * renders instead — identical to the pre-fix behavior.
 */
export function ensureGlyphFontLoaded(): Promise<void> {
  if (
    typeof document === "undefined" ||
    typeof document.fonts === "undefined" ||
    typeof document.fonts.load !== "function"
  ) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, FONT_LOAD_TIMEOUT_MS);
    const settle = (): void => {
      clearTimeout(timer);
      resolve();
    };
    try {
      document.fonts.load(BALOO_2_DESCRIPTOR).then(settle, settle);
    } catch {
      // Synchronous failure (e.g. FontFaceSet unavailable): fall through.
      settle();
    }
  });
}
