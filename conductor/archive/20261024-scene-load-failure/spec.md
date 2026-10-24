# Scene Load Failure Path — Specification

> Requirements are stable. Once an `FR`, `NFR`, or `AC` ID is approved, do not
> renumber it. If a requirement is removed, mark it `Withdrawn` instead of
> deleting it.

## Overview

Every game's code and art is loaded lazily: since the shell diet, a tile tap
dynamic-imports the game's chunk and then starts the scene. That fetch has no
failure path. If it fails — flaky tablet Wi-Fi, an evicted chunk, a first visit
that is not fully cached — the tap does nothing visible, the Hub's navigation
lock stays set so *every* tile goes dead, the rejection goes unhandled, and the
tap still charges a play minute and records a played game. This track gives the
load path an honest failure: one silent retry, then a textless retry cue over
the tile, with the Hub left usable and nothing charged for a game that never
opened.

## Problem / Motivation

A child taps a tile, nothing happens, and the Hub stops responding to every
further tap — a dead screen with no explanation and no way out short of
reloading. The parent sees a minute come off the daily budget for a game that
never started, and the engagement record credits a play that did not happen.
This is the app's only unhandled rejection, and it is reachable offline, which
is the platform the product claims.

Three defects compound:

1. **No rejection path.** `HubScene.launchGame` (`src/scenes/HubScene.ts:246`)
   passes the promise to `.then()` with no `.catch`, and
   `ensureSceneLoaded` (`src/scenes/sceneRegistry.ts:46-59`) lets the dynamic
   import's rejection escape.
2. **A permanent navigation lock.** `gridBuilder` sets `grid.navLocked = true`
   at `pointerup` (`src/game/hub/gridBuilder.ts:92` and `:177`) before the load
   starts, and nothing clears it except the scene's own shutdown. One failed tap
   therefore disables all 22 tiles.
3. **A charge for nothing.** `activateTile`
   (`src/scenes/HubScene.ts:253-264`) starts the play session and calls
   `recordGamePlay` *before* the chunk resolves, so a failed tap costs a play
   minute (minutes are ceiled since v1.21.1) and pollutes the engagement record.

If it is not fixed, the first offline tap on an uncached game is a soft brick,
and the only recovery a parent will find is a reload.

## Goals & Success Metrics

- **Goal:** a failed game load is visible, retryable, and free — and never
  disables the Hub.
- **Metric:** with an injected failing loader, a Hub test proves one automatic
  retry, a retry cue on second failure, an unlocked grid, zero play-time writes
  and zero game-play records; the full gate stays green.

## Scope

### In Scope

- A retry-once load helper around the dynamic import, with the loader map
  injectable exactly as it is today.
- `HubScene` ordering: side effects that belong to a started game (play session,
  game-play record, play-time nudge) happen only after the chunk resolves.
- A textless retry cue anchored to the tapped tile, and a way to clear it.
- Clearing `navLocked` when a load finally fails.
- Console logging of the failure and the retry outcome.

### Out of Scope

- `GameSceneBase`'s own art-load failure (a game whose textures fail after its
  scene starts).
- `transitionToScene` / fade failures.
- Service-worker cache repair, forced re-fetch, or an "update the app" flow.
- A loading indicator while a healthy chunk download is in flight (see Open
  Questions).
- Any change to the retry policy beyond one automatic attempt, any backoff, or
  any network-state detection.

## Bug Details

- **Reproduction steps:**
  1. Load the Hub online, so the shell and the Hub are cached.
  2. In DevTools, block the chunk request for a game that has never been opened
     (`Network → Block request URL` for that `assets/<Scene>-*.js`), or set the
     network to offline after the Hub has loaded.
  3. Tap that game's tile.
  4. Tap any other tile.
- **Expected behavior:** the first tap retries once in the background; when that
  also fails, a textless retry cue appears over the tile, the rest of the Hub
  still responds, and no play minute or game play is recorded.
- **Actual behavior:** nothing happens on the tap; the rejection is unhandled;
  all other tiles are dead; `getPlayTime().usedMinutes` gains a minute;
  `recordGamePlay` records the game.
- **Root-cause hypothesis:** the missing rejection path in
  `HubScene.launchGame` / `ensureSceneLoaded`, the `navLocked` set in
  `gridBuilder` with no failure branch, and the side-effect ordering in
  `activateTile` that charges before the load is known to succeed.
- **Regression test:** a Hub test that injects a loader which rejects, asserting
  the retry cue, an unlocked grid, and no `startPlaySession` / `recordGamePlay`
  / play-time write. It fails on today's code.

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | A failed scene load is retried once automatically, without anything visible, before any failure is surfaced. | must |
| FR-2 | When the automatic retry also fails, the Hub clears its navigation lock and shows a textless retry cue anchored to the tapped tile; the rest of the Hub stays usable. | must |
| FR-3 | A retry started from the cue loads the game and opens it through the same transition as a first-time success. | must |
| FR-4 | A tap whose scene never starts must not start a play session, must not record a game play, and must not show the play-time nudge. | must |
| FR-5 | Each failed load and each retry outcome is logged to the console with the scene key; nothing is shown to the child as text and nothing is persisted. | must |
| FR-6 | At most one retry cue exists at a time; it is cleared when the game opens, when a parent surface opens, and when the Hub shuts down. | should |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | No new runtime dependency, and no change to the shell bundle budget (≤ 200 kB) or the precache count. |
| NFR-2 | The loader seam stays injectable: tests must drive failures through an injected loader map, never through a real rejected dynamic import. |
| NFR-3 | No new storage key, no persisted state, and no change to the `PlayTime` record or the v2 payload. |
| NFR-4 | The cue respects the existing accessibility rules: no text for the child, an interactive area of at least 96×96 px, and no pulsing loop under reduced motion. |
| NFR-5 | No regression: every existing Hub, play-time and grid test keeps its current expectation, and the coverage gates are unchanged. |
| NFR-6 | A load that resolves after the Hub has shut down must not act on a dead scene and must not throw. |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | With a loader that rejects once and then resolves, the game opens and no cue ever appears; the loader was called exactly twice. | FR-1 |
| AC-2 | With a loader that always rejects, a retry cue is visible over the tapped tile, and a subsequent tap on another tile reaches `activateTile` again (the grid is no longer locked). | FR-2 |
| AC-3 | With the cue visible and the loader now resolving, tapping the cue retries, the cue is destroyed, and the scene transition starts. | FR-3 |
| AC-4 | A load that fails twice leaves `usedMinutes` unchanged and records no game play. | FR-4 |
| AC-5 | Each failed attempt produces one console warning naming the scene key, and no storage write occurs. | FR-5 |
| AC-6 | Two failing taps do not produce two cues, and a Hub shutdown with a load in flight neither throws nor mutates the cueless state. | FR-6 |

## Edge Cases

- **Double tap before the first failure settles:** `navLocked` still blocks the
  second tap; only one load chain runs per tap.
- **Retry while the daily limit is reached:** the time-up lock wins; the cue
  must not open a game behind the lock.
- **Parent surface open:** opening Settings or the profile chip clears the cue
  so it cannot outlive the Hub's front-most surface.
- **Synchronous loader throw** (not a rejected promise): treated as a failure of
  that attempt, not as an uncaught exception.
- **Permanently offline:** the cue stays until the child taps it again or opens
  a parent surface; the Hub remains fully usable and nothing is charged.
- **Shutdown during a pending load:** the resolution is discarded
  (`NFR-6`), no transition starts, no cue is created.
- **Retry succeeds after a cue was shown:** the cue is destroyed before the fade,
  so it cannot survive into the game scene.

## Dependencies

- **Tracks:** none. This track is independent of the archived
  `20261024-playtime-integrity` work, but it preserves that track's ordering
  guarantee that a play session starts only for a game that opens.
- **External:** none. No service, credential or data change.

## Open Questions & Assumptions

- **Assumption:** one automatic retry is enough for the transient case, because
  a chunk request that fails twice in a row is a real failure (offline,
  blocked, or an evicted cache) rather than a blip.
- **Assumption:** the retry cue may be silent. Product guidelines forbid
  negative audio, and a neutral tone is not needed to convey "tap again" while
  the Hub stays responsive.
- **Question:** should a healthy first load also show an acknowledgement (a
  pulse on the tile) while the chunk downloads? Deferred: this track fixes the
  failure path; a loading acknowledgement would be its own small track.
- **Assumption:** the play-time nudge moves after the load resolves, so a failed
  tap never pauses a child for a game that cannot open; the 1.5 s nudge delay is
  unaffected on the success path.

## References

- `docs/roadmap.md` — "A failed game-chunk load leaves the child with no
  feedback" (the Known Issue this track retires).
- `src/scenes/HubScene.ts`, `src/scenes/sceneRegistry.ts`,
  `src/game/hub/gridBuilder.ts`, `src/components/PlayTimeIndicator.ts`
  (`PlayTimeNudge` is the tile-anchored overlay precedent).
- `docs/PRD.md` §4.6 and `docs/TDD.md` §7 for the rules this track must extend.
