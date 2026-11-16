# Phase 3 — The scene: watch it go wrong, then repair it

- Track: 20261116-fix-it-machine
- Branch: feat/20261116-fix-it-machine
- Base / Head: 56779675 / 6f227043
- Date: 2026-11-16
- Result: verified

## Commands

| Layer | Command | Exit | Summary |
|---|---|---|---|
| static | `pnpm check` | 0 | 336 files, one pre-existing `useImportType` warning on `RobotPathScene.ts:1` |
| static | `pnpm typecheck` | 0 | clean |
| unit | `pnpm test -- --run` | 0 | 153 files / 3,300 tests (3,281 before this phase; 16 scene and 3 bridge cases added) |
| coverage | `pnpm test:coverage` | 0 | 97.07 % statements / 90.73 % branches / 96.18 % functions / 98.24 % lines |
| build-artifact | `pnpm build && validate-bundle && validate-pwa` | 0 | entry `index-D_-FZk06.js` 182.6 kB ≤ 200 kB, 49 chunks, 61 precache entries |
| documents | `node scripts/validate-docs.js` | 0 | 5 passed, 0 failed |

Full log: `.conductor/evidence/20261116-fix-it-machine/phase-3-gate.log` — **GATE EXIT: 0**.

## Acceptance

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| FR-2, FR-5, FR-7, NFR-1 | 112 px Go, 96 px cards with 12 px gaps, 96 px tray, a goal that keeps its own space | "renders the back button, six dots, five cards, three tray slots and Go", "lays the goal, machine, tape, tray and Go out without overlaps" (five cards span 528 px; goal box ends above the tape; machine clears Go) | pass |
| FR-5, FR-6 | Go plays the tape one card at a time with the machine working | "plays one card every 550 ms and shows the machine working" (delays 550 / 1100 / 1650, `machine_working`) | pass |
| FR-5, FR-8 | Input is locked during the run | "ignores a tap while the tape is playing" | pass |
| FR-6, FR-10 | The wrong card produces the funny result with no penalty and the round does not advance | "stops at the wrong card without advancing, keeping the tape and the round" (round index 0, tape byte-identical, one gentle tone), "rings the wrong card so the child can see where the run stopped" | pass |
| FR-8, FR-9 | Tapping the wrong card opens the tray; other cards bounce; a wrong tool keeps the tape | "opens the tray on the wrong card with the round's three candidates", "bounces a card that is not the wrong one and records the miss", "bounces a wrong tool and keeps the tape as it was" | pass |
| FR-9, FR-13 | The right candidate repairs in place and the next run solves | "solves a repaired tape, fills the dot and moves to the next round" (tape equals the program, one correct record, round advances, tray shut) | pass |
| FR-11 | Hints at 2, 4 and 6 missed taps, visual only | "hints at two, four and six missed taps without placing a card" (levels 0 → 1 → 2 → 3, tape untouched, tray stays shut) | pass |
| FR-12, FR-13 | Six rounds, progress dots, completion | "plays five rounds clean, one after the other, without a miss" plus `completedRounds` 5 and a sixth round still queued; the sixth solve's sticker path is Phase 4's (see deviations) | pass |
| FR-15 | The bridge publishes the round, tape, bug, counters and points | `e2eBridge.fixItMachine()` + "publishes the round, the tape and every tap point for a journey" and the three bridge cases in `e2eBridge.test.ts` | pass |
| FR-17 | Governed documents state the current suite and build truth | `README.md:49`, `docs/TDD.md` §10.2/§10.3, `docs/perf-baseline.md` header, tables and live entry hash restated | pass |

## Evidence

- `src/scenes/FixItMachineScene.ts`, 16 scene cases in `src/__tests__/scenes/fixItMachineScene.test.ts`, 3 new bridge cases.
- `.conductor/evidence/20261116-fix-it-machine/phase-3-gate.log` — the phase's full gate run (exit 0).

## Deviations

1. **`sceneRegistry.ts` is not touched in this phase.** `sceneLoaders` and `GAME_REGISTRY` are asserted to be the same key set in both directions (`gameRegistry.test.ts:340`), so a 24th loader cannot land before the registry row that Phase 4 owns. Phase 3's `Touches` list names `sceneRegistry.ts`; the loader moves to Phase 4 with its row, and `sceneRegistry.test.ts` (not in Phase 4's Touches) will need its 23 → 24 literals then.
2. **`GameId` keeps no `"fix-it-machine"` member yet, so `gameId()` casts.** Adding the member early would make every `Record<GameId, …>` table incomplete and fail typecheck by design. The cast is commented and is the one place Phase 4 deletes.
3. **The completion path is proven to round five, not six.** `completeGame` calls `hasSticker(gameId)`, which reads `stickers[gameId].earned` and throws for an id that does not exist yet; the scene suite therefore stops one round short and states why in a comment. The sixth solve, the sticker and the return to the Hub are covered by Phase 4's roster/id work and Phase 5's journey.
4. **The live entry hash moved** from `index-9iYt2XVh.js` (182.5 kB) to `index-D_-FZk06.js` (182.6 kB) because the bridge's new `fixItMachine()` hook is shell code; `docs/perf-baseline.md`'s live header and current-build table carry the new figure, the precache total 1794.60 KiB.

## Notes

- **Not visually inspected.** The gate proves the scene's structure, its calls into the rules and its timings through the Phaser mock; nobody has looked at a rendered workshop, and the mock never rasterizes `Graphics`. Spacing, contrast of the mismatch ring and the 550 ms cadence's feel are review/browser territory — Phase 5's journey is the first place this scene runs for real.
- A stopped run does **not** lock the input: the funny result is not a penalty, so the child can tap the wrong card the moment the machine shrugs.
- The tray never offers the tool that was just proved wrong, so every candidate is a real choice; a wrong candidate bounces and counts one missed tap toward the hints.
- The mismatch ring is cleared the moment the tape is redrawn, including on repair, so a repaired round never carries the previous run's verdict.
