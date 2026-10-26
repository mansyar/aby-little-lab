import { animals } from "../game/art/animals";
import { food } from "../game/art/food";
import { items } from "../game/art/items";
import { letters } from "../game/art/letters";
import { music } from "../game/art/music";
import { shapes } from "../game/art/shapes";
import { toys } from "../game/art/toys";
import { generatePhonicsPlaythrough, type PhonicsRound } from "../game/firstSoundsLogic";
import type { Rng } from "../game/random";
import type { GameId } from "../types";
import { createCompletionSplash } from "../utils/completionEffect";
import { sceneEntrance } from "../utils/sceneTransitions";
import { speakLetter, speakWord } from "../utils/speech";
import { getAdaptiveBandShift, getSettings } from "../utils/storage";
import { ChoiceRoundScene } from "./ChoiceRoundScene";

/** Number of rounds per playthrough. */
const ROUND_COUNT = 6;

/** Display size of the prompt picture (px). */
const PICTURE_SIZE = 180;

/** Vertical offset of the prompt picture from screen center (px). */
const PICTURE_Y_OFFSET = -140;

/** Display size of the answer cards (exceeds 96px ideal touch target). */
const CARD_SIZE = 160;

/** Display size of the letter image inside each answer card (px; glyph ≈ 100px visual). */
const CARD_LETTER_DISPLAY_SIZE = 128;

/** Horizontal spacing between answer cards (px). */
const CARD_SPACING = 200;

/** Vertical offset of the answer cards from screen center (px). */
const CARDS_Y_OFFSET = 180;

/**
 * Maps an uppercase letter to its preloaded SVG texture key (e.g. "A" → "letter_a").
 */
function letterKey(letter: string): string {
  return `letter_${letter.toLowerCase()}`;
}

/**
 * First Sounds scene — a word is shown as a picture and spoken aloud, and the
 * child taps the uppercase letter that makes the word's first sound, choosing
 * among 4 letter cards. Correct taps chime, cheer, and speak the letter name;
 * incorrect taps wiggle gently (no-fail). Six rounds win the game: shared
 * celebration + sticker on first completion.
 */
export class FirstSoundsScene extends ChoiceRoundScene {
  private rounds: PhonicsRound[] = [];

  constructor(rng: Rng = Math.random) {
    super("FirstSounds", rng);
  }

  preload(): void {
    this.preloadArt([animals, food, items, letters, music, shapes, toys]);
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
        speakWord(round.word, getSettings().sfxEnabled);
      },
    });

    this.rounds = generatePhonicsPlaythrough(
      ROUND_COUNT,
      getAdaptiveBandShift(this.gameId()),
      this.rng,
    );
    this.roundIndex = 0;
    this.inputLocked = false;
    this.renderRound();

    this.registerShutdownCleanup();
  }

  protected totalRounds(): number {
    return this.rounds.length;
  }

  protected gameId(): GameId {
    return "first-sounds";
  }

  protected isChoiceCorrect(index: number): boolean {
    const round = this.rounds[this.roundIndex];
    return round.choices[index] === round.target;
  }

  /**
   * Renders the word's prompt picture (word spoken aloud) and the 4 letter
   * cards in a row.
   */
  protected buildRoundContent(): void {
    const round = this.rounds[this.roundIndex];
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    this.trackRoundObject(
      this.add
        .image(centerX, centerY + PICTURE_Y_OFFSET, round.promptTexture)
        .setDisplaySize(PICTURE_SIZE, PICTURE_SIZE),
    );

    const { sfxEnabled } = getSettings();
    speakWord(round.word, sfxEnabled);

    const cardsY = centerY + CARDS_Y_OFFSET;
    for (let i = 0; i < round.choices.length; i++) {
      const x = centerX + (i - 1.5) * CARD_SPACING;
      this.createChoiceTarget(x, cardsY, CARD_SIZE, i);
      const letter = this.add
        .image(x, cardsY, letterKey(round.choices[i]))
        .setDisplaySize(CARD_LETTER_DISPLAY_SIZE, CARD_LETTER_DISPLAY_SIZE);
      this.attachCardContent(i, [letter]);
    }
  }

  protected clearRoundContent(): void {}

  /**
   * A splash bursts at the tapped card and the letter name is spoken once as
   * reinforcement (the round-start cue already spoke the word).
   */
  protected onCorrect(index: number): void {
    const card = this.choiceTargets[index];
    createCompletionSplash(this, card.x, card.y);
    speakLetter(this.rounds[this.roundIndex].target, getSettings().sfxEnabled);
  }
}
