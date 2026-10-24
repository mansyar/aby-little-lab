import Phaser from "phaser";
import { AudioManager } from "../audio/AudioManager";
import { createGameLoadCue, type GameLoadCue } from "../components/GameLoadCue";
import { createCornerMascot, type Mascot } from "../components/Mascot";
import { ParentLock } from "../components/ParentLock";
import { createPlayTimeIndicator, PlayTimeNudge } from "../components/PlayTimeIndicator";
import { ProfileChip } from "../components/ProfileChip";
import { PwaToasts } from "../components/PwaToasts";
import { SettingsPanel } from "../components/SettingsPanel";
import { HubGrid } from "../game/hubGrid";
import { GAME_TILES } from "../game/hubTiles";
import { endPlaySession, isNearLimit, startPlaySession } from "../game/playTimeLogic";
import { isReducedMotion } from "../utils/motion";
import { attachPressFeedback } from "../utils/pressFeedback";
import { sceneEntrance, transitionToScene } from "../utils/sceneTransitions";
import { unlockSpeechForUserGesture } from "../utils/speech";
import { getActiveProfile, getPlayTime, recordGamePlay, recordPlayTime } from "../utils/storage";
import { textStyle } from "../utils/typography";
import { loadSceneWithRetry } from "./sceneRegistry";

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
  /** Textless retry cue for a game chunk that failed to load; absent when none is due. */
  private loadCue?: GameLoadCue;
  /**
   * Identifies the current visit to the Hub. `create()` and the `shutdown`
   * handler each bump it, and a launch compares the value it captured before
   * its await with the value it finds after it. Phaser reuses the scene
   * instance, so a boolean reset in `create()` would let a load that settles
   * after the next `create()` act on the new visit; a counter cannot (NFR-6).
   */
  private visitToken = 0;
  /**
   * True while a game launch is in flight. A cue retry and a tile tap can
   * otherwise race two loads, and both would charge a game the child never
   * opened (FR-4).
   */
  private launching = false;
  /** Audio unlock/start closure captured from create() for tap handlers. */
  private startAudioFn: () => void = () => {};
  /**
   * Document-visibility handler: re-reads the budget when the page returns to
   * the foreground. A field so the shutdown hook can remove the exact
   * reference create() attached.
   */
  private handleVisibilityChange = (): void => {
    if (document.visibilityState === "visible") {
      this.refreshPlayTimeState();
    }
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
    // its resolution must not act on this one.
    this.visitToken += 1;
    this.launching = false;
    // Phaser reuses this instance across visits: a cue left from the previous
    // visit is gone with its scene, but the field must not point at it.
    this.loadCue?.destroy();
    this.loadCue = undefined;
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
      this.visitToken += 1;
      this.hideLoadCue();
      this.pwaToasts.destroy();
      this.parentLock?.destroy();
      this.settingsPanel?.destroy();
      this.settingsPanel = undefined;
      this.profileChip.destroy();
      this.playTimeGraphics?.destroy();
      this.playTimeGraphics = undefined;
      this.idleCallTimer?.remove();
      this.idleCallTimer = undefined;
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
   * Activates a tile after the grid's tap guards pass. The audio unlock stays
   * on the gesture that triggered it; everything that belongs to a started
   * game waits for the load (see `openGame`).
   */
  private activateTile(tileIndex: number, tile?: Phaser.GameObjects.Rectangle): void {
    this.startAudioFn();
    void this.openGame(tileIndex, tile);
  }

  /**
   * Loads the game's chunk and opens it when the load succeeded. Every side
   * effect belongs to a game that actually opened, so the play session, the
   * game-play record and the play-time nudge all sit behind the resolved load —
   * a tap whose chunk never arrives charges neither time nor a play.
   *
   * One launch runs at a time: a launch already in flight refuses a second one,
   * and this method is the only place that decides a launch is over, so the tap
   * lock a failed launch hands back and the cue's retry cannot race a second
   * chain into the same play record.
   *
   * The tapped tile rides along so a failure can anchor the retry cue on it.
   */
  private async openGame(tileIndex: number, tile?: Phaser.GameObjects.Rectangle): Promise<void> {
    if (this.launching) return;
    const visit = this.visitToken;
    this.launching = true;
    const loaded = await loadSceneWithRetry(this, GAME_TILES[tileIndex].sceneKey);
    // The Hub can go away mid-load, and Phaser reuses the instance, so the
    // resolution only acts on the visit that started it: acting on any other
    // would start a transition on a dead scene, or hang a cue over a screen
    // nobody sees (NFR-6).
    if (visit !== this.visitToken) return;
    // The cap outranks a retry: the grid checks time-up when a tile is tapped,
    // but a cue outlives that moment, so it is checked again before any charge.
    if (this.timeUp) {
      this.hideLoadCue();
      this.launching = false;
      this.grid.navLocked = false;
      return;
    }
    if (!loaded) {
      // Nothing opened, so hand the grid its tap lock back: one dead chunk must
      // not take every other tile with it. The launch itself is over.
      this.launching = false;
      this.grid.navLocked = false;
      this.showLoadCue(tileIndex, tile);
      return;
    }
    // Navigating away from the Hub now, so the in-flight flag stays set until
    // the scene shuts down.
    this.hideLoadCue();
    startPlaySession(getActiveProfile().id);
    recordGamePlay(GAME_TILES[tileIndex].gameId);
    if (this.shouldNudge()) {
      this.showPlayTimeNudge(tileIndex);
    } else {
      transitionToScene(this, GAME_TILES[tileIndex].sceneKey);
    }
  }

  /**
   * Puts the textless retry cue over the tapped tile, or the scene centre when
   * the tap did not come with a tile. A destroyed cue is terminal (its shutdown
   * hook is detached), so each failure that needs a surface builds a fresh one;
   * `show()` still keeps it to one cue at a time (FR-6).
   */
  private showLoadCue(tileIndex: number, tile?: Phaser.GameObjects.Rectangle): void {
    this.loadCue ??= createGameLoadCue(this);
    this.loadCue.show({
      x: tile?.x ?? this.cameras.main.width / 2,
      y: tile?.y ?? this.cameras.main.height / 2,
      onRetry: () => {
        // The retry is a tap on a live grid, so it takes the same tap lock a
        // tile tap does. Without it a second tile can start a parallel load and
        // charge a game that never opens (FR-4).
        this.grid.navLocked = true;
        // Drop the cue before retrying so a success cannot leave it on screen.
        this.hideLoadCue();
        void this.openGame(tileIndex, tile);
      },
    });
  }

  /** Removes the retry cue, if one is up. Safe to call at any time. */
  private hideLoadCue(): void {
    this.loadCue?.destroy();
    this.loadCue = undefined;
  }

  /** True when the active profile has 5 minutes or fewer remaining. */
  private shouldNudge(): boolean {
    return isNearLimit(getPlayTime());
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
