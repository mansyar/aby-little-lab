# Phase 3 Evidence — Tag and ship

- Track: 20261027-release-v1-22-0
- Phase: 3 — Tag and ship
- Date: 2026-10-27
- Branch: `master` (executed post-merge, directly on the merged HEAD per plan)
- Result: verified

## Result

Tag `v1.22.0` created on the merged `master` HEAD and pushed to origin with explicit user go-ahead; the tag-gated Coolify deploy fired. Notes flipped Status DRAFT → FINAL with the tag/deploy record. `validate-docs` 6/6 on the FINAL state.

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| git | `git tag -l v1.22.0` + `git ls-remote origin refs/tags/v1.22.0` (pre-check) | 0 | Tag absent locally and on origin — safe to cut |
| git | `git tag -a v1.22.0 -m "..."` + `git push origin v1.22.0` | 0 | Tag object `a2bffc6b` created and pushed |
| git | `git rev-parse 'v1.22.0^{commit}'` vs `git rev-parse HEAD` | 0 | Both `f624884d` — tag points at the merged `master` HEAD |
| docs | `node scripts/validate-docs.js` | 0 | 6/6 after the FINAL flip |

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| P3.T1 / AC-4 | Tag `v1.22.0` exists on origin pointing at the merged release state | `git ls-remote` → `a2bffc6b`; commit `f624884d` | done |
| P3.T2 / AC-2 | Notes Status FINAL with tag/deploy record | notes header lines 3–5 | done |

## Evidence paths

- `docs/release-notes-v1.22.0.md` (Status FINAL)
- Tag `v1.22.0` on origin

## Deviations

- Executed on `master` directly rather than the track branch (the branch was merged and deleted before the tag step, per plan). No other deviations.

## Notes

- Deploy itself is the tag-gated Coolify path (workflow manual exception on failure); no failure was observed at tag-push time. Device-matrix verification of the live build remains a future manual pass if wanted.
