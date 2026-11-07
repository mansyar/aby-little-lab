# Phase 3 — Launch and round journeys

| | |
|---|---|
| **Track** | `20261107-release-e2e` — Browser Journey Suite |
| **Phase** | 3 — Launch and round journeys |
| **Date** | 2026-11-07 |
| **Branch** | `chore/20261107-release-e2e` |
| **Phase base** | `babf4a2c` |
| **Head** | `89966eff` |
| **Result** | **blocked on the last journey** — every gate this executor can run is green (lint, types, 2,869 unit tests, coverage, build, all four validators). `pnpm test:e2e` is refused by the shell permission layer here, so the primary runs it. Five runs have found four real defects, all fixed: `roundIndex()` reported the dot count rather than rounds completed (`f5e2a056`); a PWA toast drawn over the hub swallowed the first tile tap (`786f3df4`); the hub ignored taps while its tiles entered at scale 0 (`5108f0b3`); and after a back-hold return the profile chip opened on the hold's *release*, whose full-canvas overlay then ate the child's next press (`89966eff`). The fifth run had **eight of nine journeys passing**; only `launch-all` failed, at its second launch, and the fourth defect is the mechanism behind it. |

## What changed

| File | Why |
|---|---|
| `src/game/e2eBridge.ts` | **Deviation (approved extension).** `E2EBridge` gains `hubTiles(): E2ERoundTarget[]`; the private probe interface gains `e2eHubTiles?: () => E2ERoundTarget[]`; the accessor duck-types the hook exactly like `roundGeometry`. Empty array when the active scene publishes no hook, so the accessor is safe on game scenes. |
| `src/scenes/HubScene.ts` | **Deviation (approved extension).** New public `e2eHubTiles()` reads `this.grid.paged ? pageTileIndexes(this.grid.hubPage) : GAME_TILES.map((_, i) => i)` and maps `this.grid.attractTargets` to `{ id: String(indexes[slot]), x, y }`. The id is the registry index — the same key the journey loops — and the coordinates are the live tile rectangles the grid builder created, not a second layout formula. Read-only. |
| `src/__tests__/game/e2eBridge.test.ts` | Three tests: no hook → `[]`, no scene → `[]`, live value returned (and re-read after the hook changes). Frozen-key list updated. |
| `src/__tests__/scenes/hubScene.test.ts` | Two tests: the wide grid publishes 22 ids in registry order at `wideTileCenter(index, wideGridOrigin(1024, 768))`; a paged viewport publishes only the current page, ids keeping their registry index, with the new page starting one canvas width to the right (the slide-in the mock cannot animate). |
| `src/__tests__/helpers/phaserMock.ts` | **Deviation (test helper).** Mock factories now copy the factory's leading `x`/`y` onto the object, as Phaser does. Without it a scene reading `tile.x` under test got `undefined`, and the new hook published blank coordinates — a mock gap, not a product defect. |
| `src/scenes/GameSceneBase.ts` | **Defect fix.** New `protected completedRounds`, reset in `createProgressDots` and in the shutdown cleanup where `progressDots` is cleared, advanced only in `fillProgressDot`. See "The defect the first real run found". |
| `src/game/e2eBridge.ts` | **Defect fix.** `roundIndex()` reads the scene's `completedRounds` through the probe; the `alpha` heuristic and the `progressDots` probe entry are gone. |
| `src/__tests__/game/e2eBridge.test.ts` | **Defect fix.** The `roundIndex` cases drove fake dots' `alpha` — a fake that agreed with the bug — and now drive the counter; the no-counter case asserts 0. |
| `src/__tests__/scenes/gameSceneBase.test.ts` | **Defect fix.** Two tests: the counter advances exactly once per filled dot (while every dot keeps `alpha` 1, the observation that proves the old heuristic false), and the counter resets on shutdown. |
| `e2e/fixtures/canvas.ts` | The one place that converts game pixels to page pixels: `pageX = box.x + gameX * (box.width / 1024)`, `pageY = box.y + gameY * (box.height / 768)`, plus tap / drag / press / move / release / hold primitives and `canvasBox`. |
| `e2e/fixtures/game.ts` | `openHub`, `activeSceneKey`, `waitForScene`, `hubTiles`, `profileCount`, `stickerCount`, `roundIndex`, `roundGeometry`, `waitForRoundIndex`, `waitForPlayableRound`, `launchGame`, `returnToHub`, `tapTarget`, `collectErrors`. All waits poll bridge state. |
| `e2e/fixtures/trace.ts` | `traceCurrentPath(page, round)` — one continuous press, re-reading the shrinking waypoint tail after every move. |
| `e2e/journeys/launch-all.spec.ts` | P3.T1 — loops `GAME_REGISTRY`, asserts the roster is 22, asserts the hub publishes ids `0..21`, launches each tile, asserts the game is on round 0, holds back and waits for `Hub`. |
| `e2e/journeys/{shape-sorter,animal-trace,add-it-up,first-sounds,memory-match,story-order}.spec.ts` | P3.T2 and P3.T3 — three rounds each, one per mechanic family. |
| `e2e/journeys/completion.spec.ts` | P3.T4 — Animal Trace to its third path, sticker count 0 → 1, hub returns with no back hold. |
| `src/components/PwaToast.ts` | **Deviation (approved extension).** The toast records the canvas centre of the button that closes it — OK for an offline toast, Later for an update toast (`Update now` applies an update, so it is never the dismiss target) — and exposes it as `dismissPoint()`. The point is the geometry the constructor lays out; the toast never moves afterwards. |
| `src/components/PwaToasts.ts` | **Deviation (approved extension).** `dismissPoint()` relays the visible toast's point, or `null` when none is showing. One line: the liveness already lives in `this.toast`. |
| `src/scenes/HubScene.ts` | **Deviation (approved extension).** `e2eHubToast()` bridges `pwaToasts.dismissPoint()` into `{ button: { x, y } } | null`, alongside `e2eHubTiles()`. |
| `src/game/e2eBridge.ts` | **Deviation (approved extension).** `E2EHubToast` and `hubToast(): E2EHubToast | null`; the probe gains `e2eHubToast?`, and the accessor returns `null` when the active scene publishes no hook, so it is safe on game scenes. |
| `src/__tests__/components/PwaToast.test.ts` | Three tests: an offline toast reports the OK button's centre `(512, 140)`; an update toast reports Later `(622, 140)`, never Update now; the reported point equals the arguments the button was actually created with, so it cannot drift into a copy of a constant. |
| `src/__tests__/components/PwaToasts.test.ts` | Two tests: no dismiss point while nothing is showing; the point appears with the toast and is gone once its dismiss callback runs. |
| `src/__tests__/game/e2eBridge.test.ts` | Three tests: no hook → `null`, no scene → `null`, and the accessor follows the hook from showing to dismissed. Frozen-key list updated. |
| `src/__tests__/scenes/hubScene.test.ts` | One test: with no PWA bridge the hub reports no toast rather than leaving a journey to guess. |
| `e2e/fixtures/game.ts` | `hubToast(page)`, `dismissHubToast(page)` (tap the published button, poll for absence, at most two attempts with a "still on the hub" guard so a mis-tap fails loudly instead of being replayed), `openHub(page, { dismissToast })`, and the same dismissal after `returnToHub`. |
| `e2e/journeys/boot.spec.ts` | Leaves the toast up, asserts it is reported with its dismiss button, dismisses it, and asserts it is gone — so a panel that ate the next tap cannot pass silently. Also samples `hubReady()` in-page at the instant the hub becomes active and asserts it starts false, then asserts it reaches true. |
| `src/game/hubGrid.ts` | **Deviation (approved extension).** `pendingEntrances: number | null` plus an entrance `generation`. `beginEntrances(count)` returns the per-tile callback the builder calls when an entrance lands; `entranceSettled` is true only when the count reaches 0. `null` means no board is built, so nothing is tappable; `resetForVisit` and `destroy` invalidate, and a rebuild's generation change makes the replaced grid's callbacks no-ops. |
| `src/game/hub/gridBuilder.ts` | **Deviation (approved extension).** Both builds register their entrance count (`GAME_TILES.length`, the page's tile count) and settle one entrance in the same `onComplete` that attaches press feedback, so the flag cannot drift from the moment a tile becomes hittable. |
| `src/scenes/HubScene.ts` | **Deviation (approved extension).** `e2eHubReady()` returns `this.grid.entranceSettled`, next to `e2eHubTiles()`/`e2eHubToast()`. |
| `src/game/e2eBridge.ts` | **Deviation (approved extension).** `hubReady(): boolean` with an `e2eHubReady?` probe hook; false in any scene that does not publish it. |
| `src/__tests__/game/hubGrid.test.ts` | Three tests: not ready before a build and only ready when the last of 22 entrances lands; a rebuild is not marked ready by the replaced grid's 22 stale entrances; a revisit and a destroy both go back to not ready. |
| `src/__tests__/game/e2eBridge.test.ts` | Three tests for `hubReady`: no hook → false, no scene → false, follows the hub from entering to settled. Frozen-key list updated. |
| `src/__tests__/scenes/hubScene.test.ts` | One test through the real grid: the probe reports not ready while the mock tween manager holds the entrances, and ready once every captured `onComplete` runs. |
| `e2e/fixtures/game.ts` | `hubReady(page)`, `waitForHubReady(page)`; `openHub`, `launchGame` and `returnToHub` wait for it before any tap, so no journey ever taps a board that is still entering. `waitForHubReady` samples readiness twice, a couple of animation frames apart, and only accepts a value that survived both — a single `true` can be withdrawn by the rebuild that follows a return. |
| `e2e/fixtures/game.ts` | **Round 4.** `hubReadySettled(page)` samples `hubReady()` inside the page, then again after two `requestAnimationFrame`s, and `waitForHubReady` polls that instead of the raw read. No duration is guessed: a board still entering reports `false` for about a second, so the extra frames cost nothing on the honest path. |
| `src/components/ProfileChip.ts` | **Defect fix (round 5).** The chip opens only on a release it took a press for: `pointerdown` sets `pressed`, `pointerup` requires it and clears it, `pointerout`/`pointercancel`/`close()` clear it. Phaser reports an object's `pointerup` to whatever is under the pointer, and the chip shares the top-left corner with the back button. See "The fifth real run found the chip opening on a stray release". |
| `src/__tests__/components/ProfileChip.test.ts` | One test: a release with no press on the chip does not open the picker and does not call `onOpen`. The shared `tap()` helper now fires a full press instead of a release alone. |
| `src/__tests__/helpers/sceneFlowHarness.ts` | `triggerPointerdownOn` beside `triggerPointerupOn`, so a scene test can model a press on an object that requires one. |
| `src/__tests__/scenes/{navigation,hubPlayTime,hubScene,hubSceneLoad}.test.ts` | Their chip taps now fire a press. The fakes had modelled a bare release, which was the same simplification the chip's code was making — they agreed with the bug. |
| `e2e/journeys/launch-all.spec.ts` | Each iteration is a named `test.step`: the first is "from a fresh hub", every later one is "with one tap after the held return", so the return-then-tap pairing is asserted by name rather than incidentally. |
| `README.md`, `docs/TDD.md`, `docs/perf-baseline.md` | **Deviation (mandatory).** `validate-docs` derives the suite counts from the tree; the eight new unit tests move the truth to 133 files / 2,869 tests and coverage to 97.14 / 91.18 / 96.00 / 98.15. |

## The bridge extension

`hubTiles()` was the first production-adjacent change, and it repeats the
`roundGeometry` shape: a read-only accessor, a one-way type-only import in the
scene, inert without `?e2e=1` because `initE2EBridge` returns before touching
`window`. It publishes the tile rectangles the hub actually created
(`grid.attractTargets`, in creation order) with the registry index as the id, so
the journey matches tiles by registry identity rather than by position — the
only mapping that stays correct across the wide and paged layouts. `hubToast()`
and `hubReady()` are the same shape: both answer from state the hub already
owns, and neither adds a write path.

Unit coverage: twenty-three tests beyond the baseline — three for `hubTiles`, two
for the hub's published tile positions, two for the round counter (which also
replaced the two `roundIndex` cases that drove fake `alpha`), three for the
toast's dismiss geometry, two for the toast panel, three for `hubToast`, one for
the hub's toast publication, three for entrance readiness, three for `hubReady`
and one through the hub for its readiness probe, plus one for the chip's press guard
and one more through the hub's e2e suite. Coverage sits at 97.14 statements,
91.18 branches, 96.00 functions, 98.15 lines. Shell is 151.9 kB of the 200 kB gate.

## The fifth real run found the chip opening on a stray release

The primary's isolating experiment: after a held return the hub swallowed exactly
one press **anywhere on the canvas** — a fast tap, a slow tap, a tile or empty
space, all the same; the next press always worked. That ruled out every app-level
gate one by one, because each is cleared when the visit starts:
`grid.resetForVisit()` clears `navLocked` (and a lock left set could not be
cleared by a press the guard it feeds had already refused), the launcher's
`beginVisit()` clears the in-flight flag, `playTime.beginVisit()` clears the
time-up state, and `navigatingScenes` is deleted on the scene's `shutdown`.

The mechanism is the shape of the gesture, not a flag. `ParentLock` navigates on a
**timer** (`DEFAULT_HOLD_DURATION` 3000 ms), so the back control fires while the
finger is still down; the physical release arrives about 400 ms later, after the
Hub has already been created. Phaser reports an object's `pointerup` to whatever
sits under the pointer, with no requirement that the press began there. The
profile chip is created at `AVATAR_CHIP_INSET + AVATAR_CHIP_HIT / 2` = **(68, 68)**
— the exact centre of the back control's 96 px hit square. So the stray release
opened the profile picker, whose dim overlay spans the whole canvas at
`PICKER_DEPTH` and is interactive: the child's next press closed the overlay
instead of reaching a tile. One press, then everything normal.

The fix is on the chip, where the wrong inference lives: a release counts as a tap
only when that chip took the press (`pressed` set on `pointerdown`, required and
cleared on `pointerup`, cleared on `pointerout`/`pointercancel`/`close`). The
suite's fakes had fired a bare `pointerup` at the chip, which is precisely the
simplification the production code was making — they agreed with the bug, the same
way the fake progress dots agreed with the `roundIndex` defect. The test helpers
now fire a real press, and `launch-all` names the return-then-tap pairing in its
step titles so the sequence is asserted rather than incidental.

This is the third trigger of the product finding recorded above: a child who
returns from a game and taps a tile once gets nothing. Unlike the entrance delay,
this one was worth fixing here because the app was inferring a tap from a release
it never saw the start of.

## The third real run found the hub ignoring taps while its tiles entered

Five journeys still failed, but the symptom had moved: the tile tap landed, and
nothing happened. The primary measured the same tile with only the wait changing:

```
wait    0 ms -> Hub
wait  500 ms -> Hub
wait 1500 ms -> Hub
wait 3000 ms -> StoryOrder
```

A vertical sweep down one column, tapping every 700 ms, only reached a row-1 tile.
That is the entrance animation, not a dead tile. `animateEntrance` starts each
tile at scale 0 and grows it over `ENTRANCE_DURATION` with a 40 ms stagger per
tile, so the last tile of the 6x4 grid does not reach scale 1 until about
`300 + 21 * 40 = 1,140 ms` after the build. Phaser's hit test transforms the
pointer into object space and divides by scale, so a tile at (or near) zero scale
is not hit at all — the tap passes through to nothing. `attachPressFeedback` is
attached in the same `onComplete`, which is why input only "wakes up" at the end
of the stagger.

The fix is a published readiness signal rather than a sleep. `HubGrid` counts the
entrances it starts and reports settled when the last one lands; a rebuild bumps
a generation, so entrances belonging to a page or viewport that no longer exists
cannot mark the new board ready. `HubScene.e2eHubReady()` and `bridge.hubReady()`
expose it, and `openHub`, `launchGame` and `returnToHub` poll it before any tap.
Nothing in the suite now waits a duration for the board: the wait is the state
that makes a tap possible.

**Product finding for the roadmap (Phase 4/6 territory, not fixed here).** The
hub is genuinely unresponsive for the first ~1.1 s after it appears — more on a
slow device, and the primary measured a ~3 s window where taps did nothing. A
fast three-year-old taps the first tile they see and nothing happens; the tap is
not buffered, and the entrance tween is not interruptible. That is a real
usability issue in the hub, not a test artefact. This phase only stops the suite
from mistaking it for a dead tile.

The boot journey asserts the flag in both directions, but with a twist that keeps
the assertion honest instead of racy: the *first* sample is taken inside the page
at the exact moment the hub becomes the active scene, in a single round trip. The
entrance takes over a second of tween time, and `create` builds the grid
synchronously as the scene activates, so that first sample cannot arrive after
the board settled — sampling it from the driver could.

## The fourth real run: the returning hub replays its entrance

With the toast gone and readiness published, the suite reached eight of nine
journeys — boot, Shape Sorter, Animal Trace, Add It Up, First Sounds, Memory
Match, Story Order and completion. Only `launch-all` failed, and not at its
first launch: the second tile tap after a return did nothing.

Two separate facts are involved, and only one of them is a fixture defect.

**The returning hub replays its entrance — confirmed, and it is the same
product finding.** `HubScene.create()` runs on every visit
(`transitionToScene` calls `scene.scene.start("Hub")`, which boots a shutdown
scene, so `create` runs again). It calls `this.grid.resetForVisit()` and then
`buildWideGrid()` (or `buildPageGrid(0)`), and `buildWideGrid` always calls
`animateEntrance`; there is no "returning visit" shortcut anywhere in
`gridBuilder.ts`. So a child who comes back from a game and taps immediately
gets nothing for another ~1.1 s. That is the same usability issue recorded
above, now with a second trigger — **not redesigned in this track**, as
instructed; the hub's entrance belongs to the hub phase.

**The wait could accept a reading that was about to be withdrawn.** The
journey's poll is a driver-side read: `hubReady()` is evaluated, the value
comes back `true`, and only then does the tap go out. Between those two events
the hub can rebuild — a return, a viewport flip, a page flip — and the `true`
that was just read belonged to the board that is being replaced. The fix is on
the fixture side only, because the flag itself is correct: `waitForHubReady`
now polls `hubReadySettled`, which samples inside the page and requires the
value to hold across two animation frames before returning `true`. A rebuild
in the same or the next frame is therefore rejected and the poll keeps waiting.
Two frames is not a guessed duration: it is the shortest window in which a
withdrawn value can differ from a held one, and the honest path is unaffected
because a board still entering reports `false` for about a second.

**What the code review says about the *stale grid* version of the diagnosis,
recorded because it did not hold up.** The diagnosis as first stated was that
the scene key flips to `Hub` while the previous visit's ready grid is still
active, so the poll reads its `true`. That specific window cannot exist:
`bridge.activeSceneKey()` reads `game.scene.getScenes(true)[0]`, and
`SceneManager.getScenes(true)` filters on `Systems.isActive()`, which is
`settings.status === CONST.RUNNING` (`node_modules/phaser/src/scene/Systems.js`
lines 613-616). `RUNNING` is assigned in `SceneManager.create`
(`SceneManager.js` line 644) **after** `scene.create.call(...)` returns (line
625), and `HubScene.create` is where `resetForVisit()` invalidates the flag.
So the first moment the bridge can report `Hub`, the flag is already `false`.
What remains real is the general shape the guard addresses — a `true` that a
rebuild withdraws while the driver is between reading and tapping — which is
why only the fixture-side guard was implemented and the flag is unchanged.

## The second real run found a toast over the hub

Five journeys — `launch-all`, `add-it-up`, `first-sounds`, `memory-match`,
`story-order` — failed inside `launchGame` with the scene still `Hub`. One cause:
on a first visit the service worker activates, so `PwaToasts` shows "Ready to
play offline!" — a panel at `(512, 100)` with a single OK button at `(512, 140)`
— drawn *inside the canvas*, above the tiles. Every journey gets a fresh browser
context, so every journey is a first visit and every journey saw it. The tap
went to the panel instead of the tile, and a live tile looked dead.

The fix keeps the rule that made the earlier journeys honest: the suite taps
geometry the app publishes, never a guessed point. A blind tap at `(512, 140)`
would land on a tile on any visit without a toast, so the suite would pass for
the wrong reason. Instead the toast reports where its dismiss button is, the
panel relays it while one is showing, and the hub publishes it through the same
probe the tiles use. `openHub` and `returnToHub` dismiss the toast by tapping
that button — which is what a parent does — and the boot journey asserts the
toast is *reported* while up and *absent* after the tap, so it cannot regress
into a panel that quietly eats taps.

Two judgement calls worth recording: the published point is the dismiss action
(`Later` on an update toast), never `Update now`, because applying an update
reloads the page and would end the journey; and `dismissHubToast` retries at
most once, guarded by "still on the hub", because the toast scales in and a tap
in its first frame cannot hit it — while a tap that somehow reached a tile must
fail rather than be replayed.

## The defect the first real run found

`roundIndex()` was wrong, and only a real launch could show it. Shape Sorter
reported 3 before its first drop.

The bridge counted progress dots whose `alpha === 1`. That looked right from the
source: `createProgressDots` creates dim dots with `0.3`, and `fillProgressDot`
calls `setAlpha(1)`. But `this.add.circle(x, y, radius, color, 0.3)` sets the
shape's **fill** alpha — the game object's `alpha` is 1 from the moment it is
created, and `setAlpha(1)` was already a no-op on a value that never moved. So
`dots.filter((dot) => dot.alpha === 1)` matched every dot: the accessor reported
"rounds in the game", not "rounds completed", and every journey polling it was
measuring the wrong thing.

The unit tests did not catch it because the fakes set `alpha` on plain
`{ alpha: number }` objects. The fake replicated the *assumption*, not Phaser, so
it agreed with the bug — a reminder that a hand-built fake of an engine detail
proves only that the code matches the fake.

The fix does not read a Phaser implementation detail at all. `GameSceneBase` owns
the truth: `completedRounds` starts at 0, resets when the dots are rebuilt and on
shutdown, and advances only inside `fillProgressDot`, so the count and the
visible fill cannot drift apart. The bridge reads that field through the same
scene probe it uses for geometry.

Every call site fills sequentially by an index that equals the count so far —
`ChoiceRoundScene` and `MemoryMatchScene` by `roundIndex`, `ShapeSorterScene` by
`roundIndex`, `AnimalTraceScene` by `completedPaths - 1`, `MusicalMemoryScene` by
`roundCount` before its increment, `WordBuilderScene` by `wordIndex` before its
increment — so no scene fills a dot by index out of order, and one increment per
fill is exactly one per completed round.

## Verification

| Check | Command | Exit | Result |
|---|---|---|---|
| Lint + format | `pnpm check` | 0 | 287 files checked, no fixes. |
| Types | `pnpm typecheck` | 0 | `tsc --noEmit` and `tsc --noEmit -p e2e/tsconfig.json` clean, so the specs are type-checked in the e2e program. |
| Unit | `pnpm test -- --run` | 0 | **133 files / 2,869 tests passed**, 21.72 s. Vitest still collects only `src/__tests__/**/*.test.ts`. |
| Coverage | `pnpm test:coverage` | 0 | Statements 97.14 % (5897/6070), branches 91.18 % (1613/1769), functions 96.00 % (1297/1351), lines 98.15 % (5487/5590). All thresholds met. |
| Build | `pnpm build` | 0 | 363 modules; `index-BlOsQn9y.js` 155.56 kB, `phaser-B_vcVLyb.js` 1,367.08 kB, 59 precache entries. |
| Bundle | `node scripts/validate-bundle.js` | 0 | `PASS: shell entry index-BlOsQn9y.js = 151.9 kB (<= 200 kB)`; Phaser vendor chunk 1335.0 kB. |
| PWA | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed (47 chunks, 47 precached). |
| Docs | `node scripts/validate-docs.js` | 0 | 5 passed, 0 failed after the count refresh to 133 files / 2,869 tests and 97.14 / 91.18 / 96.00 / 98.15. |
| **Journeys** | `pnpm test:e2e` | **—** | **Blocked for this executor:** `permission.rejected: Permission denied: shell`. Five runs: the first confirmed launch and canvas mapping and exposed the `roundIndex` defect; the second passed boot, Shape Sorter, Animal Trace and completion and exposed the toast; the third exposed the entrance delay on five journeys; the fourth passed eight of nine, failing only `launch-all` at its second launch; the fifth isolated that failure to a single swallowed press after a held return and exposed the chip defect. Not yet re-run with the chip fix. |

## Per-assertion truth (first execution partially confirmed by the primary)

| Journey | Assertion on state, not on "nothing threw" |
|---|---|
| boot (Phase 2) | bridge object exists only with `?e2e=1`; scene settles on `Hub`; canvas keeps the 4:3 box; **the hub reports not ready at the instant it becomes active and ready once its tiles have entered**; **the offline-ready toast is reported with a dismiss button, and is gone after that button is tapped**. |
| launch-all | one default profile; `GAME_REGISTRY` is 22; hub ids are `0..21` in order; each launch lands on the tile's own `sceneKey`; each game reports round 0; each back hold returns to `Hub`; no page or console errors. **Every launch after the first is a single tap on a hub reached by the held return, named as its own `test.step`, so the press that the chip used to steal is the assertion.** |
| Shape Sorter | each round publishes >1 target with unique ids; every target is dragged onto the slot with the same id; dots go 1 → 2 → 3; no errors. |
| Animal Trace | the waypoint tail strictly shrinks on each accepted move; dots go 1 → 2 → 3; no errors. |
| Add It Up | exactly one published target per round; tapping it fills that round's dot, three times. |
| First Sounds | exactly one published target per round; tapping it fills that round's dot, three times. |
| Memory Match | every id has exactly two cards; each pair is tapped through; dots go 1 → 2 → 3. |
| Story Order | slots and targets share ids, both unique and >1; every panel is dragged into its slot; dots go 1 → 2 → 3. |
| completion | sticker count starts at 0, becomes exactly 1 when the third path completes, survives the auto-return, and the scene reaches `Hub` without the back hold. |

## Acceptance

| Item | Status |
|---|---|
| FR-2 / AC-2 — every one of the 22 games launches from the hub and returns by back navigation | **launch, toast, readiness, the returning-hub wait and the stray-release chip defect all fixed; awaiting a re-run** — the primary's fourth run passed eight of nine journeys, failing at the second launch, whose mechanism is the fifth defect (`89966eff`). |
| FR-3 / AC-3 — three rounds completed on six sampled games, one per mechanic family, by real pointer input at bridge coordinates | **met in the primary's fourth run** — all six three-round journeys pass |
| FR-4 / AC-4 — winning awards a sticker, increments the stored count, returns to the hub | **journey passes in the primary's run** (completion, sticker 0 → 1, auto-return) |
| NFR-4 — existing gates unaffected | **met** — unit suite, coverage thresholds and all four validators pass. |
| NFR-5 — e2e code type-checked and linted | **met** — `pnpm typecheck` and `pnpm check` cover `e2e/**`. |

## Notes for later phases

- **Runtime risk.** `launch-all` is inherently slow: 22 launches × a 3.4 s back
  hold each. The test sets its own 300 s timeout; the whole suite still has to
  fit the 5-minute CI budget, so Phase 5 should record real per-journey
  durations before anyone tightens it. If the budget is tight, the honest trim
  is the back hold count, not the roster.
- **The back control is a 3-second hold**, not a click, and moving the pointer
  out of the 96 px square cancels it. `holdCanvas` presses the canvas centre of
  the square and never moves until release.
- **Round waits are geometry-based.** `waitForPlayableRound(page, n)` requires
  `geometry.round === n` *and* a non-empty target list, which covers Shape
  Sorter's 1.2 s, Animal Trace's 1.0 s and the 700 ms `NEXT_ROUND_DELAY` without
  sleeping on any of them.
- **Animal Trace publishes only the unfinished tail** (`pathPoints.slice(next)`),
  so the loop re-reads after every move and asserts the tail strictly shrinks —
  a stalled trace fails instead of hanging.
- **Story Order reports live panel positions.** A placed panel reports its slot
  position, so the drag loop re-reads geometry before each drag rather than
  reusing the round-opening snapshot.
- **Memory Match cards share an id per pair**; the journey groups by id and
  asserts each group is exactly two cards. Taps target different cards, so the
  180 ms flip tween never covers the pointer.
- **The third round of the three-round games ends the game.** `completedRounds`
  reaches 3 and the scene auto-returns 3 s later; the round poll runs immediately
  after the last drop, well inside that window. If it ever flakes, poll the
  sticker count instead and treat the round counter as implied — but that
  weakens the three-round evidence, so prefer raising the poll cadence.
- **`roundIndex()` is a counter, not a rendering read.** It reports how many
  rounds the active scene has finished this visit and nothing about how the dots
  look; a scene that never calls `fillProgressDot` reports 0 forever, as it
  should.
- **Environmental failures look like journey failures.** The primary's first run
  reported "received Hub" after a tile tap; with a clean `dist` and no stale
  preview the same tap reaches the scene. Phase 5's determinism runs should start
  from a removed `dist` so a stale artifact cannot masquerade as a broken
  journey.
- **A release is not a tap, and Phaser will tell an object it was one.**
  `ProfileChip` opens only on a release it took a press for, because
  `ParentLock` navigates on a timer and the hold's release lands on the returning
  hub at (68, 68) — the back control's centre is the chip's centre. Any future
  control that acts on `pointerup` alone inherits the same hazard: a gesture that
  began in the previous scene arrives as a bare release. Game cards and pieces act
  on `pointerdown`, so they are safe; the hub's tiles act on `pointerup` and sit
  below the corner, which is why only the chip was affected.
- **The hub raises a PWA toast on every first visit.** `dismissHubToast` is part
  of `openHub` and `returnToHub`, so no journey can be blocked by it. It taps
  only while the bridge reports a toast, so it cannot wander onto a tile; the
  boot journey is the one place that keeps it up on purpose, to prove it is
  reported. `hubToast()` is null outside the hub.
- **The hub ignores taps until its tiles finish entering (~1.1 s, longer under
  load), and it replays that entrance on every visit, including the return from a
  game.** `waitForHubReady` is part of `openHub`, `launchGame` and `returnToHub`;
  a journey that taps the board directly must wait for it first. This is also a
  real product observation — a fast child returning from a game taps and nothing
  happens — and belongs on the roadmap for the hub, not in this track.
- **Readiness must hold, not merely be observed once.** `waitForHubReady` polls
  `hubReadySettled`, which requires the value across two animation frames. A
  driver-side read can be true and then be withdrawn by the rebuild that follows
  a return; the same shape applies to a resize or a page flip. A journey that
  reads `hubReady()` directly gets the raw value and must not treat a single
  `true` as permission to tap.
- **`hubReady()` is false in game scenes**, like `hubTiles()`, because only the
  hub publishes either. Never use it as a "boot finished" signal.
- **`hubTiles()` is empty outside the hub** by design; never use it to assert a
  tile still exists after leaving.

## Primary verification

Verified 2026-11-07 by the primary agent. Phase base `babf4a2c`, head `808473b3`.
The executor could not run `pnpm test:e2e` (shell permission layer, the same wall
as Phase 2), so every journey run in this track was executed by the primary.

**The suite went from 1 of 9 passing to 9 of 9 passing across five rounds. Each
round was one real defect, found only because the suite was actually run. None
of them was visible to 2,869 unit tests, Biome, tsc or the build:**

| Round | Symptom | Cause | Fix |
|---|---|---|---|
| 1 | 8 of 9 failed, all reporting the scene stayed `Hub` | `roundIndex()` read dot `alpha`, but the dots are dimmed with `fillAlpha`, so it reported the round *count* | explicit `completedRounds` counter in `GameSceneBase` (`f5e2a056`) |
| 2 | Same 8 failed | the "Ready to play offline!" toast is a canvas panel that swallowed the first tile tap | publish the toast's dismiss point, tap it for real (`786f3df4`) |
| 3 | Same 8 failed | the hub ignores input until the entrance stagger finishes (~1.1 s, measured up to 3 s under load) | publish `hubReady()`, wait on it (`5108f0b3`) |
| 4 | 8 passed, `launch-all` failed at its second game | readiness sampled once while the returning hub was rebuilding | readiness must hold across two frames (`2c2bfe27`) |
| 5 | Same single failure | the back-hold navigates on a timer, so the finger's release arrives on the new hub and lands on the profile chip at the same (68, 68); the picker overlay then ate the next press | chip opens only on a release it took a press for (`89966eff`) |

Round 5 is the one worth keeping. It was a **shipping defect**, not a test
artefact: a child who holds the back button and then taps a game got nothing the
first time, because the release of the hold opened the profile picker. The
journey that found it (`launch-all`, titled "with one tap after the held
return") now asserts that pairing directly.

**Gate:**

| Check | Command | Result |
|---|---|---|
| Journeys | `pnpm test:e2e` | exit 0 - 9 passed in 4.0 m (launch-all alone 2.7 m) |
| Static | `pnpm check` | exit 0 - 287 files, no fixes |
| Static | `pnpm typecheck` | exit 0 - both programs (`src` and `e2e`) |
| Unit | `CI=true pnpm test -- --run` | exit 0 - 133 files / 2,869 tests |
| Coverage | `CI=true pnpm test:coverage` | exit 0 - 97.14 / 91.18 / 96.00 / 98.15 |
| Bundle | `node scripts/validate-bundle.js` | exit 0 - shell 151.9 kB <= 200 kB, phaser 1335.0 kB |
| PWA | `node scripts/validate-pwa.js` | exit 0 - 16 passed |
| Documents | `node scripts/validate-docs.js` | exit 0 - 5 passed |

**Runtime against NFR-2 (5 minutes in CI):** 4.0 minutes on this host, with
`launch-all` consuming 2.7 of them because each of the 22 launches pays the
3.4 s parental-hold return plus a full hub entrance. It fits with a minute to
spare on an idle host. Phase 5 must measure it under load and decide whether the
loop is trimmed (for example a shorter hold) rather than discovering it in CI.

**Product findings recorded here for the roadmap, deliberately not fixed in this
track:**

1. The hub ignores input for about a second after it appears, longer under load,
   and a returning hub replays that entrance every time. A tap in that window is
   neither buffered nor does it interrupt the tween.
2. The back control navigates on a timer while the finger is still down, which is
   how the stray release reached the profile chip. The chip now refuses a release
   it did not press, so the symptom is gone, but a parent who holds the back
   button still has their release delivered to whatever sits at that point on the
   hub.

