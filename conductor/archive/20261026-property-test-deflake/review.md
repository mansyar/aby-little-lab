# Track Review — 20261026-property-test-deflake

- **Track:** `20261026-property-test-deflake`
- **Type:** chore
- **Branch:** `chore/20261026-property-test-deflake`
- **Range:** `c5bb9eca..HEAD` (excluding `conductor/`: 5 test files + `docs/TDD.md`)
- **Date:** 2026-10-26
- **Verdict:** PASS

## Summary

The track does what it claims for its five victims: exactly five
`{ timeout: 120_000 }` options land on the actual sweep tests that timed out
under load, the options-object syntax typechecks clean against the installed
toolchain (with in-repo precedent), nothing is renamed, removed, or weakened,
sample counts stay 200, and the measured audit of all 13 `VARIETY_SAMPLES =
200` suites is real and dated. The global 30 s policy is byte-identical. The
one substantive gap: the "keeps every round valid and uniquely targeted at
every shift" sweeps in `decodeLogic.test.ts` and `wordLogic.test.ts` remain
on the 30 s default even though the track's own motivating flake record names
`decodeLogic` and the evidence acknowledges a once-observed 46 s run of that
test name — the flake this track exists to kill can still recur there. Two
Low documentation-accuracy findings round out the list. All three findings
are objective, in scope, and mechanically fixable; under strict mode they go
into a Review Fixes phase.

## Verification

| Layer | Command | Result | Evidence |
|---|---|---|---|
| Static | `pnpm check` | pass (1 pre-existing warning + 1 pre-existing info) | primary, twice |
| Static | `pnpm typecheck` | pass | primary, twice |
| Unit | `pnpm test -- --run` | pass — 125 files / 2,729 tests | primary, twice |
| Unit | `pnpm test:coverage` | pass — 97.8/91.9/96.77/98.74 | primary, twice |
| Build | `pnpm build` | pass — 54 precache entries | primary |
| Build | `node scripts/validate-bundle.js` | pass | primary |
| Build | `node scripts/validate-pwa.js` | pass — 16/0 | primary |
| Docs | `node scripts/validate-docs.js` | pass — 6/0 incl. count-drift guard | primary |
| Static | `git diff c5bb9eca..HEAD -- vite.config.ts` | pass — empty | reviewer |

## Requirements coverage

| Req | Implementing task | Verified by | Status |
|---|---|---|---|
| FR-1 | P1.T2.1 | grep: exactly 5 `120_000` matches on victim sweeps; typecheck clean | covered |
| FR-2 | P1.T1.1, P1.T2.1 | audit table (13 suites, timed); worst isolated 4.84 s | covered |
| FR-3 | P1.T1.2 | clean typecheck + in-repo `{ timeout: 20_000 }` precedent | covered |
| FR-4 | P1.T3.1 | TDD diff; docs validator 6/0 | covered (F2 wording) |
| FR-5 | P1.T2.1 | diff adds options only; samples 200 in all 13 suites; counts unchanged | covered |
| NFR-1 | P1 | diff = 5 test files + TDD only | covered |
| NFR-2 | P2.T1.1 | integrated.md, chain exit 0 twice | covered |
| NFR-3 | P1.T1.1 | dated per-test audit table | covered (F3 provenance) |
| AC-1 | P2.T1.1 | integrated.md commands table | covered |
| AC-2 | P1.T2.1 | grep proof, exactly 5 justified matches | covered |
| AC-3 | P1.T1.1 | audit table | covered |
| AC-4 | P1.T3.1, P2.T2.1 | vite.config.ts empty diff; docs 6/0 | covered |
| AC-5 | P2.T2.1 | 125 / 2,729 unchanged; guard green | covered |

## Findings

### Medium

- **F1** — `src/__tests__/game/decodeLogic.test.ts:322`, `src/__tests__/game/wordLogic.test.ts:254` — the "keeps every round valid and uniquely targeted at every shift" sweeps remain at the 30 s global timeout. The motivating flake record (`conductor/archive/20261026-docs-truth-pass/verification/phase-1.md:93`) lists `decodeLogic` among files that lost tests to 30 s timeouts under load, and `verification/phase-1.md:73` acknowledges a once-observed 46 s run of this test name. At the observed 13-21× load multiplier over 1.98-2.21 s isolated, these tests can still exceed 30 s. **Fix:** add `{ timeout: 120_000 }` to both tests (one line each); update the AC-2 grep-proof counts in the evidence (5 → 7 matches) and the TDD note's test list accordingly. **Requirement:** FR-2/G2 protective intent.

### Low

- **F2** — `docs/TDD.md:1015` — the new sentence "no other test carries a per-test timeout beyond the pre-existing 20 s pair-pool guards" is imprecise: `moreLessLogic.test.ts:141-143` and `:159` carry pre-existing 20 s per-test timeouts on sweep tests that are not pair-pool guards. **Fix:** reword to name the pre-existing 20 s guards accurately. **Requirement:** FR-4.
- **F3** — `conductor/tracks/20261026-property-test-deflake/verification/phase-1.md:72` — the provenance sentence overstates: the archives for `20261025-shared-random-helpers` and `20261026-scene-rng-seam` contain no timeout records; the only actual record is `20261026-docs-truth-pass/verification/phase-1.md:93,119`, which lists seven files (including `decodeLogic` and `moreLessLogic`, not `wordLogic`) at 34-66 s. **Fix:** cite the one real record, reconcile the five-victim framing with the seven-file record, correct the multiplier range. **Requirement:** NFR-3 (adjacent).

## Overrides

None.

## Plan compliance

- Phase 1 verified / checkpoint `bf96b31c`; Phase 2 verified / checkpoint `6e8a9b9b` (verification-only, zero commits by contract); integrated verification green twice.
- No deviations recorded; diff exactly matches Touches; no scope creep.

## Out of scope

- Pre-existing 20 s per-test budgets in `moreLessLogic`/`addItUp`/`count`/`takeAway` — `moreLessLogic`'s 20 s budgets sit below the 30 s global default and one 20 s timeout appears in the historical record; pre-existing, not worsened by this diff. Worth a future track.
- Pre-existing `musicalMemoryScene.test.ts:296` warning and `biome.json` schema info.

## Debt

None.

## Doc sync

`none` — the fix rounds touched only test timeouts, the TDD §10.1 note, and evidence provenance; no documented contract moved.

## History

| Round | Verdict | Critical | High | Medium | Low | Fixed |
|---|---|---|---|---|---|---|
| 1 | PASS WITH FINDINGS | 0 | 0 | 1 | 2 | 0 |
| 2 | PASS | 0 | 0 | 0 | 1 | 3 |

### Round 2

Delta re-review of `902ac732..84c0699d` (excluding conductor/): verdict PASS WITH FINDINGS with F1/F2/F3 all verified resolved — the reviewer independently reproduced the 7-match grep proof, spot-checked the seven `timeout: 20_000` guards behind the corrected F2 sentence (including `moreLessLogic.test.ts:142`/`:159`, confirming they are sweep guards, not pair-pool guards), read the archived docs-truth-pass flake record to confirm the F3 provenance (seven files including decodeLogic and moreLessLogic, not wordLogic; multiplier 66/1.98 ≈ 33×), and ran the two budgeted suites in isolation (73/73 passed; sweeps 693 ms / 1548 ms). Weakening audit clean: the delta's only removal is decodeLogic's redundant trailing `30000` on the test that gained the options object.

One new Low: **F4** — `phase-R1.md` cited the pre-squash task-commit hashes (`e9995163`/`68bb3aa5`/`10eeaf42`) after acceptance squashed them into `84c0699d`, leaving orphaned references. Fixed immediately under strict mode: the header now names `84c0699d` as the checkpoint with a squash note, and the Primary verification section records the squash equivalence (`git diff 10eeaf42 84c0699d` touches only conductor evidence/plan files).
