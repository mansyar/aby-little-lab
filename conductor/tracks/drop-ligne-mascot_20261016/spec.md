# Specification: Drop Ligne Engine — Tween/SVG-Only Mascot

> **Track:** `drop-ligne-mascot_20261016` · **Type:** Chore (engine removal + refactor) · **Status:** new

## Overview

Remove the Ligne WASM animation engine from Aby's Little Lab and make the
existing tween-over-SVG-poses mascot the only implementation of Professor Hoot.
Measured cost of Ligne today: ~1.74 MB raw / ~545 KB gzip (WASM engine
1,682,843 B + JS bridge 32 KB + `hoot.ligne` 29 KB) — roughly **50% of the
3.38 MB service-worker precache** — plus a per-frame DOM-canvas compositor
overlay, multi-second WASM compilation on low-end devices, and dual-path
complexity in every mascot reaction. The tween fallback (wave, nod,
cheer/big-cheer, idle bob+blink over `mascot_idle` / `mascot_celebrate`) is
already shipped, tested, and is the experience all reduced-motion users get.
Two reaction gaps are closed with new tweens in this track.

## Functional Requirements

- **FR-1 — Engine deletion.** Delete `src/components/LigneMascot.ts`,
  `src/assets/ligne/hoot.ligne` + `hoot.ligne.json`,
  `src/preview/ligne-hoot.ts`, and
  `src/__tests__/components/LigneMascot.test.ts`. Remove
  `@ligne-engine/web` (runtime) and `@ligne-engine/bundler` (build) from
  `package.json` (+ lockfile), the `ligne()` plugin from `vite.config.ts`,
  the `.ligne` / `.wasm` precache globs, and the
  `@ligne-engine/bundler/module` entry from `tsconfig.json`.
- **FR-2 — Single-path mascot.** Strip all Ligne branches,
  `pendingLigneReaction`, `activateLigne`, and the `LigneMascotLoader` from
  `src/components/Mascot.ts`; `createCornerMascot` drops the loader param.
  - `curious()` (today a silent no-op without Ligne) becomes a head-tilt with
    a small hop.
  - `flapGreeting()` (today degrades to a plain wave) becomes a double-wave
    with a hop.
  - Both use the existing `motionDuration` / `motionScale` gating and the
    same two SVG poses; no new assets.
- **FR-3 — Validators.** `scripts/validate-pwa.js` Ligne precache assertions
  become absence checks (no `.wasm` / `.ligne` entries fail the build if
  present). The 200 kB shell budget in `validate-bundle.js` is unchanged.
- **FR-4 — Docs sweep.** Update `conductor/product.md` (mascot line),
  `conductor/tech-stack.md` (design-update entry), `docs/TDD.md` (mascot
  section), `docs/perf-baseline.md` (post-removal precache addendum), and
  `docs/device-testing-checklist.md` (Ligne offline-first rows). Historical
  release notes are left untouched.

## Non-Functional Requirements

- No kid-visible behavior change beyond mascot motion style (skeletal motion →
  pose tweens); all game scenes keep calling the same `Mascot` API.
- Boot budget stays < 3 s; reduced-motion path is behavior-identical.
- Precache target: ≤ ~1.9 MB (from 3.38 MB), zero `.wasm` / `.ligne` entries.

## Acceptance Criteria

1. `pnpm run check`, full `CI=true pnpm test`, `pnpm run build`,
   `node scripts/validate-pwa.js`, and `node scripts/validate-bundle.js`
   all green.
2. Production `dist/` contains no `.wasm` / `.ligne` files; precache ≤ ~1.9 MB.
3. `Mascot.test.ts` covers the new `curious()` tilt-hop and `flapGreeting()`
   wave-hop tweens (including reduced-motion variants); no test references Ligne.
4. No `ligne` (case-insensitive) matches remain in `src/`, `scripts/`,
   `vite.config.ts`, `tsconfig.json`, or `package.json`.

## Out of Scope

- New mascot poses or art assets.
- Version bump / release process (separate release track).
- Editing historical release notes.
- Removing the reduced-motion code paths.
