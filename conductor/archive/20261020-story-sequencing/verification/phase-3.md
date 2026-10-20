# Phase 3 verification — Story Order scene

- **Track:** `20261020-story-sequencing` — Story Order, Game 22
- **Phase:** 3 — Story Order scene
- **Date:** 2026-10-20
- **Branch:** `feat/20261020-story-sequencing`
- **Phase base:** `95db4ad`
- **Task commits:** `ca8e6c6` (board), `a93f769` (tests), plus this evidence commit
- **Result:** verified — the full chain passed with exit 0

## What changed

### `src/scenes/StoryOrderScene.ts` (new, 420 lines)

`StoryOrderScene extends ChoiceRoundScene` with key `StoryOrder` and
`gameId()` → `"story-order"`. It loads the 24 panel drawings in its own
`preload()` through `preloadStoryOrderArt(this)`, so the art ships with the
lazy game chunk. `create()` uses only the shared base pieces: `sceneEntrance`,
`createCornerMascot`, `createBackButton`, `createProgressDots(6)`,
`createSpokenInstruction("Put the story in order, first to last.")`,
`buildPlaythrough()` (fixed easy-first ladder, no adaptive band), then
`renderRound()` and `registerShutdownCleanup()`.

The board is the Number Order shape with panels instead of numerals:

- Three dashed 200 px slots at `y = 264` (about `centerY - 120`), each with
  1/2/3 pips above it — no digits, no words. Slots sit ~40 px apart.
- Three 180 px white cards with `OUTLINE_WIDTH`/`OUTLINE_COLOR` and a 140 px
  panel image in a tray at `y = 574` (about `centerY + 190`).
- Centred 180 × 180 hit areas, so every drag target is well above 96 px.
- Drag lift/tilt via `attachDragLift`, snap via `snapToSlot`, and the same
  `justDropped` discipline Number Order uses so a drop's trailing `pointerup`
  is not read as a tap.
- Drop on an empty slot claims it; drop on an occupied slot swaps the two
  panels, or sends the occupant back to its tray spot when the dragged panel
  came from the tray; drop outside returns the panel home and does not
  validate.
- A complete strip resolves once through `this.resolveWholeRound(isCorrect(...))`.
  A per-round `lastValidatedSignature` guard means re-validating an unchanged
  complete strip cannot waggle the child twice; moving a panel changes the
  signature and re-checks.
- **Wrong path:** `onWrong()` locks, `wiggleTargets()` returns the three placed
  panels, and `onWiggleComplete()` only unlocks — every panel keeps its slot,
  and the child can move one panel and retry. Nothing bounces home.
- Correct uses the shared path unchanged (chime, record, cheer, dot, 700 ms
  advance); only the optional success splash is added via `onCorrect`.
- Round teardown destroys every tracked object with per-object tolerance and
  clears slots/panels so the next round rebuilds from `rounds[roundIndex]`.
- `totalRounds()` returns `this.rounds.length` (6 from the logic module), not a
  constant.

### Boot and registration

- `src/scenes/PreloadScene.ts`: `tile_story_order` and `sticker_story_order`
  added to `SHAPE_ASSETS` (176 → 178).
- `src/scenes/sceneRegistry.ts`: `StoryOrder` lazy loader added (21 → 22).
- `src/types/index.ts`: `GameId` union and `GAME_IDS` gain `"story-order"` as
  the 22nd/last id, which backfills stickers and progress on old saves.

### Tests

- `src/__tests__/scenes/storyOrderScene.test.ts` (new, 27 tests): shell
  (mascot/Back/6 dots), 24-panel preload, 3 panels + 3 pip slots, all six
  rounds rebuilt with 3 + 3, hit areas, drag lift/move, empty claim, own-slot
  re-snap, slot-to-slot swap, tray-to-occupied return, locked/unknown drops,
  drop-outside no-validate, trailing pointerup, tap-to-return, move-to-empty,
  missed drags, correct advance, dot fill, splash, wrong strip stays in place
  and unlocks for one corrective move, signature guard, partial strip,
  final-round win, destroy tolerance, missing-round/stale-slot guards, and
  `wiggleTargets` on an empty slot.
- `src/__tests__/utils/storage.test.ts`: one appended case proving a v2 save
  written before this game loads, gains `story-order` with
  `{earned:false, earnedAt:null}`, keeps its existing stickers, and gets a
  zeroed progress row.

### Existing test count updates (phase-mandated, see Deviations)

- `textureTiers.test.ts` 176 → 178, `navigation.test.ts` 176 → 178,
  `sceneRegistry.test.ts` 21 → 22 keys plus the `StoryOrder` stub/expectation,
  `progressLogic.test.ts` 21 → 22 with Story Order last.

## Commands

The exact phase chain was run as one command:

```
pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js
```

| Command | Result |
| --- | --- |
| `pnpm check` | exit 0 — 206 files, 0 errors (pre-existing schema-version info and `noNonNullAssertion` warning at `musicalMemoryScene.test.ts:294`) |
| `pnpm typecheck` | exit 0 — clean |
| `pnpm test -- --run` | exit 0 — 103 files, **2,202 tests** (2,174 carried + 27 scene + 1 storage) |
| `pnpm test:coverage` | exit 0 — statements **98.09%**, branches **90.46%**, functions **98.04%**, lines **98.94%** (gates 90/85/88/95) |
| `pnpm build` | exit 0 — 301 modules; shell `index-Bo1xfP5y.js` **199.96 kB raw**; `StoryOrderScene-vAX8tGAp.js` **33.36 kB** |
| `node scripts/validate-bundle.js` | exit 0 — one Phaser chunk; shell **195.3 kB ≤ 200 kB** |
| `node scripts/validate-pwa.js` | exit 0 — 15/15 |

### Built-shell proof (AC-7)

- Shell chunk: `dist/assets/index-Bo1xfP5y.js`.
- A ripgrep over the 24-key family
  `story_(seed|balloon|egg|duckling|ice|banana|cup|foot|cloud|rain)` found
  **0 matches** in the shell chunk — **0 panel keys / 0 panel SVG strings**.
- The only `story_` symbols in the shell are the boot tile/sticker keys
  `tile_story_order` and `sticker_story_order`; the rule sentence
  "Put the story in order, first to last." is also absent from the shell.
- All 24 panel keys and their embedded SVGs are present in
  `dist/assets/StoryOrderScene-vAX8tGAp.js` (33.36 kB), including
  `story_seed_planted`, `story_balloon_aloft`, and `story_rain_puddle`.

## Acceptance criteria

| ID | Result | Evidence |
| --- | --- | --- |
| AC-3 | Pass | Scene tests "swaps the two occupants…", "sends the occupant back to the tray…", "returns a missed tray drag home and never validates", and "does not validate when the third panel is dropped outside a slot" |
| AC-4 | Pass | "advances on a correct strip after the shared feedback" (chime, dot fill, 700 ms advance); "leaves a wrong strip exactly in place, unlocks, and accepts one move" (occupancy unchanged, no tray-Y tween, then swap slots 0/2 → correct) |
| AC-5 | Pass | "completes the game on the last round" (`playWin` once after round 6); sticker grant, 3 s auto-return and `{justEarned}` remain the shared `completeGame` path unchanged |
| AC-6 | Pass | "shows and speaks the rule and nothing per round" asserts the exact rule text plus `speakSentence(RULE, true)`; the replay glyph and its SFX-off dimming are the existing `RoundNarrator`, unmodified |
| AC-7 | Pass | Shell 195.3 kB (≤ 200 kB) and 0 panel keys in `dist/assets/index-*.js`; 24 panel keys in the 33.36 kB lazy `StoryOrderScene` chunk |
| AC-9 | Pass | Appended storage case: old v2 profile loads, `hasSticker("story-order")` false, zeroed progress row, existing stickers/progress preserved |
| AC-11 | Pass | Panels are composition-distinct (Phase 2 art contract, unchanged) and the scene test hit-tests a 180 px target covering the whole visible panel |

Adjacent coverage: FR-1 (scene key/registry/game id), FR-3/FR-4 (slots, pips,
drag/swap/return), FR-5 (whole-strip resolution, stay-in-place wrong path),
FR-6 (final completion), FR-7 (single rule line, no per-round narration),
FR-8 (scene-local rasterization), NFR-1/4/5/7. AC-1/AC-8 hub tile, paging and
progress-row rendering remain Phase 4 by design.

## Task commit map

| Task | Commit | Contents |
| --- | --- | --- |
| P3.T1 — skeleton + lazy art | `ca8e6c6` | scene, registry, 178-asset preload, `GameId`/`GAME_IDS`, count alignment |
| P3.T2 — the board | `ca8e6c6` | slots/pips/tray, drag, snap, swap, home, partial guard |
| P3.T3 — resolution | `ca8e6c6` | whole-strip `isCorrect`, stay-in-place wrong path + unlock, re-check on change |
| P3.T4.1 — identity | `ca8e6c6` | `"story-order"` in the union and `GAME_IDS`, registry typing |
| P3.T4.2 — save compat | `a93f769` | appended v2 backfill case |
| P3.T5.1 — scene tests | `a93f769` | 27 scene tests through the Phaser mock |
| P3.T5.2 — shell proof | this evidence commit | 0 panel keys, 195.3 kB shell |

## Deviations

1. **Four existing test files were updated beyond the single storage case.**
   - `src/__tests__/utils/textureTiers.test.ts` — 176 → 178.
   - `src/__tests__/scenes/navigation.test.ts` — 176 → 178 preload calls.
   - `src/__tests__/scenes/sceneRegistry.test.ts` — 21 → 22 keys and the
     `StoryOrder` stub/expected export.
   - `src/__tests__/game/progressLogic.test.ts` — 21 → 22, Story Order last.

   Reason: Phase 3 itself requires the boot count 176 → 178, the 22nd scene
   loader, and `"story-order"` in `GAME_IDS`. These assertions are hard-coded
   counts, so they cannot pass unmodified. No assertion was weakened or
   removed.
2. **No boot smoke run.** The attempt was rejected by the executor's shell
   permission layer (`permission.rejected: Permission denied: shell`), the same
   environment limit Phase 2 recorded. The brief's exact chain was run green.

No files outside `Touches` were changed; `hubTiles.ts`, `hubPaging.ts` and
`ProgressOverlay.ts` are untouched.

## Notes for the primary agent

- NFR-2's "2,149 existing tests pass unmodified" needs the deviation above
  acknowledged in the track record: the four count assertions are necessarily
  phase-coupled. 2,149 carried tests plus Phase 1/2 additions all still pass;
  only those hard-coded counts changed.
- `StoryOrderScene` is 420 source lines and its lazy chunk is 33.36 kB. The
  shell grew from 198,060 B (Phase 2) to 199,960 B raw — **1,900 B** — because
  the tile and sticker SVGs now boot with the other 176 assets, yet the shell
  still validates at 195.3 kB, ~4.7 kB under the budget.
- The scene honors the fixed easy-first ladder (`buildPlaythrough()` takes only
  an RNG); no adaptive band shift is wired, matching the spec's Out of Scope.
- AC-5's sticker/auto-return assertions rely on the shared `completeGame`
  path, which this phase does not modify. If you want a direct scene-level
  assertion for `{justEarned}` and the 3 s timer in Phase 4, it can be added
  without touching the board.
- Built-shell counts must be re-proven after Phase 4's hub/paging changes; the
  lazy-chunk boundary itself is already correct.

## Primary verification

Run independently at the phase head (`53e44cb`), then the scene was read in
full rather than trusted from the report.

| Layer | Result |
| --- | --- |
| `pnpm check` | pass - 204 files, 1 pre-existing warning, 1 schema info note |
| `pnpm typecheck` | pass |
| `pnpm test -- --run` | pass - 103 files / 2,202 tests (2,174 carried + 28 new) |
| `pnpm test:coverage` | pass - 98.11 statements / 90.54 branches / 98.04 functions / 98.94 lines |
| `pnpm build` | pass - `StoryOrderScene` 33.36 kB lazy chunk, shell `index-Bo1xfP5y.js` 199.96 kB raw |
| `node scripts/validate-bundle.js` | pass - shell 195.3 kB <= 200 kB |
| `node scripts/validate-pwa.js` | pass - 15 / 15 |

### Built-shell proof (AC-7)

The shell contains exactly two `story_` strings - `tile_story_order` and
`sticker_story_order` - and zero panel keys; the rule line
("Put the story in order, first to last.") is absent from the shell too, so the
scene's copy travels in the lazy chunk. `story_seed_planted` is present in
`StoryOrderScene-vAX8tGAp.js` as expected. Shell grew 193.4 -> 195.3 kB for
the two boot SVGs, leaving 4.7 kB of headroom.

### Scope and test adaptations

`git diff --stat 95db4ad..HEAD` matches Touches plus four count-only test
edits the executor declared: `textureTiers` 176 -> 178, `navigation`
176 -> 178 svg calls, `sceneRegistry` gains the StoryOrder stub/key/export,
and `progressLogic` moves 21 -> 22 with `story-order` last. Read together,
these are mechanical consequences of adding a 22nd game, not weakened
assertions - `progressLogic` actually gained a `map["story-order"]`
equality check. `storage.test.ts` gains one case that writes a real 21-game
v2 save and asserts the backfill, including that existing stickers and
progress survive.

### Scene read

- Board geometry: slots centred at y=264 (200 px, 40 px apart), tray at y=574
  (180 px cards), instruction at y=112 - no overlap, everything inside the
  1024x768 stage.
- Ordinal cue is pips only (1/2/3 dots above each slot), no digits or words, so
  FR-4 and the textless rule hold.
- Drop handling covers all four cases and is asserted: empty slot, own slot,
  occupied slot from a slot (swap), occupied slot from the tray (occupant
  returns to its tray spot). Drops outside any zone tween home and never
  validate.
- Wrong path: `onWrong` locks, `wiggleTargets` returns the placed panels,
  `onWiggleComplete` unlocks - no home tween anywhere, so the child's work
  survives. A signature guard means re-validating a completed strip only runs
  when the order actually changed.
- Round teardown tolerates already-destroyed drag objects, which the sibling
  Number Order board also needs.
- Startup resets `roundIndex`/`inputLocked` explicitly, and
  `totalRounds()` returns the loaded playthrough length rather than the
  constant, avoiding the injected-playthrough trap.

### Caveat carried forward

No boot smoke was possible (the executor's shell permission layer rejects it and
no browser is available to the primary), so pixel-level feel - panel legibility
at 140 px inside the card, and whether the pips are heavy enough at tablet
distance - stays a real-device check in Phase 5's manual exception.
