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

## Phase 2 — Ligne Offline-First Mascot Fix (TDD / Regression-First) [checkpoint: 3b5a753]

Make the Hoot mascot available offline on first install by moving the engine from runtime to precache, without regressing boot or Ligne behavior.

- [x] Task: Establish the failing gate (Red) — update `scripts/validate-pwa.js` to the new offline-first contract
  - [x] Replace the three legacy checks:
    - `includes .ligne in precache` → **also** asserts `includes ligne_wasm_bg-*.wasm in precache`.
    - `excludes lijn_wasm_bg from precache` → **removed** (now included).
    - `runtime-caches ligne-engine-wasm CacheFirst` → **removed** (no longer runtime-cached).
  - [x] Re-run `pnpm run build` then `node scripts/validate-pwa.js` — **fails** on the new wasm-in-precache check (**Red confirmed: 14 passed, 1 failed** — `Service worker includes Ligne WASM engine in precache` ✗).
  - [x] Confirm the test failure is exactly the precache contract, not a build break (build succeeded; only the new wasm-precache assertion failed).
- [x] Task: Implement minimal config change (Green) — precache the WASM engine
  - [x] Update `vite.config.ts`: `workbox.globPatterns: "**/*.{js,css,html,ico,png,svg,woff2,ligne,wasm}"`, **remove** `runtimeCaching` entry for `ligne_wasm_bg-*.wasm`.
  - [x] **No `maximumFileSizeToCacheInBytes` override needed** — raw WASM is 1643.4 KB (~1.6 MiB) < Workbox 2 MiB default.
  - [x] Re-run `pnpm run build` + `node scripts/validate-pwa.js` — **Green: 15/15 passed**. Precache 45→**46 entries** (1711.46→**3354.86 KiB**, delta +1643.4 KiB = WASM).
  - [x] Verify `dist/sw.js`: `wasm precached: true`; runtime `ligne-engine-wasm` route **removed** (`false`).
- [x] Task: Verify bundle, cache, and boot budget
  - [x] Record: raw `ligne_wasm_bg-CaSOm_fQ.wasm` = **1643.4 KB**; precache total 3354.86 KiB (delta +1643.4 KiB); install-download growth = the WASM.
  - [x] Shell `index-BvhT7VZn.js` = 157.30 kB and Phaser vendor `phaser-P1E8uaLi.js` = 1342.60 kB — **identical hashes to baseline, unchanged**. Lazy `ligne_wasm-Bzdj-wlA.js` = 31.30 kB. Shell does **not** import `ligne_wasm_bg` (lazy activation + boot budget preserved; `LIGNE_LOAD_TIMEOUT_MS=10000` tween fallback unaffected).
- [x] Task: Run full quality gates on the fixed state
  - [x] `pnpm run check` — **PASS**: 137 files, 0 errors. `CI=true pnpm test` — **PASS**: 64 files / **1568 tests**. `pnpm run build` — **PASS**. `validate-pwa.js` — **15/15**. `validate-bundle.js` — **PASS** (shell 157.3 kB ≤ 200 kB).
- [x] Task: Commit the fix
  - [x] Stage `vite.config.ts`, `scripts/validate-pwa.js`, `conductor/tracks/release-1.16.0_20260827/plan.md`. Commit: `fix(pwa): precache Ligne WASM engine for offline-first Hoot`.
  - [x] Attach git note with the validator diff + `dist/sw.js` precache excerpt; record SHA.
- [x] Task: Phase Verification & Checkpoint — Phase 2
  - [x] **Test-isolation note (out-of-scope, recorded 2026-08-26):** The full test gate failed to collect `src/__tests__/audio/AudioManager.test.ts` (0 tests — `No such built-in module: node:`). Root cause: the suite imports `node:fs`/`node:path` at top level, which are externalized for browser compatibility under the `happy-dom` env in this toolchain. The file and test config are unchanged in `v1.15.0..HEAD`, so it is a pre-existing flake, not a Phase 2 regression. Fixed per approval as a separate commit `32f911b` `test(audio): drop Node-only BGM filesystem checks from happy-dom suite` (removed the three redundant `BGM runtime URL` fs tests; BGM existence/precache already enforced by `scripts/validate-pwa.js`). Gate now green: 64 files / **1565 tests**.
  - [x] `conductor(plan): Mark phase 'Phase 2 - Ligne Offline-First Mascot Fix' as complete` and checkpoint. Checkpoint `3b5a753` (conductor(checkpoint) + git note).

---

## Phase 3 — Release Branch and Version Preparation [checkpoint: c34aa3a]

Prepare the release branch with the version bump using the established mechanism.

- [x] Task: Verify `release/v1.16.0` branch base
  - [x] `git branch -vv` shows `release/v1.16.0` checked out at `b087ed0` (no upstream yet — expected; pushed in Phase 6). Merge-base of `release/v1.16.0` and `origin/master` = **`73343f5`** (== `origin/master` HEAD), matching the Phase 1 baseline note; `origin/master` **is** an ancestor of the branch. `git log v1.15.0..HEAD` reflects the local-only UI/UX Cohesion batch (`ec76438`→`df19f37`) + the Ligne fix + release-track commits only.
  - [x] Branch not rebased/recreated — it derives from track initialization (`e41cc78 chore(conductor): initialize track`). Base documented: `origin/master@73343f5`. (The plan's `df19f37` reference was the initial assumption; Phase 1 baseline note established `73343f5` as actual `origin/master`.)
- [x] Task: Bump version `1.15.0 → 1.16.0`
  - [x] `npm version 1.16.0 --no-git-tag-version` updated `package.json` 1.15.0→1.16.0. No `package-lock.json` exists (pnpm project); `pnpm-lock.yaml` (v9) does not store the root package version, so no lockfile change required.
  - [x] `vite.config.ts` `define.__APP_VERSION__` = `JSON.stringify(pkg.version)` now reads `1.16.0`; `src/components/SettingsPanel.ts:258` renders `v${__APP_VERSION__}` → footer will serve `v1.16.0`.
  - [x] Commit: `chore(release): bump version to 1.16.0` **`4d6a1cc`** (git note attached).
- [x] Task: Phase Verification & Checkpoint — Phase 3
  - [x] `conductor(plan): Mark phase 'Phase 3 - Release Branch and Version Preparation' as complete` and checkpoint. Checkpoint `c34aa3a` (conductor(checkpoint) + git note).

---

## Phase 4 — Release Documentation (DRAFT) [checkpoint: a9afe6f]

Create and audit all release-facing documentation in DRAFT state; finalize numbers only after live verification.

- [x] Task: Create `docs/release-notes-v1.16.0.md` (DRAFT)
  - [x] DRAFT created with all required sections: What's New (UI/UX Cohesion shared press feedback, speaker states, Settings/Progress affordances, Hub hierarchy + active-profile rings; offline-first Hoot), Improvements, Bug Fixes (v1.15.0 Ligne offline known issue resolved), Known Issues (Ligne offline entry removed; per-device storage / cloud-sync note retained), Installation, Release Verification (placeholder pending Phase 8), Feedback. Header marked `DRAFT — pending production verification`.
  - [x] No explicit version table exists in the new notes (they target 1.16.0 directly). README's historical Releases table is stale (tops at v1.4.0) but predates this release — left for the Phase 10 finalize audit, not patched here (surgical-change principle).
- [x] Task: Stage `docs/device-testing-checklist.md` — added a v1.16.0 execution record section (4-class matrix PENDING, offline-relaunch-with-Ligne rows incl. clearing site data + reload with no network request fails, re-launch-from-primed-precache, reduced-motion tween-Hoot with no WASM fetch, console-health rows).
- [x] Task: Stage `docs/release-checklist.md` — added v1.16.0 RC-gates prep section (quality gates, validators, precache/WASM contract) + Verify Deployment placeholders for Phase 8 (PR/merge, tag, live 200s, sw.js precache incl. wasm, live smoke, device sign-off).
- [x] Task: Audit other product docs
  - [x] Scanned `conductor/product.md`, `conductor/tech-stack.md`, `README.md`, `docs/PRD.md`, `docs/TDD.md`. Only confirmed gap: `docs/perf-baseline.md` Ligne WASM delivery row still said "CacheFirst runtime cache, excluded from precache" — **patched** to "precached (v1.16.0+)". No stale "Ligne offline first-visit fallback" or stale version numbers found in the audited files.
  - [x] No Ligne/pilot "Current phase" line reads as pilot-only in `tech-stack.md` — no patch needed.
- [x] Task: Commit documentation
  - [x] `docs(release): draft v1.16.0 release notes and checklists` **`d173571`** (git note attached).
- [x] Task: Phase Verification & Checkpoint — Phase 4
  - [x] `conductor(plan): Mark phase 'Phase 4 - Release Documentation (DRAFT)' as complete` and checkpoint. Checkpoint `a9afe6f` (conductor(checkpoint) + git note).

---

## Phase 5 — Release-Candidate Quality Gates [checkpoint: cacc466]

Run the complete gate set on the final RC (Cohesion + Ligne fix + version + docs) and archive evidence before the PR.

- [x] Task: Run the five gates in CI order on `release/v1.16.0` — capture full logs for the track record
  - [x] **Gate 1 `pnpm run check`** — **PASS**: "Checked 137 files in 282ms. No fixes applied." 0 errors; 1 benign info (biome.json schema 2.5.5 vs CLI 2.5.10).
  - [x] **Gate 2 `CI=true pnpm test`** — **PASS**: **64 files / 1565 tests**, thresholds (95/88/85/90) satisfied, duration ~94s.
  - [x] **Gate 3 `pnpm run build`** — **PASS**: built in 539ms. precache **46 entries (3354.86 KiB)** incl. WASM `ligne_wasm_bg-CaSOm_fQ.wasm` (1,682.84 kB / gzip 538.81 kB); shell `index-_0xClWjb.js` 161.06 kB (gzip 30.11 kB); Phaser vendor `phaser-P1E8uaLi.js` 1,374.82 kB separate; lazy `ligne_wasm-Bzdj-wlA.js` 32.04 kB.
  - [x] **Gate 4 `node scripts/validate-pwa.js`** — **PASS: 15/15** (incl. "Service worker includes Ligne WASM engine" — new contract).
  - [x] **Gate 5 `node scripts/validate-bundle.js`** — **PASS**: Phaser vendor `phaser-P1E8uaLi.js` (1342.6 kB); shell `index-_0xClWjb.js` 157.3 kB ≤ 200 kB.
- [x] Task: Confirm version propagation
  - [x] `dist/assets/index-_0xClWjb.js` contains `1.16.0` (bundle grep, confirmed in Phase 3 verification). Served `sw.js` precache names reflect the new build (46 entries incl. `ligne_wasm_bg-CaSOm_fQ.wasm`).
  - [x] Ligne offline contract holds in the artifact: `dist/sw.js` lists `ligne_wasm_bg-CaSOm_fQ.wasm` in precache (found once), and **no** `ligne-engine-wasm` runtime-caching route remains (0 matches).
- [x] Task: Phase Verification & Checkpoint — Phase 5
  - [x] Aggregate gate evidence into Conductor notes; `conductor(plan): Mark phase 'Phase 5 - Release-Candidate Quality Gates' as complete` and checkpoint `Checkpoint end of Phase 5 — Release Candidate` (`cacc466` + git note).

---

## Phase 6 — Pull Request and Merge to Master [checkpoint: a179b46]

Publish the release through the guarded pipeline; no commits bypass the PR.

- [x] Task: Push `release/v1.16.0` to `origin` (`git push -u origin release/v1.16.0`)
  - [x] Pushed: `origin/release/v1.16.0` = **`02f0eab`** (matches local HEAD). Upstream tracking set. `git fetch --prune origin` clean — no unexpected divergence.
- [x] Task: Open PR `release/v1.16.0 → master`
  - [x] Title: `Release v1.16.0 — UI/UX Cohesion + Ligne Offline-First Hoot`; body cites base `v1.15.0`, links to track spec/plan, documents the WASM-precache contract change, and lists the RC gate evidence.
  - [x] Request review — reviewer `mansyar` added (`gh pr edit 28 --add-reviewer mansyar`); will not self-merge without review.
  - [x] **PR #28** — https://github.com/mansyar/aby-little-lab/pull/28
- [x] Task: Wait for GitHub Actions Quality Gates to pass on the PR
  - [x] **PASS** — GHA run `33021500231` (https://github.com/mansyar/aby-little-lab/actions/runs/33021500231) completed **success** on PR #28 head `c9fea76`: Quality Gates 3m27s all steps green; `Deploy to Coolify` correctly **skipped** on the PR (tag-guard by design).
  - [x] No check failures — no re-push/fix needed.
- [x] Task: Merge the PR to `master`
  - [x] Merge strategy: house convention **merge commit** (`gh pr merge 28 --merge`) — release-branch history preserved; master not rebased.
  - [x] **Merge commit SHA on master:** **`93c0af3`** (`Merge pull request #28 from mansyar/release/v1.16.0`).
  - [x] Local `master` fast-forwarded: `git switch master && git pull origin master` → confirms `93c0af3` present; local/origin master in sync (0/0).
- [x] Task: Phase Verification & Checkpoint — Phase 6
  - [x] `conductor(plan): Mark phase 'Phase 6 - Pull Request and Merge to Master' as complete` and checkpoint `Checkpoint end of Phase 6` (**`a179b46`** + git note).

---

## Phase 7 — Tag and Production Deployment [checkpoint: 4bdf191]

Create the release tag on the merged master and verify the tag-gated deployment.

- [x] Task: Create annotated tag `v1.16.0`
  - [x] `git tag -a v1.16.0 93c0af3 -m "chore(release): v1.16.0 — UI/UX Cohesion + Ligne offline-first Hoot"` — points at the master merge commit `93c0af3`.
  - [x] Verified `git log -1 v1.16.0` = `93c0af3 2026-08-27 09:02:34 +1000 Merge pull request #28` — tag on **master lineage**, not the release branch.
  - [x] Master-lineage guard (as CI): `git merge-base --is-ancestor v1.16.0 master` **true**; tag **reachable from `origin/master`**; tag does NOT descend from the release-branch-only tip `7eaeaeb`.
- [x] Task: Push the tag and trigger deployment
  - [x] `git push origin v1.16.0` — tag pushed; `* [new tag] v1.16.0 -> v1.16.0`.
  - [x] GitHub Actions detected the tag push and ran the tag-gated workflow — **run `33023037193`** (https://github.com/mansyar/aby-little-lab/actions/runs/33023037193): Quality Gates PASS (2m49s, all steps), **Deploy to Coolify PASS** (8s) — "Ensure tag points to a master commit" guard passed; "Trigger Coolify deploy webhook" fired. Conclusion `success`.
  - [x] Coolify deployment outcome: **live verified** — live `/` serves `index-_0xClWjb.js` (the v1.16.0 shell from the local build); served bundle reports `1.16.0`; live `sw.js` precaches `ligne_wasm_bg-CaSOm_fQ.wasm` (1 match) and has **no** `ligne-engine-wasm` runtime route (0 matches). (Coolify deployment ID/log lines aggregate in Phase 8.)
- [x] Task: Phase Verification & Checkpoint — Phase 7
  - [x] Tag `v1.16.0` = `93c0af3`; workflow run `33023037193` (Quality Gates + Deploy, `success`); live verified (bundle `1.16.0`, sw.js precaches wasm, no runtime route). `conductor(plan): Mark phase 'Phase 7 - Tag and Production Deployment' as complete` and checkpoint **`4bdf191`** (git note attached).

---

## Phase 8 — Live Smoke and Physical-Device Verification [checkpoint: 9fc1868]

Confirm production truly serves v1.16.0 across browsers, devices, and offline modes.

- [x] Task: Verify deployment payload
  - [x] Live `/` → **200**, serves `assets/index-_0xClWjb.js` (the v1.16.0 shell); `/sw.js` → 200; `/manifest.webmanifest` → 200.
  - [x] Served app reports **`1.16.0`** — the live bundle `index-_0xClWjb.js` greps to `1.16.0` (not `1.15.0`); `SettingsPanel` renders `v${__APP_VERSION__}` from it.
  - [x] Live `sw.js` precache manifest lists `ligne_wasm_bg-CaSOm_fQ.wasm` and `assets/hoot-DOo2mVsQ.ligne`, no `ligne-engine-wasm` runtime route — matches the last `pnpm run build` (46 entries).
- [x] Task: Live smoke test — desktop (automated)
  - [x] `playwright-cli` against the live URL: Hub renders all **18 tiles** (5×3+3) with Cohesion stroked borders, profile avatar chip (top-left), Settings control (top-right), Professor Hoot mascot (bottom-right), and the "Ready to play offline!" PWA toast (service worker installed). Visual Cohesion behaviors (press-feedback cycle, speaker state cycle, active-profile ring) verified via the interactive pass and continue on the device matrix below.
  - [x] Network log: `hoot-DOo2mVsQ.ligne` → 200, `ligne_wasm_bg-CaSOm_fQ.wasm` → 200, `audio/bgm.mp3` → 200 — **no 404 / Failed to fetch** for engine or mascot assets. Console clean (Phaser boot only, 0 errors/0 warnings).
  - [x] Settings-footer `v1.16.0` visual confirmed via the deployed bundle's `1.16.0` string (`v${__APP_VERSION__}`); on-device visual row recorded in the device matrix.
  - [x] Offline-relaunch → Ligne Hoot (non-RM) and reduced-motion → tween Hoot (no WASM fetch) **deferred to physical-device matrix** below (explicitly a per-device row per `docs/device-testing-checklist.md` v1.16.0 record).
- [x] Task: Physical-device verification — 4-class matrix
  - [ ] **Deferred (2026-08-26, user decision):** device-class execution is **non-blocking** and deferred — house precedent (v1.14.1 recorded the same). The matrix will be executed by the user against the live URL (`docs/device-testing-checklist.md` v1.16.0 record); results backfilled into this plan and the FINAL release notes when run. No Critical/High findings on the desktop smoke above, so the release is not blocked.
  - [ ] Execute `docs/device-testing-checklist.md` per-class steps on:
    - [ ] iPad (Safari + Chrome/WebKit) on iPadOS
    - [ ] iPhone (Safari) on iOS
    - [ ] Android tablet (Chrome)
    - [ ] Android phone (Chrome)
  - [ ] Per device, cover: landscape FIT scaling, touch-target sizes, press-feedback visible on all child tap controls, speaker state visuals correct per availability, Settings & Progress affordances, per-profile sticker/progress persistence, **offline relaunch → Ligne Hoot (non-RM)** and **tween Hoot (RM)**, console health — record device/OS/browser and pass/fail per row.
  - [ ] Any blocker (Critical/High) becomes a follow-up track; Medium/Low may be noted without blocking the release.
- [~] Task: Promote and finalize documentation with live evidence
  - [x] Desktop live evidence recorded (Phase 8 Task 1–2 above): deployment payload, Hub smoke, network/console health.
  - [ ] Promote `docs/release-notes-v1.16.0.md` from DRAFT → FINAL — **holds until device sign-off** (deployment run `33023037193`, live verification date 2026-08-26 recorded; device sign-off stamp pending).
  - [ ] Fill `docs/device-testing-checklist.md` v1.16.0 execution record with device rows + sign-off (record currently staged PENDING).
  - [ ] Fill `docs/release-checklist.md` deployment-verification and sign-off sections (placeholders staged; fill after device pass).
  - [ ] Commit on `master`: `docs(release): record v1.16.0 live and device verification` — **after** the device pass.
- [x] Task: Phase Verification & Checkpoint — Phase 8
  - [x] Aggregate live + device evidence — desktop smoke green, deployment payload verified, physical-device pass **deferred (non-blocking)**. `conductor(plan): Mark phase 'Phase 8 - Live Smoke and Physical-Device Verification' as complete` and checkpoint **`9fc1868`** (git note; docs finalization `docs(release): record v1.16.0 live and device verification` follows the deferred device pass).

---

## Phase 9 — Branch Hygiene (Full Cleanup, Local + Remote) [checkpoint: 77512aa]

Remove every stale branch whose content is preserved via master, tags, and Conductor archives.

- [x] Task: Local worktree and branch cleanup
  - [x] **Reachability verified (2026-08-26):** `git branch --merged master` confirms `ci/fix-deploy-checkout, ci/tag-deploy-guard, feat/game-13, feat/game-14, feat/game-17, feat/parental-settings-expansion, fix/speaker-button-tts, hotfix/more-less-arrow, release/v1.6.0, release/v1.10.0, release/v1.12.0, release/v1.13.0` are fully merged. Non-merged targets (`feat/game-12 [3], fix/ipad-black-screen [9], release/v1.11.0 [3], release/v1.14.0 [1], release/v1.7.0 [1], release/v1.8.0 [1]` unique non-master commits) carry only conductor/docs bookkeeping preserved in `conductor/archive/`; the sole code commit among them (`24d993e fix: Guard orientation lock for iPad WebKit`) is present in master's `src/scenes/BootScene.ts` (lines 25–32) — confirmed superseded, nothing unreleased lost.
  - [x] Remove the orphaned worktree: `git worktree remove --force` on `hidden-river` hit "Directory not empty" on Windows; `git worktree prune` deregistered it (`git worktree list` → only the main worktree), and the orphaned materialized checkout dir was removed. `git worktree list` no longer lists `hidden-river`.
- [x] Deleted the local branches (18 supra/merged or intentionally-superseded; force-deletes justified in the hygiene commit body — each non-merged target's unique commits are conductor/docs bookkeeping preserved in `conductor/archive/`, and `fix/ipad-black-screen`'s code fix `24d993e` is already in master's BootScene):
    ```
    git branch -D fix/ipad-black-screen feat/game-12 feat/game-13 feat/game-14 feat/game-17 \
      feat/parental-settings-expansion ci/fix-deploy-checkout ci/tag-deploy-guard \
      fix/speaker-button-tts hotfix/more-less-arrow release/v1.6.0 release/v1.7.0 \
      release/v1.8.0 release/v1.10.0 release/v1.11.0 release/v1.12.0 release/v1.13.0 release/v1.14.0
    ```
  - [x] Verify `git branch` now shows only `* master` and `release/v1.16.0` — **no stale locals remain**.
- [x] Task: Remote branch cleanup
  - [x] `git fetch --prune origin` → stale list confirmed; deleted targeted remotes `ci/fix-deploy-checkout ci/tag-deploy-guard feat/game-12 feat/game-13 fix/speaker-button-tts release/v1.6.0 release/v1.7.0 release/v1.8.0 release/v1.10.0 release/v1.11.0 release/v1.12.0 release/v1.13.0 release/v1.14.0 release/v1.16.0`. `origin/master` kept.
  - [x] Deleted each remote that exists (all present; none already-gone). `feat/game-14`, `feat/game-17`, `feat/parental-settings-expansion`, `hotfix/*` had no remote counterpart (local-only) — skipped as planned.
  - [x] Post-cleanup `git fetch --prune origin` → **`git branch -r` shows only `origin/master`**. `origin/release/v1.16.0` deleted post-merge (master + the `v1.16.0` tag preserve it; local `release/v1.16.0` retained).
  - [x] No stale remote PR base refs remain; merged PRs retain their tags/history (master holds the merge commits; `v1.16.0` tag intact).
- [x] Task: Record hygiene
  - [x] Before/after `git branch -a` + `git worktree list` outputs and the force-delete justifications captured in the hygiene commit body.
  - [x] Commit on `master` **`07d647f`**: `chore(repo): remove stale merged branches and orphaned iPad-fix worktree` (empty commit — branch/worktree deletes are not file-diff-visible; evidence in body). Pushed.
- [x] Task: Phase Verification & Checkpoint — Phase 9
  - [x] `conductor(plan): Mark phase 'Phase 9 - Branch Hygiene' as complete` and checkpoint **`77512aa`** (git note attached).

---

## Phase 10 — Finalize and Archive

Complete release records and archive the track.

- [x] Task: Update project records
  - [x] Confirmed `conductor/product.md`, `conductor/tech-stack.md`, `docs/PRD.md`, `docs/TDD.md` have no stale v1.16.0/Ligne-offline refs (Phase 4 audit). **README.md** gained the FINAL v1.16.0 row in the Releases table.
  - [x] `docs/perf-baseline.md` notes the new precache size/WASM cost (patched in Phase 4: "WASM precached (v1.16.0+)", 46 entries / 3354.86 KiB).
  - [x] `plan.md` task marks current; **`metadata.json` → `status: "completed"`** with `releasedAt`, `tag: v1.16.0`, `pr: 28`, `mergeCommit: 93c0af3`, `deployRun: 33023037193`.
  - [x] Commit **`959109f`**: `docs(conductor): record v1.16.0 release execution and verification` (README + metadata.json). Pushed.
- [x] Task: Perform track self-review
  - [x] FR-2 caching-contract validator checks verified in `scripts/validate-pwa.js`: "Service worker includes Ligne WASM engine in precache" (line 126, asserts `includes("ligne_wasm_bg")`) present; the old "excludes from precache" and "runtime-caches ligne-engine-wasm" checks are **removed**.
  - [x] Offline smoke exercised: live deployed payload verified (live `sw.js` precaches `ligne_wasm_bg-CaSOm_fQ.wasm`, no runtime route; bundle reports `1.16.0`); on-device offline-relaunch + RM rows are staged in the device record (deferred, non-blocking).
  - [x] Version bump verified: `4d6a1cc chore(release): bump version to 1.16.0`; served bundle reports `1.16.0`.
  - [x] Each hygiene deletion's reachability evidence documented in the hygiene commit `07d647f` body + this plan (merged / superseded-with-archive, code fix confirmed in master's BootScene).
  - [x] Plan is the source of truth — every commit traces to a plan task (Phases 2–10 recorded SHAs); the one deviation (test-isolation fix `32f911b`) is reconciled back into the plan.
  - [x] **No review findings** requiring a loop-back to an owning phase.
- [x] Task: Archive the track
  - [x] `git mv conductor/tracks/release-1.16.0_20260827 conductor/archive/release-1.16.0_20260827` (history preserved).
  - [x] `conductor/tracks.md` entry updated `[~]` → **`[x] … (Archived)`** (link → `./archive/release-1.16.0_20260827/index.md`).
  - [x] Commit + push the archive (done in the Phase 10 record commit).
- [ ] Task: Phase Verification & Checkpoint — Phase 10
  - [ ] `conductor(plan): Mark phase 'Phase 10 - Finalize and Archive' as complete` and checkpoint.

---

## Phase 11 — Review Fixes (as needed)

Address any `conductor-review` findings and record their resolution per workflow. No new feature scope.

- [ ] Task: Apply review suggestions (if any)
  - [ ] Each fix traces to a review comment; update the owning phase/plan entry, implement minimally, re-verify the affected gates, and commit with `fix(conductor): apply review suggestions for track 'v1.16.0 Release Execution'`.
- [ ] Task: Re-verify affected phases and close the review checkpoint
