# Local Insights - Specification

> **Conventions:** IDs are stable. `FR-` and `NFR-` are never renumbered after
> approval; a removed item is marked **Withdrawn** rather than deleted. Every
> `AC-` maps to a functional requirement.

## Overview

The parent-facing Progress overlay already answers "what has been played and how
well" for one game at a time: plays, an accuracy bar, a mastery star and a
7-day strip, paged six rows at a time. It cannot answer the two questions a
parent actually asks - *what is being played, and is it working?* - without
paging and arithmetic.

This track adds one **Overview** page at the front of that overlay, built from a
single small record per profile that stores what the existing aggregates
genuinely cannot: streak history and daily-cap adherence. Everything else -
completion rate, accuracy, band spread, this week's games - is derived from
fields that already exist.

The roadmap row names an "event ring buffer". The design deliberately does not
build one: every question in the exit gate is aggregable, and a raw event log
would add an unbounded structure and a larger privacy surface for a 3-5 year
old's data, inside the write path the storage-resilience track just made total.

## Problem / Motivation

A parent opening Progress today sees a list of games. To decide whether the app
is working they would have to: page through six rows at a time, sum plays across
games, compare each accuracy bar against the others, remember which games were
played last week, and know from memory whether the daily limit has ever been
hit. That is minutes of work, not seconds, and it is why the roadmap's exit gate
is phrased as a 30-second answer.

Three signals are missing entirely rather than merely hard to read:

- **Consistency.** Nothing records whether play happens on consecutive days.
  `activity` holds seven day-buckets of *plays* and is pruned on write, so a
  streak longer than a week cannot be reconstructed, and a streak that ended is
  gone.
- **Adherence.** `PlayTime` holds only today: `limitMinutes`, `usedMinutes` and
  the day they belong to. Whether the cap was reached yesterday, or ever, is not
  stored anywhere.
- **Completion as a rate.** `plays` and `wins` are stored per game, so
  completion is `wins / plays` - but no surface computes it, and a game opened
  and abandoned looks identical to one never opened.

## Goals & Success Metrics

- **Goal:** a parent can answer "what is being played, and is it working" from
  one page, reached in one tap behind the parental gate.
  **Metric:** every answer is on the first page with no paging and no
  scrolling; a browser journey reaches it and reads all three statements
  (AC-7).
- **Goal:** the new data is small, bounded and honest.
  **Metric:** one added record of five fields per profile, at most one extra
  write per completed session and one per cap-day, and no per-tap writes
  (NFR-2).
- **Goal:** the change is forward-compatible with saves already on devices.
  **Metric:** `SCHEMA_VERSION` stays `1`, old payloads load with zeroed
  insights, and the unknown-version write protection still refuses to write
  (NFR-1, AC-2).

## Scope

**In scope**

- `ProfileInsights` stored per profile: streak and cap-adherence history that
  cannot be derived.
- Pure logic: streak advance, cap-day recording, and a summary builder that
  turns a profile plus a clock into three statements.
- The Overview page as the first page of the existing Progress overlay,
  including its empty and sparse states.
- Unit coverage for the logic, the normalisers, the storage writes and the page;
  one browser journey for reachability and legibility.
- Documentation: the stored shape, the derived metrics and their definitions,
  the roadmap row.

**Out of scope**

- Any event or session ring buffer (see Overview for why).
- Export, import or transmission of insights - that is
  `20261124-backup-restore`, and nothing here leaves the device.
- Error capture - `20261124-error-capture`.
- Charts, sparklines or new visual primitives; the page uses the overlay's
  existing bar/dot language and text.
- Changing the adaptive-difficulty algorithm, the cap itself, or what counts as
  a completed game.
- A second parental gate or a new settings row; the overlay keeps the gate it
  has.

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | `ProfileV2` gains `insights: ProfileInsights` with exactly: `currentStreakDays`, `bestStreakDays`, `lastStreakDay` (`"YYYY-MM-DD"` or `null`), `limitHitDays`, `lastLimitHitDay` (`"YYYY-MM-DD"` or `null`). Missing, partial or malformed values backfill to zeros and nulls through a normaliser; `SCHEMA_VERSION` stays `1`. | must |
| FR-2 | Recording a completed session advances the streak at most once per local day: the first completion of a day sets `currentStreakDays` to the previous value `+ 1` when `lastStreakDay` was yesterday, otherwise to `1`; `bestStreakDays` is the running maximum; `lastStreakDay` becomes today. A second completion on the same day leaves all three unchanged. | must |
| FR-3 | Reaching the daily play-time cap records one increment of `limitHitDays` per local day, keyed by `lastLimitHitDay`. A profile with `limitMinutes: null` never increments, and a cap reached and re-reached on the same day counts once. | must |
| FR-4 | A pure `summariseInsights(profile, now)` returns three statements, each with the numbers it was built from: (a) this week's reach - distinct games with `lastPlayedAt` inside the last seven local days, out of the registry size, plus lifetime completions (sum of `wins`) and overall completion rate; (b) how well - overall accuracy from `correct`/`wrong` totals, plus the strongest and hardest games among those with at least `MIN_SUMMARY_TAPS` answer taps; (c) habit - `bestStreakDays` and `limitHitDays`, or an explicit "no daily limit" phrasing when the profile has none. It never emits `NaN`, `Infinity` or a division by zero. | must |
| FR-5 | An **Overview** page becomes page 1 of the Progress overlay, showing the three statements plus the existing 7-day strip. Per-game pages, their paging, the profile switcher and the parental gate are unchanged. | must |
| FR-6 | Sparse and empty states are written, not blank: a profile with no completed games, a profile with games but fewer than `MIN_SUMMARY_TAPS` taps, and a profile with no limit each produce a specific sentence rather than a zero or a dash. | must |
| FR-7 | No new runtime dependency, no network call, and no new child-facing surface; the parent-facing strings are the only user-visible change. | must |
| FR-8 | Unit tests cover the streak and cap logic (including midnight and clock-backwards cases), the normaliser backfill, the storage write paths, the summary builder's empty/sparse/unlimited variants, and the page's rows; one browser journey proves the page is reachable and its three statements are readable. | must |
| FR-9 | `docs/TDD.md` documents the stored shape and states each derived metric's definition and window; `README.md` mentions the Overview page; the roadmap row records the outcome with dated evidence. | should |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | `SCHEMA_VERSION` remains `1`, the stored key is unchanged, and the unknown-version write protection still writes nothing to an unreadable payload. Existing saves load unchanged apart from backfilled insights. |
| NFR-2 | Cost is bounded: at most one extra `mutate` per completed session and one per cap-day, no writes per tap, and no new read on the hub's construction path. |
| NFR-3 | The Overview page renders inside the existing overlay in one frame budget, with no new scene, texture or asset; the shell entry stays within the 200 kB `validate-bundle` gate. |
| NFR-4 | Coverage stays at or above the configured gate (lines 95 / functions 88 / branches 85 / statements 90). |
| NFR-5 | No personal data leaves the device: no fetch, no identifier, no timestamp finer than a local day key in the stored record. |
| NFR-6 | The browser journey runs inside the existing suite's budget (5 minutes on CI) and adds no new flake surface: it uses the published `?e2e=1` bridge for state, never a fixed sleep. |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | A profile with a completed game on three consecutive days reports `currentStreakDays: 3` and `bestStreakDays: 3`; a fourth completion on the same day changes neither. | FR-1, FR-2 |
| AC-2 | A payload written before this track loads with insights at zero, `SCHEMA_VERSION` still `1`, and an unknown-version payload is still write-protected (the storage-resilience behaviour is unchanged). | FR-1, NFR-1 |
| AC-3 | A gap of more than one day sets `currentStreakDays` to `1` on the next completion while `bestStreakDays` keeps the earlier maximum. | FR-2 |
| AC-4 | With a limit set and the cap reached on two different days, `limitHitDays` is `2`; reaching it twice on one day keeps it at `1`; a profile with no limit never increments. | FR-3 |
| AC-5 | `summariseInsights` produces the three statements for: no games played, games played but never completed, fewer than `MIN_SUMMARY_TAPS` taps overall, a rich profile, and a profile without a limit - and returns no `NaN` or `Infinity` in any of them. | FR-4, FR-6 |
| AC-6 | The Overview page is the overlay's first page, shows each statement's text, still shows the 7-day strip, and leaves the per-game pages, paging and the parental gate behaving exactly as before. | FR-5 |
| AC-7 | A browser journey opens the hub, holds the parental gate, opens Progress, and reads all three statements on the first page with no paging step. | FR-4, FR-5, NFR-6 |
| AC-8 | No new dependency appears in `package.json`, no `fetch` is added under `src/`, and the shell entry stays within 200 kB with the PWA, docs and bundle validators green. | FR-7, NFR-2, NFR-3 |
| AC-9 | The recorded metric definitions and windows in `docs/TDD.md` match the implemented thresholds (`MIN_SUMMARY_TAPS`, the seven-day window, the day-key comparison), and the roadmap row records the outcome. | FR-9 |

## Edge Cases

- **Midnight straddle.** A session completed at `23:59:59` and another at
  `00:00:01` are two days: the streak advances once per day key, not once per
  session. The logic takes an injected clock; the test freezes it.
- **Clock moved backwards** (a device date correction). A `lastStreakDay` in the
  future must not create a streak: the day compares equal to "not yesterday",
  so the streak restarts at `1` and `bestStreakDays` is preserved.
- **Long gap.** Thirty days without play leaves `bestStreakDays` intact and
  restarts `currentStreakDays` at `1` on the next completion.
- **Cap turned off mid-week.** `limitHitDays` is history and stays; the
  statement's phrasing switches to "no daily limit" for the current setting.
- **Two profiles.** Insights are per profile and never cross-contaminate; the
  overlay's existing profile switcher shows the viewed profile's insights.
- **Malformed insights** (`currentStreakDays: "3"`, negative, `best < current`,
  a day key that is not a date) backfill sanely rather than throwing, and
  `bestStreakDays` is raised to `currentStreakDays` when the pair is
  inconsistent.
- **No games in the registry window.** A profile whose only play was eight days
  ago reports zero games this week while still reporting lifetime completions.
- **A single wrong tap.** A game with one tap and one error must not be named
  "hardest"; the minimum-sample floor prevents it.
- **The cap reached while the hub is not visible.** The record is written from
  the same place that locks the tiles, so a backgrounded hub does not lose it
  when the page becomes visible again and the lock re-applies.

## Dependencies

- **Tracks:** none open. `20261107-storage-resilience` (merged) provides the
  guarded write path and `isPersistenceDegraded`; `20261107-release-e2e`
  (merged) provides the journey suite and the `?e2e=1` bridge the new journey
  uses; `20261027-content-expansion` shaped the current `GameProgress`.
- **External:** none. No new package.

## Open Questions & Assumptions

| Question | Assumption |
| --- | --- |
| Does the Overview need to work for a profile that has never played? | Yes - it shows the empty sentence, because a parent checking a new profile must not see a blank page. |
| Is "this week" the last 7 days or a calendar week? | The last 7 local days, matching the existing `activity` window and the 7-day strip, so one notion of "week" exists in the product. |
| Should completion rate be per game or overall? | Overall on the Overview page; per game stays on the per-game pages, which already show plays and wins separately. |
| What is the accuracy floor for naming strongest/hardest? | `MIN_SUMMARY_TAPS = 10` answer taps, chosen to echo the adaptive window's `MIN_SAMPLE = 6` while staying above a single round's slip. |
| Does the streak survive deleting and re-adding a profile with the same avatar? | No. Insights belong to the profile record like stickers and progress; a new profile starts at zero. |

## References

- `conductor/product.md` §10.3 (Phase 2, `20261124-local-insights`) and §3.2
  (Parent Progress Insights as shipped).
- `src/components/settings/ProgressOverlay.ts` - the overlay this track extends.
- `src/game/progressLogic.ts` - `plays`, `wins`, `correct`, `wrong`, `recent`,
  `activity`, and the pruning rule.
- `src/game/adaptiveLogic.ts` - `MIN_SAMPLE`, `bandShiftFor`, the ladder.
- `src/utils/storage.ts` - `mutate`, `recordGameResult`, `recordGamePlay`,
  `recordPlayTime`, `classifyStoredV2`.
- `src/game/playTimeLogic.ts` - `todayKey`, `isLimitReached`.
- `conductor/archive/20261107-storage-resilience/` - the guarded write path and
  why an unreadable save is never overwritten.
- `conductor/archive/20261107-release-e2e/` - the journey suite and the
  read-only bridge.
