# Phase 2 — Fix-It stops scoring exploration

- Track: 20261117-debug-probes
- Phase: 2 of 4
- Branch: fix/20261117-debug-probes
- Base / Head: e6315890 / (phase commit)
- Date: 2026-11-17
- Result: verified

## Commands

| Layer | Command | Exit | Summary |
|---|---|---|---|
| static | `pnpm check` | 0 | Biome clean over 337 files |
| static | `pnpm typecheck` | 0 | both projects |
| unit | `pnpm test -- --run` | 0 | 153 files / 3,320 tests |
| coverage | `pnpm test:coverage` | 0 | 97.12 / 90.96 / 96.21 / 98.31 |
| build-artifact | `pnpm build && node scripts/validate-bundle.js` | 0 | entry `index-CZOWG3Vq.js` 186.6 kB ≤ 200 kB |
| build-artifact | `node scripts/validate-pwa.js` | 0 | 16/16 |
| documents | `node scripts/validate-docs.js` | 0 | 5/5 |

Full-chain evidence: `.conductor/evidence/20261117-debug-probes/phase-2-gate.log` — `GATE EXIT: 0`.

## Acceptance

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| AC-3 | A Fix-It session with exploration taps stores looks, not wrong answers | `src/__tests__/scenes/fixItMachineScene.test.ts` (bounces a card … records a look, not a miss; records one result for every tap…) | pass |
| AC-4 | A missed card tap still raises the hint ladder | `src/__tests__/scenes/fixItMachineScene.test.ts` (hints at two, four and six missed taps) — unchanged and still green | pass |
| FR-5 | Probes flush on completion and on the abandoned path | `src/__tests__/scenes/gameSceneBase.test.ts` (flushes probes as their own count; flushes an abandoned session's probes with its taps) | pass |
| FR-6 | The tray keeps its scoring | `src/__tests__/scenes/fixItMachineScene.test.ts` (still scores a distractor tool as a wrong answer) | pass |

## Decisions

- **D2 — only a missed card tap is a probe** → taken. `tapCard` now calls
  `noteMissedTap()` + `reactProbe()`; `tapCandidate` keeps `reactWrong()`, so the
  tray is still where answering happens.
- **D4 — probes advance the hint ladder** → taken. The ladder reads the same
  `wrongTaps` counter, fed by every miss whether scored or not; the existing
  two/four/six test is unchanged and still passes.

## P2.T4 — audit of every other scene's tap scoring

Every other scene's wrong tap is an answer to a question the game asked, so none
of them changed. Call sites, read at `e6315890`:

| Scene | Wrong path | Why it stays a wrong answer |
|---|---|---|
| `ChoiceRoundScene.ts:274` | `reactWrong(...)` | the child picks one of two or three options; a miss is a wrong pick |
| `BigSmallScene.ts:233` | `reactWrong()` | same shape: a comparison choice |
| `ShapeSorterScene.ts:229` | `reactWrong()` | a shape placed on the wrong hole |
| `ShadowMatchScene.ts:223` | `reactWrong()` | a pairing choice |
| `MemoryMatchScene.ts:294` | `reactWrong([...])` | a pair the child turned over |
| `MusicalMemoryScene.ts:257` | `reactWrong()` | a pad the child chose |
| `WordBuilderScene.ts:230` | `reactWrong([...])` | a letter placed in the wrong slot |
| `AnimalTraceScene.ts:337` | `recordCorrect()` only | tracing records only correct strokes; it has no wrong path |
| `RobotPathScene.ts` | no recording call | authoring only: it never presented a right/wrong question |

`FixItMachineScene` was the only scene that asked the child to *find* which of
several existing objects is the answer, which is why it was the only one that
needed the probe path. A future debugging game calls `reactProbe()` and inherits
the same rule.

## Deviations

- `src/__tests__/scenes/choiceRoundScene.test.ts` — two expectations updated from
  three arguments to four (`0` probes). This follows the D6 signature change; no
  assertion was loosened.
- `src/__tests__/scenes/fixItMachineScene.test.ts` — two tests asserted the bug
  this track fixes (a missed card counted as `sessionWrong`). They were rewritten
  to assert the probe instead, and a new test pins that a distractor in the tray
  is still a wrong answer, so the change cannot silently wash out the scoring
  that should remain.
- `README.md`, `docs/TDD.md`, `docs/perf-baseline.md` — suite count restated to
  3,320, as the documents validator requires in the same phase.

## Notes

- `GameSceneBase.reactWrong` and the new `reactProbe` share one private
  `reactMiss(record, …)`, so the tone, the nod and the reduced-motion wiggle are
  identical for both; only the record differs (NFR-3).
- Naming: `noteWrongTap()` became `noteMissedTap()`, because the counter it feeds
  now counts misses of either kind.
