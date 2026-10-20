# Phase 2 evidence — TDD restructure

- **Track:** `20261020-prd-tdd-truth-pass` (PRD & TDD Truth Pass)
- **Branch:** `chore/20261020-prd-tdd-truth-pass`
- **Phase base:** `f3e1d6c`
- **Date:** 2026-10-20
- **Scope:** FR-5, FR-6, FR-7, FR-8, AC-4, AC-5, AC-6, AC-7
- **Diff:** `docs/TDD.md` (842 insertions, 646 deletions) plus this file.

---

## Fact base

Every number in the rewritten TDD comes from a command or a file read during this phase.

| Fact | Command / source | Value |
| --- | --- | --- |
| Tracked files under `src/` | `git ls-files src` | 417 total: 295 production, 103 test files, 6 test helpers, 2 test `.gitkeep`, 11 production `.gitkeep` |
| Production files under `src/` (non-test, non-`.gitkeep`) | `git ls-files src`, excluding `src/__tests__/**` and `.gitkeep` | 295 = 93 code/style + 202 SVG |
| Scene files | `git ls-files src/scenes` | 29 |
| Component files | `git ls-files src/components` | 15 (9 root + 6 in `settings/`) |
| Game logic modules | `git ls-files src/game` | 30 |
| Utils | `git ls-files src/utils` | 14 |
| SVG corpus | `git ls-files src` (paths under `src/assets/svg/`) | 202 across 11 folders |
| Boot asset table | `grep -c '^  \{ key: ' src/scenes/PreloadScene.ts` | 178 entries |
| Scenes importing `getAdaptiveBandShift` | `grep '^import \{ getAdaptiveBandShift' src/scenes` | 14 files → 15 games (`GroupMathScene` covers Add It Up + Take Away) |
| Games on `ChoiceRoundScene` | `grep '^export class \w+ extends' src/scenes` | 14 (12 direct, 2 via `GroupMathScene<…>`) |
| Games on `GameSceneBase` directly | same | 8 |
| Game count | `GAME_IDS` in `src/types/index.ts` | 22 |
| Test suite | `pnpm test -- --run` | 103 files / 2,208 tests, all passing |
| Coverage | `pnpm test:coverage` | statements 98.13, branches 90.54, functions 98.14, lines 98.96 |
| Coverage thresholds | `vite.config.ts` | lines 95 / functions 88 / branches 85 / statements 90 |
| Shell entry | `node scripts/validate-bundle.js` | 195.4 kB of a 200 kB gate |
| Phaser vendor chunk | `node scripts/validate-bundle.js` | 1342.6 kB |
| Story Order chunk | `pnpm build` | 33.92 kB (carries all 24 panel SVGs) |
| Precache entries | `pnpm build` (PWA step) | 45 entries, 1,695.14 KiB |
| Storage write path | `src/utils/storage.ts` | `saveV2()` at lines 81–85, unguarded `localStorage.setItem` |
| Storage keys | `src/utils/storage.ts` | `abby-little-lab:v2`, `abby-little-lab:v1` |
| SFX names | `src/audio/AudioManager.ts` | `pop`, `correct`, `incorrect`, `wake`, `win`, `sticker` |
| Duck / watchdog | `src/audio/AudioManager.ts` | `BGM_VOLUME 0.3`, `BGM_DUCKED_VOLUME = 0.3 * 0.08`, 120 ms ramp in 20 ms steps, 15 s watchdog |
| Texture tiers | `src/utils/textureTiers.ts` | `icon 160`, `card 256`, `hero 512` |
| pnpm / Node pins | `Dockerfile`, `.github/workflows/ci.yml` | pnpm 11.7.0, Node 22 |
| Installed CLI versions (informational) | `pnpm check` / build output | Biome 2.5.10, Vitest 4.1.11, Vite 8.2.2 — all satisfy the `package.json` ranges quoted in the TDD |

Numbers carried over from the brief and re-confirmed here: 29 scenes, 15 components, 30 logic modules, 14 utils, 202 SVGs, 178 boot entries, 195.4 kB shell, 45 precache entries, 2,208 tests, 103 test files.

Two numbers in the brief's "verified facts" did not reproduce and were corrected against the tool output rather than copied:

| Brief | Measured | Action |
| --- | --- | --- |
| coverage "98.11 / 90.46 / 98.14 / 98.96" | statements 98.13, branches 90.54, functions 98.14, lines 98.96 | TDD states the measured values in an explicit order |
| "Phaser vendor chunk ~1.37 MB" | 1342.6 kB by the validator, 1,374.82 kB in the build table | TDD states 1342.6 kB and names the validator as the source |

---

## Tree reconciliation

The documented tree in [§2.2](../../../docs/TDD.md#22-source-tree) was built from the `git ls-files src` output and checked back the other way.

### Counts both ways

| Directory | Files under `src/` (excluding `__tests__`, `.gitkeep`) | Files listed in the TDD tree | Delta |
| --- | --- | --- | --- |
| `src/` root (`main.ts`, `vite-env.d.ts`) | 2 | 2 | 0 |
| `src/styles/` | 1 | 1 | 0 |
| `src/audio/` | 1 | 1 | 0 |
| `src/types/` | 1 | 1 | 0 |
| `src/components/` (root) | 9 | 9 | 0 |
| `src/components/settings/` | 6 | 6 | 0 |
| `src/game/` | 30 | 30 | 0 |
| `src/scenes/` | 29 | 29 | 0 |
| `src/utils/` | 14 | 14 | 0 |
| `src/assets/` (non-SVG) | 0 | 0 (documented as empty; BGM lives in `public/`) | 0 |
| `src/assets/svg/` | 202 | 202 (grouped, see below) | 0 |
| **Total production** | **295** | **295** | **0** |

Every path in the documented tree exists in `git ls-files src`; no path was invented and no production file is missing. 295 documented = 295 present.

### Folded lines (deliberate)

| Grouped line | Files folded | Why |
| --- | --- | --- |
| `letters/` | 26 `letter_a.svg` … `letter_z.svg` | uniform naming, universal alphabet; the TDD states the naming rule instead of 26 rows |
| `numbers/` | 10 `numeral_0.svg` … `numeral_9.svg` | same |
| `shapes/` | 18 `shape_*` + 18 `cutout_*` | described as outlines plus filled twins; listing 36 names adds nothing |
| `ui/tiles/` | 21 `tile_*` | one tile per game plus `tile_feelings_faces` in `ui/`; the folder line states the count |
| `stories/` | 24 `story_*` panels | 8 strips × 3 panels; the panel set is described by the Story Order section |
| `.gitkeep` | 11 production placeholders | not production files; listed explicitly as excluded |

The remaining folders (`animals` 9, `feelings` 4, `items` 23, `shadows` 8, `stickers` 22, `toys` 7, `ui` root 12) are enumerated by name in [§2.3](../../../docs/TDD.md#23-asset-corpus).

### Excluded by design

- `src/__tests__/**` — 103 `.test.ts` files, 6 helpers, 2 `.gitkeep`. Covered by [§10](../../../docs/TDD.md#10-testing) instead of the production tree, per the spec's "a test-only file — listed under test section, not production tree".
- 11 production `.gitkeep` files.

---

## Asset manifest reconciliation

| Folder | TDD manifest | Files in `git ls-files` under the folder | Match |
| --- | --- | --- | --- |
| `animals/` | 9 | 9 | yes |
| `feelings/` | 4 | 4 | yes |
| `items/` | 23 | 23 | yes |
| `letters/` | 26 | 26 | yes |
| `numbers/` | 10 | 10 | yes |
| `shadows/` | 8 | 8 | yes |
| `shapes/` | 36 | 36 (18 `shape_*`, 18 `cutout_*`) | yes |
| `stickers/` | 22 | 22 | yes |
| `stories/` | 24 | 24 | yes |
| `toys/` | 7 | 7 | yes |
| `ui/` | 33 | 33 (12 in `ui/`, 21 in `ui/tiles/`) | yes |
| **Total** | **202** | **202** | **yes** |

202 is the figure in the spec's dated FR-6 / AC-5 corrective note. A 207-file count would include the five `.gitkeep` placeholders under `src/assets/svg/{animals,items,shapes,stickers,ui}/`, which are not assets.

Boot versus corpus: `SHAPE_ASSETS` holds 178 entries; the 24 that do not ride at boot are exactly the `stories/` panels, which load with the Story Order chunk ([§3.5](../../../docs/TDD.md#35-in-chunk-art)).

---

## What changed

| Area | Before | After |
| --- | --- | --- |
| Document shape | 9 sections organised by feature history, with dated 2026-08 addenda interleaved | 12 sections organised by subsystem: toolchain, layout, boot/budget, scenes, components, storage, logic, audio, motion, testing, build/PWA/CI |
| Directory tree | Hand-written, ~60 lines, missing bases, `settings/`, `feelings/`, `numbers/`, `stories/`, `ui/tiles/`, and 15+ modules | Rebuilt from `git ls-files src`; 295 production files, zero phantoms |
| Asset manifest | Per-folder prose tables; "SVG total (registered in PreloadScene) 142" | Per-folder counts that match the corpus (202), split into boot set (178) and in-chunk set (24) |
| Scene architecture | One dated note about code splitting quoting a commented-out sketch | `GameSceneBase` → `ChoiceRoundScene` → `GroupMathScene` documented with owned members, constants, abstract contract and the 22-row base table |
| Storage | v1 schema plus a partial v2 note | Full v2 schema (profiles, stickers, progress, `recent`, `playTime`, all four `Settings` fields, 22 `GameId`s), facade table, migration, cache, and the unguarded write |
| Audio | SFX list and "0.3 volume" | Singleton lifecycle, per-effect synthesis table, duck-to-8 % over 120 ms in 20 ms steps, 15 s watchdog, visibility policy, never-persisted duck level |
| Testing | Dated coverage snapshot, thresholds "80 for all four" | 103 files / 2,208 tests, five helpers, suite split, real thresholds, measured coverage, explicit non-goals |
| CI | `check` → `test` → `build` → `validate-pwa` | `check` → `typecheck` → `test` → `build` → `validate-bundle` → `validate-pwa` → `validate-boot`, tag-gated Coolify POST deploy |
| PRD relationship | Restated product intent inline | Links to `docs/PRD.md` anchors for every "why"; describes mechanism only |
| Voice | "✅ Implemented" style status notes and dated changelog rows | Implementation reference prose; history lives in `conductor/tech-stack.md` |

## Stale claims fixed

| Stale claim in the old TDD | What the tree says | Where it is now |
| --- | --- | --- |
| "twenty game scenes", "all twenty games" in three places | 22 games (`GAME_IDS`) | §4.5 table; no `twenty` remains (`rg` clean) |
| "23 registry loaders incl. aliases" | 22 loaders, identical to the 22 `GAME_KEYS` | §4.1 |
| "the 8 game scenes are lazy-loaded" | 22 game scenes lazy-loaded | §4.1 |
| Directory tree without `ChoiceRoundScene`, `GroupMathScene`, `GameSceneBase` | all three exist and are the inheritance spine | §2.2, §4 |
| Tree without `components/settings/` (6 files) | `settings/` group exists | §2.2, §5.5 |
| Tree without `feelings/`, `numbers/`, `stories/`, `ui/tiles/` | all four exist | §2.2, §2.3 |
| Tree without `svgDataUri.ts`, `textureTiers.ts`, `storyOrderArt.ts`, `fonts.ts`, `typography.ts`, `viewportZoom.ts`, `pwaBridge.ts`, `pwaInstall.ts` | all exist | §2.2 |
| Asset summary "SVG total 142" | 178 boot entries over a 202-file corpus | §2.3, §3.6 |
| UI manifest listing `wooden_tray.svg`, `shelf.svg`, `lock_icon.svg`, `star.svg`, `dotted_path.svg` | none of these files exist; the folder holds 12 glyphs plus 21 tiles | §2.3 |
| "Find the Letter textures 256/128px" as a one-off | texture tiers govern every key | §3.4 |
| v1 `GameId` union of 10 ids | 22 ids, in `src/types/index.ts` | §6.2 |
| "Game IDs" table covering 1–18 only | 22 games, 15 adaptive / 7 fixed | §4.5 |
| v2 schema without `progress`, `activity`, `recent`, `preferredVoiceURI`, `adaptiveDifficulty` | all present | §6.2 |
| No mention of `RoundNarrator`, `playTimeLogic`, `progressLogic`, `profileLogic`, `voiceLogic` | each documented with its mechanism | §5.1, §7.1, §7.3 |
| "955 tests across 36 files", thresholds 80/80/80/80 | 103 files / 2,208 tests; thresholds 95/88/85/90 | §10.2, §10.3 |
| Build: "entry ~1.44 MB / 372 KB gzip", "no `manualChunks`", "20 precache entries" | 195.4 kB shell gate, isolated `phaser` chunk via `build.rolldownOptions`, 45 precache entries | §3.6, §11.1 |
| CI running `check`, `test`, `build`, `validate-pwa` only; deploy on push to `master` | adds `typecheck`, `validate-bundle`, `validate-boot`; deploy is tag-gated | §11.4 |
| Dated release-history rows (v1.1.0 run id, v1.4.0 device pass, play-time "not yet released") | history belongs in release notes / `conductor/tech-stack.md` | removed; release readiness links to the PRD |
| Memba-style "✅ Implemented (2026-08-xx)" markers | no information | removed |

Not changed, but noticed: the comment above the `scene` array in `src/main.ts:30` still says "the 7 game scenes are lazy-loaded". The TDD documents the actual 22; the source comment is outside this track's Touches.

---

## Acceptance criteria

| AC | Requirement | Proof |
| --- | --- | --- |
| AC-4 | Directory tree lists every file under `src/` | 295 production files present vs 295 listed; per-directory table above shows delta 0 in every folder; `git ls-files src` is the only source. Grouped lines are enumerated in "Folded lines". |
| AC-5 | Asset manifest per-folder counts match the tracked corpus | 202 across 11 folders, each row matching `git ls-files`; the 207 discrepancy is explained as five `.gitkeep` placeholders. |
| AC-6 | Storage docs name the FR-7 fields and the unguarded write | §6.2 lists `activeProfileId`, `profiles` (`id`, `avatarId`, `createdAt`, `stickers`, `playTime`, `progress`, `activity`), `settings` (`bgmEnabled`, `sfxEnabled`, `preferredVoiceURI`, `adaptiveDifficulty`), `playTime` (`limitMinutes`, `usedMinutes`, `lastUsedDate`), `GameProgress` incl. `recent`, and all 22 `GameId`s; §6.5 quotes `saveV2()` from `src/utils/storage.ts:81-85` and states that `setItem` is unguarded. |
| AC-7 | Audio docs match `src/audio/AudioManager.ts` | §8.2 lists the six `SFX_NAMES`; §8.3 states `BGM_VOLUME 0.3`, duck to `× 0.08`, 120 ms ramp in 20 ms steps, 15 s watchdog, restore on `speech:end`/`speech:error`, and that the ducked level is never persisted; §8.4 states the visibility pause/cancel/resume policy. |

Cross-check: `grep -n "twenty\|207\|142 SVG\|955 tests\|23 registry" docs/TDD.md` → no matches.

---

## Commands

Final chain, run after the last edit to `docs/TDD.md`:

| # | Command | Exit |
| --- | --- | --- |
| 1 | `pnpm check` | 0 (1 warning: existing `noNonNullAssertion` in `musicalMemoryScene.test.ts`; 1 info: `biome.json` schema pinned 2.5.5 vs CLI 2.5.10) |
| 2 | `pnpm typecheck` | 0 |
| 3 | `pnpm test -- --run` | 0 — 103 files / 2,208 tests |
| 4 | `pnpm test:coverage` | 0 — 98.13 / 90.54 / 98.14 / 98.96 |
| 5 | `pnpm build` | 0 — shell `index-Dhenc0xK.js` 200.12 kB raw, 45 precache entries |
| 6 | `node scripts/validate-bundle.js` | 0 — "PASS: shell entry index-Dhenc0xK.js = 195.4 kB (<= 200 kB)" |
| 7 | `node scripts/validate-pwa.js` | 0 — "Results: 15 passed, 0 failed" |

Full chain executed as one command: `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js` → exit 0.

## Deviations

none

## Primary verification

Ran the exact chain independently at head `0041555` plus one clarifying edit of my
own (below), on a tree whose only change is documentation:

| Gate | Result |
| --- | --- |
| `pnpm check` | exit 0 - one pre-existing warning (`musicalMemoryScene.test.ts:294`), one schema info note |
| `pnpm typecheck` | exit 0, silent |
| `pnpm test -- --run` | 103 files / 2,208 tests passed |
| `pnpm test:coverage` | 98.13 statements / 90.54 branches / 98.14 functions / 98.96 lines |
| `pnpm build` | exit 0, `StoryOrderScene-BtF2cH14.js` 33.92 kB, shell `index-Dhenc0xK.js` 200.12 kB raw |
| `node scripts/validate-bundle.js` | PASS - Phaser vendor chunk present, shell 195.4 kB (<= 200 kB) |
| `node scripts/validate-pwa.js` | 15 checks passed, 0 failed |

**Scope.** `git diff --stat f3e1d6c..HEAD` is `docs/TDD.md` and this evidence file
only, two commits, no merges, clean tree.

**Tree reconciliation, checked the other way.** `git ls-files src` excluding
`__tests__` and `.gitkeep` is **295** production files: 202 SVGs plus 93 non-SVG.
The documented tree resolves **98** distinct file names, each of which exists in
git (the single regex miss, `this.load.svg`, is a snippet inside a code block, not
a tree line). The 202 SVGs are folded into 11 explained folder lines - a grouping
that is stated in the document, so a reader is not left thinking 98 files is the
whole tree.

**Asset manifest.** Per-folder counts re-derived with `git ls-files`: animals 9,
feelings 4, items 23, letters 26, numbers 10, shadows 8, shapes 36, stickers 22,
stories 24, toys 7, ui 33 = 202; boot set 178, so the 24 non-boot files are
exactly `stories/`. This matches the document and the corrected spec.

**Schema and audio claims.** Read against source: section 6.4 documents the v1 to
v2 migration through `migrateV1()`, and line 671 names the `setItem` call as
**unguarded** with the three failure modes - the concrete limitation AC-6 asks
for. Section 8.3 states the ducked level is **never persisted** and that only
`bgmEnabled`/`sfxEnabled` are written; `destroy()` is documented as clearing the
ramp, the watchdog and both listeners. AC-6 and AC-7 hold.

**Two figures that did not reproduce, and how they were handled.**

- *Coverage.* The brief quoted 98.11 / 90.46; the executor measured 98.13 / 90.54
  and wrote that. I then got both values on an unchanged tree in consecutive runs,
  so coverage here fluctuates in the second decimal (a small number of branches
  are exercised non-deterministically). The document states the measured values,
  the thresholds have more than three points of margin, and no gate depends on the
  difference. Worth knowing before someone chases a 0.02 delta.
- *Phaser chunk units.* The validator prints `1342.6 kB`, the Vite build prints
  `1,374.82 kB`. They are the same 1,374,822 bytes - binary versus decimal units -
  so the table now says both and explains why, instead of inviting a reader to
  think one of them is wrong. That is the one edit I made myself.

**Carry-over found by the executor, deliberately not fixed here.** `src/main.ts:30`
still says "the 7 game scenes are lazy-loaded" where 22 are. It is a code comment,
so it belongs to a source track rather than this docs-only one; recorded in the
integrated verification as follow-up debt.