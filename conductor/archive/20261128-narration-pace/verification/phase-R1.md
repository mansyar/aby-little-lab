# Phase R1 Verification — Review Fixes (round 1 of 2)

- Track: `20261128-narration-pace` — Add a parent control for narration pace
- Phase: `R1` — Review Fixes (F1, F2 only)
- Date: 2026-11-28
- Branch: `feat/20261128-narration-pace`
- Base commit: `505fc405`
- Head commit: `a2eec711`
- Result: **FAILED** (code checks green; document validator fails on suite-count drift outside this phase's Touches; two validators permission-denied)

## Commands

The exact chained verification command from the brief was denied by shell permissions (`Permission denied: shell`) because `&&` chains are not permitted for this phase agent. Each named command was therefore run individually, in the brief's order.

| # | Command | Exit | Result |
|---|---------|------|--------|
| 1 | `pnpm check` | 0 | Biome: 393 files checked, no fixes applied |
| 2 | `pnpm typecheck` | 0 | App + e2e TypeScript clean |
| 3 | `pnpm test -- --run` | 0 | 165 files / 3559 tests passed |
| 4 | `pnpm test:coverage` | 0 | 165 files / 3559 tests passed; Stmts 96.91%, Branches 90.23%, Funcs 96.22%, Lines 98.06% (all above gates) |
| 5 | `pnpm build` | 0 | Vite production build + PWA service worker generated |
| 6 | `node scripts/validate-bundle.js` | 0 | Phaser vendor chunk present; shell entry 190.3 kB (<= 200 kB) |
| 7 | `node scripts/validate-module-size.js` | denied | `Permission denied: shell` — not runnable by this phase agent |
| 8 | `node scripts/validate-textures.js` | denied | `Permission denied: shell` — not runnable by this phase agent |
| 9 | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed |
| 10 | `node scripts/validate-docs.js` | 1 | 4 passed, 1 failed (8 count mismatches) — see Notes |

Red proof (test-first): before the setter fix, `pnpm test -- --run` failed with `AssertionError: expected 'turbo' to be 'gentle'` in the new test (165 files, 1 failed / 3558 passed). After the fix, the same command passed all 3559 tests.

## Findings

| ID | Finding | Fix | Test |
|----|---------|-----|------|
| F1 | `mergeProfiles` comment called pace a "device setting", contradicting the per-profile model and the replace path. | Reworded at `src/utils/backupMerge.ts:150` to the actual policy: on merge pace stays with this device (local wins, normalised); a replace installs the incoming save, so a fresh-device restore reproduces the backed-up pace. Comment-only; no behavior change. | Existing `mergeProfiles` pace tests plus the full suite (command #3) cover behavior; no behavior changed. |
| F2 | `setActiveProfileNarrationPace` stored the raw argument and passed it to `setNarrationPace`, so a hand-edited/unknown value could be persisted verbatim and diverge from speech state. | `src/utils/storageProfiles.ts:119`: `const next = normalizeNarrationPace(pace)`; store `next` in the active profile and pass `next` to `setNarrationPace`. One normalisation at the boundary; no other changes. | Added `SettingsPanel.test.ts` case `normalises an unknown pace to Gentle before storing it`: calls `setActiveProfileNarrationPace("turbo" as NarrationPace)` and asserts `getActiveProfile().narrationPace === "gentle"`. Red before the fix, green after. |

## Commits

- `178835a3` — `fix(narration-pace): reword merge pace policy comment` (R1.T1)
- `a2eec711` — `fix(narration-pace): normalize pace at the setter boundary` (R1.T2 + test)

## Evidence paths

- `conductor/tracks/20261128-narration-pace/verification/phase-R1.md` (this report; left uncommitted for the primary state commit)
- `src/utils/backupMerge.ts` (comment)
- `src/utils/storageProfiles.ts` (setter)
- `src/__tests__/components/SettingsPanel.test.ts` (F2 regression test)

## Deviations

1. The chained verification command was denied; its ten constituent commands were run individually instead. No command was substituted or skipped.
2. `node scripts/validate-module-size.js` and `node scripts/validate-textures.js` were denied by shell permissions and could not be run by this phase agent.
3. The evidence file was left uncommitted, per the brief's allowance, so that the recorded head commit (`a2eec711`) matches the actual code head.

## Notes for primary agent

- **validate-docs.js failure is suite-count drift, not a code defect.** The brief requires adding one unit test, which raises the suite truth from 3,558 to 3,559 tests. The validator says "refresh the document to the current suite truth; do not change the code". The affected doc lines are outside this phase's Touches and were deliberately not edited:
  - `README.md:49`
  - `docs/TDD.md:1344`, `docs/TDD.md:1350`
  - `docs/perf-baseline.md:3`, `:583`, `:922`, `:955`, `:1016`
  Each currently reads "3,558 tests" and must become "3,559 tests" for the document gate to pass.
- Please run `node scripts/validate-module-size.js` and `node scripts/validate-textures.js` (permission-denied for this subagent) and record their output in the state commit.
- No product docs, Conductor state files, or files outside Touches were modified.

## Primary verification

Primary validated both fixes against the diff (`505fc405..fb894104`, 3 files, +13/-4): F1 comment now states the actual merge/replace policy; F2 normalizes once and stores/passes `next` with the `normalizeNarrationPace` import already present. Primary ran the exact chained gate on the final tree (squash `fb894104` + numeric-only doc refresh to 165 files / 3,559 tests): exit 0 throughout — check (393 clean), typecheck, 165 files / 3,559 tests, coverage stmts 96.9 / branches 90.2 / funcs 96.22 / lines 98.06 (gates 90/85/88/95), build (501 modules), bundle PASS (entry 190.3 kB), module-size PASS (3 warn-only), textures PASS (76.42/321.00/0.238, unchanged), PWA 16/0, docs 5/0. Both findings resolved; no follow-up round needed.
