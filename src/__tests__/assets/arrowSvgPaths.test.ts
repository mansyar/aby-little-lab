import { describe, expect, it } from "vitest";
import arrowDownSvg from "../../assets/svg/ui/arrow_down.svg?raw";
import arrowUpSvg from "../../assets/svg/ui/arrow_up.svg?raw";

/**
 * Regression guard for the More or Less comparison arrows.
 *
 * Phaser 4's SVG rasterizer falls back to the default 32px missing-texture
 * when a path uses `H`/`V` shorthand segments (confirmed live + local on
 * 2026-08-08: the arrow rendered as a tiny dark square). Both arrow SVGs
 * must therefore use only `M`/`L`/`Z` commands, and the geometry must stay
 * exactly the storybook up/down arrow (blue fill, 26px dark outline).
 */

/** Extracts the first `d="..."` path data from an SVG string. */
function pathData(svg: string): string {
  const match = svg.match(/d="([^"]+)"/);
  if (!match) throw new Error("SVG has no path data");
  return match[1];
}

const UP_EXPECTED = "M 256 88 L 400 240 L 318 240 L 318 424 L 194 424 L 194 240 L 112 240 Z";
const DOWN_EXPECTED = "M 256 424 L 400 272 L 318 272 L 318 88 L 194 88 L 194 272 L 112 272 Z";

describe("More or Less arrow SVGs (Phaser 4 rasterizer guard)", () => {
  it("keeps the arrow_up geometry identical (up-pointing storybook arrow)", () => {
    expect(pathData(arrowUpSvg)).toBe(UP_EXPECTED);
  });

  it("keeps the arrow_down geometry identical (down-pointing storybook arrow)", () => {
    expect(pathData(arrowDownSvg)).toBe(DOWN_EXPECTED);
  });

  it("uses only M/L/Z path commands that Phaser 4 rasterizes reliably", () => {
    const commands = `${pathData(arrowUpSvg)} ${pathData(arrowDownSvg)}`.split(/\s+/);
    for (const token of commands) {
      // Command tokens are single letters; coordinates are numbers.
      expect(/^[MLZmlz]$/.test(token) || /^-?\d+(\.\d+)?$/.test(token)).toBe(true);
    }
  });

  it("keeps the storybook styling (blue fill, thick dark outline)", () => {
    expect(arrowUpSvg).toContain('fill="#2B6CB0"');
    expect(arrowUpSvg).toContain('stroke="#2D3748"');
    expect(arrowUpSvg).toContain('stroke-width="26"');
    expect(arrowDownSvg).toContain('fill="#2B6CB0"');
    expect(arrowDownSvg).toContain('stroke="#2D3748"');
    expect(arrowDownSvg).toContain('stroke-width="26"');
  });
});
