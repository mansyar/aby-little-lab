# Track: CI/CD Quality Gates & Auto-Deploy via Coolify

## Phase 1: Baseline & CI Tooling Documentation

- [x] Task: Document CI/CD additions in tech-stack.md (bbccb2e)
  - [x] Add dated note (2026-08-02) — GitHub Actions as CI tooling; Node 22 + pnpm 11.7.0 (matches Dockerfile); workflow file location; trigger semantics (PR gates, master deploy)
- [x] Task: Establish local baseline for all four quality gates
  - [x] Run `pnpm run check` — confirm pass
  - [x] Run `CI=true pnpm test` — confirm all tests pass
  - [x] Run `pnpm run build` — confirm success
  - [x] Run `node scripts/validate-pwa.js` — confirm pass
  - [x] Record baseline results (versions, test counts) in plan notes

> **Phase 1 baseline (2026-08-02):** biome check clean (51 files); vitest 592 tests / 18 files passed; vite 8.1.5 build OK; validate-pwa 13/13 passed. Toolchain: pnpm 11.7.0 (corepack, matches Dockerfile), Node via corepack, Vitest 4.1.10. Note: `CI=true pnpm test` is bash syntax; on Windows PowerShell use `$env:CI='true'; pnpm test` (CI itself is bash-native, unaffected).
- [x] Task: Phase 1 Verification & Checkpoint (Refer to workflow.md) [checkpoint: 50fe1c6]

## Phase 2: Quality-Gates Workflow (`.github/workflows/ci.yml`)

- [ ] Task: Scaffold the GitHub Actions workflow
  - [ ] Create `.github/workflows/ci.yml` with triggers: `pull_request` (opened/synchronize/reopened) + `push` to `master`
  - [ ] Job on `ubuntu-latest` with `actions/checkout@v4`
  - [ ] Set up Node 22 (`actions/setup-node@v4`) + corepack pnpm (prepare `pnpm@11.7.0`)
  - [ ] pnpm store cache keyed on `pnpm-lock.yaml`
  - [ ] `pnpm install --frozen-lockfile`
  - [ ] Sequential gate steps: `pnpm run check` → `CI=true pnpm test` → `pnpm run build` → `node scripts/validate-pwa.js`
- [ ] Task: Validate workflow syntax & semantics
  - [ ] YAML parses cleanly (parser validation)
  - [ ] PR event path runs gates only — no deploy step at this phase
  - [ ] Gate commands reproduce the Phase 1 baseline locally
- [ ] Task: Phase 2 Verification & Checkpoint (Refer to workflow.md)

## Phase 3: Auto-Deploy Trigger via Coolify Webhook

- [ ] Task: Add deploy job gated to master
  - [ ] Deploy job condition: push to `refs/heads/master` only — structurally impossible on PR events
  - [ ] `needs: quality-gates` — deploy never runs without green gates
  - [ ] Fail-fast guard: clear error if `COOLIFY_DEPLOY_WEBHOOK` secret is missing
  - [ ] Webhook POST via curl with fail-on-non-2xx (`--fail-with-body`)
- [ ] Task: Verify deploy guarding logic
  - [ ] Static review: conditions, `needs`, and secret guard are correct
  - [ ] Document the required repository secret name (`COOLIFY_DEPLOY_WEBHOOK`) in workflow comments
- [ ] Task: Phase 3 Verification & Checkpoint (Refer to workflow.md)

## Phase 4: Documentation & Live Validation

- [ ] Task: Document CI/CD in README
  - [ ] Add "CI/CD" section: pipeline flow (PR gates → merge → auto-deploy), obtaining the Coolify Deploy Webhook URL, adding the GitHub secret, and branch-protection recommendation (require quality-gates check on `master`)
- [ ] Task: End-to-end live validation
  - [ ] Push feature branch + open PR → confirm gates run green
  - [ ] Add `COOLIFY_DEPLOY_WEBHOOK` secret (user action)
  - [ ] Merge PR → confirm deploy webhook fires exactly once and Coolify rebuilds from the repo Dockerfile
  - [ ] Confirm deployed site healthy (boot → hub → game start)
- [ ] Task: Phase 4 Verification & Checkpoint (Refer to workflow.md)

**TDD note:** This is a config/infra chore — TDD is impractical for YAML; verification is via the existing gate suite (reproduced locally and in CI), YAML parsing, and the live end-to-end run in Phase 4.
