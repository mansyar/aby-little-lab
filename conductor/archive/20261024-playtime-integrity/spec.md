# Specification: Play-Time Session Integrity

> IDs are stable. Never renumber; if an item is dropped, mark it `Withdrawn`
> and keep its id so later references stay resolvable.

## Overview

The parental play-time gate measures real, visible, per-day child play time —
but its accounting leaks on every edge: a killed app loses the whole session,
time is rounded down in the child's favour, and a session crossing midnight
banks into the wrong day. This track makes the session machinery bank honestly:
flush at page-exit, ceil the minutes, split the midnight boundary, keep the
Hub's limit state fresh across visibility changes, and stop the single slot
from silently discarding unbanked time.

## Problem / Motivation

The daily budget is a promise to the parent. Five defects break it, all
verified against the code on 2026-10-23:

1. **A killed app loses the elapsed session.** The session is banked only in
   `HubScene.create()` (`endPlaySession()` at `src/scenes/HubScene.ts:114`); a
   tab or PWA instance that is closed mid-game never reaches it. The visibility
   watcher (`src/game/playTimeLogic.ts:122-139`) only pauses/resumes — no
   `pagehide`/`beforeunload` flush exists anywhere in `src/`.
2. **Rounding leaks child time.** `endPlaySession()` returns
   `Math.round(elapsed / 60_000)` (`src/game/playTimeLogic.ts:196`), so a
   29-second stretch banks 0. Many short visits add
   up to real unbanked play — exactly what a ceiling budget must not allow.
3. **Midnight misattributes.** `addPlayTime()` normalizes the target day at
   bank time (`src/game/playTimeLogic.ts:78-81`), so a session spanning
   midnight banks *all* its visible minutes into the new day — 55 minutes of
   yesterday. A session parked on the Hub before midnight keeps yesterday's
   lock state until some scene re-create, because
   `PlayTimeIndicator` reads `isLimitReached`/`isNearLimit` once in
   `create()` (`src/components/PlayTimeIndicator.ts:37-47`) and
   `HubScene.refreshPlayTimeState` runs only on create / settings-close /
   profile-switch (`src/scenes/HubScene.ts:85,184`) — no visibility hook.
4. **A discarded session never banks.** `startPlaySession()` explicitly
   discards a previous unfinished session (`src/game/playTimeLogic.ts:148-165`).
   Unreachable through the Hub today (it ends the session before a new one can
   start), but it is a live hazard for any future call path and a documented
   data-loss shortcut.

Who feels it: the parent, whose daily budget under-records on short visits and
mis-attributes across midnight; the child, who can be wrongly locked out (stale
dim after midnight) or wrongly unlocked (unbanked time after a kill).

## Goals & Success Metrics

- **G1 — No silent loss.** Leaving a scene, closing the page, or killing the
  app after backgrounding banks the session's visible minutes. *Metric:* a
  regression test drives `pagehide` and asserts the banked call.
- **G2 — Honest conversion & attribution.** Banked minutes are ceiled and
  midnight-split. *Metric:* unit tests pinning ceil, and a spanning-session
  split into two day keys.
- **G3 — Fresh limit state.** Returning to the Hub from background
  re-evaluates the limit without a scene re-create. *Metric:* a
  `visibilitychange` test flips the state.
- **G4 — Nothing about the shipped play-time behaviour changes otherwise.**
  *Metric:* existing tests keep their outcomes untouched; hidden time still
  never burns; the pause/resume watcher still drives short app switches.

## Scope

### In scope

- `src/game/playTimeLogic.ts`: a `pagehide` flush alongside the existing
  bank-on-Hub-return path; ceil conversion; midnight split; a hardening rule
  in `startPlaySession()` that ends-and-banks an existing session instead of
  discarding it (same success path as `endPlaySession`).
- `src/scenes/HubScene.ts` (or the storage layer): re-evaluate the Hub's
  play-time visuals when the document becomes visible again
  (`refreshPlayTimeState` on `visibilitychange`).
- Associated tests (`playTimeLogic` unit suite, Hub engagement, storage tests
  if `addPlayTime`'s schema changes).
- `docs/PRD.md` (play-time section) + `docs/TDD.md` (the play-time module
  section) + `conductor/product.md` changelog if behaviour surface changes.

### Out of scope

- Storage schema versioning / injected storage port (a separate track).
- The remaining 9 inline test timeout overrides.
- A ticking per-minute indicator arc.
- Changes to when the limit **starts** counting (it starts per-Hub tile-tap, as
  now), to the limit options, or to the lock/nudge visuals.
- The kill case where the process dies *without* any pagehide/visibility
  event (not fixable in-browser; accepted limitation, documented in the TDD).

## Bug Details

**Reproduction 1 (kill-loss):** start play from the Hub → background the tab →
close/kill it → reopen the app the same day. Expected: the day's
`usedMinutes` includes the previous session. Actual: it does not (no flush on
`pagehide`).

**Reproduction 2 (rounding):** play for 45 minutes **29 seconds → end**;
expected: ≥ 46 minutes held; actual: 45 minutes held (round) — smaller gaps in
the same shape at < 30 s bank 0.

**Reproduction 3 (midnight):** play 23:58–00:02 with any limit; expected: the
minute before midnight counts against yesterday's key (and after 00:02 the
newest day starts a fresh persisted budget); actual: everything lands in the
new day.

**Root-cause hypothesis:** the session module trusts the Hub as the only
banking authority and treats the day as write-time; the flush must be
event-driven (`pagehide`) and the day boundary must be split at the bank
boundary.

**Regression tests:** drive the module with a fake event source exactly as the
existing tests fake `document.visibilityState`; these tests fail before the
fix and pass after it.

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | Among the exit paths, `pagehide` flushes and banks the session's visible minutes for the session's profile through the same success path the Hub uses today. The pause/resume watcher keeps running for short app switches — a `pagehide` bank is the terminal path (the module's `unwatchVisibility` runs when the session ends). | Must |
| FR-2 | Elapsed visible time converts to banked minutes with `Math.ceil` (never rounds down; a session with any visible time banks ≥ 1). A session with zero visible time banks 0 exactly as today. | Must |
| FR-3 | A session spanning midnight charges the new day only for the visible time accrued **after** local midnight. Post-midnight visible time is accrued per stretch — each running stretch contributes `max(0, stretchEnd - max(stretchStart, localMidnight(stretchEnd)))` — so hidden stretches and pre-midnight visible stretches contribute nothing, whatever their length. Banked minutes are `ceil(postMidnightVisibleMs / 60_000)`, and the pre-midnight portion is not written (the record is a single `{limitMinutes, usedMinutes, lastUsedDate}` snapshot with no per-day history; a closed day's usage no longer constrains anything). | Must |
| FR-4 | `startPlaySession()` when a session is running ends-and-banks it first — never silently discards visible time. | Must |
| FR-5 | When the document becomes visible while the Hub is showing, the Hub re-runs its play-time visuals (`refreshPlayTimeState`) so a parked Hub re-evaluates after midnight or a limit change. No new timer-driven refresh. | Must |

## Non-Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| NFR-1 | No existing test outcome changes except where the new rules (ceil / split / flush) legitimately re-partition banked minutes; every changed expectation is reviewed and listed. | Must |
| NFR-2 | The no-dependency / no-network / offline-first standing rule holds; no new library enters `package.json`. | Must |
| NFR-3 | Full `verify_phase` gate passes: `pnpm check` + `pnpm typecheck` + `pnpm test -- --run` + coverage (gates 95/88/85/90) + `pnpm build` + `validate-bundle` + `validate-pwa` + `validate-docs`. | Must |
| NFR-4 | The shared base classes (`GameSceneBase`, `ChoiceRoundScene`) are untouched; changes stay inside play-time surfaces above. | Must |
| NFR-5 | All product-guideline rules hold: no new audio/motion; no wrong-answer flow changes; 64 px touch floors intact for the parent Settings UI. | Must |
| NFR-6 | Every new bank/split/flush rule is unit-testable in `happy-dom` with a fake clock applied exactly like the existing tests do. | Must |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | Driving a fake `pagehide` mid-session banks the visible minutes (FR-1) — the regression test fails before the fix. | FR-1 |
| AC-2 | A 45-minute-and-29-second session banks 46 minutes; a zero-visible session banks 0 (FR-2). | FR-2 |
| AC-3 | A 23:58–00:02 session banks 2 minutes against the new day, not 4 — the pre-midnight portion is not charged to today (FR-3). | FR-3 |
| AC-4 | Calling `startPlaySession` while a session runs: the running session is banked first, then the new one starts — no drop (FR-4). | FR-4 |
| AC-5 | `visibilitychange → visible` while the Hub is up re-evaluates the limit visuals (FR-5); no per-minute tick is added. | FR-5 |
| AC-6 | The full gate passes; no test outcome changed except the reviewed re-partitions (NFR-1..NFR-6). | NFR-1..NFR-6 |

## Edge Cases

- **Back-to-back visits with < 1 min total:** ceil-per-session, and the Hub's
  create-time-slot banking continues to work — a 5 s session banks 1 minute
  each time (per-session ceil; documented).
- **Backwards clock:** the existing `Math.max(0, ...)` inside
  `visibleElapsedMs` covers a backwards jump; split-at-midnight must stay
  monotonic if a chunk is 0.
- **Session ends hidden** (Hub closes exactly while hidden, e.g. tab left
  hidden and locked): bank the visibly-accrued minutes, do not resurrect a
  running stretch.
- **pagehide on platforms without it** (old WebViews): the module already
  guards for non-DOM hosts; the flush must be inert there.
- **Limit changed mid-session:** beyond scope (the session banks attendance,
  the daily cap applied later, as today).
- **pagehide + the Hub ends again on return:** banking is idempotent once
  flushed — the session slot clears on flush exactly as `endPlaySession` does.

## Dependencies

- No track dependencies. The standalone gate uses everything merged on
  `master` (PR #58 base).
- External: none (the module previously injected `now`; a pagehide source is
  injected the same way for tests).

## Open Questions & Assumptions

None reachable — every product decision above has a user decision (ceil,
split-at-midnight, refresh-hook scope, startPlaySession hardening). Two
recorded assumptions:

- There is **no** way to emit a flush for a killed process that fires no
  event; the last signal that a device gives is the one this track banks on,
  and the TDD documents the limitation.
- `addPlayTime`'s split form is a dedicated single entry point (one writer);
  no new storage schema keys are required.

## References

- `src/game/playTimeLogic.ts:106-197` (session state, watcher, rounding)
- `src/scenes/HubScene.ts:114-117,233` (bank-on-return, session start)
- `src/components/PlayTimeIndicator.ts:31-51` (one-shot limit read)
- `docs/PRD.md` §5 (play-time: the parent-facing offer)
- `docs/roadmap.md` Known Issue "Play time is banked only when the child
  comes back to the Hub"
- `conductor/product-guidelines.md` §4/§5 (no-fail design, parental rules)
