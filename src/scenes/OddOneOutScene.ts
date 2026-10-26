import { animals } from "../game/art/animals";
import { music } from "../game/art/music";
import { shapes } from "../game/art/shapes";
import { toys } from "../game/art/toys";
import { createPlaythrough, isCorrect, type OddOneRound, promptFor } from "../game/oddOneOutLogic";
import type { Rng } from "../game/random";
import type { GameId } from "../types";
import { sceneEntrance } from "../utils/sceneTransitions";
import { speakWord } from "../utils/speech";
import { getAdaptiveBandShift, getSettings } from "../utils/storage";
import { ChoiceRoundScene } from "./ChoiceRoundScene";

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
export class OddOneOutScene extends ChoiceRoundScene {
  private rounds: OddOneRound[] = [];

  constructor(rng: Rng = Math.random) {
    super("OddOneOut", rng);
  }

  preload(): void {
    this.preloadArt([animals, music, shapes, toys]);
  }

  create(): void {
    sceneEntrance(this);
    this.createCornerMascot();
    this.createBackButton();
    this.createProgressDots(ROUND_COUNT);

    // "Hear it again" — re-speaks the current odd item's name on demand.
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;
    this.createRoundNarrator({
      x: centerX + CARD_SIZE / 2 + this.SPEAKER_OFFSET,
      y: centerY - GRID_Y_OFFSET,
      replay: () => {
        const round = this.rounds[this.roundIndex];
        if (!round) return; // Celebration after the final round — nothing to speak.
        speakWord(promptFor(round.oddTexture), getSettings().sfxEnabled);
      },
    });

    this.rounds = createPlaythrough(getAdaptiveBandShift("odd-one-out"), this.rng);
    this.roundIndex = 0;
    this.inputLocked = false;
    this.renderRound();

    this.registerShutdownCleanup();
  }

  protected totalRounds(): number {
    return this.rounds.length;
  }

  protected gameId(): GameId {
    return "odd-one-out";
  }

  protected isChoiceCorrect(index: number): boolean {
    const round = this.rounds[this.roundIndex];
    return isCorrect(round, index);
  }

  /**
   * Renders the 2x2 card grid (3 identical + 1 odd) with the odd item's name
   * spoken aloud via TTS when SFX is enabled.
   */
  protected buildRoundContent(): void {
    const round = this.rounds[this.roundIndex];
    const { sfxEnabled } = getSettings();
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

      this.createChoiceTarget(x, y, CARD_SIZE, i);
      const texture = i === round.oddSlot ? round.oddTexture : round.groupTexture;
      const item = this.add.image(x, y, texture).setDisplaySize(ITEM_SIZE, ITEM_SIZE);
      this.attachCardContent(i, [item]);
    }
  }

  protected clearRoundContent(): void {}
}
