import { describe, expect, it } from "vitest";
import { advanceStreak, createDefaultInsights, normalizeInsights } from "../../game/insightsLogic";
import { todayKey } from "../../game/playTimeLogic";
import type { ProfileInsights } from "../../types";

/**
 * Day keys are derived from fixed local instants, never written as literals, so
 * these expectations mean the same thing on every calendar day. The clock is
 * always injected, which is the contract `advanceStreak` is built on.
 */
const DAY1 = new Date(2026, 7, 3, 12, 0, 0); // 2026-08-03 local
const DAY2 = new Date(2026, 7, 4, 12, 0, 0);
const DAY3 = new Date(2026, 7, 5, 12, 0, 0);
const DAY5 = new Date(2026, 7, 7, 12, 0, 0); // DAY4 is skipped
const MONTH_LATER = new Date(2026, 8, 5, 12, 0, 0);
const FUTURE = new Date(2027, 0, 1, 12, 0, 0);
const LATE_NIGHT = new Date(2026, 7, 3, 23, 59, 59);
const JUST_AFTER_MIDNIGHT = new Date(2026, 7, 4, 0, 0, 1);
const NEW_YEARS_EVE = new Date(2026, 11, 31, 12, 0, 0);

/** A record with the given fields over the defaults. */
function insightsOf(partial: Partial<ProfileInsights>): ProfileInsights {
  return { ...createDefaultInsights(), ...partial };
}

describe("createDefaultInsights", () => {
  it("starts with no streak, no cap-day and no day remembered", () => {
    expect(createDefaultInsights()).toEqual({
      currentStreakDays: 0,
      bestStreakDays: 0,
      lastStreakDay: null,
      limitHitDays: 0,
      lastLimitHitDay: null,
    });
  });
});

describe("advanceStreak", () => {
  it("counts three consecutive days as a streak of three", () => {
    const first = advanceStreak(createDefaultInsights(), DAY1);
    expect(first).toEqual({
      currentStreakDays: 1,
      bestStreakDays: 1,
      lastStreakDay: todayKey(DAY1),
      limitHitDays: 0,
      lastLimitHitDay: null,
    });

    const second = advanceStreak(first, DAY2);
    expect(second.currentStreakDays).toBe(2);
    expect(second.bestStreakDays).toBe(2);

    const third = advanceStreak(second, DAY3);
    expect(third.currentStreakDays).toBe(3);
    expect(third.bestStreakDays).toBe(3);
    expect(third.lastStreakDay).toBe(todayKey(DAY3));
  });

  it("leaves the record unchanged for a second completion on the same day", () => {
    const third = advanceStreak(
      advanceStreak(advanceStreak(createDefaultInsights(), DAY1), DAY2),
      DAY3,
    );

    expect(advanceStreak(third, DAY3)).toEqual(third);
    // A later moment on the same local day is still the same day.
    expect(advanceStreak(third, new Date(2026, 7, 5, 23, 30, 0))).toEqual(third);
  });

  it("restarts at 1 after a two-day gap and keeps the earlier best", () => {
    const streakOfThree = advanceStreak(
      advanceStreak(advanceStreak(createDefaultInsights(), DAY1), DAY2),
      DAY3,
    );

    const afterGap = advanceStreak(streakOfThree, DAY5);

    expect(afterGap.currentStreakDays).toBe(1);
    expect(afterGap.bestStreakDays).toBe(3);
    expect(afterGap.lastStreakDay).toBe(todayKey(DAY5));
  });

  it("restarts at 1 after a month away and keeps the best", () => {
    const record = insightsOf({
      currentStreakDays: 5,
      bestStreakDays: 9,
      lastStreakDay: todayKey(DAY1),
    });

    const afterMonth = advanceStreak(record, MONTH_LATER);

    expect(afterMonth.currentStreakDays).toBe(1);
    expect(afterMonth.bestStreakDays).toBe(9);
    expect(afterMonth.lastStreakDay).toBe(todayKey(MONTH_LATER));
  });

  it("restarts at 1 when the stored day is in the future, keeping the best", () => {
    const record = insightsOf({
      currentStreakDays: 8,
      bestStreakDays: 12,
      lastStreakDay: todayKey(FUTURE),
    });

    const afterClockCorrection = advanceStreak(record, DAY1);

    expect(afterClockCorrection.currentStreakDays).toBe(1);
    expect(afterClockCorrection.bestStreakDays).toBe(12);
    expect(afterClockCorrection.lastStreakDay).toBe(todayKey(DAY1));
  });

  it("treats a session either side of midnight as two days", () => {
    const beforeMidnight = advanceStreak(createDefaultInsights(), LATE_NIGHT);
    const afterMidnight = advanceStreak(beforeMidnight, JUST_AFTER_MIDNIGHT);

    expect(todayKey(LATE_NIGHT)).not.toBe(todayKey(JUST_AFTER_MIDNIGHT));
    expect(afterMidnight.currentStreakDays).toBe(2);
    expect(afterMidnight.bestStreakDays).toBe(2);
  });

  it("extends a streak across a year boundary", () => {
    // 31 December -> 1 January is one day apart: the previous day is stepped
    // through the calendar, so the turn of the year neither breaks the streak
    // nor skips a day.
    const record = insightsOf({
      currentStreakDays: 2,
      bestStreakDays: 2,
      lastStreakDay: todayKey(NEW_YEARS_EVE),
    });

    const next = advanceStreak(record, FUTURE); // 1 January 2027

    expect(next.currentStreakDays).toBe(3);
    expect(next.bestStreakDays).toBe(3);
    expect(next.lastStreakDay).toBe(todayKey(FUTURE));
  });

  it("raises the best to the current streak when a malformed pair disagrees", () => {
    // A best below the current is impossible; normalisation repairs it, and the
    // running maximum then keeps growing from the repaired value.
    const record = insightsOf({
      currentStreakDays: 4,
      bestStreakDays: 1,
      lastStreakDay: todayKey(DAY1),
    });

    const next = advanceStreak(record, DAY2);

    expect(next.currentStreakDays).toBe(5);
    expect(next.bestStreakDays).toBe(5);
  });

  it("never lowers the best, however many times the streak restarts", () => {
    let record = createDefaultInsights();
    record = advanceStreak(record, DAY1);
    record = advanceStreak(record, DAY2);
    record = advanceStreak(record, DAY3);
    expect(record.bestStreakDays).toBe(3);

    record = advanceStreak(record, DAY5);
    record = advanceStreak(record, MONTH_LATER);

    expect(record.currentStreakDays).toBe(1);
    expect(record.bestStreakDays).toBe(3);
  });

  it("does not mutate the record it is given", () => {
    const record = Object.freeze(
      insightsOf({ currentStreakDays: 2, bestStreakDays: 2, lastStreakDay: todayKey(DAY2) }),
    );

    expect(() => advanceStreak(record, DAY3)).not.toThrow();
    expect(record.currentStreakDays).toBe(2);
    expect(record.lastStreakDay).toBe(todayKey(DAY2));
  });
});

describe("normalizeInsights", () => {
  it("returns a well-formed record for missing and non-object input", () => {
    for (const raw of [null, undefined, 0, 7, "", "not a record", true]) {
      expect(normalizeInsights(raw)).toEqual(createDefaultInsights());
    }
  });

  it("returns a well-formed record for an empty object or an array", () => {
    expect(normalizeInsights({})).toEqual(createDefaultInsights());
    expect(normalizeInsights([])).toEqual(createDefaultInsights());
    expect(normalizeInsights([1, 2, 3])).toEqual(createDefaultInsights());
  });

  it("zeroes wrong-typed, negative, fractional and non-finite counts", () => {
    expect(
      normalizeInsights({
        currentStreakDays: "3",
        bestStreakDays: -4,
        limitHitDays: 2.5,
        lastStreakDay: 5,
        lastLimitHitDay: "",
      }),
    ).toEqual(createDefaultInsights());

    expect(
      normalizeInsights({
        currentStreakDays: Number.NaN,
        bestStreakDays: Number.POSITIVE_INFINITY,
        limitHitDays: Number.NEGATIVE_INFINITY,
      }),
    ).toEqual(createDefaultInsights());
  });

  it("drops a day key that is not a shaped date", () => {
    // `"banana"` has no date shape at all; `"2026-13-45"` has the shape but
    // names no day on the calendar. Neither may survive a save and be compared
    // against `todayKey()` for the life of the profile.
    expect(normalizeInsights({ lastStreakDay: "banana", lastLimitHitDay: "banana" })).toEqual(
      createDefaultInsights(),
    );
    expect(
      normalizeInsights({ lastStreakDay: "2026-13-45", lastLimitHitDay: "2026-02-30" }),
    ).toEqual(createDefaultInsights());
    // A partial key, a key with the wrong separators and a longer one are all
    // refused by the same shape check.
    for (const key of ["2026-1-1", "2026/01/01", "2026-01-01T00:00:00Z", " 2026-01-01"]) {
      expect(normalizeInsights({ lastStreakDay: key })).toEqual(createDefaultInsights());
    }
  });

  it("keeps a day key that names a real calendar day at the year turn", () => {
    // 29 February in a leap year and 31 December are the two edges a naive
    // month-length check gets wrong.
    expect(normalizeInsights({ lastStreakDay: "2028-02-29" }).lastStreakDay).toBe("2028-02-29");
    expect(normalizeInsights({ lastLimitHitDay: "2026-12-31" }).lastLimitHitDay).toBe("2026-12-31");
  });

  it("keeps a well-formed record exactly as stored", () => {
    const record: ProfileInsights = {
      currentStreakDays: 3,
      bestStreakDays: 7,
      lastStreakDay: todayKey(DAY3),
      limitHitDays: 2,
      lastLimitHitDay: todayKey(DAY1),
    };

    expect(normalizeInsights(record)).toEqual(record);
  });

  it("raises a best below the current streak", () => {
    expect(
      normalizeInsights({
        currentStreakDays: 6,
        bestStreakDays: 2,
        lastStreakDay: todayKey(DAY3),
        limitHitDays: 1,
        lastLimitHitDay: todayKey(DAY2),
      }),
    ).toEqual({
      currentStreakDays: 6,
      bestStreakDays: 6,
      lastStreakDay: todayKey(DAY3),
      limitHitDays: 1,
      lastLimitHitDay: todayKey(DAY2),
    });
  });

  it("keeps a best above the current streak", () => {
    const normalized = normalizeInsights({ currentStreakDays: 1, bestStreakDays: 9 });

    expect(normalized.bestStreakDays).toBe(9);
    expect(normalized.currentStreakDays).toBe(1);
  });
});
