# Review - Scene Load Failure Path

- **Track:** `20261024-scene-load-failure` (bug, high)
- **Branch:** `fix/20261024-scene-load-failure`
- **Range:** `7a7c8e0c09f0339ee6e0ea30e457dabd6ac7f716..1f541687` (base `master` to the final fix commit)
- **Date:** 2026-10-24
- **Round:** 2 (final)
- **Verdict:** **PASS WITH FINDINGS** - round 1's two High findings and six Lows are
  fixed, round 2's one Medium and one Low are fixed before the PR, and no Critical or
  High remains.

## Summary

The track's structure is sound. The retry wrapper never rejects, retries exactly
once, and treats a synchronous loader throw as a failure; `openGame` moves every
charge behind a resolved load and hands the grid's tap lock back on failure; the
cue is textless, silent, one at a time, closure-scoped and terminal on `destroy()`;
and Phase 3's prose traces to real lines rather than to the plan. The gate is green
at the doc-sync commit.

Two things block. First, the cue's retry path re-opens the grid without re-arming
its tap lock, so a tap on a second tile during the retry starts a parallel load and
both success branches record a game the profile never played - the exact defect this
track exists to retire, reached through the window the cue creates. Second, the
README still advertises the retired chunk-load bug as an open Known Issue (and a
second bullet it inherited from the previous track is also false now), so the
"documents say what the app does" goal is not met at the repository's front page.

The remaining findings are one Medium about the cue outliving a board rebuild, one
Medium about a verification gap (AC-1's "no cue ever appears" has no assertion), one
Medium about the two parent-surface exits being wired but never tested, and six
Lows - two of them documentation accuracy, four of them test/code hygiene. All are
assigned to Phase R1.

## Verification

The primary ran the full configured chain at `a2fda4bc` (integrated) and again at the
doc-sync commit; the phase reviewers were denied shell execution and said so.

| Layer | Result |
| --- | --- |
| `pnpm check` | exit 0 (252 files, only the two pre-existing findings) |
| `pnpm typecheck` | exit 0 |
| `pnpm test -- --run` | exit 0, 121 files / 2604 tests |
| `pnpm test:coverage` | exit 0, 98 / 92.02 / 96.66 / 98.73 |
| `pnpm build` | exit 0, precache 54 entries / 1725.32 KiB |
| `node scripts/validate-bundle.js` | exit 0, phaser 1342.6 kB, shell 137.6 kB |
| `node scripts/validate-pwa.js` | exit 0, 16 passed |
| `node scripts/validate-docs.js` | exit 0, 5 passed |

## Requirements coverage

| ID | Implemented by | Verified by | Status |
| --- | --- | --- | --- |
| FR-1 (one silent retry) | `loadSceneWithRetry`; `openGame` ordering | `sceneRegistry.test.ts` retry cases; `hubSceneLoad.test.ts` retry-succeeds case | covered |
| FR-2 (textless retry cue on the tapped tile, Hub usable) | `GameLoadCue`; `showLoadCue` | `GameLoadCue.test.ts`; `hubSceneLoad.test.ts` cue cases | **partial** (F3) |
| FR-3 (cue retry opens through the normal transition) | `showLoadCue` `onRetry` | `hubSceneLoad.test.ts` retry-from-cue case | covered |
| FR-4 (nothing charged for a game that never starts) | `openGame` ordering | `hubSceneLoad.test.ts` failure cases | **partial** (F1 - a parallel tap during a retry can charge) |
| FR-5 (console-only diagnostics naming the key) | `loadSceneWithRetry` warn | `sceneRegistry.test.ts`; `hubSceneLoad.test.ts` | covered |
| FR-6 (one cue; cleared on success, parent surface, shutdown) | `HubScene` exits; `GameLoadCue.destroy` | `hubSceneLoad.test.ts` | **partial** (F4 - parent surfaces untested; F3 - board rebuild is a fourth exit) |
| NFR-1..NFR-4 | see phase evidence | tests | covered |
| NFR-5 (no regression) | - | gate above | covered |
| NFR-6 (post-shutdown inert) | `isShuttingDown` guard | `hubSceneLoad.test.ts` shutdown cases | covered, with F6's narrow window |
| AC-1 | retry wrapper + ordering | registry + hub tests | **partial** (F5 - "no cue ever appears" unasserted) |
| AC-2, AC-3, AC-5, AC-6 | see phase evidence | tests | covered |
| AC-4 | `openGame` failure path | hub test | covered |

## Findings

### F1 - High - a tap during the cue's retry starts a second load chain and charges a game that never opens

`src/scenes/HubScene.ts:329-333`.

The grid sets `navLocked = true` at `pointerup` before calling `activateTile`
(`src/game/hub/gridBuilder.ts:91-93`, `:176-178`), and a failed load releases it
(`HubScene.ts:295`). The cue's `onRetry` calls `openGame` directly and never re-arms
the lock, so while the retry's chunk is in flight the whole grid is tappable: the
child taps another tile, that tap sets the lock and starts a second `openGame`. If
both resolve `true`, both run `startPlaySession` and `recordGamePlay`, while
`transitionToScene` lets only one scene start - so the profile records a play and an
activity event for a game that never opened, which is FR-4.

**Fix:** re-arm the grid's tap lock before retrying (`this.grid.navLocked = true`),
and refuse to enter `openGame` while a launch is already in flight. Test: fail a
load, tap the cue, tap a second tile before the retry settles, assert one session,
one game record, one transition.

### F2 - High - the README still advertises the bug this track retired

`README.md:246`, `:251` (and `:252`, inherited staleness from the previous track).

The Known Issues section still says "A failed game-chunk load does nothing visible -
the tap is swallowed and the promise rejection goes unhandled", which is exactly the
state this track removed, and the paragraph above it says the full list is "seven of
them" while `docs/roadmap.md` now carries five. The play-time bullet below it
("banked only when the child returns to the Hub ... a session under 30 seconds banks
zero minutes") is also false: the previous track made banking happen on every exit
path and made the conversion a ceil.

**Fix:** delete the chunk-load bullet, delete the stale play-time bullet, and correct
the count to the roadmap's actual number of entries (or drop the count). Leave the
drag and schema-version bullets.

### F3 - Medium - the cue survives a board rebuild and ends up over a different game's tile

`src/scenes/HubScene.ts:323-335`; `src/game/hub/gridBuilder.ts:298-317`.

The cue's objects are created on the scene, not in `grid.pageObjects`, so a page
flip (and a viewport rebuild, and `resetForVisit`) destroys the tiles underneath it
while the cue stays at fixed coordinates. Paged slot centres repeat across pages, so
the cue lands over the new page's tile at the same slot and its 96x96 floor sits on
that tile's centre; tapping there retries the game from the page the child has left.
FR-2's "anchored to the tapped tile" no longer holds, and one tile on the new page is
partly dead.

**Fix:** hide the cue whenever the board is rebuilt. Test: paged grid, cue up,
`flipTo(1)`, assert the cue is gone.

### F4 - Medium - the two parent-surface exits of FR-6 are wired but never tested

`src/scenes/HubScene.ts:115`, `:222`.

`hideLoadCue()` runs on the profile picker's open and on the Settings unlock, and the
evidence justifies both by line coverage. No test raises a cue and then opens either
surface to assert the cue is gone, so a regression there would keep a cue behind a
parent surface with a green suite.

**Fix:** two cases in `hubSceneLoad.test.ts` - cue up, then open the picker; cue up,
then run the Settings unlock - asserting the cue is gone and its objects destroyed.

### F5 - Medium - AC-1's "no cue ever appears" clause is unasserted

`src/__tests__/scenes/hubSceneLoad.test.ts` retry-succeeds case.

The test proves two loads, one session, one record and one transition, but never
asserts that no cue existed. A regression that raised the cue on every tap and hid it
after the retry would pass every assertion in the track.

**Fix:** assert `cueOf(scene)` is undefined after the load settles, and that no cue
rectangle existed before the first failure.

### F6 - Low - `isShuttingDown` is a per-visit boolean, so a very late resolution can act on a later visit

`src/scenes/HubScene.ts:142`, `:291`.

Phaser reuses the scene instance; a load that only settles after the next `create()`
finds the flag reset and charges a session and a transition for a tap from a dead
visit. Narrow, but it is the NFR-6 window the flag was added to close.

**Fix:** capture a per-visit token before the await and compare it after.

### F7 - Low - `GameLoadCue` takes `scene` twice, and the two copies bind different things

`src/components/GameLoadCue.ts:54-62`, `:136-147`.

The factory binds the tween and the `shutdown` hook; `show()` draws into `deps.scene`.
They agree today, but a divergence would leak the hook and tween an object owned by
another scene. Drop `scene` from the deps, matching `createArtLoadingCue`.

### F8 - Low - a redundant assertion whose comment claims more than it proves

`src/__tests__/scenes/hubSceneLoad.test.ts:298-301` re-reads a width already asserted
at `:286` while its comment claims the second tap was not swallowed.

### F9 - Low - `src/main.ts:30-31` still names `ensureSceneLoaded` as the Hub's load entry point

The Hub now calls `loadSceneWithRetry`; the comment points a reader one layer below
the retry.

### F10 - Low - two TDD sentences over-claim

`docs/TDD.md:547` says "every other side effect of a launch lives in `openGame`",
which the grid's own tap lock (described one paragraph later) contradicts;
`docs/TDD.md:549` says the cue is raised over the tapped tile, which is only true for
the first failing tap while the cue stays put.

### F11 - Low - the phase-3 evidence mislabels AC-6

`conductor/tracks/20261024-scene-load-failure/verification/phase-3.md:263-264` maps
AC-6 to the roadmap retirement, while the spec defines AC-6 as one cue at a time plus
shutdown inertness (mapped correctly earlier in the same file).

### F12 - Medium - the measured size figures in the docs are stale because of this track

`docs/PRD.md:559` (shell 134.6 kB validate-bundle / 137.8 kB Vite) and
`docs/TDD.md:415`, `:423` (shell 134.6 kB), `:426` (precache ~1,708 KiB) predate this
track's growth. The built shell is now 137.6 kB by the validator and the precache is
1725.32 KiB, so the numbers the documents present as measured no longer match what
the gate reports.

**Fix:** update both documents to the numbers the current build prints, keeping each
document's existing convention of naming both measurements where it already does.

## Plan compliance

Every phase stayed inside its Touches except Phase 1, which added five test files so
the suites mocking the scene registry could expose the new symbol; that deviation is
recorded in the plan note and the evidence and is accepted. All three phases carry
`Result`, `Checkpoint` and `Evidence`, the checkpoints are ancestors in order
(`6847990` -> `3749da6` -> `840e1e3`), and every task checkbox is backed by a commit.
Plan notes: the Phase 2 Touches were widened before the phase ran (grid tile
plumbing), which is recorded rather than smuggled.

## Out of scope

- A loading acknowledgement on a slow but healthy tap (spec, out of scope).
- In-game art-load failures (`GameSceneBase` already has `ArtLoadingCue`).
- Service-worker cache repair.
- The two pre-existing repository findings (Biome `$schema`, `musicalMemoryScene`
  non-null assertion).

## Debt

None. Every finding from both rounds is fixed inside the track, including the two
harness items round 1 deferred: `settleLoad()` moved to `sceneFlowHarness` behind a
guard that fails loudly when there is no load to settle, and the four copied
`loadSceneWithRetry` doubles collapsed into `createLoadSceneWithRetryDouble()`.

## History

| Round | Verdict | Critical | High | Medium | Low | Fixed since previous round |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | BLOCK | 0 | 2 | 4 | 6 | - |
| 2 | PASS WITH FINDINGS | 0 | 0 | 1 | 1 | 12 + 2 harness items |

## Round 2 addendum

Scope `ef9c16b..5e86589` for the review of the fixes, plus a full re-read of the
touched sources and a re-check of every round-1 finding against the code rather than
against the evidence file.

### Round 1 findings

| Finding | Severity | Status | Evidence |
| --- | --- | --- | --- |
| F1 concurrent tap during a cue retry | High | resolved | `HubScene.ts:303-338` takes `launching` before the await and releases it on the cap and failure branches; the cue's `onRetry` re-arms `grid.navLocked`; the case at `hubSceneLoad.test.ts:372-405` taps a second tile while the retry is pending and pins one load, one session, one record, one transition |
| F2 README advertises the retired bug | High | resolved | `README.md` drops the chunk-load and stale play-time bullets; the count matches the roadmap's five entries; the dated shell figure is re-measured |
| F3 cue survives a board rebuild | Medium | resolved | `HubGridDeps.onBoardChange`, called once per `flipTo` and on a viewport flip; `HubScene` wires it to `hideLoadCue()` |
| F4 parent surfaces untested | Medium | resolved | two suites cover the picker and the Settings unlock with a cue up |
| F5 AC-1 unasserted | Medium | resolved | the retry-succeeds case asserts no cue before the failure and none after the settle |
| F6 per-visit boolean | Low | resolved | `visitToken` bumped in `create()` and on shutdown, compared after the await; re-create case added |
| F7 `scene` passed twice to the cue | Low | resolved | the factory owns it; `show()` no longer takes one |
| F8 redundant assertion | Low | resolved | dropped |
| F9 stale `main.ts` comment | Low | resolved | names `loadSceneWithRetry` |
| F10 TDD over-claims | Low | resolved | the `openGame` sentence names `gridBuilder`'s lock, and the cue paragraph states the reuse-where-it-sits behaviour |
| F11 phase-3 evidence mislabels AC-6 | Low | resolved | the row maps AC-6 to the one-cue and shutdown criteria |
| F12 stale measured figures | Medium | resolved | PRD and TDD carry the current shell size and precache weight |

### Round 2 findings

| Finding | Severity | Status | Evidence |
| --- | --- | --- | --- |
| R2-F1 the viewport half of the F3 fix unasserted | Medium | resolved | `hubScene.test.ts` "drops the retry cue when a resize rebuilds the grid under it": wide tile, failing load, cue up, `fireResize` to 1024x768, cue floor destroyed. Red-then-green proven by removing `onBoardChange` from `handleViewportChange` (failure: "expected vi.fn() to be called at least once") |
| R2-F2 dead `drawScene` alias | Low | resolved | `GameLoadCue` calls `scene.*` directly |

### Checks at the final commit

`git diff --shortstat 7a7c8e0..HEAD -- . ':!conductor'` = 20 files, +1409 / -75.
`pnpm check` exit 0, `pnpm typecheck` exit 0, `pnpm test -- --run` exit 0 (121 files /
2611 tests), `pnpm test:coverage` exit 0 (97.97 / 91.9 / 96.66 / 98.74), `pnpm build`
exit 0, `node scripts/validate-bundle.js` exit 0 (shell `index-8NE0oYrd.js` 137.8 kB),
`node scripts/validate-pwa.js` exit 0 (16/16), `node scripts/validate-docs.js` exit 0
(5/5).

### Requirements after round 2

FR-1 through FR-6, NFR-1 through NFR-6 and AC-1 through AC-6 are all covered with
named tests or document text; nothing is partial.

## Doc sync

`complete` at `1f541687` (PRD play flow and 4.7 plus the measured figures, TDD scene
loading and the Hub launch path plus the same figures, roadmap Known Issues and Future
Work, README Known Issues). `node scripts/validate-docs.js` reports 5/5.
