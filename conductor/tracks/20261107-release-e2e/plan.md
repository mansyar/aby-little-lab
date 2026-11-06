# Browser Journey Suite - Implementation Plan

> **Branch:** `chore/20261107-release-e2e`
> **Base:** `master` @ `4bcb38a1aac84340a99fa1c34bf3550ee716baf7`
>
> Phase states are `pending`, `in_progress`, `verified`, `failed`, or `blocked`.
> Only the primary agent writes this file. Phase subagents report results and the
> primary records them.

## Phase 1: The read-only bridge

- **Goal:** With `?e2e=1` the page exposes a bridge reporting the active scene, profile and sticker counts, and the current round; without the parameter nothing changes and the shell stays inside its bundle gate.
- **Depends on:** none
- **Covers:** FR-1, NFR-1, AC-1
- **Touches:** `src/game/e2eBridge.ts`, `src/main.ts`, `src/scenes/GameSceneBase.ts`, `src/scenes/ShapeSorterScene.ts`, `src/scenes/AddItUpScene.ts`, `src/scenes/MemoryMatchScene.ts`, `src/scenes/StoryOrderScene.ts`, `src/scenes/AnimalTraceScene.ts`, `src/scenes/FirstSoundsScene.ts`, `src/__tests__/game/e2eBridge.test.ts`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** in_progress

- [ ] **P1.T1: Build the bridge module** - covers: FR-1
  - [ ] **P1.T1.1:** Create `src/game/e2eBridge.ts` with an `initE2EBridge(game)` entry point that returns early unless `location.search` contains `e2e=1`
  - [ ] **P1.T1.2:** Expose `activeSceneKey()`, `profileCount()`, `stickerCount()`, `roundIndex()` and `roundGeometry()` as read-only functions over the live game
  - [ ] **P1.T1.3:** Register the bridge from `src/main.ts` by capturing the `Phaser.Game` instance instead of discarding it
- [ ] **P1.T2: Publish round geometry for the six sampled scenes** - covers: FR-1
  - [ ] **P1.T2.1:** Add a protected overridable geometry hook to `GameSceneBase` returning `null` by default
  - [ ] **P1.T2.2:** Override it in the six sampled scenes, reporting correct target ids and canvas coordinates per round
- [ ] **P1.T3: Prove the gate and the budget** - covers: NFR-1, AC-1
  - [ ] **P1.T3.1:** Unit-test the bridge gating: no bridge without the parameter, bridge with it, and no behaviour change in either case
  - [ ] **P1.T3.2:** Record the shell size from `validate-bundle` against the 200 kB gate

## Phase 2: Harness and CI wiring

- **Goal:** `pnpm test:e2e` boots the built artifact in Chromium and passes a boot-to-hub journey against `vite preview`.
- **Depends on:** Phase 1
- **Covers:** FR-9, NFR-2, NFR-4, NFR-5, AC-9
- **Touches:** `package.json`, `pnpm-workspace.yaml`, `playwright.config.ts`, `e2e/`, `tsconfig.json`, `biome.json`, `.github/workflows/ci.yml`
- **Verification:** `pnpm test:e2e` then the full chain
- **Status:** pending

- [ ] **P2.T1: Add the runner and its configuration** - covers: FR-9
  - [ ] **P2.T1.1:** Add `@playwright/test` at a pinned version; keep `playwright-core` if `validate-boot.js` still needs it
  - [ ] **P2.T1.2:** Write `playwright.config.ts`: Chromium only, `webServer` running `vite preview --port 4173 --strictPort` against `dist`, trace on first retry, two retries in CI and zero locally
- [ ] **P2.T2: Make the e2e code a first-class citizen** - covers: NFR-4, NFR-5
  - [ ] **P2.T2.1:** Add `e2e/tsconfig.json` and extend `pnpm typecheck` to cover it, without breaking the vitest include
  - [ ] **P2.T2.2:** Add `e2e/**/*.ts` to the Biome include list
  - [ ] **P2.T2.3:** Add a `test:e2e` script and confirm `pnpm test` does not collect e2e specs
- [ ] **P2.T3: Wire CI** - covers: FR-9, NFR-2
  - [ ] **P2.T3.1:** Add an `e2e` job that builds, installs Chromium, runs the suite, and uploads traces on failure
  - [ ] **P2.T3.2:** Confirm the job reports in a pull request and record its runtime
- [ ] **P2.T4: Smoke journey** - covers: FR-9
  - [ ] **P2.T4.1:** Boot journey: canvas present, active scene reports `Hub`, no console errors

## Phase 3: Launch and round journeys

- **Goal:** One journey proves all 22 games launch and return; six journeys each advance three rounds through real pointer input.
- **Depends on:** Phase 2
- **Covers:** FR-2, FR-3, FR-4, AC-2, AC-3, AC-4
- **Touches:** `e2e/journeys/`, `e2e/fixtures/`
- **Verification:** `pnpm test:e2e` then the full chain
- **Status:** pending

- [ ] **P3.T1: Launch and return, all 22 games** - covers: FR-2, AC-2
  - [ ] **P3.T1.1:** Shared helper that taps a hub tile by its registry order, waits for the scene key, and returns via back navigation
  - [ ] **P3.T1.2:** Loop the registry so a 23rd game added later fails the journey until the helper is updated
- [ ] **P3.T2: Drag and gesture journeys** - covers: FR-3, AC-3
  - [ ] **P3.T2.1:** Shape Sorter: three rounds, dragging each target onto its slot by bridge coordinates
  - [ ] **P3.T2.2:** Animal Trace: three rounds following the trace path
- [ ] **P3.T3: Discrete-choice journeys** - covers: FR-3, AC-3
  - [ ] **P3.T3.1:** Add It Up: three rounds of tap choice
  - [ ] **P3.T3.2:** First Sounds: three rounds of literacy taps
  - [ ] **P3.T3.3:** Memory Match: three rounds of reveal and match
  - [ ] **P3.T3.4:** Story Order: three rounds of sequencing
- [ ] **P3.T4: Completion and sticker** - covers: FR-4, AC-4
  - [ ] **P3.T4.1:** Play one game to completion and assert the sticker count increments and the hub returns

## Phase 4: Shell journeys

- **Goal:** The parental gate, settings persistence, the time-limit lock and offline relaunch each have a passing journey.
- **Depends on:** Phase 3
- **Covers:** FR-5, FR-6, FR-7, FR-8, AC-5, AC-6, AC-7, AC-8
- **Touches:** `e2e/journeys/`, `e2e/fixtures/`
- **Verification:** `pnpm test:e2e` then the full chain
- **Status:** pending

- [ ] **P4.T1: Parental gate and settings** - covers: FR-5, FR-6, AC-5, AC-6
  - [ ] **P4.T1.1:** Three-second hold opens settings; one-second press does not
  - [ ] **P4.T1.2:** Toggle a setting, reload, assert it persisted
- [ ] **P4.T2: Time-limit lock** - covers: FR-7, AC-7
  - [ ] **P4.T2.1:** Seed a profile at its daily cap and assert the nudge appears and no transition occurs
- [ ] **P4.T3: Offline relaunch** - covers: FR-8, AC-8
  - [ ] **P4.T3.1:** Wait for the service worker to control the page, go offline, reload, and launch one game

## Phase 5: Proof and determinism

- **Goal:** The suite is shown to catch a real regression and to pass ten consecutive runs without retries.
- **Depends on:** Phase 4
- **Covers:** FR-10, NFR-3, AC-10
- **Touches:** `e2e/`, `conductor/tracks/20261107-release-e2e/verification/`
- **Verification:** full chain plus ten consecutive `pnpm test:e2e` runs
- **Status:** pending

- [ ] **P5.T1: Mutation proof** - covers: FR-10, AC-10
  - [ ] **P5.T1.1:** Break one tile's hit area, run the suite, capture the failing journey and its output
  - [ ] **P5.T1.2:** Revert, confirm green, and confirm no probe survives in any commit
- [ ] **P5.T2: Determinism** - covers: NFR-3
  - [ ] **P5.T2.1:** Ten consecutive local runs with retries disabled, all green; record the runtimes
- [ ] **P5.T3: Document the layer** - covers: NFR-2
  - [ ] **P5.T3.1:** Record the runtime budget, the retry policy, and how to run one journey locally
