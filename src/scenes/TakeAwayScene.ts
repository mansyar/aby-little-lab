import Phaser from "phaser";
import { buildPlaythrough, isCorrect, type TakeAwayRound } from "../game/takeAwayLogic";
import { isReducedMotion, motionDuration } from "../utils/motion";
import { attachPressFeedback } from "../utils/pressFeedback";
import { sceneEntrance } from "../utils/sceneTransitions";
import { getAdaptiveBandShift } from "../utils/storage";
import { GameSceneBase } from "./GameSceneBase";

/** Number of rounds per playthrough (2 per band). */
const ROUND_COUNT = 6;

/** Display size of the prompt cards (exceeds 96px ideal touch target). */
const PROMPT_CARD_SIZE = 180;

/** Display size of the answer cards (exceeds 96px ideal touch target). */
const ANSWER_CARD_SIZE = 170;

/** Display size of the minus/equals cue images (px). */
const SYMBOL_DISPLAY_SIZE = 96;

/** Original SVG texture size (used for scale calculations). */
const SVG_SIZE = 512;

/** Target scale for the minus/equals cue images (display size / texture size). */
const SYMBOL_SCALE = SYMBOL_DISPLAY_SIZE / SVG_SIZE;

/** Vertical offset of the equation row above screen center (px). */
const PROMPT_Y_OFFSET = 140;

/** Vertical offset of the answer row below screen center (px). */
const ANSWERS_Y_OFFSET = 170;

/** Horizontal gap between cards and cues in the equation row (px). */
const PROMPT_SPACING = 24;

/** Horizontal gap between answer cards (px). */
const ANSWER_SPACING = 24;

/** Display size of each item copy inside a card (px). */
const ITEM_SIZE = 38;

/** Maximum number of item copies per row inside a card. */
const ITEMS_PER_ROW = 4;

/** Gap between item copies inside a card (px). */
const ITEM_GAP = 3;

/**
 * Take Away scene — the child counts the dots on the minuend card, "takes
 * away" the subtrahend card (joined by a big "−" cue), and taps the answer
 * card whose dot-group matches the difference (equation row: [A] [−] [B] [=]).
 * Correct taps flash, chime, and advance; incorrect taps wiggle gently
 * (no-fail). Six rounds (2 per band: minuend ≤4, ≤6, ≤10) win the game:
 * shared celebration + sticker on first completion. Fully visual — no prompt
 * audio (mirrors Add It Up).
 */
export class TakeAwayScene extends GameSceneBase {
  /** Prompt card backgrounds of the current round (non-interactive prompts). */
  private readonly promptRects: Phaser.GameObjects.Rectangle[] = [];
  /** Answer card backgrounds of the current round (interactive). */
  private readonly answerRects: Phaser.GameObjects.Rectangle[] = [];
  /** Item copies of every card of the current round (prompts then answers). */
  private readonly cardItems: Phaser.GameObjects.GameObject[][] = [];
  /** Per-round display objects (the minus and equals cue images). */
  private readonly roundObjects: Phaser.GameObjects.GameObject[] = [];
  private rounds: TakeAwayRound[] = [];
  private roundIndex = 0;

  constructor() {
    super("TakeAway");
  }

  create(): void {
    sceneEntrance(this);
    this.createCornerMascot();
    this.createBackButton();
    this.createProgressDots(ROUND_COUNT);

    // No speaker button — the target is read from the visible dots, so there
    // is nothing to speak; the game is fully playable without audio.

    this.rounds = buildPlaythrough(getAdaptiveBandShift("take-away"));
    this.roundIndex = 0;
    this.inputLocked = false;
    this.renderRound();

    this.registerShutdownCleanup();
  }

  /**
   * Renders the current round: the equation row [minuend] [−] [subtrahend]
   * [=] with the four answer dot-group cards below. Previous objects are
   * destroyed.
   */
  private renderRound(): void {
    this.clearRound();

    const round = this.rounds[this.roundIndex];
    const centerX = this.cameras.main.centerX;
    const promptY = this.cameras.main.centerY - PROMPT_Y_OFFSET;
    const answersY = this.cameras.main.centerY + ANSWERS_Y_OFFSET;

    const equationWidth = 2 * PROMPT_CARD_SIZE + 2 * SYMBOL_DISPLAY_SIZE + 3 * PROMPT_SPACING;
    const leftEdge = centerX - equationWidth / 2;
    const [minuend, subtrahend] = round.promptCards;

    this.createPromptCard(minuend.count, minuend.texture, leftEdge + PROMPT_CARD_SIZE / 2, promptY);
    this.createSymbol(
      "minus",
      leftEdge + PROMPT_CARD_SIZE + PROMPT_SPACING + SYMBOL_DISPLAY_SIZE / 2,
      promptY,
    );
    this.createPromptCard(
      subtrahend.count,
      subtrahend.texture,
      leftEdge +
        PROMPT_CARD_SIZE +
        PROMPT_SPACING +
        SYMBOL_DISPLAY_SIZE +
        PROMPT_SPACING +
        PROMPT_CARD_SIZE / 2,
      promptY,
    );
    this.createSymbol(
      "equals",
      leftEdge +
        2 * PROMPT_CARD_SIZE +
        2 * PROMPT_SPACING +
        SYMBOL_DISPLAY_SIZE +
        SYMBOL_DISPLAY_SIZE / 2,
      promptY,
    );

    const answersWidth = 4 * ANSWER_CARD_SIZE + 3 * ANSWER_SPACING;
    const answersLeft = centerX - answersWidth / 2;
    for (let i = 0; i < 4; i++) {
      const x = answersLeft + i * (ANSWER_CARD_SIZE + ANSWER_SPACING) + ANSWER_CARD_SIZE / 2;

      const card = this.add.rectangle(
        x,
        answersY,
        ANSWER_CARD_SIZE,
        ANSWER_CARD_SIZE,
        this.CARD_BG_COLOR,
      );
      card.setStrokeStyle(this.OUTLINE_WIDTH, this.OUTLINE_COLOR, 1);
      card.setInteractive({
        hitArea: new Phaser.Geom.Rectangle(0, 0, ANSWER_CARD_SIZE, ANSWER_CARD_SIZE),
        hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      });
      card.on("pointerdown", () => this.handleChoice(i));
      attachPressFeedback(card);
      this.answerRects.push(card);

      this.createDotGroup(round.answerOptions[i], round.answerItemTexture, x, answersY);
    }
  }

  /** Creates one prompt card with its dot-group. */
  private createPromptCard(count: number, texture: string, x: number, y: number): void {
    const card = this.add.rectangle(x, y, PROMPT_CARD_SIZE, PROMPT_CARD_SIZE, this.CARD_BG_COLOR);
    card.setStrokeStyle(this.OUTLINE_WIDTH, this.OUTLINE_COLOR, 1);
    this.promptRects.push(card);
    this.createDotGroup(count, texture, x, y);
  }

  /** Creates a minus/equals cue image that pops in. */
  private createSymbol(key: "minus" | "equals", x: number, y: number): void {
    const symbol = this.add.image(x, y, key).setOrigin(0.5).setScale(0);
    this.roundObjects.push(symbol);
    this.tweens.add({
      targets: symbol,
      scaleX: SYMBOL_SCALE,
      scaleY: SYMBOL_SCALE,
      duration: motionDuration(this.WIN_TWEEN_DURATION, 180),
      ease: "Back.out",
    });
  }

  /**
   * Places `count` copies of the item texture in a loose grid, centered on
   * the card. Each row centers itself so a partial last row (e.g. 2 items
   * under 4+4) sits centered instead of pushed to the left.
   */
  private createDotGroup(count: number, texture: string, cardX: number, cardY: number): void {
    const items: Phaser.GameObjects.GameObject[] = [];
    const rowCount = Math.ceil(count / ITEMS_PER_ROW);
    const gridHeight = rowCount * ITEM_SIZE + (rowCount - 1) * ITEM_GAP;
    const topY = cardY - gridHeight / 2;

    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / ITEMS_PER_ROW);
      const col = i % ITEMS_PER_ROW;
      const inRow = Math.min(count - row * ITEMS_PER_ROW, ITEMS_PER_ROW);
      const rowWidth = inRow * ITEM_SIZE + (inRow - 1) * ITEM_GAP;
      const x = cardX - rowWidth / 2 + col * (ITEM_SIZE + ITEM_GAP) + ITEM_SIZE / 2;
      const y = topY + row * (ITEM_SIZE + ITEM_GAP) + ITEM_SIZE / 2;
      const item = this.add.image(x, y, texture).setDisplaySize(ITEM_SIZE, ITEM_SIZE);
      items.push(item);
    }
    this.cardItems.push(items);
  }

  /** Destroys all display objects created for the current round. */
  private clearRound(): void {
    for (const obj of this.roundObjects) {
      obj.destroy();
    }
    this.roundObjects.length = 0;
    for (const card of this.promptRects) {
      card.destroy();
    }
    this.promptRects.length = 0;
    for (const card of this.answerRects) {
      card.destroy();
    }
    this.answerRects.length = 0;
    for (const items of this.cardItems) {
      for (const item of items) {
        item.destroy();
      }
    }
    this.cardItems.length = 0;
  }

  /** Handles a tap on an answer card: correct advances, wrong wiggles. */
  private handleChoice(cardIndex: number): void {
    if (this.inputLocked) return;
    const round = this.rounds[this.roundIndex];
    if (isCorrect(round.answerOptions, cardIndex, round.target)) {
      this.handleCorrect(cardIndex);
    } else {
      this.handleIncorrect(cardIndex);
    }
  }

  /**
   * Handles a correct answer: the correct chime plays, the card flashes the
   * success color, Professor Hoot cheers, the progress dot pops, and the next
   * round starts after a short delay (completion after the final round).
   */
  private handleCorrect(cardIndex: number): void {
    this.inputLocked = true;
    this.audioManager.playCorrect();
    this.recordCorrect();
    this.mascot?.cheer();
    this.fillProgressDot(this.roundIndex);

    const rect = this.answerRects[cardIndex];
    rect.setFillStyle(this.SUCCESS_COLOR, 1);
    this.time.delayedCall(250, () => {
      if (!rect.destroyed) rect.setFillStyle(this.CARD_BG_COLOR, 1);
    });

    this.time.delayedCall(this.NEXT_ROUND_DELAY, () => {
      this.roundIndex++;
      if (this.roundIndex >= this.rounds.length) {
        this.completeGame("take-away");
      } else {
        this.inputLocked = false;
        this.renderRound();
      }
    });
  }

  /** Handles an incorrect answer: a gentle wiggle, soft tone, no penalty. */
  private handleIncorrect(cardIndex: number): void {
    this.audioManager.playIncorrect();
    this.recordWrong();
    this.mascot?.nod();

    // cardItems holds prompts first, then the four answer groups.
    const rect = this.answerRects[cardIndex];
    const items = this.cardItems[2 + cardIndex];
    const angle = isReducedMotion() ? this.WIGGLE_REDUCED_ANGLE : this.WIGGLE_ANGLE;
    this.tweens.add({
      targets: [rect, ...items],
      angle,
      duration: motionDuration(this.WIGGLE_DURATION, this.WIGGLE_REDUCED_DURATION),
      yoyo: true,
      repeat: this.WIGGLE_REPEATS,
      ease: "Sine.inOut",
    });
  }
}
