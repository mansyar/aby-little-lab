# Phase 5 Verification — Pre-authorized tag, deploy and final notes

- **Status:** verified
- **Track:** `20261127-release-v1-27-0`
- **Approval:** owner selected “Pre-authorize with gates” at specification time.
- **Merged PR:** https://github.com/mansyar/aby-little-lab/pull/106
- **Merge commit:** `019a26cdb3aea11f41b92d02af37374101b57b58`
- **Verified:** 2026-11-27T16:44:43+11:00

## Commands and results

| Command / check | Result |
| --- | --- |
| `git fetch origin master`; verify local and remote HEAD | exit 0; both `019a26cdb3aea11f41b92d02af37374101b57b58` |
| Package version and tag-collision preflight | `package.json` `1.27.0`; no local or remote `v1.27.0` |
| Master-push CI `45945994148` | success before tag creation; Quality Gates and all Browser Journeys jobs passed |
| `git tag -a v1.27.0 -m "Release v1.27.0" 019a26cd...` | exit 0; tag object `5d1884a4d2312e8dc47e92aa80cd2f96eaefc4d1`, target `019a26cd...` |
| `git push origin v1.27.0` | exit 0; immutable annotated tag published |
| Tag CI `45946816085` | success; Quality Gates, both Chromium shards, WebKit, Firefox, mobile Chromium, Browser Journeys rollup and Deploy to Coolify passed |
| Live URL with release query/cache-buster | HTTP 200; title `Aby's Little Lab`; shell `/assets/index-DF9s1m1B.js` |
| Remote/local shell SHA-256 | both `E5EFBFB3F9D14B53C9C1470B6013E41FAC60C39B21DB0B12CF8BD17F41AC9100`; exact match |
| Served shell version | contains `1.27.0` |
| `sw.js` and `manifest.webmanifest` | HTTP 200; service worker names `index-DF9s1m1B.js` |
| Post-finalization document validation | `node scripts/validate-docs.js` — 5 passed / 0 failed |
| Post-finalization whitespace validation | `git -c core.whitespace=cr-at-eol diff --check` — exit 0 |

## Requirements

| Requirement | Evidence |
| --- | --- |
| FR-10 / AC-10 | Merged-master preflight, immutable annotated tag, green tag CI and successful Coolify webhook job are recorded above. |
| FR-11 / AC-11 | Live HTTP/title/version/hash/service-worker/manifest checks passed; FINAL release notes now record the shipped state. |
| NFR-6 | No tag was moved or recreated; all post-tag changes are documentation/Conductor state only. |
| NFR-7 | Physical-device smoke is **SKIPPED — accepted gap**; emulated/local evidence is not represented as hardware coverage. |

## Device policy

- Physical iOS Safari, Android Chrome and Fire tablet smoke, install, offline, audio and first-tap checks were not run.
- Policy was recorded before tag creation at `.conductor/evidence/device-policy-v1-27-0.md`.
- No physical-device, production-retention or longitudinal band-movement claim is made.

## Finalization

- `docs/release-notes-v1.27.0.md` is FINAL with tag, merge, CI, deploy, live and device-gap evidence.
- Post-tag documentation change is limited to `docs/release-notes-v1.27.0.md`; README and perf-baseline remain at the reviewed release-PR state under the plan's docs/Conductor-only exception.
- Archived release evidence links now resolve under `conductor/archive/20261127-release-v1-27-0/`.
- Post-tag finalization changes documentation and Conductor state only; tag `v1.27.0` still targets `019a26cd`.

## Deviations and blockers

- Deviations: none.
- Blockers: none.
