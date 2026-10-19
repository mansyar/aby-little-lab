# Phase 1 — Content & logic core

- **Track:** 20261020-feelings-faces — Feelings Faces — Game 21 (Social-Emotional Learning)
- **Phase:** 1 — Content & logic core
- **Date:** 2026-10-20
- **Branch:** `feat/20261020-feelings-faces`
- **Base commit:** `bd074d0c188c380e49b9ade58bc3d5e2c92154e5`
- **Head commit (verified):** `34a734f`
- **Result:** verified

## Commands

Verification command run verbatim as one chain:
`pnpm check && pnpm typecheck && pnpm test -- --run src/__tests__/game/feelingsFacesLogic.test.ts`

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| static | `pnpm check` | 0 | Biome clean. 1 pre-existing warning (`src/__tests__/scenes/musicalMemoryScene.test.ts:294` `noNonNullAssertion`, untouched by this phase) + 1 info (biome.json schema declares 2.5.5, CLI is 2.5.10) |
| static | `pnpm typecheck` | 0 | `tsc --noEmit` clean over `src` (strict) |
| unit | `pnpm test -- --run src/__tests__/game/feelingsFacesLogic.test.ts` | 0 | 1 file / 30 tests passed |
| unit (full chain) | `pnpm check && pnpm typecheck && pnpm test -- --run src/__tests__/game/feelingsFacesLogic.test.ts` | 0 | all three layers green in one run |

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| AC-4 | 20 simulated playthroughs never repeat a scenario within a run, each run has at least three distinct emotions (FR-5) | `drawScenarios` tests — "never repeats a scenario within a run and covers every emotion over 20 runs" (asserts 6 unique ids and all 4 emotions for seeds 1–20), "draws the same playthrough for the same seed" (seeds 1–20), "varies the draw across seeds" | pass |
| AC-5 | Rounds 1–3 and rounds 4–6 produce the documented contrast pairs (FR-6) | `ROUND_CONTRASTS` tests — "opens with the maximally distinct happy/angry contrast for rounds 1–3", "closes with the confusable sad/scared contrast for rounds 4–6", "pairs two different emotions from the deck", "keeps each third card outside its own pair"; `buildRoundChoices` tests — 3 distinct cards incl. target for every round × target, both pair emotions always present, early/late pair table | pass |
| AC-9 | Every scenario string is in the approved safe-content list and ≤ 60 characters (FR-11) | `SCENARIO_POOL` tests — four scenarios per emotion (16 total), unique ids and lines, length ≤ 60, sentence form; "SCENARIO_POOL safe-content guard" — no injury/loss/violence word from the blocklist, every line ≤ 60 | pass |
| FR-5 | Pool of 16 (4 per emotion); each playthrough draws 6 without repetition | Pool shape test + 20-run draw test | pass |
| FR-6 | Easy-first ladder distinct → confusable | `ROUND_CONTRASTS` ladder + per-round table tests | pass |
| FR-11 | Gentle, resolvable everyday situations, no injury/loss/violence | Safe-content blocklist guard test | pass |

## Evidence paths

- Implementation: `src/game/feelingsFacesLogic.ts`
- Tests: `src/__tests__/game/feelingsFacesLogic.test.ts`
- Task commits: `280b5e4` (types + pool), `ae84d0a` (seeded draw), `aa45938` (contrast ladder + round cards), `1a409e1` (round scoring), `34a734f` (tone/20-run guards)

## API delivered

- `Emotion` (`"happy" | "sad" | "angry" | "scared"`), `EMOTIONS`, `Scenario`
- `SCENARIO_POOL` — 16 scenarios, 4 per emotion, all ≤ 60 characters
- `ROUND_COUNT` (6), `drawScenarios(rng?)` — injectable `() => number`, defaults to `Math.random`
- `ContrastKind`, `RoundContrast`, `ROUND_CONTRASTS`, `buildRoundChoices(roundIndex, target)`
- `RoundState`, `AnswerResult`, `answer(round, emotion)` — pure, never mutates, `nextRound` stays put on a wrong tap (`ROUND_COUNT` after the last correct tap = playthrough complete)

## Deviations

None. Only the two `Touches` paths were created or modified.

## Notes

- No import of Phaser, DOM, storage, or timers: the module is pure, and the draw takes an injected RNG so tests are deterministic (seeded LCG in the suite).
- Ladder mapping follows the spec's Open Questions assumption: rounds 1–3 contrast happy vs. angry (maximally distinct), rounds 4–6 contrast sad vs. scared (confusable). FR-6's parenthetical also lists "happy vs. angry" among the late contrasts; the approved spec assumption and the plan design note both assign happy/angry to the early phase, so that reading was implemented.
- Round cards = the round's contrast pair plus the target; when the target is already in the pair, the ladder's designated third card (sad for early rounds, happy for late rounds) fills the third slot. This always yields three distinct emotions with the target present, without needing an RNG.
- `answer(round, emotion).taps` is the round's cumulative tap count after the answer (correct and wrong combined); the scene should carry it into the round state and reset it on advance.
- Coverage was not part of this phase's command; the suite exercises every exported function and both sides of every conditional.
