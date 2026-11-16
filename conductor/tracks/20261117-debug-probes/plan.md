# Debug Probes — Implementation Plan

> **Branch:** `fix/20261117-debug-probes`
> **Base:** `master` @ `e6315890`
> **Autonomy:** ready
> **Decisions:** D1, D2, D3, D4, D5, D6, D7, D8
> **Effort:** 3

## Phase 1: A probe is a counter, not an answer

- **Goal:** a probe can be recorded end to end without changing accuracy or the adaptive window.
- **Depends on:** none
- **Covers:** FR-1, FR-2, FR-3, NFR-2, NFR-5, AC-1, AC-2
- **Touches:** `src/types/`, `src/game/progressLogic.ts`, `src/utils/storage.ts`, `src/__tests__/game/progressLogic.test.ts`, `src/__tests__/utils/storage.test.ts`, `src/__tests__/game/backup*.test.ts`
- **Dependencies:** none
- **Decisions:** D1, D3, D6
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified

- [x] **P1.T1: Add `probes` to `GameProgress` and the default entry** — covers: FR-1
  - [x] **P1.T1.1: Default is 0 and the type comment says what a probe is**
- [x] **P1.T2: Backfill `probes` in `normalizeProgress`** — covers: FR-1
  - [x] **P1.T2.1: A save with no probe field normalises to 0 with every other counter intact**
  - [x] **P1.T2.2: A negative, fractional or non-numeric value normalises to 0**
- [x] **P1.T3: Let `recordResult` and `recordTaps` carry probes** — covers: FR-2, FR-3
  - [x] **P1.T3.1: Probes add to `probes` only; accuracy and `recent` are identical with and without them**
  - [x] **P1.T3.2: An omitted probe count behaves as 0**
- [x] **P1.T4: Forward probes through `recordGameResult` and `recordGameTaps`** — covers: FR-4, NFR-5
  - [x] **P1.T4.1: The probe count rides the existing single `mutate`**
  - [x] **P1.T4.2: A backup exported and re-imported keeps its probes**
**Result:** verified
**Checkpoint:** PHASE1SHA
**Evidence:** conductor/tracks/20261117-debug-probes/verification/phase-1.md

## Phase 2: Fix-It stops scoring exploration

- **Goal:** a missed card tap in Fix-It records a probe, and the hint ladder still responds to it.
- **Depends on:** Phase 1
- **Covers:** FR-5, FR-6, FR-7, AC-3, AC-4
- **Touches:** `src/scenes/GameSceneBase.ts`, `src/scenes/FixItMachineScene.ts`, `src/__tests__/scenes/fixItMachineScene.test.ts`, `src/__tests__/scenes/gameSceneBase.test.ts`
- **Dependencies:** none
- **Decisions:** D2, D4
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** pending

- [ ] **P2.T1: Add `recordProbe()` to the base scene and flush it with the session** — covers: FR-5
  - [ ] **P2.T1.1: Completion and the abandoned-session path both carry the probe count**
  - [ ] **P2.T1.2: A scene that never probes records none and its flushed result is unchanged**
- [ ] **P2.T2: Record a missed card tap as a probe in `FixItMachineScene`** — covers: FR-6
  - [ ] **P2.T2.1: The bug-card tap and both tray outcomes keep their current scoring**
- [ ] **P2.T3: Keep the hint ladder driven by every missed tap** — covers: FR-7
  - [ ] **P2.T3.1: Two probes still raise the band hint; six still reach the tray pulse**
- [ ] **P2.T4: Audit every other scene's tap scoring and record the result** — covers: FR-6, D8
  - [ ] **P2.T4.1: The audit lands in the phase evidence with the call sites quoted**

## Phase 3: The parent sees looking, not failing

- **Goal:** the Learning Progress overlay reports looks without touching accuracy or the insights ranking, and one browser journey proves the whole path.
- **Depends on:** Phase 2
- **Covers:** FR-8, FR-9, FR-10, NFR-3, NFR-4, AC-3, AC-5, AC-6
- **Touches:** `src/components/settings/ProgressOverlay.ts`, `src/game/insightsSummary.ts`, `src/__tests__/components/`, `src/__tests__/game/insightsSummary.test.ts`, `e2e/journeys/fix-it-machine.spec.ts`, `e2e/fixtures/game.ts`
- **Dependencies:** none
- **Decisions:** D5, D7
- **Verification:** `pnpm build && pnpm test:e2e && pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** pending

- [ ] **P3.T1: Show a game's look count in the progress overlay** — covers: FR-8
  - [ ] **P3.T1.1: A game with zero probes renders no probe text**
- [ ] **P3.T2: Keep the insights accuracy ranking answer-only** — covers: FR-9
- [ ] **P3.T3: Extend the Fix-It journey to prove the recording** — covers: FR-10, NFR-4
  - [ ] **P3.T3.1: The journey's own taps explain its wrong count; accuracy reads 100%**
- [ ] **P3.T4: Cover the overlay row and the ranking rule with unit tests** — covers: FR-8, FR-9, AC-5, AC-6

## Phase 4: The rule is written down

- **Goal:** the counting rule is stated where a future game will look for it.
- **Depends on:** Phase 3
- **Covers:** FR-2, FR-6, FR-8, AC-7
- **Touches:** `docs/TDD.md`, `conductor/product.md`, `README.md`
- **Dependencies:** none
- **Decisions:** D1, D2, D5
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** pending

- [ ] **P4.T1: State the probe rule in the TDD's learning-progress section** — covers: FR-2, FR-6
  - [ ] **P4.T1.1: The section names a probe, what it never changes, and which taps are probes**
- [ ] **P4.T2: Note the debugging metric in the product definition** — covers: FR-8
- [ ] **P4.T3: Mention the look count where the README describes progress** — covers: FR-8
  - [ ] **P4.T3.1: No count-bearing claim changes, so the documents validator still passes**
