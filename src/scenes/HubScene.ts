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
import { createHubPrewarm, type HubPrewarmController } from "../game/hub/hubPrewarm";
import type { ArtKeyEntry } from "../game/hub/prewarm";
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
   * Prewarm orchestration owned by `src/game/hub/hubPrewarm.ts`. The scene
   * keeps only this delegation plus the engine handles the controller's deps
   * close over (timers, textures, loader, gates): the module owns entry
   * selection, gates, and pass lifecycle.
   */
  private readonly prewarmer: HubPrewarmController;
  /**
   * Resolves game-art SVG markup through the lazily loaded art tables owned by
   * `src/game/hub/artGroups.ts`. The scene keeps only this delegation: the
   * module owns the tables, loaders, and caches.
   */
  private readonly artResolver = createArtResolver();
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
    this.prewarmer = createHubPrewarm({
      tiles: GAME_TILES,
      sceneLoaders,
      getProgress,
      isTimeUp: () => this.timeUp,
      isLaunching: () => this.launcher.isLaunching(),
      isHidden: () => isDocumentHidden(),
      resolveArtSvg: (entry) => this.resolveArtSvg(entry),
      isPresent: (key) => this.textures.exists(key),
      queueSvg: (entry, dataUri) =>
        this.load.svg(entry.key, dataUri, { width: entry.size, height: entry.size }),
      onLoadSettled: (done) => {
        this.load.on("complete", done);
        this.load.on("loaderror", done);
      },
      offLoadSettled: (done) => {
        this.load.off("complete", done);
        this.load.off("loaderror", done);
      },
      startLoad: () => this.load.start(),
      delayStart: (ms, callback) => this.time.delayedCall(ms, callback),
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
   * Brings the prewarm in line with the current gates: arms a pass when one may
   * run and none is pending, stops whatever is pending otherwise. Delegates to
   * the orchestration owned by `src/game/hub/hubPrewarm.ts`.
   */
  private syncPrewarm(): void {
    this.prewarmer.syncPrewarm();
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
   * Stops the prewarm: drops the pending idle slots and the entrance delay,
   * and discards an in-flight chunk import or art raster's result. Safe when
   * nothing is armed or running, which is why every gate and every tap can call
   * it unconditionally. Delegates to the orchestration owned by
   * `src/game/hub/hubPrewarm.ts`.
   */
  private cancelPrewarm(): void {
    this.prewarmer.cancelPrewarm();
  }

  /**
   * Stops both passes and starts fresh ones, so pending work takes a new order.
   * Delegates to the orchestration owned by `src/game/hub/hubPrewarm.ts`.
   */
  private restartPrewarm(): void {
    this.prewarmer.restartPrewarm();
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
