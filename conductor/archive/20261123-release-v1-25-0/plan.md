# Release v1.25.0 — Implementation Plan

> **Branch:** `chore/20261123-release-v1-25-0`
> **Base:** `master` @ `9ffbc01d3eb976bedfd6f5bc92b8e269abd9173a`
>
> Phase states are `pending`, `in_progress`, `verified`, `failed`, or `blocked`.
> Only the primary agent writes this file. Phase subagents report results and the
> primary records them.

## Phase 1: Strict module-size refactor

- **Goal:** every production module under `src/**/*.ts` (excluding `src/__tests__/**`) is ≤ 400 lines, with no behavior change.
- **Depends on:** none
- **Covers:** FR-4, NFR-1, NFR-2, NFR-4, AC-3, AC-10
- **Touches:** `src/**/*.ts` (production modules and their extractions), import sites, tests if imports change, living count lines in README.md/docs/TDD.md/docs/perf-baseline.md if test counts change
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified

- [x] **P1.T1: Split the five modules over 600 lines** — covers: FR-4
  - [x] **P1.T1.1:** Extract cohesive helpers without changing public APIs
  - [x] **P1.T1.2:** Update imports and barrel exports
- [x] **P1.T2: Split the eight modules in the 400–599 band** — covers: FR-4
- [x] **P1.T3: Update ripple imports and living count claims** — covers: NFR-2

**Result:** verified — 167 production files, 0 over 400 lines (max 399); suite 154/3,346; full `verify_phase` green.
**Checkpoint:** `0c6e79d5`
**Evidence:** `conductor/tracks/20261123-release-v1-25-0/verification/phase-1.md`

## Phase 2: Module-size guard

- **Goal:** `validate-module-size.js` passes real source and fails a synthetic oversized fixture, and is wired into every `verify_phase` site.
- **Depends on:** Phase 1
- **Covers:** FR-5, NFR-3, AC-4
- **Touches:** `scripts/validate-module-size.js`, `package.json`, `conductor/workflow.md`, `conductor/tracks/20261123-release-v1-25-0/verification/phase-2.md`, and `src/scenes/gameSceneView.ts` (one behavior-neutral parameter rename to keep the single-playIncorrect-call-site invariant after Phase 1's extraction)
- **Verification:** `node scripts/validate-module-size.js` real PASS + synthetic fixture exit 1 + full `verify_phase`
- **Status:** verified

- [x] **P2.T1: Implement the guard** — covers: FR-5
  - [x] **P2.T1.1:** Prove the synthetic oversized fixture fails with exit 1
- [x] **P2.T2: Wire the guard into all workflow.md `verify_phase` occurrences and add the package.json script** — covers: FR-5

**Result:** verified — 167 production files, zero warnings; 601-line fixture exits 1; guard wired at workflow.md:39/119/195/225 and package.json.
**Checkpoint:** `6815d8c3`
**Evidence:** conductor/tracks/20261123-release-v1-25-0/verification/phase-2.md

## Phase 3: Changelog split

- **Goal:** all historical entries live in `docs/changelog.md`; both Conductor docs carry one-line pointers; roadmap P6 items marked Done.
- **Depends on:** Phase 2
- **Covers:** FR-6, NFR-2, AC-5
- **Touches:** `docs/changelog.md`, `conductor/product.md`, `conductor/tech-stack.md`, `README.md`
- **Verification:** `node scripts/validate-docs.js`
- **Status:** verified

- [x] **P3.T1: Move all dated changelog entries verbatim into `docs/changelog.md`** — covers: FR-6
- [x] **P3.T2: Insert pointer links in both Conductor docs and link the file from README's Documentation index** — covers: FR-6
- [x] **P3.T3: Mark both P6 roadmap items Done in `conductor/product.md`** — covers: FR-6

**Result:** verified — 33 changelog sections moved verbatim (32 product + 1 tech-stack), byte-comparison proof in evidence; pointers and README link added; both P6 roadmap rows Done 2026-11-23; full verify_phase green.
**Checkpoint:** c4014bd6
**Evidence:** conductor/tracks/20261123-release-v1-25-0/verification/phase-3.md

## Phase 4: Version and release notes

- **Goal:** version, DRAFT notes and README links are in place.
- **Depends on:** Phase 3
- **Covers:** FR-1, FR-2, FR-3, FR-10, NFR-2, AC-1, AC-2, AC-9
- **Touches:** `package.json`, `docs/release-notes-v1.25.0.md`, `README.md`
- **Verification:** `node scripts/validate-docs.js` + `pnpm check` + `pnpm typecheck`
- **Status:** verified

- [x] **P4.T1: Bump version to 1.25.0** — covers: FR-1
- [x] **P4.T2: Write DRAFT notes covering PR #92 and the P6 work, with the device-pass gap** — covers: FR-2, FR-10
- [x] **P4.T3: Add README Documentation link and Releases table row dated 2026-11-23** — covers: FR-3

**Result:** verified — package.json 1.25.0; DRAFT notes covering PR #92 + both P6 items with the accepted device-pass gap; README link and dated Releases row; full verify_phase green.
**Checkpoint:** 08f1c09b
**Evidence:** conductor/tracks/20261123-release-v1-25-0/verification/phase-4.md

## Phase 5: Gate, review and merge

- **Goal:** full gate green, review PASS, PR merged with all checks green.
- **Depends on:** Phase 4
- **Covers:** FR-7, FR-8, NFR-3, AC-6, AC-7
- **Touches:** `conductor/tracks/20261123-release-v1-25-0/*` only
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified

- [x] **P5.T1: Run integrated verification and post-review doc sync** — covers: FR-7
- [x] **P5.T2: Pass `conductor-review` with up to two fix rounds** — covers: FR-7
- [x] **P5.T3: Open PR, watch CI, merge after explicit go-ahead** — covers: FR-8

**Result:** verified — full gate green; review PASS in 2 rounds (F1/F2 fixed, none deferred); PR #93 green after the `threads` pool fix and merged at `4359667b`.
**Checkpoint:** `4359667b`
**Evidence:** conductor/archive/20261123-release-v1-25-0/verification/phase-5.md

## Phase 6: Tag and ship

- **Goal:** tag `v1.25.0` on merged master HEAD pushed only after explicit go-ahead; notes flipped to FINAL.
- **Depends on:** Phase 5
- **Covers:** FR-9, AC-8
- **Touches:** `docs/release-notes-v1.25.0.md`, git tag
- **Verification:** `git ls-remote origin refs/tags/v1.25.0` resolves to merged master HEAD + notes FINAL + `node scripts/validate-docs.js`
- **Status:** verified

- [x] **P6.T1: Confirm no existing v1.25.0 tag locally or on origin** — covers: FR-9
- [x] **P6.T2: Create and push the tag after explicit go-ahead** — covers: FR-9
- [x] **P6.T3: Flip notes DRAFT→FINAL with tag/CI/deploy record** — covers: FR-9

**Result:** verified — `v1.25.0` pushed at merged master HEAD `4359667b` after owner go-ahead; tag CI run `45124846826` green with the Coolify webhook fired; notes FINAL with tag/CI/deploy record.
**Checkpoint:** `4359667b`
**Evidence:** conductor/archive/20261123-release-v1-25-0/verification/phase-6.md

## Phase R1: Review Fixes

- **Goal:** Resolve review findings F1 (release-note CI claim) and F2 (stale integrated diff count).
- **Depends on:** Phase 4
- **Covers:** F1, F2
- **Touches:** `docs/release-notes-v1.25.0.md`, `conductor/tracks/20261123-release-v1-25-0/verification/integrated.md`, `verification/phase-R1.md`
- **Verification:** `node scripts/validate-docs.js` + `pnpm check` + `pnpm typecheck`
- **Status:** verified

- [x] **R1.T1: Correct the release-note CI coverage claim (F1)** — covers: F1
- [x] **R1.T2: Correct the integrated verification diff counts (F2)** — covers: F2

**Result:** verified — F1 and F2 fixed exactly as briefed; full `verify_phase` green (154/3,346; coverage 97.15/90.97/96.28/98.30; 167 modules zero warnings; 319 SVGs; PWA 16/16; docs 5/5).
**Checkpoint:** `19aebacb`
**Evidence:** conductor/tracks/20261123-release-v1-25-0/verification/phase-R1.md
