import {
  addProfile as addProfileToV2,
  availableAvatarIds,
  createDefaultStickers,
  deleteProfile as deleteProfileFromV2,
  migrateV1,
  normalizeV2,
  switchActiveProfile,
} from "../game/profileLogic";
import { addPlayTime, normalizePlayTime, setLimit } from "../game/playTimeLogic";
import type {
  AppStorage,
  AvatarId,
  GameId,
  PlayTime,
  Profile,
  ProfileV2,
  Settings,
} from "../types";

const V1_KEY = "abby-little-lab:v1";
const V2_KEY = "abby-little-lab:v2";

function readV1(): Partial<AppStorage> | null {
  const raw = localStorage.getItem(V1_KEY);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as Partial<AppStorage>;
  } catch {
    return null;
  }
}

function readV2(): ProfileV2 | null {
  const raw = localStorage.getItem(V2_KEY);
  if (raw === null) return null;
  try {
    return normalizeV2(JSON.parse(raw) as Partial<ProfileV2>);
  } catch {
    return null;
  }
}

/** Returns the current v2 state, migrating a v1 save (or fresh install) on first access. */
function ensureV2(): ProfileV2 {
  const existing = readV2();
  if (existing !== null) return existing;
  const v2 = migrateV1(readV1());
  saveV2(v2);
  return v2;
}

function saveV2(v2: ProfileV2): void {
  localStorage.setItem(V2_KEY, JSON.stringify(v2));
}

/**
 * Applies a pure transform to the v2 state and persists it.
 * Returns null when the mutator declines (nothing is persisted).
 */
function mutate(mutator: (v2: ProfileV2) => ProfileV2 | null): ProfileV2 | null {
  const next = mutator(ensureV2());
  if (next !== null) saveV2(next);
  return next;
}

/**
 * Reads storage as the legacy AppStorage shape: stickers from the ACTIVE
 * profile, settings from the device-global block. Never throws; corrupt or
 * missing data resolves to a fresh default profile.
 */
export function load(): AppStorage {
  const v2 = ensureV2();
  const active = v2.profiles.find((p) => p.id === v2.activeProfileId) ?? v2.profiles[0];
  return { stickers: active.stickers, settings: v2.settings };
}

/** Persists an AppStorage: stickers replace the ACTIVE profile's, settings are global. */
export function save(data: AppStorage): void {
  mutate((v2) => {
    const profiles = v2.profiles.map((p) =>
      p.id === v2.activeProfileId
        ? { ...p, stickers: { ...createDefaultStickers(), ...data.stickers } }
        : p,
    );
    return { ...v2, profiles, settings: { ...v2.settings, ...data.settings } };
  });
}

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

export function hasSticker(gameId: GameId): boolean {
  return load().stickers[gameId].earned;
}

export function getSettings(): Settings {
  return load().settings;
}

export function updateSettings(partial: Partial<Settings>): void {
  mutate((v2) => ({ ...v2, settings: { ...v2.settings, ...partial } }));
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
  return next !== null && next.activeProfileId === profileId;
}

export function getAvailableAvatars(): AvatarId[] {
  return availableAvatarIds(ensureV2());
}

/** Normalized play time for the active profile (or the profile with the given id). */
export function getPlayTime(profileId?: string): PlayTime {
  const v2 = ensureV2();
  const id = profileId ?? v2.activeProfileId;
  const profile = v2.profiles.find((p) => p.id === id) ?? v2.profiles[0];
  return normalizePlayTime(profile.playTime);
}

/** Sets (or clears with null) a profile's daily play-time limit. */
export function setPlayTimeLimit(profileId: string, limitMinutes: number | null): void {
  mutate((v2) => ({
    ...v2,
    profiles: v2.profiles.map((p) =>
      p.id === profileId ? { ...p, playTime: setLimit(p.playTime, limitMinutes) } : p,
    ),
  }));
}

/** Adds minutes to a profile's usage for today. */
export function recordPlayTime(profileId: string, minutes: number): void {
  mutate((v2) => ({
    ...v2,
    profiles: v2.profiles.map((p) =>
      p.id === profileId ? { ...p, playTime: addPlayTime(p.playTime, minutes) } : p,
    ),
  }));
}
