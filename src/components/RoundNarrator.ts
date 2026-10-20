import type Phaser from "phaser";
import { isSpeechSupported, speakSentence } from "../utils/speech";
import { getSettings } from "../utils/storage";
import { textStyle } from "../utils/typography";
import { SpeakerButton } from "./SpeakerButton";

/** Rule line font size (px). */
const LABEL_FONT_SIZE = "26px";

/** Rule line colour (--outline token). */
const LABEL_COLOR = "#2d3748";

/** A spoken rule line the narrator writes beside its glyph. */
export interface RoundNarratorLabel {
  /** The sentence to show (and speak, when announced). */
  readonly text: string;
  /** Centre x of the line (px). */
  readonly x: number;
  /** Centre y of the line and glyph (px). */
  readonly y: number;
  /** Wrap width of the line; the glyph is placed clear of it by the caller. */
  readonly wrapWidth: number;
}

/** Caption-fallback wiring: called when the spoken path becomes unavailable. */
export interface RoundNarratorCaption {
  /** Runs on a flip, after the glyph has been rebuilt for the new state. */
  readonly onChange: (captioning: boolean) => void;
}

export interface RoundNarratorOptions {
  /** Centre x of the replay glyph (px). */
  readonly x: number;
  /** Centre y of the replay glyph (px). */
  readonly y: number;
  /** Replays the current prompt; SFX is gated by the caller. */
  readonly replay: () => void;
  /** Sentence spoken once at setup (a rule line the scene draws itself). */
  readonly announce?: string;
  /** Rule line drawn and owned by the narrator, rebuilt when the state flips. */
  readonly label?: RoundNarratorLabel;
  /** Enables the caption-fallback machine; omitted by illustrated prompts. */
  readonly caption?: RoundNarratorCaption;
}

/** The browser's speech engine, when there is one. */
function speechSynthesisOrUndefined(): SpeechSynthesis | undefined {
  if (typeof window === "undefined") return undefined;
  return window.speechSynthesis as SpeechSynthesis | undefined;
}

/**
 * The single "hear it again" narrator for a round prompt.
 *
 * Owns the replay glyph — its creation, placement, muted presentation, replay
 * wiring, speech-lifecycle subscription (through {@link SpeakerButton}) and
 * teardown — so no scene builds one by hand. The scene keeps the prompt and
 * tells the narrator how to replay it; the narrator never touches audio beyond
 * the speech calls the scene already makes.
 *
 * It also owns the caption-fallback decision for the one prompt that has a
 * written form (Feelings Faces): the SFX toggle or a missing engine caption
 * the round, and so does an engine that settles on an empty voice list. Chrome
 * populates voices asynchronously, so an empty first `getVoices()` read is
 * "unknown" and keeps the spoken path; the decision only follows
 * `voiceschanged`. Engines without that event cannot populate late, so their
 * empty list decides immediately. When the decision flips, the narrator
 * re-evaluates the displayed round in place — rebuilding its own label and
 * glyph, never re-speaking the rule — and hands the change to the scene, which
 * renders or clears the caption.
 */
export class RoundNarrator {
  private readonly scene: Phaser.Scene;
  private readonly options: RoundNarratorOptions;
  private readonly synth: SpeechSynthesis | undefined;

  /** Replay glyph; replaced whenever the muted presentation changes. */
  private glyphButton: SpeakerButton;

  /** Rule line owned by the narrator, when it draws one. */
  private labelText?: Phaser.GameObjects.Text;

  /** True while the prompt is shown as a caption instead of being spoken. */
  private captioning = false;

  /** Voice list captured from the last voiceschanged event. */
  private voicesCache: SpeechSynthesisVoice[] = [];

  /** True once the engine has fired voiceschanged, making `voicesCache` final. */
  private voicesSettled = false;

  constructor(scene: Phaser.Scene, options: RoundNarratorOptions) {
    this.scene = scene;
    this.options = options;
    this.synth = speechSynthesisOrUndefined();
    this.captioning = options.caption ? this.captionFallbackActive() : false;
    this.labelText = options.label ? this.createLabel(options.label) : undefined;
    this.glyphButton = this.createGlyph();

    if (options.caption) {
      this.synth?.addEventListener?.("voiceschanged", this.handleVoicesChanged);
    }
    if (options.announce !== undefined && !this.captioning) {
      speakSentence(options.announce, getSettings().sfxEnabled);
    }
  }

  /** The replay glyph this narrator owns. */
  get glyph(): SpeakerButton {
    return this.glyphButton;
  }

  /** The rule line this narrator draws, when it draws one. */
  get label(): Phaser.GameObjects.Text | undefined {
    return this.labelText;
  }

  /** True while the displayed prompt is a written caption rather than speech. */
  get isCaptioning(): boolean {
    return this.captioning;
  }

  /**
   * Re-reads the caption decision at a round boundary so the scene can branch
   * on {@link isCaptioning} before it speaks its own text, the same way the
   * scene used to cache the decision per round.
   *
   * Deliberately silent: it neither rebuilds the glyph and label nor calls
   * `caption.onChange`. A notification here would land mid-render and re-enter
   * the scene's speak path, saying the round's sentence twice. The scene reads
   * the decision and paints or clears its own caption; the glyph and label are
   * rebuilt only when the voice list settles, where `applyCaptionState` calls
   * `rebuild()`.
   */
  refreshCaptionFallback(): void {
    if (this.options.caption) {
      this.captioning = this.captionFallbackActive();
    }
  }

  /** Reflects externally driven playback (a replay that is not Web Speech). */
  setActive(active: boolean): void {
    this.glyphButton.setActive(active);
  }

  /** Releases the glyph, the rule line and the voice-list subscription. */
  destroy(): void {
    this.synth?.removeEventListener?.("voiceschanged", this.handleVoicesChanged);
    this.glyphButton.destroy();
    this.labelText?.destroy();
    this.labelText = undefined;
  }

  /**
   * True when the prompt cannot actually be heard: the SFX toggle is off, the
   * browser has no speech engine, or the engine settled on an empty voice
   * list. Callers show the written caption instead in that state.
   */
  private captionFallbackActive(): boolean {
    if (!getSettings().sfxEnabled || !isSpeechSupported()) {
      return true;
    }
    const synth = this.synth;
    const canWatch = typeof synth?.addEventListener === "function";
    const voices = this.voicesSettled ? this.voicesCache : (synth?.getVoices?.() ?? []);
    if (voices.length > 0) {
      return false;
    }
    return !canWatch || this.voicesSettled;
  }

  /** Captures the settled voice list; the caption decision defers to it afterwards. */
  private readonly handleVoicesChanged = (): void => {
    this.voicesCache = this.synth?.getVoices?.() ?? [];
    this.voicesSettled = true;
    this.applyCaptionState();
  };

  /**
   * Re-evaluates the caption fallback for the displayed round after the voice
   * list settles. On a flip the glyph and rule line are rebuilt with the
   * correct presentation — the rule is never re-spoken, it was already spoken
   * for this round (or is unavailable) — and the scene adapts the round.
   */
  private applyCaptionState(): void {
    const captioning = this.captionFallbackActive();
    if (captioning === this.captioning) return;
    this.captioning = captioning;
    this.rebuild();
    this.options.caption?.onChange(captioning);
  }

  /** Replaces the rule line and glyph, preserving their placement and copy. */
  private rebuild(): void {
    this.labelText?.destroy();
    this.labelText = this.options.label ? this.createLabel(this.options.label) : undefined;
    this.glyphButton.destroy();
    this.glyphButton = this.createGlyph();
  }

  /** Creates the replay glyph at the narrator's placement. */
  private createGlyph(): SpeakerButton {
    return new SpeakerButton(this.scene, this.options.x, this.options.y, {
      muted: this.isMuted(),
      onSpeak: this.options.replay,
    });
  }

  /** True when the glyph shows the dimmed, unavailable presentation. */
  private isMuted(): boolean {
    return this.options.caption ? this.captionFallbackActive() : !getSettings().sfxEnabled;
  }

  /** Writes a rule line at the configured centre. */
  private createLabel(label: RoundNarratorLabel): Phaser.GameObjects.Text {
    return this.scene.add
      .text(
        label.x,
        label.y,
        label.text,
        textStyle({
          fontSize: LABEL_FONT_SIZE,
          color: LABEL_COLOR,
          align: "center",
          wordWrap: { width: label.wrapWidth },
        }),
      )
      .setOrigin(0.5);
  }
}
