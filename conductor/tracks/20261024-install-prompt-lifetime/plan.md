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

**Status:** pending

- [ ] **P2.T1: `promptAvailable` means an unused prompt** — covers: FR-3
  - [ ] **P2.T1.1:** In `prompt()`, clear availability as part of spending the event: after `await promptEvent.prompt()` (and on a rejection, since the event is single-use either way), `promptAvailable` is `false`. A later `beforeinstallprompt` sets it back to `true`, which is the only way it can return. Rename or re-document the flag and the `InstallStateInput.promptAvailable` comment so the meaning is "a captured, unused prompt exists" rather than "an event has ever been seen".
  - [ ] **P2.T1.2:** Tests in `src/__tests__/utils/pwaInstall.test.ts`: after `prompt()`, `getState()` is `hidden` on an Android user agent and `ios-howto` on iOS; `prompt()` a second time resolves `false`; a fresh `beforeinstallprompt` after a dismissal makes the state `installable` again; the rejection path (`prompt()` throws) also ends in `hidden` without propagating.
  - [ ] **P2.T1.3:** Test in `src/__tests__/components/SettingsPanel.test.ts`: a tracker whose prompt has already been spent renders no install row.
- [ ] **P2.T2: Nothing is remembered** — covers: FR-5, AC-5
  - [ ] **P2.T2.1:** Assert in `src/__tests__/utils/pwaInstall.test.ts` that a tracker + dismissal writes no storage: `pwaInstall.ts` has no storage import, so pin the property by asserting the storage module is not imported by the tracker path (a source check in the test is acceptable, or assert that a `localStorage`/`getItem`/`setItem` spy stays untouched while a fake prompt is spent). Choose whichever reads cleanest and note it in the evidence.

## Phase 3: The documents describe the row that is there

**Goal:** The PRD, TDD, roadmap and README describe the shipped lifetime rules
and stop listing the lost-prompt bug.

**Depends on:** Phase 2

**Covers:** FR-4, AC-4, AC-6

**Touches:** `docs/PRD.md`, `docs/TDD.md`, `docs/roadmap.md`, `README.md`

**Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`

**Status:** pending

- [ ] **P3.T1: PRD** — covers: FR-4
  - [ ] **P3.T1.1:** §1.4 and §4.10 state that capture begins when the app boots, that the row reflects the browser's current offer rather than the moment the panel opened, that a used prompt is not offered again for the rest of the page's life, and that nothing is remembered across reloads. Keep the iOS and already-installed sentences true and unchanged in meaning.
- [ ] **P3.T2: TDD** — covers: FR-1, FR-2, FR-3
  - [ ] **P3.T2.1:** Update the `pwaInstall.ts` module row and add a short paragraph covering: the injectable core vs the browser adapter, the app-lifetime holder and where it is initialised, that the panel borrows it and does not destroy it, and the single-use flag. Leave the rest of the module table alone.
- [ ] **P3.T3: Roadmap and README** — covers: AC-4, AC-6
  - [ ] **P3.T3.1:** Delete the "The install prompt can disappear" Known Issue from `docs/roadmap.md` and its Future Work entry, renumbering the survivors consecutively so they read 1..n with no gaps.
  - [ ] **P3.T3.2:** Check `README.md`'s Known Issues section: if it lists the install prompt, remove that bullet and correct the count; if it does not, leave it alone and say so in the evidence.
  - [ ] **P3.T3.3:** Run `node scripts/validate-docs.js` and record the five checks.

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

<!--
Phase completion is recorded by the primary agent only:

**Result:** verified | failed | blocked
**Checkpoint:** <commit>
**Evidence:** conductor/tracks/20261024-install-prompt-lifetime/verification/phase-<n>.md

`conductor-review` appends a `## Phase R1: Review Fixes` block here if needed.
-->
