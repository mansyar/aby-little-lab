# Phase R1 evidence — Review Fixes

- **Track:** `20261020-prd-tdd-truth-pass`
- **Branch:** `chore/20261020-prd-tdd-truth-pass`
- **Phase base:** `5aa62d3`
- **Date:** 2026-10-20
- **Goal:** every corrected sentence states what the source does.

## Method

Each finding was re-derived from source before the prose was touched. Where the brief
or the review quoted a figure, the figure was recomputed from the working tree:
the tier counts were counted key by key over `SHAPE_ASSETS`, the coverage figure was
read from this phase's own `pnpm test:coverage` run, and the chunk sizes were read
from this phase's own `pnpm build` output. No reviewer number was copied without a
matching source line or command; where the numbers were confirmed, they are quoted
with the derivation that confirms them.

## Findings

| ID | file:line | Before (quoted) | After (quoted) | Authority |
| --- | --- | --- | --- | --- |
| F1 | `docs/PRD.md:504-508` | "160 px for icons, letter and numeral cards and small UI glyphs" | "**160 px (icon)** — the 22 `tile_*` game icons, the eight `sm_shadow_*` silhouettes and the five exact keys `minus`, `plus`, `equals`, `sleep_zzz` and `icon_speaker`." / "**256 px (card)** — everything else: … and also letters and numerals, because no rule matches `letter_*` or `numeral_*` and an unmatched key takes this default." | `src/utils/textureTiers.ts:29-34` — the rule list is exactly `^tile_`, `^sm_shadow_`, `^(minus\|plus\|equals\|sleep_zzz\|icon_speaker)$`, `^mascot_`; `:36` `DEFAULT_TIER = "card"`. No letter or numeral rule exists, so `letter_*`/`numeral_*` take 256. `docs/TDD.md:361` ("`card` … default — gameplay art, stickers, letters, numerals, story panels") already said so; the two documents no longer disagree. |
| F2 | `docs/TDD.md:879` | "`src/scenes/sceneRegistry.ts` sits lowest because its loaders are only exercised through injected stubs." | "`src/scenes/sceneRegistry.ts` is fully covered (100 % on all four metrics) … The lowest file is `src/game/decodeLogic.ts` at 73.8 % lines, 74.54 % statements, 83.33 % functions and 56.66 % branches; its uncovered lines 63–77 are the fallback distractor path, which a pool of 22 words never forces." | `pnpm test:coverage` at HEAD of this phase: `decodeLogic.ts \| 74.54 \| 56.66 \| 83.33 \| 73.8 \| 63-77`. `coverage/src/scenes/index.html` `sceneRegistry.ts` row: 100 % / 100 % / 100 % / 100 % (50/50, 5/5, 45/45, 28/28). `vite.config.ts:73` `include: ["src/**/*.ts"]`, so every `src` file is in the denominator and no file scores below `decodeLogic.ts` on lines. |
| F3 | `docs/TDD.md:384` | "The shell carries the three shell scenes, the 15 components, the 30 logic modules, the 14 utils and all 178 boot textures as strings." | "The shell carries the three shell scenes, the components the Hub and its settings overlays use, the utilities they import and all 178 boot textures as strings. Rollup hoists whatever the lazy scenes share into its own chunk instead, so the shared bases do not ride the shell: `GameSceneBase` 7.98 kB, `ChoiceRoundScene` 2.36 kB, `GroupMathScene` 2.02 kB, `dragJuice` 1.03 kB, and shared game logic such as `wordLogic` 1.95 kB …" | `pnpm build` emitted those chunks as separate files (witness lines below). `HubScene.ts:3-8` imports Mascot, ParentLock, PlayTimeIndicator, ProfileChip, PwaToasts, SettingsPanel, so the Hub-side components are shell-side; `RoundNarrator`/`SpeakerButton` are imported only by `GameSceneBase.ts:8-10`. `README.md:219` already said "Rollup auto-hoists shared modules (game logic, `dragJuice`, `completionEffect`)". |
| F3 | `docs/PRD.md:518-522` | "**The shell entry**, which contains the boot, preload, Hub, settings, storage, audio and shared scene bases." / "**One chunk per game**, plus a small shared chunk for the choice-round base and a shared chunk for drag behaviour." | "**The shell entry**, which contains the three shell scenes (Boot, Preload and Hub), the components the Hub and its settings overlays use, the storage, audio and speech utilities they import, and the 178 boot textures as strings." / "**One chunk per game**, plus the chunks Rollup hoists out of them because several games share the code: `GameSceneBase` (7.98 kB) … The shared bases do not ride in the shell." | Same build output. The section's own self-contradiction is gone: no bullet claims the bases for the shell, and the third bullet names them as hoisted chunks. |
| F4 | `docs/TDD.md:805` | "`setBGMEnabled(enabled)` and `setSFXEnabled(enabled)` set the flag, persist it through `updateSettings`, and call `restoreBGM()` on every call" | "`setBGMEnabled` calls `restoreBGM()` unconditionally, then pauses the element when disabling; `setSFXEnabled` calls it only when disabling, because SFX off means nothing is speaking." | `src/audio/AudioManager.ts:172-181` — `restoreBGM()` on the straight-line path, then `if (!enabled) this.pauseBGM();`. `:188-194` — `restoreBGM()` inside `if (!enabled)`. |
| F5 | `docs/PRD.md:510` | "the tiering cut texture memory from roughly 178 MiB to roughly 39 MiB" | "Over the 178-entry boot set that resolves to 35 icon, 141 card and 2 hero textures, so the raster costs `(35 × 160² + 141 × 256² + 2 × 512²) × 4 B = 42,643,456 B`, a little over 40.7 MiB, down from the 178 MiB a uniform 512 px raster would have reserved." | Counted over `SHAPE_ASSETS` (`src/scenes/PreloadScene.ts:190-369`, 178 entries per `src/__tests__/utils/textureTiers.test.ts:85`): icon = 22 `tile_` + 8 `sm_shadow_` + 5 exact keys = 35; hero = 2 `mascot_`; card = 178 − 35 − 2 = 141. Arithmetic: 35 × 102,400 = 3,584,000; 141 × 262,144 = 36,962,304; 2 × 1,048,576 = 2,097,152; total 42,643,456 B / 1,048,576 = 40.67 MiB. Baseline: 178 × 1,048,576 = 186,646,528 B = exactly 178 MiB. The recount reproduces the reviewer's 35/141/2 and their byte total. |
| F6 | `docs/PRD.md:383` | "the game's classic easy-first ladder, which is `[1, 1, 2, 2, 3, 3]` for the band games. The shift is computed per profile, once at the start of a playthrough, and never mid-round." | "the game's classic easy-first ladder at the start of a playthrough: once per profile, never mid-round, so difficulty can move by one band between visits but never inside a round. The ladder's values and its clamp are the TDD's to state ([TDD §7.3](./TDD.md#73-adaptive-banding))." | `docs/TDD.md:737` owns `BASE_LADDER` `[1, 1, 2, 2, 3, 3]`; `:739` owns `shiftLadder`'s 1..3 clamp. Behaviour kept: one band per playthrough, never mid-round. `docs/PRD.md:381` also lost its "(1 to 3)" restatement of the clamp. |
| F6 | `docs/PRD.md:490` | "the music ducks to eight percent of its normal volume over a 120 ms ramp … or when a 15 second watchdog expires" | "A spoken line ducks the music, and full volume returns when the speech ends, when speech errors, when either audio toggle is turned off, or when the watchdog expires … The duck level, the ramp and the watchdog interval are the TDD's ([TDD §8.3](./TDD.md#83-background-music-ducking-and-the-watchdog))." | `docs/TDD.md:778` (`BGM_DUCKED_VOLUME = BGM_VOLUME * 0.08`, `BGM_RAMP_DURATION = 120`) and `:782` (`BGM_DUCK_WATCHDOG = 15000`) own the constants. "Either audio toggle is turned off" is the accurate path: `setBGMEnabled` restores on every call, `setSFXEnabled` only when disabling (`AudioManager.ts:172-194`, F4). The never-persisted promise is kept as behaviour. |
| F7 | `docs/PRD.md:528` | "Every other drawing is shared by two or more games, so it belongs in the boot set and is paid for once." | "Nothing else is per-game art. The rest of the boot set either serves several games — the shape, cut-out and animal drawings are reused across the pool of games — or belongs to a single consumer: one tile icon per game, one sticker per game, Shadow Match's eight silhouettes and Feelings Faces' four faces. All of it is in the boot set, so it is paid for once rather than per game." | `SHAPE_ASSETS` keys: 8 `sm_shadow_*`, used only through `ShadowMatchScene`; 4 `face_*`, used only by `FeelingsFacesScene.ts:53-55`; 22 `tile_*` (one per game, `ProgressOverlay.ts:57-78`); 22 `sticker_*` (one awarded per game). Shape and animal art is reused: `shape_circle` in `oddOneOutLogic.ts:44`, `colorMatchLogic.ts:24` and `PatternBuilderScene.ts:17`; `animal_cat` in `wordLogic.ts:23`, `oddOneOutLogic.ts:17` and `memoryMatchLogic.ts:32`; `sm_house` in `countLogic.ts:15` and `memoryMatchLogic.ts:42`. |
| F8 | `docs/device-testing-checklist.md:260` | "Protected controls (Settings, all twenty game Back buttons) plus the replay speaker button" | "Protected controls (Settings, all twenty-two game Back buttons) plus the replay speaker button" | `src/game/hubPaging.ts:24` states `HUB_TILE_COUNT = 22` (asserted at `hubPaging.test.ts:107`), and `hubTiles.test.ts:17` asserts it equals `GAME_TILES.length` in `src/game/hubTiles.ts`; every game Back button is drawn by `GameSceneBase`. |
| F8 | `docs/device-testing-checklist.md:455` | "Hoot appears in the same bottom-right corner on the Hub and in all twenty games" | "… on the Hub and in all twenty-two games" | Same 22-game source. |
| F8 | `docs/device-testing-checklist.md:538` | "Each of the twenty games shows at most one short splash/ray" | "Each of the twenty-two games shows at most one short splash/ray" | Same 22-game source. |
| F8 | `docs/device-testing-checklist.md:539` | "All twenty games play the shared win celebration (rays + confetti)" | "All twenty-two games play the shared win celebration (rays + confetti)" | Same 22-game source; the celebration lives in `GameSceneBase`, which every game extends (`docs/PRD.md:333`). |

### F8 overflow (same file, same defect class — see Deviations)

| ID | file:line | Before (quoted) | After (quoted) | Authority |
| --- | --- | --- | --- | --- |
| F8+ | `docs/device-testing-checklist.md:251` | "All 20 game tiles are visible (5×4 grid)" | "All twenty-two game tiles are visible (6×4 grid)" | `src/game/hubGrid.ts:20-21` `GRID_COLS = 6`, `GRID_ROWS = 4`; `:252-255` "Builds the 6x4 wide grid — rows 6/6/6/4 over 22 tiles … for desktop and tablet viewports". |

## Coverage and chunk figures

### `pnpm test:coverage` — the lines that back F2

```
All files          |   98.13 |    90.54 |   98.14 |   98.96 |
 src/game          |   96.86 |    91.02 |   98.31 |   97.61 |
  decodeLogic.ts   |   74.54 |    56.66 |   83.33 |    73.8 | 63-77
Statements   : 98.13% ( 4936/5030 )
Branches     : 90.54% ( 1197/1322 )
Functions    : 98.14% ( 1003/1022 )
Lines        : 98.96% ( 4590/4638 )
```

`sceneRegistry.ts` is absent from that per-file list because the text reporter prints
only files that are not fully covered. Its row in the HTML report
(`coverage/src/scenes/index.html:501-513`) reads 100 % statements (50/50), 100 %
branches (5/5), 100 % functions (45/45), 100 % lines (28/28).

### `pnpm build` — the lines that back F3 and F5

```
dist/assets/shapeSorterLogic-DYncxSCZ.js             0.45 kB
dist/assets/alphabetLogic-Bf9U9Yva.js                0.51 kB
dist/assets/countLogic-BXo1i1x1.js                   0.81 kB
dist/assets/dragJuice-Cw5BIyLG.js                    1.03 kB
dist/assets/AddItUpScene-C0RTh_MT.js                 1.22 kB
dist/assets/wordLogic-CkiBtslb.js                    1.95 kB
dist/assets/GroupMathScene-B3UcGPGs.js               2.02 kB
dist/assets/ChoiceRoundScene-WDgcgoWV.js             2.36 kB
dist/assets/GameSceneBase-CAUle9g_.js                7.98 kB
dist/assets/StoryOrderScene-BtF2cH14.js             33.92 kB
dist/assets/index-Dhenc0xK.js                      200.12 kB
dist/assets/phaser-P1E8uaLi.js                   1,374.82 kB
PASS: Phaser vendor chunk present: phaser-P1E8uaLi.js (1342.6 kB)
PASS: shell entry index-Dhenc0xK.js = 195.4 kB (<= 200 kB)
```

`package.json` is version `1.20.0`, so the PRD's "at version 1.20.0" framing still
holds. The smallest **game scene** chunk in this build is `AddItUpScene` at 1.22 kB;
the 0.45 kB file is `shapeSorterLogic`, a hoisted shared module — which is why the
PRD's game-chunk range was corrected (Deviations).

## Acceptance

| Finding | What now proves it |
| --- | --- |
| F1 | PRD §7.1 lists the icon tier as the only keys `TIER_RULES` matches and says letters and numerals take the card default because no rule matches them; the sentence agrees with `docs/TDD.md:360-366` instead of contradicting it. |
| F2 | TDD §10 names `decodeLogic.ts` with the four metrics and the uncovered range from this run, and records `sceneRegistry.ts` as fully covered. |
| F3 | TDD §3.6 and PRD §7.2 both place the shell scenes, Hub-side components, utilities and 178 boot textures in the shell and list `GameSceneBase`/`ChoiceRoundScene`/`GroupMathScene`/`dragJuice`/shared logic as hoisted chunks, matching the build output and `README.md:219`; PRD §7.2 no longer contradicts itself. |
| F4 | TDD §8.6 states the unconditional restore for `setBGMEnabled` and the disable-only restore for `setSFXEnabled`, matching `AudioManager.ts:172-194`. |
| F5 | PRD §7.1 shows the tier census and the byte arithmetic that yields 42,643,456 B ≈ 40.7 MiB; the 39 MiB figure is gone. |
| F6 | PRD §4.8 and §6.4 state behaviour only and link `[TDD §7.3]`/`[TDD §8.3]` for the ladder, clamp, duck level, ramp and watchdog; both anchors exist (TDD headings at `:727` and `:776`). |
| F7 | PRD §7.3 no longer claims every drawing is shared; it names the single-consumer sets (`sm_shadow_*`, `face_*`, one tile and one sticker per game) and the reused shape/cut-out/animal art. |
| F8 | `rg "twenty\|20 game\|all 20" docs` shows no live stale count in the checklist: lines 251, 260, 455, 538 and 539 all say twenty-two. Remaining hits are historical records (`release-notes-*`, `release-checklist.md`, `perf-baseline.md`) that the spec puts out of scope. |

## Commands

Run at the phase checkpoint `b409aed` (squashed), after the last content edit:

| Command | Exit code |
| --- | --- |
| `pnpm check` | 0 (1 pre-existing lint warning in `src/__tests__/scenes/musicalMemoryScene.test.ts:294`) |
| `pnpm typecheck` | 0 |
| `pnpm test -- --run` | 0 (103 files, 2,208 tests) |
| `pnpm test:coverage` | 0 (98.13 / 90.54 / 98.14 / 98.96) |
| `pnpm build` | 0 |
| `node scripts/validate-bundle.js` | 0 (shell 195.4 kB ≤ 200 kB; one Phaser chunk) |
| `node scripts/validate-pwa.js` | 0 (15 passed, 0 failed) |

The chain was run as one command:
`pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js` — exit 0.

## Deviations

| File | Why |
| --- | --- |
| `docs/device-testing-checklist.md:251` | Outside F8's four named lines, but the identical defect class in the same file: the Hub tile count read "20" against a 22-tile hub, one line above the twenty-two Back-button line that was being fixed. Leaving it would have kept the checklist self-contradictory. Corrected to twenty-two and to the real 6×4 grid (`hubGrid.ts:20-21`). |
| `docs/PRD.md:522` | F3-adjacent: with the shared chunks now named separately, the sentence's "game chunks ranged from about 0.5 kB" had no referent — the smallest game scene chunk is 1.22 kB, and 0.45 kB is a hoisted logic module. Changed to "about 1.2 kB" from this build. |
| `docs/PRD.md:502` | F7-adjacent: the boot-set sentence still said the set covers "the shared art every game draws on", which the corpus contradicts for the Feelings Faces drawings and the Shadow Match silhouettes that §7.3 now names as single-consumer art. Reduced to "the art the games draw on" so the two paragraphs agree. |
| `docs/PRD.md:381` | Part of F6: the clamp's "(1 to 3)" restatement was removed so §7.3 is the single home for the ladder and its range, matching the same paragraph's new link. |

No file outside `docs/PRD.md`, `docs/TDD.md` and `docs/device-testing-checklist.md` was
changed; nothing under `src/`, `scripts/`, `public/` or `package.json` was touched.

## Follow-up debt

Wrong in **code** or in another document's scope, therefore recorded and not fixed in
a docs-only track:

| Where | What is wrong | Correct value |
| --- | --- | --- |
| `src/utils/textureTiers.ts:8-11` | Header comment says "`icon` (160): Hub tile icons, shadow silhouettes, **letters, numerals**, small UI symbols — largest known display ≈ 128 px". The rule table has no letter or numeral entry, so the comment describes behaviour that does not exist. This comment is the origin of the PRD's F1 error. | Letters and numerals resolve to `card` (256 px); only `tile_*`, `sm_shadow_*` and the five exact glyph keys are icon. A code fix would either add the rules or correct the comment — a `src/` change, out of scope here. |
| `docs/device-testing-checklist.md:254` | "Sticker shelf shows **twenty** 56px stickers" | There are 22 `sticker_*` keys in `SHAPE_ASSETS` (one per game). |
| `docs/device-testing-checklist.md:265` | "the Hub pages to **2 pages of 10 tiles**" | `src/game/hubPaging.ts:14-17`: `PAGE_SIZE = 10`, `PAGE_COUNT = 3` — 10 + 10 + 2. |
| `docs/device-testing-checklist.md:272` | "the Hub remains the single **5×4** grid with no paging UI" | `src/game/hubGrid.ts:20-21`: the wide grid is 6×4 over 22 tiles. |
| `docs/perf-baseline.md:152` | "all **20** tiles" in a recorded baseline run | 22 tiles; a historical measurement record, out of scope per the spec's Out of Scope list. |
| `src/main.ts:30` | "7 game scenes" comment | Already carried as out-of-scope debt by the track review. |

## Primary verification

Independent chain at the phase checkpoint `b409aed` (this phase was squashed into that single commit; the pre-squash SHAs this file used to cite - `ddf75db`, `2689c8e` - are unreachable from the branch and are named here only so the record is not silently rewritten. The content commit and this file
evidence file), run by the primary:

| Command | Result |
| --- | --- |
| `pnpm check` | exit 0 — 206 files, 1 pre-existing `musicalMemoryScene.test.ts:294` warning + biome schema info |
| `pnpm typecheck` | exit 0 |
| `pnpm test -- --run` | 103 files / 2,208 tests pass |
| `pnpm test:coverage` | 98.13 / 90.54 / 98.14 / 98.96; `decodeLogic.ts` **74.54 / 56.66 / 83.33 / 73.8, uncovered 63-77** — exactly the figures now in TDD §10 |
| `pnpm build` | `GameSceneBase` 7.98 kB, `ChoiceRoundScene` 2.36 kB, `index-Dhenc0xK.js` 200.12 kB |
| `validate-bundle` | PASS — shell 195.4 kB of 200 kB, one Phaser chunk |
| `validate-pwa` | 15 passed / 0 failed |

**Findings re-verified by reading the corrected text:**

| ID | Primary check |
| --- | --- |
| F1 | `docs/PRD.md:506-507` now states icon tier covers the 22 `tile_*`, the eight `sm_shadow_*` and the five exact UI keys, and that letters and numerals land on the card tier because no rule matches them — matching `textureTiers.ts:29-34` and TDD §3.4 |
| F2 | `docs/TDD.md:879` names `decodeLogic.ts` with the run's own figures; `sceneRegistry.ts` is described as fully covered |
| F3 | `docs/PRD.md:518` lists the three shell scenes and the Hub's components; `:521` lists the hoisted chunks (`GameSceneBase` 7.98, `ChoiceRoundScene` 2.36, `GroupMathScene` 2.02, `dragJuice` 1.03, shared logic) separately — no self-contradiction |
| F4 | `docs/TDD.md:805` now says `setBGMEnabled` restores unconditionally and `setSFXEnabled` only when disabling |
| F5 | Arithmetic reproduces exactly: `(35 × 160² + 141 × 256² + 2 × 512²) × 4 = 42,643,456 B` = 40.67 MiB |
| F6 | PRD keeps the behaviour and links to TDD §7.3 / §8.3 for the ladder and duck constants |
| F7 | `docs/PRD.md:502` and §7.1 no longer claim every boot drawing is shared by two or more games |
| F8 | `docs/device-testing-checklist.md` twenty-game lines corrected, plus line 251 (5×4 grid / 20 tiles) by declared deviation |

**Diff scope:** 4 files — `docs/PRD.md`, `docs/TDD.md`,
`docs/device-testing-checklist.md`, this evidence file. Nothing under `src/`,
`scripts/`, `public/` or `package.json` (NFR-1 holds). No merge commits.

**Deviation accepted:** line 251 of the device checklist ("All 20 game tiles are
visible (5x4 grid)") was outside F8's four named lines but is the same defect in the
same file, one line above the Back-button line being fixed. Fixing it is right.

**Follow-up debt recorded, not fixed:** `src/utils/textureTiers.ts:8-12` header
comment still puts letters and numerals at the icon tier — the origin of F1. Two more
stale spots in `docs/device-testing-checklist.md` (the 56 px sticker count and a
"2 pages of 10 tiles" line against `hubPaging`'s `PAGE_COUNT = 3`) are outside this
phase's findings and belong to the next docs pass.