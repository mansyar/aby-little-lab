# Integrated Verification — v1.26.0 release candidate

- **Track:** `20261125-release-v1-26-0`
- **Branch:** `chore/20261125-release-v1-26-0`
- **Date:** 2026-11-25
- **Phase base:** `9a9e7e65`
- **Measured implementation head:** `428db16c` (notes refreshed afterward on the same release tree)
- **Result:** pass for local release-candidate checks, release PR/tag CI, merge, deploy and live verification; targeted device smoke is an accepted gap

## Commands and Results

| Layer | Command | Exit | Result |
| --- | --- | ---: | --- |
| static | `pnpm check` | 0 | Biome checked 373 files; no fixes. |
| typecheck | `pnpm typecheck` | 0 | Application and E2E TypeScript projects passed. |
| unit | `pnpm test -- --run` | 0 | 158 files / 3,395 tests passed. |
| coverage | `pnpm test:coverage` | 0 | 97.10% statements, 90.96% branches, 96.35% functions, 98.23% lines. |
| build | `pnpm build` | 0 | 491 modules; shell entry 197.99 kB raw / 50.40 kB gzip. |
| bundle | `node scripts/validate-bundle.js` | 0 | Validator shell 193.4 kB <= 200 kB; Phaser vendor chunk present. |
| module size | `node scripts/validate-module-size.js` | 0 | 172 TypeScript files; zero warnings. |
| textures | `node scripts/validate-textures.js` | 0 | 319 SVGs; 76.07 MiB typical tiered; tier ratio 0.238. |
| PWA | `node scripts/validate-pwa.js` | 0 | 16/16; 52 JS chunks precached; 64 total precache entries. |
| docs | `node scripts/validate-docs.js` | 0 | 5/5 after release-note refresh. |
| container build | `docker build --build-arg GIT_SHA=<HEAD> -t aby-little-lab:headers .` | 0 | Fresh release-candidate image built. |
| headers | `node scripts/validate-headers.js` | 0 | 28/28 route/header/cache checks passed. |
| boot | `scripts/validate-boot.js` via `measure-first-tap.mjs --with-preview` | 0 | Median 0.81 s over three cold loads; budget 3.0 s. |
| headed first tap | `$env:TAP_HEADED='1'; $env:TAP_INERT_IDLE='1'; node scripts/measure-first-tap.mjs --with-preview --json --warm-aware --samples 10` | 0 | 50 cold / 0 warm; 10 samples per game; worst cold 300.2 ms <= 400 ms. |

The configured gate was run as one exact chain and exited 0. It was rerun on the
final release-note/evidence tree after the Release Verification refresh and again
exited 0 with the same suite, coverage, build and guard figures. The PowerShell
environment-variable form above is the exact equivalent of the documented
`TAP_HEADED=1 TAP_INERT_IDLE=1 node ...` command on this Windows host.

## Headed Cold-Control Evidence

Aggregate nearest-rank p95: response 75.1 ms, chunk finished 45.0 ms, first-frame
total 265.9 ms. Cold median total: 192 ms.

| Game | Samples | p95 response | p95 finished | p95 total | Worst total |
| --- | ---: | ---: | ---: | ---: | ---: |
| Shape Sorter | 10 | 65.0 ms | 34.9 ms | 300.2 ms | 300.2 ms |
| Find the Letter | 10 | 45.4 ms | 33.4 ms | 254.5 ms | 254.5 ms |
| Find the Word | 10 | 93.7 ms | 54.3 ms | 193.9 ms | 193.9 ms |
| Add It Up | 10 | 75.1 ms | 45.0 ms | 161.1 ms | 161.1 ms |
| Memory Match | 10 | 75.9 ms | 39.9 ms | 266.9 ms | 266.9 ms |

The unchanged gate is worst cold total <= 400 ms; p95 remains report-only.
Raw data: `conductor/archive/20261125-release-v1-26-0/verification/first-tap-headed.json`.
The harness prints one trailing human-readable PASS line after its JSON. Exact
stdout is preserved in `first-tap-headed.stdout.txt`; the parseable JSON and the
trailing line are also separated into `.json` and `.log` without changing any
measurement.

## Container and Header Evidence

- Fresh image: `sha256:21d3b670ea56da854febaf90f999cbf62c55781e23727e312a20d3582f960b8b`.
- All seven probed route classes carried CSP, nosniff, no-referrer and the deny list.
- The validator records a pre-existing quirk: a missing hashed asset returns 404 with immutable cache headers. It is unchanged and out of scope.

## Acceptance Coverage

| ID | Status | Evidence |
| --- | --- | --- |
| AC-2 | covered | Notes cover PRs #94–#98 in merge order and cite measured local, CI, tag, deploy and live results; device coverage remains an accepted gap. |
| AC-5 | pass | Exact gate and all local release checks above. |
| AC-6 | pass | PR run `45540144729` and tag run `45541584364`: Quality Gates, both Browser Journeys shards and rollup passed. |
| AC-7 | accepted gap | Owner selected “Skip — accepted gap”; no physical-device result is claimed. |
| AC-8 | pass | Strict review passed in round 3 with F1–F5 closed; owner-approved PR #99 merged as `3c0cef4a`. |
| AC-9 | pass | Owner authorized tag/deploy; `v1.26.0` CI and Coolify passed; live shell hash/version matched the local build. |
| AC-10 | pass | Release diff contains only package version, release docs, roadmap truth and Conductor state/evidence; no runtime/dependency/asset/schema change. |

## Subagent Permission Fallback

The phase subagent committed blocker reports `3d27585b` and `428db16c` after its
restricted shell denied the port preflight and exact full gate. The primary ran
the preflight (no listeners on 4173/8080), the exact full gate, Docker build,
header validation and headed measurement directly. Those primary-owned results
are the evidence for Phase 3; the subagent's blocked reports are preserved in
history and superseded by `verification/phase-3.md`.

## Review Revalidation

Before review, stale Phase 3 wording and a forward archive-path reference were
corrected. One exact-gate run failed only at `validate-docs.js` because the
validator checks inline code paths as well as Markdown links; the forward path
was removed. The exact gate then passed twice on the corrected release tree.
Across repeated coverage runs, statements ranged from 97.08% to 97.10% and
branches from 90.92% to 90.96%; functions stayed 96.35% and lines 98.23%. The
release notes record that measured range rather than implying false precision.

## Post-review Revalidation

After strict-review fixes R1 and R2, the exact configured gate passed again at
`9b323276` and `67fb29b5`. No non-Conductor file changed after the verified fix
head. The reviewer independently reran documentation validation at final head
`fe63ee15` (5/5), confirmed clean whitespace and returned PASS in round 3 with
F1–F5 closed and no new findings. Post-review doc sync found no living-document
change necessary; CI, device, tag, deploy and final notes remain assigned to
their explicit later gates.

## Release Verification

- PR #99 run `45540144729`: Quality Gates, Browser Journeys shard 1, shard 2 and rollup passed.
- Owner approved merge; PR #99 merged as `3c0cef4a63a779132370fb8ec056a7be55bc56ea`, and the release branch was cleaned up.
- Owner approved tag/deploy; annotated tag `v1.26.0` was pushed on the merged commit and never moved.
- Tag run `45541584364`: Quality Gates, both Browser Journeys shards, rollup and Deploy to Coolify passed.
- Live URL `https://aby-little-lab.ansyar-world.top/` returned HTTP 200 and served `index-0f9hfHo0.js` byte-identical to the local build (SHA-256 `c4cbae0f83550bde1bf66fe186581d219aa62fe512be31fc80e356b5a46e652e`) with `1.26.0` present.
- Targeted physical-device smoke was skipped as an accepted gap; no device or non-Chromium coverage is claimed.
- `docs/release-notes-v1.26.0.md` is FINAL; the post-tag docs/Conductor-only finalization procedure was followed.

## Evidence Paths

- `conductor/archive/20261125-release-v1-26-0/verification/phase-3.md`
- `conductor/archive/20261125-release-v1-26-0/verification/first-tap-headed.json`
- `conductor/archive/20261125-release-v1-26-0/verification/first-tap-headed.stdout.txt`
- `conductor/archive/20261125-release-v1-26-0/verification/first-tap-headed.log`
- `docs/release-notes-v1.26.0.md` § Release Verification
