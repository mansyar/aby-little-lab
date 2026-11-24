# Review: 20261124-first-tap-p95-baseline

- **Date:** 2026-11-25T00:50:20+11:00
- **Reviewer:** conductor-reviewer (read-only)
- **Round:** 2
- **Verdict:** PASS
- **Range:** `04f1463113a546f9524a125b2c974af59ebcc6d8..0be53100`
- **Branch:** `chore/20261124-first-tap-p95-baseline`

## Summary

The nearest-rank p95 helper, repeated fresh-context sampling, headed cold-control
evidence, baseline publication and per-release procedure are correct. The pure
report renderer now has behavioral text/JSON guards, the one-sample spec edge case
matches the approved plan, and the reviewed Word Match dependency is unchanged
since PR #97. Package/lockfiles are unchanged, all required checks pass, and the
resumed 50-cold run meets every 400 ms gate. Both round-1 findings are resolved and
the R1 diff introduced no new finding.

## Verification

| Check | Result |
| --- | --- |
| `pnpm check` | Pass — 373 files, no fixes |
| `pnpm exec biome lint .` | Pass — 373 files |
| `pnpm exec biome format .` | Pass — 373 files, non-mutating |
| `pnpm typecheck` | Pass — app + E2E |
| `pnpm test -- --run` | Pass — 158 files / 3,395 tests |
| `pnpm test:coverage` | Pass — 97.08% statements / 90.92% branches / 96.35% functions / 98.23% lines |
| `pnpm build` | Pass — Vite 8.3.8, 491 modules, shell 197.99 kB / 50.39 kB gzip |
| `node scripts/validate-bundle.js` | Pass — 193.4 kB ≤200 kB |
| `node scripts/validate-module-size.js` | Pass — 172 modules, zero warnings |
| `node scripts/validate-textures.js` | Pass — 319 SVGs, all budgets pass |
| `node scripts/validate-pwa.js` | Pass — 16/16, 52 chunks |
| `node scripts/validate-docs.js` | Pass — 5/5 |
| Full configured `verify_phase` | Pass — `R1_VERIFY_PHASE_EXIT=0` |
| Report renderer smoke | Pass — `RENDERER_SMOKE_OK` |
| `git diff --exit-code <base>..HEAD -- package.json pnpm-lock.yaml` | Pass — no changes |
| `git diff --exit-code 025b037f..HEAD -- src/game/wordMatchArt.ts src/scenes/WordMatchScene.ts` | Pass — reviewed dependency unchanged |
| Headed cold-control run | Pass — exit 0, 50 cold / 0 warm, every worst ≤400 ms |

Coverage retry disclosure: the first review-time coverage run in round 1 failed
three `hubPlayTime.test.ts` elapsed-minute assertions while the immediately
preceding full suite passed all 3,393 tests. The failing file passed 19/19 in
isolation and the complete coverage gate passed on retry. No test or source change
was made, and that file is outside the diff. R1 later passed coverage without retry.

## Requirements

| Requirement | Status | Evidence |
| --- | --- | --- |
| FR-1 | Covered | `firstTapStats.mjs`, `firstTapReport.mjs`, declarations, seven guard tests, script JSON/text p95 |
| FR-2 | Covered | `verification/first-tap-headed.json`, Phase 2 evidence |
| FR-3 | Covered | `docs/perf-baseline.md` dated section and per-release procedure |
| FR-4 | Covered | Phase 1–3 and R1 evidence plus `verification/integrated.md` |
| FR-5 | Covered | Manifest diff empty; only helper/report/script/guard and reviewed dependency |
| FR-6 | Covered | `worst.totalMs > 400` remains the only tap gate; p95 report-only |
| FR-7 | Covered | Headed natural and cold-control evidence; no headless substitution |
| NFR-1 | Covered | No dependency change; Node/Playwright/preview only |
| NFR-2 | Covered | Production src limited to the exact reviewed Word Match dependency |
| NFR-3 | Covered | Coverage, build, bundle, module-size, textures, PWA and docs gates pass |
| NFR-4 | Covered | Non-watch Vitest; one full gate per phase and R1 |
| NFR-5 | Covered | Local preview only; no network service or credential |
| AC-1 | Covered | Arithmetic and text/JSON renderer-contract guards pass |
| AC-2 | Covered | 50 cold samples, five games, per-game p95, raw JSON, exit 0 |
| AC-3 | Covered | Headed evidence and cold-control fallback disclosed |
| AC-4 | Covered | Dated baseline fields and docs 5/5 |
| AC-5 | Covered | Worst per-game p95 277.5 ms |
| AC-6 | Covered | Package/lock diff empty |
| AC-7 | Covered | Guard test plus exact reviewed production dependency only |
| AC-8 | Covered | Integrated and R1 full gates exit 0 |
| AC-9 | Covered | Living counts 158 / 3,395; docs 5/5 |
| AC-10 | Covered | Exit logic remains only `worst.totalMs > 400` |

## Findings

### Medium

#### F1 — Human-readable report contract was unguarded — Resolved in R1

- **File:** `scripts/measure-first-tap.mjs:779`
- **What:** The text report initially had no behavioral test, so p95, median, worst
  or the budget could be removed or mislabeled while all gates stayed green.
- **Fix:** `renderFirstTapReport(taps, format)` is now a pure exported renderer with
  declarations; every normal/preview text/JSON path uses it; `printTapTable` was
  removed; and Vitest guards aggregate/per-game p95 plus median/worst/budget and
  the no-cold case. The exact `worst.totalMs > taps.budgetMs` gate is unchanged.
- **Resolution:** Closed in checkpoint `1313afb5`; seven targeted guards pass and
  R1's full configured gate passes.

### Low

#### F2 — One-sample p95 spec contradicted the approved plan — Resolved in R1

- **File:** `conductor/tracks/20261124-first-tap-p95-baseline/spec.md:114`
- **What:** The edge case initially said fewer than two samples yields `null`/absent
  p95, while the approved plan and tested nearest-rank helper return the sole value.
- **Fix:** The spec now states empty input is `null` and a one-sample set returns
  that value.
- **Resolution:** Closed in checkpoint `1313afb5`, matching plan and behavior.

## Overrides

None. `review.strict` is true; both findings were fixed before the PR.

## Plan compliance

All three implementation phases are verified with checkpoints `eaea065a`,
`8f9a7737` and `e57de46b`; all 28 planned task/sub-task IDs are complete. Review
round 1 added Phase R1, verified at checkpoint `1313afb5`, bringing the final total
to 4/4 phases and 31/31 tasks. The reviewed Word Match production files are
unchanged since `025b037f`. No package, lockfile or gate was weakened.

## Out of scope

No additional app/game/save/schema/child-facing change is proposed. The reviewed
Word Match dependency is not reworked.

## Debt

None.

## Doc sync

Updated. `docs/perf-baseline.md` carries the resumed live figures, raw-evidence
link, pre-fix history and per-release procedure. Living suite counts are 158 files /
3,395 tests, and `validate-docs.js` passes 5/5.

## History

| Round | Verdict | Critical | High | Medium | Low | Fixed |
| ---: | --- | ---: | ---: | ---: | ---: | ---: |
| 1 | PASS WITH FINDINGS | 0 | 0 | 1 | 1 | 0 |
| 2 | PASS | 0 | 0 | 0 | 0 | 2 |
