# Add Game 25: a Repeat Machine for Loops — Implementation Plan

> **Branch:** `feat/20261128-repeat-machine`
> **Base:** `master` @ `1e02318e2134bfba98d411ae9b2ff5d32b4d37eb`
>
> Phase states are `pending`, `in_progress`, `verified`, `failed`, or `blocked`.
> Only the primary agent writes this file. Phase subagents report results and the
> primary records them.

## Phase 1: Repeat-N rule module and seeded tests

- **Goal:** A tested `repeatMachineLogic` module proving target counts, program verification, and ramp behavior.
- **Depends on:** none
- **Covers:** FR-1, FR-2, FR-4, FR-7, NFR-2, AC-1, AC-2, AC-3, AC-6
- **Touches:** `src/game/repeatMachineLogic.ts`, `src/__tests__/game/repeatMachineLogic.test.ts`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified

- [x] **P1.T1: Author the repeat-N rule module** — covers: FR-1, FR-2, FR-4
  - [x] **P1.T1.1:** Target-count schedule with 2→4 ramp across 6 rounds.
  - [x] **P1.T1.2:** Program model (action + count) and run verification (exact-N check).
- [x] **P1.T2: Seeded tests for all paths** — covers: FR-7, NFR-2, AC-6
  - [x] **P1.T2.1:** Correct-count, wrong-count, ramp, no-repeat, and determinism tests.

<!--
The primary appends after acceptance:
**Result:** verified
**Checkpoint:** 8106bb59
**Evidence:** conductor/tracks/20261128-repeat-machine/verification/phase-1.md
**Verified-by-primary:** module-size + textures + check/typecheck/targeted test + docs all green 2026-11-28
-->

## Phase 2: Scene, hub wiring, and browser journey

- **Goal:** Playable Repeat Machine as the 25th registered game with a passing four-engine journey.
- **Depends on:** Phase 1
- **Covers:** FR-3, FR-5, FR-6, NFR-1, NFR-3, AC-4, AC-5
- **Touches:** `src/scenes/RepeatMachineScene.ts`, `src/game/gameRegistry.ts`, `src/game/hubGroups.ts`, `e2e/journeys/repeat-machine.spec.ts`, `e2e/fixtures/game.ts`, `src/__tests__/scenes/repeatMachineScene.test.ts`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified

- [x] **P2.T1: Build the scene** — covers: FR-3, FR-4
  - [x] **P2.T1.1:** Target dots, authoring controls (action + count 2–4), mascot replay with sound.
  - [x] **P2.T1.2:** Wrong-count visible replay + retry; house scoring/completion/adaptive hooks.
- [x] **P2.T2: Wire the 25th game** — covers: FR-5, FR-6, NFR-1, NFR-3
  - [x] **P2.T2.1:** `GAME_IDS` entry, Thinking-group chip, progress rows, E2E state.
- [x] **P2.T3: Browser journey** — covers: AC-4, AC-5
  - [x] **P2.T3.1:** Four-engine journey: author, correct win, wrong-count retry, save intact.

<!--
Phase 2 acceptance (primary):
**Result:** verified
**Checkpoint:** cad06d91 + fix 415ad5de
**Evidence:** conductor/tracks/20261128-repeat-machine/verification/phase-2.md (+ primary texture re-baseline 320→322, full gate green 164/3529)
-->

<!--
Review fixes are appended by `conductor-review` as:

## Phase R1: Review Fixes

- **Goal:** Resolve review findings ...
- **Depends on:** Phase 2
- **Covers:** review findings
- **Touches:** ...
- **Verification:** ...
- **Status:** pending

- [ ] **R1.T1: Resolve <finding ID>** — covers: <finding ID>
-->

## Phase 3: Product and engineering truth sync

- **Goal:** Docs state 25 games with history intact and the gate green.
- **Depends on:** Phase 2
- **Covers:** FR-8, NFR-4, NFR-5, AC-7
- **Touches:** `docs/PRD.md`, `docs/TDD.md`, `docs/changelog.md`, `README.md`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** pending

- [ ] **P3.T1: Sync docs** — covers: FR-8, AC-7
  - [ ] **P3.T1.1:** PRD/TDD/changelog entries; README 24→25 with history unchanged.
