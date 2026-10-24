# Implementation Plan: Install Prompt Lifetime

Branch: `fix/20261024-install-prompt-lifetime`
Base: `master` @ `329370f6`

> Only the primary agent writes this file. A phase executor records its work in
> `verification/phase-<n>.md` and reports back; it never edits `plan.md`.

## Phase 1: The prompt outlives the panel

**Goal:** Install-event capture starts at boot and survives every Settings
panel open/close, so a `beforeinstallprompt` that fired before the panel
existed is still available when a parent opens it.

**Depends on:** none

**Covers:** FR-1, FR-2, AC-1, AC-2

**Touches:** `src/utils/pwaInstall.ts`, `src/main.ts`,
`src/components/SettingsPanel.ts`, `src/__tests__/utils/pwaInstall.test.ts`,
`src/__tests__/components/SettingsPanel.test.ts`

**Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`

**Status:** verified

- [x] **P1.T1: A browser-wired tracker with an app-lifetime seam** — covers: FR-1
  - [x] **P1.T1.1:** Add `createBrowserInstallTracker()` to `src/utils/pwaInstall.ts`: builds the existing `InstallTrackerDeps` from `navigator.userAgent`, `window.matchMedia("(display-mode: standalone)")` and `window.addEventListener`/`removeEventListener`, then delegates to `createInstallTracker()`. Guard the same way the rest of the codebase guards engine-agnostic globals, so an environment without `window` or `matchMedia` still yields a tracker in the `hidden` state rather than throwing. Keep `createInstallTracker()` unchanged as the injectable core.
  - [x] **P1.T1.2:** Add `initInstallPrompt()` and `getInstallPromptTracker()`: init creates the browser tracker once and stores it; the getter returns the stored instance, creating it lazily if `initInstallPrompt()` was never called (a Hub-only entry, or a test that imports the panel first). A second `initInstallPrompt()` call must not register a second pair of listeners.
  - [x] **P1.T1.3:** Tests in `src/__tests__/utils/pwaInstall.test.ts`: the getter returns one stable instance across calls; `initInstallPrompt()` called twice leaves one instance and one listener pair; a fake-dep tracker still drives `installable`/`ios-howto`/`hidden` exactly as before.
- [x] **P1.T2: Boot starts the capture** — covers: FR-1
  - [x] **P1.T2.1:** Call `initInstallPrompt()` in `src/main.ts` before `new Phaser.Game`, beside the existing `initPwaBridge(registerSW)` call, with a one-line comment saying why it must run before any scene can open Settings.
- [x] **P1.T3: The panel borrows the tracker instead of owning it** — covers: FR-2
  - [x] **P1.T3.1:** In `src/components/SettingsPanel.ts`, default the constructor's tracker to `getInstallPromptTracker()` when none is injected, and delete the inline `createInstallTracker({...})` block. Update the constructor doc comment: the panel borrows an app-lifetime tracker, an injected one still wins for tests.
  - [x] **P1.T3.2:** Remove `this.installTracker.destroy()` from `destroy()` with a comment stating the panel does not own the tracker, so closing Settings must not stop capture. Keep every other teardown as is.
  - [x] **P1.T3.3:** Tests in `src/__tests__/components/SettingsPanel.test.ts`: (a) fire `beforeinstallprompt` on a real tracker built from fake deps, *then* construct the panel with it, and assert the "Install App" row exists; (b) with the same tracker, open and close the panel, fire the event after the close, reopen and assert the row appears — and assert the tracker's `removeEventListener` was never called; (c) the injected-`hidden` and injected-`ios-howto` cases keep their current expectations.

**Result:** verified
**Checkpoint:** 52f89530
**Evidence:** conductor/tracks/20261024-install-prompt-lifetime/verification/phase-1.md

## Phase 2: A spent prompt is not offered again

**Goal:** After the deferred prompt has been used, the row stops claiming the
app can be installed, so no tap ever lands on a button that cannot act.

**Depends on:** Phase 1

**Covers:** FR-3, FR-5, AC-3, AC-5

**Touches:** `src/utils/pwaInstall.ts`, `src/__tests__/utils/pwaInstall.test.ts`,
`src/__tests__/components/SettingsPanel.test.ts`

**Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`

**Status:** verified

- [x] **P2.T1: `promptAvailable` means an unused prompt** — covers: FR-3
  - [x] **P2.T1.1:** In `prompt()`, clear availability as part of spending the event: after `await promptEvent.prompt()` (and on a rejection, since the event is single-use either way), `promptAvailable` is `false`. A later `beforeinstallprompt` sets it back to `true`, which is the only way it can return. Rename or re-document the flag and the `InstallStateInput.promptAvailable` comment so the meaning is "a captured, unused prompt exists" rather than "an event has ever been seen".
  - [x] **P2.T1.2:** Tests in `src/__tests__/utils/pwaInstall.test.ts`: after `prompt()`, `getState()` is `hidden` on an Android user agent and `ios-howto` on iOS; `prompt()` a second time resolves `false`; a fresh `beforeinstallprompt` after a dismissal makes the state `installable` again; the rejection path (`prompt()` throws) also ends in `hidden` without propagating.
  - [x] **P2.T1.3:** Test in `src/__tests__/components/SettingsPanel.test.ts`: a tracker whose prompt has already been spent renders no install row.
- [x] **P2.T2: Nothing is remembered** — covers: FR-5, AC-5
  - [x] **P2.T2.1:** Assert in `src/__tests__/utils/pwaInstall.test.ts` that a tracker + dismissal writes no storage: `pwaInstall.ts` has no storage import, so pin the property by asserting the storage module is not imported by the tracker path (a source check in the test is acceptable, or assert that a `localStorage`/`getItem`/`setItem` spy stays untouched while a fake prompt is spent). Choose whichever reads cleanest and note it in the evidence.

**Result:** verified
**Checkpoint:** e06fb292
**Evidence:** conductor/tracks/20261024-install-prompt-lifetime/verification/phase-2.md

## Phase 3: The documents describe the row that is there

**Goal:** The PRD, TDD, roadmap and README describe the shipped lifetime rules
and stop listing the lost-prompt bug.

**Depends on:** Phase 2

**Covers:** FR-4, AC-4, AC-6

**Touches:** `docs/PRD.md`, `docs/TDD.md`, `docs/roadmap.md`, `README.md`

**Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`

**Status:** verified

- [x] **P3.T1: PRD** — covers: FR-4
  - [x] **P3.T1.1:** §1.4 and §4.10 state that capture begins when the app boots, that the row reflects the browser's current offer rather than the moment the panel opened, that a used prompt is not offered again for the rest of the page's life, and that nothing is remembered across reloads. Keep the iOS and already-installed sentences true and unchanged in meaning.
- [x] **P3.T2: TDD** — covers: FR-1, FR-2, FR-3
  - [x] **P3.T2.1:** Update the `pwaInstall.ts` module row and add a short paragraph covering: the injectable core vs the browser adapter, the app-lifetime holder and where it is initialised, that the panel borrows it and does not destroy it, and the single-use flag. Leave the rest of the module table alone.
- [x] **P3.T3: Roadmap and README** — covers: AC-4, AC-6
  - [x] **P3.T3.1:** Delete the "The install prompt can disappear" Known Issue from `docs/roadmap.md` and its Future Work entry, renumbering the survivors consecutively so they read 1..n with no gaps.
  - [x] **P3.T3.2:** Check `README.md`'s Known Issues section: if it lists the install prompt, remove that bullet and correct the count; if it does not, leave it alone and say so in the evidence.
  - [x] **P3.T3.3:** Run `node scripts/validate-docs.js` and record the five checks.

**Result:** verified
**Checkpoint:** dd1099c9
**Evidence:** conductor/tracks/20261024-install-prompt-lifetime/verification/phase-3.md
**Note:** the docs layer was denied to the phase subagent and run green (5/5) by the primary, who also appended a ## Primary verification section to the evidence.

## Notes for the primary agent

- `spec.md` FR-3 is the subtle one: availability means *an unused captured
  prompt exists*. Do not add a second boolean; re-use the existing flag and let
  a new browser event clear the spent state.
- The panel's `destroy()` currently calls `installTracker.destroy()`. Nothing in
  `SettingsPanel.test.ts` asserts it, so removing the call is safe, but the
  reason must stay documented or a later reader will "restore" it.
- `hubScene.test.ts` and other scene suites stub `window` partially; the browser
  adapter must tolerate that the way `canObserveVisibility()` does elsewhere.
- The bundle fingerprint will change. Expect a new `index-*.js` name in the
  evidence tables, and do not treat a changed hash as a regression.

## Phase R1: Review Fixes

**Goal:** Close every round-1 finding: the untested boot wiring (F1), the
overstated PRD sentences (F4, F5), the narrow AC-5 case (F3), and the three
accuracy nits (F2, F6, F7).

**Depends on:** Phase 3

**Covers:** findings F1-F7; FR-1, FR-3, FR-4, FR-5; AC-4, AC-5

**Touches:** `src/__tests__/utils/pwaInstall.test.ts`, `src/utils/pwaInstall.ts`,
`docs/PRD.md`, `docs/TDD.md`,
`conductor/tracks/20261024-install-prompt-lifetime/verification/phase-3.md`

**Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`

**Status:** verified

- [x] **R1.T1: Pin the boot wiring** - covers: FR-1 (F1)
  - [x] **R1.T1.1:** In `src/__tests__/utils/pwaInstall.test.ts`, import `../../../src/main.ts?raw` (the `?raw` pattern used by `src/__tests__/game/art/shellOwnership.test.ts`) and assert that `initInstallPrompt(` appears in the source and that its index is lower than the index of `new Phaser.Game(`. Explain in the test name that this is the once-per-page capture.
  - [x] **R1.T1.2:** Prove it goes red: temporarily move the call below `new Phaser.Game` in `src/main.ts`, run the case, record the failure text, restore the file, and confirm the suite is green again.
- [x] **R1.T2: Tell the truth in the adapter's doc** - covers: F2
  - [x] **R1.T2.1:** Reword the `getInstallPromptTracker()` JSDoc parenthetical from "a Hub-only host, or a test that builds the panel first" to the real case - a test that constructs the panel before any boot code has run. Keep the first clause about lazy creation.
- [x] **R1.T3: Widen the AC-5 case** - covers: AC-5, FR-5 (F3)
  - [x] **R1.T3.1:** In the storage case, between the spend assertion and `destroy()`, call `tracker.getState()` and assert `hidden`, and invoke the captured `appinstalled` listener once. The five storage-method assertions stay after both, so a read or write on either route now fails the case.
- [x] **R1.T4: Correct the PRD's promise** - covers: FR-3, FR-4, AC-4 (F4, F5)
  - [x] **R1.T4.1:** In §1.4 and §4.10, replace "the row is gone for the rest of that page's life" with the accurate sequence: the next open has no row, it only returns if the browser makes a fresh offer, and the row already on screen does not change. Keep the existing "nothing is remembered across reloads" sentence.
  - [x] **R1.T4.2:** State the third iOS condition in both places: the how-to shows where the app is neither installed nor running standalone and no prompt is available.
- [x] **R1.T5: Complete the boot description in the TDD** - covers: FR-1 (F6)
  - [x] **R1.T5.1:** In §3.1 (`docs/TDD.md:360`), add one clause: `initInstallPrompt()` runs before `new Phaser.Game`, so the once-per-load offer is captured before any scene can open Settings.
- [x] **R1.T6: Correct the phase-3 evidence** - covers: AC-6 (F7)
  - [x] **R1.T6.1:** In `verification/phase-3.md`, replace the unreachable `bfa79874`/`419a2221` references with `dd1099c9` (both commits were squashed into it) and restate the measured insertion count for the range. Do not rewrite the rest of the evidence.
- [x] **R1.T7: Gate and evidence** - covers: AC-6
  - [x] **R1.T7.1:** Run the full chain layer by layer, then write `verification/phase-R1.md`: what changed per finding, the commands table, the red-then-green text for R1.T1.2, and the FR/AC mapping.

**Result:** verified
**Checkpoint:** 15cc5b77
**Evidence:** conductor/tracks/20261024-install-prompt-lifetime/verification/phase-R1.md
<!--
Phase completion is recorded by the primary agent only:

**Result:** verified | failed | blocked
**Checkpoint:** <commit>
**Evidence:** conductor/tracks/20261024-install-prompt-lifetime/verification/phase-<n>.md

`conductor-review` appends a `## Phase R1: Review Fixes` block here if needed.
-->
