import Phaser from "phaser";
import { AudioManager } from "../audio/AudioManager";
import { createCornerMascot, type Mascot } from "../components/Mascot";
import { ParentLock } from "../components/ParentLock";
import { PwaToast, type ToastKind } from "../components/PwaToast";
import { SettingsPanel } from "../components/SettingsPanel";
import { PROFILE_AVATAR_TEXTURES } from "../game/profileLogic";
import type { GameId } from "../types";
import { isReducedMotion } from "../utils/motion";
import { attachPressFeedback } from "../utils/pressFeedback";
import { getPwaBridge } from "../utils/pwaBridge";
import { sceneEntrance, transitionToScene } from "../utils/sceneTransitions";
import { getActiveProfile, getProfiles, hasSticker, switchProfile } from "../utils/storage";
import { ensureSceneLoaded } from "./sceneRegistry";

interface GameTile {
  sceneKey: string;
  gameId: GameId;
  label: string;
}

const GAME_TILES: readonly GameTile[] = [
  { sceneKey: "ShapeSorter", gameId: "shape-sorter", label: "Shape Sorter" },
  { sceneKey: "AnimalTrace", gameId: "animal-trace", label: "Animal Trace" },
  { sceneKey: "PopFreeze", gameId: "pop-freeze", label: "Pop & Freeze" },
  { sceneKey: "ShadowMatch", gameId: "shadow-match", label: "Shadow Match" },
  { sceneKey: "MusicalMemory", gameId: "musical-memory", label: "Musical Memory" },
  { sceneKey: "BigSmall", gameId: "big-small", label: "Big & Small" },
  { sceneKey: "PatternBuilder", gameId: "pattern-builder", label: "Pattern Builder" },
  { sceneKey: "Alphabet", gameId: "alphabet-match", label: "Find the Letter" },
  { sceneKey: "WordMatch", gameId: "word-match", label: "Find the Word" },
  { sceneKey: "WordBuilder", gameId: "word-builder", label: "Build the Word" },
];

const TILE_WIDTH = 160;
const TILE_HEIGHT = 150;
const TILE_SPACING = 40;
const GRID_COLS = 5;
const GRID_ROWS = 2;

/** Delay between consecutive entrance elements (ms). */
const ENTRANCE_STAGGER = 40;
/** Duration of each element's entrance tween (ms). */
const ENTRANCE_DURATION = 300;
/** Vertical bob amplitude for idle tiles (px). */
const BOB_AMPLITUDE = 4;
/** Duration of one tile bob loop (ms). */
const BOB_DURATION = 2500;
/** Phase offset between tile bob loops (ms). */
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
const STICKER_TEXTURE_SIZE = 512;
/** Base scale for sticker thumbnails (56px from a 512px texture). */
const STICKER_SCALE = STICKER_DISPLAY_SIZE / STICKER_TEXTURE_SIZE;
/** Alpha for unearned (locked) sticker thumbnails. */
const UNEARNED_ALPHA = 0.3;
/** Scale for unearned (locked) sticker thumbnails. */
const UNEARNED_SCALE = 0.85;
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
/** Avatar textures are rasterized at this size (matches PreloadScene). */
const AVATAR_TEXTURE_SIZE = 512;
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
 * Displays a grid of 10 game tiles, a sticker book showing earned stickers,
 * and a settings button gated behind a parental lock.
 */
export class HubScene extends Phaser.Scene {
  private parentLock?: ParentLock;
  private settingsPanel?: SettingsPanel;
  /** Sticker thumbnails currently on the shelf (rebuilt after a progress reset). */
  private stickerImages: Phaser.GameObjects.Image[] = [];
  private entranceIndex = 0;
  /** Game id whose sticker was just earned; highlighted on this visit. */
  private justEarned?: string;
  /** Pending idle-attract timer. */
  private idleCallTimer?: Phaser.Time.TimerEvent;
  /** True once the attract cue has started for the current idle period. */
  private idleAttractActive = false;
  /** Tiles used as wiggle targets by the attract cue. */
  private attractTargets: Phaser.GameObjects.Rectangle[] = [];
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

    this.createMascot();

    if (!reducedMotion) {
      this.createDecorations();
    }

    const startX =
      (this.cameras.main.width - GRID_COLS * TILE_WIDTH - (GRID_COLS - 1) * TILE_SPACING) / 2;
    const startY =
      (this.cameras.main.height - GRID_ROWS * TILE_HEIGHT - (GRID_ROWS - 1) * TILE_SPACING) / 2;
    const startAudio = (): void => {
      const audio = AudioManager.getInstance();
      audio.resume();
      audio.playBGM();
    };

    for (let i = 0; i < GAME_TILES.length; i++) {
      const col = i % GRID_COLS;
      const row = Math.floor(i / GRID_COLS);
      const x = startX + col * (TILE_WIDTH + TILE_SPACING) + TILE_WIDTH / 2;
      const y = startY + row * (TILE_HEIGHT + TILE_SPACING) + TILE_HEIGHT / 2;

      const tile = this.add.rectangle(x, y, TILE_WIDTH, TILE_HEIGHT, 0x2b6cb0);
      tile.setInteractive();
      this.attractTargets.push(tile);
      // Navigate on release so the press squish is visible while holding;
      // releasing outside the tile (pointerout/pointercancel) cancels.
      tile.on("pointerup", () => {
        startAudio();
        // Lazy-load the game chunk (dynamic import + scene registration)
        // before the fade-out transition starts the target scene.
        void ensureSceneLoaded(this, GAME_TILES[i].sceneKey).then(() => {
          transitionToScene(this, GAME_TILES[i].sceneKey);
        });
      });

      const label = this.add.text(x, y, GAME_TILES[i].label, {
        fontSize: "18px",
        color: "#ffffff",
      });
      label.setOrigin(0.5);

      this.animateEntrance([tile, label], () => {
        attachPressFeedback(tile, { spring: true });
      });

      if (!reducedMotion) {
        this.tweens.add({
          targets: [tile, label],
          y: y - BOB_AMPLITUDE,
          duration: BOB_DURATION,
          yoyo: true,
          repeat: -1,
          ease: "Sine.inOut",
          delay: i * BOB_PHASE_OFFSET,
        });
      }

      this.createShelfSticker(i, x, y);
    }

    this.input.on("pointerdown", () => {
      this.resetIdleAttract();
    });
    this.scheduleIdleAttract();

    const settingsButton = this.add.text(this.cameras.main.width - 20, 20, "Settings", {
      fontSize: "18px",
      color: "#2d3748",
    });
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
        this.settingsPanel = new SettingsPanel(this, undefined, () => this.rerenderStickerShelf());
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
      this.idleCallTimer?.remove();
      this.idleCallTimer = undefined;
      this.mascot?.destroy();
      this.mascot = undefined;
      this.stickerImages = [];
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
    chip.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(0, 0, AVATAR_CHIP_HIT, AVATAR_CHIP_HIT),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    });
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
      avatar.setInteractive({
        hitArea: new Phaser.Geom.Rectangle(0, 0, PICKER_AVATAR_DISPLAY, PICKER_AVATAR_DISPLAY),
        hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      });
      const baseScale = PICKER_AVATAR_DISPLAY / AVATAR_TEXTURE_SIZE;
      avatar.setScale(profile.id === activeId ? baseScale * 1.15 : baseScale);
      avatar.on("pointerup", () => {
        if (profile.id !== activeId) {
          switchProfile(profile.id);
          this.rerenderStickerShelf();
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
   * Places Professor Hoot in the bottom-right corner: waves on load, cheers
   * when the visit follows a newly earned sticker, then settles into the idle
   * loop. Touch-inert and behind gameplay z-order by component design.
   */
  private createMascot(): void {
    this.mascot = createCornerMascot(this);
    this.mascot.wave();
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
      if (!isReducedMotion()) {
        for (let i = 0; i < this.attractTargets.length; i++) {
          this.tweens.add({
            targets: this.attractTargets[i],
            angle: WIGGLE_ANGLE,
            duration: WIGGLE_DURATION,
            yoyo: true,
            repeat: -1,
            ease: "Sine.inOut",
            delay: i * WIGGLE_PHASE_OFFSET,
          });
        }
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
  private createShelfSticker(index: number, x: number, y: number): void {
    const earned = hasSticker(GAME_TILES[index].gameId);
    const sticker = this.add.image(
      x,
      y + TILE_HEIGHT / 2 - 20,
      `sticker_${GAME_TILES[index].gameId.replace(/-/g, "_")}`,
    );
    this.stickerImages.push(sticker);

    if (earned) {
      if (GAME_TILES[index].gameId === this.justEarned) {
        sticker.setScale(STICKER_SCALE * JUST_EARNED_SCALE);
        this.animateJustEarned(sticker);
      } else {
        sticker.setScale(STICKER_SCALE);
        this.animateEntrance([sticker], () => this.addSparkle(sticker), STICKER_SCALE);
      }
    } else {
      sticker.setScale(STICKER_SCALE * UNEARNED_SCALE);
      this.animateUnearned(sticker);
    }
  }

  /**
   * Rebuilds the sticker shelf from storage after a parental progress reset so
   * cleared stickers immediately show as dimmed on the Hub.
   */
  private rerenderStickerShelf(): void {
    for (const sticker of this.stickerImages) sticker.destroy();
    this.stickerImages = [];
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
   * Fades an unearned sticker in dimmed and slightly smaller, with no sparkle,
   * so the collection goal stays visible. Under reduced motion only alpha.
   */
  private animateUnearned(sticker: Phaser.GameObjects.Image): void {
    const index = this.entranceIndex;
    this.entranceIndex += 1;
    const config: Phaser.Types.Tweens.TweenBuilderConfig = {
      targets: sticker,
      alpha: UNEARNED_ALPHA,
      delay: index * ENTRANCE_STAGGER,
      duration: ENTRANCE_DURATION,
      ease: "Sine.out",
    };
    sticker.setAlpha(0);
    if (!isReducedMotion()) {
      sticker.setScale(0);
      config.scaleX = UNEARNED_SCALE * STICKER_SCALE;
      config.scaleY = UNEARNED_SCALE * STICKER_SCALE;
    }
    this.tweens.add(config);
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
   * @param targetScale - Scale to end at (defaults to 1; stickers pass their base scale).
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
