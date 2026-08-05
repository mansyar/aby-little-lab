import Phaser from "phaser";
import { AudioManager } from "../audio/AudioManager";
import { createCornerMascot, type Mascot } from "../components/Mascot";
import { ParentLock } from "../components/ParentLock";
import { SpeakerButton } from "../components/SpeakerButton";
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
import { isReducedMotion, motionDuration, motionScale } from "../utils/motion";
import { attachPressFeedback } from "../utils/pressFeedback";
import { sceneEntrance, transitionToScene } from "../utils/sceneTransitions";
import { earnSticker, hasSticker } from "../utils/storage";
import { textStyle } from "../utils/typography";

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

/** Ripple ring radius (px). */
const RIPPLE_RADIUS = 40;

/** Ripple ring stroke width (px). */
const RIPPLE_WIDTH = 3;

/** Ripple ring color. */
const RIPPLE_COLOR = 0x4fd1c5;

/** Ripple ring alpha. */
const RIPPLE_ALPHA = 0.8;

/** Ripple ring fade-out duration (ms). */
const RIPPLE_DURATION = 400;

/** Reduced-motion ripple ring duration (ms). */
const RIPPLE_REDUCED_DURATION = 240;

/** Ripple ring growth while fading. */
const RIPPLE_GROW_SCALE = 1.6;

/** Reduced-motion ripple ring growth. */
const RIPPLE_GROW_REDUCED_SCALE = 1.3;

/** Lily pad vertical drift amount (px). */
const DRIFT_AMOUNT = 3;

/** Lily pad drift duration per phase (3s full loop = 2 phases). */
const DRIFT_DURATION = 1500;

/** Progress dot pop peak scale. */
const DOT_POP_SCALE = 1.4;

/** Reduced-motion progress dot pop peak scale. */
const DOT_POP_REDUCED_SCALE = 1.2;

/** Progress dot pop duration (ms). */
const DOT_POP_DURATION = 250;

/** Reduced-motion progress dot pop duration (ms). */
const DOT_POP_REDUCED_DURATION = 150;

/**
 * Musical Memory scene — toddler repeats growing note sequences tapped on
 * 3 frogs (C4/E4/G4). Sequence auto-plays at round start (input locked);
 * child taps frogs to repeat. Wrong taps replay the sequence (no-fail).
 * A replay button lets the child re-listen on demand.
 */
export class MusicalMemoryScene extends Phaser.Scene {
  private parentLock?: ParentLock;
  private mascot?: Mascot;
  private speaker?: SpeakerButton;
  private readonly audioManager: AudioManager;
  private readonly frogs: Phaser.GameObjects.Image[] = [];
  private readonly lilypads: Array<{ pad: Phaser.GameObjects.Image; y: number }> = [];
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
    this.mascot = createCornerMascot(this);

    const backButton = this.add.text(20, 20, "← Back", textStyle({
      fontSize: "24px",
      color: "#2d3748",
    }));
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
      this.mascot?.destroy();
      this.mascot = undefined;
      this.speaker?.destroy();
      this.speaker = undefined;
    });
  }

  /** Creates 3 frogs on lily pads, evenly spaced across the screen. */
  private createFrogs(): void {
    const centerX = this.cameras.main.centerX;
    const frogY = this.cameras.main.centerY;
    const spacing = 250;

    for (let i = 0; i < FROG_COUNT; i++) {
      const x = centerX + (i - 1) * spacing;
      const padY = frogY + 30;
      const pad = this.add.image(x, padY, "lilypad").setDisplaySize(LILYPAD_SIZE, LILYPAD_SIZE);
      this.lilypads.push({ pad, y: padY });
      const frog = this.add.image(x, frogY, FROG_TEXTURES[i]);
      frog.setDisplaySize(FROG_SIZE, FROG_SIZE);
      frog.setInteractive();
      frog.on("pointerdown", () => this.handleFrogTap(i));
      this.frogs.push(frog);
    }

    this.driftLilypads();
  }

  /** Starts a gentle vertical drift loop on all lily pads (skipped under reduced motion). */
  private driftLilypads(): void {
    if (isReducedMotion()) return;
    for (const entry of this.lilypads) {
      this.tweens.add({
        targets: entry.pad,
        y: entry.y + DRIFT_AMOUNT,
        duration: DRIFT_DURATION,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      });
    }
  }

  /** Creates the replay button at the bottom of the screen (textless speaker glyph). */
  private createReplayButton(): void {
    this.speaker = new SpeakerButton(
      this,
      this.cameras.main.centerX,
      this.cameras.main.height - 80,
      { onSpeak: () => this.handleReplay() },
    );
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

  /** Plays a frog's note, emits a ripple ring, and triggers a scale-up bounce animation. */
  private animateFrog(frogIndex: number): void {
    const frog = this.frogs[frogIndex];
    if (!frog) return;
    this.audioManager.playFrogNote(FROG_FREQUENCIES[frogIndex]);
    this.emitRipple(frog);
    this.tweens.add({
      targets: frog,
      scaleX: motionScale(BOUNCE_SCALE, BOUNCE_REDUCED_SCALE),
      scaleY: motionScale(BOUNCE_SCALE, BOUNCE_REDUCED_SCALE),
      duration: motionDuration(BOUNCE_DURATION, BOUNCE_REDUCED_DURATION),
      yoyo: true,
    });
  }

  /** Emits an expanding ripple ring around the frog (self-cleaning). */
  private emitRipple(frog: Phaser.GameObjects.Image): void {
    const ripple = this.add.graphics();
    ripple.setPosition(frog.x, frog.y);
    ripple.lineStyle(RIPPLE_WIDTH, RIPPLE_COLOR, RIPPLE_ALPHA);
    ripple.strokeCircle(0, 0, RIPPLE_RADIUS);

    this.tweens.add({
      targets: ripple,
      alpha: 0,
      scaleX: motionScale(RIPPLE_GROW_SCALE, RIPPLE_GROW_REDUCED_SCALE),
      scaleY: motionScale(RIPPLE_GROW_SCALE, RIPPLE_GROW_REDUCED_SCALE),
      duration: motionDuration(RIPPLE_DURATION, RIPPLE_REDUCED_DURATION),
      ease: "Sine.out",
      onComplete: () => {
        ripple.destroy();
      },
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
      this.mascot?.nod();
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
    this.mascot?.cheer();

    if (this.roundCount < this.progressDots.length) {
      const dot = this.progressDots[this.roundCount];
      dot.setAlpha(1);
      this.tweens.add({
        targets: dot,
        scaleX: motionScale(DOT_POP_SCALE, DOT_POP_REDUCED_SCALE),
        scaleY: motionScale(DOT_POP_SCALE, DOT_POP_REDUCED_SCALE),
        duration: motionDuration(DOT_POP_DURATION, DOT_POP_REDUCED_DURATION),
        ease: "Back.out",
        yoyo: true,
      });
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
    this.mascot?.cheer(true);
    createWinCelebration(this, this.cameras.main.centerX, this.cameras.main.centerY);

    const earnedNow = !hasSticker("musical-memory");
    if (earnedNow) {
      earnSticker("musical-memory");
      this.audioManager.playSticker();
      this.createStickerAnimation();
    }

    this.time.delayedCall(AUTO_RETURN_DELAY, () => {
      transitionToScene(this, "Hub", earnedNow ? { justEarned: "musical-memory" } : undefined);
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
