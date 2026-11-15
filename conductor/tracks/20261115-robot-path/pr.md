# Robot Path: the 23rd game, plus review round 1's fixes

Track `20261115-robot-path` ships Robot Path as the app's 23rd game, and carries the two
review rounds that closed its findings. Branch `feat/20261115-robot-path`, based on
`master @ f2f602a0`.

## What ships

**Robot Path (PRD §3.23, group "thinking").** A 3x3 board of 112 px tiles with the robot on
a bottom tile and a star somewhere the walk can reach. The child builds a program out of
four absolute command tiles (up, right, down, left) in a six-slot strip, then presses Go;
the robot walks one tile every 450 ms, so a six-command run is bounded at 2.7 s. There is
no failure state: a run that leaves the board, enters the rock or misses the star stops
where it went wrong, keeps every command, and the child repairs the strip by tapping the
slot they want to change, which truncates the program to a prefix. The hint arrives only
after two stopped runs in the same round, and only as a pulse on the first solution
arrow, never as a placed command.

- **Fixed ladder, no adaptive band.** Six rounds, 2 to 6 commands; Robot Path is the one
  game with no adaptive dimension, which is why the adaptive roster stays fifteen plus
  seven dimension-adaptive and the roster is 23 tiles in 10 + 10 + 3 pages
  (`hubPaging`, `hubGroups`, and the 6 + 6 + 6 + 5 report are all asserted).
- **New modules.** `src/game/robotPathLogic.ts` (`DIRECTIONS`, `canPlace`, `removeFrom`,
  `runProgram`, `firstDeviation`, `hintFor`, `ROUND_SPECS`, `buildPlaythrough`),
  `src/game/robotPathArt.ts` (six robot and prop drawings, scene-local preloaded), and
  `src/scenes/RobotPathScene.ts`.
- **Shell and bridge.** Two SVGs (`tile_robot_path`, `sticker_robot_path`) take the shell
  from 58 to 60 keys and the app from 191 to 193; the read-only `?e2e=1` bridge gains the
  `robotPath` hook so a browser journey can drive a canvas-only UI.
- **Journey.** `e2e/journeys/robot-path.spec.ts` solves round 0, stops one command short,
  repairs rounds 1 and 2, asserts the three dots and leaves through the back control.

## Phase 7: review round 1's fixes

Round 1 found two Medium issues; both are closed by behaviour and by measured numbers, not
by wording alone.

1. **The hint is capped once per round (FR-10).** `hintFor` returned an answer for every
   stop from the second, so a third and fourth stopped run re-pulsed the arrow. The scene
   now carries `hintOffered`, cleared where a round is built (`renderRound`,
   `clearRoundContent`), and pulses only while it is false. A new scene test covers stops
   one, two and three, and identifies the pulse by its palette target because the
   stopped-run wiggle also tweens two objects with `repeat: 2`. With the guard removed the
   test fails (`expected 2 to be 1`); with it in place it passes. The existing two-stop
   assertion and the journey are unchanged.
2. **The journey and suite counts were stale.** `docs/TDD.md` said 22 journeys across 17
   spec files, and one note said 21; `docs/perf-baseline.md` repeated 22/17. The tree holds
   **18 spec files** and the suite runs **23 journeys**. Both documents now state 23 across
   18, the perf header's live figures match this build, and the suite truth is
   **150 files / 3,255 tests** at 97.24 / 91.61 / 96.3 / 98.31 across README, TDD and the
   baseline. Because the scene changed, the build's own artefacts moved too and are restated
   (entry `index-9iYt2XVh.js`, 61 precache entries at 1794.50 KiB).
3. **Plan P6.T1 wording.** The task called Robot Path one of "the fixed-difficulty seven",
   which 15 + 7 + 1 = 23 cannot hold. It now names Robot Path as the one game no adaptive
   dimension reaches. Phase 6's status, checkpoint and verification record are untouched;
   `git diff b0d19844..HEAD -- plan.md` shows that single line plus the Phase 7 block.
4. **`conductor/tech-stack.md` (R1-7, a logged call).** The file's current-state bullets
   were wrong about the tree and now say 26 scenes (Boot, Preload, Hub, 23 game scenes) and
   a 23-journey budget measured this round (4.6 min; `launch-all` 2.9 min). The dated
   `2026-10-27` design-update notes keep their "22 lazy game-scene JS chunks" wording on
   purpose: they record what the prewarm engine did when it shipped, and rewriting a dated
   log to today's numbers would make it false. The reasoning is in
   `verification/phase-7.md` and the track's decisions log.

## Verification

Both review rounds ran the same chain themselves on the committed tree rather than trusting
the phase reports:

```
pnpm test:e2e && pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage \
  && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js \
  && node scripts/validate-docs.js
```

| Run | Result |
|---|---|
| Phase 7 (`.conductor/evidence/phase-7/gate.log`) | **exit 0** |
| Review round 2, at `03cf3714` (`.conductor/evidence/review-r2/gate.log`) | **exit 0** |
| `pnpm test:e2e` | 23 journeys passed in 4.6 min, `launch-all` alone 2.9 min, 18 spec files |
| `pnpm check` | 330 files, 0 errors, 1 pre-existing warning (see debt) |
| `pnpm test -- --run` | 150 files / 3,255 tests |
| `pnpm test:coverage` | 97.24 % statements / 91.61 % branches / 96.3 % functions / 98.31 % lines |
| `pnpm build` + `validate-bundle` | entry `index-9iYt2XVh.js` = 182.5 kB of the 200 kB gate (186.85 kB as Vite prints it, 47.59 kB gzip), 49 chunks |
| `validate-pwa` | all checks pass; 49 chunks / 49 precached; 61 precache entries (1794.50 KiB) |
| `validate-docs` | 5 passed, 0 failed |

Phase 1-7 each have their own `verification/phase-<n>.md` and a checkpoint; the plan is
7/7 phases verified and 20/20 tasks checked. `review.md` carries both rounds: R1 at
`b0d19844` and R2 at `03cf3714`, verdict **PASS**, with metadata
`review_verdict: pass`, `review_rounds: 2`.

No test was weakened, skipped or deleted. Phase 7's test diff is 31 insertions and 0
deletions; the branch-wide count moved 3,248 -> 3,255 tests and 22 -> 23 journeys, and every
removed assertion on the branch is a roster count or name restated to 23.

## Debt this PR carries, on purpose

- **R1-1 (Low), plan `Touches` under-declaration.** The phases' `Touches` lists are
  narrower than the branch's diff: 19 files outside their union are forced by the roster
  invariants the suites enforce (registry row, scene registry, shell art groups, prewarm,
  audio identity, tile SVG, and eleven suites whose counts are restated), and Phase 7 also
  refreshed `README.md`'s suite snapshot because the docs validator governs it. Every
  instance is disclosed in its phase record; the fix is a state-file pass, not code.
- **R1-4 (Low), no facing turn.** FR-7's "turns to face the direction it moves" is not
  implemented, because the walk pose is symmetric and there is no facing to turn. Direction
  is carried by the strip arrows and the ghost trail; closing it needs directional art,
  which is a design decision the spec's D7 did not take.
- **R1-5 (Low), the `.dev-server.log` cleanup.** Commit `26a05551` deleted a tracked local
  dev-server log and added it to `.gitignore`. That is a sensible cleanup, but it rode
  inside a suite-count commit and is outside every phase's `Touches`; it is disclosed here
  rather than in code.
- **Notes.** `robotPathLogic.ts`'s `fallbackRng` body (lines 262-265) is the new logic
  module's only uncovered code - the degenerate-generator test exercises the retry loop,
  not the final fallback. `RobotPathScene.ts:1`'s `import Phaser` could be
  `import type Phaser`; that warning predates the track and does not fail `pnpm check`. The
  perf baseline's live header quotes the shell entry's content hash, so it needs a docs
  touch whenever the build changes.

## How to review this

The behaviour worth checking by hand is the loop: place a command, watch the ghost trail
redraw, press Go on a program that misses, and confirm every command survives, the offending
arrow pulses and the run does not advance; then confirm the hint appears only after the
second stopped run in that round and does not appear again on a third.
