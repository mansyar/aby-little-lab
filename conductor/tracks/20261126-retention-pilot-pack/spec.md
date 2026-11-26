# Retention Pilot Pack — Specification

> Requirements are stable. Once an `FR`, `NFR`, or `AC` ID is approved, do not
> renumber it. If a requirement is removed, mark it `Withdrawn` instead of
> deleting it.

## Overview

This track turns the already-approved retention-proxy protocol in
`docs/retention-validation.md` into a blank, runnable paper pack: a recruitment
note, a consent form, a gitignored evidence layout, a 14-day checklist, a proxy
worksheet, and a non-identifying summary template. It is docs-only. The app is
not changed, no family is contacted, and no export or interview is read here.

## Problem / Motivation

The protocol records *how* a future pilot would run, but it ships no forms or
run-sheet. Without a pack, an operator would have to improvise consent language,
evidence handling, and day-by-day procedure — the exact place where personally
identifying information could enter git, or where a family could be contacted
before the study is ready. A portable pack makes the falsifiable procedure
executable without changing the product's privacy posture.

## Goals & Success Metrics

- **Goal:** the protocol becomes executable from one blank, non-identifying document without any app or infrastructure change.
- **Metric:** all six pack components are present; `node scripts/validate-docs.js` reports 5 passed / 0 failed; the diff contains only the intended docs and Conductor state; no identifier, contact detail, or raw evidence is added to a tracked file.

## Scope

### In Scope

- A new `docs/retention-pilot-pack.md` containing, in one document:
  - a status and no-data attestation;
  - a blank recruitment note;
  - a blank consent form;
  - a gitignored evidence layout with withdrawal deletion;
  - a 14-day execution checklist;
  - a proxy worksheet;
  - a non-identifying summary template.
- A link from `docs/retention-validation.md` §7 (Related documents) to the pack, and a link back to the protocol.

### Out of Scope

- Recruiting, contacting, or interviewing any family; reading any backup export.
- Storing personally identifying information in git or in any committed artifact.
- Changing runtime code, analytics, accounts, uploads, the save schema, network dependencies, assets, or PWA configuration.
- Releasing or bumping a version, adding a roadmap row, or requesting a physical-device test.

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | The pack states "Not run — no families contacted" and explicitly attests that no interview was held and no export was read. | must |
| FR-2 | The recruitment note states participation is voluntary, free, and unrelated to using the app; it targets 1–2 families; it uses the protocol's status tokens; all fields are blank. | must |
| FR-3 | The consent form is a blank template covering the 14-day window, the three evidence sources (Day-7 export, close-out export, parent interview), the privacy rules, withdrawal, and signature/date lines. | must |
| FR-4 | The evidence section names the gitignored `.conductor/evidence/` directory, states what may and may not be stored there, and specifies deletion of researcher-held copies on withdrawal. | must |
| FR-5 | The 14-day checklist covers Day 0 consent, the optional Day-7 export, Day 14 or later close-out, and the withdrawal and incomplete branches; it includes no instrumentation or prompting step. | must |
| FR-6 | The proxy worksheet defines `E` (earliest observed play day across both exports), `R` (a later observed play day in the close-out export at least seven calendar days after `E`), the eligible readable-pair denominator, the exclusion rules, and the ≥ 40 % figure as a directional benchmark only. | must |
| FR-7 | The summary template records counts by signal, a direction (higher / lower / mixed), and incomplete cases, with no field for a name, contact detail, exact age, device ID, photo, recording, or raw timestamp. | must |
| FR-8 | `docs/retention-validation.md` §7 links to the pack and the pack links back to the protocol; every link and anchor resolves. | must |
| FR-9 | `node scripts/validate-docs.js` reports 5 passed / 0 failed. | must |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | Docs-only: no change under `src/`, `package.json`, the lockfile, assets, or schemas. |
| NFR-2 | No PII — name, contact detail, exact age, address, device identifier, photo, voice recording, raw timestamp, or identifying screenshot — in any tracked file. |
| NFR-3 | No collection, upload, network, or analytics promise is introduced. |
| NFR-4 | Existing LF line endings are preserved in edited files. |
| NFR-5 | Every relative link and anchor resolves. |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | `docs/retention-pilot-pack.md` exists with the status, recruitment, consent, evidence, checklist, worksheet, and summary components. | FR-1, FR-2, FR-3, FR-4, FR-5, FR-6, FR-7 |
| AC-2 | The status line reads "Not run" and explicitly denies contact, interviews, and export reads. | FR-1 |
| AC-3 | The consent form is blank, lists all three evidence sources and withdrawal, and has signature and date lines. | FR-3 |
| AC-4 | The evidence section names `.conductor/evidence/`, states it is gitignored, and specifies deletion on withdrawal. | FR-4 |
| AC-5 | The checklist covers Day 0, Day 7, Day 14, withdrawal, and incomplete cases, with no instrumentation step. | FR-5 |
| AC-6 | The worksheet defines `E`, `R`, exclusions, and ≥ 40 % as a directional benchmark only. | FR-6 |
| AC-7 | The summary template has no identifier fields and includes counts, direction, and incomplete cases. | FR-7 |
| AC-8 | Both documents link to each other and the validator reports 5 passed / 0 failed. | FR-8, FR-9 |
| AC-9 | The diff against the base branch contains only `docs/retention-pilot-pack.md`, `docs/retention-validation.md`, `README.md` (documentation index), and Conductor state. | NFR-1 |

## Edge Cases

- A parent withdraws mid-window: observation stops immediately and researcher-held copies are deleted.
- An export is unreadable or missing: the case is recorded as incomplete, never imputed.
- Only one export is shared: no proxy value is recorded from it.
- An interview contradicts the exports: both directions are reported rather than silently reconciled.
- An interview answer is vague: it stays vague in the summary.
- No families are recruited: every status remains `not started` and the pack stays blank.

## Dependencies

- **Tracks:** none. `20261126-retention-proxy` is complete and archived.
- **External:** none. Later human recruitment is not a blocker for authoring the pack.

## Open Questions & Assumptions

- **Assumption:** the project owner will recruit families later, outside this track.
- **Assumption:** the ≥ 40 % figure remains a directional benchmark from the roadmap, not a result.
- **Assumption:** `.conductor/evidence/` remains gitignored; if that changes, the pack must be updated in a later track.
- **Question:** none blocking.

## References

- [Retention Proxy Validation — Protocol and Privacy Record](../retention-validation.md)
- [Child privacy statement](../child-privacy.md)
- [Product intent](../product-intent.md)
- [Roadmap §10.3 and §10.9](../../conductor/roadmap.md)
