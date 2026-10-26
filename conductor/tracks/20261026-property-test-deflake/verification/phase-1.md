# Phase 1 Verification — Audit the sweeps and raise the budgets

- **Track:** `20261026-property-test-deflake` (chore, high)
- **Phase:** 1
- **Date:** 2026-10-26
- **Branch:** `chore/20261026-property-test-deflake`
- **Phase base:** `578bf9ac` — **Phase head:** `a6c62c3c`
- **Result:** ✅ verified (all eight gate commands exit 0)

## Primary verification

- Worktree clean except the untracked evidence file; range `578bf9ac..HEAD` = 2 commits (`260ba758`, `a6c62c3c`), zero merges.
- `git diff --name-only 578bf9ac..HEAD -- . ':(exclude)conductor'` = exactly the 5 Touches test files + `docs/TDD.md`.
- `git diff -- vite.config.ts` = empty (byte-identical global policy).
- Grep `timeout: 120_000` over `src/__tests__/game` → exactly 5 matches: `addItUpLogic.test.ts:172`, `countLogic.test.ts:174`, `numberOrderLogic.test.ts:136`, `takeAwayLogic.test.ts:173`, `firstSoundsLogic.test.ts:252` — the five proven victims, none beyond.
- Full 8-command chain re-run by the primary, all exit 0: `pnpm check` (1 pre-existing warning + 1 info), `pnpm typecheck` clean, `pnpm test -- --run` 125 files / 2,729 tests passed, coverage 97.82/91.96/96.77/98.74, build precache 54 entries (1727.85 KiB), bundle PASS, PWA 16/0, docs 6/0.
- Primary verdict: **verified**.


## Commands table

| Layer | Command | Exit code | Summary |
|---|---|---|---|
| Lint/format | `pnpm check` | 0 | 1 pre-existing warning (`musicalMemoryScene.test.ts:296` non-null assertion — pre-dates this phase) + biome schema-version info; no errors |
| Types | `pnpm typecheck` | 0 | `tsc --noEmit` clean |
| Tests | `pnpm test -- --run` | 0 | **125 files / 2,729 tests passed** (53.84 s) — counts unchanged |
| Coverage | `pnpm test:coverage` | 0 | statements 97.82, branches 91.96, functions 96.77, lines 98.74 — all above gates (95/85/88/90) |
| Build | `pnpm build` | 0 | vite build ok (1.98 s) |
| Bundle | `node scripts/validate-bundle.js` | 0 | PASS: phaser chunk + shell ≤ 200 kB |
| PWA | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed |
| Docs | `node scripts/validate-docs.js` | 0 | 6 passed, 0 failed (TDD-truth check green with the new note) |

## AC / FR table

| Req | Evidence | Status |
|---|---|---|
| FR-1 (120,000 ms on the five proven victims) | grep `120_000` → exactly 5 matches, one per victim suite (see placements below) | ✅ |
| FR-2 (audit all 13 `VARIETY_SAMPLES = 200` suites; > 20 s gets a budget) | Audit table below: all 13 run individually and timed; no sweep test exceeds 20 s in isolation (worst 4.84 s), so no budget beyond the five mandated victims | ✅ |
| FR-3 (confirm vitest 4.1.x per-test timeout syntax from installed typings) | See "Confirmed timeout syntax" below | ✅ |
| FR-4 (policy recorded in TDD §10.1; vmThreads rationale intact) | `docs/TDD.md` §10.1 paragraph extended in place; `git diff -- vite.config.ts` = empty (byte-identical) | ✅ |
| FR-5 (no test renamed/removed/weakened; `VARIETY_SAMPLES = 200` stays) | Full-suite counts identical (125 / 2,729); diff touches only the timeout options of 5 tests (+1 style normalization of firstSounds' trailing numeric timeout) | ✅ |
| NFR-1 (no production `src/**` change) | `git diff --stat`: 5 test files + `docs/TDD.md` only | ✅ |
| NFR-3 (audit numbers are real measurements) | Every number below comes from a timed `pnpm test -- --run <file> --reporter=verbose` run on this host, 2026-10-26 | ✅ |
| AC-2 (grep proof of 120,000 ms only where justified) | grep `120_000` over `src/__tests__/game/*.test.ts` → 5 matches, exactly the 5 victims | ✅ |
| AC-3 (audit table from a real timed run) | Audit table below | ✅ |
| AC-4 (vite.config.ts byte-identical + TDD note + docs validator green) | `git diff -- vite.config.ts` empty; TDD §10.1 extended; `validate-docs.js` 6/6 | ✅ |
| AC-5 (suite counts unchanged) | 125 test files / 2,729 tests in both `pnpm test -- --run` and `pnpm test:coverage` | ✅ |

## Audit table (P1.T1.1)

Method: each suite run individually (`pnpm test -- --run <file> --reporter=verbose`, vitest 4.1.11, vmThreads pool, 2026-10-26). **Per-test** wall times from the verbose reporter; per-suite wall time recorded as context. All 13 suites passed in isolation — no 30 s timeouts were hit during the audit itself.

| Suite | Heavy sweep tests (200-sample loops over bands/shifts) | Worst isolated wall time (per test) | Suite wall time |
|---|---|---|---|
| `addItUpLogic.test.ts` | "keeps the shifted band ladder and validity across many samples" (victim); "keeps every round structurally valid"; "produces structurally valid rounds for every band across many samples" | **1.98 s** (victims: 1.98 s / 0.65 s / 0.32 s) | 4.22 s (19 tests) |
| `alphabetLogic.test.ts` | "draws easy targets only from A-J at shift -1"; "never offers a confusable same-family distractor"; "pairs same-family distractors only in the hard band"; "produces structurally valid rounds across many samples" | 0.88 s | 4.54 s (21 tests) |
| `colorMatchLogic.test.ts` | "keeps every round structurally valid"; "serves the classic 3+3 split at shift 0"; "steps up to a 2+4 split (shift +1)"; "eases to a 4+2 split (shift -1)"; "produces structurally valid rounds for both pools"; "proceeds easy-first through the bands" | 0.55 s | 4.61 s (23 tests) |
| `countLogic.test.ts` | "keeps the shifted band ladder across many samples" (victim); "proceeds easy-first through the bands"; "produces structurally valid rounds for every band" | **3.22 s** (victims: 3.22 s / 0.58 s / 0.31 s) | 5.72 s (17 tests) |
| `decodeLogic.test.ts` | "keeps every round valid and uniquely targeted at every shift"; "produces structurally valid rounds for every pool word across many samples" | 2.21 s | 3.62 s (31 tests) |
| `firstSoundsLogic.test.ts` | "keeps every round valid at every shift" (victim); all other 200-sample tests < 250 ms | **2.45 s** | 4.05 s (28 tests) |
| `memoryMatchLogic.test.ts` | "keeps every round structurally valid"; "produces structurally valid rounds for every band"; "keeps every shifted round structurally valid" | 0.55 s | 1.98 s (28 tests) |
| `moreLessLogic.test.ts` | "keeps the shifted band ladder and the 3/3 mode mix across many samples"; "keeps exactly one correct side in every shifted round"; "produces structurally valid rounds for every band and mode"; "proceeds easy-first through the bands" | 1.58 s | 4.13 s (17 tests) |
| `numberOrderLogic.test.ts` | "keeps the shifted band ladder across many samples" (victim); "proceeds easy-first … with classic ladder"; "produces structurally valid rounds for every band" | **4.84 s** (victims: 4.84 s / 1.57 s / 0.89 s) | 9.42 s (16 tests) |
| `oddOneOutLogic.test.ts` | "keeps every round structurally valid"; "produces structurally valid rounds for every band across many samples" | 0.15 s | 2.11 s (27 tests) |
| `patternBuilderLogic.test.ts` | "keeps today's uniform draw while thriving (shift +1)"; "serves end-gap rounds only while struggling (shift -1)"; "produces structurally valid rounds across many samples" | 1.23 s | 3.95 s (22 tests) |
| `takeAwayLogic.test.ts` | "keeps the shifted band ladder and validity across many samples" (victim); "keeps every round structurally valid"; "produces structurally valid rounds for every band" | **4.41 s** (victims: 4.41 s / 1.65 s / 0.58 s) | 8.64 s (19 tests) |
| `wordLogic.test.ts` | "keeps every round valid and uniquely targeted at every shift"; "contains every unique letter of the word"; "always returns exactly 6 tiles"; "contains no duplicate tiles"; "keeps every build within the pool at every shift" | 1.98 s | 6.27 s (42 tests) |

**Audit conclusions:**

- No sweep test exceeds the 20 s threshold **in isolation** (worst: numberOrderLogic shifted ladder, 4.84 s). No additional suite is budgeted beyond the five mandated victims.
- The five victims are budgeted anyway per FR-1's mandate: the three tracks' gate-run flake records show these exact tests hitting `Test timed out in 30000ms` under host load at 30–66 s — an isolated-vs-loaded multiplier of ~2–17×, so the 20 s isolated threshold is not protective by itself for these tests.
- The once-observed 46 s test "keeps every round valid and uniquely targeted at every shift" lives in **`decodeLogic.test.ts:322` and `wordLogic.test.ts:254`** — not in `moreLessLogic`/`oddOneOutLogic` as the brief guessed. Isolated wall times: 2.21 s (decode) and 1.98 s (word) — below threshold, so not budgeted; the identity question is resolved in the evidence.

## Confirmed timeout syntax (P1.T1.2)

Installed vitest: **4.1.11**. The per-test options-object form `it(name, { timeout: number }, fn)` is supported:

- `node_modules/vitest/dist/index.d.ts:5` re-exports `TestOptions` (per-test options including `timeout`) from `@vitest/runner`.
- `node_modules/vitest/dist/chunks/reporters.d.DtoKVV2s.d.ts:346-348`: `/** Only tests have a `timeout` option. */ readonly timeout: number | undefined;` (on the per-test Task options).
- In-repo precedent already used and typechecks: `it("...", { timeout: 20_000 }, () => {...})` in `addItUpLogic.test.ts:185/197`, `countLogic.test.ts:188`, `takeAwayLogic.test.ts:186/198`.

Applied form: `{ timeout: 120_000 }` (numeric separator matches the existing `20_000` style; AC-2 grep pattern `120_000` proves placement).

## Timeout placements (grep proof, 5 matches)

| File | Line | Test |
|---|---|---|
| `src/__tests__/game/addItUpLogic.test.ts` | 172 | "keeps the shifted band ladder and validity across many samples" |
| `src/__tests__/game/countLogic.test.ts` | 174 | "keeps the shifted band ladder across many samples" |
| `src/__tests__/game/firstSoundsLogic.test.ts` | 252 | "keeps every round valid at every shift" |
| `src/__tests__/game/numberOrderLogic.test.ts` | 136 | "keeps the shifted band ladder across many samples" |
| `src/__tests__/game/takeAwayLogic.test.ts` | 173 | "keeps the shifted band ladder and validity across many samples" |

## TDD note (P1.T3)

`docs/TDD.md` §10.1 runner paragraph extended in place (single-sentence insert between the vmThreads-isolation sentence and "Five shared helpers:"): names the five sweep tests, states the `{ timeout: 120_000 }` exception with the measured reason (200-sample × 3-shift loops exceed 30 s under host load, worst observed 66 s on the gate runs; < 5 s in isolation, audited 2026-10-26, worst 4.84 s), and records that the global 30 s default is unchanged. The existing vmThreads rationale is intact — extended, not rewritten. `git diff -- vite.config.ts` is empty.

## Files touched

- `src/__tests__/game/addItUpLogic.test.ts` (timeout option)
- `src/__tests__/game/countLogic.test.ts` (timeout option)
- `src/__tests__/game/firstSoundsLogic.test.ts` (timeout option; trailing numeric `30000` normalized to the options-object form on the same test)
- `src/__tests__/game/numberOrderLogic.test.ts` (timeout option)
- `src/__tests__/game/takeAwayLogic.test.ts` (timeout option)
- `docs/TDD.md` (§10.1 exception policy)

## Deviations

None.

## Notes

- Commits: `260ba758` (test budgets), `a6c62c3c` (TDD note).
- The pre-existing `pnpm check` warning (`musicalMemoryScene.test.ts:296`) predates this phase and is untouched.
- The firstSoundsLogic victim already carried a trailing `, 30000)` numeric timeout (a third form, inconsistent with the rest of the suite); it was replaced by the confirmed options-object form on the same test — no rename, no weakening.
- Isolated wall times are 5–20× below the 120 s budget; the budget is sized on the loaded-host observations (2× the 66 s worst), per A1.
