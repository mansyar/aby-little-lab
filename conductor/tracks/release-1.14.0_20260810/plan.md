# Implementation Plan — v1.14.0 Release Execution

**Track ID:** `release-1.14.0_20260810` · **Type:** Chore / Release
**Methodology:** Established release checklist and `conductor/workflow.md`. TDD is not applicable to planned release-only changes. If verification reveals a source defect, work pauses for approval; an approved fix begins with a failing regression test.

For every file-changing task: mark `[~]`, implement, verify, commit with a Git note, mark `[x]`, record the SHA, and commit the plan update separately.

## Phase 1 — Baseline and Unreleased-Delta Validation [checkpoint: 07ae567]

- [x] **Task 1.1: Verify repository state**
  - [x] Confirm clean working tree and current `master` tracking state.
  - [x] Fetch remote state without modifying local work.
  - [x] Confirm `v1.13.0` exists and no `v1.14.0` tag exists.
  - [x] Record `origin/master..master`, including the exact commit count and subjects.
  - [x] Confirm the unreleased range contains only intended project and Conductor work.
  - Evidence (2026-08-10): Baseline was clean before the plan-state transition. After `git fetch --prune origin`, local `master` was 28 commits ahead: 26 intended Game 17 commits plus the release-track initialization and in-progress commits. `v1.13.0` exists, `v1.14.0` does not, and the 29-file delta contains only Take Away, 17-game milestone documentation, and this release track.
- [x] **Task 1.2: Verify release content**
  - [x] Confirm package version is `1.13.0`.
  - [x] Confirm Take Away implementation and archived track are present.
  - [x] Confirm Game 17 is registered, lazy-loaded, preloaded, represented on the Hub, and included in progress/storage integration.
  - [x] Confirm the existing v1.14.0 notes and device record are superseded drafts rather than released history.
  - Evidence (2026-08-10): `package.json` is `1.13.0`. Take Away source (`src/scenes/TakeAwayScene.ts`, `src/game/takeAwayLogic.ts` + unit tests) and the archived track (`conductor/archive/take-away_20260810/`) are present. `sceneLoaders` registers `TakeAway` (lazy dynamic import, `src/scenes/sceneRegistry.ts:28`); HubScene loads it on tap via `ensureSceneLoaded` (`HubScene.ts:597`); preload assets `sticker_take_away` and `tile_take_away` exist (`PreloadScene.ts:309,326`); `GAME_TILES` has a `TakeAway` tile with a 17-tile 5×3+2 grid (`HubScene.ts:159-165`); `"take-away"` is in the `GameId` union and `GAME_IDS` so stickers, per-game progress, play-time, and activity are profile-integrated (`src/types/index.ts:18,98`). `docs/release-notes-v1.14.0.md` is a SUPERSEDED draft (explicitly "no v1.14.0 release is planned") and the v1.14.0 device record in `docs/device-testing-checklist.md:16` is marked SUPERSEDED — neither is released history.
- [x] **Task 1.3: Run baseline quality gates in CI order**
  - [x] Run `pnpm run check`.
  - [x] Run `CI=true pnpm test`.
  - [x] Run `pnpm run build`.
  - [x] Run `node scripts/validate-pwa.js`.
  - [x] Run `node scripts/validate-bundle.js`.
  - [x] Record actual test totals, bundle sizes, lazy chunks, precache entries, and validator results.
  - Evidence (2026-08-10): Gate results on local `master` baseline — **check**: Biome, 125 files, 0 issues. **test**: 58 files, 1309 tests passed (86.3s). **build**: success; 17 lazy game-scene chunks (e.g. `TakeAwayScene-Bb4vvFno.js` 4.14 kB) plus separate Phaser vendor chunk `phaser-CYX5YQB3.js` (1,375.72 kB raw) and shell `index-D8Kv6Gq2.js` (151.19 kB); PWA precache 35 entries, 1566.27 KiB. **validate-pwa**: 13/13 checks passed. **validate-bundle**: PASS — Phaser vendor chunk present, shell 147.7 kB ≤ 200 kB.
- [ ] **Task 1.4: Phase Verification & Checkpoint**
  - [ ] Review the unreleased delta and gate evidence against the specification.
  - [ ] Obtain explicit manual confirmation that the delta is intended for v1.14.0.
  - [ ] Create the workflow checkpoint commit with Git note and record its SHA.

## Phase 2 — Release Branch and Version [checkpoint: 50c5dd8]

- [x] **Task 2.1: Create `release/v1.14.0`**
  - [x] Branch from the verified completed local `master`.
  - [x] Verify the branch base contains the complete unreleased delta and Phase 1 checkpoint.
  - Evidence (2026-08-10): `release/v1.14.0` created from local `master` at `318b7e9`; branch is 30 commits ahead of `origin/master` (28 unreleased delta + Phase 1 checkpoint `07ae567` + plan-state commit `318b7e9`).
- [x] **Task 2.2: Bump the version**
  - [x] Run the established no-tag version command for `1.14.0`.
  - [x] Confirm only expected package/lock files change.
  - [x] Confirm Vite's `__APP_VERSION__` continues to derive from the package version.
  - [x] Build and verify the generated application contains `1.14.0`.
  - Evidence (2026-08-10): `npm version 1.14.0 --no-git-tag-version` succeeded; only `package.json` changed (zero lockfile churn). `vite.config.ts:10` still defines `__APP_VERSION__: JSON.stringify(pkg.version)` and `SettingsPanel.ts:211` renders `v${__APP_VERSION__}`. Build OK — main chunk hash changed to `index-Zn-0_WWH.js` (151.19 kB) as expected; bundle contains `1.14.0` and no stale `1.13.0` string.
- [x] **Task 2.3: Commit the version change**
  - [x] Commit as `chore(release): Bump version to 1.14.0`.
  - [x] Attach the required Git note and record the commit SHA.
  - [x] Commit the corresponding plan-state update.
  - Evidence (2026-08-10): commit `2e4d39d` on `release/v1.14.0` — `chore(release): Bump version to 1.14.0`; git note attached (version bump method, only package.json changed, `__APP_VERSION__` footer mechanism, bundle verification). Plan-state commit `60e392e`.
- [~] **Task 2.4: Phase Verification & Checkpoint**
  - [ ] Verify branch identity, clean diff, and version output.
  - [ ] Obtain explicit manual verification.
  - [ ] Create the phase checkpoint and record its SHA.

## Phase 3 — Release Documentation and Test Matrix [checkpoint: f378a5f]

- [x] **Task 3.1: Rewrite v1.14.0 release notes**
  - [x] Replace the superseded Progress-only draft with Take Away and the completed 17-game milestone.
  - [x] Use the established sections: What's New, Improvements, Bug Fixes, Known Issues, Installation, and Feedback.
  - [x] Keep status DRAFT until production and device verification finish.
  - [x] Preserve accepted known issues without claiming cloud sync or other out-of-scope work.
  - Evidence (2026-08-10): `docs/release-notes-v1.14.0.md` rewritten — Take Away (early subtraction, easy-first bands ≤4/≤6/≤10, 6 rounds, no-penalty feedback, first-completion sticker, 3s auto-return, replay freshness) + 17-game milestone; textless/speech-free; Hub 5×3 + 2; DRAFT status; known issues preserved (per-device storage, system-font glyph variance).
- [x] **Task 3.2: Prepare the v1.14.0 device execution record**
  - [x] Replace the superseded v1.14.0 record while retaining that Progress shipped in v1.13.0.
  - [x] Add the physical iOS/iPadOS and Android device matrix.
  - [x] Add checks for the 17-tile Hub, Take Away's six rounds, no-penalty feedback, sticker/replay behavior, progress reporting, save migration, PWA update, and offline relaunch.
  - [x] Mark execution results pending.
  - Evidence (2026-08-10): superseded record in `docs/device-testing-checklist.md` replaced with the current v1.14.0 record — live URL target, 4 device classes, 17-tile Hub (5×3 + 2), Take Away six easy-first rounds, textless/no-speaker, no-penalty wrong taps, win → sticker → 3s auto-return → replay no re-award, progress reporting (17 games, 8 + 8 + 1 pages), save migration, PWA update, offline relaunch; result pending.
- [x] **Task 3.3: Prepare release-checklist records**
  - [x] Add v1.14.0 preparation status.
  - [x] Add an empty deployment-verification section.
  - [x] Add an incomplete final sign-off block.
  - Evidence (2026-08-10): `docs/release-checklist.md` — v1.14.0 prep note (baseline gates, branch, bump `2e4d39d`, notes rewritten, in-track fix recorded); Step 7n Verify Deployment — v1.14.0 (all items unchecked); Final Sign-Off — v1.14.0 (Status: In progress, approval unchecked).
- [x] **Task 3.4: Audit milestone documentation**
  - [x] Check Product, Tech Stack, PRD, TDD, README, and other release-facing docs for stale game counts or release claims.
  - [x] Patch only confirmed knowledge gaps.
  - Evidence (2026-08-10): audited `conductor/product.md`, `conductor/tech-stack.md`, `docs/PRD.md`, `docs/TDD.md`, `README.md` — game counts current (17); patched two stale "rows page 8 + 8" paging claims → "8 + 8 + 1" in `product.md:51` and `PRD.md:292` (report now covers 17 games). No other gaps found.
- [x] **Task 3.5: Commit release documentation**
  - [x] Commit as `docs(release): Prepare v1.14.0 release`.
  - [x] Attach the required Git note and record the SHA.
  - [x] Commit the corresponding plan-state update.
  - Evidence (2026-08-10): docs commit `0a93c73` on `release/v1.14.0` (release notes + device checklist + release checklist + product.md + PRD.md; git note attached). Source fix committed separately: `dada2b0` — `fix(progress): Add Add It Up and Take Away to the Learning Progress report` (SettingsPanel.ts + regression tests, git note attached, SettingsPanel tests 60/60). Plan-state commit pending with Task 3.5 completion.
- [x] **Task 3.6: Phase Verification & Checkpoint**
  - [x] Review all release wording and checklist rows against the approved specification.
  - [x] Obtain explicit manual approval of the draft release materials.
  - [x] Create the phase checkpoint and record its SHA.
  - Evidence (2026-08-10): user approved all draft materials (release notes DRAFT, device record pending, checklist records, paging patches, in-track fix). Checkpoint `f378a5f` (empty commit) on `release/v1.14.0`; git note attached with the Phase 3 Verification Report.

## Phase 4 — Release-Candidate Gates

- [x] **Task 4.1: Run all five gates on `release/v1.14.0`**
  - [x] Run check, test, build, PWA validation, and bundle validation in CI order.
  - [x] Confirm the build contains 17 lazy game chunks and a separate Phaser vendor chunk.
  - [x] Confirm the PWA precache contains the Take Away chunk and required assets.
  - [x] Record all final release-candidate evidence.
  - Evidence (2026-08-10): all five gates PASS on `release/v1.14.0` — 1) `pnpm run check` Biome 125 files clean; 2) `CI=true pnpm test` 58 files / 1309 tests (88s); 3) `pnpm run build` OK — 17 lazy game-scene chunks + separate Phaser vendor chunk `phaser-CYX5YQB3.js` (unchanged from baseline); 4) `validate-pwa` 13/13; 5) `validate-bundle` PASS. Precache contains `TakeAwayScene-BOGkTWeu.js`.
- [x] **Task 4.2: Inspect the complete release diff**
  - [x] Compare `release/v1.14.0` with `origin/master`.
  - [x] Confirm there are no secrets, generated artifacts, unrelated edits, or new feature scope.
  - [x] Confirm all intended local commits are included.
  - Evidence (2026-08-10): `git diff origin/master..HEAD` = 35 files (1882 insertions, 81 deletions) — Take Away source/tests/assets (11 files), archived take-away track (4), release track docs (4), milestone docs (README/TDD/PRD/product/tech-stack/tracks), approved `SettingsPanel.ts` fix + regression tests, release notes/checklist/device record, package.json version. Secrets scan clean (only spec/checklist prose matched); no generated artifacts; no unrelated edits.
- [x] **Task 4.3: Handle failures without bypassing gates**
  - [x] Correct release-document or configuration failures narrowly and rerun affected gates.
  - [x] For a source defect, stop and obtain explicit hotfix approval.
  - [x] If approved, add a failing regression test first, implement the minimum fix, then rerun all five gates.
  - Evidence (2026-08-10): no gate failures on the release candidate. The Phase 3 in-track source fix (`dada2b0`, user-approved) followed the regression-first protocol; all five gates rerun green on the release branch afterwards.
- [~] **Task 4.4: Phase Verification & Checkpoint**
  - [ ] Present release-candidate evidence for manual verification.
  - [ ] Confirm readiness to publish the branch.
  - [ ] Create the phase checkpoint and record its SHA.

## Phase 5 — Pull Request and Merge

- [ ] **Task 5.1: Publish the release branch**
  - [ ] Push only `release/v1.14.0`; do not push local `master` directly.
  - [ ] Verify the remote branch contains the full intended unreleased delta.
- [ ] **Task 5.2: Open the release PR**
  - [ ] Open `release/v1.14.0` to `master`.
  - [ ] Summarize Game 17, the 17-game milestone, gate evidence, device plan, known issues, and rollback approach.
  - [ ] Verify Deploy to Coolify is skipped for the PR as designed.
- [ ] **Task 5.3: Review and merge**
  - [ ] Confirm PR diff and commits match the approved release scope.
  - [ ] Wait for the GitHub Actions Quality Gates to pass.
  - [ ] Merge without bypassing branch protection or checks.
  - [ ] Verify `origin/master` contains every intended unreleased and release commit.
- [ ] **Task 5.4: Phase Verification & Checkpoint**
  - [ ] Record PR URL, CI run, merge method, and merge SHA.
  - [ ] Obtain explicit confirmation that tagging may proceed.
  - [ ] Create or record the workflow checkpoint as permitted by the established release workflow.

## Phase 6 — Tag and Production Deployment

- [ ] **Task 6.1: Create the release tag**
  - [ ] Update local `master` to the merged `origin/master`.
  - [ ] Create annotated tag `v1.14.0` on the verified master-lineage commit.
  - [ ] Verify annotation, target SHA, and lineage before pushing.
- [ ] **Task 6.2: Trigger and monitor deployment**
  - [ ] Push `v1.14.0`.
  - [ ] Confirm tag-triggered Quality Gates pass.
  - [ ] Confirm the master-lineage guard passes.
  - [ ] Confirm Deploy to Coolify and the webhook complete successfully.
  - [ ] Do not move or amend the tag without explicit approval.
- [ ] **Task 6.3: Verify deployed artifacts**
  - [ ] Confirm the live URL returns successfully.
  - [ ] Confirm `sw.js` and `manifest.webmanifest` return successfully.
  - [ ] Confirm the served application is v1.14.0 with no stale v1.13.0 app version.
  - [ ] Compare served assets with the release build by hash where deterministic, otherwise by content.
- [ ] **Task 6.4: Phase Verification & Checkpoint**
  - [ ] Record tag SHA, CI run URL, deployment result, asset evidence, and rollback reference.
  - [ ] Obtain explicit manual confirmation that production deployment is healthy.
  - [ ] Create the phase checkpoint and record its SHA.

## Phase 7 — Live Smoke and Physical-Device Verification

- [ ] **Task 7.1: Run production smoke testing**
  - [ ] Verify boot to Hub with 17 visible, unclipped tiles and no critical console errors.
  - [ ] Play Take Away through all six rounds, including a wrong-answer no-penalty check.
  - [ ] Verify completion celebration, first sticker award, three-second return, and replay without duplicate award.
  - [ ] Verify Learning Progress records Take Away correctly.
  - [ ] Verify Settings displays v1.14.0.
- [ ] **Task 7.2: Execute physical-device testing**
  - [ ] User tests the live PWA on the agreed physical iOS/iPadOS and Android device matrix.
  - [ ] Cover phone/tablet landscape layout, touch interaction, installation/update flow, and offline relaunch.
  - [ ] Cover old-save migration and per-profile sticker/progress persistence.
  - [ ] Record device/OS/browser details and pass/fail results.
- [ ] **Task 7.3: Triage findings**
  - [ ] Block completion for any Critical or High issue.
  - [ ] Record accepted non-blocking issues in release notes/checklists.
  - [ ] Move unrelated or non-release-blocking fixes into separately proposed tracks.
  - [ ] Use the approved regression-first hotfix process if a release blocker must be corrected.
- [ ] **Task 7.4: Commit verification evidence**
  - [ ] Commit as `docs(release): Record v1.14.0 verification`.
  - [ ] Attach the required Git note and record the SHA.
  - [ ] Commit the corresponding plan-state update.
- [ ] **Task 7.5: Phase Verification & Checkpoint**
  - [ ] Confirm all production and physical-device acceptance criteria have evidence.
  - [ ] Obtain explicit final verification approval.
  - [ ] Create the phase checkpoint and record its SHA.

## Phase 8 — Finalize and Archive

- [ ] **Task 8.1: Finalize release records**
  - [ ] Change release notes from DRAFT to FINAL.
  - [ ] Complete the v1.14.0 deployment record and final sign-off.
  - [ ] Confirm no superseded text still says that v1.14.0 is unplanned.
- [ ] **Task 8.2: Run risk-based final checks**
  - [ ] Rerun only gates invalidated by post-deployment source/configuration changes.
  - [ ] For documentation-only changes, verify formatting, links, and evidence without needlessly rebuilding.
- [ ] **Task 8.3: Complete Conductor state**
  - [ ] Mark all plan tasks complete.
  - [ ] Set metadata status to completed/archived.
  - [ ] Move the track to `conductor/archive/release-1.14.0_20260810/`.
  - [ ] Update the Tracks Registry to the archived relative path.
- [ ] **Task 8.4: Commit archival**
  - [ ] Commit as `chore(conductor): Archive track 'v1.14.0 Release Execution'`.
  - [ ] Attach the required Git note and record the SHA.
- [ ] **Task 8.5: Phase Verification & Checkpoint**
  - [ ] Verify registry links, archived files, metadata, completed plan, and clean working tree.
  - [ ] Obtain final manual approval.
  - [ ] Create the final checkpoint and record its SHA.
