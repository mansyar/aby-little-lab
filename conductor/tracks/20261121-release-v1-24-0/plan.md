# Release v1.24.0 — Implementation Plan

> **Branch:** `chore/20261121-release-v1-24-0`
> **Base:** `master` @ `6d0a0bba7a00c92d39d7390c1af60f52bfea434f`
>
> Phase states are `pending`, `in_progress`, `verified`, `failed`, or `blocked`.
> Only the primary agent writes this file. Phase subagents report results and the
> primary records them.

## Phase 1: Version bump and release notes

- **Goal:** The repo reads `1.24.0` with dated notes covering PRs #77–#90 in merge order, README-linked, docs validator green.
- **Depends on:** none
- **Covers:** FR-1, FR-2, FR-3, NFR-1, NFR-2, NFR-4, AC-1, AC-2, AC-6, AC-7
- **Touches:** `package.json`, `docs/release-notes-v1.24.0.md`, `README.md`
- **Verification:** `node scripts/validate-docs.js` plus `pnpm check && pnpm typecheck` (no `src/` change expected; full gate runs in Phase 2)
- **Status:** verified

- [x] **P1.T1: Bump the version** — covers: FR-1, AC-1
  - [x] **P1.T1.1:** `package.json` `1.23.0` → `1.24.0` (version field only; no lockfile hand-edits).
  - [x] **P1.T1.2:** Resolve the exact shipped set with `git log v1.23.0..<base> --merges`; confirm PRs #77–#90 and no `v1.24.0` tag locally or on origin; record in the phase evidence.
- [x] **P1.T2: Write the release notes** — covers: FR-2, AC-2, AC-6, AC-7
  - [x] **P1.T2.1:** `docs/release-notes-v1.24.0.md` with Status DRAFT header, Tag placeholder, Base `v1.23.0` (`45190721`, 2026-10-27), and a parent-facing lede.
  - [x] **P1.T2.2:** One section per PR #77–#90 in merge order, including Robot Path (23rd game), Fix-It Machine (24th game), Debug Probes' looks-not-scores rule, and PR #90's CC0 BGM, MIT license, and product-intent decisions.
  - [x] **P1.T2.3:** Installation, Release Verification and Known Issues sections; record the skipped device pass as an accepted gap and point at the device-testing checklist.
- [x] **P1.T3: Link the notes from the README** — covers: FR-3, AC-2
  - [x] **P1.T3.1:** Add the notes to the Documentation index.
  - [x] **P1.T3.2:** Add the `v1.24.0` row to the Releases table.

**Result:** verified
**Checkpoint:** 692545c7
**Evidence:** conductor/tracks/20261121-release-v1-24-0/verification/phase-1.md

## Phase 2: Gate, review and merge

- **Goal:** Release state proven green, reviewed, and merged to `master` via PR with green CI.
- **Depends on:** Phase 1
- **Covers:** FR-4, FR-5, NFR-3, AC-3, AC-4
- **Touches:** `conductor/tracks/20261121-release-v1-24-0/*` (evidence, review, PR notes)
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** in_progress

- [ ] **P2.T1: Full gate on the release state** — covers: FR-4, AC-3
- [ ] **P2.T2: Conductor review and required fix rounds** — covers: NFR-3
- [ ] **P2.T3: PR, CI watch and merge** — covers: FR-5, AC-4
  - [ ] **P2.T3.1:** Open the PR against `master` with the configured tool, watch CI, and merge with the configured `merge` method only after explicit user go-ahead (no `--admin` or `--auto`).

<!--
The primary appends after acceptance:
**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/20261121-release-v1-24-0/verification/phase-2.md
-->

## Phase 3: Tag and ship

- **Goal:** Tag `v1.24.0` pushed to origin, deploy fired, notes flipped FINAL.
- **Depends on:** Phase 2 (merged to `master`)
- **Covers:** FR-6, FR-7, AC-5
- **Touches:** `docs/release-notes-v1.24.0.md` (Status flip only), git tag `v1.24.0`
- **Verification:** `git ls-remote origin refs/tags/v1.24.0` resolves to the merged `master` HEAD; notes Status reads FINAL; `node scripts/validate-docs.js` stays green
- **Status:** pending

- [ ] **P3.T1: Confirm the tag is clear** — covers: FR-6, AC-5
  - [ ] **P3.T1.1:** Confirm `v1.24.0` does not exist locally or on origin and that the release commit is on `master` lineage.
- [ ] **P3.T2: Create and push the tag** — covers: FR-6, AC-5
  - [ ] **P3.T2.1:** With explicit user go-ahead, tag the merged `master` HEAD and push the tag (fires the tag-gated Coolify deploy).
- [ ] **P3.T3: Flip the notes to FINAL** — covers: FR-7, AC-5
  - [ ] **P3.T3.1:** Status DRAFT → FINAL with the tag and deploy record, on `master` directly after the deploy fires.

<!--
The primary appends after acceptance:
**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/20261121-release-v1-24-0/verification/phase-3.md
-->
