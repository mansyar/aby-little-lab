import type Phaser from "phaser";
import { isReducedMotion } from "../utils/motion";
import { attachPressFeedback } from "../utils/pressFeedback";
import { isSpeechSupported, onSpeechLifecycle } from "../utils/speech";

/** Display size of the speaker icon artwork (px). */
const SPEAKER_DISPLAY_SIZE = 96;
/** Active (replaying) tint; always paired with an alpha cue, never color alone. */
const ACTIVE_TINT = 0x68d391;
/** Dimmed tint for unavailable or muted speech. */
const MUTED_TINT = 0xa0aec0;
/** Dimmed alpha for unavailable or muted speech. */
const MUTED_ALPHA = 0.6;
/** Lowest alpha while the active pulse breathes (also the static RM value). */
const ACTIVE_ALPHA_MIN = 0.6;
/** Round-trip duration of one active pulse. */
const ACTIVE_PULSE_MS = 600;

export interface SpeakerButtonOptions {
  /** Current round's prompt speech, SFX-gated by the caller (no-op when disabled). */
  onSpeak: () => void;
  /** True when the SFX toggle is off so the glyph shows a mute presentation. */
  muted?: boolean;
}

/**
 * Textless "hear it again" button used by the speech-driven games.
 *
 * Replays the current prompt (letter/word/number/sequence) when tapped.
 * Kids cannot read, so the control is a pure speaker glyph with squish press
 * feedback (reduced-motion aware via pressFeedback). The onSpeak callback is
 * responsible for SFX/speech gating.
 *
 * Observable states, using the shared interaction grammar:
 * - pressed: squish via pressFeedback.
 * - active/replaying: tinted + alpha-breathing pulse (static dim under
 *   reduced motion) while speech is observable via the speech lifecycle, or
 *   while the caller drives setActive() for non-Web-Speech replay.
 * - unavailable/muted: static dimmed presentation when the browser cannot
 *   speak or the SFX toggle is off (still tappable so the squish explains
 *   the control).
 * - neutral: unpainted glyph after end/error; interruptions can never leave
 *   a stale active state because superseded utterances emit nothing.
 *
 * Uses the engine's frame-based default hit area: the 512x512 texture
 * rasterizes at the display size, so the interactive region covers the visible
 * icon exactly (a 96px ideal touch target). Custom hit areas on Image objects
 * are tested in texture-local space (+displayOrigin), NOT centered on the
 * object position — a centered (-48,-48,96,96) rect would be dead.
 */
export class SpeakerButton {
  readonly button: Phaser.GameObjects.Image;
  private readonly scene: Phaser.Scene;
  private readonly unsubscribeSpeech: (() => void) | null = null;
  private activeTween: Phaser.Tweens.Tween | null = null;
  private active = false;

  constructor(scene: Phaser.Scene, x: number, y: number, options: SpeakerButtonOptions) {
    this.scene = scene;
    this.button = scene.add.image(x, y, "icon_speaker");
    this.button.setDisplaySize(SPEAKER_DISPLAY_SIZE, SPEAKER_DISPLAY_SIZE);
    this.button.setInteractive();
    this.button.on("pointerdown", () => options.onSpeak());
    attachPressFeedback(this.button);

    if (options.muted === true || !isSpeechSupported()) {
      // Unavailable or muted: static dimmed presentation. Still tappable so
      // the squish explains "this is a control" without implying it will speak.
      this.button.setTint(MUTED_TINT);
      this.button.setAlpha(MUTED_ALPHA);
      return;
    }

    const unsubscribe = onSpeechLifecycle((event) => {
      if (event.kind === "speech:start") {
        this.setActive(true);
      } else {
        // speech:end / speech:error → neutral again; never stale-active.
        this.setActive(false);
      }
    });
    this.unsubscribeSpeech = unsubscribe;
  }

  /**
   * Reflects externally driven audible playback (e.g. Musical Memory's note
   * replay, which does not go through Web Speech) using the same grammar:
   * tinted + breathing while active, neutral otherwise.
   */
  setActive(active: boolean): void {
    if (this.active === active) {
      return;
    }
    this.active = active;
    this.stopActiveTween();
    if (active) {
      this.button.setTint(ACTIVE_TINT);
      if (isReducedMotion()) {
        // Reduced motion: keep a static dimmed cue instead of a pulse.
        this.button.setAlpha(ACTIVE_ALPHA_MIN);
      } else {
        this.button.setAlpha(1);
        this.activeTween = this.scene.tweens.add({
          targets: this.button,
          alpha: ACTIVE_ALPHA_MIN,
          duration: ACTIVE_PULSE_MS,
          yoyo: true,
          repeat: -1,
          ease: "Sine.inOut",
        });
      }
    } else {
      this.button.clearTint();
      this.button.setAlpha(1);
    }
  }

  private stopActiveTween(): void {
    if (this.activeTween) {
      this.activeTween.stop();
      this.activeTween = null;
    }
  }

  destroy(): void {
    this.unsubscribeSpeech?.();
    this.stopActiveTween();
    this.button.destroy();
  }
}
