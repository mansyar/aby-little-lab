import Phaser from "phaser";
import { isReducedMotion } from "../utils/motion";
import { attachPressFeedback } from "../utils/pressFeedback";
import { hasSticker } from "../utils/storage";
import { textureSizeFor } from "../utils/textureTiers";
import { textStyle } from "../utils/typography";
import { isNarrowViewport, PAGE_COUNT, pagedTilePosition, pageTileIndexes } from "./hubPaging";
import { GAME_TILES } from "./hubTiles";

const TILE_WIDTH = 160;
/**
 * 20 tiles render as 5x4 (rows 5/5/5/5). Height and spacing are sized so the
 * 4 rows fit inside 768 with the same 119px top/bottom margins as the 15-tile
 * grid - clearing the top-band controls (avatar chip / Settings, bottom edge
 * 116) while keeping every tile and its sticker shelf on-canvas.
 */
const TILE_HEIGHT = 116;
const TILE_SPACING = 22;
const GRID_COLS = 5;
const GRID_ROWS = 4;
/** Display size of the game icon artwork on each tile (px). */
const TILE_ICON_DISPLAY = 64;
/** Tile icon textures are rasterized at this size (matches PreloadScene). */
const TILE_ICON_TEXTURE_SIZE = textureSizeFor("tile_shape_sorter");
/** Vertical offset of the tile icon above the tile center (px). */
const TILE_ICON_Y_OFFSET = -40;
/** Vertical offset of the secondary text label below the tile center (px). */
const TILE_LABEL_Y_OFFSET = 20;

/** Delay between consecutive entrance elements (ms). */
const ENTRANCE_STAGGER = 40;
/** Duration of each element's entrance tween (ms). */
const ENTRANCE_DURATION = 300;
/**
 * Gentle scale "breathe" pulse for idle tiles (1 = none). Scale-only motion
 * keeps icon/label/shelf geometry fixed, unlike a vertical bob which can
 * visually collide with the fixed shelf slots.
 */
const BOB_AMPLITUDE = 1.025;
/** Duration of one tile breathe loop (ms). */
const BOB_DURATION = 2500;
/** Phase offset between tile breathe loops (ms). */
const BOB_PHASE_OFFSET = 200;
/** Display size of sticker thumbnails on the shelf (px). */
const STICKER_DISPLAY_SIZE = 56;
/** Sticker textures are rasterized at this size (matches PreloadScene). */
const STICKER_TEXTURE_SIZE = textureSizeFor("sticker_shape_sorter");
/** Base scale for sticker thumbnails (56px from a 512px texture). */
const STICKER_SCALE = STICKER_DISPLAY_SIZE / STICKER_TEXTURE_SIZE;
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
 * Paged (narrow-viewport) grid geometry and interaction constants. Tile size,
 * spacing and centering live in src/game/hubPaging.ts (PAGED_TILE_*); the
 * per-tile furniture offsets below scale with the taller paged tile.
 */
/** Display size of the game icon artwork on a paged tile (px). */
const PAGED_ICON_DISPLAY = 96;
/** Vertical offset of the paged tile icon above the tile center (px). */
const PAGED_ICON_Y_OFFSET = -58;
/** Vertical offset of the paged tile label below the tile center (px). */
const PAGED_LABEL_Y_OFFSET = 48;
/** Label font size on paged tiles (px). */
const PAGED_LABEL_FONT_SIZE = 20;
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
 * Renders the Hub's game-tile grid — the classic 5x4 wide layout, the paged
 * 5x2 narrow-viewport layout, the page dots and swipe gestures, and the
 * sticker shelf under each tile. The Hub scene supplies orchestration
 * (navigation, play-time, audio) through the deps object; this class owns all
 * grid objects and their lifecycle.
 */
export class HubGrid {
  private deps: HubGridDeps;
  /** True when this visit uses the paged (narrow-viewport) grid. */
  paged = false;
  /** Current page in paged mode (0 or 1); reset on every visit to the Hub. */
  hubPage = 0;
  /** Every grid object owned by the classic wide 5x4 layout (rebuilt on resize). */
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

  /** Destroys every object owned by the classic wide grid (tiles + shelf). */
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
   * Builds the classic 5x4 wide grid — the original 20-tile layout kept
   * byte-identical for desktop and tablet viewports.
   */
  buildWideGrid(): void {
    const reducedMotion = isReducedMotion();
    const scene = this.deps.scene;
    this.wideObjects = [];
    this.stickerImages = [];
    this.emptySlotGraphics = [];
    this.attractTargets = [];
    this.entranceIndex = 0;
    const startX =
      (scene.cameras.main.width - GRID_COLS * TILE_WIDTH - (GRID_COLS - 1) * TILE_SPACING) / 2;
    const startY =
      (scene.cameras.main.height - GRID_ROWS * TILE_HEIGHT - (GRID_ROWS - 1) * TILE_SPACING) / 2;

    for (let i = 0; i < GAME_TILES.length; i++) {
      const col = i % GRID_COLS;
      const row = Math.floor(i / GRID_COLS);
      const x = startX + col * (TILE_WIDTH + TILE_SPACING) + TILE_WIDTH / 2;
      const y = startY + row * (TILE_HEIGHT + TILE_SPACING) + TILE_HEIGHT / 2;

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
      this.animateEntrance([tile, label], () => {
        attachPressFeedback(tile, { spring: true });
      });
      this.animateEntrance([icon], undefined, iconDisplay / TILE_ICON_TEXTURE_SIZE);

      if (!reducedMotion) {
        // Breathe pulse: scale-only wave so the icon/label/shelf geometry
        // stays fixed (a vertical bob could collide with the fixed slots).
        // Starts after the entrance pop settles; staggered per tile for a
        // travelling wave. Icon scales from its own display scale.
        const breatheDelay = ENTRANCE_DURATION + 50 + i * BOB_PHASE_OFFSET;
        scene.tweens.add({
          targets: [tile, label],
          scaleX: BOB_AMPLITUDE,
          scaleY: BOB_AMPLITUDE,
          duration: BOB_DURATION,
          yoyo: true,
          repeat: -1,
          ease: "Sine.inOut",
          delay: breatheDelay,
        });
        scene.tweens.add({
          targets: [icon],
          scaleX: iconDisplay * BOB_AMPLITUDE * (1 / TILE_ICON_TEXTURE_SIZE),
          scaleY: iconDisplay * BOB_AMPLITUDE * (1 / TILE_ICON_TEXTURE_SIZE),
          duration: BOB_DURATION,
          yoyo: true,
          repeat: -1,
          ease: "Sine.inOut",
          delay: breatheDelay,
        });
      }

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

    pageTileIndexes(page).forEach((globalIndex, slot) => {
      const pos = pagedTilePosition(slot);
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

      this.animateEntrance([tile, label], () => {
        attachPressFeedback(tile, { spring: true });
      });
      this.animateEntrance([icon], undefined, PAGED_ICON_DISPLAY * (1 / TILE_ICON_TEXTURE_SIZE));

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

      if (!reducedMotion) {
        const breatheDelay = ENTRANCE_DURATION + 50 + slot * BOB_PHASE_OFFSET;
        scene.tweens.add({
          targets: [tile, label],
          scaleX: BOB_AMPLITUDE,
          scaleY: BOB_AMPLITUDE,
          duration: BOB_DURATION,
          yoyo: true,
          repeat: -1,
          ease: "Sine.inOut",
          delay: breatheDelay,
        });
        const iconScale = PAGED_ICON_DISPLAY * BOB_AMPLITUDE * (1 / TILE_ICON_TEXTURE_SIZE);
        scene.tweens.add({
          targets: [icon],
          scaleX: iconScale,
          scaleY: iconScale,
          duration: BOB_DURATION,
          yoyo: true,
          repeat: -1,
          ease: "Sine.inOut",
          delay: breatheDelay,
        });
      }

      this.createShelfSticker(globalIndex, x, y, height);
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
    if (!this.paged || page < 0 || page >= PAGE_COUNT || page === this.hubPage) return;
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
    for (let page = 0; page < PAGE_COUNT; page++) {
      const dot = scene.add.circle(
        scene.cameras.main.width / 2 + (page - (PAGE_COUNT - 1) / 2) * PAGE_DOTS_SPACING,
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
  createShelfSticker(index: number, x: number, y: number, tileHeight = TILE_HEIGHT): void {
    const earned = hasSticker(GAME_TILES[index].gameId);
    const stickerX = x;
    // Sits 13px above the tile bottom edge so the dashed slot / thumbnail
    // clears the label's bob range (label bottom at +25.5px + 4px bob =
    // +29.5px; circle top at +34px on the wide grid).
    const stickerY = y + tileHeight / 2 - 13;

    if (earned) {
      const sticker = this.deps.scene.add.image(
        stickerX,
        stickerY,
        `sticker_${GAME_TILES[index].gameId.replace(/-/g, "_")}`,
      );
      this.stickerImages.push(sticker as Phaser.GameObjects.Image);
      if (GAME_TILES[index].gameId === this.justEarned) {
        sticker.setScale(STICKER_SCALE * JUST_EARNED_SCALE);
        this.animateJustEarned(sticker as Phaser.GameObjects.Image);
      } else {
        sticker.setScale(STICKER_SCALE);
        this.animateEntrance(
          [sticker],
          () => this.addSparkle(sticker as Phaser.GameObjects.Image),
          STICKER_SCALE,
        );
      }
    } else {
      this.drawEmptySlot(stickerX, stickerY);
    }
  }

  /**
   * Draws a dashed circle outline where an unearned sticker will appear,
   * communicating the collection goal textlessly in place of a dimmed ghost.
   */
  drawEmptySlot(x: number, y: number): void {
    const graphics = this.deps.scene.add.graphics();
    // Anchor the object at the slot center and draw the dashed ring around
    // (0, 0), so page-slide tweens can move the slot by its position.
    graphics.setPosition(x, y);
    this.emptySlotGraphics.push(graphics);
    const radius = STICKER_DISPLAY_SIZE / 2;
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
        const pos = pagedTilePosition(slot);
        this.createShelfSticker(globalIndex, pos.x, pos.y, pos.height);
      });
      return;
    }
    const startX =
      (scene.cameras.main.width - GRID_COLS * TILE_WIDTH - (GRID_COLS - 1) * TILE_SPACING) / 2;
    const startY =
      (scene.cameras.main.height - GRID_ROWS * TILE_HEIGHT - (GRID_ROWS - 1) * TILE_SPACING) / 2;
    for (let i = 0; i < GAME_TILES.length; i++) {
      const col = i % GRID_COLS;
      const row = Math.floor(i / GRID_COLS);
      const x = startX + col * (TILE_WIDTH + TILE_SPACING) + TILE_WIDTH / 2;
      const y = startY + row * (TILE_HEIGHT + TILE_SPACING) + TILE_HEIGHT / 2;
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
  private animateJustEarned(sticker: Phaser.GameObjects.Image): void {
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
      config.scaleX = JUST_EARNED_SCALE * STICKER_SCALE;
      config.scaleY = JUST_EARNED_SCALE * STICKER_SCALE;
      config.onComplete = () => this.addJustEarnedBurst(sticker);
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
  private addJustEarnedBurst(sticker: Phaser.GameObjects.Image): void {
    this.addSparkle(sticker);
    if (isReducedMotion()) return;
    this.deps.scene.tweens.add({
      targets: sticker,
      scaleX: BURST_SCALE * STICKER_SCALE,
      scaleY: BURST_SCALE * STICKER_SCALE,
      duration: BURST_DURATION,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });
  }

  /**
   * Fades (and, under normal motion, scales) an element in with a per-element
   * stagger. Under reduced motion only alpha is animated.
   * @param targets - Display objects to animate.
   * @param onComplete - Optional callback invoked when the entrance finishes.
   * @param targetScale - Scale to end at (defaults to 1; pre-sized objects pass
   *   their display scale, e.g. tile icons at display / texture-tier size).
   */
  private animateEntrance(
    targets: Phaser.GameObjects.GameObject[],
    onComplete?: () => void,
    targetScale = 1,
  ): void {
    const index = this.entranceIndex;
    this.entranceIndex += 1;
    const config: Phaser.Types.Tweens.TweenBuilderConfig = {
      targets,
      alpha: 1,
      delay: index * ENTRANCE_STAGGER,
      duration: ENTRANCE_DURATION,
      ease: "Sine.out",
    };
    if (onComplete) {
      config.onComplete = onComplete;
    }

    for (const target of targets) {
      const tweenable = target as Phaser.GameObjects.GameObject & {
        setAlpha: (alpha: number) => unknown;
        setScale: (scale: number) => unknown;
      };
      tweenable.setAlpha(0);
      if (!isReducedMotion()) {
        tweenable.setScale(0);
        config.scaleX = targetScale;
        config.scaleY = targetScale;
      }
    }

    this.deps.scene.tweens.add(config);
  }
}
