import { isNarrowViewport, pagedTilePosition } from "../hubPaging";

/**
 * Paged (narrow-viewport) phone-board state machine, extracted from the
 * `hubGrid.ts` orchestrator: page-dot geometry and repaint, the swipe gesture
 * state machine, and the page slide tweens. Pure paging math (page count,
 * tile indexes, tile positions, the narrow-viewport threshold) stays in
 * `hubPaging.ts` and is reused, not duplicated.
 *
 * Pure logic first (no runtime Phaser import — the dragBoard/gridLayout
 * precedent): pointer, dot and tween surfaces are minimal structural
 * interfaces so tests drive them with plain mock objects. Object creation
 * (the dots themselves, the Phaser.Geom hit area) stays with the orchestrator.
 */

/** Duration of the page slide transition (ms). */
export const PAGE_SLIDE_DURATION = 300;
/** Minimum horizontal travel for a swipe to flip pages (logical px). */
export const SWIPE_MIN_DISTANCE = 60;
/** Y position of the textless page dots (below the grid, above the arc). */
export const PAGE_DOTS_Y = 640;
/** Horizontal spacing between the page dots (px). */
export const PAGE_DOTS_SPACING = 32;
/** Radius of a page dot (px). */
export const PAGE_DOTS_RADIUS = 8;
/** Fill color of a page dot (the shared flat storybook outline ink). */
export const PAGE_DOT_COLOR = 0x2d3748;
/** Alpha of the active (filled) page dot. */
export const PAGE_DOT_ACTIVE_ALPHA = 0.9;
/** Alpha of the inactive page dot. */
export const PAGE_DOT_INACTIVE_ALPHA = 0.25;
/** Tappable hit size around each page dot (px, logical). */
export const PAGE_DOT_HIT = 64;

/** Pointer position in logical canvas space (Phaser pointers satisfy this). */
export interface PointerPoint {
  x: number;
  y: number;
}

/** Bounding box (logical px) the swipe gesture is scoped to. */
export interface SwipeRegion {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/**
 * The paged grid's bounding box, derived from the first and last tile slots —
 * swipes that begin outside it (e.g. on the avatar chip) never flip pages.
 */
export function swipeRegion(): SwipeRegion {
  const first = pagedTilePosition(0);
  const last = pagedTilePosition(9);
  return {
    left: first.x - first.width / 2,
    right: last.x + last.width / 2,
    top: first.y - first.height / 2,
    bottom: last.y + last.height / 2,
  };
}

/**
 * Swipe state machine for one wired scene instance: a gesture becomes a swipe
 * once its horizontal travel passes {@link SWIPE_MIN_DISTANCE} inside the
 * paged grid region; a settled gesture resolves to the page to flip to (or
 * null). `swiping` stays true from the threshold until the next `begin`, so a
 * tile tap that ends a swipe gesture is swallowed instead of navigating.
 */
export class SwipeGesture {
  /** Start point of an in-flight swipe, when it began in the grid region. */
  private start?: PointerPoint;
  /** True once the current gesture crossed the swipe threshold. */
  private swipingActive = false;

  /** True once the current gesture crossed the swipe threshold. */
  get swiping(): boolean {
    return this.swipingActive;
  }

  /**
   * Records a gesture start. Every pointerdown resets the swipe flag; an open
   * overlay (profile picker / settings panel) owns the gesture and a start
   * outside the grid region records nothing, so neither can flip a page.
   */
  begin(pointer: PointerPoint, region: SwipeRegion, blocked: boolean): void {
    this.swipingActive = false;
    if (blocked) return;
    if (
      pointer.x >= region.left &&
      pointer.x <= region.right &&
      pointer.y >= region.top &&
      pointer.y <= region.bottom
    ) {
      this.start = { x: pointer.x, y: pointer.y };
    }
  }

  /** Marks the in-flight gesture as a swipe once travel passes the threshold. */
  track(pointer: PointerPoint): void {
    if (!this.start || this.swipingActive) return;
    if (Math.abs(pointer.x - this.start.x) >= SWIPE_MIN_DISTANCE) {
      this.swipingActive = true;
    }
  }

  /**
   * Settles the gesture on pointerup and returns the page to flip to (null
   * when the gesture was no swipe). Only horizontal-dominant travel past the
   * threshold flips; `swiping` stays set until the next `begin`, matching the
   * tile-tap guard that reads it.
   */
  settle(pointer: PointerPoint, hubPage: number): number | null {
    const start = this.start;
    this.start = undefined;
    if (!start) return null;
    const dx = pointer.x - start.x;
    const dy = pointer.y - start.y;
    if (Math.abs(dx) < SWIPE_MIN_DISTANCE || Math.abs(dx) <= Math.abs(dy)) return null;
    return hubPage + (dx < 0 ? 1 : -1);
  }
}

/** X position of page dot `page` of `pages`, centered under the grid. */
export function pageDotX(page: number, pages: number, canvasWidth: number): number {
  return canvasWidth / 2 + (page - (pages - 1) / 2) * PAGE_DOTS_SPACING;
}

/** Alpha of the dot for `page` given the active page. */
export function pageDotAlpha(page: number, activePage: number): number {
  return page === activePage ? PAGE_DOT_ACTIVE_ALPHA : PAGE_DOT_INACTIVE_ALPHA;
}

/** Minimal page-dot surface the repaint needs. */
export interface PageDot {
  setAlpha(alpha: number): unknown;
}

/** Re-paints the page dots to highlight the active page. */
export function paintPageDots(dots: Iterable<PageDot>, activePage: number): void {
  let page = 0;
  for (const dot of dots) {
    dot.setAlpha(pageDotAlpha(page, activePage));
    page += 1;
  }
}

/** Minimal tween-builder config the page slide needs. */
interface SlideTweenConfig {
  targets: unknown;
  x?: number;
  duration?: number;
  ease?: string;
}

/** Minimal tween-owning scene surface (mock-friendly; no runtime Phaser import). */
export interface SlideScene {
  tweens: { add(config: SlideTweenConfig): unknown };
}

/**
 * Slides the incoming page's objects from their offset spawn position to
 * `settleX` — the tile's resting x, where its shelf pieces end up too.
 */
export function slidePageIn(scene: SlideScene, targets: Iterable<unknown>, settleX: number): void {
  for (const obj of targets) {
    scene.tweens.add({
      targets: obj,
      x: settleX,
      duration: PAGE_SLIDE_DURATION,
      ease: "Cubic.out",
    });
  }
}

/**
 * Slides the outgoing page's objects off-canvas by `shift` px from wherever
 * they currently sit.
 */
export function slidePageOut(
  scene: SlideScene,
  targets: Iterable<{ x: number }>,
  shift: number,
): void {
  for (const obj of targets) {
    scene.tweens.add({
      targets: obj,
      x: obj.x + shift,
      duration: PAGE_SLIDE_DURATION,
      ease: "Cubic.in",
    });
  }
}

/** Minimal viewport surface the classification reads. */
export interface ViewportSource {
  scale?: { displaySize?: { width: number; height: number } } | null;
  cameras: { main: { width: number; height: number } };
}

/**
 * True when the viewport is narrow enough that the wide grid needs paging.
 * Reads the FIT display size when the scale manager reports one, falling back
 * to the camera's logical size.
 */
export function isPagedViewport(scene: ViewportSource): boolean {
  const display = scene.scale?.displaySize;
  return isNarrowViewport(
    display?.width ?? scene.cameras.main.width,
    display?.height ?? scene.cameras.main.height,
  );
}
