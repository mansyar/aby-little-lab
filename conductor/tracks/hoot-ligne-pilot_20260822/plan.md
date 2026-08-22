# Implementation Plan — Professor Hoot: Ligne-Powered Animation Pilot

**Track ID:** `hoot-ligne-pilot_20260822` · **Type:** Feature · **Delivery:** v1.15.0
**Methodology:** Strict TDD for all runtime code per `conductor/workflow.md`
(Red → Green). Asset authoring follows Ligne's agent-authoring playbook:
small `mutate` batches → `validate` → `render` snapshots → `diff` → `compile`.
Gates before any task completion: `pnpm run check` → `CI=true pnpm test` →
`pnpm run build`. Every file-changing task: mark `[~]`, implement, verify,
commit + Git note, mark `[x]`, record SHA, separate `conductor(plan)` commit.

## Phase 1 — Asset Authoring and Pipeline Proof

- [ ] **Task 1.1: Verify authoring toolchain**
  - [ ] Locate/verify prebuilt `ligne-cli` (Ligne workspace at `D:\Projects\ligne`);
        record version; smoke-test `validate --help`.
  - [ ] Decide asset locations in this repo: authoring sources
        (`hoot.svg`, `hoot.ligne.json`) + compiled `hoot.ligne` under a new
        `assets/ligne/`; confirm import-path convention against Vite config.
- [ ] **Task 1.2: Author the rig-ready artboard (FR1)**
  - [ ] Write `hoot.svg`: Storybook Flat, thick 4–6px outline strokes, flat
        fills, brand palette continuity; named groups `body / head / eye_left /
        eye_right / beak / wing_left / wing_right / tail / feet`.
  - [ ] `ligne-cli import` → SceneDoc → `validate` → render static snapshot.
- [ ] **Task 1.3: Rig and animate the seven states (FR2)**
  - [ ] Bones/rig via small `mutate` batches; pose verification via render
        snapshots (wing raise, head tilt extremes).
  - [ ] Author states/transitions: idle loop (bob+blink+breathing), wave, nod,
        cheer, cheer_big, curious, flap_greeting; exit-time transitions back to
        idle, ~150ms cross-fades.
  - [ ] Quality gates on the asset: `validate` clean; `decompile ∘ compile`
        identity diff green; compile `hoot.ligne`.
  - [ ] Commit sources + compiled binary; Git note; SHA record; plan commit.
- [ ] **Task 1.4: Golden review checkpoint**
  - [ ] Render a labeled contact sheet of all 7 states; present to user.
  - [ ] Await explicit approval (rework loop if poses/motion rejected).
  - [ ] Phase checkpoint commit + verification note; `[checkpoint: <sha>]`.

## Phase 2 — Runtime Integration (TDD)

- [ ] **Task 2.1: Failing tests first (Red)**
  - [ ] Unit tests for `LigneMascot` against a mocked player interface:
        trigger mapping (wave/nod/cheer(big)/idleLoop/destroy → fireTrigger),
        swap orchestration (tween→Ligne in place, position/scale/depth kept),
        fallback on load failure/timeout, reduced-motion never loads, destroy
        cleanup (no leaks of canvas/listeners/tweens).
- [ ] **Task 2.2: Implement to Green**
  - [ ] Install `@ligne-engine/web@^0.2.1` + `@ligne-engine/bundler@^0.1.0`;
        wire the bundler's Vite plugin for `.ligne` imports.
  - [ ] `LigneMascot` component with exact API parity over `fireTrigger`;
        no input plugin (touch-inert preserved).
  - [ ] Lazy activation manager: post-boot dynamic import of engine chunk +
        character asset; hot-swap; silent tween fallback on failure/timeout;
        skip entirely under reduced motion.
  - [ ] Fire `curious` when a game scene starts (GameSceneBase create);
        `flap_greeting` on Hub load greeting slot.
  - [ ] Run targeted suite → Green; then full gates.
- [ ] **Task 2.3: Commit + phase checkpoint** (verification report incl.
      changed-file coverage; manual steps proposal; await user confirmation).

## Phase 3 — PWA Wiring and Performance Guardrails

- [ ] **Task 3.1: Caching split (FR5)**
  - [ ] Add `.ligne` character asset to precache glob; add runtimeCaching
        CacheFirst rule for the wasm engine chunk; ensure the chunk is excluded
        from precache globs.
  - [ ] Verify offline behavior: first visit online → engine cached; cold
        offline visit → tween fallback; subsequent offline visits → Ligne Hoot.
- [ ] **Task 3.2: Performance evidence**
  - [ ] Bundle report: new lazy chunk sizes vs baseline doc.
  - [ ] Boot time-to-interactive before/after (production preview build);
        confirm boot budget untouched.
- [ ] **Task 3.3: Gates + commit + phase checkpoint**

## Phase 4 — Release v1.15.0 Preparation

- [ ] **Task 4.1: Pre-release state check** (clean tree; no existing v1.15.0
      tag locally or remote).
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
