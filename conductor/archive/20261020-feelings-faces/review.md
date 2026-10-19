# Review: Feelings Faces — Game 21 (Social-Emotional Learning)

- **Track:** `20261020-feelings-faces`
- **Type:** `feature`
- **Branch:** `feat/20261020-feelings-faces`
- **Range:** `cce1bf8..cc12e1e`
- **Date:** `2026-10-20T09:40:00+07:00`
- **Verdict:** `PASS`

## Summary

The track is ready. All 11 FRs, 7 NFRs and 10 ACs are mapped to plan tasks and
tests; the implemented contrast ladder follows the approved spec assumption
(rounds 1–3 maximally distinct happy/angry, rounds 4–6 confusable sad/scared),
and AC-4 is exceeded (every draw covers all four emotions). Three review rounds
found five behavioural defects in the voice-settle state machine plus four
documentation/comment nits; all were fixed and re-verified. The final state has
no open findings.

## Verification

Primary agent runs on the reviewed range:

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| test | `pnpm test -- --run` | pass — 98 files / 2,092 tests at `cc12e1e` | shell output 2026-10-20 09:33 |
| coverage | `pnpm test:coverage` | pass — lines 98.99 / functions 97.97 / branches 89.65 / statements 98.15 (at `34b2f22`, re-run before review fixes) | `verification/phase-4.md` |
| lint | `pnpm check` | pass — 1 pre-existing warning (`musicalMemoryScene.test.ts:294`) + biome schema-version info | shell output |
| typecheck | `pnpm typecheck` | pass | shell output |
| build | `pnpm build` + `validate-bundle.js` + `validate-pwa.js` | pass — shell entry 189.3 kB ≤ 200 kB, FeelingsFacesScene chunk 5.64 kB, precache 42 entries / 1668.25 KiB, PWA 15/15 (at `34b2f22`; review fixes touch only the scene and its tests) | `verification/phase-4.md` |

Reviewer-side checks (rounds 1–3): typecheck clean, targeted scene suites green,
`pnpm check` exit 0. Manual smoke verification (real Chrome via the dev server)
is recorded in `verification/phase-3.md`.

## Requirements

| ID | Implemented by | Verified by | Status |
| --- | --- | --- | --- |
| FR-1 | P3 | `feelingsFacesScene.test.ts`, `feelingsFacesFlow.test.ts` | covered |
| FR-2 | P3 | `feelingsFacesScene.test.ts` (speech + caption) | covered |
| FR-3 | P3 | `feelingsFacesLogic.test.ts`, scene tests (3 distinct cards incl. target) | covered |
| FR-4 | P3 | `feelingsFacesLogic.test.ts`, flow suite (6 rounds) | covered |
| FR-5 | P1 | `feelingsFacesLogic.test.ts` (pool shape, ≤ 60 chars, safe content) | covered |
| FR-6 | P1 | `feelingsFacesLogic.test.ts` (contrast ladder; clarified against the approved assumption) | covered |
| FR-7 | P3 | scene tests (chime/splash/advance; wiggle/tone/re-speak) | covered |
| FR-8 | P3 | scene tests (caption fallback incl. async-voice engine) | covered |
| FR-9 | P2, P3 | `feelingsFacesSvg.test.ts`, preload/hub tests, sticker flow | covered |
| FR-10 | P3 | scene + progress tests (plays/accuracy/mastery star) | covered |
| FR-11 | P1 | `feelingsFacesLogic.test.ts` (purity, determinism, no repeats) | covered |
| NFR-1..3, 6 | P4 | flow suite + full CI parity | covered |
| NFR-4, 5, 7 | P2 | `feelingsFacesSvg.test.ts` (incl. 8,636 B ≤ 40 KB payload guard) | covered |
| AC-1..10 | P1–P4 | per-phase evidence files; mapping verified by the reviewer in round 1 | covered |

## Findings

All findings below were raised and **fixed**; none remain open.

### Critical

- <none>

### High

- <none>

### Medium

- **R1-F1 — synchronous `getVoices()` misclassification**
  - **File:** `src/scenes/FeelingsFacesScene.ts` (caption fallback decision)
  - **What:** a cold Chrome/WebView returns an empty voice list until `voiceschanged` fires, so the first visit could be misclassified as voiceless and mute speech for the whole session.
  - **Fix:** empty first read is now "unknown" (spoken path kept); the caption fallback engages only after `voiceschanged` settles an empty list; engines without the event decide immediately. Fixed in `f80f0ab` with a listener-driven test.
- **R2-F1 — settled-empty engine left the displayed round silent**
  - **File:** `src/scenes/FeelingsFacesScene.ts` (`handleVoicesChanged`)
  - **What:** the settle handler only stored state, so a round already on screen kept `captionFallback = false` — no speech, no caption, until the child advanced.
  - **Fix:** `applyCaptionState()` re-evaluates the displayed round on settle and applies the fallback in place (round 2 fix `df4f74f`; confirmed resolved in round 3).
- **R3-F1 — uncancelled opening-speech timer re-spoke the scenario**
  - **File:** `src/scenes/FeelingsFacesScene.ts` (`speakScenario` / `applyCaptionState`)
  - **What:** after empty→populated settle mid-wait, the pending 2.6 s opening `delayedCall` still fired and the scenario audio restarted mid-sentence.
  - **Fix:** the timer handle is tracked and cancelled before the inline speak; both settle sequences are pinned by tests. Fixed in `cc12e1e`.

### Low

- **R1-F2 / R1-F3 — stale layout comments** in `hubGrid.ts` ("5x4", "(0 or 1)") and `hubPaging.ts` ("5x4") refreshed to the 6×4 / three-page reality in `f80f0ab`.
- **R1-F4 — `integrated.md` acceptance table used shifted AC IDs**; renumbered to the spec IDs and the missing AC-7 row added in `f80f0ab`.
- **R3-F2 — dead-audio churn on flip-to-spoken**: the rebuilt rule line re-queued the rule utterance, which the scenario utterance immediately cancelled; the settle rebuilds now never re-speak the rule (`cc12e1e`).

## Overrides

- Third fix round (beyond the two-round default), approved by the user on
  2026-10-20: the round-3 findings were new regressions in the just-fixed
  voice-settle path with a small, concrete fix; shipping a known double-speak
  bug was declined. Scope: `src/scenes/FeelingsFacesScene.ts` + its test file.

## Plan compliance

All four phases executed and independently verified with checkpoints
`92c5f49` (P1), `e6ff082` (P2), `eb8ecf6` (P3), `34b2f22` (P4); 32/32 tasks
done. Plan adjustments (art-only Phase 2, registration moved atomically into
Phase 3) are recorded as Adjustment notes in `plan.md` and were reviewed as
part of the diff. No task was marked complete without verification.

## Out of scope

- `scripts/render-svg-contact-sheets.mjs` has no `feelings` category, so the
  new faces appear on no contact sheet (future change).
- README's Build-output bullet quotes a stale combined shell figure
  (pre-existing).
- `conductor/product.md` contains two duplicate `## Changelog — Game 20`
  sections (pre-existing; left untouched).

## Debt

- <none>

## Doc sync

`updated` — product.md (row 21, cross-game counts, UX amendment, changelog),
README, `docs/SVG_STYLE.md` §8 and the `textureTiers.ts` header were updated
in Phase 4 (`34b2f22`); no doc changes were required by the review fixes.

## History

| Round | Verdict | Critical | High | Medium | Low | Fixed |
| --- | --- | --- | --- | --- | --- | --- |
| 1 (full track) | PASS WITH FINDINGS | 0 | 0 | 1 | 3 | 4 |
| 2 (fix confirmation) | PASS WITH FINDINGS | 0 | 0 | 1 | 0 | 1 |
| 3 (fix confirmation, override) | PASS WITH FINDINGS | 0 | 0 | 1 | 1 | 2 |
| Final state | PASS | 0 | 0 | 0 | 0 | — |
