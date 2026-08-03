export type GameId =
  | "shape-sorter"
  | "animal-trace"
  | "pop-freeze"
  | "shadow-match"
  | "musical-memory"
  | "big-small"
  | "pattern-builder"
  | "alphabet-match"
  | "word-match"
  | "word-builder";

export interface StickerData {
  earned: boolean;
  earnedAt: string | null;
}

export interface Settings {
  bgmEnabled: boolean;
  sfxEnabled: boolean;
}

export interface AppStorage {
  stickers: Record<GameId, StickerData>;
  settings: Settings;
}

/** Textless kid-profile avatars; each maps to an existing preloaded texture. */
export const AVATAR_IDS = ["cat", "dog", "pig", "frog", "duck", "bear"] as const;
export type AvatarId = (typeof AVATAR_IDS)[number];

/** Maximum number of kid profiles allowed on one device. */
export const MAX_PROFILES = 4;

/** Avatar used for the auto-created first profile (migration / fresh install). */
export const DEFAULT_AVATAR_ID: AvatarId = "cat";

export interface Profile {
  id: string;
  avatarId: AvatarId;
  createdAt: string;
  stickers: Record<GameId, StickerData>;
}

/** Profile-aware storage schema (key `abby-little-lab:v2`). */
export interface ProfileV2 {
  activeProfileId: string;
  profiles: Profile[];
  settings: Settings;
}
