import Phaser from "phaser";
import { AudioManager } from "../audio/AudioManager";
import { createCornerMascot, type Mascot } from "../components/Mascot";
import { ParentLock } from "../components/ParentLock";
import { SpeakerButton } from "../components/SpeakerButton";
import {
  type FirstWord,
  generateLetterTiles,
  generateWordBuildPlaythrough,
} from "../game/wordLogic";
import { createWinCelebration } from "../utils/completionEffect";
import { isReducedMotion, motionDuration, motionScale } from "../utils/motion";
import { attachPressFeedback } from "../utils/pressFeedback";
import { sceneEntrance, transitionToScene } from "../utils/sceneTransitions";
import { speakWord } from "../utils/speech";
import { earnSticker, hasSticker, load } from "../utils/storage";
import { textStyle } from "../utils/typography";

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

/** Horizontal gap between the prompt picture and the replay button (px). */
const SPEAKER_OFFSET = 70;

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

/** How long a finished word lingers before the next word (ms). */
const WORD_LINGER_DELAY = 1200;

/** How long the win state lingers before auto-returning to the Hub (ms). */
const AUTO_RETURN_DELAY = 3000;

/** Progress dot pop scale, normal vs reduced motion. */
const DOT_POP_SCALE = 1.4;
const DOT_POP_REDUCED_SCALE = 1.2;

/** Progress dot pop durations (ms), normal vs reduced motion. */
const DOT_POP_DURATION = 250;
const DOT_POP_REDUCED_DURATION = 150;

/** Source SVG size and display size for the sticker reveal (256px from 512). */
const SVG_SIZE = 512;
const STICKER_DISPLAY_SIZE = 256;
const STICKER_SCALE = STICKER_DISPLAY_SIZE / SVG_SIZE;

/** Win/sticker reveal tween duration (ms). */
const WIN_TWEEN_DURATION = 300;

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
  private speaker?: SpeakerButton;
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

    const backButton = this.add.text(
      20,
      20,
      "← Back",
      textStyle({
        fontSize: "24px",
        color: "#2d3748",
      }),
    );
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

    // "Hear it again" — re-speaks the current target word on demand.
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;
    this.speaker = new SpeakerButton(
      this,
      centerX + PICTURE_SIZE / 2 + SPEAKER_OFFSET,
      centerY + PICTURE_Y_OFFSET,
      {
        onSpeak: () => {
          const word = this.words[this.wordIndex];
          speakWord(word.word, load().settings.sfxEnabled);
        },
      },
    );

    this.words = generateWordBuildPlaythrough(WORD_COUNT);
    this.wordIndex = 0;
    this.inputLocked = false;
    this.renderRound();

    this.events.on("shutdown", () => {
      this.parentLock?.destroy();
      this.mascot?.destroy();
      this.mascot = undefined;
      this.speaker?.destroy();
      this.speaker = undefined;
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
    // Size the placed letter purely via display size. Calling setScale after
    // setDisplaySize would overwrite the scale factor (80/512) with the pop
    // scale and render the letter at the full 512px texture size, overflowing
    // the slot — so the settle pop tweens displayWidth/displayHeight instead.
    const letterImage = this.add
      .image(slotX, slotY, `letter_${chosen.toLowerCase()}`)
      .setDisplaySize(LETTER_SIZE * SLOT_POP_SCALE, LETTER_SIZE * SLOT_POP_SCALE);
    this.tweens.add({
      targets: letterImage,
      displayWidth: LETTER_SIZE,
      displayHeight: LETTER_SIZE,
      duration: SLOT_POP_DURATION,
      ease: "Back.out",
    });
    this.slotImages[this.filledSlots] = letterImage;
    this.roundObjects.push(letterImage);
    this.filledSlots += 1;

    if (this.filledSlots === word.word.length) {
      // Word fully spelled: chime + cheer, pop the dot, linger, then advance.
      this.inputLocked = true;
      this.audioManager.playCorrect();
      this.mascot?.cheer();
      this.fillProgressDot();
      this.time.delayedCall(WORD_LINGER_DELAY, () => {
        this.wordIndex += 1;
        if (this.wordIndex < this.words.length) {
          this.inputLocked = false;
          this.renderRound();
        } else {
          this.handleComplete();
        }
      });
    }
  }

  /** Pops the progress dot for the just-finished word. */
  private fillProgressDot(): void {
    const dot = this.progressDots[this.wordIndex];
    dot.setAlpha(1);
    const reduced = isReducedMotion();
    this.tweens.add({
      targets: dot,
      scale: motionScale(DOT_POP_SCALE, DOT_POP_REDUCED_SCALE),
      duration: motionDuration(DOT_POP_DURATION, DOT_POP_REDUCED_DURATION),
      ease: "Back.out",
      yoyo: true,
    });
  }

  /**
   * Playthrough complete: win SFX + shared celebration, sticker on first
   * completion, auto-return to the Hub with `justEarned`.
   */
  private handleComplete(): void {
    this.inputLocked = true;
    this.audioManager.playWin();
    this.mascot?.cheer(true);

    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;
    createWinCelebration(this, centerX, centerY);

    const earnedNow = !hasSticker("word-builder");
    if (earnedNow) {
      earnSticker("word-builder");
      this.audioManager.playSticker();
      this.createStickerAnimation();
    }

    this.time.delayedCall(AUTO_RETURN_DELAY, () => {
      transitionToScene(this, "Hub", earnedNow ? { justEarned: "word-builder" } : undefined);
    });
  }

  /** Reveals the word-builder sticker with a scale-in tween. */
  private createStickerAnimation(): void {
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;
    const sticker = this.add.image(centerX, centerY, "sticker_word_builder").setScale(0);
    this.tweens.add({
      targets: sticker,
      scaleX: STICKER_SCALE,
      scaleY: STICKER_SCALE,
      duration: motionDuration(WIN_TWEEN_DURATION, 180),
      delay: motionDuration(400, 250),
      ease: "Back.out",
    });
  }
}
