import Phaser from "phaser";
import { SpeakerButton } from "../components/SpeakerButton";
import { type AlphabetRound, generatePlaythrough } from "../game/alphabetLogic";
import { createCompletionSplash } from "../utils/completionEffect";
import { isReducedMotion, motionDuration } from "../utils/motion";
import { attachPressFeedback } from "../utils/pressFeedback";
import { sceneEntrance } from "../utils/sceneTransitions";
import { speakLetter } from "../utils/speech";
import { load } from "../utils/storage";
import { GameSceneBase } from "./GameSceneBase";

/** Number of rounds per playthrough. */
const ROUND_COUNT = 6;

/** Display size of the big target letter image (px; glyph ≈ 200px visual). */
const TARGET_DISPLAY_SIZE = 256;

/** Display size of the letter image inside each answer card (px; glyph ≈ 100px visual). */
const CARD_LETTER_DISPLAY_SIZE = 128;

/** Display size of the answer cards (exceeds 96px ideal touch target). */
const CARD_SIZE = 160;

/** Horizontal spacing between answer cards (px). */
const CARD_SPACING = 200;

/** Vertical offset of the target letter from screen center (px). */
const TARGET_Y_OFFSET = -140;

/** Vertical offset of the answer cards from screen center (px). */
const CARDS_Y_OFFSET = 180;

/**
 * Maps an uppercase letter to its preloaded SVG texture key (e.g. "A" → "letter_a").
 */
function letterKey(letter: string): string {
  return `letter_${letter.toLowerCase()}`;
}

/**
 * Find the Letter scene — a big target letter is shown and named aloud, and
 * the child taps the matching card among 4 uppercase choices. Correct taps
 * chime, cheer, and advance; incorrect taps wiggle gently (no-fail). Six
 * rounds win the game: shared celebration + sticker on first completion.
 */
export class AlphabetScene extends GameSceneBase {
  /** Answer card backgrounds of the current round. */
  private readonly cardRects: Phaser.GameObjects.Rectangle[] = [];
  /** Answer card letter images of the current round. */
  private readonly cardLetters: Phaser.GameObjects.Image[] = [];
  /** Per-round display objects (currently the target letter image). */
  private readonly roundObjects: Phaser.GameObjects.GameObject[] = [];
  private rounds: AlphabetRound[] = [];
  private roundIndex = 0;

  constructor() {
    super("Alphabet");
  }

  create(): void {
    sceneEntrance(this);
    this.createCornerMascot();
    this.createBackButton();
    this.createProgressDots(ROUND_COUNT);

    // "Hear it again" — re-speaks the current target letter on demand.
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;
    this.speaker = new SpeakerButton(
      this,
      centerX + TARGET_DISPLAY_SIZE / 2 + this.SPEAKER_OFFSET,
      centerY + TARGET_Y_OFFSET,
      {
        onSpeak: () => {
          const round = this.rounds[this.roundIndex];
          if (!round) return; // Celebration after the final round — nothing to speak.
          const { sfxEnabled } = load().settings;
          speakLetter(round.target, sfxEnabled);
        },
      },
    );

    this.rounds = generatePlaythrough(ROUND_COUNT);
    this.roundIndex = 0;
    this.inputLocked = false;
    this.renderRound();

    this.registerShutdownCleanup();
  }

  /**
   * Renders the current round: the big target letter (named aloud via TTS
   * when SFX is enabled) and 4 answer cards. Previous objects are destroyed.
   */
  private renderRound(): void {
    this.clearRound();

    const round = this.rounds[this.roundIndex];
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    const target = this.add
      .image(centerX, centerY + TARGET_Y_OFFSET, letterKey(round.target))
      .setDisplaySize(TARGET_DISPLAY_SIZE, TARGET_DISPLAY_SIZE);
    this.roundObjects.push(target);

    const { sfxEnabled } = load().settings;
    speakLetter(round.target, sfxEnabled);

    this.createCards(round);
  }

  /** Creates the 4 answer cards with their letter texts and tap handling. */
  private createCards(round: AlphabetRound): void {
    const centerX = this.cameras.main.centerX;
    const cardsY = this.cameras.main.centerY + CARDS_Y_OFFSET;

    for (let i = 0; i < round.choices.length; i++) {
      const x = centerX + (i - 1.5) * CARD_SPACING;
      const card = this.add.rectangle(x, cardsY, CARD_SIZE, CARD_SIZE, 0xffffff);
      card.setStrokeStyle(this.OUTLINE_WIDTH, this.OUTLINE_COLOR, 1);
      card.setInteractive({
        hitArea: new Phaser.Geom.Rectangle(0, 0, CARD_SIZE, CARD_SIZE),
        hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      });
      card.on("pointerdown", () => this.handleChoice(i));
      attachPressFeedback(card);
      this.cardRects.push(card);

      const letter = this.add
        .image(x, cardsY, letterKey(round.choices[i]))
        .setDisplaySize(CARD_LETTER_DISPLAY_SIZE, CARD_LETTER_DISPLAY_SIZE);
      this.cardLetters.push(letter);
    }
  }

  /** Destroys all display objects created for the current round. */
  private clearRound(): void {
    for (const obj of this.roundObjects) {
      obj.destroy();
    }
    this.roundObjects.length = 0;
    for (const card of this.cardRects) {
      card.destroy();
    }
    this.cardRects.length = 0;
    for (const card of this.cardLetters) {
      card.destroy();
    }
    this.cardLetters.length = 0;
  }

  /** Handles a tap on an answer card: correct advances, wrong wiggles. */
  private handleChoice(choiceIndex: number): void {
    if (this.inputLocked) return;
    const round = this.rounds[this.roundIndex];
    if (round.choices[choiceIndex] === round.target) {
      this.handleCorrect(choiceIndex);
    } else {
      this.handleIncorrect(choiceIndex);
    }
  }

  /**
   * Handles a correct answer: a splash bursts at the tapped card, the correct
   * chime plays, Professor Hoot cheers, the progress dot fills with a pop,
   * and the next round starts after a short delay (completion after the
   * final round).
   */
  private handleCorrect(choiceIndex: number): void {
    this.inputLocked = true;
    const card = this.cardRects[choiceIndex];
    if (card) {
      createCompletionSplash(this, card.x, card.y);
    }
    this.audioManager.playCorrect();
    this.recordCorrect();
    this.mascot?.cheer();
    this.fillProgressDot(this.roundIndex);

    this.time.delayedCall(this.NEXT_ROUND_DELAY, () => {
      this.roundIndex++;
      if (this.roundIndex >= this.rounds.length) {
        this.completeGame("alphabet-match");
      } else {
        this.inputLocked = false;
        this.renderRound();
      }
    });
  }

  /** Handles an incorrect answer: a gentle wiggle, soft tone, no penalty. */
  private handleIncorrect(choiceIndex: number): void {
    this.audioManager.playIncorrect();
    this.recordWrong();
    this.mascot?.nod();

    const rect = this.cardRects[choiceIndex];
    const letter = this.cardLetters[choiceIndex];
    const angle = isReducedMotion() ? this.WIGGLE_REDUCED_ANGLE : this.WIGGLE_ANGLE;
    this.tweens.add({
      targets: [rect, letter],
      angle,
      duration: motionDuration(this.WIGGLE_DURATION, this.WIGGLE_REDUCED_DURATION),
      yoyo: true,
      repeat: this.WIGGLE_REPEATS,
      ease: "Sine.inOut",
    });
  }
}
