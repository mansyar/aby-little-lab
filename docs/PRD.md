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

### GAME 2 — Animal Trace-and-Connect (Fine Motor Precision) ✅ Implemented

- **Milestone:** Pre-writing motor coordination and line tracing control.
- **Mechanics:** 3 of 4 animal-food pairs randomly selected per playthrough (Fisher-Yates shuffle). Animal sprite sits on the left; its food sprite sits on the right. A thick dotted curve connects them, generated programmatically at runtime. Child traces the path with a finger to move the animal toward the food. Lifting the finger or straying pauses the animal (no reset, no penalty); resuming continues from the same position. A progress indicator (3 dots) shows completed paths.
- **Animal-Food Pairs:** Monkey → Banana, Rabbit → Carrot, Cat → Fish, Dog → Bone.
- **SVG Requirements:** `monkey.svg`, `rabbit.svg`, `cat.svg`, `dog.svg` (animals, `assets/svg/animals/`); `banana.svg`, `carrot.svg`, `fish.svg`, `bone.svg` (food, `assets/svg/items/`); `sticker_animal_trace.svg`. Dotted path is generated at runtime via `Phaser.Curves.Path` + Graphics — not a static SVG.
- **Phaser Engine Logic:** Defines a `Phaser.Curves.Path` per pair (gentle multi-point curve). On `pointermove` while pointer is down, checks pointer proximity to next path waypoint (generous 60px tolerance). Advances animal sprite along path on valid touch. Finger lift/stray pauses at current position; resume continues from same spot. Reaching food triggers completion chime + soft particle burst. All 3 paths traced → win animation + sticker award (first time only) + auto-return to Hub after 3s.
- **Game Logic:** Pure functions in `src/game/animalTraceLogic.ts` (pair selection/shuffle, path progress tracking, completion detection, waypoint generation) — testable without Phaser.
- **Accessibility:** Particle counts reduced when `prefers-reduced-motion` is active. No-fail design (no penalties for deviation/lift).

### GAME 3 — Pop & Freeze! (Reflexes & Inhibitory Control) ✅ Implemented

- **Milestone:** Visual reaction time and impulse control (Stop-and-Go processing).
- **Mechanics:** 5 bubbles float around the screen concurrently via Arcade Physics with world-bounds bouncing. 1–2 of these are "sleeping-animal" decoy bubbles (containing a sleeping animal inside). The child pops standard bubbles by tapping them. Tapping a sleeping-animal bubble triggers a gentle wobble and wake-up sound with **no penalty** — the bubble remains on screen. The round is won after **6 pops**. Popped bubbles respawn to maintain the concurrent count (with 1–2 sleeping maintained).
- **SVG Requirements:** `bubble.svg` (512×512, translucent round bubble with highlight, storybook style). Reuses the 4 existing animal SVGs (`monkey.svg`, `rabbit.svg`, `cat.svg`, `dog.svg` from Game 2) as sleeping-animal content inside bubbles — no new animal art. Sticker: `sticker_pop_freeze.svg`.
- **Phaser Engine Logic:** Arcade Physics images with random velocity (30–80 px/s gentle drift) and world-bounds bounce (`setCollideWorldBounds` + `setBounce(1, 1)`). `pointerdown` triggers pop (shrink animation + synthesized pop SFX + particle burst + respawn) or wake (wobble animation + synthesized wake SFX, no penalty). Completion triggers win animation + sticker award (first time only) + auto-return to Hub after 3s.
- **Game Logic:** Pure functions in `src/game/popFreezeLogic.ts` (round state, Fisher-Yates shuffle, bubble type selection maintaining 1–2 sleeping, spawn config generation with on-screen position clamping, pop registration with win detection, wake registration with no penalty) — testable without Phaser.
- **Accessibility:** Particle counts reduced when `prefers-reduced-motion` is active. Touch targets at 96×96px (exceeds 64px minimum). No-fail design (no penalties for waking sleeping animals).

### GAME 4 — Shadow Match (Visual Discrimination & Spatial Awareness) ✅ Implemented

- **Milestone:** Differentiating forms and visual outlines independent of color.
- **Mechanics:** 6 dark silhouette SVG shadows sit in a row at the top of the screen. 6 full-color SVG objects lie below (positions shuffled independently per playthrough). Child drags each colored object onto its matching dark silhouette. Match all 6 to win.
- **Object Set:** House, Tree, Car, Boat, Ball, Umbrella — 6 maximally distinct outline shapes satisfying color-independent accessibility.
- **SVG Requirements:** 6 object SVGs in `assets/svg/items/` (`house.svg`, `tree.svg`, `car.svg`, `boat.svg`, `ball.svg`, `umbrella.svg`) — 512×512px, flat fills, thick `#2D3748` outlines 4–6px, soft/vibrant palette. 6 shadow silhouette SVGs in `assets/svg/shadows/` (`shadow_house.svg`, `shadow_tree.svg`, `shadow_car.svg`, `shadow_boat.svg`, `shadow_ball.svg`, `shadow_umbrella.svg`) — derived by duplicating each object's paths, unioning fills, setting color to `#2D3748`. Sticker: `sticker_shadow_match.svg`.
- **Phaser Engine Logic:** Reuses Shape Sorter's drag/drop architecture (Phaser Pointer Drag + Zone detection). On correct drop: snaps object to silhouette center, plays synthesized correct SFX + particle burst, marks object as matched (locked in place). On incorrect drop: gentle bounce-back to origin + synthesized incorrect SFX, no penalty. Dropping on empty space bounces back silently (no incorrect SFX). Completion triggers win animation + sticker award (first time only) + auto-return to Hub after 3s.
- **Accessibility:** Silhouettes differ by outline shape, not just darkness (color-independent design). Particle counts reduced when `prefers-reduced-motion` is active. No-fail design (no penalties for mismatches).
- **Game Logic:** Pure functions in `src/game/shadowMatchLogic.ts` (Fisher-Yates shuffle, independent object/shadow position generation, match detection, win detection) — testable without Phaser.

### GAME 5 — Musical Memory Simon (Working Memory & Auditory Recall) ✅ Implemented

- **Milestone:** Sequential direction following and audio pattern retention.
- **Mechanics:** 3 colorful SVG frogs on lily pads emit distinct musical notes (C4, E4, G4) and scale up in sequence. Child repeats the sequence. Each successful round adds one note, starting at 2 notes and winning at length 6 (5 rounds). A replay button lets the child re-listen to the current sequence on demand.
- **SVG Requirements:** `frog_green.svg`, `frog_blue.svg`, `frog_red.svg`, `lilypad.svg` (512×512px, flat fills, thick `#2D3748` outlines 4–6px, storybook style). Sticker: `sticker_musical_memory.svg`.
- **Phaser Engine Logic:** Sequence stored in a typed array (`number[]`). Sequence auto-plays at round start with each frog scaling up + playing its note (input locked during playback, unlocked after). Evaluates user tap order against array indices. On wrong tap: plays a gentle incorrect tone, re-plays the sequence, and retries the same round (no-fail, no progress lost). On round success: fills a progress dot (5 dots total), grows the sequence by 1, and auto-plays the next round. Completion at length 6 triggers win animation + sticker award (first time only) + auto-return to Hub after 3s. Input is locked during the win celebration. Parental lock (hold 3s) exits to Hub at any time.
- **Accessibility:** Frogs distinguished by color AND position AND note (not color-only). Gentle bounce animations (200–500ms). No-fail design (no penalties for wrong taps).
- **Game Logic:** Pure functions in `src/game/musicalMemoryLogic.ts` (sequence generation, note appending, input validation, round completion, win detection) — testable without Phaser.

### GAME 6 — Big vs. Small Cleaner (Scale & Quantitative Reasoning) ✅ Implemented

- **Milestone:** Categorizing spatial size concepts ("Big" vs "Small").
- **Mechanics:** 3 of 4 toy types randomly selected per playthrough (Fisher-Yates shuffle). Each selected toy type spawns at two scales: big (1.5×) and small (0.7×), yielding 6 toys per round. Two toy box containers sit at the top of the screen — one rendered at 1.5× scale ("BIG" box) and one at 0.7× scale ("SMALL" box). Child drags each toy into the box whose scale category matches the toy's. Match all 6 to win.
- **Toy Set:** Teddy Bear, Toy Car, Toy Ball, Toy Block — 4 toy types with maximally distinct silhouettes.
- **SVG Requirements:** `teddy_bear.svg`, `toy_car.svg`, `toy_ball.svg`, `toy_block.svg` (512×512px, flat fills, thick `#2D3748` outlines 4–6px, storybook style, in `assets/svg/toys/`). `toy_box.svg` (512×512px, open container, rendered at both 1.5× and 0.7× scales — the box itself teaches the size concept). Sticker: `sticker_big_small.svg` (big orange ball + small purple ball on cream circle background).
- **Toy Colors:** Teddy Bear golden brown (`#D69E2E`), Toy Car coral (`#FC8181`), Toy Ball teal (`#4FD1C5`), Toy Block purple (`#9F7AEA`) — all soft/vibrant non-primary.
- **Phaser Engine Logic:** Reuses Shape Sorter / Shadow Match's drag/drop architecture (Phaser Pointer Drag + Zone detection). Each toy image is created at `TOY_BASE_SIZE × toy.scale` (96px base × 1.5 = 144px for big, 96px × 0.7 = 67px for small — exceeding the 64px minimum touch target). Box zones use `DROP_ZONE_SIZE = 160px`. On correct drop: snaps toy to box center, plays synthesized correct SFX + particle burst, marks toy as sorted (locked in place via `disableInteractive`). On incorrect drop: gentle bounce-back to origin via `Back.out` tween + synthesized incorrect SFX, no penalty. Dropping on empty space bounces back silently. Completion triggers win animation (all toys pulse scale) + sticker award (first time only) + auto-return to Hub after 3s.
- **Accessibility:** Big toys (144px) and small toys (67px) both exceed the 64px minimum touch target. Size categories are visually distinct (1.5× vs 0.7× ratio). Particle counts reduced when `prefers-reduced-motion` is active. No-fail design (no penalties for mismatches).
- **Game Logic:** Pure functions in `src/game/bigSmallLogic.ts` (Fisher-Yates shuffle, toy type selection, toy instance creation with dual scales, box creation, round generation with independent toy shuffling, scale-category match detection, win detection) — testable without Phaser.

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
    │  Load & rasterize SVG assets (Game 1 shapes + sticker, Game 2
    │  animals/food + sticker, Game 3 bubble + sticker, Game 4 objects/
    │  shadows + sticker, Game 5 frogs + lily pad + sticker, Game 6
    │  toys/box + sticker — all 6 games' assets loaded)
    │
    ▼
[HubScene]
    │
    ├── Display 6 game tiles (grid)
    ├── Display sticker book (earned stickers)
    ├── Hold Settings for 3s ──────► [Settings modal]
    │                                 ├── Toggle persisted BGM/SFX settings
    │                                 └── Tap backdrop to return to Hub
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
```

### Navigation Rules

- **BootScene → PreloadScene → HubScene:** BootScene locks landscape orientation and initializes systems, then transitions to PreloadScene which displays a progress bar before transitioning to HubScene.
- **HubScene → GameScene:** Tap on a game tile. Instant transition.
- **GameScene → HubScene:** Auto-return after game completion (3s delay with win animation) OR parental lock (hold 3s).
- **HubScene → Settings modal:** Holding Settings for 3 seconds opens the parental modal. Parents can independently toggle BGM and SFX; toggles persist in localStorage. Tapping the dark backdrop closes the modal and returns to the Hub.
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
| `--orange` | `#F6AD55` | Game 1 (circle shape), Game 6 (toy box, teddy inner ears/muzzle, toy ball center, sticker big ball) |
| `--teal` | `#4FD1C5` | Game 1 (triangle shape), Game 6 (toy ball) |
| `--purple` | `#9F7AEA` | Game 1 (square shape), Game 6 (toy block, sticker small ball) |
| `--pink` | `#F687B3` | Game 1 (star shape) |
| `--green` | `#48BB78` | Game 5 (green frog → C4) |
| `--blue` | `#3182CE` | Game 5 (blue frog → E4) |
| `--red` | `#E53E3E` | Game 5 (red frog → G4) |
| `--coral` | `#FC8181` | Game 6 (toy car) |
| `--golden-brown` | `#D69E2E` | Game 6 (teddy bear body) |
| `--yellow` | `#ECC94B` | Game 6 (toy box opening, toy block star) |

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
| Bubble pop | Bright percussive blip (800 Hz, 0.08s) | Web Audio API (synthesized) | Game 3 |
| Sleeping animal tapped | Soft rousing tone (E4 + A4 dual oscillator) | Web Audio API (synthesized) | Game 3 |
| Game complete | Win fanfare (4-note arpeggio: C5, E5, G5, C6) | Web Audio API (synthesized) | All games |
| Sticker earned | Sparkle (2-note: C6, E6) | Web Audio API (synthesized) | All games (first completion) |

> **Note:** Gameplay SFX (correct, incorrect, win, sticker) are **synthesized via Web Audio API** — no MP3 files needed for these. This was decided during the Shape Sorter track to reduce asset overhead. Game 3's pop and wake sounds are also synthesized. MP3 SFX files remain only for generic UI tap sounds.

### Synthesized Audio (Web Audio API)

| Note / Tone | Frequency | Used In |
|---|---|---|
| C4 | 261.63 Hz | Game 5 (green frog) |
| E4 | 329.63 Hz | Game 5 (blue frog), Game 3 (wake tone, dual oscillator with A4) |
| G4 | 392.00 Hz | Game 5 (red frog) |
| A4 | 440.00 Hz | Game 3 (wake tone, dual oscillator with E4) |
| 800 Hz | 800.00 Hz | Game 3 (bubble pop — short percussive blip, 0.08s) |
| C5, E5, G5 | 523.25, 659.25, 783.99 Hz | Gameplay SFX — correct (ascending chime) |
| G4, C4 | 392.00, 261.63 Hz | Gameplay SFX — incorrect (soft descending) |
| C5, E5, G5, C6 | 523.25, 659.25, 783.99, 1046.5 Hz | Gameplay SFX — win (celebratory arpeggio) |
| C6, E6 | 1046.5, 1318.51 Hz | Gameplay SFX — sticker (sparkle) |

Game 5 frog notes, gameplay feedback SFX (correct, incorrect, win, sticker), and Game 3 pop/wake sounds are all synthesized via Web Audio API oscillators — no audio files needed for these. The AudioManager exposes these as `playPop()`, `playWake()`, `playCorrect()`, `playIncorrect()`, `playWin()`, and `playSticker()` methods, all respecting the SFX toggle setting.

### Background Music (BGM)

| File | Usage |
|---|---|
| `bgm.mp3` | Single gentle ambient loop, played at low volume across all scenes |

- BGM starts in BootScene and loops continuously.
- BGM can be toggled on/off via parental settings (persisted in localStorage).
- SFX can also be toggled independently.
- The settings modal plays the synthesized correct chime when SFX is enabled. `bgm.mp3` is not yet supplied, so the BGM control persists and updates AudioManager state while playback awaits the asset.

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
