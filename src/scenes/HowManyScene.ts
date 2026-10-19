import type Phaser from "phaser";
import { SpeakerButton } from "../components/SpeakerButton";
import {
  type CountGroup,
  type CountRound,
  createPlaythrough,
  evaluateRound,
} from "../game/countLogic";
import type { GameId } from "../types";
import { motionDuration } from "../utils/motion";
import { sceneEntrance } from "../utils/sceneTransitions";
import { speakNumber } from "../utils/speech";
import { getAdaptiveBandShift, load } from "../utils/storage";
import { textureSizeFor } from "../utils/textureTiers";
import { ChoiceRoundScene } from "./ChoiceRoundScene";

/** Number of rounds per playthrough (2 per band). */
const ROUND_COUNT = 6;

/** Display size of the big target numeral (px). */
const TARGET_DISPLAY_SIZE = 240;

/** Target scale for the numeral image (display size / texture size). */
const TARGET_SCALE = TARGET_DISPLAY_SIZE / textureSizeFor("numeral_5");

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
export class HowManyScene extends ChoiceRoundScene {
  private rounds: CountRound[] = [];

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
        muted: !load().settings.sfxEnabled,
        onSpeak: () => {
          const round = this.rounds[this.roundIndex];
          if (!round) return; // Celebration after the final round — nothing to speak.
          speakNumber(round.target, load().settings.sfxEnabled);
        },
      },
    );

    this.rounds = createPlaythrough(getAdaptiveBandShift(this.gameId()));
    this.roundIndex = 0;
    this.inputLocked = false;
    this.renderRound();

    this.registerShutdownCleanup();
  }

  protected totalRounds(): number {
    return this.rounds.length;
  }

  protected gameId(): GameId {
    return "how-many";
  }

  protected isChoiceCorrect(index: number): boolean {
    const round = this.rounds[this.roundIndex];
    return evaluateRound(round, round.groups[index]);
  }

  /**
   * Renders the big target numeral (popped in and named aloud) and the object
   * group cards.
   */
  protected buildRoundContent(): void {
    const round = this.rounds[this.roundIndex];
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    const target = this.trackRoundObject(
      this.add
        .image(centerX, centerY + TARGET_Y_OFFSET, `numeral_${round.target}`)
        .setOrigin(0.5)
        .setScale(0),
    );
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

  protected clearRoundContent(): void {}

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

      this.createChoiceTarget(x, cardY, CARD_SIZE, i);
      this.attachCardContent(i, this.createCardItems(round.groups[i], x, cardY));
    }
  }

  /** Places `group.count` copies of the group's item texture in a loose grid. */
  private createCardItems(
    group: CountGroup,
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
