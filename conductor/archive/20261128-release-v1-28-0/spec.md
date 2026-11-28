# Release v1.28.0 — Specification

> Requirements are stable. Once an `FR`, `NFR`, or `AC` ID is approved, do not
> renumber it. If a requirement is removed, mark it `Withdrawn` instead of
> deleting it.

## Overview

Ship the three tracks merged since `v1.27.0` as **v1.28.0** through the existing
tag-gated deployment path: Repeat Machine (the 25th game, PR #109), the wide Hub
grid overflow and chip-band tap fix (PR #110), and per-profile narration pace
(PR #111). The release itself changes no runtime behavior; it versions, documents,
verifies, tags, and deploys work already reviewed and merged onto `master`.

## Problem / Motivation

`master` contains three parent-visible improvements that the live app still does
not serve because `package.json` and the latest tag remain `v1.27.0`. Families
therefore keep the 24-game Hub, the overflow-prone wide grid, and the fixed
narration rate until a new tag is pushed. Issue #108 also remains open even
though PR #110 fixed it. Without this release track, the repository, release
notes, deployed build, and issue record continue to disagree.

## Goals & Success Metrics

- **Goal:** publish `v1.28.0` on merged `master` and deploy it through Coolify.
- **Metric:** origin has an annotated `v1.28.0` tag on the release merge commit;
  tag CI and Deploy to Coolify pass; the live URL serves the local release shell
  and reports `1.28.0`.
- **Goal:** make the release record truthful and complete.
- **Metric:** DRAFT notes become FINAL with PRs #109–#111 in merge order, README
  links and table row resolve, `validate-docs` passes 5/5, and issue #108 is
  closed with merge evidence.
- **Goal:** preserve the release quality gates.
- **Metric:** the full `verify_phase` command exits 0 on the final candidate;
  headed first-tap evidence has 50 cold / 0 warm samples with every worst cold
  total ≤400 ms; browser journeys pass in CI.
- **Goal:** keep the release diff behavior-neutral.
- **Metric:** no production source, asset, dependency, schema, or storage change
  is introduced by this track.

## Scope

### In Scope

- `package.json` version bump `1.27.0` → `1.28.0`.
- `docs/release-notes-v1.28.0.md` in the v1.27.0 format, initially DRAFT, with
  one section per merged PR #109, #110, and #111 in merge order.
- README Documentation link and Releases table row dated 2026-11-28.
- Per-release performance-baseline refresh using measured candidate figures,
  including the headed cold first-tap procedure.
- Full integrated verification, strict Conductor review, PR creation, green CI,
  and merge using the configured `merge` method after explicit user approval.
- Close issue #108 as completed, linking PR #110 and the release record.
- After merge and a separate explicit tag/deploy go-ahead: annotated `v1.28.0`
  tag push, tag CI and Coolify verification, live-build verification, and
  DRAFT → FINAL notes.
- Record physical-device smoke as `SKIPPED — accepted gap`; claim no real-device
  pass.

### Out of Scope

- New games, UI behavior, assets, dependencies, schema changes, or migrations.
- Store submission or any distribution channel other than the existing PWA/Coolify path.
- Physical iOS Safari, Android Chrome, or Fire tablet testing.
- Rewriting, moving, deleting, or force-pushing any published tag or commit.
- New roadmap features such as RM-10; those remain later work.

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | `package.json` reports `1.28.0`, and the built app exposes the same version through the existing Vite define. | must |
| FR-2 | Release notes use the established Status/Tag/Base header, parent-facing lede, Installation, Release Verification, and Known Issues structure; they cover PRs #109, #110, and #111 in merge order and remain DRAFT until the ship gate passes. | must |
| FR-3 | README links the v1.28.0 notes from Documentation and adds a dated v1.28.0 Releases row with accurate highlights and tag. | must |
| FR-4 | `docs/perf-baseline.md` receives a dated v1.28.0 candidate section and current living figures derived from this release candidate, without rewriting historical measurements. | must |
| FR-5 | The final release candidate passes the full configured `verify_phase` gate, headed first-tap refresh, and browser-journey verification with raw evidence retained. | must |
| FR-6 | The release passes strict `conductor-review`; its PR targets `master`, watches CI to green, and merges only after the user explicitly answers “Merge now”. | must |
| FR-7 | Issue #108 is closed as completed with a comment linking PR #110 and the v1.28.0 release evidence. | must |
| FR-8 | After the release PR is merged and the user separately authorizes tagging, an annotated `v1.28.0` tag is created on merged `master` HEAD and pushed without moving an existing tag. | must |
| FR-9 | Tag CI and Coolify deploy pass; the live URL returns 200, serves the release build, embeds `1.28.0`, and serves `sw.js` and `manifest.webmanifest`; notes then become FINAL with the device gap recorded. | must |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | The release track introduces no runtime behavior, production-source, asset, dependency, schema, or storage change. |
| NFR-2 | Documentation remains internally consistent: `validate-docs` exits 0, relative links resolve, and living suite/coverage/build figures match measured candidate output. |
| NFR-3 | Git history uses conventional commits; no force-push, reset, tag move, or history rewrite is permitted. A failed check may be rerun at most once and only with the cause recorded. |
| NFR-4 | Existing budgets remain enforced: bundle entry ≤200 kB via `validate-bundle`, module-size and texture guards pass, PWA validation passes, and coverage stays above 95 lines / 88 functions / 85 branches / 90 statements. |
| NFR-5 | Rollback is safe: before tagging, revert the release PR; after tagging, never move or delete the tag—ship a reviewed patch release if a defect is found. No user-data rollback is needed because there is no migration. |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | `package.json` and the built bundle both report `1.28.0`. | FR-1 |
| AC-2 | Notes are DRAFT before ship and FINAL only after tag/deploy/live verification, with all three PR sections and the accepted device gap. | FR-2, FR-9 |
| AC-3 | README Documentation and Releases entries link to the notes and `validate-docs` passes. | FR-3 |
| AC-4 | Perf baseline contains measured v1.28.0 candidate figures and raw headed first-tap evidence. | FR-4 |
| AC-5 | Full gate exits 0; headed first tap records 50 cold / 0 warm samples and no worst cold total above 400 ms. | FR-5 |
| AC-6 | Review verdict is PASS or all findings are resolved/accepted; PR CI is green before merge. | FR-6 |
| AC-7 | Issue #108 is closed with a completion comment linking #110 and the release evidence. | FR-7 |
| AC-8 | `v1.28.0` exists on origin only after explicit authorization and points to merged `master` HEAD. | FR-8 |
| AC-9 | Tag CI, Coolify, live HTTP/title/version/hash/service-worker/manifest checks pass and notes are FINAL. | FR-9 |

## Edge Cases

- **Tag collision:** stop if `v1.28.0` exists locally or on origin; never move it.
- **CI failure:** diagnose track-caused failures on the release branch; do not merge
  until all required checks are green.
- **Vitest worker crash:** one disclosed rerun is allowed after recording the cause;
  persistent failure blocks the release.
- **Documentation-only classifier:** if CI skips browser journeys because the diff is
  docs-only, rely on the already-green code PRs plus Quality Gates and record that
  classification; do not claim a new browser run.
- **First-tap gate failure:** a worst cold total >400 ms blocks; a p95-only breach is
  report-only and requires a concrete follow-up.
- **Deploy/live mismatch:** stop finalization and investigate; never mark FINAL or
  move the tag to hide the mismatch.
- **Physical-device gap:** record `SKIPPED — accepted gap`; do not imply device proof.

## Dependencies

- **Tracks:** `20261128-repeat-machine` (PR #109), `20261128-wide-hub-grid-overflow`
  (PR #110), and `20261128-narration-pace` (PR #111). All are archived `complete`
  and their merge commits are ancestors of `master` at `39df7f5b`.
- **External:** GitHub PR/issue permissions, existing Coolify tag webhook and
  secrets, and explicit user approval for both merge and the later tag/deploy push.

## Open Questions & Assumptions

- **Question:** none.
- **Assumption:** `1.28.0` is the correct minor bump because the release adds a new
  game and a new parent control without breaking changes.
- **Assumption:** physical-device smoke remains an accepted gap, matching v1.27.0.
- **Assumption:** no Phase 6 debt is pulled into this release.
- **Assumption:** the existing tag-gated Coolify path remains the deployment source
  of truth.

## References

- [v1.27.0 release notes](docs/release-notes-v1.27.0.md)
- [v1.25.0 release precedent](../conductor/archive/20261123-release-v1-25-0/spec.md)
- [PR #109](https://github.com/mansyar/aby-little-lab/pull/109)
- [PR #110](https://github.com/mansyar/aby-little-lab/pull/110)
- [PR #111](https://github.com/mansyar/aby-little-lab/pull/111)
- [Issue #108](https://github.com/mansyar/aby-little-lab/issues/108)
- [Performance baseline](docs/perf-baseline.md)
