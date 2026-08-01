# Track: CI/CD Quality Gates & Auto-Deploy via Coolify

## Overview

The product is live on a VPS via Coolify, which builds the app from the repo's Dockerfile. There is currently **no CI**: every change reaches production without running the project's quality gates (592 tests, Biome check, production build, PWA validation). This track introduces a **GitHub Actions** pipeline that runs the full quality gate suite on feature-branch pull requests and, after merge to `master`, triggers Coolify's **Deploy Webhook** — so production updates *only* after all gates pass. Coolify's existing repo-Dockerfile build path remains unchanged.

## Functional Requirements

1. **CI workflow (`.github/workflows/ci.yml`)**
   - Triggers: `pull_request` (opened, synchronize, reopened) and `push` to `master`
   - Runner: `ubuntu-latest`, Node 22 via `actions/setup-node`, pnpm via corepack (matching the Dockerfile's `pnpm@11.7.0` + `--frozen-lockfile`)
   - Single "quality-gates" job, in order:
     - `pnpm run check` (Biome lint + format)
     - `CI=true pnpm test` (Vitest — all 592 tests)
     - `pnpm run build` (production build)
     - `node scripts/validate-pwa.js` (manifest + service worker + precache validation)
   - pnpm store caching to keep CI fast
2. **Deploy trigger**
   - After gates pass on a `master` push, fire the Coolify Deploy Webhook via `curl` (non-PR context only)
   - Webhook URL stored as repository secret `COOLIFY_DEPLOY_WEBHOOK`
   - Webhook call failure (non-2xx) fails the job with a clear message — no silent deploy loss
   - Guarded so the deploy step can never run on PR events
3. **Secrets & fail-fast**
   - Missing `COOLIFY_DEPLOY_WEBHOOK` on a `master` push fails the workflow with an explicit error message
4. **Documentation**
   - README: new "CI/CD" section — pipeline description, how to obtain the Coolify Deploy Webhook URL, how to add the secret, and branch-protection recommendation (`master` requires the quality-gates check before merge)

## Non-Functional Requirements

- **Zero app code changes** — pipeline/config/docs only
- Deterministic installs (lockfile), matching the Dockerfile build
- Fail-fast on any gate failure; no partial or unguarded deploys
- Reasonable CI wall time via dependency caching

## Acceptance Criteria

1. A PR from a feature branch shows the quality-gates job running all four commands; green = pass, red = fail
2. Push to `master` runs the same gates; on success the Coolify Deploy Webhook fires **exactly once** and the deployed site updates
3. A deliberately broken test on a feature branch blocks the PR and never triggers a deploy
4. README documents the pipeline, secret setup, and branch protection
5. All four gates pass locally as baseline sanity, and pass in CI

## Out of Scope

- Changing Coolify's build path (stays repo Dockerfile)
- Building/pushing Docker images to a registry (GHCR)
- Analytics, error monitoring, or notifications (Slack/Discord/email)
- Enforcing branch protection via GitHub API — documented only
- OS/Node version matrix testing
- Changes to `nginx.conf` / `Dockerfile` (unless CI exposes a defect)
