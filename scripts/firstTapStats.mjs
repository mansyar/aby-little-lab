/** Nearest-rank percentile for a quantile in `(0, 1]`, without mutating input. */
export function percentile(values, q) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.ceil(q * sorted.length) - 1];
}

/** Cold first-tap stage-C p95 using the deterministic nearest-rank definition. */
export function p95(values) {
  return percentile(values, 0.95);
}
