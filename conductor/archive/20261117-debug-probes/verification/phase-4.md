# Phase 4 — The rule is written down

- Track: 20261117-debug-probes
- Phase: 4 of 4
- Branch: fix/20261117-debug-probes
- Base / Head: e6315890 / (phase commit)
- Date: 2026-11-17
- Result: verified

## Commands

| Layer | Command | Exit | Summary |
|---|---|---|---|
| static | `pnpm check` | 0 | Biome clean |
| static | `pnpm typecheck` | 0 | both projects |
| unit | `pnpm test -- --run` | 0 | 153 files / 3,322 tests |
| coverage | `pnpm test:coverage` | 0 | 97.12 / 90.90 / 96.21 / 98.31 |
| build-artifact | `pnpm build && node scripts/validate-bundle.js` | 0 | entry `index-Cs-5XGxm.js` 186.7 kB ≤ 200 kB |
| build-artifact | `node scripts/validate-pwa.js` | 0 | 16/16 |
| documents | `node scripts/validate-docs.js` | 0 | 5/5 |

Full-chain evidence: `.conductor/evidence/20261117-debug-probes/phase-4-gate.log` — `GATE EXIT: 0`.

## Acceptance

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| AC-7 | The full gate exits 0 and the coverage thresholds hold | the table above; thresholds 95/88/85/90 all met | pass |
| FR-2 | Probes never change accuracy or the window | TDD §"adaptive" paragraph states the rule; the phase-1 test pins it | pass |
| FR-6 | Only a logical look is a probe | TDD states the answer-vs-look line; Phase 2's audit table names every other scene | pass |
| FR-8 | Looks are visible to a parent | TDD row example (`3 plays · 67% · 3 looks · Today`), the product definition's progress entry, the README's per-game row | pass |

## What was written

- `docs/TDD.md` — a paragraph after the rolling-window description: what a probe
  is, what it never touches, the answer-versus-look rule, that only
  `FixItMachineScene` records one today, and how the overlay prints it.
- `conductor/product.md` — the Parent Progress Insights entry now says Fix-It
  Machine separates searching from answering, that a look is counted and shown
  but never scored, and that the tray is still an answer.
- `README.md` — the per-game rows sentence names looks among the columns.

## Deviations

None. The suite-count restatements this track needed were already made in
Phases 1–3, where the tests were added.

## Notes

- No count-bearing claim changed in this phase, so the documents validator's
  derived-truth checks stayed green without a restatement.
- The TDD paragraph is deliberately generic ("games that ask a child to find
  something") so the next debugging game inherits the rule instead of
  re-deriving it.
