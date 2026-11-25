# Phase R1 Verification — Review fixes for F1

- **Track:** `20261126-retention-proxy`
- **Phase:** R1 — Review fixes for F1
- **Date:** 2026-11-26
- **Branch:** `chore/20261126-retention-proxy`
- **Phase base:** `f757b3c624e0c0b64c58e577c433d21d678d8f24`
- **Head commit (F1 fix):** `53657e4f14abad14f3b22014a26dda4b67173fd5`
- **Head commit (evidence):** `493c1ca352703e927ba20424a5d5370a1e833d2b`

## Result

**Verified.** The F1 documentation fix is committed and the primary reran the
exact configured gate and CRLF-aware whitespace check verbatim against the final
head; both exited 0. The executor's shell had denied those two commands and
reported them without retry or workaround, as required.

## Commands

| Layer | Command | Result | Notes |
| --- | --- | --- | --- |
| documents | `node scripts/validate-docs.js` | Pass | Executor run: 5 passed / 0 failed. Primary rerun inside exact gate: 5 passed / 0 failed. |
| whitespace | `git -c core.whitespace=cr-at-eol diff --check` | Pass | Executor shell denied it; primary rerun verbatim: exit 0, no diagnostics. |
| full gate | `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js` | Pass | Primary rerun at final head: exit 0; raw log `.conductor/evidence/phase-R1/gate.log`. |

Primary gate figures: Biome 375 files; app/E2E typechecks passed; unit and
coverage runs each 158 files / 3,406 tests; coverage 97.09 % statements, 90.93 %
branches, 96.35 % functions, 98.23 % lines; 491 modules; shell `index-CzNKiaF1.js`
199.96 kB raw / 51.15 kB gzip / 195.3 kB guarded; module guard 172 TypeScript
files with zero warnings; 319 SVGs; PWA 16/16 with 52 chunks / 64 precache
entries; docs 5/5. Only warning was the pre-existing Phaser vendor chunk above
500 kB.

## F1 closure evidence

Review finding F1 (High) said the Day-7 proxy required a first-play day and a play
seven calendar days later, but the app stores no first-play field and prunes
`activity` to today plus six prior days, so a single Day-7 export cannot supply
the inputs. The fix is documentation-only; no runtime code, test, dependency,
asset, schema, storage, telemetry, or network file changed.

| Required fix | Where | Evidence |
| --- | --- | --- |
| Consent covers two local backup exports plus the interview; Step 4 is preliminary; Step 5 computes the final proxy from the pair; withdrawal deletes both copies. | `docs/retention-validation.md` §2 | Step 2 lists three evidence sources; Step 4 is "Day-7 export (preliminary)" with no proxy value; Step 5 adds the close-out export and computes the proxy from the pair; Step 6 deletes both export copies. |
| Proxy redefined with inputs obtainable from the pair. | `docs/retention-validation.md` §3 | Defines *observed play day* as an `activity` day with `plays > 0`; `E` as the earliest observed play day across both exports (conservative stand-in, not a true first-play day); `R` as a later observed play day in the close-out export with `R − E >= 7` calendar days; a return only when such an `R` exists in the observation window; `lastPlayedAt` as corroboration only; proxy = eligible profiles with a return / eligible profiles with readable paired exports, excluding incomplete, withdrawn, unreadable, and single-export cases. |
| State the seven-day activity-pruning limit; remove the one-export "true seven-day return" claim; keep the no-new-counter statement with the clarification. | `docs/retention-validation.md` §3 | "Activity-window limit" paragraph states pruning to today + six prior days and that one export cannot span a seven-day gap; the return definition now requires the pair; the no-new-counter/event/timestamp statement is retained with "every input below is an existing exported field." |
| Privacy rules refer to both raw exports; pluralize where needed. | `docs/retention-validation.md` §§1, 5 | §1 lists two exports plus the interview; §5 rule 2 covers both exports, rule 3 covers sharing either export, rule 4 deletes both copies on withdrawal; incomplete-case wording in §2 is pluralized. |
| Finding keeps the exact phrase and adds that no export was read. | `docs/retention-validation.md` §6 | **Protocol only — recruitment not executed.** retained verbatim, with "no Day-7 or close-out backup export was read for this track." |
| Phase 1 evidence gains a field-by-field self-check and a corrected AC-2 reviewed-status note, preserving original facts and commits. | `conductor/tracks/20261126-retention-proxy/verification/phase-1.md` | New "Proxy input self-check (added in R1)" table maps `activity[].day` / `activity[].plays`, `lastPlayedAt`, calendar arithmetic, and pair eligibility to existing exported fields; AC-2 now reads "Reviewed — F1 fixed in R1 (Phase 1 status was overstated)"; original dates, commands, numbers, evidence paths, and commit history are unchanged. |

## Acceptance criteria

| AC | Requirement | Evidence | Status |
| --- | --- | --- | --- |
| F1 | Day-7 proxy computable from collectible exports | `docs/retention-validation.md` §§2–3, §5–6; fix table above | Closed |
| AC-2 | Day-7 proxy, at least 40 % target, and source link documented as directional | `docs/retention-validation.md` §3; `verification/phase-1.md` self-check | Pass |
| NFR-4 | CRLF-aware whitespace check and docs validation | docs 5/5 pass; whitespace exit 0 | Pass |

## Scope statement

The committed F1 fix touches only `docs/retention-validation.md` and the Phase 1
evidence file. This evidence file is the only other phase output. No runtime
source, test, dependency, lockfile, asset, schema, storage, telemetry, or network
file changed, and no validator or gate was weakened.

## Deviations

- **Primary verification fallback:** the executor's shell denied the exact gate
  and CRLF-aware whitespace commands. It reported them without retry or
  workaround; the primary reran both verbatim and records the results above.

## Notes

- No family was recruited, contacted, or interviewed; no Day-7 or close-out
  export was read; no field result, observed Day-7 value, production-retention
  figure, physical-device coverage, or statistical significance is claimed.
- The revised proxy is a conservative observed-span stand-in, not a true first-play
  return rate; the roadmap's retention question remains open.
