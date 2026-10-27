import { toDataUri } from "../../utils/svgDataUri";
import {
  ART_KEYS_BY_GAME,
  type ArtKeyEntry,
  type IdleScheduler,
  type PrewarmController,
  type PrewarmEntry,
  type PrewarmProgress,
  recencyFirstOrder,
  type StartArtPrewarmOptions,
  type StartPrewarmOptions,
  startArtPrewarm,
  startPrewarm,
} from "./prewarm";

/**
 * Delay between the Hub entrance and the first prewarm idle request (ms). Long
 * enough that the entrance fade and zoom finish before any chunk is fetched,
 * short enough that a child who hesitates still finds warmed chunks.
 */
export const PREWARM_START_DELAY = 1200;

/**
 * Tile identity the prewarm needs: the scene key whose chunk warms and the
 * game id that orders it. Structural so tests pass plain fakes.
 */
export interface HubPrewarmTile {
  readonly sceneKey: string;
  readonly gameId: string;
}

/**
 * Pending entrance-delay handle. The structural subset of
 * `Phaser.Time.TimerEvent` the pass touches, so tests pass fakes.
 */
export interface HubPrewarmTimer {
  remove(): void;
}

/**
 * Engine handles the HubScene owns and passes in. The controller owns
 * selection, gates, and pass lifecycle (entries, sync/start/cancel/restart,
 * the art raster queue, and the pass generation); the scene owns everything
 * Phaser-bound or stored (timers, textures, the loader, visibility, gates).
 */
export interface HubPrewarmDeps {
  /** Hub tiles in grid order: the recency tie-breaker and entry source. */
  readonly tiles: readonly HubPrewarmTile[];
  /** Chunk loaders keyed by scene key (`sceneRegistry.sceneLoaders`). Read lazily
   * at pass time, never at construction: a host or test double may expose a
   * registry without one, and construction must not touch it. */
  getSceneLoaders(): Record<string, () => Promise<unknown>>;
  /** Active-profile progress provider, read at every pass start. */
  getProgress(): PrewarmProgress;
  /** True while the play-time lock holds (the pass must not run). */
  isTimeUp(): boolean;
  /** True while a game launch is in flight (the tap owns the fetch). */
  isLaunching(): boolean;
  /** True while the page is backgrounded (imports buy nothing there). */
  isHidden(): boolean;
  /** Resolves the SVG markup behind one art key, if its group knows it. */
  resolveArtSvg(entry: ArtKeyEntry): Promise<string | undefined>;
  /** True when `key` already lives in the game-wide TextureManager. */
  isPresent(key: string): boolean;
  /** Queues one rasterized key on the scene loader at the key's tier. */
  queueSvg(entry: ArtKeyEntry, dataUri: string): void;
  /** Subscribes `done` to the loader settling (completion and failure). */
  onLoadSettled(done: () => void): void;
  /** Unsubscribes a `done` previously added with `onLoadSettled`. */
  offLoadSettled(done: () => void): void;
  /** Starts the scene loader after queueing a key. */
  startLoad(): void;
  /** Arms the post-entrance start; mirrors `time.delayedCall`. */
  delayStart(ms: number, callback: () => void): HubPrewarmTimer;
  /** Chunk-pass starter; defaults to the prewarm engine. */
  startChunkPass?(options: StartPrewarmOptions): PrewarmController;
  /** Art-pass starter; defaults to the prewarm engine. */
  startRasterPass?(options: StartArtPrewarmOptions): PrewarmController;
  /** Idle scheduler for the chunk pass; defaults to the platform scheduler. */
  chunkScheduler?: IdleScheduler;
  /** Idle scheduler for the art pass; defaults to the platform scheduler. */
  artScheduler?: IdleScheduler;
  /** Per-game art key lists; defaults to `ART_KEYS_BY_GAME` by reference. */
  keysByGame?: Readonly<Record<string, readonly ArtKeyEntry[]>>;
}

/**
 * Prewarm orchestration: recency-first entry selection, run gates, pass
 * sync/start/cancel/restart, and the art raster queue. The HubScene keeps
 * only delegation plus the engine handles the deps close over; this
 * controller owns the pending timer, both pass controllers, the
 * already-imported/already-queued sets shared across passes (and visits), and
 * the art pass generation that drops stale resolutions.
 */
export interface HubPrewarmController {
  /** Arms a pass when one may run, stops whatever is pending otherwise. */
  syncPrewarm(): void;
  /** Stops the pass: drops the timer and both passes, bumps the generation. */
  cancelPrewarm(): void;
  /** Stops both passes and starts fresh ones with a re-derived order. */
  restartPrewarm(): void;
}

/**
 * Creates the prewarm orchestration controller. Zero behavior change from the
 * HubScene wiring it replaces: the same entrance delay, the same gates, the
 * same shared sets, and the same generation guard around queued art keys.
 */
export function createHubPrewarm(deps: HubPrewarmDeps): HubPrewarmController {
  const keysByGame = deps.keysByGame ?? ART_KEYS_BY_GAME;
  const beginChunks = deps.startChunkPass ?? startPrewarm;
  const beginRaster = deps.startRasterPass ?? startArtPrewarm;
  /**
   * Chunk keys a pass already imported. Shared across passes — and across
   * visits, since the scene reuses this controller and the module registry
   * outlives a visit — so a restart skips what already landed without spending
   * an idle slot on it (FR-3).
   */
  const imported = new Set<string>();
  /**
   * Art keys the idle pass has already rasterized. Shared across passes — and
   * across visits, like `imported` — so a return trip resumes where the last
   * visit stopped.
   */
  const queued = new Set<string>();
  /** Idle-paced prewarm of the lazy game chunks; absent while stopped. */
  let prewarm: PrewarmController | undefined;
  /** Idle-paced art raster pass; absent while stopped. */
  let artPrewarm: PrewarmController | undefined;
  /** Pending prewarm start, armed once the Hub entrance has settled. */
  let startTimer: HubPrewarmTimer | undefined;
  /**
   * Art pass generation: bumped on every cancel so a key resolution that
   * settles after shutdown, a tap, or a lock queues nothing (FR-5).
   */
  let passId = 0;

  /**
   * Ordered chunk entries for one prewarm pass, recency-first for the active
   * profile. Recency lives in the progress map keyed by game id, while the
   * loaders are keyed by scene key, so the order is derived over the game ids
   * and then mapped to the chunks that have a loader.
   *
   * The progress map is read here, at every pass start, rather than cached, so
   * the order follows the child: returning from a game re-derives with that
   * game first, and a profile switch re-derives for the new profile (FR-1).
   */
  function prewarmEntries(): PrewarmEntry[] {
    const gridOrder = deps.tiles.map((tile) => tile.gameId);
    // Only the games the registry actually has a chunk loader for: a host or a
    // test double may expose a registry without one, and there is nothing to
    // warm then.
    const loaders = deps.getSceneLoaders();
    const warmable = deps.tiles.filter((tile) => tile.sceneKey in loaders);
    const entries: PrewarmEntry[] = [];
    for (const gameId of recencyFirstOrder(
      deps.getProgress(),
      gridOrder,
      warmable.map((tile) => tile.gameId),
    )) {
      const tile = warmable.find((candidate) => candidate.gameId === gameId);
      if (!tile) continue;
      entries.push({ key: tile.sceneKey, load: loaders[tile.sceneKey] });
    }
    return entries;
  }

  /**
   * True while the prewarm may run. The play-time lock outranks it — a locked
   * Hub is not a place a child can start a game from, so warming chunks there
   * buys nothing — and a backgrounded page or a launch in flight has the same
   * answer (FR-2).
   */
  function canPrewarm(): boolean {
    return !deps.isTimeUp() && !deps.isLaunching() && !deps.isHidden();
  }

  /** Starts one pass over the chunks that have not landed yet. */
  function startPrewarmPass(): void {
    if (!canPrewarm() || prewarm) return;
    prewarm = beginChunks({
      entries: prewarmEntries(),
      imported,
      scheduler: deps.chunkScheduler,
    });
  }

  /**
   * Starts one art-raster pass over the keys the TextureManager still lacks.
   * The engine probes `isPresent` on every tick, so keys a previous visit
   * rasterized — or a game scene itself loaded — are skipped without queueing.
   * Never touches the art loading cue: prewarm only fills the TextureManager,
   * and the game scene's own `preload` owns the cue when entered for real.
   */
  function startArtPass(): void {
    if (!canPrewarm() || artPrewarm) return;
    const id = passId;
    artPrewarm = beginRaster({
      keysByGame,
      gridOrder: deps.tiles.map((tile) => tile.gameId),
      getProgress: deps.getProgress,
      queued,
      isPresent: (key) => deps.isPresent(key),
      queueKey: (entry) => queueArtKey(entry, id),
      scheduler: deps.artScheduler,
    });
  }

  /**
   * Rasterizes one art key through the Hub loader at the texture tier the key
   * would load at in its game scene, then settles once the loader reports the
   * file done — so the engine paces the next key a tick at a time. Resolves
   * without queueing when the key landed meanwhile, when its markup cannot be
   * resolved, or when the pass was cancelled while resolving (FR-5).
   */
  function queueArtKey(entry: ArtKeyEntry, id: number): Promise<void> {
    return new Promise<void>((resolve) => {
      void deps.resolveArtSvg(entry).then((svg) => {
        if (id !== passId || svg === undefined || deps.isPresent(entry.key)) {
          resolve();
          return;
        }
        const done = (): void => {
          deps.offLoadSettled(done);
          resolve();
        };
        deps.onLoadSettled(done);
        deps.queueSvg(entry, toDataUri(svg));
        deps.startLoad();
      });
    });
  }

  function cancelPrewarm(): void {
    startTimer?.remove();
    startTimer = undefined;
    prewarm?.cancel();
    prewarm = undefined;
    artPrewarm?.cancel();
    artPrewarm = undefined;
    passId += 1;
  }

  /**
   * Brings the prewarm in line with the current gates: arms a pass when one
   * may run and none is pending, stops whatever is pending otherwise. The
   * chunk and art passes share the one entrance timer and the same gates, so
   * both queues pause under the arc/moon lock or a hidden tab and resume
   * together. Safe to call at any point in the scene's life, including before
   * `create()` has armed the entrance delay.
   */
  function syncPrewarm(): void {
    if (!canPrewarm()) {
      cancelPrewarm();
      return;
    }
    if (prewarm || startTimer) return;
    // The first idle request waits out the entrance so the fade and zoom keep
    // their frames; each pass still imports or rasterizes only in idle slots
    // (NFR-2).
    startTimer = deps.delayStart(PREWARM_START_DELAY, () => {
      startTimer = undefined;
      startPrewarmPass();
      startArtPass();
    });
  }

  /**
   * Stops both passes and starts fresh ones, so pending work takes a new order.
   */
  function restartPrewarm(): void {
    cancelPrewarm();
    startPrewarmPass();
    startArtPass();
  }

  return { syncPrewarm, cancelPrewarm, restartPrewarm };
}
