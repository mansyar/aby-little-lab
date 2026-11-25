# PR: chore(ci): add browser compatibility matrix

- **URL:** https://github.com/mansyar/aby-little-lab/pull/100
- **State:** merged
- **Head:** 8524d33014acb4ca062a7896c760591655433489
- **Base:** master
- **Merge commit:** 859498a850f729294785453f5884c1915e4071c7
## Summary

Adds a repeatable browser compatibility matrix to the existing Playwright suite. WebKit, Firefox and a genuine mobile Chromium/touch project now run a focused six-file smoke on every code PR, while the full 26-test journey suite stays Chromium-only. The existing required `Browser Journeys` rollup now fails if any engine or Chromium shard fails, and a strict evidence helper rejects retried, flaky, skipped, unexpected or wrong-project reports.

Three smoke-proven portability defects were repaired: WebKit's missing `AudioContext`, Firefox's false-negative long-hold deadline, and a duplicate texture load when Hub prewarm raced game preload. No new runtime dependency, asset, save schema, game rule or runtime-network behavior was added. Engine emulation is documented as distinct from physical-device validation.

## Track links

- Spec: `conductor/archive/20261125-browser-matrix/spec.md`
- Plan: `conductor/archive/20261125-browser-matrix/plan.md`
- Metadata: `conductor/archive/20261125-browser-matrix/metadata.json`
- Integrated verification: `conductor/archive/20261125-browser-matrix/verification/integrated.md`
- Review: `conductor/archive/20261125-browser-matrix/review.md`

## Phases

| Phase | Result |
| --- | --- |
| 1 — Project topology and reusable smoke | verified at `409981a2` |
| 2 — CI matrix and blocking rollup | verified at `d29a0ca7` |
| 3 — Cross-engine execution and compatibility fixes | verified at `96801bf8` |
| 4 — Documentation and device-evidence policy | verified at `14fea5f6` |
| 5 — Integrated verification and handoff | verified at `76790f9f` |
| R1 — Final review mapping | verified at `d18d21c4` |

## Requirements

All FR-1 through FR-10 and NFR-1 through NFR-7 are implemented. AC-1 through AC-4, AC-6, AC-9, AC-10 and AC-11 are locally complete. AC-5, AC-7 and AC-8 have locally verified structure and require the authoritative PR CI run. Physical-device checks remain a separate manual release gate and are not claimed.

## Verification

| Layer | Result |
| --- | --- |
| Exact configured gate | pass: 158 files / 3,404 tests; coverage 97.08 / 90.89 / 96.35 / 98.23 |
| Build artifacts | 491 modules; shell 195.2 kB guarded; 172 TypeScript files zero warnings; 319 SVGs; PWA 16/16; docs 5/5 |
| Playwright roster | 50 tests / 20 files: Chromium 26/19; WebKit, Firefox and mobile Chromium 8/6 each |
| Chromium | 26 passed in 4.1m |
| WebKit | 8 passed in 1.8m |
| Firefox | 8 passed in 1.9m |
| Mobile Chromium | 8 passed in 2.3m |
| Local retries | zero |

Raw evidence is committed under the track's `verification/` directory; verbatim logs are under `.conductor/evidence/phase-1/` through `.conductor/evidence/phase-R1/`. Strict review passed in round 2 after one Low documentation-accuracy finding was fixed.

## Review

PASS after two rounds. Round 1 found one Low stale coverage claim in `docs/TDD.md`; Phase R1 corrected it and revalidated the exact gate. No Critical, High or Medium findings remain.

## Deviations and risks

- Several phase executors had shell commands denied; the primary ran the exact commands and recorded both the denial and the successful fallback. No command was worked around by weakening a check.
- The first Phase 5 fallback chain ended with a tool-level `Shell.NotFoundError` after WebKit's tests; WebKit was rerun cleanly and the other suites passed with exit 0.
- `conductor/tech-stack.md` retains its existing CRLF line endings; `git -c core.whitespace=cr-at-eol diff --check` is the policy-aware check.
- No physical-device, iOS Safari, Android Chrome or Fire tablet pass is claimed.

## Follow-ups

- PR CI must pass Quality Gates, both Chromium shards, all three engine jobs and the `Browser Journeys` rollup.
- Physical-device HTTPS/PWA install, landscape, offline relaunch and audio/first-tap checks remain a manual release gate.

## Rollback

Revert this PR with a reviewed revert and restore the pre-track Playwright topology, CI workflow and any affected compatibility fix. Do not disable an engine or weaken an assertion as a local workaround.
