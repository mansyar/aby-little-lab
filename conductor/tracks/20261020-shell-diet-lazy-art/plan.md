# Shell Diet: Per-Game Lazy Art Chunks — Implementation Plan

> **Branch:** `refactor/20261020-shell-diet-lazy-art`
> **Base:** `master` @ `f377bf84b8f82fbd5371c7c8cc361d220b615594`
>
> Phase states are `pending`, `in_progress`, `verified`, `failed`, or `blocked`.
> Only the primary agent writes this file. Phase subagents report results and the
> primary records them.

## Phase 1: Art group modules and idempotent registry

- **Goal:** `src/game/art/` exists with all 12 named groups and a registry that rasterizes only missing keys, proven by unit tests; no shipped behaviour changes.
- **Depends on:** none
- **Covers:** FR-1, FR-2, AC-2, AC-3
- **Touches:** `src/game/art/**`, `src/__tests__/game/art/**`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage`
- **Status:** verified
- **Result:** verified
- **Checkpoint:** 4423b11
- **Evidence:** conductor/tracks/20261020-shell-diet-lazy-art/verification/phase-1.md

- [x] **P1.T1: Art group model and loader** - covers: FR-1, FR-2
  - [x] **P1.T1.1: Define `ArtGroup`/`ArtAsset` types and `preloadArtGroups(scene, groups)`** that skips keys already in the TextureManager, uses `toDataUri` + `textureSizeFor`, and is safe under concurrent calls
  - [x] **P1.T1.2: Add the group-id to group-table contract** so scenes pass statically imported group modules (Phaser's `preload` is synchronous, so groups cannot be dynamically imported there)
- [x] **P1.T2: Twelve group modules** - covers: FR-1
  - [x] **P1.T2.1: `shapes` (18), `cutouts` (18), `letters` (26), `numerals` (10)**
  - [x] **P1.T2.2: `animals` (6), `food` (6), `items` (16), `shadows` (8), `toys` (7), `faces` (4), `music` (4), `glyphs` (8)**
- [x] **P1.T3: Registry and group tests** - covers: AC-2, AC-3
  - [x] **P1.T3.1: Group integrity** - non-empty, key-unique within a group, no key in two groups, every key matches `^[a-z0-9_]+$`
  - [x] **P1.T3.2: Loader behaviour** - each key rasterized once at `textureSizeFor(key)`, second call is a no-op, concurrent scenes do not duplicate; primary review added the interrupted-load case (scene shutdown releases its in-flight keys)

## Phase 2: Shared loading cue and missing-key placeholder

- **Goal:** a textless, reduced-motion-aware cue shows while an art load is pending and a missing key degrades to a placeholder with one warning instead of throwing.
- **Depends on:** Phase 1
- **Covers:** FR-5, FR-6, AC-5
- **Touches:** `src/components/ArtLoadingCue.ts`, `src/game/art/placeholder.ts`, `src/__tests__/components/ArtLoadingCue.test.ts`, `src/__tests__/game/art/placeholder.test.ts`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage`
- **Status:** verified
- **Result:** verified
- **Checkpoint:** af436bf
- **Evidence:** conductor/tracks/20261020-shell-diet-lazy-art/verification/phase-2.md

- [x] **P2.T1: Loading cue** - covers: FR-5
  - [x] **P2.T1.1: Hoot plus three pulsing dots, textless, opacity-only under reduced motion, self-clearing**
  - [x] **P2.T1.2: `createArtLoadingCue(scene)` returning `{ show, clear, destroy }`, wired so a scene can start and stop it around a group load**
- [x] **P2.T2: Placeholder path** - covers: FR-6
  - [x] **P2.T2.1: Neutral outlined placeholder texture plus a single `console.warn` per missing key**
- [x] **P2.T3: Component tests** - covers: FR-5, AC-5
  - [x] **P2.T3.1: Cue lifecycle, reduced-motion branch, cleanup on shutdown**
  - [x] **P2.T3.2: Missing key yields placeholder and the round remains completable**

## Phase 3: Declare art groups in all 22 game scenes

- **Goal:** every game scene loads its declared groups in `preload`; a source scan proves declarations cover every texture the scene and its logic modules draw.
- **Depends on:** Phase 2
- **Covers:** FR-3, AC-4
- **Touches:** `src/scenes/*.ts`, `src/__tests__/scenes/**`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage`
- **Status:** verified
- **Result:** verified
- **Checkpoint:** 62dc293
- **Evidence:** conductor/tracks/20261020-shell-diet-lazy-art/verification/phase-3.md

- [x] **P3.T1: Declare groups for the 15 choice/math games** - covers: FR-3
  - [x] **P3.T1.1: Alphabet, WordMatch, WordBuilder, DecodeIt, FirstSounds, HowMany, MoreLess, OddOneOut, ColorMatch, MemoryMatch**
  - [x] **P3.T1.2: PatternBuilder, AddItUp, TakeAway, FeelingsFaces, PopFreeze**
- [x] **P3.T2: Declare groups for the 7 drag/sequence games** - covers: FR-3
  - [x] **P3.T2.1: ShapeSorter, ShadowMatch, BigSmall, NumberOrder, AnimalTrace, MusicalMemory, StoryOrder** (Story Order declares none; it owns its art)
- [x] **P3.T3: Declaration coverage test** - covers: AC-4
  - [x] **P3.T3.1: Source scan resolves each scene's declared group ids and fails when a literal or prefix key it draws is not covered**
  - [x] **P3.T3.2: Assert `storyOrderArt.ts` remains the only game-owned art module and that the scan's allowlist is explicit**

All textures still come from the shell in this phase, so there is deliberately
**no bundle change yet**; the registry sees every key already present and
no-ops.

## Phase 4: Shrink the shell to the documented set

- **Goal:** `PreloadScene` owns only the shell set (22 tiles, 22 stickers, 2 mascot poses, `icon_speaker`, 6 avatar keys); shell entry <= 170 KiB; games get their art from their own chunks.
- **Depends on:** Phase 3
- **Covers:** FR-4, NFR-1, NFR-3, AC-1, AC-7, AC-8
- **Touches:** `src/scenes/PreloadScene.ts`, `src/__tests__/scenes/preloadScene.test.ts`, `src/__tests__/scenes/navigation.test.ts`, `src/__tests__/utils/textureTiers.test.ts`, `scripts/measure-first-tap.mjs`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js`, then against `pnpm preview`: `node scripts/validate-boot.js`
- **Status:** verified
- **Result:** verified
- **Checkpoint:** 4f0a47c
- **Evidence:** conductor/tracks/20261020-shell-diet-lazy-art/verification/phase-4.md

- [x] **P4.T1: Trim `PreloadScene`** — covers: FR-4
  - [x] **P4.T1.1: Rename `SHAPE_ASSETS` to `SHELL_ASSETS` and drop the moved entries with their imports**
  - [x] **P4.T1.2: Document the shell set and why the 6 avatar keys stay eager (ProfileChip renders before any game)**
- [x] **P4.T2: Update shell tests** — covers: AC-1
  - [x] **P4.T2.1: Replace shape/cutout assertions with shell-set assertions and a "no game-only key" guard**
- [x] **P4.T3: Measure the cut** — covers: AC-7, AC-8
  - [x] **P4.T3.1: Record shell entry size and cold plus 4x-throttled boot medians versus 195.4 KiB and ~4.2 s**
  - [x] **P4.T3.2: Measure cold first tap for the widest game (Memory Match ring: animals + items + toys + glyphs) and confirm <= 400 ms over baseline**

`navigation.test.ts` and `textureTiers.test.ts` were widened into `Touches` during
the phase: both imported `SHAPE_ASSETS` and asserted the 178-key table, so the
rename made them red by design. They now assert the 53-key shell set from the
shell side.


## Phase 5: Precache guarantee, ownership guard, and docs

- **Goal:** offline first play is asserted by the validator, the ownership rule is enforced by tests, and the documentation matches the shipped behaviour.
- **Depends on:** Phase 4
- **Covers:** FR-7, FR-8, FR-9, NFR-2, NFR-5, AC-6, AC-9
- **Touches:** `scripts/validate-pwa.js`, `src/__tests__/game/art/**`, `README.md`, `conductor/tech-stack.md`, `docs/TDD.md`, `docs/perf-baseline.md`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-boot.js`
- **Status:** pending

- [ ] **P5.T1: Precache assertion** — covers: FR-7, NFR-2
  - [ ] **P5.T1.1: `validate-pwa` fails when any emitted art chunk is missing from the precache manifest**
- [ ] **P5.T2: Ownership guard** — covers: FR-8
  - [ ] **P5.T2.1: Static scan asserting no game-only art import reaches the shell, replacing the Story-Order-only assertion**
- [ ] **P5.T3: Documentation sync** — covers: FR-9
  - [ ] **P5.T3.1: README bundle/boot section plus `tech-stack.md` art-ownership rule**
  - [ ] **P5.T3.2: `TDD.md` bundle chapter plus `perf-baseline.md` addendum with measured before/after**
- [ ] **P5.T4: Integrated evidence** — covers: NFR-5
  - [ ] **P5.T4.1: Full gate run recorded in `verification/phase-5.md`, including a manual offline first-play check**

## Risks carried into execution

- **Phaser `preload` is synchronous**, so group modules must be statically
  imported by each scene; Vite will hoist shared groups into shared chunks. A
  dynamic-import registry would silently produce empty loads — the plan forbids
  it.
- **Shared keys** (`shape_*`, `sm_*`, `frog_*`, `animal_*`) are the collision
  surface; Phase 1 forbids a key in two groups and Phase 3's scan catches an
  undeclared prefix.
- **Avatars alias game art** — the six keys are the one deliberate shell/game
  overlap, so the shell-set test must assert them explicitly rather than
  comparing key sets by prefix.
