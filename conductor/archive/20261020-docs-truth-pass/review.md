# Review — Docs & Dead-Code Truth Pass

- **Track:** `20261020-docs-truth-pass`
- **Reviewed:** `8d16d4f..30e73b8` (branch `chore/20261020-docs-truth-pass`)
- **Reviewer:** `conductor-reviewer` (read-only subagent), strict mode
- **Date:** 2026-10-20
- **Verdict:** approve with fixes — no blockers, three medium and three low findings
- **Round:** 1 (single round)

## Summary

The reviewer confirmed the track's central claim by re-running the suite (110 files, 2,305 tests) rather than trusting the evidence. It spot-checked 21 of the 22 new PRD `**Feedback.**` bullets against their scenes and logic modules, the `product.md` adaptive sentence against `adaptiveLogic.ts`, the paged-hub sentence against `hubPaging.ts`, and the corrected Pattern Builder, First Sounds and Build the Word claims against their modules — all matched. Anchors, scope discipline, frozen history and Conductor state were otherwise clean.

## Findings

| ID | Severity | File:line | Finding | Disposition |
| --- | --- | --- | --- | --- |
| M1 | Medium | `docs/PRD.md:185` | Shadow Match feedback claimed the snap used `Back.out`; `snapToSlot()` uses `Cubic.out` and `Back.out` is the wrong-drop bounce-back. The README claim had been relocated instead of corrected. | Fixed — now reads `Cubic.out`. |
| M2 | Medium | `docs/TDD.md` §5.8 | AC-3 gap: the phase-2 relocation table marked "larger Settings text" as covered, but no owning doc stated the size. It survived only in the device checklist. | Fixed — §5.8 now records the 36 px title, 32-34 px row and toggle labels and 30 px buttons, with `SettingsPanel.ts` and `primitives.ts` as the source. |
| M3 | Medium | `plan.md:149`, `metadata.json` | Phase 6's checkpoint was the "mark in progress" commit (`bd35e19`), so a revert would restore one plan line and leave the archive move behind. | Fixed — checkpoint is now `6c3660c`, the archive-move commit. |
| L1 | Low | `conductor/archive/drop-ligne-mascot_20261016/index.md` | The archive note read `efactor(mascot)` (a swallowed backtick) and lost the backticks around its paths. | Fixed — paragraph rewritten with correct code spans. |
| L2 | Low | `docs/TDD.md:897` | The coverage snapshot stamped `branches 90.73` while the head run recorded 90.66, and `integrated.md` claimed the docs named a range they did not. | Fixed — the snapshot now reads "about 90 (90.66-90.73 across runs)" and still names the 85 gate. |
| L3 | Low | `conductor/tracks.md:221` | The ledger file ended without a trailing newline. | Verified, no change needed — the file already ends with a newline at this head. |

## Checks relied on

| Check | Result |
| --- | --- |
| `pnpm test -- --run` (reviewer, at head) | pass — 110 files, 2,305 tests |
| `pnpm check`, `pnpm typecheck` (reviewer) | pass — one pre-existing `noNonNullAssertion` warning, untouched |
| `git diff --stat 8d16d4f..30e73b8` | 38 files: four source files (comments/JSDoc/import attribute), 14 `.gitkeep` deletions, one archive move, docs and track artifacts |
| Live gate after the fixes | see `verification/phase-r1.md` |

## Accepted residue

- `src/__tests__/scenes/navigation.test.ts:305` still titles a test "creates 7 game tiles". It asserts add order, not a count, and sits outside AC-6's wording; recorded in `verification/integrated.md` §6.
- `conductor/tech-stack.md:381` keeps a dated 2026-10-16 entry naming the Ligne track's old path. Dated entries are frozen by design.
