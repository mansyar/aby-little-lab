# Phase 2 verification — The sentence

| | |
| --- | --- |
| Track | `20261108-local-insights` |
| Phase | 2 — The sentence |
| Date | 2026-11-08 |
| Branch | `feat/20261108-local-insights` |
| Phase base | `52d4c2ae` |
| Head at verification | `2b621aa4` (the evidence commit follows this one) |

## Commands

The whole chain was run as the brief writes it, in one invocation, against the
tree that contains the module, the tests and the refreshed counts:

`pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`

| Command | Result | Exit |
| --- | --- | --- |
| `pnpm check` | `Checked 300 files in 429ms. No fixes applied.` | 0 |
| `pnpm typecheck` | `tsc --noEmit` plus the e2e project: no output | 0 |
| `pnpm test -- --run` | `Test Files 137 passed (137)`, `Tests 2968 passed (2968)`, 22.65 s | 0 |
| `pnpm test:coverage` | 137 files / 2968 tests; statements 97.24 (6065/6237), branches 91.25 (1733/1899), functions 96.24 (1332/1384), lines 98.24 (5642/5743) against the 95 / 88 / 85 / 90 gate | 0 |
| `pnpm build` | `✓ 364 modules transformed`, `✓ built in 1.07s`, `PWA mode generateSW`, `precache 59 entries (1752.29 KiB)` | 0 |
| `node scripts/validate-bundle.js` | `PASS: Phaser vendor chunk present: phaser-B_vcVLyb.js (1335.0 kB)`, `PASS: shell entry index-BkVZzHl3.js = 154.8 kB (<= 200 kB)`, `All bundle validation checks passed!` | 0 |
| `node scripts/validate-pwa.js` | `Results: 16 passed, 0 failed` (47 chunks, 47 precached) | 0 |
| `node scripts/validate-docs.js` | `Results: 5 passed, 0 failed`, including `✓ The living docs state the current test-suite truth` | 0 |

`src/game/insightsSummary.ts` in the coverage report: `100` statements,
`90.56` branches, `100` functions, `100` lines. The branch remainder is the
defensive `??` fallbacks for a registry id that the compile-time coverage proof
in `gameRegistry.ts` already makes impossible.

## Acceptance

AC-5 asks for the three statements for five profiles — no games played, games
played but never completed, fewer than `MIN_SUMMARY_TAPS` taps overall, a rich
profile, and a profile without a limit — with no `NaN` or `Infinity` anywhere.

All five live in one table, and each case asserts the three statements *and* the
numbers in `activity`, `accuracy` and `routine`:

| Profile | Test name |
| --- | --- |
| No games played | `summariseInsights — the five AC-5 profiles > writes three statements and their numbers for a profile with no games played` |
| Played but never completed | `… > writes three statements and their numbers for a profile with games played but none completed` |
| Fewer than `MIN_SUMMARY_TAPS` overall | `… > writes three statements and their numbers for a profile with fewer than MIN_SUMMARY_TAPS taps overall` |
| Rich | `… > writes three statements and their numbers for a rich profile` |
| No daily limit | `… > writes three statements and their numbers for a profile without a daily limit` |

The three lines for the rich profile (three games inside the week, one from
eight days ago outside it, 6 lifetime completions, a 4-day streak with a best of
9, the cap reached on 3 days, limit 30 minutes), quoted from the table:

```text
3 of 22 games · 3 days this week · 6 completions in all
73% of answers correct · strongest Shape Sorter (90%) · hardest Pop & Freeze (60%)
4 days in a row · best 9 days · cap reached on 3 days
```

The other AC-5 profiles, same table:

```text
a profile with no games played
No games yet this week · nothing completed yet
Start playing to see how it is going
No streak yet · no daily limit set

a profile with games played but none completed
2 of 22 games · 2 days this week · nothing completed yet
77% of answers correct · not enough play yet to name a strongest game
No streak yet · cap not reached yet

a profile with fewer than MIN_SUMMARY_TAPS taps overall
1 of 22 games · 1 day this week · 1 completion in all
71% of answers correct · not enough play yet to name a strongest game
No streak yet · no daily limit set

a profile without a daily limit
1 of 22 games · 1 day this week · 2 completions in all
90% of answers correct · Story Order has the most answers so far (90%)
2 days in a row · best 5 days · no daily limit set
```

Supporting tests for the rest of the brief's list:

| Requirement | Test name |
| --- | --- |
| Exactly `MIN_SUMMARY_TAPS`, and one tap below | `summariseInsights — the accuracy floor > ranks a game with exactly MIN_SUMMARY_TAPS taps and ignores one tap fewer` |
| A single wrong tap never named hardest | `… > never names a game hardest on a single wrong tap` |
| Eight days ago out of the week, still in lifetime completions | `summariseInsights — the week window > drops a game played eight days ago from the week but keeps its completions` |
| Malformed insights do not throw, three lines remain | `summariseInsights — totality and purity > still produces three lines from a malformed insights record` |
| No `NaN` / `Infinity`, asserted by walking the output | `… > emits no NaN or Infinity for any of the profiles above` |
| Purity: equal output for equal arguments | `… > returns equal output for equal arguments` |
| Purity: the profile is not mutated | `… > does not mutate the profile it is given` |

The finiteness check is a recursive walk over the produced strings and numbers
(`expectTotal`), so a `NaN` in any nested field fails with its path rather than
being matched by eye. Every day key in the fixtures comes from `todayKey(...)`
over a fixed local instant; no stored field holds a literal `YYYY-MM-DD`.

## Evidence paths

- `src/game/insightsSummary.ts` — the module: `MIN_SUMMARY_TAPS`,
  `GameSummary`, `InsightsSummary`, `summariseInsights`.
- `src/__tests__/game/insightsSummary.test.ts` — 12 tests: the five-case
  table plus the seven supporting tests above.
- `README.md:49`, `docs/TDD.md` (§10.2 suite shape, §10.3 coverage gates),
  `docs/perf-baseline.md` (test-suite and coverage rows) — counts refreshed.
- `conductor/tracks/20261108-local-insights/verification/phase-2.md` — this file.

## Deviations

1. **`activity.completionPercent` is one field more than the brief's interface.**
   The brief's interface block lists `{ daysPlayed, distinctGames, completions }`;
   FR-4 and plan task P2.T1 both require the overall completion rate the page is
   to show. It is carried here (rounded whole percent, `null` when there are no
   plays, clamped at 100 so a malformed `wins > plays` cannot print an impossible
   rate) instead of being recomputed by the page. No other shape changed.
2. **Living-document counts refreshed**, as the brief instructs: 136 files /
   2,956 tests became 137 / 2,968, coverage 97.19 / 91.22 / 96.21 / 98.22 became
   97.24 / 91.25 / 96.24 / 98.24 (the exact figures this run printed, with their
   raw counts), and the verified date stays 2026-11-08. Only those numbers and
   dates changed.
3. No file outside `Touches` was modified.

## Blocked

None. No command was refused.

## Notes

- The week window is derived from `todayKey(now)` arithmetic
  (`todayKey(new Date(y, m, d - (ACTIVITY_DAYS - 1)))`) and tested with the same
  `>= weekStart` comparison `pruneActivity` uses, so the summary and the 7-day
  strip can never disagree about which day is "this week". A future-dated
  `lastPlayedAt` counts exactly as it counts in the strip.
- Games this week are counted from `lastPlayedAt`, not from `profile.activity`:
  the activity list is pruned to seven entries, which is a symptom of the window,
  not its definition.
- Strongest and hardest are chosen among games with at least `MIN_SUMMARY_TAPS`
  answer taps, compared on the exact ratio, then higher taps, then registry
  order. When only one game clears the floor both point at it and the sentence
  names it once rather than claiming a comparison that does not exist.
- Labels come from `GAME_REGISTRY` (the single registry); no second game table
  was added. Registry order comes from the same list.
- `pnpm test -- --run` runs the whole suite – the extra `--` is passed through to
  vitest – so the counts above are whole-suite counts, the same shape
  `validate-docs.js` derives.
- Coverage instrumentation moves by a hundredth between identical runs (see
  Phase 1 and the archived tracks). These documents quote the final chained run;
  the gate clears by more than six points on every metric.

## Primary verification

Verified 2026-11-08 by the primary agent, independently of the executor.
Phase base `52d4c2ae`, head `75d0f6a8`.

| Check | Result |
| --- | --- |
| Working tree | clean before the primary's runs |
| Commits in range | 4, no merges, all reported |
| Scope diff | 6 files: 1 module, 1 test file, 3 living docs, the evidence file |
| `pnpm check` | `Checked 300 files in 420ms. No fixes applied.` - exit 0 |
| `pnpm typecheck` | both programs, no output - exit 0 |
| `pnpm test -- --run` | `Tests 2968 passed (2968)`, 20.52 s - exit 0 |
| `pnpm test:coverage` | statements 97.24 / branches 91.25 / functions 96.24 / lines 98.24 - exit 0 |
| `pnpm build` | `built in 876ms`, 59 precache entries (1752.29 KiB) - exit 0 |
| `node scripts/validate-bundle.js` | phaser 1335.0 kB; shell `index-BkVZzHl3.js` 154.8 kB <= 200 kB - exit 0 |
| `node scripts/validate-pwa.js` | `Results: 16 passed, 0 failed` - exit 0 |
| `node scripts/validate-docs.js` | `Results: 5 passed, 0 failed` (suite truth 137 files / 2968 tests) - exit 0 |

### The module was read, not the report trusted

- `src/game/insightsSummary.ts` (264 lines) imports types, `GAME_REGISTRY` and
  the two existing normalisers. No Phaser, no storage, no `new Date()` inside —
  `now` is an argument, and the week window is built by stepping the calendar
  date from `now` (daylight-saving safe) rather than subtracting hours.
- The week window is the same one the 7-day strip draws (`ACTIVITY_DAYS`), and
  membership is decided by comparing local day keys, so the sentence and the
  strip cannot disagree about which plays count.
- Labels come from `GAME_REGISTRY` through a lookup map, so there is no second
  table of game names to drift.
- Every ratio goes through `percentOf`, which returns `null` rather than
  `0 / 0`; `accuracyPercent` is computed only inside the `taps >=
  MIN_SUMMARY_TAPS` guard, so a division by zero is unreachable rather than
  merely unlikely.
- The tie-break is deterministic (accuracy, then more taps, then registry
  order), so the same profile always names the same two games.
- One game qualifying for both ends is handled explicitly: it reports "has the
  most answers so far" instead of naming the same game strongest and hardest,
  which is the right call for a single-game profile.
- The tone is quiet and factual, and the unlimited branch names the setting
  instead of printing `0` cap-days at a family that chose no limit.

### Acceptance

AC-5 passes: the five profiles are table-driven in one test that asserts both
the statement text and the numbers, the floor boundary is tested from either
side, a single wrong tap cannot make a game hardest, an eight-day-old play is
excluded from the week but kept in lifetime completions, a malformed `insights`
record still yields three lines, a finiteness walk finds no `NaN`/`Infinity`,
and purity is proven by calling twice and by deep-freezing the input. The
executor's coverage reading and the primary's agree exactly this time
(97.24 / 91.25 / 96.24 / 98.24).

### Deviations accepted

1. `activity.completionPercent` exists beyond the interface in the brief. FR-4
   asks for the completion rate and P2.T1 commits to it; the brief's interface
   block simply omitted the field. It is clamped at 100 so a malformed
   `wins > plays` cannot print an impossible share.
2. The living-document counts were refreshed mechanically to 137 files /
   2968 tests, as `validate-docs` requires.

