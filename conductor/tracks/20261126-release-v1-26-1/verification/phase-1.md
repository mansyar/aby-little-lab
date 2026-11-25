# Phase 1 Evidence — Version metadata and release-note draft

- Track: `20261126-release-v1-26-1` (Release v1.26.1)
- Phase: 1 — Version metadata and release-note draft
- Date: 2026-11-26
- Branch: `chore/20261126-release-v1-26-1`
- Phase base: `32c4349a6219b45b16de36791b8b3a7102cc5b6e`
- Implementation head: `659ac77175ee8920a2da865fa05355fcff5a87f4`
- Result: **verified**

## Commands

| Layer | Command | Exit | Summary |
|---|---|---|---|
| Git inspection | `git tag --list v1.26.1` | 0 | No local tag collision. |
| Git inspection | `git ls-remote origin refs/tags/v1.26.1` | 0 | No remote tag collision. |
| Version | `pnpm version 1.26.1 --no-git-tag-version` | 0 | `package.json` moved `1.26.0` → `1.26.1`; no tag; no lockfile drift. The pnpm-reformatted `engines` line was restored to its original one-line form. |
| Commit (P1.T1) | `git add package.json` then `git commit -m "chore(release): bump version to 1.26.1"` | 0 | `84ffd0838168cdf7b14572a32c14c2933d8b9c81`, one file, one insertion / one deletion. |
| Commit (P1.T2) | `git add README.md docs/release-notes-v1.26.1.md` then `git commit -m "docs(release): draft v1.26.1 release notes and index link"` | 0 | `f200ffc068653928b193ac14ae940166934b85c4`; DRAFT notes plus exactly one README Documentation-index link and no Releases-table row. |
| Evidence commit | `659ac77175ee8920a2da865fa05355fcff5a87f4` | 0 | Executor's blocked-evidence handoff. |
| Full gate (first attempt) | `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js` | 1 | Transient `TestTimeoutError` in `src/__tests__/game/hub/artGroups.test.ts` at 30 s while 158 workers started; 157 files and 3,403 tests passed. No implementation failure. Raw log: `.conductor/evidence/phase-1/gate.log`. |
| Full gate (accepted attempt) | same exact chain | 0 | Biome 375 files; application and E2E typechecks passed; 158 files / 3,404 tests passed in unit and coverage runs; build 491 modules; all validators passed. Raw log: `.conductor/evidence/phase-1/gate-2.log`. |
| Setup gate | `pnpm install --frozen-lockfile` | 0 | Lockfile up to date, resolution skipped, no drift. Raw log: `.conductor/evidence/phase-1/frozen-install-2.log`. |

Accepted gate figures:

- Coverage: 97.09% statements, 90.93% branches, 96.35% functions, 98.23% lines.
- Build: 491 modules; shell entry `index-C9uYH1Mm.js` 195.2 kB under the 200 kB guard.
- Module guard: 172 TypeScript files with zero warnings.
- Texture guard: 319 SVGs, budget and tier ratio passing.
- PWA: 16/16 with 52 precached JavaScript chunks and 64 total precache entries.
- Documentation: 5/5, including the new v1.26.1 notes index link.
- Only warning: the pre-existing Phaser vendor chunk above 500 kB.

## Acceptance criteria

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| AC-1 | Version is `1.26.1`, lockfile consistent, no dependency drift | Commit `84ffd083` is version-only; `pnpm-lock.yaml` untouched; `pnpm install --frozen-lockfile` exit 0 | pass |
| AC-2 | Release notes follow the established parent-facing structure | `docs/release-notes-v1.26.1.md` has Status/Tag/Base, parent lede, `What Shipped Since v1.26.0`, PR #100 section, Installation, Release Verification and Known Issues; docs validation 5/5 | pass |
| AC-3 | README Documentation index links the new notes | Commit `f200ffc0` adds exactly one index line; docs validation 5/5. The Releases-table row remains Phase 2 | pass for Phase 1 scope |
| AC-12 | No unsupported real-device, retention, tag, deploy or final-CI claims | DRAFT marks all of those pending and separates local checks, CI-only emulated engines and physical-device validation; docs validation 5/5 | pass |

Coverage also recorded for FR-1, FR-2, FR-3 (index link half only), FR-10, FR-12, NFR-1, NFR-3 and NFR-4 through the three commits and the DRAFT note. FR-3's Releases-table row, FR-10's review/PR/merge and all post-tag work belong to later phases.

## Evidence paths

- `.conductor/runs/20261126-release-v1-26-1/phase-1-brief.md`
- `.conductor/evidence/phase-1/gate.log`
- `.conductor/evidence/phase-1/gate-2.log`
- `.conductor/evidence/phase-1/frozen-install-2.log`
- `docs/release-notes-v1.26.1.md` (created in `f200ffc0`)
- `README.md` Documentation index (one line added in `f200ffc0`)
- `package.json` version bump (commit `84ffd083`)

## Deviations

- The executor's shell denied the exact gate; the primary ran it as the documented fallback and recorded both the transient failure and the accepted pass.
- The first accepted-gate attempt timed out on one unrelated unit test during worker startup. The exact chain was rerun unchanged and passed; no test or source change was made.

## Notes

- The DRAFT note cites only existing archived evidence and doc anchors; no future archive path was introduced.
- Line endings were preserved as found; no normalization was performed.
- No tag was created, pushed, merged or deleted; no branch was switched.
