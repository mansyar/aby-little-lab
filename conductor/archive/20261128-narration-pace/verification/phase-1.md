# Phase 1 Verification — Pace model and speech wiring

- **Track:** 20261128-narration-pace
- **Phase:** 1 — Pace model and speech wiring
- **Date:** 2026-11-28
- **Branch:** `feat/20261128-narration-pace`
- **Base commit:** `478bcb17` (phase start)
- **Head commit:** `7681119f`
- **Result:** **FAILED — gate incomplete.** All executable code and test checks pass. `node scripts/validate-docs.js` fails only on stale living-doc test-count claims (owned by the primary); `node scripts/validate-module-size.js` and `node scripts/validate-textures.js` were permission-denied, as was the exact `&&`-chained gate command.

## Task commits

| Task | Commit | Summary |
|---|---|---|
| P1.T1 | `f6048117` | Pace model, rate table, normaliser, `setNarrationPace` seam, all four speak paths, rate/preset tests |
| P1.T2 | `7681119f` | Additive per-profile field, Gentle backfill, unknown-value normalisation, persistence and guard tests |

## Commands

| Layer | Command | Exit | Summary |
|---|---|---|---|
| Lint/format | `pnpm check` | 0 | 392 files checked, no issues |
| Types | `pnpm typecheck` | 0 | strict TS across `src` and `e2e` |
| Unit | `pnpm test -- --run` | 0 | 165 files / 3,549 tests passed |
| Coverage | `pnpm test:coverage` | 0 | statements 96.95 %, branches 90.37 %, functions 96.35 %, lines 98.09 % — all above the 90/85/88/95 gate |
| Build | `pnpm build` | 0 | 501 modules transformed; 55 JS chunks; 67 precache entries |
| Bundle | `node scripts/validate-bundle.js` | 0 | Phaser vendor chunk present; shell entry `index-DKSXg1Rr.js` = 189.4 kB (≤ 200 kB) |
| Module size | `node scripts/validate-module-size.js` | denied | `permission.rejected` — not run by this subagent |
| Textures | `node scripts/validate-textures.js` | denied | `permission.rejected` — not run by this subagent |
| PWA | `node scripts/validate-pwa.js` | 0 | 16 passed / 0 failed; 55 chunks, 55 precached |
| Docs | `node scripts/validate-docs.js` | 1 | 4 checks pass; the living-suite-count check fails with 16 mismatches (8 doc spots × file/test counts) |
| Full gate | `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js` | denied | `permission.rejected` — `&&` chains are not permitted for this subagent; each subcommand was attempted individually instead |

Derived test-suite truth after this phase: **165 files / 3,549 tests** (base 164 / 3,531). Stale claims at `README.md:49`, `docs/TDD.md:1344`, `docs/TDD.md:1350`, `docs/perf-baseline.md:3`, `:583`, `:922`, `:955`, `:1016` still read 164 / 3,531. Product docs are owned by the primary and were not edited here.

## Acceptance criteria

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| AC-2 | All four speak paths scale under Slower and Standard relative to Gentle | `src/__tests__/utils/speech.test.ts` → `describe("setNarrationPace")` asserts exact utterance `rate` for `speakLetter`, `speakWord`, `speakNumber`, `speakSentence` under all three presets; `src/__tests__/game/narrationPace.test.ts` locks 0.9/0.8 Gentle, 0.7/0.6 Slower, 1.0/1.0 Standard; full suite green | pass |
| AC-3 | Reload with a stored Slower pace still speaks slow; a legacy profile without the field speaks at Gentle rates | `src/__tests__/game/narrationPace.test.ts` → `describe("per-profile narration pace persistence")`: stored Slower survives `normalizeV2`, missing field backfills Gentle, all profiles (not just active) keep their pace | pass |
| AC-5 | Corrupt/unknown stored pace normalises to Gentle; SFX-off and speech-unsupported paths unchanged | `normalizeNarrationPace`/`ratesForPace` fallback tests for unknown values; `speech.test.ts` guards assert zero utterances, zero `cancel` and false returns at every preset when SFX is off or speech unsupported | pass |

Also covered: FR-2 (mapped rates on every path), FR-3 (per-profile persistence + legacy Gentle), FR-5 (unchanged guards), NFR-1 (no dependencies added, no `SCHEMA_VERSION` bump), NFR-3 (all mapped rates inside 0.5–1.0, asserted in the rate-table test). AC-1 (selecting a preset in Settings) belongs to Phase 2 and is out of scope here.

## Evidence paths

- `src/game/narrationPace.ts` — new pure module: `NARRATION_PACES`, `DEFAULT_NARRATION_PACE`, `NARRATION_RATES`, `normalizeNarrationPace`, `ratesForPace`
- `src/types/index.ts` — `NarrationPace` type and additive `Profile.narrationPace`
- `src/utils/speech.ts` — `setNarrationPace` seam and rate wiring in all four speak paths
- `src/game/profileLogic.ts` — backfill and normalisation on profile creation/load (deviation)
- `src/__tests__/game/narrationPace.test.ts` — rate table, normaliser and persistence tests (new)
- `src/__tests__/utils/speech.test.ts` — per-preset rate and guard tests
- `src/__tests__/utils/storage.test.ts` — legacy exact-shape expectation updated for the backfilled field (deviation)

## Deviations

- `src/game/profileLogic.ts` — the plan lists `src/game/storage.ts` in Touches, but that file does not exist; profile normalisation actually lives in `profileLogic.ts`. Smallest necessary change: two lines adding `narrationPace` to `createDefaultProfile` and `normalizeV2`, plus the import and doc-comment touch.
- `src/__tests__/utils/storage.test.ts` — outside Touches. One exact-shape expectation for a legacy unstamped payload had to include the backfilled `narrationPace: "gentle"`; without it an existing test failed.
- `src/types/index.ts` — `narrationPace` is optional (`narrationPace?: NarrationPace`) and normalised on read. Making it required broke five construction sites (including `src/utils/backupMerge.ts`) and would have forced out-of-scope edits; optional + backfill keeps the additive change minimal and the stored-data contract intact.

## Notes

- TDD was followed in both tasks: new tests were run red before implementation (T1: unresolved import / `setNarrationPace is not a function`; T2: five persistence assertions returned `undefined`), then green after implementation.
- Gentle remains byte-identical: 0.9 for letters/numbers/sentences and 0.8 for words, with the same voice resolution, interrupt defer, lifecycle token and SFX/unsupported early returns.
- No new dependencies and no storage schema version bump. The new pure module is small (40 lines), well inside the module-size guard's warning threshold.
- Blocked-for-primary items: refresh the eight living-doc count spots to 165 files / 3,549 tests; run the two permission-denied validators and the exact chained gate. Product docs were deliberately not edited by this phase subagent.

## Primary verification

Primary ran the exact chained gate on the final tree (squash `5a05c92c` + numeric-only doc refresh to 165 files / 3,549 tests in `README.md`, `docs/TDD.md`, `docs/perf-baseline.md`): exit 0 throughout — `pnpm check` (392 files clean), `pnpm typecheck` clean, `pnpm test` 165 files / 3,549 tests pass, coverage stmts 96.95 / branches 90.37 / funcs 96.35 / lines 98.09 (gates 90/85/88/95), `pnpm build` (501 modules), `validate-bundle` PASS (entry 189.4 kB), `validate-module-size` PASS (2 pre-existing warnings: `e2eBridgeTypes.ts`, `RepeatMachineScene.ts`), `validate-textures` PASS (76.42/321.00/0.238, unchanged), `validate-pwa` 16/0, `validate-docs` 5/0. Deviations accepted: `profileLogic.ts` is the real normaliser home (`storage.ts` does not exist); optional `Profile.narrationPace` with read-time normalisation keeps the change additive; `storage.test.ts` exact-shape update is the minimal consequence. AC-2, AC-3, AC-5 have passing test evidence.
