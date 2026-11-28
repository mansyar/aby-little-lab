# Release v1.28.0 — Implementation Plan

> **Branch:** `chore/20261128-release-v1-28-0`
> **Base:** `master` @ `39df7f5b7c4fc994475156c9affd1a4da8bec4f1`
>
> Phase states are `pending`, `in_progress`, `verified`, `failed`, or `blocked`.
> Only the primary agent writes this file. Phase subagents report results and the
> primary records them.

## Phase 1: Version metadata and DRAFT release notes

- **Goal:** `package.json` reports 1.28.0, complete DRAFT notes exist for PRs #109–#111, and README indexes the notes so docs validation passes.
- **Depends on:** none
- **Covers:** FR-1, FR-2, FR-3, NFR-1, AC-1, AC-2, AC-3 (Documentation link only)
- **Touches:** `package.json`, `docs/release-notes-v1.28.0.md`, `README.md`
- **Verification:** `node scripts/validate-docs.js && pnpm check && pnpm typecheck`
- **Status:** verified

- [x] **P1.T1: Bump the release version** — covers: FR-1, AC-1
  - [x] **P1.T1.1:** Change `package.json` from 1.27.0 to 1.28.0 without editing the lockfile by hand.
  - [x] **P1.T1.2:** Confirm the existing Vite version define picks up 1.28.0.
- [x] **P1.T2: Write DRAFT release notes** — covers: FR-2, AC-2
  - [x] **P1.T2.1:** Use Status DRAFT, Tag pending, Base v1.27.0 (`019a26cd`, 2026-11-27), and date 2026-11-28.
  - [x] **P1.T2.2:** Add parent-facing sections for PR #109 Repeat Machine, PR #110 Hub grid/tap fix, and PR #111 narration pace in merge order.
  - [x] **P1.T2.3:** Include Installation, Release Verification placeholders, Known Issues, no-migration language, and `SKIPPED — accepted gap` device policy.
  - [x] **P1.T2.4:** Add the v1.28.0 notes link to README Documentation so `validate-docs` passes during Phase 1 — covers: FR-3, AC-3.

**Result:** verified — `package.json` and the built shell report 1.28.0; DRAFT notes cover #109–#111 in merge order with no unmeasured claims; README indexes the notes. Primary full gate: 165 files / 3,559 tests, coverage 96.91/90.23/96.22/98.06, build and all validators PASS.
**Checkpoint:** `c9f96919`
**Evidence:** `conductor/tracks/20261128-release-v1-28-0/verification/phase-1.md`

## Phase 2: README and release documentation truth

- **Goal:** README indexes v1.28.0 and all release-document links resolve.
- **Depends on:** Phase 1
- **Covers:** FR-3, NFR-2, AC-3 (Releases row; Documentation link completed in Phase 1)
- **Touches:** `README.md`, `docs/release-notes-v1.28.0.md`
- **Verification:** `node scripts/validate-docs.js && pnpm check`
- **Status:** verified

- [x] **P2.T1: Add the README Releases row** — covers: FR-3, AC-3
  - [x] **P2.T1.1:** Add a 2026-11-28 Releases row summarizing #109–#111 and the accepted device gap.
- [x] **P2.T2: Link release evidence** — covers: FR-2, FR-3
  - [x] **P2.T2.1:** Link the three archived track records and issue #108 from the notes without claiming unmeasured verification.
  - [x] **P2.T2.2:** Preserve all existing parent-facing copy and placeholders; do not fill candidate/perf/CI/ship figures in this phase.

**Result:** verified — README indexes v1.28.0 in Documentation and Releases; notes link all three archived tracks and issue #108; `validate-docs` 5/0 and `pnpm check` pass. Primary full gate: 165 files / 3,559 tests, coverage 96.91/90.23/96.22/98.06, build and all validators PASS.
**Checkpoint:** `b99e27e5`
**Evidence:** `conductor/tracks/20261128-release-v1-28-0/verification/phase-2.md`

## Phase 3: Release-candidate verification and performance baseline

- **Goal:** the final candidate has a full green gate, measured first-tap evidence, browser evidence, and a truthful perf-baseline update.
- **Depends on:** Phase 2
- **Covers:** FR-4, FR-5, NFR-2, NFR-3, NFR-4, AC-4, AC-5
- **Touches:** `scripts/measure-first-tap.mjs`, `docs/perf-baseline.md`, `docs/release-notes-v1.28.0.md`, `conductor/tracks/20261128-release-v1-28-0/verification/**`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js` plus `TAP_HEADED=1 TAP_INERT_IDLE=1 node scripts/measure-first-tap.mjs --with-preview --json --warm-aware --samples 10`
- **Status:** verified

- [x] **P3.T1: Run and retain the full configured gate** — covers: FR-5, NFR-4, AC-5
  - [x] **P3.T1.1:** Run the exact `verify_phase` command on the final candidate and retain the raw log.
- [x] **P3.T2: Measure headed cold first tap** — covers: FR-4, FR-5, AC-4, AC-5
  - [x] **P3.T2.1:** Run the documented headed cold-control command against a production preview.
  - [x] **P3.T2.2:** Require 50 cold / 0 warm samples, exactly 10 per target, exit 0, and every worst cold total ≤400 ms; retain JSON/stdout evidence.
  - [x] **P3.T2.3:** Synchronize the measurement harness with the merged 5-row wide-grid geometry before the one caused rerun; this changes verification tooling only, not runtime behavior.
- [x] **P3.T3: Verify browser journeys** — covers: FR-5, AC-5
  - [x] **P3.T3.1:** Run the Chromium, WebKit, Firefox, and mobile Chromium projects sequentially and retain the roster/log; CI remains authoritative for the PR.
- [x] **P3.T4: Refresh measured release documentation** — covers: FR-2, FR-4, NFR-2, AC-2, AC-4
  - [x] **P3.T4.1:** Add the dated v1.28.0 candidate section and current living figures to `docs/perf-baseline.md` without rewriting historical rows.
  - [x] **P3.T4.2:** Fill the notes' Release Verification section with measured candidate facts; keep Status DRAFT and Tag pending.

**Result:** verified — exact full gate passed before and after measured docs (165 files / 3,559 tests; coverage 96.91/90.20/96.22/98.06); corrected headed first tap passed 50 cold / 0 warm with worst 273.2 ms; browser matrix passed 60/60 on its single caused rerun; v1.28.0 perf section and DRAFT notes contain measured local facts only.
**Checkpoint:** `e62d349a`
**Evidence:** `conductor/tracks/20261128-release-v1-28-0/verification/phase-3.md`

## Phase 4: Review, PR, and issue-closure readiness

- **Goal:** the final candidate has review-ready evidence, a complete PR body, explicit CI expectations, and an issue #108 closure record; no merge occurs in this phase.
- **Depends on:** Phase 3
- **Covers:** FR-5, FR-6, FR-7, NFR-3, AC-5, AC-6, AC-7
- **Touches:** `docs/release-notes-v1.28.0.md`, `docs/perf-baseline.md`, `conductor/tracks/20261128-release-v1-28-0/verification/**`
- **Verification:** full `verify_phase` gate plus `node scripts/validate-docs.js`
- **Status:** verified

- [x] **P4.T1: Validate the release record against merged evidence** — covers: FR-2, FR-5, FR-7
  - [x] **P4.T1.1:** Cross-check PRs #109–#111, their merge order, and issue #108 against the notes and perf baseline.
- [x] **P4.T2: Prepare the strict-review evidence pack** — covers: FR-6, AC-6
  - [x] **P4.T2.1:** Record the final diff, requirement matrix, gate output, and known accepted device gap for `conductor-review`.
- [x] **P4.T3: Prepare the release PR body and CI checklist** — covers: FR-6, AC-6
  - [x] **P4.T3.1:** Draft the `chore(release): ship v1.28.0` body with Quality Gates and Browser Journeys as required checks.
- [x] **P4.T4: Prepare the merge and issue-closure runbook** — covers: FR-6, FR-7, NFR-3, AC-6, AC-7
  - [x] **P4.T4.1:** Record the explicit Merge now / Leave open / Stop boundary, configured merge method, branch cleanup, and the #108 completion comment linking #110 and the release PR.

**Result:** verified — merged order #109 → #110 → #111 and open issue #108 cross-checked; strict-review pack, PR body and post-merge runbook prepared. Exact full gate passed on the final Phase 4 tree (165 files / 3,559 tests; coverage 96.91/90.23/96.22/98.06; all validators green).
**Checkpoint:** `cf3f8a37`
**Evidence:** `conductor/tracks/20261128-release-v1-28-0/verification/phase-4.md`

## Phase R1: Resolve strict-review documentation finding

- **Goal:** README truthfully distinguishes completed local candidate verification from pending CI/tag/deploy/live work.
- **Depends on:** Phase 4 and review round 1
- **Covers:** NFR-2
- **Touches:** `README.md`, `conductor/tracks/20261128-release-v1-28-0/verification/phase-R1.md`
- **Verification:** `node scripts/validate-docs.js && pnpm check`; primary also runs the full `verify_phase` gate.
- **Status:** verified

- [x] **R1.T1: Correct the README candidate-status wording** — covers: NFR-2
  - [x] **R1.T1.1:** Update README lines 241 and 292 to say local candidate verification passed while CI, tag, deploy, and live verification remain pending; retain DRAFT and `SKIPPED — accepted gap`.
- [x] **R1.T2: Verify and record the fix** — covers: NFR-2
  - [x] **R1.T2.1:** Run docs/static checks, record evidence, and obtain primary full-gate verification.

**Result:** verified — F1 resolved; both README entries now distinguish completed local candidate verification from pending CI/tag/deploy/live work. Docs/static checks and the primary full gate passed (165 files / 3,559 tests; coverage 96.91/90.23/96.22/98.06; all validators green).
**Checkpoint:** `f448e29b`
**Evidence:** `conductor/tracks/20261128-release-v1-28-0/verification/phase-R1.md`

## Phase 5: Post-merge ship runbook

- **Goal:** a preflighted runbook exists for issue closure, separate tag/deploy authorization, immutable tagging, CI/deploy/live verification, and FINAL notes; no external mutation occurs in this phase.
- **Depends on:** Phase 4
- **Covers:** FR-6, FR-7, FR-8, FR-9, NFR-3, NFR-5, AC-6, AC-7, AC-8, AC-9
- **Touches:** `docs/release-notes-v1.28.0.md`, `conductor/tracks/20261128-release-v1-28-0/verification/**`
- **Verification:** `node scripts/validate-docs.js && pnpm check` plus recorded confirmation that `v1.28.0` is absent locally and on origin
- **Status:** verified

- [x] **P5.T1: Record the post-merge issue-closure procedure** — covers: FR-7, AC-7
  - [x] **P5.T1.1:** Specify the exact #108 completion comment and require PR #110 plus the merged release PR as evidence.
- [x] **P5.T2: Record the authorized tag, deploy, and live-verification procedure** — covers: FR-8, FR-9, NFR-3, NFR-5, AC-8, AC-9
  - [x] **P5.T2.1:** Require a separate explicit go-ahead, clean merged `master` HEAD, no tag collision, one annotated tag push, green tag CI/Coolify, and live HTTP/title/version/hash/service-worker/manifest checks.
- [x] **P5.T3: Record the FINAL-notes and rollback procedure** — covers: FR-2, FR-9, NFR-5, AC-2, AC-9
  - [x] **P5.T3.1:** Specify DRAFT → FINAL only after ship evidence passes, the docs/Conductor-only finalization exception, and the never-move-a-published-tag rollback rule.

**Result:** verified — exact merge/issue-closure, separately authorized immutable-tag, tag CI/Coolify/live, FINAL-notes and rollback runbook recorded without external mutation; local and remote `v1.28.0` tag absence confirmed by primary. Primary full gate: 165 files / 3,559 tests, coverage 96.91/90.23/96.22/98.06, build and all validators PASS.

**Checkpoint:** `532a7aae`

**Evidence:** `conductor/tracks/20261128-release-v1-28-0/verification/phase-5.md`

## Post-merge execution runbook

These operations are deliberately outside the autonomous phase loop because the
active goal stops at `awaiting-merge` and tagging requires separate authorization.

1. After the user answers **Merge now**, merge PR #<release-pr> with the configured
   `merge` method, verify `MERGED`, and delete the local and remote release branch.
2. Close issue #108 with the prepared completion comment linking PR #110 and the
   merged release PR.
3. Ask for explicit authorization to push immutable tag `v1.28.0` and trigger
   Coolify. Do not infer authorization from the merge answer.
4. Fetch `master`, confirm the release merge is HEAD and the tree is clean, and
   confirm `v1.28.0` exists neither locally nor on origin.
5. Create and push the annotated tag once. Never move, delete, or recreate it.
6. Require tag Quality Gates, Browser Journeys, and Deploy to Coolify to pass;
   verify live HTTP 200, title, local/remote shell hash, embedded `1.28.0`,
   `sw.js`, and `manifest.webmanifest`.
7. Flip notes DRAFT → FINAL with tag commit, CI run, deploy/live evidence, and
   `SKIPPED — accepted gap`; update archived ship evidence through the documented
   docs/Conductor-only finalization exception, then run `validate-docs` and diff
   checks.

## Rollback Strategy

- **Before tag:** revert the release PR; there is no production impact.
- **After tag/deploy:** never move or delete the published tag. Revert the release
  merge with a reviewed follow-up and cut a patch release if a shipped defect is
  found.
- **Data:** no migration, schema change, or profile rewrite occurs, so no user-data
  rollback is required.
