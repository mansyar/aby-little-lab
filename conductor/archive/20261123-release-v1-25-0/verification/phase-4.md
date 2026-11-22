# Phase 4 Verification — Release v1.25.0

- **Track:** 20261123-release-v1-25-0 (Release v1.25.0)
- **Phase:** 4 — Version bump and release notes
- **Date:** 2026-11-23
- **Branch:** `chore/20261123-release-v1-25-0`
- **Phase base commit:** `d1ad5adc` (release branch head at phase start; plan phase set in progress)
- **Head commit at verification:** `c2f74360` (task commits below; this evidence committed separately)
- **Result:** verified

## Task results

| Task | Result | Commit | Evidence |
|---|---|---|---|
| P4.T1 — bump `package.json` `1.24.0` → `1.25.0` | done | `e1125a22` | `package.json:3` reads `"version": "1.25.0"`; single-line diff, no lockfile or dependency change |
| P4.T2 — DRAFT notes in v1.24.0 shape | done | `d13d15f3` | `docs/release-notes-v1.25.0.md` (56 lines): DRAFT header, parent lede, PR #92 + two P6 sections, Installation, Release Verification (all gates incl. both guards, docs/PWA, boot/headers, journeys), Known Issues gap |
| P4.T3 — README link + newest-first Releases row | done | `c2f74360` | README Documentation index line 254 links `docs/release-notes-v1.25.0.md`; Releases table line 209 `**v1.25.0** | 2026-11-23 | ... | \`v1.25.0\`` placed above v1.24.0 |

## Shipped-set confirmation

`git log v1.24.0..HEAD --merges` returns exactly one merge: `9ffbc01d` (PR #92, `feat(content-depth)`, head `8b8b142c`). `git ls-remote origin refs/tags/v1.25.0` returned no output with exit 0 — no tag exists on origin, so the notes correctly keep `Tag: (pending)`. The phase-branch commits after the merge carry the two P6 items (`0c6e79d5` module split, `6815d8c3` module-size guard, `c4014bd6` changelog move) and Conductor plan updates; they are not separate PRs and are written as sections, not PR rows.

## Commands

| Layer | Command | Exit | Summary |
|---|---|---|---|
| git | `git status --short` | 0 | Clean tree at phase start and at verification |
| git | `git branch --show-current` | 0 | `chore/20261123-release-v1-25-0` |
| git | `git log --oneline --max-count=20 v1.24.0..HEAD --merges` | 0 | Exactly one merge, `9ffbc01d` (PR #92) |
| git | `git show --stat 9ffbc01d` | 0 | 105 files, content-depth feature; base `e208d451`, head `8b8b142c` |
| git | `git ls-remote origin refs/tags/v1.25.0` | 0 | No output — no remote v1.25.0 tag |
| git | `git diff --stat d1ad5adc..HEAD` | 0 | Only `package.json`, `docs/release-notes-v1.25.0.md`, `README.md` (2 + 56 + 2 lines) |
| docs | `node scripts/validate-docs.js` | 0 | `Results: 5 passed, 0 failed` — release-note index complete, links and anchors resolve, game lists agree, Conductor paths exist, suite truth current |
| lint | `pnpm check` | 0 | Biome clean — 364 files checked, no fixes; lockfile up to date |
| types | `pnpm typecheck` | 0 | `tsc --noEmit` and the e2e tsconfig both clean |
| disk | `grep "version" package.json` | 0 | Line 3: `"version": "1.25.0"` |
| disk | `grep "Status:\|Tag:\|Base:" docs/release-notes-v1.25.0.md` | 0 | Lines 3–5: `Status: DRAFT`, `Tag: (pending)`, `Base: \`v1.24.0\` (\`cac20094\`, 2026-11-21)` |
| disk | `grep "v1\.25\.0\|2026-11-23" README.md` | 0 | Line 209 table row dated 2026-11-23, line 254 Documentation index link |

## Acceptance criteria

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| AC-1 | `package.json` version is `1.25.0` | `package.json:3` (commit `e1125a22`); no lockfile/dependency edit | PASS |
| AC-2 | Notes exist, README-linked, table-listed, validator 5/5, Status DRAFT before tag | `docs/release-notes-v1.25.0.md` header `Status: DRAFT` / `Tag: (pending)` / `Base: v1.24.0 (cac20094, 2026-11-21)`; README index line 254 + Releases row line 209 dated 2026-11-23; `node scripts/validate-docs.js` 5/0; no remote tag | PASS |
| AC-9 | Device pass recorded as accepted gap | Notes `## Known Issues`: `SKIPPED, accepted gap`, links to `docs/device-testing-checklist.md` and `docs/release-checklist.md`, plus "No new known issues are filed by this release" | PASS |
| FR-1 / FR-2 / FR-3 / FR-10 | Version, v1.24.0-shaped notes covering #92 + P6 + gap, README link/row, accepted device gap | Task commits `e1125a22`, `d13d15f3`, `c2f74360`; diff confined to the phase Touches | PASS |
| NFR-1 / NFR-4 | No runtime change; no duplication of README Known Issues or roadmap; docs validator green | Diff is metadata + Markdown only; notes carry a one-line pointer to `conductor/product.md §10`, no copied content; docs 5/0 | PASS |

## Evidence paths

- `package.json`
- `docs/release-notes-v1.25.0.md`
- `README.md` (Documentation index; Releases table)
- This report: `conductor/tracks/20261123-release-v1-25-0/verification/phase-4.md`

## Deviations

None. All edits stayed inside the listed Touches (`package.json`, `docs/release-notes-v1.25.0.md`, `README.md`) plus this evidence file.

## Blockers

None. `git ls-remote origin refs/tags/v1.25.0` was permitted and confirmed the absence of a tag; no command was denied.

## Notes

- Task commits: `e1125a22` (P4.T1 bump), `d13d15f3` (P4.T2 notes), `c2f74360` (P4.T3 README links). This evidence file is committed separately.
- Suite and coverage figures in the notes are the verified ground facts supplied by the brief (154 files / 3,346 tests; 97.15/90.97/96.28/98.30%; 189.1 kB shell; 167-module guard; PWA 16/16; docs 5/5; textures 319 SVGs, 76.07/319.00 MiB, ratio 0.238). `validate-docs.js` does not assert counts inside release notes (only README, TDD and perf-baseline), and it reports 5/5.
- The primary runs the full `verify_phase` chain independently; this phase ran only the three commands named in the brief, each separately with no `&&` chains (the `&&` inside the `pnpm typecheck` script is the configured project command, not an added chain).
- The tree is clean at the end of the phase; no tag, push or state-file edit was made.

## Primary verification (orchestrator, independent)

- Phase base `d1ad5adc`; implementation commits `e1125a22`, `d13d15f3`, `c2f74360` plus the subagent's evidence commit `1785780f`. Diff confined to `package.json`, `docs/release-notes-v1.25.0.md`, `README.md` and this evidence file (Touches); no runtime code or Conductor state changed.
- Full `verify_phase` chain (including both guards) exited 0: `pnpm check` Biome clean 364 files; `pnpm typecheck` src + e2e clean; `pnpm test -- --run` 154 files / 3,346 tests; `pnpm test:coverage` 154 / 3,346 with 97.15% stmts / 90.97% branches / 96.28% funcs / 98.30% lines vs gates 95/88/85/90; `pnpm build` 487 modules, shell `index-BFkG8G2w.js` 193.62 kB Vite / 189.1 kB via validator (≤200 kB), Phaser vendor 1,367.08 kB (pre-existing advisory); `validate-bundle.js` PASS; `validate-module-size.js` 167 files zero warnings; `validate-textures.js` 319 SVGs, 76.07 MiB typical ≤80, 319.00 MiB full ≤320, ratio 0.238 ≤0.5; `validate-pwa.js` 16/16 with 51/51 JS chunks precached; `validate-docs.js` 5/5.
- Result: verified. AC-1/AC-2/AC-9 satisfied; notes remain DRAFT pending the tagged deploy.
