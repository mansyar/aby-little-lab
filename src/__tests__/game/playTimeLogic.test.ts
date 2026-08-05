import { describe, expect, it } from "vitest";
import {
  addPlayTime,
  createDefaultPlayTime,
  endPlaySession,
  getRemainingMinutes,
  isLimitReached,
  isNearLimit,
  normalizePlayTime,
  setLimit,
  startPlaySession,
  todayKey,
} from "../../game/playTimeLogic";
import type { PlayTime } from "../../types";

const DAY = new Date(2026, 7, 5, 10, 0, 0); // 2026-08-05 local
const NEXT_DAY = new Date(2026, 7, 6, 9, 0, 0); // 2026-08-06 local

function pt(overrides: Partial<PlayTime> = {}): PlayTime {
  return { limitMinutes: null, usedMinutes: 0, lastUsedDate: "2026-08-05", ...overrides };
}

describe("playTimeLogic", () => {
  describe("todayKey", () => {
    it("formats a local date as YYYY-MM-DD", () => {
      expect(todayKey(DAY)).toBe("2026-08-05");
      expect(todayKey(NEXT_DAY)).toBe("2026-08-06");
    });
  });

  describe("createDefaultPlayTime", () => {
    it("creates an unlimited, zero-usage budget for today", () => {
      const playTime = createDefaultPlayTime(DAY);
      expect(playTime).toEqual({
        limitMinutes: null,
        usedMinutes: 0,
        lastUsedDate: "2026-08-05",
      });
    });
  });

  describe("normalizePlayTime", () => {
    it("keeps a valid play time unchanged", () => {
      const input = pt({ limitMinutes: 30, usedMinutes: 12 });
      expect(normalizePlayTime(input, DAY)).toEqual(input);
    });

    it("resets usage to zero on a new day", () => {
      const stale = pt({ limitMinutes: 30, usedMinutes: 25 });
      const normalized = normalizePlayTime(stale, NEXT_DAY);
      expect(normalized.usedMinutes).toBe(0);
      expect(normalized.lastUsedDate).toBe("2026-08-06");
      expect(normalized.limitMinutes).toBe(30);
    });

    it("backfills missing fields with defaults", () => {
      const normalized = normalizePlayTime({} as PlayTime, DAY);
      expect(normalized).toEqual({
        limitMinutes: null,
        usedMinutes: 0,
        lastUsedDate: "2026-08-05",
      });
    });

    it("treats a missing play time as a fresh default", () => {
      const normalized = normalizePlayTime(undefined, DAY);
      expect(normalized.limitMinutes).toBeNull();
      expect(normalized.usedMinutes).toBe(0);
    });

    it("ignores an invalid limit (non-positive or non-number)", () => {
      expect(normalizePlayTime({ limitMinutes: -5 } as PlayTime, DAY).limitMinutes).toBeNull();
      expect(
        normalizePlayTime({ limitMinutes: "30" } as unknown as PlayTime, DAY).limitMinutes,
      ).toBeNull();
    });
  });

  describe("getRemainingMinutes", () => {
    it("returns null when there is no limit", () => {
      expect(getRemainingMinutes(pt(), DAY)).toBeNull();
    });

    it("returns the full limit when nothing is used", () => {
      expect(getRemainingMinutes(pt({ limitMinutes: 30 }), DAY)).toBe(30);
    });

    it("returns the difference when partially used", () => {
      expect(getRemainingMinutes(pt({ limitMinutes: 30, usedMinutes: 12 }), DAY)).toBe(18);
    });

    it("clamps to zero when the limit is exceeded", () => {
      expect(getRemainingMinutes(pt({ limitMinutes: 30, usedMinutes: 40 }), DAY)).toBe(0);
    });
  });

  describe("isLimitReached", () => {
    it("is false without a limit", () => {
      expect(isLimitReached(pt(), DAY)).toBe(false);
    });

    it("is false while usage is below the limit", () => {
      expect(isLimitReached(pt({ limitMinutes: 30, usedMinutes: 29 }), DAY)).toBe(false);
    });

    it("is true when usage equals the limit", () => {
      expect(isLimitReached(pt({ limitMinutes: 30, usedMinutes: 30 }), DAY)).toBe(true);
    });

    it("is true when usage exceeds the limit", () => {
      expect(isLimitReached(pt({ limitMinutes: 30, usedMinutes: 45 }), DAY)).toBe(true);
    });

    it("is false after the day rolls over", () => {
      const stale = pt({ limitMinutes: 30, usedMinutes: 30 });
      expect(isLimitReached(stale, NEXT_DAY)).toBe(false);
    });
  });

  describe("isNearLimit", () => {
    it("is false without a limit", () => {
      expect(isNearLimit(pt(), DAY)).toBe(false);
    });

    it("is false when the limit is already reached", () => {
      expect(isNearLimit(pt({ limitMinutes: 30, usedMinutes: 30 }), DAY)).toBe(false);
    });

    it("is true within the default 5-minute threshold", () => {
      expect(isNearLimit(pt({ limitMinutes: 30, usedMinutes: 25 }), DAY)).toBe(true);
      expect(isNearLimit(pt({ limitMinutes: 30, usedMinutes: 27 }), DAY)).toBe(true);
    });

    it("is false beyond the threshold", () => {
      expect(isNearLimit(pt({ limitMinutes: 30, usedMinutes: 24 }), DAY)).toBe(false);
    });

    it("honors a custom threshold", () => {
      // 20 of 30 used -> 10 remaining.
      expect(isNearLimit(pt({ limitMinutes: 30, usedMinutes: 20 }), DAY, 10)).toBe(true);
      expect(isNearLimit(pt({ limitMinutes: 30, usedMinutes: 20 }), DAY, 5)).toBe(false);
    });
  });

  describe("addPlayTime", () => {
    it("adds minutes to the used total", () => {
      const next = addPlayTime(pt({ usedMinutes: 5 }), 15, DAY);
      expect(next.usedMinutes).toBe(20);
    });

    it("rolls the day over before adding", () => {
      const stale = pt({ usedMinutes: 25 });
      const next = addPlayTime(stale, 10, NEXT_DAY);
      expect(next.usedMinutes).toBe(10);
      expect(next.lastUsedDate).toBe("2026-08-06");
    });

    it("does not subtract when given negative minutes", () => {
      const next = addPlayTime(pt({ usedMinutes: 5 }), -10, DAY);
      expect(next.usedMinutes).toBe(5);
    });

    it("keeps the limit untouched", () => {
      const next = addPlayTime(pt({ limitMinutes: 30, usedMinutes: 5 }), 15, DAY);
      expect(next.limitMinutes).toBe(30);
    });
  });

  describe("setLimit", () => {
    it("sets a positive limit", () => {
      const next = setLimit(pt(), 30, DAY);
      expect(next.limitMinutes).toBe(30);
    });

    it("clears the limit when given null", () => {
      const next = setLimit(pt({ limitMinutes: 30, usedMinutes: 12 }), null, DAY);
      expect(next.limitMinutes).toBeNull();
      expect(next.usedMinutes).toBe(12);
    });

    it("preserves existing usage when setting a limit", () => {
      const next = setLimit(pt({ usedMinutes: 20 }), 30, DAY);
      expect(next.limitMinutes).toBe(30);
      expect(next.usedMinutes).toBe(20);
    });

    it("ignores a non-positive limit", () => {
      expect(setLimit(pt(), 0, DAY).limitMinutes).toBeNull();
      expect(setLimit(pt(), -10, DAY).limitMinutes).toBeNull();
    });
  });

  describe("play session", () => {
    it("starts a session and ends it with rounded whole minutes", () => {
      startPlaySession("p1", DAY.getTime());
      const session = endPlaySession(DAY.getTime() + 2.5 * 60 * 1000);
      expect(session).toEqual({ profileId: "p1", minutes: 3 });
    });

    it("returns null when no session is active", () => {
      expect(endPlaySession()).toBeNull();
    });

    it("is idempotent after the session ends", () => {
      startPlaySession("p1", DAY.getTime());
      endPlaySession(DAY.getTime() + 60 * 1000);
      expect(endPlaySession(DAY.getTime() + 120 * 1000)).toBeNull();
    });

    it("clamps to zero minutes when the clock went backwards", () => {
      startPlaySession("p1", DAY.getTime());
      const session = endPlaySession(DAY.getTime() - 60 * 1000);
      expect(session?.minutes).toBe(0);
    });

    it("records zero minutes for a very short session", () => {
      startPlaySession("p1", DAY.getTime());
      expect(endPlaySession(DAY.getTime() + 10 * 1000)?.minutes).toBe(0);
    });
  });
});
