# Phase 2 Verification — Synthesis application

- **Track:** 20261021-audio-variety
- **Phase:** 2 — Synthesis application
- **Date:** 2026-10-21
- **Branch:** feat/20261021-audio-variety
- **Base commit:** b3f6b92
- **Head commit:** 3e29447 (style(audio): sort trio identity import specifiers for biome)
- **Result:** verified

## Commands

| Layer | Command | Exit code | Summary |
|---|---|---|---|
| Lint | `pnpm check` | 0 | Clean; only pre-existing findings left untouched (biome.json schema info; `musicalMemoryScene.test.ts` noNonNullAssertion warning) |
| Types | `pnpm typecheck` | 0 | `tsc --noEmit` clean |
| Tests (targeted) | `pnpm test -- --run src/__tests__/audio/AudioManager.test.ts src/__tests__/game/audioIdentity.test.ts` | 0 | 100 passed (74 pre-existing AudioManager + 9 audioIdentity + 17 new trio synthesis/guard tests) |
| Tests (full suite, healthy load) | `pnpm test -- --run` | 1 | Runs 1–2 (with this phase's code already committed): 2462/2463 passed; sole failure the documented environmental `hubEngagement.test.ts` 5 s machine-load timeout. `hubEngagement.test.ts` passes 66/66 in isolation. |
| Tests (full suite, loaded machine) | `pnpm test -- --run` | 1 | Run 3, after a hung `--maxWorkers=2` attempt left orphaned workers loading the machine: widespread 5–27 s timeouts in unrelated pure-logic sampling tests (wordLogic, countLogic, takeAwayLogic, …) + 27 vitest worker-spawn failures — machine-load degradation, zero assertion failures. |
| Tests (full suite, brief-prescribed fallback) | `pnpm test -- --run --maxWorkers=2` | 0 | **117 files / 2463 tests, all passed** (279.69 s). Confirms every full-suite failure above was environmental machine load, not code. |

The phase verification command was executed as its three component commands (`pnpm check`, `pnpm typecheck`, `pnpm test -- --run`) because the sandbox permits only single simple commands; each layer's exit code is recorded above, and the green `--maxWorkers=2` run covers the test layer exactly as the brief's fallback prescribes.

## AC table

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| AC-3 | Tests pin parameter semantics — pitch applied, waveform chosen, duration scaled, contour honored — for representative identities | `src/__tests__/audio/AudioManager.test.ts` → describe "trio identity synthesis": pitch ("how-many" +5 → semitone ratios 5/10/14 above C5), waveform ("pop-freeze" square, "shadow-match" sawtooth), tempo (slow 1.25 "musical-memory", fast 0.75 "shape-sorter" spacing+durations), contour ("pop-freeze" [0,5,9] at pitch −3 → −3/2/6 above C5), plus a default-identity fixed-point test pinning today's exact voices (frequencies, sine, gains, timing) and a determinism test | Pass |
| NFR-1 | Incorrect cue stays a gentle descending tone for every identity | Iterates all 22 `AUDIO_IDENTITIES` through `playIncorrect`: per-note frequencies non-increasing, descent ≤ 1 octave below the cue's transposed anchor. Guard implemented as pure `descendingContour` (flattens rising contours, caps descent at ±12 st); guard unit-tested directly in "trio no-fail guards" | Pass |
| NFR-2 | Win cue stays within the 300–800 ms celebration budget for every identity | Iterates all 22 identities through `playWin`: last-note end ∈ [0.3, 0.8] s (±1e-9 float tolerance). Budget clamp implemented as pure `winTempoForBudget` (unit-tested directly) + integration tests that force tempo 1.5 → clamped end 0.8 s and tempo 0.4 → clamped end 0.3 s through the real `playWin` path via a `resolveTrioIdentity` spy | Pass |

## Deviations

- None. All changes are inside Touches (`src/audio/AudioManager.ts`, `src/game/audioIdentity.ts`, `src/__tests__/audio/AudioManager.test.ts`) plus this evidence file.

## Notes

**Parameter → synth mapping (natural fit, no structural rewrite):**

- **Contour** — each cue keeps its anchor note (correct/win: C5 523.25 Hz, incorrect: G4 392 Hz); contour offset *n* maps to `anchor * 2^((n + pitch) / 12)`. The default identity's contours [0,4,7] / [0,−7] / [0,4,7,12] reproduce today's hardcoded C5/E5/G5, G4/C4, and C5/E5/G5/C6 to within 0.01 Hz of equal-temperament rounding (pinned by the fixed-point test).
- **Pitch** — global transposition added to every contour offset before the semitone ratio (uniform, so relative shapes are preserved).
- **Timbre** — `identity.waveform` passed through to `oscillator.type`; `playTone` gained an optional waveform parameter defaulting to `"sine"`, so `pop`/`wake`/`sticker`/idle-call/frog notes are untouched.
- **Tempo** — scales both note spacing (start offsets) and note durations. Per-cue base timing lives in `TrioVoice` constants (correct/incorrect: 0.12 s steps, 0.15 s notes, 0.2 s final; win: 0.1 s steps, 0.12 s notes, 0.25 s final), so today's spacing is exact at tempo 1.
- **Gains** — untouched (0.3 / 0.2 / 0.3); not part of the identity schema.

**Clamping decisions:**

- **NFR-2 win budget:** the clamp lives in pure `winTempoForBudget(tempo, baseEndSeconds)` in `audioIdentity.ts`: tempo is clamped into `[WIN_MIN_END_SECONDS / baseEnd, WIN_MAX_END_SECONDS / baseEnd]` = [0.545, 1.4545] for today's 0.55 s base end. The synth computes `baseEndSeconds` from the actual contour length (so a longer tuned contour also stays in budget). The lower clamp never fires under the documented 0.75–1.5 tempo range (min possible end = 0.4125 s) but guards future tuning.
- **NFR-1 descending guard:** pure `descendingContour(offsets)` first clamps each offset into ±12 st (reusing Phase 1's `clampContour`), then forces the sequence non-increasing from the anchor: a rising tuned contour collapses onto its predecessor's level instead of inverting the cue. Applied in `playIncorrect` only; correct/win keep their tuned shapes.
- **Determinism:** pure functions, no randomness; `identityForGameId` fallback for unknown/absent context means `playCorrect`/`playIncorrect`/`playWin` never throw.

**Untouched (per contract):** `pop`, `wake`, `sticker`, frog notes, BGM, ducking, speech watchdog, visibility pause. All 74 pre-existing AudioManager tests pass unchanged.

## Primary verification

- **Command:** `pnpm check && pnpm typecheck && pnpm test -- --run` (test layer via the documented stable configuration `--maxWorkers=2`)
- **Exit code:** 0 on all three layers (biome check 0; tsc clean; **117 files / 2,463 tests passed**, 279.69 s)
- **Summary:** Diff `b3f6b92..3e29447` matches Touches exactly (3 files); no deviations. 16 new tests (trio identity synthesis + no-fail guards + default fixed-point + determinism). Default-identity fixed point pinned against today's exact voices. NFR-1/NFR-2 guards iterated over all 22 identities. The subagent's earlier full-suite failures were re-confirmed as environmental machine load by the primary's own green `--maxWorkers=2` run. Acceptance: FR-3 + AC-3 + NFR-1 + NFR-2 satisfied for the application layer; all 22 games now audibly distinct at the formula-derived stage.
- **Note:** The subagent's background verification run could not report back into its closed session; the primary re-ran the full gate itself as above.
