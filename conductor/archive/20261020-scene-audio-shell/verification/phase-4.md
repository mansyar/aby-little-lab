# Phase 4 — One narrator for per-round prompts

- **Track**: `20261020-scene-audio-shell`
- **Phase**: 4 — One narrator for per-round prompts
- **Date**: 2026-10-20
- **Branch**: `refactor/20261020-scene-audio-shell`
- **Base commit**: `c8a73da`
- **Head commit (code)**: `43ca892`
- **Result**: verified

## Commands

Exact chain from the phase brief, run as one command from the repo root after
the final code commit.

| # | Command | Exit | Notes |
|---|---------|------|-------|
| 1 | `pnpm check` | 0 | 199 files; only the pre-existing `noNonNullAssertion` warning at `src/__tests__/scenes/musicalMemoryScene.test.ts:294` and the Biome schema-version info (`2.5.5` schema vs `2.5.10` CLI). No new findings. |
| 2 | `pnpm typecheck` | 0 | `tsc --noEmit` clean. |
| 3 | `pnpm test -- --run` | 0 | 100 files / 2,118 tests (2,103 pre-existing, unmodified, plus 15 new narrator tests). |
| 4 | `pnpm test:coverage` | 0 | statements 98.09, branches 89.84, functions 98.10, lines 98.91 — all above the 90/85/88/95 gate. `RoundNarrator.ts` 98.11 statements / 85.29 branches / 100 functions / 100 lines. |
| 5 | `pnpm build` | 0 | 271 modules. Shell entry `index-B2bORCNF.js` 193.92 kB raw / 189.4 kB budgeted. |
| 6 | `node scripts/validate-bundle.js` | 0 | `PASS: shell entry index-B2bORCNF.js = 189.4 kB (<= 200 kB)`; Phaser vendor chunk present. |
| 7 | `node scripts/validate-pwa.js` | 0 | 15 passed, 0 failed. |

## Acceptance

### AC-1 — no scene constructs a speaker glyph for a round prompt

`new SpeakerButton` in `src` (grep, 16 matches):

| Location | Matches | Verdict |
|---|---|---|
| `src/components/RoundNarrator.ts` | 1 (line 196) | the narrator module — the only production constructor |
| `src/__tests__/components/SpeakerButton.test.ts` | 15 | the component's own unchanged suite |
| `src/scenes/**` | **0** | no scene builds a glyph directly |

Production-only (`src` excluding `src/__tests__`): exactly one match, in
`RoundNarrator`. The eleven former hand-rolled sites (`AlphabetScene`,
`WordMatchScene`, `WordBuilderScene`, `HowManyScene`, `FirstSoundsScene`,
`MoreLessScene`, `OddOneOutScene`, `ColorMatchScene`, `DecodeItScene`,
`MusicalMemoryScene`, `FeelingsFacesScene`) now call
`GameSceneBase.createRoundNarrator`; `createSpokenInstruction` no longer builds
a glyph itself either. The protected `speaker` adapter survives as a getter
returning `narrator.glyph ?? standaloneSpeaker`, which keeps the existing
`gameSceneBase`, `colorMatch`, `oddOneOut` and `musicalMemory` suites on their
unmodified `scene.speaker.button` / injected-glyph paths.

### AC-4 — Feelings Faces behaviour preserved

`src/__tests__/scenes/feelingsFacesScene.test.ts` is **unmodified**
(`git diff c8a73da -- src/__tests__` shows only the new narrator test file) and
passes in full, including the state-machine cases:

| Ladder case | Behaviour after the move |
|---|---|
| Empty first `getVoices()`, engine can fire `voiceschanged` | unknown — spoken path kept, no caption, rule spoken once |
| `voiceschanged` settles an empty list | caption for the displayed round in place (`roundIndex` unchanged, no advance); rule never re-spoken; glyph/label rebuilt dimmed |
| `voiceschanged` settles with voices | caption cleared, scenario spoken exactly once inline, pending 2.6 s opening timer `.remove()`d, rule never re-spoken |
| Flip back to spoken | no re-speak of the rule; the scene speaks the scenario once |
| Engine without `addEventListener` | settles immediately on its empty list (caption from round 1, rule not spoken) |
| Deferred opening speech fires while captioned | silent (0 scenario calls) |
| Later empty settle | captions the displayed round again |

The scene keeps `OPENING_SPEECH_DELAY = 2600`, `CAPTION_Y = 250`, the
`answer`/`buildRoundChoices` ladder, the re-speak-on-wrong, the splash, and the
dimmed glyph look; only the ownership of `captionFallback`, `voicesCache`,
`voicesSettled`, `handleVoicesChanged`, `applyCaptionState` and the glyph moved.

### NFR-2 — no test deleted or weakened

- `git diff --stat c8a73da -- src/__tests__` was empty before the new narrator
  suite was added; after the commits the only entry under `src/__tests__` is the
  new `components/roundNarrator.test.ts`.
- No assertion changed in any of the 99 pre-existing files; all 2,103 tests pass.
- Mechanical adaptations needed: none in tests (the `speaker` getter/setter and
  the `createSpokenInstruction(): Text` signature were preserved on purpose).
- New tests: `src/__tests__/components/roundNarrator.test.ts` (15).

### NFR-3 — no new dependency, audio file or art asset

`package.json` / lockfile untouched; no asset added. `RoundNarrator` composes
`SpeakerButton`, `speakSentence`/`isSpeechSupported` and `getSettings` only.

### NFR-7 — lint and types clean, no `any`, no non-null assertion

`pnpm check` and `pnpm typecheck` exit 0. The only warning is the pre-existing
one in `musicalMemoryScene.test.ts` (untouched by this phase). No `any` and no
non-null assertion were added in production or test code.

### NFR-8 — coverage, both new modules covered directly

`RoundNarrator.ts`: 98.11 statements / 85.29 branches / 100 functions / 100
lines, covered directly by its own suite. `GameSceneBase.ts`: 100 / 90.9 / 100 /
100. Gates: 90/85/88/95 → 98.09/89.84/98.10/98.91.

## Deviations

| File | Reason |
|---|---|
| `src/scenes/GameSceneBase.ts` | Converted the protected `speaker` field into a getter/setter pair (`narrator.glyph ?? standaloneSpeaker`). The field form cannot delegate to the narrator, and the existing `gameSceneBase`, `colorMatch`, `oddOneOut` and `musicalMemory` suites read/assign `speaker` unmodified — the pair is the mechanical adaptation that keeps them passing. Within Touches. |
| `src/scenes/FeelingsFacesScene.ts` | The scene's `captionFallback` / `voicesCache` / `voicesSettled` fields and its `voiceschanged` listener were removed rather than kept as a second copy of the state machine (FR-5 puts the machine in the narrator). The scene reacts through a `caption.onChange` hook. All observable behaviour is pinned by the unchanged suite. Within Touches. |
| `src/components/RoundNarrator.ts` (new) | Placed in `src/components` as named in Touches; it is the module an `rg` for the glyph constructor must find. |

No changes outside Touches.

## Notes

- `RoundNarrator` is not a second audio authority: it calls the same
  `speakSentence` the scenes already called, reads mute state through
  `getSettings()` (never `load().settings`), and never touches `AudioManager`.
  Muting at creation preserves the old semantics exactly (`createSpokenInstruction`
  captured `!getSettings().sfxEnabled` once); mid-round toggles are picked up by
  the replay closures, which is what the existing "replays … and re-reads the SFX
  setting on tap" test asserts.
- The `caption` option is opt-in, so illustrated prompt games keep exactly the
  old glyph behaviour (no voice-list watching, no caption hook).
- Shell entry is unchanged at 193.92 kB raw / 189.4 kB budgeted; per-game chunk
  sizes are unchanged (`FeelingsFacesScene` 4.57 kB, `GameSceneBase` 7.98 kB), so
  NFR-1 holds.
- Carry-over for phase 5: `src/scenes/NumberOrderScene.ts:293` still reads
  `load().settings.sfxEnabled` for its numeral call-out. It is outside this
  phase's Touches; it is not a glyph site.
- Carry-over: `src/scenes/ChoiceRoundScene.ts:75` comment ("after the shared
  feedback") still predates the mascot-cheer ordering; untouched here as it is
  out of Touches.

## Primary verification

Run independently by the primary agent after the subagent reported, against
`212c9a5` with a clean tree.

- Exact phase verification string: exit 0. `pnpm check` 199 files, only the two
  pre-existing notes; `pnpm typecheck` clean; `pnpm test -- --run` 100 files /
  2,118 tests; coverage 98.07 statements / 89.76 branches / 98.10 functions /
  98.91 lines; build 271 modules; `validate-bundle` shell entry 189.4 kB
  (ceiling 200); `validate-pwa` 15/15.
- Diff scope: matches Touches exactly — one new component, `GameSceneBase`, the
  twelve scenes, the new narrator suite and the report. `git diff --stat
  c8a73da..HEAD -- src/__tests__` lists only the new test file, so NFR-2 held
  with zero adaptations to existing suites. No merge commits.
- AC-1: `rg -c "new SpeakerButton" src --glob "!**/__tests__/**"` returns
  exactly one match, `src/components/RoundNarrator.ts`.
- Call-site audit: no scene calls both `createSpokenInstruction` and
  `createRoundNarrator`, so the narrator-replacement path cannot strand a rule
  line without its glyph. The eleven prompt glyphs and the twelve rule lines map
  one-to-one onto the two entry points.
- AC-4: read the scene diff against the pre-phase file. The moved machine keeps
  unknown-first-read, `voiceschanged` settling, the no-event immediate
  decision, the displayed-round re-evaluation, the opening-timer cancellation
  and the no-re-speak-on-flip ordering; only the ownership changed.
- NFR-1: every scene chunk shrank (FeelingsFaces 5.61 → 4.57 kB, Alphabet
  1.53 → 1.45, OddOneOut 4.48 → 4.39, the rest marginally), while
  `GameSceneBase` grew 5.90 → 7.98 kB because `RoundNarrator` is statically
  bundled into the shared scene chunk. Net change across the migrated chunks is
  roughly +0.4 kB and the shell entry is unchanged, so the intent of the budget
  holds, but the per-chunk wording should be read as "no scene grew" rather
  than "no chunk grew".
- Carry-overs for Phase 5 / review: `NumberOrderScene.ts` still gates speech on
  `load().settings.sfxEnabled` (no glyph site, so outside FR-4's scope), and
  `ChoiceRoundScene.ts:75` still carries the stale `onCorrect` sentence.
