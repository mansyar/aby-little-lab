# Product Intent — Aby's Little Lab

## Overview

This document is the durable record of the four product decisions that close the
Phase 3 product-intent gate in `conductor/roadmap.md` §10.4. It makes the
product's audience, accessibility scope, language and legal posture explicit so
they cannot drift back into being implicit. The record does not re-litigate the
decisions — it states what was chosen, when, why, and what follows from it.

All four decisions were made on **2026-11-20** as part of the
`20261120-product-intent-gate` track. Together they close the intent gate:
Phase 4 (depth) is the next product phase, and Phase 5 (reach) is cancelled.

One consequence is noted here rather than decided: the origin of `bgm.mp3` was
untraceable from the repository history, documentation and past sessions, so its
rights had to be resolved before public distribution. On 2026-11-20 the
untraceable loop was replaced at the same path with a CC0-licensed one; the
investigation and that outcome are recorded in
[audio-attribution.md](audio-attribution.md).

## Decision 1 — Audience

- **Value:** family-only. The app is intended for private use within the
  families of its users, not for a general public audience. Small private
  distribution is the ceiling.
- **Date:** 2026-11-20.
- **Rationale:** The product is a set of early-learning games for young
  children, built around a child's own profiles and progress. Building i18n and
  store packaging for a family-only app would be months of work with no audience
  to justify it, and the privacy posture (no accounts, no cloud, no analytics)
  fits private family use. A public audience was considered and rejected.
- **Consequence:** Phase 5 (reach) — the i18n seam, store packaging and the
  reach-oriented licensing work — is **cancelled**. Phase 4 (depth) is the next
  product phase. No store submission is committed; legal artifacts are prepared
  as a matter of posture, not in anticipation of a listing.

## Decision 2 — Accessibility stance

- **Value:** the app is **touch-only, for sighted children, textless, and
  landscape**. These are documented as a defensible, honest limitation of the
  product, not as a gap to be closed in this track.
- **Date:** 2026-11-20.
- **Rationale:** The interfaces are large-target, pointer-driven, speech- and
  art-led scenes designed for a pre-reading child on a tablet held in landscape.
  Keyboard/switch access and OS zoom would require a separate input and layout
  model across every scene for an audience the product does not target. An
  honest, published stance is preferable to an indefinite "gap to close"
  (one of the roadmap's recorded risks).
- **Consequence:** No keyboard or switch input is added and OS zoom is not
  restored in this track. The stance is published in user-facing language in the
  README by the publish phase of this track, so the decision is visible to a
  user and not just present in code. It remains an honest limitation: the app is
  not intended for users who need non-touch access or text alternatives.

## Decision 3 — Language

- **Value:** **English permanently.** A second locale is not a goal, and
  internationalisation (i18n) is explicitly not a goal.
- **Date:** 2026-11-20.
- **Rationale:** The narration and early-literacy content (letters, first
  sounds, words, stories) is English-language by design — the games teach
  English literacy and numeracy. Localising it would mean re-authoring content
  and narration manifests, not just extracting strings. With a family-only
  audience there is no demand that would repay that cost.
- **Consequence:** No string extraction, per-locale asset bundles, RTL layout
  audit or pilot locale is planned. The reach-phase i18n work is cancelled along
  with the rest of Phase 5; i18n remains explicitly out of scope for the product.

## Decision 4 — Legal posture

- **Value:** **full public-release posture.** The product prepares the complete
  set of legal artifacts a public release would need, even though the chosen
  audience is family-only and no store submission is committed.
- **Date:** 2026-11-20.
- **Rationale:** Preparing these artifacts gives every shipped asset a
  traceable right and makes the child-privacy and data posture explicit.
  Shipping publicly without these answers would be a legal and reputational
  risk; preparing the artifacts while keeping the audience family-only is the
  low-cost way to keep that risk closed without committing to a store listing.
- **Consequence:** The five artifacts below are prepared (in the legal-gaps
  phase of this track) but are **prepared artifacts, not a submission** — no
  store listing exists or is committed. The `bgm.mp3` rights were resolved on
  2026-11-20 by replacing the untraceable loop at the same path with a
  CC0-licensed "Calm Loop" by wipics, attributed in
  [audio-attribution.md](audio-attribution.md); no untraceable right is claimed for the old file.

  | Artifact | Status |
  | --- | --- |
  | `LICENSE` (MIT) | Prepared artifact — not submitted |
  | `docs/audio-attribution.md` (audio attribution; records the BGM investigation and CC0 resolution) | Prepared artifact — not submitted; BGM rights resolved 2026-11-20 by same-path CC0 "Calm Loop" (wipics) replacement, attributed here |
  | `docs/third-party-notices.md` (third-party notices) | Prepared artifact — not submitted |
  | `docs/child-privacy.md` (COPPA/GDPR-K statement) | Prepared artifact — not submitted |
  | `docs/store-privacy-labels.md` (store privacy labels) | Prepared artifact — not submitted; no store listing committed |

## Sequencing consequences

The decisions above settle the roadmap branch at the Phase 3 gate:

- **Phase 5 (reach) is cancelled.** Its tracks — the i18n seam, the
  accessibility-execution work, store packaging and the reach licensing track —
  do not proceed. A second locale and i18n are not goals.
- **Phase 4 (depth) is the next product phase.** Work moves to content depth
  and retention (larger words/stories/scenarios pools, replay novelty and
  adaptive tuning), staying inside the existing art and chunk budgets.
- **The accessibility stance is published, not implemented.** The touch-only,
  sighted, textless, landscape limitation is stated here and in the README by
  the publish phase; no keyboard/switch input or OS zoom work is scheduled.
- **The legal posture is prepared, not submitted.** All five artifacts are
  prepared; no store submission or listing is committed while the audience is
  family-only. BGM rights were resolved on 2026-11-20 by replacing the loop at the same path with a CC0-licensed "Calm Loop" by wipics, attributed in [audio-attribution.md](audio-attribution.md).

## References

- `conductor/roadmap.md` §10.4 (product-intent gate), §10.5 (Phase 4 — Depth),
  §10.6 (Phase 5 — Reach), §10.9 (roadmap risks), §10.10 (deliberately not doing)
- `../conductor/roadmap.md` (roadmap)
