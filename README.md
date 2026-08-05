# Aby's Little Lab

An ad-free, distraction-free developmental game suite for preschoolers aged 3-5. Ten mini-games targeting cognitive, motor, literacy, and reasoning milestones, built with Phaser 4 + TypeScript + Vite as an installable PWA.

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

Coverage thresholds are set to 80% for lines, functions, branches, and statements. Current state: **897 tests across 31 files**, ~98% lines coverage (all shared motion/feedback/storage/transition/play-time utilities at 100%, `speech.ts` at 92%; the `ensureSceneLoaded` lazy-registration logic is 100% function-covered).

## Code Quality

```bash
# Lint
pnpm lint

# Format
pnpm format

# Check (lint + format)
pnpm check
```

The project uses Biome with double quotes, 2-space indentation, and 100-character line width.

## Project Structure

```
public/
├── audio/                 # BGM served at /audio/bgm.mp3 and precached for offline play
└── icons/                 # PWA icons
src/
├── main.ts                # Phaser game config & shell scene register (game scenes lazy-loaded)
├── scenes/                # BootScene, PreloadScene, HubScene (shell) + 10 lazy-loaded game scenes + sceneRegistry (dynamic-import loaders)
├── components/            # ParentLock and SettingsPanel parental modal, Mascot (Professor Hoot, tween-only reactions)
├── audio/                 # AudioManager (BGM/SFX + frog note & gameplay SFX synthesis)
├── game/                  # Pure game logic (shapeSorterLogic, animalTraceLogic, popFreezeLogic, shadowMatchLogic, musicalMemoryLogic, bigSmallLogic, patternBuilderLogic, alphabetLogic, wordLogic, profileLogic, playTimeLogic: shuffle, match detection, path progress, bubble spawning, round generation, sequence memory, scale sorting, pattern building, letter/word playthrough, profile CRUD, per-profile daily play-time budgets)
├── types/                 # Shared interfaces (GameId, StickerData, Settings, PlayTime, AppStorage, Profile, ProfileV2)
├── utils/                 # Motion & feedback (motion, sceneTransitions, completionEffect, pressFeedback, dragJuice) + localStorage CRUD (storage.ts) + letter/word TTS (speech.ts)
├── assets/                # SVG assets bundled into the game
├── styles/                # Global CSS
└── __tests__/             # Unit tests (audio, components, game, scenes, utils)
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

**Replay variety** — all content-driven games draw from expanded, shuffled item pools each playthrough (Shape Sorter: 6 shapes; Animal Trace: 6 animal-food pairs; Shadow Match: 6 of 8 objects with matching silhouettes; Big vs. Small: 6 toys; Pop & Freeze: 6 sleeping-animal decoys; Find the Letter: 6 of 26 letters; Find the Word: 6 of 18 words, no two cards sharing a first letter; Build the Word: 3 words per playthrough, 2× 3-letter + 1× 4-letter, 6 tiles with distractors), with round sizes and difficulty fixed.

## Parental Lock & Touch UX

Settings access (Hub **Settings**) and app exit (each game's **← Back**) are gated by a **hold-for-3-seconds** parental lock:

- A circular progress ring (green fill, 48px radius) shows the hold filling from 12 o'clock.
- Only **one hold runs at a time** — duplicate touches during a hold are ignored, and the action fires exactly once.
- Early release, pointer leaving the control, or pointer cancel **never** triggers the action.
- The ring is cleared on release, cancel, and scene shutdown — no leftover display objects.

The protected controls (Hub Settings, all ten game Back buttons, and the Musical Memory **Replay** control) expose explicit **96×96px hit areas** anchored to their display bounds, so children can tap near the visible label without precision aiming. Phaser hit areas are anchored at the top-left of a control's bounds, not its origin — keep `Rectangle(0, 0, 96, 96)` even for right-aligned or centered controls.

The Settings modal provides independently persisted BGM and SFX toggles with 96px touch targets; tapping outside the panel closes it. Enabling SFX plays a short confirmation chime. BGM playback begins after eligible user interaction and uses the packaged `/audio/bgm.mp3` loop.

Parent-facing additions (all behind the 3-second hold, never visible to the child during play):

- **Version footer** — a muted `v{version}` readout at the bottom of the panel, sourced from `package.json` via a Vite `define` (`__APP_VERSION__`), so parents and support can tell which build is installed even though the PWA updates silently.
- **Reset Progress** — a danger-colored row that opens a two-step confirm modal ("Reset all stickers?" with Cancel/Reset). Reset clears the sticker collection (all ten stickers become unearned) **while preserving the BGM/SFX settings**, then the row shows "Progress cleared" and the Hub's sticker shelf re-renders immediately — dimming every thumbnail without a reload. Useful for a second child, a hand-me-down device, or a fresh start.
- **Install control** — a context-aware row: "Install App" where a browser prompt is available (Chrome/Android/Edge), "How to Install" with Share → Add to Home Screen guidance on iOS Safari, hidden once the app is installed (see PWA Release Readiness).
- **Profile manager** — up to 4 kid profiles, each with its own sticker collection; the Hub's top-left avatar chip (kid-tappable) switches profiles without parental input, while adding/removing profiles happens behind the hold (two-step delete). Profiles use 6 textless animal avatars (cat, dog, pig, frog, duck, bear) reusing existing art; old saves auto-migrate to the first profile.
- **Play-time limits** — a per-profile daily cap (Off/15/30/45/60 minutes) via a chip in Profiles; usage accrues while games run and resets each day. The Hub shows a textless remaining-budget arc (turns orange ≤5 min), a 2s hourglass nudge delays launch once 5 min remain, and at the cap tiles dim and lock behind a moon badge — no mid-game cutoffs, off by default (2026-08-05).

## Motion & Feedback

All animation is driven by a shared motion system (`src/utils/`):

- **Scene transitions** — every navigation path (boot → hub, hub ↔ game, completion returns) plays a 300ms crossfade to the app background, then a 180ms fade-in with a subtle entrance zoom.
- **Win celebration** — all ten games share one choreographed completion effect: 10 rays + 10 drifting confetti bits (~700ms) that clean themselves up and never block the next interaction.
- **Press feedback** — Back, Replay, Settings, and Hub game tiles squish to 95% of their base scale while pressed; tiles spring back with a `Back.out` overshoot (150ms), other controls restore instantly. Hub tiles navigate **on release** so the squish stays visible while holding; dragging off the tile cancels the navigation.
- **Reduced motion** — the `motion` utility (`isReducedMotion`/`motionDuration`/`motionScale`) governs every tween in the app: durations shorten (~40%), amplitudes soften, the celebration simplifies (6 rays, no confetti), press feedback is disabled, Hub entrances fade without scale (no bob, wiggle, sparkle, or burst), the idle attract plays chime-only, and gameplay stays fully functional under `prefers-reduced-motion`.

## Per-Game Juice

Every game layers scene-level animation juice on top of its core rules (no gameplay changes, no new assets, Graphics-only effects):

- **Drag lift & snap (Shape Sorter, Shadow Match, Big vs. Small)** — dragged pieces lift to 1.1× scale with a 4° tilt (1.05×, no tilt under reduced motion) and restore on release; drop zones pulse a soft outline while dragging over them; correct drops animate to the slot center with a 200ms `Back.out` snap tween (120ms reduced) instead of instant placement; incorrect drops still bounce back. Implemented by the shared `src/utils/dragJuice.ts` helper (`attachDragLift`, `attachDropZoneHighlight`, `snapToSlot`).
- **Big vs. Small box reaction** — on a correct drop the toy shrinks into the box (150ms), the box lid wiggles (±3°, 3 yoyo repeats), and the box briefly bumps to 1.05× alongside the splash.
- **Shadow Match reveal** — the matching silhouette stamps with a 1.1× pulse + white fill flash (self-cleaning), and the matched object dims to 50% alpha.
- **Animal Trace** — the animal hops between waypoints with a small arc tween (~120ms per hop; straight and faster under reduced motion), the food wiggles (±4°, 3 yoyo repeats) on path arrival, and progress dots pop 1 → 1.4 → 1 with `Back.out` instead of alpha-only.
- **Pop & Freeze** — popping emits 3 teal droplet circles radiating from the pop point (self-cleaning fade), and sleeping-animal decoys breathe on a 1.0 → 1.03 yoyo loop (~1.5s; disabled under reduced motion).
- **Musical Memory** — frog taps emit expanding ripple rings (self-cleaning fade), lily pads drift gently ±3px on a 3s loop (disabled under reduced motion), and progress dots pop on fill.
- **Find the Letter** — the target letter pops in at round start and is named aloud via SpeechSynthesis (silent when SFX is off or unsupported — visual-only play always works); answer cards squish on press, correct taps chime with a progress-dot pop (700ms to the next round), and wrong taps wiggle gently (±4°, 3 yoyo repeats; ±2°/200ms reduced motion) with no penalty. Win shares the suite celebration plus a first-time sticker reveal.
- **Find the Word** — the prompt picture pops in and the word is spoken aloud (rate 0.8, silent when SFX is off or unsupported); the 4 word cards in a 2×2 grid squish on press, correct taps chime with a progress-dot pop (700ms to the next round), wrong taps wiggle gently with no penalty, and every round's choices start with different letters so pre-readers can match first letters.
- **Build the Word** — the word is spoken and each correct letter tile settles into the next empty slot with a `Back.out` pop plus a soft tick; wrong tiles wiggle with no penalty, slots fill strictly left-to-right, and a finished word lingers 1.2s with a chime + Hoot cheer before the next word (3 words, easy-first) appears.

## Hub Experience

The Hub is the child's landing screen, built for gentle, playful engagement:

- **Staggered entrance** — tiles, labels, and stickers wave in one-by-one (40ms apart, 300ms `Sine.out` fade + scale-up). Under reduced motion, entrances fade only.
- **Idle float** — tiles gently bob on a 2.5s sine loop with a phase offset, and four low-contrast dots drift slowly behind the grid (both skipped under reduced motion).
- **Sticker shelf** — each game's real SVG sticker thumbnail (56px) sits under its tile: earned stickers shimmer (800ms alpha loop), unearned ones are dimmed (30% alpha, 85% scale) so the collection goal stays visible, and a just-earned sticker bounces in larger (`Back.out` to 1.15×) with a sparkle burst. Game scenes pass `{ justEarned: <gameId> }` on auto-return when a sticker is earned that session. The shelf always shows the active profile's collection and re-renders on profile switch.
- **Profile chip** — a kid-tappable avatar chip (96px target) in the top-left opens a textless profile picker; switching profiles re-renders the sticker shelf and play-time state instantly.
- **Play-time state** — with a daily cap set, a small textless arc at the bottom-center shows remaining budget (cool green; orange ≤5 min), a 2s hourglass nudge precedes game launch once 5 min remain, and at the cap tiles dim and lock behind a moon badge (mascot waves once). All refresh live on profile switch or settings change.
- **Idle attract** — after ~25s without input, tiles wiggle gently (4° rotation wobble) and a soft two-tone chime (`AudioManager.playIdleCall()`) plays, repeating every ~10s while idle. Any pointer input resets the timer; reduced motion plays the chime without the wiggle.

## Professor Hoot Mascot

Professor Hoot — a round owl in a tiny lab coat — is the app's friendly teacher mascot, rendered from two static SVG poses (`mascot_idle.svg`, `mascot_celebrate.svg`) with tween-only animation (no sprite sheets, no particle emitters, no new audio):

- **Hub** — Hoot sits in the bottom-right corner (0.2× scale, touch-inert, behind gameplay z-order): waves on load, cheers when the visit follows a newly earned sticker (`justEarned` scene data), then settles into a slow bob with a periodic squash-blink idle loop.
- **All ten games** — Hoot stands in the same corner in every game scene: cheers on a correct action (wings up + bounce + self-cleaning sparkle ring), nods gently on an incorrect action (paired with the soft incorrect SFX; Animal Trace has no nod path — it is a no-fail game), and does a bigger cheer alongside the shared win celebration. The mascot is destroyed on scene shutdown.
- **Implementation** — `src/components/Mascot.ts` (wave/cheer/nod/idleLoop + `createCornerMascot()` shared factory). Overlapping cheers retire the in-flight tween and pause the blink loop so rapid pops never stack tweens. Reactions reuse the existing SFX (`playCorrect`/`playIncorrect`/`playWin`/`playSticker`) — no new audio files.
- **Reduced motion** — the idle loop is disabled and reactions become minimal (gentle wave/nod, pose swap without bounce or sparkle).

## PWA Release Readiness

Production builds generate `dist/manifest.webmanifest` and an auto-updating service worker. The service worker precaches the bundled game assets, PWA icon, and `/audio/bgm.mp3` so the installed app can launch and play offline after its first online load.

Run the release checks with `pnpm run build` followed by `node scripts/validate-pwa.js`. Use an HTTPS private static host or tunnel for phone/tablet installation, offline, and update testing; `http://localhost` is suitable only for same-device smoke tests.

## Bundle Code Splitting (2026-08-02)

The ten game scenes are **lazy-loaded** so the startup bundle only contains the app shell (Phaser + Boot/Preload/Hub):

- `src/scenes/sceneRegistry.ts` maps each game's scene key to a dynamic `import()` loader. A Hub tile tap awaits `ensureSceneLoaded()` (import + runtime `scene.add()`), and only then starts the crossfade transition.
- **Phaser 4 limitation:** the `scene` array does not support async/lazy loaders — function entries are invoked with `new` synchronously. Runtime registration after a dynamic import is the supported pattern.
- **Build output:** a single entry chunk (~1.44 MB / 372 KB gzip — Phaser dominates the shell) plus ten 3–5 KB game-scene chunks that are fetched only on the first tap of each game. Rollup auto-hoists shared modules (game logic, `dragJuice`, `completionEffect`).
- **Offline is unchanged:** the service worker precaches every emitted chunk (20 precache entries), so all games still play offline after the first load.
- Structural acceptance: the entry chunk contains zero game-scene constructor registrations (verified via `super({ key: ... })` inspection of `dist/assets`).

## Docker Deployment

The production image builds the Vite app in a Node stage and serves the generated `dist/` files with Nginx:

```bash
docker build -t aby-little-lab .
docker run --rm -p 8080:80 aby-little-lab
```

Open `http://localhost:8080` for a local smoke test. For production PWA installation and offline testing, terminate TLS at your hosting provider or reverse proxy and serve the container over HTTPS.

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) runs the full quality-gate suite before anything reaches production:

- **Pull requests** — the `Quality Gates` job runs `pnpm run check`, `CI=true pnpm test`, `pnpm run build`, and `node scripts/validate-pwa.js`. The PR must be green before merging (enable branch protection on `master` to require this check).
- **Merge to `master`** — after the gates pass, the `Deploy to Coolify` job fires the Coolify Deploy Webhook, and Coolify rebuilds the app from the repo's Dockerfile and ships the new version.

One-time setup:

1. In Coolify, open **Keys & Tokens → API Tokens**, create a token with the **`deploy`** permission, and copy it.
2. In Coolify, open the application → **Webhooks** → copy the **Deploy Webhook** URL.
3. In GitHub, go to **Settings → Secrets and variables → Actions** and add two repository secrets:
   - **`COOLIFY_DEPLOY_WEBHOOK`** — the Deploy Webhook URL
   - **`COOLIFY_TOKEN`** — the API token (with `deploy` permission)
4. (Recommended) Enable branch protection on `master` with "Require status checks" → `Quality Gates`, so only gate-verified code can be merged.

## Releases

| Version | Date | Highlights | Tag |
|---|---|---|---|
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
- [release-notes-v1.4.0.md](docs/release-notes-v1.4.0.md) - v1.4.0 release notes (Multi-Kid Profiles, released)
- [release-notes-v1.3.0.md](docs/release-notes-v1.3.0.md) - v1.3.0 release notes (First Words word pool expansion, released)
- [release-notes-v1.2.1.md](docs/release-notes-v1.2.1.md) - v1.2.1 release notes (Build the Word slot letter fix, released)
- [release-notes-v1.2.0.md](docs/release-notes-v1.2.0.md) - v1.2.0 release notes (Games 9 & 10 — First Words, released)
- [release-notes-v1.1.0.md](docs/release-notes-v1.1.0.md) - v1.1.0 release notes (Game 8 — Find the Letter, released)

## License

Private project.
