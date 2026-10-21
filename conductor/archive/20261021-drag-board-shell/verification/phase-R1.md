# Phase R1 — Review Fixes

- Track: 20261021-drag-board-shell
- Branch: refactor/20261021-drag-board-shell
- Phase base: ee83d64
- Status: PASS

## Verification

```
pnpm check && pnpm typecheck && pnpm test -- --run
```

- Exit code: 0
- `biome check`: 1 warning + 1 info, both pre-existing and documented in the
  round-1 review as out of scope (biome.json `$schema` version mismatch
  2.5.5 vs CLI 2.5.10; `musicalMemoryScene.test.ts:294` non-null assertion).
- `tsc --noEmit`: clean.
- `vitest --run`: 112 test files, 2379 tests passed (2377 before + 2 new
  shell bounce-duration tests).

## Tasks

### R1.T1 — F1: restore exact bounce-home duration parity — done

- `src/game/dragBoard.ts`:
  - Added optional `bounceDuration` (default `BOUNCE_DURATION` = 300) and
    `bounceReducedDuration` (default `BOUNCE_REDUCED_DURATION` = 180) to
    `DragBoardOptions`, stored as private readonly fields in the constructor.
  - The shell now models bounce as one timing: the option pair drives every
    bounce-to-source tween — `tweenHome` (withdraw / wrong-answer
    bounce-home), the tray↔slot displacement tween in `handleDrop`, and the
    return-to-slot tween in `correctMissedDrop` — replacing the module
    constants at all three call sites. Defaults keep Story Order untouched.
  - Constant doc comments updated ("shared by both current boards" →
    "Default ... — Story Order's timing").
- `src/scenes/NumberOrderScene.ts`: passes `bounceDuration: 250,
  bounceReducedDuration: 150` with a Behavior-preservation comment (old
  scene used `motionDuration(250, 150)`).
- `src/__tests__/scenes/numberOrderScene.test.ts`: the "wiggles and bounces
  home on an incorrect full board" test now pins the wiggle-complete
  bounce-home duration at 250 ms. It scopes tween lookup to calls added after
  `fillBoard` (`before` snapshot) and asserts the last tween targeting the
  bounced card's container has `duration` 250.
- `src/__tests__/game/dragBoard.test.ts`: new "bounce duration option"
  describe with two tests:
  - default 300 normal / 180 reduced motion (via `matchMedia` stub);
  - override honored — wrong-answer bounce 250, tray↔slot displacement 250,
    and reduced-motion 150.
  `HarnessOptions`/`createHarness` pass the new options through.

### R1.T2 — F2: justify the shell's type assertion — done

- `src/game/dragBoard.ts` `snap()`: added the structural-compatibility
  comment above `piece.container as unknown as DragTarget` — DragTarget is a
  structural shape (transform + scene + drag-event `on`) any draggable
  container satisfies; the double cast only bridges Phaser's EventEmitter
  `on` overloads, not a real type mismatch. Matches the scenes'
  `attachDragLift` cast-comment pattern. `snapToSlot`'s signature was not
  touched (per the brief; that change would reach `src/utils/dragJuice.ts`,
  outside Touches).

## Notes

- No behavior change beyond restoring Number Order's documented 250/150
  bounce parity; Story Order keeps 300/180 through the defaults.
- Environment note: the `shell` tool initially returned
  `permission.rejected` for every command, including git; only `pnpm`
  commands were admitted. Task-level commits were therefore left to the
  primary agent (see report `commits`).

## Primary verification

- **Command:** `pnpm check && pnpm typecheck && pnpm test -- --run`
- **Exit code:** 0
- **Result:** verified by primary agent
- **Summary:** biome check exit 0 (two pre-existing findings only); tsc clean; 112 files / 2,379 tests passed (2,377 + 2 new shell tests). Diff `ae32ecb..e2fab6f` matches Touches exactly; no deviations. F1 resolved: optional bounceDuration/bounceReducedDuration on DragBoardOptions (defaults 300/180 — Story Order untouched), NumberOrderScene passes 250/150 restoring exact old behavior, wiggle-complete bounce pinned at 250 ms in tests. F2 resolved: structural-compatibility comment above the DragTarget cast; snapToSlot signature untouched.
