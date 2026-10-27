import Phaser from "phaser";
import { AudioManager } from "../audio/AudioManager";
import { createGameLoadCue } from "../components/GameLoadCue";
import { ParentLock } from "../components/ParentLock";
import type { PlayTimeNudge } from "../components/PlayTimeIndicator";
import { ProfileChip } from "../components/ProfileChip";
import { PwaToasts } from "../components/PwaToasts";
import { SettingsPanel } from "../components/SettingsPanel";
import { createArtResolver } from "../game/hub/artGroups";
import {
  createGameLaunch,
  type GameLaunchController,
  type GameLaunchCue,
} from "../game/hub/gameLaunch";
import { createHubAttract, type HubAttractController } from "../game/hub/hubAttract";
import { createHubPrewarm, type HubPrewarmController } from "../game/hub/hubPrewarm";
import {
  createPlayTimeUi,
  isDocumentHidden,
  type PlayTimeUiController,
} from "../game/hub/playTimeUi";
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
  /**
   * Idle attract and decor owned by `src/game/hub/hubAttract.ts`. The scene
   * keeps only this delegation: the module owns the mascot, the idle timer,
   * and the decorations.
   */
  private readonly attract: HubAttractController;
  /**
   * Play-time UI owned by `src/game/hub/playTimeUi.ts`. The scene keeps only
   * this delegation: the module owns the lock flag, the indicator graphics,
   * the nudge, and the visibility hook.
   */
  private readonly playTime: PlayTimeUiController;
  /** Profile chip + picker: active avatar, switch UI (top-left, kid-tappable). */
  private profileChip: ProfileChip;
  /** PWA lifecycle toast wiring (update/offline). */
  private pwaToasts: PwaToasts;
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
        this.playTime.refreshPlayTimeState();
        // The order is recency-first for the active profile, so a switch
        // re-derives the work still pending (spec: profile switch mid-cycle).
        this.restartPrewarm();
      },
    });
    this.pwaToasts = new PwaToasts(this);
    this.attract = createHubAttract({
      scene: this,
      getAttractTargets: () => this.grid.attractTargets,
      playIdleCall: () => AudioManager.getInstance().playIdleCall(),
      isReducedMotion: () => isReducedMotion(),
    });
    this.playTime = createPlayTimeUi({
      scene: this,
      applyTimeUpLock: () => this.grid.applyTimeUpLock(),
      restoreTiles: () => this.grid.restoreTiles(),
      waveMascot: () => this.attract.waveMascot(),
      syncPrewarm: () => this.syncPrewarm(),
      launchTile: (tileIndex) => transitionToScene(this, GAME_TILES[tileIndex].sceneKey),
    });
    this.grid = new HubGrid({
      scene: this,
      isTimeUp: () => this.playTime.isTimeUp(),
      activateTile: (tileIndex, tile) => this.activateTile(tileIndex, tile),
      onUserGesture: () => this.attract.resetIdleAttract(),
      gestureBlocked: () => Boolean(this.profileChip.isOpen() || this.settingsPanel),
      onBoardChange: () => this.hideLoadCue(),
    });
    this.launcher = createGameLaunch({
      tiles: GAME_TILES,
      loadScene: (sceneKey) => loadSceneWithRetry(this, sceneKey),
      cancelPrewarm: () => this.cancelPrewarm(),
      syncPrewarm: () => this.syncPrewarm(),
      isTimeUp: () => this.playTime.isTimeUp(),
      setNavLocked: (locked) => {
        this.grid.navLocked = locked;
      },
      startSession: (profileId) => startPlaySession(profileId),
      recordPlay: (gameId) => recordGamePlay(gameId),
      getActiveProfileId: () => getActiveProfile().id,
      getPlayTime: () => getPlayTime(),
      transition: (sceneKey) => transitionToScene(this, sceneKey),
      showNudge: (tileIndex) => this.playTime.showPlayTimeNudge(tileIndex),
      createCue: () => createGameLoadCue(this),
      getFallbackCenter: () => ({
        x: this.cameras.main.width / 2,
        y: this.cameras.main.height / 2,
      }),
      startAudio: () => this.startAudioFn(),
    });
    this.prewarmer = createHubPrewarm({
      tiles: GAME_TILES,
      getSceneLoaders: () => sceneLoaders,
      getProgress,
      isTimeUp: () => this.playTime.isTimeUp(),
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
    this.attract.resetForVisit();
    this.playTime.beginVisit();
    // A new visit: a launch still in flight belongs to the previous one, and
    // its resolution must not act on this one. The launcher bumps its visit
    // token, drops the in-flight flag, and destroys the retry cue.
    this.launcher.beginVisit();
    // Likewise a prewarm: the shutdown handler already drops it, but a visit
    // must never inherit the previous one's pass even if that handler did not
    // run (NFR-6).
    this.cancelPrewarm();
    // Phaser reuses this instance across visits (auto-return re-runs create()),
    // so clear the launch guard or every tile tap after the first game is dead.
    this.grid.resetForVisit();
    this.grid.justEarned = this.justEarned;

    // Account for the play session that ended when the game scene returned.
    const ended = endPlaySession();
    if (ended) {
      recordPlayTime(ended.profileId, ended.minutes);
    }

    this.attract.createMascot(this.justEarned);

    if (!reducedMotion) {
      this.attract.createDecorations();
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

    this.playTime.createPlayTimeIndicator();

    this.input.on("pointerdown", () => {
      // Any first interaction unlocks audio so the idle-attract cue is
      // audible on a fresh load (the tile tap already resumes + starts BGM).
      unlockSpeechForUserGesture();
      AudioManager.getInstance().resume();
      this.attract.resetIdleAttract();
    });
    this.attract.scheduleIdleAttract();
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
          this.playTime.refreshPlayTimeState();
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
      this.playTime.destroy();
      // A prewarm belongs to the visit that armed it: drop its pending idle
      // slot so nothing imports for a Hub nobody is looking at (FR-5).
      this.cancelPrewarm();
      this.attract.destroy();
      this.grid.destroy();
      // Detach the viewport listener so a resize while the scene is inactive
      // cannot rebuild a dead scene's objects.
      this.scale?.off("resize", this.grid.handleViewportChange, this.grid);
    });

    // Registered after the cleanup above so the first shutdown handler stays
    // the scene teardown; this one only detaches the page-visibility hook.
    this.playTime.watchPlayTimeVisibility();
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
   * Test-compat reads: the cue and nudge live in the extracted launch and
   * play-time controllers, but scene suites inspect them via cast
   * (`hubSceneLoad.test.ts`). These getters preserve the pre-split surface.
   */
  get loadCue(): GameLaunchCue | undefined {
    return this.launcher.cue;
  }

  get nudge(): PlayTimeNudge {
    return this.playTime.nudge;
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
}
