import Phaser from "phaser";
import { AudioManager } from "../audio/AudioManager";
import { PROFILE_AVATAR_TEXTURES } from "../game/profileLogic";
import { MAX_PROFILES } from "../types";
import { createInstallTracker, type InstallTracker } from "../utils/pwaInstall";
import { allowPinchZoom, restorePinchZoom } from "../utils/viewportZoom";
import {
  addProfile,
  deleteProfile,
  getAvailableAvatars,
  getPlayTime,
  getProfiles,
  getSettings,
  resetProgress,
  setPlayTimeLimit,
} from "../utils/storage";
import { textStyle } from "../utils/typography";

const BACKDROP_COLOR = 0x000000;
const BACKDROP_ALPHA = 0.6;
const OVERLAY_ALPHA = 0.75;
const PANEL_COLOR = 0xfff8e7;
const OUTLINE_COLOR = 0x2d3748;
const ENABLED_COLOR = "#68d391";
const DISABLED_COLOR = "#a0aec0";
const PRIMARY_COLOR = "#2b6cb0";
const DANGER_COLOR = "#fc8181";
const PANEL_WIDTH = 480;
const PANEL_HEIGHT = 560;
const TOGGLE_WIDTH = 240;
const TOGGLE_HEIGHT = 96;
const ROW_HEIGHT = 64;
/** Avatar textures are rasterized at this size (matches PreloadScene). */
const AVATAR_TEXTURE_SIZE = 512;
/** Daily play-time limit options cycled by the per-profile chip (null = Off). */
const PLAY_TIME_OPTIONS: ReadonlyArray<number | null> = [null, 15, 30, 45, 60];

/** "Off" for an unlimited budget, otherwise "15m"-style labels. */
function playTimeLabel(limitMinutes: number | null): string {
  return limitMinutes === null ? "Off" : `${limitMinutes}m`;
}

/** Renders the parental settings controls above the HubScene. */
export class SettingsPanel {
  private readonly scene: Phaser.Scene;
  private readonly objects: Phaser.GameObjects.GameObject[] = [];
  private readonly overlayObjects: Phaser.GameObjects.GameObject[] = [];
  private readonly modalObjects: Phaser.GameObjects.GameObject[] = [];
  private readonly installTracker: InstallTracker;
  private resetRowText: Phaser.GameObjects.Text | null = null;
  private readonly onProgressReset?: () => void;

  /**
   * Creates the settings panel using the current persisted audio settings.
   * @param installTracker - Injected install tracker (tests); defaults to a
   *   tracker wired to real browser install events.
   * @param onProgressReset - Called after a confirmed progress reset so the
   *   parent scene can re-render anything derived from the sticker collection.
   */
  constructor(scene: Phaser.Scene, installTracker?: InstallTracker, onProgressReset?: () => void) {
    this.scene = scene;
    this.onProgressReset = onProgressReset;
    this.installTracker =
      installTracker ??
      createInstallTracker({
        userAgent: navigator.userAgent,
        isStandalone: () =>
          typeof window.matchMedia === "function" &&
          window.matchMedia("(display-mode: standalone)").matches,
        addEventListener: (type, listener) => window.addEventListener(type, listener),
        removeEventListener: (type, listener) => window.removeEventListener(type, listener),
      });
    // Parents read the panel's text on phones; relax the pinch-zoom lock only
    // while the panel is open, restoring it on close.
    allowPinchZoom();
    const { width, height } = scene.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2;
    const settings = getSettings();

    const backdrop = scene.add
      .rectangle(centerX, centerY, width, height, BACKDROP_COLOR, BACKDROP_ALPHA)
      .setInteractive();
    backdrop.on("pointerdown", () => this.destroy());
    this.objects.push(backdrop);
    this.objects.push(
      scene.add
        .rectangle(centerX, centerY, PANEL_WIDTH, PANEL_HEIGHT, PANEL_COLOR)
        .setStrokeStyle(4, OUTLINE_COLOR),
    );
    this.objects.push(
      scene.add
        .text(centerX, centerY - 105, "Settings", textStyle({
          color: "#2d3748",
          fontSize: "36px",
        }))
        .setOrigin(0.5),
    );
    this.createToggle(centerX, centerY - 45, "BGM", settings.bgmEnabled);
    this.createToggle(centerX, centerY + 55, "SFX", settings.sfxEnabled);
    this.createProfilesRow(centerX, centerY + 125);
    this.createResetRow(centerX, centerY + 195);
    this.createInstallRow(centerX, centerY + 255);
    this.objects.push(
      scene.add
        .text(centerX, centerY + 230, `v${__APP_VERSION__}`, textStyle({
          color: DISABLED_COLOR,
          fontSize: "24px",
        }))
        .setOrigin(0.5),
    );
  }

  /** Destroys the modal, the install overlay, and all display objects. */
  destroy(): void {
    for (const object of this.modalObjects) object.destroy();
    this.modalObjects.length = 0;
    for (const object of this.overlayObjects) object.destroy();
    this.overlayObjects.length = 0;
    for (const object of this.objects) object.destroy();
    this.installTracker.destroy();
    restorePinchZoom();
  }

  /** Creates one inflated, touch-friendly settings label. */
  private createToggle(
    x: number,
    y: number,
    label: string,
    enabled: boolean,
  ): Phaser.GameObjects.Text {
    const toggle = this.scene.add
      .text(x, y, `${label}: ${enabled ? "ON" : "OFF"}`, textStyle({
        color: enabled ? ENABLED_COLOR : DISABLED_COLOR,
        fontSize: "34px",
      }))
      .setOrigin(0.5);
    toggle.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(
        -TOGGLE_WIDTH / 2,
        -TOGGLE_HEIGHT / 2,
        TOGGLE_WIDTH,
        TOGGLE_HEIGHT,
      ),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    });
    toggle.on("pointerdown", () => {
      const nextEnabled = !enabled;
      enabled = nextEnabled;
      const audio = AudioManager.getInstance();

      if (label === "BGM") {
        audio.setBGMEnabled(nextEnabled);
        if (nextEnabled) audio.playBGM();
        else audio.pauseBGM();
      } else {
        audio.setSFXEnabled(nextEnabled);
        if (nextEnabled) audio.playCorrect();
      }

      toggle.setText(`${label}: ${nextEnabled ? "ON" : "OFF"}`);
      toggle.setColor(nextEnabled ? ENABLED_COLOR : DISABLED_COLOR);
    });
    this.objects.push(toggle);
    return toggle;
  }

  /**
   * Adds a context-aware install control: "Install App" where a browser
   * install prompt is available, "How to Install" on iOS (which has no
   * prompt), and nothing when the app is already installed.
   */
  private createInstallRow(x: number, y: number): void {
    const state = this.installTracker.getState();
    if (state === "hidden") return;

    const label = state === "installable" ? "Install App" : "How to Install";
    const button = this.scene.add
      .text(x, y, label, textStyle({
        color: PRIMARY_COLOR,
        fontSize: "32px",
      }))
      .setOrigin(0.5);
    button.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(
        -TOGGLE_WIDTH / 2,
        -ROW_HEIGHT / 2,
        TOGGLE_WIDTH,
        ROW_HEIGHT,
      ),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    });
    button.on("pointerdown", () => {
      if (state === "installable") {
        void this.installTracker.prompt();
      } else {
        this.showIosOverlay();
      }
    });
    this.objects.push(button);
  }

  /** Adds the parental "Profiles" row that opens the profile manager overlay. */
  private createProfilesRow(x: number, y: number): void {
    const row = this.scene.add
      .text(x, y, "Profiles", textStyle({
        color: PRIMARY_COLOR,
        fontSize: "32px",
      }))
      .setOrigin(0.5);
    row.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(
        -TOGGLE_WIDTH / 2,
        -ROW_HEIGHT / 2,
        TOGGLE_WIDTH,
        ROW_HEIGHT,
      ),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    });
    row.on("pointerdown", () => this.openProfilesOverlay());
    this.objects.push(row);
  }

  /**
   * Opens the profile manager overlay: one row per profile (avatar + Delete)
   * plus unused avatars for adding new profiles (up to 4). Rebuilds itself
   * after add/delete so the list always reflects persisted state.
   */
  private openProfilesOverlay(): void {
    this.closeProfilesOverlay();
    const { width, height } = this.scene.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2;
    const profiles = getProfiles();
    const available = getAvailableAvatars();

    const backdrop = this.scene.add
      .rectangle(centerX, centerY, width, height, BACKDROP_COLOR, OVERLAY_ALPHA)
      .setInteractive();
    backdrop.on("pointerdown", () => this.closeProfilesOverlay());
    this.overlayObjects.push(backdrop);
    this.overlayObjects.push(
      this.scene.add
        .rectangle(centerX, centerY, PANEL_WIDTH, PANEL_HEIGHT, PANEL_COLOR)
        .setStrokeStyle(4, OUTLINE_COLOR),
    );
    this.overlayObjects.push(
      this.scene.add
        .text(centerX, centerY - 250, "Profiles", textStyle({
          color: "#2d3748",
          fontSize: "36px",
        }))
        .setOrigin(0.5),
    );

    profiles.forEach((profile, index) => {
      const y = centerY - 194 + index * 80;
      const avatar = this.scene.add.image(
        centerX - 110,
        y,
        PROFILE_AVATAR_TEXTURES[profile.avatarId],
      );
      avatar.setScale(96 / AVATAR_TEXTURE_SIZE);
      this.overlayObjects.push(avatar);
      const remove = this.scene.add
        .text(centerX + 60, y, "Delete", textStyle({
          color: DANGER_COLOR,
          fontSize: "30px",
        }))
        .setOrigin(0.5);
      remove.setInteractive({
        hitArea: new Phaser.Geom.Rectangle(
          -TOGGLE_WIDTH / 2,
          -ROW_HEIGHT / 2,
          TOGGLE_WIDTH,
          ROW_HEIGHT,
        ),
        hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      });
      remove.on("pointerdown", () => this.showDeleteProfileModal(profile.id));
      this.overlayObjects.push(remove);

      const limit = getPlayTime(profile.id).limitMinutes;
      const chip = this.scene.add
        .text(centerX - 10, y, `Play Time: ${playTimeLabel(limit)}`, textStyle({
          color: PRIMARY_COLOR,
          fontSize: "26px",
        }))
        .setOrigin(0.5);
      chip.setInteractive({
        hitArea: new Phaser.Geom.Rectangle(
          -TOGGLE_WIDTH / 4,
          -ROW_HEIGHT / 2,
          TOGGLE_WIDTH / 2,
          ROW_HEIGHT,
        ),
        hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      });
      chip.on("pointerdown", () => {
        const current = getPlayTime(profile.id).limitMinutes;
        const index = PLAY_TIME_OPTIONS.indexOf(current);
        const safeIndex = index === -1 ? 0 : index;
        const next = PLAY_TIME_OPTIONS[(safeIndex + 1) % PLAY_TIME_OPTIONS.length];
        setPlayTimeLimit(profile.id, next);
        chip.setText(`Play Time: ${playTimeLabel(next)}`);
        // Keep the Hub's indicator and lock state in sync with the new limit.
        this.onProgressReset?.();
      });
      this.overlayObjects.push(chip);
    });

    if (profiles.length >= MAX_PROFILES) {
      this.overlayObjects.push(
        this.scene.add
          .text(centerX, centerY + 116, "Profile limit reached", textStyle({
            color: DISABLED_COLOR,
            fontSize: "30px",
          }))
          .setOrigin(0.5),
      );
    } else {
      this.overlayObjects.push(
        this.scene.add
          .text(centerX, centerY + 96, "Add Profile", textStyle({
            color: PRIMARY_COLOR,
            fontSize: "30px",
          }))
          .setOrigin(0.5),
      );
      const totalWidth = available.length * 80 + (available.length - 1) * 36;
      let x = centerX - totalWidth / 2 + 40;
      const y = centerY + 146;
      for (const avatarId of available) {
        const avatar = this.scene.add.image(x, y, PROFILE_AVATAR_TEXTURES[avatarId]);
        avatar.setScale(80 / AVATAR_TEXTURE_SIZE);
        avatar.setInteractive({
          hitArea: new Phaser.Geom.Rectangle(-50, -50, 100, 100),
          hitAreaCallback: Phaser.Geom.Rectangle.Contains,
        });
        avatar.on("pointerdown", () => {
          addProfile(avatarId);
          this.openProfilesOverlay();
          this.onProgressReset?.();
        });
        this.overlayObjects.push(avatar);
        x += 80 + 36;
      }
    }

    this.overlayObjects.push(
      this.createModalButton(centerX, centerY + 220, "Close", PRIMARY_COLOR, () =>
        this.closeProfilesOverlay(),
      ),
    );
  }

  /** Destroys the profile manager overlay (not the panel). */
  private closeProfilesOverlay(): void {
    for (const object of this.overlayObjects) object.destroy();
    this.overlayObjects.length = 0;
  }

  /** Shows the two-step "Delete profile?" confirmation modal. */
  private showDeleteProfileModal(profileId: string): void {
    const { width, height } = this.scene.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2;

    const modalBackdrop = this.scene.add
      .rectangle(centerX, centerY, width, height, BACKDROP_COLOR, OVERLAY_ALPHA)
      .setInteractive();
    modalBackdrop.on("pointerdown", () => this.closeDeleteProfileModal());
    this.modalObjects.push(modalBackdrop);
    this.modalObjects.push(
      this.scene.add
        .rectangle(centerX, centerY, PANEL_WIDTH, PANEL_HEIGHT, PANEL_COLOR)
        .setStrokeStyle(4, OUTLINE_COLOR),
    );
    this.modalObjects.push(
      this.scene.add
        .text(centerX, centerY - 105, "Delete profile?", textStyle({
          color: "#2d3748",
          fontSize: "36px",
        }))
        .setOrigin(0.5),
    );
    this.modalObjects.push(
      this.scene.add
        .text(centerX, centerY - 25, "This profile's stickers will be lost.", textStyle({
          color: "#2d3748",
          fontSize: "30px",
        }))
        .setOrigin(0.5),
    );
    this.modalObjects.push(
      this.createModalButton(centerX, centerY + 45, "Cancel", PRIMARY_COLOR, () =>
        this.closeDeleteProfileModal(),
      ),
    );
    this.modalObjects.push(
      this.createModalButton(centerX, centerY + 125, "Delete", DANGER_COLOR, () =>
        this.confirmDeleteProfile(profileId),
      ),
    );
  }

  /** Closes the delete confirmation modal, keeping the profile overlay open. */
  private closeDeleteProfileModal(): void {
    for (const object of this.modalObjects) object.destroy();
    this.modalObjects.length = 0;
  }

  /** Deletes the profile, then rebuilds the profile overlay. */
  private confirmDeleteProfile(profileId: string): void {
    deleteProfile(profileId);
    this.closeDeleteProfileModal();
    this.openProfilesOverlay();
    this.onProgressReset?.();
  }

  /** Shows the iOS "Add to Home Screen" instructions overlay. */
  private showIosOverlay(): void {
    const { width, height } = this.scene.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2;

    const overlayBackdrop = this.scene.add
      .rectangle(centerX, centerY, width, height, BACKDROP_COLOR, OVERLAY_ALPHA)
      .setInteractive();
    overlayBackdrop.on("pointerdown", () => this.closeIosOverlay());
    this.overlayObjects.push(overlayBackdrop);
    this.overlayObjects.push(
      this.scene.add
        .rectangle(centerX, centerY, PANEL_WIDTH, PANEL_HEIGHT, PANEL_COLOR)
        .setStrokeStyle(4, OUTLINE_COLOR),
    );
    this.overlayObjects.push(
      this.scene.add
        .text(centerX, centerY - 105, "Install on iOS", textStyle({
          color: "#2d3748",
          fontSize: "36px",
        }))
        .setOrigin(0.5),
    );
    this.overlayObjects.push(
      this.scene.add
        .text(centerX, centerY - 25, "1. Tap the Share icon", textStyle({
          color: "#2d3748",
          fontSize: "30px",
        }))
        .setOrigin(0.5),
    );
    this.overlayObjects.push(
      this.scene.add
        .text(centerX, centerY + 35, "2. Choose Add to Home Screen", textStyle({
          color: "#2d3748",
          fontSize: "30px",
        }))
        .setOrigin(0.5),
    );
    this.overlayObjects.push(
      this.scene.add
        .text(centerX, centerY + 95, "3. Open Aby's Little Lab offline", textStyle({
          color: "#2d3748",
          fontSize: "30px",
        }))
        .setOrigin(0.5),
    );
    const close = this.scene.add
      .text(centerX, centerY + 175, "Close", textStyle({
        color: PRIMARY_COLOR,
        fontSize: "30px",
      }))
      .setOrigin(0.5);
    close.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(
        -TOGGLE_WIDTH / 2,
        -TOGGLE_HEIGHT / 2,
        TOGGLE_WIDTH,
        TOGGLE_HEIGHT,
      ),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    });
    close.on("pointerdown", () => this.closeIosOverlay());
    this.overlayObjects.push(close);
  }

  /** Destroys the iOS instructions overlay (not the panel). */
  private closeIosOverlay(): void {
    for (const object of this.overlayObjects) object.destroy();
    this.overlayObjects.length = 0;
  }

  /** Adds the parental "Reset Progress" row that clears all stickers. */
  private createResetRow(x: number, y: number): void {
    const row = this.scene.add
      .text(x, y, "Reset Progress", textStyle({
        color: DANGER_COLOR,
        fontSize: "32px",
      }))
      .setOrigin(0.5);
    row.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(
        -TOGGLE_WIDTH / 2,
        -ROW_HEIGHT / 2,
        TOGGLE_WIDTH,
        ROW_HEIGHT,
      ),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    });
    row.on("pointerdown", () => this.showResetModal());
    this.resetRowText = row;
    this.objects.push(row);
  }

  /** Shows the two-step "Reset all stickers?" confirmation modal. */
  private showResetModal(): void {
    const { width, height } = this.scene.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2;

    const modalBackdrop = this.scene.add
      .rectangle(centerX, centerY, width, height, BACKDROP_COLOR, OVERLAY_ALPHA)
      .setInteractive();
    modalBackdrop.on("pointerdown", () => this.closeResetModal());
    this.overlayObjects.push(modalBackdrop);
    this.overlayObjects.push(
      this.scene.add
        .rectangle(centerX, centerY, PANEL_WIDTH, PANEL_HEIGHT, PANEL_COLOR)
        .setStrokeStyle(4, OUTLINE_COLOR),
    );
    this.overlayObjects.push(
      this.scene.add
        .text(centerX, centerY - 105, "Reset all stickers?", textStyle({
          color: "#2d3748",
          fontSize: "36px",
        }))
        .setOrigin(0.5),
    );
    this.overlayObjects.push(
      this.scene.add
        .text(centerX, centerY - 25, "All stickers will be cleared.", textStyle({
          color: "#2d3748",
          fontSize: "30px",
        }))
        .setOrigin(0.5),
    );
    this.overlayObjects.push(
      this.createModalButton(centerX, centerY + 45, "Cancel", PRIMARY_COLOR, () =>
        this.closeResetModal(),
      ),
    );
    this.overlayObjects.push(
      this.createModalButton(centerX, centerY + 125, "Reset", DANGER_COLOR, () =>
        this.confirmReset(),
      ),
    );
  }

  /** Creates a tappable modal button with an inflated touch target. */
  private createModalButton(
    x: number,
    y: number,
    label: string,
    color: string,
    onClick: () => void,
  ): Phaser.GameObjects.Text {
    const button = this.scene.add
      .text(x, y, label, textStyle({
        color,
        fontSize: "30px",
      }))
      .setOrigin(0.5);
    button.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(
        -TOGGLE_WIDTH / 2,
        -ROW_HEIGHT / 2,
        TOGGLE_WIDTH,
        ROW_HEIGHT,
      ),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    });
    button.on("pointerdown", onClick);
    return button;
  }

  /** Closes the reset confirmation modal without changing any data. */
  private closeResetModal(): void {
    for (const object of this.overlayObjects) object.destroy();
    this.overlayObjects.length = 0;
  }

  /** Clears the sticker collection and shows inline confirmation. */
  private confirmReset(): void {
    resetProgress();
    this.closeResetModal();
    this.resetRowText?.setText("Progress cleared");
    this.resetRowText?.setColor(DISABLED_COLOR);
    this.onProgressReset?.();
  }
}
