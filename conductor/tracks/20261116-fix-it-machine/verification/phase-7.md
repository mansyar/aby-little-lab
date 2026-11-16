# Phase 7 — Review Fixes (R1): verification

- **Track:** `20261116-fix-it-machine`
- **Phase:** 7 of 7 — Review Fixes (R1), findings R1-1 to R1-7
- **Branch:** `feat/20261116-fix-it-machine`
- **Evidence log:** `.conductor/evidence/20261116-fix-it-machine/phase-7-gate.log` (gate exit 0)
- **Finding evidence:** `.conductor/evidence/20261116-fix-it-machine/stale-glob-probe.log` (R1-1's 5 failures on a fresh transform)

## Verification command

```
pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage &&
pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js &&
node scripts/validate-docs.js
```

**Exit status: 0.**

| Step | Result |
| --- | --- |
| `pnpm check` | clean, 337 files |
| `pnpm typecheck` | no errors, both projects (`tsc --noEmit` and `e2e/tsconfig.json`) |
| `pnpm test -- --run` | 153 files / **3,306** tests |
| `pnpm test:coverage` | statements 97.07 %, branches 90.73 %, functions 96.19 %, lines 98.24 % |
| `pnpm build` + `validate-bundle.js` | shell entry 186.4 kB ≤ 200 kB |
| `validate-pwa.js` | 16/16 |
| `validate-docs.js` | 5/5 |

## Findings and fixes

### R1-1 (High) — the art-declaration scan covers the 24th scene

`src/__tests__/scenes/artDeclarations.test.ts` now discovers 24 game scenes: `fixItMachineArt` and
`fixItMachineLogic` are in `GAME_MODULES`, `FixItMachineScene` is in
`SCENE_LOCAL_PRELOADER_SCENES` and `SCENE_LOCAL_PRELOADER_CALLS`
(`preloadFixItMachineArt(this)`), the scene source is in the per-scene source map, and the count
literals and comments read 24. The file now runs 54 cases green where a fresh transform previously
failed 5. The underlying cache hazard is real and worth knowing: Vite caches the *transform* of a
module containing `import.meta.glob`, so a stale glob can outlive the file list it was expanded
from; any change to this file's content forces the truth back out, which is how the failure was
found and how the fix was proven.

### R1-2 (High) — the hint ladder is the three cues FR-11 specifies

`applyHint` now escalates exactly as the spec says:

- **two missed taps** — `drawHintBand()` fills and strokes a soft amber rounded band from card 0
  through the wrong card, drawn from the same `tapePoint()` constants as the cards, and draws the
  machine's arm as a line from its edge to the band's end with a head circle. `clearHintBand()` runs
  on every `redrawTape()` (repair, round change) and on round teardown, so a correct diagnosis never
  leaves a hint behind.
- **four** — `liftBugCard()` tweens the wrong card (and its icon) up by `HINT_LIFT = 18` and pulses it
  once, leaving it lifted until the tape is redrawn.
- **six** — `pulseCorrectCandidate()` pulses the correct tool in the open tray, and is a no-op while
  the tray is shut, so the level can only fire once the bug card has been found.

Four new scene cases assert each representation (the band's geometry and arm head, the lift's `y`
target, the tray pulse, and the band's removal after a repair).

### R1-3 (High) — every correct tap records one result

`recordCorrect()` now runs when the tapped card is the wrong one and when the tapped candidate is the
right tool, so a solved round records three correct results and one win while wrong taps keep
recording through `reactWrong`. A new scene case walks a miss, the bug-card tap, the right tool and
the solve and asserts `sessionWrong` 1 and `sessionCorrect` 3; the existing solve case moved from 1
to 3 with the reason stated inline.

### R1-4 (Medium) — the rule line the spec speaks

`RULE` is now "Find the wrong card and fix it." in `FixItMachineScene`, and the three documents that
quote it (PRD §3.24, `conductor/product.md`'s spoken-rules note, TDD §4.11) carry the same sentence.

### R1-5 (Medium) — the bridge contract, settled

The hook keeps the names the journey already drives (`solution`, `tape`, `cards`, `tray`, `go`,
`machine`, `goal`, `failedRuns`, `wrongTaps`, `hintLevel`, `trayOpen`, `solved`, `bugIndex`,
`round`), and `spec.md` FR-15 now states those fields and why, instead of the invented
`steps`/`tapePoints`/`trayPoints`/`goPoint` set. Recorded in `decisions.md`.

### R1-6 (Low) — the spec's arithmetic

`spec.md` FR-16 now states the derived counts (62 shell keys, 195 in the shell-plus-art-groups
union) and says plainly that the sixteen workshop drawings are scene-local and outside that union.

### R1-7 (Low) — comments that had drifted

`groupIntegrity.test.ts` (24 tiles, 24 stickers) and `hubEngagement.test.ts` (boots all 24 scenes)
restated. `hubGrid.test.ts`'s "23 unearned slots" was already true with 24 games and one earned
sticker, so it was left alone.

## Deviations and notes

1. **Suite counts.** The four new scene cases and two art-declaration cases move the suite from
   3,300 to 3,306 tests in the same 153 files, so every count claim in README, TDD and the perf
   baseline was refreshed — the validator checks all of them, including the dated sections, which is
   the project's standing convention.
2. **One behaviour change in an existing test.** The solve case's `sessionCorrect` expectation moved
   from 1 to 3 because FR-10 requires the two correct taps to record; the assertion was restated, not
   loosened, and a separate case now proves the per-tap accounting.
3. **Extra check beyond the phase gate.** The Fix-It Machine journey was re-run after these changes
   (`.conductor/evidence/20261116-fix-it-machine/phase-7-e2e.log`) because the scene changed
   behaviour; the phase's own `Verification` command does not include `pnpm test:e2e`.
