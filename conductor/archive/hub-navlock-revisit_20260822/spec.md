# Specification — Fix Hub Tiles Unresponsive After Completing a Game

**Track ID:** `hub-navlock-revisit_20260822` · **Type:** Bug Fix

## Overview

After finishing any game, the win-celebration auto-return lands on the Hub,
but every game tile is dead — taps do nothing. Root cause: `HubScene.navLocked`
is set `true` on the first tile tap and never reset anywhere. Phaser reuses
scene instances across `scene.start("Hub")`, so the flag persists into every
subsequent Hub visit and the guard at the top of the tile handler silently
swallows all future taps.

## Root Cause Evidence

- Tile handler (`src/scenes/HubScene.ts` ~L383):
  `if (this.timeUp || this.navLocked) return; this.navLocked = true;`
- Exactly 3 occurrences of `navLocked` repo-wide: declaration, guard,
  set-to-true. No reset in `init()`, `create()`, or the shutdown handler.
- `create()` resets sibling transient flags (`timeUp`, `nudgeActive`) but
  omits `navLocked`.
- Instance reuse is a documented codebase assumption ("create() re-runs on
  the same instance" — play-time-limits spec).
- Introduced by `7c28912` (2026-08-09, progress instrumentation work).
- Test gap: every hub test constructs a fresh `new HubScene()`; none replays
  a second visit on the same instance.

## Functional Requirements

1. **FR1 — Every Hub visit accepts launches:** `create()` resets `navLocked`
   alongside the other transient state resets.
2. **FR2 — Double-launch protection preserved:** within an active visit,
   `navLocked` still blocks double-tap double-recording during the async
   lazy-load + fade-out launch window.
3. **FR3 — Regression test (TDD)** in
   `src/__tests__/scenes/navigation.test.ts`, auto-return path: tap tile →
   complete game/auto-return → re-run `create()` on the **same** instance →
   tap another tile → navigation proceeds.
4. **FR4 — No collateral changes:** no behavior change to Time's-Up locking,
   nudge overlay, profile picker, settings panel, or transitions.

## Non-Functional Requirements

- TDD: Red (failing regression test) before Green (minimal one-line fix).
- Match existing style (Biome format/lint, JSDoc conventions).
- Quality gates: `CI=true pnpm test` green · `pnpm run check` clean ·
  `pnpm run build` succeeds.

## Release Requirements (v1.14.2)

- Bump `package.json` 1.14.1 → 1.14.2.
- Add `docs/release-notes-v1.14.2.md` per existing convention.
- Tag `v1.14.2`, push master + tag → CI/CD Auto-Deploy builds & publishes PWA.
- Note: the push also publishes 55 previously unpushed commits on master.

## Acceptance Criteria

- [ ] Regression test fails pre-fix, passes post-fix (Red → Green verified).
- [ ] Full suite green; Biome clean; production build succeeds.
- [ ] Manual check: play a game → auto-return → start a *different* game;
      repeat across several games with no dead tiles.
- [ ] v1.14.2 deployed live and verified.

## Out of Scope

- Back-hold exit path coverage (same underlying mechanism).
- Broader hub stale-state audit (shutdown handler already disposes other
  overlays/objects).
- Gameplay, storage, or transition-utility changes.
