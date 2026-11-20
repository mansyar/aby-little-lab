# Phase R1 Verification — Review Fixes

- **Track:** 20261120-product-intent-gate (Product Intent Gate)
- **Phase:** R1 — Review Fixes
- **Date:** 2026-11-20
- **Branch:** `chore/20261120-product-intent-gate`
- **Base commit:** `b960a108`
- **Head commit:** recorded in plan.md (the squashed Phase R1 checkpoint)
- **Result:** **verified** — all four review findings (F1, F2, F3, F4) are resolved.
  F1, F2 and F3 were fixed by this phase in the three touched docs; F4 was
  applied by the primary in `conductor/product.md`. All four were squashed into
  this phase's squashed checkpoint. `node scripts/validate-docs.js` exits 0
  (5 passed, 0 failed). No product or design decision was required.

## Findings → fixes → evidence

| Finding | Fix applied | Evidence paths | Status |
| --- | --- | --- | --- |
| **F1** — third-party notice still called the shipped BGM untraceable | `docs/third-party-notices.md:41` bundled-assets row now records `public/audio/bgm.mp3` as `CC0 1.0 Universal`, credits "Calm Loop" by wipics, notes the 2026-11-20 same-path CC0 replacement, and points to the audio attribution. The MIT/`LICENSE` and Baloo 2 OFL rows were left intact. | `docs/third-party-notices.md`; `docs/audio-attribution.md` (authoritative provenance record); this phase's checkpoint | Resolved |
| **F2** — decision record still said BGM rights were unresolved | `docs/product-intent.md` — all three stale statements updated to state that rights were resolved on 2026-11-20 by replacing the loop at the same path with a CC0-licensed "Calm Loop" by wipics, attributed in `docs/audio-attribution.md`: (a) Decision 4 consequence (lines 83–86, dropped "must be resolved in a later phase"), (b) the audio-attribution artifact-table row (line 91, dropped "BGM rights resolution outstanding"), and (c) Sequencing consequences (line 111, dropped "remains a tracked follow-up"). The four decisions' values, dates and rationales and the already-refreshed Overview note were not changed. | `docs/product-intent.md`; this phase's checkpoint | Resolved |
| **F3** — privacy labels still described the audio asset as untraceable | `docs/store-privacy-labels.md:66-68` now references "the BGM provenance investigation and its resolution by a CC0-licensed replacement", recorded in `audio-attribution.md`, and keeps the statement that it has no bearing on data collection. Rest of the file intact. | `docs/store-privacy-labels.md`; this phase's checkpoint | Resolved |
| **F4** — roadmap planning assumption framed Phase 3 as pending | Applied by the **primary**: `conductor/product.md:142-143` now reads "Distribution stays private/small — Phase 3 confirmed family-only on 2026-11-20 (see §10.4)". This phase did not re-apply or re-decide it. | `conductor/product.md:142-143`; this phase's checkpoint | Resolved (by primary) |

## Commands and tool calls

| Command / call | Purpose | Exit / outcome |
| --- | --- | --- |
| `git log --oneline --max-count=5` | Confirm phase base and that F4 is already applied | OK — F4 was at HEAD before the squash; base `b960a108` |
| `read` on `review.md`, `plan.md`, the three docs, `audio-attribution.md`, `conductor/product.md` | Read the brief's required inputs in full | OK — all findings and ground facts confirmed; F4 confirmed applied, not re-applied |
| `edit` on `docs/third-party-notices.md` | F1 — correct the BGM license row | OK — 1 replacement |
| `edit` on `docs/product-intent.md` (×6) | F2 — three stale statements | OK — 6 replacements (consequence spread across 4 lines after a leading-whitespace mismatch required line-scoped edits; table row; sequencing line) |
| `edit` on `docs/store-privacy-labels.md` (×2) | F3 — rephrase the stale audio phrasing | OK — 2 replacements |
| `grep` on `docs/*.md` for stale phrases | Confirm "must be resolved", "rights resolution outstanding", "tracked follow-up" are gone | OK — none remain; remaining "untraceable" mentions correctly describe the old, no-longer-shipped loop or the untouched Overview note |
| `node scripts/validate-docs.js` | Required verification | **0** — 5 passed, 0 failed ("All document validation checks passed!") |
| `git add` (all four touched docs and this evidence file); `git reset --soft b960a108`; `git commit -m "docs: resolve review findings in product intent docs"` | Squash all four findings into one phase checkpoint | OK — this phase's checkpoint |

## Notes

- All four findings are resolved: F1–F3 by this phase, F4 by the primary; all
  four are squashed into this phase's checkpoint.
- Scope stayed within the three docs listed in `Touches`. `conductor/product.md`
  was read only to confirm F4; it was not edited.
- The validator adds no anchors, Conductor paths or test-count claims; the two
  new `[audio-attribution.md](audio-attribution.md)` links resolve to an existing
  file, so all 5 checks remain green.
- The primary runs the full configured `verify_phase` chain; this phase ran the
  named `node scripts/validate-docs.js` check only.
- The evidence file is included in this phase's checkpoint.
