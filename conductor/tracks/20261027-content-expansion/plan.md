# Content Expansion — Words, Stories, Scenarios — Implementation Plan

> **Branch:** `feat/20261027-content-expansion`
> **Base:** `master` @ `f28aa39257fff080bba68b53554d195d07fc5e3e`
>
> Phase states are `pending`, `in_progress`, `verified`, `failed`, or `blocked`.
> Only the primary agent writes this file. Phase subagents report results and the
> primary records them.

## Phase 1: Words pool expansion

- **Goal:** WORD_POOL grows with phonics-safe, band-fitted words plus art and tests.
- **Depends on:** none
- **Covers:** FR-1, FR-4, FR-6, NFR-1, NFR-2, AC-1, AC-6
- **Touches:** `src/game/wordLogic.ts`, `src/game/art/*`, `src/__tests__/game/word*`
- **Verification:** `pnpm test -- --run src/__tests__/game/word && pnpm typecheck`
- **Status:** in_progress

- [ ] **P1.T1: Expand WORD_POOL data** — covers: FR-1
  - [ ] **P1.T1.1: Add moderate batch of phonics-safe words with band placement**
  - [ ] **P1.T1.2: Reject duplicates; verify TTS-safe wording**
- [ ] **P1.T2: Add word art (Storybook Flat + tiered rasters)** — covers: FR-4
- [ ] **P1.T3: Update word pool tests** — covers: AC-1

<!--
The primary appends after acceptance:
**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/20261027-content-expansion/verification/phase-1.md
-->

## Phase 2: Stories pool expansion

- **Goal:** Story pool grows obvious→subtle, 3 panels per story, rendering verified.
- **Depends on:** Phase 1
- **Covers:** FR-2, FR-4, NFR-1, NFR-2, AC-2
- **Touches:** `src/game/storyOrderLogic.ts`, `src/game/storyOrderArt.ts`, `src/__tests__/game/story*`
- **Verification:** `pnpm test -- --run src/__tests__/game/story && pnpm typecheck`
- **Status:** pending

- [ ] **P2.T1: Add new stories data in obvious→subtle order** — covers: FR-2
  - [ ] **P2.T1.1: Author story texts with 3-panel breakdowns**
- [ ] **P2.T2: Add 3-panel Storybook Flat art per story** — covers: FR-4
- [ ] **P2.T3: Update story order tests** — covers: AC-2

<!--
The primary appends after acceptance:
**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/20261027-content-expansion/verification/phase-2.md
-->

## Phase 3: Feelings scenarios expansion

- **Goal:** Feelings scenario pool grows on the contrastive→confusable ladder.
- **Depends on:** Phase 2
- **Covers:** FR-3, FR-4, NFR-1, NFR-4, AC-3
- **Touches:** `src/game/feelingsFacesLogic.ts`, `src/game/art/faces.ts`, `src/__tests__/game/feelings*`
- **Verification:** `pnpm test -- --run src/__tests__/game/feelings && pnpm typecheck`
- **Status:** pending

- [ ] **P3.T1: Add new scenarios on contrast ladder** — covers: FR-3
  - [ ] **P3.T1.1: Keep contrastive pairs first, confusable sad/scared later**
- [ ] **P3.T2: Add face art as needed (Storybook Flat)** — covers: FR-4
- [ ] **P3.T3: Update feelings tests** — covers: AC-3

<!--
The primary appends after acceptance:
**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/20261027-content-expansion/verification/phase-3.md
-->

## Phase 4: Banding, full gate, docs sync

- **Goal:** Adaptive ±1 band preserved, full verification + bundle/PWA/docs gates green, counts synced.
- **Depends on:** Phase 3
- **Covers:** FR-5, NFR-1, NFR-2, NFR-3, NFR-4, NFR-5, AC-4, AC-5, AC-6
- **Touches:** `src/__tests__/game/adaptive*`, `docs/*`, `conductor/product.md`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** pending

- [ ] **P4.T1: Re-verify adaptive banding per affected game** — covers: FR-5
- [ ] **P4.T2: Sync pool counts in docs + run full gate** — covers: AC-4, AC-5, AC-6

<!--
Review fixes are appended by `conductor-review` as:

## Phase R1: Review Fixes

- **Goal:** Resolve review findings ...
- **Depends on:** Phase 4
- **Covers:** review findings
- **Touches:** ...
- **Verification:** ...
- **Status:** pending

- [ ] **R1.T1: Resolve <finding ID>** — covers: <finding ID>
-->
