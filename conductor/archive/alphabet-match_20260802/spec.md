# Spec — Game 8: "Find the Letter" (Alphabet Recognition)

**Track:** `alphabet-match_20260802` · **Type:** Feature · **Branch:** `feat/game-8`

## 1. Overview

Aby's Little Lab gains an 8th mini-game teaching **uppercase letter recognition** — a new developmental domain (early literacy) not covered by the existing seven games. The game is a textless-in-instruction "find the same letter" matching game: a target uppercase letter is displayed large and spoken aloud (browser SpeechSynthesis); the child taps the matching letter card among 4 options. 6 rounds per playthrough, win on 6 correct.

## 2. Product Definition Amendment

This track deliberately amends the PRD's "Zero text dependency for gameplay" principle: letters become the **learning content** (like shapes or animals), not UI instructions. All prompts remain visual/audio — no written instructions appear anywhere. The amendment is recorded in `product.md`, `docs/PRD.md`, and `docs/TDD.md` with a dated note.

## 3. Functional Requirements

### FR-1 — Playthrough generation (`src/game/alphabetLogic.ts`, pure functions)

- Each playthrough draws **6 unique letters** uniformly from A–Z (no duplicates within a playthrough); difficulty stays fixed across replays, matching the suite's replay-variety principle.
- Each round generates **4 unique cards**: 1 target + 3 random distinct distractors, positions shuffled.

### FR-2 — Round flow (scene `AlphabetScene.ts`, key `Alphabet`)

- Target letter shown top-center (~256px, pop-in entrance); 4 letter cards below (~160px, ≥96px touch target with inflated hit area).
- All 26 letters styled **identically** (same fill/stroke) so matching is purely by letterform — no color-as-cue hazard.
- Round start: TTS speaks the letter name + visual pop-in. Cards squish on press (`pressFeedback`), evaluate on release.
- **Correct:** card flashes `--success` + chime (`playCorrect`) + mascot cheer + progress dot pops; next round after ~700ms.
- **Incorrect:** card wiggles ±4° + soft descending tone (`playIncorrect`) + mascot nod; **no penalty** — round stays, child retries.
- After 6 correct: shared win celebration (rays + confetti), sticker award (first time only, `{ justEarned: "alphabet-match" }`), mascot big cheer, auto-return to Hub after 3s.
- Parental lock (hold 3s) exits to Hub at any time.

### FR-3 — Letter audio via SpeechSynthesis (`src/utils/speech.ts`)

- `speakLetter(letter)` wraps `window.speechSynthesis` (en-US, slow gentle rate ~0.9), cancels prior utterances, guarded try/catch.
- **Respects the SFX toggle** — TTS silent when SFX is off.
- **Graceful fallback:** if `speechSynthesis` is unsupported/unavailable, the game remains fully playable visual-only.

### FR-4 — Assets

- 26 uppercase letter SVGs: `src/assets/svg/letters/letter_a.svg` … `letter_z.svg` (512×512, flat fill `#2B6CB0` primary, thick `#2D3748` stroke, identical styling across letters).
- `sticker_alphabet.svg` — "A" with star sparkle on cream badge, matching existing sticker style.

### FR-5 — Integration

- `GameId` union + storage sticker key: `alphabet-match` (existing per-key merge migration covers old saves automatically).
- `src/scenes/sceneRegistry.ts`: add `Alphabet` lazy loader; Hub grid grows to 8 tiles (4×2).
- `PreloadScene` loads the 27 new SVGs alongside existing assets.
- Mascot reactions wired: cheer / nod / big-cheer.

## 4. Non-Functional Requirements

- Touch targets ≥96×96px; tap latency <16ms; all animations via `motion.ts` (reduced-motion: shorter/gentler or disabled; TTS unaffected).
- Pure logic in `alphabetLogic.ts` — fully unit-testable without Phaser; coverage target >80% (project currently ~97%).
- No new runtime dependencies (SpeechSynthesis is a platform API).

## 5. Acceptance Criteria

1. Playthroughs draw 6 unique letters; rounds always have 4 unique cards with exactly one correct answer; win detected at 6 correct.
2. Tapping the correct card advances the round; wrong taps wiggle with no penalty or progression loss.
3. TTS speaks each target letter once at round start; silent when SFX disabled or API unavailable; visual play unaffected.
4. Win → shared celebration + sticker (first completion only) + auto-return; `justEarned` passed to Hub.
5. Hub shows 8 tiles; `ensureSceneLoaded` fires for `Alphabet`; pre-existing saves load cleanly.
6. All quality gates pass (`pnpm run check`, `CI=true pnpm test`, `pnpm run build`, `node scripts/validate-pwa.js`).

## 6. Out of Scope

- Lowercase letters, mixed case, phonics (letter→picture), letter sounds/phonemes, tracing/writing, spelling, word building, per-letter progress tracking, difficulty tiers, TTS voice selection UI.
