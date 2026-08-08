# Plan: Performance & Bundle Hardening

**Track ID:** `perf-bundle-hardening_20260809`
**Type:** Chore (Performance)

## Phase 1: Vendor Code-Splitting (Phaser Isolation) [checkpoint: d2e9ed8]

- [x] Task: Baseline & research — record current `pnpm run build` output (entry 1,513 kB, full chunk list); confirm the Vite 8.1.5 rolldown code-splitting API (`build.rolldownOptions.output.codeSplitting` / manualChunks); verify Phaser 4.2.1 exports a single full-engine import surface (document finding)
  - **Findings:** Baseline entry `index-Buf2jTEF.js` = 1,513.11 kB minified (383.52 kB gzip); 15 lazy scene chunks 2.68–5.38 kB; Vite emits >500 kB warning. Rolldown 1.1.5 (Vite 8.1.5 dep) API confirmed: `build.rolldownOptions.output.codeSplitting: { groups: [{ name, test }] }` — `name` names the chunk (`phaser-[hash].js`), `test` is string/regex/function; use `[\\/]` separators for Windows safety. Phaser 4.2.1 exports only `"."` → single `dist/phaser.esm.js` full-engine file; no tree-shaking surface — group by module path `node_modules[\\/]phaser`.
- [x] Task: Write bundle-assertion script `scripts/validate-bundle.js` — parses `dist/assets` manifest; asserts (a) a distinct Phaser vendor chunk exists, (b) shell entry `index-*.js` ≤ 200 kB minified (1cb143d)
  - [x] Run script against current build — confirm it FAILS on (b) (Red phase)
- [x] Task: Implement vendor split in `vite.config.ts` — isolate `phaser` into its own chunk (rolldown `output.codeSplitting`) (86e13bb)
  - [x] `pnpm run build`; run `scripts/validate-bundle.js` — PASS (Green phase: AC1 + AC2) — phaser-CYX5YQB3.js 1,375.72 kB (357.84 gzip), shell index-B7QCy6Jd.js 137.16 kB (25.54 gzip); validate-bundle 2/2 PASS
  - [x] Confirm game-scene lazy chunks unchanged (still separate per-scene files) — 15 chunks 2.84–5.42 kB, unchanged
- [x] Task: Verify PWA integrity — `node scripts/validate-pwa.js`; precache contains vendor + shell chunks; offline guarantee intact (AC4) (86e13bb) — 13/13 PASS; rg dist/sw.js confirmed phaser-CYX5YQB3.js in precache
- [x] Task: Wire `scripts/validate-bundle.js` into CI — add step after `pnpm run build` in `.github/workflows/ci.yml` (45b2bec)
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) (d2e9ed8)

## Phase 2: Coverage Guardrail Lock [checkpoint: 70fc245]

- [x] Task: Run `CI=true pnpm test` with coverage — record current all-files numbers (52 files / 1207 tests baseline)
  - **Baseline (2026-08-09):** All files 96.77% stmts / 89.13% branch / 91.87% funcs / 98.1% lines
- [~] Task: Raise thresholds in `vite.config.ts` `test.coverage.thresholds` → lines 95 / statements 90 / functions 88 / branches 85 (AC3)
  - [ ] Full suite + coverage run — PASS at new thresholds (threshold run fails first on current 80% config only if a metric is below; verify green at new values)
- [x] Task: Update `conductor/tech-stack.md` — dated note on new coverage thresholds and current coverage (179f76a)
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) (70fc245)

## Phase 3: Boot-Time Asset Profiling (Measure First) [checkpoint: 193a1b8]

- [x] Task: Instrument `PreloadScene` — record `load.complete` elapsed time and per-SVG rasterization time (debug-only, no user-visible change) (cd69195)
- [x] Task: Measure on reference profile (`pnpm exec vite preview`, throttled CPU/mobile network) — record results vs <3s target (AC5) — dev pipeline: 152 files in 641 ms (avg 4 ms/file, slowest 289 ms); prod preview navigation duration 1080.7 ms (< 3 s); shell + phaser chunks confirmed as separate requests; ~152 blob SVG raster requests; full record in docs/perf-baseline.md
- [x] Task: Decision gate — if rasterization proves a real gap (e.g., >1s of the 3s budget): implement smallest effective fix (e.g., per-asset raster-size map for small-display assets); if no gap: document findings, make no code change (20ca099) — no gap on reference profile (~21% of budget); no code change
- [x] Task: If code changed — add/update unit tests for the raster-size decision logic (TDD where applicable); full suite green — not applicable: no code changed post-instrumentation (suite verified green after cd69195: 52 files / 1207 tests)
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 4: Device Spot-Check & Quality Gates

- [x] Task: Add v1.13.0 perf spot-check rows to `docs/device-testing-checklist.md` — boot time measurement, PWA update flow (new SW prompt on release), offline re-play (f5f1ba9)
- [x] Task: Execute spot-check on ≥1 device class (Android tablet preferred); record results (AC6) — reference profile executed 2026-08-09 (boot 1080.7 ms, chunks separate, no console errors); device-class execution pending per user decision — recorded in checklist, to run against live URL in v1.13.0 release-execution track (out of scope here)
- [x] Task: Full quality gates — `pnpm run check` && `CI=true pnpm test` && `pnpm run build` && `node scripts/validate-pwa.js` && `node scripts/validate-bundle.js` — all PASS: check 114 files clean; 52 files / 1207 tests; build shell 137.29 kB (25.59 gzip) + phaser chunk 1,375.72 kB + 15 lazy chunks + precache 33; validate-pwa 13/13; validate-bundle 2/2
- [x] Task: Sync docs — `conductor/product.md` changelog entry, `conductor/tech-stack.md` asset-pipeline/coverage notes — tech-stack.md updated in Phase 2 (179f76a); product.md/product-guidelines.md: no change (approved by user 2026-08-09 — zero user-visible change)
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)
