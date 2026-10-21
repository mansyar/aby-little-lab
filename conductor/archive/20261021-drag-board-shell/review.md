# Review: Drag-Board Shell Unification

- **Track:** `20261021-drag-board-shell`
- **Type:** `refactor`
- **Branch:** `refactor/20261021-drag-board-shell`
- **Range:** `6133e71f9e09714a57a9374acb78ba189b6a4a1c..dc3466e` (code diff excludes `conductor/`)
- **Date:** 2026-10-21
- **Verdict:** `PASS` (round 2; both round-1 findings fixed in Phase R1)

## Summary

The extraction is faithful: `DragBoard` reproduces both drag scenes' scaffolding with the per-game policy combinations wired exactly as before — Number Order at threshold 0 with scene-gated full-board validation, Story Order with retry-in-place + round-full + the `key|key|key` guard including its auto-clear. `GameSceneBase.reactWrong` replaces the inline tone+record+nod+wiggle triples one-for-one with no double-`recordWrong` and equivalent reduced-motion handling. The full gate is green on a tree identical to HEAD. Only two Low findings, both mechanical: an undocumented 50 ms bounce-home duration unification (Number Order) and an unjustified type assertion in the shell. Both are dispatched to Phase R1.

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| lint/format | `pnpm check` | pass | exit 0; two pre-existing findings only (biome.json schema-version info; musicalMemoryScene.test.ts:294 non-null assertion) |
| typecheck | `pnpm typecheck` | pass | `tsc --noEmit` clean |
| test | `pnpm test -- --run` | pass | 112 files / 2,377 tests |
| coverage | `pnpm test:coverage` | pass | S 97.78 / B 90.88 / F 96.52 / L 98.63 (gates 90/85/88/95) |
| build | `pnpm build` | pass | dragBoard 4.03 kB lazy chunk |
| build-artifact | `node scripts/validate-bundle.js` | pass | shell 130.1 kB ≤ 200 kB |
| smoke | `node scripts/validate-pwa.js` | pass | 16/16 |

## Requirements

| ID | Implemented by | Verified by | Status |
| --- | --- | --- | --- |
| FR-1 | P1.T1 | `src/__tests__/game/dragBoard.test.ts` policy suites | covered |
| FR-2 | P2.T1, P3.T1 | phase-2/3 AC-1 greps (0 scaffold hits); rewired scene suites | covered |
| FR-3 | P4.T1, P5.T1 | `gameSceneBase.test.ts` reactWrong suite + per-scene suites | covered |
| FR-4 | P5 scope discipline | diffstat: only GameSceneBase.ts changed among base classes | covered |
| NFR-1 | P5.T2.1 | validate-bundle PASS (130.1 kB); lazy chunks | covered |
| NFR-2 | P2.T2, P3.T2, P5.T2 | 2,377 tests green; re-wire notes; no assertion weakened | covered (F1 duration nit) |
| NFR-3 | P1.T2.3, P4.T1.1 | reduced-motion suites; zones ≥ 64px; single-finger; no penalties | covered |
| AC-1 | P2.T1, P3.T1 | phase-2/3 grep evidence | covered |
| AC-2 | P2.T1, P3.T1 | storyOrder/numberOrder scene tests | covered |
| AC-3 | P4.T1.2, P5.T1 | override test + phase-5 per-scene table | covered |
| AC-4 | P5.T2.1 | `verification/integrated.md` full gate | covered |

## Findings

### Critical

- <none>

### High

- <none>

### Medium

- <none>

### Low

- **F1 - Number Order bounce-home duration unified without documentation** — **FIXED in Phase R1 (c28e37c)**: optional `bounceDuration`/`bounceReducedDuration` added to `DragBoardOptions` (defaults 300/180, Story Order untouched); Number Order passes 250/150 restoring exact old behavior; wiggle-complete bounce duration pinned in `numberOrderScene.test.ts`; two new shell tests cover the default and the override.
- **F2 - Unjustified double type assertion in the shell** — **FIXED in Phase R1 (c28e37c)**: structural-compatibility comment added above the `DragTarget` cast; `snapToSlot` signature untouched.

## Overrides

- <none>

## Plan compliance

- All five phases carry Result/Checkpoint/Evidence, all `verified`, checkpoints match the squash commits (d0ef7da, 7996475, b93ab74, fdb6779, 2bd05c0).
- Documented deviations: P5 lists 8 scenes but only 6 changed (Animal Trace & Pop & Freeze have no wrong-answer path by design; BigSmall box-lid wiggle kept local — materially different); P2 touched `artDeclarations.test.ts` (the `NON_ART_GAME_MODULES` exclusion) outside its declared Touches — declared and accepted; the shell self-registers on the scene's `shutdown` event instead of the protected GameSceneBase registry (same mechanism, a non-scene class cannot reach the protected registry); P3.T1.1's "tryAutoValidate on drop" wording — validation actually fires on `dragend` in both old and new code (plan wording nit only).
- Test re-wiring scrutinized: no assertions weakened; the two gesture-model changes are faithful re-modelings (clean tap for Story Order's tap-withdraw; `dragend`-driven validation for Number Order).

## Out of scope

- The two pre-existing Biome findings (biome.json schema-version info; `musicalMemoryScene.test.ts:294` non-null assertion) predate this track.

## Debt

- <none — F1/F2 fixed in Phase R1>

## Doc sync

`none` - R1 restored exact behavior parity (no net behavior change); the tech-stack design-update entry already describes the shell and its options accurately.

## History

| Round | Verdict | Critical | High | Medium | Low | Fixed |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | PASS WITH FINDINGS | 0 | 0 | 0 | 2 | 2 (in Phase R1) |
| 2 | PASS | 0 | 0 | 0 | 0 | 2 |
