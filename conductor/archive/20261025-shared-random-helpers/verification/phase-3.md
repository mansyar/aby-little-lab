# Phase 3 Verification — Thread the RNG seam through the logic modules

- **Track:** 20261025-shared-random-helpers
- **Phase:** 3
- **Date:** 2026-10-25
- **Branch:** `refactor/20261025-shared-random-helpers`
- **Base:** `0e99d768` (phase start; phase base after Phase 2 was `0b4c7b5a`)
- **Head:** `75b0a082`
- **Commits:** `1ecd8203` (refactor(random): Thread the rng seam through the logic modules — 23 files, +497/−200), `7001a177` (refactor(random): Inherit the shared shuffle default in shapeSorterLogic), `75b0a082` (style(random): Formatting and import order for the rng seam — post-commit formatter/import-order fixes + this evidence file)
- **Result:** ✅ **verified**

## Result summary

Every random-dependent export in the 21 logic modules now accepts a trailing
optional `rng: Rng = Math.random` (type imported from `./random`), threaded to
every internal random decision — direct `Math.random()` coin/param draws,
private pick helpers, and every internal `shuffle` call. feelingsFacesLogic and
storyOrderLogic delegate their private `shuffleWith` to the shared `shuffle`
(one-liner), and both suites prove same-rng sequence equivalence with
pre-migration mulberry32 goldens (P3.T3.1). `shapeSorterLogic.generatePlaythrough`
keeps its public signature (A5) and inherits the seam by omitting the optional
arg, so the default flows through `shuffle` itself. A static grep sweep
(P3.T4.1) proves every `Math.random` in non-test `src/game/**` is a
default-parameter initializer or lives inside `random.ts`.

## Commands

Verification was executed as the eight configured layers of the track's
`verify_phase` gate (as separate commands due to executor tooling limits; each
exactly as configured). Run twice over the phase's committed state: once after
commit `1ecd8203`, then again after `7001a177` reorder-fixed
`shapeSorterLogic`.

| Layer | Command | Exit | Summary |
|---|---|---|---|
| check | `pnpm check` | 0 | 257 files checked; 0 errors. Only pre-existing, out-of-scope findings remain: 1 warning (`lint/style/noNonNullAssertion` in `src/__tests__/scenes/musicalMemoryScene.test.ts:294`, untouched by this phase) and 1 info (`biome.json` `$schema` 2.5.5 vs CLI 2.5.10) |
| typecheck | `pnpm typecheck` | 0 | `tsc --noEmit` clean |
| test | `pnpm test -- --run` | 0 | 124 files, 2690 tests passed (includes the two new AC-3 sequence-equivalence tests, one in feelingsFacesLogic.test.ts, one in storyOrderLogic.test.ts) |
| coverage | `pnpm test:coverage` | 0 | lines 98.74% (≥95), branches 91.84% (≥85), functions 96.77% (≥88), statements 97.82% (≥90) — all NFR-3 gates green |
| build | `pnpm build` | 0 | 344 modules transformed; `random-DG-lNcLb.js` 0.14 kB shared chunk emitted |
| bundle | `node scripts/validate-bundle.js` | 0 | Phaser vendor chunk present; shell entry 138.7 kB ≤ 200 kB |
| pwa | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed; 42 chunks all precached |
| docs | `node scripts/validate-docs.js` | 0 | 5 passed, 0 failed |

Intermediate runs during development: an early `pnpm check` (before fixes)
exited 1 with 44 diagnostics (19 organizeImports import-order errors; formatter
diffs resolving via `pnpm format`; and one real parse breakage this phase's edit
had introduced in `memoryMatchLogic.ts` — a `/**` TSDoc opener lost above
`buildPlaythrough`, restored to a valid doc block). A temporary
`src/__tests__/game/goldenCapture.test.ts` (pre-migration golden capture
tooling; untracked, not committed) was neutralized to a cleanup placeholder
after the goldens were baked into the AC-3 tests. Post-fix runs above are the
recorded verification.

## AC table

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| FR-3 (partial for phase: seam thread) | Every random-dependent export accepts trailing optional `rng: Rng` defaulting to `Math.random`, threaded into every internal random decision | Grep sweep below: 43 `rng: Rng = Math.random` default params across 20 logic modules (feelingsFaces/storyOrder keep their pre-existing seam); private helpers (`pickFrom`, `pickGapIndex`, `pickNote`, `pickItem`, `distractorOptions`, `selectBubbleType`, `selectSleepingAnimal`, `generateSpawnConfig`, `buildRound`) thread rng through every draw and nested `shuffle`/exported-builder call | ✅ (verified this phase via sweep + gate) |
| AC-2 (Math.random-defaults half) | Every `Math.random` occurrence in non-test `src/game/**` is a default-parameter initializer or inside `random.ts` | Sweep output verbatim in Notes: 46 matches = 43 default-param initializers + 3 inside `random.ts` (2 TSDoc prose + the `shuffle` default). Zero active `Math.random()` call sites remain in modules | ✅ |
| AC-3 (shared-shuffle equivalence half, P3 scope) | feelingsFaces + storyOrder suites prove same-rng sequence equivalence across shared-shuffle adoption | One test each added pre-migration-golden-anchored: `feelingsFacesLogic.test.ts` "draws the identical sequence after adopting the shared shuffle (AC-3)" asserts mulberry32(1/77/2026) scenario-id draws equal the private-shuffle goldens in `.conductor/evidence/phase3-goldens.json`; `storyOrderLogic.test.ts` same name asserts mulberry32 seeds 1/11/2026 storyId orders and per-round `shuffled` strips equal the goldens. Calling order inside both modules unchanged (guaranteed-first ladder, extras, final shuffle) | ✅ |
| AC-2 (one-shuffle half, Phase 2 scope recheck) | Exactly one `function shuffle` definition in `src/game`; zero shuffle imports from `shapeSorterLogic` | Grep `function shuffle`: exactly `random.ts:21` (+ the two one-line private delegates `shuffleWith` in feelingsFaces/storyOrder delegating to it, per P3.T3.1); shapeSorterLogic imports `shuffle` only from `./random` | ✅ |
| NFR-1 (re-derivation prep) | Test expectation constants baked against old local-PRNG sequences re-derived against the new helper | Phase-3 scope: no test constants migrated yet (determinism migration is Phase 4); the golden capture used here is recorded at `.conductor/evidence/phase3-goldens.json` for Phase-4 reuse | ✅ |
| NFR-2 | TSDoc line per house wording on every touched export; `pnpm check`/`pnpm typecheck` clean | Each new `rng` param carries "rng must return a number in [0, 1); tests pass a seeded generator so a draw is reproducible."; gate green | ✅ |
| NFR-3 | Coverage gates: lines 95 / functions 88 / branches 85 / statements 90 | 98.74 / 96.77 / 91.84 / 97.82 | ✅ |
| NFR-4 | No new deps; bundle budgets unbroken | `package.json` untouched; validate-bundle PASS at 138.7 kB shell entry | ✅ |
| FR-2 | One shuffle | Phase 2 output consumed; Phase 3 adds zero shuffle definitions (shuffleWith delegates only) | ✅ |

## Files touched this phase

`src/game/`: animalTraceLogic, bigSmallLogic, popFreezeLogic, shadowMatchLogic,
shapeSorterLogic (A5 + shuffle default only), patternBuilderLogic,
musicalMemoryLogic, colorMatchLogic, countLogic, numberOrderLogic,
oddOneOutLogic, memoryMatchLogic, moreLessLogic, addItUpLogic, takeAwayLogic,
alphabetLogic, firstSoundsLogic, decodeLogic, wordLogic, feelingsFacesLogic
(shared-shuffle delegation), storyOrderLogic (shared-shuffle delegation).
Tests (signature adoption + AC-3 cases only, no determinism migration):
`src/__tests__/game/feelingsFacesLogic.test.ts`,
`src/__tests__/game/storyOrderLogic.test.ts`.

## Evidence paths

- `.conductor/evidence/phase3-goldens.json` — pre-migration feelingsFaces/storyOrder goldens captured from the private `shuffleWith` (same mulberry32 seeds; the raw arrays are baked into the AC-3 tests)
- `conductor/tracks/20261025-shared-random-helpers/verification/phase-3.md` — this file

## Deviations

1. `src/__tests__/game/feelingsFacesLogic.test.ts` / `src/__tests__/game/storyOrderLogic.test.ts`: two test-block insertions each (AC-3 sequence-equivalence cases per the plan's P3.T3.1 wording; allowed by the plan even though the brief's Touches say "test files adopt new signature" only — these are additive, not determinism migration).
2. Temporary `src/__tests__/game/goldenCapture.test.ts` (untracked, neutralized to a cleanup placeholder, never committed): migration/capture tooling under the test layout; deletion is left to the primary (executor tooling denies non-git file deletion). Track-plan outline T4.1e anticipates it, the brief does not.
3. `pnpm format` (biome format --write) applied repo-wide once: configured project command used to resolve formatter diffs this phase's own edits introduced; reported 8 files fixed, affecting only files in this phase's diff scope.
4. `shapeSorterLogic.generatePlaythrough` TSDoc reworded to drop a `Math.random` literal mention so AC-2's grep stays provable (A5 keeps the signature; default flows through `shuffle` itself).
5. `src/game/numberOrderLogic.ts`: one stale inline comment reworded ("deterministic via Math.random mock" → actual reshuffle-once guard) so no stray `Math.random` text remains in the sweep.
6. `src/game/musicalMemoryLogic.ts` pickNote TSDoc was extended to meet NFR-2 house wording for the injected rng (the module's own pre-existing parameter docs otherwise untouched).

## Notes

### P3.T4.1 grep sweep (verbatim)

`grep -n "Math.random" --include="*.ts" src/game` (ripgrep), non-test sources,
head `7001a177` — 46 matches in 21 files; `shapeSorterLogic.ts` carries none
and is listed below with 0 for completeness. All are `= Math.random` on a `rng`
parameter declaration line, `rng: Rng = Math.random` (43 total), EXCEPT
`random.ts` lines 9 and 18 which are TSDoc prose ("`Math.random`") and line 21
which is the shared `shuffle` default itself. Per-file counts:

```
src/game/wordLogic.ts:           4 (lines 64, 99, 130, 154)
src/game/takeAwayLogic.ts:       2 (lines 70, 107)
src/game/storyOrderLogic.ts:     2 (lines 149, 168)
src/game/shapeSorterLogic.ts:    0
src/game/oddOneOutLogic.ts:      2 (lines 162, 234)
src/game/shadowMatchLogic.ts:    1 (line 73)
src/game/numberOrderLogic.ts:    2 (lines 43, 70)
src/game/random.ts:              3 (lines 9, 18, 21)
src/game/popFreezeLogic.ts:      4 (lines 83, 96, 113, 141)
src/game/musicalMemoryLogic.ts:  2 (lines 55, 71)
src/game/colorMatchLogic.ts:     2 (lines 57, 83)
src/game/patternBuilderLogic.ts: 2 (lines 80, 110)
src/game/bigSmallLogic.ts:       3 (lines 83, 108, 126)
src/game/animalTraceLogic.ts:    2 (lines 33, 95)
src/game/alphabetLogic.ts:       2 (lines 106, 131)
src/game/firstSoundsLogic.ts:    2 (lines 101, 136)
src/game/feelingsFacesLogic.ts:  1 (line 85)
src/game/addItUpLogic.ts:        2 (lines 69, 106)
src/game/moreLessLogic.ts:       2 (lines 45, 70)
src/game/decodeLogic.ts:         2 (lines 39, 107)
src/game/countLogic.ts:          2 (lines 54, 81)
src/game/memoryMatchLogic.ts:    2 (lines 85, 105)
```

(ShapeSorterScene.ts carries its Phase-2-explicit `Math.random` argument unchanged;
its grep proof lives in the Phase 2 evidence, not in this `src/game` sweep.)

### shapeSorterLogic carries zero matches

ShapeSorter's `generatePlaythrough` now inherits the default (no
`Math.random` literal in that file at all). Its earlier A5 edit that passed
`Math.random` explicitly had been a lint-clean but grep-breaking form; the
default makes the behavior identical AND keeps the invariant greppable at its
single source of truth (`shuffle`'s own default).

### History / provenance

- `1ecd8203` = "refactor(random): Thread the rng seam through the logic modules"; `7001a177` = "refactor(random): Inherit the shared shuffle default in shapeSorterLogic"; `75b0a082` = "style(random): Formatting and import order for the rng seam" (formatter/import-order fixes that landed after `1ecd8203`, plus this evidence file).
- Executor permissions denied `git stash`/`git reset` AND `pnpm exec biome check --write` (not a named verify command); instead the named project commands `pnpm format`/`pnpm check` did the automated fixing, plus targeted manual edits. Plain file deletion was also denied → the neutralized `goldenCapture.test.ts` placeholder stays untracked for the primary to delete.
- Gate reruns: the shapeSorterLogic default-inherit edit (commit `7001a177`) required a second full gate run — all eight layers were green over the final working-tree state, which is byte-identical to the committed state at `75b0a082`.

### Out-of-scope / pre-existing (do NOT fix in this phase)

- `src/__tests__/scenes/musicalMemoryScene.test.ts:294` `!` (biome warning; likely fixed by Phase 4 determinism work if the stub goes away there)
- `biome.json` `$schema` version info (biome migrate — project tooling, not track scope)
- `src/scenes/StoryOrderScene.ts` explicit `Math.random` call site (A4 keeps it explicit)
- `src/utils/completionEffect.ts` `Math.random()` calls (outside logic-module scope)

## Primary verification

- Date: 2026-10-25. Performed by the primary orchestrator (independent of the
  executor report).
- Working tree clean after deleting the untracked `goldenCapture.test.ts`
  placeholder (never committed; its 1 trivially-passing test accounts for the
  subagent's 124 files / 2690 tests vs this run's 123 / 2689).
- Commit range `0e99d768..75b0a082` = exactly the four reported commits, no
  merge commits.
- Files-changed scope check: diff matches the Touches list + the two reported
  AC-3 test additions (additive, plan-sanctioned P3.T3.1) + this evidence file.
  No off-Touches source files.
- Full `verify_phase` chain re-run: all eight layers exit 0. Test: 123 files,
  2689 passed. Coverage 97.80 stmts / 91.78 branch / 96.77 funcs / 98.74 lines
  (gates 90/85/88/95 all green). Bundle: shell entry 138.7 kB ≤ 200 kB; PWA 16
  passed; docs 5 passed.
- Spot-check `src/game/bigSmallLogic.ts`: trailing optional `rng: Rng =
  Math.random` on public exports, threaded into nested `selectToys(rng)` /
  `shuffle(..., rng)` / `createBoxes(factors, rng)` calls; house TSDoc wording
  present.
- Result: **verified** — phase accepted.
