# Phase 3 evidence — The documents say what the Hub does

- **Track:** `20261024-scene-load-failure`
- **Branch:** `fix/20261024-scene-load-failure`
- **Phase base:** `9643049` (`conductor(plan): Mark phase 'The documents say what the Hub does' as in progress`)
- **Contract:** FR-5, AC-5, AC-6, NFR-5. Documentation only — no source, test or config change.
- **Status:** verified, except `node scripts/validate-docs.js`, which the harness denied (see Blockers).

## What changed, file by file

### `docs/PRD.md`

1. **§1.5 Session flow, step 4 (Game).** The step already said the chunk is fetched
   and evaluated before the 300 ms crossfade. It now continues, in the same
   parent-readable register and with no file or mechanism names:

   > If it cannot be fetched, the Hub tries again by itself. When that retry fails
   > too, the rest of the Hub stays usable and a wordless retry ring appears on the
   > tile the child tapped; tapping the ring tries the same game again. A game that
   > never opens charges no play time and records no play.

   That covers the four required facts: the automatic retry, the wordless ring on
   the tapped tile with the rest of the Hub usable, no play time and no play
   recorded for a game that never opens, and the ring as the retry.

2. **§4.7 Learning Progress, one clause.** `a play when a Hub tile is tapped` became
   `a play when a game opens from its Hub tile`. Phase 1 moved `recordGamePlay`
   behind the resolved load, so the old clause described a write that no longer
   happens on the tap itself. This is the only other PRD sentence the track made
   untrue; it is a five-word correction, not a restatement.

3. **§4.6 Play-time limits, inspected and left alone.** The two sentences that touch
   this track are still true: `Partly played minutes round up, so any game started
   charges at least a minute` and the banking on `when a new game starts` both
   describe a game that starts, and a game that never opens is simply not a start.
   No edit was needed, so none was made.

### `docs/TDD.md`

1. **§4.1 Shell scenes and the lazy registry.** The closing paragraph still claimed
   Hub tile taps do `void ensureSceneLoaded(this, tile.sceneKey).then(() => transitionToScene(...))`,
   which Phase 1 deleted. It now states the current hop: `HubScene` loads the scene
   before it commits to anything, `activateTile` unlocks audio on the gesture and
   hands the tile's index and rectangle to `openGame`, which awaits
   `loadSceneWithRetry(this, key)` and acts only on the result.
   A new paragraph documents `loadSceneWithRetry(scene, key, loaders = sceneLoaders, attempts = 2)`:
   a thin wrapper over `ensureSceneLoaded`; two attempts; resolves `true` once the
   scene is registered and `false` when every attempt failed; never rejects; a
   synchronous throw is caught exactly like a rejected import; one `console.warn`
   per failed attempt naming the scene key and the attempt; `ensureSceneLoaded`
   keeps its throwing contract for direct callers; `loaders` stays injectable so
   the retry path is tested through stub loaders.

2. **§4.6 Lifecycle and shutdown.** The normal game path line now reads
   `Hub tile → loadSceneWithRetry → transitionToScene → …`, and three paragraphs
   follow it:
   - **Ordering.** Only the audio unlock stays on the gesture; `openGame` awaits
     the load first, so `startPlaySession`, `recordGamePlay` and the
     nudge-or-`transitionToScene` branch are reached only after a load resolves
     `true`; a tap whose chunk never arrives charges no play time, records no play
     and shows no nudge.
   - **Failure and the cue.** A resolved `false` releases `grid.navLocked` — the
     flag `hub/gridBuilder` sets at `pointerup` before it calls `activateTile` — and
     raises the `GameLoadCue` over the tapped tile's rectangle. One cue object at a
     time, `show()` a no-op while active; tapping it destroys the cue and re-enters
     `openGame` with the same tile, so a retry opens through the same transition.
     Textless and silent, 96×96 hit floor at `CUE_DEPTH = 12` (above the tiles at
     depth 0, below `PlayTimeNudge` and the profile picker at 20 and `ParentLock`'s
     hold ring at 10000); static ring under reduced motion, one pulse tween
     otherwise.
   - **Lifetime, the cap and shutdown.** Destroyed before the fade into a game that
     loads, before Settings or the profile picker opens, on scene `shutdown`, and
     before a retry replaces it (`hideLoadCue()` is safe at any time). `openGame`
     re-checks the daily cap after the load resolves and before any charge, so a
     cue that outlived the cap destroys itself, releases the lock and returns
     uncharged. The `shutdown` handler sets `isShuttingDown` before tearing
     anything down and `openGame` returns at the top of its post-load path when it
     is set, so a late resolution neither transitions, nor raises a cue, nor throws.

3. **§5 Components, the opening sentence.** `Sixteen modules` became
   `Seventeen modules`, and `GameLoadCue.ts` is named beside `ArtLoadingCue.ts` as
   the second factory that returns a handle. Phase 2 added a seventeenth module to
   `src/components/`; leaving the count at sixteen would have been a false sentence
   introduced by this track. No subsection was added for it — the cue's geometry
   and lifetime live in §4.6, and the brief asked for no new sections.

4. **§7.1 The module list, unchanged.** §7.1 lists `src/game/` modules only. The
   four files these edits describe are `src/scenes/sceneRegistry.ts`,
   `src/scenes/HubScene.ts`, `src/components/GameLoadCue.ts` and
   `src/game/hub/gridBuilder.ts`. The one §7.1 row near them, `hubGrid.ts`, still
   describes the same responsibility — the grid orchestrator that delegates to
   `hub/gridBuilder` — because Phase 2 changed the `activateTile` argument list,
   not the grid's job. No row needed an edit, and none was invented.

### `docs/roadmap.md`

1. Known Issues: the `### A failed game-chunk load leaves the child with no feedback`
   entry (and its paragraph) is deleted. The other five entries are untouched.
2. Future Work: `6. Give a failed chunk load a visible failure path.` is deleted,
   since this track delivers it.
3. The survivors are renumbered `1..6` in file order — drag-board consolidation,
   storage schema version, install prompt scope, play-time banking, shared shuffle,
   repository hygiene. No item was reordered or reworded.
4. Both headings `## Known Issues` and `## Future Work / Roadmap` remain, which is
   what `validate-docs.js` asserts about this file.

## Verification

The chained command from the plan was denied by the harness as a whole
(`permission.rejected`), so each layer was run exactly as written in sequence.

| # | Command | Exit | Result |
| --- | --- | --- | --- |
| 1 | `pnpm check` | 0 | 252 files, 0 errors; the two pre-existing notices only — the non-null assertion at `src/__tests__/scenes/musicalMemoryScene.test.ts:294` and the biome schema-version info |
| 2 | `pnpm typecheck` | 0 | clean |
| 3 | `pnpm test -- --run` | 0 | 121 files / 2604 tests passed |
| 4 | `pnpm test:coverage` | 0 | 121 files / 2604 tests; 98.00 % statements, 92.02 % branches, 96.66 % functions, 98.73 % lines; gates 90/85/88/95 |
| 5 | `pnpm build` | 0 | 343 modules; shell `index-Dy8YMp5V.js` 140.93 kB (gzip 32.52 kB); Phaser `phaser-P1E8uaLi.js`; precache 54 entries / 1725.32 KiB |
| 6 | `node scripts/validate-bundle.js` | 0 | Phaser 1342.6 kB; shell 137.6 kB ≤ 200 kB |
| 7 | `node scripts/validate-pwa.js` | 0 | 16 passed / 0 failed; 42 chunks, 42 precached |
| 8 | `node scripts/validate-docs.js` | — | **denied** (`permission.rejected`), not retried — see Blockers |

Every layer is unchanged from Phase 2: 121 files / 2604 tests, the same coverage
figures, the same shell hash and byte size, the same precache count, the same
16/16 PWA result. That is expected, because this phase touched only Markdown.

One wording edit landed after this chain: the `docs/TDD.md` §4.6 ordering paragraph
now reads `every other side effect of a launch lives in openGame` rather than
`openGame is where every side effect of a launch lives`, because the audio unlock
deliberately stays on the gesture. The claim is the same and the sentence is now
literally true; it is a prose edit in a Markdown file, so no layer above can be
affected by it.

The chained form was not retried in any variant, per the brief.

## AC mapping

**AC-5 — each failed attempt produces one console warning naming the scene key, and
no storage write occurs.**
- The warning is stated in `docs/TDD.md` §4.1: *"Each failed attempt logs one
  `console.warn` naming the scene key and the attempt, because this is the only
  layer that knows a retry happened."*
- The absence of a write is stated twice in product terms: `docs/PRD.md` §1.5 step 4
  (*"A game that never opens charges no play time and records no play"*) and
  `docs/TDD.md` §4.6 (*"a tap whose chunk never arrives charges no play time,
  records no play and shows no play-time nudge"*). §6.1's storage-key table is
  untouched, so no key was documented as added either.

**AC-6 — two failing taps do not produce two cues, and shutdown with a load in
flight neither throws nor mutates the cueless state.**
- `docs/TDD.md` §4.6: *"The cue is one object at a time and `show()` is a no-op
  while it is active, so repeated failing taps cannot stack cues"*.
- `docs/TDD.md` §4.6: *"the `shutdown` handler sets `isShuttingDown` before it tears
  anything down, and `openGame` returns at the top of its post-load path when that
  flag is set, so a chunk that resolves after the Hub is gone neither transitions,
  nor raises a cue, nor throws."*

Supporting, for the parts of the phase contract the PRD carries: NFR-4's textless
rule and 96 px floor are in the PRD's *wordless retry ring* plus the TDD's
*no text and no sound* and *96×96 hit floor*; NFR-5's no-regression claim is the
unchanged test, coverage and build results above.

## What was deliberately not changed

- **`docs/TDD.md` §7.1's table** — no row describes a module this track changed in a
  way the row no longer covers (reasoning above).
- **`docs/PRD.md` §4.6** — no sentence there became false; the section was read and
  left alone.
- **`docs/PRD.md` §7.2 (shell and game chunks)** — its sentence about the lazy
  registry and the fetch before the crossfade is still accurate and is not the
  product-facing home for the failure path.
- **The roadmap's "checked against the code on 2026-10-22" preamble** — every entry
  that survives the deletion is still true as written, and this track did not
  re-check the other five.
- **`docs/CHANGELOG`-style release notes** — none exist for this change and the
  brief did not ask for one.
- **Any source, test or config file** — none was touched.

## Notes for the primary agent

- The PRD correction in §4.7 is the one change the brief did not spell out. I made
  it because the sentence would otherwise be false after Phase 1's ordering change;
  it is a single clause and easy to drop if the primary prefers.
- No documentation gap suggests a code defect. The docs now match the code as
  shipped at `3749da6` (Phase 2 checkpoint, plus the primary's CUE_DEPTH comment
  correction).

## Blockers

- `node scripts/validate-docs.js` — the harness returned `permission.rejected` for
  this command (the brief predicts this for phase subagents). Not retried, per the
  brief. By inspection the five checks are unaffected: no Markdown link or anchor
  was added or removed, the three game lists are untouched, both roadmap headings
  remain, and no document gained a Conductor path. The primary agent should run
  this layer to close the phase.

## Primary verification

Phase 3 is documentation only. The subagent reported every layer it was allowed to
run as green and was blocked only on `node scripts/validate-docs.js`, which the phase
harness denies to subagents; the primary ran that layer and the rest of the chain at
the phase HEAD.

| Layer | Result |
| --- | --- |
| Working tree | clean before the squash |
| Diff scope (`git diff --name-only 9643049..HEAD`) | `docs/PRD.md`, `docs/TDD.md`, `docs/roadmap.md`, `verification/phase-3.md` - exactly the Touches set plus evidence, 212 insertions / 21 deletions |
| `pnpm check` | exit 0 (252 files, only the two pre-existing findings) |
| `pnpm typecheck` | exit 0 |
| `pnpm test -- --run` | exit 0, 121 files / 2604 tests (unchanged from Phase 2, as expected for a docs-only phase) |
| `pnpm test:coverage` | exit 0, 98 / 92.02 / 96.66 / 98.73 |
| `pnpm build` | exit 0, precache 54 entries / 1725.32 KiB |
| `node scripts/validate-bundle.js` | exit 0, phaser 1342.6 kB, shell `index-Dy8YMp5V.js` 137.6 kB (<= 200 kB) |
| `node scripts/validate-pwa.js` | exit 0, 16 passed / 0 failed |
| `node scripts/validate-docs.js` | exit 0, all checks passed - the layer the subagent was denied |

### Document review against the shipped code

Read the whole diff rather than the summary. Every claim traces to code that Phase 1
and Phase 2 landed:

- PRD step 4 now carries the failure path in the parent-facing register: the Hub
  retries by itself, a failed retry leaves the rest of the Hub usable behind a
  wordless retry ring on the tapped tile, tapping the ring tries the same game, and
  a game that never opens charges no play time and records no play. That matches
  `openGame`'s ordering and `GameLoadCue`'s behaviour.
- TDD names `loadSceneWithRetry` as the wrapper that returns the outcome as a value
  (two attempts, never rejects, a synchronous throw is caught like a rejected
  import, one `console.warn` per failed attempt naming the key and the attempt) and
  keeps `ensureSceneLoaded`'s throwing contract for direct callers. The normal game
  path line now starts at `loadSceneWithRetry`.
- The TDD lifetime paragraph matches the code: destroyed before the fade, before
  Settings or the profile picker opens, on `shutdown`, and before a retry replaces
  it; `hideLoadCue()` is safe at any time; `openGame` re-checks the cap after the
  load and returns uncharged after destroying the cue and releasing the lock; the
  `shutdown` handler sets `isShuttingDown` before teardown so a late resolution
  neither transitions, raises a cue, nor throws.
- Depth description (96x96 hit floor at `CUE_DEPTH` 12, above the depth-0 tiles,
  below `PlayTimeNudge` and the picker at 20 and the `ParentLock` ring at 10000,
  static under reduced motion) matches `GameLoadCue.ts` and the corrected constant
  comment.
- Roadmap: the failed-chunk Known Issue is gone as a whole section, the matching
  Future Work item is gone, and the survivors renumber 1..6 in file order with no
  reordering and both required headings intact.

### Judgement calls accepted

1. The PRD 4.7 clause "a play when a Hub tile is tapped" became "a play when a game
   opens from its Hub tile". Phase 1 moved the record after the load, so the old
   sentence was no longer true; a five-word correction is the right response and it
   is kept.
2. TDD's component count went from sixteen to seventeen with `GameLoadCue` named
   beside `ArtLoadingCue`. This track added that module, so the count was stale
   rather than merely untouched; keeping it would have been a factual error.
3. No new TDD section or table-of-contents entry was added, and the 7.1 module table
   needed no change (it lists `src/game/` only, and the `hubGrid.ts` row still
   describes the same responsibility after the `activateTile` signature change).

### Acceptance criteria

- AC-5: the PRD states the retry, the wordless ring, the usable Hub and the uncharged
  failed tap; the TDD states the mechanism. Satisfied.
- AC-6: the roadmap no longer lists the failure path as a known issue or as future
  work. Satisfied.
