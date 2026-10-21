import Phaser from "phaser";
import { numerals } from "../game/art/numerals";
import { type BoardPiece, DragBoard } from "../game/dragBoard";
import { buildPlaythrough, isCorrect } from "../game/numberOrderLogic";
import type { GameId } from "../types";
import { createCompletionSplash } from "../utils/completionEffect";
import { attachDragLift } from "../utils/dragJuice";
import { sceneEntrance } from "../utils/sceneTransitions";
import { speakNumber } from "../utils/speech";
import { getAdaptiveBandShift, getSettings } from "../utils/storage";
import { ChoiceRoundScene } from "./ChoiceRoundScene";

const ROUND_COUNT = 6;
const SOURCE_Y = 260;
const SLOT_Y = 520;
const CARD_WIDTH = 140;
const CARD_HEIGHT = 160;
const DROP_ZONE_SIZE = 160;
const NUMERAL_SINGLE_SIZE = 80;
const NUMERAL_TEN_SIZE = 56;
const NUMERAL_TEN_OFFSET = 22;

/** A draggable numeral card registered with the shared drag board. */
interface NumeralCard extends BoardPiece {
  bg: Phaser.GameObjects.Rectangle;
  numeral: number;
}

/**
 * Number Order — Line Them Up scene.
 * Child drags shuffled numerals (3–5) from the top source row into the
 * bottom slot row to produce ascending order. Tap a numeral to hear it.
 * The whole board is the answer, so it reports through
 * {@link resolveWholeRound}: correct advances, wrong wiggles and bounces home.
 *
 * All slot registration, hover tracking, snapping, slot↔slot swaps,
 * tray↔slot displacement, tap-to-return, and missed-drop corrections live in
 * the shared {@link DragBoard} shell; this scene renders the dashed slot
 * outlines, speaks taps, and validates the board — per-drop timing, where the
 * scene answers only once every slot is filled.
 */
export class NumberOrderScene extends ChoiceRoundScene {
  private rounds: ReturnType<typeof buildPlaythrough> = [];
  private cards: NumeralCard[] = [];
  private board: DragBoard<NumeralCard> | null = null;
  private readonly roundObjects: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super("NumberOrder");
  }

  preload(): void {
    this.preloadArt([numerals]);
  }

  create(): void {
    sceneEntrance(this);
    this.createCornerMascot();
    this.createBackButton();

    // Behavior preservation: Number Order has always run tap-to-return with
    // no movement threshold (any pointerup on a placed card returns it), so
    // the shell's default 10 px tap-vs-drag slack is switched off here
    // instead of silently adopted.
    this.board?.destroy();
    this.board = new DragBoard<NumeralCard>({
      scene: this,
      zoneSize: DROP_ZONE_SIZE,
      wrongAnswerBehavior: "bounce-home",
      validationTiming: "per-drop",
      tapWithdraw: true,
      dragDistanceThreshold: 0,
      isLocked: () => this.inputLocked,
      callbacks: {
        onTap: (card) => speakNumber(card.numeral, getSettings().sfxEnabled),
        onValidate: (placedIds) => this.validateBoard(placedIds),
      },
    });

    this.createProgressDots(ROUND_COUNT);
    this.createSpokenInstruction("Put the numbers in order, smallest first.");

    this.rounds = buildPlaythrough(getAdaptiveBandShift("number-order"));
    this.roundIndex = 0;
    this.inputLocked = false;
    this.renderRound();
    this.registerShutdownCleanup();
  }

  protected totalRounds(): number {
    return this.rounds.length;
  }

  protected gameId(): GameId {
    return "number-order";
  }

  /**
   * This game has no choice cards — the filled board is the answer, so nothing
   * ever asks whether one card is correct. See {@link validateBoard}.
   */
  protected isChoiceCorrect(): boolean {
    return false;
  }

  /** Renders the dashed slot row and the shuffled source cards above it. */
  protected buildRoundContent(): void {
    const round = this.rounds[this.roundIndex];
    const board = this.board;
    if (!round || !board) return;

    const count = round.shuffled.length;
    const slotPositions = this.computePositions(count, this.scale.width);
    const sourcePositions = this.computePositions(count, this.scale.width);

    // Slots (bottom)
    for (let i = 0; i < count; i++) {
      // reuse same x for slot but at SLOT_Y (aligned columns)
      const sx = slotPositions[i];
      const outline = this.add.graphics();
      outline.setPosition(sx, SLOT_Y);
      outline.lineStyle(4, this.OUTLINE_COLOR, 0.9);
      // dashed outline — 8 dashes around rect
      this.drawDashedRect(outline, -CARD_WIDTH / 2, -CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT);
      this.roundObjects.push(outline);

      board.addSlot(sx, SLOT_Y);
    }

    // Cards (top shuffled)
    for (let i = 0; i < count; i++) {
      const numeral = round.shuffled[i];
      const x = sourcePositions[i];
      this.createCard(numeral, x, SOURCE_Y);
    }
  }

  /**
   * Tears the board down. A drag game's objects can already be gone by the time
   * the round ends, so a failed destroy must not leave the rest of the board
   * behind (the slot row is released first, then the cards).
   */
  protected override clearRound(): void {
    for (const obj of this.roundObjects) {
      try {
        obj.destroy();
      } catch {
        // Already destroyed — the rest of the board still has to be released.
      }
    }
    this.roundObjects.length = 0;
    this.clearRoundContent();
  }

  /**
   * Removes everything built for the current round. The drop zones are owned
   * by the shared drag board (whose clear tolerates already-gone zones), so
   * only the scene-owned card list is reset here.
   */
  protected clearRoundContent(): void {
    this.board?.clear();
    this.cards = [];
  }

  /** A wrong board wiggles the placed cards, not a tapped card. */
  protected override wiggleTargets(): Phaser.GameObjects.GameObject[] {
    return (this.board?.placedPieces() ?? []).map((card) => card.container);
  }

  /**
   * Keeps the board inert while the wrong answer wiggles: the cards are about
   * to bounce home, so a drag in the middle of it would fight the tween. The
   * input opens again once the bounce starts.
   */
  protected override onWrong(): void {
    this.inputLocked = true;
  }

  /** Bounces every placed card home once the wiggle has finished. */
  protected override onWiggleComplete(): void {
    for (const card of this.board?.placedPieces() ?? []) {
      card.bg.setFillStyle(this.CARD_BG_COLOR, 1);
    }
    // The shell owns the bounce-home policy: every placed card tweens back to
    // its source position and every slot frees.
    this.board?.applyWrongAnswer();
    this.inputLocked = false;
  }

  /** Flashes the filled slots green and bursts a splash at the board center. */
  protected override onCorrect(): void {
    for (const card of this.board?.placedPieces() ?? []) {
      card.bg.setFillStyle(this.SUCCESS_COLOR, 1);
    }
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;
    createCompletionSplash(this, centerX, centerY);
  }

  private computePositions(count: number, width: number): number[] {
    const spacing = width / (count + 1);
    return Array.from({ length: count }, (_, i) => spacing * (i + 1));
  }

  private drawDashedRect(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    w: number,
    h: number,
  ): void {
    const dash = 10;
    const gap = 10;
    // top
    for (let px = x; px < x + w; px += dash + gap) {
      const len = Math.min(dash, x + w - px);
      g.lineBetween(px, y, px + len, y);
    }
    // bottom
    for (let px = x; px < x + w; px += dash + gap) {
      const len = Math.min(dash, x + w - px);
      g.lineBetween(px, y + h, px + len, y + h);
    }
    // left
    for (let py = y; py < y + h; py += dash + gap) {
      const len = Math.min(dash, y + h - py);
      g.lineBetween(x, py, x, py + len);
    }
    // right
    for (let py = y; py < y + h; py += dash + gap) {
      const len = Math.min(dash, y + h - py);
      g.lineBetween(x + w, py, x + w, py + len);
    }
  }

  private createCard(numeral: number, x: number, y: number): void {
    const bg = this.add.rectangle(0, 0, CARD_WIDTH, CARD_HEIGHT, 0xffffff);
    bg.setStrokeStyle(this.OUTLINE_WIDTH, this.OUTLINE_COLOR, 1);

    const numeralImages: Phaser.GameObjects.Image[] = [];
    if (numeral === 10) {
      const left = this.add
        .image(-NUMERAL_TEN_OFFSET / 2 - NUMERAL_TEN_SIZE / 2 + 4, 0, "numeral_1")
        .setDisplaySize(NUMERAL_TEN_SIZE, NUMERAL_TEN_SIZE);
      const right = this.add
        .image(NUMERAL_TEN_OFFSET / 2 + NUMERAL_TEN_SIZE / 2 - 4, 0, "numeral_0")
        .setDisplaySize(NUMERAL_TEN_SIZE, NUMERAL_TEN_SIZE);
      numeralImages.push(left, right);
    } else {
      const img = this.add
        .image(0, 0, `numeral_${numeral}`)
        .setDisplaySize(NUMERAL_SINGLE_SIZE, NUMERAL_SINGLE_SIZE);
      numeralImages.push(img);
    }

    const container = this.add.container(x, y, [bg, ...numeralImages]);
    container.setSize(CARD_WIDTH, CARD_HEIGHT);
    // Containers hit-test in a local space where the display origin (half the
    // size) is added to the tap, so the centred card occupies (0,0)-(w,h).
    // A centred rect would shift the live region up-left by half a card.
    container.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(0, 0, CARD_WIDTH, CARD_HEIGHT),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    });

    const card: NumeralCard = {
      id: String(numeral),
      container,
      bg,
      numeral,
      originX: x,
      originY: y,
      slotIndex: null,
      justDropped: false,
    };

    // Lift juice (visual)
    attachDragLift(container as unknown as Phaser.GameObjects.Image);

    // The shell owns every gesture handler — draggability, drops, swaps,
    // displacement, tap-to-return, and the missed-drop corrections.
    this.board?.addPiece(card);

    this.cards.push(card);
    this.roundObjects.push(
      bg,
      ...numeralImages,
      container as unknown as Phaser.GameObjects.GameObject,
    );
  }

  /**
   * Validates a full board. The shell reports every drag end (per-drop
   * timing); this scene answers only once every slot is filled — the base
   * runs the answer.
   */
  private validateBoard(placedIds: readonly (string | null)[]): void {
    if (placedIds.some((id) => id === null)) return;
    const round = this.rounds[this.roundIndex];
    if (!round) return;
    const placed = placedIds.map((id) => Number(id));
    this.resolveWholeRound(isCorrect(placed, round.solution));
  }
}
