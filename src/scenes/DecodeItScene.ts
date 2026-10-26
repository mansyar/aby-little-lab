import type Phaser from "phaser";
import { animals } from "../game/art/animals";
import { food } from "../game/art/food";
import { items } from "../game/art/items";
import { letters } from "../game/art/letters";
import { music } from "../game/art/music";
import { shapes } from "../game/art/shapes";
import { toys } from "../game/art/toys";
import { buildPlaythrough, type DecodeRound, getDecodeWord, isCorrect } from "../game/decodeLogic";
import type { Rng } from "../game/random";
import type { GameId } from "../types";
import { createCompletionSplash } from "../utils/completionEffect";
import { sceneEntrance } from "../utils/sceneTransitions";
import { speakWord } from "../utils/speech";
import { getAdaptiveBandShift, getSettings } from "../utils/storage";
import { ChoiceRoundScene } from "./ChoiceRoundScene";

const ROUND_COUNT = 6;
const PICTURE_SIZE = 180;
const PICTURE_Y_OFFSET = -240;
const CARD_HEIGHT = 160;
const LETTER_SIZE = 80;
const LETTER_GAP = 8;
const CARD_PADDING = 30;
const CARD_ROW_Y_OFFSETS = [110, 270] as const;
const CARD_COL_X_OFFSET = 210;

/**
 * Decode It scene — the child sees a picture and hears the spoken word, then
 * taps the correct written word among 4 cards in a 2×2 grid. Mirrors the
 * Find-the-Word flow with the decode-specific 3+3 tier playthrough and
 * confusable-family guards. Six rounds win the game: shared celebration +
 * sticker on first completion.
 */
export class DecodeItScene extends ChoiceRoundScene {
  private rounds: DecodeRound[] = [];

  constructor(rng: Rng = Math.random) {
    super("DecodeIt", rng);
  }

  preload(): void {
    this.preloadArt([animals, food, items, letters, music, shapes, toys]);
  }

  create(): void {
    sceneEntrance(this);
    this.createCornerMascot();
    this.createBackButton();
    this.createProgressDots(ROUND_COUNT);

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

    this.rounds = buildPlaythrough(ROUND_COUNT, getAdaptiveBandShift(this.gameId()), this.rng);
    this.roundIndex = 0;
    this.inputLocked = false;
    this.renderRound();

    this.registerShutdownCleanup();
  }

  protected totalRounds(): number {
    return this.rounds.length;
  }

  protected gameId(): GameId {
    return "decode-it";
  }

  protected isChoiceCorrect(index: number): boolean {
    return isCorrect(this.rounds[this.roundIndex], index);
  }

  /** Renders the prompt picture (word spoken aloud) and the 4 word cards. */
  protected buildRoundContent(): void {
    const round = this.rounds[this.roundIndex];
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    const promptTexture = getDecodeWord(round.target)?.promptTexture ?? "";
    this.trackRoundObject(
      this.add
        .image(centerX, centerY + PICTURE_Y_OFFSET, promptTexture)
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
