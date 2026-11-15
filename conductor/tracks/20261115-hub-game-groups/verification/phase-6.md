# Phase 6 — Review fixes (round 1)

- Track: 20261115-hub-game-groups
- Branch: feat/20261115-hub-game-groups
- Base / Head: `703b12ad` / `9bce0dec`
- Date: 2026-11-15
- Result: verified

## Commands

| Layer | Command | Exit | Summary |
|---|---|---|---|
| browser | `pnpm test:e2e` | 0 | 22 Playwright journeys passed (3.9m) |
| static | `pnpm check` | 0 | Biome: 323 files checked, no fixes applied |
| static | `pnpm typecheck` | 0 | `tsc --noEmit` plus the e2e project |
| unit | `pnpm test -- --run` | 0 | 147 files, 3,204 tests passed |
| coverage | `pnpm test:coverage` | 0 | statements 97.42 / branches 92.11 / functions 96.46 / lines 98.36, above 90/85/88/95 |
| build-artifact | `pnpm build` | 0 | built; shell entry `index-D-3OKLR6.js` = 179.4 kB |
| build-artifact | `node scripts/validate-bundle.js` | 0 | Phaser vendor chunk isolated; shell entry 179.4 kB ≤ 200 kB |
| build-artifact | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed; precache 59 entries / 1776.92 KiB |
| documents | `node scripts/validate-docs.js` | 0 | 5 passed, 0 failed |

Run as one chain in this turn as a background job (the Playwright suite alone is
close to four minutes); the chain's final exit was 0, logged as `GATE EXIT: 0`.
The first attempt stopped only at `validate-docs`, which the one-test count
refresh fixed; every earlier layer passed on both attempts.

## Findings fixed

| ID | Severity | What changed |
|---|---|---|
| R1-F1 | Medium | `HubGrid.setGroup` now reports the selection to `onSelectGroup` *before* the no-op guard. Tapping the chip that is already selected speaks the group's name (FR-8, AC-5) while the board is rebuilt only on a real change, so a double tap still cannot redraw it twice. |
| R1-F2 | Low | `HubGrid.refreshChips()` removed — it had no caller in `src/` or the suites, and `ensureGroupChips()` already repaints on every build. |

## Acceptance

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| AC-5 | A chip tap calls `speakSentence` with the group's spoken name and the current SFX setting; with SFX off it is silent | `hubScene.test.ts` — "speaks the selected group's name with the live SFX flag" and the new "re-speaks the group when its own chip is tapped again" (one call, "Numbers and counting", true) | pass |
| FR-8 | Tapping a chip speaks that group's spoken name, All included | the same two tests; `groupChips.test.ts` — "re-selecting the current chip speaks again but rebuilds nothing" asserts `onSelectGroup("all")` with no board rebuild | pass |

## Evidence

- `src/game/hubGrid.ts` — `setGroup` order changed; `refreshChips` deleted.
- `src/__tests__/game/hub/groupChips.test.ts` — the Phase 2 re-selection test
  restated from "changes nothing" to "speaks again but rebuilds nothing", with
  the reason in the comment. No assertion was dropped: it still checks the board
  is not rebuilt (`onBoardChange` not called, selection unchanged) and now also
  checks the announcement.
- `src/__tests__/scenes/hubScene.test.ts` — new test for the second tap; the
  speech mock and the other HubScene assertions are unchanged.
- One test added and one restated (3,203 → 3,204).

## Deviations

- **`README.md`, `docs/TDD.md`, `docs/perf-baseline.md` — outside this phase's
  `Touches`.** `validate-docs.js` derives the suite truth from the tree, so the
  one new test required refreshing three stated counts (3,203 → 3,204). Numbers
  only.

## Notes

`run_file_change_hooks` reported that file-change hooks are not supported in this
environment; the phase gate covers the same ground.

The restated test is a behaviour change mandated by FR-8, not a loosened
assertion: the old test encoded "a re-tap is silent", which the spec does not
say, and the new one asserts both halves of the intended behaviour (speaks, does
not redraw).
