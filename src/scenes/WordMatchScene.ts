import Phaser from "phaser";
import { AudioManager } from "../audio/AudioManager";
import { createCornerMascot, type Mascot } from "../components/Mascot";
import { ParentLock } from "../components/ParentLock";
import { generateWordPlaythrough, getWord, type WordRound } from "../game/wordLogic";
import { attachPressFeedback } from "../utils/pressFeedback";
import { sceneEntrance, transitionToScene } from "../utils/sceneTransitions";
import { speakWord } from "../utils/speech";
import { load } from "../utils/storage";

/** Number of rounds per playthrough. */
const ROUND_COUNT = 6;

/** Y position of progress dots from top of screen. */
const PROGRESS_DOT_Y = 60;

/** Spacing between progress dots (px). */
const PROGRESS_DOT_SPACING = 40;

/** Radius of progress dots (px). */
const PROGRESS_DOT_RADIUS = 8;

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
const CARD_COL_X_OFFSET = 200;

/** Stroke width of card outlines. */
const OUTLINE_WIDTH = 4;

/**
 * Find the Word scene — a picture is shown and its word is spoken aloud, and
 * the child taps the matching printed word among 4 cards in a 2×2 grid.
 * Correct taps chime, cheer, and advance; incorrect taps wiggle gently
 * (no-fail). Six rounds win the game: shared celebration + sticker on first
 * completion.
 */
export class WordMatchScene extends Phaser.Scene {
  private parentLock?: ParentLock;
  private mascot?: Mascot;
  private readonly audioManager: AudioManager;
  private readonly progressDots: Phaser.GameObjects.Arc[] = [];
  /** Answer card backgrounds of the current round. */
  private readonly cardRects: Phaser.GameObjects.Rectangle[] = [];
  /** Letter images per card of the current round (indexed like cardRects). */
  private readonly cardLetters: Phaser.GameObjects.Image[][] = [];
  /** Per-round display objects (currently the prompt picture). */
  private readonly roundObjects: Phaser.GameObjects.GameObject[] = [];
  private rounds: WordRound[] = [];
  private roundIndex = 0;
  private inputLocked = false;

  constructor() {
    super({ key: "WordMatch" });
    this.audioManager = AudioManager.getInstance();
  }

  create(): void {
    sceneEntrance(this);
    this.mascot = createCornerMascot(this);

    const backButton = this.add.text(20, 20, "← Back", {
      fontSize: "24px",
      color: "#2d3748",
    });
    backButton.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(0, 0, 96, 96),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    });

    this.parentLock = new ParentLock({
      scene: this,
      target: backButton,
      onSuccess: () => {
        transitionToScene(this, "Hub");
      },
      onFailure: () => {
        // No action needed on failure.
      },
    });
    attachPressFeedback(backButton);

    this.createProgressDots();

    this.rounds = generateWordPlaythrough(ROUND_COUNT);
    this.roundIndex = 0;
    this.renderRound();

    this.events.on("shutdown", () => {
      this.parentLock?.destroy();
      this.mascot?.destroy();
      this.mascot = undefined;
    });
  }

  /** Creates 6 progress dots at the top of the screen, dimmed by default. */
  private createProgressDots(): void {
    const startX = this.cameras.main.centerX - ((ROUND_COUNT - 1) * PROGRESS_DOT_SPACING) / 2;
    for (let i = 0; i < ROUND_COUNT; i++) {
      const dot = this.add.circle(
        startX + i * PROGRESS_DOT_SPACING,
        PROGRESS_DOT_Y,
        PROGRESS_DOT_RADIUS,
        0x2d3748,
        0.3,
      );
      this.progressDots.push(dot);
    }
  }

  /**
   * Renders the current round: the prompt picture (with the word spoken
   * aloud via TTS when SFX is enabled) and 4 word cards in a 2×2 grid.
   * Previous objects are destroyed.
   */
  private renderRound(): void {
    this.clearRound();

    const round = this.rounds[this.roundIndex];
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    const prompt = this.add.image(
      centerX,
      centerY + PICTURE_Y_OFFSET,
      getWord(round.target)?.promptTexture ?? "",
    );
    prompt.setDisplaySize(PICTURE_SIZE, PICTURE_SIZE);
    this.roundObjects.push(prompt);

    const { sfxEnabled } = load().settings;
    speakWord(round.target, sfxEnabled);

    this.createCards(round);
  }

  /** Creates the 4 word cards in a 2×2 grid with tap handling. */
  private createCards(round: WordRound): void {
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
      card.setStrokeStyle(OUTLINE_WIDTH, 0x2d3748, 1);
      card.setInteractive({
        hitArea: new Phaser.Geom.Rectangle(0, 0, cardWidth, CARD_HEIGHT),
        hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      });
      card.on("pointerdown", () => this.handleChoice(i));
      this.cardRects.push(card);

      // Compose the word from the already-loaded letter textures.
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

  /** Destroys all display objects created for the current round. */
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
}
