import Phaser from "phaser";
import { attachPressFeedback } from "../utils/pressFeedback";

/** Display size of the speaker icon artwork (px). */
const SPEAKER_DISPLAY_SIZE = 96;
/** Inflated touch target for the replay button (px). */
const SPEAKER_HIT_SIZE = 96;

export interface SpeakerButtonOptions {
  /** Current round's prompt speech, SFX-gated by the caller (no-op when disabled). */
  onSpeak: () => void;
}

/**
 * Textless "hear it again" button used by the speech-driven games.
 *
 * Replays the current prompt (letter/word/number/sequence) when tapped.
 * Kids cannot read, so the control is a pure speaker glyph with an inflated
 * 96×96 hit area and squish press feedback (reduced-motion aware via
 * pressFeedback). The onSpeak callback is responsible for SFX/speech gating.
 */
export class SpeakerButton {
  readonly button: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, x: number, y: number, options: SpeakerButtonOptions) {
    this.button = scene.add.image(x, y, "icon_speaker");
    this.button.setDisplaySize(SPEAKER_DISPLAY_SIZE, SPEAKER_DISPLAY_SIZE);
    this.button.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(
        -SPEAKER_HIT_SIZE / 2,
        -SPEAKER_HIT_SIZE / 2,
        SPEAKER_HIT_SIZE,
        SPEAKER_HIT_SIZE,
      ),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    });
    this.button.on("pointerdown", () => options.onSpeak());
    attachPressFeedback(this.button);
  }

  destroy(): void {
    this.button.destroy();
  }
}
