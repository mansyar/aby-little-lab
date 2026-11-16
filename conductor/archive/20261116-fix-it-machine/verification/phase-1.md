# Phase 1 — The workshop's rules, as pure logic

- Track: 20261116-fix-it-machine
- Branch: feat/20261116-fix-it-machine
- Base / Head: 56779675 / b80ea550
- Date: 2026-11-16
- Result: verified

## Commands

| Layer | Command | Exit | Summary |
|---|---|---|---|
| static | `pnpm check` | 0 | 332 files, one pre-existing `useImportType` warning on `RobotPathScene.ts:1` |
| static | `pnpm typecheck` | 0 | clean |
| unit | `pnpm test -- --run` | 0 | 151 files / 3,270 tests (3,255 before this phase; 15 added here) |
| coverage | `pnpm test:coverage` | 0 | 97.24 % statements / 91.64 % branches / 96.33 % functions / 98.32 % lines |
| build-artifact | `pnpm build && validate-bundle && validate-pwa` | 0 | entry `index-9iYt2XVh.js` 182.5 kB ≤ 200 kB, 49 chunks |
| documents | `node scripts/validate-docs.js` | 0 | 5 passed, 0 failed |

Full log: `.conductor/evidence/20261116-fix-it-machine/phase-1-gate.log` — **GATE EXIT: 0**.

## Acceptance

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| FR-2 | Six tools in three families of two, six toys | `src/game/fixItMachineLogic.ts` `ACTION_ICONS`, `ACTIONS_BY_FAMILY`, `TOYS`; `fixItMachineLogic.test.ts` "offers six tools in three families of two", "serves six rounds over six toys" | pass |
| FR-3 | Exactly one wrong card, a substitution, never first, never a duplicate tool | authored `ROUND_SPECS` + "puts the wrong tool on the wrong card and nothing else out of place", "keeps every correct program distinct and every bug card present but not first" | pass |
| FR-4 | The wrong tool follows its band's similarity rule | "draws each band's wrong tool by that band's rule" asserts foreign family, family-in-use partner, and sibling-of-the-right-tool respectively | pass |
| FR-8 | Diagnosis names exactly one card | `isWrongCard` + "names exactly the one card that is wrong" (including out-of-range indexes) | pass |
| FR-9 | Repair replaces in place and is safe | `applyRepair` + "repairs in place and solves only with the right tool", "does not call a short or padded tape solved" | pass |
| FR-11 | Hint levels at 2, 4 and 6 | `hintLevelFor` + "escalates at two, four and six wrong taps and nowhere else" (`[0,0,1,1,2,2,3,3,3]`) | pass |
| FR-12 | Ladder 3, 3, 4, 4, 5, 5; band order; seeded tray; seeded playthrough | "grows the tape 3, 3, 4, 4, 5, 5 and hardens the band in that order", "deals the same round for the same seed and a different tray for another", "deals a whole playthrough in ladder order, reproducibly" | pass |
| FR-17 | Governed documents state the current suite truth | `README.md:49`, `docs/TDD.md` §10.2/§10.3, `docs/perf-baseline.md` header and both tables restated to 151 files / 3,270 tests; `validate-docs` 5/5 | pass |

## Evidence

- 15 unit tests in `src/__tests__/game/fixItMachineLogic.test.ts`, all passing.
- `.conductor/evidence/20261116-fix-it-machine/phase-1-gate.log` — the phase's single full gate run.

## Deviations

- **The governed count figures were refreshed after the gate run**, not during it: the first gate run measured 151 files / 3,270 tests, and the second (after formatting) reported coverage 97.24 / 91.64 / 96.33 / 98.32, so the three documents now quote that second run. `node scripts/validate-docs.js` was re-run on the final text: 5/5. No source file changed after the exit-0 run.
- **The first gate run failed on formatting only** (Biome's formatter wanted a different line break in two constant declarations); `biome check --write` fixed it and the gate was re-run, which is the run recorded above.

## Notes

- The round data is authored rather than generated from an abstract rule: each `ROUND_SPECS` entry names its wrong tool, and the tests enforce the band relationship over that data. That guarantees every round is a plausible job with exactly one silly result, and it means the seeded generator only has to deal the repair tray — there is no failure path where generation cannot produce a legal round.
- The tray never offers the tool that was just proved wrong, so every pick is a real choice.
- `hintLevelFor` is a pure step function over the wrong-tap count; the scene will own the reset rules.
