# Release v1.26.1 — Specification

> Requirements are stable. Once an `FR`, `NFR`, or `AC` ID is approved, do not
> renumber it. If a requirement is removed, mark it `Withdrawn` instead of
> deleting it.

## Overview

- **Track ID:** `20261126-release-v1-26-1`
- **Type:** `chore`
- **Priority:** `high`
- **Branch:** `chore/20261126-release-v1-26-1`
- **Base:** `master` at `859498a850f729294785453f5884c1915e4071c7`
- **Previous release:** `v1.26.0` at `3c0cef4a63a779132370fb8ec056a7be55bc56ea`

Package the reviewed, CI-green browser compatibility matrix work merged in PR
#100 into a truthful `v1.26.1` patch release, with synchronized documentation,
corrected archived state, a clean review trail, and an owner-pre-authorized but
preflight-gated tag/deploy step.

## Problem / Motivation

PR #100 is merged into `master` but unavailable to families through a tagged
release. It contains three smoke-proven portability fixes — a guarded
`AudioContext` for WebKit, a shared texture reservation that removes a Firefox
duplicate-load race, and a state-based long-hold wait for high-refresh devices —
plus a repeatable WebKit/Firefox/mobile-Chromium CI matrix and blocking rollup.
Leaving it unreleased keeps those defects live for users and leaves the roadmap
and archived release state stale.

## Goals & Success Metrics

- **Goal:** users receive PR #100 through a tagged `v1.26.1` release.
- **Metric:** origin tag `v1.26.1` points to the merged `master` release commit,
  its CI is green, the live app reports `v1.26.1`, and the release notes are
  `FINAL` with the tag, CI, deployment, and device-policy record.

## Shipped Changes

In merge order:

1. **PR #100 — Browser Compatibility Matrix:** WebKit, Firefox, and mobile
   Chromium/touch smoke projects run a focused six-file smoke on every code PR;
   the full journey suite stays Chromium-only; the existing required
   `Browser Journeys` rollup fails if any engine or shard fails; a strict
   evidence helper rejects retried, flaky, skipped, unexpected, or wrong-project
   reports. Three smoke-proven compatibility defects were repaired without new
   runtime dependencies, assets, save schema, game rules, or runtime-network
   behavior.

## Scope

### In Scope

- Version metadata.
- New `v1.26.1` release notes and README release/documentation links.
- Roadmap truth for RM-3 and §10.7.
- Correction of the archived browser-matrix `pr_state` and malformed `pr.md`
  header.
- Fresh boot, header, and headed first-tap evidence; live `perf-baseline.md`
  update if figures differ.
- Verification, accepted device-gap policy, review, PR, merge, and the
  owner-pre-authorized tag/deploy/finalization steps.
- Conductor track state and evidence.

### Out of Scope

- New features, games, content, assets, translations, or accessibility modes.
- New runtime source changes beyond PR #100, which is already merged.
- Physical iOS Safari, Android Chrome, Fire tablet, or other real-device
  validation; this release records an accepted gap.
- RM-4 real-family retention validation.
- Any claim that production retention or non-Chromium physical-device support
  has been proven.

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | `package.json` reads `"version": "1.26.1"`; the lockfile remains consistent with no dependency change. | must |
| FR-2 | `docs/release-notes-v1.26.1.md` follows the established structure: Status/Tag/Base header, parent-facing lede, one section for PR #100, Installation, Release Verification, and Known Issues. | must |
| FR-3 | README's Documentation index links the new notes, and the newest-first Releases table contains a dated `v1.26.1` row. | must |
| FR-4 | `conductor/roadmap.md` corrects the RM-3 Next row and §10.7 browser-matrix row to reflect delivered WebKit/Firefox/mobile-Chromium emulation and the preserved manual physical-device gate, without claiming physical iOS/Android/Fire coverage. | must |
| FR-5 | Archived browser-matrix metadata records `pr_state: merged`, and the malformed `pr.md` URL/head/base header is repaired. | must |
| FR-6 | Run the exact configured `verify_phase` gate on the final release tree and record actual results, plus a frozen installation check. | must |
| FR-7 | Run boot smoke, strict header validation, and the fixed headed first-tap command; require 50 cold / 0 warm samples, 10 per game, and every worst cold total ≤400 ms; refresh the live `perf-baseline.md` header/table if the figures differ. | must |
| FR-8 | Require Quality Gates, both Chromium shards, all three engine jobs, and the `Browser Journeys` rollup to pass on the release PR/merge commit and the tag commit. | must |
| FR-9 | Record the targeted physical-device smoke as `SKIPPED — accepted gap`; no physical-device pass is claimed. | must |
| FR-10 | Complete strict review with no unresolved blocking findings, open the PR, watch CI, and merge only after green checks and the separate explicit merge answer. | must |
| FR-11 | The owner pre-authorized tag/deploy at track creation. After merge, tag preflight, green CI, and the live-deploy checks, create and push `v1.26.1`, flip notes to `FINAL`, and verify the live build; never move the tag. | must |
| FR-12 | Do not claim real-device coverage, production retention evidence, or physical non-Chromium browser support that has not been obtained. | must |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | This release track introduces no new runtime source, gameplay, content, assets, dependencies, save schema, or storage migration; PR #100 is already merged. The sole exception is one narrowly scoped, reviewed fix-forward patch if a post-merge CI check fails, as allowed by the CI edge case below; it must keep every assertion and threshold intact. |
| NFR-2 | No quality gate, threshold, sample count, test assertion, or validation script is weakened. |
| NFR-3 | Release notes use measured release-state figures and distinguish local checks, CI-only browser coverage, emulated engines, and real-device coverage. |
| NFR-4 | Historical evidence remains intact; dated perf, browser, and release records are preserved rather than overwritten as history. |
| NFR-5 | The tag is immutable once pushed. Any correction after tagging requires a new version, never a moved tag. |
| NFR-6 | Rollback is a reviewed revert plus a new patch tag if already deployed; no data rollback is needed. |
| NFR-7 | Use `git -c core.whitespace=cr-at-eol diff --check` where CRLF files are touched; do not normalize whole files or introduce mixed line endings. |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | `package.json` is `1.26.1`, and frozen installation remains green with no dependency drift. | FR-1 |
| AC-2 | Release notes cover PR #100 accurately and make no unsupported claims. | FR-2, FR-12 |
| AC-3 | README contains both the Documentation index link and the dated Releases row. | FR-3 |
| AC-4 | Roadmap RM-3 and §10.7 distinguish delivered engine emulation from the manual device gate. | FR-4 |
| AC-5 | Archived browser-matrix metadata and `pr.md` header are corrected and links resolve. | FR-5 |
| AC-6 | The exact `verify_phase` chain exits 0 on the final tree; actual suite, coverage, bundle, module-size, texture, PWA, and docs figures are recorded. | FR-6 |
| AC-7 | Boot, headers, and headed first-tap checks pass with the required samples; raw evidence is committed and `perf-baseline.md` is refreshed if needed. | FR-7 |
| AC-8 | CI Quality Gates, both Chromium shards, all three engine jobs, and the Browser Journeys rollup pass on the PR/merge commit and the tag commit. | FR-8 |
| AC-9 | The skipped physical-device smoke is explicitly recorded as an accepted gap. | FR-9 |
| AC-10 | Review verdict is `PASS`, all blocking findings are closed, and the PR is merged with green checks. | FR-10 |
| AC-11 | `v1.26.1` resolves on origin to merged `master` HEAD, tag CI and Coolify verification pass, the live bundle reports `1.26.1`, and notes are `FINAL`. | FR-11 |
| AC-12 | The release diff contains no new runtime source, dependency, asset, or save-schema change outside `package.json`, release docs, living docs, and Conductor state, except one reviewed CI fix-forward patch as defined by NFR-1 and the CI edge case. | FR-1, FR-12, NFR-1 |

## Edge Cases

- `v1.26.1` already exists locally or on origin: stop; never move or reuse the
  tag.
- `master` advances before materialization or tagging: refetch and reconfirm the
  base; do not tag a non-release commit.
- CI fails after merge: stop and fix forward with a reviewed patch before
  tagging. The patch must close a reproduced red check without weakening an
  assertion, threshold, sample count, or gate. It is the only exception to
  NFR-1/AC-12, must be included in the reviewed release PR before tagging, and
  must be proven by a fresh green PR CI run.
- The headed first-tap measurement differs from the archived figures: use the
  fresh release-state result and update the living header/table; preserve
  historical sections.
- Physical hardware is unavailable: record an accepted gap; do not imply a
  device pass.
- The owner's tag/deploy authorization is recorded at track creation, but
  tagging still requires all preflight conditions to hold. If any condition
  fails, stop rather than tag.
- Finalizing notes after the tag uses the documented docs/Conductor-only
  direct-to-`master` release exception, following the v1.25.0 and v1.26.0
  precedents; never force-push, reset, move, or recreate the tag.

## Dependencies

- **Tracks:** none; PR #100 is already merged into `master`.
- **External:** GitHub Actions for CI, Coolify for tag-gated deployment, local
  headed Chromium for first-tap evidence, and Docker for strict-header
  validation. Physical iOS/Android/Fire hardware is optional and absent under
  the selected policy.

## Open Questions & Assumptions

- **Open questions:** none for this release-only scope.
- **Assumption:** a patch bump to `1.26.1` is correct because the shipped work
  contains compatibility fixes and test infrastructure, not new gameplay or
  content.
- **Assumption:** no `v1.26.1` tag currently exists locally or on origin.
- **Assumption:** master rerun `45595775568` on merge commit `859498a8` is red
  because Firefox `sticker-persistence` logged three
  `InvalidStateError: Navigated away from page` page errors across three
  attempts; the CI edge case therefore requires one narrowly scoped, reviewed
  fix-forward patch before this release can be tagged.
- **Assumption:** the owner's "Authorize tag at track creation" answer is the
  explicit human authorization required by the workflow; Phase 5 still verifies
  every precondition and stops if any fails.
- **Assumption:** the release remains family-only, offline-first, English, and
  free of runtime network dependencies.
- **Assumption:** `conductor/product.md` has no Open Questions section; no
  unresolved product decision is needed here.
- **Assumption:** the malformed archived `pr.md` header is a local artifact
  defect and may be repaired as part of the archived-state correction.

## References

- [v1.26.0 specification](../archive/20261125-release-v1-26-0/spec.md)
- [v1.26.0 implementation plan](../archive/20261125-release-v1-26-0/plan.md)
- [v1.26.0 release notes](../../docs/release-notes-v1.26.0.md)
- [Release checklist](../../docs/release-checklist.md)
- [Performance baseline](../../docs/perf-baseline.md)
- [Roadmap](../roadmap.md)
- [Workflow](../workflow.md)
- [Browser-matrix PR](https://github.com/mansyar/aby-little-lab/pull/100)
- [Browser-matrix archived PR record](../archive/20261125-browser-matrix/pr.md)
- [Browser-matrix integrated verification](../archive/20261125-browser-matrix/verification/integrated.md)
- [Product-intent decision](../../docs/product-intent.md)
