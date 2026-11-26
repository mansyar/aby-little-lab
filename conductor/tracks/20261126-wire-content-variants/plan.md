# Wire the four signature content variants into real playthroughs — Implementation Plan

> **Branch:** `feat/20261126-wire-content-variants`
> **Base:** `master` @ `f328437f4ac464a5bde808c8dc4cdf058c77d130`
>
> Phase states are `pending`, `in_progress`, `verified`, `failed`, or `blocked`.
> Only the primary agent writes this file. Phase subagents report results and the
> primary records them.

## Phase 1: Rule-level variant wiring

- **Goal:** A pure selector and optional variant id on the four generators draw both slides per game while preserving tier, mix, unique-shape, and one-per-emotion invariants, with full-pool fallback for thin variants.
- **Depends on:** none
- **Covers:** FR-1, FR-2, FR-3, FR-4, FR-5, FR-7, FR-8, NFR-1, NFR-2, NFR-4, AC-1, AC-2, AC-3, AC-4, AC-5, AC-7, AC-8
- **Touches:** `src/game/contentVariants.ts`, `src/game/wordLogic.ts`, `src/game/storyOrderLogic.ts`, `src/game/shapeSorterLogic.ts`, `src/game/feelingsFacesLogic.ts`, `src/__tests__/game/wordLogic.test.ts`, `src/__tests__/game/storyOrderLogic.test.ts`, `src/__tests__/game/shapeSorterLogic.test.ts`, `src/__tests__/game/feelingsFacesLogic.test.ts`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** in_progress

- [ ] **P1.T1: Add the pure variant selector** — covers: FR-1
  - [ ] **P1.T1.1:** Define the two slide ids per game and a no-state selector driven by an injected RNG
  - [ ] **P1.T1.2:** Test the 0/1 boundaries and both reachable ids with seeded RNGs
- [ ] **P1.T2: Wire the word generator** — covers: FR-2, FR-7
  - [ ] **P1.T2.1:** Add optional variant to `generateWordPlaythrough` with tier/shift/no-repeat preservation and full-pool fallback
  - [ ] **P1.T2.2:** Prove both variants and no-variant parity with seeded tests
- [ ] **P1.T3: Wire the story-order generator** — covers: FR-3, FR-7
  - [ ] **P1.T3.1:** Add optional variant to `buildPlaythrough`, keeping the RNG-first signature, obvious/subtle mix, and full-pool fallback for `growing-things`
  - [ ] **P1.T3.2:** Prove both variants, mix behavior, and no-variant parity with seeded tests
- [ ] **P1.T4: Wire the shape-sorter generator** — covers: FR-4, FR-7
  - [ ] **P1.T4.1:** Add optional variant to `generatePlaythrough` with three unique shapes per round and full-pool fallback for `curvy`
  - [ ] **P1.T4.2:** Prove both variants, no global repeats, and no-variant parity with seeded tests
- [ ] **P1.T5: Wire the feelings-faces generator** — covers: FR-5, FR-7
  - [ ] **P1.T5.1:** Add optional variant to `drawScenarios` while keeping one scenario per emotion and no repeats
  - [ ] **P1.T5.2:** Prove both variants and no-variant parity with seeded tests
- [ ] **P1.T6: Prove invariants and scope** — covers: FR-8, NFR-1, NFR-2
  - [ ] **P1.T6.1:** Run the full gate and confirm coverage thresholds and fallback cases
  - [ ] **P1.T6.2:** Confirm the diff contains only rule modules, the selector, and their tests, with no asset/schema/dependency/storage change

<!--
The primary appends after acceptance:
**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/20261126-wire-content-variants/verification/phase-1.md
-->

## Phase 2: Scene pass-through

- **Goal:** The four signature scenes select a slide 50/50 per playthrough and pass it to their generator, and scene/flow tests prove both slides are reachable without changing completion.
- **Depends on:** Phase 1
- **Covers:** FR-6, NFR-3, NFR-4, NFR-5, AC-6
- **Touches:** `src/scenes/WordMatchScene.ts`, `src/scenes/StoryOrderScene.ts`, `src/scenes/ShapeSorterScene.ts`, `src/scenes/FeelingsFacesScene.ts`, `src/__tests__/scenes/wordMatchScene.test.ts`, `src/__tests__/scenes/storyOrderScene.test.ts`, `src/__tests__/scenes/shapeSorterScene.test.ts`, `src/__tests__/scenes/shapeSorterFlow.test.ts`, `src/__tests__/scenes/feelingsFacesScene.test.ts`, `src/__tests__/scenes/feelingsFacesFlow.test.ts`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** pending

- [ ] **P2.T1: Pass the selected slide through each scene** — covers: FR-6
  - [ ] **P2.T1.1:** Use the pure selector with each scene's existing RNG and forward the chosen id to the generator
  - [ ] **P2.T1.2:** Keep round counts, scoring, completion, and adaptive-band calls unchanged
- [ ] **P2.T2: Prove scene reachability and completion** — covers: AC-6
  - [ ] **P2.T2.1:** Extend scene/flow tests so both slides are exercised per game with seeded RNGs
  - [ ] **P2.T2.2:** Rerun existing completion and no-repeat assertions for both slides
- [ ] **P2.T3: Prove scope and regression safety** — covers: NFR-3, NFR-4, NFR-5
  - [ ] **P2.T3.1:** Run the full gate and confirm docs validation stays 5 passed / 0 failed
  - [ ] **P2.T3.2:** Confirm the phase diff is limited to the four scenes and their tests

<!--
The primary appends after acceptance:
**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/20261126-wire-content-variants/verification/phase-2.md
-->

## Phase 3: Docs truth sync

- **Goal:** PRD, TDD, and changelog describe the now-reachable variants and their fallback, while the v1.25.0 note stays historical and the docs validator stays green.
- **Depends on:** Phase 2
- **Covers:** FR-9, NFR-4, NFR-5, AC-9
- **Touches:** `docs/PRD.md`, `docs/TDD.md`, `docs/changelog.md`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** pending

- [ ] **P3.T1: Update the PRD** — covers: FR-9
  - [ ] **P3.T1.1:** Record that all four signature variant sets now reach play through a 50/50 per-playthrough draw
  - [ ] **P3.T1.2:** Note that thin variants fall back to the full classic pool and the deeper-pool stance is now satisfied
- [ ] **P3.T2: Update the TDD** — covers: FR-9
  - [ ] **P3.T2.1:** Describe the selector, optional generator arguments, and fallback rules
  - [ ] **P3.T2.2:** Record the invariants preserved and the tests that prove both slides
- [ ] **P3.T3: Update the changelog and prove docs** — covers: AC-9, NFR-5
  - [ ] **P3.T3.1:** Add a concise changelog entry without editing `docs/release-notes-v1.25.0.md`
  - [ ] **P3.T3.2:** Run the full gate and confirm `node scripts/validate-docs.js` reports 5 passed / 0 failed

<!--
The primary appends after acceptance:
**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/20261126-wire-content-variants/verification/phase-3.md
-->

<!--
Review fixes are appended by `conductor-review` as:

## Phase R1: Review Fixes

- **Goal:** Resolve review findings ...
- **Depends on:** Phase 3
- **Covers:** review findings
- **Touches:** ...
- **Verification:** ...
- **Status:** pending

- [ ] **R1.T1: Resolve <finding ID>** — covers: <finding ID>
-->
