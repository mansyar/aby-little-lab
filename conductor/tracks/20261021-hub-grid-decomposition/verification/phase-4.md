# Phase 4 — Orchestrator slim-down & full gate

- **Track:** 20261021-hub-grid-decomposition — Hub Grid Decomposition
- **Phase:** 4 — Orchestrator slim-down & full gate
- **Date:** 2026-10-21
- **Branch:** `refactor/20261021-hub-grid-decomposition`
- **Base commit:** `b29b235`
- **Head commit:** see Checkpoint below

## Result

**VERIFIED — executed by the primary** (user-approved deviation from the
subagent flow after three consecutive subagent sessions were denied shell
access; Phase 4's subagent was denied on its first shell call and changed
nothing).

- `hubGrid.ts` is now a **200-line orchestrator** (spec target ≤200; base 773).
  It owns `HubGridDeps`, the object lists, input wiring (`wireSwipeGestures`),
  viewport classification, and the build/destroy lifecycle; every other
  concern delegates to `src/game/hub/` modules.
- New module `src/game/hub/gridBuilder.ts` (324 lines): `destroyWideGrid`,
  `destroyPageGrid`, `buildWideGrid`, `buildPageGrid`, `createPageDots`,
  `rerenderStickerShelf`, and `flipTo` (the page-flip slide mechanics moved
  here from the orchestrator — gridBuilder already imports pageBoard and
  hubPaging, so no new dependencies and no import cycle; it operates on the
  grid via the type-only `HubGrid` import).
- `stickerShelf.ts` gained `createShelfSticker(grid, …)` / `drawEmptySlot(grid, …)`
  (object creation moved from the orchestrator; the sticker/slot lists and the
  entrance counter stay on `HubGrid`).
- `HubScene.ts` imports only `../game/hubGrid` (line 9) — untouched this phase.
- **No new tests were required**: all 2,429 existing tests pass with their
  assertions intact — the strongest possible behavior-preservation proof.

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| static | `pnpm check` | 0 | 244 files; only the 2 pre-existing findings (biome.json schema info; musicalMemoryScene noNonNullAssertion) |
| static | `pnpm typecheck` | 0 | `tsc --noEmit` clean |
| unit | `pnpm test -- --run --maxWorkers=2` | 0 | 116 files / 2,429 tests |
| coverage | `pnpm test:coverage -- --maxWorkers=2` | 0 | S 97.88 / B 91.52 / F 96.42 / L 98.67 — all above gates 90/85/88/95 |
| build | `pnpm build` | 0 | vite build green |
| artifact | `node scripts/validate-bundle.js` | 0 | shell ≤ 200 kB gate holds |
| smoke | `node scripts/validate-pwa.js` | 0 | all PWA checks pass |

**Note on `--maxWorkers=2`:** three full-suite runs on the default pool hit
5,000 ms test timeouts in different, unrelated files each time
(hubEngagement.test.ts, takeAwayLogic.test.ts — both pass in isolation and in
the capped run). The capped run is stable and was used for the gate; this is
machine-load flakiness, not a code regression. The same files passed in every
uncapped full run earlier in the track.

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| AC-2 | hubGrid.ts ≤ 200 lines; public surface preserved; HubScene imports only hubGrid | 200-line count; all 2,429 tests green unchanged; HubScene.ts:9 | Satisfied |
| AC-4 | Full verify_phase gate passes | Commands table above, all exit 0 | Satisfied |

## Deviations

- **Primary execution instead of a subagent** — user-approved after three
  consecutive subagent shell-denial sessions (Phases 2, 3 lost shell
  mid-phase; Phase 4's subagent was denied before any change). The phase
  contract, Touches, and verification were followed unchanged.
- **`flipTo` moved to `gridBuilder.ts`** rather than staying inline-condensed:
  the slide mechanics are paging-concern logic and gridBuilder already imports
  every dependency they need; this achieved the ≤200 target without deleting
  behavior or thinning the module boundary.

## Notes

- Coverage for the two new extraction points: `gridBuilder.ts` 94.35 / 96.42 /
  84.61 / 94.59; `hubGrid.ts` 95.06 / 80.95 / 90.9 / 97.26 (project gates are
  global and hold at 97.88 / 91.52 / 96.42 / 98.67).
- FR-3 cleanup ledger across the track (final): named constants
  (BOB_SETTLE_DELAY, PAGE_DOT_COLOR), dead-code removals (2), comment-accuracy
  edits (~10), renames confined to moved code. No timing dedup was applied —
  no visually-indistinguishable timing pairs were found beyond the ones
  already shared through the constants module.
