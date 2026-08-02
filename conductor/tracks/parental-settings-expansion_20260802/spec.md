# Track: Parental Settings Expansion — App Version & Progress Reset

## Overview

Aby's Little Lab auto-updates silently (Coolify + service worker) and persists sticker progress permanently in localStorage. Parents currently have no way to see which version of the app is installed (a support/debugging gap) and no way to restart the sticker collection (needed for a second child, a hand-me-down device, or a fresh start). This track adds an **app version readout** to the parental Settings panel and a **parental-gated, two-step-confirmed "Reset Progress"** action that clears **only** the sticker collection while preserving the BGM/SFX audio settings.

## Functional Requirements

### FR1 — App version display

- The Settings panel shows the app version (e.g., "v1.0.0") in a footer row.
- The version is sourced from `package.json` `version` — the single source of truth — and exposed to the client via a Vite `define` (`__APP_VERSION__`), so the bundled client never imports package.json.
- The readout is parent-facing text inside the Settings panel only; gameplay remains textless for children.

### FR2 — Reset Progress (stickers only, two-step confirm)

- A new "Reset Progress" row is added to `SettingsPanel` (the panel is already gated behind the hold-for-3-seconds parental lock).
- Tapping the row opens a confirm modal — "Reset all stickers?" — with **Cancel** and **Reset** buttons, styled with the existing app palette, touch targets ≥64×64px (96px ideal), and no new audio.
- **Cancel** dismisses the modal without any change.
- **Reset** clears the sticker collection only: every game id returns to `earned: false, earnedAt: null`, while BGM/SFX settings are preserved; a lightweight confirmation feedback follows.
- The reset logic lives as pure `resetProgress(): void` in `src/utils/storage.ts` (TDD-able; mirrors the existing `load`/`save` patterns).
- The Hub sticker shelf reflects the reset (all stickers dimmed) on return to the Hub, via the existing shelf behavior of reading storage on scene create.

## Non-Functional Requirements

- Pure logic separated from Phaser for testability (TDD where applicable).
- No new audio assets and no new SVG assets.
- Reduced-motion aware: no bouncy animations for the confirm modal or feedback (fade-only under reduced motion).
- Touch targets ≥64×64px (96px ideal) on all new interactive elements.
- No regression: the existing test suite stays green; coverage >80%.
- The child-facing experience stays textless — all new UI is inside the parental Settings panel.

## Acceptance Criteria

1. The Settings panel footer shows the version from `package.json` (currently `1.0.0`); the displayed value updates automatically on version bumps.
2. A "Reset Progress" row exists in Settings; tapping it opens the confirm modal.
3. Cancel dismisses the modal without any change.
4. Reset clears all 7 stickers (`earned: false`, `earnedAt: null`), leaves BGM/SFX settings intact, and persists.
5. The Hub sticker shelf shows all stickers dimmed after the reset (verified on return to Hub).
6. `pnpm run check`, `CI=true pnpm test`, `pnpm run build`, and `node scripts/validate-pwa.js` all pass; manual device verification of the version display and reset flow is documented.

## Out of Scope

- Resetting audio settings or any non-sticker data.
- Multi-child profiles / per-child progress.
- Data export or backup.
- Version display outside the Settings panel (e.g., a Hub corner marker).
- Analytics or crash reporting.
