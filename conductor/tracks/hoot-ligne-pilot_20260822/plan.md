# Implementation Plan — Professor Hoot: Ligne-Powered Animation Pilot

**Track ID:** `hoot-ligne-pilot_20260822` · **Type:** Feature · **Delivery:** v1.15.0
**Methodology:** Strict TDD for all runtime code per `conductor/workflow.md`
(Red → Green). Asset authoring follows Ligne's agent-authoring playbook:
small `mutate` batches → `validate` → `render` snapshots → `diff` → `compile`.
Gates before any task completion: `pnpm run check` → `CI=true pnpm test` →
`pnpm run build`. Every file-changing task: mark `[~]`, implement, verify,
commit + Git note, mark `[x]`, record SHA, separate `conductor(plan)` commit.

## Phase 1 — Asset Authoring and Pipeline Proof [checkpoint: 8cc0c52]

- [x] **Task 1.1: Verify authoring toolchain**
  - [x] Locate/verify prebuilt `ligne-cli` (Ligne workspace at `D:\Projects\ligne`);
        record version; smoke-test `validate --help`. — **ligne-cli 0.2.0** at
        `D:\Projects\ligne\target\debug\ligne-cli.exe`; validate help OK.
  - [x] Decide asset locations in this repo: authoring sources
        (`hoot.svg`, `hoot.ligne.json`) + compiled `hoot.ligne` under a new
        `assets/ligne/`; confirm import-path convention against Vite config. —
        Decided `src/assets/ligne/` (matches existing `src/assets/svg/<cat>/`
        convention).
- [x] **Task 1.2: Author the rig-ready artboard (FR1)**
  - [x] Write `hoot.svg`: Storybook Flat, thick 4–6px outline strokes, flat
        fills, brand palette continuity; named groups `body / head / eye_left /
        eye_right / beak / wing_left / wing_right / tail / feet`. — Written;
        palette mirrored from mascot_idle.svg (#D69E2E/#C0801F/#F6AD55/#FFF8E7/
        #ED8936/#4FD1C5 pen, #2D3748 outlines); parts anchored via translate
        groups so imported nodes carry pivots (verified in SceneDoc: head
        tx=256/ty=170, wings at shoulders).
  - [x] `ligne-cli import` → SceneDoc → `validate` → render static snapshot. —
        import ok / validate ok / render ok; t0 PNG visually verified.
- [x] **Task 1.3: Rig and animate the seven states (FR2)** — recorded SHA: `84ce2e1`
  - [x] Bones/rig via small `mutate` batches; pose verification via render
        snapshots (wing raise, head tilt extremes). — Pivots achieved without
        bones: named translate-anchored groups import as nodes carrying their
        transforms; rotations compose correctly around them.
  - [x] Author states/transitions: idle loop (sway+blink), wave, nod,
        cheer, cheer_big, curious, flap_greeting; exit-time transitions back to
        idle, ~150ms cross-fades. — NOTE: engine limitations discovered in
        ligne-cli 0.2.0 renderer forced a rotation+FillAlpha-only design:
        Sx/Sy tracks sample ~0; any Tx/Ty track rebuilds the node transform
        dropping rest translation. Idle bob/breathing became a ±1.6° body sway;
        cheer hops became wing-raise + head-lift compositions; blink is two
        hidden gold eyelids toggled via FillAlpha tracks (SVG fill-opacity
        survives import). Animations/states/transitions/layers were injected by
        scripted SceneDoc authoring because the mutate vocabulary cannot create
        animations.
  - [x] Quality gates on the asset: `validate` clean; `decompile ∘ compile`
        identity diff green; compile `hoot.ligne` (18,100 bytes).
  - [x] Commit sources + compiled binary; Git note; SHA record; plan commit.
- [x] **Task 1.4: Golden review checkpoint**
  - [x] Render a labeled contact sheet of all 7 states; present to user. —
        DONE, with a material caveat: `ligne-cli render` ignores `--time` for
        animation sampling (every frame byte-identical), so static pose review
        of MOTION is impossible with the CLI; the sheet showed one fixed frame
        per clip doc.
  - [x] Await explicit approval (rework loop if poses/motion rejected). —
        User chose to close Phase 1 with motion verification DEFERRED: Phase 2
        opens with a live preview harness before any game integration.
  - [x] Phase checkpoint commit + verification note; `[checkpoint: 8cc0c52]`.

## Phase 2 — Runtime Integration (TDD)

- [x] **Task 2.0: Live motion-proof harness (NEW — gate for everything else)** — recorded SHA: `b755c71`
  - [x] Standalone preview page (not wired into the game) loading `hoot.ligne`
        via `@ligne-engine/web` `LignePlayer`; buttons fire each trigger
        (wave/nod/cheer/cheer_big/curious/flap_greeting); idle loop plays. —
        Implemented in `preview-hoot.html` + `src/preview/ligne-hoot.ts`.
  - [x] User visually confirms all seven states animate correctly in-browser.
        Rework loop on the asset if motion is wrong (edit SVG/SceneDoc →
        recompile → reload). NO further integration until this passes. — Passed
        after radians correction, safe `head_nod` wrapper, stronger flap motion,
        and child-friendly owl-professor art refinement; user: “looks fine.”

- [x] **Task 2.1: Failing tests first (Red)** — recorded SHA: `0bb6dcf`
  - [x] Unit tests for `LigneMascot` against a mocked player interface:
        trigger mapping (wave/nod/cheer(big)/idleLoop/destroy → fireTrigger),
        swap orchestration (tween→Ligne in place, position/scale/depth kept),
        fallback on load failure/timeout, reduced-motion never loads, destroy
        cleanup (no leaks of canvas/listeners/tweens). — RED confirmed: targeted
        suite fails on the intentionally missing `components/LigneMascot` module.
- [x] **Task 2.2: Implement to Green** — recorded SHAs: `460ef6b`, `83821d0`
  - [x] Install `@ligne-engine/web@^0.2.1` + `@ligne-engine/bundler@^0.1.0`;
        wire the bundler's Vite plugin for `.ligne` imports. — Production build
        emits the character asset and lazy Ligne JS/WASM chunks.
  - [x] `LigneMascot` component with exact API parity over `fireTrigger`;
        no input plugin (touch-inert preserved). — Canvas computed
        `pointer-events: none` in the live Hub.
  - [x] Lazy activation manager: post-boot dynamic import of engine chunk +
        character asset; hot-swap; silent tween fallback on failure/timeout;
        skip entirely under reduced motion.
  - [x] Fire `curious` when a game scene starts (GameSceneBase create);
        `flap_greeting` on Hub load greeting slot. — Reactions queue while the
        lazy player loads so the scene-entry trigger is not lost.
  - [x] Run targeted suite → Green; then full gates. — 63 files and 1,479 tests
        passed; Biome check and production build passed.
- [x] **Task 2.3: Commit + phase checkpoint** — recorded SHA: `6ea0c1d`
  - [x] Verification report covered all runtime/config/scene/test changes: Biome
        checked 135 files; all 63 test files and 1,481 tests passed; production
        build emitted the `.ligne` asset and lazy Ligne JS/WASM chunks.
  - [x] Live Hub verification confirmed the redesigned Ligne Hoot replaces the
        tween fallback, renders above Phaser, remains touch-inert, and produces
        no browser errors. User explicitly approved Phase 2.

## Phase 3 — PWA Wiring and Performance Guardrails

- [x] **Task 3.1: Caching split (FR5)** — recorded SHA: `c8c9a29`
  - [x] Add `.ligne` character asset to precache glob; add runtimeCaching
        CacheFirst rule for the wasm engine chunk; ensure the chunk is excluded
        from precache globs.
  - [x] Verify offline behavior: first visit online → engine cached; cold
        offline visit → tween fallback; subsequent offline visits → Ligne Hoot.
        Production Playwright verification observed 1 canvas after deleting the
        runtime cache and going offline, then 2 canvases online and on the next
        offline reload after `ligne-engine-wasm` was populated.
- [x] **Task 3.2: Performance evidence** — recorded SHA: `1449417`
  - [x] Bundle report: new lazy chunk sizes vs baseline doc. — shell 155.2
        KiB (≤200 KiB); Ligne bridge 32.04 kB raw / 9.44 kB gzip; WASM
        1,682.84 kB raw / 538.81 kB gzip; Hoot asset 29.31 kB.
  - [x] Boot time-to-interactive before/after (production preview build);
        confirm boot budget untouched. — navigation completed in 2065.0 ms
        (<3000 ms), and the first Ligne request began afterward at 2172.3 ms.
- [x] **Task 3.3: Gates + commit + phase checkpoint** — recorded SHA:
      `219527a`. All 1,481 tests, PWA/bundle validators, Biome, and production
      build passed; cold/subsequent offline behavior was verified in Chromium;
      user explicitly approved Phase 3.

## Phase 4 — Release v1.15.0 Preparation

- [x] **Task 4.1: Pre-release state check** — implementation tree clean before
      the plan marker; no `v1.15.0` tag exists locally or on `origin`.
- [ ] **Task 4.2: Version bump** — `npm version 1.15.0 --no-git-tag-version`;
      only package.json changes; build embeds `1.15.0`, zero stale refs.
- [ ] **Task 4.3: Release notes** — `docs/release-notes-v1.15.0.md` per house
      format, DRAFT until deployed (feature description + perf/caching notes).
- [ ] **Task 4.4: Phase checkpoint**

## Phase 5 — Tag, Deploy, and Live Verification

- [ ] **Task 5.1: Annotated tag `v1.15.0`** on verified master-lineage HEAD
      (house annotation message); verify target before push.
- [ ] **Task 5.2: Push master + tag; watch CI** — gates job green; Deploy to
      Coolify completes (master-lineage guard). Contingency: release-branch →
      PR flow if direct push is blocked (pause for user).
- [ ] **Task 5.3: Artifact verification** — live URL/sw.js/manifest 200;
      served bundle embeds `1.15.0`; wasm chunk served and CacheFirst-cached.
- [ ] **Task 5.4: Live smoke** — Hoot animates via Ligne on Hub + games
      (curious on game start, flap greeting, cheer on win, nod on miss);
      throttled/offline reload shows tween fallback gracefully.
- [ ] **Task 5.5: Phase checkpoint**

## Phase 6 — Finalize and Archive

- [ ] **Task 6.1: Finalize records** — release notes DRAFT → FINAL with deploy
      evidence; performance measurements recorded.
- [ ] **Task 6.2: Complete Conductor state** — metadata completed/archived;
      move track to archive; registry link update; archive commit + note.
- [ ] **Task 6.3: Final verification & checkpoint**
