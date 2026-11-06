# Trunk Green — Wall-Clock-Safe Test Fixtures — Specification

> Requirements are stable. Once an `FR`, `NFR`, or `AC` ID is approved, do not
> renumber it. If a requirement is removed, mark it `Withdrawn` instead of
> deleting it.

## Overview

Make the test suite's verdict independent of the calendar. Yesterday's failure
(`gameLaunch.test.ts` passing on 2026-10-27 and failing on every day after) is a
class, not an incident: a fixture wrote a literal date into a field that production
logic compares against *today*, so the assertion inverted itself at midnight. This
track proves no other suite has that shape, converts the fixtures that do, and
installs a static guard so the shape cannot come back.

## Problem / Motivation

`normalizePlayTime` zeroes `usedMinutes` whenever `lastUsedDate !== todayKey()`.
The fixture hardcoded `lastUsedDate: "2026-10-27"`, so from 2026-10-28 the
fixture's usage read as zero, `isNearLimit(60, 0)` returned false, and
`expect(showNudge).toHaveBeenCalledWith(0)` failed with zero calls. CI was green
at merge because the merge and the calendar agreed that day.

If unsolved: every roadmap phase (0 through 6) rebases onto a trunk that can go
red without a code change, and the team learns to re-run instead of read the
failure. That habit is the real cost — the single failing test masks whichever
genuine failure lands next to it.

## Goals & Success Metrics

- **Goal:** no test in the suite can pass or fail because of the date it runs on.
- **Metric:** a deliberate reintroduction of the pattern fails a test
  deterministically, and the suite is green with system time faked twelve months
  forward.

## Scope

### In Scope

- Classify all 29 remaining date literals in `src/__tests__/**` as *data* or
  *clock stand-in*, with the reason recorded as track evidence.
- Convert the clock stand-ins to explicit clock expressions.
- A static guard test over `src/__tests__/**/*.ts` that fails on a bare quoted
  date assigned to `lastUsedDate`.
- A rule in `conductor/code_styleguides/typescript.md`.

### Out of Scope

- Rewriting data literals (`progressLogic` day buckets, `storage`
  `createdAt`/`earnedAt`, `hubPrewarm` `lastPlayed`): they are fixture payloads,
  not stand-ins for today.
- Any production change under `src/` outside the test tree.
- A global fake-timer setup: `AudioManager`, `speech`, `fonts` and `Mascot`
  already manage their own timers, and a suite-wide freeze would fight them.

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | Every date literal in the test tree is classified as data or clock stand-in, with file, line and verdict recorded as track evidence | must |
| FR-2 | A guard test fails, naming file and line, when a `.ts` file under `src/__tests__` assigns a bare quoted `YYYY-MM-DD` to `lastUsedDate` | must |
| FR-3 | Every clock stand-in derives its date from an explicit clock (injected `now`, `todayKey(FIXED_NOW)`, or `vi.setSystemTime`), not a literal | must |
| FR-4 | `code_styleguides/typescript.md` states the rule, with the `gameLaunch` bug as the counter-example | must |
| FR-5 | The guard runs inside the existing `pnpm test` selection; no new npm script and no new CI step | should |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | The guard completes in under 1 s, with no network, timers, or Phaser |
| NFR-2 | No file outside `src/__tests__/**` and `conductor/code_styleguides/typescript.md` changes, plus the three documents `validate-docs` derives suite counts from (see amendment) |
| NFR-3 | The guard's verdict is independent of host date, timezone and locale |
| NFR-4 | Coverage gates and the existing test count are unaffected |

**NFR-2 amendment (2026-11-07, review finding R4).** The original wording was
"no file outside `src/__tests__/**` and `conductor/code_styleguides/typescript.md`
changes". Adding a test file changes the derived suite truth, and
`scripts/validate-docs.js` fails any living document whose counts disagree, so
`README.md`, `docs/TDD.md` and `docs/perf-baseline.md` had to be updated for AC-6
to be reachable at all. The amendment is recorded rather than waived, and it is
narrow to those three files: no production source changed.

**NFR-4 amendment (2026-11-07).** "The existing test count is unaffected" was
written before the track's own tests existed; the intended reading is that no
existing test is removed or skipped. The suite grew by four tests (guard probes)
and by one converted sweep budget, and every pre-existing test still runs.

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | The evidence table lists all 29 literals with a verdict | FR-1 |
| AC-2 | Introducing `lastUsedDate: "2026-01-01"` into a test file makes the guard fail with that path and line; the unmodified tree passes | FR-2 |
| AC-3 | A grep for a quoted date on `lastUsedDate` in the test tree returns nothing | FR-3 |
| AC-4 | The style guide carries the rule and the counter-example | FR-4 |
| AC-5 | `pnpm test -- --run` output includes the guard file | FR-5 |
| AC-6 | The full `verify_phase` gate is green | NFR-2 |

## Edge Cases

- **Self-reference.** The guard's own assertions contain example literals; the
  pattern must not match its own source.
- **Helpers.** A fixture helper under `src/__tests__/helpers/` is a likely hiding
  place, so the scan covers every `.ts` file in the tree, not only `*.test.ts`.
- **Constructed dates.** Template strings and concatenation evade a literal
  regex; recorded as an accepted limit.
- **Legitimate today-values.** `lastUsedDate: todayKey(FIXED_NOW)` must pass; the
  rule is about literals, not about the field.
- **Windows paths.** Scan results normalise separators so a failure message is
  copy-pasteable.

## Dependencies

- **Tracks:** none
- **External:** none

## Open Questions & Assumptions

- **Assumption:** `lastUsedDate` is the only field compared against today
  (verified: it is the only one `playTimeLogic` normalises).
- **Assumption:** 26 of the 29 literals are data; the audit is what proves that
  rather than asserts it.
- **Assumption:** shifting the clock for the proof means faking `Date` in the
  play-time suites, not on the host.

## References

- `conductor/product.md` §10.1 (track `20261106-trunk-green`), Phase 0
- `feda62bf` — the one-line fixture fix that unblocked the trunk
- `src/game/playTimeLogic.ts` (`normalizePlayTime`, `todayKey`)
- `src/__tests__/game/hub/gameLaunch.test.ts`
