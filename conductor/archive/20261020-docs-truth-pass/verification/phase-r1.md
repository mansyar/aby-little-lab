# Phase R1 — Review Fixes

- **Track:** `20261020-docs-truth-pass`
- **Phase:** R1 (review round 1)
- **Date:** 2026-10-20
- **Branch:** `chore/20261020-docs-truth-pass`
- **Result:** verified

## 1. Findings closed

| ID | Severity | Fix | Verified by |
| --- | --- | --- | --- |
| M1 | Medium | `docs/PRD.md:185` — Shadow Match snap now says `Cubic.out`, which is what `snapToSlot()` uses (`src/utils/dragJuice.ts:193`); `Back.out` is the wrong-drop bounce-back in `ShadowMatchScene.ts:266` | `Select-String "Cubic.out" src/utils/dragJuice.ts docs/PRD.md` |
| M2 | Medium | `docs/TDD.md` §5.8 — new paragraph: 36 px panel title, 32-34 px row and toggle labels, 30 px buttons, sourced from `SettingsPanel.ts:121,134,235` and `settings/primitives.ts:69,107` | `Select-String "36 px panel title" docs/TDD.md` |
| M3 | Medium | Phase 6 checkpoint corrected to `6c3660c` (the archive-move commit) in `plan.md` and `metadata.json` | both files read back |
| L1 | Low | Archived Ligne note rewritten: `` `refactor(mascot)` `` restored and every path back in a code span | `Get-Content conductor/archive/drop-ligne-mascot_20261016/index.md` |
| L2 | Low | `docs/TDD.md:897` — coverage snapshot now reads "branches about 90 (90.66-90.73 across runs)" and still names the 85 gate | `Select-String "about 90" docs/TDD.md` |
| L3 | Low | Checked, not changed: `conductor/tracks.md` already ends with a newline at this head, so the reviewer's observation predated the post-review state | `[System.IO.File]::ReadAllText(...).EndsWith("\n")` → true |

Two residues stay accepted and are recorded in `verification/integrated.md` §6: the `navigation.test.ts:305` test title, and the dated `tech-stack.md:381` entry that names the Ligne track's old path.

## 2. Gate at this phase

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| Static | `pnpm check` | 0 | Biome clean, one pre-existing `noNonNullAssertion` warning |
| Static | `pnpm typecheck` | 0 | `tsc --noEmit` |
| Unit | `CI=true pnpm test -- --run` | 0 | 110 files, 2,305 tests, 24.64 s |
| Unit | `pnpm test:coverage` | 0 | statements 97.8 · branches 90.73 · functions 96.34 · lines 98.59 |
| Build | `pnpm build` | 0 | entry `index-DkSW5M3z.js` 132.21 kB / 30.02 kB gzip; 53 precache entries / 1,702.03 KiB |
| Bundle | `node scripts/validate-bundle.js` | 0 | pass |
| PWA | `node scripts/validate-pwa.js` | 0 | pass |

Raw output: `.conductor/evidence/phase-r1-*.txt`.

This run measured branches at 90.73 while Phase 6 measured 90.66 with no code change — the drift the corrected TDD sentence now describes.

## 3. Files touched

`docs/PRD.md`, `docs/TDD.md`, `conductor/archive/drop-ligne-mascot_20261016/index.md`, `conductor/tracks/20261020-docs-truth-pass/{plan.md,metadata.json,review.md,verification/integrated.md,verification/phase-r1.md}`. No source file, no test, no release note, no dated changelog entry.
