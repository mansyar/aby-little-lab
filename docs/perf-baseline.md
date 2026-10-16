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

## Track Baseline — hub-phone-ux-perf_20261017 — 2026-10-17

Phase 1 "before" numbers for the Phone-Scale Hub UX + Boot/Texture Performance
Hardening track (spec NFR + acceptance evidence).

### Method

Same production-preview Navigation Timing method as the baseline above
(`pnpm run build` → `pnpm exec vite preview --port 4173`), with two hardening
lessons from this run:

1. **One cold load per fresh browser context.** In-context reload samples
   (even with `Network.clearBrowserCache`) were contaminated by background
   service-worker precache work and CDP session overhead — inflated readings
   of 22–52 s that do not reflect boot. Every number below is a single
   navigation in a freshly opened headless Chromium context (1024×768).
2. **4× CPU throttle applied before navigation** via CDP
   `Emulation.setCPUThrottlingRate`, as the low-end-device proxy.

### Results (2026-10-17, build with 170-asset preload)

| Metric | Measured | Target | Status |
|---|---:|---:|---|
| Boot, cold load ×3 (reference desktop) | 1927 / 2036 / 2162 ms (median **2036 ms**) | < 3000 ms | PASS |
| DOM content loaded (same runs) | ~332–358 ms | — | — |
| JS heap at boot (same runs) | ~18 MB | < 150 MB total | — |
| Network requests at boot | 12 (SVGs are inlined base64 data URIs — no network fetch) | — | expected |
| **Boot, 4× CPU throttle ×2** | 16005 / 16290 ms (median **~16.1 s**) | < 3000 ms | **FAIL (~5.4× budget)** |
| PWA precache | 48 entries, 3382 KiB | — | — |

The 4×-throttled result supersedes the 2026-08-09 follow-up estimate
("~2.5 s worst case"): the real throttled cost includes JS parse/compile of
the ~1.37 MB Phaser vendor chunk plus the 170-SVG rasterization, and lands
~5× over budget. The reference profile remains comfortably inside budget
(median 2036 ms, consistent with the 2065 ms 2026-08-24 record).

### Texture memory audit (analytic, preload-time)

All 170 SVG assets rasterize at a uniform `SVG_RASTER_SIZE = 512`
(`src/scenes/PreloadScene.ts`), inlined as base64 data URIs in the JS bundle:

- Per-texture RGBA: 512 × 512 × 4 B = 1,048,576 B (1 MiB)
- 170 textures ≈ **178 MB** GPU-resident potential once uploaded
  (+ ~33% ≈ 237 MB if mipmaps are generated)
- Most consumers display far below 512 px (Hub tiles ~160×116, stickers ~256)

This exceeds the < 150 MB total memory NFR when combined with heap + runtime
buffers, and is the primary optimization target of Phase 3 (per-use tiers).

### Verification notes

- Hub rendered correctly after boot in every run (all 20 tiles, mascot,
  profile avatar, Settings); screenshot captured 2026-10-17.
- Only console error: `favicon.ico` 404 (cosmetic, unrelated to this track).

### Decision

Proceed with the planned optimization phases (per-use raster tiers, storage
memoization, font-gate concurrency, bgm trim). The 4×-throttled boot failure
makes the texture-tier work the highest-value item; "after" numbers will be
recorded in Phase 6 against this baseline.
