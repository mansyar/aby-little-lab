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

Priority as of 2026-11-06. The engineering foundation is not the constraint: the
app is layered, registry-driven, measured and gated. What is missing is the
operating layer around it — a browser-level regression net, evidence that the
games still work for a child over weeks rather than minutes, content depth
behind the 24 mechanics, and a stated position on distribution, language and
accessibility. The sequence is therefore **trust → observability → depth →
reach**, and each phase is one or more Conductor tracks.

**Planning assumptions**

- One developer, part-time, with the existing Conductor workflow and gates.
- Distribution stays private/small — Phase 3 confirmed family-only on
  2026-11-20 (see §10.4).
- No accounts, no cloud sync, no third-party analytics; local-only data is a
  product property, not an implementation detail.
- Every phase ships through the existing gate (`check`, `typecheck`, `test`,
  `test:coverage`, `build`, `validate-bundle`, `validate-pwa`, `validate-docs`)
  plus whatever the phase adds.

### 10.1 Phase 0 — Trunk hygiene (1 day)

The trunk must be trustworthy before anything is planned on top of it. A suite
that rots on a calendar boundary teaches the team to ignore red.

| Track | Work | Exit gate |
|---|---|---|
| `20261106-trunk-green` | **Done 2026-11-07** (track `20261107-trunk-green`): all 29 date literals classified - 5 were clock stand-ins, converted to values derived from an explicit clock; 24 were payload data and stayed literal. A source-guard test now fails on a bare quoted day key assigned to `lastUsedDate`, the "no wall-clock values" rule is in `code_styleguides/typescript.md` §6, and the two 22-scene sweeps got a 60 s budget so the coverage gate stops tripping on a 30 s deadline. | `master` green on a fresh clone on a different day |
| `20261106-docs-truth-2` | **Done 2026-11-07** (absorbed into track `20261107-trunk-green`, commit `6cd2d85a`): the README's "Known Issues" is now the home for what is broken and carries only live items; `docs/roadmap.md` was deleted and every reference repointed at §10, so this section is the only roadmap. | No second roadmap copy survives in `docs/`; `validate-docs` green |
| `20261106-roadmap-adopt` | **Done 2026-11-07** (same commit): this section is the roadmap of record; the old file was deleted rather than kept as a pointer, and the two dated changelog mentions of it were left intact as history. | Roadmap carries dated, owned items; nothing else claims the title |

### 10.2 Phase 1 — Trust the build (2 weeks)

| Track | Work | Exit gate |
|---|---|---|
| `20261110-release-e2e` | **Done 2026-11-07** (track `20261107-release-e2e`): Playwright journey suite on the built artifact. 13 journeys across 12 specs: boot → hub → launch each of 22 games → three rounds on six games (drag, trace, tap-choice, letter, memory, sequence) → sticker award → back nav → 3 s parental hold vs 1 s press → settings persisted across reload → daily cap → offline relaunch. A read-only `?e2e=1` bridge is the only production-adjacent change; the suite is a separate CI job on two workers, 3.0 min of the 5 min budget. Running it found five defects the other gates could not see, including a chip that ate the first tap after a held back button. | `e2e` green on every PR; catches a deliberately broken hit area - **demonstrated**: a 1x1 tile hit area turns three journeys red while check, typecheck, 2,881 unit tests and the build stay green; ten consecutive runs green with retries 0 |
| `20261110-storage-resilience` | **Done 2026-11-07** (track `20261107-storage-resilience`): the save layer is total. Every access to the store goes through one guarded route; a refused read or write keeps the change in memory, raises a session flag and never reaches a scene, and the parental panel states the fact in one quiet line while it is raised. Eleven mutators and seven getters are covered at the unit layer, and a browser journey wins a game on a device whose writes throw, reloads into a degraded hub and reads the notice. | No unguarded `setItem`; a simulated quota failure never throws into a scene - **demonstrated**: 14 tests fail against the pre-fix `storage.ts` and pass after, and the browser journey shows the hub returning unaided while every write is refused |
| `20261110-toolchain-pinning` | **Done 2026-11-07** (track `20261107-toolchain-pinning`): `packageManager: pnpm@12.16.1` and `engines.node` declared in `package.json`, `.node-version` at 24, CI reading both (the pnpm action omits `version:` and follows `packageManager`), the Dockerfile built on `node:24-alpine`, the dead `pnpm-workspace.yaml` and unused `serve` removed, and a source-guard test holding the Dockerfile, both CI jobs, the README and the action allowlist to the declaration. CI also classifies each change: a documentation-only PR installs and runs `validate-docs`, nothing else, while both required checks still report. | CI and a fresh clone resolve identically; the docs validator checks the pin — **demonstrated**: a clean `pnpm install --frozen-lockfile` under the declared pnpm, a green `docker build`, and a deliberate version edit turning one guard assertion red |
| `20261110-edge-hardening` | **Done 2026-11-08** (track `20261108-edge-hardening`): four headers from one snippet included by the server block and all five cache locations, because nginx only inherits `add_header` into a location that declares none. The CSP is strict (thirteen directives, no `unsafe-*`); `img-src 'self' data: blob:` is the one measured concession — Phaser uploads canvas textures through `blob:` and the SVG art through `data:`, and removing either fails a journey. Proven by a container-booting validator that asserts headers **and** unchanged `Cache-Control` on every route class (21 checks), the full 16-journey suite run against the nginx origin, a guard test that fails if a future location forgets the include, and a CI step that errors rather than skips when Docker is missing. HSTS, COOP and CORP are deliberately out of scope, with reasons in the TDD. | Headers present on every route including 404s; install and update still work - **demonstrated**: removing one location's include serves that route with no policy while every other route stays green, and dropping `data:` turns `boot` red |

Every later phase touches scenes, assets or storage; without a browser layer
each of those changes is blind.

### 10.3 Phase 2 — Product operations (3 weeks)

The phase that turns a well-built toy into a product that can be reasoned about.
All instrumentation is local, capped, prunable, and leaves the device only when a
parent explicitly exports it.

| Track | Work | Exit gate |
|---|---|---|
| `20261124-local-insights` | **Done 2026-11-08** (track `20261108-local-insights`): one pure summary built from the aggregates that already existed, plus a five-field per-profile record holding what they cannot — the streak, its best, and the days the daily cap was reached (backfilled at zero, `SCHEMA_VERSION` still 1). The Progress overlay now opens on an Overview page: this week's reach and lifetime completions, overall accuracy with the strongest and hardest game above a ten-tap floor, and the streak and cap history. No event ring buffer was needed — the existing counters plus two new ones answer the question, so none was built. Adaptive-band spread is not on this page yet; it belongs with Phase 4's adaptive work. | A parent can answer "what is being played, and is it working" in under 30 seconds - **demonstrated**: a journey seeds a week of history, holds the parental gate, opens Progress and reads all three statements on page one, in about ten seconds |
| `20261124-backup-restore` | **Done 2026-11-08** (track `20261108-backup-restore`): Settings has a second page. Save writes a dated `.json` file whose envelope carries the format tag, the save schema version, the app version, the export time and a checksum over the payload; Restore verifies a picked file and asks merge or replace before writing anything. Merge is best-of-field — the earned sticker wins, the higher counters win, the later stamp wins — so importing the same file twice changes nothing. Six named refusals cover a damaged file, a foreign one, a newer layout, a newer save, a bad checksum and a save that would exceed four profiles, and each states its own sentence on the page. The checksum detects corruption, not tampering: the file holds star counts, not secrets, and the seam never leaves the device. | A round trip to a second device loses nothing — **demonstrated**: a journey exports through the real download, hands the file that landed on disk to a *second browser context*, merges it, and reads both stickers, the progress and the streak back after the reload, with the game still playable. Two limits accepted: a profile id collision merges two children as one, and the file is not encrypted |
| `20261124-error-capture` | **Done 2026-11-08** (track `20261108-error-capture`): two global handlers (`error`, `unhandledrejection`) record an uncaught failure as `{ at, kind, message, stack }` in a device-level log at the existing schema version 1, bounded at twenty entries and 400 stack characters - a 16,000-byte ceiling, measured at 13,461 for twenty maximal entries (Amended 2026-11-08 by the review round: bounding the message as well - `MAX_MESSAGE_CHARS` 200, applied on write and on read - moved the enforced ceiling to 16,000 bytes and the measured worst case to 13,461. The earlier 12,000 / 9,612 figures bounded only the stack, so they were a property of the fixture rather than of the code.). A crash replaces the broken scene with an icon-only card (the mascot and one arrow, no words a four-year-old cannot read); a crash before the canvas exists spends one session-guarded reload and never a second. **One deliberate deviation from the roadmap:** it said "Copy diagnostics", and this ships a dated `diagnostics-<day>.txt` download instead, because a clipboard write cannot be proved by a test and a file can be emailed from a phone. The log still never leaves the device except through that download, and the download seam now takes a MIME type so one anchor serves both the backup envelope and the report. | A crash yields a shareable, human-readable trace - **written and green in the unit layer, demonstrated by the journey once CI runs it**: `crash.spec.ts` throws a real error inside the page, waits for the card to replace the scene, taps the card's published button, lets the page reload itself with no `page.reload()` anywhere, plays a game, then downloads the log and reads the thrown message and the environment header back out of the file |

**Metrics this unlocks** - every figure below is read per profile, on the device,
by opening Progress. Nothing is transmitted and nothing is aggregated; where the
Overview does not yet report a metric, the row says so rather than guessing:

| Metric | Today | Target |
|---|---|---|
| Game completion rate (start → 3 rounds) | reported on the Overview page as a share of started sessions; no device-wide figure exists | ≥ 80% |
| Distinct games per session | the page reports distinct games this week, not per session | ≥ 4 |
| Adaptive band movement | not surfaced yet - Phase 4's adaptive work adds it | 60% of profiles move ≥ 1 band within 2 weeks |
| Uncaught errors per 100 sessions | readable per device from the diagnostics file: every entry carries a moment, a kind and a message, newest first, up to twenty - so a parent can count this week's crashes on one device; still no rate across devices, because nothing is transmitted | < 1 |
| Day-7 return (local proxy) | the 7-day strip shows reach, not retention; a return rate needs a longer history than a profile holds | ≥ 40% |

### 10.4 Phase 3 — Product-intent gate (1 week)

One decision unlocks or cancels Phases 4–5. Record it; scope must stop being
implicit. Deliverable: `docs/product-intent.md`.

1. **Audience** — family-only, small private distribution, or public release?
2. **Accessibility scope** — is "touch-only, sighted, textless" a documented
   stance (defensible and honest) or a gap to close (keyboard/switch access,
   OS zoom)?
3. **Language** — English permanently, or is a second locale a goal?
4. **Legal posture** — LICENSE, `bgm.mp3` provenance, COPPA/GDPR-K statement,
   store privacy labels.

Building i18n and store packaging for a family-only app is months of waste;
shipping publicly without these answers is a legal and reputational risk.

**Done 2026-11-20** (track `20261120-product-intent-gate`). The four decisions
are recorded in [docs/product-intent.md](../docs/product-intent.md): family-only
audience; touch-only, sighted, textless, landscape as a documented stance
(no keyboard/switch access or OS zoom work); English permanently, with i18n and
a second locale not goals; and a full public-release legal posture with the
artifacts prepared but not submitted. The untraceable BGM loop was replaced with
a CC0-licensed one, attributed in
[docs/audio-attribution.md](../docs/audio-attribution.md). Consequence: Phase 5
reach is cancelled, Phase 4 depth is next.

### 10.5 Phase 4 — Depth & retention (4–6 weeks, content-led)

Breadth is already 22 games; the retention risk is pool thinness, not game
count. Content work must stay inside the current texture tiers and per-game
chunk budget — retention may not be bought with memory. The `validate-textures.js`
guard enforces this in CI: on 2026-11-21 the caps were re-baselined to 80 MiB
typical / 320 MiB full (real assets 74.57 / 313.00 MiB) with a hard
`typical ≤ full/2` ratio, superseding the earlier 39 / 178 MiB figures from the
2026-10-17 measurement (see `docs/perf-baseline.md`).

| Track | Work | Exit gate |
|---|---|---|
| `20261208-content-depth` — Done 2026-11-21 (track `20261121-content-depth`; see `docs/perf-baseline.md`) | Words 28 → 60 (27 three-letter / 33 four-letter), stories 15 → 30 (15 obvious / 15 subtle; 90 panels), scenarios 32 → 48 (12 per emotion), shapes 18 → 24; two signature variants per pool | Machine-checked: seeded no-repeat playthrough tests across all four games + `validate-textures.js` guard (80/320 MiB caps, ratio ≤ 0.5) in `verify_phase` |
| `20261208-replay-novelty` — Done 2026-11-24 (track `20261124-replay-novelty`) | Session-level variety policy (no immediate repeats) via a per-visit in-memory selector (unplayed → least-recently played → registry order), a textless Professor Hoot suggestion cue, the same no-repeat selector driving the idle wiggle, and one earned-sticker shelf spotlight per visit with an empty-slot fallback | Machine-checked: 1,200 seeded eight-play visits with median distinct games ≥ 4, zero unexpected immediate repeats, and per-profile reset tests; full `verify_phase` green |
| `20261208-adaptive-tuning` — Done 2026-11-24 (track `20261124-adaptive-tuning`) | Retune the bands via seeded simulation of the designed 70/15/15 curve (`UP_THRESHOLD` 0.9 / `DOWN_THRESHOLD` 0.5); parent view of the viewed profile's band in Learning Progress | Band distribution matches the designed curve; full `verify_phase` green |

### 10.6 Phase 5 — Reach (4–6 weeks, gated by Phase 3) — Cancelled 2026-11-20

Only if Phase 3 says "public" or "second language". Phase 3 chose family-only
and English permanently, so the precondition is not met. The table below is kept
as history, not as planned work; Phase 4 depth and Phase 6 sustainability are
the path forward.

| Track | Work | Exit gate |
|---|---|---|
| `20270105-i18n-seam` | Extract strings and narration manifests; per-locale asset bundles; RTL-safe layout audit; one pilot locale | A second locale ships without touching game logic |
| `20270105-accessibility-execution` | Either publish the touch-only stance in this document and the README, or add keyboard/switch input and restore OS zoom | The decision is visible to a user, not just in code |
| `20270105-store-packaging` | TWA/Capacitor wrapper, store assets, privacy statement, review checklist | Installable from a store listing |
| `20270105-licensing` | LICENSE, audio attribution, third-party notices | Every shipped asset has a traceable right |

### 10.7 Phase 6 — Sustainability (continuous)

| Item | Cadence | Why |
|---|---|---|
| Module size budget in `workflow.md` (400 warn / 600 fail, strict, no allowlist) — **Done 2026-11-23** (track `20261123-release-v1-25-0`) | once, then enforced | 13 oversized production modules split; `prewarm.ts` is no longer a god-file |
| Split changelogs out of `product.md` and `tech-stack.md` into `docs/changelog.md` — **Done 2026-11-23** (track `20261123-release-v1-25-0`) | once | entries moved verbatim; pointers left in both docs |
| Dependency-majors track | monthly | one already shipped on 2026-10-27; make it routine |
| Perf baseline per release, first-tap p95 measured headed | per release | closes the 400ms KPI that the README admits is unproven |
| Browser matrix (iOS Safari, Android Chrome, Fire tablet) | per release | automates what is currently a manual device checklist |

### 10.8 Sequence and milestones

```
P0 trunk (1d) → P1 trust (2w) → P2 ops (3w) → P3 intent gate (1w)
                                                   │
                                  ┌────────────────┴────────────────┐
                                  ▼ family-only                     ▼ public
                            P4 depth (4–6w)                  P4 depth (4–6w)
                            P6 sustain (ongoing)             P5 reach (4–6w)
                                                             P6 sustain (ongoing)
```

**Outcome 2026-11-20:** the family-only branch was taken — Phase 5 reach is
cancelled, and the path is Phase 4 depth followed by Phase 6 sustainability.

| Milestone | Approx. version | When |
|---|---|---|
| Trunk trustworthy | patch | day 1 |
| CI has a browser layer | v1.24.0 | ~2 weeks |
| A parent can see and move their data | v1.25.0 | ~6 weeks |
| Content depth landed — **Done 2026-11-21** (track `20261121-content-depth`) | v1.26.0 | ~12 weeks |
| Public-release candidate | v2.0.0 | ~4.5 months |

### 10.9 Roadmap risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| The E2E suite turns flaky and gets disabled | High | Journeys, not unit assertions; retry ≤ 1; quarantine policy; state-based waits only |
| Content expansion blows the texture budget | Medium | Per-game art budget validated in CI before merge |
| Phase 3 never happens and scope stays implicit | Medium | Closed 2026-11-20: the gate ran and its decisions are recorded in `docs/product-intent.md` |
| Retention is optimised against a noisy proxy | Medium | Treat Phase 2 numbers as directional; confirm with a handful of real families |
| Toolchain pinning breaks a contributor's setup | Low | Pin in CI first, then Docker, then docs |
| The accessibility stance is deferred indefinitely | Medium | Closed 2026-11-20: touch-only, sighted, textless, landscape published as a documented stance in README and `docs/product-intent.md` |

### 10.10 Deliberately not doing

Cloud sync and accounts (breaks the privacy posture and the offline guarantee) ·
real-time multiplayer · more games before deeper pools · third-party analytics or
crash SDKs · runtime AI content · a native rewrite · keyboard support (Phase 3
decided against it on 2026-11-20) · migrating the `abby-` storage key (permanent
but harmless).

> Historical changelog entries moved to [docs/changelog.md](../docs/changelog.md) on 2026-11-23.
