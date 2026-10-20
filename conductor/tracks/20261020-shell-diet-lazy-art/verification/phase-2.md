# Phase 2 — Shared loading cue and missing-key placeholder

- **Track:** `20261020-shell-diet-lazy-art` (Shell Diet: Per-Game Lazy Art Chunks)
- **Phase:** 2 of 5 — Shared loading cue and missing-key placeholder
- **Date:** 2026-10-20
- **Branch:** `refactor/20261020-shell-diet-lazy-art`
- **Base:** `d538b5e`
- **Head:** `898bf1d`
- **Result:** verified

## Summary

Two new components, neither wired into a scene yet:

- `src/components/ArtLoadingCue.ts` — `createArtLoadingCue(scene)` returns
  `{ show, clear, destroy }`. `show()` places `mascot_idle` at `MASCOT_SCALE` with
  three dots beneath it and pulses those dots in sequence (sine, opacity plus a
  1.15 scale, 420 ms, 140 ms stagger); `isReducedMotion()` replaces that loop with
  one static alpha and no scale change, and no tween is created at all. Every
  object is non-interactive (`setInteractive` is never called). `show()` is
  idempotent, `clear()` stops only tweens held by reference (never
  `scene.tweens.killAll()`), `destroy()` removes the objects and the one `shutdown`
  listener, and the scene's `shutdown` event destroys the cue by itself. When
  `mascot_idle` is not raster yet — or the scene double has no TextureManager — the
  cue still shows three dots instead of throwing.
- `src/game/art/placeholder.ts` — `ensureArtTexture(scene, key)` short-circuits for
  a texture that exists, and otherwise calls `console.warn` once per key per module
  lifetime and generates a white tile with the `#2D3748` outline at
  `textureSizeFor(key)`. A texture manager that refuses the canvas returns `false`
  rather than throwing.

Nothing shipped changed: no scene, no `PreloadScene`, no registry edit, no new
dependency. `pnpm build` produced `dist/assets/index-Dhenc0xK.js` at 200.12 kB
(195.4 KiB) — the same chunk name and size as the Phase 1 baseline.

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| Lint/format | `pnpm check` | 0 | 227 files checked; only the pre-existing biome schema-version info and the pre-existing `noNonNullAssertion` warning in `src/__tests__/scenes/musicalMemoryScene.test.ts` |
| Types | `pnpm typecheck` | 0 | clean |
| Unit tests | `pnpm test -- --run` | 0 | 107 files, 2,244 tests passed (Phase 1: 105 / 2,223) |
| Coverage | `pnpm test:coverage` | 0 | statements 98.16%, branches 90.72%, functions 98.17%, lines 98.99% (thresholds 90 / 85 / 88 / 95) |
| Gate chain | `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage` | 0 | run once, no retry |
| Supplementary | `pnpm build` | 0 | shell entry `index-Dhenc0xK.js` 200.12 kB (gzip 39.44 kB), unchanged |

Per-file coverage for the two new modules (from the JSON summary of the
satisfying run):

| File | Lines | Statements | Functions | Branches |
| --- | --- | --- | --- | --- |
| `src/components/ArtLoadingCue.ts` | 76/76 (100%) | 81/81 (100%) | 7/7 (100%) | 20/20 (100%) |
| `src/game/art/placeholder.ts` | 25/25 (100%) | 25/25 (100%) | 3/3 (100%) | 6/6 (100%) |

## Acceptance criteria

| AC | Statement | Proving tests |
| --- | --- | --- |
| AC-5 | A scene test proves a missing key yields a placeholder and a single warning, with the round still completable. | `src/__tests__/game/art/placeholder.test.ts` → "warns once for a repeated missing key and still creates the placeholder", "warns once for each distinct missing key", "returns true without touching anything when the texture exists", "sizes the placeholder with textureSizeFor", "fills the tile white inside a centred product outline", "returns false without throwing when the texture manager refuses a canvas", "never throws for an unusual key" |
| FR-5 | Shared loading cue renders during a pending art load and clears itself; no text; reduced-motion variant. | `src/__tests__/components/ArtLoadingCue.test.ts` → "shows Hoot at the mascot scale above the scene, with three dots beneath him", "stays textless and never captures pointer input", "reduced motion keeps the dots visible with a single static alpha and no tween", "clear hides everything and removes only the cue's own tweens", "self-destroys on scene shutdown, leaving no tweens or objects behind" |
| FR-6 | A missing key logs one warning and renders a neutral placeholder; it never throws and never blocks the round. | `src/__tests__/game/art/placeholder.test.ts` (all seven cases above) |
| NFR-3 | No visual regression apart from the cue. | Nothing shipped imports either module yet; `pnpm build` emits the identical shell chunk (`index-Dhenc0xK.js`, 200.12 kB) |

Additional Phase 2 behaviour covered by tests:

| Behaviour | Test |
| --- | --- |
| Camera centre is read at show time, not construction time | "reads the camera centre at show time, not at construction time" |
| `show()` idempotence | "is idempotent: showing twice builds one mascot, three dots and three tweens" |
| `clear()` then `show()` starts a fresh pulse | "can be shown again after clear, starting a fresh pulse" |
| `clear()` before first show and repeatedly | "clear is safe before the first show and when repeated" |
| `destroy()` removes objects, unhooks the listener, is repeatable, and blocks a later show | "destroy clears, removes the objects and unhooks the scene listener", "does not build anything when shown after destroy" |
| Dots-only fallback when `mascot_idle` is absent or the TextureManager is missing | "falls back to three dots when the mascot texture is not raster yet", "falls back to dots when the scene has no TextureManager at all" |

## Evidence paths

- `src/components/ArtLoadingCue.ts`
- `src/game/art/placeholder.ts`
- `src/__tests__/components/ArtLoadingCue.test.ts`
- `src/__tests__/game/art/placeholder.test.ts`
- Commits: `15e0cfd` (cue), `fb1db95` (placeholder), `c77e888` (cue tests), `898bf1d` (placeholder tests)

## Deviations

None. Every file written is inside the Phase 2 Touches globs
(`src/components/ArtLoadingCue.ts`, `src/game/art/placeholder.ts`,
`src/__tests__/components/ArtLoadingCue.test.ts`,
`src/__tests__/game/art/placeholder.test.ts`) plus this evidence file.

## Notes

- **Cue depth is `10`.** Scene content sits at the default depth `0`; the
  transient chrome overlays (`ProfileChip` picker, `PlayTimeIndicator` nudge) sit
  at 20–21, and `ParentLock`'s hold ring at 10000. Ten therefore covers the round
  being loaded while every overlay and the parental lock stay above it. The
  protected controls keep the default depth and are kept clear by position: the
  cue is centred and low (camera centre + 0.3 × camera height), the progress dots
  are at y 60 and the shared instruction line at y 112.
- **Dots-only fallback is deliberate.** Phase 3 scenes may create the cue in
  `create()` while `preload` is still rasterizing `mascot_idle`; a missing pose
  degrades to three dots rather than throwing, and the same guard keeps scene-test
  doubles (which do not model the TextureManager) honest.
- **Reduced motion creates no tween at all**, so `clear()` has nothing to remove
  on that path; the dots keep one static alpha of 0.55.
- **Tween ownership** mirrors `src/components/Mascot.ts`: the cue holds its own
  `Phaser.Tweens.Tween[]` and calls `remove()` per entry, so a scene's unrelated
  tweens are never touched.
- **Placeholder is not a temporary object.** `scene.textures.createCanvas` returns
  the texture itself, so no `Graphics` is generated and freed; the canvas is
  filled white, stroked with a 6 px `#2D3748` ring inset by half the stroke, then
  refreshed once.
- **Warn-once state is module-level and reset in tests by `vi.resetModules()`**,
  so the module exports `ensureArtTexture` only and has no test-only hook.
- Pre-existing diagnostics, unchanged by this phase and also present on `d538b5e`:
  biome reports that `biome.json` pins schema 2.5.5 while the CLI is 2.5.10
  (informational), and warns about a non-null assertion in
  `src/__tests__/scenes/musicalMemoryScene.test.ts`.
- Both new modules are 100% covered on every metric, which is why the text
  coverage table hides their rows (the reporter skips fully covered files); the
  per-file numbers above come from `coverage/coverage-summary.json`.

## Primary verification

The chain above was run once, end to end, after the last commit, at `898bf1d`;
`pnpm build` was run once afterwards as a supplementary check and left the working
tree clean.
