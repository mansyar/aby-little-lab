# Aby's Little Lab

An ad-free, distraction-free developmental game suite for preschoolers aged 3-5. Six mini-games targeting cognitive, motor, and reasoning milestones, built with Phaser 4 + TypeScript + Vite as an installable PWA.

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

Coverage thresholds are set to 80% for lines, functions, branches, and statements. Current state: **415 tests across 15 files**, ~97% statement coverage.

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
├── main.ts                # Phaser game config & scene register
├── scenes/                # BootScene, PreloadScene, HubScene, 6 game scenes
├── components/            # ParentLock and SettingsPanel parental modal
├── audio/                 # AudioManager (BGM/SFX + frog note & gameplay SFX synthesis)
├── game/                  # Pure game logic (shapeSorterLogic, animalTraceLogic, popFreezeLogic, shadowMatchLogic, musicalMemoryLogic, bigSmallLogic: shuffle, match detection, path progress, bubble spawning, round generation, sequence memory, scale sorting)
├── types/                 # Shared interfaces (GameId, StickerData, Settings, AppStorage)
├── utils/                 # Motion & feedback (motion, sceneTransitions, completionEffect, pressFeedback) + localStorage CRUD (storage.ts)
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

## Parental Lock & Touch UX

Settings access (Hub **Settings**) and app exit (each game's **← Back**) are gated by a **hold-for-3-seconds** parental lock:

- A circular progress ring (green fill, 48px radius) shows the hold filling from 12 o'clock.
- Only **one hold runs at a time** — duplicate touches during a hold are ignored, and the action fires exactly once.
- Early release, pointer leaving the control, or pointer cancel **never** triggers the action.
- The ring is cleared on release, cancel, and scene shutdown — no leftover display objects.

The protected controls (Hub Settings, all six game Back buttons, and the Musical Memory **Replay** control) expose explicit **96×96px hit areas** anchored to their display bounds, so children can tap near the visible label without precision aiming. Phaser hit areas are anchored at the top-left of a control's bounds, not its origin — keep `Rectangle(0, 0, 96, 96)` even for right-aligned or centered controls.

The Settings modal provides independently persisted BGM and SFX toggles with 96px touch targets; tapping outside the panel closes it. Enabling SFX plays a short confirmation chime. BGM playback begins after eligible user interaction and uses the packaged `/audio/bgm.mp3` loop.

## Motion & Feedback

All animation is driven by a shared motion system (`src/utils/`):

- **Scene transitions** — every navigation path (boot → hub, hub ↔ game, completion returns) plays a 300ms crossfade to the app background, then a 180ms fade-in with a subtle entrance zoom.
- **Win celebration** — all six games share one choreographed completion effect: 10 rays + 10 drifting confetti bits (~700ms) that clean themselves up and never block the next interaction.
- **Press feedback** — Back, Replay, and Settings controls squish to 95% of their base scale while pressed and spring back on release.
- **Reduced motion** — the `motion` utility (`isReducedMotion`/`motionDuration`/`motionScale`) governs every tween in the app: durations shorten (~40%), amplitudes soften, the celebration simplifies (6 rays, no confetti), press feedback is disabled, and gameplay stays fully functional under `prefers-reduced-motion`.

## PWA Release Readiness

Production builds generate `dist/manifest.webmanifest` and an auto-updating service worker. The service worker precaches the bundled game assets, PWA icon, and `/audio/bgm.mp3` so the installed app can launch and play offline after its first online load.

Run the release checks with `pnpm run build` followed by `node scripts/validate-pwa.js`. Use an HTTPS private static host or tunnel for phone/tablet installation, offline, and update testing; `http://localhost` is suitable only for same-device smoke tests.

## Docker Deployment

The production image builds the Vite app in a Node stage and serves the generated `dist/` files with Nginx:

```bash
docker build -t aby-little-lab .
docker run --rm -p 8080:80 aby-little-lab
```

Open `http://localhost:8080` for a local smoke test. For production PWA installation and offline testing, terminate TLS at your hosting provider or reverse proxy and serve the container over HTTPS.

## Documentation

- [PRD.md](docs/PRD.md) - Product Requirements Document
- [TDD.md](docs/TDD.md) - Technical Design Document
- [device-testing-checklist.md](docs/device-testing-checklist.md) - HTTPS device and offline validation checklist
- [release-checklist.md](docs/release-checklist.md) - Production build, PWA, deployment, and rollback checklist

## License

Private project.
