# PR #101 — chore(release): ship v1.26.1

- **URL:** https://github.com/mansyar/aby-little-lab/pull/101
- **State:** open
- **Head:** 967210f3abc65b7266941683f32c2490f99d8985
- **Base:** master
## Summary

Ship `v1.26.1` as a patch release for the browser-matrix compatibility work merged in PR #100. The release packages WebKit, Firefox and mobile Chromium/touch smoke coverage, a blocking cross-engine `Browser Journeys` rollup, strict evidence validation, and three earlier smoke-proven portability fixes.

It also carries one narrowly scoped fix-forward: the post-merge master rerun `45595775568` went red because Firefox saw an unhandled `InvalidStateError: Navigated away from page` during the sticker-persistence reload. `AudioManager.resume()` and `AudioManager.close()` now swallow rejected promises with `.catch(() => {})`, matching the existing BGM play policy, with two regression tests. No console error is filtered and no assertion, threshold, sample count, retry setting or gate is weakened.

## Track links

- Track: `20261126-release-v1-26-1`
- [Specification](conductor/archive/20261126-release-v1-26-1/spec.md)
- [Implementation plan](conductor/archive/20261126-release-v1-26-1/plan.md)
- [Metadata](conductor/archive/20261126-release-v1-26-1/metadata.json)
- [Integrated verification](conductor/archive/20261126-release-v1-26-1/verification/integrated.md)
- [Strict review](conductor/archive/20261126-release-v1-26-1/review.md)
- [Draft release notes](docs/release-notes-v1.26.1.md)

## Phases

| Phase | Result |
|---|---|
| 1. Version metadata and DRAFT notes | verified |
| 2. README row, roadmap and archived-state truth | verified |
| 3. Release-candidate verification and fix-forward | verified |
| 4. Strict review, PR and merge | review PASS; PR/CI in progress |
| 5. Pre-authorized tag, deploy and FINAL notes | pending explicit merge and tag preconditions |

## Requirements

FR-1…FR-12, NFR-1…NFR-7 and AC-1…AC-12 are mapped in `review.md`. CI, merge, tag, deploy and final notes are intentionally partial at PR time and are gated by later phases. The sole runtime exception to the release-only rule is the two-line AudioManager fix-forward authorized after the reproduced post-merge CI failure.

## Verification

- Exact configured gate: pass — 158 files / 3,406 tests; coverage 97.08% statements / 90.89% branches / 96.35% functions / 98.23% lines; 491 modules; shell `index-CzNKiaF1.js` 195.3 kB guarded; 172 TypeScript files with zero module-size warnings; 319 SVGs; PWA 16/16; docs 5/5.
- `pnpm install --frozen-lockfile`: pass, no lockfile drift.
- Focused AudioManager regression: 1 file / 93 tests pass.
- Boot: median 0.85 s over three cold loads against the 3.0 s budget.
- Docker image headers: 28/28 pass on the current release candidate.
- Headed first tap: 50 cold / 0 warm, exactly 10 samples per target game; aggregate p95 58.4 / 37.6 / 332.3 ms; worst cold total 383.8 ms (Memory Match), below the unchanged 400 ms gate.
- Local browser matrix: Chromium 26/26, WebKit 8/8, Firefox 8/8, mobile Chromium 8/8, all with zero local retries; roster 50 tests / 20 files.
- CRLF-aware whitespace: pass.

PR CI is the authoritative gate for Quality Gates, both Chromium shards, all three engine jobs and the `Browser Journeys` rollup. `Deploy to Coolify` is expected to skip on a non-tag PR.

## Review

Strict review passed in round 1 with no findings after the primary reran the reviewer's two denied checks. No overrides. Post-review doc sync is complete with no additional living-document change.

## Deviations and risks

- Physical-device smoke is `SKIPPED — accepted gap`; no iOS Safari, Android Chrome, Fire tablet or production-retention result is claimed.
- The fix-forward adds two source lines and two regression tests after a reproduced red master CI check. It is included in this reviewed PR and must be proven by fresh green PR CI.
- The immutable `v1.26.1` tag is pre-authorized only after merge, tag preflight and green tag CI. The tag will never be moved.

## Follow-ups

- Tag `v1.26.1` only after this PR merges, tag preflight passes, and required CI is green; then verify Coolify and the live asset hash/version.
- Finalize the release notes through the documented docs/Conductor-only direct-to-`master` procedure.
- Physical-device validation remains a separate manual gate.

## Rollback

Before tagging: revert this PR through review and a new PR. After tagging/deploying: reviewed revert plus a new patch tag; never move or recreate `v1.26.1`. No save-data rollback is needed because there is no storage migration.
