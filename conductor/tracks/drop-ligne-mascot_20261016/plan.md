# Implementation Plan: Drop Ligne Engine — Tween/SVG-Only Mascot

> **Track:** `drop-ligne-mascot_20261016` · **Spec:** [spec.md](./spec.md) (Source of Truth)
> TDD-ordered per `conductor/workflow.md`: tests first (Phase 1 RED), then
> implementation (Phase 2 GREEN), then config/validators with measured proof
> (Phase 3), then docs (Phase 4). Commit style `<type>(<scope>): <desc>`.

## Phase 1 — Tests first (RED)

- [x] Task 1.1: Extend `src/__tests__/components/Mascot.test.ts` with failing
  expectations for the new `curious()` tilt-hop and `flapGreeting()`
  wave-hop tweens, including reduced-motion variants (pose-swap, no bounce). [be143a7]
- [x] Task 1.2: Delete `src/__tests__/components/LigneMascot.test.ts`; run
  the mascot suite and confirm the new tests fail for the right reason
  (no implementation yet) and nothing else breaks. [be143a7 — deletion rode along in the Task 1.1 commit]
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2 — Single-path mascot (GREEN)

- [ ] Task 2.1: Strip Ligne from `src/components/Mascot.ts` — remove the
  `ligne` field, all `if (this.ligne)` branches, `pendingLigneReaction`,
  `activateLigne`, and the `LigneMascot`/`LigneMascotLoader` imports;
  `createCornerMascot` drops the loader param and the auto-activation.
- [ ] Task 2.2: Implement `curious()` tilt-hop and `flapGreeting()` wave-hop
  via `motionDuration` / `motionScale` gating (same two SVG poses, no new
  assets); mascot suite green.
- [ ] Task 2.3: Delete `src/components/LigneMascot.ts`,
  `src/assets/ligne/hoot.ligne` + `hoot.ligne.json`, and
  `src/preview/ligne-hoot.ts`; full test suite green.
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3 — Build config + validators (measured proof)

- [ ] Task 3.1: Remove `@ligne-engine/web` + `@ligne-engine/bundler` from
  `package.json` (regenerate lockfile), the `ligne()` plugin and
  `.ligne`/`.wasm` globs from `vite.config.ts`, and the bundler types entry
  from `tsconfig.json`.
- [ ] Task 3.2: `scripts/validate-pwa.js` Ligne precache assertions become
  absence checks; run `pnpm run check` + production build.
- [ ] Task 3.3: Record measured proof — `dist/` has zero `.wasm`/`.ligne`
  files, precache ≤ ~1.9 MB (from 3.38 MB); case-insensitive `ligne` search
  over `src/`, `scripts/`, `vite.config.ts`, `tsconfig.json`, `package.json`
  returns nothing.
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 4 — Docs sweep

- [ ] Task 4.1: Update `conductor/product.md` (mascot line),
  `conductor/tech-stack.md` (design-update entry), `docs/TDD.md` (mascot
  section), and `docs/device-testing-checklist.md` (Ligne offline-first rows).
- [ ] Task 4.2: Append the post-removal precache addendum to
  `docs/perf-baseline.md` with the measured Phase 3 numbers.
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Checkpoints

- Phase 1: `[checkpoint: pending]`
- Phase 2: `[checkpoint: pending]`
- Phase 3: `[checkpoint: pending]`
- Phase 4: `[checkpoint: pending]`
- Track: `[checkpoint: pending]`

## Verification Notes

- If any scene or test imports a removed Ligne symbol, STOP and fix the
  import — never re-add the engine to satisfy it.
- Coverage thresholds stay as-is; if the removal drops coverage below a
  gate, add tween-path tests rather than weakening the gate.
- Historical release notes (`docs/release-notes-*`) are never edited.
