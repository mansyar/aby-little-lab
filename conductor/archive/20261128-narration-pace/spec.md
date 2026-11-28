# Add a parent control for narration pace — Specification

> Requirements are stable. Once an `FR`, `NFR`, or `AC` ID is approved, do not
> renumber it. If a requirement is removed, mark it `Withdrawn` instead of
> deleting it.

## Overview

Parents get a textless-friendly three-preset narration pace control (Slower / Gentle / Standard) in the parental-gate Settings panel next to the voice preference. The choice is stored per child profile, applies to every spoken utterance, and defaults to Gentle — today's exact rates — so existing profiles hear no change.

## Problem / Motivation

Speech rates are hardcoded (`0.9` letters/numbers/sentences, `0.8` words in `speech.ts`). A 3-year-old and a 6-year-old hear the same pace and no parent can change it. Too fast loses the youngest; too slow bores the oldest into tuning out the instructions the games depend on.

## Goals & Success Metrics

- **Goal:** A parent can set narration pace per child in under 30 seconds.
- **Metric:** Changing the preset changes the `rate` of the next dispatched utterance for every `speak*` function; the choice survives reload and backup/restore; untouched profiles behave byte-for-byte as today (unit + settings-panel journey green).

## Scope

### In Scope

- Three-preset pace control in Settings (parental gate), beside voice preference
- Per-profile persistence (additive `Profile` field, backfilled to Gentle)
- Applying the preset to all four speak paths (letter, word, number, sentence)
- Backup export/restore carrying pace; unknown/absent values normalise to Gentle

### Out of Scope

- Pitch, voice selection, language (voice choice already exists; English permanently per product intent)
- BGM duck timing or audio-focus policy changes
- Child-reachable or in-game pace control (stays behind the parental gate)
- New art assets (reuse existing icons/text labels)

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | Settings panel behind the parental gate offers three pace presets — Slower, Gentle, Standard — selectable for the active profile | must |
| FR-2 | The active profile's preset scales the `rate` of every utterance from `speakLetter`, `speakWord`, `speakNumber`, `speakSentence`; mapping — Slower 0.7/0.6, Gentle 0.9/0.8 (unchanged), Standard 1.0/1.0 | must |
| FR-3 | Pace persists per profile across reloads; profiles stored without a pace read as Gentle | must |
| FR-4 | Backup export includes each profile's pace; restore (merge or replace) leaves every profile with a valid pace, defaulting to Gentle when absent | must |
| FR-5 | SFX-off silences speech and unsupported browsers stay visual-only, exactly as today | must |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | No new dependencies, no storage schema version bump (additive field with backfill, `diagnostics` precedent) |
| NFR-2 | No new art assets; bundle and texture budgets unchanged |
| NFR-3 | All preset rates stay within the intelligible 0.5–1.0 platform band |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | Selecting each preset in Settings dispatches the next utterance at the mapped rate (unit: utterance `rate` per preset) | FR-1, FR-2 |
| AC-2 | All four speak paths scale under Slower and Standard relative to Gentle | FR-2 |
| AC-3 | Reload with a stored Slower pace still speaks slow; a legacy profile without the field speaks at Gentle rates | FR-3 |
| AC-4 | An exported backup contains the pace; restoring it onto a fresh device reproduces the pace | FR-4 |
| AC-5 | Corrupt/unknown stored pace normalises to Gentle; SFX-off and speech-unsupported paths unchanged | FR-5 |

## Edge Cases

- Mid-utterance preset change applies to the *next* utterance, never retroactively
- Switching active profiles applies the newly active profile's pace immediately
- Hand-edited storage with an unknown pace string falls back to Gentle (normaliser, `preferredVoiceURI` precedent)

## Dependencies

- **Tracks:** none
- **External:** none (Web Speech API already in use)

## Open Questions & Assumptions

- **Assumption:** Parent-facing Settings may use words for the preset labels — the Progress overview already reports full sentences to parents, so this is consistent, not a textless-stance break
- **Assumption:** The FR-2 rate mapping is locked by spec approval

## References

- `src/utils/speech.ts` (hardcoded rates, `setPreferredVoiceURI` precedent)
- `src/types/index.ts` (`Settings`, `Profile`, `ProfileV2`)
- Roadmap RM-8
