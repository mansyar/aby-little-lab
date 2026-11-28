import Phaser from "phaser";
import { isReducedMotion } from "../../utils/motion";
import { attachPressFeedback } from "../../utils/pressFeedback";
import { textStyle } from "../../utils/typography";
import type { HubGrid } from "../hubGrid";
import { ALL_GROUP_ID, visibleTileIndexes } from "../hubGroups";
import { pageCount, pagedTilePosition, pageTileIndexes } from "../hubPaging";
import { GAME_TILES } from "../hubTiles";
import { addBreatheTweens, animateEntrance, wideGridOrigin, wideTileCenter } from "./gridLayout";
import { groupTilePosition } from "./groupLayout";
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
 * `hubGrid.ts` orchestrator: the wide 6-column/5-row build, the paged 5x2 build (with its
 * slide-in), page-dot creation, the per-build shelf (delegated to
 * `stickerShelf.ts`), and the object-list teardowns.
 *
 * The functions operate on the orchestrator instance (type-only import — no
 * runtime cycle) so the object lists they populate and the entrance counter
 * they advance stay owned by `HubGrid`, whose public surface is unchanged.
 */

/** Shared tile gesture: a release navigates only after a matching press. */
function wireTileGesture(
  grid: HubGrid,
  tile: Phaser.GameObjects.Rectangle,
  index: number,
  blocked: () => boolean = () => false,
): void {
  let releaseBlocked = false;
  let pressed = false;
  tile.on("pointerdown", () => {
    pressed = true;
    releaseBlocked = grid.deps.gestureBlocked();
  });
  for (const event of ["pointerout", "pointercancel"] as const) {
    tile.on(event, () => {
      pressed = false;
      releaseBlocked = false;
    });
  }
  tile.on("pointerup", () => {
    const hadPress = pressed;
    pressed = false;
    if (!hadPress) return;
    if (grid.deps.isTimeUp()) return;
    if (grid.navLocked || blocked()) return;
    if (releaseBlocked || grid.deps.gestureBlocked()) return;
    grid.navLocked = true;
    grid.deps.activateTile(index, tile);
  });
}

/** Clears the per-build lists and entrance counter for a fresh board. */
function resetBuildLists(grid: HubGrid, tiles: "wide" | "page"): void {
  if (tiles === "wide") grid.wideObjects = [];
  else grid.pageObjects = [];
  grid.stickerImages = [];
  grid.emptySlotGraphics = [];
  grid.attractTargets = [];
  grid.entranceIndex = 0;
}

/** A rebuild after the daily cap must lock its fresh tiles too. */
function lockTilesIfTimeUp(grid: HubGrid): void {
  if (grid.deps.isTimeUp()) grid.applyTimeUpLock();
}

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
 * Builds the wide board — rows 6/6/6/6 + 1 over all 25 tiles at 144px, for
 * desktop and tablet viewports. The fifth row flows the 25th tile on-canvas and
 * the board top anchors below the chip band; no paging or tile resizing needed.
 */
export function buildWideGrid(grid: HubGrid): void {
  const scene = grid.deps.scene;
  resetBuildLists(grid, "wide");
  const settleEntrance = grid.beginEntrances(GAME_TILES.length);
  const origin = wideGridOrigin(scene.cameras.main.width, scene.cameras.main.height);

  for (let i = 0; i < GAME_TILES.length; i++) {
    const { x, y } = wideTileCenter(i, origin);

    const tile = scene.add.rectangle(x, y, TILE_WIDTH, TILE_HEIGHT, 0x2b6cb0);
    // Flat storybook outline, matching every game scene's card language.
    tile.setStrokeStyle(4, 0x2d3748);
    tile.setInteractive();
    grid.attractTargets.push(tile as Phaser.GameObjects.Rectangle);
    // Release-to-navigate keeps the press squish visible; out/cancel drops it.
    wireTileGesture(grid, tile, i);
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
        settleEntrance();
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

  lockTilesIfTimeUp(grid);

  // The chip row is built once per grid lifetime, after the tiles: the board's
  // object order stays the order the launch tests and the bridge read.
  grid.ensureGroupChips();
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
  // Idle attract + time-up locking only target the visible page; the entrance
  // stagger is page-local, so page 2 does not inherit page 1's delay.
  resetBuildLists(grid, "page");
  const reducedMotion = isReducedMotion();

  const indexes = pageTileIndexes(page);
  const settleEntrance = grid.beginEntrances(indexes.length);
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
    // A horizontal swipe releases the gesture to the page flip, not the tile.
    wireTileGesture(grid, tile, globalIndex, () => grid.swipes.swiping);
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
        settleEntrance();
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

  lockTilesIfTimeUp(grid);

  grid.ensureGroupChips();
}

/**
 * Builds the filtered board: the selected group's tiles at the larger group
 * geometry, in both layouts (spec FR-4, D3).
 *
 * The board is deliberately layout-independent — one group is at most six tiles,
 * so it needs no paging and no slide — and it is built into the paged object
 * list, so one teardown covers the wide and paged cases alike. Tiles keep their
 * registry index for the tap callback, which is the identity the launch flow and
 * the bridge both use.
 */
export function buildFilteredGrid(grid: HubGrid): void {
  const scene = grid.deps.scene;
  resetBuildLists(grid, "page");

  const indexes = visibleTileIndexes(grid.selection);
  const settleEntrance = grid.beginEntrances(indexes.length);

  indexes.forEach((globalIndex, slot) => {
    const pos = groupTilePosition(slot, indexes.length);

    const tile = scene.add.rectangle(pos.x, pos.y, pos.width, pos.height, 0x2b6cb0);
    tile.setStrokeStyle(4, 0x2d3748);
    tile.setInteractive();
    grid.attractTargets.push(tile as Phaser.GameObjects.Rectangle);
    // Locked tiles swallow the tap; a swipe belongs to the page gesture.
    wireTileGesture(grid, tile, globalIndex, () => grid.swipes.swiping);
    grid.pageObjects.push(tile);

    const iconDisplay = GAME_TILES[globalIndex].iconDisplay ?? PAGED_ICON_DISPLAY;
    const icon = scene.add.image(
      pos.x,
      pos.y + PAGED_ICON_Y_OFFSET,
      GAME_TILES[globalIndex].tileKey,
    );
    icon.setDisplaySize(iconDisplay, iconDisplay);
    grid.pageObjects.push(icon);

    const label = scene.add.text(
      pos.x,
      pos.y + PAGED_LABEL_Y_OFFSET,
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
        settleEntrance();
      },
    });
    animateEntrance(scene, [icon], grid.entranceIndex++, {
      targetScale: iconDisplay / TILE_ICON_TEXTURE_SIZE,
    });

    // Breathe pulse: scale-only wave owned by gridLayout; no-op under reduced
    // motion.
    addBreatheTweens(scene, slot, tile, label, icon, iconDisplay);

    createShelfSticker(grid, globalIndex, pos.x, pos.y, pos.height, PAGED_STICKER_DISPLAY_SIZE);
  });

  lockTilesIfTimeUp(grid);

  grid.ensureGroupChips();
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

export { rerenderStickerShelf } from "./gridShelf";

/**
 * Flips to the requested page with a horizontal slide (skipped under reduced
 * motion, which swaps instantly). The outgoing page slides out while the
 * incoming page slides in; old objects are destroyed after the slide
 * completes. Dot repainting and the page assignment happen up front so a
 * re-entrant call during the slide is a no-op.
 */
export function flipTo(grid: HubGrid, page: number): void {
  // A filtered board has one page and no dots, so a swipe settles on nothing.
  if (grid.selection !== ALL_GROUP_ID) return;
  if (!grid.paged || page < 0 || page >= pageCount() || page === grid.hubPage) return;
  const direction = page > grid.hubPage ? 1 : -1;
  grid.hubPage = page;
  paintPageDots(grid.pageDots, grid.hubPage);
  // The outgoing tiles die with this flip, so a cue anchored to one of them
  // goes now — once per flip, whatever the motion path below.
  grid.deps.onBoardChange?.();
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
