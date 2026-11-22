import type { HubGrid } from "../hubGrid";
import { ALL_GROUP_ID, visibleTileIndexes } from "../hubGroups";
import { pagedTilePosition, pageTileIndexes } from "../hubPaging";
import { GAME_TILES } from "../hubTiles";
import { wideGridOrigin, wideTileCenter } from "./gridLayout";
import { groupTilePosition } from "./groupLayout";
import { createShelfSticker, PAGED_STICKER_DISPLAY_SIZE } from "./stickerShelf";

/**
 * Sticker-shelf rebuild after a parental progress reset. Split out of
 * `gridBuilder.ts` to keep that module under the strict size budget; the
 * function is re-exported there, so all callers keep their import path and the
 * exact geometry/state behavior is preserved.
 */

/** Rebuilds the shelf from storage so cleared stickers immediately show as dimmed. */
export function rerenderStickerShelf(grid: HubGrid): void {
  const scene = grid.deps.scene;
  for (const sticker of grid.stickerImages) sticker.destroy();
  grid.stickerImages = [];
  for (const graphics of grid.emptySlotGraphics) graphics.destroy();
  grid.emptySlotGraphics = [];
  if (grid.selection !== ALL_GROUP_ID) {
    // A filtered board draws only its group's shelf, so a parental reset must
    // not resurrect slots for the games it is not showing.
    const indexes = visibleTileIndexes(grid.selection);
    indexes.forEach((globalIndex, slot) => {
      const pos = groupTilePosition(slot, indexes.length);
      createShelfSticker(grid, globalIndex, pos.x, pos.y, pos.height, PAGED_STICKER_DISPLAY_SIZE);
    });
    return;
  }
  if (grid.paged) {
    // Only the active page exists on screen; the other page is rebuilt
    // (with fresh sticker state) whenever it is flipped to.
    const active = pageTileIndexes(grid.hubPage);
    active.forEach((globalIndex, slot) => {
      const pos = pagedTilePosition(slot, active.length);
      createShelfSticker(grid, globalIndex, pos.x, pos.y, pos.height, PAGED_STICKER_DISPLAY_SIZE);
    });
    return;
  }
  const origin = wideGridOrigin(scene.cameras.main.width, scene.cameras.main.height);
  for (let i = 0; i < GAME_TILES.length; i++) {
    const { x, y } = wideTileCenter(i, origin);
    createShelfSticker(grid, i, x, y);
  }
}
