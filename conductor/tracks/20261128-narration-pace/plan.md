# Add a parent control for narration pace — Implementation Plan

> **Branch:** `feat/20261128-narration-pace`
> **Base:** `master` @ `effc18fb99313d8d915d706fea185f6e528d916b`
>
> Phase states are `pending`, `in_progress`, `verified`, `failed`, or `blocked`.
> Only the primary agent writes this file. Phase subagents report results and the
> primary records them.

## Phase 1: Pace model and speech wiring

- **Goal:** The active profile's pace preset determines every utterance rate, with Gentle byte-identical to today.
- **Depends on:** none
- **Covers:** FR-2, FR-3, FR-5, NFR-1, NFR-3, AC-2, AC-3, AC-5
- **Touches:** `src/types/index.ts`, `src/game/narrationPace.ts`, `src/utils/speech.ts`, `src/game/storage.ts`, `src/__tests__/utils/speech.test.ts`, `src/__tests__/game/narrationPace.test.ts`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified

**Result:** verified
**Checkpoint:** 5a05c92c
**Evidence:** conductor/tracks/20261128-narration-pace/verification/phase-1.md

- [x] **P1.T1: Pace model and rate mapping** — covers: FR-2
  - [x] **P1.T1.1: `NarrationPace` type (`slower`/`gentle`/`standard`) with the approved rate table**
  - [x] **P1.T1.2: Wire the active pace into all four speak paths**
- [x] **P1.T2: Per-profile persistence and normalisation** — covers: FR-3, FR-5
  - [x] **P1.T2.1: Additive `Profile` field with Gentle backfill and unknown-value normaliser**
  - [x] **P1.T2.2: SFX-off and speech-unsupported paths unchanged (guard tests)**

## Phase 2: Settings control, profile switching, backup/restore

- **Goal:** A parent can set pace per child in Settings; it follows the active profile and survives backup/restore.
- **Depends on:** Phase 1
- **Covers:** FR-1, FR-4, NFR-2, AC-1, AC-4
- **Touches:** `src/components/SettingsPanel.*`, `src/scenes/BootScene.ts`, `src/game/backup.ts`, `src/__tests__/components/SettingsPanel.test.ts`, `e2e/journeys/settings*.spec.ts`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified

**Result:** verified
**Checkpoint:** 9f37f684
**Evidence:** conductor/tracks/20261128-narration-pace/verification/phase-2.md

- [x] **P2.T1: Settings pace control** — covers: FR-1
  - [x] **P2.T1.1: Three-preset selector beside voice, bound to the active profile**
  - [x] **P2.T1.2: Apply on boot and on profile switch (voice-preference seam precedent)**
- [x] **P2.T2: Backup/restore carriage** — covers: FR-4
  - [x] **P2.T2.1: Export includes pace; merge/replace yield a valid pace per profile**
