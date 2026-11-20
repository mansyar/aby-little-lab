# Review: Product Intent Gate

- **Track:** `20261120-product-intent-gate`
- **Type:** chore (high)
- **Branch:** `chore/20261120-product-intent-gate`
- **Range:** `85c5f16f..b3cb71c2`
- **Date:** 2026-11-20T19:33:48+11:00
- **Verdict:** `PASS WITH FINDINGS`

## Summary

All eight FRs, three NFRs and eight ACs of the Phase 3 product-intent gate are
implemented, and the full configured verification chain is green (3,323 tests,
coverage above every gate, PWA 16/16, docs 5/5). The independent reviewer found
no Critical or High findings. It did find four stale wording issues left by the
Phase 3 BGM replacement and Phase 4 roadmap sync: a legal notice and a decision
record still describe BGM rights as unresolved, a prepared privacy artifact still
calls the shipped asset untraceable, and one roadmap planning assumption still
frames Phase 3 as pending. With `review.strict: true`, all four must be fixed in
this track before the PR; none requires a product or design decision.

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| static | `pnpm check` | pass | Biome clean, 337 files |
| static | `pnpm typecheck` | pass | src and e2e `tsc --noEmit` clean |
| unit | `pnpm test -- --run` | pass | 153 files, 3,323 tests |
| coverage | `pnpm test:coverage` | pass | 97.12 / 90.94 / 96.21 / 98.31 % (gates 95 / 88 / 85 / 90) |
| build | `pnpm build` | pass | 411 modules; shell 191.16 kB; Phaser vendor 1,367.08 kB (pre-existing advisory) |
| build artifact | `node scripts/validate-bundle.js` | pass | shell entry 186.7 kB ≤ 200 kB |
| build artifact | `node scripts/validate-pwa.js` | pass | 16/16, BGM present and precached |
| docs | `node scripts/validate-docs.js` | pass | 5/5 checks |
| aggregate | `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js` | pass | exit 0; `verification/integrated.md` |

## Requirements

| ID | Implemented by | Verified by | Status |
| --- | --- | --- | --- |
| FR-1 | P1.T1, P1.T2 | `docs/product-intent.md`, `verification/phase-1.md` | partial — see F2 |
| FR-2 | P1.T2, P4.T2 | `docs/product-intent.md`, `conductor/product.md` §10.4/§10.6/§10.8 | covered |
| FR-3 | P1.T1, P4.T1 | `README.md` Accessibility / Known Issues, `verification/phase-4.md` | covered |
| FR-4 | P1.T2 | `docs/product-intent.md` Decision 3 | covered |
| FR-5 | P1.T1, P2.T3 | `docs/product-intent.md` Decision 4, five legal artifacts | covered |
| FR-6 | P2.T1–P2.T3 | `LICENSE`, four legal docs, `verification/phase-2.md` | partial — see F1, F3 |
| FR-7 | P3.T1, P3.T2 | `docs/audio-attribution.md`, BGM binary, `verification/phase-3.md`, PWA validator | covered |
| FR-8 | P4.T1, P4.T2 | `conductor/product.md` §10.4, README links, docs validator | partial — see F4 |
| NFR-1 | P3.T2 | track diff: only docs, the BGM binary and `public/fonts/OFL.txt` | covered |
| NFR-2 | P1.T1, P1.T2 | four decisions dated 2026-11-20 with rationale | covered |
| NFR-3 | P1–P4 | docs validator 5/5 in every phase | covered |
| AC-1 | P1.T1 | four decision sections in `docs/product-intent.md` | partial — see F2 |
| AC-2 | P1.T2, P4.T2 | roadmap §10.4/§10.6, integrated evidence | covered |
| AC-3 | P1.T1, P4.T1 | README Accessibility section | covered |
| AC-4 | P1.T2 | `docs/product-intent.md` Decision 3 | covered |
| AC-5 | P1.T1, P2.T3 | five prepared-not-submitted artifacts | covered |
| AC-6 | P2.T1–P2.T3 | five legal files on disk | partial — see F1, F3 |
| AC-7 | P3.T1, P3.T2 | CC0 attribution + replaced binary + PWA validator | covered |
| AC-8 | P4.T1, P4.T2 | roadmap done marker, README links, docs validator | partial — see F4 |

## Findings

### Critical

- <none>

### High

- <none>

### Medium

- **F1 — Third-party notice still calls the shipped BGM untraceable**
  - **File:** `docs/third-party-notices.md:41`
  - **What:** The bundled-assets row records `public/audio/bgm.mp3` as
    "Untraceable — no license claimed" and says "rights resolution is
    outstanding". Phase 3 replaced the shipped file with CC0-licensed "Calm
    Loop" by wipics, documented in `docs/audio-attribution.md`.
  - **Why:** A prepared public-release legal notice misstates the license of a
    shipped asset and contradicts the authoritative attribution document.
  - **Fix:** Change the row to CC0 1.0 Universal ("Calm Loop" by wipics) and
    point to the audio attribution, noting the 2026-11-20 CC0 replacement.
  - **Requirement:** FR-6 / AC-6
  - **Test gap:** none (docs validator already checks link/anchor integrity)
- **F2 — Decision record still says BGM rights are unresolved**
  - **File:** `docs/product-intent.md:83-86,91,111`
  - **What:** The Decision 4 consequence says rights "must be resolved in a
    later phase", the artifact table says "BGM rights resolution outstanding",
    and Sequencing says it "remains a tracked follow-up". All three contradict
    the refreshed Overview and the completed Phase 3 replacement.
  - **Why:** The central decision record self-contradicts on a material legal
    fact and leaves stale decision wording of the exact kind the gate removes.
  - **Fix:** State in all three places that rights were resolved on 2026-11-20
    by replacing the loop at the same path with a CC0-licensed "Calm Loop" by
    wipics, attributed in `docs/audio-attribution.md`; drop the three stale
    phrases.
  - **Requirement:** FR-1 / FR-7 / AC-1
  - **Test gap:** none

### Low

- **F3 — Privacy labels still describe the audio asset as untraceable**
  - **File:** `docs/store-privacy-labels.md:66-68`
  - **What:** The consistency section refers to "the one audio asset with
    untraceable provenance".
  - **Why:** Stale factual phrasing in a prepared legal artifact; harmless to
    the privacy claims but inconsistent with the final attribution record.
  - **Fix:** Rephrase to reference the provenance investigation and its CC0
    resolution, and state it has no bearing on data collection.
  - **Requirement:** FR-6 / AC-5
  - **Test gap:** none
- **F4 — Roadmap planning assumption still frames Phase 3 as pending**
  - **File:** `conductor/product.md:142`
  - **What:** "Distribution stays private/small until Phase 3 decides
    otherwise." Phase 3 ran on 2026-11-20 and decided family-only.
  - **Why:** A reader of the assumptions is told a decision is still pending
    when it has been made; the practical outcome is unchanged.
  - **Fix:** State that distribution stays private/small and Phase 3 confirmed
    family-only on 2026-11-20 (see §10.4).
  - **Requirement:** FR-8 / AC-8
  - **Test gap:** none

## Overrides

- <none>

## Plan compliance

All four planned phases are marked `verified`, each with a Result, Checkpoint
and Evidence path. All nine planned tasks are `[x]`. The final non-conductor
diff stays within the union of phase `Touches` apart from the two deviations
already recorded in `verification/phase-4.md`: shipping the upstream Baloo 2
`OFL.txt` and refreshing the BGM note in `docs/product-intent.md`. Review
findings F1–F4 identify additional stale wording that these deviations missed;
they will be handled in Phase R1, which will be appended to the plan under the
review skill.

## Out of scope

- Store submission, TWA/Capacitor packaging and store assets.
- i18n, keyboard/switch input and OS zoom support — explicitly decided against.
- Runtime feature work beyond the in-place BGM binary replacement.

## Debt

- <none yet — strict mode requires all four findings to be fixed in Phase R1.>

## Doc sync

`pending` — no post-review documentation changes yet.

## History

| Round | Verdict | Critical | High | Medium | Low | Fixed |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | PASS WITH FINDINGS | 0 | 0 | 2 | 2 | 0 (Phase R1 pending) |
