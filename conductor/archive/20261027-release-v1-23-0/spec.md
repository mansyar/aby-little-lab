# Release v1.23.0 — Specification

> Requirements are stable. Once an `FR`, `NFR`, or `AC` ID is approved, do not
> renumber it. If a requirement is removed, mark it `Withdrawn` instead of
> deleting it.

## Overview

Ship the Content Expansion track (#75) merged since `v1.22.0` as **v1.23.0**
through the tag-gated deploy path: version bump, dated release notes in the
established format, PR merge, then tag + push with explicit user go-ahead. The
release itself changes no runtime behavior — it puts one kid-visible content
track (28-word pool, 15-story pool, 32-scenario pool, all additive) onto the
live app.

## Problem / Motivation

Kid-visible content sits merged but unreleased: the word pool (28), story pool
(15 with 12 new Storybook-Flat SVGs), and feelings scenario pool (32) reviewed
`PASS` with a green gate — but the live app (still `v1.22.0`, tagged 2026-10-27)
predates all of it. The version string, the release notes, and the deployed
build lag the repository by exactly one track. If unsolved, children keep the
smaller pools while the code already delivers the larger ones, and the release
record gains a gap one release after the notes habit was restored.

## Goals & Success Metrics

- **Goal:** `v1.23.0` tagged on `master`, pushed, deployed via the tag gate.
- **Metric:** Tag `v1.23.0` exists on origin; Coolify deployed on the tag push; live app reports the new version.
- **Goal:** Dated release notes in the established format, linked from the README index.
- **Metric:** `docs/release-notes-v1.23.0.md` exists, `validate-docs` 6/6, Status flipped FINAL after deploy.
- **Goal:** Zero product-behavior change from the release itself.
- **Metric:** Full 8-command gate green; release diff touches only version metadata, notes, and index links.

## Scope

### In Scope

- `package.json` bump `1.22.0` → `1.23.0`.
- `docs/release-notes-v1.23.0.md` in the v1.22.0 format (Status/Tag/Base header, parent-facing lede, one section per merged PR since `v1.22.0` in merge order, release verification section).
- README Documentation-index link to the new notes (required by `validate-docs`).
- Full `verify_phase` gate, PR, merge, then tag `v1.23.0` on `master` + push with explicit go-ahead.

### Out of Scope

- Any `src/` behavior change.
- Backfilling any other missing notes files.
- The manual on-device pass (skipped; recorded as an accepted gap in the notes).
- Coolify-side remediation if the tag-gated deploy fails (workflow manual exception).

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | `package.json` version reads `1.23.0` | must |
| FR-2 | `docs/release-notes-v1.23.0.md` covers all PRs since `v1.22.0` in the established format | must |
| FR-3 | The new notes file is linked from the README Documentation index | must |
| FR-4 | Full 8-command `verify_phase` gate is green on the release state | must |
| FR-5 | Tag `v1.23.0` on `master` is pushed to origin after merge, firing the tag-gated deploy | must |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | The release changes no runtime behavior: diff is version metadata, notes, and index links only |
| NFR-2 | Notes follow the v1.22.0 structure (Status/Tag/Base header, parent-facing lede, per-PR sections, verification section) |
| NFR-3 | Conventional commits; the tag-gated deploy path itself is untouched |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | `package.json` version is `1.23.0` | FR-1 |
| AC-2 | Notes file exists, is README-linked, `validate-docs` 6/6, Status FINAL after deploy | FR-2, FR-3 |
| AC-3 | All 8 gate commands green on the release state | FR-4 |
| AC-4 | Tag `v1.23.0` exists on origin pointing at the merged release state | FR-5 |
| AC-5 | The skipped device pass is recorded in the notes as an accepted gap | FR-2 |

## Edge Cases

- Tag `v1.23.0` already exists at execution time → halt and ask (no overwrite).
- Tag push or Coolify deploy fails → recorded as a manual-exception follow-up; the tag itself is not moved.
- Notes ship with Status DRAFT and flip to FINAL only after the deploy + smoke check confirm.
- More PRs merge to `master` before the track branch cuts → the notes cover the exact `git log v1.22.0..base` set resolved in Phase 1 (currently PR #75 only).

## Dependencies

- **Tracks:** none — PR #75 is merged to `master`.
- **External:** `origin` remote (tag push); Coolify tag-gated deploy (fires automatically).

## Open Questions & Assumptions

- **Assumption:** No save-schema migration is needed — the content-expansion review verified NFR-5 (no storage/schema changes); to be confirmed against the diff in Phase 1.
- **Assumption:** The tag push happens only on explicit go-ahead, since it fires the production deploy.
- **Assumption:** Skipping the device pass is accepted (v1.22.0 precedent); recorded in the notes, not silent.
- **Assumption:** Minor (not patch) bump is correct: the shipped track adds kid-visible content pools, additive with no breaking change, matching the game-addition minor precedent.

## References

- `docs/release-notes-v1.22.0.md` (format precedent)
- `docs/release-checklist.md` (manual pass + sign-off structure)
- `docs/PRD.md` §8.2 deploy path; `docs/TDD.md` CI/tag-gate sections
- `conductor/archive/20261027-content-expansion/review.md` (shipped content, PASS, 126 files / 2783 tests)
- `conductor/archive/20261027-content-expansion/pr.md` (PR #75 record)
- Commit `e584ecb1` (content-expansion merge); tag `v1.22.0`
