# Review - Local Insights

- **Track:** `20261108-local-insights`
- **Range:** `64e35642ad33dbeeeb2ed85507a0c40795d8844d..64e234e0`
- **Reviewer:** `conductor-reviewer`, one round
- **Verdict:** PASS WITH FINDINGS (round 1 returned CHANGES REQUIRED)

## Findings

| ID | Severity | Finding | Resolution |
|---|---|---|---|
| F1 | High | `summariseInsights` counted "days this week" from each game's `lastPlayedAt`, which holds only the latest play, so one game played on three days printed **one day** while the 7-day strip below drew three bars - two contradictory answers on one screen. | The count now comes from `pruneActivity(profile.activity, now)` filtered to `plays > 0` within `weekStart <= day <= today`, the same entries the strip draws. The AC-5 fixtures now carry the activity their stamps imply, and a new case (one game, three days) fails against the old code. |
| F2 | Medium | `activity.completionPercent` was computed and never printed, while the roadmap claimed the Overview reports the completion rate. | The reach sentence gained the share: `6 completions in all (43% of started games finished)`. A malformed record with wins and no plays still reads, without a share. |
| F3 | Medium | `dayKey()` accepted any non-empty string, so `lastStreakDay: "banana"` survived normalisation and was rewritten into storage on every save. | Shape **and** calendar validation, month length read at noon for DST safety; `"banana"` and `"2026-13-45"` both normalise to null. |
| F4 | Low | `docs/TDD.md` said the statements and the strip are built from one summary object; the strip reads the profile directly. | Reworded to what is true: one profile snapshot, one seven-day window. |
| F5 | Low | The year rollover in `previousDayKey`/`weekStartKey` was unproven. | Two cases added: 31 Dec -> 1 Jan extends the streak; a 2 January moment still counts 31 December in the week. |
| F6 | Low | One test title said "eight days ago" for a `daysAgo(7)` fixture. | Renamed to seven days. |

## What the review confirmed

- The write path did not grow: `advanceStreak` is a pure no-op on a same-day
  record, `bestStreakDays` is a running max in both the writer and the
  normaliser, and `recordLimitHit` declines for an unknown profile, for
  `limitMinutes === null` and for a day already counted - zero writes in all
  three cases, proved by the write-count tests.
- `SCHEMA_VERSION` is still 1, the storage key is unchanged, the unknown-version
  write protection is untouched, and a pre-track payload loads with zeros.
- Totality: every ratio guards its denominator, ties are deterministic
  (accuracy, then taps, then registry order), empty/sparse/cap-less profiles get
  written sentences rather than blanks, and the finiteness walk covers the whole
  object.
- The page: Overview is page 0, `pageCount` is five, the row window is empty on
  page 0, both chevrons clamp, a chip switch re-renders the *viewed* profile
  without switching the active one, and the gate, row positions, strip
  coordinates and reduced motion are untouched.
- The bridge is inert without `?e2e=1`, publishes the strings the overlay drew
  rather than a recomputation, exposes no setter and reaches no storage write.
- The journey is state-driven (no fixed sleeps, no literal day keys, the gate
  held until open) and asserts the drawn strings.
- The documents matched the code everywhere else, including the counts and the
  honest roadmap row (no ring buffer, adaptive-band spread deferred).

## Overrides

None.

## Deferred

Nothing. The two roadmap-shaped suggestions the review raised (a validated
export, a documented precedence for merged blocked states) were recorded in
earlier tracks' evidence and belong to the backup/restore track, not here.

## Doc sync

`docs/TDD.md` §5.9, `README.md`, `conductor/tech-stack.md` §5's dated entry and
`conductor/product.md` §10.3's roadmap row and metric table all describe what
shipped. `validate-docs` is green.
