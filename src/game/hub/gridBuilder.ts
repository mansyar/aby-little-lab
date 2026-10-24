import Phaser from "phaser";
import { isReducedMotion } from "../../utils/motion";
import { attachPressFeedback } from "../../utils/pressFeedback";
import { textStyle } from "../../utils/typography";
import type { HubGrid } from "../hubGrid";
import { pageCount, pagedTilePosition, pageTileIndexes } from "../hubPaging";
import { GAME_TILES } from "../hubTiles";
import { addBreatheTweens, animateEntrance, wideGridOrigin, wideTileCenter } from "./gridLayout";
import {
  PAGED_ICON_DISPLAY,
  PAGED_ICON_Y_OFFSET,
  PAGED_LABEL_FONT_SIZE,
  PAGED_LABEL_Y_OFFSET,
  TILE_HEIGHT,
  TILE_ICON_DISPLAY,
  TILE_ICON_TEXTURE_SIZE,
  TILE_ICON_Y_OFFSET,
  TILE_LABEL_Y_OFFSET,
  TILE_WIDTH,
} from "./hubGridConstants";
import {
  PAGE_DOT_COLOR,
  PAGE_DOT_HIT,
  PAGE_DOTS_RADIUS,
  PAGE_DOTS_Y,
  PAGE_SLIDE_DURATION,
  pageDotAlpha,
  pageDotX,
  paintPageDots,
  slidePageIn,
  slidePageOut,
} from "./pageBoard";
import { createShelfSticker, PAGED_STICKER_DISPLAY_SIZE } from "./stickerShelf";

/**
 * Grid construction and teardown for the Hub's two layouts, extracted from the
 * `hubGrid.ts` orchestrator: the wide 6x4 build, the paged 5x2 build (with its
 * slide-in), page-dot creation, the per-build shelf (delegated to
 * `stickerShelf.ts`), and the object-list teardowns.
 *
 * The functions operate on the orchestrator instance (type-only import — no
 * runtime cycle) so the object lists they populate and the entrance counter
 * they advance stay owned by `HubGrid`, whose public surface is unchanged.
 */

/** Destroys every object owned by the wide grid (tiles + shelf). */
export function destroyWideGrid(grid: HubGrid): void {
  for (const obj of grid.wideObjects) obj.destroy();
  grid.wideObjects = [];
  for (const sticker of grid.stickerImages) sticker.destroy();
  grid.stickerImages = [];
  for (const graphics of grid.emptySlotGraphics) graphics.destroy();
  grid.emptySlotGraphics = [];
}

/** Destroys every object owned by the current page (tiles + shelf). */
export function destroyPageGrid(grid: HubGrid): void {
  for (const obj of grid.pageObjects) obj.destroy();
  grid.pageObjects = [];
  for (const sticker of grid.stickerImages) sticker.destroy();
  grid.stickerImages = [];
  for (const graphics of grid.emptySlotGraphics) graphics.destroy();
  grid.emptySlotGraphics = [];
}

/**
 * Builds the 6x4 wide grid — rows 6/6/6/4 over 22 tiles at 144px, for
 * desktop and tablet viewports.
 */
export function buildWideGrid(grid: HubGrid): void {
  const scene = grid.deps.scene;
  grid.wideObjects = [];
  grid.stickerImages = [];
  grid.emptySlotGraphics = [];
  grid.attractTargets = [];
  grid.entranceIndex = 0;
  const origin = wideGridOrigin(scene.cameras.main.width, scene.cameras.main.height);

  for (let i = 0; i < GAME_TILES.length; i++) {
    const { x, y } = wideTileCenter(i, origin);

    const tile = scene.add.rectangle(x, y, TILE_WIDTH, TILE_HEIGHT, 0x2b6cb0);
    // Flat storybook outline, matching every game scene's card language.
    tile.setStrokeStyle(4, 0x2d3748);
    tile.setInteractive();
    grid.attractTargets.push(tile as Phaser.GameObjects.Rectangle);
    // Navigate on release so the press squish is visible while holding;
    // releasing outside the tile (pointerout/pointercancel) cancels.
    // Locked tiles (daily limit reached) swallow the tap entirely.
    tile.on("pointerup", () => {
      if (grid.deps.isTimeUp() || grid.navLocked) return;
      grid.navLocked = true;
      grid.deps.activateTile(i, tile);
    });
    grid.wideObjects.push(tile);

    const iconDisplay = GAME_TILES[i].iconDisplay ?? TILE_ICON_DISPLAY;
    const iconY = y + (GAME_TILES[i].iconOffsetY ?? TILE_ICON_Y_OFFSET);
    const icon = scene.add.image(x, iconY, GAME_TILES[i].tileKey);
    icon.setDisplaySize(iconDisplay, iconDisplay);
    grid.wideObjects.push(icon);

    const label = scene.add.text(
      x,
      y + TILE_LABEL_Y_OFFSET,
      GAME_TILES[i].label,
      textStyle({
        fontSize: "17px",
        color: "#ffffff",
      }),
    );
    label.setOrigin(0.5);
    grid.wideObjects.push(label);

    // The tile and label pop to scale 1; the icon gets its own entrance that
    // ends at its display scale (from its raster tier) so the pop does not
    // reset it to the native size. Typography-heavy tiles use a smaller size.
    animateEntrance(scene, [tile, label], grid.entranceIndex++, {
      onComplete: () => {
        attachPressFeedback(tile, { spring: true });
      },
    });
    animateEntrance(scene, [icon], grid.entranceIndex++, {
      targetScale: iconDisplay / TILE_ICON_TEXTURE_SIZE,
    });

    // Breathe pulse: scale-only wave owned by gridLayout; no-op under
    // reduced motion.
    addBreatheTweens(scene, i, tile, label, icon, iconDisplay);

    createShelfSticker(grid, i, x, y);
  }

  if (grid.deps.isTimeUp()) {
    // A resize rebuild after the daily limit is reached must lock the new
    // tiles too — the limit is profile-wide, not per layout.
    grid.applyTimeUpLock();
  }
}

/**
 * Builds one page of the paged (narrow-viewport) grid.
 *
 * Clears the current page-object lists WITHOUT destroying their objects —
 * the caller decides when old objects die (immediately for reduced motion,
 * after the slide-out tween otherwise). Stickers/slots created here are
 * appended to the freshly reset lists.
 */
export function buildPageGrid(grid: HubGrid, page: number, slideFrom: number | null = null): void {
  const scene = grid.deps.scene;
  grid.pageObjects = [];
  grid.stickerImages = [];
  grid.emptySlotGraphics = [];
  // Idle attract + time-up locking only ever target the visible page.
  grid.attractTargets = [];
  // Page-local entrance stagger, so page 2 does not inherit page 1's delay.
  grid.entranceIndex = 0;
  const reducedMotion = isReducedMotion();

  const indexes = pageTileIndexes(page);
  indexes.forEach((globalIndex, slot) => {
    const pos = pagedTilePosition(slot, indexes.length);
    const x = pos.x + (slideFrom ?? 0);
    const { y, width, height } = pos;
    const slideIn = slideFrom !== null && !reducedMotion;
    const stickerMark = grid.stickerImages.length;
    const slotMark = grid.emptySlotGraphics.length;

    const tile = scene.add.rectangle(x, y, width, height, 0x2b6cb0);
    tile.setStrokeStyle(4, 0x2d3748);
    tile.setInteractive();
    grid.attractTargets.push(tile as Phaser.GameObjects.Rectangle);
    // Same release-to-navigate contract as the wide grid; a horizontal drag
    // (swipe) releases the gesture to the page flip instead of the tile.
    tile.on("pointerup", () => {
      if (grid.deps.isTimeUp() || grid.navLocked || grid.swipes.swiping) return;
      grid.navLocked = true;
      grid.deps.activateTile(globalIndex, tile);
    });
    grid.pageObjects.push(tile);

    const icon = scene.add.image(x, y + PAGED_ICON_Y_OFFSET, GAME_TILES[globalIndex].tileKey);
    icon.setDisplaySize(PAGED_ICON_DISPLAY, PAGED_ICON_DISPLAY);
    grid.pageObjects.push(icon);

    const label = scene.add.text(
      x,
      y + PAGED_LABEL_Y_OFFSET,
      GAME_TILES[globalIndex].label,
      textStyle({
        fontSize: `${PAGED_LABEL_FONT_SIZE}px`,
        color: "#ffffff",
      }),
    );
    label.setOrigin(0.5);
    grid.pageObjects.push(label);

    animateEntrance(scene, [tile, label], grid.entranceIndex++, {
      onComplete: () => {
        attachPressFeedback(tile, { spring: true });
      },
    });
    animateEntrance(scene, [icon], grid.entranceIndex++, {
      targetScale: PAGED_ICON_DISPLAY * (1 / TILE_ICON_TEXTURE_SIZE),
    });

    if (slideIn) {
      slidePageIn(scene, [tile, icon, label], pos.x);
    }

    // Breathe pulse: scale-only wave owned by gridLayout; no-op under
    // reduced motion.
    addBreatheTweens(scene, slot, tile, label, icon, PAGED_ICON_DISPLAY);

    createShelfSticker(grid, globalIndex, x, y, height, PAGED_STICKER_DISPLAY_SIZE);
    if (slideIn) {
      // Slide only the shelf pieces this tile just created (the lists were
      // reset at the top of this build, so slice from the pre-create mark);
      // they all sit at the tile's x, so they settle at pos.x too.
      slidePageIn(
        scene,
        [...grid.stickerImages.slice(stickerMark), ...grid.emptySlotGraphics.slice(slotMark)],
        pos.x,
      );
    }
  });

  if (grid.deps.isTimeUp()) {
    // A flip after the daily limit is reached must lock the incoming page
    // too — the limit is profile-wide, not per page.
    grid.applyTimeUpLock();
  }
}

/** Creates the textless page dots below the paged grid. */
export function createPageDots(grid: HubGrid): void {
  const scene = grid.deps.scene;
  const pages = pageCount();
  for (let page = 0; page < pages; page++) {
    const dot = scene.add.circle(
      pageDotX(page, pages, scene.cameras.main.width),
      PAGE_DOTS_Y,
      PAGE_DOTS_RADIUS,
      PAGE_DOT_COLOR,
    );
    dot.setAlpha(pageDotAlpha(page, grid.hubPage));
    dot.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(
        -PAGE_DOT_HIT / 2,
        -PAGE_DOT_HIT / 2,
        PAGE_DOT_HIT,
        PAGE_DOT_HIT,
      ),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    });
    dot.on("pointerup", () => {
      grid.deps.onUserGesture();
      grid.flipTo(page);
    });
    grid.pageDots.push(dot as Phaser.GameObjects.Arc);
  }
}

/**
 * Rebuilds the sticker shelf from storage after a parental progress reset so
 * cleared stickers immediately show as dimmed on the Hub.
 */
export function rerenderStickerShelf(grid: HubGrid): void {
  const scene = grid.deps.scene;
  for (const sticker of grid.stickerImages) sticker.destroy();
  grid.stickerImages = [];
  for (const graphics of grid.emptySlotGraphics) graphics.destroy();
  grid.emptySlotGraphics = [];
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

/**
 * Flips to the requested page with a horizontal slide (skipped under reduced
 * motion, which swaps instantly). The outgoing page slides out while the
 * incoming page slides in; old objects are destroyed after the slide
 * completes. Dot repainting and the page assignment happen up front so a
 * re-entrant call during the slide is a no-op.
 */
export function flipTo(grid: HubGrid, page: number): void {
  if (!grid.paged || page < 0 || page >= pageCount() || page === grid.hubPage) return;
  const direction = page > grid.hubPage ? 1 : -1;
  grid.hubPage = page;
  paintPageDots(grid.pageDots, grid.hubPage);
  if (isReducedMotion()) {
    destroyPageGrid(grid);
    buildPageGrid(grid, page);
    return;
  }
  const outgoing = [...grid.pageObjects, ...grid.stickerImages, ...grid.emptySlotGraphics] as Array<
    Phaser.GameObjects.GameObject & { x: number }
  >;
  const canvasWidth = grid.deps.scene.cameras.main.width;
  buildPageGrid(grid, page, direction * canvasWidth);
  slidePageOut(grid.deps.scene, outgoing, -direction * canvasWidth);
  grid.deps.scene.time.delayedCall(PAGE_SLIDE_DURATION, () => {
    for (const obj of outgoing) obj.destroy();
  });
}
