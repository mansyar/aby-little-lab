# Performance Baseline — Boot-Time Asset Profiling

> **Live figures — measured 2026-10-27.** The numbers in the section **Idle chunk prewarm — first-tap verdict (2026-10-27)** at the end of this file describe the current build: shell entry `index-DJ5iAYOR.js` at 144.23 kB, **42** JavaScript chunks, **54** precache entries, and the first-tap result split into a warm case (40.9–55.7 ms per game) and a cold case (unchanged, up to ~600 ms). Every other section below is a dated record of an earlier measurement session and keeps the numbers it recorded at the time: the Ligne pilot (2026-08-24), the Ligne removal (2026-10-16), the hub-phone-ux track (2026-10-17), the Shell Diet (2026-10-20) and the Shell Diet re-measurement (2026-10-22). Those records are not rewritten — where one of them disagrees with this header, the header is the current truth and the record is the history.
>
> The standing debts and the planned work behind these numbers live in one place: [`docs/roadmap.md`](roadmap.md).

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

> **Superseded 2026-10-20 (Shell Diet — Lazy Art Groups).** The uniform
> `SVG_RASTER_SIZE = 512` rule above describes the build of 2026-10-17 and is
> kept as the record of that audit. The rule no longer holds: a key now
> rasterises at the tier of wherever it lives — icon 160 / card 256 / hero 512
> (`src/utils/textureTiers.ts`) — and the game art is lazy, so a texture is
> only paid for when its game is opened. The 170-asset preload the audit
> describes was split into a 53-key boot set and twelve lazy art groups. See
> *Shell Diet — Lazy Art Groups — 2026-10-20* and *Shell Diet
> Re-measurement — 2026-10-22* below.

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

Track `conductor/archive/20261020-shell-diet-lazy-art`, branch
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

## Shell Diet Re-measurement — 2026-10-22

Track `20261022-docs-roadmap-truth`, Phase 3 (the checklists and the perf
baseline). This is the live section: the build measured here carries the eight
tracks merged since v1.20.0 (PRs #48–#55), and the numbers below are the ones
the header at the top of this file points at.

### Method

- Shell size, chunk count and precache count: `pnpm build`, then
  `node scripts/validate-bundle.js` and `node scripts/validate-pwa.js`.
- Cold boot: `node scripts/validate-boot.js` against the production build
  served by `vite preview` on port 4173 — three cold loads, each in a **fresh
  browser context** at 1024×768, and the **median of the three** is the number
  the 3 s product budget gates on. The script was run three times; the samples
  of all three runs are listed rather than the best one.
- Cold first tap: `node scripts/measure-first-tap.mjs` — a fresh context per
  game, the service worker blocked so the game's chunk is a real network round
  trip, one Hub tile tapped, and three stages timed: tap → chunk headers, tap
  → chunk body, tap → first frame. **The third stage is the budgeted one.**
  The script was run three times; every run is listed.

### Cold boot (three cold loads per run, fresh context each)

| Run | Samples (ms) | Median (ms) | Verdict (budget < 3000 ms) |
|---|---|---|---|
| 1 | 1736 / 1045 / 1392 | **1392** | PASS |
| 2 | 1376 / 1044 / 1132 | **1132** | PASS |
| 3 (the phase's boot smoke check, after the gate's rebuild) | 1419 / 1115 / 1025 | **1115** | PASS |

The three medians span 1115–1392 ms, well inside the 3 s budget. They are
higher than the 419.5 ms the Shell Diet track recorded on 2026-10-20 — a
different host, and the boot medians on this machine have always been the
slowest of the ones recorded here (the 2026-10-17 record already noted local
medians of 0.63–1.75 s for the same script).

### Cold first tap → first frame (five games, absolute totals in ms)

| Game | Run 1 | Run 2 | Run 3 | Worst seen |
|---|---|---|---|---|
| Shape Sorter | 405.0 | 374.1 | 378.1 | 405.0 |
| Find the Letter | 391.5 | 351.1 | 389.9 | 391.5 |
| Find the Word | 343.5 | 462.2 | 329.9 | 462.2 |
| Add It Up | 351.2 | 309.1 | 351.1 | 351.2 |
| Memory Match | 640.2 | 288.8 | 580.2 | 640.2 |
| **Median across the five** | **391.5** | **351.1** | **378.1** | — |
| **Worst game** | 640.2 (Memory Match) | 462.2 (Find the Word) | 580.2 (Memory Match) | **640.2** |

**The 400 ms first-tap budget is not demonstrated by this measurement.** The
worst game came in at 640.2 / 462.2 / 580.2 ms — above the script's 400 ms
absolute gate in all three runs — while the median across the five games stayed
between 351.1 and 391.5 ms. The script exited non-zero each time for that
reason.

What the number is and is not:

- The 2026-10-20 record met its budget with a different quantity: an
  **increment** of +82 ms (worst game) against a built baseline of the
  pre-track commit `f377bf8`, with absolute totals of 224–334 ms. The script
  today has no pre-track build to subtract, so it measures the absolute total
  and applies the 400 ms budget to it. The two are not comparable like for
  like.
- The measurement is noisy by construction. The 2026-10-20 record already
  measured absolute worst-case totals spread over 277.8–464.1 ms when the
  measurement was repeated minutes apart, and the failing game moved between
  runs here (Memory Match in runs 1 and 3, Find the Word in run 2).
- The host is slower today than it was on 2026-10-20: the same boot script
  returns 1115–1392 ms here against 419.5 ms on the shell-diet host, so the
  whole machine is roughly 3× slower and the tap numbers carry that same
  factor. On the same footing as the 2026-10-20 absolutes (224–334 ms), today's
  288.8–640.2 ms is in the same order of magnitude.
- The two caveats from the 2026-10-20 record still hold: the timing stops at
  the first frame the game paints behind its loading cue, and the service
  worker is blocked, so the chunk fetch is a cold round trip that a warm
  precache would beat.

**Resolved 2026-10-27** — see [Idle chunk prewarm — first-tap verdict (2026-10-27)](#idle-chunk-prewarm--first-tap-verdict-2026-10-27).
The open question below was answered by the increment measurement it asked for: a
built pre-track baseline (`cb5f713a`) and the prewarm build measured back to back
on this host. The short version: a tap that finds its chunk already imported
costs 27–65 ms, comfortably inside the 400 ms budget; a tap that still pays the
fetch does not, and how long the Hub has been idle decides which one happens.
A device pass is still the manual exception the workflow config describes, but
it is no longer needed to know whether the budget is met in the warm condition.
The paragraph is kept as written for the record:

**Open question, not a verdict (closed 2026-10-27):** whether the cold first tap is inside its
budget on the target hardware is not settled by this run. It needs the
increment measurement the shell-diet track used (a built pre-track baseline on
the same host, back to back) and a device pass. It is recorded here as a
measured, dated figure and is a candidate for `docs/roadmap.md`.

### Build figures (2026-10-22)

| Figure | Value | Source |
|---|---|---|
| Shell entry (minified) | `index-BrQ7goBH.js` = **134.6 kB** (137.79 kB as Vite prints it, 31.53 kB gzip) | `node scripts/validate-bundle.js` |
| Shell entry budget | ≤ 200 kB | `scripts/validate-bundle.js` |
| Phaser vendor chunk | `phaser-P1E8uaLi.js` = 1342.6 kB | `node scripts/validate-bundle.js` |
| JavaScript chunks emitted | **42** (42 precached) | `node scripts/validate-pwa.js` |
| Service-worker precache | **54 entries** (1707.70 KiB) | the build's PWA step |
| Boot textures rasterized | 53 keys (the game art is lazy) | `src/scenes/PreloadScene.ts` |
| Test suite | 126 files / 2,753 tests | `pnpm test -- --run` |
| Coverage | statements 97.76 % / branches 91.84 % / functions 96.76 % / lines 98.73 % | `pnpm test:coverage` |

The Test-suite and Coverage rows were verified 2026-10-27; the build
figures above are the 2026-10-22 measurement.

The Shell Diet section above keeps its own numbers (129.1 KiB, 41 chunks, 53
precache entries) — that is what the build of 2026-10-20 measured. The 42
chunks and 54 precache entries above are one chunk and one entry more, from
the tracks that landed after it.

## Idle chunk prewarm — first-tap verdict (2026-10-27)

Track: `20261027-hub-idle-prewarm`, Phase 3. This is the increment measurement
the 2026-10-22 record asked for: a built pre-track baseline and the prewarm
build, same host, back to back, three runs each, medians reported. It answers
the open question in **Cold first tap → first frame** above.

### Method

Two production builds served side by side on this host, and the same script
pointed at each with `PREVIEW_URL`:

| Build | What it is | Served on |
|---|---|---|
| Baseline | commit `cb5f713a` (pre-track), materialised from `git show` into `.conductor/evidence/base-tree` — `src/scenes/HubScene.ts` reverted to the commit's version and `src/game/hub/prewarm.ts` absent — built with `vite build` | `vite preview --port 4174 --strictPort` |
| Prewarm | the track branch (`pnpm build`), prewarm module + Hub wiring in place | `vite preview --port 4173 --strictPort` |

```sh
# baseline
node node_modules/vite/bin/vite.js build .conductor/evidence/base-tree
node node_modules/vite/bin/vite.js preview .conductor/evidence/base-tree --port 4174 --strictPort

# prewarm
pnpm build
node node_modules/vite/bin/vite.js preview --port 4173 --strictPort

# one run, prewarm build (three runs per build, alternating)
PREVIEW_URL=http://localhost:4173/ TAP_HEADED=1 \
  node scripts/measure-first-tap.mjs --json --warm-aware
```

Two properties of the method are worth recording, because both decide whether
the numbers mean anything:

- **The measurement must run headed.** Headless Chromium on this host never
  delivers an idle period once Phaser's game loop is running, so
  `requestIdleCallback` starves: a probe saw the prewarm's single request and no
  callback at all in 20 s, and zero scene chunks fetched. The same probe headed
  saw the callback fire 14 ms after the request and all 22 chunks imported in
  about 0.5 s. Both builds were therefore measured headed (`TAP_HEADED=1`), so
  the baseline is not being flattered by a headless run.
- **Settle time is a variable, not a constant.** `HUB_SETTLE_MS` sets how long
  the measurement waits between the Hub's canvas and the tap, i.e. how long the
  child idles first. The prewarm starts 1200 ms after the entrance settles and
  imports one chunk per idle slot, so this one number decides how many tiles are
  warm. Two settings were measured: **2000 ms** (the script's default — a child
  who taps almost immediately) and **6000 ms** (a child who looks at the Hub for
  a moment first).

`--warm-aware` classifies each tap before it lands, from the requests already
issued for that game's chunk: `imported` (body arrived → reported **warm**,
stages A/B are 0 and stage C runs tap → first frame after the Hub's play
record), `in-flight` (the tap joins the prewarm's own fetch → measured **cold**,
conservatively), or `none` (an ordinary cold tap, unchanged three-stage
measurement). Cold taps are still the only ones the 400 ms gate is applied to.

### Per-game medians of three runs

Settle 2000 ms — a child who taps as soon as the Hub appears:

| Game | Baseline cold median (ms) | Prewarm build median (ms) | Tap kind, runs 1 / 2 / 3 |
|---|---|---|---|
| Shape Sorter | 258.7 | 49.9 | cold / warm / warm |
| Find the Letter | 219.1 | 255.4 | cold / cold / warm |
| Find the Word | 439.0 | 47.9 | cold / warm / warm |
| Add It Up | 269.5 | 52.6 | cold / warm / warm |
| Memory Match | 222.4 | 220.8 | cold / warm / cold |
| **Median across the five** | **258.7** | **52.6** | 8 of 15 taps warm |

Settle 6000 ms — a child who looks at the Hub before tapping:

| Game | Baseline cold median (ms) | Prewarm build median (ms) | Tap kind, runs 1 / 2 / 3 |
|---|---|---|---|
| Shape Sorter | 277.2 | 45.5 | warm / warm / warm |
| Find the Letter | 241.0 | 55.7 | warm / warm / warm |
| Find the Word | 501.4 | 50.7 | warm / warm / warm |
| Add It Up | 324.6 | 40.9 | warm / warm / warm |
| Memory Match | 227.7 | 43.5 | warm / warm / warm |
| **Median across the five** | **277.2** | **45.5** | 15 of 15 taps warm |

### Cold against cold — the tap path did not regress

The prewarm build's own cold path, measured with the idle scheduler neutralised
in the page (`TAP_INERT_IDLE=1`, so the prewarm can never import and every tap
must fetch) against the same baseline runs:

| Game | Baseline cold median (ms) | Prewarm build, cold path (ms) | Spread of individual cold samples |
|---|---|---|---|
| Shape Sorter | 258.7 | 219.1 | 180.8 – 318.3 |
| Find the Letter | 219.1 | 240.8 | 216.0 – 242.6 |
| Find the Word | 439.0 | 595.4 | 170.8 – 627.4 |
| Add It Up | 269.5 | 211.7 | 199.7 – 339.0 |
| Memory Match | 222.4 | 230.9 | 83.0 – 258.5 |

No systematic change: the per-game medians move in both directions, and Find
the Word — the slowest and noisiest tile in every run of this session — spans
170.8–627.4 ms on its own. The tap path is untouched by the track (the diff
touches `HubScene.ts`'s prewarm calls and adds `prewarm.ts`; `openGame`,
`loadSceneWithRetry` and `ensureSceneLoaded` are unchanged), and the prewarm
only ever runs in idle slots, so this is the expected result rather than a
finding.

### Warm taps — a different quantity

A warm tap is not a faster cold tap; it is a tap that pays no chunk fetch and no
module eval at all. Across the two warm-aware batches, 23 warm taps measured
**27.2–64.9 ms**, with per-game medians of 40.9–55.7 ms. Stage A and stage B are
zero by construction, and stage C here is tap → first frame after the Hub's play
record (the warm analogue of "first frame after the chunk settled"), so it is
comparable to the cold total only in the sense that both end at the same
milestone.

### Verdict

**The 400 ms first-tap budget is demonstrated for a tap whose chunk the idle
prewarm has already imported, and not demonstrated for a tap that still pays the
fetch.** Which of the two a child gets depends on how long the Hub has been
sitting idle, and at the current pacing that is a couple of seconds:

- **Idle first (6 s settle): all five measured tiles warm, 40.9–55.7 ms.** Every
  tap in all three runs was already imported, and every one is an order of
  magnitude inside the budget. This is the condition the track was built for.
- **Tap at once (2 s settle): mixed.** 8 of 15 taps were warm and cost
  35.0–52.6 ms; the other 7 were still cold and cost 89.3–392.3 ms. Shape
  Sorter (tile 0), Find the Word and Add It Up were warm in 2 of 3 runs; Find
  the Letter (tile 7) was warm in 1 of 3 and Memory Match (tile 17) in 1 of 3 —
  the prewarm works through the grid in recency order at one chunk per idle
  slot, so the early tiles land first and the last tile of a 22-chunk sweep is
  the one a fast tap can still catch cold.
- **Cold taps are unchanged and still over budget in the worst case.** The
  worst cold median in the whole session was Find the Word at 595.4 ms (prewarm
  build, idle scheduler neutralised) and 501.4 ms (baseline, 6 s settle); the
  script still exits non-zero for those runs, correctly.

So the open question is closed with a scoped answer rather than a pass: the
budget is met in the warm condition, the warm condition arrives after roughly
2–3 s of Hub idle, and a child who taps within the first second or two can
still pay 90–400 ms. Raising the number of chunks imported per idle slot, or
starting the pass earlier than 1200 ms, is what would move the fast-tap case;
neither is in this track. A real-device pass remains the manual exception the
workflow config describes, and it is now a confirmation of a measured result
rather than the thing that would settle an unknown.

Caveats, unchanged from the sections above:

- Stage C still stops at the first frame the game paints behind its loading cue,
  not at "fully rendered".
- Service workers are blocked in the measurement context, so the chunk fetch is
  a real cold round trip. On a real second visit the PWA precache satisfies it
  from cache, which makes the warm case the more representative one for a
  returning child and the cold case a first-visit floor.
- This host is slow (boot medians 1115–1392 ms against 419.5 ms on the
  shell-diet host), and the run-to-run spread is wide — individual cold samples
  ranged 83.0–627.4 ms. The medians of three are reported for that reason, and
  the tap-kind counts matter more than any single millisecond.
- Idle pacing is invisible to headless automation on this host (see Method), so
  any future re-measurement of the prewarm must run headed or it will measure
  nothing and report every tap cold.

Raw per-run output for both builds: `.conductor/evidence/phase-3/*.json`,
aggregated in `.conductor/evidence/phase-3/aggregate.json`.

Build figures for the prewarm build measured here (2026-10-27): shell entry
`index-DJ5iAYOR.js` = **144.23 kB** (34.12 kB gzip), `phaser-B_vcVLyb.js` =
1367.08 kB, **42** JavaScript chunks, **54** precache entries (1722.35 KiB) —
the shell grew 9.6 kB over the 2026-10-22 figure, from the tracks that landed
after it, and stays well inside the 200 kB budget.

