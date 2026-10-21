# Audio Variety & Feedback Depth — Specification

> Requirements are stable once approved. If a requirement changes, mark the old
> one `Withdrawn` and add a new ID — never renumber.

## Overview

All 22 mini-games currently share identical synthesized feedback cues from the
`AudioManager` singleton, so the suite sounds uniform no matter which game a
child is playing. This track gives each game a **fixed sonic identity** for the
feedback trio (correct / incorrect / win) via a central identity table resolved
by the existing Web Audio synth. No new audio assets, no new cue types, no BGM
changes — pure synthesis-parameter variety driven by the game's `gameId`.

## Problem / Motivation

The per-game juice animations landed visual variety, but sonically every
correct answer, incorrect nudge, and win celebration sounds identical across
all 22 games. The suite has a single BGM loop and 6 synthesized SFX
(`pop`, `correct`, `incorrect`, `wake`, `win`, `sticker`). Because audio is a
core part of the audio-visual pairing guideline, sonic sameness flattens the
sense that each game is its own little world. Per-game sonic identity is
achievable entirely inside the existing synth by varying pitch, timbre, tempo,
and melodic contour per game — no files, no downloads, no offline cost.

## Goals & Success Metrics

- **Goal:** Each game's feedback trio is audibly distinct — a parent playing
  three different games back-to-back can hear they are different games without
  looking.
  - **Metric:** User-audited tuning pass completed; all 22 games carry a
    non-default identity.
- **Goal:** Identities are cheap to tune and deterministic across sessions.
  - **Metric:** One central table (`src/game/audioIdentity.ts`) maps every
    `GAME_REGISTRY` gameId to its identity; resolution is pure and repeatable.

## Scope

### In Scope

- A central identity table `src/game/audioIdentity.ts` mapping
  `gameId → AudioIdentity` for all 22 games in `GAME_REGISTRY`, plus a
  documented default identity for unknown ids.
- AudioManager resolves the feedback trio (correct / incorrect / win) through
  the requesting scene's gameId at play time.
- Parameter space: pitch offset (semitones), timbre (waveform choice),
  tempo/duration multiplier, and per-cue melodic contour variants, with bounded
  documented ranges.
- Formula-derived default identities for all 22 games, followed by a
  user-audited tuning pass **inside this track**.

### Out of Scope

- The BGM loop (stays the single calm loop; ducking behavior unchanged).
- New `SfxName` cue types (the 6-cue vocabulary stays).
- Re-voicing `pop`, `wake`, or `sticker` (positional/meta cues stay universal).
- Per-session randomization of identities.
- Audio asset files of any kind (offline-first synthesis only).

## Functional Requirements

| ID  | Requirement                                                                                                                                          | Priority |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| FR-1 | A central identity table covers all 22 `GAME_REGISTRY` gameIds with a non-default identity, plus a documented default for unknown ids.               | Must     |
| FR-2 | AudioManager resolves the trio's character from the requesting scene's gameId at play time (context registered by `GameSceneBase`); unknown ids fall back to the default; game scenes require no per-scene code changes. | Must     |
| FR-3 | An identity parameterizes pitch offset, timbre, tempo/duration multiplier, and per-cue melodic contour for the trio, with bounded documented ranges. | Must     |
| FR-4 | Identity values ship as formula-derived defaults, then a user-audited tuning pass finalizes the table within this track.                              | Must     |

## Non-Functional Requirements

| ID    | Requirement                                                                                                          |
| ----- | -------------------------------------------------------------------------------------------------------------------- |
| NFR-1 | No-fail audio: the incorrect cue remains a gentle descending tone; per-game character never introduces harsh or negative audio. |
| NFR-2 | The win cue remains within the 300–800 ms celebration duration budget from the product guidelines.                    |
| NFR-3 | Offline-first: synthesis only; the track adds zero audio asset files.                                                 |
| NFR-4 | Behavior preservation: SFX mute, BGM ducking, speech watchdog, and visibility pause behave exactly as today.           |
| NFR-5 | The full verify_phase gate passes; coverage gates 95/88/85/90 hold.                                                   |

## Acceptance Criteria

| ID   | Criterion                                                                                                                                    | Verifies |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| AC-1 | A unit test iterates `GAME_REGISTRY` and proves every one of the 22 gameIds resolves to a non-default identity.                              | FR-1     |
| AC-2 | Unit tests prove trio playback routes through the identity parameters for sampled games, and unknown gameIds fall back to the default voice. | FR-2     |
| AC-3 | Unit tests pin the parameter semantics — pitch applied, waveform chosen, duration scaled, contour honored — for representative identities.   | FR-3     |
| AC-4 | Evidence records the user-audited tuning pass (adjustments vs. formula defaults) and the final full gate green.                               | FR-4     |

## Edge Cases

- Unknown or unregistered gameId → default identity plays; no crash.
- SFX disabled → silence exactly as today (mute path precedes identity).
- Rapid replay (per-game juice taps) → identity resolution is pure and
  deterministic; no state carried between plays beyond the registered context.
- Animal Trace and Pop & Freeze have no wrong-answer path by design — their
  incorrect identities simply never fire.
- Narration ducking with a re-voiced cue → ducking path untouched; identity
  applies only to the trio's synthesis parameters.

## Dependencies

**Tracks:** none active — `20261021-drag-board-shell` (PR #52) and
`20261021-hub-grid-decomposition` (PR #53) are merged.

**External:** none.

## Open Questions & Assumptions

- **Assumption:** The trio's synth construction in `AudioManager` is
  parameterizable without a structural rewrite. If a cue requires
  restructuring, the smallest necessary change is recorded as a deviation.
- **Assumption:** Formula-derived identities are starting points; final values
  are set in the tuning phase (FR-4).
- **Assumption:** "Audibly distinct" is judged by the user's ear during the
  tuning phase; tests assert structure (parameters applied), not aesthetics.

## References

- `conductor/product-guidelines.md` — no-fail design, audio-visual pairing,
  celebration duration budget.
- `conductor/tech-stack.md` — AudioManager architecture, Web Audio synth.
- `src/audio/AudioManager.ts` — SFX_NAMES, playSFX, ducking.
- `src/game/gameRegistry.ts` — GAME_REGISTRY (gameId source of truth).
- `src/scenes/GameSceneBase.ts` — playIncorrect / completeGame wiring.
