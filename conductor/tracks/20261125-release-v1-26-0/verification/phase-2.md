# Phase 2 — README and roadmap truth

- **Track:** `20261125-release-v1-26-0`
- **Phase:** 2
- **Date:** 2026-11-25
- **Branch:** `chore/20261125-release-v1-26-0`
- **Base:** `810ef16dc3fea75f628b455db6f2d38ea7a63684`
- **Head:** `3a28b75e`
- **Result:** `verified`

## Result Summary

The README release row and roadmap correction are complete. The phase subagent
committed the README row and blocker evidence, but its restricted shell denied
the authorized roadmap edit and the exact verification gate. The primary applied
the roadmap correction, ran the exact configured gate successfully, and rewrote
this report. No verification success is inferred from the subagent's attempts.

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| git | `git diff 810ef16d..HEAD -- README.md conductor/roadmap.md` | 0 | One README release-table insertion and one roadmap row replacement; no unrelated changes. |
| git | `git diff --check` | 0 | No whitespace errors. |
| documentation | primary `edit` of `conductor/roadmap.md` §10.7 | success | Subagent permission denial was repaired by the primary using the approved replacement. |
| git | `git commit -m "docs(release): mark headed first-tap baseline complete"` | 0 | Commit `3a28b75e`; only `conductor/roadmap.md` changed. |
| full gate | `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js` | 0 | Lint, typecheck, tests, coverage, build and all validators passed. |

## Acceptance Criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| AC-3 | README contains both the Documentation index link and the dated Releases row. | The Phase 1 index link remains; `README.md:211` now has the newest-first `v1.26.0` row dated 2026-11-25, PRs #94–#98 in merge order, release-note link and tag. | pass |
| AC-4 | Roadmap §10.7 records the headed first-tap baseline as complete and links to its evidence. | `conductor/roadmap.md:169` now says Done 2026-11-24, links `docs/perf-baseline.md`, preserves the 507.4 ms pre-fix failure and states that p95 is report-only and real-device coverage remains outstanding. | pass |

## Concrete Evidence

- Lint: 373 files checked, no fixes.
- Typecheck: application and E2E projects passed.
- Unit and coverage: 158 files / 3,395 tests passed; coverage 97.10% statements, 90.96% branches, 96.35% functions, 98.23% lines.
- Build: 491 modules; shell entry `index-0f9hfHo0.js` 197.99 kB raw / 50.40 kB gzip; validator shell 193.4 kB; 52 JavaScript chunks; 64 PWA precache entries.
- Guards: 172 TypeScript files with zero module-size warnings; 319 SVGs; texture budget and tier ratio passed; PWA 16/16; documentation 5/5.
- The roadmap values are sourced from the existing 2026-11-24 evidence and were not re-measured in this phase.

## Evidence Paths

- This report: `conductor/tracks/20261125-release-v1-26-0/verification/phase-2.md`
- README release table: `README.md` § Releases
- Baseline evidence: `docs/perf-baseline.md` § First-tap p95 baseline after the Word Match fix (2026-11-24)
- Phase brief: `.conductor/runs/20261125-release-v1-26-0/phase-2-brief.md`

## Deviations and Scope Confirmation

The subagent's restricted shell denied the required roadmap edit and gate; the
primary performed both under the documented verification fallback. The
subagent committed the initial blocker report as `4ff59085`; this report
supersedes it after successful primary verification. Implementation scope is
limited to the authorized README row, roadmap row and Conductor evidence. No
runtime source, tests, assets, dependencies, lockfiles, package metadata, tags,
deployment or other Conductor state files changed. No push, merge, rebase,
reset or branch switch occurred.

## Files Changed

- `README.md` — release-table row, commit `416e7913`.
- `conductor/roadmap.md` — completed-baseline correction, commit `3a28b75e`.
- `conductor/tracks/20261125-release-v1-26-0/verification/phase-2.md` — initial blocker report `4ff59085`, then this verified report.
