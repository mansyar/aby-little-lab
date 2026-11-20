# Phase 4 Verification — Publish and sync docs

- **Track:** 20261120-product-intent-gate (Product Intent Gate)
- **Phase:** 4 — Publish and sync docs
- **Date:** 2026-11-20
- **Branch:** `chore/20261120-product-intent-gate`
- **Base commit:** `7dbe6587`
- **Head commit:** `a9e12a3e`
- **Result:** **verified** — P4.T1, P4.T2 and both authorised deviations are
  complete. The phase subagent was denied writes to `conductor/product.md` (a
  protected product doc), so the primary applied the five specified roadmap
  edits; all acceptance criteria now pass and `node scripts/validate-docs.js`
  exits 0.

## Commands and tool calls

| Command / call | Purpose | Exit / outcome |
|---|---|---|
| `git status --short --branch` | Confirm branch and starting tree | OK — on `chore/20261120-product-intent-gate`, only `public/fonts/OFL.txt` untracked (copied by primary) |
| `git log --oneline --max-count=3` | Confirm phase base | OK — HEAD `7dbe6587` |
| `git hash-object public/fonts/OFL.txt; (Get-Item public/fonts/OFL.txt).Length` | Optional cross-check of the primary's 4,384-byte claim | **DENIED** (`Permission denied: shell`) — not needed; the primary already verified size and content in the brief |
| `edit(path="README.md", ...)` ×4 | Accessibility section, Known Issues bullet, Documentation links, License | OK — 4 single replacements |
| `edit(path="conductor/product.md", ...)` | §10.4 Done annotation with the four decisions and consequences | **DENIED** (`Permission denied: edit`) — protected product doc; not retried or worked around |
| `edit(path="docs/third-party-notices.md", ...)` | Authorised deviation 1 — Baloo 2 OFL row | OK |
| `edit(path="docs/product-intent.md", ...)` | Authorised deviation 2 — BGM note | OK |
| `node scripts/validate-docs.js` | Required verification (subagent run) | **0** — 5 passed, 0 failed |
| `edit(path="conductor/product.md", ...)` ×5 — primary | §10.4 Done annotation, §10.6 Phase 5 Cancelled, §10.8 Outcome line, §10.9 two closed risks, §10.10 keyboard decision | OK — all five edits applied after the subagent blocker was handed back |
| `node scripts/validate-docs.js` | Required verification (primary re-run after roadmap edits) | **0** — 5 passed, 0 failed |
| `git add README.md`; `git commit -m "docs(readme): publish the product-intent stance and legal posture"` | Commit P4.T1 | OK — `b7d2ecac` |
| `git add public/fonts/OFL.txt docs/third-party-notices.md docs/product-intent.md`; `git commit -m "docs(attribution): ship the Baloo 2 OFL text and close the stale BGM note"` | Commit deviations | OK — `a9e12a3e` |

## Acceptance criteria

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| AC-3 | The decision record states the touch-only/sighted/textless/landscape stance and the README states the same limitation to users | `README.md` `## Accessibility` section and the rewritten Canvas-only UI bullet in `## Known Issues`, both linking `docs/product-intent.md`; committed in `b7d2ecac` | Pass |
| AC-2 | The document states "family-only", records Phase 5 as cancelled and Phase 4 as next | `docs/product-intent.md` Decision 1 and "Sequencing consequences"; `conductor/product.md` §10.4 Done annotation and §10.6 Phase 5 Cancelled (applied by the primary) | Pass |
| AC-8 | `conductor/product.md` shows Phase 3 done, the README links `docs/product-intent.md`, and `node scripts/validate-docs.js` exits 0 | README links in Accessibility, Known Issues, Documentation and License (all resolve); validator exit 0 with all 5 checks green; `conductor/product.md` §10.4 marks Phase 3 done on 2026-11-20 | Pass |

FR-2, FR-3 and FR-8 are satisfied across the decision record, the README and
the roadmap. The subagent's `conductor/product.md` blocker was resolved by the
primary applying the five fully specified edits; no product or design decision
was needed.

## Evidence paths

- `README.md` — Accessibility section after Parental Lock & Touch UX; Known
  Issues bullet; five new Documentation links; MIT License section.
- `docs/third-party-notices.md` — Baloo 2 OFL row now points at
  `../public/fonts/OFL.txt`.
- `docs/product-intent.md` — BGM note in Overview records the 2026-11-20 CC0
  replacement and links `audio-attribution.md`.
- `public/fonts/OFL.txt` — upstream SIL OFL 1.1 text shipped by the primary,
  staged and committed here (4,384 bytes per the primary's verification).
- Commits: `b7d2ecac` (README), `a9e12a3e` (deviations + OFL file).
- Verification output: `node scripts/validate-docs.js` → 5 passed, 0 failed,
  exit 0.

## Deviations

- **Authorised — `public/fonts/OFL.txt`:** the primary had already copied the
  upstream Baloo 2 OFL text here (4,384 bytes, from
  `https://raw.githubusercontent.com/google/fonts/main/ofl/baloo2/OFL.txt`).
  It was not copied again; it was staged and committed in `a9e12a3e`.
- **Authorised — `docs/third-party-notices.md`:** line 40 (the Baloo 2 row) now
  states that the upstream OFL text ships at `../public/fonts/OFL.txt` instead
  of saying no separate license file is present. The rest of the table was left
  intact, including the BGM row, as instructed.
- **Authorised — `docs/product-intent.md`:** the stale Overview BGM note keeps
  the investigation fact and adds the 2026-11-20 CC0 replacement plus a link to
  `audio-attribution.md`. The four decisions themselves were not changed.

## Blockers

All blockers listed below were resolved by the primary (the five roadmap edits
were applied; the optional hash check was unnecessary) before this report was
finalised. They are retained for traceability.

- `edit(path="conductor/product.md", ...)` — required by the brief for §10.4
  (Done annotation, four decisions, consequences, `../docs/product-intent.md`
  link), §10.6 (Phase 5 Cancelled), §10.8 (Outcome line), §10.9 (two closed
  risk rows) and §10.10 (keyboard decision). The `edit` tool returned
  `Permission denied: edit` because `conductor/product.md` is a protected
  product doc under the phase rules. Expected: the five edits apply and the
  roadmap records the gate outcome. Not retried or worked around; the primary
  must apply them.
- `git hash-object public/fonts/OFL.txt; (Get-Item public/fonts/OFL.txt).Length`
  — optional cross-check of the OFL file's byte size, denied with
  `Permission denied: shell`. Expected: 4,384 bytes and the blob hash. This is
  non-blocking: the primary already verified the size and content in the brief,
  and the file was staged and committed unchanged.

## Notes

The README work is complete and committed. The two authorised deviations are
complete and committed. All that remains for P4.T2 is the set of five edits to
`conductor/product.md` listed in the blocker; they are small, fully specified in
the brief, and require no product or design decision. The evidence file is left
uncommitted for the primary's state commit; the head commit above is the last
code commit (`a9e12a3e`).
