# Phase R1 Verification — Review Fixes (F1, F2, F3)

- **Track:** `20261026-property-test-deflake` (chore, high)
- **Phase:** R1
- **Date:** 2026-10-26
- **Branch:** `chore/20261026-property-test-deflake`
- **Phase base:** `902ac732` - **Phase head:** `84c0699d` (the three task commits `e9995163`, `68bb3aa5`, `10eeaf42` were squashed into `84c0699d` at acceptance; content-equivalent — see Primary verification)
- **Result:** ✅ verified (all eight gate commands exit 0 on the final run)

## Findings resolution

| Finding | Resolution | Status |
|---|---|---|
| F1 (Medium) — decodeLogic/wordLogic "keeps every round valid and uniquely targeted at every shift" sweeps left on the 30 s default | `{ timeout: 120_000 }` added to both tests (`decodeLogic.test.ts:322`, `wordLogic.test.ts:254`); AC-2 grep-proof counts reconciled to 7 matches in `phase-1.md` and `integrated.md`; the TDD §10.1 test list now names seven sweeps | ✅ resolved |
| F2 (Low) — TDD §10.1 "no other test carries a per-test timeout beyond the pre-existing 20 s pair-pool guards" imprecise | Sentence reworded: the pre-existing 20 s guards are the five pair-pool guards in `addItUpLogic`/`countLogic`/`takeAwayLogic` **plus** the two 20 s sweep guards in `moreLessLogic.test.ts:141-143`/`:159` (sweep guards, not pair-pool guards); the seven 120 s budgets are named separately | ✅ resolved |
| F3 (Low) — phase-1.md provenance sentence overstated ("three tracks' gate-run flake records", "~2–17×") | Provenance corrected: the sole actual flake record is `conductor/archive/20261026-docs-truth-pass/verification/phase-1.md:93,119` (the `20261025-shared-random-helpers` and `20261026-scene-rng-seam` archives contain no timeout records); its seven-file list (`addItUpLogic`, `countLogic`, `decodeLogic`, `firstSoundsLogic`, `moreLessLogic`, `numberOrderLogic`, `takeAwayLogic` — `decodeLogic` and `moreLessLogic`, not `wordLogic`) is reconciled against the five-victim framing; multiplier corrected to up to ~33× over the 1.98 s isolated victim (66 s / 1.98 s) | ✅ resolved |

## Commands table

| Layer | Command | Exit code | Summary |
|---|---|---|---|
| Lint/format | `pnpm check` | 0 | 258 files; 1 pre-existing warning (`musicalMemoryScene.test.ts:296` non-null assertion) + 1 pre-existing biome schema-version info; no errors |
| Types | `pnpm typecheck` | 0 | `tsc --noEmit` clean |
| Tests | `pnpm test -- --run` | 0 | **125 files / 2,729 tests passed** (26.22 s) — counts unchanged |
| Coverage | `pnpm test:coverage` | 0 | statements 97.82 (5493/5615), branches 91.96 (1488/1618), functions 96.77 (1141/1179), lines 98.74 (5116/5181) — all above gates (95/85/88/90) |
| Build | `pnpm build` | 0 | vite build ok; PWA precache 54 entries (1727.85 KiB) |
| Bundle | `node scripts/validate-bundle.js` | 0 | PASS: phaser chunk 1342.6 kB + shell 138.7 kB ≤ 200 kB |
| PWA | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed (42 chunks, 42 precached) |
| Docs | `node scripts/validate-docs.js` | 0 | 6 passed, 0 failed (TDD-truth + count-drift guards green) |

## Verification history (fix attempts)

The chain was re-run after each fix; per the phase rules no check exceeded two
fix attempts:

1. Run 1 — `pnpm check` failed (exit 1): biome formatter rejected the first
   edit's inline `it(name, () => {...}, { timeout: 120_000 })` line shape.
   Fix attempt 1 applied the formatter's printed output.
2. Run 2 — `pnpm typecheck` failed (exit 1, TS2769 in both files): the fix had
   left the fn before the options object; the vitest 4 options-object overload
   is `it(name, options, fn)`. Fix attempt 2 moved `{ timeout: 120_000 }` to
   the second argument.
3. Run 3 — `pnpm check` failed again (exit 1): with the corrected argument
   order biome wants the signature on one line. Fix attempt 2 (for `pnpm
   check`) applied biome's exact printed output.
4. Run 4 — **all eight commands exit 0** (the table above).

## Grep proof (AC-2, verbatim)

`timeout: 120_000` over `src/__tests__/game` → **exactly 7 matches**:

| File | Line | Test |
|---|---|---|
| `src/__tests__/game/addItUpLogic.test.ts` | 172 | "keeps the shifted band ladder and validity across many samples" |
| `src/__tests__/game/countLogic.test.ts` | 174 | "keeps the shifted band ladder across many samples" |
| `src/__tests__/game/firstSoundsLogic.test.ts` | 252 | "keeps every round valid at every shift" |
| `src/__tests__/game/numberOrderLogic.test.ts` | 136 | "keeps the shifted band ladder across many samples" |
| `src/__tests__/game/takeAwayLogic.test.ts` | 173 | "keeps the shifted band ladder and validity across many samples" |
| `src/__tests__/game/decodeLogic.test.ts` | 322 | "keeps every round valid and uniquely targeted at every shift" |
| `src/__tests__/game/wordLogic.test.ts` | 254 | "keeps every round valid and uniquely targeted at every shift" |

7 = the five Phase-1 victims + the two newly budgeted sweeps (decode, word).
No other `120_000` occurrence exists.

## TDD §10.1 sentence (F2) — before/after

**Before:**

> Per-test exception: the five heavy sweep tests — "keeps the shifted band ladder and validity across many samples" in `addItUpLogic` and `takeAwayLogic`, "keeps the shifted band ladder across many samples" in `countLogic` and `numberOrderLogic`, and "keeps every round valid at every shift" in `firstSoundsLogic` — carry an explicit `{ timeout: 120_000 }` because their 200-sample × 3-shift property loops exceed the 30 s budget under host load (worst observed 66 s on the gate runs) although they stay under 5 s in isolation (audited 2026-10-26, worst 4.84 s). The global 30 s default is unchanged, and no other test carries a per-test timeout beyond the pre-existing 20 s pair-pool guards.

**After:**

> Per-test exception: the seven heavy sweep tests — "keeps the shifted band ladder and validity across many samples" in `addItUpLogic` and `takeAwayLogic`, "keeps the shifted band ladder across many samples" in `countLogic` and `numberOrderLogic`, "keeps every round valid at every shift" in `firstSoundsLogic`, and "keeps every round valid and uniquely targeted at every shift" in `decodeLogic` and `wordLogic` — carry an explicit `{ timeout: 120_000 }` because their 200-sample × 3-shift property loops exceed the 30 s budget under host load (worst observed 66 s on the gate runs) although they stay under 5 s in isolation (audited 2026-10-26, worst 4.84 s). The global 30 s default is unchanged, and no other test carries a per-test timeout beyond the pre-existing 20 s guards: the five pair-pool guards in `addItUpLogic`, `countLogic` and `takeAwayLogic`, plus the two 20 s sweep guards in `moreLessLogic.test.ts:141-143` and `:159` — sweep guards, not pair-pool guards.

## Provenance sentence (F3) — before/after (`phase-1.md` audit conclusion)

**Before:**

> The five victims are budgeted anyway per FR-1's mandate: the three tracks' gate-run flake records show these exact tests hitting `Test timed out in 30000ms` under host load at 30–66 s — an isolated-vs-loaded multiplier of ~2–17×, so the 20 s isolated threshold is not protective by itself for these tests.

**After:**

> The five victims are budgeted anyway per FR-1's mandate: the sole actual flake record is `conductor/archive/20261026-docs-truth-pass/verification/phase-1.md:93,119` — the `20261025-shared-random-helpers` and `20261026-scene-rng-seam` archives contain no timeout records — and it lists **seven** files losing property tests to `Test timed out in 30000ms` under host load at 34–66 s: `addItUpLogic`, `countLogic`, `decodeLogic`, `firstSoundsLogic`, `moreLessLogic`, `numberOrderLogic`, `takeAwayLogic` (note: `decodeLogic` and `moreLessLogic`, not `wordLogic`). The five mandated victims are a subset of that seven-file list. At the worst record, 66 s over the 1.98 s isolated victim, the isolated-vs-loaded multiplier reaches ~33×, so the 20 s isolated threshold is not protective by itself for these tests. Of the two record files outside the five: `decodeLogic`'s sweep is budgeted in Phase R1 (F1), and `moreLessLogic` carries pre-existing 20 s budgets below the 30 s default (pre-existing, out of scope per the review).

The audit table's measurements and conclusions otherwise stand unchanged.

## Files touched

- `src/__tests__/game/decodeLogic.test.ts` — the shift sweep gains `{ timeout: 120_000 }` (options object, second argument); the test's redundant trailing numeric `30000` on the same call was replaced by it (a test cannot carry both; same normalization precedent as firstSoundsLogic in Phase 1). Nothing else changed.
- `src/__tests__/game/wordLogic.test.ts` — the shift sweep gains `{ timeout: 120_000 }`. Nothing else changed.
- `docs/TDD.md` — §10.1 exception sentence extended (F1: seven sweeps) and closing inventory sentence reworded (F2).
- `conductor/tracks/20261026-property-test-deflake/verification/phase-1.md` — grep-proof counts 5 → 7 (primary verification bullet, FR-1 row, AC-2 row, placements table), F3 provenance rewrite, dated R1 annotations on the affected lines.
- `conductor/tracks/20261026-property-test-deflake/verification/integrated.md` — AC-2 row count 5 → 7; R1 note added.
- `conductor/tracks/20261026-property-test-deflake/verification/phase-R1.md` — this evidence file.

## Deviations

None.

## Notes

- Commits: `e9995163` (`test(deflake)`: F1 budgets), `68bb3aa5` (`docs(tdd)`: F2 inventory). This evidence file is committed separately as `docs(conductor)`.
- `vite.config.ts` untouched (the global 30 s policy stays byte-identical); the docs validator's TDD-truth and count-drift guards pass on the edited note.
- No test renamed, removed, or weakened; `VARIETY_SAMPLES = 200` unchanged; suite counts identical (125 files / 2,729 tests in both test runs).
- The `pnpm check` warning/info pair and the coverage numbers are byte-for-byte the pre-existing Phase-1 values.

## Primary verification

- Worktree clean; range `902ac732..HEAD` = 3 commits (`e9995163`, `68bb3aa5`, `10eeaf42`), zero merges.
- Squash note (round-2 review F4): the three fix commits were squashed at acceptance into checkpoint `84c0699d`, and this evidence file was re-added with the Primary verification section as `b043c3c8`. The hashes above describe the pre-squash history and are reachable only via reflog; the squashed content is equivalent (`git diff 10eeaf42 84c0699d` touches only conductor evidence/plan files).
- `git diff --name-only 902ac732..HEAD` = exactly the five Touches files plus the new phase-R1.md evidence.
- F1 audit: `git grep -n "timeout: 120_000" -- src/__tests__/game` returns exactly 7 matches at lines addItUpLogic 172, countLogic 174, decodeLogic 322, firstSoundsLogic 252, numberOrderLogic 136, takeAwayLogic 173, wordLogic 254. The F1 placements (decode 322, word 254) use the options-object form; decodeLogic's redundant trailing numeric 30000 was replaced by the object on the same test.
- F2 audit: the reworded TDD sentence now names the five pair-pool guards (addItUp/count/takeAway) and the two 20 s sweep guards at `moreLessLogic.test.ts:141-143`/`:159`.
- F3 audit: the provenance sentence cites `conductor/archive/20261026-docs-truth-pass/verification/phase-1.md:93,119` as the sole record, reconciles the seven-file list, and corrects the multiplier (~33x over the 1.98 s victim).
- Full 8-command chain re-run by the primary, all exit 0: check (1 pre-existing warning + 1 info), typecheck clean, 125 files / 2,729 tests, coverage 97.82/91.96/96.77/98.74, build precache 54 entries (1727.85 KiB), bundle PASS, PWA 16/0, docs 6/0.
- Primary verdict: **verified**.
