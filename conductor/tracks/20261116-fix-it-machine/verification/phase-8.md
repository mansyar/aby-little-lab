# Phase 8 — The launch journey stops setting the clock: verification

- **Track:** `20261116-fix-it-machine`
- **Phase:** 8 of 8 — the browser suite back inside NFR-2's budget
- **Branch:** `feat/20261116-fix-it-machine`
- **Evidence log:** `.conductor/evidence/20261116-fix-it-machine/phase-8-gate.log` (gate exit 0)
- **Supporting runs:** `phase-8-e2e.log` (split at two workers), `.conductor/tmp/e2e-workers3.log` (split at three workers)

## Verification command

```
pnpm test:e2e && pnpm check && pnpm typecheck && pnpm test -- --run &&
pnpm test:coverage && pnpm build && node scripts/validate-bundle.js &&
node scripts/validate-pwa.js && node scripts/validate-docs.js
```

**Exit status: 0.**

| Step | Result |
| --- | --- |
| `pnpm test:e2e` | **26 passed in 4.3 min** (this run); halves at 1.8 min each; partition guard 7 ms |
| `pnpm check` | clean |
| `pnpm typecheck` | no errors (both projects) |
| `pnpm test -- --run` | 153 files / 3,306 tests (unchanged — no unit test was touched) |
| `pnpm test:coverage` | 97.12 / 90.93 / 96.20 / 98.31 (unchanged) |
| `pnpm build` + validators | entry `index-DK87S-QP.js` 186.4 kB ≤ 200 kB; PWA 16/16 |
| `validate-docs.js` | 5/5 |

## The measurement chain

| Shape | Wall clock | Notes |
| --- | --- | --- |
| One serial `launch-all` file, two workers | 5.0 min | the state this phase started from; `launch-all` alone 3.3 min |
| Two parallel halves, two workers | 5.1 min | `phase-8-e2e.log`; the file drops to 1.8 min but a two-worker floor is total work ÷ 2, and 24 launches are only ~200 s of ~600 s of work |
| Two parallel halves, **three workers** | **3.8 min** | `.conductor/tmp/e2e-workers3.log` |
| Same, in the phase gate | **4.3 min** | `phase-8-gate.log`; run-to-run variance on this host |

Both post-change runs sit inside NFR-2's 5 min ceiling; the documents carry the range 3.8–4.3 min
rather than the better single run.

## P8.T1 — the roster runs as two parallel halves

`e2e/journeys/launch-all.spec.ts` keeps its whole contract and splits only its scheduling:

- `SPLIT = Math.ceil(GAME_REGISTRY.length / 2)` derives the boundary from the registry, so a 25th
  game re-balances the halves instead of falling off the end.
- `test.describe.configure({ mode: "parallel" })` lets the two halves take separate workers, which is
  the one exception to the suite's `fullyParallel: false` file-as-unit rule.
- A third test, **the halves partition the registry**, asserts that the slices' indexes equal
  `[...GAME_REGISTRY.keys()]` and that the registry still has `EXPECTED_GAME_COUNT` entries — the
  tripwire that stops a range quietly going unlaunched.
- Every launch is unchanged: `launchGame` from the held-return hub, the round-0 assertion, the
  three-second parental hold on the way out, and the console/page error check at the end of each
  half. Nothing was deleted, shortened or skipped to buy the time.

## P8.T2 — the worker count the split needs

`playwright.config.ts` moves from 2 to 3 workers, with the reasoning and all four measurements in the
comment beside it. The split alone could not clear the budget: at two workers the suite's floor is
its total work halved, and the wall clock measured 5.1 min — slightly worse than the 5.0 min
monolith, because the two halves now hold both workers for their first 1.8 min. Three workers put
the same work inside the ceiling.

## P8.T3 — the suite inside its budget

`pnpm test:e2e` passes with 26 browser tests and a wall clock of 4.3 min in the gate (3.8 min in the
first post-change run). README, TDD §10.5, `docs/perf-baseline.md` (live header, the current-figures
table and the prose that traces the three-step measurement history) and the config comment all state
the measured range.

## Deviations and notes

- **One new browser test.** The partition guard makes 26 browser tests where there were 24; it costs
  7 ms and is the assertion that the split is complete. The launch count is still 24.
- **No assertion changed.** This phase touches scheduling, worker count and documents only; the unit
  suite, coverage and the built artifact are byte-for-byte the same as Phase 7's.
- **CI capacity.** Three workers on a 4-vCPU GitHub runner leaves one core for the browser processes
  and the preview server; the numbers above are from a host the docs describe as roughly 3× slower
  than the reference machine, so the ceiling is not tight there.
