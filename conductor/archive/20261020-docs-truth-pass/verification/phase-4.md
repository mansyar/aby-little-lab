# Phase 4 — product.md Current-State Truth

- **Track:** `20261020-docs-truth-pass` — Docs & Dead-Code Truth Pass
- **Phase:** 4 of 6 — product.md Current-State Truth
- **Date:** 2026-10-20
- **Branch:** `chore/20261020-docs-truth-pass`
- **Base:** `2fec7b1fa2c3ae1d1c6b4dd8bd03c5cbf0b0dd34`
- **Head at verification:** `e76818c` (`docs(prd): correct the Build the Word distractor claim`), on top of the base
- **Covers:** FR-5, FR-11, NFR-4, AC-5

## 2. Result

**blocked.**

`docs/PRD.md` §3.10 was corrected and the full quality gate is green (P4.T4 done, P4.T2
audit done, P4.T3 history proof holds). The phase's central deliverable — the
`conductor/product.md` §3.2 adaptive sentence — **could not be applied**: every
`edit` against `conductor/product.md` was refused by the session sandbox with
`permission.rejected: Permission denied: edit`. That file is a Conductor product doc,
which this executor's role contract marks as primary-owned, so it was not retried
through another tool. The exact, ready-to-apply replacement is quoted in §6 below;
applying it is a one-line edit the primary agent must make (or it must re-run this
phase with the path permitted). Until then FR-5/AC-5 are **not** satisfied.

## 3. Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| check | `pnpm check` | 0 | 230 files checked; 1 warning (`musicalMemoryScene.test.ts:294` non-null assertion), 1 info (biome schema 2.5.5 vs CLI 2.5.10). No errors. |
| types | `pnpm typecheck` | 0 | `tsc --noEmit` clean. |
| tests | `pnpm test -- --run` | 0 | 110 files, 2,305 tests passed, 25.0 s. |
| coverage | `pnpm test:coverage` | 0 | 110 files / 2,305 tests passed; statements 97.8 %, branches 90.73 %, functions 96.34 %, lines 98.59 % — all above the `vite.config.ts` thresholds (95/85/88/90). |
| build | `pnpm build` | 0 | 316 modules, `dist/` built in 601 ms; PWA precache 53 entries / 1,702.03 KiB. |
| bundle | `node scripts/validate-bundle.js` | 0 | Phaser vendor chunk present; shell entry 129.1 kB ≤ 200 kB. |
| pwa | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed. |

Run as the single chained command from the phase contract:
`pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js` → overall exit **0**.

The JSON-import warning in test/coverage/build output is expected here: `vite.config.ts:4`
is Phase 5's (P5.T4) fix, not this phase's, and the gate does not fail on it.

## 4. P4.T2 — the audit

Checked in the order the brief gives. "Right" means the line was left byte-identical.

| Claim in `conductor/product.md` | Source checked | Verdict | Line |
| --- | --- | --- | --- |
| 22 mini-games; the §3.1 roster order | `src/game/hubTiles.ts` — `GAME_TILES` holds 22 entries in exactly the §3.1 order (Shape Sorter → Animal Trace → Pop & Freeze → Shadow Match → Musical Memory → Big & Small → Pattern Builder → Find the Letter → Find the Word → Build the Word → How Many? → First Sounds → More or Less → Odd One Out → Color Match → Add It Up → Take Away → Memory Match → Decode It → Number Order → Feelings Faces → Story Order) | right | 27–48 |
| Domain counts: cognitive 4, fine motor 1, inhibitory 1, visual discrimination 2, working memory 2, early literacy 5, early numeracy 5, social-emotional 1, narrative 1 | `docs/PRD.md` §2.2 table + its own `Domain counts:` line; totals 4+1+1+2+2+5+5+1+1 = 22 | right | 27–48 |
| §6 flow: "22 game tiles grid (6×4 at 144px — rows 6/6/6/4)" | `src/game/hubGrid.ts` — `TILE_WIDTH = 144`, `GRID_COLS = 6`, `GRID_ROWS = 4`; `buildWideGrid()` walks `GAME_TILES.length` (22) as `i % 6` / `Math.floor(i / 6)`, i.e. rows 6/6/6/4 | right | 85 |
| §6 PreloadScene "three tiers (icon 160, card 256, hero 512)" | `src/utils/textureTiers.ts` — `TEXTURE_SIZES = { icon: 160, card: 256, hero: 512 }` | right | 84 |
| Shape Sorter: 18-shape pool, 3 rounds × 3 | `src/game/shapeSorterLogic.ts` — `ALL_SHAPES` = 18 types; `generatePlaythrough` slices 3 per round; `src/scenes/ShapeSorterScene.ts` — `ROUND_COUNT = 3` | right | 27 |
| Musical Memory: C4/E4/G4 | `src/scenes/MusicalMemoryScene.ts:25` — `FROG_FREQUENCIES = [261.63, 329.63, 392.0]` (C4/E4/G4) | right | 31 |
| Number Order: 3–5 numerals; 1–5 → 1–8 → 1–10; 6 rounds | `src/game/numberOrderLogic.ts` — `BAND_RANGES` 1–5/1–8/1–10, `BAND_COUNTS` 3/4/5, `buildPlaythrough` maps the 6-step `BASE_LADDER` | right | 46 |
| Story Order: 3 slots with 1/2/3 pips, 8-story pool, 6 rounds | `src/game/storyOrderLogic.ts` — `STORY_POOL` = 8 stories × 3 panels, `ROUND_COUNT = 6`; `src/scenes/StoryOrderScene.ts` draws `count` pips per slot (`drawPips`, "the only ordinal cue (no digits)") | right | 48 |
| Feelings Faces: 16 scenarios, 6 rounds, 3 faces | `src/game/feelingsFacesLogic.ts` — `SCENARIO_POOL` = 16 (4 per emotion), `ROUND_COUNT = 6`, `buildRoundChoices` always returns 3 | right | 47 |
| Decode It: 6 rounds, 3→4-letter bands | `src/game/decodeLogic.ts` — `buildPlaythrough(roundCount = 6, shift = 0)` splits `classicEasy = 3` three-letter then three four-letter | right | 45 |
| Memory Match: 2×3 → 3×4 → 4×4 over 6 rounds | `src/game/memoryMatchLogic.ts` — `BAND_GRID` easy 2×3 / medium 3×4 / hard 4×4; `bandForRound` = easy, easy, medium, medium, hard, hard | right | 44 |
| §5 platform: PWA, offline, landscape, 1024×768 FIT | `vite.config.ts` — `VitePWA` manifest `display: standalone`, `orientation: landscape`, workbox globs `js/css/html/ico/png/svg/woff2` + `includeAssets` bgm and font; `src/main.ts` — `width: 1024`, `height: 768`, `scale.mode = Phaser.Scale.FIT`, `autoCenter = CENTER_BOTH` | right | 69, 73–75 |
| §6 paged phone layout (5×2) | `src/game/hubPaging.ts` — `PAGE_SIZE = 10`, `PAGE_COUNT = 3` (22 tiles as 10 + 10 + 2), `pagedTilePosition` lays out 5 columns × 2 rows of 176×196 tiles | **not found** — no current-state section mentions paging; the only mention is inside the frozen `2026-10-17` entry, which stays untouched | — |
| §3.2 Adaptive Difficulty thresholds | `src/game/adaptiveLogic.ts` | **fix prepared, not applied** (sandbox refused the edit) | 58 |

Every verdict except the last is "right": the diff for `conductor/product.md` is empty
(`git diff -U0 conductor/product.md` → no output, see §5). Nothing was reworded to
"improve" it.

### The paged-layout finding (no edit made)

`product.md` §6 describes only the wide grid. The code has a narrow-viewport mode
(three pages of 10 + 10 + 2 tiles, a 5×2 grid of 176×196 tiles, swipe + page dots —
`hubPaging.ts`, `hubGrid.ts`). That is an **omission**, not a false claim, so under the
phase rule "fix only what is wrong" it was recorded rather than added: introducing a
new claim is not one of this phase's two named fixes, and the frozen 2026-10-17 entry is
the only place paging is described (with its own now-historical 20-tile / two-page
numbers). Flagged for the primary: if the current-state section should carry paging, the
true sentence is "phones render the same 22 tiles as three 5×2 pages of 176×196 tiles
(10 + 10 + 2)."

## 5. P4.T3 — dated history is untouched

- Count of dated entries in `conductor/product.md` (`^> \*\*YYYY-MM-DD`): **14** —
  lines 128, 132, 136, 140, 144, 146, 150, 154, 158, 162, 166, 170, 174, 178.
- `git diff -U0 conductor/product.md`: **no output** — the file is unmodified in this
  phase, so the number of changed dated lines is **0** (0 of 14).
- The check the brief specifies (`git diff -U0 conductor/product.md` filtered for
  `^[-+]> \*\*`) is therefore empty by construction. It is weaker evidence than a
  non-empty diff with a clean date filter would be, because the file never changed;
  the honest statement is "history was not rewritten because nothing was written".
- Known-stale text left in place as instructed: line 140 still says "the 20-tile hub
  renders as two 5×2 pages" and "the 170 preloaded SVGs", and line 132 still says
  "paged mode 10 + 10 + 1" for 21 tiles. Current state is 22 games / 178 texture keys /
  10 + 10 + 2; the frozen entries keep their own era's numbers.

## 6. P4.T1 — the adaptive paragraph

### Before (applied text, `conductor/product.md:58`)

> `- **Adaptive Difficulty** *(2026-08-27)*: In the five early-numeracy games (How Many?, More or Less, Add It Up, Take Away, and Number Order — 2026-08-28, twelfth adaptive game), the easy-first difficulty ladder may shift one band up or down at the start of a playthrough, based on the kid's last 10 taps in that game (per profile, re-evaluated fresh each session, never mid-game). Strong recent performance (≥90% over ≥10 taps) nudges the ladder up; struggling (<60%) nudges it down; with too few taps or the toggle off, the classic ladder is used. Invisible to kids (no labels, no tiers, no fail states); parents can turn it off in Settings → Adaptive Difficulty, and the Learning Progress report notes that difficulty adapts to recent answers.`

The false claim is `≥90% over ≥10 taps`: `MIN_SAMPLE = 6`, so ten taps are never required.

### After — prepared, NOT applied

Replacement for the single sentence
`Strong recent performance (≥90% over ≥10 taps) nudges the ladder up; struggling (<60%) nudges it down; with too few taps or the toggle off, the classic ladder is used.`

with:

> `Strong recent performance (≥90% across the last 10 taps, once at least 6 taps are in that window) nudges the ladder up; struggling (<60%) nudges it down; anything in between leaves the ladder steady, every step is clamped to the game's own band range, and with fewer than 6 taps or the toggle off the classic ladder is used.`

Everything else on line 58 is unchanged. The replacement states exactly what the code
does and nothing more:

| Code fact | Source |
| --- | --- |
| `WINDOW_SIZE = 10` — a ten-tap window | `src/game/adaptiveLogic.ts:14` |
| `MIN_SAMPLE = 6` — no shift below six taps | `src/game/adaptiveLogic.ts:17`, `bandShiftFor()` returns 0 when `recent.length < MIN_SAMPLE` |
| `UP_THRESHOLD = 0.9`, `accuracy >= UP_THRESHOLD` → `+1` | `src/game/adaptiveLogic.ts:20, 55–57` |
| `DOWN_THRESHOLD = 0.6`, `accuracy < DOWN_THRESHOLD` → `-1` | `src/game/adaptiveLogic.ts:23, 58–60` |
| otherwise `0` — nothing in between moves the ladder | `src/game/adaptiveLogic.ts:61` |
| `shiftLadder()` clamps every step to 1–3 | `src/game/adaptiveLogic.ts:69–74` |
| `BASE_LADDER = [1,1,2,2,3,3]` — the classic ladder | `src/game/adaptiveLogic.ts:26` |
| toggle off → 0 regardless of the window | `src/utils/storage.ts:270–272` — `if (!getSettings().adaptiveDifficulty) return 0;` |
| computed at playthrough build, never mid-game | 15 scene call sites, e.g. `NumberOrderScene.ts:71`, `WordBuilderScene.ts:125`, `MusicalMemoryScene.ts:121`, all inside `create()` |

Without this edit, FR-5 and AC-5 remain unmet.

## 7. P4.T4 — PRD §3.10 Build the Word

### Before (`docs/PRD.md:241`)

> `Extra tiles are distractors drawn from the same word's letters plus nearby letters.`

### After (`docs/PRD.md:241`, commit `e76818c`)

> `Extra tiles are two or three distractors drawn from the alphabet minus the word's own letters, shuffled in with the word's letters.`

The rest of §3.10 and the rest of the PRD are byte-identical
(`git diff -- docs/PRD.md` = 1 insertion, 1 deletion, that line only).

### The code that decides it (`src/game/wordLogic.ts:118–131`)

```ts
/**
 * Builds the 6 letter tiles for a word: the word's unique letters plus
 * 2–3 distractor letters not in the word, all shuffled.
 */
export function generateLetterTiles(word: string): string[] {
  const uniqueLetters = [...new Set(word.split(""))];
  const distractorCount = 6 - uniqueLetters.length;
  const wordLetters = new Set(uniqueLetters);
  const distractors = shuffle(ALPHABET.filter((letter) => !wordLetters.has(letter))).slice(
    0,
    distractorCount,
  );
  return shuffle([...uniqueLetters, ...distractors]);
}
```

There is no "nearby letter" or shape-similarity filter anywhere in `wordLogic.ts`; the
only confusability logic in the file belongs to Find the Word, which groups words by
first letter. Six tiles per word: the word's unique letters (3 or 4) plus 2–3 letters
drawn from the remaining alphabet.

## 8. Deviations

| File | Reason |
| --- | --- |
| `conductor/product.md` — **not modified** | Both `edit` attempts returned `permission.rejected: Permission denied: edit`. The file is a Conductor product doc, which this executor's role contract reserves for the primary agent, so no alternative write path (shell, scratch file, rewrite) was used to work around the denial. The prepared one-sentence replacement is in §6. |
| `conductor/tracks/20261020-docs-truth-pass/verification/phase-4.md` | Required evidence file (allowed by the brief). |

## 9. Notes for the primary

1. **Blocking action:** apply the §6 replacement to `conductor/product.md:58` (or grant
   this executor write access to that path and re-run the phase). Nothing else in
   `product.md` needs to change — the audit found the other twelve current-state claims
   correct.
2. **AC-5 after the fix** will be provable exactly as written: the adaptive text then
   names 10 / 6 / 0.9 / 0.6, and the dated-entry diff stays empty because the edit is on
   line 58, outside every `> **YYYY-MM-DD**` entry.
3. **Optional, your call:** the current-state sections never mention the paged phone
   layout (three 5×2 pages of 10 + 10 + 2). Adding it is a new claim, not a correction,
   so it was left out; the true sentence is quoted in P4.T2 above.
4. The gate run above was taken with only the PRD change present, so the from-scratch
   evidence for the `product.md` edit is a docs-only diff and needs no re-run — but a
   re-run after the edit is free of risk and cheap enough to prefer.

## 10. Primary verification (text edit applied by the primary)

The phase executor could not write conductor/product.md (sandbox refusal), so the primary applied the two product.md edits and re-ran the whole gate.

### Edit 1 - adaptive sentence, line 58

Before:

> Strong recent performance (>=90% over >=10 taps) nudges the ladder up; struggling (<60%) nudges it down; with too few taps or the toggle off, the classic ladder is used.

After:

> Strong recent performance (>=90% across that 10-tap window, once at least 6 taps are in it) nudges the ladder up; struggling (<60%) nudges it down; anything between leaves the ladder steady, every step is clamped to the game's own band range, and with fewer than 6 taps or the toggle off the classic ladder is used.

Source: `src/game/adaptiveLogic.ts` (WINDOW_SIZE 10, MIN_SAMPLE 6, UP 0.9, DOWN 0.6, shiftLadder clamped to 1-3) and `getAdaptiveBandShift()` in `src/utils/storage.ts` (0 when the toggle is off).

### Edit 2 - paged phone layout, line 85

The audit found the paged layout absent from the current-state sections, which made "6x4 at 144px" read as universal. One clause added:

> ... 22 game tiles grid (6x4 at 144px - rows 6/6/6/4) on wide viewports, collapsing to three pages of 5x2 (10 + 10 + 2) with swipe and page dots below the touch floor on phones ...

Source: `src/game/hubPaging.ts` (PAGE_SIZE 10, PAGE_COUNT 3, PAGED_TILE 176x196, NARROW_SCALE_THRESHOLD = 64 / 116, documented as the wide tile's min edge falling under the 64px floor).

### Dated-history proof

- `git diff -U0 conductor/product.md | rg '^[+-]> \*\*'` -> 0 lines.
- Dated `> **20...` entries in the file: 14, unchanged.
- Diff: 2 insertions, 2 deletions, both inside current-state lines 58 and 85.

### Gate re-run (docs-only change)

| Step | Exit |
| --- | --- |
| `pnpm check` | 0 |
| `pnpm typecheck` | 0 |
| `CI=true pnpm test -- --run` | 0 (110 files, 2,305 tests) |
| `pnpm test:coverage` | 0 |
| `pnpm build` | 0 |
| `node scripts/validate-bundle.js` | 0 |
| `node scripts/validate-pwa.js` | 0 |

Coverage this run: statements 97.78 (5112/5228), branches 90.66 (1233/1360), functions 96.34 (1027/1066), lines 98.59 (4756/4824). Branches moved 90.73 -> 90.66 between runs with no code change, so the branch figure is data-dependent; the docs should quote it as approximate (tracked for the docs sync).

Raw outputs: `.conductor/evidence/phase-4-primary-*.txt`.
