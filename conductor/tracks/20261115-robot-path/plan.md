# Robot Path — Implementation Plan

> **Branch:** `feat/20261115-robot-path`
> **Base:** `master` @ `f2f602a0`
> **Autonomy:** ready
> **Decisions:** D1–D12
> **Effort:** 4

Phases are ordered so every gate stays green at every checkpoint. The pure logic
and the art land before anything references them, the scene lands before the
registry can launch it, and the roster grows in one phase that restates every
count-bearing suite in the same commit — a registrar-only change would turn the
hub, paging, progress and shell suites red halfway through the track.

The roster phase also carries the three document rows the validator derives from
`GAME_REGISTRY` (README list item, PRD heading, TDD §4.5 row), because
`validate-docs` compares those lists to the registry on every gate; the prose
around them is Phase 6's job.

## Phase 1: The grid, the commands and the ladder, as pure logic

- **Goal:** a Phaser-free module can answer "where does this program take the
  robot, which commands are legal, what does the ghost trail look like, and what
  are the six rounds?" — deterministically, from an injected `Rng`.
- **Depends on:** none
- **Covers:** FR-2, FR-3, FR-4, FR-5, FR-6, FR-10, NFR-6, AC-1, AC-2, AC-3
- **Touches:** `src/game/robotPathLogic.ts`, `src/__tests__/game/robotPathLogic.test.ts`
- **Dependencies:** none
- **Decisions:** D1, D2, D3, D4, D5, D11
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified

- [x] **P1.T1: Model the board and the four commands** — covers: FR-2, FR-3, AC-1
  - [x] `GRID_SIZE = 3`, `Direction = "up" | "right" | "down" | "left"`, `GridPoint`, `step`, `isOnBoard`, `isBlocked` (rocks), and `runProgram(start, commands, rocks)` returning the visited tiles, the final tile and whether the star was reached, with the first refused step reported rather than thrown.
  - [x] `canPlace(start, commands, rocks, direction, capacity)` — the placement rule: on-board, off-rock, and under the six-command cap; `ghostPath` returns the reachable prefix for the dotted trail; `removeFrom(commands, index)` keeps the program a prefix.
- [x] **P1.T2: Build the six-round ladder with seeded variety** — covers: FR-2, D5, AC-1
  - [x] `buildPlaythrough(rng)` returns six rounds with the ladder in D5 — straight (2–3 steps) twice, one corner (3–4) twice, rock detour (4–5), two corners (5–6) — drawing start corner, star and rocks inside each band's set from `rng`.
  - [x] `solutionFor(round)` returns the intended route as `Direction[]`, and `hintFor(round, stoppedRuns)` exposes the first solution command only from the second stopped run; both are asserted to be placeable on an empty strip.
- [x] **P1.T3: Prove the logic** — covers: AC-1, AC-2, AC-3, NFR-6
  - [x] Tests: a known four-command program lands on the documented tile and the ghost path equals its visited prefix; every round's solution is ≤ 6 commands and reaches the star; off-board, rock and seventh commands are all refused; `removeFrom` truncates and shortens the ghost path; the same seed builds the same six rounds and two seeds differ; the hint appears exactly at the second stopped run and never before.

**Result:** verified — the board, the four absolute commands, the placement
refusals, the prefix strip, the ghost trail and the six-rung ladder all live in
one Phaser-free module, and 22 tests over 40 seeds prove every generated round is
playable; 3,226 tests in 148 files, gate exit 0.
**Checkpoint:** 26a05551
**Evidence:** conductor/tracks/20261115-robot-path/verification/phase-1.md

## Phase 2: Robot and prop art, in the game's own chunk

- **Goal:** six storybook SVGs and one preload function, shaped exactly like
  Story Order's art module, so the game can draw itself without adding a byte to
  the boot shell.
- **Depends on:** none
- **Covers:** FR-14, NFR-3
- **Touches:** `src/game/robotPathArt.ts`, `src/assets/svg/robot/robot_idle.svg`, `src/assets/svg/robot/robot_walk.svg`, `src/assets/svg/robot/robot_puzzled.svg`, `src/assets/svg/robot/robot_go.svg`, `src/assets/svg/robot/robot_rock.svg`, `src/assets/svg/robot/robot_star.svg`, `src/__tests__/game/robotPathArt.test.ts`
- **Dependencies:** none
- **Decisions:** D7, D8
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified

- [x] **P2.T1: Draw the robot, the star and the rock** — covers: FR-14, D7
  - [x] Six flat SVGs at a 512 viewBox with the 4–6px `#2D3748` outline and the existing palette: `robot_idle` (rounded body, two eyes, antenna), `robot_walk` (the same silhouette mid-hop, one arm up), `robot_puzzled` (head tilt, a drawn question mark made of shapes), `robot_go` (a chunky play triangle), `robot_rock` (three-lobed grey rock), `robot_star` (five-point star in the success green's warm neighbour).
  - [x] No gradients, no shadows, no text, and every shape readable at 96px for a three-year-old.
- [x] **P2.T2: Load them lazily and pin the shape** — covers: FR-14, NFR-3
  - [x] `src/game/robotPathArt.ts`: `?raw` imports, a `ROBOT_PATH_ASSETS` table in key order, and `preloadRobotPathArt(scene)` registering each at `textureSizeFor(key)` through `toDataUri`, mirroring `storyOrderArt.ts`.
  - [x] `robotPathArt.test.ts`: the six keys are exactly the documented set, every key resolves to the card tier, `preloadRobotPathArt` queues six `svg` loads at 256, and `PreloadScene` does not import the module (the shell stays free of the markup), copying the guard Story Order already has.

**Result:** verified — six flat `robot_*` SVGs load through the game's own
`preloadRobotPathArt`, so the art rides the lazy chunk while the boot shell stays
byte-identical at 179.4 kB and the precache at 59 entries; 3,233 tests in 149
files, gate exit 0 on the first run.
**Checkpoint:** 1898f5cc
**Evidence:** conductor/tracks/20261115-robot-path/verification/phase-2.md

## Phase 3: The scene — build a program, then run it

- **Goal:** the loop a child actually plays: tap arrows into the strip with a
  ghost trail following, press Go, watch the robot obey, and repair a stopped run
  in place.
- **Depends on:** Phase 1, Phase 2
- **Covers:** FR-4, FR-5, FR-6, FR-7, FR-8, FR-9, FR-10, FR-11, FR-12, FR-13, NFR-1, NFR-4, NFR-5, AC-4, AC-5
- **Touches:** `src/scenes/RobotPathScene.ts`, `src/scenes/sceneRegistry.ts`, `src/__tests__/scenes/robotPathScene.test.ts`
- **Dependencies:** none
- **Decisions:** D3, D4, D9, D10, D11, D12
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified

- [x] **P3.T1: Draw the board, the palette and the strip** — covers: FR-2, FR-4, FR-5, FR-6, NFR-1
  - [x] `RobotPathScene extends ChoiceRoundScene`: `preload` calls `preloadRobotPathArt`; `create` runs the shared entrance, mascot, back button, six progress dots and the spoken rule; the board draws nine tiles with the star, rocks and robot, the palette draws four 112px arrow buttons in `Graphics`, the strip draws six 96px slots, and Go draws `robot_go`.
  - [x] Taps append through `canPlace`, a refused command nudges the palette button, a filled slot truncates through `removeFrom`, and every change redraws the ghost trail from `ghostPath`.
- [x] **P3.T2: Run, resolve and repair the program** — covers: FR-7, FR-8, FR-9, FR-10, FR-11, FR-12, AC-4, AC-5
  - [x] Go steps at 450 ms per command, highlighting the slot and hopping the robot; reaching the star resolves the round through `resolveWholeRound(true)` after the shared delay, and stopping short resolves `false`, keeping the strip and pulsing the first command that left the route.
  - [x] An empty-strip Go re-speaks the rule and nudges, recording nothing; the second stopped run in a round pulses the first solution command once; each finished run records one correct or one wrong answer, and reduced motion shortens the hop while keeping the slot highlight.
- [x] **P3.T3: Prove the scene** — covers: AC-4, AC-5, NFR-5
  - [x] `robotPathScene.test.ts` with the shared Phaser mock: palette taps append and draw the trail, a refused tap adds nothing, a slot tap truncates, a solved run fills a dot and advances, a stopped run keeps every command and records one wrong answer, an empty Go records nothing, two stopped runs give exactly one hint pulse, input is locked during a run, and a scene revisit starts clean at round 1.

**Result:** verified — `RobotPathScene` plays the whole loop: arrows append through
`canPlace` with a ghost trail, a filled slot truncates through `removeFrom`, Go
walks at 450 ms per command and resolves through `resolveWholeRound`, and a
stopped run keeps every command, pulses the arrow that left the route and hints
the first solution command on the second stop. 12 scene tests; 3,245 tests in 150
files; coverage 97.22 / 91.73 / 96.27 / 98.3; shell entry byte-identical at
179.4 kB with the precache at 59 entries; gate exit 0. The `sceneLoaders` entry
moved to Phase 4 with the registry row it must mirror (see evidence).
**Checkpoint:** c4197970
**Evidence:** conductor/tracks/20261115-robot-path/verification/phase-3.md

## Phase 4: The 23rd game enters the roster

- **Goal:** the Hub draws 23 tiles, the game launches from its own tile with its
  own art, and every suite and document that states a roster count states the new
  one — with nothing else changed.
- **Depends on:** Phase 3
- **Covers:** FR-1, FR-15, FR-17 (roster rows only), NFR-3, AC-6, AC-7, AC-10
- **Touches:** `src/types/index.ts`, `src/game/gameRegistry.ts`, `src/assets/svg/ui/tile_robot_path.svg`, `src/assets/svg/stickers/sticker_robot_path.svg`, `src/__tests__/gameRegistry.test.ts`, `src/__tests__/game/hubGroups.test.ts`, `src/__tests__/game/hubTiles.test.ts`, `src/__tests__/game/hubPaging.test.ts`, `src/__tests__/game/hubGrid.test.ts`, `src/__tests__/game/audioIdentity.test.ts`, `src/__tests__/game/hub/prewarm.test.ts`, `src/__tests__/components/SettingsPanel.test.ts`, `src/__tests__/components/settings/ProgressOverlay.test.ts`, `src/__tests__/game/art/groupIntegrity.test.ts`, `src/__tests__/game/art/shellOwnership.test.ts`, `README.md`, `docs/PRD.md`, `docs/TDD.md`
- **Dependencies:** none
- **Decisions:** D12, D7, D8
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** pending

- [ ] **P4.T1: Register the game and ship its two shell assets** — covers: FR-1, FR-15, AC-7
  - [ ] `GameId` gains `"robot-path"`; `GAME_REGISTRY` gains the entry of FR-1 appended after `story-order` (`thinking`, `RobotPath`, `tile_robot_path`, `sticker_robot_path`), leaving the other 22 entries byte-identical.
  - [ ] `tile_robot_path.svg` (a robot head over a trail of two arrow marks, icon tier) and `sticker_robot_path.svg` (the robot beside a star, card tier) join the shell, taking it to 60 keys and the app total to 193.
- [ ] **P4.T2: Restate every count-bearing suite to 23** — covers: AC-6, AC-10
  - [ ] Hub and roster suites: `hubGrid.test.ts` (23 rects/icons/labels, entrance count, page 3 holds 21–23), `hubPaging.test.ts` (3 pages of 10/10/3), `hubTiles.test.ts` (23 unique ids/keys), `gameRegistry.test.ts` (23 invariants), `hubGroups.test.ts` (5/5/7/4/2 with Robot Path named in `thinking`), `audioIdentity.test.ts`, `prewarm.test.ts`.
  - [ ] Adjacent surfaces: `SettingsPanel.test.ts` and `ProgressOverlay.test.ts` page `6+6+6+5`; `groupIntegrity.test.ts` and `shellOwnership.test.ts` assert 60 shell keys and 193 app keys. Every change is a number or a name; no expectation is dropped.
- [ ] **P4.T3: Add the three roster rows the validator compares** — covers: FR-17 (rows), AC-9
  - [ ] README's Mini-Games list gains item 23 `[Robot Path](docs/PRD.md#323-robot-path)`, the PRD gains `### 3.23 Robot Path`, and the TDD §4.5 table gains row 23 naming `RobotPathScene`, in that order and with those names, so `checkGameLists` agrees at 23.

**Result:** PENDING
**Checkpoint:** PENDING
**Evidence:** conductor/tracks/20261115-robot-path/verification/phase-4.md

## Phase 5: The bridge and the browser journey

- **Goal:** a journey can program the robot through the read-only bridge, watch a
  wrong program survive its own failure, repair it, and complete rounds — and the
  suite's roster literals cover 23 games.
- **Depends on:** Phase 4
- **Covers:** FR-16, NFR-5, AC-8
- **Touches:** `src/game/e2eBridge.ts`, `src/scenes/RobotPathScene.ts`, `src/__tests__/game/e2eBridge.test.ts`, `src/__tests__/scenes/robotPathScene.test.ts`, `e2e/fixtures/game.ts`, `e2e/journeys/robot-path.spec.ts`, `e2e/journeys/launch-all.spec.ts`, `e2e/journeys/hub-groups.spec.ts`, `e2e/journeys/insights.spec.ts`
- **Dependencies:** none
- **Decisions:** D9, D5
- **Verification:** `pnpm test:e2e && pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** pending

- [ ] **P5.T1: Publish the game's state** — covers: FR-16, D9
  - [ ] `e2eBridge.ts` gains `E2ERobotPathState` and the `e2eRobotPath?()` probe hook (added to the scene-probe shape and the installed bridge), returning the FR-16 fields read live from the scene.
  - [ ] `RobotPathScene` implements it from its own objects: palette and slot centres, Go, robot and star positions, the command list, the round's solution, the run count and whether the round is solved; unit tests prove the hook is absent without `?e2e=1` and reflects a placement immediately.
- [ ] **P5.T2: Write the journey** — covers: AC-8, FR-7, FR-9
  - [ ] `robot-path.spec.ts`: open the Hub, launch `RobotPath` by registry index, read the round, tap the palette in `solution` order, press Go, and assert the round advances and no console errors appear.
  - [ ] Then a stopped run: press Go one command short, assert the round did **not** advance and every command is still published, add the last command, press Go and solve it in the same round; repeat to three completed rounds and leave through the back control.
- [ ] **P5.T3: Move the roster literals in the suite** — covers: AC-8, AC-10
  - [ ] `launch-all.spec.ts` `EXPECTED_GAME_COUNT` 22 → 23 (the loop itself already follows the registry), its two messages updated, `hub-groups.spec.ts`'s "draws all 22 games" step text, and `insights.spec.ts`'s "2 of 22 games" expectation to 23.

**Result:** PENDING
**Checkpoint:** PENDING
**Evidence:** conductor/tracks/20261115-robot-path/verification/phase-5.md

## Phase 6: Documents say 23, and say what the game teaches

- **Goal:** every document that describes the suite is true again: 23 games, the
  new one described where the others are, the adaptive claim corrected to the
  fifteen games that actually adapt, and the shell and suite counts current.
- **Depends on:** Phase 5
- **Covers:** FR-17, NFR-3, AC-9
- **Touches:** `README.md`, `docs/PRD.md`, `docs/TDD.md`, `docs/perf-baseline.md`, `conductor/product.md`, `conductor/product-guidelines.md`
- **Dependencies:** none
- **Decisions:** D1, D6, D8, D10
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** pending

- [ ] **P6.T1: Describe the game where the others are described** — covers: FR-17
  - [ ] PRD §3.23 gets the two-paragraph description (the mechanic, the ladder, the no-fail repair loop, why absolute arrows), and its "All 22 games adapt" sentence becomes the explicit fifteen, with Robot Path named among the fixed-difficulty seven.
  - [ ] README's product summary, Hub paragraph and lazy-scene sentence move from twenty-two to twenty-three; TDD gains §4.9 "Robot Path" beside the hub-groups section (the command model, the placement rule, the run loop, the bridge shape) and updates its scene/art inventories and shell figures.
- [ ] **P6.T2: Update the product and baseline records** — covers: FR-17, NFR-3
  - [ ] `conductor/product.md`: a §3.1 row 23, the counts in §1 and §3.2, the adaptivity note naming the fixed-difficulty games, and a dated changelog entry for the track; `conductor/product-guidelines.md` gains the plan-then-run interaction pattern in §5.
  - [ ] `docs/perf-baseline.md` gets this track's suite counts, shell entry and chunk figure, all measured from the build rather than estimated.
- [ ] **P6.T3: Prove the documents** — covers: AC-9
  - [ ] `node scripts/validate-docs.js` exits 0 with all five checks, the three game lists and the test-count guard agreeing with the tree; the track's evidence records the exact figures.

**Result:** PENDING
**Checkpoint:** PENDING
**Evidence:** conductor/tracks/20261115-robot-path/verification/phase-6.md
