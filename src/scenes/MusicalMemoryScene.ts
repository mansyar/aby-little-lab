import Phaser from "phaser";
import { AudioManager } from "../audio/AudioManager";
import { ParentLock } from "../components/ParentLock";
import {
  appendNote,
  FROG_COUNT,
  generateSequence,
  isRoundComplete,
  isWin,
  START_LENGTH,
  validateInput,
  WIN_TARGET,
} from "../game/musicalMemoryLogic";
import { createWinCelebration } from "../utils/completionEffect";
import { motionDuration, motionScale } from "../utils/motion";
import { attachPressFeedback } from "../utils/pressFeedback";
import { sceneEntrance, transitionToScene } from "../utils/sceneTransitions";
import { earnSticker, hasSticker } from "../utils/storage";

/** Frog texture keys in index order (0=green, 1=blue, 2=red). */
const FROG_TEXTURES = ["frog_green", "frog_blue", "frog_red"];

/** Frog note frequencies: C4=261.63Hz, E4=329.63Hz, G4=392.00Hz. */
const FROG_FREQUENCIES = [261.63, 329.63, 392.0];

/** Display size for frogs (exceeds 64px minimum, meets 96px ideal). */
const FROG_SIZE = 128;

/** Display size for lily pads beneath each frog. */
const LILYPAD_SIZE = 160;

/** Delay between notes during sequence playback (ms). */
const NOTE_DELAY = 600;

/** Original SVG texture size (used for scale calculations). */
const SVG_SIZE = 512;

/** Scale factor for frog bounce animation (relative to display size). */
const BOUNCE_SCALE = (FROG_SIZE / SVG_SIZE) * 1.2;

/** Scale factor for the frog bounce under reduced motion (relative to display size). */
const BOUNCE_REDUCED_SCALE = (FROG_SIZE / SVG_SIZE) * 1.05;

/** Duration of frog bounce animation (ms). */
const BOUNCE_DURATION = 200;

/** Duration of the frog bounce under reduced motion (ms). */
const BOUNCE_REDUCED_DURATION = 120;

/** Number of progress dots (one per round: lengths 2→6). */
const PROGRESS_DOT_COUNT = 5;

/** Y position of progress dots from top of screen. */
const PROGRESS_DOT_Y = 60;

/** Spacing between progress dots (px). */
const PROGRESS_DOT_SPACING = 40;

/** Radius of progress dots (px). */
const PROGRESS_DOT_RADIUS = 8;

/** Auto-return delay to Hub after completion (ms). */
const AUTO_RETURN_DELAY = 3000;

/** Display size of the sticker image in the unlock animation. */
const STICKER_DISPLAY_SIZE = 256;

/** Target scale for the sticker image (display size / texture size). */
const STICKER_SCALE = STICKER_DISPLAY_SIZE / SVG_SIZE;

/** Duration of sticker reveal animation (ms). */
const WIN_TWEEN_DURATION = 300;

/**
 * Musical Memory scene — toddler repeats growing note sequences tapped on
 * 3 frogs (C4/E4/G4). Sequence auto-plays at round start (input locked);
 * child taps frogs to repeat. Wrong taps replay the sequence (no-fail).
 * A replay button lets the child re-listen on demand.
 */
export class MusicalMemoryScene extends Phaser.Scene {
  private parentLock?: ParentLock;
  private readonly audioManager: AudioManager;
  private readonly frogs: Phaser.GameObjects.Image[] = [];
  private sequence: number[] = [];
  private inputIndex = 0;
  private inputLocked = true;
  private readonly progressDots: Phaser.GameObjects.Arc[] = [];
  private roundCount = 0;

  constructor() {
    super({ key: "MusicalMemory" });
    this.audioManager = AudioManager.getInstance();
  }

  create(): void {
    sceneEntrance(this);

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

    this.createFrogs();
    this.createReplayButton();
    this.createProgressDots();

    this.sequence = generateSequence(START_LENGTH);
    this.inputIndex = 0;
    this.playSequence();

    this.events.on("shutdown", () => {
      this.parentLock?.destroy();
    });
  }

  /** Creates 3 frogs on lily pads, evenly spaced across the screen. */
  private createFrogs(): void {
    const centerX = this.cameras.main.centerX;
    const frogY = this.cameras.main.centerY;
    const spacing = 250;

    for (let i = 0; i < FROG_COUNT; i++) {
      const x = centerX + (i - 1) * spacing;
      this.add.image(x, frogY + 30, "lilypad").setDisplaySize(LILYPAD_SIZE, LILYPAD_SIZE);
      const frog = this.add.image(x, frogY, FROG_TEXTURES[i]);
      frog.setDisplaySize(FROG_SIZE, FROG_SIZE);
      frog.setInteractive();
      frog.on("pointerdown", () => this.handleFrogTap(i));
      this.frogs.push(frog);
    }
  }

  /** Creates the replay button at the bottom of the screen. */
  private createReplayButton(): void {
    const replayButton = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.height - 80,
      "\uD83D\uDD04",
      { fontSize: "48px", color: "#2d3748" },
    );
    replayButton.setOrigin(0.5);
    replayButton.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(0, 0, 96, 96),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    });
    replayButton.on("pointerdown", () => this.handleReplay());
    attachPressFeedback(replayButton);
  }

  /** Creates 5 progress dots at the top of the screen, dimmed by default. */
  private createProgressDots(): void {
    const startX =
      this.cameras.main.centerX - ((PROGRESS_DOT_COUNT - 1) * PROGRESS_DOT_SPACING) / 2;
    for (let i = 0; i < PROGRESS_DOT_COUNT; i++) {
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
   * Auto-plays the current sequence: each frog scales up + plays its note
   * in sequence order with a timed delay between notes. Input is locked
   * during playback and unlocked after the last note.
   */
  private playSequence(): void {
    this.inputLocked = true;
    for (let i = 0; i < this.sequence.length; i++) {
      const frogIndex = this.sequence[i];
      this.time.delayedCall(i * NOTE_DELAY, () => {
        this.animateFrog(frogIndex);
      });
    }
    this.time.delayedCall(this.sequence.length * NOTE_DELAY, () => {
      this.inputLocked = false;
    });
  }

  /** Plays a frog's note and triggers a scale-up bounce animation. */
  private animateFrog(frogIndex: number): void {
    const frog = this.frogs[frogIndex];
    if (!frog) return;
    this.audioManager.playFrogNote(FROG_FREQUENCIES[frogIndex]);
    this.tweens.add({
      targets: frog,
      scaleX: motionScale(BOUNCE_SCALE, BOUNCE_REDUCED_SCALE),
      scaleY: motionScale(BOUNCE_SCALE, BOUNCE_REDUCED_SCALE),
      duration: motionDuration(BOUNCE_DURATION, BOUNCE_REDUCED_DURATION),
      yoyo: true,
    });
  }

  /**
   * Handles a child's tap on a frog. If input is locked (during playback
   * or replay), the tap is ignored. Otherwise, the frog's note plays,
   * the input is validated, and correct/wrong handling follows.
   */
  private handleFrogTap(frogIndex: number): void {
    if (this.inputLocked) return;

    this.animateFrog(frogIndex);

    const result = validateInput(this.sequence, this.inputIndex, frogIndex);
    if (result.correct) {
      this.inputIndex = result.nextIndex;
      if (isRoundComplete(this.sequence, this.inputIndex)) {
        this.handleRoundSuccess();
      }
    } else {
      this.inputIndex = result.nextIndex;
      this.audioManager.playIncorrect();
      this.playSequence();
    }
  }

  /**
   * Handles round success: fills the next progress dot, then either triggers
   * completion (if the sequence reached WIN_TARGET) or grows the sequence by
   * one note and auto-plays the next round.
   */
  private handleRoundSuccess(): void {
    this.audioManager.playCorrect();

    if (this.roundCount < this.progressDots.length) {
      this.progressDots[this.roundCount].setAlpha(1);
    }
    this.roundCount++;

    if (isWin(this.sequence.length, WIN_TARGET)) {
      this.handleComplete();
    } else {
      this.sequence = appendNote(this.sequence);
      this.inputIndex = 0;
      this.playSequence();
    }
  }

  /**
   * Handles game completion: plays win SFX, animates all frogs, awards a
   * sticker on first completion, and auto-returns to Hub after 3s.
   */
  private handleComplete(): void {
    this.inputLocked = true;
    this.audioManager.playWin();
    createWinCelebration(this, this.cameras.main.centerX, this.cameras.main.centerY);

    if (!hasSticker("musical-memory")) {
      earnSticker("musical-memory");
      this.audioManager.playSticker();
      this.createStickerAnimation();
    }

    this.time.delayedCall(AUTO_RETURN_DELAY, () => {
      transitionToScene(this, "Hub");
    });
  }

  /** Shows a sticker unlock animation at the center of the screen. */
  private createStickerAnimation(): void {
    const stickerImage = this.add
      .image(this.cameras.main.centerX, this.cameras.main.centerY, "sticker_musical_memory")
      .setScale(0);

    this.tweens.add({
      targets: stickerImage,
      scaleX: STICKER_SCALE,
      scaleY: STICKER_SCALE,
      duration: motionDuration(WIN_TWEEN_DURATION, 180),
      ease: "Back.out",
    });
  }

  /** Handles a tap on the replay button: re-plays the current sequence. */
  private handleReplay(): void {
    if (this.inputLocked) return;
    this.playSequence();
  }
}
