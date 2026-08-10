# Specification — v1.14.0 Release Execution

**Track ID:** `release-1.14.0_20260810` · **Type:** Chore / Release · **Status:** Approved

## Overview

Ship **Game 17 — Take Away** and the completed 17-game suite as **v1.14.0** through the established release process:

`release branch → release changes → local gates → PR/CI → master merge → annotated tag on master → tag-gated Coolify deployment → live and physical-device verification`

The 26 local commits ahead of `origin/master` at track creation are the intended unreleased delta. They will reach the remote only through the release branch and reviewed PR.

## Goals

### FR-1 — Validate the baseline

- Confirm the working tree, `master`, `origin/master`, `v1.13.0`, and exact unreleased commit range.
- Confirm Game 17 and its archived Conductor track are present.
- Run the five current quality gates: `pnpm run check`, `CI=true pnpm test`, `pnpm run build`, `node scripts/validate-pwa.js`, and `node scripts/validate-bundle.js`.

### FR-2 — Prepare v1.14.0

- Create `release/v1.14.0` from the completed local `master`.
- Bump the application version from `1.13.0` to `1.14.0`.
- Confirm the Settings footer derives `v1.14.0` from the package version.
- Make no gameplay or feature changes during normal release preparation.

### FR-3 — Finalize release documentation

- Rewrite the superseded `docs/release-notes-v1.14.0.md` as the actual Game 17 release notes.
- Replace the superseded v1.14.0 device record with a current execution record while retaining the historical fact that Parent Progress Insights shipped in v1.13.0.
- Add v1.14.0 preparation, deployment verification, and final sign-off sections to `docs/release-checklist.md`.
- Update other product/release documents only where the 17-game milestone creates a confirmed knowledge gap.

### FR-4 — Publish through the guarded pipeline

- Push `release/v1.14.0` and open a PR to `master`.
- Require the GitHub Actions Quality Gates to pass before merge.
- Merge the PR, then create the annotated `v1.14.0` tag on the resulting `master` commit.
- Push the tag and verify the master-lineage guard and Coolify deployment succeed.

### FR-5 — Verify production

- Confirm the live site, manifest, and service worker return successfully.
- Confirm the served bundle is current and exposes `v1.14.0`.
- Run a live smoke test covering the 17-tile Hub; Take Away load, six-round progression, gentle wrong-answer behavior, win, sticker, auto-return, and replay; Learning Progress updates; old-save migration; and console health.

### FR-6 — Verify physical devices

- Execute the established checklist on physical iOS/iPadOS and Android devices, covering the project's phone/tablet targets.
- Validate landscape layout, touch targets, Take Away, profile-specific sticker/progress persistence, install/update behavior, and offline relaunch.
- Record device details, results, issues, and final sign-off.

## Non-Functional Requirements

- **NFR-1:** Existing configured coverage thresholds remain satisfied.
- **NFR-2:** Bundle validation preserves the separate Phaser vendor chunk and shell-size budget.
- **NFR-3:** PWA validation passes completely.
- **NFR-4:** The release preserves local-only, per-profile data and supports existing saves without destructive migration.
- **NFR-5:** No secrets enter source, release notes, logs, or Conductor artifacts.
- **NFR-6:** Critical or High release defects block completion.
- **NFR-7:** A narrowly scoped release-blocking fix may enter this track only with explicit approval and regression coverage; otherwise, discovered defects become follow-up tracks.
- **NFR-8:** Tags are not moved or amended as normal workflow; any exceptional correction requires explicit approval.

## Acceptance Criteria

1. All intended local commits and release changes are merged into `origin/master` through the release PR.
2. The package/application version is `1.14.0`.
3. All five local gates and remote CI pass.
4. Annotated tag `v1.14.0` points to a commit on `master`.
5. The tag-gated Coolify deployment succeeds.
6. Production serves the current v1.14.0 PWA and all live smoke checks pass.
7. Physical iOS/iPadOS and Android verification is recorded and passes.
8. Release notes are FINAL; release and device checklists contain completed v1.14.0 records.
9. Conductor metadata, plan, registry, and archive state are finalized.

## Out of Scope

- New mini-games or gameplay enhancements.
- Cloud sync, accounts, authentication, or backend services.
- Changes to difficulty, reward, play-time, profile, or progress-report behavior.
- Unrelated refactoring or dependency upgrades.
- New analytics or child-data collection.
- Broad fixes unrelated to a release-blocking defect.

## References

- `conductor/product.md`
- `conductor/product-guidelines.md`
- `conductor/tech-stack.md`
- `conductor/workflow.md`
- `conductor/archive/take-away_20260810/`
- `conductor/archive/release-1.13.0_20260809/`
- `docs/release-checklist.md`
- `docs/device-testing-checklist.md`
- `docs/release-notes-v1.14.0.md` — superseded draft to replace
