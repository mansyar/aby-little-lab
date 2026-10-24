import type Phaser from "phaser";
import {
  buildPageGrid,
  buildWideGrid,
  createPageDots,
  destroyPageGrid,
  destroyWideGrid,
  flipTo,
  rerenderStickerShelf,
} from "./hub/gridBuilder";
import { isPagedViewport, paintPageDots, SwipeGesture, swipeRegion } from "./hub/pageBoard";
import { createShelfSticker, drawEmptySlot } from "./hub/stickerShelf";
import { applyTimeUpLock, restoreTiles } from "./hub/timeUpDim";

/** Everything the grid needs from the Hub scene, so rendering lives here and orchestration stays there. */
export interface HubGridDeps {
  scene: Phaser.Scene;
  /** True while the daily play-time limit locks every tile. */
  isTimeUp: () => boolean;
  /**
   * Activates a tile after the grid's tap guards pass. The tile's rectangle
   * rides along so a failed load can anchor its retry cue on the tapped tile;
   * it is optional so callers that never surface a failure can omit it.
   */
  activateTile: (tileIndex: number, tile?: Phaser.GameObjects.Rectangle) => void;
  /** Re-arms the idle-attract timer after a user gesture (page dot taps). */
  onUserGesture: () => void;
  /** True while an overlay (profile picker / settings panel) owns the pointer. */
  gestureBlocked: () => boolean;
}

/**
 * Orchestrates the Hub's game-tile grid (wide 6x4 / paged 5x2, page dots,
 * swipes, sticker shelf). The `src/game/hub/` modules hold construction and
 * per-concern logic; this class owns object lists, input wiring, and lifecycle.
 */
export class HubGrid {
  deps: HubGridDeps;
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
  /** The textless page dots (one per page; paged mode only). */
  pageDots: Phaser.GameObjects.Arc[] = [];
  /** True after a tile tap began navigation; blocks double-tap double-records. */
  navLocked = false;
  /** Game id whose sticker was just earned; highlighted on this visit. */
  justEarned?: string;
  /** Delay between consecutive entrance elements (ms) — shared counter, advanced by the concern modules. */
  entranceIndex = 0;
  /** Swipe state machine for the paged grid's horizontal page gestures; the paged tile guard reads `swiping`. */
  swipes = new SwipeGesture();
  /** Guards against double-wiring the scene-level swipe handlers. */
  private swipeWired = false;

  constructor(deps: HubGridDeps) {
    this.deps = deps;
  }

  /** Clears per-visit state (Phaser reuses scene instances across visits). */
  resetForVisit(): void {
    this.entranceIndex = 0;
    this.attractTargets = [];
    this.navLocked = false;
    // Scene shutdown drops input listeners while this instance survives the revisit; re-arm each visit.
    this.swipeWired = false;
  }

  /** Classifies the current viewport into the paged (narrow) or wide mode. */
  classifyViewport(): void {
    this.paged = isPagedViewport(this.deps.scene);
  }

  /**
   * Rebuilds the grid when a resize flips the narrow/wide classification
   * (same-classification resizes keep the fixed 1024x768 layout). The page
   * resets to the first page on a flip.
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
    destroyWideGrid(this);
  }

  /** Destroys every object owned by the current page (tiles + shelf). */
  destroyPageGrid(): void {
    destroyPageGrid(this);
  }

  /** Destroys everything the grid owns (page dots, page objects, wide grid). */
  destroy(): void {
    for (const dot of this.pageDots) dot.destroy();
    this.pageDots = [];
    this.destroyPageGrid();
    this.destroyWideGrid();
  }

  /** Builds the wide 6x4 grid (see gridBuilder.buildWideGrid). */
  buildWideGrid(): void {
    buildWideGrid(this);
  }

  /** Builds one page of the paged grid (see gridBuilder.buildPageGrid). */
  buildPageGrid(page: number, slideFrom: number | null = null): void {
    buildPageGrid(this, page, slideFrom);
  }

  /** Flips to the requested page with a horizontal slide (instant under reduced motion). */
  flipTo(page: number): void {
    flipTo(this, page);
  }

  /** Re-paints the page dots to highlight the active page. */
  updatePageDots(): void {
    paintPageDots(this.pageDots, this.hubPage);
  }

  /** Creates the textless page dots below the paged grid. */
  createPageDots(): void {
    createPageDots(this);
  }

  /** Wires horizontal swipe gestures, scoped to the paged grid region. */
  wireSwipeGestures(): void {
    // Scene-level handlers cannot be removed without an off() per event, so
    // they are wired exactly once per scene instance (flipTo no-ops while wide).
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
    tileHeight?: number,
    shelfSize?: number,
  ): void {
    createShelfSticker(this, index, x, y, tileHeight, shelfSize);
  }

  /** Draws a dashed circle outline where an unearned sticker will appear. */
  drawEmptySlot(x: number, y: number, radius?: number): void {
    drawEmptySlot(this, x, y, radius);
  }

  /** Rebuilds the sticker shelf from storage after a parental progress reset. */
  rerenderStickerShelf(): void {
    rerenderStickerShelf(this);
  }

  /** Dims, shrinks and disables the visible tiles once the play-time limit hits. */
  applyTimeUpLock(): void {
    applyTimeUpLock(this.attractTargets);
  }

  /** Re-enables every tile after a time-up lock clears. */
  restoreTiles(): void {
    restoreTiles(this.attractTargets);
  }
}
