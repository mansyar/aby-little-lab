import Phaser from "phaser";
import { AudioManager } from "../audio/AudioManager";
import { createCornerMascot, type Mascot } from "../components/Mascot";
import { ParentLock } from "../components/ParentLock";
import { SpeakerButton } from "../components/SpeakerButton";
import { type AlphabetRound, generatePlaythrough } from "../game/alphabetLogic";
import { createCompletionSplash, createWinCelebration } from "../utils/completionEffect";
import { isReducedMotion, motionDuration, motionScale } from "../utils/motion";
import { attachPressFeedback } from "../utils/pressFeedback";
import { sceneEntrance, transitionToScene } from "../utils/sceneTransitions";
import { speakLetter } from "../utils/speech";
import { earnSticker, hasSticker, load } from "../utils/storage";
import { textStyle } from "../utils/typography";

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

/** Horizontal gap between the target letter and the replay button (px). */
const SPEAKER_OFFSET = 70;

/** Vertical offset of the answer cards from screen center (px). */
const CARDS_Y_OFFSET = 180;

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

/** Stroke width of card outlines. */
const OUTLINE_WIDTH = 4;

/** Y position of progress dots from top of screen. */
const PROGRESS_DOT_Y = 60;

/** Spacing between progress dots (px). */
const PROGRESS_DOT_SPACING = 40;

/** Radius of progress dots (px). */
const PROGRESS_DOT_RADIUS = 8;

/** Progress dot pop peak scale. */
const DOT_POP_SCALE = 1.4;

/** Reduced-motion progress dot pop peak scale. */
const DOT_POP_REDUCED_SCALE = 1.2;

/** Progress dot pop duration (ms). */
const DOT_POP_DURATION = 250;

/** Reduced-motion progress dot pop duration (ms). */
const DOT_POP_REDUCED_DURATION = 150;

/** Original SVG texture size (used for scale calculations). */
const SVG_SIZE = 512;

/** Display size of the sticker image in the unlock animation. */
const STICKER_DISPLAY_SIZE = 256;

/** Target scale for the sticker image (display size / texture size). */
const STICKER_SCALE = STICKER_DISPLAY_SIZE / SVG_SIZE;

/** Duration of sticker reveal animation (ms). */
const WIN_TWEEN_DURATION = 300;

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
export class AlphabetScene extends Phaser.Scene {
  private parentLock?: ParentLock;
  private mascot?: Mascot;
  private speaker?: SpeakerButton;
  private readonly audioManager: AudioManager;
  private readonly progressDots: Phaser.GameObjects.Arc[] = [];
  /** Answer card backgrounds of the current round. */
  private readonly cardRects: Phaser.GameObjects.Rectangle[] = [];
  /** Answer card letter images of the current round. */
  private readonly cardLetters: Phaser.GameObjects.Image[] = [];
  /** Per-round display objects (currently the target letter image). */
  private readonly roundObjects: Phaser.GameObjects.GameObject[] = [];
  private rounds: AlphabetRound[] = [];
  private roundIndex = 0;
  private inputLocked = false;

  constructor() {
    super({ key: "Alphabet" });
    this.audioManager = AudioManager.getInstance();
  }

  create(): void {
    sceneEntrance(this);
    this.mascot = createCornerMascot(this);

    const backButton = this.add.text(
      20,
      20,
      "← Back",
      textStyle({
        fontSize: "24px",
        color: "#2d3748",
      }),
    );
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

    // "Hear it again" — re-speaks the current target letter on demand.
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;
    this.speaker = new SpeakerButton(
      this,
      centerX + TARGET_DISPLAY_SIZE / 2 + SPEAKER_OFFSET,
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

    this.events.on("shutdown", () => {
      this.parentLock?.destroy();
      this.mascot?.destroy();
      this.mascot = undefined;
      this.speaker?.destroy();
      this.speaker = undefined;
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
      card.setStrokeStyle(OUTLINE_WIDTH, 0x2d3748, 1);
      card.setInteractive({
        hitArea: new Phaser.Geom.Rectangle(0, 0, CARD_SIZE, CARD_SIZE),
        hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      });
      card.on("pointerdown", () => this.handleChoice(i));
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

    const rect = this.cardRects[choiceIndex];
    const letter = this.cardLetters[choiceIndex];
    const angle = isReducedMotion() ? WIGGLE_REDUCED_ANGLE : WIGGLE_ANGLE;
    this.tweens.add({
      targets: [rect, letter],
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

    const earnedNow = !hasSticker("alphabet-match");
    if (earnedNow) {
      earnSticker("alphabet-match");
      this.audioManager.playSticker();
      this.createStickerAnimation();
    }

    this.time.delayedCall(AUTO_RETURN_DELAY, () => {
      transitionToScene(this, "Hub", earnedNow ? { justEarned: "alphabet-match" } : undefined);
    });
  }

  /** Shows a sticker unlock animation at the center of the screen. */
  private createStickerAnimation(): void {
    const stickerImage = this.add
      .image(this.cameras.main.centerX, this.cameras.main.centerY, "sticker_alphabet_match")
      .setScale(0);

    this.tweens.add({
      targets: stickerImage,
      scaleX: STICKER_SCALE,
      scaleY: STICKER_SCALE,
      duration: motionDuration(WIN_TWEEN_DURATION, 180),
      delay: motionDuration(400, 250),
      ease: "Back.out",
    });
  }
}
