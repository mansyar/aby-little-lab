# Phase 2 Verification — Vitest 5.0.5

- **Track:** `20261027-dependency-majors`
- **Phase:** 2
- **Date:** 2026-10-27
- **Branch:** `chore/20261027-dependency-majors`
- **Phase base:** `1445de38` — **Phase head:** `f32f0c92`
- **Result:** `verified`

> Note: the executor-worktree commit hashes cited in this evidence (`2cf18cae` vitest pair, `f32f0c92` validator, `ef4651d3` line-width, `38229b3a` evidence) were squashed at phase acceptance into `c0c86ee2`; the hashes remain reflog-reachable but are not on the branch history.

## Commands

| # | Command | Exit | Summary |
|---|---|---|---|
| 0 | `pnpm install --frozen-lockfile` | 0 | Lockfile consistent with `package.json` ("Lockfile is up to date, resolution step is skipped", supply-chain policy verified; Done in 69ms). Run by the executor at the phase head. |
| 1 | `pnpm check` | 0 | Biome: 258 files checked, 0 errors. Only the pre-existing `noNonNullAssertion` warning at `src/__tests__/scenes/musicalMemoryScene.test.ts:296:22` (present since Phase 1, warning-only, file untouched by this phase — see notes). |
| 2 | `pnpm typecheck` | 0 | `tsc --noEmit` clean. |
| 3 | `pnpm test -- --run` | 0 | Vitest 5.0.5: **125 files / 2,729 tests passed** — green on the FIRST run under vitest 5 (31.69s), again green in the gate run (21.46s). Counts unchanged from vitest 4. |
| 4 | `pnpm test:coverage` | 0 | All files: Statements 97.8% (5492/5615), Branches 91.9% (1487/1618), Functions 96.77% (1141/1179), Lines 98.74% (5116/5181) — all above the fixed gates (95 lines / 88 functions / 85 branches / 90 statements). |
| 5 | `pnpm build` | 0 | `vite v8.3.5` build; 344 modules; precache 54 entries (1720.45 KiB); `phaser-B_vcVLyb.js` 1,367.08 kB, shell `index-B3pDeagg.js` 142.29 kB. The >500 kB chunk warning is expected/benign. |
| 6 | `node scripts/validate-bundle.js` | 0 | PASS: Phaser vendor chunk present (1335.0 kB); shell entry 139.0 kB ≤ 200 kB. |
| 7 | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed; 42 chunks / 42 precached. |
| 8 | `node scripts/validate-docs.js` | 0 | 6 passed, 0 failed — after the `--no-staticParse` fix (deviation below). Before the fix it failed exit 1: the derivation under-counted the suite as 125 files / 2,424 tests. |

## Requirements / acceptance evidence

| ID | Requirement / criterion | Evidence | Status |
|---|---|---|---|
| FR-1 | package.json + pnpm-lock.yaml committed together, exact pair | Commit `2cf18cae` (both files, one commit). `package.json` devDeps: `vitest ^5.0.5` + `@vitest/coverage-v8 ^5.0.5` — exactly matching. Lockfile cross-pins both: `vitest@5.0.5(@vitest/coverage-v8@5.0.5)` and `@vitest/coverage-v8@5.0.5(vitest@5.0.5)`. Frozen-lockfile install exit 0. | PASS |
| FR-3 | vitest 5 `clearMocks: true` default embraced; no escape hatch; suites self-contained | `grep clearMocks vite.config.ts` → **no matches** (no `clearMocks` key at all, so the v5 default `clearMocks: true` is active; no `clearMocks: false` was added). The full suite passed unmodified on the first run under vitest 5 — no suite relied on cross-test mock call history. Fixed-suite list: **empty by success**, not by omission. | PASS |
| FR-8 | Every semantic change a major forces recorded as a deviation | One deviation: `scripts/validate-docs.js` gained `--no-staticParse` (commit `f32f0c92`) because vitest 5's `list` command AST-parses files by default and dropped 305 dynamically registered tests from the derivation. Zero test files needed changes — no other v5 behavior surfaced. | PASS |
| NFR-2 | Coverage above the fixed gates (never lowered) | Gates 95 lines / 88 functions / 85 branches / 90 statements; measured 98.74 / 96.77 / 91.9 / 97.8 in the gate run — all above. | PASS |

## Files touched

- `package.json`, `pnpm-lock.yaml` — commit `2cf18cae` (the upgrade pair, prepared uncommitted by the primary; committed by the executor).
- `scripts/validate-docs.js` — commit `f32f0c92` (deviation; see below).
- `vite.config.ts` — **unchanged** (test config already correct under v5; no `clearMocks` key added or removed).
- `src/__tests__/**` — **unchanged** (zero suites needed fixes).

## Deviations

| File | Reason |
|---|---|
| `scripts/validate-docs.js` (off-Touches) | The count-drift guard derives suite truth by parsing `pnpm exec vitest list` output. Vitest 5 changed that command's default to `staticParse: true` — it AST-parses test files instead of importing them, so dynamically registered tests (loops over imported data, conditionally created suites) never appear in its output. The derivation dropped from 2,729 to 2,424 tests (−305) while the real suite still runs 2,729; the validator then failed the gate by blaming the (correct) docs. Diagnosis: every one of the 2,424 emitted lines matched the parser's file regex (mismatch count 0), proving the gap was in collection, not parsing. Fix: add `--no-staticParse` so the derivation collects the way the runner itself does, restoring the vitest 4 semantics the guard was written against. The docs were correct throughout — no doc change (docs truth updates belong to Phase 5). Recorded as a deviation because the file is outside the phase's Touches; the change is minimal (one CLI flag + comment + error-message strings). |

## Notes

- **`pnpm outdated` — not run (blocker).** The executor's shell was denied `pnpm outdated` (permission.rejected); per the phase rules it was not retried or worked around. Expected rows for the primary to confirm: vitest and @vitest/coverage-v8 have left the outdated table; `happy-dom 18.0.1 → 21.0.4` and `vite-plugin-pwa 1.3.0 → 2.0.0` remain — expected, they are Phases 3–4.
- **clearMocks grep proof (AC-3):** `grep clearMocks vite.config.ts` → no matches. The FR-3 grep proof is the empty result itself.
- **Fixed-suite list (FR-3):** empty by success — 125 files / 2,729 tests passed on the first run under vitest 5 with zero test-file modifications.
- **Coverage before/after equality (for the Phase 5 snapshot):** denominators are byte-identical to the vitest 4 numbers — statements 5493/5615, branches 1488/1618, functions 1141/1179, lines 5116/5181 — so the v5 coverage include/exclude precision change did NOT shift our denominators. The standalone confirmation run on the upgraded tree measured All files **97.82 / 91.96 / 96.77 / 98.74** — byte-identical to the vitest 4 numbers. The gate run minutes later measured 97.8 (5492/5615) and 91.9 (1487/1618) — exactly the ±1-covered-item per-run instrumentation variance documented in `docs/TDD.md` §10.3; both readings clear every gate.
- **v5 behaviors observed:** the only breaking surface that materialized was `vitest list` static parsing (absorbed via the validator fix, deviation above). None of the other known v5 changes surfaced: no hoisted-mock top-level rule violations, no class-mock prototype issues, no unawaited-async assertion failures, no `expect.poll` timeouts, no toThrow message-matching changes, no snapshot-affecting title formatting changes. Per the brief: a suite that passes without modification needs no action — no green test was churned.
- **Biome warning:** `musicalMemoryScene.test.ts:296:22 lint/style/noNonNullAssertion` is a pre-existing warning-only diagnostic carried over from Phase 1 (it appears in the Phase 1 evidence too). It does not fail `pnpm check`. The file is not in this phase's Touches and the assertion was not touched; left for the track review to weigh.
- **Diagnostic artifacts (gitignored, under `.conductor/evidence/`):** `vitest-list-raw.txt` (raw `vitest list` output on the un-fixed derivation) and `vitest-list-analysis.txt` (`sepLines=2424 mismatches=0`). Kept as failure-cause evidence for the deviation.
- **Vitest 5 internals reference (for later phases):** the `list` printer (`formatCollectedAsString` in `vitest/dist/chunks/cli-api.De07GUeT.js`) emits `${module.task.name} > ${test.fullName}` per test and skips tests whose collect-time result state is "skipped"; `collectCliOptionsConfig` documents `staticParse` as "(default: true)". These facts underpin the validator fix.
- First fix attempt on the failed gate: `pnpm check` flagged Biome formatting on the two new error-message lines in `validate-docs.js` (line width); wrapped per Biome's printed suggestion, then the full chain passed. That was the only retry; the second attempt succeeded, within the 2-retry budget.
## Primary verification

- Worktree clean; range `1445de38..HEAD` = 4 commits (`2cf18cae` FR-1 pair, `f32f0c92` validator static-parse fix, `38229b3a` evidence, `ef4651d3` biome line-width follow-up), zero merges. `git diff --name-only` = exactly `package.json`, `pnpm-lock.yaml`, `scripts/validate-docs.js` (the disclosed deviation), and the evidence file.
- Deviation audited: the validator change is minimal and surgical - one `--no-staticParse` flag plus its error-message strings and a formatting follow-up. The reasoning is verified by the executor's diagnostic artifacts: vitest 5's `list` defaults to AST parsing, which misses the 305 dynamically registered tests; without the flag the count-drift guard would fail the gate while blaming correct docs. This is exactly the class of cross-cutting effect this track exists to catch. The biome line-width follow-up was necessary because the initially committed form would fail `pnpm check` in CI.
- Primary ran the denied `pnpm outdated`: vitest and @vitest/coverage-v8 no longer appear; `happy-dom 18.0.1 -> 21.0.4` and `vite-plugin-pwa 1.3.0 -> 2.0.0` remain (expected - Phases 3-4). Output appended to evidence notes.
- Primary re-ran the full verification chain - all eight commands exit 0: `pnpm check` "Checked 258 files ... Found 1 warning" (pre-existing only); `pnpm typecheck` clean; `pnpm test -- --run` 125 files / 2,729 tests passed; coverage All files 97.82 / 91.96 / 96.77 / 98.74 (identical to vitest 4); `pnpm build` built in 714ms, precache 54 entries (1,720.45 KiB); validate-bundle all passed; validate-pwa all passed; validate-docs all passed - the count-drift guard now derives 125 / 2,729 correctly under vitest 5.

Primary verdict: **verified**.
