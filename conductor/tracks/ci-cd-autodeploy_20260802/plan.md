# Track: CI/CD Quality Gates & Auto-Deploy via Coolify

## Phase 1: Baseline & CI Tooling Documentation

- [ ] Task: Document CI/CD additions in tech-stack.md
  - [ ] Add dated note (2026-08-02) — GitHub Actions as CI tooling; Node 22 + pnpm 11.7.0 (matches Dockerfile); workflow file location; trigger semantics (PR gates, master deploy)
- [ ] Task: Establish local baseline for all four quality gates
  - [ ] Run `pnpm run check` — confirm pass
  - [ ] Run `CI=true pnpm test` — confirm all tests pass
  - [ ] Run `pnpm run build` — confirm success
  - [ ] Run `node scripts/validate-pwa.js` — confirm pass
  - [ ] Record baseline results (versions, test counts) in plan notes
- [ ] Task: Phase 1 Verification & Checkpoint (Refer to workflow.md)

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
