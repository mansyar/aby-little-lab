# Phase 2 — README and roadmap truth

- **Track:** `20261125-release-v1-26-0`
- **Phase:** 2
- **Date:** 2026-11-25
- **Branch:** `chore/20261125-release-v1-26-0`
- **Base:** `810ef16dc3fea75f628b455db6f2d38ea7a63684`
- **Head:** `416e7913` (README implementation commit; before this evidence commit)
- **Result:** `blocked`

## Result Summary

P2.T1 is complete and committed. The required `conductor/roadmap.md` edit was
denied by the restricted `edit` tool, so P2.T2 could not be applied. The exact
configured verification gate was not run because the release tree is not final.
No verification success is claimed.

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| git | `git status --short --branch` | 0 | Started clean on `chore/20261125-release-v1-26-0` at the recorded base. |
| git | `git log --merges --oneline --max-count=8 v1.25.0..b5c18c8a047aaee404920804be635f5a37ea3bd2` | 0 | Confirmed merge order #94, #95, #96, #97, #98. |
| git | `git diff --check` | 0 | No whitespace errors in the README change. |
| git | `git commit -m "docs(release): add v1.26.0 to README releases"` | 0 | Commit `416e7913`; exactly one README row inserted. |
| documentation | `edit` on `conductor/roadmap.md` §10.7 | denied | Tool returned `permission.rejected: Permission denied: edit`; no roadmap bytes changed. |
| full gate | `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js` | not run | Stopped at the required roadmap-edit blocker; no gate result exists for this phase. |

## Acceptance Criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| AC-3 | README contains both the Documentation index link and the dated Releases row. | The Phase 1 index link remains at `README.md:256`; `README.md:211` now has the newest-first `v1.26.0` row dated 2026-11-25, PRs #94–#98 in merge order, the release-note link and tag `v1.26.0`. | pass |
| AC-4 | Roadmap §10.7 records the headed first-tap baseline as complete and links to its evidence. | Required replacement was prepared but the protected-file edit was denied; `conductor/roadmap.md:169` remains unchanged. | blocked |

## Concrete Evidence

- README diff: one insertion, directly above v1.25.0; existing four-column
  format and newest-first order preserved; no duplicate Documentation index link.
- Existing baseline source, `docs/perf-baseline.md:7-56`: completed headed run on
  2026-11-24; 50 cold / 0 warm samples; aggregate cold p95 total 270.1 ms; worst
  cold total 277.5 ms; every worst cold total within the unchanged 400 ms gate.
  The earlier failed 507.4 ms Find the Word result remains recorded there.
- These baseline figures are cited from the existing evidence, not re-measured
  in this blocked phase. P95 remains report-only; real-device coverage is not
  claimed.

## Evidence Paths

- This report: `conductor/tracks/20261125-release-v1-26-0/verification/phase-2.md`
- README release table: `README.md` § Releases
- Baseline evidence: `docs/perf-baseline.md` § First-tap p95 baseline after the Word Match fix (2026-11-24)
- Phase brief: `.conductor/runs/20261125-release-v1-26-0/phase-2-brief.md`

## Blocker

The restricted `edit` tool denied this required change:

```text
edit(path="conductor/roadmap.md", oldString="| Perf baseline per release, first-tap p95 measured headed | per release | closes the 400ms KPI that the README admits is unproven |", newString="| Perf baseline per release, first-tap p95 measured headed — **Done 2026-11-24** (track `20261124-first-tap-p95-baseline`; [evidence](../docs/perf-baseline.md#first-tap-p95-baseline-after-the-word-match-fix-2026-11-24)) | per release | headed cold control passed the unchanged 400 ms worst-cold gate (50 cold / 0 warm samples, aggregate p95 total 270.1 ms, worst 277.5 ms); the pre-fix 507.4 ms Find the Word failure remains history. This does not prove every KPI: p95 is report-only and real-device coverage remains outstanding |")
```

Expected result: replace only the stale §10.7 row, preserving the table format,
historical failure and limits of the evidence. The primary must apply this change
or explicitly authorize a permitted path, then rerun Phase 2 verification.

## Deviations

None. No file outside the authorized implementation/evidence paths changed.

## Files Changed

- `README.md` — committed as `416e7913`.
- `conductor/tracks/20261125-release-v1-26-0/verification/phase-2.md` — this
  blocked-phase evidence file.

## Scope Confirmation

No runtime source, tests, assets, dependencies, lockfiles, package metadata,
tags or Conductor state files were edited. The roadmap remains unchanged because
the required edit was denied. No push, merge, rebase, reset, branch switch,
deployment, web access or subagent was used.
