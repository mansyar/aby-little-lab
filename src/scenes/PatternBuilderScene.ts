import type Phaser from "phaser";
import {
  generatePlaythrough,
  getCorrectShape,
  type PatternRound,
} from "../game/patternBuilderLogic";
import type { ShapeType } from "../game/shapeSorterLogic";
import type { GameId } from "../types";
import { createCompletionSplash } from "../utils/completionEffect";
import { motionDuration } from "../utils/motion";
import { sceneEntrance } from "../utils/sceneTransitions";
import { getAdaptiveBandShift } from "../utils/storage";
import { ChoiceRoundScene } from "./ChoiceRoundScene";

/** Shape texture keys indexed by ShapeType. */
const SHAPE_TEXTURES: Record<ShapeType, string> = {
  circle: "shape_circle",
  square: "shape_square",
  triangle: "shape_triangle",
  star: "shape_star",
  heart: "shape_heart",
  crescent: "shape_crescent",
  oval: "shape_oval",
  rectangle: "shape_rectangle",
  diamond: "shape_diamond",
  pentagon: "shape_pentagon",
  hexagon: "shape_hexagon",
  octagon: "shape_octagon",
  trapezoid: "shape_trapezoid",
  semicircle: "shape_semicircle",
  arrow: "shape_arrow",
  plus: "shape_plus",
  ring: "shape_ring",
  teardrop: "shape_teardrop",
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
 * Six rounds win the game: shared celebration + sticker on first completion.
 */
export class PatternBuilderScene extends ChoiceRoundScene {
  /** Slot/gap objects of the current round (destroyed on re-render). */
  private readonly roundObjects: Phaser.GameObjects.GameObject[] = [];
  /** Answer card backgrounds of the current round. */
  private readonly cardRects: Phaser.GameObjects.Rectangle[] = [];
  /** Answer card shape images of the current round. */
  private readonly cardShapes: Phaser.GameObjects.Image[] = [];
  private rounds: PatternRound[] = [];

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
    this.createSpokenInstruction("Pick the shape that finishes the pattern.");

    this.rounds = generatePlaythrough(ROUND_COUNT, getAdaptiveBandShift("pattern-builder"));
    this.roundIndex = 0;
    this.inputLocked = false;
    this.renderRound();

    this.registerShutdownCleanup();
  }

  protected totalRounds(): number {
    return this.rounds.length;
  }

  protected gameId(): GameId {
    return "pattern-builder";
  }

  protected isChoiceCorrect(index: number): boolean {
    const round = this.rounds[this.roundIndex];
    return round.choices[index] === getCorrectShape(round);
  }

  /**
   * Renders the current round: 4 slots (3 filled shapes + 1 outlined gap)
   * and 3 answer cards below the row.
   */
  protected buildRoundContent(): void {
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

  /** Destroys the pattern row and the answer cards of the current round. */
  protected clearRoundContent(): void {
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

  /**
   * Flies the tapped shape into the gap with a Back.out snap, bursting a splash
   * at the slot it is landing in. The filled slot replaces the answer card once
   * the shape has landed.
   */
  protected onCorrect(index: number): void {
    const round = this.rounds[this.roundIndex];
    const targetX = this.cameras.main.centerX + (round.gapIndex - 1.5) * SLOT_SPACING;
    const targetY = this.cameras.main.centerY + ROW_Y_OFFSET;
    const shape = this.cardShapes[index];

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
        this.cardRects[index]?.destroy();
        this.cardRects.splice(index, 1);
        this.cardShapes.splice(index, 1);

        const slot = this.add.image(targetX, targetY, SHAPE_TEXTURES[getCorrectShape(round)]);
        slot.setDisplaySize(SLOT_SIZE, SLOT_SIZE);
        this.roundObjects.push(slot);
      },
    });
  }

  /** Creates the 3 answer cards with their shape images. */
  private createCards(round: PatternRound): void {
    const centerX = this.cameras.main.centerX;
    const cardsY = this.cameras.main.centerY + CARDS_Y_OFFSET;

    for (let i = 0; i < round.choices.length; i++) {
      const x = centerX + (i - 1) * CARD_SPACING;
      this.cardRects.push(this.createChoiceTarget(x, cardsY, CARD_SIZE, i));

      const shape = this.add.image(x, cardsY, SHAPE_TEXTURES[round.choices[i]]);
      shape.setDisplaySize(CARD_SIZE, CARD_SIZE);
      this.cardShapes.push(shape);
      this.attachCardContent(i, [shape]);
    }
  }
}
