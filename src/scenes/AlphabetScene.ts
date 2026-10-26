import { type AlphabetRound, generatePlaythrough } from "../game/alphabetLogic";
import { letters } from "../game/art/letters";
import type { Rng } from "../game/random";
import type { GameId } from "../types";
import { createCompletionSplash } from "../utils/completionEffect";
import { sceneEntrance } from "../utils/sceneTransitions";
import { speakLetter } from "../utils/speech";
import { getAdaptiveBandShift, getSettings } from "../utils/storage";
import { ChoiceRoundScene } from "./ChoiceRoundScene";

/** Number of rounds per playthrough. */
const ROUND_COUNT = 6;

/** Display size of the big target letter image (px; glyph ≈ 200px visual). */
const TARGET_DISPLAY_SIZE = 256;

/** Display size of the letter image inside each answer card (px; glyph ≈ 100px visual). */
const CARD_LETTER_DISPLAY_SIZE = 128;

/** Display size of the answer cards (exceeds 96px ideal touch target). */
const CARD_SIZE = 160;

/** Horizontal spacing between answer cards (px). */
const CARD_SPACING = 200;

/** Vertical offset of the target letter from screen center (px). */
const TARGET_Y_OFFSET = -140;

/** Vertical offset of the answer cards from screen center (px). */
const CARDS_Y_OFFSET = 180;

/**
 * Maps an uppercase letter to its preloaded SVG texture key (e.g. "A" → "letter_a").
 */
function letterKey(letter: string): string {
  return `letter_${letter.toLowerCase()}`;
}

/**
 * Find the Letter scene — a big target letter is shown and named aloud, and
 * the child taps the matching card among 4 uppercase choices. Correct taps
 * chime, cheer, and advance; incorrect taps wiggle gently (no-fail). Six
 * rounds win the game: shared celebration + sticker on first completion.
 */
export class AlphabetScene extends ChoiceRoundScene {
  private rounds: AlphabetRound[] = [];

  constructor(rng: Rng = Math.random) {
    super("Alphabet", rng);
  }

  preload(): void {
    this.preloadArt([letters]);
  }

  create(): void {
    sceneEntrance(this);
    this.createCornerMascot();
    this.createBackButton();
    this.createProgressDots(ROUND_COUNT);

    // "Hear it again" — re-speaks the current target letter on demand.
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;
    this.createRoundNarrator({
      x: centerX + TARGET_DISPLAY_SIZE / 2 + this.SPEAKER_OFFSET,
      y: centerY + TARGET_Y_OFFSET,
      replay: () => {
        const round = this.rounds[this.roundIndex];
        if (!round) return; // Celebration after the final round — nothing to speak.
        speakLetter(round.target, getSettings().sfxEnabled);
      },
    });

    this.rounds = generatePlaythrough(ROUND_COUNT, getAdaptiveBandShift(this.gameId()), this.rng);
    this.roundIndex = 0;
    this.inputLocked = false;
    this.renderRound();

    this.registerShutdownCleanup();
  }

  protected totalRounds(): number {
    return this.rounds.length;
  }

  protected gameId(): GameId {
    return "alphabet-match";
  }

  protected isChoiceCorrect(index: number): boolean {
    const round = this.rounds[this.roundIndex];
    return round.choices[index] === round.target;
  }

  /** Renders the big target letter (named aloud) and the 4 answer cards. */
  protected buildRoundContent(): void {
    const round = this.rounds[this.roundIndex];
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    this.trackRoundObject(
      this.add
        .image(centerX, centerY + TARGET_Y_OFFSET, letterKey(round.target))
        .setDisplaySize(TARGET_DISPLAY_SIZE, TARGET_DISPLAY_SIZE),
    );

    const { sfxEnabled } = getSettings();
    speakLetter(round.target, sfxEnabled);

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

  /** A splash bursts at the tapped card on a correct answer. */
  protected onCorrect(index: number): void {
    const card = this.choiceTargets[index];
    createCompletionSplash(this, card.x, card.y);
  }
}
