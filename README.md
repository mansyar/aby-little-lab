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

Coverage thresholds are set to 80% for lines, functions, branches, and statements.

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
src/
├── main.ts                # Phaser game config & scene register
├── scenes/                # BootScene, PreloadScene, HubScene, 6 game scenes
├── components/            # ParentLock (hold-for-3s escape)
├── audio/                 # AudioManager (BGM/SFX + frog note synthesis)
├── types/                 # Shared interfaces (GameId, StickerData, Settings, AppStorage)
├── utils/                 # localStorage CRUD (storage.ts)
├── assets/                # SVG and audio assets
├── styles/                # Global CSS
└── __tests__/             # Unit tests (audio, components, scenes, utils)
```

## Mini-Games

| # | Game | Milestone |
|---|---|---|
| 1 | Shape Sorter | Cognitive reasoning & categorization |
| 2 | Animal Trace-and-Connect | Fine motor precision & pre-writing |
| 3 | Pop & Freeze! | Reflexes & inhibitory control |
| 4 | Shadow Match | Visual discrimination & spatial awareness |
| 5 | Musical Memory Simon | Working memory & auditory recall |
| 6 | Big vs. Small Cleaner | Scale & quantitative reasoning |

## Documentation

- [PRD.md](docs/PRD.md) - Product Requirements Document
- [TDD.md](docs/TDD.md) - Technical Design Document

## License

Private project.
