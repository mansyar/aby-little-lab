# Phase 4 — The scene speaks the group

- Track: 20261115-hub-game-groups
- Branch: feat/20261115-hub-game-groups
- Base / Head: `703b12ad` / (implementation commit below)
- Date: 2026-11-15
- Result: verified

## Commands

| Layer | Command | Exit | Summary |
|---|---|---|---|
| static | `pnpm check` | 0 | Biome: 322 files checked, no fixes applied |
| static | `pnpm typecheck` | 0 | `tsc --noEmit` plus the e2e project |
| unit | `pnpm test -- --run` | 0 | 147 files, 3,203 tests passed |
| coverage | `pnpm test:coverage` | 0 | statements 97.39 / branches 92.07 / functions 96.4 / lines 98.35, above 90/85/88/95 |
| build-artifact | `pnpm build` | 0 | built; shell entry `index-DULMoZ9v.js` = 179.5 kB |
| build-artifact | `node scripts/validate-bundle.js` | 0 | Phaser vendor chunk isolated; shell entry 179.5 kB ≤ 200 kB |
| build-artifact | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed; precache 59 entries / 1776.95 KiB |
| documents | `node scripts/validate-docs.js` | 0 | 5 passed, 0 failed |

Run as one chain in this turn; the chain's final exit was 0. The first run failed
only on `validate-docs`, whose living-count check the docs refresh below fixed;
every other layer passed on both attempts.

## What the bridge now reports on a filtered board

`window.__abyE2E.hubGroups()` answers from the live row and the live selection:

```
{ selected: "numbers",
  chips: [ { id: "all", x: 247, y: 66 }, … { id: "stories", x: 777, y: 66 } ] }
```

`hubTiles()` keeps publishing the id of the game, not the slot: with Numbers
selected on the wide board it returns ids `10, 12, 15, 16, 19`, and with Stories
selected on a paged viewport it returns `20, 21` — the registry indexes
`visibleTileIndexes` hands the grid, not the 0-based page slots.

## Acceptance

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| AC-5 | A chip tap calls `speakSentence` with the group's spoken name and the current SFX setting; with SFX off it is silent | `hubScene.test.ts` — "speaks the selected group's name with the live SFX flag": Numbers → `("Numbers and counting", true)`, then after `updateSettings({ sfxEnabled: false })` All → `("All games", false)`, which the wrapper treats as silence | pass |
| AC-9 | The bridge reports the selected group and each chip's centre, and tile ids stay registry indexes on a filtered board | `hubScene.test.ts` — "publishes the chip row's live centres and the selection", "keeps registry indexes as tile ids on a filtered board", "…on a filtered paged board"; `e2eBridge.test.ts` — the three `hubGroups` tests | pass |
| FR-8 | Tapping a chip speaks that group's spoken name through `speakSentence(name, getSettings().sfxEnabled)`, All as "All games" | `HubScene`'s `onSelectGroup` dep; `selectionSpokenName` supplies all six sentences | pass |
| FR-11 | The `?e2e=1` bridge publishes the selection and each chip's live centre, and `e2eHubTiles()` stays truthful on a filtered board | `e2eHubGroups()` on `HubScene`, `groupChipPoints()` on `HubGrid`; the bridge stays inert without `?e2e=1` (its gate tests are unchanged and still pass) | pass |

## Decisions

| ID | Taken | Authority |
|---|---|---|
| D6 | The grid reports a selection through the optional `onSelectGroup` dep; `HubScene` implements it as `speakSentence`, which re-reads the SFX toggle on every call. No new audio cue, no new asset | spec D6 |
| D9 | `e2eHubGroups()` returns `{ selected, chips: [{ id, x, y }] }` from the live objects, and `e2eHubTiles()` maps drawn slots back to registry indexes | spec D9 |

Both entries are mirrored in `.conductor/runs/20261115-hub-game-groups/freebuff/decisions.md`.

## Evidence

- `src/scenes/HubScene.ts` — `onSelectGroup` wired to `speakSentence(selectionSpokenName(selection), getSettings().sfxEnabled)`;
  `e2eHubTiles()` chooses the selection's registry indexes whenever the board is
  filtered and keeps the page slice for an unfiltered paged board; new
  `e2eHubGroups()`.
- `src/game/hubGrid.ts` — `groupChipPoints()`, read from the chip views' own
  centres.
- `src/game/hub/groupChips.ts` — `ChipView` carries the chip's live centre.
- `src/game/e2eBridge.ts` — `E2EHubChip`, `E2EHubGroups`, the `hubGroups()`
  accessor and its `{ selected: "all", chips: [] }` fallback for a scene that
  publishes no row.
- `src/__tests__/scenes/hubScene.test.ts` — the speech spy replaces the stub that
  only exposed `unlockSpeechForUserGesture`; three added tests (speech,
  chip centres + selection, filtered ids on both layouts).
- `src/__tests__/game/e2eBridge.test.ts` — three added `hubGroups` tests, the
  frozen-key list restated with `hubGroups`.
- Seven tests added (3,196 → 3,203).

## Deviations

- **P4.T1's test wording vs FR-8/AC-5.** The plan's task line says the test proves
  "no call at all when the toggle is off"; the spec says the tap speaks "through
  `speakSentence(name, getSettings().sfxEnabled)`", and AC-5 says the call carries
  "the current SFX setting". Followed the spec: the call is made with `false` and
  the wrapper is what stays silent. The test asserts that flag, which is the same
  behaviour a voiceless device gets; skipping the call would have made the spoken
  name unreachable to the only component that knows about voices.
- **`README.md`, `docs/TDD.md`, `docs/perf-baseline.md` — outside this phase's
  `Touches`.** `scripts/validate-docs.js` derives the suite truth from the tree, so
  seven new tests required refreshing three stated counts (3,196 → 3,203).
  Numbers only.

## Notes

`run_file_change_hooks` reported that file-change hooks are not supported in this
environment; the phase gate covers the same ground.

Chip centres are read from the views rather than recomputed through
`chipCenter()`, so the published points are what the row drew even if a future
layout change moves it. The bridge still has no setter: selecting a group is a tap
on the row, exactly as a child does it.
