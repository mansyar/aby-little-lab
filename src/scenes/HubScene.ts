import Phaser from "phaser";
import { AudioManager } from "../audio/AudioManager";
import { createCornerMascot, type Mascot } from "../components/Mascot";
import { ParentLock } from "../components/ParentLock";
import { createPlayTimeIndicator, PlayTimeNudge } from "../components/PlayTimeIndicator";
import { PwaToast, type ToastKind } from "../components/PwaToast";
import { SettingsPanel } from "../components/SettingsPanel";
import { HubGrid } from "../game/hubGrid";
import { GAME_TILES } from "../game/hubTiles";
import { endPlaySession, isNearLimit, startPlaySession } from "../game/playTimeLogic";
import { PROFILE_AVATAR_TEXTURES } from "../game/profileLogic";
import { isReducedMotion } from "../utils/motion";
import { attachPressFeedback } from "../utils/pressFeedback";
import { getPwaBridge } from "../utils/pwaBridge";
import { sceneEntrance, transitionToScene } from "../utils/sceneTransitions";
import { unlockSpeechForUserGesture } from "../utils/speech";
import {
  getActiveProfile,
  getPlayTime,
  getProfiles,
  recordGamePlay,
  recordPlayTime,
  switchProfile,
} from "../utils/storage";
import { textureSizeFor } from "../utils/textureTiers";
import { textStyle } from "../utils/typography";
import { ensureSceneLoaded } from "./sceneRegistry";

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
/** Avatar textures are rasterized at this size (matches PreloadScene). */
const AVATAR_TEXTURE_SIZE = textureSizeFor(PROFILE_AVATAR_TEXTURES.cat);
/** Display size of the active-profile avatar chip (px). */
const AVATAR_CHIP_DISPLAY = 72;
/** Touch target size of the avatar chip (px). */
const AVATAR_CHIP_HIT = 96;
/** Corner inset for the avatar chip, mirroring the Settings button (px). */
const AVATAR_CHIP_INSET = 20;
/** Display size of avatars in the profile picker (px). */
const PICKER_AVATAR_DISPLAY = 96;
/** Gap between picker avatars (px). */
const PICKER_AVATAR_SPACING = 40;
/** Depth of the picker overlay (above all Hub content). */
const PICKER_DEPTH = 20;

/**
 * Hub scene — the central navigation hub.
 *
 * Displays a grid of 12 game tiles, a sticker book showing earned stickers,
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
  /** PWA lifecycle toast currently shown (update/offline). */
  private pwaToast?: PwaToast;
  /** Unsubscribes this scene from PWA lifecycle events on shutdown. */
  private pwaUnsubscribe?: () => void;
  /** Active-profile avatar chip (top-left, kid-tappable). */
  private profileChip?: Phaser.GameObjects.Image;
  /** True while the profile picker overlay is open. */
  private profilePickerOpen = false;
  /** Objects owned by the open profile picker (destroyed together on close). */
  private profilePickerObjects: Phaser.GameObjects.GameObject[] = [];
  /** True while the active profile's daily play-time limit is reached. */
  private timeUp = false;
  /** Play-time indicator (hint arc or moon badge) for the active profile. */
  private playTimeGraphics?: Phaser.GameObjects.Graphics;
  /** True while the pre-game nudge overlay is showing. */
  private nudge = new PlayTimeNudge();
  /** Audio unlock/start closure captured from create() for tap handlers. */
  private startAudioFn: () => void = () => {};
  /** Tile-grid renderer: layouts, page dots, swipes and the sticker shelf. */
  private grid: HubGrid;

  constructor() {
    super({ key: "Hub" });
    this.grid = new HubGrid({
      scene: this,
      isTimeUp: () => this.timeUp,
      activateTile: (tileIndex) => this.activateTile(tileIndex),
      onUserGesture: () => this.resetIdleAttract(),
      gestureBlocked: () => Boolean(this.profilePickerOpen || this.settingsPanel),
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
        this.settingsPanel?.destroy();
        this.settingsPanel = new SettingsPanel(this, undefined, () => {
          this.grid.rerenderStickerShelf();
          this.refreshProfileChip();
          this.refreshPlayTimeState();
        });
      },
      onFailure: () => {
        // No action needed on failure.
      },
    });
    attachPressFeedback(settingsButton);
    settingsButton.on("pointerdown", startAudio);

    this.createProfileChip(startAudio);

    this.wirePwaBridge();

    this.events.on("shutdown", () => {
      this.pwaUnsubscribe?.();
      getPwaBridge()?.setHubActive(false);
      this.pwaToast?.destroy();
      this.pwaToast = undefined;
      this.parentLock?.destroy();
      this.settingsPanel?.destroy();
      this.settingsPanel = undefined;
      this.closeProfilePicker();
      this.profileChip?.destroy();
      this.profileChip = undefined;
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
  }

  /**
   * Creates the kid-tappable avatar chip (top-left) showing the active
   * profile's avatar. Tapping it opens the profile picker — no parental lock.
   */
  private createProfileChip(startAudio: () => void): void {
    const active = getActiveProfile();
    const chip = this.add.image(
      AVATAR_CHIP_INSET + AVATAR_CHIP_HIT / 2,
      AVATAR_CHIP_INSET + AVATAR_CHIP_HIT / 2,
      PROFILE_AVATAR_TEXTURES[active.avatarId],
    );
    chip.setScale(AVATAR_CHIP_DISPLAY / AVATAR_TEXTURE_SIZE);

    // Flat storybook ring so the active profile is unambiguous without
    // relying on scale alone (spec FR2).
    const ring = this.add.rectangle(
      AVATAR_CHIP_INSET + AVATAR_CHIP_HIT / 2,
      AVATAR_CHIP_INSET + AVATAR_CHIP_HIT / 2,
      AVATAR_CHIP_DISPLAY + 20,
      AVATAR_CHIP_DISPLAY + 20,
    );
    ring.setFillStyle(0x000000, 0);
    ring.setStrokeStyle(4, 0x2d3748, 1); // thick flat outline (#2D3748)
    ring.setDepth(-1);
    // Frame-based default hit area covers the visible chip exactly (custom
    // rects are tested in texture-local space and miss on 512px textures).
    chip.setInteractive();
    chip.on("pointerup", () => {
      startAudio();
      this.openProfilePicker();
    });
    attachPressFeedback(chip);
    this.profileChip = chip;
  }

  /**
   * Opens the textless profile picker: a dim overlay plus one avatar per
   * profile (≥96px). Tapping a profile switches to it and re-renders the
   * sticker shelf; tapping the overlay closes without switching.
   */
  private openProfilePicker(): void {
    if (this.profilePickerOpen) return;
    this.profilePickerOpen = true;
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const profiles = getProfiles();
    const activeId = getActiveProfile().id;

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x2d3748, 0.65);
    overlay.setDepth(PICKER_DEPTH);
    overlay.setInteractive();
    overlay.on("pointerup", () => this.closeProfilePicker());
    this.profilePickerObjects.push(overlay);

    const totalWidth =
      profiles.length * PICKER_AVATAR_DISPLAY + (profiles.length - 1) * PICKER_AVATAR_SPACING;
    let x = width / 2 - totalWidth / 2 + PICKER_AVATAR_DISPLAY / 2;
    const y = height / 2;
    for (const profile of profiles) {
      const avatar = this.add.image(x, y, PROFILE_AVATAR_TEXTURES[profile.avatarId]);
      avatar.setDepth(PICKER_DEPTH + 1);
      avatar.setInteractive();
      const baseScale = PICKER_AVATAR_DISPLAY / AVATAR_TEXTURE_SIZE;
      avatar.setScale(profile.id === activeId ? baseScale * 1.15 : baseScale);
      if (profile.id === activeId) {
        // Selection ring behind the enlarged active avatar; destroyed with
        // the picker on close via profilePickerObjects.
        const marker = this.add.rectangle(
          x,
          y,
          PICKER_AVATAR_DISPLAY + 16,
          PICKER_AVATAR_DISPLAY + 16,
        );
        marker.setFillStyle(0x000000, 0);
        marker.setStrokeStyle(4, 0x2d3748, 1);
        marker.setDepth(PICKER_DEPTH);
        this.profilePickerObjects.push(marker);
      }
      avatar.on("pointerup", () => {
        if (profile.id !== activeId) {
          switchProfile(profile.id);
          this.refreshProfileChip();
          this.grid.rerenderStickerShelf();
          this.refreshPlayTimeState();
        }
        this.closeProfilePicker();
      });
      this.profilePickerObjects.push(avatar);
      x += PICKER_AVATAR_DISPLAY + PICKER_AVATAR_SPACING;
    }
  }

  /** Closes the picker overlay and resets the picker state (no stale lock). */
  private closeProfilePicker(): void {
    for (const obj of this.profilePickerObjects) obj.destroy();
    this.profilePickerObjects = [];
    this.profilePickerOpen = false;
  }

  /** Re-textures the avatar chip to the active profile (after switch/add/delete). */
  private refreshProfileChip(): void {
    this.profileChip?.setTexture(PROFILE_AVATAR_TEXTURES[getActiveProfile().avatarId]);
  }

  /**
   * Launches the game at the given tile index: lazy-loads its chunk, then
   * transitions via the shared fade-out.
   */
  private launchGame(tileIndex: number): void {
    void ensureSceneLoaded(this, GAME_TILES[tileIndex].sceneKey).then(() => {
      transitionToScene(this, GAME_TILES[tileIndex].sceneKey);
    });
  }

  /**
   * Activates a tile after the grid's tap guards pass: audio unlock/start,
   * play-session start, gameplay record, then nudge-or-launch.
   */
  private activateTile(tileIndex: number): void {
    this.startAudioFn();
    startPlaySession(getActiveProfile().id);
    recordGamePlay(GAME_TILES[tileIndex].gameId);
    if (this.shouldNudge()) {
      this.showPlayTimeNudge(tileIndex);
    } else {
      this.launchGame(tileIndex);
    }
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
   */
  private createPlayTimeIndicator(): void {
    this.playTimeGraphics =
      createPlayTimeIndicator({
        scene: this,
        onLimitReached: () => {
          this.timeUp = true;
          this.grid.applyTimeUpLock();
          this.mascot?.wave();
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
    if (this.timeUp) {
      this.grid.restoreTiles();
      this.timeUp = false;
    }
    this.createPlayTimeIndicator();
  }

  /**
   * Shows a textless nudge (dim overlay + hourglass) for NUDGE_DELAY ms before
   * launching the game — a soft "almost done" signal without harsh cutoffs.
   */
  private showPlayTimeNudge(tileIndex: number): void {
    this.nudge.show({ scene: this, onLaunch: (i) => this.launchGame(i) }, tileIndex);
  }

  /**
   * Subscribes to PWA lifecycle events so update/offline toasts appear on the
   * Hub only. If an update was already available, shows its toast on entry.
   */
  private wirePwaBridge(): void {
    const bridge = getPwaBridge();
    if (!bridge) return;
    this.pwaUnsubscribe = bridge.subscribe((event) => {
      if (event === "needRefresh") {
        this.showPwaToast("update");
      } else {
        this.showPwaToast("offline");
      }
    });
    bridge.setHubActive(true);
    if (bridge.updateAvailable()) {
      this.showPwaToast("update");
    }
  }

  /** Shows a PWA toast, replacing any toast already visible. */
  private showPwaToast(kind: ToastKind): void {
    this.pwaToast?.destroy();
    const bridge = getPwaBridge();
    if (!bridge) return;
    this.pwaToast = new PwaToast(this, {
      kind,
      onUpdate: () => bridge.updateNow(),
      onDismiss: () => {
        this.pwaToast?.destroy();
        this.pwaToast = undefined;
      },
    });
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
