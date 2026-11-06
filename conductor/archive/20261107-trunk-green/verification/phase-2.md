# Phase 2 Verification — Guard and Style Rule

- **Track:** `20261107-trunk-green` — Trunk Green — Wall-Clock-Safe Test Fixtures
- **Phase:** 2 — Guard and style rule
- **Date:** 2026-11-07
- **Branch:** `chore/20261107-trunk-green`
- **Phase base:** `7e722c7022a7c862592578c69c20aaa4171f2fc3`
- **Phase head:** `9e2b061c`
- **Result:** `blocked`

Two independent blockers, both outside what the phase executor may change:

1. `conductor/code_styleguides/typescript.md` is wrapped in `<protect>` and the
   `edit` tool answers `permission denied` for it, so P2.T3 could not be applied.
   The exact patch is in **Pending action for the primary** below.
2. The full `verify_phase` gate cannot go green on this host right now: the
   time-sensitive 22-game sweeps blow their 20–30 s budgets under full-suite
   load, and the same failure occurs **without** the guard file (control run
   below), so the cause is host saturation, not this phase's change.

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| static | `pnpm check` | 0 | Biome clean, 271 files |
| static | `pnpm typecheck` | 0 | `tsc --noEmit` clean |
| unit (targeted) | `pnpm test src/__tests__/guard/fixture-clock.test.ts -- --run` | 0 | 3/3 guard tests pass |
| unit (mutation fail) | `pnpm test src/__tests__/guard/fixture-clock.test.ts -- --run` | 1 | guard names both probe sites, as designed |
| unit (full gate, run 1) | `pnpm test -- --run` (inside the gate chain) | 1 | `hubEngagement.test.ts` 30 s timeout |
| unit (full gate, run 2) | `pnpm test -- --run` (inside the gate chain) | 1 | same test, same timeout |
| unit (full gate, run 3) | `pnpm test -- --run` (inside the gate chain) | 1 | `hubEngagement` + `navigation` 30 s timeouts |
| unit (full gate, run 4) | `pnpm test -- --run` (inside the gate chain) | 1 | the same two 30 s timeouts |
| unit (control, no guard) | `pnpm test --exclude "src/__tests__/guard/**" -- --run` | 1 | 131 files / 2,829 tests: `moreLessLogic` 20 s + the same two 30 s timeouts |
| documents | `node scripts/validate-docs.js` | 0 | 5/5 checks, suite truth matches 132 files / 2,832 tests |
| coverage / build / bundle / PWA | not reached | — | the chain stops at the unit layer |

The full gate command was run exactly as the brief specifies:

```text
pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js
```

Run 3 output (head of the chain through the failure):

```text
$ biome check
Checked 271 files in 719ms. No fixes applied.
$ tsc --noEmit
$ vitest -- --run

 RUN  v5.0.5 C:/Users/Ansyar/Documents/Upskilling/games/aby-little-lab

 ❯ src/__tests__/scenes/navigation.test.ts (39 tests | 1 failed) 88172ms
   ❯ HubScene (10)
     × navigates to each game scene when respective tile is clicked 31065ms
 ❯ src/__tests__/scenes/hubEngagement.test.ts (66 tests | 1 failed) 91689ms
   ❯ Hub engagement tile press feedback (6)
     × keeps tile taps navigating to games after press feedback is attached 30600ms

 Test Files  2 failed | 130 passed (132)
      Tests  2 failed | 2830 passed (2832)
   Duration  120.43s (tests 69%, environment 11%, import 7%, worker 7%, transform 6%)
```

Control run with the guard excluded (the Phase 1 baseline: 131 files / 2,829
tests) is strictly worse, which is what rules the guard out as the cause:

```text
$ vitest --exclude 'src/__tests__/guard/**' -- --run

 ❯ src/__tests__/game/moreLessLogic.test.ts (17 tests | 1 failed) 41530ms
 ❯ src/__tests__/scenes/hubEngagement.test.ts (66 tests | 1 failed) 103415ms
 ❯ src/__tests__/scenes/navigation.test.ts (39 tests | 1 failed) 101454ms

 Test Files  3 failed | 128 passed (131)
      Tests  3 failed | 2826 passed (2829)
   Duration  135.20s (tests 70%, environment 9%, import 7%, worker 7%, transform 7%)
```

Each failing test passes in isolation; `hubEngagement.test.ts` alone is
`66 passed (66)` in 23.36 s. Gate durations on this host climbed 95.6 s →
97.4 s → 120.4 s → 116.0 s with the control run at 135.2 s, matching host
saturation rather than a code path. Run 4 failed identically to run 3.

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| AC-2 | Introducing `lastUsedDate: "2026-01-01"` makes the guard fail with path and line; the unmodified tree passes | Mutation proof below: two probe sites reported (`game/hub/gameLaunch.test.ts:47`, `helpers/randomHelper.ts:28`), then 3/3 pass after revert | pass |
| AC-4 | The style guide carries the rule and the counter-example | **Not applied.** `edit` is denied on the `<protect>`-wrapped file; patch supplied below | blocked |
| AC-5 | `pnpm test -- --run` output includes the guard file | Guard-alone run executes it; `validate-docs` derived 132 files / 2,832 tests from one `vitest list`, i.e. the guard is in the selection (was 131 / 2,829) | pass |
| AC-6 | The full `verify_phase` gate is green | Red at the unit layer on host saturation; static and document layers pass; control run without the guard is also red | blocked |

Supporting checks: NFR-1 (guard runtime 30–52 ms per the runner's per-file
report, well under 1 s), NFR-3 (the guard compares text only: no `Date`,
`Date.now`, timezone or locale input), FR-5 (no new npm script or CI step; the
file matches the existing `src/__tests__/**/*.test.ts` include).

## Mutation proof (P2.T2)

Two temporary lines were added so the proof also demonstrates that one failure
lists **every** site and that a helper under `src/__tests__/helpers/` is scanned.

Temporary line 1, after `playTimeWith` in
`src/__tests__/game/hub/gameLaunch.test.ts`:

```ts
const MUTATION_PROBE: Partial<PlayTime> = { lastUsedDate: "2026-01-01" };
```

Temporary line 2, appended to `src/__tests__/helpers/randomHelper.ts`:

```ts
export const MUTATION_PROBE_HELPER = { lastUsedDate: "2026-01-02" };
```

### Fail run

Command:

```text
pnpm test src/__tests__/guard/fixture-clock.test.ts -- --run
```

Output (ANSI colour codes omitted):

```text
$ vitest src/__tests__/guard/fixture-clock.test.ts -- --run

 RUN  v5.0.5 C:/Users/Ansyar/Documents/Upskilling/games/aby-little-lab

 ❯ src/__tests__/guard/fixture-clock.test.ts (3 tests | 1 failed) 52ms
   ❯ fixture clock guard (3)
     × finds no bare day key assigned to lastUsedDate 44ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/__tests__/guard/fixture-clock.test.ts > fixture clock guard > finds no bare day key assigned to lastUsedDate
AssertionError: A test fixture hardcodes a day key in lastUsedDate, which production compares against today:
game/hub/gameLaunch.test.ts:47
helpers/randomHelper.ts:28
Derive the date from an explicit clock instead, e.g. todayKey(FIXED_NOW).: expected [ …(2) ] to deeply equal []

- Expected
+ Received

- []
+ [
+   "game/hub/gameLaunch.test.ts:47",
+   "helpers/randomHelper.ts:28",
+ ]

 ❯ src/__tests__/guard/fixture-clock.test.ts:92:7
     90|       sites,
     91|       `A test fixture hardcodes a day key in lastUsedDate, which produ…
     92|     ).toEqual([]);
     93|   });

 Test Files  1 failed (1)
      Tests  1 failed | 2 passed (3)
   Start at  00:58:57
   Duration  3.06s (environment 55%, transform 20%, import 13%, worker 10%, tests 2%)
```

### Revert and pass run

Both temporary lines were removed by restoring the original text, then:

```text
pnpm test src/__tests__/guard/fixture-clock.test.ts -- --run
```

```text
$ vitest src/__tests__/guard/fixture-clock.test.ts -- --run

 RUN  v5.0.5 C:/Users/Ansyar/Documents/Upskilling/games/aby-little-lab


 Test Files  1 passed (1)
      Tests  3 passed (3)
   Start at  00:59:19
   Duration  2.35s (environment 56%, import 24%, worker 13%, transform 6%, tests 1%)
```

### No probe survived

`git status --short` immediately after the revert listed only the then-untracked
guard directory (`?? src/__tests__/guard/`); `git diff` on `randomHelper.ts` was
empty. The guard commit `bde55926` is `1 file changed, 110 insertions(+)` —
`src/__tests__/guard/fixture-clock.test.ts` only — so no probe line is in any
commit.

## Pending action for the primary (AC-4)

Apply to `conductor/code_styleguides/typescript.md`, between the end of
`## 5. Comments and Documentation` and the `*Source: …*` footer:

```markdown
## 6. Tests and Time
- **No Wall-Clock Values:** A test must not derive a value from the wall clock. Inject the clock (`normalizePlayTime(save, now)`) or derive from an explicit fixed instant (`todayKey(FIXED_NOW)`, or `vi.setSystemTime`), so the verdict is the same on every calendar day, timezone and locale.
- **No Day-Key Literals for "Today":** A literal `YYYY-MM-DD` assigned to a field that production compares against *today* is a clock stand-in, not fixture data. In `gameLaunch.test.ts` the fixture wrote `lastUsedDate: "2026-10-27"`; the test passed on 2026-10-27 and failed from 2026-10-28 onward, because `normalizePlayTime` zeroes `usedMinutes` whenever the stored day is not `todayKey()`. Dates that are payload rather than a stand-in for today (sort keys, `createdAt`, `earnedAt`) may stay literal.
- **Enforcement:** `src/__tests__/guard/fixture-clock.test.ts` scans every `.ts` file under `src/__tests__` — helpers included — and fails, naming `path:line`, on a bare quoted day key assigned to `lastUsedDate`.
```

## Evidence paths

- Guard: `src/__tests__/guard/fixture-clock.test.ts` (commit `bde55926`)
- Count claims: `README.md`, `docs/TDD.md`, `docs/perf-baseline.md` (commit `9e2b061c`)
- Command output above was produced on this host on 2026-11-07.

## Deviations

| File | Reason |
| --- | --- |
| `README.md` | `validate-docs.js` derives the suite truth and fails a stale claim; `2,829 tests across 131 files` → `2,832 tests across 132 files`. |
| `docs/TDD.md` | Same guard: three claims (the `vmThreads` measurement note, the suite-size line, the coverage line) moved to 132 files / 2,832 tests. The accompanying "verified/measured 2026-10-27" dates were left untouched per the brief's "do not touch any other prose". |
| `docs/perf-baseline.md` | Same guard: the test-suite row and the Phase 3 walkthrough line moved to 132 files / 2,832 tests. |
| `src/__tests__/guard/fixture-clock.test.ts` | Implemented the walk with `import.meta.glob(…, { query: "?raw" })` instead of `node:fs` / `node:path`: the project has no resolvable `@types/node` (it is a private hoisted dependency and `tsconfig.json` pins `types: ["vitest/globals"]`), so a `node:fs` import fails `tsc` with TS2591. Raw glob is the repo's existing source-grep precedent (`game/art/shellOwnership.test.ts`); it is still a recursive read of every `.ts` file, with no glob dependency, no network and no timers. |

## Notes

- The guard excludes its own source two ways: the recursive scan skips the key
  ending `guard/fixture-clock.test.ts`, and a self-check test asserts the
  pattern does not match the file's own text (imported with `?raw`).
- Non-vacuity is asserted three ways: the scan is non-empty, it reaches nested
  directories (`game/hub/gameLaunch.test.ts`, `utils/storage.test.ts`), and it
  reaches helpers (`game/art/shellOwnership.test.ts` sits in a sibling tree; the
  helper reach was proved by the mutation proof's `helpers/randomHelper.ts`
  hit).
- Accepted limit, inherited from Phase 1: a date built by concatenation or
  template interpolation is not a literal and is not matched.
- Re-running the full gate on an unloaded host is the remaining verification
  step; nothing in the phase's static layers or the guard itself is red.

## Resolution

Both blockers were cleared by the primary, and neither required a change to the
guard.

1. **The style rule (AC-4)** - the subagent's `edit` is denied on
   `conductor/code_styleguides/typescript.md` (the file is `<protect>`-wrapped and
   the denial is intended for phase subagents). The primary applied the pending
   patch verbatim as `## 6. Tests and Time`, after `## 5. Comments and
   Documentation` and before the `*Source:*` footer.

2. **The gate (AC-6)** - the two 22-scene sweeps were marginal against the global
   30 s `testTimeout`, and the control run proved the guard was not the cost
   (81.5 s with it, 84.5 s without). Phase 3 gave those two tests a 60 s budget.
   With that in place the gate ran green three times consecutively, including
   three coverage runs, with no edit between the first two.

The phase therefore stands verified on re-run rather than on its first attempt,
and the evidence above is left as it was produced so the record shows the order
things actually happened in.

