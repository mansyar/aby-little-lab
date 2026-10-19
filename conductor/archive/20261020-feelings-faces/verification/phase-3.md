# Phase 3 — Gameplay scene (Feelings Faces, Game 21)

| Field | Value |
| --- | --- |
| Track | `20261020-feelings-faces` |
| Phase | 3 — Gameplay scene |
| Date | 2026-10-20 |
| Branch | `feat/20261020-feelings-faces` |
| Base commit | `4928293fa9af7db80ad5ca09046cc485d2aaeb47` |
| Head commit | `a7244bd` (verified tree; the evidence file itself lands in the commit after it) |
| Result | **verified** |

## Goal

A playable 6-round game wired to the hub, TTS, feedback, sticker award and
per-profile progress. Covers FR-1, FR-2, FR-3, FR-4, FR-7, FR-8, FR-9, FR-10
and AC-1, AC-2, AC-3, AC-6, AC-7, AC-8.

## Implementation

New scene `src/scenes/FeelingsFacesScene.ts` (350 L) extends `GameSceneBase` and
consumes Phase 1's pure logic — `drawScenarios()`, `buildRoundChoices()`,
`answer()`, `ROUND_COUNT` — it re-implements neither the ladder nor the scoring.

- **Layout**: three face cards (220×250, white fill + 4 px `#2D3748` outline,
  the suite's card treatment, `attachPressFeedback`) at y 474 carrying the
  `face_*` art at 180 px; the written rule line at `INSTRUCTION_Y` 112 with the
  shared `SpeakerButton` glyph beside it; six progress dots; back button;
  corner mascot.
- **Round flow**: `drawScenarios()` once per `create()`, three distinct
  emotions per round from `buildRoundChoices(roundIndex, target)`. The rule is
  spoken once at setup and replayed by tapping the glyph; round 1's scenario is
  deferred 2.6 s (`OPENING_SPEECH_DELAY`) so the shared `speakText` interruption
  path cannot truncate the rule.
- **Feedback**: correct tap → `playCorrect`, `createCompletionSplash` at the
  card, dot pop, mascot cheer, 700 ms `NEXT_ROUND_DELAY`, advance (round 6 →
  `completeGame("feelings-faces")`); wrong tap → `playIncorrect`, mascot nod,
  card + face wiggle (4°, or 2°/200 ms under `prefers-reduced-motion`), scenario
  re-spoken once, `nextRound` stays put and input is never locked, so repeated
  wrong taps can neither lock out nor skip.
- **Caption fallback**: when SFX is off, the engine is unavailable, or no voice
  is installed, the scenario renders as a written caption at y 250, the glyph is
  created muted (`MUTED_TINT` 0xa0aec0, alpha 0.6, static) and nothing is
  spoken — the round stays completable. The rule line is built from
  `SpeakerButton` rather than the base `createSpokenInstruction` because the
  base helper's glyph is private and only dims for the SFX toggle.
- **Completion**: shared `completeGame` — win animation, heart sticker on first
  completion only, 3 s auto-return to the Hub carrying `{ justEarned }`, and
  `recordGameResult` for plays/wins/accuracy/mastery.
- **Layout/registration**: `feelings-faces` added to `GameId` + `GAME_IDS`,
  lazy loader in `sceneRegistry`, hub tile 21 appended after Number Order (no
  icon overrides), wide grid reflowed to 6×4 (rows 6/6/6/3), paging 10 + 10 + 1,
  Learning Progress row 21 → pages 6+6+6+3.

## Commands

| Command | Exit | Result |
| --- | --- | --- |
| `pnpm check` | 0 | 193 files checked; 1 pre-existing warning (`musicalMemoryScene.test.ts:294` non-null assertion, untouched) and 1 pre-existing info (biome schema 2.5.5 vs CLI 2.5.10) |
| `pnpm typecheck` | 0 | `tsc --noEmit` clean |
| `pnpm test -- --run <8 files from the brief>` | 0 | 8 files, 216 tests passed |
| `pnpm test -- --run` (supporting) | 0 | 97 files, 2072 tests passed |

The exact verification command run:

```
pnpm check && pnpm typecheck && pnpm test -- --run src/__tests__/scenes/feelingsFacesScene.test.ts src/__tests__/scenes/sceneRegistry.test.ts src/__tests__/game/hubTiles.test.ts src/__tests__/game/hubGrid.test.ts src/__tests__/game/hubPaging.test.ts src/__tests__/game/progressLogic.test.ts src/__tests__/scenes/navigation.test.ts src/__tests__/scenes/sceneLifecycle.test.ts
```

## Acceptance criteria

| AC | Requirement | Evidence | Status |
| --- | --- | --- | --- |
| AC-1 | Hub renders 21 tiles; the 21st is "Feelings Faces" and launches the scene | `hubTiles.test.ts` (21 tiles, tile 21 after Number Order), `hubGrid.test.ts` (`rects(144,116)` × 21, last page activates index 20), `hubScene.test.ts` ("renders all 21 tiles fully inside the 1024×768 canvas (6×4 grid)"), `navigation.test.ts` (21 icons, 21 `hasSticker` lookups), `sceneRegistry.test.ts` (FeelingsFaces lazy loader resolves) | met |
| AC-2 | Six rounds, three distinct faces each, one spoken scenario per round | `feelingsFacesScene.test.ts` "renders the rule line… six progress dots", "shows the ladder's three distinct faces…" (`new Set(textures).size === 3`, matches `buildRoundChoices`), "speaks the rule once at round setup and the opening scenario after it", six-round traversal in "plays six rounds to a win…" | met |
| AC-3 | Matching face advances; wrong face stays on the round and re-speaks | "a correct tap plays the chime, splashes, fills the dot and advances", "a wrong tap wiggles, plays the gentle tone, re-speaks the scenario and stays on the round", "never locks out on repeated wrong taps" | met |
| AC-6 | With `speechSynthesis` mocked empty the caption renders and the round is completable | "renders a written caption and dims the glyph when the browser cannot speak", "falls back to the caption when the engine has no installed voice" (`vi.stubGlobal("speechSynthesis", { getVoices: () => [] })`), "falls back to the caption when the SFX toggle is off" — each then taps the match and advances | met |
| AC-7 | Sticker awarded exactly once and persisted per profile | "plays six rounds to a win: celebration, sticker once, justEarned and 3s auto-return" (`playSticker` once, `sticker_feelings_faces`, `scene.start("Hub", { justEarned })`); "does not award the sticker again on a repeat completion" (no `playSticker`, `scene.start("Hub")`); storage-backed `earnSticker`/`hasSticker` per active profile | met |
| AC-8 | Progress row shows plays, accuracy and a star after 3 wins | "records wins and accuracy on the progress row, starring after three wins" (`wins` 1→3, `correct` 6→18, `isMastered` false→true), "counts wrong taps in the accuracy…" (6 correct / 1 wrong), `ProgressOverlay` rows now 21 (`feelings-faces`/"Feelings Faces"/`tile_feelings_faces`), `ProgressOverlay.test.ts` last page 3 rows, `progressLogic.test.ts` covers all 21 games | met |

## Evidence paths

- `src/scenes/FeelingsFacesScene.ts` — the scene (new).
- `src/__tests__/scenes/feelingsFacesScene.test.ts` — 18 scene tests (new).
- `src/game/hubGrid.ts`, `src/game/hubPaging.ts`, `src/game/hubTiles.ts` — wide grid 6×4 at 144 px, pages 10+10+1, tile 21.
- `src/types/index.ts`, `src/scenes/sceneRegistry.ts` — `feelings-faces` id + lazy loader.
- `src/components/settings/ProgressOverlay.ts` — Learning Progress row 21.
- Updated count suites: `hubTiles.test.ts`, `hubGrid.test.ts`, `hubPaging.test.ts`, `hubScene.test.ts`, `navigation.test.ts`, `sceneLifecycle.test.ts`, `hubEngagement.test.ts`, `firstWordsIntegration.test.ts`, `hubPlayTime.test.ts`, `progressLogic.test.ts`, `storage.test.ts`, `sceneRegistry.test.ts`, `ProgressOverlay.test.ts`, `helpers/gameScenes.ts`.

## Deviations

| File | Reason |
| --- | --- |
| `src/game/hubGrid.ts` | Outside `Touches`. Tile 21 at 5 columns would land at row 4 (y 729, bottom 787) — off the 768 px canvas. Minimal reflow: `GRID_COLS` 5→6, `TILE_WIDTH` 160→144 (6×144 + 5×22 = 974), height/spacing/rows untouched, so icon, label and shelf geometry are unchanged. |
| `src/game/hubPaging.ts` | Outside `Touches`. 21 tiles need a third page: `PAGE_COUNT` 2→3, `pageTileIndexes()` clamps the last page to the tiles that remain, new `HUB_TILE_COUNT = 21` (dependency-free, asserted against `GAME_TILES.length`). `PAGE_SIZE` stays 10 so paged geometry is byte-identical. |
| `src/components/settings/ProgressOverlay.ts` | Outside `Touches`. The hand-maintained row list needed the 21st entry for AC-8; pagination is computed, so 21 rows render as 6+6+6+3. |
| `src/__tests__/components/settings/ProgressOverlay.test.ts` | Outside `Touches`. Its last-page assertion (2 rows) breaks once the 21st row exists; now asserts 3 rows. |
| `src/__tests__/scenes/hubPlayTime.test.ts` | Outside `Touches`. Its tile filter matched `>= 150` px wide; the reflow makes tiles 144 px, so the filter is now `>= 140` (still every tile, still 21). |
| `src/assets/svg/feelings/face_{happy,sad,angry,scared}.svg` | Phase 2 files, outside `Touches`, fixed because `PreloadScene` embeds each SVG with `btoa()`, which throws on characters above U+00FF — the em dashes in the four comments made the real preload fail (`InvalidCharacterError`) and the game never booted. Replaced with ASCII punctuation; no artwork or path data changed. |

## Notes

- Count-sensitive assertions were updated, never deleted: every suite keeps its
  invariant and now asserts 21 (tiles, icons, sticker lookups, shelf slots,
  page dots 3, wide-grid row sizes 6/6/6/3, preload SVG total 176).
- `GAME_SCENES` in `src/__tests__/helpers/gameScenes.ts` still imports 11 scene
  classes; that suite-wide widening belongs to Phase 4 (P4.T2), as does the
  end-to-end "hub tile → 6 rounds → sticker → hub" flow suite.
- The caption fallback reads `speechSynthesis.getVoices()` synchronously, the
  same convention as `VoiceRow.ts`. happy-dom has no speech engine, so the
  scene suite installs one stand-in voice in `beforeEach` and stubs it empty per
  test to cover both branches.
- `OPENING_SPEECH_DELAY` (2.6 s) is a documented heuristic: the shared
  `speakText` cancels an in-flight utterance when a new one is queued, so round
  1's scenario waits for the rule line rather than cutting it off.
- Pre-existing warning left untouched:
  `src/__tests__/scenes/musicalMemoryScene.test.ts:294` non-null assertion.

## Fix attempt 1 — centre a partial page of tiles

**Problem (review):** paged mode pages 21 games as 10 + 10 + 1, so page 3 holds
only tile 21. `pagedTilePosition(slot)` always laid out a full 5×2 box, so the
lone tile landed in slot 0 — the top-left corner of an otherwise empty grid,
which reads as a broken layout rather than a deliberate page.

**Change:** `pagedTilePosition` gained a `tilesOnPage` parameter (optional,
default `PAGE_SIZE`, i.e. a full page) and narrows the *column* box to
`min(5, tilesOnPage)` columns, so the used column occupies the page's width and
is centred. The row box stays two rows tall, which keeps the vertical anchor
(and therefore every row's clearance from the top control band and the bottom
mascot band) exactly as before:

- a full page: `cols = 5`, byte-identical geometry (slot 0 still x 120 / y 276,
  slot 9 still x 904 / y 492);
- the 1-tile page: `cols = 1`, so the tile sits at canvas centre-x 512 on the
  first row (y 276), horizontally centred instead of marooned left.

Both `pageTileIndexes(...).forEach((globalIndex, slot) => …)` call sites in
`src/game/hubGrid.ts` (`buildPageGrid` and `rerenderStickerShelf`) now pass
`page.length` / `active.length`. The swipe extents
(`pagedTilePosition(0)` / `pagedTilePosition(9)`) are untouched, so gesture
bounds still cover the full grid box. The wide 6×4 grid is unchanged.

**New tests** in `src/__tests__/game/hubPaging.test.ts` (3 added, and the two
canvas-override calls now pass `PAGE_SIZE` first to match the new signature):

| Test | Asserts |
| --- | --- |
| "keeps a full page's geometry unchanged (5x2, centred)" | slot 0 at (120, 276), slot 9 at (904, 492), equal 32 px side margins — the pre-fix layout |
| "leaves page 1 (a full page of ten) identical to the default layout" | `pagedTilePosition(slot, page.length)` deep-equals `pagedTilePosition(slot)` for all ten slots |
| "centres a one-tile page at the canvas centre-x on the first row" | `pageTileIndexes(2)` has one tile; its x is 512, its y equals the full page's slot-0 y, and it stays inside the canvas |

**Re-verification** (after the change):

| Command | Exit | Result |
| --- | --- | --- |
| `pnpm check` | 0 | 193 files checked; the same pre-existing warning and schema info only |
| `pnpm typecheck` | 0 | clean |
| `pnpm test -- --run <8 files from the brief>` | 0 | 8 files, 219 tests passed (216 + the 3 new page-centring tests) |
| `pnpm test -- --run` (supporting) | 0 | 97 files, 2075 tests passed |

## Fix attempt 2

**Problem found by playing.** With an earned sticker, the hub tile drew the plaque straight over the game label.

**Cause.** `createShelfSticker` pinned a fixed 56 px plaque 13 px above the tile's bottom edge. On the reflowed 144x116 tile that spans +17..+73 from the tile centre: the top third sat on the 17 px label and the bottom hung 15 px past the tile edge. The paged tile had the same bug shape at a different scale.

**Change.** The shelf is sized and anchored to the band between the label and the tile's bottom edge — 22 px on wide tiles (span +33..+55) and 30 px on paged tiles (+65..+95) — with `stickerY = tileY + tileHeight/2 - 3 - size/2`. The empty-slot ring takes the same radius, so the placeholder matches the plaque it stands for. The reveal animation is untouched.

**Tests.** Three cases in `hubGrid.test.ts`: the wide earned plaque starts below the label's bottom edge and ends inside the tile, the empty ring obeys the same contract, and the paged plaque clears the paged label inside its tile.

**Verification.** The phase command still exits 0 (8 files / 222 tests). Confirmed visually on the dev server: with `feelings-faces` and `shape-sorter` earned, both plaques sit below their labels and the labels are fully legible.

## Manual smoke verification

Played the real build in Chrome against `vite dev` (IPv6 localhost), driving pointer input on the canvas.

| Check | Result |
| --- | --- |
| Hub shows 21 tiles in a 6x4 wide grid | Pass |
| Tile 21 launches Feelings Faces with its loader | Pass |
| Rule line, replay glyph, six progress dots, three face cards render | Pass |
| Correct tap: splash, chime, dot fills, next round | Pass |
| Wrong tap: card wiggles, gentle tone, round kept | Pass |
| Ladder: rounds 1-3 happy/angry/sad, rounds 4-6 sad/scared/happy | Pass (console trace) |
| Round six completes: sticker reveal, then hub return | Pass |
| No-voice path: scenario caption appears, speaker glyph dimmed | Pass (`getVoices()` forced empty) |
| Earned sticker sits below the tile label | Pass (after fix attempt 2) |

Found and fixed in this pass: the shelf/label overlap (fix attempt 2) and the `btoa` boot failure from non-ASCII SVG comments (already fixed during the phase). No page errors in any run. — keep the sticker shelf below the tile label