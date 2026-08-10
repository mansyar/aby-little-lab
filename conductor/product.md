# Initial Concept

Aby's Little Lab — An ad-free toddler game suite (ages 3-5) with 18 mini-games, built with Phaser 4 + TypeScript + Vite as a PWA. Detailed product and technical specifications are available in `docs/PRD.md` and `docs/TDD.md`.

---

# Product Definition

## 1. Product Overview

**Aby's Little Lab** is an ad-free, distraction-free developmental game suite for preschoolers aged 3–5 (36–60 months). The app packages **18 distinct mini-games** into a single lightweight PWA targeting fundamental cognitive, motor, and reasoning milestones.

All graphical assets use an **AI-Generated SVG Pipeline**: Phaser 4 rasterizes scalable vectors dynamically at load time into crisp bitmaps, matching exact display resolutions without large file sizes.

## 2. Target Audience

- **Primary:** Preschoolers aged 3–5 (36–60 months)
- **Secondary:** Parents/caregivers who install the app and manage settings
- **Device:** Tablets (iPad, Android) and phones — landscape orientation

## 3. Key Features

### 3.1 Eighteen Mini-Games

| # | Game | Milestone | Core Mechanic |
|---|---|---|---|
| 1 | Shape Sorter | Cognitive reasoning & categorization | Drag shapes to matching cut-out slots (18-shape pool, 3 rounds × 3 shapes per playthrough) |
| 2 | Animal Trace-and-Connect | Fine motor precision & pre-writing | Trace dotted path from animal to its food |
| 3 | Pop & Freeze! | Reflexes & inhibitory control | Pop bubbles; avoid waking sleeping animal bubbles |
| 4 | Shadow Match | Visual discrimination & spatial awareness | Match colored objects to dark silhouettes |
| 5 | Musical Memory Simon | Working memory & auditory recall | Repeat growing frog-note sequences (C4/E4/G4) |
| 6 | Big vs. Small Cleaner | Scale & quantitative reasoning | Sort toys by size into big/small boxes |
| 7 | Pattern Builder | Sequential pattern recognition | Tap the missing shape to complete ABAB/AABB/ABB patterns |
| 8 | Find the Letter | Early literacy (letter recognition) | Tap the letter card matching the spoken/displayed uppercase target |
| 9 | Find the Word | Early literacy (sight words) | Tap the printed word matching the pictured/spoken word among 4 cards |
| 10 | Build the Word | Early literacy (spelling) | Spell the pictured/spoken word by tapping letter tiles in order |
| 11 | How Many? | Early numeracy (counting & number recognition) | Tap the group of objects matching the spoken/displayed target count |
| 12 | First Sounds | Early literacy (phonemic awareness) | Hear a word spoken, tap the letter card of its first sound |
| 13 | More or Less | Early numeracy (quantity comparison) | Tap the group that has MORE or FEWER items than the other (arrow cue + spoken prompt) |
| 14 | Odd One Out | Visual discrimination & categorization | Tap the card that is different among 4 (2×2 grid: 3 identical + 1 distinct; spoken prompt names the odd item) |
| 15 | Color Match | Color recognition | Tap the colored object matching the large swatch + spoken color name (2×2 grid of 4 distinct-color cards) |
| 16 | Add It Up | Early addition | Count the two dot-group cards joined by a big "+", then tap the answer card with the correct total (≤10; 4 answer cards) |
| 17 | Take Away | Early subtraction | Count the first dot-group card, "take away" the second (big "−" cue), then tap the answer card with the correct difference (≤10; 4 answer cards) |
| 18 | Memory Match | Visual working memory | Flip pairs of face-down cards to find identical textures; grids grow 2×3 → 3×4 → 4×4 across 6 rounds |

### 3.2 Cross-Game Systems

- **Mascot Companion:** "Professor Hoot", a round owl in a tiny lab coat, lives on the Hub (bottom corner; waves on load, gentle bob + squash-blink idle loop, cheers on newly-earned stickers) and in all eighteen game scenes (cheers on correct actions, nods on incorrect ones, big cheer on round wins alongside the win celebration). Tween-only reactions over two static SVG poses (no sprite sheets); respects `prefers-reduced-motion`; adds no new audio.
- **Sticker Collection:** Each game awards a unique themed sticker on first completion. Stickers persist across sessions via localStorage and display as a sticker shelf (SVG thumbnails) under each Hub tile — earned stickers shimmer, unearned ones are dimmed, and a just-earned sticker gets a highlight on return. Since v2 (2026-08-04), stickers are **per kid profile**: up to 4 profiles, each with its own collection; a kid-tappable avatar chip on the Hub switches profiles instantly (no parental lock), while profile creation/deletion stays behind the parental hold in Settings → Profiles.
- **Play-Time Limits** *(2026-08-05)*: Parents can set a per-profile daily play-time cap (Off / 15 / 30 / 45 / 60 min) in Settings → Profiles. Usage accrues per profile while games run; the Hub shows a textless remaining-budget arc that turns warm at ≤5 min, a soft hourglass nudge delays game launch once 5 min remain, and when the cap is reached tiles dim and lock with a moon badge — no mid-game cutoffs, no harshness, fully off by default.
- **TTS Voice Selection** *(2026-08-08)*: Parents can pick the device TTS voice used by all speech-driven games (Find the Letter, Find the Word, Build the Word, How Many?, First Sounds, More or Less, Odd One Out, Color Match) in Settings → Voice. Device-level (shared across profiles), "Default (device)" option, in-place Preview honoring the SFX toggle. Addresses the accepted known issue "TTS voice availability varies by device/OS".
- **Parent Progress Insights** *(2026-08-09)*: Parents can open a per-profile **Learning Progress** report from Settings → Progress: for each of the 18 games — plays, accuracy (green fill bar + percent), a ★ mastery star after 3 wins, and relative last-played. Avatar chips switch the report between profiles without changing the active profile; rows page 6 + 6 + 6; a 7-day activity strip shows plays per day. Fully on-device (additive `progress`/`activity` fields per profile, normalize-on-read), parent-gated behind the 3-second hold — kids never see it. Pop & Freeze and Animal Trace count plays/wins but have no right/wrong taps by design.
- **Replay Variety:** Items/shapes/animals shuffle per playthrough; difficulty stays fixed.
- **Gentle Feedback:** Correct → pleasant chime + Graphics-based splash (no particle emitters). Incorrect → gentle "try again" animation, no penalty.
- **Per-Game Juice:** Each game layers playful animation reactions — drag pieces lift/tilt and snap home with a `Back.out` settle, boxes wiggle and bump, shadows stamp, animals hop, bubbles burst into droplets, frogs ripple — all reduced-motion-aware (gentler/shorter or disabled) and zero-penalty.

## 4. UX Principles

- **Touch-First Ergonomics:** Touch targets minimum 64×64px (ideal 96×96px) with inflated collision bounds.
- **Textless Visual Cues:** Zero text dependency for gameplay — all prompts are visual/audio. *(2026-08-02 amendment — Game 8:* letters are the learning content, not UI instructions; no written instructions appear anywhere. *)* *(2026-08-05 amendment — Game 11:* numerals are learning content too, displayed large and spoken aloud; the game is fully playable without reading anything. *)* *(2026-08-07 amendment — Game 12:* the spoken word is the prompt and letter cards are the answer set; both are learning content, no written instructions appear. *)* *(2026-08-08 amendment — Game 13:* the comparison word ("more"/"less") is the prompt, spoken aloud with a large up/down arrow cue; quantity comparison itself is the learning content, no written instructions appear. *)* *(2026-08-08 amendment — Game 14:* category, type, and color differences are the learning content; the TTS prompt names the odd item, no written instructions appear. *)* *(2026-08-08 amendment — Game 15:* color names are the learning content; the large swatch + spoken color name are the prompt, no written instructions appear. *) *(2026-08-09 amendment — Game 16:* early addition is the learning content; the two dot-group cards joined by a big "+" cue are the prompt, no written instructions appear. *) *(2026-08-10 amendment — Game 17:* early subtraction is the learning content; the two dot-group cards joined by a big "−" cue are the prompt, no written instructions appear. *) *(2026-08-11 amendment — Game 18:* visual working memory is the learning content; the face-down cards are the prompt and matching identical textures is the answer, no written instructions appear. *)
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
- **HubScene:** 18 game tiles grid (5×3 + 3 — row 4 holds 3 left-aligned tiles), sticker shelf display, settings (behind parental lock), and the Professor Hoot mascot in the bottom corner.
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

## Changelog — Game 18 (2026-08-11)

> **2026-08-11 — Game 18 — Memory Match:** First pure visual-working-memory game added (no prompt, no speech — third game without a prompt voice). Each round deals a face-down grid of paired cards from a 16-texture mixed-category pool (6 animals, 6 toys, 4 small items — zero new object art); the child flips two cards at a time and matches identical textures. 6 rounds per playthrough, easy-first progressive grids: rounds 1–2 = 2×3 grid / 3 pairs (150px cards), rounds 3–4 = 3×4 / 6 pairs (132px), rounds 5–6 = 4×4 / 8 pairs (120px). Flip = `scaleX` 1→0→1 with face swap (180ms / 120ms reduced motion) + soft pop; cards deal in with a 40ms stagger. Match: success flash (250ms) + chime + mascot cheer + `recordCorrect`. Mismatch: wiggle ±4° + nod + soft tone, both cards flip back after 800ms — no penalty, `recordWrong`. Input locks during transitions; rounds advance after 700ms once every pair is matched; after 6 rounds: shared win celebration + first-time sticker + 3s auto-return with `{ justEarned: "memory-match" }`. New assets: `tile_memory_match.svg` (3 mini-cards, blue star motif), `sticker_memory_match.svg` (cream badge), `card_back.svg` (face-down card back, star motif; preload 159 → 162). **Hub grid becomes 5×3 + 3 with 18 tiles (rows 5/5/5/3 — row 4 holds 3 left-aligned tiles)**; Settings Learning Progress rows 17 → 18 (pages 6+6+6); `GameId` includes `memory-match` with `GAME_IDS` per-key backfill for old saves. Mismatches count as wrong taps (each matched pair = one correct) so parent Learning Progress accuracy stays meaningful.

## Changelog — Game 17 (2026-08-10)

> **2026-08-10 — Game 17 — Take Away:** Early-subtraction game added. Each round shows an equation row — two dot-group cards joined by a big "−" cue with an "=" cue at the end (all textless; no spoken prompt); the child counts the first group, "takes away" the second, and taps the answer card showing the correct difference. 6 rounds per playthrough, easy-first bands (mirror Add It Up): rounds 1–2 minuend ≤ 4, rounds 3–4 ≤ 6, rounds 5–6 ≤ 10. Subtraction pairs (minuend > subtrahend ≥ 1, differences never 0) never repeat order-sensitively within a playthrough; the two prompt cards always use two distinct item types and the 4 answer cards share a single item type (distinct totals in [1..bandMax], exactly one equals the target). Correct tap: success flash + chime + mascot cheer + progress-dot pop, 700ms advance. Wrong tap: wiggle + nod, no penalty. After 6 correct: shared win celebration + first-time sticker + 3s auto-return with `{ justEarned: "take-away" }`. New assets: `minus.svg` (symbol cue), `tile_take_away.svg`, `sticker_take_away.svg` (preload 156 → 159; zero new object art — reuses the 8 `COUNT_ITEMS` textures). **Hub grid becomes 5×3 + 2 with 17 tiles (rows 5/5/5/2 — row 4 holds 2 left-aligned tiles)**; `GameId` includes `take-away` with `GAME_IDS` per-key backfill for old saves. Complements Add It Up to complete the early-arithmetic arc (addition + subtraction within 10); like Add It Up it is fully textless and speech-free (second game without a prompt voice).

## Changelog — Game 16 (2026-08-09)

> **2026-08-09 — Game 16 — Add It Up:** Early-addition game added. Each round shows an equation row — two dot-group cards joined by a big "+" cue with an "=" cue at the end (all textless; no spoken prompt); the child counts both groups and taps the answer card showing the correct total. 6 rounds per playthrough, easy-first bands: rounds 1–2 sums ≤ 4, rounds 3–4 sums ≤ 6, rounds 5–6 sums ≤ 10. Addend pairs (a,b ≥ 1) never repeat order-insensitively within a playthrough; the two addend cards always use two distinct item types and the 4 answer cards share a single item type (distinct totals in [1..bandMax], exactly one equals the target). Correct tap: success flash + chime + mascot cheer + progress-dot pop, 700ms advance. Wrong tap: wiggle + nod, no penalty. After 6 correct: shared win celebration + first-time sticker + 3s auto-return with `{ justEarned: "add-it-up" }`. New assets: `plus.svg` + `equals.svg` (symbol cues), `tile_add_it_up.svg`, `sticker_add_it_up.svg` (preload 152 → 156; zero new object art — reuses the 8 `COUNT_ITEMS` textures). **Hub grid becomes 5×3 + 1 with 16 tiles (rows 5/5/5/1 — row 4 holds 1 left-aligned tile)**; `GameId` includes `add-it-up` with `GAME_IDS` per-key backfill for old saves.

## Changelog — Game 15 (2026-08-08)

> **2026-08-08 — Game 15 — Color Match:** Color-recognition game added. Each round shows a large color swatch (Graphics, target-color fill + thick outline) whose color name is spoken aloud (SFX-gated, silent fallback, speaker replay); four cards below show objects of **4 distinct colors** and the child taps the one matching the swatch. 6 rounds per playthrough, easy-first bands: rounds 1–3 draw 4 colors from the 4-color pool (red heart / blue frog / yellow crescent / green rectangle), rounds 4–6 from the 6-color pool (+ orange circle / purple square). Correct tap: success flash + chime + mascot cheer + progress-dot pop, 700ms advance. Wrong tap: wiggle + nod, no penalty. After 6 correct: shared win celebration + first-time sticker + 3s auto-return with `{ justEarned: "color-match" }`. New assets: `tile_color_match.svg`, `sticker_color_match.svg` (preload 150 → 152; zero new object art — reuses heart/frog/crescent/rectangle/circle/square textures; swatch hexes equal the source SVG fills). **Hub grid completes 5×3 with 15 tiles (rows 5/5/5)**; `GameId` includes `color-match` with `GAME_IDS` per-key backfill for old saves.

## Changelog — Game 14 (2026-08-08)

> **2026-08-08 — Game 14 — Odd One Out:** Visual-discrimination game added. Each round shows a 2×2 grid of 4 cards — exactly 3 identical textures (the group) + 1 distinct (the odd one); the odd item's name is spoken aloud (SFX-gated, silent fallback, speaker replay). 6 rounds per playthrough, easy-first bands: 2 cross-category rounds (odd from a different category: animal/toy/shape), 2 same-category different-item rounds (e.g. 3 cats + 1 dog), 2 hard rounds (same animal different color — 3 green frogs + 1 blue frog); the odd texture is unique per playthrough. Correct tap: success flash + chime + mascot cheer + progress-dot pop, 700ms advance. Wrong tap: wiggle + nod, no penalty. After 6 correct: shared win celebration + first-time sticker + 3s auto-return with `{ justEarned: "odd-one-out" }`. New assets: `tile_odd_one_out.svg`, `sticker_odd_one_out.svg` (preload 148 → 150; zero new object art — reuses animal/frog/toy/shape textures). Hub grid 5×3 with 14 tiles (row 3: 4 tiles left-aligned); `GameId` includes `odd-one-out` with `GAME_IDS` per-key backfill for old saves.

## Changelog — v1.9.0 (2026-08-08)

> **2026-08-08 — Game 13 — More or Less:** Quantity-comparison game added. Each round shows two dot-group cards; a large up-arrow (more) or down-arrow (less) cue pops in top-center and the comparison word is spoken aloud (SFX-gated, silent fallback, speaker replay). The child taps the group with more/fewer items. 6 rounds per playthrough, easy-first bands 1–3 / 1–5 / 1–10, exactly 3 "more" + 3 "less" rounds shuffled; counts within a round are always distinct and card/item positions shuffle. Correct tap: success flash + chime + mascot cheer + progress-dot pop, 700ms advance. Wrong tap: wiggle + nod, no penalty. After 6 correct: shared win celebration + first-time sticker + 3s auto-return with `{ justEarned: "more-less" }`. New assets: `arrow_up.svg`, `arrow_down.svg` (cue), `tile_more_less.svg`, `sticker_more_less.svg` (preload 144 → 148). Hub grid 5×3 with 13 tiles (row 3: 3 tiles left-aligned); `GameId` includes `more-less` with `GAME_IDS` per-key backfill for old saves.

## Changelog — v1.7.0 (2026-08-07)

> **2026-08-07 — Gameplay Hardening:** Replay/session fixes for Animal Trace, Shape Sorter, Pattern Builder (fresh session state on every launch), Musical Memory (replay resets input), Pop & Freeze (bubbles bounce at the true edge — physics body matches the 96px bubble), speaker replay no longer crashes during the win celebration (Find the Letter, Find the Word, Build the Word, How Many?), and a double-navigation guard for Back-hold during auto-return. Gameplay depth: Animal Trace next-waypoint ring + visited-dot lighting; Musical Memory same-frog run cap (max 2) and faster notes for long sequences; Word Match easy-first ordering; correct-answer splashes in Word Match, Find the Letter, Pattern Builder; Word Builder fly-to-slot + ghost tiles (duplicate letters stay tappable) and 132px tiles for the phone touch floor; Pattern Builder 6 rounds; confusable-distractor guards in Alphabet and Pattern Builder; How Many distinct targets per band + centered partial rows; Big vs Small shuffled box sides. Consistency pass: Shadow Match drop zones 160px, reduced-motion-aware Word Builder effects, Baloo 2 back button in Shape Sorter, dead code removed. Released as v1.7.0.
