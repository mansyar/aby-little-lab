import Phaser from "phaser";
import { availableVoiceOptions } from "../../game/voiceLogic";
import { attachPressFeedback } from "../../utils/pressFeedback";
import { setPreferredVoiceURI, speakWord } from "../../utils/speech";
import { getSettings, updateSettings } from "../../utils/storage";
import { textStyle } from "../../utils/typography";
import {
  addRowCard,
  ENABLED_COLOR,
  type ObjectBucket,
  PRIMARY_COLOR,
  ROW_HIT_WIDTH,
  ROW_PITCH,
} from "./primitives";

/** Sample phrase spoken by the voice preview button. */
const VOICE_PREVIEW_TEXT = "Hi! I can talk.";
/** Longest voice label shown in the chip before truncation. */
const VOICE_LABEL_MAX = 24;
/** Chip and Preview label offsets from the row center (their visual positions). */
const VOICE_CHIP_OFFSET = -30;
const VOICE_PREVIEW_OFFSET = 170;

/** Truncates a long voice label for the narrow chip, e.g. "en-US — Goog…". */
function truncateLabel(label: string, max = VOICE_LABEL_MAX): string {
  return label.length <= max ? label : `${label.slice(0, max - 1)}…`;
}

export interface VoiceRowDeps {
  scene: Phaser.Scene;
  /** Panel display bucket; torn down with the panel. */
  bucket: ObjectBucket;
}

/**
 * The device-level TTS voice row: a chip cycling through the installed voices
 * (plus "Default (device)") and a Preview button that speaks a sample phrase
 * with the current selection, honoring the SFX toggle.
 */
export class VoiceRow {
  private readonly deps: VoiceRowDeps;
  private voiceOptions: ReturnType<typeof availableVoiceOptions> = [];
  private voiceIndex = 0;
  private chip: Phaser.GameObjects.Text | null = null;

  constructor(deps: VoiceRowDeps) {
    this.deps = deps;
  }

  /** Creates the row (card + chip + preview) at the given panel position. */
  create(x: number, y: number): void {
    this.syncVoiceSelection();
    addRowCard(this.deps.scene, x, y, this.deps.bucket);
    const cardLeft = x - ROW_HIT_WIDTH / 2;
    const cardRight = x + ROW_HIT_WIDTH / 2;
    const chipX = x + VOICE_CHIP_OFFSET;
    const previewX = x + VOICE_PREVIEW_OFFSET;
    // This row carries two controls, so it splits its single band at the
    // midpoint between their labels: a full-width band on both would stack two
    // identical rectangles and the preview, drawn last, would take every tap.
    const splitX = (chipX + previewX) / 2;

    const chip = this.deps.scene.add
      .text(
        chipX,
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
        cardLeft - chipX,
        -ROW_PITCH / 2,
        splitX - cardLeft,
        ROW_PITCH,
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
    attachPressFeedback(chip);
    this.deps.bucket.push(chip);
    this.chip = chip;

    const preview = this.deps.scene.add
      .text(
        previewX,
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
        splitX - previewX,
        -ROW_PITCH / 2,
        cardRight - splitX,
        ROW_PITCH,
      ),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    });
    preview.on("pointerdown", () => {
      setPreferredVoiceURI(getSettings().preferredVoiceURI);
      speakWord(VOICE_PREVIEW_TEXT, getSettings().sfxEnabled);
    });
    attachPressFeedback(preview);
    this.deps.bucket.push(preview);
  }

  /**
   * Refreshes the voice options from the platform and resolves the chip index
   * against the stored preference (falling back to "Default (device)" when the
   * URI is unset or no longer installed).
   */
  voiceChanged(): void {
    this.syncVoiceSelection();
    this.chip?.setText(`Voice: ${truncateLabel(this.voiceOptions[this.voiceIndex].label)}`);
  }

  /** Reads the platform voice list and resolves the persisted selection. */
  private syncVoiceSelection(): void {
    this.voiceOptions = availableVoiceOptions(window.speechSynthesis?.getVoices?.() ?? []);
    const stored = getSettings().preferredVoiceURI;
    this.voiceIndex = Math.max(
      0,
      this.voiceOptions.findIndex((option) => option.voiceURI === stored),
    );
  }
}
