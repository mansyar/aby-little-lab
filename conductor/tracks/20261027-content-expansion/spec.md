# Content Expansion — Words, Stories, Scenarios — Specification

> Requirements are stable. Once an `FR`, `NFR`, or `AC` ID is approved, do not
> renumber it. If a requirement is removed, mark it `Withdrawn` instead of
> deleting it.

## Overview

Grow the three finite content pools — WORD_POOL (18 items), Story Order
stories (11: 5 obvious + 6 subtle), and Feelings Faces scenarios (24: 6 per emotion) — with a moderate batch of
phonics-safe, difficulty-band-fitted items plus new Storybook Flat SVG art, so
repeat playthroughs feel fresh without touching any game engine code.

## Problem / Motivation

Kids replay the same 22 games daily. The word, story, and feelings pools are
the smallest content bottlenecks: WORD_POOL repeats within a few 6-round
sessions, Story Order's 11 stories become predictable, and the 24 feelings
scenarios exhaust the contrast ladder quickly. If unsolved, replay variety
stagnates and the adaptive-difficulty system has less headroom to band new
items. Parents see repetition; kids disengage.

## Goals & Success Metrics

- **Goal:** Ship a moderate batch of new words, stories, and scenarios that fit existing difficulty bands and art pipeline.
- **Metric:** WORD_POOL 18→~28, stories 11→~15, scenarios 24→~32 (exact counts recorded at implementation); full suite green (2781+ tests); adaptive ±1 band behavior unchanged; bundle/perf budgets unregressed.

## Scope

### In Scope

- Expand WORD_POOL with phonics-safe, TTS-safe words fitting easy-first 3→4-letter bands
- Expand Story Order pool keeping obvious→subtle ordering, 3 panels per story
- Expand Feelings Faces scenarios keeping contrastive→confusable ladder
- New Storybook Flat SVG art + tiered rasters for every new visual
- Banding/adaptive re-verification and docs count sync (PRD/product)

### Out of Scope

- No engine changes (GameSceneBase, DragBoard, adaptive engine, Hub untouched)
- No new game mechanics
- No localization of new text

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | WORD_POOL grows by a moderate batch of phonics-safe, TTS-safe words placed in existing easy-first bands | must |
| FR-2 | Story pool grows by a moderate batch of stories in obvious→subtle order, each with 3 panels | must |
| FR-3 | Feelings scenario pool grows by a moderate batch on the contrastive→confusable ladder | must |
| FR-4 | Every new visual ships Storybook Flat SVG art with tiered rasters | must |
| FR-5 | Existing difficulty banding and adaptive ±1 band behavior are preserved; no engine code changes | must |
| FR-6 | No duplicate entries across pools; missing art falls back to placeholder | should |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | All new art complies with docs/SVG_STYLE.md (Storybook Flat) |
| NFR-2 | New words are TTS-safe: no homophones or hard consonant clusters beyond current pool level |
| NFR-3 | Bundle/perf unregressed: shell ≤200kB gzip, boot/tap budgets hold, precache delta proportionate |
| NFR-4 | Accessibility unchanged: spoken rules, RoundNarrator, color-independent cues, reduced-motion aware art |
| NFR-5 | No storage schema change; no save migration |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | WORD_POOL count increases by the approved batch; all new words phonics/TTS-safe and band-placed | FR-1 |
| AC-2 | Story pool count increases; new stories ordered obvious→subtle with 3 panels each rendering | FR-2 |
| AC-3 | Feelings pool count increases on the contrast ladder; rounds build correctly | FR-3 |
| AC-4 | Every new visual has Storybook Flat SVG + tiered raster; SVG_STYLE check passes | FR-4 |
| AC-5 | Adaptive banding suite green; difficulty progression unchanged for existing items | FR-5 |
| AC-6 | No duplicates; placeholder fallback verified; full test suite + bundle/PWA/docs gates green | FR-6 |

## Edge Cases

- Duplicate word/story/scenario entry is rejected at data level
- TTS-unfriendly word (mispronunciation, homophone) is rejected during content review
- Missing art key falls back to placeholder without crashing the round
- Adaptive MIN_SAMPLE / ±1 band re-verified per affected game after pool growth
- Offline/pre-cache includes new art chunks; validate-pwa passes

## Dependencies

- **Tracks:** none
- **External:** none (device TTS only; no new services or credentials)

## Open Questions & Assumptions

- **Assumption:** Moderate batch means ~10 words, ~4 stories, ~8 scenarios; exact counts finalized during Phase 1–3 implementation.
- **Assumption:** New art reuses existing art group patterns (animals/food/faces/items) extended in Storybook Flat style.
- **Assumption:** Base is master @ f28aa392 (v1.22.0 FINAL); no uncommitted work.

## References

- src/game/wordLogic.ts (WORD_POOL, 18 items)
- src/game/storyOrderLogic.ts + src/game/storyOrderArt.ts (11 stories: 5 obvious + 6 subtle; 33 panels)
- src/game/feelingsFacesLogic.ts (24 scenarios, 6 per emotion) + src/game/art/faces.ts (4 shared face cards)
- src/game/art/ + docs/SVG_STYLE.md
- docs/PRD.md §3 (games), conductor/product.md game table
