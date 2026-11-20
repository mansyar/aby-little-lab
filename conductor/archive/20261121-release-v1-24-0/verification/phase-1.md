# Phase 1 Verification — Release v1.24.0

- **Track:** 20261121-release-v1-24-0 (Release v1.24.0)
- **Phase:** 1 — Version bump and release notes
- **Date:** 2026-11-21
- **Branch:** `chore/20261121-release-v1-24-0`
- **Phase base commit:** `fc29b826f5508e008425d08ee2df7dac05fc6bb5` (short `fc29b826`)
- **Head commit at verification:** `f4a27f0c` (task commits below)
- **Result:** verified

## Shipped-set confirmation (P1.T1.2)

`git log v1.23.0..HEAD --merges` returns exactly 14 merges, oldest first: #77 (1eba31d2), #78 (40ed3254), #79 (a715aa65), #80 (c50fb33e), #81 (53b1374c), #82 (02b860fd), #83 (86aaa2fe), #84 (312c3e83), #85 (ea476ec7), #86 (8afc51cb), #87 (8f3998d2), #88 (eac71041), #89 (b3e37379), #90 (91fe657e). Base tag `v1.23.0` cut at `45190721` on 2026-10-27. No `v1.24.0` tag exists locally or on origin (per the brief's verified ground facts; local `git tag -l v1.24.0` was blocked by shell policy — see Notes). All 14 PRs are represented in the release notes in this exact order.

## Commands

| Layer | Command | Exit | Summary |
|---|---|---|---|
| git | `git status --short` | 0 | Clean tree at start |
| git | `git branch --show-current` | 0 | `chore/20261121-release-v1-24-0` |
| git | `git rev-parse HEAD` | 0 | `fc29b826f5508e008425d08ee2df7dac05fc6bb5` (matches phase base) |
| git | `git log --oneline --max-count=20 v1.23.0..HEAD --merges` | 0 | Exactly 14 merges, PRs #77–#90 in order |
| git | `git tag -l v1.24.0` | denied | Shell policy blocks `git tag*`; relied on brief's verified no-tag fact |
| docs | `node scripts/validate-docs.js` | 0 | `Results: 5 passed, 0 failed` — index complete, links/anchors resolve, game lists agree (registry at 24 games), no missing Conductor paths, test-suite truth current |
| lint | `pnpm check` | 0 | Biome clean — 337 files checked, no fixes; lockfile up to date |
| types | `pnpm typecheck` | 0 | `tsc --noEmit` + e2e tsconfig clean, no diagnostics |

## Acceptance criteria

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| AC-1 | `package.json` version is `1.24.0` | `package.json` `"version": "1.24.0"`, commit `90d74fca` (single-line change; no lockfile edit) | PASS |
| AC-2 | Notes exist, are README-linked and table-listed, validator green, Status DRAFT before tag | `docs/release-notes-v1.24.0.md` header `Status: DRAFT` / `Tag: (pending)`; README Documentation index + Releases row (`f4a27f0c`); `node scripts/validate-docs.js` 5/0 | PASS |
| AC-6 | Skipped device pass recorded as accepted gap | Notes "Known Issues": `SKIPPED, accepted gap`, pointer to `docs/release-checklist.md` and `docs/device-testing-checklist.md`, following v1.22.0/v1.23.0 precedent | PASS |
| AC-7 | Notes accurately include 23rd/24th games, looks-not-scores, #90 CC0 BGM + MIT/legal | Sections PR #87 (23rd), #88 (24th, first debugging game), #89 (stored looks never scored), #90 (product-intent decisions in `docs/product-intent.md`, MIT `LICENSE`, prepared-not-submitted privacy artifacts, CC0 "Calm Loop" by wipics in `docs/audio-attribution.md`, no store listing/submission) | PASS |
| FR-1 / FR-2 / FR-3 | Version, notes (14 PRs in merge order, v1.23.0 format), README index link + table row | Commits `90d74fca`, `a6b6880d`, `f4a27f0c`; diff confined to Touches | PASS |
| NFR-1 / NFR-2 / NFR-4 | No runtime change; v1.23.0 structure without duplicating README Known Issues/roadmap; docs validator green | Diff = version metadata + notes + README links only; docs validator 5/0 | PASS |

## Evidence paths

- `package.json`
- `docs/release-notes-v1.24.0.md`
- `README.md` (Documentation index; Releases table)
- This report: `conductor/tracks/20261121-release-v1-24-0/verification/phase-1.md`

## Deviations

None. All edits stayed within the listed Touches (`package.json`, `docs/release-notes-v1.24.0.md`, `README.md`) plus this evidence file.

## Notes

- The shell policy denied `git tag -l v1.24.0` (all `git tag*` commands are blocked under this phase's permissions, since tagging is human-only in Phase 3). This did not block work: the brief supplies the verified fact that no `v1.24.0` tag exists locally or on origin, and no tag was created.
- Task commits: `90d74fca` (P1.T1 bump), `a6b6880d` (P1.T2 notes), `f4a27f0c` (P1.T3 README links). Evidence committed separately.

## Primary verification

Independent primary verification was run against the phase range `fc29b826..HEAD`:

- `git status --porcelain` — clean.
- `git diff --name-only fc29b826..HEAD` — only `package.json`, `docs/release-notes-v1.24.0.md`, `README.md`, and this evidence file; no file outside the phase `Touches`.
- `node scripts/validate-docs.js` — exit 0, 5 passed / 0 failed.
- Full `verify_phase` chain — exit 0 on the third consecutive attempt:
  `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`.
  Results: Biome clean 337 files; typecheck clean; 153 files / 3,323 tests green in both the unit and coverage runs; coverage 97.12% statements / 90.94% branches / 96.21% functions / 98.31% lines (gates 95/88/85/90); Vite build 411 modules, shell entry 191.16 kB, bundle validator PASS (186.7 kB ≤ 200 kB); PWA 16/16 with BGM precached; docs 5/5.

Two earlier attempts hit timing-sensitive failures in already-slow Hub tests (a 60.08 s unit timeout on `hubEngagement.test.ts`, then `timed out waiting for 1 queued art keys` in `hubScene.test.ts` under coverage). No `src/` file changed in this phase; both cleared without code changes on retry. Recorded here for traceability — no acceptance criterion depends on host timing. Result: verified.
