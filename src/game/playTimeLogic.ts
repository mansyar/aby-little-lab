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
  /** Visible milliseconds banked before the current running stretch. */
  visibleMs: number;
  /** When the current visible stretch began; null while the document is hidden. */
  runningSince: number | null;
}

let activeSession: ActiveSession | null = null;

/**
 * Visible time only is play time: a hidden tab must not burn a profile's daily
 * budget, so the session banks visible slices and the watcher below drives the
 * pause/resume. Only platforms that expose `document.visibilityState` take part
 * (older WebViews, non-DOM hosts stay inert instead of throwing).
 */
function canObserveVisibility(): boolean {
  return typeof document !== "undefined" && typeof document.visibilityState === "string";
}

function isDocumentHidden(): boolean {
  return canObserveVisibility() && document.visibilityState === "hidden";
}

function handleVisibilityChange(): void {
  if (activeSession === null) return;
  if (isDocumentHidden()) {
    pausePlaySession();
  } else {
    resumePlaySession();
  }
}

function watchVisibility(): void {
  if (!canObserveVisibility()) return;
  document.addEventListener("visibilitychange", handleVisibilityChange);
}

function unwatchVisibility(): void {
  if (typeof document === "undefined") return;
  document.removeEventListener("visibilitychange", handleVisibilityChange);
}

/** Banked visible time plus the current stretch, clamped against a backwards clock. */
function visibleElapsedMs(session: ActiveSession, now: number): number {
  if (session.runningSince === null) return session.visibleMs;
  return session.visibleMs + Math.max(0, now - session.runningSince);
}

/**
 * Start of the local day containing `now`, in epoch milliseconds. Built from the
 * same `now` the session banks with so the boundary follows local time (and DST)
 * rather than UTC.
 */
function localMidnight(now: number): number {
  const date = new Date(now);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0).getTime();
}

/**
 * Starts a play session for a profile. Only one session can be active at a
 * time; starting a new one discards any previous unfinished session. The
 * document visibility watcher is attached here so the session is paused for as
 * long as it lives — across scene boundaries, not just on the Hub.
 */
export function startPlaySession(profileId: string, now = Date.now()): void {
  // A session that begins in an already-hidden tab starts paused.
  activeSession = {
    profileId,
    visibleMs: 0,
    runningSince: isDocumentHidden() ? null : now,
  };
  watchVisibility();
}

/**
 * Stops accruing time for the active session (document hidden). Idempotent:
 * banking again without an intervening resume adds nothing.
 */
export function pausePlaySession(now = Date.now()): void {
  const session = activeSession;
  if (session === null || session.runningSince === null) return;
  session.visibleMs += Math.max(0, now - session.runningSince);
  session.runningSince = null;
}

/**
 * Resumes accrual after a hidden stretch — but never while the document is
 * still hidden, so a stray resume cannot charge background time. Idempotent.
 */
export function resumePlaySession(now = Date.now()): void {
  const session = activeSession;
  if (session === null || session.runningSince !== null || isDocumentHidden()) return;
  session.runningSince = now;
}

/**
 * Ends the active play session, returning the whole visible minutes elapsed
 * since it started (ceiled, so any visible time banks at least a minute;
 * clamped to 0 when the clock went backwards). Hidden minutes are excluded.
 * Returns null when no session is active. The session is cleared regardless.
 *
 * The elapsed time is clamped to the part accrued since local midnight: the
 * record is a single-day snapshot (`limitMinutes`, `usedMinutes`,
 * `lastUsedDate`) with no per-day history, so a closed day's usage cannot be
 * written and must not be charged to the new day.
 */
export function endPlaySession(now = Date.now()): { profileId: string; minutes: number } | null {
  const session = activeSession;
  activeSession = null;
  unwatchVisibility();
  if (session === null) return null;
  const visibleMs = visibleElapsedMs(session, now);
  const elapsed = Math.min(visibleMs, Math.max(0, now - localMidnight(now)));
  const minutes = elapsed <= 0 ? 0 : Math.ceil(elapsed / 60_000);
  return { profileId: session.profileId, minutes };
}
