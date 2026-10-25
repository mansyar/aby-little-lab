import { vi } from "vitest";
import { endPlaySession, startPlaySession, todayKey } from "../../game/playTimeLogic";
import { createDefaultStickers } from "../../game/profileLogic";
import { createDefaultProgressMap } from "../../game/progressLogic";
import type { AppStorage, GameId } from "../../types";
import {
  addProfile,
  deleteProfile,
  earnSticker,
  getActiveProfile,
  getAdaptiveBandShift,
  getAvailableAvatars,
  getPlayTime,
  getProfiles,
  getProgress,
  getSettings,
  hasSticker,
  recordGamePlay,
  recordGameResult,
  recordGameTaps,
  recordPlayTime,
  resetProgress,
  setPlayTimeLimit,
  switchProfile,
  updateSettings,
} from "../../utils/storage";

const V1_KEY = "abby-little-lab:v1";
const V2_KEY = "abby-little-lab:v2";

/**
 * The migration-input view of the current state — the active profile's
 * stickers plus the device-global settings. The legacy `load()` export is
 * retired (FR-5); reads go through the granular API instead.
 */
function readActiveState() {
  return { stickers: getActiveProfile().stickers, settings: getSettings() };
}

const GAME_IDS: GameId[] = [
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
];

describe("Storage utilities", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("storage reads", () => {
    it("serves default stickers and settings when storage is empty", () => {
      const result = readActiveState();

      for (const gameId of GAME_IDS) {
        expect(result.stickers[gameId]).toEqual({
          earned: false,
          earnedAt: null,
        });
      }

      expect(result.settings.bgmEnabled).toBe(true);
      expect(result.settings.sfxEnabled).toBe(true);
    });

    it("serves default stickers and settings when storage contains invalid JSON", () => {
      localStorage.setItem(V1_KEY, "invalid-json");
      const result = readActiveState();

      expect(result.stickers["shape-sorter"].earned).toBe(false);
      expect(result.settings.bgmEnabled).toBe(true);
    });

    it("migrates an older save that predates a game by backfilling default sticker entries", () => {
      // Simulate a save from before Game 7 shipped: no "pattern-builder" key.
      const oldSave = {
        stickers: {
          "shape-sorter": { earned: true, earnedAt: "2026-07-28T00:00:00.000Z" },
          "animal-trace": { earned: false, earnedAt: null },
          "pop-freeze": { earned: false, earnedAt: null },
          "shadow-match": { earned: false, earnedAt: null },
          "musical-memory": { earned: false, earnedAt: null },
          "big-small": { earned: false, earnedAt: null },
        },
        settings: { bgmEnabled: false, sfxEnabled: true },
      };
      localStorage.setItem(V1_KEY, JSON.stringify(oldSave));

      const result = readActiveState();

      // The new game gets a fresh unearned entry instead of crashing.
      expect(result.stickers["pattern-builder"]).toEqual({
        earned: false,
        earnedAt: null,
      });
      // Existing progress and settings are preserved.
      expect(result.stickers["shape-sorter"].earned).toBe(true);
      expect(result.stickers["shape-sorter"].earnedAt).toBe("2026-07-28T00:00:00.000Z");
      expect(result.settings.bgmEnabled).toBe(false);
      expect(result.settings.sfxEnabled).toBe(true);
    });

    it("migrates a save from before Game 8 by backfilling the alphabet-match sticker entry", () => {
      // Simulate a save from before Game 8 shipped: no "alphabet-match" key.
      const oldSave = {
        stickers: {
          "shape-sorter": { earned: true, earnedAt: "2026-07-28T00:00:00.000Z" },
          "animal-trace": { earned: false, earnedAt: null },
          "pop-freeze": { earned: false, earnedAt: null },
          "shadow-match": { earned: false, earnedAt: null },
          "musical-memory": { earned: false, earnedAt: null },
          "big-small": { earned: false, earnedAt: null },
          "pattern-builder": { earned: true, earnedAt: "2026-08-01T00:00:00.000Z" },
        },
        settings: { bgmEnabled: true, sfxEnabled: false },
      };
      localStorage.setItem(V1_KEY, JSON.stringify(oldSave));

      const result = readActiveState();

      expect(result.stickers["alphabet-match"]).toEqual({
        earned: false,
        earnedAt: null,
      });
      // Existing progress and settings are preserved.
      expect(result.stickers["pattern-builder"].earned).toBe(true);
      expect(result.stickers["shape-sorter"].earned).toBe(true);
      expect(result.settings.bgmEnabled).toBe(true);
      expect(result.settings.sfxEnabled).toBe(false);
    });

    it("migrates a save from before the word games by backfilling word-match and word-builder sticker entries", () => {
      // Simulate a save from before Games 9 & 10 shipped: no word ids.
      const oldSave = {
        stickers: {
          "shape-sorter": { earned: true, earnedAt: "2026-07-28T00:00:00.000Z" },
          "animal-trace": { earned: false, earnedAt: null },
          "pop-freeze": { earned: false, earnedAt: null },
          "shadow-match": { earned: false, earnedAt: null },
          "musical-memory": { earned: false, earnedAt: null },
          "big-small": { earned: false, earnedAt: null },
          "pattern-builder": { earned: false, earnedAt: null },
          "alphabet-match": { earned: true, earnedAt: "2026-08-02T00:00:00.000Z" },
        },
        settings: { bgmEnabled: false, sfxEnabled: false },
      };
      localStorage.setItem(V1_KEY, JSON.stringify(oldSave));

      const result = readActiveState();

      expect(result.stickers["word-match"]).toEqual({ earned: false, earnedAt: null });
      expect(result.stickers["word-builder"]).toEqual({ earned: false, earnedAt: null });
      // Existing progress and settings are preserved.
      expect(result.stickers["alphabet-match"].earned).toBe(true);
      expect(result.stickers["shape-sorter"].earned).toBe(true);
      expect(result.settings.bgmEnabled).toBe(false);
      expect(result.settings.sfxEnabled).toBe(false);
    });

    it("migrates a save from before Game 13 by backfilling the more-less sticker entry", () => {
      // Simulate a save from before More or Less shipped: no "more-less" key.
      const oldSave = {
        stickers: {
          "shape-sorter": { earned: true, earnedAt: "2026-07-28T00:00:00.000Z" },
          "animal-trace": { earned: false, earnedAt: null },
          "pop-freeze": { earned: false, earnedAt: null },
          "shadow-match": { earned: false, earnedAt: null },
          "musical-memory": { earned: false, earnedAt: null },
          "big-small": { earned: false, earnedAt: null },
          "pattern-builder": { earned: false, earnedAt: null },
          "alphabet-match": { earned: false, earnedAt: null },
          "word-match": { earned: false, earnedAt: null },
          "word-builder": { earned: false, earnedAt: null },
          "how-many": { earned: false, earnedAt: null },
          "first-sounds": { earned: true, earnedAt: "2026-08-08T00:00:00.000Z" },
        },
        settings: { bgmEnabled: true, sfxEnabled: false },
      };
      localStorage.setItem(V1_KEY, JSON.stringify(oldSave));

      const result = readActiveState();

      // The new game gets a fresh unearned entry instead of crashing.
      expect(result.stickers["more-less"]).toEqual({ earned: false, earnedAt: null });
      // Existing progress and settings are preserved.
      expect(result.stickers["first-sounds"].earned).toBe(true);
      expect(result.settings.bgmEnabled).toBe(true);
      expect(result.settings.sfxEnabled).toBe(false);
    });

    it("migrates a save from before Game 14 by backfilling the odd-one-out sticker entry", () => {
      // Simulate a save from before Odd One Out shipped: no "odd-one-out" key.
      const oldSave = {
        stickers: {
          "shape-sorter": { earned: true, earnedAt: "2026-07-28T00:00:00.000Z" },
          "animal-trace": { earned: false, earnedAt: null },
          "pop-freeze": { earned: false, earnedAt: null },
          "shadow-match": { earned: false, earnedAt: null },
          "musical-memory": { earned: false, earnedAt: null },
          "big-small": { earned: false, earnedAt: null },
          "pattern-builder": { earned: false, earnedAt: null },
          "alphabet-match": { earned: false, earnedAt: null },
          "word-match": { earned: false, earnedAt: null },
          "word-builder": { earned: false, earnedAt: null },
          "how-many": { earned: false, earnedAt: null },
          "first-sounds": { earned: true, earnedAt: "2026-08-08T00:00:00.000Z" },
          "more-less": { earned: true, earnedAt: "2026-08-08T00:00:00.000Z" },
        },
        settings: { bgmEnabled: true, sfxEnabled: false },
      };
      localStorage.setItem(V1_KEY, JSON.stringify(oldSave));

      const result = readActiveState();

      // The new game gets a fresh unearned entry instead of crashing.
      expect(result.stickers["odd-one-out"]).toEqual({ earned: false, earnedAt: null });
      // Existing progress and settings are preserved.
      expect(result.stickers["more-less"].earned).toBe(true);
      expect(result.stickers["first-sounds"].earned).toBe(true);
      expect(result.settings.bgmEnabled).toBe(true);
      expect(result.settings.sfxEnabled).toBe(false);
    });

    it("migrates a save from before Game 15 by backfilling the color-match sticker entry", () => {
      // Simulate a save from before Color Match shipped: no "color-match" key.
      const oldSave = {
        stickers: {
          "shape-sorter": { earned: true, earnedAt: "2026-07-28T00:00:00.000Z" },
          "animal-trace": { earned: false, earnedAt: null },
          "pop-freeze": { earned: false, earnedAt: null },
          "shadow-match": { earned: false, earnedAt: null },
          "musical-memory": { earned: false, earnedAt: null },
          "big-small": { earned: false, earnedAt: null },
          "pattern-builder": { earned: false, earnedAt: null },
          "alphabet-match": { earned: false, earnedAt: null },
          "word-match": { earned: false, earnedAt: null },
          "word-builder": { earned: false, earnedAt: null },
          "how-many": { earned: false, earnedAt: null },
          "first-sounds": { earned: true, earnedAt: "2026-08-08T00:00:00.000Z" },
          "more-less": { earned: true, earnedAt: "2026-08-08T00:00:00.000Z" },
          "odd-one-out": { earned: true, earnedAt: "2026-08-08T00:00:00.000Z" },
        },
        settings: { bgmEnabled: true, sfxEnabled: false },
      };
      localStorage.setItem(V1_KEY, JSON.stringify(oldSave));

      const result = readActiveState();

      // The new game gets a fresh unearned entry instead of crashing.
      expect(result.stickers["color-match"]).toEqual({ earned: false, earnedAt: null });
      // Existing progress and settings are preserved.
      expect(result.stickers["odd-one-out"].earned).toBe(true);
      expect(result.stickers["more-less"].earned).toBe(true);
      expect(result.settings.bgmEnabled).toBe(true);
      expect(result.settings.sfxEnabled).toBe(false);
    });

    it("migrates a save from before Game 20 by backfilling the number-order sticker entry", () => {
      // Simulate a save from before Number Order shipped: no "number-order" key.
      const oldSave = {
        stickers: {
          "shape-sorter": { earned: true, earnedAt: "2026-07-28T00:00:00.000Z" },
          "animal-trace": { earned: false, earnedAt: null },
          "pop-freeze": { earned: false, earnedAt: null },
          "shadow-match": { earned: false, earnedAt: null },
          "musical-memory": { earned: false, earnedAt: null },
          "big-small": { earned: false, earnedAt: null },
          "pattern-builder": { earned: false, earnedAt: null },
          "alphabet-match": { earned: false, earnedAt: null },
          "word-match": { earned: false, earnedAt: null },
          "word-builder": { earned: false, earnedAt: null },
          "how-many": { earned: false, earnedAt: null },
          "first-sounds": { earned: true, earnedAt: "2026-08-08T00:00:00.000Z" },
          "more-less": { earned: true, earnedAt: "2026-08-08T00:00:00.000Z" },
          "odd-one-out": { earned: true, earnedAt: "2026-08-08T00:00:00.000Z" },
          "color-match": { earned: true, earnedAt: "2026-08-08T00:00:00.000Z" },
          "add-it-up": { earned: false, earnedAt: null },
          "take-away": { earned: false, earnedAt: null },
          "memory-match": { earned: false, earnedAt: null },
          "decode-it": { earned: true, earnedAt: "2026-08-28T00:00:00.000Z" },
        },
        settings: { bgmEnabled: true, sfxEnabled: false },
      };
      localStorage.setItem(V1_KEY, JSON.stringify(oldSave));

      const result = readActiveState();

      // The new game gets a fresh unearned entry instead of crashing.
      expect(result.stickers["number-order"]).toEqual({ earned: false, earnedAt: null });
      // Existing progress and settings are preserved.
      expect(result.stickers["decode-it"].earned).toBe(true);
      expect(result.stickers["shape-sorter"].earned).toBe(true);
      expect(result.settings.bgmEnabled).toBe(true);
      expect(result.settings.sfxEnabled).toBe(false);
    });

    it("migrates a save from before Game 21 by backfilling the feelings-faces sticker entry", () => {
      // Simulate a save from before Feelings Faces shipped: every Game 20 key
      // is present, but there is no "feelings-faces" entry.
      const gameTwentyIds: GameId[] = [
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
        "number-order",
      ];
      const oldSave = {
        stickers: Object.fromEntries(
          gameTwentyIds.map((gameId) => [gameId, { earned: false, earnedAt: null }]),
        ),
        settings: { bgmEnabled: true, sfxEnabled: true },
      };
      localStorage.setItem(V1_KEY, JSON.stringify(oldSave));

      const result = readActiveState();

      // The new game gets a fresh unearned entry instead of crashing.
      expect(result.stickers["feelings-faces"]).toEqual({ earned: false, earnedAt: null });
      // Existing entries are preserved.
      for (const gameId of gameTwentyIds) {
        expect(result.stickers[gameId]).toEqual({ earned: false, earnedAt: null });
      }
    });

    it("backfills story-order on a v2 save written before the game exists", () => {
      // A save from the 21-game era: no story-order sticker or progress row.
      const profile = {
        id: "p1",
        avatarId: "cat",
        createdAt: "2026-09-01T00:00:00.000Z",
        stickers: {
          "shape-sorter": { earned: true, earnedAt: "2026-09-02T00:00:00.000Z" },
          "feelings-faces": { earned: true, earnedAt: "2026-09-03T00:00:00.000Z" },
        },
        playTime: { limitMinutes: null, usedMinutes: 0, lastUsedDate: todayKey(new Date()) },
        progress: {
          "shape-sorter": {
            plays: 4,
            wins: 2,
            correct: 9,
            wrong: 1,
            lastPlayedAt: "2026-09-02T00:00:00.000Z",
            recent: [true],
          },
        },
      };
      localStorage.setItem(
        V2_KEY,
        JSON.stringify({
          activeProfileId: "p1",
          profiles: [profile],
          settings: { bgmEnabled: true, sfxEnabled: true, preferredVoiceURI: null },
        }),
      );

      const result = readActiveState();

      expect(result.stickers["story-order"]).toEqual({ earned: false, earnedAt: null });
      expect(hasSticker("story-order")).toBe(false);
      // Existing stickers and progress survive the backfill.
      expect(result.stickers["shape-sorter"].earned).toBe(true);
      expect(result.stickers["feelings-faces"].earned).toBe(true);
      expect(getProgress()["shape-sorter"].wins).toBe(2);
      expect(getProgress()["story-order"]).toEqual({
        plays: 0,
        wins: 0,
        correct: 0,
        wrong: 0,
        lastPlayedAt: null,
        recent: [],
      });
    });
  });

  describe("v1 migration input", () => {
    it("migrates a v1 AppStorage save: its stickers become the active profile's and its settings are global", () => {
      const data: AppStorage = {
        stickers: {
          ...createDefaultStickers(),
          "shape-sorter": { earned: true, earnedAt: "2026-07-28T00:00:00.000Z" },
          "animal-trace": { earned: false, earnedAt: null },
          "pop-freeze": { earned: false, earnedAt: null },
          "shadow-match": { earned: false, earnedAt: null },
          "musical-memory": { earned: false, earnedAt: null },
          "big-small": { earned: false, earnedAt: null },
          "pattern-builder": { earned: false, earnedAt: null },
          "alphabet-match": { earned: false, earnedAt: null },
        },
        settings: {
          bgmEnabled: false,
          sfxEnabled: true,
          preferredVoiceURI: null,
          adaptiveDifficulty: true,
        },
      };

      // The v1 save is the migration input: stage it on the v1 key and let
      // the one-time v1→v2 migration place it.
      localStorage.setItem(V1_KEY, JSON.stringify(data));

      const result = readActiveState();

      // The migrated v2 payload: the provided stickers become the ACTIVE profile's.
      const stored = localStorage.getItem(V2_KEY);
      expect(stored).not.toBeNull();
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        const active = parsed.profiles.find((p: { id: string }) => p.id === parsed.activeProfileId);
        expect(active.stickers["shape-sorter"].earned).toBe(true);
        expect(active.stickers["shape-sorter"].earnedAt).toBe("2026-07-28T00:00:00.000Z");
        expect(parsed.settings.bgmEnabled).toBe(false);
      }

      expect(result.stickers["shape-sorter"].earned).toBe(true);
      expect(result.stickers["shape-sorter"].earnedAt).toBe("2026-07-28T00:00:00.000Z");
      expect(result.stickers["animal-trace"].earned).toBe(false);
      expect(result.settings.bgmEnabled).toBe(false);
      expect(result.settings.sfxEnabled).toBe(true);
    });
  });

  describe("earnSticker", () => {
    it("sets earned to true and earnedAt to a valid ISO timestamp", () => {
      earnSticker("shape-sorter");

      const result = readActiveState();
      const sticker = result.stickers["shape-sorter"];
      expect(sticker.earned).toBe(true);
      expect(sticker.earnedAt).not.toBeNull();

      if (sticker.earnedAt !== null) {
        expect(new Date(sticker.earnedAt).getTime()).not.toBeNaN();
      }
    });

    it("does not affect other stickers", () => {
      earnSticker("animal-trace");

      const result = readActiveState();
      expect(result.stickers["animal-trace"].earned).toBe(true);
      expect(result.stickers["shape-sorter"].earned).toBe(false);
      expect(result.stickers["big-small"].earned).toBe(false);
    });

    it("earns the word games' stickers", () => {
      earnSticker("word-match");
      earnSticker("word-builder");

      const result = readActiveState();
      expect(result.stickers["word-match"].earned).toBe(true);
      expect(result.stickers["word-builder"].earned).toBe(true);
      expect(result.stickers["alphabet-match"].earned).toBe(false);
    });
  });

  describe("hasSticker", () => {
    it("returns false for an unearned sticker", () => {
      expect(hasSticker("shape-sorter")).toBe(false);
    });

    it("returns true after earning a sticker", () => {
      earnSticker("shape-sorter");
      expect(hasSticker("shape-sorter")).toBe(true);
    });
  });

  describe("getSettings", () => {
    it("returns default settings with bgmEnabled and sfxEnabled both true", () => {
      const settings = getSettings();
      expect(settings.bgmEnabled).toBe(true);
      expect(settings.sfxEnabled).toBe(true);
    });

    it("defaults adaptive difficulty to enabled", () => {
      expect(getSettings().adaptiveDifficulty).toBe(true);
    });
  });

  describe("updateSettings", () => {
    it("updates bgmEnabled while preserving sfxEnabled", () => {
      updateSettings({ bgmEnabled: false });
      const settings = getSettings();
      expect(settings.bgmEnabled).toBe(false);
      expect(settings.sfxEnabled).toBe(true);
    });

    it("updates sfxEnabled while preserving bgmEnabled", () => {
      updateSettings({ sfxEnabled: false });
      const settings = getSettings();
      expect(settings.sfxEnabled).toBe(false);
      expect(settings.bgmEnabled).toBe(true);
    });

    it("updates both settings simultaneously", () => {
      updateSettings({ bgmEnabled: false, sfxEnabled: false });
      const settings = getSettings();
      expect(settings.bgmEnabled).toBe(false);
      expect(settings.sfxEnabled).toBe(false);
    });

    it("persists settings to localStorage", () => {
      updateSettings({ bgmEnabled: false });
      const result = readActiveState();
      expect(result.settings.bgmEnabled).toBe(false);
    });

    it("persists the adaptive difficulty toggle while preserving audio settings", () => {
      updateSettings({ adaptiveDifficulty: false });
      let settings = getSettings();
      expect(settings.adaptiveDifficulty).toBe(false);
      expect(settings.bgmEnabled).toBe(true);
      expect(settings.sfxEnabled).toBe(true);

      updateSettings({ adaptiveDifficulty: true });
      settings = getSettings();
      expect(settings.adaptiveDifficulty).toBe(true);
    });
  });

  describe("resetProgress", () => {
    it("clears every sticker while preserving audio settings", () => {
      earnSticker("shape-sorter");
      earnSticker("pattern-builder");
      updateSettings({ bgmEnabled: false });

      resetProgress();

      const result = readActiveState();
      for (const gameId of GAME_IDS) {
        expect(result.stickers[gameId]).toEqual({ earned: false, earnedAt: null });
      }
      expect(result.settings.bgmEnabled).toBe(false);
      expect(result.settings.sfxEnabled).toBe(true);
    });

    it("persists the cleared sticker collection to localStorage", () => {
      earnSticker("shape-sorter");

      resetProgress();

      const stored = localStorage.getItem(V2_KEY);
      expect(stored).not.toBeNull();
      if (stored !== null) {
        const parsed = JSON.parse(stored) as {
          activeProfileId: string;
          profiles: Array<{ id: string; stickers: Record<string, unknown> }>;
        };
        const active = parsed.profiles.find((p) => p.id === parsed.activeProfileId);
        expect(active?.stickers["shape-sorter"]).toEqual({ earned: false, earnedAt: null });
      }
    });

    it("handles corrupt storage without throwing", () => {
      localStorage.setItem(V1_KEY, "invalid-json");

      expect(() => resetProgress()).not.toThrow();

      const result = readActiveState();
      for (const gameId of GAME_IDS) {
        expect(result.stickers[gameId]).toEqual({ earned: false, earnedAt: null });
      }
    });
  });

  describe("profiles", () => {
    it("migrates a v1 save into profile p1 with stickers and settings preserved", () => {
      const oldSave = {
        stickers: {
          "shape-sorter": { earned: true, earnedAt: "2026-07-28T00:00:00.000Z" },
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
        settings: { bgmEnabled: false, sfxEnabled: true },
      };
      localStorage.setItem(V1_KEY, JSON.stringify(oldSave));

      const profiles = getProfiles();
      expect(profiles).toHaveLength(1);
      expect(profiles[0]).toMatchObject({ id: "p1", avatarId: "cat" });
      expect(profiles[0].stickers["shape-sorter"].earned).toBe(true);
      expect(getSettings()).toEqual({
        bgmEnabled: false,
        sfxEnabled: true,
        preferredVoiceURI: null,
        adaptiveDifficulty: true,
      });
    });

    it("keeps the v1 key untouched after migration", () => {
      localStorage.setItem(V1_KEY, JSON.stringify(v1OnlySave()));

      readActiveState();

      expect(localStorage.getItem(V1_KEY)).not.toBeNull();
      expect(localStorage.getItem(V2_KEY)).not.toBeNull();
    });

    it("creates a fresh default profile on a new install", () => {
      const profiles = getProfiles();
      expect(profiles).toHaveLength(1);
      expect(profiles[0].id).toBe("p1");
      expect(profiles[0].avatarId).toBe("cat");
      expect(getActiveProfile().id).toBe("p1");
    });

    it("addProfile creates a new active profile with no stickers", () => {
      addProfile("dog");

      expect(getProfiles()).toHaveLength(2);
      const active = getActiveProfile();
      expect(active.avatarId).toBe("dog");
      expect(active.stickers["shape-sorter"].earned).toBe(false);
    });

    it("addProfile returns null for a duplicate avatar", () => {
      expect(addProfile("cat")).toBeNull();
    });

    it("keeps stickers strictly per profile", () => {
      addProfile("dog");
      earnSticker("shape-sorter");

      expect(hasSticker("shape-sorter")).toBe(true);
      expect(getActiveProfile().id).toBe("p2");

      switchProfile("p1");
      expect(hasSticker("shape-sorter")).toBe(false);
      expect(getActiveProfile().id).toBe("p1");
    });

    it("switchProfile returns false for an unknown profile id", () => {
      expect(switchProfile("nope")).toBe(false);
      expect(getActiveProfile().id).toBe("p1");
    });

    it("resetProgress clears only the active profile's stickers", () => {
      addProfile("dog");
      earnSticker("shape-sorter");
      switchProfile("p1");
      earnSticker("animal-trace");

      resetProgress();

      expect(hasSticker("animal-trace")).toBe(false);
      switchProfile("p2");
      expect(hasSticker("shape-sorter")).toBe(true);
    });

    it("deleteProfile falls back to the first remaining profile when active is deleted", () => {
      addProfile("dog");
      deleteProfile("p2");

      expect(getProfiles()).toHaveLength(1);
      expect(getActiveProfile().id).toBe("p1");
    });

    it("deleteProfile recreates a fresh default when the last profile is deleted", () => {
      earnSticker("shape-sorter");
      deleteProfile("p1");

      expect(getProfiles()).toHaveLength(1);
      expect(getActiveProfile().id).toBe("p1");
      expect(hasSticker("shape-sorter")).toBe(false);
    });

    it("getAvailableAvatars excludes avatars in use", () => {
      addProfile("dog");
      addProfile("frog");
      expect(getAvailableAvatars()).toEqual(["pig", "duck", "bear"]);
    });
  });

  describe("play time", () => {
    it("returns an unlimited default play time on a fresh install", () => {
      const playTime = getPlayTime();
      expect(playTime.limitMinutes).toBeNull();
      expect(playTime.usedMinutes).toBe(0);
      expect(playTime.lastUsedDate).toBe(todayKey());
    });

    it("migrates a v1 save with an unlimited default play time", () => {
      localStorage.setItem(V1_KEY, JSON.stringify(v1OnlySave()));
      readActiveState();

      const playTime = getPlayTime("p1");
      expect(playTime.limitMinutes).toBeNull();
      expect(playTime.usedMinutes).toBe(0);
    });

    it("backfills play time on a v2 save from before the feature", () => {
      localStorage.setItem(
        V2_KEY,
        JSON.stringify({
          activeProfileId: "p1",
          profiles: [
            { id: "p1", avatarId: "cat", createdAt: "2026-08-04T00:00:00.000Z", stickers: {} },
          ],
          settings: { bgmEnabled: true, sfxEnabled: true },
        }),
      );

      const playTime = getPlayTime("p1");
      expect(playTime.limitMinutes).toBeNull();
      expect(playTime.usedMinutes).toBe(0);
    });

    it("setPlayTimeLimit persists a per-profile limit", () => {
      setPlayTimeLimit("p1", 30);
      expect(getPlayTime("p1").limitMinutes).toBe(30);
    });

    it("clears a limit when set to null", () => {
      setPlayTimeLimit("p1", 30);
      setPlayTimeLimit("p1", null);
      expect(getPlayTime("p1").limitMinutes).toBeNull();
    });

    it("recordPlayTime accrues usage on the profile", () => {
      setPlayTimeLimit("p1", 30);
      recordPlayTime("p1", 12);
      recordPlayTime("p1", 3);
      expect(getPlayTime("p1").usedMinutes).toBe(15);
    });

    it("keeps play time strictly per profile", () => {
      setPlayTimeLimit("p1", 30);
      addProfile("dog"); // p2 becomes active

      recordPlayTime("p2", 5);
      expect(getPlayTime().usedMinutes).toBe(5);
      expect(getPlayTime("p1").usedMinutes).toBe(0);
      expect(getPlayTime("p1").limitMinutes).toBe(30);
      expect(getPlayTime("p2").limitMinutes).toBeNull();
    });

    it("resets usage to zero when the day rolls over", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
      localStorage.setItem(
        V2_KEY,
        JSON.stringify({
          activeProfileId: "p1",
          profiles: [
            {
              id: "p1",
              avatarId: "cat",
              createdAt: "2026-08-04T00:00:00.000Z",
              stickers: {},
              playTime: { limitMinutes: 30, usedMinutes: 25, lastUsedDate: yesterdayKey },
            },
          ],
          settings: { bgmEnabled: true, sfxEnabled: true },
        }),
      );

      const playTime = getPlayTime("p1");
      expect(playTime.usedMinutes).toBe(0);
      expect(playTime.lastUsedDate).toBe(todayKey());
      expect(playTime.limitMinutes).toBe(30);
    });

    it("banks a page-exit flush through recordPlayTime", () => {
      setPlayTimeLimit("p1", 30);
      startPlaySession("p1", Date.now() - 2.5 * 60 * 1000);

      window.dispatchEvent(new Event("pagehide"));

      expect(getPlayTime("p1").usedMinutes).toBe(3);
      expect(endPlaySession()).toBeNull();
    });
  });
});

function v1OnlySave(): {
  stickers: Record<string, { earned: boolean; earnedAt: string | null }>;
  settings: { bgmEnabled: boolean; sfxEnabled: boolean };
} {
  return {
    stickers: {
      "shape-sorter": { earned: true, earnedAt: "2026-07-28T00:00:00.000Z" },
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
    settings: { bgmEnabled: false, sfxEnabled: true },
  };
}

describe("progress recording", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("records a play for the active profile", () => {
    recordGamePlay("shape-sorter");

    const progress = getProgress()["shape-sorter"];
    expect(progress.plays).toBe(1);
    expect(progress.wins).toBe(0);
    expect(progress.correct).toBe(0);
    expect(progress.wrong).toBe(0);
    expect(progress.lastPlayedAt).not.toBeNull();
    // Other games stay untouched.
    expect(getProgress()["color-match"]).toEqual({
      plays: 0,
      wins: 0,
      correct: 0,
      wrong: 0,
      lastPlayedAt: null,
      recent: [],
    });
  });

  it("stamps today's activity entry on play", () => {
    recordGamePlay("shape-sorter");
    recordGamePlay("shape-sorter");

    const active = getActiveProfile();
    expect(active.activity).toContainEqual({ day: todayKey(new Date()), plays: 2 });
  });

  it("records plays per active profile", () => {
    recordGamePlay("shape-sorter");
    const firstProfile = getActiveProfile().id;

    addProfile("dog");
    const secondProfile = getActiveProfile().id;
    recordGamePlay("color-match");

    expect(getProgress(firstProfile)["shape-sorter"].plays).toBe(1);
    expect(getProgress(secondProfile)["shape-sorter"].plays).toBe(0);
    expect(getProgress(secondProfile)["color-match"].plays).toBe(1);
  });

  it("records a completed result with correct/wrong and a win", () => {
    recordGameResult("shape-sorter", 5, 1);
    recordGameResult("shape-sorter", 6, 0);

    const progress = getProgress()["shape-sorter"];
    expect(progress.wins).toBe(2);
    expect(progress.correct).toBe(11);
    expect(progress.wrong).toBe(1);
    expect(progress.plays).toBe(0);
  });

  it("preserves progress across sticker and settings writes and resetProgress", () => {
    recordGamePlay("shape-sorter");
    recordGameResult("shape-sorter", 5, 1);

    earnSticker("shape-sorter");
    updateSettings({ bgmEnabled: false, sfxEnabled: true });
    earnSticker("color-match");
    expect(getProgress()["shape-sorter"].plays).toBe(1);

    resetProgress();
    const progress = getProgress()["shape-sorter"];
    expect(progress.wins).toBe(1);
    expect(progress.correct).toBe(5);
    expect(progress.wrong).toBe(1);
    // Stickers were cleared, progress was not.
    expect(hasSticker("shape-sorter")).toBe(false);
  });

  it("backfills zeroed progress for an older v2 save without progress", () => {
    const oldV2 = {
      activeProfileId: "p1",
      profiles: [
        {
          id: "p1",
          avatarId: "cat",
          createdAt: "2026-08-01T00:00:00.000Z",
          stickers: {
            "shape-sorter": { earned: true, earnedAt: "2026-08-02T00:00:00.000Z" },
          },
          playTime: { limitMinutes: null, usedMinutes: 0, lastUsedDate: "2026-08-05" },
        },
      ],
      settings: { bgmEnabled: true, sfxEnabled: true, preferredVoiceURI: null },
    };
    localStorage.setItem(V2_KEY, JSON.stringify(oldV2));

    // Sticker data survived, progress is zeroed and complete.
    expect(hasSticker("shape-sorter")).toBe(true);
    expect(getProgress()["shape-sorter"]).toEqual({
      plays: 0,
      wins: 0,
      correct: 0,
      wrong: 0,
      lastPlayedAt: null,
      recent: [],
    });
    expect(getProgress()["odd-one-out"]).toEqual({
      plays: 0,
      wins: 0,
      correct: 0,
      wrong: 0,
      lastPlayedAt: null,
      recent: [],
    });
    expect(getActiveProfile().activity).toEqual([]);
  });

  it("migrates a v1 save with zeroed progress", () => {
    localStorage.setItem(V1_KEY, JSON.stringify(v1OnlySave()));

    expect(getProgress()["shape-sorter"].plays).toBe(0);
    expect(getActiveProfile().activity).toEqual([]);
    // v1 sticker survived migration.
    expect(hasSticker("shape-sorter")).toBe(true);
  });

  it("records an abandoned session's taps on the active profile only", () => {
    recordGamePlay("shape-sorter");
    const firstProfile = getActiveProfile().id;

    addProfile("dog");
    const secondProfile = getActiveProfile().id;

    recordGameTaps("shape-sorter", 3, 1);

    expect(getProgress(secondProfile)["shape-sorter"].recent).toEqual([true, true, true, false]);
    // The other profile's progress is untouched.
    expect(getProgress(firstProfile)["shape-sorter"].recent).toEqual([]);
  });

  it("moves only the rolling window, leaving the cumulative counters, wins and plays alone", () => {
    recordGamePlay("shape-sorter");
    recordGameResult("shape-sorter", 5, 1);

    recordGameTaps("shape-sorter", 3, 1);

    const progress = getProgress()["shape-sorter"];
    expect(progress.recent).toEqual([true, true, true, true, true, false, true, true, true, false]);
    expect(progress.wins).toBe(1);
    expect(progress.correct).toBe(5);
    expect(progress.wrong).toBe(1);
    expect(progress.plays).toBe(1);
  });

  it("leaves other games untouched when an abandoned session is recorded", () => {
    recordGameTaps("shape-sorter", 2, 0);

    expect(getProgress()["color-match"]).toEqual({
      plays: 0,
      wins: 0,
      correct: 0,
      wrong: 0,
      lastPlayedAt: null,
      recent: [],
    });
  });
});

describe("adaptive band shift", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns 0 on a fresh install (window below the minimum sample)", () => {
    expect(getAdaptiveBandShift("how-many")).toBe(0);
  });

  it("returns +1 when recent accuracy reaches the up threshold", () => {
    recordGameResult("how-many", 9, 1);

    expect(getAdaptiveBandShift("how-many")).toBe(1);
  });

  it("returns 0 for accuracy between the thresholds", () => {
    recordGameResult("more-less", 8, 2);

    expect(getAdaptiveBandShift("more-less")).toBe(0);
  });

  it("returns -1 when recent accuracy falls below the down threshold", () => {
    recordGameResult("how-many", 1, 9);

    expect(getAdaptiveBandShift("how-many")).toBe(-1);
  });

  it("returns 0 when the window holds fewer than the minimum sample", () => {
    recordGameResult("add-it-up", 5, 0);

    expect(getAdaptiveBandShift("add-it-up")).toBe(0);
  });

  it("returns 0 for every game when the toggle is off", () => {
    recordGameResult("how-many", 9, 1);
    updateSettings({ adaptiveDifficulty: false });

    expect(getAdaptiveBandShift("how-many")).toBe(0);
  });

  it("reads the active profile's window only", () => {
    recordGameResult("how-many", 9, 1);
    const firstProfile = getActiveProfile().id;

    addProfile("dog");
    expect(getActiveProfile().id).not.toBe(firstProfile);
    expect(getAdaptiveBandShift("how-many")).toBe(0);

    switchProfile(firstProfile);
    expect(getAdaptiveBandShift("how-many")).toBe(1);
  });

  it("reflects the latest folded window after multiple sessions", () => {
    recordGameResult("take-away", 4, 2);
    expect(getAdaptiveBandShift("take-away")).toBe(0);

    recordGameResult("take-away", 0, 6);
    expect(getAdaptiveBandShift("take-away")).toBe(-1);
  });
});

describe.each([
  ["word-match"],
  ["word-builder"],
  ["first-sounds"],
  ["alphabet-match"],
  ["memory-match"],
  ["musical-memory"],
  ["decode-it"],
  ["number-order"],
] as const)("adaptive band shift (%s)", (gameId) => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns 0 on a fresh install (window below the minimum sample)", () => {
    expect(getAdaptiveBandShift(gameId)).toBe(0);
  });

  it("returns +1 when recent accuracy reaches the up threshold", () => {
    recordGameResult(gameId, 9, 1);
    expect(getAdaptiveBandShift(gameId)).toBe(1);
  });

  it("returns -1 when recent accuracy falls below the down threshold", () => {
    recordGameResult(gameId, 1, 9);
    expect(getAdaptiveBandShift(gameId)).toBe(-1);
  });

  it("returns 0 for every game when the toggle is off", () => {
    recordGameResult(gameId, 9, 1);
    updateSettings({ adaptiveDifficulty: false });
    expect(getAdaptiveBandShift(gameId)).toBe(0);
  });
});

describe("v2 state cache (memoization)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns the identical normalized state for consecutive reads of unchanged storage", () => {
    // First read parses + normalizes; a second read must reuse the cached
    // state (same object identity) instead of re-parsing localStorage.
    const first = getProfiles();
    const second = getProfiles();
    expect(second).toBe(first);
    expect(getSettings()).toBe(getSettings());
  });

  it("reflects writes immediately: reads after updateSettings return the new state", () => {
    const before = getSettings();

    updateSettings({ sfxEnabled: false });

    const after = getSettings();
    expect(after.sfxEnabled).toBe(false);
    expect(after.bgmEnabled).toBe(true);
    expect(after).not.toBe(before);
  });

  it("writes update the cached state (write-through)", () => {
    getSettings(); // prime the cache

    earnSticker("shape-sorter");
    updateSettings({ bgmEnabled: false });

    expect(getSettings().bgmEnabled).toBe(false);
    expect(hasSticker("shape-sorter")).toBe(true);
  });

  it("detects an external localStorage write and re-reads it", () => {
    getSettings(); // prime the cache

    localStorage.setItem(
      V2_KEY,
      JSON.stringify({
        activeProfileId: "p1",
        profiles: [
          { id: "p1", avatarId: "cat", createdAt: "2026-08-04T00:00:00.000Z", stickers: {} },
        ],
        settings: { bgmEnabled: true, sfxEnabled: false },
      }),
    );

    expect(getSettings().sfxEnabled).toBe(false);
    expect(getSettings().bgmEnabled).toBe(true);
  });

  it("re-migrates a fresh default when the v2 key is removed externally", () => {
    earnSticker("shape-sorter"); // prime the cache with an earned sticker
    expect(hasSticker("shape-sorter")).toBe(true);

    localStorage.removeItem(V2_KEY);

    expect(hasSticker("shape-sorter")).toBe(false);
    expect(getActiveProfile().id).toBe("p1");
  });

  it("falls back to defaults when the stored v2 JSON becomes corrupt after a cached read", () => {
    getSettings(); // prime the cache

    localStorage.setItem(V2_KEY, "not-json");

    expect(() => getSettings()).not.toThrow();
    expect(getSettings().bgmEnabled).toBe(true);
    expect(getSettings().sfxEnabled).toBe(true);
  });

  it("keeps reads consistent across a mutate-decline (declined writes leave the cache valid)", () => {
    // switchProfile with an unknown id declines (returns false, persists nothing).
    expect(switchProfile("nope")).toBe(false);

    // The cached state must remain the real state, not the declined proposal.
    expect(getActiveProfile().id).toBe("p1");
    expect(getSettings().sfxEnabled).toBe(true);
  });
});

describe("schema versioning", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  /**
   * A fully normalized legacy v2 body (the shape every build before schema
   * versioning wrote): complete sticker keys, complete progress map, play
   * time keyed to today, and the full settings block — so normalizing it is
   * the identity and the stamp is the only change the next write makes.
   */
  function legacyV2Body() {
    return {
      activeProfileId: "p1",
      profiles: [
        {
          id: "p1",
          avatarId: "cat",
          createdAt: "2026-08-04T00:00:00.000Z",
          stickers: {
            ...createDefaultStickers(),
            "animal-trace": { earned: true, earnedAt: "2026-09-01T00:00:00.000Z" },
          },
          playTime: { limitMinutes: 30, usedMinutes: 5, lastUsedDate: todayKey() },
          progress: createDefaultProgressMap(),
          activity: [],
        },
      ],
      settings: {
        bgmEnabled: false,
        sfxEnabled: true,
        preferredVoiceURI: null,
        adaptiveDifficulty: true,
      },
    };
  }

  /** Serializes a v2 body with an explicit schemaVersion (omit = unstamped). */
  function storedV2(body: object, schemaVersion?: unknown): string {
    return JSON.stringify(schemaVersion === undefined ? body : { ...body, schemaVersion });
  }

  it("stamps a fresh write with schemaVersion 1", () => {
    updateSettings({ bgmEnabled: false });

    const stored = localStorage.getItem(V2_KEY);
    expect(stored).not.toBeNull();
    if (stored === null) return;
    expect(JSON.parse(stored).schemaVersion).toBe(1);
  });

  it("classifies a legacy unstamped payload as version 1 and stamps it on the next write", () => {
    const body = legacyV2Body();
    localStorage.setItem(V2_KEY, JSON.stringify(body));

    // The implicit-v1 payload reads normally: its stored progress survives.
    expect(hasSticker("animal-trace")).toBe(true);
    expect(getSettings().bgmEnabled).toBe(false);

    switchProfile("p1"); // a persisting no-op write

    const stored = localStorage.getItem(V2_KEY);
    expect(stored).not.toBeNull();
    if (stored === null) return;
    const parsed = JSON.parse(stored);
    expect(parsed.schemaVersion).toBe(1);
    // The stamp is the only change: the body is otherwise unchanged.
    expect(parsed).toEqual({ ...body, schemaVersion: 1 });
  });

  it("stamps the migrated v2 payload when a v1-only install first migrates", () => {
    localStorage.setItem(V1_KEY, JSON.stringify(v1OnlySave()));

    readActiveState();

    const stored = localStorage.getItem(V2_KEY);
    expect(stored).not.toBeNull();
    if (stored === null) return;
    expect(JSON.parse(stored).schemaVersion).toBe(1);
    // The migration itself is untouched: v1 progress survives, v1 key stays.
    expect(hasSticker("shape-sorter")).toBe(true);
    expect(localStorage.getItem(V1_KEY)).not.toBeNull();
  });

  it("reads a payload stamped with the known version normally", () => {
    localStorage.setItem(V2_KEY, storedV2(legacyV2Body(), 1));

    expect(hasSticker("animal-trace")).toBe(true);
    expect(getSettings().bgmEnabled).toBe(false);
  });

  it("pins the version-1 identity migrate step", () => {
    const body = legacyV2Body();
    localStorage.setItem(V2_KEY, storedV2(body, 1));

    // The known-version payload passes through the version-1 (identity) step:
    // every stored field reads back exactly as stored — the template a future
    // version's migrate step must preserve.
    expect(getActiveProfile().stickers["animal-trace"]).toEqual({
      earned: true,
      earnedAt: "2026-09-01T00:00:00.000Z",
    });
    expect(getActiveProfile().playTime).toEqual({
      limitMinutes: 30,
      usedMinutes: 5,
      lastUsedDate: todayKey(),
    });
    expect(getSettings()).toEqual(body.settings);
  });

  it("serves in-memory defaults for an unknown version and never touches the stored bytes", async () => {
    const raw = storedV2(legacyV2Body(), 99);
    localStorage.setItem(V2_KEY, raw);

    // The unknown payload's data is NOT served; fresh defaults are.
    expect(hasSticker("animal-trace")).toBe(false);
    expect(getSettings()).toEqual({
      bgmEnabled: true,
      sfxEnabled: true,
      preferredVoiceURI: null,
      adaptiveDifficulty: true,
    });

    // Mutations apply to the in-memory default state only (A2) and the raw
    // stored bytes stay byte-identical.
    earnSticker("shape-sorter");
    updateSettings({ bgmEnabled: false });
    recordGamePlay("pop-freeze");

    expect(hasSticker("shape-sorter")).toBe(true);
    expect(getSettings().bgmEnabled).toBe(false);
    expect(localStorage.getItem(V2_KEY)).toBe(raw);

    // A fresh session (reload) discards the in-memory mutations: the stored
    // payload is re-classified as unknown and defaults are served again.
    vi.resetModules();
    const fresh = await import("../../utils/storage");
    expect(fresh.hasSticker("shape-sorter")).toBe(false);
    expect(fresh.getSettings().bgmEnabled).toBe(true);
    expect(localStorage.getItem(V2_KEY)).toBe(raw);
  });

  it("never lets the memo cache overwrite a write-protected payload", () => {
    getSettings(); // prime the cache with a good payload

    const raw = storedV2(legacyV2Body(), 99);
    localStorage.setItem(V2_KEY, raw); // external write while the cache is hot

    earnSticker("shape-sorter");
    updateSettings({ sfxEnabled: false });

    expect(localStorage.getItem(V2_KEY)).toBe(raw);
  });

  it("treats a non-number schemaVersion as corrupt and serves fresh defaults", () => {
    for (const version of ["1", null]) {
      localStorage.clear();
      localStorage.setItem(V2_KEY, storedV2(legacyV2Body(), version));

      // The corrupt path (A4): fresh defaults, matching today's handling.
      expect(hasSticker("animal-trace")).toBe(false);
      expect(getSettings().bgmEnabled).toBe(true);
    }
  });

  it("prefers v2 when both keys exist and leaves the v1 key in place", () => {
    localStorage.setItem(V1_KEY, JSON.stringify(v1OnlySave()));
    localStorage.setItem(V2_KEY, storedV2(legacyV2Body(), 1));

    readActiveState();

    // v2 wins: its earned sticker is served, the v1 payload's is not consulted.
    expect(hasSticker("animal-trace")).toBe(true);
    expect(hasSticker("shape-sorter")).toBe(false);
    expect(localStorage.getItem(V1_KEY)).not.toBeNull();
  });
});
