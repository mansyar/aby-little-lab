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

- **Touch-First Ergonomics:** Touch targets are strictly set to a minimum of 64×64px (ideally 96×96px) with inflated collision bounds to prevent toddler fine-motor frustration. Protected controls (all Back buttons, Hub Settings, Musical Memory Replay) implement the 96×96px ideal with explicit hit areas anchored to their display bounds.
- **Textless Visual Cues:** Zero text dependency for gameplay. All prompts rely on visual animations, color coding, spatial affordances, and audio chime feedback.
- **Interface Containment:** Embedded "Hold for 3 Seconds" parental lock to prevent accidental menu navigation or app exits during active play. The hold shows a circular progress ring, runs one hold at a time (duplicate touches ignored), and never triggers on early release, pointer leaving the control, or pointer cancel.
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

> **Note:** Game 1 (Shape Sorter) SVGs are currently **hand-authored** flat vectors (6 shapes + 6 cutout slots + 1 sticker), not AI-generated. The AI generation pipeline will be adopted for subsequent games.

| Asset Type | Target Mini-Game | Recommended AI Generation Prompt |
|---|---|---|
| Geometric Shapes | Game 1 (Shape Sorter) | "Flat vector icon of simple geometric [shape], vibrant soft non-primary color, thick dark stroke outline, flat design, white background, no gradients --no 3d, shading" |
| Character Sprites | Game 2 & Game 5 | "Cute flat cartoon [animal], friendly expression, simple smooth curves, thick outline, storybook illustration vector, white background --no complex textures" |
| Object Items | Game 4 & Game 6 | "Flat vector toy [item], bright toddler colors, simple silhouette shape, clean paths, isolated on white background" |
| UI Elements | Global Hub / Frames | "Vector UI wooden tray frame, rounded corners, flat cartoon style, clean outline, toy aesthetic" |

---

## 3. Comprehensive Mini-Game Specifications

### Cross-Game Systems

- **Sticker Collection:** Each mini-game awards a unique themed sticker on completion. Stickers display as a shelf of real SVG thumbnails under each Hub tile: earned stickers render at full alpha with a gentle shimmer loop, unearned ones are dimmed (30% alpha, 85% scale) so the collection goal stays visible, and a just-earned sticker bounces in larger with a sparkle burst on auto-return. Earned stickers persist across sessions via localStorage.
- **Replay Variety:** Each playthrough randomly shuffles which shapes, items, or animals appear, but difficulty stays fixed across replays.
- **Feedback:** Correct actions trigger a pleasant chime + Graphics-based splash (the project uses Graphics shapes only — no `add.particles` emitters). Incorrect actions give a gentle "try again" animation with no penalty; dropping on empty space bounces back silently (no incorrect SFX).
- **Scene Transitions:** Every navigation path (boot → preload → hub, hub ↔ game, completion returns) plays a crossfade transition: 300ms fade to the app background `#FAF9F6`, then a 180ms fade-in with a subtle 1.02 zoom entrance. No instant scene switches remain.
- **Win Celebration:** All six games share one choreographed completion effect — 10 rays + 10 drifting confetti bits (~700ms, self-cleaning, `#68D391`/`#4FD1C5`/`#F687B3`/`#F6AD55`/`#9F7AEA`). Per-game bespoke win tweens were replaced by this single implementation.
- **Press Feedback:** Interactive controls (all Back buttons, Hub Settings, Musical Memory Replay) and Hub game tiles squish to 95% of their base scale while pressed and spring back on release/pointer-out/cancel; Hub tiles spring with a `Back.out` overshoot (150ms). Hub tiles navigate **on release** (release on the tile) so the squish stays visible while holding; releasing off the tile cancels navigation.
- **Reduced Motion:** One motion utility (`isReducedMotion`, `motionDuration`, `motionScale`) governs every animation. With `prefers-reduced-motion` active, durations shorten (~40%, e.g., 300→180ms, 200→120ms), amplitudes soften (e.g., 1.15×→1.05×), the celebration simplifies (6 rays, no confetti), and press feedback is disabled — gameplay remains fully functional.
- **Mascot Companion (Professor Hoot):** A friendly teacher owl mascot (two static SVG poses, tween-only animation — no sprite sheets, no particle emitters, no new audio) who lives in the bottom-right corner of the Hub and all six game scenes: waves on Hub load, cheers on a newly earned sticker, cheers on correct actions, nods on incorrect actions, and joins the win celebration with a bigger cheer. Touch-inert, rendered behind gameplay z-order, reactions reuse the shared SFX (`playCorrect`/`playIncorrect`/`playWin`/`playSticker`), and everything runs through `motion.ts` (reduced-motion: no idle loop, gentle wave/nod, pose swap without bounce or sparkle). Destroyed on scene shutdown.

### GAME 1 — Shape Sorter (Cognitive Reasoning & Categorization) ✅ Implemented

- **Milestone:** Matching and sorting geometric shapes (Circle, Square, Triangle, Star, Heart, Crescent).
- **Mechanics:** 3 of 6 shapes randomly selected per playthrough. 3 cut-out SVG slot frames sit at the top. 3 colored SVG shapes spawn at bottom (positions shuffled independently). Player drags shape to matching slot.
- **SVG Requirements:** `shape_circle.svg`, `shape_square.svg`, `shape_triangle.svg`, `shape_star.svg`, `shape_heart.svg`, `shape_crescent.svg` (512×512px, hand-authored flat vectors). Cutouts: `cutout_*.svg` (same paths, 30% opacity fill + dashed `#2D3748` stroke). Sticker: `sticker_shape_sorter.svg`.
- **Shape Colors:** Circle `#F6AD55` (orange), Square `#9F7AEA` (purple), Triangle `#4FD1C5` (teal), Star `#F687B3` (pink), Heart `#E53E3E` (red), Crescent `#ECC94B` (yellow) — all soft/vibrant non-primary, color-independent design.
- **Phaser Engine Logic:** Uses Phaser Pointer Drag and Zone detection (`this.add.zone()`). Pieces lift to 1.1× scale with a 4° tilt on drag start (1.05×, no tilt under reduced motion) and restore on release; drop zones pulse a soft outline while dragging over them. Correct drops snap to center via a 200ms `Back.out` tween (120ms reduced) with synthesized chime + Graphics splash. Incorrect drops bounce back with gentle wobble (no penalty); dropping on empty space bounces back silently (no incorrect SFX).
- **Accessibility:** All juice amplitudes/durations soften when `prefers-reduced-motion` is active.
- **Game Logic:** Pure functions in `src/game/shapeSorterLogic.ts` (Fisher-Yates shuffle, match detection, shape selection).

### GAME 2 — Animal Trace-and-Connect (Fine Motor Precision) ✅ Implemented

- **Milestone:** Pre-writing motor coordination and line tracing control.
- **Mechanics:** 3 of 6 animal-food pairs randomly selected per playthrough (Fisher-Yates shuffle). Animal sprite sits on the left; its food sprite sits on the right. A thick dotted curve connects them, generated programmatically at runtime. Child traces the path with a finger to move the animal toward the food. Lifting the finger or straying pauses the animal (no reset, no penalty); resuming continues from the same position. A progress indicator (3 dots) shows completed paths.
- **Animal-Food Pairs:** Monkey → Banana, Rabbit → Carrot, Cat → Fish, Dog → Bone, Elephant → Peanut, Pig → Apple.
- **SVG Requirements:** `monkey.svg`, `rabbit.svg`, `cat.svg`, `dog.svg`, `elephant.svg`, `pig.svg` (animals, `assets/svg/animals/`); `banana.svg`, `carrot.svg`, `fish.svg`, `bone.svg`, `peanut.svg`, `apple.svg` (food, `assets/svg/items/`); `sticker_animal_trace.svg`. Dotted path is generated at runtime via `Phaser.Curves.Path` + Graphics — not a static SVG.
- **Phaser Engine Logic:** Defines a `Phaser.Curves.Path` per pair (gentle multi-point curve). On `pointermove` while pointer is down, checks pointer proximity to next path waypoint (generous 60px tolerance). The animal hops between waypoints with a small arc tween (~120ms per hop; straight and faster under reduced motion). Finger lift/stray pauses at current position; resume continues from same spot. Reaching food triggers completion chime + Graphics splash and the food sprite wiggles (±4°, 3 yoyo repeats); the path's progress dot pops 1 → 1.4 → 1 with `Back.out` instead of alpha-only. All 3 paths traced → win animation + sticker award (first time only) + auto-return to Hub after 3s.
- **Game Logic:** Pure functions in `src/game/animalTraceLogic.ts` (pair selection/shuffle, path progress tracking, completion detection, waypoint generation) — testable without Phaser.
- **Accessibility:** Hop arcs, food wiggle, and dot pops are reduced/gentler when `prefers-reduced-motion` is active. No-fail design (no penalties for deviation/lift).

### GAME 3 — Pop & Freeze! (Reflexes & Inhibitory Control) ✅ Implemented

- **Milestone:** Visual reaction time and impulse control (Stop-and-Go processing).
- **Mechanics:** 5 bubbles float around the screen concurrently via Arcade Physics with world-bounds bouncing. 1–2 of these are "sleeping-animal" decoy bubbles (containing a sleeping animal inside). The child pops standard bubbles by tapping them. Tapping a sleeping-animal bubble triggers a gentle wobble and wake-up sound with **no penalty** — the bubble remains on screen. The round is won after **6 pops**. Popped bubbles respawn to maintain the concurrent count (with 1–2 sleeping maintained).
- **SVG Requirements:** `bubble.svg` (512×512, translucent round bubble with highlight, storybook style). Reuses the 6 existing animal SVGs (`monkey.svg`, `rabbit.svg`, `cat.svg`, `dog.svg`, `elephant.svg`, `pig.svg` from Game 2) as sleeping-animal content inside bubbles — no separate sleeping-animal art. Sticker: `sticker_pop_freeze.svg`.
- **Phaser Engine Logic:** Arcade Physics images with random velocity (30–80 px/s gentle drift) and world-bounds bounce (`setCollideWorldBounds` + `setBounce(1, 1)`). `pointerdown` triggers pop (shrink animation + synthesized pop SFX + Graphics splash + 3 teal droplet circles radiating from the pop point with a self-cleaning fade + respawn) or wake (wobble animation + synthesized wake SFX, no penalty). Sleeping-animal decoys breathe on a 1.0 → 1.03 yoyo loop (~1.5s; disabled under reduced motion). The round is won after **6 pops**. Completion triggers win animation + sticker award (first time only) + auto-return to Hub after 3s.
- **Game Logic:** Pure functions in `src/game/popFreezeLogic.ts` (round state, Fisher-Yates shuffle, bubble type selection maintaining 1–2 sleeping, spawn config generation with on-screen position clamping, pop registration with win detection, wake registration with no penalty) — testable without Phaser.
- **Accessibility:** Droplet bursts are shorter/gentler when `prefers-reduced-motion` is active, and the breathing loop is disabled entirely. Touch targets at 96×96px (exceeds 64px minimum). No-fail design (no penalties for waking sleeping animals).

### GAME 4 — Shadow Match (Visual Discrimination & Spatial Awareness) ✅ Implemented

- **Milestone:** Differentiating forms and visual outlines independent of color.
- **Mechanics:** 6 of 8 dark silhouette SVG shadows sit in a row at the top of the screen. 6 of 8 full-color SVG objects lie below (objects and shadows always share the same 6-item set — every object has a matching shadow — with positions shuffled independently per playthrough). Child drags each colored object onto its matching dark silhouette. Match all 6 to win.
- **Object Set:** House, Tree, Car, Boat, Ball, Umbrella, Airplane, Mushroom — 8 maximally distinct outline shapes satisfying color-independent accessibility.
- **SVG Requirements:** 8 object SVGs in `assets/svg/items/` (`house.svg`, `tree.svg`, `car.svg`, `boat.svg`, `ball.svg`, `umbrella.svg`, `airplane.svg`, `mushroom.svg`) — 512×512px, flat fills, thick `#2D3748` outlines 4–6px, soft/vibrant palette. 8 shadow silhouette SVGs in `assets/svg/shadows/` (`shadow_house.svg`, `shadow_tree.svg`, `shadow_car.svg`, `shadow_boat.svg`, `shadow_ball.svg`, `shadow_umbrella.svg`, `shadow_airplane.svg`, `shadow_mushroom.svg`) — derived by duplicating each object's paths, unioning fills, setting color to `#2D3748`. Sticker: `sticker_shadow_match.svg`.
- **Phaser Engine Logic:** Reuses Shape Sorter's drag/drop architecture (Phaser Pointer Drag + Zone detection). On correct drop: snaps object to silhouette center via 200ms `Back.out` tween, the silhouette stamps with a 1.1× pulse + white fill flash (self-cleaning), the matched object dims to 50% alpha, and a synthesized correct SFX + Graphics splash play; object is marked as matched (locked in place). On incorrect drop: gentle bounce-back to origin + synthesized incorrect SFX, no penalty. Dropping on empty space bounces back silently (no incorrect SFX). Completion triggers win animation + sticker award (first time only) + auto-return to Hub after 3s.
- **Accessibility:** Silhouettes differ by outline shape, not just darkness (color-independent design). Stamp/dim effects soften when `prefers-reduced-motion` is active. No-fail design (no penalties for mismatches).
- **Game Logic:** Pure functions in `src/game/shadowMatchLogic.ts` (Fisher-Yates shuffle, independent object/shadow position generation, match detection, win detection) — testable without Phaser.

### GAME 5 — Musical Memory Simon (Working Memory & Auditory Recall) ✅ Implemented

- **Milestone:** Sequential direction following and audio pattern retention.
- **Mechanics:** 3 colorful SVG frogs on lily pads emit distinct musical notes (C4, E4, G4) and scale up in sequence. Child repeats the sequence. Each successful round adds one note, starting at 2 notes and winning at length 6 (5 rounds). A replay button lets the child re-listen to the current sequence on demand.
- **SVG Requirements:** `frog_green.svg`, `frog_blue.svg`, `frog_red.svg`, `lilypad.svg` (512×512px, flat fills, thick `#2D3748` outlines 4–6px, storybook style). Sticker: `sticker_musical_memory.svg`.
- **Phaser Engine Logic:** Sequence stored in a typed array (`number[]`). Sequence auto-plays at round start with each frog scaling up + playing its note and emitting an expanding ripple ring (self-cleaning fade; input locked during playback, unlocked after). Lily pads drift gently ±3px on a 3s loop (disabled under reduced motion). Evaluates user tap order against array indices. On wrong tap: plays a gentle incorrect tone, re-plays the sequence, and retries the same round (no-fail, no progress lost). On round success: pops the next progress dot (1 → 1.4 → 1 `Back.out`, 5 dots total), grows the sequence by 1, and auto-plays the next round. Completion at length 6 triggers win animation + sticker award (first time only) + auto-return to Hub after 3s. Input is locked during the win celebration. Parental lock (hold 3s) exits to Hub at any time.
- **Accessibility:** Frogs distinguished by color AND position AND note (not color-only). Ripple/drift/dot-pop effects soften or disable when `prefers-reduced-motion` is active. No-fail design (no penalties for wrong taps).
- **Game Logic:** Pure functions in `src/game/musicalMemoryLogic.ts` (sequence generation, note appending, input validation, round completion, win detection) — testable without Phaser.

### GAME 6 — Big vs. Small Cleaner (Scale & Quantitative Reasoning) ✅ Implemented

- **Milestone:** Categorizing spatial size concepts ("Big" vs "Small").
- **Mechanics:** 3 of 6 toy types randomly selected per playthrough (Fisher-Yates shuffle). Each selected toy type spawns at two scales: big (1.5×) and small (0.7×), yielding 6 toys per round. Two toy box containers sit at the top of the screen — one rendered at 1.5× scale ("BIG" box) and one at 0.7× scale ("SMALL" box). Child drags each toy into the box whose scale category matches the toy's. Match all 6 to win.
- **Toy Set:** Teddy Bear, Toy Car, Toy Ball, Toy Block, Toy Rocket, Toy Drum — 6 toy types with maximally distinct silhouettes.
- **SVG Requirements:** `teddy_bear.svg`, `toy_car.svg`, `toy_ball.svg`, `toy_block.svg`, `toy_rocket.svg`, `toy_drum.svg` (512×512px, flat fills, thick `#2D3748` outlines 4–6px, storybook style, in `assets/svg/toys/`). `toy_box.svg` (512×512px, open container, rendered at both 1.5× and 0.7× scales — the box itself teaches the size concept). Sticker: `sticker_big_small.svg` (big orange ball + small purple ball on cream circle background).
- **Toy Colors:** Teddy Bear golden brown (`#D69E2E`), Toy Car coral (`#FC8181`), Toy Ball teal (`#4FD1C5`), Toy Block purple (`#9F7AEA`), Toy Rocket blue (`#3182CE`), Toy Drum yellow (`#ECC94B`) — all soft/vibrant non-primary.
- **Phaser Engine Logic:** Reuses Shape Sorter / Shadow Match's drag/drop architecture (Phaser Pointer Drag + Zone detection). Each toy image is created at `TOY_BASE_SIZE × toy.scale` (96px base × 1.5 = 144px for big, 96px × 0.7 = 67px for small — exceeding the 64px minimum touch target). Box zones use `DROP_ZONE_SIZE = 160px`. On correct drop: the toy shrinks into the box with a 150ms tween, the box lid wiggles (±3°, 3 yoyo repeats), the box briefly bumps to 1.05×, a synthesized correct SFX + Graphics splash play, and the toy is marked as sorted (locked in place via `disableInteractive`). On incorrect drop: gentle bounce-back to origin via `Back.out` tween + synthesized incorrect SFX, no penalty. Dropping on empty space bounces back silently. Completion triggers the shared win celebration (rays + confetti) + sticker award (first time only) + auto-return to Hub after 3s.
- **Accessibility:** Big toys (144px) and small toys (67px) both exceed the 64px minimum touch target. Size categories are visually distinct (1.5× vs 0.7× ratio). Box-reaction tweens soften when `prefers-reduced-motion` is active. No-fail design (no penalties for mismatches).
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
    ├── Display sticker shelf (earned/unearned thumbnails)
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

- **BootScene → PreloadScene → HubScene:** BootScene locks landscape orientation and initializes systems, then transitions to PreloadScene which displays a progress bar before transitioning to HubScene. Both transitions are crossfades.
- **HubScene → GameScene:** Tap on a game tile — navigation fires on **release** (see Press Feedback). 300ms crossfade transition with entrance zoom.
- **GameScene → HubScene:** Auto-return after game completion (3s delay with win celebration, then crossfade) OR parental lock (hold 3s, then crossfade).
- **HubScene → Settings modal:** Holding Settings for 3 seconds opens the parental modal. Parents can independently toggle BGM and SFX; toggles persist in localStorage. Tapping the dark backdrop closes the modal and returns to the Hub.
- **Sticker Award:** On first completion of a game, a sticker unlock animation plays before returning to Hub. Subsequent completions skip the sticker animation.

> **Release decision (2026-08-01):** The parental lock was hardened across Hub Settings and all six game Back controls: one hold per active pointer (duplicate `pointerdown` ignored), cancellation on release/pointer-out/`pointercancel`/scene shutdown, exactly one success callback per completed hold, and no stale timers or callbacks after the scene is destroyed. A circular progress fill (48px radius, `--success` `#68D391` at 0.6 alpha, rendered above scene UI) shows hold progress and is always cleaned up on cancel, completion, or shutdown. All protected controls expose explicit 96×96px hit areas; Phaser anchors hit areas at the top-left of a control's display bounds (not its origin), so rectangles are specified as `Rectangle(0, 0, 96, 96)`.

> **Release decision (2026-08-01):** A unified motion & feedback system was introduced. `src/utils/motion.ts` centralizes reduced-motion handling (`isReducedMotion`, `motionDuration`, `motionScale`); every animation in the app consults it — scene crossfades (300ms/180ms), the shared win celebration, press feedback (disabled under reduced motion), and all gameplay tweens (bounce-backs 300→180ms, bubble pop 200→120ms, wake wobble 300→180ms at 1.05× instead of 1.15×, frog bounce 200→120ms at 1.05× instead of 1.2×, sticker pops 300→180ms). Celebration: 10 rays + 10 confetti bits, 700ms standard / 300ms reduced, burst scale 1.25× / 1.0×, 6 rays and no particles when reduced. Covered by 445 tests across 15 files (~99% coverage).

> **Release decision (2026-08-01):** The Hub engagement track shipped staggered entrance (40ms per element, 300ms `Sine.out`, fade-only under reduced motion), idle life (2.5s ±4px bob loop with 200ms phase offsets; 4 low-contrast drift dots), a real SVG sticker shelf (56px thumbnails; earned shimmer at 0.75 alpha, unearned dimmed to 0.3 alpha/0.85 scale, just-earned `Back.out` 1.15× entrance + 500ms sparkle burst; game scenes pass `{ justEarned: gameId }` via scene-start data on first completion only), and idle attract (25s idle → 4° tile wiggle + soft `playIdleCall()` E5+G5 chime at 0.12 gain, repeating every 10s, reset on any pointer input, cleared on shutdown, chime-only under reduced motion). Two user-reported bugs were fixed during verification: `Camera.zoomTo` crash (camera Zoom effects resolve ease strings against their own EaseMap — pass `"Sine"`, not `"Sine.out"`) and sticker thumbnails rendering at full 512px texture size (entrance/burst tweens now scale relative to `STICKER_SCALE = 56/512`). Hub tiles navigate on release per user feedback. Covered by 445 tests across 15 files.

> **Release decision (2026-08-01):** The Per-Game Juice track added scene-level animation juice to all six games — zero gameplay-rule changes, zero new assets, Graphics-only effects (the app never uses `add.particles`). A shared helper `src/utils/dragJuice.ts` (`attachDragLift`, `attachDropZoneHighlight`, `snapToSlot`) powers the drag scenes (Shape Sorter, Shadow Match, Big vs. Small): pieces lift to 1.1× + 4° tilt on drag start (1.05×, no tilt reduced) and restore on release; drop zones pulse a soft outline (6px `--primary` stroke, yoyo pulse) while dragging over them; correct drops animate to the slot center with a 200ms `Back.out` tween (120ms reduced) instead of instant `setPosition`. Per-game reactions: Big vs. Small shrinks the toy into the box (150ms) with a ±3° lid wiggle (3 yoyo repeats) and a 1.05× box bump; Shadow Match stamps the silhouette (1.1× pulse + white fill flash, self-cleaning) and dims the matched object to 50% alpha; Animal Trace hops the animal between waypoints (two-phase arc tween, ~120ms/hop), wiggles the food (±4°, 3 yoyo repeats) on arrival, and pops progress dots 1 → 1.4 → 1 `Back.out`; Pop & Freeze emits 3 teal droplet circles from the pop point (self-cleaning fade) and gives sleeping-animal decoys a 1.0 → 1.03 breathing yoyo loop (~1.5s, disabled under reduced motion, removed on scene shutdown); Musical Memory emits expanding ripple rings on frog taps (self-cleaning fade), drifts lily pads ±3px on a 3s loop (disabled reduced), and pops progress dots on fill. Review fixes: Shape Sorter now bounces silently on empty-floor dragend (incorrect SFX only on zone drops, matching Shadow Match/Big vs. Small) and the breathing tween is cleaned up on shutdown. Covered by 490 tests across 16 files.

> **RELEASED — 2026-08-01 (Mascot Companion track):** 555 tests across 17 files.
>
> **Mascot companion:** Professor Hoot was added as a static-pose + tween-only mascot — no sprite sheets, no particle emitters, no new audio. Reactions reuse the existing shared SFX (correct/incorrect/win/sticker), animations run through `motion.ts` (reduced-motion-aware), and the mascot is touch-inert (never blocks taps) and rendered behind gameplay z-order. Deployed to the Hub (wave/cheer/idleLoop) and all six game scenes (cheer on correct, nod on incorrect, big cheer on win, destroyed on shutdown). This is a celebration-surface addition: it does not add new learning content, but reinforces feedback loops through a consistent, gentle companion presence.

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
| Generic tap | Soft pop | Web Audio API (synthesized) | All games (UI taps) |
| Correct match | Ascending chime (3-note: C5, E5, G5) | Web Audio API (synthesized) | Games 1, 2, 4, 6 |
| Incorrect match | Soft descending tone (G4 → C4) | Web Audio API (synthesized) | Games 1, 4, 6 |
| Bubble pop | Bright percussive blip (800 Hz, 0.08s) | Web Audio API (synthesized) | Game 3 |
| Sleeping animal tapped | Soft rousing tone (E4 + A4 dual oscillator) | Web Audio API (synthesized) | Game 3 |
| Game complete | Win fanfare (4-note arpeggio: C5, E5, G5, C6) | Web Audio API (synthesized) | All games |
| Sticker earned | Sparkle (2-note: C6, E6) | Web Audio API (synthesized) | All games (first completion) |

> **Note:** All gameplay SFX (generic tap, correct, incorrect, win, sticker) are **synthesized via Web Audio API** — no MP3 files are needed. This reduces asset overhead and keeps feedback responsive across devices. Game 3's pop and wake sounds are also synthesized.

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
| E5, G5 | 659.25, 783.99 Hz | Idle attract — idle call (gentle two-tone chime, 0.12 gain) |

Game 5 frog notes, gameplay feedback SFX (correct, incorrect, win, sticker), Game 3 pop/wake sounds, and the idle-attract chime are all synthesized via Web Audio API oscillators — no audio files needed for these. The AudioManager exposes these as `playPop()`, `playWake()`, `playCorrect()`, `playIncorrect()`, `playWin()`, `playSticker()`, and `playIdleCall()` methods, all respecting the SFX toggle setting.

### Background Music (BGM)

| File | Usage |
|---|---|
| `bgm.mp3` | Single gentle ambient loop, played at low volume across all scenes |

- BGM is initialized in BootScene and loops continuously after playback begins.
- BGM can be toggled on/off via parental settings (persisted in localStorage).
- SFX can also be toggled independently.
- The settings modal plays the synthesized correct chime when SFX is enabled. The packaged `/audio/bgm.mp3` loop plays after eligible user interaction and follows the persisted BGM setting.

> **Release decision (2026-07-31):** The supplied loop is packaged at `public/audio/bgm.mp3` so Vite serves it at `/audio/bgm.mp3`. Playback uses a gentle 0.3 volume and waits for eligible user interaction to respect browser autoplay policies.

### Audio Format

- Packaged audio file (`bgm.mp3`): **MP3** for broad device compatibility; gameplay SFX are synthesized with Web Audio API.
- Synthesized tones: **Web Audio API** (no file overhead).

---

## 8. Performance Targets

| Metric | Target | Rationale |
|---|---|---|
| Frame rate | 60fps (min 30fps on low-end phones) | Smooth animations for toddler engagement |
| Boot/load time | < 3 seconds (mid-range tablet) | Prevent attention loss during loading |
| Memory usage | < 150MB total | SVG rasterization at 512×512 is lightweight; keep buffer for audio |
| Offline capability | Full gameplay after the first HTTPS PWA load/install | vite-plugin-pwa precaches all build assets, including `/audio/bgm.mp3` |
| Touch input latency | < 16ms (1 frame) | Immediate feedback for fine-motor activities |
| Audio latency | < 50ms | Synchronized SFX with visual feedback |

---

## 9. Release Readiness Decisions

- Production builds generate `manifest.webmanifest` and an auto-updating service worker through `vite-plugin-pwa`.
- The service worker precaches the bundled game assets, PWA icon, and BGM for offline play.
- Phone/tablet installation, offline, and update validation must use an HTTPS private static host or tunnel; `http://localhost` is reserved for same-device smoke tests.

## See Also

- [TDD.md](./TDD.md) — Technical Design Document (tech stack details, directory structure, PWA/Phaser configuration, localStorage schema, full asset manifest)
