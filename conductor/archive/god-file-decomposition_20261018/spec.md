# Spec — God-File Decomposition (HubScene & SettingsPanel)

**Track ID:** `god-file-decomposition_20261018`
**Type:** Refactor
**Branch:** `refactor/god-file-decomposition`
**Date:** 2026-10-18

## Overview

Split the two god files into focused modules and eliminate duplicated test
scaffolding, with **byte-identical behavior** as the hard constraint. Plus:
verify and fix (if real) the `GameSceneBase` sticker-scale quirk discovered
during codebase analysis (v1.18.0 state).

- `src/scenes/HubScene.ts` — 1,382 lines, 14 `tweens.add`, paging + play-time
  gating + PWA toasts + profile switching + a hardcoded 20-entry
  `GAME_TILES` table all in one class.
- `src/components/SettingsPanel.ts` — 1,245 lines, 22 methods spanning the
  install row, voice row, profiles overlay, progress overlay, delete-profile
  modal, reset modal, and iOS how-to overlay.
- `src/__tests__/` — 15+ scene test files hand-roll the same ~30-line
  `matchMedia` stub and per-file Phaser mocks (`navigation.test.ts` alone is
  6,054 lines with a full inline Phaser mock).
- `src/scenes/GameSceneBase.ts` (lines ~92–95) — `SVG_SIZE` is derived from
  the *shape-sorter* sticker's texture size, so `STICKER_SCALE` is computed
  from the wrong texture for the other 19 games' sticker reveals. Works only
  if all sticker SVGs share dimensions — verify, then fix.

## Functional Requirements

1. **HubScene decomposition** — extract cohesive units (exact boundaries
   confirmed against the code during implementation):
   - `GAME_TILES` table → pure data module (e.g. `src/game/hubTiles.ts`)
   - Tile-grid rendering (classic 5×4 + paged narrow-viewport layouts) →
     dedicated module(s)
   - Play-time session logic (accrual, remaining-budget arc, hourglass nudge,
     time-up locking) → pure/reusable module
   - Profile avatar chip + toast wiring → focused modules as appropriate
   - `HubScene.ts` slims to orchestration only
2. **SettingsPanel decomposition** — extract per-overlay components:
   - Shared modal/row primitives where genuinely reused
   - Profiles overlay + delete-profile modal
   - Learning Progress overlay
   - Voice row, Install row, reset modal, iOS how-to overlay
   - `SettingsPanel.ts` slims to composition only
3. **Shared test helpers** — extract into `src/__tests__/helpers/`:
   - `matchMedia` stub module
   - Shared Phaser mock module (extracted from the largest inline mock)
   - **Fully migrate** all affected scene test files to the shared helpers;
     delete the duplicated stubs
4. **Sticker-scale quirk** — script over `src/assets/svg/stickers/` to verify
   dimensions; if uniform, fix `GameSceneBase` to derive `STICKER_SCALE` from
   the actual game's sticker texture (`textureSizeFor(gameId)`); if they
   differ, per-game scale is the intended behavior (documented in plan).

## Non-Functional Requirements

- Zero behavior change except the Phase 4 quirk fix (if dimensions differ);
  existing tests pass unchanged (import paths may change)
- Coverage ≥ configured thresholds (lines 95 / functions 88 / branches 85 /
  statements 90)
- Biome clean; bundle gate (shell ≤ 200 kB, Phaser vendor isolation), PWA
  gate, and boot-time gate (median cold boot < 3 s) all pass
- No new runtime dependencies

## Acceptance Criteria

- No file in `src/scenes/` or `src/components/` exceeds ~600 lines
- Every extracted module has a dedicated test file
- Zero remaining hand-rolled `matchMedia` stubs in scene test files
- `pnpm run check`, `CI=true pnpm test`, `pnpm run build`, and
  `scripts/validate-bundle.js` + `scripts/validate-pwa.js` +
  `scripts/validate-boot.js` all pass
- Manual smoke on tablet & phone-narrow viewport: Hub paging, every Settings
  overlay, 2–3 game rounds including a sticker reveal

## Out of Scope

- No new features
- No bug fixes beyond the sticker-scale quirk
- No changes to the 25 pure-logic modules in `src/game/` (except a new
  `hubTiles.ts` data module)
- No dependency upgrades
- No coverage-threshold changes
