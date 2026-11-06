# Date-Literal Audit — `src/__tests__/**`

- **Track:** `20261107-trunk-green` — Trunk Green — Wall-Clock-Safe Test Fixtures
- **Phase:** 1 — Audit and convert the clock stand-ins
- **Date:** 2026-11-07
- **Branch:** `chore/20261107-trunk-green`
- **Phase base:** `697ed5f6889f0983cf38ec00d52121c8db0102f9`
- **Covers:** FR-1 (classification of every date literal), AC-1 (a table with a
  verdict per literal), FR-3 / AC-3 (clock stand-ins converted)

## How the inventory was taken

A fresh scan for **bare day-key literals** (a quoted `YYYY-MM-DD`, which is the
shape `todayKey` produces and the shape `lastUsedDate` stores), run with the
native search tool — `pattern: "\"\d{4}-\d{2}-\d{2}\""`, `path:
src/__tests__`, `include: *.ts` (quotes included in the pattern so a full ISO
timestamp cannot match). At the phase base — before the conversions listed below —
it returned **29 matching lines** across five files, which matches the count
recorded in the phase brief. Two of those
lines carry two literals each (`hubPrewarm.test.ts:243` and
`progressLogic.test.ts:350`), so the 29 lines hold **31 quoted day-key
literals**. The table below lists every line, one row per matching line, with the
literal count noted where a line carries more than one.

Full ISO timestamps (`"2026-07-28T00:00:00.000Z"`) are a different shape and are
excluded from this inventory by construction; see "Beyond the 29" at the end of
this document, which records why they are data and why the spec puts them out of
scope.

## Verdicts

Verdicts use the spec's two categories:

- **`clock stand-in`** — the value flows into an API that compares it against the
  current date, so the literal's meaning changes with the calendar.
- **`data`** — the value is fixture payload or an expected value that is never
  compared against the host's current date, so it cannot change a verdict.

| # | File | Line | Field / literal | Consumed by | Verdict | Reason |
|---|------|------|-----------------|-------------|---------|--------|
| 1 | `src/__tests__/components/PlayTimeIndicator.test.ts` | 51 | `playTime.lastUsedDate` = `"2026-01-01"` | `getPlayTime` mock → `createPlayTimeIndicator` → `isLimitReached` / `getRemainingMinutes` / `isNearLimit` → `normalizePlayTime(raw)` with the default `now = new Date()` | **clock stand-in** | `normalizePlayTime` compares `lastUsedDate` with `todayKey(now)` and zeroes `usedMinutes` on a mismatch. This is the exact shape of the `gameLaunch` incident: a limit-bearing fixture read as "zero used" from the day after the literal, inverting the assertion. Converted in this phase to `TODAY`, derived as `todayKey(FIXED_NOW)` (see "Conversions"). |
| 2 | `src/__tests__/utils/storage.test.ts` | 911 | `profiles[0].playTime.lastUsedDate` = `"2026-08-05"` inside a raw v2 `localStorage` payload ("an older v2 save") | `localStorage` → `normalizeV2` → `normalizePlayTime(p?.playTime, new Date(now))` | **clock stand-in** | The field is consumed by `normalizePlayTime`, which compares it with `todayKey(now)`; the stored value therefore changes meaning at midnight. The containing test (`backfills zeroed progress for an older v2 save without progress`) reads only progress/activity, so no assertion observes the rollover **today** — but the field is date-typed, the comparison is live, and FR-2's Phase 2 guard rejects any literal there. Converted to `todayKey()`. |
| 3 | `src/__tests__/game/hub/hubPrewarm.test.ts` | 243 (2 literals) | `progress["g-b"].lastPlayedAt` = `"2026-10-20"`, `progress["g-c"].lastPlayedAt` = `"2026-10-10"` | `getProgress` dep → `recencyFirstOrder` → `Date.parse` comparison only | **data** | The only consumer sorts by `lastPlayedAt` **descending against the other entries**; nothing compares a stamp with `now`. The assertion is the ordered key list `["Beta", "Gamma", "Alpha"]`, which any two decreasing stamps produce. Both are date-only strings, so both parse as UTC midnight — the order is timezone-independent. |
| 4 | `src/__tests__/game/playTimeLogic.test.ts` | 23 | `pt()` helper default `lastUsedDate` = `"2026-08-05"` | `normalizePlayTime` / `getRemainingMinutes` / `isLimitReached` / `isNearLimit` / `addPlayTime` / `setLimit`, each called with the explicit clock `DAY` | **clock stand-in** | `lastUsedDate` is a today-typed field: every consumer normalises it against the clock it is handed. Written out, the value is a stand-in for that clock's day, and it is only safe while every call site remembers to inject `DAY`. Converted to `todayKey(DAY)` so the fixture states the clock it belongs to instead of duplicating its output. |
| 5 | `src/__tests__/game/playTimeLogic.test.ts` | 29 | expected `todayKey(DAY)` = `"2026-08-05"` | `todayKey(DAY)` | **data** | The formatter's own contract test: it pins the `YYYY-MM-DD` shape for an explicit input date. Expected value, not a substitute for today. |
| 6 | `src/__tests__/game/playTimeLogic.test.ts` | 30 | expected `todayKey(NEXT_DAY)` = `"2026-08-06"` | `todayKey(NEXT_DAY)` | **data** | Same as #5, second explicit clock. |
| 7 | `src/__tests__/game/playTimeLogic.test.ts` | 40 | expected `createDefaultPlayTime(DAY).lastUsedDate` = `"2026-08-05"` | `createDefaultPlayTime(DAY)` → `todayKey(DAY)` | **clock stand-in** | The expected value *is* the clock's day key; writing it out duplicates `todayKey`'s output inside a today-typed field. Converted to `todayKey(DAY)`; the exact `YYYY-MM-DD` shape stays pinned by rows 5–6. |
| 8 | `src/__tests__/game/playTimeLogic.test.ts` | 55 | expected `lastUsedDate` after `normalizePlayTime(stale, NEXT_DAY)` = `"2026-08-06"` | `normalizePlayTime(raw, NEXT_DAY)` | **data** | Expected rollover output for an explicit clock; no host clock involved. |
| 9 | `src/__tests__/game/playTimeLogic.test.ts` | 64 | expected `lastUsedDate` after `normalizePlayTime({}, DAY)` = `"2026-08-05"` | `normalizePlayTime(raw, DAY)` | **clock stand-in** | Same shape as row 7: the expectation is the injected clock's day key written as a literal. Converted to `todayKey(DAY)`; the format contract stays pinned at rows 5–6. |
| 10 | `src/__tests__/game/playTimeLogic.test.ts` | 158 | expected `lastUsedDate` after `addPlayTime(stale, 10, NEXT_DAY)` = `"2026-08-06"` | `addPlayTime(raw, minutes, NEXT_DAY)` | **data** | Expected rollover output under an explicit clock. |
| 11 | `src/__tests__/game/progressLogic.test.ts` | 307 | expected `activity[0].day` = `"2026-08-05"` | `addActivity([], DAY)` → `todayKey(DAY)` | **data** | Expected output for the injected `DAY`. |
| 12 | `src/__tests__/game/progressLogic.test.ts` | 311 | input `activity[0].day` = `"2026-08-05"` | `addActivity(existing, DAY)` | **data** | Payload matched against the injected `DAY` key. |
| 13 | `src/__tests__/game/progressLogic.test.ts` | 313 | expected `activity[0].day` = `"2026-08-05"` | `addActivity(existing, DAY)` | **data** | Expected incremented entry for the injected `DAY`. |
| 14 | `src/__tests__/game/progressLogic.test.ts` | 317 | input `activity[0].day` = `"2026-08-05"` | `addActivity(existing, NEXT_DAY)` | **data** | Payload that must survive a day change; the clock is injected. |
| 15 | `src/__tests__/game/progressLogic.test.ts` | 320 | expected kept `day` = `"2026-08-05"` | `addActivity(existing, NEXT_DAY)` | **data** | Expected output under an explicit clock. |
| 16 | `src/__tests__/game/progressLogic.test.ts` | 321 | expected appended `day` = `"2026-08-06"` | `addActivity(existing, NEXT_DAY)` | **data** | Expected new-day entry for the injected `NEXT_DAY`. |
| 17 | `src/__tests__/game/progressLogic.test.ts` | 329 | input `activity[].day` = `"2026-07-29"` (pruned) | `pruneActivity(activity, DAY)` → cutoff `todayKey(DAY - 6 days)` | **data** | `pruneActivity`'s cutoff is computed from the **injected** `DAY`, so "7 days before" is relative to a fixed fixture day, not to host today. Input payload. |
| 18 | `src/__tests__/game/progressLogic.test.ts` | 330 | input `activity[].day` = `"2026-07-30"` (kept) | `pruneActivity(activity, DAY)` | **data** | Same injected-cutoff window as #17. |
| 19 | `src/__tests__/game/progressLogic.test.ts` | 331 | input `activity[].day` = `"2026-08-02"` | `pruneActivity(activity, DAY)` | **data** | Same injected-cutoff window as #17. |
| 20 | `src/__tests__/game/progressLogic.test.ts` | 332 | input `activity[].day` = `"2026-08-05"` | `pruneActivity(activity, DAY)` | **data** | Same injected-cutoff window as #17. |
| 21 | `src/__tests__/game/progressLogic.test.ts` | 336 | expected kept `day` = `"2026-07-30"` | `pruneActivity(activity, DAY)` | **data** | Expected output of the injected-cutoff window. |
| 22 | `src/__tests__/game/progressLogic.test.ts` | 337 | expected kept `day` = `"2026-08-02"` | `pruneActivity(activity, DAY)` | **data** | Expected output of the injected-cutoff window. |
| 23 | `src/__tests__/game/progressLogic.test.ts` | 338 | expected kept `day` = `"2026-08-05"` | `pruneActivity(activity, DAY)` | **data** | Expected output of the injected-cutoff window. |
| 24 | `src/__tests__/game/progressLogic.test.ts` | 345 | input `activity[].day` = `"2026-08-05"` (sorting case) | `pruneActivity(activity, DAY)` | **data** | Sorting fixture; the clock is injected and the assertion is the output order. |
| 25 | `src/__tests__/game/progressLogic.test.ts` | 346 | input `activity[].day` = `"2026-08-01"` (sorting case) | `pruneActivity(activity, DAY)` | **data** | Same as #24. |
| 26 | `src/__tests__/game/progressLogic.test.ts` | 350 (2 literals) | expected sorted days `["2026-08-01", "2026-08-05"]` | `pruneActivity(activity, DAY)` | **data** | Expected output under the injected `DAY`. |
| 27 | `src/__tests__/game/progressLogic.test.ts` | 408 | expected integration `activity[].day` = `"2026-08-05"` | `pruneActivity(addActivity(activity, DAY), DAY)` | **data** | Expected output of a lifecycle driven entirely by `DAY`. |
| 28 | `src/__tests__/game/progressLogic.test.ts` | 409 | expected integration `activity[].day` = `"2026-08-06"` | `pruneActivity(addActivity(activity, NEXT_DAY), NEXT_DAY)` | **data** | Expected output of a lifecycle driven entirely by `NEXT_DAY`. |
| 29 | `src/__tests__/game/progressLogic.test.ts` | 410 | expected integration `activity[].day` = `"2026-08-08"` | `pruneActivity(addActivity(activity, THREE_DAYS_LATER), THREE_DAYS_LATER)` | **data** | Expected output of a lifecycle driven entirely by `THREE_DAYS_LATER`. |

**Totals:** 29 rows, 31 quoted day-key literals — **5 clock stand-ins**
(rows 1, 2, 4, 7, 9 — all on `lastUsedDate`; all converted), **24 rows of data**
(26 literals, kept).

The classification rule is the consumption test FR-1 asks for: a literal whose
value reaches an API that compares it with a clock is a stand-in for that clock,
even when today's assertion happens not to observe the outcome. Every remaining
row is either `lastPlayedAt` sorted only against its peers (#3) or an
`activity[].day` payload/expectation evaluated against an injected clock
(#11–29), so no literal outside `lastUsedDate` can change a verdict with the
calendar.

> The spec's Open Questions recorded an assumption of "26 of the 29 literals are
> data". The audit supersedes it with 24 data rows / 5 stand-ins, because four
> `lastUsedDate` sites carry the today-typed field and one of them
> (`storage.test.ts:911`) reaches `normalizePlayTime` through `normalizeV2`.

## Conversions

| Site | Before | After | Why the new form is wall-clock-safe |
|------|--------|-------|-------------------------------------|
| `src/__tests__/components/PlayTimeIndicator.test.ts:51` | `lastUsedDate: "2026-01-01"` | `lastUsedDate: TODAY`, where `const FIXED_NOW = new Date();` and `const TODAY = todayKey(FIXED_NOW);` | The date is produced by the same formatter production uses, from one clock captured at module load, so it is always "today" for every assertion **and** cannot flip if a run straddles midnight. It satisfies FR-3's `todayKey(FIXED_NOW)` form; no suite-wide fake timer is introduced. |
| `src/__tests__/utils/storage.test.ts:911` | `lastUsedDate: "2026-08-05"` | `lastUsedDate: todayKey()` | The stored save now carries the current day, so `normalizePlayTime` takes its no-rollover branch on every run instead of depending on which side of the literal the calendar sits. Matches the file's existing `todayKey()` fixtures. |
| `src/__tests__/game/playTimeLogic.test.ts:23` | `lastUsedDate: "2026-08-05"` | `lastUsedDate: todayKey(DAY)` | Derives the today-value from the same clock every call site injects, so fixture and clock cannot drift apart. |
| `src/__tests__/game/playTimeLogic.test.ts:40` | expected `lastUsedDate: "2026-08-05"` | `lastUsedDate: todayKey(DAY)` | Expected value expressed through the clock it belongs to; the literal `YYYY-MM-DD` contract stays pinned at `todayKey`'s own test (lines 29–30). |
| `src/__tests__/game/playTimeLogic.test.ts:64` | expected `lastUsedDate: "2026-08-05"` | `lastUsedDate: todayKey(DAY)` | Same as line 40. |

`storage.test.ts` and `playTimeLogic.test.ts` are outside the phase's `Touches`
list; they were changed because AC-3 requires the `lastUsedDate` grep to be
empty, and FR-2's guard scans every `.ts` under `src/__tests__`. Both changes are
recorded as deviations in `phase-1.md`.

No other site needed conversion; the remaining 24 rows are data for the reasons
in the table.

## Beyond the 29 (out of audit scope by spec)

The bare-day-key inventory above is the shape that can collide with
`todayKey()`. Two neighbouring shapes are deliberately outside it:

- **Full ISO timestamps** (`createdAt`, `earnedAt`, `lastPlayedAt` in
  `storage.test.ts`, `profileLogic.test.ts`, `prewarm.test.ts`,
  `progressLogic.test.ts`) — fixture payloads the spec's Out-of-scope list names
  explicitly. Where an API does relate one to the current day
  (`relativeLastPlayed`), the test passes an explicit clock
  (`progressLogic.test.ts:365, 369, 373` all pass `DAY`), so no assertion depends
  on the host date.
- **Comment prose** (`// 2026-08-05 local`, the header of
  `arrowSvgPaths.test.ts`) — not code.

Neither shape can make the suite's verdict depend on the calendar, which is the
property FR-1/AC-1 exist to establish.

## Accepted limits

- The scan matches **literal** day keys only. A date built by template string or
  concatenation would evade it; the spec records this as an accepted limit, and
  the Phase 2 guard inherits it.

## Post-conversion check (AC-3)

Re-running the assigned-literal scan after the conversions — native search,
`pattern: lastUsedDate:\s*"\d{4}-\d{2}-\d{2}"`, `path: src/__tests__`,
`include: *.ts` — returns **no matches**. The test tree carries no quoted date
assigned to `lastUsedDate`, and `pnpm test -- --run` stays green at 131 files /
2829 tests.
