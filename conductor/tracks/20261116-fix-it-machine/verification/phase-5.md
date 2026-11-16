# Phase 5 — The bridge proves it in a browser: verification

- **Track:** `20261116-fix-it-machine`
- **Phase:** 5 of 6 — The bridge proves it in a browser (D4, D11)
- **Branch:** `feat/20261116-fix-it-machine`
- **Evidence log:** `.conductor/evidence/20261116-fix-it-machine/phase-5-gate.log` (gate exit 0)
- **Journey log (first run):** `.conductor/evidence/20261116-fix-it-machine/phase-5-e2e.log` (24 passed, exit 0)

## Verification command

```
pnpm test:e2e && pnpm check && pnpm typecheck && pnpm test -- --run &&
pnpm test:coverage && pnpm build && node scripts/validate-bundle.js &&
node scripts/validate-pwa.js && node scripts/validate-docs.js
```

**Exit status: 0.**

| Step | Result |
| --- | --- |
| `pnpm test:e2e` | **24 passed** in 5.0 min on two workers; `launch-all` alone 3.3 min |
| `pnpm check` | clean |
| `pnpm typecheck` | no errors (`tsc --noEmit` and the e2e project) |
| `pnpm test -- --run` | 153 files / 3,300 tests |
| `pnpm test:coverage` | 97.07 / 90.73 / 96.19 / 98.24 |
| `pnpm build` + `validate-bundle.js` | `index-BiqtO09P.js` 186.4 kB ≤ 200 kB, 51 chunks |
| `validate-pwa.js` | 16/16, 63 precache entries (1826.19 KiB) |
| `validate-docs.js` | 5/5 |

## P5.T1 — the journey

`e2e/journeys/fix-it-machine.spec.ts` drives the game through the published bridge only, launching
by registry index 23 and playing three rounds. Each round it:

- reads the tape, the job's program and the wrong card from `e2eFixItMachine()`, and asserts the tape
  is the program with **exactly one** substitution, never on card 0 (`bugIndex >= 1`);
- taps Go and waits on `failedRuns`, then asserts the round did not advance, no dot filled, every
  card stayed on the tape, and no tray opened — the stopped run is the diagnosis, not a penalty;
- taps the wrong card and polls `trayOpen`, then asserts three tools are offered and the job's tool is
  one of them;
- taps a tool that is **not** the answer first and asserts `wrongTaps` went up while the tape and the
  open tray stayed exactly as they were;
- taps the right tool and polls until the tray is shut and the tape matches the program card for card,
  asserting the repair neither advanced the round nor counted as a miss;
- taps Go again and polls the progress dots to `round + 1`.

Every tap uses the geometry the scene publishes (`cards[i]`, `tray[i]`, `go`), never a copied
coordinate, so a control that no longer covers its published centre fails here. The journey leaves
through the back control and asserts no page or console errors.

Fixture support lives in `e2e/fixtures/game.ts`: `fixItMachineState()` and
`waitForFixItMachineRound()`, which polls bridge state rather than sleeping on the between-round
delay.

## P5.T2 — the roster literals

`EXPECTED_GAME_COUNT` 23 → 24 in `launch-all.spec.ts` (plus its comment and its failure message),
`hub-groups.spec.ts`'s "draws all 24 games", and `insights.spec.ts`'s "2 of 24 games". No step was
removed: `launch-all` still loops the registry itself, so the 24th launch is driven by the literal
that fails first when the roster grows.

## P5.T3 — the suite green

24 journeys across 19 spec files, 24 launches inside `launch-all`'s own 300 s timeout (measured
3.3 min), whole suite green in 5.0 min on two workers. That wall clock sits **on** NFR-2's 5 min
ceiling rather than inside it; the critical path is `launch-all`'s 24 sequential launches, and
`docs/perf-baseline.md` records the number and that consequence rather than restating the budget.

## Notes

- The first run of the new journey alone passed in 30.9 s (`phase-5-e2e.log`), before the full suite
  ran; the full-suite numbers above come from the gate run.
- No unit test file was added or removed in this phase: the suite stands at 153 files / 3,300 tests,
  and only the browser layer and its fixtures changed.
