# Phase 4 verification — Hub, progress and paging integration

- **Track:** `20261020-story-sequencing` — Story Order, Game 22
- **Phase:** 4 — Hub, progress and paging integration
- **Date:** 2026-10-20
- **Branch:** `feat/20261020-story-sequencing`
- **Phase base:** `cce5737`
- **Task commits:** `af66ccb` (tile), `0a52ac2` (paging), `e25972b` (progress)
- **Result:** verified — the full chain passed with exit 0

## What changed

### `src/game/hubTiles.ts`

Appended the 22nd `GAME_TILES` entry, after Feelings Faces, with no icon
override (the tile art is the whole tile):

```ts
{ sceneKey: "StoryOrder", gameId: "story-order", label: "Story Order", tileKey: "tile_story_order" }
```

The existing 21 entries and their order are untouched; the entry is appended
only. The tile and sticker art already exist from Phase 3
(`tile_story_order` / `sticker_story_order` in `PreloadScene`).

### `src/game/hubPaging.ts`

- `HUB_TILE_COUNT` 21 → **22**; `PAGE_SIZE` stays 10 and `PAGE_COUNT` stays 3,
  so the pages are 10 + 10 + 2.
- The `PAGE_SIZE` / `PAGE_COUNT` doc comments now describe a 22-game hub.

No maths changed: `pageTileIndexes`, `pageOf` and `pagedTilePosition` are
data-driven off `HUB_TILE_COUNT`, and the partial-page centring added for the
one-tile page already narrows the column box for two tiles.

### `src/game/hubGrid.ts` (comments only)

Three doc comments still said "21 tiles / rows 6/6/6/3"; they now say 22 tiles
and rows 6/6/6/4. **No code, constant or geometry changed** — `GRID_COLS = 6`
and `GRID_ROWS = 4` already accommodate the fourth row, and the layout was
proved to fit by the existing containment assertions (see AC-1 below).

### `src/components/settings/ProgressOverlay.ts`

Appended the Story Order row to `PROGRESS_GAME_ROWS` as the 22nd game
(`{ gameId: "story-order", label: "Story Order", tileKey: "tile_story_order" }`)
and updated the table's doc comment to "22 games". With
`PROGRESS_PAGE_SIZE = 6` the report pages as 6 + 6 + 6 + 4, so the page count
stays 4 (`1 / 4` … `4 / 4`) and only the last page grows from three rows to
four.

### Tests

The five brief-listed suites were updated: `hubTiles.test.ts`,
`hubPaging.test.ts`, `hubGrid.test.ts`, `hubScene.test.ts`,
`SettingsPanel.test.ts`. Six further suites that instantiate the real Hub or
the real Progress overlay and hard-code 21 were also updated (declared as
deviations below). Every containment and coverage assertion that existed
before still exists; only counts were raised, plus new assertions for the
two-tile page and the four-row last page.

## Commands

The exact phase chain was run as one command:

```
pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js
```

| Command | Result |
| --- | --- |
| `pnpm check` | exit 0 — 206 files, 0 errors (pre-existing schema-version info and `noNonNullAssertion` warning at `musicalMemoryScene.test.ts:294`) |
| `pnpm typecheck` | exit 0 — clean |
| `pnpm test -- --run` | exit 0 — 103 files, **2,205 tests** (2,202 carried + 3 new) |
| `pnpm test:coverage` | exit 0 — statements **98.11%**, branches **90.54%**, functions **98.04%**, lines **98.94%** (gates 90/85/88/95) |
| `pnpm build` | exit 0 — 301 modules; shell `index-cmeS8uaq.js` **200.12 kB raw** |
| `node scripts/validate-bundle.js` | exit 0 — one Phaser chunk; shell **195.4 kB ≤ 200 kB** |
| `node scripts/validate-pwa.js` | exit 0 — 15/15 |

Two intermediate runs failed and were fixed inside this phase: one Biome
format complaint on a multi-line `.map().sort()` chain, and one assertion that
read the incoming page's slide-in x instead of its settled x. Both were test
text only; no production behaviour changed between runs.

## Acceptance criteria

| ID | Result | Evidence |
| --- | --- | --- |
| AC-1 | Pass | 22nd tile renders at **x = 595, y = 591** (144 × 116, spans x 523–667, y 533–649) inside 1024 × 768; row 4 holds four tiles at x = 97, 263, 429, 595. `hubScene.test` "renders all 22 tiles fully inside the 1024×768 canvas" keeps every `x ± width/2` and `y ± height/2` containment check and raises the count to 22; "preserves the 6×4 grid geometry" asserts `[6, 6, 6, 4]`. The tile's icon, label and sticker state come from the single `GAME_TILES` row (`tile_story_order`), and "launches Story Order from the 22nd tile on the last page" records a play for `story-order`. |
| AC-8 | Pass | Learning Progress shows 22 rows with Story Order last (`SettingsPanel.test` "shows Story Order as the 22nd row, reading its own progress record"; the last page holds exactly 4 rows). The hub renders 22 tiles as 6/6/6/4 wide and **10 + 10 + 2 paged**: `pageTileIndexes(2)` is `[20, 21]` and the page-3 tiles are centred at **x = 414** (Feelings Faces) and **x = 610** (Story Order), y = 276, 176 × 196 each — midpoint 512. `hubPaging.test` "covers all 22 tiles exactly once across pages" asserts the union equals `[...Array(22).keys()]`. |
| AC-10 | Pass | The full chain above passed with exit 0. |

Adjacent coverage: FR-1 (22nd tile, `sceneKey`/`gameId`/`tileKey`), FR-9
(hub tile list, progress row, wide rows 6/6/6/4, paged 10 + 10 + 2, sticker
key exercised by the shelf assertions). Tile-order and uniqueness invariants
(`HUB_TILE_COUNT === GAME_TILES.length`, unique `gameId`/`sceneKey`/`tileKey`)
are preserved and raised to 22.

## Task commit map

| Task | Commit | Contents |
| --- | --- | --- |
| P4.T1 — hub tile | `af66ccb` | 22nd `GAME_TILES` entry; `hubTiles.test.ts` raises uniqueness, canonical-key and ordering assertions to 22 |
| P4.T1.2 — wide grid | `0a52ac2` | `hubGrid.ts` comments corrected; grid/scene suites assert 22 tiles, rows `[6, 6, 6, 4]`, and full-canvas containment |
| P4.T2 — paged hub | `0a52ac2` | `HUB_TILE_COUNT = 22`; `pageTileIndexes(2) = [20, 21]`; two-tile page centring (pure and scene level); all-22-once coverage |
| P4.T3 — Learning Progress | `e25972b` | 22nd `PROGRESS_GAME_ROWS` row; `SettingsPanel.test` and `ProgressOverlay.test` assert the 6 + 6 + 6 + 4 paging and the row's own record |

## Deviations

1. **Mechanical count edits in the five brief-listed suites.** Consequence of a
   22nd game, not weakened assertions. `hubTiles.test.ts` 21 → 22 (and the
   Feelings Faces ordering test widened to keep tile 21 asserted and add tile
   22); `hubPaging.test.ts` last page `[20]` → `[20, 21]`, all-22 coverage,
   constants; `hubGrid.test.ts` wide 21 → 22, unearned slots 20 → 21, last
   page 1 → 2 tiles; `hubScene.test.ts` wide 22, empty slots 19 → 20, rows
   `[6, 6, 6, 3]` → `[6, 6, 6, 4]`, mobile/desktop rebuild counts 21 → 22;
   `SettingsPanel.test.ts` last page 3 → 4 rows.
2. **`src/game/hubGrid.ts` (outside `Touches`) — three comments only.** The
   preamble, class doc and `buildWideGrid` doc said "21 tiles / rows 6/6/6/3".
   The plan's P4.T1.2 asks for the layout comments to be corrected; no code,
   constant or geometry line changed, and no test required a layout change.
   Declared rather than silently left stale.
3. **`src/__tests__/components/settings/ProgressOverlay.test.ts` (outside
   `Touches`).** Last page row count 3 → 4 and its comment 21 → 22 games. It
   drives the real `ProgressOverlay`, so it cannot pass unmodified.
4. **Five more suites that build the real Hub (outside `Touches`).**
   - `src/__tests__/scenes/feelingsFacesFlow.test.ts` — 22 tiles/icons, and
     Feelings Faces asserted as 21st (not last) with Story Order last; empty
     slots 20 → 21.
   - `src/__tests__/scenes/firstWordsIntegration.test.ts` — tile count 21 → 22.
   - `src/__tests__/scenes/hubEngagement.test.ts` — empty slots 21 → 22,
     20 → 21 and 21 → 22 across the reset case.
   - `src/__tests__/scenes/navigation.test.ts` — icon count and icon set
     (+ `tile_story_order`), per-shelf `hasSticker` lookups 21 → 22 and
     42 → 44, re-render start index 21 → 22.
   - `src/__tests__/scenes/sceneLifecycle.test.ts` — 20 → 21 and 21 → 22
     empty slots across the revisit/reset case.

   Reason: these suites build the real Hub grid and shelf, so the 22nd tile
   changes their counts. No assertion was removed or loosened.

No file outside the above was modified; `plan.md`, `spec.md`, `metadata.json`,
`tracks.md`, `index.md`, `product.md`, `review.md` and `pr.md` are untouched.

## Notes for the primary agent

- **`GAME_SCENE_KEYS` navigation loop is already 22-aware.** `navigation.test`
  iterates `GAME_SCENE_KEYS`, so the Story Order tile is now exercised for
  navigation without a new case; only its counts needed raising.
- **`hubGrid.ts` comments were the only out-of-`Touches` production edit.**
  If the primary prefers to keep that file completely frozen in Phase 4, the
  commit can be reviewed as comment-only — zero behavioural diff.
- **`SettingsPanel.test.ts` had a stale title** ("all 20 game rows … 6+6+6+2")
  that predated this phase; it is now "22 … 6+6+6+4", matching the data.
- **Shell headroom is thin.** `validate-bundle` measures 195.4 kB against the
  200 kB ceiling (the raw file is 200.12 kB; the harness reports 195.4 kB). The
  later docs phase should not add shell code.
- Coverage moved slightly up (98.11 / 90.54 / 98.04 / 98.94) with no new
  thresholds; all four gates remain far above their limits.

## Primary verification

Run independently at the phase head (`7f436de`); the eleven changed suites
were read as diffs rather than trusted from the report.

| Layer | Result |
| --- | --- |
| `pnpm check` | pass - 204 files, 1 pre-existing warning, 1 schema info note |
| `pnpm typecheck` | pass |
| `pnpm test -- --run` | pass - 103 files / 2,205 tests |
| `pnpm test:coverage` | pass - 98.11 statements / 90.54 branches / 98.04 functions / 98.94 lines |
| `pnpm build` | pass - shell `index-cmeS8uaq.js` 200.12 kB raw |
| `node scripts/validate-bundle.js` | pass - shell 195.4 kB <= 200 kB |
| `node scripts/validate-pwa.js` | pass - 15 / 15 |

### Test-edit audit (NFR-2)

Every diff in the eleven suites is a count, index or label change caused by the
22nd game; no assertion was deleted or loosened, and two were strengthened:

- `feelingsFacesFlow` now asserts `icons.at(-2) === "tile_feelings_faces"`
  **and** `icons.at(-1) === "tile_story_order"`, so the append-only order is
  pinned rather than merely counted.
- `navigation` keeps the full tile-key list and raises the sticker-lookup
  counts (21 -> 22, 42 -> 44, results[21] -> results[22]) instead of dropping
  the exact-call assertions.
- `hubEngagement`/`sceneLifecycle` keep both the fresh and re-rendered shelf
  counts; `hubScene` keeps its 1024x768 containment check at 22 tiles;
  `hubTiles`/`hubPaging` keep the uniqueness and cover-every-tile-once
  invariants.

`hubGrid.ts` is comment-only (`6/6/6/3` -> `6/6/6/4`): the layout is
data-driven, so the 22nd tile falls into column 3 of row 4 with no geometry
change, which is why no layout code moved.

### Geometry check

Wide grid origin `(25, 119)`, tile centres `x = 97 + 166c`, row centres
`y = 177 + 138r`; the 22nd tile (index 21) lands at `(595, 591)` inside the
1024x768 stage with the same margins the 21-tile grid had. Paged hub: three
pages of 10 + 10 + 2, the last page's two tiles centred at `x = 414/610` about
the 512 centreline.

### Headroom

Shell 195.4 kB of the 200 kB gate - 4.6 kB left. Phase 5 is documentation only,
so it must add no shell code; that constraint is now recorded here for review.
