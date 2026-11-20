# Product Intent Gate — Specification

> Requirements are stable. Once an `FR`, `NFR`, or `AC` ID is approved, do not
> renumber it. If a requirement is removed, mark it `Withdrawn` instead of
> deleting it.

## Overview

This track resolves the Phase 3 product-intent gate from `conductor/product.md`
§10.4 by recording four decisions in `docs/product-intent.md`: family-only
audience, a documented touch-only accessibility stance, English permanently,
and a full public-release legal posture. It also closes the concrete legal gaps
those decisions imply — a LICENSE, audio and third-party attribution, a
child-privacy statement, store privacy labels, and a defensible resolution for
`bgm.mp3` — then publishes the stance in the README and marks the roadmap gate
done. The result makes scope explicit, unblocks Phase 4 and cancels Phase 5.

## Problem / Motivation

Today the product's audience, accessibility, language and legal posture are
implicit. `conductor/product.md` §10.4 identifies this as the only hard gate;
§10.9 lists "Phase 3 never happens and scope stays implicit" and "the
accessibility stance is deferred indefinitely" as Medium risks. There is no
LICENSE, `bgm.mp3` has no recorded creator or license (the asset entered the
working tree untracked and was only relocated and re-encoded by later commits),
and the touch-only stance lives in code rather than in user-facing docs.
Building i18n and store packaging for a family-only app would be months of
waste; shipping publicly without these answers is a legal and reputational
risk.

## Goals & Success Metrics

- **Goal:** Four product decisions recorded with rationale and consequence, the
  concrete legal gaps closed, and the accessibility stance visible to a user.
- **Metric:** `docs/product-intent.md` exists with all four decisions; `LICENSE`
  and four legal documents exist; `bgm.mp3` rights are resolved by replacement,
  removal, or documented authorship; the README publishes the stance;
  `conductor/product.md` marks Phase 3 complete with the Phase 5 cancellation;
  `node scripts/validate-docs.js` passes.

## Scope

### In Scope

- `docs/product-intent.md` — decision record with value, date, rationale and
  consequence for audience, accessibility, language and legal posture.
- `LICENSE` (MIT) and `docs/audio-attribution.md`,
  `docs/third-party-notices.md`, `docs/child-privacy.md`,
  `docs/store-privacy-labels.md`.
- Resolution of `bgm.mp3` rights: replace with a known-licensed loop or remove
  the loop and its precache entry; record the investigation and outcome.
- README accessibility statement and link to `docs/product-intent.md`.
- `conductor/product.md` roadmap update recording the decisions and their
  consequences.

### Out of Scope

- i18n, string extraction, per-locale bundles or RTL layout work.
- Keyboard/switch input or restoring OS zoom.
- Store submission, TWA/Capacitor wrapper or store assets.
- Content depth (Phase 4), and any runtime feature work.

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | `docs/product-intent.md` records all four decisions, each with value, date, rationale and consequence | must |
| FR-2 | Audience is family-only; the record states Phase 5 (reach) is cancelled and Phase 4 (depth) is the next product phase | must |
| FR-3 | Accessibility is a documented stance — touch-only, sighted, textless, landscape — published in the README in user-facing language | must |
| FR-4 | Language is English permanently; a second locale and i18n are explicitly not goals | must |
| FR-5 | Legal posture is full public-release: all five artifacts are enumerated with status, prepared but not submitted (no store listing committed) | must |
| FR-6 | `LICENSE` (MIT), `docs/audio-attribution.md`, `docs/third-party-notices.md`, `docs/child-privacy.md` (COPPA/GDPR-K) and `docs/store-privacy-labels.md` exist | must |
| FR-7 | `bgm.mp3` rights are resolved: its origin investigation is recorded and the asset is replaced with a known license or removed with its precache entry; no untraceable right is claimed | must |
| FR-8 | `conductor/product.md` marks Phase 3 complete with its consequences, the README links `docs/product-intent.md`, and `node scripts/validate-docs.js` passes | must |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | No runtime source changes except the BGM asset and its precache wiring if FR-7 requires removal or replacement |
| NFR-2 | Every decision carries a date and a rationale; no decision is left implicit |
| NFR-3 | All new and changed docs pass `node scripts/validate-docs.js` — every relative link and anchor resolves |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | `docs/product-intent.md` has a section for each of the four decisions with value, date, rationale and consequence | FR-1 |
| AC-2 | The document states "family-only", records Phase 5 as cancelled and Phase 4 as next | FR-2 |
| AC-3 | The document states the touch-only/sighted/textless/landscape stance and the README states the same limitation to users | FR-3 |
| AC-4 | The document states "English permanently" and that i18n is not a goal | FR-4 |
| AC-5 | The document states the full public-release posture and enumerates all five legal artifacts with status | FR-5 |
| AC-6 | `LICENSE` and the four `docs/*` legal files exist with the stated content | FR-6 |
| AC-7 | `bgm.mp3` is either replaced with a known-licensed loop and attributed, or removed together with its precache wiring; the attribution file records the investigation and outcome | FR-7 |
| AC-8 | `conductor/product.md` shows Phase 3 done, the README links `docs/product-intent.md`, and `node scripts/validate-docs.js` exits 0 | FR-8 |

## Edge Cases

- `bgm.mp3` has no documented creator or license anywhere in git, docs or past
  sessions; the fallback is replacement with a known-licensed loop or removal
  of the loop and its precache entry.
- Store privacy labels are prepared artifacts, not a submission; the document
  must not imply a store listing exists.
- README and `conductor/product.md` could drift from the decision record; both
  are updated in the same phase with an explicit link.
- Links from `conductor/product.md` to archived tracks are accepted by
  `validate-docs`, but the decision record references roadmap sections rather
  than track paths to avoid archive churn.

## Dependencies

- **Tracks:** none
- **External:** none — the provenance investigation uses repo history and local session records only
- **Gates:** Phase 5 (reach) is cancelled by this decision; Phase 4 (depth) is unblocked

## Open Questions & Assumptions

- **Assumption:** "Full public-release posture" means the artifacts are prepared
  but no store submission is committed, because the chosen audience is
  family-only.
- **Assumption:** The BGM investigation is complete: origin is recorded only as
  "existing / user-supplied", with no creator, tool or license in git, docs or
  past OpenCode sessions. The recorded fallback is replacement or removal.

## References

- `conductor/product.md` §10.4, §10.6, §10.7, §10.9, §10.10
- `README.md`, `docs/PRD.md`, `docs/TDD.md`
- `scripts/validate-docs.js`
- `conductor/archive/release-readiness-pwa_20260731/spec.md`
