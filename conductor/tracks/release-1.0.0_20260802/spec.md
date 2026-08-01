# Specification: v1.0.0 Release Execution

## Overview

Execute the first official release of **Aby's Little Lab** following the process defined in `docs/release-checklist.md`. The app is feature-complete (7 games, PWA, CI/CD pipeline), but no release tag exists yet and the automated Coolify deploy has never been exercised end-to-end. This track ships `v1.0.0` and proves the full pipeline.

## Functional Requirements

1. **Release branch:** The current branch is renamed to `release/v1.0.0` (verified in sync with `origin/master`, clean tree).
2. **Final gates (local):** Run `pnpm run check`, `CI=true pnpm test`, `pnpm run build`, and `node scripts/validate-pwa.js` — all must pass.
3. **Version bump:** `npm version 1.0.0 --no-git-tag-version`, commit as `chore(release): Bump version to 1.0.0`.
4. **Tag:** Create annotated tag `v1.0.0` with message `Release v1.0.0: Initial PWA release`.
5. **Merge:** Open a PR from `release/v1.0.0` → `master` (branch protection requires the Quality Gates check); merge when CI is green. Push the `v1.0.0` tag.
6. **Deploy verification:** Confirm the merged `master` push ran **Quality Gates → Deploy to Coolify** green; Coolify shows a new deployment; the live URL loads with the new version.
7. **Post-deploy smoke:** Verify on the live URL: PWA install prompt, offline gameplay after install, all 7 games launch, audio (BGM + SFX) works, parental lock still gates settings.
8. **Documentation:** Fill in `docs/release-checklist.md` (mark completed items, record actual performance metrics where measurable) and prepare release notes using the template.

## Non-Functional Requirements

- **Safety:** No code changes beyond the version bump. If any gate fails, fix or halt — do not bypass gates.
- **Rollback readiness:** Rollback procedure per checklist (tag-based revert) available if live verification fails.

## Acceptance Criteria

- [ ] `git tag` contains `v1.0.0`, pointing at the merged release commit on `master`
- [ ] CI run for the merged push: Quality Gates + Deploy to Coolify both green
- [ ] Live URL serves the release build; PWA installable and playable offline
- [ ] Release notes written; release checklist items marked/annotated
- [ ] Any gate failure was fixed via code, never skipped

## Out of Scope

- Physical-device testing per `docs/device-testing-checklist.md` (performed manually post-release; failures become follow-up tracks)
- New features, analytics, or app-store distribution
