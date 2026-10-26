/**
 * Idle-paced prewarm for the 22 lazy game-scene chunks (`sceneRegistry.sceneLoaders`).
 *
 * The engine is deliberately self-contained: it imports nothing but the platform
 * scheduler — no storage, no progress logic, no Phaser, no scene registry. The
 * caller supplies the ordered loader entries, so the ordering policy lives at
 * the call site (see `recencyFirstOrder`).
 *
 * Pacing contract (FR-1 engine half):
 * - Exactly one chunk import is in flight at a time. The next idle slot is
 *   requested only after the previous import settles (resolved or rejected).
 * - An already-imported key is skipped without consuming an idle slot, which
 *   makes repeated runs idempotent (FR-3).
 * - A rejected import is swallowed: no unhandled rejection, no retry, and the
 *   queue simply continues with the next key. The failed key is NOT marked
 *   imported, so the next controller run retries it naturally.
 *
 * Tap-wins rule: the caller owns cancellation. When the child taps a tile, the
 * caller must call `cancel()` before starting the scene so the tap's own
 * fetch and registration are never queued behind prewarm work (the Hub wiring
 * lands in a later phase). The engine never touches input or navigation.
 */

/** Contract for scheduling work into an idle slot. */
export interface IdleScheduler {
  /** Requests the next idle slot and returns a cancellable handle. */
  request(callback: () => void): number;
  /** Cancels a slot requested by `request` that has not fired yet. */
  cancel(handle: number): void;
}

/** Fallback delay for the low-priority `setTimeout` path (one frame). */
const IDLE_FALLBACK_DELAY_MS = 16;

/**
 * Platform scheduler: `requestIdleCallback` when available, otherwise a
 * low-priority `setTimeout` fallback. Built once at module level; tests inject
 * their own scheduler instead of relying on this one.
 */
export const defaultIdleScheduler: IdleScheduler = {
  request(callback) {
    if (typeof requestIdleCallback === "function") {
      return requestIdleCallback(() => callback());
    }
    return setTimeout(callback, IDLE_FALLBACK_DELAY_MS);
  },
  cancel(handle) {
    if (typeof cancelIdleCallback === "function") {
      cancelIdleCallback(handle);
    } else {
      clearTimeout(handle);
    }
  },
};

/** One prewarmable chunk: a scene key and its dynamic-import loader thunk. */
export interface PrewarmEntry {
  /** Scene key matching the `sceneLoaders` keys (e.g. "ShapeSorter"). */
  key: string;
  /** Dynamic-import thunk for the scene chunk. */
  load: () => Promise<unknown>;
}

export interface StartPrewarmOptions {
  /** Entries in the order they should be imported. */
  entries: readonly PrewarmEntry[];
  /** Idle scheduler; defaults to the platform scheduler. */
  scheduler?: IdleScheduler;
  /**
   * Set of already-imported keys, shared across runs so a later controller run
   * skips them. Defaults to a fresh set for this run only.
   */
  imported?: Set<string>;
}

export interface PrewarmController {
  /**
   * Stops pending work: the queued idle slot is cancelled and no further
   * import is started. An already in-flight import is left alone — its result
   * is discarded and it schedules nothing further. Safe to call more than once
   * and after the queue has drained.
   */
  cancel(): void;
}

/**
 * Starts one idle-paced prewarm pass over the given entries. Returns a
 * controller whose `cancel()` yields to the caller (tap-wins rule above).
 *
 * The pass processes the entries once, in the given order; to prewarm again
 * (e.g. on the next Hub visit) call `startPrewarm` again with the same
 * `imported` set so imported chunks are skipped without consuming idle slots.
 */
export function startPrewarm(options: StartPrewarmOptions): PrewarmController {
  const scheduler = options.scheduler ?? defaultIdleScheduler;
  const imported = options.imported ?? new Set<string>();
  const queue = options.entries
    .map((entry) => ({ key: entry.key, load: entry.load }))
    .filter((entry) => !imported.has(entry.key));
  let cancelled = false;
  let pendingHandle: number | null = null;
  let inFlight = false;

  const pump = (): void => {
    if (cancelled || inFlight || queue.length === 0) {
      return;
    }
    pendingHandle = scheduler.request(() => {
      pendingHandle = null;
      if (cancelled) {
        return;
      }
      const next = queue.shift();
      if (!next) {
        return;
      }
      inFlight = true;
      void runOne(next);
    });
  };

  const runOne = async (entry: PrewarmEntry): Promise<void> => {
    try {
      await entry.load();
      // A cancelled run discards the outcome: the import may still have
      // populated the module cache, but it must not extend this run.
      if (!cancelled) {
        imported.add(entry.key);
      }
    } catch {
      // Swallowed per FR-3: no unhandled rejection, no retry. The key stays
      // out of `imported`, so the next controller run re-attempts it.
    } finally {
      inFlight = false;
      pump();
    }
  };

  pump();

  return {
    cancel(): void {
      cancelled = true;
      if (pendingHandle !== null) {
        scheduler.cancel(pendingHandle);
        pendingHandle = null;
      }
    },
  };
}

/**
 * Minimal structural view of a per-game progress record — any object with a
 * nullable last-played timestamp qualifies (the full `GameProgress` shape is a
 * superset). Kept structural so this module stays decoupled from progress
 * logic and storage.
 */
export type PrewarmProgress = Record<string, { lastPlayedAt: string | null }>;

/**
 * Recency-first prewarm order (FR-1): game ids sorted by `lastPlayedAt`
 * descending, never-played games last preserving grid order. Ties — identical
 * timestamps, including two never-played games — resolve by grid order.
 *
 * Pure function: it reads only its arguments and never mutates them. A
 * missing, empty, or unparseable timestamp counts as never-played.
 *
 * @param progress - The active profile's progress record.
 * @param gridOrder - Hub grid order (the `GAME_TILES` order), the tie-breaker.
 * @param allKeys - Every game id to order.
 */
export function recencyFirstOrder(
  progress: PrewarmProgress,
  gridOrder: readonly string[],
  allKeys: readonly string[],
): string[] {
  const gridIndex = new Map<string, number>();
  gridOrder.forEach((key, index) => {
    gridIndex.set(key, index);
  });
  const fallbackIndex = gridOrder.length;

  const stamp = (key: string): number => {
    const raw = progress[key]?.lastPlayedAt;
    if (typeof raw !== "string" || raw === "") {
      return Number.NEGATIVE_INFINITY;
    }
    const parsed = Date.parse(raw);
    return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
  };

  const byRecencyThenGrid = (a: string, b: string): number => {
    const aStamp = stamp(a);
    const bStamp = stamp(b);
    if (aStamp !== bStamp) {
      return bStamp - aStamp;
    }
    return (gridIndex.get(a) ?? fallbackIndex) - (gridIndex.get(b) ?? fallbackIndex);
  };

  return [...allKeys].sort(byRecencyThenGrid);
}
