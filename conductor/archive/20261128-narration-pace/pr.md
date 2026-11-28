# PR: Add a parent control for narration pace

## Track

Implements track `20261128-narration-pace`: a parent can set the read-aloud speed per child profile in Settings.

## What changed

- **Pace model + speech wiring (P1):** new `src/game/narrationPace.ts` with `NARRATION_PACES` (`slower`/`gentle`/`standard`), `DEFAULT_NARRATION_PACE`, `NARRATION_RATES` (Slower 0.7/0.6, Gentle 0.9/0.8 — today's exact rates, Standard 1.0/1.0), plus `normalizeNarrationPace` / `ratesForPace`. All four speak paths (`speakText`, `speakLetter`, `speakWord`, `speakNumber`, `speakSentence`) scale through `setNarrationPace`. Gentle is byte-identical to current behavior.
- **Per-profile persistence (P1):** additive optional `Profile.narrationPace`, backfilled to Gentle on creation/load, unknown values normalised on read; SFX-off and speech-unsupported paths untouched.
- **Settings control (P2):** three-preset pace selector beside the voice row on Settings page one; applies on boot and on profile switch; backup export carries pace, merge keeps the local pace (normalised), replace restores the incoming one.
- **Review fixes (R1):** corrected the merge-policy comment; the pace setter now normalizes once at the boundary.

## Verification (all green on the final tree)

- `pnpm check` 393 files, `pnpm typecheck`, `pnpm test` 165 files / 3,559 tests
- Coverage 96.9 / 90.2 / 96.22 / 98.06 (gates 90/85/88/95); `pnpm build` 501 modules
- `validate-bundle` (entry 190.3 kB), `validate-module-size` (3 warn-only), `validate-textures` (unchanged), `validate-pwa` 16/0, `validate-docs` 5/0
- Browser suite lists 60 tests / 23 files, no errors (new `settings-pace` journey is CI-authoritative)
- Review round 1: PASS WITH FINDINGS, 2 Low, both fixed

## Notes

- No new dependencies, no schema bump, no new art assets.
- Roadmap RM-8 is retired by this PR.
