# Release v1.26.0 — Specification

> Requirements are stable. Once an `FR`, `NFR`, or `AC` ID is approved, do not
> renumber it. If a requirement is removed, mark it `Withdrawn` instead of
> deleting it.

## Overview

- **Track ID:** `20261125-release-v1-26-0`
- **Type:** `chore`
- **Priority:** `high`
- **Branch:** `chore/20261125-release-v1-26-0`
- **Base:** `master` at `b5c18c8a047aaee404920804be635f5a37ea3bd2`
- **Previous release:** `v1.25.0` at `4359667bbeea5a774efe5675fd6cc62069c96dc0`

Package the five reviewed, CI-green changes merged since `v1.25.0` into a truthful `v1.26.0` release, with synchronized release documentation, a clean review trail, and an explicitly approved tag/deploy step.

## Problem / Motivation

Five changes are merged into `master` but unavailable to families through a tagged release: two user-facing features, a first-tap latency fix, a dev-tool upgrade pass, and performance evidence. Shipping them now delivers the accumulated value and establishes a clean release baseline before browser-matrix work begins. Without a release track, the version, notes, README and roadmap remain stale even though the code is healthy.

## Goals & Success Metrics

- **Goal:** users receive the five merged changes through a tagged `v1.26.0` release.
- **Metric:** after approval and tagging, origin tag `v1.26.0` points to the merged `master` release commit, its CI is green, the live app reports `v1.26.0`, and the release notes are `FINAL` with the tag, CI and deployment record.

## Shipped Changes

In merge order:

1. **PR #94 — Replay Novelty:** a textless Hub suggestion ring, selector-driven idle wiggles, and a per-visit earned-sticker spotlight; memory-only and reset on profile switch.
2. **PR #95 — Adaptive Tuning:** difficulty cut points retuned against the designed 70/15/15 curve, plus a parent-only band readout in Learning Progress.
3. **PR #96 — Dependency Majors — November 2026:** dev-tool upgrades for Biome, Vite, Vitest/coverage and Playwright; no runtime dependency or production-source change.
4. **PR #97 — Find the Word cold first-tap fix:** deterministic playthrough generation before preload; only selected letters and prompt assets are rasterized.
5. **PR #98 — Headed first-tap p95 baseline:** nearest-rank p95 reporting, repeated cold-tap sampling, published passing evidence, and a per-release refresh procedure.

## Scope

### In Scope

- Version metadata.
- New release notes and README release/documentation links.
- The single stale roadmap truth correction.
- Verification, device-smoke policy record, review, PR, merge, and the separately approved tag/deploy/finalization steps.
- Conductor track state and evidence.

### Out of Scope

- New features, games, content, assets, translations or accessibility modes.
- Dependency upgrades beyond the version bump.
- RM-3 browser-matrix automation.
- RM-4 real-family retention validation.
- Any claim that the full browser/device matrix has passed.

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | `package.json` reads `"version": "1.26.0"`; the lockfile remains consistent with no dependency change. | must |
| FR-2 | `docs/release-notes-v1.26.0.md` follows the established structure: Status/Tag/Base header, parent-facing lede, one section per shipped PR in merge order, Installation, Release Verification, and Known Issues. | must |
| FR-3 | README's Documentation index links the new notes, and the newest-first Releases table contains a dated `v1.26.0` row. | must |
| FR-4 | `conductor/roadmap.md` §10.7 corrects the first-tap p95 row from future work to completed work, citing `docs/perf-baseline.md` and the 2026-11-24 evidence without rewriting historical results. | must |
| FR-5 | Run the exact configured `verify_phase` gate on the final release tree and record the actual results. | must |
| FR-6 | Require both configured Browser Journeys shards and the rollup to pass in CI on the release PR/merge commit. | must |
| FR-7 | Run a targeted physical-device smoke when suitable hardware is available; otherwise record the skipped pass as an accepted gap before tagging. | must |
| FR-8 | Complete strict review with no unresolved blocking findings, open the PR, watch CI, and merge only after the required go-ahead. | must |
| FR-9 | Create and push `v1.26.0` on the merged `master` commit only after explicit user approval, because the tag triggers Coolify; then flip the notes from `DRAFT` to `FINAL` and record tag/CI/deploy verification. | must |
| FR-10 | Do not claim real-device coverage, production retention evidence, or non-Chromium browser support that has not been obtained. | must |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | No runtime source, gameplay, content, assets, dependencies, save schema or storage migration changes. |
| NFR-2 | No quality gate, threshold, sample count, test assertion or validation script is weakened. |
| NFR-3 | Release notes use measured release-state figures and distinguish automated Chromium coverage from real-device coverage. |
| NFR-4 | Historical evidence remains intact; the passing first-tap baseline is linked, not substituted for the earlier failure record. |
| NFR-5 | The tag is immutable once pushed. Any correction after tagging requires a new version, never a moved tag. |
| NFR-6 | Rollback is a reviewed revert of the release commit plus a follow-up patch release if already deployed; no data rollback is needed. |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | `package.json` is `1.26.0`, and frozen installation remains green with no dependency drift. | FR-1 |
| AC-2 | Release notes cover PRs #94–#98 in merge order and make no unsupported claims. | FR-2 |
| AC-3 | README contains both the Documentation index link and the dated Releases row. | FR-3 |
| AC-4 | Roadmap §10.7 records the headed first-tap baseline as complete and links to its evidence. | FR-4 |
| AC-5 | The exact `verify_phase` chain exits 0 on the final tree; actual suite, coverage, bundle, module-size, texture, PWA and docs figures are recorded. | FR-5 |
| AC-6 | CI Quality Gates, Browser Journeys shard 1, shard 2 and rollup pass. | FR-6 |
| AC-7 | A targeted device-smoke result is recorded, or the skipped pass is explicitly recorded as an accepted gap. | FR-7 |
| AC-8 | Review verdict is `PASS`, all blocking findings are closed, and the PR is merged with green checks. | FR-8 |
| AC-9 | After explicit approval, `v1.26.0` resolves on origin to merged `master` HEAD, deploy verification succeeds, and notes are `FINAL`. | FR-9 |
| AC-10 | The release diff contains no runtime source, dependency, asset or save-schema changes outside Conductor state. | FR-1, FR-10, NFR-1 |

## Edge Cases

- `v1.26.0` already exists locally or on origin: stop; never move or reuse the tag.
- `master` advances before materialization: refetch and reconfirm the recorded base before creating the branch.
- CI fails after merge: stop and fix forward with a reviewed patch before tagging.
- Physical hardware is unavailable: record an accepted gap; do not imply a device pass.
- Current suite/build figures differ from archived PR figures: use the release-state measurement, not the historical number.
- Finalizing notes after the tag requires the documented direct-to-`master` release exception; never use it without explicit approval.

## Dependencies

- **Tracks:** none; PRs #94–#98 are already merged into `master`.
- **External:** existing GitHub Actions for CI and Coolify for tag-gated deployment. Physical iOS/Android/Fire hardware is optional for the targeted smoke; its absence invokes the approved accepted-gap policy.

## Open Questions & Assumptions

- **Open questions:** none for this release-only scope.
- **Assumption:** a minor bump to `1.26.0` is correct because the release includes two user-facing features, a latency fix, tooling upgrades and performance evidence.
- **Assumption:** no `v1.26.0` tag currently exists locally or on origin.
- **Assumption:** the release remains family-only, offline-first and free of runtime network dependencies.
- **Assumption:** `conductor/product.md` has no Open Questions section; no unresolved product decision is needed here.
- **Assumption:** the release follows the established v1.25.0 process, with the additional targeted-device policy selected for this version.

## References

- [v1.25.0 release specification](../../archive/20261123-release-v1-25-0/spec.md)
- [v1.25.0 implementation plan](../../archive/20261123-release-v1-25-0/plan.md)
- [v1.25.0 release notes](../../../docs/release-notes-v1.25.0.md)
- [Release checklist](../../../docs/release-checklist.md)
- [Performance baseline](../../../docs/perf-baseline.md)
- [Workflow](../../workflow.md)
- [Roadmap](../../roadmap.md)
- Archived PR evidence for `20261124-replay-novelty`, `20261124-adaptive-tuning`, `20261124-dependency-majors`, `20261124-word-match-first-tap`, and `20261124-first-tap-p95-baseline`.
