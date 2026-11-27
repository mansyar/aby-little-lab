# Strict review — Release v1.27.0

- **Track:** `20261127-release-v1-27-0`
- **Round:** 1
- **Reviewed head:** `6005e9bfda8ec5dcf0e4cb2135d863151d437554`
- **Base:** `cf5f5a718133ace0e3d9fe055de29dbedf42107e`
- **Range:** `cf5f5a718133ace0e3d9fe055de29dbedf42107e..6005e9bfda8ec5dcf0e4cb2135d863151d437554`
- **Reviewer:** `conductor-reviewer` session `ses_de4a111b8ffeS890vPnKMfr73Z`
- **Verdict:** **PASS**
- **Reviewed at:** 2026-11-27T16:01:50+11:00

## Summary

The v1.27.0 candidate is a tightly scoped version/docs-only release. `package.json` moves to `1.27.0`; README, TDD, perf-baseline and the new DRAFT release notes carry measured candidate truth; all four merged PRs are described with the correct internal/parent-visible and retention boundaries. No runtime source, test, asset, dependency, lockfile, schema, storage or network behaviour changed.

The release notes remain `DRAFT` and do not claim a tag, deploy, live verification, physical-device pass, retention result or longitudinal band measurement. Historical release notes, dated performance records and archived tracks are unchanged. Strict review found no defects.

## Verification

- **Reviewer-run:** complete non-Conductor diff reviewed; scope and history checks pass; `node scripts/validate-docs.js` independently passed 5/0.
- **Primary exact configured gate:** exit 0; Biome 378 files; app/E2E TypeScript clean; Vitest 159 files / 3,454 tests; coverage 97.12% statements / 91.05% branches / 96.4% functions / 98.25% lines; Vite 493 modules; shell `index-DF9s1m1B.js` 196.3 kB via bundle guard / 51.54 kB gzip; module-size zero warnings; textures pass; PWA 16/0; docs 5/0.
- **Frozen install:** exit 0, lockfile up to date, no drift, supply-chain policy verified.
- **Boot and headers:** `validate-boot` exit 0, 766/377/397 ms and 0.40 s median; candidate Docker image built; strict headers 28 passed / 0 failed. The missing-hash immutable-404 behaviour is pre-existing and recorded.
- **Headed first tap:** exit 0; 50 cold / 0 warm, exactly 10 per game; aggregate cold p95 response/finished/total 78.5/61.1/256.4 ms; cold median 190.8 ms; worst cold 283.8 ms (Add It Up), inside the unchanged 400 ms gate. Raw JSON/stdout committed.
- **Local browser matrix:** Chromium 26/26, WebKit 8/8, Firefox 8/8, mobile Chromium 8/8; 50/50 first attempt, zero local retries, sequential. These are emulated local browsers, not physical-device evidence.
- **Whitespace and scope:** CRLF-aware ranged whitespace check exit 0; branch, HEAD and clean working tree confirmed; non-Conductor diff is five files, 117 insertions / 7 deletions.
- **Coverage variance:** identical-code coverage runs measured 97.11/91.01 and 97.12/91.05; both exceed all gates and TDD documents instrumentation variance.
- **Pending later gates:** fresh PR CI, explicit merge, immutable tag, tag CI/Coolify, live verification, FINAL notes and ship-time device policy. These are intentional later-phase work, not review debt.

## Requirements

| ID | Status | Evidence |
|---|---|---|
| FR-1 | covered | `package.json` version `1.27.0`; frozen install exit 0; no lockfile drift |
| FR-2 | covered | DRAFT notes cover PRs #102–#105 with correct caveats; FINAL remains Phase 5 |
| FR-3 | covered | README Documentation index, dated release row and 24-game/24-tile truth |
| FR-4 | covered | Notes/evidence distinguish local, emulated, device, retention and longitudinal boundaries |
| FR-5 | covered | Exact configured gate and frozen install recorded in integrated evidence |
| FR-6 | covered | Boot, headers, headed first tap, raw evidence and perf-baseline refresh |
| FR-7 | covered | Browser roster and 26/8/8/8 first-attempt matrix |
| FR-8 | partial | Strict review PASS; PR, CI and explicit merge remain in Phase 4 |
| FR-9 | partial | Ship-time `SKIPPED — accepted gap` policy remains Phase 5 work |
| FR-10 | partial | Pre-authorized tag/deploy/live/FINAL procedure remains Phase 5 work |
| FR-11 | partial | Tag immutability and post-tag finalization procedure documented; execution remains Phase 5 |
| NFR-1 | covered | Only version and release/living/Conductor documentation changed |
| NFR-2 | covered | No threshold, sample-count, validator or retry policy weakened |
| NFR-3 | covered | Measured release-state figures and explicit evidence boundaries |
| NFR-4 | covered | Historical notes, perf sections, browser records and archives preserved |
| NFR-5 | partial | Tag does not exist yet; immutability rule and preflight are planned |
| NFR-6 | covered | Rollback posture requires a reviewed revert plus patch release after deploy |
| NFR-7 | covered | CRLF-aware whitespace checks exit 0 |
| AC-1 | covered | Version `1.27.0`; frozen install clean |
| AC-2 | partial | DRAFT candidate notes verified; FINAL is gated on deploy |
| AC-3 | covered | README index and release row validated |
| AC-4 | covered | Exact full gate exit 0 with all figures recorded |
| AC-5 | covered | Boot/headers/first-tap pass; raw evidence committed; perf truth refreshed |
| AC-6 | covered | All four local browser projects pass first attempt with zero retries |
| AC-7 | partial | Review PASS; PR/merge CI and explicit approval remain Phase 4 |
| AC-8 | partial | Ship-time device verdict remains Phase 5 by design |
| AC-9 | partial | Tag/deploy/live/FINAL remain Phase 5 by design |
| AC-10 | partial | Published-tag immutability and rollback execution remain Phase 5; posture documented |
| AC-11 | covered | Current diff contains no runtime/asset/dependency/schema/storage change or unsupported claim |

## Findings

No Critical, High, Medium or Low findings. No overrides.

## Plan compliance

Phases 1–3 are verified with checkpoints `8f1134ae`, `a626fca1` and `74c1618e`; all 14 implementation tasks are complete. Phase 4 is correctly in progress with this review; Phase 5 is correctly pending. Every changed file stays inside its phase `Touches`. The executor shell-permission deviations were resolved by unchanged primary runs, and the pre-squash candidate SHA is now explicitly labeled as measurement provenance rather than current HEAD.

## Out of scope / debt

No debt. PR CI, explicit merge, tag/deploy/live verification, FINAL notes and the ship-time device verdict are intentional later-phase gates. No physical-device or retention execution was performed or claimed.

## Doc sync

Post-review doc sync is complete. The pre-review clarification commit `6005e9bf` labels the pre-squash candidate snapshot accurately; no further living-document change is required. The DRAFT notes and perf baseline already carry measured candidate figures and preserve all historical records.

## History

| Round | Verdict | Findings | Evidence |
|---|---|---|---|
| 1 | PASS | 0 | Reviewer session `ses_de4a111b8ffeS890vPnKMfr73Z`; head `6005e9bf`; `needs` resolved by primary confirmations |

CONDUCTOR_PROGRESS gate=review verdict=PASS round=1 findings=0 evidence=conductor/tracks/20261127-release-v1-27-0/review.md
CONDUCTOR_PROGRESS gate=doc-sync status=updated commit=6005e9bf living-doc-changes=none
