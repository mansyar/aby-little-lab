# Phase R1 — Review fixes: tween interplay and contract precision

Track: `20261025-drag-board-consolidation` · Branch: `refactor/20261025-drag-board-consolidation`
Phase base: `e577ff64` · Final head at verification: `16eddd68` · Date: 2026-10-25

## Commands and exit codes

| # | Command | Exit code | Result |
|---|---------|-----------|--------|
| 1 | `pnpm check` | 0 | 1 pre-existing warning (`musicalMemoryScene` non-null assertion) + 1 biome schema info — benign per brief |
| 2 | `pnpm typecheck` | 0 | clean (after fixing the positioned-mock typing, see notes) |
| 3 | `pnpm test -- --run` | 0 | **2664 passed** (2661 + 3 new board tests) / 121 files |
| 4 | `pnpm test:coverage` | 0 | statements 97.85% (≥90) · functions 96.79% (≥88) · branches 91.47% (≥85) · lines 98.76% (≥95) — all gates pass |
| 5 | `pnpm build` | 0 | built; shell `index-JjHGcCHs.js` 138.4 kB |
| 6 | `node scripts/validate-bundle.js` | 0 | shell 138.4 kB ≤ 200 kB, Phaser vendor chunk present |
| 7 | `node scripts/validate-pwa.js` | 0 | 16/16 checks passed, 41/41 chunks precached |
| 8 | `node scripts/validate-docs.js` | 0 | run by the primary at the final head (sandbox had denied it twice here): "Results: 5 passed, 0 failed — All document validation checks passed!" — blocker cleared |

Red-first run (pre-fix shell) — see `.conductor/evidence/phase-r1-red.md`:
`pnpm test -- --run src/__tests__/game/dragBoard.test.ts src/__tests__/scenes/shapeSorterFlow.test.ts src/__tests__/scenes/shadowMatchFlow.test.ts src/__tests__/scenes/bigSmallFlow.test.ts` → exit 1, **5 red**: the three wrong-drop flow tests showed **2 live positional tweens** per piece (snap + home, never stopped) and the two new board interplay tests showed the tracked snap tween's `stop` called 0 times. Post-fix the same run is green (122/122, then 2664/2664 full).

Note: the brief's chained verification command was denied by the sandbox as a
single `&&` chain; every named command was then run individually and exactly
as written above (only the docs validator was refused outright; it has since
been run green by the primary at the final head — see row 8).

## Per-finding coverage

### F1 (Medium) — wrong drop ran two competing positional tweens — FIXED

- **Red evidence:** `.conductor/evidence/phase-r1-red.md` — regression-first:
  the "exactly one live positional tween" assertion was written first and
  failed against the pre-fix shell with `expected … length of 1 but got 2` in
  all three flow suites, plus `stop called 0 times` in the two board tests.
- **Assertions added** (post-fix green):
  - `shapeSorterFlow.test.ts` / `shadowMatchFlow.test.ts` /
    `bigSmallFlow.test.ts` wrong-drop tests: after drop → `onDrop` → withdraw
    → dragend, the piece's live x/y-animating tweens are counted by
    inspecting `tweens.add` results and filtering out any tween whose `stop`
    was called — `expect(livePositionalTweens).toHaveLength(1)`. This
    genuinely discriminates 2-vs-1 (proved red pre-fix, green post-fix) and
    the existing duration/ease assertions are intact.
  - `dragBoard.test.ts` new `snap tween interplay` describe: withdraw path
    and `applyWrongAnswer` path each assert `snap.stop` called once and one
    live positional tween (300/180, `Back.out`, at origin); a third test
    asserts the correct-drop path leaves the snap tween running (the snap is
    the intended final rest tween there).
- **Design (where tracked, where stopped, why not `killTweensOf`):** the
  shell tracks the tween `snapToSlot` returns in a private
  `snapTweens = new Map<TPiece, Phaser.Tweens.Tween>()`, keyed by the piece
  record, set in `snap()`; `tweenHome()` stops and deletes the tracked tween
  before adding the home tween, which covers all three of its call sites
  (withdraw, wrong-answer bounce-home, missed-drop unplaced correction).
  `killTweensOf` is deliberately not used because the drag-lift's
  scale/angle restore tween runs on the same container and must survive.
  `clear()` also clears the map so per-round teardown cannot leave stale
  entries. The shell stays game-free: private state only, no scene names,
  no new public API on `DragBoard`.
- **Enabler (deviation):** `src/utils/dragJuice.ts` — `snapToSlot` now
  returns its `Phaser.Tweens.Tween` (previously returned void). Behaviour
  neutral for existing callers; its only consumer is `dragBoard.ts`. Without
  the return value the shell could not track the tween without duplicating
  the snap constants, which would re-introduce the duplication this track
  deleted.

### F4 (Low) — wrong-drop tests fired dragend from the tray position — FIXED

Each of the three wrong-drop tests now sets the mock container's x/y to the
wrong slot's center (inside the target zone) before firing the drop callback
and dragend, mirroring the real gesture order (drop lands at a zone position
→ dragend over that zone). `correctMissedDrop`'s over-zone skip branch is now
exercised (no duplicate identical home tween), and the bounce still runs from
the drop point as the existing 300 ms / `Back.out` assertions confirm.

### F3 (Low) — docs contract precision — FIXED

`docs/TDD.md` §9.3 `dragBoard.ts` row (line 962) now reads:

> …and a piece's `container` field accepts any `BoardDraggable` — the
> `DragTarget` capability set (transform + drag lifecycle + owning scene)
> extended with the `pointerdown`/`pointerup`, `drag` and `drop` event
> overloads the shell wires itself — so both a plain
> `Phaser.GameObjects.Image` and a `Container` qualify.

This is engine-accurate against `src/game/dragBoard.ts`'s exported
`BoardDraggable` type (`DragTarget & { on(pointerdown|pointerup…),
on(drag…), on(drop…) }`). CRLF file edited with the `edit` tool only.

### F2 — NOT in scope (documented deferral)

Untouched, as instructed: `BoardPiece.container` rename would touch
NumberOrderScene/StoryOrderScene and their tests, outside this phase's
Touches. No code, tests, or docs reference was changed for F2.

## Result

Phase R1 complete at `16eddd68` (code) with the evidence commit following:
F1, F3, F4 resolved; F2 remains the documented deferral. Kid-visible parity
preserved — the full suite (2664) plus duration/ease/reduced-motion assertions
are unchanged and green, and the bounce is now a single clean tween from the
drop point, matching the old hand-rolled behaviour. All eight verification
commands are green: the docs validator, which the sandbox denied to this
executor, was run by the primary at the final head and passed 5/5 (exit 0).

**Result: verified.**

## Deviations

- `src/utils/dragJuice.ts` — `snapToSlot` return type `void` →
  `Phaser.Tweens.Tween` (returns the started tween). Required: the shell must
  track the snap tween to stop it on the home paths, and duplicating the snap
  constants in the shell was the only alternative inside Touches. Behaviour
  neutral; only consumer is `dragBoard.ts`.
- Commit granularity: two follow-up commits record corrections that could not
  be amended (`93b97190` biome formatting of the new `snap` capture line;
  `16eddd68` the positioned mock cast — the flow tests' `obj.x` is typed as a
  Mock, so the established `as unknown as { x: number; y: number }` pattern
  from the lock tests was applied).

## Blockers

None. The only blocker (docs validator sandbox denial) was cleared: the
primary ran `node scripts/validate-docs.js` at the final head — exit 0,
"Results: 5 passed, 0 failed — All document validation checks passed!"
(recorded as row 8 in the commands table).

## Notes

- Red-first evidence: `.conductor/evidence/phase-r1-red.md`.
- The `correctMissedDrop` placed-piece branch (return-to-slot tween) and the
  slot↔slot / tray↔slot displacement `tweenTo`s were reviewed for the same
  interplay; the brief's prescription covers the home paths via `tweenHome`,
  and those paths were left as prescribed (displacement tweens supersede a
  same-destination or freshly-started snap only in sub-200 ms rapid-drop
  edge cases outside the finding's mechanism).
- Commit chain: `e6cd5465` (fix + board tests) → `1ff57f79` (flow tests) →
  `18e2e90b` (docs) → `93b97190`, `16eddd68` (corrections) → `5c2e4a2b`
  (evidence) → this blocker-clearance evidence update, committed last.
