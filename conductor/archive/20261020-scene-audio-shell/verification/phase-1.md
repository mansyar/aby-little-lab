# Phase 1 — Choice-round base + arithmetic merge

| | |
| --- | --- |
| **Track** | `20261020-scene-audio-shell` — Shared Choice-Round Shell + Audio Focus |
| **Phase** | 1 — Choice-round base + arithmetic merge |
| **Date** | 2026-10-20 |
| **Branch** | `refactor/20261020-scene-audio-shell` |
| **Base** | `7b7a313` |
| **Head** | `1443595` (code); this report is committed after it |

**Result:** verified

## What changed

- `src/scenes/ChoiceRoundScene.ts` — new abstract base: round-object teardown,
  the 96 px choice-target factory with press feedback, and the shared
  correct/wrong handlers (input lock, chime, `recordCorrect`, mascot cheer,
  progress-dot pop, 700 ms advance; soft tone, `recordWrong`, mascot nod,
  reduced-motion-aware wiggle). Subclasses supply round content plus optional
  per-game extras.
- `src/scenes/GroupMathScene.ts` — new config-driven scene: equation row
  (prompt card, operation cue, prompt card, equals), four answer cards with dot
  groups, playthrough wiring. Config pins instruction, game id, cue texture,
  logic module and prompt-card accessor.
- `src/scenes/AddItUpScene.ts`, `src/scenes/TakeAwayScene.ts` — reduced to thin
  subclasses (280 → 25 and 281 → 26 lines) pinning their config. Scene keys,
  module paths, class names, game ids, sticker keys, spoken rules and band-shift
  keys are unchanged.
- `src/__tests__/scenes/choiceRoundScene.test.ts` — 11 new tests exercising the
  base directly.
- `src/scenes/sceneRegistry.ts` — **no change required**: both keys still import
  `./AddItUpScene` / `./TakeAwayScene`, which still export `AddItUpScene` /
  `TakeAwayScene`.

Unchanged by design: `src/__tests__/scenes/addItUpScene.test.ts` and
`src/__tests__/scenes/takeAwayScene.test.ts` (no line touched — see
`git diff --stat 7b7a313..HEAD`, which lists only the five files above).

## Commands

Every layer was run both individually and once as the exact phase verification
string. All exited `0`.

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| Static | `pnpm check` | 0 | 197 files checked, 0 errors. One pre-existing warning (`noNonNullAssertion` at `src/__tests__/scenes/musicalMemoryScene.test.ts:294`, untouched by this phase) and one pre-existing Biome schema-version info. |
| Types | `pnpm typecheck` | 0 | `tsc --noEmit` clean. |
| Unit | `pnpm test -- --run` | 0 | 99 files, 2,103 tests passed (pre-track 2,092 + 11 new base tests). Both arithmetic suites pass byte-for-byte unchanged. |
| Coverage | `pnpm test:coverage` | 0 | Statements 98.12 % (4,973/5,068), branches 89.72 % (1,127/1,256), functions 97.98 % (926/945), lines 98.93 % (4,649/4,699) — gates 90 / 85 / 88 / 95. `ChoiceRoundScene.ts` and `GroupMathScene.ts` are both 100 % statements / branches / functions / lines (see evidence paths). |
| Build | `pnpm build` | 0 | 270 modules transformed; 43 precache entries (1,667.09 KiB). |
| Bundle | `node scripts/validate-bundle.js` | 0 | `PASS: Phaser vendor chunk present: phaser-P1E8uaLi.js`; `PASS: shell entry index-DAtV9mTw.js = 189.3 kB (<= 200 kB)`. |
| PWA | `node scripts/validate-pwa.js` | 0 | 15 passed, 0 failed. |

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| AC-2 | Add It Up and Take Away both run through `GroupMathScene`; both chunks are emitted; each keeps its own game id, band shift and sticker; both suites pass. | `GroupMathScene` is the only parent of both scenes; build emits `AddItUpScene-DDthdxS4.js` (1.22 kB) and `TakeAwayScene-BizlLQkh.js` (1.22 kB) over one shared `GroupMathScene-DRnlNRzt.js` (3.85 kB). `addItUpScene.test.ts` asserts `buildPlaythrough` receives the `add-it-up` shift, `recordGameResult`/`sticker_add_it_up`/`{justEarned:"add-it-up"}`; `takeAwayScene.test.ts` asserts the same for `take-away`. Both pass unmodified. | Met |
| AC-3 | All thirteen choice scenes extend `ChoiceRoundScene`, suites unchanged. | 2 of 13 scenes (Add It Up, Take Away) now extend it; the other 11 still carry their own handlers (Phases 2–3). The two migrated suites pass with no assertion change. | In progress (track-level; Phases 2–3) |
| AC-7 | Build + `validate-bundle` + `validate-pwa` pass; shell ≤ 200 kB. | See commands table — all three exit 0. | Met |
| NFR-1 | Shell entry ≤ 200 kB; each lazy chunk within +1 kB of its pre-track size; `validate-bundle` passes. | Shell entry `index-DAtV9mTw.js` = 193.84 kB raw (189.3 kB as the validator reports it) vs the 200 kB ceiling. Arithmetic chunks only got smaller: Add It Up and Take Away were one identical 4.27 kB chunk each pre-track, now 1.22 kB each plus one 3.85 kB shared `GroupMathScene` chunk — 6.29 kB for the pair versus 8.54 kB. No other game chunk's source module was touched (see chunk table below). | Met |
| NFR-2 | No test deleted or weakened; existing assertions untouched. | `git diff 7b7a313..HEAD -- src/__tests__/scenes/addItUpScene.test.ts src/__tests__/scenes/takeAwayScene.test.ts` is empty; suite count rose 2,092 → 2,103. | Met |
| NFR-4 | Reduced motion preserved; no new animation above the 800 ms ceiling. | Base declares no durations of its own beyond the 250 ms flash; wiggle stays 4°/350 ms normal and 2°/200 ms reduced (asserted in `choiceRoundScene.test.ts`, and by both existing suites). | Met |
| NFR-5 | Kid-visible timing and SFX order unchanged. | Base mirrors the old handlers exactly: 700 ms advance, 250 ms success flash, correct = chime → `recordCorrect` → cheer → dot pop; wrong = soft tone → `recordWrong` → nod → wiggle. Existing suites assert the 700 ms and 250 ms calls and the tween shapes. | Met |
| NFR-8 | Coverage ≥ 95/88/85/90 with both new modules covered directly. | See coverage row; both new modules at 100 % on all four metrics, driven by the new base suite. | Met |
| FR-1 | Base owns round lifecycle, targets, correct/wrong handling; subclasses supply content + extras. | `ChoiceRoundScene`: `renderRound`/`clearRound`/`trackRoundObject`, `createChoiceTarget`, `handleChoice`/`handleCorrect`/`handleIncorrect`, hooks `totalRounds`, `gameId`, `buildRoundContent`, `isChoiceCorrect`, `clearRoundContent`, `wiggleTargets`, `onCorrect`, `onWrong`. | Met |
| FR-2 | Two games share one implementation configured by rule set, keeping key/path/ids/rule/shift/progress/sticker. | `GroupMathConfig` (instruction, game id, cue, logic module, prompt-card accessor); see AC-2 evidence. | Met |

### Bundle sizes (from the verified build)

| Chunk | Size | Note |
| --- | --- | --- |
| `index-DAtV9mTw.js` (shell entry) | 193.84 kB / 37.02 kB gzip | 189.3 kB per `validate-bundle.js`, ceiling 200 kB |
| `phaser-P1E8uaLi.js` | 1,374.82 kB | vendor, untouched |
| `GroupMathScene-DRnlNRzt.js` | 3.85 kB | new shared chunk (with `ChoiceRoundScene`), loaded only by the two arithmetic games |
| `AddItUpScene-DDthdxS4.js` | 1.22 kB | was a 4.27 kB duplicate |
| `TakeAwayScene-BizlLQkh.js` | 1.22 kB | was a 4.27 kB duplicate |
| `GameSceneBase-DO7YjXab.js` | 5.90 kB | untouched module |
| other 15 game chunks | 2.78–6.64 kB | source modules untouched; largest is `FeelingsFacesScene` 6.64 kB |

## Evidence paths

- `conductor/tracks/20261020-scene-audio-shell/verification/phase-1.md` (this file)
- `coverage/src/scenes/ChoiceRoundScene.ts.html` — 54/54 statements, 10/10 branches, 15/15 functions, 51/51 lines
- `coverage/src/scenes/GroupMathScene.ts.html` — 72/72 statements, 0/0 branches, 10/10 functions, 70/70 lines
- `dist/assets/` — chunk sizes in the table above (regenerated by the verified `pnpm build`)
- Commits: `ebf91a5` (base), `796d8e6` (arithmetic merge), `1443595` (base tests)

## Deviations

None. All five changed files are inside `Touches`; `sceneRegistry.ts` needed no
edit because both module paths and class names were preserved.

## Notes

- The first render of a `ChoiceRoundScene` tears down an empty round before
  building. That is deliberate and matches the pre-merge behaviour
  (`renderRound()` also began with `clearRound()`), and it is what keeps a
  scene relaunch from stacking a second set of cards; the base suite asserts
  the `teardown → build → teardown → build` sequence.
- `GroupMathScene` keeps the playthrough in each logic module's native round
  shape (`addends` for Add It Up, `promptCards` for Take Away) and reads the
  cards through a config accessor, so the existing suites can keep addressing
  `scene.rounds[i].addends` / `.promptCards` unchanged.
- `rg "private handleCorrect" src/scenes` now reports 12 files (11 not yet
  migrated + `ChoiceRoundScene`); the two arithmetic duplicates are gone and the
  remaining eleven are the scope of Phases 2–3 toward AC-1/AC-3.
- Pre-existing, not introduced here: the Biome warning in
  `musicalMemoryScene.test.ts:294` and the `biome.json` schema-version info line.
