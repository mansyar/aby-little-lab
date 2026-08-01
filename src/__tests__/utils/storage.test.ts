import type { AppStorage, GameId } from "../../types";
import {
  earnSticker,
  getSettings,
  hasSticker,
  load,
  save,
  updateSettings,
} from "../../utils/storage";

const STORAGE_KEY = "abby-little-lab:v1";

const GAME_IDS: GameId[] = [
  "shape-sorter",
  "animal-trace",
  "pop-freeze",
  "shadow-match",
  "musical-memory",
  "big-small",
  "pattern-builder",
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
      localStorage.setItem(STORAGE_KEY, "invalid-json");
      const result = load();

      expect(result.stickers["shape-sorter"].earned).toBe(false);
      expect(result.settings.bgmEnabled).toBe(true);
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
        },
        settings: {
          bgmEnabled: false,
          sfxEnabled: true,
        },
      };

      save(data);

      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).not.toBeNull();
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        expect(parsed.stickers["shape-sorter"].earned).toBe(true);
        expect(parsed.stickers["shape-sorter"].earnedAt).toBe("2026-07-28T00:00:00.000Z");
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
});
