/**
 * Shared typography constants for the app.
 *
 * The primary face is "Baloo 2", a rounded, child-friendly variable font
 * bundled locally at public/fonts/baloo2-latin.woff2 and declared via
 * @font-face in src/styles/style.css. It is precached by the PWA so the app
 * renders consistently offline and across devices.
 *
 * Usage in Phaser text styles:
 *   this.add.text(x, y, "Label", { fontFamily: FONT_FAMILY, fontSize: "24px" })
 */

export const FONT_FAMILY =
  '"Baloo 2", "Comic Sans MS", "Segoe Print", "Chalkboard SE", system-ui, sans-serif';

/** Small labels, secondary hints, footer text. */
export const FONT_SIZE_SMALL = 18;
/** Back buttons, toast body, primary game text. */
export const FONT_SIZE_MEDIUM = 24;
/** Panel titles, prominent parent-facing rows. */
export const FONT_SIZE_LARGE = 32;
/** Large parent-facing rows and overlay instructions. */
export const FONT_SIZE_XLARGE = 40;

/**
 * Returns a Phaser Text style object with the app font family applied.
 *
 * Pass the caller's own style props (fontSize, color, ...) and the bundled
 * Baloo 2 family is prepended automatically. Without this, Phaser falls back
 * to its default Courier font.
 *
 * @example
 * this.add.text(x, y, "Hello", textStyle({ fontSize: "24px", color: "#2d3748" }))
 */
export function textStyle(
  style: Record<string, unknown> = {},
): Record<string, unknown> {
  return { fontFamily: FONT_FAMILY, ...style };
}
