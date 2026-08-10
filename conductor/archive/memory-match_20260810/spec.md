# Spec — Game 18: "Memory Match" (Visual Working Memory)

**Track:** `memory-match_20260810` · **Type:** Feature · **Branch:** `feat/game-18`

## 1. Overview

Aby's Little Lab gains an 18th mini-game teaching **visual working memory & visual discrimination**: a classic pairs-matching game. Each round shows a face-down card grid; the child taps two cards to reveal them, matching identical pairs. 6 rounds per playthrough with **progressive grids**, win on 6 rounds. This is the first pure visual-memory game (Musical Memory is auditory-sequential) and the first game with **no speech dependency at all** (like Add It Up / Take Away).

## 2. Product Definition Amendment

- Games target extends **17 → 18**; Hub grid becomes **5×3 + 3** (rows 5/5/5/3 — row 4 holds 3 left-aligned tiles; generic modulo layout, no change to grid math).
- Extends the "zero text dependency" amendments: **pair matching is the learning content**, no written instructions, no spoken prompt, no speaker button.
- Product docs gain the Game 18 row (milestone: *working memory & visual discrimination*).

## 3. Functional Requirements

### FR-1 — Playthrough generation (`src/game/memoryMatchLogic.ts`, pure functions)

- 6 rounds per playthrough in **3 progressive bands** (difficulty fixed across replays, per replay-variety principle):
  - Rounds 1–2 (**easy**): 2×3 grid, **3 pairs** (6 cards).
  - Rounds 3–4 (**medium**): 3×4 grid, **6 pairs** (12 cards).
  - Rounds 5–6 (**hard**): 4×4 grid, **8 pairs** (16 cards).
- **Mixed-category pool** — card textures reuse existing art only (e.g., 6 animal textures, 6 toy textures, 8 counting-item textures; exact texture keys resolved from existing preload registries during implementation). Within a round, all pairs are **distinct textures**; a texture never repeats within a round; positions shuffle per round and per playthrough.
- Export `buildPlaythrough(rng)` (band-aware), `buildRound(band, rng)` (grid layout + pair placement), and pure match-state helpers (revealed indices, matched set, round-complete / playthrough-complete detection), mirroring `colorMatchLogic.ts` / `addItUpLogic.ts` purity.

### FR-2 — Round flow (scene `MemoryMatchScene.ts`, key `MemoryMatch`)

- **Deal:** cards spawn face-down (card-back texture on a rounded-rect Graphics base), staggered ~40ms deal tween; grid centered on the 1024×768 canvas.
- **Reveal:** tap a face-down card → flip animation (scaleX 1 → 0 → 1, face swap at midpoint, ~180ms / ~120ms reduced motion) + soft pop (`playPop`). Tap a second card → same flip.
- **Match:** two identical textures → cards lock face-up with a `--success` flash + chime (`playCorrect`) + mascot cheer + `recordCorrect()`; matched pair stays face-up.
- **Mismatch:** after a short reveal pause (~800ms), both cards flip back face-down; gentle wiggle + soft descending tone (`playIncorrect`) + mascot nod + `recordWrong()` — **no penalty**, round continues.
- **Input locked** during reveal/flip-back transitions and the win celebration (same guard pattern as other games).
- **Round complete:** all pairs matched → progress dot pops (`Back.out`); next round after ~700ms (`NEXT_ROUND_DELAY`).
- After 6 rounds: shared win celebration (rays + confetti), sticker award (first time only, `{ justEarned: "memory-match" }`), mascot big cheer, auto-return to Hub after 3s.
- Parental lock (hold 3s) exits at any time; back button via `GameSceneBase.createBackButton`; progress dots (6), corner mascot, shutdown cleanup — inherited from `GameSceneBase`. `inputLocked` resets on `create()` relaunch (established regression pattern).

### FR-3 — Assets (3 new SVGs, storybook style)

- `card_back.svg` — face-down card design (cream card, star motif, thick `#2D3748` outline) per `docs/SVG_STYLE.md`.
- `tile_memory_match.svg` — Hub tile icon (mini face-down cards with one pair revealed).
- `sticker_memory_match.svg` — completion sticker (cream badge, two matching cards).
- Preload SVG count 159 → 162. **Zero new object art.**

### FR-4 — Integration

- `GameId` union + storage sticker key: `memory-match` (existing per-key merge migration covers old saves automatically; `GAME_IDS` backfills the new key).
- `src/scenes/sceneRegistry.ts`: add `MemoryMatch` lazy loader (18th).
- `PreloadScene` loads the 3 new SVGs alongside existing assets.
- Hub `GAME_TILES` gains the 18th tile (sceneKey `MemoryMatch`, gameId `memory-match`, tileKey `tile_memory_match`; iconDisplay/iconOffsetY per tile-icon rules) — **grid becomes 5×3+3**; verify sticker shelf / play-time arc still fit.
- Mascot reactions wired: cheer / nod / big-cheer.
- Progress instrumentation: `recordCorrect()` on each matched pair, `recordWrong()` on each mismatched reveal (accuracy meaningful in the parent Learning Progress report); wins flush via `completeGame()`.

## 4. Non-Functional Requirements

- Touch targets ≥96×96px (cards ~140–160px display).
- All animations via `motion.ts` (reduced-motion: shorter flips, no deal stagger, no flash).
- Pure logic in `memoryMatchLogic.ts` — fully unit-testable without Phaser; coverage matches project bar (>95% lines for new module).
- No new runtime dependencies, no new audio (reuses synthesized SFX + existing pop/win/sticker).

## 5. Acceptance Criteria

1. Playthroughs are 6 rounds in bands 2×3 / 3×4 / 4×4 (2 each); each round has all-distinct pair textures, shuffled positions; win detected after 6 rounds.
2. Tapping two identical cards locks them face-up with success feedback; mismatched pairs flip back with gentle no-penalty feedback; input locked during transitions and celebration.
3. Round completion pops a progress dot and advances ~700ms; round 6 triggers the shared win celebration + sticker (first completion only) + 3s auto-return; `justEarned` passed to Hub.
4. Hub shows 18 tiles (5×3+3, row 4 = 3 left-aligned tiles, no clipping); `ensureSceneLoaded` fires for `MemoryMatch`; pre-existing saves load cleanly (sticker key backfilled).
5. Parent Learning Progress records plays/wins/accuracy for `memory-match` (pairs = correct, mismatches = wrong).
6. All quality gates pass (`pnpm run check`, `CI=true pnpm test`, `pnpm run build`, `node scripts/validate-pwa.js`).

## 6. Out of Scope

- Timed modes, score/attempt counters, move limits, hint systems, new object art, custom card-face art, difficulty selection, leaderboards, cloud sync.
