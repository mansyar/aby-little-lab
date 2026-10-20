# Phase 5 — Audio focus, visibility, and docs

- **Track:** `20261020-scene-audio-shell` — Shared Choice-Round Shell + Audio Focus
- **Phase:** 5 — Audio focus, visibility, and docs
- **Date:** 2026-10-20
- **Branch:** `refactor/20261020-scene-audio-shell`
- **Base commit:** `f092506`
- **Head at verification:** `cae4858` (code); this evidence and `README.md` land in the docs commit that follows
- **Result:** verified for code and docs in `README.md`; `conductor/tech-stack.md` could not be written by this executor (see Deviations) and its exact replacement text is staged for the primary in `.conductor/evidence/phase-5-tech-stack-updates.md`

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| Static | `pnpm check` | 0 | 199 files; only the pre-existing `noNonNullAssertion` warning at `src/__tests__/scenes/musicalMemoryScene.test.ts:294` and the pre-existing Biome schema-version notice (2.5.5 vs CLI 2.5.10) |
| Static | `pnpm typecheck` | 0 | `tsc --noEmit`, no output |
| Unit | `pnpm test -- --run` | 0 | 100 files / 2148 tests passed (phase 4: 100 / 2118 — 30 added cases) |
| Unit | `pnpm test:coverage` | 0 | Statements 98.07, Branches 90.28, Functions 98.15, Lines 98.93 (gates 90/85/88/95) |
| Build | `pnpm build` | 0 | `index-Cc5UPYTF.js` 197.01 kB raw; Phaser vendor chunk 1374.82 kB; PWA 44 precache entries |
| Build artifact | `node scripts/validate-bundle.js` | 0 | `PASS` Phaser vendor chunk isolated; shell entry 192.4 kB (≤ 200 kB) |
| Build artifact | `node scripts/validate-pwa.js` | 0 | 15 passed, 0 failed |

Full chain executed as written: `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js`. No boot smoke run: boot/preload/PWA/assets were untouched this phase.

## Acceptance

### FR-6 / FR-7 — duck, restore, self-healing (AC-5)

`AudioManager` subscribes to `onSpeechLifecycle` once in `init()` (`BGM_DUCKED_VOLUME = BGM_VOLUME * 0.08`, `BGM_RAMP_DURATION = 120 ms` in six 20 ms steps, `BGM_DUCK_WATCHDOG = 15 s`) and restores on `speech:end`, `speech:error`, watchdog expiry, `destroy()`, and either settings toggle. The ducked level is never written to storage.

| Requirement | Proven by |
| --- | --- |
| subscribes once, not per scene | `subscribes to the speech lifecycle exactly once at init` |
| duck on `speech:start` | `ducks the BGM when narration starts` (≈0.024), `does not duck before init` |
| short ramp, not a jump | `ramps the duck instead of jumping` |
| restore on `speech:end` | `restores the BGM when narration ends` (0.3) |
| restore on `speech:error` | `restores the BGM when narration errors` |
| re-entrant utterance does not restore early | `holds the duck across a re-entrant utterance` |
| watchdog restores with no terminal event | `restores the BGM when no terminal speech event arrives`, `keeps the duck while the engine still speaks and restores on a later check` |
| no duck left after a settings change | `restores the BGM when BGM is disabled mid-narration`, `restores the BGM when SFX is disabled mid-narration` |
| no duck churn when SFX/BGM off | `does not duck when SFX is disabled`, `does not duck when BGM is disabled` |
| ducked level never persisted | `never persists the ducked level` (raw `abby-little-lab:v2` string unchanged) |
| teardown releases subscription and listener | `releases the speech subscription and visibility listener on destroy` |

Scene shutdown has no hook into `AudioManager`: the utterance either reports its terminal event (restoring) or the watchdog restores within 15 s. `destroy()` covers an explicit teardown.

### FR-8 / FR-9 — visibility (AC-6)

Audio (`AudioManager.handleVisibilityChange`): hide → remember `!bgmAudio.paused`, cancel `speechSynthesis`, release the duck, pause BGM; show → `playBGM()` only when it was playing and `bgmEnabled` is still true.

Play time (`playTimeLogic`): a session banks `visibleMs` plus a `runningSince` stretch; `pausePlaySession()`/`resumePlaySession()` are idempotent; the watcher attaches in `startPlaySession()` and detaches in `endPlaySession()`, so hidden minutes are excluded during gameplay too — not only on the Hub, whose scene is shut down while a game runs. `resumePlaySession()` refuses to resume while the document is still hidden. `HubScene` is unchanged: it already brackets the session with `startPlaySession`/`endPlaySession`, and ownership stays there.

| Requirement | Proven by |
| --- | --- |
| hide pauses BGM, cancels speech, releases duck | `pauses the BGM, cancels narration, and releases the duck when hidden` |
| show resumes only what was playing and enabled | `resumes the BGM on show when it was playing before the hide`, `does not resume the BGM on show when it was paused before the hide`, `does not resume the BGM on show when BGM was disabled while hidden` |
| hidden minutes excluded | `accrues only the visible minutes while the document is hidden` (2 + 10 hidden + 5 → 7) |
| two hide/show cycles bank the visible slice once | `charges the visible slice once across two hide/show cycles` (2 + 3 + 5 → 10), `ignores repeated hide and show events` |
| hide with no visible time charges nothing | `charges nothing for a hide with no visible time between` |
| single session, recorded once | `records the visible total when the session ends while hidden`; existing `play session` suite unchanged |
| started in an already-hidden tab | `starts paused when the document is already hidden`, `never resumes while the document is still hidden` |
| pause/resume idempotent | `keeps pause and resume idempotent outside the document events`, `ignores pause and resume with no active session` |
| inert without `document.visibilityState` | `is inert where the document has no visibilityState` (play time) and the same case in `AudioManager` |

### FR-10 — documentation (AC-9)

| Section | Change |
| --- | --- |
| README `Project Structure` | `scenes/` names `ChoiceRoundScene` → `GroupMathScene` → `GameSceneBase`; `components/` names `RoundNarrator`; `audio/` names the audio-focus policy |
| README `Spoken rules` | states that one `RoundNarrator` provides the caption line and the shared glyph |
| README `Parental Lock & Touch UX` | Settings paragraph notes the duck and hidden-tab pause |
| README `Play-time limits` | hidden/backgrounded tab accrues nothing |
| README `Motion & Feedback` | new **Audio focus** bullet: duck level/ramp/watchdog, hide/show behaviour, idempotence, inert fallback |
| `conductor/tech-stack.md` | **not applied by this executor** — exact replacement text in `.conductor/evidence/phase-5-tech-stack-updates.md` (scene count 23→24/20→21, audio bullet, a 2026-10-20 design-update blockquote covering both bases, `RoundNarrator`, the audio-focus policy and the visibility-aware session, plus tree entries for `ChoiceRoundScene.ts`, `GroupMathScene.ts`, `RoundNarrator.ts`, `playTimeLogic.ts` and the 21-tile count) |

No stale counts are introduced: the Hub grid remains 6×4 wide / three narrow pages of 10+10+1, the game count is 21, the choice-game count is 13, and the scene count 23 → 24 is derived from Boot + Preload + Hub + 21 game scenes.

### AC-7 / AC-8 / NFR-1 / NFR-8

- `pnpm build`, `validate-bundle`, `validate-pwa` all exit 0; shell entry 192.4 kB against the 200 kB budget (7.6 kB headroom, down from 10.6 kB in phase 4 — the phase added 3.1 kB raw across the duck ramp, watchdog and visibility wiring).
- Coverage 98.07 / 90.28 / 98.15 / 98.93 clears 95/88/85/90. `AudioManager.ts` is 94.08% statements (the only uncovered lines are the pre-existing `playSFX` switch delegations at 150-163); `playTimeLogic.ts` is 96.92% statements with 100% lines.

### NFR-2 / NFR-6 / NFR-7

- **NFR-2:** no test deleted or weakened. The only mechanical change to an existing case is `manager.destroy()` appended to `AudioManager.test.ts`'s file-level `afterEach` (needed because `init()` now owns document listeners; without it, stale managers from earlier cases reacted to a later case's visibility event — observed as 60 `cancel` calls). `hubPlayTime.test.ts` and all other suites are untouched.
- **NFR-6:** the settings schema is unchanged (no new persisted key); both toggles release a duck and BGM disable still pauses; `bgmEnabled`/`sfxEnabled` continue to gate every sound.
- **NFR-7:** `pnpm check` and `pnpm typecheck` clean; no `any`, no non-null assertion, no `@ts-ignore` added. Timers are typed via `ReturnType<typeof setTimeout>` / `ReturnType<typeof setInterval>` (no `@types/node`).

## Deviations

| File | Reason |
| --- | --- |
| `conductor/tech-stack.md` | Not written: every `edit` attempt was rejected with `permission.rejected` (the executor's write allowlist covers `src/**`, this verification file and `.conductor/evidence/**`, not `conductor/*.md`). The exact replacements are recorded in `.conductor/evidence/phase-5-tech-stack-updates.md` and still need to be applied, so **P5.T4.1 is partial**. |
| `src/__tests__/audio/AudioManager.test.ts` (existing `afterEach`) | Added `manager.destroy()` as cleanup only; no assertion changed. Required by the new `init()` subscriptions (see NFR-2 above). |
| `src/scenes/HubScene.ts` | Listed in Touches but **not modified by design**: `AudioManager` owns the audio side at `init()`, and `playTimeLogic` owns the playback side inside `startPlaySession`/`endPlaySession`, which `HubScene` already calls. This keeps session ownership in `HubScene` and avoids new `AudioManager` calls that the hub test doubles do not provide. |

## Notes

- `AudioManager`'s visibility listener is attached in `init()` and never per scene, so hub/game scene churn cannot double-subscribe; `destroy()` detaches it.
- The play-time watcher attaching inside `startPlaySession()` is deliberate: `HubScene` shuts down when a game starts, so a hub-only listener would have left gameplay background time billing the daily budget.
- Bundle headroom is now 7.6 kB under the 200 kB cap; worth watching in later tracks.
- Carry-overs still open from earlier phases (both outside Touches): `src/scenes/NumberOrderScene.ts:293` reads `load().settings.sfxEnabled` directly instead of the shared helper, and the stale comment at `src/scenes/ChoiceRoundScene.ts:75`.

## Primary verification

Run independently by the primary agent after the subagent reported, against the
phase-5 code head with a clean tree.

- Exact phase verification string: exit 0. `pnpm check` 199 files, only the two
  pre-existing notes; `pnpm typecheck` clean; `pnpm test -- --run` 100 files /
  2,148 tests; coverage 98.07 statements / 90.28 branches / 98.15 functions /
  98.93 lines; build 271 modules; `validate-bundle` shell entry 192.4 kB
  measured (197.01 kB raw, ceiling 200); `validate-pwa` 15/15.
- Diff scope: `AudioManager.ts`, `playTimeLogic.ts`, the two named suites, the
  README and this report. `HubScene.ts` was in Touches and is untouched, which
  is the better outcome: the visibility watcher lives inside
  `startPlaySession` / `endPlaySession`, so it spans scene boundaries instead of
  relying on the Hub, and no hub assertion moved.
- Test changes are additions: `git diff --numstat` shows 257/0 for the audio
  suite and 138/1 for the play-time suite, and the single removed line is that
  file's `vitest` import (rewritten to add `afterEach`/`beforeEach`/`vi`). No
  assertion was deleted or weakened, so NFR-2 holds.
- P5.T4 was reported blocked because the phase executor could not write
  `conductor/tech-stack.md` (`permission.rejected` for `conductor/*.md`). The
  primary applied those edits: scene count 23/20 → 24/21, the 2026-10-20 design
  update, the `ChoiceRoundScene` / `GroupMathScene` / `RoundNarrator` tree
  entries, the `playTimeLogic` entry, the `AudioManager` line and the tile count
  (20 → 21). The tree was also missing three scene files outright
  (`FirstSoundsScene`, `NumberOrderScene`, `FeelingsFacesScene`); all three are
  now listed. README's test-count line was refreshed 2,090/98 → 2,148/100 to
  match this run.
- Judgement on the deviation the executor flagged: a duck is released by
  `speech:end` / `speech:error`, by the 15 s watchdog, and by both settings
  toggles, but not by an explicit call in `GameSceneBase` shutdown. Because the
  narrator never leaves a `speech:start` without a terminal event or an engine
  that has stopped speaking, the watchdog covers the residue; still worth
  carrying into review as "should a scene shutdown restore explicitly?".
- NFR-1: the shell entry grew 189.4 → 192.4 kB because `AudioManager`'s focus
  policy is shell code. That is inside the 200 kB ceiling but the headroom is
  now ~7.6 kB, so the next shell feature needs a conscious decision rather than
  an assumption.
