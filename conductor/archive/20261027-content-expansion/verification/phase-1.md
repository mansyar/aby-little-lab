# Phase 1 Evidence — Words pool expansion

- Track: 20261027-content-expansion — Content Expansion — Words, Stories, Scenarios
- Phase: 1 — Words pool expansion
- Date: 2026-10-27 (UTC)
- Branch: feat/20261027-content-expansion
- Base: 8fc81f30
- Head: 4053f82a
- Result: verified

## Summary

WORD_POOL grows 18 → 28 with 10 phonics-safe, band-placed words (5 tier-3:
MAP, FOX, CUP, BOX, BED; 5 tier-4: KITE, SOCK, BOOT, RING, PLUS). Every new
prompt reuses an existing texture key from art groups the word scenes already
preload (items, toys, shapes), so no new SVG was needed and `textureSizeFor`
tiering (card default) applies unchanged. Adaptive `shift` behavior and all
round-builder signatures are untouched (FR-5 belongs to Phase 4).

Because Decode It's pool spread WORD_POOL and appended FOX/CUP/MAP/BED, the
expansion would have duplicated those 4 entries inside DECODE_POOL (an FR-6
violation). The smallest fix — collapsing `DECODE_POOL` to `[...WORD_POOL]`
with matching decode-test updates — is recorded under Deviations.

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| unit | `pnpm test -- --run src/__tests__/game/word` | 0 | 1 file, 44 tests passed (28-word pool, tiers, rounds, shifts, tiles) |
| static | `pnpm typecheck` | 0 | `tsc --noEmit` clean |
| unit (deviation guard) | `pnpm test -- --run src/__tests__/game/decodeLogic.test.ts src/__tests__/game/firstSoundsLogic.test.ts` | 0 | 2 files, 59 tests passed — decode dedupe and phonics subset unaffected |

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| AC-1 | WORD_POOL grows by the approved batch; all new words phonics/TTS-safe and band-placed | `src/game/wordLogic.ts` (28 entries, `letters === word.length`, `tier === letters`); tests: 28-word list, 13/3-tier + 15/4-tier split, `/^[A-Z]{3,4}$/` TTS shape, no-duplicate, easy-first ordering intact | pass |
| AC-6 | No duplicates; placeholder fallback verified; suite gates green | No-duplicate tests in word + decode suites; `DECODE_POOL` deduped to `[...WORD_POOL]`; distractor first-letter-spread test (12 distinct initials, every target keeps ≥3 distractor groups); targeted suites + typecheck green | pass |
| FR-1 | WORD_POOL grows with phonics-safe, TTS-safe words in easy-first bands | 10 CVC/simple-decodable words (new initials M/K/R); clusters ≤ pool level (CK like DUCK, OO like BOAT, PL like FR/DR/TR); no new homophone traps beyond grandfathered SUN/BEAR | pass |
| FR-4 | Every new visual ships Storybook Flat SVG + tiered raster | All 10 keys pre-exist in items/toys/shapes groups preloaded by WordMatch/WordBuilder/DecodeIt scenes; raster tier via `textureSizeFor` (card default) unchanged; no new SVG required | pass |
| NFR-1 | New art complies with docs/SVG_STYLE.md | No new SVG authored; reused keys already comply | pass |
| NFR-2 | New words TTS-safe | Uppercase A–Z, 3–4 letters, common early-reader vocabulary; covered by TTS-shape + expected-words tests | pass |

## Evidence paths

- `src/game/wordLogic.ts` (pool 18 → 28)
- `src/__tests__/game/wordLogic.test.ts` (28-word expectations + spread/TTS tests)
- `src/game/decodeLogic.ts` (deviation: dedupe, see below)
- `src/__tests__/game/decodeLogic.test.ts` (deviation: 28-word expectations)
- Commits: `b194609b` (tests, red), `4053f82a` (implementation, green)

## Deviations

| File | Reason |
| --- | --- |
| `src/game/decodeLogic.ts` | `DECODE_POOL` spread `WORD_POOL` and appended FOX/CUP/MAP/BED. Expanding `WORD_POOL` with those same natural CVC words would duplicate 4 entries inside `DECODE_POOL` (FR-6). Collapsed to `DECODE_POOL = [...WORD_POOL]` (one-line change + header comment); behavior preserved — tier split math unchanged (earlyCount clamps identical for tier3 ≥ 3), all decode round/playthrough/shift tests green without logic edits. |
| `src/__tests__/game/decodeLogic.test.ts` | Required companion to the above: pool count 22 → 28, tier split 12/10 → 13/15, expected-words + KNOWN_TEXTURE_KEYS + reuse-mapping extensions, stale test-name fixes. |

No other files outside `Touches` were modified. (`conductor/tracks/.../spec.md`
shows as modified from the primary's planning work; untouched by this phase.)

## Notes

- Round-builder and adaptive signatures unchanged; `shuffle` from `./random`
  with trailing `rng` params preserved; no engine/scene/preload edits needed.
- Full-suite gate (`pnpm check`, coverage, build, bundle/PWA/docs) runs in
  Phase 4 per the track plan; Phase 1 verification per the brief is recorded
  in the Commands table above.

## Primary verification

- Command: `pnpm test -- --run src/__tests__/game/word && pnpm typecheck` — exit 0 (44/44 word tests pass; `tsc --noEmit` clean).
- Deviation guard: `pnpm test -- --run src/__tests__/game/decodeLogic.test.ts src/__tests__/game/firstSoundsLogic.test.ts` — exit 0 (59/59 pass; DECODE_POOL dedupe preserves behavior).
- Lint: `pnpm check` (biome) — exit 0, 260 files, no fixes.
- Squash guard: range `8fc81f30..HEAD` holds exactly the 3 reported commits (`b194609b`, `4053f82a`, `ab5911fe`), no merges, no user commits — squashed.
- Result: verified. Deviation (`decodeLogic.ts` + test) accepted as the smallest necessary FR-6 fix.
