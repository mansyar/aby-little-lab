# Spec: Multi-Kid Profiles

- **Track ID:** `multi-kid-profiles_20260804`
- **Type:** Feature
- **Status:** Approved (new)

## 1. Overview

The app currently stores all sticker progress under a single global save (`abby-little-lab:v1`). Siblings sharing a device overwrite each other's collections. This track introduces up to **4 kid profiles**, each with its own sticker collection, selected through a **kid-tappable avatar switcher** on the Hub. Profile **creation/deletion is parental-gated** (hold 3s). Existing saves **auto-migrate** into the first profile — zero data loss, zero prompts.

## 2. Functional Requirements

### FR1 — Storage v2 (profile-aware)
- New schema key `abby-little-lab:v2`:
  ```typescript
  interface ProfileV2 {
    activeProfileId: string;
    profiles: Array<{
      id: string;                  // e.g. "p1".."p4"
      avatarId: string;            // one of AVATAR_IDS
      createdAt: string;           // ISO timestamp
      stickers: { [gameId: string]: { earned: boolean; earnedAt: string | null } };
    }>;
    settings: { bgmEnabled: boolean; sfxEnabled: boolean };  // global, unchanged
  }
  ```
- The v1 key is **read but never destroyed** — migration is additive, so nothing is lost even if a rollback happens.

### FR2 — Auto-migration
- On load: if v2 absent but v1 present → create profile `p1` with the default avatar, move v1 stickers into it, preserve settings, activate `p1`. No prompts.
- Fresh install (no v1, no v2) → auto-create default profile `p1` so the kid can play immediately.

### FR3 — Textless avatar identity
- Fixed avatar set reusing **existing animal textures** (e.g., cat, dog, pig, frog, duck, bear from current pools) — **zero new SVG assets**.
- Each avatar is usable by **one profile only**; the picker shows only unused avatars.
- Active profile's avatar shows as a **Hub chip** (kid-facing, ≥ 96×96 target).

### FR4 — Kid-tappable profile switcher (Hub)
- Tapping the Hub avatar chip opens a kid-friendly picker overlay (large avatar tiles).
- Switching is **instant, no parental lock**, updates `activeProfileId`, and **re-renders the sticker shelf** in place (reuse the existing `rerenderStickerShelf()` mechanism).

### FR5 — Parental-gated profile management (Settings)
- Behind the parental hold, a **Profiles** section in `SettingsPanel`:
  - **Add profile** — up to 4; choose from unused avatars (large tiles).
  - **Delete profile** — two-step confirm modal (reuse the Reset-Progress modal pattern): "Delete profile? All stickers will be lost."
- Deleting the **active** profile activates the first remaining one; deleting the last profile recreates a fresh default.

### FR6 — Per-profile sticker behavior
- Award, `justEarned` highlight, and shelf all operate on the **active profile** only.
- Sticker earned in profile A is invisible to profile B.

## 3. Non-Functional Requirements

- Textless for kids — avatars only; parent-facing text appears only behind the lock.
- Touch targets ≥ 64×64px (ideal 96×96px) per existing UX principles.
- Pure, testable profile logic in `src/utils/storage.ts` (or a new `src/game/profileLogic.ts`) following the existing per-key merge pattern.
- No new runtime dependencies; no backend.

## 4. Acceptance Criteria

1. Existing v1 save migrates to `p1` with all stickers intact; BGM/SFX settings preserved; v1 key untouched.
2. Fresh install creates a default profile; gameplay is immediately available.
3. Kid taps the Hub chip → picker opens → switching updates the shelf without reload; no parental lock required.
4. Add profile is parental-gated, capped at 4, no duplicate avatars, always ≥ 1 profile.
5. Delete is parental-gated with two-step confirm; active-profile deletion falls back safely.
6. Stickers are strictly per-profile.
7. All existing tests pass; new modules ≥ 80% coverage; `pnpm run check`, `CI=true pnpm test`, `pnpm run build` all green.

## 5. Out of Scope

- Renaming profiles, per-profile audio settings, cloud sync, play-time limits, per-profile difficulty.
- Release execution (separate release track, per repo convention).
