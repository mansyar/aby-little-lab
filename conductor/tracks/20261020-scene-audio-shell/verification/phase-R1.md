# Phase R1 evidence — Review Fixes

- **Track:** `20261020-scene-audio-shell` — Shared Choice-Round Shell + Audio Focus
- **Phase:** R1 — Review Fixes
- **Date:** 2026-10-20
- **Branch:** `refactor/20261020-scene-audio-shell`
- **Base commit:** `5709e77`
- **Code head at the gate run:** `d788e24`; the docs commit `e5a13ee` and this
  evidence file change no source or test, so the run stands for the whole phase.
- **Result:** ⚠️ **blocked on two primary-owned documents** — every code and test
  finding is closed and the full phase gate exits 0, but `conductor/product.md`
  and `conductor/tracks/20261020-scene-audio-shell/spec.md` are refused to this
  phase by the edit-permission layer ("product docs and spec are primary-owned").
  The exact text to apply is in [Not written: primary-owned docs](#not-written-primary-owned-docs).

## What changed

| Finding | Fix | Where |
|---|---|---|
| **M1** — success flash added to five games, recorded for one | Recorded as a **deliberate unification**: the correct path flashes the tapped card `0x68d391` for 250 ms. Phase 2's evidence now names the four Phase 2 games that gained it (Alphabet, Word Match, Decode It, First Sounds) and why; the integrated NFR-5 row reads `met — amended` with the same fact and points at the Phase 2 paragraph. `conductor/product.md` and `spec.md` NFR-5 are **not written** (see blockers); the NFR-5 row was judged to specify the flash's *duration*, not forbid a game gaining one, so per the brief the spec row is left alone anyway. | `verification/phase-2.md` (new subsection under Deviations), `verification/integrated.md` (NFR-5 row) |
| **M2** — shared scene chunk past the per-chunk clause | Integrated NFR-1 restated as `met (waiver recorded)` and cites the dated NFR-1 amendment. The amendment itself (game-payload budget, shared-chunk exception, measured figures, original `+1 kB` kept on the record) is **not written** — `spec.md` is refused to this phase. Measured on this tree: `GameSceneBase` 7.98 kB, 21 scene chunks 64.44 kB → game payload 72.42 kB (76.81 kB with the two choice-base chunks); shell entry 192.4 kB of 200 kB. | `verification/integrated.md` (NFR-1 row); `spec.md` pending |
| **L1** — test name contradicted the ordering | Renamed to “runs the per-game correct extras before the cheer and the dot” and the order is now asserted with three markers in one log: the extras hook (`correct:0`), a `mascot.cheer` spy, and the progress dot's `setAlpha`. The existing `correct:0` / `playCorrect` assertions are kept. | `src/__tests__/scenes/choiceRoundScene.test.ts` |
| **L2** — pre-init duck test asserted something unrelated | Body replaced: `duckBGM()` + `restoreBGM()` on a never-initialised manager do not throw, create no audio element (`mockAudios` length unchanged) and leave `vi.getTimerCount() === 0`; the existing “no `speechSynthesis.cancel`” assertion is kept as the no-speech half of the same contract. | `src/__tests__/audio/AudioManager.test.ts` |
| **L3** — one scene read storage directly | `NumberOrderScene` tap now reads `getSettings().sfxEnabled`; `load` was used nowhere else in the file, so its import is gone. | `src/scenes/NumberOrderScene.ts:9,293` |
| **L4** — `refreshCaptionFallback()` bypassed the glyph rebuild | Behaviour untouched. The docstring now states the contract: re-reads the decision so the scene can branch on `isCaptioning` before speaking its own text; deliberately does not rebuild the glyph/label or notify, because a mid-render `onChange` re-enters the scene's speak path; the presentation catches up at the next rebuild. The narrator test “re-reads the decision at a round boundary without notifying” already asserts the non-notifying half (`onChange` not called, one live glyph), so it was not touched. | `src/components/RoundNarrator.ts:123-137` |
| **L5** — touch floor not centred on sub-96 px cards | `hitWidth` / `hitHeight` are computed once and the hit rect is anchored at `((width - hitW) / 2, (height - hitH) / 2)`. For every card ≥ 96 px that offset is exactly `0`, so all current geometry is byte-identical (smallest shipped card is `PatternBuilderScene`'s 128 px; every other constant is 140–256 px). New case in the scene suite builds a 64 px card and asserts a 96×96 hit area at `(-16, -16)` plus a centre tap that resolves through `helpers/hitTest.ts`. | `src/scenes/ChoiceRoundScene.ts:150-172`, `src/__tests__/scenes/choiceRoundScene.test.ts` |

Test count moved 2,148 → 2,149: L5 adds one case, L1 renames and strengthens an
existing one in place.

## Commands

Run as one chain, exactly as the brief specifies:

`pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js`

| # | Command | Exit | Result |
|---|---------|------|--------|
| 1 | `pnpm check` | 0 | 199 files; only the pre-existing `noNonNullAssertion` warning (`musicalMemoryScene.test.ts:294`) and the Biome schema info (2.5.5 vs CLI 2.5.10) |
| 2 | `pnpm typecheck` | 0 | clean |
| 3 | `pnpm test -- --run` | 0 | 100 files / 2,149 tests passed |
| 4 | `pnpm test:coverage` | 0 | statements 98.07 (4699/4791) · branches 90.28 (1134/1256) · functions 98.15 (957/975) · lines 98.93 (4381/4428) — gates 90 / 85 / 88 / 95 |
| 5 | `pnpm build` | 0 | 271 modules; 44 precache entries (1,658.98 KiB) |
| 6 | `node scripts/validate-bundle.js` | 0 | PASS — Phaser vendor chunk present; shell entry `index-BbehUkkP.js` = 192.4 kB ≤ 200 kB |
| 7 | `node scripts/validate-pwa.js` | 0 | 15 passed, 0 failed |

Coverage is unchanged from the integrated run despite the new test: the added
assertions cover lines that were already exercised, and `ChoiceRoundScene` stays
at 100 % lines.

## Task → commit map

| Task | Commit |
|---|---|
| R1.T7 (L5) production fix | `97a7d48` |
| R1.T3 (L1) + R1.T7 (L5) test | `71ae3f5` |
| R1.T4 (L2) | `f056287` |
| R1.T5 (L3) | `67d16bf` |
| R1.T6 (L4) | `d788e24` |
| R1.T1 (M1, partial) + R1.T2 (M2, partial) docs | `e5a13ee` |

L1 and L5 share one test commit because both edits are in the same file and
git cannot stage one hunk from each into separate commits without rewriting the
working tree.

## Deviations

None. No file outside the brief's `Touches` was modified. `conductor/product.md`
and `conductor/tracks/20261020-scene-audio-shell/spec.md` are inside `Touches`
but were not modified — the edits were refused (see blockers).

## Not written: primary-owned docs

Both edits were attempted and rejected by the phase permission layer with
`Permission denied: edit`; this phase may not write product docs or `spec.md`.
The primary agent needs to apply them.

**`conductor/product.md`** — in `## Changelog — Shared Choice-Round Shell + Audio Focus (2026-10-20)`,
extend the opening sentence (which currently ends `…or SFX order — this is
architecture and audio behavior.`) with:

> One visible unification: the 250 ms success flash is shared by the round base
> and now applies to every choice game, including Alphabet, Word Match, Decode
> It, First Sounds, Pattern Builder and Feelings Faces, in the same success
> colour the other choice games already used, pairing the chime with a visual.

**`spec.md`** — a dated subsection after the Non-Functional Requirements table,
keeping the NFR-1 row untouched so the 200 kB / `+1 kB` figures stay visible:

> ### NFR-1 amendment (2026-10-20)
>
> The per-chunk clause above is kept as written — the +1 kB figure stays on the
> record — and the budget is now judged on the **game payload** instead: the sum
> of the shared scene chunk plus the 21 scene chunks, together with the shell
> entry. A shared chunk is allowed to absorb closely-coupled shared modules,
> because that is the point of the shell: one module in the shared chunk replaces
> the same code in thirteen scene chunks, so a per-chunk ceiling punishes exactly
> the deduplication the track exists to deliver.
>
> Measured on the track head (2026-10-20, `pnpm build` plus
> `scripts/validate-bundle.js`): the shared `GameSceneBase` chunk went 5.90 →
> 7.98 kB (+2.08 kB) when `RoundNarrator` joined it, while every scene chunk
> shrank; the 21 scene chunks total 64.44 kB, so the game payload is 72.42 kB.
> The two choice-base chunks load only with a choice game (`ChoiceRoundScene`
> 2.36 kB, `GroupMathScene` 2.03 kB), bringing game-only code to 76.81 kB. The
> shell entry is 192.4 kB against its unchanged 200 kB ceiling.

**`spec.md` NFR-5** — deliberately left unchanged. The row reads “Kid-visible
timing is unchanged: 700 ms advance, 3,000 ms auto-return, 250 ms success
flash, existing SFX calls in the same order.” It enumerates delays/orders and
names the flash by its 250 ms duration; it does not state which games have one,
so it does not forbid a game gaining it. The M1 record therefore lives in the
Phase 2 evidence, the integrated NFR-5 row and the product changelog.

## Notes

1. L5 is inert today by construction: `Math.max(width, 96)` leaves
   `(width - hitW) / 2 === 0` for every card at or above 96 px, and the smallest
   shipped card is 128 px (`PatternBuilderScene`). The new test is the only
   consumer of the sub-floor path.
2. L1's ordering assertion fails against the pre-fix order: with the cheer
   before `onCorrect` the filtered log reads `["cheer", "correct:0", "dot"]`.
3. L2 pins the timer half with `vi.getTimerCount() === 0` inside the suite's
   existing fake-timer scope; `init()` arms no timer, so the fresh manager is
   measured against an empty count.
4. Integrated `Known carry-overs` item 1 (NumberOrder reading `load()`) is
   marked resolved by this phase; item 2 (`ChoiceRoundScene.ts:75` comment)
   already reads “before the shared feedback” at the current head and needs no
   change.
5. Pre-existing, untouched: the `noNonNullAssertion` warning at
   `src/__tests__/scenes/musicalMemoryScene.test.ts:294`, the `biome.json`
   schema version lag, and the build's >500 kB chunk advisory (Phaser vendor
   chunk).
