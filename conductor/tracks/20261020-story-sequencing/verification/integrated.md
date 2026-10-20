# Integrated verification - Story Order (Game 22)

- Track: `20261020-story-sequencing`
- Branch: `feat/20261020-story-sequencing`
- Base: `95d044e5e660d5db3715b5aba08a3584927d46f5` (master, post v1.19.0)
- Head at this run: `80461d7`
- Date: 2026-10-20

## What the track changed

| Area | Before | After |
| --- | --- | --- |
| Games | 21 | 22 - Story Order (narrative sequencing) |
| Sequencing logic | none | `src/game/storyOrderLogic.ts` - 8-story pool, easy-first playthrough, injectable RNG |
| Shared shell | 13 choice games on `ChoiceRoundScene` | 14 (Story Order uses the round loop + whole-strip `resolveWholeRound`) |
| Boot preload | 176 SVGs | 178 (tile + sticker only) |
| Game art | all art in the boot shell | Story Order's 24 panels live in its own chunk via `storyOrderArt.ts` |
| Hub | 21 tiles, 6/6/6/3, paged 10+10+1 | 22 tiles, 6/6/6/4, paged 10+10+2 |
| Progress report | 21 rows, 6+6+6+3 | 22 rows, 6+6+6+4 |
| Shell size | 193.4 kB measured | 195.4 kB measured (gate 200 kB) |

## Gates (at `80461d7`)

| Command | Result |
| --- | --- |
| `pnpm check` | pass - 206 files, 1 pre-existing warning, 1 schema info note |
| `pnpm typecheck` | pass, no output |
| `pnpm test -- --run` | pass - 103 files / 2,205 tests |
| `pnpm test:coverage` | pass - 98.11 statements / 90.54 branches / 98.04 functions / 98.94 lines |
| `pnpm build` | pass - `StoryOrderScene-D5FX6gb5.js` 33.36 kB, shell `index-cmeS8uaq.js` 200.12 kB raw |
| `node scripts/validate-bundle.js` | pass - shell 195.4 kB ≤ 200 kB, Phaser vendor chunk present |
| `node scripts/validate-pwa.js` | pass - 15 / 15 |

## Acceptance criteria

| ID | Criterion | Verdict | Evidence |
| --- | --- | --- | --- |
| AC-1 | Tile opens the game | Met | Hub suite asserts 22 tiles, `tile_story_order` last, grid containment at 1024×768 |
| AC-2 | 6 rounds, 3 panels, no repeats | Met | `storyOrderLogic.test.ts` - ladder split, 50-seed no-repeat sweep, determinism |
| AC-3 | Swap and drop-outside behaviour | Met | scene suite: empty/own/occupied drops, swap, tray displacement, miss returns home |
| AC-4 | Correct advances, wrong stays and retries | Met | scene suite: 700 ms advance on correct; wrong strip keeps panels and unlocks; signature guard |
| AC-5 | Celebration, sticker, auto-return | Met | `completeGame("story-order")` path; navigation suite counts 22 stickers |
| AC-6 | Rule line + replay + dimmed when muted | Met | `createSpokenInstruction` narrator; rule absent from the boot shell, lives in the scene chunk |
| AC-7 | No panel key in the shell, bundle gate green | Met | shell hits: `story_seed_planted` 0, `story_rain_puddle` 0; `tile_story_order` 3, `sticker_story_order` 1; chunk hits 2+ |
| AC-8 | 22 progress rows, pages 6+6+6+4, 10+10+2 paging | Met | `ProgressOverlay` row count and `hubPaging` page-3 tiles at 414/610 |
| AC-9 | Old v2 save backfills | Met | storage suite writes a 21-game profile and reads `story-order` seeded |
| AC-10 | Docs describe the game and art pattern | Met | product/README/tech-stack sections (see phase 5) |
| AC-11 | Panels distinguishable in grayscale, ≥96 px targets | Met | art review of the contact sheet (ground-line framing, distinct silhouettes); 180 px panels, 200 px drop zones |

## Non-functional requirements

| ID | Requirement | Verdict |
| --- | --- | --- |
| NFR-1 | Shell ≤ 200 kB, panels out of it | Met - 195.4 kB measured, zero panel keys |
| NFR-2 | Existing tests unmodified except mechanical count raises | Met - 2,149 → 2,205; 56 new tests; every edited assertion is a count/index/label raise (phases 3-4 audits) |
| NFR-3 | No new deps, audio or fonts; SVG style guide obeyed | Met - 26 SVGs, zero audio, no dependency change |
| NFR-4 | 700 / 3,000 / 250 ms timings and reduced motion preserved | Met - shared constants, `motionDuration` on every tween |
| NFR-5 | No colour-only information, ≥96 px targets | Met - ordinal pips are positional, panels 180 px, hit areas 180 |
| NFR-6 | Preload 176 → 178 only | Met - two entries added |
| NFR-7 | Storage backfills without migration | Met - additive `GAME_IDS` per-key backfill |
| NFR-8 | check/typecheck clean, no `any` | Met |

## Known carry-overs

- No real-device (touch feel, drag on a low-end tablet) execution was possible.
  Device pass is a manual exception in the workflow config and is recorded as
  pending for the release checklist.
- `docs/PRD.md` and `docs/TDD.md` still describe a 20-game suite (out of scope:
  unrelated doc drift).
- Shell headroom is now 4.6 kB; the next art-heavy game must follow Story Order's
  in-chunk pattern or raise the gate deliberately.
