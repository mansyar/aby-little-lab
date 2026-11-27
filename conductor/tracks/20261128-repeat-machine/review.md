# Review — 20261128-repeat-machine: Add game 25: a Repeat Machine for loops

- **Track:** 20261128-repeat-machine (feature)
- **Branch:** `feat/20261128-repeat-machine`
- **Range:** `1e02318e2134bfba98d411ae9b2ff5d32b4d37eb..HEAD` (code only, `conductor/` excluded from code diff; spec/plan read as documents)
- **Date:** 2026-11-28
- **Verdict:** PASS WITH FINDINGS
- **Reviewer:** read-only `conductor-reviewer` subagent (`ses_de209b189ffetaEYCl7NHDAnsK`), findings validated by primary against `file:line`
- **Volume strategy:** large (50 files, ~2022 insertions) — per-phase diffs (P1 logic, P2 scene+wiring, P3 docs+tripwires) plus cross-phase integration (registry uniqueness, texture budget, hub grid, E2E split)

## Summary

Repeat Machine implements the full repeat-N author-then-watch loop with a green gate: pure `repeatMachineLogic` (ROUND_SPECS 2,2,3,3,4,4, exact-N `runProgram`, seeded determinism), a `ChoiceRoundScene`-pattern scene with visible wrong-count replay plus retry, 25th-game wiring (Thinking group, progress rows, E2E roster, four-engine journey), and docs at 25 games with history intact. No Critical or High findings. One Medium (25th wide-grid tile/shelf clipped in default All view — reachable via Thinking chip, so non-blocking) and four Lows (stale count comments, Arial labels instead of the shared `textStyle`, README tree counts).

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| lint | `pnpm check` | pass | primary gate 2026-11-28: 390 files, no fixes |
| typecheck | `pnpm typecheck` | pass | primary gate: `tsc --noEmit` + e2e tsconfig clean |
| test | `pnpm test -- --run` | pass | primary gate: 164 files / 3529 tests green (reviewer read test content) |
| coverage | `pnpm test:coverage` | pass | primary gate: 96.94 / 90.36 / 96.35 / 98.09 vs gates 90/85/88/95 |
| build+guards | `pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js` | pass | primary gate: bundle 189.3 kB ≤ 200; module-size warn-only (e2eBridgeTypes 451, RepeatMachineScene 470); textures 76.42/321.00/0.238 vs caps 80/322/0.5; PWA 16/0; docs 5/0 |

## Requirements

| ID | Task(s) | Evidence | Status |
| --- | --- | --- | --- |
| FR-1 | P1.T1 | logic + scene tests | covered |
| FR-2 | P1.T1, P2.T1 | logic tests, repeat-machine journey | covered |
| FR-3 | P1.T1, P2.T1 | scene tests, journey | covered |
| FR-4 | P1.T1, P2.T1 | logic + scene tests, journey | covered |
| FR-5 | P2.T1, P2.T2 | scene tests, journey | covered |
| FR-6 | P2.T2 | gameRegistry tests, launch-all | covered |
| FR-7 | P1.T2 | 25 seeded logic tests | covered |
| FR-8 | P3.T1 | validate-docs 5/0, PRD/TDD/changelog/README | covered |
| NFR-1 | P2.T2 | validate-textures, shellOwnership (deviation: 2 copied SVGs under unique keys, no new design/deps/schema/storage) | covered |
| NFR-2 | P1.T1, P1.T2 | seeded tests (seeds 1–40), no Math.random in logic | covered |
| NFR-3 | P2.T1 | scene tests, journey | covered |
| NFR-4 | P3.T1 | bundle/module-size/PWA green | covered |
| NFR-5 | P3.T1 | validate-docs 5/0 | covered |
| AC-1 | P1.T1, P2.T1 | logic tests, journey | covered |
| AC-2 | P1.T1, P2.T1 | logic tests, journey | covered |
| AC-3 | P1.T1, P2.T1 | logic + scene tests, journey | covered |
| AC-4 | P2.T1, P2.T2 | journey | covered |
| AC-5 | P2.T2, P2.T3 | launch-all, repeat-machine journey | covered |
| AC-6 | P1.T2, P2.T3 | logic + scene tests, journey | covered |
| AC-7 | P3.T1 | validate-docs, verification/phase-3.md | covered |

## Findings

### Medium

- **F1 — 25th tile/shelf clipped in default wide All view** — `src/game/hub/gridBuilder.ts:119-127` (GRID_ROWS=4 origin centers 4 rows; tile 24 lands row 4, shelf plaque off-canvas at 1024×768). Default All board contract is every tile+shelf on-canvas; game 25 is reachable via tap and Thinking chip and E2E passes, so non-blocking. Fix (needs product decision, crosses Phase 2 out-of-scope layout boundary): overflow rule (paged fallback/reflow) + bounds test. Requirement: FR-6. Test gap: grid-rect-inside-canvas unit test or All-view shelf-in-bounds E2E assertion. Disposition: issue + roadmap follow-up (Section Debt).

### Low

- **F2 — stale registry header count** — `src/game/gameRegistry.ts:37` reads "The 23 games in Hub order", table holds 25. Fix: "The 25 games in Hub order (PRD §2.2)". Requirement: FR-6. Disposition: fix in R1.
- **F3 — stale grid origin doc** — `src/game/hub/gridLayout.ts:66-67` says "rows 6/6/6/4", roster is 6/6/6/6 + 1. Fix: match hubGridConstants ("rows 6/6/6/6 + 1"). Requirement: FR-6. Disposition: fix in R1.
- **F4 — Arial labels bypass shared typeface** — `src/scenes/RepeatMachineScene.ts:165,182` use `fontFamily: "Arial, sans-serif"`; house standard is `textStyle()` (Baloo 2) per tech-stack §3. Fix: `textStyle({ fontSize: '30px'/'36px', color: '#2d3748' })`. Requirement: NFR-3. Disposition: fix in R1.
- **F5 — README tree snapshot stale** — `README.md:105-108` claims 23 lazy scenes / ChoiceRoundScene (13 games) / 73 files = 43 modules / 23 logic modules; truth is 25 / 15 / 74 = 44 / 24. Fix: update counts, append repeatMachineLogic. Requirement: FR-8. Disposition: fix in R1.

## Plan compliance

- Phases 1–3 each have Result/Checkpoint/Evidence; all tasks `[x]` implemented (verified against diffs).
- No dropped tasks. Diff stays within phases' Touches plus reported deviations (texture cap 320→322, copied tile/sticker keys under new names, E2E/grid/comment tripwire fixes, review-phase evidence files).
- No review-fix phase yet — appended as R1 for F2–F5.

## Out of scope

- Wide-grid overflow redesign (F1) — product/layout decision, filed as follow-up.
- Pre-existing module-size warnings (warn-only, exit 0).

## Debt

- F1 → issue + roadmap follow-up, pending user confirmation (no issue created yet; see handoff question).
- No accepted deferrals beyond F1; no overrides.

## History

| Round | Verdict | Findings | Fixed |
| --- | --- | --- | --- |
| 1 | PASS WITH FINDINGS | 1 Medium, 4 Low | — (R1 appended for F2–F5) |

## Doc sync

- `pending` at review time (F5 README counts are part of R1; full product truth was Phase 3).
