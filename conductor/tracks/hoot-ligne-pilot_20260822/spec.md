# Specification — Professor Hoot: Ligne-Powered Animation Pilot

**Track:** `hoot-ligne-pilot_20260822` · **Type:** Feature · **Created:** 2026-08-22
**Delivery:** Minor release **v1.15.0** (tag → push → CI/CD auto-deploy)

## Goal

Replace Professor Hoot's two-static-poses + tween implementation (`src/components/Mascot.ts`) with a rigged, state-driven [Ligne](https://github.com/mansyar/ligne) character — authored code-first per Ligne's `docs/agent-authoring.md` playbook — while preserving every existing call site, the touch-inert product rule, and a zero-regression fallback path.

## Background & Compatibility Evidence

- Current mascot: two static SVG textures (`mascot_idle`, `mascot_celebrate`) driven by tweens — angle-wiggle wave/nod, scale-bounce cheer, bob + squash-blink idle loop, Graphics sparkle ring. Depth −1, touch-inert, corner placement.
- This project runs **phaser 4.2.1** — compatible with Ligne's shipped Phaser input plugin peer range (`>=4.0.0 <5`); however the input plugin is NOT needed here because Hoot stays touch-inert.
- Published packages to use (user-confirmed): `@ligne-engine/web@^0.2.1` (LignePlayer SDK) and `@ligne-engine/bundler@^0.1.0` (Vite plugin for `.ligne` imports).
- `ligne-cli` is already built in the local Ligne workspace (`D:\Projects\ligne`) — authoring commands available without a build step.
- Engine renders via WebGPU with transparent WebGL2 fallback (covers old audience tablets).
- Bundle reality: the wasm engine is ~645 KB gzipped vs current total precache ~1,575 KiB and a <3s boot budget on cheap tablets. Mitigation is architectural (FR4/FR5), not aspirational.

## Functional Requirements

### FR1 — New rig-ready artboard
Author a fresh Professor Hoot SVG designed for rigging (not a re-import of the old poses):
- Storybook Flat compliance per `conductor/product-guidelines.md`: flat fills, thick 4–6px `--outline` (#2D3748) strokes, no gradients/neon/pure RGB, brand palette continuity with the existing owl.
- Named groups so SVG import yields clean node ids: `body`, `head`, `eye_left`, `eye_right`, `beak`, `wing_left`, `wing_right`, `tail`, `feet`.
- Pipeline: `ligne-cli import` → SceneDoc → add bones/rig via `mutate` batches → verify poses with `render` PNG snapshots at multiple timestamps (agent has vision; user reviews goldens).

### FR2 — Seven authored states
Parity five plus two new, trigger-driven, one-shots exit-time back to idle (~150ms cross-fades):

| State | Trigger | Motion |
|---|---|---|
| `idle` | default | Looping gentle bob + periodic blink + subtle breathing |
| `wave` | `wave` | Right-wing raise and wiggle |
| `nod` | `nod` | Soft head pitch down-up (pairs with incorrect tone) |
| `cheer` | `cheer` | Wings up + body bounce ~1.1× |
| `cheer_big` | `cheer_big` | Bigger bounce ~1.2×, wings high |
| **new** `curious` | `curious` | Head tilt beat (fired when a game starts) |
| **new** `flap_greeting` | `flap_greeting` | Double wing-flap greeting |

Quality gates on the asset: `ligne-cli validate` clean; `decompile ∘ compile` identity diff green; compiled `.ligne` committed alongside its `.ligne.json` source of truth.

### FR3 — Drop-in runtime parity
New `LigneMascot` component exposes exactly the current public API (`wave()`, `nod()`, `cheer(big)`, `idleLoop()`, `destroy()`), implemented over `LignePlayer.fireTrigger`. Scene call sites (Hub + 18 game scenes via `createCornerMascot`) remain unchanged. Hoot remains non-interactive; no pointer listeners wired.

### FR4 — Lazy, resilient activation
- Scenes boot with today's tween mascot instantly — zero first-paint cost.
- After boot settles, the wasm chunk + `.ligne` asset are dynamically imported and Hoot hot-swaps in place at identical position/scale/depth.
- Load failure or timeout → tween mascot silently remains (it is kept permanently as fallback, not removed).
- Under `prefers-reduced-motion`, Ligne never loads at all — the tween path already honors reduced-motion durations.

### FR5 — Caching split
- Small `.ligne` character asset: **precached** (offline mascot from first install).
- Wasm engine chunk: **runtime-cached CacheFirst, excluded from precache** — an offline-first visit falls back to tween Hoot until the engine has been fetched once online.

## Non-Functional Requirements
- Full existing suite (currently 1468 tests) stays green; new unit tests cover swap orchestration, trigger mapping, fallback paths, and destroy cleanup against a mocked player interface.
- Boot time-to-interactive unchanged; before/after measurement recorded; bundle-size report documents the new lazy chunk.
- Biome check clean; TypeScript strict; house commit/git-note workflow per `conductor/workflow.md`.

## Acceptance Criteria
1. Golden render snapshots of all 7 states reviewed and approved by the user during authoring.
2. Live site: Hoot animates via Ligne on Hub and games; throttled/offline verification shows graceful tween fallback.
3. v1.15.0 tagged, deployed via CI/CD, verified live; track archived.

## Out of Scope
- Rigging game critters (Animal Trace animals, Pop & Freeze sleepers, Musical Memory frogs).
- Tap-Hoot-to-celebrate interactivity.
- Precaching the wasm engine.
- Any changes to gameplay, storage, transitions, or other characters.
