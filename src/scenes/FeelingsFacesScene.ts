import type Phaser from "phaser";
import {
  answer,
  buildRoundChoices,
  drawScenarios,
  type Emotion,
  ROUND_COUNT,
  type Scenario,
} from "../game/feelingsFacesLogic";
import type { GameId } from "../types";
import { createCompletionSplash } from "../utils/completionEffect";
import { sceneEntrance } from "../utils/sceneTransitions";
import { speakSentence } from "../utils/speech";
import { getSettings } from "../utils/storage";
import { textStyle } from "../utils/typography";
import { ChoiceRoundScene } from "./ChoiceRoundScene";

/** The spoken, written rule beside the replay glyph. */
const RULE_LINE = "Tap the face that shows how Aby feels.";

/** Width of one face card (px; well above the 64px touch-target floor). */
const CARD_WIDTH = 220;

/** Height of one face card (px). */
const CARD_HEIGHT = 250;

/** Horizontal gap between face cards (px). */
const CARD_GAP = 40;

/** Vertical offset of the card row from screen center (px). */
const CARDS_Y_OFFSET = 90;

/** Display size of the face artwork inside a card (px). */
const FACE_SIZE = 180;

/** Y position of the written scenario caption (caption fallback only). */
const CAPTION_Y = 250;

/** Wrap width of the scenario caption (px). */
const CAPTION_WRAP_WIDTH = 760;

/** Font size of the scenario caption (px). */
const CAPTION_FONT_SIZE = "24px";

/**
 * How long the opening scenario waits for the rule line to finish speaking
 * before it is dispatched (ms). Both are queued when the scene is set up and a
 * second utterance cancels the first, so the round-1 scenario is deferred past
 * the rule's own length at the shared sentence rate instead of cutting it off.
 */
const OPENING_SPEECH_DELAY = 2600;

/** Maps an emotion to its preloaded face texture key (e.g. "happy" → "face_happy"). */
function faceKey(emotion: Emotion): string {
  return `face_${emotion}`;
}

/**
 * Feelings Faces scene — a short everyday scenario is spoken aloud and the
 * child taps the face that shows how Aby feels. Each round shows three
 * distinct faces; the easy-first ladder contrasts happy/angry early and the
 * confusable sad/scared pair late. Correct taps chime, splash, and advance;
 * wrong taps wiggle, play a gentle tone, and re-speak the scenario once without
 * leaving the round. Six rounds win the game: shared celebration + sticker on
 * first completion.
 *
 * When the scenario cannot be heard (SFX off, no speech engine, or an engine
 * that settles on an empty voice list) the round shows it as a caption
 * instead. That decision — and the voice-settle state machine behind it —
 * lives in the shared {@link RoundNarrator}; this scene only reacts to a flip
 * by writing or clearing the caption for the round on screen.
 */
export class FeelingsFacesScene extends ChoiceRoundScene {
  /** Written scenario caption, present only while the caption fallback is on. */
  private caption?: Phaser.GameObjects.Text;
  /** The six scenarios drawn for this playthrough. */
  private rounds: Scenario[] = [];
  /** The three emotions on the current round's cards. */
  private choices: Emotion[] = [];
  /** Taps recorded on the current round (correct and wrong combined). */
  private taps = 0;
  /** Pending opening-speech timer, tracked so a voice-settle flip can cancel it. */
  private openingSpeechTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super("FeelingsFaces");
  }

  create(): void {
    sceneEntrance(this);
    this.createCornerMascot();
    this.createBackButton();
    this.progressDots = [];
    this.createProgressDots(ROUND_COUNT);
    this.createRuleLine();

    this.rounds = drawScenarios();
    this.roundIndex = 0;
    this.inputLocked = false;
    this.renderRound();

    // The narrator releases the voiceschanged subscription and the glyph.
    this.registerShutdownCleanup();
  }

  protected totalRounds(): number {
    return this.rounds.length;
  }

  protected gameId(): GameId {
    return "feelings-faces";
  }

  /**
   * Runs the round through the logic module and keeps the running tap count.
   * A correct tap advances the playthrough, a wrong tap leaves the child on the
   * round (the base never advances on a wrong answer).
   */
  protected isChoiceCorrect(index: number): boolean {
    const scenario = this.rounds[this.roundIndex];
    const tapped = this.choices[index];
    if (!scenario || tapped === undefined) return false;

    const result = answer(
      { index: this.roundIndex, scenario, choices: this.choices, taps: this.taps },
      tapped,
    );
    this.taps = result.taps;
    return result.correct;
  }

  /**
   * Renders the current round: the ladder's three distinct faces and — in
   * caption mode — the scenario as a short written line. The scenario is spoken
   * (or captioned) for every round.
   */
  protected buildRoundContent(): void {
    const scenario = this.rounds[this.roundIndex];
    if (!scenario) return;

    this.choices = buildRoundChoices(this.roundIndex, scenario.emotion);
    this.taps = 0;
    this.narrator?.refreshCaptionFallback();

    this.createCards(this.choices);
    if (this.narrator?.isCaptioning) {
      this.renderCaption(scenario);
    }
    this.speakScenario(scenario, this.roundIndex === 0);
  }

  /** Drops the written caption of the round that is being torn down. */
  protected clearRoundContent(): void {
    this.caption?.destroy();
    this.caption = undefined;
  }

  /** Bursts a splash at the face the child tapped, on top of the shared chime. */
  protected onCorrect(index: number): void {
    const card = this.choiceTargets[index];
    if (!card) return;
    createCompletionSplash(this, card.x, card.y);
  }

  /**
   * A wrong tap re-speaks the scenario once, so the child can listen again
   * before choosing. The base has already played the tone, recorded the miss,
   * nodded and wiggled the card with its face. Nothing is re-spoken while the
   * caption is up: the written line is already on screen.
   */
  protected onWrong(_index: number): void {
    const scenario = this.rounds[this.roundIndex];
    if (!scenario || this.narrator?.isCaptioning) return;
    speakSentence(scenario.text, getSettings().sfxEnabled);
  }

  /**
   * Writes the rule line and its replay glyph through the shared narrator,
   * which speaks the rule once at setup and owns the glyph's caption-aware
   * muted presentation.
   */
  private createRuleLine(): void {
    const centerX = this.cameras.main.centerX;
    const y = this.INSTRUCTION_Y;
    this.createRoundNarrator({
      x: centerX + this.INSTRUCTION_WRAP_WIDTH / 2 + this.INSTRUCTION_SPEAKER_GAP,
      y,
      replay: () => speakSentence(RULE_LINE, getSettings().sfxEnabled),
      label: { text: RULE_LINE, x: centerX, y, wrapWidth: this.INSTRUCTION_WRAP_WIDTH },
      announce: RULE_LINE,
      caption: { onChange: (captioning) => this.applyCaption(captioning) },
    });
  }

  /**
   * Adapts the round on screen when the narrator's caption decision flips. The
   * narrator has already rebuilt the rule line and glyph for the new state.
   * The scenario was never spoken while the fallback was up, so turning speech
   * back on speaks it once, inline.
   */
  private applyCaption(captioning: boolean): void {
    const scenario = this.rounds[this.roundIndex];
    if (!scenario) return;
    if (captioning) {
      this.renderCaption(scenario);
      return;
    }
    this.caption?.destroy();
    this.caption = undefined;
    // A pending opening-speech timer would re-speak the scenario at 2.6s;
    // cancel it before speaking inline.
    this.openingSpeechTimer?.remove();
    this.openingSpeechTimer = undefined;
    this.speakScenario(scenario, false);
  }

  /** Creates the three face cards with their tap handling. */
  private createCards(choices: readonly Emotion[]): void {
    const centerX = this.cameras.main.centerX;
    const cardsY = this.cameras.main.centerY + CARDS_Y_OFFSET;
    const pitch = CARD_WIDTH + CARD_GAP;

    for (let i = 0; i < choices.length; i++) {
      const x = centerX + (i - (choices.length - 1) / 2) * pitch;
      this.createChoiceTarget(x, cardsY, CARD_WIDTH, i, { height: CARD_HEIGHT });

      const face = this.add
        .image(x, cardsY, faceKey(choices[i]))
        .setDisplaySize(FACE_SIZE, FACE_SIZE);
      this.attachCardContent(i, [face]);
    }
  }

  /** Writes the round's scenario as a one-line caption (caption fallback only). */
  private renderCaption(scenario: Scenario): void {
    this.caption = this.add
      .text(
        this.cameras.main.centerX,
        CAPTION_Y,
        scenario.text,
        textStyle({
          fontSize: CAPTION_FONT_SIZE,
          color: "#2d3748",
          align: "center",
          wordWrap: { width: CAPTION_WRAP_WIDTH },
        }),
      )
      .setOrigin(0.5);
  }

  /**
   * Speaks the round's scenario. On the opening round the rule line is still
   * speaking, so the scenario waits for it rather than cancelling it; every
   * later round speaks immediately.
   */
  private speakScenario(scenario: Scenario, afterRule: boolean): void {
    if (this.narrator?.isCaptioning) return;
    if (!afterRule) {
      speakSentence(scenario.text, getSettings().sfxEnabled);
      return;
    }
    this.openingSpeechTimer = this.time.delayedCall(OPENING_SPEECH_DELAY, () => {
      this.openingSpeechTimer = undefined;
      // The child may already have answered, or the voice list may have
      // settled empty since; only speak if the opening round is still up
      // and still on the spoken path.
      if (this.roundIndex !== 0 || this.narrator?.isCaptioning) return;
      speakSentence(scenario.text, getSettings().sfxEnabled);
    });
  }
}
