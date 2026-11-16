# Fix-It Machine — Implementation Plan

> **Branch:** `feat/20261116-fix-it-machine`
> **Base:** `master` @ `56779675`
> **Autonomy:** ready
> **Decisions:** D1, D2, D3, D4, D5, D6, D7, D8, D9, D10, D11, D12
> **Effort:** 4

## Phase 1: The workshop's rules, as pure logic

- **Goal:** `fixItMachineLogic` exposes the six actions and their three families, the six toys, the six fixed round specs, a seeded generator that always produces exactly one substitution bug at a valid index, and the diagnosis, tray, hint and solve rules — all testable without Phaser.
- **Depends on:** none
- **Covers:** FR-2, FR-3, FR-4, FR-8, FR-9, FR-11, FR-12
- **Touches:** `src/game/fixItMachineLogic.ts`, `src/__tests__/game/fixItMachineLogic.test.ts`, `README.md`, `docs/TDD.md`, `docs/perf-baseline.md`
- **Dependencies:** none
- **Decisions:** D2, D3, D4, D6, D9, D11
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified

- [x] **P1.T1: Six actions, three families, six toys** — covers: FR-2, FR-4
  - [x] `ACTION_ICONS` with `spray`/`pour` (liquid), `paint`/`polish` (coat), `lift`/`stack` (move), each pair differing by silhouette; `TOYS` for the six rounds; `ACTIONS_BY_FAMILY`; a test asserting every family has exactly two members and every icon belongs to one.
- [x] **P1.T2: The six-round ladder and the one-bug generator** — covers: FR-3, FR-12
  - [x] `ROUND_SPECS` for card counts 3, 3, 4, 4, 5, 5 and bands `different`, `different`, `related`, `related`, `same-family`, `same-family`; `buildRound` seeded through the shared `Rng` seam; tests asserting exactly one differing card, a substitution (same position, different action), never index 0, no repeated icon in the correct program, and the same seed dealing the same round.
- [x] **P1.T3: Diagnosis, tray, hint level and solve** — covers: FR-8, FR-9, FR-11
  - [x] `isWrongCard`, `trayCandidates` (correct action plus two band distractors, seeded order), `hintLevelFor(wrongTaps)` returning 1 at 2, 2 at 4, 3 at 6 and 0 below 2, `isSolved`; tests for the wrong-card no-op, a distractor never equalling the correct action, and each level's boundary.
- [x] **P1.T4: Restate the suite and journey counts** — covers: FR-17
  - [x] The new test file changes the governed counts, so `README.md`, `docs/TDD.md` §10.2/§10.3 and `docs/perf-baseline.md` (live header, both tables) state the counts this phase's run measures (D9).

**Result:** PASS — gate exit 0 (151 files / 3,270 tests, coverage 97.24/91.64/96.33/98.32, entry 182.5 kB, docs 5/5).
**Checkpoint:** b80ea550
**Evidence:** conductor/tracks/20261116-fix-it-machine/verification/phase-1.md

## Phase 2: Six tools, four faces and six toys, in the game's own chunk

- **Goal:** the workshop's art exists as sixteen SVGs behind one scene-local module, each within the size budget, with the pairs distinguishable by silhouette.
- **Depends on:** Phase 1
- **Covers:** FR-14, NFR-3
- **Touches:** `src/game/fixItMachineArt.ts`, `src/assets/svg/machine/`, `src/__tests__/game/fixItMachineArt.test.ts`, `README.md`, `docs/TDD.md`, `docs/perf-baseline.md`
- **Dependencies:** none
- **Decisions:** D7, D9
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified

- [x] **P2.T1: Six tool icons** — covers: FR-14, NFR-3
  - [x] One flat Storybook-Flat SVG per action at 512 viewBox under 4 kB, each a tool in use rather than a symbol, with the same-family pair visibly different in outline (mister vs can, brush vs cloth).
- [x] **P2.T2: Four machine poses and six toy goals** — covers: FR-14
  - [x] `machine_idle`, `machine_working`, `machine_puzzled`, `machine_happy` as one chunky round character, and one goal drawing per toy; every pose shares the same anchor so swapping poses never shifts the character.
- [x] **P2.T3: The art module, its tests and the count restatement** — covers: FR-14, FR-17
  - [x] `fixItMachineArt.ts` exports the key list and the scene-local preload group; tests assert sixteen keys, every referenced file parses and each is under budget; the three governed documents restate this phase's suite counts (D9).

**Result:** PASS — gate exit 0 (152 files / 3,281 tests, coverage 97.24/91.64/96.33/98.32, entry 182.5 kB, docs 5/5).
**Checkpoint:** d0b96881
**Evidence:** conductor/tracks/20261116-fix-it-machine/verification/phase-2.md

## Phase 3: The scene — watch it go wrong, then repair it

- **Goal:** a playable scene that shows the goal, runs the tape card by card, produces the funny wrong result without penalty, lets the child diagnose and repair, and resolves the round.
- **Depends on:** Phase 1, Phase 2
- **Covers:** FR-5, FR-6, FR-7, FR-8, FR-9, FR-10, FR-11, FR-12, FR-13, FR-15, NFR-1, NFR-4, NFR-6, NFR-7
- **Touches:** `src/scenes/FixItMachineScene.ts`, `src/scenes/sceneRegistry.ts`, `src/game/e2eBridge.ts`, `src/__tests__/scenes/fixItMachineScene.test.ts`, `src/__tests__/game/e2eBridge.test.ts`, `README.md`, `docs/TDD.md`, `docs/perf-baseline.md`
- **Dependencies:** none
- **Decisions:** D1, D4, D5, D8, D11, D9
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified

- [x] **P3.T1: Layout — goal, tape, machine, Go, tray** — covers: FR-2, FR-5, FR-7, NFR-1
  - [x] A 112×112 Go, cards at 96×96 with 12 px gaps (five slots span 528 px), a three-candidate tray at 96×96, and a goal picture that stays on screen and never overlaps the tape, tray or Go; a layout test publishes and asserts the geometry.
- [x] **P3.T2: The run, the lock and the funny failure** — covers: FR-5, FR-6, FR-8
  - [x] Go executes at 550 ms per card (120 ms reduced motion) with per-card highlight and the machine's action, locks input for the run, and on the wrong card shows the mismatch, plays the gentle "uh-oh" and restores the tape with the round index unchanged; tests cover the lock, a tap during the run being ignored, and the tape surviving intact.
- [x] **P3.T3: Diagnose, repair, hints and the round flow** — covers: FR-8, FR-9, FR-10, FR-11, FR-12, FR-13
  - [x] Tapping the wrong card opens the tray; tapping another card bounces it; the correct candidate snaps in and the next run solves; each tap records one result and a solve records one win; hints fire at 2, 4 and 6 wrong taps and never place a card; six rounds, progress dots, sticker, celebration and the spoken rule line.
- [x] **P3.T4: The bridge hook, and the count restatement** — covers: FR-15, FR-17
  - [x] `e2eBridge.fixItMachine()` publishes the round, steps, bug index, solved flag, wrong-tap count, hint level, tray state and the drawn tape/tray/Go points; bridge and scene tests cover it; the three governed documents restate the counts (D9).

**Result:** PASS — gate exit 0 (153 files / 3,300 tests, coverage 97.07/90.73/96.18/98.24, entry 182.6 kB, docs 5/5).
**Checkpoint:** 6f227043
**Evidence:** conductor/tracks/20261116-fix-it-machine/verification/phase-3.md

## Phase 4: The 24th game enters the roster

- **Goal:** the game is reachable from the Hub, counted everywhere the suite counts games, and matches the three governed lists.
- **Depends on:** Phase 3
- **Covers:** FR-1, FR-14, FR-16, FR-17
- **Touches:** `src/types/index.ts`, `src/game/gameRegistry.ts`, `src/scenes/PreloadScene.ts`, `src/assets/svg/ui/tiles/tile_fix_it_machine.svg`, `src/assets/svg/stickers/sticker_fix_it_machine.svg`, `src/game/audioIdentity.ts`, `src/game/hub/artGroups.ts`, `src/game/hub/prewarm.ts`, `src/utils/textureTiers.ts`, `README.md`, `docs/PRD.md`, `docs/TDD.md`, `docs/perf-baseline.md`, `src/__tests__/gameRegistry.test.ts`, `src/__tests__/game/hubGroups.test.ts`, `src/__tests__/game/hubTiles.test.ts`, `src/__tests__/game/hubPaging.test.ts`, `src/__tests__/game/hubGrid.test.ts`, `src/__tests__/game/audioIdentity.test.ts`, `src/__tests__/game/art/`, `src/__tests__/scenes/preloadScene.test.ts`, `src/__tests__/utils/textureTiers.test.ts`, `src/__tests__/game/hub/prewarm.test.ts`, `src/__tests__/game/insightsSummary.test.ts`, `src/__tests__/game/progressLogic.test.ts`, `src/__tests__/components/`
- **Dependencies:** none
- **Decisions:** D1, D7, D10, D12
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified

- [x] **P4.T1: The registry row, the id and the three lists** — covers: FR-1, FR-17
  - [x] The 24th entry appended after `robot-path` exactly as FR-1 says, `GameId` extended so the coverage proof still compiles, and the README list, PRD §3.24 heading and TDD §4.5 row added in the same commit (D10), so the four lists stay the same length.
- [x] **P4.T2: The Hub tile, the sticker and the shell counts** — covers: FR-14, FR-16
  - [x] Two shell SVGs, `SHELL_ASSETS` extended to 62 keys, the app count to 195, and the shell-ownership and preload suites restated with the new keys named.
- [x] **P4.T3: Grid, paging, groups and progress at 24** — covers: FR-16
  - [x] Rows become 6/6/6/6, phones page as 10 + 10 + 4, `thinking` holds 8, the report pages 6 + 6 + 6 + 6, and every count-bearing test asserts the new numbers rather than dropping its assertion (D12).
- [x] **P4.T4: Audio identity, art groups and prewarm** — covers: FR-14, FR-16
  - [x] An `audioIdentity` entry for `fix-it-machine` and its table test, the game's art keys added to `ART_GROUPS_BY_GAME` and `ART_KEYS_BY_GAME`, with the resolver-parity and prewarm tests green.

## Phase 5: The bridge proves it in a browser

- **Goal:** a journey drives the game end to end — diagnose, repair, solve — and the roster journeys know there are 24 games.
- **Depends on:** Phase 4
- **Covers:** FR-15, FR-16
- **Touches:** `e2e/fixtures/game.ts`, `e2e/journeys/fix-it-machine.spec.ts`, `e2e/journeys/launch-all.spec.ts`, `e2e/journeys/hub-groups.spec.ts`, `e2e/journeys/insights.spec.ts`
- **Dependencies:** none
- **Decisions:** D4, D11
- **Verification:** `pnpm test:e2e && pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified

- [x] **P5.T1: The Fix-It Machine journey** — covers: FR-15
  - [x] Through the published bridge only: launch the game, read the tape and the bug index, tap Go and see the round unchanged, tap the wrong card, choose the correct candidate, tap Go, assert the round advances and the dots fill; repeat for three rounds and leave through the back control.
- [x] **P5.T2: The roster literals** — covers: FR-16
  - [x] `EXPECTED_GAME_COUNT`, the hub-groups step text and the insights line move from 23 to 24, with no step removed.
- [x] **P5.T3: The suite green with the new journey** — covers: FR-16
  - [x] The full browser suite passes with 24 journeys across 19 spec files, `launch-all` covering the 24 launches inside its budget.

## Phase 6: Documents say 24, and say what debugging is

- **Goal:** the living documents describe the 24th game, the debugging concept it teaches, and the current measured figures; `validate-docs` passes 5/5.
- **Depends on:** Phase 5
- **Covers:** FR-17
- **Touches:** `README.md`, `docs/PRD.md`, `docs/TDD.md`, `docs/perf-baseline.md`, `conductor/product.md`, `conductor/product-guidelines.md`
- **Dependencies:** none
- **Decisions:** D10, D12
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** pending

- [ ] **P6.T1: The PRD section for game 24** — covers: FR-17
  - [ ] PRD §3.24 states the mechanic, the six-round ladder, the repair loop and why the bug is a substitution; §2.2, §4.1 and §7 lists carry 24 and the `thinking` group carries 8.
- [ ] **P6.T2: The TDD record** — covers: FR-17
  - [ ] §2.2/§2.3, §3.3/§3.6, §4.1/§4.5, §7.3/§7.5 and §10.5 describe the scene, the logic module, the bridge hook, the counts and the journey suite as they now are.
- [ ] **P6.T3: Product record and baseline** — covers: FR-17
  - [ ] `conductor/product.md` gains the game's row, the cross-game notes it now touches (roster, groups, progress rows, shell keys, spoken rules) and a changelog entry; `product-guidelines.md` gains the debug-and-repair interaction pattern; the perf baseline gains the measured build-and-suite section.
- [ ] **P6.T4: Validator and integrated gate** — covers: FR-17
  - [ ] `node scripts/validate-docs.js` passes 5/5 on the final text and the full chain exits 0 on the committed tree.
