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
  /** Visible milliseconds accrued since `accruedMidnight`, before the running stretch. */
  sinceMidnightMs: number;
  /**
   * The local midnight `sinceMidnightMs` is measured from. Accrual rebases it
   * whenever a stretch is closed in a later day, because the day that just
   * ended is not chargeable to the new one.
   */
  accruedMidnight: number;
  /** When the current visible stretch began; null while the document is hidden. */
  runningSince: number | null;
}

let activeSession: ActiveSession | null = null;

type PlaySessionSink = (profileId: string, minutes: number) => void;

let sessionSink: PlaySessionSink | null = null;

/**
 * Registers the banking sink: the storage-layer writer that persists a
 * completed session. The module owns *when* to bank but not *where*, so it can
 * keep importing nothing beyond `../types` and stay free of a storage cycle.
 * Pass null to unregister (non-persisting hosts, tests).
 */
export function setPlaySessionSink(sink: PlaySessionSink | null): void {
  sessionSink = sink;
}

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

/**
 * A page exit is the last signal a device gives: bank what the session accrued
 * and clear the slot, so a Hub that is created afterwards banks nothing twice.
 *
 * The one exception is an exit into the back/forward cache (`persisted`): that
 * document is restored in place, session and watchers included, so banking here
 * would end a session that is about to resume and lose the rest of the stretch.
 */
function handlePageHide(event?: Event): void {
  if ((event as { persisted?: boolean } | undefined)?.persisted === true) return;
  bankSession(Date.now());
}

/**
 * True where the window can carry the page-exit listener. `pagehide` is a window
 * event, so a host that exposes no window listener surface (a headless renderer,
 * or a test double stubbing a partial `window`) must stay inert rather than
 * throw on the exit path.
 */
function canObservePageExit(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.addEventListener === "function" &&
    typeof window.removeEventListener === "function"
  );
}

/**
 * The pause/resume watcher stays attached for short app switches; `pagehide` is
 * the terminal path beside it, so a closed tab cannot lose the session. Both are
 * capability-guarded: a non-DOM host attaches nothing and stays inert.
 */
function watchVisibility(): void {
  if (!canObserveVisibility()) return;
  document.addEventListener("visibilitychange", handleVisibilityChange);
  if (canObservePageExit()) {
    window.addEventListener("pagehide", handlePageHide);
  }
}

function unwatchVisibility(): void {
  if (typeof document !== "undefined") {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  }
  // Removed by capability rather than by what watch attached: removal is only
  // reachable where the listener surface exists, and removing an absent
  // listener is a no-op.
  if (canObservePageExit()) {
    window.removeEventListener("pagehide", handlePageHide);
  }
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
 * The part of the visible stretch `start`..`end` that falls after the most
 * recent local midnight. A stretch inside one day contributes its own length, a
 * stretch that crosses a boundary only its post-midnight tail, and a backwards
 * clock nothing.
 */
function visibleAfterMidnight(start: number, end: number): number {
  return Math.max(0, end - Math.max(start, localMidnight(end)));
}

/**
 * Moves the accumulator onto the local day containing `now`, dropping what a
 * closed day accrued — that usage cannot be written (the record is a single-day
 * snapshot) and must not be charged to the new day.
 */
function rebaseMidnight(session: ActiveSession, now: number): void {
  const midnight = localMidnight(now);
  if (midnight === session.accruedMidnight) return;
  session.sinceMidnightMs = 0;
  session.accruedMidnight = midnight;
}

/**
 * Adds the post-midnight share of one closed visible stretch to the session
 * accumulator, rebasing it first when the stretch is charged in a later day than
 * the one it started in.
 */
function accrueSinceMidnight(session: ActiveSession, start: number, end: number): void {
  if (end <= start) return;
  rebaseMidnight(session, end);
  session.sinceMidnightMs += visibleAfterMidnight(start, end);
}

/**
 * Starts a play session for a profile. Only one session can be active at a
 * time, so an unfinished previous session is ended and banked first — visible
 * time is never silently discarded. The document visibility watcher is attached
 * here so the session is paused for as long as it lives — across scene
 * boundaries, not just on the Hub.
 */
export function startPlaySession(profileId: string, now = Date.now()): void {
  // Bank the outgoing session before replacing the single slot.
  bankSession(now);
  // A session that begins in an already-hidden tab starts paused.
  activeSession = {
    profileId,
    sinceMidnightMs: 0,
    accruedMidnight: localMidnight(now),
    runningSince: isDocumentHidden() ? null : now,
  };
  watchVisibility();
}

/**
 * Stops accruing time for the active session (document hidden), banking the
 * post-midnight share of the stretch that just closed. Idempotent: banking again
 * without an intervening resume adds nothing.
 */
export function pausePlaySession(now = Date.now()): void {
  const session = activeSession;
  if (session === null || session.runningSince === null) return;
  accrueSinceMidnight(session, session.runningSince, now);
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
 * Ends the active play session, returning the visible minutes accrued since the
 * most recent local midnight (ceiled, so any visible time banks at least a
 * minute; 0 when it has been less than that or the clock went backwards). Hidden
 * stretches contribute nothing. Returns null when no session is active. The
 * session is cleared regardless.
 *
 * The accrued time is per stretch: each visible stretch contributes only the
 * part that falls after local midnight, and a stretch closed in a later day
 * drops what was accrued in the day before. So a session paused at 23:55,
 * resumed at 00:01 and ended at 00:03 banks 2 minutes, not the 3 the wall clock
 * has passed since midnight nor the 7 it was visible in total. The record is a
 * single-day snapshot (`limitMinutes`, `usedMinutes`, `lastUsedDate`) with no
 * per-day history, so a closed day's usage cannot be written and is not charged
 * to the new day.
 */
export function endPlaySession(now = Date.now()): { profileId: string; minutes: number } | null {
  const session = activeSession;
  activeSession = null;
  unwatchVisibility();
  if (session === null) return null;
  rebaseMidnight(session, now);
  if (session.runningSince !== null) {
    accrueSinceMidnight(session, session.runningSince, now);
  }
  const accrual = session.sinceMidnightMs;
  const minutes = accrual <= 0 ? 0 : Math.ceil(accrual / 60_000);
  return { profileId: session.profileId, minutes };
}

/**
 * The single bank path: ends the active session, hands its minutes to the
 * registered sink, and returns what was banked. Ending clears the slot, so a
 * session banks at most once however many exit paths fire.
 */
function bankSession(now = Date.now()): { profileId: string; minutes: number } | null {
  const ended = endPlaySession(now);
  if (ended !== null && sessionSink !== null) {
    sessionSink(ended.profileId, ended.minutes);
  }
  return ended;
}
