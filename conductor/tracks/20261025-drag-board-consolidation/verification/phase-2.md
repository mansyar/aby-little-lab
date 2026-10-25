# Phase 2 — Drag-Board Consolidation: adopt the shell in Shape Sorter, Shadow Match, Big & Small

- Track: `20261025-drag-board-consolidation`
- Phase: 2
- Date: 2026-10-25
- Branch: `refactor/20261025-drag-board-consolidation`
- Base: `78e1b7c8`
- Head commits: (per-scene commits listed below)
- Result: **verified** — all code work and the full verification gate are green; the P2.T4.2
  mutation spot-check was executed by the primary (the executor's sandbox denied the hashing
  command) and passed: mutating the board's `BOUNCE_DURATION` 300 → 3000 fails all three
  adopting scenes' bounce timing assertions, and the shell was restored byte-identical.

## What was done

- **P2.T1 (Shape Sorter, FR-1)** — `src/scenes/ShapeSorterScene.ts` rebuilt on
  `DragBoard<ShapeData>`: `ShapeData extends BoardPiece` (`container: Phaser.GameObjects.Image`,
  `id` = shape type, unique per round); slots registered via `board.addSlot(x, SLOT_Y)`
  (default `single`); `tapWithdraw: false`, `isLocked: () => this.inputLocked`,
  `zoneSize: DROP_ZONE_SIZE`, board bounce timings left at the shell defaults (300/180);
  per-drop validation lives in the `onDrop` callback: correct → splash/cheer/record/lock,
  wrong → `reactWrong()` + `board.withdraw(piece)` (bounce home via the board at 300/180).
  `attachDragLift`/`attachDropZoneHighlight` stay scene-called, before `board.addPiece`.
  Deleted the hand-wired dragstart/drop/dragend state machine (`handleDrop`/`handleDragEnd`),
  the local `BOUNCE_DURATION`/`BOUNCE_REDUCED_DURATION` copies, `droppedOnZone`, and the
  scene-side `setDraggable` calls. A placed shape releases its board occupancy
  (`occupiedBy = null`, `slotIndex = null`) while it visually stays in the slot, so a later
  wrong drop can never displace a locked shape.
- **P2.T2 (Shadow Match, FR-2)** — same rebuild in `src/scenes/ShadowMatchScene.ts`
  (`ObjectData extends BoardPiece`, id = object type, 6 unique types per round). The
  shadow-stamp scale pulse + flash and the placed-object dim stay scene-owned reactions to a
  correct drop; wrong drops bounce via the board; `BOUNCE_*` copies and the drop state
  machine deleted.
- **P2.T3 (Big & Small, FR-3)** — `src/scenes/BigSmallScene.ts` rebuilt with the two boxes
  registered as the shell's first `multi` slots (`board.addSlot(x, BOX_Y, "multi")`);
  `ToyData.id` = `` `${scaleCategory}_${type}` `` (unique: 3 types × 2 categories). Sorted-vs-fit
  validation stays in the scene via `onDrop`: correct → board snap, scene shrink-into-box
  tween (SHRINK 150/90), lid wiggle + box bump, `sorted=true` lock (the existing
  `attachDragLift(obj, { skipRestore: () => data.sorted })` semantics preserved); wrong →
  `reactWrong()` + `board.withdraw(piece)` bounce home (multi withdraw frees exactly the one
  piece). Sorted toys remain board occupants of the multi slot — multi slots accumulate, so
  no drop can displace them. Duplicated `BOUNCE_*` constants and hand-wired handlers deleted.
- **Relaunch lock fix (all three scenes)** — the shell consults `isLocked` on every gesture;
  `GameSceneBase.completeGame` sets `inputLocked = true` and nothing reset it at `create()`,
  so a relaunched session (Phaser reuses the scene instance) would have been input-locked.
  Each scene now resets `inputLocked = false` where the board is constructed. This is
  behavior-preserving for a fresh session (it only re-enables input the old hand-wired
  handlers never consulted).
- **P2.T4.1 (AC-3, NFR-1)** — parity suites red-proofed via assertions:
  - `shapeSorterFlow.test.ts`: incorrect-drop test now fires all dragend handlers (the lift's
    dragend is registered first, exactly as in the shipped games) and asserts the bounce tween
    targets origin x/y with `duration 300`/`ease "Back.out"`; reduced-motion bounce asserts
    `duration 180`; new test "never displaces a locked shape when another shape drops onto its
    slot" (anti-eviction regression); lock test strengthened to position-simulate the placed
    shape and assert zero movement tweens after dragend (movement = tween with x/y defined,
    excluding the lift's scale-restore juice, which the shipped games also fire).
  - `shadowMatchFlow.test.ts`: same incorrect-drop assertions (300/`Back.out`), new
    reduced-motion bounce test (180), strengthened lock test (position sim + no movement
    tweens), new anti-eviction test, dragend-silent test fires all dragend handlers.
  - `bigSmallFlow.test.ts`: same incorrect-drop assertions (300/`Back.out`), new reduced-motion
    bounce test (180), strengthened sorted-lock test, new multi-slot test "keeps sorted toys in
    their box when a wrong toy drops into the same box", dragend-silent test fires all handlers.
  - `shapeSorterScene.test.ts`: only mechanical `obj` → `container` renames (the scene's
    `ShapeData` field is now the `BoardPiece.container` contract); all assertions unchanged in
    intent.
- **P2.T4.2 (mutation spot-check)** — COMPLETE (executed by the primary; the executor's
  sandbox denied `git hash-object`, so the primary ran the mutation, targeted run and
  restore). Full cycle recorded in `.conductor/evidence/phase-2-mutation.md`:
  pre-mutation hash `addccc49698bc3f2850784c64ca0bacda3daef8d`; mutation
  `const BOUNCE_DURATION = 300;` → `3000` (line 28, single occurrence); targeted run
  `pnpm test -- --run src/__tests__/scenes/shapeSorterFlow.test.ts src/__tests__/scenes/shadowMatchFlow.test.ts src/__tests__/scenes/bigSmallFlow.test.ts -t "incorrect drop bounces"`
  → **3 failed / 68 skipped**, with `AssertionError: expected 3000 to be 300` in all three
  adopting scenes' bounce tests; restored via primary `git checkout -- src/game/dragBoard.ts`;
  post-restore hash byte-identical (`addccc49…`); tree clean. `src/game/dragBoard.ts` is back
  at its pre-phase-2 committed state.
- **P2.T5.1 (AC-1, FR-5)** — grep proof below.

## Grep proof (P2.T5.1)

`grep DragBoard src/scenes/` — exactly five scene files reference the shell:

```
src/scenes/BigSmallScene.ts      (import, type, constructor)
src/scenes/NumberOrderScene.ts   (import, type, constructor)
src/scenes/ShadowMatchScene.ts   (import, type, constructor)
src/scenes/StoryOrderScene.ts    (import, type, constructor)
src/scenes/ShapeSorterScene.ts   (import, type, constructor)
```

`grep '\.on\("drop"|BOUNCE_' src/scenes/` — zero matches in the five drag scenes; the only
`BOUNCE_*` matches are `MusicalMemoryScene.ts`'s pre-existing frog bounce constants (a
non-drag reaction, untouched, not a placement drop state machine). No scene hand-wires a
placement drop handler (`obj.on("drop")` appears nowhere in `src/scenes/`).

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| Targeted adoption suites | `pnpm test -- --run src/__tests__/scenes/shapeSorterScene.test.ts src/__tests__/scenes/shapeSorterFlow.test.ts src/__tests__/scenes/shadowMatchFlow.test.ts src/__tests__/scenes/bigSmallScene.test.ts src/__tests__/scenes/bigSmallFlow.test.ts` | 0 | 86/86 after adoption + test updates |
| Lint/format | `pnpm check` | 0 | Pre-existing warning (`musicalMemoryScene.test.ts` non-null assertion) + pre-existing info (biome schema version) only |
| Types | `pnpm typecheck` | 0 | Clean; plain `Image` containers compile against `BoardDraggable` without casts |
| Unit (full) | `pnpm test -- --run` | 0 | 121 files / 2661 tests pass (6 new parity tests) |
| Coverage | `pnpm test:coverage` | 0 | Statements 97.84 (≥90), branches 91.47 (≥85), functions 96.79 (≥88), lines 98.76 (≥95); `dragBoard.ts` 97.42/93.18/100/99.39 |
| Build | `pnpm build` | 0 | 343 modules; `dragBoard` lazy chunk 5.87 kB |
| Bundle | `node scripts/validate-bundle.js` | 0 | Shell entry 138.4 kB ≤ 200 kB; all checks pass |
| PWA | `node scripts/validate-pwa.js` | 0 | 16/16 checks pass |
| Mutation pre-hash | `git hash-object src/game/dragBoard.ts` | **denied** | Permission denied by shell policy — cycle delegated to the primary |
| Mutation targeted run (primary) | `pnpm test -- --run src/__tests__/scenes/shapeSorterFlow.test.ts src/__tests__/scenes/shadowMatchFlow.test.ts src/__tests__/scenes/bigSmallFlow.test.ts -t "incorrect drop bounces"` | 1 | Under mutation `BOUNCE_DURATION` 300→3000: 3 failed / 68 skipped, `expected 3000 to be 300` in all three scenes (see `.conductor/evidence/phase-2-mutation.md`) |
| Mutation restore hash (primary) | `git hash-object src/game/dragBoard.ts` | 0 | `addccc49…` byte-identical to pre-mutation hash; tree clean |
| Final gate re-run (post-blocker, final head incl. evidence) | `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js` | 0 | Fresh single-chain re-run after the mutation cycle: check clean (same 2 pre-existing items), typecheck clean, 121 files / 2661 tests pass, coverage 97.83/91.41/96.79/98.76 (all gates green), build 343 modules (dragBoard chunk 5.87 kB), bundle 138.4 kB ≤ 200 kB, PWA 16/16 |

Full gate (NFR-3) run as one chain, exit 0 (run twice: pre-mutation, and a final re-run after
the mutation cycle closed — row above).
`pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js`

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| FR-1 | Shape Sorter lift/highlight/snap/wrong-bounce/per-drop validation through DragBoard, visuals unchanged | `ShapeSorterScene.ts` (board options + `handleBoardDrop`); `shapeSorterFlow.test.ts` green | Pass |
| FR-2 | Shadow Match same + stamp pulse stays scene-owned | `ShadowMatchScene.ts`; stamp/dim tests green | Pass |
| FR-3 | Big & Small boxes as `multi` slots; shrink/wiggle/bump scene-owned; board bounce-home on wrong | `BigSmallScene.ts` (`addSlot(x, BOX_Y, "multi")`); `bigSmallFlow.test.ts` green | Pass |
| FR-5 | Hand-rolled scaffolding deleted from adopting scenes | grep proof: no `obj.on("drop")`, no scene-local `BOUNCE_*` in the three scenes | Pass |
| AC-1 | `grep DragBoard src/scenes/` = 5 scenes; zero hand-wired placement drop machines | Grep proof section above | Pass |
| AC-3 | Per-scene suites assert 300/180 bounce (incl. reduced forms), per-drop validation + scene reaction, placed-correct lock | Updated + new tests in the three flow suites; assertions on `duration 300`/`180`/`"Back.out"` + origin x/y; red-proof closed by mutation (P2.T4.2: `BOUNCE_DURATION` 300→3000 fails all three scenes' bounce assertions; restored byte-identical — `.conductor/evidence/phase-2-mutation.md`) | Pass |
| AC-4 | Number Order / Story Order suites pass unchanged | Full run green; `numberOrderScene.test.ts`/`storyOrderScene.test.ts` not edited | Pass |
| NFR-1 | Kid-visible parity: timings/feedback/lock-on-correct + reduced-motion forms | Lift/snap/stamp/dim/shrink/wiggle/bump assertions unchanged and green; bounce home now at identical 300/180 board timings | Pass |
| NFR-2 | Two board games' parity | Suites pass with zero edits | Pass |
| NFR-3 | Full verification gate | Commands table (single chain, exit 0) | Pass |

## Evidence paths

- This report: `conductor/tracks/20261025-drag-board-consolidation/verification/phase-2.md`
- Mutation evidence: `.conductor/evidence/phase-2-mutation.md` (full P2.T4.2 cycle, executed by the primary)

## Deviations

- None outside `Touches`. The `inputLocked = false` reset lives inside the three scene files
  (in `Touches`); it is a required consequence of routing gestures through the shell's
  `isLocked` consultation.

## Blockers

- None. The prior `git hash-object` denial was resolved by the primary, which executed the
  full P2.T4.2 mutation cycle (mutation → targeted run → `git checkout` restore → byte-identity
  hash proof); see `.conductor/evidence/phase-2-mutation.md`.

## Notes

- Wrong-drop bounce design: the board accepts the drop (snap tween) and the scene's `onDrop`
  validation then calls `board.withdraw(piece)`, so the bounce home is the board's own
  300/180 `Back.out` tween from the slot — per the brief's "wrong drops bounce home via the
  board".
- Anti-eviction: single slots release occupancy on correct placement (locked pieces can never
  be displaced by a later wrong drop onto their slot); multi slots never displace. New
  anti-eviction regression tests cover both.
- The board constructor sets `scene.input.dragDistanceThreshold` (default 10) in all three
  scenes — the spec's parity-neutral assumption.
- Test counts: 2661 total (was 2655); +6 new parity tests, 0 removed.
- Commits: per-scene conventional commits + evidence commit; no amends.
