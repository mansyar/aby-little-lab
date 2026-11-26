# PR: docs(retention): define consented validation protocol

- **URL:** https://github.com/mansyar/aby-little-lab/pull/102
- **State:** open
- **Head:** 2974d430a2cddf8d0b3d87a1e613619944d080b7
- **Base:** master
## Summary

Adds a consent-first, documentation-only validation protocol for the retention proxy tracked as RM-4. It defines a 14-day minimum pilot with 1–2 consenting families, a local Day-7 proxy computed from paired Day-7 and close-out exports, a six-question parent interview guide, and strict privacy rules. It records the required no-data finding: **Protocol only — recruitment not executed.** No family was recruited, no export was read, and no field or production-retention result is claimed.

## Track links

- Track: `20261126-retention-proxy`
- Spec: `conductor/archive/20261126-retention-proxy/spec.md`
- Plan: `conductor/archive/20261126-retention-proxy/plan.md`
- Metadata: `conductor/archive/20261126-retention-proxy/metadata.json`
- Integrated verification: `conductor/archive/20261126-retention-proxy/verification/integrated.md`
- Review: `conductor/archive/20261126-retention-proxy/review.md`

## Phases

| Phase | Outcome | Checkpoint |
| --- | --- | --- |
| 1 — Protocol and privacy documentation | Verified | `c295715f` |
| 2 — Roadmap linkage | Verified | `675a810b` |
| 3 — Integrated verification and handoff | Verified | `ce3768da` |
| R1 — Review fixes (proxy computability) | Verified | `493c1ca` |
| R2 — Review state bookkeeping | Verified | `b0a0fd5` |
| R3 — Final evidence correction (owner-approved) | Verified | `6b7da23` |

## Requirements

- FR-1 protocol with 14-day minimum and 1–2 consenting families — covered.
- FR-2 local Day-7 proxy from existing Progress/export data, directional ≥40 % target — covered.
- FR-3 parent interview guide mapped to return/breadth/completion/barrier signals — covered.
- FR-4 no PII in committed files; raw evidence outside git — covered.
- FR-5 exact no-data finding — covered.
- FR-6 README index link — covered.
- FR-7 roadmap RM-4 and §10.9 linkage — covered.
- NFR-1 no runtime/source/test/dependency/asset/schema/storage change — covered.
- NFR-2 privacy/no telemetry preserved — covered.
- NFR-3 directional language and claim separation — covered.
- NFR-4 CRLF-aware whitespace and docs validation — covered.
- NFR-5 historical records preserved — covered.
- AC-1 through AC-8 — all pass.

## Verification

- Exact configured gate passed: 158 files / 3,406 tests; coverage 97.09 % statements, 90.93 % branches, 96.35 % functions, 98.23 % lines; 491 modules; PWA 16/16; docs 5/5.
- `node scripts/validate-docs.js`: 5 passed, 0 failed.
- `git -c core.whitespace=cr-at-eol diff --check`: exit 0.
- Scope audit: only `README.md`, `docs/retention-validation.md`, `conductor/roadmap.md`, and Conductor track state changed. No runtime, test, dependency, lockfile, asset, schema, or storage change.

## Review

Strict review passed in round 4. Four findings were closed: F1 proxy computability, F2 metadata task count, F3 R2 evidence scope claim, and F4 R2 head-commit provenance. R3 exceeded the original two-fix-round cap with explicit owner approval. No overrides remain.

## Deviations and risks

- Protocol-only by design: recruitment, interviews, and export reads are not executed.
- The proxy is a conservative observed-span stand-in, not a true first-play return rate; the roadmap's retention question stays open.
- No physical-device, production-retention, statistical-significance, iOS Safari, Android Chrome, or Fire tablet claim is made.

## Follow-ups

- The actual real-family pilot remains a separate human decision. No GitHub issue is filed by this track.

## Rollback

Revert the PR and its documentation changes. No data migration or runtime state is involved.
