# Review: Content Depth

- **Track:** `20261121-content-depth`
- **Type:** `feature`
- **Branch:** `feat/20261121-content-depth`
- **Range:** `e208d451..fccf884a`
- **Date:** `2026-11-21T18:32:46+11:00`
- **Verdict:** `BLOCK`

## Summary

All 19 frozen requirements (FR-1..FR-9, NFR-1..NFR-5, AC-1..AC-9) are implemented and the full
verification gate is green. However, widening `ShapeType` to 24 without adding matching cut-out art
leaves six shape types whose Shape Sorter slot holes render missing textures in ~96% of classic
sessions — a user-visible High defect that mocked-Phaser tests cannot catch. Several count docs
falsely claim 24 cut-outs when only 18 exist, masking the defect. Round 1 is BLOCK; Phase R1 adds
the six cut-outs and reconciles every count.

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| test | `pnpm test -- --run` | pass | 154 files / 3,345 tests (primary, fccf884a) |
| coverage | `pnpm test:coverage` | pass | 97.14/90.97/96.25/98.31 vs gates 95/88/85/90 |
| lint | `pnpm check` | pass | Biome clean, 343 files |
| typecheck | `pnpm typecheck` | pass | src + e2e clean |
| build | `pnpm build` | pass | 462 modules; shell 187.9 kB ≤ 200 kB |
| bundle | `node scripts/validate-bundle.js` | pass | shell 187.9 kB |
| pwa | `node scripts/validate-pwa.js` | pass | 16/16 |
| docs | `node scripts/validate-docs.js` | pass | 5/5 (links/anchors/living counts; not numeric art counts) |
| textures | `node scripts/validate-textures.js` | pass | 313 SVGs (34/277/2); 74.57/80, 313.00/320, ratio 0.238 |

## Requirements

| ID | Implemented by | Verified by | Status |
| --- | --- | --- | --- |
| FR-1 | P1 | `wordLogic.ts` WORD_POOL 60 (27/33); phase-1.md | covered |
| FR-2 | P2 | `storyOrderLogic.ts` 30 (15/15); 90-panel bijection; phase-2.md | covered |
| FR-3 | P2 | `feelingsFacesLogic.ts` 48 (12/emotion); phase-2.md | covered |
| FR-4 | P1 | `shapeSorterLogic.ts` ALL_SHAPES 24; phase-1.md | partial (F1: 6 lack cut-outs) |
| FR-5 | P1/P2/P3 | variant modules; byte-identical rule tests | covered |
| FR-6 | P3 | noRepeatScheduling.test.ts (5 degenerate + 128 seeds) | covered |
| FR-7 | P3 | validate-textures.js + wiring workflow.md 39/119/194/224; synthetic fixtures fail | covered (caps overridden — see Overrides) |
| FR-8 | P4 | count docs; validate-docs 5/5 | partial (F2: cut-out count wrong) |
| FR-9 | P1-P4 | full gate; PatternBuilderScene map | partial (F3: compile-forced scenes touch) |
| NFR-1 | P1/P2/P4 | reuse + textureTiers; bundle 187.9 kB | partial (F2 budget figures to reconcile after R1) |
| NFR-2 | P1/P2 | gentle/textless content; phase evidence | covered |
| NFR-3 | P1-P3 | injectable RNG preserved | covered |
| NFR-4 | P4 | validate-docs 5/5 | partial (F2: numeric drift not caught by validator) |
| NFR-5 | P1-P4 | no new deps; 6 original shape SVGs | covered |
| AC-1 | P1 | WORD_POOL 60 | covered |
| AC-2 | P2 | 30 stories + 90 panels | covered |
| AC-3 | P2 | 48 scenarios (12/emotion) | covered |
| AC-4 | P1 | ALL_SHAPES 24 | partial (F1) |
| AC-5 | P1/P2/P3 | variant + purity tests | covered |
| AC-6 | P3 | seeded no-repeat proof | covered |
| AC-7 | P3 | guard PASS real + FAIL synthetic | covered |
| AC-8 | P4 | docs + validate-docs 5/5 | partial (F2) |
| AC-9 | P1-P4 | full gate; sole scenes touch | partial (F3) |

## Findings

### Critical

- <none>

### High

- **F1 — Six new shape types have no cut-out texture; Shape Sorter slots render missing images**
  - **File:** `src/scenes/ShapeSorterScene.ts:158-161`; root cause `src/game/art/cutouts.ts:22-43`,
    `src/game/hub/prewarm.ts:217-235`, `src/game/shapeSorterLogic.ts:97-100`
  - **What:** `ShapeType`/`ALL_SHAPES` widened to 24 and the six new shapes (cube, cross, chevron,
    capsule, sector, parallelogram) are in the EASY/HARD/ALL pools. `poolFor(0)` returns all 24;
    `ShapeSorterScene` builds slots from the drawn shapes and renders each hole as
    `cutout_${slotType}`. The `cutouts` group registers only the original 18 keys and only 18
    `cutout_*.svg` files exist — no `cutout_cube/cross/chevron/capsule/sector/parallelogram`.
    9 of 24 shapes drawn per classic session ⇒ P(at least one new shape) ≈ 0.96: nearly every
    session shows a missing slot image (Phaser __MISSING placeholder). Matching uses type equality,
    so mocked-Phaser unit tests and id-based e2e flows pass and miss this.
  - **Why:** The cut-out silhouette is the core visual of Shape Sorter; a missing hole means the
    child cannot see which hole to fill in most playthroughs. This breaks the feature's core game.
  - **Fix:** Add the six matching `cutout_*` SVGs, register them in `src/game/art/cutouts.ts`, and add
    their CARD-tier rows to `src/game/hub/prewarm.ts`; add a test asserting every `ShapeType` maps to
    a registered `cutout_${type}` key; reconcile SVG/key/budget totals and all count docs.
    (Completes the intended design — the P4 docs already claim 24 cut-outs.)
  - **Requirement:** FR-4 / NFR-1 / AC-4
  - **Test gap:** test that every ShapeType has a registered cut-out key, so the pool cannot outrun art.

### Medium

- **F2 — Count docs claim 24 cut-out SVGs and 48 shape files, but only 18 cut-outs exist**
  - **File:** `docs/PRD.md:166`; `docs/TDD.md:355,432`; `docs/TDD.md:329`; `docs/SVG_STYLE.md:129`
  - **What:** P4 changed PRD:166 to "24 filled shape SVGs plus 24 matching cut-out SVGs" and
    TDD:355 to "shapes/ | 48 | 24 shape_* outlines and their 24 cutout_* filled twins", but on disk
    there are 24 shape SVGs and 18 cut-outs (42 files), and `cutouts.ts` registers 18 keys. The
    group-key totals (PRD:595 / TDD:432: 145 group / 139 game-only) are only correct with cutouts=18
    (24 cut-outs ⇒ 151/145). TDD:329 and SVG_STYLE.md:129 still say "shapes/ 36 (18+18)", stale.
    `validate-docs` 5/5 checks links/anchors, not numeric claims.
  - **Why:** FR-8/NFR-4 require count docs to match the corpus; the false claims conceal F1.
  - **Fix:** After F1 adds six cut-outs, update all counts consistently: 48 files / 24+24, 151 group
    keys / 145 game-only, refresh 313→319 SVG and tier-byte figures, and fix stale 36/18+18 lines.
  - **Requirement:** FR-8 / NFR-4 / AC-8
  - **Test gap:** numeric-consistency assertion comparing stated shape/cut-out/total counts to disk.

### Low

- **F3 — FR-9 "no scenes changes" literally breached by compile-forced map additions**
  - **File:** `src/scenes/PatternBuilderScene.ts:18`
  - **What:** Widening `ShapeType` 18→24 forced six one-line additions to the exhaustive
    `Record<ShapeType, string>` art-key map. Sole `src/scenes/` touch; behavior-neutral.
  - **Why:** FR-9/AC-9 literally exclude scenes, but the map must be updated for TypeScript to
    compile after FR-4; no behavior or rule changed.
  - **Fix:** Accept as an unavoidable, behavior-neutral consequence of FR-4; record here as a
    deviation; keep AC-9 partial. No code change.
  - **Requirement:** FR-9 / AC-9

- **F4 — TDD coverage percentages stale relative to final head**
  - **File:** `docs/TDD.md:418` (§10.3)
  - **What:** Suite size updated to 154/3,345 but coverage figures left at 97.12/90.93/96.20/98.31;
    final is 97.14/90.97/96.25/98.31.
  - **Why:** Minor FR-8 drift, well inside gates; informational.
  - **Fix:** Update the four percentages to final measured values in Phase R1 doc sync.
  - **Requirement:** FR-8

## Overrides

- **FR-7 texture caps re-baselined** — approving user: the project owner; date: 2026-11-21;
  scope: the frozen 39 MiB typical / 178 MiB full caps were replaced with 80/320 MiB and a hard
  `typical ≤ full/2` ratio, on explicit user instruction ("Re-baseline + ratio"). Recorded in
  `verification/phase-3.md` and a dated supersession note in `docs/perf-baseline.md`. This is a
  sanctioned requirement override, not a defect; the guard's fail-on-synthetic behavior (AC-7)
  is unaffected. Must be restated with the final tier figures after R1.

## Plan compliance

All four planned phases (P1 `34c1d217`, P2 `1ac2204a`, P3 `ff643225`, P4 `edc25cae`) and their 11
tasks are marked verified with evidence. No task marked complete without verification. The
`PatternBuilderScene.ts` deviation (F3) and the FR-7 override (Overrides) are the two authorized
departures from the frozen spec; F1/F2 are genuine defects to be fixed in Phase R1.

## Out of scope

Historical counts in `docs/release-notes-v1.6.0.md` and the Hub-entries count in
`docs/device-testing-checklist.md` are unrelated to this track. No store/i18n/keyboard work.

## Debt

- <none yet — strict mode requires F1/F2 fixed in Phase R1.>

## Doc sync

`pending` — Phase R1 will update count docs (F2) and TDD coverage (F4).

## History

| Round | Verdict | Critical | High | Medium | Low | Fixed |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | BLOCK | 0 | 1 | 1 | 2 | 0 |
