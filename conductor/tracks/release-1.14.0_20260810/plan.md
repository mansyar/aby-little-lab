# Implementation Plan — v1.14.0 Release Execution

**Track ID:** `release-1.14.0_20260810` · **Type:** Chore / Release
**Methodology:** Established release checklist and `conductor/workflow.md`. TDD is not applicable to planned release-only changes. If verification reveals a source defect, work pauses for approval; an approved fix begins with a failing regression test.

For every file-changing task: mark `[~]`, implement, verify, commit with a Git note, mark `[x]`, record the SHA, and commit the plan update separately.

## Phase 1 — Baseline and Unreleased-Delta Validation

- [ ] **Task 1.1: Verify repository state**
  - [ ] Confirm clean working tree and current `master` tracking state.
  - [ ] Fetch remote state without modifying local work.
  - [ ] Confirm `v1.13.0` exists and no `v1.14.0` tag exists.
  - [ ] Record `origin/master..master`, including the exact commit count and subjects.
  - [ ] Confirm the unreleased range contains only intended project and Conductor work.
- [ ] **Task 1.2: Verify release content**
  - [ ] Confirm package version is `1.13.0`.
  - [ ] Confirm Take Away implementation and archived track are present.
  - [ ] Confirm Game 17 is registered, lazy-loaded, preloaded, represented on the Hub, and included in progress/storage integration.
  - [ ] Confirm the existing v1.14.0 notes and device record are superseded drafts rather than released history.
- [ ] **Task 1.3: Run baseline quality gates in CI order**
  - [ ] Run `pnpm run check`.
  - [ ] Run `CI=true pnpm test`.
  - [ ] Run `pnpm run build`.
  - [ ] Run `node scripts/validate-pwa.js`.
  - [ ] Run `node scripts/validate-bundle.js`.
  - [ ] Record actual test totals, bundle sizes, lazy chunks, precache entries, and validator results.
- [ ] **Task 1.4: Phase Verification & Checkpoint**
  - [ ] Review the unreleased delta and gate evidence against the specification.
  - [ ] Obtain explicit manual confirmation that the delta is intended for v1.14.0.
  - [ ] Create the workflow checkpoint commit with Git note and record its SHA.

## Phase 2 — Release Branch and Version

- [ ] **Task 2.1: Create `release/v1.14.0`**
  - [ ] Branch from the verified completed local `master`.
  - [ ] Verify the branch base contains the complete unreleased delta and Phase 1 checkpoint.
- [ ] **Task 2.2: Bump the version**
  - [ ] Run the established no-tag version command for `1.14.0`.
  - [ ] Confirm only expected package/lock files change.
  - [ ] Confirm Vite's `__APP_VERSION__` continues to derive from the package version.
  - [ ] Build and verify the generated application contains `1.14.0`.
- [ ] **Task 2.3: Commit the version change**
  - [ ] Commit as `chore(release): Bump version to 1.14.0`.
  - [ ] Attach the required Git note and record the commit SHA.
  - [ ] Commit the corresponding plan-state update.
- [ ] **Task 2.4: Phase Verification & Checkpoint**
  - [ ] Verify branch identity, clean diff, and version output.
  - [ ] Obtain explicit manual verification.
  - [ ] Create the phase checkpoint and record its SHA.

## Phase 3 — Release Documentation and Test Matrix

- [ ] **Task 3.1: Rewrite v1.14.0 release notes**
  - [ ] Replace the superseded Progress-only draft with Take Away and the completed 17-game milestone.
  - [ ] Use the established sections: What's New, Improvements, Bug Fixes, Known Issues, Installation, and Feedback.
  - [ ] Keep status DRAFT until production and device verification finish.
  - [ ] Preserve accepted known issues without claiming cloud sync or other out-of-scope work.
- [ ] **Task 3.2: Prepare the v1.14.0 device execution record**
  - [ ] Replace the superseded v1.14.0 record while retaining that Progress shipped in v1.13.0.
  - [ ] Add the physical iOS/iPadOS and Android device matrix.
  - [ ] Add checks for the 17-tile Hub, Take Away's six rounds, no-penalty feedback, sticker/replay behavior, progress reporting, save migration, PWA update, and offline relaunch.
  - [ ] Mark execution results pending.
- [ ] **Task 3.3: Prepare release-checklist records**
  - [ ] Add v1.14.0 preparation status.
  - [ ] Add an empty deployment-verification section.
  - [ ] Add an incomplete final sign-off block.
- [ ] **Task 3.4: Audit milestone documentation**
  - [ ] Check Product, Tech Stack, PRD, TDD, README, and other release-facing docs for stale game counts or release claims.
  - [ ] Patch only confirmed knowledge gaps.
- [ ] **Task 3.5: Commit release documentation**
  - [ ] Commit as `docs(release): Prepare v1.14.0 release`.
  - [ ] Attach the required Git note and record the SHA.
  - [ ] Commit the corresponding plan-state update.
- [ ] **Task 3.6: Phase Verification & Checkpoint**
  - [ ] Review all release wording and checklist rows against the approved specification.
  - [ ] Obtain explicit manual approval of the draft release materials.
  - [ ] Create the phase checkpoint and record its SHA.

## Phase 4 — Release-Candidate Gates

- [ ] **Task 4.1: Run all five gates on `release/v1.14.0`**
  - [ ] Run check, test, build, PWA validation, and bundle validation in CI order.
  - [ ] Confirm the build contains 17 lazy game chunks and a separate Phaser vendor chunk.
  - [ ] Confirm the PWA precache contains the Take Away chunk and required assets.
  - [ ] Record all final release-candidate evidence.
- [ ] **Task 4.2: Inspect the complete release diff**
  - [ ] Compare `release/v1.14.0` with `origin/master`.
  - [ ] Confirm there are no secrets, generated artifacts, unrelated edits, or new feature scope.
  - [ ] Confirm all intended local commits are included.
- [ ] **Task 4.3: Handle failures without bypassing gates**
  - [ ] Correct release-document or configuration failures narrowly and rerun affected gates.
  - [ ] For a source defect, stop and obtain explicit hotfix approval.
  - [ ] If approved, add a failing regression test first, implement the minimum fix, then rerun all five gates.
- [ ] **Task 4.4: Phase Verification & Checkpoint**
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
