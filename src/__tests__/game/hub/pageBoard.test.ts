import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  isPagedViewport,
  PAGE_DOT_ACTIVE_ALPHA,
  PAGE_DOT_INACTIVE_ALPHA,
  pageDotAlpha,
  pageDotX,
  paintPageDots,
  SwipeGesture,
  slidePageIn,
  slidePageOut,
  swipeRegion,
  type ViewportSource,
} from "../../../game/hub/pageBoard";
import { stubMatchMedia } from "../../helpers/matchMediaStub";

/** Mock-friendly dot that records setAlpha calls. */
const makeDot = () => ({ setAlpha: vi.fn() });

/** Mock-friendly tween-owning scene, per the gridLayout test pattern. */
const makeScene = () => ({ tweens: { add: vi.fn() } });

/** Structural viewport with the given FIT display size. */
const viewport = (width: number, height: number): ViewportSource => ({
  scale: { displaySize: { width, height } },
  cameras: { main: { width: 1024, height: 768 } },
});

describe("pageBoard — page dots", () => {
  it("centers the dots under the grid with one spacing per page", () => {
    // 3 dots at 1024: canvas center plus (page - 1) * 32.
    expect(pageDotX(0, 3, 1024)).toBe(480);
    expect(pageDotX(1, 3, 1024)).toBe(512);
    expect(pageDotX(2, 3, 1024)).toBe(544);
  });

  it("paints the active dot filled and the others dimmed", () => {
    expect(pageDotAlpha(0, 0)).toBe(PAGE_DOT_ACTIVE_ALPHA);
    expect(pageDotAlpha(1, 0)).toBe(PAGE_DOT_INACTIVE_ALPHA);
    expect(pageDotAlpha(0, 2)).toBe(PAGE_DOT_INACTIVE_ALPHA);
    expect(pageDotAlpha(2, 2)).toBe(PAGE_DOT_ACTIVE_ALPHA);
  });

  it("repaints every dot when the active page changes", () => {
    const dots = [makeDot(), makeDot(), makeDot()];
    paintPageDots(dots, 0);
    expect(dots.map((dot) => dot.setAlpha.mock.calls[0][0])).toEqual([
      PAGE_DOT_ACTIVE_ALPHA,
      PAGE_DOT_INACTIVE_ALPHA,
      PAGE_DOT_INACTIVE_ALPHA,
    ]);
    paintPageDots(dots, 2);
    expect(dots.map((dot) => dot.setAlpha.mock.calls[1][0])).toEqual([
      PAGE_DOT_INACTIVE_ALPHA,
      PAGE_DOT_INACTIVE_ALPHA,
      PAGE_DOT_ACTIVE_ALPHA,
    ]);
  });
});

describe("pageBoard — swipe region", () => {
  it("matches the paged grid's first/last tile bounds byte-for-byte", () => {
    // Pinned geometry: 5x2 grid of 176x196 tiles with 20px spacing inside
    // 1024x768 — left/right/top/bottom must not drift from hubPaging's math.
    expect(swipeRegion()).toEqual({ left: 32, right: 992, top: 178, bottom: 590 });
  });
});

describe("pageBoard — swipe gesture state machine", () => {
  const region = swipeRegion();

  it("flips forward for a horizontal-dominant leftward swipe", () => {
    const swipes = new SwipeGesture();
    swipes.begin({ x: 512, y: 300 }, region, false);
    expect(swipes.swiping).toBe(false);
    swipes.track({ x: 400, y: 300 });
    expect(swipes.swiping).toBe(true);
    expect(swipes.settle({ x: 400, y: 300 }, 0)).toBe(1);
  });

  it("flips backward for a rightward swipe", () => {
    const swipes = new SwipeGesture();
    swipes.begin({ x: 400, y: 300 }, region, false);
    expect(swipes.settle({ x: 520, y: 300 }, 1)).toBe(0);
  });

  it("ignores travel below the threshold", () => {
    const swipes = new SwipeGesture();
    swipes.begin({ x: 512, y: 300 }, region, false);
    swipes.track({ x: 470, y: 300 });
    expect(swipes.swiping).toBe(false);
    expect(swipes.settle({ x: 470, y: 300 }, 0)).toBeNull();
  });

  it("ignores vertical-dominant travel (a horizontal tie is no flip)", () => {
    const swipes = new SwipeGesture();
    swipes.begin({ x: 512, y: 300 }, region, false);
    // |dx| 70 >= threshold but |dx| <= |dy| — reads as a scroll, not a swipe.
    expect(swipes.settle({ x: 582, y: 400 }, 0)).toBeNull();
  });

  it("ignores gestures that start outside the grid region", () => {
    const swipes = new SwipeGesture();
    swipes.begin({ x: 60, y: 60 }, region, false);
    expect(swipes.settle({ x: 400, y: 60 }, 0)).toBeNull();
  });

  it("ignores gestures while an overlay blocks them", () => {
    const swipes = new SwipeGesture();
    swipes.begin({ x: 512, y: 300 }, region, true);
    expect(swipes.settle({ x: 400, y: 300 }, 0)).toBeNull();
  });

  it("clears the start on settle, so one gesture flips at most once", () => {
    const swipes = new SwipeGesture();
    swipes.begin({ x: 512, y: 300 }, region, false);
    expect(swipes.settle({ x: 400, y: 300 }, 0)).toBe(1);
    expect(swipes.settle({ x: 380, y: 300 }, 0)).toBeNull();
  });

  it("keeps the swipe flag until the next begin, so a trailing tap is swallowed", () => {
    const swipes = new SwipeGesture();
    swipes.begin({ x: 512, y: 300 }, region, false);
    swipes.track({ x: 400, y: 300 });
    swipes.settle({ x: 380, y: 300 }, 0);
    expect(swipes.swiping).toBe(true);
    swipes.begin({ x: 512, y: 300 }, region, false);
    expect(swipes.swiping).toBe(false);
  });

  it("treats a pointermove before any begin as a no-op", () => {
    const swipes = new SwipeGesture();
    swipes.track({ x: 100, y: 100 });
    expect(swipes.settle({ x: 100, y: 100 }, 0)).toBeNull();
  });

  it("re-arms after a first swipe for a second gesture", () => {
    const swipes = new SwipeGesture();
    swipes.begin({ x: 512, y: 300 }, region, false);
    expect(swipes.settle({ x: 400, y: 300 }, 0)).toBe(1);
    swipes.begin({ x: 512, y: 300 }, region, false);
    expect(swipes.settle({ x: 380, y: 300 }, 1)).toBe(2);
  });
});

describe("pageBoard — page slide tweens", () => {
  it("slides incoming objects to their settle x with the page duration", () => {
    const scene = makeScene();
    slidePageIn(scene, ["tile", "icon", "label"], 120);
    expect(scene.tweens.add).toHaveBeenCalledTimes(3);
    for (const call of scene.tweens.add.mock.calls) {
      expect(call[0]).toEqual({
        targets: expect.anything(),
        x: 120,
        duration: 300,
        ease: "Cubic.out",
      });
    }
  });

  it("slides outgoing objects off-canvas relative to where they sit", () => {
    const scene = makeScene();
    slidePageOut(scene, [{ x: 100 }, { x: 250 }], -1024);
    expect(scene.tweens.add.mock.calls.map((call) => call[0].x)).toEqual([-924, -774]);
    for (const call of scene.tweens.add.mock.calls) {
      expect(call[0].duration).toBe(300);
      expect(call[0].ease).toBe("Cubic.in");
    }
  });
});

describe("pageBoard — viewport classification", () => {
  beforeEach(() => stubMatchMedia(false));
  afterEach(() => vi.unstubAllGlobals());

  it("keeps the wide canvas wide (byte-identity: no relayout at 1024x768)", () => {
    expect(isPagedViewport(viewport(1024, 768))).toBe(false);
  });

  it("classifies tablet-landscape class sizes as wide too", () => {
    expect(isPagedViewport(viewport(1280, 800))).toBe(false);
  });

  it("classifies phone-sized viewports as paged", () => {
    expect(isPagedViewport(viewport(844, 390))).toBe(true);
  });

  it("falls back to the camera size when no display size is reported", () => {
    expect(isPagedViewport({ cameras: { main: { width: 1024, height: 768 } } })).toBe(false);
    expect(
      isPagedViewport({
        scale: null,
        cameras: { main: { width: 400, height: 300 } },
      }),
    ).toBe(true);
  });
});
