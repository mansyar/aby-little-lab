# Phase R1 Evidence — Review Fixes (round 1)

- **Track:** 20261027-release-v1-22-0 — Release v1.22.0
- **Phase:** R1 — Review Fixes (round 1)
- **Date:** 2026-10-27
- **Branch:** chore/20261027-release-v1-22-0
- **Base:** 27fa696c
- **Head:** (see commit below)
- **Result:** verified

## Result

All four round-1 review findings (F1–F4, notes accuracy) resolved in
`docs/release-notes-v1.22.0.md` with no other changes. Docs validator 6/6,
`pnpm check` clean.

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| docs | `node scripts/validate-docs.js` | 0 | 6/6 checks passed |
| lint | `pnpm check` | 0 | 260 files, no fixes applied |
| grep | invented-term sweep of notes file | 0 matches | `createRng`, `hashSeed`, `advertiser-adversarial`, invented game names, `ferry/plugin`, `dry run`, `19 test files`, `hub stress` all absent |

## Acceptance criteria

| Finding | Fix applied | Evidence | Status |
| --- | --- | --- | --- |
| F1 (PR #67 bullet, notes lines 15–17) | Bullet now states `random.ts` exports `Rng` + one shared Fisher-Yates `shuffle`; five duplicate shuffles deleted; 13 importers re-pointed; trailing `rng` params across the 21 logic modules; seeded `mulberry32` helper in `src/__tests__/helpers/`. Invented `createRng`/`hashSeed`, game names, and "ferry/plugin/board/logic surfacing" removed. | `docs/release-notes-v1.22.0.md` PR #67 section; grep sweep clean | done |
| F2 (PR #68 bullet, notes line 22) | Count corrected to "27 files"; Story Order sentence replaced with `this.rng` rng-first wording including `buildPlaythrough(this.rng, getAdaptiveBandShift("story-order"))` and `StoryOrderScene.ts:91`; "advertiser-adversarial" deleted. | `docs/release-notes-v1.22.0.md` PR #68 section; grep sweep clean | done |
| F3 (PR #70 bullet, notes line 33) | Bullet now names the addItUp/count/numberOrder/takeAway/firstSounds sweeps (plus decode/word per the audit), each with an explicit 120 s per-test timeout; `vite.config.ts` untouched (line 34 unchanged). | `docs/release-notes-v1.22.0.md` PR #70 section | done |
| F4 (header, notes line 4) | Header reworded to `Target tag: v1.22.0 (pending - cut in Phase 3 after merge with explicit go-ahead)`. | `docs/release-notes-v1.22.0.md:4` | done |

## Evidence paths

- `conductor/tracks/20261027-release-v1-22-0/verification/phase-R1.md` (this file)
- `docs/release-notes-v1.22.0.md` (fixed file)

## Deviations

- None. Line 17 of the PR #67 bullet (seeded-helper sentence) gained the explicit
  `src/__tests__/helpers/` path as part of the F1 rewrite; still within the
  R1.T1 bullet scope and `Touches`.

## Notes

- Ground truths taken from the brief as instructed; no re-derivation.
- Fix retry count: 0 (all edits applied cleanly on first pass, both
  verification commands passed first run).
