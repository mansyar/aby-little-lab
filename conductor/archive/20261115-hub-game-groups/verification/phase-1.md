# Phase 1 — The groups, as data

- Track: 20261115-hub-game-groups
- Branch: feat/20261115-hub-game-groups
- Base / Head: `703b12ad` / `5a78c970`
- Date: 2026-11-15
- Result: verified

## Commands

| Layer | Command | Exit | Summary |
|---|---|---|---|
| static | `pnpm check` | 0 | Biome: 318 files checked, no fixes applied |
| static | `pnpm typecheck` | 0 | `tsc --noEmit` plus the e2e project |
| unit | `pnpm test -- --run` | 0 | 145 files, 3,169 tests passed |
| coverage | `pnpm test:coverage` | 0 | statements 97.4 / branches 92.07 / functions 96.4 / lines 98.34, above 90/85/88/95 |
| build-artifact | `pnpm build` | 0 | built; shell entry `index-6KfoG86V.js` = 173.0 kB |
| build-artifact | `node scripts/validate-bundle.js` | 0 | Phaser vendor chunk isolated; shell entry 173.0 kB ≤ 200 kB |
| build-artifact | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed |
| documents | `node scripts/validate-docs.js` | 0 | 5 passed, 0 failed |

Run as one chain in this turn; the chain's final exit was 0. (The first attempt
failed only on `validate-docs`, whose living-count check the docs refresh below
fixed; every other layer passed on both attempts.)

## Acceptance

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| AC-1 | The group table decomposes the registry exactly 5/5/6/4/2 with every game in one group and no group empty | `src/__tests__/game/hubGroups.test.ts` — "splits the 22 games 5/5/6/4/2…", "draws exactly its own games, in registry order"; `src/__tests__/gameRegistry.test.ts` — "assigns every game to a declared group…", "keeps the 5/5/6/4/2 totals the spec states" | pass |
| FR-1 | Every registry entry carries a typed `group` | `src/game/gameRegistry.ts` (22 `group:` rows, `GameRegistryEntry.group: HubGroupId`) | pass |
| FR-5 | Registry order inside a group, declared order across chips | `visibleTileIndexes` filters the registry in order; the expected-members table asserts the order per group | pass |
| AC-1 (compile-time) | A `HubGroupId` without a table row fails typecheck | `HUB_GROUP_COVERAGE` mirroring `GAME_ID_COVERAGE`; test "proves at compile time that every group id has a row" | pass |

## Decisions

| ID | Taken | Authority |
|---|---|---|
| D1 | Five learning-domain groups in chip order All, Letters, Numbers, Thinking, Play, Stories; membership per spec FR-1; registry order inside each group | spec D1 |
| D5 | `group` on each `GAME_REGISTRY` entry, `HubGroupId` type-only in `src/types/index.ts`, words and glyph keys in `src/game/hubGroups.ts`, `GameTile`/`GAME_TILES` unchanged | spec D5 |

Both entries are mirrored in `.conductor/runs/20261115-hub-game-groups/freebuff/decisions.md`.

## Evidence

- `src/game/hubGroups.ts` — the group table, `visibleTileIndexes`, `tilesInGroup`,
  `groupForGame`, the three selection accessors and the coverage proof.
- `src/__tests__/game/hubGroups.test.ts` — 9 tests, including the literal membership
  table, the 5/5/6/4/2 counts, All-equals-22, one-word labels, `group_<id>` glyph keys,
  and both refusal paths.
- `src/__tests__/gameRegistry.test.ts` — two added tests (declared-group two-way
  coverage, the spec totals); every existing assertion unchanged.
- `src/game/gameRegistry.ts` — 22 `group:` rows plus the interface field.
- `src/types/index.ts` — `HubGroupId`.

## Deviations

- `README.md`, `docs/TDD.md`, `docs/perf-baseline.md` — outside this phase's `Touches`.
  `scripts/validate-docs.js` derives the suite truth from the tree and fails the gate
  whenever the living documents state an older count, so adding nine tests required
  refreshing three stated counts and four coverage percentages. Numbers and dates only;
  no prose, structure or claim changed, and the raw-fraction parenthetical in the TDD
  was replaced with the percentages the coverage run reports rather than recomputing
  counts that were not read.

## Notes

`run_file_change_hooks` reported that file-change hooks are not supported in this
environment; the phase gate covers the same ground (Biome, `tsc`, Vitest, coverage,
build, bundle, PWA and document validators).

`HUB_GROUPS` is declared with `as const satisfies readonly HubGroup[]`, so its ids are a
literal union and `HUB_GROUP_COVERAGE` can prove completeness at compile time while the
rows still widen to `HubGroup` for callers. `src/game/hubGroups.ts` imports the registry
and never the reverse, so the registry stays the only module the shell preload and the
scene loader table read for game identity.
