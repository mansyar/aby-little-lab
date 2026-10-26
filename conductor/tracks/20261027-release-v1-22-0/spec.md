# Release v1.22.0 — Specification

> Requirements are stable. Once an `FR`, `NFR`, or `AC` ID is approved, do not
> renumber it. If a requirement is removed, mark it `Withdrawn` instead of
> deleting it.

## Overview

Ship the seven tracks merged since `v1.21.7` as **v1.22.0** through the tag-gated deploy path: version bump, dated release notes in the established format, PR merge, then tag + push with explicit user go-ahead. The release itself changes no runtime behavior — it puts two user-facing performance features (idle chunk prewarm, cold-tap art preload) plus five supporting tracks onto the live app.

## Problem / Motivation

Two user-facing performance features sit merged but unreleased: warm taps cost 27–65 ms and the worst sampled fully-cold tap measures 332.6 ms against the 400 ms budget — but the live app (still `v1.21.7`, tagged 2026-10-25) predates both. The version string, the release notes, and the deployed build all lag the repository. The notes habit also lapsed: no notes file exists since v1.21.0. If unsolved, the shipped product keeps slower-tap behavior than the code already delivers, and the release record keeps gaps.

## Goals & Success Metrics

- **Goal:** `v1.22.0` tagged on `master`, pushed, deployed via the tag gate.
- **Metric:** Tag `v1.22.0` exists on origin; Coolify deployed on the tag push; live app reports the new version.
- **Goal:** Dated release notes in the established format, linked from the README index.
- **Metric:** `docs/release-notes-v1.22.0.md` exists, `validate-docs` 6/6, Status flipped FINAL after deploy.
- **Goal:** Zero product-behavior change from the release itself.
- **Metric:** Full 8-command gate green; release diff touches only version metadata, notes, and index links.

## Scope

### In Scope

- `package.json` bump `1.21.7` → `1.22.0`.
- `docs/release-notes-v1.22.0.md` in the v1.21.0 format (Status/Tag/Base header, parent-facing lede, one section per merged PR #67–#73 in merge order, release verification section).
- README Documentation-index link to the new notes (required by `validate-docs`).
- Full `verify_phase` gate, PR, merge, then tag `v1.22.0` on `master` + push with explicit go-ahead.

### Out of Scope

- Any `src/` behavior change.
- Backfilling the missing v1.21.1–v1.21.7 notes files.
- The manual on-device pass (skipped; recorded as an accepted gap in the notes).
- Coolify-side remediation if the tag-gated deploy fails (workflow manual exception).

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | `package.json` version reads `1.22.0` | must |
| FR-2 | `docs/release-notes-v1.22.0.md` covers all 7 PRs since `v1.21.7` in the established format | must |
| FR-3 | The new notes file is linked from the README Documentation index | must |
| FR-4 | Full 8-command `verify_phase` gate is green on the release state | must |
| FR-5 | Tag `v1.22.0` on `master` is pushed to origin after merge, firing the tag-gated deploy | must |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | The release changes no runtime behavior: diff is version metadata, notes, and index links only |
| NFR-2 | Notes follow the v1.21.0 structure (Status/Tag/Base header, parent-facing lede, per-PR sections, verification section) |
| NFR-3 | Conventional commits; the tag-gated deploy path itself is untouched |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | `package.json` version is `1.22.0` | FR-1 |
| AC-2 | Notes file exists, is README-linked, `validate-docs` 6/6, Status FINAL after deploy | FR-2, FR-3 |
| AC-3 | All 8 gate commands green on the release state | FR-4 |
| AC-4 | Tag `v1.22.0` exists on origin pointing at the merged release state | FR-5 |
| AC-5 | The skipped device pass is recorded in the notes as an accepted gap | FR-2 |

## Edge Cases

- Tag `v1.22.0` already exists at execution time → halt and ask (no overwrite).
- Tag push or Coolify deploy fails → recorded as a manual-exception follow-up; the tag itself is not moved.
- Notes ship with Status DRAFT and flip to FINAL only after the deploy + smoke check confirm.

## Dependencies

- **Tracks:** none — PRs #67–#73 are all merged to `master`.
- **External:** `origin` remote (tag push); Coolify tag-gated deploy (fires automatically).

## Open Questions & Assumptions

- **Assumption:** No save-schema migration is needed — none of the 7 shipped PRs changes stored state (to be confirmed against the diff during planning).
- **Assumption:** The tag push happens only on explicit go-ahead, since it fires the production deploy.
- **Assumption:** Skipping the device pass is accepted; recorded in the notes, not silent.

## References

- `docs/release-notes-v1.21.0.md` (format precedent)
- `docs/release-checklist.md` (manual pass + sign-off structure)
- `docs/PRD.md` §8.2 deploy path; `docs/TDD.md` CI/tag-gate sections
- Commit `ee6bb40f` (v1.21.7 bump precedent); PRs #67–#73; tag `v1.21.7`
