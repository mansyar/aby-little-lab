# Fix wide hub grid overflow with 25th game tile — Implementation Plan

> **Branch:** `fix/20261128-wide-hub-grid-overflow`
> **Base:** `master` @ `896d455ee2e6196a1d83cdd7525102678bbefa28`
>
> Phase states are `pending`, `in_progress`, `verified`, `failed`, or `blocked`.
> Only the primary agent writes this file. Phase subagents report results and the
> primary records them.

## Phase 1: Wide-grid overflow rule

- **Goal:** All 25 tiles + shelf plaques on-canvas in the wide All view at 1024x768 via 5th-row flow with recentered origin.
- **Depends on:** none
- **Covers:** FR-1, FR-3, FR-4, NFR-1, NFR-2, NFR-3, AC-1, AC-3, AC-4
- **Touches:** `src/game/hub/gridBuilder.ts`, `src/game/hub/gridLayout.ts`, `src/game/hub/hubGridConstants.ts`, `src/__tests__/scenes/hubScene.test.ts`, `src/__tests__/game/hub*.test.ts`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** in_progress

- [ ] **P1.T1: Regression test red** — covers: FR-1, AC-1
  - [ ] **P1.T1.1: Extend hubScene bounds assertion to all 25 tiles + shelf plaques at 1024x768 and run to fail**
- [ ] **P1.T2: Implement 5th-row flow with recentered origin** — covers: FR-1, FR-3
  - [ ] **P1.T2.1: Overflow rule in wide-grid layout (6/6/6/6 + 1 in-canvas)**
  - [ ] **P1.T2.2: Recenter board origin for the 5-row board**
- [ ] **P1.T3: Green + golden updates** — covers: FR-4, AC-3, AC-4
  - [ ] **P1.T3.1: Regression test passes; update affected hub golden expectations**
  - [ ] **P1.T3.2: Full gate green, texture figures unchanged**

<!--
The primary appends after acceptance:
**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/20261128-wide-hub-grid-overflow/verification/phase-1.md
-->

## Phase 2: Narrow-layout check and conditional rebalance

- **Goal:** Narrow viewports render all 25 tiles in-canvas; rebalance applied only where the overflow rule interacts.
- **Depends on:** Phase 1
- **Covers:** FR-2, AC-2
- **Touches:** `src/game/hub/**`, `src/__tests__/scenes/hubScene.test.ts`, `src/__tests__/game/hub*.test.ts`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** pending

- [ ] **P2.T1: Narrow bounds coverage** — covers: FR-2, AC-2
  - [ ] **P2.T1.1: Extend narrow-viewport bounds assertions to all tiles; run to fail if violated**
- [ ] **P2.T2: Conditional rebalance** — covers: FR-2
  - [ ] **P2.T2.1: Rebalance only interacting narrow paths; no-op with evidence if unaffected**
- [ ] **P2.T3: Green** — covers: FR-4
  - [ ] **P2.T3.1: Full gate green**
