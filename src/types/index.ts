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
  | "word-builder"
  | "how-many"
  | "first-sounds"
  | "more-less"
  | "odd-one-out"
  | "color-match"
  | "add-it-up"
  | "take-away"
  | "memory-match"
  | "decode-it";

export interface StickerData {
  earned: boolean;
  earnedAt: string | null;
}

/** Per-game learning stats for a profile (all zeroed by default). */
export interface GameProgress {
  /** Sessions started from the Hub. */
  plays: number;
  /** Completed sessions (every completion is a win by no-fail design). */
  wins: number;
  /** Correct answer taps across completed sessions. */
  correct: number;
  /** Incorrect answer taps across completed sessions. */
  wrong: number;
  /** ISO timestamp of the most recent play, or null when never played. */
  lastPlayedAt: string | null;
  /**
   * Rolling window of the last `WINDOW_SIZE` tap results (true = correct),
   * folded in when a session completes; drives adaptive band shifts.
   */
  recent: boolean[];
}

/** One day of aggregated play activity (key "YYYY-MM-DD", local). */
export interface DayActivity {
  day: string;
  plays: number;
}

export interface Settings {
  bgmEnabled: boolean;
  sfxEnabled: boolean;
  /** Preferred TTS voice URI (device-level); null = browser default voice. */
  preferredVoiceURI: string | null;
  /**
   * Parent-gated adaptive band ladders (device-level); true by default.
   * Off restores the fixed classic ladder for every game.
   */
  adaptiveDifficulty: boolean;
}

/**
 * Per-profile daily play-time budget. `limitMinutes: null` means unlimited;
 * usage resets when the local day key changes.
 */
export interface PlayTime {
  /** Daily limit in minutes; null = unlimited (default). */
  limitMinutes: number | null;
  /** Minutes used toward the limit on the day in `lastUsedDate`. */
  usedMinutes: number;
  /** Local date key ("YYYY-MM-DD") the used minutes belong to. */
  lastUsedDate: string;
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

/** All registered game ids, in hub order (shared by stickers and progress). */
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
  "add-it-up",
  "take-away",
  "memory-match",
  "decode-it",
];

export interface Profile {
  id: string;
  avatarId: AvatarId;
  createdAt: string;
  stickers: Record<GameId, StickerData>;
  /** Daily play-time budget (unlimited by default). */
  playTime: PlayTime;
  /** Per-game learning stats (zeroed by default). */
  progress: Record<GameId, GameProgress>;
  /** Last-7-days play activity (today + 6 prior, pruned on write). */
  activity: DayActivity[];
}

/** Profile-aware storage schema (key `abby-little-lab:v2`). */
export interface ProfileV2 {
  activeProfileId: string;
  profiles: Profile[];
  settings: Settings;
}
