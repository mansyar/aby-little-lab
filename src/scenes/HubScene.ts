import Phaser from "phaser";
import { AudioManager } from "../audio/AudioManager";
import { createGameLoadCue } from "../components/GameLoadCue";
import { createCornerMascot, type Mascot } from "../components/Mascot";
import { ParentLock } from "../components/ParentLock";
import { createPlayTimeIndicator, PlayTimeNudge } from "../components/PlayTimeIndicator";
import { ProfileChip } from "../components/ProfileChip";
import { PwaToasts } from "../components/PwaToasts";
import { SettingsPanel } from "../components/SettingsPanel";
import { createArtResolver } from "../game/hub/artGroups";
import { createGameLaunch, type GameLaunchController } from "../game/hub/gameLaunch";
import {
  ART_KEYS_BY_GAME,
  type ArtKeyEntry,
  type PrewarmController,
  type PrewarmEntry,
  recencyFirstOrder,
  startArtPrewarm,
  startPrewarm,
} from "../game/hub/prewarm";
import { HubGrid } from "../game/hubGrid";
import { GAME_TILES } from "../game/hubTiles";
import { endPlaySession, startPlaySession } from "../game/playTimeLogic";
import { isReducedMotion } from "../utils/motion";
import { attachPressFeedback } from "../utils/pressFeedback";
import { sceneEntrance, transitionToScene } from "../utils/sceneTransitions";
import { unlockSpeechForUserGesture } from "../utils/speech";
import {
  getActiveProfile,
  getPlayTime,
  getProgress,
  recordGamePlay,
  recordPlayTime,
} from "../utils/storage";
import { toDataUri } from "../utils/svgDataUri";
import { textStyle } from "../utils/typography";
import { loadSceneWithRetry, sceneLoaders } from "./sceneRegistry";

/** Number of background decorations. */
const DECORATION_COUNT = 4;
/** Radius of background decoration dots (px). */
const DECORATION_RADIUS = 10;
/** Low-contrast color for background decorations. */
const DECORATION_COLOR = 0xe8e0d0;
/** Vertical drift distance for decorations (px). */
const DECORATION_DRIFT = 16;
/** Slowest decoration drift loop (ms). */
const DECORATION_DRIFT_MIN = 4000;
/** Fastest decoration drift loop (ms). */
const DECORATION_DRIFT_MAX = 6000;
/** Idle time without input before the attract cue starts (ms). */
const IDLE_ATTRACT_DELAY = 25000;
/** Interval between idle calls while attract is active (ms). */
const IDLE_CALL_INTERVAL = 10000;
/**
 * Delay between the Hub entrance and the first prewarm idle request (ms). Long
 * enough that the entrance fade and zoom finish before any chunk is fetched,
 * short enough that a child who hesitates still finds warmed chunks.
 */
const PREWARM_START_DELAY = 1200;
/** Wiggle amplitude for the attract cue (degrees). */
const WIGGLE_ANGLE = 4;
/** Duration of one wiggle swing (ms). */
const WIGGLE_DURATION = 350;
/** Phase offset between tile wiggles (ms). */
const WIGGLE_PHASE_OFFSET = 120;
/** How many tiles wiggle during an attract cue (rotating pick). */
const ATTRACT_WIGGLE_COUNT = 2;

/**
 * True where the document exposes a visibility state. Mirrors the play-time
 * module's guard so a headless host (no document, or no `visibilityState`)
 * stays inert instead of throwing on the visibility hook.
 */
function canObserveVisibility(): boolean {
  return typeof document !== "undefined" && typeof document.visibilityState === "string";
}

/**
 * True only where the document reports itself hidden. Built on the same guard
 * as `canObserveVisibility`, so a host with no visibility surface counts as
 * visible and keeps the prewarm active instead of silently disabling it.
 */
function isDocumentHidden(): boolean {
  return canObserveVisibility() && document.visibilityState === "hidden";
}

/**
 * Hub scene — the central navigation hub.
 *
 * Displays a grid of 22 game tiles, a sticker book showing earned stickers,
 * and a settings button gated behind a parental lock.
 */
export class HubScene extends Phaser.Scene {
  private parentLock?: ParentLock;
  private settingsPanel?: SettingsPanel;
  /** Game id whose sticker was just earned; highlighted on this visit. */
  private justEarned?: string;
  /** Pending idle-attract timer. */
  private idleCallTimer?: Phaser.Time.TimerEvent;
  /** True once the attract cue has started for the current idle period. */
  private idleAttractActive = false;
  /** Rotates which tiles are picked for each idle-attract wiggle. */
  private attractWiggleTick = 0;
  /** Professor Hoot, the friendly teacher mascot. */
  private mascot?: Mascot;
  /** Profile chip + picker: active avatar, switch UI (top-left, kid-tappable). */
  private profileChip: ProfileChip;
  /** PWA lifecycle toast wiring (update/offline). */
  private pwaToasts: PwaToasts;
  /** True while the active profile's daily play-time limit is reached. */
  private timeUp = false;
  /** Play-time indicator (hint arc or moon badge) for the active profile. */
  private playTimeGraphics?: Phaser.GameObjects.Graphics;
  /** True while the pre-game nudge overlay is showing. */
  private nudge = new PlayTimeNudge();
  /**
   * Game-launch flow owned by `src/game/hub/gameLaunch.ts`. The scene keeps
   * only this delegation plus the `loadCue` compat accessor below: the module
   * owns the single-flight flag, the visit token, and the retry cue, while the
   * scene owns the engine handles the launcher's deps close over.
   */
  private readonly launcher: GameLaunchController;
  /**
   * Idle-paced prewarm of the lazy game chunks; absent while the pass is
   * stopped (locked, hidden, launching, or shut down).
   */
  private prewarm?: PrewarmController;
  /** Pending prewarm start, armed once the Hub entrance has settled. */
  private prewarmStartTimer?: Phaser.Time.TimerEvent;
  /**
   * Idle-paced art raster pass; armed and cancelled alongside the chunk pass
   * so both queues share the entrance, lock, and visibility gates (FR-2).
   * Absent while the pass is stopped.
   */
  private artPrewarm?: PrewarmController;
  /**
   * Art keys the idle pass has already rasterized. Shared across passes —
   * and across visits, like `warmedChunks` — so a return trip resumes where
   * the last visit stopped.
   */
  private readonly artQueued = new Set<string>();
  /**
   * Resolves game-art SVG markup through the lazily loaded art tables owned by
   * `src/game/hub/artGroups.ts`. The scene keeps only this delegation: the
   * module owns the tables, loaders, and caches, while the scene owns the
   * `textures`/`load` engine handles and the pass generation (`artPassId`).
   */
  private readonly artResolver = createArtResolver();
  /**
   * Art pass generation: bumped on every cancel so a key resolution that
   * settles after shutdown, a tap, or a lock queues nothing (FR-5).
   */
  private artPassId = 0;
  /**
   * Chunk keys a prewarm pass already imported. Shared across passes — and
   * across visits, since Phaser reuses this instance and the module registry
   * outlives a visit — so a restart skips what already landed without spending
   * an idle slot on it (FR-3).
   */
  private readonly prewarmImported = new Set<string>();
  /** Audio unlock/start closure captured from create() for tap handlers. */
  private startAudioFn: () => void = () => {};
  /**
   * Document-visibility handler: re-reads the budget when the page returns to
   * the foreground and parks the chunk prewarm while it is in the background.
   * A field so the shutdown hook can remove the exact reference create()
   * attached.
   */
  private handleVisibilityChange = (): void => {
    if (document.visibilityState === "visible") {
      this.refreshPlayTimeState();
      return;
    }
    // Background imports buy the child nothing and cost battery, so the pass
    // stops here; the foreground return above re-arms it (FR-2).
    this.syncPrewarm();
  };
  /** Tile-grid renderer: layouts, page dots, swipes and the sticker shelf. */
  private grid: HubGrid;

  constructor() {
    super({ key: "Hub" });
    this.profileChip = new ProfileChip({
      scene: this,
      onOpen: () => {
        // The picker is the Hub's front-most surface: a retry cue must not
        // survive behind it (FR-6).
        this.hideLoadCue();
        this.startAudioFn();
      },
      onSwitch: () => {
        this.grid.rerenderStickerShelf();
        this.refreshPlayTimeState();
        // The order is recency-first for the active profile, so a switch
        // re-derives the work still pending (spec: profile switch mid-cycle).
        this.restartPrewarm();
      },
    });
    this.pwaToasts = new PwaToasts(this);
    this.grid = new HubGrid({
      scene: this,
      isTimeUp: () => this.timeUp,
      activateTile: (tileIndex, tile) => this.activateTile(tileIndex, tile),
      onUserGesture: () => this.resetIdleAttract(),
      gestureBlocked: () => Boolean(this.profileChip.isOpen() || this.settingsPanel),
      onBoardChange: () => this.hideLoadCue(),
    });
    this.launcher = createGameLaunch({
      tiles: GAME_TILES,
      loadScene: (sceneKey) => loadSceneWithRetry(this, sceneKey),
      cancelPrewarm: () => this.cancelPrewarm(),
      syncPrewarm: () => this.syncPrewarm(),
      isTimeUp: () => this.timeUp,
      setNavLocked: (locked) => {
        this.grid.navLocked = locked;
      },
      startSession: (profileId) => startPlaySession(profileId),
      recordPlay: (gameId) => recordGamePlay(gameId),
      getActiveProfileId: () => getActiveProfile().id,
      getPlayTime: () => getPlayTime(),
      transition: (sceneKey) => transitionToScene(this, sceneKey),
      showNudge: (tileIndex) => this.showPlayTimeNudge(tileIndex),
      createCue: () => createGameLoadCue(this),
      getFallbackCenter: () => ({
        x: this.cameras.main.width / 2,
        y: this.cameras.main.height / 2,
      }),
      startAudio: () => this.startAudioFn(),
    });
  }

  init(data?: { justEarned?: string }): void {
    this.justEarned = data?.justEarned;
  }

  create(): void {
    sceneEntrance(this);
    const reducedMotion = isReducedMotion();
    this.idleAttractActive = false;
    this.timeUp = false;
    // A new visit: a launch still in flight belongs to the previous one, and
    // its resolution must not act on this one. The launcher bumps its visit
    // token, drops the in-flight flag, and destroys the retry cue.
    this.launcher.beginVisit();
    // Likewise a prewarm: the shutdown handler already drops it, but a visit
    // must never inherit the previous one's pass even if that handler did not
    // run (NFR-6).
    this.cancelPrewarm();
    this.nudge = new PlayTimeNudge();
    // Phaser reuses this instance across visits (auto-return re-runs create()),
    // so clear the launch guard or every tile tap after the first game is dead.
    this.grid.resetForVisit();
    this.grid.justEarned = this.justEarned;

    // Account for the play session that ended when the game scene returned.
    const ended = endPlaySession();
    if (ended) {
      recordPlayTime(ended.profileId, ended.minutes);
    }

    this.createMascot();

    if (!reducedMotion) {
      this.createDecorations();
    }

    const startAudio = (): void => {
      // First gesture in the session also unlocks iOS/WebKit speech (a silent
      // warm-up utterance), otherwise programmatic TTS is silently dropped.
      unlockSpeechForUserGesture();
      const audio = AudioManager.getInstance();
      audio.resume();
      audio.playBGM();
    };
    this.startAudioFn = startAudio;

    // Narrow viewports (phones) get the paged 5x2 grid of larger tiles so
    // every tile stays above the 64px touch floor after FIT scaling; wide
    // viewports keep the classic 5x4 grid exactly as before. A later resize
    // that flips the classification rebuilds the grid (handleViewportChange).
    this.grid.hubPage = 0;
    this.grid.classifyViewport();
    if (this.grid.paged) {
      this.grid.createPageDots();
      this.grid.wireSwipeGestures();
      this.grid.buildPageGrid(0);
    } else {
      this.grid.buildWideGrid();
    }
    this.scale.on("resize", this.grid.handleViewportChange, this.grid);

    this.createPlayTimeIndicator();

    this.input.on("pointerdown", () => {
      // Any first interaction unlocks audio so the idle-attract cue is
      // audible on a fresh load (the tile tap already resumes + starts BGM).
      unlockSpeechForUserGesture();
      AudioManager.getInstance().resume();
      this.resetIdleAttract();
    });
    this.scheduleIdleAttract();
    // Armed with the rest of the post-entrance flow, never inside
    // `sceneEntrance`: the pass imports only in idle slots, so the entrance's
    // fade and zoom keep their frames (NFR-2).
    this.syncPrewarm();

    const settingsButton = this.add.text(
      this.cameras.main.width - 20,
      20,
      "Settings",
      textStyle({
        fontSize: "18px",
        color: "#2d3748",
      }),
    );
    settingsButton.setOrigin(1, 0);
    settingsButton.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(0, 0, 96, 96),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    });

    this.parentLock = new ParentLock({
      scene: this,
      target: settingsButton,
      onSuccess: () => {
        // Settings owns the screen once the lock opens: drop the retry cue so
        // it cannot outlive the Hub's front-most surface (FR-6).
        this.hideLoadCue();
        this.settingsPanel?.destroy();
        this.settingsPanel = new SettingsPanel(this, undefined, () => {
          this.grid.rerenderStickerShelf();
          this.profileChip.refresh();
          this.refreshPlayTimeState();
        });
      },
      onFailure: () => {
        // No action needed on failure.
      },
    });
    attachPressFeedback(settingsButton);
    settingsButton.on("pointerdown", startAudio);

    this.profileChip.create();

    this.pwaToasts.wire();

    this.events.on("shutdown", () => {
      // From here on a load in flight resolves against a dead visit; end it
      // before anything else so a late `openGame` continuation stops early.
      this.launcher.endVisit();
      this.pwaToasts.destroy();
      this.parentLock?.destroy();
      this.settingsPanel?.destroy();
      this.settingsPanel = undefined;
      this.profileChip.destroy();
      this.playTimeGraphics?.destroy();
      this.playTimeGraphics = undefined;
      this.idleCallTimer?.remove();
      this.idleCallTimer = undefined;
      // A prewarm belongs to the visit that armed it: drop its pending idle
      // slot so nothing imports for a Hub nobody is looking at (FR-5).
      this.cancelPrewarm();
      this.mascot?.destroy();
      this.mascot = undefined;
      this.grid.destroy();
      // Detach the viewport listener so a resize while the scene is inactive
      // cannot rebuild a dead scene's objects.
      this.scale?.off("resize", this.grid.handleViewportChange, this.grid);
    });

    // Registered after the cleanup above so the first shutdown handler stays
    // the scene teardown; this one only detaches the page-visibility hook.
    this.watchPlayTimeVisibility();
  }

  /**
   * Activates a tile after the grid's tap guards pass. Delegates to the launch
   * flow owned by `src/game/hub/gameLaunch.ts`; the audio unlock stays on the
   * gesture that triggered it (see `GameLaunchDeps.startAudio`).
   */
  private activateTile(tileIndex: number, tile?: Phaser.GameObjects.Rectangle): void {
    this.launcher.activateTile(tileIndex, tile);
  }

  /** Removes the retry cue, if one is up. Safe to call at any time. */
  private hideLoadCue(): void {
    this.launcher.hideLoadCue();
  }

  /**
   * Creates the play-time indicator for the active profile: a hint arc under
   * the grid while time remains (warm when 5 minutes or fewer are left), or a
   * textless moon badge with dimmed, locked tiles once the daily limit is
   * reached. No-op when the profile has no limit set.
   *
   * `wasTimeUp` is the lock state before the refresh that called this, so the
   * mascot waves once when the cap is first reached rather than on every
   * foreground return the cap is re-read on. The lock itself is applied
   * unconditionally — the visuals must converge whatever the call site.
   */
  private createPlayTimeIndicator(wasTimeUp = false): void {
    this.playTimeGraphics =
      createPlayTimeIndicator({
        scene: this,
        onLimitReached: () => {
          this.timeUp = true;
          this.grid.applyTimeUpLock();
          if (!wasTimeUp) {
            this.mascot?.wave();
          }
        },
      }) ?? undefined;
  }

  /**
   * Rebuilds the play-time indicator and tile lock state after a profile
   * switch or a parental settings change.
   */
  private refreshPlayTimeState(): void {
    this.playTimeGraphics?.destroy();
    this.playTimeGraphics = undefined;
    const wasTimeUp = this.timeUp;
    if (this.timeUp) {
      this.grid.restoreTiles();
      this.timeUp = false;
    }
    this.createPlayTimeIndicator(wasTimeUp);
    // The lock can arrive or clear with this refresh, so the prewarm follows it
    // in both directions: no imports while locked, a fresh pass once it clears
    // (FR-2).
    this.syncPrewarm();
  }

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
  private prewarmEntries(): PrewarmEntry[] {
    const gridOrder = GAME_TILES.map((tile) => tile.gameId);
    // Only the games the registry actually has a chunk loader for: a host or a
    // test double may expose a registry without one, and there is nothing to
    // warm then.
    const warmable = GAME_TILES.filter((tile) => tile.sceneKey in sceneLoaders);
    const entries: PrewarmEntry[] = [];
    for (const gameId of recencyFirstOrder(
      getProgress(),
      gridOrder,
      warmable.map((tile) => tile.gameId),
    )) {
      const tile = warmable.find((candidate) => candidate.gameId === gameId);
      if (!tile) continue;
      entries.push({ key: tile.sceneKey, load: sceneLoaders[tile.sceneKey] });
    }
    return entries;
  }

  /**
   * True while the prewarm may run. The play-time lock outranks it — a locked
   * Hub is not a place a child can start a game from, so warming chunks there
   * buys nothing — and a backgrounded page or a launch in flight has the same
   * answer (FR-2).
   */
  private canPrewarm(): boolean {
    return !this.timeUp && !this.launcher.isLaunching() && !isDocumentHidden();
  }

  /**
   * Brings the prewarm in line with the current gates: arms a pass when one may
   * run and none is pending, stops whatever is pending otherwise. The chunk and
   * art passes share the one entrance timer and the same gates, so both queues
   * pause under the arc/moon lock or a hidden tab and resume together. Safe to
   * call at any point in the scene's life, including before `create()` has
   * armed the entrance delay.
   */
  private syncPrewarm(): void {
    if (!this.canPrewarm()) {
      this.cancelPrewarm();
      return;
    }
    if (this.prewarm || this.prewarmStartTimer) return;
    // The first idle request waits out the entrance so the fade and zoom keep
    // their frames; each pass still imports or rasterizes only in idle slots
    // (NFR-2).
    this.prewarmStartTimer = this.time.delayedCall(PREWARM_START_DELAY, () => {
      this.prewarmStartTimer = undefined;
      this.startPrewarmPass();
      this.startArtPass();
    });
  }

  /** Starts one pass over the chunks that have not landed yet. */
  private startPrewarmPass(): void {
    if (!this.canPrewarm() || this.prewarm) return;
    this.prewarm = startPrewarm({
      entries: this.prewarmEntries(),
      imported: this.prewarmImported,
    });
  }

  /**
   * Starts one art-raster pass over the keys the TextureManager still lacks.
   * The engine probes `isPresent` on every tick, so keys a previous visit
   * rasterized — or a game scene itself loaded — are skipped without queueing.
   * Never touches the art loading cue: prewarm only fills the TextureManager,
   * and the game scene's own `preload` owns the cue when entered for real.
   */
  private startArtPass(): void {
    if (!this.canPrewarm() || this.artPrewarm) return;
    const passId = this.artPassId;
    this.artPrewarm = startArtPrewarm({
      keysByGame: ART_KEYS_BY_GAME,
      gridOrder: GAME_TILES.map((tile) => tile.gameId),
      getProgress,
      queued: this.artQueued,
      isPresent: (key) => this.textures.exists(key),
      queueKey: (entry) => this.queueArtKey(entry, passId),
    });
  }

  /**
   * Resolves the SVG markup behind one art key through the art-group tables in
   * `src/game/hub/artGroups.ts`. An unknown key resolves to `undefined` so the
   * pass skips it instead of queueing a load the TextureManager could never
   * satisfy.
   */
  private resolveArtSvg(entry: ArtKeyEntry): Promise<string | undefined> {
    return this.artResolver.resolveArtSvg(entry);
  }

  /**
   * Rasterizes one art key through the Hub loader at the texture tier the key
   * would load at in its game scene, then settles once the loader reports the
   * file done — so the engine paces the next key a tick at a time. Resolves
   * without queueing when the key landed meanwhile, when its markup cannot be
   * resolved, or when the pass was cancelled while resolving (FR-5).
   */
  private queueArtKey(entry: ArtKeyEntry, passId: number): Promise<void> {
    return new Promise<void>((resolve) => {
      void this.resolveArtSvg(entry).then((svg) => {
        if (passId !== this.artPassId || svg === undefined || this.textures.exists(entry.key)) {
          resolve();
          return;
        }
        const done = (): void => {
          this.load.off("complete", done);
          this.load.off("loaderror", done);
          resolve();
        };
        this.load.on("complete", done);
        this.load.on("loaderror", done);
        this.load.svg(entry.key, toDataUri(svg), { width: entry.size, height: entry.size });
        this.load.start();
      });
    });
  }

  /**
   * Stops the prewarm: drops the pending idle slots and the entrance delay,
   * and discards an in-flight chunk import or art raster's result. Safe when
   * nothing is armed or running, which is why every gate and every tap can call
   * it unconditionally.
   */
  private cancelPrewarm(): void {
    this.prewarmStartTimer?.remove();
    this.prewarmStartTimer = undefined;
    this.prewarm?.cancel();
    this.prewarm = undefined;
    this.artPrewarm?.cancel();
    this.artPrewarm = undefined;
    this.artPassId += 1;
  }

  /**
   * Stops both passes and starts fresh ones, so pending work takes a new order.
   */
  private restartPrewarm(): void {
    this.cancelPrewarm();
    this.startPrewarmPass();
    this.startArtPass();
  }

  /**
   * Refreshes the limit visuals when the page becomes visible again, so a Hub
   * parked across midnight (or behind a limit change) tells the truth without
   * a reload. The browser event is the only trigger — no timer, no polling —
   * and the shutdown hook detaches the handler so repeated Hub creates cannot
   * stack listeners.
   */
  private watchPlayTimeVisibility(): void {
    if (!canObserveVisibility()) return;
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
    this.events.once("shutdown", () => {
      document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    });
  }

  /**
   * Shows a textless nudge (dim overlay + hourglass) for NUDGE_DELAY ms before
   * launching the game — a soft "almost done" signal without harsh cutoffs.
   * The chunk is already registered by `openGame`, so the nudge starts the fade
   * directly: a second load — or a second play session — would charge twice.
   */
  private showPlayTimeNudge(tileIndex: number): void {
    this.nudge.show(
      { scene: this, onLaunch: (i) => transitionToScene(this, GAME_TILES[i].sceneKey) },
      tileIndex,
    );
  }

  /**
   * Places Professor Hoot in the bottom-right corner: greets on load, cheers
   * when the visit follows a newly earned sticker, then settles into the idle
   * loop. Touch-inert and behind gameplay z-order by component design.
   */
  private createMascot(): void {
    this.mascot = createCornerMascot(this);
    this.mascot.flapGreeting();
    if (this.justEarned) {
      this.mascot.cheer();
    }
    this.mascot.idleLoop();
  }

  /** Schedules the next idle-attract check after the given delay. */
  private scheduleIdleAttract(delay = IDLE_ATTRACT_DELAY): void {
    this.idleCallTimer = this.time.delayedCall(delay, () => {
      this.triggerIdleAttract();
    });
  }

  /** Re-arms the idle timer after any pointer input. */
  private resetIdleAttract(): void {
    this.idleCallTimer?.remove();
    this.scheduleIdleAttract();
  }

  /**
   * Plays the idle call; starts the tile wiggle cue once (skipped under reduced
   * motion); re-arms itself so the call repeats every IDLE_CALL_INTERVAL.
   */
  private triggerIdleAttract(): void {
    if (!this.idleCallTimer) return;
    AudioManager.getInstance().playIdleCall();
    if (!this.idleAttractActive) {
      this.idleAttractActive = true;
      if (!isReducedMotion() && this.grid.attractTargets.length > 0) {
        // Wiggle only a couple of tiles so the cue stays gentle; rotate the
        // pick across the grid on each attract so no tile feels ignored.
        const start = this.attractWiggleTick % this.grid.attractTargets.length;
        for (let i = 0; i < ATTRACT_WIGGLE_COUNT; i++) {
          const tile = this.grid.attractTargets[(start + i) % this.grid.attractTargets.length];
          this.tweens.add({
            targets: tile,
            angle: WIGGLE_ANGLE,
            duration: WIGGLE_DURATION,
            yoyo: true,
            repeat: -1,
            ease: "Sine.inOut",
            delay: i * WIGGLE_PHASE_OFFSET,
          });
        }
        this.attractWiggleTick += 1;
      }
    }
    this.scheduleIdleAttract(IDLE_CALL_INTERVAL);
  }

  /** Creates a few low-contrast dots that drift slowly behind the grid. */
  private createDecorations(): void {
    const driftRange = DECORATION_DRIFT_MAX - DECORATION_DRIFT_MIN;
    const positions: ReadonlyArray<[number, number]> = [
      [this.cameras.main.width * 0.12, this.cameras.main.height * 0.18],
      [this.cameras.main.width * 0.88, this.cameras.main.height * 0.15],
      [this.cameras.main.width * 0.1, this.cameras.main.height * 0.8],
      [this.cameras.main.width * 0.9, this.cameras.main.height * 0.75],
    ];

    for (let i = 0; i < DECORATION_COUNT; i++) {
      const [x, y] = positions[i];
      const dot = this.add.circle(x, y, DECORATION_RADIUS, DECORATION_COLOR);
      dot.setDepth(-1);
      this.tweens.add({
        targets: dot,
        y: y - DECORATION_DRIFT,
        duration: DECORATION_DRIFT_MIN + (i * driftRange) / (DECORATION_COUNT - 1),
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
        delay: i * 300,
      });
    }
  }
}
