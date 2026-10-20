# Review — Shared Choice-Round Shell + Audio Focus

- **Track:** `20261020-scene-audio-shell`
- **Type:** refactor
- **Branch:** `refactor/20261020-scene-audio-shell`
- **Range:** `c92e5c481b1f87e8b28f1d30eb4e8989156253fb..2c80a11`
- **Date:** 2026-10-20
- **Verdict:** PASS

## Summary

The track delivers what its spec promised: one choice-round implementation for
thirteen games, one narrator for every prompt glyph and rule line, one audio
policy that ducks the BGM under narration, and a play clock that no longer
charges hidden time. No Critical or High finding. The reviewer traced the two
paths that could have produced one — a duck left applied after a scene shutdown,
and an unguarded index in `GroupMathScene.wiggleTargets` — and both are sound:
`speech.ts` keeps ownership of the utterance so the terminal event still fires,
the watchdog covers engines that swallow it, and `GroupMathScene` always builds
a target plus three distractors.

Two Medium findings are traceability gaps rather than defects: five games gained
a success flash the deviation log never recorded, and the shared scene chunk
grew past NFR-1's per-chunk clause while the net payload and shell budget held.
Five Low findings follow. All seven are fixable inside this track, so Phase R1
was opened rather than filing issues.

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| Static | `pnpm check` | pass — 199 files, 1 pre-existing warning, 1 schema info | run at `4b36d5a`; code identical at HEAD |
| Static | `pnpm typecheck` | pass | same |
| Unit | `pnpm test -- --run` | pass — 100 files, 2,148 tests | same |
| Unit | `pnpm test:coverage` | pass — 98.07 / 90.28 / 98.15 / 98.93 vs 90 / 85 / 88 / 95 | same |
| Build | `pnpm build` | pass — 271 modules | same |
| Build artifact | `node scripts/validate-bundle.js` | PASS — shell 192.4 kB ≤ 200 kB | same |
| Build artifact | `node scripts/validate-pwa.js` | PASS — 15/15 | same |
| Contract | `git grep "new SpeakerButton" HEAD -- src` | one production hit, `RoundNarrator.ts:196` | reviewer |
| Contract | `git grep "handleCorrect\|handleIncorrect" HEAD -- src/scenes` | `ChoiceRoundScene.ts` only | reviewer |
| Contract | `git grep "extends ChoiceRoundScene\|extends GroupMathScene"` | 11 direct + 2 via `GroupMathScene` = 13 | reviewer |
| Contract | `git diff --stat base..HEAD -- src/__tests__` | 4 files, +1,170/−1 | reviewer |

## Requirements

Every FR (1–10), NFR (1–8) and AC (1–9) is covered by an implementing task and a
verifying test or artifact, with two exceptions recorded as findings:

| ID | Status | Note |
| --- | --- | --- |
| FR-1 … FR-10 | covered | see `verification/integrated.md` for the per-requirement mapping |
| NFR-1 | partial | shell and both validators pass; the `GameSceneBase` chunk grew +2.08 kB past the per-chunk clause → **M2** |
| NFR-2 | covered | test diff is additions only; the single deleted line is an `import` rewritten in place |
| NFR-3 | covered | no dependency or asset change |
| NFR-4 | covered | reduced-motion branch drives wiggle and dot pop as before |
| NFR-5 | partial | advance/auto-return/order hold; six games gained the shared 250 ms flash → **M1** |
| NFR-6 | covered | duck never persisted; settings schema untouched |
| NFR-7 | covered | check and typecheck clean apart from the pre-existing warning |
| NFR-8 | covered | all four gates met; narrator, base and play-time logic covered directly |
| AC-1 … AC-9 | covered | re-verified by the reviewer with fresh greps and the artifact checks |

## Findings

### Medium

**M1 — the success flash was added to five games and recorded for one.**
`src/scenes/ChoiceRoundScene.ts:218-221`. The base flashes the tapped card for
250 ms on every correct tap. Alphabet, Word Match, Decode It, First Sounds and
Feelings Faces had no success fill before this track (no `SUCCESS_COLOR`,
`0x68d391` or `setFillStyle` reference at the base commit), so all five changed
observable behaviour; only Pattern Builder's change was written down.
*Why it matters:* the phase evidence claims "no deviations" for the four Phase 2
games, so the record misdescribes what shipped.
*Fix:* record the flash as a deliberate unification — the same success colour
and duration every other choice game already used — in the Phase 2 evidence, the
integrated verification, the spec's NFR-5 note and the product changelog.
*Requirement:* NFR-5. *Test gap:* none, the behaviour is covered by the base
suite and the unchanged scene suites.

**M2 — the shared scene chunk exceeded NFR-1's per-chunk clause.**
`src/scenes/GameSceneBase.ts:8-9` imports `RoundNarrator` statically, so the
shared game chunk grew 5.90 → 7.98 kB (+2.08 kB) against a "+1 kB per lazy game
chunk" clause, while every scene chunk shrank and the shell entry stayed inside
its ceiling. *Why it matters:* a requirement clause is missed and the evidence
says "met with a caveat", which is neither a pass nor a waiver.
*Fix:* amend NFR-1 with a dated note expressing the budget as game payload with
the measured net figure and the shared-chunk exception, and restate the
integrated row as met-with-waiver.
*Requirement:* NFR-1.

### Low

**L1 — the base test name contradicts the ordering it should pin.**
`src/__tests__/scenes/choiceRoundScene.test.ts:390-398` says "after the shared
feedback" while `onCorrect` now runs before the cheer and the dot. Rename it and
assert the order with a marker.

**L2 — the pre-init duck test asserts something unrelated.**
`src/__tests__/audio/AudioManager.test.ts:659-664` asserts that
`speechSynthesis.cancel` was not called, which says nothing about ducking. Pin
the real contract: no audio element, no watchdog timer, no throw.

**L3 — one scene still reads storage directly.**
`src/scenes/NumberOrderScene.ts:293` uses `load().settings.sfxEnabled` where the
other twelve migrated scenes use `getSettings()`.

**L4 — `refreshCaptionFallback()` bypasses the glyph rebuild.**
`src/components/RoundNarrator.ts:128-132` assigns `captioning` directly. That is
deliberate — the scene reads `isCaptioning` to decide whether to speak its own
scenario, and notifying mid-render would double-speak — but nothing in the code
says so. Document the contract instead of changing the behaviour.

**L5 — the touch floor is not centred on sub-96 px cards.**
`src/scenes/ChoiceRoundScene.ts:154-162` anchors the inflated rect at `(0, 0)`,
so a card narrower than the floor would get the extra area on its right and
bottom. No current card is under 128 px, so behaviour is unchanged today; centre
it for the next game and pin it with a test.

## Plan compliance

Every phase carries a Result, a Checkpoint and an Evidence path, and every
`[x]` task maps to real changes in the diff. The changed `src/` set sits inside
the union of the phases' `Touches` lists, with `sceneRegistry.ts` and
`HubScene.ts` deliberately untouched and documented as such. Two bookkeeping
holes are fixed in Phase R1: Pattern Builder has no task id in Phase 3's task
list, and M1/M2 were not recorded as deviations.

## Out of scope

- The duplicate `## Changelog — Game 20` sections and the stale "18 mini-games"
  line in `conductor/product.md` (both pre-existing).
- `scripts/render-svg-contact-sheets.mjs` has no `feelings` category, so the four
  face SVGs still appear on no contact sheet (pre-existing, filed with the
  previous track's review).
- The BGM duck level (8 %) and ramp (120 ms) need a real-device ear check; that
  is a manual exception in the workflow config, not a code finding.

## Debt

None. All findings are addressed in Phase R1.

## Doc sync

updated — README (structure, spoken rules, audio focus, play time),
`conductor/tech-stack.md` (bases, narrator, audio policy, tree) and
`conductor/product.md` (play-time bullet, audio section, changelog).

## History

| Round | Verdict | Findings | Fixed |
| --- | --- | --- | --- |
| 1 | PASS WITH FINDINGS | 2 medium, 5 low | Phase R1 |
| 2 | PASS | 0 remaining | four record nits corrected during the re-review |

## Round 2 (re-review)

The re-reviewer checked the fix delta `5709e77..HEAD` against every original
finding and closed all seven, each at a specific line:

- **M1** closed — the product changelog, the Phase 2 evidence subsection and the
  integrated NFR-5 row now agree, and the base commit confirms six games gained
  the flash (Feelings Faces had only the splash on a correct tap).
- **M2** closed — `spec.md` carries the dated NFR-1 amendment; the arithmetic is
  self-consistent (shared 7.98 kB + 21 scene chunks 64.44 kB = 72.42 kB payload;
  76.81 kB with the two choice-base chunks; shell 192.4 kB of 200 kB).
- **L1** closed — the renamed test asserts the exact order
  `["correct:0", "cheer", "dot"]` and fails against the pre-fix order.
- **L2** closed — the pre-init test now pins no element, no timer and no throw.
- **L3** closed — `NumberOrderScene` reads `getSettings()`; `getSettings()` is
  `load().settings`, so behaviour is identical and the tap no longer re-parses
  the blob.
- **L4** closed — the docstring states the contract; behaviour untouched.
- **L5** closed and verified inert — every shipped card is ≥ 128 px, so the
  centring offset is exactly zero; the new `SmallCardScene` case takes the
  sub-floor path with a 96×96 rect at `(-16, -16)`.

Four new Low record nits were raised in that round (an absent NFR-5 note, a
stale "flash preserved" bullet, a stale test count, and a docstring that
over-claimed when the glyph rebuilds). All four were corrected in the re-review
commit — documentation and one comment, no behaviour change. `pnpm check`,
`pnpm typecheck` and 2,149 tests pass on the final tree.
