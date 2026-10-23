# Technical Design Document (TDD)

**Project:** Aby's Little Lab
**Scope:** implementation reference for the shipped app — toolchain, files, classes, data flow, constants.
**Companion:** [`docs/PRD.md`](./PRD.md) owns product intent, audience, per-game rules and the reasons behind the behaviour. Where this document describes *what* a mechanism does, the PRD is the place to look for *why*.

## Contents

1. [Toolchain and commands](#1-toolchain-and-commands)
   - [1.1 Versions](#11-versions)
   - [1.2 Package scripts](#12-package-scripts)
   - [1.3 Biome](#13-biome)
   - [1.4 TypeScript and Vitest configuration](#14-typescript-and-vitest-configuration)
2. [Repository layout](#2-repository-layout)
   - [2.1 Root](#21-root)
   - [2.2 Source tree](#22-source-tree)
   - [2.3 Asset corpus](#23-asset-corpus)
3. [Boot and the asset budget](#3-boot-and-the-asset-budget)
   - [3.1 Phaser configuration](#31-phaser-configuration)
   - [3.2 BootScene](#32-bootscene)
   - [3.3 PreloadScene and the boot asset table](#33-preloadscene-and-the-boot-asset-table)
   - [3.4 Texture tiers](#34-texture-tiers)
   - [3.5 In-chunk art](#35-in-chunk-art)
   - [3.6 What the budget costs](#36-what-the-budget-costs)
4. [Scene architecture](#4-scene-architecture)
   - [4.1 Shell scenes and the lazy registry](#41-shell-scenes-and-the-lazy-registry)
   - [4.2 GameSceneBase](#42-gamescenebase)
   - [4.3 ChoiceRoundScene](#43-choiceroundscene)
   - [4.4 GroupMathScene](#44-groupmathscene)
   - [4.5 Which game extends what](#45-which-game-extends-what)
   - [4.6 Lifecycle and shutdown](#46-lifecycle-and-shutdown)
5. [Components](#5-components)
   - [5.1 RoundNarrator](#51-roundnarrator)
   - [5.2 Mascot](#52-mascot)
   - [5.3 ParentLock](#53-parentlock)
   - [5.4 SpeakerButton](#54-speakerbutton)
   - [5.5 SettingsPanel and the settings group](#55-settingspanel-and-the-settings-group)
   - [5.6 ProfileChip and PlayTimeIndicator](#56-profilechip-and-playtimeindicator)
   - [5.7 PwaToast and PwaToasts](#57-pwatoast-and-pwatoasts)
   - [5.8 Typography and fonts](#58-typography-and-fonts)
6. [State and storage](#6-state-and-storage)
   - [6.1 Keys and cache](#61-keys-and-cache)
   - [6.2 Schema v2](#62-schema-v2)
   - [6.3 Facade functions](#63-facade-functions)
   - [6.4 Migration and normalisation](#64-migration-and-normalisation)
   - [6.5 The write path and its limitation](#65-the-write-path-and-its-limitation)
7. [Game logic modules](#7-game-logic-modules)
   - [7.1 The module list](#71-the-module-list)
   - [7.2 The round contract](#72-the-round-contract)
   - [7.3 Adaptive banding](#73-adaptive-banding)
   - [7.4 Randomness](#74-randomness)
8. [Audio](#8-audio)
   - [8.1 AudioManager lifecycle](#81-audiomanager-lifecycle)
   - [8.2 Sound effects](#82-sound-effects)
   - [8.3 Background music, ducking and the watchdog](#83-background-music-ducking-and-the-watchdog)
   - [8.4 Visibility policy](#84-visibility-policy)
   - [8.5 Speech](#85-speech)
   - [8.6 Toggles and persistence](#86-toggles-and-persistence)
   - [8.7 The per-game audio identity](#87-the-per-game-audio-identity)
9. [Motion and feedback](#9-motion-and-feedback)
   - [9.1 Reduced-motion helpers](#91-reduced-motion-helpers)
   - [9.2 Scene transitions](#92-scene-transitions)
   - [9.3 Press, drag and completion feedback](#93-press-drag-and-completion-feedback)
   - [9.4 Tween values](#94-tween-values)
10. [Testing](#10-testing)
    - [10.1 Runner and mocks](#101-runner-and-mocks)
    - [10.2 Suite shape](#102-suite-shape)
    - [10.3 Coverage gates](#103-coverage-gates)
    - [10.4 What unit tests cannot cover](#104-what-unit-tests-cannot-cover)
11. [Build, PWA and CI](#11-build-pwa-and-ci)
    - [11.1 Vite build](#111-vite-build)
    - [11.2 PWA configuration](#112-pwa-configuration)
    - [11.3 Validator scripts](#113-validator-scripts)
    - [11.4 GitHub Actions](#114-github-actions)
    - [11.5 Container and host](#115-container-and-host)
12. [See also](#12-see-also)

---

## 1. Toolchain and commands

### 1.1 Versions

| Tool | Version | Where pinned |
| --- | --- | --- |
| Node.js | 22 | `Dockerfile`, `.github/workflows/ci.yml` |
| pnpm | 11.7.0 | `corepack prepare pnpm@11.7.0` in `Dockerfile`; `pnpm/action-setup@v6` in CI |
| TypeScript | `^7.0.2` | `package.json` |
| Phaser | `^4.2.1` | `package.json` (only runtime dependency) |
| Vite | `^8.1.5` | `package.json` |
| vite-plugin-pwa | `^1.3.0` | `package.json` |
| Vitest + `@vitest/coverage-v8` | `^4.1.10` | `package.json` |
| happy-dom | `^18.0.1` | `package.json` |
| Biome | `^2.5.5` | `package.json` |
| `playwright-core` | `^1.64.1` | `package.json` — used by `scripts/validate-boot.js` only |
| `serve` | `^14.2.6` | `package.json` |
| `workbox-window` | `^7.4.1` | `package.json` — `registerType: "prompt"` plumbing |

`phaser` is the only entry under `dependencies`; everything else is a dev dependency.

### 1.2 Package scripts

| Script | Command | Used by |
| --- | --- | --- |
| `dev` | `vite` | local development |
| `build` | `vite build` | CI, Docker |
| `preview` | `vite preview` | `validate-boot.js` target |
| `test` | `vitest` | local watch |
| `test:coverage` | `vitest run --coverage` | local gate |
| `typecheck` | `tsc --noEmit` | CI |
| `check` | `biome check` | CI |
| `lint` | `biome lint` | local |
| `format` | `biome format --write` | local |

### 1.3 Biome

`biome.json` scopes the tool to `src/**/*.ts`, `scripts/**/*.js` and `vite.config.ts`. Formatter: 2-space indent, line width 100, double quotes, semicolons always, trailing commas in all positions. Linter runs the `recommended` preset with `source.organizeImports` on.

The `$schema` field is pinned to 2.5.5 while `package.json` allows any 2.5.x, so an install that resolves 2.5.10 reports a schema-version info message on every run and still exits 0. Existing warnings (one `noNonNullAssertion` in a scene test) are reported, not fatal.

### 1.4 TypeScript and Vitest configuration

`tsconfig.json` targets ES2023 with `module: ESNext`, `moduleResolution: bundler`, `strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `verbatimModuleSyntax`, `resolveJsonModule`, `skipLibCheck`, and `types: ["vitest/globals"]`. `include` is `src`, so `scripts/` is type-checked by Biome only.

Vitest is configured inside `vite.config.ts`: `environment: "happy-dom"`, `globals: true`, `include: ["src/__tests__/**/*.test.ts"]`. Coverage uses the v8 provider with `text` and `html` reporters over `src/**/*.ts`, excluding `src/__tests__/**`, `src/main.ts` and `src/types/**`; thresholds are lines 95, functions 88, branches 85, statements 90.

---

## 2. Repository layout

### 2.1 Root

```
/
├── index.html                    # #game-container, viewport meta, iOS meta, theme colour
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── tsconfig.json
├── vite.config.ts                # build, PWA, Vitest and coverage config in one file
├── biome.json
├── Dockerfile                    # node:22-alpine build → nginx:1.27-alpine runtime
├── .dockerignore
├── nginx.conf
├── public/
│   ├── audio/bgm.mp3
│   ├── fonts/baloo2-latin.woff2
│   └── icons/{icon-192.png, icon-512.png, icon-maskable-512.png}
├── scripts/
│   ├── validate-bundle.js
│   ├── validate-pwa.js
│   ├── validate-boot.js
│   ├── validate-docs.js
│   ├── render-svg-contact-sheets.mjs
│   └── measure-first-tap.mjs
├── .github/workflows/ci.yml
├── docs/
├── conductor/
└── src/
```

`public/` is copied verbatim into `dist/`; nothing there is imported by application code. The BGM file lives in `public/audio/`, not `src/assets/audio/` (that folder holds only a `.gitkeep`).

### 2.2 Source tree

Every production file under `src/` is listed below. Test files live under `src/__tests__/` and are described in [§10](#10-testing) instead.

```
src/
├── main.ts                                # Phaser.Game config + PWA bridge
├── vite-env.d.ts
├── styles/
│   └── style.css                          # page background, font-face, #game-container
├── audio/
│   └── AudioManager.ts                    # singleton: SFX, BGM, ducking, visibility
├── types/
│   └── index.ts                           # GameId, Settings, ProfileV2, GameProgress, …
├── components/                            # 16 files
│   ├── ArtLoadingCue.ts
│   ├── Mascot.ts
│   ├── ParentLock.ts
│   ├── PlayTimeIndicator.ts
│   ├── ProfileChip.ts
│   ├── PwaToast.ts
│   ├── PwaToasts.ts
│   ├── RoundNarrator.ts
│   ├── SettingsPanel.ts
│   ├── SpeakerButton.ts
│   └── settings/
│       ├── InstallRow.ts
│       ├── ProfilesOverlay.ts
│       ├── ProgressOverlay.ts
│       ├── ResetModal.ts
│       ├── VoiceRow.ts
│       └── primitives.ts
├── game/                                  # 55 files: 33 modules, art/ (16), hub/ (6)
│   ├── adaptiveLogic.ts
│   ├── addItUpLogic.ts
│   ├── alphabetLogic.ts
│   ├── animalTraceLogic.ts
│   ├── audioIdentity.ts
│   ├── bigSmallLogic.ts
│   ├── colorMatchLogic.ts
│   ├── countLogic.ts
│   ├── decodeLogic.ts
│   ├── dragBoard.ts
│   ├── feelingsFacesLogic.ts
│   ├── firstSoundsLogic.ts
│   ├── gameRegistry.ts
│   ├── hubGrid.ts
│   ├── hubPaging.ts
│   ├── hubTiles.ts
│   ├── memoryMatchLogic.ts
│   ├── moreLessLogic.ts
│   ├── musicalMemoryLogic.ts
│   ├── numberOrderLogic.ts
│   ├── oddOneOutLogic.ts
│   ├── patternBuilderLogic.ts
│   ├── playTimeLogic.ts
│   ├── popFreezeLogic.ts
│   ├── profileLogic.ts
│   ├── progressLogic.ts
│   ├── shadowMatchLogic.ts
│   ├── shapeSorterLogic.ts
│   ├── storyOrderArt.ts
│   ├── storyOrderLogic.ts
│   ├── takeAwayLogic.ts
│   ├── voiceLogic.ts
│   ├── wordLogic.ts
│   ├── art/                               # 16 files — the lazy art groups
│   │   ├── animals.ts
│   │   ├── cutouts.ts
│   │   ├── faces.ts
│   │   ├── food.ts
│   │   ├── glyphs.ts
│   │   ├── index.ts
│   │   ├── items.ts
│   │   ├── letters.ts
│   │   ├── music.ts
│   │   ├── numerals.ts
│   │   ├── placeholder.ts
│   │   ├── registry.ts
│   │   ├── shadows.ts
│   │   ├── shapes.ts
│   │   ├── toys.ts
│   │   └── types.ts
│   └── hub/                               # 6 files — the decomposed Hub grid
│       ├── gridBuilder.ts
│       ├── gridLayout.ts
│       ├── hubGridConstants.ts
│       ├── pageBoard.ts
│       ├── stickerShelf.ts
│       └── timeUpDim.ts
├── scenes/                                # 29 files
│   ├── AddItUpScene.ts
│   ├── AlphabetScene.ts
│   ├── AnimalTraceScene.ts
│   ├── BigSmallScene.ts
│   ├── BootScene.ts
│   ├── ChoiceRoundScene.ts
│   ├── ColorMatchScene.ts
│   ├── DecodeItScene.ts
│   ├── FeelingsFacesScene.ts
│   ├── FirstSoundsScene.ts
│   ├── GameSceneBase.ts
│   ├── GroupMathScene.ts
│   ├── HowManyScene.ts
│   ├── HubScene.ts
│   ├── MemoryMatchScene.ts
│   ├── MoreLessScene.ts
│   ├── MusicalMemoryScene.ts
│   ├── NumberOrderScene.ts
│   ├── OddOneOutScene.ts
│   ├── PatternBuilderScene.ts
│   ├── PopFreezeScene.ts
│   ├── PreloadScene.ts
│   ├── ShadowMatchScene.ts
│   ├── ShapeSorterScene.ts
│   ├── StoryOrderScene.ts
│   ├── TakeAwayScene.ts
│   ├── WordBuilderScene.ts
│   ├── WordMatchScene.ts
│   └── sceneRegistry.ts
├── utils/                                 # 14 files
│   ├── completionEffect.ts
│   ├── dragJuice.ts
│   ├── fonts.ts
│   ├── motion.ts
│   ├── pressFeedback.ts
│   ├── pwaBridge.ts
│   ├── pwaInstall.ts
│   ├── sceneTransitions.ts
│   ├── speech.ts
│   ├── storage.ts
│   ├── svgDataUri.ts
│   ├── textureTiers.ts
│   ├── typography.ts
│   └── viewportZoom.ts
└── assets/
    ├── audio/                             # empty at runtime; BGM ships from public/
    └── svg/                               # 219 tracked illustrations, 11 folders
        ├── animals/                       # 9 files
        ├── feelings/                      # 4 files
        ├── items/                         # 27 files
        ├── letters/                       # 26 files
        ├── numbers/                       # 10 files
        ├── shadows/                       # 12 files
        ├── shapes/                        # 36 files
        ├── stickers/                      # 22 files
        ├── stories/                       # 33 files
        ├── toys/                          # 7 files
        └── ui/                            # 33 files, of which 21 in ui/tiles/
```

The `src/game/` logic modules are importable without Phaser, with one exception: `hub/gridBuilder.ts` imports it at runtime. `dragBoard.ts`, `hubGrid.ts`, `storyOrderArt.ts`, `art/registry.ts` and `art/placeholder.ts` import Phaser types only, so they cost nothing at runtime either.

`.gitkeep` placeholders are tracked in `src/assets/audio/`, `src/assets/svg/{animals,items,shapes,stickers,ui}/`, `src/audio/`, `src/components/`, `src/scenes/`, `src/types/` and `src/utils/`; they are not listed.

### 2.3 Asset corpus

219 `.svg` files, 512×512 `viewBox`, ASCII markup only (see [§3.3](#33-preloadscene-and-the-boot-asset-table)). Only the 53 shell keys' files are rasterized at boot; every other texture a game draws is reached through `src/game/art/` or that game's own art module (see [§3.5](#35-in-chunk-art)).

| Folder | Files | What it holds |
| --- | --- | --- |
| `animals/` | 9 | `cat`, `dog`, `elephant`, `monkey`, `pig`, `rabbit`, `frog_green`, `frog_blue`, `frog_red` |
| `feelings/` | 4 | `face_happy`, `face_sad`, `face_angry`, `face_scared` |
| `items/` | 27 | `airplane`, `apple`, `ball`, `banana`, `bed`, `bell`, `boat`, `bone`, `boot`, `bug`, `car`, `carrot`, `cup`, `duck`, `fish`, `fox`, `hat`, `house`, `kite`, `lilypad`, `map`, `mushroom`, `peanut`, `sock`, `sun`, `tree`, `umbrella` |
| `letters/` | 26 | `letter_a` … `letter_z` |
| `numbers/` | 10 | `numeral_0` … `numeral_9` |
| `shadows/` | 12 | `shadow_airplane`, `_ball`, `_bell`, `_boat`, `_boot`, `_car`, `_house`, `_kite`, `_mushroom`, `_sock`, `_tree`, `_umbrella` |
| `shapes/` | 36 | 18 `shape_*` outlines and their 18 `cutout_*` filled twins |
| `stickers/` | 22 | `sticker_<game>` in `snake_case`, one per game |
| `stories/` | 33 | 11 story strips of 3 panels (`story_*`) — loaded with the Story Order chunk only |
| `toys/` | 7 | `teddy_bear`, `toy_ball`, `toy_block`, `toy_box`, `toy_car`, `toy_drum`, `toy_rocket` |
| `ui/` | 33 | 12 shared UI glyphs (`arrow_up`, `arrow_down`, `bubble`, `card_back`, `equals`, `icon_speaker`, `mascot_idle`, `mascot_celebrate`, `minus`, `plus`, `sleep_zzz`, `tile_feelings_faces`) plus 21 `ui/tiles/tile_*` Hub tiles |
| **Total** | **219** | |

`shadows/` art is derived from the matching `items/` silhouette rather than drawn separately. Art rules — palette, stroke weights, the 512×512 grid, ASCII-only markup — live in [`docs/SVG_STYLE.md`](./SVG_STYLE.md).

---

## 3. Boot and the asset budget

### 3.1 Phaser configuration

`src/main.ts` holds the only `Phaser.GameConfig`:

```ts
type: Phaser.AUTO,
width: 1024, height: 768,
parent: "game-container",
dom: { createContainer: true },
transparent: true,
scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
physics: { default: "arcade", arcade: { gravity: { x: 0, y: 0 } } },
scene: [BootScene, PreloadScene, HubScene],
```

`transparent: true` lets the page background (`--bg-base` `#FAF9F6`) show through; an opaque canvas would paint black behind every scene. The scene array carries the three shell scenes only. `initPwaBridge(registerSW)` runs before `new Phaser.Game(config)` so the Hub can receive update/offline events from its first frame.

### 3.2 BootScene

`BootScene.create()` is `async` and runs four steps in order:

1. `AudioManager.getInstance().init()`.
2. `setPreferredVoiceURI(getSettings().preferredVoiceURI)` — the stored voice is applied before any scene speaks.
3. `screen.orientation.lock("landscape")`, guarded by `typeof orientation.lock === "function"` and a swallowed rejection. iOS WebKit exposes `screen.orientation` without `lock()`; calling it throws synchronously and would strand the app on a black screen.
4. `await ensureGlyphFontLoaded()` from `src/utils/fonts.ts`, then `this.scene.start("Preload")`.

The font gate exists because the letter and numeral SVGs set `font-family="'Baloo 2', Arial, …"` on a `<text>` element, and Phaser rasterises SVG text once at load time. Without the gate the glyphs silently fall back to Arial on first visit. `ensureGlyphFontLoaded()` never throws: it races `document.fonts.load` against a 2.5 s timeout and resolves either way.

### 3.3 PreloadScene and the boot asset table

`src/scenes/PreloadScene.ts` exports `SHELL_ASSETS`, an array of **53** `{ key, svg }` entries — the shell set: 22 tile icons, 22 stickers, the two mascot poses, `icon_speaker` and the six avatar keys (`animal_cat`, `animal_dog`, `animal_pig`, `frog_red`, `sm_duck`, `toy_teddy_bear`). The game half is not hand-listed: the scene builds it from `GAME_REGISTRY`, taking each game's `tileKey` and then each `stickerKey` in registry order, and resolves each key to SVG markup through three eager raw globs — `../assets/svg/ui/tile_*.svg`, `../assets/svg/ui/tiles/*.svg` and `../assets/svg/stickers/*.svg`, written `{ eager: true, query: "?raw" }`. The patterns are deliberately narrower than "everything under `ui/`": the `ui/` directory also holds the glyph SVGs that belong to the lazy `game/art/glyphs.ts` group, and globbing `ui/**` would inline them into the entry chunk for keys the table never reads. The `tile_`/`sticker_` stem filter stays as defence in depth. Two files sharing a key, two registry entries naming one key, or a registry key with no file, throws at module evaluation naming the key. Only the nine non-game rows stay literal, because they belong to the shell rather than to a game. The keys are the texture keys used everywhere else, e.g. `sticker_story_order`, `tile_story_order`, `mascot_idle`. Every other texture a game draws is loaded by that game ([§3.5](#35-in-chunk-art)), so this table is the whole boot payload: 219 texture keys in the app, 53 of them in the shell, over a corpus of 219 art files.

`preload()` draws a brand lockup (title at `centerY - 110`, tagline at `centerY - 70`, a 300×30 progress bar over a 320×50 box) and wires `load.on("progress")` and `load.on("complete")` to it. In development only, a `/* v8 ignore next */`-guarded block profiles per-file load time and logs `[preload] N files in Xms`; the block is statically removed from production builds.

Each entry is registered with:

```ts
this.load.svg(asset.key, toDataUri(asset.svg), { width: size, height: size });
```

where `size = textureSizeFor(asset.key)` ([§3.4](#34-texture-tiers)). `toDataUri()` in `src/utils/svgDataUri.ts` is one line — `data:image/svg+xml;base64,${btoa(svg)}` — because Phaser's XHR loader decodes `data:` URLs with `atob`, and `btoa` throws on anything outside Latin-1, which is why every asset's markup stays ASCII.

`create()` calls `transitionToScene(this, "Hub")`.

### 3.4 Texture tiers

Historically every SVG was rasterised at 512×512, which reserved ~186.6 MB of GPU texture memory (the 178-key boot set of the time x 512 x 512 x 4 B, i.e. 178 MiB) while most consumers display far smaller. The corpus has grown since to 219 art files and 219 texture keys. `src/utils/textureTiers.ts` sizes each texture for its largest display context, and the rule applies per key wherever that key lives - shell, lazy art group or Story Order panel:

| Tier | Size | Applied to |
| --- | --- | --- |
| `icon` | 160 | `tile_*`, `sm_shadow_*`, and the exact keys `minus`, `plus`, `equals`, `sleep_zzz`, `icon_speaker` |
| `card` | 256 | default — gameplay art, stickers, letters, numerals, story panels |
| `hero` | 512 | `mascot_*` (the `MASCOT_SCALE = 0.2` maths assumes a 512 px texture) |

`tierForKey()` walks an ordered rule list (first match wins) and `textureSizeFor()` resolves the size. `displayScale(key, displaySize)` returns `displaySize / textureSizeFor(key)` and replaces hard-coded `displaySize / 512` at call sites, so scales stay correct as tiers change.

The file's header comment groups letters and numerals under `icon`, but the rule table has no letter or numeral entry, so `letter_*` and `numeral_*` resolve to `card` (256 px). The rule table is what runs.

### 3.5 In-chunk art

Game art leaves the shell by two mechanisms, and both are ordinary static modules: Phaser's `preload` is synchronous, so art can never be dynamically imported into it.

**The twelve groups.** `src/game/art/` holds one module per group, each a frozen `ArtGroup` table of `{ key, svg }` rows imported with `?raw`: `shapes` (18), `cutouts` (18), `letters` (26), `numerals` (10), `animals` (6), `food` (6), `items` (20), `shadows` (12), `toys` (7), `faces` (4), `music` (4) and `glyphs` (8) — 139 keys, of which the six avatars also stay in the shell, leaving 133 that only a game draws. A scene names the groups it draws in its own `preload()` and passes them to `preloadArtGroups(scene, groups)` in `src/game/art/registry.ts`, which registers each key the `TextureManager` does not already hold at that key's `textureSizeFor` tier ([§3.4](#34-texture-tiers)). The call is idempotent by design: an already-present texture is satisfied as-is — that is how `mascot_idle` works as a word prompt without a group — and a key still in flight is skipped, so two games sharing `shape_*`, `sm_*` or `frog_*` neither re-rasterize nor collide. Ownership is per scene: the registry listens for `filecomplete`, `loaderror` and the scene's `shutdown`, and a scene that shuts down mid-load releases exactly the keys it queued. Without that, a child who left a game while its art was still loading would leave those keys guarded for the rest of the session and every later visit would show missing textures.

**Loading feedback and the missing-key path.** A scene shows the shared textless cue from `src/components/ArtLoadingCue.ts` (`createArtLoadingCue(scene)`) while its groups load and clears it when they land; the cue is opacity-only under reduced motion and never waits on the network. A key that is missing despite its declaration degrades to the neutral placeholder from `src/game/art/placeholder.ts`, logs one `console.warn` per key, and leaves the round completable (FR-6) — never an exception, never a blocked loader.

**Story Order** keeps its own table for the same reason: `src/game/storyOrderArt.ts` imports the 33 panels as `?raw`, exports `STORY_PANEL_ASSETS` in `STORY_POOL` solution order, and exposes `preloadStoryOrderArt(scene)`, which registers each panel at `textureSizeFor(key)` through `toDataUri`. `StoryOrderScene.preload()` calls it, so the 33 SVG strings land in the Story Order chunk.

**The boundary is a test, not a convention.** `src/__tests__/game/art/shellOwnership.test.ts` reads `PreloadScene.ts` as text and fails if the scene imports an art-registry module (beyond a type-only `index`/`types` import), imports an SVG that backs a game-only key, or spells a game key out in the shell table. It pins the registered set against its own literal 53-key list — read from `SHELL_ASSETS` at runtime, not from the scene's source — so the derivation cannot quietly change the shell. It also asserts the counts — 139 group keys, 133 game-only, 33 story panels, six shared avatar files — so a scan that lost the registry cannot pass vacuously. `groupIntegrity.test.ts` fails on a key in two groups, `storyOrderArt.test.ts` keeps the single-module assertion, and `preloadScene.test.ts` checks each derived key against the SVG file named after it. Adding a game means adding an art group and a `preloadArtGroups()` call in its scene; `PreloadScene` never gains an import for it.

**Measured budgets.** The shell entry is 134.6 kB as `validate-bundle.js` reports it (137.8 kB as Vite prints it — the same size in binary and decimal units) against the 200 kB gate. Cold boot is gated at 3000 ms by `validate-boot.js`; the measured medians and the 4× CPU throttle figures live in `docs/perf-baseline.md`, which records the shell-diet track's run of 2026-10-20 (419.5 ms median, 1697.2 ms at 4× throttle). A cold first tap of a game adds **82 ms at worst** (Memory Match) and **48 ms for the widest art union** (Find the Word, 83 keys) against the 400 ms budget, with absolute totals of 224–334 ms, measured on that same 2026-10-20 run. That is an increment, not a standalone latency: the criterion is "adds <= 400 ms versus the same tap". `scripts/measure-first-tap.mjs` opens a fresh browser context per game so the game chunk is not cached, taps one tile and records the tap-to-first-frame total; it fails when the worst game's total exceeds the 400 ms budget rather than when the cross-game median does. It is not wired into CI, so it is evidence rather than a gate. `docs/perf-baseline.md` carries the before/after tables.

### 3.6 What the budget costs

| Measurement | Value | Source |
| --- | --- | --- |
| Boot textures | 53 (22 tiles, 22 stickers, 2 mascot poses, `icon_speaker`, 6 avatars) | `SHELL_ASSETS` in `src/scenes/PreloadScene.ts` |
| Game art | 12 groups, 139 keys; nine emit chunks of 3.1–19.4 kB and `cutouts`, `shadows`, `faces` inline into their only consumer | build output |
| Shell entry | 134.6 kB as `validate-bundle.js` reports it (137.8 kB as Vite prints it), gated at 200 kB | `node scripts/validate-bundle.js` |
| Phaser vendor chunk | 1342.6 kB as the validator reports it (1,374.8 kB as the Vite build prints it — same 1,374,822 bytes, binary versus decimal units) | `node scripts/validate-bundle.js` |
| Story Order chunk | ~40.3 kB, includes all 33 panel SVGs | build output |
| Precache entries | 54 (about 1,708 KiB) | `precache  54 entries` from the PWA build step |

The shell carries the three shell scenes, the components the Hub and its settings overlays use, the utilities they import and the 53 shell textures as strings. The build hoists whatever the lazy scenes share into its own chunk instead, so the shared bases do not ride the shell (the per-chunk figures below are also listed in [PRD §7.2](./PRD.md#72-shell-and-game-chunks), which owns them): `GameSceneBase` 11.85 kB, `ChoiceRoundScene` 2.08 kB, `GroupMathScene` 2.03 kB, `dragJuice` 1.03 kB, `dragBoard` 4.29 kB, and shared game logic such as `wordLogic` 1.95 kB, `countLogic` 0.81 kB and `shapeSorterLogic` 0.68 kB. Game scenes and art groups are separate chunks; Phaser is isolated so an app update downloads only the shell delta.

The current build emits 42 JavaScript chunks: 22 game scenes, nine art-group chunks (the other three groups inline into their only consumer), the three shared bases, the two drag shells, the shared game-logic chunks, the Phaser vendor chunk, the workbox helper and the shell entry. The structural acceptance is an inspection of `dist/assets`: the entry chunk carries zero game-scene constructor registrations, so every `super({ key: ... })` it holds belongs to Boot, Preload or Hub.

---

## 4. Scene architecture

### 4.1 Shell scenes and the lazy registry

Only `BootScene`, `PreloadScene` and `HubScene` are registered at construction time. The other 22 scenes are registered on demand.

`src/scenes/sceneRegistry.ts` exports `sceneLoaders`, a `Record<sceneKey, () => Promise<SceneType>>` with one dynamic import per game, keyed identically to the `sceneKey` values in `GAME_TILES`. `ensureSceneLoaded(scene, key, loaders = sceneLoaders)`:

1. returns immediately when `scene.scene.get(key)` already exists;
2. awaits the loader;
3. re-checks `scene.scene.get(key)` **after** the await, then `scene.scene.add(key, sceneClass)`.

The second check is not redundant. Phaser 4's `SceneManager.add` does not reject duplicates — it silently leaks a second instance — so a fast double-tap on a Hub tile would otherwise register two copies. The third parameter exists so tests can inject stub loaders.

Phaser 4 cannot express this in the config `scene` array: entries there are invoked with `new`, so no loader function can be async. Hub tile taps therefore do `void ensureSceneLoaded(this, tile.sceneKey).then(() => transitionToScene(this, tile.sceneKey))`.

### 4.2 GameSceneBase

`src/scenes/GameSceneBase.ts` is an abstract `Phaser.Scene` whose constructor takes the scene key and obtains the `AudioManager` singleton. It owns everything every game used to duplicate:

| Member | Behaviour |
| --- | --- |
| `init()` | resolves the registry entry from the scene key, stores the game id, tells the `AudioManager` which game's audio identity to use ([§8.2](#82-sound-effects)), and registers two shutdown hooks: one clears the audio context, the other flushes the pending taps |
| `createBackButton()` | "← Back" text at (20, 20) with a 96×96 hit rectangle, wrapped in `ParentLock`, then `attachPressFeedback` |
| `createCornerMascot()` | bottom-right mascot via `createCornerMascotComponent`, then `curious()` |
| `createRoundNarrator(options)` | destroys any previous narrator (scene instances are reused across visits) and builds a new `RoundNarrator` |
| `createSpokenInstruction(text, options)` | centred 26 px wrapped label plus a narrator glyph offset right by `INSTRUCTION_SPEAKER_GAP` |
| `createProgressDots(count)` / `fillProgressDot(index)` | outlined dots at `PROGRESS_DOT_Y = 60`, `PROGRESS_DOT_SPACING = 40`, `PROGRESS_DOT_RADIUS = 8`; filling tweens `DOT_POP_SCALE 1.4` (reduced 1.2) over 250 ms (reduced 150 ms) |
| `preloadArt(groups)` / `createArtCue()` | rasterises the art groups the scene draws and shows the shared textless cue while they load ([§3.5](#35-in-chunk-art)). The cue is created once per visit, however many groups the scene declares, and is taken down both on the loader's `complete` and on `create`; the scene's own `shutdown` hook destroys it |
| `reactWrong(targets?, onComplete?, onPreWiggle?)` | plays the incorrect cue in the game's own voice, records the wrong tap, nods the mascot, and wiggles the given targets with the reduced-motion-aware angle, releasing `onComplete` when the wiggle ends |
| `recordCorrect()` / `recordWrong()` | increment session counters, which reach the rolling adaptive window either when `completeGame()` banks a completed session or when the scene shuts down mid-game |
| `completeGame(gameId)` | locks input, `recordGameResult`, `playWin()`, big mascot cheer, win celebration, first-time sticker award + sticker animation, then a 3 s `AUTO_RETURN_DELAY` return to the Hub carrying `{ justEarned }` |
| `registerShutdownCleanup()` | on `shutdown`, destroys the parent lock, mascot, narrator, standalone speaker and instruction label |
| `speaker` getter/setter | prefers the narrator's glyph; the setter only ever fills the `standaloneSpeaker` slot, so no scene builds a `SpeakerButton` by hand |

Shared constants: `NEXT_ROUND_DELAY = 700`, `AUTO_RETURN_DELAY = 3000`, wiggle `4°`/`2°` over 350/200 ms repeating 3×, `OUTLINE_WIDTH = 4`, `STICKER_DISPLAY_SIZE = 256`, `WIN_TWEEN_DURATION = 300`, `SUCCESS_COLOR = 0x68d391`, `CARD_BG_COLOR = 0xffffff`, `OUTLINE_COLOR = 0x2d3748`, `SPEAKER_OFFSET = 70`, `INSTRUCTION_Y = 112`, `INSTRUCTION_WRAP_WIDTH = 620`, `INSTRUCTION_SPEAKER_GAP = 36`. `stickerKeyFor(gameId)` delegates to the registry: the `sticker_<game id>` convention is declared once in `src/game/gameRegistry.ts`, so a game id and its sticker key cannot drift apart.

### 4.3 ChoiceRoundScene

`src/scenes/ChoiceRoundScene.ts` implements the shared round loop for tap-one-card games. It owns the round prompt, the card grid, correct/wrong feedback, the 700 ms advance, progress-dot filling, the success flash and the reduced-motion wiggle.

Subclasses implement:

```ts
totalRounds(): number
gameId(): GameId
buildRoundContent(): void
isChoiceCorrect(index: number): boolean
clearRoundContent(): void
```

and may override `wiggleTargets(index)` (default: the tapped card's content), `onCorrect(index)` (before shared feedback), `onWrong(index)` (after the shared tone and the nod, before the wiggle completes) and `onWiggleComplete(index)`.

Lifecycle: `renderRound()` = `clearRound()` + `buildRoundContent()`. `clearRound()` destroys every tracked object and empties `choiceTargets`, `cardContents` and `roundDisplayObjects`. `createChoiceTarget(x, y, size, index, shape?)` draws the card and registers `pointerdown` **before** `attachPressFeedback`, so the game handler always runs first. Hit areas are inflated to `MIN_HIT_AREA = 96` px and offset to stay centred, which keeps small cards tappable.

Answer flow: `handleCorrect` locks input, plays the correct SFX, records the tap, runs `onCorrect`, cheers the mascot, fills the dot, flashes the card for `SUCCESS_FLASH_DURATION = 250` ms and schedules `advanceRound` after `NEXT_ROUND_DELAY`. `handleIncorrect` plays the incorrect SFX, records the tap, nods the mascot, runs `onWrong` and then wiggles the targets with `Sine.inOut`, releasing `onWiggleComplete` when the wiggle ends. `advanceRound` either completes the game or re-renders.

`resolveWholeRound(correct)` is the whole-board variant used by Story Order: it routes to the same handlers with `WHOLE_ROUND = -1`, skipping the single-card flash; subclasses must supply `wiggleTargets` (and usually `onWiggleComplete`).

### 4.4 GroupMathScene

`src/scenes/GroupMathScene.ts` adds the two-dot-group equation layout on top of `ChoiceRoundScene`. It is generic over a round type and driven entirely by one `config`:

```ts
interface GroupMathConfig<Round> {
  instruction: string;
  gameId: GameId;
  operationCue: "plus" | "minus";
  buildPlaythrough: (shift: BandShift) => Round[];
  isCorrect: (options, selectedIndex, target) => boolean;
  promptCards: (round) => readonly [GroupMathCard, GroupMathCard];
}
```

`GROUP_MATH_ROUND_COUNT = 6` (two per band). Layout constants: `PROMPT_CARD_SIZE = 180`, `ANSWER_CARD_SIZE = 170`, `SYMBOL_DISPLAY_SIZE = 96`, `PROMPT_CARD_COUNT = 2`, `PROMPT_Y_OFFSET = 140`, `ANSWERS_Y_OFFSET = 170`, `ITEM_SIZE = 38`, `ITEMS_PER_ROW = 4`, `ITEM_GAP = 3`, both spacings 24. `create()` runs `sceneEntrance`, corner mascot, back button, progress dots, spoken instruction, then `rounds = config.buildPlaythrough(getAdaptiveBandShift(config.gameId))`. `buildRoundContent()` draws the equation row (card, cue, card, equals) above four answer cards, each holding a centred dot group. `wiggleTargets(index)` wiggles the prompt cards after the tapped answer card.

### 4.5 Which game extends what

| # | Game | Scene | Base | Logic | Adaptive |
| --- | --- | --- | --- | --- | --- |
| 1 | Shape Sorter | `ShapeSorterScene` | `GameSceneBase` | `shapeSorterLogic` | adaptive |
| 2 | Animal Trace | `AnimalTraceScene` | `GameSceneBase` | `animalTraceLogic` | adaptive |
| 3 | Pop & Freeze | `PopFreezeScene` | `GameSceneBase` | `popFreezeLogic` | adaptive |
| 4 | Shadow Match | `ShadowMatchScene` | `GameSceneBase` | `shadowMatchLogic` | adaptive |
| 5 | Musical Memory | `MusicalMemoryScene` | `GameSceneBase` | `musicalMemoryLogic` | adaptive |
| 6 | Big & Small | `BigSmallScene` | `GameSceneBase` | `bigSmallLogic` | adaptive |
| 7 | Pattern Builder | `PatternBuilderScene` | `ChoiceRoundScene` | `patternBuilderLogic`, `shapeSorterLogic` | adaptive |
| 8 | Find the Letter | `AlphabetScene` | `ChoiceRoundScene` | `alphabetLogic` | adaptive |
| 9 | Find the Word | `WordMatchScene` | `ChoiceRoundScene` | `wordLogic` | adaptive |
| 10 | Build the Word | `WordBuilderScene` | `GameSceneBase` | `wordLogic` | adaptive |
| 11 | How Many? | `HowManyScene` | `ChoiceRoundScene` | `countLogic` | adaptive |
| 12 | First Sounds | `FirstSoundsScene` | `ChoiceRoundScene` | `firstSoundsLogic` | adaptive |
| 13 | More or Less | `MoreLessScene` | `ChoiceRoundScene` | `moreLessLogic` | adaptive |
| 14 | Odd One Out | `OddOneOutScene` | `ChoiceRoundScene` | `oddOneOutLogic` | adaptive |
| 15 | Color Match | `ColorMatchScene` | `ChoiceRoundScene` | `colorMatchLogic` | adaptive |
| 16 | Add It Up | `AddItUpScene` | `GroupMathScene` | `addItUpLogic` | adaptive |
| 17 | Take Away | `TakeAwayScene` | `GroupMathScene` | `takeAwayLogic` | adaptive |
| 18 | Memory Match | `MemoryMatchScene` | `GameSceneBase` | `memoryMatchLogic` | adaptive |
| 19 | Decode It | `DecodeItScene` | `ChoiceRoundScene` | `decodeLogic` | adaptive |
| 20 | Number Order | `NumberOrderScene` | `ChoiceRoundScene` | `numberOrderLogic` | adaptive |
| 21 | Feelings Faces | `FeelingsFacesScene` | `ChoiceRoundScene` | `feelingsFacesLogic` | adaptive |
| 22 | Story Order | `StoryOrderScene` | `ChoiceRoundScene` (shared `DragBoard`, `resolveWholeRound`) | `storyOrderLogic` + `storyOrderArt` | adaptive |

Twelve scenes extend `ChoiceRoundScene` directly, two reach it through `GroupMathScene`, and eight extend `GameSceneBase` directly. All twenty-two games call `getAdaptiveBandShift`. The PRD explains the pedagogy ([`docs/PRD.md#48-adaptive-difficulty`](./PRD.md#48-adaptive-difficulty)).

### 4.6 Lifecycle and shutdown

Scene instances are reused. `create()` therefore rebuilds state each visit and `registerShutdownCleanup()` — called at the end of `create()` by every game scene — destroys the objects that would otherwise leak across visits: parent lock, mascot, narrator, standalone speaker, instruction label. `ChoiceRoundScene.clearRound()` handles per-round objects separately.

The normal game path is: Hub tile → `ensureSceneLoaded` → `transitionToScene` → `create()` → rounds → `completeGame()` → `AUTO_RETURN_DELAY` → `transitionToScene(this, "Hub")` with `{ justEarned }` when a sticker was newly earned. `HubScene` reads `justEarned` to play the shelf highlight on arrival.

---

## 5. Components

Sixteen modules live in `src/components/`. Most are plain classes that take a `Phaser.Scene`; `ArtLoadingCue.ts` is a factory that returns an `ArtLoadingCue` handle, because the cue owns its own tweens and its own shutdown hook. None extends a scene.

### 5.1 RoundNarrator

`src/components/RoundNarrator.ts` is the single "hear it again" narrator. It owns the replay glyph (`SpeakerButton`), the optional written label, the mute presentation and the caption fallback, so no scene builds a `SpeakerButton` directly.

Options: `{ x, y, replay, announce?, label?, caption? }`. On construction it creates the glyph, creates the label when configured, subscribes to `voiceschanged` when a caption is configured, and speaks `announce` once through `speakSentence` unless captions are active.

Caption state machine — used by Feelings Faces, the one prompt with a written form:

1. **Immediate caption** when `!getSettings().sfxEnabled` or when speech is unsupported.
2. Otherwise the engine's voice list decides, and it is asynchronous: an empty first `getVoices()` read means "unknown", not "no voices".
3. With an event-capable engine the decision waits for `voiceschanged`; when that fires, the voice list is cached, `voicesSettled` is set and `applyCaptionState()` runs.
4. An engine without `addEventListener` cannot populate late, so its empty list decides immediately.
5. A flip rebuilds the label and glyph in place and calls `onChange(captioning)`, so the scene can re-render the round. The rule line is never re-spoken by this path.

`refreshCaptionFallback()` re-reads the decision at a round boundary deliberately silently — no rebuild and no `onChange` — because a notification mid-render would re-enter the scene's speak path and say the sentence twice. `setActive(active)` forwards to the glyph's pulse. `destroy()` removes the listener and destroys the glyph and label.

### 5.2 Mascot

`src/components/Mascot.ts` draws professor mascot poses from the `mascot_idle` and `mascot_celebrate` textures at `MASCOT_SCALE = 0.2`, positioned by `createCornerMascot(scene)` at `MASCOT_CORNER_MARGIN = 90` from the corner, behind gameplay at `MASCOT_DEPTH = -1` and touch-inert.

| Method | Normal | Reduced motion |
| --- | --- | --- |
| `wave()` | 8° over 200 ms `Sine.inOut` | 4° over 120 ms |
| `nod()` | 6° over 150 ms | 3° over 90 ms |
| `cheer(big)` | celebrate pose, 1.1× over 180 ms (`big`: 1.2× over 260 ms) `Back.out`, self-cleaning sparkle ring r 36 (big 48), colour `0xffd166` | pose swap only |
| `curious()` | 10° tilt + 6 px hop over 220 ms | 5° / 140 ms |
| `idleLoop()` | 3 px bob 2500 ms yoyo, squash-blink `scaleY 0.92` every 3700 ms | no-op |

`cheer` retires any in-flight cheer before starting, and pauses the blink while celebrating. Hub wiring: greeting flap on entrance, `idleLoop()` while idle, cheer on `justEarned`. Games wire cheer to correct taps and to the win, and nod to incorrect taps — Animal Trace does not nod, because it has no wrong answer.

### 5.3 ParentLock

`src/components/ParentLock.ts` gates adult-only controls behind a hold. `DEFAULT_HOLD_DURATION = 3000` ms, one hold per active pointer, ring radius 48 px in `0x68d391` at 0.6 alpha, depth 10000, animated by a value tween that starts at twelve o'clock. `pointerup`, `pointerout` and `pointercancel` cancel the hold and fire `onFailure` once; `destroy()` cancels silently; success fires exactly once. The ring is cleared on release, cancel and shutdown, so no display object survives the interaction. Hit areas are `Rectangle(0, 0, 96, 96)` anchored at the object's top-left display bounds, which is why the back button's lock works independently of `setOrigin`. The PRD covers why adult actions are gated ([`docs/PRD.md#53-the-parental-lock`](./PRD.md#53-the-parental-lock)).

### 5.4 SpeakerButton

`src/components/SpeakerButton.ts` is the replay glyph: a 96 px `icon_speaker` image with a 96×96 **centred** hit rectangle (`Rectangle(-48, -48, 96, 96)`), press feedback, `onSpeak` on pointerdown and an active pulse (`ACTIVE_PULSE_MS = 600`, alpha 0.6→1) while speech plays. Muted presentation is `MUTED_TINT 0xa0aec0` at `MUTED_ALPHA 0.6`; active is `ACTIVE_TINT 0x68d391`. It is constructed by `RoundNarrator` and, in tests, injected through `GameSceneBase`'s speaker setter.

### 5.5 SettingsPanel and the settings group

`src/components/SettingsPanel.ts` renders the parental controls above `HubScene`. It owns the backdrop (`0x000000` at `BACKDROP_ALPHA 0.6`, which closes the panel when tapped), a `PANEL_WIDTH = 480` × `PANEL_HEIGHT = 760` cream panel (`0xfff8e7`), and three toggles plus a voice chip:

| Control | Behaviour |
| --- | --- |
| Music | `AudioManager.setBGMEnabled`, persisted |
| Sounds | `AudioManager.setSFXEnabled`, persisted; captions the Feelings Faces prompt |
| Adaptive | `Settings.adaptiveDifficulty`, persisted, ON by default |
| Voice | cycles `availableVoiceOptions()` with 24-character truncation and a "Hi! I can talk." preview through `VoiceRow` |

Rows sit at fixed offsets from the panel centre: Profiles `+123`, Progress `+178`, Reset `+234`, Install `+290`, Voice `+345`. Rows are `ROW_CARD_WIDTH = 400` × `ROW_CARD_HEIGHT = 68` cards behind 32 px labels; toggles are `TOGGLE_WIDTH = 240` × `TOGGLE_HEIGHT = 96` hit areas drawn as a 64×32 track with a 24 px knob offset ±16. `ROW_HEIGHT = 64` is the minimum row pitch. The footer shows `v${__APP_VERSION__}` in 24 px `DISABLED_COLOR` (`#a0aec0`) at `centerY - 75`. Turning Sounds back on plays `playCorrect()` as the confirmation chime.

While the panel is open `allowPinchZoom()` relaxes the `user-scalable=no` viewport so parents can zoom; `restorePinchZoom()` puts it back on close.

`src/components/settings/` holds the rest:

| File | Responsibility |
| --- | --- |
| `primitives.ts` | palette, panel/toggle/row dimensions, `addRowCard`, `createRow`, toggle drawing |
| `ProfilesOverlay.ts` | profile list, add/delete/switch, per-profile limit chips (Off/15/30/45/60) |
| `ProgressOverlay.ts` | per-game learning stats: 6 rows per page (`PROGRESS_PAGE_SIZE = 6`), accuracy bar, `★` mastery at 3 wins, relative last-played, 7-day strip |
| `ResetModal.ts` | two-step destructive confirm (`Reset all stickers?` with Cancel/Reset); on success calls `resetProgress()`, leaves settings untouched, sets the row to `Progress cleared`, and calls the panel's `onProgressReset` so the Hub shelf re-renders immediately |
| `VoiceRow.ts` | voice chip cycling and preview |
| `InstallRow.ts` | install state row driven by `createInstallTracker()` — `installable`, `ios-howto` or hidden |

### 5.6 ProfileChip and PlayTimeIndicator

`src/components/ProfileChip.ts` is the kid-tappable avatar in the top-left: a 72 px avatar with a 96×96 hit area inset 20 px, opening a `PICKER_DEPTH = 20` picker of 96 px avatars spaced 40 px apart. Switching profiles triggers the Hub's `onSwitch`, which re-renders the sticker shelf and the play-time state.

`src/components/PlayTimeIndicator.ts` renders the active profile's remaining budget as a textless arc: `HINT_ARC_RADIUS = 12`, cool `0x68d391` turning warm `0xed8936` within five minutes of the limit, replaced by a moon badge once the limit is reached. `PlayTimeNudge` is the pre-launch delay: `NUDGE_DELAY = 2000` ms at `NUDGE_DEPTH = 20`.

### 5.7 PwaToast and PwaToasts

`PwaToast.ts` draws one 520×150 cream toast with 200×72 buttons (primary `#2b6cb0`, secondary `#a0aec0`). `PwaToasts.ts` owns the lifecycle: it subscribes through `pwaBridge` and surfaces an update-available toast (action: reload into the waiting service worker) and an offline toast. `registerType: "prompt"` in the PWA config is what makes the update toast possible instead of a silent takeover.

### 5.8 Typography and fonts

`public/fonts/baloo2-latin.woff2` is the only bundled face. It is declared by `@font-face` in `src/styles/style.css`, copied verbatim into `dist/` like the rest of `public/`, and precached with the shell, so text renders in Baloo 2 from the first offline frame.

`src/utils/typography.ts` is the single source of text styling: `FONT_FAMILY`, four size presets (`FONT_SIZE_SMALL` 18, `FONT_SIZE_MEDIUM` 24, `FONT_SIZE_LARGE` 32, `FONT_SIZE_XLARGE` 40) and `textStyle()`, which merges the bundled family under whatever props the caller passes. Every `Text` object is built through it, so no scene names a font family of its own.

The face also backs the letter and numeral SVGs, which set `font-family` on a `<text>` element; that dependency is why `BootScene` gates on `ensureGlyphFontLoaded()` ([§3.2](#32-bootscene)).

The parental Settings panel is the one surface that runs larger than the game presets: a 36 px panel title, 32-34 px row and toggle labels, and 30 px buttons, which is what the readability pass bought when the face replaced the bundled monospace.

---

## 6. State and storage

`src/utils/storage.ts` is the only module that touches `localStorage`. Everything else calls its exports.

### 6.1 Keys and cache

| Key | Meaning |
| --- | --- |
| `abby-little-lab:v2` | current state (`ProfileV2`) |
| `abby-little-lab:v1` | legacy single-profile state; read for migration and never deleted |

`v2Cache` is a module-scope memo of `{ raw, state }`. `ensureV2()` compares the current `getItem` string with the cached `raw` and returns the memo on a match, which avoids `JSON.parse` + `normalizeV2` on every tap. Any external write, removal or corruption changes the raw string and forces a re-parse.

### 6.2 Schema v2

```ts
interface ProfileV2 {
  activeProfileId: string;
  profiles: Profile[];          // 1..MAX_PROFILES (4)
  settings: Settings;           // device-global
}

interface Profile {
  id: string;                   // "p1".."p4"
  avatarId: AvatarId;           // cat | dog | pig | frog | duck | bear
  createdAt: string;
  stickers: Record<GameId, StickerData>;
  playTime: PlayTime;
  progress: Record<GameId, GameProgress>;
  activity: DayActivity[];      // today + 6 prior days, pruned on write
}

interface StickerData { earned: boolean; earnedAt: string | null }
interface Settings {
  bgmEnabled: boolean;
  sfxEnabled: boolean;
  preferredVoiceURI: string | null;   // null = platform default
  adaptiveDifficulty: boolean;        // true by default
}
interface PlayTime {
  limitMinutes: number | null;        // null = unlimited
  usedMinutes: number;
  lastUsedDate: string;               // local "YYYY-MM-DD"
}
interface GameProgress {
  plays: number; wins: number; correct: number; wrong: number;
  lastPlayedAt: string | null; recent: boolean[];
}
interface DayActivity { day: string; plays: number }
```

`GameId` is a 22-member string union in `src/types/index.ts`, and `GAME_IDS` repeats it in hub order. `MAX_PROFILES = 4`, `DEFAULT_AVATAR_ID = "cat"`, `AVATAR_IDS = ["cat","dog","pig","frog","duck","bear"]`. `AppStorage` (`{ stickers, settings }`) survives as the shape `load()`/`save()` speak, not as a stored format.

Sticker keys are `sticker_<game_id_with_underscores>`; `Profile.avatarId` maps to an existing boot texture through `PROFILE_AVATAR_TEXTURES` in `src/game/profileLogic.ts` (`cat` → `animal_cat`, `dog` → `animal_dog`, `pig` → `animal_pig`, `frog` → `frog_red`, `duck` → `sm_duck`, `bear` → `toy_teddy_bear`). Avatars are textless by design ([`docs/PRD.md#45-profiles`](./PRD.md#45-profiles)).

### 6.3 Facade functions

| Group | Exports |
| --- | --- |
| Read/write state | `load`, `save`, `ensureV2` (internal), `mutate` (internal) |
| Stickers | `earnSticker`, `hasSticker`, `resetProgress` |
| Settings | `getSettings`, `updateSettings` |
| Profiles | `getProfiles`, `getActiveProfile`, `addProfile`, `deleteProfile`, `switchProfile`, `getAvailableAvatars` |
| Play time | `getPlayTime`, `setPlayTimeLimit`, `recordPlayTime` |
| Progress | `recordGamePlay`, `recordGameResult`, `getProgress` |
| Adaptive | `getAdaptiveBandShift` |

Every mutator goes through `mutate(fn)`: apply a pure transform to the current state, persist when the transform returns non-null, return the new state. `resetProgress()`, `earnSticker()`, `recordGamePlay()` and `recordGameResult()` act on the **active** profile; `settings` is device-global; `setPlayTimeLimit()`/`recordPlayTime()` take an explicit `profileId`.

`getAdaptiveBandShift(gameId)` returns `0` when `settings.adaptiveDifficulty` is off, otherwise `bandShiftFor(getProgress()[gameId].recent)`.

### 6.4 Migration and normalisation

`ensureV2()`:

1. reads the raw v2 string; on a cache hit, returns the memo;
2. parses and normalises; if that succeeds, caches and returns;
3. otherwise calls `migrateV1(readV1())`, saves the result and returns it.

`migrateV1()` in `src/game/profileLogic.ts` turns a v1 save into one profile `p1` with avatar `cat`, carrying the old stickers over, and fills every other field from defaults. The v1 key is left in place, so a downgrade still finds its data. `normalizeV2()` backfills missing fields on every read: unknown stickers/progress entries default, counters must be non-negative integers, `recent` keeps only booleans and the last `WINDOW_SIZE` entries, `activity` is pruned to seven days.

### 6.5 The write path and its limitation

`saveV2()` at `src/utils/storage.ts:81-85` is:

```ts
function saveV2(v2: ProfileV2): void {
  const raw = JSON.stringify(v2);
  localStorage.setItem(V2_KEY, raw);
  v2Cache = { raw, state: v2 };
}
```

The `setItem` call is **unguarded**. A `QuotaExceededError`, a private-mode rejection or a blocked-storage exception propagates to the caller of any facade mutator, and the in-memory cache is not updated, so the write is simply lost. Reads are defensive — `readV1` and `readV2` both swallow `JSON.parse` failures and resolve to defaults — so a corrupt store degrades to a fresh profile rather than a crash. There is no `try/catch`, no write-failure flag and no user-visible signal on the write side.

---

## 7. Game logic modules

### 7.1 The module list

`src/game/` holds the app's logic layer: no DOM, no storage reads (except the play-time session machinery, which needs `document.visibilityState`). Most modules are Phaser-free; `dragBoard.ts`, `hubGrid.ts`, `storyOrderArt.ts`, `art/registry.ts` and `art/placeholder.ts` import Phaser types only, and `hub/gridBuilder.ts` imports it at runtime. Every module here is unit-tested directly.

| Module | Responsibility |
| --- | --- |
| `adaptiveLogic.ts` | band window, shift calculation, ladder shifting |
| `addItUpLogic.ts` | Add It Up rounds and answer checking |
| `alphabetLogic.ts` | Find the Letter rounds, `isConfusableWith` |
| `animalTraceLogic.ts` | trace-path point sets and completion test |
| `audioIdentity.ts` | the per-game audio identities - pitch offset, waveform, tempo and the correct/incorrect/win contours - and `identityForGameId` ([§8.7](#87-the-per-game-audio-identity)) |
| `bigSmallLogic.ts` | Big & Small pair generation and classification |
| `colorMatchLogic.ts` | colour round generation |
| `countLogic.ts` | How Many? bands and group cards |
| `decodeLogic.ts` | Decode It word/letter mapping |
| `dragBoard.ts` | the shared drag shell: slots, pieces, drop validation, wrong-answer behaviour and tap-to-withdraw ([§9.3](#93-press-drag-and-completion-feedback)) |
| `feelingsFacesLogic.ts` | contrast ladder of faces and prompts |
| `firstSoundsLogic.ts` | phonics rounds from a 12-word subset |
| `gameRegistry.ts` | the one declaration of the 22 games — `gameId`, `sceneKey`, `label`, `tileKey`, `stickerKey` and the icon overrides — plus `stickerKeyForGame`; `GameId` coverage is enforced by the type checker |
| `hubGrid.ts` | the Hub grid orchestrator: it delegates to `hub/gridBuilder` (tiles and page dots), `hub/pageBoard` (paging, page dots and the swipe gesture), `hub/stickerShelf` (earned stickers) and `hub/timeUpDim` (the play-time dim) |
| `hubPaging.ts` | page maths for the tile grid, with the tile count defaulting to the registry length |
| `hubTiles.ts` | `GAME_TILES`, derived from `gameRegistry` for the Hub grid |
| `memoryMatchLogic.ts` | pair generation, flip rules, adaptive tier split |
| `moreLessLogic.ts` | comparison round generation |
| `musicalMemoryLogic.ts` | sequence length bands (`startLengthFor`, `winLengthFor`) |
| `numberOrderLogic.ts` | ordering rounds |
| `oddOneOutLogic.ts` | odd-item selection and prompt text |
| `patternBuilderLogic.ts` | pattern sequences and missing-tile answers |
| `playTimeLogic.ts` | daily budgets, day rollover, visible-time session accounting |
| `popFreezeLogic.ts` | bubble spawn timing and pop targets |
| `profileLogic.ts` | profile CRUD, avatar map, `migrateV1`, `normalizeV2` |
| `progressLogic.ts` | per-game stats, mastery, accuracy, 7-day activity |
| `shadowMatchLogic.ts` | shadow/object pairing and win test |
| `shapeSorterLogic.ts` | shape sets, `ShapeType`, matching |
| `storyOrderArt.ts` | 33 story panel SVGs + `preloadStoryOrderArt` (imports Phaser types only) |
| `storyOrderLogic.ts` | `STORY_POOL`, shuffling, whole-strip validation |
| `takeAwayLogic.ts` | Take Away rounds and answer checking |
| `voiceLogic.ts` | `availableVoiceOptions`, `resolveVoice` |
| `wordLogic.ts` | word pools and word-round generation |
| `art/` | the twelve lazy art groups and their loader - 139 keys that travel with the game that draws them - plus the placeholder a failed key degrades to ([§3.5](#35-in-chunk-art)) |
| `hub/` | the decomposed Hub grid: tile layout, page board, sticker shelf and the time-up dim |

### 7.2 The round contract

Most game modules expose two things: a playthrough builder and a correctness test.

```ts
buildPlaythrough(shift: BandShift): Round[]     // or generatePlaythrough(count, shift)
isCorrect(round, selectedIndex): boolean
```

The scene builds the playthrough once in `create()` (never per round), then renders index by index. Because the builder is a pure function of `shift`, the same seed of inputs always produces the same ladder for the same profile state — the "adaptive" part is the shift, not randomness.

Games that do not fit the shape expose their own equivalents: `shapeSorterLogic.generatePlaythrough`/`isMatch`, `shadowMatchLogic.generateRound`/`isMatch`/`isWin`, `musicalMemoryLogic`'s sequence length helpers, and `animalTraceLogic`'s path completion test.

### 7.3 Adaptive banding

`src/game/adaptiveLogic.ts`:

| Constant | Value | Meaning |
| --- | --- | --- |
| `WINDOW_SIZE` | 10 | taps retained in `GameProgress.recent` |
| `MIN_SAMPLE` | 6 | taps needed before a shift is possible |
| `UP_THRESHOLD` | 0.9 | accuracy ≥ 0.9 shifts up |
| `DOWN_THRESHOLD` | 0.6 | accuracy < 0.6 shifts down |
| `BASE_LADDER` | `[1, 1, 2, 2, 3, 3]` | default six-round band ladder |

`updateRecentWindow(recent, { correct, wrong })` appends correct taps then wrong taps, keeps the last ten and never mutates its input. A session's taps are folded into the window when the session ends: `GameSceneBase` records them on completion, and on shutdown it also records the taps of a session the child abandoned. That flush writes the window only - `recordTaps` in `src/game/progressLogic.ts` leaves the cumulative `correct`, `wrong` and `wins` counters to completed sessions, and the `plays` counter alone is counted elsewhere, when the child starts a game from the Hub - and it zeroes the session counters afterwards, so a reused scene instance cannot report the same taps a second time. `bandShiftFor(recent)` returns `0` below the sample floor, `1` at ≥ 0.9 accuracy, `-1` below 0.6, else `0`. `shiftLadder(ladder, shift)` clamps every band into 1..3.

All 22 games read the shift; every one of them samples `getAdaptiveBandShift(gameId)` exactly once in `create()`, so a playthrough never changes difficulty mid-round. Their taps all reach the window, because the flush is unconditional.

The fifteen band-ladder games receive the shift in six different ways:

- **A shifted band ladder** - `shiftLadder(BASE_LADDER, shift)` - in `addItUpLogic`, `countLogic`, `moreLessLogic`, `takeAwayLogic`, `numberOrderLogic`, `memoryMatchLogic` and `patternBuilderLogic`.
- **One shifted band for the whole playthrough** - `shiftLadder(LETTER_BASE_LADDER, shift)[0]` and `shiftLadder(SOUND_BASE_LADDER, shift)[0]` - in `alphabetLogic`, which widens the letter range, and `firstSoundsLogic`, which widens the word pool and its distractors.
- **A tier split** - `earlyCount = roundCount - 1 - shift` - in `wordLogic` for Find the Word, and `wordCount - 1 - shift` for Build the Word.
- **Its own tier split** - `earlyCount = classicEasy - shift`, with `classicEasy = roundCount / 2` - in `decodeLogic`. Decode It's classic ladder opens with three easy rounds rather than five, so it cannot use the word games' formula.
- **A colour-pool split** - `3 - shift` easy rounds and `3 + shift` hard rounds - in `colorMatchLogic`, which divides its six rounds between the four-colour and the six-colour pool.
- **Its own ladder** - `ladderFor(shift)` - in `oddOneOutLogic`: down serves all six rounds at band 1, and up caps band 3 at three rounds and re-serves the freed round at band 1, because the three-frog pool cannot serve four band-3 rounds. `musicalMemoryLogic` maps the shift onto its starting sequence length instead, with `startLengthFor(shift)` giving one, two or three notes and a win length of five, six or seven.

The other seven games do not use the band ladder; each owns a single difficulty dimension that the shift selects:

- `shapeSorterLogic` selects the playthrough's shape pool with `poolFor(shift)`: nine ornamental, highly distinct shapes below classic, all 18 at classic, and ten confusable geometric families above; `generatePlaythrough(roundCount, shift)` draws all rounds from that one pool.
- `animalTraceLogic` sets the traced path length with `waypointsFor(shift)`: four, six or eight waypoints, which the path drawing, the progress dots and the completion test all consume.
- `popFreezeLogic` sets the sleeping range with `sleepingBoundsFor(shift)`: none or one sleeping bubble below classic, one or two at classic, two or three above, threaded through `selectBubbleType` and `generateInitialBubbles`.
- `shadowMatchLogic` selects which objects a round draws with `generateRound(shift)`: one object per confusable pair below classic, any six of the twelve at classic, and three full confusable pairs above; the six-object round size is unchanged at every shift.
- `bigSmallLogic` sets the size contrast with `scaleFactorsFor(shift)`: 1.6 and 0.68 below classic, 1.5 and 0.7 at classic, 1.35 and 0.8 above.
- `feelingsFacesLogic` sets the contrast ramp with `contrastSplitFor(shift)`: all six rounds distinct below classic, three distinct then three confusable at classic, all six confusable above.
- `storyOrderLogic` sets the story mix with `mixFor(shift)`: five obvious and one subtle below classic, three of each at classic, one obvious and five subtle above.

The pedagogy lives in [`docs/PRD.md#48-adaptive-difficulty`](./PRD.md#48-adaptive-difficulty).

### 7.4 Randomness

Shuffling uses `Math.random` by default. Where a module needs determinism it takes an optional RNG parameter — `storyOrderLogic.buildRound`/`buildPlaythrough` accept an injectable RNG so tests can pin a strip, and the builder guarantees a non-identity permutation even for a degenerate RNG (a reshuffle guard plus a one-step rotation). Other modules are tested by asserting invariants (counts, bands, membership) rather than exact order.

---

## 8. Audio

`src/audio/AudioManager.ts` is a singleton: `AudioManager.getInstance()` lazily constructs it, and `BootScene` calls `init()` once.

### 8.1 AudioManager lifecycle

`init()` creates the `AudioContext`, reads `getSettings()` into `bgmEnabled`/`sfxEnabled`, creates a looping `HTMLAudioElement` for `/audio/bgm.mp3` at `BGM_VOLUME = 0.3`, unsubscribes any previous speech listener before subscribing `onSpeechLifecycle(handleSpeechEvent)`, and installs the visibility watcher. `resume()` resumes a suspended context — it is called from the Hub's first `pointerdown`, because browsers start audio contexts suspended until a gesture.

`destroy()` clears the ramp and watchdog, unsubscribes the speech listener, removes the visibility listener, resets the duck state, pauses BGM, closes the context and drops the element.

### 8.2 Sound effects

`SFX_NAMES = ["pop", "correct", "incorrect", "wake", "win", "sticker"]` and `SfxName` is derived from it. Every effect is synthesized with Web Audio — sine oscillators through a gain node, no audio files:

| Effect | Notes |
| --- | --- |
| `pop` | 800 Hz, 80 ms |
| `correct` | the current game's own correct contour, transposed and timed by its identity ([§8.7](#87-the-per-game-audio-identity)) |
| `incorrect` | the current game's own incorrect contour, forced gently descending |
| `wake` | E4 then A4 |
| `win` | the current game's own win contour, with the tempo clamped to the celebration budget |
| `sticker` | C6 then E6 |
| `playIdleCall` | E5 + G5 at gain 0.12, for the Hub attract cue |
| `playFrogNote` | sine, 0.5 s, gain 0.3 — Musical Memory's frog notes C4 / E4 / G4 |

`pop`, `wake`, `sticker` and the two Hub cues are shared by every game. `correct`, `incorrect` and `win` are the per-game trio: the `AudioManager` resolves the current game's identity and plays that game's own contours, so the same event is a different set of notes from one game to the next ([§8.7](#87-the-per-game-audio-identity)). Each effect is a no-op unless `sfxEnabled` and the context exists. The PRD covers the sound design intent ([`docs/PRD.md#61-sound-effects`](./PRD.md#61-sound-effects)).

### 8.3 Background music, ducking and the watchdog

`BGM_FILE = "/audio/bgm.mp3"`, played through an `HTMLAudioElement` with `loop = true` and `volume = BGM_VOLUME`. Speech is treated as foreground: while narration is in flight the music drops to `BGM_DUCKED_VOLUME = BGM_VOLUME * 0.08` (2.4 % of full scale), ramped over `BGM_RAMP_DURATION = 120` ms in `BGM_RAMP_STEP = 20` ms steps — six steps, which reads as a fade rather than a jump.

Ducking is driven by speech lifecycle events, not by scenes: `speech:start` → `duckBGM()`, `speech:end` / `speech:error` → `restoreBGM()`. `speech.ts` reports only the most recently dispatched utterance, so a superseded utterance cannot restore the music mid-speech. `duckBGM()` is idempotent, so re-entrant narration re-aims at the same floor instead of stacking ramps. `restoreBGM()` clears the watchdog, returns early when not ducked, and ramps back to `BGM_VOLUME`.

`BGM_DUCK_WATCHDOG = 15000` ms guards the case where an engine swallows `onend` — a cancelled utterance, a scene shutdown, a hidden tab. When it fires, `isEngineSpeaking()` decides: still speaking, re-arm; otherwise restore. A music bed parked at 8 % is worse than an early restore.

The ducked level is **never persisted**. The only audio state written to storage is `bgmEnabled` and `sfxEnabled`; `ducked` is runtime-only and `restoreBGM()` is called on every path that could otherwise leave it stuck (toggles, visibility, destroy).

### 8.4 Visibility policy

The manager installs one `visibilitychange` listener when `document.visibilityState` is a string; hosts without it (older WebViews, non-DOM tests) stay inert.

- **Hidden**: remember whether music was actually playing (`resumeBGMWhenVisible`), `window.speechSynthesis.cancel()`, restore the duck (so the element is not left quiet), then pause BGM.
- **Visible again**: resume only when music was playing *and* `bgmEnabled`, then clear the flag. Music that was paused by the user stays paused.

Speech is cancelled rather than resumed: a half-heard sentence resumed minutes later is worse than silence. The next round boundary re-speaks.

### 8.5 Speech

`src/utils/speech.ts` wraps `speechSynthesis`. `isSpeechSupported()` guards every path. `unlockSpeechForUserGesture()` dispatches a silent warm-up utterance once per page session from the first real gesture, because iOS and WebKit keep the synthesis session locked until an utterance is dispatched inside a gesture; the flag stays clear on failure so the next interaction retries.

`speakText()` computes `needsInterrupt` from `speaking || pending`, cancels and calls `resume()` (which un-sticks some engines), then either speaks immediately or — when interrupting — after `INTERRUPT_DEFER_MS = 100`, giving the platform's asynchronous cancel time to complete. `resolveVoice(getVoices(), preferredVoiceURI)` assigns `utterance.voice` when it resolves. Utterances carry a sequence token and only the current token may emit lifecycle events, which is what keeps the duck state honest.

Public wrappers: `speakLetter` (rate 0.9), `speakWord` (0.8), `speakNumber` (0.9, via `NUMBER_WORDS`), `speakSentence` (0.9). All take an `enabled` flag and are silenced by the SFX toggle.

### 8.6 Toggles and persistence

`setBGMEnabled(enabled)` and `setSFXEnabled(enabled)` set the flag and persist it through `updateSettings`. `setBGMEnabled` calls `restoreBGM()` unconditionally, then pauses the element when disabling; `setSFXEnabled` calls it only when disabling, because SFX off means nothing is speaking. Either way the rule is the same: disabling audio mid-narration must not leave the element parked at the ducked level.

### 8.7 The per-game audio identity

`src/game/audioIdentity.ts` gives every game its own voice for the feedback trio. The module is pure data and pure logic — it knows nothing about Web Audio — so the synth consumes the resolved values without a structural rewrite.

| Field | Range | Meaning |
| --- | --- | --- |
| `pitchOffsetSemitones` | −5 to +5 (`MAX_PITCH_OFFSET_SEMITONES = 5`) | transposes every note of the trio |
| `waveform` | `sine`, `triangle`, `square`, `sawtooth` | the oscillator shape |
| `tempo` | `MIN_TEMPO = 0.75` to `MAX_TEMPO = 1.5` | a duration and spacing multiplier, 1 being the original timing |
| `contours` | `correct`, `incorrect`, `win` | the three note sets, as semitone offsets from the cue's anchor note |

`AUDIO_IDENTITIES` is a `Partial<Record<GameId, AudioIdentity>>` with one row for each of the 22 registry games. The `Partial` is deliberate: a registered game missing from the table fails the registry-iteration test rather than silently playing the default voice. `identityForGameId(gameId)` resolves an id to its identity and clamps it; an unregistered id, `null` or `undefined` falls back to `DEFAULT_IDENTITY` (no offset, sine, tempo 1, contours `[0, 4, 7]`, `[0, -7]`, `[0, 4, 7, 12]`), so resolution is total and deterministic.

The table is a literal, but the values follow four formulas over the game's zero-based index in the registry: `waveform = ["sine", "triangle", "square", "sawtooth"][index % 4]`, `pitch = (index % 11) - 5`, `tempo = 1 + ((index % 5) - 2) × 0.125` and the contour set is the one `index % 4` selects. Because the waveform and the contour set are chosen by the same index, four pairings are in use — sine with the first contour set, triangle with the second, square with the third, sawtooth with the fourth — and the pitch (eleven values from −5 to +5) and tempo (five values from 0.75 to 1.25) are what make all 22 identities distinct.

`GameSceneBase.init()` calls `audioManager.setGameContext(entry.gameId)` and the scene's shutdown hook calls `clearGameContext()`, so the `AudioManager.resolveTrioIdentity()` always names the game that is on screen.

Three helpers keep the trio safe:

- `descendingContour(offsets)` clamps every offset to ±`MAX_CONTOUR_OFFSET_SEMITONES = 12` and then floors each note at its predecessor, so an incorrect cue can never rise. A wrong answer settles; it never rebukes.
- `winTempoForBudget(tempo, baseEndSeconds)` clamps the tempo to the window `WIN_MIN_END_SECONDS = 0.3` to `WIN_MAX_END_SECONDS = 0.8`, so the win celebration always lands between a third and four-fifths of a second however fast the game's own tempo is. The tempo bounds alone do not enforce this — at `MAX_TEMPO` the default win cue would end at 0.825 s — so the clamp is applied where the budget is spent.
- `normalizeIdentity(identity)` clamps a stored identity to the same ranges before it is used, so a value that drifts out of range bends instead of breaking playback.

---

## 9. Motion and feedback

### 9.1 Reduced-motion helpers

`src/utils/motion.ts` is three functions: `isReducedMotion()` reads `window.matchMedia("(prefers-reduced-motion: reduce)").matches` with a `typeof` guard, `motionDuration(normal, reduced)` and `motionScale(normal, reduced)` select between the pair. All three are consulted at call time, never cached, so a mid-session OS change is honoured. Under reduced motion the contract is: shorter durations, smaller amplitudes, and no ambient loops — Pop & Freeze's breathing tween is `tween.remove()`d, the mascot's idle loop no-ops, and the commit effect drops its particles. The PRD states the product rule ([`docs/PRD.md#57-reduced-motion`](./PRD.md#57-reduced-motion)).

### 9.2 Scene transitions

`src/utils/sceneTransitions.ts`:

- `transitionToScene(scene, key, data?)` — 300 ms fade out to `0xfaf9f6`, start the target scene, then 180 ms fade in.
- `sceneEntrance(scene)` — 180 ms fade in with a 1.02 → 1 zoom.

Both pass `"Sine"` as an ease-map key rather than `"Sine.out"`. Camera Zoom effects resolve ease strings against their own `EaseMap`, where the dotted name is `undefined` and the tween crashes at runtime. A bare `scene.start` exists only for Boot's initial launch.

### 9.3 Press, drag and completion feedback

| Module | Behaviour |
| --- | --- |
| `pressFeedback.ts` | `attachPressFeedback(obj, { spring })` captures the scale at attach, squishes to `base × 0.95` on pointerdown, restores on pointerup/out/cancel, and springs back over 150 ms `Back.out` when `spring` is set; no-op under reduced motion |
| `dragJuice.ts` | `attachDragLift` lifts to `motionScale(1.1, 1.05)` with a `motionScale(4, 0)`° tilt; `attachDropZoneHighlight` strokes zones at `lineStyle(6, 0x2b6cb0, 0.9)` with a repeating `Sine.inOut` pulse; `snapToSlot` settles over 200 ms `Back.out` |
| `completionEffect.ts` | `createCompletionSplash` is a bounded, self-cleaning burst of 8 gold rays (`0xffd166`) over 420 ms, reduced to 180 ms; `createWinCelebration` draws 10 gold rays plus 10 confetti pieces in `0x68d391`, `0x4fd1c5`, `0xf687b3`, `0xf6ad55`, `0x9f7aea` over 700 ms, reduced to 6 rays and no particles over 300 ms |
| `dragBoard.ts` | the shared drag shell. `new DragBoard({ scene, zoneSize, wrongAnswerBehavior, validationTiming, tapWithdraw, dragDistanceThreshold, bounceDuration, bounceReducedDuration, isLocked, callbacks })` registers slots and pieces up front; a piece lifted further than `DEFAULT_DRAG_DISTANCE_THRESHOLD = 10` px counts as a drag rather than a tap, a drop is validated per drop or per round (`"per-drop"` or `"round-full"`), and a wrong answer either bounces the piece home over 300 ms (180 ms reduced) or leaves it in place for a retry (`"bounce-home"` or `"retry-in-place"`). A placed piece can be withdrawn with a tap when `tapWithdraw` is set, and the swap into a slot runs over `SWAP_DURATION = 200` ms, 120 ms under reduced motion |

Press feedback is always attached **after** the object's primary handler, so a tap's game effect is never delayed by presentation. Every completion effect is Graphics-based; `add.particles` is not used anywhere.

`dragBoard.ts` is the shell the drag games are meant to share, and `NumberOrderScene` and `StoryOrderScene` use it. The other three - Shape Sorter, Shadow Match and Big & Small - still hand-roll their own scaffolding over `dragJuice`, which is one of the known debts listed in [roadmap.md](./roadmap.md).

`GameSceneBase.reactWrong()` is the wrong-answer path every game shares: it plays the incorrect cue in the game's own voice, records the wrong tap, nods the mascot and, when the scene passes targets, wiggles them with the reduced-motion-aware angle before releasing `onComplete`. It is the no-fail path - nothing is lost, nothing is blocked, and the piece is simply nudged back into place.

### 9.4 Tween values

| Interaction | Normal | Reduced |
| --- | --- | --- |
| Rejection wiggle | 4° / 350 ms × 3 | 2° / 200 ms × 3 |
| Bubble pop shrink | 200 ms | 120 ms |
| Wake wobble | 300 ms, 1.15× | 180 ms, 1.05× |
| Frog bounce | 200 ms, 1.2× | 120 ms, 1.05× |
| Sticker pop | 300 ms, after 400 ms | 180 ms, after 250 ms |
| Progress dot pop | 250 ms, 1.4× | 150 ms, 1.2× |
| Drag lift | 120 ms, 1.1× | 80 ms, 1.05× |
| Snap to slot | 200 ms | 120 ms |
| Hint arc pulse | 400 ms | 240 ms |
| Win celebration | 700 ms, 10 rays | 300 ms, 6 rays |

Per-game reactions kept from the juice pass: Shape Sorter, Shadow Match and Big & Small drag with lift + zone highlight + snap; Big & Small adds a 150 ms shrink, a ±3° × 3 lid wiggle and a 1.05× bump; Shadow Match stamps at 1.1×, flashes white for 150 ms and dims to 0.5 alpha; Animal Trace hops in two 60 ms halves with a ±4° × 3 wiggle and a 1.4× dot pop; Pop & Freeze releases three teal droplets; Musical Memory ripples at 1.6× and drifts ±3 px over 1500 ms. Shape Sorter's silent-bounce rule: the incorrect SFX plays only when a piece is dropped on a zone, not when it is merely picked up.

---

## 10. Testing

### 10.1 Runner and mocks

Vitest on happy-dom, `globals: true`, one include pattern (`src/__tests__/**/*.test.ts`). Five shared helpers:

| Helper | Purpose |
| --- | --- |
| `phaserMock.ts` | `MockScene`, `createMockGameObject`, the module mock factory, plus self-tests |
| `matchMediaStub.ts` | stateful `matchMedia` keyed on the reduced-motion query, with `setReducedMotion` |
| `sceneFlowHarness.ts` | audio, speech, PWA and storage spies; object and tween helpers for flow tests |
| `gameScenes.ts` | `GAME_SCENES` / `GAME_SCENE_KEYS` table, kept out of the harness so a harness import cannot deadlock the `vi.mock` graph |
| `hitTest.ts`, `pressFeedback.ts` | hit-area and press-feedback assertions shared by component suites |

`typecheck` covers tests too, and the test tree is held to the same rules as source: no `@ts-nocheck`, no `any` casts, no blanket `as`. Making that true required typing the mock factory as `ReturnType<typeof vi.fn<(...args: any[]) => any>>` rather than `ReturnType<typeof vi.fn>`, which instantiates Vitest's generic with a wider constraint.

### 10.2 Suite shape

119 test files, 2,556 tests (verified 2026-10-23). The 7,013-line `navigation.test.ts` was split into focused files: Hub integration in `navigation`, `hubEngagement` and `hubPlayTime`; lifecycle in `sceneLifecycle` and `bootScene`; each game's flows co-located as `<game>Flow.test.ts`; assets, audio, components, game logic, scenes and utils each in their own folder.

Per-scene flow suites drive a scene through a whole playthrough with the mocked Phaser surface, asserting round counts, correct/incorrect handling, progress dots, completion, sticker award and shutdown cleanup. Logic suites assert invariants over the pure modules.

### 10.3 Coverage gates

Thresholds (lines 95 / functions 88 / branches 85 / statements 90) live in `vite.config.ts` and fail `pnpm test:coverage`. Current coverage (verified 2026-10-23) is statements 97.94, branches 91.88, functions 96.6 and lines 98.7 across 119 files and 2,556 tests.

`src/main.ts` and `src/types/**` are excluded from the coverage denominator — the former is a config object plus two side effects, the latter is type-only. `src/scenes/sceneRegistry.ts` is fully covered (100 % on all four metrics) because its loaders are exercised through injected stubs. The lowest file is `src/game/decodeLogic.ts` at 73.8 % lines, 74.54 % statements, 83.33 % functions and 56.66 % branches; its uncovered lines 63–77 are the fallback distractor path, which a pool of 22 words never forces.

### 10.4 What unit tests cannot cover

happy-dom supplies no canvas, no audio graph and no screen. The following are device checks, not unit tests:

- real rasterisation of the 219 SVGs (glyph fallback, tier sharpness);
- actual audio mixing, ducking audibility and voice availability;
- orientation lock and PWA install/update on iOS Safari, Android Chrome and desktop;
- the cold-load budget, which is `scripts/validate-boot.js`'s job in CI.

---

## 11. Build, PWA and CI

### 11.1 Vite build

`vite.config.ts` defines `__APP_VERSION__` from `package.json` (the Settings footer's only source of truth) and configures `build.rolldownOptions.output.codeSplitting.groups` with one group for `/[\\/]node_modules[\\/]phaser[\\/]/` named `phaser`. Isolating the engine means the service worker caches it once and app updates download only the shell delta — and `validate-bundle.js` enforces both halves of that.

### 11.2 PWA configuration

```ts
VitePWA({
  registerType: "prompt",
  includeAssets: ["audio/bgm.mp3", "fonts/baloo2-latin.woff2"],
  workbox: { globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"] },
  manifest: {
    name: "Aby's Little Lab", short_name: "Aby Lab", start_url: "./index.html",
    display_override: ["fullscreen", "standalone"], display: "standalone",
    orientation: "landscape",
    background_color: "#FAF9F6", theme_color: "#2B6CB0",
    icons: [192, 512, maskable 512],
  },
})
```

`registerType: "prompt"` means a new service worker waits for the parent to accept the update toast; nothing reloads under a child mid-game. The manifest's `orientation: "landscape"` is the fallback for the runtime lock attempted in `BootScene`. Installation requires HTTPS (or localhost) on a private static host or a tunnel.

### 11.3 Validator scripts

| Script | Checks |
| --- | --- |
| `validate-bundle.js` | exactly one `phaser-*.js` vendor chunk; every `index-*.js` shell entry ≤ `200 * 1024` bytes |
| `validate-pwa.js` | 16 named checks over `dist/sw.js` and `dist/manifest.webmanifest`: files exist, manifest name/orientation/display/`display_override`, `precacheAndRoute` present, **every emitted `dist/assets/*.js` chunk present in the precache manifest** (so a lazily loaded game or art group is offline-capable, or the build fails), BGM precached, no `.ligne` or `ligne_wasm_bg` asset, `NavigationRoute` registered |
| `validate-boot.js` | drives the production build through `playwright-core`: three cold loads, samples Navigation Timing after canvas mount + 5 s settle, fails when the median exceeds 3000 ms |
| `validate-docs.js` | asserts the durable invariants between the documents and the code: every `docs/release-notes-v*.md` is linked from the README's Documentation index, every relative link resolves and every anchor matches a heading, the README, the PRD and the TDD describe exactly the games in `GAME_REGISTRY`, `docs/roadmap.md` carries both `Known Issues` and `Future Work / Roadmap`, and no document points at a Conductor path that does not exist |
| `render-svg-contact-sheets.mjs` | developer tool, not a gate: renders per-category contact sheets from the SVG corpus (categories include `stories`) for art review |

`validate-boot.js` deliberately does not start its own server — spawning one destabilised CDP on Windows — so CI starts `vite preview` as a separate step. Measured medians at introduction were 0.63–1.75 s against a 2036 ms baseline; [`docs/perf-baseline.md`](./perf-baseline.md) keeps the per-run numbers.

### 11.4 GitHub Actions

`.github/workflows/ci.yml`, `permissions: contents: read`:

| Job | Runs on | Steps |
| --- | --- | --- |
| Quality Gates | `pull_request` (opened, synchronize, reopened) and `push` to `master` or a `v*.*.*` tag | checkout, `pnpm/action-setup@v6` (11.7.0), `setup-node@v7` (Node 22, pnpm store cached), `pnpm install --frozen-lockfile`, `pnpm run check`, `pnpm run typecheck`, `CI=true pnpm test`, `pnpm run build`, `node scripts/validate-bundle.js`, `node scripts/validate-pwa.js`, `node scripts/validate-docs.js`, then `vite preview` on port 4173 and `node scripts/validate-boot.js` |
| Deploy to Coolify | tag pushes only, `needs: quality-gates` | verifies the tag commit is an ancestor of `origin/master`, fails fast when `COOLIFY_DEPLOY_WEBHOOK` or `COOLIFY_TOKEN` is missing, then `curl --fail-with-body --request POST` with a Bearer token |

`paths-ignore` skips CI for `conductor/**`, `docs/**`, `README.md` and `**/*.md`. The webhook moved from GET to POST after Coolify 1.18.0 began answering GET with `405 {"message":"This endpoint has changed to a POST request."}`.

Deploy is tag-gated; master pushes never deploy. The PRD's release path section describes the intent ([`docs/PRD.md#82-deploy-path`](./PRD.md#82-deploy-path)).

One-time setup spans Coolify and the repo settings: an API token with the `deploy` permission (Keys & Tokens → API Tokens), the application's Deploy Webhook URL (Webhooks), the `COOLIFY_DEPLOY_WEBHOOK` and `COOLIFY_TOKEN` repository secrets, and branch protection on `master` with "Require status checks" set to `Quality Gates`. The workflow cannot enforce that last one itself, so without it an ungated pull request can still merge.

### 11.5 Container and host

The `Dockerfile` is two stages: `node:22-alpine` with `corepack prepare pnpm@11.7.0`, `pnpm install --frozen-lockfile`, `pnpm run build`; then `nginx:1.27-alpine` with `nginx.conf` and `dist/` copied in, port 80 exposed and a `wget --spider` healthcheck. The host is a private VPS running Coolify behind Nginx.

Locally the image builds with `docker build -t aby-little-lab .` and smoke-tests with `docker run --rm -p 8080:80 aby-little-lab`, which serves the app at `http://localhost:8080`. The container speaks plain HTTP on port 80, so production terminates TLS at the hosting provider or reverse proxy in front of it; installability and offline both depend on that.

---

## 12. See also

- [`docs/PRD.md`](./PRD.md) — product definition, curriculum map, per-game rules, cross-game systems, performance targets.
- [`docs/roadmap.md`](./roadmap.md) — what is known to be broken and what is planned next.
- [`conductor/tech-stack.md`](../conductor/tech-stack.md) — dated stack decisions and the history behind them.
- [`conductor/archive/uiux-hardening_20260805/`](../conductor/archive/uiux-hardening_20260805/) — the archived UI/UX hardening track behind the Baloo 2 typography, Hub tile icons and press-feedback pass.
- [`docs/release-checklist.md`](./release-checklist.md) — the manual device pass that complements the CI gates.
