# Phase 3 — Extract the sticker shelf & time-up dimming

- **Track:** 20261021-hub-grid-decomposition — Hub Grid Decomposition
- **Phase:** 3 — Extract the sticker shelf & time-up dimming
- **Date:** 2026-10-21
- **Branch:** `refactor/20261021-hub-grid-decomposition`
- **Base commit:** `cc87098`
- **Head commit:** `e172d22` — primary completed the phase after the subagent's shell denial (see Primary verification)

## Result

**VERIFIED — completed by the primary after subagent shell denial.** The subagent
session lost shell access mid-phase and stopped per the brief's process note,
leaving a faithful, unverified four-file implementation in the working tree. The
primary then committed it, wrote the module unit tests (P3.T1.2, P3.T2.2) and
the orchestrator edge tests, applied Biome fixes, and ran the full gate: **exit
0 — 116 files / 2,429 tests passed** (2,411 prior + 18 new).

**State of the working tree (all uncommitted, exactly four files):**

| File | State |
| --- | --- |
| `src/game/hub/stickerShelf.ts` | **New** (216 lines) — shelf placement math, dashed empty-slot ring, sparkle/burst animations |
| `src/game/hub/timeUpDim.ts` | **New** (46 lines) — time-up lock/restore over a structural tile surface |
| `src/game/hubGrid.ts` | **Modified** — shelf/dim logic delegated to the modules; now 527 lines (from 654) |
| `src/game/hub/hubGridConstants.ts` | **Modified** — module doc updated (shelf/dim constants now point at their modules); comment-accuracy edit only |

**Completed by the primary:** `src/__tests__/game/hub/stickerShelf.test.ts`
(11 tests), `src/__tests__/game/hub/timeUpDim.test.ts` (4 tests), and three
orchestrator edge tests in `hubGrid.test.ts` (dim-while-paged, award riding a
page transition, shutdown release), plus Biome import-order/format fixes.
Commits: `a8b7940`, `3e2599a`, `e172d22`.

**Not done (deliberately, per the process note):** the module unit tests
(P3.T1.2, P3.T2.2) and the verification gate. No test code was written that
could not be run. No commits were made (git needs shell).

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| git (session start) | `git status && git log --oneline -5` | 0 | Clean tree at base `cc87098`; branch correct; Phase 2 checkpoint confirmed |
| static | `pnpm typecheck` | — | **permission.rejected** — shell denied |
| shell probe | `echo ok` | — | **permission.rejected** — shell denied |
| shell probe | `pnpm --version` | — | **permission.rejected** — shell denied |

The required gate `pnpm check && pnpm typecheck && pnpm test -- --run` was
**not run**; the phase cannot be verified in this session.

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| AC-1 | Each concern module owns its logic; no mixed-concern implementation in the orchestrator | `stickerShelf.ts` / `timeUpDim.ts` created; orchestrator grep shows zero remaining shelf/dim constants or tween-config bodies (grep: `JUST_EARNED_SCALE\|SPARKLE_\|EMPTY_SLOT_\|STICKER_SHELF_INSET\|TIME_UP_TILE\|TweenBuilderConfig` → no matches in `hubGrid.ts`) | partial — statically evidenced, gate not run |
| AC-2 | `HubScene.ts` unchanged; existing hub tests keep assertions | Static grep: only `HubScene.ts` and `hubGrid.test.ts` import `hubGrid`; all consumed members (`rerenderStickerShelf`, `applyTimeUpLock`, `restoreTiles`, `justEarned`, public fields) preserved as delegating methods/fields; **zero changes made** to either consumer | partial — unchanged by construction, not re-verified by gate |
| AC-3 | Every cleanup maps to an approved class, itemized | Itemization below | done (pending final-diff confirmation in Phase 4) |
| AC-4 | New module tests pass; full gate green | Module test files **not written** (process note); gate not run | failed/not run |

FR-2 note: `hubGrid.ts` is at 527 lines this phase; the ≤200-line target is
Phase 4's slim-down and is not expected here.

## Module boundary chosen (object creation vs logic)

Following the Phase 1/2 precedent (gridLayout, pageBoard):

- **Modules own:** pure math and drawing/tween-config decisions.
  `shelfStickerY` (shelf vertical placement), `drawDashedSlotRing` (the
  10-dash ring loop and its ink), `fadeSlotIn` (slot fade config +
  reduced-motion branch), `addSparkle` / `addJustEarnedBurst` / 
  `animateJustEarned` (shimmer/burst/just-earned tween configs and their
  reduced-motion variants), `applyTimeUpLock` / `restoreTiles` (lock/restore
  loops over a structural `LockableTile` surface).
- **Orchestrator keeps:** object creation (`scene.add.image`/`add.graphics`),
  the `stickerImages` / `emptySlotGraphics` list ownership (consumed by
  `destroyWideGrid` / `destroyPageGrid` / `flipTo` / `rerenderStickerShelf`),
  `entranceIndex` bookkeeping, `hasSticker` reads, the just-earned comparison,
  and all input wiring. `rerenderStickerShelf` stays entirely in the
  orchestrator (it is list lifecycle, not shelf logic).
- **Structural surface:** `stickerShelf.ts` reuses `gridLayout.ts`'s exported
  `EntranceScene` type (the tween configs it builds are exactly
  entrance-shaped); it defines module-local `SlotRingGraphics`, `FadeTarget`,
  `JustEarnedTarget`, `ShelfTweenConfig` (pageBoard precedent of local
  structural types). `timeUpDim.ts` defines its own `LockableTile`.
- **Deviation from byte-faithfulness:** `animateJustEarned` now also performs
  the pre-tween `sticker.setScale(stickerScale * JUST_EARNED_SCALE)` call that
  sat in `createShelfSticker` — the observable Phaser call sequence is
  identical (setScale 1.15× → setAlpha 0 → setScale 0 → tween), the mock call
  order is unchanged, and the enlarged-scale decision is shelf logic.

## Cleanup itemization by class (FR-3 / AC-3)

1. **Constants moved verbatim (named-constants class — relocation only, values
   untouched):** `STICKER_DISPLAY_SIZE 22`, `STICKER_SHELF_INSET 3`,
   `EMPTY_SLOT_ALPHA 0.55`, `EMPTY_SLOT_LINE_WIDTH 4`,
   `EMPTY_SLOT_DASH_COUNT 10`, `JUST_EARNED_SCALE 1.15`,
   `SPARKLE_DURATION 800`, `SPARKLE_ALPHA 0.75`, `BURST_SCALE 1.25`,
   `BURST_DURATION 500`, `PAGED_STICKER_DISPLAY_SIZE 30` → `stickerShelf.ts`;
   `TIME_UP_TILE_ALPHA 0.45`, `TIME_UP_TILE_SCALE 0.97` → `timeUpDim.ts`.
   Doc comments moved with them verbatim.
2. **Comment-accuracy edits:** `hubGridConstants.ts` module doc now names
   `stickerShelf.ts` / `timeUpDim.ts` instead of "still inline in hubGrid.ts";
   the inline band-placement comment in `createShelfSticker` became a one-line
   pointer to `shelfStickerY` (full rationale moved verbatim into
   `shelfStickerY`'s doc — Phase 1 breathe-comment precedent).
3. **No timing dedup, no dead-code removal, no renames** were applied. The
   `drawEmptySlot` fade config and the three animation configs moved to the
   modules byte-identical in values (`Sine.out`/300ms/40ms stagger,
   `Sine.inOut`/800ms shimmer, `Back.out`/300ms just-earned,
   `Sine.inOut`/500ms burst, `-1` repeats, `1.15`/`1.25` scales, `0.55`/`4`
   slot ink).

## Static analysis performed (in lieu of the gate)

- **Orchestrator:** grep confirms no shelf/dim constant or
  `TweenBuilderConfig` annotation remains in `hubGrid.ts`; the deleted private
  methods (`animateJustEarned`, `addSparkle`, `addJustEarnedBurst`) have zero
  remaining references anywhere in `src/`; all nine `hubGridConstants` and
  `pageBoard` imports remain in use (checked individually; `ENTRANCE_DURATION`
  / `ENTRANCE_STAGGER` imports were removed — their only orchestrator uses
  moved into the modules); `isReducedMotion` remains used (`buildPageGrid`,
  `flipTo`).
- **Name shadowing check:** the module functions `applyTimeUpLock` /
  `restoreTiles` share names with the `HubGrid` methods they back. TypeScript
  resolves the unqualified calls inside the method bodies to the module-scope
  imports (class members require `this.`), so the delegation is correct, not
  recursive. `HubScene.ts`'s `this.grid.applyTimeUpLock()` hits the method.
- **Structural compatibility (by inspection against Phaser 4 typings used
  elsewhere):** `Phaser.Scene` already satisfies `EntranceScene` (the
  orchestrator passes `this.deps.scene` to `animateEntrance` at HEAD);
  `Phaser.GameObjects.Image` satisfies `JustEarnedTarget`;
  `Phaser.GameObjects.Graphics` satisfies `SlotRingGraphics` / `FadeTarget`
  (`arc`'s extra `overshoot?` param is compatible; methods returning `this`
  satisfy `unknown` returns); `Phaser.GameObjects.Rectangle` satisfies
  `LockableTile`; `Rectangle[]` satisfies `Iterable<LockableTile>`.
- **Fix applied from static review:** the just-earned tween config needed a
  typed annotation (`ShelfTweenConfig`) because the original's
  `Phaser.Types.Tweens.TweenBuilderConfig` annotation moved out with the
  extraction; an unannotated object literal would make the later
  `config.scaleX` assignments a type error. Fixed before stopping.
- **Biome import order:** the new `stickerShelf` member import block was
  pre-ordered per the repo's case-insensitive-primary/case-sensitive-tiebreak
  ordering (`addSparkle… fadeSlotIn, PAGED_STICKER_DISPLAY_SIZE,
  shelfStickerY, STICKER_DISPLAY_SIZE`), matching the `pageBoard` block's
  pattern (`SwipeGesture` before `slidePageIn`). `pnpm check` has not
  confirmed this — the primary should run `biome check --write` as a
  mechanical fix if any ordering differs.

## Outstanding work for the primary / a shell-enabled re-run

1. **Run the gate:** `pnpm check && pnpm typecheck && pnpm test -- --run`
   (then the full `verify_phase` ladder at Phase 4).
2. **Mechanical fixes if the gate flags anything:** the two most likely spots
   are Biome import order (above) and `pnpm typecheck` on the structural
   interfaces (analysis above predicts they are clean).
3. **Write the module tests (P3.T1.2 / P3.T2.2)** — planned cases:
   - `src/__tests__/game/hub/stickerShelf.test.ts` (plain mocks, no Phaser
     module mock needed — the module has no runtime Phaser import):
     `shelfStickerY` byte-pins (wide `0,116,22 → 44`; paged `0,196,30 → 80`,
     matching the documented +33..+55 / +65..+95 bands);
     `drawDashedSlotRing` (`lineStyle(4, 0xffffff, 0.55)`, 10 arcs, first arc
     `[0,0,r,0,π/10,false]`, step `π/5`, 10× beginPath/strokePath);
     `fadeSlotIn` normal (`setAlpha(0)` then tween
     `{alpha:0.55, delay:index*40, duration:300, ease:"Sine.out"}`) vs
     reduced (`setAlpha(0.55)`, no tween — `stubMatchMedia(true)`);
     `addSparkle` normal (`{alpha:0.75, duration:800, yoyo, repeat:-1,
     ease:"Sine.inOut"}`) vs reduced (none); `animateJustEarned` normal
     (`setScale(1.15s) → setAlpha(0) → setScale(0)`, tween
     `{alpha:1, ease:"Back.out", scaleX/scaleY:1.15s}` and invoking its
     `onComplete` yields the shimmer + burst tweens) vs reduced (never
     `setScale(0)`, alpha-only tween, no `onComplete`); `addJustEarnedBurst`
     normal (2 tweens) vs reduced (0).
   - `src/__tests__/game/hub/timeUpDim.test.ts`: lock sets alpha 0.45 / scale
     0.97 / `disableInteractive` on every tile; restore sets 1/1 and
     `setInteractive`; **only the tiles passed are touched** (the visible-page
     contract).
   - Orchestrator-level edge tests in `hubGrid.test.ts` (Touches permits):
     **dim-while-paged** (narrow viewport + `isTimeUp:true`, `flipTo(1)` →
     every tile in `grid.attractTargets` got `setAlpha(0.45)` +
     `disableInteractive`); **award racing a page transition**
     (`earnSticker("how-many")` — index 10, page 1; `grid.justEarned =
     "how-many"`; `buildPageGrid(0)`; `flipTo(1)`; assert exactly one
     `Back.out` tween whose config has `scaleX` defined, and that firing the
     mocked `scene.time.delayedCall` callback destroys the outgoing shelf
     objects **per-object** while the incoming page's shelf objects are
     untouched — mock registry is append-only, never assert registry counts);
     **shutdown cleanup** (`buildPageGrid(1)` with the earned sticker, then
     `grid.destroy()` → per-object `destroy` asserted on tiles, shelf
     stickers, slot graphics).
4. **Commit task-level** (e.g. `refactor(hub): extract the sticker shelf into
   hub/stickerShelf` and `refactor(hub): extract time-up dimming into
   hub/timeUpDim`, tests included) and mark the phases in `plan.md`.

## Deviations

- `src/game/hub/hubGridConstants.ts` — module-doc comment edit (comment
  accuracy; within `Touches` `src/game/hub/**`, recorded for completeness).
- No files outside `Touches` were touched.

## Notes

- The extraction itself is believed complete and faithful (values,
  call order, and reduced-motion branches preserved), but **nothing is
  verified** — treat the working tree as an unverified candidate, not a
  finished phase.
- The P3.T1/P3.T2 implementation (not the tests) is in the tree; per Phase 2
  precedent the primary may commit it after the gate, or revert and re-run the
  phase with shell access.
- `pnpm check` (Biome) has one known-risk spot: the hand-ordered import block
  in `hubGrid.ts`. Everything else in the diff is mechanical.

## Primary verification

- **Command:** `pnpm check && pnpm typecheck && pnpm test -- --run` — **exit 0**
- Biome: 239 files checked; only the two pre-existing findings (biome.json
  schema 2.5.5-vs-CLI-2.5.10 info; musicalMemoryScene.test.ts:294
  noNonNullAssertion warning). One Biome fix pass was needed on the new files
  (`useImportType` on the stickerShelf's gridLayout import; import ordering) —
  mechanical, applied via `--write`.
- `tsc --noEmit` clean (one type error in the primary's own shutdown test fixed
  before the run — `narrowViewport` takes the MockScene, not `deps.scene`).
- Vitest: **116 files / 2,429 tests passed** (~29s).
- Diff `cc87098..HEAD` = the four subagent files + the three test files, all
  within Touches. `HubScene.ts`, `hubPaging.ts`, `hubTiles.ts` untouched.
- Acceptance: FR-1 satisfied for concerns 3-4 (stickerShelf.ts owns shelf
  math/ring/sparkle/burst; timeUpDim.ts owns lock/restore); AC-1 partial (all
  four concerns now extracted; orchestrator slim-down lands in Phase 4);
  FR-4 satisfied (18 new tests); FR-3 cleanups unchanged from the subagent's
  itemization (comment-accuracy edits only).
