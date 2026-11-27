# Surface adaptive-band movement on the Progress Overview — Implementation Plan

> **Branch:** `feat/20261127-progress-band-movement`
> **Base:** `master` @ `07d5c108684519581e088abcc9437905d50607ae`
>
> Phase states are `pending`, `in_progress`, `verified`, `failed`, or `blocked`.
> Only the primary agent writes this file. Phase subagents report results and the
> primary records them.

## Phase 1: Implement and prove the current spread

- **Goal:** Ship a deterministic, tested Overview readout of the viewed profile's current adaptive-band spread.
- **Depends on:** none
- **Covers:** FR-1, FR-2, FR-3, FR-4, FR-5, FR-6, FR-7, FR-9, NFR-1, NFR-2, NFR-3, NFR-4, NFR-5, AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8
- **Touches:** `src/game/adaptiveSummary.ts`, `src/__tests__/game/adaptiveSummary.test.ts`, `src/components/settings/ProgressOverlay.ts`, `src/__tests__/components/settings/ProgressOverlay.test.ts`, `README.md`, `docs/TDD.md`, `docs/perf-baseline.md`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified

- [x] **P1.T1: Add adaptive-summary logic tests** — covers: FR-1, FR-2, FR-7, AC-1, AC-2, AC-3, AC-7
  - [x] **P1.T1.1:** Cover mixed, all-classic, sparse, and disabled states with deterministic fixtures.
  - [x] **P1.T1.2:** Cover exact threshold, short/malformed windows, no mutation, and boundary counts.
- [x] **P1.T2: Implement the pure adaptive-spread helper** — covers: FR-1, FR-2, FR-4, NFR-2, NFR-4, AC-1, AC-2, AC-3, AC-4, AC-7
  - [x] **P1.T2.1:** Reuse `MIN_SAMPLE` and `bandShiftFor` to derive assessed/easier/classic/harder counts.
  - [x] **P1.T2.2:** Return explicit copy for every required state without clock, storage, or profile dependencies.
- [x] **P1.T3: Add Progress Overview component tests** — covers: FR-3, FR-5, FR-6, FR-7, AC-5, AC-6
  - [x] **P1.T3.1:** Prove viewed-profile switching changes the spread and never reads the active profile.
  - [x] **P1.T3.2:** Prove only the Overview note changes while per-game pages and the three statements remain intact.
- [x] **P1.T4: Wire the Overview readout** — covers: FR-3, FR-4, FR-5, FR-6, NFR-3, AC-4, AC-5, AC-6
  - [x] **P1.T4.1:** Replace the static note only on page 0 with the current-spread readout.
  - [x] **P1.T4.2:** Preserve the static per-game note, layout, paging, and adaptive-off behavior.
- [x] **P1.T5: Sync living engineering truth** — covers: FR-9, NFR-5, AC-8
  - [x] **P1.T5.1:** Update README/TDD/perf-baseline counts and build figures exposed by the gate.
  - [x] **P1.T5.2:** Keep historical release notes and archived figures unchanged.
- [x] **P1.T6: Run the full gate and record evidence** — covers: NFR-5, AC-8
  - [x] **P1.T6.1:** Run the exact configured verification chain and resolve any living-doc drift.
  - [x] **P1.T6.2:** Prove the phase-base diff stays inside the allowed scope and write `verification/phase-1.md`.

**Result:** verified
**Checkpoint:** `df98e3246122e3f98af41e883d0facd6d061407c`
**Evidence:** `conductor/tracks/20261127-progress-band-movement/verification/phase-1.md`
**Approved deviation:** `src/__tests__/components/SettingsPanel.test.ts` — updated one legacy static-note assertion to the new sparse Overview copy; no production code changed.

## Phase 2: Product documentation truth sync

- **Goal:** Make the product docs accurately describe current spread without claiming longitudinal movement.
- **Depends on:** Phase 1
- **Covers:** FR-8, AC-9, NFR-5
- **Touches:** `docs/PRD.md`, `docs/changelog.md`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified

- [x] **P2.T1: Update the PRD adaptive-band description** — covers: FR-8, AC-9
  - [x] **P2.T1.1:** Describe assessed-game counts, easier/classic/harder states, and the six-tap evidence floor.
  - [x] **P2.T1.2:** State explicitly that current spread does not measure the two-week longitudinal target.
- [x] **P2.T2: Add the dated changelog entry** — covers: FR-8, AC-9
  - [x] **P2.T2.1:** Record the parent-facing current-spread readout and preserved per-game pages.
  - [x] **P2.T2.2:** Keep v1.25.0/v1.26.x historical claims unchanged.
- [x] **P2.T3: Run the full gate and record evidence** — covers: NFR-5, AC-9
  - [x] **P2.T3.1:** Run the exact configured verification chain with docs validation 5/0.
  - [x] **P2.T3.2:** Prove only the allowed docs changed and write `verification/phase-2.md`.

**Result:** verified
**Checkpoint:** `40db0123df856890b1e2bf5dd13008ea1ffa5650`
**Evidence:** `conductor/tracks/20261127-progress-band-movement/verification/phase-2.md`

## Primary-only state follow-up

After Phase 2 acceptance, update `conductor/roadmap.md` §10.3's metric wording
from “not surfaced” to “current spread surfaced; two-week movement unmeasured.”
Do not retire the RM-6 row until the track completion commit.

## Phase R1: Review Fixes

- **Goal:** Resolve the strict review findings without broadening the product scope.
- **Depends on:** Phase 2
- **Covers:** F1, F2, F3, NFR-3, NFR-5, FR-5, FR-8, AC-5, AC-9
- **Touches:** `src/game/adaptiveSummary.ts`, `src/__tests__/game/adaptiveSummary.test.ts`, `src/components/settings/ProgressOverlay.ts`, `src/__tests__/components/settings/ProgressOverlay.test.ts`, `docs/PRD.md`, `docs/TDD.md`, `docs/changelog.md`, `README.md`, `docs/perf-baseline.md`, `conductor/tracks/20261127-progress-band-movement/verification/phase-2.md`, `conductor/tracks/20261127-progress-band-movement/verification/phase-R1.md`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified

- [x] **R1.T1: Exclude non-adaptive games from the spread** — covers: F1, NFR-3
  - [x] Skip Robot Path and Fix-It Machine while retaining deterministic normalization and band rules.
  - [x] Add sparse/all-games regressions proving their sufficient windows cannot change counts; reconcile PRD/TDD/changelog wording to adaptive games.
- [x] **R1.T2: Wrap the Overview note within its card** — covers: F2, FR-5, AC-5
  - [x] Apply the existing `OVERVIEW_TEXT_WIDTH` to the note's word wrap while preserving center alignment and per-game behavior.
  - [x] Add a style regression for the longest mixed line and provide narrow-viewport visual evidence.
- [x] **R1.T3: Correct evidence and run the full gate** — covers: F3, NFR-5, FR-8, AC-9
  - [x] Remove the Phase 2 evidence trailing blank line and make its whitespace claim accurate.
  - [x] Refresh gate-exposed living counts/figures only if needed; run the exact configured gate and record `verification/phase-R1.md`.

**Result:** verified
**Checkpoint:** `72f95f55f48320b0acd427a77b09562c52369f8a`
**Evidence:** `conductor/tracks/20261127-progress-band-movement/verification/phase-R1.md`
**Approved deviation:** the frozen Phase 2 checkpoint range retains its historical EOF blank line; the current file and full review range are clean, and no history rewrite was performed.
