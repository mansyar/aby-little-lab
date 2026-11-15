# Phase 5 — The bridge and the browser journey

- Track: 20261115-robot-path
- Phase: 5
- Date: 2026-11-16
- Branch: `feat/20261115-robot-path`
- Base / Head: `f2f602a0` / `f96c923e`
- Result: verified
- Mode: E3 (the primary implemented; no code subagent in this host)

## Commands

Verification command, copied verbatim from `plan.md` for Phase 5 and run as one
chained job:

```
pnpm test:e2e && pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js
```

| Layer | Command | Exit | Summary |
|---|---|---|---|
| browser journeys | `pnpm test:e2e` | 0 | 23 passed in 4.6 m, including the new `robot-path` journey and `launch-all` at 23 launches (2.9 m) |
| static | `pnpm check` | 0 | Biome: 330 files, no fixes applied; the one warning is the pre-existing `useImportType` note on `RobotPathScene`'s Phaser import |
| static | `pnpm typecheck` | 0 | `tsc --noEmit` plus the e2e project |
| unit | `pnpm test -- --run` | 0 | 150 files, 3,254 tests passed |
| coverage | `pnpm test:coverage` | 0 | 97.24 / 91.56 / 96.3 / 98.31 project-wide |
| build-artifact | `pnpm build` | 0 | shell entry `index-Cq96urFU.js` = 182.5 kB |
| build-artifact | `node scripts/validate-bundle.js` | 0 | entry 182.5 kB ≤ 200 kB, Phaser chunk `phaser-B_vcVLyb.js` = 1335.0 kB |
| build-artifact | `node scripts/validate-pwa.js` | 0 | 16/16, 49 chunks / 49 precached, 61 precache entries / 1794.41 KiB |
| documents | `node scripts/validate-docs.js` | 0 | 5/5 |

Chain exit code: **0** (final log line `GATE EXIT: 0`).

Four full gate runs happened before this one was accepted, and every one of them
was on a different tree:

1. First run: the whole chain reached `pnpm check`, which rejected two files —
   an unsorted import in `e2eBridge.ts` and one line the formatter would have
   wrapped differently in `robot-path.spec.ts`. Both are Biome `--write` fixes.
2. Second run: `pnpm test:e2e` passed all 23 journeys, `pnpm check` and then
   `pnpm typecheck` failed on `e2e/journeys/robot-path.spec.ts(100,27):
   'repaired' is possibly 'null'` — the spec read `repaired.go` directly after
   the formatting fix.
3. Third run: every code layer passed, and `validate-docs` failed: the six new
   unit tests moved the derived suite truth to 150 files / 3,254 tests while
   README, TDD §10.2/§10.3 and the perf baseline still said 3,248.
4. Fourth run (recorded above): the chain passes end to end on the accepted
   tree.

## Acceptance

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| FR-16 | The bridge publishes round, solution, commands, palette, slots, Go, robot, star, runs and solved; read live, only behind `?e2e=1` | `e2eBridge.ts` `E2ERobotPathState` / `E2ERobotPathPalette` / `E2ERobotPathSlot`, `e2eRobotPath?()` in the probe shape, `robotPath()` on the installed bridge; `RobotPathScene.e2eRobotPath()` copies its own state per call; `e2eBridge.test.ts` "returns null when the active scene publishes no robot-path hook", "returns null when no scene is active", "reflects a placement immediately, without caching the board" | pass |
| FR-16 (hook) | The hook is absent without `?e2e=1` | the gate suite's "installs nothing without the query parameter" and "installs a frozen object for ?e2e=1" (whose key list now includes `robotPath`) | pass |
| AC-8 (T2) | A journey programs the robot, sees a stopped run keep its program, repairs it in place, and completes three rounds | `e2e/journeys/robot-path.spec.ts` passes in 26 s: round 0 solved from the published palette, rounds 1–2 stopped one command short and repaired, three dots filled, back control returns to the Hub, no console errors | pass |
| AC-8 (T3) | The suite's roster literals cover 23 games | `launch-all.spec.ts` `EXPECTED_GAME_COUNT = 23` plus its two messages, `hub-groups.spec.ts` "and draws all 23 games", `insights.spec.ts` "2 of 23 games"; the full 23-launch journey passes | pass |
| NFR-5 | The bridge stays read-only and costs the shipped artifact nothing meaningful | every accessor copies live state, there is no setter or cache; the shell entry moves 182.4 → 182.5 kB, still under the 200 kB budget | pass |
| AC-10 | No assertion was deleted, skipped or weakened to make a check pass | the three new bridge tests and three new scene tests are additions; the only single-line change inside an existing test file outside them is the frozen-key list gaining `robotPath` | pass |

## Deviations a reviewer should disposition

1. **The Go button was not tappable, and Phase 5 found it.** `buildGo` set a
   custom hit area of `Rectangle(-GO_HIT/2, -GO_HIT/2, GO_HIT, GO_HIT)` on a
   96 px display of a 512 px texture. Phaser measures a custom hit area in
   *unscaled* frame pixels, so that rectangle sat above and left of the art and
   a tap on the visible play triangle reached nothing — the first journey run
   programmed three arrows, pressed Go and saw `runs: 0` forever. The button now
   uses the frame's default hit area at `setDisplaySize(GO_HIT, GO_HIT)`, i.e.
   exactly the 112×112 FR-7/NFR-1 asks for. The mock-based Phase 3 tests could
   not see this: they invoke handlers directly, never Phaser's hit test.
2. **Three SVG-independent scene fields were added for the hook**: `star` (kept
   so the bridge can publish its centre) plus `runs` / `solvedThisRound`
   counters reset in `buildRoundContent` and `clearRoundContent`. They are the
   FR-16 fields and nothing else reads them.
3. **Documentation counts were refreshed** (README line 49, TDD §10.2 and §10.3,
   perf baseline "Test suite" row): 3,248 → 3,254 tests, file count unchanged at
   150, all four numbers taken from the run above. Per the track's doc-drift
   rule nothing else in those documents was touched — README's "all 22 launches"
   sentence, the PRD prose and the adaptive claim remain Phase 6's work.
4. **`e2e/fixtures/game.ts` gained two readers**, `robotPathState` and
   `waitForRobotPathRound`, alongside the existing per-game fixtures; the
   journey waits on published state rather than a duration.
5. **`pnpm check` reports one warning**, `src/scenes/RobotPathScene.ts:1:8
   useImportType` for `import Phaser from "phaser"`. It predates this phase (the
   import is Phase 3's and the phase-4 gate passed with it); Biome counts it as a
   warning, not one of the errors that fail the check.

## Evidence

- `src/game/e2eBridge.ts` — the state types, the probe field, the installed
  `robotPath()` accessor (returns null in any scene that publishes no hook).
- `src/scenes/RobotPathScene.ts` — `e2eRobotPath()`; `palettePoint()` derived
  from the same `BOARD_CENTER_X` / `PALETTE_STEP` the palette is drawn with;
  slot centres from `slotRects`; `runs` / `solvedThisRound` advanced in `run()`;
  the repaired Go hit area.
- `src/__tests__/game/e2eBridge.test.ts` — three new cases plus the frozen-key
  list.
- `src/__tests__/scenes/robotPathScene.test.ts` — three new cases: the whole
  published board (palette 332/452/572/692 at y 560, slots 252…772, Go 920/676,
  star and robot on their tiles), a placement reflected immediately and cleared
  by the next round, and a stopped run reported as `runs: 1`, `solved: false`
  with the program intact.
- `e2e/journeys/robot-path.spec.ts` — the journey described above.
- `e2e/journeys/{launch-all,hub-groups,insights}.spec.ts` — the roster literals.
- `README.md`, `docs/TDD.md`, `docs/perf-baseline.md` — the refreshed counts.
