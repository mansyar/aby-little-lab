# Phase 2 Verification — Extract the phone paging board

- **Track**: 20261021-hub-grid-decomposition — Hub Grid Decomposition
- **Phase**: 2 — Extract the phone paging board
- **Date**: 2026-10-21
- **Branch**: refactor/20261021-hub-grid-decomposition (as briefed; branch state not re-confirmed — see Result)
- **Base commit**: 888b027 (phase base, per brief)
- **Head commit**: none — **uncommitted working tree** (git unavailable in this session, see Result)

## Result

**BLOCKED (implementation complete; verification not run, commits not made).**

The full implementation and unit tests are written, and static inspection (native
grep/read tools) confirms internal consistency. However, this subagent session was
denied shell access ("Permission denied: shell") on every attempt, so:

- the phase verification command `pnpm check && pnpm typecheck && pnpm test -- --run`
  **could not be run** — no exit code, no test output exists for this phase;
- **no git commits could be made** (P2.T1 changes sit uncommitted in the working tree);
- the branch identity could not be re-confirmed via `git branch`.

Per the workflow rule "never mark a phase verified when a required check did not run",
the phase is reported blocked, not verified. The primary agent should run the gate and
commit the changes listed under "Files changed".

## Commands

| Layer | Command | Exit | Summary |
|---|---|---|---|
| — | `git branch --show-current` (via shell) | denied | "Permission denied: shell" — attempt 2 of 3 |
| — | `pnpm --version` (via shell, allowlist probe) | denied | "Permission denied: shell" — attempt 3 of 3; blanket denial confirmed |
| static | native grep: moved identifiers (`isNarrowViewport`, `SWIPE_MIN_DISTANCE`, `swipeStart`, `this.swiping`, `PAGE_DOT_*`, `PAGE_DOTS_*`) | — | No stale references in `hubGrid.ts`; moved symbols resolve only to `src/game/hub/pageBoard.ts`, `src/game/hubPaging.ts` (untouched definition) and the new test |
| static | native grep: constants usage before edit | — | All paging-constant usages were confined to `hubGrid.ts`; no third-party importers to re-wire |
| verification | `pnpm check && pnpm typecheck && pnpm test -- --run` | **NOT RUN** | Shell tool denied in this session; cannot be executed by this subagent |

## Acceptance criteria (phase scope: FR-1, FR-2, AC-1; supports FR-4)

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| FR-1 / AC-1 | Concern 2 lives in its own module; orchestrator delegates | `src/game/hub/pageBoard.ts` owns: paging constants, swipe region, `SwipeGesture` state machine, page-dot geometry/repaint, page-slide tweens, viewport classification. `hubGrid.ts` retains only delegation + Phaser object creation/input wiring (dot creation with `Phaser.Geom` hit area, scene `input.on` wiring, build/destroy orchestration) — grep inspection above | Code-complete (static inspection only; runtime verification pending) |
| FR-2 | `hubGrid.ts` remains the single module HubScene imports; public surface preserved | All public methods/fields keep names and semantics (`classifyViewport`, `handleViewportChange`, `createPageDots`, `wireSwipeGestures`, `buildPageGrid`, `buildWideGrid`, `flipTo`, `updatePageDots`, `rerenderStickerShelf`, `applyTimeUpLock`, `restoreTiles`, `destroy`, `resetForVisit`, `paged`, `hubPage`, `pageDots`, `attractTargets`, `justEarned`, …); `HubGridDeps` untouched; `src/scenes/HubScene.ts` untouched (0 edits) | Code-complete |
| FR-3 / AC-3 | Every non-extraction change maps to an approved cleanup class | Itemized below (1 named constant, 3 comment-accuracy edits, renames confined to moved code) | Done |
| FR-4 / AC-4 | New module unit tests pass + full gate green | `src/__tests__/game/hub/pageBoard.test.ts` written (28 assertions across page dots, swipe region byte-pin, swipe state machine incl. reduced-motion-adjacent flags, slide tweens, viewport classification); additive reduced-motion flip test added to `src/__tests__/game/hubGrid.test.ts` | **Not verified** — tests written, never executed |

## What was extracted vs. reused

**Extracted into `src/game/hub/pageBoard.ts`** (no runtime Phaser import — dragBoard/gridLayout precedent):

- Constants (doc comments verbatim): `PAGE_SLIDE_DURATION`, `SWIPE_MIN_DISTANCE`, `PAGE_DOTS_Y`, `PAGE_DOTS_SPACING`, `PAGE_DOTS_RADIUS`, `PAGE_DOT_ACTIVE_ALPHA`, `PAGE_DOT_INACTIVE_ALPHA`, `PAGE_DOT_HIT`.
- Swipe state machine `SwipeGesture` (`begin`/`track`/`settle` + `swiping` flag) replacing the `swiping`/`swipeStart` fields, byte-faithful to the three inline handlers: pointerdown resets the flag then records a start only when unblocked and inside the grid region; pointermove arms `swiping` at the threshold; pointerup clears the start, requires `|dx| ≥ SWIPE_MIN_DISTANCE` and `|dx| > |dy|`, returns `hubPage ± 1`; `swiping` persists until the next `begin` (tile-tap guard).
- `swipeRegion()` — the grid bounds derived from `pagedTilePosition(0)`/`(9)`, pinned byte-exact in the module test (left 32, right 992, top 178, bottom 590).
- Page-dot math: `pageDotX`, `pageDotAlpha`, `paintPageDots` (the former `updatePageDots` loop).
- Page-slide tweens: `slidePageIn` / `slidePageOut` over a structural `SlideScene` (the two tween loops from `buildPageGrid` and the flipTo slide-out loop).
- Viewport classification: `isPagedViewport` (the former `classifyViewport` body).

**Reused from `src/game/hubPaging.ts` (unmodified)**: `pageCount`, `pageTileIndexes`, `pagedTilePosition`, `isNarrowViewport` — no page math was duplicated.

**Stays in the orchestrator** (per the Phase-1 pattern; object creation + input wiring): `createPageDots` (circle + `Phaser.Geom.Rectangle` hit area + tap → `onUserGesture`+`flipTo`), `wireSwipeGestures` (one-time `scene.input.on` wiring with the `swipeWired` guard and its re-arm comment), `flipTo`/`handleViewportChange` build-destroy orchestration including the reduced-motion instant-swap branch, and the `swipes.swiping` read in the paged tile-tap guard.

## Cleanup itemization (FR-3 / AC-3)

| Class | Change | Location |
|---|---|---|
| Named constants | `PAGE_DOT_COLOR = 0x2d3748` extracted from the inline circle-fill literal in `createPageDots` | `pageBoard.ts`, used in `hubGrid.ts` |
| Timing dedup | **None** | — |
| Dead-code removal | **None** (the dropped `isNarrowViewport`/`swiping`/`swipeStart` bindings in `hubGrid.ts` are consequences of the move, not behavior removal) | — |
| Internal renames (moved code only) | `swiping` → `SwipeGesture.swiping` getter, `swipeStart` → private `start`, `gridLeft/Right/Top/Bottom` → `SwipeRegion` fields | `pageBoard.ts` |
| Comment-accuracy edits | (1) `hubGridConstants.ts` module doc now points page slide/dots/swipe constants at `pageBoard.ts`; (2) `hubGrid.ts` paged-constants block doc reduced to the shelf constant and points interaction constants at `pageBoard.ts`; (3) `createPageDots` doc "the two textless page dots" → "the textless page dots" (stale count — there are 3 pages); (4) shelf-slide comment gains the settle-x equivalence note | listed files |

Behavior-identical refactor note: the shelf slide-in previously tweened `x: obj.x + delta` with `delta = pos.x - x`; every shelf piece it covers sits at `x = pos.x + slideFrom`, so `obj.x + delta === pos.x` — the unified `slidePageIn(…, pos.x)` produces identical tween configs.

## Evidence paths

- `conductor/tracks/20261021-hub-grid-decomposition/verification/phase-2.md` (this file)
- Changed files (uncommitted): `src/game/hub/pageBoard.ts`, `src/game/hubGrid.ts`, `src/game/hub/hubGridConstants.ts`, `src/__tests__/game/hub/pageBoard.test.ts`, `src/__tests__/game/hubGrid.test.ts`

## Deviations

- None within Touches; `hubPaging.ts` and `HubScene.ts` were not modified.
- Process deviation: the verification command and git commits could not be executed — shell tool denied for this session (see Result). No binary artifacts were produced under `.conductor/evidence/`.

## Notes for the primary agent

1. Run `pnpm check && pnpm typecheck && pnpm test -- --run` on the working tree; the new module follows the gridLayout test pattern (no Phaser mock needed for `pageBoard.test.ts`; `hubGrid.test.ts` additions use existing helpers only). The one Biome risk point is named-import ordering in the two new import blocks (ordered case-insensitively per the `displayScale, TEXTURE_SIZES` precedent) — `biome check --write` fixes mechanically if the guess is off.
2. Suggested commits (not made): `refactor(hub): extract the paged phone board into hub/pageBoard` for the five code/test files, then the evidence file with the phase-state commit.
3. Behavior preserved by construction: tween configs, guard order, flag lifetimes, and geometry are byte-identical to the pre-extraction code; the only new named constant is `PAGE_DOT_COLOR`.

## Primary verification

- **Command:** `pnpm check && pnpm typecheck && pnpm test -- --run`
- **Exit:** 0
- **Result:** 239 files checked by Biome (same two pre-existing findings only); tsc clean; Vitest **114 files / 2411 tests passed** (2390 existing + 21 new: 20 pageBoard module assertions in pageBoard.test.ts plus the reduced-motion flip test, plus the restored re-arm test counted in the 17 hubGrid paged-grid tests).
- **Recovery from the reported block:** the phase work was completed by the primary because the subagent session was denied shell access. Steps taken:
  1. Committed the subagent's uncommitted implementation as `13e7647` `refactor(hub): extract the paged phone board into hub/pageBoard`.
  2. First gate run failed (exit 1) with three mechanical defects left by the shell-less session: a parse error in `hubGrid.test.ts` (an `it(...)` header had been dropped, orphaning a test body) — restored verbatim as `it(""re-arms swipe wiring after a scene shutdown (revisit)"")`; fixable Biome import-ordering/format findings in `pageBoard.test.ts` and `hubGrid.ts` — fixed via `biome check --write`; and one wrong assertion in the new reduced-motion flip test.
  3. The reduced-motion flip test expected `rects(176,196).length === 10` after a destroy+rebuild, but the phaserMock registry is append-only (`destroy` is a recording stub that never removes objects), so the count can only grow. The production reduced-motion branch is correct; the test was rewritten to assert per-object destruction (every page-0 tile's `destroy` called) plus a registry delta of exactly one page's worth of new tiles. Committed as `18683fa`.
  4. Biome ordering/format fixes committed as `b33e6a8` (pure import sorting + one array-literal reflow, zero semantic change).
- **Diff check:** git diff 888b027..HEAD matches Touches exactly (src/game/hub/pageBoard.ts, src/game/hub/hubGridConstants.ts, src/game/hubGrid.ts, src/__tests__/game/hub/pageBoard.test.ts, src/__tests__/game/hubGrid.test.ts, verification/phase-2.md). hubPaging.ts and HubScene.ts untouched. No unreported outside-Touches changes.
- **Acceptance:** FR-1/AC-1 satisfied (concern 2 in src/game/hub/pageBoard.ts; orchestrator delegates); FR-2 satisfied (public surface preserved, HubScene untouched); FR-3 itemization verified against the final diff; FR-4 satisfied for this phase's modules (28+ assertions green). AC-2/AC-4 full-gate portions remain for Phase 4 by design.
