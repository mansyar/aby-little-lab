# Phase 5 — Code Comments, Dead JSDoc, Vite Warning

- **Track:** `20261020-docs-truth-pass` — Docs & Dead-Code Truth Pass
- **Phase:** 5 of 6 — Code Comments, Dead JSDoc, Vite Warning
- **Date:** 2026-10-20
- **Branch:** `chore/20261020-docs-truth-pass`
- **Base:** `ed6776067f9d0627206c1c941d8c27fa91641ae2`
- **Head at verification:** `f5739d1` (`chore(build): import package.json with a JSON import attribute`), on top of the base
- **Covers:** FR-6, FR-7, FR-8, FR-10, AC-6, AC-7, AC-8, AC-10

## 2. Result

**verified.**

Both known-false comments say what the code does, the six orphan JSDoc blocks are gone
with no live method losing documentation, `vite.config.ts` imports `package.json` with
`with { type: "json" }` and the JSON-import warning is absent from test, coverage and
build output, and 14 of the 15 tracked `.gitkeep` markers are removed while
`src/assets/audio/.gitkeep` is kept because that directory holds nothing else. The full
quality gate is green and no statement changed.

## 3. Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| check | `pnpm check` | 0 | 230 files checked; 1 warning (`musicalMemoryScene.test.ts:294` non-null assertion) and 1 info (biome schema 2.5.5 vs CLI 2.5.10), both pre-existing. No errors — in particular the `with { type: "json" }` line parses. |
| types | `pnpm typecheck` | 0 | `tsc --noEmit` clean. |
| tests | `pnpm test -- --run` | 0 | 110 files, 2,305 tests passed, 31.21 s. |
| coverage | `pnpm test:coverage` | 0 | 110 files / 2,305 tests passed; statements 97.8 %, branches 90.73 %, functions 96.34 %, lines 98.59 % — all above the `vite.config.ts` thresholds (95/85/88/90). |
| build | `pnpm build` | 0 | 316 modules; `dist/` built in 715 ms; PWA precache 53 entries / 1,702.03 KiB — the same asset set as the pre-change build. |
| bundle | `node scripts/validate-bundle.js` | 0 | Phaser vendor chunk present (1,342.6 kB); shell entry 129.1 kB ≤ 200 kB. |
| pwa | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed; 41 chunks, 41 precached. |

Run as the single chained command from the phase contract:

```
pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js
```

→ overall exit **0**. Retries needed: none.

The test and build outputs were also captured separately and searched for the warning
text — see §7.

## 4. Changes

| File | Line | Before | After | Justification source |
| --- | --- | --- | --- | --- |
| `src/main.ts` | 30-31 | `// Shell scenes only — the 7 game scenes are lazy-loaded and registered` / `// at runtime via ensureSceneLoaded() when a Hub tile is tapped.` | `// Shell scenes only — all 22 game scenes are lazy-loaded and registered` / `// at runtime via ensureSceneLoaded() when a Hub tile is tapped.` | `src/scenes/sceneRegistry.ts:11-34` defines 22 entries in `sceneLoaders`, and `ensureSceneLoaded` (line 42) is what registers them; `src/scenes/HubScene.ts:47` and `src/game/hubTiles.ts` agree the hub holds 22 tiles. `git diff` shows only the two comment lines moved. |
| `src/scenes/HubScene.ts` | 47 | `* Displays a grid of 12 game tiles, a sticker book showing earned stickers,` | `* Displays a grid of 22 game tiles, a sticker book showing earned stickers,` | `src/game/hubGrid.ts:12` ("22 tiles render as 6x4") and `src/game/hubPaging.ts:24` (`HUB_TILE_COUNT = 22`); `src/__tests__/game/hubTiles.test.ts:7` asserts `GAME_TILES` has 22 entries. |
| `src/components/SettingsPanel.ts` | 302-313 (deleted) | Six JSDoc blocks with no declaration under them: iOS "Add to Home Screen" overlay, its destroy, the "Reset Progress" row, the two-step reset modal, its close, and the inline confirmation. | Removed; the class now ends after `openProfilesOverlay()`. | Every behaviour is documented where it now lives: `src/components/settings/InstallRow.ts:79` ("Shows the iOS 'Add to Home Screen' instructions overlay."), `src/components/settings/ResetModal.ts:41` ("Adds the parental 'Reset Progress' row that clears all stickers.") and `ResetModal.ts:54` ("Shows the two-step 'Reset all stickers?' confirmation modal."). The final `}` was the last line of the file, so no declaration sat inside the deleted range. |
| `vite.config.ts` | 4 | `import pkg from "./package.json";` | `import pkg from "./package.json" with { type: "json" };` | The Vite warning named this exact line and prescribes the attribute; §7 proves it is gone. `__APP_VERSION__` still reads `pkg.version` from the same import — the sourcing did not change. |
| 14 `.gitkeep` paths | — | Tracked placeholder markers in populated directories. | Deleted (see §6). | `git ls-files` shows at least one real tracked file in each; only `src/assets/audio/` holds nothing else and keeps its marker. |

No statement, identifier, import or formatting change beyond the single `vite.config.ts`
config line and the deletions. `git diff -U0` over the four source files contains, besides
the deleted comment block, exactly two changed comment lines and one changed import line.

## 5. The comment sweep

Patterns were searched over `src` (all files, then `*.ts` for the numeric pass). The
sweep ran after the two fixes to show the enumerated phrases are gone, and each hit that
survived was read before being left alone.

| Pattern | Hits before | Hits after | Disposition |
| --- | --- | --- | --- |
| `7 game` | 2 — `src/main.ts:30`, `src/__tests__/scenes/navigation.test.ts:305` | 1 | `main.ts` corrected. The test title is a test — out of scope per the brief ("do not touch tests"); it asserts `interactiveObjects.length >= 7`, not a tile count, so it is a loose title rather than a current-state claim. Left, recorded here. |
| `7 game scenes` | 1 — `src/main.ts:30` | 0 | Corrected (P5.T1). |
| `seven game` | 0 | 0 | Nothing to do. |
| `20-tile` | 0 | 0 | Nothing to do. |
| `12 game` | 1 — `src/scenes/HubScene.ts:47` | 0 | Corrected to 22 (P5.T2). |
| `170 preloaded` | 0 | 0 | Nothing to do. |
| `Ligne` (case-sensitive) | 0 in `src` | 0 | Nothing to do. The case-insensitive search returns only "aligned"/"misaligned" substrings in `NumberOrderScene.ts:105` and `__tests__/helpers/sceneFlowHarness.ts:413`, neither a product reference. `README.md:187` mentions Ligne inside the dated `v1.16.0` release note — frozen history, not edited. |
| `\b(15\|20\|21\|22\|170\|176\|178\|195)\b` in `src/**/*.ts` | 200+ (truncated) | unchanged | Every comment hit read; table below. |

Numeric hits that are comment text, and why each was left alone:

| Location | Claim | Disposition |
| --- | --- | --- |
| `src/game/hubGrid.ts:13` | "the same 119px top/bottom margins as the 15-tile grid" | **Left.** The 119 px is true today: 4 rows × 116 px + 3 × 22 px spacing = 530 px, leaving (768 − 530) / 2 = 119 px. "The 15-tile grid" names the previous layout as the comparison point — a dated reference, not a claim that the hub holds 15 tiles. |
| `src/game/hubGrid.ts:52-53` | "a 56px plaque (sized for the old 160x116 tile…)" | **Left.** Explicitly historical ("the old 160x116 tile"); today's `TILE_WIDTH = 144` is stated two lines above it. |
| `src/game/hubGrid.ts:12`, `135`, `253` | "22 tiles render as 6x4 (rows 6/6/6/4)" | **Left.** True: `GRID_COLS = 6`, `GRID_ROWS = 4`, `HUB_TILE_COUNT = 22`. |
| `src/game/hubPaging.ts:13,16,24,80` | "22 games as 10 + 10 + 2", "the first two pages of a 22-game hub", `HUB_TILE_COUNT = 22` | **Left.** True, and `src/__tests__/game/hubPaging.test.ts:104` asserts the 10 + 10 + 2 split. |
| `src/game/decodeLogic.ts:6,61` | "The 22 decode words: shared 18 plus 4 new CVC words" | **Left.** True: `src/__tests__/game/decodeLogic.test.ts:56-57` asserts exactly 22 (18 + 4). |
| `src/components/settings/ProgressOverlay.ts:55` | "The 22 games in hub order" | **Left.** True — one report row per `GAME_TILES` entry. |
| `src/scenes/PreloadScene.ts:66-67` | "the 22 Hub tile icons, the 22 earned stickers, the two mascot poses, the speaker glyph, and the six avatar keys" | **Left.** True and exactly additive: the `SHELL_ASSETS` array holds 53 entries = 22 `tile_*` + 22 `sticker_*` + `mascot_idle` + `mascot_celebrate` + `icon_speaker` + 6 avatars. Matches the 53-key shell set Phase 1 verified. |
| `src/components/ArtLoadingCue.ts:31` | "`ProfileChip`'s picker and `PlayTimeIndicator`'s nudge — sit at 20–21" | **Left.** True: `PICKER_DEPTH = 20` with children at `PICKER_DEPTH + 1` (`ProfileChip.ts:20,109,120`), `NUDGE_DEPTH = 20` with `NUDGE_DEPTH + 1` (`PlayTimeIndicator.ts:13,82,86`). |
| `src/utils/textureTiers.ts:6` | "~184 MB … (176 × 512² × 4 B RGBA)" | **Left.** Introduced by "were historically rasterized"; it is the arithmetic of the old uniform-512 cost (176 × 512² × 4 B = 184.5 MB), not a claim about today's key count. Rewriting 176 would falsify the arithmetic. |
| `src/scenes/sceneRegistry.ts:4` | "the 22 game scenes" | **Left.** True (22 loader entries). |
| `src/game/feelingsFacesLogic.ts:2`, `storyOrderLogic.ts:2`, `storyOrderArt.ts:2`, `StoryOrderScene.ts:47` | "Game 21" / "Game 22" | **Left.** True roster positions, matching `hubTiles.ts` order. |

Every remaining numeric hit is a real constant (`TILE_SPACING = 22`, `ANSWER_CARD_SIZE = 170`,
`PAGED_TILE_WIDTH = 176`, glyph coordinates, timeouts) or a test fixture number, and was
not treated as a claim about the suite.

## 6. `.gitkeep`

Counts are tracked non-`.gitkeep` files in that directory at base `ed67760`.

| Path | Tracked files in the directory | Disposition |
| --- | --- | --- |
| `conductor/tracks/.gitkeep` | 12 (two track folders: 4 docs each, 4 verification files) | removed |
| `public/icons/.gitkeep` | 3 (`icon-192.png`, `icon-512.png`, `icon-maskable-512.png`) | removed |
| `src/__tests__/components/.gitkeep` | 16 (10 component tests + 6 under `settings/`) | removed |
| `src/__tests__/scenes/.gitkeep` | 41 scene and flow tests | removed |
| `src/assets/svg/animals/.gitkeep` | 9 animal SVGs | removed |
| `src/assets/svg/items/.gitkeep` | 23 item SVGs | removed |
| `src/assets/svg/shapes/.gitkeep` | 36 shape and cutout SVGs | removed |
| `src/assets/svg/stickers/.gitkeep` | 22 game sticker SVGs | removed |
| `src/assets/svg/ui/.gitkeep` | 12 UI SVGs (plus 22 under `tiles/`) | removed |
| `src/audio/.gitkeep` | 1 (`AudioManager.ts`) | removed |
| `src/components/.gitkeep` | 10 components (plus 6 under `settings/`) | removed |
| `src/scenes/.gitkeep` | 29 scene sources plus `sceneRegistry.ts` | removed |
| `src/types/.gitkeep` | 1 (`index.ts`) | removed |
| `src/utils/.gitkeep` | 14 utility modules | removed |
| `src/assets/audio/.gitkeep` | **0 — the directory holds only the marker** | **kept** |

14 removed, 1 kept. `git status --porcelain` after the removals listed only the 14
`D` entries plus the four edited files — no unexpected path. The build confirms the asset
set is unchanged: PWA precache is still 53 entries / 1,702.03 KiB over 41 chunks, the same
figures as the phase's first run, and both validators pass. Vite never treated `.gitkeep`
as an asset, and nothing references it.

## 7. The Vite warning proof

Pre-fix, Vite reported on `vite.config.ts:4:17`:

> Your Vite config uses features that are unsupported by `configLoader: 'native'` … JSON import "./package.json" without import attributes … Add `with { type: 'json' }`

Post-fix, the test and build outputs were captured to files and searched for the warning
text (`import attributes`, `configLoader`, `Vite config uses features`):

| Command | Output file | Matches for the warning |
| --- | --- | --- |
| `pnpm test -- --run` | `.conductor/evidence/phase-5-test.log` | **0** — the log begins at `$ vitest "--run"` and goes straight to the run banner. |
| `pnpm build` | `.conductor/evidence/phase-5-build.log` | **0** — `vite v8.2.2 building client environment…` with no config-load warning. |

`pnpm typecheck` does not load the Vite config at all (`tsconfig.json` includes `src`
only), and it is green. `pnpm check` parses the new line without error. The absent line is
the `configLoader: 'native'` warning itself; it no longer appears in any of the four
outputs.

## 8. Acceptance

| ID | Criterion | Status | Evidence |
| --- | --- | --- | --- |
| AC-6 | `rg "7 game scenes"` over `src` and `README.md` returns nothing, and the audit phrase list returns zero hits. | **met** | `7 game scenes` → 0 in `src`; `README.md` has no hit for any of the seven audit phrases (its only `Ligne` mention is the dated `v1.16.0` release note). The surviving `7 game` hit is a test title in `src/__tests__/scenes/navigation.test.ts:305`, outside the editable surface and not a suite count (§5). |
| AC-7 | The six orphan JSDoc phrases are absent from `SettingsPanel.ts`, and check plus typecheck are green. | **met** | All six blocks deleted (§4); the phrases now exist only in `InstallRow.ts` and `ResetModal.ts`, above the methods that implement them. `pnpm check` 0, `pnpm typecheck` 0. |
| AC-8 | Check, typecheck, test and build output contains no JSON-import warning. | **met** | §7: 0 matches in the captured test and build logs; check and typecheck emit no such line in the chained run. |
| AC-10 | No `.gitkeep` remains in a directory that holds tracked files. | **met** | §6: 14 removed where tracked files exist; the single survivor is `src/assets/audio/`, which holds nothing else. |

## 9. Deviations & notes

- **Commit grouping.** `git rm` had staged the 14 `.gitkeep` deletions before the first
  source commit, so `5426143` (`chore(src): correct the lazy-scene and hub-tile counts in
  comments`) also carries the 14 marker deletions (16 files changed). The message names
  only the comment fixes. Amending is forbidden for this executor, so the `.gitkeep` work
  is recorded here instead of in its own `chore(repo): …` commit. The remaining commits
  are `7a2a86f` (`chore(src): delete the orphan JSDoc block in SettingsPanel`) and
  `f5739d1` (`chore(build): import package.json with a JSON import attribute`).
- **No `chore(repo):` commit exists** for the reason above; FR-10's change is complete and
  verified, only its commit boundary differs from the plan's intent.
- **`src/scenes/HubScene.ts` was touched** although the brief names only `main.ts` among
  scene files. It is a comment-only corrective inside the "comment-only sweep paths" the
  brief does allow, and `HubScene.ts:47` was one of the two false claims the sweep found.
  Recorded so the primary can confirm the widened path.
- The `navigation.test.ts` "creates 7 game tiles" title and the `hubGrid.ts` historical
  number references are knowingly left; each is justified in §5. No product or design
  decision was needed.
- Files under `.conductor/evidence/` (`phase-5-test.log`, `phase-5-build.log`) are the raw
  captured outputs behind §7 and are not committed.
