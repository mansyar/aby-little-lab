# Phase 3 — The scene: build a program, then run it

- Track: 20261115-robot-path
- Phase: 3
- Date: 2026-11-15
- Branch: `feat/20261115-robot-path`
- Base / Head: `f2f602a0` / `c4197970`
- Result: verified
- Mode: E3 (the primary implemented; no code subagent in this host)

## Commands

Verification command, copied verbatim from `plan.md` for Phase 3 and run as one
chained job:

```
pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js
```

| Layer | Command | Exit | Summary |
|---|---|---|---|
| static | `pnpm check` | 0 | Biome: 329 files, no fixes applied |
| static | `pnpm typecheck` | 0 | `tsc --noEmit` plus the e2e project |
| unit | `pnpm test -- --run` | 0 | 150 files, 3,245 tests passed (12 of them new) |
| coverage | `pnpm test:coverage` | 0 | 97.22 / 91.73 / 96.27 / 98.3 project-wide |
| build-artifact | `pnpm build` | 0 | shell entry `index-D-3OKLR6.js` = 179.4 kB |
| build-artifact | `node scripts/validate-bundle.js` | 0 | entry 179.4 kB ≤ 200 kB, vendor chunk isolated |
| build-artifact | `node scripts/validate-pwa.js` | 0 | 16/16, 47 chunks, 59 precache entries / 1776.92 KiB |
| documents | `node scripts/validate-docs.js` | 0 | 5/5 |

Chain exit code: **0** (final log line `GATE EXIT: 0`).

Two full gate runs happened in this turn. The first passed (exit 0) on the tree
whose board used 8px tile gaps; reading FR-2 while writing this evidence showed
the spec asks for **12px** gaps, so the geometry was corrected and the whole
chain was run again from the top. The row above is that second, final run — the
tree being accepted. Nothing was re-run against a tree that had already changed.

## Acceptance

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| FR-2 | 3×3 board of 112px tiles, 12px gaps, star and rocks drawn, robot on a bottom-row start | `buildRoundContent` draws nine tiles on a 124px pitch with the goal tile tinted, then the rocks and star from the round, then the robot at `round.start`; the start row is `GRID_SIZE - 1` from Phase 1's `buildRound` | pass |
| FR-4 | Illegal and seventh commands refused at placement, palette nudges | "refuses an arrow that would leave the board and nudges instead" (commands stay empty, a `yoyo`+`repeat` nudge tween fires); the cap is `canPlace`'s `MAX_COMMANDS` check, imported rather than re-implemented | pass |
| FR-5 | Tapping a filled slot truncates the program to a prefix | "removes a tapped slot and every command after it" (3 → 1 through `removeFrom`, the third slot's arrow released) | pass |
| FR-6 | Ghost trail redrawn on every placement or removal | "appends a tapped arrow and draws the trail" asserts a `Graphics.fillCircle` trail through `ghostPath`; `redrawTrail` runs at the end of both `place` and `removeAt` | pass |
| FR-7 | 450 ms per step with the slot highlighted and the robot hopping; input locked for the run | `run` schedules one `delayedCall` per visited tile at `STEP_MS * i`, calls `highlightSlot(i)` then `moveRobotTo(tile)`; "ignores arrow taps while a run is executing" and the solve test assert the `running` flag is set for the walk and cleared after | pass |
| FR-8 | Reaching the star resolves the round through the shared chime, dot and advance | "solves a round by running the program and advances": `roundIndex` 0 → 1, `completedRounds` 1, `AudioManager.playCorrect`, `createCompletionSplash`; the advance delay itself is `ChoiceRoundScene`'s | pass |
| FR-9 | A stopped run keeps every command, records one wrong answer, does not advance, pulses the arrow that left the route | "keeps every command after a stopped run and stays on the round": `roundIndex` unchanged, commands preserved, `playIncorrect`, robot returned to its start tile; `onWrong` pulses `slotRects[firstDeviation]` | pass |
| FR-10 | Second stopped run offers exactly one hint pulse, never auto-placed | "hints the first solution arrow only after the second stopped run": `stoppedRuns` 1 → no hint tween; 2 → one tween with `repeat: 2` over the palette rect and its glyph; `place` is never called by the hint path | pass |
| FR-11 | Empty Go records nothing, re-speaks the rule, nudges | "re-speaks the rule on an empty Go and records no run": `speakSentence(RULE)`, no `playIncorrect`, round unchanged, input not locked | pass |
| FR-12 | One result per finished run | both resolve paths go through `resolveWholeRound(true/false)` exactly once per run; no per-arrow reporting exists in the scene | pass |
| FR-13 | One spoken rule line via `createSpokenInstruction`, silent when SFX is off | "shows and speaks the rule once, with no other text on screen" asserts the only text objects are `← Back` and the rule, and one `speakSentence(RULE, sfxEnabled)` | pass |
| NFR-1 | Touch targets at least 96px | palette 112px, strip 96px, Go hit area 112px (`GO_HIT`) | pass |
| NFR-5 | Reduced motion shortens the hop but keeps the highlight | `moveRobotTo` and `highlightSlot` both route through `motionDuration(...)`; no test asserts the reduced branch directly | pass (by construction) |
| AC-4 | Input locked during a run, solved rounds advance, stopped runs keep commands, record one wrong and do not advance | the four tests named under FR-7/FR-8/FR-9 above | pass |
| AC-5 | Two stopped runs give exactly one hint pulse, never auto-placed | the FR-10 test above | pass |

## Evidence

- `src/scenes/RobotPathScene.ts` — `RobotPathScene extends ChoiceRoundScene`.
  Chrome built once in `create` (four palette arrows, six strip slots, Go);
  board/star/rocks/robot/trail rebuilt per round through
  `buildRoundContent`/`clearRoundContent` on the base's `trackRoundObject`. All
  rules come from `robotPathLogic`: `canPlace`, `removeFrom`, `ghostPath`,
  `runProgram`, `firstDeviation`, `hintFor`, `buildPlaythrough`, `MAX_COMMANDS`,
  `ROUND_COUNT`.
- `src/__tests__/scenes/robotPathScene.test.ts` — 12 tests across two describes
  over the shared Phaser mock (`shell` 4, `interactions` 8).
- Commits: `65419b18` (scene), `b1f28c3c` (scene suite + doc counts),
  `c4197970` (12px tile gaps).
- Docs refreshed from real runs: `README.md` 3,245 tests / 150 files;
  `docs/TDD.md` the same plus statements 97.22 %, branches 91.73 %,
  functions 96.27 %, lines 98.3 %; `docs/perf-baseline.md` 150 / 3,245.

## Deviations

1. **`src/scenes/sceneRegistry.ts` was in Phase 3's `Touches` but is not in this
   phase's diff.** A `RobotPath` loader without a registry row is refused by two
   invariants that assert `sceneLoaders` and `GAME_REGISTRY.sceneKey` are the
   same set in both directions (`sceneRegistry.test.ts`, `gameRegistry.test.ts`),
   and the registry row (plus `tile_robot_path`/`sticker_robot_path`) is Phase 4's
   `P4.T1`. Adding the loader here would have required Phase 4 work early or a
   weakened assertion, so the loader moves to Phase 4 with the row it mirrors.
   Phase 4's `Touches` list does not name `sceneRegistry.ts` or
   `sceneRegistry.test.ts`; both are needed when the row lands.
2. **`GameId` keeps no `"robot-path"` member yet, so `gameId()` casts.** FR-1
   gives the union member to Phase 4 along with the registry row; adding it early
   cascades into `gameRegistry.ts`'s per-id tables and fails typecheck by design
   (`Property '"robot-path"' is missing … Record<"robot-path", true>`). The cast is
   commented and is the one place Phase 4 must delete.
3. **`README.md`, `docs/TDD.md`, `docs/perf-baseline.md` — outside `Touches`.**
   The suite grew by one file and 12 tests, so the derived counts moved
   149/3,233 → 150/3,245 and the stated coverage percentages were restated from a
   real `pnpm test:coverage`. Numbers only, consistent with the Phase 1 and 2
   precedent.
4. **`src/game/robotPathLogic.ts` run lock is scene-local.** `run()` gates taps
   through a new `running` flag rather than the base's `inputLocked`, because
   `ChoiceRoundScene.resolveWholeRound` refuses to fire while `inputLocked` is
   set — the first gate failure of this phase ("solves a round … expected 0 to be
   1") was exactly that. No base file changed.

## Notes

- **Not visually inspected.** The gate proves the scene's structure, its calls
  into the rules and its timings through the Phaser mock; nobody has looked at a
  rendered board, and the mock never rasterizes `Graphics`. Board spacing,
  contrast of the dotted trail and the hop's feel are review/browser territory
  (Phase 5's journey is the first place this scene runs for real).
- **The walk pose is not directional.** FR-7 says the robot turns to face its
  travel; the six Phase 2 drawings hold one hop pose and the scene does not
  rotate it, so direction is carried by the arrows in the strip and the trail,
  not by the robot's facing. Flagged rather than claimed.
- **The stopped run has no wiggle.** `wiggleTargets()` returns `[]` for a
  whole-round answer, so `reactWrong` presents its tone and calls
  `onWiggleComplete` immediately; the visible failure cue is the puzzled texture
  plus the pulsing offending slot. FR-9's "puzzled bob" reads as the texture
  swap.
- The hint tween is a palette pulse with `repeat: 2`, roughly 1.3 s, so it fades
  out on its own before a new round can inherit it; a round change also resets
  every palette and slot alpha/scale in `clearRoundContent`.
