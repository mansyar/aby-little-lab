# Spec: v1.1.0 Release Mechanics

## Overview

Execute the v1.1.0 release mechanics. All v1.1.0 feature work (Game 8 — Find the Letter, PWA install/update UX, parental settings expansion) is merged on `master` (`3544a0e`) with 706 tests green, but `package.json` is still `1.0.0`, no `v1.1.0` tag exists, and `docs/release-notes-v1.1.0.md` is still a Draft. This chore bumps the version, finalizes release docs, tags, deploys via the existing CI → Coolify pipeline, and performs automatable post-deploy verification.

## Functional Requirements

1. **Local quality gates** (baseline before any change): `pnpm run check`, `CI=true pnpm test`, `pnpm run build`, `node scripts/validate-pwa.js` — all green.
2. **Version bump:** `1.0.0 → 1.1.0` in `package.json` (via `npm version 1.1.0 --no-git-tag-version`). The `__APP_VERSION__` Vite define picks it up automatically for the Settings version footer — no code changes.
3. **Docs finalization:**
   - `docs/release-notes-v1.1.0.md`: flip from Draft to final, date it, reflect merged state; device testing noted as pending manual.
   - `docs/release-checklist.md`: mark v1.1.0 prep items now satisfied; update Final Sign-Off.
4. **Tag:** annotated tag `v1.1.0` ("Release v1.1.0: Find the Letter + PWA & parental settings refinements").
5. **Deploy:** push `master` + tag → CI Quality Gates → Coolify deploy webhook (secrets already configured).
6. **Post-deploy verification (automatable only):**
   - Live `index.html` returns 200 and its entry JS hash matches the local `dist` build.
   - `1.1.0` is embedded in the served bundle (version footer data).
   - Live `sw.js` + manifest return 200.
   - Record CI run ID with both jobs green.

## Acceptance Criteria

- `package.json` version is `1.1.0`, committed as `chore(release): Bump version to 1.1.0`.
- Release notes no longer Draft; checklist sign-off updated.
- Tag `v1.1.0` exists locally and on `origin`.
- CI run for the master push: Quality Gates + Deploy to Coolify both green (run ID recorded).
- Live URL serves the build whose entry hash matches local `dist`; `1.1.0` present in served bundle; live `sw.js`/manifest 200.
- **Zero production code changes** (chore only).

## Out of Scope

- Device testing (`docs/device-testing-checklist.md`) — executed manually by the user.
- New features, bug fixes, analytics.
- CI/CD config or branch-protection changes.

## Risks

- CI/deploy failure (e.g., missing secrets) — report and halt; no workaround attempted beyond one retry.
- Live-URL verification needs network access — skip gracefully with a note if unreachable.
