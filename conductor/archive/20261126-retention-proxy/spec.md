# Confirm the retention proxy with a handful of real families — Specification

> Requirements are stable. Once an `FR`, `NFR`, or `AC` ID is approved, do not
> renumber it. If a requirement is removed, mark it `Withdrawn` instead of
> deleting it.

## Overview

A documentation-and-protocol chore that makes the roadmap's local retention proxy auditable. No families were recruited, so the deliverable is a consented study protocol, parent interview guide, privacy-safe evidence template, and an honest findings document stating that no field result exists.

## Problem / Motivation

Roadmap §10.3 targets a Day-7 return proxy of at least 40 %, but §10.9 admits that the proxy is noisy and needs confirmation with real families. Shipping more depth work against an unvalidated signal risks optimizing the wrong behavior. The product is private and offline-first, so validation must not add analytics, accounts, uploads, or app changes.

## Goals & Success Metrics

- **Goal:** Make the proxy falsifiable later without compromising privacy or pretending a study happened.
- **Metric:** A complete protocol with explicit consent, a 14-day minimum window, a 1–2 family pilot target, defined evidence, and a committed no-data finding; all docs checks green.

## Scope

### In Scope

- `docs/retention-validation.md` containing protocol, proxy definitions, interview guide, data rules, and no-data finding.
- README Documentation index link.
- Roadmap RM-4 to track link and §10.9 reference to the protocol.
- Verification evidence.

### Out of Scope

- Recruiting families, running interviews, or claiming field results.
- App runtime changes, analytics, telemetry, save-schema changes, accounts, cloud sync, or network dependency.
- Statistical claims, production retention claims, or non-Chromium/device claims.

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | Document a 14-day minimum, 1–2 consenting-family pilot protocol with consent and withdrawal steps. | must |
| FR-2 | Define the local Day-7 return proxy from existing on-device Progress/export data, with at least 40 % as a directional target from roadmap §10.3. | must |
| FR-3 | Provide a parent interview guide mapping questions to return, breadth, completion, and barrier signals. | must |
| FR-4 | Define privacy rules: no PII in committed files, raw exports/transcripts stay outside git, no telemetry or upload. | must |
| FR-5 | Record the actual finding as "Protocol only — recruitment not executed"; no field result or production claim. | must |
| FR-6 | Add the new document to the README Documentation index and keep all links valid. | must |
| FR-7 | Link roadmap RM-4 to the new track and point §10.9 risk mitigation at the protocol. | must |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | No runtime source, test, dependency, asset, save-schema, storage, or app behavior change. |
| NFR-2 | Preserve family-only/offline privacy posture; no new collection or third-party transfer. |
| NFR-3 | Use directional language only; no statistical or production-retention claim. |
| NFR-4 | Use CRLF-aware whitespace checks and `node scripts/validate-docs.js`. |
| NFR-5 | Preserve historical roadmap and release records; only current rows/links change. |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | Protocol states 14-day minimum, 1–2 family target, consent, withdrawal, and recruitment status. | FR-1 |
| AC-2 | Day-7 proxy, at least 40 % target, and source link are documented as directional. | FR-2 |
| AC-3 | Interview guide maps each question to a proxy or barrier signal. | FR-3 |
| AC-4 | Committed artifacts contain no PII and define private raw-evidence handling. | FR-4 |
| AC-5 | Findings section explicitly says no families were recruited and no field result is claimed. | FR-5 |
| AC-6 | README index links the document; all links and docs validation pass. | FR-6 |
| AC-7 | Roadmap RM-4 links to the track; §10.9 mitigation references the protocol. | FR-7 |
| AC-8 | Exact configured gate passes and diff contains only docs/Conductor files. | NFR-1, NFR-4 |

## Edge Cases

- A future family withdraws or cannot complete 14 days: record as incomplete; never impute a return.
- Export is unreadable or missing: use interview evidence only and label it weaker.
- A family's data contradicts the at-least-40 % proxy: report the conflict directionally.
- No recruitment happens: keep protocol-only status; do not close the product question.

## Dependencies

- **Tracks:** none
- **External:** 1–2 consenting families are required for any future field result; currently unavailable.

## Open Questions & Assumptions

- `conductor/product.md` has no Open Questions & Assumptions section; recorded as a gap rather than inventing answers.
- Owner confirmed "No — protocol only"; recruitment is an accepted blocker, not a failure.
- Committed findings contain aggregated, non-identifying information only.

## References

- [Roadmap §10.3 metrics and §10.9 risk](../../roadmap.md)
- [Product intent — sequencing consequences](../../docs/product-intent.md)
- [v1.25.0 release notes](../../docs/release-notes-v1.25.0.md)
- [v1.26.0 release notes](../../docs/release-notes-v1.26.0.md)
- [v1.26.1 release notes](../../docs/release-notes-v1.26.1.md)
