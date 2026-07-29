import Phaser from "phaser";
import { AudioManager } from "../audio/AudioManager";
import { ParentLock } from "../components/ParentLock";
import {
  FROG_COUNT,
  generateSequence,
  isRoundComplete,
  START_LENGTH,
  validateInput,
} from "../game/musicalMemoryLogic";

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

/** Duration of frog bounce animation (ms). */
const BOUNCE_DURATION = 200;

/**
 * Musical Memory scene — toddler repeats growing note sequences tapped on
 * 3 frogs (C4/E4/G4). Sequence auto-plays at round start (input locked);
 * child taps frogs to repeat. Wrong taps replay the sequence (no-fail).
 * A replay button lets the child re-listen on demand.
 */
export class MusicalMemoryScene extends Phaser.Scene {
  private parentLock?: ParentLock;
  private readonly audioManager: AudioManager;
  private frogs: Phaser.GameObjects.Image[] = [];
  private sequence: number[] = [];
  private inputIndex = 0;
  private inputLocked = true;

  constructor() {
    super({ key: "MusicalMemory" });
    this.audioManager = AudioManager.getInstance();
  }

  create(): void {
    const backButton = this.add.text(20, 20, "← Back", {
      fontSize: "24px",
      color: "#2d3748",
    });
    backButton.setInteractive();

    this.parentLock = new ParentLock({
      scene: this,
      target: backButton,
      onSuccess: () => {
        this.scene.start("Hub");
      },
      onFailure: () => {
        // No action needed on failure.
      },
    });

    this.createFrogs();
    this.createReplayButton();

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
      "\uD83D\uDD04 Replay",
      { fontSize: "32px", color: "#2d3748" },
    );
    replayButton.setOrigin(0.5);
    replayButton.setInteractive();
    replayButton.on("pointerdown", () => this.handleReplay());
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
      scaleX: BOUNCE_SCALE,
      scaleY: BOUNCE_SCALE,
      duration: BOUNCE_DURATION,
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
   * Handles round success. In Phase 3, plays the correct SFX.
   * Phase 4 will extend this to fill progress dots, grow the sequence,
   * check for win, and auto-play the next round.
   */
  private handleRoundSuccess(): void {
    this.audioManager.playCorrect();
  }

  /** Handles a tap on the replay button: re-plays the current sequence. */
  private handleReplay(): void {
    if (this.inputLocked) return;
    this.playSequence();
  }
}
