# Review: Replay Novelty

- **Track:** `20261124-replay-novelty`
- **Type:** feature
- **Branch:** `feat/20261124-replay-novelty`
- **Range:** `57389e8f..67598548`
- **Date:** `2026-11-24T02:45:00+11:00`
- **Verdict:** `PASS`

## Summary

All four planned phases plus one review-fix phase implement the frozen requirements with a green
final gate. Round 1 (BLOCK) raised three findings — a renumbered AC row in the integrated evidence,
a suggestion ring that went stale after an in-visit page flip or group filter, and docs that
overstated the sticker spotlight. All three were fixed in Phase R1 (`e2a9bf26`). Round 2 confirmed
every requirement is covered and no new defects were introduced; the one remaining Low finding
(a metadata/plan task-count drift) was corrected in the final state. Verdict PASS.

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| lint | `pnpm check` | pass | Biome clean, 367 files |
| typecheck | `pnpm typecheck` | pass | src + e2e clean |
| unit | `pnpm test -- --run` | pass | 155 files / 3,362 tests |
| coverage | `pnpm test:coverage` | pass | 97.09 / 90.82 / 96.32 / 98.26 vs gates 95/88/85/90 |
| build | `pnpm build` | pass | 489 modules; shell 197.43 kB Vite / 192.8 kB validator |
| bundle | `node scripts/validate-bundle.js` | pass | shell ≤ 200 kB |
| module-size | `node scripts/validate-module-size.js` | pass | 169 files, zero warnings; HubScene.ts 399 lines |
| textures | `node scripts/validate-textures.js` | pass | 319 SVGs, ratio 0.238 |
| pwa | `node scripts/validate-pwa.js` | pass | 16/16 |
| docs | `node scripts/validate-docs.js` | pass | reviewer re-run 5/5 |
| targeted | `vitest hubScene.test.ts hubEngagement.test.ts` | pass | primary re-run 2 files / 127 tests, exit 0 |

## Requirements

| ID | Implemented by | Verified by | Status |
| --- | --- | --- | --- |
| FR-1 | P1.T1, P2 | replayVariety.test.ts, hubScene.test.ts | covered |
| FR-2 | P1.T2, P2.T2 | replayVariety.test.ts, hubEngagement.test.ts | covered |
| FR-3 | P1.T2.1 | replayVariety.test.ts ordering suite | covered |
| FR-4 | P2.T1, R1.T2 | hubScene.test.ts ring + page-flip clear | covered |
| FR-5 | P2.T2 | hubAttract.test.ts, hubEngagement.test.ts | covered |
| FR-6 | P3.T1, P3.T2 | hubGrid.test.ts, hubScene.test.ts spotlight cases | covered |
| FR-7 | P2.T3, P3 | hubScene.test.ts profile-switch case | covered |
| FR-8 | P1.T3 | replayVariety.test.ts 1,200-visit simulation | covered |
| FR-9 | P4.T1, R1.T3 | README.md:156, PRD.md:106, validate-docs 5/5 | covered |
| FR-10 | P4.T2 | phase/integrated verification tables | covered |
| NFR-1 | P1, P2, R1.T2 | validate-module-size 169 zero warnings | covered |
| NFR-2 | P3, P4, R1.T1 | diff scope, integrated.md NFR-2 row | covered |
| NFR-3 | P2.T2, P3.T2 | reduced-motion/no-tween tests | covered |
| NFR-4 | workflow, R1 | conventional commits, evidence files | covered |
| AC-1 | P1.T1 | replayVariety.test.ts | covered |
| AC-2 | P1.T2, P2.T2 | replayVariety.test.ts no-repeat suite | covered |
| AC-3 | P1.T2.1, R1.T1 | replayVariety.test.ts ordering, integrated.md:51 | covered |
| AC-4 | P2.T1, R1.T2 | hubScene.test.ts ring + page-flip clear | covered |
| AC-5 | P2.T2 | hubAttract.test.ts, hubScene.test.ts | covered |
| AC-6 | P3.T1, P3.T2 | hubGrid.test.ts, hubScene.test.ts | covered |
| AC-7 | P2.T3, P3 | hubScene.test.ts profile-switch case | covered |
| AC-8 | P1.T3, R1.T1 | replayVariety.test.ts simulation, integrated.md:56 | covered |
| AC-9 | P4.T1, R1.T3 | validate-docs 5/5 | covered |
| AC-10 | P4.T2, R1 | integrated.md / phase-R1.md full-gate tables | covered |

## Findings

### Critical

- <none>

### High

- <none>

### Medium

- **F1 — Integrated evidence renumbered AC-3/AC-8 — RESOLVED in Phase R1 (`e2a9bf26`).** Round 2 confirmed AC-3 = three-level ordering, AC-8 = seeded 1,200-visit simulation, and the no-new-art claim moved to NFR-2; no checkpoint numbers changed.
- **F2 — Suggestion ring stale after board change — RESOLVED in Phase R1 (`e2a9bf26`).** Round 2 confirmed `refreshCue()` (clear-only) wired into `HubScene.grid.onBoardChange`, a page-flip assertion proving ring defined→undefined, and HubScene.ts at 399 lines.

### Low

- **F3 — Docs overstated the spotlight — RESOLVED in Phase R1 (`e2a9bf26`).** Round 2 confirmed README.md:156 and PRD.md:106 now limit no-repeat/reset claims to cue and wiggle; spotlight described as advancing per visit with wrap-around, per-profile cursor, empty-slot fallback; PRD §4.4 untouched.
- **F4 — Metadata task-count drift — RESOLVED in final state.** The scaffold's `tasks_total` was 9 while the plan has 10 Phase 1–4 top-level tasks; Phase R1 propagated 12 instead of 13. Corrected metadata to 13/13 (10 plan + 3 R1) and review history to 10/10 pre-R1. No behaviour impact.

## Overrides

- <none>

## Plan compliance

All four planned phases are verified with per-phase evidence and checkpoints; 10/10 planned tasks are
`[x]`. Phase R1 resolved all three round-1 findings; its 3 tasks are `[x]`. Metadata now reports
13/13 top-level tasks consistently with `plan.md`. No task was marked complete without verification.

## Out of scope

- Pre-existing "23 games"/"23-tile board" prose staleness elsewhere in README/PRD is unrelated to this track and was not touched.
- Reworking the selector or visit-state design: F2 was a refresh fix, not a policy change.

## Debt

- <none>

## Doc sync

`none` — all behaviour-bearing documentation changes (README.md:156, PRD.md:106, integrated.md)
were committed in Phase R1. Round 2 changed only Conductor review state (this file, metadata.json);
no product, design, or count-bearing doc changed after the review, so no further doc sync is required.

## History

| Round | Verdict | Critical | High | Medium | Low | Fixed |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | BLOCK | 0 | 0 | 2 | 1 | 0 |
| 2 | PASS | 0 | 0 | 0 | 0 | 3 (F1–F3 in Phase R1; F4 count drift corrected in state) |
