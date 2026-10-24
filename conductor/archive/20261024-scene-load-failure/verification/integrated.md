# Integrated verification - 20261024-scene-load-failure

Track: Scene Load Failure Path (bug, high)
Branch: `fix/20261024-scene-load-failure`
Base: `7a7c8e0` (`master` at track start)
Verified at: `a2fda4bc` (after all three phases and their state commits)

## What changed

| Area | Change |
| --- | --- |
| `src/scenes/sceneRegistry.ts` | `loadSceneWithRetry(scene, key, loaders = sceneLoaders, attempts = 2)` - makes two attempts over `ensureSceneLoaded`, resolves `true`/`false`, never rejects, treats a synchronous loader throw like a rejected import, and logs one `console.warn` naming the key and the attempt per failure. `ensureSceneLoaded` keeps its throwing contract. |
| `src/scenes/HubScene.ts` | Tap path split: `activateTile` unlocks audio on the gesture and defers to `openGame`, which awaits the retry helper before any side effect. A failure releases `grid.navLocked` and raises the cue; a success destroys the cue, then starts the session, records the game play, and branches to the nudge or the transition. `openGame` discards a resolution that arrives after shutdown and re-checks the daily cap before charging. The nudge's `onLaunch` transitions directly instead of re-entering the load. |
| `src/components/GameLoadCue.ts` | New textless retry affordance: ringed circular arrow, no text, no sound, 96x96 hit floor at `CUE_DEPTH` 12, one instance at a time, static under reduced motion, idempotent `destroy()` wired to the scene's `shutdown`. |
| `src/game/hubGrid.ts`, `src/game/hub/gridBuilder.ts` | The tap passes the tapped rectangle through to `activateTile` so the cue can anchor on the tile. Tap gating is otherwise unchanged (`isTimeUp`, `navLocked`, `swiping`). |
| `docs/PRD.md` | Step 4 of the play flow states the automatic retry, the wordless ring on the tapped tile with the rest of the Hub usable, the ring as the retry, and that a game which never opens charges no play time and records no play. 4.7 now says "a play when a game opens from its Hub tile". |
| `docs/TDD.md` | Documents the retry wrapper, the post-load ordering, the cue's lifetime and depths, the post-shutdown guard, and the cap re-check; component count corrected to seventeen. |
| `docs/roadmap.md` | The failed-chunk Known Issue and its Future Work item are retired; the survivors renumber 1..6. |

Delta against the base, excluding `conductor/`: **18 files, +1160 / -62**.

## Gate at the integrated HEAD

| Layer | Result |
| --- | --- |
| `pnpm check` | exit 0 (252 files, only the two pre-existing findings: Biome `$schema` 2.5.5 vs CLI, and `musicalMemoryScene.test.ts` noNonNullAssertion) |
| `pnpm typecheck` | exit 0 |
| `pnpm test -- --run` | exit 0, 121 files / **2604** tests (base 2582, +22) |
| `pnpm test:coverage` | exit 0, statements 98, branches 92.02, functions 96.66, lines 98.73 |
| `pnpm build` | exit 0, precache 54 entries / 1725.32 KiB |
| `node scripts/validate-bundle.js` | exit 0, phaser 1342.6 kB, shell `index-Dy8YMp5V.js` 137.6 kB (<= 200 kB) |
| `node scripts/validate-pwa.js` | exit 0, 16 passed / 0 failed |
| `node scripts/validate-docs.js` | exit 0, 5 passed / 0 failed |

The shell entry grew 135.7 kB to 137.6 kB across the track (retry helper, cue, Hub
changes), which is inside the gate and proportionate to the added surface.

## Cross-phase interaction review

1. **Retry that finally opens a game charges once.** Phase 1 moved every side effect
   behind the load and Phase 2's cue calls back into `openGame`; the pinned hub test
   asserts one load, one session, one game record and exactly one fade when the retry
   succeeds through the nudge path, and the cue case asserts the same on the direct
   path. No path double-charges.
2. **A failure arriving after the cap is reached stays uncharged.** Phase 2's rework
   guard sits before both the failure branch and the success branch, so a cue cannot
   be raised at the cap and a retry cannot open a game behind the time-up lock; the
   Phase 2 test drives the cap up through a dispatched `visibilitychange` and asserts
   no session, no record, no transition, cue gone, lock released.
3. **The Hub leaving mid-load is inert.** `isShuttingDown` is set before teardown, and
   `openGame` returns at the top of its post-load path, so a late resolution neither
   transitions, nor raises a cue, nor throws; the cue's own `shutdown` hook destroys it.
   Covered in both Phase 1 and Phase 2 evidence.
4. **Parent surfaces win over the cue.** Settings and the profile picker destroy the
   cue before they open, so the panel never competes with a tile-anchored overlay; the
   docs describe this lifetime rather than relying on depth.
5. **Nothing else in the Hub launch path changed.** The nudge still appears on the
   success path, the mid-minute play-time fixtures are untouched, and the grid's
   tap gating is unchanged apart from releasing the lock on failure.
6. **Documents match the shipped code.** Phase 3 was read against the Phase 1 and 2
   diffs, not against the plan, and every sentence traces to code that landed.

## Acceptance criteria

AC-1 through AC-6 are mapped to named tests and to document text in the three phase
evidence files. AC-1 (one silent retry), AC-2 (textless cue, Hub usable), AC-3 (the
cue retries the same game through the normal transition), AC-4 (nothing is charged
for a game that never opens), AC-5 (documents and roadmap state it) and AC-6 (one cue
at a time, cleared on success, parent surface and shutdown) are all covered.

## Documents synchronised

`docs/PRD.md` (play flow step 4, 4.7), `docs/TDD.md` (scene loading and the Hub launch
path, component inventory), `docs/roadmap.md` (Known Issues and Future Work). No other
document made a claim about the launch path, so none was touched.

## Residual risk

- The cue is deliberately silent and wordless; a child who taps a failing tile gets a
  visual retry affordance and nothing else. That is the product rule, not a gap, and
  a slow-but-healthy tap still gives no acknowledgement (recorded as out of scope in
  the spec).
- The one documented behaviour change outside the failure path is that a game's play
  session and game record are now written after the chunk resolves rather than on the
  tap. The difference is only observable when the load fails, which is the defect
  being fixed.
- No periodic or persisted state was introduced: the failure path keeps nothing across
  visits, so the cue cannot outlive the Hub instance that raised it.
