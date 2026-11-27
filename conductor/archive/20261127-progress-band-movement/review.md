# Review: 20261127-progress-band-movement

- **Track:** Surface adaptive-band movement on the Progress Overview
- **Type:** feature
- **Branch:** `feat/20261127-progress-band-movement`
- **Base:** `07d5c108684519581e088abcc9437905d50607ae`
- **Reviewed head:** `97cbece7`
- **Range:** `07d5c108..97cbece7`
- **Date:** 2026-11-27
- **Verdict:** PASS

## Summary

The Progress Overview now surfaces the current easier/classic/harder spread for assessed adaptive games, with explicit mixed, all-classic, insufficient-data, and adaptive-off states. The implementation is deterministic, uses the viewed profile's progress, preserves per-game pages and existing game behavior, and avoids storage/schema/dependency/asset changes.

Strict review round 1 found three issues: non-adaptive games entered the aggregate, the long Overview note could escape a narrow card, and Phase 2 evidence had a trailing blank line. Round R1 fixed all three. Strict re-review passed with no remaining findings. The two-week longitudinal target remains explicitly unmeasured.

## Verification

| Layer | Command / evidence | Result | Notes |
| --- | --- | --- | --- |
| Lint | `pnpm check` | PASS | Biome checked 378 files; no fixes. |
| Typecheck | `pnpm typecheck` | PASS | Application and E2E TypeScript clean. |
| Unit / flow | `pnpm test -- --run` | PASS | 159 files / 3,454 tests passed. Reviewer's earlier concurrent timeout was superseded by the final isolated run. |
| Coverage | `pnpm test:coverage` | PASS | 97.12% statements / 91.05% branches / 96.4% functions / 98.25% lines, above configured gates. |
| Build | `pnpm build` | PASS | 493 modules; only the pre-existing Phaser chunk advisory. |
| Bundle | `node scripts/validate-bundle.js` | PASS | Shell `index-ljU3tdMP.js` = 196.3 kB, within budget. |
| Module size | `node scripts/validate-module-size.js` | PASS | Primary final gate: 174 TypeScript files, zero warnings; `ProgressOverlay.ts` is 399 lines. Reviewer execution was permission-denied, so primary evidence is authoritative. |
| Textures | `node scripts/validate-textures.js` | PASS | Primary final gate: all texture checks passed. Reviewer execution was permission-denied, so primary evidence is authoritative. |
| PWA | `node scripts/validate-pwa.js` | PASS | 16 passed / 0 failed. |
| Docs | `node scripts/validate-docs.js` | PASS | Independently reproduced by reviewer: 5 passed / 0 failed. |
| Full configured gate | Exact ten-command chain from `conductor/workflow.md` | PASS | Final primary run exited 0 after R1 repairs; figures above are from that run. |
| Whitespace / scope | `git diff --check 07d5c108..97cbece7`, phase and full diff inspection | PASS | Current/full review ranges are clean. Only frozen `baeec96c..40db0123` retains its historical EOF blank line; see Deviations. |
| Visual | `.conductor/media/20261127-progress-band-movement/progress-band-overview.png` | PASS | 844x390 mobile-touch capture: full mixed line and all Overview statements/page controls readable, no overlap or clipping. Media is ignored and uncommitted. |

## Requirements

| ID | Status | Evidence |
| --- | --- | --- |
| FR-1 | Covered | `adaptiveSummary.ts` counts only the 22 adaptive games with at least `MIN_SAMPLE` recent taps and classifies via `bandShiftFor`; helper tests cover the upper boundary and non-adaptive exclusions. |
| FR-2 | Covered | Helper tests cover mixed, all-classic, sparse, and disabled states and their exact child-facing copy. |
| FR-3 | Covered | `ProgressOverlay` reads the viewed profile's progress; tests verify profile switching updates the readout. |
| FR-4 | Covered | Adaptive-off returns disabled without requiring sufficient windows; helper and component tests cover it. |
| FR-5 | Covered | Overview-only replacement note uses the existing wrap width and center alignment; per-game static note remains unchanged. |
| FR-6 | Covered | Existing Overview statements, activity strip, paging, per-game rows, scoring, and completion behavior remain intact. |
| FR-7 | Covered | Seeded tests cover malformed/short windows, deterministic normalization, no mutation, and malformed adaptive value fallback. |
| FR-8 | Covered | PRD, TDD, and current changelog describe current spread and explicitly do not claim the two-week longitudinal target was measured. |
| FR-9 | Covered | README, TDD, and perf baseline state the final 3,454-test/current-build truth; docs validator passes 5/0. |
| NFR-1 | Covered | Final diff adds no storage, schema, migration, dependency, asset, network, or PII change. |
| NFR-2 | Covered | Summary helper is pure and deterministic; tests repeat identical inputs and prove no mutation. |
| NFR-3 | Covered | Existing round counts, scoring, completion, adaptive-band logic, and per-game behavior remain unchanged. |
| NFR-4 | Covered | Summary logic is a separate pure module; scene/adaptive logic is not duplicated or moved. |
| NFR-5 | Covered | Phase, integrated, and R1 evidence record the exact configured gate; final run and docs validation are green. |
| AC-1 | Covered | Mixed spread counts/copy and adaptive-game-only assessment are tested. |
| AC-2 | Covered | All-classic state is tested. |
| AC-3 | Covered | Six recent taps remain below the floor; sparse state is tested, including non-adaptive-only progress. |
| AC-4 | Covered | Adaptive-off disabled state is tested at helper and component levels. |
| AC-5 | Covered | Viewed-profile switching updates the summary from that profile's data. |
| AC-6 | Covered | Overview-only replacement, preserved statements/pages, and narrow-card wrap are tested and visually verified. |
| AC-7 | Covered | Malformed/short windows, deterministic normalization, and no mutation are tested. |
| AC-8 | Covered | Final exact gate passes with 3,454 tests and all configured guards. |
| AC-9 | Covered | Living docs and roadmap distinguish current spread from the unmeasured longitudinal target; docs validator passes. |

## Findings

### Round 1 — resolved in R1

| ID | Severity | File | Finding | Resolution |
| --- | --- | --- | --- | --- |
| F1 | High | `src/game/adaptiveSummary.ts` | Aggregate included `robot-path` and `fix-it-machine`, although they do not use adaptive bands. | Exclude both non-adaptive games locally; tests pin the 22-game boundary and sparse/non-adaptive regressions. PRD/TDD/changelog now say adaptive games only. |
| F2 | Medium | `src/components/settings/ProgressOverlay.ts` | Long Overview replacement line lacked wrapping and could escape a narrow card. | Apply `OVERVIEW_TEXT_WIDTH` and center alignment only to the Overview note; add style regression and clean 844x390 visual evidence. |
| F3 | Low | `verification/phase-2.md` | Trailing blank line at EOF. | Trim the current file; current and full review ranges pass `git diff --check`. Frozen checkpoint history remains untouched. |

### Round 2 — final re-review

No Critical, High, Medium, or Low findings remain. F1, F2, and F3 are resolved.

## Overrides

None.

## Plan compliance

All three phases are verified with Result, Checkpoint, and Evidence:

1. `Implement and prove the current spread` — `df98e324`
2. `Product documentation truth sync` — `40db0123`
3. `Review Fixes` — `72f95f55`

All 12 top-level tasks are complete. The R1 delta stays within its declared Touches plus primary acceptance state. The final review range is clean. The track remains within the approved current-spread scope and does not implement persisted longitudinal movement.

## Deviations and risks

- **Approved Phase 1 test deviation:** `src/__tests__/components/SettingsPanel.test.ts` minimally updates one legacy assertion from the removed static Overview note to the new current-band line. No production code changed there.
- **Immutable-history whitespace deviation:** frozen range `baeec96c..40db0123` still contains the old Phase 2 EOF blank line. R1 fixes the current file; full/current review ranges pass. No history rewrite was performed.
- **No longitudinal evidence claim:** the current spread does not measure transitions or the two-week 60% target.
- **Reviewer permission needs:** module-size, texture, and one focused-test rerun were denied to the reviewer. The primary final gate independently ran module-size and texture checks, and the final full suite superseded the focused rerun.

## Out of scope

No new game, persisted band history, storage/schema migration, dependency/asset change, network behavior, child-facing copy, or change to per-game difficulty pages was reviewed or added. Archived tracks and historical release notes remain unchanged.

## Debt

None. Strict mode required all findings to be fixed.

## Doc sync

Completed before review: README/TDD/perf-baseline build and test truth, PRD/TDD/changelog product truth, and roadmap section 10.3 were synchronized. R1 updated the adaptive-game wording and final figures. `node scripts/validate-docs.js` passes 5/0.

## History

| Round | Verdict | Findings | Fixed | Accepted debt |
| --- | --- | --- | --- | --- |
| 1 | BLOCK | 3 | 0 | 0 |
| 2 | PASS | 0 | 3 | 0 |
