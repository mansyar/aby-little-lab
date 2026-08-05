import { describe, expect, it } from "vitest";
import {
  addProfile,
  availableAvatarIds,
  createDefaultProfile,
  deleteProfile,
  migrateV1,
  normalizeV2,
  switchActiveProfile,
} from "../../game/profileLogic";
import type { AppStorage, AvatarId, ProfileV2 } from "../../types";
import { DEFAULT_AVATAR_ID, MAX_PROFILES } from "../../types";

const NOW = "2026-08-04T12:00:00.000Z";

function v1Save(overrides: Partial<AppStorage> = {}): Partial<AppStorage> {
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
    ...overrides,
  };
}

/** Asserts addProfile succeeds and returns the mutated v2 state. */
function mustAdd(v2: ProfileV2, avatar: AvatarId): ProfileV2 {
  const next = addProfile(v2, avatar, NOW);
  expect(next).not.toBeNull();
  if (next === null) throw new Error("addProfile unexpectedly returned null");
  return next;
}

describe("profileLogic", () => {
  describe("createDefaultProfile", () => {
    it("creates a profile with the given identity and default stickers", () => {
      const profile = createDefaultProfile("p1", "cat", NOW);

      expect(profile.id).toBe("p1");
      expect(profile.avatarId).toBe("cat");
      expect(profile.createdAt).toBe(NOW);
      for (const gameId of Object.keys(profile.stickers)) {
        expect(profile.stickers[gameId as keyof typeof profile.stickers]).toEqual({
          earned: false,
          earnedAt: null,
        });
      }
    });

    it("defaults to the default avatar when none is given", () => {
      const profile = createDefaultProfile("p1", undefined, NOW);
      expect(profile.avatarId).toBe(DEFAULT_AVATAR_ID);
    });

    it("creates a profile with an unlimited default play time", () => {
      const profile = createDefaultProfile("p1", "cat", NOW);
      expect(profile.playTime.limitMinutes).toBeNull();
      expect(profile.playTime.usedMinutes).toBe(0);
      expect(typeof profile.playTime.lastUsedDate).toBe("string");
    });
  });

  describe("migrateV1", () => {
    it("creates a fresh default profile p1 when there is no v1 save", () => {
      const v2 = migrateV1(null, NOW);

      expect(v2.activeProfileId).toBe("p1");
      expect(v2.profiles).toHaveLength(1);
      expect(v2.profiles[0]).toMatchObject({ id: "p1", avatarId: "cat", createdAt: NOW });
      expect(v2.settings).toEqual({ bgmEnabled: true, sfxEnabled: true });
    });

    it("moves v1 stickers and settings into profile p1", () => {
      const v2 = migrateV1(v1Save(), NOW);

      expect(v2.profiles).toHaveLength(1);
      expect(v2.profiles[0].id).toBe("p1");
      expect(v2.profiles[0].stickers["shape-sorter"]).toEqual({
        earned: true,
        earnedAt: "2026-07-28T00:00:00.000Z",
      });
      expect(v2.settings).toEqual({ bgmEnabled: false, sfxEnabled: true });
      expect(v2.activeProfileId).toBe("p1");
    });

    it("backfills sticker keys missing from the v1 save", () => {
      const oldSave = v1Save();
      delete oldSave.stickers?.["pattern-builder"];
      const v2 = migrateV1(oldSave, NOW);

      expect(v2.profiles[0].stickers["pattern-builder"]).toEqual({
        earned: false,
        earnedAt: null,
      });
    });

    it("survives a malformed v1 save", () => {
      const v2 = migrateV1(
        { stickers: null, settings: null } as unknown as Partial<AppStorage>,
        NOW,
      );
      expect(v2.profiles).toHaveLength(1);
      expect(v2.settings).toEqual({ bgmEnabled: true, sfxEnabled: true });
    });

    it("gives migrated profile p1 an unlimited default play time", () => {
      const v2 = migrateV1(v1Save(), NOW);
      expect(v2.profiles[0].playTime).toEqual({
        limitMinutes: null,
        usedMinutes: 0,
        lastUsedDate: expect.any(String),
      });
    });
  });

  describe("normalizeV2", () => {
    it("keeps a valid v2 save unchanged", () => {
      const v2 = migrateV1(v1Save(), NOW);
      const normalized = normalizeV2(JSON.parse(JSON.stringify(v2)), NOW);

      expect(normalized).toEqual(v2);
    });

    it("backfills sticker keys missing from a profile", () => {
      const v2 = migrateV1(v1Save(), NOW);
      delete (v2.profiles[0].stickers as Record<string, unknown>)["word-builder"];
      const normalized = normalizeV2(v2, NOW);

      expect(normalized.profiles[0].stickers["word-builder"]).toEqual({
        earned: false,
        earnedAt: null,
      });
    });

    it("creates a default profile when profiles is empty", () => {
      const normalized = normalizeV2(
        { activeProfileId: "", profiles: [], settings: {} as never },
        NOW,
      );

      expect(normalized.profiles).toHaveLength(1);
      expect(normalized.profiles[0].id).toBe("p1");
      expect(normalized.activeProfileId).toBe("p1");
    });

    it("falls back to the first profile when activeProfileId is invalid", () => {
      const v2 = migrateV1(v1Save(), NOW);
      v2.activeProfileId = "does-not-exist";
      const normalized = normalizeV2(v2, NOW);

      expect(normalized.activeProfileId).toBe("p1");
    });

    it("merges missing settings with defaults", () => {
      const v2 = migrateV1(v1Save(), NOW);
      delete (v2.settings as Partial<ProfileV2["settings"]>).bgmEnabled;
      const normalized = normalizeV2(v2, NOW);

      expect(normalized.settings.bgmEnabled).toBe(true);
      expect(normalized.settings.sfxEnabled).toBe(true);
    });

    it("backfills play time on profiles from before the feature", () => {
      const v2 = migrateV1(v1Save(), NOW);
      delete (v2.profiles[0] as Partial<ProfileV2["profiles"][number]>).playTime;
      const normalized = normalizeV2(v2, NOW);

      expect(normalized.profiles[0].playTime.limitMinutes).toBeNull();
      expect(normalized.profiles[0].playTime.usedMinutes).toBe(0);
      expect(typeof normalized.profiles[0].playTime.lastUsedDate).toBe("string");
    });

    it("keeps an existing play time untouched", () => {
      const v2 = migrateV1(v1Save(), NOW);
      // Build a key for the SAME local day as NOW so no rollover occurs.
      const nowDate = new Date(NOW);
      const localKey = `${nowDate.getFullYear()}-${String(nowDate.getMonth() + 1).padStart(2, "0")}-${String(nowDate.getDate()).padStart(2, "0")}`;
      const playTime = { limitMinutes: 30, usedMinutes: 12, lastUsedDate: localKey };
      v2.profiles[0].playTime = playTime;
      const normalized = normalizeV2(v2, NOW);

      expect(normalized.profiles[0].playTime).toEqual(playTime);
    });
  });

  describe("addProfile", () => {
    it("adds a profile that becomes active with default stickers", () => {
      const v2 = migrateV1(null, NOW);
      const next = addProfile(v2, "dog", NOW);

      expect(next).not.toBeNull();
      if (next === null) return;
      expect(next.profiles).toHaveLength(2);
      const added = next.profiles.find((p) => p.avatarId === "dog");
      expect(added?.id).toBe("p2");
      expect(next.activeProfileId).toBe("p2");
      expect(added?.stickers["shape-sorter"]).toEqual({ earned: false, earnedAt: null });
      // Existing profile untouched.
      expect(next.profiles[0].avatarId).toBe("cat");
    });

    it("returns null when the avatar is already in use", () => {
      const v2 = migrateV1(null, NOW);
      expect(addProfile(v2, "cat", NOW)).toBeNull();
    });

    it("returns null when the profile limit is reached", () => {
      let v2 = migrateV1(null, NOW);
      for (const avatar of ["dog", "pig", "frog"] as AvatarId[]) {
        v2 = mustAdd(v2, avatar);
      }
      expect(v2.profiles).toHaveLength(MAX_PROFILES);
      expect(addProfile(v2, "duck", NOW)).toBeNull();
    });

    it("generates ids that stay unique after deletions", () => {
      let v2 = migrateV1(null, NOW);
      v2 = mustAdd(v2, "dog");
      v2 = deleteProfile(v2, "p2", NOW);
      v2 = mustAdd(v2, "dog");

      const ids = v2.profiles.map((p) => p.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids).toContain("p1");
    });
  });

  describe("deleteProfile", () => {
    it("removes a profile and leaves others untouched", () => {
      let v2 = migrateV1(v1Save(), NOW);
      v2 = mustAdd(v2, "dog");
      v2 = deleteProfile(v2, "p2");

      expect(v2.profiles).toHaveLength(1);
      expect(v2.profiles[0].id).toBe("p1");
    });

    it("activates the first remaining profile when the active profile is deleted", () => {
      let v2 = migrateV1(v1Save(), NOW);
      v2 = mustAdd(v2, "dog");
      expect(v2.activeProfileId).toBe("p2");

      v2 = deleteProfile(v2, "p2");
      expect(v2.activeProfileId).toBe("p1");
    });

    it("recreates a fresh default profile when the last profile is deleted", () => {
      const v2 = migrateV1(v1Save(), NOW);
      const next = deleteProfile(v2, "p1", NOW);

      expect(next.profiles).toHaveLength(1);
      expect(next.profiles[0].id).toBe("p1");
      expect(next.profiles[0].stickers["shape-sorter"].earned).toBe(false);
      expect(next.activeProfileId).toBe("p1");
    });

    it("is a no-op for an unknown profile id", () => {
      const v2 = migrateV1(v1Save(), NOW);
      expect(deleteProfile(v2, "nope", NOW)).toBe(v2);
    });
  });

  describe("switchActiveProfile", () => {
    it("switches the active profile", () => {
      let v2 = migrateV1(null, NOW);
      v2 = mustAdd(v2, "dog");
      v2 = switchActiveProfile(v2, "p1");

      expect(v2.activeProfileId).toBe("p1");
    });

    it("is a no-op for an unknown profile id", () => {
      const v2 = migrateV1(null, NOW);
      expect(switchActiveProfile(v2, "nope")).toBe(v2);
    });
  });

  describe("availableAvatarIds", () => {
    it("returns all avatars except p1's when only the default profile exists", () => {
      const v2 = migrateV1(null, NOW);
      expect(availableAvatarIds(v2)).toEqual(["dog", "pig", "frog", "duck", "bear"]);
    });

    it("excludes avatars already in use", () => {
      let v2 = migrateV1(null, NOW);
      v2 = mustAdd(v2, "dog");
      v2 = mustAdd(v2, "frog");

      expect(availableAvatarIds(v2)).toEqual(["pig", "duck", "bear"]);
    });
  });
});
