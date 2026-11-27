# Phase 2 verification — Parent Help overlay

Result: **verified** — the primary's final unchanged exact gate exited 0, the genuine four-engine
Help journey passed 8/8 with unchanged saves and zero local retries, media capture passed at
844x390, docs validation passed 5/0 and the whitespace check was clean. All Phase 2 repairs are
recorded below, including Gates A–I, Journey K, both matching-press repair rounds, the Gate III
living-figure refresh, Help bullet spacing and the one-line formatting repair. AC-1–AC-12 are
proved; AC-13 remains Phase 3. No blockers remain. The earlier blocked paragraphs below are
historical process notes, not the current status.

Branch: `feat/20261127-parent-help-overlay`
Phase base: `2931a3cd080bf7aabb803c21bfe6d8f04c395667`
Head at inspection: uncommitted Phase 2 work on the phase base; no Phase 2 commits exist yet.

## What was implemented

### P2.T1 — persistent header entry point
- `src/components/settings/HelpButton.ts` (new): a `"Help"` label in the mirrored left header
  slot (`centerX - PANEL_WIDTH/2 + 36`, `centerY - 105`) with the close control's `96x96`
  `centredHitArea`, press feedback, and a `point()` probe. It pushes into the caller's
  persistent object bucket, so it survives both page rebuilds.
- `src/components/SettingsPanel.ts`: creates one `HelpOverlay` on the shared `overlayObjects`
  bucket and one `HelpButton` beside the ✕, wires `onOpen` to `helpOverlay.open()`, closes Help
  first in `destroy()`, and exposes `e2eHelpButton()` / `e2eHelp()` (live copies of `lines`,
  `topics` and every control point).
- The two trivial delegates `openProgressOverlay` / `openProfilesOverlay` were inlined into their
  `SettingsRows` callbacks plus comment-only condensation. The file is **388 physical lines**,
  within the 400-line cap. Row coordinates, all eight rows, both page controls, the title,
  version footer, page switch and close control were not changed.

### P2.T2 — additive E2E state
- `src/game/e2eBridgeTypes.ts`: added `E2EHelpState` (`screen`, `topicId`, `topicIndex`,
  `topicCount`, `title`, `lines`, `topics`, `controls.close/back/prev/next` with null boundaries)
  and additive `helpButton` / `help` fields on `E2ESettingsState`.
- `src/game/e2eBridge.ts`: exported `E2EHelpState`, added `helpButton: null` / `help: null` to the
  no-hook fallback. No bridge method was added.
- `src/game/hub/hubE2E.ts` and `e2e/fixtures/game.ts`: publish the same fields while the panel is
  open; `helpState(page)` was added to the fixture.
- `src/__tests__/game/e2eBridge.test.ts`: `noPanelSettings()` includes both new null defaults;
  its existing exact-equality assertions cover the closed-panel shape.

### P2.T3 — unit/integration tests
- `src/__tests__/components/settings/HelpButton.test.ts` (new): mirrored slot, 96x96 hit area,
  live point, one tap handler per button, one open per tap.
- `src/__tests__/components/SettingsPanel.test.ts`: a new integration group covers the unchanged
  header point on both pages, opening above Settings and Backup, menu/topic boundary state,
  backdrop and ✕ closing Help only, repeated cycles without duplicate objects or listeners,
  Help being destroyed with Settings, and all eight topics leaving settings and the save intact.

### P2.T4 — four-project browser journey
- `e2e/journeys/help.spec.ts` (new): uses the real `holdCanvasUntil` gate, `tapCanvas`, the
  published Help point and topic points, `helpState(page)`, and `readStoredV2` with `STORAGE_KEY`
  semantics identical to the backup/persistence journeys. It walks all eight topics, checks the
  `prev`/`next` boundaries, returns via ✕ and Back, switches to the Backup page, closes via the
  backdrop, then closes Settings after Help has gone. It asserts the save, profile count, sticker
  count and settings are unchanged and that no page/console errors occur. The exact project roster
  is the one in the brief's Playwright command: chromium, webkit, firefox, mobile-chromium.
- The component-level test in `src/__tests__/components/SettingsPanel.test.ts` remains the direct
  proof that calling `panel.destroy()` while Help is open clears both Help state and its objects;
  the browser journey proves the reachable close path without relying on overlay interception.

### P2.T5 — gate, docs and evidence
- Not run: the shell permission layer rejected every command (see below), so `validate-docs.js`
  never produced output. No living figures were changed; no historical release note or dated
  measurement was touched.

## Primary inspection — pre-gate browser-test repair

The primary inspected the uncommitted work before the heavy gates and found two defects confined
to `e2e/journeys/help.spec.ts`. Production integration was not changed.

1. **Empty toggle baseline.** `togglesBefore` was read while Settings was closed, so it was
   necessarily `[]` and could not prove the rows stayed unchanged. It is now read from the
   `settingsState(page)` snapshot captured immediately after `openSettings(page)` and before
   `openHelp(page)`, and that same snapshot's `page` assertion is retained.
2. **Mirrored close intercepted by Help.** The final tap at the mirrored panel-close coordinate
   was made while Help was open; Help's own ✕ occupies that coordinate and correctly intercepts
   it, so the test compared Help closure with Settings closure. The journey now closes Help with
   its published close control, waits for `help` to be null, and only then taps the mirrored
   coordinate while the underlying Backup page is visible, asserting `open === false` and both
   `help` and `helpButton` null. The component-level `panel.destroy()` test is unchanged and is
   the direct proof that destroying Settings removes an open Help overlay.

Only these two files were touched in this repair; no gate, journey or commit command was run.

## Acceptance-cr coverage from this phase's code and tests

| AC | Evidence |
|---|---|
| AC-1 | `HelpButton.test.ts` and the SettingsPanel header test prove the 96x96 Help control is in the mirrored persistent header on both pages; journeys open it through the real gate hold. |
| AC-2 | SettingsPanel integration tests prove Help opens above page 0 and page 1, that ✕ and backdrop close only Help, and that rows/page controls keep their coordinates. Awaiting gate confirmation. |
| AC-10 | Exact configured gate was submitted but denied by the shell permission layer; no exit or figures exist yet. Coverage/build/module-size validators are pending primary execution. |
| AC-11 | Unit and integration tests cover repeated cycles, listener/object stability, read-only behavior and unchanged save; the four-project journey remains pending. |
| AC-12 | E2E bridge/fixture/Hub defaults and the additive `helpButton`/`help` fields are implemented; bridge tests cover the closed-panel shape. Browser proof in all four engines is pending. |

Earlier content and navigation ACs (AC-3–AC-9) remain proven by Phase 1; AC-13 doc truth belongs
to Phase 3 and was not edited here.

Visual inspection at 1024x768 and 844x390 is primary-owned and pending until the primary records
it. Physical-device testing remains unrun; the four-project journey is engine emulation, not
physical-device evidence.

## Gate A — primary's exact chain stopped at `pnpm check`

The primary ran the exact configured chain unchanged. It stopped at the first step,
`pnpm check`, with **five Biome errors and one unused-import warning**; no typecheck, test,
coverage, build, bundle/module-size/texture/PWA/docs validator or browser journey ran in Gate A.
The primary reported the counts and the affected files but did not relay per-diagnostic text to
this subagent, so the failures are recorded here exactly as reported and by the mechanical repair
each required. Result stays `blocked` until the primary re-runs the chain.

Mechanical repairs applied, with no behavior change and no other file touched:

- `src/game/e2eBridge.ts`: removed the unused `E2EHelpState` entry from the `import type` block
  (the unused-import warning) and moved `E2EHelpState` before `E2EHubChip` in the `export type`
  block so both blocks are sorted.
- `src/__tests__/components/SettingsPanel.test.ts`: moved the `HELP_TOPICS` import before the
  `primitives` import; after `expect(backdrop).toBeDefined()` added
  `if (!backdrop) throw new Error("expected the Help backdrop");` before reading
  `backdrop.object`; collapsed the three-line `"Parent Help"` call-count assertion to Biome's
  one-line form.
- `src/components/settings/HelpButton.ts`: sorted the named import to
  `centredHitArea, type ObjectBucket, PANEL_WIDTH`.

## Gate B — primary's rerun found one unapplied repair

The primary reran the exact configured chain unchanged. Biome now reported **only one error**:
`src/__tests__/components/SettingsPanel.test.ts:1123` still contained
`expect((backdrop?.object as MockGameObject).destroy).toHaveBeenCalledTimes(1);` — the guard
requested in Gate A had not actually been inserted in the `destroys Help along with Settings` test.

Exact repair applied, changing nothing else in that file:

- Immediately after the `const backdrop = getRectangles(scene).find(...)` line in that test and
  before `panel.destroy()`, added:
  `if (!backdrop) throw new Error("expected the Help backdrop");`
- Changed the final assertion to:
  `expect((backdrop.object as MockGameObject).destroy).toHaveBeenCalledTimes(1);`

Result stays `blocked` until the primary reruns the chain.

## Gate C — primary's rerun passed Biome, stopped at E2E TypeScript

The primary reran the exact configured chain unchanged. Biome passed; E2E TypeScript then stopped
with **six `TS2345` errors**. `tapHelpControl` accepted only `{ x: number; y: number } | null`,
while optional chaining on the published Help state also produces `undefined` at the call sites on
lines 94, 151, 159, 161, 171 and 203 of `e2e/journeys/help.spec.ts`.

Exact repair applied, changing no caller and no behavior:

```ts
control: { x: number; y: number } | null | undefined,
```

The helper's existing `if (!control) throw ...` already handles both inactive boundaries and a
missing Help state. Result stays `blocked` until the primary reruns the chain.

## Gate D — primary's rerun passed Biome and both TypeScript projects, stopped at Vitest

The primary reran the exact configured chain unchanged. Biome and both TypeScript projects passed;
Vitest reported **159 files passed / 3 failed** and **3,481 tests passed / 6 failed** (3,487
total). All six failures were diagnosed as test expectation/setup defects, not production failures.

Diagnosis and exact repairs:

1. `src/__tests__/components/settings/HelpButton.test.ts` — `setup()` passed the same array as
   both `MockScene`'s registry and the component's object bucket. `createMockGameObject` already
   pushes the label into the registry, then `HelpButton` pushed the same label into the bucket, so
   `labelOf` saw it twice. The scene is now constructed with no registry (`new MockScene()`) and
   the separate `objects: MockObject[]` bucket is retained.
2. `src/__tests__/components/SettingsPanel.test.ts` — the Help label legitimately has two
   `pointerdown` listeners: the open handler and `attachPressFeedback`'s scale handler. Both new
   assertions expecting listener count `1` were changed to `2`. Repeated-cycle coverage still
   proves no extra listeners accumulate.
3. `src/__tests__/scenes/hubScene.test.ts` — the closed Settings object correctly includes the
   additive `helpButton: null` and `help: null` fields. Both were added immediately after
   `progress: null` in the `publishes no gate once the hub has shut down` expected object. The
   primary explicitly authorized this additional Phase 2 Touch for the repair.

No production code was changed. Result stays `blocked` until the primary reruns the chain.

## Primary focused check — invoke both HelpButton pointerdown handlers

After the Gate D repairs, the primary ran only the three affected Vitest files. SettingsPanel and
HubScene passed; HelpButton still failed because `label.handlers.pointerdown` stores only the latest
handler (press feedback), while `onOpen` is the earlier handler. The test was invoking the wrong
callback.

Exact repair applied in `src/__tests__/components/settings/HelpButton.test.ts`, replacing the two
direct `label.handlers.pointerdown?.()` calls:

```ts
const pointerDowns = label.allHandlers.filter((handler) => handler.name === "pointerdown");
expect(pointerDowns).toHaveLength(2);
for (let tap = 0; tap < 2; tap += 1) {
  for (const handler of pointerDowns) handler.cb();
}
```

The existing `onOpen` call-count assertions are unchanged. This proves one open handler plus one
feedback handler and that tapping twice opens twice. Only this test file and this evidence file were
changed; no commands were run and no commit was made. Result stays `blocked` until the primary
reruns the exact chain.

## Gate E — primary's rerun failed the bundle guard

The primary reran the exact configured chain unchanged. Gate E passed Biome (385 files), app and E2E
TypeScript, Vitest (162 files / 3,487 tests), coverage (97.12% statements / 91.01% branches /
96.45% functions / 98.23% lines) and the 496-module build. It then failed `validate-bundle.js`:
the shell chunk `index-BNSZwUOL.js` was 203.8 kB, above the unchanged 200 kB limit (the prior shell
was 196.3 kB). The Help overlay (10,573 bytes) and content (4,303 bytes) became eagerly reachable
from Settings and pushed the shell over budget.

The primary explicitly authorized `vite.config.ts` as a Phase 2 Touch. Smallest synchronous repair
applied, with no dynamic imports, no UI/test changes, no relaxed guard and no other configuration
change: a second `codeSplitting.groups` entry after the Phaser group:

```ts
{
  name: "parent-help",
  test: /[\\/]src[\\/]components[\\/]settings[\\/](HelpOverlay|helpContent)\.ts$/,
},
```

Help stays synchronous but its implementation and content now build into a separately cached chunk.
Result stays `blocked` until the primary reruns the exact chain.

## Gate G — primary's rerun passed every check except the living-document figures

The primary reran the exact configured chain unchanged. Gate G passed Biome (385 files), app and E2E
TypeScript, Vitest (162 files / 3,487 tests), coverage (97.12% statements / 91.01% branches /
96.45% functions / 98.23% lines), the 496-module build, `validate-bundle.js` (shell
`index-DfDvqr0J.js` 185.8 kB against the unchanged 200 kB limit; printed 190.31 kB, 48.30 kB gzip),
`validate-module-size.js` with zero warnings, `validate-textures.js`, and `validate-pwa.js` (16
passes / 0 failures, 54 chunks / 66 entries / 1889.86 KiB). Only `validate-docs.js` failed: 16 stale
`161` / `3,478` living-figure claims. Those figures were intentionally left untouched for the
primary to refresh with final measured values after this repair.

The remaining defect was a partial-target overlap, not a missing tap point: `HelpButton` is created
before the page rows, and only the ✕ was raised after `buildPage()`. Help's `96x96` hit band
overlaps the first row card, so its centre is tappable but part of the declared target is covered.

Focused repair applied, with no new tests and no living figures refreshed:

1. `src/components/settings/HelpButton.ts` stores `deps.scene` in a private readonly field and adds
   public `raise(): void` calling `this.scene.children.bringToTop(this.label)`. Position, sizing,
   listeners, `point()` publication and bucket ownership are unchanged.
2. `src/components/SettingsPanel.ts` calls `this.helpButton.raise()` immediately after the existing
   `bringToTop(this.closeButton)` in `buildPage()`, and the adjacent comment now says both
   persistent header controls are raised above rows, never above overlays.
3. `src/__tests__/components/settings/HelpButton.test.ts` returns the `MockScene` from `setup()`,
   includes it in `Setup`, and extends the existing first test to call `button.raise()` and assert
   the Help label is brought to the top.
4. `src/__tests__/components/SettingsPanel.test.ts` extends the existing both-pages Help header
   test to assert the Help label is raised after construction and again after switching to page 1.
   The existing page-two close test was updated in place for the extra persistent-header raise;
   no tests were added.
5. This evidence file records Gate G's exact results, the overlap diagnosis and the repair; Result
   stays `blocked`.

Final gate rerun, the primary-owned living-figure refresh, the four-project browser journey and
primary-owned visual/media checks remain pending.

## Post-depth measurement — living figure refresh

After the target-depth repair, the primary verified the focused layer: Vitest passed 191/191 across
`HelpButton.test.ts`, `SettingsPanel.test.ts` and `hubScene.test.ts`. The full primary coverage run
passed 162 files / 3,487 tests with 97.11 % statements / 90.98 % branches / 96.45 % functions /
98.23 % lines. Build and artifact checks passed: Vite built 496 modules; shell `index-D0yx9rPF.js`
is 185.9 kB via `validate-bundle` (190.41 kB as Vite prints it, 48.32 kB gzip); the separate
`parent-help-C9Eo8ns8.js` chunk is 19.38 kB / 7.35 kB gzip; there are 54 JavaScript chunks and 66
PWA precache entries (1889.96 KiB), with PWA validation at 16 passes / 0 failures.

Only current living values were refreshed; every dated historical measurement and release record
was preserved:

- `README.md`: line 49 snapshot now reads 3,487 tests across 162 files; line 207 current build prose
  now reads 185.9 kB shell / 48.32 kB gzip / 190.41 kB printed and 54 JavaScript chunks.
- `docs/TDD.md`: current suite count is 162 files / 3,487 tests and current coverage is 97.11 % /
  90.98 % / 96.45 % / 98.23 %; the instrumentation-variance sentence is retained.
- `docs/perf-baseline.md`: the live-figures header now states RM-7 Phase 2 truth with the measured
  suite, coverage and build figures above. The v1.27.0 browser and first-tap evidence remains
  explicitly identified as release-candidate provenance, not new Help-overlay evidence. All four
  current living suite rows are 162 / 3,487 and both current paired coverage rows are
  97.11 / 90.98 / 96.45 / 98.23; the dated 2026-11-15 coverage row and all historical sections are
  unchanged.
- This evidence file records the post-depth focused/full-coverage/build results and the refresh.

The final exact gate subsequently passed at Gate H; the four-project browser journey roster
exclusion is corrected below. Result stays `blocked` until the rerun proves cross-engine coverage;
primary-owned visual inspection and physical-device testing remain pending.

## Gate H — ten layers green; four-project roster exclusion corrected

Gate H passed all ten configured layers of the exact gate chain with the post-depth figures already
recorded above. The primary also ran the exact journey command:

`pnpm exec playwright test e2e/journeys/help.spec.ts --project=chromium --project=webkit --project=firefox --project=mobile-chromium`

It completed successfully but ran only the two Chromium tests (2 passed in 45.3s). Inspection of
`playwright.config.ts` found the cause: WebKit, Firefox and mobile Chromium use
`CORE_SMOKE_TEST_MATCH`, which did not include `help.spec.ts`. The four-project requirement was
therefore not satisfied despite exit 0.

The primary authorized `playwright.config.ts` as a Phase 2 Touch and added P2.T4.3 in commit
`332161aa`. This step adds `"**/journeys/help.spec.ts"` to `CORE_SMOKE_TEST_MATCH` and changes no
other config value. No WebKit, Firefox or mobile Chromium Help result is claimed here; the primary
must rerun the four-project journey against the corrected roster. Result stays `blocked`, and
living documents are intentionally untouched in this step.

## Corrected four-engine journey — modal release regression

The corrected four-project journey ran 8 tests: 6 passed and 2 failed. Chromium and mobile Chromium
passed both journeys; WebKit and Firefox passed all eight topics but failed the save-unchanged
assertion after Help and Settings were closed. The only save difference was `how-many`
progress/activity.

Root cause: the mirrored Settings-close point overlaps the How Many wide-grid tile. WebKit and
Firefox can deliver `pointerup` to the underlying tile after the modal handles `pointerdown`, so
closing Settings also navigated into How Many and changed saved progress. The three tile
`pointerup` handlers in `src/game/hub/gridBuilder.ts` (wide, paged, filtered) checked elapsed time,
`navLocked` and swipe state but not `deps.gestureBlocked()`, even though `HubScene` already wires
that dependency to modal/profile-chip ownership.

The primary authorized this repair as P2.T3.3 and `conductor(plan)` commit `b063ed73`. This step
adds `deps.gestureBlocked()` to the early-return guard of each of the three tile `pointerup`
handlers and adds one regression test in `src/__tests__/game/hubGrid.test.ts` proving a blocked
release cannot navigate in wide, paged or filtered grids. No journey assertion was weakened and no
other behavior changed. The journey must be rerun before cross-engine coverage is claimed.

## Post-repair journey — capture modal ownership at pointerdown

The corrected four-engine journey was rerun after the release-time guard and again returned
6 passed / 2 failed, with WebKit and Firefox writing the same `how-many` play/activity record.
Focused tests passed 225/225, so the missing transition was not covered by the previous regression.

Refined root cause: `SettingsPanel` close and backdrop handlers call `destroy()` on `pointerdown`.
By the time the underlying tile receives `pointerup`, `settingsPanel` no longer exists and
`deps.gestureBlocked()` is false, so a release-time-only guard cannot suppress the navigation. The
guard must remember that the gesture began while a modal owned it.

This step adds a per-tile `releaseBlocked` closure in each of the wide, paged and filtered tile
builders. Each tile records `grid.deps.gestureBlocked()` on `pointerdown` and the existing
`pointerup` guard also returns when that captured flag is true; the current-state check and every
other guard remain unchanged. The regression now flips the dep from true to false between the
tile's `pointerdown` and `pointerup`, proving the exact modal-destroyed-between-down-and-up
transition for all three grid kinds. Result stays `blocked` until the primary reruns the journey.

## Third four-engine run — stale `dist` and the Hub lifecycle defect

A third genuine four-engine journey run after the pointerdown-capture repair again returned
6 passed / 2 failed: WebKit and Firefox still mutated the `how-many` play/activity record, while
Chromium and mobile Chromium passed both journeys. The primary then diagnosed two independent
issues.

1. **Stale production bytes.** Direct `pnpm exec playwright test` serves the existing `dist`; it
   does not rebuild. The last `pnpm build` predates the Hub guard edits, so the retry exercised
   stale production bytes and could not prove the new guards. The primary will run `pnpm build`
   before the next journey.
2. **Real Hub lifecycle defect.** `HubScene.settingsPanel` is not cleared on ordinary Settings
   destruction (a backdrop/✕ tap destroys the panel on `pointerdown` while the Hub keeps its field),
   so `gestureBlocked: () => Boolean(this.profileChip.isOpen() || this.settingsPanel)` would stay
   true and block later game launches once fresh bytes include the guard. `SettingsPanel.destroy()`
   already makes `e2eOpen()` false, so the Hub must read panel liveness, not object presence.

The primary authorized this repair as task `P2.T3.4` in commit `9df844dc` (Phase 2 now has 19
top-level tasks). The exact correction in `src/scenes/HubScene.ts` line 145 is:

`gestureBlocked: () => Boolean(this.profileChip.isOpen() || this.settingsPanel?.e2eOpen()),`

The mocked `SettingsPanel` in `src/__tests__/scenes/hubScene.test.ts` now exposes `e2eOpen()` with
production-equivalent liveness, and one focused regression proves gesture ownership is true while
the panel reports open and false after it is destroyed. Profile-chip state stays closed. No Hub
logic, other tests, historical measurements or release notes were changed.

Suite truth is currently derived as 162 files / 3,488 tests; living docs await the final measured
refresh from the primary. Result stays **blocked**: no fresh-build, gate, browser or final coverage
pass is claimed here.

## Verification attempted

The subagent's attempts of every command below were submitted exactly as written in the brief and
returned `{"error":{"type":"permission.rejected","message":"Permission denied: shell"}}` — no
process was started, so no exit code or output exists from those attempts. Per the phase rules the
denials were not retried or rephrased. The primary subsequently ran the exact chain unchanged
through Gates A–G; see those sections above for the latest result.

1. Gate:
   `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
2. Browser journey:
   `pnpm exec playwright test e2e/journeys/help.spec.ts --project=chromium --project=webkit --project=firefox --project=mobile-chromium`
3. Whitespace:
   `git -c core.whitespace=cr-at-eol diff --check`

No conventional commits were made: committing also needs the denied shell.

## Required next step for the primary

Run the three commands above on this branch. If the gate reaches `validate-docs.js` and reports
stale living figures, supply the measured values — this phase deliberately did not guess them.
Then commit the task-level changes and record the real exit codes/output here.

## Journey J — fresh build rules out stale bytes

The primary ran focused `hubScene` + `hubGrid` tests (96/96), then a **fresh** `pnpm build`, then all
four Help projects. The build emitted `index-DcMt7ME-.js` (190.68 kB printed / 48.37 kB gzip),
496 modules and 66 PWA entries / 1890.23 KiB. The journey still returned 6 passed / 2 failed:
WebKit and Firefox again wrote only `how-many` progress/activity after Settings closed. Fresh bytes
rule out the stale-`dist` explanation and show the `e2eOpen()` lifecycle correction alone is not
enough.

### Unmatched-release diagnosis and repair

Phaser's top-only hit testing lets a modal consume `pointerdown` while the tile underneath receives
`pointerup` after the modal is destroyed. Each tile's per-tile closure assumed every `pointerup`
had a matching tile `pointerdown`; `releaseBlocked` defaults to false and the panel reports closed
by release, so the tile activates. `src/game/hub/gridBuilder.ts` now tracks a local `pressed` flag
in all three builders (wide, paged, filtered): `pointerdown` sets it and captures
`releaseBlocked = grid.deps.gestureBlocked()`, `pointerout`/`pointercancel` clear it, and
`pointerup` clears it and returns immediately when no matching press existed — before the time-up,
nav-lock, blocked-down and current-modal guards. This is ordinary gesture ownership, with no Help-
or Settings-specific branch.

`src/__tests__/game/hubGrid.test.ts` now proves for all three grid kinds that an unmatched
`pointerup` activates nothing and that a subsequent normal press + release activates exactly once;
the blocked-down/unblocked-up regression stays intact. Existing tap cases in that file now include
the matching `pointerdown`. Scene-level tap cases in `src/__tests__/scenes/hubScene.test.ts` still
dispatch `pointerup` alone and were left untouched under this follow-up's file restriction; the
primary should expect the gate to flag them.

Result stays **blocked**: this section records the primary's already-completed build and journey,
not a rerun. No journey pass, gate pass or final coverage claim is made here.

## Focused check — existing tap tests need matching presses

The primary's follow-up focused run stopped before build/browser execution: 97 tests, 88 passed /
9 failed, 1 passed file / 1 failed file. Every failure was a **test setup mismatch**, not a
production regression: the nine tests simulated a tile tap with `pointerup` alone, which the new
gesture-ownership rule correctly rejects because the tile never received the matching
`pointerdown`. No assertion about game launches, play recording, retry cues, navigation locking,
double-taps or prewarm cancellation was wrong — each test simply never began the gesture it
claimed to simulate. Page-dot and chip `pointerup`-only simulations remain valid because those
controls keep their own handlers, and the deliberate unmatched tile `pointerup` in
`swallows tile taps once a swipe is in flight` is the negative case and stays unchanged.

Only `src/__tests__/scenes/hubScene.test.ts` was changed for these nine cases; no assertion was
weakened and no production code was touched:

- `maps page-1 tiles to games 11-20 (How Many? first)`: `pageOneFirst.handlers.pointerdown?.()`
  before its pointerup.
- `launches Story Order from the 22nd tile on the last page` and
  `launches Robot Path from the 23rd tile on the last page`: `incoming[1]` / `incoming[2]`
  pointerdown before each pointerup.
- `drops the retry cue when a resize rebuilds the grid under it`: `pagedRects()[0]` pointerdown
  before its pointerup.
- `records a play for the tapped tile's game on the active profile`: the first rectangle's
  `pointerdown` handler obtained alongside its existing pointerup handler.
- `ignores taps on other tiles once navigation has started`: pointerdown on `tapTiles[0]` and
  `tapTiles[1]` before their pointerups, preserving the exactly-one-record nav-lock assertion.
- `does not double-record when a tile is tapped repeatedly`: both `pointerdown` and `pointerup`
  handlers obtained from the same first rectangle and invoked down/up twice, preserving the
  exactly-one-record assertion.
- `cancels the pass before the tap's load is awaited` and
  `cancels the art pass before the tap's load is awaited`: `tile.handlers.pointerdown?.()` before
  the pointerup in each prewarm-cancellation test, preserving the cancellation-order assertions.

Result stays **blocked**: this records the focused failure and its test-only repair, not a rerun.
No focused pass, gate pass, build, browser journey or final coverage claim is made here.

## Focused rerun — tap repairs accepted; Backup bullet air

The primary reran `pnpm exec vitest run src/__tests__/scenes/hubScene.test.ts
src/__tests__/game/hubGrid.test.ts`: 2 files / 97 tests passed, and the whitespace check passed.
The matching-press test repairs are accepted; this is the primary's measured result, not a rerun
performed by this follow-up.

Visual inspection of the 844x390 Backup & restore Help card found the content readable and
unclipped, but the four bullet rows vertically dense. `src/components/settings/HelpOverlay.ts` now
uses `POINT_ROW_START = -105` (was `-110`) and `POINT_ROW_PITCH = 90` (was `82`). This is a
layout-only change: all copy, font sizes, wrapping, controls, points, lifecycle behavior and E2E
state are unchanged. The first row shifts slightly down and the wider pitch adds air between rows
while keeping the last two-line point above the footer.

Result stays **blocked**: no build, browser journey, final gate or media recapture is claimed here.

## Journey K — four engines pass; Gate I formatting repair

The primary ran the post-refinement sequence successfully:

- Whitespace check: exit 0.
- Focused `HelpOverlay` + `hubScene` + `hubGrid`: 3 files / 110 tests passed.
- Fresh `pnpm build`: 496 modules; shell `index-BXMw_AwN.js` 190.97 kB printed / 48.43 kB gzip;
  `parent-help-CO1457oM.js` 19.38 kB / 7.35 kB gzip; 66 PWA precache entries / 1890.52 KiB.
- Genuine four-engine Help journey: **8/8 passed** in Chromium, WebKit, Firefox and mobile
  Chromium, with unchanged save snapshots and zero local retries. This closes the prior
  WebKit/Firefox unmatched-release failure recorded above.

The unchanged full gate then stopped at Biome with one formatting-only error in
`src/game/hub/gridBuilder.ts`: the four-condition `if` in the wide tile's pointerup guard had to be
printed on one line. The guard is now exactly

```ts
if (grid.deps.isTimeUp() || grid.navLocked || releaseBlocked || grid.deps.gestureBlocked()) {
```

with no logic change; the five-condition paged and filtered guards were not part of that finding
and remain unchanged.

Result stays **blocked**: the primary will rerun the full gate unchanged and supply the final
measured figures. This section records the primary's already-completed build and journey along
with the formatting repair, not a rerun or a final gate pass by this follow-up.

## Gate II — remaining scene tap simulations

Gate II passed Biome and both TypeScript projects, then stopped at Vitest: 6 files failed / 156
passed and 27 tests failed / 3,463 passed (3,490 total). Every failure was the same test-setup
mismatch: an ordinary tile tap was simulated as `pointerup` without the tile's `pointerdown`,
which the accepted ownership guard correctly rejects. No production defect was found.

Authorization commit `b1f7fa75` added the six test files below to Phase 2 Touches and added
P2.T3.5; metadata `tasks_total` is now 20. These are test-only repairs: no assertion, expected
count, production code, shared helper or deliberate unmatched-release test was changed.

- `src/__tests__/scenes/hubSceneLoad.test.ts`: imported `triggerPointerdownOn`, added a local
  helper that gets a rectangle by index, fires its `pointerdown`, then its `pointerup`, and
  routed every ordinary tile tap (including the `firstTile` retry-cue case) through it. The
  retry cue's direct `cue.handlers.pointerup` and chip/profile pointerup simulations stay
  unchanged.
- `src/__tests__/scenes/firstWordsIntegration.test.ts`: fired `fireObjectEvent` `pointerdown` on
  `tiles[8]` and `tiles[9]` before their ordinary tile pointerups in the Find the Word and Build
  the Word flows.
- `src/__tests__/scenes/feelingsFacesFlow.test.ts`: fired
  `fireAllObjectEvents(tiles[20], "pointerdown")` before the existing pointerup in the 21st-tile
  launch case.
- `src/__tests__/scenes/hubEngagement.test.ts`: in `keeps tile taps navigating to games after
  press feedback is attached`, fired `fireAllObjectEvents(tile, "pointerdown")` immediately
  before the existing pointerup; the other press-feedback tests already dispatch pointerdown and
  stay unchanged.
- `src/__tests__/scenes/hubPlayTime.test.ts`: in the four ordinary tile-tap tests (locked tiles,
  low-time nudge, normal launch, reduced-motion nudge), called
  `triggerPointerdownOn(getRectangles(scene)[0])` before retaining `triggerAllPointerups(scene)`;
  chip/avatar pointerup simulations stay unchanged.
- `src/__tests__/scenes/navigation.test.ts`: fired the matching `pointerdown` before each ordinary
  tile pointerup in the three navigation cases, and called
  `triggerPointerdownOn(getRectangles(scene)[0])` before `triggerAllPointerups(scene)` in the
  AudioManager, WebKit speech and BGM tests; chip/picker/overlay pointerup simulations stay
  unchanged.

Result stays **blocked**: this records the primary's Gate II failure and these test-only repairs,
not a rerun, gate pass, build, browser journey or final coverage claim.

## Gate III — refresh living figures to 162 / 3490

The primary's exact gate now passes every layer except the living-document figures:

- Biome: 385 files clean; app and E2E TypeScript projects clean.
- Vitest: 162 files / 3,490 tests pass.
- Coverage: 97.1 % statements (8,091/8,332), 91.09 % branches (2,455/2,695),
  96.35 % functions (1,800/1,868) and 98.19 % lines (7,500/7,638).
- Vite: 496 modules; shell `index-BXMw_AwN.js` is 190.97 kB printed / 48.43 kB gzip,
  186.5 kB via `validate-bundle` (guard 200 kB, pass); synchronous Help chunk
  `parent-help-CO1457oM.js` is 19.38 kB / 7.35 kB gzip.
- Module-size: 177 files with one warning (`gridBuilder.ts` at 461 lines), still pass.
  Textures pass. PWA: 16 passes / 0 failures, 66 precache entries / 1890.52 KiB.
- Docs validator: 4 passes / 1 failure, from eight stale `3,487`-vs-`3,490` claims at
  `README.md:49`, `docs/TDD.md:1332` and `:1338`, and `docs/perf-baseline.md:3`, `:583`,
  `:922`, `:955` and `:1016`.

This follow-up refreshes only those current living values: suite truth 162 files / 3,490 tests in
all three docs; coverage 97.1 / 91.09 / 96.35 / 98.19 in the current TDD and perf-baseline rows
and the perf-baseline live header; shell `index-BXMw_AwN.js` 190.97 kB printed / 48.43 kB gzip
(186.5 kB bundle guard), Help chunk 19.38 kB / 7.35 kB gzip, 496 modules, 66 PWA entries /
1890.52 KiB. Older dated historical rows and the v1.27.0 release-candidate provenance are
preserved unchanged.

Journey K remains the measured browser result: the genuine four-engine Help journey passed 8/8 in
Chromium, WebKit, Firefox and mobile Chromium with unchanged save snapshots and zero local
retries. The focused suites also passed 247/247 and 110/110, covering both rounds of matching-press
repairs (the first focused nine-test `hubScene` set and the later Gate II six-file set).

Result stays **blocked**: this records the primary's measured Gate III state and the living-figure
refresh only. No rerun, gate pass, build, browser journey or final coverage claim is made here;
the primary will rerun the unchanged exact gate.

## Final verification — primary's unchanged gate and evidence finalization

The primary ran everything unchanged and the result is **verified**:

- Exact gate exit 0: Biome 385 files clean; app and E2E TypeScript clean; Vitest 162 files /
  3,490 tests pass; coverage 97.1 % statements (8,091/8,332), 91.09 % branches (2,455/2,695),
  96.35 % functions (1,800/1,868) and 98.19 % lines (7,500/7,638); Vite 496 modules; shell
  `index-BXMw_AwN.js` 190.97 kB printed / 48.43 kB gzip (186.5 kB via `validate-bundle`, 200 kB
  guard pass); `parent-help-CO1457oM.js` 19.38 kB / 7.35 kB gzip; module-size 177 files with one
  warning (`gridBuilder.ts` at 461 lines, still pass); textures pass; PWA 16 passes / 0 failures
  with 66 entries / 1890.52 KiB; docs validator 5 passes / 0 failures.
- Four-engine Help journey: 8/8 pass in Chromium, WebKit, Firefox and mobile Chromium, with
  unchanged save snapshots and zero local retries.
- Media capture pass at 844x390 mobile-landscape topics and the Backup detail; docs validator
  5/0; whitespace clean.

All earlier repairs are folded into this verified result: the pre-gate journey fixes; Gates A–I
(Biome, TypeScript, test setup, bundle split, depth, roster, formatting and living figures);
the Settings lifecycle fix using `e2eOpen()` for gesture ownership; the tile press-ownership
guard in the wide, paged and filtered grid builders; both matching-press repair rounds (the
earlier nine `hubScene` tests and Gate II's six files under P2.T3.5); Help bullet spacing
(`POINT_ROW_START = -105`, `POINT_ROW_PITCH = 90`); Journey K's four-engine 8/8 pass; and the
Gate III living-figure refresh to 162 files / 3,490 tests.

Final scope: static, offline, parent-gated, read-only Help with the eight specified topics, a
2×4 menu and detail cards, a 480×760 panel, 96×96-or-larger primary targets and 420–430px
wrapping. It inherits the Settings gate on both pages and closes back to the same page. All
eight Settings rows and Backup behavior remain unchanged; Help performs no storage, settings,
download, audio, network or external-navigation action, and the track adds no child-facing UI,
hosted content, localization, dependency, asset, storage or schema change.

Acceptance: AC-1–AC-12 are proved by the unit/integration suites and the four-engine browser
journey. AC-13 remains Phase 3 work and is not claimed here. This finalization touched and
committed only this evidence file; no rerun, other file edit or extra commit was made. There
are no deviations from the approved contract — the earlier blocked statuses, denied commands
and stale-`dist`/lifecycle diagnoses above are recorded process history, not open deviations.
No blockers remain.
