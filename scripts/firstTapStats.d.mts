/** Nearest-rank percentile for a quantile in `(0, 1]`, without mutating input. */
export declare function percentile(values: readonly number[], q: number): number | null;

/** Cold first-tap stage-C p95 using the deterministic nearest-rank definition. */
export declare function p95(values: readonly number[]): number | null;
