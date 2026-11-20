# Release v1.24.0 — Specification

> Requirements are stable. Once an `FR`, `NFR`, or `AC` ID is approved, do not
> renumber it. If a requirement is removed, mark it `Withdrawn` instead of
> deleting it.

## Overview

Ship the 14 tracks merged since `v1.23.0` as **v1.24.0** through the tag-gated deploy path: version bump, dated release notes in the established format, README index and release-table links, full verification gate, reviewed PR merge, then tag + push with explicit user go-ahead. The release itself changes no runtime behavior — all behavior landed in the reviewed PRs; the release diff is version metadata, notes, and index links only.

## Problem / Motivation

`v1.23.0` was cut at `45190721` on 2026-10-27. Since then, 14 PRs have merged to `master` (#77–#90): HubScene decomposition, trunk-green fixtures, the browser-journey suite, storage resilience, toolchain pinning, edge hardening, local insights, backup/restore, error capture, hub game groups, **Robot Path (23rd game)**, **Fix-It Machine (24th game)**, Debug Probes, and the Product Intent Gate. The live app still reports v1.23.0, so families cannot yet get the two new games, the reliability work, the parent data tools, or the legal/product decisions. The version string, release notes, and deployed build lag the repository by 14 tracks — the largest gap in the release record.

## Goals & Success Metrics

- **Goal:** `v1.24.0` tagged on `master`, pushed, deployed by the tag gate.
- **Metric:** Tag exists on origin at the merged release HEAD; Coolify deploy fires; live app reports the new version.
- **Goal:** Dated release notes covering all 14 PRs in merge order.
- **Metric:** `docs/release-notes-v1.24.0.md` exists, is README-linked, `validate-docs` green, Status flipped FINAL after deploy.
- **Goal:** Zero product-behavior change from the release itself.
- **Metric:** Full `verify_phase` gate green; release diff touches only `package.json`, notes, `README.md`, and Conductor state.

## Scope

### In Scope

- `package.json` bump `1.23.0` → `1.24.0`.
- `docs/release-notes-v1.24.0.md` in the v1.23.0 format: Status/Tag/Base header, parent-facing lede, one section per merged PR #77–#90 in merge order, Installation, Release Verification, Known Issues, and the skipped device pass recorded as an accepted gap.
- README Documentation-index link and Releases-table row for the new notes.
- Full `verify_phase` gate, review, PR/CI/merge, then tag `v1.24.0` + push after explicit go-ahead.

### Out of Scope

- Any `src/` behavior change or new feature work.
- P6 housekeeping (module-size budget, `docs/changelog.md` split) — a separate follow-up track.
- Store submission, TWA/Capacitor packaging, or acting on the prepared privacy labels.
- Coolify-side remediation if the tag deploy fails (manual exception).
- Real-device PWA pass (skipped; recorded as an accepted gap).

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | `package.json` version reads `1.24.0` | must |
| FR-2 | `docs/release-notes-v1.24.0.md` covers PRs #77–#90 since `v1.23.0` in merge order, in the established format | must |
| FR-3 | The new notes are linked from the README Documentation index and listed in the Releases table | must |
| FR-4 | Full `verify_phase` gate is green on the release state | must |
| FR-5 | The release is reviewed and merged to `master` via PR with green CI | must |
| FR-6 | Tag `v1.24.0` on `master` is pushed to origin after explicit go-ahead, firing the tag-gated deploy | must |
| FR-7 | Notes Status flips from DRAFT to FINAL after the tag/deploy, recording the tag and CI run | must |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | Release diff changes no runtime behavior: only version metadata, notes, README links, and Conductor state |
| NFR-2 | Notes follow the v1.23.0 structure, with 14 PR sections, a parent-facing lede, and no duplication of the README Known Issues or roadmap |
| NFR-3 | Conventional commits; tag/deploy path untouched; no force-push, tag move, or silent retry |
| NFR-4 | `node scripts/validate-docs.js` stays green (release-note index complete, links/anchors resolve, game lists agree, test counts match derived truth) |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | `package.json` version is `1.24.0` | FR-1 |
| AC-2 | Notes file exists, is README-linked and table-listed, validator green, Status DRAFT before tag | FR-2, FR-3, NFR-4 |
| AC-3 | All eight `verify_phase` commands green on the release commit | FR-4 |
| AC-4 | Release PR reviewed PASS, CI green, merged to `master` with the configured `merge` method | FR-5 |
| AC-5 | Tag `v1.24.0` exists on origin at the merged `master` HEAD; notes Status reads FINAL | FR-6, FR-7 |
| AC-6 | Skipped device pass is recorded in the notes as an accepted gap | FR-2 |
| AC-7 | Notes accurately include the 23rd/24th games, Debug Probes' “looks not scores” rule, and the CC0 BGM + MIT/legal posture shipped by #90 | FR-2 |

## Edge Cases

- Tag `v1.24.0` already exists locally or on origin → halt and ask; never overwrite or move a tag.
- `master` advances after the base is resolved → notes cover the exact `#77..base` merge set resolved in Phase 1; new merges are recorded, not silently swallowed.
- Docs validator's release-note index and count-drift guards are strict → every new relative link and any test-count claim must match derived truth.
- Tag push or Coolify deploy fails → record as a manual exception; do not move or retry the tag silently.
- Notes go out as DRAFT and flip to FINAL only after the deploy fires.
- The tag push is human-only: it fires production deploy and requires explicit go-ahead.

## Dependencies

- **Tracks:** none — all 14 tracks are merged and archived.
- **External:** `origin` remote (tag push); Coolify tag-gated deploy (secrets are a workflow manual exception); real-device pass is a skipped manual check.

## Open Questions & Assumptions

- **Assumption:** A minor bump is correct: two new games plus additive reliability/parent tools, no breaking change, matching the game-addition minor precedent.
- **Assumption:** The real-device pass is skipped as an accepted gap, per v1.22.0/v1.23.0 precedent, and recorded in the notes.
- **Assumption:** Tag push happens only on explicit go-ahead, since it fires production deploy.
- **Assumption:** Product-intent decisions and legal artifacts ship as documentation only; no store submission is implied.
- **Question:** none blocking.

## References

- `docs/release-notes-v1.23.0.md` (format precedent; Base `45190721`); `docs/release-checklist.md`.
- `conductor/archive/20261027-release-v1-23-0/{spec,plan,pr}.md` (release-track precedent).
- `conductor/tracks.md` lines 269–288 (the 14 merged tracks); `gh` PRs #77–#90.
- `docs/PRD.md` §8.2 deploy path; `docs/TDD.md` CI/tag-gate sections; `conductor/workflow.md` Release Process.
