import Phaser from "phaser";
import { SpeakerButton } from "../components/SpeakerButton";
import { generateWordPlaythrough, getWord, type WordRound } from "../game/wordLogic";
import { createCompletionSplash } from "../utils/completionEffect";
import { isReducedMotion, motionDuration } from "../utils/motion";
import { attachPressFeedback } from "../utils/pressFeedback";
import { sceneEntrance } from "../utils/sceneTransitions";
import { speakWord } from "../utils/speech";
import { load } from "../utils/storage";
import { GameSceneBase } from "./GameSceneBase";

/** Number of rounds per playthrough. */
const ROUND_COUNT = 6;

/** Display size of the prompt picture (px). */
const PICTURE_SIZE = 180;

/** Vertical offset of the prompt picture from screen center (px). */
const PICTURE_Y_OFFSET = -240;

/** Card height (px) — comfortably above the 96px touch target. */
const CARD_HEIGHT = 160;

/** Display size of each letter inside a word card (px). */
const LETTER_SIZE = 80;

/** Horizontal gap between letters inside a word card (px). */
const LETTER_GAP = 8;

/** Horizontal padding inside a word card beyond the letters (px). */
const CARD_PADDING = 30;

/** Vertical offsets of the two card rows from screen center (px). */
const CARD_ROW_Y_OFFSETS = [110, 270] as const;

/** Horizontal offset of the two card columns from screen center (px). */
const CARD_COL_X_OFFSET = 210;

/**
 * Find the Word scene — a picture is shown and its word is spoken aloud, and
 * the child taps the matching printed word among 4 cards in a 2×2 grid.
 * Correct taps chime, cheer, and advance; incorrect taps wiggle gently
 * (no-fail). Six rounds win the game: shared celebration + sticker on first
 * completion.
 */
export class WordMatchScene extends GameSceneBase {
  /** Answer card backgrounds of the current round. */
  private readonly cardRects: Phaser.GameObjects.Rectangle[] = [];
  /** Letter images per card of the current round (indexed like cardRects). */
  private readonly cardLetters: Phaser.GameObjects.Image[][] = [];
  /** Per-round display objects (currently the prompt picture). */
  private readonly roundObjects: Phaser.GameObjects.GameObject[] = [];
  private rounds: WordRound[] = [];
  private roundIndex = 0;

  constructor() {
    super("WordMatch");
  }

  create(): void {
    sceneEntrance(this);
    this.createCornerMascot();
    this.createBackButton();
    this.createProgressDots(ROUND_COUNT);

    // "Hear it again" — re-speaks the current target word on demand.
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;
    this.speaker = new SpeakerButton(
      this,
      centerX + PICTURE_SIZE / 2 + this.SPEAKER_OFFSET,
      centerY + PICTURE_Y_OFFSET,
      {
        muted: !load().settings.sfxEnabled,
        onSpeak: () => {
          const round = this.rounds[this.roundIndex];
          if (!round) return; // Celebration after the final round — nothing to speak.
          speakWord(round.target, load().settings.sfxEnabled);
        },
      },
    );

    this.rounds = generateWordPlaythrough(ROUND_COUNT);
    this.roundIndex = 0;
    this.inputLocked = false;
    this.renderRound();

    this.registerShutdownCleanup();
  }

  /**
   * Renders the current round: the prompt picture (with the word spoken
   * aloud via TTS when SFX is enabled) and 4 word cards in a 2×2 grid.
   * Previous objects are destroyed.
   */
  private renderRound(): void {
    this.clearRound();

    const round = this.rounds[this.roundIndex];
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    const prompt = this.add.image(
      centerX,
      centerY + PICTURE_Y_OFFSET,
      getWord(round.target)?.promptTexture ?? "",
    );
    prompt.setDisplaySize(PICTURE_SIZE, PICTURE_SIZE);
    this.roundObjects.push(prompt);

    const { sfxEnabled } = load().settings;
    speakWord(round.target, sfxEnabled);

    this.createCards(round);
  }

  /** Creates the 4 word cards in a 2×2 grid with tap handling. */
  private createCards(round: WordRound): void {
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    for (let i = 0; i < round.choices.length; i++) {
      const word = round.choices[i];
      const row = Math.floor(i / 2);
      const col = i % 2;
      const cardX = centerX + (col === 0 ? -CARD_COL_X_OFFSET : CARD_COL_X_OFFSET);
      const cardY = centerY + CARD_ROW_Y_OFFSETS[row];
      const contentWidth = word.length * LETTER_SIZE + (word.length - 1) * LETTER_GAP;
      const cardWidth = contentWidth + CARD_PADDING * 2;

      const card = this.add.rectangle(cardX, cardY, cardWidth, CARD_HEIGHT, 0xffffff);
      card.setStrokeStyle(this.OUTLINE_WIDTH, this.OUTLINE_COLOR, 1);
      card.setInteractive({
        hitArea: new Phaser.Geom.Rectangle(0, 0, cardWidth, CARD_HEIGHT),
        hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      });
      card.on("pointerdown", () => this.handleChoice(i));
      attachPressFeedback(card);
      this.cardRects.push(card);

      // Compose the word from the already-loaded letter textures.
      const letters: Phaser.GameObjects.Image[] = [];
      const startX = cardX - contentWidth / 2 + LETTER_SIZE / 2;
      for (let j = 0; j < word.length; j++) {
        const letter = this.add.image(
          startX + j * (LETTER_SIZE + LETTER_GAP),
          cardY,
          `letter_${word[j].toLowerCase()}`,
        );
        letter.setDisplaySize(LETTER_SIZE, LETTER_SIZE);
        letters.push(letter);
      }
      this.cardLetters.push(letters);
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
    for (const letters of this.cardLetters) {
      for (const letter of letters) {
        letter.destroy();
      }
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
        this.completeGame("word-match");
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

    const targets = [this.cardRects[choiceIndex], ...this.cardLetters[choiceIndex]];
    const angle = isReducedMotion() ? this.WIGGLE_REDUCED_ANGLE : this.WIGGLE_ANGLE;
    this.tweens.add({
      targets,
      angle,
      duration: motionDuration(this.WIGGLE_DURATION, this.WIGGLE_REDUCED_DURATION),
      yoyo: true,
      repeat: this.WIGGLE_REPEATS,
      ease: "Sine.inOut",
    });
  }
}
