# Initial Concept

Aby's Little Lab — An ad-free toddler game suite (ages 3-5) with 10 mini-games, built with Phaser 4 + TypeScript + Vite as a PWA. Detailed product and technical specifications are available in `docs/PRD.md` and `docs/TDD.md`.

---

# Product Definition

## 1. Product Overview

**Aby's Little Lab** is an ad-free, distraction-free developmental game suite for preschoolers aged 3–5 (36–60 months). The app packages **10 distinct mini-games** into a single lightweight PWA targeting fundamental cognitive, motor, and reasoning milestones.

All graphical assets use an **AI-Generated SVG Pipeline**: Phaser 4 rasterizes scalable vectors dynamically at load time into crisp bitmaps, matching exact display resolutions without large file sizes.

## 2. Target Audience

- **Primary:** Preschoolers aged 3–5 (36–60 months)
- **Secondary:** Parents/caregivers who install the app and manage settings
- **Device:** Tablets (iPad, Android) and phones — landscape orientation

## 3. Key Features

### 3.1 Ten Mini-Games

| # | Game | Milestone | Core Mechanic |
|---|---|---|---|
| 1 | Shape Sorter | Cognitive reasoning & categorization | Drag shapes (circle, square, triangle, star, heart, crescent) to matching cut-out slots |
| 2 | Animal Trace-and-Connect | Fine motor precision & pre-writing | Trace dotted path from animal to its food |
| 3 | Pop & Freeze! | Reflexes & inhibitory control | Pop bubbles; avoid waking sleeping animal bubbles |
| 4 | Shadow Match | Visual discrimination & spatial awareness | Match colored objects to dark silhouettes |
| 5 | Musical Memory Simon | Working memory & auditory recall | Repeat growing frog-note sequences (C4/E4/G4) |
| 6 | Big vs. Small Cleaner | Scale & quantitative reasoning | Sort toys by size into big/small boxes |
| 7 | Pattern Builder | Sequential pattern recognition | Tap the missing shape to complete ABAB/AABB/ABB patterns |
| 8 | Find the Letter | Early literacy (letter recognition) | Tap the letter card matching the spoken/displayed uppercase target |
| 9 | Find the Word | Early literacy (sight words) | Tap the printed word matching the pictured/spoken word among 4 cards |
| 10 | Build the Word | Early literacy (spelling) | Spell the pictured/spoken word by tapping letter tiles in order |

### 3.2 Cross-Game Systems

- **Mascot Companion:** "Professor Hoot", a round owl in a tiny lab coat, lives on the Hub (bottom corner; waves on load, gentle bob + squash-blink idle loop, cheers on newly-earned stickers) and in all ten game scenes (cheers on correct actions, nods on incorrect ones, big cheer on round wins alongside the win celebration). Tween-only reactions over two static SVG poses (no sprite sheets); respects `prefers-reduced-motion`; adds no new audio.
- **Sticker Collection:** Each game awards a unique themed sticker on first completion. Stickers persist across sessions via localStorage and display as a sticker shelf (SVG thumbnails) under each Hub tile — earned stickers shimmer, unearned ones are dimmed, and a just-earned sticker gets a highlight on return. Since v2 (2026-08-04), stickers are **per kid profile**: up to 4 profiles, each with its own collection; a kid-tappable avatar chip on the Hub switches profiles instantly (no parental lock), while profile creation/deletion stays behind the parental hold in Settings → Profiles.
- **Play-Time Limits** *(2026-08-05)*: Parents can set a per-profile daily play-time cap (Off / 15 / 30 / 45 / 60 min) in Settings → Profiles. Usage accrues per profile while games run; the Hub shows a textless remaining-budget arc that turns warm at ≤5 min, a soft hourglass nudge delays game launch once 5 min remain, and when the cap is reached tiles dim and lock with a moon badge — no mid-game cutoffs, no harshness, fully off by default.
- **Replay Variety:** Items/shapes/animals shuffle per playthrough; difficulty stays fixed.
- **Gentle Feedback:** Correct → pleasant chime + Graphics-based splash (no particle emitters). Incorrect → gentle "try again" animation, no penalty.
- **Per-Game Juice:** Each game layers playful animation reactions — drag pieces lift/tilt and snap home with a `Back.out` settle, boxes wiggle and bump, shadows stamp, animals hop, bubbles burst into droplets, frogs ripple — all reduced-motion-aware (gentler/shorter or disabled) and zero-penalty.

## 4. UX Principles

- **Touch-First Ergonomics:** Touch targets minimum 64×64px (ideal 96×96px) with inflated collision bounds.
- **Textless Visual Cues:** Zero text dependency for gameplay — all prompts are visual/audio. *(2026-08-02 amendment — Game 8:* letters are the learning content, not UI instructions; no written instructions appear anywhere. *)*
- **Parental Lock:** Hold-for-3-seconds mechanism gates settings access and app exit.
- **Responsive Scale:** 1024×768 landscape base resolution with `Phaser.Scale.FIT` centered letterboxing. Phones auto-rotate to landscape via Screen Orientation API.

## 5. Platform & Distribution

- **Platform:** PWA / Mobile Web (Tablet & Phone)
- **Distribution:** Local sideload / Private PWA
- **Offline:** Full gameplay after first PWA install (precache all assets)

## 6. Game Flow & Navigation

```
BootScene → PreloadScene → HubScene → GameScene → HubScene
```

- **BootScene:** Locks screen orientation to landscape via Screen Orientation API. Auto-transitions to Preload.
- **PreloadScene:** Preloads SVG assets (rasterized at 512×512), displays progress bar. Auto-transitions to Hub.
- **HubScene:** 10 game tiles grid (5×2), sticker shelf display, settings (behind parental lock), and the Professor Hoot mascot in the bottom corner.
- **GameScene:** Initialized with randomized items. On completion: win animation + sticker award (if first time) + auto-return to Hub (3s delay). Exit via parental lock (hold 3s).

## 7. Visual Design

### Core Palette

| Token | Hex | Usage |
|---|---|---|
| `--bg-base` | `#FAF9F6` | App background (warm off-white) |
| `--bg-hub` | `#FFF8E7` | Hub background (warm cream) |
| `--primary` | `#2B6CB0` | Theme color, UI accents |
| `--outline` | `#2D3748` | Thick stroke outlines, shadow fills |
| `--success` | `#68D391` | Correct feedback |
| `--error` | `#FC8181` | Incorrect feedback |

### Design Rules

- Flat design, thick dark strokes (4–6px at 512px base)
- No gradients, no neon, no pure RGB primaries
- Soft/vibrant color palette

## 8. Audio Design

- **SFX (Web Audio API):** pop, correct, incorrect, wake, win, sticker — synthesized at runtime; no MP3 files needed
- **Synthesized frog notes (Web Audio API):** Game 5 notes (C4=261.63Hz, E4=329.63Hz, G4=392.00Hz)
- **BGM:** Single gentle ambient loop (`bgm.mp3`), toggleable via parental settings
- **Audio toggles:** BGM and SFX independently toggleable, persisted in localStorage

## 9. Performance Targets

| Metric | Target |
|---|---|
| Frame rate | 60fps (min 30fps) |
| Boot time | < 3 seconds |
| Memory | < 150MB |
| Touch latency | < 16ms |
| Audio latency | < 50ms |
| Offline | Full gameplay after first install |
