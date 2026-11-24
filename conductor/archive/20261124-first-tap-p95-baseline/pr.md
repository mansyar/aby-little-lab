## Summary

Adds nearest-rank p95 reporting and repeated cold-tap sampling to the existing first-tap harness, then publishes the passing headed five-game baseline and a per-release refresh procedure. The previously merged Word Match preload fix remains the reviewed stacked dependency; package/lockfiles and its production files are unchanged by this track.

## Track

- **ID:** `20261124-first-tap-p95-baseline`
- **Type:** `chore`
- **Spec:** [`conductor/archive/20261124-first-tap-p95-baseline/spec.md`](conductor/archive/20261124-first-tap-p95-baseline/spec.md)
- **Plan:** [`conductor/archive/20261124-first-tap-p95-baseline/plan.md`](conductor/archive/20261124-first-tap-p95-baseline/plan.md)
- **Review:** [`conductor/archive/20261124-first-tap-p95-baseline/review.md`](conductor/archive/20261124-first-tap-p95-baseline/review.md)

## What happened

| Phase | Goal | Result | Checkpoint | Notes |
| --- | --- | --- | --- | --- |
| 1: Pure p95 helper and measurement-script integration | Add pure nearest-rank p95, repeated sampling, text/JSON reporting and guards | verified | `eaea065a` | Initial headless idle-prewarm smoke failed; the documented `TAP_INERT_IDLE=1` cold control fixed measurement without weakening the budget gate |
| 2: Headed 10x5 measurement evidence | Run headed warm-aware measurement and commit raw evidence | verified | `8f9a7737` | Natural run was 1 cold / 49 warm; approved cold-control fallback produced 50 cold / 0 warm |
| 3: Baseline doc sync and integrated gate | Publish dated results and per-release procedure | verified | `e57de46b` | Preserved the Word Match section and pre-fix 507.4 ms failure history |
| R1: Review Fixes | Guard text/JSON report rendering and reconcile one-sample p95 spec | verified | `1313afb5` | Pure exported renderer; seven targeted guard tests; 400 ms gate unchanged |

## Requirements

- [x] `FR-1` — Pure nearest-rank p95 with text/JSON output; median, worst and 400 ms gate preserved.
- [x] `FR-2` — Headed `--samples 10` evidence across the five established targets; raw JSON committed.
- [x] `FR-3` — Dated baseline and per-release refresh procedure published in `docs/perf-baseline.md`.
- [x] `FR-4` — Full `verify_phase` at every phase and integrated verification recorded.
- [x] `FR-5` — No new dependency; changes limited to measurement scripts, guard tests, docs and the approved reviewed dependency.
- [x] `FR-6` — p95 is report-only; only worst-cold total over 400 ms fails the tap gate.
- [x] `FR-7` — Headed/preview failure blocks; no headless substitution.
- [x] `NFR-1` — Package and lockfile remain byte-identical.
- [x] `NFR-2` — Production `src/**` changes are limited to the exact reviewed Word Match dependency.
- [x] `NFR-3` — Coverage, build, bundle, module-size, texture, PWA and docs gates remain unchanged and green.
- [x] `NFR-4` — Non-watch Vitest; one full gate per phase plus R1.
- [x] `NFR-5` — Local preview only; no external service or credential.
- [x] `AC-1` — Seven guard tests cover arithmetic, single-sample behavior, and text/JSON report contracts.
- [x] `AC-2` — 50 cold samples, 10 per game, with aggregate and per-game p95.
- [x] `AC-3` — Headed natural run and approved cold-control fallback disclosed.
- [x] `AC-4` — Dated baseline fields published and docs validation is 5/5.
- [x] `AC-5` — Every per-game p95 is ≤400 ms; worst per-game p95 is 277.5 ms.
- [x] `AC-6` — No package or lockfile change.
- [x] `AC-7` — Only guard tests plus the approved reviewed Word Match production files changed in `src`.
- [x] `AC-8` — Integrated and R1 full gates exited 0.
- [x] `AC-9` — Living counts are 158 files / 3,395 tests and docs validation is 5/5.
- [x] `AC-10` — Tap exit logic remains exactly `worst.totalMs > taps.budgetMs`.

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| lint/format | `pnpm check`, `pnpm exec biome format .` | pass — 373 files, no fixes | `verification/phase-R1.md` |
| types | `pnpm typecheck` | pass — app + E2E | `verification/phase-R1.md` |
| unit | `pnpm test -- --run` | pass — 158 files / 3,395 tests | `verification/phase-R1.md` |
| coverage | `pnpm test:coverage` | pass — 97.08% statements / 90.92% branches / 96.35% functions / 98.23% lines | `verification/phase-R1.md` |
| build | `pnpm build` | pass — 491 modules, shell 197.99 kB / 50.39 kB gzip | `verification/phase-R1.md` |
| bundle | `node scripts/validate-bundle.js` | pass — 193.4 kB ≤200 kB | `verification/phase-R1.md` |
| modules | `node scripts/validate-module-size.js` | pass — 172 modules, zero warnings | `verification/phase-R1.md` |
| textures | `node scripts/validate-textures.js` | pass — 319 SVGs, all budgets | `verification/phase-R1.md` |
| PWA | `node scripts/validate-pwa.js` | pass — 16/16, 52 chunks | `verification/phase-R1.md` |
| docs | `node scripts/validate-docs.js` | pass — 5/5 | `verification/phase-R1.md` |
| full gate | configured `verify_phase` | pass — `R1_VERIFY_PHASE_EXIT=0` | `verification/integrated.md` |
| headed performance | `TAP_HEADED=1 TAP_INERT_IDLE=1 node scripts/measure-first-tap.mjs --with-preview --json --warm-aware --samples 10` | pass — exit 0, 50 cold / 0 warm | `verification/first-tap-headed.json` |

Aggregate cold p95: response 63.3 ms, finished 45.2 ms, total 270.1 ms. Per-game total p95: Shape Sorter 277.5 ms, Find the Letter 241.4 ms, Find the Word 249.6 ms, Add It Up 270.1 ms, Memory Match 223.5 ms. Worst cold sample: Shape Sorter 277.5 ms.

## Media

No visual UI changed. The headed performance table and raw JSON are the visual evidence for this tooling-only track.

## Review

- **Verdict:** `PASS`
- **Rounds:** 2
- **Fixed:** 2 findings
- **Accepted/deferred:** 0

## Deviations and risks

- Initial headless preview smoke could time out when idle prewarm imported the tapped chunk first. The established `TAP_INERT_IDLE=1` cold control is used and disclosed; the 400 ms gate is unchanged.
- The first natural headed run produced only 1 cold sample, so the approved cold-control fallback was used for the 50-cold evidence.
- One review-time coverage attempt hit transient elapsed-minute assertions; the affected file passed 19/19 in isolation and the full coverage retry passed. R1 coverage later passed without retry.
- The reviewed Word Match dependency from PR #97 is included in the stacked branch and remains unchanged since its approval.

## Follow-ups

None.

## Rollback

```bash
# Merge commit
git revert --no-edit -m 1 <merge-commit>
```

No schema migration, feature flag or data rollback is required.
