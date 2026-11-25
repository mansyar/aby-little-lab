# Phase 3 — Release-candidate verification

- **Track:** `20261125-release-v1-26-0`
- **Phase:** 3
- **Date:** 2026-11-25
- **Branch:** `chore/20261125-release-v1-26-0`
- **Base:** `9a9e7e65`
- **Measured implementation head:** `428db16c`
- **Result:** `verified`

## Result Summary

The exact configured full gate, rebuilt-container header validation, production
boot smoke and headed cold-control first-tap measurement all passed on the
release candidate. The exact gate was rerun after refreshing the notes and
evidence and again exited 0. The release notes now contain measured release-state
figures while leaving CI, device, tag and deploy claims pending their later gates.

The subagent's restricted shell denied the port preflight and full gate. The
primary ran the preflight and all required checks under the documented fallback;
the subagent's blocker commits are preserved and this report supersedes them.

## Commands

| Command | Exit | Summary |
| --- | ---: | --- |
| `Get-NetTCPConnection -LocalPort 4173,8080 -State Listen` | 1 | No matching listeners; both ports free. The cmdlet exits 1 when no objects match. |
| `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js` | 0 | Full configured gate passed. |
| `docker build --build-arg GIT_SHA=<HEAD> -t aby-little-lab:headers .` | 0 | Fresh image `sha256:21d3b670ea56da854febaf90f999cbf62c55781e23727e312a20d3582f960b8b`. |
| `node scripts/validate-headers.js` | 0 | 28/28 checks passed. |
| `$env:TAP_HEADED='1'; $env:TAP_INERT_IDLE='1'; node scripts/measure-first-tap.mjs --with-preview --json --warm-aware --samples 10` | 0 | Boot passed; exactly 50 cold / 0 warm, 10 per game; worst cold 300.2 ms. |
| `node scripts/validate-docs.js` | 0 | 5/5 after refreshing release notes. |

## Acceptance Criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| AC-2 | Notes cover PRs #94–#98 in merge order and make no unsupported claims. | Shipped sections unchanged; Release Verification now cites measured local results and explicitly leaves CI/device/tag/deploy pending. | pass |
| AC-5 | Exact gate exits 0 and actual figures are recorded. | `verification/integrated.md` records suite, coverage, build, bundle, module, texture, PWA, docs, boot, headers and headed results. | pass |
| AC-10 | No runtime/dependency/asset/save-schema change. | Phase 3 changed only release notes and Conductor evidence; cumulative release diff remains metadata/docs/roadmap/Conductor only. | pass |

## Concrete Evidence

- 158 test files / 3,395 tests; coverage 97.10% statements, 90.96% branches, 96.35% functions, 98.23% lines.
- Build: 491 modules; shell 197.99 kB raw / 50.40 kB gzip; bundle guard 193.4 kB; 172 TypeScript files with zero warnings; 319 SVGs; PWA 16/16 with 52 JS chunks and 64 precache entries; docs 5/5.
- Boot median: 0.81 s over three cold loads (budget 3.0 s).
- Headed cold p95 total: 265.9 ms aggregate; per-game totals 300.2 / 254.5 / 193.9 / 161.1 / 266.9 ms. Worst cold total 300.2 ms, below the unchanged 400 ms gate.
- Headers: 28/28. The pre-existing missing-hashed-asset cache-header quirk is recorded in the validator output and unchanged.

## Evidence Paths

- `conductor/archive/20261125-release-v1-26-0/verification/integrated.md`
- `conductor/archive/20261125-release-v1-26-0/verification/first-tap-headed.json`
- `conductor/archive/20261125-release-v1-26-0/verification/first-tap-headed.stdout.txt`
- `conductor/archive/20261125-release-v1-26-0/verification/first-tap-headed.log`
- `docs/release-notes-v1.26.0.md` § Release Verification

## Deviations and Scope Confirmation

Primary-owned verification was required because the phase subagent's sandbox
denied the preflight and gate. The harness's trailing PASS line was separated
from its JSON for machine readability while preserving exact stdout. Neither
action changed a threshold, sample count or measurement. Only release notes and
Conductor evidence changed in this phase. No runtime source, tests, assets,
dependencies, lockfiles, tags, deployment, push, merge, reset or branch switch
occurred.
