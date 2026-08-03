import Phaser from "phaser";
import { AudioManager } from "../audio/AudioManager";
import { createCornerMascot, type Mascot } from "../components/Mascot";
import { ParentLock } from "../components/ParentLock";
import {
  generateWordBuildPlaythrough,
  generateLetterTiles,
  type FirstWord,
} from "../game/wordLogic";
import { attachPressFeedback } from "../utils/pressFeedback";
import { motionDuration, isReducedMotion } from "../utils/motion";
import { sceneEntrance, transitionToScene } from "../utils/sceneTransitions";
import { speakWord } from "../utils/speech";
import { load } from "../utils/storage";

/** Number of words per playthrough. */
const WORD_COUNT = 3;

/** Y position of progress dots from top of screen. */
const PROGRESS_DOT_Y = 60;

/** Spacing between progress dots (px). */
const PROGRESS_DOT_SPACING = 40;

/** Radius of progress dots (px). */
const PROGRESS_DOT_RADIUS = 8;

/** Display size of the prompt picture (px). */
const PICTURE_SIZE = 180;

/** Y offset of the prompt picture from screen center. */
const PICTURE_Y_OFFSET = -240;

/** Y offset of the slot row from screen center. */
const SLOT_Y_OFFSET = 40;

/** Side length of each empty word slot (px). */
const SLOT_SIZE = 120;

/** Gap between slots (px). */
const SLOT_GAP = 20;

/** Y offset of the letter tile row from screen center. */
const TILE_Y_OFFSET = 220;

/** Side length of each letter tile (px). */
const TILE_SIZE = 110;

/** Gap between letter tiles (px). */
const TILE_GAP = 16;

/** Display size of a letter texture inside a slot or tile (px). */
const LETTER_SIZE = 80;

/** Card/tile outline width (px). */
const OUTLINE_WIDTH = 4;

/** Wiggle angle for wrong tiles (deg), normal vs reduced motion. */
const WIGGLE_ANGLE = 4;
const WIGGLE_REDUCED_ANGLE = 2;

/** Wiggle durations (ms), normal vs reduced motion. */
const WIGGLE_DURATION = 350;
const WIGGLE_REDUCED_DURATION = 200;

/** Number of wiggle yoyo repeats on a wrong tile. */
const WIGGLE_REPEATS = 3;

/** Settle-pop scale for a letter locking into a slot. */
const SLOT_POP_SCALE = 1.15;

/** Settle-pop tween duration (ms). */
const SLOT_POP_DURATION = 150;

/**
 * Build the Word scene — a picture is shown and its word is spoken aloud, and
 * the child spells the word by tapping letter tiles in order into word slots.
 * Correct letters settle into the next empty slot; wrong tiles wiggle gently
 * (no-fail). Three words win the game: shared celebration + sticker on first
 * completion.
 */
export class WordBuilderScene extends Phaser.Scene {
  private parentLock?: ParentLock;
  private mascot?: Mascot;
  private readonly audioManager: AudioManager;
  private readonly progressDots: Phaser.GameObjects.Arc[] = [];
  private readonly slotRects: Phaser.GameObjects.Rectangle[] = [];
  private readonly slotXs: number[] = [];
  private readonly tileRects: Phaser.GameObjects.Rectangle[] = [];
  private readonly tileLetterImages: Phaser.GameObjects.Image[] = [];
  private readonly tileLetterValues: string[] = [];
  private readonly slotImages: Array<Phaser.GameObjects.Image | null> = [];
  private readonly roundObjects: Phaser.GameObjects.GameObject[] = [];
  private words: FirstWord[] = [];
  private wordIndex = 0;
  private filledSlots = 0;
  private inputLocked = false;

  constructor() {
    super({ key: "WordBuilder" });
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

    this.words = generateWordBuildPlaythrough(WORD_COUNT);
    this.wordIndex = 0;
    this.renderRound();

    this.events.on("shutdown", () => {
      this.parentLock?.destroy();
      this.mascot?.destroy();
      this.mascot = undefined;
    });
  }

  /** Creates 3 progress dots at the top of the screen, dimmed by default. */
  private createProgressDots(): void {
    const startX = this.cameras.main.centerX - ((WORD_COUNT - 1) * PROGRESS_DOT_SPACING) / 2;
    for (let i = 0; i < WORD_COUNT; i++) {
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
   * Renders the current word's prompt picture, one slot per letter, and the
   * 6 letter tiles (word letters + distractors), then speaks the word.
   */
  private renderRound(): void {
    this.clearRound();

    const word = this.words[this.wordIndex];
    speakWord(word.word, load().settings.sfxEnabled);

    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    const prompt = this.add
      .image(centerX, centerY + PICTURE_Y_OFFSET, word.promptTexture)
      .setDisplaySize(PICTURE_SIZE, PICTURE_SIZE);
    this.roundObjects.push(prompt);

    // One empty slot per letter of the word.
    const slotRowWidth = word.word.length * SLOT_SIZE + (word.word.length - 1) * SLOT_GAP;
    const slotStartX = centerX - slotRowWidth / 2 + SLOT_SIZE / 2;
    for (let i = 0; i < word.word.length; i++) {
      const slot = this.add
        .rectangle(
          slotStartX + i * (SLOT_SIZE + SLOT_GAP),
          centerY + SLOT_Y_OFFSET,
          SLOT_SIZE,
          SLOT_SIZE,
          0xffffff,
          1,
        )
        .setStrokeStyle(OUTLINE_WIDTH, 0x2d3748, 1);
      this.slotRects.push(slot);
      this.slotXs.push(slotStartX + i * (SLOT_SIZE + SLOT_GAP));
      this.roundObjects.push(slot);
      this.slotImages.push(null);
    }

    // Six letter tiles: the word's unique letters plus distractors.
    const tileValues = generateLetterTiles(word.word);
    const tileRowWidth = tileValues.length * TILE_SIZE + (tileValues.length - 1) * TILE_GAP;
    const tileStartX = centerX - tileRowWidth / 2 + TILE_SIZE / 2;
    for (let i = 0; i < tileValues.length; i++) {
      const tileX = tileStartX + i * (TILE_SIZE + TILE_GAP);
      const tileY = centerY + TILE_Y_OFFSET;
      const tile = this.add
        .rectangle(tileX, tileY, TILE_SIZE, TILE_SIZE, 0xffffff, 1)
        .setStrokeStyle(OUTLINE_WIDTH, 0x2d3748, 1);
      tile.setInteractive({
        hitArea: new Phaser.Geom.Rectangle(0, 0, TILE_SIZE, TILE_SIZE),
        hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      });
      tile.on("pointerdown", () => this.handleTile(i));

      const letterImage = this.add
        .image(tileX, tileY, `letter_${tileValues[i].toLowerCase()}`)
        .setDisplaySize(LETTER_SIZE, LETTER_SIZE);

      this.tileRects.push(tile);
      this.tileLetterImages.push(letterImage);
      this.tileLetterValues.push(tileValues[i]);
      this.roundObjects.push(tile, letterImage);
    }
  }

  /** Destroys all objects of the current round and resets per-round state. */
  private clearRound(): void {
    for (const obj of this.roundObjects) {
      obj.destroy();
    }
    this.roundObjects.length = 0;
    this.slotRects.length = 0;
    this.slotXs.length = 0;
    this.tileRects.length = 0;
    this.tileLetterImages.length = 0;
    this.tileLetterValues.length = 0;
    this.slotImages.length = 0;
    this.filledSlots = 0;
  }

  /**
   * Letter-tile tap handling: fills the next empty slot when the tile
   * matches the expected letter, otherwise wiggles the tile (no penalty).
   * Input is locked while a transition is in flight.
   */
  private handleTile(tileIndex: number): void {
    if (this.inputLocked) return;

    const word = this.words[this.wordIndex];
    const chosen = this.tileLetterValues[tileIndex];
    const expected = word.word[this.filledSlots];

    if (chosen !== expected) {
      this.audioManager.playIncorrect();
      this.mascot?.nod();
      const reduced = isReducedMotion();
      this.tweens.add({
        targets: [this.tileRects[tileIndex], this.tileLetterImages[tileIndex]],
        angle: reduced ? WIGGLE_REDUCED_ANGLE : WIGGLE_ANGLE,
        duration: motionDuration(WIGGLE_DURATION, WIGGLE_REDUCED_DURATION),
        yoyo: true,
        repeat: WIGGLE_REPEATS,
        ease: "Sine.inOut",
      });
      return;
    }

    // Correct: soft tick + settle pop, then lock the letter into the slot.
    this.audioManager.playPop();
    const slotX = this.slotXs[this.filledSlots];
    const slotY = this.cameras.main.centerY + SLOT_Y_OFFSET;
    const letterImage = this.add
      .image(slotX, slotY, `letter_${chosen.toLowerCase()}`)
      .setDisplaySize(LETTER_SIZE, LETTER_SIZE)
      .setScale(SLOT_POP_SCALE);
    this.tweens.add({
      targets: letterImage,
      scale: 1,
      duration: SLOT_POP_DURATION,
      ease: "Back.out",
    });
    this.slotImages[this.filledSlots] = letterImage;
    this.roundObjects.push(letterImage);
    this.filledSlots += 1;

    if (this.filledSlots === word.word.length) {
      // Word fully spelled: lock input. Lingering, chime, and next-word
      // flow land in Task 3.4.
      this.inputLocked = true;
    }
  }
}
