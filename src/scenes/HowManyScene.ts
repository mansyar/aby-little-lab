import Phaser from "phaser";
import { AudioManager } from "../audio/AudioManager";
import { createCornerMascot, type Mascot } from "../components/Mascot";
import { ParentLock } from "../components/ParentLock";
import { SpeakerButton } from "../components/SpeakerButton";
import {
  type CountGroup,
  type CountRound,
  createPlaythrough,
  evaluateRound,
} from "../game/countLogic";
import { createWinCelebration } from "../utils/completionEffect";
import { isReducedMotion, motionDuration, motionScale } from "../utils/motion";
import { attachPressFeedback } from "../utils/pressFeedback";
import { sceneEntrance, transitionToScene } from "../utils/sceneTransitions";
import { speakNumber } from "../utils/speech";
import { earnSticker, hasSticker, load } from "../utils/storage";
import { textStyle } from "../utils/typography";

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

/** Horizontal gap between the target numeral and the replay button (px). */
const SPEAKER_OFFSET = 70;

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

/** Display size of the sticker image in the unlock animation. */
const STICKER_DISPLAY_SIZE = 256;

/** Target scale for the sticker image (display size / texture size). */
const STICKER_SCALE = STICKER_DISPLAY_SIZE / SVG_SIZE;

/** Duration of sticker reveal animation (ms). */
const WIN_TWEEN_DURATION = 300;

/** Success flash fill color (--success token). */
const SUCCESS_COLOR = 0x68d391;

/** Default white card fill. */
const CARD_BG_COLOR = 0xffffff;

/** Card and dot outline color (--outline token). */
const OUTLINE_COLOR = 0x2d3748;

/**
 * How Many? scene — a big target numeral is shown and named aloud, and the
 * child taps the object group whose count matches. Correct taps flash, chime,
 * and advance; incorrect taps wiggle gently (no-fail). Six rounds (2 per band
 * 1-3 / 1-5 / 1-10) win the game: shared celebration + sticker on first
 * completion.
 */
export class HowManyScene extends Phaser.Scene {
  private parentLock?: ParentLock;
  private mascot?: Mascot;
  private speaker?: SpeakerButton;
  private readonly audioManager: AudioManager;
  private readonly progressDots: Phaser.GameObjects.Arc[] = [];
  /** Group card backgrounds of the current round. */
  private readonly cardRects: Phaser.GameObjects.Rectangle[] = [];
  /** Item copies of each group card of the current round. */
  private readonly cardItems: Phaser.GameObjects.GameObject[][] = [];
  /** Per-round display objects (currently the target numeral image). */
  private readonly roundObjects: Phaser.GameObjects.GameObject[] = [];
  private rounds: CountRound[] = [];
  private roundIndex = 0;
  private inputLocked = false;

  constructor() {
    super({ key: "HowMany" });
    this.audioManager = AudioManager.getInstance();
  }

  create(): void {
    sceneEntrance(this);
    this.mascot = createCornerMascot(this);

    const backButton = this.add.text(20, 20, "← Back", textStyle({
      fontSize: "24px",
      color: "#2d3748",
    }));
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

    // "Hear it again" — re-speaks the current target number on demand.
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;
    this.speaker = new SpeakerButton(
      this,
      centerX + TARGET_DISPLAY_SIZE / 2 + SPEAKER_OFFSET,
      centerY + TARGET_Y_OFFSET,
      {
        onSpeak: () => {
          const round = this.rounds[this.roundIndex];
          speakNumber(round.target, load().settings.sfxEnabled);
        },
      },
    );

    this.rounds = createPlaythrough();
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
        OUTLINE_COLOR,
        0.3,
      );
      this.progressDots.push(dot);
    }
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
      duration: motionDuration(WIN_TWEEN_DURATION, 180),
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

      const card = this.add.rectangle(x, cardY, CARD_SIZE, CARD_SIZE, CARD_BG_COLOR);
      card.setStrokeStyle(OUTLINE_WIDTH, OUTLINE_COLOR, 1);
      card.setInteractive({
        hitArea: new Phaser.Geom.Rectangle(0, 0, CARD_SIZE, CARD_SIZE),
        hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      });
      card.on("pointerdown", () => this.handleChoice(i));
      this.cardRects.push(card);

      this.createCardItems(round.groups[i], x, cardY);
    }
  }

  /** Places `group.count` copies of the group's item texture in a loose grid. */
  private createCardItems(group: CountGroup, cardX: number, cardY: number): void {
    const items: Phaser.GameObjects.GameObject[] = [];
    const rowCount = Math.ceil(group.count / ITEMS_PER_ROW);
    const colCount = Math.min(group.count, ITEMS_PER_ROW);
    const gridWidth = colCount * ITEM_SIZE + (colCount - 1) * ITEM_GAP;
    const gridHeight = rowCount * ITEM_SIZE + (rowCount - 1) * ITEM_GAP;

    for (let i = 0; i < group.count; i++) {
      const row = Math.floor(i / ITEMS_PER_ROW);
      const col = i % ITEMS_PER_ROW;
      const x = cardX - gridWidth / 2 + col * (ITEM_SIZE + ITEM_GAP) + ITEM_SIZE / 2;
      const y = cardY - gridHeight / 2 + row * (ITEM_SIZE + ITEM_GAP) + ITEM_SIZE / 2;
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
    this.mascot?.cheer();
    this.fillProgressDot();

    const rect = this.cardRects[groupIndex];
    rect.setFillStyle(SUCCESS_COLOR, 1);
    this.time.delayedCall(250, () => {
      if (!rect.destroyed) rect.setFillStyle(CARD_BG_COLOR, 1);
    });

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
  private handleIncorrect(groupIndex: number): void {
    this.audioManager.playIncorrect();
    this.mascot?.nod();

    const rect = this.cardRects[groupIndex];
    const angle = isReducedMotion() ? WIGGLE_REDUCED_ANGLE : WIGGLE_ANGLE;
    this.tweens.add({
      targets: [rect, ...this.cardItems[groupIndex]],
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

    const earnedNow = !hasSticker("how-many");
    if (earnedNow) {
      earnSticker("how-many");
      this.audioManager.playSticker();
      this.createStickerAnimation();
    }

    this.time.delayedCall(AUTO_RETURN_DELAY, () => {
      transitionToScene(this, "Hub", earnedNow ? { justEarned: "how-many" } : undefined);
    });
  }

  /** Shows a sticker unlock animation at the center of the screen. */
  private createStickerAnimation(): void {
    const stickerImage = this.add
      .image(this.cameras.main.centerX, this.cameras.main.centerY, "sticker_how_many")
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
