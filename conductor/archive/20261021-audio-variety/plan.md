# Audio Variety & Feedback Depth — Implementation Plan

> **Branch:** feat/20261021-audio-variety
> **Base:** master @ f33885c41a2009a4e5d6c47e482d879df24f8014

Phase states: `pending` / `in_progress` / `verified` / `failed` / `blocked`.
Only the primary agent writes this file.

## Phase 1: Identity foundation

- **Goal:** The central identity table and game-context resolution exist and
  are unit-tested; the trio still sounds default because parameters are not
  yet applied (behavior-neutral phase).
- **Depends on:** none
- **Covers:** FR-1, FR-2, FR-3, AC-1, AC-2
- **Touches:** `src/game/audioIdentity.ts` (new), `src/audio/AudioManager.ts`,
  `src/scenes/GameSceneBase.ts`, `src/__tests__/game/audioIdentity.test.ts`
  (new), `src/__tests__/audio/*`, `src/__tests__/scenes/gameSceneBase.test.ts`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run`
- **Status:** verified

- [x] **P1.T1: Identity schema & table** — covers: FR-1, FR-3
  - [x] **P1.T1.1: Define the `AudioIdentity` schema (pitch offset in semitones, timbre/waveform, tempo/duration multiplier, per-cue melodic contour) with bounded-range validation and a documented default identity**
  - [x] **P1.T1.2: Write formula-derived identity entries for all 22 GAME_REGISTRY gameIds**
- [x] **P1.T2: Game-context resolution** — covers: FR-2
  - [x] **P1.T2.1: Add the AudioManager game-context API (set/clear) with identity lookup for the correct/incorrect/win cues and unknown-gameId fallback to the default**
  - [x] **P1.T2.2: Register the context in GameSceneBase at init and clear it at shutdown (~3 lines)**
- [x] **P1.T3: Foundation tests** — covers: AC-1, AC-2
  - [x] **P1.T3.1: Registry-iteration test proving all 22 gameIds resolve to non-default identities**
  - [x] **P1.T3.2: Resolution and fallback tests (sampled games route through identity params; unknown id yields the default)**

**Result:** verified
**Checkpoint:** ba7b37b
**Evidence:** conductor/tracks/20261021-audio-variety/verification/phase-1.md

<!--
The primary appends after acceptance:
**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/20261021-audio-variety/verification/phase-1.md
-->

## Phase 2: Synthesis application

- **Goal:** The correct, incorrect, and win voices consume the identity
  parameters (pitch, timbre, tempo, contour); all 22 games are audibly
  distinct at the formula-derived stage.
- **Depends on:** Phase 1
- **Covers:** FR-3, AC-3, NFR-1, NFR-2
- **Touches:** `src/audio/AudioManager.ts`, `src/game/audioIdentity.ts`,
  `src/__tests__/audio/*`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run`
- **Status:** verified

- [x] **P2.T1: Apply parameters in the trio synth** - covers: FR-3, AC-3
  - [x] **P2.T1.1: Correct and incorrect voices consume pitch, timbre, tempo, and contour from the resolved identity**
  - [x] **P2.T1.2: Win voice consumes identity while staying within the celebration duration budget**
- [x] **P2.T2: Semantic & constraint tests** — covers: AC-3, NFR-1, NFR-2
  - [x] **P2.T2.1: Pin pitch/waveform/duration/contour semantics for representative identities; assert the incorrect cue stays gentle-descending and the win cue stays within budget**

**Result:** verified
**Checkpoint:** 5554cf2
**Evidence:** conductor/tracks/20261021-audio-variety/verification/phase-2.md

<!--
The primary appends after acceptance:
**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/20261021-audio-variety/verification/phase-2.md
-->

## Phase 3: Tuning pass & full gate

- **Goal:** The user audibly reviews the formula identities via `pnpm dev`,
  adjustments are applied to the table, and the full verify_phase gate is
  green on the final tree.
- **Depends on:** Phase 2
- **Covers:** FR-4, AC-4, NFR-3, NFR-4, NFR-5
- **Touches:** `src/game/audioIdentity.ts`,
  `src/__tests__/game/audioIdentity.test.ts`,
  `conductor/tracks/20261021-audio-variety/verification/*`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js`
- **Status:** verified

**Result:** verified
**Checkpoint:** ba10a2c
**Evidence:** conductor/tracks/20261021-audio-variety/verification/phase-3.md

- [x] **P3.T1: User-audited tuning pass** - covers: FR-4, AC-4
  - [x] **P3.T1.1: Batched listen pass with the user (game families), table adjustments applied and recorded** — outcome: user verdict "All good as-is"; formula defaults ship as final, no table adjustments needed
- [x] **P3.T2: Full gate** - covers: NFR-3, NFR-4, NFR-5, AC-4
  - [x] **P3.T2.1: Run the full verify_phase gate; record coverage (95/88/85/90), bundle headroom, and PWA results in evidence**

<!--
The primary appends after acceptance:
**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/20261021-audio-variety/verification/phase-3.md
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

- [ ] **R1.T1: Resolve <finding ID>** - covers: <finding ID>
-->

## Phase R1: Review Fixes

- **Goal:** Resolve review findings F1, F2, F3.
- **Depends on:** Phase 3
- **Covers:** F1, F2, F3
- **Touches:** `src/game/audioIdentity.ts`,
  `src/__tests__/game/audioIdentity.test.ts`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run`
- **Status:** verified

**Result:** verified
**Checkpoint:** 080c704
**Evidence:** conductor/tracks/20261021-audio-variety/verification/phase-R1.md

- [x] **R1.T1: Resolve F1 (plan.md Phase 2 header status)** — covers: F1 (primary-only conductor-state fix)
- [x] **R1.T2: Resolve F2 + F3 (tempo-bounds comment; incorrect-contour monotonicity assertion)** — covers: F2, F3
