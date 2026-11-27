/**
 * Art-key prewarm engine for the Hub.
 *
 * The idle scheduler and the JS-chunk prewarm engine live in `prewarm.ts`; this
 * module holds the art-key companion: the per-game key source (composed from
 * `artKeyTables.ts`), recency-first flattening, and the art pass itself. The
 * engine stays scene-less — texture presence and queueing are injected probes
 * (`isPresent`/`queueKey`) so seeded tests use fakes and the Hub wiring backs
 * them with the real scene and TextureManager.
 *
 * Split out of `prewarm.ts` to keep the engine module inside the 400-line
 * production budget; no behavior or public API changed.
 */

import {
  ANIMALS_KEYS,
  type ArtKeyDef,
  CUTOUTS_KEYS,
  FACES_KEYS,
  FOOD_KEYS,
  GLYPHS_KEYS,
  ITEMS_KEYS,
  LETTERS_KEYS,
  MACHINE_KEYS,
  MUSIC_KEYS,
  NUMERALS_KEYS,
  ROBOT_PATH_KEYS,
  SHADOWS_KEYS,
  SHAPES_KEYS,
  STORY_PANEL_KEYS,
  TOYS_KEYS,
} from "./artKeyTables";
import {
  defaultIdleScheduler,
  type IdleScheduler,
  type PrewarmController,
  type PrewarmProgress,
  recencyFirstOrder,
} from "./prewarm";

/**
 * One art texture a game draws, identified the way `preloadArtGroups` queues
 * it: the texture key plus the raster edge its tier resolves to.
 */
export interface ArtKeyEntry {
  /** Stable storage id of the game that draws this key. */
  readonly gameId: string;
  /** Texture key, identical to the key the game's art group declares. */
  readonly key: string;
  /**
   * Raster edge (square, px) for this key's tier (`icon` 160 / `card` 256).
   * Mirrors `textureSizeFor`; the parity test pins every entry to it.
   */
  readonly size: number;
}

/**
 * Builds one game's frozen key list out of its declared groups. The group
 * arrays above are transcribed from the frozen tables in `src/game/art/`
 * (plus the story panels in `src/game/storyOrderArt.ts`); the parity test in
 * `prewarm.test.ts` pins every key and size to those live tables, so this
 * stays a derivation, not a fork. Key-only strings live here deliberately:
 * importing the group objects would drag every game's SVG markup into the
 * shell bundle.
 */
function artKeys(
  gameId: string,
  groups: readonly (readonly ArtKeyDef[])[],
): readonly ArtKeyEntry[] {
  const entries: ArtKeyEntry[] = [];
  for (const group of groups) {
    for (const [key, size] of group) {
      entries.push({ gameId, key, size });
    }
  }
  return Object.freeze(entries);
}

/**
 * Per-game art-key source (FR-1): every texture key each game rasterizes in
 * its own `preload`, in group-declaration order. Transcribed from each scene's
 * `preloadArt([...])` call (`StoryOrder` from `preloadStoryOrderArt`); the
 * shell-owned `tile_*`/`sticker_*` keys are excluded — they are already warm
 * from boot.
 */
export const ART_KEYS_BY_GAME: Readonly<Record<string, readonly ArtKeyEntry[]>> = Object.freeze({
  "shape-sorter": artKeys("shape-sorter", [CUTOUTS_KEYS, SHAPES_KEYS]),
  "animal-trace": artKeys("animal-trace", [ANIMALS_KEYS, FOOD_KEYS]),
  "pop-freeze": artKeys("pop-freeze", [ANIMALS_KEYS, GLYPHS_KEYS]),
  "shadow-match": artKeys("shadow-match", [ITEMS_KEYS, SHADOWS_KEYS]),
  "musical-memory": artKeys("musical-memory", [MUSIC_KEYS]),
  "big-small": artKeys("big-small", [TOYS_KEYS]),
  "pattern-builder": artKeys("pattern-builder", [SHAPES_KEYS]),
  "alphabet-match": artKeys("alphabet-match", [LETTERS_KEYS]),
  "word-match": artKeys("word-match", [
    ANIMALS_KEYS,
    FOOD_KEYS,
    ITEMS_KEYS,
    LETTERS_KEYS,
    MUSIC_KEYS,
    SHAPES_KEYS,
    TOYS_KEYS,
  ]),
  "word-builder": artKeys("word-builder", [
    ANIMALS_KEYS,
    FOOD_KEYS,
    ITEMS_KEYS,
    LETTERS_KEYS,
    MUSIC_KEYS,
    SHAPES_KEYS,
    TOYS_KEYS,
  ]),
  "how-many": artKeys("how-many", [FOOD_KEYS, ITEMS_KEYS, NUMERALS_KEYS, SHAPES_KEYS]),
  "first-sounds": artKeys("first-sounds", [
    ANIMALS_KEYS,
    FOOD_KEYS,
    ITEMS_KEYS,
    LETTERS_KEYS,
    MUSIC_KEYS,
    SHAPES_KEYS,
    TOYS_KEYS,
  ]),
  "more-less": artKeys("more-less", [FOOD_KEYS, GLYPHS_KEYS, ITEMS_KEYS, SHAPES_KEYS]),
  "odd-one-out": artKeys("odd-one-out", [ANIMALS_KEYS, MUSIC_KEYS, SHAPES_KEYS, TOYS_KEYS]),
  "color-match": artKeys("color-match", [MUSIC_KEYS, SHAPES_KEYS]),
  "add-it-up": artKeys("add-it-up", [FOOD_KEYS, GLYPHS_KEYS, ITEMS_KEYS, SHAPES_KEYS]),
  "take-away": artKeys("take-away", [FOOD_KEYS, GLYPHS_KEYS, ITEMS_KEYS, SHAPES_KEYS]),
  "memory-match": artKeys("memory-match", [ANIMALS_KEYS, GLYPHS_KEYS, ITEMS_KEYS, TOYS_KEYS]),
  "decode-it": artKeys("decode-it", [
    ANIMALS_KEYS,
    FOOD_KEYS,
    ITEMS_KEYS,
    LETTERS_KEYS,
    MUSIC_KEYS,
    SHAPES_KEYS,
    TOYS_KEYS,
  ]),
  "number-order": artKeys("number-order", [NUMERALS_KEYS]),
  "feelings-faces": artKeys("feelings-faces", [FACES_KEYS]),
  "story-order": artKeys("story-order", [STORY_PANEL_KEYS]),
  "robot-path": artKeys("robot-path", [ROBOT_PATH_KEYS]),
  "fix-it-machine": artKeys("fix-it-machine", [MACHINE_KEYS]),
  // The Repeat Machine draws with the bubble glyph rather than shipping art.
  "repeat-machine": artKeys("repeat-machine", [GLYPHS_KEYS]),
});

/**
 * Pure recency-first flattening of the art-key source (FR-1): games in
 * `recencyFirstOrder`, each game's keys in declaration order, cross-game
 * duplicates kept at their first (most-recent-game) occurrence. A first visit
 * (no `lastPlayedAt`) falls back to `gridOrder`, mirroring the JS prewarm.
 *
 * @param keysByGame - Per-game key lists, keyed by game id.
 * @param progress - The active profile's progress record.
 * @param gridOrder - Hub grid order, the tie-breaker and first-visit fallback.
 */
export function artKeysInRecencyOrder(
  keysByGame: Readonly<Record<string, readonly ArtKeyEntry[]>>,
  progress: PrewarmProgress,
  gridOrder: readonly string[],
): ArtKeyEntry[] {
  const orderedGames = recencyFirstOrder(progress, gridOrder, Object.keys(keysByGame));
  const seen = new Set<string>();
  const flat: ArtKeyEntry[] = [];
  for (const gameId of orderedGames) {
    const entries = keysByGame[gameId] ?? [];
    for (const entry of entries) {
      if (seen.has(entry.key)) {
        continue;
      }
      seen.add(entry.key);
      flat.push(entry);
    }
  }
  return flat;
}

/** Texture-queueing dependencies the scene-less engine injects (FR-3). */
export interface ArtPrewarmProbes {
  /**
   * Returns true when `key` already lives in the game-wide TextureManager.
   * Must be a cheap synchronous probe — it runs once per key per pass.
   */
  isPresent: (key: string) => boolean;
  /**
   * Queues one key for rasterization at `entry.size`. May return a promise
   * (settled before the next tick) or a plain value. Phase 2 backs this with
   * the Hub scene's loader; the engine never touches Phaser itself.
   */
  queueKey: (entry: ArtKeyEntry) => Promise<unknown> | unknown;
}

export interface StartArtPrewarmOptions extends ArtPrewarmProbes {
  /** Per-game key lists, keyed by game id (`ART_KEYS_BY_GAME`). */
  keysByGame: Readonly<Record<string, readonly ArtKeyEntry[]>>;
  /** Hub grid order: the recency tie-breaker and first-visit fallback. */
  gridOrder: readonly string[];
  /**
   * Active-profile progress provider, called on every idle tick so a profile
   * switch mid-cycle reorders the remaining keys (FR-1).
   */
  getProgress: () => PrewarmProgress;
  /** Idle scheduler; defaults to the platform scheduler. */
  scheduler?: IdleScheduler;
  /**
   * Keys already handled (queued or found present), shared across runs so a
   * later pass skips them without consuming idle slots. Defaults to a fresh
   * set for this run only.
   */
  queued?: Set<string>;
}

/**
 * Starts one idle-paced art-key pass over the per-game key source. Mirrors the
 * JS chunk engine's contracts: exactly one `queueKey` in flight at a time,
 * one raster per idle slot, present keys skipped without queueing, per-key
 * failures swallowed with no in-pass retry (the key stays out of `queued`, so
 * the next pass re-attempts it), and `cancel()` yielding to the tap — pending
 * keys are dropped without touching already-queued ones.
 *
 * The game order is recomputed from `getProgress()` on every tick; an
 * in-flight `queueKey` is never aborted, its outcome is simply discarded when
 * cancelled.
 */
export function startArtPrewarm(options: StartArtPrewarmOptions): PrewarmController {
  const scheduler = options.scheduler ?? defaultIdleScheduler;
  const queued = options.queued ?? new Set<string>();
  /**
   * Keys that failed this pass. They are skipped for the rest of the pass
   * (no retry storm) but stay out of `queued`, so the next pass re-attempts
   * them — the same retry shape as the JS chunk engine.
   */
  const failed = new Set<string>();
  let cancelled = false;
  let pendingHandle: number | null = null;
  let inFlight = false;

  const nextPending = (): ArtKeyEntry | undefined => {
    const ordered = artKeysInRecencyOrder(
      options.keysByGame,
      options.getProgress(),
      options.gridOrder,
    );
    for (const entry of ordered) {
      if (queued.has(entry.key) || failed.has(entry.key)) {
        continue;
      }
      if (options.isPresent(entry.key)) {
        queued.add(entry.key);
        continue;
      }
      return entry;
    }
    return undefined;
  };

  const pump = (): void => {
    if (cancelled || inFlight) {
      return;
    }
    pendingHandle = scheduler.request(() => {
      pendingHandle = null;
      if (cancelled) {
        return;
      }
      const next = nextPending();
      if (next === undefined) {
        return;
      }
      inFlight = true;
      void runOne(next);
    });
  };

  const runOne = async (entry: ArtKeyEntry): Promise<void> => {
    try {
      await options.queueKey(entry);
      // A cancelled run discards the outcome: the raster may still have been
      // queued, but it must not extend this run or poison the next pass.
      if (!cancelled) {
        queued.add(entry.key);
      }
    } catch {
      // Swallowed per FR-3: no unhandled rejection, no in-pass retry. The key
      // stays out of `queued`, so the next pass re-attempts it and the tap
      // path covers it through the placeholder exactly as without prewarm.
      failed.add(entry.key);
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
