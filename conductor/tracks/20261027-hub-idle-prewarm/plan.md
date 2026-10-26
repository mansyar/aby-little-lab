# Plan — Hub Idle Chunk Prewarm

**Branch:** `feat/20261027-hub-idle-prewarm`
**Base:** `master` @ `cb5f713a` (merge of PR #71)

Phase states: `pending | in_progress | verified | failed | blocked`.
Only the primary writes this file. Verification is agent-executed and recorded in
the phase result and evidence file — no manual verification meta-task exists.

## Phase 1: Prewarm module with an injected scheduler

- **Goal:** a self-contained prewarm engine under `src/game/hub/` that imports the 22 `sceneLoaders` chunks one at a time in recency-first order through an injected idle scheduler, is idempotent and silent on failure, and is cancellable — proven by seeded unit tests, with no Hub wiring yet.
- **Depends on:** none
- **Covers:** FR-1 (engine half), FR-3, NFR-3, NFR-4, AC-1, AC-2, AC-4
- **Touches:** `src/game/hub/prewarm.ts`, `src/__tests__/game/hub/prewarm.test.ts`, `README.md` (count claim only), `docs/TDD.md` (runner count figures only), `docs/perf-baseline.md` (Test-suite row only)
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** in_progress
- [ ] **P1.T1: Build the prewarm engine** — covers: FR-1, FR-3
  - [ ] **P1.T1.1:** create `src/game/hub/prewarm.ts` — public API takes the ordered loader list (or a re-ordering callback), an injected idle scheduler (requestIdleCallback with timer fallback, defaulted at module level), and returns a controller with `cancel()`. One import in flight at a time; the next is scheduled only after the previous settles. All 22 chunks come from `sceneRegistry.sceneLoaders` — no new loader definitions.
  - [ ] **P1.T1.2:** recency-first ordering helper — takes the active profile's progress map (read at each pacing tick, not cached) plus the Hub grid order; sorts by `lastPlayedAt` descending, never-played games last in grid order. Pure function, unit-tested directly.
  - [ ] **P1.T1.3:** seeded unit tests covering AC-1 (recency order + one-at-a-time pacing through the fake scheduler), AC-2 (cancel() mid-queue stops pending work; a subsequent loader call still succeeds), AC-4 (a rejected import is swallowed — no unhandled rejection, the queue continues or stops cleanly per contract, and the game remains loadable). Use `mulberry32` only if randomness is involved; otherwise plain fixtures.
- [ ] **P1.T2: Keep the count-drift guard green** — covers: NFR-3
  - [ ] **P1.T2.1:** the new test file changes the suite counts — refresh the three living-doc count claims (README current-state line, TDD runner figures, perf-baseline Test-suite row) to the new derived truth in the same phase. Coverage percentages: refresh the dated snapshot only if the denominators move.

<!-- The primary appends after acceptance:
**Result:** verified | failed | blocked
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/<track-id>/verification/phase-1.md
-->

## Phase 2: Hub integration

- **Goal:** HubScene starts the prewarm after its entrance settles, gates it on the play-time lock and tab visibility, yields to taps, and cleans up on shutdown — the engine from Phase 1 running in the real scene with zero kid-visible change.
- **Depends on:** Phase 1
- **Covers:** FR-1 (tap-wins in situ), FR-2, FR-5, NFR-1, AC-3
- **Touches:** `src/scenes/HubScene.ts`, `src/__tests__/scenes/hubScene.test.ts`, `src/__tests__/game/hub/prewarm.test.ts` (integration-level additions if the engine contract needs them), `README.md` / `docs/TDD.md` / `docs/perf-baseline.md` (count claims only, if the suite grows)
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** pending
- [ ] **P2.T1: Wire the Hub** — covers: FR-1, FR-2, FR-5
  - [ ] **P2.T1.1:** start the prewarm shortly after the Hub entrance settles (aligned with the existing post-entrance flow, e.g. where `idleLoop()`/`scheduleIdleAttract()` arm), never during the entrance itself.
  - [ ] **P2.T1.2:** gate on the play-time lock — no imports while the lock is active; re-check at each pacing tick and resume when the lock clears. Pause while `document.hidden`.
  - [ ] **P2.T1.3:** tap-wins — the tile-tap path (via the hub grid) must cancel the prewarm before scene start so the tap's own fetch/registration is never queued behind prewarm work.
  - [ ] **P2.T1.4:** shutdown cleanup — the existing shutdown handler pattern (`HubScene.ts:264-265`) must also cancel the prewarm; no dangling timers or unhandled rejections across visits (scene instances are reused).
- [ ] **P2.T2: Prove the integration** — covers: FR-2, AC-3
  - [ ] **P2.T2.1:** seeded scene-level tests in the Hub suite: no imports while locked, resume after unlock, cancel on tap, cleanup on shutdown + re-create (reuse-safe).
- [ ] **P2.T3: Count claims** — covers: NFR-3
  - [ ] **P2.T3.1:** refresh the living-doc count claims if the suite grew in this phase.

<!-- The primary appends after acceptance:
**Result:** verified | failed | blocked
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/<track-id>/verification/phase-2.md
-->

## Phase 3: First-tap verdict and docs truth

- **Goal:** a measured, dated first-tap verdict in `docs/perf-baseline.md` that resolves the open question, plus the behavior documented in TDD and tech-stack — the track's user-facing proof.
- **Depends on:** Phase 2
- **Covers:** FR-4, FR-5, NFR-2, AC-5, AC-6
- **Touches:** `docs/perf-baseline.md`, `docs/TDD.md`, `conductor/tech-stack.md`, `scripts/measure-first-tap.mjs` (only if the measurement needs a prewarm-aware flag), `README.md` (count claim only, if moved again)
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** pending
- [ ] **P3.T1: Measure the increment** — covers: FR-4
  - [ ] **P3.T1.1:** build the pre-track baseline (`git worktree` or stash-based build from the base commit) and run the first-tap measurement back-to-back with the prewarm build on the same host — median-of-three per game, shell-diet methodology.
  - [ ] **P3.T1.2:** write the dated verdict section into `perf-baseline.md` (before/after medians, host caveats) and resolve or re-scope the `:395-399` open-question text with the reason.
- [ ] **P3.T2: Document the behavior** — covers: FR-5
  - [ ] **P3.T2.1:** TDD — document the prewarm module, pacing model, and lock/visibility gates.
  - [ ] **P3.T2.2:** tech-stack — dated Design Update blockquote (newest-first) describing the prewarm, recency ordering, and the tap-wins rule.
- [ ] **P3.T3: Final validation** — covers: AC-6
  - [ ] **P3.T3.1:** full chain including `validate-docs` green with the new sections; coverage snapshot refreshed if denominators moved.

<!-- Review fixes are appended by conductor-review as:
## Phase R1: Review Fixes
- **Goal:** Resolve review findings <IDs>
- **Depends on:** <last verified phase>
- **Covers:** <finding IDs>
- **Touches:** <union of finding files>
- **Verification:** <phase verification command>
- **Status:** pending
- [ ] **R1.T1: Resolve <finding ID>** — covers: <finding ID>
-->
