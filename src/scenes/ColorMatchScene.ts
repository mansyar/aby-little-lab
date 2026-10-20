import {
  buildPlaythrough,
  type ColorMatchRound,
  isCorrect,
  promptFor,
} from "../game/colorMatchLogic";
import type { GameId } from "../types";
import { sceneEntrance } from "../utils/sceneTransitions";
import { speakWord } from "../utils/speech";
import { getAdaptiveBandShift, getSettings } from "../utils/storage";
import { ChoiceRoundScene } from "./ChoiceRoundScene";

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
export class ColorMatchScene extends ChoiceRoundScene {
  private rounds: ColorMatchRound[] = [];

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
    this.createRoundNarrator({
      x: centerX + SWATCH_SIZE / 2 + this.SPEAKER_OFFSET,
      y: swatchY,
      replay: () => {
        const round = this.rounds[this.roundIndex];
        if (!round) return; // Celebration after the final round — nothing to speak.
        speakWord(promptFor(round.targetColorId), getSettings().sfxEnabled);
      },
    });

    this.rounds = buildPlaythrough(getAdaptiveBandShift("color-match"));
    this.roundIndex = 0;
    this.inputLocked = false;
    this.renderRound();

    this.registerShutdownCleanup();
  }

  protected totalRounds(): number {
    return this.rounds.length;
  }

  protected gameId(): GameId {
    return "color-match";
  }

  protected isChoiceCorrect(index: number): boolean {
    const round = this.rounds[this.roundIndex];
    return isCorrect(round.cards, index, round.targetColorId);
  }

  /**
   * Renders the target-color prompt swatch and the 2x2 card grid (4 distinct
   * colors), with the color name spoken aloud via TTS when SFX is enabled.
   */
  protected buildRoundContent(): void {
    const round = this.rounds[this.roundIndex];
    const { sfxEnabled } = getSettings();
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

      this.createChoiceTarget(x, y, CARD_SIZE, i);
      const item = this.add
        .image(x, y, round.cards[i].texture)
        .setDisplaySize(ITEM_SIZE, ITEM_SIZE);
      this.attachCardContent(i, [item]);
    }
  }

  protected clearRoundContent(): void {}

  /** Draws the prompt swatch filled with the target color of the current round. */
  private drawSwatch(round: ColorMatchRound): void {
    const target = round.cards.find((card) => card.colorId === round.targetColorId);
    if (!target) return;
    const x = this.cameras.main.centerX;
    const y = this.cameras.main.centerY - SWATCH_Y_OFFSET;
    const fill = parseInt(target.fill.slice(1), 16);
    const left = x - SWATCH_SIZE / 2;
    const top = y - SWATCH_SIZE / 2;

    const swatch = this.trackRoundObject(this.add.graphics());
    swatch.fillStyle(fill, 1);
    swatch.fillRoundedRect(left, top, SWATCH_SIZE, SWATCH_SIZE, SWATCH_RADIUS);
    swatch.lineStyle(8, this.OUTLINE_COLOR, 1);
    swatch.strokeRoundedRect(left, top, SWATCH_SIZE, SWATCH_SIZE, SWATCH_RADIUS);
  }
}
