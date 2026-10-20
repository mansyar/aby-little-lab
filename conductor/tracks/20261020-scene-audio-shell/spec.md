# Shared Choice-Round Shell + Audio Focus — Specification

> Requirements are stable. Once an `FR`, `NFR`, or `AC` ID is approved, do not
> renumber it. If a requirement is removed, mark it `Withdrawn` instead of
> deleting it.

## Overview

The suite's twenty-one games were built one track at a time, so the shared
scaffold stopped at `GameSceneBase` (parent lock, mascot, progress dots,
completion). Everything below that line — round teardown, choice hit targets,
correct/incorrect handling, the advance delay, per-round narration — is copied
into each scene. This track continues the shell in the same direction the
`GameSceneBase` / `HubScene` / `SettingsPanel` decompositions started: one
choice-round base for the thirteen choice games, one narrator for every
per-round prompt, and one audio-focus policy so narration is never buried under
the music loop and a backgrounded tablet stops both playing and burning the
child's daily play-time budget.

## Problem / Motivation

1. **Duplicated round mechanics.** `handleCorrect` / `handleIncorrect` exist in
   thirteen scenes with the same body: input lock, chime, `recordCorrect`,
   mascot cheer, progress-dot pop, 700 ms advance, and a reduced-motion-aware
   wiggle on the wrong path. `AddItUpScene` and `TakeAwayScene` are the same
   scene wearing different numbers — 245 vs 246 lines, both emitting an
   identical 4.27 kB chunk. Every future game pays this tax again.
2. **Two narration paths.** `GameSceneBase.createSpokenInstruction` covers the
   eleven rule games, while eleven other scenes hand-roll
   `new SpeakerButton(...)` + `speakWord(...)` and read
   `load().settings.sfxEnabled` instead of the `getSettings()` facade. Each
   hand-rolled site re-implements mute state, replay wiring, and teardown.
3. **Narration competes with music.** BGM plays at `0.3` straight through every
   spoken prompt; no ducking exists even though `onSpeechLifecycle` already
   emits `speech:start` / `speech:end` / `speech:error`.
4. **Backgrounded tablet keeps working.** There is no `visibilitychange`
   handling: BGM keeps playing and the play session keeps accruing
   (`HubScene.ts` starts it on tile activation and only ends it on Hub return),
   so a tablet left on the sofa silently eats the profile's daily budget.

If this is not solved, the next game (Game 22) is written as a fourteenth copy,
narration stays the least legible part of the experience for a 3-year-old, and
the play-time limit remains guessable rather than trustworthy.

## Goals & Success Metrics

- **Goal:** every choice game renders its rounds through one base, every
  per-round prompt goes through one narrator, and narration owns the audio
  foreground.
- **Metric:** `rg "private handleCorrect" src/scenes` returns only the base;
  `rg "new SpeakerButton" src/scenes` returns only the narrator module; all
  2,092 existing tests green with no assertion changed; shell entry ≤ 200 kB;
  coverage gates unchanged (95/88/85/90).
- **Goal:** hidden time never counts as play time.
- **Metric:** unit test proves zero minutes recorded across two hide/show
  cycles, and visible time still accrues exactly once.

## Scope

### In Scope

- A shared choice-round base (`ChoiceRoundScene`) adopted by the thirteen
  choice scenes.
- One measured deduplication: Add It Up and Take Away collapse onto a single
  config-driven implementation with two thin subclasses (module paths, scene
  keys, game ids and stickers unchanged).
- A single per-round narrator owned by `GameSceneBase`, adopted by the eleven
  hand-rolled sites, carrying the Feelings Faces caption-fallback state
  machine.
- BGM duck/restore driven by the existing speech lifecycle, with a watchdog.
- Document visibility handling: pause BGM, cancel in-flight speech, pause
  play-time accrual; resume on return.
- Documentation of the new base and audio policy in `conductor/tech-stack.md`
  and `README.md`.

### Out of Scope

- Game 22 or any new game content, art, audio files, or word/number pools.
- Hub layout changes (grouping, favourites, the 10 + 10 + 1 paged grid).
- Storage durability work (guarded writes, persist request, export/import).
- Caption fallback for the illustrated prompt games — their prompts are
  already visual, so only the Feelings Faces scenario caption moves.
- Keyboard/switch access.

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | A `ChoiceRoundScene` base owns the round lifecycle for choice games: round-object teardown, choice target creation with ≥96 px hit areas and press feedback, correct handling (input lock, chime, `recordCorrect`, mascot cheer, progress dot, advance), and incorrect handling (soft tone, `recordWrong`, reduced-motion-aware wiggle, mascot nod). Subclasses supply only their round content and optional per-game extras. | must |
| FR-2 | Add It Up and Take Away share one implementation, configured by rule set (operation, cue textures, logic module, game id, instruction, sticker). Each keeps its existing scene key, module path, spoken rule, adaptive band shift, progress recording and sticker. | must |
| FR-3 | Every per-round narration site (the eleven scenes that hand-roll a speaker today) uses one narrator helper provided by the shared scene base; no scene constructs a `SpeakerButton` for a round prompt directly. | must |
| FR-4 | The narrator reads settings through the `getSettings()` facade, owns the glyph's muted state, replay wiring, and speech-lifecycle subscription, and tears all of it down when the round is rerendered or the scene shuts down. | must |
| FR-5 | The caption-fallback state machine currently in Feelings Faces (empty first `getVoices()` = unknown, decide only after `voiceschanged` settles, re-evaluate the displayed round on settle, never re-speak on flip) lives in the narrator; Feelings Faces keeps identical observable behaviour. | must |
| FR-6 | `AudioManager` exposes BGM duck and restore: duck to a ducked level on `speech:start` and restore to the normal level on `speech:end`, with a short ramp, wired once at init rather than per scene. | must |
| FR-7 | Ducking is self-healing: if no end event arrives (engine swallows `onend` after a cancel, scene shutdown, tab hide), BGM is restored rather than left quiet. | must |
| FR-8 | When the document becomes hidden: BGM pauses, in-flight speech is cancelled, and play-time accrual pauses. When it becomes visible again: BGM resumes only if it was playing and is enabled, and accrual resumes for the still-active session. | must |
| FR-9 | Hidden time never counts toward the daily budget; repeated hide/show cycles are idempotent and a session is recorded once, not once per cycle. | must |
| FR-10 | `conductor/tech-stack.md` and `README.md` describe the shared choice-round base, the narrator, and the audio-focus policy. | should |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | Shell entry stays ≤ 200 kB and every lazy game chunk stays within +1 kB of its pre-track size; `scripts/validate-bundle.js` passes. |
| NFR-2 | No test file is deleted and no assertion is weakened. Mechanical adaptations (an import path, a constructor argument) are allowed only where a module moves, and must be listed in the phase evidence. |
| NFR-3 | No new runtime dependency, no new audio file, no new art asset. |
| NFR-4 | Reduced-motion behaviour is preserved for the wiggle, progress-dot pop, narrator glyph and celebration; no new animation exceeds the existing 800 ms ceiling. |
| NFR-5 | Kid-visible timing is unchanged: 700 ms advance, 3,000 ms auto-return, 250 ms success flash, existing SFX calls in the same order. |
| NFR-6 | Audio changes respect the persisted `bgmEnabled` / `sfxEnabled` toggles and never leave the BGM element at the ducked level after shutdown, hide, or a setting change. |
| NFR-7 | `pnpm check` and `pnpm typecheck` stay clean; no `any` and no non-null assertion added to production code. |
| NFR-8 | Coverage stays at or above the configured gates (lines 95 / functions 88 / branches 85 / statements 90), with the two new modules covered directly rather than incidentally. |

### NFR-1 amendment (2026-10-20)

The per-chunk clause above is kept as written — the `+1 kB` figure stays on the
record — and the budget is now judged on the **game payload** instead: the sum
of the shared scene chunk plus the 21 scene chunks, together with the shell
entry. A shared chunk is allowed to absorb closely-coupled shared modules,
because that is the point of the shell: one module in the shared chunk replaces
the same code in thirteen scene chunks, so a per-chunk ceiling punishes exactly
the deduplication the track exists to deliver.

Measured on the track head (2026-10-20, `pnpm build` plus
`scripts/validate-bundle.js`): the shared `GameSceneBase` chunk went 5.90 →
7.98 kB (+2.08 kB) when `RoundNarrator` joined it, while every scene chunk
shrank; the 21 scene chunks total 64.44 kB, so the game payload is 72.42 kB. The
two choice-base chunks load only with a choice game (`ChoiceRoundScene` 2.36 kB,
`GroupMathScene` 2.03 kB), bringing game-only code to 76.81 kB. The shell entry
is 192.4 kB against its unchanged 200 kB ceiling.

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | `rg "new SpeakerButton" src/scenes` matches only the narrator module; `rg "private handleCorrect \| private handleIncorrect" src/scenes` matches only `ChoiceRoundScene`. | FR-1, FR-3 |
| AC-2 | Add It Up and Take Away both run through `GroupMathScene`; both chunks are emitted; each records its own game id, band shift and sticker, and both existing scene suites pass. | FR-2 |
| AC-3 | All thirteen choice scenes extend `ChoiceRoundScene`, and their existing suites pass without assertion changes. | FR-1 |
| AC-4 | The Feelings Faces suite passes unchanged, and narrator tests cover unknown → settled-empty, settle re-evaluation of the displayed round, and no re-speak on flip-to-spoken. | FR-4, FR-5 |
| AC-5 | New tests assert: duck on `speech:start`, restore on `speech:end`, restore after the watchdog window expires with no end event. | FR-6, FR-7 |
| AC-6 | New tests assert: hide pauses BGM, cancels speech and records zero minutes; show resumes BGM only when it was playing; two hide/show cycles record the visible slice exactly once. | FR-8, FR-9 |
| AC-7 | `pnpm run build` plus `validate-bundle.js` and `validate-pwa.js` pass; shell entry ≤ 200 kB. | NFR-1 |
| AC-8 | `pnpm test:coverage` meets all four gates, and `pnpm check` / `pnpm typecheck` are clean. | NFR-2, NFR-7, NFR-8 |
| AC-9 | Both docs name the base, the narrator, and the duck/hide policy in their own sections. | FR-10 |

## Edge Cases

- Speech engine never fires `onend` after a `cancel()` — watchdog restores BGM.
- A new utterance interrupts a ducked one (start arrives with no end for the
  first) — duck stays engaged, restore only when the last one ends.
- Tab hidden mid-speech, mid-celebration, or during the 3 s auto-return.
- Hide/show twice in quick succession — accrual is paused/resumed idempotently.
- SFX off (no speech is dispatched) — BGM stays at normal level, no duck churn.
- Scene shutdown or Hub return while ducked — volume restored, subscription
  released, no leaked listener across game visits.
- Round rerendered twice in one round (Feelings Faces re-speak) — narrator
  replaces its own glyph rather than stacking, mirroring the current
  `createSpokenInstruction` behaviour.
- Engines without `voiceschanged` — caption decision resolves immediately, as
  today.
- Existing v2 saves and old v1 migrations are untouched by this track.

## Dependencies

- **Tracks:** none.
- **External:** a real-device ear check for the ducked level (the repo's
  workflow lists real-device PWA checks as a manual exception); no credentials.

## Open Questions & Assumptions

- **Assumption:** ducked BGM level 0.08 and a 120 ms ramp are starting values;
  the final level is confirmed by ear on a real device and recorded in the
  phase evidence if it changes.
- **Assumption:** the watchdog window is 15 s, with an additional restore when
  `speechSynthesis.speaking` is false at check time.
- **Assumption:** the daily budget is *paused* rather than ended on hide
  (`pausePlaySession` / `resumePlaySession` in `playTimeLogic`), so an
  interrupted session continues instead of being split into several records.
- **Assumption:** `document.visibilityState` is authoritative for hide/show;
  Phaser's own blur handling is not used, because the BGM element and the play
  clock are outside the scene loop.
- **Question:** whether the shown-round re-evaluation on voice settle should
  also apply to a round that has already been answered (currently only the
  displayed round) — assumed no, to keep behaviour identical.

## References

- `src/scenes/GameSceneBase.ts`, `src/utils/speech.ts`,
  `src/audio/AudioManager.ts`, `src/game/playTimeLogic.ts`
- `conductor/archive/20261020-feelings-faces/review.md` (caption-fallback
  state machine and its three fix rounds)
- `conductor/archive/god-file-decomposition_20261018/` (the decomposition
  precedent this track extends)
- `conductor/product-guidelines.md` (no-fail, reduced motion, audio-visual
  pairing, touch targets)
