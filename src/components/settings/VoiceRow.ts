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
  ROW_HEIGHT,
  TOGGLE_WIDTH,
} from "./primitives";

/** Sample phrase spoken by the voice preview button. */
const VOICE_PREVIEW_TEXT = "Hi! I can talk.";
/** Longest voice label shown in the chip before truncation. */
const VOICE_LABEL_MAX = 24;

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

    const chip = this.deps.scene.add
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
    attachPressFeedback(chip);
    this.deps.bucket.push(chip);
    this.chip = chip;

    const preview = this.deps.scene.add
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
