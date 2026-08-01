# Implementation Plan: v1.0.0 Release Execution

## Phase 1 — Prepare Release Branch & Final Gates

- [x] **Task 1.1:** Rename current branch to `release/v1.0.0`
  - [x] Pre-check: current branch in sync with `origin/master` + clean tree (verified: `d7ff3c3` = `origin/master`)
  - [x] `git branch -m release/v1.0.0` → verify: branch shows `* release/v1.0.0`
- [x] **Task 1.2:** Run final quality gates locally (release-checklist Step 2)
  - [x] `pnpm run check` → clean (biome: 51 files, no fixes)
  - [x] `CI=true pnpm test` → 592 passed / 18 files (use `$env:CI="true"; pnpm test` in PowerShell)
  - [x] `pnpm run build` → succeeds (chunk-size warning pre-existing, informational)
  - [x] `node scripts/validate-pwa.js` → 13/13 passed
  - [x] If any gate fails: fix with a proper commit (`fix: ...`), re-run gates; **never bypass** — no failures occurred
- [ ] **Task 1.3: Phase Verification & Checkpoint** (Refer to workflow.md)
  - [ ] Verify phase scope via `git diff --name-only` vs previous checkpoint
  - [ ] Run gates (max 2 fix attempts); commit `conductor(checkpoint): Checkpoint end of Phase 1` + git notes; record `[checkpoint: sha]`

## Phase 2 — Version Bump & Tag

- [ ] **Task 2.1:** Bump version (release-checklist Step 3)
  - [ ] `npm version 1.0.0 --no-git-tag-version` → `package.json`/lockfile show `1.0.0`
  - [ ] Commit `chore(release): Bump version to 1.0.0` + git notes
- [ ] **Task 2.2:** Create tag (release-checklist Step 4)
  - [ ] `git tag -a v1.0.0 -m 'Release v1.0.0: Initial PWA release'` → verify `git tag` shows `v1.0.0`
- [ ] **Task 2.3: Phase Verification & Checkpoint** — verify tag + clean diff; checkpoint commit + git notes; record SHA

## Phase 3 — Merge, Deploy & Verify

- [ ] **Task 3.1:** Open PR `release/v1.0.0` → `master` (release-checklist Steps 1–2)
  - [ ] `gh pr create`; wait for **Quality Gates** check green (check → test → build → validate-pwa)
- [ ] **Task 3.2:** Merge PR; push tag
  - [ ] Merge to `master`; `git push origin master` + `git push origin v1.0.0`; verify remote `master` HEAD = release commit
- [ ] **Task 3.3:** Verify auto-deploy (release-checklist Step 7)
  - [ ] CI **Deploy to Coolify** job green on merged push
  - [ ] Coolify shows new deployment; live URL loads release build (cache-busted SW)
- [ ] **Task 3.4:** Post-deploy smoke on live URL
  - [ ] PWA installable; offline gameplay after install
  - [ ] All 7 games launch; BGM + SFX audible; parental lock gates settings
  - [ ] Any failure → rollback per checklist procedure, fix in new commit, re-deploy
- [ ] **Task 3.5: Phase Verification & Checkpoint** — checkpoint commit + git notes; record SHA

## Phase 4 — Release Documentation & Sign-off

- [ ] **Task 4.1:** Complete `docs/release-checklist.md`
  - [ ] Mark pre/post-release items; record actual performance metrics (boot time, memory, fps) where measurable
- [ ] **Task 4.2:** Write release notes per template (v1.0.0 summary, 7 games, PWA features)
- [ ] **Task 4.3:** Final verification
  - [ ] `v1.0.0` tag → merged commit on `master`; checklist complete; docs committed
  - [ ] **Phase Verification & Checkpoint** + final `conductor(plan):` update recording all SHAs
