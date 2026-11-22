# Phase R1 evidence — Review fixes (Release v1.25.0)

- Track: `20261123-release-v1-25-0`
- Phase: R1 — Review Fixes (F1, F2)
- Branch: `chore/20261123-release-v1-25-0`
- Base: `45b46937`
- Date: 2026-11-23
- Result: verified

## Scope

Two review findings only. No source/test file touched; no Conductor state file
(`plan.md`, `metadata.json`, `tracks.md`, `review.md`, `pr.md`, `conductor/product.md`,
`conductor/tech-stack.md`) edited.

## F1 — release notes overstate CI coverage (Medium) → FR-2

File: `docs/release-notes-v1.25.0.md`, `## Release Verification` section,
`Device matrix` bullet. First sentence (accepted gap) kept verbatim; only the
second sentence replaced.

Before (second sentence):

> CI and the tag-deploy smoke re-confirm every automated figure above on the release commit.

After (second sentence):

> CI re-confirms lint, typecheck, unit tests, the production build, the bundle, PWA, boot, headers and docs validators, plus the browser journeys on the release commit. Coverage, module-size and texture figures are verified by the local `verify_phase` gate recorded above; they are not currently CI steps.

Full line after:

> - Device matrix: **SKIPPED — accepted gap** (see Known Issues). CI re-confirms lint, typecheck, unit tests, the production build, the bundle, PWA, boot, headers and docs validators, plus the browser journeys on the release commit. Coverage, module-size and texture figures are verified by the local `verify_phase` gate recorded above; they are not currently CI steps.

Basis: `.github/workflows/ci.yml` Quality Gates runs check, typecheck,
`CI=true pnpm test`, build, `validate-bundle.js`, `validate-pwa.js`,
`validate-boot.js`, `validate-headers.js` and `validate-docs.js` (plus the
`Browser Journeys` job). It does NOT run `pnpm test:coverage`,
`scripts/validate-module-size.js` or `scripts/validate-textures.js` (grep-confirmed);
README.md:201 lists the CI steps accurately. Rest of the file unchanged.

## F2 — stale diff count in integrated verification (Low) → AC-6

File: `conductor/tracks/20261123-release-v1-25-0/verification/integrated.md`,
`## Release diff scope` section.

Before:

> - Total branch diff vs base: 50 files, 5,981 insertions, 4,619 deletions — the bulk is the behavior-neutral module split (new sibling files + re-export façades).

After:

> - Total branch diff vs base: 51 files, 6,049 insertions, 4,619 deletions — the bulk is the behavior-neutral module split (new sibling files + re-export façades).

Basis: `git diff --shortstat 9ffbc01d..f4716fad` →
`51 files changed, 6049 insertions(+), 4619 deletions(-)`.
The non-Conductor line (38 files, 5,268 insertions, 4,260 deletions) is already
correct and was left unchanged.

## Verification

Commands run separately (no `&&` chains):

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| documents | `node scripts/validate-docs.js` | 0 | 5 passed / 0 failed |
| static | `pnpm check` | 0 | Biome clean — 364 files, no fixes applied |
| static | `pnpm typecheck` | 0 | `tsc --noEmit` src + e2e clean |

The primary runs the full `verify_phase` gate independently.

## Acceptance-criteria mapping

| Finding | Requirement | Status |
| --- | --- | --- |
| F1 | FR-2 (release notes structure / truthful CI claim) | Pass |
| F2 | AC-6 (full verify_phase / integrated diff scope truth) | Pass |

## Deviations

None.

## Blockers

None.

## Notes

Both edits are text-only and match the brief exactly. No product or design
decision was needed.

## Primary verification (orchestrator, independent)

- Working tree clean; single fix commit `0acad5f3`; diff confined to the two
  documented files plus this evidence file. No source, test or Conductor state
  file changed.
- Grepped both files at the reported lines: `docs/release-notes-v1.25.0.md:48`
  carries the truthful CI wording; `verification/integrated.md:22` reads
  `51 files, 6,049 insertions, 4,619 deletions` and the non-Conductor line is
  unchanged and correct.
- Full `verify_phase` chain re-run on the final tree, exit 0: `pnpm check`
  Biome clean 364 files; `pnpm typecheck` src + e2e clean; unit 154 files /
  3,346 tests; coverage 154 / 3,346, 97.15% stmts / 90.97% branches / 96.28%
  funcs / 98.30% lines vs gates 95/88/85/90; `pnpm build` 487 modules, shell
  `index-BFkG8G2w.js` 193.62 kB Vite / 189.1 kB via validator (≤200 kB), Phaser
  vendor 1,367.08 kB (pre-existing advisory); `validate-bundle.js` PASS;
  `validate-module-size.js` 167 files zero warnings; `validate-textures.js`
  319 SVGs 76.07/319.00 MiB ratio 0.238; `validate-pwa.js` 16/16;
  `validate-docs.js` 5/5.
- Result: verified. F1 and F2 resolved; ready for round-2 review.
