# Docs & Dead-Code Truth Pass — Specification

> Requirements are stable. Once an `FR`, `NFR`, or `AC` ID is approved, do not
> renumber it. If a requirement is removed, mark it `Withdrawn` instead of
> deleting it.

## Overview

Make the repository's prose describe the app that actually ships: sync test
counts and current-state claims across `README.md`, `docs/TDD.md` and
`conductor/product.md`; turn the README into an entry point that links to the
PRD and TDD instead of restating them; delete refactor leftovers (orphan JSDoc,
stale comments); remove the Vite config warning; and close the executed but
unrecorded `drop-ligne-mascot` track. No runtime behavior changes.

## Problem / Motivation

Nine defects were found in one audit pass on 2026-10-20:

| Defect | Evidence |
| --- | --- |
| Test counts are stale | `README.md:49` and `docs/TDD.md:880,886` state 2,208 tests across 103 files; the suite is 2,305 across 110 |
| Empty README section | `README.md:175` is a `## Parental Controls` heading with no body |
| Stale lazy-scene count | `src/main.ts:30` says "the 7 game scenes are lazy-loaded"; there are 22 |
| Wrong adaptive threshold | `conductor/product.md:58` says "≥10 taps"; `src/game/adaptiveLogic.ts` uses `MIN_SAMPLE = 6` inside a 10-tap window |
| Dead JSDoc block | `src/components/SettingsPanel.ts:303-313` has six doc comments with no methods |
| Vite warning | `vite.config.ts:4` imports `./package.json` without an import attribute |
| Phantom track | `conductor/tracks/drop-ligne-mascot_20261016` is `status: "new"` although Ligne was deleted in `755d575` on 2026-10-17 and `validate-pwa.js` asserts its absence |
| Duplicated README prose | Motion, platform, CI, Docker and per-game feedback sections restate `docs/PRD.md` and `docs/TDD.md` and drift independently |
| Redundant placeholders | `.gitkeep` files remain in directories that now hold tracked files |

Who feels it: the next agent plans a track from false premises, reviewers cannot
trust the README, and a `new` track hides real backlog. If it is not fixed, the
drift compounds with every release.

## Goals & Success Metrics

- **Goal:** every claim in the audit list is either corrected or re-verified and
  recorded as still true in the phase evidence.
- **Metric:** `rg` over the enumerated stale phrases returns zero hits; the
  stamped counts equal a suite run captured in the same phase; every quality
  gate passes unchanged.

## Scope

### In Scope

- `README.md`: heading defect, stale counts, and de-duplication of the sections
  that restate the PRD/TDD.
- `docs/TDD.md` §10.2/§10.3: counts, coverage snapshot, lowest-covered-file claim.
- `docs/PRD.md`: only to receive facts relocated out of the README.
- `conductor/product.md`: current-state claims only.
- Code comments, starting with `src/main.ts:30`.
- The orphan JSDoc block in `src/components/SettingsPanel.ts`.
- `vite.config.ts`: the JSON import attribute.
- `.gitkeep` files that sit beside tracked files.
- Conductor state for `drop-ligne-mascot_20261016`.

### Out of Scope

- Release notes and dated changelog entries (frozen history).
- Any logic, UI, asset, test-behavior or dependency change.
- New CI gates, docs linters or link checkers.
- Recreating the Ligne track; the work already landed.

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | README has no empty headings. Test counts name the measured numbers plus a "verified YYYY-MM-DD" date, and name CI (`vite.config.ts` thresholds) as the authority. | must |
| FR-2 | README becomes an entry point. Tech Stack, Prerequisites, Getting Started, Testing, Code Quality, Project Structure, Mini-Games, Releases, Documentation and License stay; the sections listed in FR-3's relocation table are replaced by a summary of at most five lines plus a link to the owning doc. | must |
| FR-3 | Every fact removed from the README under FR-2 exists in its owning doc before removal — product behavior in `docs/PRD.md`, implementation detail in `docs/TDD.md` — and a relocation list records where each moved. | must |
| FR-4 | `docs/TDD.md` §10.2/10.3 counts and coverage snapshot match the run captured in Phase 1 and carry a verified date. The "lowest file = `decodeLogic.ts` at 73.8%" claim is re-measured and corrected, or removed. | must |
| FR-5 | Current-state claims in `conductor/product.md` match the code: the adaptive sentence states a 6-tap minimum inside a 10-tap window with 0.9 up / 0.6 down thresholds, and every other current-state number in the audited list is corrected or re-verified. Dated `> **YYYY-MM-DD —**` entries are not edited. | must |
| FR-6 | Stale code comments are corrected repo-wide, starting with the lazy-scene count in `src/main.ts`. Comments only; no statement changes. | must |
| FR-7 | The orphan JSDoc block at `src/components/SettingsPanel.ts:303-313` is deleted and no live method loses its documentation. | must |
| FR-8 | `vite.config.ts` imports `package.json` with `with { type: "json" }`, and check, typecheck, test and build emit no JSON-import warning. | must |
| FR-9 | `drop-ligne-mascot_20261016` is closed: absence of Ligne is proven, the folder moves to `conductor/archive/drop-ligne-mascot_20261016/`, metadata records `status: "complete"` plus `archived_at` and `archive_path`, and the `conductor/tracks.md` ledger line points at the archive. | must |
| FR-10 | `.gitkeep` files are removed only from directories that already contain tracked files. | should |
| FR-11 | Every corrected claim is backed in the phase evidence by the source, command output or test result that proves it. | must |
| FR-12 | The README's 22-game roster drops its per-game replay-variety detail: one line per game, linking to the game specs in `docs/PRD.md` §3, where that detail already lives. (Added 2026-10-20 after Phase 2 measured the README at 237 lines.) | must |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | No runtime behavior change. The only non-doc source edits are comments and the Vite import attribute. |
| NFR-2 | All quality gates pass unchanged: `pnpm check`, `pnpm typecheck`, the test suite, the coverage thresholds, `pnpm build`, and the bundle and PWA validators. |
| NFR-3 | No new dependency and no new CI gate. |
| NFR-4 | Dated history is byte-identical: release notes and dated `product.md` changelog entries. |
| NFR-5 | Edits match existing conventions: Biome for TypeScript, the current Markdown voice, and relative links. |
| NFR-6 | Documentation stays verifiable offline; no new external references are required. |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | README has zero empty headings. Its counts equal a `pnpm test -- --run` run captured in the phase evidence and carry a verified date. | FR-1 |
| AC-2 | README is at most 240 lines once Phase 2 lands and at most 180 at track end; every trimmed section links to its owning doc, and no other file links to a removed anchor. (Revised 2026-10-20: the original 170 ceiling was an estimate made before measuring, and the plan left the roster to Phase 3; 240 after Phase 2, 180 at track end.) | FR-2 |
| AC-3 | The relocation list names every moved fact, and a `rg` search finds each one in the PRD or TDD. | FR-3 |
| AC-4 | TDD counts equal the same captured run, and the lowest-covered-file claim is re-measured or absent. | FR-4 |
| AC-5 | The product.md adaptive text matches `WINDOW_SIZE = 10`, `MIN_SAMPLE = 6`, 0.9 and 0.6, and `git diff` shows no changed line inside a dated changelog entry. | FR-5 |
| AC-6 | `rg "7 game scenes"` over `src` and `README.md` returns nothing, and the audit phrase list returns zero hits. | FR-6 |
| AC-7 | The six orphan JSDoc phrases are absent from `SettingsPanel.ts`, and check plus typecheck are green. | FR-7 |
| AC-8 | Check, typecheck, test and build output contains no JSON-import warning. | FR-8 |
| AC-9 | No `drop-ligne-mascot_20261016` remains under `conductor/tracks/`, the archive metadata shows the archived state, the registry line resolves to it, and `package.json` plus the lockfile contain no Ligne dependency. | FR-9 |
| AC-10 | No `.gitkeep` remains in a directory that holds tracked files. | FR-10 |
| AC-11 | Each phase evidence file records the commands run, their exit codes, and the audit or verification output. | FR-11 |
| AC-12 | No README game line repeats a replay-variety detail that the PRD already carries; each line names the game and links to its spec. | FR-12 |

## Edge Cases

- A suspect claim is already true, for example the 6×4 hub grid or the 178
  texture keys: verify it, record it, do not edit it.
- Counts shift between phases: stamp the number measured in the finishing phase,
  never an earlier run.
- A trimmed section holds a fact the owning doc lacks: relocate it first. If the
  owning doc is itself unsure, keep the section and record why.
- The archive target already exists: stop and ask instead of overwriting.
- A `.gitkeep` sits beside only ignored files: keep it.
- Docs-only commits are skipped by CI `paths-ignore`, but the Vite change is
  not, so the finishing phase runs the full gate.

## Dependencies

- **Tracks:** none.
- **External:** none.

## Open Questions & Assumptions

- **Question:** none blocking.
- **Assumption:** `conductor/product.md` dated changelog entries are frozen
  history, per the user's decision on 2026-10-20.
- **Assumption:** a README of at most 170 lines is a target, not a hard gate; a
  section holding unique facts may push it higher. **Amended 2026-10-20** after
  Phase 2 measured 237 lines: the ceiling is 240 once the nine sections are
  summaries and 180 at track end, and the gap is closed by trimming the game
  roster (new FR-12/AC-12), not by dropping setup facts.
- **Assumption:** the Ligne track closes as executed and archived because
  `755d575` performed its work; `conductor/migration-report.md:30` recommends
  recreating it, which this track supersedes because the outcome already landed.
- **Assumption:** `conductor/product.md` has no Open Questions section today and
  this track does not add one.

## References

- `README.md:49`, `README.md:175`
- `docs/TDD.md:880`, `docs/TDD.md:886`
- `conductor/product.md:58`
- `src/main.ts:30`
- `src/components/SettingsPanel.ts:303-313`
- `vite.config.ts:4`
- `src/game/adaptiveLogic.ts`
- commit `755d575` (Ligne removal, 2026-10-17)
- `conductor/migration-report.md:30`
- `conductor/tracks/drop-ligne-mascot_20261016/`
- `conductor/workflow.md`
