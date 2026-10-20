# Phase 1 evidence: PRD restructure

| Field | Value |
| --- | --- |
| Track | `20261020-prd-tdd-truth-pass` |
| Phase | 1, PRD restructure |
| Branch | `chore/20261020-prd-tdd-truth-pass` |
| Phase base | `77b9693` |
| Date | 2026-10-20 |
| Files changed | `docs/PRD.md` only |
| Commits | `79bc8cf` (PRD rewrite), `f03dc79` (evidence), and the follow-up `docs(prd): correct the Decode It curriculum row` commit that carries this line |

## Fact base

Every number stated in the rewritten PRD was taken from the command below, not
from the previous document.

| Fact | Command | Value |
| --- | --- | --- |
| Game count | read `src/types/index.ts` `GAME_IDS` (line 96) | 22 ids in hub order, `shape-sorter` through `story-order` |
| Adaptive games | grep tool, pattern `getAdaptiveBandShift` in `src/scenes` | 14 files, 15 games: Alphabet, FirstSounds, DecodeIt, MusicalMemory, ColorMatch, MemoryMatch, MoreLess, GroupMath (Add It Up and Take Away), HowMany, NumberOrder, OddOneOut, PatternBuilder, WordMatch, WordBuilder |
| Fixed games | same result, inverse | 7: Shape Sorter, Animal Trace, Pop & Freeze, Shadow Match, Big vs. Small, Feelings Faces, Story Order |
| Boot SVG entries | grep `^  \{ key: "` in `src/scenes/PreloadScene.ts` | 178 (lines 191 to 368) |
| Texture tiers | read `src/utils/textureTiers.ts` | `TEXTURE_SIZES` icon 160, card 256, hero 512 |
| SVG folders and files | grep `<svg` with `include=*.svg`, once per folder | feelings 4, animals 9, items 23, letters 26, numbers 10, shadows 8, shapes 36, stickers 22, stories 24, toys 7, ui 33 (12 root + 21 tiles) = 202 across 11 folders |
| Shell entry size | `node scripts/validate-bundle.js` | 195.4 kB, gate `<= 200 kB` |
| Phaser vendor chunk | `node scripts/validate-bundle.js` | `phaser-P1E8uaLi.js` 1342.6 kB |
| Game chunk range | `pnpm build` | 0.45 kB (`shapeSorterLogic`) to 33.92 kB (`StoryOrderScene`) |
| Test count | `pnpm test -- --run` | 2208 tests, 103 files |
| Coverage | `pnpm test:coverage` | 98.11 statements, 90.46 branches, 98.14 functions, 98.96 lines |
| Precache entries | `pnpm build` (PWA step) | 45 entries, 1695.14 KiB |
| Parental hold | read `src/components/ParentLock.ts` | `DEFAULT_HOLD_DURATION = 3000`, ring `0x68d391` at 0.6 |
| Adaptive window | read `src/game/adaptiveLogic.ts` | `WINDOW_SIZE = 10`, `MIN_SAMPLE = 6`, up at `>= 0.9`, down at `< 0.6`, `BASE_LADDER = [1,1,2,2,3,3]`, clamp 1 to 3 |
| Profile cap and avatars | read `src/types/index.ts` | `MAX_PROFILES = 4`, six `AVATAR_IDS`, `DEFAULT_AVATAR_ID = "cat"` |
| Play-time options | read `src/components/settings/ProfilesOverlay.ts` | `[null, 15, 30, 45, 60]`, label `Off` or `15m` |
| Play clock is visible time only | read `src/game/playTimeLogic.ts` | session banks `visibleMs`, `pausePlaySession`/`resumePlaySession` idempotent, hidden document never accrues |
| Narrator construction sites | grep `new SpeakerButton` in `src` | 16 hits, production sites only `RoundNarrator.ts:203` plus the component test |
| Rule-line games | grep `createSpokenInstruction(` and `RULE_LINE` | 11 call sites + Feelings Faces local rule line, covering 12 games (GroupMath covers 2) |
| Per-round prompt games | grep `createRoundNarrator({` | 12 sites: 9 speak a target, Feelings Faces mixes rule and scenario, Musical Memory replays notes only |
| Shared choice base | grep `extends (ChoiceRoundScene|GroupMathScene)` | 15 declarations: 12 concrete direct, the abstract `GroupMathScene`, and Add It Up plus Take Away |
| Mascot coverage | grep `createCornerMascot()` | 22 hits: 22 game scenes (21 files, GroupMath covers 2) plus the base definition |
| Story art in chunk | read `src/game/storyOrderArt.ts` | 24 `?raw` imports in the game module, doc comment says the test keeps `PreloadScene` free of it |
| Audio duck | read `src/audio/AudioManager.ts` | duck to 8 percent, 120 ms ramp, 15 s watchdog, duck level never persisted |
| Release gates | read `.github/workflows/ci.yml` | check, typecheck, `CI=true pnpm test`, build, validate-bundle, validate-pwa, validate-boot; deploy only on `v*` tags with a master lineage guard |
| Orientation and frame | read `src/main.ts`, `vite.config.ts` | 1024x768, `Phaser.Scale.FIT`, `CENTER_BOTH`, manifest `orientation: landscape`, `display_override: [fullscreen, standalone]` |

## Section decisions on the original PRD

The original file had 44 headings and no section 4. Each section was labelled
before rewriting.

| Original section | Decision | Reason |
| --- | --- | --- |
| Front matter table | rewrite | Six rows, no game count; kept as a table and extended with Games, Offline, Data and Runtime |
| 1. Executive Summary and Core Objectives | rewrite | Claimed 18 distinct mini-games; the shipped count is 22 |
| 1. UX and Touch Architecture Requirements | rewrite | Requirements true, but they belong with interaction, so they became 5.2 to 5.5 |
| 2. AI-Generated SVG Visual Asset Pipeline | rewrite | Described a uniform 512 by 512 rasterisation and a per-asset prompt process; the shipped pipeline rasterises at three tiers, so the section became 7.1 |
| 2. SVG Vector Generation Workflow | remove | Authoring history, not a product requirement; its one surviving product fact (SVG source, rasterised at load) is in 7.1 |
| 2. Standardized Prompt Engineering Matrix | remove | A generation-time prompt catalogue with no shipped behaviour attached; keeping it would preserve a stale process description |
| 3. Cross-Game Systems | rewrite | Said replay variety is fixed for every game, listed six scenes for the mascot, and had no profiles, play time, progress or voice; became section 4 |
| 3. GAME 1 to GAME 20 | rewrite | Replaced with 22 entries in one five-field template |
| 3. Adaptive Difficulty (15 games) | rewrite | Correct count, wrong threshold (claimed at least 10 taps; the code requires at least 6 within a 10-tap window) and named only five fixed games |
| 5. Game Flow and Navigation | keep concept, rewrite | The flow is still true; the numbers were not (20 tiles, 5x4 grid, 20 games of assets) |
| 5. Scene State Machine diagram | remove | Redundant once 1.5 describes the same flow in prose, and it hard-coded the stale counts |
| 5. Navigation Rules | rewrite | Settings, install, update and reset behaviour moved to 4.10, 5.3 and 6.5 |
| 5. Release-decision blockquotes (2026-08-01 to 2026-08-09) | remove | Dated release records, which the voice guide excludes from the PRD; every still-true behaviour was folded into present-tense prose and every stale count dropped |
| 6. Color Palette and Design Tokens | keep | Core values still match the shipped palette (grep in `src` confirms `#faf9f6`, `#fff8e7`, `#2b6cb0`, `#2d3748`, `#68d391`, `#fc8181`); moved to 5.1 with both tables intact |
| 7. Audio Design Specification | keep, extend | SFX, synthesis and BGM were true; the section had no audio-focus policy, so 6.4 documents duck, watchdog and visibility behaviour |
| 8. Performance Targets | keep, rewrite | Target table kept in 7.4; the code-splitting blockquote was refreshed against the 1.20.0 build and split into 7.1 to 7.3 |
| 9. Release Readiness Decisions | rewrite | Install, update and HTTPS kept; CI and deploy updated to the current workflow |
| See Also | keep, extend | Still links the TDD; added the three conductor documents |

## What changed

`docs/PRD.md` is now nine sections with a table of contents and contiguous
numbering:

1. Product definition and audience, including platforms, offline behaviour and session flow.
2. Curriculum map: all 22 games grouped into nine developmental domains, each with a one-line mechanic and a link to its spec.
3. Game specifications 1 to 22. Every entry uses the same five fields: Mechanic, Rounds and pool, Difficulty, Narration, Art and assets. Games 21 (Feelings Faces) and 22 (Story Order) are new.
4. Cross-game systems: shared scene bases, the single narrator, the mascot, stickers, profiles, play-time limits, Learning Progress, adaptive difficulty, preferred voice, install and update.
5. Interaction, touch and motion: palette, touch targets, parental lock, textless cues, letterboxing, motion timings, reduced motion.
6. Audio: synthesized SFX, one music loop, speech, audio focus, toggles.
7. Performance and asset budget: the 178-entry boot set and its tiers, the 195.4 kB shell against the 200 kB gate, in-chunk art, runtime targets.
8. Release readiness: gates, deploy path, definition of done.
9. See also.

The rewrite is 503 insertions and 401 deletions against the original 466 line
file. It does not append: the old ordering, its missing section 4 and its
per-game heading style are gone.

## Stale claims fixed

| Was | Now |
| --- | --- |
| "18 distinct mini-games" | 22 games, stated in the front matter and section 1 |
| "all twenty games" in three places (celebration, mascot, asset loading) | 22 games, with the phrase removed rather than renumbered |
| Game list stopped at Game 20 | Games 21 and 22 specified |
| Replay variety "fixed difficulty" for every game | 15 adaptive, 7 fixed, fixed ones named in 4.8 |
| Adaptive shift "at least 10 taps" | at least 6 taps inside a 10-tap window |
| Five fixed games named | seven, adding Feelings Faces and Story Order |
| Boot rasterisation at a uniform 512 by 512 via `this.load.svg(..., 512)` | three tiers, 160 icon, 256 card, 512 hero, matched by key prefix |
| Per-track preload deltas ("168 to 170", "162 to 168") | one boot count, 178 entries, and Story Order's 24 panels in its own chunk |
| Hub "20 game tiles in a 5 by 4 grid" | 22 tiles, 6 by 4 on wide screens, 5 by 2 pages of ten, ten and two on phones |
| "Rows paged 6+6+6 for 18 games" | six rows per page over 22 games |
| Reset "clears all eight stickers" | clears the active profile's stickers for all 22 games, keeping settings and other profiles |
| Mascot in "all six game scenes" and later "all twenty" | every game scene, 22 of them |
| Startup bundle 1,473 to 1,444 kB with 20 precache entries | 195.4 kB shell against a 200 kB gate, separate Phaser chunk, 45 precache entries |
| Historical test counts (445, 490, 555, 667, 706, 955, 1260) | no per-milestone counts in the PRD; the current 2208 tests across 103 files is recorded here and in the release gate |
| No audio-focus policy | 6.4 documents duck to 8 percent, 120 ms ramp, 15 s watchdog, visibility pause and cancel, duck level never persisted |
| Section numbering skipped 4 | sections 1 to 9 are contiguous |

## Acceptance criteria

| Criterion | Proving command | Result |
| --- | --- | --- |
| AC-1, no stale game-count phrasing | grep tool, pattern `twenty games|all twenty|20 game scenes|twenty-two` over `docs/PRD.md` and `docs/TDD.md` | 0 matches in `docs/PRD.md`. `docs/TDD.md` still has 7 matches on lines 367, 569, 570, 628, 667, 686 and 724; they are Phase 2 scope and were left untouched |
| AC-2, both documents mention games 21 and 22 | grep `Feelings Faces` and `Story Order` in both documents | `docs/PRD.md` has 6 `Feelings Faces` hits and 8 `Story Order` hits, including both spec headings and the 2.2 table rows. `docs/TDD.md` has neither yet, which Phase 2 closes |
| AC-3, adaptive split stated precisely | grep `getAdaptiveBandShift` in `src/scenes`, compared with 4.8 | 14 files, 15 games; 4.8 states 15 adaptive, names all seven fixed, and explains the 14-file count via `GroupMathScene` |

The shell `rg` binary is not permitted in this environment, so both grep checks
ran through the built-in grep tool with the same pattern and paths. That is the
only difference from the command text in the spec.

## Commands

| Command | Exit code | Notes |
| --- | --- | --- |
| `pnpm check` | 0 | One pre-existing warning in `src/__tests__/scenes/musicalMemoryScene.test.ts:294` and one schema-version info note; neither is an error |
| `pnpm typecheck` | 0 | Clean |
| `pnpm test -- --run` | 0 | 103 files, 2208 tests passed |
| `pnpm test:coverage` | 0 | 98.11 statements, 90.46 branches, 98.14 functions, 98.96 lines |
| `pnpm build` | 0 | 301 modules; shell `index-Dhenc0xK.js` 200.12 kB raw (195.4 KiB), Phaser chunk 1374.82 kB raw, 45 precache entries |
| `node scripts/validate-bundle.js` | 0 | Shell 195.4 kB against the 200 kB gate; one Phaser vendor chunk |
| `node scripts/validate-pwa.js` | 0 | 15 checks passed, 0 failed |
| full chain, `pnpm check && ... && node scripts/validate-pwa.js` | 0 | Run as one command on the final tree, including the last PRD wording fix and this file. Two earlier runs of the identical chain failed on 5 s test timeouts under machine load (one test at 16:02, six at 16:04, all in unrelated logic and Hub tests); the run recorded here passed in full, with no test, config or source change in between. Every gate reads only `src/`, `scripts/` and `vite.config.ts` (see `biome.json` `files.includes`), so markdown edits cannot move these results |

## Deviations

None. No file outside `docs/PRD.md` was modified, and no source file was
changed to make a sentence true. One fact disagreed with the track documents
and is reported rather than edited into Conductor state: the SVG corpus has 202
files across 11 folders, while the spec and Phase 2 plan expect 207 (per folder:
animals 9 not 10, items 23 not 24, shapes 36 not 37, stickers 22 not 23, ui 33
not 34). The PRD therefore states per-game asset facts and no corpus total, so
AC-5 in Phase 2 needs the real count.

## Primary verification

Re-ran the exact chain independently at head `739f4b2`, after reading the diff:

| Gate | Result |
| --- | --- |
| `pnpm check` | exit 0 - one pre-existing warning (`musicalMemoryScene.test.ts:294`) and one schema info note |
| `pnpm typecheck` | exit 0, silent |
| `pnpm test -- --run` | 103 files / 2,208 tests passed |
| `pnpm test:coverage` | 98.11 statements / 90.46 branches / 98.14 functions / 98.96 lines |
| `pnpm build` | exit 0, 45 precache entries, shell `index-Dhenc0xK.js` 200.12 kB raw |
| `node scripts/validate-bundle.js` | PASS - shell 195.4 kB (<= 200 kB), one Phaser vendor chunk |
| `node scripts/validate-pwa.js` | 15 checks passed, 0 failed |

My figures match the executor's exactly, so the two flaked runs disclosed in the
evidence section above were machine-load artefacts rather than a masked failure:
the same tree re-runs green.

**Scope.** `git diff --stat 77b9693..HEAD` is `docs/PRD.md` (+649/-401 across three
commits) and this evidence file. No `src/`, `scripts/`, `public/` or `package.json`
change, no merge commits, tree clean.

**Content spot-checks against source.** Reading the rewritten sections against the
logic modules, every claim I sampled held: Shape Sorter slices three shapes per
round from an 18-shape pool (`shapeSorterLogic.ts:50`), Animal Trace takes 3 of
6 pairs (`animalTraceLogic.ts:25`), Pop & Freeze uses `WIN_TARGET = 6` with
`CONCURRENT_BUBBLES = 5` (`popFreezeLogic.ts:18-21`), Big vs. Small selects 3 toy
types at `BIG_SCALE = 1.5` / `SMALL_SCALE = 0.7` (`bigSmallLogic.ts:21-27`), and
`SHAPE_ASSETS` holds 178 boot entries. The adaptive split (15 adaptive / 7 fixed)
matches the 14 scene files that call `getAdaptiveBandShift`, with
`GroupMathScene` accounting for Add It Up and Take Away. AC-1, AC-2 and AC-3 are
met; AC-2's TDD half is explicitly Phase 2 work.

**Correction carried into the contract.** The executor was right that the SVG
corpus is 202 files, not the 207 my spec draft claimed - my count had included
five `.gitkeep` placeholders. Confirmed with `git ls-files`: animals 9, feelings
4, items 23, letters 26, numbers 10, shadows 8, shapes 36, stickers 22, stories
24, toys 7, ui 33. `spec.md` now carries a dated FR-6 / AC-5 corrective note and
the corrected figures, and `plan.md` P2.T1.2 names them, so Phase 2 inherits the
real numbers.

**Carry-overs for later phases.** `docs/TDD.md` still holds its 7 stale "twenty"
references and mentions neither new game (Phase 2). `conductor/product.md` says
"thirteen choice games" where the shipped count is 14 - Phase 3's facts table.