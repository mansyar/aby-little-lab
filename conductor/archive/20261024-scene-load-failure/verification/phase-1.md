# Phase 1 verification — A load that can fail, and a tap that charges nothing

- Track: `20261024-scene-load-failure` (Scene Load Failure Path)
- Branch: `fix/20261024-scene-load-failure`
- Phase base: `6ecec0f14957d9234ef70c5d6c11affbdee1d376`
- Code commit: `a9722aaa0ad490ab4dc2585fa0f0c8c7206e236d`
- Contract: FR-1, FR-4, AC-1, AC-4

## What changed, file by file

### `src/scenes/sceneRegistry.ts` (+30, no deletions)

- `ensureSceneLoaded` is untouched: it still throws, still re-checks after the
  await, and still has the same injectable `loaders` parameter.
- New `loadSceneWithRetry(scene, key, loaders = sceneLoaders, attempts = 2)`:
  loops up to `attempts`, returns `true` as soon as `ensureSceneLoaded`
  resolves, `console.warn`s once per failed attempt naming the scene key and the
  attempt number, and returns `false` after the last failure. The `try` wraps the
  `await` so a loader that throws synchronously is a failed attempt rather than an
  escaped exception. It never rejects, never rethrows, has no backoff and no
  network detection.

### `src/scenes/HubScene.ts`

- Import changed from `ensureSceneLoaded` to `loadSceneWithRetry`.
- `activateTile` now does only `this.startAudioFn(); void this.openGame(tileIndex)`
  — the audio unlock stays on the user gesture.
- New `private async openGame(tileIndex)`: awaits
  `loadSceneWithRetry(this, GAME_TILES[tileIndex].sceneKey)`; on `false` it clears
  `this.grid.navLocked` and returns (no session, no `recordGamePlay`, no nudge);
  on `true` it runs `startPlaySession(getActiveProfile().id)`,
  `recordGamePlay(GAME_TILES[tileIndex].gameId)`, then the existing
  nudge-or-transition branch. JSDoc states that every side effect belongs to a
  game that actually opened.
- `showPlayTimeNudge`'s `onLaunch` now calls
  `transitionToScene(this, GAME_TILES[i].sceneKey)` directly, so a dismissed nudge
  neither loads again nor starts a second play session.
- `launchGame` was deleted: a repository-wide search for `launchGame` in `src/`
  returns no matches; its two call sites moved into `openGame` (the direct
  transition) and `showPlayTimeNudge` (the `onLaunch` transition).

### `src/__tests__/scenes/sceneRegistry.test.ts` (±99 lines)

- Import extended with `loadSceneWithRetry`.
- Four cases, all driving the retry through an injected loader map (never a real
  rejected dynamic import, NFR-2): resolve-first-try, reject-then-resolve,
  always-reject, synchronous throw.

### `src/__tests__/scenes/hubSceneLoad.test.ts` (new, 226 lines)

Mocks mirror `hubPlayTime.test.ts` (fonts, Phaser, storage with
`recordGamePlay: vi.fn(actual.recordGamePlay)`, AudioManager, speech,
SettingsPanel, PwaToast, pwaBridge, `playTimeLogic` with
`startPlaySession: vi.fn(actual.startPlaySession)`). The `sceneRegistry` mock
drives the **real** `loadSceneWithRetry` through an injected loader that calls the
shared `mockEnsureSceneLoaded`, so the retry under test is production code.
Helpers `gridOf`, `nudgeOf`, and `settleLoad` (awaits the load promise the Hub is
waiting on — no arbitrary timers). Three cases: load fails twice, first failure
then success, and the nudge path with its `onLaunch` invocation.

### `src/__tests__/scenes/hubPlayTime.test.ts` (±21 lines)

- The `sceneRegistry` mock now also exposes a `loadSceneWithRetry` that delegates
  to `mockEnsureSceneLoaded` and answers `true`, so every case in this suite keeps
  observing the post-load behaviour it has always asserted.
- Two expectations moved behind the load settlement (see *Changed pre-existing
  expectations*).

### `src/__tests__/scenes/hubScene.test.ts` (±31 lines)

- The `sceneRegistry` mock gained `loadSceneWithRetry: vi.fn(() => Promise.resolve(true))`.
- New `settleLoad()` helper awaits the mocked loader promise.
- The five tile-tap cases became `async` and `await settleLoad()` before asserting
  a play record, because the charge moved behind the load.

### `src/__tests__/scenes/hubEngagement.test.ts`, `navigation.test.ts`, `feelingsFacesFlow.test.ts` (±10 lines each)

Mock surface only: each `sceneRegistry` mock gained a `loadSceneWithRetry` that
delegates to `mockEnsureSceneLoaded`. No test body, name or expectation changed —
these three already flushed a macrotask after the tap.

### `src/__tests__/helpers/sceneFlowHarness.ts` (a few lines) — see Deviations

`mockEnsureSceneLoaded` now keeps `ensureSceneLoaded`'s `(scene, key)` signature
(`vi.fn(async (_scene?: unknown, _key?: string) => {})`) so an argument assertion
stays meaningful. Behaviour is unchanged: it still resolves immediately.

## Verification

The brief's chained command was rejected by the environment as a whole, so each
layer was run separately, in order:

| # | Command | Exit | Summary |
|---|---------|------|---------|
| 1 | `pnpm check` | 0 | 250 files checked. 0 errors; 1 pre-existing warning (`musicalMemoryScene.test.ts:294` non-null assertion) and 1 pre-existing info (`biome.json` schema version 2.5.5 vs CLI 2.5.10). |
| 2 | `pnpm typecheck` | 0 | `tsc --noEmit`, no output. |
| 3 | `pnpm test -- --run` | 0 | 120 files, 2589 tests passed. |
| 4 | `pnpm test:coverage` | 0 | 120 files, 2589 tests passed. Statements 97.96%, branches 91.91%, functions 96.63%, lines 98.71% — all above the configured gates (90/85/88/95). |
| 5 | `pnpm build` | 0 | 342 modules, built in 5.01 s; shell entry `index-DqOoNPbE.js` 139.16 kB, Phaser vendor chunk kept separate; PWA precache 54 entries (1723.59 KiB). |
| 6 | `node scripts/validate-bundle.js` | 0 | `PASS` Phaser vendor chunk present; `PASS` shell entry 135.9 kB (<= 200 kB). |
| 7 | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed — 42 chunks, 42 precached (precache count unchanged). |
| 8 | `node scripts/validate-docs.js` | — | **Denied by the environment** (`permission.rejected`). Not retried per the brief; see Blockers. |

No new runtime dependency, no new storage key, no `PlayTime`/v2 payload change
(NFR-1, NFR-3): the diff touches only `src/scenes/*` and `src/__tests__/*`.

## Red then green

Both new test groups were demonstrated red against the phase-base behaviour
before the fix was restored, then green on the committed code.

**Retry seam (T1).** `src/scenes/sceneRegistry.ts` was temporarily given the
base behaviour — one attempt, i.e. no retry:

```
× retries a rejected load once and resolves true
  AssertionError: expected false to be true
× resolves false after two failed attempts and warns once per attempt
  AssertionError: expected "vi.fn()" to be called 2 times, but got 1 times
× treats a synchronous loader throw as a failed attempt instead of escaping
  AssertionError: expected "vi.fn()" to be called 2 times, but got 1 times
Tests  3 failed | 6 passed (9)
```

**Tap ordering (T2).** `HubScene` was temporarily restored to the base ordering
(charge on the tap, `ensureSceneLoaded(...).then(...)` with no rejection path):

```
× charges nothing and releases the grid when the load fails twice
  AssertionError: expected "vi.fn()" to be called 2 times, but got 1 times
× opens the game once when the retry succeeds
  AssertionError: expected "vi.fn()" to be called 2 times, but got 1 times
× keeps the play-time nudge on the success path without loading twice
  AssertionError: expected "vi.fn()" to be called 1 times, but got 0 times
Tests  3 failed (3)
Errors  2 errors  (Unhandled Rejection: Error: offline / Error: chunk blip)
```

The two unhandled rejections are defect 1 of the spec, reproduced by the base
colour: the old tap leaves the failed load's rejection unhandled. On the fixed
code the same three cases pass and the run reports no unhandled errors:

```
Test Files  1 passed (1)      Tests  3 passed (3)
Test Files  1 passed (1)      Tests  9 passed (9)   (sceneRegistry.test.ts)
```

Both temporary edits were reverted before the verification run above; `git diff`
against the phase base shows only the intended changes.

## AC mapping

**AC-1 — loader rejects once then resolves: the game opens, no cue appears, the
loader is called exactly twice.**

- `src/__tests__/scenes/hubSceneLoad.test.ts` » *"opens the game once when the
  retry succeeds"*: `mockEnsureSceneLoaded` rejects once then resolves;
  `expect(mockEnsureSceneLoaded).toHaveBeenCalledTimes(2)`, exactly one
  `startPlaySession`, one `recordGamePlay`, the fade starts, and
  `scene.scene.start` receives the tile's `sceneKey`. No cue exists in this phase,
  so a first failure has nothing to surface: the tap's only visible effect is the
  one fade at the end.
- `src/__tests__/scenes/sceneRegistry.test.ts` » *"retries a rejected load once
  and resolves true"*: `true`, loader called twice, `add` called once, exactly one
  warning.

**AC-4 — a load failing twice leaves `usedMinutes` unchanged and records no game
play.**

- `src/__tests__/scenes/hubSceneLoad.test.ts` » *"charges nothing and releases the
  grid when the load fails twice"*: `getPlayTime("p1").usedMinutes` is `0`,
  `endPlaySession()` returns `null`, `startPlaySession` and `recordGamePlay` are
  never called, no 2000 ms nudge is scheduled, no transition starts, and
  `grid.navLocked` is `false` afterwards so the rest of the Hub stays tappable.
- `src/__tests__/scenes/sceneRegistry.test.ts` » *"resolves false after two failed
  attempts and warns once per attempt"*: the value the Hub branches on is `false`,
  and each failed attempt logs one warning naming the key (FR-5's logging half,
  which lands here because only the retry loop knows an attempt failed).

Supporting coverage for the success ordering (FR-4's contrapositive, AC-4's
"succeeds ⇒ charged exactly once"): *"keeps the play-time nudge on the success
path without loading twice"* — one load, one session, one record, exactly one
2000 ms nudge call, and invoking its callback starts the fade without a second
load or session.

## Changed pre-existing expectations

1. `src/__tests__/scenes/hubPlayTime.test.ts` » *"shows a nudge overlay before
   launching when 5 minutes or fewer remain"*.
   - Before: after the tap, `expect(ensureSceneLoaded).not.toHaveBeenCalled()`
     (the nudge preceded the load); after the nudge fired,
     `expect(ensureSceneLoaded).toHaveBeenCalled()`.
   - After: `expect(ensureSceneLoaded).toHaveBeenCalledTimes(1)` plus
     `expect(scene.scene.start).not.toHaveBeenCalled()` before the nudge, and
     `expect(scene.scene.start).toHaveBeenCalledTimes(1)` after it.
   - Why: FR-4 requires the load to resolve before anything is charged, so the
     chunk is fetched at tap time and the *transition* is what the nudge defers.
     The intent the case protects — nothing navigates until the nudge dismisses —
     is unchanged and is now asserted on `scene.start` instead of on the loader.
2. `src/__tests__/scenes/hubPlayTime.test.ts` » *"shows the nudge overlay under
   reduced motion without animating it"*: became `async` and awaits one macrotask
   after the tap (comment: "The nudge now follows a resolved load instead of
   preceding it"). Same reason; the no-tween and 2000 ms assertions are untouched.
3. `src/__tests__/scenes/hubScene.test.ts` » the five tile-tap cases ("maps page-1
   tiles to games 11-20", "launches Story Order from the 22nd tile on the last
   page", "records a play for the tapped tile's game on the active profile",
   "ignores taps on other tiles once navigation has started", "does not
   double-record when a tile is tapped repeatedly"): became `async` and
   `await settleLoad()` before asserting the record. Every `toHaveBeenCalledWith`
   / `toHaveBeenCalledTimes` expectation is unchanged — only the moment of
   assertion moved, because the charge now follows the load.
4. `src/__tests__/scenes/{hubPlayTime,hubScene,hubEngagement,navigation,feelingsFacesFlow}.test.ts`:
   the `sceneRegistry` mock gained `loadSceneWithRetry`. Required because
   `HubScene` imports that name; the double always reports success, so no
   behaviour in those suites changed.
5. `src/__tests__/helpers/sceneFlowHarness.ts`: `mockEnsureSceneLoaded` gained an
   `(scene?, key?)` signature (see Deviations).

No other expectation in the repository changed: `pnpm test -- --run` reports
2589 passing tests, and the only edited files are the ones listed above.

## Deviations

- `src/__tests__/helpers/sceneFlowHarness.ts` (outside `Touches`). The
  shared `mockEnsureSceneLoaded` was a zero-argument `vi.fn(async () => {})`, so
  passing `(scene, key)` through the new delegating `loadSceneWithRetry` double
  failed `pnpm typecheck` (TS2554) in five suites, and `navigation.test.ts`
  asserts `ensureSceneLoaded` was called *with* `(scene, GAME_SCENE_KEYS[i])`.
  Widening the mock's parameters is the smallest change that keeps those
  assertions real; it still resolves immediately and asserts nothing on its own.
- No production or product-doc file outside the brief's five was touched.

## Blockers

- The brief's chained command
  (`pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`)
  was rejected by the environment as a whole (`permission.rejected`). Every layer
  was then run individually; layers 1–7 above exited 0.
- `node scripts/validate-docs.js` was rejected on its own (`permission.rejected`)
  and not retried, per the brief's rule on permission-denied commands. It is a
  docs-only validator; Phase 3 is the phase that changes docs and runs it.

## Notes for the next phase

- Phase 2 owns everything FR-2/FR-3/FR-5/FR-6: the retry cue, the cue's tap
  re-entering `openGame(tileIndex)`, cue teardown on parent-surface open and on
  `shutdown`, and the post-shutdown guard (NFR-6). `openGame` currently has no
  shutdown check: a load resolving after `shutdown` would call
  `transitionToScene` on a dead scene. That guard belongs with the cue work.
- `grid.navLocked = false` is written directly from `HubScene` (the field is
  public). Phase 2 may replace it with a `HubGrid` method when the cue needs the
  same call; the plan allows either.
- `hubSceneLoad.test.ts` already imports the real retry loop, so Phase 2 can add
  cue cases to the same file without new mocks.

## Primary verification

Independently re-run by the primary at HEAD `1516afe` (the subagent's evidence commit).

| Layer | Command | Exit | Result |
| --- | --- | --- | --- |
| tree | `git status --porcelain` | 0 | clean at verification start |
| scope | `git diff --name-only 6ecec0f..HEAD` | 0 | 10 code/test files + this evidence (see the Touches deviation below) |
| static | `pnpm check` | 0 | 250 files, 0 errors; the one pre-existing warning and one pre-existing info |
| static | `pnpm typecheck` | 0 | clean |
| unit | `pnpm test -- --run` | 0 | 120 files / 2589 tests |
| coverage | `pnpm test:coverage` | 0 | 97.96 / 91.91 / 96.63 / 98.71 |
| build | `pnpm build` | 0 | 342 modules; precache 54 entries / 1723.59 KiB |
| bundle | `node scripts/validate-bundle.js` | 0 | phaser 1342.6 kB; shell `index-DqOoNPbE.js` 135.9 kB |
| pwa | `node scripts/validate-pwa.js` | 0 | 16 / 16 |
| docs | `node scripts/validate-docs.js` | 0 | 5 / 5 - the layer the subagent was denied |

### Touches deviation: accepted

The phase Touches named five files; the work touched ten. Five further test files
had to change because `HubScene` now imports `loadSceneWithRetry` instead of
`ensureSceneLoaded`:

- `sceneFlowHarness.ts` - the shared `mockEnsureSceneLoaded` double was zero-arity,
  so a delegating `loadSceneWithRetry` double could not forward `(scene, key)`:
  `TS2554` in five suites and `navigation.test.ts`'s argument assertion. It is now
  `(_scene?, _key?)`, still resolving immediately. `ensureSceneLoaded`'s real
  signature is `(scene, key, loaders?)`, so the double stays assignment-compatible.
- `navigation.test.ts`, `hubEngagement.test.ts`, `feelingsFacesFlow.test.ts` -
  their `vi.mock(".../sceneRegistry")` factories returned only
  `ensureSceneLoaded`, so the real `loadSceneWithRetry` would have run against a
  mocked module. Each now also returns a delegating
  `loadSceneWithRetry` that awaits the shared double and resolves `true`.
- `hubScene.test.ts` - same factory addition, plus a local `settleLoad()` so the
  four assertions that observe the game record after a tap wait for the load the
  Hub is already awaiting. No assertion was weakened: each `await` was added in
  front of the same expectation.
- `hubEngagement.test.ts` / `navigation.test.ts` argument assertions still see the
  same `(scene, key)` pair, because the delegating double forwards them.

Accepted because every one of these changes is a consequence of the production
import change, and none of them removes an assertion. The alternative - keeping the
old import name and hiding the new one - would have been worse.

### Changed pre-existing expectations

Exactly one pair, both in `hubPlayTime.test.ts`, and both made stricter rather than
looser:

- "Navigation deferred until the nudge dismisses" previously asserted
  `ensureSceneLoaded` was **not** called while the nudge was up. The chunk now
  loads on the tap, so the test asserts `ensureSceneLoaded` called **once** and
  `scene.scene.start` **not called** until the nudge dismisses - the deferred thing
  is the navigation, which is what the test is named for.
- The reduced-motion nudge test now awaits a tick before looking for the overlay,
  because the nudge follows a resolved load. Its assertions are unchanged.

The `hubScene.test.ts` and `hubSceneLoad.test.ts` additions are new assertions, not
changed ones.

### What I checked by hand

- `loadSceneWithRetry` cannot reject: the `try` covers the `await`, and the loop
  returns `true`/`false` on every path.
- A failed load leaves the session untouched: `startPlaySession` sits after the
  `loaded` check, and the test proves `endPlaySession()` returns `null` afterwards
  (so no session was ever open to bank).
- The nudge cannot load twice: `showPlayTimeNudge` goes straight to
  `transitionToScene`, and the test asserts one load, one session, one record
  across the nudge delay.
- `grid.navLocked` is released on the failure path only; the success path keeps the
  lock until the scene shuts down, as before.
- The retry warning names the key and the attempt, so a console reader can tell the
  two attempts apart.
