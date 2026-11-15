import { describe, expect, it } from "vitest";
import {
  CHIP_GAP,
  CHIP_HEIGHT,
  CHIP_LABEL_Y,
  CHIP_ROW_CENTER_Y,
  CHIP_WIDTH,
  chipCenter,
  GROUP_TILE_HEIGHT,
  GROUP_TILE_SPACING,
  GROUP_TILE_WIDTH,
  groupTilePosition,
} from "../../../game/hub/groupLayout";
import { fitDisplayScale } from "../../../game/hubPaging";

/**
 * Chip band and filtered-board geometry (spec FR-2, FR-4, NFR-1, AC-4).
 *
 * The numbers below are the measured layout, not a re-derivation: the chip row
 * has to clear the avatar chip (ends at x=116) and Settings (starts at x=908),
 * and the filtered board has to stay between the chip band and the mascot band.
 * A drift in either is a visible collision on a child's screen, so it is pinned
 * rather than recomputed.
 */

const CANVAS = { width: 1024, height: 768 };

/** Every chip centre in draw order on the base canvas. */
const CHIP_CENTRES = [247, 353, 459, 565, 671, 777];

describe("groupLayout — chip row", () => {
  it("places six chips on the measured centres, centred on the canvas", () => {
    for (let index = 0; index < CHIP_CENTRES.length; index++) {
      const { x, y } = chipCenter(index);
      expect(x).toBe(CHIP_CENTRES[index]);
      expect(y).toBe(CHIP_ROW_CENTER_Y);
    }
    // Symmetric about the canvas centre: the outer edges are the same distance out.
    const first = chipCenter(0);
    const last = chipCenter(CHIP_CENTRES.length - 1);
    expect(first.x - CHIP_WIDTH / 2).toBe(1024 - (last.x + CHIP_WIDTH / 2));
  });

  it("clears the avatar chip on the left and Settings on the right", () => {
    const first = chipCenter(0);
    const last = chipCenter(CHIP_CENTRES.length - 1);
    // ProfileChip's hit box ends at x=116; Settings' starts at x=908.
    expect(first.x - CHIP_WIDTH / 2).toBeGreaterThan(116);
    expect(last.x + CHIP_WIDTH / 2).toBeLessThan(908);
  });

  it("keeps a gap between neighbouring chips and a 96x84 hit area", () => {
    for (let index = 1; index < CHIP_CENTRES.length; index++) {
      const previous = chipCenter(index - 1);
      const current = chipCenter(index);
      expect(current.x - previous.x).toBe(CHIP_WIDTH + CHIP_GAP);
    }
    // The min edge still clears the 64px touch floor at 1:1, like the 96px
    // Settings hit box it shares the band with.
    expect(Math.min(CHIP_WIDTH, CHIP_HEIGHT)).toBeGreaterThanOrEqual(64);
  });

  it("sits entirely inside the top band, above the grid's first row", () => {
    const top = CHIP_ROW_CENTER_Y - CHIP_HEIGHT / 2;
    const bottom = CHIP_ROW_CENTER_Y + CHIP_HEIGHT / 2;
    expect(top).toBeGreaterThanOrEqual(20);
    expect(bottom).toBeLessThanOrEqual(116); // avatar chip / Settings band
    expect(bottom).toBeLessThan(119); // the wide grid's first row top
    expect(CHIP_LABEL_Y + 8).toBeLessThanOrEqual(bottom);
  });
});

describe("groupLayout — filtered board", () => {
  /** Centres of a filtered board's tiles, in draw order. */
  const centres = (count: number): Array<[number, number]> =>
    Array.from({ length: count }, (_, index) => {
      const { x, y } = groupTilePosition(index, count);
      return [x, y];
    });

  it("lays six tiles out as 3x2 centred on the canvas", () => {
    expect(centres(6)).toEqual([
      [316, 276],
      [512, 276],
      [708, 276],
      [316, 492],
      [512, 492],
      [708, 492],
    ]);
  });

  it("centres a short last row instead of hugging the left edge", () => {
    // Five tiles are 3 + 2: the pair sits centred under the triple.
    expect(centres(5)).toEqual([
      [316, 276],
      [512, 276],
      [708, 276],
      [414, 492],
      [610, 492],
    ]);
    // Four tiles are 3 + 1: the single tile is centred.
    expect(centres(4)).toEqual([
      [316, 276],
      [512, 276],
      [708, 276],
      [512, 492],
    ]);
  });

  it("keeps one to three tiles in a single centred row", () => {
    expect(centres(3)).toEqual([
      [316, 384],
      [512, 384],
      [708, 384],
    ]);
    expect(centres(2)).toEqual([
      [414, 384],
      [610, 384],
    ]);
    expect(centres(1)).toEqual([[512, 384]]);
  });

  it("keeps every tile inside the canvas between the chip and mascot bands", () => {
    for (let count = 1; count <= 6; count++) {
      for (const [x, y] of centres(count)) {
        expect(x - GROUP_TILE_WIDTH / 2).toBeGreaterThanOrEqual(0);
        expect(x + GROUP_TILE_WIDTH / 2).toBeLessThanOrEqual(CANVAS.width);
        expect(y - GROUP_TILE_HEIGHT / 2).toBeGreaterThanOrEqual(108); // chip band bottom
        expect(y + GROUP_TILE_HEIGHT / 2).toBeLessThanOrEqual(620); // corner mascot band
      }
    }
  });

  it("spaces tiles by the group spacing on both axes", () => {
    const [first] = centres(2);
    const [, second] = centres(2);
    expect((second?.[0] ?? 0) - (first?.[0] ?? 0)).toBe(GROUP_TILE_WIDTH + GROUP_TILE_SPACING);
    const [secondRow] = centres(4).slice(3);
    const [, firstRow] = centres(4).slice(1);
    expect((secondRow?.[1] ?? 0) - (firstRow?.[1] ?? 0)).toBe(
      GROUP_TILE_HEIGHT + GROUP_TILE_SPACING,
    );
  });

  it("uses tiles larger than the All grid's, above the touch floor on a phone", () => {
    const tile = groupTilePosition(0, 6);
    expect(tile.width).toBe(GROUP_TILE_WIDTH);
    expect(tile.height).toBe(GROUP_TILE_HEIGHT);
    expect(tile.width).toBeGreaterThan(144); // the wide All tile
    // The smallest phone shape the paged layout is designed for.
    const scale = fitDisplayScale(740, 360);
    expect(Math.min(tile.width, tile.height) * scale).toBeGreaterThanOrEqual(64);
  });
});
