# Spec — Phone-Scale Hub UX + Boot/Texture Performance Hardening

**Track ID:** hub-phone-ux-perf_20261017
**Type:** Chore / Hardening
**Branch:** `feature/hub-phone-ux-and-boot-perf`
**Date:** 2026-10-17

## 1. Overview

The 20-game suite is complete, but two evidence-backed gaps remain before the next release:

1. **Hub layout risk:** The 5×4 tile grid (tiles 160×116 + spacing at a 1024×768 FIT canvas) shrinks to ~55–60px effective touch targets on the recorded narrow landscape phone (~740×360 CSS px) — below the 64px touch floor mandated by product guidelines. The 20-tile layout has never been device-class verified.
2. **Boot/texture risk:** All 170 SVGs rasterize at 512×512 (~178 MB potential GPU residency), prod boot is 2065 ms of a 3000 ms budget, and the `perf-baseline.md` deferred follow-ups (throttled-device re-measure, CI boot gate) were never executed.

## 2. Functional Requirements

### FR-1: Adaptive Paged Hub (narrow screens only)
- On narrow landscape phones, the Hub renders **2 pages of 10 tiles** (games 1–10, games 11–20) with **larger tiles** keeping effective touch targets ≥64px (ideal 96px) after FIT scaling.
- Wide screens (tablets) keep the existing single 5×4 grid — byte-identical behavior (no regression).
- **Navigation:** horizontal swipe recognized only over the tile-grid region (protects Back-hold, settings hold-zone, mascot taps, profile chip). Textless page dots (2 dots) under the grid indicate the active page. Slide transition is reduced-motion-aware (gentle/short or instant under `prefers-reduced-motion`).
- **Fixed furniture anchors:** Mascot, settings hold-zone, profile chip, and play-time arc occupy identical positions on both pages. The sticker shelf stays attached to its tile.
- **Idle attract:** unchanged behavior, applied to visible-tile set only (wiggle+chime on the current page); paging remains kid-initiated.
- Page state resets to page 1 on scene re-entry (consistent with current Hub statelessness).

### FR-2: Per-Use Texture Raster Tiers
- Replace the uniform 512×512 raster size (`PreloadScene.ts` `SVG_RASTER_SIZE`) with a per-asset tier system: tile icons/stickers sized for their largest display context (~128–160), game cards ~256, hero assets only at 512.
- Crispness verified on the narrow phone during the device pass (tier sized for the paged larger tiles, not the legacy grid).
- Preload table behavior otherwise unchanged (same 170 assets, same precache coverage, offline-first preserved).

### FR-3: Quick Wins
- **FR-3a Storage memoization:** `src/utils/storage.ts` caches the parsed/normalized v2 state in module scope, invalidated on write; all 29 per-tap `load().settings…` call sites benefit with no call-site changes.
- **FR-3b Boot font gate:** `ensureGlyphFontLoaded()` runs concurrently with early loader batches instead of serially blocking Boot→Preload (timeout semantics preserved).
- **FR-3c bgm precache trim:** re-encode `bgm.mp3` (1.29 MB) to a smaller bitrate/format compatible with all 4 device classes; precache manifest updated.

## 3. Non-Functional Requirements
- **Performance:** GPU texture memory reduced materially (target: ≥50% reduction vs ~178 MB potential); prod boot ≤ 2065 ms baseline (no regression) with headroom improved under 4× CPU throttle; 60fps Hub maintained.
- **Reduced motion:** all new motion (page slide, dot pulse) honors `prefers-reduced-motion`.
- **No new audio.** No text in the paged UI.
- **Testability:** storage cache and tier selection logic covered by unit tests; paging logic (page assignment, threshold) pure and testable.

## 4. Acceptance Criteria
1. Full 4-device-class verification per the refreshed `docs/device-testing-checklist.md` (checklist updated from 17→20 games, 5×4/2-page rows), including labels-readable/no-clipping and ≥64px touch targets on the narrow phone.
2. Before/after boot time + memory numbers recorded in `docs/perf-baseline.md`; 4×-throttle low-end re-measure documented; CI boot-time gate green.
3. All existing tests pass; new unit tests for storage cache + tiering + paging logic; biome/format clean.
4. Visual QA: tile/sticker icons crisp at paged sizes on the narrow device; no blurriness regressions on tablet.

## 5. Out of Scope
- Runtime Efficiency Pass items: Ligne mascot singleton/throttling, Hub tween consolidation, live reduced-motion toggle (deferred to the follow-up Runtime track).
- SettingsPanel de-nesting/scroll; any new games or gameplay features; cloud sync of progress.
