import Phaser from "phaser";
import {
  buildPlaythrough,
  isPair,
  isRoundComplete,
  type MemoryBand,
  type MemoryRound,
} from "../game/memoryMatchLogic";
import { isReducedMotion, motionDuration } from "../utils/motion";
import { attachPressFeedback } from "../utils/pressFeedback";
import { sceneEntrance } from "../utils/sceneTransitions";
import { getAdaptiveBandShift } from "../utils/storage";
import { GameSceneBase } from "./GameSceneBase";

/** Number of rounds per playthrough (2 per band). */
const ROUND_COUNT = 6;

/** Horizontal and vertical gap between cards (px). */
const GRID_SPACING = 18;

/** Vertical offset of the grid center below the screen center (px). */
const GRID_Y_OFFSET = 30;

/** Face texture display size as a fraction of the card size. */
const ITEM_FILL = 0.58;

/** Duration of one half of a card flip (scaleX 1->0 or 0->1) (ms). */
const FLIP_HALF_DURATION = 180;

/** Reduced-motion half-flip duration (ms). */
const FLIP_HALF_REDUCED_DURATION = 120;

/** Card deal pop-in duration (ms). */
const DEAL_DURATION = 240;

/** Reduced-motion card deal pop-in duration (ms). */
const DEAL_REDUCED_DURATION = 120;

/** Stagger between consecutive cards during the deal (ms). */
const DEAL_STAGGER = 40;

/** Pause before a mismatched pair flips back face-down (ms). */
const MISMATCH_PAUSE = 800;

/** Duration of the success-color flash on matched cards (ms). */
const FLASH_DURATION = 250;

/** Card size per band — all bands stay above the 96px ideal touch target. */
const CARD_SIZE: Record<MemoryBand, number> = {
  easy: 150,
  medium: 132,
  hard: 120,
};

/**
 * Memory Match scene — classic visual pairs game. Cards deal face-down in a
 * progressive grid (easy 2x3, medium 3x4, hard 4x4); tapping reveals a card,
 * tapping its twin locks both face-up with a success flash, and a mismatched
 * pair wiggles gently before flipping back (no-fail). Six rounds (2 per band)
 * win the game: shared celebration + sticker on first completion.
 */
export class MemoryMatchScene extends GameSceneBase {
  /** Card bases of the current round. */
  private readonly cardRects: Phaser.GameObjects.Rectangle[] = [];
  /** Face (item) images of the current round — hidden while face-down. */
  private readonly cardFaces: Phaser.GameObjects.Image[] = [];
  /** Card-back images of the current round — shown while face-down. */
  private readonly cardBacks: Phaser.GameObjects.Image[] = [];
  /** Whether each card is currently face-up. */
  private revealed: boolean[] = [];
  /** Whether each card's pair is matched (locked face-up). */
  private matched: boolean[] = [];
  /** Index of the first card of the pending pair attempt, or null. */
  private firstPick: number | null = null;
  private rounds: MemoryRound[] = [];
  private roundIndex = 0;

  constructor() {
    super("MemoryMatch");
  }

  create(): void {
    sceneEntrance(this);
    this.createCornerMascot();
    this.createBackButton();
    this.createProgressDots(ROUND_COUNT);

    this.rounds = buildPlaythrough(getAdaptiveBandShift("memory-match"));
    this.roundIndex = 0;
    this.inputLocked = false;
    this.renderRound();

    this.registerShutdownCleanup();
  }

  /**
   * Renders the current round: a face-down card grid whose layout comes from
   * the pure logic round. Each card is a white base rectangle carrying a
   * card-back image on top and a hidden face texture underneath, popped in
   * with a staggered deal animation.
   */
  private renderRound(): void {
    this.clearRound();

    const round = this.rounds[this.roundIndex];
    const size = CARD_SIZE[round.band];
    const centerX = this.cameras.main.centerX;
    const gridY = this.cameras.main.centerY + GRID_Y_OFFSET;
    const gridW = round.cols * size + (round.cols - 1) * GRID_SPACING;
    const gridH = round.rows * size + (round.rows - 1) * GRID_SPACING;
    const leftX = centerX - gridW / 2 + size / 2;
    const topY = gridY - gridH / 2 + size / 2;

    for (let i = 0; i < round.layout.length; i++) {
      const col = i % round.cols;
      const row = Math.floor(i / round.cols);
      const x = leftX + col * (size + GRID_SPACING);
      const y = topY + row * (size + GRID_SPACING);

      const rect = this.add.rectangle(x, y, size, size, this.CARD_BG_COLOR);
      rect.setStrokeStyle(this.OUTLINE_WIDTH, this.OUTLINE_COLOR, 1);
      rect.setInteractive({
        hitArea: new Phaser.Geom.Rectangle(0, 0, size, size),
        hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      });
      rect.on("pointerdown", () => this.handleTap(i));
      attachPressFeedback(rect);
      this.cardRects.push(rect);

      const face = this.add
        .image(x, y, round.layout[i])
        .setDisplaySize(size * ITEM_FILL, size * ITEM_FILL)
        .setVisible(false);
      this.cardFaces.push(face);

      const back = this.add.image(x, y, "card_back").setDisplaySize(size, size);
      this.cardBacks.push(back);

      // Staggered deal pop-in for the whole card stack.
      for (const part of [rect, back, face]) {
        part.setScale(0);
      }
      this.tweens.add({
        targets: [rect, back, face],
        scaleX: 1,
        scaleY: 1,
        duration: motionDuration(DEAL_DURATION, DEAL_REDUCED_DURATION),
        delay: i * DEAL_STAGGER,
        ease: "Back.out",
      });
    }
  }

  /** Destroys all display objects created for the current round. */
  private clearRound(): void {
    for (const rect of this.cardRects) {
      rect.destroy();
    }
    this.cardRects.length = 0;
    for (const face of this.cardFaces) {
      face.destroy();
    }
    this.cardFaces.length = 0;
    for (const back of this.cardBacks) {
      back.destroy();
    }
    this.cardBacks.length = 0;
    // Dense arrays: Array.prototype.every skips sparse holes, which would
    // make isRoundComplete treat a half-matched round as complete.
    const cardCount = this.rounds[this.roundIndex].layout.length;
    this.revealed = new Array(cardCount).fill(false);
    this.matched = new Array(cardCount).fill(false);
    this.firstPick = null;
  }

  /** Handles a tap on a face-down card: pairs it with the previous pick. */
  private handleTap(cardIndex: number): void {
    if (this.inputLocked || this.revealed[cardIndex] || this.matched[cardIndex]) return;
    this.audioManager.playPop();
    this.flipCard(cardIndex, true);

    if (this.firstPick === null) {
      this.firstPick = cardIndex;
      return;
    }

    const other = this.firstPick;
    this.firstPick = null;
    const round = this.rounds[this.roundIndex];
    if (isPair(round.layout, other, cardIndex)) {
      this.handleMatch(other, cardIndex);
    } else {
      this.handleMismatch(other, cardIndex);
    }
  }

  /**
   * Handles a matched pair: the correct chime plays, both cards flash the
   * success color, Professor Hoot cheers, and the pair locks face-up. When the
   * whole round is matched the progress dot pops and the next round starts
   * after a short delay (completion after the final round).
   */
  private handleMatch(first: number, second: number): void {
    this.matched[first] = true;
    this.matched[second] = true;
    this.audioManager.playCorrect();
    this.recordCorrect();
    this.mascot?.cheer();

    for (const index of [first, second]) {
      const rect = this.cardRects[index];
      rect.setFillStyle(this.SUCCESS_COLOR, 1);
      this.time.delayedCall(FLASH_DURATION, () => {
        if (!rect.destroyed) rect.setFillStyle(this.CARD_BG_COLOR, 1);
      });
    }

    if (isRoundComplete(this.matched)) {
      this.inputLocked = true;
      this.fillProgressDot(this.roundIndex);
      this.time.delayedCall(this.NEXT_ROUND_DELAY, () => {
        this.roundIndex++;
        if (this.roundIndex >= this.rounds.length) {
          this.completeGame("memory-match");
        } else {
          this.inputLocked = false;
          this.renderRound();
        }
      });
    }
  }

  /**
   * Handles a mismatched pair: a gentle wiggle, soft tone, mascot nod, then
   * both cards flip back face-down after a short pause. No penalty.
   */
  private handleMismatch(first: number, second: number): void {
    this.inputLocked = true;
    this.audioManager.playIncorrect();
    this.recordWrong();
    this.mascot?.nod();

    const angle = isReducedMotion() ? this.WIGGLE_REDUCED_ANGLE : this.WIGGLE_ANGLE;
    for (const index of [first, second]) {
      this.tweens.add({
        targets: [this.cardRects[index], this.cardBacks[index], this.cardFaces[index]],
        angle,
        duration: motionDuration(this.WIGGLE_DURATION, this.WIGGLE_REDUCED_DURATION),
        yoyo: true,
        repeat: this.WIGGLE_REPEATS,
        ease: "Sine.inOut",
      });
    }

    this.time.delayedCall(MISMATCH_PAUSE, () => {
      this.flipCard(first, false);
      this.flipCard(second, false);
      this.inputLocked = false;
    });
  }

  /**
   * Flips a card by collapsing its scaleX to 0, swapping face/back visibility
   * at the midpoint, and growing back to full width.
   */
  private flipCard(cardIndex: number, faceUp: boolean): void {
    this.revealed[cardIndex] = faceUp;
    const rect = this.cardRects[cardIndex];
    const back = this.cardBacks[cardIndex];
    const face = this.cardFaces[cardIndex];

    this.tweens.add({
      targets: [rect, back, face],
      scaleX: 0,
      duration: motionDuration(FLIP_HALF_DURATION, FLIP_HALF_REDUCED_DURATION),
      ease: "Sine.in",
      onComplete: () => {
        back.setVisible(!faceUp);
        face.setVisible(faceUp);
        this.tweens.add({
          targets: [rect, back, face],
          scaleX: 1,
          duration: motionDuration(FLIP_HALF_DURATION, FLIP_HALF_REDUCED_DURATION),
          ease: "Sine.out",
        });
      },
    });
  }
}
