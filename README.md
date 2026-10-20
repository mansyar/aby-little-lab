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

| # | Game | Milestone | Status |
|---|---|---|---|
| 1 | Shape Sorter | Cognitive reasoning & categorization | ✅ Implemented |
| 2 | Animal Trace-and-Connect | Fine motor precision & pre-writing | ✅ Implemented |
| 3 | Pop & Freeze! | Reflexes & inhibitory control | ✅ Implemented |
| 4 | Shadow Match | Visual discrimination & spatial awareness | ✅ Implemented |
| 5 | Musical Memory Simon | Working memory & auditory recall | ✅ Implemented |
| 6 | Big vs. Small Cleaner | Scale & quantitative reasoning | ✅ Implemented |
| 7 | Pattern Builder | Sequential pattern recognition | ✅ Implemented |
| 8 | Find the Letter | Early literacy (letter recognition) | ✅ Implemented |
| 9 | Find the Word | Early literacy (sight words) | ✅ Implemented |
| 10 | Build the Word | Early literacy (spelling) | ✅ Implemented |
| 11 | How Many? | Early numeracy (counting & number recognition) | ✅ Implemented |
| 12 | First Sounds | Early literacy (phonemic awareness) | ✅ Implemented |
| 13 | More or Less | Early numeracy (quantity comparison) | ✅ Implemented |
| 14 | Odd One Out | Visual discrimination & categorization | ✅ Implemented |
| 15 | Color Match | Color recognition | ✅ Implemented |
| 16 | Add It Up | Early numeracy (early addition) | ✅ Implemented |
| 17 | Take Away | Early numeracy (early subtraction) | ✅ Implemented |
| 18 | Memory Match | Working memory & visual discrimination | ✅ Implemented |
| 19 | Decode It | Early decoding / word recognition | ✅ Implemented |
| 20 | Number Order | Numeral sequencing / ordinality | ✅ Implemented |
| 21 | Feelings Faces | Social-emotional learning (emotion recognition) | ✅ Implemented |
| 22 | Story Order | Narrative sequencing / temporal order | ✅ Implemented |

**Replay variety** — all content-driven games draw from expanded, shuffled item pools each playthrough (Shape Sorter: 6 shapes; Animal Trace: 6 animal-food pairs; Shadow Match: 6 of 8 objects with matching silhouettes; Big vs. Small: 6 toys; Pop & Freeze: 6 sleeping-animal decoys; Find the Letter: 6 of 26 letters; Find the Word: 6 of 18 words, no two cards sharing a first letter; Build the Word: 3 words per playthrough, 2× 3-letter + 1× 4-letter, 6 tiles with distractors; First Sounds: 6 of 9 first letters from a curated 12-word pool; More or Less: 6 rounds with 3 "more" + 3 "less" prompts and distinct counts, 2 per band 1–3 / 1–5 / 1–10; Odd One Out: 6 rounds with a unique odd item per session, 2 per band — cross-category, same-category different item, frog color variants; Color Match: 6 rounds drawing 4 distinct colors per round from the 4-color pool (rounds 1–3) then the 6-color pool (rounds 4–6); Add It Up: 6 rounds with unique addend pairs per session, 2 per band ≤4 / ≤6 / ≤10; Take Away: 6 rounds with unique subtraction pairs per session (minuend > subtrahend, never 0), 2 per band ≤4 / ≤6 / ≤10; Memory Match: 6 rounds across progressive grids — 2×3 (3 pairs), then 3×4 (6 pairs), then 4×4 (8 pairs) — with shuffled pairs drawn from a 16-texture mixed-category pool (animals, toys, small items); Decode It: 6 rounds, easy-first 3-letter then 4-letter tiers with 6 unique targets per playthrough; Number Order: 6 rounds dragging 3/4/5 shuffled numerals into ascending slots (ranges 1–5/1–8/1–10, easy-first); Feelings Faces: 6 rounds drawn from a 16-scenario pool (one per emotion plus two extras, shuffled) with 3 distinct faces per round — contrastive pairs (happy/angry) for rounds 1–3, then the confusable sad/scared pair for rounds 4–6; Story Order: 6 rounds of 3 shuffled panels from an 8-story pool (4 obvious + 4 subtle, easy-first, no repeats)), with round sizes and difficulty fixed except for the ±1 adaptive band shift in the 15 adaptive games.

**Spoken rules** — every game is voiced. Ten narrate their round target (Find the Letter, Find the Word, Build the Word, How Many?, First Sounds, More or Less, Odd One Out, Color Match, Musical Memory, Decode It), and the other twelve speak a one-line rule when the round is set up — Shape Sorter ("Drag each shape into its hole."), Animal Trace ("Trace the line to the animal's food."), Pop & Freeze ("Pop the bubbles, but not the sleeping animals."), Shadow Match ("Drag each picture onto its shadow."), Memory Match ("Turn over two cards to find a pair."), Number Order ("Put the numbers in order, smallest first."), Pattern Builder ("Pick the shape that finishes the pattern."), Big vs. Small ("Put the big toys in the big box."), Add It Up ("Add the groups and pick the total."), Take Away ("Take some away and pick how many are left."), Feelings Faces ("Tap the face that shows how Aby feels."), and Story Order ("Put the story in order, first to last."). Each rule is one centred line with the shared speaker glyph beside it, both built by the single `src/components/RoundNarrator.ts` that every game scene uses: spoken once automatically, replayable on tap, silent (and dimmed) when SFX is off or the device has no voice.

## Parental Lock & Touch UX

Settings access and every game's Back button are gated by a **hold-for-3-seconds** parental lock: a continuous press on a 96×96px target, a green ring filling from twelve o'clock, one hold at a time, and release, pointer-out or pointer-cancel leaving no partial state. The same 96px targets cover the replay glyph in all twenty-two games. Behind that hold sit the version footer, Reset Progress, Install, the profile manager and the play-time limits.

Product rules: [PRD §5.2](docs/PRD.md#52-touch-targets), [PRD §5.3](docs/PRD.md#53-the-parental-lock). Implementation: [TDD §5.3](docs/TDD.md#53-parentlock), [TDD §5.5](docs/TDD.md#55-settingspanel-and-the-settings-group).

## Motion & Feedback

One motion system drives the app: a 300ms crossfade into a 180ms fade-in on every navigation, the same ten-ray celebration in all twenty-two games with the sticker reveal ~400ms later, a 95% press squish with a `Back.out` settle, and reduced motion that shortens durations, drops particles and disables press feedback while gameplay stays whole. Narration owns the foreground: music ducks to 8% over a 120ms ramp, a 15s watchdog restores it, and a hidden document pauses music, speech and the play clock.

Product rules: [PRD §5.6](docs/PRD.md#56-motion-and-feedback), [PRD §5.7](docs/PRD.md#57-reduced-motion), [PRD §6.4](docs/PRD.md#64-audio-focus). Implementation: [TDD §8.3](docs/TDD.md#83-background-music-ducking-and-the-watchdog), [TDD §9](docs/TDD.md#9-motion-and-feedback).

## Per-Game Juice

Every game layers scene-level animation juice on top of its core rules (no gameplay changes, no new assets, Graphics-only effects):

- **Drag lift & snap (Shape Sorter, Shadow Match, Big vs. Small)** — dragged pieces lift to 1.1× scale with a 4° tilt (1.05×, no tilt under reduced motion) and restore on release; drop zones pulse a soft outline while dragging over them; correct drops animate to the slot center with a 200ms `Back.out` snap tween (120ms reduced) instead of instant placement; incorrect drops still bounce back. Implemented by the shared `src/utils/dragJuice.ts` helper (`attachDragLift`, `attachDropZoneHighlight`, `snapToSlot`).
- **Big vs. Small box reaction** — on a correct drop the toy shrinks into the box (150ms), the box lid wiggles (±3°, 3 yoyo repeats), and the box briefly bumps to 1.05× alongside the splash.
- **Shadow Match reveal** — the matching silhouette stamps with a 1.1× pulse + white fill flash (self-cleaning), and the matched object dims to 50% alpha.
- **Animal Trace** — the animal hops between waypoints with a small arc tween (~120ms per hop; straight and faster under reduced motion), the food wiggles (±4°, 3 yoyo repeats) on path arrival, and progress dots pop 1 → 1.4 → 1 with `Back.out` instead of alpha-only.
- **Pop & Freeze** — popping emits 3 teal droplet circles radiating from the pop point (self-cleaning fade), and sleeping-animal decoys breathe on a 1.0 → 1.03 yoyo loop (~1.5s; disabled under reduced motion).
- **Musical Memory** — frog taps emit expanding ripple rings (self-cleaning fade), lily pads drift gently ±3px on a 3s loop (disabled under reduced motion), and progress dots pop on fill.
- **Find the Letter** — the target letter (rendered from the letter SVG texture, ~200px glyph) pops in at round start and is named aloud via SpeechSynthesis (silent when SFX is off or unsupported — visual-only play always works); a speaker-icon button next to it re-names the letter on demand; answer cards squish on press, correct taps chime with a progress-dot pop (700ms to the next round), and wrong taps wiggle gently (±4°, 3 yoyo repeats; ±2°/200ms reduced motion) with no penalty. Win shares the suite celebration plus a first-time sticker reveal.
- **Find the Word** — the prompt picture pops in and the word is spoken aloud (rate 0.8, silent when SFX is off or unsupported); a speaker-icon button re-hears the word on demand; the 4 word cards in a 2×2 grid squish on press, correct taps chime with a progress-dot pop (700ms to the next round), wrong taps wiggle gently with no penalty, and every round's choices start with different letters so pre-readers can match first letters.
- **Build the Word** — the word is spoken (a speaker-icon button re-hears it on demand) and each correct letter tile settles into the next empty slot with a `Back.out` pop plus a soft tick; wrong tiles wiggle with no penalty, slots fill strictly left-to-right, and a finished word lingers 1.2s with a chime + Hoot cheer before the next word (3 words, easy-first) appears.
- **How Many?** — the target numeral pops in large and is spoken aloud (a speaker-icon button re-hears it on demand); tap the group of objects whose count matches (3 cards at 1–3, then 4 cards up to 5 and 10). Correct taps flash green with a chime and progress dot; wrong taps wiggle with no penalty.
- **First Sounds** — a pictured word is spoken aloud (a speaker-icon button re-hears it on demand) and the child taps the letter card making the word's first sound; the correct letter is then spoken back. Round prompts reuse existing picture textures, and the 12-word pool is curated so every round's 4 letter cards avoid sound-confusable pairs (B/P, D/T) and visually confusable letter families — correct taps chime with a progress-dot pop (700ms to the next round), wrong taps wiggle with no penalty.
- **More or Less** — a large storybook arrow pops in (up = MORE, down = LESS) and the comparison word is spoken aloud; the child taps the group with more or fewer items. Two dot-group cards per round with distinct counts (easy-first bands 1–3 / 1–5 / 1–10, 3 "more" + 3 "less" prompts), reusing the counting item textures — correct taps flash the card green with a chime and dot pop (700ms advance), wrong taps wiggle with a gentle mascot nod and no penalty.
- **Odd One Out** — a 2×2 grid shows 3 identical cards + 1 different card, and the odd item's name is spoken aloud (a speaker-icon button re-hears it on demand). The child taps the card that is different — correct taps flash the card green with a chime and dot pop (700ms advance), wrong taps wiggle with a gentle mascot nod and no penalty. Six easy-first rounds (cross-category → same-category different item → frog color variants) reusing existing animal/toy/shape art with a unique odd item per session.
- **Color Match** — a large color swatch glows top-center and the color's name is spoken aloud (a speaker-icon button re-hears it on demand). The child taps the object whose color matches the swatch from a 2×2 grid of 4 distinct-color cards — correct taps flash the card green with a chime and dot pop (700ms advance), wrong taps wiggle with a gentle mascot nod and no penalty. Six easy-first rounds (4-color pool red/blue/yellow/green, then the 6-color pool + orange/purple) reusing existing shape/frog art whose fills match the swatch colors exactly.
- **Add It Up** — two dot-group cards pop in joined by a big "+" with an "=" cue, and the child counts both groups then taps the answer card showing the correct total (4 dot-group answer cards; counting stays visual, with the rule spoken at round start). Correct taps flash the card green with a chime and dot pop (700ms advance), wrong taps wiggle with a gentle mascot nod and no penalty. Six easy-first rounds (sums ≤ 4, then ≤ 6, then ≤ 10) reusing the counting item textures with a fresh, never-repeated addend pair per round.
- **Memory Match** — a face-down grid deals in with a staggered pop (40ms per card), and each tap flips a card with a scaleX 1→0→1 animation and a soft pop. Matching a pair flashes both cards green with the correct chime and a Hoot cheer; a mismatch wiggles both cards (±4°, 3 yoyo repeats) with a gentle mascot nod, then flips them back after a short pause — no penalty. Cards grow smaller and the grid grows (2×3 → 3×4 → 4×4) across the six rounds as the child's working memory warms up.
- **Feelings Faces** — three face cards rise in under a spoken scenario, each squishing on press; a correct tap splashes colour at the card, fills its progress dot with a `Back.out` pop and brings a Hoot cheer (700ms advance), while a wrong tap wiggles the card and its face (±4°, 3 yoyo repeats; ±2°/200ms reduced motion) with a gentle nod and re-speaks the scenario — no penalty, and the round stays open for another try.
- **Story Order** — three shuffled story panels squash on press and tilt as they lift; a drop snaps with `Back.out`, and moving a panel onto an occupied slot swaps the two so nothing is ever rejected. When the third panel lands the strip is judged: a correct order splashes colour at the strip's centre and fills the dot (700ms advance), while a wrong order wiggles every placed panel and leaves them exactly where the child put them, so one panel can be moved and retried — the strip re-validates only when the completed order actually changes.

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
