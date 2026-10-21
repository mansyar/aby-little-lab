# Hub Grid Decomposition — Implementation Plan

> **Branch:** `refactor/20261021-hub-grid-decomposition`
> **Base:** `master` @ `9976057d5739f8a77aa14590f1964cf5c3a29bbb`
>
> Phase states are `pending`, `in_progress`, `verified`, `failed`, or `blocked`.
> Only the primary agent writes this file. Phase subagents report results and the
> primary records them.

## Phase 1: Map concerns & establish the hub module foundation

- **Goal:** Concern inventory documented in evidence; `src/game/hub/` created with the shared constants module; grid layout + entrance bob extracted behind the orchestrator; hub behavior unchanged.
- **Depends on:** none
- **Covers:** FR-1, FR-2, FR-3, AC-1, AC-3
- **Touches:** `src/game/hub/**` (new), `src/game/hubGrid.ts`, `src/__tests__/game/hub/**` (new), `src/__tests__/game/hubGrid*`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run`
- **Status:** verified
- **Result:** verified
- **Checkpoint:** c8f3b33
- **Evidence:** conductor/tracks/20261021-hub-grid-decomposition/verification/phase-1.md

- [x] **P1.T1: Concern inventory & shared foundation** — covers: FR-1, FR-3
  - [x] **P1.T1.1: Inventory the four concerns in hubGrid.ts and record the module map (which lines/constants/helpers belong to which concern) in evidence**
  - [x] **P1.T1.2: Create src/game/hub/ with a shared constants module (named constants per FR-3) consumed by the orchestrator**
- [x] **P1.T2: Extract grid layout + entrance bob** — covers: FR-1, FR-2, FR-4
  - [x] **P1.T2.1: Extract grid layout and entrance-bob logic into a src/game/hub/ module; orchestrator delegates; HubScene untouched**
  - [x] **P1.T2.2: Module unit tests (layout math, entrance bob, reduced-motion variant)**

<!--
The primary appends after acceptance:
**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/<track-id>/verification/phase-1.md
-->

## Phase 2: Extract the phone paging board

- **Goal:** The paged phone layout (page computation, dots, swipe, slide) lives in a `src/game/hub/` module reusing `hubPaging.ts` where it already fits; the orchestrator delegates.
- **Depends on:** Phase 1
- **Covers:** FR-1, FR-2, AC-1
- **Touches:** `src/game/hub/**`, `src/game/hubGrid.ts`, `src/__tests__/game/hub/**`, `src/__tests__/game/hubGrid*`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run`
- **Status:** verified
- **Result:** verified
- **Checkpoint:** d16d4b7
- **Evidence:** conductor/tracks/20261021-hub-grid-decomposition/verification/phase-2.md

- [x] **P2.T1: Extract the paging board** — covers: FR-1, FR-2, FR-4
  - [x] **P2.T1.1: Extract page state machine (computation, dots, swipe, slide) into a src/game/hub/ module; orchestrator delegates; wide-viewport layouts byte-identical**
  - [x] **P2.T1.2: Module unit tests (page math, swipe/slide, wide-viewport identity)**

<!--
The primary appends after acceptance:
**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/<track-id>/verification/phase-2.md
-->

## Phase 3: Extract the sticker shelf & time-up dimming

- **Goal:** Sticker shelf (sparkle/burst) and time-up dimming extracted as independent `src/game/hub/` modules with reduced-motion variants preserved.
- **Depends on:** Phase 2
- **Covers:** FR-1, FR-2, AC-1, AC-3
- **Touches:** `src/game/hub/**`, `src/game/hubGrid.ts`, `src/__tests__/game/hub/**`, `src/__tests__/game/hubGrid*`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run`
- **Status:** verified
- **Result:** verified
- **Checkpoint:** bb7ff5e
- **Evidence:** conductor/tracks/20261021-hub-grid-decomposition/verification/phase-3.md

- [x] **P3.T1: Extract the sticker shelf** — covers: FR-1, FR-4
  - [x] **P3.T1.1: Extract sparkle/burst logic into a src/game/hub/ module; orchestrator delegates**
  - [x] **P3.T1.2: Module unit tests (sparkle, burst, reduced-motion, award racing a page transition)**
- [x] **P3.T2: Extract time-up dimming** — covers: FR-1, FR-4
  - [x] **P3.T2.1: Extract dimming logic into a src/game/hub/ module; orchestrator delegates; interacts correctly with the paging board**
  - [x] **P3.T2.2: Module unit tests (dim state, dim-while-paged edge, shutdown cleanup)**

<!--
The primary appends after acceptance:
**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/<track-id>/verification/phase-3.md
-->

## Phase 4: Orchestrator slim-down & full gate

- **Goal:** `hubGrid.ts` at ≤200 lines with dead code removed (test-confirmed) and internal renames applied; public module surface unchanged; full verification gate green.
- **Depends on:** Phase 3
- **Covers:** FR-2, FR-3, AC-2, AC-4, NFR-1, NFR-2, NFR-3
- **Touches:** `src/game/hub/**`, `src/game/hubGrid.ts`, `src/__tests__/game/hub/**`, `src/__tests__/game/hubGrid*`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js`
- **Status:** verified
- **Result:** verified
- **Checkpoint:** c40d39c
- **Evidence:** conductor/tracks/20261021-hub-grid-decomposition/verification/phase-4.md

- [x] **P4.T1: Slim the orchestrator** — covers: FR-2, FR-3
  - [x] **P4.T1.1: Dead-code sweep (test-confirmed) and internal renames; itemize every cleanup by class in evidence**
  - [x] **P4.T1.2: Record line count (≤200) and confirm HubScene still imports only hubGrid.ts**
- [x] **P4.T2: Run the full gate** — covers: AC-4, NFR-2
  - [x] **P4.T2.1: Full verify_phase command; record coverage (95/88/85/90), bundle size (shell ≤ 200 kB), and PWA results in evidence**

<!--
The primary appends after acceptance:
**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/<track-id>/verification/phase-4.md
-->

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
