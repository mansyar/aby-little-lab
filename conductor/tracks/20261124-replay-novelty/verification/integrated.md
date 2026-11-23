# Integrated verification — Replay Novelty (20261124-replay-novelty)

- **Track:** `20261124-replay-novelty` (feature, high)
- **Base:** `master @ 57389e8f160acb9de181eaf8c93d62c148b307ee`
- **Final implementation head:** `a29aa3fd`
- **Date:** 2026-11-24
- **Result:** PASS — ready for `conductor-review`

## Artifacts by phase

| Phase | Goal | Checkpoint | Evidence |
| --- | --- | --- | --- |
| 1 — Visit policy and selector | Per-profile in-memory visit + no-repeat selector + seeded metric | `83818e64` | `verification/phase-1.md` |
| 2 — Hub suggestion and idle cue | Textless suggestion ring + selector-driven idle wiggle + profile reset | `ae37c190` | `verification/phase-2.md` |
| 3 — Sticker shelf spotlight | One earned-sticker spotlight per visit, per-profile cursor, empty-slot fallback | `44be2e4a` | `verification/phase-3.md` |
| 4 — Doc sync and full gate | README/PRD/TDD + product roadmap synced; full gate green | `f8f1680a` | `verification/phase-4.md` |

## Change scope

`git diff --stat 57389e8f..HEAD`: 25 files, 1,615 insertions(+), 86 deletions(-).
Excluding `conductor/**`: 15 files, 919 insertions(+), 84 deletions(-).
Production sources are limited to `src/game/replayVariety.ts`,
`src/game/hub/replayCue.ts`, `src/game/hub/hubAttract.ts`,
`src/game/hub/stickerShelf.ts`, `src/game/hubGrid.ts` and `src/scenes/HubScene.ts`
plus their tests. No save-schema, game rule, SVG/art, audio, TTS, i18n or input
system file changed. Every production module stays ≤400 lines.

## Full `verify_phase` (final tree)

All commands exited 0:

| Command | Result |
| --- | --- |
| `pnpm check` | Biome clean, 367 files |
| `pnpm typecheck` | `tsc --noEmit` src + e2e clean |
| `pnpm test -- --run` | 155 files / 3,362 tests passed |
| `pnpm test:coverage` | 155 files / 3,362 tests; statements 97.09% (7,731/7,962), branches 90.82% (2,307/2,540), functions 96.31% (1,727/1,793), lines 98.26% (7,173/7,300) vs gates 95/88/85/90 |
| `pnpm build` | Vite 8.3.5, 489 modules; shell `index-Ddugd55k.js` 197.38 kB Vite / 192.8 kB via validator (≤200 kB); Phaser vendor 1,367.08 kB (pre-existing >500 kB advisory); storyOrderArt 81.84 kB |
| `node scripts/validate-bundle.js` | PASS — shell entry 192.8 kB ≤ 200 kB |
| `node scripts/validate-module-size.js` | 169 TypeScript files, zero warnings |
| `node scripts/validate-textures.js` | 319 SVGs (34 icon / 283 card / 2 hero); typical 76.07 MiB ≤ 80, full 319.00 MiB ≤ 320, ratio 0.238 ≤ 0.5 |
| `node scripts/validate-pwa.js` | 16 passed, 0 failed — 63 precache entries, BGM precached, 51/51 JS chunks, navigation route |
| `node scripts/validate-docs.js` | 5 passed, 0 failed |

## Acceptance criteria

| AC | Requirement | Evidence | Result |
| --- | --- | --- | --- |
| AC-1 | Memory-only per-profile visit state, no save change | `replayVariety.test.ts`, phase-1.md | Pass |
| AC-2 | No immediate repeat of last played/suggested game | `selectSuggestion` tests, 1,200 seeded visits | Pass |
| AC-3 | ≥4 median distinct games over eight-play visits | seeded simulation in `replayVariety.test.ts` | Pass |
| AC-4 | Textless suggestion cue; tile tap remains only launch path | `hubScene.test.ts` (ring, no speech), phase-2.md | Pass |
| AC-5 | Idle wiggle uses the same no-repeat selector | `hubAttract.test.ts` / `hubEngagement.test.ts`, phase-2.md | Pass |
| AC-6 | One earned-sticker spotlight per visit, empty-slot fallback | `hubGrid.test.ts` / `hubScene.test.ts`, phase-3.md | Pass |
| AC-7 | Profile switch resets visit + re-derives cue | `hubScene.test.ts` profile-switch case | Pass |
| AC-8 | No new SVG/audio/TTS/save field/game rule | diff scope; all guards green | Pass |
| AC-9 | Docs describe shipped behaviour; validator 5/5 | README/PRD/TDD/product.md, phase-4.md | Pass |
| AC-10 | Full `verify_phase` green on final tree | table above | Pass |

## Deviations and notes

- The cue and spotlight are static graphics rings (`lineStyle` + `strokeCircle`) — textless, no
  tween, no input interception; static under reduced motion by construction.
- Sticker-earned state is read directly from `getActiveProfile().stickers` (same state `hasSticker`
  reads) to preserve existing `hasSticker` call-count contracts in `navigation.test.ts`.
- `HubScene.ts` is held at 400 lines via comment compression; module-size guard reports zero
  warnings.
- `docs/perf-baseline.md` historical narrative ("same 154 files") left untouched; living counts
  updated to 155 / 3,362 in Phase 1 only.
- Several full-gate runs across phases cleared timing-sensitive Hub tests without source changes;
  final runs are green.

## Conclusion

All four phases verified with independent checks; full gate green; requirements AC-1..AC-10 covered.
Ready for `conductor-review`.
