# Review: 20261124-first-tap-p95-baseline

- **Date:** 2026-11-25T00:15:29+11:00
- **Reviewer:** conductor-reviewer (read-only)
- **Round:** 1
- **Verdict:** PASS WITH FINDINGS
- **Range:** `04f1463113a546f9524a125b2c974af59ebcc6d8..03f893ca`
- **Branch:** `chore/20261124-first-tap-p95-baseline`

## Summary

The nearest-rank p95 helper, repeated fresh-context sampling, headed cold-control
evidence, baseline publication and per-release procedure are correct. The
reviewed Word Match dependency is unchanged since PR #97. Package/lockfiles are
unchanged, all required checks pass, and the resumed 50-cold run meets every
400 ms gate.

Strict review requires two fixes before the PR: guard the human-readable report
contract, and reconcile the one-sample p95 edge case in the spec with the
approved plan and implemented/tested behavior.

## Verification

| Check | Result |
| --- | --- |
| `pnpm check` | Pass — 373 files, no fixes |
| `pnpm exec biome lint .` | Pass — 373 files |
| `pnpm exec biome format .` | Pass — 373 files, non-mutating |
| `pnpm typecheck` | Pass — app + E2E |
| `pnpm test -- --run` | Pass — 158 files / 3,393 tests |
| `pnpm test:coverage` | Pass on configured retry — 97.10% statements / 90.96% branches / 96.35% functions / 98.23% lines |
| `pnpm build` | Pass — Vite 8.3.8, 491 modules, shell 197.99 kB / 50.39 kB gzip |
| `node scripts/validate-bundle.js` | Pass — 193.4 kB ≤200 kB |
| `node scripts/validate-module-size.js` | Pass — 172 modules, zero warnings |
| `node scripts/validate-textures.js` | Pass — 319 SVGs, all budgets pass |
| `node scripts/validate-pwa.js` | Pass — 16/16, 52 chunks |
| `node scripts/validate-docs.js` | Pass — 5/5 |
| `git diff --exit-code <base>..HEAD -- package.json pnpm-lock.yaml` | Pass — no changes |
| `git merge-base --is-ancestor 025b037f HEAD` | Pass — exit 0 |
| Headed cold-control run | Pass — exit 0, 50 cold / 0 warm, every worst ≤400 ms |

Coverage retry: the first review-time coverage run failed three
`hubPlayTime.test.ts` elapsed-minute assertions while the immediately preceding
full suite passed all 3,393 tests. The failing file passed 19/19 in isolation and
the complete coverage gate passed on retry. No test or source change was made.
The diff does not touch that file or its timing logic.

## Requirements

| Requirement | Status | Evidence |
| --- | --- | --- |
| FR-1 | Covered | `firstTapStats.mjs`, `.d.mts`, guard tests, script JSON/text p95 output |
| FR-2 | Covered | `verification/first-tap-headed.json`, Phase 2 evidence |
| FR-3 | Covered | `docs/perf-baseline.md` dated section and per-release procedure |
| FR-4 | Covered | Phase 1–3 evidence and `verification/integrated.md` |
| FR-5 | Covered | Manifest diff empty; only helper/report/script/guard and reviewed dependency |
| FR-6 | Covered | `worst.totalMs > 400` remains the only tap gate; p95 report-only |
| FR-7 | Covered | Headed natural and cold-control evidence; no headless substitution |
| NFR-1 | Covered | No dependency change; Node/Playwright/preview only |
| NFR-2 | Covered | Production src limited to the exact reviewed Word Match dependency |
| NFR-3 | Covered | Coverage, build, bundle, module-size, textures, PWA and docs gates pass |
| NFR-4 | Covered | Non-watch Vitest; one full gate per phase |
| NFR-5 | Covered | Local preview only; no network service or credential |
| AC-1 | Partial | Helper tests cover arithmetic, but the text report contract is not guarded (F1) |
| AC-2 | Covered | 50 cold samples, five games, per-game p95, raw JSON, exit 0 |
| AC-3 | Covered | Headed evidence and cold-control fallback disclosed |
| AC-4 | Covered | Dated baseline fields and docs 5/5 |
| AC-5 | Covered | Worst per-game p95 277.5 ms |
| AC-6 | Covered | Package/lock diff empty |
| AC-7 | Covered | Guard test plus exact reviewed production dependency only |
| AC-8 | Covered | Integrated full gate exit 0 |
| AC-9 | Covered | Living counts 158 / 3,393; docs 5/5 |
| AC-10 | Covered | Exit logic remains only `worst.totalMs > 400` |

## Findings

### Medium

#### F1 — Human-readable report contract is unguarded

- **File:** `scripts/measure-first-tap.mjs:779`
- **What:** The new text report has no behavioral test. The committed preview smoke
  uses `--json`; existing tests cover only percentile arithmetic. A future
  formatting regression could remove or mislabel p95, median, worst or the budget
  while all gates stay green.
- **Why:** AC-1 requires p95 in both text and JSON while median, worst and budget
  remain present.
- **Fix:** Extract report rendering into a pure exported function and add a Vitest
  guard covering aggregate/per-game p95 and preserved median/worst/budget in both
  text and JSON.

### Low

#### F2 — One-sample p95 spec contradicts the approved plan

- **File:** `conductor/tracks/20261124-first-tap-p95-baseline/spec.md:114`
- **What:** The edge case says fewer than two samples yields `null`/absent p95, but
  plan P1.T1.1 requires `null` only for empty input, P1.T2.1 requires a single-value
  case, and the implemented/tested helper returns that sole value.
- **Why:** The source of truth contradicts itself on a defined edge case.
- **Fix:** Reconcile the spec to the approved plan and behavior: empty input is
  `null`; a one-sample set returns that value.

## Overrides

None. `review.strict` is true; both findings must be fixed before the PR.

## Plan compliance

All three implementation phases are verified with checkpoints `eaea065a`,
`8f9a7737` and `e57de46b`; all 28 planned task/sub-task IDs are complete. The
reviewed Word Match production files are unchanged since `025b037f`. The only
compliance gaps are F1 and F2 above.

## Out of scope

No additional app/game/save/schema/child-facing change is proposed. The reviewed
Word Match dependency is not reworked.

## Debt

None beyond F1/F2.

## Doc sync

Updated. `docs/perf-baseline.md` carries the resumed live figures, raw-evidence
link, pre-fix history and per-release procedure. `validate-docs.js` passes 5/5.

## History

| Round | Verdict | Critical | High | Medium | Low | Fixed |
| ---: | --- | ---: | ---: | ---: | ---: | ---: |
| 1 | PASS WITH FINDINGS | 0 | 0 | 1 | 1 | 0 |
