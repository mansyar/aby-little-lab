import { describe, expect, it } from "vitest";

import { p95, percentile } from "../../../scripts/firstTapStats.mjs";

describe("first-tap nearest-rank statistics", () => {
  it("returns null for an empty sample", () => {
    expect(p95([])).toBeNull();
    expect(percentile([], 0.95)).toBeNull();
  });

  it("returns the only value for a single sample", () => {
    expect(p95([42])).toBe(42);
    expect(percentile([42], 0.95)).toBe(42);
  });

  it("uses the exact nearest-rank index for ten values without interpolating", () => {
    expect(p95([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])).toBe(10);
  });

  it("uses nearest rank for even and odd samples", () => {
    expect(p95([40, 10, 30, 20])).toBe(40);
    expect(p95([50, 10, 40, 20, 30])).toBe(50);
    expect(percentile([40, 10, 30, 20], 0.5)).toBe(20);
  });

  it("sorts a copy and leaves the input order unchanged", () => {
    const values = [30, 10, 50, 20, 40];
    const original = [...values];

    expect(p95(values)).toBe(50);
    expect(values).toEqual(original);
  });
});
