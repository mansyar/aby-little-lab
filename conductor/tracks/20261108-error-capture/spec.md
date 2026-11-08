# Error Capture — Specification

> **Conventions.** Requirement IDs (`FR-`, `NFR-`, `AC-`) are stable once approved and are never renumbered. A requirement that is later removed is marked `Withdrawn` with the date and reason rather than deleted.

## Overview

The app has no global error handler. A crash today is a blank or frozen canvas, a `console.error` nobody sees, and a parent concluding the tablet is broken. This track installs the two handlers that mean "the app broke", records each crash in a bounded device-level log, shows the child a calm icon-only recovery card, and gives the parent a diagnostics file to download from Settings — with no transmission of any kind.

The roadmap row reads: *Global handlers → local error log plus "Copy diagnostics" in parent settings; no transmission. Exit gate: a crash yields a shareable, human-readable trace.*

## Problem / Motivation

Four facts, all verified in the code on 2026-11-08:

- **No handler exists.** `window.addEventListener("error")` and `"unhandledrejection"` appear nowhere in `src/`. The only error-adjacent code is `console.warn` in `loadSceneWithRetry` (`src/scenes/sceneRegistry.ts:83`), a `console.warn` in `placeholder.ts:46`, and `utterance.onerror` in `speech.ts:133`. All three write to a console that a parent holding a tablet will never see.
- **A failed chunk load is already semi-handled but silently.** `loadSceneWithRetry` retries once and returns `false`; the hub shows a retry cue. If a scene throws during `create`, nothing catches it.
- **The failure the user actually reports is "it stopped".** Because there is no card, the observable state of a crash is the last frame the child was on, which is indistinguishable from a frozen tab.
- **Diagnostics are the roadmap's own gap.** The metrics table in `product.md` §10.3 lists "uncaught errors per 100 sessions" with a target of `<1` and a current value of `unknown`, because nothing counts them. This track is the instrument that makes that row measurable at all.

## Goals & Success Metrics

- **Goal:** a crash is visible, recoverable and reportable.
  - **Metric:** a browser journey throws a real uncaught error and asserts that the card appears, that one tap returns to a working hub, and that the downloaded diagnostics file contains that error's message and stack.
- **Goal:** the log cannot itself become a failure.
  - **Metric:** unit tests prove that a crash during recording is dropped rather than thrown, that the buffer never exceeds 20 entries, and that the save remains schema version 1 with additive backfill from a pre-track payload.
- **Goal:** nothing about the child's experience changes except the crash screen.
  - **Metric:** no text on the card; page one's eight Settings rows keep their exact coordinates; the shell entry stays inside the 200 kB gate.

## Scope

**In Scope**

- A pure log module: entry shape, ring buffer, report text, and a `now` argument so it is testable without a clock.
- A capture module that installs both handlers before the game exists, records through the total save layer, and asks for the recovery surface.
- An icon-only recovery card drawn in Phaser, with one tap target.
- A one-shot `location.reload()` for a crash that happens before any scene is active, guarded so a deterministic boot failure cannot loop.
- A "Save diagnostics" row on Settings page two, writing a dated `.txt` through the existing download seam.
- Guard-test updates so the capture module is an enumerated exception rather than an unrecorded one.
- Unit tests for the pure module and the capture wiring; one browser journey for the whole path; documentation.

**Out of Scope**

- Any network transport, crash-reporting SDK, telemetry endpoint or `fetch(`.
- Copying to the clipboard: the roadmap's wording says "Copy", the implementation downloads a file, and the guard forbids `navigator.clipboard` outside the backup seam. Recorded as a deliberate deviation in the roadmap row.
- Capturing soft failures the app already swallows (a retried scene load, a refused storage write, a failed TTS utterance). The log is for crashes.
- A breadcrumb trail of the child's last actions.
- Breadcrumbs in the save, per-game reporting, or any parent dashboard of error counts.
- Session replay, screenshots of the failure, or source maps upload.
- Changing `SCHEMA_VERSION`, the backup envelope's fields, or the shape of any existing field.

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | Both handlers are installed before `new Phaser.Game(config)` runs, so a throw during boot is captured. The handler itself never throws: every value it touches is read defensively and the whole body is wrapped. | must |
| FR-2 | A crash entry is `{ at, kind, message, stack }`: `at` an ISO timestamp, `kind` one of `error` / `rejection`, `message` the error's message or the stringified rejection reason, `stack` the stack when present trimmed to at most 400 characters. A non-`Error` rejection (a string, `undefined`, an object) produces a readable message and an absent stack, never `[object Object]` alone and never a throw. | must |
| FR-3 | The log is a ring buffer of the 20 most recent entries, stored device-level at `Settings.diagnostics`, dropped oldest-first. It survives every child action including profile deletion and progress reset, and it is never shown to a child. | must |
| FR-4 | Adding an entry goes through the total save layer. It cannot throw into the error handler, cannot recurse (a crash raised while recording is dropped, not recorded), and cannot fail a session that is already degraded: when the store refuses the write the entry stays in memory for the session and the existing degraded notice still applies. | must |
| FR-5 | The log is additive at schema version 1. `createDefaultProfile`/settings normalisation backfills `diagnostics: []`; a payload written before this track loads with an empty log; an unknown `schemaVersion` remains write-protected exactly as it is today. | must |
| FR-6 | The recovery card is a Phaser scene drawn on the app's palette: the mascot in its existing `mascot_idle` pose (no new art), one large circular-arrow button, **no text**. It appears on the first uncaught error while any scene is active, sits above every other surface, takes pointer input only on its one button, and reloads the page when tapped. If the mascot texture is not loaded yet it draws without it rather than failing. | must |
| FR-7 | A crash that happens before any scene is active performs **one** `location.reload()`, guarded by a session-scoped flag so a deterministic boot error cannot loop: on the second failure within the same session the page stays put and the crash is logged rather than retried. | must |
| FR-8 | Settings page two gains a "Save diagnostics" row at the next free pitch, with the result line below it. Page one's eight rows, their labels, their order and their coordinates are unchanged. | must |
| FR-9 | The row writes `diagnostics-<local day>.txt` through the same download seam the backup uses, and reports `Saved <filename>` on success. With an empty log it writes nothing and reports that no crashes have been recorded. | must |
| FR-10 | The file is human-readable plain text: a short environment header, then the entries newest-first. The header carries the app version, the moment of export, the user agent, the viewport size, the number of profiles, a one-word play-time state, and whether persistence is degraded. | must |
| FR-11 | Responsibilities are split: `src/utils/diagnostics.ts` is pure (no browser global, no clock read — `now` is an argument), and `src/game/errorCapture.ts` is the only production module this track adds that names a browser global. | must |
| FR-12 | The DOM guard test becomes a statement about this module too: its watched set gains `window.` and `sessionStorage`, the capture module is added to the enumerated allowlist with its reason, and a seventh module naming a watched global still fails. | must |
| FR-13 | No transmission and no new dependency: zero `fetch(` in `src/`, nothing sent anywhere, no package added, and the log leaves the device only when a parent downloads it. | must |
| FR-14 | Documentation records the behaviour: the browser-journey layer's section notes the crash path and the diagnostics file, `tech-stack.md` gains a dated entry for the new stored field, and the roadmap's `20261124-error-capture` row becomes Done with the clipboard deviation stated plainly. | should |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | The stored log is bounded by a ceiling that follows from its constants: 20 entries at 400 characters of stack is at most 12,000 bytes of JSON (`20 × (400 + 200)` for the timestamp, kind and keys), and twenty maximum-length entries measure 9,612. A crash loop must not be able to consume the quota the guarded save layer exists to survive. |
| NFR-2 | The handler path adds no measurable cost to a normal frame: it is listener registration at boot and nothing else. Recording happens only when a crash fires. |
| NFR-3 | The recovery card is drawn in Phaser, not the DOM, so the app's single rendering model holds for every surface a child can see. |
| NFR-4 | No new dependency and the shipped shell entry stays inside the 200 kB `validate-bundle` gate. The recover scene is registered eagerly (Phaser 4 cannot lazily add to the scene array), so its bytes are part of that number and must be reported. |
| NFR-5 | The whole gate stays green at the existing coverage gate (95 lines / 88 functions / 85 branches / 90 statements) with every new branch exercised, including the empty log, the non-`Error` rejection, the pre-canvas reload, the refused write and the loop guard. |
| NFR-6 | The browser suite gains exactly one journey and no more than about 15 seconds. CI already measured 5m28s against NFR-5's 5-minute ceiling from the backup track; this track must not make that worse than its own journey, and the breach is recorded as an existing finding rather than widened. |
| NFR-7 | No child-facing text and no new child-facing surface. The only screen a child can newly reach is the crash card, and it is icon-only. |

**NFR-1 amendment (2026-11-08, found during Phase 1).** The original wording bounded the log "under 4 kB of JSON", a figure written before the arithmetic: twenty entries at 400 characters of stack are 8,000 characters of stack before a single timestamp, and the measured buffer at maximum stack lengths is 9,612 bytes, so the number was unachievable by construction. The requirement is now the ceiling the constants imply — 12,000 bytes — with the measurement recorded beside it, and AC-2 asserts that bound. The intent is unchanged and still met: a completely full crash log is around ten kilobytes against a store whose own saves run to tens of kilobytes that this app already tolerates, so a crash loop still cannot threaten the quota. The alternative — shrinking `MAX_STACK_CHARS` until 4 kB became true — would have cut away the frames that make a trace worth downloading, which is the opposite of why the log exists.

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | With a handler installed, a thrown error and a rejected promise each produce one entry with the right `kind`, a message, and a stack where one exists; a rejected string, `undefined` and a plain object each produce a readable entry and no throw. | FR-1, FR-2 |
| AC-2 | A 25-entry sequence keeps the newest 20 in order and drops the oldest five; the persisted payload parses and stays under the 12,000-byte ceiling that follows from the constants (measured 9,612 for twenty maximum-length entries). | FR-3, NFR-1 |
| AC-3 | A payload written before this track (no `diagnostics` field) loads with an empty log, saves normally, and `SCHEMA_VERSION` is still 1; an unknown-version payload is still refused a write. | FR-5 |
| AC-4 | With `setItem` throwing, recording an entry does not throw and the session continues; `getDiagnostics()` returns the entry from memory for the rest of the session; and once the store accepts writes again, the next accepted save persists that entry rather than dropping it. | FR-4 |
| AC-5 | An uncaught error while the hub is active shows the card over the scene, the card contains no text object, and tapping its single button reloads the page to a working hub. | FR-6, NFR-7 |
| AC-6 | An uncaught error with no active scene reloads exactly once; a second crash in the same session does not reload again and is logged. | FR-7 |
| AC-7 | Settings page two exposes the diagnostics row at the next pitch and page one's eight rows report the same labels at the same `y` values as before the change. | FR-8 |
| AC-8 | With entries present, the row downloads `diagnostics-<day>.txt` whose exact text contains the app version, the environment header, and every logged message newest-first; with no entries it downloads nothing and says so. | FR-9, FR-10 |
| AC-9 | The guard test fails if a new production module names `window.`, `sessionStorage`, `document`, `Blob`, `URL.`, `crypto`, `FileReader` or `navigator.clipboard`, and fails if the capture module or the backup seam loses its entry or stops naming its global. | FR-11, FR-12 |
| AC-10 | A journey throws a real error in the page, sees the card, taps it, then reads the downloaded diagnostics text and finds that error's message; the suite passes with the new journey and no retries. | FR-9, NFR-6 |
| AC-11 | `grep` finds zero `fetch(` in `src/`, `package.json` is unchanged, and the shell entry size is recorded before and after. | FR-13, NFR-4 |

## Edge Cases

- **A crash inside the crash handler.** The record call is wrapped; if it throws, the failure is swallowed and the card still shows. An error handler that can throw turns one crash into two.
- **The same crash firing repeatedly.** React-style loops, a rAF callback that throws every frame, or a resize handler that fails: the ring buffer simply keeps the newest 20, and the card is only *raised* once per page load (`raising` flag) so it cannot stack scenes.
- **A crash while the recover card is already up.** No second card; the entry is still recorded.
- **Storage degraded or read-blocked when the crash fires.** Recording must not recurse into the failure that caused it: the write path is already total, the entry lives in memory, and the panel's existing "Progress can't be saved" line remains the explanation.
- **An unknown-`schemaVersion` payload.** The write-protection branch writes memory-only by design; a crash record in that session is memory-only too, and that is correct rather than a bug — it must be stated in the evidence, not silently accepted.
- **A rejection with no reason.** `Promise.reject()` produces `"Unhandled rejection with no reason"`, not an empty entry.
- **A very long stack.** Trimmed to 400 characters from the front, where the message and the throwing frame are.
- **A boot failure that also breaks the reload.** If reload does not recover, the session flag stops a loop and the second crash is logged; the page is left as-is, which is the honest floor.
- **A parent exporting on a day with no crashes.** Nothing is downloaded; the row says so. An empty file that a parent emails is worse than a sentence.
- **The `?e2e=1` bridge.** It must not become the way the crash journey triggers a crash in production code: the journey throws from the page itself, and no test-only crash hook is added.

## Dependencies

**Tracks**

- `20261107-storage-resilience` (merged): the total save layer, `isPersistenceDegraded()`, and the panel notice this track builds on.
- `20261108-backup-restore` (merged): the download seam (`backupFile.ts`), the second Settings page, and the guard test this track extends.
- `20261107-release-e2e` (merged): the journey harness and the `?e2e=1` bridge.

**External**

- None. No package is added.

## Open Questions & Assumptions

| Question | Assumption |
| --- | --- |
| Are `error` and `unhandledrejection` enough coverage for a Phaser game? | Yes for this track. Phaser reports load failures through its loader events and through `loadSceneWithRetry`; a scene that throws inside `create` surfaces as an uncaught error on the rAF tick, which `window.onerror` receives. If a journey shows otherwise, the assumption is corrected in the evidence rather than worked around. |
| Does the recover scene's eager registration cost shell budget? | It costs some. The track reports the before/after shell size and stops if it crosses 200 kB rather than trimming the card's art. |
| Should the diagnostics row be disabled when the log is empty? | No. A disabled row in a parental panel is invisible state; a row that says "no crashes have been recorded" answers the question. |
| Is `sessionStorage` acceptable for the loop guard? | Yes, and it is added to the guard's watched set rather than used silently. It is the only storage that survives a reload without writing into the child's save. |
| Does CI's 5m28s budget breach block this track? | No. It is recorded as an existing finding with three named options; this track adds one journey and reports the new CI number honestly. |

## References

- `conductor/product.md` §10.3 — the Phase 2 roadmap rows and the metrics table whose "uncaught errors" row is `unknown` until this ships.
- `src/scenes/sceneRegistry.ts:72-87` — `loadSceneWithRetry`, the existing soft failure this track deliberately does **not** log.
- `src/utils/storage.ts` — `SCHEMA_VERSION`, `mutate`, `saveV2` (returns whether bytes landed), `isPersistenceDegraded`.
- `src/utils/backupFile.ts` — the download seam and `reloadApp()`.
- `src/components/SettingsPanel.ts` — `page: 0 | 1`, `flipPage`, `buildBackupPage`, `rowY`.
- `src/__tests__/guard/backupDom.test.ts` — the enumerated DOM allowlist.
- `src/main.ts` — the scene array the recover scene must join.
- `docs/TDD.md` §10.5 — the browser-journey layer this adds a journey to.
