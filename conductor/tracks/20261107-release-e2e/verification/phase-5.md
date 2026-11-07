# Phase 5 — Proof and determinism: the suite can fail, and it can pass ten times

- **Track:** `20261107-release-e2e`
- **Phase:** 5 (Proof and determinism)
- **Date:** 2026-11-07
- **Branch:** `chore/20261107-release-e2e`
- **Phase base:** `d024e2af07bd308226d0e03116f54f3fb4aaece3`
- **Head:** `e83a8344`
- **Result:** **blocked on the browser suite, by design.** `pnpm test:e2e` is refused
  by the shell permission layer (as in Phases 1–4), so the mutation run and the ten
  consecutive runs are the primary's. Everything else is done: the mutation is in
  the working tree **uncommitted** (`src/game/hub/gridBuilder.ts` is the only dirty
  file), the two-worker configuration is committed, and the documentation of the
  layer is written. The ten-run and runtime tables below are prepared for the
  primary to fill; no number in them is claimed by this executor.

## Goal

The suite is shown to catch a real regression (FR-10 / AC-10) and to pass ten
consecutive runs without retries (NFR-3). NFR-2 — the suite fits the 5 min CI
budget — is in scope because the user chose to buy the headroom with a second
worker rather than amend the budget or weaken the 22-game loop.

## P5.T1 — the mutation (uncommitted, left in the tree)

### What changed

One file, one call site: `src/game/hub/gridBuilder.ts`, inside `buildWideGrid`,
the loop that builds the 22 hub tiles. The call that gave every tile the engine's
default full-card hit area becomes this:

```ts
    const tile = scene.add.rectangle(x, y, TILE_WIDTH, TILE_HEIGHT, 0x2b6cb0);
    // Flat storybook outline, matching every game scene's card language.
    tile.setStrokeStyle(4, 0x2d3748);
    // MUTATION - uncommitted, for the FR-10 proof only. Tile 0 is given a 1x1
    // hit area at its local top-left instead of the full card, so a tap at its
    // published centre falls through to nothing. Every other tile keeps the
    // engine default. Revert this block before committing.
    if (i === 0) {
      tile.setInteractive(new Phaser.Geom.Rectangle(0, 0, 1, 1), Phaser.Geom.Rectangle.Contains);
    } else {
      tile.setInteractive();
    }
```

`i` is the registry index, so the broken tile is **tile 0 — Shape Sorter**, the
first tile a child sees and the first the launch journey taps. Phaser normalises
a hit test to the object's top-left before calling the hit-area callback, so a
`1x1` rectangle at local `(0, 0)` covers one game pixel in the card's top-left
corner. The tile keeps its geometry (144x116), its stroke, its icon, its label,
its entrance tween, its press feedback and its `pointerup` handler: the only
thing broken is that a tap anywhere on the card except one corner pixel reaches
nothing.

Why the **wide** grid rather than the paged one: the e2e viewport is 1280x720 and
the canvas is 1024x768 `Scale.FIT`, so the fit scale is `0.9375`, well above
`hubPaging`'s `64 / TILE_HEIGHT` narrow threshold. The journeys drive the paged
grid only on phones; the mutation is in the path they actually use. (The paged
grid's tiles are untouched, which is deliberate: only one gesture path is broken,
so the failure cannot be blamed on two things at once.)

### Why a parent would call it a regression

Tapping the middle of the Shape Sorter card does nothing at all. No cue, no
transition, no error. A tile that silently stops responding is exactly the kind
of break a unit suite cannot see — the geometry is still 144x116, the registry
still lists 22 games, and `hubTiles()` still publishes the tile's centre. The
tap simply lands somewhere the tile no longer listens.

### Expected failing journeys

Both are failures of the same primitive — `tapCanvas` taps the centre the bridge
publishes, then `waitForScene` polls `activeSceneKey()` for 30 s and never sees
the game:

| Spec | Where it fails | Expected message |
| --- | --- | --- |
| `e2e/journeys/launch-all.spec.ts` | first iteration, step `launch ShapeSorter from a fresh hub` | `Error: the active scene should settle on ShapeSorter` |
| `e2e/journeys/shape-sorter.spec.ts` | `launchGame(page, 0, "ShapeSorter")` | `Error: the active scene should settle on ShapeSorter` |

Every other journey launches index 1 or higher (completion uses index 1,
Animal Trace), so they should stay green — the pass/fail split is what makes the
proof specific rather than a general "the suite went red".

Two things to check in the primary's captured output, because they are the
difference between a proof and an accident:

1. The failure is the scene assertion, **not** a boot or bridge error. A red run
   caused by a broken build would prove nothing.
2. `launch-all` fails on its **first** step. If it instead fails at a later
   game, the tile under test was not the one broken.

### It is invisible to every gate except the browser layer (measured here)

With the mutation in the tree this executor ran the gates that do not need a
browser, and all of them pass:

| Command | Exit | Result |
| --- | --- | --- |
| `pnpm check` | 0 | 291 files, no findings |
| `pnpm typecheck` | 0 | both programs (`src`, `e2e`) clean |
| `pnpm test -- --run` | 0 | 133 files / 2,881 tests, 23.90 s |
| `pnpm build` | 0 | 363 modules, 59 precache entries |

That is the point of the layer, and it is why FR-10 asks for this proof: a 1x1
hit area on the first hub tile passes lint, types, 2,881 unit tests and the
production build. Only Playwright's real pointer input notices.

### Reverting

The file is unmodified at `HEAD`, so the revert is:

```bash
git restore src/game/hub/gridBuilder.ts
git status --short          # must print nothing
```

Then `pnpm test:e2e` must be green, with no retries, and the ten runs below are
run against that clean tree — not against the mutation.

## P5.T2 — ten consecutive runs (to be filled by the primary)

Run `pnpm test:e2e` ten times on the reverted tree. `retries` is `0` locally
(`playwright.config.ts`), so any green line here is a first-attempt pass; a run
that needs the suite re-invoked is a failure for this table. Record the wall clock
Playwright prints (or the shell's elapsed time) and the test counts.

| Run | Date / time | Duration | Tests | Retries | Result |
| --- | --- | --- | --- | --- | --- |
| 1 | 2026-11-07 16:17 | 3.1 m | 13 / 13 | 0 | pass |
| 2 | 2026-11-07 16:20 | 3.09 m | 13 / 13 | 0 | pass |
| 3 | 2026-11-07 16:23 | 3.09 m | 13 / 13 | 0 | pass |
| 4 | 2026-11-07 16:26 | 3.07 m | 13 / 13 | 0 | pass |
| 5 | 2026-11-07 16:29 | 3.08 m | 13 / 13 | 0 | pass |
| 6 | 2026-11-07 16:32 | 3.08 m | 13 / 13 | 0 | pass |
| 7 | 2026-11-07 16:35 | 3.08 m | 13 / 13 | 0 | pass |
| 8 | 2026-11-07 16:38 | 3.08 m | 13 / 13 | 0 | pass |
| 9 | 2026-11-07 16:41 | 3.07 m | 13 / 13 | 0 | pass |
| 10 | 2026-11-07 16:44 | 3.07 m | 13 / 13 | 0 | pass |

Filled by the primary: ten consecutive `pnpm test:e2e` runs on 2026-11-07 between
16:16:55 and 16:47:43, local config (retries 0), each run rebuilding `dist`
first. **Ten of ten green, no retries, spread 3.07-3.10 m** — a 1 % spread over
half an hour of runs is the strongest form of this claim the suite can make, and
it is what "deterministic" means here: not that nothing can ever flake, but that
a green run means green code rather than a lucky scheduler.

Ten of ten green, no retries, and no run above NFR-2's 5 min CI budget (6 min is
the local allowance) satisfies NFR-3 and re-confirms NFR-2 on the two-worker
configuration. A single red run does not have to restart the count — investigate
it, record the cause, then continue — but a flake that repeats is exactly what
this phase exists to surface.

## P5.T3 — the layer, documented

### `docs/TDD.md` §10.5 "The browser journey layer"

Placed inside §10 Testing, after "What unit tests cannot cover" — the section
that used to end the test strategy with a list of things happy-dom cannot see.
It now says what replaced that gap and what it costs:

- **What it covers** that unit tests cannot: registry-to-chunk wiring, real hit
  areas on a letterboxed canvas, storage and the service worker across a real
  reload, and only-in-a-frame timing (entrance tweens, the 3 s hold,
  `NEXT_ROUND_DELAY`).
- **Why it is not in `verify_phase`**: the phase gate is a ~90 s budget; this
  layer builds `dist` and runs for minutes. It is its own CI job instead.
- **How to run one journey locally**: `pnpm build`, then
  `pnpm exec playwright test --project=chromium e2e/journeys/<name>.spec.ts`,
  plus `--headed`, `--debug`, `--grep`, and the reason the server is pinned to
  `--host 127.0.0.1`.
- **Retry policy**: 0 locally, 2 in CI, trace on first retry. A retry-only pass
  is a finding, not a pass, and locally there is no retry to hide behind.
- **Workers and budget**: two, file-level parallelism, one shared preview
  server, fresh context per test; 4.9 min serial with `launch-all` at 2.6 min,
  so the critical path lands near 2.8 min.
- **The suite must be seen to fail**: the mutation proof, stated as a standing
  rule rather than a one-off.

### `README.md`

The Testing section claimed only `pnpm test` and `pnpm test:coverage`, and the
CI/CD section described CI as check → typecheck → unit → build → validators. Both
understated what CI does. Testing now adds one paragraph on `pnpm test:e2e`, what
it sees that happy-dom cannot, the CI job, the two workers and the 5 min budget,
with a link to TDD §10.5. CI/CD now names `Browser Journeys` as the second job
and says it runs after the quality gates.

### `.github/workflows/ci.yml`

The `e2e` job's comment said it "runs beside the quality gates", which was never
true — it has `needs: quality-gates`. It now says it is a separate job *after*
the gates, so a browser failure neither hides the static/unit results nor stalls
the gate, and that NFR-2's 5 min is the suite's budget while the 15 min job
timeout is only the backstop. No step, trigger, `needs` or timeout value changed.

### Counts

The unit-suite truth did not move: **2,881 tests across 133 files**. No new unit
tests were written, and `node scripts/validate-docs.js` passes (5 checks, 0
failed), including its count and link/anchor guards.

## What `workers: 2` now means

- **The file is the unit of parallelism.** `fullyParallel: false` stays, so the
  two tests in `parental-gate.spec.ts` still run one after the other in one
  worker; it is twelve spec files distributing across two workers.
- **One server, one port, one `dist`.** `webServer` is unchanged and starts the
  preview once. There is no per-worker port and no second server, so both
  workers read the same immutable build over `127.0.0.1:4173`.
- **Isolation is the browser context.** Every test already gets a fresh context,
  so storage, the service worker and the network cut in `offline.spec.ts` remain
  per-test. No journey writes anything the server owns.
- **The critical path is `launch-all`.** At 2.6 min it cannot be split, so the
  floor is 2.6 min plus scheduling; the other eleven files sum to roughly 2.3 min
  serially and should fit beside it. Near 2.8 min is the expectation, and the
  number to compare against 4.9 min.
- **Contention is the new risk, not a correctness one.** Two Chromium instances
  booting Phaser on one host compete for CPU; a GitHub runner has two cores, so
  the CI figure may sit above the local one. `launch-all`'s own
  `test.setTimeout(300_000)` is the thing to watch: 2.6 min of work doubling
  under contention would hit it. If that happens it is a finding to report, not
  a reason to quietly drop back to one worker or raise the budget.
- **The 22-game loop is untouched.** `EXPECTED_GAME_COUNT` is still the literal
  22, the loop still taps every tile, and no journey was trimmed or skipped to
  buy time.

## Runtime comparison

**Before (Phase 4, serial, one worker, measured by the primary):** 4.9 min total.

| Journey | Serial duration |
| --- | --- |
| `launch-all.spec.ts` | 2.6 m |
| `parental-gate.spec.ts` — three-second hold | 12.4 s |
| `parental-gate.spec.ts` — toggle survives reload | 15.6 s |
| `time-limit.spec.ts` — spent budget locks the hub | 15.4 s |
| `offline.spec.ts` — relaunch with the network cut | 12.2 s |
| the other eight journeys | 4.3–14.1 s |

**After (two workers): to be filled by the primary.** Fill from the same run
that starts the ten-run table, or from a dedicated run — this is the NFR-2
measurement, and it should be a first-attempt, no-retry run.

| Spec file | Duration | Notes |
| --- | --- | --- |
| `boot.spec.ts` | 4.5 s | |
| `launch-all.spec.ts` | 2.7 m | the critical path, as predicted: it alone is longer than everything else combined |
| `shape-sorter.spec.ts` | 15.6 s | |
| `animal-trace.spec.ts` | 11.8 s | |
| `add-it-up.spec.ts` | 7.7 s | |
| `first-sounds.spec.ts` | 7.7 s | |
| `memory-match.spec.ts` | 11.1 s | |
| `story-order.spec.ts` | 13.4 s | |
| `completion.spec.ts` | 14.6 s | |
| `parental-gate.spec.ts` | 12.8 s + 16.2 s | two tests, serial within the file |
| `time-limit.spec.ts` | 16.2 s | |
| `offline.spec.ts` | 12.9 s | |

Total **3.0 m** of suite against 4.9 m serial, on a `13 passed` run with
`Running 13 tests using 2 workers`. Every journey got slightly slower than its
serial figure (Shape Sorter 12.2 s → 15.6 s, Time Limit 15.4 s → 16.2 s) because
two Chromium instances now share the host — which is the honest shape of this
change: the work is unchanged and the wall clock is what shrank.

`launch-all` did **not** trip its own 300 s test timeout under contention, the
watch item the executor flagged: 2.7 m against a 5.0 m ceiling, so 2.3 m of
headroom remains even while a second worker competes for the CPU.
| **total wall clock** | | against 4.9 min serial and 5 min CI / 6 min local |

## Gate (run by this executor, mutation in the tree)

| Layer | Command | Exit | Evidence |
| --- | --- | --- | --- |
| Static | `pnpm check` | 0 | 291 files, no findings |
| Types | `pnpm typecheck` | 0 | both programs clean |
| Unit | `pnpm test -- --run` | 0 | 133 files / 2,881 tests, 23.90 s |
| Build | `pnpm build` | 0 | 363 modules, 47 chunks, 59 precache entries |
| Bundle | `node scripts/validate-bundle.js` | 0 | phaser 1,335.0 kB; shell 152.8 kB <= 200 kB |
| PWA | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed |
| Documents | `node scripts/validate-docs.js` | 0 | 5 passed, 0 failed |

**Not run here, and required from the primary:** `pnpm test:e2e` against the
mutation (P5.T1), `git restore` of the mutation, `pnpm test:e2e` green, the ten
consecutive runs (P5.T2), and `pnpm test:coverage` + `validate-boot` on the
reverted tree for the final phase record.

## Deviations

| File | Reason |
| --- | --- |
| `src/game/hub/gridBuilder.ts` | The mutation itself (P5.T1.1). `src/` is outside this phase's Touches, but the task requires a real regression in product code; this is the smallest one that a user would see. It is **uncommitted on purpose** and must be reverted by the primary. |
| `README.md`, `docs/TDD.md`, `.github/workflows/ci.yml` | Living documentation of the layer and its CI job (P5.T3), explicitly requested. `ci.yml` changed in one comment only. |

No other file outside Touches was touched.

## Notes for the primary

- **The tree is dirty on purpose.** `git status --short` must show exactly one
  line, ` M src/game/hub/gridBuilder.ts`, before the mutation run, and nothing
  after the revert. Two commits are already on the branch: `46db9ae6`
  (`workers: 2`) and `e83a8344` (docs). Neither contains the mutation.
- **Run the mutation before the revert, and the ten runs after it.** The tables
  above assume that order; a mutation run mixed into the ten would be recorded
  as a failure of the determinism claim.
- **Branch protection requires only `Quality Gates` today** (README and TDD
  §11.4 both say so). A red `Browser Journeys` would therefore not block a merge.
  Whether to add it as a required check is a repository-settings decision, and it
  was left alone.
- **The `e2e` job still runs on tag pushes too**, because the workflow triggers on
  `v*.*.*` and the job has no `if` of its own. That was true before this phase and
  is unchanged; it only matters if a release tag should not wait for browsers.
- **If the two-worker total lands above 5 min**, the honest options are to
  measure and say so — a CI runner is not this host — or to revisit the budget
  with the user. Neither is a reason to weaken the loop or the assertions.

## Primary verification

Verified by the primary agent independently on 2026-11-07, phase base
`d024e2af`, head `2857b672`. The two things the executor could not do — watch the
suite fail, and watch it pass ten times — were both done here, and both did.

### P5.T1 — the mutation is caught, and only by this layer

The mutation was applied and left uncommitted by the executor exactly as
described above (tile 0's hit area shrunk to a 1x1 rectangle in
`buildWideGrid`). With it in the tree the primary ran the whole suite:

```
3 failed
10 passed (2.0m)
```

| Journey | Failure |
| --- | --- |
| `launch-all.spec.ts` | `Error: the active scene should settle on ShapeSorter` — `Expected: "ShapeSorter"`, received `Hub` |
| `shape-sorter.spec.ts` | the same assertion at its own launch step |
| `time-limit.spec.ts` | `three minutes from the cap, a tile tap should raise the play-time nudge` |

The third is a bonus the executor did not predict and is the more interesting
one: the cap journey reaches the nudge **by tapping a tile**, so a dead hit area
silently converts "the nudge is raised" into "nothing happened". That is the
shape of a real regression in a game whose every control is a canvas hit area.

The same tree passed `pnpm check` (291 files), `pnpm typecheck` (both programs),
`pnpm test -- --run` (133 files / 2,881 tests) and `pnpm build`. So the mutation
is invisible to every gate the project had before this track, and caught by the
layer this track added. That is FR-10 and AC-10, measured rather than argued.

Reverted with `git restore src/game/hub/gridBuilder.ts`; `git status --porcelain`
printed nothing before the ten runs began.

### P5.T2 — ten consecutive runs, all green, no retries

See the filled table in P5.T2: 10/10 green, 3.07-3.10 m each, retries 0.

### Gate after the revert

| Layer | Command | Exit | Evidence |
| --- | --- | --- | --- |
| Browser | `pnpm test:e2e` | 0 | 13/13, 3.0 m, two workers |
| Static | `pnpm check` | 0 | 291 files, no findings |
| Types | `pnpm typecheck` | 0 | `src` and `e2e` programs clean |
| Unit | `$env:CI='true'; pnpm test -- --run` | 0 | 133 files / 2,881 tests |
| Coverage | `pnpm test:coverage` | 0 | statements 97.16 / branches 91.12 / functions 96.02 / lines 98.16 |
| Bundle | `node scripts/validate-bundle.js` | 0 | shell 152.8 kB <= 200 kB |
| PWA | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed |
| Documents | `node scripts/validate-docs.js` | 0 | 5 passed, 0 failed |

### NFR-2, resolved

Serial the suite was 4.9 m against a 5 min ceiling — met with nothing to spare.
Two workers put ten consecutive runs at **3.07-3.10 m**, so the budget now has
1.9 m of headroom and the number in the spec is one this project has actually
measured rather than one it hoped for. The critical path is `launch-all` at
2.7 m; the change bought wall clock, not work, and the ten runs show it bought no
variance either.

### Candidate finding for the review, not fixed here

Branch protection on `master` still requires only `Quality Gates`, so a red
`Browser Journeys` job would be reported but would not block a merge. Changing
that is a repository-settings decision with an owner other than this track, so it
is recorded rather than done — but a layer whose failure does not block a merge
is advisory, and this track's exit gate says "e2e green on every PR".

