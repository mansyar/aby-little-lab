import { describe, expect, it } from "vitest";
import letterASvg from "../../assets/svg/letters/letter_a.svg?raw";
import letterBSvg from "../../assets/svg/letters/letter_b.svg?raw";
import letterCSvg from "../../assets/svg/letters/letter_c.svg?raw";
import letterDSvg from "../../assets/svg/letters/letter_d.svg?raw";
import letterESvg from "../../assets/svg/letters/letter_e.svg?raw";
import letterFSvg from "../../assets/svg/letters/letter_f.svg?raw";
import letterGSvg from "../../assets/svg/letters/letter_g.svg?raw";
import letterHSvg from "../../assets/svg/letters/letter_h.svg?raw";
import letterISvg from "../../assets/svg/letters/letter_i.svg?raw";
import letterJSvg from "../../assets/svg/letters/letter_j.svg?raw";
import letterKSvg from "../../assets/svg/letters/letter_k.svg?raw";
import letterLSvg from "../../assets/svg/letters/letter_l.svg?raw";
import letterMSvg from "../../assets/svg/letters/letter_m.svg?raw";
import letterNSvg from "../../assets/svg/letters/letter_n.svg?raw";
import letterOSvg from "../../assets/svg/letters/letter_o.svg?raw";
import letterPSvg from "../../assets/svg/letters/letter_p.svg?raw";
import letterQSvg from "../../assets/svg/letters/letter_q.svg?raw";
import letterRSvg from "../../assets/svg/letters/letter_r.svg?raw";
import letterSSvg from "../../assets/svg/letters/letter_s.svg?raw";
import letterTSvg from "../../assets/svg/letters/letter_t.svg?raw";
import letterUSvg from "../../assets/svg/letters/letter_u.svg?raw";
import letterVSvg from "../../assets/svg/letters/letter_v.svg?raw";
import letterWSvg from "../../assets/svg/letters/letter_w.svg?raw";
import letterXSVg from "../../assets/svg/letters/letter_x.svg?raw";
import letterYSvg from "../../assets/svg/letters/letter_y.svg?raw";
import letterZSvg from "../../assets/svg/letters/letter_z.svg?raw";
import numeral0Svg from "../../assets/svg/numbers/numeral_0.svg?raw";
import numeral1Svg from "../../assets/svg/numbers/numeral_1.svg?raw";
import numeral2Svg from "../../assets/svg/numbers/numeral_2.svg?raw";
import numeral3Svg from "../../assets/svg/numbers/numeral_3.svg?raw";
import numeral4Svg from "../../assets/svg/numbers/numeral_4.svg?raw";
import numeral5Svg from "../../assets/svg/numbers/numeral_5.svg?raw";
import numeral6Svg from "../../assets/svg/numbers/numeral_6.svg?raw";
import numeral7Svg from "../../assets/svg/numbers/numeral_7.svg?raw";
import numeral8Svg from "../../assets/svg/numbers/numeral_8.svg?raw";
import numeral9Svg from "../../assets/svg/numbers/numeral_9.svg?raw";
import tileFirstSoundsSvg from "../../assets/svg/ui/tiles/tile_first_sounds.svg?raw";
import stickerFirstSoundsSvg from "../../assets/svg/stickers/sticker_first_sounds.svg?raw";

/**
 * Regression guard for the glyph font consistency fix (track
 * baloo2-glyphs_20260811).
 *
 * Phaser 4 rasterizes SVG <text> elements ONCE at load time using whatever
 * font resolves at that moment. These 38 SVGs must declare the bundled
 * Baloo 2 font FIRST (with an Arial fallback) so every device renders the
 * same learning-content glyphs; if the Arial-only stack ever returns, the
 * cross-device glyph-variance known issue is back. The remaining styling
 * contract (bold 400px, blue fill, dark 14px outline, paint-order, centered)
 * must stay byte-identical — letters/numerals are distinguished by shape
 * only, per product decision.
 */

const NEW_STACK = 'font-family="\'Baloo 2\', Arial, Helvetica, sans-serif"';
const OLD_ARIAL_ONLY = 'font-family="Arial, Helvetica, sans-serif"';

const GLYPH_SVGS: ReadonlyArray<readonly [name: string, svg: string]> = [
  ["letter_a", letterASvg],
  ["letter_b", letterBSvg],
  ["letter_c", letterCSvg],
  ["letter_d", letterDSvg],
  ["letter_e", letterESvg],
  ["letter_f", letterFSvg],
  ["letter_g", letterGSvg],
  ["letter_h", letterHSvg],
  ["letter_i", letterISvg],
  ["letter_j", letterJSvg],
  ["letter_k", letterKSvg],
  ["letter_l", letterLSvg],
  ["letter_m", letterMSvg],
  ["letter_n", letterNSvg],
  ["letter_o", letterOSvg],
  ["letter_p", letterPSvg],
  ["letter_q", letterQSvg],
  ["letter_r", letterRSvg],
  ["letter_s", letterSSvg],
  ["letter_t", letterTSvg],
  ["letter_u", letterUSvg],
  ["letter_v", letterVSvg],
  ["letter_w", letterWSvg],
  ["letter_x", letterXSVg],
  ["letter_y", letterYSvg],
  ["letter_z", letterZSvg],
  ["numeral_0", numeral0Svg],
  ["numeral_1", numeral1Svg],
  ["numeral_2", numeral2Svg],
  ["numeral_3", numeral3Svg],
  ["numeral_4", numeral4Svg],
  ["numeral_5", numeral5Svg],
  ["numeral_6", numeral6Svg],
  ["numeral_7", numeral7Svg],
  ["numeral_8", numeral8Svg],
  ["numeral_9", numeral9Svg],
  ["tile_first_sounds", tileFirstSoundsSvg],
  ["sticker_first_sounds", stickerFirstSoundsSvg],
];

describe.each(GLYPH_SVGS)("%s.svg (glyph font regression guard)", (_name, svg) => {
  it("declares the bundled Baloo 2 font first with an Arial fallback", () => {
    expect(svg).toContain(NEW_STACK);
  });

  it("does not regress to the Arial-only font stack", () => {
    expect(svg).not.toContain(OLD_ARIAL_ONLY);
  });

  it("keeps the storybook glyph styling (bold, blue, dark outline, centered)", () => {
    expect(svg).toContain('font-weight="bold"');
    expect(svg).toContain('font-size="400"');
    expect(svg).toContain('fill="#2B6CB0"');
    expect(svg).toContain('stroke="#2D3748"');
    expect(svg).toContain('stroke-width="14"');
    expect(svg).toContain('paint-order="stroke fill"');
    expect(svg).toContain('text-anchor="middle"');
    expect(svg).toContain('dominant-baseline="central"');
  });
});
