# Plan — Phone-Scale Hub UX + Boot/Texture Performance Hardening

**Track ID:** hub-phone-ux-perf_20261017
**Spec:** [./spec.md](./spec.md)
**Workflow:** [conductor/workflow.md](../../../workflow.md)

## Phase 1 — Baseline Measurement & Device Checklist Refresh

- [ ] Task: Record current boot/memory baseline in `docs/perf-baseline.md` (prod build, local, + 4× CPU-throttle profile) — no code changes; establishes the "before" numbers FR/NFR acceptance depends on
  - [ ] Add throttle re-measure section (the deferred `perf-baseline.md` follow-up)
  - [ ] Record current texture memory estimate (170×512² audit)
- [ ] Task: Refresh `docs/device-testing-checklist.md` rows from 17→20 games (5×4 grid, 20 stickers, 20 progress rows, 20 Back buttons, 2-page Hub rows placeholder)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2 — Storage Memoization (TDD)

- [ ] Task: Write failing unit tests for module-scope v2-state cache (read caching, write invalidation, stale-after-mutate, normalize-once semantics) in `src/__tests__/`
- [ ] Task: Implement cache in `src/utils/storage.ts` (memoize `ensureV2()` parse/normalize, invalidate on `mutate()`/writes); no call-site changes
- [ ] Task: Verify existing storage tests + full suite green; commit
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3 — Per-Use Texture Raster Tiers

- [ ] Task: Write failing unit tests for tier-selection helper (asset→tier mapping: tile icons/stickers ~128–160 sized for largest display context, game cards ~256, heroes 512; default fallback)
- [ ] Task: Implement tier map + helper; refactor `PreloadScene.ts` `SVG_RASTER_SIZE` per-asset tiering (170-entry table gains a tier field)
- [ ] Task: Verify preload count unchanged (170), all scenes still find textures, visual spot-check dev build; commit
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 4 — Boot Quick Wins

- [ ] Task: TDD/verify font-gate concurrency (`src/utils/fonts.ts`): `ensureGlyphFontLoaded()` overlaps early loader batches; timeout semantics preserved; boot ≤ baseline
- [ ] Task: Re-encode `public/bgm.mp3` (1.29 MB → smaller) with quality check; verify precache manifest still includes it; PWA offline smoke
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 5 — Adaptive Paged Hub (TDD where logic-bearing)

- [ ] Task: Write failing unit tests for paging logic: narrow-threshold classification, 20-tile page assignment (1–10 / 11–20), page state reset on re-entry
- [ ] Task: Implement paging logic module (pure, `src/game/` or `src/utils/` following existing patterns)
- [ ] Task: Implement HubScene adaptive layout: narrow → 2 pages of larger tiles (≥64px effective after FIT), wide → byte-identical 5×4
- [ ] Task: Implement swipe gesture (grid region only) + textless page dots + reduced-motion-aware slide transition
- [ ] Task: Verify fixed furniture anchors identical on both pages; idle attract on visible tiles only; manual narrow-viewport smoke via dev server
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 6 — CI Boot Gate, Device Pass & Acceptance

- [ ] Task: Add CI boot-time gate (script + workflow step; fails if prod boot exceeds 3s budget; headroom threshold per spec)
- [ ] Task: Record after-numbers in `docs/perf-baseline.md` (boot, memory, texture audit before/after); update product.md changelog
- [ ] Task: Full 4-device-class verification incl. narrow phone: ≥64px targets, crisp icons at paged sizes, swipe+dots UX, no tablet regression (checklist rows executed)
- [ ] Task: Final review readiness: `pnpm run check`, `CI=true pnpm test`, `pnpm run build`, coverage ≥ threshold
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
