import Phaser from "phaser";
import { AudioManager } from "../audio/AudioManager";
import { createCornerMascot, type Mascot } from "../components/Mascot";
import { ParentLock } from "../components/ParentLock";
import { getWord, generateWordPlaythrough, type WordRound } from "../game/wordLogic";
import { createWinCelebration } from "../utils/completionEffect";
import { motionDuration, motionScale, isReducedMotion } from "../utils/motion";
import { attachPressFeedback } from "../utils/pressFeedback";
import { sceneEntrance, transitionToScene } from "../utils/sceneTransitions";
import { speakWord } from "../utils/speech";
import { earnSticker, hasSticker, load } from "../utils/storage";

/** Number of rounds per playthrough. */
const ROUND_COUNT = 6;

/** Y position of progress dots from top of screen. */
const PROGRESS_DOT_Y = 60;

/** Spacing between progress dots (px). */
const PROGRESS_DOT_SPACING = 40;

/** Radius of progress dots (px). */
const PROGRESS_DOT_RADIUS = 8;

/** Original SVG texture size (used for scale calculations). */
const SVG_SIZE = 512;

/** Display size of the sticker image in the unlock animation. */
const STICKER_DISPLAY_SIZE = 256;

/** Target scale for the sticker image (display size / texture size). */
const STICKER_SCALE = STICKER_DISPLAY_SIZE / SVG_SIZE;

/** Duration of sticker reveal animation (ms). */
const WIN_TWEEN_DURATION = 300;

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
const CARD_COL_X_OFFSET = 200;

/** Stroke width of card outlines. */
const OUTLINE_WIDTH = 4;

/** Delay before the next round after a correct answer (ms). */
const NEXT_ROUND_DELAY = 700;

/** Auto-return delay to Hub after completion (ms). */
const AUTO_RETURN_DELAY = 3000;

/** Wiggle amplitude for an incorrect answer (degrees). */
const WIGGLE_ANGLE = 4;

/** Reduced-motion wiggle amplitude (degrees). */
const WIGGLE_REDUCED_ANGLE = 2;

/** Wiggle swing duration (ms). */
const WIGGLE_DURATION = 350;

/** Reduced-motion wiggle swing duration (ms). */
const WIGGLE_REDUCED_DURATION = 200;

/** Number of yoyo repeats for the incorrect-answer wiggle. */
const WIGGLE_REPEATS = 3;

/** Progress dot pop peak scale. */
const DOT_POP_SCALE = 1.4;

/** Reduced-motion progress dot pop peak scale. */
const DOT_POP_REDUCED_SCALE = 1.2;

/** Progress dot pop duration (ms). */
const DOT_POP_DURATION = 250;

/** Reduced-motion progress dot pop duration (ms). */
const DOT_POP_REDUCED_DURATION = 150;

/**
 * Find the Word scene — a picture is shown and its word is spoken aloud, and
 * the child taps the matching printed word among 4 cards in a 2×2 grid.
 * Correct taps chime, cheer, and advance; incorrect taps wiggle gently
 * (no-fail). Six rounds win the game: shared celebration + sticker on first
 * completion.
 */
export class WordMatchScene extends Phaser.Scene {
  private parentLock?: ParentLock;
  private mascot?: Mascot;
  private readonly audioManager: AudioManager;
  private readonly progressDots: Phaser.GameObjects.Arc[] = [];
  /** Answer card backgrounds of the current round. */
  private readonly cardRects: Phaser.GameObjects.Rectangle[] = [];
  /** Letter images per card of the current round (indexed like cardRects). */
  private readonly cardLetters: Phaser.GameObjects.Image[][] = [];
  /** Per-round display objects (currently the prompt picture). */
  private readonly roundObjects: Phaser.GameObjects.GameObject[] = [];
  private rounds: WordRound[] = [];
  private roundIndex = 0;
  private inputLocked = false;

  constructor() {
    super({ key: "WordMatch" });
    this.audioManager = AudioManager.getInstance();
  }

  create(): void {
    sceneEntrance(this);
    this.mascot = createCornerMascot(this);

    const backButton = this.add.text(20, 20, "← Back", {
      fontSize: "24px",
      color: "#2d3748",
    });
    backButton.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(0, 0, 96, 96),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    });

    this.parentLock = new ParentLock({
      scene: this,
      target: backButton,
      onSuccess: () => {
        transitionToScene(this, "Hub");
      },
      onFailure: () => {
        // No action needed on failure.
      },
    });
    attachPressFeedback(backButton);

    this.createProgressDots();

    this.rounds = generateWordPlaythrough(ROUND_COUNT);
    this.roundIndex = 0;
    this.renderRound();

    this.events.on("shutdown", () => {
      this.parentLock?.destroy();
      this.mascot?.destroy();
      this.mascot = undefined;
    });
  }

  /** Creates 6 progress dots at the top of the screen, dimmed by default. */
  private createProgressDots(): void {
    const startX = this.cameras.main.centerX - ((ROUND_COUNT - 1) * PROGRESS_DOT_SPACING) / 2;
    for (let i = 0; i < ROUND_COUNT; i++) {
      const dot = this.add.circle(
        startX + i * PROGRESS_DOT_SPACING,
        PROGRESS_DOT_Y,
        PROGRESS_DOT_RADIUS,
        0x2d3748,
        0.3,
      );
      this.progressDots.push(dot);
    }
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
      card.setStrokeStyle(OUTLINE_WIDTH, 0x2d3748, 1);
      card.setInteractive({
        hitArea: new Phaser.Geom.Rectangle(0, 0, cardWidth, CARD_HEIGHT),
        hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      });
      card.on("pointerdown", () => this.handleChoice(i));
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
      this.handleCorrect();
    } else {
      this.handleIncorrect(choiceIndex);
    }
  }

  /**
   * Handles a correct answer: the correct chime plays, Professor Hoot cheers,
   * the progress dot fills with a pop, and the next round starts after a
   * short delay (completion after the final round).
   */
  private handleCorrect(): void {
    this.inputLocked = true;
    this.audioManager.playCorrect();
    this.mascot?.cheer();
    this.fillProgressDot();

    this.time.delayedCall(NEXT_ROUND_DELAY, () => {
      this.roundIndex++;
      if (this.roundIndex >= this.rounds.length) {
        this.handleComplete();
      } else {
        this.inputLocked = false;
        this.renderRound();
      }
    });
  }

  /** Handles an incorrect answer: a gentle wiggle, soft tone, no penalty. */
  private handleIncorrect(choiceIndex: number): void {
    this.audioManager.playIncorrect();
    this.mascot?.nod();

    const targets = [this.cardRects[choiceIndex], ...this.cardLetters[choiceIndex]];
    const angle = isReducedMotion() ? WIGGLE_REDUCED_ANGLE : WIGGLE_ANGLE;
    this.tweens.add({
      targets,
      angle,
      duration: motionDuration(WIGGLE_DURATION, WIGGLE_REDUCED_DURATION),
      yoyo: true,
      repeat: WIGGLE_REPEATS,
      ease: "Sine.inOut",
    });
  }

  /** Fills the progress dot for the just-completed round with a pop. */
  private fillProgressDot(): void {
    const dot = this.progressDots[this.roundIndex];
    dot.setAlpha(1);
    this.tweens.add({
      targets: dot,
      scaleX: motionScale(DOT_POP_SCALE, DOT_POP_REDUCED_SCALE),
      scaleY: motionScale(DOT_POP_SCALE, DOT_POP_REDUCED_SCALE),
      duration: motionDuration(DOT_POP_DURATION, DOT_POP_REDUCED_DURATION),
      ease: "Back.out",
      yoyo: true,
    });
  }

  /**
   * Handles game completion: plays win SFX, runs the shared celebration,
   * awards a sticker on first completion, and auto-returns to Hub after 3s.
   */
  private handleComplete(): void {
    this.inputLocked = true;
    this.audioManager.playWin();
    this.mascot?.cheer(true);
    createWinCelebration(this, this.cameras.main.centerX, this.cameras.main.centerY);

    const earnedNow = !hasSticker("word-match");
    if (earnedNow) {
      earnSticker("word-match");
      this.audioManager.playSticker();
      this.createStickerAnimation();
    }

    this.time.delayedCall(AUTO_RETURN_DELAY, () => {
      transitionToScene(this, "Hub", earnedNow ? { justEarned: "word-match" } : undefined);
    });
  }

  /** Shows a sticker unlock animation at the center of the screen. */
  private createStickerAnimation(): void {
    const stickerImage = this.add
      .image(this.cameras.main.centerX, this.cameras.main.centerY, "sticker_word_match")
      .setScale(0);

    this.tweens.add({
      targets: stickerImage,
      scaleX: STICKER_SCALE,
      scaleY: STICKER_SCALE,
      duration: motionDuration(WIN_TWEEN_DURATION, 180),
      ease: "Back.out",
    });
  }
}
