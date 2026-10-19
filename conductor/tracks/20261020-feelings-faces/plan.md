# Feelings Faces — Implementation Plan

> **Branch:** `feat/20261020-feelings-faces`
> **Base:** `master` @ `cce1bf8a0aa33e5ef1c4e138d7f539f1a229a4f7`
>
> Phase states are `pending`, `in_progress`, `verified`, `failed`, or `blocked`.
> Only the primary agent writes this file. Phase subagents report results and the
> primary records them.

## Phase 1: Content & logic core

- **Goal:** A pure, dependency-free logic module that owns the scenario pool, per-playthrough draw, contrast ladder, and round scoring — fully unit-tested.
- **Depends on:** none
- **Covers:** FR-5, FR-6, FR-11, AC-4, AC-5, AC-9
- **Touches:** `src/game/feelingsFacesLogic.ts`, `src/__tests__/game/feelingsFacesLogic.test.ts`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run src/__tests__/game/feelingsFacesLogic.test.ts`
- **Status:** verified

**Result:** verified
**Checkpoint:** 92c5f49
**Evidence:** conductor/tracks/20261020-feelings-faces/verification/phase-1.md

- [x] **P1.T1: Scenario pool + types** — covers: FR-11
  - [x] **P1.T1.1: Define `Emotion` union (happy/sad/angry/scared) and `Scenario { id, emotion, text }`**
  - [x] **P1.T1.2: Author 16 scenarios (4 per emotion), all ≤ 60 chars, gentle-and-resolvable tone**
- [x] **P1.T2: Playthrough draw** — covers: FR-5
  - [x] **P1.T2.1: Seeded `drawScenarios(rng)` returning 6 with no repeats, covering all 4 emotions at least once**
- [x] **P1.T3: Contrast ladder** — covers: FR-6
  - [x] **P1.T3.1: Rounds 1–3 use maximally distinct pairs; rounds 4–6 use confusable pairs**
  - [x] **P1.T3.2: `buildRoundChoices()` returns 3 distinct emotion cards with the target guaranteed present**
- [x] **P1.T4: Round scoring state machine** — covers: FR-3, FR-4
  - [x] **P1.T4.1: Pure `answer(round, emotion)` → `{correct, nextRound, taps}`; wrong answers never advance**
- [x] **P1.T5: Unit suite** — covers: AC-4, AC-5, AC-9
  - [x] **P1.T5.1: 20-run draw determinism/no-repeat test**
  - [x] **P1.T5.2: Contrast table test for each round index**
  - [x] **P1.T5.3: Scenario-content guard test (length, safe-tone word blocklist)**

## Phase 2: Art and asset preload

- **Goal:** All six new assets exist, preloaded and sized, with the preload suite green.
- **Depends on:** Phase 1
- **Covers:** FR-9 (sticker asset), NFR-4, NFR-5, NFR-7
- **Touches:** `src/assets/svg/feelings/**`, `src/assets/svg/ui/tile_feelings_faces.svg`, `src/assets/svg/stickers/sticker_feelings_faces.svg`, `src/scenes/PreloadScene.ts`, `src/__tests__/scenes/preloadScene.test.ts`, `src/__tests__/assets/**`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run src/__tests__/scenes/preloadScene.test.ts src/__tests__/assets && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js`
- **Status:** verified

**Result:** verified
**Checkpoint:** e6ff082
**Evidence:** conductor/tracks/20261020-feelings-faces/verification/phase-2.md

> **Adjustment (2026-10-20):** all id/registry wiring moved to Phase 3. `GameId` is
> counted by progress, storage, grid, paging, navigation, and lifecycle suites, so the
> new id, the tile, and the scene must land in one commit set or every count assertion
> breaks.
>
> **Revision 1 (2026-10-20):** after a visual review the art took one rework pass —
> preschool proportions, no neck or collar, a shape-level angry cue, a single-face tile,
> and a palette-red sticker. Payload dropped to 8,636 bytes.

- [x] **P2.T1: Four expression SVGs** — covers: NFR-5
  - [x] **P2.T1.1: Draw Aby happy/sad/angry/scared in the flat storybook style, shapes distinct without color**
- [x] **P2.T2: Tile + sticker SVGs** — covers: FR-9
  - [x] **P2.T2.1: `tile_feelings_faces.svg` icon**
  - [x] **P2.T2.2: `sticker_feelings_faces.svg` heart badge**
  - [x] **P2.T2.3: Confirm total added payload ≤ 40 KB**
- [x] **P2.T3: Preload registration** — covers: NFR-4
  - [x] **P2.T3.1: Preload the six assets under their texture keys**
- [x] **P2.T4: Preload tests** — covers: NFR-4
  - [x] **P2.T4.1: Extend `preloadScene` asset expectations**

## Phase 3: Gameplay scene

- **Goal:** A playable 6-round game wired to the hub, TTS, feedback, sticker award, and per-profile progress.
- **Depends on:** Phase 2
- **Covers:** FR-1, FR-2, FR-3, FR-4, FR-7, FR-8, FR-9, FR-10, AC-1, AC-2, AC-3, AC-6, AC-7, AC-8
- **Touches:** `src/scenes/FeelingsFacesScene.ts`, `src/scenes/sceneRegistry.ts`, `src/game/hubTiles.ts`, `src/types/index.ts`, `src/__tests__/scenes/feelingsFacesScene.test.ts`, `src/__tests__/game/hubTiles.test.ts`, `src/__tests__/game/hubGrid.test.ts`, `src/__tests__/game/hubPaging.test.ts`, `src/__tests__/game/progressLogic.test.ts`, `src/__tests__/utils/storage.test.ts`, `src/__tests__/scenes/navigation.test.ts`, `src/__tests__/scenes/sceneLifecycle.test.ts`, `src/__tests__/scenes/hubScene.test.ts`, `src/__tests__/scenes/hubEngagement.test.ts`, `src/__tests__/scenes/firstWordsIntegration.test.ts`, `src/__tests__/helpers/gameScenes.ts`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run src/__tests__/scenes/feelingsFacesScene.test.ts src/__tests__/scenes/sceneRegistry.test.ts src/__tests__/game/hubTiles.test.ts src/__tests__/game/hubGrid.test.ts src/__tests__/game/hubPaging.test.ts src/__tests__/game/progressLogic.test.ts src/__tests__/scenes/navigation.test.ts src/__tests__/scenes/sceneLifecycle.test.ts`
- **Status:** pending

- [ ] **P3.T1: Scene skeleton** — covers: FR-2
  - [ ] **P3.T1.1: Extend `GameSceneBase`; lay out 3 face cards + rule line + speaker glyph**
- [ ] **P3.T2: Round rendering + speech** — covers: FR-2, FR-7
  - [ ] **P3.T2.1: Render the ladder's 3 distinct faces per round**
  - [ ] **P3.T2.2: Speak scenario; rule line spoken once and replayable**
- [ ] **P3.T3: Feedback loop** — covers: FR-3, FR-4
  - [ ] **P3.T3.1: Correct: chime + splash + advance**
  - [ ] **P3.T3.2: Incorrect: wiggle, gentle tone, re-speak once, same round**
- [ ] **P3.T4: Fallback + completion** — covers: FR-8, FR-9
  - [ ] **P3.T4.1: Caption fallback + dimmed speaker when no voice or SFX off**
  - [ ] **P3.T4.2: Win animation, one-time sticker, 3 s return to hub**
- [ ] **P3.T5: Registration + progress** — covers: FR-1, FR-10
  - [ ] **P3.T5.1: Add `feelings-faces` to `GameId` + `GAME_IDS` and fix every count assertion**
  - [ ] **P3.T5.2: Add lazy loader to `sceneRegistry`**
  - [ ] **P3.T5.3: Append hub tile 21 and update the tile/registry tests**
  - [ ] **P3.T5.4: Count plays/accuracy; mastery star after 3 wins**
- [ ] **P3.T6: Scene tests** — covers: AC-2, AC-3, AC-6, AC-7, AC-8
  - [ ] **P3.T6.1: 6-round traversal, wrong-tap no-advance, caption fallback, sticker-once, progress row**

## Phase 4: Flow, full gate, docs

- **Goal:** End-to-end flow coverage, full CI parity green, and product documentation updated.
- **Depends on:** Phase 3
- **Covers:** AC-10, NFR-1, NFR-2, NFR-3, NFR-6
- **Touches:** `src/__tests__/scenes/feelingsFacesFlow.test.ts`, `conductor/product.md`, `docs/SVG_STYLE.md`, `src/utils/textureTiers.ts`, `README.md`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js`
- **Status:** pending

- [ ] **P4.T1: Flow suite** — covers: AC-1
  - [ ] **P4.T1.1: Hub tile → 6 rounds → sticker → hub flow**
- [ ] **P4.T2: Suite-wide expectations** — covers: AC-1
  - [ ] **P4.T2.1: Update `GAME_SCENES`/`GAME_SCENE_KEYS`, nav and lifecycle counts from 20 to 21**
- [ ] **P4.T3: Documentation** — covers: NFR-6
  - [ ] **P4.T3.1: `product.md` — game table row 21 + changelog + cross-game systems note**
  - [ ] **P4.T3.2: `README.md` — "Twenty" → "Twenty-one", game table row, scene/test counts**
  - [ ] **P4.T3.3: Refresh the stale asset counts in `docs/SVG_STYLE.md` §8 and the `textureTiers.ts` header comment**
- [ ] **P4.T4: Full verification** — covers: AC-10
  - [ ] **P4.T4.1: Run full CI parity and write `verification/phase-4.md`**

<!--
The primary appends after acceptance:
**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/20261020-feelings-faces/verification/phase-<n>.md
-->
