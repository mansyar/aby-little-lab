import Phaser from "phaser";
import { SpeakerButton } from "../components/SpeakerButton";
import {
  type FirstWord,
  generateLetterTiles,
  generateWordBuildPlaythrough,
} from "../game/wordLogic";
import { isReducedMotion, motionDuration, motionScale } from "../utils/motion";
import { sceneEntrance } from "../utils/sceneTransitions";
import { speakWord } from "../utils/speech";
import { load } from "../utils/storage";
import { GameSceneBase } from "./GameSceneBase";

/** Number of words per playthrough. */
const WORD_COUNT = 3;

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

/**
 * Side length of each letter tile (px). Kept at 132 so tiles stay above the
 * 64px touch floor on small phones (FIT scale ~0.49 → 64.7px on screen).
 */
const TILE_SIZE = 132;

/** Gap between letter tiles (px). */
const TILE_GAP = 16;

/** Display size of a letter texture inside a slot or tile (px). */
const LETTER_SIZE = 80;

/** Settle-pop scale for a letter locking into a slot. */
const SLOT_POP_SCALE = 1.15;
const SLOT_POP_REDUCED_SCALE = 1.05;

/** Settle-pop tween duration (ms), normal vs reduced motion. */
const SLOT_POP_DURATION = 150;
const SLOT_POP_REDUCED_DURATION = 90;

/** Fly-to-slot duration (ms) for a used tile's letter, normal vs reduced. */
const TILE_FLY_DURATION = 300;
const TILE_FLY_REDUCED_DURATION = 180;

/** Ghost-placeholder alpha for a tile whose letter has been used up. */
const TILE_GHOST_ALPHA = 0.25;

/** Thunk scale for a duplicate-letter tile reused mid-word, normal vs reduced. */
const TILE_THUNK_SCALE = 1.12;
const TILE_THUNK_REDUCED_SCALE = 1.06;

/** Thunk tween duration (ms), normal vs reduced motion. */
const TILE_THUNK_DURATION = 120;
const TILE_THUNK_REDUCED_DURATION = 80;

/** How long a finished word lingers before the next word (ms). */
const WORD_LINGER_DELAY = 1200;

/**
 * Build the Word scene — a picture is shown and its word is spoken aloud, and
 * the child spells the word by tapping letter tiles in order into word slots.
 * Correct letters settle into the next empty slot; wrong tiles wiggle gently
 * (no-fail). Three words win the game: shared celebration + sticker on first
 * completion.
 */
export class WordBuilderScene extends GameSceneBase {
  private readonly slotXs: number[] = [];
  private readonly tileRects: Phaser.GameObjects.Rectangle[] = [];
  private readonly tileLetterImages: Phaser.GameObjects.Image[] = [];
  private readonly tileLetterValues: string[] = [];
  private readonly slotImages: Array<Phaser.GameObjects.Image | null> = [];
  private readonly roundObjects: Phaser.GameObjects.GameObject[] = [];
  private words: FirstWord[] = [];
  private wordIndex = 0;
  private filledSlots = 0;

  constructor() {
    super("WordBuilder");
  }

  create(): void {
    sceneEntrance(this);
    this.createCornerMascot();
    this.createBackButton();
    this.createProgressDots(WORD_COUNT);

    // "Hear it again" — re-speaks the current target word on demand.
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;
    this.speaker = new SpeakerButton(
      this,
      centerX + PICTURE_SIZE / 2 + this.SPEAKER_OFFSET,
      centerY + PICTURE_Y_OFFSET,
      {
        onSpeak: () => {
          const word = this.words[this.wordIndex];
          if (!word) return; // Celebration after the final word — nothing to speak.
          speakWord(word.word, load().settings.sfxEnabled);
        },
      },
    );

    this.words = generateWordBuildPlaythrough(WORD_COUNT);
    this.wordIndex = 0;
    this.inputLocked = false;
    this.renderRound();

    this.registerShutdownCleanup();
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
        .setStrokeStyle(this.OUTLINE_WIDTH, this.OUTLINE_COLOR, 1);
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
        .setStrokeStyle(this.OUTLINE_WIDTH, this.OUTLINE_COLOR, 1);
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
      this.recordWrong();
      this.mascot?.nod();
      const reduced = isReducedMotion();
      this.tweens.add({
        targets: [this.tileRects[tileIndex], this.tileLetterImages[tileIndex]],
        angle: reduced ? this.WIGGLE_REDUCED_ANGLE : this.WIGGLE_ANGLE,
        duration: motionDuration(this.WIGGLE_DURATION, this.WIGGLE_REDUCED_DURATION),
        yoyo: true,
        repeat: this.WIGGLE_REPEATS,
        ease: "Sine.inOut",
      });
      return;
    }

    // Correct: soft tick, then fly the tapped letter into the slot.
    this.audioManager.playPop();
    const slotX = this.slotXs[this.filledSlots];
    const slotY = this.cameras.main.centerY + SLOT_Y_OFFSET;
    const tileRect = this.tileRects[tileIndex];
    const tileLetter = this.tileLetterImages[tileIndex];
    // A letter that still appears later in the word (e.g. BALL's single L)
    // needs its tile for a second tap: place a fresh copy with the settle pop
    // and thunk the tile. Otherwise the tile's letter flies into the slot and
    // the tile becomes a ghosted placeholder that no longer looks tappable.
    const stillNeeded = word.word.slice(this.filledSlots + 1).includes(chosen);

    if (stillNeeded) {
      // Size the placed letter purely via display size. Calling setScale after
      // setDisplaySize would overwrite the scale factor (80/512) with the pop
      // scale and render the letter at the full 512px texture size, overflowing
      // the slot — so the settle pop tweens displayWidth/displayHeight instead.
      const copy = this.add
        .image(slotX, slotY, `letter_${chosen.toLowerCase()}`)
        .setDisplaySize(
          LETTER_SIZE * motionScale(SLOT_POP_SCALE, SLOT_POP_REDUCED_SCALE),
          LETTER_SIZE * motionScale(SLOT_POP_SCALE, SLOT_POP_REDUCED_SCALE),
        );
      this.tweens.add({
        targets: copy,
        displayWidth: LETTER_SIZE,
        displayHeight: LETTER_SIZE,
        duration: motionDuration(SLOT_POP_DURATION, SLOT_POP_REDUCED_DURATION),
        ease: "Back.out",
      });
      this.slotImages[this.filledSlots] = copy;
      this.roundObjects.push(copy);
      // Acknowledge the reuse so the child knows the tap registered.
      this.tweens.add({
        targets: tileRect,
        scaleX: motionScale(TILE_THUNK_SCALE, TILE_THUNK_REDUCED_SCALE),
        scaleY: motionScale(TILE_THUNK_SCALE, TILE_THUNK_REDUCED_SCALE),
        duration: motionDuration(TILE_THUNK_DURATION, TILE_THUNK_REDUCED_DURATION),
        ease: "Sine.out",
        yoyo: true,
      });
    } else {
      // Last use: the letter itself flies into the slot and the tile becomes
      // an empty ghost placeholder.
      this.tweens.add({
        targets: tileLetter,
        x: slotX,
        y: slotY,
        duration: motionDuration(TILE_FLY_DURATION, TILE_FLY_REDUCED_DURATION),
        ease: "Sine.out",
      });
      this.slotImages[this.filledSlots] = tileLetter;
      tileRect.setAlpha(TILE_GHOST_ALPHA);
      tileRect.disableInteractive();
      this.tileLetterValues[tileIndex] = "";
    }
    this.filledSlots += 1;

    if (this.filledSlots === word.word.length) {
      // Word fully spelled: chime + cheer, pop the dot, linger, then advance.
      this.inputLocked = true;
      this.audioManager.playCorrect();
      this.recordCorrect();
      this.mascot?.cheer();
      this.fillProgressDot(this.wordIndex);
      this.time.delayedCall(WORD_LINGER_DELAY, () => {
        this.wordIndex += 1;
        if (this.wordIndex < this.words.length) {
          this.inputLocked = false;
          this.renderRound();
        } else {
          this.completeGame("word-builder");
        }
      });
    }
  }
}
