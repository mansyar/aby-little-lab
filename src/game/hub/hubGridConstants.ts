import { textureSizeFor } from "../../utils/textureTiers";

/**
 * Shared named constants for the Hub tile grid, extracted from the
 * `hubGrid.ts` orchestrator. Concern-specific constants live beside their
 * concern's code: the sticker shelf constants live in
 * `src/game/hub/stickerShelf.ts`, the time-up dimming constants in
 * `src/game/hub/timeUpDim.ts`, and the paged interaction constants (page
 * slide/dots/swipe) in `src/game/hub/pageBoard.ts`; this module holds the
 * layout/entrance constants every grid concern reads.
 */

/** Wide (6x4) grid tile size and spacing (px). */
export const TILE_WIDTH = 144;
/**
 * 22 tiles render as 6x4 (rows 6/6/6/4). Height and spacing are sized so the
 * 4 rows fit inside 768 with the same 119px top/bottom margins as the 15-tile
 * grid - clearing the top-band controls (avatar chip / Settings, bottom edge
 * 116) while keeping every tile and its sticker shelf on-canvas. The width is
 * the widest that keeps 6 columns inside 1024 with the 22px spacing.
 */
export const TILE_HEIGHT = 116;
export const TILE_SPACING = 22;
export const GRID_COLS = 6;
export const GRID_ROWS = 4;
/** Display size of the game icon artwork on each tile (px). */
export const TILE_ICON_DISPLAY = 64;
/** Tile icon textures are rasterized at this size (matches PreloadScene). */
export const TILE_ICON_TEXTURE_SIZE = textureSizeFor("tile_shape_sorter");
/** Vertical offset of the tile icon above the tile center (px). */
export const TILE_ICON_Y_OFFSET = -40;
/** Vertical offset of the secondary text label below the tile center (px). */
export const TILE_LABEL_Y_OFFSET = 20;

/** Delay between consecutive entrance elements (ms). */
export const ENTRANCE_STAGGER = 40;
/** Duration of each element's entrance tween (ms). */
export const ENTRANCE_DURATION = 300;
/**
 * Gentle scale "breathe" pulse for idle tiles (1 = none). Scale-only motion
 * keeps icon/label/shelf geometry fixed, unlike a vertical bob which can
 * visually collide with the fixed shelf slots.
 */
export const BOB_AMPLITUDE = 1.025;
/** Duration of one tile breathe loop (ms). */
export const BOB_DURATION = 2500;
/** Phase offset between tile breathe loops (ms). */
export const BOB_PHASE_OFFSET = 200;
/**
 * Settle gap between the entrance pop and the first breathe loop (ms).
 * Named from the previous inline `ENTRANCE_DURATION + 50` magic number.
 */
export const BOB_SETTLE_DELAY = 50;

/**
 * Paged (narrow-viewport) tile furniture offsets. Tile size, spacing and
 * centering live in src/game/hubPaging.ts (PAGED_TILE_*); the per-tile
 * furniture below scales with the taller paged tile.
 */
/** Display size of the game icon artwork on a paged tile (px). */
export const PAGED_ICON_DISPLAY = 96;
/** Vertical offset of the paged tile icon above the tile center (px). */
export const PAGED_ICON_Y_OFFSET = -58;
/** Vertical offset of the paged tile label below the tile center (px). */
export const PAGED_LABEL_Y_OFFSET = 48;
/** Label font size on paged tiles (px). */
export const PAGED_LABEL_FONT_SIZE = 20;
