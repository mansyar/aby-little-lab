import type Phaser from "phaser";
import { generateWordPlaythrough, getWord, type WordRound } from "../game/wordLogic";
import type { GameId } from "../types";
import { createCompletionSplash } from "../utils/completionEffect";
import { sceneEntrance } from "../utils/sceneTransitions";
import { speakWord } from "../utils/speech";
import { getAdaptiveBandShift, getSettings } from "../utils/storage";
import { ChoiceRoundScene } from "./ChoiceRoundScene";

/** Number of rounds per playthrough. */
const ROUND_COUNT = 6;

/** Display size of the prompt picture (px). */
const PICTURE_SIZE = 180;

/** Vertical offset of the prompt picture from screen center (px). */
const PICTURE_Y_OFFSET = -240;

/** Card height (px) — comfortably above the 96px touch target. */
const CARD_HEIGHT = 160;

/** Display size of each letter inside a word card (px). */
const LETTER_SIZE = 80;

/** Horizontal gap between letters inside a word card (px). */
const LETTER_GAP = 8;

/** Horizontal padding inside a word card beyond the letters (px). */
const CARD_PADDING = 30;

/** Vertical offsets of the two card rows from screen center (px). */
const CARD_ROW_Y_OFFSETS = [110, 270] as const;

/** Horizontal offset of the two card columns from screen center (px). */
const CARD_COL_X_OFFSET = 210;

/**
 * Find the Word scene — a picture is shown and its word is spoken aloud, and
 * the child taps the matching printed word among 4 cards in a 2×2 grid.
 * Correct taps chime, cheer, and advance; incorrect taps wiggle gently
 * (no-fail). Six rounds win the game: shared celebration + sticker on first
 * completion.
 */
export class WordMatchScene extends ChoiceRoundScene {
  private rounds: WordRound[] = [];

  constructor() {
    super("WordMatch");
  }

  create(): void {
    sceneEntrance(this);
    this.createCornerMascot();
    this.createBackButton();
    this.createProgressDots(ROUND_COUNT);

    // "Hear it again" — re-speaks the current target word on demand.
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;
    this.createRoundNarrator({
      x: centerX + PICTURE_SIZE / 2 + this.SPEAKER_OFFSET,
      y: centerY + PICTURE_Y_OFFSET,
      replay: () => {
        const round = this.rounds[this.roundIndex];
        if (!round) return; // Celebration after the final round — nothing to speak.
        speakWord(round.target, getSettings().sfxEnabled);
      },
    });

    this.rounds = generateWordPlaythrough(ROUND_COUNT, getAdaptiveBandShift(this.gameId()));
    this.roundIndex = 0;
    this.inputLocked = false;
    this.renderRound();

    this.registerShutdownCleanup();
  }

  protected totalRounds(): number {
    return this.rounds.length;
  }

  protected gameId(): GameId {
    return "word-match";
  }

  protected isChoiceCorrect(index: number): boolean {
    const round = this.rounds[this.roundIndex];
    return round.choices[index] === round.target;
  }

  /** Renders the prompt picture (word spoken aloud) and the 4 word cards. */
  protected buildRoundContent(): void {
    const round = this.rounds[this.roundIndex];
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    this.trackRoundObject(
      this.add
        .image(centerX, centerY + PICTURE_Y_OFFSET, getWord(round.target)?.promptTexture ?? "")
        .setDisplaySize(PICTURE_SIZE, PICTURE_SIZE),
    );

    const { sfxEnabled } = getSettings();
    speakWord(round.target, sfxEnabled);

    for (let i = 0; i < round.choices.length; i++) {
      this.createWordCard(round.choices[i], i);
    }
  }

  protected clearRoundContent(): void {}

  /** A splash bursts at the tapped card on a correct answer. */
  protected onCorrect(index: number): void {
    const card = this.choiceTargets[index];
    createCompletionSplash(this, card.x, card.y);
  }

  /** Creates one word card with the word composed from letter textures. */
  private createWordCard(word: string, index: number): void {
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;
    const row = Math.floor(index / 2);
    const col = index % 2;
    const cardX = centerX + (col === 0 ? -CARD_COL_X_OFFSET : CARD_COL_X_OFFSET);
    const cardY = centerY + CARD_ROW_Y_OFFSETS[row];
    const contentWidth = word.length * LETTER_SIZE + (word.length - 1) * LETTER_GAP;

    this.createChoiceTarget(cardX, cardY, CARD_HEIGHT, index, {
      width: contentWidth + CARD_PADDING * 2,
      height: CARD_HEIGHT,
    });

    // Compose the word from the already-loaded letter textures.
    const letters: Phaser.GameObjects.Image[] = [];
    const startX = cardX - contentWidth / 2 + LETTER_SIZE / 2;
    for (let j = 0; j < word.length; j++) {
      const letter = this.add
        .image(startX + j * (LETTER_SIZE + LETTER_GAP), cardY, `letter_${word[j].toLowerCase()}`)
        .setDisplaySize(LETTER_SIZE, LETTER_SIZE);
      letters.push(letter);
    }
    this.attachCardContent(index, letters);
  }
}
