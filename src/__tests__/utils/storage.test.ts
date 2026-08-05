import type { AppStorage, GameId } from "../../types";
import { todayKey } from "../../game/playTimeLogic";
import {
  addProfile,
  deleteProfile,
  earnSticker,
  getActiveProfile,
  getAvailableAvatars,
  getPlayTime,
  getProfiles,
  getSettings,
  hasSticker,
  load,
  recordPlayTime,
  resetProgress,
  save,
  setPlayTimeLimit,
  switchProfile,
  updateSettings,
} from "../../utils/storage";

const V1_KEY = "abby-little-lab:v1";
const V2_KEY = "abby-little-lab:v2";

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

  describe("load", () => {
    it("returns default AppStorage when storage is empty", () => {
      const result = load();

      for (const gameId of GAME_IDS) {
        expect(result.stickers[gameId]).toEqual({
          earned: false,
          earnedAt: null,
        });
      }

      expect(result.settings.bgmEnabled).toBe(true);
      expect(result.settings.sfxEnabled).toBe(true);
    });

    it("returns default AppStorage when storage contains invalid JSON", () => {
      localStorage.setItem(V1_KEY, "invalid-json");
      const result = load();

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

      const result = load();

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

      const result = load();

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

      const result = load();

      expect(result.stickers["word-match"]).toEqual({ earned: false, earnedAt: null });
      expect(result.stickers["word-builder"]).toEqual({ earned: false, earnedAt: null });
      // Existing progress and settings are preserved.
      expect(result.stickers["alphabet-match"].earned).toBe(true);
      expect(result.stickers["shape-sorter"].earned).toBe(true);
      expect(result.settings.bgmEnabled).toBe(false);
      expect(result.settings.sfxEnabled).toBe(false);
    });
  });

  describe("save", () => {
    it("writes storage data that can be read back by load", () => {
      const data: AppStorage = {
        stickers: {
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
        },
      };

      save(data);

      // save() persists the v2 schema: the provided stickers become the ACTIVE profile's.
      const stored = localStorage.getItem(V2_KEY);
      expect(stored).not.toBeNull();
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        const active = parsed.profiles.find((p: { id: string }) => p.id === parsed.activeProfileId);
        expect(active.stickers["shape-sorter"].earned).toBe(true);
        expect(active.stickers["shape-sorter"].earnedAt).toBe("2026-07-28T00:00:00.000Z");
        expect(parsed.settings.bgmEnabled).toBe(false);
      }

      const result = load();
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

      const result = load();
      const sticker = result.stickers["shape-sorter"];
      expect(sticker.earned).toBe(true);
      expect(sticker.earnedAt).not.toBeNull();

      if (sticker.earnedAt !== null) {
        expect(new Date(sticker.earnedAt).getTime()).not.toBeNaN();
      }
    });

    it("does not affect other stickers", () => {
      earnSticker("animal-trace");

      const result = load();
      expect(result.stickers["animal-trace"].earned).toBe(true);
      expect(result.stickers["shape-sorter"].earned).toBe(false);
      expect(result.stickers["big-small"].earned).toBe(false);
    });

    it("earns the word games' stickers", () => {
      earnSticker("word-match");
      earnSticker("word-builder");

      const result = load();
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
      const result = load();
      expect(result.settings.bgmEnabled).toBe(false);
    });
  });

  describe("resetProgress", () => {
    it("clears every sticker while preserving audio settings", () => {
      earnSticker("shape-sorter");
      earnSticker("pattern-builder");
      updateSettings({ bgmEnabled: false });

      resetProgress();

      const result = load();
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

      const result = load();
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
      expect(getSettings()).toEqual({ bgmEnabled: false, sfxEnabled: true });
    });

    it("keeps the v1 key untouched after migration", () => {
      localStorage.setItem(V1_KEY, JSON.stringify(v1OnlySave()));

      load();

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
      load();

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
