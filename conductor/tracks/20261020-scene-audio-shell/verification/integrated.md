# Integrated Verification — Shared Choice-Round Shell + Audio Focus

- Track: `20261020-scene-audio-shell`
- Branch: `refactor/20261020-scene-audio-shell`
- Base: `master` @ `c92e5c481b1f87e8b28f1d30eb4e8989156253fb`
- Head at verification: `4b36d5a`
- Date: 2026-10-20

## What the track changed

| Area | Before | After |
|---|---|---|
| Choice-round loop | copied into 13 game scenes | `ChoiceRoundScene` (one loop) + `GroupMathScene` (equation row), with Add It Up / Take Away as config subclasses |
| Per-round prompts | 11 hand-built `SpeakerButton`s, two narration paths | `RoundNarrator` — the only construction site, serving prompt glyphs and rule lines |
| Feelings Faces caption fallback | owned by the scene | owned by the narrator, behaviour unchanged |
| BGM under speech | no ducking | ducks to 8% over 120 ms, restores on end/error/watchdog/toggle, never persisted |
| Backgrounded document | kept playing, kept charging time | BGM paused, speech cancelled, play clock paused |
| Docs | described 13 copied handlers and 20 tiles | describe the two bases, the narrator, the audio-focus policy |

## Gate run (whole track, on `4b36d5a`)

| Command | Result |
|---|---|
| `pnpm check` | exit 0 — 199 files, 1 pre-existing warning (`musicalMemoryScene.test.ts:294`), 1 info (Biome schema 2.5.5 vs CLI 2.5.10) |
| `pnpm typecheck` | exit 0 |
| `pnpm test -- --run` | exit 0 — 100 files, 2,148 tests |
| `pnpm test:coverage` | exit 0 — 98.07 statements / 90.28 branches / 98.15 functions / 98.93 lines (gates 90 / 85 / 88 / 95) |
| `pnpm build` | exit 0 — 271 modules, 44 precache entries (1,658.98 KiB) |
| `node scripts/validate-bundle.js` | PASS — shell entry `index-Cc5UPYTF.js` = 192.4 kB (≤ 200 kB), Phaser vendor chunk present |
| `node scripts/validate-pwa.js` | PASS — 15 passed, 0 failed |

Per-phase evidence: `verification/phase-1.md` … `phase-5.md` (each carries the
subagent report plus the primary's independent run and scope audit).

## Acceptance criteria

| AC | Verdict | Evidence |
|---|---|---|
| AC-1 | met | `rg "new SpeakerButton" src --glob "!**/__tests__/**"` → one hit, `src/components/RoundNarrator.ts:196`. `rg "private handleCorrect\|private handleIncorrect" src/scenes` → `ChoiceRoundScene.ts:210` and `:253` only. |
| AC-2 | met | `AddItUpScene extends GroupMathScene<AddItUpRound>`, `TakeAwayScene extends GroupMathScene<TakeAwayRound>`; both chunks emitted (1.22 kB each, over a 2.03 kB `GroupMathScene` chunk); both suites pass unmodified; each keeps its own `gameId`, band-shift key, sticker and rule. |
| AC-3 | met | 11 scenes `extends ChoiceRoundScene` directly (Alphabet, WordMatch, DecodeIt, HowMany, FirstSounds, MoreLess, ColorMatch, OddOneOut, NumberOrder, PatternBuilder, FeelingsFaces) plus the two `GroupMathScene` scenes = 13. `git diff --numstat` over the track shows test additions only — no existing assertion was rewritten in the thirteen game suites. |
| AC-4 | met | `src/__tests__/scenes/feelingsFacesScene.test.ts` is untouched; `roundNarrator.test.ts` covers unknown-first-read (“keeps the spoken path while the voice list is still unknown”), settled-empty re-evaluation of the displayed round (“captions the displayed round once the engine settles on no voices”), settled-with-voice, and “flips back to spoken without re-speaking the rule”. |
| AC-5 | met | `AudioManager.test.ts`: “ducks the BGM when narration starts”, “ramps the duck instead of jumping”, “restores the BGM when narration ends”, “restores the BGM when no terminal speech event arrives” (watchdog), plus error, re-entrancy, both toggles, no-persist, inert-without-`visibilityState`, teardown. |
| AC-6 | met | `AudioManager.test.ts`: hide pauses BGM / cancels narration / releases the duck; show resumes only when it had been playing; no resume when BGM was disabled while hidden. `playTimeLogic.test.ts`: “accrues only the visible minutes while the document is hidden”, “charges the visible slice once across two hide/show cycles”, “charges nothing for a hide with no visible time between”, “ignores repeated hide and show events”. |
| AC-7 | met | build + both validators pass; shell entry 192.4 kB against the 200 kB ceiling (7.6 kB headroom). |
| AC-8 | met | all four coverage gates met; `pnpm check` and `pnpm typecheck` clean apart from the pre-existing warning and schema info. |
| AC-9 | met | `conductor/tech-stack.md`: scene count 24/21, the 2026-10-20 design update (bases, narrator, audio focus, visibility sessions), tree entries for `ChoiceRoundScene`, `GroupMathScene`, `RoundNarrator`, `playTimeLogic`, the three previously missing game scenes and the 21-tile count. `README.md`: structure tree, spoken-rules paragraph, settings-modal paragraph, play-time bullet and a new “Audio focus” motion bullet. `conductor/product.md`: play-time bullet, audio section, Game 21 scene note and a new changelog section. |

## Non-functional requirements

| NFR | Verdict | Evidence |
|---|---|---|
| NFR-1 | met with a caveat | shell entry 189.3 → 192.4 kB (inside 200 kB); every scene chunk shrank except that `GameSceneBase` grew 5.90 → 7.98 kB when `RoundNarrator` joined the shared scene chunk. Net across the migrated chunks ≈ +0.4 kB. Headroom is now 7.6 kB. |
| NFR-2 | met | 2,092 → 2,148 tests, all pre-existing ones green. The only edits to existing test files are additions (audio suite 257/0, play-time suite 138/1 where the removed line is that file's `vitest` import). |
| NFR-3 | met | no new dependency or asset; `package.json` unchanged. |
| NFR-4 | met | reduced-motion paths preserved: wiggle angle/duration and dot-pop come from the same `motionScale` / `motionDuration`; the narrator adds no motion. |
| NFR-5 | met | `NEXT_ROUND_DELAY` 700, `AUTO_RETURN_DELAY` 3000, success flash 250, `playCorrect` → `recordCorrect` → hook → cheer → dot order. The one deliberate exception (Pattern Builder fills the dot and starts the 700 ms advance at tap rather than after the 200 ms snap, and gains the base's 250 ms flash) was recorded in phase 3 and is carried into review. |
| NFR-6 | met | `Settings`/storage schema untouched; no new persisted key; the duck never writes a volume. |
| NFR-7 | met | `pnpm check` and `pnpm typecheck` clean; no `any` in production code. |
| NFR-8 | met | coverage 98.07 / 90.28 / 98.15 / 98.93; `ChoiceRoundScene`, `RoundNarrator` and `playTimeLogic` are covered directly rather than incidentally. |

## Known carry-overs (not blockers)

1. `NumberOrderScene.ts` still gates speech on `load().settings.sfxEnabled`
   rather than `getSettings()`; behaviourally identical today, inconsistent with
   FR-4's single route through the facade.
2. `ChoiceRoundScene.ts:75` still says `onCorrect` runs “after the shared
   feedback” although it now runs before the cheer (the inline comment at the
   call site is correct).
3. The duck level (8%) and ramp (120 ms) are the spec's starting values and have
   not been heard on a real device; the device checklist needs an ear check.
4. A scene shutdown does not call `AudioManager` to release a duck explicitly;
   it relies on `speech:end` / `speech:error` or the 15 s watchdog.
