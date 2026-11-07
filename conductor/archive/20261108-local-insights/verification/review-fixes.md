# Phase R1 verification — Review Fixes

| | |
| --- | --- |
| Track | `20261108-local-insights` |
| Phase | R1 — Review Fixes |
| Date | 2026-11-08 |
| Branch | `feat/20261108-local-insights` |
| Phase base | `b0840c50` |
| Head at verification | `6b20156f` (the evidence commit follows this one) |

## Findings

| ID | Severity | Finding | Fix | Commit |
| --- | --- | --- | --- | --- |
| F1 | high | `summariseInsights` counted days from each game's `lastPlayedAt`, which holds only the latest play, while the strip drew the pruned activity entries | count `daysPlayed` from `pruneActivity(profile.activity, now)` inside the same `weekStart`/`today` window; keep `distinctGames` on the stamps | `46e1ec54` |
| F2 | medium | `activity.completionPercent` was computed and never printed, contradicting `conductor/product.md:188` | print the share in the reach sentence, with the zero and no-denominator branches written out | `46e1ec54` |
| F3 | medium | `dayKey()` accepted any non-empty string, so `"banana"` survived normalisation and was rewritten on every save | validate the day-key shape, then the calendar day | `4d7313c0` |
| F4 | low | `docs/TDD.md` claimed the statements and the strip are built from one summary object; there is no such object | both read the same profile snapshot and the same seven-day window | `6b20156f` |
| F5 | low | no year-rollover proof for `advanceStreak` or for the week window | 31 Dec → 1 Jan extends the streak; a January moment still counts December days | `4d7313c0`, `46e1ec54` |
| F6 | low | week-boundary test was titled "eight days ago" over a `daysAgo(7)` fixture | renamed to seven days and given the activity buckets | `46e1ec54` |

## F1 — the day count follows the strip

`src/game/insightsSummary.ts`:

```ts
const weekStart = weekStartKey(now);
const today = todayKey(now);

const daysPlayed = pruneActivity(profile.activity, now).filter(
  (entry) => entry.plays > 0 && entry.day >= weekStart && entry.day <= today,
).length;
```

The old `playedDays` set (and its `.size`) is gone. `distinctGames` still reads
`playedDayKey(game.lastPlayedAt) >= weekStart`, because "distinct games this week"
is a question about games, not days; the comment beside the loop records that the
two numbers may legitimately differ.

The test fixture helper now gives each profile the activity its stamps imply, and
the case named in the brief is quoted in full:

```ts
describe("summariseInsights — the day count", () => {
  it("counts three days when one game was played on three of them", () => {
    // One game, one last-played stamp: the defect this test guards against
    // counted a single day here while the strip drew three bars.
    const profile = profileOf(
      [
        [
          "color-match",
          { plays: 3, wins: 1, correct: 8, wrong: 2, lastPlayedAt: daysAgo(0).toISOString() },
        ],
      ],
      {
        activity: activityOf([
          [0, 1],
          [1, 1],
          [2, 1],
        ]),
      },
    );

    const summary = summariseInsights(profile, NOW);

    expect(summary.activity.daysPlayed).toBe(3);
    expect(summary.activity.distinctGames).toBe(1);
    expect(summary.lines[0]).toBe(
      "1 of 22 games · 3 days this week · 1 completion in all (33% of started games finished)",
    );
  });
```

Before the fix that profile printed `1 day this week`; the strip over the same
profile drew three bars. The rich profile also gained a fourth activity entry on
a day no game was last played, so its day count (4) is deliberately larger than
its distinct games (3).

## F2 — the completion share is printed

The reach sentence now reads:

- zero completions → `nothing completed yet` (unchanged);
- completions but no denominator (`wins` without `plays` in a malformed record) →
  `N completions in all`;
- otherwise → `N completions in all (P% of started games finished)`.

Rich profile, before and after:

```text
before: 3 of 22 games · 3 days this week · 6 completions in all
after:  3 of 22 games · 4 days this week · 6 completions in all (43% of started games finished)
```

(The day count moves in the same case because of the added F1 activity entry; the
completion clause is the F2 change.)

The other four AC-5 profiles:

```text
no games played
No games yet this week · nothing completed yet

games played, none completed
2 of 22 games · 2 days this week · nothing completed yet

fewer than MIN_SUMMARY_TAPS
1 of 22 games · 1 day this week · 1 completion in all (100% of started games finished)

no daily limit
1 of 22 games · 1 day this week · 2 completions in all (67% of started games finished)
```

A dedicated test covers the no-denominator branch:
`prints completions without a share when a malformed record has wins but no plays`
asserts `completionPercent` is `null` and the line is
`No games yet this week · 5 completions in all`.

`docs/TDD.md` §5.9 says the same in prose: the Reach row now names the share, and
the paragraph beneath the table spells out all three shapes.

## F3 — a day key must name a real day

```ts
const DAY_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;

function dayKey(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = DAY_KEY.exec(value);
  if (match === null) return null;
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1) return null;
  const daysInMonth = new Date(Number(match[1]), month, 0, 12).getDate();
  return day <= daysInMonth ? value : null;
}
```

A shape check alone cannot reject an impossible month, and the comment says so
rather than over-claiming: `"2026-13-45"` matches the pattern. The calendar
check is what refuses it, and the month length is read at noon so a
daylight-saving change at midnight cannot shift the count onto a neighbouring
day. Tests: `"banana"`, `"2026-13-45"`, `"2026-02-30"`, `"2026-1-1"`,
`"2026/01/01"`, `"2026-01-01T00:00:00Z"` and `" 2026-01-01"` all normalise to the
defaults; `"2028-02-29"` and `"2026-12-31"` are kept.

## F4 — one snapshot, one window, not one object

`docs/TDD.md`, before:

> The statements and the strip are built from the same summary object, which is
> why a paged-forward and paged-back Overview prints the same three sentences it
> printed the first time.

after:

> The statements and the strip read the same profile snapshot and the same
> seven-day window — the summary counts its days from the strip's own activity
> entries, never from each game's latest stamp — which is why a paged-forward and
> paged-back Overview prints the same three sentences the strip beneath it
> continues to draw.

## F5 — the year boundary

- `advanceStreak extends a streak across a year boundary`: stored day
  `todayKey(2026-12-31)`, current 2, best 2, now 2027-01-01 → current 3, best 3,
  last day 2027-01-01. A calendar-step that lost the month or year turn would
  restart the streak at 1.
- `counts the week from December when the moment is in early January`: activity
  on 31 December and 1 January, `now` is 2 January, so the seven-day window must
  reach back across the year; asserts `daysPlayed` 2, `distinctGames` 1 and
  `2 days this week`.

## F6 — the renamed boundary test

`drops a game played eight days ago…` was asserting over `daysAgo(7)`. It is now
`drops a game played seven days ago from the week but keeps its completions`,
and it receives the activity for the three stamped days so the pruning bound is
what the day count is measured against.

## Journey seed

`e2e/journeys/insights.spec.ts` seeded `activity: []`. It now seeds the two days
the stamps imply, with the day keys computed inside the page:

```ts
activity: [
  { day: dayKey(0), plays: 4 },
  { day: dayKey(-1), plays: 3 },
],
```

and the first statement asserts the seeded numbers: `2 of 22 games`,
`2 days this week`, `5 completions in all`, `63% of started games finished`
(5 wins of 8 started sessions, `Math.round(62.5)` = 63). The rest of the seed
shape is unchanged.

## Counts

Refresh only, mechanically from the run below: `README.md:49` 2,975 → **2,981
tests** (137 files unchanged); `docs/TDD.md` §10.2 and §10.3 the same, with
coverage statements 97.22 (6104/6278), branches 91.17 (1757/1927), functions
96.11 (1335/1389), lines 98.21 (5677/5780); `docs/perf-baseline.md` test-suite
and coverage rows the same figures. `node scripts/validate-docs.js` passes its
`The living docs state the current test-suite truth` check.

## Commands

The whole chain was run as the brief writes it, in one invocation:

`pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`

| Command | Result | Exit |
| --- | --- | --- |
| `pnpm check` | `Checked 301 files in 314ms. No fixes applied.` | 0 |
| `pnpm typecheck` | `tsc --noEmit` plus the e2e project: no output | 0 |
| `pnpm test -- --run` | `Test Files 137 passed (137)`, `Tests 2981 passed (2981)`, 18.04 s | 0 |
| `pnpm test:coverage` | 137 files / 2981 tests; statements 97.22 (6104/6278), branches 91.17 (1757/1927), functions 96.11 (1335/1389), lines 98.21 (5677/5780) against the 95 / 88 / 85 / 90 gate | 0 |
| `pnpm build` | `✓ 365 modules transformed`, `✓ built in 659ms`, `precache 59 entries (1755.94 KiB)` | 0 |
| `node scripts/validate-bundle.js` | `PASS: Phaser vendor chunk present: phaser-B_vcVLyb.js (1335.0 kB)`, `PASS: shell entry index-DfVk-7sS.js = 158.5 kB (<= 200 kB)`, `All bundle validation checks passed!` | 0 |
| `node scripts/validate-pwa.js` | `Results: 16 passed, 0 failed` (47 chunks, 47 precached) | 0 |
| `node scripts/validate-docs.js` | `Results: 5 passed, 0 failed`, including `✓ The living docs state the current test-suite truth` | 0 |
| `pnpm test:e2e` | **permission denied** before it ran (no output); recorded as a blocker, browser half is the primary's | — |

In the coverage report `src/game/insightsSummary.ts` is `100` statements, `91.37`
branches, `100` functions and `100` lines; the branch remainder is the defensive
`??` fallbacks for registry ids the compile-time proof already makes impossible.

## Blocked

`pnpm test:e2e` is refused for this phase executor (`permission.rejected`,
`Permission denied: shell`), as the brief anticipated. Expected result, from
Phase 4 and the primary's runs: `pnpm test:e2e` builds `dist` and runs the
Playwright Chromium project; the 17 journeys pass in roughly 3.2 minutes, which
includes `e2e/journeys/insights.spec.ts` asserting the seeded Reach line above.
The browser half is the primary's to run.

## Deviations

1. **`dayKey` checks the calendar, not only the shape.** The brief's snippet is
   the shape regex; its own note says a shape check cannot reject an impossible
   month, and the reviewer's finding is that a non-date string must not survive.
   The shape test is kept as the first gate and a calendar check added, so
   `"2026-13-45"` is dropped as the brief's test case requires. Recorded here
   rather than silently widening the change.
2. **The week-window fixture's `plays` changed** from 1 each to 2 / 3 / 4 so the
   new share clause prints a meaningful percentage (67%) instead of the clamped
   `100%` a 3-play / 6-win record would produce. The stamps, the assertions the
   test exists for and the game ids are unchanged.
3. No file outside `Touches` was modified; no dependency, lockfile, test
   framework or network access was added.

## Notes

- Every day key in the tests is derived from `todayKey(daysAgo(n))` or an
  explicit local instant. The two literal-looking keys in the F3 tests
  (`"2026-13-45"`, `"2026-02-30"`) are the invalid payloads under test, never a
  stand-in for "today", so `src/__tests__/guard/fixture-clock.test.ts` stays
  green.
- The `<= today` bound in the new filter is deliberate: `pruneActivity` only
  bounds the window from below, so a future-dated entry would otherwise count.
- Six tests were added across the two suites (2,975 → 2,981 overall): three in
  `insightsSummary.test.ts` (the three-day case, the no-share branch, the January
  window) and three in `insightsLogic.test.ts` (the year-boundary streak, the
  non-date key, the real-calendar key). The remaining changes are edits to
  existing cases and their fixtures.

## Primary verification

Verified 2026-11-08 by the primary agent, independently of the executor.
Phase base `b0840c50`, head `fb84c444`.

| Check | Result |
| --- | --- |
| Working tree | clean before the primary's runs |
| Commits in range | 4, no merges, all reported |
| Scope diff | 9 files: 2 `src/` modules, 2 unit suites, 1 journey, 3 documents, the evidence file |
| `pnpm test:e2e` | **17 passed (3.2m)**, exit 0 - the insights journey among them, with the seeded activity |
| `pnpm check` | `Checked 301 files in 355ms. No fixes applied.` - exit 0 |
| `pnpm typecheck` | both programs - exit 0 |
| `pnpm test -- --run` | `137 files / 2981 tests passed`, 20.02 s - exit 0 |
| `pnpm test:coverage` | statements 97.21 / branches 91.12 / functions 96.11 / lines 98.21 - exit 0 |
| `node scripts/validate-bundle.js` | shell `index-DfVk-7sS.js` 158.5 kB <= 200 kB - exit 0 |
| `node scripts/validate-pwa.js` | `Results: 16 passed, 0 failed` - exit 0 |
| `node scripts/validate-docs.js` | `Results: 5 passed, 0 failed` - exit 0 |

### The browser half

The executor's blocker was `pnpm test:e2e`, so the primary ran it. 17 journeys
passed in 3.2 minutes, including
`a parent reads the three insight statements on the first Progress page`, now
against a profile whose `activity` matches its last-played stamps. Before this
round the seed had no activity at all, which is precisely why the journey could
not see the day-count defect F1 named.

### What was read, not trusted

- `daysPlayed` is `pruneActivity(profile.activity, now)` filtered to
  `plays > 0` **and** `weekStart <= day <= today`, computed once at the top of
  `summariseInsights` and placed in the summary - so the sentence and the strip
  read one window, and a malformed future entry cannot inflate the count.
- `distinctGames` deliberately still reads the last-played stamp, with a comment
  saying the two numbers answer different questions and the day count may be the
  larger one. That is the honest way round.
- The reach sentence has three branches now: zero completions, completions with
  no denominator (only a malformed record), and the share. A malformed record
  still reads.
- `dayKey` checks shape **and** the calendar, reading month length at noon so a
  DST change cannot move a count. That is stricter than the brief's regex and
  strictly better: `"2026-13-45"` is refused, not merely `"banana"`.
- The year rollover is proven on both helpers: 31 Dec -> 1 Jan extends the
  streak, and a 2 January moment still counts 31 December inside the week.

### Coverage jitter

The executor's run printed 97.22 / 91.17 and the primary's 97.21 / 91.12 for the
same tree. That spread is a tenth of a point across v8 instrumentation and has
been seen on every track; the living documents quote the executor's run, which
is the run the evidence file records, and both are far above the 90 / 85 gate.

### Acceptance

- **F1** - fixed, and the defect class is now covered by a case a one-game,
  three-day profile would have failed.
- **F2** - fixed: `6 completions in all (43% of started games finished)`, and
  the roadmap claim about the rate is true.
- **F3** - fixed, stricter than asked.
- **F4, F5, F6** - fixed.
- **FR-4, FR-9, AC-5, AC-9** move from `partial` to `covered`.

