import Phaser from "phaser";
import { isReducedMotion } from "../utils/motion";
import { attachPressFeedback } from "../utils/pressFeedback";
import { hasSticker } from "../utils/storage";
import { displayScale } from "../utils/textureTiers";
import { textStyle } from "../utils/typography";
import { stickerKeyForGame } from "./gameRegistry";
import {
  addBreatheTweens,
  animateEntrance,
  wideGridOrigin,
  wideTileCenter,
} from "./hub/gridLayout";
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
} from "./hub/hubGridConstants";
import {
  isPagedViewport,
  PAGE_DOT_COLOR,
  PAGE_DOT_HIT,
  PAGE_DOTS_RADIUS,
  PAGE_DOTS_Y,
  PAGE_SLIDE_DURATION,
  pageDotAlpha,
  pageDotX,
  paintPageDots,
  SwipeGesture,
  slidePageIn,
  slidePageOut,
  swipeRegion,
} from "./hub/pageBoard";
import {
  addSparkle,
  animateJustEarned,
  drawDashedSlotRing,
  fadeSlotIn,
  PAGED_STICKER_DISPLAY_SIZE,
  STICKER_DISPLAY_SIZE,
  shelfStickerY,
} from "./hub/stickerShelf";
import { applyTimeUpLock, restoreTiles } from "./hub/timeUpDim";
import { pageCount, pagedTilePosition, pageTileIndexes } from "./hubPaging";
import { GAME_TILES } from "./hubTiles";

/** Everything the grid needs from the Hub scene, so rendering lives here and orchestration stays there. */
export interface HubGridDeps {
  scene: Phaser.Scene;
  /** True while the daily play-time limit locks every tile. */
  isTimeUp: () => boolean;
  /**
   * Activates a tile: audio unlock/start, play-session start, gameplay record,
   * then nudge-or-launch. Called only after the grid's own tap guards pass.
   */
  activateTile: (tileIndex: number) => void;
  /** Re-arms the idle-attract timer after a user gesture (page dot taps). */
  onUserGesture: () => void;
  /** True while an overlay (profile picker / settings panel) owns the pointer. */
  gestureBlocked: () => boolean;
}

/**
 * Renders the Hub's game-tile grid — the 6x4 wide layout (rows 6/6/6/4 over
 * 22 tiles), the paged 5x2 narrow-viewport layout, the page dots and swipe
 * gestures, and the sticker shelf under each tile. The Hub scene supplies
 * orchestration (navigation, play-time, audio) through the deps object; this
 * class owns all grid objects and their lifecycle.
 */
export class HubGrid {
  private deps: HubGridDeps;
  /** True when this visit uses the paged (narrow-viewport) grid. */
  paged = false;
  /** Current page in paged mode (0..pageCount() - 1); reset on every visit to the Hub. */
  hubPage = 0;
  /** Every grid object owned by the wide 6x4 layout (rebuilt on resize). */
  wideObjects: Phaser.GameObjects.GameObject[] = [];
  /** Every grid object owned by the current page (destroyed on flip). */
  pageObjects: Phaser.GameObjects.GameObject[] = [];
  /** Sticker thumbnails currently on the shelf (rebuilt after a progress reset). */
  stickerImages: Phaser.GameObjects.Image[] = [];
  /** Dashed empty-slot outlines for unearned stickers (rebuilt after a reset). */
  emptySlotGraphics: Phaser.GameObjects.Graphics[] = [];
  /** Tiles used as wiggle targets by the attract cue. */
  attractTargets: Phaser.GameObjects.Rectangle[] = [];
  /** The two textless page dots (paged mode only). */
  pageDots: Phaser.GameObjects.Arc[] = [];
  /** True after a tile tap began navigation; blocks double-tap double-records. */
  navLocked = false;
  /** Game id whose sticker was just earned; highlighted on this visit. */
  justEarned?: string;
  /** Delay between consecutive entrance elements (ms) — shared counter. */
  private entranceIndex = 0;
  /** Swipe state machine for the paged grid's horizontal page gestures. */
  private swipes = new SwipeGesture();
  /** Guards against double-wiring the scene-level swipe handlers. */
  private swipeWired = false;

  constructor(deps: HubGridDeps) {
    this.deps = deps;
  }

  /**
   * Clears per-visit state. Phaser reuses scene instances across visits
   * (auto-return re-runs create()), so the scene re-creates the grid or calls
   * this to reset navigation and entrance state.
   */
  resetForVisit(): void {
    this.entranceIndex = 0;
    this.attractTargets = [];
    this.navLocked = false;
    // Phaser clears a scene's input listeners on shutdown while this instance
    // survives the revisit, so the swipe wiring must be re-armed each visit —
    // otherwise paging gestures stay dead for the rest of the session.
    this.swipeWired = false;
  }

  /** Classifies the current viewport into the paged (narrow) or wide mode. */
  classifyViewport(): void {
    this.paged = isPagedViewport(this.deps.scene);
  }

  /**
   * Re-classifies the viewport when the scale manager reports a resize and
   * rebuilds the grid only when the narrow/wide classification flips. The
   * canvas is a fixed 1024x768 in game coordinates, so a same-classification
   * resize (e.g. a window growing on desktop) needs no relayout. The page
   * resets to the first page on a classification flip.
   */
  handleViewportChange(): void {
    const wasPaged = this.paged;
    this.classifyViewport();
    if (this.paged === wasPaged) return;
    this.hubPage = 0;
    if (this.paged) {
      this.destroyWideGrid();
      if (this.pageDots.length === 0) this.createPageDots();
      this.wireSwipeGestures();
      this.buildPageGrid(0);
    } else {
      this.destroyPageGrid();
      for (const dot of this.pageDots) dot.destroy();
      this.pageDots = [];
      this.buildWideGrid();
    }
  }

  /** Destroys every object owned by the wide grid (tiles + shelf). */
  destroyWideGrid(): void {
    for (const obj of this.wideObjects) obj.destroy();
    this.wideObjects = [];
    for (const sticker of this.stickerImages) sticker.destroy();
    this.stickerImages = [];
    for (const graphics of this.emptySlotGraphics) graphics.destroy();
    this.emptySlotGraphics = [];
  }

  /** Destroys every object owned by the current page (tiles + shelf). */
  destroyPageGrid(): void {
    for (const obj of this.pageObjects) obj.destroy();
    this.pageObjects = [];
    for (const sticker of this.stickerImages) sticker.destroy();
    this.stickerImages = [];
    for (const graphics of this.emptySlotGraphics) graphics.destroy();
    this.emptySlotGraphics = [];
  }

  /** Destroys everything the grid owns (page dots, page objects, wide grid). */
  destroy(): void {
    for (const dot of this.pageDots) dot.destroy();
    this.pageDots = [];
    this.destroyPageGrid();
    this.destroyWideGrid();
  }

  /**
   * Builds the 6x4 wide grid — rows 6/6/6/4 over 22 tiles at 144px, for
   * desktop and tablet viewports.
   */
  buildWideGrid(): void {
    const scene = this.deps.scene;
    this.wideObjects = [];
    this.stickerImages = [];
    this.emptySlotGraphics = [];
    this.attractTargets = [];
    this.entranceIndex = 0;
    const origin = wideGridOrigin(scene.cameras.main.width, scene.cameras.main.height);

    for (let i = 0; i < GAME_TILES.length; i++) {
      const { x, y } = wideTileCenter(i, origin);

      const tile = scene.add.rectangle(x, y, TILE_WIDTH, TILE_HEIGHT, 0x2b6cb0);
      // Flat storybook outline, matching every game scene's card language.
      tile.setStrokeStyle(4, 0x2d3748);
      tile.setInteractive();
      this.attractTargets.push(tile as Phaser.GameObjects.Rectangle);
      // Navigate on release so the press squish is visible while holding;
      // releasing outside the tile (pointerout/pointercancel) cancels.
      // Locked tiles (daily limit reached) swallow the tap entirely.
      tile.on("pointerup", () => {
        if (this.deps.isTimeUp() || this.navLocked) return;
        this.navLocked = true;
        this.deps.activateTile(i);
      });
      this.wideObjects.push(tile);

      const iconDisplay = GAME_TILES[i].iconDisplay ?? TILE_ICON_DISPLAY;
      const iconY = y + (GAME_TILES[i].iconOffsetY ?? TILE_ICON_Y_OFFSET);
      const icon = scene.add.image(x, iconY, GAME_TILES[i].tileKey);
      icon.setDisplaySize(iconDisplay, iconDisplay);
      this.wideObjects.push(icon);

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
      this.wideObjects.push(label);

      // The tile and label pop to scale 1; the icon gets its own entrance that
      // ends at its display scale (from its raster tier) so the pop does not
      // reset it to the native size. Typography-heavy tiles use a smaller size.
      animateEntrance(scene, [tile, label], this.entranceIndex++, {
        onComplete: () => {
          attachPressFeedback(tile, { spring: true });
        },
      });
      animateEntrance(scene, [icon], this.entranceIndex++, {
        targetScale: iconDisplay / TILE_ICON_TEXTURE_SIZE,
      });

      // Breathe pulse: scale-only wave owned by gridLayout; no-op under
      // reduced motion.
      addBreatheTweens(scene, i, tile, label, icon, iconDisplay);

      this.createShelfSticker(i, x, y);
    }

    if (this.deps.isTimeUp()) {
      // A resize rebuild after the daily limit is reached must lock the new
      // tiles too — the limit is profile-wide, not per layout.
      this.applyTimeUpLock();
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
  buildPageGrid(page: number, slideFrom: number | null = null): void {
    const scene = this.deps.scene;
    this.pageObjects = [];
    this.stickerImages = [];
    this.emptySlotGraphics = [];
    // Idle attract + time-up locking only ever target the visible page.
    this.attractTargets = [];
    // Page-local entrance stagger, so page 2 does not inherit page 1's delay.
    this.entranceIndex = 0;
    const reducedMotion = isReducedMotion();

    const indexes = pageTileIndexes(page);
    indexes.forEach((globalIndex, slot) => {
      const pos = pagedTilePosition(slot, indexes.length);
      const x = pos.x + (slideFrom ?? 0);
      const { y, width, height } = pos;
      const slideIn = slideFrom !== null && !reducedMotion;
      const stickerMark = this.stickerImages.length;
      const slotMark = this.emptySlotGraphics.length;

      const tile = scene.add.rectangle(x, y, width, height, 0x2b6cb0);
      tile.setStrokeStyle(4, 0x2d3748);
      tile.setInteractive();
      this.attractTargets.push(tile as Phaser.GameObjects.Rectangle);
      // Same release-to-navigate contract as the wide grid; a horizontal drag
      // (swipe) releases the gesture to the page flip instead of the tile.
      tile.on("pointerup", () => {
        if (this.deps.isTimeUp() || this.navLocked || this.swipes.swiping) return;
        this.navLocked = true;
        this.deps.activateTile(globalIndex);
      });
      this.pageObjects.push(tile);

      const icon = scene.add.image(x, y + PAGED_ICON_Y_OFFSET, GAME_TILES[globalIndex].tileKey);
      icon.setDisplaySize(PAGED_ICON_DISPLAY, PAGED_ICON_DISPLAY);
      this.pageObjects.push(icon);

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
      this.pageObjects.push(label);

      animateEntrance(scene, [tile, label], this.entranceIndex++, {
        onComplete: () => {
          attachPressFeedback(tile, { spring: true });
        },
      });
      animateEntrance(scene, [icon], this.entranceIndex++, {
        targetScale: PAGED_ICON_DISPLAY * (1 / TILE_ICON_TEXTURE_SIZE),
      });

      if (slideIn) {
        slidePageIn(scene, [tile, icon, label], pos.x);
      }

      // Breathe pulse: scale-only wave owned by gridLayout; no-op under
      // reduced motion.
      addBreatheTweens(scene, slot, tile, label, icon, PAGED_ICON_DISPLAY);

      this.createShelfSticker(globalIndex, x, y, height, PAGED_STICKER_DISPLAY_SIZE);
      if (slideIn) {
        // Slide only the shelf pieces this tile just created (the lists were
        // reset at the top of this build, so slice from the pre-create mark);
        // they all sit at the tile's x, so they settle at pos.x too.
        slidePageIn(
          scene,
          [...this.stickerImages.slice(stickerMark), ...this.emptySlotGraphics.slice(slotMark)],
          pos.x,
        );
      }
    });

    if (this.deps.isTimeUp()) {
      // A flip after the daily limit is reached must lock the incoming page
      // too — the limit is profile-wide, not per page.
      this.applyTimeUpLock();
    }
  }

  /**
   * Flips to the requested page with a horizontal slide (skipped under
   * reduced motion, which swaps instantly). The outgoing page slides out
   * while the incoming page slides in; old objects are destroyed after the
   * slide completes.
   */
  flipTo(page: number): void {
    const scene = this.deps.scene;
    if (!this.paged || page < 0 || page >= pageCount() || page === this.hubPage) return;
    const direction = page > this.hubPage ? 1 : -1;
    this.hubPage = page;
    this.updatePageDots();
    if (isReducedMotion()) {
      this.destroyPageGrid();
      this.buildPageGrid(page);
      return;
    }
    const outgoing = [
      ...this.pageObjects,
      ...this.stickerImages,
      ...this.emptySlotGraphics,
    ] as Array<Phaser.GameObjects.GameObject & { x: number }>;
    const canvasWidth = scene.cameras.main.width;
    this.buildPageGrid(page, direction * canvasWidth);
    slidePageOut(scene, outgoing, -direction * canvasWidth);
    scene.time.delayedCall(PAGE_SLIDE_DURATION, () => {
      for (const obj of outgoing) obj.destroy();
    });
  }

  /** Re-paints the page dots to highlight the active page. */
  updatePageDots(): void {
    paintPageDots(this.pageDots, this.hubPage);
  }

  /** Creates the textless page dots below the paged grid. */
  createPageDots(): void {
    const scene = this.deps.scene;
    const pages = pageCount();
    for (let page = 0; page < pages; page++) {
      const dot = scene.add.circle(
        pageDotX(page, pages, scene.cameras.main.width),
        PAGE_DOTS_Y,
        PAGE_DOTS_RADIUS,
        PAGE_DOT_COLOR,
      );
      dot.setAlpha(pageDotAlpha(page, this.hubPage));
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
        this.deps.onUserGesture();
        this.flipTo(page);
      });
      this.pageDots.push(dot as Phaser.GameObjects.Arc);
    }
  }

  /** Wires horizontal swipe gestures, scoped to the paged grid region. */
  wireSwipeGestures(): void {
    // Scene-level handlers cannot be removed without an off() per event, so
    // they are wired exactly once per scene instance instead. flipTo() ignores
    // calls while the wide layout is active.
    if (this.swipeWired) return;
    this.swipeWired = true;
    const scene = this.deps.scene;
    const region = swipeRegion();
    scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.swipes.begin(pointer, region, this.deps.gestureBlocked());
    });
    scene.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      this.swipes.track(pointer);
    });
    scene.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      const target = this.swipes.settle(pointer, this.hubPage);
      if (target === null) return;
      this.flipTo(target);
    });
  }

  /** Creates one shelf sticker thumbnail for the given tile, reflecting storage. */
  createShelfSticker(
    index: number,
    x: number,
    y: number,
    tileHeight = TILE_HEIGHT,
    shelfSize = STICKER_DISPLAY_SIZE,
  ): void {
    const earned = hasSticker(GAME_TILES[index].gameId);
    const stickerX = x;
    // Shelf placement (below the label, hanging off the tile's bottom edge)
    // is stickerShelf.shelfStickerY's math.
    const stickerY = shelfStickerY(y, tileHeight, shelfSize);

    if (earned) {
      // Derive the thumbnail scale from THIS sticker's raster tier instead of a
      // single hardcoded key, so a future tier change cannot shrink or grow
      // only some of the twenty shelf stickers.
      const stickerKey = stickerKeyForGame(GAME_TILES[index].gameId);
      const stickerScale = displayScale(stickerKey, shelfSize);
      const sticker = this.deps.scene.add.image(stickerX, stickerY, stickerKey);
      this.stickerImages.push(sticker as Phaser.GameObjects.Image);
      if (GAME_TILES[index].gameId === this.justEarned) {
        animateJustEarned(this.deps.scene, sticker, stickerScale, this.entranceIndex++);
      } else {
        sticker.setScale(stickerScale);
        animateEntrance(this.deps.scene, [sticker], this.entranceIndex++, {
          onComplete: () => addSparkle(this.deps.scene, sticker),
          targetScale: stickerScale,
        });
      }
    } else {
      this.drawEmptySlot(stickerX, stickerY, shelfSize / 2);
    }
  }

  /**
   * Draws a dashed circle outline where an unearned sticker will appear,
   * communicating the collection goal textlessly in place of a dimmed ghost.
   */
  drawEmptySlot(x: number, y: number, radius = STICKER_DISPLAY_SIZE / 2): void {
    const graphics = this.deps.scene.add.graphics();
    // Anchor the object at the slot center and draw the dashed ring around
    // (0, 0), so page-slide tweens can move the slot by its position.
    graphics.setPosition(x, y);
    this.emptySlotGraphics.push(graphics);
    drawDashedSlotRing(graphics, radius);
    fadeSlotIn(this.deps.scene, graphics, this.entranceIndex++);
  }

  /**
   * Rebuilds the sticker shelf from storage after a parental progress reset so
   * cleared stickers immediately show as dimmed on the Hub.
   */
  rerenderStickerShelf(): void {
    const scene = this.deps.scene;
    for (const sticker of this.stickerImages) sticker.destroy();
    this.stickerImages = [];
    for (const graphics of this.emptySlotGraphics) graphics.destroy();
    this.emptySlotGraphics = [];
    if (this.paged) {
      // Only the active page exists on screen; the other page is rebuilt
      // (with fresh sticker state) whenever it is flipped to.
      const active = pageTileIndexes(this.hubPage);
      active.forEach((globalIndex, slot) => {
        const pos = pagedTilePosition(slot, active.length);
        this.createShelfSticker(globalIndex, pos.x, pos.y, pos.height, PAGED_STICKER_DISPLAY_SIZE);
      });
      return;
    }
    const origin = wideGridOrigin(scene.cameras.main.width, scene.cameras.main.height);
    for (let i = 0; i < GAME_TILES.length; i++) {
      const { x, y } = wideTileCenter(i, origin);
      this.createShelfSticker(i, x, y);
    }
  }

  /**
   * Dims, shrinks and disables every currently-visible game tile once the
   * daily play-time limit is reached (locked tiles swallow taps).
   */
  applyTimeUpLock(): void {
    applyTimeUpLock(this.attractTargets);
  }

  /** Re-enables every tile after a time-up lock clears. */
  restoreTiles(): void {
    restoreTiles(this.attractTargets);
  }
}
