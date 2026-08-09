import type {
  AppStorage,
  AvatarId,
  GameId,
  Profile,
  ProfileV2,
  Settings,
  StickerData,
} from "../types";
import { AVATAR_IDS, DEFAULT_AVATAR_ID, MAX_PROFILES } from "../types";
import { createDefaultPlayTime, normalizePlayTime } from "./playTimeLogic";
import { createDefaultProgressMap, normalizeProgressMap, pruneActivity } from "./progressLogic";

/** All registered game ids, in hub order (shared by progress and stickers). */
export const GAME_IDS: GameId[] = [
  "shape-sorter",
  "animal-trace",
  "pop-freeze",
  "shadow-match",
  "musical-memory",
  "big-small",
  "pattern-builder",
  "alphabet-match",
  "word-match",
  "word-builder",
  "how-many",
  "first-sounds",
  "more-less",
  "odd-one-out",
  "color-match",
];

/** Fresh sticker collection: every game unearned. */
export function createDefaultStickers(): Record<GameId, StickerData> {
  return Object.fromEntries(
    GAME_IDS.map((id) => [id, { earned: false, earnedAt: null }]),
  ) as Record<GameId, StickerData>;
}

function defaultSettings(): Settings {
  return { bgmEnabled: true, sfxEnabled: true, preferredVoiceURI: null };
}

/** Creates a profile with the given identity and a fresh sticker collection. */
export function createDefaultProfile(
  id: string,
  avatarId: AvatarId = DEFAULT_AVATAR_ID,
  createdAt = new Date().toISOString(),
): Profile {
  return {
    id,
    avatarId,
    createdAt,
    stickers: createDefaultStickers(),
    playTime: createDefaultPlayTime(new Date(createdAt)),
    progress: createDefaultProgressMap(),
    activity: [],
  };
}

/** Merges saved stickers over defaults so older saves backfill missing game ids. */
function mergeStickers(
  saved: Partial<Record<GameId, StickerData>> | null | undefined,
): Record<GameId, StickerData> {
  return { ...createDefaultStickers(), ...saved };
}

/**
 * Converts a v1 save into the v2 schema: the existing stickers and settings
 * become profile `p1` (the active profile). A missing/malformed v1 save
 * produces a fresh default profile so gameplay is immediately available.
 */
export function migrateV1(
  v1: Partial<AppStorage> | null,
  now = new Date().toISOString(),
): ProfileV2 {
  const profile = createDefaultProfile("p1", DEFAULT_AVATAR_ID, now);
  profile.stickers = mergeStickers(v1?.stickers);
  return {
    activeProfileId: "p1",
    profiles: [profile],
    settings: { ...defaultSettings(), ...v1?.settings },
  };
}

/**
 * Normalizes raw v2 data into a valid schema: backfills each profile's
 * sticker keys, guarantees at least one profile, repairs an invalid active
 * profile id, and merges settings with defaults.
 */
export function normalizeV2(
  raw: Partial<ProfileV2> | null,
  now = new Date().toISOString(),
): ProfileV2 {
  const settings = { ...defaultSettings(), ...raw?.settings };
  const savedProfiles = raw?.profiles;
  let profiles: Profile[];
  if (Array.isArray(savedProfiles) && savedProfiles.length > 0) {
    profiles = savedProfiles.map((p, index) => ({
      id: typeof p?.id === "string" && p.id !== "" ? p.id : `p${index + 1}`,
      avatarId: AVATAR_IDS.includes(p?.avatarId as AvatarId)
        ? (p?.avatarId as AvatarId)
        : DEFAULT_AVATAR_ID,
      createdAt: typeof p?.createdAt === "string" ? p.createdAt : now,
      stickers: mergeStickers(p?.stickers),
      playTime: normalizePlayTime(p?.playTime, new Date(now)),
      progress: normalizeProgressMap(p?.progress),
      activity: pruneActivity(p?.activity, new Date(now)),
    }));
  } else {
    profiles = [createDefaultProfile("p1", DEFAULT_AVATAR_ID, now)];
  }
  const activeProfileId = profiles.some((p) => p.id === raw?.activeProfileId)
    ? (raw?.activeProfileId as string)
    : profiles[0].id;
  return { activeProfileId, profiles, settings };
}

/** Avatars not yet claimed by any profile. */
export function availableAvatarIds(v2: ProfileV2): AvatarId[] {
  const used = new Set(v2.profiles.map((p) => p.avatarId));
  return AVATAR_IDS.filter((avatar) => !used.has(avatar));
}

/**
 * Adds a new profile with the given avatar (the new profile becomes active).
 * Returns null when the avatar is taken or the profile limit is reached.
 */
export function addProfile(
  v2: ProfileV2,
  avatarId: AvatarId,
  now = new Date().toISOString(),
): ProfileV2 | null {
  if (v2.profiles.length >= MAX_PROFILES) return null;
  if (v2.profiles.some((p) => p.avatarId === avatarId)) return null;
  const nextNumber =
    Math.max(0, ...v2.profiles.map((p) => parseInt(p.id.replace(/\D/g, ""), 10) || 0)) + 1;
  const profile = createDefaultProfile(`p${nextNumber}`, avatarId, now);
  return { ...v2, profiles: [...v2.profiles, profile], activeProfileId: profile.id };
}

/**
 * Removes a profile. Deleting the active profile activates the first
 * remaining one; deleting the last profile recreates a fresh default.
 * Returns the same state (unchanged) for an unknown profile id.
 */
export function deleteProfile(
  v2: ProfileV2,
  profileId: string,
  now = new Date().toISOString(),
): ProfileV2 {
  if (!v2.profiles.some((p) => p.id === profileId)) return v2;
  const profiles = v2.profiles.filter((p) => p.id !== profileId);
  if (profiles.length === 0) {
    return {
      activeProfileId: "p1",
      profiles: [createDefaultProfile("p1", DEFAULT_AVATAR_ID, now)],
      settings: v2.settings,
    };
  }
  const activeProfileId = v2.activeProfileId === profileId ? profiles[0].id : v2.activeProfileId;
  return { ...v2, profiles, activeProfileId };
}

/** Switches the active profile; returns the same state for an unknown id. */
export function switchActiveProfile(v2: ProfileV2, profileId: string): ProfileV2 {
  if (!v2.profiles.some((p) => p.id === profileId)) return v2;
  return { ...v2, activeProfileId: profileId };
}

/** Texture key for each avatar, reusing existing animal assets (no new SVGs). */
export const PROFILE_AVATAR_TEXTURES: Record<AvatarId, string> = {
  cat: "animal_cat",
  dog: "animal_dog",
  pig: "animal_pig",
  frog: "frog_red",
  duck: "sm_duck",
  bear: "toy_teddy_bear",
};
