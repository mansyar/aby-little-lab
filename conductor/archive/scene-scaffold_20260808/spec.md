# Track: Game Scene Scaffold Extraction (Refactor)

**Track ID:** `scene-scaffold_20260808`
**Type:** Refactor
**Status:** new

## Overview

All 13 game scenes duplicate the same outer skeleton: back button + ParentLock, corner mascot, progress dots, input locking, correct/incorrect feedback wiring, win celebration, sticker award + animation, 3s auto-return to Hub, and shutdown cleanup — plus a block of identical constants (`PROGRESS_DOT_*`, `DOT_POP_*`, `WIGGLE_*`, `NEXT_ROUND_DELAY`, `AUTO_RETURN_DELAY`, `STICKER_*`, `WIN_TWEEN_DURATION`, `OUTLINE_COLOR`, `SUCCESS_COLOR`, `CARD_BG_COLOR`).

This track extracts that scaffold into a reusable `GameSceneBase extends Phaser.Scene` and migrates all 13 game scenes onto it. **Pure refactor: zero user-visible behavior change.**

## Goals (Functional Requirements)

- **FR-1 — Base scaffold:** Create `src/scenes/GameSceneBase.ts` holding the shared state (`parentLock`, `mascot`, `speaker`, `audioManager`, `progressDots`, `inputLocked`) and shared methods:
  - `createBackButton()` — back text button + ParentLock + press feedback → `transitionToScene(this, "Hub")`
  - `createCornerMascot()` wrapper (delegates to the `createCornerMascot` component)
  - `createProgressDots(count)` / `fillProgressDot(index)` — parameterized so MusicalMemory (5 dots) and PopFreeze (0 dots) fit
  - `completeGame(opts)` — win SFX, mascot `cheer(true)`, `createWinCelebration`, sticker award + `createStickerAnimation` on first completion, `transitionToScene(this, "Hub", { justEarned })` after `AUTO_RETURN_DELAY`
  - `registerShutdownCleanup()` — destroys parentLock/mascot/speaker on `shutdown`
  - Shared constants promoted to `protected` on the base class
- **FR-2 — Migrate all 13 scenes:** Each of ShapeSorter, AnimalTrace, PopFreeze, ShadowMatch, MusicalMemory, BigSmall, PatternBuilder, Alphabet, WordMatch, WordBuilder, HowMany, FirstSounds, MoreLess extends `GameSceneBase` and removes its now-redundant scaffolding. Per-game mechanics (round rendering, input handling, drag/physics, wiggling targets, splash effects) remain in the subclasses untouched.
- **FR-3 — Scene registry unchanged:** `sceneRegistry.ts` key mapping and lazy loading stay exactly as-is (class exports unchanged).

## Non-Functional Requirements

- **NFR-1 — Behavior parity:** No visual, audio, timing, or navigation changes. All user-facing flows behave identically before and after.
- **NFR-2 — Code quality:** Biome clean; coverage remains >80%; no new abstractions beyond the scaffold itself; constants de-duplicated (single source of truth on base class).

## Acceptance Criteria

- **AC-1 (Tests):** Full suite green — all existing ~1,101 tests pass (scene tests updated only where they asserted removed scaffolding internals; behavioral assertions preserved).
- **AC-2 (New tests):** New focused tests for `GameSceneBase`: `createProgressDots` count/spacing/alpha, `fillProgressDot` pop + fill, `completeGame` sticker-earned vs. already-earned paths, auto-return data (`{ justEarned }` vs. `undefined`), shutdown cleanup, back-button ParentLock success path.
- **AC-3 (Integration):** `navigation.test.ts` (scene graph/transitions) and all 13 scene tests green; `pnpm run check`, `CI=true pnpm test`, `pnpm run build`, `node scripts/validate-pwa.js` all pass.
- **AC-4 (Manual):** `pnpm dev` playthrough — each of the 13 games launches from Hub, plays to completion, awards sticker once, auto-returns after 3s; reduced-motion and touch inputs unaffected.
- **AC-5 (Docs):** `conductor/tech-stack.md` updated with the scene scaffold architecture note.

## Out of Scope

- Any user-visible change (visual, timing, SFX, navigation)
- Gameplay logic refactors (round generation, evaluation)
- Refactoring `HubScene`, `BootScene`, `PreloadScene`, `SettingsPanel`, or non-scene components
- PopFreeze/MusicalMemory mechanic changes (they only adopt the shared skeleton; dots behavior unchanged)
- Per-profile difficulty, new games, or other deferred product items
