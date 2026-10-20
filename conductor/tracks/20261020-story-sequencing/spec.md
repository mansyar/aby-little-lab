# Story Order — Game 22 (Story Sequencing) — Specification

> **Requirements are stable.** Do not renumber IDs after approval. Removed
> requirements keep their ID and are marked `Withdrawn`.

## Overview

Add Game 22, **Story Order**, to Aby's Little Lab: a sequencing game where the
child drags three shuffled story panels into a three-slot strip so the story
reads first → middle → last. It is the suite's first narrative-order game, and
it is built on the shared choice-round shell rather than a new foundation.

The track also establishes where late-game art lives. All 176 SVG strings
currently ship inside the shell entry (verified: 176 `xmlns` occurrences inside
`dist/assets/index-*.js`), which is why the shell measures 192.4 kB against a
200 kB gate. A sequencing game's panels *are* its content, so this track loads
panel art inside the game's own lazy chunk — proving the pattern Game 23+ can
reuse without spending the remaining shell headroom.

## Problem / Motivation

The suite teaches letters, words, numerals, quantity, categories and emotions,
but nothing about **temporal order** — the "what happens first" reasoning that
underpins narrative, prediction and early comprehension. Parents have 21 games;
the hub has one obvious gap in school-readiness skills.

Two secondary problems justify the delivery approach:

- **The shell budget is nearly spent.** 176 SVGs are bundled into the shell
  entry with only ~7.6 kB of headroom. Six stories of panel art added the
  conventional way (~18-30 kB) would fail `validate-bundle`. Doing this game
  correctly means art loads where the game lives.
- **Round ordering machinery is proven but single-use.** Number Order already
  has drag-to-slot, swap-on-drop and whole-board validation; a story game with
  three panels is the same interaction with different content, so it should be
  a sibling, not a copy.

## Goals & Success Metrics

- **Goal:** A 6-round sequencing game that a 3-year-old can complete without
  reading and without a parent explaining it.
  **Metric:** Spoken rule + replay glyph; every panel distinguishable without
  colour; no text-to-play path; completion reachable in one playthrough.
- **Goal:** Fit the established shell budget.
  **Metric:** `validate-bundle` shell entry ≤ 200 kB with the new art present;
  every panel SVG absent from the shell chunk.
- **Goal:** Reuse, don't fork, the round machinery.
  **Metric:** `StoryOrderScene` extends `ChoiceRoundScene`; no new
  `handleCorrect`/`handleIncorrect`/`handleChoice` implementation anywhere;
  Add It Up / Take Away / Number Order behaviour unchanged.
- **Goal:** Prove the game the way the suite proves every game.
  **Metric:** New logic suite + scene suite; 2,149 existing tests still pass;
  coverage gates (95 lines / 88 functions / 85 branches / 90 statements) hold.
- **Goal:** Replay variety.
  **Metric:** 8-story pool, 6 rounds drawn per playthrough with no repeats, so
  consecutive playthroughs differ.

## Scope

### In Scope

- Game 22 logic, scene, hub tile, sticker, Learning Progress row, `GameId`.
- 24 panel SVGs (8 stories × 3 panels), one tile SVG, one sticker SVG.
- Panel art loaded in the game's own chunk and rasterized when the scene starts
  (not at boot).
- Easy-first ladder: rounds 1-3 from the obvious-story pool, rounds 4-6 from the
  subtler pool.
- Drag-to-slot interaction with lift/tilt, snap, and slot swapping.
- Whole-strip validation on the third drop, with a gentle stay-in-place retry.
- Rule line + narrator glyph + replay, per the existing `RoundNarrator`.
- Doc sync: `conductor/product.md`, `README.md`, `conductor/tech-stack.md`.
- Hub capacity handling for 22 tiles (wide grid and paged grid).

### Out of Scope

- Adaptive Difficulty. Story Order uses the fixed easy-first ladder, like
  Feelings Faces; joining the adaptive set needs its own band definition.
- Spoken ordinals, spoken story titles, or any new recorded audio.
- A fourth panel or a 4-panel hard band.
- Fixing unrelated doc drift (duplicate Game 20 changelogs, "18 mini-games"
  header, PRD/TDD 20-game language) — recorded as known issues instead.
- Migrating the existing 176 SVGs out of the shell. This track proves the
  pattern for new art only.

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | `StoryOrderScene` (key `StoryOrder`, game id `story-order`) extends `ChoiceRoundScene`, is registered in `sceneRegistry`, and is reachable from a 22nd hub tile labelled "Story Order". | must |
| FR-2 | Pure logic lives in `src/game/storyOrderLogic.ts`: an 8-story pool, `buildPlaythrough()` producing 6 rounds (3 obvious + 3 subtle, no repeats), and `isCorrect(placed, solution)`. Randomness is injectable. | must |
| FR-3 | A round shows 3 shuffled panels in a source row and 3 ordered empty slots below, numbered only by visual ordinal pips (no digits, no words). | must |
| FR-4 | The child drags a panel into a slot; the panel lifts/tilts, snaps, and swaps with any panel already in that slot. Releasing outside a slot returns the panel home and never validates. | must |
| FR-5 | The strip validates when the third slot is filled. Correct → shared success feedback (splash, chime, cheer, dot pop, 700 ms advance). Incorrect → soft tone + wiggle, panels stay where the child placed them so one panel can be moved and retried. | must |
| FR-6 | Round 6 completion calls `completeGame("story-order")`: shared win celebration, first-time sticker, 3 s auto-return with `{ justEarned: "story-order" }`. | must |
| FR-7 | The scene shows the rule through `createSpokenInstruction("Put the story in order, first to last.")` with the narrator's replay glyph; no per-round narration is added. | must |
| FR-8 | 24 panel SVGs (8 stories × 3), 1 tile SVG and 1 sticker SVG are added in the storybook-flat style. Panels are imported only by the game's own module and rasterized in that scene's `preload()`, so they land in the lazy game chunk. Tile and sticker load at boot. | must |
| FR-9 | Integration is complete: `GameId` union + `GAME_IDS` (with old-save backfill), hub tile list, Learning Progress row, hub grid 6×4 rows 6/6/6/4, paged hub 10 + 10 + 2, and sticker key `sticker_story_order`. | must |
| FR-10 | Docs are updated: product game table + changelog, README game table/replay-variety/spoken-rules/project structure/test count, tech-stack scene count and tree. | should |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | `validate-bundle` shell entry stays ≤ 200 kB measured, with zero panel SVG strings present in the shell chunk. |
| NFR-2 | The 2,149 existing tests pass unmodified; new tests cover the logic module and the scene; coverage gates hold and new modules are covered directly. |
| NFR-3 | No new runtime dependency, no new audio asset, no new font. Art follows `docs/SVG_STYLE.md` (flat fills, 4-6 px `#2D3748` outlines, 512×512 viewBox, no gradients). |
| NFR-4 | Kid-visible timing matches the suite: 700 ms round advance, 3,000 ms auto-return, shared celebration; reduced motion shortens wiggle/snap and suppresses non-essential motion. |
| NFR-5 | Nothing is conveyed by colour alone: each panel is identifiable by composition/shape, ordinal pips differ in position, and every drag target keeps a ≥ 96 px hit area. |
| NFR-6 | Boot cost does not grow: preload counts 176 → 178 (tile + sticker only); panel rasterization happens on scene start and must complete before `create()`. |
| NFR-7 | Storage stays schema-compatible: old v2 saves gain the `story-order` key by backfill, and no migration or reset is required. |
| NFR-8 | `pnpm check` and `pnpm typecheck` are clean with no new warnings, no `any`, and Biome-formatted code. |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | Launching the 22nd hub tile opens Story Order, and the tile shows its own icon and earned sticker state. | FR-1, FR-9 |
| AC-2 | A playthrough is 6 rounds — 3 drawn from the obvious pool then 3 from the subtle pool — with no repeated story, and `buildPlaythrough` is deterministic under a seeded RNG. | FR-2 |
| AC-3 | Dragging any panel into an occupied slot swaps the two panels; dropping outside the slots returns the panel home and does not validate. | FR-3, FR-4 |
| AC-4 | A correctly ordered strip advances after the shared feedback; an incorrectly ordered strip wiggles without moving the panels, and moving one panel then completes the round. | FR-5 |
| AC-5 | After six rounds the shared celebration plays, the sticker is granted once, and the app returns to the hub after 3 s. | FR-6 |
| AC-6 | The rule line and replay glyph appear through `RoundNarrator`, replay works, and the glyph dims when SFX is off. | FR-7 |
| AC-7 | `rg` finds no panel SVG key inside `dist/assets/index-*.js`, and the shell entry passes `validate-bundle` at ≤ 200 kB. | FR-8, NFR-1 |
| AC-8 | Learning Progress shows 22 rows with Story Order last, and the hub renders 22 tiles as 6/6/6/4 wide and 10 + 10 + 2 paged. | FR-9 |
| AC-9 | A pre-existing v2 save without `story-order` loads, gains the key, and keeps its stickers and progress. | NFR-7 |
| AC-10 | The full gate chain passes: check, typecheck, tests, coverage, build, `validate-bundle`, `validate-pwa`. | NFR-2, NFR-8 |
| AC-11 | Panels remain distinguishable in grayscale and every drag target is ≥ 96 px. | NFR-5 |

## Edge Cases

- Third panel dropped outside a slot: no validation, panel returns home.
- Two drops resolve in the same tick: `inputLocked` must prevent double
  validation and double advancement.
- A swap that happens to complete the correct order: it validates like any
  third fill.
- Panels filled correctly but in reverse: treated as incorrect; no partial
  credit, no lock-out.
- Releasing a drag over the source row: returns home, no validation.
- Reduced motion: shorter wiggle/snap, no bob/sparkle, same outcomes.
- SFX off: chime, tone and narration silent; visual feedback still communicates
  the result; glyph dimmed.
- No TTS voice: the rule line is still shown as text beside the glyph.
- Scene entered twice (hub revisit): panel textures already loaded must not be
  re-registered or duplicated.
- Old save (no `story-order` key): backfilled, sticker shelf shows an empty slot.
- Sticker already earned: no second grant, no celebrate-twice.
- Narrow viewport: paged hub must page 10 + 10 + 2 with the partial page centred.
- Play-time lock active: tile dims and shows the moon badge like the other 21.

## Dependencies

- **Tracks:** none outstanding. `20261020-scene-audio-shell` is merged
  (`1ce8544`) and supplies `ChoiceRoundScene` and `RoundNarrator`.
- **External:** none. Manual exception: a real-device look at panel readability
  on a tablet and phone, recorded in `docs/device-testing-checklist.md` rather
  than gated in CI.

## Open Questions & Assumptions

- **Assumption:** the 8 stories are the ones listed below; swapping one is an
  art decision, not a spec change.
- **Assumption:** "obvious" and "subtle" pools are fixed per story at authoring
  time (4 stories each), not derived at runtime.
- **Assumption:** validation only fires on a full strip; partial strips never
  warn the child.
- **Assumption:** the tile and sticker are the only new boot assets; if a panel
  ends up needed by the hub or a shared overlay, it moves to boot art and AC-7
  must be re-checked.
- **Open question:** whether panel art should be shared with future story games
  (e.g. a second narrative game) — deferred; this track keeps panel art game-local.

### The eight stories

| # | Story | Panels (left → right) | Ladder |
| --- | --- | --- | --- |
| 1 | A seed grows | seed in soil → sprout → flower | obvious |
| 2 | A balloon fills | flat balloon → round balloon → balloon aloft | obvious |
| 3 | A duck hatches | egg → cracking egg → duckling | obvious |
| 4 | Ice cream melts | scoop → dripping cone → puddle | obvious |
| 5 | A banana is eaten | whole banana → peeled banana → peel | subtle |
| 6 | A cup is poured | full cup → pouring cup → empty cup | subtle |
| 7 | A foot gets dressed | bare foot → sock → shoe | subtle |
| 8 | Rain falls | cloud → raining cloud → puddle | subtle |

## References

- `conductor/product.md` §3.1 (game table), §3.2 (cross-game systems), §4 (touch
  and textless rules).
- `conductor/product-guidelines.md` (no-fail, no colour-only, motion, audio).
- `conductor/tech-stack.md` (scene registry, texture tiers, preload counts).
- `src/scenes/NumberOrderScene.ts` and `src/game/numberOrderLogic.ts` — the
  drag-to-slot sibling this game follows.
- `src/scenes/ChoiceRoundScene.ts`, `src/components/RoundNarrator.ts` — the
  shell this game consumes.
- `docs/SVG_STYLE.md` — art contract for the 26 new files.
- `conductor/archive/20261020-feelings-faces/` — the closest prior game track.
