# Release v1.28.0 — Implementation Plan

> **Branch:** `chore/20261128-release-v1-28-0`
> **Base:** `master` @ `39df7f5b7c4fc994475156c9affd1a4da8bec4f1`
>
> Phase states are `pending`, `in_progress`, `verified`, `failed`, or `blocked`.
> Only the primary agent writes this file. Phase subagents report results and the
> primary records them.

## Phase 1: Version metadata and DRAFT release notes

- **Goal:** `package.json` reports 1.28.0 and complete DRAFT notes exist for PRs #109–#111.
- **Depends on:** none
- **Covers:** FR-1, FR-2, NFR-1, AC-1, AC-2
- **Touches:** `package.json`, `docs/release-notes-v1.28.0.md`
- **Verification:** `pnpm check && pnpm typecheck`
- **Status:** pending

- [ ] **P1.T1: Bump the release version** — covers: FR-1, AC-1
  - [ ] **P1.T1.1:** Change `package.json` from 1.27.0 to 1.28.0 without editing the lockfile by hand.
  - [ ] **P1.T1.2:** Confirm the existing Vite version define picks up 1.28.0.
- [ ] **P1.T2: Write DRAFT release notes** — covers: FR-2, AC-2
  - [ ] **P1.T2.1:** Use Status DRAFT, Tag pending, Base v1.27.0 (`019a26cd`, 2026-11-27), and date 2026-11-28.
  - [ ] **P1.T2.2:** Add parent-facing sections for PR #109 Repeat Machine, PR #110 Hub grid/tap fix, and PR #111 narration pace in merge order.
  - [ ] **P1.T2.3:** Include Installation, Release Verification placeholders, Known Issues, no-migration language, and `SKIPPED — accepted gap` device policy.

## Phase 2: README and release documentation truth

- **Goal:** README indexes v1.28.0 and all release-document links resolve.
- **Depends on:** Phase 1
- **Covers:** FR-3, NFR-2, AC-3
- **Touches:** `README.md`, `docs/release-notes-v1.28.0.md`
- **Verification:** `node scripts/validate-docs.js && pnpm check`
- **Status:** pending

- [ ] **P2.T1: Add the README release entries** — covers: FR-3, AC-3
  - [ ] **P2.T1.1:** Add the v1.28.0 notes link to Documentation.
  - [ ] **P2.T1.2:** Add a 2026-11-28 Releases row summarizing #109–#111 and the accepted device gap.
- [ ] **P2.T2: Link release evidence** — covers: FR-2, FR-3
  - [ ] **P2.T2.1:** Link the three archived track records and issue #108 from the notes without claiming unmeasured verification.

## Phase 3: Release-candidate verification and performance baseline

- **Goal:** the final candidate has a full green gate, measured first-tap evidence, browser evidence, and a truthful perf-baseline update.
- **Depends on:** Phase 2
- **Covers:** FR-4, FR-5, NFR-2, NFR-3, NFR-4, AC-4, AC-5
- **Touches:** `docs/perf-baseline.md`, `docs/release-notes-v1.28.0.md`, `conductor/tracks/20261128-release-v1-28-0/verification/**`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js` plus `TAP_HEADED=1 TAP_INERT_IDLE=1 node scripts/measure-first-tap.mjs --with-preview --json --warm-aware --samples 10`
- **Status:** pending

- [ ] **P3.T1: Run and retain the full configured gate** — covers: FR-5, NFR-4, AC-5
  - [ ] **P3.T1.1:** Run the exact `verify_phase` command on the final candidate and retain the raw log.
- [ ] **P3.T2: Measure headed cold first tap** — covers: FR-4, FR-5, AC-4, AC-5
  - [ ] **P3.T2.1:** Run the documented headed cold-control command against a production preview.
  - [ ] **P3.T2.2:** Require 50 cold / 0 warm samples, exactly 10 per target, exit 0, and every worst cold total ≤400 ms; retain JSON/stdout evidence.
- [ ] **P3.T3: Verify browser journeys** — covers: FR-5, AC-5
  - [ ] **P3.T3.1:** Run the Chromium, WebKit, Firefox, and mobile Chromium projects sequentially and retain the roster/log; CI remains authoritative for the PR.
- [ ] **P3.T4: Refresh measured release documentation** — covers: FR-2, FR-4, NFR-2, AC-2, AC-4
  - [ ] **P3.T4.1:** Add the dated v1.28.0 candidate section and current living figures to `docs/perf-baseline.md` without rewriting historical rows.
  - [ ] **P3.T4.2:** Fill the notes' Release Verification section with measured candidate facts; keep Status DRAFT and Tag pending.

## Phase 4: Strict review, PR, merge, and issue closure

- **Goal:** review passes, PR CI is green, the user-approved merge lands, and issue #108 is closed.
- **Depends on:** Phase 3
- **Covers:** FR-6, FR-7, NFR-3, AC-6, AC-7
- **Touches:** `conductor/tracks/20261128-release-v1-28-0/**`, `docs/release-notes-v1.28.0.md`, `docs/perf-baseline.md`, GitHub issue #108
- **Verification:** full `verify_phase` gate plus `conductor-review` PASS and all required PR checks green
- **Status:** pending

- [ ] **P4.T1: Run integrated verification and post-review doc sync** — covers: FR-5, FR-6
- [ ] **P4.T2: Pass strict Conductor review** — covers: FR-6, AC-6
  - [ ] **P4.T2.1:** Resolve findings within the allowed two review-fix rounds or record approved overrides.
- [ ] **P4.T3: Open the release PR and watch CI** — covers: FR-6, AC-6
  - [ ] **P4.T3.1:** Use title `chore(release): ship v1.28.0`; require Quality Gates and Browser Journeys green before merge.
- [ ] **P4.T4: Merge only after explicit approval** — covers: FR-6, NFR-3, AC-6
  - [ ] **P4.T4.1:** Ask Merge now / Leave open / Stop; on Merge now use the configured `merge` method and clean up the branch.
- [ ] **P4.T5: Close issue #108 with evidence** — covers: FR-7, AC-7
  - [ ] **P4.T5.1:** Comment that PR #110 fixed the overflow/tap issue and link the merged release evidence; close as completed.

## Phase 5: Authorized tag, deploy, and final notes

- **Goal:** after merge and separate explicit authorization, tag/deploy v1.28.0 and finalize the release record.
- **Depends on:** Phase 4 merge
- **Covers:** FR-8, FR-9, NFR-3, NFR-5, AC-8, AC-9
- **Touches:** `docs/release-notes-v1.28.0.md`, `conductor/archive/20261128-release-v1-28-0/**`, git tag `v1.28.0`
- **Verification:** no tag collision; tag on merged `master` HEAD; tag CI and Coolify green; live HTTP/title/version/hash/service-worker/manifest checks pass; `node scripts/validate-docs.js`
- **Status:** pending

- [ ] **P5.T1: Preflight and obtain tag/deploy authorization** — covers: FR-8, NFR-3, AC-8
  - [ ] **P5.T1.1:** Fetch `master`, confirm the release merge is HEAD and the tree is clean, and confirm `v1.28.0` exists neither locally nor on origin.
  - [ ] **P5.T1.2:** Ask for explicit go-ahead to push the immutable tag and trigger deployment; stop if not granted.
- [ ] **P5.T2: Create and push the annotated tag** — covers: FR-8, AC-8
  - [ ] **P5.T2.1:** Annotate `v1.28.0` on merged `master` HEAD and push it once; never move or recreate it.
- [ ] **P5.T3: Verify tag CI, deployment, and live build** — covers: FR-9, AC-9
  - [ ] **P5.T3.1:** Require Quality Gates, Browser Journeys, and Deploy to Coolify to pass.
  - [ ] **P5.T3.2:** Verify live HTTP 200, title, local/remote shell hash, embedded 1.28.0, `sw.js`, and `manifest.webmanifest`.
- [ ] **P5.T4: Finalize the release record** — covers: FR-2, FR-9, AC-2, AC-9
  - [ ] **P5.T4.1:** Flip notes DRAFT → FINAL with tag commit, CI run, deploy/live evidence, and the accepted device gap.
  - [ ] **P5.T4.2:** Update archived ship evidence/state through the documented docs/Conductor-only finalization exception; run `validate-docs` and diff checks.

## Rollback Strategy

- **Before tag:** revert the release PR; there is no production impact.
- **After tag/deploy:** never move or delete the published tag. Revert the release
  merge with a reviewed follow-up and cut a patch release if a shipped defect is
  found.
- **Data:** no migration, schema change, or profile rewrite occurs, so no user-data
  rollback is required.
