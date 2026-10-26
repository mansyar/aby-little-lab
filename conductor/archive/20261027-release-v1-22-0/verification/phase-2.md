# Phase 2 Evidence — Full gate on the release state (P2.T1 only)

- Track: 20261027-release-v1-22-0 — Release v1.22.0 — Ship the Seven Tracks Merged Since v1.21.7
- Phase: 2 — Gate, review, merge (THIS RUN: P2.T1 only — the full gate)
- Date: 2026-10-27
- Branch: chore/20261027-release-v1-22-0
- Phase base: 420e925b
- Head at verification: 420e925b (working tree clean; no product changes needed)
- Result: verified

## Result

All 8 gate commands pass on the release state (version bump + notes + README link, no `src/` change). The release diff `f44a3a91..HEAD` touches only `package.json`, `docs/release-notes-v1.22.0.md`, `README.md`, plus Conductor state — no runtime-behavior change. This run covers **P2.T1 only**; P2.T2 (review) and P2.T3 (PR/merge) remain with the primary.

## Commands

Each gate command was run as a single shell call (the shell permits one command per call, no chaining), in the exact order of the configured `verify_phase` gate.

| Layer | Command | Exit | Summary |
|---|---|---|---|
| lint | `pnpm check` | 0 | Biome check, 260 files, no fixes applied |
| types | `pnpm typecheck` | 0 | `tsc --noEmit` clean |
| unit | `pnpm test -- --run` | 0 | 126 files / 2781 tests, all pass |
| coverage | `pnpm test:coverage` | 0 | Statements 97.75 / Branches 91.76 / Functions 96.88 / Lines 98.70 — above the 95/88/85/90 gate |
| build | `pnpm build` | 0 | Vite build clean; shell entry 152.43 kB; 47 chunks; PWA precache 59 entries (1731.20 KiB) |
| build-artifact | `node scripts/validate-bundle.js` | 0 | Phaser vendor chunk present; shell entry 148.9 kB ≤ 200 kB gate |
| build-artifact | `node scripts/validate-pwa.js` | 0 | 16/16 checks pass (manifest, SW, icons, BGM, 47/47 chunks precached) |
| documents | `node scripts/validate-docs.js` | 0 | 6/6 checks pass (release-note index, links/anchors, registry agreement, roadmap, no dangling Conductor paths, test-count truth) |
| git | `git diff f44a3a91..HEAD --stat` | 0 | Only `package.json`, `docs/release-notes-v1.22.0.md`, `README.md` + Conductor state — no `src/` change |

## Acceptance criteria

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| FR-4 | Full 8-command `verify_phase` gate is green on the release state | Commands table above: all 8 gate commands exit 0 | done |
| AC-3 | All 8 gate commands green on the release state | Same run; coverage 97.75/91.76/96.88/98.70 above gate; bundle/PWA/docs validators green | done |
| NFR-1 | Release changes no runtime behavior: diff is version metadata, notes, and index links only | `git diff f44a3a91..HEAD --stat`: 9 files — `package.json` (1 version line), `docs/release-notes-v1.22.0.md` (new), `README.md` (+2), Conductor state only; zero `src/` files | done |

## Evidence paths

- This file: `conductor/tracks/20261027-release-v1-22-0/verification/phase-2.md`
- `docs/release-notes-v1.22.0.md` (unchanged by this task)
- `package.json` (reads `1.22.0`; unchanged by this task)
- `README.md` (Releases row + Documentation index line; unchanged by this task)

## Deviations

None — the gate exposed no defect in the release files, so no product file was touched. Working tree was clean before and after (`git status --porcelain` empty; HEAD still `420e925b`).

## Notes

- Test count observed in this run: **126 files / 2781 tests** — matches the living-docs truth cited in Phase 1.
- No fixes were needed, so the retry budget (2) was unused.
- Out of scope for this run (per brief): P2.T2 (review), P2.T3 (PR/merge), Phase 3 (tag). Do NOT tag — the primary handles the remaining tasks after this task is accepted.
- Evidence file left uncommitted for the primary state commit (per brief: commit it too, or leave it uncommitted — leaving it for the primary).

## Primary verification

- Working tree held only this evidence file; release diff `f44a3a91..HEAD` (excluding `conductor/`) = `package.json`, `docs/release-notes-v1.22.0.md`, `README.md` — no `src/` change, NFR-1 holds.
- Re-ran all 8 gate commands independently, all exit 0: `pnpm check` (260 files), `pnpm typecheck`, `pnpm test -- --run` (via coverage run, suite green), `pnpm test:coverage` (97.75/91.76/96.88/98.70), `pnpm build`, `validate-bundle.js` (shell 148.9 kB), `validate-pwa.js` (16/16), `validate-docs.js` (6/6).
- P2.T1 accepted; FR-4, AC-3 satisfied. P2.T2 (review) and P2.T3 (PR/merge) remain.
