# Release v1.27.0 — Specification

> Requirements are stable. Once an `FR`, `NFR`, or `AC` ID is approved, do not
> renumber it. If a requirement is removed, mark it `Withdrawn` instead of
> deleting it.

## Overview

- **Track ID:** `20261127-release-v1-27-0`
- **Type:** `chore`
- **Priority:** `high`
- **Branch:** `chore/20261127-release-v1-27-0`
- **Base:** `master` at `cf5f5a718133ace0e3d9fe055de29dbedf42107e`
- **Previous release:** `v1.26.1` at `ce88cb7bde29b70634590e64ed6e69533bf15bf2`

Package the four PRs merged since `v1.26.1` into a truthful, reviewed `v1.27.0`
release. Lead with the two parent-visible features — content variants reaching
play and adaptive-band visibility — while documenting the retention protocol and
pilot pack as unexecuted internal work. Reset the release baseline, verify the
exact candidate, and ship only through the established gated tag/deploy path.

## Problem / Motivation

PRs #102–#105 are merged into `master` but unavailable to families through a
tagged release. Two are parent-visible: signature content variants now reach real
playthroughs, and the Progress Overview surfaces the current adaptive-band
spread. Leaving them unreleased keeps that value behind `master`, leaves the
package version and release record stale, and delays the clean baseline needed
for the next roadmap feature.

The release must also preserve evidence boundaries. The retention protocol and
pilot pack have not been executed, browser coverage is emulated rather than
physical-device evidence, and the current band readout is not longitudinal
movement evidence.

## Goals & Success Metrics

- **Goal:** users receive PRs #104 and #105 through tagged `v1.27.0`.
- **Metric:** release notes cover PRs #102–#105 accurately and make no unsupported
  physical-device, retention, or longitudinal-band claims.
- **Metric:** origin tag `v1.27.0` points to merged `master`; PR, merge and tag CI
  and the Coolify deploy pass.
- **Metric:** the live app reports `1.27.0` and serves the locally verified release
  bundle.
- **Metric:** notes become `FINAL` only after deployment and live verification.

## Shipped Changes

In merge order:

1. **PR #102 — Retention validation proxy protocol:** consented local protocol
   and proxy definition. Recruitment was not executed.
2. **PR #103 — Retention pilot pack:** blank recruitment, consent, evidence and
   checklist materials. No families were contacted and no exports were read.
3. **PR #104 — Signature content variants in play:** the four existing variant
   packs now reach Word Match, Story Order, Shape Sorter and Feelings Faces, with
   full-pool fallbacks and preserved round, scoring, completion and adaptive-band
   behaviour.
4. **PR #105 — Current adaptive-band spread on Progress Overview:** assessed
   adaptive-game counts and easier/classic/harder spread, explicit disabled,
   sparse, all-classic and mixed states, viewed-profile derivation, and narrow
   layout wrapping. It does not claim persisted transitions or measure the
   two-week target.

## Scope

### In Scope

- Version metadata for `1.27.0`.
- New `docs/release-notes-v1.27.0.md`, initially `DRAFT`.
- README Documentation index and newest-first Releases row.
- README current-game-count truth corrections from 22/23 to 24.
- Measured release-candidate verification and living performance/count refreshes.
- Strict Conductor review, PR/merge, pre-authorized tag/deploy and final notes.
- Conductor evidence and archival state.

### Out of Scope

- New features, games, content, assets, translations, runtime source,
  dependencies, save schema, storage migration, network behaviour or gameplay
  changes.
- Retention recruitment, family contact, interviews, export reading or PII.
- Physical iOS Safari, Android Chrome, Fire tablet, install, landscape, offline,
  audio or first-tap validation.
- Any claim that the two-week adaptive-band target was measured.
- New roadmap items or retirement of unrelated roadmap entries.

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | `package.json` reads `"version": "1.27.0"`; frozen installation succeeds with no dependency drift. | must |
| FR-2 | New release notes follow the established structure and cover PRs #102–#105, leading with #104/#105 and labeling #102/#103 as internal/documentary and unexecuted. | must |
| FR-3 | README links the notes, adds the newest-first `v1.27.0` row, and corrects stale 22/23-game wording to 24 without rewriting historical release entries. | must |
| FR-4 | Release notes distinguish measured local checks, CI-emulated browsers, physical-device coverage and retention evidence; no unsupported claim is made. | must |
| FR-5 | Run the exact configured `verify_phase` chain and `pnpm install --frozen-lockfile` on the final release candidate; record actual results. | must |
| FR-6 | Run boot smoke, strict-header validation and headed first-tap measurement; require 50 cold / 0 warm samples, 10 per target game and every worst cold total ≤400 ms; refresh living perf truth if figures differ. | must |
| FR-7 | Run Chromium, WebKit, Firefox and mobile Chromium sequentially with zero local retries; record the discovered roster and first-attempt results. | must |
| FR-8 | Complete strict review, open the release PR, require green Quality Gates/browser jobs, and merge only with the configured method after explicit user approval. | must |
| FR-9 | Record targeted physical-device smoke as `SKIPPED — accepted gap`; no physical-device pass is claimed. | must |
| FR-10 | Under the owner's recorded pre-authorization, preflight and push immutable `v1.27.0` only after green merge/tag prerequisites; verify tag CI, Coolify, live URL, bundle hash/version, then finalize notes. | must |
| FR-11 | Never move or recreate a published tag; rollback after deployment requires a reviewed revert and a new patch version. | must |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | No runtime source, gameplay, asset, dependency, schema, storage or network change. Release work is version/docs/Conductor only. |
| NFR-2 | No gate, threshold, sample count, assertion, retry policy or validator is weakened. |
| NFR-3 | Release evidence uses measured release-state figures and clearly labels local, CI-emulated, physical-device and retention boundaries. |
| NFR-4 | Historical release notes, perf records, browser evidence and archived tracks remain intact. |
| NFR-5 | The tag is immutable once pushed; corrections require a new version. |
| NFR-6 | Rollback needs no data migration; before tag, revert the release PR; after deploy, use a reviewed revert plus patch release. |
| NFR-7 | Use CRLF-aware whitespace checking where needed; never normalize whole files or introduce mixed endings. |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | `package.json` is `1.27.0`; frozen install passes with no lockfile drift. | FR-1 |
| AC-2 | Notes accurately cover all four PRs, preserve the retention/device/longitudinal caveats, and reach `FINAL` only after deploy proof. | FR-2, FR-4, FR-10 |
| AC-3 | README contains the Documentation link, dated release row and correct 24-game wording. | FR-3 |
| AC-4 | Exact full gate exits 0 on the final candidate; suite, coverage, bundle, module, texture, PWA and docs figures are recorded. | FR-5 |
| AC-5 | Boot, headers and headed first tap pass; raw evidence is committed and perf truth refreshed if needed. | FR-6 |
| AC-6 | All four browser projects pass locally on first attempt with zero retries; actual roster is recorded. | FR-7 |
| AC-7 | Review is `PASS`; PR/merge CI is green; merge occurs only after explicit approval. | FR-8 |
| AC-8 | Device smoke is explicitly `SKIPPED — accepted gap`. | FR-9 |
| AC-9 | `v1.27.0` is on merged `master`; tag CI, Coolify and live build/version/hash verification pass; notes are `FINAL`. | FR-10 |
| AC-10 | No published tag is moved; rollback posture is recorded. | FR-11 |
| AC-11 | Final diff contains no runtime/asset/dependency/schema/storage change and no unsupported claims. | FR-4, NFR-1 |

## Edge Cases

- `v1.27.0` already exists locally or on origin: stop; never reuse or move it.
- `master` advances before materialization or tagging: refetch and reconfirm the
  release commit.
- Docs validation finds stale living counts: refresh only current truth; preserve
  historical records.
- A transient CI infrastructure failure occurs: diagnose and rerun the failed job
  without weakening checks.
- A real regression appears: stop for a separate bug/fix track rather than
  expanding release scope.
- First-tap or bundle figures differ: record fresh measurements and update living
  docs; never loosen the budget.
- Physical hardware is unavailable: retain the accepted gap.
- Deploy or live verification fails: stop before `FINAL`; never move the tag.
- Post-tag finalization is the established docs/Conductor-only direct-to-`master`
  exception; no force-push, reset or tag rewrite.

## Dependencies

- **Tracks:** none; PRs #102–#105 are already merged into `master`.
- **External:** GitHub Actions for CI, Coolify for tag-gated deployment, local
  Docker/Chromium and the release scripts. Physical iOS/Android/Fire hardware is
  optional and absent under the selected policy.

## Open Questions & Assumptions

- **Open questions:** none for this release-only scope.
- **Assumption:** a minor bump to `1.27.0` is correct because the release contains
  two parent-visible capabilities, not only fixes.
- **Assumption:** no `v1.27.0` tag currently exists locally or on origin.
- **Assumption:** the owner's “Pre-authorize with gates” answer is the explicit
  human authorization required by the workflow; Phase 5 still verifies every
  precondition and stops if any fails.
- **Assumption:** no physical-device evidence will be obtained; the release
  records `SKIPPED — accepted gap`.
- **Assumption:** no roadmap row matches this release track, so no roadmap row is
  retired at completion.
- **Assumption:** the release remains family-only, offline-first, English and free
  of runtime network dependencies.

## References

- [v1.26.1 specification](../archive/20261126-release-v1-26-1/spec.md)
- [v1.26.1 implementation plan](../archive/20261126-release-v1-26-1/plan.md)
- [v1.26.1 release notes](../../docs/release-notes-v1.26.1.md)
- [Release checklist](../../docs/release-checklist.md)
- [Device checklist](../../docs/device-testing-checklist.md)
- [Content-variants PR record](../archive/20261126-wire-content-variants/pr.md)
- [Progress-band PR record](../archive/20261127-progress-band-movement/pr.md)
- [Retention protocol](../../docs/retention-validation.md)
- [Retention pilot pack](../../docs/retention-pilot-pack.md)
- [Workflow](../workflow.md)
- [Product guidelines](../product-guidelines.md)
