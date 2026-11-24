## Summary

This track performs the November 2026 monthly dependency pass: it upgrades the six frozen dev packages (Biome, Vite, the Vitest/coverage pair and the Playwright pair) to the versions current at each phase's execution, keeps package.json and the lockfile in lockstep, and records a reusable monthly procedure in the stack doc. No runtime dependency was flagged, no production source changed, and every configured quality gate remains green.

## Track

- **ID:** `20261124-dependency-majors`
- **Type:** chore
- **Spec:** [`conductor/archive/20261124-dependency-majors/spec.md`](conductor/archive/20261124-dependency-majors/spec.md)
- **Plan:** [`conductor/archive/20261124-dependency-majors/plan.md`](conductor/archive/20261124-dependency-majors/plan.md)
- **Review:** [`conductor/archive/20261124-dependency-majors/review.md`](conductor/archive/20261124-dependency-majors/review.md)

## What happened

| Phase | Goal | Result | Checkpoint | Notes |
| --- | --- | --- | --- | --- |
| 1: Survey and upgrade Biome and Vite | Freeze the six candidates and upgrade Biome/Vite | verified | `4a8fa46d` | Biome 2.6.3 ΓåÆ 2.6.8, Vite 8.3.5 ΓåÆ 8.3.8; forced `biome.json` `$schema` bump recorded |
| 2: Upgrade the Vitest and coverage pair | Move Vitest and coverage to one shared version | verified | `4929a66f` | Both 5.0.5 ΓåÆ 5.1.1; no test or config change forced, no `clearMocks: false` |
| 3: Upgrade the Playwright pair and handle conditional runtime drift | Align the Playwright pair and handle any runtime flag | verified | `cd725aa8` | Both exact 1.65.1; FR-4 did not fire, so no runtime bump or E2E run |
| 4: Stack doc, docs truth and integrated gate | Refresh stack doc and prove the final diff | verified | `b78553ff` | Versions + "Monthly dependency maintenance" added; full `verify_phase` exit 0 |
| R1: Review Fixes | Close the two Low review findings | verified | `3bf09457` | Verbatim survey restored in phase-1 evidence; em dash restored in See Also list |

## Requirements

- [x] `FR-1` ΓÇö survey and freeze the six dev candidates; record installed versions (`verification/phase-1.md`)
- [x] `FR-2` ΓÇö pair-coherent Vitest/coverage and exact aligned Playwright pair; manifest and lockfile together (`verification/phase-2.md`, `verification/phase-3.md`)
- [x] `FR-3` ΓÇö full `verify_phase` per phase (`verification/phase-1.md` ΓÇª `verification/phase-4.md`)
- [x] `FR-4` ΓÇö runtime bump only if flagged; none flagged, so no E2E required (`verification/phase-3.md`)
- [x] `FR-5` ΓÇö no new dependencies; frozen install resolves deterministically (`package.json`, `pnpm-lock.yaml`)
- [x] `FR-6` ΓÇö stack doc version refresh plus monthly maintenance checklist (`conductor/tech-stack.md`)
- [x] `FR-7` ΓÇö dev-only path leaves production source byte-identical (empty `src` diff)
- [x] `FR-8` ΓÇö deviations recorded with reasons (`verification/phase-1.md`)
- [x] `NFR-1` ΓÇö coverage/bundle/PWA/module-size/docs thresholds unchanged and green
- [x] `NFR-2` ΓÇö lockfile deterministic; `pnpm install --frozen-lockfile` exit 0
- [x] `NFR-3` ΓÇö no runtime dependency or production change
- [x] `NFR-4` ΓÇö non-watch Vitest commands; one full gate on the final tree
- [x] `AC-1` ΓÇö verbatim six-row pre-upgrade survey in phase-1 evidence
- [x] `AC-2` ΓÇö post-upgrade `pnpm outdated` re-runs confirm each pair current
- [x] `AC-3` ΓÇö Vitest/coverage share 5.1.1; Playwright pair exact 1.65.1
- [x] `AC-4` ΓÇö all four phases independently verified with evidence
- [x] `AC-5` ΓÇö frozen lockfile install green
- [x] `AC-6` ΓÇö no runtime flag; `phaser` unchanged; no `pnpm test:e2e` needed
- [x] `AC-7` ΓÇö production source diff empty
- [x] `AC-8` ΓÇö stack doc versions + monthly section; docs validation 5/5
- [x] `AC-9` ΓÇö coverage 95/88/85/90 and all validators unchanged
- [x] `AC-10` ΓÇö only recorded deviation; no gate or assertion weakened

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| install | `pnpm install --frozen-lockfile` | pass | exit 0, no manifest drift |
| check | `pnpm check` | pass | 370 files, no fixes |
| lint | `pnpm exec biome lint .` | pass | no diagnostics |
| format | `pnpm exec biome format .` | pass | non-mutating check |
| typecheck | `pnpm typecheck` | pass | app + e2e |
| unit | `pnpm test -- --run` | pass | 156 files / 3,380 tests (Vitest 5.1.1) |
| coverage | `pnpm test:coverage` | pass | statements 97.11/90, branches 90.93/85, functions 96.33/88, lines 98.25/95 |
| build | `pnpm build` | pass | Vite 8.3.8, 490 modules |
| bundle | `node scripts/validate-bundle.js` | pass | shell 193.0 kB <= 200 kB |
| module-size | `node scripts/validate-module-size.js` | pass | 171 modules, zero warnings |
| textures | `node scripts/validate-textures.js` | pass | 319 SVGs, all budgets pass |
| PWA | `node scripts/validate-pwa.js` | pass | 16/16, 51 chunks precached |
| docs | `node scripts/validate-docs.js` | pass | 5/5 |
| outdated | `pnpm outdated --format=list` | pass | exit 0, no frozen candidate or runtime row |
| integrated | full `verify_phase` chain | pass | `conductor/archive/20261124-dependency-majors/verification/integrated.md`, `INTEGRATED_GATE_EXIT=0` |

## Review

- **Verdict:** `PASS`
- **Rounds:** 2
- **Fixed:** 2 findings (verbatim survey evidence, See Also em dash)
- **Accepted/deferred:** 0 (see `review.md`)

## Deviations and risks

- `biome.json` `$schema` URL changed 2.6.3 ΓåÆ 2.6.8 because Biome 2.6.8 required it; no lint rule, budget or assertion changed.
- The pre-upgrade `pnpm outdated` output was reconstructed from the base manifest in a scratch directory during review; the verbatim rows and provenance are recorded in phase-1 evidence.
- Vite received a patch-level bump; no boot/preload/PWA/asset source changed and the build/bundle/PWA validators are green, so boot smoke was not triggered.
- Risk: minor/patch tool upgrades can change behaviour between releases; the full gate and unchanged production diff bound that risk.

## Follow-ups

- none

## Rollback

```bash
# Merge commit
git revert --no-edit -m 1 <merge-commit>
```

No data migration, feature flag or schema change is involved; reverting the merge restores the prior manifest, lockfile and Biome schema URL.

