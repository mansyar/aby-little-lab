import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  addPlayTime,
  createDefaultPlayTime,
  endPlaySession,
  getRemainingMinutes,
  isLimitReached,
  isNearLimit,
  normalizePlayTime,
  pausePlaySession,
  resumePlaySession,
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

  describe("visibility-aware sessions", () => {
    const MINUTE = 60 * 1000;
    const T0 = DAY.getTime();
    let visibility: DocumentVisibilityState = "visible";

    function at(minutes: number): void {
      vi.setSystemTime(T0 + minutes * MINUTE);
    }

    function setVisibility(next: DocumentVisibilityState): void {
      visibility = next;
      document.dispatchEvent(new Event("visibilitychange"));
    }

    function hide(minutes: number): void {
      at(minutes);
      visibility = "hidden";
      document.dispatchEvent(new Event("visibilitychange"));
    }

    function show(minutes: number): void {
      at(minutes);
      visibility = "visible";
      document.dispatchEvent(new Event("visibilitychange"));
    }

    /** Ends the session and returns its banked minutes, failing if none was active. */
    function recordedMinutes(now = Date.now()): number {
      const ended = endPlaySession(now);
      if (ended === null) throw new Error("expected an active play session");
      return ended.minutes;
    }

    beforeEach(() => {
      endPlaySession();
      visibility = "visible";
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        get: () => visibility,
      });
      vi.useFakeTimers();
      at(0);
    });

    afterEach(() => {
      endPlaySession();
      vi.useRealTimers();
      Reflect.deleteProperty(document, "visibilityState");
    });

    it("accrues only the visible minutes while the document is hidden", () => {
      startPlaySession("p1", Date.now());
      hide(2);
      show(12);
      at(17);
      expect(recordedMinutes()).toBe(7);
    });

    it("charges the visible slice once across two hide/show cycles", () => {
      startPlaySession("p1", Date.now());
      hide(2);
      show(12);
      hide(15);
      show(25);
      at(30);
      expect(recordedMinutes()).toBe(10);
    });

    it("charges nothing for a hide with no visible time between", () => {
      startPlaySession("p1", Date.now());
      hide(0);
      show(0);
      expect(recordedMinutes()).toBe(0);
    });

    it("ignores repeated hide and show events", () => {
      startPlaySession("p1", Date.now());
      hide(2);
      hide(5);
      show(10);
      show(10);
      at(12);
      expect(recordedMinutes()).toBe(4);
    });

    it("records the visible total when the session ends while hidden", () => {
      startPlaySession("p1", Date.now());
      hide(2);
      at(20);
      expect(recordedMinutes()).toBe(2);
    });

    it("starts paused when the document is already hidden", () => {
      visibility = "hidden";
      startPlaySession("p1", Date.now());
      show(10);
      at(15);
      expect(recordedMinutes()).toBe(5);
    });

    it("never resumes while the document is still hidden", () => {
      visibility = "hidden";
      startPlaySession("p1", Date.now());
      at(5);
      resumePlaySession();
      expect(recordedMinutes()).toBe(0);
    });

    it("keeps pause and resume idempotent outside the document events", () => {
      startPlaySession("p1", T0);
      pausePlaySession(T0 + 3 * MINUTE);
      pausePlaySession(T0 + 5 * MINUTE);
      resumePlaySession(T0 + 5 * MINUTE);
      resumePlaySession(T0 + 7 * MINUTE);
      expect(endPlaySession(T0 + 9 * MINUTE)?.minutes).toBe(7);
    });

    it("ignores pause and resume with no active session", () => {
      expect(() => pausePlaySession(T0)).not.toThrow();
      expect(() => resumePlaySession(T0)).not.toThrow();
      expect(endPlaySession()).toBeNull();
    });

    it("is inert where the document has no visibilityState", () => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        get: () => undefined,
      });
      startPlaySession("p1", Date.now());
      at(10);
      expect(() => setVisibility("hidden")).not.toThrow();
      expect(recordedMinutes()).toBe(10);
    });
  });
});
