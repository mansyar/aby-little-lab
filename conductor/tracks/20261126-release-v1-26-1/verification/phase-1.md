# Phase 1 Evidence — Version metadata and release-note draft

- Track: `20261126-release-v1-26-1` (Release v1.26.1)
- Phase: 1 — Version metadata and release-note draft
- Date: 2026-11-26
- Branch: `chore/20261126-release-v1-26-1`
- Phase base: `32c4349a6219b45b16de36791b8b3a7102cc5b6e`
- Head: `f200ffc068653928b193ac14ae940166934b85c4`
- Result: **blocked** — the exact verification command was rejected by the shell permission layer; the primary must run it and hand back output.

## Commands

| Layer | Command | Exit | Summary |
|---|---|---|---|
| Git inspection | `git log --oneline --max-count=5` | 0 | Confirmed phase base and merged PR #100 at `859498a8`. |
| Git inspection | `git diff -- package.json` | 0 | Version-only `1.26.0` → `1.26.1`; no dependency or lockfile drift; `pnpm-lock.yaml` not modified. |
| Git inspection | `git status --short` | 0 | At handoff only `package.json` was modified, as cleared by the primary. |
| Commit (P1.T1) | `git add package.json` then `git commit -m "chore(release): bump version to 1.26.1"` | 0 | `84ffd0838168cdf7b14572a32c14c2933d8b9c81`, 1 file, 1 insertion / 1 deletion. |
| Git inspection | `git diff -- README.md` | 0 | Exactly one Documentation-index line added; no Releases-table row (Phase 2 owns it). |
| Commit (P1.T2) | `git add README.md docs/release-notes-v1.26.1.md` then `git commit -m "docs(release): draft v1.26.1 release notes and index link"` | 0 | `f200ffc068653928b193ac14ae940166934b85c4`, 2 files, 43 insertions. |
| Full gate | `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js` | denied | Permission rejected (`shell`); no exit code, no gate output. Not retried and not worked around. |
| Setup gate | `pnpm install --frozen-lockfile` | not run | Withheld because the full gate was denied; the primary must run both commands. |

The primary-cleared tag checks (`git tag --list v1.26.1` and the `ls-remote` check) and `pnpm version 1.26.1 --no-git-tag-version` were deliberately not rerun.

## Acceptance criteria

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| AC-1 | Version is `1.26.1`, lockfile consistent, no dependency drift | Commit `84ffd083` diff is version-only; `pnpm-lock.yaml` untouched; `pnpm install --frozen-lockfile` still pending | partial |
| AC-2 | Release notes follow the established parent-facing structure | `docs/release-notes-v1.26.1.md` has header, DRAFT/pending status, lede, `What Shipped Since v1.26.0`, PR #100 section, `Installation`, `Release Verification`, `Known Issues`; `validate-docs.js` gate pending | partial |
| AC-3 | README Documentation index links the new notes | Commit `f200ffc0` adds exactly one index line and no Releases-table row; `validate-docs.js` gate pending | partial |
| AC-12 | No unsupported real-device, retention, tag, deploy or final-CI claims | DRAFT note marks all of those pending and separates local checks, CI-only emulated engines and physical-device validation; gate pending | partial |

Coverage also recorded for FR-1, FR-2, FR-3 (index link half only), FR-10, FR-12, NFR-1, NFR-3 and NFR-4 through the two commits and the DRAFT note. FR-3's Releases-table row, FR-10's review/PR/merge and all post-tag work belong to later phases.

## Evidence paths

- `.conductor/runs/20261126-release-v1-26-1/phase-1-brief.md`
- `docs/release-notes-v1.26.1.md` (created in `f200ffc0`)
- `README.md` Documentation index (one line added in `f200ffc0`)
- `package.json` version bump (commit `84ffd083`)
- `conductor/tracks/20261126-release-v1-26-1/verification/phase-1.md` (this file)

## Deviations

None. All changes stayed inside `Touches`; no Conductor state was edited.

## Notes

- The full gate command is the exact string from the brief. The shell rejected it before execution, so no gate result exists for this phase. Per the brief it was not retried, split or replaced.
- The DRAFT note cites only currently existing archived evidence (`conductor/archive/20261125-browser-matrix/...`) and existing doc anchors, so no future archive path was introduced.
- Line endings were preserved as LF (`git ls-files --eol` reported `i/lf w/lf` for README and the prior release note); no normalization was performed.
- No tag was created, pushed, merged or deleted; no branch was switched.
