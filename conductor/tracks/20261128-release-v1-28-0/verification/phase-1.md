# Phase 1 Verification - Release v1.28.0

- Track: `20261128-release-v1-28-0` — Release v1.28.0
- Phase: 1 — Version metadata and DRAFT release notes
- Date: 2026-11-28
- Branch: `chore/20261128-release-v1-28-0`
- Phase base: `4224ed1dd2988081ebeb9da17975552502d53b05` (pre-existing `master` base `39df7f5b7c4fc994475156c9affd1a4da8bec4f1`)
- Head after task commits: `c9f96919` (Phase 1 squash of `c19b0aab`, `9384d9f4`, `f2e28fe2`, `4f44a459`, `e27a61dd`, `5202a68c`)
- Result: **verified** (phase verification and primary full `verify_phase` green; built bundle reports `1.28.0`)

## Commands

| Layer | Command | Exit | Summary |
|---|---|---|---|
| Version metadata | `git diff --stat` (after edit) | 0 | Exactly one line changed in `package.json`; no other tracked file touched. |
| Version propagation | native grep of `vite.config.ts` and `src` for `__APP_VERSION__` / `pkg.version` | 0 | `vite.config.ts:4` imports `pkg` from `./package.json`; `:10` sets `__APP_VERSION__: JSON.stringify(pkg.version)`. Consumers read the define without hardcoded version strings. No runtime source change needed. |
| Static verification | `pnpm check && pnpm typecheck` | 0 | `pnpm check`: lockfile up to date, Biome checked 393 files with no fixes. `pnpm typecheck`: `tsc --noEmit` plus `tsc --noEmit -p e2e/tsconfig.json` clean. |
| Rework verification (re-run) | `pnpm check && pnpm typecheck` | 0 | Re-run after the PR #110 spacing correction in the DRAFT notes; Biome checked 393 files with no fixes and both TypeScript projects clean again. |
| Full gate after sequencing fix | `node scripts/validate-docs.js && pnpm check && pnpm typecheck` | 0 | `validate-docs`: release-note index complete, all relative links and anchors resolve, README/PRD/TDD registry truth holds, no missing Conductor paths, living suite figures current (5 passed / 0 failed). Biome checked 393 files with no fixes; both TypeScript projects clean. |
| Primary full `verify_phase` | `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js` | 0 | 165 files / 3,559 tests; coverage 96.91 statements / 90.23 branches / 96.22 functions / 98.06 lines; 501 modules; shell 190.3 kB; module-size PASS with 3 warnings; textures 76.42 / 321.00 MiB, ratio 0.238; PWA 16/0; docs 5/0. |
| Built version propagation | grep `1.28.0` in `dist/assets/index-B7LXOJIw.js` after build | 0 | Built shell contains `1.28.0`, confirming `package.json` → Vite define → bundle propagation. |
| Git state | `git status --short`; `git rev-parse HEAD`; `git diff --stat` | 0 | Before commit: only `package.json` modified and `docs/release-notes-v1.28.0.md` untracked. Phase base `4224ed1d`, pre-commit head `4224ed1d`. |
| Task commits | `git add package.json`; `git commit -m "chore(release): bump version to 1.28.0"`; `git add docs/release-notes-v1.28.0.md`; `git commit -m "docs(release): add v1.28.0 DRAFT release notes"` | 0 | `c19b0aab` (version bump), `9384d9f4` (DRAFT notes). No amend, no Conductor state touched. |

## Acceptance criteria

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| AC-1 | `package.json` and the built bundle both report `1.28.0` | `package.json` changed `1.27.0` → `1.28.0` in `c19b0aab`. `vite.config.ts:4,10` derives `__APP_VERSION__` from `pkg.version`; consumers contain no hardcoded version. Primary build produced `dist/assets/index-B7LXOJIw.js`, and grep found `1.28.0` in the emitted shell. | PASS |
| AC-2 | Notes are DRAFT before ship and FINAL only after tag/deploy/live verification, with all three PR sections and the accepted device gap | `docs/release-notes-v1.28.0.md` uses `Status: DRAFT`, `Tag: pending`, `Base: v1.27.0 (\`019a26cd\`, 2026-11-27)`, `Date: 2026-11-28`; parent-facing lede; PR #109 → #110 → #111 sections in merge order; Installation with no-migration language; Release Verification placeholders with no candidate/CI/tag/deploy/live claims; `SKIPPED — accepted gap` device policy; Known Issues with README and roadmap links. | PASS |
| FR-1 | Version exposed through the existing Vite define | Same evidence as AC-1; no runtime source change; built shell contains `1.28.0`. | PASS |
| FR-2 | Established notes structure, three PRs in merge order, DRAFT until ship gate | Same evidence as AC-2. | PASS |
| NFR-1 | No runtime, production-source, asset, dependency, schema or storage change | The phase diff contains only `package.json` version metadata, the new notes file, the README Documentation link, the primary plan-sequencing correction, and this evidence file. `pnpm-lock.yaml` was left untouched. | PASS |
| FR-3 / AC-3 (Phase 1 slice) | README Documentation indexes every release-notes file so `validate-docs` passes | `README.md` Documentation index now links `docs/release-notes-v1.28.0.md` as DRAFT with candidate verification pending and no CI/tag/deploy/live claims; `node scripts/validate-docs.js` reports "The release-note index is complete" and 5 passed / 0 failed. The Releases table row remains a Phase 2 task. | PASS (index link) / DEFERRED (Releases row in Phase 2) |

## Evidence paths

- `package.json` — version bump, commit `c19b0aab`.
- `docs/release-notes-v1.28.0.md` — DRAFT notes, commit `9384d9f4`; PR #110 spacing sentence corrected in the rework commit.
- `README.md` — Documentation index gains the v1.28.0 DRAFT notes link only; no Releases table row added in Phase 1.
- `vite.config.ts` — inspected, unchanged (version define at lines 4 and 10).
- `pnpm-lock.yaml` — inspected, unchanged; no version field to bump.
- `conductor/tracks/20261128-release-v1-28-0/verification/phase-1.md` — this report.
- No binary or large log artifacts were produced; nothing was written under `.conductor/evidence/`.

## Deviations

None. All changes stayed inside the Phase 1 `Touches` paths plus this evidence file.

## Notes

- Archived track-record links, issue #108 links and measured verification figures are deliberately deferred to Phase 2 (P2.T2) and Phase 3, so this draft contains only GitHub PR links and placeholder verification bullets.
- Physical-device coverage is recorded as `SKIPPED — accepted gap`, never as a pass.
- No product doc, `review.md` or `pr.md` was edited by the phase agent. The primary alone corrected `plan.md` to sequence the README link and owns all Conductor state updates.
- Verification was run on the working tree before task commits; the primary then ran the full configured gate on the final reviewed tree and confirmed the built version. The squash commit contains only the reviewed Phase 1 files.
- Rework (primary review finding): the PR #110 bullet originally said "Tile size and spacing are unchanged". Source inspection of `src/game/hub/hubGridConstants.ts` (`TILE_SPACING = 22`, `TILE_ROW_SPACING = 18`, `WIDE_BOARD_TOP = 108`) and `src/game/hub/gridLayout.ts` (horizontal spacing uses `TILE_SPACING`, vertical spacing uses `TILE_ROW_SPACING`) confirmed that only tile size and horizontal spacing are unchanged; vertical row spacing is 18px so the five-row board clears the chip band and fits 1024×768. The sentence was corrected without changing any other claim, and the verification command was re-run green.
- Rework 2 (primary full-gate finding): the primary's full `verify_phase` gate failed because `scripts/validate-docs.js` requires every `release-notes-v*.md` file to be linked from the README Documentation index immediately, while the original Phase 1 plan and brief only named `package.json` and the notes file. The primary updated the brief and plan to add task P1.T2.4; this rework adds only the v1.28.0 notes link to the Documentation index, describing it as DRAFT with candidate verification pending and claiming no unmeasured CI, tag, deploy or live result. The Releases table row stays in Phase 2 (P2.T1.1). `node scripts/validate-docs.js && pnpm check && pnpm typecheck` now exits 0 with 5 document checks passed.
- No other file was touched by either rework: `package.json`, the release notes body, `plan.md`, `metadata.json` and Conductor state files were left unchanged.
