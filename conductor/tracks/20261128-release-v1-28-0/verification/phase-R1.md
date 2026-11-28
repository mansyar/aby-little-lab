# Phase R1 Verification - Release v1.28.0 review fix

- Track: `20261128-release-v1-28-0` — Release v1.28.0
- Phase: R1 — Resolve strict-review documentation finding F1 (Low)
- Date: 2026-11-28
- Branch: `chore/20261128-release-v1-28-0`
- Phase base: `64cdb652` (start of review fix round 1)
- Result: **verified** — both README v1.28.0 entries now distinguish completed local candidate verification from pending CI/tag/deploy/live work; docs and static checks pass.

## Reviewer finding resolved

F1 (Low): `README.md:241` and `README.md:292` said `candidate verification pending` even though the local full gate, the headed cold first tap (50 cold / 0 warm, worst 273.2 ms) and the local browser matrix (60/60) passed. Both entries now state that the candidate is verified locally, that CI/tag/deploy/live verification is pending, that no shipped version is claimed, and that physical-device smoke remains an accepted gap. DRAFT status, all PR highlights, links, version, date, the Tag `pending` value and the `SKIPPED — accepted gap` wording are retained.

| Location | Before | After |
| --- | --- | --- |
| Releases row (`README.md:241`) | `DRAFT — candidate verification pending; no CI, tag, deploy or live result claimed; physical-device smoke remains \`SKIPPED — accepted gap\`.` | `DRAFT — candidate verified locally; CI, tag, deploy and live verification pending; no shipped version claimed; physical-device smoke remains \`SKIPPED — accepted gap\`.` |
| Documentation link (`README.md:292`) | `candidate verification pending; no CI, tag, deploy or live result claimed; physical-device smoke recorded as an accepted gap` | `candidate verified locally; CI, tag, deploy and live verification pending; no shipped version claimed; physical-device smoke recorded as an accepted gap` |

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| documents + static | `node scripts/validate-docs.js && pnpm check` | 0 | `validate-docs` 5 passed / 0 failed (index complete, relative links/anchors resolve, GAME_REGISTRY agreement, no broken Conductor paths, living suite truth); `pnpm check` → Biome clean, 393 files checked, no fixes applied. |

The primary runs the full ten-command `verify_phase` gate independently after this report.

## Acceptance / task matrix

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| R1.T1.1 | Reword README lines 241 and 292 to say local candidate verification passed while CI/tag/deploy/live remain pending; retain DRAFT and `SKIPPED — accepted gap`. | `git diff -- README.md` shows only the two status clauses changed; highlights, links, version, date and Tag `pending` intact. | pass |
| R1.T2.1 | Run `node scripts/validate-docs.js && pnpm check` and record results. | Commands table above; 5/0 and Biome clean. | pass |

## Files changed

- `README.md` — two v1.28.0 status clauses corrected.
- `verification/phase-R1.md` — this evidence record.

## Deviations

None. Both touched files are inside the phase `Touches` set; no Conductor state, release notes, perf baseline, runtime code, asset, dependency or other file was edited.

## Notes

- Documentation-only fix; no TDD test required, per the brief.
- No shipped version is claimed and the release stays DRAFT. Physical-device smoke remains `SKIPPED — accepted gap`; emulated browser journeys and headed first-tap evidence are local candidate facts only.
- No shell command was denied; no retries, rephrasing, splitting or workarounds were needed.
