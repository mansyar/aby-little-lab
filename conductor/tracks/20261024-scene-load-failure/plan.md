# Scene Load Failure Path — Implementation Plan

> **Branch:** `fix/20261024-scene-load-failure`
> **Base:** `master` @ `7a7c8e0`
>
> Phase states are `pending`, `in_progress`, `verified`, `failed`, or `blocked`.
> Only the primary agent writes this file. Phase subagents report results and the
> primary records them.

## Phase 1: A load that can fail, and a tap that charges nothing

- **Goal:** A failed scene load is retried once and reported as a failure without
  charging a play session or a game play, and the Hub's navigation lock is
  released.
- **Depends on:** none
- **Covers:** FR-1, FR-4, AC-1, AC-4
- **Touches:** `src/scenes/sceneRegistry.ts`, `src/scenes/HubScene.ts`,
  `src/__tests__/scenes/sceneRegistry.test.ts`,
  `src/__tests__/scenes/hubSceneLoad.test.ts`,
  `src/__tests__/scenes/hubPlayTime.test.ts`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified

- [x] **P1.T1: A loader wrapper that retries once and never rejects** - covers: FR-1
  - [x] **P1.T1.1:** Add `loadSceneWithRetry(scene, key, loaders = sceneLoaders, attempts = 2)`
    to `sceneRegistry.ts`, next to the existing `ensureSceneLoaded` (which keeps
    its current throwing contract for direct callers). It attempts the load,
    retries once on failure, logs one `console.warn` per failed attempt naming
    the scene key, and resolves to `true`/`false` — it must never reject.
    Treat a synchronous throw from a loader the same as a rejection.
  - [x] **P1.T1.2:** Extend `sceneRegistry.test.ts` with a resolving loader
    (called once, `true`, no warn), a loader that rejects then resolves (called
    twice, `true`, one warn), and a loader that always rejects (called twice,
    `false`, two warns). Use an injected loader map, never a real import.
- [x] **P1.T2: The Hub charges only for a game that opens** - covers: FR-4
  - [x] **P1.T2.1:** Reorder `HubScene.activateTile`: keep the audio unlock at
    tap time, then delegate to a private `openGame(tileIndex)` that awaits
    `loadSceneWithRetry(...)`; only after it resolves `true` does it start the
    play session, call `recordGamePlay`, and run the existing nudge-or-transition
    branch. On `false` it clears `grid.navLocked` and returns (Phase 2 adds the
    cue). `showPlayTimeNudge` therefore moves behind the successful load; keep
    its `onLaunch` pointing at the transition, not at a second load.
  - [x] **P1.T2.2:** New `hubSceneLoad.test.ts` proving a failing loader leaves
    `usedMinutes` unchanged, calls neither `startPlaySession` nor
    `recordGamePlay`, shows no nudge, and leaves `navLocked` false; plus the
    mirror case where the first attempt fails and the second succeeds — exactly
    one session and one game record, and the game opens.
  - [x] **P1.T2.3:** Re-run the existing Hub suites and keep every expectation
    that is still correct. Tests that asserted the nudge or the session
    synchronously after a tap now need the load promise to settle first; record
    any expectation you change in the phase evidence with its reason.

**Result:** verified
**Checkpoint:** 6847990
**Evidence:** conductor/tracks/20261024-scene-load-failure/verification/phase-1.md
**Note:** five further test files changed (the shared harness double and four
`vi.mock(".../sceneRegistry")` factories) because `HubScene` now imports
`loadSceneWithRetry`; accepted and itemised in the phase evidence.

## Phase 2: A retry cue that keeps the Hub alive

- **Goal:** A load that fails twice shows a textless retry cue over the tapped
  tile, the rest of the Hub keeps working, and tapping the cue opens the game
  once the load succeeds.
- **Depends on:** Phase 1
- **Covers:** FR-2, FR-3, FR-5, FR-6, AC-2, AC-3, AC-5, AC-6
- **Touches:** `src/components/GameLoadCue.ts`, `src/game/hubGrid.ts`,
  `src/game/hub/gridBuilder.ts`, `src/scenes/HubScene.ts`,
  `src/__tests__/components/GameLoadCue.test.ts`,
  `src/__tests__/game/hubGrid.test.ts`,
  `src/__tests__/scenes/hubSceneLoad.test.ts`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified

- [x] **P2.T1: The retry cue** - covers: FR-2
  - [x] **P2.T1.1:** Add `src/components/GameLoadCue.ts` modelled on
    `PlayTimeNudge`'s shape (scene-plus-callback factory, `active` flag,
    `destroy()` that detaches every handler and the `shutdown` hook). It draws a
    textless circular-arrow glyph with a ring around the tapped tile, sized so
    its interactive area is at least 96x96 px, sits above the tiles and below the
    parent surfaces, and does nothing when already active (one cue at a time).
    Respect `isReducedMotion()` for the pulse: static ring, no animation loop.
  - [x] **P2.T1.2:** `GameLoadCue.test.ts` — colour and depth constants, one
    instance under repeated `show()`, callback fires on pointerup, `destroy()` is
    idempotent and removes the shutdown hook, reduced motion skips the tween.
- [x] **P2.T2: Wiring, lifetime and the unlock** - covers: FR-3, FR-6
  - [x] **P2.T2.1:** `HubScene` owns one cue instance. On a failed load it shows
    the cue anchored to the tapped tile with a callback that re-enters
    `openGame(tileIndex)`; a successful retry destroys the cue before
    `transitionToScene`. Opening Settings or the profile chip destroys it, and the
    scene's `shutdown` destroys it. Clear `grid.navLocked` on failure so other
    tiles stay live (add a small method to `HubGrid` if reaching into the field
    from the scene reads poorly).
  - [x] **P2.T2.2:** Guard a resolution that arrives after shutdown: no
    transition, no cue, no throw (`NFR-6`).
  - [x] **P2.T2.3:** Extend `hubSceneLoad.test.ts` for `AC-2` (cue visible, a
    second tile reaches `activateTile`), `AC-3` (cue tap with a now-resolving
    loader destroys the cue and starts the transition), `AC-5` (one warn per
    failed attempt, zero storage writes) and `AC-6` (two failing taps do not
    stack cues; shutdown mid-flight is inert). Assert behaviour, not listener
    counts.
  - [x] **P2.T2.4 (rework 1):** `openGame` consults `this.timeUp` before any side
    effect, so a cue that outlives the moment the cap is reached cannot retry
    into a game: it hides the cue, releases the lock and returns uncharged.

**Result:** verified
**Checkpoint:** 3749da6
**Evidence:** conductor/tracks/20261024-scene-load-failure/verification/phase-2.md
**Note:** this phase's `Touches` were widened by two files before it ran
(`src/game/hub/gridBuilder.ts`, `src/__tests__/game/hubGrid.test.ts`) because
the cue must anchor on the tapped tile and the grid is the only place that
rectangle lives.

## Phase 3: The documents say what the Hub does

- **Goal:** The PRD, the TDD and the roadmap describe the failure path as
  shipped, and the roadmap's Known Issue for it is retired.
- **Depends on:** Phase 2
- **Covers:** NFR-1, NFR-2, NFR-3, NFR-4, NFR-5, NFR-6 (documented evidence)
- **Touches:** `docs/PRD.md`, `docs/TDD.md`, `docs/roadmap.md`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** in_progress

- [ ] **P3.T1: PRD and TDD** - covers: NFR-5
  - [ ] **P3.T1.1:** `docs/PRD.md` gains the failure-path rule where the Hub's
    launch behaviour is described: one silent retry, then a textless retry cue
    while the Hub stays usable, and no play time charged for a game that does not
    open.
  - [ ] **P3.T1.2:** `docs/TDD.md` documents the retry policy, the loader seam,
    the ordering rule (side effects only after a resolved load), the cue's
    lifetime, and the post-shutdown guard — in the module table and the section
    that describes scene loading.
- [ ] **P3.T2: Roadmap and the ledger** - covers: NFR-5
  - [ ] **P3.T2.1:** Remove the "A failed game-chunk load leaves the child with no
    feedback" Known Issue and only that entry, and remove the matching Future
    Work item ("Give a failed chunk load a visible failure path"), since this
    track delivers it. Leave the rest of the file's content intact; while there,
    fix the mis-numbered Future Work list (it reads 1, 2, 5, 6, 3, 4, 5) so the
    survivors number 1..6 in order.
  - [ ] **P3.T2.2:** `node scripts/validate-docs.js` reports 5 passed, 0 failed.
