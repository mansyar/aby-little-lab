# Aby's Little Lab

An ad-free, distraction-free developmental game suite for preschoolers aged 3-5. Seven mini-games targeting cognitive, motor, and reasoning milestones, built with Phaser 4 + TypeScript + Vite as an installable PWA.

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

Coverage thresholds are set to 80% for lines, functions, branches, and statements. Current state: **592 tests across 18 files**, ~98.0% statement coverage (all shared motion/feedback/storage/transition utilities at 100%).

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
├── scenes/                # BootScene, PreloadScene, HubScene, 7 game scenes
├── components/            # ParentLock and SettingsPanel parental modal, Mascot (Professor Hoot, tween-only reactions)
├── audio/                 # AudioManager (BGM/SFX + frog note & gameplay SFX synthesis)
├── game/                  # Pure game logic (shapeSorterLogic, animalTraceLogic, popFreezeLogic, shadowMatchLogic, musicalMemoryLogic, bigSmallLogic, patternBuilderLogic: shuffle, match detection, path progress, bubble spawning, round generation, sequence memory, scale sorting, pattern building)
├── types/                 # Shared interfaces (GameId, StickerData, Settings, AppStorage)
├── utils/                 # Motion & feedback (motion, sceneTransitions, completionEffect, pressFeedback, dragJuice) + localStorage CRUD (storage.ts)
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

**Replay variety** — all content-driven games draw from expanded, shuffled item pools each playthrough (Shape Sorter: 6 shapes; Animal Trace: 6 animal-food pairs; Shadow Match: 6 of 8 objects with matching silhouettes; Big vs. Small: 6 toys; Pop & Freeze: 6 sleeping-animal decoys), with round sizes and difficulty fixed.

## Parental Lock & Touch UX

Settings access (Hub **Settings**) and app exit (each game's **← Back**) are gated by a **hold-for-3-seconds** parental lock:

- A circular progress ring (green fill, 48px radius) shows the hold filling from 12 o'clock.
- Only **one hold runs at a time** — duplicate touches during a hold are ignored, and the action fires exactly once.
- Early release, pointer leaving the control, or pointer cancel **never** triggers the action.
- The ring is cleared on release, cancel, and scene shutdown — no leftover display objects.

The protected controls (Hub Settings, all seven game Back buttons, and the Musical Memory **Replay** control) expose explicit **96×96px hit areas** anchored to their display bounds, so children can tap near the visible label without precision aiming. Phaser hit areas are anchored at the top-left of a control's bounds, not its origin — keep `Rectangle(0, 0, 96, 96)` even for right-aligned or centered controls.

The Settings modal provides independently persisted BGM and SFX toggles with 96px touch targets; tapping outside the panel closes it. Enabling SFX plays a short confirmation chime. BGM playback begins after eligible user interaction and uses the packaged `/audio/bgm.mp3` loop.

## Motion & Feedback

All animation is driven by a shared motion system (`src/utils/`):

- **Scene transitions** — every navigation path (boot → hub, hub ↔ game, completion returns) plays a 300ms crossfade to the app background, then a 180ms fade-in with a subtle entrance zoom.
- **Win celebration** — all seven games share one choreographed completion effect: 10 rays + 10 drifting confetti bits (~700ms) that clean themselves up and never block the next interaction.
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

## Hub Experience

The Hub is the child's landing screen, built for gentle, playful engagement:

- **Staggered entrance** — tiles, labels, and stickers wave in one-by-one (40ms apart, 300ms `Sine.out` fade + scale-up). Under reduced motion, entrances fade only.
- **Idle float** — tiles gently bob on a 2.5s sine loop with a phase offset, and four low-contrast dots drift slowly behind the grid (both skipped under reduced motion).
- **Sticker shelf** — each game's real SVG sticker thumbnail (56px) sits under its tile: earned stickers shimmer (800ms alpha loop), unearned ones are dimmed (30% alpha, 85% scale) so the collection goal stays visible, and a just-earned sticker bounces in larger (`Back.out` to 1.15×) with a sparkle burst. Game scenes pass `{ justEarned: <gameId> }` on auto-return when a sticker is earned that session.
- **Idle attract** — after ~25s without input, tiles wiggle gently (4° rotation wobble) and a soft two-tone chime (`AudioManager.playIdleCall()`) plays, repeating every ~10s while idle. Any pointer input resets the timer; reduced motion plays the chime without the wiggle.

## Professor Hoot Mascot

Professor Hoot — a round owl in a tiny lab coat — is the app's friendly teacher mascot, rendered from two static SVG poses (`mascot_idle.svg`, `mascot_celebrate.svg`) with tween-only animation (no sprite sheets, no particle emitters, no new audio):

- **Hub** — Hoot sits in the bottom-right corner (0.2× scale, touch-inert, behind gameplay z-order): waves on load, cheers when the visit follows a newly earned sticker (`justEarned` scene data), then settles into a slow bob with a periodic squash-blink idle loop.
- **All seven games** — Hoot stands in the same corner in every game scene: cheers on a correct action (wings up + bounce + self-cleaning sparkle ring), nods gently on an incorrect action (paired with the soft incorrect SFX; Animal Trace has no nod path — it is a no-fail game), and does a bigger cheer alongside the shared win celebration. The mascot is destroyed on scene shutdown.
- **Implementation** — `src/components/Mascot.ts` (wave/cheer/nod/idleLoop + `createCornerMascot()` shared factory). Overlapping cheers retire the in-flight tween and pause the blink loop so rapid pops never stack tweens. Reactions reuse the existing SFX (`playCorrect`/`playIncorrect`/`playWin`/`playSticker`) — no new audio files.
- **Reduced motion** — the idle loop is disabled and reactions become minimal (gentle wave/nod, pose swap without bounce or sparkle).

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

## Documentation

- [PRD.md](docs/PRD.md) - Product Requirements Document
- [TDD.md](docs/TDD.md) - Technical Design Document
- [device-testing-checklist.md](docs/device-testing-checklist.md) - HTTPS device and offline validation checklist
- [release-checklist.md](docs/release-checklist.md) - Production build, PWA, deployment, and rollback checklist

## License

Private project.
