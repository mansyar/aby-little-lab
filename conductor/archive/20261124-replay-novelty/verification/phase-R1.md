# Phase R1 evidence — Review fixes (20261124-replay-novelty)

- **Track:** `20261124-replay-novelty`
- **Branch / base:** `feat/20261124-replay-novelty` @ `08c6851c`
- **Head:** this commit (three review fixes + this evidence; SHA reported in the phase JSON)
- **Scope:** round-1 review findings F1 (Medium), F2 (Medium), F3 (Low) — strict mode, all fixed
- **Requirements:** evidence integrity (AC mapping), FR-4/AC-4, FR-9/AC-9

## Per-finding before / after

### F1 — integrated evidence AC table renumbering (Medium)

**File:** `conductor/tracks/20261124-replay-novelty/verification/integrated.md` (AC table)

| Row | Before | After |
| --- | --- | --- |
| AC-3 | `≥4 median distinct games over eight-play visits` — seeded simulation in `replayVariety.test.ts` | `Three-level deterministic ordering (unplayed → least-recently played → registry order)` — `replayVariety.test.ts` deterministic-ordering suite, phase-1.md |
| AC-8 | `No new SVG/audio/TTS/save field/game rule` — diff scope; all guards green | `Seeded 1,200 eight-play visits, median distinct ≥ 4, zero unexpected repeats` — `replayVariety.test.ts` |
| NFR-2 | (no row existed) | new row: `Reuses existing art/assets: no new SVG/audio/TTS/save field/game rule` — diff scope; all guards green |

AC-1, AC-2, AC-4..AC-7, AC-9, AC-10 and every checkpoint number are unchanged. The frozen
`spec.md` meanings are now restored: AC-3 = three-level ordering, AC-8 = seeded simulation, and the
no-new-art claim lives on the NFR row where it belongs.

### F2 — stale suggestion ring after page flip / group filter (Medium)

**Files:** `src/game/hub/replayCue.ts`, `src/scenes/HubScene.ts`,
`src/__tests__/scenes/hubScene.test.ts`

- `ReplayCueController` gains `refreshCue(): void`, implemented as a clear-only refresh: it calls
  `clearRing()`. `onBoardChange` fires *before* `flipTo`/`rebuildBoard`/`handleViewportChange`
  rebuild the board, so re-deriving against still-visible old tiles would point at a game that is
  about to move; clearing is the robust fix. The next visit re-derives the cue for the new board.
- `HubScene`'s grid `onBoardChange` arrow now calls both `this.hideLoadCue()` and
  `this.replayCue.refreshCue()`.
- Existing test `maps page-1 tiles to games 11-20 (How Many? first)` now asserts the ring is
  defined on entry and `undefined` immediately after the second page dot is tapped. No new `it()`
  was added, so the derived suite truth stays 155 files / 3,362 tests.
- `HubScene.ts` comment block compressed from five lines to one so the file stays at 399 lines
  (≤400 guard).

### F3 — docs overstate the sticker spotlight (Low)

| File | Before | After |
| --- | --- | --- |
| `README.md:156` | "the suggestion, wiggle and spotlight avoid the games just played or suggested and reset when the child switches profile" | Only the suggestion and the two idle-wiggling tiles are said to avoid just-played/just-suggested games and reset on switch; the spotlight advances one earned sticker per visit in registry order with wrap-around, is re-derived per profile with its cursor resuming, and falls back to one empty slot when none are earned |
| `docs/PRD.md:106` | "neither repeats the game just played or just suggested, and the idle wiggle follows the same no-repeat rule" | The ring avoids the just-played/just-suggested game and the wiggle follows it; the sticker highlight advances one earned sticker per visit in game order with wrap-around, is re-derived per profile with its cursor resuming, and falls back to one empty slot |

`docs/PRD.md` §4.4 already described the spotlight correctly and was left unchanged. No count
number, coverage percentage or date was edited.

## Files touched

| File | Change |
| --- | --- |
| `conductor/tracks/20261124-replay-novelty/verification/integrated.md` | AC-3/AC-8 restored to frozen meanings; no-new-art claim moved to a new NFR-2 row |
| `src/game/hub/replayCue.ts` | `refreshCue()` added to the controller interface and implemented as a clear-only ring removal |
| `src/scenes/HubScene.ts` | `onBoardChange` calls `replayCue.refreshCue()`; one comment compressed (399 lines) |
| `src/__tests__/scenes/hubScene.test.ts` | entry/cleared ring assertions embedded in the existing page-flip case |
| `README.md` | Hub Experience sentence reworded so the no-repeat claim covers only suggestion + wiggle |
| `docs/PRD.md` | §1.5 Hub step reworded likewise; §4.4 untouched |
| `conductor/tracks/20261124-replay-novelty/verification/phase-R1.md` | new — this evidence |

No `conductor/product.md`, `plan.md`, `metadata.json`, `review.md`, `tracks.md`, `scripts/**`,
`package.json` or `conductor/workflow.md` file was touched. No new test file: suite truth remains
155 files / 3,362 tests.

## Acceptance-criteria mapping

| Finding / requirement | Where proved | Result |
| --- | --- | --- |
| F1 — evidence integrity (AC mapping) | integrated.md AC table; AC-3/AC-8 match the frozen `spec.md`, no-new-art claim on NFR-2 | PASS |
| F2 — FR-4 / AC-4 | `refreshCue()` clears the ring on board change; `hubScene.test.ts` page-flip case asserts ring defined → undefined | PASS |
| F3 — FR-9 / AC-9 | README:156 and PRD:106 now describe only suggestion/wiggle no-repeat and the real advancing spotlight; `validate-docs.js` 5/5 | PASS |
| Scope guard | No source outside the three listed modules, no count/date/coverage edit, all production modules ≤400 lines | PASS |

## Commands and results

| Command | Exit | Result |
| --- | --- | --- |
| `pnpm exec vitest run src/__tests__/scenes/hubScene.test.ts src/__tests__/scenes/hubEngagement.test.ts` | 0 | 2 files passed, 127 tests passed |
| `node scripts/validate-docs.js` | 0 | 5 passed / 0 failed |
| `pnpm check` | 0 | clean, 367 files |
| `pnpm typecheck` | 0 | clean (src + e2e) |
| `node scripts/validate-module-size.js` | 0 | 169 modules, zero warnings; touched modules ≤400 lines |

All five commands were run separately (no `&&` chains).

## Deviations

- `refreshCue()` clears the ring rather than redrawing it on the new board: `onBoardChange` fires
  before the rebuild, so the visible entries at that instant are the outgoing tiles. FR-4 is
  satisfied because the cue is removed from a tile that is about to launch a different game; the
  next visit derives a fresh cue for the new board.
- An NFR-2 row was added to the integrated acceptance table because none existed; the brief asked
  to move the no-new-art claim onto "the NFR-2 row" without changing any AC number.

## Blockers

- None.

## Primary verification (orchestrator, independent)

- Clean tree before squash; diff confined to the seven R1 Touch files (`git diff --name-only 08c6851c..HEAD`); subagent commit `0b8e9fcc` conventional.
- F1 confirmed: integrated.md AC-3 = three-level ordering, AC-8 = 1,200-visit seeded simulation, no-new-art moved to NFR-2.
- F2 confirmed: `refreshCue()` added to `replayCue.ts` interface + implementation (clear-only), wired into `HubScene.ts:145-148` `onBoardChange`, with ring defined→undefined assertions embedded in the existing page-flip case in `hubScene.test.ts`; no new `it()`.
- F3 confirmed: `README.md:156` and `docs/PRD.md:106` reworded so only the cue/wiggle claim no-repeat, spotlight described as an advancing per-profile cursor with wrap-around and empty-slot fallback.
- Full `verify_phase` re-run exit 0: `pnpm check` clean 367 files; `pnpm typecheck` src+e2e clean; `pnpm test -- --run` 155 files / 3,362 tests; `pnpm test:coverage` 155 / 3,362, 97.09% stmts / 90.82% branches / 96.32% funcs / 98.26% lines vs gates 95/88/85/90; `pnpm build` 489 modules, shell `index-CLI9kc4t.js` 197.43 kB Vite / 192.8 kB validator; `validate-bundle.js` PASS; `validate-module-size.js` 169 files zero warnings; `validate-textures.js` 319 SVGs, ratio 0.238; `validate-pwa.js` 16/16; `validate-docs.js` 5/5.
- All three findings resolved; suite truth unchanged 155 / 3,362.

## Result

Result: verified
