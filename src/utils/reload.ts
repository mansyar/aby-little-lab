/**
 * The one-shot reload guard (FR-7).
 *
 * A crash before the canvas exists has no scene to replace and no card to draw,
 * so the only way out is a reload. Doing that unguarded turns a load that always
 * throws into a reload loop, which is worse for a child than a page that sits
 * still: the guard is what makes the retry a retry rather than a spin.
 *
 * `sessionStorage` is the store because it is the one that survives a reload
 * without writing into the child's save, and it is per-tab and per-session —
 * exactly the lifetime of "we have already tried".
 *
 * Blocked storage throws on access. A store that throws means "cannot remember",
 * and that must behave as *still allowed to reload once*: a genuinely broken
 * first load would otherwise get no retry at all.
 */
const KEY = "aby-little-lab:reload-once";

/** Whether this session has already spent its one reload. */
export function hasReloaded(): boolean {
  try {
    return window.sessionStorage.getItem(KEY) === "1";
  } catch {
    // Cannot remember, so nothing is spent yet.
    return false;
  }
}

/**
 * Reloads the page, unless this session already did.
 *
 * The flag is written before the reload is asked for, so a reload that never
 * happens (a blocked `location`) still costs the session its one attempt rather
 * than leaving a call site to try again.
 */
export function reloadOnce(): void {
  if (hasReloaded()) return;
  try {
    window.sessionStorage.setItem(KEY, "1");
  } catch {
    // Cannot remember: one reload still beats none.
  }
  window.location.reload();
}
