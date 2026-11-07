# Review — Toolchain Pinning

- Track: `20261107-toolchain-pinning`
- Range: `b8d43ffee1e25716cc656450002ece7d9f4e230d..bcf8a77e`
- Reviewer: `conductor-reviewer` (read-only subagent)
- Rounds: 1
- Verdict: **PASS WITH FINDINGS** (round 1 returned CHANGES REQUIRED; every finding closed in `verification/review-fixes.md`)

## Findings and disposition

| ID | Severity | Finding | Disposition |
| --- | --- | --- | --- |
| F1 | high | AC-11 claimed a PR-level documentation-only proof that the classifier cannot produce (it diffs the whole PR, and this PR's diff is code) | Fixed — AC-11 reworded and recorded `partial` |
| F2 | medium | The guard inspected only the first `pnpm/action-setup` step, so the `e2e` job's copy could pin a literal | Fixed — both steps required, both checked |
| F3 | medium | The engines assertion was a substring test: `">=22.0.0 <24"` passed while excluding Node 24 | Fixed — comparator that must be satisfied; unreadable operators fail |
| F4 | medium | `conductor/workflow.md` still stated "Node 22 and pnpm 11.7.0" as a living rule | Fixed — names the declaring files, no driftable literal |
| F5 | medium | No browser run on Node 24, so NFR-5 and half of AC-9 had no evidence | Fixed — 16 journeys green in 3.9 min |
| F6 | low | `docs/TDD.md` had restated a historical measurement with today's suite size | Fixed — the historical clause states no count |
| F7 | low | A stray `-->` in the plan rendered as text | Fixed |
| F8 | low | The spec's accepted limit described a check the guard does not perform | Fixed — limit corrected to what is implemented |
| F9 | low | The duplicated classifier had nothing comparing its two copies | Fixed — bodies must be identical |

## What the review confirmed

- Single-sourced declaration, consumed by the Dockerfile, both CI jobs and the README.
- `pnpm-workspace.yaml` and `serve` gone; every other dependency kept its resolved version.
- `.dockerignore`'s `.conductor` exclusion correct and load-bearing; `dist` is built inside the stage.
- No fresh-clone or Coolify risk from the lockfile's new `packageManagerDependencies` document.
- No application behaviour changed: no `src/` production file in the diff, and the rebuilt shell chunk hash is unchanged at 153.6 kB.

## Overrides

None. No finding was waived.

## Deferred

Nothing. AC-11 is recorded `partial` because the evidence is a future documentation-only PR, not because the work is deferred.

## Post-review sync

`review.md` and `verification/review-fixes.md` added; `metadata.review_verdict` set to `pass_with_findings`, `review_rounds` 1, `doc_sync` `synced`. The guarded-tree gate was re-run after the fixes: 294 lint files, both `tsc` programs, 134 files / 2,920 tests, coverage 97.21 / 91.14 / 96.18 / 98.21, 59 precache entries, shell 153.6 kB, `validate-pwa` 16, `validate-docs` 5, `pnpm test:e2e` 16 passing, `docker build` exit 0.
