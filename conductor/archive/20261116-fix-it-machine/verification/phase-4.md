# Phase 4 — Roster integration: verification

- **Track:** `20261116-fix-it-machine`
- **Phase:** 4 of 6 — Roster integration (D9, D10, D11)
- **Branch:** `feat/20261116-fix-it-machine`
- **Evidence log:** `.conductor/evidence/20261116-fix-it-machine/phase-4-gate.log` (gate exit 0)
- **Pre-fix run:** `.conductor/evidence/20261116-fix-it-machine/phase-4-prefix.log` (5 failures, all roster literals)

## Verification command

```
pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage &&
pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js &&
node scripts/validate-docs.js
```

**Exit status: 0.**

| Step | Result |
| --- | --- |
| `pnpm check` (biome) | clean, 336 files |
| `pnpm typecheck` (tsc --noEmit) | no errors |
| `pnpm test -- --run` | 153 files / 3,300 tests passed |
| `pnpm test:coverage` | statements 97.07 %, branches 90.73 %, functions 96.19 %, lines 98.24 % (all at or above the floors) |
| `pnpm build` | entry `index-BiqtO09P.js` 190.89 kB / gzip 48.35 kB |
| `validate-bundle.js` | shell entry 186.4 kB ≤ 200 kB; Phaser vendor chunk present; 51 chunks |
| `validate-pwa.js` | 16/16; 51 chunks, 51 precached; 63 precache entries (1826.19 KiB) |
| `validate-docs.js` | 5/5, including registry ⇄ README ⇄ PRD ⇄ TDD list parity |

## What the phase did

### Task 1 — registry row

`src/game/gameRegistry.ts` gains one row after Robot Path:
`{ gameId: "fix-it-machine", group: "thinking", sceneKey: "FixItMachine", label: "Fix-It Machine", tileKey: "tile_fix_it_machine", stickerKey: "sticker_fix_it_machine" }`.
`GameId` and `GAME_IDS` gain `"fix-it-machine"`, so `GameId`-keyed `Record`s fail the type checker until each is extended — the compiler drove the rest of the phase. The Hub now derives 24 tiles, 24 progress rows and 24 sticker-shelf slots, and the thinking domain grows 7 → 8 (row counts 5/5/8/4/2, pages 6/6/6/6 on the wide grid, 10/10/4 on the phone pager).

### Task 2 — shell assets and counts

`SHELL_ASSETS` in `PreloadScene` derives from the registry, so the two new files (`ui/tiles/tile_fix_it_machine.svg`, `stickers/sticker_fix_it_machine.svg`) enter the boot set: **62 keys** (was 60), 46 derived game rows plus 14 literal shell rows, 48 game entries against 62 keys. `shellOwnership`, `preloadScene`, `textureTiers` and `navigation` hold the new literals (61 → 62 shell keys, 193 → 195 keys in the shell-plus-groups union, 55 → 57 boot textures).

**Deviation from the plan, logged:** the plan expected the app texture-key count to move 193 → 201. It moves to **195**, because the plan counted the sixteen new machine keys as app keys while the union the docs and the tier table describe is shell + the twelve `game/art` groups; Fix-It Machine's sixteen keys are scene-local (like Robot Path's six) and are reached through `fixItMachineArt`, which the tests also assert.

### Task 3 — audio identity

`audioIdentity.ts` gains `"fix-it-machine"`: `pitchOffsetSemitones: 2`, `waveform: "triangle"`, `tempo: 1.05`, plus its three contours. `audioIdentity.test.ts` covers 24 entries; the 24 offsets, waveforms and tempos stay pairwise distinct.

### Task 4 — art groups and prewarm

`hub/artGroups.ts` gains the `machine` group (the sixteen `machine/*` SVGs) and its `ART_GROUPS_BY_GAME` row; `hub/prewarm.ts` gains `MACHINE_KEYS` and the `ART_KEYS_BY_GAME` row. `prewarm.test.ts` resolves every key of all 24 games and asserts the group/loader key sets match both ways, so `sceneRegistry` and the art tables cannot drift.

### Task 5 — scene registry

`sceneRegistry.ts` lazy-loads `FixItMachineScene` under the `FixItMachine` key; the Phase 3 `as GameId` cast in `FixItMachineScene.gameId()` is gone now that the union has the id. `sceneRegistry.test.ts` moves 23 → 24 stubbed scenes with the new loader in `expectedByKey`.

### Task 6 — documents

The README game list gains a Fix-It Machine bullet, PRD gains §3.24 (and the §2.2 table rows 23–24 with the domain counts), TDD §4.5 gains row 24 and restates the base-class counts (14 direct `ChoiceRoundScene`, 2 through `GroupMathScene`, 8 `GameSceneBase`; 22 of 24 adaptive). Roster prose and counts are restated wherever they were number-bearing: 23 → 24 games and scenes, twenty-three → twenty-four, 60 → 62 shell keys, 193 → 195 keys, 244 → 262 art files, 55 → 57 boot textures, 49 → 51 chunks, and the measured perf figure (entry 186.4 kB / 190.89 kB Vite / 48.35 kB gzip, 63 precache entries at 1826.19 KiB) in `docs/perf-baseline.md` and the README.

## Deviations and notes

1. **Key-count target (above):** 195, not 201, with the reason. GAME_REGISTRY parity, the tier table and the ownership test all describe the same union, and the tests derive 195 rather than assert the plan's estimate.
2. **Perf figures re-measured after formatting:** the first build of this phase produced `index-DgtqnXuY.js`; `biome check --write` reformatted three test files, and the gate's build produced `index-BiqtO09P.js` at the same size. The documents cite the gate run. The two doc-only edits that followed were re-checked with `node scripts/validate-docs.js` (5/5) and touch no code.
3. **Scene-local art:** the sixteen machine SVGs travel with the game's own chunk like Robot Path's six; nothing was added to the boot payload beyond the tile and sticker icons.

## Test literals moved in this phase

`gameRegistry` (PRD order, pre-track tile snapshot, group totals 5/5/8/4/2, invariant titles), `sceneRegistry` (24 keys, new loader), `shellOwnership` (62), `preloadScene` (62 / 195), `textureTiers` (62 / 195), `audioIdentity` (24), `progressLogic` (24), `hubTiles` (24), `hubGrid` (24 tiles, 30 texts, 23 slots, last page 4), `hubPaging` (10+10+4, four-tile centring), `hubGroups` (thinking 8, 5/5/8/4/2), `prewarm` (13 groups), `hubScene` (24 tiles, 6/6/6/6 rows, 22 empty slots), `navigation` (62 keys, 24 tile icons), `sceneLifecycle` (24 empty slots), `feelingsFacesFlow`, `firstWordsIntegration`, `hubEngagement`, `insightsSummary` ("of 24 games"), `ProgressOverlay` (six rows), `SettingsPanel` (6+6+6+6).
