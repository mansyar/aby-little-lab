# Phase 1 — Version metadata and release-note draft

- **Track:** `20261125-release-v1-26-0`
- **Phase:** 1
- **Date:** 2026-11-25
- **Branch:** `chore/20261125-release-v1-26-0`
- **Base:** `112a91b3bbfcf910a8cdc9dde240e20a3c7c0b26`
- **Head:** `4f5969a0` (last implementation commit before this evidence/state commit)
- **Result:** `verified`

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| git | `git tag --list v1.26.0` | 0 | Primary-provided result: no output; no local `v1.26.0` tag exists. |
| release metadata | `pnpm version 1.26.0 --no-git-tag-version` | 0 | Primary-provided result: `package.json` is `1.26.0`; no lockfile, dependency or tag change. |
| git | `git diff -- package.json pnpm-lock.yaml` | 0 | Only the intended `package.json` version line changed. |
| git | `git diff --exit-code -- pnpm-lock.yaml` | 0 | No output; lockfile unchanged. |
| git | `git diff --check` | 0 | No whitespace errors. |
| git | `git commit -m "chore(release): bump version to 1.26.0"` | 0 | Commit `1b81f85b`; one version-line change. |
| git | `git commit -m "docs(release): draft v1.26.0 notes"` | 0 | Commit `efbbeded`; 71-line DRAFT note covering PRs #94–#98. |
| git | `git commit -m "docs(release): index v1.26.0 draft notes"` | 0 | Commit `4f5969a0`; README Documentation index now links the draft. |
| full gate (subagent) | Exact configured `verify_phase` chain | denied | Restricted shell denied the command; no gate result was produced. |
| full gate (primary, first run) | Exact configured `verify_phase` chain | 1 | Code, tests, coverage, build and artifact validators passed; `validate-docs.js` failed only because the README index link was missing. |
| full gate (primary, fix run) | Exact configured `verify_phase` chain | 0 | 158 test files / 3,395 tests passed; coverage passed; build and every validator passed, including docs 5/5. |
| install | `pnpm install --frozen-lockfile` | 0 | Lockfile is up to date; no dependency drift. |

### Full-gate figures (fix run)

- Static: Biome checked 373 files; TypeScript application and E2E configs passed.
- Unit: 158 files, 3,395 tests passed.
- Coverage: statements 97.10%, branches 90.96%, functions 96.35%, lines 98.23%.
- Build: 491 modules; shell entry 193.4 kB; 52 JavaScript chunks; 64 PWA precache entries.
- Module size: 172 TypeScript files; zero warnings.
- Textures: 319 SVGs; all tiered and uniform-size guards passed.
- PWA: 16 passed, 0 failed.
- Documents: 5 passed, 0 failed.

## Acceptance Criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| AC-1 | `package.json` is `1.26.0`, and frozen installation remains green with no dependency drift. | Version diff is exactly `1.25.0` → `1.26.0`; lockfile diff is empty; frozen install exited 0. | pass |
| AC-2 | Release notes cover PRs #94–#98 in merge order and make no unsupported claims. | `docs/release-notes-v1.26.0.md` has the required DRAFT header, parent lede, ordered PR sections, Installation, Release Verification and Known Issues; release-state, CI/deploy and device claims remain pending. | pass |
| AC-3 | README contains the Documentation index link. | `README.md` links the v1.26.0 notes directly before v1.25.0; the release-table row remains Phase 2 work. | pass |
| AC-10 | The release diff contains no runtime source, dependency, asset or save-schema changes outside Conductor state. | Phase implementation diff contains only `package.json`, the new release note, and the README index link. | pass |

## Evidence Paths

- This report: `conductor/tracks/20261125-release-v1-26-0/verification/phase-1.md`
- Release-note draft: `docs/release-notes-v1.26.0.md`
- README Documentation index: `README.md` (Documentation section)
- Phase brief: `.conductor/runs/20261125-release-v1-26-0/phase-1-brief.md`

## Deviations

- **File:** `README.md`
- **Reason:** The primary repaired the plan ordering so Phase 1 owns the README Documentation index link only. `scripts/validate-docs.js` requires every release-note file to appear in that index; the link was added directly before v1.25.0. The Phase 2 release-table row and roadmap correction remain out of scope and untouched.

## Notes

P1.T1 and P1.T2 are complete and committed, including the README verification fix. The first primary gate run exposed the cross-phase index dependency; after the planned ordering repair, the second primary run passed every configured check. The phase checkpoint remains the last implementation commit because the primary's plan-repair commit is intentionally not part of the subagent's squash range.

## Primary verification

- **Working tree:** clean except this evidence file before the state commit.
- **Scope check:** `git diff --name-only 112a91b3bbfcf910a8cdc9dde240e20a3c7c0b26..4f5969a0` contains only `README.md`, the phase plan (primary state repair), `docs/release-notes-v1.26.0.md`, and `package.json`; no runtime source, tests, dependencies, assets or lockfile changed.
- **Diff review:** README adds exactly one index link; package adds exactly one version-line change; release notes cover #94–#98 in order and leave tag/deploy/device claims pending.
- **Gate:** exact configured `verify_phase` chain exited 0 after the README fix.
- **Install:** `pnpm install --frozen-lockfile` exited 0.
- **Acceptance:** AC-1, AC-2, AC-3 and AC-10 pass with evidence above.
