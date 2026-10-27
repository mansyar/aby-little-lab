# HubScene Decomposition — Implementation Plan

> **Branch:** `refactor/20261027-hubscene-split`
> **Base:** `master` @ `e7d6b90b`
>
> Phase states are `pending`, `in_progress`, `verified`, `failed`, or `blocked`.
> Only the primary agent writes this file. Phase subagents report results and the
> primary records them.

## Phase 1: Art Tables Extraction

- **Goal:** Art-group tables + SVG resolver live in `src/game/hub/`; HubScene imports them.
- **Depends on:** none
- **Covers:** FR-1, NFR-2, AC-1
- **Touches:** `src/game/hub/artGroups.ts` (new), `src/scenes/HubScene.ts` (import swap + member removal), `src/__tests__/game/hub/artGroups.test.ts` (new), `src/__tests__/scenes/hubScene.test.ts` (source-guard retarget only: positive dynamic-import assertions move to the new module's source, negatives stay)
- **Verification:** `pnpm vitest run src/__tests__/game/hub/artGroups.test.ts src/__tests__/scenes/hubScene.test.ts` + `pnpm typecheck` + `pnpm check`
- **Status:** verified

- [x] **P1.T1: Extract art tables and resolver** — covers: FR-1
- [x] **P1.T2: Unit tests + HubScene rewire + guard retarget** — covers: FR-1, AC-1

- **Result:** verified — art tables + resolver in `src/game/hub/artGroups.ts` (140 lines); HubScene 821 → 778 lines; `hubScene.test.ts` 48/48 + new suite 3/3 green; typecheck + Biome clean.
- **Checkpoint:** b9b02444
- **Evidence:** `conductor/tracks/20261027-hubscene-split/verification/phase-1.md`

## Phase 2: Launch Flow Extraction

- **Goal:** Game-launch flow (activate/open/cue + guards) lives in `src/game/hub/`; HubScene delegates.
- **Depends on:** Phase 1
- **Covers:** FR-2, AC-2
- **Touches:** `src/game/hub/gameLaunch.ts` (new), `src/scenes/HubScene.ts` (delegate), `src/__tests__/game/hub/gameLaunch.test.ts` (new — project vitest `include` is `src/__tests__/**`; colocated `src/game/**` tests are never collected)
- **Verification:** `pnpm vitest run src/__tests__/game/hub/gameLaunch.test.ts src/__tests__/scenes/hubScene.test.ts` + `pnpm typecheck` + `pnpm check`
- **Status:** verified

- [x] **P2.T1: Extract launch flow with guards** — covers: FR-2
- [x] **P2.T2: Unit tests + HubScene rewire** — covers: FR-2, AC-2

- **Result:** verified — launch flow in `src/game/hub/gameLaunch.ts` (182 lines); HubScene 778 → 700 lines; new suite 10/10 + `hubScene.test.ts` 48/48 green; typecheck + Biome clean.
- **Checkpoint:** e7057485
- **Evidence:** `conductor/tracks/20261027-hubscene-split/verification/phase-2.md`

## Phase 3: Prewarm Orchestration Extraction

- **Goal:** Prewarm orchestration (entries, gates, sync/start/cancel/restart, art pass) lives in a `src/game/hub/` controller; HubScene delegates.
- **Depends on:** Phase 2
- **Covers:** FR-3, AC-3
- **Touches:** `src/game/hub/hubPrewarm.ts` (new), `src/scenes/HubScene.ts` (delegate), `src/__tests__/game/hub/hubPrewarm.test.ts` (new — project vitest `include` is `src/__tests__/**`; colocated `src/game/**` tests are never collected)
- **Verification:** `pnpm vitest run src/__tests__/game/hub/hubPrewarm.test.ts src/__tests__/scenes/hubScene.test.ts` + `pnpm typecheck` + `pnpm check`
- **Status:** in_progress

- [ ] **P3.T1: Extract prewarm orchestration** — covers: FR-3
- [ ] **P3.T2: Unit tests + HubScene rewire** — covers: FR-3, AC-3

## Phase 4: Play-Time UI, Attract/Decor, Thin Coordinator

- **Goal:** Play-time UI and attract/decor extracted; HubScene ≤ ~320 lines; full gate green.
- **Depends on:** Phase 3
- **Covers:** FR-4, FR-5, NFR-1, NFR-3, NFR-4, AC-4, AC-5
- **Touches:** `src/game/hub/playTimeUi.ts` (new), `src/game/hub/hubAttract.ts` (new), `src/scenes/HubScene.ts` (final rewire), `src/__tests__/game/hub/playTimeUi.test.ts` + `hubAttract.test.ts` (new — project vitest `include` is `src/__tests__/**`; colocated `src/game/**` tests are never collected)
- **Verification:** `pnpm check` && `pnpm typecheck` && `pnpm test -- --run` && `pnpm test:coverage` && `pnpm build` && `node scripts/validate-bundle.js` && `node scripts/validate-pwa.js` && `node scripts/validate-docs.js`
- **Status:** pending

- [ ] **P4.T1: Extract play-time UI + attract/decor** — covers: FR-4, FR-5
- [ ] **P4.T2: Unit tests, size check, full gate** — covers: FR-4, FR-5, AC-4, AC-5

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
