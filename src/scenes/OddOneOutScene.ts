import Phaser from "phaser";
import { SpeakerButton } from "../components/SpeakerButton";
import { createPlaythrough, isCorrect, type OddOneRound, promptFor } from "../game/oddOneOutLogic";
import { isReducedMotion, motionDuration } from "../utils/motion";
import { attachPressFeedback } from "../utils/pressFeedback";
import { sceneEntrance } from "../utils/sceneTransitions";
import { speakWord } from "../utils/speech";
import { load } from "../utils/storage";
import { GameSceneBase } from "./GameSceneBase";

/** Number of rounds per playthrough (2 per band). */
const ROUND_COUNT = 6;

/** Display size of each card in the 2x2 grid (exceeds 96px ideal touch target). */
const CARD_SIZE = 256;

/** Horizontal and vertical gap between the 2x2 cards (px). */
const GRID_SPACING = 24;

/** Vertical offset of the grid center below the screen center (px). */
const GRID_Y_OFFSET = 40;

/** Display size of the item texture inside a card (px). */
const ITEM_SIZE = 150;

/**
 * Odd One Out scene — a 2x2 grid of cards shows three identical textures and
 * one distinct "odd one out"; Professor Hoot speaks the odd item's name and
 * the child taps it. Correct taps flash, chime, and advance; incorrect taps
 * wiggle gently (no-fail). Six rounds (2 per band: cross-category, same
 * category, frog color variants) win the game: shared celebration + sticker
 * on first completion.
 */
export class OddOneOutScene extends GameSceneBase {
  /** Card backgrounds of the current round. */
  private readonly cardRects: Phaser.GameObjects.Rectangle[] = [];
  /** Item images of each card of the current round. */
  private readonly cardItems: Phaser.GameObjects.Image[] = [];
  private rounds: OddOneRound[] = [];
  private roundIndex = 0;

  constructor() {
    super("OddOneOut");
  }

  create(): void {
    sceneEntrance(this);
    this.createCornerMascot();
    this.createBackButton();
    this.createProgressDots(ROUND_COUNT);

    // "Hear it again" — re-speaks the current odd item's name on demand.
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;
    this.speaker = new SpeakerButton(
      this,
      centerX + CARD_SIZE / 2 + this.SPEAKER_OFFSET,
      centerY - GRID_Y_OFFSET,
      {
        onSpeak: () => {
          const round = this.rounds[this.roundIndex];
          if (!round) return; // Celebration after the final round — nothing to speak.
          speakWord(promptFor(round.oddTexture), load().settings.sfxEnabled);
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
   * Renders the current round: the 2x2 card grid (3 identical + 1 odd) with
   * the odd item's name spoken aloud via TTS when SFX is enabled. Previous
   * objects are destroyed.
   */
  private renderRound(): void {
    this.clearRound();

    const round = this.rounds[this.roundIndex];
    const { sfxEnabled } = load().settings;
    speakWord(promptFor(round.oddTexture), sfxEnabled);

    const centerX = this.cameras.main.centerX;
    const gridY = this.cameras.main.centerY + GRID_Y_OFFSET;
    const leftX = centerX - CARD_SIZE - GRID_SPACING / 2;
    const topY = gridY - CARD_SIZE - GRID_SPACING / 2;

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

      const texture = i === round.oddSlot ? round.oddTexture : round.groupTexture;
      const item = this.add.image(x, y, texture).setDisplaySize(ITEM_SIZE, ITEM_SIZE);
      this.cardItems.push(item);
    }
  }

  /** Destroys all display objects created for the current round. */
  private clearRound(): void {
    for (const card of this.cardRects) {
      card.destroy();
    }
    this.cardRects.length = 0;
    for (const item of this.cardItems) {
      item.destroy();
    }
    this.cardItems.length = 0;
  }

  /** Handles a tap on a card: correct advances, wrong wiggles. */
  private handleChoice(cardIndex: number): void {
    if (this.inputLocked) return;
    const round = this.rounds[this.roundIndex];
    if (isCorrect(round, cardIndex)) {
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
        this.completeGame("odd-one-out");
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
