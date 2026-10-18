import Phaser from "phaser";
import { AudioManager } from "../audio/AudioManager";
import { createCornerMascot, type Mascot } from "../components/Mascot";
import { ParentLock } from "../components/ParentLock";
import { PwaToast, type ToastKind } from "../components/PwaToast";
import { SettingsPanel } from "../components/SettingsPanel";
import {
  isNarrowViewport,
  PAGE_COUNT,
  pagedTilePosition,
  pageTileIndexes,
} from "../game/hubPaging";
import { GAME_TILES } from "../game/hubTiles";
import {
  endPlaySession,
  getRemainingMinutes,
  isLimitReached,
  isNearLimit,
  startPlaySession,
} from "../game/playTimeLogic";
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
  hasSticker,
  recordGamePlay,
  recordPlayTime,
  switchProfile,
} from "../utils/storage";
import { textureSizeFor } from "../utils/textureTiers";
import { textStyle } from "../utils/typography";
import { ensureSceneLoaded } from "./sceneRegistry";

const TILE_WIDTH = 160;
/**
 * 20 tiles render as 5×4 (rows 5/5/5/5). Height and spacing are sized so the
 * 4 rows fit inside 768 with the same 119px top/bottom margins as the 15-tile
 * grid — clearing the top-band controls (avatar chip / Settings, bottom edge
 * 116) while keeping every tile and its sticker shelf on-canvas.
 */
const TILE_HEIGHT = 116;
const TILE_SPACING = 22;
const GRID_COLS = 5;
const GRID_ROWS = 4;
/** Display size of the game icon artwork on each tile (px). */
const TILE_ICON_DISPLAY = 64;
/** Tile icon textures are rasterized at this size (matches PreloadScene). */
const TILE_ICON_TEXTURE_SIZE = textureSizeFor("tile_shape_sorter");
/** Vertical offset of the tile icon above the tile center (px). */
const TILE_ICON_Y_OFFSET = -40;
/** Vertical offset of the secondary text label below the tile center (px). */
const TILE_LABEL_Y_OFFSET = 20;

/** Delay between consecutive entrance elements (ms). */
const ENTRANCE_STAGGER = 40;
/** Duration of each element's entrance tween (ms). */
const ENTRANCE_DURATION = 300;
/**
 * Gentle scale "breathe" pulse for idle tiles (1 = none). Scale-only motion
 * keeps icon/label/shelf geometry fixed, unlike a vertical bob which can
 * visually collide with the fixed shelf slots.
 */
const BOB_AMPLITUDE = 1.025;
/** Duration of one tile breathe loop (ms). */
const BOB_DURATION = 2500;
/** Phase offset between tile breathe loops (ms). */
const BOB_PHASE_OFFSET = 200;
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
/** Display size of sticker thumbnails on the shelf (px). */
const STICKER_DISPLAY_SIZE = 56;
/** Sticker textures are rasterized at this size (matches PreloadScene). */
const STICKER_TEXTURE_SIZE = textureSizeFor("sticker_shape_sorter");
/** Base scale for sticker thumbnails (56px from a 512px texture). */
const STICKER_SCALE = STICKER_DISPLAY_SIZE / STICKER_TEXTURE_SIZE;
/** Alpha of the dashed empty-slot outline for unearned stickers. */
const EMPTY_SLOT_ALPHA = 0.55;
/** Stroke width of the dashed empty-slot outline (px). */
const EMPTY_SLOT_LINE_WIDTH = 4;
/** Number of dashes in the empty-slot circle. */
const EMPTY_SLOT_DASH_COUNT = 10;
/** Entrance scale for the just-earned sticker. */
const JUST_EARNED_SCALE = 1.15;
/** Duration of the gentle sparkle shimmer loop (ms). */
const SPARKLE_DURATION = 800;
/** Peak alpha of the sparkle shimmer loop. */
const SPARKLE_ALPHA = 0.75;
/** Scale of the just-earned sparkle burst pulse. */
const BURST_SCALE = 1.25;
/** Duration of the just-earned sparkle burst pulse (ms). */
const BURST_DURATION = 500;
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
/** Radius of the play-time hint arc / moon badge (px). */
const HINT_ARC_RADIUS = 12;
/** Cool (plenty of time remaining) color for the hint arc. */
const HINT_COOL_COLOR = 0x68d391;
/** Warm (5 minutes or fewer remaining) color for the hint arc. */
const HINT_WARM_COLOR = 0xed8936;
/** Alpha applied to Hub tiles while the daily limit locks them. */
const TIME_UP_TILE_ALPHA = 0.45;

/** Static scale for locked tiles — a non-color "unavailable" size cue. */
const TIME_UP_TILE_SCALE = 0.97;
/** How long the pre-game nudge overlay stays before launching (ms). */
const NUDGE_DELAY = 2000;
/** Depth of the pre-game nudge overlay (above all Hub content). */
const NUDGE_DEPTH = 20;

/**
 * Paged (narrow-viewport) grid geometry and interaction constants. Tile size,
 * spacing and centering live in src/game/hubPaging.ts (PAGED_TILE_*); the
 * per-tile furniture offsets below scale with the taller paged tile.
 */
/** Display size of the game icon artwork on a paged tile (px). */
const PAGED_ICON_DISPLAY = 96;
/** Vertical offset of the paged tile icon above the tile center (px). */
const PAGED_ICON_Y_OFFSET = -58;
/** Vertical offset of the paged tile label below the tile center (px). */
const PAGED_LABEL_Y_OFFSET = 48;
/** Label font size on paged tiles (px). */
const PAGED_LABEL_FONT_SIZE = 20;
/** Duration of the page slide transition (ms). */
const PAGE_SLIDE_DURATION = 300;
/** Minimum horizontal travel for a swipe to flip pages (logical px). */
const SWIPE_MIN_DISTANCE = 60;
/** Y position of the textless page dots (below the grid, above the arc). */
const PAGE_DOTS_Y = 640;
/** Horizontal spacing between the page dots (px). */
const PAGE_DOTS_SPACING = 32;
/** Radius of a page dot (px). */
const PAGE_DOTS_RADIUS = 8;
/** Alpha of the active (filled) page dot. */
const PAGE_DOT_ACTIVE_ALPHA = 0.9;
/** Alpha of the inactive page dot. */
const PAGE_DOT_INACTIVE_ALPHA = 0.25;
/** Tappable hit size around each page dot (px, logical). */
const PAGE_DOT_HIT = 64;

/**
 * Hub scene — the central navigation hub.
 *
 * Displays a grid of 12 game tiles, a sticker book showing earned stickers,
 * and a settings button gated behind a parental lock.
 */
export class HubScene extends Phaser.Scene {
  private parentLock?: ParentLock;
  private settingsPanel?: SettingsPanel;
  /** Sticker thumbnails currently on the shelf (rebuilt after a progress reset). */
  private stickerImages: Phaser.GameObjects.Image[] = [];
  /** Dashed empty-slot outlines for unearned stickers (rebuilt after a reset). */
  private emptySlotGraphics: Phaser.GameObjects.Graphics[] = [];
  private entranceIndex = 0;
  /** Game id whose sticker was just earned; highlighted on this visit. */
  private justEarned?: string;
  /** Pending idle-attract timer. */
  private idleCallTimer?: Phaser.Time.TimerEvent;
  /** True once the attract cue has started for the current idle period. */
  private idleAttractActive = false;
  /** Tiles used as wiggle targets by the attract cue. */
  private attractTargets: Phaser.GameObjects.Rectangle[] = [];
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
  private nudgeActive = false;
  /** True after a tile tap began navigation; blocks double-tap double-records. */
  private navLocked = false;
  /** True when this visit uses the paged (narrow-viewport) grid. */
  private paged = false;
  /** Current page in paged mode (0 or 1); reset on every visit to the Hub. */
  private hubPage = 0;
  /** Every grid object owned by the current page (destroyed on flip). */
  private pageObjects: Phaser.GameObjects.GameObject[] = [];
  /** The two textless page dots (paged mode only). */
  private pageDots: Phaser.GameObjects.Arc[] = [];
  /** Start point of an in-flight swipe, when it began in the grid region. */
  private swipeStart?: { x: number; y: number };
  /** Audio unlock/start closure captured from create() for paged handlers. */
  private startAudioFn: () => void = () => {};
  /** True once a horizontal drag past the swipe threshold was detected. */
  private swiping = false;
  /** Every grid object owned by the classic wide 5x4 layout (rebuilt on resize). */
  private wideObjects: Phaser.GameObjects.GameObject[] = [];
  /** Guards against double-wiring the scene-level swipe handlers. */
  private swipeWired = false;

  constructor() {
    super({ key: "Hub" });
  }

  init(data?: { justEarned?: string }): void {
    this.justEarned = data?.justEarned;
  }

  create(): void {
    sceneEntrance(this);
    const reducedMotion = isReducedMotion();
    this.entranceIndex = 0;
    this.idleAttractActive = false;
    this.attractTargets = [];
    this.timeUp = false;
    this.nudgeActive = false;
    // Phaser reuses this instance across visits (auto-return re-runs create()),
    // so clear the launch guard or every tile tap after the first game is dead.
    this.navLocked = false;

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
    this.hubPage = 0;
    this.classifyViewport();
    if (this.paged) {
      this.createPageDots();
      this.wireSwipeGestures();
      this.buildPageGrid(0);
    } else {
      this.buildWideGrid();
    }
    this.scale.on("resize", this.handleViewportChange, this);

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
          this.rerenderStickerShelf();
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
      for (const dot of this.pageDots) dot.destroy();
      this.pageDots = [];
      this.destroyPageGrid();
      // Detach the viewport listener so a resize while the scene is inactive
      // cannot rebuild a dead scene's objects.
      this.scale?.off("resize", this.handleViewportChange, this);
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
          this.rerenderStickerShelf();
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
    const playTime = getPlayTime();
    if (playTime.limitMinutes === null) return;
    const graphics = this.add.graphics();
    this.playTimeGraphics = graphics;
    graphics.setDepth(-1);
    const cx = this.cameras.main.width / 2;
    const cy = this.cameras.main.height - 16;
    if (isLimitReached(playTime)) {
      this.timeUp = true;
      this.applyTimeUpLock();
      this.mascot?.wave();
      graphics.fillStyle(0x2d3748, 1);
      graphics.fillCircle(cx, cy, HINT_ARC_RADIUS + 6);
      graphics.fillStyle(0xfff8e7, 1);
      graphics.fillCircle(cx - 5, cy - 4, HINT_ARC_RADIUS + 1);
    } else {
      const remaining = getRemainingMinutes(playTime);
      const ratio = Math.max(0, Math.min(1, (remaining ?? 0) / (playTime.limitMinutes ?? 1)));
      const endAngle = -Math.PI / 2 + ratio * Math.PI * 2;
      graphics.fillStyle(isNearLimit(playTime) ? HINT_WARM_COLOR : HINT_COOL_COLOR, 1);
      graphics.slice(cx, cy, HINT_ARC_RADIUS, -Math.PI / 2, endAngle, false);
      graphics.fillPath();
      graphics.fillCircle(cx, cy, 3);
    }
  }

  /**
   * Rebuilds the play-time indicator and tile lock state after a profile
   * switch or a parental settings change.
   */
  private refreshPlayTimeState(): void {
    this.playTimeGraphics?.destroy();
    this.playTimeGraphics = undefined;
    if (this.timeUp) {
      for (const tile of this.attractTargets) {
        tile.setAlpha(1);
        tile.setScale(1);
        tile.setInteractive();
      }
      this.timeUp = false;
    }
    this.createPlayTimeIndicator();
  }

  /**
   * Shows a textless nudge (dim overlay + hourglass) for NUDGE_DELAY ms before
   * launching the game — a soft "almost done" signal without harsh cutoffs.
   */
  private showPlayTimeNudge(tileIndex: number): void {
    if (this.nudgeActive) return;
    this.nudgeActive = true;
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const cx = width / 2;
    const cy = height / 2;
    const objects: Phaser.GameObjects.GameObject[] = [];
    const overlay = this.add.rectangle(cx, cy, width, height, 0x2d3748, 0.6);
    overlay.setDepth(NUDGE_DEPTH);
    overlay.setInteractive();
    objects.push(overlay);
    const hourglass = this.add.graphics();
    hourglass.setDepth(NUDGE_DEPTH + 1);
    hourglass.fillStyle(0xffffff, 1);
    hourglass.beginPath();
    hourglass.moveTo(cx - 36, cy - 40);
    hourglass.lineTo(cx + 36, cy - 40);
    hourglass.lineTo(cx, cy);
    hourglass.lineTo(cx - 36, cy + 40);
    hourglass.lineTo(cx + 36, cy + 40);
    hourglass.lineTo(cx, cy);
    hourglass.fillPath();
    objects.push(hourglass);
    this.time.delayedCall(NUDGE_DELAY, () => {
      for (const obj of objects) obj.destroy();
      this.nudgeActive = false;
      this.launchGame(tileIndex);
    });
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
      if (!isReducedMotion() && this.attractTargets.length > 0) {
        // Wiggle only a couple of tiles so the cue stays gentle; rotate the
        // pick across the grid on each attract so no tile feels ignored.
        const start = this.attractWiggleTick % this.attractTargets.length;
        for (let i = 0; i < ATTRACT_WIGGLE_COUNT; i++) {
          const tile = this.attractTargets[(start + i) % this.attractTargets.length];
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

  /** Creates one shelf sticker thumbnail for the given tile, reflecting storage. */
  private createShelfSticker(index: number, x: number, y: number, tileHeight = TILE_HEIGHT): void {
    const earned = hasSticker(GAME_TILES[index].gameId);
    const stickerX = x;
    // Sits 13px above the tile bottom edge so the dashed slot / thumbnail
    // clears the label's bob range (label bottom at +25.5px + 4px bob =
    // +29.5px; circle top at +34px on the wide grid).
    const stickerY = y + tileHeight / 2 - 13;

    if (earned) {
      const sticker = this.add.image(
        stickerX,
        stickerY,
        `sticker_${GAME_TILES[index].gameId.replace(/-/g, "_")}`,
      );
      this.stickerImages.push(sticker);
      if (GAME_TILES[index].gameId === this.justEarned) {
        sticker.setScale(STICKER_SCALE * JUST_EARNED_SCALE);
        this.animateJustEarned(sticker);
      } else {
        sticker.setScale(STICKER_SCALE);
        this.animateEntrance([sticker], () => this.addSparkle(sticker), STICKER_SCALE);
      }
    } else {
      this.drawEmptySlot(stickerX, stickerY);
    }
  }

  /**
   * Draws a dashed circle outline where an unearned sticker will appear,
   * communicating the collection goal textlessly in place of a dimmed ghost.
   */
  private drawEmptySlot(x: number, y: number): void {
    const graphics = this.add.graphics();
    // Anchor the object at the slot center and draw the dashed ring around
    // (0, 0), so page-slide tweens can move the slot by its position.
    graphics.setPosition(x, y);
    this.emptySlotGraphics.push(graphics);
    const radius = STICKER_DISPLAY_SIZE / 2;
    graphics.lineStyle(EMPTY_SLOT_LINE_WIDTH, 0xffffff, EMPTY_SLOT_ALPHA);
    const segment = (Math.PI * 2) / EMPTY_SLOT_DASH_COUNT / 2;
    for (let i = 0; i < EMPTY_SLOT_DASH_COUNT; i++) {
      const start = i * segment * 2;
      graphics.beginPath();
      graphics.arc(0, 0, radius, start, start + segment, false);
      graphics.strokePath();
    }
    const index = this.entranceIndex;
    this.entranceIndex += 1;
    const config: Phaser.Types.Tweens.TweenBuilderConfig = {
      targets: graphics,
      alpha: EMPTY_SLOT_ALPHA,
      delay: index * ENTRANCE_STAGGER,
      duration: ENTRANCE_DURATION,
      ease: "Sine.out",
    };
    if (isReducedMotion()) {
      // Reduced motion skips the fade-in and lands directly at final alpha.
      graphics.setAlpha(EMPTY_SLOT_ALPHA);
    } else {
      graphics.setAlpha(0);
      this.tweens.add(config);
    }
  }

  /**
   * Rebuilds the sticker shelf from storage after a parental progress reset so
   * cleared stickers immediately show as dimmed on the Hub.
   */
  private rerenderStickerShelf(): void {
    for (const sticker of this.stickerImages) sticker.destroy();
    this.stickerImages = [];
    for (const graphics of this.emptySlotGraphics) graphics.destroy();
    this.emptySlotGraphics = [];
    if (this.paged) {
      // Only the active page exists on screen; the other page is rebuilt
      // (with fresh sticker state) whenever it is flipped to.
      const active = pageTileIndexes(this.hubPage);
      active.forEach((globalIndex, slot) => {
        const pos = pagedTilePosition(slot);
        this.createShelfSticker(globalIndex, pos.x, pos.y, pos.height);
      });
      return;
    }
    const startX =
      (this.cameras.main.width - GRID_COLS * TILE_WIDTH - (GRID_COLS - 1) * TILE_SPACING) / 2;
    const startY =
      (this.cameras.main.height - GRID_ROWS * TILE_HEIGHT - (GRID_ROWS - 1) * TILE_SPACING) / 2;
    for (let i = 0; i < GAME_TILES.length; i++) {
      const col = i % GRID_COLS;
      const row = Math.floor(i / GRID_COLS);
      const x = startX + col * (TILE_WIDTH + TILE_SPACING) + TILE_WIDTH / 2;
      const y = startY + row * (TILE_HEIGHT + TILE_SPACING) + TILE_HEIGHT / 2;
      this.createShelfSticker(i, x, y);
    }
  }

  /**
   * Dims, shrinks and disables every currently-visible game tile once the
   * daily play-time limit is reached (locked tiles swallow taps).
   */
  private applyTimeUpLock(): void {
    for (const tile of this.attractTargets) {
      tile.setAlpha(TIME_UP_TILE_ALPHA);
      tile.setScale(TIME_UP_TILE_SCALE);
      tile.disableInteractive();
    }
  }

  /** Classifies the current viewport into the paged (narrow) or wide mode. */
  private classifyViewport(): void {
    const display = this.scale?.displaySize;
    this.paged = isNarrowViewport(
      display?.width ?? this.cameras.main.width,
      display?.height ?? this.cameras.main.height,
    );
  }

  /**
   * Re-classifies the viewport when the scale manager reports a resize and
   * rebuilds the grid only when the narrow/wide classification flips. The
   * canvas is a fixed 1024x768 in game coordinates, so a same-classification
   * resize (e.g. a window growing on desktop) needs no relayout. The page
   * resets to the first page on a classification flip.
   */
  private handleViewportChange(): void {
    const wasPaged = this.paged;
    this.classifyViewport();
    if (this.paged === wasPaged) return;
    this.hubPage = 0;
    if (this.paged) {
      this.destroyWideGrid();
      if (this.pageDots.length === 0) this.createPageDots();
      this.wireSwipeGestures();
      this.buildPageGrid(0);
    } else {
      this.destroyPageGrid();
      for (const dot of this.pageDots) dot.destroy();
      this.pageDots = [];
      this.buildWideGrid();
    }
  }

  /** Destroys every object owned by the classic wide grid (tiles + shelf). */
  private destroyWideGrid(): void {
    for (const obj of this.wideObjects) obj.destroy();
    this.wideObjects = [];
    for (const sticker of this.stickerImages) sticker.destroy();
    this.stickerImages = [];
    for (const graphics of this.emptySlotGraphics) graphics.destroy();
    this.emptySlotGraphics = [];
  }

  /**
   * Builds the classic 5x4 wide grid — the original 20-tile layout kept
   * byte-identical for desktop and tablet viewports.
   */
  private buildWideGrid(): void {
    const reducedMotion = isReducedMotion();
    this.wideObjects = [];
    this.stickerImages = [];
    this.emptySlotGraphics = [];
    this.attractTargets = [];
    this.entranceIndex = 0;
    const startX =
      (this.cameras.main.width - GRID_COLS * TILE_WIDTH - (GRID_COLS - 1) * TILE_SPACING) / 2;
    const startY =
      (this.cameras.main.height - GRID_ROWS * TILE_HEIGHT - (GRID_ROWS - 1) * TILE_SPACING) / 2;

    for (let i = 0; i < GAME_TILES.length; i++) {
      const col = i % GRID_COLS;
      const row = Math.floor(i / GRID_COLS);
      const x = startX + col * (TILE_WIDTH + TILE_SPACING) + TILE_WIDTH / 2;
      const y = startY + row * (TILE_HEIGHT + TILE_SPACING) + TILE_HEIGHT / 2;

      const tile = this.add.rectangle(x, y, TILE_WIDTH, TILE_HEIGHT, 0x2b6cb0);
      // Flat storybook outline, matching every game scene's card language.
      tile.setStrokeStyle(4, 0x2d3748);
      tile.setInteractive();
      this.attractTargets.push(tile);
      // Navigate on release so the press squish is visible while holding;
      // releasing outside the tile (pointerout/pointercancel) cancels.
      // Locked tiles (daily limit reached) swallow the tap entirely.
      tile.on("pointerup", () => {
        if (this.timeUp || this.navLocked) return;
        this.navLocked = true;
        this.startAudioFn();
        startPlaySession(getActiveProfile().id);
        recordGamePlay(GAME_TILES[i].gameId);
        if (this.shouldNudge()) {
          this.showPlayTimeNudge(i);
        } else {
          this.launchGame(i);
        }
      });
      this.wideObjects.push(tile);

      const iconDisplay = GAME_TILES[i].iconDisplay ?? TILE_ICON_DISPLAY;
      const iconY = y + (GAME_TILES[i].iconOffsetY ?? TILE_ICON_Y_OFFSET);
      const icon = this.add.image(x, iconY, GAME_TILES[i].tileKey);
      icon.setDisplaySize(iconDisplay, iconDisplay);
      this.wideObjects.push(icon);

      const label = this.add.text(
        x,
        y + TILE_LABEL_Y_OFFSET,
        GAME_TILES[i].label,
        textStyle({
          fontSize: "17px",
          color: "#ffffff",
        }),
      );
      label.setOrigin(0.5);
      this.wideObjects.push(label);

      // The tile and label pop to scale 1; the icon gets its own entrance that
      // ends at its display scale (from its raster tier) so the pop does not
      // reset it to the native size. Typography-heavy tiles use a smaller size.
      this.animateEntrance([tile, label], () => {
        attachPressFeedback(tile, { spring: true });
      });
      this.animateEntrance([icon], undefined, iconDisplay / TILE_ICON_TEXTURE_SIZE);

      if (!reducedMotion) {
        // Breathe pulse: scale-only wave so the icon/label/shelf geometry
        // stays fixed (a vertical bob could collide with the fixed slots).
        // Starts after the entrance pop settles; staggered per tile for a
        // travelling wave. Icon scales from its own display scale.
        const breatheDelay = ENTRANCE_DURATION + 50 + i * BOB_PHASE_OFFSET;
        this.tweens.add({
          targets: [tile, label],
          scaleX: BOB_AMPLITUDE,
          scaleY: BOB_AMPLITUDE,
          duration: BOB_DURATION,
          yoyo: true,
          repeat: -1,
          ease: "Sine.inOut",
          delay: breatheDelay,
        });
        this.tweens.add({
          targets: [icon],
          scaleX: iconDisplay * BOB_AMPLITUDE * (1 / TILE_ICON_TEXTURE_SIZE),
          scaleY: iconDisplay * BOB_AMPLITUDE * (1 / TILE_ICON_TEXTURE_SIZE),
          duration: BOB_DURATION,
          yoyo: true,
          repeat: -1,
          ease: "Sine.inOut",
          delay: breatheDelay,
        });
      }

      this.createShelfSticker(i, x, y);
    }

    if (this.timeUp) {
      // A resize rebuild after the daily limit is reached must lock the new
      // tiles too — the limit is profile-wide, not per layout.
      this.applyTimeUpLock();
    }
  }

  /**
   * Builds one page of the paged (narrow-viewport) grid.
   *
   * Clears the current page-object lists WITHOUT destroying their objects —
   * the caller decides when old objects die (immediately for reduced motion,
   * after the slide-out tween otherwise). Stickers/slots created here are
   * appended to the freshly reset lists.
   */
  private buildPageGrid(page: number, slideFrom: number | null = null): void {
    this.pageObjects = [];
    this.stickerImages = [];
    this.emptySlotGraphics = [];
    // Idle attract + time-up locking only ever target the visible page.
    this.attractTargets = [];
    // Page-local entrance stagger, so page 2 does not inherit page 1's delay.
    this.entranceIndex = 0;
    const reducedMotion = isReducedMotion();

    pageTileIndexes(page).forEach((globalIndex, slot) => {
      const pos = pagedTilePosition(slot);
      const x = pos.x + (slideFrom ?? 0);
      const { y, width, height } = pos;
      const slideIn = slideFrom !== null && !reducedMotion;
      const stickerMark = this.stickerImages.length;
      const slotMark = this.emptySlotGraphics.length;

      const tile = this.add.rectangle(x, y, width, height, 0x2b6cb0);
      tile.setStrokeStyle(4, 0x2d3748);
      tile.setInteractive();
      this.attractTargets.push(tile);
      // Same release-to-navigate contract as the wide grid; a horizontal drag
      // (swipe) releases the gesture to the page flip instead of the tile.
      tile.on("pointerup", () => {
        if (this.timeUp || this.navLocked || this.swiping) return;
        this.navLocked = true;
        this.startAudioFn();
        startPlaySession(getActiveProfile().id);
        recordGamePlay(GAME_TILES[globalIndex].gameId);
        if (this.shouldNudge()) {
          this.showPlayTimeNudge(globalIndex);
        } else {
          this.launchGame(globalIndex);
        }
      });
      this.pageObjects.push(tile);

      const icon = this.add.image(x, y + PAGED_ICON_Y_OFFSET, GAME_TILES[globalIndex].tileKey);
      icon.setDisplaySize(PAGED_ICON_DISPLAY, PAGED_ICON_DISPLAY);
      this.pageObjects.push(icon);

      const label = this.add.text(
        x,
        y + PAGED_LABEL_Y_OFFSET,
        GAME_TILES[globalIndex].label,
        textStyle({
          fontSize: `${PAGED_LABEL_FONT_SIZE}px`,
          color: "#ffffff",
        }),
      );
      label.setOrigin(0.5);
      this.pageObjects.push(label);

      this.animateEntrance([tile, label], () => {
        attachPressFeedback(tile, { spring: true });
      });
      this.animateEntrance([icon], undefined, PAGED_ICON_DISPLAY * (1 / TILE_ICON_TEXTURE_SIZE));

      if (slideIn) {
        const settleX = pos.x;
        for (const obj of [tile, icon, label]) {
          this.tweens.add({
            targets: obj,
            x: settleX,
            duration: PAGE_SLIDE_DURATION,
            ease: "Cubic.out",
          });
        }
      }

      if (!reducedMotion) {
        const breatheDelay = ENTRANCE_DURATION + 50 + slot * BOB_PHASE_OFFSET;
        this.tweens.add({
          targets: [tile, label],
          scaleX: BOB_AMPLITUDE,
          scaleY: BOB_AMPLITUDE,
          duration: BOB_DURATION,
          yoyo: true,
          repeat: -1,
          ease: "Sine.inOut",
          delay: breatheDelay,
        });
        const iconScale = PAGED_ICON_DISPLAY * BOB_AMPLITUDE * (1 / TILE_ICON_TEXTURE_SIZE);
        this.tweens.add({
          targets: [icon],
          scaleX: iconScale,
          scaleY: iconScale,
          duration: BOB_DURATION,
          yoyo: true,
          repeat: -1,
          ease: "Sine.inOut",
          delay: breatheDelay,
        });
      }

      this.createShelfSticker(globalIndex, x, y, height);
      if (slideIn) {
        // Slide only the shelf pieces this tile just created (the lists were
        // reset at the top of this build, so slice from the pre-create mark).
        const delta = pos.x - x;
        for (const obj of [
          ...this.stickerImages.slice(stickerMark),
          ...this.emptySlotGraphics.slice(slotMark),
        ]) {
          this.tweens.add({
            targets: obj,
            x: obj.x + delta,
            duration: PAGE_SLIDE_DURATION,
            ease: "Cubic.out",
          });
        }
      }
    });

    if (this.timeUp) {
      // A flip after the daily limit is reached must lock the incoming page
      // too — the limit is profile-wide, not per page.
      this.applyTimeUpLock();
    }
  }

  /** Destroys every object owned by the current page (tiles + shelf). */
  private destroyPageGrid(): void {
    for (const obj of this.pageObjects) obj.destroy();
    this.pageObjects = [];
    for (const sticker of this.stickerImages) sticker.destroy();
    this.stickerImages = [];
    for (const graphics of this.emptySlotGraphics) graphics.destroy();
    this.emptySlotGraphics = [];
  }

  /**
   * Flips to the requested page with a horizontal slide (skipped under
   * reduced motion, which swaps instantly). The outgoing page slides out
   * while the incoming page slides in; old objects are destroyed after the
   * slide completes.
   */
  private flipTo(page: number): void {
    if (!this.paged || page < 0 || page >= PAGE_COUNT || page === this.hubPage) return;
    const direction = page > this.hubPage ? 1 : -1;
    this.hubPage = page;
    this.updatePageDots();
    if (isReducedMotion()) {
      this.destroyPageGrid();
      this.buildPageGrid(page);
      return;
    }
    const outgoing = [...this.pageObjects, ...this.stickerImages, ...this.emptySlotGraphics];
    const canvasWidth = this.cameras.main.width;
    this.buildPageGrid(page, direction * canvasWidth);
    const shift = -direction * canvasWidth;
    for (const obj of outgoing) {
      this.tweens.add({
        targets: obj,
        x: obj.x + shift,
        duration: PAGE_SLIDE_DURATION,
        ease: "Cubic.in",
      });
    }
    this.time.delayedCall(PAGE_SLIDE_DURATION, () => {
      for (const obj of outgoing) obj.destroy();
    });
  }

  /** Re-paints the page dots to highlight the active page. */
  private updatePageDots(): void {
    this.pageDots.forEach((dot, page) => {
      dot.setAlpha(page === this.hubPage ? PAGE_DOT_ACTIVE_ALPHA : PAGE_DOT_INACTIVE_ALPHA);
    });
  }

  /** Creates the two textless page dots below the paged grid. */
  private createPageDots(): void {
    for (let page = 0; page < PAGE_COUNT; page++) {
      const dot = this.add.circle(
        this.cameras.main.width / 2 + (page - (PAGE_COUNT - 1) / 2) * PAGE_DOTS_SPACING,
        PAGE_DOTS_Y,
        PAGE_DOTS_RADIUS,
        0x2d3748,
      );
      dot.setAlpha(page === this.hubPage ? PAGE_DOT_ACTIVE_ALPHA : PAGE_DOT_INACTIVE_ALPHA);
      dot.setInteractive({
        hitArea: new Phaser.Geom.Rectangle(
          -PAGE_DOT_HIT / 2,
          -PAGE_DOT_HIT / 2,
          PAGE_DOT_HIT,
          PAGE_DOT_HIT,
        ),
        hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      });
      dot.on("pointerup", () => {
        this.resetIdleAttract();
        this.flipTo(page);
      });
      this.pageDots.push(dot);
    }
  }

  /** Wires horizontal swipe gestures, scoped to the paged grid region. */
  private wireSwipeGestures(): void {
    // Scene-level handlers cannot be removed without an off() per event, so
    // they are wired exactly once per scene instance instead. flipTo() ignores
    // calls while the wide layout is active.
    if (this.swipeWired) return;
    this.swipeWired = true;
    const first = pagedTilePosition(0);
    const last = pagedTilePosition(9);
    const gridLeft = first.x - first.width / 2;
    const gridRight = last.x + last.width / 2;
    const gridTop = first.y - first.height / 2;
    const gridBottom = last.y + last.height / 2;
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.swiping = false;
      // An open overlay (profile picker / settings panel) owns the gesture;
      // never start a page swipe underneath it.
      if (this.profilePickerOpen || this.settingsPanel) return;
      if (
        pointer.x >= gridLeft &&
        pointer.x <= gridRight &&
        pointer.y >= gridTop &&
        pointer.y <= gridBottom
      ) {
        this.swipeStart = { x: pointer.x, y: pointer.y };
      }
    });
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!this.swipeStart || this.swiping) return;
      if (Math.abs(pointer.x - this.swipeStart.x) >= SWIPE_MIN_DISTANCE) {
        this.swiping = true;
      }
    });
    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      const start = this.swipeStart;
      this.swipeStart = undefined;
      if (!start) return;
      const dx = pointer.x - start.x;
      const dy = pointer.y - start.y;
      if (Math.abs(dx) < SWIPE_MIN_DISTANCE || Math.abs(dx) <= Math.abs(dy)) return;
      this.flipTo(this.hubPage + (dx < 0 ? 1 : -1));
    });
  }

  /**
   * Brings the just-earned sticker in with a larger Back.out bounce and a
   * sparkle burst (scale pulse + shimmer). Under reduced motion only alpha.
   */
  private animateJustEarned(sticker: Phaser.GameObjects.Image): void {
    const index = this.entranceIndex;
    this.entranceIndex += 1;
    const config: Phaser.Types.Tweens.TweenBuilderConfig = {
      targets: sticker,
      alpha: 1,
      delay: index * ENTRANCE_STAGGER,
      duration: ENTRANCE_DURATION,
      ease: "Back.out",
    };
    sticker.setAlpha(0);
    if (!isReducedMotion()) {
      sticker.setScale(0);
      config.scaleX = JUST_EARNED_SCALE * STICKER_SCALE;
      config.scaleY = JUST_EARNED_SCALE * STICKER_SCALE;
      config.onComplete = () => this.addJustEarnedBurst(sticker);
    }
    this.tweens.add(config);
  }

  /** Gentle alpha shimmer loop for earned stickers (no-op under reduced motion). */
  private addSparkle(sticker: Phaser.GameObjects.Image): void {
    if (isReducedMotion()) return;
    this.tweens.add({
      targets: sticker,
      alpha: SPARKLE_ALPHA,
      duration: SPARKLE_DURATION,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });
  }

  /** Sparkle burst for the just-earned sticker: shimmer plus scale pulse. */
  private addJustEarnedBurst(sticker: Phaser.GameObjects.Image): void {
    this.addSparkle(sticker);
    if (isReducedMotion()) return;
    this.tweens.add({
      targets: sticker,
      scaleX: BURST_SCALE * STICKER_SCALE,
      scaleY: BURST_SCALE * STICKER_SCALE,
      duration: BURST_DURATION,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });
  }

  /**
   * Fades (and, under normal motion, scales) an element in with a per-element
   * stagger. Under reduced motion only alpha is animated.
   * @param targets - Display objects to animate.
   * @param onComplete - Optional callback invoked when the entrance finishes.
   * @param targetScale - Scale to end at (defaults to 1; pre-sized objects pass
   *   their display scale, e.g. tile icons at display / texture-tier size).
   */
  private animateEntrance(
    targets: Phaser.GameObjects.GameObject[],
    onComplete?: () => void,
    targetScale = 1,
  ): void {
    const index = this.entranceIndex;
    this.entranceIndex += 1;
    const config: Phaser.Types.Tweens.TweenBuilderConfig = {
      targets,
      alpha: 1,
      delay: index * ENTRANCE_STAGGER,
      duration: ENTRANCE_DURATION,
      ease: "Sine.out",
    };
    if (onComplete) {
      config.onComplete = onComplete;
    }

    for (const target of targets) {
      const tweenable = target as Phaser.GameObjects.GameObject & {
        setAlpha: (alpha: number) => unknown;
        setScale: (scale: number) => unknown;
      };
      tweenable.setAlpha(0);
      if (!isReducedMotion()) {
        tweenable.setScale(0);
        config.scaleX = targetScale;
        config.scaleY = targetScale;
      }
    }

    this.tweens.add(config);
  }
}
