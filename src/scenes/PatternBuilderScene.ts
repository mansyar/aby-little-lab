import Phaser from "phaser";
import { AudioManager } from "../audio/AudioManager";
import { createCornerMascot, type Mascot } from "../components/Mascot";
import { ParentLock } from "../components/ParentLock";
import {
  generatePlaythrough,
  getCorrectShape,
  type PatternRound,
} from "../game/patternBuilderLogic";
import type { ShapeType } from "../game/shapeSorterLogic";
import { createWinCelebration } from "../utils/completionEffect";
import { isReducedMotion, motionDuration, motionScale } from "../utils/motion";
import { attachPressFeedback } from "../utils/pressFeedback";
import { sceneEntrance, transitionToScene } from "../utils/sceneTransitions";
import { earnSticker, hasSticker } from "../utils/storage";

/** Shape texture keys indexed by ShapeType. */
const SHAPE_TEXTURES: Record<ShapeType, string> = {
  circle: "shape_circle",
  square: "shape_square",
  triangle: "shape_triangle",
  star: "shape_star",
  heart: "shape_heart",
  crescent: "shape_crescent",
};

/** Number of rounds per playthrough. */
const ROUND_COUNT = 5;

/** Display size for slot shapes (exceeds 64px minimum, meets 96px ideal). */
const SLOT_SIZE = 120;

/** Display size for answer cards. */
const CARD_SIZE = 128;

/** Horizontal spacing between pattern slots (px). */
const SLOT_SPACING = 170;

/** Horizontal spacing between answer cards (px). */
const CARD_SPACING = 200;

/** Vertical offset of the pattern row from screen center (px). */
const ROW_Y_OFFSET = -80;

/** Vertical offset of the answer cards from screen center (px). */
const CARDS_Y_OFFSET = 170;

/** Duration of the correct-answer snap tween (ms). */
const SNAP_DURATION = 200;

/** Reduced-motion snap duration (ms). */
const SNAP_REDUCED_DURATION = 120;

/** Delay before the next round after a correct answer (ms). */
const NEXT_ROUND_DELAY = 700;

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

/** Stroke width of card/gap outlines. */
const OUTLINE_WIDTH = 4;

/** Alpha of the gap slot outline (softer than card outlines). */
const GAP_OUTLINE_ALPHA = 0.4;

/** Fill color of the empty gap slot (matches app background). */
const GAP_SLOT_COLOR = 0xfaf9f6;

/** Y position of progress dots from top of screen. */
const PROGRESS_DOT_Y = 60;

/** Spacing between progress dots (px). */
const PROGRESS_DOT_SPACING = 40;

/** Radius of progress dots (px). */
const PROGRESS_DOT_RADIUS = 8;

/** Auto-return delay to Hub after completion (ms). */
const AUTO_RETURN_DELAY = 3000;

/** Original SVG texture size (used for scale calculations). */
const SVG_SIZE = 512;

/** Display size of the sticker image in the unlock animation. */
const STICKER_DISPLAY_SIZE = 256;

/** Target scale for the sticker image (display size / texture size). */
const STICKER_SCALE = STICKER_DISPLAY_SIZE / SVG_SIZE;

/** Duration of sticker reveal animation (ms). */
const WIN_TWEEN_DURATION = 300;

/** Progress dot pop peak scale. */
const DOT_POP_SCALE = 1.4;

/** Reduced-motion progress dot pop peak scale. */
const DOT_POP_REDUCED_SCALE = 1.2;

/** Progress dot pop duration (ms). */
const DOT_POP_DURATION = 250;

/** Reduced-motion progress dot pop duration (ms). */
const DOT_POP_REDUCED_DURATION = 150;

/**
 * Pattern Builder scene — the child completes a 4-shape repeating pattern
 * (ABAB/AABB/ABB) by tapping the missing shape from 3 answer cards. Correct
 * taps snap the shape into the gap; incorrect taps wiggle gently (no-fail).
 * Five rounds win the game: shared celebration + sticker on first completion.
 */
export class PatternBuilderScene extends Phaser.Scene {
  private parentLock?: ParentLock;
  private mascot?: Mascot;
  private readonly audioManager: AudioManager;
  private readonly progressDots: Phaser.GameObjects.Arc[] = [];
  /** Slot/gap objects of the current round (destroyed on re-render). */
  private readonly roundObjects: Phaser.GameObjects.GameObject[] = [];
  /** Answer card backgrounds of the current round. */
  private readonly cardRects: Phaser.GameObjects.Rectangle[] = [];
  /** Answer card shape images of the current round. */
  private readonly cardShapes: Phaser.GameObjects.Image[] = [];
  private rounds: PatternRound[] = [];
  private roundIndex = 0;
  private inputLocked = false;

  constructor() {
    super({ key: "PatternBuilder" });
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

    this.rounds = generatePlaythrough(ROUND_COUNT);
    this.roundIndex = 0;
    this.renderRound();

    this.events.on("shutdown", () => {
      this.parentLock?.destroy();
      this.mascot?.destroy();
      this.mascot = undefined;
    });
  }

  /** Creates 5 progress dots at the top of the screen, dimmed by default. */
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
   * Renders the current round: 4 slots (3 filled shapes + 1 outlined gap)
   * and 3 answer cards below the row. Previous round objects are destroyed.
   */
  private renderRound(): void {
    this.clearRound();

    const round = this.rounds[this.roundIndex];
    const centerX = this.cameras.main.centerX;
    const rowY = this.cameras.main.centerY + ROW_Y_OFFSET;

    for (let i = 0; i < round.row.length; i++) {
      const x = centerX + (i - 1.5) * SLOT_SPACING;
      if (i === round.gapIndex) {
        const gap = this.add.rectangle(x, rowY, SLOT_SIZE, SLOT_SIZE, GAP_SLOT_COLOR);
        gap.setStrokeStyle(OUTLINE_WIDTH, 0x2d3748, GAP_OUTLINE_ALPHA);
        this.roundObjects.push(gap);
      } else {
        const shape = this.add.image(x, rowY, SHAPE_TEXTURES[round.row[i]]);
        shape.setDisplaySize(SLOT_SIZE, SLOT_SIZE);
        this.roundObjects.push(shape);
      }
    }

    this.createCards(round);
  }

  /** Creates the 3 answer cards with their shape images and tap handling. */
  private createCards(round: PatternRound): void {
    const centerX = this.cameras.main.centerX;
    const cardsY = this.cameras.main.centerY + CARDS_Y_OFFSET;

    for (let i = 0; i < round.choices.length; i++) {
      const x = centerX + (i - 1) * CARD_SPACING;
      const card = this.add.rectangle(x, cardsY, CARD_SIZE, CARD_SIZE, 0xffffff);
      card.setStrokeStyle(OUTLINE_WIDTH, 0x2d3748, 1);
      card.setInteractive({
        hitArea: new Phaser.Geom.Rectangle(0, 0, CARD_SIZE, CARD_SIZE),
        hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      });
      card.on("pointerdown", () => this.handleChoice(i));
      this.cardRects.push(card);

      const shape = this.add.image(x, cardsY, SHAPE_TEXTURES[round.choices[i]]);
      shape.setDisplaySize(CARD_SIZE, CARD_SIZE);
      this.cardShapes.push(shape);
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
    for (const card of this.cardShapes) {
      card.destroy();
    }
    this.cardShapes.length = 0;
  }

  /** Handles a tap on an answer card: correct fills the gap, wrong wiggles. */
  private handleChoice(choiceIndex: number): void {
    if (this.inputLocked) return;
    const round = this.rounds[this.roundIndex];
    if (round.choices[choiceIndex] === getCorrectShape(round)) {
      this.handleCorrect(choiceIndex);
    } else {
      this.handleIncorrect(choiceIndex);
    }
  }

  /**
   * Handles a correct answer: the tapped shape flies to the gap slot with a
   * Back.out snap, a chime plays, the progress dot fills, and the next round
   * starts after a short delay (completion after the final round).
   */
  private handleCorrect(choiceIndex: number): void {
    this.inputLocked = true;
    this.audioManager.playCorrect();
    this.mascot?.cheer();

    const round = this.rounds[this.roundIndex];
    const targetX = this.cameras.main.centerX + (round.gapIndex - 1.5) * SLOT_SPACING;
    const targetY = this.cameras.main.centerY + ROW_Y_OFFSET;
    const shape = this.cardShapes[choiceIndex];

    this.tweens.add({
      targets: shape,
      x: targetX,
      y: targetY,
      duration: motionDuration(SNAP_DURATION, SNAP_REDUCED_DURATION),
      ease: "Back.out",
      onComplete: () => {
        this.cardRects[choiceIndex]?.destroy();
        this.cardRects.splice(choiceIndex, 1);
        this.cardShapes.splice(choiceIndex, 1);

        const slot = this.add.image(targetX, targetY, SHAPE_TEXTURES[getCorrectShape(round)]);
        slot.setDisplaySize(SLOT_SIZE, SLOT_SIZE);
        this.roundObjects.push(slot);

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
      },
    });
  }

  /** Handles an incorrect answer: a gentle wiggle, soft tone, no penalty. */
  private handleIncorrect(choiceIndex: number): void {
    this.audioManager.playIncorrect();
    this.mascot?.nod();

    const rect = this.cardRects[choiceIndex];
    const shape = this.cardShapes[choiceIndex];
    const angle = isReducedMotion() ? WIGGLE_REDUCED_ANGLE : WIGGLE_ANGLE;
    this.tweens.add({
      targets: [rect, shape],
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

    const earnedNow = !hasSticker("pattern-builder");
    if (earnedNow) {
      earnSticker("pattern-builder");
      this.audioManager.playSticker();
      this.createStickerAnimation();
    }

    this.time.delayedCall(AUTO_RETURN_DELAY, () => {
      transitionToScene(this, "Hub", earnedNow ? { justEarned: "pattern-builder" } : undefined);
    });
  }

  /** Shows a sticker unlock animation at the center of the screen. */
  private createStickerAnimation(): void {
    const stickerImage = this.add
      .image(this.cameras.main.centerX, this.cameras.main.centerY, "sticker_pattern_builder")
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
