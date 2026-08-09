import Phaser from "phaser";
import { AudioManager } from "../audio/AudioManager";
import { PROFILE_AVATAR_TEXTURES } from "../game/profileLogic";
import {
  formatAccuracyPercent,
  getAccuracy,
  isMastered,
  relativeLastPlayed,
} from "../game/progressLogic";
import { availableVoiceOptions, type VoiceOption } from "../game/voiceLogic";
import { type GameId, MAX_PROFILES } from "../types";
import { createInstallTracker, type InstallTracker } from "../utils/pwaInstall";
import { setPreferredVoiceURI, speakWord } from "../utils/speech";
import {
  addProfile,
  deleteProfile,
  getActiveProfile,
  getAvailableAvatars,
  getPlayTime,
  getProfiles,
  getProgress,
  getSettings,
  resetProgress,
  setPlayTimeLimit,
  updateSettings,
} from "../utils/storage";
import { textStyle } from "../utils/typography";
import { allowPinchZoom, restorePinchZoom } from "../utils/viewportZoom";

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
const PANEL_HEIGHT = 760;
const TOGGLE_WIDTH = 240;
const TOGGLE_HEIGHT = 96;
const ROW_HEIGHT = 64;
/** Avatar textures are rasterized at this size (matches PreloadScene). */
const AVATAR_TEXTURE_SIZE = 512;
/** Daily play-time limit options cycled by the per-profile chip (null = Off). */
const PLAY_TIME_OPTIONS: ReadonlyArray<number | null> = [null, 15, 30, 45, 60];
/** Sample phrase spoken by the voice preview button. */
const VOICE_PREVIEW_TEXT = "Hi! I can talk.";
/** Longest voice label shown in the chip before truncation. */
const VOICE_LABEL_MAX = 24;
/** Game rows shown per page in the Learning Progress overlay. */
const PROGRESS_PAGE_SIZE = 8;
/** Vertical pitch between progress rows (two text lines each). */
const PROGRESS_ROW_PITCH = 40;
/** Center-relative Y of the first progress row. */
const PROGRESS_ROW_START_Y = -150;
/** Center-relative Y of the 7-day activity strip label. */
const PROGRESS_STRIP_LABEL_Y = 230;
/** Center-relative Y of the 7-day activity bars. */
const PROGRESS_STRIP_Y = 265;
/** Width of one activity bar. */
const PROGRESS_BAR_WIDTH = 24;
/** Number of day bars in the 7-day activity strip. */
const PROGRESS_BAR_COUNT = 7;
/** Height of the tallest activity bar. */
const PROGRESS_BAR_HEIGHT = 36;
/** Horizontal gap between activity bars. */
const PROGRESS_BAR_GAP = 6;
/** Track color for the per-game accuracy bar. */
const ACCURACY_TRACK_COLOR = 0xe8e0d0;
/** Fill color for the per-game accuracy bar. */
const ACCURACY_FILL_COLOR = 0x68d391;
/** Mastery badge shown next to games with at least 3 wins. */
const MASTERY_STAR = "★";

/** The 15 games in hub order, for the Learning Progress report rows. */
const PROGRESS_GAME_ROWS: ReadonlyArray<{ gameId: GameId; label: string; tileKey: string }> = [
  { gameId: "shape-sorter", label: "Shape Sorter", tileKey: "tile_shape_sorter" },
  { gameId: "animal-trace", label: "Animal Trace", tileKey: "tile_animal_trace" },
  { gameId: "pop-freeze", label: "Pop & Freeze", tileKey: "tile_pop_freeze" },
  { gameId: "shadow-match", label: "Shadow Match", tileKey: "tile_shadow_match" },
  { gameId: "musical-memory", label: "Musical Memory", tileKey: "tile_musical_memory" },
  { gameId: "big-small", label: "Big & Small", tileKey: "tile_big_small" },
  { gameId: "pattern-builder", label: "Pattern Builder", tileKey: "tile_pattern_builder" },
  { gameId: "alphabet-match", label: "Find the Letter", tileKey: "tile_alphabet" },
  { gameId: "word-match", label: "Find the Word", tileKey: "tile_word_match" },
  { gameId: "word-builder", label: "Build the Word", tileKey: "tile_word_builder" },
  { gameId: "how-many", label: "How Many?", tileKey: "tile_how_many" },
  { gameId: "first-sounds", label: "First Sounds", tileKey: "tile_first_sounds" },
  { gameId: "more-less", label: "More or Less", tileKey: "tile_more_less" },
  { gameId: "odd-one-out", label: "Odd One Out", tileKey: "tile_odd_one_out" },
  { gameId: "color-match", label: "Color Match", tileKey: "tile_color_match" },
];

/** "Off" for an unlimited budget, otherwise "15m"-style labels. */
function playTimeLabel(limitMinutes: number | null): string {
  return limitMinutes === null ? "Off" : `${limitMinutes}m`;
}

/** Truncates a long voice label for the narrow chip, e.g. "en-US — Goog…". */
function truncateLabel(label: string, max = VOICE_LABEL_MAX): string {
  return label.length <= max ? label : `${label.slice(0, max - 1)}…`;
}

/** Renders the parental settings controls above the HubScene. */
export class SettingsPanel {
  private readonly scene: Phaser.Scene;
  private readonly objects: Phaser.GameObjects.GameObject[] = [];
  private readonly overlayObjects: Phaser.GameObjects.GameObject[] = [];
  private readonly modalObjects: Phaser.GameObjects.GameObject[] = [];
  private readonly installTracker: InstallTracker;
  private resetRowText: Phaser.GameObjects.Text | null = null;
  private voiceChip: Phaser.GameObjects.Text | null = null;
  private voiceOptions: VoiceOption[] = [];
  private voiceIndex = 0;
  /** Current page (0-based) of the Learning Progress overlay. */
  private progressPage = 0;
  /** Profile whose report is shown; null means the active profile. */
  private progressProfileId: string | null = null;
  private readonly onProgressReset?: () => void;

  /** Rebuilds the voice picker list when the platform loads voices late. */
  private readonly voiceChangedHandler = (): void => {
    this.syncVoiceSelection();
    this.voiceChip?.setText(`Voice: ${truncateLabel(this.voiceOptions[this.voiceIndex].label)}`);
  };

  /**
   * Refreshes the voice options from the platform and resolves the chip index
   * against the stored preference (falling back to "Default (device)" when the
   * URI is unset or no longer installed).
   */
  private syncVoiceSelection(): void {
    this.voiceOptions = availableVoiceOptions(window.speechSynthesis?.getVoices?.() ?? []);
    const stored = getSettings().preferredVoiceURI;
    this.voiceIndex = Math.max(
      0,
      this.voiceOptions.findIndex((option) => option.voiceURI === stored),
    );
  }

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
        .text(
          centerX,
          centerY - 105,
          "Settings",
          textStyle({
            color: "#2d3748",
            fontSize: "36px",
          }),
        )
        .setOrigin(0.5),
    );
    this.createToggle(centerX, centerY - 45, "BGM", settings.bgmEnabled);
    this.createToggle(centerX, centerY + 55, "SFX", settings.sfxEnabled);
    this.createProfilesRow(centerX, centerY + 125);
    this.createProgressRow(centerX, centerY + 185);
    this.createResetRow(centerX, centerY + 245);
    this.createInstallRow(centerX, centerY + 305);
    this.createVoiceRow(centerX, centerY + 355);
    // Voices load asynchronously on some platforms; refresh the chip list.
    const synth = window.speechSynthesis;
    if (synth && typeof synth.addEventListener === "function") {
      synth.addEventListener("voiceschanged", this.voiceChangedHandler);
    }
    this.objects.push(
      scene.add
        .text(
          centerX,
          centerY - 75,
          `v${__APP_VERSION__}`,
          textStyle({
            color: DISABLED_COLOR,
            fontSize: "24px",
          }),
        )
        .setOrigin(0.5),
    );
  }

  /** Destroys the modal, the install overlay, and all display objects. */
  destroy(): void {
    const synth = window.speechSynthesis;
    if (synth && typeof synth.removeEventListener === "function") {
      synth.removeEventListener("voiceschanged", this.voiceChangedHandler);
    }
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
      .text(
        x,
        y,
        `${label}: ${enabled ? "ON" : "OFF"}`,
        textStyle({
          color: enabled ? ENABLED_COLOR : DISABLED_COLOR,
          fontSize: "34px",
        }),
      )
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
      .text(
        x,
        y,
        label,
        textStyle({
          color: PRIMARY_COLOR,
          fontSize: "32px",
        }),
      )
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

  /**
   * Adds the device-level TTS voice row: a chip cycling through the installed
   * voices (plus "Default (device)") and a Preview button that speaks a sample
   * phrase with the current selection, honoring the SFX toggle.
   */
  private createVoiceRow(x: number, y: number): void {
    this.syncVoiceSelection();

    const chip = this.scene.add
      .text(
        x - 30,
        y,
        `Voice: ${truncateLabel(this.voiceOptions[this.voiceIndex].label)}`,
        textStyle({
          color: PRIMARY_COLOR,
          fontSize: "26px",
        }),
      )
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
      this.voiceIndex = (this.voiceIndex + 1) % this.voiceOptions.length;
      const next = this.voiceOptions[this.voiceIndex];
      updateSettings({ preferredVoiceURI: next.voiceURI });
      setPreferredVoiceURI(next.voiceURI);
      chip.setText(`Voice: ${truncateLabel(next.label)}`);
    });
    this.objects.push(chip);
    this.voiceChip = chip;

    const preview = this.scene.add
      .text(
        x + 170,
        y,
        "Preview",
        textStyle({
          color: ENABLED_COLOR,
          fontSize: "26px",
        }),
      )
      .setOrigin(0.5);
    preview.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(
        -TOGGLE_WIDTH / 4,
        -ROW_HEIGHT / 2,
        TOGGLE_WIDTH / 2,
        ROW_HEIGHT,
      ),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    });
    preview.on("pointerdown", () => {
      setPreferredVoiceURI(getSettings().preferredVoiceURI);
      speakWord(VOICE_PREVIEW_TEXT, getSettings().sfxEnabled);
    });
    this.objects.push(preview);
  }

  /** Adds the parental "Profiles" row that opens the profile manager overlay. */
  private createProfilesRow(x: number, y: number): void {
    const row = this.scene.add
      .text(
        x,
        y,
        "Profiles",
        textStyle({
          color: PRIMARY_COLOR,
          fontSize: "32px",
        }),
      )
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

  /** Adds the parental "Progress" row that opens the Learning Progress overlay. */
  private createProgressRow(x: number, y: number): void {
    const row = this.scene.add
      .text(
        x,
        y,
        "Progress",
        textStyle({
          color: PRIMARY_COLOR,
          fontSize: "32px",
        }),
      )
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
    row.on("pointerdown", () => this.openProgressOverlay());
    this.objects.push(row);
  }

  /**
   * Opens the per-profile Learning Progress report: profile switcher, paged
   * per-game rows (plays, accuracy bar + %, mastery star, last played), and
   * the 7-day activity strip. Read-only: switching the viewed profile never
   * changes the active profile.
   */
  private openProgressOverlay(): void {
    this.closeProgressOverlay();
    this.progressPage = 0;
    this.progressProfileId = getActiveProfile().id;
    this.renderProgressOverlay();
  }

  /** Renders (or re-renders) the Learning Progress overlay content. */
  private renderProgressOverlay(): void {
    this.closeProgressOverlay();
    const { width, height } = this.scene.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2;
    const viewedId = this.progressProfileId ?? getActiveProfile().id;
    const progress = getProgress(viewedId);

    const backdrop = this.scene.add
      .rectangle(centerX, centerY, width, height, BACKDROP_COLOR, OVERLAY_ALPHA)
      .setInteractive();
    backdrop.on("pointerdown", () => this.closeProgressOverlay());
    this.overlayObjects.push(backdrop);
    this.overlayObjects.push(
      this.scene.add
        .rectangle(centerX, centerY, PANEL_WIDTH, PANEL_HEIGHT, PANEL_COLOR)
        .setStrokeStyle(4, OUTLINE_COLOR),
    );
    this.overlayObjects.push(
      this.scene.add
        .text(
          centerX,
          centerY - 250,
          "Learning Progress",
          textStyle({
            color: "#2d3748",
            fontSize: "36px",
          }),
        )
        .setOrigin(0.5),
    );

    const close = this.scene.add
      .text(
        centerX + PANEL_WIDTH / 2 - 32,
        centerY - 250,
        "X",
        textStyle({
          color: "#2d3748",
          fontSize: "32px",
        }),
      )
      .setOrigin(0.5);
    close.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(
        -TOGGLE_HEIGHT / 2,
        -TOGGLE_HEIGHT / 2,
        TOGGLE_HEIGHT,
        TOGGLE_HEIGHT,
      ),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    });
    close.on("pointerdown", () => this.closeProgressOverlay());
    this.overlayObjects.push(close);

    const profiles = getProfiles();
    profiles.forEach((profile, index) => {
      const x = centerX + (index - (profiles.length - 1) / 2) * 56;
      const chip = this.scene.add.image(
        x,
        centerY - 195,
        PROFILE_AVATAR_TEXTURES[profile.avatarId],
      );
      chip.setScale(64 / AVATAR_TEXTURE_SIZE);
      chip.setInteractive({
        hitArea: new Phaser.Geom.Rectangle(-48, -48, 96, 96),
        hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      });
      chip.on("pointerdown", () => {
        if (profile.id !== viewedId) {
          this.progressProfileId = profile.id;
          this.renderProgressOverlay();
        }
      });
      this.overlayObjects.push(chip);
    });

    const pageStart = this.progressPage * PROGRESS_PAGE_SIZE;
    const pageEnd = Math.min(pageStart + PROGRESS_PAGE_SIZE, PROGRESS_GAME_ROWS.length);
    for (let i = pageStart; i < pageEnd; i += 1) {
      const row = PROGRESS_GAME_ROWS[i];
      const y = centerY + PROGRESS_ROW_START_Y + (i - pageStart) * PROGRESS_ROW_PITCH;
      const game = progress[row.gameId];
      const accuracy = getAccuracy(game);

      const icon = this.scene.add.image(centerX - 182, y, row.tileKey);
      icon.setScale(28 / AVATAR_TEXTURE_SIZE);
      this.overlayObjects.push(icon);

      const name = this.scene.add
        .text(
          centerX - 158,
          y,
          `${isMastered(game) ? `${MASTERY_STAR} ` : ""}${row.label}`,
          textStyle({
            color: "#2d3748",
            fontSize: "30px",
          }),
        )
        .setOrigin(0, 0.5);
      this.overlayObjects.push(name);

      const stats = this.scene.add
        .text(
          centerX - 158,
          y + 26,
          `${game.plays} plays · ${formatAccuracyPercent(game)} · ${relativeLastPlayed(game.lastPlayedAt)}`,
          textStyle({
            color: PRIMARY_COLOR,
            fontSize: "26px",
          }),
        )
        .setOrigin(0, 0.5);
      this.overlayObjects.push(stats);

      const track = this.scene.add.rectangle(centerX + 130, y, 120, 10, ACCURACY_TRACK_COLOR);
      this.overlayObjects.push(track);
      if (accuracy !== null) {
        const fill = this.scene.add.rectangle(
          centerX + 70 + (accuracy * 120) / 2,
          y,
          Math.max(2, Math.round(accuracy * 120)),
          10,
          ACCURACY_FILL_COLOR,
        );
        this.overlayObjects.push(fill);
      }
    }

    const pageCount = Math.ceil(PROGRESS_GAME_ROWS.length / PROGRESS_PAGE_SIZE);
    this.overlayObjects.push(
      this.scene.add
        .text(
          centerX - 20,
          centerY + 175,
          `${this.progressPage + 1} / ${pageCount}`,
          textStyle({
            color: DISABLED_COLOR,
            fontSize: "30px",
          }),
        )
        .setOrigin(0.5),
    );
    const pageButton = this.scene.add
      .text(
        centerX + 60,
        centerY + 175,
        this.progressPage + 1 < pageCount ? "More" : "Back",
        textStyle({
          color: PRIMARY_COLOR,
          fontSize: "30px",
        }),
      )
      .setOrigin(0.5);
    pageButton.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(
        -TOGGLE_WIDTH / 4,
        -ROW_HEIGHT / 2,
        TOGGLE_WIDTH / 2,
        ROW_HEIGHT,
      ),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    });
    pageButton.on("pointerdown", () => {
      this.progressPage = (this.progressPage + 1) % pageCount;
      this.renderProgressOverlay();
    });
    this.overlayObjects.push(pageButton);

    const activity = getProfiles().find((profile) => profile.id === viewedId)?.activity ?? [];
    const totalPlays = activity.reduce((sum, entry) => sum + entry.plays, 0);
    this.overlayObjects.push(
      this.scene.add
        .text(
          centerX,
          centerY + PROGRESS_STRIP_LABEL_Y,
          `Last 7 days · ${totalPlays} plays`,
          textStyle({
            color: "#2d3748",
            fontSize: "30px",
          }),
        )
        .setOrigin(0.5),
    );
    const maxPlays = Math.max(1, ...activity.map((entry) => entry.plays));
    const startX =
      centerX - ((PROGRESS_BAR_COUNT - 1) * (PROGRESS_BAR_WIDTH + PROGRESS_BAR_GAP)) / 2;
    for (let i = 0; i < PROGRESS_BAR_COUNT; i += 1) {
      const entry = activity[i];
      const plays = entry?.plays ?? 0;
      const barHeight =
        plays === 0 ? 4 : Math.max(10, Math.round((PROGRESS_BAR_HEIGHT * plays) / maxPlays));
      this.overlayObjects.push(
        this.scene.add.rectangle(
          startX + i * (PROGRESS_BAR_WIDTH + PROGRESS_BAR_GAP),
          centerY + PROGRESS_STRIP_Y,
          PROGRESS_BAR_WIDTH,
          barHeight,
          ACCURACY_FILL_COLOR,
        ),
      );
    }
  }

  /** Destroys the Learning Progress overlay (not the panel). */
  private closeProgressOverlay(): void {
    for (const object of this.overlayObjects) object.destroy();
    this.overlayObjects.length = 0;
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
        .text(
          centerX,
          centerY - 250,
          "Profiles",
          textStyle({
            color: "#2d3748",
            fontSize: "36px",
          }),
        )
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
        .text(
          centerX + 60,
          y,
          "Delete",
          textStyle({
            color: DANGER_COLOR,
            fontSize: "30px",
          }),
        )
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
        .text(
          centerX - 10,
          y,
          `Play Time: ${playTimeLabel(limit)}`,
          textStyle({
            color: PRIMARY_COLOR,
            fontSize: "26px",
          }),
        )
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
          .text(
            centerX,
            centerY + 116,
            "Profile limit reached",
            textStyle({
              color: DISABLED_COLOR,
              fontSize: "30px",
            }),
          )
          .setOrigin(0.5),
      );
    } else {
      this.overlayObjects.push(
        this.scene.add
          .text(
            centerX,
            centerY + 96,
            "Add Profile",
            textStyle({
              color: PRIMARY_COLOR,
              fontSize: "30px",
            }),
          )
          .setOrigin(0.5),
      );
      const totalWidth = available.length * 80 + (available.length - 1) * 36;
      let x = centerX - totalWidth / 2 + 40;
      const y = centerY + 146;
      for (const avatarId of available) {
        const avatar = this.scene.add.image(x, y, PROFILE_AVATAR_TEXTURES[avatarId]);
        avatar.setScale(80 / AVATAR_TEXTURE_SIZE);
        avatar.setInteractive();
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
        .text(
          centerX,
          centerY - 105,
          "Delete profile?",
          textStyle({
            color: "#2d3748",
            fontSize: "36px",
          }),
        )
        .setOrigin(0.5),
    );
    this.modalObjects.push(
      this.scene.add
        .text(
          centerX,
          centerY - 25,
          "This profile's stickers will be lost.",
          textStyle({
            color: "#2d3748",
            fontSize: "30px",
          }),
        )
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
        .text(
          centerX,
          centerY - 105,
          "Install on iOS",
          textStyle({
            color: "#2d3748",
            fontSize: "36px",
          }),
        )
        .setOrigin(0.5),
    );
    this.overlayObjects.push(
      this.scene.add
        .text(
          centerX,
          centerY - 25,
          "1. Tap the Share icon",
          textStyle({
            color: "#2d3748",
            fontSize: "30px",
          }),
        )
        .setOrigin(0.5),
    );
    this.overlayObjects.push(
      this.scene.add
        .text(
          centerX,
          centerY + 35,
          "2. Choose Add to Home Screen",
          textStyle({
            color: "#2d3748",
            fontSize: "30px",
          }),
        )
        .setOrigin(0.5),
    );
    this.overlayObjects.push(
      this.scene.add
        .text(
          centerX,
          centerY + 95,
          "3. Open Aby's Little Lab offline",
          textStyle({
            color: "#2d3748",
            fontSize: "30px",
          }),
        )
        .setOrigin(0.5),
    );
    const close = this.scene.add
      .text(
        centerX,
        centerY + 175,
        "Close",
        textStyle({
          color: PRIMARY_COLOR,
          fontSize: "30px",
        }),
      )
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
      .text(
        x,
        y,
        "Reset Progress",
        textStyle({
          color: DANGER_COLOR,
          fontSize: "32px",
        }),
      )
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
        .text(
          centerX,
          centerY - 105,
          "Reset all stickers?",
          textStyle({
            color: "#2d3748",
            fontSize: "36px",
          }),
        )
        .setOrigin(0.5),
    );
    this.overlayObjects.push(
      this.scene.add
        .text(
          centerX,
          centerY - 25,
          "All stickers will be cleared.",
          textStyle({
            color: "#2d3748",
            fontSize: "30px",
          }),
        )
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
      .text(
        x,
        y,
        label,
        textStyle({
          color,
          fontSize: "30px",
        }),
      )
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
