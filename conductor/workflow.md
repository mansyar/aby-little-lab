# Project Workflow

## Guiding Principles

1. **The plan is the source of truth.** Every phase, task, result, checkpoint,
   and evidence link lives in `plan.md`.
2. **The tech stack is deliberate.** A change to the stack is recorded in
   `tech-stack.md` before the implementation depends on it.
3. **Verification is agent-executed.** The phase subagent runs the configured
   checks and writes evidence. The user is not asked to manually verify routine
   work.
4. **Evidence over assertion.** A phase is complete only when the configured
   checks pass and the evidence file exists.
5. **No silent debt.** A finding is fixed, explicitly accepted with a reason, or
   tracked as an issue. It is never quietly ignored.
6. **Stay inside the phase contract.** `Touches` defines the expected blast
   radius. A required deviation is allowed, recorded, and reviewed.
7. **Non-interactive and CI-aware.** Prefer commands that terminate. Always pass
   `--run` (or `CI=true`) to Vitest; never leave a watch process running.
8. **The app must stay offline-first.** Any change that adds a runtime network
   dependency to the game shell is a product decision, not an implementation
   detail.

## Workflow Config

```yaml
project:
  type: "browser game / PWA (client-side)"
  languages: ["TypeScript", "HTML", "CSS", "JSON"]
commands:
  setup: "pnpm install --frozen-lockfile"
  dev: "pnpm dev"
  test: "pnpm test -- --run"
  coverage: "pnpm test:coverage"
  lint: "pnpm check"
  format: "pnpm format"
  typecheck: "pnpm typecheck"
  build: "pnpm build"
  verify_phase: "pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js"
coverage:
  gate: "lines 95 / functions 88 / branches 85 / statements 90"
  scope: "project"
verification:
  layers: ["static", "unit", "build-artifact", "smoke"]
  retry: 2
  manual_exceptions: ["Coolify deploy secrets", "real-device PWA install/landscape check"]
git:
  base_branch: "master"
  fetch: true
  commit_style: "conventional"
  task_commits: true
  phase_squash: true
review:
  strict: true
  issues:
    enabled: true
    auto_create: true
    min_severity: "medium"
    group_low: true
    labels: ["tech-debt", "conductor"]
pr:
  enabled: true
  tool: "gh"
  base: "master"
  watch_ci: true
  watch_timeout_minutes: 15
  merge_method: "merge"
```

## Development Commands

### Setup

```bash
pnpm install --frozen-lockfile
```

Node 22 and pnpm 11.7.0 are the CI-pinned versions; keep local versions at or
above them. Do not edit `pnpm-lock.yaml` by hand.

### Daily Development

```bash
# Start the dev server
pnpm dev

# Run tests once (never in watch mode inside a phase)
pnpm test -- --run

# Coverage with the configured thresholds
pnpm test:coverage

# Lint + format check (Biome)
pnpm check

# Rewrite formatting
pnpm format

# Typecheck
pnpm typecheck

# Production build
pnpm build
```

### Before Committing

```bash
pnpm check && pnpm typecheck && pnpm test -- --run
```

The full pre-phase-acceptance gate is:

```bash
pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js
```

### Boot Smoke Check

CI serves the built output and asserts the app boots. Reproduce it locally when
a phase touches boot, preload, PWA, or asset loading:

```bash
# bash
node node_modules/vite/bin/vite.js preview --port 4173 --strictPort &
sleep 3
node scripts/validate-boot.js
```

```powershell
# PowerShell
Start-Process -NoNewWindow node "node_modules/vite/bin/vite.js","preview","--port","4173","--strictPort"
Start-Sleep -Seconds 3
node scripts/validate-boot.js
```

Stop the preview server afterwards. Port 4173 must be free; if it is not, kill
the previous preview rather than changing the port, because the validator
assumes it.

## Phase & Task Workflow

Implementation is executed one phase at a time by a phase subagent. The primary
agent owns `plan.md`, `metadata.json`, the registry, and review artifacts.

### Task Lifecycle

1. Read the phase contract in `plan.md`, the relevant requirements in `spec.md`,
   and the applicable style guides in `conductor/code_styleguides/`.
2. Work through the phase's tasks in order.
3. Write or update the failing test before the implementation (this project is
   test-first; see the coverage gate below).
4. Implement the smallest change that satisfies the task.
5. Run the targeted checks for the task.
6. Commit the task with a conventional commit message.
7. Report the task's status and commit SHA to the primary agent.

The subagent does **not** edit `plan.md`. The primary marks tasks complete after
it accepts the phase.

### Deviations

- If the phase goal requires a file outside `Touches`, make the smallest
  necessary change and record it in the report under `deviations`.
- If the work requires a product or design decision, stop and report `blocked`.
- Do not silently expand scope, add a dependency, or migrate unrelated code.
- Do not "improve" adjacent code, comments, or formatting. Match the surrounding
  style even when you would write it differently.

### Phase Completion

1. Run the phase's `Verification` command exactly as written in `plan.md`.
2. Run `verify_phase` when it is configured and different from the phase command.
3. Run the boot smoke check when the phase touches boot, preload, PWA, or assets.
4. Write the evidence file using the configured evidence path.
5. Return the structured report to the primary agent.
6. Do not merge, rebase, reset, push, open a PR, or edit Conductor state files.

## Verification Strategy

### Layers

- **Static:** Biome lint/format check and `tsc --noEmit`.
- **Unit:** Vitest over `src/__tests__/**/*.test.ts` in `happy-dom`.
- **Build artifact:** production `vite build` plus `validate-bundle.js`
  (Phaser vendor chunk isolation) and `validate-pwa.js` (manifest, service
  worker, icons).
- **Smoke:** `validate-boot.js` against `vite preview` on port 4173.

No integration, contract, E2E, or visual-diff layer exists today. Do not add one
inside a track without a spec decision.

### Commands

| Layer | Command | Required |
| --- | --- | --- |
| static | `pnpm check` and `pnpm typecheck` | yes |
| unit | `pnpm test -- --run` | yes |
| coverage | `pnpm test:coverage` | yes |
| build-artifact | `pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js` | yes |
| smoke | `node scripts/validate-boot.js` (preview on :4173) | yes when boot/preload/PWA/assets change |

### Services and Fixtures

- **Services:** none in the app; `vite dev` (5173) and `vite preview` (4173) are
  the only local servers.
- **Containers:** none.
- **Database:** none. Persistence is `localStorage` via `src/utils/storage.ts`;
  tests stub it, they never touch a real store.
- **Fixtures/seed data:** in-test factories and the shared helpers in
  `src/__tests__/helpers/` (`phaserMock`, `sceneFlowHarness`, `gameScenes`,
  `matchMediaStub`).
- **Environment variables:** `__APP_VERSION__` is injected from `package.json` at
  build time. No `.env` file is required.
- **Start/stop commands:** start `pnpm dev` / `vite preview`; stop by killing the
  process. Nothing needs tearing down between phases.

### Pass Criteria

- Every required command exits `0`.
- Coverage stays at or above lines 95 / functions 88 / branches 85 /
  statements 90 across `src/**/*.ts` (excluding tests, `main.ts`, `src/types/**`,
  as configured in `vite.config.ts`).
- Every acceptance criterion has a test or a documented evidence artifact.
- No new Critical or High review findings remain.
- No new dependency is added without a `tech-stack.md` entry and bundle-size
  impact noted.

### Evidence

Write a report to:

```text
conductor/tracks/<track-id>/verification/phase-<n>.md
```

Include: title; track, phase, date, branch, base and head commits; result
(`verified`, `failed`, `blocked`, or `partial`); a commands table (layer,
command, exit, summary); an acceptance-criteria table (ID, criterion, evidence,
status); evidence paths; deviations; and notes. Put binaries, screenshots,
contact sheets, and large reports under `.conductor/evidence/`; that directory is
gitignored. The report itself is committed with the track.

### Fallback Ladder

1. Run the full configured layer.
2. If port 4173 is occupied, stop the stale preview and retry.
3. If a check still cannot run (for example a missing local browser for
   Playwright-based scripts), run the narrowest reliable subset and mark the
   phase `partial` with the reason.
4. Stop and ask the user only for credentials, hardware, or an external
   approval.

### Retry Policy

- A failed check may be fixed and re-run at most **2** times.
- If it still fails, report `failed` with the command and output.
- Never mark a phase `verified` when a required check did not run.

### Human-Only Exceptions

- **Coolify deploy secrets** (`COOLIFY_DEPLOY_WEBHOOK`, `COOLIFY_TOKEN`) exist
  only in GitHub Actions.
- **Real-device PWA check:** installing to the home screen, landscape lock, and
  fullscreen behavior need a physical tablet or phone. Follow
  `docs/device-testing-checklist.md`.
- **Release tagging** (`vX.Y.Z`) and pushing to `master` are human decisions.

## Quality Gates

Before a phase is accepted:

- [ ] Required tests pass
- [ ] Coverage gate is met (lines 95 / functions 88 / branches 85 / statements 90)
- [ ] `pnpm check` passes with no new warnings
- [ ] Typecheck passes
- [ ] Build passes
- [ ] Bundle and PWA validators pass
- [ ] Boot smoke check passes when boot/preload/PWA/assets changed
- [ ] Code follows `conductor/code_styleguides/`
- [ ] No secrets, credentials, analytics, ads, or PII are introduced
- [ ] Public behavior is documented when it changed (`README.md`, `docs/`)
- [ ] Evidence is written and linked in `plan.md`

## Commit Guidelines

### Message Format

```text
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat`: new feature or game behavior
- `fix`: bug fix
- `docs`: documentation only
- `style`: formatting or art-only changes
- `refactor`: behavior-preserving change
- `test`: tests only
- `chore`: maintenance, tooling, assets
- `conductor`: Conductor state, tracks, and checkpoints

### Examples

```bash
git commit -m "feat(hub): add paged tile grid with large hit areas"
git commit -m "fix(memory-match): keep flipped pair visible through mismatch delay"
git commit -m "test(hub): cover play-time lock state"
```

Task-level commits are made by the phase subagent. The primary squashes them
into one phase commit on acceptance, unless a foreign commit landed in the range.
The plan update is a separate state commit.

## Definition of Done

A track is complete when:

1. Every phase is `verified` with a checkpoint and evidence.
2. The integrated verification on the track branch passes.
3. Review is `PASS`, or every finding is fixed, accepted with a reason, or
   tracked as an issue. No Critical or High finding remains unresolved without an
   explicit user override recorded in `review.md`.
4. Post-review documentation sync is complete.
5. The registry and `metadata.json` show the track as complete.
6. The branch is pushed and a PR into `master` is open, or `pr_state:
   "unavailable"` records that PR creation could not run.

## Release & Deployment

Deployment is tag-driven and owned by CI.

1. Merge the track PR into `master`; CI runs the full quality gates on the merge.
2. Bump `version` in `package.json` (the app version shown in the parental
   Settings panel comes from it). Update `pnpm-lock.yaml` only through pnpm.
3. Tag `vX.Y.Z` and push the tag. Only strict semver tags deploy.
4. The deploy job asserts the tag points to a `master` commit, checks that both
   Coolify secrets are configured, then calls the Coolify deploy webhook.
5. Verify the deployed build on a real device: install prompt, offline reload,
   landscape lock, audio after the first tap.

A tag that is not on `master` lineage is refused by CI. Never force-push a tag to
work around the guard; cut a new one.

## Emergency Procedures

### Critical Bug in Production

1. Branch from `master` with a `fix/` branch.
2. Write a failing regression test.
3. Implement the minimal fix.
4. Run the full verification strategy, including the boot smoke check.
5. Open a PR immediately; do not batch unrelated work.

### Security Breach

1. Rotate the affected Coolify token or webhook.
2. Review Actions logs and deploy history.
3. Patch the vulnerability and cut a new tag.
4. Document the incident in the track archive.

### Corrupt Local Save

Parental Settings → Reset clears the profile store. A support flow can reproduce
this with `localStorage.clear()`. Never ship a migration that silently wipes
progress without recording it in the spec.

## Continuous Improvement

- Review this workflow after each track.
- Update commands and verification layers when tooling or CI changes.
- Record recurring review findings as process improvements.
- Keep the process as small as the project allows.
