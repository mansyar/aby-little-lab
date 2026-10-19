import type Phaser from "phaser";
import type { BandShift } from "../game/adaptiveLogic";
import type { GameId } from "../types";
import { motionDuration } from "../utils/motion";
import { sceneEntrance } from "../utils/sceneTransitions";
import { getAdaptiveBandShift } from "../utils/storage";
import { textureSizeFor } from "../utils/textureTiers";
import { ChoiceRoundScene } from "./ChoiceRoundScene";

/** Number of rounds per playthrough (2 per band). */
export const GROUP_MATH_ROUND_COUNT = 6;

/** Display size of the prompt cards (exceeds 96px ideal touch target). */
const PROMPT_CARD_SIZE = 180;

/** Display size of the answer cards (exceeds 96px ideal touch target). */
const ANSWER_CARD_SIZE = 170;

/** Display size of the operation and equals cue images (px). */
const SYMBOL_DISPLAY_SIZE = 96;

/** Target scale for the cue images (display size / texture size). */
const SYMBOL_SCALE = SYMBOL_DISPLAY_SIZE / textureSizeFor("minus");

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

/** Non-interactive cards sitting before the answer cards in `cardItems`. */
const PROMPT_CARD_COUNT = 2;

/** One counting card: how many items it holds and which item texture. */
export interface GroupMathCard {
  readonly count: number;
  readonly texture: string;
}

/** The round fields every group-math rule set provides. */
export interface GroupMathRound {
  /** The distinct answer options in [1..bandMax], one equals `target`. */
  readonly answerOptions: readonly number[];
  /** Texture used for every answer card's dot-group in this round. */
  readonly answerItemTexture: string;
  /** The correct answer. */
  readonly target: number;
}

/** The rule set a concrete group-math scene pins. */
export interface GroupMathConfig<Round extends GroupMathRound> {
  /** One-line rule shown and spoken when the round is set up. */
  readonly instruction: string;
  /** Progress/sticker id recorded on completion. */
  readonly gameId: GameId;
  /** Texture key of the operation cue between the two prompt cards. */
  readonly operationCue: "plus" | "minus";
  /** Pure playthrough generator for this rule set. */
  readonly buildPlaythrough: (shift: BandShift) => Round[];
  /** Pure evaluator for this rule set. */
  readonly isCorrect: (
    options: readonly number[],
    selectedIndex: number,
    target: number,
  ) => boolean;
  /** Reads the round's two prompt cards (addends, or minuend and subtrahend). */
  readonly promptCards: (round: Round) => readonly [GroupMathCard, GroupMathCard];
}

/**
 * Config-driven group-arithmetic scene: two counting cards joined by an
 * operation cue and an equals sign, with four dot-group answer cards below.
 *
 * Add It Up and Take Away differ only by rule set — the operation cue, the
 * logic module, the spoken rule and the recorded game id — so both run through
 * this one implementation and pin their own {@link GroupMathConfig}.
 */
export abstract class GroupMathScene<Round extends GroupMathRound> extends ChoiceRoundScene {
  /** Rule set pinned by the concrete scene. */
  protected abstract readonly config: GroupMathConfig<Round>;

  /** The playthrough being played. */
  protected rounds: Round[] = [];

  /** Item copies per card: the two prompt groups first, then the answer groups. */
  private cardItems: Phaser.GameObjects.GameObject[][] = [];

  create(): void {
    sceneEntrance(this);
    this.createCornerMascot();
    this.createBackButton();
    this.createProgressDots(this.totalRounds());
    this.createSpokenInstruction(this.config.instruction);

    this.rounds = this.config.buildPlaythrough(getAdaptiveBandShift(this.config.gameId));
    this.roundIndex = 0;
    this.inputLocked = false;
    this.renderRound();

    this.registerShutdownCleanup();
  }

  protected totalRounds(): number {
    return GROUP_MATH_ROUND_COUNT;
  }

  protected gameId(): GameId {
    return this.config.gameId;
  }

  protected isChoiceCorrect(index: number): boolean {
    const round = this.rounds[this.roundIndex];
    return this.config.isCorrect(round.answerOptions, index, round.target);
  }

  /**
   * Renders the current round: the equation row [card A] [cue] [card B] [=]
   * with the four answer dot-group cards below.
   */
  protected buildRoundContent(): void {
    const round = this.rounds[this.roundIndex];
    const centerX = this.cameras.main.centerX;
    const promptY = this.cameras.main.centerY - PROMPT_Y_OFFSET;
    const answersY = this.cameras.main.centerY + ANSWERS_Y_OFFSET;

    const equationWidth = 2 * PROMPT_CARD_SIZE + 2 * SYMBOL_DISPLAY_SIZE + 3 * PROMPT_SPACING;
    const leftEdge = centerX - equationWidth / 2;
    const [left, right] = this.config.promptCards(round);

    this.createPromptCard(left, leftEdge + PROMPT_CARD_SIZE / 2, promptY);
    this.createSymbol(
      this.config.operationCue,
      leftEdge + PROMPT_CARD_SIZE + PROMPT_SPACING + SYMBOL_DISPLAY_SIZE / 2,
      promptY,
    );
    this.createPromptCard(
      right,
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
    for (let i = 0; i < round.answerOptions.length; i++) {
      const x = answersLeft + i * (ANSWER_CARD_SIZE + ANSWER_SPACING) + ANSWER_CARD_SIZE / 2;

      this.createChoiceTarget(x, answersY, ANSWER_CARD_SIZE, i);
      this.createDotGroup(round.answerOptions[i], round.answerItemTexture, x, answersY);
    }
  }

  protected clearRoundContent(): void {
    this.cardItems.length = 0;
  }

  /** The wrong card's own dot-group moves with it. */
  protected wiggleTargets(index: number): Phaser.GameObjects.GameObject[] {
    // `cardItems` holds the two prompt groups first, then one group per answer
    // card, so the answer group is offset by the prompt cards.
    return this.cardItems[PROMPT_CARD_COUNT + index];
  }

  /** Creates one prompt card with its dot-group. */
  private createPromptCard(card: GroupMathCard, x: number, y: number): void {
    const rect = this.add.rectangle(x, y, PROMPT_CARD_SIZE, PROMPT_CARD_SIZE, this.CARD_BG_COLOR);
    rect.setStrokeStyle(this.OUTLINE_WIDTH, this.OUTLINE_COLOR, 1);
    this.trackRoundObject(rect);
    this.createDotGroup(card.count, card.texture, x, y);
  }

  /** Creates an operation/equals cue image that pops in. */
  private createSymbol(key: "plus" | "minus" | "equals", x: number, y: number): void {
    const symbol = this.add.image(x, y, key).setOrigin(0.5).setScale(0);
    this.trackRoundObject(symbol);
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
      this.trackRoundObject(item);
      items.push(item);
    }
    this.cardItems.push(items);
  }
}
