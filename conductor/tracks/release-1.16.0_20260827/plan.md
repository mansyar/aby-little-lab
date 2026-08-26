# Implementation Plan — v1.16.0 Release Execution

**Track:** `release-1.16.0_20260827` · **Branch:** `release/v1.16.0` · **Base:** `v1.15.0` → `origin/master@df19f37` (52 commits, 38 non-Conductor files, +2664)

## Methodology

- **TDD where applicable (workflow.md):** Pure release-execution tasks (gates, docs, PR/merge, tag/deploy, hygiene) are verification-gated, not TDD. FR-2 (Ligne offline-first caching change) is TDD/regression-first: the validator contract change is the failing gate (Red) before the `vite.config.ts` config change (Green), followed by full-gate confirmation.
- **Phase → Task → Sub-task hierarchy.** A task in progress is marked `[~]`, done marks `[x]` in commit. `conductor-status` at each Phase Verification & Checkpoint.

---

## Phase 1 — Baseline and Unreleased-Delta Validation

Confirm the starting state so the release delta is unambiguous before touching code.

- [x] Task: Verify repository and tag state
  - [x] Confirm `git status --short` clean on `release/v1.16.0`; `git branch` shows `release/v1.16.0` checked out; `git branch -r` shows `origin/master`.
  - [x] Confirm `git log -1 --format="%h %ci %s" v1.15.0` is `1a10c60` @ 2026-08-24; confirm `v1.16.0` tag does **not** exist (`git tag --list v1.16.0` empty).
  - [x] Record `git log --oneline v1.15.0..origin/master --not --remotes` count (expected 52) and `git diff --stat v1.15.0..origin/master -- src` shape (38 files +2664) in track working notes.
  - [x] **Baseline note (recorded 2026-08-27):** `origin/master` = `73343f5` (12 commits past `v1.15.0` tag = the v1.15.0 release-execution records). UI/UX Cohesion is local-only. PR delta `origin/master..release/v1.16.0` = **42 commits / 36 non-Conductor files / 35 src files (+2639/−81)** — the 40-commit UI/UX Cohesion batch + the 2 conductor track commits (init + in-progress).
  - [x] Fetch remote: `git fetch --prune --tags` succeeds and shows no unexpected divergence.
- [x] Task: Confirm Cohesion implementation is present
  - [x] Verify `conductor/archive/ui-ux-cohesion_20260826/` exists and is archived complete.
  - [x] Spot-check Cohesion sources: `src/utils/pressFeedback.ts`, `src/components/SpeakerButton.ts`, `src/scenes/HubScene.ts`, `src/components/SettingsPanel.ts` contain the Cohesion changes (diff vs `v1.15.0`).
  - [x] Open `docs/release-notes-v1.15.0.md` and confirm the Ligne offline known issue is the only open item being resolved by this release.
- [x] Task: Run baseline quality gates (record evidence; gates must pass before proceeding)
  - [x] `pnpm run check` — **PASS**: 137 files checked, 0 errors, 0 fixes; 1 benign info (biome schema 2.5.5 vs CLI 2.5.10 mismatch).
  - [x] `CI=true pnpm test` — **PASS**: 64 files / **1568 tests passed**, duration ~106s, thresholds (95/88/85/90) satisfied.
  - [x] `pnpm run build` — **PASS**: built in 2.65s; precache **45 entries (1711.46 KiB)**; shell `index-*.js` 161.06 kB (gzip 30.13 kB); Phaser vendor `phaser-P1E8uaLi.js` 1374.82 kB separate; `ligne_wasm-Bzdj-wlA.js` lazy 32.04 kB.
  - [x] `node scripts/validate-pwa.js` — **PASS: 16/16** (incl. current "excludes Ligne WASM from precache" + "runtime-caches Ligne WASM").
  - [x] `node scripts/validate-bundle.js` — **PASS**: vendor present `phaser-P1E8uaLi.js` (1342.6 kB); shell `index-BvhT7VZn.js` 157.3 kB ≤ 200 kB.
- [x] Task: Phase Verification & Checkpoint — Phase 1
  - [x] All Phase 1 evidence recorded; no unexpected findings (origin/master baseline clarified: UI/UX Cohesion is local-only, as expected for release-branch flow); `conductor(plan): Mark phase 'Phase 1 - Baseline and Unreleased-Delta Validation' as complete`.
  - [x] **Checkpoint:** `7c6e7ce` (conductor(checkpoint) + git note).

---

## Phase 2 — Ligne Offline-First Mascot Fix (TDD / Regression-First)

Make the Hoot mascot available offline on first install by moving the engine from runtime to precache, without regressing boot or Ligne behavior.

- [ ] Task: Establish the failing gate (Red) — update `scripts/validate-pwa.js` to the new offline-first contract
  - [ ] Replace the three legacy checks:
    - `includes .ligne in precache` → **also** asserts `includes ligne_wasm_bg-*.wasm in precache`.
    - `excludes lijn_wasm_bg from precache` → **removed** (now included).
    - `runtime-caches ligne-engine-wasm CacheFirst` → **removed** (no longer runtime-cached).
  - [ ] Re-run `pnpm run build` then `node scripts/validate-pwa.js` — **fails** on the new wasm-in-precache check (expected 13/15) — capture output as Red-phase evidence. Do not proceed until the gate fails for the right reason.
  - [ ] Confirm the test failure is exactly the precache contract, not a build break.
- [ ] Task: Implement minimal config change (Green) — precache the WASM engine
  - [ ] Update `vite.config.ts`: `workbox.globPatterns: "**/*.{js,css,html,ico,png,svg,woff2,ligne,wasm}"` (or `assets/**/*.{ligne,wasm}`-scoped if narrower), **remove** `runtimeCaching` entry for `ligne_wasm_bg-*.wasm`, and if needed set `maximumFileSizeToCacheInBytes: 3 * 1024 * 1024` (since the ~645 kB gz ≈ 1.8–2.1 MB raw exceeds Workbox's 2 MiB default) — keep comment explaining the limit.
  - [ ] Re-run `pnpm run build` + `node scripts/validate-pwa.js` — **passes** (expected 15/15 with the new assertions) — capture as Green-phase evidence.
  - [ ] Verify `dist/sw.js` precache manifest contains `ligne_wasm_bg-*.wasm` alongside `assets/hoot.ligne` and that `runtimeCaching` no longer mentions it.
- [ ] Task: Verify bundle, cache, and boot budget
  - [ ] Record: `assets/ligne_wasm_bg-*.wasm` raw size + gz size, precache total entries + total bytes before vs after, install-download delta, and that `shell` and Phaser `vendor` chunk sizes/identities are unchanged.
  - [ ] Verify line-engine remains a lazy separate chunk (only loaded by `activateLigneMascot`), boot stays non-blocking (no WASM fetch until `requestAnimationFrame` post-boot), and `LIGNE_LOAD_TIMEOUT_MS=10000` tween fallback still applies.
- [ ] Task: Run full quality gates on the fixed state
  - [ ] `pnpm run check`, `CI=true pnpm test`, `pnpm run build`, both validators — all pass; thresholds still met; no new test failures; record per-validator logs.
  - [ ] Add `Biome:verify` and `Typecheck:verify` where applicable per workflow.
- [ ] Task: Commit the fix
  - [ ] Stage `vite.config.ts`, `scripts/validate-pwa.js`, `conductor/tracks/release-1.16.0_20260827/spec.md` if changed, and any docs touched only by this phase. Commit message: `fix(pwa): precache Ligne WASM engine for offline-first Hoot`.
  - [ ] Attach/verify git note with the Phase 2 validator diff and `dist/sw.js` precache excerpt; record SHA.
- [ ] Task: Phase Verification & Checkpoint — Phase 2
  - [ ] `conductor(plan): Mark phase 'Phase 2 - Ligne Offline-First Mascot Fix' as complete` and checkpoint.

---

## Phase 3 — Release Branch and Version Preparation

Prepare the release branch with the version bump using the established mechanism.

- [ ] Task: Verify `release/v1.16.0` branch base
  - [ ] `git branch -vv` shows `release/v1.16.0` tracks `origin/master@df19f37` plus Phase 2 commits only; `git log --oneline v1.15.0..HEAD` reflects Cohesion + Ligne fix.
  - [ ] Confirm the branch already exists from track initialization; if rebased or recreated, document the new base SHA.
- [ ] Task: Bump version `1.15.0 → 1.16.0`
  - [ ] Run `npm version 1.16.0 --no-git-tag-version` (established per release-1.14.0) to update `package.json` and `package-lock.json`/`pnpm-lock.yaml` accordingly without creating a tag.
  - [ ] Verify `__APP_VERSION__` (Vite `define` from `package.json`) will serve `1.16.0`; confirm Settings footer renders `v{version}` — checked in `src/components/SettingsPanel.ts` path.
  - [ ] Commit: `chore(release): bump version to 1.16.0` on `release/v1.16.0`; record SHA.
- [ ] Task: Phase Verification & Checkpoint — Phase 3
  - [ ] `conductor(plan): Mark phase 'Phase 3 - Release Branch and Version Preparation' as complete` and checkpoint.

---

## Phase 4 — Release Documentation (DRAFT)

Create and audit all release-facing documentation in DRAFT state; finalize numbers only after live verification.

- [ ] Task: Create `docs/release-notes-v1.16.0.md` (DRAFT)
  - [ ] Sections: What's New — **UI/UX Cohesion** (shared press feedback, speaker visual states active/muted/unavailable, Settings & Learning Progress affordances, Hub tile hierarchy + active-profile rings) + **offline-first Hoot fix**; Improvements; Bug Fixes (v1.15.0 Ligne offline known issue resolved); Known Issues — remove the Ligne offline entry, retain only the accepted per-device storage / cloud-sync-out-of-scope note; Installation; Feedback. Mark header `DRAFT — pending production verification`.
  - [ ] Update any explicit version table entry in `docs/release-notes-v1.16.0.md` (and `README.md`'s version badge/table if present) to `1.16.0`.
- [ ] Task: Stage `docs/device-testing-checklist.md` — add a new v1.16.0 execution record section (all four classes pending, plus offline-relaunch-with-Ligne rows), including `prefers-reduced-motion` and console-health rows.
- [ ] Task: Stage `docs/release-checklist.md` — add v1.16.0 preparation, deployment-verification, and sign-off sections mirroring the house release tracks (quality gates, validators, deployment, live checks).
- [ ] Task: Audit other product docs
  - [ ] Scan `conductor/product.md`, `conductor/tech-stack.md` (PWA cache table), `README.md`, `docs/PRD.md`, `docs/TDD.md` for stale references to "Ligne offline first-visit fallback is expected" or stale version numbers and patch only confirmed gaps.
  - [ ] Update `conductor/tech-stack.md` Ligne/pilot "Current phase" line if it still reads as pilot-only (optional — only if stale).
- [ ] Task: Commit documentation
  - [ ] `docs(release): draft v1.16.0 release notes and checklists`.
- [ ] Task: Phase Verification & Checkpoint — Phase 4
  - [ ] `conductor(plan): Mark phase 'Phase 4 - Release Documentation (DRAFT)' as complete` and checkpoint.

---

## Phase 5 — Release-Candidate Quality Gates

Run the complete gate set on the final RC (Cohesion + Ligne fix + version + docs) and archive evidence before the PR.

- [ ] Task: Run the five gates in CI order on `release/v1.16.0` — capture full logs for the track record
  - [ ] `pnpm run check` → record "Checked 125+ files in … No fixes applied."
  - [ ] `CI=true pnpm test` → record passed suites/tests and thresholds.
  - [ ] `pnpm run build` → record chunk sizes, lazy chunks, precache entries/size (now inclusive of WASM), built time.
  - [ ] `node scripts/validate-pwa.js` → record 15/15 with new contract.
  - [ ] `node scripts/validate-bundle.js` → record 3/3.
- [ ] Task: Confirm version propagation
  - [ ] Verify `dist/` bundle contains `1.16.0` where versioned and that the served `sw.js` precache names reflect the new build.
  - [ ] Verify the Ligne offline contract holds in the built artifact: `dist/sw.js` lists `ligne_wasm_bg-*.wasm` in precache, no RuntimeCaching for it.
- [ ] Task: Phase Verification & Checkpoint — Phase 5
  - [ ] Aggregate gate evidence into Conductor notes; `conductor(plan): Mark phase 'Phase 5 - Release-Candidate Quality Gates' as complete` and checkpoint `Checkpoint end of Phase 5 — Release Candidate`.

---

## Phase 6 — Pull Request and Merge to Master

Publish the release through the guarded pipeline; no commits bypass the PR.

- [ ] Task: Push `release/v1.16.0` to `origin` (`git push -u origin release/v1.16.0`)
  - [ ] Record remote ref `origin/release/v1.16.0` SHA and fetch prune output.
- [ ] Task: Open PR `release/v1.16.0 → master`
  - [ ] Title: `Release v1.16.0 — UI/UX Cohesion + Ligne Offline-First Hoot`; body cites base `v1.15.0` and links to track spec/plan, notes the WASM-precache contract change, and references the RC gate evidence.
  - [ ] Request review; do not self-merge without review.
  - [ ] Record PR number and URL.
- [ ] Task: Wait for GitHub Actions Quality Gates to pass on the PR
  - [ ] Record the run ID/URL (e.g., `GHA run https://github.com/.../actions/runs/... passed`).
  - [ ] If any check fails, fix on `release/v1.16.0`, re-push, and re-record.
- [ ] Task: Merge the PR to `master`
  - [ ] Merge strategy: per house convention (Merge commit — preserve release-branch history) or squash only if approved; never rebase master history.
  - [ ] Record the merge commit SHA on `master`.
  - [ ] Fast-forward local `master`: `git switch master && git pull origin master` and confirm it contains the merge.
- [ ] Task: Phase Verification & Checkpoint — Phase 6
  - [ ] `conductor(plan): Mark phase 'Phase 6 - Pull Request and Merge to Master' as complete` and checkpoint `Checkpoint end of Phase 6`.

---

## Phase 7 — Tag and Production Deployment

Create the release tag on the merged master and verify the tag-gated deployment.

- [ ] Task: Create annotated tag `v1.16.0`
  - [ ] `git tag -a v1.16.0 <master-merge-SHA> -m "chore(release): v1.16.0 — UI/UX Cohesion + Ligne offline-first Hoot"`
  - [ ] Verify `git show v1.16.0` and `git log -1 --format="%h %ci %s" v1.16.0` — tag must be on `master` lineage, not on the release branch.
  - [ ] Run the master-lineage guard check used by CI (assert `git merge-base --is-ancestor v1.16.0 master` true and tag reachable from `origin/master`).
- [ ] Task: Push the tag and trigger deployment
  - [ ] `git push origin v1.16.0`
  - [ ] Confirm GitHub Actions detects the tag push and runs the expected release workflow (tag-gated).
  - [ ] Confirm Coolify reports success for the `v1.16.0` deployment; record the deployment run URL and Coolify deployment ID/log lines.
- [ ] Task: Phase Verification & Checkpoint — Phase 7
  - [ ] Record tag SHA, workflow run, and deployment outcome; `conductor(plan): Mark phase 'Phase 7 - Tag and Production Deployment' as complete` and checkpoint.

---

## Phase 8 — Live Smoke and Physical-Device Verification

Confirm production truly serves v1.16.0 across browsers, devices, and offline modes.

- [ ] Task: Verify deployment payload
  - [ ] Fetch `/` (live site), `/sw.js`, `/manifest.webmanifest` — all 200.
  - [ ] Confirm the served app reports `v1.16.0` (Settings footer / `__APP_VERSION__`) — **not** `v1.15.0`; grep the served bundle for the version if needed.
  - [ ] Confirm `sw.js` precache manifest lists `ligne_wasm_bg-*.wasm` (and `assets/hoot.ligne`) and that the prefetched entries match the last `pnpm run build` output.
- [ ] Task: Live smoke test — desktop (automated + manual)
  - [ ] Use `playwright-cli` to launch live site: navigate Hub (18 tiles), exercise each Cohesion behavior (tap press-feedback, speaker state cycle active→muted→unavailable, profile rings), complete a short game, verify Settings footer shows `1.16.0`, check console — record evidence.
  - [ ] Disable network and **offline-relaunch**: with no cache priming beyond install, reload Hub and a game scene — **Ligne-animated Hoot appears** (non-reduced-motion). Enable reduced motion emulation — **tween Hoot appears, no WASM fetch** (accepted behavior).
  - [ ] Confirm no `404`/`Failed to fetch` for engine or mascot assets in the network log.
- [ ] Task: Physical-device verification — 4-class matrix
  - [ ] Execute `docs/device-testing-checklist.md` per-class steps on:
    - [ ] iPad (Safari + Chrome/WebKit) on iPadOS
    - [ ] iPhone (Safari) on iOS
    - [ ] Android tablet (Chrome)
    - [ ] Android phone (Chrome)
  - [ ] Per device, cover: landscape FIT scaling, touch-target sizes, press-feedback visible on all child tap controls, speaker state visuals correct per availability, Settings & Progress affordances, per-profile sticker/progress persistence, **offline relaunch → Ligne Hoot (non-RM)** and **tween Hoot (RM)**, console health — record device/OS/browser and pass/fail per row.
  - [ ] Any blocker (Critical/High) becomes a follow-up track; Medium/Low may be noted without blocking the release.
- [ ] Task: Promote and finalize documentation with live evidence
  - [ ] Promote `docs/release-notes-v1.16.0.md` from DRAFT → FINAL (stamp deployment run, Coolify ID, live verification date, device sign-off).
  - [ ] Fill `docs/device-testing-checklist.md` v1.16.0 execution record with device rows + sign-off.
  - [ ] Fill `docs/release-checklist.md` deployment-verification and sign-off sections.
  - [ ] Commit on `master` (or on `release/v1.16.0` and forward-merge if still before tag — but since tag already moved forward, commit directly on `master` and confirm gates still green): `docs(release): record v1.16.0 live and device verification`.
- [ ] Task: Phase Verification & Checkpoint — Phase 8
  - [ ] Aggregate live + device evidence; `conductor(plan): Mark phase 'Phase 8 - Live Smoke and Physical-Device Verification' as complete` and checkpoint.

---

## Phase 9 — Branch Hygiene (Full Cleanup, Local + Remote)

Remove every stale branch whose content is preserved via master, tags, and Conductor archives.

- [ ] Task: Local worktree and branch cleanup
  - [ ] Remove the orphaned worktree: `git worktree remove C:/Users/Ansyar/.local/share/opencode/worktree/b9550f698a1b7fda544c2dad5483a8a1dedffae6/hidden-river --force` (or `git worktree prune` if already removed), verify `git worktree list` no longer lists `hidden-river`.
  - [ ] Verify each stale local branch's content is individually reachable before deletion (assert `git branch --contains` or `git log --oneline <branch> --not master` shows only superseded/release-track commits already in master, tags, or archives — use `git branch --merged master` / `git branch --no-merged master` checks).
  - [ ] Delete the local branches (force-delete only those with non-merged but intentionally superseded commits, justifying each in the commit body):
    ```
    git branch -D fix/ipad-black-screen feat/game-12 feat/game-13 feat/game-14 feat/game-17 \
      feat/parental-settings-expansion ci/fix-deploy-checkout ci/tag-deploy-guard \
      fix/speaker-button-tts hotfix/more-less-arrow release/v1.6.0 release/v1.7.0 \
      release/v1.8.0 release/v1.10.0 release/v1.11.0 release/v1.12.0 release/v1.13.0 release/v1.14.0
    ```
  - [ ] Verify `git branch` now shows only `master`, `release/v1.16.0`, and active work; no stale locals remain.
- [ ] Task: Remote branch cleanup
  - [ ] `git fetch --prune origin` then verify remote stale list via `git branch -r`.
  - [ ] For each remote that exists, delete via:
    ```
    git push origin --delete ci/fix-deploy-checkout ci/tag-deploy-guard feat/game-12 feat/game-13 \
      fix/speaker-button-tts release/v1.6.0 release/v1.7.0 release/v1.8.0 release/v1.10.0 \
      release/v1.11.0 release/v1.12.0 release/v1.13.0 release/v1.14.0
    ```
    (skip any `feat/game-*` that has no remote counterpart; record which were present vs already gone).
  - [ ] `git fetch --prune origin` and confirm `git branch -r` shows only `origin/master` (and `origin/release/v1.16.0` until deleted after merge — if protocol keeps it, keep it; otherwise delete it too post-merge with approval).
  - [ ] Confirm no stale remote PR base refs remain; existing PRs already merged retain their tags/history.
- [ ] Task: Record hygiene
  - [ ] Capture before/after `git branch -a` and `git worktree list` outputs in the hygiene commit body.
  - [ ] Commit on the current release line (or `master` if hygiene runs post-merge): `chore(repo): remove stale merged branches and orphaned iPad-fix worktree`.
- [ ] Task: Phase Verification & Checkpoint — Phase 9
  - [ ] `conductor(plan): Mark phase 'Phase 9 - Branch Hygiene' as complete` and checkpoint.

---

## Phase 10 — Finalize and Archive

Complete release records and archive the track.

- [ ] Task: Update project records
  - [ ] Confirm `conductor/product.md`, `conductor/tech-stack.md`, `docs/PRD.md`, `docs/TDD.md`, `README.md` reflect the FINAL release state (version `1.16.0`, precache note, resolved known issue) — patch only confirmed stale lines.
  - [ ] Confirm `docs/perf-baseline.md` (if maintained) notes the new precache size and WASM cost.
  - [ ] Confirm `conductor/tracks/release-1.16.0_20260827/plan.md` task marks and `metadata.json` status are current; record all SHAs, PR number, tag next to deployment and live verification details in the archive notes.
  - [ ] Commit: `docs(conductor): record v1.16.0 release execution and verification`.
- [ ] Task: Perform track self-review
  - [ ] Verify line coverage of: the three FR-2 caching-contract validator checks, the offline smoke exercised on live, the version bump, and each hygiene deletion's reachability evidence.
  - [ ] Confirm the plan is the source of truth — every commit traces to a task; any deviation is reconciled back into the plan before proceeding.
  - [ ] Address review findings (if any) by looping to the owning phase — do not layer unplanned fixes.
- [ ] Task: Archive the track
  - [ ] Follow `workflow.md` archival protocol: move `conductor/tracks/release-1.16.0_20260827/` → `conductor/archive/release-1.16.0_20260827/`, update `conductor/tracks.md` entry from `- [ ]` → `- [x] … (Archived)`, and push.
- [ ] Task: Phase Verification & Checkpoint — Phase 10
  - [ ] `conductor(plan): Mark phase 'Phase 10 - Finalize and Archive' as complete` and checkpoint.

---

## Phase 11 — Review Fixes (as needed)

Address any `conductor-review` findings and record their resolution per workflow. No new feature scope.

- [ ] Task: Apply review suggestions (if any)
  - [ ] Each fix traces to a review comment; update the owning phase/plan entry, implement minimally, re-verify the affected gates, and commit with `fix(conductor): apply review suggestions for track 'v1.16.0 Release Execution'`.
- [ ] Task: Re-verify affected phases and close the review checkpoint
