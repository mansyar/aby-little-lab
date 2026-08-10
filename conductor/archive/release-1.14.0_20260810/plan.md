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
- [x] **Task 1.4: Phase Verification & Checkpoint**
  - [x] Review the unreleased delta and gate evidence against the specification.
  - [x] Obtain explicit manual confirmation that the delta is intended for v1.14.0.
  - [x] Create the workflow checkpoint commit with Git note and record its SHA.
  - Evidence (2026-08-10): user explicitly confirmed the 28-commit unreleased delta (26 Game 17 commits + release-track init/in-progress) is intended v1.14.0 content. Checkpoint `07ae567` `conductor(checkpoint): Checkpoint end of Phase 1` with git note (all five gates PASS on master baseline). Phase heading + phase-complete commit `318b7e9`.

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
- [x] **Task 2.4: Phase Verification & Checkpoint**
  - [x] Verify branch identity, clean diff, and version output.
  - [x] Obtain explicit manual verification.
  - [x] Create the phase checkpoint and record its SHA.
  - Evidence (2026-08-10): user confirmed — branch `release/v1.14.0`; package version 1.14.0; only package.json changed in the bump; main chunk embeds 1.14.0 with no stale 1.13.0; diff vs `origin/master` scoped to Game 17 + release work (30 files, 1822 insertions, 55 deletions). Checkpoint `50c5dd8` with git note; phase-complete commit `834dc3a`.

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

## Phase 4 — Release-Candidate Gates [checkpoint: 4cc8889]

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
- [x] **Task 4.4: Phase Verification & Checkpoint**
  - [x] Present release-candidate evidence for manual verification.
  - [x] Confirm readiness to publish the branch.
  - [x] Create the phase checkpoint and record its SHA.
  - Evidence (2026-08-10): user confirmed readiness to push `release/v1.14.0` and open the PR. Checkpoint `4cc8889`; git note attached with the Phase 4 Verification Report.

## Phase 5 — Pull Request and Merge [checkpoint: c2c09e4]

- [x] **Task 5.1: Publish the release branch**
  - [x] Push only `release/v1.14.0`; do not push local `master` directly.
  - [x] Verify the remote branch contains the full intended unreleased delta.
  - Evidence (2026-08-10): pushed `release/v1.14.0` only (local `master` never pushed); remote tip `21f1a1d` == local HEAD; 41 commits ahead of `origin/master` (28 unreleased delta + 13 release-track commits incl. phase checkpoints).
- [x] **Task 5.2: Open the release PR**
  - [x] Open `release/v1.14.0` to `master`.
  - [x] Summarize Game 17, the 17-game milestone, gate evidence, device plan, known issues, and rollback approach.
  - [x] Verify Deploy to Coolify is skipped for the PR as designed.
  - Evidence (2026-08-10): PR #27 <https://github.com/mansyar/aby-little-lab/pull/27> with full summary (Game 17, 17-game milestone, five-gate evidence, device plan, known issues, rollback via tag). CI run `31346669652` (pull_request): Quality Gates only — Deploy to Coolify reported "skipping" (tag-guard by design), verified via `gh pr checks`.
- [x] **Task 5.3: Review and merge**
  - [x] Confirm PR diff and commits match the approved release scope.
  - [x] Wait for the GitHub Actions Quality Gates to pass.
  - [x] Merge without bypassing branch protection or checks.
  - [x] Verify `origin/master` contains every intended unreleased and release commit.
  - Evidence (2026-08-10): PR diff = 35 files (matches Phase 4 approved scope); Quality Gates PASS in 2m20s (job 93329755521); merged via `gh pr merge 27 --merge` — state MERGED 2026-08-10T01:19:24Z, merge commit `5ec4705`; `git fetch` confirmed `origin/master` = `5ec4705` contains all 41 intended commits.
- [x] **Task 5.4: Phase Verification & Checkpoint**
  - [x] Record PR URL, CI run, merge method, and merge SHA.
  - [x] Obtain explicit confirmation that tagging may proceed.
  - [x] Create or record the workflow checkpoint as permitted by the established release workflow.
  - Evidence (2026-08-10): records — PR #27, CI run `31346669652` (Quality Gates PASS, Deploy skipped), merge method merge commit, merge SHA `5ec4705`. User explicitly confirmed tagging may proceed ("Yes, tag and deploy"). Phase 5 checkpoint recorded as `c2c09e4` on `release/v1.14.0` with git note (Phase 5 Verification Report) — note: this checkpoint was committed after the PR merge and therefore lives on the release branch only, not on master's lineage; master's Phase 5 state is completed here in the archival plan.

## Phase 6 — Tag and Production Deployment [checkpoint: 64e8297]

- [x] **Task 6.1: Create the release tag**
  - [x] Update local `master` to the merged `origin/master`.
  - [x] Create annotated tag `v1.14.0` on the verified master-lineage commit.
  - [x] Verify annotation, target SHA, and lineage before pushing.
  - Evidence (2026-08-10): local `master` fast-forwarded to `origin/master` (`5ec4705`). Annotated tag `v1.14.0` created on `5ec4705` (tagger mansyar; message: "Release v1.14.0: Game 17 Take Away — complete 17-game suite…"). Verified: annotation present, target = merge commit `5ec4705`, 0 commits off master lineage.
- [x] **Task 6.2: Trigger and monitor deployment**
  - [x] Push `v1.14.0`.
  - [x] Confirm tag-triggered Quality Gates pass.
  - [x] Confirm the master-lineage guard passes.
  - [x] Confirm Deploy to Coolify and the webhook complete successfully.
  - [x] Do not move or amend the tag without explicit approval.
  - Evidence (2026-08-10): tag pushed — CI run `31346877435` (push, tag `v1.14.0`): Quality Gates PASS; Deploy to Coolify PASS incl. "Ensure tag points to a master commit" (master-lineage guard) + "Trigger Coolify deploy webhook" ✓. Master-push run `31346792946` Quality Gates PASS, no deploy (by design). Tag not moved/amended.
- [x] **Task 6.3: Verify deployed artifacts**
  - [x] Confirm the live URL returns successfully.
  - [x] Confirm `sw.js` and `manifest.webmanifest` return successfully.
  - [x] Confirm the served application is v1.14.0 with no stale v1.13.0 app version.
  - [x] Compare served assets with the release build by hash where deterministic, otherwise by content.
  - Evidence (2026-08-10): live URL 200; `sw.js` 200; `manifest.webmanifest` 200. Served entry `assets/index-oLiid_3z.js` matches the local release build exactly — SHA-256 identical (`F623F789EAB3…`); served bundle contains `1.14.0` and no `1.13.0` string.
- [x] **Task 6.4: Phase Verification & Checkpoint**
  - [x] Record tag SHA, CI run URL, deployment result, asset evidence, and rollback reference.
  - [x] Obtain explicit manual confirmation that production deployment is healthy.
  - [x] Create the phase checkpoint and record its SHA.
  - Evidence (2026-08-10): user confirmed deployment healthy. Records: tag `v1.14.0` → `5ec4705`; CI run <https://github.com/mansyar/aby-little-lab/actions/runs/31346877435>; deployed asset `index-oLiid_3z.js` (SHA-256 `F623F789EAB3…`); rollback = v1.13.0 tag. Checkpoint `64e8297`; git note attached.

## Phase 7 — Live Smoke and Physical-Device Verification [checkpoint: 0a2067e]

- [x] **Task 7.1: Run production smoke testing**
  - [x] Verify boot to Hub with 17 visible, unclipped tiles and no critical console errors.
  - [x] Play Take Away through all six rounds, including a wrong-answer no-penalty check.
  - [x] Verify completion celebration, first sticker award, three-second return, and replay without duplicate award.
  - [x] Verify Learning Progress records Take Away correctly.
  - [x] Verify Settings displays v1.14.0.
  - Evidence (2026-08-10, live URL + user manual check): automated smoke (desktop Chromium via playwright-cli) — Hub 17 tiles 5×3+2 no clipping, console 0 errors/0 warnings; full six-round playthrough on the live site (each round verified advancing, ~0.7s); wrong-tap gentle wiggle ±4° + mascot nod, no penalty, no advance; round 6 → win celebration + sticker badge, 3s auto-return to Hub; storage assertions — sticker `take-away` earned once (earnedAt 2026-08-10T02:42:14Z), progress plays/wins/correct/wrong recorded; Learning Progress overlay shows all 17 games (pages 1/3–3/3; Take Away row "3 plays · 100% · Today" matches storage); Settings panel footer `v1.14.0`; PWA toast, offline-ready flow OK. User manually confirmed production healthy ("all working good").
- [x] **Task 7.2: Execute physical-device testing**
  - [x] User tests the live PWA on the agreed physical iOS/iPadOS and Android device matrix.
  - [x] Cover phone/tablet landscape layout, touch interaction, installation/update flow, and offline relaunch.
  - [x] Cover old-save migration and per-profile sticker/progress persistence.
  - [x] Record device/OS/browser details and pass/fail results.
  - Evidence (2026-08-10, user-executed): ALL 4 device classes passed — iPad (iPadOS 15+), iPhone (iOS 15+), Android tablet (Android 10+), Android phone (Android 10+) against the live URL. Flows verified: Take Away six rounds (incl. no-penalty), win + sticker + replay (no duplicate award), Progress report 17 games (8+8+1), install/update + offline relaunch, old-save migration, per-profile sticker/progress persistence. No issues found. Recorded in docs/device-testing-checklist.md v1.14.0 record.
- [x] **Task 7.3: Triage findings**
  - [x] Block completion for any Critical or High issue.
  - [x] Record accepted non-blocking issues in release notes/checklists.
  - [x] Move unrelated or non-release-blocking fixes into separately proposed tracks.
  - [x] Use the approved regression-first hotfix process if a release blocker must be corrected.
  - Evidence (2026-08-10): No Critical/High issues — release not blocked. Accepted non-blocking issue (Medium, pre-existing since v1.13.0, commit 61708b3): Learning Progress overlay row pitch (40px) vs 30px/26px fonts — stats text of each row visually collides with the next row's game name; parent-facing readability only, kids never see it; NOT fixed in v1.14.0 (out of scope per NFR) — proposed as a separate follow-up track. Observation: two earlier automated headless-session freezes on the live site were NOT reproduced in subsequent fresh sessions (local + live full playthroughs completed cleanly, zero console errors, user manual check passed) — recorded as environment/automation anomaly, no product action.
- [x] **Task 7.4: Commit verification evidence**
  - [x] Commit as `docs(release): Record v1.14.0 verification`.
  - [x] Attach the required Git note and record the SHA.
  - [x] Commit the corresponding plan-state update.
  - Evidence (2026-08-10): commit `8070d3f` on master — docs/device-testing-checklist.md (v1.14.0 result PASSED on all 4 device classes + automated smoke evidence) + plan.md (Tasks 7.1–7.3 complete); git note attached (verification record + triage summary). Playwright automation artifacts (.playwright-cli/, hub-17.png) removed from the tree before commit.
- [x] **Task 7.5: Phase Verification & Checkpoint**
  - [x] Confirm all production and physical-device acceptance criteria have evidence.
  - [x] Obtain explicit final verification approval.
  - [x] Create the phase checkpoint and record its SHA.
  - Evidence (2026-08-10): user approved final verification. Checkpoint `0a2067e` (empty commit) on master; git note attached with the Phase 7 Verification Report.

## Phase 8 — Finalize and Archive [checkpoint: 076315a]

- [x] **Task 8.1: Finalize release records**
  - [x] Change release notes from DRAFT to FINAL.
  - [x] Complete the v1.14.0 deployment record and final sign-off.
  - [x] Confirm no superseded text still says that v1.14.0 is unplanned.
  - Evidence (2026-08-10): release-notes-v1.14.0.md Status → FINAL (released 2026-08-10, tag v1.14.0, live URL, device testing passed on all 4 device classes) + Bug Fixes entry for the in-track progress-report fix (Add It Up missing since v1.13.0 + Take Away now included, pages 8+8+1); release-checklist.md Step 7n all 7 items [x] + Final Sign-Off v1.14.0 → RELEASED with all 6 approval boxes checked; grep confirms no "no v1.14.0 release is planned"/unplanned text remains in docs (only historical plan.md evidence).
- [x] **Task 8.2: Run risk-based final checks**
  - [x] Rerun only gates invalidated by post-deployment source/configuration changes.
  - [x] For documentation-only changes, verify formatting, links, and evidence without needlessly rebuilding.
  - Evidence (2026-08-10): post-deployment changes are docs-only (release notes, checklist records, device record, plan) — no source/config changes, so no gates invalidated and no rebuild needed; verified section structure, links, and evidence cross-references in the finalized docs; remaining "pending/DRAFT" markers are historical records for older releases, not v1.14.0 claims.
- [x] **Task 8.3: Complete Conductor state**
  - [x] Mark all plan tasks complete.
  - [x] Set metadata status to completed/archived.
  - [x] Move the track to `conductor/archive/release-1.14.0_20260810/`.
  - [x] Update the Tracks Registry to the archived relative path.
  - Evidence (2026-08-10): all plan tasks marked complete (8.1–8.4 in this pass, 8.5 below); metadata.json status `completed`, archivedAt `2026-08-10`; track folder moved to `conductor/archive/release-1.14.0_20260810/`; Tracks Registry entry updated to `[x]` with archived relative link.
- [x] **Task 8.4: Commit archival**
  - [x] Commit as `chore(conductor): Archive track 'v1.14.0 Release Execution'`.
  - [x] Attach the required Git note and record the SHA.
  - Evidence (2026-08-10): archival commit below; git note attached; SHA recorded.
- [x] **Task 8.5: Phase Verification & Checkpoint**
  - [x] Verify registry links, archived files, metadata, completed plan, and clean working tree.
  - [x] Obtain final manual approval.
  - [x] Create the final checkpoint and record its SHA.
  - Evidence (2026-08-10): verified — registry link `./archive/release-1.14.0_20260810/index.md` resolves; 4 archived files present; metadata status `completed` / archivedAt `2026-08-10`; all plan tasks `[x]`; working tree clean; tag `v1.14.0` present. User granted final manual approval. Final checkpoint `076315a` (empty commit) with git note attached (Phase 8 Final Verification Report).

## Phase: Review Fixes
- [x] Task: Apply review suggestions 4a95738
