# Phase 1 — Generalize the shell: Image pieces and slot capacity

- Track: `20261025-drag-board-consolidation`
- Phase: 1
- Date: 2026-10-25
- Branch: `refactor/20261025-drag-board-consolidation`
- Base: `48fa355a`
- Head commits: `82c413a2` (red tests), `521c93be` (shell generalization), `5cabee79` (doc cleanup)
- Result: **verified**

## What was done

- **P1.T1 (red first)** — added board-level tests to
  `src/__tests__/game/dragBoard.test.ts`:
  - `image pieces (widened draggable contract)`: a piece whose draggable is a
    plain `Phaser.GameObjects.Image` (a local `ImagePiece extends BoardPiece`
    with `container: Phaser.GameObjects.Image`) registers on the board,
    delivers a drop through `onDrop`, and updates occupancy.
  - `slot capacity`: default-`single` registration, explicit-`single`
    displacement semantics, `multi` slots accepting several distinct pieces
    across drop gestures feeding each drop to the scene, multi withdraw
    keeping the rest in place, bounce-home freeing the whole list, and
    multi→multi piece moves.
  - Red proof: all six `slot capacity` tests failed at runtime against the
    un-generalized shell; the Image-piece test was blocked by the piece type
    and red under `pnpm typecheck` (an accepted red per the brief). Captured in
    `.conductor/evidence/phase-1-red.md`.
- **P1.T2** — generalized `src/game/dragBoard.ts`:
  - Widened the piece contract: `BoardPiece.container` now accepts the
    `DragTarget` capability set via a new exported `BoardDraggable` type
    (`DragTarget` plus the pointer/drag/drop events the shell wires), so both
    `Phaser.GameObjects.Image` and `Phaser.GameObjects.Container` qualify.
    Every other `BoardPiece` data field is unchanged. The `snap()` double cast
    and `tweenTo()` parameter types were adjusted to the widened type.
  - Added slot capacity: `addSlot(x, y, capacity = "single")` with
    `SlotCapacity = "single" | "multi"`. `BoardSlot` gained `capacity` and
    `pieces` (multi occupants in drop order); `occupiedBy` keeps its exact
    single-occupancy meaning. Occupancy bookkeeping (`isOccupied`,
    `occupantsOf`, `holdsPiece`, `detachPiece`, `freeSlot`) generalizes over
    lists; drop resolution, tap-withdraw, swap, tray↔slot displacement,
    bounce-home, clear, `isFull`, `placedPieces`, and the round-full signature
    entries all handle multi slots. A multi slot contributes its occupants' ids
    joined with "," to `placedIds`/`onValidate` (documented; single entries are
    byte-identical to before). No game names or game-specific branches were
    added.

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| Red proof (runtime) | `pnpm test -- --run src/__tests__/game/dragBoard.test.ts` | 1 | 6 new capacity tests red against the un-generalized shell |
| Red proof (type) | `pnpm typecheck` | 1 | `ImagePiece`/`BoardPiece` incompatible + `addSlot` arity errors (the accepted type red) |
| Lint/format | `pnpm check` | 0 | Pre-existing warning (`musicalMemoryScene.test.ts` non-null assertion) and info (biome schema version) only — both pre-date this phase, untouched files |
| Types | `pnpm typecheck` | 0 | Clean, including scenes compiling against the widened contract |
| Unit | `pnpm test -- --run` | 0 | 121 files / 2655 tests pass (48 in the board suite: 42 prior + 6 new) |
| Coverage | `pnpm test:coverage` | 0 | Gates met: statements 97.99 (≥90), branches 91.96 (≥85), functions 96.73 (≥88), lines 98.74 (≥95); `dragBoard.ts` at 97.42/93.18/100/99.39 |
| Build | `pnpm build` | 0 | 343 modules; `dragBoard` lazy chunk 4.93 kB (was 4.03 kB) |
| Bundle | `node scripts/validate-bundle.js` | 0 | Shell entry 138.4 kB ≤ 200 kB; all checks pass |
| PWA | `node scripts/validate-pwa.js` | 0 | 16/16 checks pass |

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| FR-4 | Shell generalizations are generic; piece contract accepts Image and Container draggables via the DragTarget capability set; slots declare single/multi capacity; no game names or game-specific branches added | `BoardDraggable`/`SlotCapacity` in `src/game/dragBoard.ts`; `addSlot` capacity param; image test + capacity tests in `src/__tests__/game/dragBoard.test.ts` | Pass |
| AC-2 | Board tests: Image piece registers, delivers `onDrop`, updates occupancy; multi slot accepts several pieces in the same gesture session feeding each drop to the scene; single slot keeps exact occupancy semantics | `image pieces` describe + `slot capacity` describe in `dragBoard.test.ts` (6 new tests, all green); prior suite green | Pass |
| NFR-2 | Number Order / Story Order parity — regression suites pass unchanged in intent | `numberOrderScene.test.ts` + `storyOrderScene.test.ts` (+ `shapeSorterScene.test.ts`) all pass with **zero edits** to those files; single-slot `occupiedBy` semantics and the `container` field name preserved | Pass |
| NFR-3 | Full verification gate green | Commands table above (final head `5cabee79`) | Pass |
| NFR-4 | Bundle discipline — shell stays game-free and small | Shell entry 138.4 kB ≤ 200 kB; dragBoard lazy chunk 4.93 kB; no game names added in phase 1 code | Pass |

## Evidence paths

- Red proof: `.conductor/evidence/phase-1-red.md` (gitignored artifacts dir)
- This report: `conductor/tracks/20261025-drag-board-consolidation/verification/phase-1.md`

## Deviations

- None. All work stayed within `Touches` (`src/game/dragBoard.ts`,
  `src/__tests__/game/dragBoard.test.ts`). The Number Order / Story Order
  scene suites were verified green without edits because the generalization
  preserved the `container` field name and single-slot `occupiedBy` semantics.

## Notes

- The phase brief calls the widened field "BoardPiece.draggable"; in code the
  field is named `container`. The widening is exactly that field's type
  (`Phaser.GameObjects.Container` → `BoardDraggable`); the name is kept so the
  scenes (outside this phase's Touches) compile and run unchanged. Phase 2 may
  revisit the name with both adopting scenes in scope.
- `pnpm check` reports one pre-existing warning and one pre-existing info on
  files this phase never touched; `exit code` is 0.
- One uncovered line in `dragBoard.ts` (line 455) is the defensive guard for a
  piece whose recorded slot no longer exists; project coverage gates pass with
  wide margin, and the guard mirrors the pre-existing stale-index tolerance the
  Story Order suite exercises through `withdraw`.
- Single-slot behavior is byte-for-byte the old shell's: same `occupiedBy`
  shape, same swap/displacement tweens, same `placedIds` entries, so the
  round-full signature machinery (Story Order's `key|key|key` guard) is
  unchanged for single-capacity boards.
