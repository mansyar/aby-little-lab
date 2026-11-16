# Phase 3 — The parent sees looking, not failing

- Track: 20261117-debug-probes
- Phase: 3 of 4
- Branch: fix/20261117-debug-probes
- Base / Head: e6315890 / (phase commit)
- Date: 2026-11-17
- Result: verified

## Commands

| Layer | Command | Exit | Summary |
|---|---|---|---|
| build | `pnpm build` | 0 | entry `index-Cs-5XGxm.js` 186.7 kB ≤ 200 kB |
| browser | `pnpm test:e2e` | 0 | 26 passed in 3.7 min (unchanged case count, no new spec file) |
| static | `pnpm check` | 0 | Biome clean |
| static | `pnpm typecheck` | 0 | both projects |
| unit | `pnpm test -- --run` | 0 | 153 files / 3,322 tests |
| coverage | `pnpm test:coverage` | 0 | 97.12 / 90.90 / 96.21 / 98.31 |
| build-artifact | `node scripts/validate-bundle.js`, `validate-pwa.js` | 0 | 16/16 |
| documents | `node scripts/validate-docs.js` | 0 | 5/5 |

Full-chain evidence: `.conductor/evidence/20261117-debug-probes/phase-3-gate.log` — `GATE EXIT: 0`.

## Acceptance

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| AC-3 | A Fix-It session with exploration taps stores the probes, not the wrong answers | `e2e/journeys/fix-it-machine.spec.ts` (one probe saved; the answer window holds six misses; `wrong` stays 0 on an abandoned session) | pass |
| AC-5 | The overlay shows looks for a game that has them and nothing for a game that does not | `src/__tests__/components/settings/ProgressOverlay.test.ts` (shows a game's looks beside its accuracy…) | pass |
| AC-6 | The insights ranking is identical whether or not a game has probes | `src/__tests__/game/insightsSummary.test.ts` (ranks on answers, so a game's probes never move the strongest or hardest) | pass |
| FR-9 | `insightsSummary` ignores probes | no code change was needed: it ranks on `correct`/`wrong` only. The test pins that, so a future edit that folds probes in fails here. | pass |

## Decisions

- **D5 — probes are shown in the progress overlay only** → the row's stats line
  reads `3 plays · 67% · 3 looks · Today` for a game that has looks and is
  byte-for-byte unchanged for a game that has none.
- **D7 — the end-to-end proof extends the existing journey** → one exploration
  tap added to round 0, one stored-progress assertion after leaving. No new spec
  file, so the suite's worker slots and budget are unchanged (26 cases, 3.7 min).

## Deviations

- **`spec.md` FR-10 and AC-3 were amended during this phase**, because the first
  version asked the journey to prove accuracy reads 100% — which an abandoned
  session cannot show, since cumulative answer counters only flush on completion
  (`recordGameTaps` touches the window and probes, by design). The amended
  requirement asserts what is observable and strictly stronger for this defect:
  exactly one probe, and exactly the six misses the session really made in the
  rolling window. The journey's first draft (three fixtures) caught this before
  it was committed.
- The journey revealed a second scored path: `FixItMachineScene.finishRun` records
  the stopped run through `reactWrong`. That is left as it is — pressing Go *is*
  the child's answer about the program — and the evidence records the distinction
  the track rests on: **Go is an answer, a card tap is a look.**
- `README.md`, `docs/TDD.md`, `docs/perf-baseline.md` — count restated to 3,322.

## Notes

- The e2e assertion counts false entries in `recent` rather than comparing the
  whole array: `WINDOW_SIZE` is 10 and the session makes 13 taps, so the window
  is truncated from the front. If the look were scored, the false count would be
  seven and one more correct tap would fall off the front.
- NFR-4 holds: the suite kept 26 cases and finished in 3.7 min, inside the five
  minute budget with the earlier two-worker measurement unchanged.
