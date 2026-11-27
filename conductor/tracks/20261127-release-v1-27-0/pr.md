# PR — chore(release): ship v1.27.0

## Summary

Ship `v1.27.0` as a minor release for the two parent-visible features merged since `v1.26.1`: signature content variants now reach real playthroughs (PR #104), and the Progress Overview shows the current adaptive-band spread for the 22 adaptive games (PR #105). PRs #102 and #103 are included as internal retention-protocol/pilot-pack documentation and are explicitly labeled unexecuted.

This is a version/docs-only release: no runtime source, tests, assets, dependencies, lockfile, schema, storage or network behaviour changed. The release notes remain `DRAFT`; tag, deploy, live verification, FINAL notes and the ship-time device policy are gated on later phases.

## Track

- **ID:** `20261127-release-v1-27-0`
- **Type:** `chore`
- **Spec:** [`conductor/archive/20261127-release-v1-27-0/spec.md`](conductor/archive/20261127-release-v1-27-0/spec.md)
- **Plan:** [`conductor/archive/20261127-release-v1-27-0/plan.md`](conductor/archive/20261127-release-v1-27-0/plan.md)
- **Review:** [`conductor/archive/20261127-release-v1-27-0/review.md`](conductor/archive/20261127-release-v1-27-0/review.md)
- **Integrated verification:** [`conductor/archive/20261127-release-v1-27-0/verification/integrated.md`](conductor/archive/20261127-release-v1-27-0/verification/integrated.md)
- **Draft release notes:** [`docs/release-notes-v1.27.0.md`](docs/release-notes-v1.27.0.md)

## What happened

| Phase | Goal | Result | Checkpoint | Notes |
| --- | --- | --- | --- | --- |
| 1: Version metadata and DRAFT notes | Establish `1.27.0` and truthful notes | verified | `8f1134ae` | Equivalent one-field version edit after `pnpm version` was permission-denied; frozen install proved no lockfile drift |
| 2: README and release documentation truth | Correct release row/index and current game count | verified | `a626fca1` | Historical release rows and notes preserved |
| 3: Release-candidate verification | Prove the exact candidate and refresh living truth | verified | `74c1618e` | Full gate, frozen install, boot/headers, headed first tap, browser matrix and scope proof recorded |
| 4: Strict review, PR and merge gate | Review, open PR, require CI, merge only with approval | review PASS; PR/CI in progress | — | No findings; explicit merge decision still required |
| 5: Pre-authorized tag, deploy and final notes | Ship only after every tag/deploy/live precondition | pending | — | Starts only after merge and tag preflight; tag is immutable once pushed |

## Requirements

`FR-1`–`FR-7`, `NFR-1`–`NFR-4`, `NFR-6`–`NFR-7`, `AC-1`–`AC-6` and `AC-11` are covered by the current candidate. `FR-8`–`FR-11`, `NFR-5`, `AC-7`–`AC-10` are intentionally partial at PR time and map to the remaining Phase 4/5 gates in [`review.md`](conductor/archive/20261127-release-v1-27-0/review.md).

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| lint/typecheck | `pnpm check && pnpm typecheck` | pass | Biome 378 files; app + E2E TypeScript clean |
| unit | `pnpm test -- --run` | pass | 159 files / 3,454 tests |
| coverage | `pnpm test:coverage` | pass | 97.12% statements / 91.05% branches / 96.4% functions / 98.25% lines; all thresholds exceeded |
| build/artifacts | `pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js` | pass | 493 modules; shell `index-DF9s1m1B.js` 196.3 kB guarded / 51.54 kB gzip; module-size zero warnings; textures pass; PWA 16/0 |
| docs | `node scripts/validate-docs.js` | pass | 5 passed / 0 failed; reviewer independently reran it |
| install | `pnpm install --frozen-lockfile` | pass | Lockfile current; no drift |
| boot/headers | `node scripts/validate-boot.js`; candidate Docker build; `node scripts/validate-headers.js` | pass | Boot median 0.40 s; strict headers 28/0 |
| headed first tap | `$env:TAP_HEADED='1'; $env:TAP_INERT_IDLE='1'; node scripts/measure-first-tap.mjs --with-preview --json --warm-aware --samples 10` | pass | 50 cold / 0 warm; 10 per game; worst cold 283.8 ms ≤400 ms; raw JSON/stdout committed |
| browser matrix | Chromium, WebKit, Firefox, mobile Chromium sequentially | pass | 26/26, 8/8, 8/8, 8/8; 50/50 first attempt; zero local retries; emulation only |
| whitespace/scope | `git -c core.whitespace=cr-at-eol diff --check` | pass | No output; five non-Conductor files changed, no runtime/schema/dependency impact |

Fresh PR CI remains authoritative for Quality Gates, both Chromium shards, all three engine jobs and the `Browser Journeys` rollup. `Deploy to Coolify` is expected to skip on this non-tag PR.

## Review

- **Verdict:** `PASS`
- **Rounds:** 1
- **Fixed:** 0 findings
- **Accepted/deferred:** 0 findings
- **Overrides:** none

The reviewer's three permission-denied read-only confirmations were run unchanged by the primary: HEAD, branch and ranged whitespace all matched expectations. Strict mode required no fix phase.

## Deviations and risks

- Phase executors' shell denied several configured/heavy commands. The primary ran each exact command unchanged; no gate was retried, split, rephrased or weakened.
- Coverage instrumentation varied between identical-code runs (97.11/91.01 and 97.12/91.05). Both exceed every threshold and TDD records the variance.
- Heavy measurements were taken at pre-squash snapshot `65fe7286`; final checkpoint `74c1618e` has identical runtime/package bytes and differs only in docs/evidence. The evidence labels this provenance explicitly.
- Physical-device smoke remains a ship-time gate. No iOS Safari, Android Chrome or Fire tablet pass is claimed, and no retention or longitudinal-band result exists.
- Tag/deploy authorization is conditional on merge, clean tag preflight, green required CI, Coolify success and live URL/build/version/hash verification. The published tag must never be moved.

## Follow-ups

- After explicit merge, execute Phase 5: record `SKIPPED — accepted gap`, preflight and push immutable `v1.27.0`, require tag CI/Coolify/live verification, then finalize notes and archived ship evidence.
- Physical-device validation remains a separate manual gate; retention protocol/pilot execution remains unstarted.

## Rollback

Before tagging, revert this release PR through review. After tagging/deploying, use a reviewed revert and cut a patch release; never move, delete or recreate `v1.27.0`. No user-data rollback is needed because there is no storage migration or schema change.

```bash
# After merge, revert the merge commit rather than rewriting history
git revert --no-edit -m 1 <merge-commit>

# Or revert the release checkpoints individually if needed
git revert --no-edit 74c1618e
git revert --no-edit a626fca1
git revert --no-edit 8f1134ae
```
