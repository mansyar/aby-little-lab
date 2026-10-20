import { describe, expect, it } from "vitest";
import { GAME_REGISTRY } from "../../game/gameRegistry";
import {
  fitDisplayScale,
  isNarrowViewport,
  NARROW_SCALE_THRESHOLD,
  PAGE_SIZE,
  pageCount,
  pagedTilePosition,
  pageOf,
  pageTileIndexes,
} from "../../game/hubPaging";

/**
 * Real device shapes from the device-testing checklist:
 * - narrow phone held portrait:  390 x 844 CSS px
 * - narrow phone held landscape: 844 x 390 CSS px
 * - small phone landscape:       740 x 360 CSS px
 * - desktop:                     1024 x 768 CSS px and up
 * - tablet landscape:            1180 x 820 CSS px
 */
const CANVAS = { width: 1024, height: 768 };

describe("fitDisplayScale", () => {
  it("computes the FIT scale for a landscape phone (min edge governs)", () => {
    // min(844/1024, 390/768) = 0.5078
    expect(fitDisplayScale(844, 390)).toBeCloseTo(0.5078, 4);
  });

  it("computes the FIT scale for a portrait phone", () => {
    // min(390/1024, 844/768) = 0.3809
    expect(fitDisplayScale(390, 844)).toBeCloseTo(0.3809, 4);
  });

  it("is 1 at the base canvas size", () => {
    expect(fitDisplayScale(1024, 768)).toBe(1);
  });
});

describe("isNarrowViewport", () => {
  it("classifies narrow phones (portrait and landscape) as narrow", () => {
    expect(isNarrowViewport(390, 844)).toBe(true);
    expect(isNarrowViewport(844, 390)).toBe(true);
    expect(isNarrowViewport(740, 360)).toBe(true);
  });

  it("classifies desktop and tablets as wide", () => {
    expect(isNarrowViewport(1024, 768)).toBe(false);
    expect(isNarrowViewport(1180, 820)).toBe(false);
    expect(isNarrowViewport(1920, 1080)).toBe(false);
  });

  it("uses the tile min-edge 64px floor as the threshold (64 / 116)", () => {
    expect(NARROW_SCALE_THRESHOLD).toBeCloseTo(64 / 116, 4);
    // Exactly at the threshold is still wide (>= keeps the wide grid).
    const boundaryScale = 64 / 116;
    expect(isNarrowViewport(boundaryScale * CANVAS.width, boundaryScale * CANVAS.height)).toBe(
      false,
    );
    // Just below it, paging kicks in.
    expect(
      isNarrowViewport(
        (boundaryScale - 0.01) * CANVAS.width,
        (boundaryScale - 0.01) * CANVAS.height,
      ),
    ).toBe(true);
  });
});

describe("pageTileIndexes", () => {
  it("assigns tiles 1-10 to page 0 and 11-20 to page 1", () => {
    expect(pageTileIndexes(0)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(pageTileIndexes(1)).toEqual([10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
  });

  it("clamps the last page to the tiles that remain", () => {
    expect(pageTileIndexes(2)).toEqual([20, 21]);
  });

  it("maps every tile index back to its page", () => {
    expect(pageOf(0)).toBe(0);
    expect(pageOf(9)).toBe(0);
    expect(pageOf(10)).toBe(1);
    expect(pageOf(19)).toBe(1);
    expect(pageOf(20)).toBe(2);
    expect(pageOf(21)).toBe(2);
  });

  it("covers every tile exactly once across pages", () => {
    const all = Array.from({ length: pageCount() }, (_, page) => pageTileIndexes(page))
      .flat()
      .sort((a, b) => a - b);
    expect(all).toEqual([...Array(GAME_REGISTRY.length).keys()]);
    expect(all).toEqual([...Array(22).keys()]);
  });

  it("rejects out-of-range pages", () => {
    expect(() => pageTileIndexes(pageCount())).toThrow();
    expect(() => pageTileIndexes(-1)).toThrow();
  });
});

describe("page constants", () => {
  it("splits the registry's 22 tiles into 3 pages (10 + 10 + 2)", () => {
    expect(PAGE_SIZE).toBe(10);
    expect(GAME_REGISTRY).toHaveLength(22);
    expect(pageCount()).toBe(3);
    expect(pageTileIndexes(pageCount() - 1)).toEqual([20, 21]);
  });
});

describe("a 23rd game", () => {
  it("needs no paging edit: 10 + 10 + 3 pages", () => {
    expect(pageCount(23)).toBe(3);
    expect(pageTileIndexes(2, 23)).toEqual([20, 21, 22]);
  });

  it("maps the new last tile to the last page", () => {
    expect(pageOf(22)).toBe(2);
  });

  it("still rejects the page after the last one", () => {
    expect(() => pageTileIndexes(3, 23)).toThrow(RangeError);
  });
});

describe("pagedTilePosition", () => {
  it("lays each page out as 5 columns x 2 rows", () => {
    const first = pagedTilePosition(0);
    const fifth = pagedTilePosition(4);
    const sixth = pagedTilePosition(5);
    expect(fifth.x).toBeGreaterThan(first.x); // later column, same row
    expect(fifth.y).toBeCloseTo(first.y, 6);
    expect(sixth.x).toBeCloseTo(first.x, 6); // row wrap back to column 0
    expect(sixth.y).toBeGreaterThan(fifth.y);
  });

  it("keeps every tile center inside the canvas with a margin", () => {
    for (let i = 0; i < PAGE_SIZE; i++) {
      const { x, y } = pagedTilePosition(i);
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(CANVAS.width);
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThan(CANVAS.height);
    }
  });

  it("uses tiles whose min edge clears the 64px floor on a 740x360 phone", () => {
    const tile = pagedTilePosition(0, PAGE_SIZE, CANVAS.width, CANVAS.height);
    const scale = fitDisplayScale(740, 360);
    expect(Math.min(tile.width, tile.height) * scale).toBeGreaterThanOrEqual(64);
  });

  it("keeps tiles clear of the top control band and the bottom mascot band", () => {
    for (let i = 0; i < PAGE_SIZE; i++) {
      const { x, y, width, height } = pagedTilePosition(i, PAGE_SIZE, CANVAS.width, CANVAS.height);
      expect(y - height / 2).toBeGreaterThanOrEqual(116); // avatar chip / Settings band
      expect(y + height / 2).toBeLessThanOrEqual(620); // corner mascot band
      expect(x - width / 2).toBeGreaterThanOrEqual(0);
      expect(x + width / 2).toBeLessThanOrEqual(CANVAS.width);
    }
  });

  it("keeps a full page's geometry unchanged (5x2, centred)", () => {
    // startX 32 + 88 = 120 for column 0; row 1 top at 178 + 216 = 394.
    const first = pagedTilePosition(0);
    const last = pagedTilePosition(PAGE_SIZE - 1);
    expect(first.x).toBeCloseTo(120, 6);
    expect(first.y).toBeCloseTo(276, 6);
    expect(last.x).toBeCloseTo(904, 6);
    expect(last.y).toBeCloseTo(492, 6);
    // Symmetric about the canvas centre-x: equal 32px margins.
    expect(first.x - first.width / 2).toBeCloseTo(32, 6);
    expect(CANVAS.width - (last.x + last.width / 2)).toBeCloseTo(32, 6);
  });

  it("leaves page 1 (a full page of ten) identical to the default layout", () => {
    const page = pageTileIndexes(1);
    expect(page).toHaveLength(PAGE_SIZE);
    page.forEach((_globalIndex, slot) => {
      expect(pagedTilePosition(slot, page.length)).toEqual(pagedTilePosition(slot));
    });
  });

  it("centres the two-tile last page at the canvas centre-x on the first row", () => {
    const page = pageTileIndexes(pageCount() - 1);
    expect(page).toHaveLength(2);
    expect(page).toEqual([20, 21]);
    const first = pagedTilePosition(0, page.length);
    const second = pagedTilePosition(1, page.length);
    // Two 176px columns with 20px spacing: 32 + 176 + 20 + 176 + 32 = 436 wide box.
    expect(first.x).toBeCloseTo(CANVAS.width / 2 - (176 + 20) / 2, 6);
    expect(second.x).toBeCloseTo(CANVAS.width / 2 + (176 + 20) / 2, 6);
    // The pair is symmetric about the canvas centre.
    expect((first.x + second.x) / 2).toBeCloseTo(CANVAS.width / 2, 6);
    // Vertically still the first row, so the page box keeps its vertical anchor.
    expect(first.y).toBeCloseTo(pagedTilePosition(0).y, 6);
    expect(second.y).toBeCloseTo(pagedTilePosition(0).y, 6);
    expect(first.x - first.width / 2).toBeGreaterThan(0);
    expect(second.x + second.width / 2).toBeLessThan(CANVAS.width);
  });
});
