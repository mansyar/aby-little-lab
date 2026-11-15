import { HUB_SELECTIONS } from "../hubGroups";

/**
 * Geometry for the Hub's group chips and the board a group draws (spec FR-2,
 * FR-4, D2, D3).
 *
 * Pure numbers only — no Phaser import, the `gridLayout`/`pageBoard` precedent —
 * so the chip band and the filtered board can be asserted without a scene. The
 * canvas is the fixed 1024x768 logical space every Hub layout is expressed in;
 * `Phaser.Scale.FIT` maps it onto the physical screen.
 */

/** Chip width (px, logical). */
export const CHIP_WIDTH = 96;
/** Chip height (px, logical); sized to the existing top-band controls. */
export const CHIP_HEIGHT = 84;
/** Gap between two chips (px). */
export const CHIP_GAP = 10;
/**
 * Vertical centre of the chip row (px). The row owns the band between the
 * avatar chip and Settings (y 20..116), so the top of a chip is 24 and its
 * bottom is 108 — clear of both controls and of the grid's first row at 119.
 */
export const CHIP_ROW_CENTER_Y = 66;
/** Display size of a chip's glyph (px). */
export const CHIP_GLYPH_DISPLAY = 40;
/** Vertical centre of a chip's glyph (px). */
export const CHIP_GLYPH_Y = 52;
/** Vertical centre of a chip's one-word label (px). */
export const CHIP_LABEL_Y = 92;
/** Chip label font size (px). */
export const CHIP_LABEL_FONT_SIZE = 14;

/** Tile size on a filtered board (px) — the paged tile, in both layouts. */
export const GROUP_TILE_WIDTH = 176;
/** Tile height on a filtered board (px). */
export const GROUP_TILE_HEIGHT = 196;
/** Spacing between filtered tiles, both axes (px). */
export const GROUP_TILE_SPACING = 20;
/** Widest a filtered board gets, in columns. */
const GROUP_MAX_COLS = 3;

/**
 * Centre of chip `index` in a row of every selection, centred on the canvas:
 * six 96x84 chips 10px apart span 626px, so they clear the avatar chip (ends at
 * x=116) and Settings (starts at x=908) with room to spare.
 */
export function chipCenter(index: number, canvasWidth = 1024): { x: number; y: number } {
  const count = HUB_SELECTIONS.length;
  const total = count * CHIP_WIDTH + (count - 1) * CHIP_GAP;
  const left = (canvasWidth - total) / 2;
  return {
    x: left + index * (CHIP_WIDTH + CHIP_GAP) + CHIP_WIDTH / 2,
    y: CHIP_ROW_CENTER_Y,
  };
}

/**
 * Centre and size of tile `index` of `count` on a filtered board.
 *
 * One to three tiles sit in a single row of that many columns; four or more wrap
 * at three columns. Every row is centred inside the board and the board is
 * centred on the canvas, so a short last row (a 4-tile group's second row, a
 * 5-tile group's pair) reads as deliberate rather than left-aligned.
 */
export function groupTilePosition(
  index: number,
  count: number,
  canvasWidth = 1024,
  canvasHeight = 768,
): { x: number; y: number; width: number; height: number } {
  const tiles = Math.max(1, Math.ceil(count));
  const cols = Math.min(tiles, GROUP_MAX_COLS);
  const rows = Math.ceil(tiles / cols);
  const boardHeight = rows * GROUP_TILE_HEIGHT + (rows - 1) * GROUP_TILE_SPACING;
  const startY = (canvasHeight - boardHeight) / 2;

  const row = Math.floor(index / cols);
  const col = index % cols;
  const itemsInRow = Math.min(cols, tiles - row * cols);
  const rowWidth = itemsInRow * GROUP_TILE_WIDTH + (itemsInRow - 1) * GROUP_TILE_SPACING;
  const rowLeft = (canvasWidth - rowWidth) / 2;

  return {
    x: rowLeft + col * (GROUP_TILE_WIDTH + GROUP_TILE_SPACING) + GROUP_TILE_WIDTH / 2,
    y: startY + row * (GROUP_TILE_HEIGHT + GROUP_TILE_SPACING) + GROUP_TILE_HEIGHT / 2,
    width: GROUP_TILE_WIDTH,
    height: GROUP_TILE_HEIGHT,
  };
}
