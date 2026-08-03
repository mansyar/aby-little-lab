# Spec: v1.4.0 Release Execution

- **Track ID:** `release-1.4.0_20260804`
- **Type:** Release
- **Status:** Approved

## Overview

Release Aby's Little Lab **v1.4.0 (Multi-Kid Profiles)** following the repo's established release convention: release branch → PR merge to `master` → automated pipeline (GitHub Actions Quality Gates → Coolify Deploy Webhook) → annotated tag → post-deploy verification. The feature work for this release (multi-kid profiles) is already merged, reviewed, and archived (`conductor/archive/multi-kid-profiles_20260804/`); this track performs the versioning, documentation finalization, and deployment mechanics only.

## Functional Requirements

1. **Baseline gates** — `pnpm run check` (0 errors), `CI=true pnpm test` (full suite green), `pnpm run build` (success), `node scripts/validate-pwa.js` (13/13) all pass before release.
2. **Version bump** — `package.json` version `1.3.0` → `1.4.0` via `npm version 1.4.0 --no-git-tag-version`; commit `chore(release): Bump version to 1.4.0`.
3. **Release documentation** —
   - `docs/release-notes-v1.4.0.md`: flip DRAFT → FINAL with release date and pipeline record.
   - `docs/release-checklist.md`: add v1.4.0 prep note, Step 7f deployment verification record, and Final Sign-Off v1.4.0 block.
   - `docs/device-testing-checklist.md`: add Execution Record v1.4.0 (devices: iPad, Android tablet, iPhone, Android phone — all passed) and update the Sign-Off block (date 2026-08-04).
   - `docs/TDD.md`: append v1.4.0 to the release-history note.
   - `docs/PRD.md`: update only if version-specific content exists (none found — no change expected).
4. **Release mechanics** — create `release/v1.4.0` branch, open PR, merge to `master` (CI Quality Gates green → Coolify deploy fires), push annotated tag `v1.4.0`.
5. **Post-deploy verification** — live URL 200; entry JS hash matches fresh local build (or content-verified for Docker artifacts); `1.4.0` embedded in served bundle (no stale `1.3.0`); `sw.js` + `manifest.webmanifest` 200; multi-kid profile code present in served bundle.

## Non-Functional Requirements

- No feature code changes in this track (any defect found → separate fix track).
- Docs must match the repo's established formats (see v1.3.0 release notes/checklist for templates).
- Commits follow the conventional format with git notes per `workflow.md`.

## Acceptance Criteria

- [ ] `package.json` shows `"version": "1.4.0"` and the served bundle embeds `1.4.0`
- [ ] `docs/release-notes-v1.4.0.md` status is FINAL
- [ ] `docs/release-checklist.md` contains the v1.4.0 prep note, Step 7f record, and Final Sign-Off
- [ ] `docs/device-testing-checklist.md` contains the v1.4.0 Execution Record (all 4 devices passed) and updated Sign-Off
- [ ] `docs/TDD.md` release history includes v1.4.0
- [ ] PR merged to `master`; CI run green (Quality Gates + Deploy to Coolify)
- [ ] Annotated tag `v1.4.0` pushed
- [ ] Live URL serves the v1.4.0 build with profiles code; `sw.js`/manifest 200
- [ ] Track reviewed, completed, and archived per Conductor protocol

## Out of Scope

- New features, bug fixes, or refactors (separate tracks)
- Content/word-pool changes (separate tracks)
- Anything not required to ship the already-built v1.4.0 feature set
