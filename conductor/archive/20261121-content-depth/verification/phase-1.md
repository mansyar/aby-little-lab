# Phase 1 verification — Word & shape depth (track 20261121-content-depth)

Branch: `feat/20261121-content-depth`

## Result

**FULL VERIFICATION: PASS.** The full `vitest run` suite is green (153 files,
3332 tests), the doc validator reports 5 passed / 0 failed, and both `pnpm check`
and `pnpm typecheck` are clean. All 15 stale count assertions previously reported
as blockers were resolved in the follow-up, now that the primary expanded the
Phase 1 Touches to cover those test files, the living test-count doc lines and
`PatternBuilderScene.ts`. The primary also accepted the `PatternBuilderScene.ts`
deviation (compile-forced by widening `ShapeType`, behavior-neutral).

## Commands and exit codes (run separately, no `&&` chains)

| Command | Exit code | Evidence |
| --- | --- | --- |
| `pnpm exec vitest run src/__tests__/game/decodeLogic.test.ts src/__tests__/game/shapeSorterLogic.test.ts` | 0 | 2 files passed, 57 tests passed |
| `pnpm exec vitest run` (full suite) | 0 | 153 files passed, 3332 tests passed |
| `node scripts/validate-docs.js` | 0 | "Results: 5 passed, 0 failed" — includes "The living docs state the current test-suite truth" |
| `pnpm check` | 0 | "Checked 339 files … No fixes applied." |
| `pnpm typecheck` | 0 | `tsc --noEmit` and e2e `tsc` both clean |

## AC table

| AC | Requirement | Evidence | Status |
| --- | --- | --- | --- |
| AC-1 | `WORD_POOL.length ≥ 60` plus tier/confusable invariants | `WORD_POOL` is 60 (27 tier-3, 33 tier-4). `decodeLogic.test.ts` asserts `length >= 60`, tier matches word length, both tiers ≥10, no duplicate words, unique registered prompt keys, and confusable-family guards over 200 samples. `wordLogic.test.ts` pins the exact 60 words, 27/33 tiers and the 60-key known-texture bijection. `DECODE_POOL` is `[...WORD_POOL]`, so Decode It inherits the expansion. | PASS |
| AC-4 | `ALL_SHAPES.length ≥ 24` plus easy/hard partition | `ALL_SHAPES` is 24 (18 original + 6 new: cube, cross, chevron, capsule, sector, parallelogram). `EASY_SHAPE_POOL` = 12, `HARD_SHAPE_POOL` = 13, both subsets with ≥9 unique shapes. Test asserts count, uniqueness, band distinguishability, and a fail-loud `ShapeType → shape_<name>` art-key check. | PASS |
| AC-5 (partial) | Two variants per word/shape pool; variant selection does not alter rule logic | `WORD_VARIANTS` (animals-and-food, everyday-objects) and `SHAPE_VARIANTS` (curvy, angular), each with a pure `wordVariantPool` / `shapeVariantPool` selector. Tests assert exactly 2 per pool, non-empty strict subsets with unique keys, pure selection, and byte-identical `generateWordRound`/`buildPlaythrough`/`generatePlaythrough` output after opting in. Rule functions were not modified. | PASS |

## Implementation notes

- All 32 new words are 3 or 4 letters, map to 32 distinct **already-registered**
  prompt texture keys (31 preloaded keys + the new `shape_cube`), and were added
  without changing any rule function. `mascot_idle` remains OWL-only.
- The 6 new shape SVGs are original geometric artwork authored in-repo, using
  the same 512×512 viewBox, pastel fills and `#2D3748` stroke as existing
  `shape_*.svg` files. No downloads, dependencies or licences (NFR-5).
- `promptTexture` validity is now checked against the actual art groups the
  Word scene preloads (derived from `animals`/`food`/`items`/`shapes`/`toys`
  plus the two shell keys), mirroring `buildShellAssets`' fail-loud miss guard.
- Stale counts were derived from source, not guessed: 60 words (27/33 tiers) from
  `wordLogic.ts`; 24 shapes from `shapeSorterLogic.ts`; 145 group keys and 199
  total app assets from the art groups; 201 distinct keys from the shell + group
  union; 3332 tests from the full green `vitest run`.
- Living test-count claims updated from 3,323 to 3,332 in `README.md`,
  `docs/TDD.md` (2 occurrences) and `docs/perf-baseline.md` (4 occurrences).
  The file count stays 153 (no test files added or removed).

## Deviations

1. **One scene file touched.** `src/scenes/PatternBuilderScene.ts:18` holds a
   `Record<ShapeType, string>` literal. Expanding `ShapeType` (explicitly
   required by the brief) makes typecheck fail unless six entries are added.
   Six one-line entries were added so `pnpm typecheck` passes. **ACCEPTED by the
   primary**: compile-forced by the widened union, behavior-neutral.
2. **Prewarm art-key list synced in source.** `src/game/hub/prewarm.ts` had a
   hardcoded `SHAPES_KEYS` list of 18 entries. The `prewarm.test.ts` expectation
   is *derived* from the 24-key art group, so the correct fix was to add the six
   new shape keys to `SHAPES_KEYS` in source (not to weaken the test). This
   keeps the prewarm queue covering every shape the shape-sorter game draws.
3. **Variant modules added** as `src/game/wordVariants.ts` and
   `src/game/shapeVariants.ts` (permitted: "new variant data modules").

## Blockers

None. All 15 previously reported stale count assertions were resolved in the
follow-up and are now in scope per the primary's updated Phase 1 Touches
(`wordLogic.test.ts`, `groupIntegrity.test.ts`, `shellOwnership.test.ts`,
`preloadArtGroups.test.ts`, `textureTiers.test.ts`, `preloadScene.test.ts`,
`prewarm.test.ts` + `prewarm.ts`). The full suite, doc validator, biome check and
typecheck are all green.

## Flake fix (follow-up)

- **Flake:** `wordLogic.test.ts` "draws targets uniformly within each tier"
  sampled only 200 playthroughs. With the expanded tier-4 pool (15 → 33), each
  playthrough makes just one tier-4 draw, so any given word was missed with
  probability `(32/33)^200 ≈ 0.2%` — about a 7% chance per run that at least one
  of the 33 tier-4 words was absent. A primary `verify_phase` run missed `CUBE`;
  an earlier full-suite run happened to pass.
- **Fix:** raised the sample count to 1500 (`COVERAGE_SAMPLES`), keeping the
  strict "every tier-3 and tier-4 word appears" assertions unchanged. Miss
  probability becomes `(32/33)^1500 ≈ 9e-21` per word, effectively deterministic.
  Test count is unchanged (3332), so living test-count docs need no edit.
- **5× stability run:** `pnpm exec vitest run src/__tests__/game/wordLogic.test.ts`
  exited 0 on five separate consecutive runs (44 tests passed each time).
  Re-checks: full suite 153 files / 3332 tests passed (exit 0);
  `node scripts/validate-docs.js` 5 passed / 0 failed (exit 0); `pnpm check` exit 0;
  `pnpm typecheck` exit 0.
