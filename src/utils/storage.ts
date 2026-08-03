import type { AppStorage, GameId, Settings } from "../types";

const STORAGE_KEY = "abby-little-lab:v1";

function createDefaultStorage(): AppStorage {
  return {
    stickers: {
      "shape-sorter": { earned: false, earnedAt: null },
      "animal-trace": { earned: false, earnedAt: null },
      "pop-freeze": { earned: false, earnedAt: null },
      "shadow-match": { earned: false, earnedAt: null },
      "musical-memory": { earned: false, earnedAt: null },
      "big-small": { earned: false, earnedAt: null },
      "pattern-builder": { earned: false, earnedAt: null },
      "alphabet-match": { earned: false, earnedAt: null },
      "word-match": { earned: false, earnedAt: null },
      "word-builder": { earned: false, earnedAt: null },
    },
    settings: {
      bgmEnabled: true,
      sfxEnabled: true,
    },
  };
}

/** Reads AppStorage from localStorage, returning defaults if empty or corrupted. */
export function load(): AppStorage {
  const defaults = createDefaultStorage();
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) {
    return defaults;
  }
  let parsed: Partial<AppStorage>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return defaults;
  }
  // Merge saved data over defaults so saves from before a game shipped keep
  // working: every game id (and setting) always has an entry.
  return {
    stickers: { ...defaults.stickers, ...parsed.stickers },
    settings: { ...defaults.settings, ...parsed.settings },
  };
}

/** Persists AppStorage to localStorage as JSON. */
export function save(data: AppStorage): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** Marks a game's sticker as earned with the current ISO timestamp. */
export function earnSticker(gameId: GameId): void {
  const data = load();
  data.stickers[gameId] = {
    earned: true,
    earnedAt: new Date().toISOString(),
  };
  save(data);
}

/** Returns whether the sticker for the given game has been earned. */
export function hasSticker(gameId: GameId): boolean {
  return load().stickers[gameId].earned;
}

/** Returns the current audio settings (BGM/SFX toggle state). */
export function getSettings(): Settings {
  return load().settings;
}

/** Merges partial settings into storage and persists the result. */
export function updateSettings(partial: Partial<Settings>): void {
  const data = load();
  data.settings = { ...data.settings, ...partial };
  save(data);
}

/** Clears the sticker collection while preserving the audio settings. */
export function resetProgress(): void {
  const data = load();
  data.stickers = createDefaultStorage().stickers;
  save(data);
}
