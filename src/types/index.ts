export type GameId =
  | "shape-sorter"
  | "animal-trace"
  | "pop-freeze"
  | "shadow-match"
  | "musical-memory"
  | "big-small"
  | "pattern-builder"
  | "alphabet-match";

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
