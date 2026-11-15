# Phase 1 — The grid, the commands and the ladder, as pure logic

- Track: 20261115-robot-path
- Phase: 1
- Date: 2026-11-15
- Branch: `feat/20261115-robot-path`
- Base / Head: `f2f602a0` / `26a05551`
- Result: verified
- Mode: E3 (the primary implemented; no code subagent in this host)

## Commands

| Layer | Command | Exit | Summary |
|---|---|---|---|
| static | `pnpm check` | 0 | Biome: 325 files, no fixes applied |
| static | `pnpm typecheck` | 0 | `tsc --noEmit` plus the e2e project |
| unit | `pnpm test -- --run` | 0 | 148 files, 3,226 tests passed (22 of them new) |
| coverage | `pnpm test:coverage` | 0 | 97.38 / 92.22 / 96.39 / 98.32 project-wide; `src/game` 97.78 / 94.71 / 98.4 / 98.3 |
| build-artifact | `pnpm build` | 0 | shell entry `index-D-3OKLR6.js` = 179.4 kB |
| build-artifact | `node scripts/validate-bundle.js` | 0 | entry 179.4 kB ≤ 200 kB, vendor chunk isolated |
| build-artifact | `node scripts/validate-pwa.js` | 0 | 16/16, 59 precache entries / 1776.92 KiB |
| documents | `node scripts/validate-docs.js` | 0 | 5/5 |

Chain run as one background job; final line `GATE EXIT: 0`.

### Gate attempts

| Run | Stopped at | Cause | Fix |
|---|---|---|---|
| 1 | `pnpm check` | three formatting diffs in the new module and suite | `biome check --write`, committed as `f8e7d57b` |
| 2 | `pnpm typecheck` | seven `string[]` fixtures not assignable to `readonly Direction[]` | annotated the fixtures, committed as `ee92d58b` |
| 3 | `validate-docs` | the one new test file moved the derived suite truth to 148 / 3,226 | refreshed three count lines (deviation 1) |
| 4 | — | — | **exit 0**, the run recorded above |

Runs 1 and 2 were hygiene in the new files, not behaviour; run 3 was the
standing docs-count dependency recorded below.

## Acceptance

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| AC-1 | Stepping is exact and the ghost path equals the visited prefix | `robotPathLogic.test.ts` — "walks the documented tiles and arrives" asserts all five visited tiles and the final tile; "draws a ghost trail identical to the route it would take" | pass |
| AC-2 | Illegal commands never reach the strip | "refuses a step off the board or into a rock" (both refused), "closes the strip at six commands" (sixth accepted, seventh refused) | pass |
| AC-3 | Removing a slot removes its successors and shortens the trail | "removes a command and every command after it" — `removeFrom(…, 2)` yields two commands and the ghost trail drops from five tiles to three | pass |
| FR-2 | 3×3 board, bottom-row start, star never under the robot | "starts on the bottom row and never parks the star under the robot" over 20 seeds | pass |
| FR-3 | Four absolute directions, one tile each | "steps one tile per direction and knows the edges"; "offers four commands in compass order" | pass |
| FR-4 | Placement refused off-board, at a rock, at the cap | same as AC-2 | pass |
| FR-5 | Prefix removal | same as AC-3 | pass |
| FR-6 | Ghost trail is presentation only and equals the route | "draws a ghost trail identical to the route it would take"; the module has no movement side effect | pass |
| FR-10 | Hint from the second stopped run only | "offers the first solution command only from the second stopped run" (0 → null, 1 → null, 2 → first) | pass |
| NFR-6 | New module fully exercised | 22 tests over 40 seeds for the ladder alone; project coverage above the 95/88/85/90 gate | pass |

The ladder itself: "serves six rounds in easy-first band order" (1,1,2,2,3,3),
"keeps every round inside its own step range and rock count" over 40 seeds,
"builds every round from a walk, so its solution is playable" (every solution
command passes `canPlace` and the replay reaches the star), "keeps rocks off the
route", "replays the same rounds for the same seed and differs across seeds",
"still returns legal rounds when the generator is degenerate" (`() => 0` and
`() => 0.999999`, which exercise the bounded retry plus the deterministic
fallback generator).

## Evidence

- `src/game/robotPathLogic.ts` — `Direction`, `GRID_SIZE`, `MAX_COMMANDS`,
  `DIRECTIONS`, `step`/`samePoint`/`isOnBoard`/`isRock`, `runProgram`,
  `ghostPath`, `canPlace`, `placeCommand`, `removeFrom`, `firstDeviation`,
  `hintFor`, `isSolved`, `ROUND_SPECS`/`ROUND_COUNT`, `buildRound`,
  `buildPlaythrough`.
- `src/__tests__/game/robotPathLogic.test.ts` — 22 tests over four describes.
- Commits: `301bca16` (module), `5225a575` (suite), `f8e7d57b` (format),
  `ee92d58b` (fixture types), `26a05551` (doc counts + dev-log untrack).

## Deviations

1. **`README.md`, `docs/TDD.md`, `docs/perf-baseline.md` — outside `Touches`.**
   `validate-docs` derives the suite truth from the tree, so adding one test file
   made the gate fail until the stated counts moved 147/3,204 → 148/3,226. Numbers
   only. Phases 3 and 5 add tests, so the same three lines will need the same
   treatment there; Phase 6 refreshes them for the final truth.
2. **`.gitignore` — outside `Touches`.** `.dev-server.log`, a local Vite log, had
   been committed to `master` by an earlier broad `git add -A` (in `e356f9ce`). It
   is now untracked, kept on disk, and ignored, so a future `git add -A` cannot
   re-add it. Disclosed rather than fixed silently.

## Notes

- The strip closes once the program reaches the star (`canPlace` returns false
  while `runProgram(...).reachedStar`). FR-4 lists three refusals and does not
  mention this fourth; the reading is that a program ends at the star (FR-8 says
  leftover commands are ignored), so the strip shows exactly what will run. The
  scene never has to explain dead commands.
- `runProgram` reports a refused step as `refusedAt` instead of throwing: the
  strip cannot hold an illegal command, but a journey or a future edit path may
  hand the module one, and a game scene must not see an exception.
- No adaptive shift is read here (D6): the module takes no `BandShift`, so Phase 3
  cannot accidentally honour the toggle for this game.
