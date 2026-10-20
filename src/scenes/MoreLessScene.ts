import type Phaser from "phaser";
import {
  createPlaythrough,
  evaluateRound,
  type MoreLessGroup,
  type MoreLessRound,
} from "../game/moreLessLogic";
import type { GameId } from "../types";
import { motionDuration } from "../utils/motion";
import { sceneEntrance } from "../utils/sceneTransitions";
import { speakWord } from "../utils/speech";
import { getAdaptiveBandShift, getSettings } from "../utils/storage";
import { textureSizeFor } from "../utils/textureTiers";
import { ChoiceRoundScene } from "./ChoiceRoundScene";

/** Number of rounds per playthrough (2 per band). */
const ROUND_COUNT = 6;

/** Display size of the big comparison arrow (px). */
const ARROW_DISPLAY_SIZE = 256;

/** Target scale for the arrow image (display size / texture size). */
const ARROW_SCALE = ARROW_DISPLAY_SIZE / textureSizeFor("arrow_more");

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
export class MoreLessScene extends ChoiceRoundScene {
  private rounds: MoreLessRound[] = [];

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
    this.createRoundNarrator({
      x: centerX + ARROW_DISPLAY_SIZE / 2 + this.SPEAKER_OFFSET,
      y: centerY + ARROW_Y_OFFSET,
      replay: () => {
        const round = this.rounds[this.roundIndex];
        if (!round) return; // Celebration after the final round — nothing to speak.
        speakWord(round.mode, getSettings().sfxEnabled);
      },
    });

    this.rounds = createPlaythrough(getAdaptiveBandShift("more-less"));
    this.roundIndex = 0;
    this.inputLocked = false;
    this.renderRound();

    this.registerShutdownCleanup();
  }

  protected totalRounds(): number {
    return this.rounds.length;
  }

  protected gameId(): GameId {
    return "more-less";
  }

  /** Card 0 is the left group, card 1 the right one. */
  protected isChoiceCorrect(index: number): boolean {
    const round = this.rounds[this.roundIndex];
    return evaluateRound(round, index === 0 ? "left" : "right");
  }

  /**
   * Renders the big comparison arrow (up for MORE, down for LESS, popped in and
   * the word spoken aloud via TTS when SFX is enabled) and the two group cards.
   */
  protected buildRoundContent(): void {
    const round = this.rounds[this.roundIndex];
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    const arrow = this.trackRoundObject(
      this.add
        .image(centerX, centerY + ARROW_Y_OFFSET, `arrow_${round.mode}`)
        .setOrigin(0.5)
        .setScale(0),
    );
    this.tweens.add({
      targets: arrow,
      scaleX: ARROW_SCALE,
      scaleY: ARROW_SCALE,
      duration: motionDuration(this.WIN_TWEEN_DURATION, 180),
      ease: "Back.out",
    });

    const { sfxEnabled } = getSettings();
    speakWord(round.mode, sfxEnabled);

    this.createCards(round);
  }

  protected clearRoundContent(): void {}

  /** Creates the two group cards with their item copies. */
  private createCards(round: MoreLessRound): void {
    const centerX = this.cameras.main.centerX;
    const cardsY = this.cameras.main.centerY + CARDS_Y_OFFSET;

    for (let i = 0; i < 2; i++) {
      const x = i === 0 ? centerX - CARD_SPACING_X / 2 : centerX + CARD_SPACING_X / 2;

      this.createChoiceTarget(x, cardsY, CARD_SIZE, i);
      this.attachCardContent(
        i,
        this.createCardItems(i === 0 ? round.left : round.right, x, cardsY),
      );
    }
  }

  /** Places `group.count` copies of the group's item texture in a loose grid. */
  private createCardItems(
    group: MoreLessGroup,
    cardX: number,
    cardY: number,
  ): Phaser.GameObjects.GameObject[] {
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
      items.push(this.add.image(x, y, group.texture).setDisplaySize(ITEM_SIZE, ITEM_SIZE));
    }
    return items;
  }
}
