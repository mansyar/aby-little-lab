import Phaser from "phaser";
import { attachPressFeedback } from "../utils/pressFeedback";

/** Display size of the speaker icon artwork (px). */
const SPEAKER_DISPLAY_SIZE = 96;

export interface SpeakerButtonOptions {
  /** Current round's prompt speech, SFX-gated by the caller (no-op when disabled). */
  onSpeak: () => void;
}

/**
 * Textless "hear it again" button used by the speech-driven games.
 *
 * Replays the current prompt (letter/word/number/sequence) when tapped.
 * Kids cannot read, so the control is a pure speaker glyph with squish press
 * feedback (reduced-motion aware via pressFeedback). The onSpeak callback is
 * responsible for SFX/speech gating.
 *
 * Uses the engine's frame-based default hit area: the 512x512 texture
 * rasterizes at the display size, so the interactive region covers the visible
 * icon exactly (a 96px ideal touch target). Custom hit areas on Image objects
 * are tested in texture-local space (+displayOrigin), NOT centered on the
 * object position — a centered (-48,-48,96,96) rect would be dead.
 */
export class SpeakerButton {
  readonly button: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, x: number, y: number, options: SpeakerButtonOptions) {
    this.button = scene.add.image(x, y, "icon_speaker");
    this.button.setDisplaySize(SPEAKER_DISPLAY_SIZE, SPEAKER_DISPLAY_SIZE);
    this.button.setInteractive();
    this.button.on("pointerdown", () => options.onSpeak());
    attachPressFeedback(this.button);
  }

  destroy(): void {
    this.button.destroy();
  }
}
