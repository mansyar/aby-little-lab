# Phase 5 — Review Fixes (R1)

- Track: 20261117-debug-probes
- Phase: 5 of 5
- Branch: fix/20261117-debug-probes
- Base / Head: e6315890 / (phase commit)
- Date: 2026-11-17
- Result: verified

## Commands

| Layer | Command | Exit | Summary |
|---|---|---|---|
| static | `pnpm check` | 0 | Biome clean |
| static | `pnpm typecheck` | 0 | both projects |
| unit | `pnpm test -- --run` | 0 | 153 files / 3,322 tests |
| coverage | `pnpm test:coverage` | 0 | 97.12 / 90.90 / 96.21 / 98.31 |
| build-artifact | `pnpm build && node scripts/validate-bundle.js` | 0 | entry `index-BIq9mY8m.js` 186.7 kB ≤ 200 kB |
| build-artifact | `node scripts/validate-pwa.js` | 0 | 16/16 |
| documents | `node scripts/validate-docs.js` | 0 | 5/5 |

Full-chain evidence: `.conductor/evidence/20261117-debug-probes/phase-5-gate.log` — `GATE EXIT: 0`.

## Findings closed

| ID | Sev | Fix | Evidence |
|---|---|---|---|
| R1-1 | Low | `probesText` moved from a closure built inside the per-row drawing loop to a module function above the class, beside the other row helpers, with its own doc comment | `src/components/settings/ProgressOverlay.ts:94`; the existing overlay test still asserts `3 looks` beside `67%`, and the singular/plural branch is unchanged |

R1-2 stays accepted as debt: the archived Fix-It spec keeps its original rule,
because archives are frozen; the live rule is the TDD paragraph written in Phase 4.

## Acceptance

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| R1-1 | The label logic is not rebuilt per row | the module function's position and call site | pass |
| FR-8 | The rendered line is unchanged | `ProgressOverlay.test.ts` (shows a game's looks beside its accuracy) | pass |
| AC-7 | The full gate exits 0 | the table above | pass |

## Deviations

None. `src/components/settings/ProgressOverlay.ts` is exactly the file the phase
declared.

## Notes

- The built entry hash changed (`index-Cs-5XGxm.js` → `index-BIq9mY8m.js`) because
  the helper moved out of the loop body; the size is identical at 186.7 kB, which
  is what the bundle validator measures.
