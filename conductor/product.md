# Initial Concept

Aby's Little Lab — An ad-free toddler game suite (ages 3-5) with 24 mini-games, built with Phaser 4 + TypeScript + Vite as a PWA. Detailed product and technical specifications are available in `docs/PRD.md` and `docs/TDD.md`.

---

# Product Definition

## 1. Product Overview

**Aby's Little Lab** is an ad-free, distraction-free developmental game suite for preschoolers aged 3–5 (36–60 months). The app packages **24 distinct mini-games** into a single lightweight PWA targeting fundamental cognitive, motor, and reasoning milestones.

All graphical assets use an **AI-Generated SVG Pipeline**: Phaser 4 rasterizes scalable vectors dynamically at load time into crisp bitmaps, matching exact display resolutions without large file sizes.

## 2. Target Audience

- **Primary:** Preschoolers aged 3–5 (36–60 months)
- **Secondary:** Parents/caregivers who install the app and manage settings
- **Device:** Tablets (iPad, Android) and phones — landscape orientation

## 3. Key Features

### 3.1 Twenty-Three Mini-Games

| # | Game | Milestone | Core Mechanic |
|---|---|---|---|
| 1 | Shape Sorter | Cognitive reasoning & categorization | Drag shapes to matching cut-out slots (18-shape pool, 3 rounds × 3 shapes per playthrough) |
| 2 | Animal Trace-and-Connect | Fine motor precision & pre-writing | Trace dotted path from animal to its food |
| 3 | Pop & Freeze! | Reflexes & inhibitory control | Pop bubbles; avoid waking sleeping animal bubbles |
| 4 | Shadow Match | Visual discrimination & spatial awareness | Match colored objects to dark silhouettes |
| 5 | Musical Memory Simon | Working memory & auditory recall | Repeat growing frog-note sequences (C4/E4/G4) |
| 6 | Big & Small | Scale & quantitative reasoning | Sort toys by size into big/small boxes |
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
| 19 | Decode It | Early decoding / word recognition | Picture + spoken word → tap the written word among 4 cards (6 rounds, easy-first 3→4-letter bands) |
| 20 | Number Order | Numeral sequencing / ordinality | Drag shuffled numeral cards (3–5 of them) into empty slots in ascending order (6 rounds, easy-first 1–5 → 1–8 → 1–10 bands; tap a numeral to hear it spoken) |
| 21 | Feelings Faces | Social-emotional learning (emotion recognition) | Hear a short everyday scenario, then tap the face showing how Aby feels (6 rounds, 3 faces per round, 32-scenario pool; contrastive pairs first, then the confusable sad/scared pair) |
| 22 | Story Order | Narrative sequencing / temporal order | Drag three shuffled story panels into three ordinal slots (marked only by 1/2/3 pips) to tell the story first to last (6 rounds, 15-story pool, easy-first obvious then subtle) |
| 23 | Robot Path | Early programming / sequencing absolute steps | Tap absolute direction arrows into a six-slot strip, then Go, to walk a robot across a 3×3 board to its star (6 rounds, 2-6 commands each, a rock or two in the last two; a refused illegal step, retry in place, one hint after two stopped runs) |
| 24 | Fix-It Machine | Debugging / reading a written program | Watch a tape of instruction cards repair a toy, tap the one card that does not belong, pick the right tool from three, then Go again to make the toy (6 rounds of 3-5 cards, one authored substitution never first; a stopped run keeps its tape and its round, hints pulse at two, four and six missed taps and are never placed) |

### 3.2 Cross-Game Systems

- **Mascot Companion:** "Professor Hoot", a round owl in a tiny lab coat, lives on the Hub (bottom corner; waves on load, gentle bob + squash-blink idle loop, cheers on newly-earned stickers) and in all twenty-four game scenes (cheers on correct actions, nods on incorrect ones, big cheer on round wins alongside the win celebration). Tween-only reactions over two static SVG poses (no sprite sheets); respects `prefers-reduced-motion`; adds no new audio.
- **Sticker Collection:** Each game awards a unique themed sticker on first completion. Stickers persist across sessions via localStorage and display as a sticker shelf (SVG thumbnails) under each Hub tile — earned stickers shimmer, unearned ones are dimmed, and a just-earned sticker gets a highlight on return. Since v2 (2026-08-04), stickers are **per kid profile**: up to 4 profiles, each with its own collection; a kid-tappable avatar chip on the Hub switches profiles instantly (no parental lock), while profile creation/deletion stays behind the parental hold in Settings → Profiles.
- **Play-Time Limits** *(2026-08-05)*: Parents can set a per-profile daily play-time cap (Off / 15 / 30 / 45 / 60 min) in Settings → Profiles. Usage accrues per profile while games run — only visible time counts, so a hidden or backgrounded tab accrues nothing — the Hub shows a textless remaining-budget arc that turns warm at ≤5 min, a soft hourglass nudge delays game launch once 5 min remain, and when the cap is reached tiles dim and lock with a moon badge — no mid-game cutoffs, no harshness, fully off by default.
- **TTS Voice Selection** *(2026-08-08)*: Parents can pick the device TTS voice used by all speech-driven games (Find the Letter, Find the Word, Build the Word, How Many?, First Sounds, More or Less, Odd One Out, Color Match) in Settings → Voice. Device-level (shared across profiles), "Default (device)" option, in-place Preview honoring the SFX toggle. Since 2026-10-18 this voice also drives the twelve rule-narrators, so it sets the voice for all twenty-four games. Addresses the accepted known issue "TTS voice availability varies by device/OS".
- **Spoken Rules for Every Game** *(2026-10-18)*: All twenty-four games are now voiced. The ten that already narrated their target keep doing so; the ten that taught by interaction alone (Shape Sorter, Animal Trace, Pop & Freeze, Shadow Match, Memory Match, Number Order, Pattern Builder, Big vs. Small, Add It Up, Take Away) speak a single one-line rule when the round is set up - "Drag each shape into its hole.", "Put the numbers in order, smallest first." and so on. Since 2026-10-20, Feelings Faces is the eleventh rule-narrator ("Tap the face that shows how Aby feels.") and also speaks each round's everyday scenario aloud. Since 2026-10-20, Story Order is the twelfth rule-narrator ("Put the story in order, first to last."). Since 2026-11-16, Robot Path is the thirteenth ("Put the arrows in the robot's path, then tap go.") and Fix-It Machine is the fourteenth ("Find the wrong card and fix it."). Each rule is one short written line beside the shared speaker glyph: spoken once automatically, replayable on tap, silent and dimmed when SFX is off or the device has no voice. The rule is spoken, not just printed, so a pre-reader needs no help to start a game they have never seen.
- **Parent Progress Insights** *(2026-08-09)*: Parents can open a per-profile **Learning Progress** report from Settings → Progress: for each of the 24 games — plays, accuracy (green fill bar + percent), a ★ mastery star after 3 wins, and relative last-played. Avatar chips switch the report between profiles without changing the active profile; rows page 6 + 6 + 6 + 6; a 7-day activity strip shows plays per day. Fully on-device (additive `progress`/`activity` fields per profile, normalize-on-read), parent-gated behind the 3-second hold — kids never see it. Pop & Freeze and Animal Trace count plays/wins but have no right/wrong taps by design. Fix-It Machine separates searching from answering: tapping a card to see whether it is the faulty one is a **look**, counted and shown beside accuracy (`3 looks`) but never scored, so a child who explores before repairing is not reported as failing. Choosing a tool in the repair tray is still an answer, right or wrong.
- **Adaptive Difficulty** *(2026-08-27)*: In the five early-numeracy games (How Many?, More or Less, Add It Up, Take Away, and Number Order — 2026-08-28, twelfth adaptive game), the easy-first difficulty ladder may shift one band up or down at the start of a playthrough, based on the kid's last 10 taps in that game (per profile, re-evaluated fresh each session, never mid-game). Strong recent performance (≥90% across that 10-tap window, once at least 6 taps are in it) nudges the ladder up; struggling (<60%) nudges it down; anything between leaves the ladder steady, every step is clamped to the game's own band range, and with fewer than 6 taps or the toggle off the classic ladder is used. Invisible to kids (no labels, no tiers, no fail states); parents can turn it off in Settings → Adaptive Difficulty, and the Learning Progress report notes that difficulty adapts to recent answers.
- **Adaptive Literacy & Memory** *(2026-08-27)*: The same adaptive ±1 band system extends to six literacy & memory games — Find the Word, Build the Word, First Sounds, Find the Letter, Memory Match, and Musical Memory — plus Decode It (2026-08-28, seventh adaptive game) — re-evaluated fresh at each playthrough start from the kid's last 10 taps in that game (per profile, never mid-game, invisible to kids). Struggling kids get easier runs (all-3-letter words, B/P-free phonics targets, A–J letter targets, smaller memory grids, 1-note starting sequences, 4 easy + 2 hard decoding rounds); thriving kids get stretched runs (more 4-letter words, confusable-distractor discrimination practice, bigger grids, longer frog sequences, 2 easy + 4 hard decoding rounds); with too few taps or the toggle off, the classic ladder is used. Same Settings → Adaptive Difficulty toggle; no new controls.
- **Replay Variety:** Items/shapes/animals shuffle per playthrough; difficulty stays fixed. *(Amended 2026-08-28: in the five early-numeracy games (How Many?, More or Less, Add It Up, Take Away, Number Order), the seven literacy & memory games - Find the Word, Build the Word, First Sounds, Find the Letter, Memory Match, Musical Memory, Decode It - and Color Match, Odd One Out and Pattern Builder, difficulty may now shift ±1 band per playthrough via Adaptive Difficulty above; the other seven games (Shape Sorter, Animal Trace, Pop & Freeze, Shadow Match, Big vs. Small, Feelings Faces, Story Order) remain fixed-difficulty, and Robot Path (2026-11-16) is fixed in the strongest sense: no adaptive dimension reaches it at all, because the child's own program is the difficulty.)*
- **Gentle Feedback:** Correct → pleasant chime + Graphics-based splash (no particle emitters). Incorrect → gentle "try again" animation, no penalty.
- **Per-Game Juice:** Each game layers playful animation reactions — drag pieces lift/tilt and snap home with a `Back.out` settle, boxes wiggle and bump, shadows stamp, animals hop, bubbles burst into droplets, frogs ripple — all reduced-motion-aware (gentler/shorter or disabled) and zero-penalty.

## 4. UX Principles

- **Touch-First Ergonomics:** Touch targets minimum 64×64px (ideal 96×96px) with inflated collision bounds.
- **Textless Visual Cues:** Zero text dependency for gameplay — all prompts are visual/audio. *(2026-08-02 amendment — Game 8:* letters are the learning content, not UI instructions; no written instructions appear anywhere. *)* *(2026-08-05 amendment — Game 11:* numerals are learning content too, displayed large and spoken aloud; the game is fully playable without reading anything. *)* *(2026-08-07 amendment — Game 12:* the spoken word is the prompt and letter cards are the answer set; both are learning content, no written instructions appear. *)* *(2026-08-08 amendment — Game 13:* the comparison word ("more"/"less") is the prompt, spoken aloud with a large up/down arrow cue; quantity comparison itself is the learning content, no written instructions appear. *)* *(2026-08-08 amendment — Game 14:* category, type, and color differences are the learning content; the TTS prompt names the odd item, no written instructions appear. *)* *(2026-08-08 amendment — Game 15:* color names are the learning content; the large swatch + spoken color name are the prompt, no written instructions appear. *) *(2026-08-09 amendment — Game 16:* early addition is the learning content; the two dot-group cards joined by a big "+" cue are the prompt, no written instructions appear. *) *(2026-08-10 amendment — Game 17:* early subtraction is the learning content; the two dot-group cards joined by a big "−" cue are the prompt, no written instructions appear. *) *(2026-08-11 amendment — Game 18:* visual working memory is the learning content; the face-down cards are the prompt and matching identical textures is the answer, no written instructions appear. *) *(2026-08-28 amendment — Game 19:* picture + spoken word is the prompt and written word cards are the answer set; letters are the learning content, no written instructions appear. *) *(2026-08-28 amendment — Game 20:* shuffled numeral cards are the prompt and ascending slot order is the answer; numerals are the learning content, no written instructions appear. *) *(2026-08-28 amendment — Game 20:* shuffled numeral cards are the prompt and ascending slot order is the answer; numerals are the learning content, no written instructions appear. *) *(2026-10-18 amendment - Spoken Rules:* the ten games that had no spoken prompt now show one short written rule line next to a speaker glyph, and speak it automatically. The rule is an *instruction*, not learning content: every answer set, prompt and target stays visual and spoken, so nothing has to be read in order to play. *) *(2026-10-20 amendment — Game 21:* the spoken everyday scenario is the prompt and the expression faces are the answer set; the one-line rule is the only instruction text, shown beside the speaker glyph, no written instructions appear. *)
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
- **PreloadScene:** Preloads SVG assets (rasterized at three tiers — icon 160px, card 256px, hero 512px), displays progress bar. Auto-transitions to Hub.
- **HubScene:** 24 game tiles grid (6×4 at 144px — rows 6/6/6/6) on wide viewports, collapsing to three pages of 5×2 (10 + 10 + 4) with swipe and page dots below the touch floor on phones, sticker shelf display, settings (behind parental lock), and the Professor Hoot mascot in the bottom corner. Six group chips sit in the top band — All, Letters, Numbers, Thinking, Play and Stories — and a chip redraws the board as that group's own games at 176×196, so any game is at most two taps away; the chip also speaks the group's name, and All is the landing state of every visit.
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
- **Per-game sonic identity** *(2026-10-21)*: the correct/incorrect/win cues are voiced per game — pitch, timbre, tempo and melodic contour from a central identity table — so each game sounds recognizably its own; pop/wake/sticker, the frog notes and BGM stay universal, and the incorrect cue remains a gentle descending tone in every game.
- **Synthesized frog notes (Web Audio API):** Game 5 notes (C4=261.63Hz, E4=329.63Hz, G4=392.00Hz)
- **BGM:** Single gentle ambient loop (`bgm.mp3`), toggleable via parental settings
- **Audio toggles:** BGM and SFX independently toggleable, persisted in localStorage
- **Audio focus:** narration always wins the foreground — the BGM ducks to 8% over a 120ms ramp while a prompt or rule is spoken and restores on its end (with a watchdog if the engine never reports one), and a hidden document pauses the BGM, cancels in-flight speech and stops the play clock rather than talking or spending budget in the background

## 9. Performance Targets

| Metric | Target |
|---|---|
| Frame rate | 60fps (min 30fps) |
| Boot time | < 3 seconds |
| Memory | < 150MB |
| Touch latency | < 16ms |
| Audio latency | < 50ms |
| Offline | Full gameplay after first install |

## 10. Roadmap

The roadmap moved to [conductor/roadmap.md](./roadmap.md) on 2026-11-24. It now
holds the phase history, exit gates, metrics, sequence, milestones, risks and
deliberate non-goals previously recorded here, together with the live intent
buckets (`Now` / `Next` / `Later` / `Dropped`). References to §10.x now point at
the correspondingly numbered sections in `conductor/roadmap.md`.

> Historical changelog entries moved to [docs/changelog.md](../docs/changelog.md) on 2026-11-23.
