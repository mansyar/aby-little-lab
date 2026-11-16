# Phase 6 — Documents say 24, and say what debugging is: verification

- **Track:** `20261116-fix-it-machine`
- **Phase:** 6 of 6 — Documents say 24, and say what debugging is (D10, D12)
- **Branch:** `feat/20261116-fix-it-machine`
- **Evidence log:** `.conductor/evidence/20261116-fix-it-machine/phase-6-gate.log` (gate exit 0)

## Verification command

```
pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage &&
pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js &&
node scripts/validate-docs.js
```

**Exit status: 0.** `validate-docs` passed 5/5 on the final text, the same chain also passed 16/16
PWA checks and every bundle check, and the unit suite is untouched at 153 files / 3,300 tests.

## P6.T1 — the PRD section

`docs/PRD.md` §3.24 states the mechanic (a tape of instruction cards, one card that does not belong,
a tray of three tools, a second run), the six-round ladder of 3, 3, 4, 4, 5 and 5 cards and the three
`SimilarityBand` steps, the repair loop (a stopped run keeps its tape, its round and the child's
input; the wrong card is ringed; the right tool rewrites that card in place), and why the bug is a
**substitution** rather than a missing card — an empty slot would ask for a different verb, while a
wrong tool is something the child can see, name and swap. §2.2 gained rows 23 and 24 with the domain
counts restated (early programming 2, total 24), §4.1 states sixteen games on the choice base
(fourteen direct, two through `GroupMathScene`) and 22 of 24 adaptive, and §7 counts 24 game scenes
inside 51 chunks. The `thinking` group holds eight in §5's group table and §2.2's counts.

## P6.T2 — the TDD record

- **§2.2/§2.3** — the file tree carries `fixItMachineArt.ts` and `fixItMachineLogic.ts` (73 files),
  and the corpus table gains a `machine/` row of 16, with `stickers/` at 24 and `ui/` at 40.
- **§3.3/§3.6** — 62 shell keys, 195 keys in the shell-plus-groups union, 262 art files, 57 boot
  textures; §3.5 names `FIX_IT_MACHINE_ASSETS` and the `machine` art loader beside Robot Path's.
- **§4.1/§4.5** — the base-class counts (14 / 2 / 8) and 22 of 24 adaptive, plus row 24 of the
  "which game extends what" table.
- **§4.11 (new)** — the Fix-It Machine section: the six icons in three families, authored
  `ROUND_SPECS` rather than generated rounds, why the wrong card is never card 0 and never repeats a
  tool, the `SimilarityBand` ladder, the scene's geometry (96 px tape and tray, 112 px Go at 896, 664),
  the token-guarded 550 ms run loop, and the `e2eFixItMachine()` fields.
- **§7.3/§7.5** — Robot Path and Fix-It Machine are the two games with no adaptive dimension.
- **§10.5** — 24 journeys across 19 spec files, 24 launches, seven mechanic families, and the
  `E2E_BASE_URL` paragraph carries 24.
- **§10 module table** — rows for `fixItMachineArt.ts` and `fixItMachineLogic.ts`.

## P6.T3 — product record and baseline

`conductor/product.md` gained row 24 in the game table, a **Changelog — Game 24: Fix-It Machine**
section written in the same shape as Game 23's, and the cross-game notes it now touches: the roster
counts (24 mini-games, 24 scenes, 24 voices, 24 learners' rows), the Hub grid (24 tiles, rows
6/6/6/6, phones 10 + 10 + 4), the Learning Progress pages (6 + 6 + 6 + 6) and the spoken rules (Fix-It
Machine is the fourteenth rule narrator, with its rule quoted).

`conductor/product-guidelines.md` gained **§5 Debug Then Repair**, the third answer shape: the wrong
step is authored and unique, a stopped run is evidence rather than a failure, repair is in place, the
ladder is tool closeness rather than card count, hints pulse and never place, and Go keeps the same
112×112 target as every other run button.

`docs/perf-baseline.md` gained a **Fix-It Machine — build and suite figures (2026-11-16)** section
with the measured table (entry 186.4 kB / 190.89 kB Vite / 48.35 kB gzip, 51 chunks, 63 precache
entries at 1826.19 KiB, 57 boot textures, 153 files / 3,300 tests, coverage 97.07/90.73/96.19/98.24,
24 journeys in 19 spec files at 5.0 min with `launch-all` at 3.3 min). The live header now points at
that section, and the Robot Path section it previously pointed at was restored to its own recorded
numbers, so history stays history.

## P6.T4 — validator and integrated gate

`node scripts/validate-docs.js` passes 5/5 on the final text, including the registry ⇄ README ⇄ PRD ⇄
TDD list parity at 24 and the living-docs test-suite truth, and the full chain exits 0 on the tree
this phase committed.

## Notes

- The README also carries the browser layer's new counts (24 launches, 5.0 min measured against the
  5 min budget) so the two documents cannot disagree with the baseline.
- No source file changed in this phase: it is documents and the track record only.
