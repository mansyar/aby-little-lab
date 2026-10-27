# Release v1.23.0 — Implementation Plan

> **Branch:** `chore/20261027-release-v1-23-0`
> **Base:** `master` @ `e584ecb109f67cd08d5f269d76f77ffd7f8fc93b`
>
> Phase states are `pending`, `in_progress`, `verified`, `failed`, or `blocked`.
> Only the primary agent writes this file. Phase subagents report results and the
> primary records them.

## Phase 1: Version bump and release notes

- **Goal:** The repo reads `1.23.0` with dated notes covering all PRs since `v1.22.0`, README-linked, docs validator green.
- **Depends on:** none
- **Covers:** FR-1, FR-2, FR-3, NFR-1, NFR-2, AC-1, AC-2 (pre-FINAL), AC-5
- **Touches:** `package.json`, `docs/release-notes-v1.23.0.md`, `README.md`
- **Verification:** `node scripts/validate-docs.js` plus `pnpm check && pnpm typecheck` (no `src/` change expected; full gate runs in Phase 2)
- **Status:** verified

**Result:** verified
**Checkpoint:** be133c98
**Evidence:** conductor/tracks/20261027-release-v1-23-0/verification/phase-1.md

- [x] **P1.T1: Bump the version** — covers: FR-1, AC-1
  - [x] **P1.T1.1:** `package.json` `1.22.0` → `1.23.0` (version field only, no lockfile hand-edits).
  - [x] **P1.T1.2:** Confirm no save-schema change in PR #75 (spec assumption check; record the answer in the phase evidence).
- [x] **P1.T2: Write the release notes** — covers: FR-2, AC-2, AC-5
  - [x] **P1.T2.1:** `docs/release-notes-v1.23.0.md` with Status DRAFT header, `v1.22.0` Base, parent-facing lede, one section per PR since `v1.22.0` in merge order (resolve the exact set via `git log v1.22.0..base`; currently PR #75 only), verification section, and the skipped device pass recorded as an accepted gap.
  - [x] **P1.T2.2:** Link the notes from the README Documentation index; `validate-docs` 6/6.

<!--
The primary appends after acceptance:
**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/20261027-release-v1-23-0/verification/phase-1.md
-->

## Phase 2: Gate, review, merge

- **Goal:** Release state proven green, reviewed, and merged to `master` via PR.
- **Depends on:** Phase 1
- **Covers:** FR-4, NFR-1, NFR-3, AC-3
- **Touches:** `conductor/tracks/20261027-release-v1-23-0/*` (evidence, review, pr notes)
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** in_progress

- [ ] **P2.T1: Full gate on the release state** — covers: FR-4, AC-3
- [ ] **P2.T2: Conductor review + fixes** — covers: NFR-3
- [ ] **P2.T3: PR, CI watch, merge** — covers: AC-3

<!--
The primary appends after acceptance:
**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/20261027-release-v1-23-0/verification/phase-2.md
-->

## Phase 3: Tag and ship

- **Goal:** Tag `v1.23.0` pushed to origin, deploy fired, notes flipped FINAL.
- **Depends on:** Phase 2 (merged to `master`)
- **Covers:** FR-5, AC-2 (FINAL flip), AC-4
- **Touches:** `docs/release-notes-v1.23.0.md` (Status flip only), git tag `v1.23.0`
- **Verification:** `git ls-remote origin refs/tags/v1.23.0` resolves to the `master` HEAD; notes Status reads FINAL
- **Status:** pending

- [ ] **P3.T1: Create and push the tag** — covers: FR-5, AC-4
  - [ ] **P3.T1.1:** Confirm tag `v1.23.0` does not already exist.
  - [ ] **P3.T1.2:** With explicit user go-ahead, tag the merged `master` HEAD and push the tag (fires the Coolify deploy).
- [ ] **P3.T2: Flip the notes to FINAL** — covers: AC-2
  - [ ] **P3.T2.1:** Status DRAFT → FINAL with tag/deploy record, on `master` directly after the deploy fires.

<!--
The primary appends after acceptance:
**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/20261027-release-v1-23-0/verification/phase-3.md
-->
