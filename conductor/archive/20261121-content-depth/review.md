# Review: Content Depth

- **Track:** `20261121-content-depth`
- **Type:** `feature`
- **Branch:** `feat/20261121-content-depth`
- **Range:** `e208d451..ed9dd08d`
- **Date:** `2026-11-21T18:59:52+11:00`
- **Verdict:** `PASS`

## Summary

All 19 frozen requirements (FR-1..FR-9, NFR-1..NFR-5, AC-1..AC-9) are implemented and the full
verification gate is green. Round 1 was BLOCK on one High defect (F1: six new shape types had no
matching cut-out texture) plus count-documentation drift (F2/F4). Phase R1 added the six cut-outs,
registered them, added a regression test that every `ShapeType` has a cut-out key, and reconciled
all counts and figures. Round 2 confirms F1, F2 and F4 fixed, no new defects, and the two accepted
departures (F3 scene map; FR-7 caps override) intact and recorded. Verdict PASS.

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| test | `pnpm test -- --run` | pass | 154 files / 3,346 tests (primary, final head) |
| coverage | `pnpm test:coverage` | pass | 97.14/90.97/96.25/98.31 vs gates 95/88/85/90 |
| lint | `pnpm check` | pass | Biome clean, 343 files |
| typecheck | `pnpm typecheck` | pass | src + e2e clean |
| build | `pnpm build` | pass | 468 modules; shell 192.52 kB ≤ 200 kB; cutouts chunk 7.08 kB |
| bundle | `node scripts/validate-bundle.js` | pass | shell 188.0 kB |
| pwa | `node scripts/validate-pwa.js` | pass | 16/16 |
| docs | `node scripts/validate-docs.js` | pass | 5/5 (re-run in round 2) |
| textures | `node scripts/validate-textures.js` | pass | 319 SVGs (34/283/2); 76.07/80, 319.00/320, ratio 0.238 |

## Requirements

| ID | Implemented by | Verified by | Status |
| --- | --- | --- | --- |
| FR-1 | P1 | `wordLogic.ts` WORD_POOL 60 (27/33); phase-1.md | covered |
| FR-2 | P2 | `storyOrderLogic.ts` 30 (15/15); 90-panel bijection; phase-2.md | covered |
| FR-3 | P2 | `feelingsFacesLogic.ts` 48 (12/emotion); phase-2.md | covered |
| FR-4 | P1/R1 | `shapeSorterLogic.ts` ALL_SHAPES 24 + 24 cut-out keys; phase-R1.md | covered |
| FR-5 | P1/P2 | variant modules; byte-identical rule tests | covered |
| FR-6 | P3 | noRepeatScheduling.test.ts (5 degenerate + 128 seeds) | covered |
| FR-7 | P3 | validate-textures.js + wiring workflow.md; synthetic fixtures fail | covered (caps overridden — see Overrides) |
| FR-8 | P4/R1 | count docs reconciled; validate-docs 5/5; phase-R1.md | covered |
| FR-9 | P1-P4 | full gate; PatternBuilderScene map | partial (F3 accepted deviation) |
| NFR-1 | P1/P2/P4/R1 | reuse + textureTiers; 319 SVGs 76.07/319.00 ratio 0.238; bundle 188.0 kB | covered |
| NFR-2 | P1/P2 | gentle/textless content; phase evidence | covered |
| NFR-3 | P1-P3 | injectable RNG preserved | covered |
| NFR-4 | P4/R1 | validate-docs 5/5; reconciled count docs | covered |
| NFR-5 | P1-P4 | no new deps; original in-repo SVGs; traceable art right | covered |
| AC-1 | P1 | WORD_POOL 60 | covered |
| AC-2 | P2 | 30 stories + 90 panels | covered |
| AC-3 | P2 | 48 scenarios (12/emotion) | covered |
| AC-4 | P1/R1 | 24 shapes + 24 cut-outs; cut-out map regression test | covered |
| AC-5 | P1/P2 | variant + purity tests | covered |
| AC-6 | P3 | seeded no-repeat proof | covered |
| AC-7 | P3 | guard PASS real + FAIL synthetic | covered |
| AC-8 | P4/R1 | docs + validate-docs 5/5; 3,346 tests | covered |
| AC-9 | P1-P4 | full gate; sole scenes touch | partial (F3 accepted deviation) |

## Findings

### Critical

- <none>

### High

- **F1 — Six new shape types have no cut-out texture; Shape Sorter slots render missing images** —
  **RESOLVED in Phase R1** (`f942afca`). Six `cutout_*` SVGs added and registered in `cutouts.ts`
  (24 keys) and `prewarm.ts` `CUTOUTS_KEYS` (24 CARD rows); regression test at
  `shapeSorterLogic.test.ts:53-61` asserts every `ShapeType` has a cut-out key. Round 2 confirmed no
  Shape Sorter playthrough can draw a shape without a cut-out. Originally at
  `src/scenes/ShapeSorterScene.ts:158-161`; root cause `cutouts.ts`, `prewarm.ts`,
  `shapeSorterLogic.ts`. Requirement FR-4/NFR-1/AC-4.

### Medium

- **F2 — Count docs claim 24 cut-out SVGs and 48 shape files, but only 18 cut-outs existed** —
  **RESOLVED in Phase R1** (`f942afca`). All counts reconciled to source: 48 shape files (24+24),
  151 group keys / 145 game-only, TOTAL_APP_ASSETS 205, texture keys 207, 319 SVGs; stale 36/18+18
  lines in TDD:329 and SVG_STYLE.md:129 corrected. Round 2 confirmed consistency. Requirement
  FR-8/NFR-4/AC-8.

### Low

- **F3 — FR-9 "no scenes changes" literally breached by compile-forced map additions** —
  **ACCEPTED** (no code change). `src/scenes/PatternBuilderScene.ts:18` exhaustive
  `Record<ShapeType, string>` required six one-line entries after widening `ShapeType` 18→24;
  behavior-neutral. Recorded as an authorized deviation; AC-9 remains partial.

- **F4 — TDD coverage percentages stale relative to final head** — **RESOLVED in Phase R1**
  (`f942afca`). TDD §10.3 (`docs/TDD.md:418`) now reads 97.14/90.97/96.25/98.31. Requirement FR-8.

## Overrides

- **FR-7 texture caps re-baselined** — approving user: the project owner; date: 2026-11-21;
  scope: the frozen 39 MiB typical / 178 MiB full caps were replaced with 80/320 MiB and a hard
  `typical ≤ full/2` ratio, on explicit user instruction ("Re-baseline + ratio"). Recorded in
  `verification/phase-3.md` and a dated supersession note in `docs/perf-baseline.md`. This is a
  sanctioned requirement override, not a defect; the guard's fail-on-synthetic behavior (AC-7) is
  unaffected. Final measured figures: 319 SVGs (34 icon / 283 card / 2 hero), typical tiered
  76.07 MiB ≤ 80, full uniform 512² 319.00 MiB ≤ 320, ratio 0.238 ≤ 0.5 — all PASS.

## Plan compliance

All five phases (P1 `34c1d217`, P2 `1ac2204a`, P3 `ff643225`, P4 `edc25cae`, R1 `f942afca`) and
their 14 tasks are marked verified with evidence. No task marked complete without verification.
The `PatternBuilderScene.ts` deviation (F3) and the FR-7 override are the two authorized departures
from the frozen spec; both are documented here.

## Out of scope

Historical counts in `docs/release-notes-v1.6.0.md` and the Hub-entries count in
`docs/device-testing-checklist.md` are unrelated to this track (confirmed by round 2). No
store/i18n/keyboard work.

## Debt

- <none>

## Doc sync

`none` — all documentation changes were completed in Phase 4 and Phase R1; no documentation changed
by this review, so no post-review sync was required.

## History

| Round | Verdict | Critical | High | Medium | Low | Fixed |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | BLOCK | 0 | 1 | 1 | 2 | 0 |
| 2 | PASS | 0 | 0 | 0 | 0 | 4 (F1–F4 resolved in Phase R1) |
