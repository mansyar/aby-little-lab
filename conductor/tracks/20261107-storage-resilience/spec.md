# Storage Resilience — Specification

> Requirements are stable. Once an `FR`, `NFR`, or `AC` ID is approved, do not
> renumber it. If a requirement is removed, mark it `Withdrawn` instead of
> deleting it.

## Overview

Make the save layer total: no storage failure may reach a scene. Today `saveV2`
calls `localStorage.setItem` unguarded, and `readV1`/`readV2Raw` call `getItem`
outside their `try`. On a device whose storage is full or blocked, the first
failure lands inside play — after `completeGame` has already set
`inputLocked = true` — so the child freezes on the win screen with no return to
the hub. This track makes every read and every write non-throwing, keeps the
session alive in memory, and tells the parent quietly in the settings panel.

## Problem / Motivation

Every profile, sticker, play-time counter, progress record and setting funnels
through one function, `saveV2`:

```ts
function saveV2(v2: ProfileV2): void {
  const raw = JSON.stringify({ ...v2, schemaVersion: SCHEMA_VERSION });
  localStorage.setItem(V2_KEY, raw); // ← throws QuotaExceededError / SecurityError
  v2Cache = { raw, state: v2 };
}
```

`mutate` calls it with no guard, and its callers assume it cannot fail. The
worst one is `GameSceneBase.completeGame`:

```ts
this.inputLocked = true;                       // input off first
recordGameResult(gameId, ...);                 // → mutate → saveV2        ← throws
this.audioManager.playWin();                   // never reached
createWinCelebration(...);                     // never reached
this.time.delayedCall(this.AUTO_RETURN_DELAY, ...); // never reached: no way home
```

Two consequences, both child-visible:

1. **Full storage** (5 MB quota, or a quota shared with other sites) kills the
   celebration and the return to the hub at the exact moment a four-year-old
   has just succeeded. Input is locked, so the screen is dead until the tab is
   closed. Every later write fails the same way — plus the sticker for that
   game, because `earnSticker` is the write that threw.
2. **Blocked storage** (Safari with site data blocked, an embedded context, a
   partitioned iframe) throws on the *read* side, in `readV1`/`readV2Raw`, so
   the failure lands during hub `create()` — a blank canvas at boot.

Neither has any recovery path short of clearing site data, and neither tells
anyone. A parent sees a game that "just stops" and stickers that never stay.

## Goals & Success Metrics

- **Goal:** no storage failure can interrupt play, and no failure is silent.
- **Metric:** with `localStorage.setItem` throwing from page load, a browser
  journey wins a game, is returned to the hub, and reloads into a booted hub
  with zero page errors — and every write and read path has a unit test that
  passes while storage throws.
- **Metric:** the change costs nothing on the happy path — no added `getItem`
  per read and no added work per write beyond a `try`.

## Scope

### In Scope

- Guard the single write path (`saveV2`) and both read paths (`readV1`,
  `readV2Raw`) in `src/utils/storage.ts`.
- Make the in-memory state authoritative for the session when storage cannot
  persist, so a mutation still applies to what the child sees.
- A session-scoped degraded flag, set by any failed access and cleared by a
  later successful write.
- A single informational line in the parental Settings panel while degraded.
- Unit coverage for every exported write and read path under a throwing
  `localStorage`, plus one browser journey that makes `setItem` throw.

### Out of Scope

- Quota management: measuring usage, evicting, compressing payloads, moving to
  IndexedDB, or asking the browser for persistent storage (`navigator.storage`).
- Cross-device sync, backup/export/restore of the save (a later roadmap track).
- Telemetry or error reporting for storage failures.
- Any change to what is stored, its shape, or the `SCHEMA_VERSION` contract.
- Any child-facing surface: no toast, no icon, no sound, no animation.

## Bug Details

- **Reproduction steps:**
  1. In a Chromium DevTools session, override `Storage.prototype.setItem` to
     throw `new DOMException("full", "QuotaExceededError")` before the app
     script runs (or fill the origin's quota).
  2. Open the hub and launch any game.
  3. Play it to completion.
  4. Separately: override `Storage.prototype.getItem` to throw `SecurityError`
     and load the hub.
- **Expected behavior:** the game completes, the sticker appears in memory, the
  hub returns after the usual delay, the app boots normally with defaults when
  storage cannot be read, and the parent finds a line in Settings saying
  progress cannot be saved on this device.
- **Actual behavior:** step 3 throws inside `completeGame` after
  `inputLocked = true`, so the win sound, the celebration and the auto-return
  never happen and the screen is unresponsive. Step 4 throws during hub
  `create()` and the canvas stays empty.
- **Root-cause hypothesis:** `src/utils/storage.ts:154` writes without a guard,
  `src/utils/storage.ts:88` and `:98` read without one, and every caller above
  them treats a storage access as infallible.
- **Regression test:** a unit test that drives `earnSticker` (and the other
  write paths) with `setItem` throwing, asserting no throw and a changed
  in-memory state, and a browser journey asserting the win → hub → reload path
  with `setItem` throwing.

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | No storage write throws to its caller. Every write path (`earnSticker`, `updateSettings`, `resetProgress`, `addProfile`, `deleteProfile`, `switchProfile`, `setPlayTimeLimit`, `recordPlayTime`, `recordGamePlay`, `recordGameResult`, `recordGameTaps`) returns normally when `setItem` throws. | must |
| FR-2 | When a write cannot be persisted, the change still applies to the in-memory state for the rest of the session, so the child sees the sticker, the toggle and the progress they earned. | must |
| FR-3 | No storage read throws. When `getItem` throws, the app boots and every getter (`getProfiles`, `getActiveProfile`, `getSettings`, `getPlayTime`, `getProgress`, `hasSticker`, `getAdaptiveBandShift`) returns fresh defaults. | must |
| FR-4 | A session-scoped degraded flag is set by any failed read or write, cleared by a later successful write, and is never set by the deliberate unknown-`schemaVersion` write-protection path or by a declined mutator. | must |
| FR-5 | While degraded, the parental Settings panel shows one informational line stating that progress cannot be saved on this device. It is not shown otherwise, adds no interactive element, and moves none of the existing rows. | must |
| FR-6 | With storage working, behaviour is unchanged: the same bytes are written (including the schema stamp), the v1 migration and corrupt-JSON fallbacks behave as today, the unknown-version payload stays write-protected, and reads keep the raw-string memo. | must |
| FR-7 | Regression coverage exists at both layers: unit tests that fail against the current `storage.ts`, and one browser journey that makes `setItem` throw and asserts win → hub → reload with no page errors. | must |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | No added cost on the happy path: no extra `getItem` per read, no extra work per write beyond a `try`, and the existing `v2Cache` raw-string memo is preserved. |
| NFR-2 | No new runtime dependency, and the shell stays inside the 200 kB `validate-bundle` gate. |
| NFR-3 | Coverage thresholds are met for new code (95 lines / 88 functions / 85 branches / 90 statements) and the browser suite stays inside its 5 minute budget. |
| NFR-4 | No child-facing change: no new text, sound, animation or tappable surface outside the parent panel. |
| NFR-5 | Covers the failure modes the platforms actually produce — `QuotaExceededError` on write, `SecurityError` on blocked access, and a throwing accessor — without distinguishing them in the UI. |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | With `setItem` throwing, each write path returns normally and the corresponding in-memory getter reflects the change (earned sticker, updated setting, added profile, cleared stickers, recorded play). | FR-1, FR-2 |
| AC-2 | With `setItem` throwing, `completeGame` reaches its auto-return schedule — the child is returned to the hub rather than stranded. | FR-1 |
| AC-3 | With `getItem` throwing, `getProfiles`, `getActiveProfile`, `getSettings`, `getPlayTime` and `getProgress` return defaults and nothing throws during hub construction. | FR-3 |
| AC-4 | The degraded flag is false on a working store, true after a failed write, true after a failed read, false again after a successful write, and false on the unknown-version write-protection path. | FR-4 |
| AC-5 | The Settings panel renders the notice while degraded and renders no notice when storage works; the eight existing rows keep their positions. | FR-5 |
| AC-6 | With a working storage stub, the written raw string, the read results, the v1 migration, the corrupt-JSON fallback and the unknown-version protection are identical to the pre-change behaviour. | FR-6 |
| AC-7 | The browser journey passes: with `setItem` throwing, a game is completed, the hub returns, a reload boots the hub, and no page error was collected. | FR-7 |
| AC-8 | Every new unit test that can run against the pre-fix `src/utils/storage.ts` fails against it and passes after, recorded verbatim in the phase evidence. (14 of the 21 could run; the seven flag-lifecycle tests cite `isPersistenceDegraded()`, which the pre-fix file does not export - see the amendment.) | FR-7 |

**AC-8 amendment (2026-11-07, review findings F1 and F4).** The original wording
claimed every new test fails against the pre-fix file. Fourteen of the twenty-one
did; the seven flag-lifecycle tests could not, because they call
`isPersistenceDegraded()`, which the pre-fix file does not export — a test that
cannot compile is not evidence. The transcript is checked in at
`verification/red-run.md` rather than kept under `.conductor/`, which is ignored by
git and so could not be read by anyone reviewing the track. Two tests added in the
review round were proved the same way after the fact: the destructive-mode test
below fails against the Phase 1 file (it rewrites the seeded payload with
defaults) and passes against the review-fix file, recorded in
`verification/review-fixes.md`.

## Edge Cases

- **Writes fail, reads work** (the common quota case): reads keep returning the
  last persisted state plus in-session mutations; only persistence is lost.
- **Reads fail, writes work** (blocked access is usually both): boot to
  defaults, degrade, and let a later successful write persist the whole
  in-memory state — so the first successful moment heals the session.
- **Failure then recovery**: storage frees up mid-session (the parent leaves
  private mode, or another site's data is cleared). The next write must persist
  the full in-memory state, not just the newest delta, and clear the flag.
- **Unknown `schemaVersion` payload**: stays write-protected with the raw bytes
  untouched; must not raise the notice, because that is data safety, not
  failure.
- **Corrupt JSON** on a writable store: existing corrupt path (defaults, then
  overwrite) unchanged.
- **First run with a v1 save**: the migration write may fail; the app must
  still boot into defaults and report degraded.
- **Multiple profiles**: the failure is per device, not per profile, and the
  notice is device-level.
- **`localStorage` missing entirely** (non-browser test environment): every
  accessor must still be safe rather than throwing a `ReferenceError`.
- **The journey's override itself**: `addInitScript` must patch only the two
  methods, so Playwright's own assertions and the service worker still work.

## Dependencies

- **Tracks:** none open. `20261107-release-e2e` is merged and supplies the
  browser layer this track's journey runs on.
- **External:** none.

## Open Questions & Assumptions

- **Assumption:** a mutation that cannot be persisted is still worth showing
  for the session. Losing it on reload is acceptable because the parent notice
  explains it, and a child who is not shown their sticker learns nothing good.
- **Assumption:** one message covers every failure mode. A parent cannot act
  differently on "full" versus "blocked", so the UI does not distinguish them.
- **Assumption:** the notice's exact placement inside the settings panel is an
  implementation choice; the constraint is that the eight-row stack, the title
  and the version footer do not move, and that nothing new is tappable.
- **Assumption:** the unknown-version write-protection path in `mutate` is
  intentional product behaviour (a newer save must not be clobbered by an older
  build), so it is excluded from the degraded signal by design.

## References

- `conductor/product.md` §10.2 — roadmap row `20261110-storage-resilience`.
- `README.md` — Known Issues, "Unguarded storage write".
- `src/utils/storage.ts` — `saveV2` (write path), `readV1`/`readV2Raw`
  (read paths), `mutate` (unknown-version guard).
- `src/scenes/GameSceneBase.ts` — `completeGame`, the child-visible failure.
- `docs/TDD.md` §10.5 — the browser journey layer this track extends.
- PR #79 — the journey layer that can make `setItem` throw at page load.
