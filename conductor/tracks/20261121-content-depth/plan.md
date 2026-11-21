# Content Depth — Implementation Plan

> **Branch:** `feat/20261121-content-depth`
> **Base:** `master` @ `e208d45137ec9c2cf9d2cc28cab001a9838e64e5`
>
> Phase states are `pending`, `in_progress`, `verified`, `failed`, or `blocked`.
> Only the primary agent writes this file. Phase subagents report results and the
> primary records them.

## Phase 1: Word & shape depth

- **Goal:** Word and shape pools meet their floors with tiers/partitions and two variants each.
- **Depends on:** none
- **Covers:** FR-1, FR-4, FR-5 (partial), NFR-2, NFR-5, AC-1, AC-4, AC-5 (partial)
- **Touches:** `src/game/wordLogic.ts`, `src/game/shapeSorterLogic.ts`,
  `src/__tests__/game/decodeLogic.test.ts`, `src/__tests__/game/shapeSorterLogic.test.ts`,
  variant data modules; new shape SVGs + `src/game/art/shapes.ts`;
  `src/scenes/PatternBuilderScene.ts` (compile-forced exhaustive type map only);
  stale-count test files `src/__tests__/game/wordLogic.test.ts`,
  `src/__tests__/game/art/{groupIntegrity,shellOwnership,preloadArtGroups}.test.ts`,
  `src/__tests__/utils/textureTiers.test.ts`, `src/__tests__/scenes/preloadScene.test.ts`,
  `src/__tests__/game/hub/prewarm.test.ts` + `src/game/hub/prewarm.ts`
  (hardcoded shape-key list); and living test-count lines in `README.md`,
  `docs/TDD.md`, `docs/perf-baseline.md`
- **Verification:** `pnpm exec vitest run src/__tests__/game/decodeLogic.test.ts src/__tests__/game/shapeSorterLogic.test.ts`
- **Status:** verified

- [x] **P1.T1: Expand `WORD_POOL` to ≥60** — covers: FR-1
  - [x] **P1.T1.1:** Add words across 3-/4-letter tiers with confusable-family guards
  - [x] **P1.T1.2:** Reuse/tier art keys; assert count and tier invariants in tests
- [x] **P1.T2: Expand `ALL_SHAPES` to ≥24** — covers: FR-4
  - [x] **P1.T2.1:** Add shapes to easy/hard pools with tiered art keys
  - [x] **P1.T2.2:** Assert count and partition invariants in tests
- [x] **P1.T3: Add two word and two shape variants** — covers: FR-5 (partial)
  - [x] **P1.T3.1:** Define themed/subset variants reusing existing rules
  - [x] **P1.T3.2:** Assert variant selection does not alter rule logic

**Result:** verified
**Checkpoint:** `34c1d217`
**Evidence:** `conductor/tracks/20261121-content-depth/verification/phase-1.md`

## Phase 2: Story & scenario depth

- **Goal:** Story and scenario pools meet their floors with ladders/guards and two variants each.
- **Depends on:** Phase 1
- **Covers:** FR-2, FR-3, FR-5 (partial), NFR-2, NFR-5, AC-2, AC-3, AC-5 (partial)
- **Touches:** `src/game/storyOrderLogic.ts`, `src/game/storyOrderArt.ts`,
  `src/game/feelingsFacesLogic.ts`, 45 new `src/assets/svg/stories/*.svg` panels,
  `src/__tests__/game/{storyOrderLogic,storyOrderArt,feelingsFacesLogic}.test.ts`,
  variant data modules; stale-count test files (`art/groupIntegrity.test.ts`,
  `utils/textureTiers.test.ts`, `scenes/preloadScene.test.ts`,
  `game/hub/prewarm.test.ts` + `src/game/hub/prewarm.ts` as needed); and living
  test-count lines in `README.md`, `docs/TDD.md`, `docs/perf-baseline.md`
- **Verification:** `pnpm exec vitest run src/__tests__/game/storyOrderLogic.test.ts src/__tests__/game/feelingsFacesLogic.test.ts`
- **Status:** verified

- [x] **P2.T1: Expand `STORY_POOL` to ≥30** — covers: FR-2
  - [x] **P2.T1.1:** Extend `OBVIOUS_POOL`/`SUBTLE_POOL` ladder with tiered art
  - [x] **P2.T1.2:** Assert count and ladder invariants in tests
- [x] **P2.T2: Expand `SCENARIO_POOL` to ≥48 (12 per emotion)** — covers: FR-3
  - [x] **P2.T2.1:** Add scenarios per emotion preserving the safe-content guard
  - [x] **P2.T2.2:** Assert count, per-emotion balance and guard in tests
- [x] **P2.T3: Add two story and two scenario variants** — covers: FR-5 (partial)
  - [x] **P2.T3.1:** Define themed/subset variants reusing existing rules
  - [x] **P2.T3.2:** Assert variant selection does not alter rule logic

**Result:** verified
**Checkpoint:** `1ac2204a`
**Evidence:** `conductor/tracks/20261121-content-depth/verification/phase-2.md`

## Phase 3: No-repeat scheduling & budget guard

- **Goal:** Expanded pools schedule without repeats and a machine-checkable texture guard is wired in.
- **Depends on:** Phase 2
- **Covers:** FR-6, FR-7, NFR-1, NFR-3, AC-6, AC-7
- **Touches:** `scripts/validate-textures.js`, `package.json`, `conductor/workflow.md`,
  `src/game/*Logic.ts` (scheduling only), focused logic tests
- **Verification:** `node scripts/validate-textures.js && pnpm exec vitest run src/__tests__/game`
- **Status:** verified

- [x] **P3.T1: Add `scripts/validate-textures.js` guard** — covers: FR-7
  - [x] **P3.T1.1:** Compute typical/full texture bytes; fail above re-baselined caps (user decision: 80/320 MiB + ratio ≤ 0.5, overriding stale 39/178 MiB)
  - [x] **P3.T1.2:** Prove failure on a synthetic over-budget fixture
- [x] **P3.T2: Wire the guard into `verify_phase`** — covers: FR-7
  - [x] **P3.T2.1:** Add the guard to `conductor/workflow.md` and `package.json`
  - [x] **P3.T2.2:** Confirm the full chain still passes
- [x] **P3.T3: Prove no-repeat scheduling in all four games** — covers: FR-6
  - [x] **P3.T3.1:** Seeded-RNG tests for degenerate/random paths
  - [x] **P3.T3.2:** Assert no item repeats within a playthrough

**Result:** verified
**Checkpoint:** `ff643225`
**Evidence:** `conductor/tracks/20261121-content-depth/verification/phase-3.md`

## Phase 4: Doc sync

- **Goal:** Every count-bearing doc matches shipped pools and the budget gate is documented.
- **Depends on:** Phase 3
- **Covers:** FR-8, FR-9, NFR-4, NFR-5, AC-8, AC-9
- **Touches:** `README.md`, `docs/PRD.md`, `docs/TDD.md`, `docs/perf-baseline.md`,
  `conductor/product.md`
- **Verification:** `node scripts/validate-docs.js`
- **Status:** pending

- [ ] **P4.T1: Sync pool counts in README, PRD, TDD and perf-baseline** — covers: FR-8
  - [ ] **P4.T1.1:** Update counts and texture figures
  - [ ] **P4.T1.2:** Confirm living test counts
- [ ] **P4.T2: Update product roadmap exit gate and §10.5 table** — covers: FR-8, FR-9
  - [ ] **P4.T2.1:** Record the depth work and guard in `conductor/product.md`
  - [ ] **P4.T2.2:** Confirm no new games/rules/i18n/input changes in the diff

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
