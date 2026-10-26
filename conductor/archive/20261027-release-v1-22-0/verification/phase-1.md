# Phase 1 Evidence - Version bump and release notes

- Track: 20261027-release-v1-22-0 - Release v1.22.0 - Ship the Seven Tracks Merged Since v1.21.7
- Phase: 1 - Version bump and release notes
- Date: 2026-10-27
- Branch: chore/20261027-release-v1-22-0
- Phase base: 09e3e658
- Head at verification: 09e3e658 (verification ran on working tree; commits below)
- Result: verified

## Result

The repo reads `1.22.0`, `docs/release-notes-v1.22.0.md` covers all seven shipped PRs (#67-#73 in merge order) with a Status DRAFT header, the README links the notes, and all three verification commands pass.

## Commands

| Layer | Command | Exit | Summary |
|---|---|---|---|
| docs | `node scripts/validate-docs.js` | 0 | 6/6 checks pass (release-note index complete, links/anchors resolve, registry agreement, roadmap sections, no dangling Conductor paths, test-count truth) |
| lint | `pnpm check` | 0 | Biome check, 260 files, no fixes applied |
| types | `pnpm typecheck` | 0 | `tsc --noEmit` clean |
| git | `git log v1.21.7..HEAD --merges` | 0 | Confirmed merge order #67, #68, #69, #70, #71, #72, #73 (oldest to newest) |
| git | `git diff v1.21.7..HEAD --name-only` | 0 | Save-schema check input: no `src/utils/storage.ts`, profile/progress/play-time logic, or stored-state type files touched across PRs #67-#73 |

## Acceptance criteria

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| FR-1 | `package.json` reads `1.22.0` | `package.json` version field bumped 1.21.7 → 1.22.0 (only the version field) | done |
| FR-2 | Dated notes cover all 7 shipped PRs, README-linked | `docs/release-notes-v1.22.0.md` (Status DRAFT, Base `v1.21.7` `ee6bb40f`, parent-facing lede headlining the two prewarm features, one `### PR #N` section per PR #67-#73 in merge order, verification section); README Releases table row + Documentation index line added | done |
| FR-3 | Skipped device pass recorded as accepted gap | Notes "Release Verification" device-matrix line states SKIPPED per track scope and points at the checklist rows to run; mirrors how v1.21.0 recorded its device-class pass | done |
| NFR-1 | Notes follow the v1.21.0 format precedent | Blockquote Status/Target-tag/Base header, lede, per-PR sections, Installation, Release Verification, Known Issues | done |
| NFR-2 | Docs validator green | `node scripts/validate-docs.js` 6/6 (includes the new file in the release-note index check) | done |
| AC-1 | Version reads 1.22.0 | `package.json` | done |
| AC-2 (pre-FINAL) | Notes exist with DRAFT status | header `Status: DRAFT`, target tag marked pending until the Phase 2 deploy dry run | done |
| AC-5 | Device-pass skip recorded, not performed | No device/manual testing performed; skip recorded in notes as accepted gap | done |
| P1.T1.2 | Save-schema change yes/no | **NO save-schema change.** Evidence: the `v1.21.7..HEAD` name-only diff touches docs, tests, tooling config, `src/game/random.ts`, scene constructors, hub prewarm/art files and game-logic trailing params - none of the stored-player-state surface (`src/utils/storage.ts`, profile/play-time/progress logic, save types) appears in the range | done |

## Evidence paths

- `docs/release-notes-v1.22.0.md`
- `package.json`
- `README.md` (Releases row + Documentation index line)
- This file: `conductor/tracks/20261027-release-v1-22-0/verification/phase-1.md`

## Deviations

None - all changes stayed within the phase `Touches` (`package.json`, `docs/release-notes-v1.22.0.md`, `README.md`) plus the phase evidence file.

## Notes

- Figures quoted in the notes (126 files / 2,781 tests; coverage 97.75 / 91.76 / 96.88 / 98.70; shell 148.86 kB; 42 chunks; 54 precache entries; warm-tap 27.2-64.9 ms; cold worst median 332.6 ms) are the verified 2026-10-27 living-docs truth; CI and the Phase 2 gate re-confirm them on the release commit, and the Status flips to FINAL in Phase 3 after the deploy fires.
- `pnpm check` / `pnpm typecheck` were run as two separate single commands (the shell permits one command per call, no chaining).

## Primary verification

- Working tree clean (`git status --porcelain` empty apart from `.conductor/`); diff `09e3e658..HEAD` = `package.json`, `docs/release-notes-v1.22.0.md`, `README.md` + evidence file — exactly Touches + evidence, no deviations.
- Re-ran independently: `node scripts/validate-docs.js` exit 0 (6/6), `pnpm check` exit 0 (260 files), `pnpm typecheck` exit 0, `package.json` reads `1.22.0`, README links the notes (Releases row + Documentation index).
- AC-1/AC-2(pre-FINAL)/AC-5 satisfied; FR-1/FR-2/FR-3, NFR-1/NFR-2 covered. Save-schema answer (NO change) accepted — verified plausible against the merged-PR list.
- Accepted wording note: the notes header says the tag is "cut after the Phase 2 deployment dry run" — read as the Phase 2 full gate on the release state, which is the pre-tag validation. No rework.
