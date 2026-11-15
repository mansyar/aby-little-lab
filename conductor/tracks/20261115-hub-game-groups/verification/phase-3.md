# Phase 3 — Five glyphs, and the inventory that counts them

- Track: 20261115-hub-game-groups
- Branch: feat/20261115-hub-game-groups
- Base / Head: `703b12ad` / `cf47ccb1`
- Date: 2026-11-15
- Result: verified

## Commands

| Layer | Command | Exit | Summary |
|---|---|---|---|
| static | `pnpm check` | 0 | Biome: 322 files checked, no fixes applied |
| static | `pnpm typecheck` | 0 | `tsc --noEmit` plus the e2e project |
| unit | `pnpm test -- --run` | 0 | 147 files, 3,196 tests passed |
| coverage | `pnpm test:coverage` | 0 | statements 97.39 / branches 92.05 / functions 96.38 / lines 98.34, above 90/85/88/95 |
| build-artifact | `pnpm build` | 0 | built; shell entry `index-DRgg8V6M.js` = 179.0 kB |
| build-artifact | `node scripts/validate-bundle.js` | 0 | Phaser vendor chunk isolated; shell entry 179.0 kB ≤ 200 kB |
| build-artifact | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed; precache 59 entries / 1776.52 KiB |
| documents | `node scripts/validate-docs.js` | 0 | 5 passed, 0 failed |

Run as one chain in this turn; the chain's final exit was 0. The first run failed
only on `validate-docs`, whose living-count check the docs refresh below fixed;
every other layer passed on both attempts.

## Budgets (NFR-3, AC-8)

| Measure | Before (Phase 2) | After | Gate |
|---|---|---|---|
| Shell entry, `validate-bundle` | 176.9 kB | **179.0 kB** | ≤ 200 kB — pass |
| Precache | 54 entries / 1707.70 KiB | **59 entries / 1776.52 KiB** | recorded, no gate |
| Five new SVG files, on disk | — | **2,020 B (≈ 2.0 kB)** | ≤ 5 kB added to the precache list — pass |
| Shell keys | 53 | **58** | AC-8 |
| App keys (shell ∪ groups) | 186 | **191** | AC-8 |

The precache grew by the five rasterized glyphs plus their shell-row bytes; the
+2.1 kB on the entry is the five SVG strings and the tier rule, not new frames.

## Acceptance

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| AC-8 | The shell ships 58 keys / 191 app keys, the five `group_*` glyphs resolve to the icon tier, and the guard suites state those numbers | `preloadScene.test.ts` — "carries exactly the 58 documented shell keys", "leaves the shell and the groups owning 191 keys in total"; `shellOwnership.test.ts` — "ships exactly the 58 documented shell keys"; `groupIntegrity.test.ts` — "leaves exactly the 58 shell keys outside the groups, for 191 in total"; `textureTiers.test.ts` — "maps the Hub's group-chip glyphs to the icon tier, at a 40px display" | pass |
| FR-10 | Five glyphs ship as `src/assets/svg/ui/group_<id>.svg`, imported explicitly and rasterized at the icon tier | the five files; five `SHELL_ASSETS` rows after the derived block; `[/^group_/, "icon"]` in `TIER_RULES` | pass |
| NFR-3 | Shell ≤ 200 kB, new art ≤ 5 kB, both measured | the budgets table above | pass |
| D7 | One or two flat shapes each, 512 viewBox, 6px `#2D3748` outline, palette colours only | the five files (see the art note below) | pass |

## Art note (P3.T1)

Each file was rendered at 40px inside a 96×84 chip and at 160px in a throwaway
contact sheet served from the workspace and checked in the preview browser, then
the sheet was deleted before the commit:

- `group_letters` — cream rounded card, blue `A` with its crossbar: reads as a
  letter card at 40px.
- `group_numbers` — cream rounded card, blue `2`: reads as a numeral card at 40px.
- `group_thinking` — cream rounded square beside an orange five-point star.
- `group_play` — tilted cream face-down card with a green quaver note in front of
  it; the note is the smallest mark at 40px but stays legible.
- `group_stories` — cream face with two ink eyes and a wide smile.

All five parse through the preload path (`toDataUri` runs for every shell row in
`PreloadScene.preload`), which the `navigation` suite exercises on all 58 keys.
No gradient, no filter, no raster reference; palette colours only (`#FFF8E7`,
`#2D3748`, `#2B6CB0`, `#F6AD55`, `#68D391`).

## Decisions

| ID | Taken | Authority |
|---|---|---|
| D7 | Five flat storybook glyphs, explicit `SHELL_ASSETS` rows after the registry-derived block, with a `/^group_/ → icon` tier rule; the All chip's grid stays drawn | spec D7 |

Mirrored in `.conductor/runs/20261115-hub-game-groups/freebuff/decisions.md`.

## Evidence

- `src/assets/svg/ui/group_letters.svg`, `group_numbers.svg`, `group_thinking.svg`,
  `group_play.svg`, `group_stories.svg` — 357–510 B each.
- `src/scenes/PreloadScene.ts` — five imports, five explicit rows after
  `toy_teddy_bear`, and a docstring saying why they cannot be derived.
- `src/utils/textureTiers.ts` — `[/^group_/, "icon"]` after the `tile_` rule, and
  the tier docstring now names the chip glyphs at a 40px display.
- `src/__tests__/game/art/shellOwnership.test.ts` — the literal list and the count
  restated 53 → 58.
- `src/__tests__/game/art/groupIntegrity.test.ts` — list, 53 → 58 and 186 → 191.
- `src/__tests__/scenes/preloadScene.test.ts` — `NON_GAME_KEYS` gains the five
  group keys (nine → fourteen), 53 → 58, 186 → 191.
- `src/__tests__/scenes/navigation.test.ts` — the preload SVG count 53 → 58.
- `src/__tests__/utils/textureTiers.test.ts` — 53 → 58, 186 → 191, plus the new
  tier/scale test for the five keys.
- One test added (3,195 → 3,196).

## Deviations

- **`README.md`, `docs/TDD.md`, `docs/perf-baseline.md` — outside this phase's
  `Touches`.** `scripts/validate-docs.js` derives the suite truth from the tree, so
  the new test required refreshing three stated counts (3,195 → 3,196). Numbers
  only; the dated measurement records in `perf-baseline.md` were left as the
  history they document.
- **Stale prose left for Phase 5.** `docs/PRD.md:561` ("the 53 boot textures"),
  `docs/TDD.md:334/440` and `docs/perf-baseline.md:419` ("54 entries", "42
  chunks") still describe the pre-track shell. FR-12 puts the document rewrite in
  Phase 5, the document validator does not read those sentences, and rewriting
  them here would claim the chip row ships before its speech and journey phases.
  The phase's own measurement is recorded above.

## Notes

`run_file_change_hooks` reported that file-change hooks are not supported in this
environment; the phase gate covers the same ground.

The tier rule is ordered after `tile_` and before `mascot_`, so it can only match
`group_*` keys; no existing key begins with that prefix (checked by the tier
suite's 191-key sweep).
