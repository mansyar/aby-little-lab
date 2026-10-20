/**
 * SVG → data URI helper shared by the boot preloader and the game-local art
 * modules.
 *
 * Phaser's XHRLoader detects `data:` URLs and decodes them via `atob`, so the
 * SVG must be properly base64-encoded: `btoa` throws on any character outside
 * Latin-1, which is why every asset's markup stays ASCII.
 */
export function toDataUri(svg: string): string {
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
