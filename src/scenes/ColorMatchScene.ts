import Phaser from "phaser";
import { SpeakerButton } from "../components/SpeakerButton";
import {
  buildPlaythrough,
  type ColorMatchRound,
  isCorrect,
  promptFor,
} from "../game/colorMatchLogic";
import { isReducedMotion, motionDuration } from "../utils/motion";
import { attachPressFeedback } from "../utils/pressFeedback";
import { sceneEntrance } from "../utils/sceneTransitions";
import { speakWord } from "../utils/speech";
import { load } from "../utils/storage";
import { GameSceneBase } from "./GameSceneBase";

/** Number of rounds per playthrough (3 per band). */
const ROUND_COUNT = 6;

/**
 * Display size of each card in the 2x2 grid (exceeds 96px ideal touch
 * target; slightly smaller than Odd One Out's 256px so the prompt swatch
 * fits above the grid on the 1024x768 canvas).
 */
const CARD_SIZE = 220;

/** Horizontal and vertical gap between the 2x2 cards (px). */
const GRID_SPACING = 20;

/** Vertical offset of the grid center below the screen center (px). */
const GRID_Y_OFFSET = 140;

/** Display size of the item texture inside a card (px). */
const ITEM_SIZE = 130;

/** Display size of the prompt swatch (px). */
const SWATCH_SIZE = 110;

/** Vertical offset of the swatch center above the screen center (px). */
const SWATCH_Y_OFFSET = 155;

/** Corner radius of the prompt swatch (px). */
const SWATCH_RADIUS = 24;

/**
 * Color Match scene — a large swatch shows a color (with its name spoken
 * aloud); four cards below show objects of distinct colors and the child
 * taps the one matching the swatch. Correct taps flash, chime, and advance;
 * incorrect taps wiggle gently (no-fail). Six rounds (3 from the 4-color
 * pool, then 3 from the 6-color pool) win the game: shared celebration +
 * sticker on first completion.
 */
export class ColorMatchScene extends GameSceneBase {
  /** Prompt swatch of the current round (re-rendered each round). */
  private swatch?: Phaser.GameObjects.Graphics;
  /** Card backgrounds of the current round. */
  private readonly cardRects: Phaser.GameObjects.Rectangle[] = [];
  /** Item images of each card of the current round. */
  private readonly cardItems: Phaser.GameObjects.Image[] = [];
  private rounds: ColorMatchRound[] = [];
  private roundIndex = 0;

  constructor() {
    super("ColorMatch");
  }

  create(): void {
    sceneEntrance(this);
    this.createCornerMascot();
    this.createBackButton();
    this.createProgressDots(ROUND_COUNT);

    // "Hear it again" — re-speaks the current target color's name on demand.
    const centerX = this.cameras.main.centerX;
    const swatchY = this.cameras.main.centerY - SWATCH_Y_OFFSET;
    this.speaker = new SpeakerButton(
      this,
      centerX + SWATCH_SIZE / 2 + this.SPEAKER_OFFSET,
      swatchY,
      {
        muted: !load().settings.sfxEnabled,
        onSpeak: () => {
          const round = this.rounds[this.roundIndex];
          if (!round) return; // Celebration after the final round — nothing to speak.
          speakWord(promptFor(round.targetColorId), load().settings.sfxEnabled);
        },
      },
    );

    this.rounds = buildPlaythrough();
    this.roundIndex = 0;
    this.inputLocked = false;
    this.renderRound();

    this.registerShutdownCleanup();
  }

  /**
   * Renders the current round: the target-color prompt swatch and the 2x2
   * card grid (4 distinct colors), with the color name spoken aloud via TTS
   * when SFX is enabled. Previous objects are destroyed.
   */
  private renderRound(): void {
    this.clearRound();

    const round = this.rounds[this.roundIndex];
    const { sfxEnabled } = load().settings;
    speakWord(promptFor(round.targetColorId), sfxEnabled);

    const centerX = this.cameras.main.centerX;
    const gridY = this.cameras.main.centerY + GRID_Y_OFFSET;
    const leftX = centerX - CARD_SIZE - GRID_SPACING / 2;
    const topY = gridY - CARD_SIZE - GRID_SPACING / 2;

    this.drawSwatch(round);

    for (let i = 0; i < 4; i++) {
      const row = Math.floor(i / 2);
      const col = i % 2;
      const x = leftX + col * (CARD_SIZE + GRID_SPACING) + CARD_SIZE / 2;
      const y = topY + row * (CARD_SIZE + GRID_SPACING) + CARD_SIZE / 2;

      const card = this.add.rectangle(x, y, CARD_SIZE, CARD_SIZE, this.CARD_BG_COLOR);
      card.setStrokeStyle(this.OUTLINE_WIDTH, this.OUTLINE_COLOR, 1);
      card.setInteractive({
        hitArea: new Phaser.Geom.Rectangle(0, 0, CARD_SIZE, CARD_SIZE),
        hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      });
      card.on("pointerdown", () => this.handleChoice(i));
      attachPressFeedback(card);
      this.cardRects.push(card);

      const item = this.add
        .image(x, y, round.cards[i].texture)
        .setDisplaySize(ITEM_SIZE, ITEM_SIZE);
      this.cardItems.push(item);
    }
  }

  /** Draws the prompt swatch filled with the target color of the current round. */
  private drawSwatch(round: ColorMatchRound): void {
    const target = round.cards.find((card) => card.colorId === round.targetColorId);
    if (!target) return;
    const x = this.cameras.main.centerX;
    const y = this.cameras.main.centerY - SWATCH_Y_OFFSET;
    const fill = parseInt(target.fill.slice(1), 16);
    const left = x - SWATCH_SIZE / 2;
    const top = y - SWATCH_SIZE / 2;

    this.swatch = this.add.graphics();
    this.swatch.fillStyle(fill, 1);
    this.swatch.fillRoundedRect(left, top, SWATCH_SIZE, SWATCH_SIZE, SWATCH_RADIUS);
    this.swatch.lineStyle(8, this.OUTLINE_COLOR, 1);
    this.swatch.strokeRoundedRect(left, top, SWATCH_SIZE, SWATCH_SIZE, SWATCH_RADIUS);
  }

  /** Destroys all display objects created for the current round. */
  private clearRound(): void {
    this.swatch?.destroy();
    this.swatch = undefined;
    for (const card of this.cardRects) {
      card.destroy();
    }
    this.cardRects.length = 0;
    for (const item of this.cardItems) {
      item.destroy();
    }
    this.cardItems.length = 0;
  }

  /** Handles a tap on a card: matching color advances, others wiggle. */
  private handleChoice(cardIndex: number): void {
    if (this.inputLocked) return;
    const round = this.rounds[this.roundIndex];
    if (isCorrect(round.cards, cardIndex, round.targetColorId)) {
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
        this.completeGame("color-match");
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
    const item = this.cardItems[cardIndex];
    const angle = isReducedMotion() ? this.WIGGLE_REDUCED_ANGLE : this.WIGGLE_ANGLE;
    this.tweens.add({
      targets: [rect, item],
      angle,
      duration: motionDuration(this.WIGGLE_DURATION, this.WIGGLE_REDUCED_DURATION),
      yoyo: true,
      repeat: this.WIGGLE_REPEATS,
      ease: "Sine.inOut",
    });
  }
}
