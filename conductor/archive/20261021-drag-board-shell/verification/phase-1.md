# Phase 1 — Extract the shared DragBoard shell

- **Track:** 20261021-drag-board-shell — Drag-Board Shell Unification
- **Phase:** 1
- **Date:** 2026-10-21
- **Branch:** `refactor/20261021-drag-board-shell`
- **Base commit:** `a496837`
- **Head commit:** `d2292de`
- **Result:** verified

## Scope

New parameterized `DragBoard` shell (`src/game/dragBoard.ts`) with unit tests
(`src/__tests__/game/dragBoard.test.ts`). No game rewired — NumberOrderScene
and StoryOrderScene are untouched (behavior-neutral addition, as planned).

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| Test-first gate (pre-implementation) | `pnpm test -- --run src/__tests__/game/dragBoard.test.ts` | 1 | Red as required: `Failed to resolve import "../../game/dragBoard"` |
| Lint/format | `pnpm check` | 0 | No errors in new files; 1 pre-existing warning (`musicalMemoryScene.test.ts` non-null assertion) + 1 pre-existing biome schema info |
| Types | `pnpm typecheck` | 0 | `tsc --noEmit` clean |
| Tests (full) | `pnpm test -- --run` | 0 | 112 files / 2372 tests pass, including 39 new DragBoard tests |

Full phase verification run as one chain: `pnpm check && pnpm typecheck && pnpm test -- --run` — exit 0.

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| FR-1 | Shell exposes per-game policies: wrong-answer behavior (`bounce-home` vs `retry-in-place`), tap-withdraw (on/off), validation timing (`per-drop` vs `round-full`) | `DragBoardOptions` fields + `applyWrongAnswer()` / `tryAutoValidate()` in `src/game/dragBoard.ts`; suites "wrong-answer policies" (2 tests) and "validation timing" (7 tests) | verified (shell side; per-game pinning lands in Phases 2–3) |
| FR-2 | Shell owns slot management, hover/drop detection, snapping, tap-vs-drag, tap-withdraw | `addSlot`, `isOverAnyZone`, `handleDrop` (snap over `dragJuice.snapToSlot`, slot↔slot swap, tray↔slot displacement), `addPiece` gesture wiring, `withdraw`; suites "slot registration and hover detection", "drop resolution", "tap-vs-drag discrimination", "drag movement", "missed drops" | verified (shell side; scene delegation achieved in Phases 2–3) |
| AC-1 | Neither drag scene retains local drop-zone registration / `isOverAnyZone` / snap logic | Phase 1 does not rewire scenes by plan; both scenes untouched (`git status` clean apart from the two new files). Rewiring is Phase 2 (Story Order) / Phase 3 (Number Order) | groundwork laid — completes in P2/P3 |

## Task evidence

- **P1.T1.1** — `DragBoard.addSlot(x, y)` creates the interactive drop zone
  (`dropZone: true`) and registers it; `isOverAnyZone(x, y)` is the square
  hit-test (`x/y ∈ [slot ± zoneSize/2]`, edges inclusive), matching both
  scenes' inline implementations.
- **P1.T1.2** — Drop resolution runs through `handleDrop`: self-slot re-snap
  only; empty-slot move; slot↔slot swap (occupant tweens to the source slot,
  200/120 Back.out); tray↔slot displacement (occupant returns to its own
  origin, 300/180 Back.out); the dropped piece always snaps via
  `dragJuice.snapToSlot` (200/120 Cubic.out). Unknown zones and locked input
  are ignored.
- **P1.T1.3** — Shell sets `scene.input.dragDistanceThreshold` (default
  `DEFAULT_DRAG_DISTANCE_THRESHOLD = 10`, configurable); `drag` marks
  `justDropped = true` so the trailing pointerup is never a tap; a tap on a
  placed piece withdraws it when `tapWithdraw` is on (frees the slot, tweens
  home 300/180, fires `onWithdraw`).
- **P1.T1.4** — `wrongAnswerBehavior`: `applyWrongAnswer()` bounces every
  placed piece home and frees the board (`bounce-home`) or is a deliberate
  no-op (`retry-in-place`). `validationTiming`: `per-drop` fires `onValidate`
  after every drag end (slot-indexed ids, null for empty slots); `round-full`
  fires only when the board is full, guarded by the `id|id|id` signature so an
  unchanged arrangement is not re-validated. The guard auto-clears whenever
  the board stops being full (withdraw, displacement, bounce home), which
  reproduces Story Order's explicit signature reset without a special case and
  keeps bounce-home re-validation intact.
- **P1.T2.1** — Bounce-home suite: policy application, guard-free refill
  re-validation under `round-full`, missed-drop corrections.
- **P1.T2.2** — Retry-in-place + tap-withdraw suite: no-op wrong answer,
  tap-withdraw on/off, sub-threshold tap, browser gesture order
  (`dragstart → pointerdown → drop → dragend → pointerup`) keeps a dropped
  piece in place.
- **P1.T2.3** — Cleanup + reduced motion: the shell self-registers on the
  scene `shutdown` event (same mechanism the `GameSceneBase` registry uses),
  `destroy()` detaches and clears once, `clear()` destroys shell-owned zones
  and resets piece slot indexes; reduced-motion stub shortens withdraw/
  displacement (300→180) and swap (200→120) tweens. All animations consult
  `utils/motion.ts`.

Test count: 39 (all passing). The test file was written and shown red before
the implementation existed.

## Evidence paths

- `src/game/dragBoard.ts` — shell implementation
- `src/__tests__/game/dragBoard.test.ts` — 39 unit tests
- Commits: `5fccb5a` (P1.T1), `d2292de` (P1.T2)

## Deviations

- The brief's implementation context names `src/game/dragJuice.ts`; the shared
  drag helpers actually live at `src/utils/dragJuice.ts` (both scenes import
  them from there). The shell imports from the real path; no file was moved
  and nothing outside Touches changed.
- `pnpm format` (`biome format --write`) was run to satisfy `pnpm check`; it
  reflowed only `src/game/dragBoard.ts` (within Touches).
- P1.T2.3 shutdown-cleanup: `GameSceneBase.registerShutdownCleanup()` accepts
  no custom callbacks and `GameSceneBase.ts` is outside this phase's Touches,
  so the shell registers itself directly on the scene's `shutdown` event (the
  same registry mechanism) and detaches in `destroy()`. `GameSceneBase.ts`
  itself is untouched (consistent with FR-4).

## Notes for the primary agent

- **Phase 3 flag (tap-withdraw in Number Order):** the shell marks
  `justDropped` in the `drag` handler and defaults the drag threshold to 10.
  Number Order currently runs at threshold 0, where its tap-to-return branch
  is unreachable in live play (every tap is a 0px "drag"). When Number Order
  adopts the shell, real taps on placed cards will start withdrawing them —
  the `dragDistanceThreshold` option (e.g. `0` restores the current live
  behavior) lets Phase 3 choose deliberately. Existing Number Order tests fire
  handlers directly and remain compatible either way.
- The shell holds no runtime Phaser import (`import type` only), so tests run
  without a Phaser module mock, mirroring `dragJuice.test.ts` conventions.
- Scenes keep visual ownership (dashed outlines, pips, card fills) and richer
  piece records that satisfy `BoardPiece` structurally; validation stays
  scene-side via the `onValidate`/`onDrop`/`onWithdraw`/`onTap` callbacks and
  the scene's own `isLocked` closure sharing `inputLocked`.
- No build/bundle validation in this phase's verification command; the shell is
  one small module (no new dependencies).

## Primary verification

- **Command:** `pnpm check && pnpm typecheck && pnpm test -- --run`
- **Exit code:** 0
- **Result:** verified by primary agent
- **Summary:** biome check exit 0 (1 pre-existing warning in musicalMemoryScene.test.ts, 1 pre-existing biome schema info); `tsc --noEmit` clean; 112 test files / 2,372 tests passed including the 39 new DragBoard tests. Diff `410d0fe..d2292de` matches Touches exactly (dragBoard.ts + dragBoard.test.ts + evidence file). Deviations reviewed and accepted (dragJuice real path correction, format reflow of own new file, shutdown self-registration preserving FR-4).
