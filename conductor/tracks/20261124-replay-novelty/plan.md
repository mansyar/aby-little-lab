# Replay Novelty — Implementation Plan

> **Branch:** `feat/20261124-replay-novelty`
> **Base:** `master` @ `57389e8f`
>
> Phase states are `pending`, `in_progress`, `verified`, `failed`, or `blocked`.
> Only the primary agent writes this file. Phase subagents report results and the
> primary records them.

## Phase 1: Visit policy and selector

- **Goal:** A pure, deterministic module records played games for one profile's
  visit and selects a non-repeating suggestion with the agreed ordering.
- **Depends on:** none
- **Covers:** FR-1, FR-2, FR-3, FR-8, NFR-1, AC-1, AC-2, AC-3, AC-8
- **Touches:** `src/game/replayVariety.ts` (new), `src/__tests__/game/replayVariety.test.ts` (new), plus the living suite-count lines in `README.md`, `docs/TDD.md` and `docs/perf-baseline.md` that the docs validator derives from the new test file
- **Verification:** `pnpm exec vitest run src/__tests__/game/replayVariety.test.ts`
- **Status:** verified

- [x] **P1.T1: Model one profile's visit state** — covers: FR-1
  - [x] **P1.T1.1:** Create a fresh empty set on Hub entry with no storage writes.
  - [x] **P1.T1.2:** Record a played `GameId` once per successful launch and expose a read-only view.
- [x] **P1.T2: Implement the no-repeat selector** — covers: FR-2, FR-3
  - [x] **P1.T2.1:** Rank unplayed-this-visit first, then existing `lastPlayed` stamps (never played first), then registry order.
  - [x] **P1.T2.2:** Exclude the last played and last suggested game; expose forced repeats when only one candidate remains.
- [x] **P1.T3: Prove the session metric** — covers: FR-8
  - [x] **P1.T3.1:** Simulate ≥1,000 seeded eight-play visits and assert median distinct games ≥ 4.
  - [x] **P1.T3.2:** Assert zero unexpected immediate repeats across every simulated visit.

**Result:** verified — 155 files / 3,362 tests, full verify_phase green; 16 selector/simulation tests pass.
**Checkpoint:** 83818e64
**Evidence:** conductor/tracks/20261124-replay-novelty/verification/phase-1.md

## Phase 2: Hub suggestion and idle cue

- **Goal:** Professor Hoot points to the selected tile, the launch hook records
  the play, the idle wiggle uses the same selector, and profile switches reset.
- **Depends on:** Phase 1
- **Covers:** FR-4, FR-5, FR-7, NFR-3, AC-4, AC-5, AC-7
- **Touches:** `src/game/hub/hubAttract.ts`, `src/game/hub/gameLaunch.ts`, `src/game/hubGrid.ts` (read-only visible-game helper), `src/scenes/HubScene.ts`, `src/__tests__/game/hub/hubAttract.test.ts`, `src/__tests__/scenes/hubEngagement.test.ts`, `src/__tests__/scenes/hubScene.test.ts`
- **Verification:** `pnpm exec vitest run src/__tests__/game/hub/hubAttract.test.ts src/__tests__/scenes/hubEngagement.test.ts src/__tests__/scenes/hubScene.test.ts`
- **Status:** verified

- [x] **P2.T1: Wire the suggestion cue** — covers: FR-4
  - [x] **P2.T1.1:** Ask the selector for a game on Hub entry and show a textless mascot/point cue at that tile.
  - [x] **P2.T1.2:** Keep the existing tile tap as the only launch path; add no speech call.
- [x] **P2.T2: Replace the idle wiggle rotation** — covers: FR-5
  - [x] **P2.T2.1:** Choose wiggle targets through the no-repeat selector.
  - [x] **P2.T2.2:** Keep the reduced-motion guard so no wiggle tween is created.
- [x] **P2.T3: Reset on profile switch** — covers: FR-7
  - [x] **P2.T3.1:** Clear visit state in the `onSwitch` hook and re-derive the suggestion.
  - [x] **P2.T3.2:** Rebuild state fresh when returning to a previously used profile.

**Result:** verified — textless static ring at the suggested visible tile, launch hook records the visit, selector-driven idle wiggle with no immediate repeat, profile switch resets; full verify_phase green (155/3,362; coverage 97.09/90.86/96.30/98.25; 169 modules zero warnings; PWA 16/16; docs 5/5).
**Checkpoint:** ae37c190
**Evidence:** conductor/tracks/20261124-replay-novelty/verification/phase-2.md

## Phase 3: Sticker shelf spotlight

- **Goal:** Each Hub visit spotlights one earned sticker, advancing through the
  active profile's collection with an empty-slot fallback and no new art.
- **Depends on:** Phase 2
- **Covers:** FR-6, NFR-2, AC-6
- **Touches:** `src/game/replayVariety.ts`, `src/game/hub/replayCue.ts`, `src/game/hub/stickerShelf.ts`, `src/game/hubGrid.ts`, `src/scenes/HubScene.ts`, `src/__tests__/game/hub/stickerShelf.test.ts`, `src/__tests__/game/hubGrid.test.ts`, `src/__tests__/scenes/hubScene.test.ts`
- **Verification:** `pnpm exec vitest run src/__tests__/game/hub/stickerShelf.test.ts src/__tests__/game/hubGrid.test.ts src/__tests__/scenes/hubScene.test.ts`
- **Status:** verified

- [x] **P3.T1: Derive the spotlight target** — covers: FR-6
  - [x] **P3.T1.1:** Collect earned stickers from the active profile in registry order and advance one cursor per visit with wrap-around.
  - [x] **P3.T1.2:** Fall back to one dashed empty slot when the profile has no earned stickers.
- [x] **P3.T2: Render a gentle static-or-tween spotlight** — covers: FR-6, NFR-2
  - [x] **P3.T2.1:** Reuse the existing sticker keys and sparkle/tween helpers; add no SVG or texture key.
  - [x] **P3.T2.2:** Land on a static highlighted state under reduced motion.

**Result:** verified — one earned-sticker spotlight per Hub visit with per-profile cursor and wrap-around, empty-slot fallback, static graphics ring with no new art; full verify_phase green (155/3,362; coverage 97.11/90.86/96.31/98.26; 169 modules zero warnings; PWA 16/16; docs 5/5).
**Checkpoint:** 44be2e4a
**Evidence:** conductor/tracks/20261124-replay-novelty/verification/phase-3.md

## Phase 4: Doc sync and full gate

- **Goal:** Every doc describes the shipped behaviour and all guards pass on the
  final tree.
- **Depends on:** Phase 3
- **Covers:** FR-9, FR-10, NFR-4, AC-9, AC-10
- **Touches:** `README.md`, `docs/PRD.md`, `docs/TDD.md`, `conductor/product.md`, and any count-bearing doc the validator names
- **Verification:** `node scripts/validate-docs.js`
- **Status:** pending

- [ ] **P4.T1: Sync behaviour docs** — covers: FR-9
  - [ ] **P4.T1.1:** Describe the suggestion cue, no-repeat policy and sticker spotlight in README and PRD.
  - [ ] **P4.T1.2:** Record the new modules and tests in TDD; mark the roadmap row Done without moving other milestones.
- [ ] **P4.T2: Run the full gate** — covers: FR-10, NFR-4
  - [ ] **P4.T2.1:** Pass the full `verify_phase` chain including bundle, module-size, texture, PWA and docs guards.
  - [ ] **P4.T2.2:** Confirm no save-schema, art, audio or game-rule file changed outside the stated Touches.

<!--
**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/20261124-replay-novelty/verification/phase-4.md
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
