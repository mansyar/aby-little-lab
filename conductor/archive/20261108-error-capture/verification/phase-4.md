# Phase 4 verification - Proof, and the record

Track: `20261108-error-capture`
Branch: `feat/20261108-error-capture`
Phase: 4 of 4
Covers: FR-13, FR-14, NFR-2, NFR-4, NFR-6, AC-10, AC-11
Commits: `839bbed3` (journey + bridge widening), `aa0a52d7` (documents)

## Commands

| # | Command | Exit | Result |
|---|---|---|---|
| 1 | `pnpm check` | 0 | 316 files checked, no fixes needed |
| 2 | `pnpm typecheck` | 0 | `tsc --noEmit` and `tsc --noEmit -p e2e/tsconfig.json`, both clean |
| 3 | `CI=true pnpm test -- --run` | 0 | **144 files / 3,149 tests** passed (was 144 / 3,143; +6) |
| 4 | `pnpm test:coverage` | 0 | statements **97.39** (6546/6721), branches **92.02** (1973/2144), functions **96.36** (1432/1486), lines **98.33** (6083/6186) - all above 90/85/88/95 |
| 5 | `pnpm build` | 0 | shell entry `index-ho_FT1Dj.js` 176.68 kB as Vite prints it, 45.21 kB gzip; 47 chunks; precache 59 entries / 1770.03 KiB |
| 6 | `node scripts/validate-bundle.js` | 0 | shell entry **172.5 kB <= 200 kB**; Phaser vendor chunk present |
| 7 | `node scripts/validate-pwa.js` | 0 | 16 passed, 47 chunks precached, 0 failed |
| 8 | `node scripts/validate-docs.js` | 0 | 5 checks passed, including the living-docs suite truth (144 files / 3,149 tests) |
| 9 | `pnpm test:e2e` | **NOT RUN (denied)** | denied in this environment; see `## Notes` |

One `pnpm check` run failed before it passed: Biome reported a trailing blank
line in `e2e/node-env.d.ts` after the first edit (exit 1). The line was removed
and the command re-run to exit 0. No formatting was applied by hand beyond that.

## The journey

`e2e/journeys/crash.spec.ts`, `test.setTimeout(120_000)`, two tests.

| Step | What it proves | Assertion |
|---|---|---|
| 1 | the built artifact boots | `openHub(page)` - the fixture does the `?e2e=1` navigation |
| 2 | the crash is real, and raised inside the page | `page.evaluate(() => { setTimeout(() => { throw new Error("journey crash probe"); }, 0); })` - a throw in a timer reaches `window.onerror` as an `ErrorEvent`; nothing in the bridge can throw |
| 3 | the handler ran, recorded, and replaced the broken scene | `expect.poll(activeSceneKey).toBe("Recover")`, 10 s |
| 4 | the card is up and the tap is the card's own layout | `recoverState(page)` returns the published `button`; `tapCanvas` on it; `Promise.all([page.waitForEvent("framenavigated"), tap])` then `settleHub(page)` - **no `page.reload()` anywhere in the file** |
| 5 | the app still works after a real crash and reload | `profileCount === 1`; `launchGame(page, 0, "ShapeSorter")`; `returnToHub(page)` |
| 6 | Settings reaches page two | `holdCanvasUntil(gate, ...)` on the published gate, `tapCanvas(switchPage)`, poll `page === 1` |
| 7 | the diagnostics row downloads through the same anchor as the backup | `Promise.all([page.waitForEvent("download"), tapDiagnosticsRow(page)])`, armed before the tap because the file starts inside `pointerdown` |
| 8 | the filename is the dated text file | `suggestedFilename()` matches `/^diagnostics-\d{4}-\d{2}-\d{2}\.txt$/` |
| 9 | what a parent opens is the crash history | `readFileSync(await download.path(), "utf8")` |
| 10 | the thrown message and the header are in it | `toContain("journey crash probe")`, `toContain("Aby's Little Lab diagnostics")`, `toContain("App version:")` |
| 11 | the panel names the file it wrote | poll `backupResult === \`Saved ${filename}\`` |
| 12 | the crash was seen, not swallowed | `errors.some((text) => text.includes("journey crash probe"))` |

Second test, "an empty log writes nothing, and the row says so": fresh context,
`openHub`, `openDiagnosticsPage`, then the download wait is **armed first** with
`{ timeout: 2_000 }` and `.catch(() => null)`, the row is tapped, and
`expect(await download).toBeNull()`; `backupResult` settles on
`No crashes have been recorded on this device.`; `errors` is `[]`.

Every row above is **NOT RUN (denied)** - the journey is written, typechecked and
lint-clean, but `pnpm test:e2e` is not available in this environment.

## The authorised widening

`src/game/e2eBridge.ts` gains `E2ERecoverState` (frozen shape
`{ button: GamePoint }`), `recover(): E2ERecoverState | null` on `E2EBridge`, and
an `e2eRecoverButton?` probe hook. It returns `null` unless
`activeSceneKey === "Recover"`, so a journey cannot tap a button the card is not
currently drawing; the read is live, there is no setter or cache, and nothing is
observable without `?e2e=1`.

`src/scenes/RecoverScene.ts` records `{ button: { x: BUTTON_X, y: BUTTON_Y } }`
inside `drawButton()`, at the same constants handed to the disc and to
`Geom.Circle`, and exposes `e2eRecoverButton()`.

`e2e/fixtures/game.ts` gains `recoverState(page)`, mirroring `hubToast`.

## Documents

| Document | Change |
|---|---|
| `docs/TDD.md` | New **§6.8 "The crash log and the recovery card"**: the two events and where they are attached, the `{ at, kind, message, stack }` coercion and the 400-character front trim, the 20-entry buffer as a 12,000-byte ceiling at schema version 1 and its device-level scope, the ordered recovery (replace, else one session-guarded reload), the card and its deliberate absence of words, the file and its environment header, and the guard that keeps the browser surface enumerated. §10.5 moved from "19 journeys across 15 spec files" to **21 across 16** in both places (intro and the `E2E_BASE_URL` paragraph). Counts refreshed: 144 files / **3,149** tests, coverage 97.39 (6546/6721) / 92.02 (1973/2144) / 96.36 (1432/1486) / 98.33 (6083/6186). |
| `README.md` | Parent-facing paragraph after the backup paragraph: the **Save diagnostics** row, what the text file holds, that an empty log writes nothing, the card with the mascot and one arrow, and that the log leaves only as a downloaded file. Count refreshed to **3,149 tests across 144 files**. Bundle section gains the track's shell entry delta, **168.3 kB -> 172.5 kB** (176.68 kB as Vite prints it, 45.21 kB gzip) inside the 200 kB gate, and why `RecoverScene` is eager. |
| `docs/perf-baseline.md` | Test-suite row 3,143 -> **3,149**; coverage row branches `92` -> **92.02**. No other prose touched. |
| `conductor/tech-stack.md` | **NOT WRITTEN - permission denied.** The dated blockquote is drafted verbatim in `## Blockers` below. |
| `conductor/product.md` §10.3 | **NOT WRITTEN - permission denied.** The row and metrics-table replacement are drafted verbatim in `## Blockers` below. |

## Acceptance

| id | Verdict | Evidence |
|---|---|---|
| AC-10 | **Written, NOT RUN (denied)** | `e2e/journeys/crash.spec.ts` throws a real in-page error, sees the card, taps it, reads the downloaded diagnostics text and finds the message (steps 1-12 above). The two bridge/scene unit suites that pin the published button are green (3,149 tests). The suite row itself is unproven here. |
| AC-11 | **Pass** | `grep fetch(` under `src/` returns exactly **one** line, `src/__tests__/guard/backupDom.test.ts:124`, which is the guard's own comment naming the pattern it forbids (`const NETWORK = /\bfetch\(/g`). Zero production occurrences, zero calls. `git diff --stat 7d3c0db8..HEAD -- package.json` is **empty**. Shell entry recorded before and after: **168.3 kB -> 172.5 kB** (validate-bundle), 176.68 kB as Vite prints it, against the 200 kB gate. No dependency added, nothing transmitted. |
| NFR-2 | Pass | the handler path adds listener registration at boot and nothing per frame; unit suite timing unchanged (30.7 s wall for 3,149 tests) |
| NFR-4 | Pass | shell entry 172.5 kB of the 200 kB gate; `RecoverScene` eager and its bytes counted (3.8 kB of the delta), reported in README |
| NFR-6 | **Written, NOT RUN (denied)** | the suite gains exactly **one** spec file with two tests; the first is the long one. Runtime not measurable here. Against the recorded CI breach (5m28s for 19 journeys) this adds a journey of roughly the same shape as `backup.spec.ts`, which is the existing finding, not a widening of it. |

## Deviations

1. **Touches widened** (authorised, per brief): `src/game/e2eBridge.ts`,
   `src/scenes/RecoverScene.ts`, `src/__tests__/game/e2eBridge.test.ts` and
   `src/__tests__/scenes/recoverScene.test.ts` (extended the existing scene
   suite; no second file was created). `e2e/fixtures/game.ts` and
   `e2e/node-env.d.ts` also moved: the fixture gained `recoverState` so the
   journey reads the bridge through one primitive like every other journey, and
   `node-env.d.ts` gained a `node:fs` `readFileSync` declaration in the file's
   existing voice, because the app ships no `@types/node` and no dependency may
   be added.
2. **Count and coverage refresh**: README, `docs/TDD.md`,
   `docs/perf-baseline.md` only, as instructed. `validate-docs` was red until
   they agreed and is green now.
3. **README's shell figure**: the brief expected a "168.3 kB" figure to already
   exist in README; it does not - README's own build sentence is dated
   2026-10-24 and says 137.8 kB. That dated sentence was left alone, and the
   track's delta was added as a new dated paragraph rather than overwriting a
   measurement that belonged to another day. `docs/TDD.md` §3.6 still carries
   its own 137.8 kB figure for the same reason; it is outside this phase's
   described edits.
4. **Two document edits denied.** `conductor/tech-stack.md` and
   `conductor/product.md` §10.3 refuse `edit` with `Permission denied`. Nothing
   was worked around; the drafted text is in `## Blockers`.

## Blockers

**1. `conductor/tech-stack.md` - append after the 2026-11-08 Backup and Restore
blockquote (currently the file's last line), in the same voice:**

> **2026-11-08 - Design Update (Error Capture):** A crash is state, and it is
> stored where the save already lives. `Settings.diagnostics` is a
> `CrashEntry[]` of `{ at, kind, message, stack }` at the same schema version 1,
> backfilled to `[]` by `normalizeDiagnostics`, so a payload written before this
> track loads with an empty log and a payload from a newer build stays
> write-protected exactly as before. It is device-level rather than per profile
> because a crash is the browser's fact and not a child's achievement: it
> survives deleting a profile and resetting progress, and no scene shows it to a
> child. The buffer is bounded by constants - `MAX_ENTRIES` 20, and
> `MAX_STACK_CHARS` 400 taken from the *front* of a stack, where the message and
> the throwing frame are - which puts a 12,000-byte ceiling on the stored JSON
> and a measured 9,612 bytes on twenty maximal entries; the oldest entry is
> dropped from the head, so a scene that throws every frame cannot spend the
> quota the guarded save layer exists to survive. Recovery is ordered. With a
> scene running the handler starts `Recover` as a *replacement*, which is what
> stops a scene that throws every frame from throwing every frame; with no scene
> at all - the canvas never came up - it spends one session-guarded
> `reloadOnce()`, the flag written before the reload is asked for, and a
> `sessionStorage` that throws reads as "cannot remember, so still allowed one",
> because a broken first load with no retry at all is worse than a page that sits
> still. The card is a Phaser scene and eager, since Phaser 4 cannot add a scene
> to the array lazily: a full-bleed rectangle in the page colour, the mascot only
> when its texture exists, one drawn circular arrow, no text anywhere, and the
> only interactive object a transparent disc hit-tested as a `Geom.Circle` at
> radius 72 over a 64 px disc. The guard widened by three names and not by a
> prefix: `sessionStorage.` for the loop guard, and `window.location` plus
> `window.addEventListener` for the two ways a module leaves the canvas rather
> than draws on it. Every other `window.` member stayed unwatched on purpose -
> `speechSynthesis`, `matchMedia` and `setTimeout` are feature APIs that nine
> modules use legitimately, so a bare `window.` pattern would fail all of them
> and still say nothing about what escapes the app loop. `src/game/errorCapture.ts`
> needed no allowance at all: it attaches through `deps.target ?? window`, so it
> never writes `window.member`, and an allowance for it would fail the guard's
> own "the module still names its global" check. The download seam now takes the
> MIME type - `downloadText(text, filename, type = "text/plain")`, with
> `downloadBackup` passing `application/json` and the diagnostics row taking the
> default - so one anchor serves both files instead of two code paths drifting.
> Suite 144 files / 3,149 tests, coverage 97.39/92.02/96.36/98.33, 21 browser
> journeys across 16 spec files (the crash journey is written this phase and is
> the one row CI has not yet run), shell entry 168.3 -> 172.5 kB of the 200 kB
> gate, no new dependency and no network request: `grep fetch(` over `src/` is
> still empty.

**2. `conductor/product.md` §10.3 - replace the `20261124-error-capture` row
(line 180) with:**

| `20261124-error-capture` | **Done 2026-11-08** (track `20261108-error-capture`): two global handlers (`error`, `unhandledrejection`) record an uncaught failure as `{ at, kind, message, stack }` in a device-level log at the existing schema version 1, bounded at twenty entries and 400 stack characters - a 12,000-byte ceiling, measured at 9,612 for twenty maximal entries. A crash replaces the broken scene with an icon-only card (the mascot and one arrow, no words a four-year-old cannot read); a crash before the canvas exists spends one session-guarded reload and never a second. **One deliberate deviation from the roadmap:** it said "Copy diagnostics", and this ships a dated `diagnostics-<day>.txt` download instead, because a clipboard write cannot be proved by a test and a file can be emailed from a phone. The log still never leaves the device except through that download, and the download seam now takes a MIME type so one anchor serves both the backup envelope and the report. | A crash yields a shareable, human-readable trace - **written and green in the unit layer, demonstrated by the journey once CI runs it**: `crash.spec.ts` throws a real error inside the page, waits for the card to replace the scene, taps the card's published button, lets the page reload itself with no `page.reload()` anywhere, plays a game, then downloads the log and reads the thrown message and the environment header back out of the file |

**and replace the "Uncaught errors per 100 sessions" metrics row (line 191)
with:**

| Uncaught errors per 100 sessions | readable per device from the diagnostics file: every entry carries a moment, a kind and a message, newest first, up to twenty - so a parent can count this week's crashes on one device; still no rate across devices, because nothing is transmitted | < 1 |

**3. `pnpm test:e2e` is denied in this environment.** The journey has not been
run. The primary should run it; see `## Notes` for what is expected to happen
and what would legitimately fail.

## Notes

- **What the journey should do on the first run.** Boot the built artifact, throw,
  poll `activeSceneKey` to `"Recover"` within 10 s, read
  `window.__abyE2E.recover()` and tap `{ x: 512, y: 560 }` in canvas space
  (letterboxed through the canvas box like every other gesture), then wait for
  `framenavigated` and `settleHub`.
- **If it fails, the interesting failure is the reload.** The brief forbids
  fixing a missing navigation with `page.reload()`, and this file does not
  contain one: if the card's tap does not leave the page, that is a real defect
  in `reloadOnce()`/the `pointerdown` wiring, not a test that needs a nudge.
- **The one place a `2 s` wait exists.** The empty-log test arms
  `waitForEvent("download", { timeout: 2_000 })` before the tap. That is a
  deliberate "nothing happens" duration, the mirror of the parental hold: there
  is no state to poll, because absence of an event is the claim.
- **`node:fs` in a journey is new.** `e2e/node-env.d.ts` declares only
  `readFileSync(path, "utf8"): string`. If `tsc -p e2e/tsconfig.json` is ever
  given `@types/node`, delete the declaration rather than widening it.
- **`errors` is asserted to *contain* the crash**, not to be empty. Do not
  "fix" a red run by tightening that to `toEqual([])`; the point of the test is
  that the page's own handler saw the throw.
- **The other three gates were already green before this phase** and stayed
  green. The only red during the phase was Biome's trailing blank line, fixed
  immediately.

## Rework round 1

The primary ran `pnpm test:e2e`. The empty-log test passed; the crash journey
failed at `crash.spec.ts:87` with *"the crash handler should replace the broken
scene with the recovery card"*.

**The failure, measured rather than guessed.** A scripted probe (run by the
primary, not by this session) threw inside the page and then read the bridge for
four seconds. After the throw: `settings.diagnostics.length === 1` - the handler
ran and `recordCrash` wrote - while `window.__abyE2E.activeSceneKey()` stayed
`"Hub"` and `recover()` returned `null`. So the two halves of `capture()`
behaved differently: recording worked, recovery silently did nothing.

**Root cause.** `recover()` called `game.scene.start(RECOVER_SCENE_KEY)`.
`game.scene` is Phaser 4's `SceneManager`, which exposes `getScenes`, `add`,
`remove` and `update` and has **no `start`**. Every scene transition this app
makes goes through the running scene's plugin - `scene.scene.start(key)`, as
`src/utils/sceneTransitions.ts` does - and that is the only form Phaser 4
supports from this codebase. The call compiled because the module's `deps` seam
and the test fake both described a manager that does not exist.

**Why the unit suite missed it.** `makeGame()` in `errorCapture.test.ts` was
`{ scene: { start } }`: the fake encoded the wrong API and then proved the wrong
API worked. Ten cases asserted `start` was called on the manager, so the suite
was green against an object Phaser never hands out. The defect was the fake as
much as the call.

**The change.**

- `src/game/errorCapture.ts`: exported `runningSceneKey(game)` is **replaced** by
  `runningScene(game): Phaser.Scene | null` (`game.scene.getScenes(true)[0] ?? null`),
  and the old name is gone rather than kept as an alias. The `activeSceneKey`
  dep is replaced by `runningScene?: () => Phaser.Scene | null`; the key is read
  off that scene (`scene.scene.key`), so "what is on screen" has one source of
  truth. `recover()` is now: no scene → `reload()`; the scene's key is `"Recover"`
  → return; otherwise `scene.scene.start(RECOVER_SCENE_KEY)`. The recovery
  comments keep their intent and gain the reason the plugin is the only start.
  `deps.runningScene ?? (() => runningScene(game))` keeps the module's unused
  `game` argument honest: a caller that forgets the dep still looks at the
  screen instead of reloading.
- `src/main.ts`: injects `runningScene: () => runningScene(game)`, and the import
  follows the new name.
- `src/__tests__/game/errorCapture.test.ts`: `makeGame(key?)` now returns
  `{ game, start, scene }`, where the scene carries `{ scene: { key, start } }`
  and the game's manager carries **only** `getScenes` - `start` was deliberately
  taken off it, with a comment naming Phaser 4's manager so nobody re-adds one.
  Every case that injected `activeSceneKey` now injects `runningScene`, the
  reload cases pass `runningScene: () => null` over `makeGame()`, and the
  `runningSceneKey` describe became `runningScene` asserting the scene instance
  itself and `null` before boot.

**The case that would have caught it**, added between "replaces the running
scene" and "does not restart the card":

*"starts the card through the scene's plugin, not the scene manager"* - fires a
real error from `makeGame("Hub")`, then asserts `"start" in game.scene` is
`false` (Phaser 4's manager has `getScenes`/`add`/`remove`/`update` and no
`start`, so `game.scene.start(...)` compiles against a loose fake and does
nothing in a browser) and that `start` - the *scene plugin's* function - was
called with `"Recover"`. A future regression now fails here instead of waiting
for CI's browser.

**Re-run, all green** (these supersede the `## Commands` table above):

| # | Command | Exit | Result |
|---|---|---|---|
| 1 | `pnpm check` | 0 | 316 files, no fixes |
| 2 | `pnpm typecheck` | 0 | both tsconfigs |
| 3 | `CI=true pnpm test -- --run` | 0 | **144 files / 3,150 tests** (+1) |
| 4 | `pnpm test:coverage` | 0 | statements 97.39 (6548/6723), branches 92.02 (1973/2144), functions 96.36 (1433/1487), lines 98.33 (6084/6187) |
| 5 | `pnpm build` | 0 | shell `index-DXaO91Vc.js` 176.69 kB (45.21 kB gzip), 47 chunks, precache 59 / 1770.03 KiB |
| 6 | `node scripts/validate-bundle.js` | 0 | **172.6 kB** <= 200 kB |
| 7 | `node scripts/validate-pwa.js` | 0 | 16 passed |
| 8 | `node scripts/validate-docs.js` | 0 | 5 passed |
| 9 | `pnpm test:e2e` | - | **NOT RUN (denied)** - the primary runs it |

Counts moved, so the living documents were refreshed again: README
**3,150 tests across 144 files** and the shell delta **168.3 -> 172.6 kB**
(176.69 kB as Vite prints it), `docs/TDD.md` §10.2 **3,150** and §10.3
**6548/6723, 1433/1487, 6084/6187 across 144 files and 3,150 tests**,
`docs/perf-baseline.md` test-suite row **3,150**. Nothing else in those files
changed.

Two typecheck findings came out of the first pass and were fixed rather than
silenced: the fake scene had to be cast to `Phaser.Scene` once inside
`makeGame()` (its literal shape cannot satisfy the class), and the unused
`game` parameter in `installErrorCapture` disappeared behind the
`runningScene` default described above.

**Earlier blockers are closed.** The primary has since written
`conductor/tech-stack.md` (the dated blockquote is now the file's last entry)
and `conductor/product.md` §10.3 (the Done row and the metrics row), so
blockers 1 and 2 of round 1 no longer stand; neither file was touched in this
round. One number in that blockquote is now one behind: it records "144 files /
3,149 tests" and "168.3 -> 172.5 kB", where this round measured **3,150** and
**172.6 kB**. The primary owns that file and can bump both.


## Primary verification

Verified 2026-11-08 by the primary, independently of the executor.

- Phase base: `c7f7fc64`
- Head at the end of this section: `fb1dff07` plus the two fixes below

### The blocked run, and the two defects it found

`pnpm test:e2e` was denied to the executor, so the journeys were written and not
run. The first real run failed one of them:

```
e2e/journeys/crash.spec.ts:87
Error: the crash handler should replace the broken scene with the recovery card
20 passed, 1 failed (3.9m)
```

The empty-log journey passed, so the row and the download path were already
proven; the recovery path was not. A scripted probe said exactly where it
stopped: after a real in-page throw the log **did** gain an entry
(`settings.diagnostics.length === 1`), the error listener had run, and
`activeSceneKey()` stayed `"Hub"` for four seconds with `recover()` returning
`null`. Recording worked; the replacement did nothing.

**Defect 1 - the wrong scene API.** `recover()` called
`game.scene.start("Recover")`. `game.scene` is Phaser 4's `SceneManager`, whose
surface is `processQueue`, `add`, `remove` and `update` - it has **no `start`**
at all. Every transition in this app already goes through the ScenePlugin
(`src/utils/sceneTransitions.ts`: `scene.scene.start(targetKey)`), and that is the
only form Phaser 4 supports from here. The call was a silent no-op, which is why
no second `pageerror` appeared to give it away.

The unit tests had missed it because the fake encoded the mistake:
`makeGame()` was `{ scene: { start } }`, a manager with the method the production
code wanted and Phaser does not have. Fix (`fb1dff07`): the module publishes
`runningScene(game)` instead of a key string, the dep seam is
`runningScene?: () => Phaser.Scene | null`, and recovery starts the card through
the running scene's own plugin. The fake is now `{ scene: { getScenes } }` with
**no `start`**, and a case asserts `"start" in game.scene` is `false` while the
plugin's `start` receives `"Recover"` - a re-introduction of the old call throws
in a unit test instead of failing silently in a browser.

**Defect 2 - a button nothing could press.** With the card finally on screen the
tap still did nothing: no `framenavigated`, `sessionStorage["...reload-once"]`
still `null`. The hit target was

```ts
const hit = this.add.circle(BUTTON_X, BUTTON_Y, HIT_RADIUS, BUTTON_COLOR, 0);
hit.setInteractive(new Phaser.Geom.Circle(0, 0, HIT_RADIUS), Phaser.Geom.Circle.Contains);
```

Phaser skips hit-testing a game object whose alpha is 0 (`willRender` is false for
it), so an invisible `Arc` is invisible to input as well as to the eye. The card
drew its button at the right place, published the right point, and was
unreachable. Fix: a `Zone` - invisible by design, and the object `dragBoard`
already uses for its empty slots - with the same circular hit area
(`Geom.Circle(HIT_RADIUS, HIT_RADIUS, HIT_RADIUS)` in the zone's local space).
`recoverScene.test.ts` now asserts the interactive object's kind is `zone` by
name, so a return to a transparent `Arc` is a red test rather than a quiet one,
and `phaserMock`'s `zone` factory records its position the way `circle` already
did.

Both defects were found by the browser layer and by nothing else: the static
gates, the 144 unit files and the coverage thresholds were green with each of
them in place. That is the argument for the layer, made twice in one phase.

### The journey, green

```
pnpm test:e2e  ->  21 passed (4.0m)
```

with the crash journey now proving, in one run: a real `setTimeout` throw inside
the page, the card replacing the broken scene, the card's own published point
tapped, the app's own reload (no `page.reload()` in the journey), the hub
settling, a game launched and left, and the downloaded diagnostics text read back
from disk containing `journey crash probe` and the environment header. The second
test proves an empty log writes no file and says so on the line.

### Gate

| Layer | Command | Result |
| --- | --- | --- |
| Static | `pnpm check` | 316 files, no findings |
| Types | `pnpm typecheck` | clean, both programs |
| Unit | `CI=true pnpm test` | 144 files / 3,150 tests, 18.10 s |
| Coverage | `pnpm test:coverage` | 97.38 / 91.97 / 96.36 / 98.33 - gate 90 / 85 / 88 / 95 |
| Build | `pnpm build` | emitted `dist/sw.js` |
| Bundle | `validate-bundle` | phaser 1,335.0 kB, shell `index-DJP4hwvW.js` **172.6 kB** <= 200 kB |
| PWA | `validate-pwa` | 16 passed, 47 chunks all precached |
| Documents | `validate-docs` | 5 passed |
| Browser | `pnpm test:e2e` | **21 journeys, 4.0 m**, two workers |

### Acceptance

AC-10 is met by the journey above, and it is met *because* the first two runs
failed: a card that could not be reached would have passed a test that only
asserted "the card is on screen". AC-11 is met with the suite at 21 journeys in
4.0 minutes locally - still measured against the 5m28s CI breach this track
inherited, which is carried into `integrated.md` rather than papered over.

### Deviations

- Touches widened to `e2eBridge.ts`, `RecoverScene.ts`, `e2eBridge.test.ts`,
  `recoverScene.test.ts`, `e2e/fixtures/game.ts`, `e2e/node-env.d.ts`,
  `phaserMock.ts` (the zone factory), and `conductor/tech-stack.md` /
  `conductor/product.md` which the primary wrote because both were denied to the
  executor.
- The shell entry went 168.3 -> 172.6 kB across this phase (+4.3 kB: the card, the
  capture module, the diagnostics file), 27.4 kB inside the gate.

## Rework round 2

Phase base `cfd17a75`. Ten findings from `review.md`, executed in severity order:
the two that can strand a child first, then the mediums, then the lows.

### F1 - the card's button works on the second crash

`reloadOnce()` is the pre-canvas loop guard, and the flag it spends lives in
`sessionStorage` - which survives a reload. So after the tab's first crash-tap
(or any pre-canvas reload) the card's only control did nothing: an icon-only
screen with a dead button, which is precisely the failure this track exists to
remove.

`src/utils/reload.ts` gained `reloadPage()`, which calls
`window.location.reload()` unconditionally, with a comment saying why it must
not share the guard: a guard exists to bound a reload the **app** decides to
perform by itself, and a tap is not automatic. `RecoverScene` imports
`reloadPage` and its `pointerdown` calls it. `reloadOnce()` is untouched and
still guards the no-scene path in `errorCapture.ts`, with its existing tests
unchanged.

The test that would have failed before: `recoverScene.test.ts` no longer mocks
the reload module. It stubs `window` with a `Map`-backed `sessionStorage` whose
key is already `"1"` and a `location.reload` spy, then taps the button and
asserts the page reloaded anyway - and that the spent key is still `"1"`, so the
guard was consulted by nobody. Mocking the module instead would have let a card
that consults the guard pass, which is exactly the defect. (`2a113a81`)

### F2 - the handler cannot throw

`recover()` sat outside the `try` that guarded the recording. `runningScene()`
throws if the game was destroyed; `reload()` throws if the location is blocked;
either escapes the listener, and an error handler that throws turns one crash
into two - the second from inside the recovery.

`capture()` now has the whole body inside one `try`: the recording keeps its own
inner `catch` (a throwing recorder must still leave the card to run, FR-4), and
the outer `catch` says in its comment what is actually being protected - the
listener itself. Two cases were added, one per dependency
(`runningScene: () => { throw new Error("gone") }`, and
`reload: () => { throw new Error("blocked") }`): each fires a real error event,
asserts it did not throw, and then fires a rejection and asserts it was still
recorded - the other listener is still attached and the next crash still
counts. (`c9a014e2`)

### F3 - the size ceiling belongs to the code

`MAX_STACK_CHARS` bounded half an entry. A thrown string, or a stringified
rejection reason, could be any size at all, and `readEntry` passed a stored
`stack` through untrimmed - so `normalizeDiagnostics` capped the count and
nothing capped the bytes. The 12,000-byte ceiling was a property of fixtures
that happened to throw seven-character messages.

`MAX_MESSAGE_CHARS = 200` now sits beside `MAX_STACK_CHARS`, applied in
`describedReason` in **every** branch - including the stringified-object branch,
the one place the module generates a message of its own and therefore the only
branch where "the thrown size" is not already a given - and in `readEntry` for
both fields, because a stored log can be hand-edited.

The tests: a 200-character trim from the front, a 100 kB rejected object trimmed
on write, a 100 kB object carried through twenty appends without moving the
buffer past the bound, a hand-edited 5,000-character message and stack trimmed
on read, and the buffer test rebuilt with messages genuinely at their maximum
instead of seven characters. The constants pin is now
`[20, 400, 200]`.

**The ceiling moved, and the arithmetic says it had to.** With both fields
bounded, `MAX_ENTRIES x (MAX_MESSAGE_CHARS + MAX_STACK_CHARS + 200)` is
**16,000 bytes**, and twenty entries at both maxima measure **13,461** - the
number the failing run printed (`expected 0, received 13461`) and which is now
pinned as `MEASURED_WORST_CASE` so the prose cannot drift from the code. The old
12,000 was `20 x (400 + 200)` with the 200 spent entirely on timestamp, kind and
keys: it silently assumed a message of no length, which was the finding.
(`b3d5d3bf`)

### F4 - the documents described the code that was replaced

`docs/TDD.md` §6.8 now says `scene.scene.start("Recover")` through the running
scene's own plugin, with the clause that Phaser 4's `SceneManager` has no
`start` and that this was the silent no-op the journey caught; it names the
`Zone` the card is hit-tested through, with the clause that Phaser does not
hit-test a zero-alpha object and that this was the button no finger could press;
the message/stack bound and the 16,000 / 13,461 figures replace the "maximal
message / 9,612" wording; the handler is described as one guarded body; the
card's `reloadPage()` is distinguished from the loop guard; and the
replace-erases-the-log sentence is there (F10). README's parent-facing sentence
promised the arrow "starts the app again - once, never in a loop", which was true
only of the broken card; it now says the tap is always allowed and that the
once-per-session limit belongs to the automatic pre-canvas reload.

`conductor/tech-stack.md` and `conductor/product.md` were **denied** to this
executor (see Blockers for the exact replacement text).

### F5 - the requirements now say what the guard does

`src/__tests__/guard/backupDom.test.ts` watches two window *members*
(`window.location`, `window.(add|remove)EventListener`) and `sessionStorage.`,
not a `window.` prefix, and `src/utils/reload.ts` is a second module this track
adds that names globals - so FR-11 and FR-12 as written were false and AC-9
named a rule the guard does not implement. The guard itself was not weakened:
the amendments are to the prose. `spec.md` was denied (Blockers), with the
amended FR-11 / FR-12 / AC-9 text drafted there, including a dated correction
paragraph explaining that a prefix-wide `window.` rule fails nine modules for
`speechSynthesis`, `matchMedia` and `setTimeout`, which are feature APIs rather
than escape hatches.

### F6 - the row is above the line that reports on it

The diagnostics row sat at `rowY(3)` (505) and the result line at `rowY(2)`
(449), so "Saved <file>" appeared *between* Restore and Save diagnostics -
contrary to FR-8 and to both comments (F9's clipping risk was the same mistake
seen from the other side).

The row is now at `rowY(2)` (449) and the result text at `rowY(4)` (561), one
pitch clear of the row's card, whose band is 471-539, so a wrapped
`Saved diagnostics-....txt` cannot touch it. Comments corrected in both places.
`RESULT_Y` in `SettingsPanel.test.ts` became 561; the pinning test now asserts
337 / 393 / 449 **by label** and that `RESULT_Y` is more than 30 px below
`hitRectFor(scene, "Save diagnostics").bottom`, which is F9's confirmation.
`backupRows`' diagnostics point moved 505 -> 449 in both `SettingsPanel.test.ts`
and `e2eBridge.test.ts`. Page one's eight rows and their `y` values are
untouched, and their test was not edited. (`9b642d82`)

### F8 - the hit area is asserted, not assumed

`recoverScene.test.ts` reads the recorded `setInteractive` argument and asserts
`toMatchObject({ x: 72, y: 72, radius: 72 })` plus
`contains === Phaser.Geom.Circle.Contains`. The removed off-centre circle would
have satisfied `expect.anything()`; this does not. The comment records why the
local-space centre matters: it is what makes a tap in the corner of the zone miss.
(`2a113a81`)

### F7, F9, F10

F9 is solved by F6 and asserted there. F7 (NFR-6 to "one spec file with two
tests") is a `spec.md` edit and is denied - drafted in Blockers. F10's behaviour
is kept unchanged and named in TDD §6.8; the `product.md` half is drafted in
Blockers.

### Gate

| Layer | Command | Result |
| --- | --- | --- |
| Static | `pnpm check` | exit 0, 316 files, no fixes |
| Types | `pnpm typecheck` | exit 0, both programs |
| Unit | `pnpm test -- --run` | exit 0, 144 files / **3,158** tests, 29.65 s |
| Coverage | `pnpm test:coverage` | exit 0, 97.38 / 91.97 / 96.37 / 98.33 - gate 90 / 85 / 88 / 95 |
| Build | `pnpm build` | exit 0, shell `index-CrzFtQuT.js`, 47 chunks, 59 precache entries |
| Bundle | `node scripts/validate-bundle.js` | exit 0, shell **172.7 kB** <= 200 kB |
| PWA | `node scripts/validate-pwa.js` | exit 0, 16 passed, 47/47 chunks precached |
| Documents | `node scripts/validate-docs.js` | exit 0, 5 passed (after the count refresh below) |
| Browser | `pnpm test:e2e` | **NOT RUN (denied)** - the primary runs it |

### What moved, and why

- Tests 3,150 -> **3,158**: one card case (F1), two throwing-dependency cases
  (F2), four message/read bound cases (F3), and one extra at the constants pin.
- Coverage 97.39/92.02/96.36/98.33 -> **97.38/91.97/96.37/98.33** (statements
  6551/6727, branches 1972/2144, functions 1435/1489, lines 6088/6191). Both
  directions are inside the "varies by a fraction between identical runs" note
  the TDD already carries.
- Shell entry 172.6 -> **172.7 kB** (176.80 kB as Vite prints it, 45.23 kB
  gzipped) - the added branch in `diagnostics.ts` and the `reloadPage` wrapper.
- Documents refreshed only where those numbers appear: README line 49 and the
  shell delta, TDD §10.2 and §10.3, `perf-baseline.md`'s suite and coverage
  rows. The evidence file, `plan.md` and the track's own records keep their
  historical figures.

