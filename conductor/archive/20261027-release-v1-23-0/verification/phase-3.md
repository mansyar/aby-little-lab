# Phase 3 Evidence — Tag and ship

- **Track:** 20261027-release-v1-23-0 — Release v1.23.0 — Ship Content Expansion
- **Phase:** 3 — Tag and ship
- **Date:** 2026-10-27
- **Branch:** `master` (post-merge; tag + FINAL flip land on `master` directly per plan)
- **Merge:** `45190721` (PR #76)
- **Tag:** `v1.23.0` → `45190721`
- **Result:** verified

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| git | `git tag v1.23.0 45190721` + `git push origin v1.23.0` | 0 | tag created on the merge commit and pushed (user-authorized; tag push fires the production deploy) |
| git | `git ls-remote origin refs/tags/v1.23.0` | 0 | `45190721`…`43ca8e845` — tag resolves to the `master` merge HEAD |
| ci | tag push CI run 40435767433 (`gh run watch`) | 0 | Quality Gates green in 2m1s (lint, format, typecheck, tests, build, bundle, PWA, docs, boot-time validation); Deploy to Coolify webhook fired in 6s |
| documents | notes Status flip DRAFT → FINAL | — | header records tag SHA, push date, tag CI run, and deploy record |

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| AC-2 (FINAL) | Notes Status reads FINAL after deploy | header Status FINAL with tag/deploy record | pass |
| AC-4 | Tag `v1.23.0` on origin at merged state | ls-remote resolves to `45190721` | pass |
| FR-5 | Tag pushed after merge, deploy fired | push exit 0; Deploy to Coolify job completed (webhook fired) | pass |

## Notes

- Pre-tag precondition confirmed: `git ls-remote origin refs/tags/v1.23.0` was empty before tagging (review evidence); the tag was cut exactly on the merged `master` HEAD, never moved.
- CI annotation (ubuntu-latest → Ubuntu 26 migration notice, Oct 2026) is informational; all jobs green.
- Device matrix remains SKIPPED per the accepted-gap scope decision (spec AC-5).
