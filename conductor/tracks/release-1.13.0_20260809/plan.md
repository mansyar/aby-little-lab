# Implementation Plan — v1.13.0 Release Execution

**Track ID:** `release-1.13.0_20260809` · **Type:** Chore
**Methodology:** release process per `docs/release-checklist.md`; phases per `conductor/workflow.md` (checkpoint protocol at each phase end). TDD not applicable — verification via existing gates and checklist execution.

## Phase 1 — Baseline Validation

- [ ] Task 1.1: Confirm master state — HEAD = add-it-up archive commit; working tree clean; push state recorded (`git status --short --branch`, `git log --oneline origin/master..HEAD`)
- [ ] Task 1.2: Run full quality gates on master (CI order): `pnpm run check` → `CI=true pnpm test` → `pnpm run build` → `node scripts/validate-pwa.js` → `node scripts/validate-bundle.js`
- [ ] Task 1.3: Confirm no stale version references (`1.12.0` not lingering in src beyond pkg.version; `__APP_VERSION__` reads pkg.version; SettingsPanel footer `v${__APP_VERSION__}`)
- [ ] Task 1.4: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2 — Release Branch & Version Bump

- [ ] Task 2.1: Create release branch `git checkout -b release/v1.13.0` from master
- [ ] Task 2.2: Bump version `npm version 1.13.0 --no-git-tag-version`
  - [ ] Verify `package.json` version = 1.13.0 (no lockfile churn)
  - [ ] Verify `__APP_VERSION__` footer source picks it up (vite.config.ts reads pkg.version)
- [ ] Task 2.3: Commit: `chore(release): Bump version to 1.13.0`
- [ ] Task 2.4: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3 — Release Documentation

- [ ] Task 3.1: Draft `docs/release-notes-v1.13.0.md` (template: What's New / Improvements / Bug Fixes / Known Issues / Installation / Feedback) covering Game 15 (Color Match), Game 16 (Add It Up), and Performance & Bundle Hardening — written as DRAFT (FINAL in Phase 7); carried known issues (cross-device sync, system-font letterforms); must not cover Parent Progress Insights
- [ ] Task 3.2: Update `docs/device-testing-checklist.md` — extend the existing v1.13.0 record with Game 15 (Color Match) rows + Game 16 (Add It Up) rows alongside the perf rows; result marked pending user execution (Phase 6)
- [ ] Task 3.3: Verify knowledge docs already synced by the three tracks (`conductor/tech-stack.md`, `conductor/product.md`, `docs/TDD.md`, `docs/PRD.md`, `README.md`) — patch real gaps only
- [ ] Task 3.4: Commit: `docs(release): Prepare v1.13.0 release notes and device checklist`
- [ ] Task 3.5: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 4 — Release Branch Gates + Tag + PR

- [ ] Task 4.1: Re-run all five gates on `release/v1.13.0` (check → test → build → validate-pwa → validate-bundle)
- [ ] Task 4.2: Create annotated tag `git tag -a v1.13.0 -m "Release v1.13.0 — Games 15 & 16 (Color Match, Add It Up) + Performance & Bundle Hardening"`; push tag to origin
- [ ] Task 4.3: Push branch; open PR `release/v1.13.0` → `master` (body = release notes summary); confirm Quality Gates PASS on PR, Deploy skipped (tag-guard by design)
- [ ] Task 4.4: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 5 — Merge, Deploy & Verify

- [ ] Task 5.1: Merge PR to master; confirm the three tracks' commits land on `origin/master`; tag run triggers Coolify auto-deploy webhook (Bearer `$COOLIFY_TOKEN`)
- [ ] Task 5.2: Verify deployment — master CI run + tag CI run (Quality Gates + Deploy to Coolify PASS); live serves `assets/index-*.js` with SHA256 identical to local `dist/`; `/sw.js` 200 + precaches new bundle; `/manifest.webmanifest` 200; `1.13.0` embedded in served bundle (footer), no stale `1.12.0` strings
- [ ] Task 5.3: Live smoke test: boot → hub (16 tiles, 5×3 + 1) → Color Match spot check (swatch prompt + spoken color name, 2×2 grid, 6 rounds) → Add It Up spot check (equation row + "+" cue + 4 answer cards, no speech) → Settings (footer v1.13.0) → hub; zero console errors
- [ ] Task 5.4: Record deployment verification in `docs/release-checklist.md` (Step 7m + Final Sign-Off — v1.13.0 block; device testing marked pending user execution)
- [ ] Task 5.5: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 6 — Targeted Device Testing (user-led, async)

- [ ] Task 6.1: Prepare the v1.13.0 checklist record for execution (Game 15 rows + Game 16 rows + perf rows + carried rows) — conductor-prepared in Phase 3; **user executes** on iPad / Android tablet / iPhone / Android phone against the live URL at their convenience
- [ ] Task 6.2: Record results when the user reports them; triage findings — document accepted issues in Known Issues; escalate blockers to user (max 2 fix attempts per workflow if a hotfix is approved)
- [ ] Task 6.3: Commit results: `docs(device): Record v1.13.0 device testing results` (when the user reports)
- [ ] Task 6.4: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 7 — Finalize & Archive

- [ ] Task 7.1: Final gates on master if any post-merge changes occurred
- [ ] Task 7.2: Finalize release notes status to FINAL; mark all plan tasks complete; update `docs/release-checklist.md` Final Sign-Off block (version v1.13.0, tests, release manager)
- [ ] Task 7.3: Archive track folder to `conductor/archive/release-1.13.0_20260809/` (via git mv)
- [ ] Task 7.4: Commit: `chore(conductor): Archive track 'v1.13.0 Release Execution'`; registry updated to (Archived)
- [ ] Task 7.5: Phase Verification & Checkpoint (Refer to workflow.md)
