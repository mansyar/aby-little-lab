# Aby's Little Lab

An ad-free, distraction-free developmental game suite for preschoolers aged 3-5. Twenty-two mini-games targeting cognitive, motor, literacy, numeracy, reasoning, social-emotional, and narrative-sequencing milestones, built with Phaser 4 + TypeScript + Vite as an installable PWA.

## Tech Stack

| Component | Technology |
|---|---|
| Game Engine | Phaser 4 |
| Language | TypeScript 7 |
| Build Tool | Vite 8 |
| PWA | vite-plugin-pwa |
| Testing | Vitest + @vitest/coverage-v8 |
| Test DOM | happy-dom |
| Linting/Formatting | Biome |
| Package Manager | pnpm |

## Prerequisites

- Node.js 22+
- pnpm 11+

## Getting Started

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Testing

```bash
# Run tests in watch mode
pnpm test

# Run tests with coverage report
pnpm test:coverage
```

Coverage thresholds are set to 95% lines, 88% functions, 85% branches, and 90% statements in `vite.config.ts`; CI and those thresholds are the source of truth, and the counts here are a snapshot. Current state: **2,305 tests across 110 files**, all green (verified 2026-10-20).

## Code Quality

```bash
# Lint
pnpm lint

# Format
pnpm format

# Check (lint + format)
pnpm check

# Typecheck (tsc --noEmit, covers src/ and src/__tests__/)
pnpm typecheck
```

The project uses Biome with double quotes, 2-space indentation, and 100-character line width. `pnpm typecheck` runs the strict TypeScript compiler over the whole `src` tree, test files included, so mocks and fixtures stay type-safe; CI runs it as its own step before the test suite.

## Project Structure

```
public/
├── audio/                 # BGM served at /audio/bgm.mp3 and precached for offline play
├── fonts/                 # Bundled Baloo 2 variable font (WOFF2, precached)
└── icons/                 # PWA icons
src/
├── main.ts                # Phaser game config & shell scene register (game scenes lazy-loaded)
├── scenes/                # BootScene, PreloadScene, HubScene (shell) + 22 lazy-loaded game scenes on the shared bases ChoiceRoundScene (14 choice games) → GroupMathScene (Add It Up, Take Away) → GameSceneBase + sceneRegistry (dynamic-import loaders)
├── components/            # Shell UI: Mascot (Professor Hoot, tween-only reactions), RoundNarrator (the single prompt narrator: caption line + shared speaker glyph), SpeakerButton (shared replay control), ParentLock, ProfileChip (avatar chip + picker), PlayTimeIndicator (budget arc/nudge), PwaToasts (update/offline), PwaToast; settings/ holds the parental panel decomposed into SettingsPanel (composition) + primitives (rows/buttons/constants) + ProfilesOverlay, ProgressOverlay, ResetModal, VoiceRow, InstallRow
├── audio/                 # AudioManager (BGM/SFX + frog note & gameplay SFX synthesis + the app-wide audio-focus policy: narration duck, hidden-tab pause)
├── game/                  # Pure game logic (shapeSorterLogic, animalTraceLogic, popFreezeLogic, shadowMatchLogic, musicalMemoryLogic, bigSmallLogic, patternBuilderLogic, alphabetLogic, wordLogic, countLogic, firstSoundsLogic, moreLessLogic, oddOneOutLogic, colorMatchLogic, addItUpLogic, takeAwayLogic, memoryMatchLogic, decodeLogic, numberOrderLogic, feelingsFacesLogic, adaptiveLogic, profileLogic, playTimeLogic, progressLogic, voiceLogic: round generation, sequence memory, band ladders with ±1 adaptive shifts, profile CRUD, per-profile daily play-time budgets, progress windows) + hub modules (hubTiles tile metadata, hubPaging page math, hubGrid tile-grid rendering & gestures)
├── types/                 # Shared interfaces (GameId, StickerData, Settings, PlayTime, AppStorage, Profile, ProfileV2)
├── utils/                 # Motion & feedback (motion, sceneTransitions, completionEffect, pressFeedback, dragJuice) + typography (typography.ts) + settings pinch-zoom (viewportZoom.ts) + localStorage CRUD (storage.ts) + letter/word TTS (speech.ts)
├── assets/                # SVG assets bundled into the game (incl. ui/tiles/ tile icons, icon_speaker, sleep_zzz)
├── styles/                # Global CSS (@font-face for Baloo 2)
└── __tests__/             # Unit tests (audio, components, game, scenes, utils) + helpers/ (shared Phaser scene mock, matchMedia stub, press feedback & hit-test doubles)
```

## Mini-Games

Twenty-two mini-games in hub order; each links to its spec in [PRD §3](docs/PRD.md#3-game-specifications).

- [Shape Sorter](docs/PRD.md#31-shape-sorter) — cognitive reasoning and categorisation
- [Animal Trace](docs/PRD.md#32-animal-trace) — fine motor precision and pre-writing
- [Pop & Freeze](docs/PRD.md#33-pop--freeze) — reflexes and inhibitory control
- [Shadow Match](docs/PRD.md#34-shadow-match) — visual discrimination and spatial awareness
- [Musical Memory](docs/PRD.md#35-musical-memory) — working memory and auditory recall
- [Big & Small](docs/PRD.md#36-big-vs-small) — scale and quantitative reasoning
- [Pattern Builder](docs/PRD.md#37-pattern-builder) — sequential pattern recognition
- [Find the Letter](docs/PRD.md#38-find-the-letter) — early literacy, letter recognition
- [Find the Word](docs/PRD.md#39-find-the-word) — early literacy, sight words
- [Build the Word](docs/PRD.md#310-build-the-word) — early literacy, spelling
- [How Many?](docs/PRD.md#311-how-many) — early numeracy, counting and number recognition
- [First Sounds](docs/PRD.md#312-first-sounds) — early literacy, phonemic awareness
- [More or Less](docs/PRD.md#313-more-or-less) — early numeracy, quantity comparison
- [Odd One Out](docs/PRD.md#314-odd-one-out) — visual discrimination and categorisation
- [Color Match](docs/PRD.md#315-color-match) — color recognition
- [Add It Up](docs/PRD.md#316-add-it-up) — early numeracy, early addition
- [Take Away](docs/PRD.md#317-take-away) — early numeracy, early subtraction
- [Memory Match](docs/PRD.md#318-memory-match) — working memory and visual discrimination
- [Decode It](docs/PRD.md#319-decode-it) — early decoding and word recognition
- [Number Order](docs/PRD.md#320-number-order) — numeral sequencing and ordinality
- [Feelings Faces](docs/PRD.md#321-feelings-faces) — social-emotional learning, emotion recognition
- [Story Order](docs/PRD.md#322-story-order) — narrative sequencing and temporal order

## Parental Lock & Touch UX

Settings access and every game's Back button are gated by a **hold-for-3-seconds** parental lock: a continuous press on a 96×96px target, a green ring filling from twelve o'clock, one hold at a time, and release, pointer-out or pointer-cancel leaving no partial state. The same 96px targets cover the replay glyph in all twenty-two games. Behind that hold sit the version footer, Reset Progress, Install, the profile manager and the play-time limits.

Product rules: [PRD §5.2](docs/PRD.md#52-touch-targets), [PRD §5.3](docs/PRD.md#53-the-parental-lock). Implementation: [TDD §5.3](docs/TDD.md#53-parentlock), [TDD §5.5](docs/TDD.md#55-settingspanel-and-the-settings-group).

## Motion & Feedback

One motion system drives the app: a 300ms crossfade into a 180ms fade-in on every navigation, the same ten-ray celebration in all twenty-two games with the sticker reveal ~400ms later, a 95% press squish with a `Back.out` settle, and reduced motion that shortens durations, drops particles and disables press feedback while gameplay stays whole. Narration owns the foreground: music ducks to 8% over a 120ms ramp, a 15s watchdog restores it, and a hidden document pauses music, speech and the play clock.

Product rules: [PRD §5.6](docs/PRD.md#56-motion-and-feedback), [PRD §5.7](docs/PRD.md#57-reduced-motion), [PRD §6.4](docs/PRD.md#64-audio-focus). Implementation: [TDD §8.3](docs/TDD.md#83-background-music-ducking-and-the-watchdog), [TDD §9](docs/TDD.md#9-motion-and-feedback).

## Per-Game Juice

Every game shares one feedback language: a 95% press squish, the correct chime with a progress-dot pop, a ±4° three-repeat wiggle and a Hoot nod for a wrong answer, and the ten-ray celebration with the sticker reveal ~400ms later on a win; the drag games add a lift, a pulsing drop zone and a snap into the slot. Reduced motion shortens every duration and amplitude, drops particles and ambient loops and no-ops press feedback, while gameplay stays whole. Per-game reactions are recorded with each game in [PRD §3](docs/PRD.md#3-game-specifications); the implementation is [TDD §9](docs/TDD.md#9-motion-and-feedback).

## Hub Experience

The Hub is twenty-two storybook tiles, each a 64px icon above a small text label with a sticker shelf beneath, entering in a 40ms stagger and bobbing while idle; after ~25s without input two tiles wiggle to a two-note chime that repeats every ~10s. The avatar chip switches profile without a PIN, and the play-time arc, hourglass nudge and moon badge follow the active limit and refresh on every switch.

Product rules: [PRD §1.5](docs/PRD.md#15-session-flow), [PRD §4.4](docs/PRD.md#44-stickers), [PRD §4.6](docs/PRD.md#46-play-time-limits), [PRD §5.6](docs/PRD.md#56-motion-and-feedback). Implementation: [TDD §5.6](docs/TDD.md#56-profilechip-and-playtimeindicator), [TDD §7.1](docs/TDD.md#71-the-module-list).

## Professor Hoot Mascot

Professor Hoot is an owl in a lab coat drawn from two static SVG poses (`mascot_idle.svg`, `mascot_celebrate.svg`) and moved only by tweens. He waves on the Hub, cheers correct answers in every game, nods at a wrong one (never in Animal Trace, which has no wrong answer), joins the win, and is destroyed with the scene; reduced motion leaves him still.

Product rules: [PRD §4.3](docs/PRD.md#43-the-mascot). Implementation: [TDD §5.2](docs/TDD.md#52-mascot).

## UI & Typography (2026-08-06)

One bundled face, Baloo 2, replaces Phaser's Courier everywhere: precached with the shell, declared in `src/styles/style.css`, and applied through `textStyle()` from `src/utils/typography.ts`. Find the Letter draws its target and cards from the `letter_*` SVGs at 256/128px, Pop & Freeze uses the `sleep_zzz` glyph, the loading screen carries the brand lockup, and the win sticker lands ~400ms after the celebration.

Product rules: [PRD §5.1](docs/PRD.md#51-visual-language), [PRD §3.8](docs/PRD.md#38-find-the-letter). Implementation: [TDD §5.8](docs/TDD.md#58-typography-and-fonts), [TDD §3.2](docs/TDD.md#32-bootscene).

## PWA Release Readiness

`pnpm run build` writes `dist/manifest.webmanifest` and the service worker that precaches the shell, every game chunk, the icons, the font and `/audio/bgm.mp3`, so the installed app launches and plays offline after one online load. `node scripts/validate-pwa.js` fails the build when a game chunk is missing from that precache. Installation and offline both need HTTPS, or localhost for a same-device smoke test.

Product rules: [PRD §1.4](docs/PRD.md#14-platforms-install-and-offline), [PRD §4.10](docs/PRD.md#410-install-and-update). Implementation: [TDD §11.2](docs/TDD.md#112-pwa-configuration), [TDD §11.3](docs/TDD.md#113-validator-scripts).

## Bundle Code Splitting (2026-08-02)

Only Boot, Preload and Hub load at startup; the other twenty-two scenes arrive through `ensureSceneLoaded()` on a tile tap, ahead of the crossfade, and each game's art rides its own chunk. Build output (2026-10-20): a 129.1 KiB shell entry (30.02 kB gzip) against the 200 kB gate, 41 JavaScript chunks, cold boot 419.5 ms against the 3 s gate, and a cold first tap costing at most 82 ms against the 400 ms budget.

Product rules: [PRD §4.1](docs/PRD.md#41-shared-scene-bases-and-lazy-loading), [PRD §7](docs/PRD.md#7-performance-and-asset-budget). Implementation, measurements and art ownership: [TDD §3.5](docs/TDD.md#35-in-chunk-art), [TDD §3.6](docs/TDD.md#36-what-the-budget-costs).

## Docker Deployment

The image builds the Vite app in a `node:22-alpine` stage and serves `dist/` from `nginx:1.27-alpine`:

```bash
docker build -t aby-little-lab .
docker run --rm -p 8080:80 aby-little-lab
```

Then open `http://localhost:8080`; production terminates TLS in front of the container. See [TDD §11.5](docs/TDD.md#115-container-and-host).

## CI/CD

`.github/workflows/ci.yml` runs the `Quality Gates` job on every pull request and on `master`/tag pushes: check, typecheck, `CI=true pnpm test`, build, then `validate-bundle`, `validate-pwa` and `validate-boot` against a preview server. Deploy is tag-gated, not merge-gated: `Deploy to Coolify` runs only for a `v*.*.*` tag whose commit is on `master`.

One-time setup: a Coolify API token with the `deploy` permission, the app's Deploy Webhook URL, the `COOLIFY_DEPLOY_WEBHOOK` and `COOLIFY_TOKEN` secrets, and branch protection requiring `Quality Gates`. Intent: [PRD §8.2](docs/PRD.md#82-deploy-path); implementation and setup steps: [TDD §11.4](docs/TDD.md#114-github-actions), [TDD §11.5](docs/TDD.md#115-container-and-host).

## Releases

| Version | Date | Highlights | Tag |
|---|---|---|---|
| **v1.20.0** | 2026-10-20 | Game 22 - Story Order (3-panel story sequencing, 8-story pool, retry in place, ordinal pips) + game art moved into the game's own chunk so the boot shell stayed inside its 200 kB gate | `v1.20.0` |
| **v1.19.0** | 2026-10-20 | Game 21 - Feelings Faces (social-emotional learning, 16-scenario pool, contrast ladder, heart sticker) + shared choice-round shell for 13 games, one narrator for every prompt, BGM ducking under narration, backgrounded play clock paused | `v1.19.0` |
| **v1.18.0** | 2026-10-16 | Adaptive Difficulty complete across 15 games + docs aligned with the 20-game suite | `v1.18.0` |
| **v1.17.0** | 2026-10-16 | Adaptive difficulty for the final nine games (literacy/memory batch + remaining three) | `v1.17.0` |
| **v1.16.0** | 2026-08-27 | UI/UX Cohesion (shared press feedback, speaker states, Settings/Learning Progress affordances, Hub hierarchy + active-profile rings) + Ligne Offline-First Hoot (engine precached - animated Hoot on first offline visit) | `v1.16.0` |
| **v1.4.0** | 2026-08-04 | Multi-Kid Profiles — up to 4 kid profiles with own sticker collections, 6 textless animal avatars, parental-gated profile management, automatic v1 migration | `v1.4.0` |
| **v1.3.0** | 2026-08-04 | First Words word pool expansion (9→18 words, no shared first letters) + replay reliability fix | `v1.3.0` |
| **v1.2.1** | 2026-08-03 | Build the Word slot letter size fix; deployed via the automated pipeline (CI run `30800890115`, Quality Gates + Coolify) | `v1.2.1` |
| **v1.2.0** | 2026-08-03 | Games 9 & 10 — Find the Word + Build the Word (first words literacy); 5×2 hub grid; deployed via the automated pipeline (CI run `30797682029`, Quality Gates + Coolify) | `v1.2.0` |
| **v1.1.0** | 2026-08-02 | Game 8 — Find the Letter (letter recognition + TTS); deployed via the automated pipeline (CI run `30745388316`, Quality Gates + Coolify) | `v1.1.0` |
| **v1.0.0** | 2026-08-02 | Full 8-game suite, PWA install/update UX, parental settings, motion & juice, mascot | `v1.0.0` |

Release mechanics: bump `package.json` → tag `vX.Y.Z` → push to `master` (CI gates → Coolify deploy) → verify the live entry hash matches the local build. Full process and records in [release-checklist.md](docs/release-checklist.md).

## Documentation

- [PRD.md](docs/PRD.md) - Product Requirements Document
- [TDD.md](docs/TDD.md) - Technical Design Document
- [device-testing-checklist.md](docs/device-testing-checklist.md) - HTTPS device and offline validation checklist
- [release-checklist.md](docs/release-checklist.md) - Production build, PWA, deployment, and rollback checklist
- [release-notes-v1.20.0.md](docs/release-notes-v1.20.0.md) - v1.20.0 release notes (Story Order + in-chunk game art, released)
- [release-notes-v1.19.0.md](docs/release-notes-v1.19.0.md) - v1.19.0 release notes (Feelings Faces + shared shell and audio focus, released)
- [release-notes-v1.18.0.md](docs/release-notes-v1.18.0.md) - v1.18.0 release notes (adaptive-complete suite, released)
- [release-notes-v1.4.0.md](docs/release-notes-v1.4.0.md) - v1.4.0 release notes (Multi-Kid Profiles, released)
- [release-notes-v1.3.0.md](docs/release-notes-v1.3.0.md) - v1.3.0 release notes (First Words word pool expansion, released)
- [release-notes-v1.2.1.md](docs/release-notes-v1.2.1.md) - v1.2.1 release notes (Build the Word slot letter fix, released)
- [release-notes-v1.2.0.md](docs/release-notes-v1.2.0.md) - v1.2.0 release notes (Games 9 & 10 — First Words, released)
- [release-notes-v1.1.0.md](docs/release-notes-v1.1.0.md) - v1.1.0 release notes (Game 8 — Find the Letter, released)

## License

Private project.
