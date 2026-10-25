# Track Review - 20261025-drag-board-consolidation

- **Track:** `20261025-drag-board-consolidation` (refactor, high)
- **Branch:** `refactor/20261025-drag-board-consolidation`
- **Range:** `7f40c076d08d4f6a95a498d1aa0c1435abddc098..73e3c967` (code head at review; later commits are conductor state and docs sync only)
- **Date:** 2026-10-25
- **Round:** 2 (final)
- **Verdict:** **PASS** - round 1 returned PASS WITH FINDINGS (zero Critical or
  High: one Medium, three Low); F1/F3/F4 were fixed in Phase R1 (checkpoint
  `ea4eea2c`) with red-proofed regression coverage; F2 is an accepted
  documented deferral. Round 2 confirmed resolution with no new findings.

## Summary

The shell generalization and the three scene adoptions are parity-faithful
with strong red-first and mutation evidence. The reviewer independently
re-ran the consolidation greps (exactly five scenes reference `DragBoard`;
zero hand-wired placement `drop` wiring, `snapToSlot` use, or scene-local
`BOUNCE_*` constants in the adopting scenes), verified piece-id uniqueness
claims against each scene's selection logic, compared old-vs-new correct-drop
paths via `git show 7f40c076:src/scenes/BigSmallScene.ts` (snap -> shrink ->
react -> disable -> sorted, same order as the new board-snap + scene-owned
reactions), confirmed the anti-eviction semantics (single slots release
occupancy on correct placement; multi slots accumulate; withdraw/detach frees
exactly one occupant), and confirmed the `inputLocked = false` reset
deviation is behaviour-preserving: `GameSceneBase.completeGame` (line 441)
sets the lock and nothing resets it, the old hand-rolled handlers never
consulted it, and both shipped board games (`NumberOrderScene:90`,
`StoryOrderScene:92`) use the same reset-plus-`isLocked` pattern.

## Verification

| Layer | Exit | Reading |
| --- | --- | --- |
| full chain (check, typecheck, test, coverage, build, bundle, pwa, docs) | 0 | 121 files / 2661 tests; coverage 97.83/91.41/96.79/98.76; shell 138.4 kB <= 200 kB; PWA 16/16; docs 5/5 (primary-verified at `73e3c967`, recorded in `verification/integrated.md`) |
| `grep DragBoard src/scenes/` | - | exactly 5 scenes (reviewer re-run) |
| `grep 'on("drop"|snapToSlot|BOUNCE_' src/scenes/` | - | zero matches in the five drag scenes; only MusicalMemory's pre-existing non-drag frog bounce remains |
| `git log --oneline 7f40c076..HEAD` | - | commit chain matches plan checkpoints `3d94b937` / `6187149d` / `73e3c967` |

## Requirements

| ID | Verdict | Note |
| --- | --- | --- |
| FR-1 | covered | Shape Sorter routed through the board; `shapeSorterFlow.test.ts` parity suite green |
| FR-2 | covered | Shadow Match same + stamp pulse scene-owned; `shadowMatchFlow.test.ts` |
| FR-3 | covered | Big & Small boxes as `addSlot(x, BOX_Y, "multi")` (`BigSmallScene.ts:179`); shrink/lid-wiggle/bump scene-owned; `bigSmallFlow.test.ts` |
| FR-4 | covered | `BoardDraggable` capability contract + `addSlot` `single|multi`; `dragBoard.test.ts` image-piece and capacity describes; no game names in the shell |
| FR-5 | covered | grep proofs: 5 scenes, no hand-wired placement wiring, no scene-local bounce constants |
| NFR-1 | covered | 300/`Back.out` + 180 reduced assertions in all three flow suites; mutation spot-check closes the red-proof loop |
| NFR-2 | covered | Number Order / Story Order scenes and suites untouched, green |
| NFR-3 | covered | full verification chain exit 0 (`verification/integrated.md`) |
| NFR-4 | covered | shell entry 141,675 B (was 141,712 at v1.21.5) <= 200 kB gate; `dragBoard` chunk 5.87 kB |
| AC-1..AC-6 | covered | see `verification/integrated.md`; AC-6 verified against the docs diff (one precision nit, F3) |

## Plan compliance

Compliant. All 10 tasks landed in checkpoint order. Deviations, all
documented and accepted: (1) the `inputLocked = false` reset in the three
adopting scenes - in `Touches`, reviewer-verified as behaviour-preserving;
(2) `bigSmallScene.test.ts` is listed in Phase 2 `Touches` but was not
touched - benign allowlist slack; (3) the `BoardPiece.container` field name
kept while its type widened (spec requires widening, not renaming; FR-4 met).

## Findings

| ID | Severity | Finding | Disposition |
| --- | --- | --- | --- |
| F1 | Medium | `dragBoard.ts:429-441` + scene withdraw paths - on a wrong drop the shell snaps the piece toward the slot centre (200 ms `Cubic.out`) *before* firing `onDrop`, and the scene's `withdraw` then adds the 300 ms `Back.out` home tween: two competing `x/y` tweens on the same target; the home tween's start value is captured after the snap's first fast-start step, so the piece lunges up to ~18 px toward the box before bouncing home instead of the old single clean bounce from the drop point | **fixed in R1** - `snapToSlot` returns its tween (accepted behaviour-neutral deviation); `DragBoard` tracks it in a private `snapTweens` map and stops it in `tweenHome` before the home tween, covering withdraw / wrong-answer / missed-drop; correct-drop path untouched; no `killTweensOf`; 3 board interplay tests + one single-live-tween assertion per scene suite; red proof in `.conductor/evidence/phase-r1-red.md` |
| F2 | Low | `BoardPiece.container` (line 71) holds any `BoardDraggable` (often a plain `Image`); the field name is mildly misleading | documented deferral (reviewer-endorsed): renaming would touch Number Order / Story Order scenes + tests, outside this track's `Touches`; follow-up track may rename to `draggable` |
| F3 | Low | `docs/TDD.md` ~962 - the changed line describes the piece contract as the `DragTarget` capability set, omitting the pointer/drag/drop event overloads the real `BoardDraggable` contract adds | **fixed in R1** - the clause landed (verified in the round-2 diff) |
| F4 | Low | wrong-drop tests in the three flow suites fire all dragend handlers while the mock container sits at its tray position, not the drop point, so `correctMissedDrop`'s over-zone skip branch is not exercised faithfully and a duplicate identical home tween can be added | **fixed in R1** - all three tests position the mock at the wrong slot's centre before drop/dragend |

## Out of scope (pre-existing, unchanged by this diff)

- TDD.md 9.3 wording "snapToSlot settles over 200 ms Back.out" vs the shipped
  `Cubic.out` ease in `src/utils/dragJuice.ts` - pre-existing line.
- `MusicalMemoryScene`'s `BOUNCE_*` constants - unrelated non-drag frog bounce.
- `attachDropZoneHighlight`'s per-round listener registration pattern - shared
  by all five board scenes, not introduced here.

## Debt

One documented deferral: F2 (field-name rename as a candidate follow-up
track). No GitHub issue created: `issues.min_severity` is `medium` and F2 is
Low.

## History

| Round | Verdict | C | H | M | L | Fixed |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | PASS WITH FINDINGS | 0 | 0 | 1 | 3 | 3 in Phase R1 (`ea4eea2c`); 1 deferred (F2) |
| 2 | PASS | 0 | 0 | 0 | 1 | F2 accepted deferral; zero fixable findings remain |

## Doc sync

`updated`. Tech-stack changelog carries the 2026-10-25 drag-board
consolidation entry (`d47ef137`); TDD.md 9.3 and roadmap.md truth landed in
Phase 3 (`73e3c967`) with F3's precision clause in R1 (`ea4eea2c`); PRD
needed no change (no hand-roll claims or per-chunk byte figures in
`docs/PRD.md`).
