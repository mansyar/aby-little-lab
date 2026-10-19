## Summary

Adds **Feelings Faces** as game 21 — the suite's first social-emotional
learning game. Aby appears in four expressions (happy, sad, angry, scared);
each round speaks a short everyday scenario and the child taps the face showing
how Aby feels. Six rounds per playthrough drawn from a 16-scenario pool, an
easy-first contrast ladder (happy/angry first, then the confusable sad/scared
pair), gentle wrong-answer feedback, a heart sticker on first completion, and a
written-caption fallback when no speech voice is available.

## Track

- **ID:** `20261020-feelings-faces`
- **Type:** `feature`
- **Spec:** [`conductor/tracks/20261020-feelings-faces/spec.md`](conductor/tracks/20261020-feelings-faces/spec.md)
- **Plan:** [`conductor/tracks/20261020-feelings-faces/plan.md`](conductor/tracks/20261020-feelings-faces/plan.md)
- **Review:** [`conductor/tracks/20261020-feelings-faces/review.md`](conductor/tracks/20261020-feelings-faces/review.md)

## What happened

| Phase | Goal | Result | Checkpoint | Notes |
| --- | --- | --- | --- | --- |
| 1: Content & logic core | Pure scenario pool, draw, contrast ladder and scoring state machine | verified | `92c5f49` | Injectable RNG; round cards are the contrast pair plus the target |
| 2: Art and asset preload | Six flat SVGs (4 faces, tile, sticker) preloaded and guarded | verified | `e6ff082` | One art-revision pass (preschool proportions, shape-level angry cue); face SVG comments kept ASCII so `btoa()` preload never throws |
| 3: Gameplay scene | FeelingsFacesScene on GameSceneBase + suite registration as game 21 | verified | `eb8ecf6` | Hub reflowed to 6×4 at 144 px with 10+10+1 paging; sticker shelf re-anchored below tile labels |
| 4: Flow, full gate, docs | End-to-end flow suite, suite-wide 21-game expectations, docs | verified | `34b2f22` | product.md/README/SVG_STYLE/textureTiers updated; product.md edits completed by the orchestrator (product docs denied to the phase subagent) |

## Requirements

- [x] `FR-1..FR-4` — round flow, spoken scenario, 3 faces incl. target, six rounds (scene + logic tests)
- [x] `FR-5` — 16-scenario pool, ≤ 60 chars, safe content (`feelingsFacesLogic.test.ts`)
- [x] `FR-6` — contrast ladder: rounds 1–3 happy/angry, 4–6 sad/scared (`feelingsFacesLogic.test.ts`)
- [x] `FR-7` — gentle correct/wrong feedback (scene tests)
- [x] `FR-8` — caption fallback when speech is unavailable (scene tests incl. async voice engines)
- [x] `FR-9` — face/tile/sticker assets, preloaded (`feelingsFacesSvg.test.ts`, preload tests)
- [x] `FR-10` — plays/accuracy + mastery star on the progress row (progress tests)
- [x] `FR-11` — pure logic, deterministic draw, no repeats within a run (`feelingsFacesLogic.test.ts`)
- [x] `NFR-1..7` — 60 fps-friendly tweens, reduced-motion wiggle, ≤ 40 KB art payload (8,636 B), full CI parity
- [x] `AC-1..AC-10` — mapped per phase; see `review.md`

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| unit | `pnpm test -- --run` | pass — 98 files / 2,092 tests | `verification/integrated.md`, `review.md` |
| coverage | `pnpm test:coverage` | pass — lines 98.99 / functions 97.97 / branches 89.65 / statements 98.15 | `verification/phase-4.md` |
| lint | `pnpm check` | pass (1 pre-existing warning) | `verification/phase-4.md` |
| typecheck | `pnpm typecheck` | pass | `verification/phase-4.md` |
| build | `pnpm build` + bundle/PWA validators | pass — shell 189.3 kB ≤ 200 kB, PWA 15/15 | `verification/phase-4.md` |
| smoke | manual Chrome playthrough | pass — hub → 6 rounds → sticker → hub return; caption fallback verified | `verification/phase-3.md` |

## Review

- **Verdict:** `PASS`
- **Rounds:** 3 (plus a user-approved third fix round)
- **Fixed:** 8 findings (3 Medium behavioural, 5 Low docs/comments)
- **Accepted/deferred:** 0 (see `review.md`)

## Deviations and risks

- Hub grid reflowed from 5×4 at 160 px to 6×4 at 144 px (21st tile would
  otherwise fall off the 1024 px canvas); paging went 10+10+1 with a centred
  partial page. Full pages keep their geometry contract via tests.
- `PreloadScene`'s `btoa()` cannot decode non-ASCII SVG comments — the four
  face SVGs use ASCII comments only (would otherwise break boot).
- `GameId` is counted across six suites; all count assertions updated 20→21.
- `FeelingsFacesScene` registers its shutdown handler before
  `registerShutdownCleanup()` so the flow harness's `triggerShutdown` fires it.

## Follow-ups

- none (out-of-scope notes in `review.md`: contact-sheet script has no
  `feelings` category; stale README build figure; duplicate Game 20 changelog
  headings in product.md)

## Rollback

```bash
# Squash-merge commit
git revert --no-edit <merge-commit>
```

No migrations or data changes: new `feelings-faces` key backfills into the
existing per-profile sticker/progress records on load.
