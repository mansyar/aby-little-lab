# Track: PWA Install & Update UX

## Overview

Aby's Little Lab is a PWA but has zero user-facing install/update UX. Parents get only browser-default behavior (Chrome Android shows a prompt; iOS Safari shows nothing), and updates install silently with no notice. This track adds a context-aware Install control in the parental Settings panel, iOS how-to-install guidance, an update-ready prompt, an offline-ready toast, and proper platform polish (icons + iOS meta tags).

## Functional Requirements

### FR1 — Update delivery: prompt + toast

- Change `vite-plugin-pwa` `registerType` from `autoUpdate` → `prompt`.
- Register via `virtual:pwa-register` (`registerSW({ immediate: true })`) and surface `onNeedRefresh` / `onOfflineReady`.
- `onNeedRefresh` → **"New version ready — Update now?"** toast on the Hub; "Update" calls `updateSW(true)` to reload with the new version; dismissible without reload.
- `onOfflineReady` → **"Ready to play offline"** toast, shown once per install.
- Toasts appear **Hub-only**: if an event fires during a game scene, it is queued and shown on return to Hub.

### FR2 — Context-aware Install control in Settings panel

- New row in `SettingsPanel` (already parental-lock-gated):
  - **Chrome/Android/Edge** (install prompt available) → **"Install App"** button; tap calls `prompt()`; hidden after `appinstalled`.
  - **iOS Safari** (no prompt event, not standalone) → **"How to Install"** button opening an instructions overlay (Share → Add to Home Screen), drawn in app style with visual cues, zero text dependency where feasible.
  - **Already installed / standalone** → control hidden entirely.
- Platform/state detection lives in a small pure-logic module (e.g., `src/utils/pwaInstall.ts`) so it's unit-testable.

### FR3 — Icon & meta polish

- Manifest gains a **192×192** icon and a **maskable** 512×512 icon (`purpose: "any maskable"`).
- `index.html` gains iOS meta tags (`apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`) and an `apple-touch-icon` link.

## Non-Functional Requirements

- Pure logic separated from Phaser for testability (TDD where applicable).
- Toasts styled with the existing palette, no new audio assets, reduced-motion-aware (no bounce under reduced motion).
- Touch targets ≥64px (96px ideal); app remains textless for kids — all prompts parent-facing.
- No regression: existing 592 tests stay green; coverage >80%.

## Acceptance Criteria

1. `registerType: "prompt"`; update toast appears on Hub when a new SW version is detected; "Update now" applies the new version.
2. Offline-ready toast appears once after first successful SW install.
3. Settings shows the context-aware install control per FR2 (three states verified).
4. `appinstalled` hides the Install button.
5. Manifest has 192px + maskable 512px icons; `index.html` has iOS tags + apple-touch-icon.
6. `pnpm run check`, `CI=true pnpm test`, `pnpm run build`, `node scripts/validate-pwa.js` all pass; manual Android phone verification of install + update flow.

## Out of Scope

- App version display in Settings, custom splash screen, push notifications, storage schema changes, Hub install icon, iOS-specific install for iPad beyond guidance.
