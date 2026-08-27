import type Phaser from "phaser";
import { SpeakerButton } from "../components/SpeakerButton";
import {
  appendNote,
  FROG_COUNT,
  generateSequence,
  isRoundComplete,
  isWin,
  startLengthFor,
  validateInput,
  WIN_TARGET,
  winLengthFor,
} from "../game/musicalMemoryLogic";
import { isReducedMotion, motionDuration, motionScale } from "../utils/motion";
import { attachPressFeedback } from "../utils/pressFeedback";
import { sceneEntrance } from "../utils/sceneTransitions";
import { getAdaptiveBandShift } from "../utils/storage";
import { GameSceneBase } from "./GameSceneBase";

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

/** Faster note delay once sequences grow long enough to feel sluggish (ms). */
const FAST_NOTE_DELAY = 480;

/** Sequences of this length or longer play at the faster note delay. */
const FAST_NOTE_DELAY_LENGTH = 5;

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

/**
 * Musical Memory scene — toddler repeats growing note sequences tapped on
 * 3 frogs (C4/E4/G4). Sequence auto-plays at round start (input locked);
 * child taps frogs to repeat. Wrong taps replay the sequence (no-fail).
 * A replay button lets the child re-listen on demand.
 */
export class MusicalMemoryScene extends GameSceneBase {
  private readonly frogs: Phaser.GameObjects.Image[] = [];
  private readonly lilypads: Array<{ pad: Phaser.GameObjects.Image; y: number }> = [];
  private sequence: number[] = [];
  private inputIndex = 0;
  private roundCount = 0;
  /** Win length for the current playthrough; classic default until create() adapts it. */
  private winTarget = WIN_TARGET;
  /** Guards overlapping sequence playbacks so a stale completion cannot clear the speaker. */
  private sequencePlayId = 0;

  constructor() {
    super("MusicalMemory");
  }

  create(): void {
    sceneEntrance(this);
    this.createCornerMascot();
    this.createBackButton();

    this.createFrogs();
    this.createReplayButton();
    this.createProgressDots(PROGRESS_DOT_COUNT);

    const startLength = startLengthFor(getAdaptiveBandShift("musical-memory"));
    this.winTarget = winLengthFor(startLength);
    this.sequence = generateSequence(startLength);
    this.inputIndex = 0;
    this.playSequence();

    this.registerShutdownCleanup();
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
      attachPressFeedback(frog);
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

  /**
   * Auto-plays the current sequence: each frog scales up + plays its note
   * in sequence order with a timed delay between notes. Input is locked
   * during playback and unlocked after the last note.
   */
  private playSequence(): void {
    this.inputLocked = true;
    this.sequencePlayId++;
    const id = this.sequencePlayId;
    // The speaker glyph mirrors the audible playback (active while playing).
    this.speaker?.setActive(true);
    // Long sequences play faster so later rounds don't drag.
    const delay = this.sequence.length >= FAST_NOTE_DELAY_LENGTH ? FAST_NOTE_DELAY : NOTE_DELAY;
    for (let i = 0; i < this.sequence.length; i++) {
      const frogIndex = this.sequence[i];
      this.time.delayedCall(i * delay, () => {
        this.animateFrog(frogIndex);
      });
    }
    this.time.delayedCall(this.sequence.length * delay, () => {
      if (this.sequencePlayId === id) {
        this.speaker?.setActive(false);
        this.inputLocked = false;
      }
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
      this.recordWrong();
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
    this.recordCorrect();
    this.mascot?.cheer();

    if (this.roundCount < this.progressDots.length) {
      this.fillProgressDot(this.roundCount);
    }
    this.roundCount++;

    if (isWin(this.sequence.length, this.winTarget)) {
      this.completeGame("musical-memory");
    } else {
      this.sequence = appendNote(this.sequence);
      this.inputIndex = 0;
      this.playSequence();
    }
  }

  /** Handles a tap on the replay button: re-plays the current sequence. */
  private handleReplay(): void {
    if (this.inputLocked) return;
    // A re-listen restarts the pattern, so input must start at the first note.
    this.inputIndex = 0;
    this.playSequence();
  }
}
