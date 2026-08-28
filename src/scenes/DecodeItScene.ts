import Phaser from "phaser";
import { SpeakerButton } from "../components/SpeakerButton";
import { buildPlaythrough, type DecodeRound, getDecodeWord, isCorrect } from "../game/decodeLogic";
import { createCompletionSplash } from "../utils/completionEffect";
import { isReducedMotion, motionDuration } from "../utils/motion";
import { attachPressFeedback } from "../utils/pressFeedback";
import { sceneEntrance } from "../utils/sceneTransitions";
import { speakWord } from "../utils/speech";
import { getAdaptiveBandShift, load } from "../utils/storage";
import { GameSceneBase } from "./GameSceneBase";

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
export class DecodeItScene extends GameSceneBase {
  private readonly cardRects: Phaser.GameObjects.Rectangle[] = [];
  private readonly cardLetters: Phaser.GameObjects.Image[][] = [];
  private readonly roundObjects: Phaser.GameObjects.GameObject[] = [];
  private rounds: DecodeRound[] = [];
  private roundIndex = 0;

  constructor() {
    super("DecodeIt");
  }

  create(): void {
    sceneEntrance(this);
    this.createCornerMascot();
    this.createBackButton();
    this.createProgressDots(ROUND_COUNT);

    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;
    this.speaker = new SpeakerButton(
      this,
      centerX + PICTURE_SIZE / 2 + this.SPEAKER_OFFSET,
      centerY + PICTURE_Y_OFFSET,
      {
        muted: !load().settings.sfxEnabled,
        onSpeak: () => {
          const round = this.rounds[this.roundIndex];
          if (!round) return;
          speakWord(round.target, load().settings.sfxEnabled);
        },
      },
    );

    this.rounds = buildPlaythrough(ROUND_COUNT, getAdaptiveBandShift("decode-it"));
    this.roundIndex = 0;
    this.inputLocked = false;
    this.renderRound();

    this.registerShutdownCleanup();
  }

  private renderRound(): void {
    this.clearRound();

    const round = this.rounds[this.roundIndex];
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    const prompt = this.add.image(
      centerX,
      centerY + PICTURE_Y_OFFSET,
      getDecodeWord(round.target)?.promptTexture ?? "",
    );
    prompt.setDisplaySize(PICTURE_SIZE, PICTURE_SIZE);
    this.roundObjects.push(prompt);

    const { sfxEnabled } = load().settings;
    speakWord(round.target, sfxEnabled);

    this.createCards(round);
  }

  private createCards(round: DecodeRound): void {
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    for (let i = 0; i < round.choices.length; i++) {
      const word = round.choices[i];
      const row = Math.floor(i / 2);
      const col = i % 2;
      const cardX = centerX + (col === 0 ? -CARD_COL_X_OFFSET : CARD_COL_X_OFFSET);
      const cardY = centerY + CARD_ROW_Y_OFFSETS[row];
      const contentWidth = word.length * LETTER_SIZE + (word.length - 1) * LETTER_GAP;
      const cardWidth = contentWidth + CARD_PADDING * 2;

      const card = this.add.rectangle(cardX, cardY, cardWidth, CARD_HEIGHT, 0xffffff);
      card.setStrokeStyle(this.OUTLINE_WIDTH, this.OUTLINE_COLOR, 1);
      card.setInteractive({
        hitArea: new Phaser.Geom.Rectangle(0, 0, cardWidth, CARD_HEIGHT),
        hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      });
      card.on("pointerdown", () => this.handleChoice(i));
      attachPressFeedback(card);
      this.cardRects.push(card);

      const letters: Phaser.GameObjects.Image[] = [];
      const startX = cardX - contentWidth / 2 + LETTER_SIZE / 2;
      for (let j = 0; j < word.length; j++) {
        const letter = this.add.image(
          startX + j * (LETTER_SIZE + LETTER_GAP),
          cardY,
          `letter_${word[j].toLowerCase()}`,
        );
        letter.setDisplaySize(LETTER_SIZE, LETTER_SIZE);
        letters.push(letter);
      }
      this.cardLetters.push(letters);
    }
  }

  private clearRound(): void {
    for (const obj of this.roundObjects) {
      obj.destroy();
    }
    this.roundObjects.length = 0;
    for (const card of this.cardRects) {
      card.destroy();
    }
    this.cardRects.length = 0;
    for (const letters of this.cardLetters) {
      for (const letter of letters) {
        letter.destroy();
      }
    }
    this.cardLetters.length = 0;
  }

  private handleChoice(choiceIndex: number): void {
    if (this.inputLocked) return;
    const round = this.rounds[this.roundIndex];
    if (isCorrect(round, choiceIndex)) {
      this.handleCorrect(choiceIndex);
    } else {
      this.handleIncorrect(choiceIndex);
    }
  }

  private handleCorrect(choiceIndex: number): void {
    this.inputLocked = true;
    const card = this.cardRects[choiceIndex];
    if (card) {
      createCompletionSplash(this, card.x, card.y);
    }
    this.audioManager.playCorrect();
    this.recordCorrect();
    this.mascot?.cheer();
    this.fillProgressDot(this.roundIndex);

    this.time.delayedCall(this.NEXT_ROUND_DELAY, () => {
      this.roundIndex++;
      if (this.roundIndex >= this.rounds.length) {
        this.completeGame("decode-it");
      } else {
        this.inputLocked = false;
        this.renderRound();
      }
    });
  }

  private handleIncorrect(choiceIndex: number): void {
    this.audioManager.playIncorrect();
    this.recordWrong();
    this.mascot?.nod();

    const targets = [this.cardRects[choiceIndex], ...this.cardLetters[choiceIndex]];
    const angle = isReducedMotion() ? this.WIGGLE_REDUCED_ANGLE : this.WIGGLE_ANGLE;
    this.tweens.add({
      targets,
      angle,
      duration: motionDuration(this.WIGGLE_DURATION, this.WIGGLE_REDUCED_DURATION),
      yoyo: true,
      repeat: this.WIGGLE_REPEATS,
      ease: "Sine.inOut",
    });
  }
}
