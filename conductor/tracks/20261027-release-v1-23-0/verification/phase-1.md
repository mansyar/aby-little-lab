# Phase 1 Evidence — Version bump and release notes

- **Track:** 20261027-release-v1-23-0 — Release v1.23.0 — Ship Content Expansion
- **Phase:** 1 — Version bump and release notes
- **Date:** 2026-10-27
- **Branch:** chore/20261027-release-v1-23-0
- **Base:** 114740a3
- **Head:** 781d4ff9
- **Result:** verified

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| documents | `node scripts/validate-docs.js` | 0 | 6/6 checks pass (release-note index complete; links/anchors resolve; game lists agree; roadmap sections; conductor paths; test-count truth) |
| static | `pnpm check` | 0 | Biome clean, 260 files, no fixes applied |
| static | `pnpm typecheck` | 0 | `tsc --noEmit` clean, no diagnostics |
| git | `git log --oneline v1.22.0..e584ecb1` | 0 | Exactly two commits: `f28aa392 chore(release): Mark v1.22.0 FINAL` (prior-release bookkeeping) and `e584ecb1 feat(content)` (PR #75) |
| git | `git show --stat e584ecb1` | 0 | 42 files: content pools, 12 story SVGs, tests, docs, conductor archive — no storage files |
| git | `git diff v1.22.0..e584ecb1 --stat -- src/utils/storage.ts src/game/profileLogic.ts src/game/progressLogic.ts src/game/playTimeLogic.ts src/game/adaptiveLogic.ts` | 0 | Empty output — no storage/schema changes in the range |
| git | `git rev-parse v1.22.0` | 0 | `a2bffc6b` — recorded as the notes Base hash |

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| AC-1 | `package.json` version is `1.23.0` | `package.json` version field `1.22.0` → `1.23.0` (commit `7335ee6d`); version field only, lockfile untouched | pass |
| AC-2 (pre-FINAL) | Notes file exists, is README-linked, `validate-docs` 6/6, Status DRAFT | `docs/release-notes-v1.23.0.md` created with Status DRAFT header, `v1.22.0` Base, parent-facing lede, one `### PR #75` section in merge order, verification section; README Releases row + Documentation index link (commit `781d4ff9`); `validate-docs` 6/6; FINAL flip deferred to Phase 3 per spec | pass |
| AC-5 | The skipped device pass is recorded in the notes as an accepted gap | Notes `Release Verification` ends with `Device matrix: SKIPPED - accepted gap` naming `device-testing-checklist.md` as the checklist to run, mirroring the v1.22.0 precedent | pass |

## P1.T1.2 — Save-schema assumption check

**Answer: no save-schema change in PR #75 — confirmed.** The `v1.22.0..e584ecb1`
range diff touches no storage or schema file (`storage.ts`, `profileLogic.ts`,
`progressLogic.ts`, `playTimeLogic.ts`, `adaptiveLogic.ts` all empty in the
range diff). The only `src/game` production changes are the content pools
(`wordLogic.ts` 18→28 words, `storyOrderLogic.ts` 11→15 stories,
`feelingsFacesLogic.ts` 24→32 scenarios, `decodeLogic.ts` pool collapse to
`[...WORD_POOL]`), `storyOrderArt.ts` panel keys, and `prewarm.ts`
`STORY_PANEL_KEYS` 33→45, plus 12 story SVGs. This agrees with the
content-expansion review NFR-5 (diff inspection: no storage/schema changes,
PASS with no findings). Existing profiles, stickers and play-time carry over
untouched — as stated in the notes Installation section.

## PR-set resolution (P1.T2.1)

`git log v1.22.0..e584ecb1` resolves to exactly the brief's stated set:
`f28aa392` (v1.22.0 FINAL flip — `git show --stat` confirms 4 files: conductor
archive metadata/plan/phase-3 evidence + the v1.22.0 notes FINAL flip; already
covered by the v1.22.0 notes, so no feature section) and `e584ecb1` (PR #75,
the one shipped `### PR #75` section). No extra commits — the spec edge case
did not trigger.

## Evidence paths

- `docs/release-notes-v1.23.0.md` (new)
- `package.json` (version field)
- `README.md` (Releases table row + Documentation index entry)
- Commits: `7335ee6d` (P1.T1), `781d4ff9` (P1.T2)

## Deviations

- None. All changes stay within `Touches` (`package.json`,
  `docs/release-notes-v1.23.0.md`, `README.md`); no lockfile hand-edits; no
  `src/` changes. (Shell `;`/`&&` chains are denied for this executor, so the
  `pnpm check && pnpm typecheck` verification ran as two separate single
  commands with identical effect.)

## Notes

- Notes ship with Status DRAFT; the FINAL flip happens in Phase 3 after the
  tag push + deploy, per the spec edge case.
- The notes verification section cites the shipped track's gate (126 files /
  2,783 tests from the content-expansion review) and records that the
  release-state full 8-command gate re-runs in Phase 2 before merge.
- No product or design decisions were required.
