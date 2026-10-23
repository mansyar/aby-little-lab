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
  setPlaySessionSink,
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
    it("starts a session and ends it with ceiled whole minutes", () => {
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

    it("banks a full minute for ten seconds of visible time", () => {
      startPlaySession("p1", DAY.getTime());
      expect(endPlaySession(DAY.getTime() + 10 * 1000)?.minutes).toBe(1);
    });
  });

  describe("minute conversion (ceil)", () => {
    it("banks exactly one minute for any visible time under a minute", () => {
      startPlaySession("p1", DAY.getTime());
      expect(endPlaySession(DAY.getTime() + 1)?.minutes).toBe(1);

      startPlaySession("p1", DAY.getTime());
      expect(endPlaySession(DAY.getTime() + 59 * 1000)?.minutes).toBe(1);
    });

    it("banks 46 minutes for 45 minutes 29 seconds of visible time", () => {
      startPlaySession("p1", DAY.getTime());
      const elapsed = 45 * 60 * 1000 + 29 * 1000;
      expect(endPlaySession(DAY.getTime() + elapsed)?.minutes).toBe(46);
    });

    it("banks zero for a session ended the moment it starts", () => {
      startPlaySession("p1", DAY.getTime());
      expect(endPlaySession(DAY.getTime())?.minutes).toBe(0);
    });

    it("banks zero when the clock went backwards", () => {
      startPlaySession("p1", DAY.getTime());
      expect(endPlaySession(DAY.getTime() - 60 * 1000)?.minutes).toBe(0);
    });
  });

  describe("midnight boundary (per-stretch accrual)", () => {
    const MINUTE = 60 * 1000;
    const BEFORE_MIDNIGHT = new Date(2026, 7, 5, 23, 58, 0);
    const AFTER_MIDNIGHT = new Date(2026, 7, 6, 0, 2, 0);
    const MIDDAY = new Date(2026, 7, 5, 12, 0, 0);

    it("charges the new day only for post-midnight time", () => {
      startPlaySession("p1", BEFORE_MIDNIGHT.getTime());
      expect(endPlaySession(AFTER_MIDNIGHT.getTime())?.minutes).toBe(2);
    });

    it("leaves a session wholly inside one day unaffected", () => {
      startPlaySession("p1", MIDDAY.getTime());
      expect(endPlaySession(MIDDAY.getTime() + 45 * MINUTE)?.minutes).toBe(45);
    });

    it("banks zero for the new day when the session ends exactly at midnight", () => {
      const midnight = new Date(2026, 7, 6, 0, 0, 0, 0);
      startPlaySession("p1", BEFORE_MIDNIGHT.getTime());
      expect(endPlaySession(midnight.getTime())?.minutes).toBe(0);
    });

    it("charges only the post-midnight stretch of a session paused before midnight", () => {
      const pauseAt = new Date(2026, 7, 5, 23, 55, 0);
      const resumeAt = new Date(2026, 7, 6, 0, 1, 0);
      const endAt = new Date(2026, 7, 6, 0, 3, 0);
      startPlaySession("p1", new Date(2026, 7, 5, 23, 50, 0).getTime());
      pausePlaySession(pauseAt.getTime());
      resumePlaySession(resumeAt.getTime());
      // The 5 minutes played before midnight belong to the closed day; only the
      // 2 played after it are chargeable to the new day.
      expect(endPlaySession(endAt.getTime())?.minutes).toBe(2);
    });

    it("drops pre-midnight visible time when the session resumes the next morning", () => {
      const pauseAt = new Date(2026, 7, 5, 23, 55, 0);
      const resumeAt = new Date(2026, 7, 6, 8, 0, 0);
      const endAt = new Date(2026, 7, 6, 8, 5, 0);
      startPlaySession("p1", new Date(2026, 7, 5, 23, 50, 0).getTime());
      pausePlaySession(pauseAt.getTime());
      resumePlaySession(resumeAt.getTime());
      // 10 visible minutes in all, but only the 5 after the new midnight count.
      expect(endPlaySession(endAt.getTime())?.minutes).toBe(5);
    });

    it("charges nothing to the new day when the session ends while hidden", () => {
      const pauseAt = new Date(2026, 7, 5, 23, 59, 0);
      startPlaySession("p1", new Date(2026, 7, 5, 23, 50, 0).getTime());
      pausePlaySession(pauseAt.getTime());
      // Hidden across the boundary and never resumed: no visible time today.
      expect(endPlaySession(new Date(2026, 7, 6, 0, 5, 0).getTime())?.minutes).toBe(0);
    });

    it("charges only the last day's portion of a stretch spanning two midnights", () => {
      startPlaySession("p1", new Date(2026, 7, 4, 23, 0, 0).getTime());
      // Continuously visible for 26 hours: only the hour after the most recent
      // midnight belongs to the day that will be written.
      expect(endPlaySession(new Date(2026, 7, 6, 1, 0, 0).getTime())?.minutes).toBe(60);
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

  describe("session banking (injected sink)", () => {
    const MINUTE = 60 * 1000;
    const T0 = DAY.getTime();
    const banked: Array<{ profileId: string; minutes: number }> = [];

    function at(minutes: number): void {
      vi.setSystemTime(T0 + minutes * MINUTE);
    }

    /** A `pagehide` on the window — the page-exit signal the module listens for. */
    function pagehide(): void {
      window.dispatchEvent(new Event("pagehide"));
    }

    /** A `pagehide` into the back/forward cache: the document is restored in place. */
    function restorablePagehide(): void {
      const event = new Event("pagehide") as Event & { persisted?: boolean };
      event.persisted = true;
      window.dispatchEvent(event);
    }

    beforeEach(() => {
      endPlaySession();
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        get: () => "visible",
      });
      vi.useFakeTimers();
      at(0);
      banked.length = 0;
      setPlaySessionSink((profileId, minutes) => {
        banked.push({ profileId, minutes });
      });
    });

    afterEach(() => {
      // Both the sink and the active session are module scope: reset them or the
      // suite poisons later cases.
      setPlaySessionSink(null);
      endPlaySession();
      vi.useRealTimers();
      Reflect.deleteProperty(document, "visibilityState");
    });

    describe("page exit (pagehide)", () => {
      it("banks the visible minutes when the page is exited", () => {
        startPlaySession("p1", T0);
        at(2.5);
        pagehide();
        expect(banked).toEqual([{ profileId: "p1", minutes: 3 }]);
      });

      it("clears the session so a later end banks nothing", () => {
        startPlaySession("p1", T0);
        at(4);
        pagehide();
        expect(endPlaySession(T0 + 6 * MINUTE)).toBeNull();
        expect(banked).toEqual([{ profileId: "p1", minutes: 4 }]);
      });

      it("banks once even when the page-exit event repeats", () => {
        startPlaySession("p1", T0);
        at(2);
        pagehide();
        at(9);
        pagehide();
        expect(banked).toEqual([{ profileId: "p1", minutes: 2 }]);
      });

      it("banks only the visible time accrued before the exit", () => {
        let state: DocumentVisibilityState = "visible";
        Object.defineProperty(document, "visibilityState", {
          configurable: true,
          get: () => state,
        });
        startPlaySession("p1", T0);
        at(2);
        state = "hidden";
        document.dispatchEvent(new Event("visibilitychange"));
        at(20);
        pagehide();
        expect(banked).toEqual([{ profileId: "p1", minutes: 2 }]);
      });

      it("stays inert where the document has no visibilityState", () => {
        Object.defineProperty(document, "visibilityState", {
          configurable: true,
          get: () => undefined,
        });
        startPlaySession("p1", T0);
        at(3);
        expect(() => pagehide()).not.toThrow();
        expect(banked).toHaveLength(0);
        expect(endPlaySession(T0 + 3 * MINUTE)?.minutes).toBe(3);
      });

      it("does not bank a restorable exit into the back/forward cache", () => {
        startPlaySession("p1", T0);
        at(2);
        restorablePagehide();

        // Nothing banked, and the session is still the live one: the restored
        // document resumes accruing instead of running on with no session.
        expect(banked).toHaveLength(0);
        expect(endPlaySession(T0 + 4 * MINUTE)).toEqual({ profileId: "p1", minutes: 4 });

        // A real exit afterwards banks the whole stretch, exactly once.
        startPlaySession("p1", T0);
        at(6);
        pagehide();
        expect(banked).toEqual([{ profileId: "p1", minutes: 6 }]);
      });

      it("banks a real exit even after a restorable one", () => {
        startPlaySession("p1", T0);
        at(2);
        restorablePagehide();
        at(5);
        pagehide();
        expect(banked).toEqual([{ profileId: "p1", minutes: 5 }]);
      });
    });

    describe("starting over a running session", () => {
      it("banks the running session, then tracks the new profile", () => {
        startPlaySession("p1", T0);
        at(5);
        startPlaySession("p2", T0 + 5 * MINUTE);
        expect(banked).toEqual([{ profileId: "p1", minutes: 5 }]);
        expect(endPlaySession(T0 + 8 * MINUTE)).toEqual({ profileId: "p2", minutes: 3 });
        expect(banked).toHaveLength(1);
      });

      it("banks nothing when no session is running", () => {
        startPlaySession("p1", T0);
        expect(banked).toHaveLength(0);
      });

      it("banks only the first session after a page-exit flush", () => {
        startPlaySession("p1", T0);
        at(4);
        pagehide();
        at(10);
        startPlaySession("p2");
        expect(banked).toEqual([{ profileId: "p1", minutes: 4 }]);
      });
    });
  });
});
