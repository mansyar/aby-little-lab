import Phaser from "phaser";
import { AudioManager } from "../audio/AudioManager";
import {
  createCornerMascot as createCornerMascotComponent,
  type Mascot,
} from "../components/Mascot";
import { ParentLock } from "../components/ParentLock";
import { SpeakerButton } from "../components/SpeakerButton";
import type { GameId } from "../types";
import { createWinCelebration } from "../utils/completionEffect";
import { motionDuration, motionScale } from "../utils/motion";
import { attachPressFeedback } from "../utils/pressFeedback";
import { transitionToScene } from "../utils/sceneTransitions";
import { speakSentence } from "../utils/speech";
import { earnSticker, getSettings, hasSticker, recordGameResult } from "../utils/storage";
import { displayScale } from "../utils/textureTiers";
import { textStyle } from "../utils/typography";

/**
 * Shared scaffold for all game scenes. Holds the common state every game
 * needs (parental lock, corner mascot, replay speaker, audio manager,
 * progress dots, input lock) and the duplicated win/completion flow:
 * win SFX, mascot big cheer, celebration burst, sticker award + reveal
 * animation, and the 3s auto-return to the Hub.
 *
 * Subclasses keep their per-game mechanics (rounds, cards, drag, scoring)
 * and call the protected helpers from their own `create()` and round
 * handlers.
 */
export abstract class GameSceneBase extends Phaser.Scene {
  protected parentLock?: ParentLock;
  protected mascot?: Mascot;
  protected speaker?: SpeakerButton;

  /** Replay glyph created by {@link createSpokenInstruction}; destroyed on shutdown. */
  private instructionSpeaker?: SpeakerButton;
  protected readonly audioManager: AudioManager;
  protected progressDots: Phaser.GameObjects.Arc[] = [];
  protected inputLocked = false;

  /** Correct taps recorded this session (flushed to progress on completion). */
  private sessionCorrect = 0;

  /** Incorrect taps recorded this session (flushed to progress on completion). */
  private sessionWrong = 0;

  /** Delay before the next round after a correct answer (ms). */
  protected readonly NEXT_ROUND_DELAY: number = 700;

  /** Auto-return delay to Hub after completion (ms). */
  protected readonly AUTO_RETURN_DELAY = 3000;

  /** Wiggle amplitude for an incorrect answer (degrees). */
  protected readonly WIGGLE_ANGLE = 4;

  /** Reduced-motion wiggle amplitude (degrees). */
  protected readonly WIGGLE_REDUCED_ANGLE = 2;

  /** Wiggle swing duration (ms). */
  protected readonly WIGGLE_DURATION = 350;

  /** Reduced-motion wiggle swing duration (ms). */
  protected readonly WIGGLE_REDUCED_DURATION = 200;

  /** Number of yoyo repeats for the incorrect-answer wiggle. */
  protected readonly WIGGLE_REPEATS = 3;

  /** Stroke width of card outlines. */
  protected readonly OUTLINE_WIDTH = 4;

  /** Y position of progress dots from top of screen. */
  protected readonly PROGRESS_DOT_Y: number = 60;

  /** Spacing between progress dots (px). */
  protected readonly PROGRESS_DOT_SPACING: number = 40;

  /** Radius of progress dots (px). */
  protected readonly PROGRESS_DOT_RADIUS: number = 8;

  /** Progress dot pop peak scale. */
  protected readonly DOT_POP_SCALE = 1.4;

  /** Reduced-motion progress dot pop peak scale. */
  protected readonly DOT_POP_REDUCED_SCALE: number = 1.2;

  /** Progress dot pop duration (ms). */
  protected readonly DOT_POP_DURATION: number = 250;

  /** Reduced-motion progress dot pop duration (ms). */
  protected readonly DOT_POP_REDUCED_DURATION: number = 150;

  /** Display size of the sticker image in the unlock animation. */
  protected readonly STICKER_DISPLAY_SIZE = 256;

  /** Duration of sticker reveal animation (ms). */
  protected readonly WIN_TWEEN_DURATION = 300;

  /** Success flash fill color (--success token). */
  protected readonly SUCCESS_COLOR = 0x68d391;

  /** Default white card fill. */
  protected readonly CARD_BG_COLOR = 0xffffff;

  /** Card and dot outline color (--outline token). */
  protected readonly OUTLINE_COLOR = 0x2d3748;

  /** Horizontal gap between the arrow/target and the replay button (px). */
  protected readonly SPEAKER_OFFSET = 70;

  /** Y position of the shared spoken-instruction line (clear of the progress dots). */
  protected readonly INSTRUCTION_Y = 112;

  /** Wrap width of the instruction line, bounding it short of the replay glyph. */
  protected readonly INSTRUCTION_WRAP_WIDTH = 620;

  /** Gap between the instruction line's box edge and the replay glyph (px). */
  protected readonly INSTRUCTION_SPEAKER_GAP = 36;

  constructor(key: string) {
    super({ key });
    this.audioManager = AudioManager.getInstance();
  }

  /**
   * Creates the "← Back" control with a parental hold-to-exit lock and press
   * feedback. The lock's success transitions back to the Hub.
   */
  protected createBackButton(): Phaser.GameObjects.Text {
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
    return backButton;
  }

  /** Places Professor Hoot in the bottom-right corner and stores the instance. */
  protected createCornerMascot(): Mascot {
    this.mascot = createCornerMascotComponent(this);
    this.mascot.curious();
    return this.mascot;
  }

  /**
   * Narrates the game's rule for pre-readers: a one-line instruction plus a
   * speaker glyph that replays it.
   *
   * The line is spoken once here, when the round is set up, and the glyph
   * replays it on tap. Both go through {@link speakSentence}, which re-reads
   * the SFX toggle on every call, so a mid-session change is honoured. Call
   * from `create()` (outside any per-round teardown) and before
   * `registerShutdownCleanup()` so the glyph's speech subscription is released
   * on shutdown.
   *
   * @param text - The instruction sentence to show and speak.
   * @param options - Optional centre overrides for games whose art needs the
   *   line elsewhere; the glyph follows the line horizontally.
   * @returns The instruction text object.
   */
  protected createSpokenInstruction(
    text: string,
    options: { x?: number; y?: number } = {},
  ): Phaser.GameObjects.Text {
    const centerX = options.x ?? this.cameras.main.centerX;
    const y = options.y ?? this.INSTRUCTION_Y;
    const label = this.add
      .text(
        centerX,
        y,
        text,
        textStyle({
          fontSize: "26px",
          color: "#2d3748",
          align: "center",
          wordWrap: { width: this.INSTRUCTION_WRAP_WIDTH },
        }),
      )
      .setOrigin(0.5);

    // Scene instances are reused across visits: drop any glyph from the
    // previous visit before wiring a fresh one.
    this.instructionSpeaker?.destroy();
    this.instructionSpeaker = new SpeakerButton(
      this,
      centerX + this.INSTRUCTION_WRAP_WIDTH / 2 + this.INSTRUCTION_SPEAKER_GAP,
      y,
      {
        muted: !getSettings().sfxEnabled,
        onSpeak: () => {
          speakSentence(text, getSettings().sfxEnabled);
        },
      },
    );
    speakSentence(text, getSettings().sfxEnabled);

    return label;
  }

  /** Creates `count` progress dots at the top of the screen, dimmed by default. */
  protected createProgressDots(count: number): void {
    const startX = this.cameras.main.centerX - ((count - 1) * this.PROGRESS_DOT_SPACING) / 2;
    for (let i = 0; i < count; i++) {
      const dot = this.add.circle(
        startX + i * this.PROGRESS_DOT_SPACING,
        this.PROGRESS_DOT_Y,
        this.PROGRESS_DOT_RADIUS,
        this.OUTLINE_COLOR,
        0.3,
      );
      this.progressDots.push(dot);
    }
  }

  /** Fills the progress dot at `index` with a pop. */
  protected fillProgressDot(index: number): void {
    const dot = this.progressDots[index];
    dot.setAlpha(1);
    this.tweens.add({
      targets: dot,
      scaleX: motionScale(this.DOT_POP_SCALE, this.DOT_POP_REDUCED_SCALE),
      scaleY: motionScale(this.DOT_POP_SCALE, this.DOT_POP_REDUCED_SCALE),
      duration: motionDuration(this.DOT_POP_DURATION, this.DOT_POP_REDUCED_DURATION),
      ease: "Back.out",
      yoyo: true,
    });
  }

  /** Records a correct answer for the active profile's learning progress. */
  protected recordCorrect(): void {
    this.sessionCorrect += 1;
  }

  /** Records an incorrect answer for the active profile's learning progress. */
  protected recordWrong(): void {
    this.sessionWrong += 1;
  }

  /**
   * Handles game completion: plays the win SFX, runs the shared celebration,
   * awards the sticker on first completion, and auto-returns to the Hub after
   * the auto-return delay, carrying `justEarned` when a sticker was earned.
   */
  protected completeGame(gameId: GameId): void {
    this.inputLocked = true;
    recordGameResult(gameId, this.sessionCorrect, this.sessionWrong);
    this.sessionCorrect = 0;
    this.sessionWrong = 0;
    this.audioManager.playWin();
    this.mascot?.cheer(true);
    createWinCelebration(this, this.cameras.main.centerX, this.cameras.main.centerY);

    const earnedNow = !hasSticker(gameId);
    if (earnedNow) {
      earnSticker(gameId);
      this.audioManager.playSticker();
      this.createStickerAnimation(this.stickerKeyFor(gameId));
    }

    this.time.delayedCall(this.AUTO_RETURN_DELAY, () => {
      transitionToScene(this, "Hub", earnedNow ? { justEarned: gameId } : undefined);
    });
  }

  /** Shows a sticker unlock animation at the center of the screen. */
  protected createStickerAnimation(stickerKey: string): void {
    const stickerImage = this.add
      .image(this.cameras.main.centerX, this.cameras.main.centerY, stickerKey)
      .setScale(0);

    this.tweens.add({
      targets: stickerImage,
      scaleX: displayScale(stickerKey, this.STICKER_DISPLAY_SIZE),
      scaleY: displayScale(stickerKey, this.STICKER_DISPLAY_SIZE),
      duration: motionDuration(this.WIN_TWEEN_DURATION, 180),
      delay: motionDuration(400, 250),
      ease: "Back.out",
    });
  }

  /**
   * Registers the shutdown handler that destroys the parent lock, mascot,
   * and speaker. Call from `create()` after creating those instances.
   */
  protected registerShutdownCleanup(): void {
    this.events.on("shutdown", () => {
      this.parentLock?.destroy();
      this.mascot?.destroy();
      this.mascot = undefined;
      this.speaker?.destroy();
      this.speaker = undefined;
      this.instructionSpeaker?.destroy();
      this.instructionSpeaker = undefined;
    });
  }

  /** Returns the sticker texture key for a game id (e.g. `more-less` → `sticker_more_less`). */
  protected stickerKeyFor(gameId: GameId): string {
    return `sticker_${gameId.replaceAll("-", "_")}`;
  }
}
