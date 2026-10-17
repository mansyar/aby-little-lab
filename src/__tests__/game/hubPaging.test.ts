import { describe, expect, it } from "vitest";
import {
  NARROW_SCALE_THRESHOLD,
  PAGE_COUNT,
  PAGE_SIZE,
  fitDisplayScale,
  isNarrowViewport,
  pageOf,
  pageTileIndexes,
  pagedTilePosition,
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
    // Exactly at the threshold is still wide (>= keeps the 5x4 grid).
    const boundaryScale = 64 / 116;
    expect(
      isNarrowViewport(
        boundaryScale * CANVAS.width,
        boundaryScale * CANVAS.height,
      ),
    ).toBe(false);
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

  it("maps every tile index back to its page", () => {
    expect(pageOf(0)).toBe(0);
    expect(pageOf(9)).toBe(0);
    expect(pageOf(10)).toBe(1);
    expect(pageOf(19)).toBe(1);
  });

  it("covers all 20 tiles exactly once across pages", () => {
    const all = [...pageTileIndexes(0), ...pageTileIndexes(1)].sort((a, b) => a - b);
    expect(all).toEqual([...Array(20).keys()]);
  });

  it("rejects out-of-range pages", () => {
    expect(() => pageTileIndexes(2)).toThrow();
    expect(() => pageTileIndexes(-1)).toThrow();
  });
});

describe("page constants", () => {
  it("splits 20 tiles into 2 pages of 10", () => {
    expect(PAGE_SIZE).toBe(10);
    expect(PAGE_COUNT).toBe(2);
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
    for (let i = 0; i < 10; i++) {
      const { x, y } = pagedTilePosition(i);
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(CANVAS.width);
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThan(CANVAS.height);
    }
  });

  it("uses tiles whose min edge clears the 64px floor on a 740x360 phone", () => {
    const tile = pagedTilePosition(0, CANVAS.width, CANVAS.height);
    const scale = fitDisplayScale(740, 360);
    expect(Math.min(tile.width, tile.height) * scale).toBeGreaterThanOrEqual(64);
  });

  it("keeps tiles clear of the top control band and the bottom mascot band", () => {
    for (let i = 0; i < 10; i++) {
      const { x, y, width, height } = pagedTilePosition(i, CANVAS.width, CANVAS.height);
      expect(y - height / 2).toBeGreaterThanOrEqual(116); // avatar chip / Settings band
      expect(y + height / 2).toBeLessThanOrEqual(620); // corner mascot band
      expect(x - width / 2).toBeGreaterThanOrEqual(0);
      expect(x + width / 2).toBeLessThanOrEqual(CANVAS.width);
    }
  });
});
