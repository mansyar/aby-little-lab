# Integrated verification — Release v1.25.0

- Track: `20261123-release-v1-25-0`
- Type: chore (release orchestration + strict no-runtime-change P6 housekeeping)
- Branch: `chore/20261123-release-v1-25-0`
- Base: `9ffbc01d3eb976bedfd6f5bc92b8e269abd9173a` (master at PR #92 merge / v1.24.0 lineage)
- Final implementation head: `06f2f69b`
- Date: 2026-11-23
- Result: PASS — ready for conductor-review and PR

## Artifacts by phase

| Phase | Checkpoint | Evidence | Outcome |
| --- | --- | --- | --- |
| 1 — Strict module-size refactor | `0c6e79d5` | `verification/phase-1.md` | 13 oversized production modules split into re-export façades + siblings; 167 production files, 0 over 400 lines (max 399); suite unchanged at 154 files / 3,346 tests |
| 2 — Module-size guard | `6815d8c3` | `verification/phase-2.md` | `scripts/validate-module-size.js` (warn >400, fail >600) wired at `conductor/workflow.md:39/119/195/225` + `package.json`; real tree 167 files zero warnings, 601-line fixture exits 1; one behavior-neutral parameter rename fixed a Phase 1 ripple |
| 3 — Changelog split | `c4014bd6` | `verification/phase-3.md` | 33 dated changelog entries moved verbatim into `docs/changelog.md` (byte-comparison proof), pointers in both Conductor docs, README link, first two P6 roadmap rows Done |
| 4 — Version and release notes | `08f1c09b` | `verification/phase-4.md` | `package.json` 1.25.0; DRAFT notes covering PR #92 + both P6 items with the accepted device-pass gap; README Documentation link and Releases row dated 2026-11-23 |

## Release diff scope

- Total branch diff vs base: 50 files, 5,981 insertions, 4,619 deletions — the bulk is the behavior-neutral module split (new sibling files + re-export façades).
- Non-Conductor diff: 38 files, 5,268 insertions, 4,260 deletions.
- Runtime behavior: no game, rule, scene behavior, GameId, save format, input mode or language changed. Only structural module extractions, two new build-time guards, documentation and version metadata.
- Merge set since `v1.24.0`: exactly one feature PR, #92 (merge `9ffbc01d`, head `8b8b142c`). P6 items are part of this release branch, not separate PRs.

## Full configured gate (final tree, exit 0)

| Command | Result |
| --- | --- |
| `pnpm check` | Biome clean, 364 files, no fixes |
| `pnpm typecheck` | `tsc --noEmit` src + e2e clean |
| `pnpm test -- --run` | 154 files / 3,346 tests passed |
| `pnpm test:coverage` | 154 files / 3,346 tests; 97.15% stmts, 90.97% branches, 96.28% funcs, 98.30% lines vs gates 95/88/85/90 |
| `pnpm build` | Vite 8.3.5, 487 modules; shell `index-BFkG8G2w.js` 193.62 kB Vite / 189.1 kB via validator (≤200 kB); Phaser vendor 1,367.08 kB (pre-existing >500 kB advisory) |
| `node scripts/validate-bundle.js` | PASS — shell 189.1 kB ≤ 200 kB |
| `node scripts/validate-module-size.js` | PASS — 167 TypeScript files, zero warnings (max 399 lines) |
| `node scripts/validate-textures.js` | PASS — 319 SVGs (34 icon / 283 card / 2 hero); typical 76.07 MiB ≤ 80, full 319.00 MiB ≤ 320, ratio 0.238 ≤ 0.5 |
| `node scripts/validate-pwa.js` | PASS — 16/16; 63 precache entries, BGM and all 51 JS chunks precached |
| `node scripts/validate-docs.js` | PASS — 5/5 (note index, links/anchors, game lists, Conductor paths, suite truth) |

Boot-time (`validate-boot.js`) and security-header (`validate-headers.js`) validation fire in CI on the release commit; the real-device pass remains a recorded accepted gap (AC-9).

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| AC-1 | Version is 1.25.0 | `package.json:3`; phase 4 checkpoint `08f1c09b` | Pass |
| AC-2 | Notes exist, README-linked, index-listed, validator 5/5, DRAFT pre-tag | `docs/release-notes-v1.25.0.md`, README index + Releases row, `validate-docs.js` 5/5, no remote tag | Pass |
| AC-3 | Every production module ≤400 lines; module-size guard green on real tree | Phase 1 line count 167/0; `validate-module-size.js` zero warnings | Pass |
| AC-4 | Guard fails synthetic oversized fixture with exit 1 | 601-line fixture produced `FAIL: oversized.ts — 601 lines (> 600)` and exit 1 (Phase 2) | Pass |
| AC-5 | Changelogs moved verbatim with pointers | Byte-comparison proof in `verification/phase-3.md`; validator 5/5 | Pass |
| AC-6 | Full verify_phase green on release commit | Table above | Pass |
| AC-7 | Review PASS + green CI + merged via `merge` | Pending — review gate and PR ahead | Pending |
| AC-8 | Tag `v1.25.0` on merged master HEAD + notes FINAL | Pending — Phase 6 human tag gate | Pending |
| AC-9 | Skipped device pass recorded as accepted gap | Notes `## Known Issues` with checklist links | Pass |
| AC-10 | No runtime behavior change | Diff scope above; pure extractions + guards/docs only | Pass |

## Deviations and recorded decisions

- Phase 1 added one behavior-neutral parameter rename (`playIncorrect` → `playTone`) to satisfy an existing raw-source test after extraction; accepted in Phase 2 evidence.
- Phase 2/3 subagents were denied writing protected Conductor docs and running guard commands; the primary executed those exact operations and handed results back.
- The changelog move used a byte-preserving script because native read/grep truncate 2000-char lines; verbatim comparison against the git blobs is recorded in Phase 3 evidence.
- AC-7/AC-8 remain pending by design: PR merge and tag/deploy are explicit human gates.

## Conclusion

All implementation work and gates are green. Ready for `conductor-review`; no debt is deferred.
