# Performance Baseline — Boot-Time Asset Profiling

> **Live figures — refreshed 2026-11-26.** The figures here describe the current tree: Vite 8.3.8 built 491 modules; shell entry `index-CzNKiaF1.js` is 195.3 kB via `validate-bundle` (199.96 kB as Vite prints it, 51.15 kB gzip), with **52** JavaScript chunks and **64** PWA precache entries (1877.29 KiB). The suite is 158 test files / 3,406 tests across 97.08–97.09 % statements, 90.89–90.93 % branches, 96.35 % functions and 98.23 % lines across repeated identical runs. The current release-candidate browser matrix is green locally with zero retries across the full Chromium journey suite and the WebKit, Firefox and mobile Chromium smoke projects; the earlier 2026-11-16 Chromium-only record remains history. The first-tap verdict was remeasured on 2026-11-26: 50 cold / 0 warm headed cold-control samples, aggregate cold p95 response / finished / total 58.4 / 37.6 / 332.3 ms, cold median total 235.4 ms, and worst cold total 383.8 ms (Memory Match), all inside the unchanged 400 ms gate; see [First-tap p95 baseline after the Word Match fix (2026-11-24)](#first-tap-p95-baseline-after-the-word-match-fix-2026-11-24) for the earlier baseline. Historical sections retain their dated build, coverage, browser and first-tap figures. The four suite-count rows explicitly labeled as current living values were refreshed on 2026-11-26 for docs truth, not taken from those dated sessions. Where a historical figure disagrees with this header, the header is current truth and the record is history.
>
> The standing debts live in the README's Known Issues, and the planned work behind these numbers lives in [`conductor/roadmap.md` §10](../conductor/roadmap.md#10-roadmap).

## First-tap p95 baseline after the Word Match fix (2026-11-24)

Track `20261124-first-tap-p95-baseline`, Phase 3. This is the live resumed
fixed-tree result, measured after the reviewed `20261124-word-match-first-tap`
dependency (PR #97, merged at `025b037f`) landed. The exact headed cold-control
command was:

```sh
TAP_HEADED=1 TAP_INERT_IDLE=1 node scripts/measure-first-tap.mjs --with-preview --json --warm-aware --samples 10
```

The natural headed warm-aware run first observed only **1 cold / 49 warm
samples**. It therefore did not exercise the required 50-sample cold KPI, and
the approved cold-control fallback above was required; this is not presented as
a natural all-cold result.

Environment: Node **v24.22.2**, Playwright **1.65.1**, local interactive headed
Chromium, production Vite preview (`--with-preview`), Hub idle chunk/art prewarm
neutralised (`TAP_INERT_IDLE=1`), and warm-aware tap classification
(`--warm-aware`). The command exited **0** and produced **50 cold / 0 warm
samples**, exactly 10 per game across the unchanged five-game target set: Shape
Sorter, Find the Letter, Find the Word, Add It Up and Memory Match.

| Measurement | Result |
| --- | ---: |
| Aggregate cold p95 response | 63.3 ms |
| Aggregate cold p95 finished | 45.2 ms |
| Aggregate cold p95 total | 270.1 ms |
| Cold median total | 203.6 ms |
| `validate-boot` exit | 0 |
| Unthrottled boot median | 644.3 ms |
| 4×-throttled boot median | 4728.1 ms |

| Game | Samples | p95 response | p95 finished | p95 total |
| --- | ---: | ---: | ---: | ---: |
| Shape Sorter | 10 | 53.6 ms | 43.5 ms | 277.5 ms |
| Find the Letter | 10 | 51.1 ms | 45.2 ms | 241.4 ms |
| Find the Word | 10 | 97.2 ms | 38.1 ms | 249.6 ms |
| Add It Up | 10 | 68.4 ms | 48.3 ms | 270.1 ms |
| Memory Match | 10 | 53.8 ms | 50.0 ms | 223.5 ms |

The worst game is **Shape Sorter at 277.5 ms**, and every worst cold total is
**≤400 ms**. Find the Word's p95 and worst cold total are both **249.6 ms**.
P95 remains report-only; the unchanged worst-cold total ≤400 ms condition
remains the only exit gate. Raw evidence:
[`verification/first-tap-headed.json`](../conductor/archive/20261124-first-tap-p95-baseline/verification/first-tap-headed.json).

The earlier failed **507.4 ms Find the Word** result is preserved as pre-fix
history in [`verification/phase-2.md`](../conductor/archive/20261124-first-tap-p95-baseline/verification/phase-2.md),
not erased or replaced by this passing resumed result.

### Per-release first-tap refresh

After each release-candidate build:

1. Run headed cold control with `--samples 10` against a production preview,
   using the exact command above.
2. Require **50 cold / 0 warm samples**, exactly 10 per game, across the same
   five unchanged targets.
3. Require exit **0** and every worst cold total **≤400 ms**.
4. Publish p95 as report-only and commit the raw JSON evidence.
5. If p95 exceeds 400 ms while the worst-cold gate passes, record a concrete
   follow-up rather than fail; if the worst-cold gate fails, block.
6. Never substitute headless or warm-only data, reduce the sample count or
   target set, or weaken the gate.

No p95 breach exists in this run, so no new follow-up is needed.

## Find the Word cold first-tap fix (2026-11-24)

Track `20261124-word-match-first-tap`, Phase 2. The final Vite 8.3.8 production
build was measured with the exact headed cold-control command:

```sh
TAP_HEADED=1 TAP_INERT_IDLE=1 node scripts/measure-first-tap.mjs --with-preview --json --warm-aware --samples 10
```

Environment: local headed Chromium (`TAP_HEADED=1`), production Vite preview
(`--with-preview`), Hub idle chunk/art prewarm neutralised (`TAP_INERT_IDLE=1`),
and `--warm-aware` tap classification. The command exited **0** and produced
**50 cold / 0 warm samples**, exactly 10 per game across the unchanged five-game
target set: Shape Sorter, Find the Letter, Find the Word, Add It Up and Memory
Match.

| Metric | Result |
| --- | ---: |
| Aggregate cold p95 total | 237.4 ms |
| Aggregate cold median total | 185.1 ms |
| Worst cold game | Find the Word |
| Worst cold total | 251.2 ms |
| `validate-boot` exit | 0 |
| Boot median | 407.9 ms |
| 4×-throttled boot median | 1295.0 ms |

| Game | Cold samples | p95 response | p95 finished | p95 total |
| --- | ---: | ---: | ---: | ---: |
| Shape Sorter | 10 | 55.6 ms | 47.0 ms | 235.1 ms |
| Find the Letter | 10 | 66.7 ms | 59.2 ms | 181.6 ms |
| Find the Word | 10 | 71.6 ms | 54.5 ms | 251.2 ms |
| Add It Up | 10 | 43.0 ms | 31.7 ms | 242.4 ms |
| Memory Match | 10 | 59.6 ms | 50.2 ms | 200.8 ms |

Find the Word's p95 and worst cold total are both 251.2 ms, within the unchanged
400 ms gate; every other game also clears 400 ms. Raw evidence:
[`verification/first-tap-word-match.json`](../conductor/archive/20261124-word-match-first-tap/verification/first-tap-word-match.json).
P95 remains report-only; the worst cold total is the product gate.

### Per-release first-tap refresh

After each release-candidate build, run the headed cold-control command above
with `--samples 10`. Require exit 0, 50 cold / 0 warm samples, 10 samples for each
of the same five games, and every worst cold total ≤400 ms. Commit the raw JSON,
then update this live header and dated table. If a future run exceeds 400 ms,
record the failure and block the release rather than weakening the gate,
reducing the sample count or target set, or substituting headless or warm-only
data.

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
baseline). The build measured here carries the eight tracks merged since
v1.20.0 (PRs #48–#55), and its build, coverage and browser figures are dated.
Only the `Test suite` row is a current living value refreshed on 2026-11-25
for docs truth (see the live header).

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
measured, dated figure and is a candidate for the roadmap in `conductor/roadmap.md` §10.

### Build figures (2026-10-22)

| Figure | Value | Source |
|---|---|---|
| Shell entry (minified) | `index-BrQ7goBH.js` = **134.6 kB** (137.79 kB as Vite prints it, 31.53 kB gzip) | `node scripts/validate-bundle.js` |
| Shell entry budget | ≤ 200 kB | `scripts/validate-bundle.js` |
| Phaser vendor chunk | `phaser-P1E8uaLi.js` = 1342.6 kB | `node scripts/validate-bundle.js` |
| JavaScript chunks emitted | **42** (42 precached) | `node scripts/validate-pwa.js` |
| Service-worker precache | **54 entries** (1707.70 KiB) | the build's PWA step |
| Boot textures rasterized | 53 keys (the game art is lazy) | `src/scenes/PreloadScene.ts` |
| Test suite (current living value, verified 2026-11-26) | 158 files / 3,406 tests | `pnpm test -- --run` |
| Coverage | statements 97.39 % / branches 92.03 % / functions 96.4 % / lines 98.34 % | `pnpm test:coverage` |

The Test-suite row is a current living value verified 2026-11-26. The
Coverage row was verified 2026-11-15; the build figures above are the
2026-10-22 measurement.

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

## Idle art-queue prewarm — cold-tap verdict (2026-10-27)

Track: `20261027-cold-tap-art-preload`, Phase 3. This is the increment
measurement the chunk-prewarm verdict above implies: a cold tap pays fetch
plus module eval **plus art rasterization** — each game rasterizes its SVG
groups inside its own `preload`, and the scene's `create` waits for the
loader — and this track moves that rasterization into Hub idle. Victory is
AC-6: worst-case cold tap ≤ 400 ms, median-of-three, on the same rig. What
Phase 3 established on the executor host and what still needs a headed run
are recorded separately below — no number here is claimed without a run
behind it.

### Method

Two production builds from the same tree, served side by side on the same
host, the same warm-aware rig pointed at each with `PREVIEW_URL`:

| Build | What it is | Shell entry file size |
|---|---|---|
| Baseline (art queue off) | the track branch with the art pass disabled only: both `this.startArtPass()` calls removed (`syncPrewarm`'s delayed call and `restartPrewarm` in `src/scenes/HubScene.ts`), chunk pass intact; built with `pnpm build` | `index-*.js` = 148.82 kB on disk |
| Art prewarm | the track branch as committed (`pnpm build`) | `index-*.js` = 148.86 kB on disk |

(The 152.39 / 152.43 kB figures recorded mid-phase from the build log were
superseded: the on-disk entry files measure 148.82 / 148.86 kB, matching the
`validate-bundle` shell reading of 148.9 kB. The 0.04 kB delta is unchanged —
the two builds are code-identical for practical purposes, so any tap
difference is rasterization saved, not bytes moved.)

```sh
# art prewarm build
pnpm build
node node_modules/vite/bin/vite.js preview --port 4173 --strictPort

# baseline (art queue off): remove the two startArtPass() calls, build, serve
node node_modules/vite/bin/vite.js preview --port 4174 --strictPort

# one run (three runs per build per settle, alternating builds)
PREVIEW_URL=http://localhost:4173/ TAP_HEADED=1 HUB_SETTLE_MS=2000 \
  node scripts/measure-first-tap.mjs --json --warm-aware
# repeat at HUB_SETTLE_MS=6000; inert control on the prewarm build:
PREVIEW_URL=http://localhost:4173/ TAP_HEADED=1 TAP_INERT_IDLE=1 \
  node scripts/measure-first-tap.mjs --json --warm-aware
```

Headed is required (see the chunk-prewarm Method above — headless starves
`requestIdleCallback`, which would starve the art queue exactly as it starves
the chunk pass, and report every tap cold in both builds). Settle stays the
variable: **2000 ms** and **6000 ms**. The `--warm-aware` classification and
the 400 ms cold-only gate are unchanged; an art-warmed tap still needs its
chunk imported first, so chunk-cold taps pay the fetch identically in both
builds and the comparison isolates the raster half.

Stage C cannot see the art half: `recordGamePlay` fires after the chunk
import resolves but before `transitionToScene` starts the game scene, so the
game's `preload` raster and `create` happen after every C reading. The rig
therefore grew a stage D for this track (`scripts/measure-first-tap.mjs`):
from the tap instant an in-page `requestAnimationFrame` loop samples frame
deltas for 2.5 s and reports `blockedMs`, the sum of `max(0, delta - 17)` —
the main-thread time the tap's aftermath (chunk eval, SVG raster and texture
upload, `create`, fade) steals beyond one frame budget. Chunk eval is
byte-identical across builds, so a before/after D difference on the same game
is the raster the idle queue removed. The budget gate stays on C; D is the
art-half evidence. C and D overlap in chunk eval, so they are not additive —
the comparison, not the sum, is the verdict.

### Results (headed, 2026-10-27)

Sixteen runs on the same host, alternating builds per settle, three runs per
build per settle plus three fully-cold inert runs on the art build
(`TAP_INERT_IDLE=1`, idle scheduler neutralised). Every prewarm/baseline run
tapped all five games warm (chunk pass intact in both builds); the inert runs
tapped all five cold. Raw JSON: `.conductor/evidence/tap-runs/`
(`art|base-<settle>-r<1..3>.json`, `art-inert-r<1..3>.json`; verdict lines
stripped for parsing — the rig prints its PASS/FAIL line to stdout even with
`--json`).

Stage C medians, ms (median of the three runs per cell):

| Game | Baseline 2 s | Art 2 s | Baseline 6 s | Art 6 s | Fully cold (inert) |
|---|---|---|---|---|---|
| Shape Sorter | 30.2 | 62.9 | 48.4 | 54.5 | 219.8 |
| Find the Letter | 32.8 | 44.5 | 38.5 | 44.1 | 190.5 |
| Find the Word | 27.5 | 47.5 | 40.2 | 44.3 | 332.6 |
| Add It Up | 32.7 | 45.3 | 50.5 | 55.5 | 204.7 |
| Memory Match | 33.8 | 31.7 | 37.3 | 41.3 | 242.1 |

Stage D (`blockedMs`) medians, ms:

| Game | Baseline 2 s | Art 2 s | Baseline 6 s | Art 6 s | Fully cold (inert) |
|---|---|---|---|---|---|
| Shape Sorter | 53.5 | 16.4 | 90.6 | 20.5 | 98.7 |
| Find the Letter | 56.9 | 32.6 | 40.6 | 0.0 | 115.3 |
| Find the Word | 190.8 | 99.2 | 190.3 | 0.0 | 281.0 |
| Add It Up | 69.9 | 15.6 | 81.9 | 0.0 | 115.0 |
| Memory Match | 36.4 | 0.0 | 44.9 | 8.0 | 81.8 |

Verdict — **AC-6 passes.** The worst fully-cold tap among the five sampled
games is Find the Word at 332.6 ms (median of three inert runs), inside the
400 ms budget, and all five cold medians clear it. The art half is where the track moves the needle: at
6 s settle the queue drives post-tap blockage to ~zero in every game (Find
the Word 190.3 → 0.0, Add It Up 81.9 → 0.0, Shape Sorter 90.6 → 20.5, Find
the Letter 40.6 → 0.0, Memory Match 44.9 → 8.0) — the raster the baseline
still pays on every chunk-warm tap is gone. At 2 s the queue is still working
through its hundreds of keys one raster per idle slot (Find the Word
190.8 → 99.2), exactly the pacing story the chunk pass told first. No chunk
regression: warm C medians sit in the same 20–65 ms band on both builds, and
all twelve prewarm/baseline runs tapped 5/5 warm. The one alarming reading of
the campaign — a 989 ms in-flight Shape Sorter tap on the prior rig — never
repeated across sixteen runs; medians absorb that class of outlier by
construction.

**Sample scope.** The rig taps five representative tiles — the sample
inherited from the chunk-prewarm verdict — including Find the Word, the
widest art union (83 keys) and the slowest tile in every prior run. The
remaining 17 games ride the same queue mechanics (same engine, same gates,
same per-key failure handling) but have no headed cold-tap numbers yet; a
full 22-game sweep is follow-up work, not a claim made here.

Expectation to test, not a claim: at 6 s settle the chunk pass already warms
all five tiles, so the art queue (hundreds of keys, one raster per idle slot,
recency-first) decides how many of the five skip rasterization in `preload`;
the worst case moves only if Find the Word — the slowest tile in every prior
run — is art-warm when tapped. If the worst cold median stays above 400 ms,
the verdict re-scopes honestly to which games remain over budget and why
(key counts per game, tier sizes, queue position at tap time).

### Established in Phase 3 (executor host, 2026-10-27)

- The art-off baseline compiles and builds with a 0.04 kB on-disk shell
  delta (148.82 vs 148.86 kB, superseding the build-log figures),
  isolating rasterization from bytes.
- The full verification gate is green on the art-prewarm tree with the TDD
  §4.8 walkthrough included: Biome clean, typecheck clean, the suite passing at
  the counts then current (today's counts are in the table above),
  `validate-bundle` (shell ≤ 200 kB gate), `validate-pwa` 16/16,
  `validate-docs` 6/6.
- The headed comparison ran on the primary host (sixteen runs, same-host
  alternating builds, plus the stage-D rig extension): the C/D medians table
  and the AC-6 verdict above are measured, not pending. Raw JSON is filed
  under `.conductor/evidence/tap-runs/` beside the phase-3 verification
  note.

## Robot Path — build and suite figures (2026-11-16)

Track `20261115-robot-path`, Phase 6. The build, coverage and browser-journey figures retain
that track's accepted-tree values, recorded in the order the phase's verification chain runs
the commands: `pnpm test:e2e`, `pnpm check`, `pnpm typecheck`, `pnpm test -- --run`,
`pnpm test:coverage`, `pnpm build`, `node scripts/validate-bundle.js`,
`node scripts/validate-pwa.js`, `node scripts/validate-docs.js`. The `Test suite` row is a
current living value refreshed on 2026-11-25 for docs truth.

| Measurement | Value | Source |
| --- | --- | --- |
| Shell entry (minified) | `index-D_-FZk06.js` = **182.6 kB** (186.95 kB as Vite prints it, 47.59 kB gzip) | `node scripts/validate-bundle.js` |
| Shell entry budget | ≤ 200 kB | `scripts/validate-bundle.js` |
| Phaser vendor chunk | `phaser-B_vcVLyb.js` = 1335.0 kB | `node scripts/validate-bundle.js` |
| JavaScript chunks emitted | **49** (49 precached) | `node scripts/validate-pwa.js` |
| Service-worker precache | **61 entries** (1794.60 KiB) | the build's PWA step |
| Boot textures rasterized | 55 (23 tiles, 23 stickers, 2 mascot poses, `icon_speaker`, 6 avatars) | `SHELL_ASSETS` in `src/scenes/PreloadScene.ts` |
| Test suite (current living value, verified 2026-11-26) | 158 files / 3,406 tests | `pnpm test -- --run` |
| Coverage | statements 97.07 % / branches 90.73 % / functions 96.18 % / lines 98.24 % | `pnpm test:coverage` |
| Browser journeys | 23 journeys in 18 spec files, 23 launches; 4.6 min wall clock on two workers, `launch-all` alone at 2.9 min | `pnpm test:e2e` |

The two Robot Path shell SVGs moved the entry from 179.4 kB to 182.4 kB in Phase 4, and Phase 5's
bridge and scene kept it at 182.5 kB — still 17.5 kB inside the gate and inside NFR-3's 4 kB
allowance for the two new drawings. The six robot and prop drawings do not reach the shell at all:
`ROBOT_PATH_ASSETS` is imported by `src/game/robotPathArt.ts` and rasterized by the scene's own
`preload()`, so they land in the game's chunk like Story Order's panels.

The suite grew by seven tests (3,248 → 3,255) and no test file was added or removed: the three new
bridge cases in `src/__tests__/game/e2eBridge.test.ts`, the three new scene cases in
`src/__tests__/scenes/robotPathScene.test.ts` and review round 1's third-stop hint case in the
same scene suite. The browser layer gained one journey file
(`e2e/journeys/robot-path.spec.ts`) and moved its roster literals from 22 to 23 games.

## Fix-It Machine — build and suite figures (2026-11-16)

Track `20261116-fix-it-machine`, Phase 6. The build, coverage and browser-journey figures retain
that track's accepted-tree values, recorded in the order the phase's verification chain runs
the commands: `pnpm test:e2e`, `pnpm check`, `pnpm typecheck`, `pnpm test -- --run`,
`pnpm test:coverage`, `pnpm build`, `node scripts/validate-bundle.js`,
`node scripts/validate-pwa.js`, `node scripts/validate-docs.js`. The `Test suite` row is a
current living value refreshed on 2026-11-25 for docs truth.

| Measurement | Value | Source |
| --- | --- | --- |
| Shell entry (minified) | `index-DK87S-QP.js` = **186.4 kB** (190.89 kB as Vite prints it, 48.35 kB gzip) | `node scripts/validate-bundle.js` |
| Shell entry budget | ≤ 200 kB | `scripts/validate-bundle.js` |
| Phaser vendor chunk | `phaser-B_vcVLyb.js` = 1335.0 kB | `node scripts/validate-bundle.js` |
| JavaScript chunks emitted | **51** (51 precached) | `node scripts/validate-pwa.js` |
| Service-worker precache | **63 entries** (1826.19 KiB) | the build's PWA step |
| Boot textures rasterized | 57 (24 tiles, 24 stickers, 2 mascot poses, `icon_speaker`, 6 avatars) | `SHELL_ASSETS` in `src/scenes/PreloadScene.ts` |
| Test suite (current living value, verified 2026-11-26) | 158 files / 3,406 tests | `pnpm test -- --run` |
| Coverage | statements 97.12 % / branches 90.93 % / functions 96.20 % / lines 98.31 % | `pnpm test:coverage` |
| Browser journeys | **26 browser tests in 19 spec files, 24 launches in two parallel halves**; **3.8-4.3 min** on three workers across two runs on the development host, `launch-all` at 1.8 min; CI splits them across two shards of 13 browser cases each, 2.5 and 3.7 min | `pnpm test:e2e` |

The two Fix-It Machine shell SVGs moved the entry from 182.5 kB to 186.4 kB (+3.9 kB, inside
NFR-3's 4 kB allowance for two new drawings and 13.6 kB inside the 200 kB gate). The sixteen machine
drawings do not reach the shell at all: `FIX_IT_MACHINE_ASSETS` is imported by
`src/game/fixItMachineArt.ts` and rasterized by the scene's own `preload()`, so they land in the
game's chunk like Robot Path's six and Story Order's panels. The roster growth also adds a 24th scene
chunk and a 13th art group, taking the emitted count from 49 to 51.

The unit suite grew by six cases inside the same 154 files: review round 1 added four scene cases
(the three hint representations and the per-tap recording) and two art-declaration cases for the
24th scene, on top of the 15 logic, 11 art, 16 scene and 3 bridge cases the implementation phases
brought with them. The browser layer gained one journey file
(`e2e/journeys/fix-it-machine.spec.ts`, 30.9 s alone) and moved its roster literals from 23 to 24
games. The wall clock is the honest number to watch, and it moved in three steps on this host: 4.6 min
on the Robot Path tree at two workers, 5.0 min once the roster reached 24 games (24 sequential launches
as one 3.3 min file), and 5.1 min with those launches split across two workers — because a two-worker
floor is total work divided by two and the launches are only about a third of the work. Phase 8 of this
track split the roster into two parallel halves and moved the suite to three workers, which measures
**3.8-4.3 min** with `launch-all` at 1.8 min: inside NFR-2's ceiling, from reshaping the launch
journey rather than from deleting any of it.

Three workers is a development-host number. On 2026-11-16 CI's four-vCPU runner showed the cost of
the same setting: three Phaser canvases and the preview server on four cores starved the game loop
badly enough that the backup journey's parental hold, which the gate counts in frames, overran the
journey's own budget and the browser eventually died (`Failed to find context`, run 43947422301).
CI now runs two workers (`workers: isCI ? 2 : 3`), and the hold is budgeted in frames rather than
wall clock, which is the change that made the difference visible instead of mysterious.

Two workers alone were green but slower than NFR-2 allows: run 43950134928 passed all 26 browser
tests in **5.5 min** (6m33s for the job) and run 43951894620 in **6.5 min**, against a 5 min ceiling.
The roster is therefore split across two runners with Playwright's own `--shard` partition, each half
with two workers of its own. Run 43959534246 measures the result:

| Run | Shard 1 (13 cases) | Shard 2 (13 cases) | Aggregation check |
| --- | --- | --- | --- |
| 43959534246 | **2.5 min** (job 3m6s) | **3.7 min** (job 4m17s) | 6 s |
| 43966698279 | **1.9 min** (job 2m24s) | **3.8 min** (job 4m21s) | 3 s |

The slowest half across both runs is **3.8 min**, inside NFR-2's 5 min with over a minute of headroom,
and the suite's wall clock is that half rather than the sum. The halves are not perfectly even — Playwright partitions by
file, and shard 2 carries both parallel launch halves — but both sit inside the budget, and adding a
third entry to `matrix.shard` is the whole change if that ever stops being true. The aggregation job
exists so branch protection keeps waiting on one check named `Browser Journeys`: it fails if either
half did. Details in TDD §10.5.

## Texture budget re-baseline — content-depth_20261121 — 2026-11-21

**This note supersedes the 39/178 MiB figures on line 206 after pool expansion.** The 2026-10-17
measurement covers 170 SVGs; the shipped tree now has 319 after the word, shape, story and
scenario pools grew. The absolute caps are re-baselined to the measured tree with small round-number
headroom; the structural ratio check is the real anti-bloat guard and must never regress.

| Measurement | Value | Source |
| --- | --- | --- |
| Shipped SVG files | 319 (34 icon / 283 card / 2 hero by `textureTiers.ts` rules) | `node scripts/validate-textures.js` |
| Typical tiered GPU bytes | **76.07 MiB** (cap **80 MiB**) | `node scripts/validate-textures.js` |
| Full uniform 512² bytes | **319.00 MiB** (cap **320 MiB**) | `node scripts/validate-textures.js` |
| Tier ratio (typical / full) | **0.238** (hard cap **0.5**) | `node scripts/validate-textures.js` |
| Unit suite after this track (current living value, verified 2026-11-26) | 158 files / 3,406 tests | `pnpm exec vitest run` |

`scripts/validate-textures.js` enumerates every `src/assets/svg/**/*.svg`, resolves each key's tier
with the same ordered prefix rules as `src/utils/textureTiers.ts` (`tile_`, `group_`, `sm_shadow_`,
the five exact icon keys, `mascot_` → hero, everything else → card), and fails on a duplicate key,
either absolute cap, or a ratio above 0.5. It is wired into `verify_phase` after
`validate-bundle.js`. Synthetic fixtures prove the failure path: 400 card-tier SVGs fail both caps
(100.00 MiB / 400.00 MiB, exit 1), and 12 hero-tier SVGs fail the ratio alone (1.000, exit 1).
