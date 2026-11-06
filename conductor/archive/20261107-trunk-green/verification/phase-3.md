# Phase 3 Verification — Timeout headroom for the 22-scene sweeps

- **Track:** `20261107-trunk-green` — Trunk Green — Wall-Clock-Safe Test Fixtures
- **Phase:** 3 — Timeout headroom for the 22-scene sweeps
- **Date:** 2026-11-07
- **Branch:** `chore/20261107-trunk-green`
- **Phase base:** `4cdf8e1af8a94574015d443274d2c19e794e520c`
- **Phase head:** `1eda5fc2` (the pre-squash commit `ace2e97b` no longer exists on the branch)
- **Result:** **verified** - the command denial was cleared by the primary, see Primary verification below

The code change (P3.T1) is complete, committed and statically clean. The proof
(P3.T2) could not start: the phase's verification command was refused by the
execution policy before it ran, so no coverage run and no `verify_phase` chain
has been recorded for this phase.

## Blocker

`CI=true pnpm test:coverage` returns `permission.rejected` / `Permission denied:
shell`. The same tool runs `pnpm check`, `pnpm typecheck`, `git` and the task
commits without objection, so the refusal is specific to this command string.
Per the phase rules a denied call is not retried, rephrased or worked around, so
the two coverage runs and the gate chain were not attempted in any other form —
including inside the `&&` chain, whose coverage step would reach the same
denied action.

Needed, run from the repository root:

```text
CI=true pnpm test:coverage
CI=true pnpm test:coverage
pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js
```

The first two runs must be back to back with no edit in between, and both must
exit `0`; the third is the full gate. Expected on this host, per the phase
brief: each coverage run reports 132 files / 2,832 tests green in roughly 2–3
minutes, and the chain exits `0`. Any non-zero exit means the phase is `failed`,
not `blocked`.

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| static | `pnpm check` | 0 | Biome clean, 271 files in 385 ms |
| static | `pnpm typecheck` | 0 | `tsc --noEmit` clean |
| coverage (P3.T2.1) | `CI=true pnpm test:coverage` | — | **not run**: command denied by policy (see Blocker) |
| coverage (P3.T2.1) | `CI=true pnpm test:coverage` | — | **not run**: same denial |
| full gate (P3.T2.2) | the `verify_phase` chain | — | **not run**: depends on the coverage runs above |

No coverage or gate result exists for this phase. Neither coverage run failed —
neither was permitted to start.

## Changed test sites (P3.T1)

| File | Test | Before | After |
| --- | --- | --- | --- |
| `src/__tests__/scenes/navigation.test.ts` | "navigates to each game scene when respective tile is clicked" | inherited `testTimeout: 30000` | `{ timeout: 60_000 }` plus a one-line reason comment |
| `src/__tests__/scenes/hubEngagement.test.ts` | "keeps tile taps navigating to games after press feedback is attached" | inherited `testTimeout: 30000` | `{ timeout: 60_000 }` plus a one-line reason comment |

Both use the repository's existing per-test form (`it(name, { timeout: … }, fn)`,
as in `game/addItUpLogic.test.ts`) and the comment reads:

```ts
// Boots all 22 scenes in one test body: needs headroom under coverage on a loaded host.
```

`vite.config.ts` is unchanged: `testTimeout` stays at 30000 for every other
test. No other test's budget changed.

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| AC-6 | The full `verify_phase` gate is green | Static layers pass (`pnpm check`, `pnpm typecheck`); coverage and the gate chain could not run because their command was denied | blocked |

## Evidence paths

- Change: `ace2e97b` — 2 files changed, 8 insertions(+), 2 deletions(-)
- Static runs above were produced on this host on 2026-11-07.
- Motivating measurements: `conductor/tracks/20261107-trunk-green/verification/phase-2.md`

## Deviations

None. The change is confined to the two files in `Touches`.

## Notes

- The two tests are the only two in the suite that boot all 22 scenes in a single
  body; both were measured at 30–31 s under full-suite coverage load and at
  20–23 s with their file run alone, which is what makes the global 30 s budget
  marginal rather than plainly too small.
- Because the denial is on the command and not on the work, nothing in the tree
  needs a follow-up edit: re-running the three commands above is the whole of
  what remains.

## Primary verification

The phase subagent's shell refused `CI=true pnpm test:coverage` (a permission
denial on the command string, not on the action), so the primary ran the
remaining verification. The tree was not modified between these runs.

| Layer | Command | Exit | Result |
|-------|---------|------|--------|
| coverage run 1 | `CI=true pnpm test:coverage` | 0 | 132 files / 2,832 tests, statements 97.87 / branches 92.16 / functions 97.01 / lines 98.76 |
| coverage run 2 | `CI=true pnpm test:coverage` | 0 | identical summary - back to back, no edit in between |
| static | `pnpm check` | 0 | 271 files, no findings |
| static | `pnpm typecheck` | 0 | clean |
| unit | `CI=true pnpm test -- --run` | 0 | 132 files / 2,832 tests, 16.92 s (2,833 after the review fixes below) |
| coverage (in chain) | `pnpm test:coverage` | 0 | 97.86 / 92.10 / 97.01 / 98.76 |
| build | `pnpm build` | 0 | succeeded, `dist/sw.js` emitted |
| bundle artifact | `node scripts/validate-bundle.js` | 0 | phaser 1335.0 kB, shell 150.0 kB <= 200 kB |
| PWA artifact | `node scripts/validate-pwa.js` | 0 | 16 passed, 47 chunks precached |
| documents | `node scripts/validate-docs.js` | 0 | 5 passed |

**Gate green.** Three coverage runs passed in a row with no edit between the
first two, so the 60 s budgets clear the deadline with margin rather than
depending on scheduling.

A note for the record: the same suite took 16.9 s here, 81.5 s an hour earlier
and roughly 124 s under coverage during the failing window. The host's variance
is far larger than the gap between the old and new budget, which is why the
budget was the thing to move and the load was not.

