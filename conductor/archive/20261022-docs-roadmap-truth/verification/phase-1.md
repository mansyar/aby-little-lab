# Phase 1 Verification — The Technical Docs

| | |
| --- | --- |
| **Track** | `20261022-docs-roadmap-truth` (Docs & Roadmap Truth Pass) |
| **Phase** | 1 — The Technical Docs |
| **Date** | 2026-10-22 |
| **Branch** | `chore/20261022-docs-roadmap-truth` |
| **Base commit** | `a9fec06` — `conductor(plan): Mark phase 'The Technical Docs' as in progress` |
| **Head commits** | `1d7d8f7` — `docs: align PRD, TDD and new roadmap with the shipped 22-game app`<br>`7f1b127` — `docs(roadmap): correct the shuffle-seam count and the tracked contact-sheet figure`<br>plus this report's own `docs(conductor):` commit |
| **Result** | **verified** (AC-5 is phase-scoped — see the acceptance-criteria table) |

---

## 1. What this phase changed

Three documents, and nothing else. `src/` is untouched, so no behaviour described
by any document changed with it.

| File | Change |
| --- | --- |
| `docs/roadmap.md` | **New.** The single home for Known Issues and Future Work / Roadmap. Nine standing debts, each with a one-line symptom, the file it lives in and how a reader would notice it; the same nine items ordered by value as future work, each naming the track that would deliver it. |
| `docs/PRD.md` | §2.2/§3.6/§4.2/§4.8 game-6 name aligned to the shipped `GAME_REGISTRY` label **Big & Small** (anchor `#36-big--small`); all 21 §3.x "Art and assets" lines now name the lazy art group that carries the art instead of claiming the boot set; §4.1 game-asset count; §4.8 adaptive description (the 15/7 split, the six shift strategies, and the games that deliberately step outside the classic ladder); §6.1 rewritten as a per-game audio trio; §7.1/§7.2/§7.3 rewritten around the 53-key shell, the 12 lazy art groups and the measured build; §8.3 definition of done; §9 link to `docs/roadmap.md`. |
| `docs/TDD.md` | §2.1 scripts list (5 files); §2.2 source tree (`components/` 16, `game/` 33 modules + `art/` 16 + `hub/` 6) plus a Phaser-import note; §3.3/§3.4/§3.5/§3.6 boot set, texture tiers, in-chunk art and measured budgets; §4.2 `GameSceneBase` member table (`init()`, `preloadArt()`/`createArtCue()`, `reactWrong()`) and the `stickerKeyFor` delegation; §4.5 game-to-base table (Story Order on the shared `DragBoard`); §5.2 component count; §7.1 module list (`audioIdentity.ts`, `dragBoard.ts`, `art/`, `hub/`, and the decomposed `hubGrid.ts`); §7.3 adaptive banding; §8.2 effect table; **§8.7 The per-game audio identity** (new); §9.3 the shared drag shell and `reactWrong`; §10.2/§10.3/§10.4 suite size, coverage snapshot and SVG count; §12 link to `docs/roadmap.md`. |

---

## 2. Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| static | `pnpm check` | 0 | Biome: 247 files checked, 1 pre-existing warning (`src/__tests__/scenes/musicalMemoryScene.test.ts:294` `noNonNullAssertion`) and the pre-existing `$schema` version info (2.5.5 vs CLI 2.5.10). Both are out of scope (NFR-3) and unchanged by this phase. |
| static | `pnpm typecheck` | 0 | `tsc --noEmit` clean. |
| unit | `pnpm test -- --run --maxWorkers=2` | 0 | **118 test files, 2,488 tests, all passed** (375.18 s). |
| coverage | `pnpm test:coverage -- --maxWorkers=2` | 0 | 118 files / 2,488 tests passed (506.40 s); statements 97.92 % (5192/5302), branches 91.62 % (1269/1385), functions 96.58 % (1103/1142), lines 98.69 % (4823/4887) — all above the 90 / 85 / 88 / 95 gates. The lowest covered file is still `src/game/decodeLogic.ts` at 73.8 % lines. |
| build-artifact | `pnpm build` | 0 | Vite 8.2.2, 325 modules; shell entry `index-BrQ7goBH.js` 137.79 kB; Phaser chunk 1,374.82 kB; `precache 54 entries (1707.70 KiB)`. |
| build-artifact | `node scripts/validate-bundle.js` | 0 | `PASS: Phaser vendor chunk present: phaser-P1E8uaLi.js (1342.6 kB)`; `PASS: shell entry index-BrQ7goBH.js = 134.6 kB (<= 200 kB)`; all checks passed. |
| build-artifact | `node scripts/validate-pwa.js` | 0 | `Results: 16 passed, 0 failed`, including `Service worker precaches every emitted JavaScript chunk — 42 chunks, 42 precached`. |

The phase's verification command is
`pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js`.
It was run in that order; the two test layers used the `--maxWorkers=2` form the
brief sanctions for this machine (see **Deviations**).

---

## 3. Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| **AC-1** | PRD §7.1–7.3 describe a 53-key shell, 125 game art keys in 12 lazy groups and a 202-SVG corpus; no §3.x "Art and assets" line claims boot-set art when the art is lazy. | `docs/PRD.md` §7.1 (53 keys, 22 tile icons + 22 sticker icons + 2 mascot poses + `icon_speaker` + 6 avatars; the tier rule applied per key wherever that key lives), §7.2 (134.6 kB shell, 42 chunks), §7.3 (twelve groups, 131 keys, six of them shared avatars, 125 game-only; 149 of the 202 art files travel with a game; the Story Order panels; the placeholder and the loading cue; the boundary is a test). All 21 §3.x art lines now name the group that carries the art and say "rather than the boot set"; a `grep "boot set" docs/PRD.md` returns only those negations plus the shell's own description in §7.1/§7.2 and the definition of done in §8.3. | **verified** |
| **AC-2** | TDD §2.1/§2.2 list exactly the production files under `src/` including `src/game/art/`, `src/game/hub/`, `audioIdentity.ts` and `dragBoard.ts`; §10.2 states the current suite size. | `docs/TDD.md` §2.1 (five `scripts/` entries, `measure-first-tap.mjs` added), §2.2 (`components/` 16 files, `game/` 55 files = 33 modules + `art/` 16 + `hub/` 6, with the full `art/` and `hub/` subtrees), §10.2 ("118 test files, 2,488 tests (verified 2026-10-22)"). Every count was re-derived from the tree, not from the brief. | **verified** |
| **AC-3** | TDD §8 and PRD §6.1 describe the per-game audio identity; TDD §4.2/§4.5 match the current base classes and the game-to-base mapping. | `docs/PRD.md` §6.1 (the trio is per game; the identity sets a pitch offset, a waveform, a tempo and its own three contours; the incorrect cue is forced gently descending; the win cue is held inside 300–800 ms). `docs/TDD.md` §8.2 (effect table) and **§8.7 The per-game audio identity** (the field table, the 22-row table, the four index formulas, `identityForGameId`, the three helpers). §4.2 lists `init()`, `preloadArt()`/`createArtCue()` and `reactWrong()`; §4.5's 22 rows and its closing paragraph match the scene-inheritance scan. | **verified** |
| **AC-5** | `docs/roadmap.md` exists with both sections; README, PRD, TDD and perf-baseline each link to it; no other document holds a second copy. | `docs/roadmap.md` exists with **Known Issues** and **Future Work / Roadmap**. The PRD links it from §9 "See also"; the TDD links it from §9.3 and §12. No other document carries a second copy of either list. **The README and perf-baseline links are Phase 2 and Phase 3 work** — this phase's `Touches` is `docs/roadmap.md`, `docs/PRD.md`, `docs/TDD.md` only, so those two links are deliberately not yet written. | **partial** (phase-scoped: the roadmap document and the PRD/TDD links are done; the README and perf-baseline links land in Phases 2–3) |

---

## 4. Fact table — every figure changed, and where it came from

Each row was re-derived from the code on 2026-10-22. Where the brief's
hypothesis differed from the verified value, the verified value is the one in
the documents.

### 4.1 Asset and boot figures

| Figure | Was | Now | Derived from |
| --- | --- | --- | --- |
| Shell boot keys | 178 | **53** | `src/scenes/PreloadScene.ts` → `SHELL_ASSETS`; pinned by the 53-key literal in `src/__tests__/game/art/shellOwnership.test.ts` |
| Shell key breakdown | not stated | 22 `tile_*` + 22 `sticker_*` + 2 `mascot_*` + `icon_speaker` + 6 avatars | same test's `SHELL_KEYS` / `AVATAR_KEYS` lists |
| Lazy art groups | not stated | **12** groups, **131** keys, **125** game-only | `src/game/art/types.ts` (`ArtGroupId` union) + the per-group key lists in `src/game/art/*.ts`; counts asserted in `shellOwnership.test.ts` |
| Per-group key counts | not stated | shapes 18, cutouts 18, letters 26, numerals 10, animals 6, food 6, items 16, shadows 8, toys 7, faces 4, music 4, glyphs 8 | `src/game/art/*.ts` (sums to 131) |
| Art corpus | 178 SVG entries | **202** SVG files | folder counts in `docs/TDD.md` §2.3, re-counted over `src/assets/svg/**` |
| Texture keys in the app | 178 | **208** | 53 shell + 131 group + 24 Story Order panels (`src/game/storyOrderArt.ts`) |
| Art files that travel with a game | not stated | **149** of the 202 | 125 game-only group keys + 24 Story Order panels |
| Story Order panels | 24 ✓ (unchanged) | 24, travelling with the Story Order chunk | `src/game/storyOrderArt.ts` → `STORY_PANEL_ASSETS` |
| Texture tier rule | "a fixed 178-entry set" | per key, wherever it lives: icon 160 / card 256 / hero 512 | `src/utils/textureTiers.ts` → `TIER_RULES`, `tierForKey`, `textureSizeFor` |
| Boot raster cost | "42,643,456 B, about 40.7 MiB" | **removed** (NFR-4 — not derivable from the code, and the tiers are no longer uniform) | — |

### 4.2 Build and budget figures

| Figure | Was | Now | Derived from |
| --- | --- | --- | --- |
| Shell entry size | 195.4 kB (PRD) / 130.1 KiB (TDD) | **134.6 kB** as `validate-bundle.js` reports it (137.8 kB as Vite prints it — the same bytes in binary and decimal units) | `node scripts/validate-bundle.js` |
| Shell entry gate | 200 kB ✓ (unchanged) | 200 kB | `scripts/validate-bundle.js` |
| Phaser vendor chunk | 1342.6 kB ✓ (unchanged) | 1342.6 kB (1,374.82 kB as Vite prints it) | `node scripts/validate-bundle.js`; `pnpm build` |
| JavaScript chunks | 41 | **42** | `node scripts/validate-pwa.js` → "42 chunks, 42 precached"; `dist/assets/*.js` |
| Service-worker precache entries | 53 | **54** | the PWA step of `pnpm build` → `precache 54 entries (1707.70 KiB)` |
| Story Order chunk | ~33.9 kB | **~31.8 kB** | `pnpm build` → `StoryOrderScene-CqXhDuRc.js 31.84 kB` |
| `GameSceneBase` chunk | 7.98 kB | **11.85 kB** | `pnpm build` → `GameSceneBase-B6N9hos3.js 11.85 kB` |
| `ChoiceRoundScene` / `GroupMathScene` | 2.36 / 2.02 kB | **2.08 / 2.03 kB** | `pnpm build` |
| `dragBoard` chunk | absent | **4.29 kB** | `pnpm build` → `dragBoard-C8uwsY2y.js 4.29 kB` |
| `alphabetLogic` chunk | listed as hoisted | **dropped** — inlined into `AlphabetScene` | `pnpm build` (no `alphabetLogic-*.js` emitted) |
| PWA validator checks | 16 ✓ (unchanged) | 16 passed, 0 failed | `node scripts/validate-pwa.js` |
| Cold boot, first tap | 419.5 ms / 82 ms / 48 ms ✓ (kept, dated 2026-10-20) | unchanged, now explicitly dated and marked as evidence rather than a gate | `docs/perf-baseline.md`; `scripts/measure-first-tap.mjs` (the script does **not** build a pre-track commit — the old TDD sentence claiming it did was removed) |

### 4.3 Source tree and module figures

| Figure | Was | Now | Derived from |
| --- | --- | --- | --- |
| `scripts/` entries | 4 | **5** (`measure-first-tap.mjs` added) | `scripts/*` |
| `src/components/` | 15 files | **16 files** (10 top-level + 6 under `settings/`, `ArtLoadingCue.ts` added) | `src/components/**/*.ts` — the brief's hypothesis of 18 was wrong; 16 is the verified count |
| `src/game/` | 30 files | **55 files**: 33 modules + `art/` (16) + `hub/` (6) | `src/game/*.ts` (33), `src/game/art/*.ts` (16), `src/game/hub/*.ts` (6) |
| `src/game/hub/` | absent | 6 files: `gridBuilder`, `gridLayout`, `hubGridConstants`, `pageBoard`, `stickerShelf`, `timeUpDim` | `src/game/hub/*.ts` |
| `src/game/art/` | absent | 16 files: the 12 group modules + `index`, `registry`, `placeholder`, `types` | `src/game/art/*.ts` |
| `hubGrid.ts` role | "tile layout, 64 px tile icons, paging and sticker shelf rendering" | the Hub grid **orchestrator**, delegating to `hub/gridBuilder`, `hub/pageBoard`, `hub/stickerShelf` and `hub/timeUpDim` | `src/game/hubGrid.ts` |
| Scene inheritance | "8 / 12 / 2" ✓ (unchanged) | 8 scenes extend `GameSceneBase`, 12 extend `ChoiceRoundScene`, 2 reach it through `GroupMathScene` | `export class … extends …` over `src/scenes/*.ts` |
| Story Order's board | "own drag board" | the **shared** `DragBoard` | `src/scenes/StoryOrderScene.ts` imports `DragBoard`; only `NumberOrderScene` and `StoryOrderScene` use it |
| Game 6's name | "Big vs. Small" | **"Big & Small"** (anchor `#36-big--small`) | `src/game/gameRegistry.ts` → `GAME_REGISTRY[5].label` |
| `stickerKeyFor(gameId)` | "converts `-` to `_` before the `sticker_` prefix" | **delegates to the registry** — the convention is declared once in `gameRegistry.ts` | `src/game/gameRegistry.ts` → `stickerKeyForGame`; `src/scenes/GameSceneBase.ts` |

### 4.4 Behaviour figures

| Figure | Was | Now | Derived from |
| --- | --- | --- | --- |
| Adaptive participation | 15 of 22 ✓ (unchanged) | 15 of 22, with the seven fixed games named and the six shift strategies described | `getAdaptiveBandShift` across `src/scenes/`; `src/game/adaptiveLogic.ts` (`WINDOW_SIZE = 10`, `MIN_SAMPLE = 6`, `UP_THRESHOLD = 0.9`, `DOWN_THRESHOLD = 0.6`, `BASE_LADDER = [1,1,2,2,3,3]`) |
| Band clamping | "clamped to the game's supported range" | most games clamp to 1–3; **Odd One Out** uses its own per-shift ladder and deliberately deviates | `src/game/oddOneOutLogic.ts` → `ladderFor(shift)` and its doc comment |
| Shift strategies | 7 named | 6 named: a shifted ladder (7 games), one shifted band (Find the Letter, First Sounds), a tier split (Find the Word, Build the Word), Decode It's own tier split, a colour-pool split (Color Match), a per-shift ladder (Odd One Out, Musical Memory) | `shiftLadder` / `earlyCount` / `3 - shift` / `ladderFor` / `startLengthFor` across `src/game/*.ts` |
| Per-game audio identity | fixed C5/E5/G5 and G4→C4 | 22 identities, each with a pitch offset, a waveform, a tempo and its own correct/incorrect/win contours; four contour sets; win budget 0.3–0.8 s | `src/game/audioIdentity.ts` (`AUDIO_IDENTITIES`, `MAX_PITCH_OFFSET_SEMITONES = 5`, `MIN_TEMPO = 0.75`, `MAX_TEMPO = 1.5`, `WIN_MIN_END_SECONDS = 0.3`, `WIN_MAX_END_SECONDS = 0.8`); `src/audio/AudioManager.ts` → `resolveTrioIdentity()` |
| `shuffle` copies | not stated | 5 byte-identical copies; an injectable RNG in 2 of the 21 per-game logic modules | `export function shuffle` in `src/game/*.ts`; `shuffleWith` in `feelingsFacesLogic.ts` and `storyOrderLogic.ts` |
| Storage schema | not stated | no `schemaVersion`; the legacy `AppStorage` type is still exported | `src/utils/storage.ts`, `src/types/index.ts` (a `schemaVersion` grep over `src/` returns nothing) |
| Install prompt | not stated | the tracker is rebuilt on every Settings-panel open, so an earlier `beforeinstallprompt` is lost | `src/components/SettingsPanel.ts` → `createInstallTracker`; `src/utils/pwaInstall.ts` |
| Chunk-load failure | not stated | no error path: `ensureSceneLoaded` does not catch a rejected import and `HubScene.launchGame` has no `.catch` | `src/scenes/sceneRegistry.ts`, `src/scenes/HubScene.ts` |
| Play-time banking | not stated | banked only on Hub re-entry; a session under 30 s banks zero minutes | `src/game/playTimeLogic.ts` → `endPlaySession`, called from `HubScene.create()` |
| Device testing | not stated | the per-device rows are unchecked and the last four release records close with device execution pending | `docs/device-testing-checklist.md` (v1.14.1, v1.16.0, v1.18.0, v1.20.0 records) |
| Contact-sheet PNGs | ~99 | **120 tracked** | `git ls-files docs/svg-contact-sheets` (12 PNGs in each of 10 subfolders) |
| `.opencode/` | not stated | 2 tracked agent files, no ignore rule | `git ls-files .opencode` |
| `test-out.txt` | not stated | present at the repository root, untracked (gitignored) | `glob test-out.txt`; `git ls-files test-out.txt` (empty) |

### 4.5 Test-suite figures

| Figure | Was | Now | Derived from |
| --- | --- | --- | --- |
| Test files / tests | 110 / 2,305 (2026-10-20) | **118 / 2,488** (2026-10-22) | `pnpm test -- --run --maxWorkers=2` → "Test Files 118 passed (118) / Tests 2488 passed (2488)" |
| Coverage | lines 98.59 / functions 96.34 / branches ~90 / statements 97.8 (2026-10-20) | **statements 97.92 / branches 91.62 / functions 96.58 / lines 98.69** (2026-10-22) | `pnpm test:coverage -- --maxWorkers=2` → the coverage summary block |

### 4.6 Figures where this phase departs from the brief's hypothesis

The brief's "Current values" table was a hypothesis to re-derive, not a source of
truth. These are the places where the verified value differs from it. **The
verified value is the one in the documents.**

| Figure | Brief's hypothesis | Verified value | Where it shows |
| --- | --- | --- | --- |
| Files under `src/components/` | 18 | **16** (10 top-level + 6 under `settings/`) | TDD §2.2 — `glob src/components/**/*.ts` |
| Tracked contact-sheet PNGs | ~99 | **120** (12 PNGs in each of 10 subfolders) | `docs/roadmap.md` Known Issues — `git ls-files docs/svg-contact-sheets` |
| Logic modules without an RNG seam | "an RNG injectable in only two of the twenty-one logic modules" | the brief's count of 21 is the **per-game** logic modules; `src/game/` holds **26** `*Logic.ts` files (21 per-game + `adaptiveLogic`, `playTimeLogic`, `profileLogic`, `progressLogic`, `voiceLogic`). The roadmap therefore says "19 of the 21 per-game logic modules" | `docs/roadmap.md` Known Issues and Future Work item 8 — `glob src/game/*Logic.ts` (26 files) |
| Real-device deferral | "deferred since v1.0" | the deferral statements in `docs/device-testing-checklist.md` are the v1.14.1, v1.16.0, v1.18.0 and v1.20.0 records; the roadmap names those four rather than a start version | `docs/roadmap.md` Known Issues item 1 — `grep -n "defer" docs/device-testing-checklist.md` |
| Cold-boot and first-tap figures | not restated in the brief | kept as-is but explicitly dated 2026-10-20 and marked as evidence rather than a gate; a fresh measurement is Phase 3's job | TDD §3.5 |

Everything else in the brief's table matched the code exactly: 53 shell keys,
12 lazy groups / 131 keys / 125 game-only, 202 SVG files, 208 texture keys in
the app, 134.6 kB shell entry, 1342.6 kB Phaser chunk, 42 JavaScript chunks,
54 precache entries, 16 PWA checks, 118 test files / 2,488 tests, coverage
97.92 / 91.62 / 96.58 / 98.69, 5 scripts, 33 top-level `src/game/*.ts` plus
`art/` (16) and `hub/` (6), 8 / 12 / 2 scene inheritance, 15 of 22 adaptive
participation, 22 audio identities, the 0.3–0.8 s win budget, three hand-rolled
drag games, five `shuffle` copies and the two RNG-injectable modules.

---

## 5. Evidence paths

| What | Where |
| --- | --- |
| This report | `conductor/tracks/20261022-docs-roadmap-truth/verification/phase-1.md` |
| The new document | `docs/roadmap.md` |
| The corrected documents | `docs/PRD.md`, `docs/TDD.md` |
| Phase commits | `1d7d8f7` and `7f1b127` on `chore/20261022-docs-roadmap-truth` |
| This report | committed separately, after the documents, in its own `docs(conductor):` commit |
| Build output | `dist/` (gitignored), reproduced by `pnpm build` |

No binary or screenshot artefacts were produced by this phase; the figures it
records are text and numbers derived from the tree and the build output.

---

## 6. Deviations

1. **Test commands run with `--maxWorkers=2`.** The phase command is
   `pnpm test -- --run && pnpm test:coverage`; this machine's loaded runs
   intermittently time out in untouched files, so the brief's sanctioned form
   was used: `pnpm test -- --run --maxWorkers=2` and
   `pnpm test:coverage -- --maxWorkers=2`. Both exited 0. **No test was
   edited** to make either pass.
2. **Two load-induced timeouts were observed in untouched test files, each in a
   different file, and neither is reproducible in a clean run.** The first
   `pnpm test -- --run --maxWorkers=2` hit
   `src/__tests__/game/wordLogic.test.ts > generateLetterTiles > contains every
   unique letter of the word` (5,000 ms timeout) while a concurrent coverage run
   was loading the machine; the re-run reported in the commands table passed all
   2,488 tests. A later coverage run was killed mid-flight when the phase
   session ended, which surfaced as
   `src/__tests__/scenes/hubEngagement.test.ts > keeps tile taps navigating to
   games after press feedback is attached` (5,154 ms timeout) plus an
   `ENOENT … coverage/.tmp/coverage-1.json` from the interrupted coverage
   writer. The clean re-run reported in the commands table passed. **No test
   file was modified** in either case, per the brief's instruction not to edit a
   test to work around a timeout.
3. **The PRD's game-6 heading changed from "Big vs. Small" to "Big & Small"**,
   which changes the anchor from `#36-big-vs-small` to `#36-big--small`. The
   README's link to that anchor is not in this phase's `Touches`; **Phase 2 must
   update it**, or the Phase 4 validator will report a dead anchor.
4. **The TDD gained a new §8.7** ("The per-game audio identity") instead of
   renumbering §8.3–§8.6. The existing cross-document links into §8 were
   checked first and none of them targets a renumbered section, so appending
   keeps every current link valid. The TDD's own contents list gained the 8.7
   entry.
5. **A figure with no derivable source was removed rather than restated**
   (NFR-4): the PRD's "42,643,456 B, about 40.7 MiB" boot raster cost. The
   tiers are no longer uniform, so the arithmetic no longer describes the app.
   The TDD's historical "~186.6 MB … 178 MiB" sentence was kept but explicitly
   dated as the boot set *of the time*.
6. **The brief's "18 components" hypothesis was not used.** The verified count
   of files under `src/components/` is 16, and the TDD now says 16.
7. **The brief's "~99 tracked PNGs" hypothesis was not used.** The verified count
   is 120, and the roadmap says 120. The brief's "twenty-one logic modules" is
   the count of *per-game* logic modules; `src/game/` holds 26 `*Logic.ts`
   files in total, so the roadmap names the 19 of 21 per-game modules that have
   no RNG seam.

---

## 7. Notes for the primary

- **Phase 2 has a hard dependency on the anchor rename.** `README.md` links to
  `docs/PRD.md#36-big-vs-small`; the PRD now exposes `#36-big--small`. Fix the
  README link in Phase 2 or the Phase 4 validator will fail on a dead anchor.
- **The README and `docs/perf-baseline.md` still carry the old figures** —
  `195.4 KiB`, `129.1 KiB`, 41 chunks, 53 precache entries, `178`, `Big vs.
  Small`. They are Phase 2/3 files and were deliberately left alone. The
  roadmap is the only place in `docs/` that lists a standing debt, so no second
  copy of Known Issues or the roadmap exists anywhere.
- **A stale comment in the source is now visible from the docs.**
  `src/game/wordLogic.ts` still says "Prompt textures are PreloadScene texture
  keys", but the prompt pictures are lazy art-group keys (`sm_sun`, `animal_cat`,
  `frog_red`, …). Fixing it is a `src/` change and out of this phase's scope;
  it is a one-line comment fix whenever `src/` is next touched.
- **The Phase 4 validator will find a `conductor/tracks/` path only if one is
  added.** The roadmap deliberately names proposed tracks as plain italic
  slugs (`*drag-board-consolidation*`) rather than as `conductor/tracks/…`
  paths, so it cannot reference a directory that does not exist yet.
- **Re-measured cold boot is still outstanding.** `docs/perf-baseline.md`'s
  419.5 ms median dates from 2026-10-20, before PRs #52–#54. Phase 3 owns the
  fresh measurement; this phase only dated the existing figure.

---

## 8. Primary verification

Run by the primary agent after the phase subagent reported. The subagent's
report was not taken on trust; every number below was re-derived.

| Check | Result |
| --- | --- |
| Working tree after the phase | `git status --porcelain` empty. |
| Commits in `a9fec06..HEAD` | `1d7d8f7`, `7f1b127`, `604b5b0`, `3bb88a0`, `4945e99` — all five reported by the subagent, no merge commit, no foreign commit. |
| Files changed vs `Touches` | `docs/PRD.md`, `docs/TDD.md`, `docs/roadmap.md` and this evidence file. All inside `Touches` (`docs/roadmap.md`, `docs/PRD.md`, `docs/TDD.md`) plus the evidence file the brief requires. |
| The diff cannot change behaviour | `git diff ab00187 HEAD --stat -- src/ scripts/ package.json` is **empty** — the `src/`, `scripts/` and `package.json` trees are byte-identical to the base. Only markdown changed, so no test outcome can be affected by this phase. |
| `pnpm check` | exit 0 — 247 files, 1 pre-existing warning (`src/__tests__/scenes/musicalMemoryScene.test.ts:294` `noNonNullAssertion`) and 1 pre-existing `$schema` info. Neither is in a changed file. |
| `pnpm typecheck` | exit 0 — `tsc --noEmit` clean. |
| `pnpm test -- --run --maxWorkers=1` | **exit 0 — 118 test files, 2488 tests, all passed** (367.79 s). |
| `pnpm test:coverage -- --maxWorkers=1` | exit 0 — 118 files / 2488 tests; statements 97.92 % (5192/5302), branches 91.62 % (1269/1385), functions 96.58 % (1103/1142), lines 98.69 % (4887/4887 coverage rows). All four gates (90 / 85 / 88 / 95) hold. |
| `pnpm build` | exit 0. |
| `node scripts/validate-bundle.js` | exit 0 — Phaser vendor chunk `phaser-P1E8uaLi.js` 1342.6 kB; shell entry `index-BrQ7goBH.js` = 134.6 kB (limit 200 kB). |
| `node scripts/validate-pwa.js` | exit 0 — 16 passed, 0 failed. |

### On the test timeouts

The primary's first `--maxWorkers=2` run failed one test:
`src/__tests__/scenes/hubEngagement.test.ts > keeps tile taps navigating to
games after press feedback is attached` — a 5,000 ms wall-clock timeout, no
assertion failure. It is not a regression:

- The phase's diff is markdown-only, and `src/`, `scripts/` and `package.json`
  are byte-identical to the base commit `ab00187`, so the failure cannot have
  been introduced here.
- The file in isolation with a 30 s timeout passes 66/66 — the test is slow
  (the file takes ~36 s for 66 tests), not broken.
- The whole suite with `--maxWorkers=1` passes 118/118 files and 2488/2488
  tests.

This is the machine's known load flake, in the same file the subagent saw
time out. The primary ran the suite serially to remove the contention rather
than raising a timeout, and no test file was modified. The stabilized form
recorded for this track is `--maxWorkers=1`.

### Acceptance criteria, checked by the primary

- **AC-1** — verified by reading the document: PRD §7.1/§7.2/§7.3 now describe
  the 53-key shell, the 12 lazy groups, the 202-SVG corpus and the measured
  build; a `grep "178"` over `docs/PRD.md` returns no boot-set claim; the
  §3.x art lines name the group that carries the art.
- **AC-2** — verified: TDD §2.1 lists five scripts, §2.2 lists `components/`
  16, `game/` 55 (33 + `art/` 16 + `hub/` 6) including `audioIdentity.ts` and
  `dragBoard.ts`, and §10.2 states "118 test files, 2,488 tests (verified
  2026-10-22)".
- **AC-3** — verified: PRD §6.1 is a per-game trio, TDD §8.2 points at the
  identity, and the new **§8.7** documents the model, the 22-row table and the
  helpers; §4.2 lists `init()`, `preloadArt()`/`createArtCue()` and
  `reactWrong()`, and §4.5 shows Story Order on the shared `DragBoard`.
- **AC-5** — **partial, and correctly so**: `docs/roadmap.md` exists with
  exactly two sections ("Known Issues" at :11, "Future Work / Roadmap" at
  :98), and the PRD and the TDD link it. The README and `docs/perf-baseline.md`
  links are Phase 2 and Phase 3 work and were deliberately not written, since
  those files are outside this phase's `Touches`.

### Notes

- The subagent **re-derived every figure instead of copying the brief's
  hypothesis table**, and corrected four of the brief's guesses: 16 components
  (not 18), 120 tracked contact-sheet PNGs (not ~99), 26 `*Logic.ts` files of
  which 21 are per-game (not 21), and the real-device deferral named by
  release record rather than by a start version. The documents carry the
  verified values. This is the behaviour the brief asked for.
- One consequence for **Phase 2**, which must not be missed: the PRD heading
  changed to "Big & Small", so the anchor moved from `#36-big-vs-small` to
  `#36-big--small`, and `README.md:98` still points at the old one. The
  Phase 4 validator will report a dead anchor until the README is fixed.
- `src/game/wordLogic.ts` still says "Prompt textures are PreloadScene texture
  keys" although they are lazy art-group keys. A one-line source comment, and
  `src/` is out of this track's scope (NFR-1). Raised for the review.

**Primary result:** verified.
