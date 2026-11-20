# Phase 1 Verification — Record the four decisions

- **Track:** 20261120-product-intent-gate
- **Phase:** 1 — Record the four decisions
- **Date:** 2026-11-20
- **Branch:** `chore/20261120-product-intent-gate`
- **Base commit:** `849d4592`
- **Head commit (implementation):** `b35e5342`
- **Result:** verified

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| Docs (verification) | `node scripts/validate-docs.js` | 0 | 5 passed, 0 failed — release-note index, relative links/anchors, game lists, Conductor paths and living-doc test counts all valid. |
| Git (inspection) | `git status --short` | 0 | Working tree clean at phase start. |
| Git (inspection) | `git log --oneline --max-count=5` | 0 | HEAD at phase base `849d4592`. |
| Git (commit) | `git add docs/product-intent.md` | 0 | Staged the decision record. |
| Git (commit) | `git commit -m "docs(product-intent): record the four product decisions"` | 0 | Created implementation commit `b35e5342`. |

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| AC-1 | `docs/product-intent.md` has a section for each of the four decisions with value, date, rationale and consequence | Four `## Decision N` sections, each with explicit Value / Date / Rationale / Consequence fields | Pass |
| AC-2 | The document states "family-only", records Phase 5 as cancelled and Phase 4 as next | Decision 1 Value ("family-only"); Decision 1 Consequence and "Sequencing consequences" (Phase 5 cancelled, Phase 4 next) | Pass |
| AC-3 | The document states the touch-only/sighted/textless/landscape stance | Decision 2 Value and Rationale; README publication is the track's publish phase and outside this phase's `Touches` | Pass (in-scope portion) |
| AC-4 | The document states "English permanently" and that i18n is not a goal | Decision 3 Value, Rationale and Consequence | Pass |
| AC-5 | The document states the full public-release posture and enumerates all five legal artifacts with status | Decision 4 Value plus five-row artifact table with "prepared artifact — not submitted" status | Pass |

FR-1 through FR-5 are covered by the four decision sections and the sequencing-consequences section. NFR-2 (every decision carries a date and rationale) and NFR-3 (docs validator passes) are satisfied.

## Evidence paths

- `docs/product-intent.md` — the decision record (implementation commit `b35e5342`).
- `conductor/tracks/20261120-product-intent-gate/verification/phase-1.md` — this report.

## Deviations

None. All work stayed within the single `Touches` path, `docs/product-intent.md`, plus this evidence file.

## Notes

- The four decisions were recorded exactly as chosen by the user; nothing was re-decided.
- BGM provenance is noted only as untraceable, with rights resolution required. The replace-vs-remove decision is intentionally left to the BGM-rights phase (Phase 3 of this track) and is not resolved here.
- Legal artifacts are enumerated as prepared-but-not-submitted; no store listing is claimed. Their creation belongs to the legal-gaps phase (Phase 2 of this track).
- README publication of the accessibility stance and the `conductor/product.md` roadmap update belong to the publish phase (Phase 4 of this track) and were deliberately not touched.
- The only runtime-doc link added (`../conductor/product.md`) resolves; the doc references roadmap sections rather than track paths to avoid archive churn.
- The evidence report is committed after the implementation commit, so the recorded head is the implementation commit; the evidence commit is a state-only commit.
