export interface FirstTapReportStageMs {
  readonly responseMs: number | null;
  readonly finishedMs: number | null;
  readonly totalMs: number | null;
}

export interface FirstTapReportRun {
  readonly game: string;
  readonly chunk: string;
  readonly tapKind?: "cold" | "warm";
  readonly responseMs: number;
  readonly finishedMs: number;
  readonly totalMs: number;
  readonly blockedMs: number;
}

export interface FirstTapGameP95Ms {
  readonly game: string;
  readonly samples: number;
  readonly responseMs: number | null;
  readonly finishedMs: number | null;
  readonly totalMs: number | null;
}

export interface FirstTapReportSummary {
  readonly warmAware?: boolean;
  readonly budgetMs: number;
  readonly runs: readonly FirstTapReportRun[];
  readonly medians: FirstTapReportStageMs;
  readonly cold: {
    readonly p95Ms: FirstTapReportStageMs;
    readonly perGameP95Ms: readonly FirstTapGameP95Ms[];
  };
  readonly warmMedians?: { readonly totalMs: number } | null;
  readonly worst: { readonly game: string; readonly totalMs: number } | null;
  readonly coldCount?: number;
  readonly warmCount?: number;
}

export type FirstTapReportFormat = "text" | "json";

/** Render a tap summary without logging, I/O, measurement, or input mutation. */
export declare function renderFirstTapReport(
  taps: FirstTapReportSummary,
  format?: FirstTapReportFormat,
): string;
