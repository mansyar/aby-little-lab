# Install Prompt Lifetime

> Requirements are stable. Do not renumber `FR-*`, `NFR-*` or `AC-*`; mark a
> withdrawn item **Withdrawn** in place and keep the id.

## Overview

The Settings panel is the only place a parent can install the app, and the row
it shows is decided from a browser event that fires once per page load. Today
the object that listens for that event is built when the panel opens and thrown
away when it closes, so the event has almost always already fired into nothing.
On Chrome, Edge and Android the panel therefore shows no install row at all.

The same object also keeps offering "Install App" after it has used the one
prompt it captured, which turns into a second dead affordance as soon as the
capture outlives the panel.

## Problem / Motivation

Two defects share one root cause: the install prompt's lifetime is shorter than
the panel's ability to use it, and the captured prompt is not marked as spent.

**D1 - the capture is too short-lived.** `createInstallTracker()` subscribes to
`beforeinstallprompt` and `appinstalled` at construction and unsubscribes on
`destroy()` (`src/utils/pwaInstall.ts:86-87`, `:105-108`). `SettingsPanel`
constructs one per open and destroys it on close
(`src/components/SettingsPanel.ts:71-80`, `:188`). The browser fires
`beforeinstallprompt` once per page load, shortly after load - before the
parental lock is held and the panel drawn. By the time `InstallRow.create()`
reads the state (`src/components/settings/InstallRow.ts:43`) there has never
been a listener, so `promptAvailable` is `false` and
`getInstallUiState()` returns `"hidden"` on every non-iOS platform
(`src/utils/pwaInstall.ts:27-32`). The iOS branch is unaffected because it does
not depend on the event.

**D2 - a spent prompt still reads as available.** `prompt()` nulls the deferred
event but leaves `promptAvailable` true (`src/utils/pwaInstall.ts:98-104`), so
`getState()` keeps returning `"installable"` and the row keeps offering a
button whose taps resolve `false` without any visible effect.

D2 is nearly unreachable today because the panel is short-lived and rarely
open at the moment of a dismissal. Fixing D1 makes it reachable on every later
visit, so both must be corrected together.

### Reproduction

1. Open the deployed app in Chrome or Edge on Android or desktop, in a fresh
   profile so installability criteria are met.
2. Wait for the install prompt to fire - DevTools' Application panel logs
   `beforeinstallprompt` within a few seconds of load.
3. Hold the avatar chip for the parental unlock, open Settings.
4. **Expected:** an "Install App" row.
   **Actual:** no install row at all; the panel jumps from the first row to the
   next. (`"hidden"` state, not an error.)

Second reproduction, for D2, once D1 is fixed: install row shown, tap it, and
dismiss the browser dialog. Reopen Settings on the same page and tap "Install
App" again - nothing happens, now or ever.

### Root-cause hypothesis

The tracker is owned by the panel rather than by the app. Browser install
events are app-lifetime facts, and the deferred prompt is single-use, so the
tracker must outlive the panel and must stop advertising a prompt it has spent.

### Regression test

`src/__tests__/utils/pwaInstall.test.ts` gains cases for a tracker's state
after `prompt()`, and a Settings-panel case fires `beforeinstallprompt` *before*
the panel is constructed and asserts the "Install App" row appears. Both fail
before the change: the panel case because `createInstallTracker` is called
inside the constructor and `getState()` reports `"hidden"`.

## Goals & Success Metrics

- **G1** A `beforeinstallprompt` that fires at any point after boot, however
  early, is available to the next Settings panel that opens.
- **G2** A prompt that has been spent is no longer offered.
- **G3** iOS and already-installed behaviour is unchanged.
- **G4** The change is covered by unit tests and the documents describe it.

Success is measured by the regression tests above plus the existing
`SettingsPanel` and `pwaInstall` suites staying green; there is no runtime
metric, because the event is browser-controlled.

## Scope

**In scope**

- `src/utils/pwaInstall.ts`: a browser-wired factory and an app-lifetime
  instance seam, plus the spent-prompt state.
- `src/main.ts`: start capture before the game boots.
- `src/components/SettingsPanel.ts`: use the app-lifetime tracker and stop
  tearing down a tracker the panel does not own.
- `src/utils/` or `src/components/settings/` tests for the above.
- `docs/PRD.md`, `docs/TDD.md`, `docs/roadmap.md`.

**Out of scope**

- Adding the row live while the panel is already open (state is read at open).
- Remembering a dismissal across reloads.
- A generic non-iOS "install from the browser menu" overlay.
- An install banner or nudge outside Settings.
- Changes to the iOS how-to content.
- Any change to the stored save payload.

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | Install-event capture starts during boot, before the first scene renders, and lasts for the life of the page rather than the life of a Settings panel. | Must |
| FR-2 | The Settings panel reads that app-lifetime tracker by default, and closing the panel must not stop the capture; an injected tracker still overrides it for tests. | Must |
| FR-3 | A captured prompt is single-use: once `prompt()` has attempted to show it, `getState()` no longer reports `installable` unless the browser captures a new prompt event. | Must |
| FR-4 | iOS keeps reporting `ios-howto` whenever the app is not standalone and no prompt is available; an installed app or standalone display reports `hidden`. | Must |
| FR-5 | Nothing about the dismissal is persisted; a later reload starts from the browser's own state. | Must |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | No new runtime dependency and no new network request; the shell must stay offline-first. |
| NFR-2 | `pwaInstall.ts` stays testable without a browser: browser objects are reached only through an injected dependency object, and the app-lifetime factory is a thin adapter. |
| NFR-3 | No change to the storage schema or to the save payload. |
| NFR-4 | Listeners are registered once per page, not once per panel open, and `destroy()` still removes both. |
| NFR-5 | The shell bundle stays under the 200 kB gate and no additional chunk is introduced. |
| NFR-6 | Tests drive install events through the dependency seam, never through real browser events. |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | With a `beforeinstallprompt` captured before the Settings panel is constructed, opening Settings shows the "Install App" row. | FR-1, FR-2 |
| AC-2 | Opening and closing Settings does not lose a prompt that fires after the panel closed; the next open still shows "Install App". | FR-2, NFR-4 |
| AC-3 | After `prompt()` has run, `getState()` reports `hidden` on a non-iOS platform, and the panel shows no install row. | FR-3 |
| AC-4 | On iOS without a prompt the row is "How to Install"; with `appinstalled` fired or standalone mode the row is absent. | FR-4 |
| AC-5 | The dismissal writes nothing to storage. | FR-5, NFR-3 |
| AC-6 | `pnpm check`, typecheck, the full suite, coverage, build, the bundle and PWA validators, and the docs validator all pass. | NFR-1, NFR-5 |

## Edge Cases

- **Prompt arrives while Settings is open.** The row keeps the state it was
  created with; the next open shows "Install App". No live insertion.
- **The browser fires a second `beforeinstallprompt` after a dismissal.** The
  new event is a fresh offer and makes the row available again.
- **`prompt()` rejects.** The event is single-use regardless, so the state stops
  advertising it; the rejection is not surfaced to the child.
- **`appinstalled` fires while Settings is open.** The row stays until the panel
  closes; the next open hides it.
- **The app is already standalone at boot.** The state is `hidden` from the
  first open, with no event needed.
- **Two panels in sequence** (close, reopen) must not register a second pair of
  listeners.

## Dependencies

- **Tracks:** none.
- **External:** Chrome/Edge/Android `beforeinstallprompt` and `appinstalled`
  semantics; iOS Safari's lack of an install prompt; the existing PWA manifest.

## Open Questions & Assumptions

- **Assumption:** `main.ts` is the right boot point, mirroring `initPwaBridge`
  (`src/main.ts:38`), which already starts before `new Phaser.Game`.
- **Assumption:** a spent prompt cannot be re-offered in the same page life, so
  treating any `prompt()` attempt as final is correct.
- **Open:** whether a future release wants a wordless non-iOS how-to after
  dismissal. Deferred; hiding is the quiet choice.

## References

- `src/utils/pwaInstall.ts` - state machine, tracker, browser events.
- `src/components/SettingsPanel.ts:71-80`, `:188` - per-open construction and
  teardown.
- `src/components/settings/InstallRow.ts:43`, `:68-74` - state read and tap.
- `src/main.ts:38-40` - boot sequence.
- `src/__tests__/utils/pwaInstall.test.ts` - tracker suite.
- `docs/PRD.md` §1.4, §4.10 - the install promise; `docs/TDD.md:621` - module
  table row.
