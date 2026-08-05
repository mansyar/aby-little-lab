# Implementation Plan — UI/UX Hardening (Consolidated Audit Remediation)

**Track ID:** `uiux-hardening_20260805`
**Type:** Feature

## Phase 1 — Global Typography System

- [x] **Task 1.1: Bundle rounded child-friendly font asset** — `7494ee0`
  - [x] Add font (e.g. Baloo 2, regular + bold) as WOFF2 in `public/fonts/`
  - [x] Register `@font-face` in `src/styles/style.css` (or index.html) with `font-display: swap`
  - [x] Verify the font file is precached by the PWA build (`dist/` contains it)
- [x] **Task 1.2: Create shared typography constants** — `7494ee0`
  - [x] Write `src/utils/typography.ts` — export `FONT_FAMILY` and font-size presets
  - [x] Write tests `src/__tests__/utils/typography.test.ts` verifying constants exist and reference the font name (TDD: test first)
  - [x] Verify `CI=true pnpm test` (new tests fail before implementation)
- [x] **Task 1.3: Apply font family across all Text objects** — `35de574`
  - [x] Add `fontFamily: FONT_FAMILY` to Text style objects in HubScene (tile labels, Settings, profile picker)
  - [x] Apply in SettingsPanel (all rows/overlays/toasts)
  - [x] Apply in all 11 game scenes (back button, prompts, dots labels, Zzz → replaced in Task 1.4)
  - [x] Apply in PwaToast
  - [x] Run existing tests + lint (`CI=true pnpm test`, `pnpm run check`) — update snapshots if any
- [x] **Task 1.4: Replace PopFreeze "Zzz" with SVG sleep glyph** — `2f8cbd7`
  - [x] Author `sleep_zzz.svg` in `src/assets/svg/ui/`
  - [x] Register in PreloadScene; render image in PopFreezeScene (replaces text object)
  - [x] Add/update scene test verifying no text "Zzz" is created
- [x] **Task 1.5: AlphabetScene uses letter SVG textures** — `0f9884c`
  - [x] Swap target letter + answer cards from `add.text` to preloaded `letter_*` textures (F1.5)
  - [x] Update `alphabetScene.test.ts` to assert texture-based rendering
- [x] **Task: Phase 1 Verification & Checkpoint (refer to workflow.md)** — [checkpoint: `4cf5333`]

## Phase 2 — Hub Tile Iconography

- [x] **Task 2.1: Author 11 dedicated SVG tile icons** (8566ac9)
  - [x] Create `tile_shape_sorter.svg`, `tile_animal_trace.svg`, `tile_pop_freeze.svg`, `tile_shadow_match.svg`, `tile_musical_memory.svg`, `tile_big_small.svg`, `tile_pattern_builder.svg`, `tile_alphabet.svg`, `tile_word_match.svg`, `tile_word_builder.svg`, `tile_how_many.svg` in `src/assets/svg/ui/tiles/` (512×512, flat fills, 4–6px outlines)
  - [x] Verify each follows storybook rules (no gradients/neon, palette-consistent)
- [x] **Task 2.2: Register tile icons in PreloadScene** (8566ac9)
  - [x] Import + register the 11 SVGs in the preload list
- [x] **Task 2.3: Render icons on Hub tiles** (8566ac9)
  - [x] In HubScene, display the icon (80px display) above the text label; keep label as secondary (15px at bottom of tile)
  - [x] Add/update Hub-related test asserting an image texture is attached per tile
- [x] **Task 2.4: Sticker shelf empty-slot cue** (8566ac9)
  - [x] Draw dashed "empty slot" outline for unearned stickers (Graphics), replace current 0.3-alpha ghost
  - [x] Update shelf test if present
- [ ] **Task: Phase 2 Verification & Checkpoint (refer to workflow.md)**

## Phase 3 — Prompt Replay Affordance

- [ ] **Task 3.1: Author speaker SVG icon**
  - [ ] Create `icon_speaker.svg` in `src/assets/svg/ui/`; register in PreloadScene
- [ ] **Task 3.2: Create shared SpeakerButton component**
  - [ ] Write `src/components/SpeakerButton.ts` — ≥96×96 hit area, speaks current prompt via speech.ts (SFX-gated), reduced-motion aware
  - [ ] Write tests `src/__tests__/components/SpeakerButton.test.ts` (TDD: renders, hit area, invokes speech callback, respects sfx disabled)
- [ ] **Task 3.3: Integrate into 4 speech-driven scenes**
  - [ ] AlphabetScene, WordMatchScene, WordBuilderScene, HowManyScene — add SpeakerButton near progress dots; re-speaks current round prompt
  - [ ] Update scene tests to verify replay button exists and re-triggers speech
- [ ] **Task 3.4: Replace MusicalMemory emoji replay with SpeakerButton**
  - [ ] Remove 🔄 text; use SpeakerButton (replays the sequence note)
  - [ ] Update musicalMemory scene test
- [ ] **Task: Phase 3 Verification & Checkpoint (refer to workflow.md)**

## Phase 4 — Audio Resume & Settings Readability

- [ ] **Task 4.1: Resume AudioContext on first Hub pointerdown**
  - [ ] In HubScene, listen for first pointerdown anywhere → `AudioManager.getInstance().resume()` (idempotent), enabling idle-attract audio on fresh load
  - [ ] Add test verifying resume is called once on first pointerdown
- [ ] **Task 4.2: Increase Settings panel/overlay font sizes**
  - [ ] Bump toggle rows, profile rows, modals, install/iOS overlays to ~30–36px (per F4.2)
  - [ ] Re-verify panel fits 480×560 (adjust row spacing/panel height if needed)
  - [ ] Update SettingsPanel tests if font-size assertions exist
- [ ] **Task 4.3: Pinch-zoom on Settings overlay only**
  - [ ] Temporarily relax `user-scalable=no`/`maximum-scale=1.0` in the meta viewport while Settings is open; restore on close (util or inline handler)
  - [ ] Add unit test for the zoom-toggle util
- [ ] **Task: Phase 4 Verification & Checkpoint (refer to workflow.md)**

## Phase 5 — Polish Items

- [ ] **Task 5.1: Win sticker/celebration overlap fix**
  - [ ] Delay sticker animation ~400ms (or offset) so it doesn't overlap fading rays/confetti
- [ ] **Task 5.2: Scope idle-attract wiggle**
  - [ ] Change Hub idle attract to wiggle 1–2 tiles (rotating pick) instead of all 11
- [ ] **Task 5.3: Preload branding**
  - [ ] Add "Aby's Little Lab" brand lockup + mascot wave on PreloadScreen alongside progress bar
- [ ] **Task 5.4: Shadow Match object size 96→112px**
  - [ ] Update ShadowMatchScene object display size + drop zone/layout offsets; verify scene tests
- [ ] **Task 5.5: Settings footer overlap fix**
  - [ ] Reposition version footer so it doesn't overlap the install row
- [ ] **Task: Phase 5 Verification & Checkpoint (refer to workflow.md)**

## Phase 6 — Final Verification & Quality Gates

- [ ] **Task 6.1: Run full quality gates**
  - [ ] `pnpm run check` (Biome lint + format)
  - [ ] `CI=true pnpm test` (all tests pass, coverage ≥80%)
  - [ ] `pnpm run build` + `node scripts/validate-pwa.js` (PWA precache includes font + new SVGs)
- [ ] **Task 6.2: Manual verification plan (mobile/tablet)**
  - [ ] Spot-check Hub icons, typography, replay buttons, settings zoom on phone + tablet
- [ ] **Task: Phase 6 Verification & Checkpoint (refer to workflow.md)**
