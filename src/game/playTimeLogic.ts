import type { PlayTime } from "../types";

/**
 * Pure logic for per-profile daily play-time budgets. Usage is tracked in
 * minutes against a local date key ("YYYY-MM-DD"); when the key changes,
 * usage resets to zero. A `limitMinutes` of null means unlimited.
 */

/** Local date key ("YYYY-MM-DD") for the given moment. */
export function todayKey(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Fresh play-time state: unlimited and zero usage for today. */
export function createDefaultPlayTime(now = new Date()): PlayTime {
  return { limitMinutes: null, usedMinutes: 0, lastUsedDate: todayKey(now) };
}

/**
 * Normalizes raw play-time data into a valid state: backfills missing fields
 * and resets usage when the stored day key is stale (day rollover).
 */
export function normalizePlayTime(
  raw: Partial<PlayTime> | null | undefined,
  now = new Date(),
): PlayTime {
  const defaults = createDefaultPlayTime(now);
  const limitMinutes =
    typeof raw?.limitMinutes === "number" && raw.limitMinutes > 0 ? raw.limitMinutes : null;
  const lastUsedDate =
    typeof raw?.lastUsedDate === "string" && raw.lastUsedDate !== ""
      ? raw.lastUsedDate
      : defaults.lastUsedDate;
  const usedMinutes =
    typeof raw?.usedMinutes === "number" && raw.usedMinutes > 0 ? raw.usedMinutes : 0;
  const today = todayKey(now);
  if (lastUsedDate !== today) {
    return { limitMinutes, usedMinutes: 0, lastUsedDate: today };
  }
  return { limitMinutes, usedMinutes, lastUsedDate: today };
}

/** Minutes remaining today, or null when no limit is set. Clamped at zero. */
export function getRemainingMinutes(
  playTime: Partial<PlayTime> | null | undefined,
  now = new Date(),
): number | null {
  const pt = normalizePlayTime(playTime, now);
  if (pt.limitMinutes === null) return null;
  return Math.max(0, pt.limitMinutes - pt.usedMinutes);
}

/** True when the daily budget is spent (or exceeded) for today. */
export function isLimitReached(
  playTime: Partial<PlayTime> | null | undefined,
  now = new Date(),
): boolean {
  const pt = normalizePlayTime(playTime, now);
  return pt.limitMinutes !== null && pt.usedMinutes >= pt.limitMinutes;
}

/** True when the budget is still available but within `thresholdMinutes` of running out. */
export function isNearLimit(
  playTime: Partial<PlayTime> | null | undefined,
  now = new Date(),
  thresholdMinutes = 5,
): boolean {
  const pt = normalizePlayTime(playTime, now);
  if (pt.limitMinutes === null) return false;
  const remaining = pt.limitMinutes - pt.usedMinutes;
  return remaining > 0 && remaining <= thresholdMinutes;
}

/** Adds minutes to today's usage (rolling the day over first). Negative input is ignored. */
export function addPlayTime(
  playTime: Partial<PlayTime> | null | undefined,
  minutes: number,
  now = new Date(),
): PlayTime {
  const pt = normalizePlayTime(playTime, now);
  return { ...pt, usedMinutes: pt.usedMinutes + Math.max(0, minutes) };
}

/** Sets (or clears with null) the daily limit; usage is preserved. */
export function setLimit(
  playTime: Partial<PlayTime> | null | undefined,
  limitMinutes: number | null,
  now = new Date(),
): PlayTime {
  const pt = normalizePlayTime(playTime, now);
  const valid = typeof limitMinutes === "number" && limitMinutes > 0 ? limitMinutes : null;
  return { ...pt, limitMinutes: valid };
}

interface ActiveSession {
  profileId: string;
  startedAt: number;
}

let activeSession: ActiveSession | null = null;

/**
 * Starts a play session for a profile. Only one session can be active at a
 * time; starting a new one discards any previous unfinished session.
 */
export function startPlaySession(profileId: string, now = Date.now()): void {
  activeSession = { profileId, startedAt: now };
}

/**
 * Ends the active play session, returning the whole minutes elapsed since it
 * started (rounded to the nearest minute, clamped to 0 when the clock went
 * backwards). Returns null when no session is active. The session is cleared
 * regardless.
 */
export function endPlaySession(now = Date.now()): { profileId: string; minutes: number } | null {
  const session = activeSession;
  activeSession = null;
  if (session === null) return null;
  const elapsed = now - session.startedAt;
  const minutes = elapsed <= 0 ? 0 : Math.round(elapsed / 60_000);
  return { profileId: session.profileId, minutes };
}
