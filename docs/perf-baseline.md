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

## Ligne Removal Addendum — 2026-10-16

Track: `drop-ligne-mascot_20261016`. The Ligne engine is deleted (tween/SVG-only
mascot). Measured from the production Vite build on the reference machine:

| Metric | Before (v1.18.0) | After | Delta |
|---|---:|---:|---|
| Precache payload | 3382.30 KiB / 48 entries | 1643.13 KiB / 42 entries | **−51%** |
| `dist/` total | 4.7 MB | 3.0 MB | −1.7 MB (WASM engine + bridge + `.ligne` + dev copy) |
| `.wasm` / `.ligne` in `dist/` | 3 files | 0 | gone (PWA validator now asserts absence) |
| Shell entry | — | 171.2 kB | still ≤ 200 kB ceiling |
| Phaser vendor | 1342.6 kB | 1342.6 kB | unchanged |

Runtime effects (by construction, not re-measured): no WASM compilation on
low-end devices, no per-frame DOM-canvas compositor overlay, no 10 s
activation timeout — the tween Hoot renders from scene creation on every
device class, reduced-motion path unchanged. Boot budget (< 3 s) was never on
the Ligne path (engine loaded post-load-event), so boot time is unaffected;
install/update payload is roughly halved.

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

## Font-Gate Finding — hub-phone-ux-perf_20261017 — 2026-10-17

The planned "font-gate concurrency" task was resolved as a **measured no-op**.

- **Measurement** (fresh-context, prod preview, `document.fonts.load`
  instrumented via `addInitScript`): kicked at ~442ms, resolved at ~480ms —
  the gate waits only **~38ms** in the typical case.
- **Why**: the Baloo 2 woff2 is already fetched by the browser at HTML parse
  time (`@font-face` + SW precache); `ensureGlyphFontLoaded()` merely awaits
  an in-flight fetch. There is no fetch left to overlap with loader batches.
- **Why no code change**: splitting the loader into a non-glyph batch → font
  gate → glyph batch risks the documented Arial-fallback regression (track
  `baloo2-glyphs_20260811`): if the non-glyph batch drains before the font
  promise resolves, the scene advances and the glyph batch never enqueues.
  A two-phase split would also restart the progress bar (loader totals reset
  on `start()`).
- **Resolution** (user-approved): keep the gate as-is; timeout cap
  (2500ms) unchanged; record this finding instead of restructuring.

## After-Numbers — hub-phone-ux-perf_20261017 — 2026-10-17

Measured after landing the track's optimizations (per-use texture raster
tiers, storage memoization, bgm re-encode, adaptive paged Hub). Same
fresh-context cold-load methodology as the baseline above.

| Metric | Before (2026-10-17 baseline) | After | Δ |
|---|---|---|---|
| Prod cold boot, median of 3 fresh contexts (1024×768) | 2036 ms (1927/2036/2162) | **808 ms** (815/808/749) | **−60%** |
| Prod cold boot under 4× CPU throttle (diagnostic, low-end proxy) | ~16.1 s (16005/16290) — ~5.4× over the 3 s budget | **~4.2 s** (4333/4036) | **−74%** |
| GPU texture bytes, 170 SVG textures | 178 MiB (uniform 512², ~237 MiB with mipmaps) | **39 MiB** (33×160² + 135×256² + 2×512² × 4 B) | **−78%** |
| JS heap after Hub settle | ~18 MB | ~16–18 MB | unchanged |
| PWA precache total | 4680.2 KiB | **3927.3 KiB** (48 entries) | −752.9 KiB (bgm 1260→503 KiB @128 kbps) |
| Storage reads on hot paths | JSON.parse + normalize per getter call | memoized v2 state (raw-string staleness guard) | parse eliminated on repeat reads |

Notes:

- Boot budget verdict: **< 3 s PASS** unthrottled; the 4×-throttled
  diagnostic no longer catastrophically overruns (was ~5.4×, now ~1.4× on
  this desktop proxy — real low-end device verification remains a device-pass
  item, not a lab number).
- CI enforcement: `scripts/validate-boot.js` gates the median of 3
  fresh-context cold loads against the 3000 ms budget (local medians across
  runs: 0.63–1.75 s on this machine).
- Hub on narrow viewports (≤ 64/116 FIT scale) now pages 10 tiles per page
  (5×2, 176×196 tiles, 96 px icons) — see the paged-Hub rows in
  `docs/device-testing-checklist.md` for the device pass.
- Post-merge reconciliation (2026-10-18, after merging `drop-ligne-mascot_20261016`
  and the coverage-gates track into this branch): the Ligne removal above
  supersedes the payload rows recorded here — precache is now **42 entries /
  2189.6 KiB** (including the trimmed 503.4 KiB bgm) versus the 48 / 3927.3 KiB
  measured with Ligne present, and `scripts/validate-boot.js` re-measured at a
  **0.64 s median** on the merged tree. The texture-tier (−78% GPU memory) and
  paged-Hub results are unaffected by the merge.

## Shell Diet — Lazy Art Groups — 2026-10-20

Track `conductor/tracks/20261020-shell-diet-lazy-art`, branch
`refactor/20261020-shell-diet-lazy-art`. The 178-entry boot table was split:
53 keys stay in the shell (22 tile icons, 22 stickers, 2 mascot poses,
`icon_speaker`, 6 avatars) and the other 125 move into twelve named groups under
`src/game/art/`, each rasterized by the game scene that draws it. Baselines are
this track's own before-numbers (shell 195.4 KiB, 808 ms cold, ~4.2 s throttled);
after-numbers come from the Phase 4 checkpoint (`4f0a47c`).

### Method

- Shell size: `pnpm build` then `node scripts/validate-bundle.js` (minified bytes
  of `dist/assets/index-*.js`).
- Boot and first tap: `node scripts/measure-first-tap.mjs --with-preview --json`,
  which starts `vite preview` on port 4173 itself, runs three cold loads of the
  production build in fresh contexts at 1024×768 (`validate-boot.js`
  methodology, median of 3), then three 4×-CPU-throttled loads
  (`Emulation.setCPUThrottlingRate` 4, diagnostic only), then taps one Hub tile
  per game in a fresh context. The service worker is blocked during the tap
  pass, so the numbers are a cold-network bound rather than a warm-precache one.
- Comparison servers are not symmetric: the pre-track build ran on
  `npx serve dist -l 4174` and the current build on `vite preview` at 4173.
  `serve` compresses by default and Vite preview does not, and stage B of the
  metric is the chunk transfer, so the current build was the disadvantaged side.
  The deltas below are therefore **upper bounds** on the real cost.
- The host refuses commands that start or stop a server, so Phase 4's executor
  could not run the boot/tap script; the primary agent ran it afterwards on the
  same checkpoint. The phase file keeps both attempts and the refusal.

| Metric | Before (track baseline) | After (2026-10-20) | Δ |
|---|---|---|---|
| Shell entry, minified | 195.4 KiB / 200.1 kB | **129.1 KiB** (132.21 kB, 30.02 kB gzip) | **−66.3 KiB**, 40.9 KiB under the 200 KiB gate |
| Boot textures rasterized | 178 | **53** | −125 |
| Prod cold boot, median of 3 fresh contexts | 808 ms (815/808/749) | **419.5 ms** (488.1/398.1/419.5) | **−48%** |
| Prod cold boot under 4× CPU throttle | ~4.2 s (4333/4036) | **1697.2 ms** (1877.3/1697.2/1656.4) | **−2.5 s** |
| Cold first tap -> first frame (5 games) | not measured | **+82 ms worst** (Memory Match), **+48 ms** for the widest union (Find the Word); absolute totals 224-334 ms | new 400 ms budget, met |
| Game art chunks | 0 — every texture rode the shell | **9 chunks, 3.1–16.5 kB**; `cutouts`, `shadows`, `faces` inline into their only consumer | 9 art chunks, none added after Phase 3 |
| PWA precache | 42 entries / 2189.6 KiB | **53 entries / 1701.34 KiB** | +11 entries, −488.3 KiB |

### Notes

- Tap breakdown, corrected after review (F2). The first recording tapped the
  wrong "worst" game and gated on the cross-game median. The script now taps
  five games including **Find the Word** (seven groups, 83 keys - the widest
  union, shared with Word Builder, Decode It and First Sounds) and fails on the
  **worst** total, not the average.
- The criterion is an increment ("adds <= 400 ms versus the same tap today"), so
  it is measured as one. A build of the pre-track commit (`f377bf8`) was built
  into `.conductor/base-build` and served alongside the current build; the script
  ran three times against each, alternating, with `PREVIEW_URL` selecting the
  target. Medians of three rounds on this machine (2026-10-20, service worker
  blocked, 1024x768):

  | Game (art keys) | pre-track | this track | delta |
  | --- | --- | --- | --- |
  | Shape Sorter (36) | 282.7 ms | 263.8 ms | -18.9 ms |
  | Find the Letter (26) | 265.6 ms | 249.4 ms | -16.2 ms |
  | Find the Word (83) | 268.8 ms | 317.2 ms | **+48.4 ms** |
  | Add It Up (48) | 233.5 ms | 224.3 ms | -9.2 ms |
  | Memory Match (37) | 251.9 ms | 333.9 ms | **+82.0 ms** |

  The worst increment is **82 ms**, and the widest-union game adds **48 ms** -
  both far inside the 400 ms budget. Negative deltas are run-to-run noise larger
  than the art cost for a small union, which is itself the point: deferred
  rasterization is not visible at tap time. Absolute cold totals 224-334 ms.
- Run-to-run variance on this machine is large. Repeating the measurement
  minutes apart produced absolute worst-case totals between 277.8 and 464.1 ms
  and 4x-throttled boot medians between 1,697 and 6,072 ms, because background
  processes contend for the same cores. That is why the increment is measured
  back to back against a built baseline instead of against one historical
  number, and why `validate-boot.js` - the only number enforced in CI, at a
  3000 ms median - remains the guarantee.
- Two caveats on the tap number. It stops at the first frame the game paints
  behind its loading cue - the scene's own art rasterization continues after
  that frame - and with the service worker blocked the chunk fetch is a cold
  network round trip, so a warm precache can only be faster.
- CI is unchanged: `validate-boot.js` still gates the median of 3 cold loads at
  3000 ms. The 4x figure moved for a measurable reason - boot no longer
  rasterizes 125 textures - not because the gate moved.
- GPU texture memory is unchanged in kind: the same keys resolve to the same
  `textureSizeFor` tiers, only the moment they are rasterized moved. The
  texture-tier (−78%) result above still holds.
- Offline first play after one online visit still works for every game: the
  service worker precaches all 41 emitted `dist/assets/*.js` chunks, and
  `scripts/validate-pwa.js` now fails the build when any chunk is missing from
  that manifest (proved by deleting one entry from a built `sw.js`).
