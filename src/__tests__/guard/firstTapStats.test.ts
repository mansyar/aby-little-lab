import { describe, expect, it } from "vitest";

import type { FirstTapReportSummary } from "../../../scripts/firstTapReport.mjs";
import { renderFirstTapReport } from "../../../scripts/firstTapReport.mjs";
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

describe("first-tap report rendering", () => {
  const summary: FirstTapReportSummary = {
    warmAware: true,
    budgetMs: 400,
    runs: [
      {
        game: "Find the Word",
        chunk: "WordMatchScene-abc123.js",
        tapKind: "cold",
        responseMs: 80,
        finishedMs: 60,
        totalMs: 260,
        blockedMs: 120,
      },
    ],
    medians: { responseMs: 60, finishedMs: 50, totalMs: 200 },
    cold: {
      p95Ms: { responseMs: 70, finishedMs: 60, totalMs: 250 },
      perGameP95Ms: [
        { game: "Find the Word", samples: 10, responseMs: 80, finishedMs: 60, totalMs: 260 },
      ],
    },
    warmMedians: null,
    worst: { game: "Find the Word", totalMs: 260 },
    coldCount: 10,
    warmCount: 0,
  };

  it("preserves aggregate and per-game p95, median, worst and budget in text and JSON", () => {
    const text = renderFirstTapReport(summary);

    expect(text).toContain("cold p95");
    expect(text).toContain("Find the Word");
    expect(text).toContain("cold median");
    expect(text).toContain("worst cold game: Find the Word at 260.0 ms (C)");
    expect(text).toContain("budget: worst cold game C <= 400 ms");

    const json = JSON.parse(renderFirstTapReport(summary, "json"));
    expect(json).toEqual(summary);
    expect(json.cold.p95Ms).toEqual(summary.cold.p95Ms);
    expect(json.cold.perGameP95Ms).toEqual(summary.cold.perGameP95Ms);
    expect(json.medians).toEqual(summary.medians);
    expect(json.worst).toEqual(summary.worst);
    expect(json.budgetMs).toBe(400);
  });

  it("renders a no-cold summary without inventing a p95 value", () => {
    const noCold: FirstTapReportSummary = {
      warmAware: true,
      budgetMs: 400,
      runs: [],
      medians: { responseMs: null, finishedMs: null, totalMs: null },
      cold: {
        p95Ms: { responseMs: null, finishedMs: null, totalMs: null },
        perGameP95Ms: [],
      },
      warmMedians: null,
      worst: null,
      coldCount: 0,
      warmCount: 10,
    };

    const text = renderFirstTapReport(noCold);
    expect(text).toContain("no cold tap in this run");
    expect(text).not.toContain("cold p95");
    expect(text).not.toContain("cold median");
    expect(text).toContain("budget: worst cold game C <= 400 ms");

    const json = JSON.parse(renderFirstTapReport(noCold, "json"));
    expect(json.cold.p95Ms.totalMs).toBeNull();
    expect(json.worst).toBeNull();
  });
});
