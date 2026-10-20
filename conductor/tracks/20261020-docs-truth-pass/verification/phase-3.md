# Phase 3 Evidence — Move Per-Game Juice and the Game Roster into the PRD

- **Track:** `20261020-docs-truth-pass` — Docs & Dead-Code Truth Pass
- **Phase:** 3 — Move Per-Game Juice and the Game Roster into the PRD
- **Date:** 2026-10-20
- **Branch:** `chore/20261020-docs-truth-pass`
- **Base:** `9b38cd19d92715fdb2418a65882f51c883be42cf`
- **Head (task commits):** `5e74cea` (`docs(readme): trim the game roster and per-game juice to links`); PRD commit `f45b368`
- **Evidence commit:** this file's own commit

## Result

**verified** — FR-2, FR-3, FR-12, AC-2, AC-3, AC-12 covered. All seven verification layers pass.

## Commands

| Layer | Command | Exit | Summary |
|---|---|---|---|
| lint | `pnpm check` | 0 | 230 files; 1 pre-existing warning (`noNonNullAssertion` in `src/__tests__/scenes/musicalMemoryScene.test.ts:294`), 1 info (biome schema 2.5.5 vs CLI 2.5.10 drift) — both pre-existing, untouched |
| types | `pnpm typecheck` | 0 | `tsc --noEmit` clean |
| tests | `pnpm test -- --run` | 0 | 110 files / 2,305 tests passed |
| coverage | `pnpm test:coverage` | 0 | 97.78% stmts, 90.66% branch, 96.34% funcs, 98.59% lines |
| build | `pnpm build` | 0 | 316 modules; shell entry 129.1 kB (≤200 kB); PWA precache 53 entries |
| bundle | `node scripts/validate-bundle.js` | 0 | Phaser vendor chunk present; shell entry within budget |
| pwa | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed; 41 chunks, 41 precached |

Full command run as one chain, exit 0:
`pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js`

## AC-2 — README entry point, line budget

| Measure | Before | After | Verdict |
|---|---|---|---|
| `## Mini-Games` span (89–119 → 89–115) | 31 lines | 27 lines | 22 bullets + 1 intro paragraph, 1 line per game |
| `## Per-Game Juice` span (132–154 → 128–131) | 23 lines | 4 lines | one paragraph, ≤6 rendered lines |
| **README total** | **237** | **214** | **≤215 ✓** |
| `## Releases` | table + release-mechanics line | unchanged (only shifted to 179) | ✓ |
| `## Project Structure` | 69–87 | unchanged | ✓ |

Rendered juice lines = 4 (heading, blank, paragraph, blank). The paragraph carries the shared feedback language (95% press squish, correct chime + dot pop, ±4° three-repeat wiggle + Hoot nod, ten-ray celebration + sticker ~400 ms), the reduced-motion rule, and the links to `docs/PRD.md#3-game-specifications` and `docs/TDD.md#9-motion-and-feedback`.

## AC-2 — anchors

Every roster link was checked twice: each anchor matches the slug implied by its `### 3.x` heading, and each is identical to the anchor the PRD's own §3 index table already uses (verified by grep over the PRD table — 22/22 matched).

| # | Game | Link target | Heading it resolves to |
|---|---|---|---|
| 1 | Shape Sorter | `#31-shape-sorter` | `### 3.1 Shape Sorter` |
| 2 | Animal Trace | `#32-animal-trace` | `### 3.2 Animal Trace` |
| 3 | Pop & Freeze | `#33-pop--freeze` | `### 3.3 Pop & Freeze` (double hyphen) |
| 4 | Shadow Match | `#34-shadow-match` | `### 3.4 Shadow Match` |
| 5 | Musical Memory | `#35-musical-memory` | `### 3.5 Musical Memory` |
| 6 | Big & Small | `#36-big-vs-small` | `### 3.6 Big vs. Small` |
| 7 | Pattern Builder | `#37-pattern-builder` | `### 3.7 Pattern Builder` |
| 8 | Find the Letter | `#38-find-the-letter` | `### 3.8 Find the Letter` |
| 9 | Find the Word | `#39-find-the-word` | `### 3.9 Find the Word` |
| 10 | Build the Word | `#310-build-the-word` | `### 3.10 Build the Word` |
| 11 | How Many? | `#311-how-many` | `### 3.11 How Many?` (punctuation stripped) |
| 12 | First Sounds | `#312-first-sounds` | `### 3.12 First Sounds` |
| 13 | More or Less | `#313-more-or-less` | `### 3.13 More or Less` |
| 14 | Odd One Out | `#314-odd-one-out` | `### 3.14 Odd One Out` |
| 15 | Color Match | `#315-color-match` | `### 3.15 Color Match` |
| 16 | Add It Up | `#316-add-it-up` | `### 3.16 Add It Up` |
| 17 | Take Away | `#317-take-away` | `### 3.17 Take Away` |
| 18 | Memory Match | `#318-memory-match` | `### 3.18 Memory Match` |
| 19 | Decode It | `#319-decode-it` | `### 3.19 Decode It` |
| 20 | Number Order | `#320-number-order` | `### 3.20 Number Order` |
| 21 | Feelings Faces | `#321-feelings-faces` | `### 3.21 Feelings Faces` |
| 22 | Story Order | `#322-story-order` | `### 3.22 Story Order` |

No dead anchors, no orphaned bullets: the status column, the replay-variety paragraph and the spoken-rules paragraph are gone, not left dangling.

## AC-12 — no repeated replay-variety line

| Check | Result |
|---|---|
| Does any README game line name a pool, round count, tier split or grid size? | No — all 22 are `- [Name](spec) — <domain>` |
| Does any README game line link to its PRD §3 spec? | Yes — 22/22 |
| Does the README still contain the words "Replay variety", "Spoken rules", "6 shapes", "6 animal-food pairs", "6 sleeping-animal decoys"? | No (grep over the README: zero matches) |

## AC-3 — relocation list (removed fact → new home)

| Removed from README | Home now |
|---|---|
| 22-row table: game, milestone domain, ✅ status | per-game line (name + domain); status dropped because all 22 are implemented |
| Replay-variety paragraph (per-game pools, round counts, tier splits) | each game's `**Rounds and pool.**` in PRD §3.1–§3.22, corrected where wrong (see checklist) |
| Spoken-rules paragraph + the twelve quoted rule lines | PRD §3.1–§3.22 `**Narration.**` (all twelve strings verified, table below) + PRD §4.2 for the narrator and the three narration shapes |
| "Ten narrate their round target … Musical Memory" | PRD §4.2 states nine round-target games, twelve rule-line games and Musical Memory's note-only replay — the README's "ten" was wrong; corrected by dropping it in favour of §4.2 |
| 18 per-game juice bullets (durations, degrees, alpha, stagger) | shared values: PRD §5.6/§5.7 + TDD §9.3/§9.4 tables; per-game reactions: each game's new `**Feedback.**` bullet; TDD §9.4's closing paragraph already carried the six juice-pass games' exact values (lift 1.1/1.05, 4°/0°, snap 200/120, Big vs. Small 150 ms + ±3°×3 + 1.05×, Shadow Match 1.1× + white flash + 0.5 alpha, Animal Trace 60 ms halves + ±4°×3 + 1.4× dot, Pop & Freeze three teal droplets, Musical Memory ripple 1.6× + ±3 px/1500 ms) |

## The twelve rule strings

All twelve were present in the PRD before any edit and remain unchanged; the line numbers are post-edit.

| Game | String | PRD line |
|---|---|---|
| Shape Sorter | "Drag each shape into its hole." | 159 |
| Animal Trace | "Trace the line to the animal's food." | 168 |
| Pop & Freeze | "Pop the bubbles, but not the sleeping animals." | 177 |
| Shadow Match | "Drag each picture onto its shadow." | 186 |
| Memory Match | "Turn over two cards to find a pair." | 312 |
| Number Order | "Put the numbers in order, smallest first." | 330 |
| Pattern Builder | "Pick the shape that finishes the pattern." | 213 |
| Big vs. Small | "Put the big toys in the big box." | 204 |
| Add It Up | "Add the groups and pick the total." | 294 |
| Take Away | "Take some away and pick how many are left." | 303 |
| Feelings Faces | "Tap the face that shows how Aby feels." | 339 |
| Story Order | "Put the story in order, first to last." | 348 |

The `RoundNarrator.ts` single-construction-site fact is already stated in PRD §4.2 ("Narration has one construction site. `RoundNarrator` builds …") and TDD §8, so dropping the README sentence loses nothing.

## 22-row per-game checklist

`Feedback` = a `**Feedback.**` bullet was added between `**Difficulty.**` and `**Narration.**` (2–3 clauses: right reaction, wrong reaction, game-specific flourish, reduced-motion form). Every one is present: 22/22 (the PRD now has exactly 132 field bullets = 22 games × 6 fields).

| # | Game | Feedback added | Pool/round claim checked against | Verdict |
|---|---|---|---|---|
| 3.1 | Shape Sorter | yes | `src/game/shapeSorterLogic.ts` | **README stale** — said "6 shapes"; logic takes 3 per round from an 18-shape pool over 3 rounds (9 unique). PRD right (three rounds of three, nine unique from 18). Number corrected by dropping it. |
| 3.2 | Animal Trace | yes | `src/game/animalTraceLogic.ts` | **README stale** — said "6 animal-food pairs"; `selectThreePairs()` takes 3 of 6. PRD right (three of six). Corrected by dropping. |
| 3.3 | Pop & Freeze | yes | `src/game/popFreezeLogic.ts` | **README stale** — said "6 sleeping-animal decoys"; `CONCURRENT_BUBBLES` 5 with `MIN_SLEEPING` 1/`MAX_SLEEPING` 2 from six animals, `WIN_TARGET` 6 pops. PRD right. Corrected by dropping. |
| 3.4 | Shadow Match | yes | `src/game/shadowMatchLogic.ts` | README right — 6 of 8, `WIN_TARGET` 6; matches PRD. |
| 3.5 | Musical Memory | yes | `src/game/musicalMemoryLogic.ts` | README made no pool claim. PRD right — start 2, 5 rounds, lengths 2→6, `MAX_RUN` 2. |
| 3.6 | Big & Small | yes | `src/game/bigSmallLogic.ts` | README right — 3 of 6 toy types shown big+small = 6 toys, 1.5×/0.7; matches PRD. |
| 3.7 | Pattern Builder | yes | `src/game/patternBuilderLogic.ts` | **PRD fixed** — claimed "six shapes to choose from"; the scene renders `round.choices.length` = 3, drawn from the 18-shape pool. Line now reads "three answer choices drawn from the 18 shapes". |
| 3.8 | Find the Letter | yes | `src/game/alphabetLogic.ts` | README right — 6 of 26 letters, 4 cards; matches PRD. |
| 3.9 | Find the Word | yes | `src/game/wordLogic.ts` | README right — 6 targets from 18 words (8 three-letter + 10 four-letter), no shared first letter; matches PRD. |
| 3.10 | Build the Word | yes | `src/game/wordLogic.ts` | README right — 3 words (2×3-letter + 1×4-letter), 6 tiles with distractors; matches PRD. |
| 3.11 | How Many? | yes | `src/game/countLogic.ts` | README right — 6 rounds, 3 or 4 cards, bands 3/5/10, 8 counting objects; matches PRD. |
| 3.12 | First Sounds | yes | `src/game/firstSoundsLogic.ts` | **PRD fixed** — claimed confusable pairs "b and p, d and t, g and k, s and z"; `SOUND_CONFUSABLE_PAIRS` holds only B/P and D/T. Line now lists those two. README's "6 of 9 first letters from a 12-word pool" is right. |
| 3.13 | More or Less | yes | `src/game/moreLessLogic.ts` | README right — 6 rounds, exactly 3 "more" + 3 "less", 2 per band; matches PRD. |
| 3.14 | Odd One Out | yes | `src/game/oddOneOutLogic.ts` | README right — 6 rounds, unique odd item, 33-texture pool; matches PRD. |
| 3.15 | Color Match | yes | `src/game/colorMatchLogic.ts` | README right — 4-colour pool for rounds 1–3 then 6-colour, 4 distinct cards; matches PRD. |
| 3.16 | Add It Up | yes | `src/game/addItUpLogic.ts` | README right — 6 rounds, bands ≤4/≤6/≤10, unique addend pairs, 4 distinct totals; matches PRD. |
| 3.17 | Take Away | yes | `src/game/takeAwayLogic.ts` | README right — 6 rounds, minuend > subtrahend (never zero), unique pairs; matches PRD. |
| 3.18 | Memory Match | yes | `src/game/memoryMatchLogic.ts` | README right — 2×3/3×4/4×4 grids, 2 rounds per band, 16-texture pool; matches PRD. |
| 3.19 | Decode It | yes | `src/game/decodeLogic.ts` | README right — 6 rounds, 3-letter then 4-letter, 22-word pool; matches PRD. |
| 3.20 | Number Order | yes | `src/game/numberOrderLogic.ts` | README right — 3/4/5 numerals from 1–5/1–8/1–10; matches PRD. |
| 3.21 | Feelings Faces | yes | `src/game/feelingsFacesLogic.ts` | README right — 6 rounds, 16 scenarios (4 per emotion), one per emotion + 2, contrast ramp; matches PRD. |
| 3.22 | Story Order | yes | `src/game/storyOrderLogic.ts` | README right — 6 rounds, 8 stories (4 obvious + 4 subtle), 3 per band; matches PRD. |

Facts intentionally dropped, with why:

- **The ✅ status column** — all 22 are implemented; the column carried no information.
- **The three stale README pool numbers** (3.1, 3.2, 3.3) — provably wrong against the logic modules, so not carried into the PRD.
- **"Ten narrate their round target … Musical Memory"** — wrong; PRD §4.2 already states nine round-target games, twelve rule-line games, and Musical Memory's note-only replay glyph.
- **Marketing suffixes in game names** (`Animal Trace-and-Connect`, `Pop & Freeze!`, `Musical Memory Simon`, `Big vs. Small Cleaner`) — they name nothing in the app, the PRD or the hub; the README now uses the hub labels from `src/game/hubTiles.ts`.
- **Implementation-only juice numbers** (1.2 s linger, 40 ms stagger, 800 ms mismatch pause, 256 px target) — the product-level behaviour moved into the PRD `**Feedback.**` bullets; the exact tween values stay in TDD §9.3/§9.4 where they already were. Nothing was deleted from the TDD.

## Before / after

| Item | Before | After |
|---|---|---|
| README total lines | 237 | 214 |
| `## Mini-Games` | 31 lines (24-line table + 2 prose paragraphs) | 27 lines (1 intro + 22 bullets) |
| `## Per-Game Juice` | 23 lines (intro + 18 bullets) | 4 lines (1 paragraph) |
| PRD `## 3.` field bullets | 110 (22 × 5) | 132 (22 × 6) |
| PRD lines changed | — | +25 / −3 |

## Deviations

| File | Reason |
|---|---|
| `docs/PRD.md` §3 intro | "the same five fields" had to become six once `**Feedback.**` joined the spec; the sentence lists the fields rather than counting them |
| `docs/PRD.md` §3.7, §3.12 | wrong pool/pair numbers corrected in place, as the brief requires where the PRD rather than the README is at fault |
| `README.md` game names | hub labels substituted for README-only marketing suffixes (`-and-Connect`, `!`, `Simon`, `Cleaner`, "Big vs. Small" → "Big & Small") so a roster line names a game that exists |

## Notes

- **PRD §3.10 still says** distractors are "drawn from the same word's letters plus nearby letters". `generateLetterTiles` draws them from `ALPHABET` excluding the word's own letters, so "nearby" is wrong. It is an `**Art and assets.**` claim, not a pool/round number, and this phase's remit is one bullet per game plus wrong numbers — recorded here rather than edited.
- Reduced-motion variants were kept wherever the juice pass had one: Shape Sorter (1.05× and level, 120 ms snap), Pop & Freeze (180 ms at 1.05×, breathing loop stopped), Animal Trace (one shorter half), Musical Memory (120 ms at 1.05×, drift stopped), Shadow Match (smaller pulse), Memory Match (120 ms half-flip), Feelings Faces (±2° / 200 ms) and the choice games (±2° / 200 ms on the wrong-answer wiggle). Build the Word, Odd One Out, Color Match, Add It Up, Take Away and Story Order had no handwritten variant to preserve: their motion is the shared press/wiggle/snap table in TDD §9.4, governed by the shared reduced-motion rule in PRD §5.7.
- `pnpm check` still reports its pre-existing warning and biome version info; neither is touched by this phase and the exit code is 0.
