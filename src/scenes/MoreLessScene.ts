import Phaser from "phaser";
import { SpeakerButton } from "../components/SpeakerButton";
import {
  createPlaythrough,
  evaluateRound,
  type MoreLessGroup,
  type MoreLessRound,
} from "../game/moreLessLogic";
import { isReducedMotion, motionDuration } from "../utils/motion";
import { attachPressFeedback } from "../utils/pressFeedback";
import { sceneEntrance } from "../utils/sceneTransitions";
import { speakWord } from "../utils/speech";
import { load } from "../utils/storage";
import { GameSceneBase } from "./GameSceneBase";

/** Number of rounds per playthrough (2 per band). */
const ROUND_COUNT = 6;

/** Display size of the big comparison arrow (px). */
const ARROW_DISPLAY_SIZE = 256;

/** Original SVG texture size (used for scale calculations). */
const SVG_SIZE = 512;

/** Target scale for the arrow image (display size / texture size). */
const ARROW_SCALE = ARROW_DISPLAY_SIZE / SVG_SIZE;

/** Vertical offset of the arrow from screen center (px). */
const ARROW_Y_OFFSET = -160;

/** Display size of the group cards (exceeds 96px ideal touch target). */
const CARD_SIZE = 220;

/** Vertical offset of the group cards row from screen center (px). */
const CARDS_Y_OFFSET = 150;

/** Horizontal spacing between the two group cards (px). */
const CARD_SPACING_X = 240;

/** Display size of each item copy inside a group card (px). */
const ITEM_SIZE = 48;

/** Maximum number of item copies per row inside a card. */
const ITEMS_PER_ROW = 4;

/** Gap between item copies inside a card (px). */
const ITEM_GAP = 4;

/**
 * More or Less scene — a big arrow (up = MORE, down = LESS) appears with the
 * comparison word spoken aloud, and the child taps which of two object groups
 * satisfies the prompt. Correct taps flash, chime, and advance; incorrect taps
 * wiggle gently (no-fail). Six rounds (2 per band 1-3 / 1-5 / 1-10, exactly
 * three "more" and three "less" shuffled) win the game: shared celebration +
 * sticker on first completion.
 */
export class MoreLessScene extends GameSceneBase {
  /** Group card backgrounds of the current round. */
  private readonly cardRects: Phaser.GameObjects.Rectangle[] = [];
  /** Item copies of each group card of the current round. */
  private readonly cardItems: Phaser.GameObjects.GameObject[][] = [];
  /** Per-round display objects (currently the comparison arrow image). */
  private readonly roundObjects: Phaser.GameObjects.GameObject[] = [];
  private rounds: MoreLessRound[] = [];
  private roundIndex = 0;

  constructor() {
    super("MoreLess");
  }

  create(): void {
    sceneEntrance(this);
    this.createCornerMascot();
    this.createBackButton();
    this.createProgressDots(ROUND_COUNT);

    // "Hear it again" — re-speaks the current comparison word on demand.
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;
    this.speaker = new SpeakerButton(
      this,
      centerX + ARROW_DISPLAY_SIZE / 2 + this.SPEAKER_OFFSET,
      centerY + ARROW_Y_OFFSET,
      {
        muted: !load().settings.sfxEnabled,
        onSpeak: () => {
          const round = this.rounds[this.roundIndex];
          if (!round) return; // Celebration after the final round — nothing to speak.
          speakWord(round.mode, load().settings.sfxEnabled);
        },
      },
    );

    this.rounds = createPlaythrough();
    this.roundIndex = 0;
    this.inputLocked = false;
    this.renderRound();

    this.registerShutdownCleanup();
  }

  /**
   * Renders the current round: the big comparison arrow (up for MORE, down
   * for LESS, popped in and the word spoken aloud via TTS when SFX is
   * enabled) and the two group cards. Previous objects are destroyed.
   */
  private renderRound(): void {
    this.clearRound();

    const round = this.rounds[this.roundIndex];
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    const arrow = this.add
      .image(centerX, centerY + ARROW_Y_OFFSET, `arrow_${round.mode}`)
      .setOrigin(0.5)
      .setScale(0);
    this.roundObjects.push(arrow);
    this.tweens.add({
      targets: arrow,
      scaleX: ARROW_SCALE,
      scaleY: ARROW_SCALE,
      duration: motionDuration(this.WIN_TWEEN_DURATION, 180),
      ease: "Back.out",
    });

    const { sfxEnabled } = load().settings;
    speakWord(round.mode, sfxEnabled);

    this.createCards(round);
  }

  /** Creates the two group cards with their item copies. */
  private createCards(round: MoreLessRound): void {
    const centerX = this.cameras.main.centerX;
    const cardsY = this.cameras.main.centerY + CARDS_Y_OFFSET;

    for (let i = 0; i < 2; i++) {
      const x = i === 0 ? centerX - CARD_SPACING_X / 2 : centerX + CARD_SPACING_X / 2;

      const card = this.add.rectangle(x, cardsY, CARD_SIZE, CARD_SIZE, this.CARD_BG_COLOR);
      card.setStrokeStyle(this.OUTLINE_WIDTH, this.OUTLINE_COLOR, 1);
      card.setInteractive({
        hitArea: new Phaser.Geom.Rectangle(0, 0, CARD_SIZE, CARD_SIZE),
        hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      });
      card.on("pointerdown", () => this.handleChoice(i));
      attachPressFeedback(card);
      this.cardRects.push(card);

      this.createCardItems(i === 0 ? round.left : round.right, x, cardsY);
    }
  }

  /** Places `group.count` copies of the group's item texture in a loose grid. */
  private createCardItems(group: MoreLessGroup, cardX: number, cardY: number): void {
    const items: Phaser.GameObjects.GameObject[] = [];
    const rowCount = Math.ceil(group.count / ITEMS_PER_ROW);
    const gridHeight = rowCount * ITEM_SIZE + (rowCount - 1) * ITEM_GAP;
    const topY = cardY - gridHeight / 2;

    for (let i = 0; i < group.count; i++) {
      const row = Math.floor(i / ITEMS_PER_ROW);
      const col = i % ITEMS_PER_ROW;
      // Center each row on its own width so a partial last row (e.g. 2 items
      // under 4+4) sits centered instead of pushed to the left.
      const inRow = Math.min(group.count - row * ITEMS_PER_ROW, ITEMS_PER_ROW);
      const rowWidth = inRow * ITEM_SIZE + (inRow - 1) * ITEM_GAP;
      const x = cardX - rowWidth / 2 + col * (ITEM_SIZE + ITEM_GAP) + ITEM_SIZE / 2;
      const y = topY + row * (ITEM_SIZE + ITEM_GAP) + ITEM_SIZE / 2;
      const item = this.add.image(x, y, group.texture).setDisplaySize(ITEM_SIZE, ITEM_SIZE);
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
    for (const card of this.cardRects) {
      card.destroy();
    }
    this.cardRects.length = 0;
    for (const items of this.cardItems) {
      for (const item of items) {
        item.destroy();
      }
    }
    this.cardItems.length = 0;
  }

  /** Handles a tap on a group card: correct advances, wrong wiggles. */
  private handleChoice(cardIndex: number): void {
    if (this.inputLocked) return;
    const round = this.rounds[this.roundIndex];
    const side = cardIndex === 0 ? "left" : "right";
    if (evaluateRound(round, side)) {
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

    const rect = this.cardRects[cardIndex];
    rect.setFillStyle(this.SUCCESS_COLOR, 1);
    this.time.delayedCall(250, () => {
      if (!rect.destroyed) rect.setFillStyle(this.CARD_BG_COLOR, 1);
    });

    this.time.delayedCall(this.NEXT_ROUND_DELAY, () => {
      this.roundIndex++;
      if (this.roundIndex >= this.rounds.length) {
        this.completeGame("more-less");
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

    const rect = this.cardRects[cardIndex];
    const angle = isReducedMotion() ? this.WIGGLE_REDUCED_ANGLE : this.WIGGLE_ANGLE;
    this.tweens.add({
      targets: [rect, ...this.cardItems[cardIndex]],
      angle,
      duration: motionDuration(this.WIGGLE_DURATION, this.WIGGLE_REDUCED_DURATION),
      yoyo: true,
      repeat: this.WIGGLE_REPEATS,
      ease: "Sine.inOut",
    });
  }
}
