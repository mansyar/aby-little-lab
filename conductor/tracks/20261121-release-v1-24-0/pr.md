## Summary

This PR prepares the v1.24.0 release: it bumps the version to `1.24.0`, adds DRAFT release notes covering all 14 PRs merged since `v1.23.0` (#77–#90) in exact merge order, and links the notes from the README. The shipping diff is three files and changes no runtime behavior. The full gate and an independent review pass; merge, tagging, and the Coolify deploy remain explicit human gates.

## Track

- **ID:** `20261121-release-v1-24-0`
- **Type:** `chore`
- **Spec:** [`conductor/archive/20261121-release-v1-24-0/spec.md`](conductor/archive/20261121-release-v1-24-0/spec.md)
- **Plan:** [`conductor/archive/20261121-release-v1-24-0/plan.md`](conductor/archive/20261121-release-v1-24-0/plan.md)
- **Review:** [`conductor/archive/20261121-release-v1-24-0/review.md`](conductor/archive/20261121-release-v1-24-0/review.md)

## What happened

| Phase | Goal | Result | Checkpoint | Notes |
| --- | --- | --- | --- | --- |
| 1: Version bump and release notes | Repo reads `1.24.0` with dated notes covering #77–#90, README-linked, validator green | verified | `692545c7` | Version, notes, README links; no lockfile or runtime change |
| 2: Gate, review and merge | Release state proven green and reviewed, then merged with green CI | in progress | `eecae159` | Full gate green, review PASS, PR open; merge awaits explicit go-ahead |
| 3: Tag and ship | Tag `v1.24.0` on merged master HEAD, push to fire deploy, flip notes to FINAL | pending | — | Human-gated; tagging is the deploy trigger |

## Requirements

- [x] `FR-1` — `package.json` reads `1.24.0` (evidence: `package.json`)
- [x] `FR-2` — release notes cover PRs #77–#90 in merge order in the v1.23.0 format (evidence: `docs/release-notes-v1.24.0.md`)
- [x] `FR-3` — README Documentation index link and Releases row (evidence: `README.md`)
- [x] `FR-4` — full `verify_phase` green on the release commit (evidence: `verification/integrated.md`)
- [ ] `FR-5` — reviewed PR merged to `master` with green CI (merge pending explicit go-ahead)
- [ ] `FR-6` — tag `v1.24.0` on merged master HEAD, pushed after go-ahead (Phase 3)
- [ ] `FR-7` — release-notes status flipped DRAFT → FINAL after tag/deploy (Phase 3)
- [x] `NFR-1` — no runtime change; only version metadata, notes, README links, Conductor state
- [x] `NFR-2` — v1.23.0 notes structure, parent-facing lede, no roadmap/Known Issues duplication
- [x] `NFR-3` — conventional commits; tag/deploy path untouched; no force-push, tag move, or silent retry
- [x] `NFR-4` — `node scripts/validate-docs.js` green
- [x] `AC-1` — version `1.24.0`
- [x] `AC-2` — notes exist, README-linked, table-listed, validator green, Status DRAFT pre-tag
- [x] `AC-3` — all eight `verify_phase` commands green
- [ ] `AC-4` — review PASS + CI green + merged with `merge` method (merge pending)
- [ ] `AC-5` — tag on origin at merged master HEAD + notes FINAL (Phase 3)
- [x] `AC-6` — skipped real-device pass recorded as accepted gap
- [x] `AC-7` — notes include 23rd/24th games, looks-not-scores, and #90 CC0 BGM + MIT/legal posture

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| lint | `pnpm check` | pass | `conductor/archive/20261121-release-v1-24-0/verification/integrated.md` |
| typecheck | `pnpm typecheck` | pass | `conductor/archive/20261121-release-v1-24-0/verification/integrated.md` |
| unit | `pnpm test -- --run` | pass | 153 files / 3,323 tests |
| coverage | `pnpm test:coverage` | pass | 97.11% stmts / 90.9% branches / 96.21% funcs / 98.31% lines |
| build | `pnpm build` | pass | 411 modules; shell entry 191.16 kB |
| bundle artifact | `node scripts/validate-bundle.js` | pass | shell 186.7 kB ≤ 200 kB |
| PWA artifact | `node scripts/validate-pwa.js` | pass | 16/16, BGM precached |
| docs | `node scripts/validate-docs.js` | pass | 5/5 |

## Review

- **Verdict:** `PASS`
- **Rounds:** 1
- **Fixed:** 0 findings
- **Accepted/deferred:** 0 (see `review.md`)

## Deviations and risks

- Three timing-sensitive test failures occurred on this host while establishing the gate (Hub engagement/art-prewarm and `moreLessLogic` under coverage). All cleared on retry with no source change; recorded in `verification/integrated.md`.
- The phase subagent was denied the optional `git tag -l v1.24.0` read (tag commands are human-only here); the no-tag fact came from the brief and remains confirmed.
- No product or design decision was made. The roadmap's approximate-version table was intentionally left unchanged under NFR-1.
- The real-device PWA pass is recorded as an accepted gap per release precedent.

## Follow-ups

- none

## Rollback

```bash
# Merge commit
git revert --no-edit -m 1 <merge-commit>

# Squash commit
git revert --no-edit <squash-commit>
```

No migration, feature flag, or data rollback is required. If the tag has already been pushed, do not move it; cut a new patch release instead.
