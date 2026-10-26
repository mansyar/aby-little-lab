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
 *
 * Art-key companion (`ART_KEYS_BY_GAME`, `artKeysInRecencyOrder`,
 * `startArtPrewarm`): the same idle scheduler paces per-game SVG raster keys
 * one per slot in the same recency-first order. The engine stays scene-less —
 * texture presence and queueing are injected probes (`isPresent`/`queueKey`)
 * so seeded tests use fakes and the Hub wiring (a later phase) backs them
 * with the real scene and TextureManager. Key-only strings live here; the SVG
 * markup stays in `src/game/art/` and each game's lazy chunk.
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
 * Raster edges matching `TEXTURE_SIZES`. Game art only ever uses the `icon`
 * (shadows, small glyphs) and `card` (everything else) tiers — no game group
 * holds a `hero` (mascot) key, so no 512 entry exists here.
 */
const ART_ICON_SIZE = 160;
const ART_CARD_SIZE = 256;

/** One `[key, size]` pair; groups compose per-game lists out of these. */
type ArtKeyDef = readonly [key: string, size: number];

const CARD = ART_CARD_SIZE;
const ICON = ART_ICON_SIZE;

const SHAPES_KEYS: readonly ArtKeyDef[] = [
  ["shape_circle", CARD],
  ["shape_square", CARD],
  ["shape_triangle", CARD],
  ["shape_star", CARD],
  ["shape_heart", CARD],
  ["shape_crescent", CARD],
  ["shape_arrow", CARD],
  ["shape_diamond", CARD],
  ["shape_hexagon", CARD],
  ["shape_octagon", CARD],
  ["shape_oval", CARD],
  ["shape_pentagon", CARD],
  ["shape_plus", CARD],
  ["shape_rectangle", CARD],
  ["shape_ring", CARD],
  ["shape_semicircle", CARD],
  ["shape_teardrop", CARD],
  ["shape_trapezoid", CARD],
];

const CUTOUTS_KEYS: readonly ArtKeyDef[] = [
  ["cutout_circle", CARD],
  ["cutout_square", CARD],
  ["cutout_triangle", CARD],
  ["cutout_star", CARD],
  ["cutout_heart", CARD],
  ["cutout_crescent", CARD],
  ["cutout_arrow", CARD],
  ["cutout_diamond", CARD],
  ["cutout_hexagon", CARD],
  ["cutout_octagon", CARD],
  ["cutout_oval", CARD],
  ["cutout_pentagon", CARD],
  ["cutout_plus", CARD],
  ["cutout_rectangle", CARD],
  ["cutout_ring", CARD],
  ["cutout_semicircle", CARD],
  ["cutout_teardrop", CARD],
  ["cutout_trapezoid", CARD],
];

const ANIMALS_KEYS: readonly ArtKeyDef[] = [
  ["animal_monkey", CARD],
  ["animal_rabbit", CARD],
  ["animal_cat", CARD],
  ["animal_dog", CARD],
  ["animal_elephant", CARD],
  ["animal_pig", CARD],
];

const FOOD_KEYS: readonly ArtKeyDef[] = [
  ["food_banana", CARD],
  ["food_carrot", CARD],
  ["food_fish", CARD],
  ["food_bone", CARD],
  ["food_peanut", CARD],
  ["food_apple", CARD],
];

const ITEMS_KEYS: readonly ArtKeyDef[] = [
  ["sm_house", CARD],
  ["sm_tree", CARD],
  ["sm_car", CARD],
  ["sm_boat", CARD],
  ["sm_ball", CARD],
  ["sm_umbrella", CARD],
  ["sm_airplane", CARD],
  ["sm_mushroom", CARD],
  ["sm_sock", CARD],
  ["sm_boot", CARD],
  ["sm_kite", CARD],
  ["sm_bell", CARD],
  ["sm_bug", CARD],
  ["sm_duck", CARD],
  ["sm_hat", CARD],
  ["sm_sun", CARD],
  ["sm_bed", CARD],
  ["sm_cup", CARD],
  ["sm_fox", CARD],
  ["sm_map", CARD],
];

const GLYPHS_KEYS: readonly ArtKeyDef[] = [
  ["bubble", CARD],
  ["sleep_zzz", ICON],
  ["card_back", CARD],
  ["arrow_more", CARD],
  ["arrow_less", CARD],
  ["equals", ICON],
  ["plus", ICON],
  ["minus", ICON],
];

const FACES_KEYS: readonly ArtKeyDef[] = [
  ["face_happy", CARD],
  ["face_sad", CARD],
  ["face_angry", CARD],
  ["face_scared", CARD],
];

const TOYS_KEYS: readonly ArtKeyDef[] = [
  ["toy_teddy_bear", CARD],
  ["toy_car", CARD],
  ["toy_rocket", CARD],
  ["toy_drum", CARD],
  ["toy_ball", CARD],
  ["toy_block", CARD],
  ["toy_box", CARD],
];

const MUSIC_KEYS: readonly ArtKeyDef[] = [
  ["frog_green", CARD],
  ["frog_blue", CARD],
  ["frog_red", CARD],
  ["lilypad", CARD],
];

const LETTERS_KEYS: readonly ArtKeyDef[] = [
  ["letter_a", CARD],
  ["letter_b", CARD],
  ["letter_c", CARD],
  ["letter_d", CARD],
  ["letter_e", CARD],
  ["letter_f", CARD],
  ["letter_g", CARD],
  ["letter_h", CARD],
  ["letter_i", CARD],
  ["letter_j", CARD],
  ["letter_k", CARD],
  ["letter_l", CARD],
  ["letter_m", CARD],
  ["letter_n", CARD],
  ["letter_o", CARD],
  ["letter_p", CARD],
  ["letter_q", CARD],
  ["letter_r", CARD],
  ["letter_s", CARD],
  ["letter_t", CARD],
  ["letter_u", CARD],
  ["letter_v", CARD],
  ["letter_w", CARD],
  ["letter_x", CARD],
  ["letter_y", CARD],
  ["letter_z", CARD],
];

const NUMERALS_KEYS: readonly ArtKeyDef[] = [
  ["numeral_0", CARD],
  ["numeral_1", CARD],
  ["numeral_2", CARD],
  ["numeral_3", CARD],
  ["numeral_4", CARD],
  ["numeral_5", CARD],
  ["numeral_6", CARD],
  ["numeral_7", CARD],
  ["numeral_8", CARD],
  ["numeral_9", CARD],
];

const SHADOWS_KEYS: readonly ArtKeyDef[] = [
  ["sm_shadow_house", ICON],
  ["sm_shadow_tree", ICON],
  ["sm_shadow_car", ICON],
  ["sm_shadow_boat", ICON],
  ["sm_shadow_ball", ICON],
  ["sm_shadow_umbrella", ICON],
  ["sm_shadow_airplane", ICON],
  ["sm_shadow_mushroom", ICON],
  ["sm_shadow_sock", ICON],
  ["sm_shadow_boot", ICON],
  ["sm_shadow_kite", ICON],
  ["sm_shadow_bell", ICON],
];

const STORY_PANEL_KEYS: readonly ArtKeyDef[] = [
  ["story_seed_planted", CARD],
  ["story_seed_sprout", CARD],
  ["story_seed_flower", CARD],
  ["story_balloon_flat", CARD],
  ["story_balloon_round", CARD],
  ["story_balloon_aloft", CARD],
  ["story_egg", CARD],
  ["story_egg_cracking", CARD],
  ["story_duckling", CARD],
  ["story_ice_scoop", CARD],
  ["story_ice_dripping", CARD],
  ["story_ice_puddle", CARD],
  ["story_cake_whole", CARD],
  ["story_cake_candles", CARD],
  ["story_cake_sliced", CARD],
  ["story_banana_whole", CARD],
  ["story_banana_peeled", CARD],
  ["story_banana_peel", CARD],
  ["story_cup_full", CARD],
  ["story_cup_pouring", CARD],
  ["story_cup_empty", CARD],
  ["story_foot_bare", CARD],
  ["story_foot_sock", CARD],
  ["story_foot_shoe", CARD],
  ["story_cloud", CARD],
  ["story_cloud_raining", CARD],
  ["story_rain_puddle", CARD],
  ["story_clothes_wet", CARD],
  ["story_clothes_drying", CARD],
  ["story_clothes_dry", CARD],
  ["story_sun_rise", CARD],
  ["story_sun_noon", CARD],
  ["story_sun_set", CARD],
];

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
