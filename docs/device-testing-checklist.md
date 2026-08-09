# Device Testing Checklist for Aby's Little Lab

## Overview

This checklist ensures comprehensive testing across target devices before release.

## Execution Record — v1.13.0 (2026-08-09)

- **Target:** live URL `https://aby-little-lab.ansyar-world.top/` (v1.13.0 — Games 15 & 16 + Perf/Bundle Hardening + Parent Progress Insights)
- **Scope:** Game 15 (Color Match), Game 16 (Add It Up), Performance & Bundle Hardening spot-check (vendor code-split, coverage guardrail, boot profiling) — see `docs/perf-baseline.md`; Parent Progress Insights (per-profile Learning Progress report) — see the track archived at `conductor/archive/parent-progress-insights_20260809/` *(folded into v1.13.0 by user decision; the former v1.14.0 draft record below is superseded)*
- **Devices:** Android tablet (Android 10+, preferred), iPad (iPadOS 15+), iPhone (iOS 15+), Android phone (Android 10+)
- **Checks:** v1.13.0 perf rows — app reaches the Hub within 3 s of launch on a cold load (reference profile: 1080 ms desktop preview; raster pipeline 641 ms dev-measured); the shell (index-*.js ≤ 200 kB) and the Phaser vendor chunk (phaser-*.js) load as two separate requests with no monolithic entry chunk; a game tile launches and returns to the Hub normally (scene lazy-chunks intact after the split); the PWA update flow still works — when a new build is deployed the update prompt appears after reload and applying it serves the new version (registerType "prompt" path unchanged); offline re-play — after a full load with network on, switching to airplane mode and relaunching still boots the game from the service-worker precache (34 entries incl. phaser chunk). **v1.13.0 game rows — Color Match:** Hub shows 16 tiles in a 5×3 + 1 grid (rows 5/5/5/1 — row 4 holds 1 left-aligned Add It Up tile; no clipping; tile_color_match icon distinct: 2×2 swatch cards with a white star on the red card); Color Match starts with a spoken color name on the first tap of a fresh load (iOS TTS gesture unlock) + speaker replay button; 6 rounds per play; each round shows a large color swatch (rounded rect, thick dark outline) and exactly 4 cards in a 2×2 grid — 4 distinct colors, one matching the swatch (rounds 1–3 from the 4-color pool, rounds 4–6 from the 6-color pool); correct tap → chime + green card flash + mascot cheer + progress dot pop → next round in ~0.7s; wrong tap → gentle wiggle ±4° + mascot nod, no penalty; win after round 6 → confetti + rays + sticker (first completion only, `color-match`) + 3s auto-return with just-earned highlight; replay shows sticker already earned, no re-award; speaker replay never crashes during the 3s win celebration. **Add It Up:** tile_add_it_up icon distinct (two dot-cards + chunky plus, highlighted answer card); each round shows an equation row — two 180px dot-group cards joined by a big "+" cue with an "=" cue at the end (no speech, no speaker button); 4 interactive answer cards (~170px, ≥96px touch) with dot-groups of distinct candidate totals in [1..bandMax], exactly one equals the target; 6 rounds easy-first — rounds 1–2 sums ≤ 4, rounds 3–4 sums ≤ 6, rounds 5–6 sums ≤ 10; the two addend cards always use two distinct item types and the 4 answer cards share a single item type; addend pairs never repeat within a playthrough; correct tap → chime + green card flash + mascot cheer + progress dot pop → next round in ~0.7s; wrong tap → gentle wiggle + mascot nod, no penalty; win after round 6 → confetti + rays + sticker (first completion only, `add-it-up`) + 3s auto-return with just-earned highlight; replay shows sticker already earned, no re-award; Add It Up is fully playable with the SFX toggle off (purely visual). Carried rows per the v1.12.0 record — TTS Voice Selection (all 10 rows), 14-tile→16-tile hub layout, Odd One Out / More or Less / How Many? / First Sounds / Word games / Find the Letter / Pattern Builder / Musical Memory / Pop & Freeze / Big vs Small / Animal Trace / Shape Sorter spot checks, sticker persistence, play-time limits spot check, parental hold-3s Back, reduced-motion.
- **Result:** reference-profile executed 2026-08-09 (desktop Chromium, playwright-cli) — boot 1080.7 ms (< 3 s), shell + phaser chunks confirmed as separate requests, no console errors beyond pre-existing favicon 404; **device-class execution pending — user-led, to run against the live URL after the v1.13.0 release**
- **Issues found:** none on reference profile (no Critical/High/Medium/Low)

## Execution Record — v1.14.0 (2026-08-09) — SUPERSEDED

> **Superseded by v1.13.0:** Parent Progress Insights was folded into the v1.13.0 release by user decision (the code was already on master). The progress-report rows below are carried into the v1.13.0 record above — **do not execute separately for a v1.14.0 release** (no v1.14.0 release is planned; the v1.14.0 draft release notes are superseded too).

- **Scope:** Parent Progress Insights (per-profile Learning Progress report) — see the track archived at `conductor/archive/parent-progress-insights_20260809/`
- **Devices:** iPad (iPadOS 15+), Android tablet (Android 10+), iPhone (iOS 15+), Android phone (Android 10+)
- **Checks:** v1.14.0 progress-report rows — Settings shows a "Progress" row between Profiles and Reset; holding the row opens the Learning Progress overlay (header + X close); fresh install shows 8 rows on page 1 with "0 plays · — · —" and grey accuracy bars (no crash on old saves without progress fields); playing a game once updates the row to "1 plays · 100% · Today" with a full green bar; winning the same game 3 times adds the ★ mastery star; More/Back page through all 16 rows ("1 / 2" → "2 / 2"); the 7-day strip at the bottom counts up (bar height grows with plays); switching the avatar chip shows the sibling profile's report without switching the active profile (active-profile sticker/play-time behavior unchanged); X and backdrop tap both close the overlay and the Settings panel remains fully usable; all overlay rows/chips are ≥64 px touch targets; report updates are visible immediately after returning from a game without reloading
- **Result:** folded into the v1.13.0 record (pending user-led execution)

## Execution Record — v1.12.0 (2026-08-08)

- **Target:** live URL `https://aby-little-lab.ansyar-world.top/` (v1.12.0 — TTS Voice Selection)
- **Devices:** iPad (iPadOS 15+), Android tablet (Android 10+), iPhone (iOS 15+), Android phone (Android 10+)
- **Checks:** Carried rows — v1.11.0 record (Hub 14 tiles 5×3 row 3 = 4 left-aligned; Odd One Out 2×2 grid 3 identical + 1 distinct, spoken prompt + speaker replay, 6 rounds easy-first bands, correct flash/chime/dot-pop 700ms, wrong wiggle no penalty, sticker first-only + replay no re-award, SFX-off, reduced-motion; More or Less arrow renders after hotfix; plus prior carried rows per the v1.11.0/v1.8.0 records — Animal Trace relaunch freshness, Shape Sorter progress dots, Pattern Builder 6 rounds, Word Match easy-first, Find the Letter splash, Word Builder ghost tiles + duplicate letters, Musical Memory max-2-in-a-row, Pop & Freeze edge bounce, Big vs Small swapped sides, How Many distinct counts + centered partial rows, Back-hold during auto-return never double-navigates, sticker persistence, play-time limits spot check) and the 10 TTS Voice Selection rows below. v1.12.0 rows — Voice row shows "Voice: Default (device)" on a fresh install (no stored preference); tapping the voice chip cycles through installed voices (all languages listed, no en-US gate) and wraps back to "Default (device)"; long voice names are truncated in the chip (readable, no overflow); "Preview" button speaks "Hi! I can talk." with the currently selected voice when SFX is on; "Preview" is silent when the SFX toggle is off (parity with prompt speech); selected voice persists after app close/reopen (device-level, shared across profiles); choosing "Default (device)" restores the browser-default voice; all 7 speech games (Find the Letter, Find the Word, Build the Word, How Many?, First Sounds, More or Less, Odd One Out) use the selected voice; when the stored voice no longer exists on the device, speech falls back to the default silently (no error, no visual regression); voice chip + preview buttons are ≥64px touch targets
- **Result:** **all items passed on all 4 device classes** — iPad (iPadOS 15+), Android tablet (Android 10+), iPhone (iOS 15+), Android phone (Android 10+) — executed 2026-08-08 against the live URL (all 10 TTS Voice Selection rows passed on all device classes)
- **Issues found:** none (no Critical/High/Medium/Low)

## Execution Record — v1.11.0 (2026-08-08)

- **Target:** live URL `https://aby-little-lab.ansyar-world.top/` (v1.11.0 — Game 14 Odd One Out)
- **Devices:** iPad (iPadOS 15+), Android tablet (Android 10+), iPhone (iOS 15+), Android phone (Android 10+)
- **Hotfix (2026-08-08):** during the v1.11.0 live smoke, the More or Less comparison arrow rendered as a small square (texture-key mismatch — textures registered as `arrow_up`/`arrow_down` while the scene looks up `arrow_more`/`arrow_less`). Fixed in hotfix `828f9e0`, tag amended + redeployed, arrow verified rendering live. Include the arrow in the More or Less checks below.
- **Checks:** Carried rows — v1.10.0 record (Hub 13 tiles 5×3; More or Less storybook arrow UP=more/DOWN=less + spoken comparison word + easy-first bands 1–3/1–5/1–10 + exactly 3 "more" + 3 "less" prompts shuffled + distinct counts per round + correct-tap chain ~0.7s + wrong-tap wiggle no penalty + ~48px counting items with centered partial rows + speaker replay guard during win + win celebration + sticker first-only + replay no re-award) and v1.8.0 record (First Sounds 6 rounds × 4 letter cards, confusion guards, iOS TTS unlock, speaker replay guard, correct-tap chain, wrong-tap no penalty, sticker + auto-return, replay, parental hold-3s Back, SFX-off, reduced-motion; plus prior carried rows per the v1.8.0/v1.7.0 records — Animal Trace relaunch freshness, Shape Sorter progress dots, Pattern Builder 6 rounds, Word Match easy-first, Find the Letter splash, Word Builder ghost tiles + duplicate letters + ~132px tiles, Musical Memory max-2-in-a-row + 480ms notes + replay input reset, Pop & Freeze edge bounce, Big vs Small swapped sides, How Many distinct counts + centered partial rows, Back-hold during auto-return never double-navigates, sticker persistence after close/reopen, play-time limits spot check). v1.11.0 rows — Hub shows 14 tiles in a 5×3 grid (row 3: 4 tiles left-aligned — How Many?, First Sounds, More or Less, Odd One Out — no clipping, tile_odd_one_out icon distinct: 2×2 mini-cards with one orange triangle among blue circles); Odd One Out starts with a spoken prompt naming the odd item on the first tap of a fresh load (iOS TTS gesture unlock); 6 rounds per play; each round shows exactly 4 cards in a 2×2 grid — 3 identical + 1 distinct (~256px cards, all ≥96px touch targets); easy-first bands — rounds 1–2 cross-category (odd category ≠ group category), rounds 3–4 same-category different item (three cats + a dog, three stars + a circle), rounds 5–6 frog color variants (three green frogs + a blue frog); the odd item is unique across all 6 rounds of a play; speaker replay button (~96px hit area) re-speaks the odd item's name on demand and never crashes during the 3s win celebration; correct card tap → chime + green card flash + mascot cheer + progress dot pop → next round in ~0.7s; wrong card tap → gentle wiggle ±4° + mascot nod, no penalty, no progression loss; win after round 6 → confetti + rays + sticker (first completion only) + 3s auto-return with just-earned highlight; replay shows sticker already earned; SFX-off silences the spoken prompt with visual-only play; reduced-motion respected (gentler wiggle, shorter durations)
- **Result:** **all items passed on all 4 device classes** — iPad (iPadOS 15+), Android tablet (Android 10+), iPhone (iOS 15+), Android phone (Android 10+) — executed 2026-08-08 against the live URL (includes the hotfixed More or Less arrow)
- **Issues found:** none (no Critical/High/Medium/Low)

## Execution Record — v1.10.0 (2026-08-08)

- **Target:** live URL `https://aby-little-lab.ansyar-world.top/` (v1.10.0 — Game 13 More or Less)
- **Devices:** iPad (iPadOS 15+), Android tablet (Android 10+), iPhone (iOS 15+), Android phone (Android 10+)
- **Checks:** Carried v1.8.0 rows — Hub 12 tiles 5×3 (row 3: 2 tiles left-aligned, tile_first_sounds distinct); First Sounds spoken prompt + iOS TTS unlock; 6 rounds × 4 letter cards with confusion guards; correct-tap feedback chain; wrong-tap no penalty; speaker replay guard during win; win celebration + sticker + auto-return; replay no re-award; parental hold-3s Back; SFX-off visual-only; reduced-motion respected; Animal Trace relaunch freshness + waypoint ring; Shape Sorter relaunch progress dots; Pattern Builder 6 rounds + splash; Word Match easy-first; Find the Letter splash; Word Builder ghost tiles + duplicate letters + ~132px tiles; Musical Memory max-2-in-a-row + 480ms notes + replay input reset; Pop & Freeze edge bounce; speaker guarded during win (all speech games); Big vs Small swapped sides; How Many distinct counts + centered partial rows; Back-hold during auto-return never double-navigates; sticker persistence after close/reopen; play-time limits spot check. v1.10.0 rows — Hub shows 13 tiles in a 5×3 grid (row 3: 3 tiles left-aligned — How Many?, First Sounds, More or Less — no clipping, tile_more_less icon distinct); More or Less starts with a big storybook arrow (UP = more, DOWN = less) popping in on the first tap of a fresh load (iOS TTS gesture unlock) with the comparison word spoken; 6 rounds per play; each round shows exactly 2 group cards with different counts (easy-first bands 1–3 / 1–5 / 1–10); exactly 3 "more" + 3 "less" prompts per play, shuffled; correct group tap → chime + green card flash + mascot cheer + progress dot pop → next round in ~0.7s; wrong group tap → gentle wiggle ±4° + mascot nod, no penalty, no progression loss; counting items render at ~48px with partial last rows centered; speaker replay button (~96px hit area) re-speaks "more"/"less" and never crashes during the 3s win celebration; win after round 6 → confetti + rays + sticker (first completion only) + 3s auto-return with just-earned highlight; replay shows sticker already earned; parental hold-3s Back exits to Hub; SFX-off silences speech and SFX with visual-only play; reduced-motion respected
- **Result:** **pending — to be executed against the live URL after deploy**
- **Issues found:** pending

## Execution Record — v1.8.0 (2026-08-08)

- **Target:** live URL `https://aby-little-lab.ansyar-world.top/` (v1.8.0 — Game 12 First Sounds)
- **Devices:** iPad (iPadOS 15+), Android tablet (Android 10+), iPhone (iOS 15+), Android phone (Android 10+)
- **Checks:** Carried v1.7.0 rows — Animal Trace relaunch freshness + waypoint ring, Shape Sorter relaunch progress dots, Pattern Builder 6 rounds + splash, Word Match easy-first 3-letter words, Find the Letter splash, Word Builder ghost tiles + duplicate letters (BALL) + ~132px tiles, Musical Memory max-2-in-a-row + 480ms notes + replay input reset, Pop & Freeze bounce at the visible edge, speaker guarded during the win celebration (all speech games), Big vs Small swapped sides, How Many distinct counts + centered partial rows, Back-hold during auto-return never double-navigates, sticker persistence after close/reopen, play-time limits spot check. v1.8.0 rows — Hub shows 12 tiles in a 5×3 grid (row 3: 2 tiles left-aligned, no clipping, tile_first_sounds icon distinct); First Sounds starts with a spoken word prompt on the first tap of a fresh load (iOS TTS gesture unlock); 6 rounds per play; each round shows exactly 4 letter cards with the target word spoken; correct letter tap → chime + letter pulse + spoken letter name + spoken word + progress dot; wrong letter tap → gentle bounce with no penalty and no progression loss; confusion guards hold in every round (no B/P or D/T pair together; no visually confusable family mix [C/G/O/Q, I/L/T, M/W] together); speaker replay button (~96px hit area) re-speaks the prompt and never crashes during the 3s win celebration; win after round 6 → confetti + rays + sticker (first completion only) + 3s auto-return with just-earned highlight; replay shows sticker already earned; parental hold-3s Back exits to Hub; SFX-off silences speech and SFX with visual-only play; reduced-motion respected
- **Result:** **all items passed on all 4 device classes** — iPad (iPadOS 15+), Android tablet (Android 10+), iPhone (iOS 15+), Android phone (Android 10+) — executed 2026-08-08 against the live URL
- **Issues found:** none (no Critical/High/Medium/Low)

## Execution Record — v1.7.0 (2026-08-07)

- **Target:** live URL `https://aby-little-lab.ansyar-world.top/` (v1.7.0 — replay/session bug fixes, gameplay depth, consistency pass)
- **Devices:** iPad (iPadOS 15+), Android tablet (Android 10+), iPhone (iOS 15+), Android phone (Android 10+)
- **Checks:** Carried v1.6.0 rows — Hub 11 tiles 5×3, sticker shelf + play-time arc, How Many? end-to-end, Play-Time Limits, sticker persistence, reduced-motion. v1.7.0 rows — Animal Trace: relaunch after a full session starts fresh at path 1 of 3 (no instant win), relaunch mid-session starts fresh with no crash, next waypoint pulses with a ring and visited dots light up green; Shape Sorter: after a completed 3-round session, relaunch fills progress dots again (no stale dots); Pattern Builder: 6 rounds per play (was 5), relaunch after win fills fresh progress dots, correct card bursts a splash at the gap; Word Match: playthrough leads with 3-letter words (easy first), correct card bursts a splash; Find the Letter: correct card bursts a splash; Word Builder: correct tile flies its letter into the slot and the tile dims into a ghost, duplicate-letter words (BALL) keep the tile tappable for the second use with a thunk, tiles render ~132px (above the 64px floor at phone FIT scale), speaker during the 3s win celebration doesn't crash; Musical Memory: no frog plays more than twice in a row, sequences of 5+ notes play at 480ms per note, replaying the sequence resets input so the first correct tap after a re-listen is judged right; Pop & Freeze: bubbles bounce at the visible edge (physics body matches the 96px bubble, no ~208px phantom wall), speaker during win celebration doesn't crash (all four speech games); Big vs Small: big/small boxes swap sides between plays; How Many: two rounds of each band show different target counts, partial last item rows are centered; Back-hold during auto-return never double-navigates (all games)
- **Result:** **all items passed on all 4 device classes** — iPad (iPadOS 15+), Android tablet (Android 10+), iPhone (iOS 15+), Android phone (Android 10+) — executed 2026-08-07 against the live URL
- **Issues found:** none (no Critical/High/Medium/Low)

## Execution Record — v1.6.0 (2026-08-06)

- **Target:** live URL `https://aby-little-lab.ansyar-world.top/` (v1.6.0 — Shape Sorter 18-shape multi-round, UI/UX hardening, TTS fixes, 142-asset SVG polish)
- **Devices:** iPad (iPadOS 15+), Android tablet (Android 10+), iPhone (iOS 15+), Android phone (Android 10+)
- **Checks:** Carried v1.5.0 rows — Hub shows 11 tiles in a 5×3 grid (no clipping, labels readable, sticker shelf + play-time arc fit); How Many? end-to-end — large spoken numeral at round start, 3 cards in rounds 1–2 and 4 cards (2×2) in rounds 3–6, correct tap flashes green with chime + cheer + progress dot and advances in ~0.7s, wrong tap wiggles with no penalty and no progression loss, win after 6 rounds → confetti + rays + sticker (first completion only) + 3s auto-return with just-earned highlight, replay shows sticker already earned, SFX-off silences the spoken number with visual-only play, parental hold-3s exits to Hub; Play-Time Limits — Settings → Profiles Play Time chip cycles Off/15/30/45/60, remaining-budget arc shows and turns warm at ≤5 min, 2s hourglass nudge before starting near the limit, Time's Up dims + locks tiles with moon badge and no mid-game cutoff, budget resets next day, per-profile isolation; sticker persistence after close/reopen; reduced-motion behavior. v1.6.0 rows — Shape Sorter: 18 distinct shapes with matching cutout slots, 3 rounds × 3 shapes per session, progress dots above the slots fill with a pop per round, round re-init after ~1.2s, win + sticker only after round 3, replay draws a fresh 9-shape session; Speaker replay buttons re-speak the prompt in Find the Letter / Find the Word / Build the Word / How Many? (Musical Memory replay shows the same icon); TTS speaks on the first tap of a fresh load (iOS unlock) with no dropped prompts; Visual pass — storybook tile icons are distinct per game, Baloo 2 rounded font renders everywhere, letters/numerals legible (system-font versions), stickers/tiles polished with no dashed placeholder artifacts; Settings readability (30–36px fonts, version footer under the title, pinch-zoom while open); PWA update path from v1.5.0 — update toast appears, Update now loads the new version, offline play still works after the update
- **Result:** **all items passed on all 4 device classes** — iPad (iPadOS 15+), Android tablet (Android 10+), iPhone (iOS 15+), Android phone (Android 10+) — executed 2026-08-06 against the live URL
- **Issues found:** none (no Critical/High/Medium/Low)

## Execution Record — UI/UX Hardening spot-check (2026-08-06)

- **Target:** local dev/build of the post-1.5.0 codebase (UI/UX Hardening track, archived at `conductor/archive/uiux-hardening_20260805/`)
- **Devices:** phone + tablet (landscape)
- **Checks:** all 11 Hub tiles show a distinct storybook icon (textless differentiators) with a smaller secondary label; Baloo 2 rounded font renders everywhere (no Courier); unearned sticker slots show dashed empty-slot outlines; Find the Letter target + cards render the letter SVG textures matching the Word games' letterforms; speaker replay buttons re-speak the prompt in Find the Letter / Find the Word / Build the Word / How Many? and Musical Memory's replay is the same icon; idle-attract chime is audible on a fresh load after any first touch; Settings fonts are larger (30–36px) with the version footer under the title (no install-row overlap) and pinch-zoom works while Settings is open; Preload shows the brand lockup; idle attract wiggles only two tiles; win sticker pops after the confetti; Shadow Match objects are slightly larger
- **Result:** all items passed
- **Issues found:** none (no Critical/High/Medium/Low)

## Execution Record — v1.5.0 (2026-08-05)

- **Target:** live URL `https://aby-little-lab.ansyar-world.top/` (v1.5.0 — Play-Time Limits + Game 11 How Many?)
- **Devices:** iPad (iPadOS 15+), Android tablet (Android 10+), iPhone (iOS 15+), Android phone (Android 10+)
- **Checks:** Hub shows 11 tiles in a 5×3 grid (no clipping, labels readable, sticker shelf + play-time arc fit); How Many? end-to-end — large spoken numeral at round start, 3 cards in rounds 1–2 and 4 cards (2×2) in rounds 3–6, each card shows N copies of one item with distinct item types per round, correct tap flashes green with chime + cheer + progress dot and advances in ~0.7s, wrong tap wiggles with no penalty and no progression loss, win after 6 rounds → confetti + rays + sticker (first completion only) + 3s auto-return with just-earned highlight, replay shows sticker already earned, SFX-off silences the spoken number with visual-only play, parental hold-3s exits to Hub; Play-Time Limits — Settings → Profiles Play Time chip cycles Off/15/30/45/60, remaining-budget arc shows and turns warm at ≤5 min, 2s hourglass nudge before starting near the limit, Time's Up dims + locks tiles with moon badge and no mid-game cutoff, budget resets next day, per-profile isolation; sticker persistence after close/reopen; reduced-motion behavior
- **Result:** **covered by the v1.6.0 execution (2026-08-06)** — all carried rows passed on all 4 device classes against the live URL
- **Issues found:** none (no Critical/High/Medium/Low)

## Execution Record — v1.4.0 (2026-08-04)

- **Target:** local preview build of the v1.4.0 codebase (Multi-Kid Profiles, post-v1.3.0)
- **Devices:** iPad (iPadOS 15+), Android tablet (Android 10+), iPhone (iOS 15+), Android phone (Android 10+)
- **Result:** All Multi-Kid Profiles checks passed — Hub avatar chip top-left (≥96px touch target, textless), chip tap opens the profile picker without a parental hold, ≥96px avatar tiles with the active profile scaled up, switching profiles re-renders the sticker shelf instantly, overlay tap closes cleanly with no stale input lock, Settings → Profiles behind the 3-second hold, add profile from unused avatars only, "Profile limit reached" at 4 profiles, two-step delete confirmation (Cancel keeps, Delete removes with active-profile fallback), last profile deletion recreates the default, per-profile sticker isolation (each profile's shelf shows only its own stickers), persistence after close/reopen, automatic v1 → first-profile migration with no prompts, BGM/SFX settings shared device-level, all 10 games still play correctly
- **Issues found:** none (no Critical/High/Medium/Low)

## Execution Record — First Words (Games 9 & 10) (2026-08-03)

- **Target:** live URL `https://aby-little-lab.ansyar-world.top/` (First Words build, post-v1.1.0)
- **Devices:** tablet (iPadOS 15+) + phone (iOS 15+)
- **Result:** All First Words checks passed — Hub 10 tiles in 5×2 (no clipping, labels readable), Find the Word (2×2 word cards, picture + spoken prompt, correct chime/cheer/dot pop, gentle wrong-tap wiggle, no two cards share a first letter, 6 rounds → sticker + auto-return with just-earned highlight), Build the Word (slots + 6 letter tiles, left-to-right fill with settle pop + tick, wrong-tile wiggle, 3 words easy-first, word linger, 3 words → sticker + auto-return), SFX-off TTS silence + silent visual-only fallback, parental lock on both games' Back buttons, sticker persistence after close/reopen with no duplicates, reduced-motion behavior
- **Issues found:** none (no Critical/High/Medium/Low)

## Execution Record — v1.1.0 (2026-08-03)

- **Target:** live URL `https://aby-little-lab.ansyar-world.top/` (v1.1.0)
- **Devices:** iPad (iPadOS 15+), Android tablet (Android 10+), iPhone (iOS 15+), Android phone (Android 10+)
- **Result:** All sections A–G passed — PWA install (Android "Install App" + iOS "Add to Home Screen"), offline, TTS voice, settings & parental lock, mascot, performance targets (<3s boot, 60fps min 30, <150MB memory, <16ms touch, <50ms audio), accessibility (reduced motion), completion & audio regression
- **Issues found:** none (no Critical/High/Medium/Low)

## Target Devices

### Primary Target Devices
- **iPad** (any recent model, iPadOS 15+)
- **Android Tablet** (Samsung Galaxy Tab, Android 10+)
- **iPhone** (any recent model, iOS 15+)
- **Android Phone** (any recent model, Android 10+)

### Secondary/Test Devices
- Older devices with limited resources
- Different screen sizes (7" to 12.9")
- Both WiFi and cellular connections

## Pre-Test Setup

### 1. Build and Deploy
```bash
# Build production version
pnpm run build

# Start a local server for same-device smoke tests
pnpm exec serve dist -l 3000
```

> **Secure-context requirement:** Use `http://localhost:3000` only for same-device smoke tests. For phone/tablet installation, service-worker, offline, and update checks, use an HTTPS private static host or HTTPS tunnel. A LAN `http://[your-ip]:3000` URL cannot register the service worker.

### 2. Device Preparation
- [ ] Clear browser cache and site data
- [ ] Ensure device is in landscape orientation
- [ ] Disable any ad blockers or content blockers
- [ ] Ensure stable internet connection for initial load

## Test Categories

### A. Installation and PWA Behavior

#### iOS (iPad/iPhone Safari)
- [ ] Open the HTTPS private-host or HTTPS-tunnel URL in Safari
- [ ] Open Settings (parental lock) and verify the install row shows "How to Install"
- [ ] Tap "How to Install" and verify the overlay shows Share → Add to Home Screen steps
- [ ] Follow the steps to add to home screen
- [ ] Verify app name appears as "Aby's Little Lab"
- [ ] Launch app from home screen
- [ ] Verify standalone mode (no browser UI)
- [ ] Verify fullscreen display where the platform supports it
- [ ] Record any remaining OS home/back/navigation bars as platform-controlled limitations
- [ ] Verify landscape orientation
- [ ] Close and reopen app
- [ ] Verify app loads from cache (offline ready)

#### Android/Chrome
- [ ] Open the HTTPS private-host or HTTPS-tunnel URL in Chrome
- [ ] Open Settings (parental lock) and verify the context-aware install row shows "Install App"
- [ ] Tap "Install App" and verify the browser install prompt appears
- [ ] Confirm the install and verify the app installs successfully
- [ ] After install, open Settings again and verify the install row is hidden (already installed)
- [ ] Launch app from home screen
- [ ] Verify standalone mode
- [ ] Verify fullscreen display where the platform supports it
- [ ] Record any remaining OS home/back/navigation bars as platform-controlled limitations
- [ ] Verify landscape orientation
- [ ] Close and reopen app
- [ ] Verify app loads from cache

### B. Core Functionality Testing

#### Boot Sequence
- [ ] App starts in landscape orientation
- [ ] Loading screen appears with progress bar
- [ ] Transitions smoothly to Hub screen
- [ ] No crashes or freezes during boot

#### Hub Screen
- [ ] All 11 game tiles are visible (5×3 grid) — each shows a distinct storybook icon above its label
- [ ] Tiles, labels, icons, and stickers enter with a staggered wave (40ms apart), not all at once
- [ ] Tiles gently bob on an idle loop after entering
- [ ] Sticker shelf shows eleven 56px stickers: earned at full color with shimmer, unearned slots show dashed empty-slot outlines
- [ ] Just-earned sticker bounces in larger with a sparkle burst after auto-return; replaying an earned game shows no highlight
- [ ] Press and hold a game tile: it squishes and stays; release on the tile springs it back and starts the game; release off the tile does not navigate
- [ ] After ~25s idle, two tiles wiggle (rotating pick) and a soft two-tone chime plays, repeating every ~10s; any touch resets the timer
- [ ] Settings icon is accessible
- [ ] Touch targets are adequate (64×64px minimum)
- [ ] Protected controls (Settings, all eleven game Back buttons) plus the replay speaker button (Find the Letter, Find the Word, Build the Word, How Many?, Musical Memory) respond to taps near the visible control (96×96px hit areas — no precision tapping)
- [ ] Professor Hoot mascot sits in the bottom-right corner: waves on load, cheers on a just-earned sticker, then bobs/blinks on the idle loop
- [ ] Mascot is touch-inert — tapping where Hoot stands still reaches the tile/control underneath

#### Game 1: Shape Sorter
- [ ] Game loads correctly
- [ ] Shapes are visible and recognizable
- [ ] Drag and drop works smoothly
- [ ] Matching detection works correctly
- [ ] Success feedback (chime + bounded splash/ray) works and disappears promptly
- [ ] Error feedback (gentle animation) works
- [ ] Juice: shape lifts (1.1× + slight tilt) on drag start and restores on release
- [ ] Juice: drop zone pulses a soft outline while dragging over it
- [ ] Juice: correct drop snaps to slot with a settle tween (no teleport)
- [ ] Juice: dropping on empty floor bounces back silently (no incorrect SFX)
- [ ] Sticker awarded on first completion
- [ ] Returns to Hub after completion

#### Game 2: Animal Trace-and-Connect
- [ ] Game loads correctly
- [ ] Dotted paths are visible
- [ ] Touch tracing works smoothly
- [ ] The next waypoint pulses with a ring (clear "where next?" cue) and visited dots light up in success green
- [ ] Connection detection works
- [ ] Success/error feedback works
- [ ] Juice: animal hops with a small arc between waypoints
- [ ] Juice: food wiggles when the path is completed
- [ ] Juice: progress dot pops with a scale bounce on completion
- [ ] Sticker awarded on first completion
- [ ] Returns to Hub after completion

#### Game 3: Pop & Freeze!
- [ ] Game loads correctly
- [ ] Bubbles appear and move
- [ ] Bubbles bounce at the visible screen edge (physics body matches the 96px bubble — no phantom wall ~208px short of the edge)
- [ ] Touch to pop works
- [ ] Sleeping animal bubbles cannot be popped
- [ ] Score tracking works
- [ ] Success/error feedback works
- [ ] Juice: popping emits small droplet circles that fade out and disappear
- [ ] Juice: sleeping-animal decoys breathe gently (scale pulse loop)
- [ ] Sticker awarded on first completion
- [ ] Returns to Hub after completion

#### Game 4: Shadow Match
- [ ] Game loads correctly
- [ ] Objects and shadows are visible
- [ ] Drag and drop works
- [ ] Matching detection works
- [ ] Success/error feedback works
- [ ] Juice: object lifts (1.1× + slight tilt) on drag start and restores on release
- [ ] Juice: shadow slot pulses while dragging over it
- [ ] Juice: on correct drop the silhouette stamps (pulse + brief flash) and the object dims
- [ ] Sticker awarded on first completion
- [ ] Returns to Hub after completion

#### Game 5: Musical Memory Simon
- [ ] Game loads correctly
- [ ] Frog notes are visible
- [ ] Sequence playback works
- [ ] No frog plays more than twice in a row; sequences of 5+ notes play at the faster 480ms per-note pace
- [ ] Replaying the sequence resets input — the first correct tap after a re-listen is judged right
- [ ] Touch input works
- [ ] Sequence length increases correctly
- [ ] Audio plays correctly
- [ ] Success/error feedback works
- [ ] Juice: tapped frog emits an expanding ripple ring that fades out
- [ ] Juice: lily pads drift gently up and down
- [ ] Juice: progress dot pops with a scale bounce on round success
- [ ] Sticker awarded on first completion
- [ ] Returns to Hub after completion

#### Game 6: Big vs. Small Cleaner
- [ ] Game loads correctly
- [ ] Toys of different sizes appear
- [ ] Drag and drop works
- [ ] Size sorting works correctly
- [ ] Success/error feedback works
- [ ] Juice: toy lifts (1.1× + slight tilt) on drag start and restores on release
- [ ] Juice: box drop zone pulses while dragging over it
- [ ] Juice: on correct drop the toy shrinks into the box and the lid wiggles
- [ ] Sticker awarded on first completion
- [ ] Returns to Hub after completion

#### Game 7: Pattern Builder
- [ ] Game loads correctly
- [ ] 4 slots (3 filled shapes + clearly marked empty gap) and 3 answer cards are visible
- [ ] Pattern shapes are recognizable (reuses the Shape Sorter shape SVGs)
- [ ] Tapping the correct card snaps the shape into the gap with a settle tween + chime
- [ ] Progress dots fill one per round; 6 rounds complete the game (v1.7.0 — was 5)
- [ ] Tapping a wrong card wiggles it gently with no penalty and no progression loss
- [ ] Cards/slots exceed the 64px minimum touch target
- [ ] Sticker awarded on first completion
- [ ] Returns to Hub after completion (auto-return ~3s)

#### Game 8: Find the Letter (Alphabet Recognition)
- [ ] Game loads correctly
- [ ] A large target letter (rendered from the letter SVG texture, ~200px glyph) appears top-center and its name is **spoken aloud** (device TTS voice present); the speaker button re-names it on demand
- [ ] 4 uppercase letter cards are visible (160px each, letter glyphs from the letter SVG textures — exceed the 96px ideal touch target)
- [ ] Letters are distinguished by shape only (identical fill/stroke styling — no color-as-cue)
- [ ] Tapping the correct card plays the chime, Professor Hoot cheers, and the progress dot pops; next round starts in ~0.7s
- [ ] The correct card bursts a small splash at the tap point (v1.7.0)
- [ ] Tapping a wrong card wiggles it gently with no penalty and no progression loss
- [ ] TTS is silent when the SFX toggle is off; on devices with no speech voice the game plays fully visually with no error
- [ ] 6 rounds complete the game; sticker awarded on first completion
- [ ] Returns to Hub after completion (auto-return ~3s)

#### Game 9: Find the Word (Sight-Word Recognition)
- [ ] Game loads correctly
- [ ] A picture prompt (~180px) appears top-center and the word is **spoken aloud** (device TTS voice present)
- [ ] 4 word cards are visible in a 2×2 grid, each composed of the word's letters (~80px/letter, min 160px tall — exceed the 96px ideal touch target)
- [ ] Tapping the correct card plays the chime, Professor Hoot cheers, and the progress dot pops; next round starts in ~0.7s
- [ ] The playthrough leads with 3-letter words (easy first — five 3-letter rounds then one 4-letter round)
- [ ] The correct card bursts a small splash at the tap point (v1.7.0)
- [ ] Tapping a wrong card wiggles it gently with no penalty and no progression loss
- [ ] No two cards in a round start with the same letter (pre-reader first-letter matching works)
- [ ] TTS is silent when the SFX toggle is off; on devices with no speech voice the game plays fully visually with no error
- [ ] 6 rounds complete the game; sticker awarded on first completion
- [ ] Returns to Hub after completion (auto-return ~3s)
- [ ] New-pool words spot check: OWL (Hoot picture), SUN, HAT, BUG, DUCK appear across playthroughs with correct prompt art at ~180px (no missing-texture boxes)
- [ ] Replay check: after winning, re-entering the game keeps cards tappable (input-lock regression fixed)

#### Game 10: Build the Word (Spelling)
- [ ] Game loads correctly
- [ ] A picture prompt (~180px) appears top-center and the word is **spoken aloud** (device TTS voice present)
- [ ] One empty slot (120px) per letter of the word plus 6 letter tiles (~132px, above the 64px floor at phone scale) are visible
- [ ] Letter tiles include the word's letters plus 2–3 distractor letters not in the word
- [ ] Tapping the correct letter flies it into the next empty slot (left-to-right) with a soft tick; the tile dims into a ghost (v1.7.0)
- [ ] Duplicate-letter words (BALL) keep the tile tappable for the second use — a fresh copy settles into the slot and the tile thunks instead of ghosting early
- [ ] Tapping a wrong letter wiggles it gently with no penalty and no progression loss
- [ ] A finished word plays the chime + Hoot cheer, lingers ~1.2s, then the next word appears (3 words per playthrough, easy-first)
- [ ] TTS is silent when the SFX toggle is off; on devices with no speech voice the game plays fully visually with no error
- [ ] Sticker awarded on first completion
- [ ] Returns to Hub after completion (auto-return ~3s)
- [ ] New-pool words spot check: DUCK/BEAR/BONE/STAR/DRUM render with correct prompt art at ~180px and spell with the usual 6 tiles
- [ ] Replay check: after winning, re-entering the game keeps tiles tappable (input-lock regression fixed)

### C. Cross-Game Features

#### Sticker System
- [ ] Stickers persist after app close/reopen
- [ ] Shelf shows all earned stickers at full color and dashed empty-slot outlines for unearned ones
- [ ] Shelf updates in real-time (just-earned highlight appears on the auto-return visit)
- [ ] No duplicate stickers awarded

#### Settings
- [ ] BGM toggle works (on/off)
- [ ] SFX toggle works (on/off)
- [ ] Settings persist after app close/reopen
- [ ] Settings affect audio playback
- [ ] Version footer shows the deployed version (e.g., `v1.0.0`) under the title (clear of the install row) and is not tappable
- [ ] Settings text is readable on a phone (30–36px fonts) and pinch-zoom works while the panel is open
- [ ] "Reset Progress" row opens the "Reset all stickers?" confirm modal; Cancel closes it without changes
- [ ] Reset clears every sticker (Hub shelf dims immediately), preserves BGM/SFX settings, and the row shows "Progress cleared"
- [ ] Reset persists after app close/reopen (stickers stay cleared, settings stay unchanged)

#### TTS Voice Selection (v1.12.0 candidate)
- [ ] Voice row shows "Voice: Default (device)" on a fresh install (no stored preference)
- [ ] Tapping the voice chip cycles through installed voices (all languages listed, no en-US gate) and wraps back to "Default (device)"
- [ ] Long voice names are truncated in the chip (readable, no overflow)
- [ ] "Preview" button speaks "Hi! I can talk." with the currently selected voice when SFX is on
- [ ] "Preview" is silent when the SFX toggle is off (parity with prompt speech)
- [ ] Selected voice persists after app close/reopen (device-level, shared across profiles)
- [ ] Choosing "Default (device)" restores the browser-default voice
- [ ] Games that speak (Find the Letter, Find the Word, Build the Word, How Many?, First Sounds, More or Less, Odd One Out) use the selected voice
- [ ] When the stored voice no longer exists on the device, speech falls back to the default silently (no error, no visual regression)
- [ ] Voice chip + preview buttons are ≥64px touch targets (panel is parental-gated; no accidental taps)

#### Parental Lock
- [ ] Hold-for-3-seconds mechanism works on Hub Settings and every game Back control
- [ ] Circular progress ring fills during the hold and disappears on release/cancel/completion
- [ ] Settings/exit menu appears exactly once after a completed hold (no duplicate triggers)
- [ ] Early release, pointer leaving the control, and pointer cancel never trigger the action
- [ ] No accidental triggers during gameplay
- [ ] No ring artifacts remain after a cancelled hold or after leaving the scene

#### Mascot Companion
- [ ] Hoot appears in the same bottom-right corner on the Hub and in all eleven games (consistent placement, behind gameplay z-order)
- [ ] Hoot cheers on correct actions in every game (pose swap + bounce; bigger cheer + sparkle ring on win)
- [ ] Hoot nods on incorrect actions (Shape Sorter, Pop & Freeze, Shadow Match, Musical Memory, Big vs. Small, Pattern Builder, Find the Letter, Find the Word, Build the Word)
- [ ] Rapid correct taps: Hoot finishes gracefully — no stuck pose, no runaway bounce (in-flight cheer retired)
- [ ] Hoot disappears when leaving a scene and never lingers into the next scene

### D. Offline Testing

#### After Initial Online Load
- [ ] Turn off WiFi and cellular data
- [ ] Relaunch app from home screen
- [ ] Verify app loads from cache
- [ ] Verify all games are playable
- [ ] Verify audio works offline
- [ ] Verify stickers persist offline
- [ ] Verify settings persist offline

#### Service Worker Updates
- [ ] Make a small code change
- [ ] Rebuild and redeploy
- [ ] Refresh the app while online
- [ ] On the Hub, verify the "New version ready!" toast appears
- [ ] Tap "Update now" and verify the new version loads
- [ ] Tap "Later" and verify the app keeps running on the old version
- [ ] Verify no data loss during update
- [ ] On first successful SW install, verify the "Ready to play offline!" toast appears

### E. Performance Testing

#### Boot Time
- [ ] Measure time from launch to Hub screen
- [ ] Target: < 3 seconds
- [ ] Note any delays or freezes

#### Frame Rate
- [ ] Play each game for 2 minutes
- [ ] Monitor frame rate (target: 60fps, min 30fps)
- [ ] Note any frame drops or stuttering

#### Memory Usage
- [ ] Monitor memory usage during gameplay
- [ ] Target: < 150MB
- [ ] Check for memory leaks after extended play

#### Touch Responsiveness
- [ ] Test touch latency during gameplay
- [ ] Target: < 16ms
- [ ] Note any delayed responses

#### Audio Latency
- [ ] Test audio response time
- [ ] Target: < 50ms
- [ ] Note any audio delays

### F. Accessibility Testing

#### Reduced Motion
- [ ] Enable "Reduce Motion" in device settings
- [ ] Scene transitions are shortened (~40%) with no harsh flashes
- [ ] Win celebration renders simplified (6 rays, no confetti) and completes normally
- [ ] Gameplay tweens (bounce-backs, bubble pop, wake wobble, frog bounce, sticker pops) are shorter and gentler
- [ ] Juice under reduced motion: drag lift is 1.05× with no tilt; snaps/bounces shorter; stamp/dim/box reactions gentler
- [ ] Juice under reduced motion: animal hops straight and faster; food wiggle and dot pops gentler
- [ ] Juice under reduced motion: pop droplets smaller/faster; sleeping-animal breathing loop is disabled
- [ ] Juice under reduced motion: ripple rings smaller/faster; lily pad drift is disabled
- [ ] Press feedback (squish) on Back/Replay/Settings/Hub tiles is disabled
- [ ] Hub entrances fade without scale; no bob, wiggle, sparkle, or burst; idle attract plays chime only
- [ ] Mascot under reduced motion: no idle bob/blink; reactions are pose swaps / gentle wave-nod without bounce or sparkle
- [ ] Game functionality remains intact — every game still reachable and completable
- [ ] Verify no flashing or excessive movement

#### Visual Clarity
- [ ] Test in bright sunlight conditions
- [ ] Test in low-light conditions
- [ ] Verify all elements are clearly visible
- [ ] Verify color contrast is adequate

### G. Completion and Audio Regression Checks
- [ ] On the first valid Hub interaction, BGM starts when enabled
- [ ] BGM continues when moving between Hub and games
- [ ] BGM and SFX settings persist after closing and reopening the app
- [ ] SFX feedback remains synthesized and no removed SFX MP3 URL is requested
- [ ] Every navigation path (boot → hub, hub → game, game → hub) plays the crossfade transition
- [ ] Each of the eleven games shows at most one short splash/ray for a success or completion action
- [ ] All eleven games play the shared win celebration (rays + confetti) on completion, which cleans itself up; the first-time sticker reveal pops after the confetti (~400ms), not on top of it
- [ ] Back, Replay, Settings, and Hub tile controls squish on press and spring back on release
- [ ] No completion effect remains on screen or obscures the next interaction
- [ ] Reduced-motion mode disables or simplifies the splash/ray

## Test Documentation

### For Each Device, Record:

1. **Device Information**
   - Device model
   - Operating system version
   - Browser version
   - Screen size

2. **Test Results**
   - Pass/Fail for each category
   - Any issues encountered
   - Workarounds applied

3. **Performance Metrics**
   - Boot time
   - Frame rate observations
   - Memory usage
   - Touch latency
   - Audio latency

4. **Issues Found**
   - Issue description
   - Steps to reproduce
   - Expected vs actual behavior
   - Severity (Critical/High/Medium/Low)

## Issue Severity Levels

### Critical
- App crashes or freezes
- Core functionality broken
- Data loss or corruption

### High
- Major feature malfunction
- Significant performance issues
- Accessibility barriers

### Medium
- Minor feature issues
- Cosmetic problems
- Non-critical performance issues

### Low
- Typos or minor UI issues
- Edge case problems
- Enhancement requests

## Sign-Off

After completing all tests:

- [x] All Critical issues resolved
- [x] All High issues resolved or documented
- [x] Medium issues documented for future release
- [x] Low issues documented for future release
- [x] Performance targets met
- [x] Accessibility requirements met
- [x] Release documentation complete

**Tester:** Ansyar (mansyar)
**Date:** 2026-08-04
**Device:** iPad, Android tablet, iPhone, Android phone (see Execution Record)
**Overall Status:** PASSED — all items verified
