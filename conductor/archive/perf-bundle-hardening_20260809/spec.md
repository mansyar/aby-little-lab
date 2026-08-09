# Spec: Performance & Bundle Hardening

**Track ID:** `perf-bundle-hardening_20260809`
**Type:** Chore (Performance)

## Overview

The product is feature-complete (15/15 games, full 5×3 Hub grid). The remaining
risks are engineering-side:

- The shell bundle is **monolithic: 1,513 kB minified (383.5 kB gzip)**. Vite
  itself emits a >500 kB chunk-size warning. Game scenes are already
  lazy-loaded (2.7–5.4 kB each), but the Phaser engine + shell
  (Boot/Preload/Hub/SettingsPanel/AudioManager/Mascot/PWA bridge) live in one
  entry chunk whose hash changes on every release — forcing full re-download
  of the engine on each PWA update (the project ships a release every 1–2
  days).
- **Coverage guardrails have drifted**: `vite.config.ts` thresholds sit at 80%
  for all metrics while the suite actually runs at 96.77% stmts / 89.13%
  branch / 91.87% funcs / 98.1% lines (52 files, 1207 tests). A regression
  could silently halve quality and CI would still pass.
- All **152 SVGs are rasterized at 512×512 at every boot** in
  `PreloadScene.preload()` — the dominant boot-time cost, currently
  unmeasured against the <3s target.

## Functional Requirements

- **FR1** — Split the Phaser engine into its own vendor chunk, stable across
  releases, so app updates download only the shell delta.
- **FR2** — Remaining shell entry chunk ≤ 200 kB minified (strict
  acceptance, enforced by an automated script).
- **FR3** — PWA precache/offline guarantee and update UX
  (`registerType: "prompt"`, update toast) remain unchanged and validated.
- **FR4** — Raise coverage thresholds to lines 95 / statements 90 / functions
  88 / branches 85; the full suite must pass at the new thresholds (verified
  passable at current numbers: 96.77/89.13/91.87/98.1).
- **FR5** — Instrument PreloadScene boot asset load, measure against the
  <3s boot target, and only optimize if a real gap is proven (measure-first).

## Non-Functional Requirements

- NFR1: Zero user-visible behavior or visual change.
- NFR2: All 1207+ existing tests pass; coverage does not drop below the new
  thresholds.
- NFR3: Performance targets preserved: boot <3s, 60fps (min 30), memory
  <150MB, touch latency <16ms, audio <50ms.
- NFR4: Type safety and Biome code style per `code_styleguides/`; deterministic
  build; all CI quality gates green.

## Acceptance Criteria

- **AC1** — `pnpm run build` emits a distinct Phaser vendor chunk
  (e.g., `phaser-*.js`), separate from the shell entry chunk.
- **AC2** — Shell `index-*.js` ≤ 200 kB minified, enforced by a new
  `scripts/validate-bundle.js` wired into CI.
- **AC3** — `CI=true pnpm test` passes under the new coverage thresholds.
- **AC4** — `node scripts/validate-pwa.js` passes; precache contains vendor +
  shell chunks; offline play still works.
- **AC5** — Boot profiling report recorded (measured duration vs <3s target);
  optimization applied only if a gap is proven, otherwise documented as
  "no gap".
- **AC6** — Device spot-check rows (boot time + PWA update flow) added to
  `docs/device-testing-checklist.md` and executed on ≥1 device class.

## Out of Scope

- Game 16 or any new user-facing feature (Hub is a complete 5×3 grid).
- Per-game asset lazy-loading (shared textures make it risky) unless Phase 3
  profiling proves a specific asset tier is the bottleneck.
- Removal of the legacy `abby-little-lab:v1` localStorage key (deliberate
  rollback-safety design).
- v1.13.0 release execution — follow-up track per project convention.
- Refactoring scene layout families (no demonstrated duplication problem).
