# Product Requirement Document (PRD)

| Field | Value |
|---|---|
| **Project Name** | Aby's Little Lab |
| **Target Audience** | Preschoolers (Age 3–5 / 36–60 Months) |
| **Platform** | PWA / Mobile Web (Tablet & Phone) |
| **Tech Stack** | Phaser 4, TypeScript 7, Vite 8, HTML5, Web Audio API |
| **Visual Pipeline** | AI-Generated SVG (Vector Native) |
| **Distribution** | Local Sideload / Private PWA |

---

## 1. Executive Summary & Core Objectives

This document defines the production requirements for an ad-free, distraction-free developmental game suite tailored for 3–5 year-old preschoolers. The app packages **6 distinct mini-games** into a single lightweight web app targeting fundamental cognitive, motor, and reasoning benchmarks.

**Key Strategic Pivot:** To ensure maximum crispness across high-DPI retina displays (iPads, Android tablets, and phones) without large asset file sizes, all graphical assets are built using an **AI-Generated SVG Pipeline**. Phaser 4 rasterizes these scalable vectors dynamically at load time into crisp bitmaps, matching exact target display resolutions.

### UX & Touch Architecture Requirements

- **Touch-First Ergonomics:** Touch targets are strictly set to a minimum of 64×64px (ideally 96×96px) with inflated collision bounds to prevent toddler fine-motor frustration.
- **Textless Visual Cues:** Zero text dependency for gameplay. All prompts rely on visual animations, color coding, spatial affordances, and audio chime feedback.
- **Interface Containment:** Embedded "Hold for 3 Seconds" parental lock to prevent accidental menu navigation or app exits during active play.
- **Responsive Scale:** Phaser Scale Manager enforces a locked 1024×768 landscape base resolution with dynamic centered letterboxing (`Phaser.Scale.FIT`). Phones auto-rotate to landscape on launch via the Screen Orientation API + manifest `orientation: landscape` lock.

---

## 2. AI-Generated SVG Visual Asset Pipeline

### SVG Vector Generation Workflow

1. **Generation:** Produce raw vector assets using any AI SVG generator or hand-crafted vectors. The output must be clean, single-layer SVGs with simple paths.
2. **ViewBox Standardization:** Clean SVGs to remove redundant metadata, enforce tight bounding boxes (zero excess canvas), and eliminate complex filters that break browser rasterization.
3. **Shadow Asset Derivation:** For Game 4 (Shadow Match), duplicate primary colored SVG paths, unify union fills, and set color to dark flat slate `#2D3748`.
4. **Resolution-Aware Preloading:** Pass width/height parameters into Phaser's SVG loader to force high-res rasterization at boot:

```typescript
this.load.svg('bear_sprite', 'assets/svg/bear.svg', { width: 512, height: 512 });
```

### Standardized Prompt Engineering Matrix

> **Note:** Game 1 (Shape Sorter) SVGs are currently **hand-authored** flat vectors (4 shapes + 4 cutout slots + 1 sticker), not AI-generated. The AI generation pipeline will be adopted for subsequent games.

| Asset Type | Target Mini-Game | Recommended AI Generation Prompt |
|---|---|---|
| Geometric Shapes | Game 1 (Shape Sorter) | "Flat vector icon of simple geometric [shape], vibrant soft non-primary color, thick dark stroke outline, flat design, white background, no gradients --no 3d, shading" |
| Character Sprites | Game 2 & Game 5 | "Cute flat cartoon [animal], friendly expression, simple smooth curves, thick outline, storybook illustration vector, white background --no complex textures" |
| Object Items | Game 4 & Game 6 | "Flat vector toy [item], bright toddler colors, simple silhouette shape, clean paths, isolated on white background" |
| UI Elements | Global Hub / Frames | "Vector UI wooden tray frame, rounded corners, flat cartoon style, clean outline, toy aesthetic" |

---

## 3. Comprehensive Mini-Game Specifications

### Cross-Game Systems

- **Sticker Collection:** Each mini-game awards a unique themed sticker on completion. Stickers accumulate in a sticker book displayed on the HubScene. Earned stickers persist across sessions via localStorage.
- **Replay Variety:** Each playthrough randomly shuffles which shapes, items, or animals appear, but difficulty stays fixed across replays.
- **Feedback:** Correct actions trigger a pleasant chime + particle burst. Incorrect actions give a gentle "try again" animation with no penalty.

### GAME 1 — Shape Sorter (Cognitive Reasoning & Categorization) ✅ Implemented

- **Milestone:** Matching and sorting geometric shapes (Circle, Square, Triangle, Star).
- **Mechanics:** 3 of 4 shapes randomly selected per playthrough. 3 cut-out SVG slot frames sit at the top. 3 colored SVG shapes spawn at bottom (positions shuffled independently). Player drags shape to matching slot.
- **SVG Requirements:** `shape_circle.svg`, `shape_square.svg`, `shape_triangle.svg`, `shape_star.svg` (512×512px, hand-authored flat vectors). Cutouts: `cutout_*.svg` (same paths, 30% opacity fill + dashed `#2D3748` stroke). Sticker: `sticker_shape_sorter.svg`.
- **Shape Colors:** Circle `#F6AD55` (orange), Square `#9F7AEA` (purple), Triangle `#4FD1C5` (teal), Star `#F687B3` (pink) — all soft/vibrant non-primary, color-independent design.
- **Phaser Engine Logic:** Uses Phaser Pointer Drag and Zone detection (`this.add.zone()`). Snaps to center on correct drop with synthesized chime + particle burst. Incorrect drops bounce back with gentle wobble (no penalty). Completion triggers win animation + sticker award (first time only) + auto-return to Hub after 3s.
- **Accessibility:** Particle counts reduced when `prefers-reduced-motion` is active.
- **Game Logic:** Pure functions in `src/game/shapeSorterLogic.ts` (Fisher-Yates shuffle, match detection, shape selection).

### GAME 2 — Animal Trace-and-Connect (Fine Motor Precision)

- **Milestone:** Pre-writing motor coordination and line tracing control.
- **Mechanics:** A cute SVG animal sprite sits on the left; its food SVG sits on the right. A thick dotted curve connects them. Child traces path to move animal.
- **SVG Requirements:** `monkey.svg`, `banana.svg`, `dotted_path.svg`.
- **Phaser Engine Logic:** Defines `Phaser.Curves.Path`. Checks pointer proximity on `pointermove`. Progresses animal sprite along path index on valid touch.

### GAME 3 — Pop & Freeze! (Reflexes & Inhibitory Control)

- **Milestone:** Visual reaction time and impulse control (Stop-and-Go processing).
- **Mechanics:** SVG bubbles float upward. Tapping standard bubbles pops them. Glowing "Sleeping Animal" bubbles float up — letting them pass grants bonus stars; tapping wakes them up with funny sound.
- **SVG Requirements:** `bubble_soap.svg`, `bubble_sleeping_cat.svg`, `pop_particle.svg`.
- **Phaser Engine Logic:** Arcade Physics Group with negative Y velocity. `pointerdown` event triggers sprite destroy and SFX.

### GAME 4 — Shadow Match (Visual Discrimination & Spatial Awareness)

- **Milestone:** Differentiating forms and visual outlines independent of color.
- **Mechanics:** 3 dark silhouette SVG shadows sit on a shelf. 3 full-color SVG objects lie below. Child matches colored item to shadow.
- **SVG Requirements:** `car_color.svg`, `car_shadow.svg`, `duck_color.svg`, `duck_shadow.svg`, `apple_color.svg`, `apple_shadow.svg`.
- **Phaser Engine Logic:** Reuses drag/drop architecture, verifying asset keys on drop zone overlap (`itemKey === shadowKey`).

### GAME 5 — Musical Memory Simon (Working Memory & Auditory Recall)

- **Milestone:** Sequential direction following and audio pattern retention.
- **Mechanics:** 3 colorful SVG frogs on lily pads emit distinct musical notes (C4, E4, G4) and scale up in sequence. Child repeats the sequence. Each successful round adds one note, starting at 2 notes.
- **SVG Requirements:** `frog_green.svg`, `frog_blue.svg`, `frog_red.svg`, `lilypad.svg`.
- **Phaser Engine Logic:** Sequence stored in a typed array (`number[]`). Input locked during play. Evaluates user tap order against array indices. Sequence grows by 1 per successful round.

### GAME 6 — Big vs. Small Cleaner (Scale & Quantitative Reasoning)

- **Milestone:** Categorizing spatial size concepts ("Big" vs "Small").
- **Mechanics:** Two toy box SVG containers sit on screen (1.5× scale "BIG" box, 0.7× scale "SMALL" box). Scattered toys must be sorted into respective boxes.
- **SVG Requirements:** `toy_box.svg`, `teddy_bear.svg`, `toy_car.svg` (rendered at dual scales).
- **Phaser Engine Logic:** Drag target evaluation checks `sprite.scaleCategory === box.scaleCategory`.

---

## 5. Game Flow & Navigation

### Scene State Machine

```
[BootScene]
    │
    │  Lock landscape orientation
    │  Initialize audio & storage systems
    │
    ▼
[PreloadScene]
    │
    │  Show progress bar
    │  Load & rasterize SVG assets (Game 1 shapes + sticker loaded;
    │  remaining games' assets loaded as tracks complete)
    │
    ▼
[HubScene]
    │
    ├── Display 6 game tiles (grid)
    ├── Display sticker book (earned stickers)
    ├── Display settings (BGM/SFX toggle, behind parental lock)
    │
    ├── Tap game tile ──────────────────► [Game Scene]
    │                                        │
    │                                        ├── Initialize with randomized items
    │                                        ├── Gameplay loop
    │                                        │
    │                                        ├── On correct completion:
    │                                        │     ├── Win animation + SFX
    │                                        │     ├── Award sticker (if first time)
    │                                        │     └── Auto-return to Hub (3s delay)
    │                                        │
    │                                        └── Hold 3s (parental lock) ──► [HubScene]
    │                                                │
    ◄────────────────────────────────────────────────┘
    │
    └── Hold 3s (parental lock) ──► Exit app
```

### Navigation Rules

- **BootScene → PreloadScene → HubScene:** BootScene locks landscape orientation and initializes systems, then transitions to PreloadScene which displays a progress bar before transitioning to HubScene.
- **HubScene → GameScene:** Tap on a game tile. Instant transition.
- **GameScene → HubScene:** Auto-return after game completion (3s delay with win animation) OR parental lock (hold 3s).
- **HubScene → Exit:** Parental lock (hold 3s) required. Prevents accidental app exit.
- **Sticker Award:** On first completion of a game, a sticker unlock animation plays before returning to Hub. Subsequent completions skip the sticker animation.

---

## 6. Color Palette & Design Tokens

### Core Palette

| Token | Hex | Usage |
|---|---|---|
| `--bg-base` | `#FAF9F6` | App background, game background (warm off-white) |
| `--bg-hub` | `#FFF8E7` | Hub scene background (warm cream) |
| `--primary` | `#2B6CB0` | Theme color, UI accents, manifest theme_color |
| `--outline` | `#2D3748` | Thick stroke outlines on all SVGs, shadow asset fill |
| `--success` | `#68D391` | Correct action feedback (chime + particle color) |
| `--error` | `#FC8181` | Incorrect action feedback (gentle, non-threatening) |

### Game Sprite Colors

| Token | Hex | Used In |
|---|---|---|
| `--orange` | `#F6AD55` | Game 1 (circle shape), Game 6 (items) |
| `--teal` | `#4FD1C5` | Game 1 (triangle shape) |
| `--purple` | `#9F7AEA` | Game 1 (square shape), Game 6 (items) |
| `--pink` | `#F687B3` | Game 1 (star shape) |
| `--green` | `#48BB78` | Game 5 (green frog → C4) |
| `--blue` | `#3182CE` | Game 5 (blue frog → E4) |
| `--red` | `#E53E3E` | Game 5 (red frog → G4) |
| `--yellow` | `#F6AD55` | Game 6 (items) |

### Design Rules

- All SVG sprites use a thick dark stroke (`--outline`, 4–6px equivalent at 512px base).
- Backgrounds use flat fills, no gradients.
- Feedback animations use `--success` (green) and `--error` (soft red) particle bursts.
- All colors are soft/vibrant — no neon, no pure RGB primaries.

---

## 7. Audio Design Specification

### Sound Effects (SFX)

| Event | Sound | Source | Used In |
|---|---|---|---|
| Generic tap | Soft pop | `sfx_pop.mp3` | All games (UI taps) |
| Correct match | Ascending chime (3-note: C5, E5, G5) | Web Audio API (synthesized) | Games 1, 2, 4, 6 |
| Incorrect match | Soft descending tone (G4 → C4) | Web Audio API (synthesized) | Games 1, 4, 6 |
| Bubble pop | Bright pop | `sfx_pop.mp3` | Game 3 |
| Sleeping animal tapped | Funny wake-up sound | `sfx_wake.mp3` | Game 3 |
| Game complete | Win fanfare (4-note arpeggio: C5, E5, G5, C6) | Web Audio API (synthesized) | All games |
| Sticker earned | Sparkle (2-note: C6, E6) | Web Audio API (synthesized) | All games (first completion) |

> **Note:** Gameplay SFX (correct, incorrect, win, sticker) are **synthesized via Web Audio API** — no MP3 files needed for these. This was decided during the Shape Sorter track to reduce asset overhead. MP3 SFX files remain for pop and wake sounds.

### Synthesized Audio (Web Audio API)

| Note / Tone | Frequency | Used In |
|---|---|---|
| C4 | 261.63 Hz | Game 5 (green frog) |
| E4 | 329.63 Hz | Game 5 (blue frog) |
| G4 | 392.00 Hz | Game 5 (red frog) |
| C5, E5, G5 | 523.25, 659.25, 783.99 Hz | Gameplay SFX — correct (ascending chime) |
| G4, C4 | 392.00, 261.63 Hz | Gameplay SFX — incorrect (soft descending) |
| C5, E5, G5, C6 | 523.25, 659.25, 783.99, 1046.5 Hz | Gameplay SFX — win (celebratory arpeggio) |
| C6, E6 | 1046.5, 1318.51 Hz | Gameplay SFX — sticker (sparkle) |

Game 5 frog notes and gameplay feedback SFX (correct, incorrect, win, sticker) are synthesized via Web Audio API oscillators — no audio files needed for these. The AudioManager exposes these as `playCorrect()`, `playIncorrect()`, `playWin()`, and `playSticker()` methods, all respecting the SFX toggle setting.

### Background Music (BGM)

| File | Usage |
|---|---|
| `bgm.mp3` | Single gentle ambient loop, played at low volume across all scenes |

- BGM starts in BootScene and loops continuously.
- BGM can be toggled on/off via parental settings (persisted in localStorage).
- SFX can also be toggled independently.

### Audio Format

- All audio files: **MP3** for broad device compatibility.
- Synthesized tones: **Web Audio API** (no file overhead).

---

## 8. Performance Targets

| Metric | Target | Rationale |
|---|---|---|
| Frame rate | 60fps (min 30fps on low-end phones) | Smooth animations for toddler engagement |
| Boot/load time | < 3 seconds (mid-range tablet) | Prevent attention loss during loading |
| Memory usage | < 150MB total | SVG rasterization at 512×512 is lightweight; keep buffer for audio |
| Offline capability | Full gameplay after first PWA install | vite-plugin-pwa precaches all build assets |
| Touch input latency | < 16ms (1 frame) | Immediate feedback for fine-motor activities |
| Audio latency | < 50ms | Synchronized SFX with visual feedback |

---

## See Also

- [TDD.md](./TDD.md) — Technical Design Document (tech stack details, directory structure, PWA/Phaser configuration, localStorage schema, full asset manifest)
