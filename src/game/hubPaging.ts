/**
 * Hub paging logic (pure module).
 *
 * On narrow viewports the single tile grid would scale every tile below the
 * 64px touch-target floor (product-guidelines.md), so the Hub splits its
 * games into pages of 10 and lays each page out as a 5x2 grid of much larger
 * tiles. Wide viewports keep the 6x4 wide grid.
 *
 * All geometry is expressed in the fixed 1024x768 logical canvas space;
 * Phaser's FIT scale mode maps it onto the physical screen.
 */

/** Tiles per page (the first two pages of a 22-game hub). */
export const PAGE_SIZE = 10;

/** Number of Hub pages in paged mode: 22 games as 10 + 10 + 2. */
export const PAGE_COUNT = 3;

/**
 * Total number of Hub tiles. Duplicated here as a documented constant so this
 * module stays dependency-free; `GAME_TILES.length` in hubTiles.ts is the
 * source of truth and hubPaging.test.ts asserts the two agree.
 */
export const HUB_TILE_COUNT = 22;

/**
 * The wide-layout tile height (HubScene's TILE_HEIGHT) that the threshold is
 * derived from. Duplicated here as a documented constant so this module stays
 * dependency-free; a comment in HubScene ties the two together.
 */
const WIDE_TILE_HEIGHT = 116;

/**
 * FIT display scale below which the wide grid's tiles fall under the 64px
 * touch-target floor (measured on the tile's min edge, its height):
 * 64 / 116 ≈ 0.5517. At or above this scale the 6x4 grid is kept as-is.
 */
export const NARROW_SCALE_THRESHOLD = 64 / WIDE_TILE_HEIGHT;

/** Paged-mode tile width (5 columns x 2 rows of larger tiles). */
export const PAGED_TILE_WIDTH = 176;

/** Paged-mode tile height (larger than the wide layout's 116). */
export const PAGED_TILE_HEIGHT = 196;

/** Spacing between paged tiles (both axes). */
export const PAGED_TILE_SPACING = 20;

/**
 * The Phaser FIT display scale for the given viewport: the canvas scales
 * uniformly to fit inside it, so the scale is the smaller of the two ratios.
 */
export function fitDisplayScale(
  displayWidth: number,
  displayHeight: number,
  baseWidth = 1024,
  baseHeight = 768,
): number {
  return Math.min(displayWidth / baseWidth, displayHeight / baseHeight);
}

/**
 * True when the viewport is narrow enough that the wide 6x4 grid would drop
 * tiles below the 64px touch-target floor — those viewports get the paged
 * grid instead.
 */
export function isNarrowViewport(
  displayWidth: number,
  displayHeight: number,
  baseWidth = 1024,
  baseHeight = 768,
): boolean {
  return (
    fitDisplayScale(displayWidth, displayHeight, baseWidth, baseHeight) < NARROW_SCALE_THRESHOLD
  );
}

/**
 * Tile indexes shown on the given page: page 0 shows games 1-10, page 1 shows
 * games 11-20, and the last page shows whatever remains (matching the wide
 * grid's reading order).
 */
export function pageTileIndexes(page: number): number[] {
  if (!Number.isInteger(page) || page < 0 || page >= PAGE_COUNT) {
    throw new RangeError(`page must be 0..${PAGE_COUNT - 1}, got ${page}`);
  }
  const start = page * PAGE_SIZE;
  const remaining = Math.max(0, HUB_TILE_COUNT - start);
  return Array.from({ length: Math.min(PAGE_SIZE, remaining) }, (_, i) => start + i);
}

/** The page a tile index belongs to. */
export function pageOf(tileIndex: number): number {
  return Math.floor(tileIndex / PAGE_SIZE);
}

/**
 * Center position and size of a paged tile (0..PAGE_SIZE-1 within a page) in
 * the logical canvas space: 5 columns x 2 rows, centered with margins that
 * clear the top control band (avatar chip / Settings, 116px) and the bottom
 * corner mascot band (~148px).
 *
 * `tilesOnPage` (default: a full page) narrows the column box so a partial
 * page reads as centred instead of hugging the left edge: a 1-tile page sits at
 * the canvas centre-x, while the two-row vertical box is kept so every row
 * stays clear of the top and bottom bands. Full pages are byte-identical.
 */
export function pagedTilePosition(
  indexInPage: number,
  tilesOnPage = PAGE_SIZE,
  canvasWidth = 1024,
  canvasHeight = 768,
): { x: number; y: number; width: number; height: number } {
  const cols = Math.min(5, Math.max(1, Math.ceil(tilesOnPage)));
  const rows = 2;
  const gridW = cols * PAGED_TILE_WIDTH + (cols - 1) * PAGED_TILE_SPACING;
  const gridH = rows * PAGED_TILE_HEIGHT + (rows - 1) * PAGED_TILE_SPACING;
  const startX = (canvasWidth - gridW) / 2;
  const startY = (canvasHeight - gridH) / 2;
  const col = indexInPage % cols;
  const row = Math.floor(indexInPage / cols);
  return {
    x: startX + col * (PAGED_TILE_WIDTH + PAGED_TILE_SPACING) + PAGED_TILE_WIDTH / 2,
    y: startY + row * (PAGED_TILE_HEIGHT + PAGED_TILE_SPACING) + PAGED_TILE_HEIGHT / 2,
    width: PAGED_TILE_WIDTH,
    height: PAGED_TILE_HEIGHT,
  };
}
