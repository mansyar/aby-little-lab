import Phaser from "phaser";
import {
  generatePlaythrough,
  getCorrectShape,
  type PatternRound,
} from "../game/patternBuilderLogic";
import type { ShapeType } from "../game/shapeSorterLogic";
import { createCompletionSplash } from "../utils/completionEffect";
import { isReducedMotion, motionDuration } from "../utils/motion";
import { sceneEntrance } from "../utils/sceneTransitions";
import { GameSceneBase } from "./GameSceneBase";

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
const ROUND_COUNT = 6;

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

/** Alpha of the gap slot outline (softer than card outlines). */
const GAP_OUTLINE_ALPHA = 0.4;

/** Fill color of the empty gap slot (matches app background). */
const GAP_SLOT_COLOR = 0xfaf9f6;

/**
 * Pattern Builder scene — the child completes a 4-shape repeating pattern
 * (ABAB/AABB/ABB) by tapping the missing shape from 3 answer cards. Correct
 * taps snap the shape into the gap; incorrect taps wiggle gently (no-fail).
 * Five rounds win the game: shared celebration + sticker on first completion.
 */
export class PatternBuilderScene extends GameSceneBase {
  /** Slot/gap objects of the current round (destroyed on re-render). */
  private readonly roundObjects: Phaser.GameObjects.GameObject[] = [];
  /** Answer card backgrounds of the current round. */
  private readonly cardRects: Phaser.GameObjects.Rectangle[] = [];
  /** Answer card shape images of the current round. */
  private readonly cardShapes: Phaser.GameObjects.Image[] = [];
  private rounds: PatternRound[] = [];
  private roundIndex = 0;

  constructor() {
    super("PatternBuilder");
  }

  create(): void {
    sceneEntrance(this);
    this.createCornerMascot();
    this.createBackButton();

    // Reset per-session state so a relaunch starts with fresh progress dots.
    this.progressDots.length = 0;
    this.createProgressDots(ROUND_COUNT);

    this.rounds = generatePlaythrough(ROUND_COUNT);
    this.roundIndex = 0;
    this.inputLocked = false;
    this.renderRound();

    this.registerShutdownCleanup();
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
        gap.setStrokeStyle(this.OUTLINE_WIDTH, 0x2d3748, GAP_OUTLINE_ALPHA);
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
      card.setStrokeStyle(this.OUTLINE_WIDTH, 0x2d3748, 1);
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

    // Burst at the gap the shape is flying into.
    createCompletionSplash(this, targetX, targetY);

    this.tweens.add({
      targets: shape,
      x: targetX,
      y: targetY,
      duration: motionDuration(SNAP_DURATION, SNAP_REDUCED_DURATION),
      ease: "Back.out",
      onComplete: () => {
        shape.destroy();
        this.cardRects[choiceIndex]?.destroy();
        this.cardRects.splice(choiceIndex, 1);
        this.cardShapes.splice(choiceIndex, 1);

        const slot = this.add.image(targetX, targetY, SHAPE_TEXTURES[getCorrectShape(round)]);
        slot.setDisplaySize(SLOT_SIZE, SLOT_SIZE);
        this.roundObjects.push(slot);

        this.fillProgressDot(this.roundIndex);

        this.time.delayedCall(this.NEXT_ROUND_DELAY, () => {
          this.roundIndex++;
          if (this.roundIndex >= this.rounds.length) {
            this.completeGame("pattern-builder");
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
    const angle = isReducedMotion() ? this.WIGGLE_REDUCED_ANGLE : this.WIGGLE_ANGLE;
    this.tweens.add({
      targets: [rect, shape],
      angle,
      duration: motionDuration(this.WIGGLE_DURATION, this.WIGGLE_REDUCED_DURATION),
      yoyo: true,
      repeat: this.WIGGLE_REPEATS,
      ease: "Sine.inOut",
    });
  }
}
