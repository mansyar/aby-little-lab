import Phaser from "phaser";
import { SpeakerButton } from "../components/SpeakerButton";
import {
  type CountGroup,
  type CountRound,
  createPlaythrough,
  evaluateRound,
} from "../game/countLogic";
import { isReducedMotion, motionDuration } from "../utils/motion";
import { attachPressFeedback } from "../utils/pressFeedback";
import { sceneEntrance } from "../utils/sceneTransitions";
import { speakNumber } from "../utils/speech";
import { load } from "../utils/storage";
import { GameSceneBase } from "./GameSceneBase";

/** Number of rounds per playthrough (2 per band). */
const ROUND_COUNT = 6;

/** Display size of the big target numeral (px). */
const TARGET_DISPLAY_SIZE = 240;

/** Original SVG texture size (used for scale calculations). */
const SVG_SIZE = 512;

/** Target scale for the numeral image (display size / texture size). */
const TARGET_SCALE = TARGET_DISPLAY_SIZE / SVG_SIZE;

/** Vertical offset of the target numeral from screen center (px). */
const TARGET_Y_OFFSET = -190;

/** Display size of the group cards (exceeds 96px ideal touch target). */
const CARD_SIZE = 200;

/** Vertical offset of the group cards row from screen center (px). */
const CARDS_Y_OFFSET = 140;

/** Horizontal spacing between group cards (px). */
const CARD_SPACING_X = 240;

/** Vertical spacing between the two card rows (px). */
const CARD_SPACING_Y = 210;

/** Display size of each item copy inside a group card (px). */
const ITEM_SIZE = 42;

/** Maximum number of item copies per row inside a card. */
const ITEMS_PER_ROW = 4;

/** Gap between item copies inside a card (px). */
const ITEM_GAP = 4;

/**
 * How Many? scene — a big target numeral is shown and named aloud, and the
 * child taps the object group whose count matches. Correct taps flash, chime,
 * and advance; incorrect taps wiggle gently (no-fail). Six rounds (2 per band
 * 1-3 / 1-5 / 1-10) win the game: shared celebration + sticker on first
 * completion.
 */
export class HowManyScene extends GameSceneBase {
  /** Group card backgrounds of the current round. */
  private readonly cardRects: Phaser.GameObjects.Rectangle[] = [];
  /** Item copies of each group card of the current round. */
  private readonly cardItems: Phaser.GameObjects.GameObject[][] = [];
  /** Per-round display objects (currently the target numeral image). */
  private readonly roundObjects: Phaser.GameObjects.GameObject[] = [];
  private rounds: CountRound[] = [];
  private roundIndex = 0;

  constructor() {
    super("HowMany");
  }

  create(): void {
    sceneEntrance(this);
    this.createCornerMascot();
    this.createBackButton();
    this.createProgressDots(ROUND_COUNT);

    // "Hear it again" — re-speaks the current target number on demand.
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
          speakNumber(round.target, load().settings.sfxEnabled);
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
   * Renders the current round: the big target numeral (popped in and named
   * aloud via TTS when SFX is enabled) and the object group cards. Previous
   * objects are destroyed.
   */
  private renderRound(): void {
    this.clearRound();

    const round = this.rounds[this.roundIndex];
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    const target = this.add
      .image(centerX, centerY + TARGET_Y_OFFSET, `numeral_${round.target}`)
      .setOrigin(0.5)
      .setScale(0);
    this.roundObjects.push(target);
    this.tweens.add({
      targets: target,
      scaleX: TARGET_SCALE,
      scaleY: TARGET_SCALE,
      duration: motionDuration(this.WIN_TWEEN_DURATION, 180),
      ease: "Back.out",
    });

    const { sfxEnabled } = load().settings;
    speakNumber(round.target, sfxEnabled);

    this.createCards(round);
  }

  /** Creates the group cards (2×2, 3 in band 1) with their item copies. */
  private createCards(round: CountRound): void {
    const centerX = this.cameras.main.centerX;
    const cardsY = this.cameras.main.centerY + CARDS_Y_OFFSET;
    const rowY0 = cardsY - CARD_SPACING_Y / 2;
    const rowY1 = cardsY + CARD_SPACING_Y / 2;

    const groupCount = round.groups.length;
    const isThreeCardLayout = groupCount === 3;

    for (let i = 0; i < groupCount; i++) {
      const row = i < 2 ? 0 : 1;
      const cardY = row === 0 ? rowY0 : rowY1;
      const rowHasTwo = row === 0 || !isThreeCardLayout;
      const x = rowHasTwo
        ? centerX + (i % 2 === 0 ? -CARD_SPACING_X / 2 : CARD_SPACING_X / 2)
        : centerX;

      const card = this.add.rectangle(x, cardY, CARD_SIZE, CARD_SIZE, this.CARD_BG_COLOR);
      card.setStrokeStyle(this.OUTLINE_WIDTH, this.OUTLINE_COLOR, 1);
      card.setInteractive({
        hitArea: new Phaser.Geom.Rectangle(0, 0, CARD_SIZE, CARD_SIZE),
        hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      });
      card.on("pointerdown", () => this.handleChoice(i));
      attachPressFeedback(card);
      this.cardRects.push(card);

      this.createCardItems(round.groups[i], x, cardY);
    }
  }

  /** Places `group.count` copies of the group's item texture in a loose grid. */
  private createCardItems(group: CountGroup, cardX: number, cardY: number): void {
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
  private handleChoice(groupIndex: number): void {
    if (this.inputLocked) return;
    const round = this.rounds[this.roundIndex];
    if (evaluateRound(round, round.groups[groupIndex])) {
      this.handleCorrect(groupIndex);
    } else {
      this.handleIncorrect(groupIndex);
    }
  }

  /**
   * Handles a correct answer: the correct chime plays, the card flashes the
   * success color, Professor Hoot cheers, the progress dot pops, and the next
   * round starts after a short delay (completion after the final round).
   */
  private handleCorrect(groupIndex: number): void {
    this.inputLocked = true;
    this.audioManager.playCorrect();
    this.recordCorrect();
    this.mascot?.cheer();
    this.fillProgressDot(this.roundIndex);

    const rect = this.cardRects[groupIndex];
    rect.setFillStyle(this.SUCCESS_COLOR, 1);
    this.time.delayedCall(250, () => {
      if (!rect.destroyed) rect.setFillStyle(this.CARD_BG_COLOR, 1);
    });

    this.time.delayedCall(this.NEXT_ROUND_DELAY, () => {
      this.roundIndex++;
      if (this.roundIndex >= this.rounds.length) {
        this.completeGame("how-many");
      } else {
        this.inputLocked = false;
        this.renderRound();
      }
    });
  }

  /** Handles an incorrect answer: a gentle wiggle, soft tone, no penalty. */
  private handleIncorrect(groupIndex: number): void {
    this.audioManager.playIncorrect();
    this.recordWrong();
    this.mascot?.nod();

    const rect = this.cardRects[groupIndex];
    const angle = isReducedMotion() ? this.WIGGLE_REDUCED_ANGLE : this.WIGGLE_ANGLE;
    this.tweens.add({
      targets: [rect, ...this.cardItems[groupIndex]],
      angle,
      duration: motionDuration(this.WIGGLE_DURATION, this.WIGGLE_REDUCED_DURATION),
      yoyo: true,
      repeat: this.WIGGLE_REPEATS,
      ease: "Sine.inOut",
    });
  }
}
