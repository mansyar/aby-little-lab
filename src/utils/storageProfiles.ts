import { normalizeNarrationPace } from "../game/narrationPace";
import {
  addProfile as addProfileToV2,
  availableAvatarIds,
  createDefaultStickers,
  deleteProfile as deleteProfileFromV2,
  switchActiveProfile,
} from "../game/profileLogic";
import type { AvatarId, CrashEntry, GameId, NarrationPace, Profile, Settings } from "../types";
import { appendCrash } from "./diagnostics";
import { setNarrationPace } from "./speech";
import { ensureV2, mutate } from "./storageEngine";

/** Marks a sticker as earned on the ACTIVE profile and persists. */
export function earnSticker(gameId: GameId): void {
  mutate((v2) => ({
    ...v2,
    profiles: v2.profiles.map((p) =>
      p.id === v2.activeProfileId
        ? {
            ...p,
            stickers: {
              ...p.stickers,
              [gameId]: { earned: true, earnedAt: new Date().toISOString() },
            },
          }
        : p,
    ),
  }));
}

/** Whether the ACTIVE profile has earned the sticker. */
export function hasSticker(gameId: GameId): boolean {
  return getActiveProfile().stickers[gameId].earned;
}

/** The device-global settings block of the current v2 state. */
export function getSettings(): Settings {
  return ensureV2().settings;
}

export function updateSettings(partial: Partial<Settings>): void {
  mutate((v2) => ({ ...v2, settings: { ...v2.settings, ...partial } }));
}

/**
 * The device's crash log, oldest first (FR-3).
 *
 * A copy, never the live array: `getSettings` hands out the settings block
 * itself for historical reasons, but a caller that could append to the log
 * behind `recordCrash`'s back would bypass the ring buffer and the write path
 * both.
 */
export function getDiagnostics(): CrashEntry[] {
  return [...ensureV2().settings.diagnostics];
}

/**
 * Records one crash against the device (FR-3, FR-4).
 *
 * It goes through `mutate`, the single write path, which is total: a store that
 * refuses the write leaves the entry in memory for the rest of the session and
 * the next accepted save persists it. There is deliberately no `try` here — the
 * save layer is written not to throw, and a catch no test can reach would be an
 * unexercised branch in the one function that must never fail.
 */
export function recordCrash(entry: CrashEntry): void {
  mutate((current) => ({
    ...current,
    settings: {
      ...current.settings,
      diagnostics: appendCrash(current.settings.diagnostics, entry),
    },
  }));
}

/** Clears the ACTIVE profile's stickers, keeping settings and other profiles. */
export function resetProgress(): void {
  mutate((v2) => ({
    ...v2,
    profiles: v2.profiles.map((p) =>
      p.id === v2.activeProfileId ? { ...p, stickers: createDefaultStickers() } : p,
    ),
  }));
}

export function getProfiles(): Profile[] {
  return ensureV2().profiles;
}

export function getActiveProfile(): Profile {
  const v2 = ensureV2();
  return v2.profiles.find((p) => p.id === v2.activeProfileId) ?? v2.profiles[0];
}

/** Adds a profile with the given avatar (becomes active). Null when full or avatar taken. */
export function addProfile(avatarId: AvatarId): Profile | null {
  const next = mutate((v2) => addProfileToV2(v2, avatarId));
  return next ? (next.profiles.find((p) => p.id === next.activeProfileId) ?? null) : null;
}

export function deleteProfile(profileId: string): void {
  mutate((v2) => deleteProfileFromV2(v2, profileId));
}

/** Switches the active profile; returns false for an unknown profile id. */
export function switchProfile(profileId: string): boolean {
  const next = mutate((v2) => switchActiveProfile(v2, profileId));
  const switched = next !== null && next.activeProfileId === profileId;
  if (switched) {
    // Pace belongs to the profile, not the device: the next utterance must
    // follow the profile the child just switched to.
    setNarrationPace(normalizeNarrationPace(getActiveProfile().narrationPace));
  }
  return switched;
}

/** Sets the ACTIVE profile's pace (FR-1) and applies it to the next utterance. */
export function setActiveProfileNarrationPace(pace: NarrationPace): void {
  mutate((v2) => ({
    ...v2,
    profiles: v2.profiles.map((p) =>
      p.id === v2.activeProfileId ? { ...p, narrationPace: pace } : p,
    ),
  }));
  setNarrationPace(pace);
}

export function getAvailableAvatars(): AvatarId[] {
  return availableAvatarIds(ensureV2());
}
