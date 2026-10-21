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
  ENTRANCE_DURATION,
  ENTRANCE_STAGGER,
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
import { isNarrowViewport, pageCount, pagedTilePosition, pageTileIndexes } from "./hubPaging";
import { GAME_TILES } from "./hubTiles";

/**
 * Display size of sticker thumbnails / empty-slot rings on a wide tile (px).
 *
 * The shelf has to live in the band between the label and the tile's bottom
 * edge: the label baseline sits at +20 and its 17px box ends around +30, and
 * the tile's bottom edge is at +58 (TILE_HEIGHT 116). 22px is the largest
 * plaque that clears the label and keeps a 3px inset from the edge — a 56px
 * plaque (sized for the old 160x116 tile with no bottom inset) covered the
 * game name once the grid reflowed.
 */
const STICKER_DISPLAY_SIZE = 22;
/** Gap between the shelf's bottom edge and the tile's bottom edge (px). */
const STICKER_SHELF_INSET = 3;
/** Alpha of the dashed empty-slot outline for unearned stickers. */
const EMPTY_SLOT_ALPHA = 0.55;
/** Stroke width of the dashed empty-slot outline (px). */
const EMPTY_SLOT_LINE_WIDTH = 4;
/** Number of dashes in the empty-slot circle. */
const EMPTY_SLOT_DASH_COUNT = 10;
/** Entrance scale for the just-earned sticker. */
const JUST_EARNED_SCALE = 1.15;
/** Duration of the gentle sparkle shimmer loop (ms). */
const SPARKLE_DURATION = 800;
/** Peak alpha of the sparkle shimmer loop. */
const SPARKLE_ALPHA = 0.75;
/** Scale of the just-earned sparkle burst pulse. */
const BURST_SCALE = 1.25;
/** Duration of the just-earned sparkle burst pulse (ms). */
const BURST_DURATION = 500;

/**
 * Paged (narrow-viewport) grid constants. Tile size, spacing and centering
 * live in src/game/hubPaging.ts (PAGED_TILE_*), and the per-tile icon/label
 * furniture offsets live in src/game/hub/hubGridConstants.ts (PAGED_ICON_*,
 * PAGED_LABEL_*); the remaining constants below cover the paged interaction
 * and shelf presentation.
 */
/**
 * Display size of sticker thumbnails / empty-slot rings on a paged tile (px).
 * The 196px-tall tile keeps the same label-to-bottom band proportion as the
 * wide tile, so the plaque is proportionally larger but still below the label.
 */
const PAGED_STICKER_DISPLAY_SIZE = 30;
/** Duration of the page slide transition (ms). */
const PAGE_SLIDE_DURATION = 300;
/** Minimum horizontal travel for a swipe to flip pages (logical px). */
const SWIPE_MIN_DISTANCE = 60;
/** Y position of the textless page dots (below the grid, above the arc). */
const PAGE_DOTS_Y = 640;
/** Horizontal spacing between the page dots (px). */
const PAGE_DOTS_SPACING = 32;
/** Radius of a page dot (px). */
const PAGE_DOTS_RADIUS = 8;
/** Alpha of the active (filled) page dot. */
const PAGE_DOT_ACTIVE_ALPHA = 0.9;
/** Alpha of the inactive page dot. */
const PAGE_DOT_INACTIVE_ALPHA = 0.25;
/** Tappable hit size around each page dot (px, logical). */
const PAGE_DOT_HIT = 64;

/** Alpha applied to Hub tiles while the daily limit locks them. */
const TIME_UP_TILE_ALPHA = 0.45;

/** Static scale for locked tiles - a non-color "unavailable" size cue. */
const TIME_UP_TILE_SCALE = 0.97;

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
  /** True once a horizontal drag past the swipe threshold was detected. */
  private swiping = false;
  /** Start point of an in-flight swipe, when it began in the grid region. */
  private swipeStart?: { x: number; y: number };
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
    const display = this.deps.scene.scale?.displaySize;
    this.paged = isNarrowViewport(
      display?.width ?? this.deps.scene.cameras.main.width,
      display?.height ?? this.deps.scene.cameras.main.height,
    );
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
        if (this.deps.isTimeUp() || this.navLocked || this.swiping) return;
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
        const settleX = pos.x;
        for (const obj of [tile, icon, label]) {
          scene.tweens.add({
            targets: obj,
            x: settleX,
            duration: PAGE_SLIDE_DURATION,
            ease: "Cubic.out",
          });
        }
      }

      // Breathe pulse: scale-only wave owned by gridLayout; no-op under
      // reduced motion.
      addBreatheTweens(scene, slot, tile, label, icon, PAGED_ICON_DISPLAY);

      this.createShelfSticker(globalIndex, x, y, height, PAGED_STICKER_DISPLAY_SIZE);
      if (slideIn) {
        // Slide only the shelf pieces this tile just created (the lists were
        // reset at the top of this build, so slice from the pre-create mark).
        const delta = pos.x - x;
        for (const obj of [
          ...this.stickerImages.slice(stickerMark),
          ...this.emptySlotGraphics.slice(slotMark),
        ]) {
          scene.tweens.add({
            targets: obj,
            x: obj.x + delta,
            duration: PAGE_SLIDE_DURATION,
            ease: "Cubic.out",
          });
        }
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
    const shift = -direction * canvasWidth;
    for (const obj of outgoing) {
      scene.tweens.add({
        targets: obj,
        x: obj.x + shift,
        duration: PAGE_SLIDE_DURATION,
        ease: "Cubic.in",
      });
    }
    scene.time.delayedCall(PAGE_SLIDE_DURATION, () => {
      for (const obj of outgoing) obj.destroy();
    });
  }

  /** Re-paints the page dots to highlight the active page. */
  updatePageDots(): void {
    this.pageDots.forEach((dot, page) => {
      dot.setAlpha(page === this.hubPage ? PAGE_DOT_ACTIVE_ALPHA : PAGE_DOT_INACTIVE_ALPHA);
    });
  }

  /** Creates the two textless page dots below the paged grid. */
  createPageDots(): void {
    const scene = this.deps.scene;
    const pages = pageCount();
    for (let page = 0; page < pages; page++) {
      const dot = scene.add.circle(
        scene.cameras.main.width / 2 + (page - (pages - 1) / 2) * PAGE_DOTS_SPACING,
        PAGE_DOTS_Y,
        PAGE_DOTS_RADIUS,
        0x2d3748,
      );
      dot.setAlpha(page === this.hubPage ? PAGE_DOT_ACTIVE_ALPHA : PAGE_DOT_INACTIVE_ALPHA);
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
    const first = pagedTilePosition(0);
    const last = pagedTilePosition(9);
    const gridLeft = first.x - first.width / 2;
    const gridRight = last.x + last.width / 2;
    const gridTop = first.y - first.height / 2;
    const gridBottom = last.y + last.height / 2;
    scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.swiping = false;
      // An open overlay (profile picker / settings panel) owns the gesture;
      // never start a page swipe underneath it.
      if (this.deps.gestureBlocked()) return;
      if (
        pointer.x >= gridLeft &&
        pointer.x <= gridRight &&
        pointer.y >= gridTop &&
        pointer.y <= gridBottom
      ) {
        this.swipeStart = { x: pointer.x, y: pointer.y };
      }
    });
    scene.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!this.swipeStart || this.swiping) return;
      if (Math.abs(pointer.x - this.swipeStart.x) >= SWIPE_MIN_DISTANCE) {
        this.swiping = true;
      }
    });
    scene.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      const start = this.swipeStart;
      this.swipeStart = undefined;
      if (!start) return;
      const dx = pointer.x - start.x;
      const dy = pointer.y - start.y;
      if (Math.abs(dx) < SWIPE_MIN_DISTANCE || Math.abs(dx) <= Math.abs(dy)) return;
      this.flipTo(this.hubPage + (dx < 0 ? 1 : -1));
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
    // The shelf hangs off the tile's bottom edge with a fixed inset, so it sits
    // BELOW the label instead of over the game name: on a wide tile the plaque
    // spans +33..+55 (label box ends ~+30, tile edge +58); on a paged tile
    // +65..+95 (label ends ~+60, tile edge +98).
    const stickerY = y + tileHeight / 2 - STICKER_SHELF_INSET - shelfSize / 2;

    if (earned) {
      // Derive the thumbnail scale from THIS sticker's raster tier instead of a
      // single hardcoded key, so a future tier change cannot shrink or grow
      // only some of the twenty shelf stickers.
      const stickerKey = stickerKeyForGame(GAME_TILES[index].gameId);
      const stickerScale = displayScale(stickerKey, shelfSize);
      const sticker = this.deps.scene.add.image(stickerX, stickerY, stickerKey);
      this.stickerImages.push(sticker as Phaser.GameObjects.Image);
      if (GAME_TILES[index].gameId === this.justEarned) {
        sticker.setScale(stickerScale * JUST_EARNED_SCALE);
        this.animateJustEarned(sticker as Phaser.GameObjects.Image, stickerScale);
      } else {
        sticker.setScale(stickerScale);
        animateEntrance(this.deps.scene, [sticker], this.entranceIndex++, {
          onComplete: () => this.addSparkle(sticker as Phaser.GameObjects.Image),
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
    graphics.lineStyle(EMPTY_SLOT_LINE_WIDTH, 0xffffff, EMPTY_SLOT_ALPHA);
    const segment = (Math.PI * 2) / EMPTY_SLOT_DASH_COUNT / 2;
    for (let i = 0; i < EMPTY_SLOT_DASH_COUNT; i++) {
      const start = i * segment * 2;
      graphics.beginPath();
      graphics.arc(0, 0, radius, start, start + segment, false);
      graphics.strokePath();
    }
    const index = this.entranceIndex;
    this.entranceIndex += 1;
    const config: Phaser.Types.Tweens.TweenBuilderConfig = {
      targets: graphics,
      alpha: EMPTY_SLOT_ALPHA,
      delay: index * ENTRANCE_STAGGER,
      duration: ENTRANCE_DURATION,
      ease: "Sine.out",
    };
    if (isReducedMotion()) {
      // Reduced motion skips the fade-in and lands directly at final alpha.
      graphics.setAlpha(EMPTY_SLOT_ALPHA);
    } else {
      graphics.setAlpha(0);
      this.deps.scene.tweens.add(config);
    }
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
    for (const tile of this.attractTargets) {
      tile.setAlpha(TIME_UP_TILE_ALPHA);
      tile.setScale(TIME_UP_TILE_SCALE);
      tile.disableInteractive();
    }
  }

  /** Re-enables every tile after a time-up lock clears. */
  restoreTiles(): void {
    for (const tile of this.attractTargets) {
      tile.setAlpha(1);
      tile.setScale(1);
      tile.setInteractive();
    }
  }

  /**
   * Brings the just-earned sticker in with a larger Back.out bounce and a
   * sparkle burst (scale pulse + shimmer). Under reduced motion only alpha.
   */
  private animateJustEarned(sticker: Phaser.GameObjects.Image, stickerScale: number): void {
    const index = this.entranceIndex;
    this.entranceIndex += 1;
    const config: Phaser.Types.Tweens.TweenBuilderConfig = {
      targets: sticker,
      alpha: 1,
      delay: index * ENTRANCE_STAGGER,
      duration: ENTRANCE_DURATION,
      ease: "Back.out",
    };
    sticker.setAlpha(0);
    if (!isReducedMotion()) {
      sticker.setScale(0);
      config.scaleX = JUST_EARNED_SCALE * stickerScale;
      config.scaleY = JUST_EARNED_SCALE * stickerScale;
      config.onComplete = () => this.addJustEarnedBurst(sticker, stickerScale);
    }
    this.deps.scene.tweens.add(config);
  }

  /** Gentle alpha shimmer loop for earned stickers (no-op under reduced motion). */
  private addSparkle(sticker: Phaser.GameObjects.Image): void {
    if (isReducedMotion()) return;
    this.deps.scene.tweens.add({
      targets: sticker,
      alpha: SPARKLE_ALPHA,
      duration: SPARKLE_DURATION,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });
  }

  /** Sparkle burst for the just-earned sticker: shimmer plus scale pulse. */
  private addJustEarnedBurst(sticker: Phaser.GameObjects.Image, stickerScale: number): void {
    this.addSparkle(sticker);
    if (isReducedMotion()) return;
    this.deps.scene.tweens.add({
      targets: sticker,
      scaleX: BURST_SCALE * stickerScale,
      scaleY: BURST_SCALE * stickerScale,
      duration: BURST_DURATION,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });
  }
}
