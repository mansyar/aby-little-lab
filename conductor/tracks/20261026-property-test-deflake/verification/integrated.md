# Integrated Verification — 20261026-property-test-deflake

- **Track:** `20261026-property-test-deflake` (chore, high)
- **Date:** 2026-10-26
- **Branch:** `chore/20261026-property-test-deflake`
- **Base:** `c5bb9eca` (master) — **Head:** `c26eecf3`
- **Result:** ✅ verified

## Scope

Run once after all phases, on the integrated branch, against the full
configured verification strategy (the phase Verification command IS the full
`verify_phase` chain for this track).

## Command

```
pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js
```

**Chain exit code: 0** — run twice by the primary (once on the Phase 1
checkpoint tree, once on the final integrated tree).

## Results

| Layer | Command | Exit | Summary |
|---|---|---|---|
| Static | `pnpm check` | 0 | 258 files; 1 pre-existing warning (`musicalMemoryScene.test.ts:296` noNonNullAssertion) + 1 pre-existing biome schema info |
| Static | `pnpm typecheck` | 0 | clean |
| Unit | `pnpm test -- --run` | 0 | 125 files / 2,729 tests passed |
| Unit | `pnpm test:coverage` | 0 | 97.8 / 91.9 / 96.77 / 98.74 — above gates (95/85/88/90) |
| Build | `pnpm build` | 0 | 54 precache entries (1727.85 KiB) |
| Build | `node scripts/validate-bundle.js` | 0 | PASS |
| Build | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed |
| Docs | `node scripts/validate-docs.js` | 0 | 6 passed, 0 failed (includes the count-drift guard, confirming unchanged counts) |

## Track-wide acceptance criteria

| AC | Status | Evidence |
|---|---|---|
| AC-1 (full chain green) | ✅ | chain exit 0 on the final tree |
| AC-2 (120,000 ms on exactly the five victims) | ✅ | grep `timeout: 120_000` → 7 matches after Phase R1 (F1): the five victims (addItUp:172, count:174, numberOrder:136, takeAway:173, firstSounds:252) plus the decodeLogic:322 and wordLogic:254 sweeps budgeted per F1 |
| AC-3 (measured audit table) | ✅ | phase-1.md audit table, real timed runs 2026-10-26 |
| AC-4 (vite.config.ts untouched + TDD note + docs validator) | ✅ | `git diff -- vite.config.ts` empty; TDD §10.1 extended; docs 6/0 |
| AC-5 (counts unchanged) | ✅ | 125 files / 2,729 tests in both runs |

## Notes

- Phase R1 (review fixes): `decodeLogic.test.ts:322` and `wordLogic.test.ts:254` gained `{ timeout: 120_000 }` per F1, so the AC-2 grep proof counts 7 matches; the TDD §10.1 note's timeout inventory was corrected per F2.
- The five budgeted suites measured 2.63-3.91 s per suite post-change (verbose
  supplementary run) — ≥ 30× headroom inside the 120 s budgets; no flake
  recurrence.
- No dependency changes; no production `src/**` change (test files + TDD doc
  only).
- Pre-existing diagnostics untouched.
