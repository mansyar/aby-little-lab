import type { ProfileInsights } from "../types";
import { todayKey } from "./playTimeLogic";

/**
 * Pure logic for per-profile insight history: the consecutive-day streak and
 * the days the daily play-time cap was reached. Both are keyed by a local day
 * ("YYYY-MM-DD", the shape `todayKey()` emits), so the only thing that splits
 * two sessions is a day boundary — never a session count, and never the wall
 * clock read inside these functions. The caller passes the moment in.
 */

/** Fresh insights: no streak, no cap-day, and no day remembered. */
export function createDefaultInsights(): ProfileInsights {
  return {
    currentStreakDays: 0,
    bestStreakDays: 0,
    lastStreakDay: null,
    limitHitDays: 0,
    lastLimitHitDay: null,
  };
}

/**
 * One field of an arbitrary value, or undefined when there is nothing to read.
 * Normalisation is total, so the input may be `null`, an array, or an object
 * with the wrong type in a field — none of them may throw.
 */
function readField(raw: unknown, key: keyof ProfileInsights): unknown {
  if (typeof raw !== "object" || raw === null) return undefined;
  return Reflect.get(raw, key);
}

/** A stored count: a non-negative integer, or zero for anything else. */
function count(value: unknown): number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : 0;
}

/**
 * The day-key shape `todayKey()` emits: four digits, a two-digit month and a
 * two-digit day.
 */
const DAY_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * A stored day key: a string shaped like a local date that also names a real
 * calendar day, or null for anything else.
 *
 * The shape alone is not enough — `"2026-13-45"` matches the pattern and is
 * not a date — so the month and day are checked against the calendar too.
 * The month length is read at noon so a daylight-saving change at midnight
 * cannot shift the count onto a neighbouring day.
 */
function dayKey(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = DAY_KEY.exec(value);
  if (match === null) return null;
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1) return null;
  const daysInMonth = new Date(Number(match[1]), month, 0, 12).getDate();
  return day <= daysInMonth ? value : null;
}

/**
 * Backfills a raw insights record into a well-formed one. Missing, partial or
 * malformed values become zeros and nulls rather than throwing, and
 * `bestStreakDays` is raised to `currentStreakDays` when the stored pair is
 * inconsistent, because the best is by definition the running maximum.
 */
export function normalizeInsights(raw: unknown): ProfileInsights {
  const currentStreakDays = count(readField(raw, "currentStreakDays"));
  const bestStreakDays = Math.max(count(readField(raw, "bestStreakDays")), currentStreakDays);
  return {
    currentStreakDays,
    bestStreakDays,
    lastStreakDay: dayKey(readField(raw, "lastStreakDay")),
    limitHitDays: count(readField(raw, "limitHitDays")),
    lastLimitHitDay: dayKey(readField(raw, "lastLimitHitDay")),
  };
}

/**
 * The local day key before the one containing `now`. Built by stepping the
 * calendar date rather than subtracting 24 hours, so a daylight-saving change
 * cannot land on the same day twice or skip one.
 */
function previousDayKey(now: Date): string {
  return todayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
}

/**
 * Advances the streak for a completed session on the day containing `now`.
 *
 * One completion per local day counts: a second completion on the same day
 * leaves the record unchanged, a completion on the day after the last one
 * extends the streak, and any other gap — a missed day, a month away, or a
 * stored day in the future because the device clock moved backwards — restarts
 * it at 1. `bestStreakDays` never decreases.
 */
export function advanceStreak(insights: ProfileInsights, now: Date = new Date()): ProfileInsights {
  const current = normalizeInsights(insights);
  const today = todayKey(now);
  if (current.lastStreakDay === today) return current;
  const currentStreakDays =
    current.lastStreakDay === previousDayKey(now) ? current.currentStreakDays + 1 : 1;
  return {
    ...current,
    currentStreakDays,
    bestStreakDays: Math.max(current.bestStreakDays, currentStreakDays),
    lastStreakDay: today,
  };
}
