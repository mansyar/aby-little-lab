# Phase 2 verification — A retry cue that keeps the Hub alive

- Track: `20261024-scene-load-failure` (Scene Load Failure Path)
- Branch: `fix/20261024-scene-load-failure`
- Phase base: `16d82f8ce7b9e0a66c90b2bc937e502282a1836c`
- Code commit: `73fc71c`
- Contract: FR-2, FR-3, FR-5, FR-6, AC-2, AC-3, AC-5, AC-6 (plus NFR-4, NFR-6)

## What changed, file by file

### `src/components/GameLoadCue.ts` (new)

- `createGameLoadCue(scene)` returns `{ show, isActive, destroy }`, shaped like
  `createPlayTimeNudge`/`createArtLoadingCue`: closure state, no class, one
  instance per cue.
- Textless by construction: `scene.add.graphics()` paints a warm backdrop disc
  (r = 48), a dark ring (r = 30) and a circular arrow (r = 19) with a filled
  head. No text, no image, no texture key — the shell budget only pays for the
  drawing code, and there is nothing to precache.
- One interaction object: an invisible `scene.add.rectangle(x, y, 96, 96)` hit
  floor with `setInteractive()` and a `pointerup` handler. 96x96 is the app's
  touch floor; the rest of the tile and every other tile stay untouched by the
  cue's input area.
- `show()` is a no-op while active (one cue at a time) and after `destroy()`
  (terminal). A second `show()` at a different position is ignored rather than
  silently moving the cue, so the caller destroys and rebuilds.
- Pulse: one `tweens.add({ targets: graphics, scale: 1.06, yoyo, repeat: -1 })`
  when `!isReducedMotion()`; under reduced motion the ring is drawn and nothing
  animates (NFR-4).
- Registers `scene.events.once("shutdown", destroy)` at creation. `destroy()` is
  idempotent: it stops the tween, detaches the pointer handler, removes the
  shutdown hook and destroys both objects. The pointer handler also guards on
  `active`/`destroyed`, so a tap that queued during the caller's teardown cannot
  start a second retry.

### `src/game/hubGrid.ts`

- `HubGridDeps.activateTile` is now
  `(tileIndex: number, tile?: Phaser.GameObjects.Rectangle) => void`. The
  parameter is optional, so any other caller compiles unchanged; the tile rides
  along only so a failed load can anchor its cue.

### `src/game/hub/gridBuilder.ts`

- Both tap handlers pass the rectangle they already own:
  `activateTile(i, tile)` in `buildWideGrid` and
  `activateTile(globalIndex, tile)` in `buildPageGrid`. No other change.

### `src/scenes/HubScene.ts`

- New members: `loadCue?: GameLoadCue` and `isShuttingDown = false`.
- `activateTile(tileIndex, tile?)` forwards the tile to
  `openGame(tileIndex, tile)`.
- `openGame` now: awaits the load, **discards the resolution if the scene shut
  down** (NFR-6), on failure releases `grid.navLocked` and shows the cue, on
  success destroys the cue *before* `startPlaySession`/`recordGamePlay` and the
  nudge-or-transition branch.
- New `showLoadCue(tileIndex, tile?)`: centres the cue on `tile.x`/`tile.y`,
  falling back to the scene centre when no rectangle came with the tap; its
  `onRetry` destroys the cue and re-enters `openGame(tileIndex, tile)`.
- New `hideLoadCue()`: destroys the cue and clears the field. Called from the
  retry handler, from the success path, from `ProfileChip.onOpen`, from the
  Settings `ParentLock.onSuccess`, and from the scene `shutdown` handler.
- `create()` resets `isShuttingDown` and drops a stale cue reference (Phaser
  reuses the scene instance across visits).

### `src/__tests__/components/GameLoadCue.test.ts` (new, 8 cases)

Component-level cases on `MockScene`, with `utils/motion` mocked so the
reduced-motion branch is drivable: drawing/depth/geometry, the 96x96 hit floor,
one cue at a time, `onRetry` once per cue, idempotent `destroy` with detach
asserted by behaviour, the pulse count under both motion settings, tween stopped
on destroy, and self-clearing on scene shutdown.

### `src/__tests__/scenes/hubSceneLoad.test.ts` (+6 cases, +5 helpers)

New helpers `cueOf`, `cueRectOf` (the scene's only 96x96 rectangle), `tapCue`,
`placeTile` (the rectangle double records its constructor args but does not copy
them onto `x`/`y`, so a test that cares about the anchor sets them) and
`storageSnapshot`. Six cases: AC-2, AC-3, AC-5, one-cue, shutdown-with-success-
in-flight, shutdown-with-failure-in-flight. The three Phase-1 cases are
unchanged and still pass.

### `src/__tests__/game/hubGrid.test.ts` (4 expectations)

The four `activateTile` assertions now include the tile rectangle the handler
passes (`toHaveBeenCalledWith(0, grid.attractTargets[0])`, `(10, …)`,
`(20, tiles[0])`, `(21, tiles[1])`). These are stricter, not weaker: the same
index is asserted plus the object that rides with it.

## Verification

The brief's chained command was rejected by the environment as a whole, so each
layer was run as its own command, in order:

| # | Command | Exit | Summary |
|---|---------|------|---------|
| 1 | `pnpm check` | 0 | 252 files. 0 errors; 1 pre-existing warning (`musicalMemoryScene.test.ts:294`) and 1 pre-existing info (`biome.json` schema 2.5.5 vs CLI 2.5.10). One formatter finding on the new `openGame` signature was fixed before this run. |
| 2 | `pnpm typecheck` | 0 | `tsc --noEmit`, no output. |
| 3 | `pnpm test -- --run` | 0 | 121 files, 2603 tests (was 120 / 2589: +1 file, +14 tests). |
| 4 | `pnpm test:coverage` | 0 | 121 files, 2603 tests. Statements 98.00%, branches 92.01%, functions 96.66%, lines 98.73% — above the gates (90/85/88/95). `GameLoadCue.ts` is 100% on all four. `HubScene.ts` lines 99.40%, its only uncovered line the pre-existing `startAudioFn` default. |
| 5 | `pnpm build` | 0 | 343 modules, built in 1.77 s; shell entry `index-DU6jlnqV.js` 140.87 kB (+1.71 kB over Phase 1's 139.16 kB), Phaser vendor chunk still separate; PWA precache 54 entries / 1725.25 KiB (count unchanged). |
| 6 | `node scripts/validate-bundle.js` | 0 | `PASS` Phaser vendor chunk present (1342.6 kB); `PASS` shell entry 137.6 kB (<= 200 kB). |
| 7 | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed — 42 chunks, 42 precached (precache count unchanged). |
| 8 | `node scripts/validate-docs.js` | — | **Denied by the environment** (`permission.rejected`). Not retried, not rephrased; see Blockers. |

NFR-1: no new dependency (the diff adds no manifest change), shell budget
137.6 kB of 200 kB, precache count unchanged. NFR-3: no storage key, no
`PlayTime`/v2 change. NFR-4: textless, 96x96, no pulse under reduced motion.
NFR-5: no coverage gate moved, every pre-existing test keeps its expectation
except the four `activateTile` argument assertions (see *Changed expectations*).

## Red then green

Both new groups were demonstrated red against base behaviour, then restored and
run green. No temporary edit survives in the committed tree (`git diff` against
`73fc71c` is empty).

### Component (T1)

`GameLoadCue.show()` was temporarily made to return before drawing anything —
the honest shape of "there is no cue yet":

```
× draws a textless ring and circular arrow centred on the tile
  AssertionError: expected false to be true
× covers a 96x96 hit floor and nothing larger
  AssertionError: expected "vi.fn()" to be called with arguments: [ 146, 268, 96, 96 ]
× is one cue at a time: a second show adds no objects and no listener
× calls onRetry on pointerup, once per cue
  Error: cue hit floor not created
× destroy is idempotent, removes the objects and detaches the handler
× pulses the ring once and keeps it still under reduced motion
  AssertionError: expected "vi.fn()" to be called 1 times, but got 0 times
× stops its tween on destroy rather than leaving a loop behind
  TypeError: Cannot read properties of undefined (reading 'value')
× clears itself when the scene shuts down
Test Files  1 failed (1)      Tests  8 failed (8)
```

### Wiring (T2)

`HubScene.openGame` was temporarily restored to the base failure path — release
the lock, return, no cue, and no post-shutdown guard:

```
× puts one cue over the tapped tile and leaves the rest of the Hub tappable
  AssertionError: expected undefined to be true
× retries from the cue, destroys it, then opens the game
  AssertionError: expected undefined to be true
× keeps one cue across repeated failing taps
  AssertionError: expected undefined to be true
× does not open a game whose chunk lands after the Hub shut down
  AssertionError: expected "vi.fn()" to not be called at all, but actually been called 1 times
    Array [ "ShapeSorter" ]
Test Files  1 failed (1)      Tests  4 failed | 5 passed (9)
```

The last failure is defect 4 of the spec reproduced live: without the guard, a
chunk that lands after shutdown starts the fade-out to `ShapeSorter` on a dead
scene. The AC-5 warning case stayed green under this colour because the warns
come from Phase 1's retry loop — as expected.

Green after restore:

```
Test Files  3 passed (3)      Tests  37 passed (37)   (the three touched suites)
Test Files  121 passed (121)  Tests  2603 passed (2603)   (full run)
```

## AC mapping

| AC | Test | What it proves |
|----|------|----------------|
| **AC-2** | `hubSceneLoad.test.ts` » *"puts one cue over the tapped tile and leaves the rest of the Hub tappable"* | A permanently failing loader leaves `loadCue.isActive() === true`, the cue's hit floor sits at the tile's centre (`[146, 268, 96, 96]`), `grid.navLocked` is `false`, and a tap on a second tile reaches `activateTile` again (loader called 4 times: two tiles x two attempts). |
| **AC-3** | `hubSceneLoad.test.ts` » *"retries from the cue, destroys it, then opens the game"* | With the cue up and the loader now resolving, tapping the cue destroys the cue (`isActive() === false`, field cleared, object destroyed), adds exactly one load attempt (3 total), starts one session and one play record, starts the fade, and `scene.start("ShapeSorter")` after the fade completes. |
| **AC-5** | `hubSceneLoad.test.ts` » *"warns once per failed attempt, naming the key, and persists nothing"* | Two warnings for two attempts, each containing the scene key; a key/value snapshot of `localStorage` taken after `create()` is byte-identical after the failure settles. |
| **AC-6** | `hubSceneLoad.test.ts` » *"keeps one cue across repeated failing taps"*, *"does not open a game whose chunk lands after the Hub shut down"*, *"discards a failed load that settles after the Hub shut down"* | Two failing taps leave the **same** cue instance active and exactly one 96x96 floor on screen (4 load attempts, one cue). A shutdown mid-load neither throws nor transitions: the resolving `true` load neither fades, nor starts a scene, nor charges; the resolving `false` load creates no cue. |
| **FR-3** | same as AC-3 | The retry path is `openGame` again, so it opens through the same fade and the same single charge as a first-time success. |
| **FR-6** | `components/GameLoadCue.test.ts` » *"is one cue at a time…"*, *"clears itself when the scene shuts down"*; `HubScene` wiring | One cue at a time (component and scene level); `hideLoadCue()` on success, on the retry, on Settings open, on `ProfileChip.onOpen` and on shutdown. Both parent-surface call sites execute in the existing Hub suite (`HubScene.ts` line coverage leaves only the pre-existing line 94 uncovered). |

Component cases (`GameLoadCue.test.ts`): drawing/depth/geometry; 96x96 floor and
nothing else interactive; one cue at a time; `onRetry` once per cue; idempotent
destroy with handler detach proven by behaviour (tap and shutdown after destroy
are inert); one pulse normally vs none under reduced motion; tween removed on
destroy; self-clear on scene shutdown.

## The depth constant

`CUE_DEPTH = 12`, with the justification in the file: Hub content (tiles,
labels, shelf) is at the default depth 0; the scene's overlays are `PlayTimeNudge`
and `ProfileChip`'s picker at 20–21 and `ParentLock`'s hold ring at 10000. Twelve
is above the tile the cue covers and below every overlay the Hub can put in front
of it, so the cue can neither be occluded by its own tile nor sit on top of
Settings or the picker. (The game scenes' `ArtLoadingCue` uses 10 in a different
scene, so there is no collision.)

## The shutdown guard

I chose the **private `isShuttingDown` flag**, set as the first statement of the
scene's `shutdown` handler and reset in `create()`. Phaser's own
`this.scene.isActive(...)` / `this.sys.isActive()` are not modelled by
`tests/helpers/phaserMock.ts` (`MockScene` exposes `scene`/`sys` spies but no
`isActive`), so relying on them would have made NFR-6 untestable in this suite.
The flag is set by the one handler that also owns the cue teardown, which keeps
"the Hub is going away" a single fact. A load that lands afterwards returns
before touching the grid, the session, the record, the fade or the cue, and the
two shutdown cases above prove both the `true` and `false` resolutions.

## Changed expectations

Only one group, in a file the phase owns, and all four are stricter:

- `src/__tests__/game/hubGrid.test.ts` » *"activates a tile on tap exactly once
  (navLocked blocks double-taps)"*, page-2 activation, and the two last-page
  cases.
  - Before: `expect(activate).toHaveBeenCalledWith(0)` /
    `toHaveBeenLastCalledWith(21)`.
  - After: `toHaveBeenCalledWith(0, grid.attractTargets[0])` /
    `toHaveBeenLastCalledWith(21, tiles[1])`.
  - Why: `activateTile` gained the optional tile so a failure can anchor its cue.
    The index assertion is unchanged; the object that carries it is asserted too.

No other pre-existing test changed: the full suite is 121 files / 2603 tests, and
the Phase-1 cases in `hubSceneLoad.test.ts`, `sceneRegistry.test.ts`,
`hubPlayTime.test.ts`, `hubScene.test.ts`, `navigation.test.ts`,
`hubEngagement.test.ts` and `feelingsFacesFlow.test.ts` are untouched.

## Deviations

- None outside the seven files in `Touches`. No harness or fixture file needed a
  change: the retry loop, the loader double and the scene double already carried
  everything the cue cases need.
- The shell entry grew by 1.71 kB (139.16 kB -> 140.87 kB, 137.6 kB as measured
  after minification by `validate-bundle.js`) for the cue's drawing code. Well
  inside the 200 kB budget, and the precache count is unchanged at 54.

## Blockers

- The brief's chained command was rejected as a whole (`permission.rejected`), so
  the layers were run individually; layers 1–7 exited 0.
- `node scripts/validate-docs.js` was denied on its own (`permission.rejected`)
  and not retried, per the brief's rule on permission-denied commands. It is a
  docs-only validator, and Phase 3 is the phase that changes docs and runs it.

## Notes for Phase 3

- FR-2/FR-3/FR-5/FR-6 and AC-2/AC-3/AC-5/AC-6 are now implemented and covered.
  Phase 3 owns docs (`docs/roadmap.md`'s Known Issue, `docs/TDD.md` §7), the
  changelog, and the final `validate-docs.js` run.
- ~~The cue is deliberately time-up-agnostic~~ — closed in Rework 1 below: a
  retry now consults `this.timeUp` before charging, so the cap outranks it.
- `grid.navLocked` is still written directly from `HubScene` (public field), as
  Phase 1 left it; the cue work did not need a `HubGrid` method.

## Rework 1 — the cap outranks a retry

**Gap (found in primary verification).** `openGame` never consulted
`this.timeUp`. Tile taps are refused by the grid (`isTimeUp()` in
`gridBuilder`), but a cue's `onRetry` calls `openGame` directly — so a child
whose daily limit was reached while the cue was up could retry into a game,
starting a play session and recording a play at the cap. The spec's edge case
says the time-up lock wins.

**Fix (`src/scenes/HubScene.ts`).** `openGame` now checks the cap immediately
after the `isShuttingDown` guard and before any side effect:

```ts
if (this.isShuttingDown) return;
// The cap outranks a retry: the grid checks time-up when a tile is tapped,
// but a cue outlives that moment, so it is checked again before any charge.
if (this.timeUp) {
  this.hideLoadCue();
  this.grid.navLocked = false;
  return;
}
```

Placing it before the `!loaded` branch also means a failure that arrives after
the cap does not raise a cue that could only offer a refused tap. No session,
no `recordGamePlay`, no nudge, no transition.

**Test (`hubSceneLoad.test.ts` +1 case, now 10).** "refuses a cue retry once the
daily cap has been reached": a rejecting loader drives a failure so the cue is
up; the active profile's limit is then set and reached
(`setPlayTimeLimit(profileId, 15)` + `recordPlayTime(profileId, 15)`) and the
Hub re-reads it on the documented path (`document.dispatchEvent(new
Event("visibilitychange"))`, as `hubPlayTime.test.ts` does); the cue is tapped
with a loader that now resolves. Asserts `startPlaySession`,
`recordGamePlay` and `scene.start` are not called, the cue is gone
(`isActive()` false, `cueOf` undefined) and `grid.navLocked` is false. No new
mock and no harness change; `getActiveProfile` joined the existing storage
import.

**Red then green.** With the guard removed the new case failed exactly as the
gap predicts — `expected "vi.fn()" to not be called at all, but actually been
called 1 times` with `startPlaySession("p1")` — while the other 9 cases stayed
green. Restored, the suite is `10 passed (10)`.

**Re-run (layer by layer, chain rejected as a whole).**

| # | Command | Exit | Result |
|---|---|---|---|
| 1 | `pnpm check` | 0 | 252 files, 0 errors, 1 pre-existing warning (`musicalMemoryScene.test.ts:294`) + 1 info (`biome.json` schema 2.5.5 vs CLI 2.5.10) |
| 2 | `pnpm typecheck` | 0 | clean |
| 3 | `pnpm test -- --run` | 0 | 121 files / **2604** tests (was 2603) |
| 4 | `pnpm test:coverage` | 0 | stmts **98.00%**, branches **92.02%**, funcs **96.66%**, lines **98.73%** (thresholds 90/85/88/95) |
| 5 | `pnpm build` | 0 | 343 modules; shell `index-Dy8YMp5V.js` 140.93 kB (gzip 32.52 kB); precache 54 entries (1725.32 KiB) |
| 6 | `node scripts/validate-bundle.js` | 0 | phaser 1342.6 kB; shell 137.6 kB ≤ 200 kB |
| 7 | `node scripts/validate-pwa.js` | 0 | 16 passed / 0 failed; 42 chunks, 42 precached |
| 8 | `node scripts/validate-docs.js` | — | denied (`permission.rejected`), not retried per the brief; Phase 3 owns docs |

`HubScene.ts` coverage moved to 98.3 stmts / 93.18 branch / 97.29 funcs /
99.41 lines (still only line 94, the pre-existing default `startAudioFn`,
uncovered). One commit on top of `27c9127`; no Conductor prose touched.

## Phase report

```json
{
  "status": "complete",
  "commits": ["73fc71c feat(hub): show a textless retry cue when a game load fails"],
  "files_changed": [
    "src/components/GameLoadCue.ts",
    "src/game/hubGrid.ts",
    "src/game/hub/gridBuilder.ts",
    "src/scenes/HubScene.ts",
    "src/__tests__/components/GameLoadCue.test.ts",
    "src/__tests__/game/hubGrid.test.ts",
    "src/__tests__/scenes/hubSceneLoad.test.ts"
  ],
  "verification": [
    {"command": "pnpm check", "exit": 0, "summary": "252 files, 0 errors, 1 pre-existing warning + 1 info"},
    {"command": "pnpm typecheck", "exit": 0, "summary": "clean"},
    {"command": "pnpm test -- --run", "exit": 0, "summary": "121 files / 2604 tests"},
    {"command": "pnpm test:coverage", "exit": 0, "summary": "98.00 / 92.02 / 96.66 / 98.73"},
    {"command": "pnpm build", "exit": 0, "summary": "343 modules; shell index-Dy8YMp5V.js 140.93 kB; precache 54 entries"},
    {"command": "node scripts/validate-bundle.js", "exit": 0, "summary": "phaser 1342.6 kB; shell 137.6 kB <= 200 kB"},
    {"command": "node scripts/validate-pwa.js", "exit": 0, "summary": "16 / 16, 42 chunks 42 precached"},
    {"command": "node scripts/validate-docs.js", "exit": null, "summary": "denied by the environment (permission.rejected)"}
  ],
  "tests": {"files": 121, "tests": 2604, "added": 14},
  "coverage": "98.00/92.02/96.66/98.73",
  "deviations": ["none outside Touches"],
  "blockers": ["node scripts/validate-docs.js denied (permission.rejected); docs-only, Phase 3 runs it"],
  "notes": "Cue wiring, teardown, the NFR-6 shutdown guard and the time-up retry guard land with red-then-green evidence. Rework 1 closed the cap gap; its commit is the child of 27c9127 and adds the section above."
}
```

## Primary verification

Independent pass by the primary at `43a0242` (phase base `16d82f8`). The
subagent reported `verified` and was blocked only on `node
scripts/validate-docs.js`; that layer was run here and passed.

| # | Check | Result |
|---|---|---|
| 1 | Working tree before the pass | clean |
| 2 | `git diff --name-only 16d82f8..HEAD` | the seven Touches files + this evidence file, nothing else |
| 3 | `pnpm check` | exit 0 - 252 files, 0 errors, the 1 pre-existing warning and 1 pre-existing info |
| 4 | `pnpm typecheck` | exit 0 |
| 5 | `pnpm test -- --run` | exit 0 - 121 files / 2604 tests (two consecutive full runs) |
| 6 | `pnpm test:coverage` | exit 0 - 98.00 / 92.02 / 96.66 / 98.73 |
| 7 | `pnpm build` | exit 0 - 343 modules, precache 54 entries |
| 8 | `node scripts/validate-bundle.js` | exit 0 - shell 137.6 kB <= 200 kB, phaser separate |
| 9 | `node scripts/validate-pwa.js` | exit 0 - 16 / 16, 42 chunks all precached |
| 10 | `node scripts/validate-docs.js` | exit 0 - 5 passed / 0 failed (the layer the subagent could not run) |

**A note on check 5.** In the first batched sweep of all layers the test layer
exited 1 with its output discarded; the same command then passed twice in a row
(2604 tests each) and the coverage run, which executes the identical suite,
also passed. The failure was not reproducible and left no trace to diagnose, so
it is recorded here rather than asserted away. If it recurs with a name, it is a
flake to chase, not a defect introduced by this phase.

**Independent read of the code.**

- `openGame` is now `shutdown check -> time-up check -> load outcome -> charge`.
  The time-up guard sits *before* the `!loaded` branch, so a load that fails
  after the cap raises no dead cue either - correct ordering, not just a
  convenient one.
- The guard closes the only path where the cap could be bypassed: `gridBuilder`
  checks `isTimeUp()` at tap time, and a cue outlives that moment by design.
- `GameLoadCue` never persists, never speaks, and never plays audio; `destroy()`
  is terminal by construction (`destroyed` flag), so the caller's `??= create...`
  in `showLoadCue` builds a fresh cue per failure. No leak across failures.
- Reduced motion is checked at `show()` time, so the pulse decision matches the
  setting in force when the cue appears.

**One correction made by the primary.** The `CUE_DEPTH` comment claimed every
parent surface sits in front of the cue at depth 12. `SettingsPanel` sets no
depth of its own (it is drawn over the Hub and the cue is torn down before it
opens), so the claim was wrong for one of the three surfaces. The comment now
says what actually holds - the picker at 20-21 and the parent lock at 10000 stay
in front, Settings is handled by lifetime rather than depth. Comment-only edit;
`pnpm check`, `pnpm typecheck` and the `GameLoadCue` suite (8/8) re-run green
after it.

**FR / AC mapping checked by hand.**

- FR-2 (textless retry cue over the tapped tile, grid stays live): `GameLoadCue`
  draws no text, the 96x96 hit floor is smaller than a tile, and `navLocked` is
  released only on failure.
- FR-3 (the cue's retry opens through the normal transition): the retry destroys
  the cue and re-enters `openGame`, which charges once and then nudges or fades.
- FR-5 (console-only diagnostics): one warn per failed attempt from
  `loadSceneWithRetry`, nothing written to storage.
- FR-6 (one cue, cleared on success / parent surface / shutdown): lifetime is
  covered by tests for all three exits, plus the two-failing-taps case.

Accepted as they stand: the `CUE_DEPTH = 12` choice, the terminal `destroy()`
contract, the `isShuttingDown` flag (the harness has no working
`scene.sys.isActive()`), and the two rework commits being separate rather than
folded. The four changed `hubGrid` assertions are stricter than before (they now
pin the tile argument), so they are accepted without further review.
