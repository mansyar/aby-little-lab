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
- [x] **Task 1.3: Phase Verification & Checkpoint** (Refer to workflow.md)
  - [x] Verify phase scope via `git diff --name-only` vs previous checkpoint (scope: conductor track init + registry; no code files)
  - [x] Run gates (max 2 fix attempts); commit `conductor(checkpoint): Checkpoint end of Phase 1` + git notes; record `[checkpoint: sha]`
  - [x] `[checkpoint: 02bfd8c]`

## Phase 2 — Version Bump & Tag

- [x] **Task 2.1:** Bump version (release-checklist Step 3)
  - [x] `npm version 1.0.0 --no-git-tag-version` → `package.json`/lockfile show `1.0.0`
  - [x] Commit `chore(release): Bump version to 1.0.0` (`28da7a5`) + git notes
- [x] **Task 2.2:** Create tag (release-checklist Step 4)
  - [x] `git tag -a v1.0.0 -m 'Release v1.0.0: Initial PWA release'` → verify `git tag` shows `v1.0.0` (`d0e73bf`)
- [x] **Task 2.3: Phase Verification & Checkpoint** — verify tag + clean diff; checkpoint commit + git notes; record SHA
  - [x] `[checkpoint: 07834ea]`

## Phase 3 — Merge, Deploy & Verify

- [x] **Task 3.1:** Open PR `release/v1.0.0` → `master` (release-checklist Steps 1–2)
  - [x] `gh pr create` → PR #2; **Quality Gates** check passed (43s); Deploy correctly skipped on PR
- [x] **Task 3.2:** Merge PR; push tag
  - [x] Merged via API → `97d95b0` on `origin/master`; `v1.0.0` tag pushed (`d0e73bf`); remote `release/v1.0.0` deleted (gh `--delete-branch` failed due to 2nd worktree holding `master` — done manually)
- [x] **Task 3.3:** Verify auto-deploy (release-checklist Step 7)
  - [x] CI run `30722232904`: **Quality Gates ✓ (48s)** + **Deploy to Coolify ✓ (6s, webhook triggered)**
  - [x] Live URL `https://aby-little-lab.ansyar-world.top/` serves release build (asset hash `index-DPWHmQqT.js` matches local build)
- [x] **Task 3.4:** Post-deploy smoke on live URL
  - [x] HTTP checks: index/manifest/sw.js/registerSW/bgm.mp3 all 200; manifest name/standalone/landscape correct
  - [x] PWA install + offline gameplay: **manual** (needs real browser) — user verifies per checklist Step 7
  - [x] No failures → no rollback needed
- [x] **Task 3.5: Phase Verification & Checkpoint** — checkpoint commit + git notes; record SHA
  - [x] `[checkpoint: <pending sha>]`

## Phase 4 — Release Documentation & Sign-off

- [ ] **Task 4.1:** Complete `docs/release-checklist.md`
  - [ ] Mark pre/post-release items; record actual performance metrics (boot time, memory, fps) where measurable
- [ ] **Task 4.2:** Write release notes per template (v1.0.0 summary, 7 games, PWA features)
- [ ] **Task 4.3:** Final verification
  - [ ] `v1.0.0` tag → merged commit on `master`; checklist complete; docs committed
  - [ ] **Phase Verification & Checkpoint** + final `conductor(plan):` update recording all SHAs
