# PR: Drag-Board Shell Unification

## Summary

Extracts the duplicated drag-board scaffolding of Number Order and Story Order (~290 lines) into one parameterized shell, `src/game/dragBoard.ts`, with per-game policies preserved exactly (bounce-home vs retry-in-place, per-drop vs round-full validation, tap-withdraw, drag threshold). Also adds a shared `GameSceneBase.reactWrong()` reaction helper and migrates six direct-base games' inline wrong-answer sequences onto it. Zero user-visible behavior change; both games' and the shell's tests assert the same behavior as before.

## Track

- **ID:** `20261021-drag-board-shell`
- **Type:** `refactor`
- **Spec:** [`conductor/archive/20261021-drag-board-shell/spec.md`](conductor/archive/20261021-drag-board-shell/spec.md)
- **Plan:** [`conductor/archive/20261021-drag-board-shell/plan.md`](conductor/archive/20261021-drag-board-shell/plan.md)
- **Review:** [`conductor/archive/20261021-drag-board-shell/review.md`](conductor/archive/20261021-drag-board-shell/review.md)

## What happened

| Phase | Goal | Result | Checkpoint | Notes |
| --- | --- | --- | --- | --- |
| 1: Extract the shared DragBoard shell | Parameterized shell + unit tests for every policy combination | verified | `d0ef7da` | 39 tests written red-first; no runtime Phaser import |
| 2: Rewire Story Order onto the shell | Delegate all drag scaffolding; retry-in-place preserved | verified | `7996475` | artDeclarations gained a `NON_ART_GAME_MODULES` exclusion (declared deviation) |
| 3: Rewire Number Order onto the shell | Delegate; bounce-home + drop validation preserved | verified | `b93ab74` | `dragDistanceThreshold: 0` chosen deliberately to preserve live behavior |
| 4: GameSceneBase reaction helpers | Shared `reactWrong(targets?)` + tests | verified | `fdb6779` | Purely additive; override precedence covered |
| 5: Migrate the 8 direct games | Route inline wrong-answer sequences through `reactWrong` | verified | `2bd05c0` | 6 games migrated; Animal Trace & Pop & Freeze have no wrong path by design; BigSmall box-lid wiggle kept local (materially different) |
| R1: Review Fixes | Resolve F1 (bounce parity) and F2 (assertion justification) | verified | `c28e37c` | Optional `bounceDuration`/`bounceReducedDuration` (defaults 300/180); Number Order restored to 250/150 |

## Requirements

- [x] `FR-1` - Parameterized drag policies (test: `src/__tests__/game/dragBoard.test.ts`)
- [x] `FR-2` - Both drag scenes delegate to the shell (tests: `numberOrderScene.test.ts`, `storyOrderScene.test.ts`)
- [x] `FR-3` - Shared wrong-answer reaction helpers (test: `gameSceneBase.test.ts` + per-scene suites)
- [x] `FR-4` - ChoiceRoundScene/GroupMathScene untouched
- [x] `NFR-1` - Shell bundle within budget (130.1 kB ≤ 200 kB; dragBoard ships as a 4.03 kB lazy chunk)
- [x] `NFR-2` - Behavior preservation (2,379 tests; no assertion weakened)
- [x] `NFR-3` - Accessibility constraints (single-finger, ≥64px targets, reduced-motion, no-fail)
- [x] `AC-1` - No local slot/hover/snap logic left in either drag scene (grep evidence)
- [x] `AC-2` - Both games' policy behaviors preserved
- [x] `AC-3` - Direct-base games route wrong reactions through the helper
- [x] `AC-4` - Full verification gate passes

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| lint/format | `pnpm check` | pass | `verification/integrated.md` |
| typecheck | `pnpm typecheck` | pass | `verification/integrated.md` |
| unit | `pnpm test -- --run` | pass | 112 files / 2,379 tests |
| coverage | `pnpm test:coverage` | pass | S 97.78 / B 90.88 / F 96.52 / L 98.63 (gates 90/85/88/95) |
| build | `pnpm build` | pass | dragBoard 4.03 kB lazy chunk |
| build-artifact | `node scripts/validate-bundle.js` | pass | shell 130.1 kB ≤ 200 kB |
| smoke | `node scripts/validate-pwa.js` | pass | 16/16 |

## Review

- **Verdict:** `PASS`
- **Rounds:** 2 (round 1: 2 Low findings; round 2: both fixed, no new findings)
- **Fixed:** 2 findings
- **Accepted/deferred:** 0 (see `review.md`)

## Deviations and risks

- Shell self-registers cleanup on the scene's `shutdown` event rather than GameSceneBase's protected registry (a non-scene class cannot reach it) — same underlying mechanism, covered by shell cleanup tests.
- `artDeclarations.test.ts` gained `NON_ART_GAME_MODULES = ["dragBoard"]` — the shell is interaction logic, not art; required for the guard to keep passing.
- Residual risk: none known; behavior parity is asserted by the untouched test suites plus new duration-pinning tests.

## Follow-ups

- none

## Rollback

```bash
git revert --no-edit c28e37c
```

No migrations or data changes; the refactor is behavior-neutral and self-contained.
