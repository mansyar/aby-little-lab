# Performance Baseline — Boot-Time Asset Profiling

Track: `perf-bundle-hardening_20260809`, Phase 3 (measure-first). Date: 2026-08-09.

## Method

1. Instrumented `PreloadScene.preload()` with dev-only timing (aggregate SVG
   load/rasterization duration, file count, avg ms/file, slowest single-file
   delta) — logged only when `import.meta.env.DEV` (dead-code-eliminated in
   production builds).
2. Dev-server measurement (`pnpm dev`, Chromium headless via playwright-cli):
   captures the rasterization pipeline for all 152 SVGs.
3. Production-preview measurement (`pnpm exec vite preview --port 4173`,
   same browser): Navigation Timing API duration + request-level chunk
   verification.

## Results

| Metric | Measured | Target | Status |
|---|---|---|---|
| SVG preload (152 files, dev pipeline) | 641 ms total, avg 4 ms/file, slowest 289 ms | — | — |
| Full boot (production preview, navigation duration) | 1080.7 ms | < 3000 ms | PASS |
| Shell chunk request | `index-B7QCy6Jd.js` 134.0 kB | — | — |
| Vendor chunk request | `phaser-CYX5YQB3.js` 1,343.5 kB | — | — |
| SVG raster requests at boot | ~152 blob requests | — | expected |

The 152-SVG rasterization consumes ~21% of the 3 s boot budget on the
reference (desktop) profile — no gap proven.

## Decision (AC5)

**No optimization applied.** Per the measure-first decision gate, the
rasterization cost stays well within budget on the reference profile; the
slowest single file (289 ms, first-file bootstrap) is not actionable. No
asset-raster-size changes and no per-game asset lazy-loading were introduced
(spec Out of Scope: shared textures make lazy-loading risky without a proven
tier-level bottleneck).

## Recommended follow-ups (out of scope, not scheduled)

- Re-run this measurement on a low-end Android tablet (4× CPU throttle
  estimate: ~2.5 s worst case for the full preload) before considering
  raster-size reductions for small-display assets.
- The dev/prod instrumentation is intentionally dev-only; if a permanent
  perf-regression gate is ever wanted, promote the timing into the
  `validate-*` script family with a CI threshold.

## Ligne Pilot Addendum — 2026-08-24

Track: `hoot-ligne-pilot_20260822`, Phase 3. Measured from a production Vite
preview in a fresh Chromium context using the same Navigation Timing and
request-entry method as the baseline above.

### Bundle delta

| Asset | Baseline | Ligne pilot | Delta / delivery |
|---|---:|---:|---|
| Shell entry | 134.0 KiB | 155.2 KiB | +21.2 KiB; still below the enforced 200 KiB ceiling |
| Phaser vendor | 1,343.5 KiB | 1,342.6 KiB | -0.9 KiB; effectively unchanged |
| Hoot asset URL module | — | 0.07 kB raw / 0.09 kB gzip | Lazy |
| Ligne JS bridge | — | 32.04 kB raw / 9.44 kB gzip | Lazy and precached |
| Ligne WASM engine | — | 1,682.84 kB raw / 538.81 kB gzip | Lazy JS bridge but WASM **precached** (v1.16.0+); was CacheFirst runtime cache, excluded from precache |
| Hoot `.ligne` asset | — | 29.31 kB raw | Lazy at runtime and precached for offline fallback recovery |

`node scripts/validate-bundle.js` passed both guardrails: the Phaser vendor
chunk remains isolated and the shell remains below 200 KiB.

### Boot evidence

| Metric | Original baseline | Ligne pilot | Target | Status |
|---|---:|---:|---:|---|
| Production navigation duration | 1080.7 ms | 2065.0 ms | < 3000 ms | PASS |
| Ligne loading begins | — | 2172.3 ms | After boot | PASS |

The reference run remained 935 ms inside the boot budget. More importantly,
the first Ligne request began 107.3 ms after the page load event, confirming
that the `.ligne`, JS bridge, and WASM engine were not on the measured boot
critical path. The tween mascot remains available immediately and the Ligne
runtime replaces it asynchronously.
