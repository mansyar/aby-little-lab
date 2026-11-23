import type Phaser from "phaser";
import { AudioManager } from "../../audio/AudioManager";
import type { E2ESettingsToggle } from "../../game/e2eBridge";
import type { Settings } from "../../types";
import { attachPressFeedback } from "../../utils/pressFeedback";
import { updateSettings } from "../../utils/storage";
import { textStyle } from "../../utils/typography";
import type { InstallRow } from "./InstallRow";
import {
  addRowCard,
  centredHitArea,
  createRow,
  DISABLED_COLOR,
  ENABLED_COLOR,
  OUTLINE_COLOR,
  PRIMARY_COLOR,
  ROW_HIT_WIDTH,
  ROW_PITCH,
  TOGGLE_KNOB_COLOR,
  TOGGLE_KNOB_OFFSET,
  TOGGLE_KNOB_SIZE,
  TOGGLE_TRACK_HEIGHT,
  TOGGLE_TRACK_OFF_COLOR,
  TOGGLE_TRACK_ON_COLOR,
  TOGGLE_TRACK_WIDTH,
} from "./primitives";
import type { ResetModal } from "./ResetModal";
import type { VoiceRow } from "./VoiceRow";

export interface SettingsRowsDeps {
  scene: Phaser.Scene;
  /** Bucket the current page's objects go into, shared with the parent panel. */
  pageObjects: Phaser.GameObjects.GameObject[];
  installRow: InstallRow;
  voiceRow: VoiceRow;
  resetModal: ResetModal;
  onOpenProfiles: () => void;
  onOpenProgress: () => void;
}

/**
 * Page one's eight parental rows. The parent panel owns page switching and the
 * chrome; this helper owns the toggle state and the two overlay-opening rows,
 * so a page switch can drop every interactive object by clearing one bucket.
 */
export class SettingsRows {
  private readonly scene: Phaser.Scene;
  private readonly pageObjects: Phaser.GameObjects.GameObject[];
  private readonly installRow: InstallRow;
  private readonly voiceRow: VoiceRow;
  private readonly resetModal: ResetModal;
  private readonly onOpenProfiles: () => void;
  private readonly onOpenProgress: () => void;
  /**
   * The toggle rows, with the tap band they answer to and a live read of their
   * state. The switch flips a closure variable, not an object property, so the
   * value has to be asked for through this accessor rather than inspected.
   */
  private readonly toggles: Array<{
    id: string;
    x: number;
    y: number;
    value: () => boolean;
  }> = [];
  /**
   * The "Progress" row's centre, captured when the row is created. Published so
   * the browser suite taps the row's layout rather than a copied coordinate.
   */
  private progressRowPoint: { x: number; y: number } | null = null;

  constructor(deps: SettingsRowsDeps) {
    this.scene = deps.scene;
    this.pageObjects = deps.pageObjects;
    this.installRow = deps.installRow;
    this.voiceRow = deps.voiceRow;
    this.resetModal = deps.resetModal;
    this.onOpenProfiles = deps.onOpenProfiles;
    this.onOpenProgress = deps.onOpenProgress;
  }

  /** Page one: the eight settings rows, at the numbers AC-9 pins. */
  build(settings: Settings, centerX: number, rowY: (index: number) => number): void {
    const toggleAdaptive = (next: boolean): void => {
      updateSettings({ adaptiveDifficulty: next });
    };
    this.createToggle(centerX, rowY(0), "bgm", "BGM", settings.bgmEnabled);
    this.createToggle(centerX, rowY(1), "sfx", "SFX", settings.sfxEnabled);
    this.createToggle(
      centerX,
      rowY(2),
      "adaptive",
      "Adaptive",
      settings.adaptiveDifficulty,
      toggleAdaptive,
    );
    this.createProfilesRow(centerX, rowY(3));
    this.createProgressRow(centerX, rowY(4));
    this.resetModal.createRow(centerX, rowY(5));
    this.installRow.create(centerX, rowY(6));
    this.voiceRow.create(centerX, rowY(7));
  }

  /** Forgets row state before the parent destroys the page objects. */
  clear(): void {
    this.toggles.length = 0;
    this.progressRowPoint = null;
  }

  /**
   * The toggle rows with the canvas point their whole card answers to and the
   * state the child's tap would flip. Empty before creation finishes, which is
   * never observable from outside the constructor.
   */
  e2eToggles(): E2ESettingsToggle[] {
    return this.toggles.map((row) => ({
      id: row.id,
      x: row.x,
      y: row.y,
      on: row.value(),
    }));
  }

  /**
   * The "Progress" row's canvas centre, or null before the row is built. The
   * row's own rectangle is what a parent's finger lands on, so a journey that
   * taps this point taps the control.
   */
  e2eProgressRow(): { x: number; y: number } | null {
    return this.progressRowPoint;
  }

  /**
   * Creates one inflated, touch-friendly settings toggle: a labeled row card
   * plus a track-and-knob switch whose knob side encodes the state (never
   * color alone).
   * @param id - Stable setting key the panel publishes for the browser suite.
   * @param onChange - Optional persistence hook; when provided it replaces the
   *   built-in audio handling (used by non-audio toggles such as Adaptive).
   */
  private createToggle(
    x: number,
    y: number,
    id: string,
    label: string,
    enabled: boolean,
    onChange?: (nextEnabled: boolean) => void,
  ): Phaser.GameObjects.Text {
    addRowCard(this.scene, x, y, this.pageObjects);

    const switchX = x + 170;
    const track = this.scene.add.rectangle(
      switchX,
      y,
      TOGGLE_TRACK_WIDTH,
      TOGGLE_TRACK_HEIGHT,
      enabled ? TOGGLE_TRACK_ON_COLOR : TOGGLE_TRACK_OFF_COLOR,
    );
    this.pageObjects.push(track);

    const knob = this.scene.add.rectangle(
      switchX + (enabled ? TOGGLE_KNOB_OFFSET : -TOGGLE_KNOB_OFFSET),
      y,
      TOGGLE_KNOB_SIZE,
      TOGGLE_KNOB_SIZE,
      TOGGLE_KNOB_COLOR,
    );
    knob.setStrokeStyle(2, OUTLINE_COLOR, 1);
    this.pageObjects.push(knob);

    const toggle = this.scene.add
      .text(
        x - 40,
        y,
        `${label}: ${enabled ? "ON" : "OFF"}`,
        textStyle({
          color: enabled ? ENABLED_COLOR : DISABLED_COLOR,
          fontSize: "34px",
        }),
      )
      .setOrigin(0.5);
    // The label sits 40px left of the row center, so the band's offset shifts
    // back by 40: the rectangle must be centred on the card, not on the label.
    toggle.setInteractive(centredHitArea(ROW_HIT_WIDTH, ROW_PITCH, 40));
    toggle.on("pointerdown", () => {
      const nextEnabled = !enabled;
      enabled = nextEnabled;
      const audio = AudioManager.getInstance();

      if (onChange) {
        onChange(nextEnabled);
      } else if (label === "BGM") {
        audio.setBGMEnabled(nextEnabled);
        if (nextEnabled) audio.playBGM();
        else audio.pauseBGM();
      } else {
        audio.setSFXEnabled(nextEnabled);
        if (nextEnabled) audio.playCorrect();
      }

      toggle.setText(`${label}: ${nextEnabled ? "ON" : "OFF"}`);
      toggle.setColor(nextEnabled ? ENABLED_COLOR : DISABLED_COLOR);
      // Slide the knob and repaint the track so state is visible without text.
      knob.setX(switchX + (nextEnabled ? TOGGLE_KNOB_OFFSET : -TOGGLE_KNOB_OFFSET));
      track.setFillStyle(nextEnabled ? TOGGLE_TRACK_ON_COLOR : TOGGLE_TRACK_OFF_COLOR, 1);
    });
    attachPressFeedback(toggle);
    this.pageObjects.push(toggle);
    // The band is centred on (x, y) by construction: the label sits 40px left
    // of the row centre and the hit area offsets back by 40, so `x` is where a
    // finger lands. Publishing the layout arguments keeps the suite from
    // re-deriving the row maths.
    this.toggles.push({ id, x, y, value: () => enabled });
    return toggle;
  }

  /** Adds the parental "Profiles" row that opens the profile manager overlay. */
  private createProfilesRow(x: number, y: number): void {
    createRow(this.scene, x, y, this.pageObjects, "Profiles", PRIMARY_COLOR, this.onOpenProfiles);
  }

  /** Adds the parental "Progress" row that opens the Learning Progress overlay. */
  private createProgressRow(x: number, y: number): void {
    createRow(this.scene, x, y, this.pageObjects, "Progress", PRIMARY_COLOR, this.onOpenProgress);
    // Like the toggle rows: the row card is centred on (x, y), so the layout
    // arguments are the point a finger lands on - no re-derivation by the suite.
    this.progressRowPoint = { x, y };
  }
}
