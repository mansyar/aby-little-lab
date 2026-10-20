# Pull Request — Shared Choice-Round Shell + Audio Focus

- **Track:** `20261020-scene-audio-shell`
- **Branch:** `refactor/20261020-scene-audio-shell` → `master`
- **Type:** refactor · **Priority:** medium
- **Base:** `c92e5c4`
- **PR:** [#46](https://github.com/mansyar/aby-little-lab/pull/46)
- **Review:** PASS (2 rounds) — see `review.md`

## What this does

Three seams were open below the game shell, and this closes them without
changing what a child sees or hears in a round:

1. **One choice-round implementation for thirteen games.** `ChoiceRoundScene`
   owns the prompt-plus-card loop (render, teardown, one-tap locking, success
   flash, progress dot, reduced-motion wiggle, wrong path); `GroupMathScene` adds
   the equation row for Add It Up and Take Away, which are now ~25-line config
   subclasses. Scene keys, game ids, sticker keys, spoken rules and band-shift
   keys are unchanged.
2. **One narrator for every prompt.** `RoundNarrator` is the only construction
   site for a speaker glyph (`rg "new SpeakerButton" src` → one hit), serving
   eleven per-round prompts and twelve rule lines. Feelings Faces' caption
   fallback moved into it verbatim — unknown first `getVoices()`, settled-empty
   decision, displayed-round re-evaluation, no re-speak on flip.
3. **Audio focus and an honest play clock.** The BGM ducks to 8 % over 120 ms
   while narration speaks and restores on end, error, a 15 s watchdog or either
   settings toggle (never persisted). A hidden document pauses the BGM, cancels
   in-flight speech and pauses the play session, so backgrounded time neither
   talks nor spends a profile's daily budget.

One visible unification: the shared 250 ms success flash now applies to every
choice game, including the six that had none (documented in the product
changelog and the Phase 2 evidence).

## Verification

| Gate | Result |
| --- | --- |
| `pnpm check` | pass — one pre-existing warning (`musicalMemoryScene.test.ts:294`) |
| `pnpm typecheck` | pass |
| `pnpm test -- --run` | pass — 100 files, 2,149 tests (was 2,092) |
| `pnpm test:coverage` | pass — 98.07 / 90.28 / 98.15 / 98.93 vs 90 / 85 / 88 / 95 |
| `pnpm build` | pass — 271 modules, 44 precache entries |
| `validate-bundle.js` | PASS — shell 192.4 kB ≤ 200 kB |
| `validate-pwa.js` | PASS — 15/15 |

Per-phase evidence: `verification/phase-1.md` … `phase-5.md`, `phase-R1.md`,
`integrated.md`.

## Review findings

Round 1: 2 medium (five games silently gained the success flash; the shared
chunk passed NFR-1's per-chunk clause) and 5 low. All closed in Phase R1 —
including two real test pins (the correct-answer ordering, and the pre-init duck
contract), one facade fix in Number Order, and a centred touch floor that is
byte-identical for every shipped card. Round 2 re-reviewed the delta and passed.

## Follow-ups

- Real-device ear check for the duck level (8 %) and ramp (120 ms) — the
  workflow's recorded manual exception.
- Pre-existing and out of scope: duplicate `## Changelog — Game 20` sections and
  the stale "18 mini-games" header in `conductor/product.md`; face SVGs absent
  from the contact-sheet script.

## Checklist

- [x] Spec, plan, evidence and review recorded under `conductor/`
- [x] Docs synchronised (`README.md`, `conductor/tech-stack.md`,
  `conductor/product.md`)
- [x] All gates green on the final tree
- [x] No storage-schema change, no new dependency or asset
