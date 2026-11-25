# Review: Confirm the retention proxy with a handful of real families

- **Track:** `20261126-retention-proxy`
- **Type:** `chore`
- **Branch:** `chore/20261126-retention-proxy`
- **Range:** `5b9995f07aeeaccbd95221aebf327807f97d0ae0..dd6551f126f260b6ea0a8c6c7066052b0eae1c71`
- **Date:** `2026-11-26T10:58:00+11:00`
- **Verdict:** `BLOCK`

## Summary

The change is documentation/Conductor-only and most of the protocol is sound: the
roadmap links, README index row, interview guide, privacy rules, no-data finding,
and claim boundaries are accurate. One High finding blocks: the Day-7 return
proxy is defined from a first-play day and a play at least seven days later, but
the app's existing Progress/export shape has no first-play field and its activity
history is pruned to seven days. A single Day-7 export cannot supply the inputs
the formula requires, so FR-2/AC-2 are not yet verifiable and the §3 data-source
claim is false. Strict mode requires a fix before PR.

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| test | `pnpm test -- --run` | pass | Primary exact gate at `ce3768da`: 158 files / 3,406 tests; `verification/integrated.md` |
| coverage | `pnpm test:coverage` | pass | 97.09 % statements, 90.93 % branches, 96.35 % functions, 98.23 % lines |
| lint | `pnpm check` | pass | Biome checked 375 files, no fixes |
| typecheck | `pnpm typecheck` | pass | App and E2E typechecks passed |
| build | `pnpm build` | pass | 491 modules; shell `index-CzNKiaF1.js` 199.96 kB raw / 51.15 kB gzip / 195.3 kB guarded |
| validators | `node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js` | pass | Module guard 172 TS files zero warnings; 319 SVGs; PWA 16/16; docs 5/5 |
| whitespace | `git -c core.whitespace=cr-at-eol diff --check` | pass | Primary rerun exit 0 |
| scope | `git diff --name-status 5b9995f0..HEAD` | pass | Only `README.md`, `docs/retention-validation.md`, and Conductor-state files |

The non-Conductor tree at review head is byte-identical to gated head `ce3768da`
(`git diff --quiet ce3768da..HEAD -- . ':!conductor'` exit 0).

## Requirements

| ID | Implemented by | Verified by | Status |
| --- | --- | --- | --- |
| FR-1 | P1.T1 | `docs/retention-validation.md` §2; `verification/phase-1.md` | covered |
| FR-2 | P1.T2 | `docs/retention-validation.md` §3; `verification/phase-1.md` | partial — F1 |
| FR-3 | P1.T3 | `docs/retention-validation.md` §4 | covered |
| FR-4 | P1.T3 | `docs/retention-validation.md` §5 | covered |
| FR-5 | P1.T3 | `docs/retention-validation.md` §6 | covered |
| FR-6 | P1.T4 | `README.md:280`; docs validator 5/5 | covered |
| FR-7 | P2.T1, P2.T2 | `conductor/roadmap.md:32`, `conductor/roadmap.md:203`; `verification/phase-2.md` | covered |
| NFR-1 | P3.T3 | Scope audit in `verification/integrated.md` | covered |
| NFR-2 | P1.T3 | `docs/retention-validation.md` §5 | covered |
| NFR-3 | P1.T2, P1.T3 | `docs/retention-validation.md` §§3, 6 | covered |
| NFR-4 | P3.T2 | Docs 5/5; CRLF-aware whitespace exit 0 | covered |
| NFR-5 | P2.T1, P2.T2 | Roadmap diff: only RM-4 cell and §10.9 cell changed | covered |
| AC-1 | P1.T1 | `docs/retention-validation.md` §2 | pass |
| AC-2 | P1.T2 | `docs/retention-validation.md` §3 | partial — F1 |
| AC-3 | P1.T3 | Interview guide six-question table | pass |
| AC-4 | P1.T3 | Privacy rules §5 | pass |
| AC-5 | P1.T3 | Exact no-data finding §6 | pass |
| AC-6 | P1.T4 | `README.md:280`; docs validator 5/5 | pass |
| AC-7 | P2.T1, P2.T2 | `conductor/roadmap.md:32`, `conductor/roadmap.md:203` | pass |
| AC-8 | P3.T1–P3.T3 | `verification/integrated.md`; scope audit | pass |

## Findings

### Critical

- <none>

### High

- **F1 — Day-7 proxy is not computable from the specified export**
  - **File:** `docs/retention-validation.md:59-70`
  - **What:** The proxy needs a "first recorded play day" and a play at least seven calendar days later. `GameProgress` (`src/types/index.ts:42-66`) stores only cumulative counters, `lastPlayedAt` (most recent play), and `recent`; `DayActivity` is `{day, plays}` and is pruned to today plus six prior days (`docs/TDD.md:908`). At the Day-7 read the export spans at most six calendar days between its earliest and latest activity entries, and the roadmap §10.3 already says a return rate needs a longer history than a profile holds. The §3 claim that no new counter, event, or timestamp is introduced is therefore false for the stated formula.
  - **Why:** FR-2 requires a proxy defined from existing on-device Progress/export data. As written the formula cannot be evaluated from the single export the protocol collects, so the protocol is not executable and the Phase 1 AC-2 "Verified" status overstates the deliverable.
  - **Fix:** Redefine the proxy using inputs obtainable from paired Day-7 and Day-14 close-out exports: take the earliest observed play day with `activity.plays > 0` across both exports as a conservative stand-in for first play, and a later observed play day at least seven calendar days after it from the close-out export as the return. State the seven-day activity pruning limit explicitly, remove the claim that a true seven-days-since-first-play return comes from one Day-7 export, update §2 steps 4/5 and the evidence-source wording, and update Phase 1 evidence AC-2 with a field-by-field self-check against `GameProgress`/`DayActivity`.
  - **Requirement:** FR-2 / AC-2
  - **Test gap:** Docs-only; add a protocol self-check in `verification/phase-1.md` tracing each proxy input to the exported fields.

### Medium

- <none>

### Low

- <none>

## Overrides

- <none>

## Plan compliance

All three planned phases are verified with result, checkpoint, and evidence lines;
tasks P1.T1–P3.T3 are checked. The diff stays within the union of phase `Touches`
(`docs/retention-validation.md`, README index, roadmap cells, and track evidence).
Phase 1 AC-2 verification is nevertheless overstated because the implemented
formula is not computable from the documented source; this is F1.

## Out of scope

- <none>

## Debt

- <none>

## Doc sync

`pending` — no post-review documentation sync has occurred yet.

## History

| Round | Verdict | Critical | High | Medium | Low | Fixed |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | BLOCK | 0 | 1 | 0 | 0 | 0 |
