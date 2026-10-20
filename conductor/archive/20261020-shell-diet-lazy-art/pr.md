# Shell Diet: Per-Game Lazy Art Chunks

Moves the 125 game-only SVG textures out of the boot shell so each game rasterizes
its own art when it is first opened, shrinking the shell entry from **195.4 KiB to
129.1 KiB** and cutting cold boot from **808 ms to 419.5 ms** (4×-throttled: ~4.2 s →
1,697.2 ms). Boot now rasterizes 53 textures instead of 178.

## What changed

- **Twelve art groups** (`shapes`, `cutouts`, `letters`, `numerals`, `animals`,
  `food`, `items`, `shadows`, `toys`, `faces`, `music`, `glyphs`) live under
  `src/game/art/`, 131 keys in total, 125 of them game-only. Frozen tables, one
  owner per key.
- **`preloadArtGroups(scene, groups)`** queues only keys absent from the
  TextureManager at `textureSizeFor(key)`, is repeat- and concurrency-safe, and
  releases its claim on `filecomplete`, `loaderror` or the owning scene's
  `shutdown` — so leaving a game mid-load cannot strand a key for the session.
- **All 21 game scenes** declare the groups they actually draw (Story Order keeps
  its own `storyOrderArt.ts`); `GameSceneBase.preloadArt` is the one entry point.
- **`PreloadScene` ships a 53-key shell set only**: 22 tile icons, 22 stickers,
  `mascot_idle`, `mascot_celebrate`, `icon_speaker` and the six profile avatars
  (the avatars alias game art and render in the Hub before any game loads).
- **A textless loading cue** (Hoot plus three pulsing dots, reduced-motion aware)
  covers the load, and a **failed key degrades to a neutral placeholder** plus one
  `console.warn` instead of Phaser's `__MISSING` checkerboard.

## Guards

- `shellOwnership.test.ts` — `PreloadScene` may not import a game-only SVG or the
  art registry (proved by injection, not by assertion count).
- `groupIntegrity.test.ts` — no key in two groups; 53 + 125 = 178 pinned.
- `artDeclarations.test.ts` — discovers scene sources with `import.meta.glob`, so a
  new game is scanned without editing the test; both directions checked.
- `validate-pwa.js` — fails when any emitted chunk is missing from the precache
  manifest (verified by deleting an entry from `sw.js`).
- `measure-first-tap.mjs` — five games including the widest union, gated on the
  worst total.

## Evidence

| Measure | Before | After |
| --- | --- | --- |
| Shell entry | 195.4 KiB | **129.1 KiB** (132.21 kB, 30.02 kB gzip) — 70.9 KiB under the 200 KiB gate |
| Cold boot (median of 3) | 808 ms | **419.5 ms** |
| Boot at 4× CPU throttle | ~4.2 s | **1,697.2 ms** |
| Textures rasterized at boot | 178 | **53** |
| Precache | 42 entries / 2,189.6 KiB | **53 entries / 1,701.34 KiB** |
| Cold first tap (increment vs pre-track) | — | **+82 ms** worst, **+48 ms** widest union (Find the Word, 83 keys); absolutes 224–334 ms vs a 400 ms budget |
| Offline first play | — | all 41 chunks served from cache after going offline |

Verification (`pnpm check`, `typecheck`, 110 files / 2,305 tests, coverage
97.8 / 90.73 / 96.34 / 98.59, build, `validate-bundle`, `validate-pwa`,
`validate-boot` median 0.95 s) is recorded in
`conductor/archive/20261020-shell-diet-lazy-art/verification/`.

Two review rounds (seven + seven findings) are closed in
`conductor/archive/20261020-shell-diet-lazy-art/review.md`; verdict `PASS`, no
overrides, no open debt.

## Notes for the reviewer

- Tier assignments and display sizes are untouched, so the result is visually
  identical; the 178→53 boot split is the only behavioural difference.
- `docs/perf-baseline.md` carries the dated before/after tables, including the
  measurement caveats (stage C stops at the first frame behind the cue; the tap
  comparison ran the baseline through a compressing static server, so its deltas
  are upper bounds).
- `docs/TDD.md` §3.3/§3.5 and `conductor/tech-stack.md` document the ownership rule
  so the next game does not put art back into the shell.
